import type { DeviceDetailsConfig, DeviceSelectionError, DeviceShortPress } from '../../src/lib/types/deviceDetails';
import type { AlexaTimerConfig } from '../../src/lib/types/adminShareConfig';

/**
 * The radio buttons of the page item dialog (ChannelConfigDialog): the kind of the item (standard / device with
 * details / Alexa timer) and the short tap of a device item. Switching an option keeps the fields of the option it
 * leaves in a stash and brings back the fields of the option it goes to - nothing is lost while the dialog is open. The dialog
 * state only ever holds the fields of the chosen option, so saving stores just these (the others are dropped then);
 * cancel drops the stash with everything else.
 */

/** fields kept per option */
export type OptionStash<O extends string, F> = Partial<Record<O, F>>;

/**
 * Switches from one option to another.
 *
 * @param stash the kept fields of the options
 * @param from the option the dialog leaves
 * @param current the fields of that option as they are now
 * @param to the option the dialog goes to
 * @param fresh the fields of an option that was never chosen in this dialog
 * @returns the new stash and the fields of the option `to`
 */
export function switchOption<O extends string, F>(
    stash: OptionStash<O, F>,
    from: O,
    current: F,
    to: O,
    fresh: (option: O) => F,
): { stash: OptionStash<O, F>; fields: F } {
    const next: OptionStash<O, F> = { ...stash, [from]: current };
    const kept = next[to];
    return { stash: next, fields: kept !== undefined ? kept : fresh(to) };
}

/** the kind of a page item */
export type ItemKind = 'standard' | 'device' | 'alexaTimer';

/**
 * @param value a value of the radio group
 * @returns true for a kind of a page item
 */
export function isItemKind(value: string): value is ItemKind {
    return value === 'standard' || value === 'device' || value === 'alexaTimer';
}

/** what a short tap does: the fields the options of the kind and of the short tap set (C = the channel / state) */
export interface ItemTapFields<C> {
    isNavigation: boolean;
    targetPage: string;
    isCustom: boolean;
    channelId: C;
}

/** the fields of a kind of a page item */
export interface ItemKindFields<C> extends ItemTapFields<C> {
    /** device with details, null = standard item */
    device: DeviceDetailsConfig | null;
    deviceError: DeviceSelectionError | undefined;
    /** Alexa timer: the Echo device, null = no Alexa timer item */
    alexaTimer: AlexaTimerConfig | null;
}

/**
 * The fields of a kind chosen for the first time - what switching the kind set before the stash.
 *
 * @param kind the kind
 * @param emptyChannel no channel / state
 * @returns the fields
 */
export function freshKindFields<C>(kind: ItemKind, emptyChannel: C): ItemKindFields<C> {
    const toDevice = kind === 'device';
    return {
        device: toDevice ? { deviceId: '', shortPress: 'state', entries: [] } : null,
        deviceError: undefined,
        alexaTimer: kind === 'alexaTimer' ? { instance: '', serial: '' } : null,
        isNavigation: false,
        targetPage: '',
        // a new device item switches a state of the device (a custom item)
        isCustom: toDevice,
        channelId: emptyChannel,
    };
}

/**
 * The fields of a short tap chosen for the first time - what switching the short tap set before the stash.
 *
 * @param shortPress the short tap
 * @param emptyChannel no channel / state
 * @returns the fields
 */
export function freshShortPressFields<C>(shortPress: DeviceShortPress, emptyChannel: C): ItemTapFields<C> {
    return {
        isCustom: shortPress === 'state',
        isNavigation: shortPress === 'navigation',
        targetPage: '',
        channelId: emptyChannel,
    };
}
