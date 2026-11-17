'use strict';

const { PayloadValidator } = require('./payload-validator');

/**
 * Records everything the adapter sends to a virtual panel (CustomSend payloads) and lets a test wait for a
 * payload that matches a predicate. Every entry gets an index, `mark()` returns the index of the next entry,
 * so a test can wait only for payloads that arrive after its action.
 */
class PayloadLog {
    constructor(name) {
        this.name = name;
        /** @type {{ index: number, payload: string, ts: number }[]} */
        this.entries = [];
        /** @type {Set<() => void>} */
        this.listeners = new Set();
        /** structure check of every recorded payload (payload-validator.js) */
        this.validator = new PayloadValidator();
    }

    /**
     * @param {string} payload CustomSend payload
     */
    record(payload) {
        const index = this.entries.length;
        this.entries.push({ index, payload, ts: Date.now() });
        this.validator.check(payload, index);
        for (const fn of [...this.listeners]) {
            fn();
        }
    }

    /** @returns {number} index of the next payload - pass it as `since` to only look at newer payloads */
    mark() {
        return this.entries.length;
    }

    /**
     * @param {number} [since] first index to return
     * @returns {string[]} payloads since `since`
     */
    payloads(since = 0) {
        return this.entries.slice(since).map(e => e.payload);
    }

    /**
     * Last payload that matches.
     *
     * @param {(p: string) => boolean} predicate test
     * @param {number} [since] first index to search
     * @returns {string | undefined} the payload
     */
    findLast(predicate, since = 0) {
        for (let i = this.entries.length - 1; i >= since; i--) {
            if (predicate(this.entries[i].payload)) {
                return this.entries[i].payload;
            }
        }
        return undefined;
    }

    /**
     * Waits for the first payload (at or after `since`) that matches.
     *
     * @param {((p: string) => boolean) | string | RegExp} predicate function, prefix or regexp
     * @param {{ since?: number, timeout?: number, what?: string }} [opt] options
     * @returns {Promise<string>} the payload
     */
    waitFor(predicate, opt = {}) {
        const test = toPredicate(predicate);
        const since = opt.since ?? 0;
        const timeout = opt.timeout ?? 10_000;
        return new Promise((resolve, reject) => {
            let pos = since;
            const check = () => {
                for (; pos < this.entries.length; pos++) {
                    if (test(this.entries[pos].payload)) {
                        const hit = this.entries[pos];
                        pos++;
                        return hit;
                    }
                }
                return undefined;
            };
            const done = check();
            if (done) {
                resolve(done.payload);
                return;
            }
            const listener = () => {
                const hit = check();
                if (hit) {
                    cleanup();
                    resolve(hit.payload);
                }
            };
            const timer = setTimeout(() => {
                cleanup();
                const recent = this.payloads(since)
                    .slice(-15)
                    .map(p => `    ${p.length > 200 ? `${p.slice(0, 200)}…` : p}`)
                    .join('\n');
                reject(
                    new Error(
                        `${this.name}: no payload matching ${opt.what ?? String(predicate)} within ${timeout} ms. ` +
                            `Payloads since mark ${since}:\n${recent || '    (none)'}`,
                    ),
                );
            }, timeout);
            const cleanup = () => {
                clearTimeout(timer);
                this.listeners.delete(listener);
            };
            this.listeners.add(listener);
        });
    }

    /**
     * Waits until no payload arrived for `quietMs` (the send queue of the adapter is empty).
     *
     * @param {number} [quietMs] quiet time
     * @param {number} [timeout] give up after
     */
    async settle(quietMs = 600, timeout = 15_000) {
        const start = Date.now();
        for (;;) {
            const last = this.entries.length ? this.entries[this.entries.length - 1].ts : 0;
            const quiet = Date.now() - last;
            if (quiet >= quietMs) {
                return;
            }
            if (Date.now() - start > timeout) {
                return;
            }
            await new Promise(r => setTimeout(r, Math.min(100, quietMs - quiet + 5)));
        }
    }
}

/**
 * @param {((p: string) => boolean) | string | RegExp} predicate function, prefix or regexp
 * @returns {(p: string) => boolean} the function
 */
function toPredicate(predicate) {
    if (typeof predicate === 'function') {
        return predicate;
    }
    if (predicate instanceof RegExp) {
        return p => predicate.test(p);
    }
    return p => p.startsWith(predicate);
}

module.exports = { PayloadLog };
