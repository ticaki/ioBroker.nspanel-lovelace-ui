import type { ParseContext } from '../CardContract';
import { initialMenuPage, parseMenuEntityUpd, type MenuPageModel } from '../cardEntities/shared/menuParse';

export type CardGridModel = MenuPageModel;

/** cardGrid2 on us-p sends 9 tiles, the other grids fewer */
const MAX_ENTITIES = 9;

export function initial(): CardGridModel {
    return initialMenuPage();
}

export function parseEntityUpd(args: string[], _prev: CardGridModel, _ctx: ParseContext): CardGridModel {
    return parseMenuEntityUpd(args, MAX_ENTITIES);
}

export function parseEntityUpdateDetail(
    _args: string[],
    _prev: CardGridModel,
    _ctx: ParseContext,
): CardGridModel | undefined {
    return undefined;
}

export function handleCommand(
    _cmd: string,
    _args: string[],
    _prev: CardGridModel,
    _ctx: ParseContext,
): CardGridModel | undefined {
    return undefined;
}
