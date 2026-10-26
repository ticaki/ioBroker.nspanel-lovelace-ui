import { ENTITY_FIELDS, field, parseEntity6, parseEntityUpdHeader } from '../../protocol/split';
import type { Entity6, Navigation } from '../../protocol/types';
import type { ParseContext } from '../CardContract';

/** number of text/switch entities right of the QR code */
export const QR_ENTITIES = 2;

/**
 * Model of `cardQR`, built from what `PageQR.getMessage` sends:
 * `entityUpd~headline~<nav left>~<nav right>~qrText~<entity 1>~<entity 2>`
 * Entity types are `text`, `switch` (second entity with a state) or `disabled`.
 */
export interface CardQRModel {
    title: string;
    navigation: Navigation;
    /** the text encoded in the QR code (`WIFI:T:WPA;S:…;P:…;H:;`, `URL:…`, `TEL:…` or free text) */
    text: string;
    /** always {@link QR_ENTITIES} entries */
    entities: Entity6[];
    /** commands other than entityUpd received on this page (counted for diagnostics only) */
    otherCommands: number;
}

function emptyNav(): Navigation {
    return { left: parseEntity6([]), right: parseEntity6([]) };
}

export function initial(): CardQRModel {
    return { title: '', navigation: emptyNav(), text: '', entities: [], otherCommands: 0 };
}

/** `true` when the entity is shown: has a type other than `disabled`/`delete`/empty */
export function isQREntityVisible(entity: Entity6): boolean {
    return entity.type !== '' && entity.type !== 'disabled' && entity.type !== 'delete';
}

export function parseEntityUpd(args: string[], prev: CardQRModel, _ctx: ParseContext): CardQRModel {
    const { title, navigation, rest } = parseEntityUpdHeader(args);
    const entities: Entity6[] = [];
    for (let i = 0; i < QR_ENTITIES; i++) {
        entities.push(parseEntity6(rest, 1 + i * ENTITY_FIELDS));
    }
    return { ...prev, title, navigation, text: field(rest, 0), entities };
}

/** `entityUpdateDetail` belongs to popups, the card keeps its model */
export function parseEntityUpdateDetail(
    _args: string[],
    _prev: CardQRModel,
    _ctx: ParseContext,
): CardQRModel | undefined {
    return undefined;
}

export function handleCommand(
    _cmd: string,
    _args: string[],
    prev: CardQRModel,
    _ctx: ParseContext,
): CardQRModel | undefined {
    return { ...prev, otherCommands: prev.otherCommands + 1 };
}
