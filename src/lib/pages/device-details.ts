/**
 * The detail page of a device (doc/ideas/device-details/README.md): a cardSchedule page that is generated at runtime
 * from the ticked states of a device item, opened by a long press of the item (like the temporary speaker page of
 * Sonos / Squeezebox in pageItem.ts). The page is not editable, its rows can switch.
 *
 * The rows are page items of role {@link DEVICE_DETAIL_ROW_ROLE}: they are created and subscribed only while the
 * detail page is shown (Page.onVisibilityChange), a device may have far more than 100 states.
 */
import { Color, type RGB } from '../const/Color';
import type { NSPanel } from '../types/NSPanel';
import type { PageBase } from '../types/pages';
import {
    DEVICE_DETAIL_ROW_ROLE,
    deviceDetailEntryOfRow,
    deviceDetailNameKey,
    deviceDetailRowKind,
    type DeviceDetailEntryConfig,
    type DeviceDetailGroup,
    type DeviceDetailsRuntime,
} from '../types/deviceDetails';

/**
 * prefix of the id of a generated detail page, followed by the id of the page it was opened from - short, the ids of
 * the rows (`<page>?<n>`) must fit the id buffers of the HMI (23 characters)
 */
export const DEVICE_DETAIL_PAGE_PREFIX = 'dd_';

/** the newest opening of a detail page per panel: an older one that is still loading gives up */
const deviceDetailsRuns = new WeakMap<object, number>();

/**
 * A long press starts to open a detail page.
 *
 * @param panel the panel
 * @returns the number of this run
 */
export function beginDeviceDetailsRun(panel: object): number {
    const run = (deviceDetailsRuns.get(panel) ?? 0) + 1;
    deviceDetailsRuns.set(panel, run);
    return run;
}

/**
 * @param panel the panel
 * @param run the number of a run ({@link beginDeviceDetailsRun})
 * @returns true while no later long press of the panel started to open a detail page
 */
export function isLatestDeviceDetailsRun(panel: object, run: number): boolean {
    return deviceDetailsRuns.get(panel) === run;
}

/** what a row needs to know of its state (ioBroker common) */
export type DeviceDetailStateCommon = {
    name?: ioBroker.StringOrTranslated;
    role?: string;
    type?: string;
    read?: boolean;
    write?: boolean;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
};

/** icon of a row without mask entry, by its kind */
const fallbackIcon: Readonly<Record<ReturnType<typeof deviceDetailRowKind>, string>> = {
    button: 'gesture-tap-button',
    switch: 'toggle-switch',
    boolean: 'toggle-switch',
    numberSet: 'numeric',
    number: 'numeric',
    text: 'information-outline',
};

/**
 * The theme color of a color group (deviceDetailGroupColorKey).
 *
 * @param group the group
 * @returns the color of the theme
 */
export function deviceDetailGroupColor(group: DeviceDetailGroup): RGB | string {
    switch (group) {
        case 'energy':
            return Color.deviceEnergy;
        case 'climate':
            return Color.temperature;
        case 'connection':
            return Color.deviceConnection;
        case 'info':
            return Color.deviceInfo;
    }
}

/**
 * @param name common.name of a state
 * @param language the language of the system
 * @returns the name as text, '' without one
 */
function nameOfCommon(name: ioBroker.StringOrTranslated | undefined, language: ioBroker.Languages): string {
    if (typeof name === 'string') {
        return name;
    }
    if (name && typeof name === 'object') {
        return name[language] ?? name.en ?? '';
    }
    return '';
}

/**
 * The names of the rows: the translated name of the mask entry, a row without entry the name of its state (else the
 * last part of its id). Several rows of the same entry (Relay0.Power and Relay1.Power) get the sub folder of their
 * state behind the name.
 *
 * @param deviceId id of the device
 * @param entries the rows
 * @param commons common of the state of every row, same order
 * @param translate translates a key (library.getTranslation)
 * @param language the language of the system
 * @returns the names, same order
 */
export function deviceDetailRowNames(
    deviceId: string,
    entries: readonly DeviceDetailEntryConfig[],
    commons: readonly (DeviceDetailStateCommon | undefined)[],
    translate: (key: string) => string,
    language: ioBroker.Languages,
): string[] {
    const count = new Map<string, number>();
    for (const e of entries) {
        if (e.key) {
            count.set(e.key, (count.get(e.key) ?? 0) + 1);
        }
    }
    return entries.map((e, index) => {
        const rest = e.id.startsWith(`${deviceId}.`) ? e.id.slice(deviceId.length + 1) : e.id;
        if (!e.key) {
            return nameOfCommon(commons[index]?.name, language) || (rest.split('.').pop() ?? rest);
        }
        const name = translate(deviceDetailNameKey(e.key));
        if ((count.get(e.key) ?? 0) < 2) {
            return name;
        }
        const parts = rest.split('.');
        return `${name} ${parts.length > 1 ? parts[0] : rest}`;
    });
}

/**
 * The page item of a row of the detail page (doc/ideas/device-details/README.md, section Zeilen):
 * boolean = on/off in the theme colors activated / deactivated, `read: false` = a button, number = value with unit
 * (writable: type number, a tap opens popupSlider with min / max / step of common), everything else a text. Values
 * take the color of the group of their entry.
 *
 * @param deviceId id of the device
 * @param entry the row
 * @param common common of its state
 * @param name name of the row
 * @returns the page item
 */
export function deviceDetailRowItem(
    deviceId: string,
    entry: DeviceDetailEntryConfig,
    common: DeviceDetailStateCommon,
    name: string,
): NSPanel.PageItemDataItemsOptions {
    const kind = deviceDetailRowKind(common);
    const maskEntry = deviceDetailEntryOfRow(deviceId, entry.key, {
        id: entry.id,
        role: common.role ?? '',
        unit: common.unit,
    });
    const icon: NSPanel.DataItemsOptions = { type: 'const', constVal: maskEntry?.icon ?? fallbackIcon[kind] };
    const valueColor: NSPanel.DataItemsOptions = {
        type: 'const',
        constVal: deviceDetailGroupColor(maskEntry?.group ?? 'info'),
    };
    const nameItem: NSPanel.DataItemsOptions = { type: 'const', constVal: name };
    const text = { true: nameItem, false: nameItem };
    const value: NSPanel.DataItemsOptions = { type: 'triggered', dp: entry.id };
    switch (kind) {
        case 'switch':
        case 'boolean':
            return {
                type: 'text',
                role: DEVICE_DETAIL_ROW_ROLE,
                data: {
                    icon: {
                        true: { value: icon, color: { type: 'const', constVal: Color.activated } },
                        false: { value: icon, color: { type: 'const', constVal: Color.deactivated } },
                    },
                    entity1: { value },
                    text,
                    text1: { true: { type: 'const', constVal: 'on' }, false: { type: 'const', constVal: 'off' } },
                },
            };
        case 'button':
            return {
                type: 'button',
                role: DEVICE_DETAIL_ROW_ROLE,
                data: {
                    icon: {
                        true: { value: icon, color: { type: 'const', constVal: Color.activated } },
                        false: { value: icon, color: { type: 'const', constVal: Color.activated } },
                    },
                    entity1: { set: { type: 'state', dp: entry.id } },
                    text,
                    text1: { true: { type: 'const', constVal: 'press' }, false: { type: 'const', constVal: 'press' } },
                },
            };
        case 'numberSet': {
            const min = typeof common.min === 'number' ? common.min : 0;
            const max = typeof common.max === 'number' ? common.max : 100;
            return {
                type: 'number',
                role: DEVICE_DETAIL_ROW_ROLE,
                data: {
                    icon: { true: { value: icon, color: valueColor }, false: { value: icon, color: valueColor } },
                    // the slider of popupSlider runs from 0 to 100 % of min..max (getScaledNumber / setScaledNumber)
                    entity1: {
                        value,
                        minScale: { type: 'const', constVal: min },
                        maxScale: { type: 'const', constVal: max },
                    },
                    minValue1: { type: 'const', constVal: min },
                    maxValue1: { type: 'const', constVal: max },
                    steps1:
                        typeof common.step === 'number' && common.step > 0
                            ? { type: 'const', constVal: common.step }
                            : undefined,
                    heading1: { type: 'const', constVal: name },
                    text,
                },
            };
        }
        case 'number':
        case 'text':
            return {
                type: 'text',
                role: DEVICE_DETAIL_ROW_ROLE,
                data: {
                    icon: { true: { value: icon, color: valueColor }, false: { value: icon, color: valueColor } },
                    entity2: { value },
                    text,
                },
            };
    }
}

/**
 * The page of the detail page: cardSchedule, headline = name of the device, classic paging, not editable.
 *
 * @param uniqueID id of the page
 * @param headline name of the device
 * @param alwaysOn alwaysOn of the page the item lies on
 * @param rows the page items of the rows
 * @returns the page configuration
 */
export function deviceDetailPageConfig(
    uniqueID: string,
    headline: string,
    alwaysOn: 'none' | 'always' | 'action' | 'ignore',
    rows: NSPanel.PageItemDataItemsOptions[],
): PageBase {
    return {
        uniqueID,
        alwaysOn,
        dpInit: '',
        pageItems: rows,
        config: {
            card: 'cardSchedule',
            scrollPresentation: 'classic',
            scrollType: 'page',
            data: { headline: { type: 'const', constVal: headline } },
        },
    };
}

/**
 * Everything the detail page needs to be built, read from the objects of the device and its states.
 *
 * @param details the device part of the item
 * @param getObject reads an object (states controller, cached)
 * @param translate translates a key (library.getTranslation)
 * @param language the language of the system
 * @returns headline and the page items of the rows - rows whose state no longer exists are left out
 */
export async function deviceDetailRows(
    details: DeviceDetailsRuntime,
    getObject: (id: string) => Promise<ioBroker.Object | null>,
    translate: (key: string) => string,
    language: ioBroker.Languages,
): Promise<{ headline: string; rows: NSPanel.PageItemDataItemsOptions[] }> {
    const device = await getObject(details.deviceId);
    const headline = nameOfCommon(device?.common?.name, language) || details.deviceId.split('.').pop() || '';
    const entries: DeviceDetailEntryConfig[] = [];
    const commons: DeviceDetailStateCommon[] = [];
    for (const entry of details.entries) {
        const obj = await getObject(entry.id);
        if (obj?.type !== 'state') {
            continue;
        }
        entries.push(entry);
        commons.push(obj.common);
    }
    const names = deviceDetailRowNames(details.deviceId, entries, commons, translate, language);
    const rows = entries.map((entry, index) =>
        deviceDetailRowItem(details.deviceId, entry, commons[index], names[index]),
    );
    return { headline, rows };
}
