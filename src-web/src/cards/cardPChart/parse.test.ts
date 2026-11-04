import { describe, expect, it } from 'vitest';
import { parseCommand } from '../../protocol/commands';
import { theme } from '../../style/theme';
import {
    layoutLegend,
    layoutPie,
    layoutSectors,
    LEGEND_ROW_HEIGHT,
    legendArea,
    PIE_RADIUS,
    pieGeometry,
    pointAt,
    sectorPath,
} from './layout';
import { formatPercent, initial, MAX_SLICES, parseEntityUpd, parseLegendMode, permilleOf } from './parse';

const ctx = { pageType: 'cardPChart', pageArgs: [] };
const EU = { width: 480, height: 320 };
const US_P = { width: 320, height: 480 };

/** navigation of the adapter (`bSubPrev` / `bSubNext`) plus the empty field 14 */
const HEAD = 'entityUpd~Energie~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~';

/** the example of the task: three slices, legend mode 3 */
const EXAMPLE =
    `${HEAD}~3~~` + 'Netzbezug~5200~5.20 kWh~63488~Eigennutzung~3100~3.10 kWh~2016~Einspeisung~1500~1.50 kWh~2047';

function slices(count: number, value = 100): string {
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
        out.push(`S${i + 1}~${value}~${value} W~${1000 + i}`);
    }
    return out.join('~');
}

function args(payload: string): string[] {
    return parseCommand(payload).args;
}

function parse(payload: string): ReturnType<typeof parseEntityUpd> {
    return parseEntityUpd(args(payload), initial(), ctx);
}

describe('cardPChart parse', () => {
    it('starts empty and without data', () => {
        const m = initial();
        expect(m.received).toBe(false);
        expect(m.noData).toBe(true);
        expect(m.legendMode).toBe(3);
        expect(m.slices).toEqual([]);
    });

    it('parses the example: title, navigation, legend mode and three slices from field 17 on', () => {
        const m = parse(EXAMPLE);
        expect(m.received).toBe(true);
        expect(m.title).toBe('Energie');
        expect(m.navigation.left.id).toBe('bSubPrev');
        expect(m.navigation.right.id).toBe('bSubNext');
        expect(m.legendMode).toBe(3);
        expect(m.total).toBe(9800);
        expect(m.noData).toBe(false);
        expect(m.slices).toHaveLength(3);
        expect(m.slices[0]).toEqual({
            name: 'Netzbezug',
            value: 5200,
            text: '5.20 kWh',
            color: 63488,
            permille: 530,
            percentText: '53.0',
        });
        expect(m.slices[1]).toMatchObject({ name: 'Eigennutzung', value: 3100, color: 2016, percentText: '31.6' });
        expect(m.slices[2]).toMatchObject({ name: 'Einspeisung', value: 1500, color: 2047, percentText: '15.3' });
    });

    it('reads the legend mode from field 15, empty or unknown = 3', () => {
        expect(parse(`${HEAD}~~~${slices(2)}`).legendMode).toBe(3);
        expect(parse(`${HEAD}~0~~${slices(2)}`).legendMode).toBe(0);
        expect(parse(`${HEAD}~1~~${slices(2)}`).legendMode).toBe(1);
        expect(parse(`${HEAD}~2~~${slices(2)}`).legendMode).toBe(2);
        expect(parse(`${HEAD}~7~~${slices(2)}`).legendMode).toBe(3);
        expect(parse(`${HEAD}~-1~~${slices(2)}`).legendMode).toBe(3);
        expect(parseLegendMode('abc')).toBe(3);
    });

    it('ignores field 14 (colour) for this card', () => {
        const m = parse(EXAMPLE.replace(`${HEAD}~3`, `${HEAD}63488~3`));
        expect(m.legendMode).toBe(3);
        expect(m.slices).toHaveLength(3);
    });

    it('reads the number as an integer, negative numbers count as 0', () => {
        const m = parse(`${HEAD}~3~~A~-50~-50 W~63488~B~75.9~75.9 W~2016`);
        expect(m.slices[0].value).toBe(0);
        expect(m.slices[1].value).toBe(75);
        expect(m.total).toBe(75);
        expect(m.slices[0].percentText).toBe('0.0');
        expect(m.slices[1].percentText).toBe('100.0');
    });

    it('takes at most five slices (the legend of HMI 6.0.5 has five rows) and never sums the rest up', () => {
        const m = parse(`${HEAD}~3~~${slices(7)}`);
        expect(MAX_SLICES).toBe(5);
        expect(m.slices).toHaveLength(5);
        expect(m.slices.map(s => s.name)).toEqual(['S1', 'S2', 'S3', 'S4', 'S5']);
        expect(m.total).toBe(500);
        expect(m.slices.every(s => s.percentText === '20.0')).toBe(true);
    });

    it('keeps a slice with the number 0 in the legend', () => {
        const m = parse(`${HEAD}~3~~A~0~0.00 kWh~63488~B~400~4.00 kWh~2016`);
        expect(m.slices).toHaveLength(2);
        expect(m.slices[0]).toMatchObject({ value: 0, permille: 0, percentText: '0.0' });
        expect(m.slices[1].percentText).toBe('100.0');
        expect(m.noData).toBe(false);
    });

    it('a sum of 0 is "no data" but the legend rows stay', () => {
        const m = parse(`${HEAD}~3~~A~0~0.00 kWh~63488~B~0~0.00 kWh~2016`);
        expect(m.noData).toBe(true);
        expect(m.total).toBe(0);
        expect(m.slices).toHaveLength(2);
        expect(m.slices.map(s => s.percentText)).toEqual(['0.0', '0.0']);
    });

    it('no slices at all (the adapter sends an empty field 17) is "no data"', () => {
        const m = parse(`${HEAD}~3~~`);
        expect(m.slices).toEqual([]);
        expect(m.noData).toBe(true);
    });

    it('falls back to white for a missing colour and keeps the value text as it is', () => {
        const m = parse(`${HEAD}~3~~A~10~ 10,5 kWh `);
        expect(m.slices).toHaveLength(1);
        expect(m.slices[0].color).toBe(65535);
        expect(m.slices[0].text).toBe(' 10,5 kWh ');
    });

    it('truncates the percentage to one decimal like the integer arithmetic of the panel', () => {
        expect(permilleOf(1, 3)).toBe(333);
        expect(permilleOf(2, 3)).toBe(666);
        expect(permilleOf(5200, 9800)).toBe(530);
        expect(permilleOf(9800, 9800)).toBe(1000);
        expect(permilleOf(0, 100)).toBe(0);
        expect(permilleOf(5, 0)).toBe(0);
        expect(formatPercent(333)).toBe('33.3');
        expect(formatPercent(7)).toBe('0.7');
        expect(formatPercent(1000)).toBe('100.0');
        expect(formatPercent(0)).toBe('0.0');
        const m = parse(`${HEAD}~3~~A~1~~1~B~1~~2~C~1~~3`);
        expect(m.slices.map(s => s.percentText)).toEqual(['33.3', '33.3', '33.3']);
    });
});

describe('cardPChart layout', () => {
    const model = parse(EXAMPLE);

    it('places the pie on the left of the eu display, radius 100, centred below the title bar', () => {
        const { centre, radius } = pieGeometry(EU, 3);
        expect(radius).toBe(PIE_RADIUS);
        expect(centre).toEqual({ x: 120, y: theme.titleBarHeight + 129 });
    });

    it('starts at 12 o clock and goes clockwise', () => {
        const centre = { x: 120, y: 191 };
        expect(pointAt(centre, 100, 0)).toEqual({ x: 120, y: 91 });
        const east = pointAt(centre, 100, 90);
        expect(east.x).toBeCloseTo(220);
        expect(east.y).toBeCloseTo(191);
        const south = pointAt(centre, 100, 180);
        expect(south.y).toBeCloseTo(291);
    });

    it('gives every slice with a number its share of 360 degrees, the last one ends at 360', () => {
        const sectors = layoutSectors(model.slices, model.total, { x: 120, y: 191 }, 100);
        expect(sectors).toHaveLength(3);
        expect(sectors[0]).toMatchObject({ index: 0, color: 63488, startAngle: 0, full: false });
        expect(sectors[0].endAngle).toBeCloseTo((5200 * 360) / 9800);
        expect(sectors[1].startAngle).toBeCloseTo(sectors[0].endAngle);
        expect(sectors[2].endAngle).toBe(360);
        // the first slice is more than half of the pie: large arc flag set
        expect(sectors[0].path).toMatch(/A 100 100 0 1 1 /);
        expect(sectors[2].path).toMatch(/A 100 100 0 0 1 /);
        expect(sectors[0].path.startsWith('M 120 191 L 120 91 ')).toBe(true);
    });

    it('a slice with the number 0 has no sector, a single slice is the whole pie', () => {
        const zero = parse(`${HEAD}~3~~A~0~~63488~B~400~~2016`);
        const sectors = layoutSectors(zero.slices, zero.total, { x: 120, y: 191 }, 100);
        expect(sectors).toHaveLength(1);
        expect(sectors[0]).toMatchObject({ index: 1, full: true, startAngle: 0, endAngle: 360, path: '' });
    });

    it('a sum of 0 has no sectors', () => {
        const none = parse(`${HEAD}~3~~A~0~~63488~B~0~~2016`);
        expect(layoutSectors(none.slices, none.total, { x: 120, y: 191 }, 100)).toEqual([]);
        expect(sectorPath({ x: 0, y: 0 }, 10, 0, 90)).toBe('M 0 0 L 0 -10 A 10 10 0 0 1 10 0 Z');
    });

    it('puts the legend right of the pie, 40 px per row, vertically centred on the pie', () => {
        const area = legendArea(EU, 3, { x: 120, y: 191 }, 100);
        expect(area).toEqual({ x: 240, y: 191 - 60, w: 200, h: 120 });
        const rows = layoutLegend(model, EU, { x: 120, y: 191 }, 100);
        expect(rows).toHaveLength(3);
        expect(LEGEND_ROW_HEIGHT).toBe(40);
        expect(rows[1].swatch).toEqual({ x: 240, y: 131 + 40 + 4, w: 12, h: 12 });
        expect(rows[1].name).toMatchObject({ x: 258, y: 171, h: 20, align: 'left', text: 'Eigennutzung' });
        expect(rows[1].value).toMatchObject({ x: 258, y: 191, align: 'left', text: '3.10 kWh' });
        expect(rows[1].percent).toMatchObject({ y: 191, w: 64, align: 'right', text: '31.6 %' });
        expect((rows[1].percent?.x ?? 0) + (rows[1].percent?.w ?? 0)).toBe(440);
        // the value box ends where the percentage box starts
        expect((rows[1].value?.x ?? 0) + (rows[1].value?.w ?? 0)).toBe(rows[1].percent?.x);
    });

    it('legend mode 0 shows the name alone, centred in the row', () => {
        const rows = layoutLegend(parse(`${HEAD}~0~~${slices(2)}`), EU, { x: 120, y: 191 }, 100);
        expect(rows[0].value).toBeUndefined();
        expect(rows[0].percent).toBeUndefined();
        expect(rows[0].name.y).toBe(191 - 40 + 10);
        expect(rows[0].swatch.y).toBe(191 - 40 + 14);
    });

    it('legend mode 1 shows the value text over the full width, mode 2 only the percentage', () => {
        const one = layoutLegend(parse(`${HEAD}~1~~${slices(1)}`), EU, { x: 120, y: 191 }, 100);
        expect(one[0].value).toMatchObject({ text: '100 W', w: 200 - 18 });
        expect(one[0].percent).toBeUndefined();
        const two = layoutLegend(parse(`${HEAD}~2~~${slices(1)}`), EU, { x: 120, y: 191 }, 100);
        expect(two[0].value).toBeUndefined();
        expect(two[0].percent).toMatchObject({ text: '100.0 %' });
    });

    it('layoutPie puts it all together', () => {
        const layout = layoutPie(model, EU);
        expect(layout.centre).toEqual({ x: 120, y: 191 });
        expect(layout.radius).toBe(100);
        expect(layout.sectors).toHaveLength(3);
        expect(layout.legend).toHaveLength(3);
        expect(layout.legendBox).toEqual({ x: 240, y: 131, w: 200, h: 120 });
    });

    it('on the portrait panel the legend moves below a smaller pie', () => {
        const six = parse(`${HEAD}~3~~${slices(6)}`);
        const layout = layoutPie(six, US_P);
        expect(layout.centre.x).toBe(160);
        expect(layout.radius).toBeLessThan(PIE_RADIUS);
        expect(layout.radius).toBeGreaterThanOrEqual(40);
        expect(layout.legendBox.y).toBeGreaterThan(layout.centre.y + layout.radius);
        expect(layout.legendBox.y + layout.legendBox.h).toBeLessThanOrEqual(US_P.height);
    });
});
