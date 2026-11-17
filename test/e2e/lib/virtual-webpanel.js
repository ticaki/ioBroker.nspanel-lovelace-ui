'use strict';

const WebSocket = require('ws');
const { PayloadLog } = require('./payload-log');

/**
 * A virtual web panel: the WebSocket client the browser frontend (src-web) is, reduced to the protocol of
 * doc/web-panel/ARCHITECTURE.md section 2.6:
 *
 * - after `hello`: `recv event,startup,<hmi>,<model>,<tftVersion>`
 * - every `cmd` frame is recorded and acknowledged with `ack {seq}`
 * - a `pageType~…` additionally with `recv event,renderCurrentPage,<card>`
 * - `pageType~pageStartup` is answered with the startup event again
 */
class VirtualWebPanel extends PayloadLog {
    /**
     * @param {object} opt options
     * @param {number} opt.port port of the web panel server
     * @param {string} opt.topicOrId topic or id of the web panel
     */
    constructor(opt) {
        super(`webpanel ${opt.topicOrId}`);
        this.opt = opt;
        /** @type {WebSocket | undefined} */
        this.ws = undefined;
        /** @type {object | undefined} the hello frame */
        this.hello = undefined;
        /** @type {object[]} all frames from the server */
        this.frames = [];
        /** @type {number[]} seq numbers acknowledged */
        this.acked = [];
        /** acknowledge cmd frames (switch off to test the offline handling) */
        this.autoAck = true;
        this.autoStartup = true;
        this.currentCard = '';
    }

    /**
     * Connects and waits for the hello frame.
     *
     * @param {number} [timeout] ms
     * @returns {Promise<object>} the hello frame
     */
    connect(timeout = 10_000) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://127.0.0.1:${this.opt.port}/ws/${encodeURIComponent(this.opt.topicOrId)}`);
            this.ws = ws;
            const timer = setTimeout(() => reject(new Error(`${this.name}: no hello within ${timeout} ms`)), timeout);
            ws.on('message', data => {
                let frame;
                try {
                    frame = JSON.parse(data.toString());
                } catch {
                    return;
                }
                this.frames.push(frame);
                this.onFrame(frame);
                if (frame.t === 'hello') {
                    clearTimeout(timer);
                    resolve(frame);
                }
            });
            ws.on('error', err => {
                clearTimeout(timer);
                reject(err);
            });
            ws.on('unexpected-response', (_req, res) => {
                clearTimeout(timer);
                reject(new Error(`${this.name}: upgrade refused with HTTP ${res.statusCode}`));
            });
        });
    }

    async close() {
        const ws = this.ws;
        this.ws = undefined;
        if (!ws || ws.readyState === WebSocket.CLOSED) {
            return;
        }
        await new Promise(resolve => {
            ws.once('close', resolve);
            ws.close();
            setTimeout(() => {
                ws.terminate();
                resolve();
            }, 2000).unref();
        });
    }

    /**
     * @param {object} frame client frame
     */
    sendFrame(frame) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error(`${this.name}: not connected`);
        }
        this.ws.send(JSON.stringify(frame));
    }

    /**
     * Event of the display (`recv`).
     *
     * @param {string} event e.g. `event,buttonPress2,bSubNext,button`
     */
    async send(event) {
        this.sendFrame({ t: 'recv', p: event });
    }

    sendStartup() {
        const h = this.hello ?? { model: 'eu', tftVersion: '1.0.0' };
        this.sendFrame({ t: 'recv', p: `event,startup,55,${h.model},${h.tftVersion}` });
    }

    /**
     * @param {any} frame server frame
     */
    onFrame(frame) {
        switch (frame.t) {
            case 'hello':
                this.hello = frame;
                if (this.autoStartup) {
                    this.sendStartup();
                }
                break;
            case 'cmd': {
                this.record(frame.p);
                if (!this.autoAck) {
                    break;
                }
                this.sendFrame({ t: 'ack', seq: frame.seq });
                this.acked.push(frame.seq);
                if (typeof frame.p === 'string' && frame.p.startsWith('pageType~')) {
                    const card = frame.p.split('~')[1];
                    this.currentCard = card;
                    if (card === 'pageStartup') {
                        if (this.autoStartup) {
                            this.sendStartup();
                        }
                    } else {
                        this.sendFrame({ t: 'recv', p: `event,renderCurrentPage,${card}` });
                    }
                }
                break;
            }
            default:
                break;
        }
    }
}

module.exports = { VirtualWebPanel };
