'use strict';

/**
 * Snapshots of the E2E steps (pattern of src/lib/classes/config-manager-pageitems.test.ts).
 *
 * A scenario defines its tests with `step(title, fn)` instead of `it()`. After the test body both panels settle and
 * the step stores per panel the LAST payload of every message type that arrived during the step (not the sequence:
 * throttling and bundling of the adapter make count and order of the payloads vary), plus the values of the test
 * states. The result is compared with `test/e2e/__snapshots__/e2e.snap.json`.
 *
 * - `UPDATE_SNAPSHOTS=1 npm run test:e2e` records the file again; a step without entry fails with a hint.
 * - Volatile content is normalized: `time~` and `date~` are left out (also whether one arrived depends on the
 *   clock), the brightness of `dimmode~` (day / night) becomes `<dim>`. Icon glyphs are written as `{U+XXXX}`, so a
 *   diff of the file is readable.
 * - The name of a snapshot is the title path below the suite `E2E`, so a step run alone (`--grep`) compares with
 *   the same entry. The test "has no stale entries" only checks a full run.
 */
const fs = require('node:fs');
const path = require('node:path');
const { expect } = require('chai');

const SNAPSHOT_FILE = path.join(__dirname, '..', '__snapshots__', 'e2e.snap.json');
const UPDATE = process.env.UPDATE_SNAPSHOTS === '1' || process.env.UPDATE_SNAPSHOTS === 'true';

/** @type {Record<string, unknown>} */
const stored = fs.existsSync(SNAPSHOT_FILE) ? JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8')) : {};
/** @type {Record<string, unknown>} */
const recorded = {};
/** names of the steps that ran in this process */
const executed = new Set();
/** number of steps defined - more than executed means a partial run (`--grep`) */
let registered = 0;
/** @type {import('./context').E2EContext | undefined} */
let context;

/** quiet time at the end of a step before the end state is taken */
const QUIET_MS = 1200;

/** message types that are not part of a snapshot (content and arrival depend on the clock) */
const SKIPPED = new Set(['time', 'date']);

/**
 * @param {import('./context').E2EContext} ctx the context of the suite
 */
function init(ctx) {
    context = ctx;
}

/**
 * @param {string} payload CustomSend payload
 * @returns {string} payload with normalized volatile fields and readable glyphs
 */
function normalizePayload(payload) {
    let p = payload;
    if (p.startsWith('dimmode~')) {
        const f = p.split('~');
        f[1] = '<dim>';
        f[2] = '<dim>';
        p = f.join('~');
    }
    return p.replace(
        /[\u{E000}-\u{F8FF}\u{F900}-\u{FFFF}\u{F0000}-\u{FFFFF}]/gu,
        c => `{U+${c.codePointAt(0).toString(16).toUpperCase()}}`,
    );
}

/**
 * Last payload per message type since `since`.
 *
 * @param {import('./payload-log').PayloadLog} panel virtual panel
 * @param {number} since mark at the start of the step
 * @returns {Record<string, string>} message type → normalized payload, keys sorted
 */
function endState(panel, since) {
    /** @type {Record<string, string>} */
    const last = {};
    for (const p of panel.payloads(since)) {
        const cmd = p.split('~', 1)[0];
        if (!SKIPPED.has(cmd)) {
            last[cmd] = normalizePayload(p);
        }
    }
    return sortKeys(last);
}

/**
 * @template T
 * @param {Record<string, T>} obj object
 * @returns {Record<string, T>} the same object with sorted keys
 */
function sortKeys(obj) {
    /** @type {Record<string, T>} */
    const out = {};
    for (const key of Object.keys(obj).sort()) {
        out[key] = obj[key];
    }
    return out;
}

/**
 * @param {Mocha.Runnable} test the running test
 * @returns {string} title path below the suite `E2E`
 */
function nameOf(test) {
    const titles = test.titlePath();
    const start = titles.indexOf('E2E');
    return titles.slice(start + 1).join(' › ');
}

/**
 * A test step with snapshot: runs `fn`, waits until both panels are quiet and compares the end state.
 *
 * @param {string} title title of the test
 * @param {(this: Mocha.Context) => Promise<void> | void} fn test body
 * @param {{ fromStart?: boolean }} [opt] `fromStart`: the end state of everything since the panels connected (for the
 *   steps that check the startup the suite setup did)
 * @returns {Mocha.Test} the test
 */
function step(title, fn, opt = {}) {
    registered++;
    return it(title, async function () {
        const ctx = context;
        if (!ctx) {
            throw new Error('snapshot.init(ctx) was not called');
        }
        const name = nameOf(this.test);
        executed.add(name);
        // what is still on the way from a hook belongs to no step
        await Promise.all([ctx.nspanel.settle(600), ctx.web.settle(600)]);
        const marks = opt.fromStart ? { nspanel: 0, web: 0 } : { nspanel: ctx.nspanel.mark(), web: ctx.web.mark() };
        await fn.call(this);
        // longer than the pause between two screensaver updates (Screensaver.minUpdateInterval, 1 s)
        await Promise.all([ctx.nspanel.settle(QUIET_MS), ctx.web.settle(QUIET_MS)]);
        /** @type {Record<string, unknown>} */
        const states = {};
        for (const id of Object.keys(ctx.config.STATES).sort()) {
            const st = await ctx.getState(id);
            states[id] = st ? st.val : null;
        }
        const actual = {
            nspanel: endState(ctx.nspanel, marks.nspanel),
            web: endState(ctx.web, marks.web),
            states,
        };
        if (UPDATE) {
            recorded[name] = actual;
            return;
        }
        if (!(name in stored)) {
            throw new Error(`No snapshot for '${name}' - run the tests with UPDATE_SNAPSHOTS=1 to record it.`);
        }
        expect(actual, `snapshot '${name}'`).to.deep.equal(stored[name]);
    });
}

/** Writes the snapshot file in update mode. A partial run keeps the entries of the steps that did not run. */
function save() {
    if (!UPDATE) {
        return;
    }
    const full = executed.size >= registered;
    const merged = full ? { ...recorded } : { ...stored, ...recorded };
    fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
    fs.writeFileSync(SNAPSHOT_FILE, `${JSON.stringify(sortKeys(merged), null, 2)}\n`);
    console.log(`E2E: ${Object.keys(recorded).length} snapshot(s) written to ${SNAPSHOT_FILE}`);
}

/** Defines the test that finds entries of the snapshot file without a step - only in a full run. */
function staleCheck() {
    describe('Snapshot', () => {
        it('has no stale entries', function () {
            if (UPDATE || executed.size < registered) {
                this.skip();
            }
            const stale = Object.keys(stored).filter(k => !executed.has(k));
            expect(stale, 'snapshot entries without step').to.deep.equal([]);
        });
    });
}

module.exports = { init, step, save, staleCheck, normalizePayload, SNAPSHOT_FILE };
