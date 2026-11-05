/**
 * Timer instead of the clock on the screensaver - pure logic without adapter or panel, so it can be tested.
 *
 * One timer ("slot") is a pair of states: the on/off state decides whether the timer counts at all, the data
 * state says how long it takes. With patterns (`path.*.aktiv`, `path.*.targetTs`) there are several slots, the
 * display shows an expired one first, else the running one with the shortest remaining time.
 */

/** the data state as it was read */
export type TimerData =
    /** no timer: empty, unknown text or `targetTs` 0 before anything ran */
    | { kind: 'none' }
    /** fixed end, unix ms */
    | { kind: 'target'; targetTs: number }
    /** the state counts down by itself */
    | { kind: 'countdown'; remainingMs: number }
    /** the time is over and no end time is known */
    | { kind: 'elapsed' };

/** what parsing a value of the data state yields: `zero` needs the history of the slot to be judged */
export type ParsedTimerData = Exclude<TimerData, { kind: 'elapsed' }> | { kind: 'zero' };

/** what a slot remembers between two evaluations */
export interface TimerSlotMemory {
    on: boolean;
    /** the last value of the data state - a value that did not change is not read again (HH:MM stays the same day) */
    raw: unknown;
    data: TimerData;
    /** the time stands still, only a page item as source knows this, see {@link TimerCountdownView} */
    paused?: boolean;
}

/** the state of a slot as read from the two states */
export interface TimerSlotInput {
    on: boolean;
    value: unknown;
    /** common.unit of the data state */
    unit?: string;
    /** the data state is known to be a counting down state (see {@link isCountdownCommon}): 0 means expired */
    countdownState?: boolean;
}

export type TimerStatus = 'off' | 'running' | 'paused' | 'expired';

/** what the display shows */
export interface TimerSelection {
    status: TimerStatus;
    /** remaining time as shown, see {@link timerText}, '' while off */
    text: string;
    /** remaining time of the shown slot */
    remainingMs: number;
    /** key of the shown slot, undefined while off */
    key: string | undefined;
}

export const TIMER_OFF: TimerSelection = { status: 'off', text: '', remainingMs: 0, key: undefined };

const MINUTE = 60_000;
/** one step of the display below {@link TENTHS_UNTIL} */
const TENTH_MINUTE = 6000;
/** up to here (999.9 minutes) the display shows tenths of a minute, above whole minutes */
const TENTHS_UNTIL = 9999 * TENTH_MINUTE;
/** the field holds 4 digits: above this the display stays at 9999 */
const MAX_SHOWN_MINUTES = 9999;
/** from here on a number is a point in time in ms (year 1973), below in seconds down to {@link SECONDS_FROM} */
const MILLISECONDS_FROM = 1e11;
/** from here on a number is a point in time in seconds (year 2001), below a remaining time */
const SECONDS_FROM = 1e9;
/** longest wait in one go: larger values overflow the timers of node */
const MAX_WAIT = 86_400_000;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)?)?$/;
const HOUR_MINUTE = /^(\d{1,2}):(\d{2})$/;

/**
 * the on/off state as a boolean
 *
 * @param value value of the state
 * @returns true when the timer is switched on
 */
export function isTimerOn(value: unknown): boolean {
    if (typeof value === 'string') {
        return ['true', 'on', '1'].includes(value.trim().toLowerCase());
    }
    if (typeof value === 'number') {
        return value !== 0 && !Number.isNaN(value);
    }
    return value === true;
}

/**
 * The object says it is a state that counts down: value 0 then means expired, even right after a restart of the
 * adapter. A plain number state can not tell that apart from `targetTs` 0 (= no timer yet), see {@link stepTimerSlot}.
 *
 * @param common common of the data state
 * @param common.unit unit of the state
 * @param common.role role of the state
 * @returns true for a remaining time in s or ms and the timer roles
 */
export function isCountdownCommon(common: { unit?: unknown; role?: unknown } | undefined | null): boolean {
    if (!common) {
        return false;
    }
    if (typeof common.unit === 'string' && ['s', 'sec', 'ms'].includes(common.unit.trim().toLowerCase())) {
        return true;
    }
    return common.role === 'value.timer' || common.role === 'level.timer';
}

/**
 * reads a value of the data state, see doc/de/screensaver.md
 *
 * @param value value of the state
 * @param unit common.unit of the state ('ms': a remaining time is given in ms instead of seconds)
 * @param now current time in ms
 * @returns the kind of data
 */
export function parseTimerData(value: unknown, unit: string | undefined, now: number): ParsedTimerData {
    if (typeof value === 'number') {
        if (Number.isNaN(value)) {
            return { kind: 'none' };
        }
        if (value <= 0) {
            return { kind: 'zero' };
        }
        if (value >= MILLISECONDS_FROM) {
            return { kind: 'target', targetTs: value };
        }
        if (value >= SECONDS_FROM) {
            return { kind: 'target', targetTs: value * 1000 };
        }
        return { kind: 'countdown', remainingMs: unit?.trim().toLowerCase() === 'ms' ? value : value * 1000 };
    }
    if (typeof value !== 'string') {
        return { kind: 'none' };
    }
    const text = value.trim();
    const hourMinute = HOUR_MINUTE.exec(text);
    if (hourMinute) {
        const hour = Number(hourMinute[1]);
        const minute = Number(hourMinute[2]);
        if (hour > 23 || minute > 59) {
            return { kind: 'none' };
        }
        const target = new Date(now);
        target.setHours(hour, minute, 0, 0);
        if (target.getTime() <= now) {
            // setDate instead of adding 24 h: stays right across a change of the daylight saving time
            target.setDate(target.getDate() + 1);
        }
        return { kind: 'target', targetTs: target.getTime() };
    }
    if (ISO_DATE.test(text)) {
        const targetTs = new Date(text).getTime();
        return Number.isNaN(targetTs) ? { kind: 'none' } : { kind: 'target', targetTs };
    }
    return { kind: 'none' };
}

/**
 * Next evaluation of a slot. The on/off state rules: off means done, whatever the data says. While on, a timer
 * that ran stays expired until new data lies in the future again, and without a run only a state known to count
 * down turns 0 into expired - `targetTs` 0 means "no timer yet".
 *
 * @param prev memory of the last evaluation, undefined for the first one
 * @param input current values
 * @param now current time in ms
 * @returns the new memory and whether a new timer began (a tapped away timer comes back)
 */
export function stepTimerSlot(
    prev: TimerSlotMemory | undefined,
    input: TimerSlotInput,
    now: number,
): { memory: TimerSlotMemory; started: boolean } {
    if (!input.on) {
        return { memory: { on: false, raw: input.value, data: { kind: 'none' } }, started: false };
    }
    const before: TimerData = prev?.on ? prev.data : { kind: 'none' };
    if (prev?.on && prev.raw === input.value) {
        // same value: no new reading, HH:MM would jump to the next day once it is over
        return { memory: prev, started: false };
    }
    const parsed = parseTimerData(input.value, input.unit, now);
    let data: TimerData;
    if (parsed.kind === 'target' || parsed.kind === 'countdown') {
        data = parsed;
    } else if (before.kind !== 'none' || (parsed.kind === 'zero' && input.countdownState)) {
        data = { kind: 'elapsed' };
    } else {
        data = { kind: 'none' };
    }
    return { memory: { on: true, raw: input.value, data }, started: isNewRun(before, data) };
}

/**
 * @param before data of the last evaluation
 * @param data current data
 * @returns true when the data stands for another timer than before
 */
function isNewRun(before: TimerData, data: TimerData): boolean {
    switch (data.kind) {
        case 'none':
            return false;
        case 'elapsed':
            return before.kind === 'none';
        case 'target':
            return before.kind !== 'target' || before.targetTs !== data.targetTs;
        case 'countdown':
            // counts down by itself - only a larger remaining time is a new timer
            return before.kind !== 'countdown' || data.remainingMs > before.remainingMs;
    }
}

/**
 * remaining time of a slot
 *
 * @param data data of the slot
 * @param now current time in ms
 * @returns remaining time, 0 = expired, undefined = no timer
 */
function remainingOf(data: TimerData, now: number): number | undefined {
    switch (data.kind) {
        case 'none':
            return undefined;
        case 'elapsed':
            return 0;
        case 'target':
            return Math.max(0, data.targetTs - now);
        case 'countdown':
            return Math.max(0, data.remainingMs);
    }
}

/**
 * The remaining time as shown, in minutes and always rounded up, so `0.0` is only shown when the time really is over:
 * one decimal with a point in any language up to `999.9`, above that whole minutes up to `9999`, the width of the field.
 *
 * @param remainingMs remaining time
 * @returns e.g. `125.5`, `0.1`, `0.0`, `1234`
 */
export function timerText(remainingMs: number): string {
    const remaining = Math.max(0, remainingMs);
    if (remaining > TENTHS_UNTIL) {
        return String(Math.min(Math.ceil(remaining / MINUTE), MAX_SHOWN_MINUTES));
    }
    const tenths = Math.ceil(remaining / TENTH_MINUTE);
    return `${Math.floor(tenths / 10)}.${tenths % 10}`;
}

/**
 * Time until {@link timerText} changes, counted back from the end: `0.1` turns into `0.0` exactly at the end.
 *
 * @param remainingMs remaining time, above 0
 * @returns ms to wait
 */
function nextTextChangeMs(remainingMs: number): number {
    if (remainingMs <= TENTHS_UNTIL) {
        return remainingMs % TENTH_MINUTE || TENTH_MINUTE;
    }
    if (remainingMs > MAX_SHOWN_MINUTES * MINUTE) {
        return remainingMs - MAX_SHOWN_MINUTES * MINUTE;
    }
    return Math.min(remainingMs % MINUTE || MINUTE, remainingMs - TENTHS_UNTIL);
}

/**
 * What the display shows: an expired slot first, else the running slot with the shortest remaining time. With equal
 * times the lowest key wins, so the shown slot does not jump.
 *
 * @param slots memory per slot
 * @param now current time in ms
 * @returns the selection
 */
export function selectTimer(slots: ReadonlyMap<string, TimerSlotMemory>, now: number): TimerSelection {
    let best: { key: string; remainingMs: number; paused: boolean } | undefined;
    for (const key of [...slots.keys()].sort()) {
        const memory = slots.get(key);
        const remainingMs = memory?.on ? remainingOf(memory.data, now) : undefined;
        if (remainingMs !== undefined && (!best || remainingMs < best.remainingMs)) {
            best = { key, remainingMs, paused: !!memory?.paused };
        }
    }
    if (!best) {
        return TIMER_OFF;
    }
    return {
        status: best.paused ? 'paused' : best.remainingMs > 0 ? 'running' : 'expired',
        text: timerText(best.remainingMs),
        remainingMs: best.remainingMs,
        key: best.key,
    };
}

/**
 * Time until the display has to change by itself. Only a fixed end time passes without a state change: the shown
 * slot changes with each step of its REMAINING time - not of the clock - and another slot at its end. A slot
 * that counts down itself brings its own trigger, an expired one shows nothing that could change.
 *
 * @param slots memory per slot
 * @param selection current selection
 * @param tappedAway the display shows the clock: only the end of the time changes it (icon)
 * @param now current time in ms
 * @returns ms to wait, undefined = nothing to wait for
 */
export function nextTimerWakeMs(
    slots: ReadonlyMap<string, TimerSlotMemory>,
    selection: TimerSelection,
    tappedAway: boolean,
    now: number,
): number | undefined {
    if (selection.status !== 'running') {
        return undefined;
    }
    let wait: number | undefined;
    for (const [key, memory] of slots) {
        if (!memory.on || memory.data.kind !== 'target') {
            continue;
        }
        const remainingMs = memory.data.targetTs - now;
        if (remainingMs <= 0) {
            continue;
        }
        const next = key === selection.key && !tappedAway ? nextTextChangeMs(remainingMs) : remainingMs;
        wait = wait === undefined ? next : Math.min(wait, next);
    }
    return wait === undefined ? undefined : Math.min(wait, MAX_WAIT);
}

/**
 * the part of a state id that stands for the `*` of a pattern: on/off and data belong together when it is the same
 *
 * @param pattern pattern with exactly one `*`
 * @param id state id
 * @returns the part, undefined when the id does not match
 */
export function timerSlotKey(pattern: string, id: string): string | undefined {
    const star = pattern.indexOf('*');
    if (star === -1) {
        return undefined;
    }
    const prefix = pattern.slice(0, star);
    const suffix = pattern.slice(star + 1);
    if (id.length <= prefix.length + suffix.length || !id.startsWith(prefix) || !id.endsWith(suffix)) {
        return undefined;
    }
    return id.slice(prefix.length, id.length - suffix.length);
}

/** what a page item needs to use the timer of the screensaver of its panel, see `Screensaver.getClockTimerAccess` */
export interface ClockTimerAccess {
    /** the same timer the screensaver shows, also while it is tapped away there */
    selection: TimerSelection;
    /** a fixed end time is running: the shown time changes without a state change */
    ticking: boolean;
    /** there is a free slot and its states can be written */
    canStart: boolean;
    /** the on/off state of the shown slot can be written */
    canStop: boolean;
}

/** what a page item with a popupTimer says about its countdown when it is the source of the screensaver */
export interface TimerCountdownView {
    status: TimerStatus;
    /** remaining time */
    remainingMs: number;
    /** fixed end while running, unix ms: counted by the adapter, nothing has to be sent per second */
    endTs?: number;
    /** a new timer can be started through the item */
    canStart: boolean;
    /** the timer can be stopped through the item */
    canStop: boolean;
}

/**
 * Next evaluation with a page item as source, the counterpart of {@link stepTimerSlot}.
 *
 * @param prev memory of the last evaluation
 * @param view what the item says
 * @returns the new memory and whether a new timer began
 */
export function stepTimerItem(
    prev: TimerSlotMemory | undefined,
    view: TimerCountdownView,
): { memory: TimerSlotMemory; started: boolean } {
    let data: TimerData;
    switch (view.status) {
        case 'off':
            return { memory: { on: false, raw: null, data: { kind: 'none' } }, started: false };
        case 'expired':
            data = { kind: 'elapsed' };
            break;
        case 'paused':
            data = { kind: 'countdown', remainingMs: view.remainingMs };
            break;
        case 'running':
            data =
                view.endTs === undefined
                    ? { kind: 'countdown', remainingMs: view.remainingMs }
                    : { kind: 'target', targetTs: view.endTs };
            break;
    }
    const memory: TimerSlotMemory = { on: true, raw: null, data, paused: view.status === 'paused' };
    return { memory, started: isNewRun(prev?.on ? prev.data : { kind: 'none' }, data) };
}

/** a popup shows two fields of two digits */
const MAX_POPUP_SECONDS = 99 * 60 + 59;
/** below this a number of a clock time is ms since midnight, above a point in time */
const MS_PER_DAY = 86_400_000;

/**
 * Remaining time of a state in full seconds, without any look at a time zone.
 *
 * @param value value of the state
 * @param unit common.unit of the state ('ms': the value is in ms, otherwise in seconds)
 * @returns seconds, 0 for anything that is no positive number
 */
export function timerSecondsOf(value: number | null | undefined, unit: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return 0;
    }
    return Math.ceil(isUnitMs(unit) ? value / 1000 : value);
}

/**
 * Remaining time as a value for a state.
 *
 * @param seconds remaining time
 * @param unit common.unit of the state ('ms': the value is in ms, otherwise in seconds)
 * @returns the value to write
 */
export function timerValueOf(seconds: number, unit: unknown): number {
    return isUnitMs(unit) ? seconds * 1000 : seconds;
}

/**
 * @param unit common.unit of a state
 * @returns true for ms
 */
function isUnitMs(unit: unknown): boolean {
    return typeof unit === 'string' && unit.trim().toLowerCase() === 'ms';
}

/**
 * The line of a list: hours are not limited to a day.
 *
 * @param seconds remaining time
 * @returns HH:MM:SS
 */
export function timerClockText(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, '0')).join(':');
}

/**
 * The two fields of the popup.
 *
 * @param seconds remaining time
 * @returns minutes and seconds, above 99:59 it stays 99:59
 */
export function timerPopupFields(seconds: number): { minutes: string; seconds: string } {
    const s = Math.min(MAX_POPUP_SECONDS, Math.max(0, Math.floor(seconds)));
    return { minutes: String(Math.floor(s / 60)), seconds: String(s % 60) };
}

/**
 * The value of the HMI when the editing of the popup is closed.
 *
 * @param value text `00:MM:SS`
 * @returns the three numbers, undefined when it is something else
 */
export function parseTimerInput(value: string | undefined): [number, number, number] | undefined {
    const parts = (value ?? '').split(':').map(v => parseInt(v, 10));
    if (parts.length !== 3 || parts.some(v => Number.isNaN(v) || v < 0)) {
        return undefined;
    }
    return [parts[0], parts[1], parts[2]];
}

/**
 * Clock time of an alarm state in local time.
 *
 * @param value unix ms; unix seconds and - as the adapter read it so far - ms since midnight are understood as well
 * @returns hour and minute, 00:00 when there is no time
 */
export function alarmClockOf(value: number | null | undefined): { hour: number; minute: number } {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return { hour: 0, minute: 0 };
    }
    if (value < MS_PER_DAY) {
        const minutes = Math.floor(value / MINUTE);
        return { hour: Math.floor(minutes / 60), minute: minutes % 60 };
    }
    const date = new Date(value >= SECONDS_FROM && value < MILLISECONDS_FROM ? value * 1000 : value);
    return { hour: date.getHours(), minute: date.getMinutes() };
}

/**
 * The next time this clock time is reached, in local time.
 *
 * @param hour hour, above 23 counts as 23 (the fields of the HMI go up to 59)
 * @param minute minute
 * @param now current time in ms
 * @returns unix ms, always in the future
 */
export function nextAlarmTs(hour: number, minute: number, now: number): number {
    const target = new Date(now);
    target.setHours(Math.min(23, Math.max(0, hour)), Math.min(59, Math.max(0, minute)), 0, 0);
    if (target.getTime() <= now) {
        // setDate instead of adding 24 h: stays right across a change of the daylight saving time
        const hours = target.getHours();
        const minutes = target.getMinutes();
        target.setDate(target.getDate() + 1);
        target.setHours(hours, minutes, 0, 0);
    }
    return target.getTime();
}

/**
 * What a start writes to the data state - the counterpart of {@link parseTimerData} / {@link isCountdownCommon}.
 *
 * @param common common of the data state
 * @param common.unit unit of the state
 * @param common.role role of the state
 * @param common.type type of the state
 * @param seconds duration
 * @param now current time in ms
 * @returns remaining time in s or ms, an ISO date for a text state, else the end as unix ms
 */
export function timerStartValue(
    common: { unit?: unknown; role?: unknown; type?: unknown },
    seconds: number,
    now: number,
): number | string {
    if (isCountdownCommon(common)) {
        return timerValueOf(seconds, common.unit);
    }
    const targetTs = now + seconds * 1000;
    return common.type === 'string' ? new Date(targetTs).toISOString() : targetTs;
}

/**
 * The on/off state in the type of the state, {@link isTimerOn} reads all of them.
 *
 * @param common common of the state
 * @param common.type type of the state
 * @param on the value
 * @returns the value to write
 */
export function timerActiveValue(common: { type?: unknown }, on: boolean): boolean | number | string {
    if (common.type === 'number') {
        return on ? 1 : 0;
    }
    if (common.type === 'string') {
        return on ? 'true' : 'false';
    }
    return on;
}

/**
 * Slots in the order in which a start takes them: by the number in the `*` part.
 *
 * @param keys keys of the slots
 * @returns the sorted keys
 */
export function orderTimerSlotKeys(keys: Iterable<string>): string[] {
    return [...keys].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

/** one button of the popup: action sent back by the HMI as `timer-<action>`, text as a translation key */
export type TimerPopupButton = { action: 'begin' | 'pause' | 'clear' | 'finish'; text: string } | undefined;

/** what the popup offers */
export interface TimerPopupButtons {
    editable: boolean;
    buttons: [TimerPopupButton, TimerPopupButton, TimerPopupButton];
}

/** the state of a timer as far as the buttons depend on it */
export type TimerPopupInput =
    /** counted by the adapter */
    | { mode: 'timer'; status: 'run' | 'pause' | 'stop' | 'expired'; seconds: number }
    /** counted outside, see doc/de/ALIAS.md */
    | {
          mode: 'ex-timer';
          /** value of STATUS, undefined without this state */
          status: number | undefined;
          canStatus: boolean;
          canSet: boolean;
          /** remaining time */
          seconds: number;
      }
    /** an alarm clock, see doc/de/ALIAS.md */
    | { mode: 'ex-alarm'; status: number | undefined; canStatus: boolean; canSet: boolean }
    /** the timer of the screensaver */
    | { mode: 'ss-timer'; status: TimerStatus; canStart: boolean; canStop: boolean };

/**
 * Which buttons the popup shows. Start, pause and on/off only exist with a STATUS state: without it nothing tells the
 * outside that it should run. Cancel and finish are only told apart by the STATE true of finish.
 *
 * @param input state of the timer
 * @returns the buttons and whether the time can be edited
 */
export function timerPopupButtons(input: TimerPopupInput): TimerPopupButtons {
    const start = (text: string): TimerPopupButton => ({ action: 'begin', text });
    const pause = (text: string): TimerPopupButton => ({ action: 'pause', text });
    const cancel: TimerPopupButton = { action: 'clear', text: 'timer_cancel' };
    const clear: TimerPopupButton = { action: 'clear', text: 'timer_clear' };
    const finish: TimerPopupButton = { action: 'finish', text: 'timer_finish' };
    switch (input.mode) {
        case 'timer': {
            if (input.status === 'run') {
                return { editable: false, buttons: [pause('timer_pause'), cancel, finish] };
            }
            if (input.status === 'expired') {
                // stays until it is confirmed
                return { editable: false, buttons: [undefined, finish, undefined] };
            }
            if (input.seconds <= 0) {
                return { editable: true, buttons: [start('timer_start'), undefined, undefined] };
            }
            const text = input.status === 'pause' ? 'timer_continue' : 'timer_start';
            return { editable: true, buttons: [start(text), undefined, cancel] };
        }
        case 'ex-timer': {
            if (input.status === undefined) {
                return { editable: input.canSet, buttons: [undefined, undefined, input.canSet ? clear : undefined] };
            }
            const canClear = input.canSet || input.canStatus;
            if (input.status === 2) {
                if (input.seconds <= 0) {
                    // the time is over outside: only the confirmation is left
                    return { editable: false, buttons: [undefined, canClear ? finish : undefined, undefined] };
                }
                return {
                    editable: false,
                    buttons: [
                        input.canStatus ? pause('timer_pause') : undefined,
                        canClear ? cancel : undefined,
                        canClear ? finish : undefined,
                    ],
                };
            }
            return {
                editable: input.canSet,
                buttons: [
                    input.canStatus ? start(input.status === 1 ? 'timer_continue' : 'timer_start') : undefined,
                    undefined,
                    canClear ? clear : undefined,
                ],
            };
        }
        case 'ex-alarm': {
            if (input.status === 2) {
                return {
                    editable: false,
                    buttons: [undefined, input.canStatus ? pause('timer_off') : undefined, undefined],
                };
            }
            return {
                editable: input.canSet,
                buttons: [
                    undefined,
                    input.status !== undefined && input.canStatus ? start('timer_on') : undefined,
                    undefined,
                ],
            };
        }
        case 'ss-timer': {
            switch (input.status) {
                case 'off':
                    return {
                        editable: input.canStart,
                        buttons: [undefined, input.canStart ? start('timer_start') : undefined, undefined],
                    };
                case 'running':
                case 'paused':
                    return { editable: false, buttons: [undefined, input.canStop ? cancel : undefined, undefined] };
                case 'expired':
                    return { editable: false, buttons: [undefined, input.canStop ? finish : undefined, undefined] };
            }
        }
    }
}
