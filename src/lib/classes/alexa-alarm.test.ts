import { expect } from 'chai';
import {
    AlexaAlarms,
    alarmClockTime,
    alarmTimeValue,
    alexaAlarmLabel,
    alexaAlarmsOf,
    isPastSingleAlarm,
    nextActiveAlarm,
    parseAlarmTime,
    selectAlexaAlarm,
    type AlexaAlarmEntry,
} from './alexa-alarm';
import { AlexaTimerRegistry, type AlexaStateLike, type AlexaTimerHost } from './alexa-timer';

const PREFIX = 'alexa2.0.Echo-Devices.G091.Alarm.';

function alarm(id: string, fields: Partial<AlexaAlarmEntry> = {}): AlexaAlarmEntry {
    return {
        id,
        time: '07:30:00',
        date: '2026-11-13',
        enabled: false,
        nextTriggerDate: undefined,
        recurringPattern: '0',
        recurringDays: '',
        label: '',
        ...fields,
    };
}

describe('alexa-alarm', () => {
    describe('time', () => {
        it('reads hh:mm and hh:mm:ss', () => {
            expect(parseAlarmTime('07:30:00')).to.deep.equal({ hour: 7, minute: 30 });
            expect(parseAlarmTime('7:05')).to.deep.equal({ hour: 7, minute: 5 });
            expect(parseAlarmTime('25:00')).to.equal(undefined);
            expect(parseAlarmTime('')).to.equal(undefined);
        });

        it('shows the next point in time in local time, else the time state', () => {
            const next = new Date(2026, 10, 23, 6, 45).getTime();
            expect(alarmClockTime(alarm('a', { nextTriggerDate: next }))).to.deep.equal({ hour: 6, minute: 45 });
            expect(alarmClockTime(alarm('a'))).to.deep.equal({ hour: 7, minute: 30 });
        });

        it('writes hh:mm:00, clamped like the fields of the HMI', () => {
            expect(alarmTimeValue(6, 5)).to.equal('06:05:00');
            expect(alarmTimeValue(59, 59)).to.equal('23:59:00');
        });
    });

    describe('isPastSingleAlarm', () => {
        const now = new Date(2026, 10, 22, 12, 0).getTime();
        it('a single alarm of an earlier day is in the past', () => {
            expect(isPastSingleAlarm(alarm('a', { date: '2026-11-13' }), now)).to.equal(true);
        });
        it('a single alarm later today or in the future is not', () => {
            expect(isPastSingleAlarm(alarm('a', { date: '2026-11-22', time: '18:00:00' }), now)).to.equal(false);
            expect(isPastSingleAlarm(alarm('a', { date: '2026-11-23' }), now)).to.equal(false);
        });
        it('a repeating alarm never is', () => {
            expect(
                isPastSingleAlarm(alarm('a', { recurringPattern: 'XXXX-WD', recurringDays: 'MO,TU,WE,TH,FR' }), now),
            ).to.equal(false);
        });
        it('the next point in time decides when it is known', () => {
            expect(isPastSingleAlarm(alarm('a', { date: '2026-11-13', nextTriggerDate: now + 1000 }), now)).to.equal(
                false,
            );
        });
    });

    describe('selection', () => {
        const list = [
            alarm('off', { enabled: false }),
            alarm('late', { enabled: true, nextTriggerDate: 3000 }),
            alarm('early', { enabled: true, nextTriggerDate: 2000 }),
            alarm('noNext', { enabled: true }),
        ];
        it('next active: on, with a next point in time, the earliest', () => {
            expect(nextActiveAlarm(list)?.id).to.equal('early');
            expect(selectAlexaAlarm(list, undefined)).to.deep.include({ missing: false });
            expect(selectAlexaAlarm(list, undefined).entry?.id).to.equal('early');
        });
        it('next active: none when nothing is on', () => {
            expect(selectAlexaAlarm([alarm('a')], undefined)).to.deep.equal({ entry: undefined, missing: false });
        });
        it('after switching the shown one off the next one moves up', () => {
            const after = list.map(a => (a.id === 'early' ? { ...a, enabled: false, nextTriggerDate: undefined } : a));
            expect(nextActiveAlarm(after)?.id).to.equal('late');
        });
        it('fixed: the alarm also while off, missing when it is gone', () => {
            expect(selectAlexaAlarm(list, 'off').entry?.id).to.equal('off');
            expect(selectAlexaAlarm(list, 'gone')).to.deep.equal({ entry: undefined, missing: true });
        });
    });

    describe('alexaAlarmLabel', () => {
        it('time and days, or once with the date, the label in front', () => {
            expect(
                alexaAlarmLabel(alarm('a', { recurringDays: 'MO,TU,WE,TH,FR', recurringPattern: 'XXXX-WD' }), 'once'),
            ).to.equal('07:30 · MO,TU,WE,TH,FR');
            expect(alexaAlarmLabel(alarm('a'), 'einmalig')).to.equal('07:30 · einmalig 2026-11-13');
            expect(
                alexaAlarmLabel(alarm('a', { label: 'Arbeit', recurringPattern: 'P1D', recurringDays: '' }), 'x'),
            ).to.equal('Arbeit · 07:30 · P1D');
        });
    });

    describe('alexaAlarmsOf', () => {
        it('builds the alarms from the states, skips New and triggered', () => {
            const states = new Map<string, unknown>([
                [`${PREFIX}New`, ''],
                [`${PREFIX}triggered`, null],
                [`${PREFIX}u1.time`, '07:30:00'],
                [`${PREFIX}u1.enabled`, true],
                [`${PREFIX}u1.nextTriggerDate`, 1234],
                [`${PREFIX}u1.recurringPattern`, '0'],
                [`${PREFIX}u1.sound`, 'x'],
                [`${PREFIX}u2.nextTriggerDate`, null],
            ]);
            expect(alexaAlarmsOf(PREFIX, states)).to.deep.equal([
                {
                    id: 'u1',
                    time: '07:30:00',
                    date: '',
                    enabled: true,
                    nextTriggerDate: 1234,
                    recurringPattern: '0',
                    recurringDays: '',
                    label: '',
                },
            ]);
        });
    });

    describe('AlexaAlarms', () => {
        function fake(
            initial: Record<string, unknown>,
            channels?: string[],
        ): {
            host: AlexaTimerHost;
            writes: { id: string; val: unknown }[];
            push: (id: string, val: unknown) => void;
            channels: string[];
        } {
            const listeners: ((id: string, state: AlexaStateLike) => void)[] = [];
            const writes: { id: string; val: unknown }[] = [];
            const list = channels ?? [];
            const host: AlexaTimerHost = {
                log: { debug: () => undefined, warn: () => undefined },
                language: () => 'de',
                subscribePattern: async (_p, l) => void listeners.push(l),
                unsubscribePattern: async () => Promise.resolve(),
                getForeignStates: async () =>
                    Promise.resolve(Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, { val: v }]))),
                setForeignState: async (id, val) => void writes.push({ id, val }),
                setTimeout: () => undefined,
                clearTimeout: () => undefined,
                now: () => 0,
                getChannelIds: channels ? async () => Promise.resolve(list) : undefined,
            };
            return {
                host,
                writes,
                channels: list,
                push: (id, val) => listeners.forEach(l => l(id, val === null ? null : { val })),
            };
        }

        it('follows new and deleted alarms through the states', async () => {
            const f = fake({ [`${PREFIX}u1.time`]: '07:30:00', [`${PREFIX}u1.enabled`]: true });
            const alarms = new AlexaAlarms({ instance: 'alexa2.0', serial: 'G091' }, f.host);
            await alarms.ready;
            let calls = 0;
            alarms.addListener(() => calls++);
            expect(alarms.getAlarms().map(a => a.id)).to.deep.equal(['u1']);
            f.push(`${PREFIX}u2.time`, '06:00:00');
            expect(alarms.getAlarms().map(a => a.id)).to.deep.equal(['u1', 'u2']);
            f.push(`${PREFIX}u1.time`, null);
            f.push(`${PREFIX}u1.enabled`, null);
            expect(alarms.getAlarms().map(a => a.id)).to.deep.equal(['u2']);
            expect(calls).to.equal(3);
        });

        it('refresh drops an alarm whose channel is gone', async () => {
            const f = fake(
                { [`${PREFIX}u1.time`]: '07:30:00', [`${PREFIX}u2.time`]: '08:00:00', [`${PREFIX}New`]: '' },
                ['u2'],
            );
            const alarms = new AlexaAlarms({ instance: 'alexa2.0', serial: 'G091' }, f.host, f.host.getChannelIds);
            await alarms.ready;
            await alarms.refresh();
            expect(alarms.getAlarms().map(a => a.id)).to.deep.equal(['u2']);
        });

        it('writes enabled and time', async () => {
            const f = fake({});
            const alarms = new AlexaAlarms({ instance: 'alexa2.0', serial: 'G091' }, f.host);
            await alarms.ready;
            await alarms.setEnabled('u1', true);
            await alarms.setTime('u1', 6, 5);
            expect(f.writes).to.deep.equal([
                { id: `${PREFIX}u1.enabled`, val: true },
                { id: `${PREFIX}u1.time`, val: '06:05:00' },
            ]);
        });

        it('the registry keeps one per device', () => {
            const f = fake({});
            const registry = new AlexaTimerRegistry(f.host);
            const a = registry.getAlarms({ instance: 'alexa2.0', serial: 'G091' });
            expect(registry.getAlarms({ instance: 'alexa2.0', serial: 'G091' })).to.equal(a);
        });
    });
});
