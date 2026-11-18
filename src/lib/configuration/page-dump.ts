/**
 * Page dump of the admin tab "developer" (see `types/pageDump.ts`): builds the file content for one page or the
 * screensaver of a panel from
 * - the stored configuration: the admin entry, the section of the panel script or of the global script,
 * - the runtime configuration the running adapter built from it (page config and page item options).
 *
 * Secrets (PIN of an alarm page, wifi password of a QR page) are removed with the rules of the panel export
 * ({@link stripPageForExport}); the runtime copy of those fields is removed as well.
 *
 * No I/O here, the caller hands in everything.
 */
import type { PageOrigin } from '../types/adminShareConfig';
import {
    effectivePageAssignment,
    exportScreensaverOfPanel,
    stripPageForExport,
    type ExportNative,
} from '../types/panelConfigExport';
import { PAGE_DUMP_FORMAT, PAGE_DUMP_VERSION, type PageDumpKind } from '../types/pageDump';

/** what a panel reports about a page or its screensaver (`Panel.getPageDumpRuntime`) */
export type PanelPageDumpRuntime = {
    name: string;
    kind: PageDumpKind;
    card: string;
    origin: PageOrigin;
    /** name of the admin entry, set for origin admin */
    adminPageName?: string;
    /** a page the config manager generated from a page item (e.g. `media-<id>`) */
    generated?: boolean;
    hidden?: boolean;
    alwaysOn?: unknown;
    /** screensaver only */
    mode?: string;
    /** resolved navigation of the page (names), pages only */
    navigation?: { prev?: string; next?: string; home?: string; parent?: string };
    /** `Page.config` */
    config: unknown;
    /** `Page.pageItemConfig` - the options the page items are built from */
    pageItems: unknown;
};

/** the panel the dump belongs to */
export type PageDumpPanel = {
    topic: string;
    name: string;
    model: string;
    kind: 'tasmota' | 'web';
    noScript: boolean;
};

export type PageDumpInput = {
    panel: PageDumpPanel;
    runtime: PanelPageDumpRuntime;
    /** the instance configuration */
    native: ExportNative;
    /** `native.scriptConfigRaw` of the meta object */
    scriptConfigRaw: unknown;
    /** `native.globalConfigRaw` of the meta object */
    globalConfigRaw: unknown;
    adapterVersion?: string;
    now: Date;
};

/**
 * @param value any value
 * @returns true for a plain object
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * A JSON-safe deep copy: RegExp become their source text, functions and undefined are left out, a repeated
 * reference to an object on the current path becomes `"[circular]"`.
 *
 * @param value any value
 * @param seen objects on the current path
 * @returns the copy
 */
export function toPlainJson(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : String(value);
    }
    if (typeof value === 'bigint') {
        return value.toString();
    }
    if (typeof value !== 'object') {
        // undefined, function, symbol
        return undefined;
    }
    if (value instanceof RegExp) {
        return String(value);
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (seen.has(value)) {
        return '[circular]';
    }
    seen.add(value);
    let out: unknown;
    if (Array.isArray(value)) {
        // keep the positions of the array (an undefined page item stays as null)
        out = value.map(item => {
            const copy = toPlainJson(item, seen);
            return copy === undefined ? null : copy;
        });
    } else {
        const obj: Record<string, unknown> = {};
        for (const [key, item] of Object.entries(value)) {
            const copy = toPlainJson(item, seen);
            if (copy !== undefined) {
                obj[key] = copy;
            }
        }
        out = obj;
    }
    seen.delete(value);
    return out;
}

/**
 * The runtime fields of a page that hold a secret: `data.pin` of `cardAlarm` (the admin PIN as constant, -1 =
 * global password of the instance is no secret) and `data.password` of `cardQR`. Only constants are secrets, a
 * state id is not.
 *
 * @param config plain copy of `Page.config` - changed in place
 * @returns the removed fields
 */
export function stripRuntimeSecrets(config: unknown): string[] {
    if (!isRecord(config) || !isRecord(config.data)) {
        return [];
    }
    const data = config.data;
    const field = config.card === 'cardAlarm' ? 'pin' : config.card === 'cardQR' ? 'password' : undefined;
    if (!field) {
        return [];
    }
    const entry = data[field];
    if (!isRecord(entry) || entry.type !== 'const') {
        return [];
    }
    const val = entry.constVal;
    if (val === undefined || val === null || val === '' || val === -1 || val === '-1') {
        return [];
    }
    delete data[field];
    return [field];
}

/**
 * The entry of a page in `pages` or `subPages` of a script configuration.
 *
 * @param scriptConfig one entry of `scriptConfigRaw` (the configuration of one panel)
 * @param name name of the page
 * @returns the list and the raw entry, undefined when not found
 */
export function findScriptPage(
    scriptConfig: unknown,
    name: string,
): { list: 'pages' | 'subPages'; page: Record<string, unknown> } | undefined {
    if (!isRecord(scriptConfig)) {
        return undefined;
    }
    for (const list of ['pages', 'subPages'] as const) {
        const entries = scriptConfig[list];
        if (!Array.isArray(entries)) {
            continue;
        }
        const hit = entries.find(
            (p): p is Record<string, unknown> => isRecord(p) && p.uniqueName === name && p.globalLink == null,
        );
        if (hit) {
            return { list, page: hit };
        }
    }
    return undefined;
}

/**
 * A page of the global script configuration: through a link `{ globalLink, uniqueName? }` of the panel script
 * that gives it this name, or directly by its name in `subPages` of the global configuration.
 *
 * @param scriptConfig the script configuration of the panel (may be missing)
 * @param globalConfig `globalConfigRaw`
 * @param name name of the page on the panel
 * @returns link and global page, undefined when not found
 */
export function findGlobalPage(
    scriptConfig: unknown,
    globalConfig: unknown,
    name: string,
): { link?: Record<string, unknown>; page?: Record<string, unknown> } | undefined {
    let link: Record<string, unknown> | undefined;
    if (isRecord(scriptConfig)) {
        for (const list of ['pages', 'subPages'] as const) {
            const entries = scriptConfig[list];
            if (!Array.isArray(entries) || link) {
                continue;
            }
            link = entries.find(
                (p): p is Record<string, unknown> =>
                    isRecord(p) &&
                    typeof p.globalLink === 'string' &&
                    (typeof p.uniqueName === 'string' && p.uniqueName ? p.uniqueName : p.globalLink) === name,
            );
        }
    }
    const globalName = link && typeof link.globalLink === 'string' ? link.globalLink : name;
    const subPages = isRecord(globalConfig) && Array.isArray(globalConfig.subPages) ? globalConfig.subPages : [];
    const page = subPages.find((p): p is Record<string, unknown> => isRecord(p) && p.uniqueName === globalName);
    if (!link && !page) {
        return undefined;
    }
    const out: { link?: Record<string, unknown>; page?: Record<string, unknown> } = {};
    if (link) {
        out.link = link;
    }
    if (page) {
        out.page = page;
    }
    return out;
}

/**
 * The screensaver part of a script configuration: every `…ScreensaverEntity` field and the weather settings.
 *
 * @param scriptConfig the script configuration of the panel
 * @returns the fields, undefined when there is no script configuration
 */
export function scriptScreensaverSection(scriptConfig: unknown): Record<string, unknown> | undefined {
    if (!isRecord(scriptConfig)) {
        return undefined;
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(scriptConfig)) {
        if (key.endsWith('ScreensaverEntity') || key === 'weatherEntity' || key === 'weatherAddDefaultItems') {
            out[key] = value;
        }
    }
    return out;
}

/**
 * @param scriptConfigRaw `native.scriptConfigRaw`
 * @param topic topic of the panel
 * @returns the script configuration of the panel, undefined when there is none
 */
export function scriptConfigOfPanel(scriptConfigRaw: unknown, topic: string): Record<string, unknown> | undefined {
    if (!Array.isArray(scriptConfigRaw)) {
        return undefined;
    }
    return scriptConfigRaw.find((c): c is Record<string, unknown> => isRecord(c) && c.panelTopic === topic);
}

/**
 * @param native the instance configuration
 * @param name uniqueName of the admin entry
 * @param topic topic of the panel
 * @returns the stored admin entry (secrets removed) with its effective assignment, undefined when not found
 */
function adminPageStored(native: ExportNative, name: string, topic: string): Record<string, unknown> | undefined {
    const entry = (native.pageConfig ?? []).find(p => !!p && p.uniqueName === name);
    if (!entry) {
        return undefined;
    }
    const { page, stripped } = stripPageForExport(entry);
    if (entry.navigationAssignment !== undefined) {
        page.navigationAssignment = structuredClone(entry.navigationAssignment);
    }
    const out: Record<string, unknown> = { page };
    const assignment = effectivePageAssignment(entry, topic);
    if (assignment) {
        out.assignment = assignment;
    }
    if (stripped.length) {
        out.strippedSecrets = stripped;
    }
    return out;
}

/**
 * The stored configuration of the page or screensaver.
 *
 * @param input everything the dump needs
 * @returns the stored part of the dump
 */
function buildStored(input: PageDumpInput): Record<string, unknown> {
    const { runtime, panel, native } = input;
    const scriptConfig = panel.noScript ? undefined : scriptConfigOfPanel(input.scriptConfigRaw, panel.topic);
    const out: Record<string, unknown> = {};
    if (runtime.kind === 'screensaver') {
        if (runtime.origin === 'admin') {
            out.admin = exportScreensaverOfPanel(native, panel.topic);
        } else {
            const section = scriptScreensaverSection(scriptConfig);
            if (section) {
                out.script = section;
            }
        }
        return out;
    }
    if (runtime.origin === 'admin') {
        const admin = adminPageStored(native, runtime.adminPageName ?? runtime.name, panel.topic);
        if (admin) {
            out.admin = admin;
        }
    } else if (runtime.origin === 'script') {
        const hit = findScriptPage(scriptConfig, runtime.name);
        if (hit) {
            out.script = hit;
        }
    } else if (runtime.origin === 'global') {
        const hit = findGlobalPage(scriptConfig, input.globalConfigRaw, runtime.name);
        if (hit) {
            out.global = hit;
        }
    }
    const override = (native.navigationOverrides ?? []).find(
        o => o && o.panelTopic === panel.topic && o.page === runtime.name,
    );
    if (override) {
        out.navigationOverride = override;
    }
    return out;
}

/**
 * Builds the content of the dump file.
 *
 * @param input everything the dump needs
 * @returns the JSON-safe content of the file
 */
export function buildPageDump(input: PageDumpInput): Record<string, unknown> {
    const { runtime, panel } = input;
    const stored = toPlainJson(buildStored(input));
    const config = toPlainJson(runtime.config);
    const strippedRuntime = stripRuntimeSecrets(config);
    const runtimeOut: Record<string, unknown> = {
        name: runtime.name,
        card: runtime.card,
    };
    for (const key of ['adminPageName', 'generated', 'hidden', 'alwaysOn', 'mode', 'navigation'] as const) {
        if (runtime[key] !== undefined) {
            runtimeOut[key] = toPlainJson(runtime[key]);
        }
    }
    runtimeOut.config = config ?? null;
    runtimeOut.pageItems = toPlainJson(runtime.pageItems) ?? [];
    if (strippedRuntime.length) {
        runtimeOut.strippedSecrets = strippedRuntime;
    }
    const out: Record<string, unknown> = {
        format: PAGE_DUMP_FORMAT,
        version: PAGE_DUMP_VERSION,
    };
    if (input.adapterVersion) {
        out.adapterVersion = input.adapterVersion;
    }
    out.createdAt = input.now.toISOString();
    out.panel = {
        topic: panel.topic,
        name: panel.name,
        model: panel.model,
        kind: panel.kind,
        noScript: panel.noScript,
    };
    out.page = { name: runtime.name, kind: runtime.kind, card: runtime.card, origin: runtime.origin };
    out.stored = stored;
    out.runtime = runtimeOut;
    return out;
}
