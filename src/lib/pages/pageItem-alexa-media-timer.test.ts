import { expect } from 'chai';
import { PageItem, timerIconText } from './pageItem';
import { AlexaTimerRegistry, type AlexaStateLike } from '../classes/alexa-timer';

const KITCHEN = 'alexa2.0.Echo-Devices.G000AAA';
const LIVING = 'alexa2.0.Echo-Devices.G000BBB';
const NOW = new Date(2026, 10, 25, 12).getTime();

type Write = { id: string; val: unknown };
type FakeTimeout = { fn: () => void; ms: number; cleared: boolean };
/** timer of a device: remaining ms of its only timer, undefined = no timer */
type DeviceTimer = { remainingMs?: number; triggered?: boolean };

interface MediaTimerFixture {
    item: any;
    parent: {
        card: string;
        currentItem: { ident: string } | undefined;
        items: { ident: string }[];
        sleep: boolean;
        visible: boolean;
        ticking: Set<unknown>;
        redraws: number;
    };
    registry: AlexaTimerRegistry;
    writes: Write[];
    timeouts: FakeTimeout[];
    /** the redraw of the remaining time waiting now */
    pending: () => FakeTimeout | undefined;
}

/**
 * PageItem without constructor - only the fields the Alexa timer of a media page touches.
 *
 * @param current ident of the currently selected Echo device
 * @param followMedia the item follows the device of the media page (toolbar item of cardMedia)
 * @param devices timers of KITCHEN and LIVING
 * @param useValue value instead of icon - always set for the toolbar item of a media page
 * @returns the item, its media page mock, the registry, the writes to alexa2 and the adapter timeouts
 */
function makeItem(
    current: string | undefined,
    followMedia = true,
    devices: Record<string, DeviceTimer> = {
        [KITCHEN]: { remainingMs: 60_000 },
        [LIVING]: { remainingMs: 60_000 },
    },
    useValue = followMedia,
): MediaTimerFixture {
    const noop = (): void => undefined;
    const writes: Write[] = [];
    const timeouts: FakeTimeout[] = [];
    const states: Record<string, AlexaStateLike> = {};
    for (const [device, id] of [
        [KITCHEN, 'k1'],
        [LIVING, 'l1'],
    ]) {
        const timer = devices[device] ?? {};
        const list =
            timer.remainingMs === undefined
                ? []
                : [{ id, triggerTime: NOW + timer.remainingMs, label: null, durationMillis: timer.remainingMs }];
        states[`${device}.Timer.activeTimerList`] = { val: JSON.stringify(list) };
        states[`${device}.Timer.nextTimerId`] = { val: list.length ? id : null };
        states[`${device}.Timer.triggered`] = { val: !!timer.triggered };
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
        sleep: false,
        visible: true,
        ticking: new Set<unknown>(),
        redraws: 0,
        setTimerTick(tickItem: unknown, on: boolean): void {
            if (on) {
                this.ticking.add(tickItem);
            } else {
                this.ticking.delete(tickItem);
            }
        },
        getVisibility(): boolean {
            return this.visible;
        },
        onStateTriggerSuperDoNotOverride: async (): Promise<boolean> => {
            parent.redraws++;
            return Promise.resolve(true);
        },
    };
    const adapter = {
        unload: false,
        controller: { alexaTimers: registry, statesControler: { activateTrigger: async () => Promise.resolve() } },
        setTimeout: (fn: () => void, ms: number): FakeTimeout => {
            const t: FakeTimeout = {
                fn: () => {
                    // a fired timeout is gone like a cleared one
                    t.cleared = true;
                    fn();
                },
                ms,
                cleared: false,
            };
            timeouts.push(t);
            return t;
        },
        clearTimeout: (t: FakeTimeout | undefined): void => {
            if (t) {
                t.cleared = true;
            }
        },
    };
    const item: any = Object.create(PageItem.prototype);
    Object.assign(item, {
        id: 'test',
        name: 'test',
        log: { debug: noop, warn: noop, error: noop, info: noop, silly: noop },
        library: { getTranslation: (k: string): string => k },
        adapter,
        parent,
        config: { type: 'timer', role: 'timer' },
        dataItems: {
            type: 'timer',
            role: 'timer',
            alexaTimer: { instance: 'alexa2.0', serial: 'G000AAA', followMedia },
            useValue,
            data: {},
        },
        tempData: { role: 'alexa-timer', editSeconds: 0 },
        timeouts: {},
        unload: false,
        // a class field, not set without the constructor
        onClockTimerChange: (): void => undefined,
    });
    return {
        item,
        parent,
        registry,
        writes,
        timeouts,
        pending: () => timeouts.filter(t => !t.cleared).pop(),
    };
}

/**
 * @param f fixture
 * @returns icon field of the line of the item
 */
async function icon(f: MediaTimerFixture): Promise<string> {
    return String(await f.item.getPageItemPayload(true)).split('~')[2];
}

describe('lib/pages/pageItem - Alexa timer of a media page', () => {
    let realNow: () => number;
    before(() => {
        realNow = Date.now;
    });
    beforeEach(() => {
        Date.now = (): number => NOW;
    });
    after(() => {
        Date.now = realNow;
    });

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

describe('lib/pages/pageItem - remaining time of the Alexa timer of a media page', () => {
    let realNow: () => number;
    before(() => {
        realNow = Date.now;
    });
    beforeEach(() => {
        Date.now = (): number => NOW;
    });
    after(() => {
        Date.now = realNow;
    });

    it('shows the time of the screensaver timer while a timer runs, the icon otherwise', () => {
        const running = (remainingMs: number): string | undefined => timerIconText({ status: 'running', remainingMs });
        expect(running(1)).to.equal('0.1');
        expect(running(6000)).to.equal('0.1');
        expect(running(6001)).to.equal('0.2');
        expect(running(125.5 * 60_000)).to.equal('125.5');
        expect(running(999.9 * 60_000)).to.equal('999.9');
        expect(running(999.9 * 60_000 + 1)).to.equal('1000');
        expect(running(20_000 * 60_000)).to.equal('9999');
        expect(timerIconText({ status: 'expired', remainingMs: 0 })).to.equal(undefined);
        expect(timerIconText({ status: 'paused', remainingMs: 60_000 })).to.equal(undefined);
        expect(timerIconText({ status: 'off', remainingMs: 0 })).to.equal(undefined);
        expect(timerIconText(undefined)).to.equal(undefined);
    });

    it('the line shows the remaining time in the font of the clock instead of the icon', async () => {
        const f = makeItem(KITCHEN, true, { [KITCHEN]: { remainingMs: 90_000 } });
        expect(await icon(f)).to.equal('1.5¬1');
    });

    it('no timer or a ringing timer keeps the icon', async () => {
        const none = makeItem(KITCHEN, true, {});
        expect(await icon(none)).to.not.contain('¬');
        const ringing = makeItem(KITCHEN, true, { [KITCHEN]: { remainingMs: -1000, triggered: true } });
        expect(await icon(ringing)).to.not.contain('¬');
        expect(ringing.pending()).to.equal(undefined);
    });

    it('the normal Alexa timer item keeps its icon, with useValue (grid) it shows the remaining time', async () => {
        const f = makeItem(KITCHEN, false, { [KITCHEN]: { remainingMs: 90_000 } });
        expect(await icon(f)).to.not.contain('¬');
        const value = makeItem(KITCHEN, false, { [KITCHEN]: { remainingMs: 90_000 } }, true);
        expect(await icon(value)).to.equal('1.5');
        expect(value.pending()?.ms).to.equal(6001);
    });

    it('on the tiles the remaining time takes the text size of the item, the toolbar item that of the clock', async () => {
        const sized = makeItem(KITCHEN, false, { [KITCHEN]: { remainingMs: 90_000 } }, true);
        sized.item.dataItems.data = { icon: { textSize: { getNumber: async (): Promise<number> => 3 } } };
        expect(await icon(sized)).to.equal('1.5¬3');
        const media = makeItem(KITCHEN, true, { [KITCHEN]: { remainingMs: 90_000 } });
        media.item.dataItems.data = { icon: { textSize: { getNumber: async (): Promise<number> => 3 } } };
        expect(await icon(media)).to.equal('1.5¬1');
    });

    it('redraws the page only when the shown time changes, not with the ticker of the page', async () => {
        const f = makeItem(KITCHEN, true, { [KITCHEN]: { remainingMs: 90_000 } });
        await icon(f);
        expect(f.parent.ticking.has(f.item)).to.equal(false);
        // 1.5 turns into 1.4 after 6 s
        expect(f.pending()?.ms).to.equal(6001);
        expect(f.timeouts.filter(t => !t.cleared)).to.have.length(1);
        f.pending()?.fn();
        expect(f.parent.redraws).to.equal(1);
        // a second draw replaces the waiting redraw
        await icon(f);
        expect(f.timeouts.filter(t => !t.cleared)).to.have.length(1);
    });

    it('a hidden or sleeping page is not redrawn', async () => {
        const f = makeItem(KITCHEN, true, { [KITCHEN]: { remainingMs: 90_000 } });
        await icon(f);
        f.parent.visible = false;
        f.pending()?.fn();
        f.parent.visible = true;
        await icon(f);
        f.parent.sleep = true;
        f.pending()?.fn();
        expect(f.parent.redraws).to.equal(0);
    });

    it('an open popup uses the ticker of the page and no redraw of the bar', async () => {
        const f = makeItem(KITCHEN, true, { [KITCHEN]: { remainingMs: 90_000 } });
        await icon(f);
        await f.item.GeneratePopup('popupTimer');
        expect(f.parent.ticking.has(f.item)).to.equal(true);
        expect(f.pending()).to.equal(undefined);
    });

    it('a change of the Echo device drops the redraw of the old device', async () => {
        const f = makeItem(KITCHEN, true, { [KITCHEN]: { remainingMs: 90_000 } });
        await icon(f);
        expect(f.pending()).to.not.equal(undefined);
        f.parent.currentItem = { ident: LIVING };
        expect(await icon(f)).to.not.contain('¬');
        expect(f.pending()).to.equal(undefined);
    });

    it('the redraw is kept with the other timeouts of the item, delete clears them', async () => {
        const f = makeItem(KITCHEN, true, { [KITCHEN]: { remainingMs: 90_000 } });
        await icon(f);
        expect(f.item.timeouts.timerIconText).to.equal(f.pending());
    });
});

describe('lib/pages/pageItem - value instead of icon for the other timer sources', () => {
    let realNow: () => number;
    before(() => {
        realNow = Date.now;
    });
    beforeEach(() => {
        Date.now = (): number => NOW;
    });
    after(() => {
        Date.now = realNow;
    });

    /**
     * @param useValue value instead of icon
     * @param tempData state of the timer
     * @param data data items of the item
     * @returns fixture of an item without Alexa device
     */
    function timerItem(useValue: boolean, tempData: Record<string, unknown>, data: unknown = {}): MediaTimerFixture {
        const f = makeItem(KITCHEN, false, {}, useValue);
        f.item.dataItems = { type: 'timer', role: 'timer', useValue, data };
        f.item.tempData = tempData;
        return f;
    }

    /**
     * @param seconds value of ACTUAL in seconds
     * @param status value of STATUS, undefined = no STATUS
     * @returns data items of a channel timer counted outside
     */
    function exTimerData(seconds: number, status?: number): unknown {
        const value = { common: { unit: 's' }, getNumber: async (): Promise<number> => Promise.resolve(seconds) };
        const setValue2 =
            status === undefined ? undefined : { getNumber: async (): Promise<number> => Promise.resolve(status) };
        return { entity1: { value }, setValue2 };
    }

    it('internal timer: the remaining time while it runs, redrawn when the text changes', async () => {
        const running = { role: 'timer', status: 'run', endTs: NOW + 90_000, value: 90 };
        const f = timerItem(true, running);
        expect(await icon(f)).to.equal('1.5');
        expect(f.pending()?.ms).to.equal(6001);
        expect(f.parent.ticking.has(f.item)).to.equal(false);
        expect(await icon(timerItem(false, { ...running }))).to.equal('');
        const paused = timerItem(true, { role: 'timer', status: 'pause', value: 90 });
        expect(await icon(paused)).to.equal('');
        expect(paused.pending()).to.equal(undefined);
        expect(await icon(timerItem(true, { role: 'timer', status: 'expired', value: 0 }))).to.equal('');
    });

    it('channel timer counted outside: the remaining time while it runs, no own redraw', async () => {
        const f = timerItem(true, { role: 'ex-timer' }, exTimerData(90));
        expect(await icon(f)).to.equal('1.5');
        // every new value of ACTUAL draws the page
        expect(f.pending()).to.equal(undefined);
        expect(await icon(timerItem(true, { role: 'ex-timer' }, exTimerData(90, 2)))).to.equal('1.5');
        expect(await icon(timerItem(true, { role: 'ex-timer' }, exTimerData(90, 1)))).to.equal('');
        expect(await icon(timerItem(true, { role: 'ex-timer' }, exTimerData(0)))).to.equal('');
        expect(await icon(timerItem(false, { role: 'ex-timer' }, exTimerData(90)))).to.equal('');
    });
});
