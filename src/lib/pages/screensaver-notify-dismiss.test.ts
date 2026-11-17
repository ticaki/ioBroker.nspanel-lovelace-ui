import { expect } from 'chai';
import { Screensaver } from './screensaver';

/**
 * A tap on a dismissible notification (Schlagzeile) of the screensaver: when the notification has a global id,
 * `deactivateNotify` reports it to `panels.<name>.screensaverNotify.id` and to the global `screensaverNotify.id`.
 */

type Write = { id: string; val: unknown; ack: unknown; force: unknown };

type Fixture = {
    saver: Screensaver;
    writes: Write[];
    globalDismissed: string[];
};

function setup(globalId: string | null): Fixture {
    const writes: Write[] = [];
    const globalDismissed: string[] = [];
    const saver = Object.create(Screensaver.prototype) as Screensaver;
    const item = {
        config: { role: 'isDismissiblePerEvent', dismissibleIDGlobal: globalId ?? undefined },
        dismissed: false,
        getGlobalDismissibleID: (): string | null => globalId,
        setDismissiblePerEvent(): void {
            this.dismissed = true;
        },
    };
    const noop = (): void => undefined;
    Object.assign(saver, {
        pageItems: [undefined, undefined, undefined, item],
        unload: false,
        name: '#scr',
        id: '0',
        activeNotifyId: '0?3',
        log: { debug: noop, info: noop, warn: noop, error: noop },
        library: {
            writedp: async (id: string, val: unknown, _obj: unknown, ack: unknown, force: unknown): Promise<void> => {
                writes.push({ id, val, ack, force });
                return Promise.resolve();
            },
        },
        adapter: {
            unload: false,
            controller: {
                setGlobalNotificationDismiss: async (id: string): Promise<void> => {
                    globalDismissed.push(id);
                    return Promise.resolve();
                },
            },
        },
        basePanel: { name: 'A0_B7_65_54_C0_70' },
        // nothing is left to show after the tap
        HandleNotification: async (): Promise<void> => Promise.resolve(),
    });
    return { saver, writes, globalDismissed };
}

describe('lib/pages/screensaver - dismissed notification reports its id', () => {
    it('writes the id to the panel and to the global state', async () => {
        const f = setup('door');
        expect(await f.saver.deactivateNotify()).to.equal(true);
        expect(f.globalDismissed).to.deep.equal(['door']);
        expect(f.writes).to.deep.equal([
            { id: 'panels.A0_B7_65_54_C0_70.screensaverNotify.id', val: 'door', ack: true, force: true },
            { id: 'screensaverNotify.id', val: 'door', ack: true, force: true },
        ]);
    });

    it('writes nothing without an id', async () => {
        const f = setup(null);
        expect(await f.saver.deactivateNotify()).to.equal(true);
        expect(f.globalDismissed).to.deep.equal([]);
        expect(f.writes).to.deep.equal([]);
    });

    it('writes the same id again with every dismiss', async () => {
        const f = setup('door');
        await f.saver.deactivateNotify();
        Object.assign(f.saver, { activeNotifyId: '0?3' });
        await f.saver.deactivateNotify();
        expect(f.writes.map(w => w.id)).to.deep.equal([
            'panels.A0_B7_65_54_C0_70.screensaverNotify.id',
            'screensaverNotify.id',
            'panels.A0_B7_65_54_C0_70.screensaverNotify.id',
            'screensaverNotify.id',
        ]);
        expect(f.writes.every(w => w.force === true)).to.equal(true);
    });

    it('writes nothing when no notification is shown', async () => {
        const f = setup('door');
        Object.assign(f.saver, { activeNotifyId: '' });
        expect(await f.saver.deactivateNotify()).to.equal(false);
        expect(f.writes).to.deep.equal([]);
    });
});
