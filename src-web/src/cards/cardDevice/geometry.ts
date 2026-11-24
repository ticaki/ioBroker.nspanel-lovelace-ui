import type { Entity6 } from '../../protocol/types';
import { isEmptySlot } from '../cardEntities/shared/menuParse';
import type { NextionAlign } from '../cardEntities/shared/widgets';

/**
 * A Nextion component box in stage pixels. `font` and `align` are only set where a model differs from
 * the default of the element kind (see `CardDevice.renderSlot`) - a geometry file of the HMI
 * (`doc/ideas/device-details/device-page-geometry.json`: x/y/w/h, font, alignment per box) maps 1:1.
 */
export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
    /** Nextion font id, the default of the element kind when missing */
    font?: number;
    /** `xcen` of the component (0 left, 1 centre, 2 right), the default of the element kind when missing */
    align?: NextionAlign;
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

/** The geometry of one device page (cardDevice1/2/3) on one model, for the slots that are filled */
export interface DeviceGeometry {
    /** the big icon (font 4) and the name below it */
    main: { icon: Box; name: Box };
    /** the standard slots in protocol order (cardDevice1: 10, cardDevice2: 6, cardDevice3: 8) */
    slots: readonly SlotGeometry[];
    /**
     * the additional slots of the web models in protocol order ({@link DEVICE_EXTRA_KINDS}); empty on the
     * hardware models. `undefined`: the page has no place for this one at the moment (it is empty and the row
     * is laid out without it).
     */
    extras: readonly (SlotGeometry | undefined)[];
    /** the status line (field 6 of main), font 0, one line */
    status: Box;
    statusAlign: NextionAlign;
    /** the info icon at the bottom right (font 1) */
    info: Box;
}

/**
 * One page of a geometry table of a hardware model: the fixed boxes of the HMI page.
 * `withStatusBlock` replaces slots (by index) while the status block is shown - the HMI has a second,
 * narrower set of components for the info rows next to it.
 */
export interface DevicePageTable extends DeviceGeometry {
    withStatusBlock?: Readonly<Record<number, SlotGeometry>>;
}

export type DeviceLayout = 1 | 2 | 3;

/** The three pages of one model as a table */
export type DeviceGeometryTable = Readonly<Record<DeviceLayout, DevicePageTable>>;

/**
 * Lays a page out for the elements it shows.
 *
 * @param layout the page
 * @param slots the standard slots of the model
 * @param extras the additional slots of the model (empty on the hardware models)
 */
export type DeviceGeometryBuilder = (
    layout: DeviceLayout,
    slots: readonly Entity6[],
    extras: readonly Entity6[],
) => DeviceGeometry;

/** The kinds of the standard slots in protocol order, the same on every model */
export const DEVICE_SLOT_KINDS: Readonly<Record<DeviceLayout, readonly DeviceSlotKind[]>> = {
    1: ['info', 'info', 'button', 'button', 'button', 'button', 'status', 'status', 'status', 'status'],
    2: ['value', 'progress', 'info', 'info', 'info', 'button'],
    3: ['info', 'info', 'info', 'info', 'info', 'info', 'switch', 'switch'],
};

/**
 * The kinds of the additional slots the adapter appends behind the info icon for the web models
 * (`web-l`, `web-p`): cardDevice1 6 buttons, cardDevice2 4 info + 3 buttons, cardDevice3 8 info + 3 switches.
 */
export const DEVICE_EXTRA_KINDS: Readonly<Record<DeviceLayout, readonly DeviceSlotKind[]>> = {
    1: ['button', 'button'],
    2: ['info', 'button', 'button'],
    3: ['info', 'info', 'switch'],
};

/** frame colour of the status cells: rgb565 14823 (the grey of the pie lines on cardPChart) */
export const STATUS_FRAME_COLOR = 14823;

/**
 * A box.
 *
 * @param x left edge
 * @param y top edge
 * @param w width
 * @param h height
 */
export function box(x: number, y: number, w: number, h: number): Box {
    return { x, y, w, h };
}

/**
 * `true` when the status block of the page is shown: at least one of its slots (cardDevice1 slots 7-10) is
 * filled. An empty cell of a shown block stays as an empty grid cell.
 *
 * @param layout the layout
 * @param slots the standard slots of the model
 */
export function statusBlockVisible(layout: DeviceLayout, slots: readonly Entity6[]): boolean {
    return DEVICE_SLOT_KINDS[layout].some((kind, i) => {
        const slot = slots[i];
        return kind === 'status' && slot !== undefined && !isEmptySlot(slot);
    });
}

/**
 * The builder of a hardware model: the page of its table, with the replacements of `withStatusBlock`
 * while the status block is shown.
 *
 * @param table the three pages of the model
 */
export function fromTable(table: DeviceGeometryTable): DeviceGeometryBuilder {
    return (layout, slots) => {
        const page = table[layout];
        const narrow = page.withStatusBlock;
        if (!narrow || !statusBlockVisible(layout, slots)) {
            return page;
        }
        return { ...page, slots: page.slots.map((g, i) => narrow[i] ?? g) };
    };
}

function shiftBox(b: Box, dx: number): Box {
    return { ...b, x: b.x + dx };
}

function shiftSlot(slot: SlotGeometry, dx: number): SlotGeometry {
    switch (slot.kind) {
        case 'info':
        case 'value':
            return {
                ...slot,
                icon: shiftBox(slot.icon, dx),
                name: shiftBox(slot.name, dx),
                value: shiftBox(slot.value, dx),
            };
        case 'progress':
            return { ...slot, name: shiftBox(slot.name, dx), bar: shiftBox(slot.bar, dx) };
        case 'button':
            return { ...slot, icon: shiftBox(slot.icon, dx), name: shiftBox(slot.name, dx) };
        case 'switch':
            return {
                ...slot,
                icon: shiftBox(slot.icon, dx),
                name: shiftBox(slot.name, dx),
                toggle: shiftBox(slot.toggle, dx),
            };
        case 'status':
            return { ...slot, cell: shiftBox(slot.cell, dx) };
    }
}

function shiftPage(page: DevicePageTable, dx: number): DevicePageTable {
    const narrow: Record<number, SlotGeometry> = {};
    for (const [index, slot] of Object.entries(page.withStatusBlock ?? {})) {
        narrow[Number(index)] = shiftSlot(slot, dx);
    }
    return {
        main: { icon: shiftBox(page.main.icon, dx), name: shiftBox(page.main.name, dx) },
        slots: page.slots.map(s => shiftSlot(s, dx)),
        extras: page.extras.map(s => (s ? shiftSlot(s, dx) : undefined)),
        status: shiftBox(page.status, dx),
        statusAlign: page.statusAlign,
        info: shiftBox(page.info, dx),
        ...(page.withStatusBlock ? { withStatusBlock: narrow } : {}),
    };
}

/**
 * A table with every box moved horizontally.
 *
 * @param table the table
 * @param dx pixels to the right
 */
export function shiftTable(table: DeviceGeometryTable, dx: number): DeviceGeometryTable {
    return { 1: shiftPage(table[1], dx), 2: shiftPage(table[2], dx), 3: shiftPage(table[3], dx) };
}

/**
 * The boxes of a slot, e.g. for its touch area or a check of the layout.
 *
 * @param slot the slot
 */
export function slotBoxes(slot: SlotGeometry): Box[] {
    switch (slot.kind) {
        case 'info':
        case 'value':
            return [slot.icon, slot.name, slot.value];
        case 'progress':
            return [slot.name, slot.bar];
        case 'button':
            return [slot.icon, slot.name];
        case 'switch':
            return [slot.icon, slot.name, slot.toggle];
        case 'status':
            return [slot.cell];
    }
}
