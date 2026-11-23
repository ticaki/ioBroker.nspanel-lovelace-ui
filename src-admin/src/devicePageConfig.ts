import {
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
 * @returns the device page with the slot
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
    slots[index] = ref ? { ...ref } : null;
    return { ...config, slots };
}

/**
 * @param config the device page
 * @param ref the state of the status line, null = none
 * @returns the device page with the status line
 */
export function withDevicePageStatus(config: DevicePageConfig, ref: DevicePageStateRef | null): DevicePageConfig {
    const { status: _old, ...rest } = config;
    return ref ? { ...rest, status: { ...ref } } : rest;
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
