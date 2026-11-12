/**
 * Startup events of a web panel: a browser sends `event,startup` after its hello and again for the
 * `pageType~pageStartup` offer, both almost at once. They must run one after the other, a startup that
 * arrives meanwhile is done once more afterwards (several collapse into one), a later reconnect still
 * gets its own startup. A hardware panel is not queued.
 */
import { expect } from 'chai';
import { Panel } from './panel';
import type * as Types from '../types/types';

const noop = (): void => undefined;

function setup(kind: 'web' | 'mqtt'): { panel: Panel; runs: string[]; maxParallel: () => number } {
    const runs: string[] = [];
    let running = 0;
    let maxParallel = 0;
    const panel = Object.create(Panel.prototype) as Panel;
    Object.assign(panel, {
        name: 'web1',
        options: { kind },
        initDone: true,
        _isOnline: false,
        screenSaver: {},
        panelSend: { displayAck: false },
        startupInProgress: null,
        startupRepeat: null,
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        adapter: { config: { debugLogMqtt: false } },
        handleStartup: async (event: Types.IncomingEvent): Promise<void> => {
            running++;
            maxParallel = Math.max(maxParallel, running);
            runs.push(`start:${event.opt}`);
            await new Promise(resolve => setTimeout(resolve, 10));
            runs.push(`end:${event.opt}`);
            running--;
        },
    });
    return { panel, runs, maxParallel: () => maxParallel };
}

const startup = (opt: string): Types.IncomingEvent => ({
    type: 'event',
    method: 'startup',
    page: 0,
    id: '',
    action: 'eu',
    opt,
});

describe('lib/controller/panel - startup of a web panel', () => {
    it('two startups at once run one after the other', async () => {
        const f = setup('web');
        await Promise.all([f.panel.HandleIncomingMessage(startup('1')), f.panel.HandleIncomingMessage(startup('2'))]);
        expect(f.maxParallel()).to.equal(1);
        expect(f.runs).to.deep.equal(['start:1', 'end:1', 'start:2', 'end:2']);
    });

    it('several startups meanwhile collapse into one repeat with the latest event', async () => {
        const f = setup('web');
        await Promise.all([
            f.panel.HandleIncomingMessage(startup('1')),
            f.panel.HandleIncomingMessage(startup('2')),
            f.panel.HandleIncomingMessage(startup('3')),
        ]);
        expect(f.maxParallel()).to.equal(1);
        expect(f.runs).to.deep.equal(['start:1', 'end:1', 'start:3', 'end:3']);
    });

    it('a later reconnect gets its own startup', async () => {
        const f = setup('web');
        await f.panel.HandleIncomingMessage(startup('1'));
        await f.panel.HandleIncomingMessage(startup('2'));
        expect(f.runs).to.deep.equal(['start:1', 'end:1', 'start:2', 'end:2']);
    });

    it('a failing startup does not block the next one', async () => {
        const f = setup('web');
        const failing = (panel: Panel): void => {
            (panel as any).handleStartup = async (): Promise<void> => Promise.reject(new Error('boom'));
        };
        failing(f.panel);
        let error: unknown;
        await f.panel.HandleIncomingMessage(startup('1')).catch((e: unknown) => (error = e));
        expect(error).to.be.instanceOf(Error);
        let called = false;
        (f.panel as any).handleStartup = async (): Promise<void> => {
            called = true;
            return Promise.resolve();
        };
        await f.panel.HandleIncomingMessage(startup('2'));
        expect(called).to.equal(true);
    });

    it('a hardware panel is not queued (its repeats are dropped by blockStartup)', async () => {
        const f = setup('mqtt');
        await Promise.all([f.panel.HandleIncomingMessage(startup('1')), f.panel.HandleIncomingMessage(startup('2'))]);
        expect(f.maxParallel()).to.equal(2);
    });
});
