import type { StageSize } from '../../style/theme';
import { theme } from '../../style/theme';
import type { PieModel, PieSlice } from './parse';

/**
 * Geometry of `cardPChart` on the 480x320 panel (TFT 6.0.5): the pie on the left, started at
 * 12 o'clock and drawn clockwise, the legend to the right of it, one 40 px row per slice, the rows
 * vertically centred on the pie. On a portrait stage (us-p) the legend moves below the pie.
 */

/** largest radius of the pie */
export const PIE_RADIUS = 100;
/** height of a legend row */
export const LEGEND_ROW_HEIGHT = 40;
/** edge of the colour square of a legend row */
export const SWATCH_SIZE = 12;
/** gap between the colour square and the texts */
const SWATCH_GAP = 6;
/** height of one text line of a legend row */
const LINE_HEIGHT = 20;
/** width of the right aligned percentage box of a legend row */
const PERCENT_WIDTH = 64;
/** left edge of the pie (landscape) */
const PIE_LEFT = 20;
/** gap between the pie and the legend (landscape) */
const LEGEND_GAP = 20;
/** the rightmost 33 px of the eu display stay empty (see `contentWidth`) */
const RIGHT_MARGIN = 40;

export interface Point {
    x: number;
    y: number;
}

export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** text in a box, vertically centred, cut at the right edge of the box (never wrapped) */
export interface TextBox extends Box {
    align: 'left' | 'right';
    text: string;
}

/** a slice of the pie; slices with the number 0 have no sector */
export interface PieSector {
    /** index of the slice in {@link PieModel.slices} */
    index: number;
    color: number;
    /** degrees from 12 o'clock clockwise */
    startAngle: number;
    endAngle: number;
    /** the slice is the whole pie (drawn as a circle, an arc of 360 degrees collapses) */
    full: boolean;
    /** SVG path of the sector, empty when {@link full} */
    path: string;
}

export interface LegendRow {
    index: number;
    /** the 12x12 colour square */
    swatch: Box;
    color: number;
    name: TextBox;
    /** value text (legend mode 1 and 3) */
    value: TextBox | undefined;
    /** percentage with ` %` (legend mode 2 and 3) */
    percent: TextBox | undefined;
}

export interface PieLayout {
    centre: Point;
    radius: number;
    sectors: PieSector[];
    legend: LegendRow[];
    /** the area of the legend rows */
    legendBox: Box;
}

/** `true` for the portrait panel (us-p): the legend goes below the pie */
export function isPortrait(stage: StageSize): boolean {
    return stage.height > stage.width;
}

/**
 * Centre and radius of the pie. Landscape: 20 px from the left edge, centred between the title bar
 * and the bottom edge. Portrait: centred horizontally below the title bar, the radius shrinks when
 * the legend rows would not fit below it.
 *
 * @param stage size of the display
 * @param rows number of legend rows
 */
export function pieGeometry(stage: StageSize, rows: number): { centre: Point; radius: number } {
    const top = theme.titleBarHeight;
    if (!isPortrait(stage)) {
        const radius = Math.min(PIE_RADIUS, Math.floor((stage.height - top) / 2) - 8);
        return { centre: { x: PIE_LEFT + radius, y: top + Math.floor((stage.height - top) / 2) }, radius };
    }
    const free = stage.height - top - rows * LEGEND_ROW_HEIGHT - 24;
    const radius = Math.max(40, Math.min(PIE_RADIUS, Math.floor(free / 2)));
    return { centre: { x: Math.floor(stage.width / 2), y: top + 8 + radius }, radius };
}

/** point on the circle at `angle` degrees from 12 o'clock clockwise */
export function pointAt(centre: Point, radius: number, angle: number): Point {
    const rad = (angle * Math.PI) / 180;
    return { x: centre.x + radius * Math.sin(rad), y: centre.y - radius * Math.cos(rad) };
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

/** SVG path of a sector from `start` to `end` degrees (clockwise from 12 o'clock) */
export function sectorPath(centre: Point, radius: number, start: number, end: number): string {
    const a = pointAt(centre, radius, start);
    const b = pointAt(centre, radius, end);
    const large = end - start > 180 ? 1 : 0;
    return (
        `M ${round2(centre.x)} ${round2(centre.y)} L ${round2(a.x)} ${round2(a.y)} ` +
        `A ${radius} ${radius} 0 ${large} 1 ${round2(b.x)} ${round2(b.y)} Z`
    );
}

/**
 * The sectors of the pie: every slice with a number > 0 gets its share of 360 degrees, starting at
 * 12 o'clock and going clockwise in legend order. The last sector always ends at 360.
 *
 * @param slices the slices of the model
 * @param total sum of the slice numbers
 * @param centre centre of the pie
 * @param radius radius of the pie
 */
export function layoutSectors(slices: readonly PieSlice[], total: number, centre: Point, radius: number): PieSector[] {
    if (total <= 0) {
        return [];
    }
    const out: PieSector[] = [];
    let cumulative = 0;
    const drawn = slices.filter(s => s.value > 0).length;
    slices.forEach((slice, index) => {
        if (slice.value <= 0) {
            return;
        }
        const startAngle = (cumulative * 360) / total;
        cumulative += slice.value;
        const endAngle = out.length === drawn - 1 ? 360 : (cumulative * 360) / total;
        const full = slice.value >= total;
        out.push({
            index,
            color: slice.color,
            startAngle,
            endAngle,
            full,
            path: full ? '' : sectorPath(centre, radius, startAngle, endAngle),
        });
    });
    return out;
}

/**
 * The area of the legend rows: right of the pie and vertically centred on it (landscape), below the
 * pie (portrait).
 *
 * @param stage size of the display
 * @param rows number of legend rows
 * @param centre centre of the pie
 * @param radius radius of the pie
 */
export function legendArea(stage: StageSize, rows: number, centre: Point, radius: number): Box {
    const h = rows * LEGEND_ROW_HEIGHT;
    if (isPortrait(stage)) {
        return { x: PIE_LEFT, y: centre.y + radius + 12, w: stage.width - 2 * PIE_LEFT, h };
    }
    const x = centre.x + radius + LEGEND_GAP;
    return { x, y: centre.y - Math.floor(h / 2), w: stage.width - RIGHT_MARGIN - x, h };
}

/**
 * The legend rows: 40 px each, vertically centred on the pie (landscape) or below it (portrait).
 * Line 1 holds the colour square and the name, line 2 the value text (left) and the percentage
 * (right). In mode 0 the name alone is centred in the row.
 *
 * @param model the parsed page
 * @param stage size of the display
 * @param centre centre of the pie
 * @param radius radius of the pie
 */
export function layoutLegend(model: PieModel, stage: StageSize, centre: Point, radius: number): LegendRow[] {
    const box = legendArea(stage, model.slices.length, centre, radius);
    const textX = box.x + SWATCH_SIZE + SWATCH_GAP;
    const textW = box.w - SWATCH_SIZE - SWATCH_GAP;
    const showValue = model.legendMode === 1 || model.legendMode === 3;
    const showPercent = model.legendMode === 2 || model.legendMode === 3;
    const oneLine = !showValue && !showPercent;
    return model.slices.map((slice, index) => {
        const top = box.y + index * LEGEND_ROW_HEIGHT;
        const line1 = oneLine ? top + (LEGEND_ROW_HEIGHT - LINE_HEIGHT) / 2 : top;
        const line2 = top + LINE_HEIGHT;
        const percentW = showPercent ? PERCENT_WIDTH : 0;
        return {
            index,
            color: slice.color,
            swatch: { x: box.x, y: line1 + (LINE_HEIGHT - SWATCH_SIZE) / 2, w: SWATCH_SIZE, h: SWATCH_SIZE },
            name: { x: textX, y: line1, w: textW, h: LINE_HEIGHT, align: 'left', text: slice.name },
            value: showValue
                ? { x: textX, y: line2, w: textW - percentW, h: LINE_HEIGHT, align: 'left', text: slice.text }
                : undefined,
            percent: showPercent
                ? {
                      x: textX + textW - PERCENT_WIDTH,
                      y: line2,
                      w: PERCENT_WIDTH,
                      h: LINE_HEIGHT,
                      align: 'right',
                      text: `${slice.percentText} %`,
                  }
                : undefined,
        };
    });
}

export function layoutPie(model: PieModel, stage: StageSize): PieLayout {
    const rows = model.slices.length;
    const { centre, radius } = pieGeometry(stage, rows);
    return {
        centre,
        radius,
        sectors: layoutSectors(model.slices, model.total, centre, radius),
        legend: layoutLegend(model, stage, centre, radius),
        legendBox: legendArea(stage, rows, centre, radius),
    };
}
