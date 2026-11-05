import { expect } from 'chai';
import { checkClockTimerPatterns, isClockTimerComplete } from '../types/adminShareConfig';
import {
    isCountdownCommon,
    isTimerOn,
    nextTimerWakeMs,
    parseTimerData,
    selectTimer,
    stepTimerSlot,
    timerSlotKey,
    timerText,
    type TimerSlotInput,
    type TimerSlotMemory,
} from './screensaver-timer';

const NOW = new Date(2026, 10, 5, 12, 0, 0, 0).getTime();
const MIN = 60_000;

/**
 * runs the inputs through one slot
 *
 * @param inputs values in their order, each with its time (default NOW)
 * @returns the state after the last one
 */
function run(inputs: (TimerSlotInput & { now?: number })[]): { memory: TimerSlotMemory; started: boolean } {
    let result: { memory: TimerSlotMemory; started: boolean } | undefined;
    for (const input of inputs) {
        result = stepTimerSlot(result?.memory, input, input.now ?? NOW);
    }
    return result!;
}

const statusOf = (memory: TimerSlotMemory, now = NOW): string => selectTimer(new Map([['', memory]]), now).status;

describe('lib/pages/screensaver-timer', () => {
    describe('parseTimerData', () => {
        it('reads the kinds of numbers', () => {
            expect(parseTimerData(0, undefined, NOW)).to.deep.equal({ kind: 'zero' });
            expect(parseTimerData(-5, undefined, NOW)).to.deep.equal({ kind: 'zero' });
            expect(parseTimerData(1_800_000_000_000, undefined, NOW)).to.deep.equal({
                kind: 'target',
                targetTs: 1_800_000_000_000,
            });
            expect(parseTimerData(1_800_000_000, undefined, NOW)).to.deep.equal({
                kind: 'target',
                targetTs: 1_800_000_000_000,
            });
            expect(parseTimerData(90, undefined, NOW)).to.deep.equal({ kind: 'countdown', remainingMs: 90_000 });
            expect(parseTimerData(90_000, 'ms', NOW)).to.deep.equal({ kind: 'countdown', remainingMs: 90_000 });
        });

        it('reads empty and unknown values as no timer', () => {
            for (const value of [null, undefined, true, '', 'bald', '25:00', '12:60', '123', '2026-13-45']) {
                expect(parseTimerData(value, undefined, NOW), String(value)).to.deep.equal({ kind: 'none' });
            }
        });

        it('reads an ISO date', () => {
            expect(parseTimerData('2026-11-05T13:00:00.000Z', undefined, NOW)).to.deep.equal({
                kind: 'target',
                targetTs: Date.UTC(2026, 10, 5, 13),
            });
        });

        it('reads HH:MM today, or the next day when it is over', () => {
            expect(parseTimerData('12:30', undefined, NOW)).to.deep.equal({
                kind: 'target',
                targetTs: new Date(2026, 10, 5, 12, 30).getTime(),
            });
            expect(parseTimerData('11:30', undefined, NOW)).to.deep.equal({
                kind: 'target',
                targetTs: new Date(2026, 10, 6, 11, 30).getTime(),
            });
            expect(parseTimerData('12:00', undefined, NOW)).to.deep.equal({
                kind: 'target',
                targetTs: new Date(2026, 10, 6, 12, 0).getTime(),
            });
            expect(parseTimerData('00:15', undefined, new Date(2026, 10, 5, 23, 50).getTime())).to.deep.equal({
                kind: 'target',
                targetTs: new Date(2026, 10, 6, 0, 15).getTime(),
            });
        });
    });

    describe('isTimerOn / isCountdownCommon', () => {
        it('reads the on/off state', () => {
            for (const value of [true, 1, 'true', 'on', '1']) {
                expect(isTimerOn(value), String(value)).to.equal(true);
            }
            for (const value of [false, 0, 'false', '', null, undefined, NaN]) {
                expect(isTimerOn(value), String(value)).to.equal(false);
            }
        });

        it('knows a state that counts down from unit and role', () => {
            expect(isCountdownCommon({ unit: 's' })).to.equal(true);
            expect(isCountdownCommon({ unit: 'ms' })).to.equal(true);
            expect(isCountdownCommon({ role: 'value.timer' })).to.equal(true);
            expect(isCountdownCommon({ role: 'level.timer' })).to.equal(true);
            expect(isCountdownCommon({ role: 'date' })).to.equal(false);
            expect(isCountdownCommon({ role: 'value', unit: '%' })).to.equal(false);
            expect(isCountdownCommon(undefined)).to.equal(false);
        });
    });

    describe('timerText', () => {
        it('rounds up to tenths of a minute, 0.0 only when the time is over', () => {
            expect(timerText(0)).to.equal('0.0');
            expect(timerText(-5)).to.equal('0.0');
            expect(timerText(1)).to.equal('0.1');
            expect(timerText(1000)).to.equal('0.1');
            expect(timerText(6000)).to.equal('0.1');
            expect(timerText(6001)).to.equal('0.2');
            expect(timerText(7000)).to.equal('0.2');
            expect(timerText(60_000)).to.equal('1.0');
            expect(timerText(90_000)).to.equal('1.5');
            expect(timerText(125.5 * MIN)).to.equal('125.5');
        });

        it('goes from tenths to whole minutes without a value of 6 characters', () => {
            expect(timerText(999.9 * MIN)).to.equal('999.9');
            expect(timerText(999.9 * MIN + 1)).to.equal('1000');
            expect(timerText(1000 * MIN)).to.equal('1000');
            expect(timerText(1000 * MIN + 1)).to.equal('1001');
            expect(timerText(1234 * MIN)).to.equal('1234');
        });

        it('stops at the width of the field', () => {
            expect(timerText(9999 * MIN)).to.equal('9999');
            expect(timerText(9999 * MIN + 1)).to.equal('9999');
            expect(timerText(100_000 * MIN)).to.equal('9999');
        });
    });

    describe('stepTimerSlot', () => {
        const target = NOW + 10 * MIN;

        it('off: done, whatever the data says', () => {
            for (const value of [target, NOW - MIN, 0, 90, '12:30']) {
                const { memory, started } = run([{ on: false, value }]);
                expect(statusOf(memory), String(value)).to.equal('off');
                expect(started).to.equal(false);
            }
        });

        it('on with a past end is expired, also as first value', () => {
            const { memory, started } = run([{ on: true, value: NOW - MIN }]);
            expect(statusOf(memory)).to.equal('expired');
            expect(started).to.equal(true);
        });

        it('on: expires with the time and stays until off', () => {
            const { memory } = run([{ on: true, value: target }]);
            expect(statusOf(memory)).to.equal('running');
            expect(statusOf(memory, target)).to.equal('expired');
            expect(statusOf(memory, target + 3_600_000)).to.equal('expired');
            const off = stepTimerSlot(memory, { on: false, value: target }, target + 1);
            expect(statusOf(off.memory, target + 1)).to.equal('off');
        });

        it('a change of the data alone does not end the alarm, unless it lies in the future again', () => {
            const expired = run([{ on: true, value: NOW - MIN }]);
            for (const value of [0, null, '', 'kaputt', NOW - 5 * MIN]) {
                const next = stepTimerSlot(expired.memory, { on: true, value }, NOW);
                expect(statusOf(next.memory), String(value)).to.equal('expired');
            }
            const again = stepTimerSlot(expired.memory, { on: true, value: target }, NOW);
            expect(statusOf(again.memory)).to.equal('running');
            expect(again.started).to.equal(true);
        });

        it('targetTs 0 without a run is no timer yet', () => {
            const { memory, started } = run([{ on: true, value: 0 }]);
            expect(statusOf(memory)).to.equal('off');
            expect(started).to.equal(false);
        });

        it('targetTs 0 after a run stays expired while the state is on', () => {
            const { memory, started } = run([
                { on: true, value: target },
                { on: true, value: 0 },
            ]);
            expect(statusOf(memory)).to.equal('expired');
            expect(started).to.equal(false);
        });

        it('targetTs 0 after off and on again is no timer yet', () => {
            const { memory } = run([
                { on: true, value: target },
                { on: false, value: 0 },
                { on: true, value: 0 },
            ]);
            expect(statusOf(memory)).to.equal('off');
        });

        it('a state that counts down: 0 is expired, also right after a restart', () => {
            const { memory, started } = run([{ on: true, value: 0, countdownState: true }]);
            expect(statusOf(memory)).to.equal('expired');
            expect(started).to.equal(true);
            expect(statusOf(run([{ on: false, value: 0, countdownState: true }]).memory)).to.equal('off');
        });

        it('a state that counts down is seen by its run even without unit or role', () => {
            const { memory, started } = run([
                { on: true, value: 90 },
                { on: true, value: 30 },
                { on: true, value: 0 },
            ]);
            expect(statusOf(memory)).to.equal('expired');
            expect(started).to.equal(false);
        });

        it('a state that counts down starts a new timer only with a larger remaining time', () => {
            const running = run([{ on: true, value: 90 }]);
            expect(running.started).to.equal(true);
            expect(stepTimerSlot(running.memory, { on: true, value: 60 }, NOW).started).to.equal(false);
            expect(stepTimerSlot(running.memory, { on: true, value: 300 }, NOW).started).to.equal(true);
        });

        it('on after off and another end are new timers, the same values are not', () => {
            const first = run([{ on: true, value: target }]);
            expect(first.started).to.equal(true);
            expect(stepTimerSlot(first.memory, { on: true, value: target }, NOW).started).to.equal(false);
            expect(stepTimerSlot(first.memory, { on: true, value: target + MIN }, NOW).started).to.equal(true);
            const off = stepTimerSlot(first.memory, { on: false, value: target }, NOW);
            expect(stepTimerSlot(off.memory, { on: true, value: target }, NOW).started).to.equal(true);
        });

        it('HH:MM keeps its day while the value stays - over means expired, not tomorrow', () => {
            const running = run([{ on: true, value: '12:30' }]);
            const later = new Date(2026, 10, 5, 12, 31).getTime();
            const same = stepTimerSlot(running.memory, { on: true, value: '12:30' }, later);
            expect(same.started).to.equal(false);
            expect(statusOf(same.memory, later)).to.equal('expired');
        });

        it('HH:MM across midnight and on again reads the time anew', () => {
            const night = new Date(2026, 10, 5, 23, 50).getTime();
            const running = stepTimerSlot(undefined, { on: true, value: '00:15' }, night);
            expect(selectTimer(new Map([['', running.memory]]), night).text).to.equal('25.0');
            const off = stepTimerSlot(running.memory, { on: false, value: '00:15' }, night);
            const later = new Date(2026, 10, 6, 0, 20).getTime();
            const again = stepTimerSlot(off.memory, { on: true, value: '00:15' }, later);
            expect(selectTimer(new Map([['', again.memory]]), later).text).to.equal('1435');
        });
    });

    describe('slots', () => {
        const slot = (value: unknown, on = true): TimerSlotMemory =>
            stepTimerSlot(undefined, { on, value }, NOW).memory;

        it('pairs on/off and data by the part of the *', () => {
            const active = 'timer.0.global.*.aktiv';
            const data = 'timer.0.global.*.targetTs';
            expect(timerSlotKey(active, 'timer.0.global.2.aktiv')).to.equal('2');
            expect(timerSlotKey(data, 'timer.0.global.2.targetTs')).to.equal('2');
            expect(timerSlotKey(active, 'timer.0.global.kueche.1.aktiv')).to.equal('kueche.1');
            expect(timerSlotKey(active, 'timer.0.global.2.targetTs')).to.equal(undefined);
            expect(timerSlotKey(active, 'timer.0.other.2.aktiv')).to.equal(undefined);
            expect(timerSlotKey(active, 'timer.0.global..aktiv')).to.equal(undefined);
            expect(timerSlotKey('kein.muster', 'kein.muster')).to.equal(undefined);
        });

        it('shows the running slot with the shortest remaining time', () => {
            const selection = selectTimer(
                new Map([
                    ['1', slot(NOW + 20 * MIN)],
                    ['2', slot(NOW + 5 * MIN)],
                    ['3', slot(NOW + 10 * MIN)],
                    ['4', slot(NOW + MIN, false)],
                ]),
                NOW,
            );
            expect(selection).to.deep.include({ status: 'running', text: '5.0', key: '2' });
        });

        it('shows an alarm before a running slot', () => {
            const selection = selectTimer(
                new Map([
                    ['1', slot(NOW + MIN)],
                    ['2', slot(NOW - MIN)],
                ]),
                NOW,
            );
            expect(selection).to.deep.include({ status: 'expired', text: '0.0', key: '2' });
        });

        it('shows the clock when no slot is active', () => {
            const selection = selectTimer(
                new Map([
                    ['1', slot(0)],
                    ['2', slot(NOW + MIN, false)],
                ]),
                NOW,
            );
            expect(selection.status).to.equal('off');
            expect(selection.key).to.equal(undefined);
        });

        it('a slot gets free and is used again', () => {
            const a = stepTimerSlot(undefined, { on: true, value: NOW + MIN }, NOW);
            const free = stepTimerSlot(a.memory, { on: false, value: 0 }, NOW);
            expect(statusOf(free.memory)).to.equal('off');
            const again = stepTimerSlot(free.memory, { on: true, value: NOW + 2 * MIN }, NOW);
            expect(again.started).to.equal(true);
            expect(selectTimer(new Map([['1', again.memory]]), NOW)).to.deep.include({ text: '2.0', key: '1' });
        });
    });

    describe('configuration', () => {
        it('checks the two patterns', () => {
            expect(checkClockTimerPatterns('a.0.*.aktiv', 'a.0.*.targetTs')).to.equal('ok');
            expect(checkClockTimerPatterns('a.0.*.aktiv', '')).to.equal('missing');
            expect(checkClockTimerPatterns('a.0.aktiv', 'a.0.*.targetTs')).to.equal('wildcard');
            expect(checkClockTimerPatterns('a.0.*.*.aktiv', 'a.0.*.targetTs')).to.equal('wildcard');
            expect(checkClockTimerPatterns('*.aktiv', '*.targetTs')).to.equal('prefix');
            expect(checkClockTimerPatterns('a.0.*.aktiv', 'a.0.*.aktiv')).to.equal('same');
        });

        it('needs both states or both patterns', () => {
            const base = { enabled: true, activeState: 'a', dataState: 'b' };
            expect(isClockTimerComplete(base)).to.equal(true);
            expect(isClockTimerComplete({ ...base, activeState: ' ' })).to.equal(false);
            expect(isClockTimerComplete({ ...base, dataState: '' })).to.equal(false);
            expect(
                isClockTimerComplete({
                    enabled: true,
                    activeState: '',
                    dataState: '',
                    activePattern: 'a.0.*.x',
                    dataPattern: 'a.0.*.y',
                }),
            ).to.equal(true);
            expect(isClockTimerComplete({ ...base, activePattern: 'a.0.*.x' })).to.equal(false);
        });
    });

    describe('nextTimerWakeMs', () => {
        const slots = (...targets: number[]): Map<string, TimerSlotMemory> =>
            new Map(
                targets.map((value, i): [string, TimerSlotMemory] => [
                    String(i),
                    stepTimerSlot(undefined, { on: true, value }, NOW).memory,
                ]),
            );

        const wake = (map: Map<string, TimerSlotMemory>, tappedAway = false, now = NOW): number | undefined =>
            nextTimerWakeMs(map, selectTimer(map, now), tappedAway, now);

        it('waits for the next tenth of a minute, counted back from the end', () => {
            expect(wake(slots(NOW + 90_000))).to.equal(6000);
            expect(wake(slots(NOW + 7000))).to.equal(1000);
            expect(wake(slots(NOW + 6001))).to.equal(1);
            expect(wake(slots(NOW + 6000))).to.equal(6000);
            // 0.1 turns into 0.0 exactly at the end
            expect(wake(slots(NOW + 1000))).to.equal(1000);
        });

        it('each wake up lands on a change of the text and the last one on the end', () => {
            const map = slots(NOW + 13_500);
            const seen: [number, string][] = [];
            let now = NOW;
            for (let wait = wake(map, false, now); wait !== undefined; wait = wake(map, false, now)) {
                now += wait;
                seen.push([now - NOW, selectTimer(map, now).text]);
            }
            expect(seen).to.deep.equal([
                [1500, '0.2'],
                [7500, '0.1'],
                [13_500, '0.0'],
            ]);
        });

        it('waits for the next whole minute from 1000 minutes on, down to 999.9', () => {
            expect(wake(slots(NOW + 1001 * MIN))).to.equal(MIN);
            expect(wake(slots(NOW + 1000 * MIN + 30_000))).to.equal(30_000);
            expect(wake(slots(NOW + 1000 * MIN + 1))).to.equal(1);
            expect(wake(slots(NOW + 1000 * MIN))).to.equal(6000);
            expect(wake(slots(NOW + 999.9 * MIN + 1))).to.equal(1);
            expect(wake(slots(NOW + 999.9 * MIN))).to.equal(6000);
        });

        it('waits until the text leaves 9999, at most one day', () => {
            expect(wake(slots(NOW + 9999 * MIN))).to.equal(MIN);
            expect(wake(slots(NOW + 9999 * MIN + 1))).to.equal(1);
            expect(wake(slots(NOW + 10_000 * MIN))).to.equal(MIN);
            expect(wake(slots(NOW + 20_000 * MIN))).to.equal(86_400_000);
        });

        it('waits for the end only when the timer was tapped away, at most one day', () => {
            expect(wake(slots(NOW + 90_000), true)).to.equal(90_000);
            expect(wake(slots(NOW + 40 * 86_400_000), true)).to.equal(86_400_000);
        });

        it('waits for nothing without a fixed end or after the end', () => {
            expect(wake(slots(90))).to.equal(undefined);
            expect(wake(slots(NOW - MIN))).to.equal(undefined);
            expect(wake(slots(0))).to.equal(undefined);
        });

        it('also waits for the end of a slot that is not shown', () => {
            // the state of slot 0 counts down by itself and has less time left than the end of slot 1
            expect(wake(slots(600, NOW + 15 * MIN + 1000))).to.equal(15 * MIN + 1000);
        });
    });
});
