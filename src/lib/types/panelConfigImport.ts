/**
 * Import of a panel configuration exported by {@link buildPanelConfigExport} into one panel (admin, panel tile).
 *
 * Pure helpers shared between the adapter (tests) and the admin bundle, therefore no adapter imports here.
 * The admin parses the file ({@link parsePanelConfigImport}), computes a plan ({@link planPanelImport}) the user
 * can change in the review dialog (rename / replace / skip per conflict), and applies it ({@link applyPanelImport}):
 * the result are the new native tables (written with one onChange) and the settings states to write.
 *
 * Merge rules (Tim, 2026-11-11):
 * - Pages: the own assignments of the target topic are removed from all pages first (unassigned pages stay).
 *   An imported page whose name is free is added; one whose name exists and that is identical apart from the
 *   panel assignment is not added again, the existing page gets the assignment of the target; one that differs
 *   is renamed (proposal), replaced or skipped. Renames ripple through the references of the imported data,
 *   which may make further pages different (fixpoint).
 * - Screensaver: the topic is removed from all entries, then the same rule (identical ignoring `panels` and
 *   `name` -> the topic is added to that entry).
 * - Misc: buttons, noScript and navigation overrides of the target are set exactly as in the file.
 */
import {
    ALL_PANELS_SPECIAL_ID,
    isPageLinkEntry,
    mainPageName,
    newItemId,
    newScreensaverNotifyId,
    normalizeScreensaverEntry,
    type AdminButtonFunction,
    type AdminPageItemConfig,
    type NavigationAssignment,
    type NavigationLinks,
    type NavigationOverride,
    type PageConfigEntry,
    type ScreensaverEntry,
    type ScreensaverItemConfig,
    type ScreensaverNotifyConfig,
} from './adminShareConfig';
import {
    effectivePageAssignment,
    PANEL_CONFIG_FORMAT,
    PANEL_CONFIG_VERSION,
    panelConfigGroups,
    panelSettingStates,
    type ExportedMiscGroup,
    type ExportedPage,
    type ExportedPagesGroup,
    type ExportedScreensaverGroup,
    type ExportNative,
    type ExportPanel,
    type PageSecretField,
    type PanelConfigExport,
    type PanelConfigGroup,
    type PanelSettingValue,
} from './panelConfigExport';

// ---------------------------------------------------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------------------------------------------------

/** a parsed import file; groups the file does not hold are missing */
export type PanelConfigImportFile = Omit<PanelConfigExport, 'groups'> & {
    groups: Partial<PanelConfigExport['groups']>;
};

/** why a file cannot be imported: translation key and the place in the file */
export type PanelImportError = {
    key: 'importErrorJson' | 'importErrorFormat' | 'importErrorVersion' | 'importErrorStructure';
    detail?: string;
};

/**
 * @param value anything
 * @returns true for a plain object
 */
function isDict(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param value anything
 * @returns true for navigation links (every value a string)
 */
function isNavigationLinks(value: unknown): value is NavigationLinks {
    return (
        isDict(value) &&
        Object.entries(value).every(
            ([k, v]) => ['next', 'prev', 'home', 'parent'].includes(k) && (v === undefined || typeof v === 'string'),
        )
    );
}

/**
 * @param value anything
 * @returns true for an action of a hardware button (null = no action)
 */
function isButtonFunction(value: unknown): value is AdminButtonFunction {
    return value === null || (isDict(value) && typeof value.mode === 'string');
}

/**
 * Checks the structure of the pages group.
 *
 * @param value the group
 * @returns the error path, undefined if the group is fine
 */
function pagesGroupProblem(value: unknown): string | undefined {
    if (!isDict(value) || !Array.isArray(value.pages)) {
        return 'groups.pages';
    }
    const names = new Set<string>();
    for (const [i, p] of value.pages.entries()) {
        const where = `groups.pages.pages[${i}]`;
        if (!isDict(p) || !isDict(p.page)) {
            return where;
        }
        if (typeof p.page.uniqueName !== 'string' || !p.page.uniqueName || typeof p.page.card !== 'string') {
            return `${where}.page`;
        }
        if (names.has(p.page.uniqueName)) {
            return `${where}.page.uniqueName`;
        }
        names.add(p.page.uniqueName);
        if (p.assignment !== 'own' && p.assignment !== 'all' && p.assignment !== 'none') {
            return `${where}.assignment`;
        }
        if (p.navigation !== undefined && !isNavigationLinks(p.navigation)) {
            return `${where}.navigation`;
        }
        if (
            p.strippedSecrets !== undefined &&
            (!Array.isArray(p.strippedSecrets) || p.strippedSecrets.some(f => f !== 'pin' && f !== 'qrPass'))
        ) {
            return `${where}.strippedSecrets`;
        }
    }
    if (
        value.excludedAllPages !== undefined &&
        (!Array.isArray(value.excludedAllPages) || value.excludedAllPages.some(n => typeof n !== 'string'))
    ) {
        return 'groups.pages.excludedAllPages';
    }
    return undefined;
}

/**
 * @param value the screensaver group
 * @returns the error path, undefined if the group is fine
 */
function screensaverGroupProblem(value: unknown): string | undefined {
    if (!isDict(value) || !Array.isArray(value.notify)) {
        return 'groups.screensaver';
    }
    const entry = value.entry;
    if (entry !== null) {
        if (!isDict(entry) || typeof entry.name !== 'string' || typeof entry.mode !== 'string') {
            return 'groups.screensaver.entry';
        }
        for (const area of ['left', 'bottom', 'indicator']) {
            if (entry[area] !== undefined && !Array.isArray(entry[area])) {
                return `groups.screensaver.entry.${area}`;
            }
        }
        if (
            entry.notify !== undefined &&
            (!Array.isArray(entry.notify) || entry.notify.some(n => typeof n !== 'string'))
        ) {
            return 'groups.screensaver.entry.notify';
        }
    }
    for (const [i, n] of value.notify.entries()) {
        if (!isDict(n) || typeof n.id !== 'string' || !Array.isArray(n.enabled)) {
            return `groups.screensaver.notify[${i}]`;
        }
    }
    return undefined;
}

/**
 * @param value the misc group
 * @returns the error path, undefined if the group is fine
 */
function miscGroupProblem(value: unknown): string | undefined {
    if (!isDict(value) || !Array.isArray(value.navigationOverrides) || !isDict(value.states)) {
        return 'groups.misc';
    }
    for (const key of ['buttonLeft', 'buttonRight']) {
        if (key in value && value[key] !== undefined && !isButtonFunction(value[key])) {
            return `groups.misc.${key}`;
        }
    }
    if (value.noScript !== undefined && typeof value.noScript !== 'boolean') {
        return 'groups.misc.noScript';
    }
    for (const [i, o] of value.navigationOverrides.entries()) {
        if (!isDict(o) || typeof o.page !== 'string' || !isNavigationLinks(o.navigation)) {
            return `groups.misc.navigationOverrides[${i}]`;
        }
    }
    for (const [k, v] of Object.entries(value.states)) {
        if (typeof v !== 'boolean' && typeof v !== 'number' && typeof v !== 'string') {
            return `groups.misc.states.${k}`;
        }
    }
    return undefined;
}

/**
 * Parses and checks an import file.
 *
 * @param text content of the file
 * @returns the file or why it cannot be imported
 */
export function parsePanelConfigImport(
    text: string,
): { ok: true; file: PanelConfigImportFile } | { ok: false; error: PanelImportError } {
    let json: unknown;
    try {
        json = JSON.parse(text);
    } catch (e) {
        return { ok: false, error: { key: 'importErrorJson', detail: e instanceof Error ? e.message : String(e) } };
    }
    if (!isDict(json) || json.format !== PANEL_CONFIG_FORMAT) {
        return { ok: false, error: { key: 'importErrorFormat' } };
    }
    if (typeof json.version !== 'number' || !Number.isInteger(json.version) || json.version < 1) {
        return { ok: false, error: { key: 'importErrorStructure', detail: 'version' } };
    }
    if (json.version > PANEL_CONFIG_VERSION) {
        return { ok: false, error: { key: 'importErrorVersion', detail: String(json.version) } };
    }
    const source = json.source;
    if (!isDict(source) || typeof source.topic !== 'string' || typeof source.model !== 'string') {
        return { ok: false, error: { key: 'importErrorStructure', detail: 'source' } };
    }
    if (!isDict(json.groups)) {
        return { ok: false, error: { key: 'importErrorStructure', detail: 'groups' } };
    }
    const groups = json.groups;
    const problem =
        (groups.pages !== undefined ? pagesGroupProblem(groups.pages) : undefined) ??
        (groups.screensaver !== undefined ? screensaverGroupProblem(groups.screensaver) : undefined) ??
        (groups.misc !== undefined ? miscGroupProblem(groups.misc) : undefined);
    if (problem) {
        return { ok: false, error: { key: 'importErrorStructure', detail: problem } };
    }
    const file: PanelConfigImportFile = {
        format: PANEL_CONFIG_FORMAT,
        version: json.version,
        secretsIncluded: json.secretsIncluded === true,
        exportedAt: typeof json.exportedAt === 'string' ? json.exportedAt : '',
        source: {
            id: typeof source.id === 'string' ? source.id : '',
            topic: source.topic,
            name: typeof source.name === 'string' ? source.name : '',
            model: source.model,
            kind: source.kind === 'web' ? 'web' : 'tasmota',
        },
        groups: {},
    };
    if (typeof json.adapterVersion === 'string') {
        file.adapterVersion = json.adapterVersion;
    }
    // the structure was checked above - from here on the groups are taken as the types say
    if (groups.pages !== undefined) {
        const pages = structuredClone(groups.pages) as ExportedPagesGroup;
        pages.excludedAllPages = pages.excludedAllPages ?? [];
        file.groups.pages = pages;
    }
    if (groups.screensaver !== undefined) {
        file.groups.screensaver = structuredClone(groups.screensaver) as ExportedScreensaverGroup;
    }
    if (groups.misc !== undefined) {
        file.groups.misc = structuredClone(groups.misc) as ExportedMiscGroup;
    }
    return { ok: true, file };
}

/**
 * @param file the parsed file
 * @param selected the groups the user wants to import
 * @returns the selected groups the file holds and those it does not
 */
export function splitImportGroups(
    file: PanelConfigImportFile,
    selected: readonly PanelConfigGroup[],
): { present: PanelConfigGroup[]; missing: PanelConfigGroup[] } {
    const present = panelConfigGroups.filter(g => selected.includes(g) && file.groups[g] !== undefined);
    const missing = panelConfigGroups.filter(g => selected.includes(g) && file.groups[g] === undefined);
    return { present, missing };
}

// ---------------------------------------------------------------------------------------------------------------
// defaults of the target
// ---------------------------------------------------------------------------------------------------------------

/**
 * Default values of the settings states. `mainNavigationPoint`, `screenSaver.layout` and `screenSaver.rotationTime`
 * are missing on purpose: the adapter writes them itself (start page, admin screensaver), they say nothing about
 * a configuration of the user.
 */
export const panelSettingDefaults: Readonly<Record<string, PanelSettingValue>> = {
    activated: true,
    tempOffset: 0,
    isBuzzerAllowed: true,
    hideCards: false,
    detachLeft: false,
    detachRight: false,
    'screenSaver.timeout': 15,
    'screenSaver.doubleClick': true,
    'screenSaver.infoIcon': '',
    'dim.standby': 15,
    'dim.active': 80,
    'dim.dayMode': true,
    'dim.nightStandby': 0,
    'dim.nightActive': 30,
    'dim.nightHourStart': 22,
    'dim.nightHourEnd': 7,
    'dim.schedule': true,
};

/** the part of `native` the import reads and writes */
export type ImportNative = ExportNative & { panels?: ExportPanel[] };

/**
 * The groups of the target panel that hold a configuration the import would overwrite.
 *
 * @param native the instance configuration
 * @param topic topic of the target
 * @param states current values of the settings states of the target (id below `cmd.`)
 * @returns the groups with a configuration that is not the default
 */
export function panelConfiguredGroups(
    native: ImportNative,
    topic: string,
    states: Record<string, unknown>,
): PanelConfigGroup[] {
    const out: PanelConfigGroup[] = [];
    if ((native.pageConfig ?? []).some(p => p && (p.navigationAssignment ?? []).some(a => a && a.topic === topic))) {
        out.push('pages');
    }
    if ((native.screensaverConfig ?? []).some(e => e && Array.isArray(e.panels) && e.panels.includes(topic))) {
        out.push('screensaver');
    }
    const panel = (native.panels ?? []).find(p => p && p.topic === topic);
    if (
        (panel && (panel.buttonLeft !== undefined || panel.buttonRight !== undefined || !!panel.noScript)) ||
        (native.navigationOverrides ?? []).some(o => o && o.panelTopic === topic) ||
        Object.entries(panelSettingDefaults).some(([id, def]) => states[id] !== undefined && states[id] !== def)
    ) {
        out.push('misc');
    }
    return out;
}

// ---------------------------------------------------------------------------------------------------------------
// comparing
// ---------------------------------------------------------------------------------------------------------------

/**
 * A copy for comparing: keys sorted, undefined properties dropped, undefined in arrays as null (like JSON).
 *
 * @param value anything
 * @returns the canonical copy
 */
function canonical(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(v => (v === undefined ? null : canonical(v)));
    }
    if (isDict(value)) {
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(value).sort()) {
            if (value[key] !== undefined) {
                out[key] = canonical(value[key]);
            }
        }
        return out;
    }
    return value;
}

/**
 * @param a anything
 * @param b anything
 * @returns true when both are equal apart from key order and undefined-vs-absent
 */
export function sameConfig(a: unknown, b: unknown): boolean {
    return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

/**
 * The page as compared: without assignments, item ids and the secret fields the file left out.
 *
 * @param page the page
 * @param ignore secret fields to ignore
 * @returns the copy
 */
function comparablePage(page: PageConfigEntry, ignore: readonly PageSecretField[]): Record<string, unknown> {
    const copy: Record<string, unknown> = { ...page };
    delete copy.navigationAssignment;
    for (const field of ignore) {
        delete copy[field];
    }
    if (Array.isArray(copy.pageItems)) {
        copy.pageItems = copy.pageItems.map((item: unknown) => {
            if (!isDict(item)) {
                return item;
            }
            const rest = { ...item };
            delete rest.itemId;
            return rest;
        });
    }
    return copy;
}

/**
 * @param existing page of the instance
 * @param imported page of the file (references already remapped)
 * @param stripped secret fields the file left out
 * @returns true when both are the same page apart from the panel assignment
 */
export function samePage(
    existing: PageConfigEntry,
    imported: PageConfigEntry,
    stripped: readonly PageSecretField[] = [],
): boolean {
    return sameConfig(comparablePage(existing, stripped), comparablePage(imported, stripped));
}

/** one difference of the detail dialog */
export type ConfigDiffEntry =
    | { kind: 'field'; field: string; existing: string; imported: string }
    | {
          kind: 'item';
          /** name of the list, e.g. pageItems, left, bottom */
          list: string;
          /** 1-based position */
          position: number;
          change: 'added' | 'removed' | 'changed';
          /** short name of the item (name, state or channel) */
          label: string;
          /** changed fields, `changed` only */
          fields?: string[];
          /** values of the changed fields, `changed` only */
          values?: { field: string; existing: string; imported: string }[];
      }
    | { kind: 'navigation'; link: keyof NavigationLinks; existing: string; imported: string };

/**
 * @param value anything
 * @returns a short readable text of a value
 */
function shortValue(value: unknown): string {
    if (value === undefined) {
        return '';
    }
    const text = typeof value === 'string' ? value : JSON.stringify(canonical(value));
    return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

/**
 * @param item an item of a page or screensaver
 * @returns a short name of it
 */
function itemLabel(item: unknown): string {
    if (!isDict(item)) {
        return '';
    }
    if (typeof item.name === 'string' && item.name) {
        return item.name;
    }
    if (isDict(item.channelId) && typeof item.channelId.valueStateId === 'string') {
        return item.channelId.valueStateId;
    }
    if (typeof item.state === 'string') {
        return item.state;
    }
    return typeof item.role === 'string' ? item.role : '';
}

/** lists of items compared position by position */
const ITEM_LISTS: readonly string[] = ['pageItems', 'left', 'bottom', 'indicator', 'alternate', 'items', 'circuits'];

/**
 * Readable differences of two configurations (page or screensaver): top level fields and the items of the
 * item lists position by position.
 *
 * @param existing configuration of the instance
 * @param imported configuration of the file
 * @param ignore top level fields not to compare
 * @returns the differences
 */
export function configDiff(existing: unknown, imported: unknown, ignore: readonly string[] = []): ConfigDiffEntry[] {
    const a = isDict(existing) ? existing : {};
    const b = isDict(imported) ? imported : {};
    const out: ConfigDiffEntry[] = [];
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => !ignore.includes(k)).sort();
    for (const key of keys) {
        const va = a[key];
        const vb = b[key];
        if (sameConfig(va, vb)) {
            continue;
        }
        if (ITEM_LISTS.includes(key) && (Array.isArray(va) || Array.isArray(vb))) {
            const la: unknown[] = Array.isArray(va) ? va : [];
            const lb: unknown[] = Array.isArray(vb) ? vb : [];
            for (let i = 0; i < Math.max(la.length, lb.length); i++) {
                const ia = la[i] ?? null;
                const ib = lb[i] ?? null;
                const stripId = (v: unknown): unknown => {
                    if (!isDict(v)) {
                        return v;
                    }
                    const rest = { ...v };
                    delete rest.itemId;
                    return rest;
                };
                if (sameConfig(stripId(ia), stripId(ib))) {
                    continue;
                }
                if (ia === null) {
                    out.push({ kind: 'item', list: key, position: i + 1, change: 'added', label: itemLabel(ib) });
                } else if (ib === null) {
                    out.push({ kind: 'item', list: key, position: i + 1, change: 'removed', label: itemLabel(ia) });
                } else {
                    const da = isDict(ia) ? ia : {};
                    const db = isDict(ib) ? ib : {};
                    const fields = [...new Set([...Object.keys(da), ...Object.keys(db)])]
                        .filter(f => f !== 'itemId' && !sameConfig(da[f], db[f]))
                        .sort();
                    out.push({
                        kind: 'item',
                        list: key,
                        position: i + 1,
                        change: 'changed',
                        label: itemLabel(ib) || itemLabel(ia),
                        fields,
                        values: fields.map(f => ({
                            field: f,
                            existing: shortValue(da[f]),
                            imported: shortValue(db[f]),
                        })),
                    });
                }
            }
            continue;
        }
        out.push({ kind: 'field', field: key, existing: shortValue(va), imported: shortValue(vb) });
    }
    return out;
}

/**
 * @param existing navigation of the page on the target now
 * @param imported navigation of the file
 * @returns the differing links
 */
export function navigationDiff(
    existing: NavigationLinks | undefined,
    imported: NavigationLinks | undefined,
): ConfigDiffEntry[] {
    const out: ConfigDiffEntry[] = [];
    for (const link of ['prev', 'next', 'home', 'parent'] as const) {
        const a = existing?.[link] ?? '';
        const b = imported?.[link] ?? '';
        if (a !== b) {
            out.push({ kind: 'navigation', link, existing: a, imported: b });
        }
    }
    return out;
}

// ---------------------------------------------------------------------------------------------------------------
// references
// ---------------------------------------------------------------------------------------------------------------

/**
 * @param nav navigation links
 * @param map old name -> new name
 * @returns a copy with renamed targets
 */
function remapNavigation(
    nav: NavigationLinks | undefined,
    map: ReadonlyMap<string, string>,
): NavigationLinks | undefined {
    if (!nav) {
        return nav;
    }
    const out: NavigationLinks = { ...nav };
    for (const link of ['prev', 'next', 'home', 'parent'] as const) {
        const v = out[link];
        if (v !== undefined && map.has(v)) {
            out[link] = map.get(v);
        }
    }
    return out;
}

/**
 * A copy of the page with the page references renamed: item targets, setNavi of an alarm page, target of a link.
 *
 * @param page the page
 * @param map old name -> new name
 * @returns the copy
 */
export function remapPageReferences(page: PageConfigEntry, map: ReadonlyMap<string, string>): PageConfigEntry {
    const copy = structuredClone(page);
    if (map.size === 0) {
        return copy;
    }
    const rename = (v: string | null | undefined): string | null | undefined =>
        typeof v === 'string' && map.has(v) ? map.get(v) : v;
    if (copy.card === 'cardAlarm' && copy.setNavi) {
        copy.setNavi = rename(copy.setNavi) ?? undefined;
    }
    if (isPageLinkEntry(copy)) {
        copy.target = rename(copy.target) ?? copy.target;
    }
    if ('pageItems' in copy && Array.isArray(copy.pageItems)) {
        copy.pageItems = copy.pageItems.map((item: AdminPageItemConfig | undefined) => {
            if (!item) {
                return item;
            }
            const out = { ...item };
            if (out.targetPage !== undefined) {
                out.targetPage = rename(out.targetPage) ?? undefined;
            }
            if (typeof out.targetPageLongPress === 'string') {
                out.targetPageLongPress = rename(out.targetPageLongPress);
            }
            return out;
        });
    }
    return copy;
}

/**
 * @param entry screensaver entry
 * @param fn called for every item, returns the new item
 * @returns a copy with every item passed through `fn`
 */
function mapScreensaverItems(
    entry: ScreensaverEntry,
    fn: (item: ScreensaverItemConfig) => ScreensaverItemConfig,
): ScreensaverEntry {
    const copy = structuredClone(entry);
    const each = (
        list: (ScreensaverItemConfig | undefined | null)[] | undefined,
    ): (ScreensaverItemConfig | undefined)[] | undefined => list?.map(i => (i ? fn(i) : undefined));
    if (copy.favorit) {
        copy.favorit = fn(copy.favorit);
    }
    if (copy.alternate) {
        copy.alternate = each(copy.alternate);
    }
    copy.left = each(copy.left) ?? [];
    copy.bottom = each(copy.bottom) ?? [];
    copy.indicator = each(copy.indicator) ?? [];
    return copy;
}

/**
 * @param entry screensaver entry of the file
 * @param pages page renames
 * @param itemIds item id renames
 * @param notify notification id renames
 * @returns a copy with the references renamed
 */
function remapScreensaver(
    entry: ScreensaverEntry,
    pages: ReadonlyMap<string, string>,
    itemIds: ReadonlyMap<string, string>,
    notify: ReadonlyMap<string, string>,
): ScreensaverEntry {
    const copy = mapScreensaverItems(normalizeScreensaverEntry(entry), item => {
        const page = item.action?.page;
        if (item.action && page !== undefined && pages.has(page)) {
            return { ...item, action: { ...item.action, page: pages.get(page) } };
        }
        return item;
    });
    if (copy.clockTimer?.itemId && itemIds.has(copy.clockTimer.itemId)) {
        copy.clockTimer = { ...copy.clockTimer, itemId: itemIds.get(copy.clockTimer.itemId) };
    }
    if (copy.notify) {
        copy.notify = copy.notify.map(id => notify.get(id) ?? id);
    }
    return copy;
}

/**
 * @param action hardware button action
 * @param map page renames
 * @returns a copy with the page renamed
 */
function remapButton(
    action: AdminButtonFunction | undefined,
    map: ReadonlyMap<string, string>,
): AdminButtonFunction | undefined {
    if (action && action.mode === 'page' && map.has(action.page)) {
        return { ...action, page: map.get(action.page) ?? action.page };
    }
    return action === undefined ? undefined : structuredClone(action);
}

// ---------------------------------------------------------------------------------------------------------------
// planning
// ---------------------------------------------------------------------------------------------------------------

/** what happens with an imported page or the screensaver */
export type ImportAction = 'add' | 'merge' | 'rename' | 'replace' | 'skip';

/** `none` = the name is free, `identical` = same apart from the assignment, `different` = same name, other content */
export type ImportConflict = 'none' | 'identical' | 'different';

/**
 * Net effect of a merged row (identical page or screensaver) on the target: `unchanged` = already on the target
 * with the same navigation, `assign` = not yet on the target, `navigation` = on the target with other navigation,
 * `unassign` = on the target, but the source had it only as a link target (the own assignment goes).
 */
export type MergeStatus = 'unchanged' | 'assign' | 'navigation' | 'unassign';

export type PlannedPage = {
    /** index in the pages of the file */
    index: number;
    /** name in the file */
    original: string;
    conflict: ImportConflict;
    action: ImportAction;
    /** name the page gets (rename: the new name, else the original) */
    name: string;
    /** translation key of a problem with `name` (rename only) */
    nameError?: 'importNameEmpty' | 'importNameMain' | 'importNameReserved' | 'importNameExists' | 'importNameTwice';
    /** other topics the existing page of the same name is assigned to (may contain ALL_PANELS_SPECIAL_ID) */
    sharedWith: string[];
    /** how the page was assigned to the source panel */
    assignment: ExportedPage['assignment'];
    /** secret fields the file left out */
    strippedSecrets: PageSecretField[];
    /** merge rows only: what changes on the target */
    status?: MergeStatus;
};

export type PlannedScreensaver = {
    /** name in the file */
    original: string;
    conflict: ImportConflict;
    action: ImportAction;
    name: string;
    nameError?: PlannedPage['nameError'];
    /** existing entry: identical one (merge) or the one of the same name */
    existing?: string;
    /** other panels using the existing entry */
    sharedWith: string[];
    /** merge only: `unchanged` = the entry is the screensaver of the target already, else `assign` */
    status?: MergeStatus;
};

/** choices of the user in the review dialog, by original name */
export type ImportChoice = { action: ImportAction; name?: string };

export type PanelImportPlan = {
    topic: string;
    /** groups that are imported */
    groups: PanelConfigGroup[];
    /** selected groups the file does not hold */
    missingGroups: PanelConfigGroup[];
    pages: PlannedPage[];
    /** undefined = group not imported or the file has no screensaver */
    screensaver?: PlannedScreensaver;
    /** page renames that apply to the references (rename actions) */
    renames: Record<string, string>;
    /** false while a name has a problem */
    valid: boolean;
};

export type PanelImportInput = {
    native: ImportNative;
    /** topic of the target panel */
    topic: string;
    file: PanelConfigImportFile;
    /** groups selected by the user */
    groups: readonly PanelConfigGroup[];
    /** choices of the user, by original page name; the screensaver under {@link SCREENSAVER_CHOICE_KEY} */
    choices?: Readonly<Record<string, ImportChoice>>;
};

/** key of the screensaver in {@link PanelImportInput.choices} (no page name can start with `///`) */
export const SCREENSAVER_CHOICE_KEY = '///screensaver-entry';

/**
 * @param topic topic of the target
 * @returns suffix of proposed names: the last part of the topic, safe characters only
 */
function nameSuffix(topic: string): string {
    const last = topic.split('/').filter(Boolean).pop() ?? '';
    return last.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'import';
}

/**
 * @param base wanted name
 * @param topic topic of the target
 * @param taken names that are in use
 * @returns `base_<topic>`, with `_2`, `_3` … when that is taken too
 */
function proposeName(base: string, topic: string, taken: ReadonlySet<string>): string {
    const first = `${base}_${nameSuffix(topic)}`;
    let name = first;
    for (let n = 2; taken.has(name) || name === mainPageName; n++) {
        name = `${first}_${n}`;
    }
    return name;
}

/**
 * @param name a page name typed by the user
 * @param taken names of existing pages and of the other planned pages
 * @param planned names of the other planned pages
 * @returns translation key of the problem, undefined if the name can be used
 */
function nameProblem(name: string, taken: ReadonlySet<string>, planned: ReadonlySet<string>): PlannedPage['nameError'] {
    if (!name.trim() || name !== name.trim()) {
        return 'importNameEmpty';
    }
    if (name === mainPageName) {
        return 'importNameMain';
    }
    if (name.startsWith('///')) {
        return 'importNameReserved';
    }
    if (planned.has(name)) {
        return 'importNameTwice';
    }
    return taken.has(name) ? 'importNameExists' : undefined;
}

/**
 * @param page existing page
 * @param topic topic of the target
 * @returns the topics the page is assigned to apart from the target
 */
function otherTopics(page: PageConfigEntry, topic: string): string[] {
    return [
        ...new Set((page.navigationAssignment ?? []).map(a => a?.topic).filter((t): t is string => !!t && t !== topic)),
    ];
}

/**
 * Item ids of the imported page mapped to the ids of the existing page, position by position.
 *
 * @param imported page of the file
 * @param existing page of the instance
 * @param map receives imported id -> existing id
 */
function mapItemIdsByPosition(imported: PageConfigEntry, existing: PageConfigEntry, map: Map<string, string>): void {
    const ia = 'pageItems' in imported && Array.isArray(imported.pageItems) ? imported.pageItems : [];
    const ea = 'pageItems' in existing && Array.isArray(existing.pageItems) ? existing.pageItems : [];
    ia.forEach((item, i) => {
        const from = item?.itemId;
        const to = ea[i]?.itemId;
        if (from && to) {
            map.set(from, to);
        }
    });
}

/**
 * @param entry screensaver entry
 * @param list notification list the ids point into
 * @returns the entry for comparing: without name and panels, notifications as their content
 */
function comparableScreensaver(
    entry: ScreensaverEntry,
    list: readonly ScreensaverNotifyConfig[],
): Record<string, unknown> {
    const copy: Record<string, unknown> = { ...normalizeScreensaverEntry(entry) };
    delete copy.name;
    delete copy.panels;
    if (Array.isArray(entry.notify)) {
        copy.notify = entry.notify.map(id => {
            const n = list.find(x => x && x.id === id);
            if (!n) {
                return id;
            }
            const rest: Record<string, unknown> = { ...n };
            delete rest.id;
            return rest;
        });
    }
    return copy;
}

/**
 * Computes what the import does - the review dialog shows it and lets the user change the conflicts. Call it again
 * with the choices of the user: renames ripple through the references of the imported data (fixpoint).
 *
 * @param input target, file, groups and choices
 * @returns the plan
 */
export function planPanelImport(input: PanelImportInput): PanelImportPlan {
    const { native, topic, file } = input;
    const choices = input.choices ?? {};
    const { present, missing } = splitImportGroups(file, input.groups);
    const plan: PanelImportPlan = {
        topic,
        groups: present,
        missingGroups: missing,
        pages: [],
        renames: {},
        valid: true,
    };
    const existing = (native.pageConfig ?? []).filter(
        (p): p is PageConfigEntry => !!p && typeof p.uniqueName === 'string',
    );
    const byName = new Map(existing.map(p => [p.uniqueName, p]));
    const taken = new Set(byName.keys());
    const renames = new Map<string, string>();

    if (present.includes('pages') && file.groups.pages) {
        const imported = file.groups.pages.pages;
        let rows: PlannedPage[] = [];
        // renames only grow: a renamed page changes the pages that reference it, never the other way round
        for (let round = 0; round <= imported.length + 1; round++) {
            const before = renames.size;
            const used = new Set<string>([...taken, ...renames.values()]);
            rows = imported.map((imp, index): PlannedPage => {
                const original = imp.page.uniqueName;
                const stripped = imp.strippedSecrets ?? [];
                const ex = byName.get(original);
                const base: Omit<PlannedPage, 'conflict' | 'action' | 'name'> = {
                    index,
                    original,
                    sharedWith: ex ? otherTopics(ex, topic) : [],
                    assignment: imp.assignment,
                    strippedSecrets: stripped,
                };
                const choice = choices[original];
                if (!ex) {
                    return {
                        ...base,
                        conflict: 'none',
                        action: choice?.action === 'skip' ? 'skip' : 'add',
                        name: original,
                    };
                }
                if (samePage(ex, remapPageReferences(imp.page, renames), stripped)) {
                    return {
                        ...base,
                        conflict: 'identical',
                        action: choice?.action === 'skip' ? 'skip' : 'merge',
                        name: original,
                    };
                }
                const action =
                    choice && ['rename', 'replace', 'skip'].includes(choice.action) ? choice.action : 'rename';
                if (action !== 'rename') {
                    return { ...base, conflict: 'different', action, name: original };
                }
                const name = renames.get(original) ?? choice?.name ?? proposeName(original, topic, used);
                used.add(name);
                renames.set(original, name);
                return { ...base, conflict: 'different', action, name };
            });
            if (renames.size === before) {
                break;
            }
        }
        // a page whose rename was dropped later cannot happen (renames only grow), but the map must match the rows
        for (const [from] of renames) {
            if (!rows.some(r => r.original === from && r.action === 'rename')) {
                renames.delete(from);
            }
        }
        // names of the renamed pages: unique among themselves and against the instance
        for (const row of rows) {
            if (row.action !== 'rename') {
                continue;
            }
            const others = new Set(
                rows
                    .filter(r => r !== row && r.action !== 'skip' && r.action !== 'merge' && r.action !== 'replace')
                    .map(r => r.name),
            );
            row.nameError = nameProblem(row.name, taken, others);
            if (row.nameError) {
                plan.valid = false;
            }
        }
        for (const row of rows) {
            const ex = byName.get(row.original);
            if (row.action !== 'merge' || !ex) {
                continue;
            }
            const imp = imported[row.index];
            const before = effectivePageAssignment(ex, topic);
            if (imp.assignment === 'none') {
                row.status = before?.kind === 'own' ? 'unassign' : 'unchanged';
            } else if (!before) {
                row.status = 'assign';
            } else {
                row.status = sameConfig(before.navigation ?? {}, remapNavigation(imp.navigation, renames) ?? {})
                    ? 'unchanged'
                    : 'navigation';
            }
        }
        plan.pages = rows;
    }
    plan.renames = Object.fromEntries(renames);

    const ssFile = file.groups.screensaver;
    if (present.includes('screensaver') && ssFile?.entry) {
        const entries = (native.screensaverConfig ?? []).filter(
            (e): e is ScreensaverEntry => !!e && typeof e.name === 'string',
        );
        const list = native.screensaverNotify ?? [];
        const itemIds = new Map<string, string>();
        for (const row of plan.pages) {
            const ex = byName.get(row.original);
            if (row.action === 'merge' && ex && file.groups.pages) {
                mapItemIdsByPosition(file.groups.pages.pages[row.index].page, ex, itemIds);
            }
        }
        const imp = remapScreensaver(ssFile.entry, renames, itemIds, new Map());
        const impComparable = comparableScreensaver(imp, ssFile.notify);
        const original = ssFile.entry.name;
        const identical =
            entries.find(
                e => (e.panels ?? []).includes(topic) && sameConfig(comparableScreensaver(e, list), impComparable),
            ) ??
            entries.find(e => e.name === original && sameConfig(comparableScreensaver(e, list), impComparable)) ??
            entries.find(e => sameConfig(comparableScreensaver(e, list), impComparable));
        const sameName = entries.find(e => e.name === original);
        const choice = choices[SCREENSAVER_CHOICE_KEY];
        const sharedWith = (e: ScreensaverEntry | undefined): string[] => (e?.panels ?? []).filter(t => t !== topic);
        if (identical) {
            plan.screensaver = {
                original,
                conflict: 'identical',
                action: choice?.action === 'skip' ? 'skip' : 'merge',
                name: identical.name,
                existing: identical.name,
                sharedWith: sharedWith(identical),
                status: (identical.panels ?? []).includes(topic) ? 'unchanged' : 'assign',
            };
        } else if (!sameName) {
            plan.screensaver = {
                original,
                conflict: 'none',
                action: choice?.action === 'skip' ? 'skip' : 'add',
                name: original,
                sharedWith: [],
            };
        } else {
            const action = choice && ['rename', 'replace', 'skip'].includes(choice.action) ? choice.action : 'rename';
            const names = new Set(entries.map(e => e.name));
            const name = action === 'rename' ? (choice?.name ?? proposeName(original, topic, names)) : original;
            const row: PlannedScreensaver = {
                original,
                conflict: 'different',
                action,
                name,
                existing: sameName.name,
                sharedWith: sharedWith(sameName),
            };
            if (action === 'rename') {
                row.nameError =
                    !name.trim() || name !== name.trim()
                        ? 'importNameEmpty'
                        : names.has(name)
                          ? 'importNameExists'
                          : undefined;
                if (row.nameError) {
                    plan.valid = false;
                }
            }
            plan.screensaver = row;
        }
    }
    return plan;
}

// ---------------------------------------------------------------------------------------------------------------
// applying
// ---------------------------------------------------------------------------------------------------------------

export type PanelImportReport = {
    /** selected groups the file does not hold */
    skippedGroups: PanelConfigGroup[];
    added: string[];
    /** identical pages whose assignment or navigation on the target changes */
    merged: string[];
    /** identical pages already on the target with the same navigation */
    unchanged: string[];
    renamed: { from: string; to: string }[];
    replaced: string[];
    skipped: string[];
    /** pages whose PIN or password has to be entered again */
    secrets: { page: string; fields: PageSecretField[] }[];
    /** new start page of the target, undefined = none or the same as before */
    mainPage?: string;
    /** pages that were the start page of the target and no longer are (other panels keep them) */
    mainPageRemoved: string[];
    /** pages assigned to all panels the target excludes now */
    excludedAllPages: string[];
    screensaver?: { action: ImportAction | 'removed' | 'unchanged'; name: string };
    /** notifications added under a new id because the id was taken by another notification */
    notifyRenamed: { from: string; to: string }[];
};

export type PanelImportResult = {
    /** the new native tables, only those that changed; written with one onChange */
    native: {
        pageConfig?: PageConfigEntry[];
        screensaverConfig?: ScreensaverEntry[];
        screensaverNotify?: ScreensaverNotifyConfig[];
        panels?: ExportPanel[];
        navigationOverrides?: NavigationOverride[];
    };
    /** settings states to write (id below `cmd.`) */
    states: Record<string, PanelSettingValue>;
    report: PanelImportReport;
};

/**
 * @param pages all pages
 * @returns every item id in use
 */
function usedItemIds(pages: readonly PageConfigEntry[]): Set<string> {
    const out = new Set<string>();
    for (const p of pages) {
        if ('pageItems' in p && Array.isArray(p.pageItems)) {
            for (const item of p.pageItems) {
                if (item?.itemId) {
                    out.add(item.itemId);
                }
            }
        }
    }
    return out;
}

/**
 * Gives the items of a new page ids that are not in use; `preferred` (by position) are taken when given.
 *
 * @param page the new page (changed in place)
 * @param used ids in use (extended)
 * @param map receives old id -> new id
 * @param preferred ids by position to keep (replace: the ids of the replaced page)
 */
function assignItemIds(
    page: PageConfigEntry,
    used: Set<string>,
    map: Map<string, string>,
    preferred: (string | undefined)[] = [],
): void {
    if (!('pageItems' in page) || !Array.isArray(page.pageItems)) {
        return;
    }
    page.pageItems = page.pageItems.map((item: AdminPageItemConfig | undefined, i: number) => {
        if (!item) {
            return item;
        }
        const old = item.itemId;
        let id = preferred[i];
        if (!id || used.has(id)) {
            id = old && !used.has(old) ? old : newItemId(used);
        }
        used.add(id);
        if (old && old !== id) {
            map.set(old, id);
        }
        return { ...item, itemId: id };
    });
}

/**
 * Applies a plan. The plan must be valid ({@link PanelImportPlan.valid}) and computed for the same input.
 *
 * @param input target, file and groups (same as for the plan)
 * @param plan the plan the user confirmed
 * @returns the new native tables, the states and the report
 */
export function applyPanelImport(input: PanelImportInput, plan: PanelImportPlan): PanelImportResult {
    const { native, topic, file } = input;
    const renames = new Map(Object.entries(plan.renames));
    const report: PanelImportReport = {
        skippedGroups: [...plan.missingGroups],
        added: [],
        merged: [],
        unchanged: [],
        renamed: [],
        replaced: [],
        skipped: [],
        secrets: [],
        mainPageRemoved: [],
        excludedAllPages: [],
        notifyRenamed: [],
    };
    const result: PanelImportResult = { native: {}, states: {}, report };
    const itemIds = new Map<string, string>();

    if (plan.groups.includes('pages') && file.groups.pages) {
        const pages = structuredClone((native.pageConfig ?? []).filter((p): p is PageConfigEntry => !!p));
        for (const p of pages) {
            if (Array.isArray(p.navigationAssignment)) {
                p.navigationAssignment = p.navigationAssignment.filter(a => a && a.topic !== topic);
            }
        }
        const used = usedItemIds(pages);
        /** pages the import put on the target - nothing else on the target may stay the start page */
        const touched = new Set<string>();
        const hasAll = (p: PageConfigEntry): NavigationAssignment | undefined =>
            (p.navigationAssignment ?? []).find(a => a && a.topic === ALL_PANELS_SPECIAL_ID);
        for (const row of plan.pages) {
            const imp = file.groups.pages.pages[row.index];
            if (row.action === 'skip') {
                report.skipped.push(row.original);
                continue;
            }
            const navigation = remapNavigation(imp.navigation, renames);
            const final = remapPageReferences(imp.page, renames);
            final.uniqueName = row.name;
            const index = pages.findIndex(p => p.uniqueName === row.original);
            if (row.action === 'merge' && index !== -1) {
                const ex = pages[index];
                mapItemIdsByPosition(imp.page, ex, itemIds);
                if (imp.assignment !== 'none') {
                    const all = hasAll(ex);
                    // an identical page for all panels already shows on the target - an own assignment only
                    // when the navigation of the target differs
                    if (!all || !sameConfig(all.navigation ?? {}, navigation ?? {})) {
                        ex.navigationAssignment = [
                            ...(ex.navigationAssignment ?? []),
                            all ? { topic, navigation: navigation ?? {} } : { topic, navigation },
                        ];
                    }
                    touched.add(ex.uniqueName);
                }
                (row.status === 'unchanged' ? report.unchanged : report.merged).push(row.original);
                continue;
            }
            const assignment: NavigationAssignment[] = imp.assignment === 'none' ? [] : [{ topic, navigation }];
            if (row.action === 'replace' && index !== -1) {
                const ex = pages[index];
                // the existing page keeps the secrets the file left out
                for (const field of row.strippedSecrets) {
                    if (field in ex) {
                        Reflect.set(final, field, Reflect.get(ex, field));
                    }
                }
                const preferred =
                    'pageItems' in ex && Array.isArray(ex.pageItems) ? ex.pageItems.map(i => i?.itemId) : [];
                for (const id of preferred) {
                    if (id) {
                        used.delete(id);
                    }
                }
                assignItemIds(final, used, itemIds, preferred);
                final.navigationAssignment = [...(ex.navigationAssignment ?? []), ...assignment];
                pages[index] = final;
                report.replaced.push(row.original);
                setSafeSecrets(
                    final,
                    row.strippedSecrets.filter(f => !(f in ex)),
                );
            } else {
                assignItemIds(final, used, itemIds);
                final.navigationAssignment = assignment;
                setSafeSecrets(final, row.strippedSecrets);
                pages.push(final);
                if (row.action === 'rename') {
                    report.renamed.push({ from: row.original, to: row.name });
                    // the target shows the renamed copy instead of the existing page of the same name
                    const ex = index !== -1 ? pages[index] : undefined;
                    if (ex && hasAll(ex) && imp.assignment !== 'none') {
                        ex.navigationAssignment = [...(ex.navigationAssignment ?? []), { topic }];
                        report.excludedAllPages.push(ex.uniqueName);
                    }
                } else {
                    report.added.push(row.name);
                }
            }
            if (imp.assignment !== 'none') {
                touched.add(row.name);
            }
        }
        // pages for all panels the source excluded: excluded on the target as well
        for (const name of file.groups.pages.excludedAllPages) {
            const p = pages.find(x => x.uniqueName === name);
            if (p && hasAll(p) && !touched.has(name) && !(p.navigationAssignment ?? []).some(a => a.topic === topic)) {
                p.navigationAssignment = [...(p.navigationAssignment ?? []), { topic }];
                report.excludedAllPages.push(name);
            }
        }
        // start page: the imported one wins on the target, other panels keep theirs
        const main = pages.find(p => touched.has(p.uniqueName) && p.isMainPage && effectivePageAssignment(p, topic));
        if (main) {
            const before = (native.pageConfig ?? []).find(
                p => p && p.isMainPage && effectivePageAssignment(p, topic),
            )?.uniqueName;
            if (before !== main.uniqueName) {
                report.mainPage = main.uniqueName;
            }
            for (const p of pages) {
                if (p === main || !p.isMainPage || !effectivePageAssignment(p, topic)) {
                    continue;
                }
                const own = (p.navigationAssignment ?? []).some(a => a.topic === topic);
                p.navigationAssignment = own
                    ? (p.navigationAssignment ?? []).filter(a => a.topic !== topic)
                    : [...(p.navigationAssignment ?? []), { topic }];
                report.mainPageRemoved.push(p.uniqueName);
            }
        }
        result.native.pageConfig = pages;
        report.secrets = importSecretPages(input, plan);
    }

    const ss = plan.screensaver;
    if (plan.groups.includes('screensaver') && file.groups.screensaver) {
        const entries = structuredClone((native.screensaverConfig ?? []).filter((e): e is ScreensaverEntry => !!e));
        for (const e of entries) {
            if (Array.isArray(e.panels)) {
                e.panels = e.panels.filter(t => t !== topic);
            }
        }
        const list = structuredClone(native.screensaverNotify ?? []);
        const entry = file.groups.screensaver.entry;
        if (!entry) {
            report.screensaver = { action: 'removed', name: '' };
        } else if (ss && ss.action !== 'skip') {
            const notifyIds = new Map<string, string>();
            const wanted = new Set(entry.notify ?? []);
            for (const n of file.groups.screensaver.notify.filter(x => wanted.has(x.id))) {
                const ex = list.find(x => x.id === n.id);
                if (ex && sameConfig(ex, n)) {
                    continue;
                }
                if (ex) {
                    const id = newScreensaverNotifyId(list);
                    list.push({ ...structuredClone(n), id });
                    notifyIds.set(n.id, id);
                    report.notifyRenamed.push({ from: n.id, to: id });
                } else {
                    list.push(structuredClone(n));
                }
            }
            const imp = remapScreensaver(entry, renames, itemIds, notifyIds);
            if (ss.action === 'merge') {
                const target = entries.find(e => e.name === ss.existing);
                if (target) {
                    target.panels = [...(target.panels ?? []), topic];
                }
            } else if (ss.action === 'replace') {
                const index = entries.findIndex(e => e.name === ss.existing);
                const panels = index !== -1 ? (entries[index].panels ?? []) : [];
                const replacement = { ...imp, name: ss.existing ?? ss.original, panels: [...panels, topic] };
                if (index !== -1) {
                    entries[index] = replacement;
                } else {
                    entries.push(replacement);
                }
            } else {
                entries.push({ ...imp, name: ss.name, panels: [topic] });
            }
            report.screensaver = {
                action: ss.action === 'merge' && ss.status === 'unchanged' ? 'unchanged' : ss.action,
                name: ss.action === 'replace' ? (ss.existing ?? ss.name) : ss.name,
            };
            result.native.screensaverNotify = list;
        } else if (ss) {
            report.screensaver = { action: 'skip', name: ss.original };
        }
        result.native.screensaverConfig = entries;
    }

    if (plan.groups.includes('misc') && file.groups.misc) {
        const misc = file.groups.misc;
        const panels = structuredClone(native.panels ?? []);
        const panel = panels.find(p => p && p.topic === topic);
        if (panel) {
            for (const key of ['buttonLeft', 'buttonRight'] as const) {
                if (key in misc && misc[key] !== undefined) {
                    panel[key] = remapButton(misc[key], renames);
                } else {
                    delete panel[key];
                }
            }
            if (misc.noScript) {
                panel.noScript = true;
            } else {
                delete panel.noScript;
            }
            result.native.panels = panels;
        }
        result.native.navigationOverrides = [
            ...structuredClone((native.navigationOverrides ?? []).filter(o => o && o.panelTopic !== topic)),
            ...misc.navigationOverrides.map(o => ({
                panelTopic: topic,
                page: o.page,
                navigation: remapNavigation(o.navigation, renames) ?? {},
                scriptLinks: structuredClone(o.scriptLinks ?? {}),
            })),
        ];
        // an admin screensaver on the target sets version and rotation itself, the adapter overwrites both states
        const adminScreensaver = (result.native.screensaverConfig ?? native.screensaverConfig ?? []).some(
            e => e && Array.isArray(e.panels) && e.panels.includes(topic),
        );
        for (const s of panelSettingStates) {
            const val = misc.states[s.id];
            if (val === undefined || typeof val !== s.type) {
                continue;
            }
            if (adminScreensaver && (s.id === 'screenSaver.layout' || s.id === 'screenSaver.rotationTime')) {
                continue;
            }
            result.states[s.id] =
                s.id === 'mainNavigationPoint' && typeof val === 'string' ? (renames.get(val) ?? val) : val;
        }
    }
    return result;
}

/**
 * Sets left out secrets of a new page to the safe explicit value: PIN -1 = the global password of the instance
 * (pw1), wifi password empty.
 *
 * @param page the new page (changed in place)
 * @param fields the fields the file left out
 */
function setSafeSecrets(page: PageConfigEntry, fields: readonly PageSecretField[]): void {
    if (page.card === 'cardAlarm' && fields.includes('pin')) {
        page.pin = -1;
    }
    if (page.card === 'cardQR' && fields.includes('qrPass')) {
        page.qrPass = '';
    }
}

/**
 * The imported page as the plan would write it (references renamed) - for the detail dialog.
 *
 * @param file the parsed file
 * @param plan the current plan
 * @param row the row of the page
 * @returns page and navigation on the target
 */
export function plannedPageContent(
    file: PanelConfigImportFile,
    plan: PanelImportPlan,
    row: PlannedPage,
): { page: PageConfigEntry; navigation?: NavigationLinks } | undefined {
    const imp = file.groups.pages?.pages[row.index];
    if (!imp) {
        return undefined;
    }
    const renames = new Map(Object.entries(plan.renames));
    return { page: remapPageReferences(imp.page, renames), navigation: remapNavigation(imp.navigation, renames) };
}

/**
 * The imported screensaver with the page references renamed - for the detail dialog.
 *
 * @param file the parsed file
 * @param plan the current plan
 * @returns the entry, undefined without one
 */
export function plannedScreensaverContent(
    file: PanelConfigImportFile,
    plan: PanelImportPlan,
): ScreensaverEntry | undefined {
    const entry = file.groups.screensaver?.entry;
    return entry ? remapScreensaver(entry, new Map(Object.entries(plan.renames)), new Map(), new Map()) : undefined;
}

/**
 * The pages whose PIN or password is missing after the import: created or renamed pages with a secret the file
 * left out, and replaced pages whose existing page had no value for it. Merged pages keep their secrets.
 *
 * @param input target, file and groups
 * @param plan the plan
 * @returns final page name and fields, empty = nothing to enter again
 */
export function importSecretPages(
    input: PanelImportInput,
    plan: PanelImportPlan,
): { page: string; fields: PageSecretField[] }[] {
    if (!plan.groups.includes('pages')) {
        return [];
    }
    const out: { page: string; fields: PageSecretField[] }[] = [];
    for (const row of plan.pages) {
        if (!row.strippedSecrets.length) {
            continue;
        }
        if (row.action === 'add' || row.action === 'rename') {
            out.push({ page: row.name, fields: [...row.strippedSecrets] });
        } else if (row.action === 'replace') {
            const ex = (input.native.pageConfig ?? []).find(p => p && p.uniqueName === row.original);
            const missing = row.strippedSecrets.filter(f => !ex || !(f in ex));
            if (missing.length) {
                out.push({ page: row.name, fields: missing });
            }
        }
    }
    return out;
}

/**
 * @param pages pages of the instance
 * @param topic topic of the target
 * @returns what the target shows: page name -> content and navigation
 */
function targetPageView(pages: readonly PageConfigEntry[], topic: string): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const p of pages) {
        const effective = p ? effectivePageAssignment(p, topic) : undefined;
        if (effective) {
            out[p.uniqueName] = { page: comparablePage(p, []), navigation: effective.navigation ?? {} };
        }
    }
    return out;
}

/**
 * @param entries screensaver table
 * @param list notification list
 * @param topic topic of the target
 * @returns the screensaver of the target for comparing, null = none
 */
function targetScreensaverView(
    entries: readonly ScreensaverEntry[],
    list: readonly ScreensaverNotifyConfig[],
    topic: string,
): Record<string, unknown> | null {
    const entry = entries.find(e => e && Array.isArray(e.panels) && e.panels.includes(topic));
    return entry ? comparableScreensaver(entry, list) : null;
}

/**
 * The groups in which the import really changes something on the target - a re-import of an unchanged backup
 * changes nothing.
 *
 * @param input target, file and groups
 * @param plan the plan
 * @param targetStates current values of the settings states of the target (id below `cmd.`)
 * @returns the groups that change
 */
export function panelImportChanges(
    input: PanelImportInput,
    plan: PanelImportPlan,
    targetStates: Record<string, unknown>,
): PanelConfigGroup[] {
    const { native, topic } = input;
    const result = applyPanelImport(input, plan);
    const out: PanelConfigGroup[] = [];
    const after = result.native;
    if (
        after.pageConfig &&
        !sameConfig(targetPageView(native.pageConfig ?? [], topic), targetPageView(after.pageConfig, topic))
    ) {
        out.push('pages');
    }
    if (
        after.screensaverConfig &&
        !sameConfig(
            targetScreensaverView(native.screensaverConfig ?? [], native.screensaverNotify ?? [], topic),
            targetScreensaverView(
                after.screensaverConfig,
                after.screensaverNotify ?? native.screensaverNotify ?? [],
                topic,
            ),
        )
    ) {
        out.push('screensaver');
    }
    if (plan.groups.includes('misc')) {
        const panelView = (panels: readonly ExportPanel[] | undefined): unknown => {
            const p = (panels ?? []).find(x => x && x.topic === topic);
            return { buttonLeft: p?.buttonLeft, buttonRight: p?.buttonRight, noScript: !!p?.noScript };
        };
        const overrides = (list: readonly NavigationOverride[] | undefined): unknown =>
            (list ?? [])
                .filter(o => o && o.panelTopic === topic)
                .map(o => ({ page: o.page, navigation: o.navigation, scriptLinks: o.scriptLinks }))
                .sort((a, b) => a.page.localeCompare(b.page));
        if (
            (after.panels && !sameConfig(panelView(native.panels), panelView(after.panels))) ||
            (after.navigationOverrides &&
                !sameConfig(overrides(native.navigationOverrides), overrides(after.navigationOverrides))) ||
            Object.entries(result.states).some(([id, val]) => targetStates[id] !== val)
        ) {
            out.push('misc');
        }
    }
    return out;
}
