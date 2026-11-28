import type { ParseContext } from '../CardContract';
import { ENTITY_FIELDS, emptyEntity, field, parseEntity6, parseEntityUpdHeader, toNumber } from '../../protocol/split';
import type { Entity6, Navigation } from '../../protocol/types';
import { initialMenuPage, isEmptySlot } from '../cardEntities/shared/menuParse';
import {
    DEVICE_GRID_CELLS,
    DEVICE_GRID_ROWS,
    DEVICE_SLOT_KINDS,
    DEVICE_STAGE_COLUMNS,
    deviceExtraKinds,
    deviceLayout,
    deviceStageOf,
    hmiNumber,
    type DeviceLayout,
    type DeviceStage,
} from './layout';

/**
 * Model of a device page (cardDevice1/2/3), TFT device13:
 * `entityUpd~heading~nav left (6)~nav right (6)~main (6)~slot 1 (6)…slot N (6)~info (6)~extra 1 (6)…extra E (6)`
 *
 * Every element has the 6 fields of a cardGrid cell, its type as a number ({@link deviceTypeName}). cardDevice1 and
 * cardDevice3 carry the stage of the status icon grid in field 6 of info ({@link deviceStageOf}); the cells of the
 * grid come with `devIcons~<type>~<id>~<icon>~<color>~…` (cardDevice1 16, cardDevice3 8 cells, column by column).
 *
 * The additional slots behind the info icon are only sent to the web models (`web-l`, `web-p`):
 * cardDevice1 button, button; cardDevice2 info, button, button; cardDevice3 info, info, switch.
 *
 * `devStatus~<text>` replaces only the status line: the adapter splits a status text that does not fit the line and
 * sends its parts one after the other.
 */
export interface CardDeviceModel {
    layout: DeviceLayout;
    title: string;
    navigation: Navigation;
    /** the device itself: big icon and name */
    main: Entity6;
    /** the slots of the layout in protocol order, always as many as the layout has */
    slots: Entity6[];
    /** the info icon at the bottom right; its field 6 is the stage */
    info: Entity6;
    /**
     * the additional slots of a web model in protocol order, as many as the model has
     * ({@link deviceExtraKinds}; none on the hardware models), missing ones are empty
     */
    extras: Entity6[];
    /** the status line: field 6 of main (also when main itself is empty), replaced by `devStatus` */
    status: string;
    /** the stage of the status icon grid: field 6 of info ({@link deviceStageOf}), 0 until the first `entityUpd` */
    stage: DeviceStage;
    /**
     * the cells of the status icon grid as the last `devIcons` brought them, in its order (type, id, icon, colour;
     * cardDevice1 16, cardDevice3 8, cardDevice2 none) - empty until the first `devIcons`
     */
    icons: Entity6[];
    /**
     * the columns of the grid that are shown (`vCols` of the HMI): `devIcons` shows the columns up to the highest
     * filled cell, at most those of the stage; an `entityUpd` hides the columns beyond its stage
     */
    columns: number;
}

/** the command that replaces only the status line: `devStatus~<text>` */
export const STATUS_COMMAND = 'devStatus';

/** the command with the cells of the status icon grid: `devIcons~<type>~<id>~<icon>~<color>~…` */
export const ICONS_COMMAND = 'devIcons';

/** fields of a cell of `devIcons`: type, id, icon, colour */
const CELL_FIELDS = 4;

/**
 * The entity types the numbers of the device pages stand for (TFT device13, `device-page-hmi.md` "Typ als Zahl"):
 * 0 hidden, 1 only sends, 2-5 a popup at the touch, 6-9 a popup when held.
 */
const TYPE_NAMES: readonly string[] = [
    '',
    'text',
    'shutter',
    'shutter2',
    'input_sel',
    'timer',
    'light',
    'light2',
    'fan',
    'number',
];

/**
 * The type of an element of a device page as the name the touch code knows: the number as the HMI reads it
 * (`covx`, an empty field 0): 0 → `''` (hidden), 2-9 → shutter, shutter2, input_sel, timer, light, light2, fan,
 * number; 1 and every other number → `text` (sends, but - except in a button slot - only with an id, like the HMI).
 * A field that starts with no digit is a type name and stays as it is.
 *
 * @param type field 1 of the element
 */
export function deviceTypeName(type: string): string {
    if (type === '' || !/^\d/.test(type)) {
        return type;
    }
    return TYPE_NAMES[hmiNumber(type)] ?? 'text';
}

/**
 * An element of a device page with its type as a name ({@link deviceTypeName}).
 *
 * @param fields the fields
 * @param offset index of the type field
 */
function deviceEntity(fields: readonly string[], offset: number): Entity6 {
    const entity = parseEntity6(fields, offset);
    return { ...entity, type: deviceTypeName(entity.type) };
}

/**
 * A cell of `devIcons`: type, id, icon and colour - no name, no value.
 *
 * @param fields the fields after `devIcons`
 * @param offset index of the type field
 */
function deviceCell(fields: readonly string[], offset: number): Entity6 {
    return {
        type: deviceTypeName(field(fields, offset)),
        id: field(fields, offset + 1),
        icon: field(fields, offset + 2),
        iconColor: toNumber(fields[offset + 3], 65535),
        displayName: '',
        optionalValue: '',
    };
}

/**
 * The columns of the grid the cells fill: up to the highest filled cell (a half filled last column keeps its
 * empty cell), at most those of the stage.
 *
 * @param layout the page
 * @param icons the cells
 * @param stage the stage
 */
export function deviceGridColumns(layout: DeviceLayout, icons: readonly Entity6[], stage: DeviceStage): number {
    let highest = 0;
    icons.forEach((cell, i) => {
        if (!isEmptySlot(cell)) {
            highest = i + 1;
        }
    });
    return Math.min(Math.ceil(highest / DEVICE_GRID_ROWS[layout]), DEVICE_STAGE_COLUMNS[layout][stage] ?? 0);
}

export function initial(): CardDeviceModel {
    const menu = initialMenuPage();
    return {
        layout: 1,
        title: menu.title,
        navigation: menu.navigation,
        main: emptyEntity(),
        slots: DEVICE_SLOT_KINDS[1].map(() => emptyEntity()),
        info: emptyEntity(),
        extras: [],
        status: '',
        stage: 0,
        icons: [],
        columns: 0,
    };
}

/**
 * Parses the `entityUpd` of a device page; the number of slots follows from the pageType
 * (cardDevice1: 6, cardDevice2: 6, cardDevice3: 8), missing fields are empty. Behind the info icon a web
 * model reads its additional slots ({@link deviceExtraKinds}); a hardware model (also as a web clone) has none
 * and ignores whatever follows the info icon. The stage comes from field 6 of info; the cells of the grid stay,
 * the columns beyond the stage are hidden.
 *
 * @param args the fields after `entityUpd` (`args[0]` is the heading)
 * @param prev the model before
 * @param ctx the active pageType and the panel model (eu when missing)
 */
export function parseEntityUpd(args: string[], prev: CardDeviceModel, ctx: ParseContext): CardDeviceModel {
    const layout = deviceLayout(ctx.pageType);
    const count = DEVICE_SLOT_KINDS[layout].length;
    const extraCount = deviceExtraKinds(layout, ctx.model ?? 'eu').length;
    const header = parseEntityUpdHeader(args);
    const main = deviceEntity(header.rest, 0);
    const slots: Entity6[] = [];
    for (let k = 1; k <= count; k++) {
        slots.push(deviceEntity(header.rest, k * ENTITY_FIELDS));
    }
    const info = deviceEntity(header.rest, (count + 1) * ENTITY_FIELDS);
    const extras: Entity6[] = [];
    for (let j = 1; j <= extraCount; j++) {
        extras.push(deviceEntity(header.rest, (count + 1 + j) * ENTITY_FIELDS));
    }
    const stage = deviceStageOf(layout, info.optionalValue);
    const own = prev.layout === layout;
    return {
        layout,
        title: header.title,
        navigation: header.navigation,
        main,
        slots,
        info,
        extras,
        status: main.optionalValue,
        stage,
        icons: own ? prev.icons : [],
        columns: Math.min(own ? prev.columns : 0, DEVICE_STAGE_COLUMNS[layout][stage] ?? 0),
    };
}

/** Popups are separate pages; an `entityUpdateDetail` that arrives while the page is active is not ours */
export function parseEntityUpdateDetail(
    _args: string[],
    _prev: CardDeviceModel,
    _ctx: ParseContext,
): CardDeviceModel | undefined {
    return undefined;
}

/**
 * `devStatus~<text>`: only the status line changes, everything else of the page stays.
 * `devIcons~…`: the cells of the status icon grid of cardDevice1 / cardDevice3 and the columns they fill
 * ({@link deviceGridColumns}); cardDevice2 has no grid, the message changes nothing there.
 *
 * @param cmd the command
 * @param args the fields after the command
 * @param prev the model before
 * @param ctx the active pageType
 */
export function handleCommand(
    cmd: string,
    args: string[],
    prev: CardDeviceModel,
    ctx: ParseContext,
): CardDeviceModel | undefined {
    if (cmd === STATUS_COMMAND) {
        return { ...prev, status: args[0] ?? '' };
    }
    if (cmd !== ICONS_COMMAND) {
        return undefined;
    }
    const layout = deviceLayout(ctx.pageType);
    const count = DEVICE_GRID_CELLS[layout];
    if (count === 0) {
        return prev;
    }
    // the stage of an entityUpd of another page does not count (before the first entityUpd: stage 0, no grid)
    const stage = prev.layout === layout ? prev.stage : 0;
    const icons = Array.from({ length: count }, (_v, i) => deviceCell(args, i * CELL_FIELDS));
    return { ...prev, layout, stage, icons, columns: deviceGridColumns(layout, icons, stage) };
}
