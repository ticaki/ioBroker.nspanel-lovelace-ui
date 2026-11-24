import {
    DEVICE_PAGE_LAYOUTS,
    DEVICE_PAGE_SLOT_LOOK_FIELDS,
    defaultDevicePageConfig,
    deviceDetailEntryOfState,
    deviceDetailMaskOf,
    devicePageConfigOf,
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
 * Another layout: the slots stay by position ({@link fitDevicePageSlots}), nothing is guessed.
 *
 * @param config the device page
 * @param layout the new layout
 * @returns the device page with the layout
 */
export function withDevicePageLayout(config: DevicePageConfig, layout: DevicePageLayout): DevicePageConfig {
    if (config.layout === layout) {
        return config;
    }
    return { ...config, layout, slots: fitDevicePageSlots(config.slots, layout) };
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
 * @param index index of the slot (0 = slot 1)
 * @param ref what the slot shows, null = empty
 * @returns the device page with the slot; the own settings of the slot (icons, colors, color scale, long press, name) stay
 * when something else is chosen for it, an emptied slot loses them
 */
export function withDevicePageSlot(
    config: DevicePageConfig,
    index: number,
    ref: DevicePageSlotRef | null,
): DevicePageConfig {
    const slots = fitDevicePageSlots(config.slots, config.layout);
    if (index < 0 || index >= slots.length) {
        return config;
    }
    const before = slots[index];
    const next: DevicePageSlotRef | null = ref ? { ...(before ? slotSettingsOf(before) : {}), ...ref } : null;
    if (next?.custom === 'navigation') {
        // a navigation slot always navigates: no choice of the short tap
        delete next.isNavigation;
    }
    slots[index] = next;
    // the older own icon only on a status slot
    return { ...config, slots: fitDevicePageSlots(slots, config.layout) };
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
    const slots = [...config.slots];
    slots[index] = next.custom === 'channel' ? { ...next, ...devicePageChannelItemFieldsOf(look) } : next;
    return { ...config, slots };
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
    if (slot?.custom !== 'navigation') {
        return config;
    }
    if (targetPage === (slot.targetPage ?? '')) {
        // nothing new (the selection reports its value again when it is shown)
        return config;
    }
    const next: DevicePageSlotRef = { ...slot };
    if (targetPage) {
        next.targetPage = targetPage;
    } else {
        delete next.targetPage;
    }
    const slots = [...config.slots];
    slots[index] = next;
    return { ...config, slots };
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
    /** slot number (1 ...), 0 = main icon, -1 = status line, -2 = "i" */
    slot: number;
}

/** main icon in {@link DevicePagePreviewArea.slot} */
export const PREVIEW_MAIN = 0;
/** status line in {@link DevicePagePreviewArea.slot} */
export const PREVIEW_STATUS_LINE = -1;
/** "i" icon in {@link DevicePagePreviewArea.slot} */
export const PREVIEW_INFO = -2;

/** the status grid of layout 1: two columns of 38 px (1 px overlap), rows of 45 px (1 px overlap), at x 124 / y 71 */
const STATUS_GRID = { x: 124, y: 71, w: 38, h: 45, columns: 2 };

/**
 * The areas of the schematic preview of a layout (geometry of the HMI pages cardDevice1-3). Layout 1 with at least one
 * status slot filled: the status grid right of the main icon (2 columns, rows = number of status slots / 2, all of
 * them - an empty one stays an empty cell) and the narrow info rows; otherwise the wide rows and no grid.
 *
 * @param layout the layout
 * @param withStatusIcons at least one status slot is filled (devicePageHasStatusIcons)
 * @returns the areas
 */
export function devicePagePreviewAreas(layout: DevicePageLayout, withStatusIcons: boolean): DevicePagePreviewArea[] {
    const common: DevicePagePreviewArea[] = [
        { x: 10, y: 289, w: 390, h: 30, slot: PREVIEW_STATUS_LINE },
        { x: 404, y: 288, w: 36, h: 32, slot: PREVIEW_INFO },
    ];
    switch (layout) {
        case 1: {
            // narrow rows: icon at 204, name 86 px, value 110 px (the value stays at 330)
            const rowX = withStatusIcons ? 204 : 126;
            const areas: DevicePagePreviewArea[] = [
                { x: 10, y: 68, w: 110, h: 114, slot: PREVIEW_MAIN },
                { x: rowX, y: 76, w: 440 - rowX, h: 34, slot: 1 },
                { x: rowX, y: 120, w: 440 - rowX, h: 34, slot: 2 },
                { x: 10, y: 190, w: 104, h: 80, slot: 3 },
                { x: 118, y: 190, w: 104, h: 80, slot: 4 },
                { x: 226, y: 190, w: 104, h: 80, slot: 5 },
                { x: 334, y: 190, w: 104, h: 80, slot: 6 },
            ];
            if (withStatusIcons) {
                let cell = 0;
                DEVICE_PAGE_LAYOUTS[1].forEach((kind, index) => {
                    if (kind !== 'status') {
                        return;
                    }
                    const column = cell % STATUS_GRID.columns;
                    const row = Math.floor(cell / STATUS_GRID.columns);
                    areas.push({
                        x: STATUS_GRID.x + column * (STATUS_GRID.w - 1),
                        y: STATUS_GRID.y + row * (STATUS_GRID.h - 1),
                        w: STATUS_GRID.w,
                        h: STATUS_GRID.h,
                        slot: index + 1,
                    });
                    cell++;
                });
            }
            return [...areas, ...common];
        }
        case 2:
            return [
                { x: 10, y: 67, w: 96, h: 110, slot: PREVIEW_MAIN },
                { x: 110, y: 67, w: 226, h: 110, slot: 1 },
                { x: 10, y: 179, w: 429, h: 42, slot: 2 },
                { x: 10, y: 226, w: 140, h: 51, slot: 3 },
                { x: 154, y: 226, w: 140, h: 51, slot: 4 },
                { x: 298, y: 226, w: 141, h: 51, slot: 5 },
                { x: 340, y: 67, w: 100, h: 78, slot: 6 },
                ...common,
            ];
        case 3:
            return [
                { x: 10, y: 67, w: 100, h: 110, slot: PREVIEW_MAIN },
                { x: 114, y: 67, w: 161, h: 51, slot: 1 },
                { x: 277, y: 67, w: 161, h: 51, slot: 2 },
                { x: 114, y: 119, w: 161, h: 51, slot: 3 },
                { x: 277, y: 119, w: 161, h: 51, slot: 4 },
                { x: 114, y: 171, w: 161, h: 51, slot: 5 },
                { x: 277, y: 171, w: 161, h: 51, slot: 6 },
                { x: 10, y: 228, w: 213, h: 50, slot: 7 },
                { x: 226, y: 228, w: 213, h: 50, slot: 8 },
                ...common,
            ];
    }
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
