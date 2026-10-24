import type { ParseContext } from '../CardContract';
import { field, toNumber } from '../../protocol/split';

/** mode buttons per row of the HMI, the arrow at the end of a row shows the next three */
export const MODES_PER_PAGE = 3;
/** rows of the popup */
export const ROW_COUNT = 3;

/** One row of the popup: a heading, the modes and the selected one */
export interface ThermoModeRow {
    heading: string;
    /** `vaType` of the HMI: the id of the mode item (`<page>?<n>`), sent back as `mode-<type>` */
    type: string;
    /** selected mode (text) */
    current: string;
    /** the modes, `?` separated in the payload */
    list: string[];
}

/**
 * Model of `popupThermo`. `PageThermo.onPopupRequest` sends
 * `entityUpdateDetail~pageId~icon~iconColor~[heading~type~current~list] x 3~`
 * (a missing row is `~~~`).
 */
export interface PopupThermoModel {
    /** id of the thermo page, sent back as id of the mode events */
    entityName: string;
    icon: string;
    /** RGB565 */
    iconColor: number;
    rows: ThermoModeRow[];
    /** true once an `entityUpdateDetail` arrived */
    received: boolean;
}

export function initial(): PopupThermoModel {
    return { entityName: '', icon: '', iconColor: 65535, rows: [], received: false };
}

/** `\r\n` of the adapter (`formatInSelText`) and the literal `\r\n` of example files -> `\n` */
export function normalizeEntry(text: string): string {
    return text.replaceAll('\\r\\n', '\n').replaceAll('\r\n', '\n').replaceAll('\r', '\n');
}

export function splitList(list: string): string[] {
    return list === '' ? [] : list.split('?').map(normalizeEntry);
}

/** number of pages of three modes of a row */
export function pageCount(row: ThermoModeRow): number {
    return Math.max(1, Math.ceil(row.list.length / MODES_PER_PAGE));
}

/**
 * The modes of page `page` of a row with their index in the whole list
 *
 * @param row the row
 * @param page 0 based page
 */
export function pageModes(row: ThermoModeRow, page: number): { index: number; text: string }[] {
    const start = page * MODES_PER_PAGE;
    return row.list.slice(start, start + MODES_PER_PAGE).map((text, i) => ({ index: start + i, text }));
}

/** The popup never receives `entityUpd`; the model stays */
export function parseEntityUpd(_args: string[], prev: PopupThermoModel, _ctx: ParseContext): PopupThermoModel {
    return prev;
}

export function parseEntityUpdateDetail(args: string[], prev: PopupThermoModel, ctx: ParseContext): PopupThermoModel {
    const rows: ThermoModeRow[] = [];
    for (let r = 0; r < ROW_COUNT; r++) {
        const offset = 3 + r * 4;
        rows.push({
            heading: field(args, offset),
            type: field(args, offset + 1),
            current: normalizeEntry(field(args, offset + 2)),
            list: splitList(field(args, offset + 3)),
        });
    }
    return {
        entityName: field(args, 0) || prev.entityName || field(ctx.pageArgs, 0),
        icon: field(args, 1) || prev.icon || field(ctx.pageArgs, 2),
        iconColor: toNumber(args[2], 65535),
        rows,
        received: true,
    };
}

export function handleCommand(
    _cmd: string,
    _args: string[],
    _prev: PopupThermoModel,
    _ctx: ParseContext,
): PopupThermoModel | undefined {
    return undefined;
}
