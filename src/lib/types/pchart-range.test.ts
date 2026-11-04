import { expect } from 'chai';
import {
    isPChartRangeKey,
    PCHART_CUSTOM_HOURS_DEFAULT,
    pchartRangeKeys,
    resolveRange,
    type PChartRangeKey,
} from './adminShareConfig';

/**
 * Local timestamp - the ranges are resolved in the local time of the process, so the expectations are
 * built the same way and the tests do not depend on the time zone of the machine.
 *
 * @param y year
 * @param m month 1-12
 * @param d day
 * @param h hour
 * @param min minute
 */
function local(y: number, m: number, d: number, h = 0, min = 0): number {
    return new Date(y, m - 1, d, h, min, 0, 0).getTime();
}

const HOUR = 3_600_000;

describe('lib/types/adminShareConfig - resolveRange (pie chart)', () => {
    // Thursday, 15 October 2026, 14:30 local
    const thursday = local(2026, 10, 15, 14, 30);

    it('rolling ranges end now', () => {
        expect(resolveRange('h1', thursday)).to.deep.equal({ start: thursday - HOUR, end: thursday });
        expect(resolveRange('d1', thursday)).to.deep.equal({ start: thursday - 24 * HOUR, end: thursday });
        expect(resolveRange('w1', thursday)).to.deep.equal({ start: thursday - 7 * 24 * HOUR, end: thursday });
        expect(resolveRange('m1', thursday)).to.deep.equal({ start: thursday - 30 * 24 * HOUR, end: thursday });
        expect(resolveRange('custom', thursday, 36)).to.deep.equal({ start: thursday - 36 * HOUR, end: thursday });
    });

    it('custom without usable hours falls back to the default hours, current is the empty window now', () => {
        const fallback = { start: thursday - PCHART_CUSTOM_HOURS_DEFAULT * HOUR, end: thursday };
        expect(resolveRange('custom', thursday)).to.deep.equal(fallback);
        expect(resolveRange('custom', thursday, 0)).to.deep.equal(fallback);
        expect(resolveRange('custom', thursday, NaN)).to.deep.equal(fallback);
        expect(resolveRange('current', thursday)).to.deep.equal({ start: thursday, end: thursday });
    });

    it('today and yesterday: yesterday ends at midnight, not now', () => {
        expect(resolveRange('today', thursday)).to.deep.equal({ start: local(2026, 10, 15), end: thursday });
        expect(resolveRange('yesterday', thursday)).to.deep.equal({
            start: local(2026, 10, 14),
            end: local(2026, 10, 15),
        });
    });

    it('this week starts on Monday, last week is Monday to Sunday 24:00', () => {
        expect(resolveRange('thisWeek', thursday)).to.deep.equal({ start: local(2026, 10, 12), end: thursday });
        expect(resolveRange('lastWeek', thursday)).to.deep.equal({
            start: local(2026, 10, 5),
            end: local(2026, 10, 12),
        });
    });

    it('on a Sunday the week still starts on the Monday before, not today', () => {
        // Sunday, 18 October 2026, 09:00
        const sunday = local(2026, 10, 18, 9);
        expect(resolveRange('thisWeek', sunday)).to.deep.equal({ start: local(2026, 10, 12), end: sunday });
        expect(resolveRange('lastWeek', sunday)).to.deep.equal({ start: local(2026, 10, 5), end: local(2026, 10, 12) });
    });

    it('on a Monday this week is today only and last week ends at 00:00 of today', () => {
        const monday = local(2026, 10, 12, 8);
        expect(resolveRange('thisWeek', monday)).to.deep.equal({ start: local(2026, 10, 12), end: monday });
        expect(resolveRange('lastWeek', monday)).to.deep.equal({ start: local(2026, 10, 5), end: local(2026, 10, 12) });
    });

    it('this month and last month, with the month change of different lengths', () => {
        expect(resolveRange('thisMonth', thursday)).to.deep.equal({ start: local(2026, 10, 1), end: thursday });
        expect(resolveRange('lastMonth', thursday)).to.deep.equal({
            start: local(2026, 9, 1),
            end: local(2026, 10, 1),
        });
        // 1 March: last month is the whole February (28 days in 2026)
        const march = local(2026, 3, 1, 0, 5);
        expect(resolveRange('lastMonth', march)).to.deep.equal({ start: local(2026, 2, 1), end: local(2026, 3, 1) });
        expect(resolveRange('yesterday', march)).to.deep.equal({ start: local(2026, 2, 28), end: local(2026, 3, 1) });
    });

    it('crosses the year: 1 January and the first days of January', () => {
        // Thursday, 1 January 2026, 10:00
        const newYear = local(2026, 1, 1, 10);
        expect(resolveRange('yesterday', newYear)).to.deep.equal({
            start: local(2025, 12, 31),
            end: local(2026, 1, 1),
        });
        expect(resolveRange('lastMonth', newYear)).to.deep.equal({ start: local(2025, 12, 1), end: local(2026, 1, 1) });
        expect(resolveRange('thisMonth', newYear)).to.deep.equal({ start: local(2026, 1, 1), end: newYear });
        // the week of 1 January 2026 started on Monday, 29 December 2025
        expect(resolveRange('thisWeek', newYear)).to.deep.equal({ start: local(2025, 12, 29), end: newYear });
        expect(resolveRange('lastWeek', newYear)).to.deep.equal({
            start: local(2025, 12, 22),
            end: local(2025, 12, 29),
        });
    });

    it('every key resolves to a window with start <= end', () => {
        for (const key of pchartRangeKeys) {
            const { start, end } = resolveRange(key, thursday, 5);
            expect(start, key).to.be.at.most(end);
            expect(end, key).to.be.at.most(thursday);
        }
    });

    it('recognises the stored keys', () => {
        const keys: PChartRangeKey[] = ['current', 'custom', 'lastMonth'];
        for (const key of keys) {
            expect(isPChartRangeKey(key)).to.equal(true);
        }
        expect(isPChartRangeKey('hour')).to.equal(false);
        expect(isPChartRangeKey(24)).to.equal(false);
        expect(isPChartRangeKey(undefined)).to.equal(false);
    });
});
