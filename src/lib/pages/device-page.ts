/**
 * The device page of a device item (doc/ideas/device-details/README.md, section Geräteseite): optionally a long press
 * opens it instead of the detail page. HMI pages cardDevice1 / cardDevice2 / cardDevice3: a big device icon (main),
 * the slots of the layout ({@link DEVICE_PAGE_LAYOUTS}), a wide status line (field 6 of main) and an optional info icon
 * that opens the detail page. Generated at runtime like the detail page, not editable.
 *
 * `entityUpd~<heading>~<navigation>~<main>~<slot1>~…~<slotN>~<info>`, every element the 6 fields of a cardGrid cell
 * `type~intName~icon~iconColor~displayName~optionalValue`.
 */
import { Color } from '../const/Color';
import { ELLIPSIS, ELLIPSIS_FALLBACK, fitText, hasGlyph } from '../const/text-width';
import { isVersionGreaterOrEqual } from '../const/tools';
import type { NSPanel } from '../types/NSPanel';
import type { PageBase } from '../types/pages';
import type { NSpanelModel } from '../types/types';
import {
    DEVICE_DETAIL_ROW_ROLE,
    DEVICE_PAGE_FIELDS,
    DEVICE_PAGE_INFO_ROLE,
    DEVICE_PAGE_LAYOUTS,
    DEVICE_PAGE_STATUS_MAX_BYTES,
    DEVICE_PAGE_TEXT_FONT,
    DEVICE_PAGE_PROGRESS_ROLE,
    devicePageSlotAccepts,
    deviceDetailRowKind,
    type DeviceDetailEntryConfig,
    type DeviceDetailsRuntime,
    type DevicePageLayout,
    type DevicePageRuntime,
    type DevicePageSlotKind,
    type DevicePageStateRef,
} from '../types/deviceDetails';
import {
    deviceDetailRowItem,
    deviceDetailRowLook,
    deviceDetailRowNames,
    nameOfCommon,
    type DeviceDetailStateCommon,
} from './device-details';

/**
 * prefix of the id of a generated device page, followed by the id of the page it was opened from (short like the
 * detail page: the ids of the elements `<page>?<n>` must fit the id buffers of the HMI)
 */
export const DEVICE_PAGE_PREFIX = 'dp_';

/**
 * first TFT version with the pages cardDevice1..3.
 * TODO: raise to the TFT version of the release that brings the device pages (the test HMI still says 6.2.0).
 */
export const CARD_DEVICE_MIN_TFT = '6.2.0';

/** models whose HMI has the device pages (us-l, us-p and web-p fall back to the detail page) */
export const CARD_DEVICE_MODELS: ReadonlySet<NSpanelModel> = new Set<NSpanelModel>(['eu', 'web-l']);

/** an element without content (empty slot, no info): what cardGrid sends for an empty cell - the HMI hides it */
export const DEVICE_PAGE_EMPTY_ELEMENT = '~~~~~';

/** what decides whether a panel can show the device page */
export interface CardDeviceTarget {
    model: NSpanelModel;
    /** web panel or web clone: draws the page in the browser, no TFT */
    isVirtual: boolean;
    /** TFT version of the display (info.nspanel.displayVersion) */
    displayVersion: string;
}

/**
 * true if the panel has the device pages: model eu or web-l, a web panel always (web-l and web clones of eu panels),
 * a hardware panel from {@link CARD_DEVICE_MIN_TFT} on. Otherwise the long press opens the detail page.
 *
 * @param target model, web/hardware and TFT version
 * @returns true when the device page can be shown
 */
export function supportsCardDevice(target: CardDeviceTarget): boolean {
    if (!CARD_DEVICE_MODELS.has(target.model)) {
        return false;
    }
    if (target.isVirtual) {
        return true;
    }
    return !!target.displayVersion && isVersionGreaterOrEqual(target.displayVersion, CARD_DEVICE_MIN_TFT);
}

/**
 * @param layout the layout
 * @returns the HMI page of the layout
 */
export function cardDeviceOf(layout: DevicePageLayout): 'cardDevice1' | 'cardDevice2' | 'cardDevice3' {
    switch (layout) {
        case 1:
            return 'cardDevice1';
        case 2:
            return 'cardDevice2';
        case 3:
            return 'cardDevice3';
    }
}

/**
 * The text of the status line: cut at the end with an ellipsis ('…' if font 0 has it, else '...') when it is wider
 * than the line of the layout, never wrapped; at most {@link DEVICE_PAGE_STATUS_MAX_BYTES} bytes (UTF-8).
 *
 * @param text the status text
 * @param layout the layout
 * @param model panel model (font tables)
 * @returns the text for field 6 of main
 */
export function fitDevicePageStatus(text: string, layout: DevicePageLayout, model: NSpanelModel): string {
    const flat = text.replace(/[\r\n]+/g, ' ');
    let out = fitText(flat, DEVICE_PAGE_TEXT_FONT, model, DEVICE_PAGE_FIELDS[layout].status);
    if (Buffer.byteLength(out, 'utf8') <= DEVICE_PAGE_STATUS_MAX_BYTES) {
        return out;
    }
    const ellipsis = hasGlyph(ELLIPSIS.codePointAt(0) ?? 0, DEVICE_PAGE_TEXT_FONT, model)
        ? ELLIPSIS
        : ELLIPSIS_FALLBACK;
    const chars = Array.from(flat);
    for (let n = chars.length - 1; n > 0; n--) {
        out = `${chars.slice(0, n).join('').trimEnd()}${ellipsis}`;
        if (Buffer.byteLength(out, 'utf8') <= DEVICE_PAGE_STATUS_MAX_BYTES) {
            return out;
        }
    }
    return '';
}

/**
 * The main element with the status text in field 6: fields 1-5 of the payload of the main item, field 6 the status
 * (empty without status).
 *
 * @param mainPayload payload of the main item ('' = none)
 * @param status the fitted status text
 * @returns the element
 */
export function devicePageMainElement(mainPayload: string, status: string): string {
    // the HMI shows the status line also when main is hidden (empty type)
    const fields = mainPayload ? mainPayload.split('~') : [];
    const head = fields.length >= 6 ? fields.slice(0, 5) : ['', '', '', '', ''];
    return [...head, status.replace(/~/g, '')].join('~');
}

/**
 * @param payload payload of a page item
 * @returns its field 6 (optionalValue), '' without
 */
export function optionalValueOf(payload: string): string {
    return payload.split('~')[5] ?? '';
}

/** the icon options of a text / button item */
type IconOptions = NonNullable<NSPanel.PageItemButtonDataItemsOptions['data']['icon']>;

/**
 * @param icon icon options of the item
 * @param name MDI name that replaces the icon for on and off, the colors stay
 * @returns the icon options
 */
function withIcon(icon: IconOptions | undefined, name: string): IconOptions {
    const value: NSPanel.DataItemsOptions = { type: 'const', constVal: name };
    return { ...icon, true: { ...icon?.true, value }, false: { ...icon?.false, value } };
}

/**
 * The main element: the device item itself (icon `devicePage.icon`, else the one of the item; color and name as on
 * the page of the item). A tap does what the short tap of the item does (`state`: the state is switched / a button
 * pressed; `none`: a text, nothing). A short tap `navigation` or `popup` is not built here: main is a text with icon,
 * name and on/off of the item, without action. Its field 6 is replaced by the status line ({@link devicePageMainElement}).
 *
 * @param source runtime configuration of the device item
 * @param details the device part of the item
 * @param page the device page
 * @returns the page item of main
 */
export function devicePageMainItem(
    source: NSPanel.PageItemDataItemsOptionsWithOutTemplate,
    details: DeviceDetailsRuntime,
    page: DevicePageRuntime,
): NSPanel.PageItemDataItemsOptions {
    // the device part stays for the button semantics of the short tap (read: false is pressed), without the device
    // page - there is no long press on the device page
    const deviceDetails: DeviceDetailsRuntime = { deviceId: details.deviceId, entries: details.entries };
    if (
        (page.shortPress === 'state' || page.shortPress === 'none') &&
        (source.type === 'button' || source.type === 'switch' || source.type === 'text')
    ) {
        const item = structuredClone(source);
        item.deviceDetails = deviceDetails;
        item.dpInit = '';
        if (page.icon) {
            item.data.icon = withIcon(item.data.icon, page.icon);
        }
        return item;
    }
    const data = source.data;
    const text: NSPanel.PageItemButtonDataItemsOptions['data']['text'] =
        data && 'text' in data && data.text
            ? structuredClone(data.text)
            : data && 'headline' in data && data.headline
              ? { true: structuredClone(data.headline), false: structuredClone(data.headline) }
              : undefined;
    const icon: IconOptions | undefined = data && 'icon' in data && data.icon ? structuredClone(data.icon) : undefined;
    const entity1 = data && 'entity1' in data && data.entity1 ? structuredClone(data.entity1) : undefined;
    return {
        type: 'text',
        dpInit: '',
        deviceDetails,
        data: {
            icon: page.icon ? withIcon(icon, page.icon) : icon,
            text,
            entity1,
        },
    };
}

/**
 * The info element: icon information-outline in the color of the group info, no name; a tap
 * (`buttonPress2,<intName>,button`) opens the detail page.
 *
 * @param details the device part of the item
 * @returns the page item
 */
export function devicePageInfoItem(details: DeviceDetailsRuntime): NSPanel.PageItemDataItemsOptions {
    const icon: NSPanel.DataItemsOptions = { type: 'const', constVal: 'information-outline' };
    const color: NSPanel.DataItemsOptions = { type: 'const', constVal: Color.deviceInfo };
    const name: NSPanel.DataItemsOptions = { type: 'const', constVal: '' };
    return {
        type: 'button',
        role: DEVICE_PAGE_INFO_ROLE,
        dpInit: '',
        deviceDetails: { deviceId: details.deviceId, entries: details.entries },
        data: {
            icon: { true: { value: icon, color }, false: { value: icon, color } },
            text: { true: name, false: name },
        },
    };
}

/**
 * The page item of a slot (DEVICE_PAGE_LAYOUTS):
 * - `info`: the read only rows of the detail page, a writable state with common.states stays a selection
 *   (input_sel → popupInSel),
 * - `value`: always a read only text row (value with unit / text of common.states / on-off),
 * - `progress`: `text` whose field 6 is the value scaled to 0-100, icon color = color of the bar (group of the entry),
 * - `button`: `read: false` = the button row of the detail page (writes true), a writable boolean a `button` that
 *   switches it (icon in the colors activated / deactivated),
 * - `switch`: the switch row of the detail page (OnOff).
 *
 * @param deviceId id of the device
 * @param kind the kind of the slot
 * @param entry the state of the slot
 * @param common common of the state
 * @param name name of the slot
 * @returns the page item, undefined when the state does not fit the kind (devicePageSlotAccepts)
 */
export function devicePageSlotItem(
    deviceId: string,
    kind: DevicePageSlotKind,
    entry: DeviceDetailEntryConfig,
    common: DeviceDetailStateCommon,
    name: string,
): NSPanel.PageItemDataItemsOptions | undefined {
    if (!devicePageSlotAccepts(kind, common)) {
        return undefined;
    }
    const nameItem: NSPanel.DataItemsOptions = { type: 'const', constVal: name };
    const value: NSPanel.DataItemsOptions = { type: 'triggered', dp: entry.id };
    switch (kind) {
        case 'info':
            return { ...deviceDetailRowItem(deviceId, entry, common, name, 'keepSelect'), dpInit: '' };
        case 'value':
            return { ...deviceDetailRowItem(deviceId, entry, common, name, 'all'), dpInit: '' };
        case 'switch':
            return { ...deviceDetailRowItem(deviceId, entry, common, name), dpInit: '' };
        case 'button': {
            if (common.read === false) {
                return { ...deviceDetailRowItem(deviceId, entry, common, name), dpInit: '' };
            }
            const look = deviceDetailRowLook(deviceId, entry, common, deviceDetailRowKind(common));
            const icon: NSPanel.DataItemsOptions = { type: 'const', constVal: look.icon };
            return {
                type: 'button',
                role: DEVICE_DETAIL_ROW_ROLE,
                dpInit: '',
                data: {
                    icon: {
                        true: { value: icon, color: { type: 'const', constVal: Color.activated } },
                        false: { value: icon, color: { type: 'const', constVal: Color.deactivated } },
                    },
                    entity1: { value },
                    text: { true: nameItem, false: nameItem },
                },
            };
        }
        case 'progress': {
            const look = deviceDetailRowLook(deviceId, entry, common, 'number');
            const icon: NSPanel.DataItemsOptions = { type: 'const', constVal: look.icon };
            const color: NSPanel.DataItemsOptions = { type: 'const', constVal: look.color };
            return {
                type: 'text',
                role: DEVICE_PAGE_PROGRESS_ROLE,
                dpInit: '',
                data: {
                    icon: { true: { value: icon, color }, false: { value: icon, color } },
                    entity2: { value },
                    text: { true: nameItem, false: nameItem },
                },
            };
        }
    }
}

/**
 * The hidden status item: a read only text row of the state of the status line - its field 6 (value with unit, the
 * translated text of common.states, a boolean on/off) becomes field 6 of main. It is never sent as an element.
 *
 * @param deviceId id of the device
 * @param entry the state of the status line
 * @param common common of the state
 * @returns the page item
 */
export function devicePageStatusItem(
    deviceId: string,
    entry: DeviceDetailEntryConfig,
    common: DeviceDetailStateCommon,
): NSPanel.PageItemDataItemsOptions {
    return { ...deviceDetailRowItem(deviceId, entry, common, '', 'all'), dpInit: '' };
}

/** the elements of the device page in the order of its page items */
export interface DevicePageElements {
    headline: string;
    /** number of slots of the layout */
    slotCount: number;
    /**
     * page items: [main, slot1 … slotN, info, status] - undefined = empty slot / no info / no status. The index is the
     * number of the item in its id `<page>?<index>`.
     */
    elements: (NSPanel.PageItemDataItemsOptions | undefined)[];
    /** slots whose state does not exist or does not fit the kind of the slot (log) */
    skipped: string[];
}

/**
 * Everything the device page needs, read from the objects of the device and its states.
 *
 * @param source runtime configuration of the device item (main)
 * @param details the device part of the item
 * @param page the device page
 * @param getObject reads an object (states controller, cached)
 * @param translate translates a key (library.getTranslation)
 * @param language the language of the system
 * @returns headline, page items and the skipped slots
 */
export async function devicePageElements(
    source: NSPanel.PageItemDataItemsOptionsWithOutTemplate,
    details: DeviceDetailsRuntime,
    page: DevicePageRuntime,
    getObject: (id: string) => Promise<ioBroker.Object | null>,
    translate: (key: string) => string,
    language: ioBroker.Languages,
): Promise<DevicePageElements> {
    const device = await getObject(details.deviceId);
    const headline = nameOfCommon(device?.common?.name, language) || details.deviceId.split('.').pop() || '';
    const kinds = DEVICE_PAGE_LAYOUTS[page.layout];
    const skipped: string[] = [];
    const readCommon = async (ref: DevicePageStateRef | null): Promise<DeviceDetailStateCommon | undefined> => {
        if (!ref) {
            return undefined;
        }
        const obj = await getObject(ref.id);
        if (obj?.type !== 'state') {
            skipped.push(ref.id);
            return undefined;
        }
        return obj.common;
    };
    // the slots that exist, for the names (duplicates are told apart only among the slots)
    const present: { index: number; entry: DevicePageStateRef; common: DeviceDetailStateCommon }[] = [];
    for (let i = 0; i < kinds.length; i++) {
        const ref = page.slots[i] ?? null;
        const common = await readCommon(ref);
        if (ref && common) {
            present.push({ index: i, entry: ref, common });
        }
    }
    const names = deviceDetailRowNames(
        details.deviceId,
        present.map(p => p.entry),
        present.map(p => p.common),
        translate,
        language,
        null,
    );
    const slots: (NSPanel.PageItemDataItemsOptions | undefined)[] = kinds.map(() => undefined);
    present.forEach((p, n) => {
        const item = devicePageSlotItem(details.deviceId, kinds[p.index], p.entry, p.common, names[n] ?? '');
        if (!item) {
            skipped.push(p.entry.id);
        }
        slots[p.index] = item;
    });
    const statusCommon = await readCommon(page.status ?? null);
    const status =
        page.status && statusCommon ? devicePageStatusItem(details.deviceId, page.status, statusCommon) : undefined;
    return {
        headline,
        slotCount: kinds.length,
        elements: [
            devicePageMainItem(source, details, page),
            ...slots,
            page.showInfo ? devicePageInfoItem(details) : undefined,
            status,
        ],
        skipped,
    };
}

/**
 * The page configuration of the device page: not editable, the headline is the name of the device.
 *
 * @param uniqueID id of the page
 * @param layout the layout
 * @param alwaysOn alwaysOn of the page the item lies on
 * @param content headline and elements ({@link devicePageElements})
 * @returns the page configuration
 */
export function devicePagePageConfig(
    uniqueID: string,
    layout: DevicePageLayout,
    alwaysOn: 'none' | 'always' | 'action' | 'ignore',
    content: Pick<DevicePageElements, 'headline' | 'slotCount' | 'elements'>,
): PageBase {
    return {
        uniqueID,
        alwaysOn,
        dpInit: '',
        pageItems: [],
        config: {
            card: cardDeviceOf(layout),
            data: { headline: { type: 'const', constVal: content.headline } },
            slotCount: content.slotCount,
            elements: content.elements,
        },
    };
}
