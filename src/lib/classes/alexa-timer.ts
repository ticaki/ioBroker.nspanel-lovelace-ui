/**
 * Timer of an Echo device of the alexa2 adapter: shown on the screensaver instead of the clock (clockTimer.alexa) and
 * in a page item of kind "Alexa timer" (alexaTimer). One object per device, shared by all users through
 * {@link AlexaTimerRegistry} - a timer stopped through one of them is hidden for all of them.
 *
 * States of alexa2 below `<instance>.Echo-Devices.<serial>`:
 * - `Timer.activeTimerList` JSON array `[{id, triggerTime (unix ms), label, durationMillis}]`
 * - `Timer.nextTimerId`, `Timer.triggered` (alexa2 sets it itself when the time of a timer is reached)
 * - `Timer.stopTimerId` writing an id deletes that timer at Amazon, also while it rings
 * - `Commands.textCommand` the text is carried out as if it was spoken
 * - global `<instance>.History.#trigger` asks alexa2 to read the history again
 *
 * What alexa2 does not do by itself: a timer started by a text command comes without a push - the list is only
 * updated after the history was read again ({@link AlexaTimer.start}). After a stop the push often does not come
 * either: the timer stays in the list, alexa2 even sets `triggered` at its old time and only clears it a minute
 * later. So stopped timers are hidden here at once ({@link selectAlexaTimer}).
 */
import type { TimerCountdownView } from '../pages/screensaver-timer';
import { isAlexaTimerComplete, type AlexaTimerConfig } from '../types/adminShareConfig';

/** one entry of `Timer.activeTimerList` */
export interface AlexaTimerEntry {
    id: string;
    /** end of the timer, unix ms */
    triggerTime: number;
    label: string | null;
    durationMillis: number;
}

/** what the states of the device say right now */
export interface AlexaTimerInput {
    list: readonly AlexaTimerEntry[];
    triggered: boolean;
    nextTimerId: string | null;
    /** stopped ids that are hidden, see {@link pruneStoppedTimers} */
    stopped: ReadonlySet<string>;
    now: number;
}

/** the timer that is shown: one that rings, else the running one with the shortest remaining time */
export interface AlexaTimerSelection {
    status: 'off' | 'running' | 'expired';
    /** the shown timer, undefined while off */
    entry: AlexaTimerEntry | undefined;
}

/** a stopped id is hidden at most this long after the end of its timer, also when alexa2 never removes it */
export const STOPPED_KEEP_MS = 120_000;
/** wait after the text command until the history knows the new timer */
export const START_TRIGGER_DELAY_MS = 5000;
/** wait after reading the history until a missing timer is asked for once more */
export const START_RETRY_DELAY_MS = 5000;

/**
 * Reads `Timer.activeTimerList`; entries without an id or a time are left out.
 *
 * @param value value of the state
 * @returns the timers, empty for anything that can not be read
 */
export function parseAlexaTimerList(value: unknown): AlexaTimerEntry[] {
    let raw: unknown = value;
    if (typeof value === 'string') {
        try {
            raw = JSON.parse(value);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(raw)) {
        return [];
    }
    const out: AlexaTimerEntry[] = [];
    for (const entry of raw) {
        if (typeof entry !== 'object' || entry === null) {
            continue;
        }
        const id: unknown = Reflect.get(entry, 'id');
        const triggerTime: unknown = Reflect.get(entry, 'triggerTime');
        const label: unknown = Reflect.get(entry, 'label');
        const durationMillis: unknown = Reflect.get(entry, 'durationMillis');
        if (typeof id !== 'string' || !id || typeof triggerTime !== 'number' || !Number.isFinite(triggerTime)) {
            continue;
        }
        out.push({
            id,
            triggerTime,
            label: typeof label === 'string' ? label : null,
            durationMillis: typeof durationMillis === 'number' ? durationMillis : 0,
        });
    }
    return out;
}

/**
 * The timer to show. Stopped ids do not exist here. `triggered` only counts while there is a timer that is not
 * stopped and the next timer of alexa2 is not a stopped one - after a stop without push alexa2 sets it falsely.
 *
 * @param input states of the device
 * @returns the selection
 */
export function selectAlexaTimer(input: AlexaTimerInput): AlexaTimerSelection {
    const visible = input.list
        .filter(t => !input.stopped.has(t.id))
        .sort((a, b) => a.triggerTime - b.triggerTime || a.id.localeCompare(b.id));
    if (visible.length === 0) {
        return { status: 'off', entry: undefined };
    }
    const due = visible.find(t => t.triggerTime <= input.now);
    if (due) {
        return { status: 'expired', entry: due };
    }
    const triggered = input.triggered && !(input.nextTimerId !== null && input.stopped.has(input.nextTimerId));
    if (triggered) {
        const ringing = visible.find(t => t.id === input.nextTimerId) ?? visible[0];
        return { status: 'expired', entry: ringing };
    }
    return { status: 'running', entry: visible[0] };
}

/**
 * Stopped ids stay hidden until alexa2 removed them from the list, at most {@link STOPPED_KEEP_MS} after their end.
 *
 * @param stopped stopped ids with the end of their timer
 * @param list current list of alexa2
 * @param now current time in ms
 * @returns the ids still to hide
 */
export function pruneStoppedTimers(
    stopped: ReadonlyMap<string, number>,
    list: readonly AlexaTimerEntry[],
    now: number,
): Map<string, number> {
    const out = new Map<string, number>();
    for (const [id, end] of stopped) {
        if (list.some(t => t.id === id) && now <= end + STOPPED_KEEP_MS) {
            out.set(id, end);
        }
    }
    return out;
}

/**
 * The text that sets a timer, digits only: whole minutes as minutes, else seconds. German for a German system,
 * English for every other language.
 *
 * @param seconds duration, above 0
 * @param language system language of ioBroker
 * @returns e.g. `stelle einen Timer auf 5 Minuten`
 */
export function alexaTimerCommand(seconds: number, language: string): string {
    const whole = Math.max(1, Math.round(seconds));
    const minutes = whole % 60 === 0 ? whole / 60 : undefined;
    if (language === 'de') {
        return minutes !== undefined
            ? `stelle einen Timer auf ${minutes} Minuten`
            : `stelle einen Timer auf ${whole} Sekunden`;
    }
    return minutes !== undefined ? `set a timer for ${minutes} minutes` : `set a timer for ${whole} seconds`;
}

/**
 * The selection as a page item with a popupTimer describes its countdown (`stepTimerItem` of the screensaver).
 *
 * @param selection the shown timer
 * @param canStart a text command can be sent
 * @param now current time in ms
 * @returns the view
 */
export function alexaCountdownView(selection: AlexaTimerSelection, canStart: boolean, now: number): TimerCountdownView {
    const entry = selection.entry;
    if (selection.status === 'off' || !entry) {
        return { status: 'off', remainingMs: 0, canStart, canStop: false };
    }
    if (selection.status === 'expired') {
        return { status: 'expired', remainingMs: 0, canStart, canStop: true };
    }
    return {
        status: 'running',
        remainingMs: Math.max(0, entry.triggerTime - now),
        endTs: entry.triggerTime,
        canStart,
        canStop: true,
    };
}

/** a state as the host hands it over */
export type AlexaStateLike = { val: unknown } | null | undefined;

/** what the timer needs of the adapter - the adapter itself in {@link AlexaTimerRegistry}, a fake in the tests */
export interface AlexaTimerHost {
    log: { debug: (msg: string) => void; warn: (msg: string) => void };
    /** system language of ioBroker */
    language: () => string;
    subscribePattern: (pattern: string, listener: (id: string, state: AlexaStateLike) => void) => Promise<void>;
    unsubscribePattern: (pattern: string, listener: (id: string, state: AlexaStateLike) => void) => Promise<void>;
    getForeignStates: (pattern: string) => Promise<Record<string, AlexaStateLike>>;
    /** writes a command (ack false) */
    setForeignState: (id: string, val: ioBroker.StateValue) => Promise<void>;
    setTimeout: (cb: () => void, ms: number) => ioBroker.Timeout | undefined;
    clearTimeout: (timer: ioBroker.Timeout | undefined) => void;
    now: () => number;
}

/**
 * The timers of one Echo device.
 */
export class AlexaTimer {
    readonly config: AlexaTimerConfig;
    private readonly host: AlexaTimerHost;
    private list: AlexaTimerEntry[] = [];
    private triggered: boolean = false;
    private nextTimerId: string | null = null;
    /** stopped ids with the end of their timer, see {@link pruneStoppedTimers} */
    private stopped: Map<string, number> = new Map();
    private listeners: Set<() => void> = new Set();
    private startTimers: (ioBroker.Timeout | undefined)[] = [];
    /** the states of the device were found */
    private found: boolean = false;
    private subscribed: boolean = false;
    private deleted: boolean = false;
    /** resolves when the states were read the first time */
    readonly ready: Promise<void>;

    /**
     * @param config instance and device
     * @param host access to the adapter
     */
    constructor(config: AlexaTimerConfig, host: AlexaTimerHost) {
        this.config = { instance: config.instance, serial: config.serial };
        this.host = host;
        this.ready = this.init();
    }

    /** `<instance>.Echo-Devices.<serial>` */
    get deviceId(): string {
        return `${this.config.instance}.Echo-Devices.${this.config.serial}`;
    }

    private get timerPattern(): string {
        return `${this.deviceId}.Timer.*`;
    }

    private async init(): Promise<void> {
        if (!isAlexaTimerComplete(this.config)) {
            this.host.log.warn(
                `Alexa timer: instance '${this.config.instance}' / device '${this.config.serial}' is not complete - the timer is ignored.`,
            );
            return;
        }
        try {
            await this.host.subscribePattern(this.timerPattern, this.onState);
            this.subscribed = true;
            const states = await this.host.getForeignStates(this.timerPattern);
            for (const [id, state] of Object.entries(states)) {
                this.apply(id, state);
            }
            this.found = `${this.deviceId}.Timer.activeTimerList` in states;
            if (!this.found) {
                this.host.log.warn(
                    `Alexa timer: ${this.deviceId}.Timer.activeTimerList does not exist - is the device or the alexa2 instance correct?`,
                );
            }
        } catch (err: unknown) {
            this.host.log.warn(`Alexa timer: cannot read the timers of ${this.deviceId}: ${String(err)}`);
        }
        this.notify();
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
     * @param state the state
     * @returns true when something of the timers changed
     */
    private apply(id: string, state: AlexaStateLike): boolean {
        const val: unknown = state ? state.val : undefined;
        switch (id.slice(`${this.deviceId}.Timer.`.length)) {
            case 'activeTimerList': {
                this.list = parseAlexaTimerList(val);
                this.found = true;
                this.stopped = pruneStoppedTimers(this.stopped, this.list, this.host.now());
                return true;
            }
            case 'triggered': {
                const triggered = val === true;
                const changed = triggered !== this.triggered;
                this.triggered = triggered;
                return changed;
            }
            case 'nextTimerId': {
                const next = typeof val === 'string' && val ? val : null;
                const changed = next !== this.nextTimerId;
                this.nextTimerId = next;
                return changed;
            }
            default:
                return false;
        }
    }

    /**
     * @returns the shown timer now
     */
    getSelection(): AlexaTimerSelection {
        const now = this.host.now();
        this.stopped = pruneStoppedTimers(this.stopped, this.list, now);
        return selectAlexaTimer({
            list: this.list,
            triggered: this.triggered,
            nextTimerId: this.nextTimerId,
            stopped: new Set(this.stopped.keys()),
            now,
        });
    }

    /**
     * @returns true when a timer can be started: the device was found
     */
    canStart(): boolean {
        return this.found && !this.deleted;
    }

    /**
     * @returns true when a timer is shown that can be stopped
     */
    canStop(): boolean {
        return !this.deleted && this.getSelection().entry !== undefined;
    }

    /**
     * @returns the shown timer as a countdown (screensaver, page item)
     */
    getView(): TimerCountdownView {
        return alexaCountdownView(this.getSelection(), this.canStart(), this.host.now());
    }

    /**
     * Sets a timer by a text command. alexa2 learns about it only from the history: it is read
     * {@link START_TRIGGER_DELAY_MS} later, and once more after {@link START_RETRY_DELAY_MS} when the timer is not in
     * the list by then.
     *
     * @param seconds duration
     * @returns true when the command was written
     */
    async start(seconds: number): Promise<boolean> {
        if (seconds <= 0 || !this.canStart()) {
            return false;
        }
        const known = new Set(this.list.map(t => t.id));
        const text = alexaTimerCommand(seconds, this.host.language());
        try {
            await this.host.setForeignState(`${this.deviceId}.Commands.textCommand`, text);
        } catch (err: unknown) {
            this.host.log.warn(`Alexa timer: cannot write the text command of ${this.deviceId}: ${String(err)}`);
            return false;
        }
        this.host.log.debug(`Alexa timer: '${text}' sent to ${this.deviceId}`);
        this.clearStartTimers();
        this.startTimers.push(
            this.host.setTimeout(() => {
                void this.readHistory().then(() => {
                    this.startTimers.push(
                        this.host.setTimeout(() => {
                            if (!this.list.some(t => !known.has(t.id))) {
                                void this.readHistory();
                            }
                        }, START_RETRY_DELAY_MS),
                    );
                });
            }, START_TRIGGER_DELAY_MS),
        );
        return true;
    }

    /**
     * Stops the shown timer at Amazon and hides it at once.
     *
     * @returns true when the stop was written
     */
    async stop(): Promise<boolean> {
        const entry = this.getSelection().entry;
        if (!entry || this.deleted) {
            return false;
        }
        try {
            await this.host.setForeignState(`${this.deviceId}.Timer.stopTimerId`, entry.id);
        } catch (err: unknown) {
            this.host.log.warn(`Alexa timer: cannot stop the timer of ${this.deviceId}: ${String(err)}`);
            return false;
        }
        this.host.log.debug(`Alexa timer: timer ${entry.id} of ${this.deviceId} stopped`);
        this.stopped.set(entry.id, entry.triggerTime);
        this.notify();
        return true;
    }

    private async readHistory(): Promise<void> {
        if (this.deleted) {
            return;
        }
        try {
            await this.host.setForeignState(`${this.config.instance}.History.#trigger`, true);
        } catch (err: unknown) {
            this.host.log.warn(`Alexa timer: cannot ask ${this.config.instance} for the history: ${String(err)}`);
        }
    }

    private clearStartTimers(): void {
        for (const timer of this.startTimers) {
            this.host.clearTimeout(timer);
        }
        this.startTimers = [];
    }

    async delete(): Promise<void> {
        this.deleted = true;
        this.clearStartTimers();
        this.listeners.clear();
        if (this.subscribed) {
            this.subscribed = false;
            try {
                await this.host.unsubscribePattern(this.timerPattern, this.onState);
            } catch (err: unknown) {
                this.host.log.debug(`Alexa timer: unsubscribe of ${this.timerPattern} failed: ${String(err)}`);
            }
        }
    }
}

/**
 * One {@link AlexaTimer} per device for the whole adapter: the screensaver and page items of the same Echo share it.
 */
export class AlexaTimerRegistry {
    private readonly host: AlexaTimerHost;
    private timers: Map<string, AlexaTimer> = new Map();

    /**
     * @param host access to the adapter
     */
    constructor(host: AlexaTimerHost) {
        this.host = host;
    }

    /**
     * @param config instance and device
     * @returns the timer of the device, its states are read (see {@link AlexaTimer.ready})
     */
    get(config: AlexaTimerConfig): AlexaTimer {
        const key = `${config.instance}.Echo-Devices.${config.serial}`;
        let timer = this.timers.get(key);
        if (!timer) {
            timer = new AlexaTimer(config, this.host);
            this.timers.set(key, timer);
        }
        return timer;
    }

    async deleteAll(): Promise<void> {
        const timers = [...this.timers.values()];
        this.timers.clear();
        await Promise.all(timers.map(t => t.delete()));
    }
}
