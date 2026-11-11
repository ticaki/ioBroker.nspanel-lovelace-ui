import type { ParseContext } from '../CardContract';
import {
    initialMenuPage,
    maxMenuSlots,
    parseMenuEntityUpd,
    type MenuPageModel,
} from '../cardEntities/shared/menuParse';

export type CardGridModel = MenuPageModel;

/** cardGrid2 on web-p sends 15 tiles, the other grids and models fewer */
const MAX_ENTITIES = maxMenuSlots('cardGrid', 'cardGrid2', 'cardGrid3');

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
