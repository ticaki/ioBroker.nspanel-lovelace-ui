import type { ParseContext } from '../CardContract';
import {
    initialMenuPage,
    maxMenuSlots,
    parseMenuEntityUpd,
    type MenuPageModel,
} from '../cardEntities/shared/menuParse';

export type CardScheduleModel = MenuPageModel;

/** cardSchedule shows 6 rows (`PageMenu.maxItems`), 11 on web-p */
const MAX_ENTITIES = maxMenuSlots('cardSchedule');

export function initial(): CardScheduleModel {
    return initialMenuPage();
}

export function parseEntityUpd(args: string[], _prev: CardScheduleModel, _ctx: ParseContext): CardScheduleModel {
    return parseMenuEntityUpd(args, MAX_ENTITIES);
}

export function parseEntityUpdateDetail(
    _args: string[],
    _prev: CardScheduleModel,
    _ctx: ParseContext,
): CardScheduleModel | undefined {
    return undefined;
}

export function handleCommand(
    _cmd: string,
    _args: string[],
    _prev: CardScheduleModel,
    _ctx: ParseContext,
): CardScheduleModel | undefined {
    return undefined;
}
