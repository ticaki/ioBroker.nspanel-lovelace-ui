import * as Definition from '../const/definition';
import type * as Types from '../types/types';
import * as globals from '../types/function-and-const';
import { Icons } from '../const/icon_mapping';

//import dayjs from 'dayjs';
//import moment from 'moment';
//import parseFormat from 'moment-parseformat';
import { Page } from '../classes/Page';
import type * as pages from '../types/pages';
import * as tools from '../const/tools';
import { PageItem } from './pageItem';
import type { PageInterface } from '../classes/PageInterface';
import type { BaseTriggeredPage } from '../classes/baseClassPage';
import { Color, type RGB } from '../const/Color';
import type { NSPanel } from '../types/NSPanel';
import type { IClientPublishOptions } from 'mqtt';
import {
    checkClockTimerPatterns,
    clockTimerUsesPageItem,
    clockTimerUsesSlots,
    isClockTimerComplete,
    screensaverNotifyLines,
    type ScreensaverClockTimer,
} from '../types/adminShareConfig';
import {
    isCountdownCommon,
    isTimerOn,
    nextTimerWakeMs,
    selectTimer,
    stepTimerItem,
    stepTimerSlot,
    TIMER_OFF,
    timerSlotKey,
    orderTimerSlotKeys,
    timerActiveValue,
    timerStartValue,
    type ClockTimerAccess,
    type TimerSelection,
    type TimerSlotMemory,
    type TimerStatus,
} from './screensaver-timer';

/** one timer as read from its two states */
type TimerSource = { activeId: string; dataId: string; activeVal: unknown; dataVal: unknown };

/**
 * true for the config of a screensaver page, including cards of other adapter versions (screensaver4)
 *
 * @param config config of a page
 */
function isScreensaverConfig(
    config: NonNullable<pages.PageBase['config']>,
): config is pages.screensaverDataItemOptions {
    return typeof config.card === 'string' && config.card.startsWith('screensaver');
}

/**
 * Replaces a screensaver mode or card this adapter version does not know (branch or downgrade, e.g.
 * `tiles`) by the standard screensaver. The page gets its own copy of the config, so the given one -
 * and with it the stored configuration - stays as it is and the mode applies again after an upgrade.
 * Anything else is returned untouched, a config that is no screensaver stays an error of the constructor.
 *
 * @param options configuration of the page
 * @returns the page to use and, after a fallback, the rejected mode and card
 */
export function resolveScreensaverOptions(options: pages.PageBase): {
    options: pages.PageBase;
    rejected?: { mode: unknown; card: unknown };
} {
    const config = options.config;
    if (!config || !isScreensaverConfig(config)) {
        return { options };
    }
    const mode: unknown = config.mode;
    const card: unknown = config.card;
    if (globals.isScreenSaverMode(mode) && typeof card === 'string' && globals.isScreenSaverCardType(card)) {
        return { options };
    }
    return {
        options: { ...options, config: { ...config, card: 'screensaver', mode: 'standard' } },
        rejected: { mode, card },
    };
}

/** Messages of the screensaver that are only sent when their content changed */
type FilteredMessage = 'weatherUpdate' | 'color' | 'statusUpdate' | 'notify';

export class Screensaver extends Page {
    items: undefined;
    private step: number = 0;
    private blockButtons: ioBroker.Timeout | undefined;
    rotationTime: number = 300_000;
    public screensaverIndicatorButtons: boolean = false;
    public screensaverSwipe: boolean = false;
    private _infoIcon: any = '';
    private timeoutRotation: ioBroker.Timeout | undefined = undefined;
    /** Minimum pause between two weatherUpdate/color bursts - protects the Nextion serial buffer */
    private static readonly minUpdateInterval = 2000;
    /** time of the last burst that was really sent, a press on an item sets it back to 0 */
    private lastUpdateTs: number = 0;
    private updateThrottle: ioBroker.Timeout | undefined = undefined;
    /** counts the runs of update(): only the newest may send, an older one read older values */
    private updateRun: number = 0;
    /** last sent message per type, see {@link sendIfChanged} */
    private lastSent: Map<FilteredMessage, string> = new Map();
    /** a touch cleared the active notification on the HMI: it takes `weatherUpdate` and `color~` again */
    private notifyHidden: boolean = false;
    public headingNotification: string = '';
    public textNotification: string = '';
    public customNotification: boolean = false;
    private activeNotification: boolean = false;
    private activeNotifyId: string = '';
    /**
     * A tap that follows a tap on the timer is still the same double click up to this long after it (and the one
     * before, for more than two taps). The HMI has no limit of its own - all screensaver pages: `tc0` press does
     * `vaTap.val+=1` and prepares `bExit,<vaTap>`, its release sends it. Only `tmSleep` sets `vaTap.val=0` when the
     * display dims after `sleepTimeout`, or a reload of the page. So every later tap arrives with opt > 1 and this
     * limit must come from here: a quick double tap is over within it, even with the way over Tasmota and MQTT.
     */
    private static readonly timerTapWindow = 1000;
    /** timer instead of the clock, undefined = none or not usable */
    private clockTimer: ScreensaverClockTimer | undefined = undefined;
    private timerSources: Map<string, TimerSource> = new Map();
    private timerMemory: Map<string, TimerSlotMemory> = new Map();
    /** unit and kind of the data states as far as read */
    private timerCommon: Map<string, { unit?: string; countdownState: boolean }> = new Map();
    private timerPatterns: string[] = [];
    private timerSelection: TimerSelection = TIMER_OFF;
    /** the timer was tapped away, the clock is shown - only at runtime */
    private timerTappedAway: boolean = false;
    private lastTimerTap: number = 0;
    private timerTick: ioBroker.Timeout | undefined = undefined;
    /** page items of this panel that use this timer, see {@link addClockTimerListener} */
    private clockTimerListeners: Set<() => void> = new Set();
    /** a page item is the source of the timer, see {@link connectClockTimerItem} */
    private timerItem: PageItem | undefined = undefined;
    /** last timer message on the display, the time trigger of the clock must not repeat it */
    private lastTimerPayload: string = '';
    /** timer status of the last `color~` */
    private colorTimerStatus: TimerStatus = 'off';
    /** the last `color~` was for a shown timer */
    private colorTimerShown: boolean = false;
    /** the HMI drops `color~` while a notification is shown */
    private colorsDropped: boolean = false;
    /** the HMI drops `weatherUpdate` while a notification is shown */
    private weatherDropped: boolean = false;
    /**
     * The page was loaded again (`pageType~`): `time~` follows the content of the next update(), behind `color~` and
     * `weatherUpdate~` - the HMI sets the clock from a global variable while loading the page, it is not urgent.
     */
    private timeAfterRender: boolean = false;
    //readonly mode: Types.ScreensaverModeType = 'standard';
    constructor(config: PageInterface, pageOptions: pages.PageBase) {
        const { options, rejected } = resolveScreensaverOptions(pageOptions);
        if (rejected) {
            config.adapter.log.warn(
                `Screensaver '${config.name}' of panel '${config.panel.friendlyName || config.panel.name}': mode '${String(rejected.mode)}' (card '${String(rejected.card)}') is not known to this adapter version - using 'standard' instead. The stored configuration stays unchanged.`,
            );
        }
        if (
            !options.config ||
            (options.config.card !== 'screensaver' &&
                options.config.card !== 'screensaver2' &&
                options.config.card !== 'screensaver3' &&
                options.config.card !== 'screensaver5')
        ) {
            config.adapter.log.error(
                `Invalid card for screensaver: ${options ? JSON.stringify(options) : 'undefined'}`,
            );
            return;
        }
        switch (options.config.mode) {
            case 'standard':
            case 'alternate': {
                config.card = 'screensaver';
                break;
            }
            case 'advanced': {
                config.card = 'screensaver2';
                break;
            }
            case 'easyview': {
                config.card = 'screensaver3';
                break;
            }
            case 'tiles': {
                config.card = 'screensaver5';
                break;
            }
        }
        options.alwaysOn = 'none';
        // flag the page as screensaver - the page items ask for it (indicator buttons option)
        super(config, options, true);
        this.screensaverIndicatorButtons = options.config.screensaverIndicatorButtons ?? false;
        this.screensaverSwipe = options.config.screensaverSwipe ?? false;
        this.clockTimer = options.config.clockTimer?.enabled ? options.config.clockTimer : undefined;
        this.rotationTime =
            options.config.rotationTime !== 0 && options.config.rotationTime < 3
                ? 3000
                : options.config.rotationTime * 1000;
        this.neverDeactivateTrigger = true;
        // time, date, notify ... are handled per source - a throttled time trigger must not get lost
        this.replayTriggerPerSource = true;
    }

    async init(): Promise<void> {
        await super.init();
        this.pageItems = await this.createPageItems(this.pageItemConfig);
        await this.basePanel.setScreensaverSwipe(this.screensaverSwipe);
        if (this.pageItems) {
            const indicators = this.pageItems.filter(x => x && x.config && x.config.modeScr === 'indicator');
            for (let a = 0; a < indicators.length; a++) {
                await this.library.writedp(
                    `panels.${this.basePanel.name}.buttons.indicator-${a + 1}`,
                    undefined,
                    Definition.genericStateObjects.panel.panels.buttons.indicator,
                );
            }
        }
        await this.initClockTimer();
    }

    /**
     * Connects the states of the timer. A timer that can not run is dropped with one warning, the clock stays.
     */
    private async initClockTimer(): Promise<void> {
        const timer = this.clockTimer;
        if (!timer || this.timerSources.size > 0 || this.timerPatterns.length > 0) {
            return;
        }
        const label = `Screensaver '${this.name}' of panel '${this.basePanel.friendlyName || this.basePanel.name}'`;
        if (clockTimerUsesPageItem(timer) && isClockTimerComplete(timer)) {
            // needs the pages, see connectClockTimerItem
            return;
        }
        if (!isClockTimerComplete(timer)) {
            const reason = clockTimerUsesPageItem(timer)
                ? 'no page item is chosen'
                : clockTimerUsesSlots(timer)
                  ? `invalid slot patterns (${checkClockTimerPatterns(timer.activePattern ?? '', timer.dataPattern ?? '')}): '${timer.activePattern ?? ''}', '${timer.dataPattern ?? ''}' - both need exactly one * after a path`
                  : 'the on/off state and the data state are both required';
            this.log.warn(`${label}: timer is ignored, ${reason}.`);
            this.clockTimer = undefined;
            return;
        }
        const states = this.controller.statesControler;
        try {
            if (clockTimerUsesSlots(timer)) {
                const patterns = [(timer.activePattern ?? '').trim(), (timer.dataPattern ?? '').trim()];
                if (patterns.some(p => p.startsWith(`${this.adapter.namespace}.`))) {
                    throw new Error(`patterns must not refer to the adapter's own namespace: ${patterns.join(', ')}`);
                }
                this.timerPatterns = patterns;
                for (const pattern of patterns) {
                    await states.subscribePattern(pattern, this.onTimerPatternState);
                }
                for (const pattern of patterns) {
                    const found = await this.adapter.getForeignStatesAsync(pattern);
                    for (const [id, state] of Object.entries(found)) {
                        this.applyTimerPatternState(id, state);
                    }
                }
            } else {
                const activeId = timer.activeState.trim();
                const dataId = timer.dataState.trim();
                await states.setTrigger(activeId, this);
                await states.setTrigger(dataId, this);
                this.timerSources.set('', {
                    activeId,
                    dataId,
                    activeVal: await states.getStateVal(activeId),
                    dataVal: await states.getStateVal(dataId),
                });
            }
        } catch (err: unknown) {
            this.log.warn(`${label}: timer is ignored: ${String(err)}`);
            await this.releaseTimerPatterns();
            this.timerSources.clear();
            this.clockTimer = undefined;
        }
    }

    /**
     * Connects a page item as the source of the timer, also while its page was never shown. No item, no countdown or
     * a circle (the item uses this screensaver): one warning and the clock stays, the states of the item are not read.
     */
    async connectClockTimerItem(): Promise<void> {
        const itemId = this.clockTimer?.itemId;
        if (!itemId || this.timerItem) {
            return;
        }
        const found = this.basePanel.findPageItemsById(itemId);
        const item = found.length === 1 ? await found[0].page.getPageItemAt(found[0].index) : undefined;
        let problem = '';
        if (found.length > 1) {
            problem = `the id is used by ${found.length} items of this panel`;
        } else if (!item) {
            problem = 'this panel has no such item';
        } else if (item.usesScreensaverTimer) {
            problem =
                "the item itself uses the timer of the screensaver, that is a circle: remove 'use the timer of the screensaver' from the item or choose another source";
        } else if (!item.isCountdownSource()) {
            problem = 'the item shows no countdown (alarm clock or display without STATUS)';
        }
        if (problem || !item) {
            this.log.warn(
                `Screensaver '${this.name}' of panel '${this.basePanel.friendlyName || this.basePanel.name}': timer from page item '${itemId}' is ignored: ${problem}.`,
            );
            this.clockTimer = undefined;
            await item?.delete();
            return;
        }
        this.timerItem = item;
        await item.useAsClockTimerSource(this.onTimerItemChange);
    }

    private onTimerItemChange = (): void => {
        this.clockTimerListeners.forEach(listener => listener());
        void this.onStateTriggerSuperDoNotOverride('timer', this);
    };

    /**
     * ends the subscriptions by pattern
     */
    private async releaseTimerPatterns(): Promise<void> {
        const patterns = this.timerPatterns;
        this.timerPatterns = [];
        for (const pattern of patterns) {
            try {
                await this.controller.statesControler.unsubscribePattern(pattern, this.onTimerPatternState);
            } catch (err: unknown) {
                this.log.debug(`Timer: unsubscribe of ${pattern} failed: ${String(err)}`);
            }
        }
    }

    /**
     * takes the value of a slot state; a slot of which both states are deleted is gone
     *
     * @param id state id
     * @param state the state, null when it was deleted
     * @returns true when something changed
     */
    private applyTimerPatternState(id: string, state: Types.nsPanelState | ioBroker.State | null): boolean {
        const [activePattern, dataPattern] = this.timerPatterns;
        const val: unknown = state ? state.val : undefined;
        let changed = false;
        for (const [pattern, field] of [
            [activePattern, 'activeVal'],
            [dataPattern, 'dataVal'],
        ] as const) {
            const key = timerSlotKey(pattern, id);
            if (key === undefined) {
                continue;
            }
            let source = this.timerSources.get(key);
            if (!source) {
                if (val === undefined) {
                    continue;
                }
                source = {
                    activeId: activePattern.replace('*', key),
                    dataId: dataPattern.replace('*', key),
                    activeVal: undefined,
                    dataVal: undefined,
                };
                this.timerSources.set(key, source);
            }
            if (source[field] !== val) {
                source[field] = val;
                changed = true;
            }
            if (source.activeVal === undefined && source.dataVal === undefined) {
                this.timerSources.delete(key);
            }
        }
        return changed;
    }

    private onTimerPatternState = (id: string, state: Types.nsPanelState | ioBroker.State | null): void => {
        // a state matched by another subscription as well can arrive twice
        if (this.applyTimerPatternState(id, state)) {
            this.clockTimerListeners?.forEach(listener => listener());
            void this.onStateTriggerSuperDoNotOverride(id, this);
        }
    };

    /**
     * the values of the two states of a simple timer; the trigger follows
     *
     * @param dp state id
     * @param state old and new state
     * @param state.old old state
     * @param state.new new state
     */
    async onStateChange(dp: string, state: { old: Types.nsPanelState; new: Types.nsPanelState }): Promise<void> {
        const source = this.timerSources?.get('');
        if (source?.activeId === dp) {
            source.activeVal = state.new.val;
        }
        if (source?.dataId === dp) {
            source.dataVal = state.new.val;
        }
        if (source?.activeId === dp || source?.dataId === dp) {
            this.clockTimerListeners?.forEach(listener => listener());
        }
        return Promise.resolve();
    }

    /**
     * unit and kind of a data state, read once
     *
     * @param id data state
     * @returns what the object says
     */
    private async timerCommonOf(id: string): Promise<{ unit?: string; countdownState: boolean }> {
        const known = this.timerCommon.get(id);
        if (known) {
            return known;
        }
        const obj = await this.controller.statesControler.getObjectAsync(id);
        if (!obj || obj.type !== 'state') {
            return { countdownState: false };
        }
        const common = { unit: obj.common.unit, countdownState: isCountdownCommon(obj.common) };
        this.timerCommon.set(id, common);
        return common;
    }

    /**
     * The next memory of all slots, the current one stays as it is.
     *
     * @param now current time in ms
     * @returns the memory per slot and whether a new timer began
     */
    private async evaluateTimerSlots(now: number): Promise<{ memory: Map<string, TimerSlotMemory>; started: boolean }> {
        const memory = new Map<string, TimerSlotMemory>();
        let started = false;
        if (this.timerItem) {
            const key = 'item';
            const step = stepTimerItem(this.timerMemory.get(key), await this.timerItem.getCountdownView());
            memory.set(key, step.memory);
            return { memory, started: step.started };
        }
        for (const [key, source] of this.timerSources) {
            const common = await this.timerCommonOf(source.dataId);
            const step = stepTimerSlot(
                this.timerMemory.get(key),
                {
                    on: isTimerOn(source.activeVal),
                    value: source.dataVal,
                    unit: common.unit,
                    countdownState: common.countdownState,
                },
                now,
            );
            memory.set(key, step.memory);
            started = started || step.started;
        }
        return { memory, started };
    }

    /**
     * What a page item of this panel can do with the timer (`useScreensaverTimer`). Only reads: the evaluation of the
     * display - and with it a tapped away timer and the sending of the display - stays with {@link refreshTimer}.
     *
     * @returns undefined when this screensaver has no usable timer
     */
    async getClockTimerAccess(): Promise<ClockTimerAccess | undefined> {
        if (!this.clockTimer) {
            return undefined;
        }
        const now = Date.now();
        const { memory } = await this.evaluateTimerSlots(now);
        const selection = selectTimer(memory, now);
        if (this.timerItem) {
            const view = await this.timerItem.getCountdownView();
            return {
                selection,
                ticking: nextTimerWakeMs(memory, selection, false, now) !== undefined,
                canStart: view.status === 'off' && view.canStart,
                canStop: view.status !== 'off' && view.canStop,
            };
        }
        const shown = selection.key === undefined ? undefined : this.timerSources.get(selection.key);
        const free = await this.findTimerStartSlot();
        return {
            selection,
            ticking: nextTimerWakeMs(memory, selection, false, now) !== undefined,
            canStart: !!free && free.activeCommon.write !== false && free.dataCommon.write !== false,
            canStop: !!shown && (await this.timerStateCommon(shown.activeId))?.write !== false,
        };
    }

    /**
     * Starts the timer in the lowest free slot: first the data, so that switching on never sees the old one.
     *
     * @param seconds duration
     * @returns true when it was written
     */
    async startClockTimer(seconds: number): Promise<boolean> {
        if (this.timerItem) {
            return this.timerItem.startAsClockTimerSource(seconds);
        }
        const slot = await this.findTimerStartSlot();
        if (!slot || seconds <= 0 || slot.activeCommon.write === false || slot.dataCommon.write === false) {
            return false;
        }
        const value = timerStartValue(slot.dataCommon, seconds, Date.now());
        return (
            (await this.writeTimerState(slot.source.dataId, value)) &&
            (await this.writeTimerState(slot.source.activeId, timerActiveValue(slot.activeCommon, true)))
        );
    }

    /**
     * Switches off the slot that is shown.
     *
     * @returns true when it was written
     */
    async stopClockTimer(): Promise<boolean> {
        if (this.timerItem) {
            return this.timerItem.stopAsClockTimerSource();
        }
        const access = await this.getClockTimerAccess();
        const shown = access?.selection.key === undefined ? undefined : this.timerSources.get(access.selection.key);
        const common = shown && (await this.timerStateCommon(shown.activeId));
        if (!shown || !common || common.write === false) {
            return false;
        }
        return this.writeTimerState(shown.activeId, timerActiveValue(common, false));
    }

    /**
     * A page item is told about every change of the states of the timer.
     *
     * @param listener called on a change, must not throw
     */
    addClockTimerListener(listener: () => void): void {
        this.clockTimerListeners.add(listener);
    }

    /**
     * @param listener as given to {@link addClockTimerListener}
     */
    removeClockTimerListener(listener: () => void): void {
        this.clockTimerListeners?.delete(listener);
    }

    /**
     * @returns the slot a start takes: the lowest one that is off and whose two states exist
     */
    private async findTimerStartSlot(): Promise<
        { source: TimerSource; activeCommon: ioBroker.StateCommon; dataCommon: ioBroker.StateCommon } | undefined
    > {
        for (const key of orderTimerSlotKeys(this.timerSources.keys())) {
            const source = this.timerSources.get(key);
            if (!source || isTimerOn(source.activeVal)) {
                continue;
            }
            const activeCommon = await this.timerStateCommon(source.activeId);
            const dataCommon = await this.timerStateCommon(source.dataId);
            if (activeCommon && dataCommon) {
                return { source, activeCommon, dataCommon };
            }
        }
        return undefined;
    }

    /**
     * @param id state id
     * @returns common of the state, undefined when it does not exist
     */
    private async timerStateCommon(id: string): Promise<ioBroker.StateCommon | undefined> {
        const obj = await this.controller.statesControler.getObjectAsync(id);
        return obj?.type === 'state' ? obj.common : undefined;
    }

    /**
     * @param id state id
     * @param value value to write, as a command - only states of the adapter are written confirmed
     * @returns false when it failed, that is logged
     */
    private async writeTimerState(id: string, value: ioBroker.StateValue): Promise<boolean> {
        try {
            await this.adapter.setForeignStateAsync(id, value, id.startsWith(`${this.adapter.namespace}.`));
            return true;
        } catch (err: unknown) {
            this.log.warn(`Timer: cannot write ${id}: ${String(err)}`);
            return false;
        }
    }

    /**
     * Evaluates all slots for now. A new timer, or another slot on the display, brings a tapped away timer back.
     *
     * @returns what the display has to show
     */
    private async refreshTimer(): Promise<TimerSelection> {
        if (!this.clockTimer) {
            return TIMER_OFF;
        }
        const now = Date.now();
        const { memory, started } = await this.evaluateTimerSlots(now);
        this.timerMemory = memory;
        const selection = selectTimer(this.timerMemory, now);
        if (
            started ||
            selection.status === 'off' ||
            (selection.key !== undefined && selection.key !== this.timerSelection.key)
        ) {
            this.timerTappedAway = false;
        }
        this.timerSelection = selection;
        return selection;
    }

    /**
     * a state of the timer changed: without a timer before and after it there is nothing to send
     */
    private async onTimerStatesChanged(): Promise<void> {
        const before = this.timerSelection.status;
        const selection = await this.refreshTimer();
        if (before !== 'off' || selection.status !== 'off') {
            await this.HandleTime();
        }
    }

    private clearTimerTick(): void {
        if (this.timerTick) {
            this.adapter.clearTimeout(this.timerTick);
            this.timerTick = undefined;
        }
    }

    /**
     * Wakes up for the next change of the display that comes without a state change.
     *
     * @param selection what the display shows
     */
    private scheduleTimerTick(selection: TimerSelection): void {
        this.clearTimerTick();
        if (!this.visibility || this.unload || this.adapter.unload) {
            return;
        }
        const wait = nextTimerWakeMs(this.timerMemory, selection, this.timerTappedAway, Date.now());
        if (wait !== undefined) {
            this.timerTick = this.adapter.setTimeout(() => {
                this.timerTick = undefined;
                void this.HandleTime();
            }, wait);
        }
    }

    /**
     * Build the screensaver message for requested places (order-preserving, parallel).
     *
     * - Runs only for screensaver cards.
     * - Keeps configured order by collecting (place, index, payload) and sorting by index per place.
     * - Numeric `enabled` → overwrite by index; boolean `enabled=false` → skip.
     *
     * @param places Places to include in the message.
     */
    async getData(places: NSPanel.ScreenSaverPlaces[]): Promise<pages.screensaverMessage | null> {
        const config = this.config;
        if (!config || !globals.isScreenSaverCardType(config.card)) {
            return null;
        }

        const message: pages.screensaverMessage = {
            options: {
                indicator: [],
                left: [],
                time: [],
                date: [],
                bottom: [],
                mricon: [],
                favorit: [],
                alternate: [],
                notify: [],
            },
        };
        const overwrite: Record<NSPanel.ScreenSaverPlaces, string[]> = {
            indicator: [],
            left: [],
            time: [],
            date: [],
            bottom: [],
            mricon: [],
            favorit: [],
            alternate: [],
            notify: [],
        };

        if (!this.pageItems) {
            return message;
        }

        const model = 'model' in config ? config.model : 'eu';
        const layout = this.mode;

        type AppendResult = { kind: 'append'; place: NSPanel.ScreenSaverPlaces; idx: number; payload: string };
        type OverwriteResult = {
            kind: 'overwrite';
            place: NSPanel.ScreenSaverPlaces;
            enabledIndex: number;
            payload: string;
        };
        type FillerResult = { kind: 'filler'; place: NSPanel.ScreenSaverPlaces; idx: number; payload: string };
        type Result = AppendResult | OverwriteResult | FillerResult | null;

        // Collect results in parallel, but tagged with original index
        const results: Result[] = await Promise.all(
            this.pageItems.map(async (pageItem, idx): Promise<Result> => {
                const place = pageItem?.config?.modeScr;
                if (!place) {
                    return null;
                }

                if (place === 'alternate' && this.mode !== 'alternate') {
                    return null;
                }
                if (!places.includes(place)) {
                    return null;
                }

                const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
                if (max === 0) {
                    return null;
                }

                // Overwrite via numeric enabled index
                if (place !== 'notify') {
                    const enabledNum = await tools.getEnabledNumber(pageItem.dataItems?.data?.enabled);
                    if (enabledNum != null) {
                        if (enabledNum >= 0) {
                            const payload = await pageItem.getPageItemPayload();
                            if (payload !== '') {
                                return { kind: 'overwrite', place, enabledIndex: enabledNum, payload };
                            }
                        }
                        return null;
                    }
                }

                // Skip via boolean enabled=false
                const enabledBool = await pageItem.isEnabled();
                if (enabledBool === false) {
                    if (pageItem.config?.fillIfBelowMin) {
                        const payload = await pageItem.getPageItemPayload(true);
                        return { kind: 'filler', place, idx, payload };
                    }
                    return null;
                }

                // Default: append with original index
                const payload = await pageItem.getPageItemPayload();
                return { kind: 'append', place, idx, payload };
            }),
        );

        // Apply overwrites and collect appends/fillers grouped by place
        const combinedByPlace: Record<
            NSPanel.ScreenSaverPlaces,
            Array<{ idx: number; payload: string; isFiller: boolean }>
        > = {
            indicator: [],
            left: [],
            time: [],
            date: [],
            bottom: [],
            mricon: [],
            favorit: [],
            alternate: [],
            notify: [],
        };

        for (const r of results) {
            if (!r) {
                continue;
            }
            if (r.kind === 'overwrite') {
                overwrite[r.place][r.enabledIndex] = r.payload;
            } else {
                combinedByPlace[r.place].push({ idx: r.idx, payload: r.payload, isFiller: r.kind === 'filler' });
            }
        }

        // Build message.options per place in original order, then apply overwrites
        for (const key in message.options) {
            const place = key as NSPanel.ScreenSaverPlaces;
            if (!places.includes(place)) {
                continue;
            }

            const maxForFill =
                Definition.ScreenSaverConst[layout][place].maxEntries[model] ??
                Definition.ScreenSaverConst[layout][place].maxEntries.eu;

            // Sort all candidates by original index
            const combined = combinedByPlace[place].sort((a, b) => a.idx - b.idx);
            const regularCount = combined.filter(e => !e.isFiller).length;
            // How many fillers are needed to reach max
            let fillersLeft = Math.max(0, maxForFill - regularCount);

            // Insert items in original order; fillers only where there is still a slot needed
            for (const entry of combined) {
                if (entry.isFiller) {
                    if (fillersLeft > 0) {
                        message.options[place].push(entry.payload);
                        fillersLeft--;
                    }
                } else {
                    message.options[place].push(entry.payload);
                }
            }

            // Apply overwrites (sparse assignment is fine)
            Object.assign(message.options[place], overwrite[place]);

            // Windowing/paging
            let max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
            if (max == null) {
                max = Definition.ScreenSaverConst[layout][place].maxEntries.eu;
            }
            if (place === 'notify') {
                message.options[place] = message.options[place].filter(n => n && n !== '~~~~~');
                max = message.options[place].length;
            }
            let items = message.options[place] || [];
            if (items.length > max) {
                const windows = Math.ceil(items.length / max);
                const windowIdx = this.step % windows;
                items = items.slice(max * windowIdx, max * (windowIdx + 1));
                message.options[place] = items;
            }

            // Normalize payload fields per slot
            for (let i = 0; i < max; i++) {
                const msg = message.options[place][i];
                if (!msg) {
                    message.options[place][i] = tools.getPayload('', '', '', '', '', '');
                } else {
                    const arr = msg.split('~');
                    arr[0] = '';
                    if (place !== 'indicator' && place !== 'notify') {
                        arr[1] = '';
                    }
                    if (place !== 'notify' && arr.length > 2 && !this.readsIconFont(place)) {
                        // only screensaver5 reads the font suffix of an icon, the other pages would show it
                        arr[2] = tools.stripIconFontSuffix(arr[2]);
                    }
                    message.options[place][i] = tools.getPayloadArrayRemoveTilde(arr);
                }
            }
        }

        return message;
    }

    /**
     * Send (or clear) a screensaver notification to the panel if the panel is online.
     *
     * @param enabled When true, send heading + text; otherwise clear the notify.
     */
    public sendNotify(enabled: boolean): void {
        if (!this.basePanel.isOnline) {
            return;
        }
        this.customNotification = enabled && (this.headingNotification !== '' || this.textNotification !== '');

        void this.HandleNotification();
    }

    #sendNotify(enabled: boolean, heading: string = '', text: string = ''): void {
        if (!this.basePanel.isOnline) {
            return;
        }
        const wasActive = this.activeNotification;
        this.activeNotification = enabled && (heading !== '' || text !== '');
        // no notification is what the HMI starts with: an empty message only clears one that was shown
        if (!this.activeNotification && !wasActive) {
            return;
        }

        if (this.sendIfChanged('notify', this.notifyPayload(this.activeNotification, heading, text))) {
            this.notifyHidden = false;
        }
        if (!this.activeNotification) {
            this.resendDropped();
        }
    }

    private notifyPayload(enabled: boolean, heading: string, text: string): string {
        return enabled ? tools.getPayloadRemoveTilde('notify', heading, text) : tools.getPayload('notify', '', '');
    }

    /**
     * Sends a message of a filtered type when it differs from the last one of that type.
     *
     * @param kind type of the message
     * @param payload the message
     * @returns true when it was sent
     */
    private sendIfChanged(kind: FilteredMessage, payload: string): boolean {
        if (this.lastSent.get(kind) === payload) {
            return false;
        }
        this.lastSent.set(kind, payload);
        // this memory decides, the filter of the base class only knows the very last message of any type
        super.resetLastMessage();
        this.sendToPanel(payload, false);
        return true;
    }

    /**
     * Sends again what the HMI dropped while a notification was shown (`tNotifyHead`/`tNotifyText` not empty): the
     * memory holds these messages as sent. Only useful as soon as the notification is gone from the display.
     */
    private resendDropped(): void {
        const weather = this.lastSent.get('weatherUpdate');
        if (this.weatherDropped && weather !== undefined) {
            this.lastSent.delete('weatherUpdate');
            this.weatherDropped = false;
            this.sendWeather(weather);
        }
        if (this.colorsDropped) {
            this.lastSent.delete('color');
            this.sendColors();
        }
    }

    private sendWeather(payload: string): void {
        if (this.sendIfChanged('weatherUpdate', payload)) {
            this.weatherDropped = this.dropsValues();
        }
    }

    /**
     * Any touch makes the HMI clear a notification by itself (`tc0` press, unless the display is off) - and the adapter
     * only hears of `bExit` or of the indicator. The notification stays active here and is not sent again: it comes
     * back with the next `pageType~` or a new content. What the HMI dropped behind it can go out now. With a standby
     * brightness of 0 the touch may have hit a dark display and cleared nothing: then what follows still counts as
     * dropped and is repeated with the next touch or the end of the notification.
     */
    private onTouch(): void {
        if (!this.activeNotification) {
            return;
        }
        const dim = this.basePanel.dim;
        this.notifyHidden = (dim.dayMode ? dim.standby : dim.nightStandby) > 0;
        this.resendDropped();
    }

    /**
     * @returns true while the HMI drops `weatherUpdate` and `color~`
     */
    private dropsValues(): boolean {
        return this.activeNotification && !this.notifyHidden;
    }

    /**
     * The memory of the filtered messages goes with the one of the base class.
     */
    resetLastMessage(): void {
        super.resetLastMessage();
        this.lastSent.clear();
    }

    /**
     * A wanted `pageType~` must reach the panel, also when it is the last message: nothing else was sent since then.
     *
     * @param force see {@link Page.sendType}
     */
    sendType(force?: boolean): void {
        if (force || this.basePanel.lastCard !== this.card) {
            super.resetLastMessage();
        }
        super.sendType(force);
    }

    /**
     * Every `pageType~` loads the page again on the HMI: empty values, default colors and no notification
     * (`vscope` 0, `txt` empty in tNotifyHead and tNotifyText, `load` hides both), whoever asked for it.
     * Everything follows with the next update(), each way that sends a pageType runs one.
     *
     * @param payload the message
     * @param ackForType see {@link BaseTriggeredPage.sendToPanelClass}
     * @param force see {@link BaseTriggeredPage.sendToPanelClass}
     * @param opt see {@link BaseTriggeredPage.sendToPanelClass}
     */
    protected sendToPanelClass(
        payload: string,
        ackForType: boolean,
        force?: boolean,
        opt?: IClientPublishOptions,
    ): void {
        if (payload.startsWith('pageType~')) {
            this.lastSent.clear();
            this.activeNotification = false;
            this.colorsDropped = false;
            this.weatherDropped = false;
            this.lastTimerPayload = '';
            this.notifyHidden = false;
            this.lastUpdateTs = 0;
            this.timeAfterRender = true;
        }
        super.sendToPanelClass(payload, ackForType, force, opt);
    }

    /** Current info icon (readonly property wrapper). */
    get infoIcon(): string {
        return this._infoIcon;
    }

    /**
     * Update the info icon and trigger time handling refresh.
     */
    set infoIcon(infoIcon: string) {
        this._infoIcon = infoIcon;
        void this.HandleTime();
    }

    /**
     * Update the screensaver view with data for selected places.
     * - Prepends an empty payload to 'alternate' if it contains entries
     * - Sends a 'weatherUpdate' payload with concatenated place arrays and the colors, only when they changed: the same
     *   content sends nothing and starts no pause
     * - At most one burst every 2 s: a change arriving earlier waits for one deferred update, which reads the values
     *   again. Time/date updates are not affected, a press on an item ends the pause.
     * - Status icons and notifications come along with every update that is not deferred, only when they changed.
     * - After a `pageType~` the order is `color~` (draws the empty page with its background), `weatherUpdate~`,
     *   `time~` and then everything else.
     */
    async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        const run = ++this.updateRun;
        await super.update();

        const message = await this.getData(['left', 'bottom', 'indicator', 'alternate', 'favorit']);
        if (run !== this.updateRun || !this.visibility) {
            // a newer update takes over, also the time after a pageType
            return;
        }
        if (message === null) {
            await this.sendTimeAfterRender();
            return;
        }

        if (message.options.alternate.length > 0) {
            message.options.alternate.unshift(tools.getPayload('', '', '', '', '', ''));
        }

        const arr: string[] = [
            ...(message.options.favorit || []),
            ...(message.options.left || []),
            ...(message.options.bottom || []),
            ...(message.options.alternate || []),
            ...(message.options.indicator || []),
        ];

        const msg = tools.getPayload('weatherUpdate', tools.getPayloadArray(arr));
        if (this.lastSent.get('weatherUpdate') !== msg || this.lastSent.get('color') !== this.colorPayload()) {
            const now = Date.now();
            const wait = this.lastUpdateTs + Screensaver.minUpdateInterval - now;
            if (wait > 0) {
                if (!this.updateThrottle && !this.unload && !this.adapter.unload) {
                    this.updateThrottle = this.adapter.setTimeout(() => {
                        this.updateThrottle = undefined;
                        void this.update();
                    }, wait);
                }
                await this.sendTimeAfterRender();
                return;
            }
            this.lastUpdateTs = now;
            // the color first: with a colored background it draws the whole page - on the empty page that is cheap
            this.sendColors();
            this.sendWeather(msg);
        }
        await this.sendTimeAfterRender();
        // not all of their data has a trigger: the filter of these messages sends only what changed
        await this.HandleScreensaverStatusIcons();
        await this.HandleNotification();
    }

    /**
     * Sends `time~` once after a `pageType~`, see {@link timeAfterRender}.
     */
    private async sendTimeAfterRender(): Promise<void> {
        if (!this.timeAfterRender) {
            return;
        }
        this.timeAfterRender = false;
        await this.HandleTime();
    }

    public async createPageItems(
        pageItemsConfig: (NSPanel.PageItemDataItemsOptions | undefined)[] | undefined,
    ): Promise<(PageItem | undefined)[] | undefined> {
        return await super.createPageItems(pageItemsConfig);
    }

    public sendColors(): void {
        const colorPayload = this.colorPayload();
        this.colorTimerStatus = this.timerSelection?.status ?? 'off';
        this.colorTimerShown = this.isTimerShown();
        if (this.sendIfChanged('color', colorPayload)) {
            this.colorsDropped = this.dropsValues();
        }
    }

    private colorPayload(): string {
        return `color~${Color.rgb_dec565(Color.background as RGB)}~${
            Color.rgb_dec565(this.timeColor()) // tTime
        }~${
            Color.rgb_dec565(Color.fgTimeAmPm as RGB) // timeAMPM
        }~${
            Color.rgb_dec565(Color.fgDate as RGB) // tDate
        }~${
            Color.rgb_dec565(Color.fgMain as RGB) // tMainText
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast1
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast2
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast3
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast4
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast1Val
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast2Val
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast3Val
        }~${
            Color.rgb_dec565(Color.fgForecast as RGB) // tForecast4Val
        }~${
            Color.rgb_dec565(Color.fgBar as RGB) // bar
        }~${
            Color.rgb_dec565(Color.fgMainAlt as RGB) // tMainTextAlt2
        }~${
            Color.rgb_dec565(this.timeAddColor()) // tTimeAdd
        }`;
    }

    /**
     * @returns color of the info icon: the timer overrides it as long as it is active
     */
    private timeAddColor(): RGB {
        switch (this.timerSelection?.status) {
            case 'running':
            case 'paused':
                return Color.Orange;
            case 'expired':
                return Color.Red;
            default:
                return Color.fgTimeAdd as RGB;
        }
    }

    /**
     * @returns color of the time: the one of the timer while it is on the display - after a tap to the clock only the
     * icon keeps it
     */
    private timeColor(): RGB {
        return this.isTimerShown() ? this.timeAddColor() : (Color.fgTime as RGB);
    }

    /**
     * @returns true while the display shows the timer instead of the clock
     */
    private isTimerShown(): boolean {
        const status = this.timerSelection?.status ?? 'off';
        return status !== 'off' && !this.timerTappedAway;
    }

    async onVisibilityChange(v: boolean): Promise<void> {
        //await super.onVisibilityChange(v);
        this.step = 0;
        if (v) {
            // a freshly shown screensaver must be rendered immediately and completely
            this.lastUpdateTs = 0;
            this.resetLastMessage();
            this.timerTappedAway = false;
            this.lastTimerTap = 0;
            this.lastTimerPayload = '';
            // also without a pageType (same card as before) the time follows the content of the update
            this.timeAfterRender = true;
            this.sendType();
            await this.restartRotationLoop();
            // in case the update could not send it
            await this.sendTimeAfterRender();
        } else {
            if (this.timeoutRotation) {
                this.adapter.clearTimeout(this.timeoutRotation);
            }
            this.clearTimerTick();
        }
    }
    async restartRotationLoop(): Promise<void> {
        if (this.timeoutRotation) {
            this.adapter.clearTimeout(this.timeoutRotation);
        }
        await this.rotationLoop();
    }
    rotationLoop = async (): Promise<void> => {
        // only use this if screensaver is activated
        if (!this.visibility) {
            return;
        }
        await this.update();

        if (this.rotationTime === 0) {
            this.step = 0;
            return;
        }
        this.step = this.step > 10_000 ? 0 : this.step + 1;
        if (this.unload || this.adapter.unload) {
            return;
        }
        this.timeoutRotation = this.adapter.setTimeout(
            this.rotationLoop,
            this.rotationTime < 3000 ? 3000 : this.rotationTime,
        );
    };

    /**
     * ..
     *
     * @param _dp - the dp that triggered the state
     * @param from - the class that triggered the state
     */
    onStateTrigger = async (_dp: string, from: BaseTriggeredPage): Promise<void> => {
        const config = this.config;
        if (!config || !globals.isScreenSaverCardType(config.card)) {
            return;
        }
        if (from === this) {
            await this.onTimerStatesChanged();
            return;
        }
        if (from instanceof PageItem && this.pageItems) {
            const index = parseInt(from.id.split('?')[1]);
            const item = this.pageItems[index];
            if (item && item.config) {
                const place = item.config.modeScr;
                if (place !== undefined) {
                    switch (place) {
                        case 'left':
                        case 'bottom':
                        case 'indicator':
                        case 'alternate':
                        case 'favorit': {
                            await this.update();
                            break;
                        }
                        case 'mricon': {
                            await this.HandleScreensaverStatusIcons();
                            break;
                        }
                        case 'time': {
                            await this.HandleTime();
                            break;
                        }
                        case 'date': {
                            await this.HandleDate();
                            break;
                        }
                        case 'notify': {
                            await this.HandleNotification();
                            break;
                        }
                    }
                }
            }
        }
    };
    async HandleTime(): Promise<void> {
        if (this.basePanel.isOnline === false) {
            return;
        }
        const timer = await this.refreshTimer();
        const timerActive = timer.status !== 'off';
        if (timerActive && !this.visibility) {
            // onVisibilityChange brings it up to date
            return;
        }
        const showTimer = timerActive && !this.timerTappedAway;
        let text = timer.text;
        if (!showTimer) {
            const message = await this.getData(['time']);

            if (message === null || !message.options.time[0]) {
                this.log.debug('HandleTime: no message, no time or panel is offline');
                return;
            }
            text = message.options.time[0].split('~')[5];
        }
        let icon = `${this.infoIcon ? `~${Icons.GetIcon(this.infoIcon)}` : ''}`;
        if (timerActive) {
            // stays while the timer is active, also after a tap to the clock - before everything else
            const iconName =
                timer.status === 'expired' ? 'timer-alert' : timer.status === 'paused' ? 'timer-pause' : 'timer-sand';
            icon = `~${Icons.GetIcon(iconName)}`;
        } else if (this.basePanel.isVirtual) {
            // a web panel has no TFT firmware - no development and no update symbol
        } else if (this.basePanel.info.nspanel.displayVersion === '0.0.0') {
            // only for development firmware
            if (!this.adapter.config.hideDeveloperSymbols) {
                icon = `~${Icons.GetIcon('cog-refresh-outline')}`;
            }
        } else if (!icon && this.basePanel.info.nspanel.onlineVersion !== this.basePanel.info.nspanel.displayVersion) {
            // only for newer firmwares
            icon = `~${Icons.GetIcon('wrench-clock')}`;
        }

        // time and icon get their color from color~, only sent when it changes: with the same background the HMI just
        // sets the font colors of its elements, the page is not drawn again
        const colorsChanged =
            !!this.clockTimer &&
            this.visibility &&
            (this.colorTimerStatus !== timer.status || this.colorTimerShown !== showTimer);
        const payload = `time~${text}${icon}`;
        this.scheduleTimerTick(timer);
        // the way to the clock: first the color, no moment of an orange or red clock
        if (colorsChanged && !showTimer) {
            this.sendColors();
        }
        if (!showTimer || payload !== this.lastTimerPayload) {
            this.lastTimerPayload = showTimer ? payload : '';
            this.sendToPanel(payload, false);
        }
        // a timer on the display: first the text, at its end 0.1 must not turn red before it shows 0.0
        if (colorsChanged && showTimer) {
            this.sendColors();
        }
    }
    async HandleDate(): Promise<void> {
        if (this.basePanel.isOnline === false) {
            return;
        }
        const message = await this.getData(['date']);
        if (message === null || !message.options.date[0]) {
            this.log.debug('HandleDate: no message, no date or panel is offline');
            return;
        }
        this.sendToPanel(`date~${message.options.date[0].split('~')[5]}`, false);
    }

    async HandleScreensaverStatusIcons(): Promise<void> {
        if (!this.visibility) {
            return;
        }

        const message = await this.getData(['mricon']);
        if (message === null) {
            return;
        }
        const mrIcon1 = (message.options.mricon[0] ?? '').split('~');
        const mrIcon2 = (message.options.mricon[1] ?? '').split('~');
        const msgArray: string[] = [
            'statusUpdate',
            mrIcon1[2] ?? '',
            mrIcon1[3] ?? '',
            mrIcon2[2] ?? '',
            mrIcon2[3] ?? '',
            this.basePanel.info.nspanel.bigIconLeft ? '1' : '',
            this.basePanel.info.nspanel.bigIconRight ? '1' : '',
        ];
        const msg = tools.getPayloadArrayRemoveTilde(msgArray);
        this.sendIfChanged('statusUpdate', msg);
    }

    async HandleNotification(): Promise<void> {
        if (this.basePanel.isOnline === false) {
            return;
        }
        const message = await this.getData(['notify']);
        if (message === null) {
            return;
        }
        // only use valid notify entries
        // format: type~int~icon~color~heading<sp!it>prio~text
        // lower prio = higher priority
        const notifyList = message.options.notify
            .map(n => n.split('~'))
            .filter(n => n[4] !== '' || n[5] !== '')
            .map(n => {
                const s = n[5].split('<sp!it>');
                const { heading, text } = screensaverNotifyLines({ icon: n[2], headline: s[0], text: n[4] });
                const prio = !isNaN(parseInt(s[1], 10)) ? parseInt(s[1], 10) : 99;
                const buzzer = s[2];
                const id = n[1];
                return { heading, text, prio, id, buzzer };
            })
            .sort((a, b) => (a.prio === b.prio ? 0 : a.prio > b.prio ? 1 : -1));

        if (this.customNotification === true) {
            this.#sendNotify(this.customNotification, this.headingNotification, this.textNotification);
        } else if (notifyList.length > 0) {
            const heading = notifyList[0].heading;
            const text = notifyList[0].text;
            if (heading !== '' || text !== '') {
                // the same text after a touch is no news
                if (
                    this.activeNotifyId != notifyList[0].id &&
                    this.lastSent.get('notify') !== this.notifyPayload(true, heading, text) &&
                    notifyList[0].buzzer &&
                    this.basePanel.dim.dayMode &&
                    this.basePanel.isBuzzerAllowed
                ) {
                    this.basePanel.sendToTasmota(`${this.basePanel.topic}/cmnd/Buzzer`, notifyList[0].buzzer.trim());
                }
                this.activeNotifyId = notifyList[0].id;
                this.#sendNotify(true, heading, text);
            }
        } else {
            this.activeNotifyId = '';
            this.#sendNotify(false);
        }
    }

    async setGlobalNotificationDismiss(id: string): Promise<void> {
        if (!id) {
            return;
        }
        for (const item of this.pageItems || []) {
            if (item && item.config?.role === 'isDismissiblePerEvent') {
                const gId = item.getGlobalDismissibleID();
                if (gId === id && (await item.isEnabled())) {
                    item.setDismissiblePerEvent();
                }
            }
        }
        await this.HandleNotification();
    }

    async deactivateNotify(): Promise<boolean> {
        if (this.activeNotifyId) {
            const id = this.activeNotifyId.split('?')[1];
            if (id && !isNaN(parseInt(id, 10))) {
                const item = this.pageItems?.[parseInt(id, 10)];
                if (item && item.config?.role === 'isDismissiblePerEvent') {
                    item.setDismissiblePerEvent();
                    const globalId = item.getGlobalDismissibleID();
                    if (globalId) {
                        await this.controller.setGlobalNotificationDismiss(globalId);
                    }
                }
            }
            this.activeNotifyId = '';
            await this.HandleNotification();
            return true;
        }
        return false;
    }

    /**
     * The first tap on a shown timer switches to the clock: no gesture, no notification, no page change. Taps of the
     * same double click that follow are swallowed, see {@link Screensaver.timerTapWindow}.
     *
     * @param action action of the event
     * @param opt taps counted by the HMI
     * @returns true when the tap is done
     */
    async onTimerTap(action: string, opt: string): Promise<boolean> {
        // the first thing the panel does with each touch of the screensaver itself
        this.onTouch();
        if (action !== 'bExit' || !this.clockTimer) {
            return false;
        }
        const now = Date.now();
        const timer = await this.refreshTimer();
        if (timer.status !== 'off' && !this.timerTappedAway) {
            this.timerTappedAway = true;
            this.lastTimerTap = now;
            await this.HandleTime();
            // the HMI clears a notification by itself with every touch - it was not dismissed
            this.lastSent.delete('notify');
            await this.HandleNotification();
            return true;
        }
        if (
            this.basePanel.screenSaverDoubleClick &&
            now - this.lastTimerTap < Screensaver.timerTapWindow &&
            parseInt(opt) > 1
        ) {
            this.lastTimerTap = now;
            return true;
        }
        return false;
    }

    async onScreensaverTap(): Promise<boolean> {
        const result = await this.deactivateNotify();
        if (result) {
            return true;
        }
        return false;
    }

    /**
     * A tap on a screensaver item (`event,buttonPress2,<page>?<n>,button`) is handled by
     * {@link onButtonEvent} alone: it writes `buttons.indicator-N` and runs the command of the item
     * once. The base implementation would run the command here already - with the option
     * "indicators act as buttons" off that navigates to the main page before the panel reaches
     * `onButtonEvent` of this page (the indicator state was never written), with the option on the
     * command ran twice (a switch was flipped back at once). Everything else (popups) stays as is.
     *
     * @param id item id
     * @param popup popup type
     * @param action button action
     * @param value value of the action
     * @param event the incoming event
     */
    public async onPopupRequest(
        id: number | string,
        popup: Types.PopupType | undefined,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        action: Types.ButtonActionType | undefined | string,
        value: string | undefined,
        event: Types.IncomingEvent | null = null,
    ): Promise<void> {
        if (action === 'button') {
            return;
        }
        // a blind on the screensaver shows its position only - it opens no shutter popup
        if (
            (popup === 'popupShutter' || popup === 'popupShutter2') &&
            this.pageItems?.[Number(id)]?.dataItems?.role === 'blind'
        ) {
            return;
        }
        await super.onPopupRequest(id, popup, action, value, event);
    }

    async onButtonEvent(event: Types.IncomingEvent): Promise<void> {
        // page is the index of the page in the configuration - 0 is a valid page (screensaver first)
        if (event.page !== undefined && event.id && this.pageItems && this.pageItems[event.id as any]) {
            if (this.blockButtons || this.unload || this.adapter.unload) {
                return;
            }
            // before the first await: the HMI repeats a tap on an indicator when the finger is lifted
            this.blockButtons = this.adapter.setTimeout(() => {
                this.blockButtons = undefined;
            }, 500);
            this.onTouch();
            // the result of this press goes out at once, also with a burst or a trigger just before it
            this.lastUpdateTs = 0;
            await this.releaseTriggerThrottle();
            await this.writeIndicatorButton(this.pageItems[event.id as any]);
            await this.pageItems[event.id as any]!.onCommand(event.action, event.opt);
        }
    }

    /**
     * Writes `buttons.indicator-N` for an indicator item (nothing for other items)
     *
     * @param item the tapped item
     */
    private async writeIndicatorButton(item: PageItem | undefined): Promise<void> {
        if (!item || !this.pageItems) {
            return;
        }
        const indicators = this.pageItems.filter(x => x && x.config && x.config.modeScr === 'indicator');
        for (let a = 0; a < indicators.length; a++) {
            if (indicators[a] === item) {
                await this.library.writedp(
                    `panels.${this.basePanel.name}.buttons.indicator-${a + 1}`,
                    true,
                    Definition.genericStateObjects.panel.panels.buttons.indicator,
                );
            }
        }
    }

    /**
     * true for an event of an item of this screensaver (`<page>?<n>,button`)
     *
     * @param event the event of the panel
     */
    isIndicatorEvent(event: Types.IncomingEvent): boolean {
        return event.page !== undefined && !!event.id && !!this.pageItems?.[Number(event.id)];
    }

    /**
     * true when a tap on the indicator does something itself: an action of the item (button, switch, cycle, page) or,
     * with "indicators act as buttons", the state the item flips ({@link PageItem.onCommand}). A blind never moves.
     *
     * @param item the indicator item
     */
    isIndicatorKey(item: PageItem | undefined): boolean {
        const entry = item?.dataItems;
        if (!entry || (entry.type !== 'button' && entry.type !== 'switch')) {
            return false;
        }
        const data = entry.data;
        if (
            data.setNavi ||
            data.setValue1?.writeable ||
            data.setValue2?.writeable ||
            (entry.type === 'button' && data.setValue3?.writeable && data.valueList)
        ) {
            return true;
        }
        if (!this.screensaverIndicatorButtons || entry.role === 'blind') {
            return false;
        }
        return !!(
            data.entity1?.set?.writeable ||
            data.entity1?.value?.writeable ||
            (data.setTrue?.writeable && data.setFalse?.writeable) ||
            data.popup ||
            data.confirm
        );
    }

    /**
     * A short tap on a tile of the TFT 6.0.8+ (`<page>?<n>,button,<taps>`, the taps counted together with the
     * background): `buttons.indicator-N` is always written, a key runs its command.
     *
     * @param event the event of the panel
     * @returns true when the item is a key and ran its command, false: the caller treats the tap like a touch of the
     *     background
     */
    async onIndicatorTap(event: Types.IncomingEvent): Promise<boolean> {
        const item = this.pageItems?.[Number(event.id)];
        if (!item || this.unload || this.adapter.unload) {
            return false;
        }
        await this.writeIndicatorButton(item);
        if (!this.isIndicatorKey(item)) {
            return false;
        }
        this.onTouch();
        // the result of this press goes out at once, also with a burst or a trigger just before it
        this.lastUpdateTs = 0;
        await this.releaseTriggerThrottle();
        await item.onCommand(event.action, event.opt);
        return true;
    }

    async delete(): Promise<void> {
        await super.delete();
        if (this.timeoutRotation) {
            this.adapter.clearTimeout(this.timeoutRotation);
        }
        if (this.updateThrottle) {
            this.adapter.clearTimeout(this.updateThrottle);
        }
        if (this.blockButtons) {
            this.adapter.clearTimeout(this.blockButtons);
        }
        this.clearTimerTick();
        this.clockTimerListeners.clear();
        this.timerItem?.removeClockTimerSource(this.onTimerItemChange);
        this.timerItem = undefined;
        await this.releaseTimerPatterns();
    }
    goLeft(): void {}
    goRight(): void {}

    /**
     * true when the HMI page of this screensaver reads the font suffix `¬<id>` of the icons of a place:
     * screensaver5 (`tiles`) in its indicator fields
     *
     * @param place place of the items
     */
    private readsIconFont(place: NSPanel.ScreenSaverPlaces): boolean {
        return this.config?.card === 'screensaver5' && place === 'indicator';
    }

    get mode(): Types.ScreensaverModeType {
        if (
            !this.config ||
            (this.config.card !== 'screensaver' &&
                this.config.card !== 'screensaver2' &&
                this.config.card !== 'screensaver3' &&
                this.config.card !== 'screensaver5')
        ) {
            return 'standard';
        }
        return this.config.mode;
    }
    set mode(mode: Types.ScreensaverModeType) {
        if (
            !this.config ||
            (this.config.card !== 'screensaver' &&
                this.config.card !== 'screensaver2' &&
                this.config.card !== 'screensaver3' &&
                this.config.card !== 'screensaver5')
        ) {
            return;
        }
        if (globals.isScreenSaverMode(mode)) {
            this.config.mode = mode;
        } else {
            globals.exhaustiveCheck(mode);
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            this.log.error(`Invalid mode: ${mode}`);
        }
    }

    overwriteModel(mode: Types.ScreensaverModeTypeAsNumber, init: boolean = false): void {
        if (mode === Screensaver.mapModeToNumber(this.mode)) {
            return;
        }
        switch (mode) {
            case 0:
            case 1: {
                // overwrite readonly property
                (this.card as any) = 'screensaver';
                if (this.config) {
                    this.config.card = 'screensaver';
                }
                break;
            }
            case 2: {
                // overwrite readonly property
                (this.card as any) = 'screensaver2';
                if (this.config) {
                    this.config.card = 'screensaver2';
                }
                break;
            }
            case 3: {
                // overwrite readonly property
                (this.card as any) = 'screensaver3';
                if (this.config) {
                    this.config.card = 'screensaver3';
                }
                break;
            }
            case 4: {
                // overwrite readonly property
                (this.card as any) = 'screensaver5';
                if (this.config) {
                    this.config.card = 'screensaver5';
                }
                break;
            }
            default: {
                globals.exhaustiveCheck(mode);
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                this.log.error(`Invalid mode: ${mode}`);
                return;
            }
        }
        this.mode = Screensaver.mapNumberToMode(mode);
        if (!init && this.visibility) {
            // the HMI loads another page, the info icon is empty there: time~ follows the content of the update
            this.sendType();
            void this.update();
        }
    }

    static mapModeToNumber(mode: Types.ScreensaverModeType): Types.ScreensaverModeTypeAsNumber {
        const index = globals.arrayOfScreensaverModes.findIndex(x => x === mode);
        return Math.min(
            Math.max(index, 0),
            globals.arrayOfScreensaverModes.length - 1,
        ) as Types.ScreensaverModeTypeAsNumber;
    }

    static mapNumberToMode(mode: Types.ScreensaverModeTypeAsNumber): Types.ScreensaverModeType {
        return globals.arrayOfScreensaverModes[mode];
    }
}
