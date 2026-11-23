import type { ParseContext } from '../CardContract';
import { ENTITY_FIELDS, emptyEntity, parseEntity6, parseEntityUpdHeader } from '../../protocol/split';
import type { Entity6, Navigation } from '../../protocol/types';
import { initialMenuPage } from '../cardEntities/shared/menuParse';
import { DEVICE_GEOMETRY, deviceLayout, type DeviceLayout } from './layout';

/**
 * Model of a device page (cardDevice1/2/3):
 * `entityUpd~heading~nav left (6)~nav right (6)~main (6)~slot 1 (6)…slot N (6)~info (6)`
 */
export interface CardDeviceModel {
    layout: DeviceLayout;
    title: string;
    navigation: Navigation;
    /** the device itself: big icon and name */
    main: Entity6;
    /** the slots of the layout in protocol order, always as many as the layout has */
    slots: Entity6[];
    /** the info icon at the bottom right */
    info: Entity6;
    /** field 6 of main without the scroll mark - shown in the status line, also when main itself is empty */
    status: string;
    /** the status line scrolls (field 6 of main ended with the scroll mark `¬1`) */
    statusScroll: boolean;
}

/** the character that marks a scrolling status line, followed by one more character (the adapter sends `¬1`) */
export const STATUS_SCROLL_CHAR = '¬';

/**
 * The status line of a device page: field 6 of main. When it ends with `¬` and one more character, the page cuts
 * these two off and lets the text before them scroll (`gStatus` of the HMI); the character behind `¬` is not
 * evaluated. Without the mark the text stands.
 *
 * @param field field 6 of main
 */
export function parseDeviceStatus(field: string): { text: string; scroll: boolean } {
    const chars = Array.from(field);
    if (chars.length >= 2 && chars[chars.length - 2] === STATUS_SCROLL_CHAR) {
        return { text: chars.slice(0, -2).join(''), scroll: true };
    }
    return { text: field, scroll: false };
}

/** slots of cardDevice1 before the status icons */
const LEGACY_SLOTS_1 = 6;

export function initial(): CardDeviceModel {
    const menu = initialMenuPage();
    return {
        layout: 1,
        title: menu.title,
        navigation: menu.navigation,
        main: emptyEntity(),
        slots: DEVICE_GEOMETRY[1].slots.map(() => emptyEntity()),
        info: emptyEntity(),
        status: '',
        statusScroll: false,
    };
}

/**
 * Parses the `entityUpd` of a device page; the number of slots follows from the pageType
 * (cardDevice1: 10, cardDevice2: 6, cardDevice3: 8), missing fields are empty.
 *
 * An older cardDevice1 payload with only 6 slots (before the status icons, at most main + 6 slots + info)
 * is read as such: the info icon is element 7, the status slots stay empty.
 *
 * @param args the fields after `entityUpd` (`args[0]` is the heading)
 * @param _prev the model before
 * @param ctx the active pageType
 */
export function parseEntityUpd(args: string[], _prev: CardDeviceModel, ctx: ParseContext): CardDeviceModel {
    const layout = deviceLayout(ctx.pageType);
    const count = DEVICE_GEOMETRY[layout].slots.length;
    const header = parseEntityUpdHeader(args);
    const legacy = layout === 1 && header.rest.length <= (LEGACY_SLOTS_1 + 2) * ENTITY_FIELDS;
    const sent = legacy ? LEGACY_SLOTS_1 : count;
    const main = parseEntity6(header.rest, 0);
    const status = parseDeviceStatus(main.optionalValue);
    const slots: Entity6[] = [];
    for (let k = 1; k <= count; k++) {
        slots.push(k <= sent ? parseEntity6(header.rest, k * ENTITY_FIELDS) : emptyEntity());
    }
    return {
        layout,
        title: header.title,
        navigation: header.navigation,
        main,
        slots,
        info: parseEntity6(header.rest, (sent + 1) * ENTITY_FIELDS),
        status: status.text,
        statusScroll: status.scroll,
    };
}

/** Popups are separate pages; an `entityUpdateDetail` that arrives while the page is active is not ours */
export function parseEntityUpdateDetail(
    _args: string[],
    _prev: CardDeviceModel,
    _ctx: ParseContext,
): CardDeviceModel | undefined {
    return undefined;
}

export function handleCommand(
    _cmd: string,
    _args: string[],
    _prev: CardDeviceModel,
    _ctx: ParseContext,
): CardDeviceModel | undefined {
    return undefined;
}
