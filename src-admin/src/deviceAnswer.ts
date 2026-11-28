import { emptyChannelValueConfig, type ChannelValueConfig } from '../../src/lib/types/adminShareConfig';
import {
    buildDeviceDetailRows,
    deviceDetailEntriesOfRows,
    deviceDetailEntryOfState,
    deviceDetailMaskOf,
    deviceDetailsAdapter,
    deviceShortPressOf,
    isDeviceShortPressState,
    type DeviceDetailsInfo,
    type DeviceDetailsLearned,
    type DeviceShortPress,
} from '../../src/lib/types/deviceDetails';
import {
    freshShortPressFields,
    switchOption,
    type ItemKindFields,
    type ItemTapFields,
    type OptionStash,
} from './itemOptionStash';

/**
 * The answer of the adapter (sendTo `getDeviceDetails`) for the device of a page item comes late - the user may have
 * switched the short tap or the kind of the item meanwhile. The answer goes into the fields of the device kind wherever
 * they are now (shown in the dialog or kept in the stash of itemOptionStash), and the suggested state of the device into
 * the fields of the short tap `state` wherever they are.
 */
export interface DeviceAnswerTarget {
    /** the fields of the kind "device with details" - shown or stashed */
    kind: ItemKindFields<ChannelValueConfig>;
    /** the fields of the short taps not shown right now */
    shortPressStash: OptionStash<DeviceShortPress, ItemTapFields<ChannelValueConfig>>;
    /** the device the entries belong to; another device gets the learned ticks */
    entriesDeviceId: string;
}

/**
 * The state of the short tap `state` after the answer: a state of the device is kept, otherwise the state of the mask
 * entry `switch` is suggested.
 *
 * @param current the state chosen now ('' = none)
 * @param deviceId the device
 * @param suggested the suggested state, undefined = the device has none
 * @returns the state, undefined = the device has no state to suggest and the current one is not of the device
 */
function stateAfterAnswer(current: string, deviceId: string, suggested: string | undefined): string | undefined {
    if (current.startsWith(`${deviceId}.`)) {
        return current;
    }
    return suggested;
}

/**
 * @param channelId the channel / state of a short tap
 * @param id the new state
 * @returns the channel / state with the new state
 */
function withState(channelId: ChannelValueConfig, id: string): ChannelValueConfig {
    return { ...channelId, valueStateId: id };
}

/**
 * Applies the answer of the adapter. A device the entries do not belong to gets the learned ticks and - with the short
 * tap `state` - the state of the entry `switch` of the mask; a device without such a state gets the short tap `none`
 * when `state` is shown (a stashed short tap `state` keeps its state). A refused device gets the reason.
 *
 * @param target the fields of the device kind and the stash of the short taps
 * @param id the device the answer is for (trimmed)
 * @param answer the answer of the adapter
 * @param learned the learned ticks per adapter
 * @returns the new fields, null = the answer is for another device than the item has now (dropped)
 */
export function applyDeviceAnswer(
    target: DeviceAnswerTarget,
    id: string,
    answer: DeviceDetailsInfo,
    learned: DeviceDetailsLearned,
): DeviceAnswerTarget | null {
    const device = target.kind.device;
    if (device === null || device.deviceId.trim() !== id) {
        return null;
    }
    if (!answer.ok) {
        return { ...target, kind: { ...target.kind, deviceError: answer.error ?? 'notFound' } };
    }
    let entries = device.entries;
    const otherDevice = target.entriesDeviceId !== id;
    if (otherDevice) {
        const rows = buildDeviceDetailRows(id, answer.states, undefined, learned[deviceDetailsAdapter(id)]);
        entries = deviceDetailEntriesOfRows(rows);
    }
    const mask = deviceDetailMaskOf(id);
    const suggested = answer.states.find(
        s => isDeviceShortPressState(s) && s.read && deviceDetailEntryOfState(mask, s)?.key === 'switch',
    )?.id;
    let kind: ItemKindFields<ChannelValueConfig> = {
        ...target.kind,
        device: { ...device, deviceId: id, entries },
        deviceError: undefined,
    };
    let shortPressStash = target.shortPressStash;

    if (deviceShortPressOf(device) === 'state') {
        const state = stateAfterAnswer(kind.channelId.valueStateId, id, suggested);
        if (state !== undefined) {
            kind = { ...kind, channelId: withState(kind.channelId, state) };
        } else if (otherDevice) {
            const { isNavigation, targetPage, isCustom, channelId } = kind;
            const switched = switchOption(
                shortPressStash,
                'state',
                { isNavigation, targetPage, isCustom, channelId },
                'none',
                tap => freshShortPressFields(tap, emptyChannelValueConfig('')),
            );
            shortPressStash = switched.stash;
            kind = { ...kind, ...switched.fields, device: { ...device, deviceId: id, entries, shortPress: 'none' } };
        } else {
            kind = { ...kind, channelId: withState(kind.channelId, '') };
        }
    } else {
        // another short tap is shown: the state goes into the stashed short tap `state`
        const kept = shortPressStash.state ?? freshShortPressFields('state', emptyChannelValueConfig(''));
        const state = stateAfterAnswer(kept.channelId.valueStateId, id, suggested) ?? '';
        if (state !== kept.channelId.valueStateId) {
            shortPressStash = { ...shortPressStash, state: { ...kept, channelId: withState(kept.channelId, state) } };
        }
    }
    return { kind, shortPressStash, entriesDeviceId: id };
}
