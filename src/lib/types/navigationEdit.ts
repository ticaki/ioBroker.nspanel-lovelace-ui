/**
 * Pure helpers for editing the navigation links (prev/next/home/parent) of pages in the flow.
 *
 * Admin pages are edited in `native.pageConfig`, script pages through overrides in
 * `native.navigationOverrides` (see `NavigationOverride`), which the adapter applies on top of the
 * script at start (`src/lib/configuration/navigation-overrides.ts`).
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
    type NavigationLinks,
    type NavigationMap,
    type NavigationMapEntry,
    type NavigationOverride,
    type PageConfigEntry,
} from './adminShareConfig';

/** Re-exported: the type moved to `adminShareConfig.ts` when the adapter started to use it as well. */
export type { NavigationLinks } from './adminShareConfig';

/** The four navigation links a page can carry in its configuration. */
export type NavigationLinkKind = 'prev' | 'next' | 'home' | 'parent';

/** All link kinds, in the order the flow draws them. */
export const navigationLinkKinds: readonly NavigationLinkKind[] = ['prev', 'next', 'home', 'parent'];

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

// -------------------------------------------------------------------------------------------------
// Script pages: overrides in `native.navigationOverrides`
// -------------------------------------------------------------------------------------------------

/**
 * A link value as stored, or `undefined` for an empty one - `''` and `undefined` mean the same.
 *
 * @param value Stored link target.
 * @returns The target, or `undefined` when empty.
 */
function linkOrUndefined(value: string | undefined): string | undefined {
    return value ? value : undefined;
}

/**
 * Whether two link sets differ in any of the four links. An empty string counts as no link.
 *
 * @param a First link set.
 * @param b Second link set.
 * @returns True when at least one link differs.
 */
export function navigationLinksDiffer(a: NavigationLinks, b: NavigationLinks): boolean {
    return navigationLinkKinds.some(kind => linkOrUndefined(a[kind]) !== linkOrUndefined(b[kind]));
}

/**
 * Whether the script changed since the override was made: its current links differ from the
 * snapshot the override carries.
 *
 * @param override The override.
 * @param currentScriptLinks Links the script delivers now.
 * @returns True when the snapshot is out of date.
 */
export function isOverrideStale(override: NavigationOverride, currentScriptLinks: NavigationLinks): boolean {
    return navigationLinksDiffer(override.scriptLinks ?? {}, currentScriptLinks);
}

/**
 * Three-way merge of a stale override with the current script: a link the user changed (differs
 * from the snapshot) keeps the user's value, every other link takes what the script says now.
 *
 * @param override The override, with the snapshot of the script it was made against.
 * @param currentScriptLinks Links the script delivers now.
 * @returns The merged links; empty ones are left out.
 */
export function mergeNavigationOverride(
    override: NavigationOverride,
    currentScriptLinks: NavigationLinks,
): NavigationLinks {
    const result: NavigationLinks = {};
    const snapshot = override.scriptLinks ?? {};
    const user = override.navigation ?? {};
    for (const kind of navigationLinkKinds) {
        const changedByUser = linkOrUndefined(user[kind]) !== linkOrUndefined(snapshot[kind]);
        const value = changedByUser ? linkOrUndefined(user[kind]) : linkOrUndefined(currentScriptLinks[kind]);
        if (value) {
            result[kind] = value;
        }
    }
    return result;
}

/**
 * The override of a page on a panel, if there is one.
 *
 * @param overrides All overrides of the instance (`native.navigationOverrides`).
 * @param panelTopic Topic of the panel.
 * @param page Node id of the script page.
 * @returns The override, or `undefined`.
 */
export function overrideOf(
    overrides: readonly NavigationOverride[],
    panelTopic: string,
    page: string,
): NavigationOverride | undefined {
    return overrides.find(o => o && o.panelTopic === panelTopic && o.page === page);
}

/**
 * Sets or removes one navigation link of a script page through its override.
 *
 * The input is left untouched; the result is a new array with a new override for the page. When
 * nothing has to change (self reference, link already stored that way) the input array itself is
 * returned, so callers can detect a no-op by identity.
 *
 * A missing override is created: its `navigation` starts as a copy of the current script links,
 * so the other links of the page survive, and `scriptLinks` keeps those links as the snapshot the
 * override was made against. An existing override keeps its snapshot - unless it is stale: the
 * user edits with the changed script in view, so the snapshot moves on to the current script
 * links. `target === undefined` removes the link.
 *
 * @param overrides All overrides of the instance (`native.navigationOverrides`).
 * @param panelTopic Topic of the panel the change is made for.
 * @param page Node id of the script page.
 * @param kind Which link to set.
 * @param target Node name of the target page, `undefined` to remove the link.
 * @param scriptLinks Links the script gives the page right now (`NavigationMapEntry.scriptLinks`).
 * @returns The updated overrides (a new array), or `overrides` itself when nothing changed.
 */
export function setOverrideLink(
    overrides: readonly NavigationOverride[],
    panelTopic: string,
    page: string,
    kind: NavigationLinkKind,
    target: string | undefined,
    scriptLinks: NavigationLinks,
): readonly NavigationOverride[] {
    if (!page || target === page) {
        return overrides;
    }
    const index = overrides.findIndex(o => o && o.panelTopic === panelTopic && o.page === page);
    const existing = index === -1 ? undefined : overrides[index];
    const navigation: NavigationLinks = { ...(existing ? (existing.navigation ?? {}) : scriptLinks) };
    if (linkOrUndefined(navigation[kind]) === linkOrUndefined(target)) {
        return overrides;
    }
    if (target === undefined) {
        delete navigation[kind];
    } else {
        navigation[kind] = target;
    }
    let updated: NavigationOverride;
    if (existing) {
        // A change to a stale override is made with the current script in view - the snapshot
        // moves on to it, the stale question is settled by the user's edit
        const refreshSnapshot = isOverrideStale(existing, scriptLinks);
        updated = refreshSnapshot
            ? { ...existing, navigation, scriptLinks: { ...scriptLinks } }
            : { ...existing, navigation };
    } else {
        updated = { panelTopic, page, navigation, scriptLinks: { ...scriptLinks } };
    }
    return index === -1 ? [...overrides, updated] : overrides.map((o, i) => (i === index ? updated : o));
}

/**
 * Removes the override of a page on a panel - the page follows the script again.
 *
 * @param overrides All overrides of the instance.
 * @param panelTopic Topic of the panel.
 * @param page Node id of the script page.
 * @returns A new array without the override, or `overrides` itself when there was none.
 */
export function removeNavigationOverride(
    overrides: readonly NavigationOverride[],
    panelTopic: string,
    page: string,
): readonly NavigationOverride[] {
    if (!overrideOf(overrides, panelTopic, page)) {
        return overrides;
    }
    return overrides.filter(o => !(o && o.panelTopic === panelTopic && o.page === page));
}

/**
 * The links a script page has according to the admin: its override when there is one, else what
 * the script says. Only pages the adapter reported `scriptLinks` for can be edited.
 *
 * @param entry Entry of the navigation map.
 * @param overrides All overrides of the instance.
 * @param panelTopic Topic of the panel.
 * @returns A copy of the links, `undefined` for a page that is not a script page, is generated or
 * has no script links.
 */
export function effectiveScriptLinks(
    entry: NavigationMapEntry,
    overrides: readonly NavigationOverride[],
    panelTopic: string,
): NavigationLinks | undefined {
    if (entry.generated || (entry.origin !== 'script' && entry.origin !== 'global') || !entry.scriptLinks) {
        return undefined;
    }
    const override = overrideOf(overrides, panelTopic, entry.page);
    return { ...(override ? (override.navigation ?? {}) : entry.scriptLinks) };
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
 * The configured links of a touched page, resolved to node names: the page configuration for an
 * admin page, the override (or the script) for a script page.
 *
 * @param item Entry of the navigation map.
 * @param entries Page configuration.
 * @param panelTopic Topic of the panel.
 * @param touchedPages Node ids of the pages whose configuration was changed.
 * @param resolve Target resolver of {@link targetResolver}.
 * @param overrides Navigation overrides of the script pages.
 * @returns The links, or `undefined` when the page is not touched, cannot be edited, has no entry
 * or is not assigned to the panel.
 */
function configuredLinksOf(
    item: NavigationMapEntry,
    entries: PageConfigEntry[],
    panelTopic: string,
    touchedPages: ReadonlySet<string>,
    resolve: (target: string | undefined) => string | undefined,
    overrides: readonly NavigationOverride[],
): ResolvedLinks | undefined {
    if (!touchedPages.has(item.page) || item.generated) {
        return undefined;
    }
    let links: NavigationLinks | undefined;
    if (item.origin === 'admin' && item.adminPageName) {
        const entry = entries.find(e => e && e.uniqueName === item.adminPageName);
        links = entry ? effectiveNavigation(entry, panelTopic) : undefined;
    } else {
        links = effectiveScriptLinks(item, overrides, panelTopic);
    }
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

/** prev/next of a page as the admin holds them: configured for an admin page, override/script for a script page. */
type OwnChainLinks = { prev?: string; next?: string };

/**
 * The prev/next a page has on its own account, before any chaining: the page configuration for an
 * admin page, the override (or the script) for a script page. `undefined` for a page the admin
 * knows nothing about (system page, admin page without entry, script page without script links).
 *
 * @param item Entry of the navigation map.
 * @param entries Page configuration.
 * @param panelTopic Topic of the panel.
 * @param overrides Navigation overrides of the script pages.
 * @param resolve Target resolver of {@link targetResolver}.
 * @returns The two links, or `undefined` when unknown.
 */
function ownChainLinksOf(
    item: NavigationMapEntry,
    entries: PageConfigEntry[],
    panelTopic: string,
    overrides: readonly NavigationOverride[],
    resolve: (target: string | undefined) => string | undefined,
): OwnChainLinks | undefined {
    if (item.nodeType === 'stateRef' || item.generated) {
        return undefined;
    }
    let links: NavigationLinks | undefined;
    if (item.origin === 'admin') {
        const entry = item.adminPageName ? entries.find(e => e && e.uniqueName === item.adminPageName) : undefined;
        links = entry ? effectiveNavigation(entry, panelTopic) : undefined;
    } else {
        links = effectiveScriptLinks(item, overrides, panelTopic);
    }
    return links ? { prev: resolve(links.prev), next: resolve(links.next) } : undefined;
}

/**
 * The prev or next link of a page as the adapter decides it through the chaining of admin pages -
 * ahead of whatever the page configures itself. `undefined` when no admin page has a say.
 *
 * Only admin pages chain (`applyPendingNavigations` in `admin.ts`); script pages are resolved
 * one-sided by the config manager. Only admin pages that are assigned to the panel count, with
 * the links of the page configuration (unsaved changes included). The rules, in this order:
 *
 * a) direct counterpart: an admin page O with `next = P` gives `P.prev = O`, one with `prev = P`
 *    gives `P.next = O` (step 1/3/5 of the adapter).
 * b) insert before the neighbour (step 5): P's own `next` is Q and an admin page O has `next = Q`
 *    without a `prev` - O is spliced between them, so `P.next = O`.
 * c) insert after the neighbour (step 3/4, `spliceChainAfter`): P's own `prev` is Q, Q's own
 *    `next` is P (or unknown) and admin pages have `prev = Q` - the chain goes in between and the
 *    old neighbour P is attached to its end, so `P.prev` = the last of them. Approximation: the
 *    adapter orders a group by its `next` pointers first, here the last admin page in map order is
 *    taken, and only when it has no `next` of its own (otherwise the splice end is not wired).
 *
 * In b) and c) a page P that is an admin page in the same chain (same `next` without `prev`, or
 * the same `prev`) is left alone: the adapter orders those among themselves, which is not modelled.
 *
 * @param map Navigation map as reported by the adapter.
 * @param entries Page configuration (`native.pageConfig`).
 * @param panelTopic Topic of the panel.
 * @param page Node id of the page P.
 * @param link Which link of P is asked for.
 * @param overrides Navigation overrides of the script pages (`native.navigationOverrides`).
 * @returns Node id the adapter sets the link to, `undefined` when it leaves it to the configuration.
 */
export function adapterDecidedLink(
    map: NavigationMap,
    entries: PageConfigEntry[],
    panelTopic: string,
    page: string,
    link: 'prev' | 'next',
    overrides: readonly NavigationOverride[] = [],
): string | undefined {
    const resolve = targetResolver(entries);
    const self = map.find(e => e.page === page);
    if (!self) {
        return undefined;
    }
    // Admin pages assigned to the panel, with their configured prev/next - in map order
    const admins: { page: string; prev?: string; next?: string }[] = [];
    for (const other of map) {
        if (other.page === page || other.origin !== 'admin') {
            continue;
        }
        const own = ownChainLinksOf(other, entries, panelTopic, overrides, resolve);
        if (own) {
            admins.push({ page: other.page, ...own });
        }
    }
    if (!admins.length) {
        return undefined;
    }
    // a) direct counterpart
    const opposite = link === 'prev' ? 'next' : 'prev';
    const direct = admins.find(o => o[opposite] === page);
    if (direct) {
        return direct.page;
    }
    const own = ownChainLinksOf(self, entries, panelTopic, overrides, resolve);
    const neighbour = own?.[link];
    if (!neighbour) {
        return undefined;
    }
    const selfIsAdmin = self.origin === 'admin';
    if (link === 'next') {
        // b) an admin page without prev that wants to sit right before P's next
        if (selfIsAdmin && !own?.prev) {
            return undefined;
        }
        return admins.find(o => o.next === neighbour && !o.prev)?.page;
    }
    // c) a chain of admin pages after P's prev - P is moved behind it
    if (selfIsAdmin) {
        return undefined;
    }
    const previous = map.find(e => e.page === neighbour);
    const previousOwn = previous ? ownChainLinksOf(previous, entries, panelTopic, overrides, resolve) : undefined;
    if (previousOwn && previousOwn.next !== page) {
        return undefined;
    }
    const chain = admins.filter(o => o.prev === neighbour);
    const last = chain[chain.length - 1];
    return last && !last.next ? last.page : undefined;
}

/**
 * Overlays the unsaved configuration of some pages onto the navigation map the adapter reported.
 *
 * For every page in `touchedPages` that comes from the admin, prev/next/home/parent are replaced
 * by what the configuration says for this panel, with the rules the adapter applies at start:
 * a target naming the start page entry is mapped to `main`, home/parent pointing at the page
 * itself are dropped, and a page without any configured link gets `home = main`.
 *
 * The adapter also chains prev/next - but only for admin pages, and ahead of what a page
 * configures itself (see {@link adapterDecidedLink}). That is reproduced for the touched pages,
 * admin and script pages alike: prev/next come from the chaining first, then from the
 * configuration. The full splice logic of the adapter needs a restart.
 *
 * Touched script pages get the links of their override (or of the script, when the override was
 * removed) the same way.
 *
 * @param map Navigation map as reported by the adapter.
 * @param entries Page configuration (`native.pageConfig`), possibly with unsaved changes.
 * @param panelTopic Topic of the panel the map belongs to.
 * @param touchedPages Node ids of the pages whose configuration was changed.
 * @param overrides Navigation overrides of the script pages (`native.navigationOverrides`).
 * @returns A new map; pages not touched, not editable or without an entry are left as they are.
 */
export function applyNavigationOverlay(
    map: NavigationMap,
    entries: PageConfigEntry[],
    panelTopic: string,
    touchedPages: ReadonlySet<string>,
    overrides: readonly NavigationOverride[] = [],
): NavigationMap {
    const resolve = targetResolver(entries);
    // Configured links of the touched pages; every other page keeps what the map says
    const configured = new Map<string, ResolvedLinks>();
    for (const item of map) {
        const links = configuredLinksOf(item, entries, panelTopic, touchedPages, resolve, overrides);
        if (links) {
            configured.set(item.page, links);
        }
    }

    return map.map((item): NavigationMapEntry => {
        const links = configured.get(item.page);
        if (!links) {
            return item;
        }
        const nav: ResolvedLinks = {
            prev: adapterDecidedLink(map, entries, panelTopic, item.page, 'prev', overrides) ?? links.prev,
            next: adapterDecidedLink(map, entries, panelTopic, item.page, 'next', overrides) ?? links.next,
            home: links.home,
            parent: links.parent,
        };
        if (nav.home === item.page) {
            nav.home = undefined;
        }
        if (nav.parent === item.page) {
            nav.parent = undefined;
        }
        // The adapter decides on the default home before it chains prev/next - a derived
        // counterpart does not count as a link of the page
        if (!links.prev && !links.next && !nav.home && !nav.parent && item.page !== mainPageName) {
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
 * prev/next have to match only where the configuration sets them and the chaining of admin pages
 * does not decide them (see {@link adapterDecidedLink}).
 *
 * For a script page the links of its override (or of the script, when the override was removed)
 * are compared the same way.
 *
 * @param map Navigation map as reported by the adapter.
 * @param entries Page configuration.
 * @param panelTopic Topic of the panel the map belongs to.
 * @param page Node id of the page.
 * @param overrides Navigation overrides of the script pages (`native.navigationOverrides`).
 * @returns True when the map matches, or when the page is unknown to map or configuration.
 */
export function isNavigationApplied(
    map: NavigationMap,
    entries: PageConfigEntry[],
    panelTopic: string,
    page: string,
    overrides: readonly NavigationOverride[] = [],
): boolean {
    const item = map.find(e => e.page === page);
    if (!item) {
        return true;
    }
    const touched = new Set([page]);
    const expected = applyNavigationOverlay(map, entries, panelTopic, touched, overrides).find(e => e.page === page);
    const links = configuredLinksOf(item, entries, panelTopic, touched, targetResolver(entries), overrides);
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
    const prevByAdmin = adapterDecidedLink(map, entries, panelTopic, page, 'prev', overrides) !== undefined;
    const nextByAdmin = adapterDecidedLink(map, entries, panelTopic, page, 'next', overrides) !== undefined;
    return (
        (expected.home && !known.has(expected.home) ? true : same(expected.home, item.home)) &&
        (expected.parent && !known.has(expected.parent) ? true : same(expected.parent, item.parent)) &&
        (prevByAdmin || applied(links.prev, item.prev)) &&
        (nextByAdmin || applied(links.next, item.next))
    );
}
