/**
 * Export of the configuration of one panel into a file (admin, panel tile).
 *
 * Pure helpers shared between the adapter (tests) and the admin bundle, therefore no adapter imports here.
 * The file holds three groups: the pages assigned to the panel, its screensaver with the notifications it
 * uses, and "misc" (hardware buttons, noScript, navigation overrides, the user settings in `cmd.*`).
 * Secrets (PIN of an alarm/unlock page, wifi password of a QR page) are never written to the file.
 *
 * The format is versioned ({@link PANEL_CONFIG_FORMAT}, {@link PANEL_CONFIG_VERSION}) so an import can
 * read it later.
 */
import {
    ALL_PANELS_SPECIAL_ID,
    isPageLinkEntry,
    normalizeScreensaverEntry,
    type AdminButtonFunction,
    type NavigationLinks,
    type NavigationOverride,
    type PageConfigEntry,
    type ScreensaverEntry,
    type ScreensaverNotifyConfig,
} from './adminShareConfig';

/** format marker of an exported panel configuration */
export const PANEL_CONFIG_FORMAT = 'nspanel-lovelace-ui.panelConfig';
/** version of the file format, raised on incompatible changes */
export const PANEL_CONFIG_VERSION = 1;

/** the groups of an export */
export type PanelConfigGroup = 'pages' | 'screensaver' | 'misc';
export const panelConfigGroups: readonly PanelConfigGroup[] = ['pages', 'screensaver', 'misc'];

/**
 * How an exported page was assigned to the panel: `own` = an assignment for the topic of the panel,
 * `all` = through the "all panels" assignment, `none` = not on the panel, only exported because a page
 * link of the panel points to it.
 */
export type ExportedPageAssignment = 'own' | 'all' | 'none';

/** fields of a page that hold a secret - left out of an export unless the user includes them */
export type PageSecretField = 'pin' | 'qrPass';

export type ExportedPage = {
    /** the page without `navigationAssignment`, without secrets unless {@link PanelConfigExport.secretsIncluded} */
    page: PageConfigEntry;
    assignment: ExportedPageAssignment;
    /** navigation of the page on the panel (of the own or of the "all panels" assignment) */
    navigation?: NavigationLinks;
    /** secret fields that were removed, missing = none */
    strippedSecrets?: PageSecretField[];
};

export type ExportedPagesGroup = {
    pages: ExportedPage[];
    /** pages assigned to all panels that this panel excludes (own assignment without navigation) */
    excludedAllPages: string[];
};

export type ExportedScreensaverGroup = {
    /** the screensaver of the panel with `panels` emptied, null = the panel has no admin screensaver */
    entry: ScreensaverEntry | null;
    /** the notifications of the shared list the screensaver uses */
    notify: ScreensaverNotifyConfig[];
};

/** a navigation override of the panel, the topic left out */
export type ExportedNavigationOverride = Omit<NavigationOverride, 'panelTopic'>;

/** value of a settings state of the panel */
export type PanelSettingValue = boolean | number | string;

export type ExportedMiscGroup = {
    /** missing = the configuration script decides, null = explicitly no action */
    buttonLeft?: AdminButtonFunction;
    buttonRight?: AdminButtonFunction;
    noScript?: boolean;
    navigationOverrides: ExportedNavigationOverride[];
    /** values of the settings states, key = id below `panels.<id>.cmd.` (see {@link panelSettingStates}) */
    states: Record<string, PanelSettingValue>;
};

export type PanelConfigSource = {
    id: string;
    topic: string;
    name: string;
    model: string;
    kind: 'tasmota' | 'web';
};

export type PanelConfigExport = {
    format: typeof PANEL_CONFIG_FORMAT;
    version: number;
    adapterVersion?: string;
    /**
     * true = PINs and passwords of the pages are in the file in plain text (explicit choice of the user),
     * false = they were left out ({@link ExportedPage.strippedSecrets} names the fields per page)
     */
    secretsIncluded: boolean;
    /** ISO time of the export */
    exportedAt: string;
    source: PanelConfigSource;
    groups: {
        pages: ExportedPagesGroup;
        screensaver: ExportedScreensaverGroup;
        misc: ExportedMiscGroup;
    };
};

/** the part of a panel of `native.panels` the export reads */
export type ExportPanel = {
    id?: string;
    topic?: string;
    name?: string;
    model?: string;
    kind?: 'tasmota' | 'web';
    buttonLeft?: AdminButtonFunction;
    buttonRight?: AdminButtonFunction;
    noScript?: boolean;
};

/** the part of `native` the export reads */
export type ExportNative = {
    pageConfig?: PageConfigEntry[];
    screensaverConfig?: ScreensaverEntry[];
    screensaverNotify?: ScreensaverNotifyConfig[];
    navigationOverrides?: NavigationOverride[];
};

/**
 * The states below `panels.<id>.cmd.` that are settings of the user (writable, kept over restarts). Commands
 * (buzzer, goToNavigationPoint, buttons.*, screenSaver.activate, popups), relays and the notification texts of
 * the screensaver are left out. `layout`, `rotationTime` and `mainNavigationPoint` are written by the adapter as
 * well (they follow an admin screensaver or the start page).
 */
export const panelSettingStates: readonly { id: string; type: 'boolean' | 'number' | 'string' }[] = [
    { id: 'activated', type: 'boolean' },
    { id: 'tempOffset', type: 'number' },
    { id: 'isBuzzerAllowed', type: 'boolean' },
    { id: 'hideCards', type: 'boolean' },
    { id: 'detachLeft', type: 'boolean' },
    { id: 'detachRight', type: 'boolean' },
    { id: 'mainNavigationPoint', type: 'string' },
    { id: 'screenSaver.timeout', type: 'number' },
    { id: 'screenSaver.layout', type: 'number' },
    { id: 'screenSaver.rotationTime', type: 'number' },
    { id: 'screenSaver.doubleClick', type: 'boolean' },
    { id: 'screenSaver.infoIcon', type: 'string' },
    { id: 'dim.standby', type: 'number' },
    { id: 'dim.active', type: 'number' },
    { id: 'dim.dayMode', type: 'boolean' },
    { id: 'dim.nightStandby', type: 'number' },
    { id: 'dim.nightActive', type: 'number' },
    { id: 'dim.nightHourStart', type: 'number' },
    { id: 'dim.nightHourEnd', type: 'number' },
    { id: 'dim.schedule', type: 'boolean' },
];

/**
 * @param panelId id of the panel (MAC or `web_<hex>`)
 * @param namespace `<adapter>.<instance>`
 * @returns full id of every settings state, key = id below `cmd.`
 */
export function panelSettingStateIds(panelId: string, namespace: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const s of panelSettingStates) {
        out[s.id] = `${namespace}.panels.${panelId}.cmd.${s.id}`;
    }
    return out;
}

/**
 * The assignment that is in effect for a panel - same rule as `createPagesFromConfig` (admin.ts): the own topic
 * wins, an own assignment without navigation while "all panels" is set excludes the page.
 *
 * @param page entry of `pageConfig`
 * @param topic topic of the panel
 * @returns kind and navigation, undefined = the page is not on the panel
 */
export function effectivePageAssignment(
    page: PageConfigEntry,
    topic: string,
): { kind: 'own' | 'all'; navigation?: NavigationLinks } | undefined {
    const list = Array.isArray(page.navigationAssignment) ? page.navigationAssignment : [];
    const all = list.find(a => a && a.topic === ALL_PANELS_SPECIAL_ID);
    const own = list.find(a => a && a.topic === topic);
    if (own) {
        if (!own.navigation && all) {
            return undefined;
        }
        return { kind: 'own', navigation: own.navigation };
    }
    if (all) {
        return { kind: 'all', navigation: all.navigation };
    }
    return undefined;
}

/**
 * @param page entry of `pageConfig`
 * @param topic topic of the panel
 * @returns true when the page is assigned to all panels and the panel excludes it
 */
function isExcludedAllPage(page: PageConfigEntry, topic: string): boolean {
    const list = Array.isArray(page.navigationAssignment) ? page.navigationAssignment : [];
    return (
        list.some(a => a && a.topic === ALL_PANELS_SPECIAL_ID) &&
        list.some(a => a && a.topic === topic && !a.navigation)
    );
}

/**
 * The secret fields a page holds. A PIN of -1 (= the global password of the instance) and an empty wifi password
 * are no secret.
 *
 * @param page entry of `pageConfig`
 * @returns the fields with a secret
 */
export function pageSecretFields(page: PageConfigEntry): PageSecretField[] {
    const out: PageSecretField[] = [];
    if (page.card === 'cardAlarm' && page.pin != null && page.pin !== -1) {
        out.push('pin');
    }
    if (page.card === 'cardQR' && page.qrPass) {
        out.push('qrPass');
    }
    return out;
}

/**
 * A copy of the page without its assignments and - unless included - without secrets.
 *
 * @param page entry of `pageConfig`
 * @param includeSecrets true = keep PIN and passwords (the user chose it explicitly)
 * @returns the copy and the removed fields
 */
export function stripPageForExport(
    page: PageConfigEntry,
    includeSecrets = false,
): { page: PageConfigEntry; stripped: PageSecretField[] } {
    const copy = structuredClone(page);
    delete copy.navigationAssignment;
    if (includeSecrets) {
        return { page: copy, stripped: [] };
    }
    const stripped = pageSecretFields(copy);
    for (const field of stripped) {
        Reflect.deleteProperty(copy, field);
    }
    return { page: copy, stripped };
}

/**
 * @param native the instance configuration
 * @param topic topic of the panel
 * @param includeSecrets true = keep PINs and passwords
 * @returns the pages group of the export
 */
export function exportPagesOfPanel(native: ExportNative, topic: string, includeSecrets = false): ExportedPagesGroup {
    const entries = (native.pageConfig ?? []).filter(
        (p): p is PageConfigEntry => !!p && typeof p.uniqueName === 'string',
    );
    const pages: ExportedPage[] = [];
    const names = new Set<string>();
    const push = (entry: PageConfigEntry, assignment: ExportedPageAssignment, navigation?: NavigationLinks): void => {
        const { page, stripped } = stripPageForExport(entry, includeSecrets);
        const out: ExportedPage = { page, assignment };
        if (navigation) {
            out.navigation = structuredClone(navigation);
        }
        if (stripped.length) {
            out.strippedSecrets = stripped;
        }
        pages.push(out);
        names.add(entry.uniqueName);
    };
    for (const entry of entries) {
        const effective = effectivePageAssignment(entry, topic);
        if (effective) {
            push(entry, effective.kind, effective.navigation);
        }
    }
    // a page link shows the content of its target - the target travels along even when it is not on the panel
    for (const exported of [...pages]) {
        const link = exported.page;
        if (!isPageLinkEntry(link) || names.has(link.target)) {
            continue;
        }
        const target = entries.find(e => e.uniqueName === link.target);
        if (target) {
            push(target, 'none');
        }
    }
    return {
        pages,
        excludedAllPages: entries.filter(e => isExcludedAllPage(e, topic)).map(e => e.uniqueName),
    };
}

/**
 * @param native the instance configuration
 * @param topic topic of the panel
 * @returns the screensaver group: the first entry that covers the panel (like `findScreensaverEntry`)
 */
export function exportScreensaverOfPanel(native: ExportNative, topic: string): ExportedScreensaverGroup {
    const hit = (native.screensaverConfig ?? []).find(e => e && Array.isArray(e.panels) && e.panels.includes(topic));
    if (!hit) {
        return { entry: null, notify: [] };
    }
    const entry = structuredClone(normalizeScreensaverEntry(hit));
    entry.panels = [];
    const ids = new Set((entry.notify ?? []).filter(id => typeof id === 'string'));
    const notify = (native.screensaverNotify ?? []).filter(n => n && ids.has(n.id)).map(n => structuredClone(n));
    return { entry, notify };
}

/**
 * @param val a state value
 * @returns true for a value a settings state can hold
 */
function isPanelSettingValue(val: unknown): val is PanelSettingValue {
    return typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string';
}

/**
 * @param native the instance configuration
 * @param panel the panel
 * @param states values of the settings states (see {@link panelSettingStates}), unreadable ones left out
 * @returns the misc group
 */
export function exportMiscOfPanel(
    native: ExportNative,
    panel: ExportPanel,
    states: Record<string, unknown>,
): ExportedMiscGroup {
    const topic = panel.topic ?? '';
    const out: ExportedMiscGroup = {
        navigationOverrides: (native.navigationOverrides ?? [])
            .filter(o => o && o.panelTopic === topic)
            .map(o => ({
                page: o.page,
                navigation: structuredClone(o.navigation ?? {}),
                scriptLinks: structuredClone(o.scriptLinks ?? {}),
            })),
        states: {},
    };
    // undefined (the script decides) is kept by leaving the key out, null (no action) stays null
    if (panel.buttonLeft !== undefined) {
        out.buttonLeft = structuredClone(panel.buttonLeft);
    }
    if (panel.buttonRight !== undefined) {
        out.buttonRight = structuredClone(panel.buttonRight);
    }
    if (panel.noScript) {
        out.noScript = true;
    }
    for (const s of panelSettingStates) {
        const val = states[s.id];
        if (isPanelSettingValue(val) && typeof val === s.type) {
            out.states[s.id] = val;
        }
    }
    return out;
}

/**
 * Builds the export of one panel.
 *
 * @param input everything the export needs
 * @param input.native the instance configuration (may hold unsaved changes of the admin)
 * @param input.panel the panel of `native.panels`
 * @param input.states values of the settings states, key = id below `cmd.`
 * @param input.adapterVersion version of the adapter, if known
 * @param input.includeSecrets true = PINs and passwords go into the file (explicit choice), default false
 * @param input.now time of the export
 * @returns the content of the file
 */
export function buildPanelConfigExport(input: {
    native: ExportNative;
    panel: ExportPanel;
    states: Record<string, unknown>;
    adapterVersion?: string;
    includeSecrets?: boolean;
    now: Date;
}): PanelConfigExport {
    const { native, panel, states } = input;
    const topic = panel.topic ?? '';
    const out: PanelConfigExport = {
        format: PANEL_CONFIG_FORMAT,
        version: PANEL_CONFIG_VERSION,
        secretsIncluded: input.includeSecrets === true,
        exportedAt: input.now.toISOString(),
        source: {
            id: panel.id ?? '',
            topic,
            name: panel.name ?? '',
            model: panel.model || 'eu',
            kind: panel.kind === 'web' ? 'web' : 'tasmota',
        },
        groups: {
            pages: exportPagesOfPanel(native, topic, input.includeSecrets === true),
            screensaver: exportScreensaverOfPanel(native, topic),
            misc: exportMiscOfPanel(native, panel, states),
        },
    };
    if (input.adapterVersion) {
        out.adapterVersion = input.adapterVersion;
    }
    return out;
}

/**
 * File name of an export: `nspanel-<panel name>-<yyyy-mm-dd>.json`, the name reduced to safe characters.
 *
 * @param panelName name of the panel
 * @param now time of the export (local date)
 * @returns the file name
 */
export function panelConfigExportFileName(panelName: string, now: Date): string {
    const safe =
        panelName
            .trim()
            .replace(/[^A-Za-z0-9_-]+/g, '_')
            .replace(/^_+|_+$/g, '') || 'panel';
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `nspanel-${safe}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/**
 * The pages of a panel export that hold secrets - asked before the download whether they go into the file.
 *
 * @param native the instance configuration
 * @param topic topic of the panel
 * @returns name and secret fields per page, empty = nothing to ask
 */
export function panelPagesWithSecrets(
    native: ExportNative,
    topic: string,
): { uniqueName: string; fields: PageSecretField[] }[] {
    return exportPagesOfPanel(native, topic)
        .pages.filter(p => p.strippedSecrets?.length)
        .map(p => ({ uniqueName: p.page.uniqueName, fields: p.strippedSecrets ?? [] }));
}

/**
 * @param data the content of the export
 * @returns the pages whose secrets were left out, for a hint after the export
 */
export function pagesWithStrippedSecrets(data: PanelConfigExport): string[] {
    return data.groups.pages.pages.filter(p => p.strippedSecrets?.length).map(p => p.page.uniqueName);
}
