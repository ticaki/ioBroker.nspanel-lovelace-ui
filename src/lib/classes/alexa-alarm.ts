/**
 * Alarms of an Echo device of the alexa2 adapter for a page item of kind "Alexa timer" with `show: 'alarm'`
 * (alexaTimer). Shown like the alarm clock mode of the timer popup (`ex-alarm`): the clock time `HH:MM`, on/off and,
 * for a fixed alarm, an editable time. One object per device, shared through `AlexaTimerRegistry`.
 *
 * States of alexa2 below `<instance>.Echo-Devices.<serial>.Alarm.<uuid>` (one channel per alarm):
 * - `time` `hh:mm:ss` (seconds optional), writable - writing changes the time of the alarm
 * - `date` `YYYY-MM-DD`, `enabled` (true = on, also while snoozed), writable
 * - `nextTriggerDate` unix ms, null while the alarm is off or lies in the past
 * - `recurringPattern` (`0` once, `P1D`, `XXXX-WD`, `XXXX-WE`, `XXXX-WXX-1..7`), `recurringDays` (`MO,TU,...`)
 * - `label` only when the alarm has one
 *
 * Alarms come and go (set or deleted by voice): their states are followed by a subscription of `Alarm.*` - a new
 * alarm writes its states, a deleted one deletes them. The channels are read again when the popup opens
 * ({@link AlexaAlarms.refresh}), so an alarm whose objects are gone but whose states were left over disappears too.
 */
import type { AlexaStateLike, AlexaTimerHost } from './alexa-timer';
import type { AlexaTimerConfig } from '../types/adminShareConfig';

/** one alarm as read from its states */
export interface AlexaAlarmEntry {
    /** uuid, the id part below `Alarm` */
    id: string;
    /** `hh:mm:ss` or `hh:mm`, '' when unknown */
    time: string;
    /** `YYYY-MM-DD`, '' when unknown */
    date: string;
    enabled: boolean;
    /** next point in time, unix ms; undefined while off or in the past */
    nextTriggerDate: number | undefined;
    /** `0` = once */
    recurringPattern: string;
    /** e.g. `MO,TU,WE,TH,FR`, '' for a single alarm */
    recurringDays: string;
    /** name of the alarm, '' without */
    label: string;
}

/** what the item shows */
export interface AlexaAlarmSelection {
    /** the shown alarm, undefined: none (next active: no active alarm; fixed: the alarm is gone) */
    entry: AlexaAlarmEntry | undefined;
    /** a fixed alarm was chosen, but it does not exist (any more) */
    missing: boolean;
}

/** states of one alarm that make up an {@link AlexaAlarmEntry} */
const ALARM_FIELDS = ['time', 'date', 'enabled', 'nextTriggerDate', 'recurringPattern', 'recurringDays', 'label'];

/**
 * @param value value of `time`
 * @returns hour and minute, undefined when it is no clock time
 */
export function parseAlarmTime(value: string): { hour: number; minute: number } | undefined {
    const match = /^(\d{1,2}):(\d{2})(?::\d{2})?/.exec(value.trim());
    if (!match) {
        return undefined;
    }
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    return hour < 24 && minute < 60 ? { hour, minute } : undefined;
}

/**
 * The clock time to show: the next point in time in local time, else the time state.
 *
 * @param entry the alarm
 * @returns hour and minute, undefined when neither is known
 */
export function alarmClockTime(entry: AlexaAlarmEntry): { hour: number; minute: number } | undefined {
    if (entry.nextTriggerDate !== undefined) {
        const date = new Date(entry.nextTriggerDate);
        return { hour: date.getHours(), minute: date.getMinutes() };
    }
    return parseAlarmTime(entry.time);
}

/**
 * A single alarm whose time has passed: alexa2 says changes to it do not work (switching on a single alarm of last
 * week), so it is treated like an alarm that can not be written.
 *
 * @param entry the alarm
 * @param now current time in ms
 * @returns true for a single alarm in the past
 */
export function isPastSingleAlarm(entry: AlexaAlarmEntry, now: number): boolean {
    if (entry.recurringPattern !== '0' && entry.recurringPattern !== '') {
        return false;
    }
    if (entry.nextTriggerDate !== undefined) {
        return entry.nextTriggerDate <= now;
    }
    const time = parseAlarmTime(entry.time);
    const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entry.date);
    if (!time || !date) {
        return false;
    }
    const at = new Date(Number(date[1]), Number(date[2]) - 1, Number(date[3]), time.hour, time.minute).getTime();
    return at <= now;
}

/**
 * The next active alarm: on, with a next point in time, the earliest of them. With equal times the lowest id wins, so
 * the shown alarm does not jump.
 *
 * @param entries all alarms of the device
 * @returns the alarm, undefined when none is active
 */
export function nextActiveAlarm(entries: readonly AlexaAlarmEntry[]): AlexaAlarmEntry | undefined {
    let best: AlexaAlarmEntry | undefined;
    for (const entry of entries) {
        if (!entry.enabled || entry.nextTriggerDate === undefined) {
            continue;
        }
        if (
            !best ||
            entry.nextTriggerDate < (best.nextTriggerDate ?? Infinity) ||
            (entry.nextTriggerDate === best.nextTriggerDate && entry.id < best.id)
        ) {
            best = entry;
        }
    }
    return best;
}

/**
 * @param entries all alarms of the device
 * @param alarmId fixed alarm, undefined = the next active one
 * @returns what the item shows
 */
export function selectAlexaAlarm(
    entries: readonly AlexaAlarmEntry[],
    alarmId: string | undefined,
): AlexaAlarmSelection {
    if (alarmId === undefined) {
        return { entry: nextActiveAlarm(entries), missing: false };
    }
    const entry = entries.find(e => e.id === alarmId);
    return { entry, missing: !entry };
}

/**
 * Label of an alarm in the admin: `[label · ]HH:MM · days` or `[label · ]HH:MM · <once> date`.
 *
 * @param entry the alarm
 * @param once word for a single alarm, e.g. "einmalig"
 * @returns the label
 */
export function alexaAlarmLabel(entry: AlexaAlarmEntry, once: string): string {
    const time = parseAlarmTime(entry.time);
    const parts: string[] = [];
    if (entry.label) {
        parts.push(entry.label);
    }
    parts.push(
        time ? `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}` : entry.time || '?',
    );
    if (entry.recurringDays) {
        parts.push(entry.recurringDays);
    } else if (entry.recurringPattern === '0' || entry.recurringPattern === '') {
        parts.push(entry.date ? `${once} ${entry.date}` : once);
    } else {
        parts.push(entry.recurringPattern);
    }
    return parts.join(' · ');
}

/**
 * Builds the alarms from the states below `Alarm`; ids without `time` and without `enabled` are no alarms
 * (`Alarm.New`, `Alarm.triggered`).
 *
 * @param prefix `<instance>.Echo-Devices.<serial>.Alarm.`
 * @param states states below the prefix, value per id
 * @returns the alarms, sorted by id
 */
export function alexaAlarmsOf(prefix: string, states: ReadonlyMap<string, unknown>): AlexaAlarmEntry[] {
    const byId = new Map<string, Map<string, unknown>>();
    for (const [id, val] of states) {
        if (!id.startsWith(prefix)) {
            continue;
        }
        const rest = id.slice(prefix.length).split('.');
        if (rest.length !== 2 || !ALARM_FIELDS.includes(rest[1])) {
            continue;
        }
        let fields = byId.get(rest[0]);
        if (!fields) {
            fields = new Map();
            byId.set(rest[0], fields);
        }
        fields.set(rest[1], val);
    }
    const text = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
    const out: AlexaAlarmEntry[] = [];
    for (const [id, fields] of byId) {
        if (!fields.has('time') && !fields.has('enabled')) {
            continue;
        }
        const next = fields.get('nextTriggerDate');
        out.push({
            id,
            time: text(fields.get('time')),
            date: text(fields.get('date')),
            enabled: fields.get('enabled') === true,
            nextTriggerDate: typeof next === 'number' && Number.isFinite(next) && next > 0 ? next : undefined,
            recurringPattern: text(fields.get('recurringPattern')),
            recurringDays: text(fields.get('recurringDays')),
            label: text(fields.get('label')),
        });
    }
    return out.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * @param hour hour, above 23 counts as 23 (the fields of the HMI go up to 59)
 * @param minute minute, above 59 counts as 59
 * @returns the value for `time`: `hh:mm:00`
 */
export function alarmTimeValue(hour: number, minute: number): string {
    const h = Math.min(23, Math.max(0, Math.floor(hour)));
    const m = Math.min(59, Math.max(0, Math.floor(minute)));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/** reads the channels below a pattern: the ids of the alarms that exist as objects */
export type AlexaAlarmChannelReader = (pattern: string) => Promise<string[]>;

/**
 * The alarms of one Echo device.
 */
export class AlexaAlarms {
    readonly config: AlexaTimerConfig;
    private readonly host: AlexaTimerHost;
    private readonly readChannels: AlexaAlarmChannelReader | undefined;
    /** value per state id below `Alarm.` */
    private states: Map<string, unknown> = new Map();
    private listeners: Set<() => void> = new Set();
    private subscribed: boolean = false;
    private deleted: boolean = false;
    /** resolves when the states were read the first time */
    readonly ready: Promise<void>;

    /**
     * @param config instance and device
     * @param host access to the adapter
     * @param readChannels reads the alarm channels of the device, undefined: {@link refresh} does nothing
     */
    constructor(config: AlexaTimerConfig, host: AlexaTimerHost, readChannels?: AlexaAlarmChannelReader) {
        this.config = { instance: config.instance, serial: config.serial };
        this.host = host;
        this.readChannels = readChannels;
        this.ready = this.init();
    }

    /** `<instance>.Echo-Devices.<serial>.Alarm.` */
    get prefix(): string {
        return `${this.config.instance}.Echo-Devices.${this.config.serial}.Alarm.`;
    }

    private async init(): Promise<void> {
        try {
            await this.host.subscribePattern(`${this.prefix}*`, this.onState);
            this.subscribed = true;
            const states = await this.host.getForeignStates(`${this.prefix}*`);
            for (const [id, state] of Object.entries(states)) {
                this.apply(id, state);
            }
        } catch (err: unknown) {
            this.host.log.warn(`Alexa alarm: cannot read the alarms of ${this.prefix}*: ${String(err)}`);
        }
        this.notify();
    }

    /**
     * Drops the alarms whose channel is gone - a deleted alarm whose states were left over.
     */
    async refresh(): Promise<void> {
        if (this.deleted || !this.readChannels) {
            return;
        }
        try {
            const channels = new Set(await this.readChannels(`${this.prefix}*`));
            let changed = false;
            for (const id of [...this.states.keys()]) {
                const alarm = id.slice(this.prefix.length).split('.')[0];
                if (id.slice(this.prefix.length).includes('.') && !channels.has(alarm)) {
                    this.states.delete(id);
                    changed = true;
                }
            }
            if (changed) {
                this.notify();
            }
        } catch (err: unknown) {
            this.host.log.debug(`Alexa alarm: cannot read the alarm channels of ${this.prefix}*: ${String(err)}`);
        }
    }

    /**
     * @param listener called on every change, must not throw
     */
    addListener(listener: () => void): void {
        this.listeners.add(listener);
    }

    /**
     * @param listener as given to {@link addListener}
     */
    removeListener(listener: () => void): void {
        this.listeners.delete(listener);
    }

    private notify(): void {
        if (!this.deleted) {
            this.listeners.forEach(listener => listener());
        }
    }

    private onState = (id: string, state: AlexaStateLike): void => {
        if (this.apply(id, state)) {
            this.notify();
        }
    };

    /**
     * @param id state id
     * @param state the state, null when it was deleted
     * @returns true when something changed
     */
    private apply(id: string, state: AlexaStateLike): boolean {
        if (!id.startsWith(this.prefix)) {
            return false;
        }
        if (!state) {
            return this.states.delete(id);
        }
        const val: unknown = state.val;
        if (this.states.has(id) && this.states.get(id) === val) {
            return false;
        }
        this.states.set(id, val);
        return true;
    }

    /**
     * @returns all alarms of the device
     */
    getAlarms(): AlexaAlarmEntry[] {
        return alexaAlarmsOf(this.prefix, this.states);
    }

    /**
     * @param alarmId fixed alarm, undefined = the next active one
     * @returns what the item shows
     */
    select(alarmId: string | undefined): AlexaAlarmSelection {
        return selectAlexaAlarm(this.getAlarms(), alarmId);
    }

    /**
     * Switches an alarm on or off (`enabled`).
     *
     * @param alarmId the alarm
     * @param on true = on
     * @returns true when it was written
     */
    async setEnabled(alarmId: string, on: boolean): Promise<boolean> {
        return this.write(`${this.prefix}${alarmId}.enabled`, on);
    }

    /**
     * Sets the time of an alarm (`time`).
     *
     * @param alarmId the alarm
     * @param hour hour
     * @param minute minute
     * @returns true when it was written
     */
    async setTime(alarmId: string, hour: number, minute: number): Promise<boolean> {
        return this.write(`${this.prefix}${alarmId}.time`, alarmTimeValue(hour, minute));
    }

    private async write(id: string, val: ioBroker.StateValue): Promise<boolean> {
        if (this.deleted) {
            return false;
        }
        try {
            await this.host.setForeignState(id, val);
            this.host.log.debug(`Alexa alarm: ${id} = ${String(val)}`);
            return true;
        } catch (err: unknown) {
            this.host.log.warn(`Alexa alarm: cannot write ${id}: ${String(err)}`);
            return false;
        }
    }

    async delete(): Promise<void> {
        this.deleted = true;
        this.listeners.clear();
        if (this.subscribed) {
            this.subscribed = false;
            try {
                await this.host.unsubscribePattern(`${this.prefix}*`, this.onState);
            } catch (err: unknown) {
                this.host.log.debug(`Alexa alarm: unsubscribe of ${this.prefix}* failed: ${String(err)}`);
            }
        }
    }
}
