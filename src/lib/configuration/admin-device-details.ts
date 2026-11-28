/**
 * Device with details: the answer of the sendTo command `getDeviceDetails` - the admin builds
 * its filter list from it (doc/ideas/device-details/README.md).
 */
import { getStringFromStringOrTranslated } from '../const/tools';
import {
    deviceDetailsAdapter,
    deviceSelectionError,
    isDeviceDetailState,
    type DeviceDetailsInfo,
    type DeviceStateInfo,
} from '../types/deviceDetails';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';

/**
 * The part of a state object the filter list needs.
 *
 * @param adapter adapter instance (language of the system)
 * @param obj the state object
 * @returns the state for the admin
 */
export function deviceStateInfoOf(adapter: ioBroker.Adapter, obj: ioBroker.StateObject): DeviceStateInfo {
    const common = obj.common;
    const name = obj._id.split('.').pop() ?? obj._id;
    const info: DeviceStateInfo = {
        id: obj._id,
        name: common.name ? getStringFromStringOrTranslated(adapter, common.name, name) : name,
        role: common.role ?? '',
        type: common.type ?? '',
        read: common.read !== false,
        write: common.write !== false,
    };
    if (common.unit) {
        info.unit = common.unit;
    }
    if (typeof common.min === 'number') {
        info.min = common.min;
    }
    if (typeof common.max === 'number') {
        info.max = common.max;
    }
    if (typeof common.step === 'number') {
        info.step = common.step;
    }
    return info;
}

/**
 * The device and its states: only an object of type device or channel can be chosen (never an instance or the root of
 * an adapter, a known adapter fixes the level of its devices); its states are the ones directly below it or in sub
 * folders, as deep as the mask of its adapter allows (`isDeviceDetailState`).
 *
 * @param adapter adapter instance
 * @param rawId id of the device as sent by the admin
 * @returns the device with its states, `ok: false` with the reason when it cannot be chosen
 */
export async function deviceDetailsInfo(adapter: NspanelLovelaceUi, rawId: unknown): Promise<DeviceDetailsInfo> {
    const id = typeof rawId === 'string' ? rawId.trim() : '';
    const result: DeviceDetailsInfo = { ok: false, adapter: deviceDetailsAdapter(id), name: '', states: [] };
    if (!id) {
        result.error = 'notFound';
        return result;
    }
    const obj = await adapter.getForeignObjectAsync(id);
    const error = deviceSelectionError(id, obj?.type);
    if (error || !obj) {
        result.error = error ?? 'notFound';
        return result;
    }
    result.name = getStringFromStringOrTranslated(adapter, obj.common.name, id.split('.').pop());
    const view = await adapter.getObjectViewAsync('system', 'state', { startkey: `${id}.`, endkey: `${id}.香` });
    for (const row of view?.rows ?? []) {
        if (row?.value && row.value.type === 'state' && isDeviceDetailState(id, row.id)) {
            result.states.push(deviceStateInfoOf(adapter, row.value));
        }
    }
    result.states.sort((a, b) => a.id.localeCompare(b.id));
    result.ok = true;
    return result;
}
