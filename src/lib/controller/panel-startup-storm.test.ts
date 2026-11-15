/**
 * Adapter start: every panel must get exactly one startup.
 * - offline, the display acks (`ack`, `renderCurrentPage`) of the offered `pageType~pageStartup` go to the send
 *   queue and must not restart the loop (that offered the startup page again at once - ping-pong)
 * - before initDone the loop offers no startup page; a startup event that arrives meanwhile is remembered
 *   (only the latest) and handled exactly once by markInitDone
 * - after initDone without a startup the loop offers the startup page as before
 */
import { expect } from 'chai';
import { Panel } from './panel';
import type * as Types from '../types/types';

const noop = (): void => undefined;

/**
 * Type guard for the bare panel of the fixtures.
 *
 * @param value the value to check
 * @returns true if it is a Panel
 */
function isPanel(value: unknown): value is Panel {
    return value instanceof Panel;
}

/**
 * A Panel without its constructor - the fixtures set the fields and stubs they need.
 *
 * @returns the bare panel
 */
function barePanel(): Panel {
    const created: unknown = Object.create(Panel.prototype);
    if (!isPanel(created)) {
        throw new Error('Object.create did not return a Panel');
    }
    return created;
}

type Fixture = {
    panel: Panel;
    sent: string[];
    acks: Array<[string, number]>;
    startups: string[];
    restarts: () => number;
    debug: string[];
};

function setup(
    opts: { kind?: 'web' | 'nspanel'; initDone?: boolean; online?: boolean; clone?: boolean } = {},
): Fixture {
    const sent: string[] = [];
    const acks: Array<[string, number]> = [];
    const startups: string[] = [];
    const debug: string[] = [];
    let restarts = 0;
    const panel = barePanel();
    Object.assign(panel, {
        name: 'p1',
        topic: 'nspanel/p1',
        options: opts.clone ? { kind: 'web', sourceTopic: 'nspanel/p0' } : { kind: opts.kind ?? 'nspanel' },
        _initDone: opts.initDone ?? false,
        pendingStartup: null,
        _isOnline: opts.online ?? false,
        flashing: false,
        pages: [],
        screenSaver: {},
        startupInProgress: null,
        startupRepeat: null,
        info: { tasmota: { safeboot: false }, nspanel: { berryDriverVersion: 0 } },
        channel: { hasReceiver: (): boolean => true },
        panelSend: {
            displayAck: false,
            resetMessageDB: noop,
            onDisplayAck: (kind: string, crc: number): void => void acks.push([kind, crc]),
            onMessage: async (): Promise<void> => Promise.resolve(),
        },
        log: {
            silly: noop,
            debug: (m: string): void => void debug.push(m),
            info: noop,
            warn: noop,
            error: noop,
        },
        adapter: { unload: false, config: { debugLogMqtt: false }, setTimeout: noop, clearTimeout: noop },
        checkDisplayNotAnswering: noop,
        sendToPanel: (payload: string): void => void sent.push(payload),
        restartLoops: (): void => {
            restarts++;
        },
        handleStartup: async (event: Types.IncomingEvent): Promise<void> => {
            startups.push(event.opt);
            return Promise.resolve();
        },
    });
    return { panel, sent, acks, startups, restarts: () => restarts, debug };
}

const event = (method: Types.IncomingEvent['method'], opt = '', id = ''): Types.IncomingEvent => ({
    type: 'event',
    method,
    page: 0,
    id,
    action: 'eu',
    opt,
});

const tick = async (): Promise<void> => new Promise(resolve => setTimeout(resolve, 5));

describe('lib/controller/panel - one startup per adapter start', () => {
    describe('display acks while offline', () => {
        it('an ack does not restart the loop and reaches the send queue', async () => {
            const f = setup({ initDone: true });
            await f.panel.HandleIncomingMessage(event('ack', '', '12345'));
            expect(f.restarts()).to.equal(0);
            expect(f.sent).to.deep.equal([]);
            expect(f.acks).to.deep.equal([['ack', 12_345]]);
        });

        it('a renderCurrentPage with crc does not restart the loop and reaches the send queue', async () => {
            const f = setup({ initDone: true });
            await f.panel.HandleIncomingMessage(event('renderCurrentPage', '', '4711'));
            expect(f.restarts()).to.equal(0);
            expect(f.acks).to.deep.equal([['renderCurrentPage', 4711]]);
        });

        it('any other event while offline still restarts the loop', async () => {
            const f = setup({ initDone: true });
            await f.panel.HandleIncomingMessage(event('buttonPress2', '', 'x'));
            expect(f.restarts()).to.equal(1);
        });
    });

    describe('before initDone', () => {
        it('the loop offers no startup page', () => {
            const f = setup();
            f.panel.loop();
            expect(f.sent).to.deep.equal([]);
        });

        it('a startup is remembered and handled exactly once after initDone', async () => {
            const f = setup();
            await f.panel.HandleIncomingMessage(event('startup', '6.1.0'));
            expect(f.startups).to.deep.equal([]);
            f.panel.markInitDone();
            await tick();
            expect(f.startups).to.deep.equal(['6.1.0']);
            expect(f.panel.initDone).to.equal(true);
            // a second call does nothing
            f.panel.markInitDone();
            await tick();
            expect(f.startups).to.deep.equal(['6.1.0']);
        });

        it('several startups collapse into one with the latest event', async () => {
            const f = setup();
            await f.panel.HandleIncomingMessage(event('startup', '1'));
            await f.panel.HandleIncomingMessage(event('startup', '2'));
            await f.panel.HandleIncomingMessage(event('startup', '3'));
            f.panel.markInitDone();
            await tick();
            expect(f.startups).to.deep.equal(['3']);
            expect(f.restarts()).to.equal(0);
        });

        it('without a startup markInitDone restarts the loop, which offers the startup page', () => {
            const f = setup();
            f.panel.markInitDone();
            expect(f.restarts()).to.equal(1);
            expect(f.startups).to.deep.equal([]);
            f.panel.loop();
            expect(f.sent).to.deep.equal(['pageType~pageStartup']);
        });
    });

    describe('after initDone', () => {
        it('the loop offers the startup page as before', () => {
            const f = setup({ initDone: true });
            f.panel.loop();
            expect(f.sent).to.deep.equal(['pageType~pageStartup']);
        });

        it('a startup is handled directly', async () => {
            const f = setup({ initDone: true });
            await f.panel.HandleIncomingMessage(event('startup', '6.1.0'));
            expect(f.startups).to.deep.equal(['6.1.0']);
        });
    });

    describe('web panel and web clone', () => {
        for (const variant of ['web', 'clone'] as const) {
            it(`${variant}: a startup before initDone runs once through the web queue after initDone`, async () => {
                const f = setup(variant === 'web' ? { kind: 'web' } : { clone: true });
                expect(f.panel.isVirtual).to.equal(true);
                expect(f.panel.isClone).to.equal(variant === 'clone');
                await f.panel.HandleIncomingMessage(event('startup', 'a'));
                await f.panel.HandleIncomingMessage(event('startup', 'b'));
                f.panel.markInitDone();
                await tick();
                expect(f.startups).to.deep.equal(['b']);
            });

            it(`${variant}: after initDone startups still run one after the other`, async () => {
                const f = setup(variant === 'web' ? { kind: 'web', initDone: true } : { clone: true, initDone: true });
                await f.panel.HandleIncomingMessage(event('startup', '1'));
                await f.panel.HandleIncomingMessage(event('startup', '2'));
                expect(f.startups).to.deep.equal(['1', '2']);
            });
        }
    });

    it('logs a received message only with debugLogMqtt', async () => {
        const f = setup({ initDone: true, online: true });
        await f.panel.HandleIncomingMessage(event('ack', '', '1'));
        expect(f.debug.filter(m => m.startsWith('Receive message:'))).to.deep.equal([]);
    });
});

/**
 * A slow startup (many panels start at once) must not run twice: a hardware panel drops a startup event
 * while one runs and for 10 s after its end. The real handleStartup runs; it ends at the missing start page.
 */
describe('lib/controller/panel - a slow startup runs once', () => {
    type Run = {
        panel: Panel;
        /** startups that got past the gate */
        runs: () => number;
        /** lets every held writeInfo go on */
        release: () => void;
        /** fires the armed block timers like after 10 s */
        elapse: () => void;
        armed: () => number;
        removed: string[];
        unloadOnRemove: () => void;
    };

    function setupRun(
        opts: { kind?: 'web' | 'nspanel'; initDone?: boolean; hold?: boolean; fail?: boolean } = {},
    ): Run {
        let runs = 0;
        let held: Array<() => void> = [];
        let timerId = 0;
        let unloadOnRemove = false;
        const timers = new Map<number, () => void>();
        const removed: string[] = [];
        const panel = barePanel();
        Object.assign(panel, {
            name: 'p1',
            topic: 'nspanel/p1',
            options: { kind: opts.kind ?? 'nspanel' },
            _initDone: opts.initDone ?? true,
            pendingStartup: null,
            _isOnline: true,
            unload: false,
            flashing: false,
            pages: [],
            screenSaver: {},
            blockStartup: null,
            hardwareStartupRunning: false,
            startupInProgress: null,
            startupRepeat: null,
            info: { nspanel: { model: 'eu' }, tasmota: { safeboot: false } },
            panelSend: { displayAck: false },
            log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
            adapter: {
                unload: false,
                config: { debugLogMqtt: false },
                setTimeout: (cb: () => void): number => {
                    timerId++;
                    timers.set(timerId, cb);
                    return timerId;
                },
                clearTimeout: (id: number): void => void timers.delete(id),
                delay: async (): Promise<void> => Promise.resolve(),
            },
            library: { readdb: (): undefined => undefined },
            controller: {
                removePanel: async (): Promise<void> => {
                    removed.push('p1');
                    if (unloadOnRemove) {
                        panel.unload = true;
                    }
                    return Promise.resolve();
                },
            },
            resetDisplayDiagnosis: noop,
            setSafeboot: (): boolean => false,
            setStatus: async (): Promise<void> => Promise.resolve(),
            requestStatusTasmota: noop,
            sendToTasmota: noop,
            sendRules: noop,
            sendDimmode: noop,
            writeInfo: async (): Promise<void> => {
                runs++;
                if (opts.fail) {
                    return Promise.reject(new Error('boom'));
                }
                if (opts.hold) {
                    return new Promise<void>(resolve => void held.push(resolve));
                }
                return Promise.resolve();
            },
            navigation: { resetPosition: noop, getCurrentMainPage: (): undefined => undefined },
        });
        return {
            panel,
            runs: () => runs,
            release: () => {
                const list = held;
                held = [];
                list.forEach(r => r());
            },
            elapse: () => {
                const list = [...timers.values()];
                timers.clear();
                list.forEach(cb => cb());
            },
            armed: () => timers.size,
            removed,
            unloadOnRemove: () => {
                unloadOnRemove = true;
            },
        };
    }

    it('a second startup while the first one runs is dropped, also after its first 10 s', async () => {
        const f = setupRun({ hold: true });
        const first = f.panel.HandleIncomingMessage(event('startup', '1'));
        await tick();
        expect(f.runs()).to.equal(1);
        // the start takes longer than 10 s
        f.elapse();
        await f.panel.HandleIncomingMessage(event('startup', '2'));
        expect(f.runs()).to.equal(1);
        f.release();
        await first;
        expect(f.runs()).to.equal(1);
    });

    it('after the end the block lasts 10 s, then a new startup runs', async () => {
        const f = setupRun({ hold: true });
        const first = f.panel.HandleIncomingMessage(event('startup', '1'));
        await tick();
        f.elapse();
        f.release();
        await first;
        // armed again at the end
        expect(f.armed()).to.equal(1);
        await f.panel.HandleIncomingMessage(event('startup', '2'));
        expect(f.runs()).to.equal(1);
        f.elapse();
        const third = f.panel.HandleIncomingMessage(event('startup', '3'));
        await tick();
        expect(f.runs()).to.equal(2);
        f.release();
        await third;
    });

    it('a model mismatch ends the startup and clears the running flag', async () => {
        const f = setupRun();
        await f.panel.HandleIncomingMessage({ ...event('startup', '1'), action: 'us-p' });
        expect(f.removed).to.deep.equal(['p1']);
        expect(f.runs()).to.equal(0);
        expect(f.panel['hardwareStartupRunning']).to.equal(false);
        f.elapse();
        await f.panel.HandleIncomingMessage(event('startup', '2'));
        expect(f.runs()).to.equal(1);
    });

    it('a model mismatch that unloads the panel leaves no block timer behind', async () => {
        const f = setupRun();
        f.unloadOnRemove();
        await f.panel.HandleIncomingMessage({ ...event('startup', '1'), action: 'us-p' });
        expect(f.removed).to.deep.equal(['p1']);
        expect(f.panel['hardwareStartupRunning']).to.equal(false);
        // only the block armed at the begin, nothing armed again at the end
        expect(f.armed()).to.equal(1);
        f.elapse();
        expect(f.panel['blockStartup']).to.equal(null);
    });

    it('an error in the startup clears the running flag and blocks for 10 s', async () => {
        const f = setupRun({ fail: true });
        let failed = false;
        await f.panel.HandleIncomingMessage(event('startup', '1')).catch(() => {
            failed = true;
        });
        expect(failed).to.equal(true);
        expect(f.panel['hardwareStartupRunning']).to.equal(false);
        expect(f.armed()).to.equal(1);
    });

    it('a startup remembered before initDone counts as running startup', async () => {
        const f = setupRun({ initDone: false, hold: true });
        await f.panel.HandleIncomingMessage(event('startup', '1'));
        expect(f.runs()).to.equal(0);
        f.panel.markInitDone();
        await tick();
        expect(f.runs()).to.equal(1);
        f.elapse();
        await f.panel.HandleIncomingMessage(event('startup', '2'));
        expect(f.runs()).to.equal(1);
        f.release();
        await tick();
        expect(f.panel['hardwareStartupRunning']).to.equal(false);
    });

    it('web panel: a startup while one runs is done once more afterwards, no 10 s block', async () => {
        const f = setupRun({ kind: 'web', hold: true });
        const first = f.panel.HandleIncomingMessage(event('startup', '1'));
        await tick();
        const second = f.panel.HandleIncomingMessage(event('startup', '2'));
        expect(f.runs()).to.equal(1);
        f.release();
        await tick();
        expect(f.runs()).to.equal(2);
        f.release();
        await Promise.all([first, second]);
        // right after the end, without the block expiring
        const third = f.panel.HandleIncomingMessage(event('startup', '3'));
        await tick();
        expect(f.runs()).to.equal(3);
        f.release();
        await third;
        expect(f.panel['hardwareStartupRunning']).to.equal(false);
    });
});
