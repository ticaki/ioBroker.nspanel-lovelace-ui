import type { ParseContext } from '../CardContract';
import { initialMenuPage, maxMenuSlots, parseMenuEntityUpd, type MenuPageModel } from './shared/menuParse';

export type CardEntitiesModel = MenuPageModel;

/** cardEntities / cardEntities2 show at most 8 rows (web-p), the adapter never sends more */
const MAX_ENTITIES = maxMenuSlots('cardEntities', 'cardEntities2');

export function initial(): CardEntitiesModel {
    return initialMenuPage();
}

export function parseEntityUpd(args: string[], _prev: CardEntitiesModel, _ctx: ParseContext): CardEntitiesModel {
    return parseMenuEntityUpd(args, MAX_ENTITIES);
}

/**
 * Popups are separate pages (`popupLight`, …); an `entityUpdateDetail` that arrives while the
 * card is active is not ours.
 */
export function parseEntityUpdateDetail(
    _args: string[],
    _prev: CardEntitiesModel,
    _ctx: ParseContext,
): CardEntitiesModel | undefined {
    return undefined;
}

export function handleCommand(
    _cmd: string,
    _args: string[],
    _prev: CardEntitiesModel,
    _ctx: ParseContext,
): CardEntitiesModel | undefined {
    return undefined;
}
