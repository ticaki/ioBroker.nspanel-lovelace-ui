import type { ParseContext } from '../CardContract';
import { ENTITY_FIELDS, emptyEntity, parseEntity6, parseEntityUpdHeader } from '../../protocol/split';
import type { Entity6, Navigation } from '../../protocol/types';
import { initialMenuPage } from '../cardEntities/shared/menuParse';
import { DEVICE_SLOT_KINDS, deviceExtraKinds, deviceLayout, type DeviceLayout } from './layout';

/**
 * Model of a device page (cardDevice1/2/3):
 * `entityUpd~heading~nav left (6)~nav right (6)~main (6)~slot 1 (6)…slot N (6)~info (6)~extra 1 (6)…extra E (6)`
 *
 * The additional slots behind the info icon are only sent to the web models (`web-l`, `web-p`):
 * cardDevice1 button, button; cardDevice2 info, button, button; cardDevice3 info, info, switch.
 *
 * `devStatus~<text>` replaces only the status line: the adapter splits a status text that does not fit the line and
 * sends its parts one after the other.
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
    /**
     * the additional slots of a web model in protocol order, as many as the model has
     * ({@link deviceExtraKinds}; none on the hardware models), missing ones are empty
     */
    extras: Entity6[];
    /** the status line: field 6 of main (also when main itself is empty), replaced by `devStatus` */
    status: string;
}

/** the command that replaces only the status line: `devStatus~<text>` */
export const STATUS_COMMAND = 'devStatus';

/** slots of cardDevice1 before the status icons */
const LEGACY_SLOTS_1 = 6;

export function initial(): CardDeviceModel {
    const menu = initialMenuPage();
    return {
        layout: 1,
        title: menu.title,
        navigation: menu.navigation,
        main: emptyEntity(),
        slots: DEVICE_SLOT_KINDS[1].map(() => emptyEntity()),
        info: emptyEntity(),
        extras: [],
        status: '',
    };
}

/**
 * Parses the `entityUpd` of a device page; the number of slots follows from the pageType
 * (cardDevice1: 10, cardDevice2: 6, cardDevice3: 8), missing fields are empty. Behind the info icon a web
 * model reads its additional slots ({@link deviceExtraKinds}); a hardware model (also as a web clone) has none
 * and ignores whatever follows the info icon.
 *
 * An older cardDevice1 payload with only 6 slots (before the status icons, at most main + 6 slots + info)
 * is read as such: the info icon is element 7, the status slots stay empty.
 *
 * @param args the fields after `entityUpd` (`args[0]` is the heading)
 * @param _prev the model before
 * @param ctx the active pageType and the panel model (eu when missing)
 */
export function parseEntityUpd(args: string[], _prev: CardDeviceModel, ctx: ParseContext): CardDeviceModel {
    const layout = deviceLayout(ctx.pageType);
    const count = DEVICE_SLOT_KINDS[layout].length;
    const extraCount = deviceExtraKinds(layout, ctx.model ?? 'eu').length;
    const header = parseEntityUpdHeader(args);
    const legacy = layout === 1 && header.rest.length <= (LEGACY_SLOTS_1 + 2) * ENTITY_FIELDS;
    const sent = legacy ? LEGACY_SLOTS_1 : count;
    const main = parseEntity6(header.rest, 0);
    const slots: Entity6[] = [];
    for (let k = 1; k <= count; k++) {
        slots.push(k <= sent ? parseEntity6(header.rest, k * ENTITY_FIELDS) : emptyEntity());
    }
    const extras: Entity6[] = [];
    for (let j = 1; j <= extraCount; j++) {
        extras.push(parseEntity6(header.rest, (sent + 1 + j) * ENTITY_FIELDS));
    }
    return {
        layout,
        title: header.title,
        navigation: header.navigation,
        main,
        slots,
        info: parseEntity6(header.rest, (sent + 1) * ENTITY_FIELDS),
        extras,
        status: main.optionalValue,
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

/**
 * `devStatus~<text>`: only the status line changes, everything else of the page stays.
 *
 * @param cmd the command
 * @param args the fields after the command
 * @param prev the model before
 * @param _ctx the active pageType
 */
export function handleCommand(
    cmd: string,
    args: string[],
    prev: CardDeviceModel,
    _ctx: ParseContext,
): CardDeviceModel | undefined {
    if (cmd !== STATUS_COMMAND) {
        return undefined;
    }
    return { ...prev, status: args[0] ?? '' };
}
