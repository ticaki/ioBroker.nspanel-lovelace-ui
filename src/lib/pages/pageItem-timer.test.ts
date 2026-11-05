import { expect } from 'chai';
import { PageItem } from './pageItem';
import { Screensaver } from './screensaver';
import { Page } from '../classes/Page';
import { adminPageItemToScriptItem } from '../configuration/admin-page-item';
import type { PageInterface } from '../classes/PageInterface';
import type * as pages from '../types/pages';
import {
    clockTimerChannels,
    clockTimerItemChoice,
    loadClockTimerChannels,
    assignMissingItemIds,
    newItemId,
    type AdminPageItemConfig,
    isClockTimerComplete,
    isClockTimerSourceItem,
    isCountdownChannel,
    type ScreensaverClockTimer,
    type ScreensaverEntry,
} from '../types/adminShareConfig';
import {
    alarmClockOf,
    nextAlarmTs,
    orderTimerSlotKeys,
    parseTimerInput,
    timerClockText,
    timerPopupButtons,
    timerPopupFields,
    timerSecondsOf,
    timerStartValue,
    timerValueOf,
} from './screensaver-timer';

type Write = { id: string; val: unknown };
type Common = Record<string, unknown>;

function state(id: string, writes: Write[], val: number | null, common: Common = {}, writeable = true): any {
    const dp = {
        options: { dp: id },
        common,
        writeable,
        val,
        getNumber: async (): Promise<number | null> => Promise.resolve(dp.val),
        setState: async (v: unknown): Promise<void> => {
            writes.push({ id, val: v });
            dp.val = typeof v === 'number' ? v : dp.val;
            return Promise.resolve();
        },
        setStateTrue: async (): Promise<void> => void writes.push({ id, val: true }),
    };
    return dp;
}

type Fixture = {
    item: any;
    writes: Write[];
    sent: string[];
    warn: string[];
    timers: { fn: () => unknown; ms: number; cleared: boolean }[];
    parent: any;
    /** popup as fields */
    popup: () => Promise<{
        min: string;
        sec: string;
        editable: string;
        actions: string[];
        texts: string[];
    }>;
    /** text of the list */
    line: () => Promise<string>;
    panel: any;
};

function createFakes(): {
    log: any;
    warn: string[];
    timers: Fixture['timers'];
    sent: string[];
    timerApi: Record<string, (...args: any[]) => unknown>;
} {
    const noop = (): void => undefined;
    const warn: string[] = [];
    const timers: Fixture['timers'] = [];
    const add = (fn: () => unknown, ms: number): unknown => {
        const t = { fn, ms, cleared: false };
        timers.push(t);
        return t;
    };
    const clear = (t: { cleared: boolean } | undefined): void => {
        if (t) {
            t.cleared = true;
        }
    };
    return {
        log: {
            debug: noop,
            info: noop,
            silly: noop,
            error: noop,
            warn: (m: string): void => void warn.push(m),
        },
        warn,
        timers,
        sent: [],
        timerApi: { setTimeout: add, setInterval: add, clearTimeout: clear, clearInterval: clear },
    };
}

async function makeItem(
    data: Record<string, unknown>,
    options: { useScreensaverTimer?: boolean; screenSaver?: unknown; writes?: Write[] } = {},
): Promise<Fixture> {
    const writes = options.writes ?? [];
    const fakes = createFakes();
    const statesControler = {
        createDataItems: async (): Promise<unknown> => Promise.resolve(data),
        activateTrigger: async (): Promise<void> => Promise.resolve(),
        deactivateTrigger: async (): Promise<void> => Promise.resolve(),
        deletePageLoop: async (): Promise<void> => Promise.resolve(),
    };
    const adapter = {
        namespace: 'nspanel-lovelace-ui.0',
        unload: false,
        log: fakes.log,
        library: { getTranslation: (k: string): string => k },
        controller: { statesControler },
        ...fakes.timerApi,
    };
    const panel = {
        name: 'p',
        friendlyName: 'Panel',
        isOnline: true,
        unload: false,
        persistentPageItems: {} as Record<string, unknown>,
        statesControler,
        screenSaver: options.screenSaver,
        panelSend: { addMessage: (payload: string): void => void fakes.sent.push(payload) },
    };
    const parent = {
        name: 'page',
        card: 'cardEntities',
        basePanel: panel,
        sleep: false,
        visible: true,
        triggered: 0,
        ticking: new Set<unknown>(),
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
            parent.triggered++;
            return Promise.resolve(true);
        },
    };
    const item: any = new PageItem(
        { id: 'page?0', name: 'i', adapter, panel, dpInit: '', parent } as any,
        { type: 'timer', role: 'timer', data: {}, useScreensaverTimer: options.useScreensaverTimer } as any,
    );
    item.log = fakes.log;
    item.library = adapter.library;
    await item.init();
    return {
        item,
        writes,
        sent: fakes.sent,
        warn: fakes.warn,
        timers: fakes.timers,
        parent,
        panel,
        popup: async () => {
            const f = String(await item.GeneratePopup('popupTimer')).split('~');
            return { min: f[5], sec: f[6], editable: f[7], actions: f.slice(8, 11), texts: f.slice(11, 14) };
        },
        line: async () => String(await item.getPageItemPayload()).split('~')[5],
    };
}

async function makeSaver(
    clockTimer: ScreensaverClockTimer | undefined,
    initial: Record<string, unknown>,
    objects: Record<string, Common> = {},
): Promise<{ saver: any; writes: Write[]; states: Record<string, unknown> }> {
    const fakes = createFakes();
    const writes: Write[] = [];
    const states = { ...initial };
    const statesControler = {
        setTrigger: async (): Promise<void> => Promise.resolve(),
        getStateVal: async (id: string): Promise<unknown> => Promise.resolve(states[id] ?? null),
        getObjectAsync: async (id: string): Promise<unknown> =>
            Promise.resolve({ type: 'state', common: objects[id] ?? {} }),
        subscribePattern: async (): Promise<void> => Promise.resolve(),
        unsubscribePattern: async (): Promise<void> => Promise.resolve(),
    };
    const adapter = {
        namespace: 'nspanel-lovelace-ui.0',
        unload: false,
        log: fakes.log,
        library: {},
        controller: { statesControler },
        ...fakes.timerApi,
        setForeignStateAsync: async (id: string, val: unknown): Promise<void> => {
            writes.push({ id, val });
            states[id] = val;
            return Promise.resolve();
        },
        getForeignStatesAsync: async (pattern: string): Promise<Record<string, { val: unknown }>> => {
            const out: Record<string, { val: unknown }> = {};
            const [prefix, suffix] = pattern.split('*');
            for (const id of Object.keys(states)) {
                if (id.startsWith(prefix) && id.endsWith(suffix)) {
                    out[id] = { val: states[id] };
                }
            }
            return Promise.resolve(out);
        },
    };
    const panel = {
        name: 'p',
        friendlyName: 'Panel',
        isOnline: true,
        info: { nspanel: {} },
        panelSend: { addMessage: (): void => undefined },
    };
    const saver: any = new Screensaver(
        { card: 'screensaver', id: '0', name: 'scr', dpInit: '', adapter, panel } as unknown as PageInterface,
        {
            uniqueID: 'scr',
            alwaysOn: 'none',
            pageItems: [],
            config: {
                card: 'screensaver',
                mode: 'standard',
                rotationTime: 0,
                model: 'eu',
                data: undefined,
                screensaverSwipe: false,
                screensaverIndicatorButtons: false,
                clockTimer,
            },
        } as unknown as pages.PageBase,
    );
    saver.log = fakes.log;
    await saver.initClockTimer();
    return { saver, writes, states };
}

const simple: ScreensaverClockTimer = { enabled: true, activeState: 'x.0.on', dataState: 'x.0.ts' };
const slots: ScreensaverClockTimer = {
    enabled: true,
    activeState: '',
    dataState: '',
    activePattern: 'x.0.*.aktiv',
    dataPattern: 'x.0.*.targetTs',
};

describe('lib/pages/screensaver-timer - popup helpers', () => {
    it('list text HH:MM:SS is not limited to a day', () => {
        expect(timerClockText(0)).to.equal('00:00:00');
        expect(timerClockText(3725)).to.equal('01:02:05');
        expect(timerClockText(90_000)).to.equal('25:00:00');
    });
    it('popup stays at 99:59', () => {
        expect(timerPopupFields(65)).to.deep.equal({ minutes: '1', seconds: '5' });
        expect(timerPopupFields(99 * 60 + 59)).to.deep.equal({ minutes: '99', seconds: '59' });
        expect(timerPopupFields(100 * 60)).to.deep.equal({ minutes: '99', seconds: '59' });
    });
    it('units: seconds, ms only with common.unit ms', () => {
        expect(timerSecondsOf(90, undefined)).to.equal(90);
        expect(timerSecondsOf(90, 's')).to.equal(90);
        expect(timerSecondsOf(90_500, 'ms')).to.equal(91);
        expect(timerSecondsOf(-1, undefined)).to.equal(0);
        expect(timerSecondsOf(null, undefined)).to.equal(0);
        expect(timerValueOf(90, 'sec')).to.equal(90);
        expect(timerValueOf(90, ' MS ')).to.equal(90_000);
    });
    it('input of the HMI', () => {
        expect(parseTimerInput('00:05:30')).to.deep.equal([0, 5, 30]);
        expect(parseTimerInput('')).to.equal(undefined);
        expect(parseTimerInput(undefined)).to.equal(undefined);
        expect(parseTimerInput('a:b:c')).to.equal(undefined);
    });
    it('slots are ordered by number', () => {
        expect(orderTimerSlotKeys(['10', '2', '1'])).to.deep.equal(['1', '2', '10']);
    });
    it('start value depends on the data state', () => {
        const now = Date.UTC(2026, 10, 5, 12);
        expect(timerStartValue({ unit: 's' }, 60, now)).to.equal(60);
        expect(timerStartValue({ unit: 'sec' }, 60, now)).to.equal(60);
        expect(timerStartValue({ unit: 'ms' }, 60, now)).to.equal(60_000);
        expect(timerStartValue({ role: 'value.timer' }, 60, now)).to.equal(60);
        expect(timerStartValue({ role: 'level.timer' }, 60, now)).to.equal(60);
        expect(timerStartValue({ type: 'string' }, 60, now)).to.equal('2026-11-05T12:01:00.000Z');
        expect(timerStartValue({ type: 'number' }, 60, now)).to.equal(now + 60_000);
    });

    describe('buttons', () => {
        const actions = (b: ReturnType<typeof timerPopupButtons>): string[] => b.buttons.map(x => x?.action ?? '');
        const texts = (b: ReturnType<typeof timerPopupButtons>): string[] => b.buttons.map(x => x?.text ?? '');

        it('internal: running, expired, paused, set, nothing', () => {
            const expired = timerPopupButtons({ mode: 'timer', status: 'expired', seconds: 0 });
            expect(actions(expired)).to.deep.equal(['', 'finish', '']);
            const run = timerPopupButtons({ mode: 'timer', status: 'run', seconds: 5 });
            expect(actions(run)).to.deep.equal(['pause', 'clear', 'finish']);
            expect(texts(run)).to.deep.equal(['timer_pause', 'timer_cancel', 'timer_finish']);
            expect(run.editable).to.equal(false);
            const paused = timerPopupButtons({ mode: 'timer', status: 'pause', seconds: 5 });
            expect(actions(paused)).to.deep.equal(['begin', '', 'clear']);
            expect(texts(paused)).to.deep.equal(['timer_continue', '', 'timer_cancel']);
            const set = timerPopupButtons({ mode: 'timer', status: 'stop', seconds: 5 });
            expect(texts(set)).to.deep.equal(['timer_start', '', 'timer_cancel']);
            expect(set.editable).to.equal(true);
            const none = timerPopupButtons({ mode: 'timer', status: 'pause', seconds: 0 });
            expect(actions(none)).to.deep.equal(['begin', '', '']);
            expect(texts(none)).to.deep.equal(['timer_start', '', '']);
            expect(none.editable).to.equal(true);
        });
        it('external with STATUS', () => {
            const all = { mode: 'ex-timer', canStatus: true, canSet: true } as const;
            const idle = timerPopupButtons({ ...all, status: 0, seconds: 0 });
            expect(actions(idle)).to.deep.equal(['begin', '', 'clear']);
            expect(texts(idle)[0]).to.equal('timer_start');
            expect(idle.editable).to.equal(true);
            expect(texts(timerPopupButtons({ ...all, status: 1, seconds: 3 }))[0]).to.equal('timer_continue');
            const run = timerPopupButtons({ ...all, status: 2, seconds: 3 });
            expect(actions(run)).to.deep.equal(['pause', 'clear', 'finish']);
            expect(run.editable).to.equal(false);
            const over = timerPopupButtons({ ...all, status: 2, seconds: 0 });
            expect(actions(over)).to.deep.equal(['', 'finish', '']);
            expect(texts(over)[1]).to.equal('timer_finish');
        });
        it('external without STATUS: no start and no pause', () => {
            const set = timerPopupButtons({
                mode: 'ex-timer',
                status: undefined,
                canStatus: false,
                canSet: true,
                seconds: 3,
            });
            expect(actions(set)).to.deep.equal(['', '', 'clear']);
            expect(set.editable).to.equal(true);
            const display = timerPopupButtons({
                mode: 'ex-timer',
                status: undefined,
                canStatus: false,
                canSet: false,
                seconds: 3,
            });
            expect(actions(display)).to.deep.equal(['', '', '']);
            expect(display.editable).to.equal(false);
        });
        it('alarm: on and off only, edit only while off, never clear', () => {
            const off = timerPopupButtons({ mode: 'ex-alarm', status: 1, canStatus: true, canSet: true });
            expect(actions(off)).to.deep.equal(['', 'begin', '']);
            expect(texts(off)[1]).to.equal('timer_on');
            expect(off.editable).to.equal(true);
            const on = timerPopupButtons({ mode: 'ex-alarm', status: 2, canStatus: true, canSet: true });
            expect(actions(on)).to.deep.equal(['', 'pause', '']);
            expect(texts(on)[1]).to.equal('timer_off');
            expect(on.editable).to.equal(false);
            const noStatus = timerPopupButtons({ mode: 'ex-alarm', status: undefined, canStatus: false, canSet: true });
            expect(actions(noStatus)).to.deep.equal(['', '', '']);
            expect(noStatus.editable).to.equal(true);
        });
    });
});

for (const zone of ['Europe/Berlin', 'UTC']) {
    describe(`lib/pages/pageItem - timer in time zone ${zone}`, () => {
        const realTz = process.env.TZ;
        const realNow = Date.now;
        before(() => {
            process.env.TZ = zone;
        });
        after(() => {
            if (realTz === undefined) {
                delete process.env.TZ;
            } else {
                process.env.TZ = realTz;
            }
        });
        afterEach(() => {
            Date.now = realNow;
        });

        it('alarm: local clock time, in summer and winter', () => {
            expect(alarmClockOf(new Date(2026, 0, 15, 7, 30).getTime())).to.deep.equal({ hour: 7, minute: 30 });
            expect(alarmClockOf(new Date(2026, 6, 15, 7, 30).getTime())).to.deep.equal({ hour: 7, minute: 30 });
            expect(alarmClockOf(0)).to.deep.equal({ hour: 0, minute: 0 });
            // what the adapter read so far: ms since midnight
            expect(alarmClockOf(7.5 * 3_600_000)).to.deep.equal({ hour: 7, minute: 30 });
        });
        it('alarm: the next time of this clock time', () => {
            const now = new Date(2026, 10, 5, 12, 0).getTime();
            expect(nextAlarmTs(13, 5, now)).to.equal(new Date(2026, 10, 5, 13, 5).getTime());
            expect(nextAlarmTs(7, 30, now)).to.equal(new Date(2026, 10, 6, 7, 30).getTime());
            expect(nextAlarmTs(59, 30, now)).to.equal(new Date(2026, 10, 5, 23, 30).getTime());
            // across the change of the daylight saving time
            const before = new Date(2026, 2, 28, 12, 0).getTime();
            expect(nextAlarmTs(7, 0, before)).to.equal(new Date(2026, 2, 29, 7, 0).getTime());
        });

        it('alarm item: list HH:MM, popup hour and minute, edit writes the next time', async () => {
            const writes: Write[] = [];
            const now = new Date(2026, 6, 15, 12, 0).getTime();
            Date.now = (): number => now;
            const value = new Date(2026, 6, 15, 7, 5).getTime();
            const f = await makeItem(
                {
                    entity1: {
                        value: state('ACTUAL', writes, value, { role: 'date' }),
                        set: state('SET', writes, 0, { role: 'date' }),
                    },
                    setValue2: state('STATUS', writes, 1),
                },
                { writes },
            );
            expect(f.item.tempData.role).to.equal('ex-alarm');
            expect(await f.line()).to.equal('07:05');
            const popup = await f.popup();
            expect([popup.min, popup.sec, popup.editable]).to.deep.equal(['7', '5', '1']);
            expect(popup.actions).to.deep.equal(['', 'begin', '']);
            expect(popup.texts[1]).to.equal('timer_on');
            // the HMI fields go up to 59: the hour is limited to 23
            await f.item.onCommand('timer-start', '00:45:15');
            await f.item.onCommand('timer-start', '00:06:00');
            expect(writes).to.deep.equal([
                { id: 'SET', val: new Date(2026, 6, 15, 23, 15).getTime() },
                { id: 'SET', val: new Date(2026, 6, 16, 6, 0).getTime() },
            ]);
        });
    });
}

describe('lib/pages/pageItem - timer modes', () => {
    const realNow = Date.now;
    afterEach(() => {
        Date.now = realNow;
    });

    describe('internal', () => {
        it('list and popup show the counted time, edit does not start', async () => {
            const f = await makeItem({});
            expect(f.item.tempData.role).to.equal('timer');
            expect(await f.line()).to.equal('00:00:00');
            let popup = await f.popup();
            expect(popup.actions).to.deep.equal(['begin', '', '']);
            expect(popup.editable).to.equal('1');
            await f.item.onCommand('timer-start', '00:05:30');
            expect(f.item.tempData.value).to.equal(330);
            expect(f.item.tempData.status).to.equal('stop');
            expect(f.timers.filter(t => !t.cleared)).to.have.length(0);
            expect(await f.line()).to.equal('00:05:30');
            popup = await f.popup();
            expect([popup.min, popup.sec]).to.deep.equal(['5', '30']);
            expect(popup.texts).to.deep.equal(['timer_start', '', 'timer_cancel']);
        });

        it('start with nothing to count does nothing, no end is reported', async () => {
            const writes: Write[] = [];
            const f = await makeItem({ setValue1: state('STATE', writes, null) }, { writes });
            await f.item.onCommand('timer-begin', '');
            expect(f.timers).to.have.length(0);
            expect(writes).to.deep.equal([]);
        });

        it('runs, pauses, continues; the end stays until finish and reports once', async () => {
            const writes: Write[] = [];
            const f = await makeItem(
                { setValue1: state('STATE', writes, null), setValue2: state('STATUS', writes, 0) },
                { writes },
            );
            const t0 = Date.now();
            Date.now = (): number => t0;
            await f.item.onCommand('timer-start', '00:00:03');
            await f.item.onCommand('timer-begin', '');
            expect((await f.popup()).actions).to.deep.equal(['pause', 'clear', 'finish']);
            expect(f.timers.at(-1)!.ms).to.equal(3000);
            expect(f.parent.ticking.has(f.item)).to.equal(true);
            Date.now = (): number => t0 + 1000;
            expect(await f.line()).to.equal('00:00:02');
            await f.item.onCommand('timer-pause', '');
            expect(f.item.tempData.value).to.equal(2);
            expect(f.timers.at(-1)!.cleared).to.equal(true);
            let popup = await f.popup();
            expect(popup.texts).to.deep.equal(['timer_continue', '', 'timer_cancel']);
            await f.item.onCommand('timer-begin', '');
            expect(f.timers.at(-1)!.ms).to.equal(2000);
            Date.now = (): number => t0 + 3000;
            await f.timers.at(-1)!.fn();
            await new Promise(resolve => setImmediate(resolve));
            expect(f.item.tempData.status).to.equal('expired');
            expect(writes.filter(w => w.id === 'STATE')).to.deep.equal([{ id: 'STATE', val: true }]);
            popup = await f.popup();
            expect([popup.min, popup.sec]).to.deep.equal(['0', '0']);
            expect(popup.actions).to.deep.equal(['', 'finish', '']);
            await f.item.onCommand('timer-finish', '');
            expect(f.item.tempData.status).to.equal('stop');
            expect(writes.filter(w => w.id === 'STATE')).to.have.length(1);
            expect(writes.at(-1)).to.deep.equal({ id: 'STATUS', val: 0 });
        });

        it('cancel and finish while running: only finish writes STATE', async () => {
            const writes: Write[] = [];
            const f = await makeItem({ setValue1: state('STATE', writes, null) }, { writes });
            await f.item.onCommand('timer-start', '00:01:00');
            await f.item.onCommand('timer-begin', '');
            await f.item.onCommand('timer-clear', '');
            expect(f.item.tempData.value).to.equal(0);
            expect(writes).to.deep.equal([]);
            await f.item.onCommand('timer-start', '00:01:00');
            await f.item.onCommand('timer-begin', '');
            await f.item.onCommand('timer-finish', '');
            expect(f.item.tempData.value).to.equal(0);
            expect(writes).to.deep.equal([{ id: 'STATE', val: true }]);
        });

        describe('controlled from outside', () => {
            const setup = async (
                setVal = 0,
                statusVal = 0,
                unit?: string,
            ): Promise<{
                f: Fixture;
                writes: Write[];
                set: any;
                status: any;
                fire: (dp: any, v: number) => Promise<void>;
            }> => {
                const writes: Write[] = [];
                const set = state('SET', writes, setVal, { unit });
                const status = state('STATUS', writes, statusVal);
                const f = await makeItem(
                    { entity1: { set }, setValue1: state('STATE', writes, null), setValue2: status },
                    { writes },
                );
                return {
                    f,
                    writes,
                    set,
                    status,
                    // the states controller: value first, then the event
                    fire: async (dp: any, v: number): Promise<void> => {
                        const old = dp.val;
                        dp.val = v;
                        await f.item.onStateChange(dp.options.dp, { old: { val: old }, new: { val: v } });
                    },
                };
            };
            const interval = (f: Fixture): Fixture['timers'][number] | undefined =>
                f.timers.filter(t => !t.cleared).at(-1);
            const atEnd = async (f: Fixture): Promise<void> => {
                const end: number = f.item.tempData.endTs;
                Date.now = (): number => end;
                await interval(f)!.fn();
                await new Promise(resolve => setImmediate(resolve));
            };

            it('no ACTUAL with SET stays the internal timer', async () => {
                const { f } = await setup();
                expect(f.item.tempData.role).to.equal('timer');
            });

            it('SET while standing: shown, not started', async () => {
                const { f, set, fire, writes } = await setup();
                await fire(set, 90);
                expect(f.item.tempData.value).to.equal(90);
                expect(interval(f)).to.equal(undefined);
                expect(await f.line()).to.equal('00:01:30');
                expect(writes).to.deep.equal([]);
            });

            it('SET in ms', async () => {
                const { f, set, fire } = await setup(0, 0, 'ms');
                await fire(set, 90_000);
                expect(f.item.tempData.value).to.equal(90);
            });

            it('SET while running: goes on with the new time', async () => {
                const { f, set, fire } = await setup();
                await fire(set, 90);
                await f.item.onCommand('timer-begin', '');
                const end = interval(f);
                await fire(set, 10);
                expect(f.item.tempData.status).to.equal('run');
                expect(await f.line()).to.equal('00:00:10');
                expect(end!.cleared).to.equal(true);
                expect(interval(f)!.ms).to.be.within(9000, 10_000);
            });

            it('SET 0 cancels, STATE stays untouched', async () => {
                const { f, set, status, fire, writes } = await setup();
                await fire(set, 90);
                await fire(status, 2);
                writes.splice(0);
                await fire(set, 0);
                expect(f.item.tempData.status).to.equal('stop');
                expect(f.item.tempData.value).to.equal(0);
                expect(interval(f)).to.equal(undefined);
                expect(writes).to.deep.equal([{ id: 'STATUS', val: 0 }]);
            });

            it('the edit of the popup goes to SET, its echo does nothing', async () => {
                const { f, set, fire, writes } = await setup();
                await f.item.onCommand('timer-begin', '');
                await f.item.onCommand('timer-start', '00:02:00');
                expect(writes).to.deep.equal([{ id: 'SET', val: 120 }]);
                f.item.tempData.value = 100;
                await fire(set, 120);
                expect(f.item.tempData.value).to.equal(100);
                // the same value again is a command from outside
                await fire(set, 120);
                expect(f.item.tempData.value).to.equal(120);
            });

            it('start from SET when the counter is 0, popup and STATUS', async () => {
                const a = await setup(60);
                await a.f.item.onCommand('timer-begin', '');
                expect(a.f.item.tempData.value).to.equal(60);
                expect(a.f.item.tempData.status).to.equal('run');
                expect(a.writes).to.deep.equal([{ id: 'STATUS', val: 2 }]);
                const b = await setup(60);
                await b.fire(b.status, 2);
                expect(b.f.item.tempData.status).to.equal('run');
                // STATUS is 2 already: no own write
                expect(b.writes).to.deep.equal([]);
            });

            it('STATUS 2 with nothing to count: answers 0', async () => {
                const { f, status, fire, writes } = await setup();
                await fire(status, 2);
                expect(f.item.tempData.status).to.equal('stop');
                expect(writes).to.deep.equal([{ id: 'STATUS', val: 0 }]);
            });

            it('STATUS 1 pauses, 2 continues, 0 cancels; the echo of own writes does nothing', async () => {
                const { f, set, status, fire, writes } = await setup();
                await fire(set, 90);
                await fire(status, 2);
                const t0: number = f.item.tempData.endTs - 90_000;
                Date.now = (): number => t0 + 1000;
                await fire(status, 1);
                expect(f.item.tempData.status).to.equal('pause');
                expect(f.item.tempData.value).to.equal(89);
                await fire(status, 2);
                expect(f.item.tempData.status).to.equal('run');
                await fire(status, 0);
                expect(f.item.tempData.value).to.equal(0);
                expect(writes).to.deep.equal([]);
                // echo: value already fits
                await fire(status, 0);
                expect(writes).to.deep.equal([]);
            });

            it('STATUS 1 while standing: answers the truth', async () => {
                const { f, status, fire, writes } = await setup();
                await fire(status, 1);
                expect(f.item.tempData.status).to.equal('stop');
                expect(writes).to.deep.equal([{ id: 'STATUS', val: 0 }]);
            });

            it('the buttons mirror STATUS', async () => {
                const { f, writes } = await setup(60);
                await f.item.onCommand('timer-begin', '');
                await f.item.onCommand('timer-pause', '');
                await f.item.onCommand('timer-clear', '');
                expect(writes.map(w => w.val)).to.deep.equal([2, 1, 0]);
            });

            it('end: STATE true, STATUS stays 2 until finish, then 0', async () => {
                const { f, status, fire, writes } = await setup(1);
                await f.item.onCommand('timer-begin', '');
                await atEnd(f);
                expect(f.item.tempData.status).to.equal('expired');
                expect(status.val).to.equal(2);
                expect(writes.at(-1)).to.deep.equal({ id: 'STATE', val: true });
                expect(writes).to.have.length(2);
                // echo or a command with the same value
                await fire(status, 2);
                expect(f.item.tempData.status).to.equal('expired');
                await f.item.onCommand('timer-finish', '');
                expect(status.val).to.equal(0);
                expect(writes.filter(w => w.id === 'STATE')).to.have.length(1);
            });

            it('STATUS 0 from outside after the end: done, no second STATE', async () => {
                const { f, status, fire, writes } = await setup(1);
                await f.item.onCommand('timer-begin', '');
                await atEnd(f);
                await fire(status, 0);
                expect(f.item.tempData.status).to.equal('stop');
                expect(writes.filter(w => w.id === 'STATE')).to.have.length(1);
            });

            it('SET after the end: a new time, not started', async () => {
                const { f, set, fire } = await setup(1);
                await f.item.onCommand('timer-begin', '');
                await atEnd(f);
                await fire(set, 30);
                expect(f.item.tempData.status).to.equal('stop');
                expect(f.item.tempData.value).to.equal(30);
            });

            it('after a restart nothing counts, a STATUS left over is corrected', async () => {
                const { f, status, writes } = await setup(60, 2);
                await f.item.activateControlledTimer();
                expect(interval(f)).to.equal(undefined);
                expect(status.val).to.equal(0);
                expect(writes).to.deep.equal([{ id: 'STATUS', val: 0 }]);
            });

            it('a read only STATUS is not written', async () => {
                const writes: Write[] = [];
                const f = await makeItem({ setValue2: state('STATUS', writes, 2, {}, false) }, { writes });
                await f.item.activateControlledTimer();
                expect(writes).to.deep.equal([]);
            });

            it('stays a source of the screensaver', async () => {
                const { f } = await setup(60);
                expect(f.item.isCountdownSource()).to.equal(true);
                await f.item.onCommand('timer-begin', '');
                expect((await f.item.getCountdownView()).status).to.equal('running');
            });
        });

        it('keeps counting when its page is left, its end still comes', async () => {
            const t0 = Date.now();
            Date.now = (): number => t0;
            const writes: Write[] = [];
            const f = await makeItem({ setValue1: state('STATE', writes, null) }, { writes });
            await f.item.onCommand('timer-start', '00:00:05');
            await f.item.onCommand('timer-begin', '');
            f.parent.visible = false;
            await f.item.delete();
            expect(f.item.unload).to.equal(false);
            expect(f.parent.ticking.size).to.equal(0);
            Date.now = (): number => t0 + 5000;
            await f.timers.at(-1)!.fn();
            await new Promise(resolve => setImmediate(resolve));
            expect(f.item.tempData.status).to.equal('expired');
            expect(writes).to.deep.equal([{ id: 'STATE', val: true }]);
        });

        it('a timeout that comes too early waits on', async () => {
            const t0 = Date.now();
            Date.now = (): number => t0;
            const f = await makeItem({});
            await f.item.onCommand('timer-start', '00:00:05');
            await f.item.onCommand('timer-begin', '');
            Date.now = (): number => t0 + 4000;
            await f.timers.at(-1)!.fn();
            await new Promise(resolve => setImmediate(resolve));
            expect(f.item.tempData.status).to.equal('run');
            expect(f.timers.at(-1)!.ms).to.equal(1000);
        });
    });

    describe('external', () => {
        const channel = (
            writes: Write[],
            actual: number,
            status: number | null,
            unit?: string,
            opts: { set?: boolean; actualWrite?: boolean; statusWrite?: boolean } = {},
        ): Record<string, unknown> => ({
            entity1: {
                value: state('ACTUAL', writes, actual, { role: 'value.timer', unit }, !!opts.actualWrite),
                set: opts.set === false ? undefined : state('SET', writes, 0, { role: 'level.timer', unit }),
            },
            setValue1: state('STATE', writes, null),
            setValue2: status === null ? undefined : state('STATUS', writes, status, {}, opts.statusWrite !== false),
        });

        it('reads and writes seconds', async () => {
            const writes: Write[] = [];
            const f = await makeItem(channel(writes, 3725, 0), { writes });
            expect(f.item.tempData.role).to.equal('ex-timer');
            expect(await f.line()).to.equal('01:02:05');
            const popup = await f.popup();
            expect([popup.min, popup.sec]).to.deep.equal(['62', '5']);
            await f.item.onCommand('timer-start', '00:05:30');
            expect(writes).to.deep.equal([{ id: 'SET', val: 330 }]);
        });

        it('reads and writes ms with common.unit ms', async () => {
            const writes: Write[] = [];
            const f = await makeItem(channel(writes, 90_000, 0, 'ms'), { writes });
            expect(await f.line()).to.equal('00:01:30');
            await f.item.onCommand('timer-start', '00:05:30');
            expect(writes).to.deep.equal([{ id: 'SET', val: 330_000 }]);
        });

        it('popup stays at 99:59', async () => {
            const f = await makeItem(channel([], 100 * 60 + 5, 0));
            const popup = await f.popup();
            expect([popup.min, popup.sec]).to.deep.equal(['99', '59']);
            expect(await f.line()).to.equal('01:40:05');
        });

        it('STATE set does not change what the popup reads', async () => {
            const f = await makeItem(channel([], 65, 2));
            const popup = await f.popup();
            expect([popup.min, popup.sec]).to.deep.equal(['1', '5']);
        });

        it('STATUS: begin, pause, cancel, finish; only finish writes STATE', async () => {
            const writes: Write[] = [];
            const f = await makeItem(channel(writes, 65, 2, undefined, { actualWrite: true }), { writes });
            expect((await f.popup()).actions).to.deep.equal(['pause', 'clear', 'finish']);
            await f.item.onCommand('timer-pause', '');
            expect(writes.splice(0)).to.deep.equal([{ id: 'STATUS', val: 1 }]);
            await f.item.onCommand('timer-begin', '');
            expect(writes.splice(0)).to.deep.equal([{ id: 'STATUS', val: 2 }]);
            await f.item.onCommand('timer-clear', '');
            expect(writes.splice(0)).to.deep.equal([
                { id: 'STATUS', val: 0 },
                { id: 'SET', val: 0 },
                { id: 'ACTUAL', val: 0 },
            ]);
            await f.item.onCommand('timer-finish', '');
            expect(writes.splice(0)).to.deep.equal([
                { id: 'STATUS', val: 0 },
                { id: 'SET', val: 0 },
                { id: 'ACTUAL', val: 0 },
                { id: 'STATE', val: true },
            ]);
        });

        it('ACTUAL 0 at STATUS 2: 00:00 with finish only', async () => {
            const f = await makeItem(channel([], 0, 2));
            const popup = await f.popup();
            expect([popup.min, popup.sec, popup.editable]).to.deep.equal(['0', '0', '0']);
            expect(popup.actions).to.deep.equal(['', 'finish', '']);
        });

        it('without STATUS: edit and clear with SET, no start', async () => {
            const writes: Write[] = [];
            const f = await makeItem(channel(writes, 65, null), { writes });
            const popup = await f.popup();
            expect(popup.actions).to.deep.equal(['', '', 'clear']);
            expect(popup.texts[2]).to.equal('timer_clear');
            expect(popup.editable).to.equal('1');
            await f.item.onCommand('timer-clear', '');
            expect(writes).to.deep.equal([{ id: 'SET', val: 0 }]);
        });

        it('no SET, writeable ACTUAL: edit, clear and finish go to ACTUAL', async () => {
            const writes: Write[] = [];
            const f = await makeItem(channel(writes, 65, null, undefined, { set: false, actualWrite: true }), {
                writes,
            });
            const popup = await f.popup();
            expect(popup.actions).to.deep.equal(['', '', 'clear']);
            expect(popup.editable).to.equal('1');
            await f.item.onCommand('timer-start', '00:05:30');
            await f.item.onCommand('timer-clear', '');
            expect(writes).to.deep.equal([
                { id: 'ACTUAL', val: 330 },
                { id: 'ACTUAL', val: 0 },
            ]);
        });

        it('no SET, writeable ACTUAL in ms, with STATUS: start is offered, finish writes ACTUAL and STATE', async () => {
            const writes: Write[] = [];
            const f = await makeItem(channel(writes, 0, 0, 'ms', { set: false, actualWrite: true }), { writes });
            expect((await f.popup()).actions).to.deep.equal(['begin', '', 'clear']);
            expect((await f.item.getCountdownView()).canStart).to.equal(true);
            await f.item.onCommand('timer-start', '00:01:00');
            expect(writes.splice(0)).to.deep.equal([{ id: 'ACTUAL', val: 60_000 }]);
            await f.item.onCommand('timer-finish', '');
            expect(writes).to.deep.equal([
                { id: 'STATUS', val: 0 },
                { id: 'ACTUAL', val: 0 },
                { id: 'STATE', val: true },
            ]);
        });

        it('SET and writeable ACTUAL: edit goes to SET, clear to both', async () => {
            const writes: Write[] = [];
            const f = await makeItem(channel(writes, 65, null, undefined, { actualWrite: true }), { writes });
            await f.item.onCommand('timer-start', '00:01:00');
            expect(writes.splice(0)).to.deep.equal([{ id: 'SET', val: 60 }]);
            await f.item.onCommand('timer-clear', '');
            expect(writes).to.deep.equal([
                { id: 'SET', val: 0 },
                { id: 'ACTUAL', val: 0 },
            ]);
        });

        it('pure display: no SET, no STATUS', async () => {
            const f = await makeItem(channel([], 65, null, undefined, { set: false }));
            const popup = await f.popup();
            expect(popup.actions).to.deep.equal(['', '', '']);
            expect(popup.editable).to.equal('0');
        });
    });

    describe('alarm', () => {
        it('on writes 2, off writes 1, no clear, edit only while off', async () => {
            const writes: Write[] = [];
            const status = state('STATUS', writes, 2);
            const f = await makeItem(
                {
                    entity1: {
                        value: state('ACTUAL', writes, 0, { role: 'date' }),
                        set: state('SET', writes, 0, { role: 'date' }),
                    },
                    setValue2: status,
                },
                { writes },
            );
            let popup = await f.popup();
            expect(popup.actions).to.deep.equal(['', 'pause', '']);
            expect(popup.texts[1]).to.equal('timer_off');
            expect(popup.editable).to.equal('0');
            await f.item.onCommand('timer-pause', '');
            expect(writes.splice(0)).to.deep.equal([{ id: 'STATUS', val: 1 }]);
            popup = await f.popup();
            expect(popup.actions).to.deep.equal(['', 'begin', '']);
            expect(popup.editable).to.equal('1');
            await f.item.onCommand('timer-begin', '');
            expect(writes.splice(0)).to.deep.equal([{ id: 'STATUS', val: 2 }]);
        });

        it('no SET, writeable ACTUAL: the time goes to ACTUAL', async () => {
            const writes: Write[] = [];
            const now = new Date(2026, 6, 15, 12, 0).getTime();
            Date.now = (): number => now;
            const f = await makeItem(
                {
                    entity1: { value: state('ACTUAL', writes, 0, { role: 'date' }) },
                    setValue2: state('STATUS', writes, 1),
                },
                { writes },
            );
            expect((await f.popup()).editable).to.equal('1');
            await f.item.onCommand('timer-start', '00:13:05');
            expect(writes).to.deep.equal([{ id: 'ACTUAL', val: new Date(2026, 6, 15, 13, 5).getTime() }]);
        });

        it('a value with a unit of time is a duration, without one it stays a clock time', async () => {
            const withUnit = await makeItem({ entity1: { value: state('A', [], 60, { role: 'value', unit: 's' }) } });
            expect(withUnit.item.tempData.role).to.equal('ex-timer');
            const without = await makeItem({ entity1: { value: state('A', [], 60, { role: 'value' }) } });
            expect(without.item.tempData.role).to.equal('ex-alarm');
        });
    });

    describe('timer of the screensaver', () => {
        const NOW = new Date(2026, 10, 5, 12).getTime();
        beforeEach(() => {
            Date.now = (): number => NOW;
        });

        it('no timer: one warning per panel, no buttons, no crash', async () => {
            const { saver } = await makeSaver(undefined, {});
            const a = await makeItem({}, { useScreensaverTimer: true, screenSaver: saver });
            expect(await a.line()).to.equal('00:00:00');
            const popup = await a.popup();
            expect(popup.actions).to.deep.equal(['', '', '']);
            expect(popup.editable).to.equal('0');
            await a.popup();
            expect(a.warn).to.have.length(1);
        });

        it('off: edit is remembered, only start starts; the end time goes first', async () => {
            const s = await makeSaver(simple, { 'x.0.on': false, 'x.0.ts': 0 });
            const f = await makeItem({}, { useScreensaverTimer: true, screenSaver: s.saver });
            let popup = await f.popup();
            expect(popup.actions).to.deep.equal(['', 'begin', '']);
            expect(popup.editable).to.equal('1');
            await f.item.onCommand('timer-start', '00:05:00');
            expect(s.writes).to.deep.equal([]);
            popup = await f.popup();
            expect([popup.min, popup.sec]).to.deep.equal(['5', '0']);
            await f.item.onCommand('timer-begin', '');
            expect(s.writes).to.deep.equal([
                { id: 'x.0.ts', val: NOW + 300_000 },
                { id: 'x.0.on', val: true },
            ]);
        });

        it('a new opening forgets the set time', async () => {
            const s = await makeSaver(simple, { 'x.0.on': false, 'x.0.ts': 0 });
            const f = await makeItem({}, { useScreensaverTimer: true, screenSaver: s.saver });
            await f.popup();
            await f.item.onCommand('timer-start', '00:05:00');
            await f.line();
            expect((await f.popup()).min).to.equal('0');
        });

        it('running: time, cancel; ticks while visible, stops when not', async () => {
            const s = await makeSaver(simple, { 'x.0.on': true, 'x.0.ts': NOW + 65_000 });
            const f = await makeItem({}, { useScreensaverTimer: true, screenSaver: s.saver });
            expect(await f.line()).to.equal('00:01:05');
            const popup = await f.popup();
            expect([popup.min, popup.sec]).to.deep.equal(['1', '5']);
            expect(popup.actions).to.deep.equal(['', 'clear', '']);
            expect(f.parent.ticking.has(f.item)).to.equal(true);
            // no interval of its own
            expect(f.timers).to.have.length(0);
            await f.item.onCommand('timer-clear', '');
            expect(s.writes).to.deep.equal([{ id: 'x.0.on', val: false }]);
        });

        it('expired: finish; a tapped away timer stays visible for the item', async () => {
            const s = await makeSaver(simple, { 'x.0.on': true, 'x.0.ts': NOW - 1000 });
            s.saver.timerTappedAway = true;
            const f = await makeItem({}, { useScreensaverTimer: true, screenSaver: s.saver });
            const popup = await f.popup();
            expect(popup.actions).to.deep.equal(['', 'finish', '']);
            expect(popup.min).to.equal('0');
            expect(s.saver.timerTappedAway).to.equal(true);
            await f.item.onCommand('timer-finish', '');
            expect(s.writes).to.deep.equal([{ id: 'x.0.on', val: false }]);
        });

        it('writes depending on the data state', async () => {
            const cases: [Common, unknown][] = [
                [{ unit: 's', type: 'number' }, 60],
                [{ unit: 'ms', type: 'number' }, 60_000],
                [{ role: 'level.timer', type: 'number' }, 60],
                [{ type: 'string' }, new Date(NOW + 60_000).toISOString()],
                [{ type: 'number' }, NOW + 60_000],
            ];
            for (const [common, expected] of cases) {
                const s = await makeSaver(simple, { 'x.0.on': false, 'x.0.ts': 0 }, { 'x.0.ts': common });
                expect(await s.saver.startClockTimer(60)).to.equal(true);
                expect(s.writes[0]).to.deep.equal({ id: 'x.0.ts', val: expected });
            }
        });

        it('states that can not be written: display only', async () => {
            const s = await makeSaver(
                simple,
                { 'x.0.on': true, 'x.0.ts': NOW + 65_000 },
                { 'x.0.on': { write: false }, 'x.0.ts': { write: false } },
            );
            const f = await makeItem({}, { useScreensaverTimer: true, screenSaver: s.saver });
            const popup = await f.popup();
            expect(popup.min).to.equal('1');
            expect(popup.actions).to.deep.equal(['', '', '']);
            expect(popup.editable).to.equal('0');
        });

        it('slots: start takes the lowest free one by number, cancel the shown one', async () => {
            const s = await makeSaver(slots, {
                'x.0.1.aktiv': true,
                'x.0.1.targetTs': NOW + 600_000,
                'x.0.2.aktiv': false,
                'x.0.2.targetTs': 0,
                'x.0.10.aktiv': false,
                'x.0.10.targetTs': 0,
                'x.0.3.aktiv': true,
                'x.0.3.targetTs': NOW + 60_000,
            });
            await s.saver.startClockTimer(30);
            expect(s.writes.map(w => w.id)).to.deep.equal(['x.0.2.targetTs', 'x.0.2.aktiv']);
            s.writes.splice(0);
            const f = await makeItem({}, { useScreensaverTimer: true, screenSaver: s.saver });
            expect((await f.popup()).min).to.equal('1');
            await f.item.onCommand('timer-clear', '');
            expect(s.writes).to.deep.equal([{ id: 'x.0.3.aktiv', val: false }]);
        });

        it('slots: no free one, no start', async () => {
            const s = await makeSaver(slots, { 'x.0.1.aktiv': true, 'x.0.1.targetTs': NOW + 60_000 });
            expect((await s.saver.getClockTimerAccess()).canStart).to.equal(false);
            expect(await s.saver.startClockTimer(30)).to.equal(false);
        });

        it('a popup follows every second without list updates, a list only with the common update', async () => {
            const s = await makeSaver(simple, { 'x.0.on': true, 'x.0.ts': NOW + 65_000 });
            const f = await makeItem({}, { useScreensaverTimer: true, screenSaver: s.saver });
            await f.popup();
            const sent = f.sent.length;
            expect(await f.item.onTimerTick()).to.equal(false);
            expect(f.sent.length).to.equal(sent + 1);
            expect(f.parent.triggered).to.equal(0);
            await f.line();
            expect(await f.item.onTimerTick()).to.equal(false);
            expect(f.sent.length).to.equal(sent + 1);
            // the end is more than a new time
            Date.now = (): number => NOW + 66_000;
            expect(await f.item.onTimerTick()).to.equal(true);
        });

        it('the internal item and the item on the screensaver show the same time', async () => {
            const c = await makeSaver({ ...simple, activeState: '', dataState: '', itemId: 'i' }, {});
            const a = await makeItem({}, { screenSaver: c.saver });
            c.saver.basePanel = {
                ...c.saver.basePanel,
                findPageItemsById: () => [{ page: { getPageItemAt: async () => a.item }, index: 0 }],
            };
            await c.saver.connectClockTimerItem();
            const b = await makeItem({}, { useScreensaverTimer: true, screenSaver: c.saver });
            await a.item.onCommand('timer-start', '00:05:00');
            await a.item.onCommand('timer-begin', '');
            for (const offset of [1, 999, 1000, 1500, 61_234]) {
                Date.now = (): number => NOW + offset;
                expect(await b.line()).to.equal(await a.line());
            }
        });

        it('a change of the states redraws at once, without touching the evaluation of the display', async () => {
            const s = await makeSaver(simple, { 'x.0.on': false, 'x.0.ts': 0 });
            const f = await makeItem({}, { useScreensaverTimer: true, screenSaver: s.saver });
            await f.popup();
            const sent = f.sent.length;
            await s.saver.onStateChange('x.0.on', { old: { val: false }, new: { val: true } });
            await new Promise(resolve => setImmediate(resolve));
            expect(f.sent.length).to.equal(sent + 1);
            expect(s.saver.timerSelection.status).to.equal('off');
            expect(s.saver.timerMemory.size).to.equal(0);
        });
    });

    describe('page item as the source of the screensaver', () => {
        const NOW = new Date(2026, 10, 5, 12).getTime();
        const source: ScreensaverClockTimer = {
            enabled: true,
            activeState: '',
            dataState: '',
            itemId: 'item_abc',
        };
        beforeEach(() => {
            Date.now = (): number => NOW;
        });

        async function connect(
            data: Record<string, unknown>,
            opts: { useScreensaverTimer?: boolean } = {},
        ): Promise<any> {
            const s = await makeSaver(source, {});
            const f = await makeItem(data, { ...opts, screenSaver: s.saver });
            s.saver.basePanel = {
                ...s.saver.basePanel,
                findPageItemsById: (id: string) =>
                    id === 'item_abc' ? [{ page: { getPageItemAt: async () => f.item }, index: 0 }] : [],
            };
            await s.saver.connectClockTimerItem();
            return { ...s, f };
        }

        it('missing item: clock and one warning', async () => {
            const s = await makeSaver({ ...source, itemId: 'item_nope' }, {});
            const warnings: string[] = [];
            s.saver.log = { ...s.saver.log, warn: (m: string) => void warnings.push(m) };
            s.saver.basePanel = { ...s.saver.basePanel, findPageItemsById: () => [] };
            await s.saver.connectClockTimerItem();
            await s.saver.connectClockTimerItem();
            expect(warnings).to.have.length(1);
            expect(await s.saver.getClockTimerAccess()).to.equal(undefined);
            expect((await s.saver.refreshTimer()).status).to.equal('off');
        });

        it('the same id twice on the panel: clock, one warning, no item is chosen', async () => {
            const s = await makeSaver(source, {});
            const warnings: string[] = [];
            let asked = 0;
            const page = { getPageItemAt: async () => void asked++ };
            s.saver.log = { ...s.saver.log, warn: (m: string) => void warnings.push(m) };
            s.saver.basePanel = {
                ...s.saver.basePanel,
                findPageItemsById: () => [
                    { page, index: 0 },
                    { page, index: 1 },
                ],
            };
            await s.saver.connectClockTimerItem();
            await s.saver.connectClockTimerItem();
            expect(warnings).to.have.length(1);
            expect(asked).to.equal(0);
            expect(s.saver.clockTimer).to.equal(undefined);
        });

        it('circle: clock, the item has no buttons, nothing is read recursively', async () => {
            const c = await connect({}, { useScreensaverTimer: true });
            expect(c.saver.clockTimer).to.equal(undefined);
            expect(c.saver.timerItem).to.equal(undefined);
            const other = await makeItem({}, { useScreensaverTimer: true, screenSaver: c.saver });
            const popup = await other.popup();
            expect(popup.actions).to.deep.equal(['', '', '']);
        });

        it('item A uses the screensaver, the screensaver uses item B: allowed', async () => {
            const c = await connect({});
            await c.f.item.onCommand('timer-start', '00:01:00');
            await c.f.item.onCommand('timer-begin', '');
            const a = await makeItem({}, { useScreensaverTimer: true, screenSaver: c.saver });
            const popup = await a.popup();
            expect(popup.min).to.equal('1');
            expect(popup.actions).to.deep.equal(['', 'clear', '']);
            await a.item.onCommand('timer-clear', '');
            expect(c.f.item.tempData.value).to.equal(0);
        });

        it('an alarm clock or a display is no source', async () => {
            const alarm = await connect({ entity1: { value: state('A', [], 0, { role: 'date' }) } });
            expect(alarm.saver.clockTimer).to.equal(undefined);
            const display = await connect({ entity1: { value: state('A', [], 60, { role: 'value.timer' }) } });
            expect(display.saver.clockTimer).to.equal(undefined);
        });

        it('stays alive while its page is hidden', async () => {
            const writes: Write[] = [];
            const c = await connect({
                entity1: { value: state('A', writes, 60, { role: 'value.timer' }) },
                setValue2: state('S', writes, 2),
            });
            await c.f.item.delete();
            expect(c.f.item.unload).to.equal(false);
            expect(c.f.panel.persistentPageItems['page?0']).to.equal(c.f.item);
        });

        it('internal: running as end time for the 6 s step, paused with timer-pause state, expired', async () => {
            const c = await connect({});
            await c.f.item.onCommand('timer-start', '00:01:00');
            let sel = await c.saver.refreshTimer();
            expect(sel.status).to.equal('off');
            await c.f.item.onCommand('timer-begin', '');
            sel = await c.saver.refreshTimer();
            expect(sel.status).to.equal('running');
            expect(sel.text).to.equal('1.0');
            expect(c.saver.timerMemory.get('item').data).to.deep.equal({ kind: 'target', targetTs: NOW + 60_000 });
            await c.f.item.onCommand('timer-pause', '');
            sel = await c.saver.refreshTimer();
            expect(sel.status).to.equal('paused');
            expect(sel.text).to.equal('1.0');
            c.f.item.tempData.status = 'expired';
            c.f.item.tempData.value = 0;
            sel = await c.saver.refreshTimer();
            expect(sel.status).to.equal('expired');
            await c.f.item.onCommand('timer-finish', '');
            sel = await c.saver.refreshTimer();
            expect(sel.status).to.equal('off');
        });

        it('external: status mapping', async () => {
            const actual = state('A', [], 60, { role: 'value.timer' });
            const status = state('S', [], 2);
            const c = await connect({ entity1: { value: actual }, setValue2: status });
            expect((await c.saver.refreshTimer()).status).to.equal('running');
            status.val = 1;
            expect((await c.saver.refreshTimer()).status).to.equal('paused');
            status.val = 0;
            expect((await c.saver.refreshTimer()).status).to.equal('off');
            status.val = 2;
            actual.val = 0;
            expect((await c.saver.refreshTimer()).status).to.equal('expired');
            status.val = 1;
            expect((await c.saver.refreshTimer()).status).to.equal('off');
        });

        it('a change of a state of the item reaches the screensaver', async () => {
            const actual = state('A', [], 60, { role: 'value.timer' });
            const c = await connect({ entity1: { value: actual }, setValue2: state('S', [], 2) });
            let called = 0;
            c.saver.addClockTimerListener(() => called++);
            await c.f.item.onStateChange('A', { old: { val: 60 }, new: { val: 59 } });
            expect(called).to.equal(1);
        });
    });
});

describe('lib/classes/Page - timers of a page', () => {
    const realNow = Date.now;
    afterEach(() => {
        Date.now = realNow;
    });

    function pageWith(): {
        page: any;
        updates: () => number;
        intervals: { fn: () => void; cleared: boolean }[];
        item: (changed?: boolean) => any;
    } {
        let updates = 0;
        const intervals: { fn: () => void; cleared: boolean }[] = [];
        const page: any = Object.create(Page.prototype);
        Object.assign(page, {
            timerTickItems: new Set(),
            timerTicker: undefined,
            lastTimerListUpdate: 0,
            sleep: false,
            unload: false,
            getVisibility: (): boolean => true,
            onStateTriggerSuperDoNotOverride: async (): Promise<boolean> => {
                updates++;
                return Promise.resolve(true);
            },
            adapter: {
                unload: false,
                setInterval: (fn: () => void): unknown => {
                    const t = { fn, cleared: false };
                    intervals.push(t);
                    return t;
                },
                clearInterval: (t: { cleared: boolean }): void => {
                    t.cleared = true;
                },
            },
        });
        return {
            page,
            updates: () => updates,
            intervals,
            item: (changed = false) => ({ onTimerTick: async (): Promise<boolean> => Promise.resolve(changed) }),
        };
    }

    it('several timers: one ticker and one update in the window of 2 s', async () => {
        const p = pageWith();
        p.page.setTimerTick(p.item(), true);
        p.page.setTimerTick(p.item(), true);
        expect(p.intervals).to.have.length(1);
        const t0 = 1_000_000;
        const updatesAt: number[] = [];
        for (let i = 1; i <= 6; i++) {
            Date.now = (): number => t0 + i * 1000;
            const before = p.updates();
            await p.page.onTimerTicker();
            if (p.updates() > before) {
                updatesAt.push(i);
            }
        }
        expect(updatesAt).to.deep.equal([1, 3, 5]);
    });

    it('a change does not wait for the window', async () => {
        const p = pageWith();
        Date.now = (): number => 1_000_000;
        p.page.setTimerTick(p.item(true), true);
        await p.page.onTimerTicker();
        await p.page.onTimerTicker();
        expect(p.updates()).to.equal(2);
    });

    it('a popup on top: no updates of the list, items still tick', async () => {
        const p = pageWith();
        let ticks = 0;
        p.page.setTimerTick({ onTimerTick: async () => (ticks++, false) }, true);
        p.page.sleep = true;
        Date.now = (): number => 1_000_000;
        await p.page.onTimerTicker();
        expect(ticks).to.equal(1);
        expect(p.updates()).to.equal(0);
    });

    it('stops with the last timer and when the page is hidden', async () => {
        const p = pageWith();
        const a = p.item();
        p.page.setTimerTick(a, true);
        p.page.setTimerTick(a, false);
        expect(p.intervals[0].cleared).to.equal(true);
        p.page.setTimerTick(a, true);
        p.page.getVisibility = (): boolean => false;
        await p.page.onTimerTicker();
        expect(p.intervals[1].cleared).to.equal(true);
    });
});

describe('lib/types/adminShareConfig - page item as timer source', () => {
    const item = (
        itemId: string | undefined,
        channel: string,
        extra: Record<string, unknown> = {},
    ): Record<string, unknown> => ({
        role: 'level.timer',
        name: 'N',
        itemId,
        channelId: { valueStateId: channel },
        ...extra,
    });
    const pages = [
        {
            uniqueName: 'p1',
            headline: 'Page 1',
            navigationAssignment: [{ topic: 't1' }],
            pageItems: [
                item('i1', 'a.intern'),
                item('i2', 'a.ss', { useScreensaverTimer: true }),
                item('i3', 'a.alarm'),
                undefined,
                { ...item('i4', 'a.nav'), isNavigation: true },
                { role: 'light', itemId: 'i5', channelId: { valueStateId: 'a.light' } },
            ],
        },
        {
            uniqueName: 'p2',
            navigationAssignment: [{ topic: 't2' }],
            pageItems: [item('i6', 'b.ext'), item(undefined, 'b.new')],
        },
        { uniqueName: 'chart', card: 'cardChart' },
    ];
    const kinds = {
        'a.intern': { isCountdown: true },
        'a.ss': { isCountdown: true },
        'a.alarm': { isCountdown: false },
        'b.ext': { isCountdown: true },
        'b.new': { isCountdown: true },
    };

    describe('real data: items without a role, only the channel knows it', () => {
        const channel = (id: string, itemId: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
            channelId: {
                valueStateId: `0_userdata.0.popupTest.${id}`,
                unit: '',
                prefix: '',
                suffix: '',
                dateFormat: '',
            },
            itemId,
            ...extra,
        });
        const realPages = [
            {
                uniqueName: 'timerTest',
                card: 'cardEntities',
                navigationAssignment: [{ topic: 'nspanel/ns_panel4' }],
                pageItems: [
                    channel('intern', 'item_tintern'),
                    channel('extern', 'item_textern'),
                    channel('wecker', 'item_twecker'),
                    channel('ss', 'item_tss', { useScreensaverTimer: true }),
                    channel('light', 'item_tlight'),
                ],
            },
            {
                uniqueName: 'wecker',
                card: 'cardGrid',
                navigationAssignment: [{ topic: 'webtest' }],
                pageItems: [channel('intern', 'item_other')],
            },
        ];
        const objects: Record<string, { common: Record<string, unknown> }> = {
            '0_userdata.0.popupTest.intern': { common: { role: 'level.timer', name: 'Intern' } },
            '0_userdata.0.popupTest.intern.SET': { common: { role: 'level.timer' } },
            '0_userdata.0.popupTest.intern.STATUS': { common: { role: 'level.mode' } },
            '0_userdata.0.popupTest.extern': {
                common: { role: 'level.timer', name: { en: 'External', de: 'Extern' } },
            },
            '0_userdata.0.popupTest.extern.ACTUAL': { common: { role: 'value.timer' } },
            '0_userdata.0.popupTest.extern.STATUS': { common: { role: 'level.mode' } },
            '0_userdata.0.popupTest.wecker': { common: { role: 'level.timer', name: 'Wecker' } },
            '0_userdata.0.popupTest.wecker.ACTUAL': { common: { role: 'date' } },
            '0_userdata.0.popupTest.wecker.STATUS': { common: { role: 'level.mode' } },
            '0_userdata.0.popupTest.ss': { common: { role: 'level.timer', name: 'Vom Screensaver' } },
            '0_userdata.0.popupTest.light': { common: { role: 'light', name: 'Licht' } },
        };
        const getObject = async (id: string): Promise<{ common: Record<string, unknown> } | null> =>
            Promise.resolve(objects[id] ?? null);

        it('tilesTest offers Intern and Extern, not the alarm clock, the screensaver user or another role', async () => {
            const channels = await loadClockTimerChannels(realPages, getObject, 'de');
            expect(clockTimerItemChoice(realPages, ['nspanel/ns_panel4'], channels)).to.deep.equal({
                items: [
                    { itemId: 'item_tintern', label: 'timerTest - Intern' },
                    { itemId: 'item_textern', label: 'timerTest - Extern' },
                ],
                waiting: 0,
            });
        });

        it('another panel does not get them', async () => {
            const channels = await loadClockTimerChannels(realPages, getObject, 'de');
            expect(clockTimerItemChoice(realPages, ['webtest'], channels).items.map(i => i.itemId)).to.deep.equal([
                'item_other',
            ]);
        });

        it('a channel that can not be read is no countdown', async () => {
            const channels = await loadClockTimerChannels(realPages, async () => Promise.reject(new Error('no')), 'de');
            expect(clockTimerItemChoice(realPages, [], channels).items).to.deep.equal([]);
        });

        it('a stored role of another kind is not even asked for', () => {
            const page = { uniqueName: 'p', pageItems: [{ role: 'light', channelId: { valueStateId: 'x' } }] };
            expect(clockTimerChannels([page])).to.deep.equal([]);
        });

        it('the circle and the ids do not need the role', () => {
            const saver = {
                panels: ['nspanel/ns_panel4'],
                clockTimer: { enabled: true, activeState: '', dataState: '', itemId: 'item_tintern' },
            } as unknown as ScreensaverEntry;
            expect(isClockTimerSourceItem([saver], realPages, 'timerTest', 'item_tintern')).to.equal(true);
            expect(isClockTimerSourceItem([saver], realPages, 'timerTest', 'item_textern')).to.equal(false);
            expect(assignMissingItemIds(realPages)).to.equal(realPages);
            const without = [{ uniqueName: 'p', pageItems: [{ channelId: { valueStateId: 'x' } }] }];
            expect((assignMissingItemIds(without)[0].pageItems[0] as { itemId?: string }).itemId).to.match(/^item_/);
        });
    });

    it('channels of timer items', () => {
        expect(clockTimerChannels(pages)).to.deep.equal(['a.intern', 'a.ss', 'a.alarm', 'b.ext', 'b.new']);
    });
    it('offers countdowns of the panels with an id, never a user of the screensaver', () => {
        expect(clockTimerItemChoice(pages, ['t1'], kinds)).to.deep.equal({
            items: [{ itemId: 'i1', label: 'Page 1 - N' }],
            waiting: 0,
        });
        expect(clockTimerItemChoice(pages, ['t2'], kinds)).to.deep.equal({
            items: [{ itemId: 'i6', label: 'p2 - N (1)' }],
            waiting: 1,
        });
        expect(clockTimerItemChoice(pages, [], kinds).items.map(c => c.itemId)).to.deep.equal(['i1', 'i6']);
    });
    it('what counts as a countdown', () => {
        expect(isCountdownChannel(undefined, false)).to.equal(true);
        expect(isCountdownChannel({ role: 'value.timer' }, true)).to.equal(true);
        expect(isCountdownChannel({ role: 'value', unit: 's' }, true)).to.equal(true);
        expect(isCountdownChannel({ role: 'value.timer' }, false)).to.equal(false);
        expect(isCountdownChannel({ role: 'date' }, true)).to.equal(false);
        expect(isCountdownChannel({ role: 'value' }, true)).to.equal(false);
    });
    it('the circle is found on the same panel only', () => {
        const saver = (panels: string[], enabled = true): ScreensaverEntry =>
            ({
                panels,
                clockTimer: { enabled, activeState: '', dataState: '', itemId: 'i1' },
            }) as unknown as ScreensaverEntry;
        const list = pages as { uniqueName: string; navigationAssignment?: { topic: string }[] }[];
        expect(isClockTimerSourceItem([saver(['t1'])], list, 'p1', 'i1')).to.equal(true);
        expect(isClockTimerSourceItem([saver(['t2'])], list, 'p1', 'i1')).to.equal(false);
        expect(isClockTimerSourceItem([saver(['t1'], false)], list, 'p1', 'i1')).to.equal(false);
        expect(isClockTimerSourceItem([saver(['t1'])], list, 'p1', 'i2')).to.equal(false);
        expect(isClockTimerSourceItem([saver(['t1'])], list, 'p1', undefined)).to.equal(false);
    });
    it('complete with a chosen item only', () => {
        const timer = { enabled: true, activeState: '', dataState: '' };
        expect(isClockTimerComplete({ ...timer, itemId: '' })).to.equal(false);
        expect(isClockTimerComplete({ ...timer, itemId: 'i1' })).to.equal(true);
    });
    describe('item ids', () => {
        it('a new id has the format and does not collide', () => {
            expect(newItemId(new Set())).to.match(/^item_[a-z0-9]{6}$/);
        });
        it('fills what is missing on all pages and roles, keeps what exists', () => {
            const out = assignMissingItemIds(pages) as typeof pages;
            const ids = out.flatMap(p => (p.pageItems ?? []).map(i => (i as { itemId?: string } | undefined)?.itemId));
            expect(ids.filter(Boolean)).to.have.length(7);
            expect(new Set(ids.filter(Boolean)).size).to.equal(7);
            expect(ids.slice(0, 3)).to.deep.equal(['i1', 'i2', 'i3']);
            expect((out[1].pageItems?.[1] as { itemId: string }).itemId).to.match(/^item_/);
        });
        it('is idempotent: nothing missing, the very same table', () => {
            const once = assignMissingItemIds(pages);
            expect(assignMissingItemIds(once)).to.equal(once);
        });
        it('does not touch the input and pages without items', () => {
            const out = assignMissingItemIds(pages);
            expect((pages[1].pageItems?.[1] as { itemId?: string }).itemId).to.equal(undefined);
            expect(out[2]).to.equal(pages[2]);
        });
        it('the admin hands the id to the script item, also a raw one keeps it', () => {
            const channelId = { valueStateId: 'a.0.t' };
            const plain = adminPageItemToScriptItem({ channelId, itemId: 'i1' } as unknown as AdminPageItemConfig);
            expect(plain).to.have.property('itemId', 'i1');
            const without = adminPageItemToScriptItem({ channelId } as unknown as AdminPageItemConfig);
            expect(without).to.not.have.property('itemId');
            const raw = adminPageItemToScriptItem({
                channelId,
                itemId: 'i1',
                useNative: true,
                nativeFormat: 'script',
                native: { id: 'a.0.t' },
            } as unknown as AdminPageItemConfig);
            expect(raw).to.have.property('itemId', 'i1');
            const native = adminPageItemToScriptItem({
                channelId,
                itemId: 'i1',
                useNative: true,
                nativeFormat: 'native',
                native: { type: 'timer' },
            } as unknown as AdminPageItemConfig) as { native: { itemId: string } };
            expect(native.native.itemId).to.equal('i1');
            const own = adminPageItemToScriptItem({
                channelId,
                itemId: 'i1',
                useNative: true,
                nativeFormat: 'script',
                native: { id: 'a.0.t', itemId: 'mine' },
            } as unknown as AdminPageItemConfig);
            expect(own).to.have.property('itemId', 'mine');
        });
    });
});
