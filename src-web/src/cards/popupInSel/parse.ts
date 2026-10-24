import type { ParseContext } from '../CardContract';
import { field, toNumber } from '../../protocol/split';

/** entries per page of the HMI (3 columns x 4 rows), `bModeNext` shows the next page */
export const ENTRIES_PER_PAGE = 12;

/**
 * Model of `popupInSel`. The adapter fills it with
 * `entityUpdateDetail2~entityName~~textColor~headline~currentState~list`
 * (`PageItem.getDetailPayload` type `insel`), the list is `?` separated.
 */
export interface PopupInSelModel {
    /** internal name of the entity, sent back as id */
    entityName: string;
    /** glyph of the entity (field 1, empty in the adapter; fallback: pageArgs[1]) */
    icon: string;
    /** RGB565 of the icon (field 2 - the adapter sends the icon colour of the entity) */
    iconColor: number;
    /**
     * field 3: the HMI calls it `vaType` and sends it back as `mode-<type>`; the adapter
     * puts the headline there, so it is the title too
     */
    type: string;
    /** currently selected entry (text), highlighted in the list */
    current: string;
    /** the entries, line breaks (`\r\n` from `formatInSelText`) normalised to `\n` */
    list: string[];
    /** true once an `entityUpdateDetail2` arrived */
    received: boolean;
}

export function initial(): PopupInSelModel {
    return {
        entityName: '',
        icon: '',
        iconColor: 65535,
        type: '',
        current: '',
        list: [],
        received: false,
    };
}

/** `\r\n` of the adapter and the literal `\r\n` of example files -> `\n` */
export function normalizeEntry(text: string): string {
    return text.replaceAll('\\r\\n', '\n').replaceAll('\r\n', '\n').replaceAll('\r', '\n');
}

/** Splits the `?` separated list of the adapter, an empty field is an empty list */
export function splitList(list: string): string[] {
    return list === '' ? [] : list.split('?').map(normalizeEntry);
}

export function pageCount(model: PopupInSelModel): number {
    return Math.max(1, Math.ceil(model.list.length / ENTRIES_PER_PAGE));
}

/**
 * The entries of page `page` with their index in the whole list
 *
 * @param model the model
 * @param page 0 based page
 */
export function pageEntries(model: PopupInSelModel, page: number): { index: number; text: string }[] {
    const start = page * ENTRIES_PER_PAGE;
    return model.list.slice(start, start + ENTRIES_PER_PAGE).map((text, i) => ({ index: start + i, text }));
}

/** The popup never receives `entityUpd`; the model stays */
export function parseEntityUpd(_args: string[], prev: PopupInSelModel, _ctx: ParseContext): PopupInSelModel {
    return prev;
}

/** `entityUpdateDetail` (without 2) is not used by this popup */
export function parseEntityUpdateDetail(
    _args: string[],
    _prev: PopupInSelModel,
    _ctx: ParseContext,
): PopupInSelModel | undefined {
    return undefined;
}

/** `entityUpdateDetail2~entityName~icon~iconColor~type~current~list` */
export function parseEntityUpdateDetail2(args: string[], prev: PopupInSelModel, ctx: ParseContext): PopupInSelModel {
    return {
        entityName: field(args, 0) || prev.entityName || field(ctx.pageArgs, 0),
        icon: field(args, 1) || prev.icon || field(ctx.pageArgs, 2),
        iconColor: toNumber(args[2], 65535),
        type: field(args, 3),
        current: normalizeEntry(field(args, 4)),
        list: splitList(field(args, 5)),
        received: true,
    };
}

export function handleCommand(
    cmd: string,
    args: string[],
    prev: PopupInSelModel,
    ctx: ParseContext,
): PopupInSelModel | undefined {
    if (cmd === 'entityUpdateDetail2') {
        return parseEntityUpdateDetail2(args, prev, ctx);
    }
    return undefined;
}
