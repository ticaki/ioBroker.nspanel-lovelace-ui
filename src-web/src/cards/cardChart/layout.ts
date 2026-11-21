import type { PanelModel } from '../../protocol/types';
import { isPortrait } from '../../style/theme';
import type { ChartModel } from './parse';
import { leadingInt } from './parse';

/**
 * Geometry of the chart pages, transcribed from the Nextion script of `cardChart` (HMI 6.2.0, the
 * axis logic is the same since 6.0.3) and `cardLChart` (HMI 5.1.1). The script works with signed 32 bit integers, evaluates expressions strictly from
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
 * hotspot `m0` of `cardChart` in `HMI/nspanel-v6.2.0.HMI`: the y-axis is at x 85, the first bar
 * starts at x 95, the plot bottom is at 286 like the line chart
 */
export const PLOT_BAR: PlotArea = { x: 8, y: 75, w: 434, h: 235 };

/**
 * Portrait (us-p 320x480, also web-p, which draws the charts as us-p): the hotspot `m0` of
 * `cardChart` and `cardLChart` in `HMI/us-p/nspanel-us-p-v6.0.8.screensaver5.HMI` is 10,90 300x370
 * (eu: 8,75 434x235, the same in 6.2.0); the drawing code of both pages is the same as on eu, only
 * relative to `m0`.
 * The bar chart uses `m0` like on eu, the line chart keeps the offset of the eu plot to its `m0`
 * (+12, +15, -24, -15).
 */
export const PLOT_BAR_PORTRAIT: PlotArea = { x: 10, y: 90, w: 300, h: 370 };
export const PLOT_PORTRAIT: PlotArea = { x: 22, y: 105, w: 276, h: 355 };

/**
 * the plot area of a chart kind on a model (portrait models get the us-p geometry)
 *
 * @param kind bar or line chart
 * @param model the panel model the card sees, `eu` when omitted
 */
export function plotFor(kind: 'bar' | 'line', model: PanelModel = 'eu'): PlotArea {
    if (isPortrait(model)) {
        return kind === 'bar' ? PLOT_BAR_PORTRAIT : PLOT_PORTRAIT;
    }
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

/**
 * Geometry of the bar chart (HMI since 6.0.3, transcribed from 6.2.0: `entityUpd` branch of
 * `tmSerial` and `m0` down of `cardChart`).
 * All y values are integers in the x10 space of the panel.
 */
export interface BarGeometry {
    /** width of one unit in 1/100 px (`vaUnit`), a bar is 7 units wide, the step from bar to bar 10 units */
    unit: number;
    /** left edge of the first bar in 1/100 px (`vaLeft`) */
    left: number;
    /** y of the bottom of the plot (`vaBottom`) */
    bottom: number;
    /** height of the plot in pixels the axis spans (`m0.h-24`) */
    height: number;
    /** lower end of the y-axis, <= 0 */
    min: number;
    /** upper end of the y-axis (`vMax` after rounding) */
    max: number;
    /** span of the y-axis, `max - min` (`vaYUnit`) */
    span: number;
    /** distance of the y ticks (`vStrLen` while drawing the ticks) */
    step: number;
    /** y of the zero line (`recvCrc` after the axis has been computed) */
    zeroY: number;
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
 * The text of a y-axis tick of the line chart like the HMI: integer part, then `.` and the last digit when it is not 0.
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
 * The text of a y tick of the bar chart (HMI since 6.0.3): integer part, `.` and the last digit.
 * `215` -> `21.5`, `0` -> `0.0`, `-5` -> `-0.5`, `-25` -> `-2.5`.
 *
 * @param tick x10 value
 */
export function formatBarTick(tick: number): string {
    const last = Math.abs(tick) % 10;
    const integer = idiv(tick, 10);
    const head = tick < 0 && integer === 0 ? '-0' : String(integer);
    return `${head}.${last}`;
}

/** width of the box of a y tick label of the bar chart (`xstr m0.x+22,…,48,20`) */
const BAR_TICK_WIDTH = 48;

/**
 * The y-axis of the bar chart like the HMI since 6.0.3: from min(0, smallest value) to
 * max(0, largest value), a 1-2-5 step with at most about 5 intervals, both ends rounded outwards
 * to the step.
 *
 * @param values x10 values of the bars
 * @param plot the plot area
 */
export function barGeometry(values: readonly number[], plot: PlotArea = PLOT_BAR): BarGeometry {
    const n = values.length;
    let max = 0;
    let min = 0;
    for (const value of values) {
        if (value > max) {
            max = value;
        }
        if (value < min) {
            min = value;
        }
    }
    const unit = idiv((plot.w - 87) * 100, n * 10 - 3);
    const bottom = plot.y + plot.h - 24;
    const left = (plot.x + 87) * 100;
    const height = plot.h - 24;

    let span = max - min;
    if (span < 1) {
        max = 10;
        span = 10;
    }
    // step 1, 2, 5, 10, 20, 50, … until there are at most 5 intervals
    let step = 1;
    let decade = 1;
    let mantissa = 0;
    while (idiv(span, step) > 5) {
        mantissa++;
        if (mantissa === 3) {
            mantissa = 0;
            decade *= 10;
        }
        step = mantissa === 1 ? decade * 2 : mantissa === 2 ? decade * 5 : decade;
    }
    max = idiv(max + step - 1, step) * step;
    min = 0 - idiv(0 - min + step - 1, step) * step;
    span = max - min;
    const zeroY = bottom - idiv(height * (0 - min), span);
    return { unit, left, bottom, height, min, max, span, step, zeroY };
}

/** vertical extent of a bar: top and bottom edge, used for the colour of the grid line */
interface BarExtent {
    top: number;
    bottom: number;
}

/** height of a bar in pixels, at least 2 (the sign of the value decides the direction) */
function barHeight(geometry: BarGeometry, value: number): number {
    const h = Math.abs(idiv(geometry.height * value, geometry.span));
    return h < 2 ? 2 : h;
}

/**
 * Draws a bar in its normal state: dark fill, light top (bottom for negative values) and outline,
 * a value of 0 is a line on the zero line in the dark colour.
 */
function drawBar(out: Primitive[], model: ChartModel, geometry: BarGeometry, index: number, value: number): BarExtent {
    const start = index * 10 * geometry.unit + geometry.left;
    const x = idiv(start, 100);
    const right = idiv(geometry.unit * 7 + start, 100);
    const w = idiv(geometry.unit * 7, 100);
    const zero = geometry.zeroY;
    if (value > 0) {
        const h = barHeight(geometry, value);
        const top = zero - h;
        out.push({ kind: 'fill', x: x + 1, y: top + 1, w, h: h - 1, color: model.colorDark });
        out.push(hLine(x + 1, right - 1, top, model.color));
        out.push({ kind: 'rect', x1: x, y1: top + 1, x2: right, y2: zero, color: model.color });
        return { top, bottom: zero };
    }
    if (value < 0) {
        const h = barHeight(geometry, value);
        out.push({ kind: 'fill', x: x + 1, y: zero + 1, w, h: h - 1, color: model.colorDark });
        out.push(hLine(x + 1, right - 1, zero + h, model.color));
        out.push({ kind: 'rect', x1: x, y1: zero, x2: right, y2: zero + h - 1, color: model.color });
        return { top: zero, bottom: zero + h };
    }
    out.push(hLine(x, right, zero, model.colorDark));
    return { top: zero, bottom: zero };
}

/**
 * Bar chart like the HMI since 6.0.3: the y-axis is computed from the values (see
 * {@link barGeometry}), the ticks of the payload only decide about "No Data". Bars grow from the
 * zero line, negative ones downwards, every bar is at least 2 px high.
 *
 * @param model the parsed page
 * @param plot the plot area
 */
export function layoutBar(model: ChartModel, plot: PlotArea = PLOT_BAR): ChartLayout {
    const out: Primitive[] = [];
    const geometry = barGeometry(
        model.bars.map(bar => bar.value),
        plot,
    );
    const { bottom, zeroY } = geometry;
    const axisX = plot.x + 77;

    // y-axis and zero line
    out.push(vLine(axisX, plot.y, bottom + 10, AXIS_COLOR));
    out.push(hLine(axisX, plot.x + plot.w, zeroY, AXIS_COLOR));
    for (let tick = geometry.min; tick <= geometry.max; tick += geometry.step) {
        const y = zeroY - idiv(geometry.height * tick, geometry.span);
        out.push(hLine(plot.x + 82, plot.x + 72, y, AXIS_COLOR));
        out.push({
            kind: 'text',
            x: plot.x + 22,
            y: y - 10,
            w: BAR_TICK_WIDTH,
            h: 20,
            align: 'right',
            text: fitText(formatBarTick(tick), BAR_TICK_WIDTH),
            rotated: false,
        });
    }
    out.push(...yAxisLabel(plot, model.yLabel, 12, 30));

    model.bars.forEach((bar, i) => {
        const start = i * 10 * geometry.unit + geometry.left;
        const centre = idiv(idiv(geometry.unit * 7, 2) + start, 100);
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
        const extent = drawBar(out, model, geometry, i, bar.value);
        if (bar.label !== '') {
            // dashed grid line: a dash overlapping the bar is light, the others grey
            for (let y = bottom - 5; y > plot.y; y -= 10) {
                const y2 = y + 5;
                const inside = y2 > extent.top && y < extent.bottom;
                out.push(vLine(centre, y, y2, inside ? model.color : AXIS_COLOR));
            }
        }
    });
    return { primitives: out, bar: geometry };
}

/**
 * The bar under a touch at stage x `touchX`, -1 when the touch hit a gap or no bar
 * (the HMI highlights that bar and shows its value). Like the HMI a touch up to one unit left of
 * the first bar still counts as bar 0 (the division truncates towards zero).
 *
 * @param geometry the bar geometry of the layout
 * @param touchX x of the touch in stage pixels
 * @param count number of bars
 * @param plot the plot area
 */
export function barAt(geometry: BarGeometry, touchX: number, count: number, plot: PlotArea = PLOT_BAR): number {
    const units = idiv((Math.trunc(touchX) - plot.x - 87) * 100, geometry.unit);
    if (units < 0 || units % 10 >= 7 || idiv(units, 10) >= count) {
        return -1;
    }
    return idiv(units, 10);
}

/**
 * The highlight of a touched bar: filled with the light colour (`fill` of the touch handler),
 * a value of 0 is a light line on the zero line.
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
    const start = index * 10 * geometry.unit + geometry.left;
    const x = idiv(start, 100);
    const right = idiv(geometry.unit * 7 + start, 100);
    const w = idiv(geometry.unit * 7, 100);
    const zero = geometry.zeroY;
    if (bar.value === 0) {
        return [hLine(x, right, zero, model.color)];
    }
    const h = barHeight(geometry, bar.value);
    const y = bar.value > 0 ? zero - h + 1 : zero + 1;
    return [{ kind: 'fill', x: x + 1, y, w, h: h - 1, color: model.color }];
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
