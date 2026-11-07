import type { ParseContext } from '../CardContract';
import { field, toNumber } from '../../protocol/split';
import type { PanelModel } from '../../protocol/types';

/** entries per page of the HMI (3 columns x 4 rows), `bModeNext` shows the next page */
export const ENTRIES_PER_PAGE = 12;

/** The grid of the entries in stage pixels */
export interface InSelGrid {
    columns: number;
    rows: number;
    columnLeft: number;
    columnWidth: number;
    rowCenterY: number;
    rowPitch: number;
}

/**
 * The grid of the entries per model (the adapter sends the whole list, the page size is up to
 * the display): eu/us-l 3 x 4 like the HMI (columns of 124 px from x 8, rows of 63 px centred
 * at y 92), web-l 4 x 4 (columns of 156 px), web-p 2 x 8 and us-p 2 x 6 (columns of 150 px).
 *
 * @param model the panel model the popup sees
 */
export function inSelGrid(model: PanelModel): InSelGrid {
    const base = { rowCenterY: 92, rowPitch: 63 };
    switch (model) {
        case 'web-l':
            return { ...base, columns: 4, rows: 4, columnLeft: 8, columnWidth: 156 };
        case 'web-p':
            return { ...base, columns: 2, rows: 8, columnLeft: 10, columnWidth: 150 };
        case 'us-p':
            return { ...base, columns: 2, rows: 6, columnLeft: 10, columnWidth: 150 };
        default:
            return { ...base, columns: 3, rows: 4, columnLeft: 8, columnWidth: 124 };
    }
}

/**
 * Entries per page on a model, see {@link inSelGrid}
 *
 * @param model the panel model
 */
export function entriesPerPage(model: PanelModel): number {
    const grid = inSelGrid(model);
    return grid.columns * grid.rows;
}

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

/** `\r\n` of the adapter and the literal `\r\n` of example files -> `\n`; trailing breaks are dropped */
export function normalizeEntry(text: string): string {
    return text.replaceAll('\\r\\n', '\n').replaceAll('\r\n', '\n').replaceAll('\r', '\n').replace(/\n+$/, '');
}

/** Splits the `?` separated list of the adapter, an empty field is an empty list */
export function splitList(list: string): string[] {
    return list === '' ? [] : list.split('?').map(normalizeEntry);
}

/**
 * Number of pages of the list
 *
 * @param model the model
 * @param perPage entries per page ({@link entriesPerPage})
 */
export function pageCount(model: PopupInSelModel, perPage: number = ENTRIES_PER_PAGE): number {
    return Math.max(1, Math.ceil(model.list.length / perPage));
}

/**
 * The entries of page `page` with their index in the whole list
 *
 * @param model the model
 * @param page 0 based page
 * @param perPage entries per page ({@link entriesPerPage})
 */
export function pageEntries(
    model: PopupInSelModel,
    page: number,
    perPage: number = ENTRIES_PER_PAGE,
): { index: number; text: string }[] {
    const start = page * perPage;
    return model.list.slice(start, start + perPage).map((text, i) => ({ index: start + i, text }));
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
