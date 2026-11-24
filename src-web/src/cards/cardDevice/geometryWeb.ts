import type { Entity6 } from '../../protocol/types';
import { isEmptySlot } from '../cardEntities/shared/menuParse';
import {
    box,
    statusBlockVisible,
    type ButtonSlotGeometry,
    type DeviceGeometry,
    type DeviceGeometryBuilder,
    type InfoSlotGeometry,
    type SwitchSlotGeometry,
} from './geometry';
import { EU_GEOMETRY } from './geometryHmi';

/*
 * The device pages of the web models: layouts of their own on the full stage, with the additional slots
 * (`DEVICE_EXTRA_KINDS`). Same element kinds, fonts and heights as the eu page; the text boxes are never
 * narrower than on eu (the adapter cuts names and values to the eu widths), the room goes into more elements.
 * A row is laid out for the elements it has to place: empty additional slots at its end leave no gap.
 */

/** web-l: content x 10-629 (the stage is 640 wide and has no frame), y as on eu */
const LEFT = 10;
const RIGHT = 630;

/** Width of the status line (font 0) of the web-l pages - the adapter splits a long status text to it */
export const WEB_L_STATUS_WIDTH = 580;

/** web-l: the status line over the width, the info icon at the right edge */
const STATUS_L = box(LEFT, 289, WEB_L_STATUS_WIDTH, 30);
const INFO_L = box(594, 288, 36, 32);

/**
 * How many of the given additional slots a row has to place: up to the last filled one, 0 when all are empty.
 *
 * @param extras the additional slots of the model
 * @param indices indices of the additional slots of one kind, in the order of the row
 */
function usedExtras(extras: readonly Entity6[], indices: readonly number[]): number {
    let used = 0;
    indices.forEach((index, n) => {
        const extra = extras[index];
        if (extra !== undefined && !isEmptySlot(extra)) {
            used = n + 1;
        }
    });
    return used;
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

/**
 * web-l cardDevice1: main, status block and the two info rows like eu, the values at the right edge;
 * below them one row of 4-6 buttons (2 additional).
 *
 * @param slots the standard slots
 * @param extras the additional slots: button, button
 */
function landscape1(slots: readonly Entity6[], extras: readonly Entity6[]): DeviceGeometry {
    const eu = EU_GEOMETRY[1];
    // next to a visible status block the rows start further right, like on eu
    const x = statusBlockVisible(1, slots) ? 204 : 126;
    const info = (y: number): InfoSlotGeometry => ({
        kind: 'info',
        icon: box(x, y, 36, 34),
        name: box(x + 38, y + 4, 518 - (x + 38), 26),
        value: box(520, y + 4, 110, 26),
    });
    const used = usedExtras(extras, [0, 1]);
    const xs = spread(4 + used, 104);
    const button = (n: number): ButtonSlotGeometry => ({
        kind: 'button',
        icon: box(xs[n], 190, 104, 52),
        name: box(xs[n], 244, 104, 26),
    });
    return {
        main: eu.main,
        slots: [info(76), info(120), button(0), button(1), button(2), button(3), ...eu.slots.slice(6)],
        extras: [used > 0 ? button(4) : undefined, used > 1 ? button(5) : undefined],
        status: STATUS_L,
        statusAlign: 1,
        info: INFO_L,
    };
}

/**
 * web-l cardDevice2: main and the big value like eu, 1-3 buttons at the top right (2 additional), the bar
 * over the width, below it one row of 3-4 info tiles (1 additional).
 *
 * @param _slots the standard slots
 * @param extras the additional slots: info, button, button
 */
function landscape2(_slots: readonly Entity6[], extras: readonly Entity6[]): DeviceGeometry {
    const eu = EU_GEOMETRY[2];
    const buttons = 1 + usedExtras(extras, [1, 2]);
    // three buttons of 100 px take x 330-629: icon and value move up to main then (eu: gaps of 4 and 2 px)
    const iconX = buttons > 2 ? 106 : 110;
    const valueX = buttons > 2 ? 140 : 146;
    // the buttons end at the right edge, the standard one first
    const button = (n: number): ButtonSlotGeometry => {
        const x = RIGHT - (buttons - n) * 100;
        return { kind: 'button', icon: box(x, 67, 100, 50), name: box(x, 119, 100, 26) };
    };
    const infos = 3 + usedExtras(extras, [0]);
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
            button(0),
        ],
        extras: [
            infos > 3 ? info(3) : undefined,
            buttons > 1 ? button(1) : undefined,
            buttons > 2 ? button(2) : undefined,
        ],
        status: STATUS_L,
        statusAlign: 1,
        info: INFO_L,
    };
}

/**
 * web-l cardDevice3: main like eu, the six info tiles in the two columns of eu (row by row) and a third
 * column for the 2 additional ones, below them one row of 2-3 switches (1 additional).
 *
 * @param _slots the standard slots
 * @param extras the additional slots: info, info, switch
 */
function landscape3(_slots: readonly Entity6[], extras: readonly Entity6[]): DeviceGeometry {
    const eu = EU_GEOMETRY[3];
    const extraInfos = usedExtras(extras, [0, 1]);
    // tiles of 161 px right of main (x 114-629): two columns share the width, three are spread over it
    const columns = extraInfos > 0 ? spread(3, 161, 114) : [114, 372];
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
    const switches = 2 + usedExtras(extras, [2]);
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
            extraInfos > 0 ? info(2, 0) : undefined,
            extraInfos > 1 ? info(2, 1) : undefined,
            switches > 2 ? toggle(2) : undefined,
        ],
        status: STATUS_L,
        statusAlign: 1,
        info: INFO_L,
    };
}

/**
 * web-l (stage 640x320): the three device pages on the full width.
 *
 * @param layout the page
 * @param slots the standard slots of the model
 * @param extras the additional slots of the model
 */
export const webLandscapeGeometry: DeviceGeometryBuilder = (layout, slots, extras) => {
    switch (layout) {
        case 1:
            return landscape1(slots, extras);
        case 2:
            return landscape2(slots, extras);
        case 3:
            return landscape3(slots, extras);
    }
};
