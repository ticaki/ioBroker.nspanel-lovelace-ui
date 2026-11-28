import type { Entity6 } from '../../protocol/types';
import { isEmptySlot } from '../cardEntities/shared/menuParse';
import {
    box,
    type ButtonSlotGeometry,
    type DeviceGeometry,
    type DeviceGeometryBuilder,
    type DeviceStage,
    type InfoSlotGeometry,
    type SwitchSlotGeometry,
} from './geometry';
import {
    EU_GEOMETRY,
    SET_B_NAME_BYTES,
    SET_C_VALUE_BYTES,
    portraitButton,
    portraitGrid1,
    portraitGrid3,
    portraitInfoRow,
    portraitInfoTile,
    portraitMain1,
    portraitMain2,
    portraitMain3,
    portraitProgress,
    portraitSetC,
    portraitSwitchRow,
} from './geometryHmi';

/*
 * The device pages of the web models: layouts of their own on the full stage, with the additional slots
 * (`DEVICE_EXTRA_KINDS`). Same element kinds, fonts and heights as the page of the HMI model they follow
 * (web-l: eu, web-p: us-p); the room goes into more elements, not into more text - a text box is as wide as on
 * that model unless a row has to hold more elements than there (never narrower than the same field on eu).
 * A row is laid out for the additional slots that are filled: an empty one takes no place, wherever it stands -
 * the filled ones of a kind follow the standard slots in their order without a gap ({@link filledExtras}).
 * Where the boxes of a row of buttons stand side by side, the name fields keep the 4 px between them that the
 * buttons of eu have ({@link button}).
 *
 * The status icon grid has the cells, columns and stages of the HMI model (web-l: eu, web-p: us-p in variant P2);
 * the info rows of cardDevice1 follow the sets of the stages (A, B with the name cut to the bytes of the HMI, C without
 * name, none in stage 3).
 */

/** web-l: content x 10-629 (the stage is 640 wide and has no frame), y as on eu */
const LEFT = 10;
const RIGHT = 630;

/** Width of the status line (font 0) of the web-l pages - the adapter splits a long status text to it */
export const WEB_L_STATUS_WIDTH = 580;

/** web-l: the status line over the width, the info icon at the right edge */
const STATUS_L = box(LEFT, 289, WEB_L_STATUS_WIDTH, 30);
const INFO_L = box(594, 288, 36, 32);

/** Gap between the name fields of two neighbouring buttons, as on eu (cardDevice1: buttons of 104 px every 108 px) */
const NAME_GAP = 4;

/**
 * The additional slots of one kind that are filled, in the order of the protocol. Only they get a place: the
 * n-th filled one stands on the n-th additional place of its row, so an empty slot in front of a filled one
 * leaves no hole. Every slot keeps its own element (id, texts) - only its place depends on the others.
 *
 * @param extras the additional slots of the model
 * @param indices indices of the additional slots of one kind, in the order of the row
 */
function filledExtras(extras: readonly Entity6[], indices: readonly number[]): number[] {
    return indices.filter(index => {
        const extra = extras[index];
        return extra !== undefined && !isEmptySlot(extra);
    });
}

/**
 * The boxes of an additional slot: those of its place among the filled ones of its kind, none when it is empty.
 *
 * @param filled the filled additional slots of the kind ({@link filledExtras})
 * @param index index of the additional slot
 * @param place the boxes of the n-th additional place of the kind (n from 0)
 */
function placed<T>(filled: readonly number[], index: number, place: (n: number) => T): T | undefined {
    const n = filled.indexOf(index);
    return n < 0 ? undefined : place(n);
}

/**
 * A button: the icon over its width, the name below it. In a row whose buttons stand side by side (`dense`) the
 * name field is {@link NAME_GAP} px narrower and centred, so two long names do not run into each other; the
 * touch area stays the full width.
 *
 * @param x left edge
 * @param w width
 * @param iconY top of the icon
 * @param iconH height of the icon
 * @param nameY top of the name
 * @param dense the neighbouring buttons touch
 */
function button(x: number, w: number, iconY: number, iconH: number, nameY: number, dense: boolean): ButtonSlotGeometry {
    const inset = dense ? NAME_GAP / 2 : 0;
    return { kind: 'button', icon: box(x, iconY, w, iconH), name: box(x + inset, nameY, w - 2 * inset, 26) };
}

/**
 * `true` when boxes at these left edges stand closer than {@link NAME_GAP}.
 *
 * @param xs left edges of the boxes of a row
 * @param width width of a box
 */
function isDense(xs: readonly number[], width: number): boolean {
    return xs.some((x, i) => i > 0 && x - xs[i - 1] - width < NAME_GAP);
}

/**
 * Left edges of `count` boxes of `width` px in a row: the first at `left`, the last ending at `right`, the
 * gaps equal. Boxes that do not fit stand side by side, centred (6 buttons of 104 px: x 8-631).
 *
 * @param count number of boxes
 * @param width width of a box
 * @param left left edge of the row
 * @param right right edge of the row
 */
export function spread(count: number, width: number, left = LEFT, right = RIGHT): number[] {
    const gap = count > 1 ? (right - left - count * width) / (count - 1) : 0;
    if (gap < 0) {
        const start = Math.round((left + right - count * width) / 2);
        return Array.from({ length: count }, (_, i) => start + i * width);
    }
    return Array.from({ length: count }, (_, i) => Math.round(left + i * (width + gap)));
}

/** web-l cardDevice1: the info rows end at the right edge, the value of sets A and B takes the last 110 px (eu) */
const VALUE_L = 520;

/**
 * An info row of web-l cardDevice1 in the set of the stage: the icon where eu has it (5 px right of the grid of the
 * stage in set A, 11 px in sets B and C), sets A and B with the name up to the value, set C with the value from the icon to the right edge (no
 * name).
 *
 * @param y top of the icon
 * @param stage the stage of the status icon grid
 */
function info1L(y: number, stage: DeviceStage): InfoSlotGeometry {
    switch (stage) {
        case 1:
            return {
                kind: 'info',
                icon: box(247, y, 36, 34),
                name: { ...box(285, y + 4, VALUE_L - 2 - 285, 26), maxBytes: SET_B_NAME_BYTES },
                value: box(VALUE_L, y + 4, RIGHT - VALUE_L, 26),
            };
        case 2:
            return {
                kind: 'info',
                icon: box(321, y, 36, 34),
                value: { ...box(359, y + 4, RIGHT - 359, 26), maxBytes: SET_C_VALUE_BYTES },
            };
        default:
            return {
                kind: 'info',
                icon: box(126, y, 36, 34),
                name: box(164, y + 4, VALUE_L - 2 - 164, 26),
                value: box(VALUE_L, y + 4, RIGHT - VALUE_L, 26),
            };
    }
}

/**
 * web-l cardDevice1: main, the status icon grid and the two info rows like eu (the set of the stage), the values at
 * the right edge; below them one row of 4-6 buttons (2 additional). Six buttons stand side by side: their names get
 * 100 px.
 *
 * @param extras the additional slots: button, button
 * @param stage the stage of the status icon grid
 */
function landscape1(extras: readonly Entity6[], stage: DeviceStage): DeviceGeometry {
    const eu = EU_GEOMETRY[1];
    const info = (y: number): InfoSlotGeometry => info1L(y, stage);
    const filled = filledExtras(extras, [0, 1]);
    const xs = spread(4 + filled.length, 104);
    const dense = isDense(xs, 104);
    const place = (n: number): ButtonSlotGeometry => button(xs[n], 104, 190, 52, 244, dense);
    return {
        main: eu.main,
        slots: [info(76), info(120), place(0), place(1), place(2), place(3)],
        extras: [0, 1].map(index => placed(filled, index, n => place(4 + n))),
        grid: eu.grid,
        status: STATUS_L,
        statusAlign: 1,
        info: INFO_L,
    };
}

/**
 * web-l cardDevice2: main and the big value like eu, 1-3 buttons at the top right (2 additional), the bar
 * over the width, below it one row of 3-4 info tiles (1 additional). Two or three buttons stand side by side:
 * their names get 96 px.
 *
 * @param extras the additional slots: info, button, button
 */
function landscape2(extras: readonly Entity6[]): DeviceGeometry {
    const eu = EU_GEOMETRY[2];
    const filledButtons = filledExtras(extras, [1, 2]);
    const buttons = 1 + filledButtons.length;
    // three buttons of 100 px take x 330-629: icon and value move up to main then (eu: gaps of 4 and 2 px)
    const iconX = buttons > 2 ? 106 : 110;
    const valueX = buttons > 2 ? 140 : 146;
    // the buttons end at the right edge, the standard one first
    const place = (n: number): ButtonSlotGeometry => button(RIGHT - (buttons - n) * 100, 100, 67, 50, 119, buttons > 1);
    const filledInfos = filledExtras(extras, [0]);
    const infos = 3 + filledInfos.length;
    const xs = spread(infos, 140);
    const info = (n: number): InfoSlotGeometry => ({
        kind: 'info',
        icon: box(xs[n], 228, 34, 48),
        name: box(xs[n] + 36, 226, 104, 25),
        value: box(xs[n] + 36, 252, 104, 25),
    });
    return {
        main: eu.main,
        slots: [
            {
                kind: 'value',
                icon: box(iconX, 90, 34, 36),
                value: box(valueX, 67, 190, 82),
                name: box(valueX, 151, 190, 26),
            },
            { kind: 'progress', name: box(LEFT, 179, RIGHT - LEFT, 26), bar: box(LEFT, 207, RIGHT - LEFT, 14) },
            info(0),
            info(1),
            info(2),
            place(0),
        ],
        extras: [
            placed(filledInfos, 0, n => info(3 + n)),
            placed(filledButtons, 1, n => place(1 + n)),
            placed(filledButtons, 2, n => place(1 + n)),
        ],
        grid: [],
        status: STATUS_L,
        statusAlign: 1,
        info: INFO_L,
    };
}

/**
 * web-l cardDevice3: main like eu, the six info tiles in the two columns of eu (row by row) and a third
 * column for the 2 additional ones (from the top), below them one row of 2-3 switches (1 additional). The status
 * icon grid of eu in the first row of tiles: tile 1 (stage 1) or tiles 1 and 2 (stage 2) give way to it.
 *
 * @param extras the additional slots: info, info, switch
 */
function landscape3(extras: readonly Entity6[]): DeviceGeometry {
    const eu = EU_GEOMETRY[3];
    const filledInfos = filledExtras(extras, [0, 1]);
    // tiles of 161 px right of main (x 114-629): two columns share the width, three are spread over it
    const columns = filledInfos.length > 0 ? spread(3, 161, 114) : [114, 372];
    const info = (column: number, row: number): InfoSlotGeometry => {
        const x = columns[column];
        const y = 69 + row * 52;
        return {
            kind: 'info',
            icon: box(x, y, 34, 48),
            name: box(x + 36, y - 2, 125, 25),
            value: box(x + 36, y + 24, 125, 25),
        };
    };
    const filledSwitches = filledExtras(extras, [2]);
    const switches = 2 + filledSwitches.length;
    // three switches: 206 px each instead of the 213 of eu - the name keeps its 125 px and 2 px to the switch,
    // the box of the switch is the switch itself (45 px)
    const tight = spread(3, 206);
    const toggle = (n: number): SwitchSlotGeometry => {
        if (switches > 2) {
            const x = tight[n];
            return {
                kind: 'switch',
                icon: box(x, 236, 34, 34),
                name: box(x + 34, 240, 125, 26),
                toggle: box(x + 161, 228, 45, 50),
            };
        }
        const x = LEFT + n * 310;
        return {
            kind: 'switch',
            icon: box(x, 236, 34, 34),
            name: box(x + 36, 240, 125, 26),
            toggle: box(x + 163, 228, 50, 50),
        };
    };
    return {
        main: eu.main,
        slots: [info(0, 0), info(1, 0), info(0, 1), info(1, 1), info(0, 2), info(1, 2), toggle(0), toggle(1)],
        extras: [
            placed(filledInfos, 0, n => info(2, n)),
            placed(filledInfos, 1, n => info(2, n)),
            placed(filledSwitches, 2, n => toggle(2 + n)),
        ],
        grid: eu.grid,
        status: STATUS_L,
        statusAlign: 1,
        info: INFO_L,
    };
}

/** Width of the status line (font 0) of the web-p pages, as on us-p */
export const WEB_P_STATUS_WIDTH = 262;

/** web-p: status line and info icon at the bottom of the 640 px stage (us-p: y 447 / 446) */
const STATUS_P = box(10, 607, WEB_P_STATUS_WIDTH, 30);
const INFO_P = box(274, 606, 36, 32);

/** weights of the free height of a portrait page: between two groups of elements, between two rows of a group */
const GROUP_GAP = 2;
const ROW_GAP = 1;

/**
 * Top edges of rows stacked from `top` down to the status line: the rows keep their height, the free height
 * goes into the gaps by weight - the gap in front of a row (`gap`, 0 for the first) and {@link GROUP_GAP} in
 * front of the status line. So a page with fewer rows is spread over the stage instead of ending early.
 *
 * @param top top of the first row
 * @param rows height of every row and weight of the gap in front of it
 */
export function stack(top: number, rows: readonly { h: number; gap: number }[]): number[] {
    const free = STATUS_P.y - top - rows.reduce((sum, r) => sum + r.h, 0);
    const unit = free / (rows.reduce((sum, r) => sum + r.gap, 0) + GROUP_GAP);
    let used = 0;
    let gaps = 0;
    return rows.map(r => {
        gaps += r.gap;
        const y = Math.round(top + used + gaps * unit);
        used += r.h;
        return y;
    });
}

/**
 * A group of `count` rows of the same height: the first after a group gap, the others after a row gap.
 *
 * @param count number of rows
 * @param h height of a row
 */
function group(count: number, h: number): { h: number; gap: number }[] {
    return Array.from({ length: count }, (_, i) => ({ h, gap: i === 0 ? GROUP_GAP : ROW_GAP }));
}

/** Height of the status icon grid of web-p cardDevice1: two rows of cells 41 px high that share their frame */
const GRID_P_HEIGHT = 81;

/**
 * web-p cardDevice1 after us-p in variant P2: in stage 0 main in the middle (nothing stands beside it) with the two
 * info rows below it; in stages 1 and 2 main at the left with the info rows as set C right of it, in stage 3 main in
 * the middle without info rows - from stage 1 on the status icon grid stands below main. Then 2 or 3 rows of two
 * buttons (2 additional; a single one stands at the left of the third row).
 *
 * @param extras the additional slots: button, button
 * @param stage the stage of the status icon grid
 */
function portrait1(extras: readonly Entity6[], stage: DeviceStage): DeviceGeometry {
    const filled = filledExtras(extras, [0, 1]);
    const buttonRows = filled.length > 0 ? 3 : 2;
    // below main: the info rows of set A, or the grid
    const middle = stage === 0 ? group(2, 34) : [{ h: GRID_P_HEIGHT, gap: GROUP_GAP }];
    const ys = stack(70, [{ h: 114, gap: 0 }, ...middle, ...group(buttonRows, 80)]);
    const firstButtons = 1 + middle.length;
    const beside = stage === 1 || stage === 2;
    const main = beside ? portraitMain1(ys[0]) : { icon: box(85, ys[0], 150, 86), name: box(10, ys[0] + 88, 300, 26) };
    const infos = beside ? portraitSetC(ys[0]) : [portraitInfoRow(ys[1]), portraitInfoRow(ys[2])];
    const place = (n: number): ButtonSlotGeometry =>
        portraitButton(n % 2 === 0 ? 10 : 162, ys[firstButtons + Math.floor(n / 2)], 148);
    return {
        main,
        slots: [...infos, place(0), place(1), place(2), place(3)],
        extras: [0, 1].map(index => placed(filled, index, n => place(4 + n))),
        grid: portraitGrid1(ys[1]),
        status: STATUS_P,
        statusAlign: 1,
        info: INFO_P,
    };
}

/**
 * web-p cardDevice2: main, the big value and the bar like us-p, 3 or 4 info rows (1 additional), below them one
 * row of 1-3 buttons (2 additional) that share the width: 300 px like us-p, 2 x 148 or 3 x 100 px (the width of
 * this button on eu). Three buttons stand side by side: their names get 96 px.
 *
 * @param extras the additional slots: info, button, button
 */
function portrait2(extras: readonly Entity6[]): DeviceGeometry {
    const filledInfos = filledExtras(extras, [0]);
    const filledButtons = filledExtras(extras, [1, 2]);
    const infos = 3 + filledInfos.length;
    const buttons = 1 + filledButtons.length;
    const ys = stack(68, [{ h: 110, gap: 0 }, ...group(1, 42), ...group(infos, 34), ...group(1, 80)]);
    const { main, value } = portraitMain2(ys[0]);
    const width = buttons === 1 ? 300 : buttons === 2 ? 148 : 100;
    const xs = spread(buttons, width, 10, 310);
    const y = ys[2 + infos];
    const dense = isDense(xs, width);
    const place = (n: number): ButtonSlotGeometry => button(xs[n], width, y, 52, y + 54, dense);
    return {
        main,
        slots: [
            value,
            portraitProgress(ys[1]),
            portraitInfoRow(ys[2]),
            portraitInfoRow(ys[3]),
            portraitInfoRow(ys[4]),
            place(0),
        ],
        extras: [
            placed(filledInfos, 0, n => portraitInfoRow(ys[5 + n])),
            placed(filledButtons, 1, n => place(1 + n)),
            placed(filledButtons, 2, n => place(1 + n)),
        ],
        grid: [],
        status: STATUS_P,
        statusAlign: 1,
        info: INFO_P,
    };
}

/**
 * web-p cardDevice3: main like us-p, 3 or 4 rows of two info tiles (2 additional; a single one stands at the left
 * of the fourth row), below them 2 or 3 switch rows (1 additional). The status icon grid of us-p in the first row
 * of tiles.
 *
 * @param extras the additional slots: info, info, switch
 */
function portrait3(extras: readonly Entity6[]): DeviceGeometry {
    const filledInfos = filledExtras(extras, [0, 1]);
    const filledSwitches = filledExtras(extras, [2]);
    const infoRows = filledInfos.length > 0 ? 4 : 3;
    const switches = 2 + filledSwitches.length;
    const ys = stack(67, [{ h: 110, gap: 0 }, ...group(infoRows, 51), ...group(switches, 50)]);
    const tile = (n: number): InfoSlotGeometry => portraitInfoTile(n % 2, ys[1 + Math.floor(n / 2)]);
    const toggle = (n: number): SwitchSlotGeometry => portraitSwitchRow(ys[1 + infoRows + n]);
    return {
        main: portraitMain3(ys[0]),
        slots: [tile(0), tile(1), tile(2), tile(3), tile(4), tile(5), toggle(0), toggle(1)],
        extras: [
            placed(filledInfos, 0, n => tile(6 + n)),
            placed(filledInfos, 1, n => tile(6 + n)),
            placed(filledSwitches, 2, n => toggle(2 + n)),
        ],
        grid: portraitGrid3(ys[1]),
        status: STATUS_P,
        statusAlign: 1,
        info: INFO_P,
    };
}

/**
 * web-p (stage 320x640): the three device pages after the us-p pages, with the additional slots; the rows share
 * the height of the stage ({@link stack}).
 *
 * @param layout the page
 * @param extras the additional slots of the model
 * @param stage the stage of the status icon grid
 */
export const webPortraitGeometry: DeviceGeometryBuilder = (layout, extras, stage) => {
    switch (layout) {
        case 1:
            return portrait1(extras, stage);
        case 2:
            return portrait2(extras);
        case 3:
            return portrait3(extras);
    }
};

/**
 * web-l (stage 640x320): the three device pages on the full width.
 *
 * @param layout the page
 * @param extras the additional slots of the model
 * @param stage the stage of the status icon grid
 */
export const webLandscapeGeometry: DeviceGeometryBuilder = (layout, extras, stage) => {
    switch (layout) {
        case 1:
            return landscape1(extras, stage);
        case 2:
            return landscape2(extras);
        case 3:
            return landscape3(extras);
    }
};
