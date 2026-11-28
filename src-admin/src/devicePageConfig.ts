import {
    DEVICE_PAGE_EXTRA_SLOTS,
    DEVICE_PAGE_LAYOUTS,
    DEVICE_PAGE_SLOT_LOOK_FIELDS,
    DEVICE_PAGE_STAGE_CAPACITY,
    DEVICE_PAGE_STATUS_SLOTS_MAX,
    defaultDevicePageConfig,
    devicePageSlotHiddenByStage,
    devicePageStageOf,
    devicePageStatusCapacity,
    isDevicePageStatusStage,
    type DevicePageStatusStage,
    deviceDetailEntryOfState,
    deviceDetailMaskOf,
    devicePageConfigOf,
    devicePageConfigSlotKinds,
    devicePageSlotAccepts,
    devicePageSlotAcceptsChannel,
    devicePageSlotAcceptsNavigation,
    devicePageChannelItemFieldsOf,
    devicePageSlotLookOf,
    devicePageSlotTakesLongPress,
    devicePageSlotTakesNavigation,
    devicePageSlotTakesTextSize,
    devicePageSlotTargetOf,
    deviceShortPressOf,
    fitDevicePageSlots,
    type DeviceDetailsConfig,
    type DevicePageConfig,
    type DevicePageLayout,
    type DevicePageSlotKind,
    type DevicePageSlotLook,
    type DevicePageSlotRef,
    type DevicePageStateRef,
    type DevicePageStatusRef,
    type DeviceShortPress,
    type DeviceStateInfo,
} from '../../src/lib/types/deviceDetails';
import {
    emptyChannelValueConfig,
    isHmiTextSize,
    isIconColorScaleElement,
    screensaverTargetPage,
    type AdminPageItemConfig,
} from '../../src/lib/types/adminShareConfig';
import { switchOption, type OptionStash } from './itemOptionStash';

/**
 * The device page of a device item in the page item dialog (doc/ideas/device-details/README.md, section Geräteseite):
 * what a long press opens, the choice of the layout, the slots and the status line. Pure functions, the dialog
 * (ChannelConfigDialog / DeviceDetailsSection / DevicePageSection) only shows them.
 */

/** what a long press on a device item opens */
export type LongPressTarget = 'details' | 'devicePage';

/**
 * @param value a value of the radio group
 * @returns true for a target of the long press
 */
export function isLongPressTarget(value: string): value is LongPressTarget {
    return value === 'details' || value === 'devicePage';
}

/**
 * @param device the device configuration of the item
 * @returns what its long press opens: the device page when it has one, else the detail page
 */
export function longPressTargetOf(device: Pick<DeviceDetailsConfig, 'devicePage'>): LongPressTarget {
    return device.devicePage ? 'devicePage' : 'details';
}

/** the kept device page of the option not chosen right now (itemOptionStash) */
export type LongPressStash = OptionStash<LongPressTarget, DevicePageConfig | undefined>;

/**
 * Switches what the long press opens. The device page left is kept in the stash and comes back with the option; a
 * device page chosen for the first time is the suggestion of {@link defaultDevicePageConfig} from the ticked rows.
 *
 * @param device the device configuration of the item
 * @param stash the kept device page
 * @param to the new target
 * @returns the device configuration (`devicePage` only with the device page) and the new stash
 */
export function switchLongPressTarget(
    device: DeviceDetailsConfig,
    stash: LongPressStash,
    to: LongPressTarget,
): { device: DeviceDetailsConfig; stash: LongPressStash } {
    const from = longPressTargetOf(device);
    if (from === to) {
        return { device, stash };
    }
    const switched = switchOption(stash, from, device.devicePage, to, target =>
        target === 'devicePage' ? defaultDevicePageConfig(device.entries) : undefined,
    );
    const { devicePage: _left, ...rest } = device;
    return {
        device: switched.fields ? { ...rest, devicePage: switched.fields } : rest,
        stash: switched.stash,
    };
}

/**
 * The device page as it is saved: normalized ({@link devicePageConfigOf}), only with the device page as target.
 *
 * @param device the device configuration of the item
 * @returns the device page to save, undefined = the long press opens the detail page
 */
export function devicePageToSave(device: Pick<DeviceDetailsConfig, 'devicePage'>): DevicePageConfig | undefined {
    return device.devicePage ? devicePageConfigOf(device.devicePage) : undefined;
}

/**
 * Another layout: the slots stay by position ({@link fitDevicePageSlots}) - the slots of the layout among
 * themselves, the extra slots among themselves -, nothing is guessed.
 *
 * @param config the device page
 * @param layout the new layout
 * @returns the device page with the layout
 */
export function withDevicePageLayout(config: DevicePageConfig, layout: DevicePageLayout): DevicePageConfig {
    if (config.layout === layout) {
        return config;
    }
    return { ...config, layout, slots: fitDevicePageSlots(config.slots, layout, config.layout) };
}

/**
 * Switches the extra slots of the web panels (models web-l / web-p) on or off. The extra slots already filled stay
 * stored while they are off - they are only not shown, not sent and not edited.
 *
 * @param config the device page
 * @param on true = the extra slots are used
 * @returns the device page with the choice
 */
export function withDevicePageWebExtras(config: DevicePageConfig, on: boolean): DevicePageConfig {
    const { webExtras: _old, ...rest } = config;
    return on ? { ...rest, webExtras: true } : rest;
}

/** an extra slot the admin shows: where it stands in the slots of the device page and what it is */
export interface DevicePageExtraSlot {
    /** index in {@link DevicePageConfig.slots} (behind the slots of the layout) */
    index: number;
    kind: DevicePageSlotKind;
}

/**
 * @param config the device page
 * @returns the extra slots of its layout to show and edit - none while they are switched off
 */
export function devicePageExtraSlots(config: Pick<DevicePageConfig, 'layout' | 'webExtras'>): DevicePageExtraSlot[] {
    if (!config.webExtras) {
        return [];
    }
    const first = DEVICE_PAGE_LAYOUTS[config.layout].length;
    return DEVICE_PAGE_EXTRA_SLOTS[config.layout].map((kind, extra) => ({ index: first + extra, kind }));
}

/**
 * What the short tap of a device item is saved as: `devicePage` (the tap opens the device page) needs a device page -
 * without one it is `none`.
 *
 * @param device the device configuration of the item
 * @returns the short tap to save
 */
export function shortPressToSave(device: Pick<DeviceDetailsConfig, 'shortPress' | 'devicePage'>): DeviceShortPress {
    const shortPress = deviceShortPressOf(device);
    return shortPress === 'devicePage' && !device.devicePage ? 'none' : shortPress;
}

/**
 * @param from a slot
 * @returns its own settings as they are stored (own look, color scale, font of the icon, long press, own name, the
 * navigation of the short tap, the older status icon) - not the fields of a channel item, they belong to its role
 */
function slotSettingsOf(from: DevicePageSlotRef): Partial<DevicePageSlotRef> {
    const out: Partial<DevicePageSlotRef> = {};
    if (from.isNavigation && from.custom !== 'navigation') {
        out.isNavigation = true;
    }
    if (from.targetPage) {
        out.targetPage = from.targetPage;
    }
    for (const field of DEVICE_PAGE_SLOT_LOOK_FIELDS) {
        if (from[field]) {
            out[field] = from[field];
        }
    }
    if (from.scale) {
        out.scale = from.scale;
    }
    if (from.textSize !== undefined) {
        out.textSize = from.textSize;
    }
    if (from.icon) {
        out.icon = from.icon;
    }
    return out;
}

/**
 * @param config the device page
 * @param index index of the slot (0 = slot 1; the extra slots follow the slots of the layout)
 * @param ref what the slot shows, null = empty
 * @returns the device page with the slot; the own settings of the slot (icons, colors, color scale, long press, name) stay
 * when something else is chosen for it, an emptied slot loses them
 */
export function withDevicePageSlot(
    config: DevicePageConfig,
    index: number,
    ref: DevicePageSlotRef | null,
): DevicePageConfig {
    // every slot the layout can hold, the extra slots included (they are stored only while one of them is filled)
    const slots = devicePageConfigSlotKinds(config.layout).map((_kind, i) => config.slots[i] ?? null);
    if (index < 0 || index >= slots.length) {
        return config;
    }
    slots[index] = slotWithChoice(slots[index], ref);
    // the older own icon only on a status slot; the extra slots only while one of them is filled
    return { ...config, slots: fitDevicePageSlots(slots, config.layout, config.layout) };
}

/**
 * @param before what the slot showed, null = empty
 * @param ref what the slot shows now, null = empty
 * @returns the slot: the own settings of before stay with something chosen, an emptied slot loses them
 */
function slotWithChoice(
    before: DevicePageSlotRef | null | undefined,
    ref: DevicePageSlotRef | null,
): DevicePageSlotRef | null {
    const next: DevicePageSlotRef | null = ref ? { ...(before ? slotSettingsOf(before) : {}), ...ref } : null;
    if (next?.custom === 'navigation') {
        // a navigation slot always navigates: no choice of the short tap
        delete next.isNavigation;
    }
    return next;
}

/**
 * The own settings of a slot (dialog "settings of the element"); an empty slot stays as it is. They replace all
 * settings of the slot - also the older icon of a status slot, which the dialog shows as icon for both states.
 *
 * @param config the device page
 * @param index index of the slot (0 = slot 1)
 * @param look the settings, empty fields = not set
 * @returns the device page with the settings
 */
export function withDevicePageSlotLook(
    config: DevicePageConfig,
    index: number,
    look: DevicePageSlotLook,
): DevicePageConfig {
    const slot = config.slots[index];
    if (!slot) {
        return config;
    }
    const slots = [...config.slots];
    slots[index] = slotWithLook(slot, look);
    return { ...config, slots };
}

/**
 * @param slot a filled slot
 * @param look the own settings, empty fields = not set
 * @returns the slot with the settings instead of its own ones
 */
function slotWithLook(slot: DevicePageSlotRef, look: DevicePageSlotLook): DevicePageSlotRef {
    const next: DevicePageSlotRef = { key: slot.key, id: slot.id };
    if (slot.subName) {
        next.subName = slot.subName;
    }
    if (slot.custom) {
        next.custom = slot.custom;
    }
    if (slot.custom === 'navigation') {
        // the target of a navigation slot is edited at the slot, not in the dialog
        if (slot.targetPage) {
            next.targetPage = slot.targetPage;
        }
    } else if (look.isNavigation) {
        // the choice stays also without target page (nothing chosen yet)
        next.isNavigation = true;
        const targetPage = look.targetPage?.trim();
        if (targetPage) {
            next.targetPage = targetPage;
        }
    }
    for (const field of DEVICE_PAGE_SLOT_LOOK_FIELDS) {
        const text = look[field]?.trim();
        if (text) {
            next[field] = text;
        }
    }
    if (look.scale) {
        next.scale = look.scale;
    }
    if (look.textSize !== undefined) {
        next.textSize = look.textSize;
    }
    return next.custom === 'channel' ? { ...next, ...devicePageChannelItemFieldsOf(look) } : next;
}

/** what the page item dialog offers for a slot of the device page (ChannelConfigDialog, slot mode) */
export interface DevicePageSlotItemOptions {
    /** number and kind of the slot, for the title */
    title: string;
    /** what the slot shows: a state (of the device or an own data point), an alias channel or a navigation */
    source: 'state' | 'channel' | 'navigation';
    /** the short tap can navigate ({@link devicePageSlotTakesNavigation}) - never for a navigation slot */
    tap: boolean;
    /** the slot takes a long press action ({@link devicePageSlotTakesLongPress}) */
    longPress: boolean;
    /** the font of the icon can be set ({@link devicePageSlotTakesTextSize}) */
    textSize: boolean;
    /**
     * the value text instead of the icon (`useValue`, `useValueConditions` by the role): only an alias channel in a
     * `button` or `switch` slot - in the other slots the device page shows the icon of a text item, not its value
     * (devicePageChannelSlotItem), a state slot builds no value text in the icon at all
     */
    iconText: boolean;
}

/**
 * What the page item dialog offers for a slot that shows a name (not a `status` slot - it keeps its small dialog).
 *
 * @param kind the kind of the slot
 * @param slot the slot
 * @param role common.role of the channel of a channel slot
 * @param title number and kind of the slot
 * @returns the options
 */
export function devicePageSlotItemOptions(
    kind: DevicePageSlotKind,
    slot: DevicePageSlotRef,
    role: string | null | undefined,
    title: string,
): DevicePageSlotItemOptions {
    const source = slot.custom === 'channel' ? 'channel' : slot.custom === 'navigation' ? 'navigation' : 'state';
    return {
        title,
        source,
        tap: source !== 'navigation' && devicePageSlotTakesNavigation(slot, role),
        longPress: source !== 'navigation' && devicePageSlotTakesLongPress(kind, slot, role),
        textSize: devicePageSlotTakesTextSize(kind),
        iconText: source === 'channel' && (kind === 'button' || kind === 'switch'),
    };
}

/**
 * The page item the dialog opens a slot with: its settings in the fields of a page item; the channel of a channel
 * slot (the dialog reads its role and hides its selection), no channel for a state or navigation slot.
 *
 * @param slot the slot
 * @returns the page item for ChannelConfigDialog.openWith
 */
export function devicePageSlotDialogItem(slot: DevicePageSlotRef): AdminPageItemConfig {
    return {
        channelId: emptyChannelValueConfig(slot.custom === 'channel' ? slot.id : ''),
        ...devicePageSlotLookOf(slot),
    };
}

/**
 * @param item the page item the dialog saved for a slot
 * @returns its settings as slot look: empty texts left out, colors / icons / name trimmed by
 * {@link withDevicePageSlotLook}; the fields of a channel item ({@link devicePageChannelItemFieldsOf}) are kept only by
 * a channel slot
 */
export function devicePageSlotLookOfItem(item: AdminPageItemConfig): DevicePageSlotLook {
    const look: DevicePageSlotLook = devicePageChannelItemFieldsOf(item);
    for (const field of ['name', 'trueIcon', 'falseIcon', 'trueColor', 'falseColor'] as const) {
        const text = item[field]?.trim();
        if (text) {
            look[field] = text;
        }
    }
    if (item.longPress) {
        look.longPress = item.longPress;
    }
    if (isIconColorScaleElement(item.scale)) {
        look.scale = item.scale;
    }
    if (isHmiTextSize(item.textSize)) {
        look.textSize = item.textSize;
    }
    if (item.isNavigation) {
        look.isNavigation = true;
        if (item.targetPage) {
            look.targetPage = item.targetPage;
        }
    }
    return look;
}

/** value of the entry "user defined" in the selection of a slot and of the status line - no id of a state */
export const DEVICE_PAGE_CUSTOM = '__custom__';

/**
 * @param slot a slot
 * @returns the value of its selection: '' = empty, {@link DEVICE_PAGE_CUSTOM} = user defined, else the id of the
 * state of the device
 */
export function devicePageSlotSelectValue(slot: DevicePageSlotRef | null | undefined): string {
    if (!slot) {
        return '';
    }
    return slot.custom ? DEVICE_PAGE_CUSTOM : slot.id;
}

/** what a user defined slot shows: an own data point, an alias channel or nothing but a navigation */
export type DevicePageCustomSource = 'state' | 'channel' | 'navigation';

/**
 * @param value a value of the radio group of a user defined slot
 * @returns true for a source of a user defined slot
 */
export function isDevicePageCustomSource(value: string): value is DevicePageCustomSource {
    return value === 'state' || value === 'channel' || value === 'navigation';
}

/**
 * @param kind the kind of a slot
 * @param current what the slot shows now
 * @returns the sources a user defined slot of this kind offers: data point and channel always, the navigation where
 * icon and name are enough ({@link devicePageSlotAcceptsNavigation}) - a saved navigation stays offered (marked)
 */
export function devicePageCustomSources(
    kind: DevicePageSlotKind,
    current: DevicePageSlotRef | null | undefined,
): DevicePageCustomSource[] {
    const sources: DevicePageCustomSource[] = ['state', 'channel'];
    if (devicePageSlotAcceptsNavigation(kind) || current?.custom === 'navigation') {
        sources.push('navigation');
    }
    return sources;
}

/**
 * A user defined slot: an own data point, an alias channel or a navigation (no state, its id is always ''). The id
 * may be '' (nothing entered yet).
 *
 * @param source data point, alias channel or navigation
 * @param id the id
 * @returns the slot
 */
export function customDevicePageSlot(source: DevicePageCustomSource, id: string): DevicePageSlotRef {
    return { key: '', id: source === 'navigation' ? '' : id, custom: source };
}

/**
 * Target page of a navigation slot (`custom: 'navigation'`); another slot stays as it is. Its text is set in the
 * settings of the element like the name of every other slot ({@link withDevicePageSlotLook}).
 *
 * @param config the device page
 * @param index index of the slot (0 = slot 1)
 * @param targetPage name of the target page, '' = none
 * @returns the device page with the change
 */
export function withDevicePageSlotNavigation(
    config: DevicePageConfig,
    index: number,
    targetPage: string,
): DevicePageConfig {
    const slot = config.slots[index];
    const next = slot ? slotWithTarget(slot, targetPage) : null;
    if (!next) {
        return config;
    }
    const slots = [...config.slots];
    slots[index] = next;
    return { ...config, slots };
}

/**
 * @param slot a slot
 * @param targetPage name of the target page, '' = none
 * @returns the navigation slot with the target page, null = nothing to change (no navigation slot or the same page -
 * the selection reports its value again when it is shown)
 */
function slotWithTarget(slot: DevicePageSlotRef, targetPage: string): DevicePageSlotRef | null {
    if (slot.custom !== 'navigation' || targetPage === (slot.targetPage ?? '')) {
        return null;
    }
    const next: DevicePageSlotRef = { ...slot };
    if (targetPage) {
        next.targetPage = targetPage;
    } else {
        delete next.targetPage;
    }
    return next;
}

/**
 * Whether the target page of a slot is to be marked: a page that is not among the pages that can be chosen. Nothing
 * is marked without target, for the screensaver, for the page the item lies on or while the pages are not known.
 *
 * @param slot the slot
 * @param pages the pages that can be chosen, null = not known (being read)
 * @param currentPage the page the item lies on (not among the pages offered)
 * @returns true when the target page is unknown
 */
export function devicePageTargetProblem(
    slot: DevicePageSlotRef | null | undefined,
    pages: readonly string[] | null,
    currentPage?: string,
): boolean {
    const target = devicePageSlotTargetOf(slot);
    if (!target || target === screensaverTargetPage || target === currentPage || !pages || pages.length === 0) {
        return false;
    }
    return !pages.includes(target);
}

/**
 * The slot after a choice in its selection: "user defined" keeps what was entered before (else an own data point
 * without id), a state of the device is saved like before ({@link devicePageRefOf}) - the id of a user defined slot
 * is not taken over.
 *
 * @param value the chosen value ({@link devicePageSlotSelectValue})
 * @param options the states of the device offered ({@link devicePageStateOptions})
 * @param entries the ticked rows of the item
 * @param current the saved slot
 * @returns the slot, null = empty
 */
export function devicePageSlotOf(
    value: string,
    options: readonly DevicePageStateOption[],
    entries: readonly DevicePageStateRef[],
    current: DevicePageSlotRef | null | undefined,
): DevicePageSlotRef | null {
    if (value === DEVICE_PAGE_CUSTOM) {
        if (current?.custom === 'navigation') {
            // target and text belong to the navigation slot
            return { ...current };
        }
        return current?.custom ? customDevicePageSlot(current.custom, current.id) : customDevicePageSlot('state', '');
    }
    return devicePageRefOf(value, options, entries, current?.custom ? null : current);
}

/** what the admin knows of the object behind a user defined slot */
export interface DevicePageCustomObject {
    /** type of the object */
    type: string;
    /** common.role */
    role?: string;
    /** common.type of a state */
    valueType?: string;
    read?: boolean;
    write?: boolean;
}

/**
 * Why a user defined slot is marked: the data point / channel does not exist (or is no state), or it does not fit
 * the kind of the slot ({@link devicePageSlotAccepts} / {@link devicePageSlotAcceptsChannel}). Nothing is marked
 * while nothing is entered or the object is not read yet.
 *
 * @param kind the kind of the slot
 * @param slot the slot
 * @param object the object of its id: null = it does not exist, undefined = not read yet
 * @returns the problem, undefined = none
 */
export function devicePageCustomProblem(
    kind: DevicePageSlotKind,
    slot: DevicePageSlotRef | null | undefined,
    object: DevicePageCustomObject | null | undefined,
): DevicePageStateProblem | undefined {
    if (slot?.custom === 'navigation') {
        // no object: it only has to fit the kind of the slot
        return devicePageSlotAcceptsNavigation(kind) ? undefined : 'unfit';
    }
    if (!slot?.custom || slot.id === '' || object === undefined) {
        return undefined;
    }
    if (object === null) {
        return 'missing';
    }
    if (slot.custom === 'channel') {
        return devicePageSlotAcceptsChannel(kind, object.role) ? undefined : 'unfit';
    }
    if (object.type !== 'state') {
        return 'missing';
    }
    return devicePageSlotAccepts(kind, { type: object.valueType, read: object.read, write: object.write })
        ? undefined
        : 'unfit';
}

/**
 * @param slot a slot
 * @returns the settings the dialog "settings of the element" starts with (the older status icon as icon for both
 * states)
 */
export function devicePageSlotDialogValue(slot: DevicePageSlotRef): DevicePageSlotLook {
    return devicePageSlotLookOf(slot);
}

/** an area of the schematic preview in display pixels (480 x 320, doc/ideas/device-details/device-page-hmi.md) */
export interface DevicePagePreviewArea {
    x: number;
    y: number;
    w: number;
    h: number;
    /** slot number (1 ...), 0 = main icon, -1 = status line, -2 = "i", -3 = a cell of the status icon grid */
    slot: number;
    /** with {@link PREVIEW_STATUS_CELL}: index of the status icon place (0 = place 1) */
    cell?: number;
}

/** main icon in {@link DevicePagePreviewArea.slot} */
export const PREVIEW_MAIN = 0;
/** status line in {@link DevicePagePreviewArea.slot} */
export const PREVIEW_STATUS_LINE = -1;
/** "i" icon in {@link DevicePagePreviewArea.slot} */
export const PREVIEW_INFO = -2;
/** a cell of the status icon grid in {@link DevicePagePreviewArea.slot} ({@link DevicePagePreviewArea.cell}) */
export const PREVIEW_STATUS_CELL = -3;

/**
 * the status icon grid per layout (EU, doc/ideas/device-details/device-page-geometry.next.json): cells of w 38 at a
 * distance of 37 (1 px overlap), cardDevice1 2 rows of h 45 at y 71 / 115 from x 124, cardDevice3 1 row of h 52 at
 * y 67 from x 114; filled column by column (top, bottom, next column). cardDevice2 has none.
 */
const STATUS_GRID: Readonly<Record<DevicePageLayout, { x: number; y: number; w: number; h: number; rows: number }>> = {
    1: { x: 124, y: 71, w: 38, h: 45, rows: 2 },
    2: { x: 0, y: 0, w: 0, h: 0, rows: 1 },
    3: { x: 114, y: 67, w: 38, h: 52, rows: 1 },
};

/**
 * the info rows of layout 1 per stage (EU): x of the icon, the row reaches to x 440; null = no info rows. Stage 0 the
 * wide rows (set A), stage 1 set B (behind 3 columns), stage 2 set C (behind 5 columns), stage 3 none.
 */
const LAYOUT1_INFO_ROW_X: Readonly<Record<DevicePageStatusStage, number | null>> = {
    0: 126,
    1: 247,
    2: 321,
    3: null,
};

/**
 * @param layout the layout
 * @param stage the stage the layout shows ({@link devicePageStageOf})
 * @returns the cells of the status icon grid of the stage: as many as the stage holds, column by column
 */
function statusGridAreas(layout: DevicePageLayout, stage: DevicePageStatusStage): DevicePagePreviewArea[] {
    const grid = STATUS_GRID[layout];
    const areas: DevicePagePreviewArea[] = [];
    const capacity = devicePageStatusCapacity(layout, stage);
    for (let cell = 0; cell < capacity; cell++) {
        const column = Math.floor(cell / grid.rows);
        const row = cell % grid.rows;
        areas.push({
            x: grid.x + column * (grid.w - 1),
            y: grid.y + row * (grid.h - 1),
            w: grid.w,
            h: grid.h,
            slot: PREVIEW_STATUS_CELL,
            cell,
        });
    }
    return areas;
}

/**
 * The areas of the schematic preview of a layout in a stage of the status icon grid (geometry of the HMI pages
 * cardDevice1-3, EU; the extra slots of the web panels are not part of it): the grid in the columns of the stage, the
 * slots the stage covers left out ({@link devicePageSlotHiddenByStage}). Layout 1 shows the info rows in the form of
 * the stage (wide, set B, set C or none), layout 3 replaces tile 1 or tiles 1 and 2 by the grid.
 *
 * @param layout the layout
 * @param stage the stored stage, cut to the layout ({@link devicePageStageOf})
 * @returns the areas
 */
export function devicePagePreviewAreas(layout: DevicePageLayout, stage: unknown): DevicePagePreviewArea[] {
    const shown = devicePageStageOf(layout, stage);
    const common: DevicePagePreviewArea[] = [
        { x: 10, y: 289, w: 390, h: 30, slot: PREVIEW_STATUS_LINE },
        { x: 404, y: 288, w: 36, h: 32, slot: PREVIEW_INFO },
    ];
    let areas: DevicePagePreviewArea[];
    switch (layout) {
        case 1: {
            const rowX = LAYOUT1_INFO_ROW_X[shown];
            areas = [{ x: 10, y: 68, w: 110, h: 114, slot: PREVIEW_MAIN }];
            if (rowX !== null) {
                areas.push(
                    { x: rowX, y: 76, w: 440 - rowX, h: 34, slot: 1 },
                    { x: rowX, y: 120, w: 440 - rowX, h: 34, slot: 2 },
                );
            }
            areas.push(
                { x: 10, y: 190, w: 104, h: 80, slot: 3 },
                { x: 118, y: 190, w: 104, h: 80, slot: 4 },
                { x: 226, y: 190, w: 104, h: 80, slot: 5 },
                { x: 334, y: 190, w: 104, h: 80, slot: 6 },
            );
            break;
        }
        case 2:
            areas = [
                { x: 10, y: 67, w: 96, h: 110, slot: PREVIEW_MAIN },
                { x: 110, y: 67, w: 226, h: 110, slot: 1 },
                { x: 10, y: 179, w: 429, h: 42, slot: 2 },
                { x: 10, y: 226, w: 140, h: 51, slot: 3 },
                { x: 154, y: 226, w: 140, h: 51, slot: 4 },
                { x: 298, y: 226, w: 141, h: 51, slot: 5 },
                { x: 340, y: 67, w: 100, h: 78, slot: 6 },
            ];
            break;
        case 3: {
            const tiles: DevicePagePreviewArea[] = [
                { x: 10, y: 67, w: 100, h: 110, slot: PREVIEW_MAIN },
                { x: 114, y: 67, w: 161, h: 51, slot: 1 },
                { x: 277, y: 67, w: 161, h: 51, slot: 2 },
                { x: 114, y: 119, w: 161, h: 51, slot: 3 },
                { x: 277, y: 119, w: 161, h: 51, slot: 4 },
                { x: 114, y: 171, w: 161, h: 51, slot: 5 },
                { x: 277, y: 171, w: 161, h: 51, slot: 6 },
                { x: 10, y: 228, w: 213, h: 50, slot: 7 },
                { x: 226, y: 228, w: 213, h: 50, slot: 8 },
            ];
            areas = tiles.filter(area => area.slot < 1 || !devicePageSlotHiddenByStage(layout, shown, area.slot - 1));
            break;
        }
    }
    return [...areas, ...statusGridAreas(layout, shown), ...common];
}

/**
 * @param layout the layout
 * @returns the stages of the status icon grid the layout offers (index of {@link DEVICE_PAGE_STAGE_CAPACITY}),
 * cardDevice2 only 0
 */
export function devicePageStatusStages(layout: DevicePageLayout): DevicePageStatusStage[] {
    return DEVICE_PAGE_STAGE_CAPACITY[layout].map((_capacity, stage) => stage).filter(isDevicePageStatusStage);
}

/**
 * @param config the device page
 * @returns the stage the admin shows: the stored one, cut to the highest stage of the layout - the stored value is
 * not changed by that ({@link devicePageStageOf})
 */
export function devicePageShownStage(config: Pick<DevicePageConfig, 'layout' | 'statusStage'>): DevicePageStatusStage {
    return devicePageStageOf(config.layout, config.statusStage);
}

/**
 * The stage of the status icon grid as chosen, 0 is left out. The status icon places and the slots the stage covers
 * stay as they are.
 *
 * @param config the device page
 * @param stage the chosen stage
 * @returns the device page with the stage
 */
export function withDevicePageStatusStage(config: DevicePageConfig, stage: DevicePageStatusStage): DevicePageConfig {
    const { statusStage: _old, ...rest } = config;
    return stage > 0 ? { ...rest, statusStage: stage } : rest;
}

/**
 * @param config the device page
 * @returns the slots of the layout the admin shows (index, 0 = slot 1): without those the shown stage covers - they
 * stay stored
 */
export function devicePageVisibleSlotIndexes(config: Pick<DevicePageConfig, 'layout' | 'statusStage'>): number[] {
    const stage = devicePageShownStage(config);
    return DEVICE_PAGE_LAYOUTS[config.layout]
        .map((_kind, index) => index)
        .filter(index => !devicePageSlotHiddenByStage(config.layout, stage, index));
}

/**
 * @param config the device page
 * @returns the number of status icon places the admin shows: as many as the shown stage holds - the places beyond
 * stay stored
 */
export function devicePageStatusPlaceCount(config: Pick<DevicePageConfig, 'layout' | 'statusStage'>): number {
    return devicePageStatusCapacity(config.layout, devicePageShownStage(config));
}

/**
 * @param config the device page
 * @param statusSlots the status icon places
 * @returns the device page with the places, empty places at the end left out, no list without a filled place
 */
function withStatusSlots(config: DevicePageConfig, statusSlots: (DevicePageSlotRef | null)[]): DevicePageConfig {
    const places = statusSlots.slice(0, DEVICE_PAGE_STATUS_SLOTS_MAX);
    while (places.length > 0 && places[places.length - 1] === null) {
        places.pop();
    }
    const { statusSlots: _old, ...rest } = config;
    return places.length > 0 ? { ...rest, statusSlots: places } : rest;
}

/**
 * @param config the device page
 * @param index index of the status icon place (0 = place 1)
 * @param ref what the place shows, null = empty
 * @returns the device page with the place; its own settings stay when something else is chosen for it, an emptied
 * place loses them (like {@link withDevicePageSlot})
 */
export function withDevicePageStatusSlot(
    config: DevicePageConfig,
    index: number,
    ref: DevicePageSlotRef | null,
): DevicePageConfig {
    if (index < 0 || index >= DEVICE_PAGE_STATUS_SLOTS_MAX) {
        return config;
    }
    const stored = config.statusSlots ?? [];
    const places = Array.from({ length: Math.max(index + 1, stored.length) }, (_v, i) =>
        i === index ? slotWithChoice(stored[i] ?? null, ref) : (stored[i] ?? null),
    );
    return withStatusSlots(config, places);
}

/**
 * The own settings of a status icon place (dialog "settings of the element", like {@link withDevicePageSlotLook}); an
 * empty place stays as it is.
 *
 * @param config the device page
 * @param index index of the place (0 = place 1)
 * @param look the settings, empty fields = not set
 * @returns the device page with the settings
 */
export function withDevicePageStatusSlotLook(
    config: DevicePageConfig,
    index: number,
    look: DevicePageSlotLook,
): DevicePageConfig {
    const places = [...(config.statusSlots ?? [])];
    const slot = places[index];
    if (!slot) {
        return config;
    }
    places[index] = slotWithLook(slot, look);
    return { ...config, statusSlots: places };
}

/**
 * Target page of a status icon place that is a navigation (like {@link withDevicePageSlotNavigation}).
 *
 * @param config the device page
 * @param index index of the place (0 = place 1)
 * @param targetPage name of the target page, '' = none
 * @returns the device page with the change
 */
export function withDevicePageStatusSlotNavigation(
    config: DevicePageConfig,
    index: number,
    targetPage: string,
): DevicePageConfig {
    const places = [...(config.statusSlots ?? [])];
    const slot = places[index];
    const next = slot ? slotWithTarget(slot, targetPage) : null;
    if (!next) {
        return config;
    }
    places[index] = next;
    return { ...config, statusSlots: places };
}

/**
 * @param config the device page
 * @param ref the state of the status line, null = none
 * @returns the device page with the status line
 */
export function withDevicePageStatus(config: DevicePageConfig, ref: DevicePageStatusRef | null): DevicePageConfig {
    const { status: _old, ...rest } = config;
    return ref ? { ...rest, status: { ...ref } } : rest;
}

/** value of the entry "own data point" in the selection of the status line - no id of a state */
export const DEVICE_PAGE_CUSTOM_STATUS = DEVICE_PAGE_CUSTOM;

/**
 * @param status the saved status line
 * @returns true when it is an own data point of the user (also one without id yet)
 */
export function isCustomDevicePageStatus(status: DevicePageStatusRef | null | undefined): boolean {
    return status?.custom === true;
}

/**
 * @param id the id of the own data point, '' = not entered yet
 * @returns the status line with an own data point
 */
export function customDevicePageStatus(id: string): DevicePageStatusRef {
    return { key: '', id, custom: true };
}

/**
 * @param status the saved status line
 * @returns the value of the selection: '' = empty, {@link DEVICE_PAGE_CUSTOM_STATUS} = own data point, else the id of
 * the state of the device
 */
export function devicePageStatusSelectValue(status: DevicePageStatusRef | null | undefined): string {
    if (!status) {
        return '';
    }
    return isCustomDevicePageStatus(status) ? DEVICE_PAGE_CUSTOM_STATUS : status.id;
}

/**
 * The status line after a choice in the selection: "own data point" keeps the id entered before (else ''), a state
 * of the device is saved like the state of a slot ({@link devicePageRefOf}) - the id of an own data point is not
 * taken over.
 *
 * @param value the chosen value of the selection ({@link devicePageStatusSelectValue})
 * @param options the states of the device offered ({@link devicePageStateOptions})
 * @param entries the ticked rows of the item
 * @param current the saved status line
 * @returns the status line, null = empty
 */
export function devicePageStatusOf(
    value: string,
    options: readonly DevicePageStateOption[],
    entries: readonly DevicePageStateRef[],
    current: DevicePageStatusRef | null | undefined,
): DevicePageStatusRef | null {
    if (value === DEVICE_PAGE_CUSTOM_STATUS) {
        return customDevicePageStatus(current && isCustomDevicePageStatus(current) ? current.id : '');
    }
    return devicePageRefOf(value, options, entries, isCustomDevicePageStatus(current) ? null : current);
}

/**
 * @param config the device page
 * @param icon MDI name of the big icon, '' = the icon of the item
 * @returns the device page with the icon
 */
export function withDevicePageIcon(config: DevicePageConfig, icon: string): DevicePageConfig {
    const { icon: _old, ...rest } = config;
    const trimmed = icon.trim();
    return trimmed ? { ...rest, icon: trimmed } : rest;
}

/** why a state chosen for a slot or the status line is marked */
export type DevicePageStateProblem =
    /** the device has no such state (any more) */
    | 'missing'
    /** the state does not fit the kind of the slot ({@link devicePageSlotAccepts}) */
    | 'unfit';

/** a state offered for a slot or the status line */
export interface DevicePageStateOption {
    /** full id of the state */
    id: string;
    /** id below the device */
    rest: string;
    /** key of the mask entry the state belongs to, '' = none (named by the state) */
    key: string;
    /** common.name of the state, '' = unknown */
    stateName: string;
    /** a saved state that is no state of the device (any more) or does not fit the slot */
    problem?: DevicePageStateProblem;
}

/**
 * @param deviceId id of the device
 * @param id id of a state
 * @returns the id below the device
 */
function restOf(deviceId: string, id: string): string {
    return deviceId && id.startsWith(`${deviceId}.`) ? id.slice(deviceId.length + 1) : id;
}

/**
 * The states a slot (or the status line) offers: the states of the device that fit the kind of the slot. The state
 * saved in it is always offered - marked when the device has no such state or it does not fit the slot, unmarked
 * while there is no answer of the adapter (states null), so a saved configuration stays as it is.
 *
 * @param deviceId id of the device
 * @param states the states of the device (answer of the adapter), null = no answer
 * @param kind the kind of the slot, null = the status line (any state)
 * @param current the state saved in the slot, null/undefined = empty
 * @returns the options in the order of the states, the saved one first when it is not among them
 */
export function devicePageStateOptions(
    deviceId: string,
    states: readonly DeviceStateInfo[] | null,
    kind: DevicePageSlotKind | null,
    current: DevicePageStateRef | null | undefined,
): DevicePageStateOption[] {
    const mask = deviceDetailMaskOf(deviceId);
    const option = (state: DeviceStateInfo, problem?: DevicePageStateProblem): DevicePageStateOption => {
        const out: DevicePageStateOption = {
            id: state.id,
            rest: restOf(deviceId, state.id),
            key: deviceDetailEntryOfState(mask, state)?.key ?? '',
            stateName: state.name,
        };
        if (problem) {
            out.problem = problem;
        }
        return out;
    };
    const fitting = (states ?? []).filter(s => kind === null || devicePageSlotAccepts(kind, s)).map(s => option(s));
    if (!current || current.id === '' || fitting.some(o => o.id === current.id)) {
        return fitting;
    }
    const known = states?.find(s => s.id === current.id);
    let saved: DevicePageStateOption;
    if (known) {
        saved = option(known, 'unfit');
    } else {
        saved = { id: current.id, rest: restOf(deviceId, current.id), key: current.key, stateName: '' };
        if (states !== null) {
            saved.problem = 'missing';
        }
    }
    return [saved, ...fitting];
}

/**
 * The reference a chosen state is saved as: the saved one when it is the same state (keeps its entry and own text),
 * the ticked row of the detail page with this state (its entry and own text), else the entry of the mask the state
 * belongs to.
 *
 * @param id the chosen state, '' = empty
 * @param options the options of the slot ({@link devicePageStateOptions})
 * @param entries the ticked rows of the item
 * @param current the state saved in the slot
 * @returns the reference, null = empty
 */
export function devicePageRefOf(
    id: string,
    options: readonly DevicePageStateOption[],
    entries: readonly DevicePageStateRef[],
    current: DevicePageStateRef | null | undefined,
): DevicePageStateRef | null {
    if (id === '') {
        return null;
    }
    if (current?.id === id) {
        return { ...current };
    }
    const entry = entries.find(e => e.id === id);
    if (entry) {
        return entry.subName ? { key: entry.key, id, subName: entry.subName } : { key: entry.key, id };
    }
    return { key: options.find(o => o.id === id)?.key ?? '', id };
}
