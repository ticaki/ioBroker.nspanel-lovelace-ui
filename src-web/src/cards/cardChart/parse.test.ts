import { describe, expect, it } from 'vitest';
import { parseCommand } from '../../protocol/commands';
import {
    AXIS_COLOR,
    barAt,
    fitText,
    formatTick,
    highlightBar,
    idiv,
    layoutBar,
    layoutLine,
    lineRange,
    PLOT,
    type Primitive,
} from './layout';
import { darkColor565, initial, leadingInt, parseEntityUpd } from './parse';

const barCtx = { pageType: 'cardChart', pageArgs: [] };
const lineCtx = { pageType: 'cardLChart', pageArgs: [] };

/**
 * the example of HMI/Readme.md in the field layout of the adapter (the readme has one `~` too many
 * before the navigation and one too many before the colour, the HMI reads the colour at field 14)
 */
const README_BAR =
    'entityUpd~Chart Demo~button~navigate.prev~<~65535~~~button~navigate.next~>~65535~~~6666~Gas [kWh]~20:40:60:80:100~10~7^2:00~7~6^4:00~6~7^6:00~0~7^8:00~5~1^10:00~1~10^12:00~5~6^14:00~8';

/** what PageChartBar.getChartDataDB builds: 24 hourly averages x10, a label every 6 hours */
function dbBarPayload(values: number[]): string {
    const fields = values.map((v, i) => {
        const hour = (i + 1) % 24;
        return hour % 6 === 0 ? `${v}^${hour}:00` : String(v);
    });
    return `entityUpd~Strom~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~48192~W~20:40:60:80:100~${fields.join('~')}`;
}

/** what PageChartLine.getChartDataDB builds: minutes on the x-axis, 5 minute grid, ticks every 2 h, labels every 4 h */
const DB_LINE =
    'entityUpd~Außentemperatur~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~48192~°C~100:150:200:250~' +
    '0^02:00+120+240^06:00+360+480^10:00+600+720^14:00+840+960^18:00+1080+1200^22:00+1320+1390^01:10~' +
    '0:133~120:129~240:113~360:140~480:180~600:215~720:220~840:195~960:160~1080:140~1200:133~1320:145~1440:140';

function args(payload: string): string[] {
    return parseCommand(payload).args;
}

function lines(primitives: Primitive[]): Extract<Primitive, { kind: 'line' }>[] {
    return primitives.filter((p): p is Extract<Primitive, { kind: 'line' }> => p.kind === 'line');
}

function texts(primitives: Primitive[]): Extract<Primitive, { kind: 'text' }>[] {
    return primitives.filter((p): p is Extract<Primitive, { kind: 'text' }> => p.kind === 'text');
}

function fills(primitives: Primitive[]): Extract<Primitive, { kind: 'fill' }>[] {
    return primitives.filter((p): p is Extract<Primitive, { kind: 'fill' }> => p.kind === 'fill');
}

describe('cardChart parse', () => {
    it('converts like covx: the leading integer', () => {
        expect(leadingInt('7^2:00')).toBe(7);
        expect(leadingInt('-52')).toBe(-52);
        expect(leadingInt('')).toBe(0);
        expect(leadingInt('abc')).toBe(0);
    });

    it('darkens every channel to 80 % with integer arithmetic', () => {
        // 48192 = r 23, g 34, b 0 -> r 18, g 27, b 0
        expect(darkColor565(48192)).toBe((18 << 11) + (27 << 5));
        expect(darkColor565(65535)).toBe((24 << 11) + (50 << 5) + 24);
        expect(darkColor565(0)).toBe(0);
    });

    it('parses the bar example of the readme', () => {
        const m = parseEntityUpd(args(README_BAR), initial(), barCtx);
        expect(m.kind).toBe('bar');
        expect(m.received).toBe(true);
        expect(m.title).toBe('Chart Demo');
        expect(m.navigation.left.id).toBe('navigate.prev');
        expect(m.navigation.right.id).toBe('navigate.next');
        expect(m.color).toBe(6666);
        expect(m.yLabel).toBe('Gas [kWh]');
        expect(m.yTicks).toEqual(['20', '40', '60', '80', '100']);
        expect(m.bars).toHaveLength(15);
        expect(m.bars[0]).toEqual({ value: 10, label: '' });
        expect(m.bars[1]).toEqual({ value: 7, label: '2:00' });
        expect(m.bars[6]).toEqual({ value: 0, label: '' });
        expect(m.noData).toBe(false);
        expect(m.points).toEqual([]);
    });

    it('stops the bar list at the first empty field', () => {
        const m = parseEntityUpd(args('entityUpd~T~~~~~~~~~~~~~65535~W~10:20~5~~7'), initial(), barCtx);
        expect(m.bars).toEqual([{ value: 5, label: '' }]);
    });

    it('shows "No Data" for the error message of the adapter (ticks `~`, value `~`)', () => {
        // PageChart.update() sends ticks ['~'] joined -> '~' and value '~' when there are no items
        const m = parseEntityUpd(args('entityUpd~Error~~~~~~~~~~~~~~~~~~'), initial(), barCtx);
        expect(m.noData).toBe(true);
        expect(m.bars).toEqual([]);
        expect(m.yTicks).toEqual([]);
    });

    it('parses the line payload of the DB mode', () => {
        const m = parseEntityUpd(args(DB_LINE), initial(), lineCtx);
        expect(m.kind).toBe('line');
        expect(m.title).toBe('Außentemperatur');
        expect(m.yLabel).toBe('°C');
        expect(m.yTicks).toEqual(['100', '150', '200', '250']);
        expect(m.xTicks).toHaveLength(13);
        expect(m.xTicks[0]).toEqual({ pos: 0, label: '02:00' });
        expect(m.xTicks[1]).toEqual({ pos: 120, label: '' });
        expect(m.xTicks[12]).toEqual({ pos: 1390, label: '01:10' });
        expect(m.points).toHaveLength(13);
        expect(m.points[0]).toEqual({ x: 0, y: 133 });
        expect(m.points[12]).toEqual({ x: 1440, y: 140 });
        expect(m.noData).toBe(false);
        expect(m.bars).toEqual([]);
    });

    it('line chart without x ticks is "No Data"', () => {
        const m = parseEntityUpd(args('entityUpd~T~~~~~~~~~~~~~65535~°C~~~'), initial(), lineCtx);
        expect(m.noData).toBe(true);
        expect(m.points).toEqual([]);
    });
});

describe('cardChart layout helpers', () => {
    it('idiv truncates towards zero and survives zero', () => {
        expect(idiv(-7, 2)).toBe(-3);
        expect(idiv(7, 2)).toBe(3);
        expect(idiv(5, 0)).toBe(0);
    });

    it('formats ticks like the HMI (x10, last digit behind the point)', () => {
        expect(formatTick(20)).toBe('2');
        expect(formatTick(25)).toBe('2.5');
        expect(formatTick(5)).toBe('.5');
        expect(formatTick(0)).toBe('');
        expect(formatTick(1520)).toBe('152');
    });

    it('cuts a label to the 20 px box: 1520 is printed as 15', () => {
        expect(fitText('152', 20)).toBe('15');
        expect(fitText('15', 20)).toBe('15');
        expect(fitText('2.5', 20)).toBe('2.5');
    });
});

describe('cardChart bar layout', () => {
    const values = [25, 25, 25, 25, 25, 35, 22, 20, 20, 15, 17, 5, 1, 2, 3, 5, 88, 66, 50, 98, 45, 25, 30, 25];
    const model = parseEntityUpd(args(dbBarPayload(values)), initial(), barCtx);
    const layout = layoutBar(model);

    it('uses the unit geometry of the HMI for 24 bars', () => {
        expect(layout.bar).toBeDefined();
        expect(layout.bar?.unit).toBe(289); // (410-65)*100/119
        expect(layout.bar?.left).toBe(8500);
        expect(layout.bar?.bottom).toBe(286);
        expect(layout.bar?.max).toBe(98);
        expect(layout.bar?.yUnit).toBe(2); // 196/98
    });

    it('places the bars where the panel does (first bar at 86, last right edge 428)', () => {
        const f = fills(layout.primitives);
        expect(f).toHaveLength(24);
        expect(f[0]).toMatchObject({ x: 86, w: 11, y: 286 - 50 + 1, h: 49, color: model.colorDark });
        const last = f[f.length - 1];
        expect(last.x).toBe(418);
        // tallest bar (98) fills the plot: top at 286 - 196 = 90
        expect(f[19]).toMatchObject({ y: 91, h: 195 });
    });

    it('draws labels and dashed grid lines under every 6th bar', () => {
        const labels = texts(layout.primitives).filter(t => !t.rotated && t.text.includes(':'));
        expect(labels.map(t => t.text)).toEqual(['6:00', '12:00', '18:00', '0:00']);
        // centre of bar 5 = (289*2 + 5*5*289 + 8500) / 100 = 163
        expect(labels[0]).toMatchObject({ x: 163 - 24, w: 48, y: 288, h: 22, align: 'center' });
        const grid = lines(layout.primitives).filter(l => l.x1 === 163 && l.x1 === l.x2 && l.y1 >= 90);
        expect(grid.length).toBeGreaterThan(15);
        // the top of bar 5 (35 -> 70 px) is at 216: dashes inside the bar are light, above grey
        expect(grid.filter(l => l.y1 >= 216).every(l => l.color === model.color)).toBe(true);
        expect(grid.filter(l => l.y2 < 216).every(l => l.color === AXIS_COLOR)).toBe(true);
    });

    it('draws only the ticks up to the maximum, labelled in units', () => {
        const ticks = texts(layout.primitives).filter(t => t.x === PLOT.x + 28);
        expect(ticks.map(t => t.text)).toEqual(['2', '4', '6', '8']);
        // tick 20 -> 40 px above the base line, box centred there
        expect(ticks[0]).toMatchObject({ y: 286 - 40 - 10, w: 20, h: 20, align: 'right' });
    });

    it('draws the y-axis label rotated, bottom to top', () => {
        const label = texts(layout.primitives).filter(t => t.rotated);
        expect(label.map(t => t.text)).toEqual(['W']);
        expect(label[0]).toMatchObject({ x: PLOT.x, y: 90 + 92, w: 30 });
    });

    it('a zero value is a base line in the dark colour', () => {
        const m = parseEntityUpd(args('entityUpd~T~~~~~~~~~~~~~65535~W~10~0~5'), initial(), barCtx);
        const l = layoutBar(m);
        const base = lines(l.primitives).filter(x => x.color === m.colorDark && x.y1 === 286);
        expect(base).toHaveLength(1);
        expect(fills(l.primitives)).toHaveLength(1);
    });

    it('finds the touched bar and skips the gaps', () => {
        const geometry = layout.bar;
        if (!geometry) {
            throw new Error('no bar geometry');
        }
        expect(barAt(geometry, 90, 24)).toBe(0);
        expect(barAt(geometry, 84, 24)).toBe(0); // 1 px left of the first bar still truncates to unit 0
        expect(barAt(geometry, 80, 24)).toBe(-1); // left of the first bar
        expect(barAt(geometry, 97, 24)).toBe(-1); // the gap after bar 0 (units 4)
        expect(barAt(geometry, 425, 24)).toBe(23);
        expect(barAt(geometry, 425, 3)).toBe(-1);
        expect(highlightBar(model, geometry, 0)).toEqual([
            { kind: 'fill', x: 86, y: 237, w: 11, h: 49, color: model.color },
        ]);
    });
});

describe('cardChart line layout', () => {
    const model = parseEntityUpd(args(DB_LINE), initial(), lineCtx);

    it('widens the y range to the enclosing ticks and takes x from the first tick', () => {
        const r = lineRange(model);
        expect(r).toEqual({ minX: 0, maxX: 1440, minY: 100, maxY: 250, firstTick: 0, lastTick: 3 });
    });

    it('spans the data over the plot like the panel', () => {
        const layout = layoutLine(model);
        const segments = lines(layout.primitives).filter(l => l.color === model.colorDark);
        expect(segments).toHaveLength(12);
        // x unit = 34500/1440 = 23, y unit = 19600/150 = 130
        expect(segments[0]).toMatchObject({ x1: 85, y1: 286 - idiv(33 * 130, 100) });
        expect(segments[11]).toMatchObject({ x2: idiv(1440 * 23, 100) + 85, y2: 286 - idiv(40 * 130, 100) });
        // the x-axis reaches the right edge of the plot
        expect(lines(layout.primitives)).toContainEqual({
            kind: 'line',
            x1: 85,
            y1: 286,
            x2: 430,
            y2: 286,
            color: AXIS_COLOR,
        });
    });

    it('draws every y tick of the range with its label', () => {
        const ticks = texts(layoutLine(model).primitives).filter(t => t.x === PLOT.x + 28);
        expect(ticks.map(t => t.text)).toEqual(['10', '15', '20', '25']);
        expect(ticks[0].y).toBe(286 - 10);
        expect(ticks[3].y).toBe(286 - 195 - 10);
    });

    it('draws x ticks below the largest x only, labels centred on the tick', () => {
        const layout = layoutLine(model);
        const labels = texts(layout.primitives).filter(t => t.text.includes(':'));
        expect(labels.map(t => t.text)).toEqual(['02:00', '06:00', '10:00', '14:00', '18:00', '22:00', '01:10']);
        expect(labels[0]).toMatchObject({ x: 85 - 30, y: 294, w: 60, h: 22, align: 'center' });
        const ticks = lines(layout.primitives).filter(l => l.y1 === 281 && l.y2 === 291);
        expect(ticks).toHaveLength(13);
    });

    it('keeps 15.2 … 12.0 W (factor 10) inside two characters', () => {
        const m = parseEntityUpd(
            args('entityUpd~Power~~~~~~~~~~~~~65535~W x10~120:130:140:150:160~0^00:00+60~0:152~60:152~120:120'),
            initial(),
            lineCtx,
        );
        const ticks = texts(layoutLine(m).primitives).filter(t => t.x === PLOT.x + 28);
        expect(ticks.map(t => t.text)).toEqual(['12', '13', '14', '15', '16']);
    });

    it('a first tick above the minimum keeps the minimum of the data', () => {
        const m = parseEntityUpd(
            args('entityUpd~T~~~~~~~~~~~~~65535~°C~50:100~0^00:00+60~0:20~60:80'),
            initial(),
            lineCtx,
        );
        expect(lineRange(m)).toMatchObject({ minY: 20, maxY: 100, firstTick: -1, lastTick: 1 });
    });

    it('without points only the axes are drawn', () => {
        const m = parseEntityUpd(args('entityUpd~T~~~~~~~~~~~~~65535~°C~~~'), initial(), lineCtx);
        const layout = layoutLine(m);
        expect(fills(layout.primitives)).toHaveLength(0);
        expect(lines(layout.primitives).every(l => l.color === AXIS_COLOR)).toBe(true);
    });
});
