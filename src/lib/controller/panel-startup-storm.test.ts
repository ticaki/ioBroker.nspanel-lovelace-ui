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
    const panel = Object.create(Panel.prototype) as Panel;
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
