import type { ChartModel } from './parse';
import { leadingInt } from './parse';

/**
 * Geometry of the chart pages, transcribed from the Nextion script of `cardChart` / `cardLChart`
 * (HMI 5.1.1). The script works with signed 32 bit integers, evaluates expressions strictly from
 * left to right and truncates divisions - `idiv` and the explicit parentheses below keep that.
 */

/** The hotspot `m0` the HMI draws into, measured on 480x320 pictures of the panel */
export interface PlotArea {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** hotspot of `cardLChart` (wiki picture `pageChart/Linechart.png`) */
export const PLOT: PlotArea = { x: 20, y: 90, w: 410, h: 220 };
/**
 * hotspot of `cardChart` (emulator picture `cardChart.png`): the axis is at x 63, the
 * first bar starts at x 73, the top of the axis is at y 75; the base line is at 286 like the line chart
 */
export const PLOT_BAR: PlotArea = { x: 8, y: 75, w: 433, h: 235 };

/** the plot area of a chart kind */
export function plotFor(kind: 'bar' | 'line'): PlotArea {
    return kind === 'bar' ? PLOT_BAR : PLOT;
}

/** the grey of axes and ticks (`14823`) */
export const AXIS_COLOR = 14823;

/** width of the box of a y-axis label: the HMI cuts the text that does not fit (`1520` -> `15`) */
const Y_LABEL_WIDTH = 20;

export type Primitive =
    | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; color: number }
    /** filled rectangle (`fill`) */
    | { kind: 'fill'; x: number; y: number; w: number; h: number; color: number }
    /** rectangle outline from (x1,y1) to (x2,y2) (`draw`) */
    | { kind: 'rect'; x1: number; y1: number; x2: number; y2: number; color: number }
    /** text in a box, vertically centred (`xstr`) */
    | {
          kind: 'text';
          x: number;
          y: number;
          w: number;
          h: number;
          align: 'left' | 'center' | 'right';
          text: string;
          /** rotated by -90 degrees (the rotated font of the y-axis label) */
          rotated: boolean;
      };

export interface BarGeometry {
    /** width of one unit in 1/100 px, a bar is 4 units wide, the gap 1 unit */
    unit: number;
    /** left edge of the first bar in 1/100 px */
    left: number;
    /** y of the base line */
    bottom: number;
    /** pixels per x10 unit */
    yUnit: number;
    /** largest value */
    max: number;
}

export interface ChartLayout {
    primitives: Primitive[];
    bar: BarGeometry | undefined;
}

/** Integer division truncating towards zero, 0 for a division by zero */
export function idiv(a: number, b: number): number {
    if (b === 0) {
        return 0;
    }
    const q = Math.trunc(a / b);
    return q === 0 ? 0 : q; // no -0
}

/**
 * The text of a y-axis tick like the HMI: integer part, then `.` and the last digit when it is not 0.
 * `20` -> `2`, `25` -> `2.5`, `5` -> `.5`, `0` -> ``, negative ticks lose their integer part.
 *
 * @param tick x10 value
 */
export function formatTick(tick: number): string {
    const last = tick % 10;
    const integer = Math.trunc(tick / 10);
    let text = integer > 0 ? String(integer) : '';
    if (last !== 0) {
        text += `.${last}`;
    }
    return text;
}

/**
 * Advance widths of the small font of the HMI (a digit is 10 px, measured on the emulator picture),
 * used to cut the text like the 20 px box does: `2.5` becomes `2.`, `15` fits
 */
function charWidth(ch: string): number {
    if (ch === '.') {
        return 4;
    }
    if (ch === '-') {
        return 6;
    }
    return 10;
}

/** Keeps the leading characters that fit into `width` pixels */
export function fitText(text: string, width: number): string {
    let used = 0;
    let result = '';
    for (const ch of text) {
        used += charWidth(ch);
        if (used > width) {
            break;
        }
        result += ch;
    }
    return result;
}

function hLine(x1: number, x2: number, y: number, color: number): Primitive {
    return { kind: 'line', x1, y1: y, x2, y2: y, color };
}

function vLine(x: number, y1: number, y2: number, color: number): Primitive {
    return { kind: 'line', x1: x, y1, x2: x, y2, color };
}

/** y-axis tick label: 20x20 box right aligned, `y` is the centre */
function yTickLabel(plot: PlotArea, y: number, text: string): Primitive {
    return {
        kind: 'text',
        x: plot.x + 28,
        y: y - 10,
        w: Y_LABEL_WIDTH,
        h: 20,
        align: 'right',
        text: fitText(text, Y_LABEL_WIDTH),
        rotated: false,
    };
}

/**
 * The y-axis label: one character per box, bottom to top, rotated font.
 *
 * @param plot the plot area
 * @param label the text
 * @param step distance of the characters (12 bar, 11 line)
 * @param width width of a box (30 bar, 24 line)
 */
function yAxisLabel(plot: PlotArea, label: string, step: number, width: number): Primitive[] {
    const chars = Array.from(label);
    const offset = idiv(chars.length * step + plot.h - 48, 2);
    return chars.map((ch, i) => ({
        kind: 'text',
        x: plot.x,
        y: -step * i + plot.y + offset,
        w: width,
        h: 20,
        align: 'right',
        text: ch,
        rotated: true,
    }));
}

/**
 * Bar chart: every value is `yUnit` pixels per x10 unit high, `yUnit` is `(h-24) / max` rounded down,
 * so the tallest bar fills the plot as far as whole pixels allow. Ticks above the maximum are not drawn.
 *
 * @param model the parsed page
 * @param plot the plot area
 */
export function layoutBar(model: ChartModel, plot: PlotArea = PLOT_BAR): ChartLayout {
    const out: Primitive[] = [];
    const n = model.bars.length;
    let max = 0;
    for (const bar of model.bars) {
        if (bar.value > max) {
            max = bar.value;
        }
    }
    const unit = idiv((plot.w - 65) * 100, n * 4 + n - 1);
    const bottom = plot.y + plot.h - 24;
    const left = (plot.x + 65) * 100;
    const yUnit = idiv(plot.h - 24, max);
    const geometry: BarGeometry = { unit, left, bottom, yUnit, max };

    // y-axis with the zero tick
    out.push(vLine(plot.x + 55, plot.y, bottom + 10, AXIS_COLOR));
    out.push(hLine(plot.x + 60, plot.x + 50, bottom, AXIS_COLOR));
    for (const tickText of model.yTicks) {
        if (tickText === '') {
            break;
        }
        const tick = leadingInt(tickText);
        if (tick <= max) {
            const y = -1 * yUnit * tick + bottom;
            out.push(hLine(plot.x + 60, plot.x + 50, y, AXIS_COLOR));
            out.push(yTickLabel(plot, y, formatTick(tick)));
        }
    }
    out.push(...yAxisLabel(plot, model.yLabel, 12, 30));

    for (let i = 0; i < n; i++) {
        const bar = model.bars[i];
        const start = i * 5 * unit + left;
        const x = idiv(start, 100);
        const right = idiv(unit * 4 + start, 100);
        const centre = idiv(unit * 2 + start, 100);
        const top = -1 * yUnit * bar.value + bottom;
        if (bar.label !== '') {
            out.push({
                kind: 'text',
                x: -6 * bar.label.length + centre,
                y: bottom + 2,
                w: bar.label.length * 12,
                h: 22,
                align: 'center',
                text: bar.label,
                rotated: false,
            });
        }
        if (bar.value === 0) {
            out.push(hLine(x, right, bottom, model.colorDark));
        } else if (bar.value > 0) {
            out.push({
                kind: 'fill',
                x: x + 1,
                y: top + 1,
                w: idiv(unit * 4, 100),
                h: yUnit * bar.value - 1,
                color: model.colorDark,
            });
            out.push(hLine(x + 1, right - 1, top, model.color));
            out.push({ kind: 'rect', x1: x, y1: top + 1, x2: right, y2: bottom, color: model.color });
        }
        if (bar.label !== '') {
            // dashed grid line, light inside the bar, grey above it
            for (let y = bottom - 5; y > plot.y; y -= 10) {
                const y2 = y + 5;
                if (y >= top) {
                    out.push(vLine(centre, y, y2, model.color));
                } else if (y2 >= top) {
                    out.push(vLine(centre, y, top - 1, AXIS_COLOR));
                    out.push(vLine(centre, top, y2, model.color));
                } else {
                    out.push(vLine(centre, y, y2, AXIS_COLOR));
                }
            }
        }
    }
    return { primitives: out, bar: geometry };
}

/**
 * The bar under a touch at stage x `touchX`, -1 when the touch hit a gap or no bar
 * (the HMI highlights that bar and shows its value).
 *
 * @param geometry the bar geometry of the layout
 * @param touchX x of the touch in stage pixels
 * @param count number of bars
 * @param plot the plot area
 */
export function barAt(geometry: BarGeometry, touchX: number, count: number, plot: PlotArea = PLOT_BAR): number {
    const units = idiv((Math.trunc(touchX) - plot.x - 65) * 100, geometry.unit);
    if (units < 0 || units % 5 >= 4) {
        return -1;
    }
    const index = idiv(units, 5);
    return index < count ? index : -1;
}

/**
 * The highlight of a touched bar: filled with the light colour (`fill` of the touch handler).
 *
 * @param model the parsed page
 * @param geometry the bar geometry of the layout
 * @param index bar index
 */
export function highlightBar(model: ChartModel, geometry: BarGeometry, index: number): Primitive[] {
    const bar = model.bars[index];
    if (!bar) {
        return [];
    }
    const start = index * 5 * geometry.unit + geometry.left;
    const x = idiv(start, 100);
    const right = idiv(geometry.unit * 4 + start, 100);
    const value = Math.abs(bar.value);
    if (value === 0) {
        return [hLine(x, right, geometry.bottom, model.color)];
    }
    return [
        {
            kind: 'fill',
            x: x + 1,
            y: -1 * geometry.yUnit * value + geometry.bottom + 1,
            w: idiv(geometry.unit * 4, 100),
            h: geometry.yUnit * value - 1,
            color: model.color,
        },
    ];
}

/** Range of the y-axis of the line chart: the data, widened to the enclosing ticks */
export interface LineRange {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    /** index of the first y tick drawn */
    firstTick: number;
    /** index of the last y tick drawn */
    lastTick: number;
}

/**
 * Axis range like the HMI: x from the first x tick to the largest x of the data, y from the last tick
 * that is not above the smallest value to the first tick that is not below the largest value.
 *
 * @param model the parsed page
 */
export function lineRange(model: ChartModel): LineRange {
    let minX = 2147483647;
    let maxX = -2147483648;
    let minY = 2147483647;
    let maxY = -2147483648;
    for (const p of model.points) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    }
    const tick = (i: number): string => model.yTicks[i] ?? '';
    // last tick <= minY
    let first = 0;
    for (;;) {
        const text = tick(first);
        if (text === '') {
            break;
        }
        if (leadingInt(text) > minY) {
            first--;
            if (first >= 0) {
                minY = leadingInt(tick(first));
            }
            break;
        }
        first++;
    }
    // first tick >= maxY
    let last = first + 1;
    for (;;) {
        const text = tick(last);
        if (text === '') {
            break;
        }
        const value = leadingInt(text);
        if (value >= maxY) {
            maxY = value;
            break;
        }
        last++;
    }
    minX = leadingInt(model.xTicksField);
    return { minX, maxX, minY, maxY, firstTick: first, lastTick: last };
}

/**
 * Line chart: the data spans the whole plot (min … max in both directions), ticks are placed on
 * that scale; ticks at or beyond the largest x are not drawn.
 *
 * @param model the parsed page
 * @param plot the plot area
 */
export function layoutLine(model: ChartModel, plot: PlotArea = PLOT): ChartLayout {
    const out: Primitive[] = [];
    const range = lineRange(model);
    const bottom = plot.y + plot.h - 24;
    const hasData = model.points.length > 0;
    const xUnit = hasData ? idiv((plot.w - 65) * 100, range.maxX - range.minX) : 0;
    const yUnit = hasData ? idiv((plot.h - 24) * 100, range.maxY - range.minY) : 0;
    const xOf = (x: number): number => idiv((x - range.minX) * xUnit, 100) + plot.x + 65;
    const yOf = (y: number): number => idiv((y - range.minY) * yUnit, -100) + bottom;

    out.push(vLine(plot.x + 55, plot.y, bottom + 5, AXIS_COLOR));
    out.push(hLine(plot.x + 60, plot.x + 50, bottom, AXIS_COLOR));
    if (hasData) {
        const first = range.firstTick > 0 ? range.firstTick - 1 : range.firstTick;
        for (let i = first; i <= range.lastTick; i++) {
            const text = model.yTicks[i] ?? '';
            const tick = leadingInt(text);
            const y = yOf(tick);
            if (text !== '') {
                out.push(yTickLabel(plot, y, formatTick(tick)));
            }
            out.push(hLine(plot.x + 60, plot.x + 50, y, AXIS_COLOR));
        }
    }
    out.push(...yAxisLabel(plot, model.yLabel, 11, 24));

    // x-axis
    out.push(hLine(plot.x + 65, plot.x + plot.w, bottom, AXIS_COLOR));
    if (hasData) {
        for (const tick of model.xTicks) {
            if (tick.pos >= range.maxX) {
                break;
            }
            const x = xOf(tick.pos);
            out.push(vLine(x, bottom - 5, bottom + 5, AXIS_COLOR));
            if (tick.label !== '') {
                out.push({
                    kind: 'text',
                    x: -6 * tick.label.length + x,
                    y: bottom + 8,
                    w: tick.label.length * 12,
                    h: 22,
                    align: 'center',
                    text: tick.label,
                    rotated: false,
                });
            }
        }
        let prev: { x: number; y: number } | undefined;
        for (const p of model.points) {
            const x = xOf(p.x);
            const y = yOf(p.y);
            if (prev && prev.x > 0 && prev.y > 0) {
                out.push({ kind: 'line', x1: prev.x, y1: prev.y, x2: x, y2: y, color: model.colorDark });
            }
            prev = { x, y };
        }
    }
    return { primitives: out, bar: undefined };
}

export function layoutChart(model: ChartModel, plot: PlotArea = plotFor(model.kind)): ChartLayout {
    return model.kind === 'line' ? layoutLine(model, plot) : layoutBar(model, plot);
}
