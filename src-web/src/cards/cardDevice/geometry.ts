import type { Entity6 } from '../../protocol/types';
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
    /**
     * `txt_maxl` of a component that gets its text as a copy of another one (the info rows of the sets B and C of
     * cardDevice1): the HMI cuts the text to these bytes when it copies it. Missing: the text as it is sent.
     */
    maxBytes?: number;
}

/** The kind of element a slot of a device page shows */
export type DeviceSlotKind = 'info' | 'value' | 'progress' | 'button' | 'switch';

/** icon (font 1) + name + value (font 0, right aligned); set C of cardDevice1 has no name */
export interface InfoSlotGeometry {
    kind: 'info';
    icon: Box;
    name?: Box;
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

export type SlotGeometry =
    InfoSlotGeometry | ValueSlotGeometry | ProgressSlotGeometry | ButtonSlotGeometry | SwitchSlotGeometry;

export type DeviceLayout = 1 | 2 | 3;

/**
 * The stage of the status icon grid (field 6 of info, TFT device13): cardDevice1 0-3, cardDevice3 0-2,
 * cardDevice2 always 0 ({@link DEVICE_STAGE_COLUMNS})
 */
export type DeviceStage = 0 | 1 | 2 | 3;

/** The geometry of one device page (cardDevice1/2/3) on one model in one stage, for the slots that are filled */
export interface DeviceGeometry {
    /** the big icon (font 4) and the name below it */
    main: { icon: Box; name: Box };
    /**
     * the standard slots in protocol order (cardDevice1: 6, cardDevice2: 6, cardDevice3: 8); `undefined`: the
     * status icon grid of the stage covers the slot ({@link DEVICE_STAGE_HIDDEN_SLOTS}), it is not shown
     */
    slots: readonly (SlotGeometry | undefined)[];
    /**
     * the additional slots of the web models in protocol order ({@link DEVICE_EXTRA_KINDS}); empty on the
     * hardware models. `undefined`: the page has no place for this one at the moment (it is empty and the row
     * is laid out without it).
     */
    extras: readonly (SlotGeometry | undefined)[];
    /**
     * the cells of the status icon grid in the order of `devIcons` - column by column, the top cell first:
     * cardDevice1 8 x 2, cardDevice3 8 x 1, none on cardDevice2. Neighbouring cells share their 1 px frame.
     */
    grid: readonly Box[];
    /** the status line (field 6 of main), font 0, one line */
    status: Box;
    statusAlign: NextionAlign;
    /** the info icon at the bottom right (font 1) */
    info: Box;
}

/**
 * One page of a geometry table of a hardware model: the fixed boxes of the HMI page. `byStage` replaces slots
 * (by index) in a stage of the status icon grid - the HMI has further sets of components for the info rows of
 * cardDevice1 (set B in stage 1, set C in stage 2).
 */
export interface DevicePageTable extends DeviceGeometry {
    slots: readonly SlotGeometry[];
    byStage?: Readonly<Partial<Record<DeviceStage, Readonly<Record<number, SlotGeometry>>>>>;
}

/** The three pages of one model as a table */
export type DeviceGeometryTable = Readonly<Record<DeviceLayout, DevicePageTable>>;

/**
 * Lays a page out for the elements it shows.
 *
 * @param layout the page
 * @param extras the additional slots of the model (empty on the hardware models)
 * @param stage the stage of the status icon grid
 */
export type DeviceGeometryBuilder = (
    layout: DeviceLayout,
    extras: readonly Entity6[],
    stage: DeviceStage,
) => DeviceGeometry;

/** The kinds of the standard slots in protocol order, the same on every model */
export const DEVICE_SLOT_KINDS: Readonly<Record<DeviceLayout, readonly DeviceSlotKind[]>> = {
    1: ['info', 'info', 'button', 'button', 'button', 'button'],
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

/** The cells of the status icon grid (`devIcons`): cardDevice1 16, cardDevice3 8, cardDevice2 none */
export const DEVICE_GRID_CELLS: Readonly<Record<DeviceLayout, number>> = { 1: 16, 2: 0, 3: 8 };

/** The rows of the status icon grid: the cells fill it column by column */
export const DEVICE_GRID_ROWS: Readonly<Record<DeviceLayout, number>> = { 1: 2, 2: 1, 3: 1 };

/**
 * The most columns of the status icon grid per stage (index = stage, the highest index is the highest stage):
 * cardDevice1 none / 3 / 5 / 8 columns of two cells, cardDevice3 none / 4 / 8 cells, cardDevice2 has no grid.
 */
export const DEVICE_STAGE_COLUMNS: Readonly<Record<DeviceLayout, readonly number[]>> = {
    1: [0, 3, 5, 8],
    2: [0],
    3: [0, 4, 8],
};

/**
 * The slots (index, 0 = slot 1) the status icon grid covers per stage (index = stage): cardDevice1 the two info
 * rows in stage 3, cardDevice3 tile 1 in stage 1 and tiles 1 and 2 in stage 2. They are not shown, whatever
 * `entityUpd` carries for them.
 */
export const DEVICE_STAGE_HIDDEN_SLOTS: Readonly<Record<DeviceLayout, readonly (readonly number[])[]>> = {
    1: [[], [], [], [0, 1]],
    2: [[]],
    3: [[], [0], [0, 1]],
};

/**
 * @param value anything
 * @returns true for a stage of the status icon grid
 */
export function isDeviceStage(value: unknown): value is DeviceStage {
    return value === 0 || value === 1 || value === 2 || value === 3;
}

/**
 * The number of a field as the HMI reads it with `covx`: the digits at its start, 0 when it starts with none
 * (empty, `-1`, any text).
 *
 * @param field the field
 */
export function hmiNumber(field: string): number {
    const digits = /^\d+/.exec(field);
    return digits ? Number.parseInt(digits[0], 10) : 0;
}

/**
 * The stage of a page: field 6 of info as a number, limited to the highest stage of the layout (cardDevice2: 0).
 *
 * @param layout the page
 * @param field field 6 of the info element
 */
export function deviceStageOf(layout: DeviceLayout, field: string): DeviceStage {
    const stage = Math.min(hmiNumber(field), DEVICE_STAGE_COLUMNS[layout].length - 1);
    return isDeviceStage(stage) ? stage : 0;
}

/** Font and alignment of a text box */
export interface BoxStyle {
    /** Nextion font id */
    font: number;
    /** `xcen` of the component: 0 left, 1 centre, 2 right */
    align: NextionAlign;
}

/**
 * Font and alignment of the text boxes of every element kind, as the HMI pages of all models have them
 * (`doc/ideas/device-details/device-page-geometry.json`); a {@link Box} with `font` / `align` overrides them.
 * The status line takes its alignment from {@link DeviceGeometry.statusAlign}.
 */
export const BOX_STYLES = {
    main: { icon: { font: 4, align: 1 }, name: { font: 0, align: 1 } },
    info: { icon: { font: 1, align: 1 }, name: { font: 0, align: 0 }, value: { font: 0, align: 2 } },
    value: { icon: { font: 1, align: 1 }, name: { font: 0, align: 0 }, value: { font: 4, align: 0 } },
    progress: { name: { font: 0, align: 0 } },
    button: { icon: { font: 3, align: 1 }, name: { font: 0, align: 1 } },
    switch: { icon: { font: 1, align: 1 }, name: { font: 0, align: 0 } },
    cell: { font: 1, align: 1 },
    statusLine: { font: 0, align: 1 },
    infoIcon: { font: 1, align: 1 },
} as const satisfies Record<string, BoxStyle | Record<string, BoxStyle>>;

/** frame colour of the cells of the status icon grid: rgb565 14823 (the grey of the pie lines on cardPChart) */
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
 * The cells of a status icon grid, column by column and the top cell first (the order of `devIcons`):
 * neighbouring cells overlap by 1 px, they share their frame.
 *
 * @param x left edge of column 1
 * @param y top edge of row 1
 * @param w width of a cell
 * @param h height of a cell
 * @param columns number of columns
 * @param rows number of rows
 */
export function gridCells(x: number, y: number, w: number, h: number, columns: number, rows: number): Box[] {
    const cells: Box[] = [];
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows; r++) {
            cells.push(box(x + c * (w - 1), y + r * (h - 1), w, h));
        }
    }
    return cells;
}

/**
 * The builder of a hardware model: the page of its table, with the replacements of `byStage` in the stage.
 *
 * @param table the three pages of the model
 */
export function fromTable(table: DeviceGeometryTable): DeviceGeometryBuilder {
    return (layout, _extras, stage) => {
        const { byStage, ...page } = table[layout];
        const own = byStage?.[stage];
        if (!own) {
            return page;
        }
        return { ...page, slots: page.slots.map((g, i) => own[i] ?? g) };
    };
}

function shiftBox(b: Box, dx: number): Box {
    return { ...b, x: b.x + dx };
}

function shiftSlot(slot: SlotGeometry, dx: number): SlotGeometry {
    switch (slot.kind) {
        case 'info':
            return {
                ...slot,
                icon: shiftBox(slot.icon, dx),
                ...(slot.name ? { name: shiftBox(slot.name, dx) } : {}),
                value: shiftBox(slot.value, dx),
            };
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
    }
}

function shiftSlots(slots: Readonly<Record<number, SlotGeometry>>, dx: number): Record<number, SlotGeometry> {
    const out: Record<number, SlotGeometry> = {};
    for (const [index, slot] of Object.entries(slots)) {
        out[Number(index)] = shiftSlot(slot, dx);
    }
    return out;
}

function shiftPage(page: DevicePageTable, dx: number): DevicePageTable {
    const byStage: Partial<Record<DeviceStage, Record<number, SlotGeometry>>> = {};
    for (const stage of [0, 1, 2, 3] as const) {
        const own = page.byStage?.[stage];
        if (own) {
            byStage[stage] = shiftSlots(own, dx);
        }
    }
    return {
        main: { icon: shiftBox(page.main.icon, dx), name: shiftBox(page.main.name, dx) },
        slots: page.slots.map(s => shiftSlot(s, dx)),
        extras: page.extras.map(s => (s ? shiftSlot(s, dx) : undefined)),
        grid: page.grid.map(b => shiftBox(b, dx)),
        status: shiftBox(page.status, dx),
        statusAlign: page.statusAlign,
        info: shiftBox(page.info, dx),
        ...(page.byStage ? { byStage } : {}),
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
            return slot.name ? [slot.icon, slot.name, slot.value] : [slot.icon, slot.value];
        case 'value':
            return [slot.icon, slot.name, slot.value];
        case 'progress':
            return [slot.name, slot.bar];
        case 'button':
            return [slot.icon, slot.name];
        case 'switch':
            return [slot.icon, slot.name, slot.toggle];
    }
}
