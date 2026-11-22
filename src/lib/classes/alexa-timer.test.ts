import { expect } from 'chai';
import {
    AlexaTimer,
    AlexaTimerRegistry,
    alexaCountdownView,
    alexaTimerCommand,
    parseAlexaTimerList,
    pruneStoppedTimers,
    selectAlexaTimer,
    START_RETRY_DELAY_MS,
    START_TRIGGER_DELAY_MS,
    STOPPED_KEEP_MS,
    type AlexaStateLike,
    type AlexaTimerEntry,
    type AlexaTimerHost,
} from './alexa-timer';
import {
    clockTimerSource,
    isAlexaTimerComplete,
    isAlexaTimerConfig,
    isClockTimerComplete,
    type ScreensaverClockTimer,
} from '../types/adminShareConfig';

const DEVICE = 'alexa2.0.Echo-Devices.G091';
const T0 = 1_700_000_000_000;

function entry(id: string, triggerTime: number): AlexaTimerEntry {
    return { id, triggerTime, label: null, durationMillis: 60_000 };
}

type Fake = {
    host: AlexaTimerHost;
    states: Record<string, AlexaStateLike>;
    writes: { id: string; val: unknown }[];
    warnings: string[];
    timers: { cb: () => void; at: number; cleared: boolean }[];
    clock: { now: number };
    /** a state changes like a push of alexa2 */
    push: (suffix: string, val: unknown) => void;
    /** runs the timers due up to now + ms */
    advance: (ms: number) => Promise<void>;
};

function fake(states: Record<string, unknown> = {}, language = 'de'): Fake {
    const clock = { now: T0 };
    const listeners: ((id: string, state: AlexaStateLike) => void)[] = [];
    const f: Fake = {
        states: Object.fromEntries(Object.entries(states).map(([k, v]) => [`${DEVICE}.${k}`, { val: v }])),
        writes: [],
        warnings: [],
        timers: [],
        clock,
        host: undefined as any,
        push: (suffix, val) => {
            const id = `${DEVICE}.${suffix}`;
            f.states[id] = { val };
            listeners.forEach(l => l(id, { val }));
        },
        advance: async ms => {
            const end = clock.now + ms;
            for (;;) {
                const next = f.timers.filter(t => !t.cleared && t.at <= end).sort((a, b) => a.at - b.at)[0];
                if (!next) {
                    break;
                }
                next.cleared = true;
                clock.now = next.at;
                next.cb();
                await new Promise(resolve => setImmediate(resolve));
            }
            clock.now = end;
        },
    };
    f.host = {
        log: { debug: () => undefined, warn: (msg: string) => void f.warnings.push(msg) },
        language: () => language,
        subscribePattern: async (_pattern, listener) => {
            listeners.push(listener);
            return Promise.resolve();
        },
        unsubscribePattern: async (_pattern, listener) => {
            listeners.splice(listeners.indexOf(listener), 1);
            return Promise.resolve();
        },
        getForeignStates: async pattern => {
            const prefix = pattern.replace('*', '');
            return Promise.resolve(Object.fromEntries(Object.entries(f.states).filter(([k]) => k.startsWith(prefix))));
        },
        setForeignState: async (id, val) => {
            f.writes.push({ id, val });
            return Promise.resolve();
        },
        setTimeout: (cb, ms) => {
            const t = { cb, at: clock.now + ms, cleared: false };
            f.timers.push(t);
            return t as any;
        },
        clearTimeout: timer => {
            if (timer) {
                (timer as any).cleared = true;
            }
        },
        now: () => clock.now,
    };
    return f;
}

const baseStates = (
    list: AlexaTimerEntry[] = [],
    triggered = false,
    nextTimerId: string | null = null,
): Record<string, unknown> => ({
    'Timer.activeTimerList': JSON.stringify(list),
    'Timer.triggered': triggered,
    'Timer.nextTimerId': nextTimerId,
});

describe('alexa-timer', () => {
    describe('parseAlexaTimerList', () => {
        it('reads the JSON of alexa2 and drops broken entries', () => {
            const list = parseAlexaTimerList(
                JSON.stringify([
                    { id: 'a', triggerTime: 5, label: null, durationMillis: 90_000 },
                    { id: 'b', triggerTime: 'x' },
                    { triggerTime: 4 },
                    null,
                    { id: 'c', triggerTime: 7, label: 'Tee' },
                ]),
            );
            expect(list).to.deep.equal([
                { id: 'a', triggerTime: 5, label: null, durationMillis: 90_000 },
                { id: 'c', triggerTime: 7, label: 'Tee', durationMillis: 0 },
            ]);
        });

        it('gives nothing for empty, broken or other values', () => {
            expect(parseAlexaTimerList('[]')).to.deep.equal([]);
            expect(parseAlexaTimerList('{')).to.deep.equal([]);
            expect(parseAlexaTimerList(null)).to.deep.equal([]);
            expect(parseAlexaTimerList('{"id":"a"}')).to.deep.equal([]);
        });
    });

    describe('selectAlexaTimer', () => {
        const none = new Set<string>();
        it('off without timers', () => {
            expect(
                selectAlexaTimer({ list: [], triggered: false, nextTimerId: null, stopped: none, now: T0 }),
            ).to.deep.equal({ status: 'off', entry: undefined });
        });

        it('the running timer with the shortest remaining time', () => {
            const list = [entry('long', T0 + 600_000), entry('short', T0 + 60_000)];
            const sel = selectAlexaTimer({ list, triggered: false, nextTimerId: 'short', stopped: none, now: T0 });
            expect(sel.status).to.equal('running');
            expect(sel.entry?.id).to.equal('short');
        });

        it('a timer at its end rings before a running one', () => {
            const list = [entry('run', T0 + 60_000), entry('due', T0 - 1000)];
            const sel = selectAlexaTimer({ list, triggered: true, nextTimerId: 'due', stopped: none, now: T0 });
            expect(sel).to.deep.equal({ status: 'expired', entry: list[1] });
        });

        it('triggered of alexa2 rings the next timer', () => {
            const list = [entry('a', T0 + 500)];
            const sel = selectAlexaTimer({ list, triggered: true, nextTimerId: 'a', stopped: none, now: T0 });
            expect(sel.status).to.equal('expired');
            expect(sel.entry?.id).to.equal('a');
        });

        it('hides stopped ids', () => {
            const list = [entry('stopped', T0 + 60_000), entry('other', T0 + 120_000)];
            const sel = selectAlexaTimer({
                list,
                triggered: false,
                nextTimerId: 'stopped',
                stopped: new Set(['stopped']),
                now: T0,
            });
            expect(sel.status).to.equal('running');
            expect(sel.entry?.id).to.equal('other');
        });

        it('ignores a false triggered of a stopped timer', () => {
            // no push after the stop: alexa2 keeps the timer and sets triggered at its old time
            const list = [entry('stopped', T0 - 100)];
            const sel = selectAlexaTimer({
                list,
                triggered: true,
                nextTimerId: 'stopped',
                stopped: new Set(['stopped']),
                now: T0,
            });
            expect(sel.status).to.equal('off');
        });

        it('a false triggered does not ring another running timer', () => {
            const list = [entry('stopped', T0 - 100), entry('run', T0 + 60_000)];
            const sel = selectAlexaTimer({
                list,
                triggered: true,
                nextTimerId: 'stopped',
                stopped: new Set(['stopped']),
                now: T0,
            });
            expect(sel.status).to.equal('running');
            expect(sel.entry?.id).to.equal('run');
        });
    });

    describe('pruneStoppedTimers', () => {
        it('keeps an id while it is in the list and not long over', () => {
            const stopped = new Map([['a', T0 + 1000]]);
            expect([...pruneStoppedTimers(stopped, [entry('a', T0 + 1000)], T0).keys()]).to.deep.equal(['a']);
        });
        it('drops an id that left the list', () => {
            const stopped = new Map([['a', T0 + 1000]]);
            expect(pruneStoppedTimers(stopped, [], T0).size).to.equal(0);
        });
        it('drops an id long after its end, even when alexa2 still lists it', () => {
            const stopped = new Map([['a', T0]]);
            const list = [entry('a', T0)];
            expect(pruneStoppedTimers(stopped, list, T0 + STOPPED_KEEP_MS).size).to.equal(1);
            expect(pruneStoppedTimers(stopped, list, T0 + STOPPED_KEEP_MS + 1).size).to.equal(0);
        });
    });

    describe('alexaTimerCommand', () => {
        it('German: whole minutes as minutes, else seconds, with digits', () => {
            expect(alexaTimerCommand(300, 'de')).to.equal('stelle einen Timer auf 5 Minuten');
            expect(alexaTimerCommand(90, 'de')).to.equal('stelle einen Timer auf 90 Sekunden');
            expect(alexaTimerCommand(45, 'de')).to.equal('stelle einen Timer auf 45 Sekunden');
        });
        it('English for every other language', () => {
            expect(alexaTimerCommand(120, 'en')).to.equal('set a timer for 2 minutes');
            expect(alexaTimerCommand(75, 'fr')).to.equal('set a timer for 75 seconds');
        });
        it('singular for exactly 1', () => {
            expect(alexaTimerCommand(60, 'de')).to.equal('stelle einen Timer auf 1 Minute');
            expect(alexaTimerCommand(1, 'de')).to.equal('stelle einen Timer auf 1 Sekunde');
            expect(alexaTimerCommand(60, 'en')).to.equal('set a timer for 1 minute');
            expect(alexaTimerCommand(1, 'en')).to.equal('set a timer for 1 second');
        });
    });

    describe('alexaCountdownView', () => {
        it('running with the end of the timer', () => {
            const view = alexaCountdownView({ status: 'running', entry: entry('a', T0 + 5000) }, true, T0);
            expect(view).to.deep.equal({
                status: 'running',
                remainingMs: 5000,
                endTs: T0 + 5000,
                canStart: true,
                canStop: true,
            });
        });
        it('off can not be stopped', () => {
            expect(alexaCountdownView({ status: 'off', entry: undefined }, true, T0)).to.deep.include({
                status: 'off',
                canStop: false,
            });
        });
    });

    describe('AlexaTimer', () => {
        it('reads the states and reports changes', async () => {
            const f = fake(baseStates());
            const timer = new AlexaTimer({ instance: 'alexa2.0', serial: 'G091' }, f.host);
            await timer.ready;
            let calls = 0;
            timer.addListener(() => calls++);
            expect(timer.getView().status).to.equal('off');
            expect(timer.canStart()).to.equal(true);
            f.push('Timer.activeTimerList', JSON.stringify([entry('a', T0 + 60_000)]));
            expect(calls).to.equal(1);
            expect(timer.getView()).to.deep.include({ status: 'running', remainingMs: 60_000 });
            f.push('Timer.nextTimerDate', T0 + 60_000);
            expect(calls).to.equal(1);
        });

        it('a device without states can not start', async () => {
            const f = fake({});
            const timer = new AlexaTimer({ instance: 'alexa2.0', serial: 'G091' }, f.host);
            await timer.ready;
            expect(timer.canStart()).to.equal(false);
            expect(await timer.start(60)).to.equal(false);
            expect(f.writes).to.deep.equal([]);
            expect(f.warnings).to.have.length(1);
        });

        it('stop writes the id and hides the timer at once', async () => {
            const f = fake(baseStates([entry('a', T0 + 60_000)], false, 'a'));
            const timer = new AlexaTimer({ instance: 'alexa2.0', serial: 'G091' }, f.host);
            await timer.ready;
            let calls = 0;
            timer.addListener(() => calls++);
            expect(await timer.stop()).to.equal(true);
            expect(f.writes).to.deep.equal([{ id: `${DEVICE}.Timer.stopTimerId`, val: 'a' }]);
            expect(calls).to.equal(1);
            expect(timer.getView().status).to.equal('off');
            // no push: alexa2 sets triggered at the old time - still off
            await f.advance(60_000);
            f.push('Timer.triggered', true);
            expect(timer.getView().status).to.equal('off');
            // alexa2 clears up a minute later, the id is free again
            f.push('Timer.activeTimerList', '[]');
            f.push('Timer.triggered', false);
            expect(timer.getView().status).to.equal('off');
            expect(await timer.stop()).to.equal(false);
        });

        it('stops a ringing timer', async () => {
            const f = fake(baseStates([entry('a', T0 - 1000)], true, 'a'));
            const timer = new AlexaTimer({ instance: 'alexa2.0', serial: 'G091' }, f.host);
            await timer.ready;
            expect(timer.getView()).to.deep.include({ status: 'expired', canStop: true });
            expect(await timer.stop()).to.equal(true);
            expect(f.writes[0]).to.deep.equal({ id: `${DEVICE}.Timer.stopTimerId`, val: 'a' });
            expect(timer.getView().status).to.equal('off');
        });

        it('start sends the text and reads the history 5 s later', async () => {
            const f = fake(baseStates());
            const timer = new AlexaTimer({ instance: 'alexa2.0', serial: 'G091' }, f.host);
            await timer.ready;
            expect(await timer.start(90)).to.equal(true);
            expect(f.writes).to.deep.equal([
                { id: `${DEVICE}.Commands.textCommand`, val: 'stelle einen Timer auf 90 Sekunden' },
            ]);
            await f.advance(START_TRIGGER_DELAY_MS - 1);
            expect(f.writes).to.have.length(1);
            await f.advance(1);
            expect(f.writes[1]).to.deep.equal({ id: 'alexa2.0.History.#trigger', val: true });
            // the timer arrives: no second reading
            f.push('Timer.activeTimerList', JSON.stringify([entry('new', T0 + 90_000)]));
            await f.advance(START_RETRY_DELAY_MS + 1000);
            expect(f.writes).to.have.length(2);
            expect(timer.getView().status).to.equal('running');
        });

        it('start reads the history once more when the timer did not arrive', async () => {
            const f = fake(baseStates([entry('old', T0 + 600_000)]));
            const timer = new AlexaTimer({ instance: 'alexa2.0', serial: 'G091' }, f.host);
            await timer.ready;
            await timer.start(120);
            expect(f.writes[0].val).to.equal('stelle einen Timer auf 2 Minuten');
            await f.advance(START_TRIGGER_DELAY_MS + START_RETRY_DELAY_MS + 60_000);
            expect(f.writes.map(w => w.id)).to.deep.equal([
                `${DEVICE}.Commands.textCommand`,
                'alexa2.0.History.#trigger',
                'alexa2.0.History.#trigger',
            ]);
        });

        it('a deleted timer stops its pending readings and listens no more', async () => {
            const f = fake(baseStates(), 'en');
            const timer = new AlexaTimer({ instance: 'alexa2.0', serial: 'G091' }, f.host);
            await timer.ready;
            await timer.start(60);
            expect(f.writes[0].val).to.equal('set a timer for 1 minute');
            await timer.delete();
            await f.advance(60_000);
            expect(f.writes).to.have.length(1);
        });

        it('an incomplete configuration is ignored with a warning', async () => {
            const f = fake(baseStates());
            const timer = new AlexaTimer({ instance: 'alexa2.0', serial: '' }, f.host);
            await timer.ready;
            expect(timer.canStart()).to.equal(false);
            expect(f.warnings).to.have.length(1);
        });
    });

    describe('AlexaTimerRegistry', () => {
        it('one timer per device', async () => {
            const f = fake(baseStates());
            const registry = new AlexaTimerRegistry(f.host);
            const a = registry.get({ instance: 'alexa2.0', serial: 'G091' });
            expect(registry.get({ instance: 'alexa2.0', serial: 'G091' })).to.equal(a);
            expect(registry.get({ instance: 'alexa2.1', serial: 'G091' })).to.not.equal(a);
            await registry.deleteAll();
            expect(registry.get({ instance: 'alexa2.0', serial: 'G091' })).to.not.equal(a);
        });
    });

    describe('configuration (adminShareConfig)', () => {
        it('the form and what is complete', () => {
            expect(isAlexaTimerConfig({ instance: 'alexa2.0', serial: 'G091' })).to.equal(true);
            expect(isAlexaTimerConfig({ instance: 'alexa2.0' })).to.equal(false);
            expect(isAlexaTimerComplete({ instance: 'alexa2.0', serial: 'G091' })).to.equal(true);
            expect(isAlexaTimerComplete({ instance: 'alexa2.0', serial: '' })).to.equal(false);
            expect(isAlexaTimerComplete({ instance: '', serial: 'G091' })).to.equal(false);
            expect(isAlexaTimerComplete({ instance: 'alexa2.0', serial: 'a.b' })).to.equal(false);
            expect(isAlexaTimerComplete({ instance: 'alexa2.0', serial: '*' })).to.equal(false);
        });

        it('the source of the screensaver timer: alexa wins', () => {
            const base: ScreensaverClockTimer = { enabled: true, activeState: '', dataState: '' };
            expect(clockTimerSource(base)).to.equal('states');
            expect(clockTimerSource({ ...base, itemId: '' })).to.equal('item');
            expect(clockTimerSource({ ...base, itemId: 'x', alexa: { instance: '', serial: '' } })).to.equal('alexa');
            expect(isClockTimerComplete({ ...base, alexa: { instance: 'alexa2.0', serial: '' } })).to.equal(false);
            expect(isClockTimerComplete({ ...base, alexa: { instance: 'alexa2.1', serial: 'G091' } })).to.equal(true);
        });
    });
});
