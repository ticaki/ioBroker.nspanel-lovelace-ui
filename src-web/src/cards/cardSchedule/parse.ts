import type { ParseContext } from '../CardContract';
import { initialMenuPage, parseMenuEntityUpd, type MenuPageModel } from '../cardEntities/shared/menuParse';

export type CardScheduleModel = MenuPageModel;

/** cardSchedule shows 6 rows (`PageMenu.maxItems`) */
const MAX_ENTITIES = 6;

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
