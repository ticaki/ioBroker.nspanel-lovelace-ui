/**
 * The detail page of a device (doc/ideas/device-details/README.md): a cardEntities page that is generated at runtime
 * from the ticked states of a device item, opened by a long press of the item (like the temporary speaker page of
 * Sonos / Squeezebox in pageItem.ts). The page is not editable, its rows can switch.
 *
 * The rows are page items of role {@link DEVICE_DETAIL_ROW_ROLE}: they are created and subscribed only while the
 * detail page is shown (Page.onVisibilityChange), a device may have far more than 100 states.
 */
import { Color, type RGB } from '../const/Color';
import { BATTERY_ICON_READ } from '../templates/text';
import { charAdvance, ELLIPSIS, ELLIPSIS_FALLBACK, hasGlyph } from '../const/text-width';
import type { NSPanel } from '../types/NSPanel';
import type { PageBase } from '../types/pages';
import type { NSpanelModel } from '../types/types';
import {
    DEVICE_DETAIL_ROW_ROLE,
    deviceDetailEntryOfRow,
    deviceDetailNameKey,
    deviceDetailRowKind,
    deviceDetailSubNames,
    hasCommonStatesList,
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
    /** a list (array or object) makes a writable number / string a selection, a read only one shows its text */
    states?: ioBroker.StateCommon['states'];
};

/** key of the mask entry of the charge level of a battery (role `value.battery`): its icon follows the value */
export const DEVICE_DETAIL_BATTERY_KEY = 'battery';

/** icon of a row without mask entry, by its kind */
export const fallbackIcon: Readonly<Record<ReturnType<typeof deviceDetailRowKind>, string>> = {
    button: 'gesture-tap-button',
    switch: 'toggle-switch',
    boolean: 'toggle-switch',
    select: 'format-list-bulleted',
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
export function nameOfCommon(name: ioBroker.StringOrTranslated | undefined, language: ioBroker.Languages): string {
    if (typeof name === 'string') {
        return name;
    }
    if (name && typeof name === 'object') {
        return name[language] ?? name.en ?? '';
    }
    return '';
}

/** font of the name field of cardEntities (tEntity1..n): font 0 = Noto Sans 24 */
export const DEVICE_DETAIL_NAME_FONT = 0;

/** the name field of a cardEntities row: width in px and the lines the field shows */
export interface DeviceDetailNameField {
    width: number;
    lines: number;
}

/**
 * The name field `tEntity` of cardEntities per model, measured with the font tables of the model (text-width.ts,
 * web-l = eu, web-p = us-p):
 * - eu / us-l: 184 px, 30 px high, `isbr=0` - one line,
 * - us-p: 115 px, 53 px high, `isbr=1` - the Nextion wraps character by character into two lines (no CR LF from the
 *   adapter, the text only has to fit into the two wrapped lines),
 * - web-l / web-p: one line (`white-space: nowrap`, cut at the field edge). The 18 px Noto Sans of the web panel is
 *   as wide as font 0 of the tables (measured in the browser: 0.93 ... 1.05 per character, about +3 % for digits and
 *   capitals). The narrowest name box of a row (value text, button, selection) is 121 px on web-p and 321 px on
 *   web-l - the widths leave about 3.5 % for the wider glyphs of the browser.
 */
export const DEVICE_DETAIL_NAME_FIELD: Readonly<Record<NSpanelModel, DeviceDetailNameField>> = {
    eu: { width: 184, lines: 1 },
    'us-l': { width: 184, lines: 1 },
    'us-p': { width: 115, lines: 2 },
    'web-l': { width: 310, lines: 1 },
    'web-p': { width: 117, lines: 1 },
};

/**
 * true if the text fits into the field: the characters are wrapped one by one into lines of the field width (the
 * Nextion `isbr` wraps character by character, a single line is the same with one line)
 *
 * @param text the text
 * @param model panel model
 * @param field the name field
 * @returns true if every character is drawn
 */
function fitsNameField(text: string, model: NSpanelModel, field: DeviceDetailNameField): boolean {
    let lines = 1;
    let width = 0;
    for (const ch of text) {
        const advance = charAdvance(ch.codePointAt(0) ?? 0, DEVICE_DETAIL_NAME_FONT, model);
        if (width + advance > field.width) {
            if (width === 0 || lines >= field.lines) {
                return false;
            }
            lines++;
            width = 0;
        }
        width += advance;
    }
    return true;
}

/**
 * The name of a row with its suffix (second name line of the admin) on one line: `<name> <suffix>`. If that does not
 * fit the name field of the model, only the name is shortened - with an ellipsis ('…' if the font has it, else
 * '...', like fitText) and without spaces in front of it - so that the suffix stays visible completely:
 * "Luftfeuchtigkeit Ext 100" on eu (184 px) → "Luftfeuchti... Ext 100". If not even one character of the name fits in front of
 * ellipsis and suffix, the row shows the suffix alone (cut by the field as before when it is too wide on its own).
 *
 * @param name name of the row
 * @param suffix the suffix, '' = none (the name is returned unchanged, it is never shortened here)
 * @param model panel model
 * @returns the text of the name field
 */
export function deviceDetailNameWithSuffix(name: string, suffix: string, model: NSpanelModel): string {
    if (!suffix) {
        return name;
    }
    const field = DEVICE_DETAIL_NAME_FIELD[model];
    const full = `${name} ${suffix}`;
    if (fitsNameField(full, model, field)) {
        return full;
    }
    const ellipsis = hasGlyph(ELLIPSIS.codePointAt(0) ?? 0, DEVICE_DETAIL_NAME_FONT, model)
        ? ELLIPSIS
        : ELLIPSIS_FALLBACK;
    const chars = Array.from(name);
    for (let n = chars.length - 1; n > 0; n--) {
        const base = chars.slice(0, n).join('').trimEnd();
        if (!base) {
            break;
        }
        const text = `${base}${ellipsis} ${suffix}`;
        if (fitsNameField(text, model, field)) {
            return text;
        }
    }
    return suffix;
}

/**
 * The names of the rows: the translated name of the mask entry, a row without entry the name of its state (else the
 * last part of its id). The second name line of the admin ({@link deviceDetailSubNames}: an own text of the row,
 * else an automatic one for rows that share their name with another row, e.g. Relay0.temperatureC and
 * Ext.temperature100C) is appended on the same line with a space - the name field of the panel is a single line
 * (30 px high on eu / us-l); if both do not fit the name field of the model, the name is shortened so that the
 * appended text stays visible ({@link deviceDetailNameWithSuffix}).
 *
 * @param deviceId id of the device
 * @param entries the rows
 * @param commons common of the state of every row, same order
 * @param translate translates a key (library.getTranslation)
 * @param language the language of the system
 * @param model model of the panel (width of the name field of cardEntities), null = the suffix is appended without
 * shortening (device page: the field of the element cuts the text)
 * @returns the names, same order
 */
export function deviceDetailRowNames(
    deviceId: string,
    entries: readonly DeviceDetailEntryConfig[],
    commons: readonly (DeviceDetailStateCommon | undefined)[],
    translate: (key: string) => string,
    language: ioBroker.Languages,
    model: NSpanelModel | null,
): string[] {
    const rows = entries.map((e, index) => ({
        id: e.id,
        name: e.key
            ? translate(deviceDetailNameKey(e.key))
            : nameOfCommon(commons[index]?.name, language) || (e.id.split('.').pop() ?? e.id),
        subName: e.subName,
    }));
    const subs = deviceDetailSubNames(deviceId, rows);
    return rows.map((r, index) => {
        const suffix = subs[index]?.text ?? '';
        if (model === null) {
            return suffix ? `${r.name} ${suffix}` : r.name;
        }
        return deviceDetailNameWithSuffix(r.name, suffix, model);
    });
}

/**
 * Icon and value color of a row: from the mask entry (icon, color of its group), a row without entry gets the icon of
 * its kind and the color of the group info.
 *
 * @param deviceId id of the device
 * @param entry the row
 * @param common common of its state
 * @param kind the kind the row is shown as (icon without mask entry)
 * @returns MDI name of the icon, the theme color of the value and `batteryLevel`: the row is the charge level of a
 * battery (entry `battery` with a number) - its icon follows the value ({@link deviceDetailRowIcon})
 */
export function deviceDetailRowLook(
    deviceId: string,
    entry: DeviceDetailEntryConfig,
    common: DeviceDetailStateCommon,
    kind: ReturnType<typeof deviceDetailRowKind>,
): { icon: string; color: RGB | string; batteryLevel: boolean } {
    const maskEntry = deviceDetailEntryOfRow(deviceId, entry.key, {
        id: entry.id,
        role: common.role ?? '',
        unit: common.unit,
    });
    return {
        icon: maskEntry?.icon ?? fallbackIcon[kind],
        color: deviceDetailGroupColor(maskEntry?.group ?? 'info'),
        batteryLevel: maskEntry?.key === DEVICE_DETAIL_BATTERY_KEY && common.type === 'number',
    };
}

/**
 * The icon of a row as data item: the icon of its look. The charge level of a battery (`batteryLevel`) gets the icon
 * of its level instead - the read script of the battery template (`BATTERY_ICON_READ`: `battery-outline`,
 * `battery-10` ... `battery-90`, `battery`) on the state of the row, sent again when the value changes.
 *
 * @param look the look of the row ({@link deviceDetailRowLook})
 * @param look.icon MDI name of the icon
 * @param look.batteryLevel the row is the charge level of a battery
 * @param id id of the state of the row
 * @returns the data item of the icon
 */
export function deviceDetailRowIcon(
    look: { icon: string; batteryLevel: boolean },
    id: string,
): NSPanel.DataItemsOptions {
    return look.batteryLevel
        ? { type: 'triggered', dp: id, read: BATTERY_ICON_READ }
        : { type: 'const', constVal: look.icon };
}

/**
 * The page item of a row of the detail page (doc/ideas/device-details/README.md, section Zeilen), with the controls
 * of cardEntities: a writable boolean = `switch` (OnOff switches), a readonly boolean = text on/off, both in the theme
 * colors activated / deactivated; `read: false` = `button` (writes true); a writable number or string with
 * `common.states` = `input_sel` (the selection popup popupInSel writes the key of the chosen entry, the row shows the
 * text of the current value); everything else a read only text with the formatted value and its unit - a value of
 * `common.states` shows its text. Values take the color of the group of their entry. The icon of the charge level
 * of a battery follows the value ({@link deviceDetailRowIcon}).
 *
 * The device page uses the same rows read only (`readOnly`): a switch shows on/off, a button its value as text, a
 * selection the text of its value - `keepSelect` keeps the selection (info slot).
 *
 * @param deviceId id of the device
 * @param entry the row
 * @param common common of its state
 * @param name name of the row
 * @param readOnly false = the controls of the detail page, `all` = every row as text, `keepSelect` = every row as text
 * except a selection
 * @param iconName MDI name that replaces the icon of the mask entry / kind (status icon of the device page), '' = none
 * @returns the page item
 */
export function deviceDetailRowItem(
    deviceId: string,
    entry: DeviceDetailEntryConfig,
    common: DeviceDetailStateCommon,
    name: string,
    readOnly: false | 'all' | 'keepSelect' = false,
    iconName = '',
): NSPanel.PageItemDataItemsOptions {
    const kind = readOnlyRowKind(deviceDetailRowKind(common), readOnly);
    const look = deviceDetailRowLook(deviceId, entry, common, kind);
    const icon: NSPanel.DataItemsOptions = iconName
        ? { type: 'const', constVal: iconName }
        : deviceDetailRowIcon(look, entry.id);
    const valueColor: NSPanel.DataItemsOptions = { type: 'const', constVal: look.color };
    const nameItem: NSPanel.DataItemsOptions = { type: 'const', constVal: name };
    const text = { true: nameItem, false: nameItem };
    const value: NSPanel.DataItemsOptions = { type: 'triggered', dp: entry.id };
    switch (kind) {
        case 'switch':
            return {
                type: 'switch',
                role: DEVICE_DETAIL_ROW_ROLE,
                data: {
                    icon: {
                        true: { value: icon, color: { type: 'const', constVal: Color.activated } },
                        false: { value: icon, color: { type: 'const', constVal: Color.deactivated } },
                    },
                    entity1: { value },
                    text,
                },
            };
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
        case 'select':
            return {
                type: 'input_sel',
                role: DEVICE_DETAIL_ROW_ROLE,
                data: {
                    icon: { true: { value: icon, color: valueColor }, false: { value: icon, color: valueColor } },
                    // the list of popupInSel comes from common.states (PageItem.getListFromStates), the choice writes
                    // its key (PageItem.setListCommand)
                    entityInSel: { value },
                    headline: nameItem,
                    // the row shows the text of the current value: the input_sel row looks it up in common.states
                    text: { true: value },
                },
            };
        case 'number':
        case 'text':
            return {
                type: 'text',
                role: DEVICE_DETAIL_ROW_ROLE,
                data: {
                    icon: { true: { value: icon, color: valueColor }, false: { value: icon, color: valueColor } },
                    entity2: hasCommonStatesList(common.states)
                        ? {
                              // the text of the value in common.states (an unknown value as it is), no unit behind
                              value: { ...value, commonStates: { mode: 'text', keepValue: true } },
                              unit: { type: 'const', constVal: '' },
                          }
                        : { value },
                    text,
                },
            };
    }
}

/**
 * @param kind the kind of a row
 * @param readOnly see deviceDetailRowItem
 * @returns the kind shown: read only a switch is on/off, a button a text, a selection a text (unless `keepSelect`)
 */
function readOnlyRowKind(
    kind: ReturnType<typeof deviceDetailRowKind>,
    readOnly: false | 'all' | 'keepSelect',
): ReturnType<typeof deviceDetailRowKind> {
    if (!readOnly) {
        return kind;
    }
    switch (kind) {
        case 'switch':
            return 'boolean';
        case 'button':
            return 'text';
        case 'select':
            return readOnly === 'keepSelect' ? 'select' : 'text';
        default:
            return kind;
    }
}

/**
 * The page of the detail page: cardEntities (rows per page like every cardEntities page: eu / us-l 4, us-p 5),
 * headline = name of the device, classic paging, not editable.
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
            card: 'cardEntities',
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
 * @param model model of the panel (width of the name field)
 * @returns headline and the page items of the rows - rows whose state no longer exists are left out
 */
export async function deviceDetailRows(
    details: DeviceDetailsRuntime,
    getObject: (id: string) => Promise<ioBroker.Object | null>,
    translate: (key: string) => string,
    language: ioBroker.Languages,
    model: NSpanelModel,
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
    const names = deviceDetailRowNames(details.deviceId, entries, commons, translate, language, model);
    const rows = entries.map((entry, index) =>
        deviceDetailRowItem(details.deviceId, entry, commons[index], names[index]),
    );
    return { headline, rows };
}
