/**
 * Page dump of the admin tab "developer": the configuration of one page (or of the screensaver) of a panel, as
 * stored and as the running adapter built it, downloaded as a JSON file for support.
 *
 * Shared between the adapter and the admin bundle, therefore no adapter imports here.
 */

/** sendTo command: list of all pages and screensavers of all panels (answer `{ result: PageDumpListEntry[] }`) */
export const SENDTO_PAGE_DUMP_LIST_COMMAND = 'pageDumpList';
/** sendTo command: dump of one page ({@link PageDumpRequest}, answer `{ result: <dump> }` or `{ error: <i18n key> }`) */
export const SENDTO_PAGE_DUMP_COMMAND = 'pageDump';

/** format marker of a page dump */
export const PAGE_DUMP_FORMAT = 'nspanel-lovelace-ui.pageDump';
/** version of the file format */
export const PAGE_DUMP_VERSION = 1;

/** a navigable page or the screensaver of a panel */
export type PageDumpKind = 'page' | 'screensaver';

/** one entry of the selection in the admin */
export type PageDumpListEntry = {
    panelTopic: string;
    panelName: string;
    /** name of the page (uniqueName) or of the screensaver page */
    page: string;
    kind: PageDumpKind;
    /** card of the page, e.g. `cardGrid` or `screensaver2` */
    card: string;
};

/** message of {@link SENDTO_PAGE_DUMP_COMMAND} */
export type PageDumpRequest = {
    panelTopic: string;
    page: string;
    kind: PageDumpKind;
};

/**
 * @param value any value
 * @returns true for a plain object
 */
function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @param value any value
 * @returns true for 'page' or 'screensaver'
 */
export function isPageDumpKind(value: unknown): value is PageDumpKind {
    return value === 'page' || value === 'screensaver';
}

/**
 * @param value message of a sendTo
 * @returns true when it names a panel, a page and the kind
 */
export function isPageDumpRequest(value: unknown): value is PageDumpRequest {
    return (
        isObject(value) &&
        typeof value.panelTopic === 'string' &&
        value.panelTopic !== '' &&
        typeof value.page === 'string' &&
        value.page !== '' &&
        isPageDumpKind(value.kind)
    );
}

/**
 * @param value one entry of the answer
 * @returns true for a valid list entry
 */
function isPageDumpListEntry(value: unknown): value is PageDumpListEntry {
    return (
        isObject(value) &&
        typeof value.panelTopic === 'string' &&
        typeof value.panelName === 'string' &&
        typeof value.page === 'string' &&
        typeof value.card === 'string' &&
        isPageDumpKind(value.kind)
    );
}

/**
 * @param value answer of {@link SENDTO_PAGE_DUMP_LIST_COMMAND}
 * @returns the valid entries, undefined when the answer holds no list
 */
export function parsePageDumpList(value: unknown): PageDumpListEntry[] | undefined {
    if (!isObject(value) || !Array.isArray(value.result)) {
        return undefined;
    }
    return value.result.filter(isPageDumpListEntry);
}

/**
 * @param entry a list entry
 * @returns a key that identifies the entry in the selection
 */
export function pageDumpKey(entry: PageDumpRequest): string {
    return JSON.stringify([entry.kind, entry.panelTopic, entry.page]);
}

/**
 * File name of a dump: `nspanel-page-<panel>-<page>-<yyyy-mm-dd>.json`, the names reduced to safe characters.
 *
 * @param panelName name of the panel
 * @param page name of the page
 * @param now time of the dump (local date)
 * @returns the file name
 */
export function pageDumpFileName(panelName: string, page: string, now: Date): string {
    const safe = (text: string, fallback: string): string =>
        text
            .trim()
            .replace(/[^A-Za-z0-9_-]+/g, '_')
            .replace(/^_+|_+$/g, '') || fallback;
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `nspanel-page-${safe(panelName, 'panel')}-${safe(page, 'page')}-${now.getFullYear()}-${pad(
        now.getMonth() + 1,
    )}-${pad(now.getDate())}.json`;
}
