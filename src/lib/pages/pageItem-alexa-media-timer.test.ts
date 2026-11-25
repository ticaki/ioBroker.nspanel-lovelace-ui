import { expect } from 'chai';
import { PageItem } from './pageItem';
import { AlexaTimerRegistry, type AlexaStateLike } from '../classes/alexa-timer';

const KITCHEN = 'alexa2.0.Echo-Devices.G000AAA';
const LIVING = 'alexa2.0.Echo-Devices.G000BBB';

type Write = { id: string; val: unknown };

interface MediaTimerFixture {
    item: any;
    parent: { card: string; currentItem: { ident: string } | undefined; items: { ident: string }[] };
    registry: AlexaTimerRegistry;
    writes: Write[];
}

/**
 * PageItem without constructor - only the fields the Alexa timer of a media page touches.
 *
 * @param current ident of the currently selected Echo device
 * @param followMedia the item follows the device of the media page (toolbar item of cardMedia)
 * @returns the item, its media page mock, the registry and the writes to alexa2
 */
function makeItem(current: string | undefined, followMedia = true): MediaTimerFixture {
    const noop = (): void => undefined;
    const writes: Write[] = [];
    const now = Date.now();
    const states: Record<string, AlexaStateLike> = {};
    for (const [device, id] of [
        [KITCHEN, 'k1'],
        [LIVING, 'l1'],
    ]) {
        states[`${device}.Timer.activeTimerList`] = {
            val: JSON.stringify([{ id, triggerTime: now + 60_000, label: null, durationMillis: 60_000 }]),
        };
        states[`${device}.Timer.nextTimerId`] = { val: id };
        states[`${device}.Timer.triggered`] = { val: false };
    }
    const registry = new AlexaTimerRegistry({
        log: { debug: noop, warn: noop },
        language: () => 'de',
        subscribePattern: async () => Promise.resolve(),
        unsubscribePattern: async () => Promise.resolve(),
        getForeignStates: async (pattern: string) =>
            Promise.resolve(
                Object.fromEntries(Object.entries(states).filter(([id]) => id.startsWith(pattern.replace('*', '')))),
            ),
        setForeignState: async (id, val) => void writes.push({ id, val }),
        setTimeout: () => undefined,
        clearTimeout: () => undefined,
        now: () => Date.now(),
    });
    const parent = {
        card: 'cardMedia',
        currentItem: current ? { ident: current } : undefined,
        items: [{ ident: KITCHEN }],
        setTimerTick: noop,
    };
    const item: any = Object.create(PageItem.prototype);
    Object.assign(item, {
        id: 'test',
        name: 'test',
        log: { debug: noop, warn: noop, error: noop, info: noop, silly: noop },
        adapter: { controller: { alexaTimers: registry } },
        parent,
        dataItems: {
            type: 'timer',
            role: 'timer',
            alexaTimer: { instance: 'alexa2.0', serial: 'G000AAA', followMedia },
            data: {},
        },
        tempData: { role: 'alexa-timer', editSeconds: 0 },
        // a class field, not set without the constructor
        onClockTimerChange: (): void => undefined,
    });
    return { item, parent, registry, writes };
}

describe('lib/pages/pageItem - Alexa timer of a media page', () => {
    it('uses the timer of the current Echo device', async () => {
        const f = makeItem(LIVING);
        await f.item.getAlexaTimerAccess();
        expect(f.item.alexaTimer.deviceId).to.equal(LIVING);
    });

    it('without a current device the first item is used', async () => {
        const f = makeItem(undefined);
        await f.item.getAlexaTimerAccess();
        expect(f.item.alexaTimer.deviceId).to.equal(KITCHEN);
    });

    it('after switching the Echo device the timer of the new device is used, the listener moves', async () => {
        const f = makeItem(KITCHEN);
        await f.item.getAlexaTimerAccess();
        const kitchen = f.registry.get({ instance: 'alexa2.0', serial: 'G000AAA' });
        const living = f.registry.get({ instance: 'alexa2.0', serial: 'G000BBB' });
        expect(f.item.alexaTimer).to.equal(kitchen);
        expect((kitchen as any).listeners.has(f.item.onClockTimerChange)).to.equal(true);

        f.parent.currentItem = { ident: LIVING };
        await f.item.getAlexaTimerAccess();
        expect(f.item.alexaTimer).to.equal(living);
        expect((kitchen as any).listeners.has(f.item.onClockTimerChange)).to.equal(false);
        expect((living as any).listeners.has(f.item.onClockTimerChange)).to.equal(true);
    });

    it('stop goes to the current Echo device, also when the popup was drawn before the switch', async () => {
        const f = makeItem(KITCHEN);
        await f.item.getAlexaTimerAccess();
        f.parent.currentItem = { ident: LIVING };
        await f.item.onCommand('timer-clear', '');
        expect(f.writes).to.deep.equal([{ id: `${LIVING}.Timer.stopTimerId`, val: 'l1' }]);
    });

    it('a normal Alexa timer item keeps its device', async () => {
        const f = makeItem(LIVING, false);
        await f.item.getAlexaTimerAccess();
        expect(f.item.alexaTimer.deviceId).to.equal(KITCHEN);
        await f.item.onCommand('timer-clear', '');
        expect(f.writes).to.deep.equal([{ id: `${KITCHEN}.Timer.stopTimerId`, val: 'k1' }]);
    });
});
