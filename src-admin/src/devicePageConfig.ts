import {
    DEVICE_PAGE_LAYOUTS,
    defaultDevicePageConfig,
    deviceDetailEntryOfState,
    deviceDetailMaskOf,
    devicePageConfigOf,
    devicePageSlotAccepts,
    fitDevicePageSlots,
    type DeviceDetailsConfig,
    type DevicePageConfig,
    type DevicePageLayout,
    type DevicePageSlotKind,
    type DevicePageStateRef,
    type DevicePageStatusRef,
    type DeviceStateInfo,
} from '../../src/lib/types/deviceDetails';
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
 * @param config the device page
 * @param index index of the slot (0 = slot 1)
 * @param ref the state of the slot, null = empty
 * @returns the device page with the slot; a status slot keeps its own icon when another state is chosen
 */
export function withDevicePageSlot(
    config: DevicePageConfig,
    index: number,
    ref: DevicePageStateRef | null,
): DevicePageConfig {
    const slots = fitDevicePageSlots(config.slots, config.layout);
    if (index < 0 || index >= slots.length) {
        return config;
    }
    const icon = slots[index]?.icon;
    const next: DevicePageStateRef | null = ref ? { ...ref } : null;
    if (next && icon && !next.icon && DEVICE_PAGE_LAYOUTS[config.layout][index] === 'status') {
        next.icon = icon;
    }
    slots[index] = next;
    // an own icon only on a status slot
    return { ...config, slots: fitDevicePageSlots(slots, config.layout) };
}

/**
 * The own icon of a status slot; other slots and an empty slot (no state) stay as they are.
 *
 * @param config the device page
 * @param index index of the slot (0 = slot 1)
 * @param icon MDI name, '' = the icon of the mask entry / the kind
 * @returns the device page with the icon
 */
export function withDevicePageSlotIcon(config: DevicePageConfig, index: number, icon: string): DevicePageConfig {
    const slot = config.slots[index];
    if (!slot || DEVICE_PAGE_LAYOUTS[config.layout][index] !== 'status') {
        return config;
    }
    const { icon: _old, ...rest } = slot;
    const trimmed = icon.trim();
    const slots = [...config.slots];
    slots[index] = trimmed ? { ...rest, icon: trimmed } : rest;
    return { ...config, slots };
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
export const DEVICE_PAGE_CUSTOM_STATUS = '__custom__';

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
