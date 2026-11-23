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
    /** field 6 of main - shown in the status line, also when main itself is empty */
    status: string;
}

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
    };
}

/**
 * Parses the `entityUpd` of a device page; the number of slots follows from the pageType
 * (cardDevice1: 10 incl. the 4 status icons, cardDevice2: 6, cardDevice3: 8), missing fields are empty.
 *
 * @param args the fields after `entityUpd` (`args[0]` is the heading)
 * @param _prev the model before
 * @param ctx the active pageType
 */
export function parseEntityUpd(args: string[], _prev: CardDeviceModel, ctx: ParseContext): CardDeviceModel {
    const layout = deviceLayout(ctx.pageType);
    const count = DEVICE_GEOMETRY[layout].slots.length;
    const header = parseEntityUpdHeader(args);
    const main = parseEntity6(header.rest, 0);
    const slots: Entity6[] = [];
    for (let k = 1; k <= count; k++) {
        slots.push(parseEntity6(header.rest, k * ENTITY_FIELDS));
    }
    return {
        layout,
        title: header.title,
        navigation: header.navigation,
        main,
        slots,
        info: parseEntity6(header.rest, (count + 1) * ENTITY_FIELDS),
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

export function handleCommand(
    _cmd: string,
    _args: string[],
    _prev: CardDeviceModel,
    _ctx: ParseContext,
): CardDeviceModel | undefined {
    return undefined;
}
