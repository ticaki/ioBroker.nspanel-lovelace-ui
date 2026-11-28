import {
    box,
    gridCells,
    shiftTable,
    type Box,
    type ButtonSlotGeometry,
    type DeviceGeometryTable,
    type DevicePageTable,
    type InfoSlotGeometry,
    type ProgressSlotGeometry,
    type SwitchSlotGeometry,
    type ValueSlotGeometry,
} from './geometry';

/*
 * The device pages of the hardware models (and of their web clones), pixel by pixel as the HMI places its
 * components. One table per model, entered in `layout.ts`.
 * The HMI tooling writes the boxes of all models to `doc/ideas/device-details/device-page-geometry.json`
 * (keys `eu`, `us-l`, `us-p`; x/y/w/h, font and alignment per box) - a table is that data in the shape of
 * `DeviceGeometryTable` (font/align only where they differ from `BOX_STYLES`). `geometry.test.ts` reads the
 * file and compares every box, font and alignment of the three tables with it.
 */

const STATUS = box(10, 289, 390, 30);
const INFO = box(404, 288, 36, 32);

function info1(y: number): InfoSlotGeometry {
    return { kind: 'info', icon: box(126, y, 36, 34), name: box(164, y + 4, 164, 26), value: box(330, y + 4, 110, 26) };
}

/** bytes the HMI copies of the name into set B (`tEntityB1/2`, txt_maxl 15) */
export const SET_B_NAME_BYTES = 15;

/** bytes the HMI copies of the value into set C (`tValueC1/2`, txt_maxl 19) */
export const SET_C_VALUE_BYTES = 19;

/**
 * An info row of cardDevice1 in set B (stage 1, right of 3 columns of the grid): icon, the name 43 px wide, the value
 * of set A (`tValue1/2`).
 *
 * @param y top of the icon
 */
function info1B(y: number): InfoSlotGeometry {
    return {
        kind: 'info',
        icon: box(247, y, 36, 34),
        name: { ...box(285, y + 4, 43, 26), maxBytes: SET_B_NAME_BYTES },
        value: box(330, y + 4, 110, 26),
    };
}

/**
 * An info row of cardDevice1 in set C (stage 2, right of 5 columns of the grid): icon and value, no name.
 *
 * @param y top of the icon
 */
function info1C(y: number): InfoSlotGeometry {
    return {
        kind: 'info',
        icon: box(321, y, 36, 34),
        value: { ...box(359, y + 4, 81, 26), maxBytes: SET_C_VALUE_BYTES },
    };
}

function button1(x: number): ButtonSlotGeometry {
    return { kind: 'button', icon: box(x, 190, 104, 52), name: box(x, 244, 104, 26) };
}

function info2(x: number): InfoSlotGeometry {
    return {
        kind: 'info',
        icon: box(x, 228, 34, 48),
        name: box(x + 36, 226, 104, 25),
        value: box(x + 36, 252, 104, 25),
    };
}

function info3(index: number): InfoSlotGeometry {
    const x = index % 2 === 0 ? 114 : 277;
    const y = 69 + Math.floor(index / 2) * 52;
    return {
        kind: 'info',
        icon: box(x, y, 34, 48),
        name: box(x + 36, y - 2, 125, 25),
        value: box(x + 36, y + 24, 125, 25),
    };
}

function switch3(x: number): SwitchSlotGeometry {
    return {
        kind: 'switch',
        icon: box(x, 236, 34, 34),
        name: box(x + 36, 240, 125, 26),
        toggle: box(x + 163, 228, 50, 50),
    };
}

/** Status line and info icon of the us-p pages */
const STATUS_P = box(10, 447, 262, 30);
const INFO_P = box(274, 446, 36, 32);

/**
 * main of the portrait cardDevice1 at the left: room for set C right of it.
 *
 * @param y top of main
 */
export function portraitMain1(y: number): DevicePageTable['main'] {
    return { icon: box(10, y, 150, 86), name: box(10, y + 88, 150, 26) };
}

/**
 * The two info rows of the portrait cardDevice1 in set C (stages 1 and 2): right of main, icon and value, no name.
 *
 * @param y top of main
 */
export function portraitSetC(y: number): [InfoSlotGeometry, InfoSlotGeometry] {
    const row = (top: number): InfoSlotGeometry => ({
        kind: 'info',
        icon: box(166, top, 36, 34),
        value: { ...box(204, top + 4, 106, 26), maxBytes: SET_C_VALUE_BYTES },
    });
    return [row(y + 6), row(y + 50)];
}

/**
 * The status icon grid of the portrait cardDevice1: 8 x 2 cells of 38 x 41 over the width, where set A has its
 * info rows.
 *
 * @param y top of the first row
 */
export function portraitGrid1(y: number): ReturnType<typeof gridCells> {
    return gridCells(10, y, 38, 41, 8, 2);
}

/**
 * The status icon grid of the portrait cardDevice3: 8 x 1 cells of 37 x 51 in the first row of tiles.
 *
 * @param y top of the first row of tiles
 */
export function portraitGrid3(y: number): ReturnType<typeof gridCells> {
    return gridCells(10, y, 37, 51, 8, 1);
}

/**
 * An info row of the portrait cardDevice1 / cardDevice2: icon, name and the value at the right edge, 34 px high.
 *
 * @param y top of the row
 */
export function portraitInfoRow(y: number): InfoSlotGeometry {
    return { kind: 'info', icon: box(10, y, 36, 34), name: box(48, y + 4, 156, 26), value: box(206, y + 4, 104, 26) };
}

/**
 * A button of the portrait pages: icon 52 px high, name below, 80 px in all.
 *
 * @param x left edge
 * @param y top
 * @param w width
 */
export function portraitButton(x: number, y: number, w: number): ButtonSlotGeometry {
    return { kind: 'button', icon: box(x, y, w, 52), name: box(x, y + 54, w, 26) };
}

/**
 * main and the big value of the portrait cardDevice2, 110 px high.
 *
 * @param y top of main
 */
export function portraitMain2(y: number): { main: DevicePageTable['main']; value: ValueSlotGeometry } {
    return {
        main: { icon: box(10, y, 90, 82), name: box(10, y + 84, 90, 26) },
        value: {
            kind: 'value',
            icon: box(102, y + 23, 34, 36),
            value: box(138, y, 172, 82),
            name: box(138, y + 84, 172, 26),
        },
    };
}

/**
 * The progress slot of the portrait cardDevice2: name above the bar, 42 px high.
 *
 * @param y top of the name
 */
export function portraitProgress(y: number): ProgressSlotGeometry {
    return { kind: 'progress', name: box(10, y, 300, 26), bar: box(10, y + 28, 300, 14) };
}

/**
 * main of the portrait cardDevice3: the icon in the middle, the name over the width, 110 px high.
 *
 * @param y top of main
 */
export function portraitMain3(y: number): DevicePageTable['main'] {
    return { icon: box(85, y, 150, 82), name: box(10, y + 84, 300, 26) };
}

/**
 * An info tile of the portrait cardDevice3 (two per row): name above the value, 51 px high.
 *
 * @param column 0 left, 1 right
 * @param y top of the row
 */
export function portraitInfoTile(column: number, y: number): InfoSlotGeometry {
    const x = column === 0 ? 10 : 162;
    return {
        kind: 'info',
        icon: box(x, y + 2, 34, 48),
        name: box(x + 36, y, 112, 25),
        value: box(x + 36, y + 26, 112, 25),
    };
}

/**
 * A switch row of the portrait cardDevice3: icon, name and the switch at the right edge, 50 px high.
 *
 * @param y top of the row
 */
export function portraitSwitchRow(y: number): SwitchSlotGeometry {
    return {
        kind: 'switch',
        icon: box(10, y + 8, 34, 34),
        name: box(46, y + 12, 212, 26),
        toggle: box(260, y, 50, 50),
    };
}

/**
 * The portrait cardDevice1 (variant P2 of the HMI): main at the left, the info rows below it (set A) or as set C
 * right of it (stages 1 and 2), the status icon grid where set A has its rows, rows of two buttons.
 *
 * @param top top of main
 * @param infoRows top of the two info rows (and of the grid)
 * @param buttonRows top of the rows of buttons (two per row)
 * @param status the status line
 * @param info the info icon
 */
export function portraitPage1(
    top: number,
    infoRows: readonly number[],
    buttonRows: readonly number[],
    status: Box,
    info: Box,
): DevicePageTable {
    const [c1, c2] = portraitSetC(top);
    return {
        main: portraitMain1(top),
        slots: [
            ...infoRows.map(portraitInfoRow),
            ...buttonRows.flatMap(y => [portraitButton(10, y, 148), portraitButton(162, y, 148)]),
        ],
        // us-p has no set B: set C in stage 1 and 2
        byStage: { 1: { 0: c1, 1: c2 }, 2: { 0: c1, 1: c2 } },
        extras: [],
        grid: portraitGrid1(infoRows[0] - 2),
        status,
        statusAlign: 1,
        info,
    };
}

/**
 * The portrait cardDevice2: main with the big value, the bar, info rows, one button over the width.
 *
 * @param top top of main
 * @param progress top of the name of the bar
 * @param infoRows top of the info rows
 * @param button top of the button
 * @param status the status line
 * @param info the info icon
 */
export function portraitPage2(
    top: number,
    progress: number,
    infoRows: readonly number[],
    button: number,
    status: Box,
    info: Box,
): DevicePageTable {
    const { main, value } = portraitMain2(top);
    return {
        main,
        slots: [value, portraitProgress(progress), ...infoRows.map(portraitInfoRow), portraitButton(10, button, 300)],
        extras: [],
        grid: [],
        status,
        statusAlign: 1,
        info,
    };
}

/**
 * The portrait cardDevice3: main, rows of two info tiles, switch rows.
 *
 * @param top top of main
 * @param infoRows top of the rows of info tiles
 * @param switchRows top of the switch rows
 * @param status the status line
 * @param info the info icon
 */
export function portraitPage3(
    top: number,
    infoRows: readonly number[],
    switchRows: readonly number[],
    status: Box,
    info: Box,
): DevicePageTable {
    return {
        main: portraitMain3(top),
        slots: [
            ...infoRows.flatMap(y => [portraitInfoTile(0, y), portraitInfoTile(1, y)]),
            ...switchRows.map(portraitSwitchRow),
        ],
        extras: [],
        grid: portraitGrid3(infoRows[0]),
        status,
        statusAlign: 1,
        info,
    };
}

/**
 * eu: the three device pages exactly as `doc/ideas/device-details/device-page-hmi.md` (section Geometrie)
 * places their components; the stage of the web panel uses the same pixels. Content x 10-439.
 */
export const EU_GEOMETRY: DeviceGeometryTable = {
    1: {
        main: { icon: box(10, 68, 110, 86), name: box(10, 156, 110, 26) },
        slots: [info1(76), info1(120), button1(10), button1(118), button1(226), button1(334)],
        // the info rows in the stages of the status icon grid: set B (stage 1), set C (stage 2), none (stage 3)
        byStage: { 1: { 0: info1B(76), 1: info1B(120) }, 2: { 0: info1C(76), 1: info1C(120) } },
        extras: [],
        grid: gridCells(124, 71, 38, 45, 8, 2),
        status: STATUS,
        statusAlign: 1,
        info: INFO,
    },
    2: {
        main: { icon: box(10, 67, 96, 82), name: box(10, 151, 96, 26) },
        slots: [
            { kind: 'value', icon: box(110, 90, 34, 36), value: box(146, 67, 190, 82), name: box(146, 151, 190, 26) },
            { kind: 'progress', name: box(10, 179, 429, 26), bar: box(10, 207, 429, 14) },
            info2(10),
            info2(154),
            info2(298),
            { kind: 'button', icon: box(340, 67, 100, 50), name: box(340, 119, 100, 26) },
        ],
        extras: [],
        grid: [],
        status: STATUS,
        statusAlign: 1,
        info: INFO,
    },
    3: {
        main: { icon: box(10, 67, 100, 82), name: box(10, 151, 100, 26) },
        slots: [info3(0), info3(1), info3(2), info3(3), info3(4), info3(5), switch3(10), switch3(226)],
        // the first row of tiles: tile 1 (stage 1) or tiles 1 and 2 (stage 2) give way to the grid
        extras: [],
        grid: gridCells(114, 67, 38, 52, 8, 1),
        status: STATUS,
        statusAlign: 1,
        info: INFO,
    },
};

/**
 * The us-l HMI is the eu HMI moved to its visible area (x 15-464 instead of 0-449): in
 * `HMI/us-l/nspanel-us-l-v6.2.0.HMI` heading, arrows and every component of cardEntities and cardThermo2
 * sit 15 px further right than in `HMI/nspanel-v6.2.0.HMI` (the cells of cardGrid 16, of cardGrid2 14 px -
 * centring of their columns), y, width and height are the same.
 */
export const US_L_SHIFT = 15;

/** us-l: the eu pages {@link US_L_SHIFT} px to the right. Content x 25-454. */
export const US_L_GEOMETRY: DeviceGeometryTable = shiftTable(EU_GEOMETRY, US_L_SHIFT);

/**
 * us-p (320x480): the pages of the us-p HMI, content x 10-309. cardDevice1 in variant P2: the status icon grid
 * over the width where the info rows are, the info rows as set C right of main in stages 1 and 2. cardDevice2 and
 * cardDevice3 list their info rows / tiles and switches below main, the grid of cardDevice3 in the first row of
 * tiles.
 */
export const US_P_GEOMETRY: DeviceGeometryTable = {
    1: portraitPage1(70, [190, 230], [272, 358], STATUS_P, INFO_P),
    2: portraitPage2(68, 184, [234, 274, 314], 356, STATUS_P, INFO_P),
    3: portraitPage3(68, [182, 234, 286], [342, 394], STATUS_P, INFO_P),
};
