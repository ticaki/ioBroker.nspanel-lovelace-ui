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
import { MAX_PANEL_PAYLOAD_BYTES } from '../const/definition';
import { ELLIPSIS, ELLIPSIS_FALLBACK, fitText, hasGlyph, textWidth } from '../const/text-width';
import { isVersionGreaterOrEqual } from '../const/tools';
import { emptyChannelValueConfig, type AdminPageItemConfig } from '../types/adminShareConfig';
import type { NSPanel } from '../types/NSPanel';
import type { PageBase } from '../types/pages';
import type { NSpanelModel } from '../types/types';
import {
    DEVICE_DETAIL_ROW_ROLE,
    DEVICE_PAGE_FIELDS,
    DEVICE_PAGE_INFO_ROLE,
    DEVICE_PAGE_LAYOUTS,
    DEVICE_PAGE_RECEIVE_BYTES,
    DEVICE_PAGE_STATUS_COMMAND,
    DEVICE_PAGE_STATUS_MAX_BYTES,
    DEVICE_PAGE_STATUS_MAX_PARTS,
    DEVICE_PAGE_TEXT_FONT,
    DEVICE_PAGE_TEXT_MAX_BYTES,
    DEVICE_PAGE_PROGRESS_ROLE,
    devicePageProgressPercent,
    devicePageSlotAccepts,
    devicePageChannelTakesLongPress,
    devicePageSlotAcceptsChannel,
    devicePageSlotLookOf,
    deviceDetailRowKind,
    type DeviceDetailEntryConfig,
    type DeviceDetailsRuntime,
    type DevicePageLayout,
    type DevicePageRuntime,
    type DevicePageSlotKind,
    type DevicePageSlotLook,
    type DevicePageSlotRef,
    type DevicePageStateRef,
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
 * - The text fits the line of the layout (px in font 0) and {@link DEVICE_PAGE_STATUS_MAX_BYTES}: one part, unchanged.
 * - Else it is split into parts that each fit the line and the bytes: at the last space (the space is dropped) or
 *   behind the last comma, full stop, semicolon or dash that fits; a word that is too long on its own is cut at a
 *   character.
 * - At most {@link DEVICE_PAGE_STATUS_MAX_PARTS} parts: what does not fit the last one is dropped, that part ends
 *   with the ellipsis ('…' if font 0 has it, else '...').
 *
 * @param text the status text
 * @param layout the layout
 * @param model panel model (font tables)
 * @returns the parts, at least one ('' for an empty text)
 */
export function splitDevicePageStatus(text: string, layout: DevicePageLayout, model: NSpanelModel): string[] {
    const flat = text.replace(/[\r\n]+/g, ' ').replaceAll('~', '');
    const width = DEVICE_PAGE_FIELDS[layout].status;
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
 * @returns the bytes an `entityUpd` of the page may have: the receive buffer of its HMI page, at most what the
 * display takes
 */
export function devicePageMaxPayloadBytes(layout: DevicePageLayout): number {
    return Math.min(DEVICE_PAGE_RECEIVE_BYTES[layout], MAX_PANEL_PAYLOAD_BYTES);
}

/**
 * The `entityUpd` of the device page with the shown part of the status text in field 6 of main. When the message
 * has more bytes than the page takes ({@link devicePageMaxPayloadBytes}), the status line gives way: the part is cut
 * by the overhang, with an ellipsis. Names and values are already limited ({@link devicePageClampElement}), so that
 * is enough for a message the adapter builds.
 *
 * @param head `entityUpd~<heading>~<navigation>`
 * @param mainPayload payload of the main item ('' = none)
 * @param elements the elements of the slots and of info
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
    const build = (field: string): string => [head, devicePageMainElement(mainPayload, field), ...elements].join('~');
    const payload = build(status);
    const over = byteLength(payload) - devicePageMaxPayloadBytes(layout);
    if (over <= 0) {
        return payload;
    }
    return build(cutToBytesWithEllipsis(status, Math.max(0, byteLength(status) - over), statusEllipsis(model)));
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
 * @param source runtime configuration of the device item
 * @param details the device part of the item
 * @param page the device page
 * @param name the name of the device (the headline of the device page)
 * @returns the page item of main
 */
export function devicePageMainItem(
    source: NSPanel.PageItemDataItemsOptionsWithOutTemplate,
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
        (page.shortPress === 'state' || page.shortPress === 'none') &&
        (source.type === 'button' || source.type === 'switch' || source.type === 'text')
    ) {
        const item = structuredClone(source);
        item.deviceDetails = deviceDetails;
        delete item.devicePageChannels;
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
    const data = source.data;
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

/** an alias channel of a slot as page item, built when the item is configured ({@link devicePageChannels}) */
export interface DevicePageChannelItem {
    /** common.role of the channel */
    role: string;
    /** the page item of the channel as the config manager builds it for a normal page */
    item: NSPanel.PageItemDataItemsOptions;
}

/** the alias channels of the slots of a device page by the index of their slot (0 = slot 1) */
export type DevicePageChannelItems = Record<number, DevicePageChannelItem>;

/**
 * The admin page item an alias channel of a slot is converted from: a standard item of the channel with the own look
 * of the slot - the same fields a page item has (`trueIcon`, `falseIcon`, `trueColor`, `falseColor`, `scale`,
 * `longPress` where the role takes one), everything else the defaults of the role.
 *
 * @param ref the slot (`custom: 'channel'`)
 * @param role common.role of the channel
 * @returns the admin page item
 */
export function devicePageChannelAdminItem(ref: DevicePageSlotRef, role: string): AdminPageItemConfig {
    const { longPress, ...look } = devicePageSlotLookOf(ref, false);
    const item: AdminPageItemConfig = { channelId: emptyChannelValueConfig(ref.id), ...look };
    if (longPress && devicePageChannelTakesLongPress(role)) {
        item.longPress = longPress;
    }
    return item;
}

/**
 * The alias channels of the slots of a device page as page items, built once when the item is configured (the device
 * page itself is built when it is opened). A channel that does not exist, whose role does not fit the kind of its
 * slot ({@link devicePageSlotAcceptsChannel}) or that the config manager rejects is left out and reported.
 *
 * @param page the device page
 * @param getRole reads common.role of a channel, undefined when the object does not exist
 * @param convert builds the page item of an admin page item (config manager), may throw
 * @returns the page items by slot and the reasons of the channels left out
 */
export async function devicePageChannels(
    page: DevicePageRuntime,
    getRole: (id: string) => Promise<string | undefined>,
    convert: (item: AdminPageItemConfig) => Promise<NSPanel.PageItemDataItemsOptions | undefined>,
): Promise<{ channels: DevicePageChannelItems; errors: string[] }> {
    const channels: DevicePageChannelItems = {};
    const errors: string[] = [];
    const kinds = DEVICE_PAGE_LAYOUTS[page.layout];
    for (let i = 0; i < kinds.length; i++) {
        const ref = page.slots[i];
        if (!ref || ref.custom !== 'channel' || ref.id === '') {
            continue;
        }
        const where = `Device page slot ${i + 1} (${kinds[i]}): channel ${ref.id}`;
        try {
            const role = await getRole(ref.id);
            if (role === undefined) {
                errors.push(`${where} not found!`);
                continue;
            }
            if (!devicePageSlotAcceptsChannel(kinds[i], role)) {
                errors.push(`${where} with role ${role || '(none)'} does not fit the slot!`);
                continue;
            }
            const item = await convert(devicePageChannelAdminItem(ref, role));
            // a template item (timeTable) is resolved by its page - no slot can show it
            if (!item || ('template' in item && item.template)) {
                errors.push(`${where} gives no page item!`);
                continue;
            }
            channels[i] = { role, item };
        } catch (e) {
            errors.push(`${where}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    return { channels, errors };
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
 *   item is a button or a switch ({@link devicePageSlotTakesLongPress}).
 *
 * A page item without icon stays as it is.
 *
 * @param item the page item of the slot (changed)
 * @param ref the slot
 * @param common common of the state
 * @returns the page item
 */
export function withDevicePageSlotLook(
    item: NSPanel.PageItemDataItemsOptions,
    ref: DevicePageSlotRef,
    common: DeviceDetailStateCommon,
): NSPanel.PageItemDataItemsOptions {
    // the older icon of a status slot is already in the item (devicePageStatusIconItem)
    const look = devicePageSlotLookOf(ref, false);
    if (Object.keys(look).length === 0) {
        return item;
    }
    const isBoolean = common.type === 'boolean';
    if (item.type === 'text' || item.type === 'button' || item.type === 'switch') {
        if (!item.data?.icon) {
            return item;
        }
        applySlotLook(item.data.icon, look, isBoolean);
        if (look.scale && common.type === 'number' && !item.data.entity1) {
            item.data.entity1 = { value: { type: 'triggered', dp: ref.id } };
        }
        if (look.longPress && item.type !== 'text') {
            item.data.longPress = { type: 'state', dp: look.longPress };
        }
    } else if (item.type === 'input_sel' && item.data?.icon) {
        applySlotLook(item.data.icon, look, isBoolean);
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
    const item = devicePageStateSlotItem(deviceId, kind, entry, common, name);
    return item ? withDevicePageSlotLook(item, entry, common) : undefined;
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
 * @returns the page item, undefined when the state does not fit the kind (devicePageSlotAccepts)
 */
function devicePageStateSlotItem(
    deviceId: string,
    kind: DevicePageSlotKind,
    entry: DevicePageStateRef,
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
    /** slots whose state or channel does not exist or does not fit the kind of the slot (log) */
    skipped: string[];
    /** index of the slots (0 = slot 1) that show an alias channel ({@link devicePageChannelElement}) */
    channelSlots: number[];
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
    // the slots that exist, for the names (duplicates are told apart only among the slots that show a name - a status
    // icon has none)
    const present: { index: number; entry: DevicePageSlotRef; common: DeviceDetailStateCommon }[] = [];
    const slots: (NSPanel.PageItemDataItemsOptions | undefined)[] = kinds.map(() => undefined);
    const channelSlots: number[] = [];
    for (let i = 0; i < kinds.length; i++) {
        const ref = page.slots[i] ?? null;
        if (ref?.custom === 'channel') {
            // an alias channel: its page item was built when the item was configured, it brings its own name
            const channel = source.devicePageChannels?.[i];
            const item = channel ? devicePageChannelSlotItem(kinds[i], channel) : undefined;
            if (item) {
                slots[i] = item;
                channelSlots.push(i);
            } else {
                skipped.push(ref.id);
            }
            continue;
        }
        const common = await readCommon(ref);
        if (ref && common) {
            present.push({ index: i, entry: ref, common });
        }
    }
    const named = present.filter(p => kinds[p.index] !== 'status');
    const names = deviceDetailRowNames(
        details.deviceId,
        named.map(p => p.entry),
        named.map(p => p.common),
        translate,
        language,
        null,
    );
    present.forEach(p => {
        const n = named.indexOf(p);
        const name = n >= 0 ? (names[n] ?? '') : '';
        const item = devicePageSlotItem(details.deviceId, kinds[p.index], p.entry, p.common, name);
        if (!item) {
            skipped.push(p.entry.id);
        }
        slots[p.index] = item;
    });
    // an own data point without id (not entered yet): no status line, nothing to report
    const statusRef = page.status && page.status.id !== '' ? page.status : null;
    const statusCommon = await readCommon(statusRef);
    const status =
        statusRef && statusCommon ? devicePageStatusItem(details.deviceId, statusRef, statusCommon) : undefined;
    return {
        headline,
        slotCount: kinds.length,
        elements: [
            devicePageMainItem(source, details, page, headline),
            ...slots,
            page.showInfo ? devicePageInfoItem(details) : undefined,
            status,
        ],
        skipped,
        channelSlots,
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
    content: Pick<DevicePageElements, 'headline' | 'slotCount' | 'elements'> &
        Partial<Pick<DevicePageElements, 'channelSlots'>>,
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
            channelSlots: content.channelSlots ?? [],
        },
    };
}
