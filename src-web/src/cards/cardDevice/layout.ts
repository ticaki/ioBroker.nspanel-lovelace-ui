import type { Entity6 } from '../../protocol/types';
import { isEmptySlot } from '../cardEntities/shared/menuParse';
import type { NextionAlign } from '../cardEntities/shared/widgets';

/** A Nextion component box in stage pixels of the eu HMI */
export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** The kind of element a slot of a device page shows */
export type DeviceSlotKind = 'info' | 'value' | 'progress' | 'button' | 'switch' | 'status';

/** icon (font 1) + name + value (font 0, right aligned) */
export interface InfoSlotGeometry {
    kind: 'info';
    icon: Box;
    name: Box;
    value: Box;
}

/** small icon (font 1) + value (font 4, left aligned) + name below */
export interface ValueSlotGeometry {
    kind: 'value';
    icon: Box;
    name: Box;
    value: Box;
}

/** name above a bar over the full width */
export interface ProgressSlotGeometry {
    kind: 'progress';
    name: Box;
    bar: Box;
}

/** icon (font 3) + name below, centred */
export interface ButtonSlotGeometry {
    kind: 'button';
    icon: Box;
    name: Box;
}

/** icon (font 1) + name + on/off switch */
export interface SwitchSlotGeometry {
    kind: 'switch';
    icon: Box;
    name: Box;
    toggle: Box;
}

/** a cell of the status block of cardDevice1: only the icon (font 1), centred, in a 1 px grey frame */
export interface StatusSlotGeometry {
    kind: 'status';
    cell: Box;
}

export type SlotGeometry =
    | InfoSlotGeometry
    | ValueSlotGeometry
    | ProgressSlotGeometry
    | ButtonSlotGeometry
    | SwitchSlotGeometry
    | StatusSlotGeometry;

/** The geometry of one device page (cardDevice1/2/3) */
export interface DeviceGeometry {
    /** the big icon (font 4) and the name below it */
    main: { icon: Box; name: Box };
    /** the slots in protocol order */
    slots: readonly SlotGeometry[];
    /** the status line (field 6 of main), font 0, one line */
    status: Box;
    statusAlign: NextionAlign;
    /** the scrolling status line `gStatus`: the twin of the status line, 1 px lower */
    statusScroll: Box;
    /** the info icon at the bottom right (font 1) */
    info: Box;
}

export type DeviceLayout = 1 | 2 | 3;

function box(x: number, y: number, w: number, h: number): Box {
    return { x, y, w, h };
}

const STATUS = box(10, 289, 390, 30);
const STATUS_SCROLL = box(10, 290, 390, 30);
const INFO = box(404, 288, 36, 32);

function info1(y: number): InfoSlotGeometry {
    return { kind: 'info', icon: box(126, y, 36, 34), name: box(164, y + 4, 164, 26), value: box(330, y + 4, 110, 26) };
}

/** the info rows of cardDevice1 next to a visible status block */
function info1Narrow(y: number): InfoSlotGeometry {
    return { kind: 'info', icon: box(204, y, 36, 34), name: box(242, y + 4, 86, 26), value: box(330, y + 5, 110, 26) };
}

function status1(x: number, y: number): StatusSlotGeometry {
    return { kind: 'status', cell: box(x, y, 38, 45) };
}

/** frame colour of the status cells: rgb565 14823 (the grey of the pie lines on cardPChart) */
export const STATUS_FRAME_COLOR = 14823;

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

/**
 * The three device pages of the eu HMI, exactly as `doc/ideas/device-details/device-page-hmi.md`
 * (section Geometrie) places their components; the stage of the web panel uses the same pixels.
 */
export const DEVICE_GEOMETRY: Readonly<Record<DeviceLayout, DeviceGeometry>> = {
    1: {
        main: { icon: box(10, 68, 110, 86), name: box(10, 156, 110, 26) },
        slots: [
            info1(76),
            info1(120),
            button1(10),
            button1(118),
            button1(226),
            button1(334),
            status1(124, 71),
            status1(161, 71),
            status1(124, 115),
            status1(161, 115),
        ],
        status: STATUS,
        statusScroll: STATUS_SCROLL,
        statusAlign: 0,
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
        status: STATUS,
        statusScroll: STATUS_SCROLL,
        statusAlign: 1,
        info: INFO,
    },
    3: {
        main: { icon: box(10, 67, 100, 82), name: box(10, 151, 100, 26) },
        slots: [info3(0), info3(1), info3(2), info3(3), info3(4), info3(5), switch3(10), switch3(226)],
        status: STATUS,
        statusScroll: STATUS_SCROLL,
        statusAlign: 0,
        info: INFO,
    },
};

/**
 * The layout of a device pageType: `cardDevice2` -> 2, `cardDevice3` -> 3, everything else 1.
 *
 * @param pageType the active pageType
 */
export function deviceLayout(pageType: string): DeviceLayout {
    switch (pageType) {
        case 'cardDevice2':
            return 2;
        case 'cardDevice3':
            return 3;
        default:
            return 1;
    }
}

/**
 * The fill of a progress bar: field 6 as an integer, limited to 0-100 like the HMI; not a number = 0.
 *
 * @param value field 6 of the progress slot
 */
export function progressPercent(value: string): number {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
}

/**
 * `true` when the status block of the page is shown: at least one of its slots (cardDevice1 slots 7-10) is
 * filled. An empty cell of a shown block stays as an empty grid cell.
 *
 * @param layout the layout
 * @param slots the slots of the model
 */
export function statusBlockVisible(layout: DeviceLayout, slots: readonly Entity6[]): boolean {
    return DEVICE_GEOMETRY[layout].slots.some((g, i) => {
        const slot = slots[i];
        return g.kind === 'status' && slot !== undefined && !isEmptySlot(slot);
    });
}

/**
 * The geometry of a page for the slots it shows: with a visible status block the two info rows of
 * cardDevice1 move right and get narrower (icon x 204, name 242 86 px wide, value 1 px lower).
 *
 * @param layout the layout
 * @param slots the slots of the model
 */
export function deviceGeometry(layout: DeviceLayout, slots: readonly Entity6[]): DeviceGeometry {
    const geometry = DEVICE_GEOMETRY[layout];
    if (layout !== 1 || !statusBlockVisible(layout, slots)) {
        return geometry;
    }
    return {
        ...geometry,
        slots: geometry.slots.map((g, i) => (i === 0 ? info1Narrow(76) : i === 1 ? info1Narrow(120) : g)),
    };
}
