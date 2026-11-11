import type { PanelModel } from '../../protocol/types';
import { isPortrait, isWebModel, stageSize } from '../../style/theme';

/**
 * Geometry of the screensaver layouts per model, in stage pixels. Kept free of React so the
 * positions can be tested without a DOM.
 *
 * - eu, us-l: the eu layout of 480 px width (the HMI measurements, stage x = HMI x + 16).
 * - us-p: the portrait pages of the us-p HMI (`HMI/us-p/nspanel-us-p-v6.0.9.HMI`, stage x = HMI x).
 * - web-l: the eu layout, the 160 px more width go into the columns.
 * - web-p: own portrait layouts, the bottom area always two rows of 4 columns of 80 px.
 * - tiles on us-p / web-p: 4 columns of 80 px after `HMI/tools/screensaver5_usp.py`.
 */

/** A column of the bottom area; `top` is the offset of its row (portrait layouts), 0 when missing */
export interface Column {
    left: number;
    width: number;
    top?: number;
}

/** A box in stage pixels */
export interface Box {
    left: number;
    top: number;
    width: number;
    height: number;
}

/** Width of a bottom column in the portrait layouts */
export const PORTRAIT_COLUMN = 80;
/** Columns per row in the portrait layouts */
export const PORTRAIT_PER_ROW = 4;

/** `true` when the model gets the portrait layouts of `web-p` (all screensaver modes) */
export function isWebPortrait(model: PanelModel): boolean {
    return isPortrait(model) && isWebModel(model);
}

/** `true` when the model gets the portrait layouts of the us-p HMI (all screensaver modes) */
export function isHmiPortrait(model: PanelModel): boolean {
    return isPortrait(model) && !isWebModel(model);
}

/**
 * us-p standard and alternate: the bottom row (`tForecast1..4`, x 5 / 86 / 167 / 247, about 71 px wide) as
 * 4 columns of 80 px, label cap top 389, icon 416, value 456. The alternate layout keeps the columns 1-3
 * (the HMI only moves them right when `p0.w != 320`).
 *
 * @param count number of bottom entities
 */
export function uspStandardColumns(count: number): Column[] {
    return rowColumns(Math.min(count, PORTRAIT_PER_ROW), 0, PORTRAIT_COLUMN);
}

/**
 * us-p advanced: `e1..e6` as two rows of 3 columns (HMI x 20 / 94 / 168, 70 wide, rows y 260 and 346);
 * the columns are 74 px wide around the centres of the HMI fields.
 *
 * @param count number of bottom entities
 */
export function uspAdvancedColumns(count: number): Column[] {
    return Array.from({ length: Math.min(count, 6) }, (_, i) => ({
        left: 18 + (i % 3) * 74,
        width: 74,
        top: Math.floor(i / 3) * 86,
    }));
}

/**
 * us-p EasyView: `tForecast1..4` as 2 x 2 boxes of 140 px (x 8 / 168, rows y 177 and 333).
 *
 * @param count number of bottom entities
 */
export function uspEasyviewColumns(count: number): Column[] {
    return Array.from({ length: Math.min(count, 4) }, (_, i) => ({
        left: 8 + (i % 2) * 160,
        width: 140,
        top: Math.floor(i / 2) * 156,
    }));
}

/**
 * Width the landscape layouts are laid out in: the stage width of a landscape model, 480 on us-p
 * (the web has no us-p layout of the non-tiles screensavers, they use the eu geometry).
 *
 * @param model the panel model
 */
export function landscapeWidth(model: PanelModel): number {
    return isPortrait(model) ? 480 : stageSize(model).width;
}

/**
 * `count` columns of `width` px in one row from `left` on, starting with the column `first`.
 *
 * @param count number of columns
 * @param left x of column 0
 * @param width width of a column
 * @param first index of the first column used
 */
export function rowColumns(count: number, left: number, width: number, first = 0): Column[] {
    return Array.from({ length: count }, (_, i) => ({ left: left + (first + i) * width, width }));
}

/**
 * `count` columns in rows of {@link PORTRAIT_PER_ROW} columns of {@link PORTRAIT_COLUMN} px, row `r`
 * at `rowTops[r]` (columns beyond the rows are dropped).
 *
 * @param count number of columns
 * @param rowTops top of every row
 */
export function portraitColumns(count: number, rowTops: readonly number[]): Column[] {
    const result: Column[] = [];
    for (let i = 0; i < count; i++) {
        const top = rowTops[Math.floor(i / PORTRAIT_PER_ROW)];
        if (top === undefined) {
            break;
        }
        result.push({ left: (i % PORTRAIT_PER_ROW) * PORTRAIT_COLUMN, width: PORTRAIT_COLUMN, top });
    }
    return result;
}

/**
 * The bottom columns of the standard and alternate layout in landscape: 82 px from x 137 (4 on eu,
 * 6 on web-l). The alternate layout with an alternate entity leaves column 0 to the favorit row.
 *
 * @param count number of bottom entities
 * @param skipFirst `true` for the alternate layout with an alternate entity
 */
export function standardColumns(count: number, skipFirst: boolean): Column[] {
    return rowColumns(count, 137, 82, skipFirst ? 1 : 0);
}

/**
 * Bottom columns of EasyView in landscape: the 434 px (eu) or 594 px (web-l) from x 23 divided by the count.
 *
 * @param count number of bottom entities
 * @param width landscape width ({@link landscapeWidth})
 */
export function easyviewColumns(count: number, width: number): Column[] {
    const column = Math.floor((width - 46) / Math.max(1, count));
    return rowColumns(count, 23, column);
}

/** web-p advanced: the indicators 1-4 as a 2 x 2 block right of the left column (cells 80 x 60) */
const ADVANCED_BLOCK_TOP = 110;
const ADVANCED_BLOCK_ROW = 60;
/** web-p advanced: the indicators 5-12 as two rows of 4 (cells 80 x 48) */
const ADVANCED_ROWS_TOP = 240;
const ADVANCED_ROW = 48;
/** web-p advanced: y of the separator line between the last indicator row and the first bottom row */
export const ADVANCED_PORTRAIT_SEPARATOR = 340;

/**
 * Positions of the advanced layout's indicators: one row of 56 px from x 178 (eu, web-l). us-p: one column at
 * the right edge like the HMI (`f1Icon..f5Icon`). web-p: 1-4 as a
 * 2 x 2 block (80 x 60) right aligned next to the left column below time and date, 5-12 as two rows of 4
 * (80 x 48) below.
 *
 * @param model the panel model
 * @param count number of indicators
 */
export function advancedIndicatorCells(model: PanelModel, count: number): Box[] {
    if (isHmiPortrait(model)) {
        // us-p: f1..f5 one below the other at x 259 (50 x 50, every 57 px from y 152)
        return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
            left: 256,
            top: 153 + i * 57,
            width: 56,
            height: 48,
        }));
    }
    if (isWebPortrait(model)) {
        const right = stageSize(model).width;
        return Array.from({ length: count }, (_, i) => {
            if (i < 4) {
                return {
                    left: right - (2 - (i % 2)) * PORTRAIT_COLUMN,
                    top: ADVANCED_BLOCK_TOP + Math.floor(i / 2) * ADVANCED_BLOCK_ROW,
                    width: PORTRAIT_COLUMN,
                    height: ADVANCED_BLOCK_ROW,
                };
            }
            const k = i - 4;
            return {
                left: (k % PORTRAIT_PER_ROW) * PORTRAIT_COLUMN,
                top: ADVANCED_ROWS_TOP + Math.floor(k / PORTRAIT_PER_ROW) * ADVANCED_ROW,
                width: PORTRAIT_COLUMN,
                height: ADVANCED_ROW,
            };
        });
    }
    return Array.from({ length: count }, (_, i) => ({ left: 178 + i * 56, top: 128, width: 56, height: 48 }));
}

/** Geometry of the tiles layout (`screensaver5`) */
export interface TilesGeometry {
    /** indicator cells in the order of the payload */
    indicators: Box[];
    /** bottom columns with the top of their row */
    bottom: Column[];
    /** box of the time */
    clock: Box;
    /** top / left of the info icon of `time~` */
    timeIcon: { top: number; left: number };
    /** the date: cap top, x and width of its centred box */
    date: { capTop: number; left: number; width: number };
    /** the two status bars */
    bars: [Box, Box];
    /** cap tops of heading and text of a notification and the number of text lines */
    notify: { headingTop: number; textTop: number; lines: number };
}

/** eu: 5 columns of 90 x 107 from x 16 (the HMI draws on 450 of the 480 px) */
const TILES_ROW = 107;

/**
 * The landscape tiles: 90 px columns from `left`, 3 rows of 107 px. Row 0 indicators, row 1
 * `side` indicators left and right of the clock (which spans the 3 middle columns), row 2 the bottom.
 *
 * @param left x of column 0
 * @param columns number of columns
 * @param side indicators left and right of the clock in row 1
 */
function landscapeTiles(left: number, columns: number, side: number): TilesGeometry {
    const col = 90;
    const x = (i: number): number => left + i * col;
    const cell = (i: number, top: number): Box => ({ left: x(i), top, width: col, height: TILES_ROW });
    const row1: number[] = [];
    for (let i = 0; i < side; i++) {
        row1.push(i);
    }
    for (let i = columns - side; i < columns; i++) {
        row1.push(i);
    }
    const area = columns * col;
    const barWidth = Math.floor((area - 82) / 2);
    const clockLeft = x(side);
    return {
        indicators: [...Array.from({ length: columns }, (_, i) => cell(i, 0)), ...row1.map(i => cell(i, TILES_ROW))],
        bottom: rowColumns(columns, left, col).map(c => ({ ...c, top: 2 * TILES_ROW })),
        clock: { left: clockLeft, top: 112, width: 3 * col, height: 81 },
        timeIcon: { top: 141, left: clockLeft - 7 },
        date: { capTop: 192, left: clockLeft, width: 3 * col },
        bars: [
            { left: left + 1, top: 315, width: barWidth, height: 5 },
            { left: left + 1 + barWidth + 80, top: 315, width: barWidth, height: 5 },
        ],
        notify: { headingTop: 216, textTop: 270, lines: 2 },
    };
}

/**
 * The portrait tiles: 4 columns of 80 px. us-p (HMI): indicators f1-f4 (128 high), clock (80) and
 * date (30), indicators f5-f8 (128), one bottom row from y 368, bars at y 475. web-p: both indicator
 * rows on top, then clock and date, two bottom rows of 107, bars at y 630.
 *
 * @param web `true` for web-p
 */
function portraitTiles(web: boolean): TilesGeometry {
    const row = (top: number): Box[] =>
        Array.from({ length: PORTRAIT_PER_ROW }, (_, i) => ({
            left: i * PORTRAIT_COLUMN,
            top,
            width: PORTRAIT_COLUMN,
            height: 128,
        }));
    // clock row (y, 80 high) and the date row (30 high) below it
    const clockTop = web ? 256 : 128;
    const dateTop = clockTop + 80;
    const bottomTop = web ? 366 : 368;
    const barsTop = web ? 630 : 475;
    return {
        indicators: [...row(0), ...row(web ? 128 : 238)],
        bottom: portraitColumns(web ? 8 : 4, web ? [bottomTop, bottomTop + TILES_ROW] : [bottomTop]),
        // the eu clock box sits 5 px below the tTime object of the HMI, the info icon 4 px / 17 px off tTimeAdd
        clock: { left: 46, top: clockTop + 5, width: 228, height: 81 },
        timeIcon: { top: clockTop + 34, left: 31 },
        date: { capTop: dateTop + 10, left: 0, width: 320 },
        bars: [
            { left: 1, top: barsTop, width: 130, height: 5 },
            { left: 189, top: barsTop, width: 130, height: 5 },
        ],
        notify: { headingTop: bottomTop + 2, textTop: bottomTop + 56, lines: web ? 6 : 2 },
    };
}

/**
 * Geometry of the tiles layout on the model.
 *
 * @param model the panel model
 */
export function tilesGeometry(model: PanelModel): TilesGeometry {
    if (isPortrait(model)) {
        return portraitTiles(isWebModel(model));
    }
    if (model === 'web-l') {
        // 7 columns of 90 px from x 5, the clock keeps its 270 px (columns 2-4)
        return landscapeTiles(5, 7, 2);
    }
    return landscapeTiles(16, 5, 1);
}

/**
 * Position of the text box of a notification: centred 304 px in landscape (88 on eu), the full width
 * less 8 px on each side in portrait.
 *
 * @param width width of the layout (stage width in portrait, {@link landscapeWidth} in landscape)
 * @param portrait `true` for a portrait layout
 */
export function notifyTextBox(width: number, portrait: boolean): { left: number; width: number } {
    if (portrait) {
        return { left: 8, width: width - 16 };
    }
    return { left: Math.floor((width - 304) / 2), width: 304 };
}

/**
 * The two MR colour bars of EasyView (`tRelay1` / `tRelay2`): eu HMI x 1 / 265, y 315, 184 x 5 (stage x + 16);
 * web-l the right bar at the same distance from the right edge; us-p HMI x 0 / 188, y 475, 130 x 5; web-p like
 * the bars of its tiles layout.
 *
 * @param model the panel model
 */
export function easyviewBars(model: PanelModel): [Box, Box] {
    if (isHmiPortrait(model)) {
        return [
            { left: 0, top: 475, width: 130, height: 5 },
            { left: 188, top: 475, width: 130, height: 5 },
        ];
    }
    if (isWebPortrait(model)) {
        return tilesGeometry(model).bars;
    }
    const width = stageSize(model).width;
    return [
        { left: 17, top: 315, width: 184, height: 5 },
        { left: width - 15 - 184, top: 315, width: 184, height: 5 },
    ];
}
