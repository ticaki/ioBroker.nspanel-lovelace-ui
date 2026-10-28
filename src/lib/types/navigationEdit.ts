/**
 * Pure helpers for editing the navigation links (prev/next/home/parent) of admin pages.
 *
 * Shared between the adapter and the admin bundle, therefore no adapter imports here. The rules
 * mirror `createPagesFromConfig` in `src/lib/configuration/admin.ts` - whoever changes the
 * selection or default rules there has to change them here as well.
 */
import {
    ALL_PANELS_SPECIAL_ID,
    dropScriptNavigation,
    isMainPageEntry,
    mainPageName,
    type NavigationAssignment,
    type NavigationMap,
    type NavigationMapEntry,
    type PageConfigEntry,
} from './adminShareConfig';

/** The four navigation links a page can carry in its configuration. */
export type NavigationLinkKind = 'prev' | 'next' | 'home' | 'parent';

/** All link kinds, in the order the flow draws them. */
export const navigationLinkKinds: readonly NavigationLinkKind[] = ['prev', 'next', 'home', 'parent'];

/** The navigation links of a page as stored in `navigationAssignment[].navigation`. */
export type NavigationLinks = { next?: string; prev?: string; home?: string; parent?: string };

/**
 * Which assignment row of a page applies to a panel.
 *
 * - `panel`: the panel-specific row is used
 * - `all`: no panel-specific row, the "all panels" row is used
 * - `excluded`: a panel-specific row without `navigation` next to an "all panels" row - the page is
 *   deliberately left out on this panel
 * - `none`: the page is not assigned to this panel at all
 */
export type AssignmentSource = 'panel' | 'all' | 'excluded' | 'none';

/** Scope an edit is written to: the row of this panel, or the row that applies to all panels. */
export type NavigationEditScope = 'panel' | 'all';

/**
 * True for a link kind - narrows the id of a source handle or an edge type.
 *
 * @param value Any string.
 * @returns Whether it names one of the four navigation links.
 */
export function isNavigationLinkKind(value: unknown): value is NavigationLinkKind {
    return typeof value === 'string' && (navigationLinkKinds as readonly string[]).includes(value);
}

/**
 * The assignment rows of an entry that matter for a panel.
 *
 * @param entry Admin page entry.
 * @param panelTopic Topic of the panel.
 * @returns The panel-specific row and the "all panels" row, each `undefined` when missing.
 */
function assignmentRows(
    entry: PageConfigEntry,
    panelTopic: string,
): { panel?: NavigationAssignment; all?: NavigationAssignment } {
    const list = Array.isArray(entry.navigationAssignment) ? entry.navigationAssignment : [];
    return {
        panel: list.find(a => a && a.topic === panelTopic),
        all: list.find(a => a && a.topic === ALL_PANELS_SPECIAL_ID),
    };
}

/**
 * Which assignment row the adapter picks for a page on a panel - the selection rule of
 * `createPagesFromConfig`.
 *
 * @param entry Admin page entry.
 * @param panelTopic Topic of the panel.
 * @returns Where the navigation of the page on this panel comes from.
 */
export function assignmentSourceOf(entry: PageConfigEntry, panelTopic: string): AssignmentSource {
    const { panel, all } = assignmentRows(entry, panelTopic);
    if (panel) {
        return !panel.navigation && all ? 'excluded' : 'panel';
    }
    return all ? 'all' : 'none';
}

/**
 * The navigation links that apply to a page on a panel according to the configuration.
 *
 * @param entry Admin page entry.
 * @param panelTopic Topic of the panel.
 * @returns A copy of the links, `{}` for a row without `navigation`, `undefined` when the page is
 * excluded from or not assigned to the panel.
 */
export function effectiveNavigation(entry: PageConfigEntry, panelTopic: string): NavigationLinks | undefined {
    const { panel, all } = assignmentRows(entry, panelTopic);
    switch (assignmentSourceOf(entry, panelTopic)) {
        case 'panel':
            return { ...(panel?.navigation ?? {}) };
        case 'all':
            return { ...(all?.navigation ?? {}) };
        default:
            return undefined;
    }
}

/**
 * Sets or removes one navigation link of an admin page for a panel.
 *
 * The input is left untouched; the result is a new array with a new entry for the changed page.
 * When nothing has to change (unknown page, self reference) the input array itself is returned,
 * so callers can detect a no-op by identity.
 *
 * - scope `all`: writes into the "all panels" row, which is created when missing.
 * - scope `panel`: writes into the row of this panel. A missing row is created and starts with a
 *   copy of the links of the "all panels" row, so the other links of the page survive on this panel.
 * - `target === undefined` removes the link. The `navigation` object stays, even when empty: a
 *   row without `navigation` next to an "all panels" row would exclude the page from the panel.
 *
 * @param entries Page configuration (`native.pageConfig`).
 * @param uniqueName `uniqueName` of the page to change.
 * @param panelTopic Topic of the panel the change is made for.
 * @param kind Which link to set.
 * @param target Node name of the target page, `undefined` to remove the link.
 * @param scope Which assignment row to write to.
 * @returns The updated page configuration, or `entries` itself when nothing changed.
 */
export function setNavigationLink(
    entries: PageConfigEntry[],
    uniqueName: string,
    panelTopic: string,
    kind: NavigationLinkKind,
    target: string | undefined,
    scope: NavigationEditScope,
): PageConfigEntry[] {
    const index = entries.findIndex(e => e && e.uniqueName === uniqueName);
    if (index === -1) {
        return entries;
    }
    const entry = entries[index];
    // A page must not link to itself - the start page is also reachable under its reserved id
    if (target !== undefined && (target === uniqueName || (target === mainPageName && isMainPageEntry(entry)))) {
        return entries;
    }
    const list = Array.isArray(entry.navigationAssignment) ? entry.navigationAssignment : [];
    const topic = scope === 'all' ? ALL_PANELS_SPECIAL_ID : panelTopic;
    const rowIndex = list.findIndex(a => a && a.topic === topic);
    let navigation: NavigationLinks;
    if (rowIndex === -1) {
        // A new panel row takes over the links the page had on this panel through the "all" row
        const inherited =
            scope === 'panel' ? list.find(a => a && a.topic === ALL_PANELS_SPECIAL_ID)?.navigation : undefined;
        navigation = { ...(inherited ?? {}) };
    } else {
        navigation = { ...(list[rowIndex].navigation ?? {}) };
    }
    if (target === undefined) {
        delete navigation[kind];
    } else {
        navigation[kind] = target;
    }
    const row: NavigationAssignment = rowIndex === -1 ? { topic, navigation } : { ...list[rowIndex], navigation };
    const navigationAssignment = rowIndex === -1 ? [...list, row] : list.map((a, i) => (i === rowIndex ? row : a));
    const updated = dropScriptNavigation({ ...entry, navigationAssignment });
    return entries.map((e, i) => (i === index ? updated : e));
}

/** The four links of a page, as the adapter would apply them */
type ResolvedLinks = {
    prev: string | undefined;
    next: string | undefined;
    home: string | undefined;
    parent: string | undefined;
};

/**
 * Maps a stored link target to the node it names: the entry flagged as start page is published
 * under `main`, an empty value is no link.
 *
 * @param entries Page configuration.
 * @returns The mapping function.
 */
function targetResolver(entries: PageConfigEntry[]): (target: string | undefined) => string | undefined {
    const mainAliases = new Set(
        entries.filter(e => e && isMainPageEntry(e) && e.uniqueName !== mainPageName).map(e => e.uniqueName),
    );
    return (target: string | undefined): string | undefined => {
        if (!target) {
            return undefined;
        }
        return mainAliases.has(target) ? mainPageName : target;
    };
}

/**
 * The configured links of a touched admin page, resolved to node names.
 *
 * @param item Entry of the navigation map.
 * @param entries Page configuration.
 * @param panelTopic Topic of the panel.
 * @param touchedPages Node ids of the pages whose configuration was changed.
 * @param resolve Target resolver of {@link targetResolver}.
 * @returns The links, or `undefined` when the page is not touched, not from the admin, has no
 * entry or is not assigned to the panel.
 */
function configuredLinksOf(
    item: NavigationMapEntry,
    entries: PageConfigEntry[],
    panelTopic: string,
    touchedPages: ReadonlySet<string>,
    resolve: (target: string | undefined) => string | undefined,
): ResolvedLinks | undefined {
    if (!touchedPages.has(item.page) || item.origin !== 'admin' || !item.adminPageName) {
        return undefined;
    }
    const entry = entries.find(e => e && e.uniqueName === item.adminPageName);
    const links = entry ? effectiveNavigation(entry, panelTopic) : undefined;
    if (!links) {
        return undefined;
    }
    return {
        prev: resolve(links.prev),
        next: resolve(links.next),
        home: resolve(links.home),
        parent: resolve(links.parent),
    };
}

/**
 * Overlays the unsaved configuration of some pages onto the navigation map the adapter reported.
 *
 * For every page in `touchedPages` that comes from the admin, prev/next/home/parent are replaced
 * by what the configuration says for this panel, with the rules the adapter applies at start:
 * a target naming the start page entry is mapped to `main`, home/parent pointing at the page
 * itself are dropped, and a page without any link gets `home = main`.
 *
 * The adapter also chains prev/next: a page whose `next` is P makes P's `prev` point back at it.
 * That is reproduced for the touched pages: a prev/next not set in the configuration is taken
 * from the first page (in map order) whose effective next/prev points at the touched page. The
 * effective links of a touched page are its configured ones, those of every other page come from
 * the map. The full splice logic of the adapter needs a restart.
 *
 * @param map Navigation map as reported by the adapter.
 * @param entries Page configuration (`native.pageConfig`), possibly with unsaved changes.
 * @param panelTopic Topic of the panel the map belongs to.
 * @param touchedPages Node ids of the pages whose configuration was changed.
 * @returns A new map; pages not touched, not from the admin or without an entry are left as they are.
 */
export function applyNavigationOverlay(
    map: NavigationMap,
    entries: PageConfigEntry[],
    panelTopic: string,
    touchedPages: ReadonlySet<string>,
): NavigationMap {
    const resolve = targetResolver(entries);
    // Configured links of the touched pages; every other page keeps what the map says
    const configured = new Map<string, ResolvedLinks>();
    for (const item of map) {
        const links = configuredLinksOf(item, entries, panelTopic, touchedPages, resolve);
        if (links) {
            configured.set(item.page, links);
        }
    }
    const effectiveOf = (item: NavigationMapEntry): { prev?: string; next?: string } =>
        configured.get(item.page) ?? item;
    const counterpart = (page: string, link: 'prev' | 'next'): string | undefined =>
        map.find(other => other.page !== page && effectiveOf(other)[link] === page)?.page;

    return map.map((item): NavigationMapEntry => {
        const links = configured.get(item.page);
        if (!links) {
            return item;
        }
        const nav: ResolvedLinks = {
            prev: links.prev ?? counterpart(item.page, 'next'),
            next: links.next ?? counterpart(item.page, 'prev'),
            home: links.home,
            parent: links.parent,
        };
        if (nav.home === item.page) {
            nav.home = undefined;
        }
        if (nav.parent === item.page) {
            nav.parent = undefined;
        }
        if (!nav.prev && !nav.next && !nav.home && !nav.parent && item.page !== mainPageName) {
            nav.home = mainPageName;
        }
        return { ...item, ...nav };
    });
}

/**
 * Whether the navigation map the adapter reported already reflects the configuration of a page -
 * after a restart, the page no longer counts as changed then.
 *
 * home/parent have to match what the adapter would apply (self references dropped, default home).
 * prev/next have to match only where the configuration sets them: the adapter chains the rest.
 *
 * @param map Navigation map as reported by the adapter.
 * @param entries Page configuration.
 * @param panelTopic Topic of the panel the map belongs to.
 * @param page Node id of the page.
 * @returns True when the map matches, or when the page is unknown to map or configuration.
 */
export function isNavigationApplied(
    map: NavigationMap,
    entries: PageConfigEntry[],
    panelTopic: string,
    page: string,
): boolean {
    const item = map.find(e => e.page === page);
    if (!item) {
        return true;
    }
    const expected = applyNavigationOverlay(map, entries, panelTopic, new Set([page])).find(e => e.page === page);
    const links = configuredLinksOf(item, entries, panelTopic, new Set([page]), targetResolver(entries));
    if (!expected || !links) {
        return true;
    }
    const same = (a: string | undefined, b: string | undefined): boolean => (a || undefined) === (b || undefined);
    // A link to a page the panel does not have is dropped by the adapter (it only warns), so the
    // map can never show it - such a link counts as applied, otherwise the page would stay marked
    // as unsaved forever.
    const known = new Set(map.map(e => e.page));
    const applied = (configured: string | undefined, actual: string | undefined): boolean =>
        !configured || !known.has(configured) || same(configured, actual);
    return (
        (expected.home && !known.has(expected.home) ? true : same(expected.home, item.home)) &&
        (expected.parent && !known.has(expected.parent) ? true : same(expected.parent, item.parent)) &&
        applied(links.prev, item.prev) &&
        applied(links.next, item.next)
    );
}
