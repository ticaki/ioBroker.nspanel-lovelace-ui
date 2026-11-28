/**
 * The device page of a device item (doc/ideas/device-details/README.md, section Geräteseite): optionally a long press
 * opens it instead of the detail page. HMI pages cardDevice1 / cardDevice2 / cardDevice3: a big device icon (main),
 * the slots of the layout ({@link DEVICE_PAGE_LAYOUTS}), a wide status line (field 6 of main) and an optional info icon
 * that opens the detail page. A normal page of the panel: the config manager builds its configuration
 * ({@link buildDevicePage}) when the item is configured, the panel creates it at the start like every other page
 * (a generated sub page of the page of the item, read-only in the navigation flow like `media-<id>`).
 *
 * `entityUpd~<heading>~<navigation>~<main>~<slot1>~…~<slotN>~<info>`, every element the 6 fields of a cardGrid cell
 * `type~intName~icon~iconColor~displayName~optionalValue` with the type as a number ({@link devicePageTypeNumber}).
 * cardDevice1 and cardDevice3 carry the stage of the status icon grid in field 6 of info ({@link devicePageInfoElement})
 * and get the cells of the grid with `devIcons~…` behind the `entityUpd` ({@link devicePageIconsMessage}). The web
 * models (`web-l`, `web-p`) get the same message with the elements of the extra slots of the layout appended:
 * `…~<info>~<extra1>~…~<extraE>` ({@link DEVICE_PAGE_EXTRA_SLOTS}).
 */
import { Color } from '../const/Color';
import { MAX_PANEL_PAYLOAD_BYTES } from '../const/definition';
import { ELLIPSIS, ELLIPSIS_FALLBACK, fitText, hasGlyph, textWidth } from '../const/text-width';
import { isVersionGreaterOrEqual, isWebModel } from '../const/tools';
import { isCardDeviceType } from '../types/function-and-const';
import { emptyChannelValueConfig, type AdminPageItemConfig } from '../types/adminShareConfig';
import type { NSPanel } from '../types/NSPanel';
import type { cardDeviceDataItemOptions, cardDeviceTypes, PageBase } from '../types/pages';
import type { NSpanelModel } from '../types/types';
import {
    DEVICE_DETAIL_ROW_ROLE,
    DEVICE_PAGE_EXTRA_SLOTS,
    DEVICE_PAGE_ICONS_COMMAND,
    DEVICE_PAGE_INFO_ROLE,
    DEVICE_PAGE_LAYOUTS,
    DEVICE_PAGE_RECEIVE_BYTES,
    DEVICE_PAGE_STATUS_COMMAND,
    DEVICE_PAGE_STATUS_MAX_BYTES,
    DEVICE_PAGE_STATUS_MAX_PARTS,
    DEVICE_PAGE_STATUS_SLOTS,
    DEVICE_PAGE_TEXT_FONT,
    DEVICE_PAGE_TEXT_MAX_BYTES,
    DEVICE_PAGE_NAVIGATION_ICON,
    DEVICE_PAGE_PROGRESS_ROLE,
    devicePageChannelTakesNavigation,
    devicePageFields,
    devicePageSlotAcceptsNavigation,
    devicePageSlotTargetOf,
    devicePageProgressPercent,
    devicePageSlotAccepts,
    devicePageChannelTakesLongPress,
    devicePageSlotAcceptsChannel,
    devicePageSlotLookOf,
    devicePageSlotTakesTextSize,
    devicePageSlotHiddenByStage,
    devicePageStageOf,
    devicePageStatusCapacity,
    deviceDetailRowKind,
    type DeviceDetailEntryConfig,
    type DeviceDetailsRuntime,
    type DevicePageLayout,
    type DevicePageRuntime,
    type DevicePageSlotKind,
    type DevicePageSlotLook,
    type DevicePageSlotRef,
    type DevicePageStateRef,
    type DevicePageStatusStage,
} from '../types/deviceDetails';
import {
    deviceDetailRowIcon,
    deviceDetailRowItem,
    deviceDetailRowLook,
    deviceDetailRowNames,
    nameOfCommon,
    type DeviceDetailStateCommon,
} from './device-details';

/**
 * @param pageName unique name of the page the device item lies on
 * @param deviceId id of the device
 * @returns unique name of the device page of this device on this page
 */
export function devicePageName(pageName: string, deviceId: string): string {
    return `device-${pageName}-${deviceId}`;
}

/**
 * first TFT version with the pages cardDevice1..3 (HMI/tools/card_device.py raises pageStartup.tRelease to it); the
 * published TFT 6.2.0 has no device pages.
 */
export const CARD_DEVICE_MIN_TFT = '6.3.0';

/**
 * models that have the device pages: every model - the HMIs of eu, us-l and us-p and the web panel in the layouts of
 * web-l and web-p
 */
export const CARD_DEVICE_MODELS: ReadonlySet<NSpanelModel> = new Set<NSpanelModel>([
    'eu',
    'us-l',
    'us-p',
    'web-l',
    'web-p',
]);

/** an element without content (empty slot, no info): what cardGrid sends for an empty cell - the HMI hides it */
export const DEVICE_PAGE_EMPTY_ELEMENT = '~~~~~';

/**
 * The type of an element as the device pages take it (TFT device13, `HMI/tools/card_device.py` TYPE_NAMES): 0 hidden,
 * 1 only sends (text, button, switch and every other type), 2-5 a popup at the touch, 6-9 a popup after 500 ms.
 */
const DEVICE_PAGE_TYPE_NUMBERS: Readonly<Record<string, number>> = {
    delete: 0,
    shutter: 2,
    shutter2: 3,
    input_sel: 4,
    timer: 5,
    light: 6,
    light2: 7,
    fan: 8,
    number: 9,
};

/**
 * @param type the type of a page item payload (field 1)
 * @returns the type as the device pages take it ({@link DEVICE_PAGE_TYPE_NUMBERS}, any other type 1); an empty type
 * stays empty (the HMI reads it as 0 = hidden, an empty element stays `~~~~~`)
 */
export function devicePageTypeNumber(type: string): string {
    if (type === '') {
        return '';
    }
    return String(DEVICE_PAGE_TYPE_NUMBERS[type] ?? 1);
}

/**
 * Field 1 of an element of a device page as a number ({@link devicePageTypeNumber}) - the last step before the element
 * is sent: the functions that build the element read the type name.
 *
 * @param element an element (main, slot, info, a cell of the status grid)
 * @returns the element with the type as a number
 */
export function devicePageNumberedElement(element: string): string {
    const at = element.indexOf('~');
    if (at < 0) {
        return element;
    }
    return devicePageTypeNumber(element.slice(0, at)) + element.slice(at);
}

/** what decides whether a panel can show the device page */
export interface CardDeviceTarget {
    model: NSpanelModel;
    /** web panel or web clone: draws the page in the browser, no TFT */
    isVirtual: boolean;
    /** TFT version of the display (info.nspanel.displayVersion) */
    displayVersion: string;
}

/**
 * true if the panel has the device pages: a model of {@link CARD_DEVICE_MODELS} (all of them), a web panel always
 * (web-l, web-p and the web clones of hardware panels), a hardware panel from {@link CARD_DEVICE_MIN_TFT} on.
 * Otherwise (an older or unknown TFT) the long press opens the detail page.
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
 * The pages and nodes of a panel without the device pages: for a model that has none ({@link CARD_DEVICE_MODELS} -
 * today every model has them) - its device items open the detail page instead, a device page would be a broken page.
 *
 * @param pages the pages of the panel
 * @param navigation its navigation nodes
 * @returns both without the device pages and their nodes
 */
export function withoutDevicePages<
    P extends { uniqueID: string; config?: { card: string } } | null | undefined,
    N extends { name: string } | null | undefined,
>(pages: P[], navigation: N[]): { pages: P[]; navigation: N[] } {
    const devicePages = new Set<string>();
    for (const page of pages) {
        if (page && isCardDeviceType(page.config?.card)) {
            devicePages.add(page.uniqueID);
        }
    }
    if (devicePages.size === 0) {
        return { pages, navigation };
    }
    return {
        pages: pages.filter(p => !p || !devicePages.has(p.uniqueID)),
        navigation: navigation.filter(n => !n || !devicePages.has(n.name)),
    };
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
 * @param text a text
 * @returns its bytes on the wire (UTF-8)
 */
function byteLength(text: string): number {
    return Buffer.byteLength(text, 'utf8');
}

/**
 * @param text a text
 * @param maxBytes maximum bytes (UTF-8)
 * @returns the longest prefix of whole characters that has at most maxBytes bytes
 */
export function cutToBytes(text: string, maxBytes: number): string {
    if (byteLength(text) <= maxBytes) {
        return text;
    }
    let out = '';
    let bytes = 0;
    for (const char of text) {
        bytes += byteLength(char);
        if (bytes > maxBytes) {
            break;
        }
        out += char;
    }
    return out;
}

/**
 * @param text a text
 * @param maxBytes maximum bytes (UTF-8)
 * @param ellipsis what is appended when the text is cut
 * @returns the text, or its longest prefix that fits together with the ellipsis (spaces in front of the ellipsis
 * dropped); '' when not even one character fits with it
 */
function cutToBytesWithEllipsis(text: string, maxBytes: number, ellipsis: string): string {
    if (byteLength(text) <= maxBytes) {
        return text;
    }
    const head = cutToBytes(text, maxBytes - byteLength(ellipsis)).trimEnd();
    return head ? `${head}${ellipsis}` : '';
}

/**
 * @param model panel model (font tables)
 * @returns what marks a cut text: '…' if font 0 has it, else '...'
 */
function statusEllipsis(model: NSpanelModel): string {
    return hasGlyph(ELLIPSIS.codePointAt(0) ?? 0, DEVICE_PAGE_TEXT_FONT, model) ? ELLIPSIS : ELLIPSIS_FALLBACK;
}

/** after these characters a status text may be split (comma, full stop, semicolon, dashes) - not inside a number */
const STATUS_BREAK_AFTER: ReadonlySet<string> = new Set([',', '.', ';', '–', '—']);

/**
 * @param chars the characters of a text
 * @param at a position inside the text
 * @returns true when the text may be split in front of `at`: after a punctuation mark of
 * {@link STATUS_BREAK_AFTER} that no digit follows ("1,5" and "23.5" stay whole)
 */
function isStatusBreak(chars: readonly string[], at: number): boolean {
    return STATUS_BREAK_AFTER.has(chars[at - 1]) && !/\d/.test(chars[at]);
}

/**
 * The status text (field 6 of main) as the parts the status line shows one after the other. Line breaks become
 * spaces, `~` is dropped.
 * - The text fits the line of the layout on this model (px in font 0, {@link devicePageFields}) and
 *   {@link DEVICE_PAGE_STATUS_MAX_BYTES}: one part, unchanged.
 * - Else it is split into parts that each fit the line and the bytes: at the last space (the space is dropped) or
 *   behind the last comma, full stop, semicolon or dash that fits; a word that is too long on its own is cut at a
 *   character.
 * - At most {@link DEVICE_PAGE_STATUS_MAX_PARTS} parts: what does not fit the last one is dropped, that part ends
 *   with the ellipsis ('…' if font 0 has it, else '...').
 *
 * @param text the status text
 * @param layout the layout
 * @param model panel model (width of the line, font tables)
 * @returns the parts, at least one ('' for an empty text)
 */
export function splitDevicePageStatus(text: string, layout: DevicePageLayout, model: NSpanelModel): string[] {
    const flat = text.replace(/[\r\n]+/g, ' ').replaceAll('~', '');
    const width = devicePageFields(layout, model).status;
    const fits = (part: string): boolean =>
        textWidth(part, DEVICE_PAGE_TEXT_FONT, model) <= width && byteLength(part) <= DEVICE_PAGE_STATUS_MAX_BYTES;
    if (fits(flat)) {
        return [flat];
    }
    const chars = Array.from(flat.trim());
    const parts: string[] = [];
    let start = 0;
    while (start < chars.length) {
        if (parts.length === DEVICE_PAGE_STATUS_MAX_PARTS - 1) {
            // the last part: the rest, cut to the width of the line and the bytes of the text field
            const rest = chars.slice(start).join('');
            const ellipsis = statusEllipsis(model);
            parts.push(
                cutToBytesWithEllipsis(
                    fitText(rest, DEVICE_PAGE_TEXT_FONT, model, width, { ellipsis }),
                    DEVICE_PAGE_STATUS_MAX_BYTES,
                    ellipsis,
                ),
            );
            break;
        }
        // the longest run of characters from start that fits
        let end = start;
        let part = '';
        while (end < chars.length && fits(part + chars[end])) {
            part += chars[end];
            end++;
        }
        if (end < chars.length && chars[end] !== ' ') {
            // not at the end of a word: back to the last place to split, without one the word is cut here
            let at = end;
            while (at > start && chars[at] !== ' ' && !isStatusBreak(chars, at)) {
                at--;
            }
            // a part has at least one character, also when not even that fits the line
            end = at > start ? at : Math.max(end, start + 1);
        }
        parts.push(chars.slice(start, end).join('').trimEnd());
        start = end;
        while (chars[start] === ' ') {
            start++;
        }
    }
    return parts;
}

/**
 * @param part a part of the status text ({@link splitDevicePageStatus}; `~` is dropped)
 * @returns the message that shows it in the status line of the device page, nothing else changes
 */
export function devicePageStatusMessage(part: string): string {
    return `${DEVICE_PAGE_STATUS_COMMAND}~${part.replaceAll('~', '')}`;
}

/**
 * The main element with the status text in field 6: fields 1-5 of the payload of the main item (the name cut to
 * {@link DEVICE_PAGE_TEXT_MAX_BYTES}), field 6 the status (empty without status).
 *
 * @param mainPayload payload of the main item ('' = none)
 * @param status the part of the status text that is shown ({@link splitDevicePageStatus})
 * @returns the element
 */
export function devicePageMainElement(mainPayload: string, status: string): string {
    // the HMI shows the status line also when main is hidden (empty type)
    const fields = mainPayload ? mainPayload.split('~') : [];
    const head = fields.length >= 6 ? fields.slice(0, 5) : ['', '', '', '', ''];
    head[4] = cutToBytes(head[4], DEVICE_PAGE_TEXT_MAX_BYTES);
    return [...head, status.replace(/~/g, '')].join('~');
}

/**
 * Name and value of an element (fields 5 and 6) cut to the text buffers of the HMI
 * ({@link DEVICE_PAGE_TEXT_MAX_BYTES}, whole characters): the HMI would cut them anyway, possibly inside a character,
 * and the length of the message could not be told. Anything that is not an element of 6 fields stays as it is.
 *
 * @param element the element of a slot or of info
 * @returns the element
 */
export function devicePageClampElement(element: string): string {
    const fields = element.split('~');
    if (fields.length !== 6) {
        return element;
    }
    fields[4] = cutToBytes(fields[4], DEVICE_PAGE_TEXT_MAX_BYTES);
    fields[5] = cutToBytes(fields[5], DEVICE_PAGE_TEXT_MAX_BYTES);
    return fields.join('~');
}

/**
 * @param layout the layout
 * @param model panel model
 * @returns the bytes an `entityUpd` of the page may have: the receive buffer of its HMI page, at most what the
 * display takes. No limit (Infinity) for the web models `web-l` / `web-p`: they have no HMI page, and the transport
 * of a web panel (web socket) has no receive buffer (PanelSend.isTooLong never limits a web panel)
 */
export function devicePageMaxPayloadBytes(layout: DevicePageLayout, model: NSpanelModel): number {
    if (isWebModel(model)) {
        return Number.POSITIVE_INFINITY;
    }
    return Math.min(DEVICE_PAGE_RECEIVE_BYTES[layout], MAX_PANEL_PAYLOAD_BYTES);
}

/**
 * The `entityUpd` of the device page with the shown part of the status text in field 6 of main. When the message
 * has more bytes than the page takes ({@link devicePageMaxPayloadBytes}), the status line gives way: the part is cut
 * by the overhang, with an ellipsis. Names and values are already limited ({@link devicePageClampElement}), so that
 * is enough for a message the adapter builds. A web model has no limit: there the elements of the extra slots never
 * shorten the status line and are never cut off themselves.
 *
 * @param head `entityUpd~<heading>~<navigation>`
 * @param mainPayload payload of the main item ('' = none)
 * @param elements the elements of the slots and of info, on a web model followed by those of the extra slots
 * @param status the part of the status text that is shown ({@link splitDevicePageStatus}; '' = none)
 * @param layout the layout
 * @param model panel model (font tables)
 * @returns the message
 */
export function devicePagePayload(
    head: string,
    mainPayload: string,
    elements: readonly string[],
    status: string,
    layout: DevicePageLayout,
    model: NSpanelModel,
): string {
    // the type as a number in main and every element, the navigation in the head keeps its names
    const numbered = elements.map(devicePageNumberedElement);
    const build = (field: string): string =>
        [head, devicePageNumberedElement(devicePageMainElement(mainPayload, field)), ...numbered].join('~');
    const payload = build(status);
    const over = byteLength(payload) - devicePageMaxPayloadBytes(layout, model);
    if (over <= 0) {
        return payload;
    }
    return build(cutToBytesWithEllipsis(status, Math.max(0, byteLength(status) - over), statusEllipsis(model)));
}

/**
 * The info element of a device page: name and value cut ({@link devicePageClampElement}); on cardDevice1 and
 * cardDevice3 field 6 is the stage of the status icon grid (empty for stage 0), also when there is no info icon
 * (`~~~~~<stage>`, the HMI hides an icon of type 0). cardDevice2 has no stage, its info stays as it is.
 *
 * @param payload payload of the info item ('' = no info icon)
 * @param layout the layout
 * @param stage the stage ({@link devicePageStageOf})
 * @returns the element
 */
export function devicePageInfoElement(payload: string, layout: DevicePageLayout, stage: DevicePageStatusStage): string {
    const element = devicePageClampElement(payload || DEVICE_PAGE_EMPTY_ELEMENT);
    if (DEVICE_PAGE_STATUS_SLOTS[layout] === 0) {
        return element;
    }
    const fields = element.split('~');
    const own = fields.length === 6 ? fields : DEVICE_PAGE_EMPTY_ELEMENT.split('~');
    const shown = devicePageStageOf(layout, stage);
    own[5] = shown > 0 ? String(shown) : '';
    return own.join('~');
}

/**
 * The `devIcons` message of the status icon grid: one cell per place of the grid ({@link DEVICE_PAGE_STATUS_SLOTS}:
 * cardDevice1 16, cardDevice3 8), each `type~intName~icon~iconColor` with the type as a number. The filled places move
 * up without gaps, in the order of the grid (column by column: top, bottom, next column); the rest are empty cells
 * `~~~` (the HMI reads an empty type as 0: empty cell).
 *
 * @param elements the elements of the status icon places in their order ({@link devicePageStatusIconElement}; an
 * empty element is left out)
 * @param layout the layout
 * @returns the message
 */
export function devicePageIconsMessage(elements: readonly string[], layout: DevicePageLayout): string {
    const count = DEVICE_PAGE_STATUS_SLOTS[layout];
    const cells: string[] = [];
    for (const element of elements) {
        const fields = element.split('~');
        if (fields.length < 4 || !fields[0]) {
            continue;
        }
        cells.push(devicePageNumberedElement(fields.slice(0, 4).join('~')));
    }
    const out = cells.slice(0, count);
    while (out.length < count) {
        out.push('~~~');
    }
    return [DEVICE_PAGE_ICONS_COMMAND, ...out].join('~');
}

/**
 * The number of the page item of a slot of a device page. The page items are
 * `[main, slot 1 … slot N, info, status, status icon 1 … status icon M, extra slot 1 … extra slot E]` with M fixed
 * per layout ({@link DEVICE_PAGE_STATUS_SLOTS}): the numbers of main, the slots, info, the status item and the status
 * icons (and with them the ids `<page>?<n>` of the elements) are the same with and without extra slots and in every
 * stage.
 *
 * @param layout the layout
 * @param slot index of the slot in the configuration (0 = slot 1, N = extra slot 1)
 * @returns the number of its page item
 */
export function devicePageSlotItemIndex(layout: DevicePageLayout, slot: number): number {
    const count = DEVICE_PAGE_LAYOUTS[layout].length;
    return slot < count ? slot + 1 : slot + 3 + DEVICE_PAGE_STATUS_SLOTS[layout];
}

/**
 * @param layout the layout
 * @param place index of the status icon place (0 = the first cell of the grid)
 * @returns the number of its page item ({@link devicePageSlotItemIndex})
 */
export function devicePageStatusItemIndex(layout: DevicePageLayout, place: number): number {
    return DEVICE_PAGE_LAYOUTS[layout].length + 3 + place;
}

/**
 * @param config the configuration of a page
 * @returns true for the configuration of a device page
 */
export function isCardDeviceConfig(config: PageBase['config'] | undefined): config is cardDeviceDataItemOptions {
    return !!config && isCardDeviceType(config.card);
}

/**
 * @param card a HMI page of the device page
 * @returns its layout
 */
export function layoutOfCardDevice(card: cardDeviceTypes): DevicePageLayout {
    switch (card) {
        case 'cardDevice1':
            return 1;
        case 'cardDevice2':
            return 2;
        case 'cardDevice3':
            return 3;
    }
}

/**
 * The configuration of a device page as a panel of this model uses it: an HMI model (`eu`, `us-l`, `us-p`, also the
 * web clone of such a panel) never shows the extra slots - their page items are left out, so nothing is created or
 * subscribed for them, and the page is the one without extra slots. A web model keeps the page as it is, so does
 * every page that is no device page.
 *
 * @param page the configuration of a page ({@link buildDevicePage})
 * @param model panel model
 * @returns the configuration for the model (the same object when nothing is left out)
 */
export function devicePageOfModel(page: PageBase, model: NSpanelModel): PageBase {
    if (isWebModel(model) || !isCardDeviceConfig(page.config) || !page.pageItems) {
        return page;
    }
    // main, the slots of the layout, info, the status item and the status icon places
    const layout = layoutOfCardDevice(page.config.card);
    const count = DEVICE_PAGE_LAYOUTS[layout].length;
    const items = count + 3 + DEVICE_PAGE_STATUS_SLOTS[layout];
    if (page.pageItems.length <= items) {
        return page;
    }
    const config: cardDeviceDataItemOptions = { ...page.config };
    if (config.channelSlots) {
        config.channelSlots = config.channelSlots.filter(slot => slot < count);
    }
    return { ...page, pageItems: page.pageItems.slice(0, items), config };
}

/**
 * The element of a `status` slot: only type, id, icon and color - name and value (fields 5 and 6) are always empty,
 * an empty payload is the empty element.
 *
 * @param payload payload of the page item of the slot ('' = none)
 * @returns the element
 */
export function devicePageStatusIconElement(payload: string): string {
    const fields = payload ? payload.split('~') : [];
    if (fields.length < 6 || !fields[0]) {
        return DEVICE_PAGE_EMPTY_ELEMENT;
    }
    return [...fields.slice(0, 4), '', ''].join('~');
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
 * The main element: the device item itself (icon `devicePage.icon`, else the one of the item; color as on the page of
 * the item). Its name is always the name of the device - the headline of the device page, whatever the short tap.
 * A tap does what the short tap of the item does (`state`: the state is switched / a button pressed; `none`: a text,
 * nothing). A short tap `navigation`, `popup` or `devicePage` is not built here: main is a text with icon, name and
 * on/off of the item, without action. Its field 6 is replaced by the status line ({@link devicePageMainElement}).
 *
 * Without a source (no item behind the page) main is a text with the icon of the device page and the name.
 *
 * @param source runtime configuration of the device item, undefined = none
 * @param details the device part of the item
 * @param page the device page
 * @param name the name of the device (the headline of the device page)
 * @returns the page item of main
 */
export function devicePageMainItem(
    source: NSPanel.PageItemDataItemsOptionsWithOutTemplate | undefined,
    details: DeviceDetailsRuntime,
    page: DevicePageRuntime,
    name: string,
): NSPanel.PageItemDataItemsOptions {
    const nameItem: NSPanel.DataItemsOptions = { type: 'const', constVal: name };
    const text: NSPanel.PageItemButtonDataItemsOptions['data']['text'] = { true: nameItem, false: nameItem };
    // the device part stays for the button semantics of the short tap (read: false is pressed), without the device
    // page - there is no long press on the device page
    const deviceDetails: DeviceDetailsRuntime = { deviceId: details.deviceId, entries: details.entries };
    if (
        source &&
        (page.shortPress === 'state' || page.shortPress === 'none') &&
        (source.type === 'button' || source.type === 'switch' || source.type === 'text')
    ) {
        const item = structuredClone(source);
        item.deviceDetails = deviceDetails;
        delete item.devicePageName;
        item.dpInit = '';
        item.data.text = text;
        // text.states takes the name from common.states of the text - the name is fixed here
        if (item.role === 'text.states') {
            delete item.role;
        }
        if (page.icon) {
            item.data.icon = withIcon(item.data.icon, page.icon);
        }
        return item;
    }
    const data = source?.data;
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

/** an alias channel of a slot as page item, built with the page ({@link buildDevicePage}) */
export interface DevicePageChannelItem {
    /** common.role of the channel */
    role: string;
    /** the page item of the channel as the config manager builds it for a normal page */
    item: NSPanel.PageItemDataItemsOptions;
}

/**
 * The admin page item an alias channel of a slot is converted from: a standard item of the channel with the settings
 * of the slot - the fields of the page item dialog (`name`, icons, colors, `scale`, `textSize`, the fields of
 * DEVICE_PAGE_CHANNEL_ITEM_FIELDS, `longPress` where the role takes one), everything else the defaults of the role.
 * The navigation of the short tap is no field of the channel item - the device page handles it.
 *
 * @param ref the slot (`custom: 'channel'`)
 * @param role common.role of the channel
 * @returns the admin page item
 */
export function devicePageChannelAdminItem(ref: DevicePageSlotRef, role: string): AdminPageItemConfig {
    // the navigation of the tap is not handed to the channel item: it stays the item of its role (value, switch),
    // the device page adds the target where the tap reaches the adapter (buildDevicePage)
    const {
        longPress,
        isNavigation: _isNavigation,
        targetPage: _targetPage,
        ...look
    } = devicePageSlotLookOf(ref, false);
    const item: AdminPageItemConfig = { channelId: emptyChannelValueConfig(ref.id), ...look };
    if (longPress && devicePageChannelTakesLongPress(role)) {
        item.longPress = longPress;
    }
    return item;
}

/**
 * The page item of an alias channel in a slot: the page item of the channel as it is (icon, colors, name, tap and
 * popup of its role). Changed is only what the device page would draw wrong: in an `info`, `value` or `status` slot a
 * text item shows its icon, not its value in place of the icon (as it does on cardGrid) - the value stands in field 6;
 * a text item without value text (thermostat) takes the value of its icon text for it. Field 6 itself is fitted to
 * the kind of the slot when the page is sent ({@link devicePageChannelElement}).
 *
 * @param kind the kind of the slot
 * @param channel the channel
 * @returns the page item, undefined when the role does not fit the kind
 */
export function devicePageChannelSlotItem(
    kind: DevicePageSlotKind,
    channel: DevicePageChannelItem,
): NSPanel.PageItemDataItemsOptions | undefined {
    if (!devicePageSlotAcceptsChannel(kind, channel.role)) {
        return undefined;
    }
    const item = structuredClone(channel.item);
    if (item.type === 'text' && item.data?.icon && (kind === 'info' || kind === 'value' || kind === 'status')) {
        const icon = item.data.icon;
        const valueText = icon.true?.text;
        if (kind !== 'status' && valueText?.value && !item.data.entity2 && !item.data.text1) {
            item.data.entity2 = { value: valueText.value, unit: valueText.unit };
        }
        if (icon.true) {
            delete icon.true.text;
        }
        if (icon.false) {
            delete icon.false.text;
        }
    }
    return item;
}

/**
 * Field 6 of the element of an alias channel, fitted to the kind of its slot - the HMI draws a slot by its kind, blind
 * to the type of the element:
 * - `info` / `value`: a short readable value - a text, selection or timer its text, a number its value (without
 *   `|min|max`), a light, switch or fan on / off; a button and a shutter (whose field 6 is the icon list of its popup)
 *   nothing,
 * - `progress`: whole number 0-100 from `value|min|max` of a number,
 * - `switch`: `0` / `1`,
 * - `button`: `0` / `1` as on cardGrid, anything else nothing (the slot shows icon and name only),
 * - `status`: nothing ({@link devicePageStatusIconElement} clears name and value anyway).
 *
 * @param kind the kind of the slot
 * @param payload payload of the page item
 * @param onOff the text of on (true) / off (false) in the language of the panel
 * @returns the element
 */
export function devicePageChannelElement(
    kind: DevicePageSlotKind,
    payload: string,
    onOff: (on: boolean) => string,
): string {
    const fields = payload.split('~');
    if (fields.length < 6 || !fields[0]) {
        return payload;
    }
    const type = fields[0];
    const raw = fields[5];
    let value = '';
    switch (kind) {
        case 'info':
        case 'value':
            switch (type) {
                case 'text':
                case 'input_sel':
                case 'timer':
                    value = raw;
                    break;
                case 'number':
                    value = raw.split('|')[0];
                    break;
                case 'light':
                case 'light2':
                case 'switch':
                case 'fan':
                    value = onOff(raw === '1');
                    break;
            }
            break;
        case 'progress': {
            const [current, min, max] = raw.split('|').map(part => (part === '' ? NaN : Number(part)));
            value = String(
                devicePageProgressPercent(
                    current,
                    Number.isFinite(min) ? min : undefined,
                    Number.isFinite(max) ? max : undefined,
                ),
            );
            break;
        }
        case 'switch':
            value = raw === '1' ? '1' : '0';
            break;
        case 'button':
            value = raw === '0' || raw === '1' ? raw : '';
            break;
        case 'status':
            break;
    }
    return [...fields.slice(0, 5), value.replace(/~/g, '')].join('~');
}

/**
 * @param hex hex color `#rrggbb`
 * @returns the color as const data item, undefined when it cannot be read
 */
function colorItem(hex: string): NSPanel.DataItemsOptions | undefined {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) {
        return undefined;
    }
    return { type: 'const', constVal: Color.ConvertHexToRgb(hex) };
}

/**
 * @param kind the kind of the slot
 * @param look the own look
 * @returns the font of the icon as data item, undefined when none is set or the slot takes none
 */
function slotTextSizeItem(kind: DevicePageSlotKind, look: DevicePageSlotLook): NSPanel.DataItemsOptions | undefined {
    return look.textSize !== undefined && devicePageSlotTakesTextSize(kind)
        ? { type: 'const', constVal: look.textSize }
        : undefined;
}

/** icon and color of one state of an icon */
type LookBranch = { value?: NSPanel.DataItemsOptions | null; color?: NSPanel.DataItemsOptions | null };

/**
 * Puts the own look of a slot into the icon options of a page item.
 *
 * @param icon the icon options (changed)
 * @param icon.true icon and color while true
 * @param icon.false icon and color while false
 * @param icon.scale the color scale
 * @param look the own look
 * @param isBoolean the state is a boolean - anything else has no false and shows the true icon
 */
function applySlotLook(
    icon: { true?: LookBranch | null; false?: LookBranch | null; scale?: NSPanel.DataItemsOptions | null },
    look: DevicePageSlotLook,
    isBoolean: boolean,
): void {
    const branches = [
        { key: 'true', name: look.trueIcon, color: look.trueColor },
        { key: 'false', name: isBoolean ? look.falseIcon : look.trueIcon, color: look.falseColor },
    ] as const;
    for (const branch of branches) {
        const color = branch.color ? colorItem(branch.color) : undefined;
        if (!branch.name && !color) {
            continue;
        }
        const entry: LookBranch = { ...icon[branch.key] };
        if (branch.name) {
            entry.value = { type: 'const', constVal: branch.name };
        }
        if (color) {
            entry.color = color;
        }
        icon[branch.key] = entry;
    }
    if (look.scale) {
        icon.scale = { type: 'const', constVal: look.scale };
    }
}

/**
 * The own settings of a slot ({@link DevicePageSlotLook}) on the page item of a state:
 * - the icons and colors for true and false replace those of the mask entry / kind; a number or a text has no false
 *   and shows the true icon (as it does without own look),
 * - a color scale colors the icon (the bar of a `progress` slot) by the value of a number between the false and the
 *   true color - the row gets the state as `entity1` for it,
 * - a long press writes a state (`longPress`): a button sets it to true, a switch toggles it - only where the page
 *   item is a button or a switch ({@link devicePageSlotTakesLongPress}),
 * - the font of the icon (`textSize`, like on cardGrid) where the slot takes one ({@link devicePageSlotTakesTextSize}).
 *
 * A page item without icon stays as it is. The name is set when the item is built (buildDevicePage).
 *
 * @param item the page item of the slot (changed)
 * @param ref the slot
 * @param common common of the state
 * @param kind the kind of the slot
 * @returns the page item
 */
export function withDevicePageSlotLook(
    item: NSPanel.PageItemDataItemsOptions,
    ref: DevicePageSlotRef,
    common: DeviceDetailStateCommon,
    kind: DevicePageSlotKind,
): NSPanel.PageItemDataItemsOptions {
    // the older icon of a status slot is already in the item (devicePageStatusIconItem); the navigation of the tap
    // is no look (devicePageSlotItem)
    const {
        isNavigation: _isNavigation,
        targetPage: _targetPage,
        name: _name,
        ...look
    } = devicePageSlotLookOf(ref, false);
    if (Object.keys(look).length === 0) {
        return item;
    }
    const isBoolean = common.type === 'boolean';
    const textSize = slotTextSizeItem(kind, look);
    if (item.type === 'text' || item.type === 'button' || item.type === 'switch') {
        if (!item.data?.icon) {
            return item;
        }
        applySlotLook(item.data.icon, look, isBoolean);
        if (textSize) {
            item.data.icon.textSize = textSize;
        }
        if (look.scale && common.type === 'number' && !item.data.entity1) {
            item.data.entity1 = { value: { type: 'triggered', dp: ref.id } };
        }
        if (look.longPress && item.type !== 'text') {
            item.data.longPress = { type: 'state', dp: look.longPress };
        }
    } else if (item.type === 'input_sel' && item.data?.icon) {
        applySlotLook(item.data.icon, look, isBoolean);
        if (textSize) {
            item.data.icon.textSize = textSize;
        }
    }
    return item;
}

/**
 * The page item of a slot with a state (DEVICE_PAGE_LAYOUTS) with its own settings ({@link withDevicePageSlotLook}).
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
    entry: DevicePageSlotRef,
    common: DeviceDetailStateCommon,
    name: string,
): NSPanel.PageItemDataItemsOptions | undefined {
    const target = devicePageSlotTargetOf(entry);
    const item = devicePageStateSlotItem(deviceId, kind, entry, common, name, target !== '');
    if (!item) {
        return undefined;
    }
    return withDevicePageNavigation(withDevicePageSlotLook(item, entry, common, kind), target);
}

/**
 * The short tap of a slot that navigates: the target page as `setNavi`, the field of every navigation item (the
 * navigation flow reads it). On the device page the tap then only navigates (PageItem.onCommand).
 *
 * @param item the page item of the slot
 * @param target name of the target page, '' = the tap does what the element does on its own
 * @returns the page item
 */
export function withDevicePageNavigation(
    item: NSPanel.PageItemDataItemsOptions,
    target: string,
): NSPanel.PageItemDataItemsOptions {
    const out = structuredClone(item);
    if (target && out.data) {
        const setNavi: NSPanel.DataItemsOptions = { type: 'const', constVal: target };
        Object.assign(out.data, { setNavi });
    }
    return out;
}

/**
 * The page item of a navigation slot (`custom: 'navigation'`): a text with icon and name only - no state, field 6
 * stays empty. The tap opens the target page (`setNavi`, PageItem.onCommand). Icon and color are the own
 * ones of the slot (`trueIcon`, `trueColor`), else {@link DEVICE_PAGE_NAVIGATION_ICON} in the color of the group
 * info, the font of the icon the own one ({@link devicePageSlotTakesTextSize}); the name is the own text, else the
 * name of the target page.
 *
 * @param kind the kind of the slot
 * @param ref the slot
 * @returns the page item, undefined without target page or in a slot that needs a value
 * (devicePageSlotAcceptsNavigation)
 */
export function devicePageNavigationSlotItem(
    kind: DevicePageSlotKind,
    ref: DevicePageSlotRef,
): NSPanel.PageItemDataItemsOptions | undefined {
    const target = ref.custom === 'navigation' ? devicePageSlotTargetOf(ref) : '';
    if (!target || !devicePageSlotAcceptsNavigation(kind)) {
        return undefined;
    }
    const icon: NSPanel.DataItemsOptions = { type: 'const', constVal: ref.trueIcon || DEVICE_PAGE_NAVIGATION_ICON };
    const color: NSPanel.DataItemsOptions = (ref.trueColor ? colorItem(ref.trueColor) : undefined) ?? {
        type: 'const',
        constVal: Color.deviceInfo,
    };
    const name: NSPanel.DataItemsOptions = { type: 'const', constVal: ref.name || target };
    const textSize = slotTextSizeItem(kind, ref);
    return {
        type: 'text',
        role: DEVICE_DETAIL_ROW_ROLE,
        dpInit: '',
        data: {
            setNavi: { type: 'const', constVal: target },
            icon: {
                true: { value: icon, color },
                false: { value: icon, color },
                ...(textSize ? { textSize } : {}),
            },
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
 * - `switch`: the switch row of the detail page (OnOff),
 * - `status`: {@link devicePageStatusIconItem}.
 *
 * The state may be any state, also one outside the device (own data point, `DevicePageSlotRef.custom` `state`): only
 * its id and common are used, the device only for the look of a state with mask entry.
 *
 * @param deviceId id of the device
 * @param kind the kind of the slot
 * @param entry the state of the slot
 * @param common common of the state
 * @param name name of the slot
 * @param navigates the tap of the slot navigates: an `info` slot shows a selection as text (its popup would come
 * before the tap)
 * @returns the page item, undefined when the state does not fit the kind (devicePageSlotAccepts)
 */
function devicePageStateSlotItem(
    deviceId: string,
    kind: DevicePageSlotKind,
    entry: DevicePageStateRef,
    common: DeviceDetailStateCommon,
    name: string,
    navigates = false,
): NSPanel.PageItemDataItemsOptions | undefined {
    if (!devicePageSlotAccepts(kind, common)) {
        return undefined;
    }
    const nameItem: NSPanel.DataItemsOptions = { type: 'const', constVal: name };
    const value: NSPanel.DataItemsOptions = { type: 'triggered', dp: entry.id };
    switch (kind) {
        case 'info':
            return {
                ...deviceDetailRowItem(deviceId, entry, common, name, navigates ? 'all' : 'keepSelect'),
                dpInit: '',
            };
        case 'value':
            return { ...deviceDetailRowItem(deviceId, entry, common, name, 'all'), dpInit: '' };
        case 'switch':
            return { ...deviceDetailRowItem(deviceId, entry, common, name), dpInit: '' };
        case 'status':
            return devicePageStatusIconItem(deviceId, entry, common);
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
            const icon = deviceDetailRowIcon(look, entry.id);
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
 * The page item of a `status` slot: a small icon only - the read only text row of the state (icon of the mask entry /
 * the kind, color of its group; a boolean in the colors activated / deactivated) without name and value, so fields 5
 * and 6 stay empty. An own icon of the slot (`entry.icon`) replaces the icon - also the level icon of a battery -,
 * the colors stay. No tap: a stray
 * `button` event of a text row of the device page does nothing.
 *
 * @param deviceId id of the device
 * @param entry the state of the slot
 * @param common common of the state
 * @returns the page item
 */
export function devicePageStatusIconItem(
    deviceId: string,
    entry: DevicePageStateRef,
    common: DeviceDetailStateCommon,
): NSPanel.PageItemDataItemsOptions {
    const row = deviceDetailRowItem(deviceId, entry, common, '', 'all', entry.icon ?? '');
    if (row.type === 'text' && row.data) {
        // no value: entity2 is the value text, text1 the on/off text - entity1 (color of a boolean) stays
        delete row.data.entity2;
        delete row.data.text1;
    }
    return { ...row, dpInit: '' };
}

/**
 * The hidden status item: a read only text row of the state of the status line - its field 6 (value with unit, the
 * translated text of common.states, a boolean on/off) becomes field 6 of main. It is never sent as an element.
 * The state may be any state, also one outside the device (own data point, `DevicePageStatusRef.custom`): only its
 * id and common are used, the device only for the look of the row (icon and color, never shown).
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

/** the target pages already reported as missing, per panel */
const missingDevicePageTargets = new WeakMap<object, Set<string>>();

/**
 * A target page of a slot is no node of the panel: it is reported once per panel and target.
 *
 * @param panel the panel
 * @param target name of the target page
 * @returns true when it was not reported before
 */
export function reportMissingDevicePageTarget(panel: object, target: string): boolean {
    const reported = missingDevicePageTargets.get(panel) ?? new Set<string>();
    missingDevicePageTargets.set(panel, reported);
    if (reported.has(target)) {
        return false;
    }
    reported.add(target);
    return true;
}

/**
 * What a device page is built from: the device, the slots, the status line and the info icon - nothing about who opens
 * the page. Today the device item of a page brings it (its `main`), the page itself does not depend on it.
 */
export interface DevicePageSource {
    /** id of the device or channel object: headline and mask of the states */
    deviceId: string;
    /** the rows of the detail page the info icon opens */
    entries: DeviceDetailEntryConfig[];
    /** layout, slots, status line, info icon and icon */
    page: DevicePageRuntime;
    /** page item main takes icon, state and tap from (the device item); missing = a text with the icon of the page */
    main?: NSPanel.PageItemDataItemsOptionsWithOutTemplate;
}

/** what {@link buildDevicePage} reads with */
export interface DevicePageBuildContext {
    /** reads an object */
    getObject: (id: string) => Promise<ioBroker.Object | null>;
    /** translates a key (library.getTranslation) */
    translate: (key: string) => string;
    /** the language of the system */
    language: ioBroker.Languages;
    /**
     * the page item of an admin page item, built the normal way (config manager, as a cardGrid cell), undefined when
     * it gives none; may throw
     */
    pageItemOf: (item: AdminPageItemConfig) => Promise<NSPanel.PageItemDataItemsOptions | undefined>;
}

/** an empty slot, no info icon, no status line: an empty page item (the element stays empty, PageDevice) */
const EMPTY_DEVICE_PAGE_ITEM: NSPanel.PageItemDataItemsOptions = { type: 'empty', data: undefined };

/**
 * The page item of an alias channel in a slot, built by the config manager.
 *
 * @param kind the kind of the slot
 * @param ref the slot (`custom: 'channel'`)
 * @param ctx what the page is built with
 * @returns the page item, or the reason why the slot stays empty
 */
async function devicePageChannelSlot(
    kind: DevicePageSlotKind,
    ref: DevicePageSlotRef,
    ctx: DevicePageBuildContext,
): Promise<{ item?: NSPanel.PageItemDataItemsOptions; error?: string }> {
    const where = `channel ${ref.id}`;
    try {
        const obj = await ctx.getObject(ref.id);
        if (!obj) {
            return { error: `${where} not found!` };
        }
        const rawRole: unknown = obj.common?.role;
        const role = typeof rawRole === 'string' ? rawRole : '';
        if (!devicePageSlotAcceptsChannel(kind, role)) {
            return { error: `${where} with role ${role || '(none)'} does not fit the slot!` };
        }
        const item = await ctx.pageItemOf(devicePageChannelAdminItem(ref, role));
        // a template item (timeTable) is resolved by its page - no slot can show it
        const slotItem =
            item && !('template' in item && item.template)
                ? devicePageChannelSlotItem(kind, { role, item })
                : undefined;
        if (!slotItem) {
            return { error: `${where} gives no page item!` };
        }
        // the tap navigates where it reaches the adapter - elsewhere the popup of the HMI comes first
        const target = devicePageChannelTakesNavigation(role) ? devicePageSlotTargetOf(ref) : '';
        return { item: withDevicePageNavigation(slotItem, target) };
    } catch (e) {
        return { error: `${where}: ${e instanceof Error ? e.message : String(e)}` };
    }
}

/**
 * The configuration of a device page, built like every other page when the panel configuration is built (the
 * objects are read here once, not when the page is opened). Its page items are the elements in the order
 * `[main, slot1 … slotN, info, status, status icon 1 … status icon M]` - an empty slot, no info and no status line an
 * empty item; M is fixed per layout ({@link DEVICE_PAGE_STATUS_SLOTS}). When the page has extra slots (`page.slots`
 * longer than the slots of the layout - they are switched on and one of them is filled), their items follow:
 * `[…, status icon M, extra1 … extraE]` ({@link devicePageSlotItemIndex}); an extra slot is built like a slot of the
 * layout of the same kind. The model of the panel is not known here - a panel that shows no extra slots leaves their
 * items out ({@link devicePageOfModel}).
 *
 * The stage of the status icon grid ({@link devicePageStageOf}) decides what is built: the status icon places beyond
 * the stage ({@link devicePageStatusCapacity}; stage 0: all of them) and the slots of the layout the grid covers
 * ({@link devicePageSlotHiddenByStage}: cardDevice1 stage 3 the info slots 1-2, cardDevice3 stage 1 tile 1, stage 2
 * tiles 1 and 2) are left as they are configured but not read, not built and not reported - their place is an empty
 * item, so the numbers of all items stay.
 *
 * The names of the slots of the layout are found among these slots only, so the elements of the layout are the same
 * with and without extra slots; an extra slot is told apart from all slots.
 *
 * The page items:
 * - main: {@link devicePageMainItem},
 * - a slot with a state of the device or an own data point: the item of the mask of the detail page (icon, name,
 *   color group, the text that tells duplicates apart) with the own settings of the slot ({@link devicePageSlotItem}),
 * - a slot with an alias channel: the page item the config manager builds for the channel on a normal page,
 * - a navigation slot: icon and name ({@link devicePageNavigationSlotItem}),
 * - the short tap of a slot that navigates: `setNavi` ({@link withDevicePageNavigation}),
 * - info and the hidden status item.
 *
 * @param uniqueID unique name of the page
 * @param alwaysOn alwaysOn of the page
 * @param source device, slots, status line and info
 * @param ctx what the page is read and built with
 * @returns the page configuration and the slots left empty (missing state or channel, not fitting the slot)
 */
export async function buildDevicePage(
    uniqueID: string,
    alwaysOn: 'none' | 'always' | 'action' | 'ignore',
    source: DevicePageSource,
    ctx: DevicePageBuildContext,
): Promise<{ page: PageBase; messages: string[] }> {
    const { deviceId, page } = source;
    const details: DeviceDetailsRuntime = { deviceId, entries: source.entries };
    const device = await ctx.getObject(deviceId);
    const headline = nameOfCommon(device?.common?.name, ctx.language) || deviceId.split('.').pop() || '';
    const layoutKinds = DEVICE_PAGE_LAYOUTS[page.layout];
    const extraKinds = page.slots.length > layoutKinds.length ? DEVICE_PAGE_EXTRA_SLOTS[page.layout] : [];
    const stage = devicePageStageOf(page.layout, page.statusStage);
    const statusCount = DEVICE_PAGE_STATUS_SLOTS[page.layout];
    const capacity = devicePageStatusCapacity(page.layout, stage);
    const firstStatus = layoutKinds.length + extraKinds.length;
    // the kinds in the order of the configuration: the slots of the layout, the extra slots, the status icon places
    const kinds: DevicePageSlotKind[] = [
        ...layoutKinds,
        ...extraKinds,
        ...Array.from({ length: statusCount }, (): DevicePageSlotKind => 'status'),
    ];
    // what the stage does not show is not built at all (no page item, no subscription, no object read): the slots of
    // the layout the grid covers and the status icon places beyond the stage - an empty item keeps their place
    const refs: (DevicePageSlotRef | null)[] = kinds.map((_kind, i) => {
        if (i >= firstStatus) {
            const place = i - firstStatus;
            return place < capacity ? (page.statusSlots?.[place] ?? null) : null;
        }
        if (i < layoutKinds.length && devicePageSlotHiddenByStage(page.layout, stage, i)) {
            return null;
        }
        return page.slots[i] ?? null;
    });
    const label = (i: number): string =>
        i >= firstStatus ? `status icon ${i - firstStatus + 1}` : `slot ${i + 1} (${kinds[i]})`;
    const messages: string[] = [];
    const skipped: string[] = [];
    const readCommon = async (ref: DevicePageStateRef | null): Promise<DeviceDetailStateCommon | undefined> => {
        if (!ref) {
            return undefined;
        }
        const obj = await ctx.getObject(ref.id);
        if (obj?.type !== 'state') {
            skipped.push(ref.id);
            return undefined;
        }
        return obj.common;
    };
    // the slots that exist, for the names (duplicates are told apart only among the slots that show an automatic
    // name - a status icon has none, an own name stands as it is)
    const present: { index: number; entry: DevicePageSlotRef; common: DeviceDetailStateCommon }[] = [];
    const slots: (NSPanel.PageItemDataItemsOptions | undefined)[] = kinds.map(() => undefined);
    const channelSlots: number[] = [];
    for (let i = 0; i < kinds.length; i++) {
        const ref = refs[i];
        if (ref?.custom === 'navigation') {
            slots[i] = devicePageNavigationSlotItem(kinds[i], ref);
            continue;
        }
        if (ref?.custom === 'channel') {
            const channel = await devicePageChannelSlot(kinds[i], ref, ctx);
            if (channel.item) {
                slots[i] = channel.item;
                // a status icon shows no field 6: only the slots fit it to their kind
                if (i < firstStatus) {
                    channelSlots.push(i);
                }
            } else {
                messages.push(`Device page ${label(i)}: ${channel.error ?? ref.id}`);
            }
            continue;
        }
        const common = await readCommon(ref);
        if (ref && common) {
            present.push({ index: i, entry: ref, common });
        }
    }
    const named = present.filter(p => kinds[p.index] !== 'status' && !p.entry.name);
    const namesOf = (rows: typeof named): string[] =>
        deviceDetailRowNames(
            deviceId,
            rows.map(p => p.entry),
            rows.map(p => p.common),
            ctx.translate,
            ctx.language,
            null,
        );
    // the slots of the layout among themselves (their names do not depend on the extra slots), an extra slot among all
    const layoutNamed = named.filter(p => p.index < layoutKinds.length);
    const layoutNames = namesOf(layoutNamed);
    const allNames = layoutNamed.length < named.length ? namesOf(named) : layoutNames;
    present.forEach(p => {
        const n = p.index < layoutKinds.length ? layoutNamed.indexOf(p) : named.indexOf(p);
        const auto = p.index < layoutKinds.length ? layoutNames : allNames;
        const name = (kinds[p.index] !== 'status' && p.entry.name) || (n >= 0 ? (auto[n] ?? '') : '');
        const item = devicePageSlotItem(deviceId, kinds[p.index], p.entry, p.common, name);
        if (!item) {
            skipped.push(p.entry.id);
        }
        slots[p.index] = item;
    });
    // an own data point without id (not entered yet): no status line, nothing to report
    const statusRef = page.status && page.status.id !== '' ? page.status : null;
    const statusCommon = await readCommon(statusRef);
    const status = statusRef && statusCommon ? devicePageStatusItem(deviceId, statusRef, statusCommon) : undefined;
    if (skipped.length > 0) {
        messages.push(
            `Device page of ${deviceId}: missing state or not fitting its slot, left empty: ${skipped.join(', ')}`,
        );
    }
    const elements = [
        devicePageMainItem(source.main, details, page, headline),
        ...slots.slice(0, layoutKinds.length),
        page.showInfo ? devicePageInfoItem(details) : undefined,
        status,
        // a fixed block per layout: the numbers of its items do not depend on the stage
        ...slots.slice(firstStatus),
        // appended: the numbers of the items above never change
        ...slots.slice(layoutKinds.length, firstStatus),
    ];
    const config: cardDeviceDataItemOptions = {
        card: cardDeviceOf(page.layout),
        data: { headline: { type: 'const', constVal: headline } },
        channelSlots,
    };
    if (stage > 0) {
        config.statusStage = stage;
    }
    return {
        page: {
            uniqueID,
            alwaysOn,
            dpInit: '',
            pageItems: elements.map(item => item ?? EMPTY_DEVICE_PAGE_ITEM),
            config,
        },
        messages,
    };
}
