import { Color, type RGB } from '../const/Color';
import mediaPlayersJson from '../../../templates/media-players.json';

// Zentrale Definition aller verfügbaren Card-Typen
export type AdminCardTypes =
    // Grid Cards
    | 'cardGrid'
    | 'cardGrid2'
    | 'cardGrid3'
    | 'cardThermo2'
    | 'cardMedia'
    // Entities Cards
    | 'cardEntities'
    | 'cardSchedule'
    // Standalone Cards
    | 'cardAlarm'
    | 'cardQR'
    | 'cardPower'
    | 'cardChart'
    | 'cardLChart'
    | 'cardThermo'
    | 'screensaver'
    | 'screensaver2'
    | 'screensaver3'
    // Popup Cards
    | 'popupNotify'
    | 'cardItemSpecial'; // Special card to manage pageItems (not selectable in admin UI)

// Typ für pageInfo bei PageMenuConfig (siehe Panel)
export interface PageMenuConfigInfo {
    card: AdminCardTypes;
    /** Headline of the page, only set when it is a constant in the configuration */
    headline?: string;
    alwaysOn?: string;
    scrollPresentation?: string;
    scrollType?: string;
    scrollAutoTiming?: number;
    pageItemCount?: number;
}

export const ALL_PANELS_SPECIAL_ID = '///ALL_PANELS_SPECIAL';

// Zentrale Kommandos für Navigation-API
export const SENDTO_GET_PANEL_NAVIGATION_COMMAND = 'getPanelNavigation';
export const SAVE_PANEL_NAVIGATION_COMMAND = 'savePanelNavigation';
// SendTo command to request the list of available panels from the adapter
export const SENDTO_GET_PANELS_COMMAND = 'getPanels';
// SendTo command to request the list of pages for a given panel
export const SENDTO_GET_PAGES_COMMAND = 'getPagesForPanel';
export const SENDTO_GET_PAGES_All_COMMAND = 'getAllPages';
/** sendTo command of main.ts: installed instances of the supported weather adapters ({ value, label }[], first entry = none) */
export const SENDTO_GET_WEATHER_ENTITY_COMMAND = 'getWeatherEntity';
/** admin tab screensaver: the page item templates (`pageItemTemplates`) with type, role and adapter */
export const SENDTO_GET_SCREENSAVER_TEMPLATES_COMMAND = 'getScreensaverTemplates';
// Central adapter name constant for admin <-> adapter sendTo calls
export const ADAPTER_NAME = 'nspanel-lovelace-ui';
// Expected response when asking the adapter for panels
export type PanelInfo = {
    /** Unique panel identifier (corresponds to `id` in the adapter config) */
    id?: string;
    friendlyName: string;
    panelTopic: string;
};

/** Panel configuration entry as stored in the adapter native data (`panels` array). */
export type AdminPanelConfig = {
    id?: string;
    ip?: string;
    name?: string;
    topic?: string;
    model?: string;
    /** "panel uses no script": configured in the admin (+ global script) only, a local panel script is rejected */
    noScript?: boolean;
};

export type PanelsResponse = PanelInfo[];
export interface NavigationSavePayload {
    panelName: string;
    pages: NavigationPositionsMap[];
}
export type NavigationPositionsMap = { name: string; position: { x: number; y: number } };
// Gemeinsame Typen für Navigation (Panel + Admin UI)

/**
 * Where a page of a panel comes from:
 *
 * - `script` - delivered by the configuration script of this panel
 * - `global` - delivered by the global script configuration, which every panel receives
 * - `admin` - defined in the admin page list (also when it replaces a page of the same name)
 * - `system` - service page of the adapter or the generated default start page
 */
export type PageOrigin = 'script' | 'global' | 'admin' | 'system';

/**
 * Node id for a state a navigation target is read from.
 *
 * The node stands for the state, not for a page - which page the target names is only known while
 * the panel runs. The prefix keeps it apart from the page ids that come from the configuration.
 *
 * @param dp State id the target is read from.
 * @returns The node id.
 */
export function stateRefNodeId(dp: string): string {
    return `dp:${dp}`;
}

/**
 * Shortened state id for the node caption - the full id is shown in the page info.
 *
 * @param dp State id.
 * @returns The last two segments, prefixed with an ellipsis when something was cut off.
 */
export function shortStateLabel(dp: string): string {
    const parts = dp.split('.');
    return parts.length <= 2 ? dp : `…${parts.slice(-2).join('.')}`;
}

/** How a panel works with a state or channel. */
export interface StateNodeInfo {
    /** Roles of the page items using it, e.g. `button` or `shutter`. */
    roles: string[];
    /** Types of those page items, e.g. `button` or `switch`. */
    types: string[];
    /** States used below a channel, relative to it - empty for a single state. */
    states: string[];
    /** Captions the page items give it. */
    headlines: string[];
    /** Icons shown while the value is true. */
    iconsTrue: string[];
    /** Icons shown while the value is false. */
    iconsFalse: string[];
    /** States the icons shown while the value is true are read from - missing in older data. */
    iconStatesTrue?: string[];
    /** States the icons shown while the value is false are read from - missing in older data. */
    iconStatesFalse?: string[];
}

/** The four navigation links of a page: `next`/`prev` (single press), `home`/`parent` (double press). */
export type NavigationLinks = { next?: string; prev?: string; home?: string; parent?: string };

/**
 * Navigation of a script page as changed in the admin (`native.navigationOverrides`).
 *
 * The override is applied on top of the script configuration at every adapter start, so it
 * survives a resend of the script. `scriptLinks` is a snapshot of the links the script carried
 * when the override was created or last confirmed - a later change of the script shows up as a
 * difference to it and the admin asks how to proceed.
 */
export interface NavigationOverride {
    /** Topic of the panel the override applies to */
    panelTopic: string;
    /** `uniqueName` of the script page */
    page: string;
    /** The links the page gets instead of the ones of the script */
    navigation: NavigationLinks;
    /** The links of the script at the time of the override */
    scriptLinks: NavigationLinks;
}

/** Effect of a {@link NavigationOverride} on a page of a running panel, reported with the navigation map. */
export interface NavigationOverrideState {
    /** The links the override sets */
    navigation: NavigationLinks;
    /** The links of the script the override was made against */
    scriptLinks: NavigationLinks;
    /** The script delivers other links than `scriptLinks` by now */
    stale: boolean;
}

export interface NavigationMapEntry {
    page: string;
    /**
     * What the node stands for: a page of the panel, or a state a navigation target is read from.
     * Missing means a page.
     */
    nodeType?: 'page' | 'stateRef';
    /** Full state or channel id, set for `nodeType === 'stateRef'` only. */
    stateId?: string;
    /** True when `stateId` names a channel rather than a single state. */
    isChannel?: boolean;
    /** How the panel works with this state or channel, set for `nodeType === 'stateRef'` only. */
    stateInfo?: StateNodeInfo;
    /** States and channels this page reads its values from, as node ids. */
    usedStates?: string[];
    next?: string;
    prev?: string;
    home?: string;
    parent?: string;
    /** Pages a page item of this page navigates to on a short press */
    targetPages?: string[];
    /** Pages a page item of this page navigates to on a long press */
    targetPagesLongPress?: string[];
    label?: string;
    position?: { x: number; y: number } | null;
    pageInfo?: PageMenuConfigInfo;
    /** Origin of the page, used by the admin to colour the node */
    origin?: PageOrigin;
    /**
     * `uniqueName` of the admin entry this page was created from. Only set for pages with
     * `origin === 'admin'` and it may differ from `page`: a start page is published under the
     * reserved id `main` while its admin entry keeps its own name. The admin uses it to jump to
     * the page configuration.
     */
    adminPageName?: string;
    /**
     * The page was generated by the adapter from a page item (e.g. the media page behind a media
     * item). Its navigation cannot be changed, whatever the page item comes from.
     */
    generated?: boolean;
    /**
     * Links the script configuration gives the page, before any override. Only set for pages with
     * `origin === 'script'` or `'global'` - they are the ones an override can be made for.
     */
    scriptLinks?: NavigationLinks;
    /** Set when a navigation override of the admin is in effect for this page */
    override?: NavigationOverrideState;
}

export type NavigationMap = NavigationMapEntry[];

export interface PanelListEntry {
    panelName: string;
    friendlyName: string;
    /**
     * MQTT topic of the panel - the key its pages are assigned under in `pageConfig`
     * (`navigationAssignment[].topic`). The admin needs it to edit the navigation of a page for
     * exactly this panel.
     */
    panelTopic: string;
    navigationMap: NavigationMap;
}

// Shared types for admin UI (typo: file name uses 'Shard')
/**
 * uniqueID and navigation node name of the panel start page.
 *
 * Shared between adapter and admin, therefore defined in this file: it is the only module both
 * sides import from.
 */
export const mainPageName = 'main';

/**
 * Navigation node name of the service entry point.
 *
 * The service entry point carries two different names: the navigation *node* is called
 * `///service`, the *page* behind it is called {@link servicePageName}. The adapter resolves
 * navigation targets against node names, the admin dropdowns however offer page names - so both
 * values have to be known on both sides.
 */
export const serviceNodeName = '///service';

/**
 * Page name (uniqueID) of the service page reached through {@link serviceNodeName}.
 *
 * This is the name the admin UI offers in its navigation dropdowns. It has to be mapped onto
 * {@link serviceNodeName} before it is used as a navigation target.
 */
export const servicePageName = '///unlock';

export interface PageConfigBaseFields {
    hidden?: boolean;
    alwaysOn?: 'none' | 'always' | 'action' | 'ignore';
    navigationAssignment?: NavigationAssignmentList;
    /**
     * Marks this page as the start page of the panels it is assigned to. The adapter publishes it
     * under the reserved id `main` and it replaces a start page coming from the script. Only one
     * page may carry this flag per panel.
     */
    isMainPage?: boolean;
}

export type UnlockEntry = {
    card: Extract<AdminCardTypes, 'cardAlarm'>; // Supported card types - will be extended
    alarmType?: string; // e.g. 'alarm' | 'unlock' (only for cardAlarm)
    headline: string;
    button1: string;
    button2: string;
    button3: string;
    button4: string;
    button5: string;
    button6: string;
    button7: string;
    button8: string;
    pin: number;
    global?: boolean;
    approved?: boolean;
    setNavi?: string;
    uniqueName: string;
} & PageConfigBaseFields;

// ---------------------------------------------------------------------------------------------
// Screensaver - own admin tab, stored in `native.screensaverConfig` (not part of pageConfig: a
// screensaver is no navigable page, every panel shows exactly one)
// ---------------------------------------------------------------------------------------------

/**
 * the four screensaver versions of the panel; `standard` and `alternate` share the card `screensaver`.
 * Same values as ScreensaverModeType in types.ts - declared here because that file must not become part
 * of the admin bundle (a test checks that both stay equal).
 */
export type ScreensaverMode = 'standard' | 'alternate' | 'advanced' | 'easyview';
export const screensaverModes: readonly ScreensaverMode[] = ['standard', 'alternate', 'advanced', 'easyview'];

export type ScreensaverCard = Extract<AdminCardTypes, 'screensaver' | 'screensaver2' | 'screensaver3'>;

/** areas of the screensaver that take page items (mricon, time, date and notify have their own dialogs) */
export type ScreensaverArea = 'favorit' | 'alternate' | 'left' | 'bottom' | 'indicator';
export const screensaverAreas: readonly ScreensaverArea[] = ['favorit', 'alternate', 'left', 'bottom', 'indicator'];

/** panel models that change the number of places (ScreenSaverConst in definition.ts); same values as NSpanelModel in types.ts */
export type ScreensaverPanelModel = 'eu' | 'us-p' | 'us-l';

/** maximum number of items per area, mode and panel model - copy of ScreenSaverConst (definition.ts), kept equal by a test */
export const screensaverSlotLimits: Record<
    ScreensaverMode,
    Record<ScreensaverArea | 'mricon', { eu: number; 'us-p'?: number; 'us-l'?: number }>
> = {
    standard: {
        favorit: { eu: 1 },
        alternate: { eu: 0 },
        left: { eu: 0 },
        bottom: { eu: 4 },
        indicator: { eu: 0 },
        mricon: { eu: 2 },
    },
    alternate: {
        favorit: { eu: 1 },
        alternate: { eu: 1 },
        left: { eu: 0 },
        bottom: { eu: 3 },
        indicator: { eu: 0 },
        mricon: { eu: 2 },
    },
    advanced: {
        favorit: { eu: 1 },
        alternate: { eu: 0 },
        left: { eu: 3 },
        bottom: { eu: 6 },
        indicator: { eu: 5 },
        mricon: { eu: 2 },
    },
    easyview: {
        favorit: { eu: 1 },
        alternate: { eu: 0 },
        left: { eu: 0 },
        bottom: { eu: 3, 'us-p': 4, 'us-l': 3 },
        indicator: { eu: 0 },
        mricon: { eu: 2 },
    },
};

/**
 * Number of places an area offers on a panel.
 *
 * @param mode screensaver version
 * @param area area of the screensaver
 * @param model panel model, falls back to the eu value
 * @returns maximum number of items
 */
export function screensaverMaxEntries(
    mode: ScreensaverMode,
    area: ScreensaverArea | 'mricon',
    model: ScreensaverPanelModel = 'eu',
): number {
    const limit = screensaverSlotLimits[mode][area];
    return limit[model] ?? limit.eu;
}

/**
 * Card the adapter uses for a screensaver version (screensaver.ts).
 *
 * @param mode screensaver version
 * @returns card type
 */
export function screensaverCardOfMode(mode: ScreensaverMode): ScreensaverCard {
    switch (mode) {
        case 'advanced':
            return 'screensaver2';
        case 'easyview':
            return 'screensaver3';
        default:
            return 'screensaver';
    }
}

/** the two small status icons at the top right of the screensaver (mrIcon1ScreensaverEntity / mrIcon2ScreensaverEntity of the script) */
export type ScreensaverMrIconConfig = {
    /** state the icon follows, empty = icon not used */
    entity?: string;
    iconOn?: string;
    iconOff?: string;
    /** colors as #rrggbb */
    onColor?: string;
    offColor?: string;
    /** state whose value is printed next to the icon */
    value?: string;
    valueDecimals?: number;
    valueUnit?: string;
    /** icon per value, replaces iconOn/iconOff */
    iconSelect?: { value: string; icon: string }[];
};

/**
 * format of a raw item of the admin: `script` = the item as it would stand in the script (page item
 * `ScriptConfig.PageItem`, screensaver element `ScriptConfig.ScreenSaverElement`), converted by the config
 * manager like the script; `native` = the runtime item the config manager produces
 * (`NSPanel.PageItemDataItemsOptions`), taken over unchanged
 */
export type RawItemFormat = 'script' | 'native';

/** all raw formats, in the order the dialog offers them */
export const rawItemFormats: readonly RawItemFormat[] = ['native', 'script'];

/**
 * Whether a value is a raw format.
 *
 * @param value any value
 */
export function isRawItemFormat(value: unknown): value is RawItemFormat {
    return value === 'script' || value === 'native';
}

/**
 * Whether a value is a plain object (not null, not an array) - the only form a raw configuration may have.
 *
 * @param value any value
 */
export function isRawItemObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Format of a raw page item: undefined counts as `script` (configs saved before the field existed).
 *
 * @param item the page item
 * @param item.nativeFormat the stored format
 */
export function pageItemRawFormat(item: { nativeFormat?: RawItemFormat }): RawItemFormat {
    return item.nativeFormat === 'native' ? 'native' : 'script';
}

/**
 * A short text that names a raw item in lists: the first set field of id, template, dpInit and
 * ScreensaverEntity (for a script item with `native` those of the inner object); '' when none is set.
 *
 * @param config the raw configuration
 */
export function rawItemLabel(config: unknown): string {
    if (!isRawItemObject(config)) {
        return '';
    }
    for (const key of ['id', 'template', 'dpInit', 'ScreensaverEntity'] as const) {
        const value = config[key];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }
    return isRawItemObject(config.native) ? rawItemLabel(config.native) : '';
}

/**
 * condition of a screensaver item: the state that hides it while false (`enabled`) and / or the
 * expression over `val` that hides it while false (`visibleCondition`) - as text for the editor
 */
export type ScreensaverItemCondition = {
    enabled?: string;
    visibleCondition?: string;
};

const RAW_ENABLED_KEYS: readonly string[] = ['enabled', 'ScreensaverEntityEnabled'];
const RAW_VISIBLE_KEYS: readonly string[] = ['visibleCondition', 'ScreensaverEntityVisibleCondition'];
/** a nested raw configuration is searched to this depth only (guards against cycles) */
const RAW_CONDITION_DEPTH = 10;
/** longest text of a condition (expression, JSON of an unknown object) */
const CONDITION_TEXT_MAX = 80;

/**
 * Shortens a text to {@link CONDITION_TEXT_MAX} characters, the cut marked with an ellipsis.
 *
 * @param text text
 */
function shortConditionText(text: string): string {
    return text.length > CONDITION_TEXT_MAX ? `${text.slice(0, CONDITION_TEXT_MAX - 1)}…` : text;
}

/**
 * Expression text of a condition: trimmed, whitespace runs joined to one space, a single
 * `return X;` reduced to `X`, at most {@link CONDITION_TEXT_MAX} characters.
 *
 * @param text expression or `read` function body of a runtime item
 */
export function conditionExpressionText(text: string): string {
    const flat = text.trim().replace(/\s+/g, ' ');
    const single = /^return\s+([^;]+?)\s*;?$/.exec(flat);
    return shortConditionText(single ? single[1] : flat);
}

/** texts found in a value of an enabled key: the states / constants and the expressions of runtime items */
type ConditionParts = { enabled: string[]; visible: string[] };

/**
 * Evaluates a value of an enabled key in all forms of the runtime: a state id (script template /
 * element), an array of them, a DataItem object of a runtime item (`{type, dp, read}` - the visible
 * condition is its `read`; `{type: 'const', constVal}` hides only while constVal is false) or an
 * array of those. Other objects count as short JSON; `true` and empty values hide nothing.
 *
 * @param value value of the key
 * @param depth nesting depth (guards against cycles)
 */
function conditionParts(value: unknown, depth = 0): ConditionParts {
    const out: ConditionParts = { enabled: [], visible: [] };
    if (depth > RAW_CONDITION_DEPTH) {
        return out;
    }
    if (typeof value === 'string') {
        if (value.trim()) {
            out.enabled.push(value.trim());
        }
    } else if (typeof value === 'number' || value === false) {
        out.enabled.push(String(value));
    } else if (Array.isArray(value)) {
        for (const v of value) {
            const part = conditionParts(v, depth + 1);
            out.enabled.push(...part.enabled);
            out.visible.push(...part.visible);
        }
    } else if (isRawItemObject(value)) {
        if (value.type === 'const') {
            if (value.constVal === false) {
                out.enabled.push('false');
            }
            return out;
        }
        const dp = typeof value.dp === 'string' && value.dp.trim() ? value.dp.trim() : '';
        const id = typeof value.id === 'string' && value.id.trim() ? value.id.trim() : '';
        if (dp || id) {
            out.enabled.push(dp || id);
            if (typeof value.read === 'string' && value.read.trim()) {
                out.visible.push(conditionExpressionText(value.read));
            }
        } else if (Object.keys(value).length) {
            out.enabled.push(shortConditionText(JSON.stringify(value)));
        }
    }
    return out;
}

/**
 * Text of the states / constants of a condition value (see conditionParts), joined with ', ';
 * '' for empty values and `true` (that hides nothing).
 *
 * @param value value of an enabled / visibleCondition key
 */
export function conditionValueText(value: unknown): string {
    return conditionParts(value).enabled.join(', ');
}

/**
 * Searches a raw configuration recursively (nested objects and arrays, e.g. `native`, `data`) for a
 * non-empty value under `enabled` / `ScreensaverEntityEnabled` and `visibleCondition` /
 * `ScreensaverEntityVisibleCondition` - the first one found of each counts. The `read` of a runtime
 * DataItem under an enabled key counts as visible condition.
 *
 * @param config the raw configuration
 * @returns the condition, undefined when there is none
 */
export function rawItemCondition(config: unknown): ScreensaverItemCondition | undefined {
    const out: ScreensaverItemCondition = {};
    const visit = (value: unknown, depth: number): void => {
        if (depth > RAW_CONDITION_DEPTH || (out.enabled !== undefined && out.visibleCondition !== undefined)) {
            return;
        }
        if (Array.isArray(value)) {
            for (const v of value) {
                visit(v, depth + 1);
            }
            return;
        }
        if (!isRawItemObject(value)) {
            return;
        }
        for (const [key, v] of Object.entries(value)) {
            if (out.enabled === undefined && RAW_ENABLED_KEYS.includes(key)) {
                const part = conditionParts(v);
                if (part.visible.length && out.visibleCondition === undefined) {
                    out.visibleCondition = shortConditionText(part.visible.join(', '));
                }
                if (part.enabled.length) {
                    out.enabled = part.enabled.join(', ');
                    continue;
                }
            }
            if (out.visibleCondition === undefined && RAW_VISIBLE_KEYS.includes(key)) {
                const text =
                    typeof v === 'string' ? (v.trim() ? conditionExpressionText(v) : '') : conditionValueText(v);
                if (text) {
                    out.visibleCondition = text;
                    continue;
                }
            }
            if (typeof v === 'object' && v !== null) {
                visit(v, depth + 1);
            }
        }
    };
    visit(config, 0);
    return out.enabled !== undefined || out.visibleCondition !== undefined ? out : undefined;
}

/**
 * Condition of a screensaver item (enabled state and / or visible condition): of the raw data for a raw
 * item, else of the fields `enabled` and `visibleCondition`.
 *
 * @param item the item
 * @returns the condition, undefined when the item is always shown
 */
export function screensaverItemCondition(
    item: ScreensaverItemConfig | undefined,
): ScreensaverItemCondition | undefined {
    if (!item) {
        return undefined;
    }
    if (item.raw) {
        return rawItemCondition(item.raw.config);
    }
    const out: ScreensaverItemCondition = {};
    const enabled = conditionValueText(item.enabled);
    const visible = conditionValueText(item.visibleCondition);
    if (enabled) {
        out.enabled = enabled;
    }
    if (visible) {
        out.visibleCondition = visible;
    }
    return enabled || visible ? out : undefined;
}

/** raw configuration of a screensaver item, see {@link RawItemFormat} */
export type ScreensaverItemRaw = {
    format: RawItemFormat;
    /** the element (`script`) or the runtime item (`native`) */
    config: Record<string, unknown>;
};

/** what an indicator does when it is pressed (ScreensaverEntityButton / ...Switch / ...NaviToPage of the script) */
export type ScreensaverItemAction = {
    kind: 'button' | 'switch' | 'navigate';
    /** state written on press (button: true, switch: toggled) */
    state?: string;
    /** page opened on press */
    page?: string;
};

/**
 * an item on a place of the screensaver - one state, mapped 1:1 to a ScreenSaverElement of the script
 * (config-manager getEntityData); which fields the panel shows depends on the area ({@link screensaverItemFields})
 */
export type ScreensaverItemConfig = {
    /** the state (ScreensaverEntity); for a template item the object the template works on (`dpInit`) */
    state: string;
    /**
     * name of a page item template (`pageItemTemplates`, e.g. `text.window.isOpen`) - the item becomes a
     * ScreenSaverElement of type `template` with `dpInit` = `state`; the icon, color, text and value fields
     * below do not apply, the template brings its own
     */
    template?: string;
    /** text above the icon, bottom area only (ScreensaverEntityText); empty = name of the state */
    headline?: string;
    iconOn?: string;
    iconOff?: string;
    /** icon per value range of a number state (ScreensaverEntityIconSelect): icon up to `value` */
    iconSelect?: { value: number; icon: string }[];
    /** fixed colors as #rrggbb (ScreensaverEntityOnColor / OffColor) */
    colorOn?: string;
    colorOff?: string;
    /** color scale instead of fixed colors (ScreensaverEntityIconColor) */
    colorScale?: IconColorElement;
    /** state whose value is the color (ScreensaverEntityIconColor as id): #rrggbb, {r,g,b} or a decimal number */
    colorState?: string;
    /** empty = unit of the state */
    unit?: string;
    factor?: number;
    decimals?: number;
    /** format of a date/time value (ScreensaverEntityDateFormat) - options of Intl.DateTimeFormat, e.g. { dateStyle: 'short' } */
    dateFormat?: Intl.DateTimeFormatOptions;
    /** text shown instead of the value while the state is true / false */
    textOn?: string;
    textOff?: string;
    /** indicator area only */
    action?: ScreensaverItemAction;
    /** state that hides the item while false (ScreensaverEntityEnabled) */
    enabled?: string;
    /** expression over `val` that hides the item while false (ScreensaverEntityVisibleCondition) */
    visibleCondition?: string;
    /**
     * raw item: the item is taken from this configuration as entered (dialog "raw data"), every other field
     * is ignored then. The area of the item is where it is placed in the admin: `modeScr` of a template
     * element or a runtime item is set to that area ({@link screensaverItemToScript}).
     */
    raw?: ScreensaverItemRaw;
};

export type ScreensaverItemField = 'headline' | 'value' | 'text' | 'action';

/**
 * id of the channel / device a state belongs to - the object above it; '' when the state sits directly
 * below the instance (`adapter.0.state`) or the id is no state id. Its role counts first for the
 * default icons of a screensaver item (like the page menu editor works on channels).
 *
 * @param stateId id of the state
 */
export function screensaverChannelIdOf(stateId: string): string {
    const parts = stateId.split('.');
    return parts.length > 3 ? parts.slice(0, -1).join('.') : '';
}

/** what an item is built from: one state with its own fields or a page item template */
export type ScreensaverItemSource = 'state' | 'template';

/**
 * source of an item - template as soon as a template name is set
 *
 * @param item stored item, undefined = new
 */
export function screensaverItemSource(
    item: Pick<ScreensaverItemConfig, 'template'> | undefined,
): ScreensaverItemSource {
    return item?.template ? 'template' : 'state';
}

/**
 * a page item template as the adapter reports it (main.ts, getScreensaverTemplates)
 *
 * `need` tells what the item dialog has to ask for: `channel` - the template searches its states below
 * the object (`mode: 'auto'`, relative ids), `none` - the template works without an object (clock, wlan).
 * `looksFor` lists the ids or roles it searches for (hint in the dialog).
 */
export type ScreensaverTemplateInfo = {
    name: string;
    type: string;
    role: string;
    adapter: string;
    need: ScreensaverTemplateNeed;
    looksFor: string[];
};

export type ScreensaverTemplateNeed = 'channel' | 'none';

/** date formats the item dialog offers (ScreensaverEntityDateFormat); the key is the i18n label */
export const screensaverDateFormats: readonly { key: string; options: Intl.DateTimeFormatOptions }[] = [
    { key: 'dateFormatShort', options: { dateStyle: 'short' } },
    { key: 'dateFormatYearMonthDay', options: { year: 'numeric', month: '2-digit', day: '2-digit' } },
    { key: 'dateFormatDayShortMonthYear', options: { day: '2-digit', month: 'short', year: 'numeric' } },
    {
        key: 'dateFormatWeekdayShortDate',
        options: { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' },
    },
    { key: 'timeFormat24', options: { hour: '2-digit', minute: '2-digit', hour12: false } },
    {
        key: 'screensaver_item_dateTimeShort',
        options: { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' },
    },
    { key: 'screensaver_item_dateTimeFull', options: { dateStyle: 'short', timeStyle: 'short' } },
];

/**
 * Fields the panel uses on a place: bottom shows a headline, icon and value; left, favorit and
 * alternate icon and value; an indicator the icon only - and it can act as a button.
 *
 * @param area area of the screensaver
 */
export function screensaverItemFields(area: ScreensaverArea): Record<ScreensaverItemField, boolean> {
    return {
        headline: area === 'bottom',
        value: area !== 'indicator',
        text: area !== 'indicator',
        action: area === 'indicator',
    };
}

/** tone sequence the panel plays for a notification with `buzzer: true` (config-manager getNotifyEntityData) */
export const screensaverNotifyDefaultBuzzer = '1,2,3,0xF54';

/**
 * a notification of the screensaver - notifyScreensaverEntity of the script (config-manager getNotifyEntityData).
 * Headline, text and their parts are a fixed text or the id of a state whose value is shown (the adapter decides
 * by the existence of the state). The panel shows the enabled notification with the lowest priority number.
 *
 * All screensavers share one list (`native.screensaverNotify`), a screensaver switches notifications on by
 * their id ({@link ScreensaverEntry.notify}).
 */
export type ScreensaverNotifyConfig = {
    /** unique within the list, referenced by {@link ScreensaverEntry.notify} */
    id: string;
    /** label in the notification list of the admin only - not sent to the panel */
    name?: string;
    /** states that switch the notification on - several: all of them must be on; empty = notification not used */
    enabled: string[];
    /** condition on the value `val` of each enabled state, e.g. `val >= 3`; empty = the state as boolean */
    visibleCondition?: string;
    headline?: string;
    headlinePrefix?: string;
    headlineUnit?: string;
    /** icon in front of the headline */
    headlineIcon?: string;
    text?: string;
    textPrefix?: string;
    textSuffix?: string;
    /** lower number = higher priority, undefined = 99 */
    priority?: number;
    /** a tap hides the notification until its enabled state switches off and on again */
    dismissible?: boolean;
    /** notifications with the same id are hidden together (all panels) */
    dismissibleId?: string;
    /** buzzer when shown: true = {@link screensaverNotifyDefaultBuzzer}, a string = own tone sequence */
    buzzer?: boolean | string;
};

/**
 * a number as the panel prints a value (tools getValueEntryString): without grouping, with fixed decimals when given
 *
 * @param value the number
 * @param locale locale of the format, default de-DE like the adapter
 * @param decimals fixed number of decimals, null = as many as the number has
 */
export function formatEntryNumber(value: number, locale: string = 'de-DE', decimals: number | null = null): string {
    if (decimals !== null) {
        return value.toLocaleString(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping: false,
        });
    }
    return value.toLocaleString(locale, { useGrouping: false });
}

/** parts of the two lines of a notification - each already resolved to the text the panel prints */
export type ScreensaverNotifyLineParts = {
    /** icon in front of the headline (the glyph on the panel, empty in the admin preview) */
    icon?: string;
    headlinePrefix?: string;
    headline?: string;
    headlineUnit?: string;
    textPrefix?: string;
    text?: string;
    textSuffix?: string;
};

/**
 * The two lines of a screensaver notification as the panel shows them - shared by the screensaver
 * (HandleNotification, whose page item already joined prefix, value and unit) and the admin preview.
 * heading: icon, a space, prefix + headline + unit, trimmed; text: prefix + text + suffix, empty without a text.
 *
 * @param parts the resolved parts
 */
export function screensaverNotifyLines(parts: ScreensaverNotifyLineParts): { heading: string; text: string } {
    const headline = `${parts.headlinePrefix ?? ''}${parts.headline ?? ''}${parts.headlineUnit ?? ''}`;
    return {
        heading: `${parts.icon ?? ''} ${headline}`.trim(),
        text: parts.text ? `${parts.textPrefix ?? ''}${parts.text}${parts.textSuffix ?? ''}` : '',
    };
}

/**
 * a new id for the shared notification list
 *
 * @param existing the list the id must be unique in
 */
export function newScreensaverNotifyId(existing: readonly ScreensaverNotifyConfig[]): string {
    const used = new Set(existing.map(n => n.id));
    let id = '';
    do {
        id = `n${Date.now().toString(36)}${Math.floor(Math.random() * 1296)
            .toString(36)
            .padStart(2, '0')}`;
    } while (used.has(id));
    return id;
}

/**
 * the notifications a screensaver uses, in the order of the shared list
 *
 * @param entry screensaver entry
 * @param list shared notification list (`native.screensaverNotify`)
 */
export function screensaverNotifyOfEntry(
    entry: ScreensaverEntry,
    list: readonly ScreensaverNotifyConfig[] | undefined,
): ScreensaverNotifyConfig[] {
    const ids = new Set((entry.notify ?? []).filter(id => typeof id === 'string'));
    return (list ?? []).filter(n => n && ids.has(n.id));
}

/**
 * Moves notifications stored inside the entries (first version of the feature: `notify` was a list of
 * notifications per screensaver) into the shared list; the entries keep their ids.
 *
 * @param entries screensaver table
 * @param list shared notification list
 * @returns the converted table and list, changed = something was moved
 */
export function migrateScreensaverNotify(
    entries: readonly ScreensaverEntry[],
    list: readonly ScreensaverNotifyConfig[],
): { entries: ScreensaverEntry[]; list: ScreensaverNotifyConfig[]; changed: boolean } {
    const out = [...list];
    let changed = false;
    const converted = entries.map(entry => {
        const raw: unknown[] = Array.isArray(entry.notify) ? entry.notify : [];
        if (raw.every(n => typeof n === 'string')) {
            return entry;
        }
        changed = true;
        const ids: string[] = [];
        for (const n of raw) {
            if (typeof n === 'string') {
                ids.push(n);
            } else if (n && typeof n === 'object' && Array.isArray((n as { enabled?: unknown }).enabled)) {
                const id = newScreensaverNotifyId(out);
                out.push({ ...(n as Omit<ScreensaverNotifyConfig, 'id'>), id });
                ids.push(id);
            }
        }
        return { ...entry, notify: ids.length ? ids : undefined };
    });
    return { entries: converted, list: out, changed };
}

export type ScreensaverEntry = {
    /** name shown in the list, unique within the table */
    name: string;
    /** screensaver version, the card follows from it ({@link screensaverCardOfMode}) */
    mode: ScreensaverMode;
    /** topics of the panels using this screensaver (multi select, no "all panels") */
    panels: string[];
    favorit?: ScreensaverItemConfig;
    alternate?: ScreensaverItemConfig;
    /** items of the areas in panel order, gaps are kept as undefined */
    left: (ScreensaverItemConfig | undefined)[];
    bottom: (ScreensaverItemConfig | undefined)[];
    indicator: (ScreensaverItemConfig | undefined)[];
    mrIcon1?: ScreensaverMrIconConfig;
    mrIcon2?: ScreensaverMrIconConfig;
    /** ids of the notifications of the shared list (`native.screensaverNotify`) this screensaver uses, undefined = none */
    notify?: string[];
    /** 12h or 24h clock, undefined = adapter default (24h) */
    clockFormat?: '12h' | '24h';
    /** date format overrides, undefined = global settings of the instance (config-manager getScreensaverConfig) */
    weekdayFormat?: 'short' | 'long';
    monthFormat?: 'long' | 'short' | '2-digit';
    yearFormat?: 'numeric' | '2-digit';
    /**
     * weather adapter instance, e.g. 'pirate-weather.0' (ScriptConfig.weatherEntity); undefined = global setting of
     * the instance (native.weatherEntity), '' = no weather. The favorit shows the current weather while no own item
     * is placed there, the chosen items are appended to the bottom area (config-manager getScreensaverConfig).
     */
    weatherEntity?: string;
    /** default weather items appended to the bottom area (ScriptConfig.weatherAddDefaultItems), only keys set to true count */
    weatherAddDefaultItems?: ScreensaverWeatherItems;
    /** seconds between the pages of an area with more items than places, 0 = off */
    rotationTime?: number;
    screensaverSwipe?: boolean;
    screensaverIndicatorButtons?: boolean;
};

export type ScreensaverConfig = ScreensaverEntry[];

/** weather adapters getScreensaverConfig knows (definition.ts weatherEntities) */
export const screensaverWeatherAdapters = ['accuweather', 'openweathermap', 'pirate-weather', 'brightsky'] as const;
export type ScreensaverWeatherAdapter = (typeof screensaverWeatherAdapters)[number];

/**
 * Default weather items of the bottom area in the order getScreensaverConfig appends them
 * (ScriptConfig.WeatherAddDefaultItemsJson).
 */
export const screensaverWeatherItemKeys = [
    'sunriseSet',
    'forecastDay1',
    'forecastDay2',
    'forecastDay3',
    'forecastDay4',
    'forecastDay5',
    'forecastDay6',
    'windSpeed',
    'windGust',
    'windDirection',
    'uvIndex',
    'solar',
] as const;
export type ScreensaverWeatherItemKey = (typeof screensaverWeatherItemKeys)[number];
export type ScreensaverWeatherItems = Partial<Record<ScreensaverWeatherItemKey, boolean>>;

const weatherDays = ['forecastDay1', 'forecastDay2', 'forecastDay3', 'forecastDay4', 'forecastDay5'] as const;
const weatherWind = ['windSpeed', 'windGust', 'windDirection'] as const;

/** items each adapter offers - keys of other adapters are ignored by getScreensaverConfig (screensaver-entry.test.ts guards the table) */
export const screensaverWeatherItemsOfAdapter: Record<ScreensaverWeatherAdapter, readonly ScreensaverWeatherItemKey[]> =
    {
        accuweather: ['sunriseSet', ...weatherDays, ...weatherWind, 'uvIndex'],
        openweathermap: ['sunriseSet', ...weatherDays, 'forecastDay6', ...weatherWind],
        'pirate-weather': ['sunriseSet', ...weatherDays, 'forecastDay6', ...weatherWind, 'uvIndex'],
        brightsky: ['sunriseSet', ...weatherDays, 'forecastDay6', ...weatherWind, 'solar'],
    };

/**
 * Weather adapter of an instance id.
 *
 * @param entity instance, e.g. 'pirate-weather.0' (also with trailing dot or state path)
 * @returns adapter or undefined for none / unsupported
 */
export function screensaverWeatherAdapterOf(entity: string | undefined): ScreensaverWeatherAdapter | undefined {
    const prefix = (entity ?? '').split('.')[0];
    return screensaverWeatherAdapters.find(a => a === prefix);
}

/**
 * Weather instance without the trailing dot scripts write (`pirate-weather.0.` → `pirate-weather.0`), the
 * form the instance list of the admin uses; '' stays ''. The config manager accepts both forms.
 *
 * @param entity weather instance as stored
 * @returns the instance id
 */
export function normalizeWeatherEntity(entity: string): string {
    return entity.trim().replace(/\.+$/, '');
}

/**
 * Items an entry adds to the bottom area, in the order the adapter appends them.
 *
 * @param items chosen items of the entry
 * @param entity weather instance that applies
 * @returns ordered keys, empty for no / unsupported adapter
 */
export function screensaverWeatherItemsOn(
    items: ScreensaverWeatherItems | undefined,
    entity: string | undefined,
): ScreensaverWeatherItemKey[] {
    const adapter = screensaverWeatherAdapterOf(entity);
    if (!adapter || !items) {
        return [];
    }
    return screensaverWeatherItemsOfAdapter[adapter].filter(k => items[k] === true);
}

/**
 * Creates a fresh screensaver entry without items.
 *
 * @param name unique name
 * @param mode screensaver version, default 'standard'
 */
export function emptyScreensaverEntry(name: string, mode: ScreensaverMode = 'standard'): ScreensaverEntry {
    return {
        name,
        mode,
        panels: [],
        left: [],
        bottom: [],
        indicator: [],
        rotationTime: 0,
        screensaverSwipe: false,
        screensaverIndicatorButtons: false,
    };
}

/**
 * Configuration for the "value display" dialog – mirrors the inputs of
 * getValueEntryString() in tools.ts so the admin UI can configure them.
 */
export type ChannelValueConfig = {
    /** ioBroker state ID with common.type string or number, or plain text */
    valueStateId: string;
    /** Unit string shown after the value (only used for number type) */
    unit: string;
    /** Prefix shown before the value (static string or state ID) */
    prefix: string;
    /** Suffix shown after unit (static string or state ID) */
    suffix: string;
    /**
     * Date-format config: { local: locale-string, format: Intl.DateTimeFormatOptions }.
     * Empty string means no date formatting.
     */
    dateFormat: { local: string; format: Intl.DateTimeFormatOptions } | '';
};

/**
 * Creates a default empty ValueEntryConfig, optionally pre-filling valueStateId.
 *
 * @param valueStateId  Optional initial state ID
 */
export function emptyChannelValueConfig(valueStateId = ''): ChannelValueConfig {
    return { valueStateId, unit: '', prefix: '', suffix: '', dateFormat: '' };
}

/**
 * Normalizes a channelId value from persisted config to `ValueEntryConfig`.
 * Handles backward-compatibility: if the stored value is a plain string (old format)
 * it is promoted to `{ valueStateId: string, ...defaults }`.
 *
 * @param raw  Raw value from config – either a string (legacy) or ValueEntryConfig
 */
export function normalizeChannelId(raw: unknown): ChannelValueConfig {
    if (typeof raw === 'string') {
        return emptyChannelValueConfig(raw);
    }
    if (raw !== null && typeof raw === 'object' && 'valueStateId' in raw) {
        const v = raw as Partial<ChannelValueConfig>;
        return {
            valueStateId: typeof v.valueStateId === 'string' ? v.valueStateId : '',
            unit: typeof v.unit === 'string' ? v.unit : '',
            prefix: typeof v.prefix === 'string' ? v.prefix : '',
            suffix: typeof v.suffix === 'string' ? v.suffix : '',
            dateFormat: v.dateFormat ?? '',
        };
    }
    return emptyChannelValueConfig();
}

/** Nextion font id of a page item (`textSize`), sent to the panel as suffix `¬<id>` of the icon/value text */
export type HmiTextSize = 0 | 1 | 2 | 3 | 4 | 5;

/** What a Nextion font of the HMI (6.0.2) can draw */
export interface HmiFontInfo {
    /** line height of the bitmap font in px */
    px: number;
    /** the font contains the icon glyphs (U+E000…) - without them an icon stays empty on the panel */
    icons: boolean;
    /** the font only contains ASCII - `°`, umlauts etc. vanish */
    asciiOnly: boolean;
    bold: boolean;
}

/**
 * The Nextion fonts 0-5 of the HMI, verified on hardware (HMI 6.0.2):
 * 0 = 24 px text only, 1 = 32 px (NotoSans, icons), 2 = 32 px text only, 3 = 48 px (icons),
 * 4 = 80 px bold (icons), 5 = 128 px ASCII only (no icons, no `°`/umlauts).
 */
export const HMI_FONTS: Readonly<Record<HmiTextSize, HmiFontInfo>> = {
    0: { px: 24, icons: false, asciiOnly: false, bold: false },
    1: { px: 32, icons: true, asciiOnly: false, bold: false },
    2: { px: 32, icons: false, asciiOnly: false, bold: false },
    3: { px: 48, icons: true, asciiOnly: false, bold: false },
    4: { px: 80, icons: true, asciiOnly: false, bold: true },
    5: { px: 128, icons: false, asciiOnly: true, bold: true },
};

/** all text sizes in ascending order */
export const HMI_TEXT_SIZES: readonly HmiTextSize[] = [0, 1, 2, 3, 4, 5];

/**
 * Type guard for a valid text size (font id 0-5).
 *
 * @param n the value to check
 */
export function isHmiTextSize(n: unknown): n is HmiTextSize {
    return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 5;
}

/**
 * True when an icon can be drawn with this text size: undefined (= default font of the element)
 * or a font that contains the icon glyphs (1, 3, 4).
 *
 * @param n the text size, undefined for the default
 */
export function isIconTextSize(n: number | undefined): boolean {
    if (n === undefined) {
        return true;
    }
    return isHmiTextSize(n) && HMI_FONTS[n].icons;
}

/**
 * True when the text size only draws ASCII characters (font 5).
 *
 * @param n the text size, undefined for the default
 */
export function isAsciiOnlyTextSize(n: number | undefined): boolean {
    return isHmiTextSize(n) && HMI_FONTS[n].asciiOnly;
}

// QR Entry for pageQR configuration
export type AdminPageItemConfig = {
    /**
     * Channel / device identifier.
     * Always a `ValueEntryConfig` in the current format.
     * Configs saved with an older version may contain a plain string –
     * use `normalizeChannelId(item.channelId)` whenever reading from raw storage.
     */
    channelId: ChannelValueConfig;
    role?: string;
    name?: string;
    isNavigation?: boolean;
    type?: string;
    targetPage?: string;
    targetPageLongPress?: string | null | undefined;
    longPress?: string | null | undefined;
    trueIcon?: string;
    trueColor?: string;
    falseIcon?: string;
    falseColor?: string;
    useValue?: boolean;
    /** Text size override 0–5 (undefined = default) */
    textSize?: HmiTextSize;
    scale?: IconScaleElement;
    /** Value-display configuration (prefix / unit / suffix / dateFormat) */
    valueEntry?: ChannelValueConfig;
    /**
     * Light items (roles rgbSingle, rgb, ct, hue): writable string state the selected mode is written to.
     * Ignored by the adapter when the state does not exist or is not of type string.
     */
    inSel_Alias?: string;
    /** Light items (roles rgbSingle, rgb, ct, hue): selectable modes, sent to the panel joined with '?' (max. 900 chars) */
    modeList?: string[];
    /**
     * raw mode: the item is not built from the fields of the dialog but taken from {@link native} as entered
     * (dialog "raw data"); every other field of the item is ignored then
     */
    useNative?: boolean;
    /**
     * format of {@link native} (raw mode only): `script` (also undefined - configs saved before the field
     * existed) = a page item of the script (`ScriptConfig.PageItem`), converted by the config manager like a
     * script item; `native` = the runtime item (`NSPanel.PageItemDataItemsOptions`), taken over unchanged
     */
    nativeFormat?: RawItemFormat;
    /** the raw configuration in the format {@link nativeFormat} (raw mode only) */
    native?: Record<string, unknown>;
    /**
     * cardThermo2 only: 0-based index of the heat circuit the item belongs to, the item is shown
     * while that circuit is selected. Undefined = shown for every circuit. An airCondition channel
     * counts as two circuits (heating and cooling), see the wiki page PageThermo2.
     */
    filter?: number;
    /**
     * JavaScript expression over `val` (the current value of the item), e.g. `val && val < 100`. While it
     * is true the value is shown as text instead of the icon, otherwise the icon (`getIconEntryValue` of
     * the adapter). The config manager hands it to the icon text of the roles info, slider, motion, door,
     * window, temperature / value.temperature / thermostat / airCondition and humidity / value.humidity;
     * of the navigation items only thermostat and humidity. Empty = not set.
     */
    useValueConditions?: string;
    /**
     * Role volume only: lower end of the volume slider. The config manager takes it only when it is
     * truthy, so 0 counts as not set (the panel default).
     */
    minValue?: number;
    /** Role volume only: upper end of the volume slider, 0 counts as not set like {@link minValue}. */
    maxValue?: number;
    /** Role blind only: text of the second row of the shutter popup. Empty = not set. */
    secondRow?: string;
    /**
     * Roles dimmer, ct, rgb, rgbSingle and hue: lower end of the brightness slider. The config manager takes it
     * only when it is truthy, so 0 counts as not set (the panel default).
     */
    minValueBrightness?: number;
    /** Like {@link minValueBrightness}: upper end of the brightness slider. */
    maxValueBrightness?: number;
    /** Roles ct, rgb, rgbSingle and hue: lower end of the color temperature slider, 0 counts as not set. */
    minValueColorTemp?: number;
    /** Like {@link minValueColorTemp}: upper end of the color temperature slider. */
    maxValueColorTemp?: number;
    /**
     * Roles dimmer, ct, rgb, rgbSingle and hue: switches the color mode of the light popup on. The script
     * field is a text (`rgb`, `xy`), but the config manager only asks whether it is set at all.
     */
    colormode?: boolean;
};

/**
 * How a page with a list of page items pages through them (PageMenu of the adapter). Edited in the
 * page details of the admin, see {@link isScrollCard}.
 */
export type PageScrollFields = {
    /** `classic` = windowed paging, `arrow` = last slot is a paging arrow, `auto` = classic with automatic advance; default classic */
    scrollPresentation?: 'classic' | 'arrow' | 'auto';
    /** `classic`/`auto` only: scroll by a full or a half page ({@link scrollHalfCards}); default page */
    scrollType?: 'page' | 'half';
    /** `auto` only: seconds until the next page; default {@link scrollAutoTimingDefault} */
    scrollAutoTiming?: number;
};

/** cards built on PageMenu - they take the {@link PageScrollFields} */
export const scrollCards = [
    'cardGrid',
    'cardGrid2',
    'cardGrid3',
    'cardEntities',
    'cardSchedule',
    'cardThermo2',
    'cardMedia',
] as const;
export type ScrollCard = (typeof scrollCards)[number];

/** cards that can scroll by half a page - same list as CARD_MENU_HALF_PAGE_SCROLL_TYPES of the adapter */
export const scrollHalfCards: readonly ScrollCard[] = ['cardGrid', 'cardGrid2', 'cardGrid3', 'cardThermo2'];

/** seconds the adapter waits in the `auto` presentation when nothing is set */
export const scrollAutoTimingDefault = 15;

/**
 * Whether a card takes the {@link PageScrollFields}.
 *
 * @param card Card of an admin page entry.
 * @returns True for the cards built on PageMenu.
 */
export function isScrollCard(card: string | undefined): card is ScrollCard {
    return !!card && (scrollCards as readonly string[]).includes(card);
}

/**
 * Page types whose items take a long press (`longPress`, `targetPageLongPress`). On the HMI (v5.1.1 / v6.0.2)
 * only the items of the grid pages send `event,buttonPress3,<entnN>` on a long press; cardEntities, cardSchedule,
 * cardMedia and cardThermo2 send `buttonPress2` for their items only (there a long press exists on the
 * navigation arrows nent1 / nent2 alone).
 */
export const longPressCards: readonly string[] = ['cardGrid', 'cardGrid2', 'cardGrid3'];

/**
 * Whether the items of a page type take a long press: the grid pages only ({@link longPressCards}).
 *
 * @param card Card of an admin page entry or page type of the script.
 * @returns True for cardGrid, cardGrid2 and cardGrid3.
 */
export function isLongPressCard(card: string | undefined): boolean {
    return !!card && longPressCards.includes(card);
}

/**
 * Page types that show no item names on the card: the name of a page item is only the title of the popup the
 * item opens (the adapter falls back to it for the popup headline, `pageItem.ts`).
 */
export const nameIsPopupTitleCards: readonly string[] = ['cardThermo2', 'cardMedia'];

/**
 * Whether the name of a page item is only the title of its popup on this page type ({@link nameIsPopupTitleCards}).
 *
 * @param card Card of an admin page entry or page type of the script.
 * @returns True for cardThermo2 and cardMedia.
 */
export function isNameOnlyPopupTitle(card: string | undefined): boolean {
    return !!card && nameIsPopupTitleCards.includes(card);
}

/**
 * The scroll settings of an entry as the adapter takes them, with the defaults filled in.
 *
 * @param entry Stored scroll fields, may be incomplete or come from an older version.
 * @param card Card of the entry - `half` is reset to `page` where the card cannot do it.
 * @returns Presentation, type and (for `auto` only) the timing.
 */
export function normalizeScrollFields(
    entry: PageScrollFields,
    card: ScrollCard,
):
    | { scrollPresentation: 'classic' | 'arrow'; scrollType: 'page' | 'half' }
    | { scrollPresentation: 'auto'; scrollType: 'page' | 'half'; scrollAutoTiming: number } {
    const presentation =
        entry.scrollPresentation === 'arrow' || entry.scrollPresentation === 'auto'
            ? entry.scrollPresentation
            : 'classic';
    const type = entry.scrollType === 'half' && scrollHalfCards.includes(card) ? 'half' : 'page';
    if (presentation !== 'auto') {
        return { scrollPresentation: presentation, scrollType: type };
    }
    // `auto` without timing would leave the adapter without an interval
    const timing =
        typeof entry.scrollAutoTiming === 'number' &&
        Number.isFinite(entry.scrollAutoTiming) &&
        entry.scrollAutoTiming > 0
            ? entry.scrollAutoTiming
            : scrollAutoTimingDefault;
    return { scrollPresentation: 'auto', scrollType: type, scrollAutoTiming: timing };
}

export type MenuEntry = {
    card: Extract<AdminCardTypes, 'cardGrid' | 'cardGrid2' | 'cardGrid3' | 'cardEntities' | 'cardSchedule'>; // Supported card types - will be extended
    headline: string;
    pageItems: (AdminPageItemConfig | undefined)[];
    uniqueName: string;
} & PageScrollFields &
    PageConfigBaseFields;

export type QREntry = {
    card: Extract<AdminCardTypes, 'cardQR'>;
    selType?: number; // e.g. 0 = FREE, 1 = Wifi, 2 = URL, 3 = TEL
    headline: string;
    ssidUrlTel: string;
    wlanhidden: boolean;
    wlantype?: 'nopass' | 'WPA' | 'WPA2' | 'WPA3' | 'WEP';
    qrPass?: string;
    /** id of a central credential (system.credentials.<name>) holding the wifi password; empty = qrPass is used */
    qrCredentialId?: string;
    pwdhidden: boolean;
    setState: string;
    uniqueName: string;
} & PageConfigBaseFields;

/**
 * Configuration for one of the six power slots on cardPower (leftTop / leftMiddle / leftBottom /
 * rightTop / rightMiddle / rightBottom). Mirrors the flat `power${i}_*` fields of the legacy
 * jsonConfig accordion but groups them per-slot so the React editor can show them as one panel.
 */
export type PowerSlotConfig = {
    /** Material-design icon name shown for this slot */
    icon?: string;
    /** Static icon color (e.g. '#ffffff'); ignored when useColorScale is true */
    iconColor?: string;
    /** ioBroker state delivering the numeric value for this slot */
    state?: string;
    /** Number of decimal places to render (0–2 in the legacy UI) */
    valueDecimal?: number;
    /** Display unit when the source state has no common.unit. 'W' | 'kW' | 'MW' or any string */
    valueUnit?: string;
    /** Free-text headline rendered above the value */
    entityHeadline?: string;
    /** Activates the iconColor-by-value scale (min/max/best below) */
    useColorScale?: boolean;
    minColorScale?: number;
    maxColorScale?: number;
    /** Optional anchor for the gradient (defaults to triGrad mode in the runtime) */
    bestColorScale?: number;
    /** Lower bound for the speed/animation indicator (mapped to NSPanel.ScaledNumberType.minScale) */
    minSpeedScale?: number;
    /** Upper bound for the speed/animation indicator (mapped to NSPanel.ScaledNumberType.maxScale) */
    maxSpeedScale?: number;
    /** Reverse the speed/flow direction (negate=true at runtime) */
    reverse?: boolean;
};

/** Configuration for the home-top value (the one drawn above the central 'home' icon) */
export type PowerHomeTopConfig = {
    state?: string;
    valueDecimal?: number;
    valueUnit?: string;
};

/**
 * Configuration for the home-bottom value. Either a single state OR an internal
 * sum calculated from a subset of the six side slots (selPowerSupply lists the 1-based
 * slot indices to include; entries listed there are negated when summed).
 */
export type PowerHomeBotConfig = {
    /** When true, ignore `state` and compute the sum from selPowerSupply */
    selInternalCalculation?: boolean;
    state?: string;
    /** 1-based slot indices (1..6) treated as negative contributions to the sum */
    selPowerSupply?: number[];
    valueDecimal?: number;
    valueUnit?: string;
};

export type PowerEntry = {
    card: Extract<AdminCardTypes, 'cardPower'>;
    uniqueName: string;
    headline: string;
    leftTop: PowerSlotConfig;
    leftMiddle: PowerSlotConfig;
    leftBottom: PowerSlotConfig;
    rightTop: PowerSlotConfig;
    rightMiddle: PowerSlotConfig;
    rightBottom: PowerSlotConfig;
    homeTop: PowerHomeTopConfig;
    homeBot: PowerHomeBotConfig;
    /**
     * Deprecated transition: the page was migrated from the old admin table "Page Power" and still
     * gets its navigation from the script. Ends as soon as a navigation is assigned in the admin.
     */
    scriptNavigation?: boolean;
    /**
     * page name used in the script (`uniqueName` of the script page); set by the migration, differs from
     * uniqueName if the entry was renamed. Stays after the switch to admin navigation.
     */
    scriptName?: string;
} & PageConfigBaseFields;

/**
 * Empty default for a power slot — used when adding a new cardPower entry.
 *
 * The scale bounds are stored explicitly, with the defaults of the classic jsonConfig accordion
 * (0 / 10000 / 0 for the color scale, 0 / 10000 for the speed scale). The editor only writes a bound
 * once it was typed in, so without these defaults a slot keeps the bounds it displays out of its stored data.
 *
 * @returns A slot with every field the editor shows.
 */
export function emptyPowerSlot(): PowerSlotConfig {
    return {
        icon: '',
        iconColor: '',
        state: '',
        valueDecimal: 0,
        valueUnit: 'W',
        entityHeadline: '',
        useColorScale: false,
        minColorScale: 0,
        maxColorScale: 10_000,
        bestColorScale: 0,
        minSpeedScale: 0,
        maxSpeedScale: 10_000,
    };
}

// Chart Entry for pageChart configuration (the diagram type lives in selChartType, card is always 'cardChart')
export type ChartEntry = {
    card: Extract<AdminCardTypes, 'cardChart'>;
    uniqueName: string;
    headline?: string;
    chartColor?: string;
    txtLabelYAchse?: string;

    selChartType?: 'cardChart' | 'cardLChart';
    selInstanceDataSource?: number; // 0 = script, 1 = DB adapter
    // oldScriptVersion
    setStateForTicks?: string;
    setStateForValues?: string;
    // db Version
    selInstance?: string; // Instance ID for DB adapter
    setStateForDB?: string;
    rangeHours?: number;
    maxXAxisTicks?: number;
    factorCardChart?: number; // 1, 10, 100, 1000
    maxXAxisLabels?: number;
    /**
     * Deprecated transition: the page was migrated from the old admin table "Page Chart" and still
     * gets its navigation from the script. Ends as soon as a navigation is assigned in the admin.
     */
    scriptNavigation?: boolean;
    /**
     * page name used in the script (`uniqueName` of the script page); set by the migration, differs from
     * uniqueName if the entry was renamed. Stays after the switch to admin navigation.
     */
    scriptName?: string;
} & PageConfigBaseFields;

export type ChartDetailsExternal = {
    instance: string; // Instance ID for DB adapter
    state: string;
    hours?: number;
    maxTicks?: number;
    factor?: number; // 1, 10, 100, 1000
    maxLabels?: number;
};

/**
 * Defaults of a chart page — the single source for the PageConfig editor, handleAdd,
 * admin.ts and the classic table path (getChartPageConfig). Display and storage stay identical.
 */
export const chartDefaults = {
    chartColor: '#FFFF00',
    selChartType: 'cardChart' as 'cardChart' | 'cardLChart',
    selInstanceDataSource: 0,
    rangeHours: 24,
    maxXAxisTicks: 2,
    factorCardChart: 1,
    maxXAxisLabels: 4,
};

/**
 * Creates a fresh chart entry with all fields set explicitly (same pattern as emptyPowerSlot).
 *
 * @param uniqueName unique page name
 */
export function emptyChartEntry(uniqueName: string): ChartEntry {
    return {
        card: 'cardChart',
        uniqueName,
        headline: uniqueName,
        chartColor: chartDefaults.chartColor,
        txtLabelYAchse: '',
        selChartType: chartDefaults.selChartType,
        selInstanceDataSource: chartDefaults.selInstanceDataSource,
        setStateForTicks: '',
        setStateForValues: '',
        selInstance: '',
        setStateForDB: '',
        rangeHours: chartDefaults.rangeHours,
        maxXAxisTicks: chartDefaults.maxXAxisTicks,
        factorCardChart: chartDefaults.factorCardChart,
        maxXAxisLabels: chartDefaults.maxXAxisLabels,
        hidden: false,
        alwaysOn: 'none',
    };
}

/** one row of the old admin table "Page Chart" (`native.pageChartdata`) */
export type LegacyChartRow = {
    pageName: string;
    headline?: string;
    alwaysOnDisplay?: boolean;
    hiddenByTrigger?: boolean;
    chart_color?: string;
    selChartType?: 'cardChart' | 'cardLChart';
    selInstanceDataSource?: number;
    selInstance?: string;
    setStateForTicks?: string;
    setStateForValues?: string;
    setStateForDB?: string;
    txtlabelYAchse?: string;
    rangeHours?: number;
    maxXAxisTicks?: number;
    factorCardChart?: number;
    maxXAxisLabels?: number;
};

/**
 * True if the chart entry still gets its navigation from the script (migrated, no admin navigation yet).
 *
 * @param entry page config entry
 */
export function isScriptNavigatedChart(entry: PageConfigEntry): entry is ChartEntry {
    return entry.card === 'cardChart' && entry.scriptNavigation === true && !entry.navigationAssignment?.length;
}

/**
 * True if the power entry still gets its navigation from the script (migrated, no admin navigation yet).
 *
 * @param entry page config entry
 */
export function isScriptNavigatedPower(entry: PageConfigEntry): entry is PowerEntry {
    return entry.card === 'cardPower' && entry.scriptNavigation === true && !entry.navigationAssignment?.length;
}

/**
 * Chart entry a script page `cardChart`/`cardLChart` refers to: first a migrated entry whose script
 * name matches, then any chart entry with that uniqueName.
 *
 * @param entries page config
 * @param scriptPageName uniqueName of the script page
 */
export function findChartEntryForScript(
    entries: readonly PageConfigEntry[],
    scriptPageName: string,
): ChartEntry | undefined {
    const charts = entries.filter((e): e is ChartEntry => !!e && e.card === 'cardChart');
    return (
        charts.find(e => e.scriptNavigation === true && (e.scriptName ?? e.uniqueName) === scriptPageName) ??
        charts.find(e => e.uniqueName === scriptPageName)
    );
}

/**
 * Power entry a script page `cardPower` refers to: first a migrated entry whose script name matches,
 * then any power entry with that uniqueName.
 *
 * @param entries page config
 * @param scriptPageName uniqueName of the script page
 */
export function findPowerEntryForScript(
    entries: readonly PageConfigEntry[],
    scriptPageName: string,
): PowerEntry | undefined {
    const powers = entries.filter((e): e is PowerEntry => !!e && e.card === 'cardPower');
    return (
        powers.find(e => e.scriptNavigation === true && (e.scriptName ?? e.uniqueName) === scriptPageName) ??
        powers.find(e => e.uniqueName === scriptPageName)
    );
}

/**
 * Ends the script navigation of a migrated chart or power entry once it has a navigation in the admin.
 * `scriptName` stays as a record of where the entry came from.
 *
 * @param entry page config entry
 */
export function dropScriptNavigation(entry: PageConfigEntry): PageConfigEntry {
    if (
        (entry.card !== 'cardChart' && entry.card !== 'cardPower') ||
        !entry.scriptNavigation ||
        !entry.navigationAssignment?.length
    ) {
        return entry;
    }
    const copy = { ...entry };
    delete copy.scriptNavigation;
    return copy;
}

/**
 * Moves the rows of the old admin table "Page Chart" into the page config. The new entries keep their
 * navigation in the script (`scriptNavigation`) until the user assigns one in the admin. A row whose name
 * is already used by another entry gets a new name (`<name>_chart`, `<name>_chart2`, …); the script still
 * finds it via `scriptName`. Rows migrated before are skipped.
 *
 * @param rows old table `native.pageChartdata`
 * @param entries page config `native.pageConfig`
 * @returns the extended page config, the warnings for renamed rows, changed = something was added
 */
export function migrateLegacyCharts(
    rows: readonly LegacyChartRow[] | undefined,
    entries: readonly PageConfigEntry[],
): { entries: PageConfigEntry[]; messages: string[]; changed: boolean } {
    const out = [...entries];
    const messages: string[] = [];
    let changed = false;
    for (const row of rows ?? []) {
        const name = typeof row?.pageName === 'string' ? row.pageName.trim() : '';
        if (!name) {
            continue;
        }
        if (out.some(e => e.card === 'cardChart' && e.scriptName === name)) {
            continue;
        }
        let uniqueName = name;
        for (let i = 1; out.some(e => e.uniqueName === uniqueName); i++) {
            uniqueName = `${name}_chart${i === 1 ? '' : i}`;
        }
        if (uniqueName !== name) {
            messages.push(
                `Chart page '${name}': the name is already used by another page, migrated as '${uniqueName}'. The script keeps using '${name}'.`,
            );
        }
        const d = chartDefaults;
        out.push({
            card: 'cardChart',
            uniqueName,
            scriptName: name,
            scriptNavigation: true,
            headline: row.headline ?? '',
            chartColor: row.chart_color || d.chartColor,
            txtLabelYAchse: row.txtlabelYAchse ?? '',
            selChartType: row.selChartType === 'cardLChart' ? 'cardLChart' : 'cardChart',
            selInstanceDataSource: row.selInstanceDataSource === 1 ? 1 : 0,
            setStateForTicks: row.setStateForTicks ?? '',
            setStateForValues: row.setStateForValues ?? '',
            selInstance: row.selInstance ?? '',
            setStateForDB: row.setStateForDB ?? '',
            rangeHours: row.rangeHours || d.rangeHours,
            maxXAxisTicks: row.maxXAxisTicks || d.maxXAxisTicks,
            factorCardChart: row.factorCardChart || d.factorCardChart,
            maxXAxisLabels: row.maxXAxisLabels || d.maxXAxisLabels,
            hidden: !!row.hiddenByTrigger,
            alwaysOn: row.alwaysOnDisplay ? 'always' : 'none',
        });
        changed = true;
    }
    return { entries: out, messages, changed };
}

/**
 * one row of the old admin table "Page Power" (`native.pagePowerdata`): flat fields `power1_*` … `power6_*`
 * for the six slots, `power7_*` for the value above and `power8_*` for the value below the home icon.
 * The values are typed loosely because the jsonConfig table stored numbers partly as strings.
 */
export type LegacyPowerRow = {
    pageName: string;
    headline?: unknown;
    alwaysOnDisplay?: unknown;
    hiddenByTrigger?: unknown;
    [key: string]: unknown;
};

/**
 * Display unit of a migrated value the way the old table path chose it: the unit of the state object
 * first, then the unit selected in the table, else 'W'.
 *
 * @param state state id of the value
 * @param tableUnit unit selected in the old table
 * @param stateUnits common.unit of the states, by id
 */
function legacyPowerUnit(state: string, tableUnit: unknown, stateUnits: Readonly<Record<string, string>>): string {
    return (state && stateUnits[state]) || (typeof tableUnit === 'string' && tableUnit !== '' ? tableUnit : 'W');
}

/**
 * Converts one row of the old table "Page Power" into the slots of a power entry (power1 … power6 =
 * leftTop … rightBottom). Mirrors how the old
 * table path read the row: fields of the wrong type (e.g. a speed bound stored as string) fall back to the
 * defaults, the static icon color only counts while the color scale is explicitly switched off and the
 * color scale only while it is switched on with all three bounds set.
 *
 * @param row row of the old table
 * @param stateUnits common.unit of the states used by the row, by id
 */
function legacyPowerContent(
    row: LegacyPowerRow,
    stateUnits: Readonly<Record<string, string>>,
): Pick<
    PowerEntry,
    'leftTop' | 'leftMiddle' | 'leftBottom' | 'rightTop' | 'rightMiddle' | 'rightBottom' | 'homeTop' | 'homeBot'
> {
    const str = (key: string): string => {
        const v = row[key];
        return typeof v === 'string' ? v : '';
    };
    const num = (key: string, def: number): number => {
        const v = row[key];
        return typeof v === 'number' ? v : def;
    };
    const slot = (i: number): PowerSlotConfig => {
        const p = `power${i}_`;
        const useScale = row[`_${p}useColorScale`];
        const scale = [row[`${p}minColorScale`], row[`${p}maxColorScale`], row[`${p}bestColorScale`]];
        const state = str(`${p}state`).trim();
        return {
            icon: str(`${p}icon`),
            iconColor: useScale === false ? str(`${p}iconColor`) : '',
            state,
            valueDecimal: num(`${p}valueDecimal`, 0),
            valueUnit: legacyPowerUnit(state, row[`${p}valueUnit`], stateUnits),
            entityHeadline: str(`${p}entityHeadline`),
            useColorScale: useScale === true && scale.every(s => typeof s === 'number'),
            minColorScale: num(`${p}minColorScale`, 0),
            maxColorScale: num(`${p}maxColorScale`, 10_000),
            bestColorScale: num(`${p}bestColorScale`, 0),
            minSpeedScale: num(`${p}minSpeedScale`, 0),
            maxSpeedScale: num(`${p}maxSpeedScale`, 10_000),
            reverse: row[`${p}reverse`] === true,
        };
    };
    const topState = str('power7_state').trim();
    const botState = str('power8_state').trim();
    const internal = row.power8_selInternalCalculation === true;
    const supply = row.power8_selPowerSupply;
    return {
        leftTop: slot(1),
        leftMiddle: slot(2),
        leftBottom: slot(3),
        rightTop: slot(4),
        rightMiddle: slot(5),
        rightBottom: slot(6),
        homeTop: {
            state: topState,
            valueDecimal: num('power7_valueDecimal', 0),
            valueUnit: legacyPowerUnit(topState, row.power7_valueUnit, stateUnits),
        },
        homeBot: {
            selInternalCalculation: internal,
            state: botState,
            selPowerSupply: Array.isArray(supply)
                ? supply.map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 6)
                : [],
            valueDecimal: num('power8_valueDecimal', 0),
            // the internal sum has no state, its unit is the one selected in the table
            valueUnit: legacyPowerUnit(internal ? '' : botState, row.power8_valueUnit, stateUnits),
        },
    };
}

/**
 * State ids a row of the old table "Page Power" reads - the migration needs their common.unit.
 *
 * @param rows old table `native.pagePowerdata`
 */
export function legacyPowerStates(rows: readonly LegacyPowerRow[] | undefined): string[] {
    const ids = new Set<string>();
    for (const row of rows ?? []) {
        for (let i = 1; i <= 8; i++) {
            const v = row?.[`power${i}_state`];
            if (typeof v === 'string' && v.trim()) {
                ids.add(v.trim());
            }
        }
    }
    return [...ids];
}

/**
 * Moves the rows of the old admin table "Page Power" into the page config. The new entries keep their
 * navigation in the script (`scriptNavigation`) until the user assigns one in the admin. A row whose name
 * is already used by another entry gets a new name (`<name>_power`, `<name>_power2`, …); the script still
 * finds it via `scriptName`. Rows migrated before are skipped.
 *
 * The unit of a value is taken from the state object if it has one (`stateUnits`), as the old table path
 * displayed it, otherwise the unit selected in the table is kept.
 *
 * @param rows old table `native.pagePowerdata`
 * @param entries page config `native.pageConfig`
 * @param stateUnits common.unit of the states used by the rows, by id (see {@link legacyPowerStates})
 * @returns the extended page config, the warnings for renamed rows, changed = something was added
 */
export function migrateLegacyPower(
    rows: readonly LegacyPowerRow[] | undefined,
    entries: readonly PageConfigEntry[],
    stateUnits: Readonly<Record<string, string>> = {},
): { entries: PageConfigEntry[]; messages: string[]; changed: boolean } {
    const out = [...entries];
    const messages: string[] = [];
    let changed = false;
    for (const row of rows ?? []) {
        const name = typeof row?.pageName === 'string' ? row.pageName.trim() : '';
        if (!name) {
            continue;
        }
        if (out.some(e => e.card === 'cardPower' && e.scriptName === name)) {
            continue;
        }
        let uniqueName = name;
        for (let i = 1; out.some(e => e.uniqueName === uniqueName); i++) {
            uniqueName = `${name}_power${i === 1 ? '' : i}`;
        }
        if (uniqueName !== name) {
            messages.push(
                `Power page '${name}': the name is already used by another page, migrated as '${uniqueName}'. The script keeps using '${name}'.`,
            );
        }
        out.push({
            card: 'cardPower',
            uniqueName,
            scriptName: name,
            scriptNavigation: true,
            headline: typeof row.headline === 'string' ? row.headline : '',
            ...legacyPowerContent(row, stateUnits),
            hidden: row.hiddenByTrigger === true,
            alwaysOn: row.alwaysOnDisplay === true ? 'always' : 'none',
        });
        changed = true;
    }
    return { entries: out, messages, changed };
}

/** where a heat circuit takes its states from: an alias channel (script `id`) or single data points */
export type Thermo2CircuitSource = 'alias' | 'states';

/**
 * One heat circuit of a cardThermo2 page - the fields of the script `thermoItems` entry.
 * Colors are stored as '#rrggbb' like the item colors and converted to RGB for the adapter.
 */
export type Thermo2CircuitConfig = {
    /** default 'alias' */
    source?: Thermo2CircuitSource;
    /** alias: channel, device or folder with common.role thermostat or airCondition */
    channelId: string;
    /** states: writable set temperature (script `set`) */
    setState?: string;
    /** states: actual temperature (script `thermoId1`) */
    actualState?: string;
    /** states: humidity (script `thermoId2`) */
    humidityState?: string;
    /** states: mode, number with common.states or a string (script `modeId`) */
    modeState?: string;
    /** headline of the circuit; empty = common.name of the channel */
    name?: string;
    /** airCondition only: headline of the cooling circuit */
    name2?: string;
    /** lower limit of the set temperature; empty = adapter default */
    minValue?: number;
    /** upper limit of the set temperature; empty = adapter default */
    maxValue?: number;
    /** step of the +/- buttons; empty = adapter default */
    stepValue?: number;
    /** line 1 (actual temperature): icon, color, unit (the unit is used for the set temperature too) */
    icon?: string;
    onColor?: string;
    unit?: string;
    /** line 3 (humidity): icon, color, unit */
    icon2?: string;
    onColor2?: string;
    unit2?: string;
    /** icon of the circuit on the selector slots (shown when there is more than one circuit) and its colors */
    iconHeatCycle?: string;
    iconHeatCycleOnColor?: string;
    iconHeatCycleOffColor?: string;
    /** airCondition only: selector icon and colors of the cooling circuit */
    iconHeatCycle2?: string;
    iconHeatCycleOnColor2?: string;
    iconHeatCycleOffColor2?: string;
    /** texts of the mode state, index = value; empty = common.states of the state or the adapter list */
    modeList?: string[];
};

/** order of the eight slots around the ring (pageThermo2.ts) */
export type Thermo2SortOrder = 'V' | 'H' | 'HM' | 'VM' | 'HB' | 'VB';
export const thermo2SortOrders: readonly Thermo2SortOrder[] = ['V', 'H', 'HM', 'VM', 'HB', 'VB'];

/** the panel shows at most eight circuits (an airCondition channel takes two) */
export const thermo2MaxCircuits = 8;

/**
 * Defaults the adapter applies when a field is left empty (pageThermo2.ts). Shown as placeholders
 * in the editor; with the option `defaultValueCardThermo` the adapter divides stored limits by 10.
 */
export const thermo2Defaults = {
    minValue: 15,
    maxValue: 28,
    stepValue: 0.5,
    unit: '°C',
    unit2: '%',
    icon: 'thermometer',
    icon2: 'water-percent',
    onColor: '#00ff00',
    onColor2: '#ff00ff',
    iconHeatCycleOnColor: '#00ff00',
    iconHeatCycleOffColor: '#888888',
    iconHeatCycleOnColor2: '#0000ff',
    iconHeatCycleOffColor2: '#50508c',
    modeList: ['OFF', 'AUTO', 'COOL', 'HEAT', 'ECO', 'FAN', 'DRY'],
};

export type Thermo2Entry = {
    card: Extract<AdminCardTypes, 'cardThermo2'>;
    uniqueName: string;
    /** heat circuits in display order, at least one with a channel is required */
    thermoItems: Thermo2CircuitConfig[];
    /** page items shown around the ring; `filter` of an item binds it to one circuit */
    pageItems: (AdminPageItemConfig | undefined)[];
    /** order of the slots, default 'V' */
    sortOrder?: Thermo2SortOrder;
    /** headline of the page, empty = uniqueName (only set by a page link, the editor has no field) */
    headline?: string;
} & PageScrollFields &
    PageConfigBaseFields;

/**
 * Empty heat circuit - used when adding a circuit in the editor.
 *
 * @returns A circuit without channel and headline, everything else left to the adapter defaults.
 */
export function emptyThermo2Circuit(): Thermo2CircuitConfig {
    return { source: 'alias', channelId: '', name: '' };
}

/**
 * Creates a fresh thermo2 entry with one empty circuit (same pattern as emptyChartEntry).
 *
 * @param uniqueName unique page name
 */
export function emptyThermo2Entry(uniqueName: string): Thermo2Entry {
    return {
        card: 'cardThermo2',
        uniqueName,
        thermoItems: [],
        pageItems: [],
        sortOrder: 'V',
        hidden: false,
        alwaysOn: 'none',
    };
}

// ---------------------------------------------------------------------------------------------
// cardThermo - classic thermostat page, converted into the script form `ScriptConfig.PageThermo`
// ---------------------------------------------------------------------------------------------

/** channel roles the adapter accepts for the thermostat of a cardThermo page (ConfigManager.getPageThermo) */
export const thermoChannelRoles: readonly string[] = ['thermostat', 'airCondition'];

/**
 * Classic thermostat page (`cardThermo`) - the admin form of the script page `ScriptConfig.PageThermo`.
 *
 * The page shows one thermostat: an alias channel with the role `thermostat` or `airCondition`. The
 * adapter reads the actual, set and humidity states below the channel; the buttons at the bottom are
 * not configured but derived from the states it finds there (mode icons of an airCondition `MODE`
 * state, boost, window open, ...). Of the script page the adapter only reads `heading` and, of
 * `items[0]`, the fields stored here (`ConfigManager.getPageThermo`); the entry keeps them exactly
 * like the script, nothing is converted.
 */
export type ThermoEntry = {
    card: Extract<AdminCardTypes, 'cardThermo'>;
    uniqueName: string;
    /** headline of the page, empty = uniqueName */
    headline?: string;
    /** alias channel (channel, device or folder) with common.role thermostat or airCondition (script `items[0].id`) */
    channelId: string;
    /** unit shown behind the actual and the set temperature; empty = `common.unit` of the set temperature state */
    unit?: string;
    /**
     * Limits and step of the set temperature as the panel counts (pageThermo.ts): with a maximum of 100 or
     * more the three values are tenths of a degree (100 = 10 °C, step 5 = 0.5 °C), with a maximum below 100
     * they count as degrees and are multiplied by 10 (step 0.5 = 0.5 °C). A step below one tenth is raised
     * to one tenth. Empty = `common.min` / `max` / `step` of the set temperature state, without them
     * 15 °C to 30 °C in steps of 0.5 °C.
     */
    minValue?: number;
    maxValue?: number;
    stepValue?: number;
} & PageConfigBaseFields;

/**
 * Creates a fresh thermo entry without a channel (same pattern as emptyThermo2Entry).
 *
 * @param uniqueName unique page name
 */
export function emptyThermoEntry(uniqueName: string): ThermoEntry {
    return {
        card: 'cardThermo',
        uniqueName,
        headline: '',
        channelId: '',
        hidden: false,
        alwaysOn: 'none',
    };
}

// ---------------------------------------------------------------------------------------------
// cardMedia - media player page, converted into the script form `ScriptConfig.PageMedia`
// ---------------------------------------------------------------------------------------------

/** adapters cardMedia works with - the first segment of the player id */
export const mediaBackends = ['alexa2', 'sonos', 'spotify-premium', 'mpd', 'squeezeboxrpc'] as const;
export type MediaBackend = (typeof mediaBackends)[number];

/** standard items of the bar at the bottom of the media page (`deactivateDefaultItems` / `itemsColorOn` of the script) */
export type MediaToolbarItem =
    | 'reminder'
    | 'online'
    | 'speakerList'
    | 'favoriteList'
    | 'playList'
    | 'equalizer'
    | 'clock'
    | 'volumePresets'
    | 'trackList'
    | 'repeat'
    | 'crossfade';

/** standard items holding a list of names that is edited in the admin */
export type MediaListKind = 'speakerList' | 'playList' | 'favoriteList';
export const mediaListKinds: readonly MediaListKind[] = ['speakerList', 'playList', 'favoriteList'];

/** What a backend of cardMedia supports - read from pages/tools/get<Backend>.ts, keep both in line. */
export type MediaBackendFeatures = {
    /** standard items in the order the adapter adds them to the bar */
    items: readonly MediaToolbarItem[];
    /** items whose color can be changed (itemsColorOn) */
    colorOn: readonly MediaToolbarItem[];
    /** items that have a second color for the off state (itemsColorOff) */
    colorOff: readonly MediaToolbarItem[];
    /** the title line takes its own color (colorMediaTitle) */
    titleColor: boolean;
};

export const mediaBackendFeatures: Record<MediaBackend, MediaBackendFeatures> = {
    alexa2: {
        items: ['reminder', 'online', 'speakerList', 'playList', 'equalizer', 'clock', 'volumePresets', 'repeat'],
        colorOn: ['online', 'speakerList', 'playList', 'equalizer', 'clock', 'volumePresets', 'repeat'],
        colorOff: ['reminder', 'online', 'speakerList', 'repeat'],
        titleColor: false,
    },
    sonos: {
        items: [
            'online',
            'speakerList',
            'favoriteList',
            'playList',
            'clock',
            'volumePresets',
            'trackList',
            'repeat',
            'crossfade',
        ],
        colorOn: ['online', 'speakerList', 'favoriteList', 'playList', 'clock', 'volumePresets', 'repeat', 'crossfade'],
        colorOff: ['online', 'speakerList', 'repeat', 'crossfade'],
        titleColor: false,
    },
    'spotify-premium': {
        items: ['online', 'speakerList', 'playList', 'trackList', 'clock', 'volumePresets', 'repeat'],
        colorOn: ['online', 'speakerList', 'playList', 'clock', 'volumePresets', 'repeat'],
        colorOff: ['online', 'speakerList', 'repeat'],
        titleColor: false,
    },
    mpd: {
        items: ['online', 'repeat', 'clock', 'volumePresets', 'crossfade'],
        colorOn: ['online', 'repeat', 'clock', 'volumePresets'],
        colorOff: ['online', 'repeat'],
        titleColor: false,
    },
    squeezeboxrpc: {
        items: ['online', 'speakerList', 'favoriteList', 'playList', 'clock', 'volumePresets', 'trackList', 'repeat'],
        colorOn: ['online', 'speakerList', 'favoriteList', 'playList', 'clock', 'volumePresets', 'repeat'],
        colorOff: ['online', 'speakerList', 'repeat'],
        titleColor: true,
    },
};

/**
 * Backend of a player id, taken from its first segment.
 *
 * @param id Player id, e.g. `sonos.0.root.192_168_1_20`.
 * @returns The backend, undefined for an empty or unsupported id.
 */
export function mediaBackendOf(id: string | undefined): MediaBackend | undefined {
    const name = (id ?? '').trim().split('.')[0];
    return (mediaBackends as readonly string[]).includes(name) ? (name as MediaBackend) : undefined;
}

/**
 * How the admin finds the players of a backend (templates/media-players.json):
 * - `node`: every object `<adapter>.<instance>.<folder>.<name>` of type `objectType` is a player
 * - `instance`: the instance itself is the player, the id is `<adapter>.<instance>`
 */
export type MediaPlayerDefinition =
    | { backend: MediaBackend; kind: 'instance' }
    | { backend: MediaBackend; kind: 'node'; folder: string; objectType: ioBroker.ObjectType };

/** object types a `node` definition may name */
const mediaPlayerObjectTypes: readonly ioBroker.ObjectType[] = ['device', 'channel', 'folder', 'state'];

/**
 * Type guard for an object type a `node` definition may name.
 *
 * @param value Value from the json.
 * @returns true for device, channel, folder or state.
 */
function isMediaPlayerObjectType(value: unknown): value is ioBroker.ObjectType {
    return typeof value === 'string' && (mediaPlayerObjectTypes as readonly string[]).includes(value);
}

/**
 * Type guard for a backend name.
 *
 * @param value Value from the json.
 * @returns true when the value is one of mediaBackends.
 */
export function isMediaBackend(value: unknown): value is MediaBackend {
    return typeof value === 'string' && (mediaBackends as readonly string[]).includes(value);
}

/**
 * Checks one entry of templates/media-players.json.
 *
 * @param value Entry from the json.
 * @returns The definition, undefined when the entry is invalid or names an unknown backend.
 */
export function toMediaPlayerDefinition(value: unknown): MediaPlayerDefinition | undefined {
    if (!value || typeof value !== 'object') {
        return undefined;
    }
    const entry: Record<string, unknown> = { ...value };
    const backend = entry.backend;
    if (!isMediaBackend(backend)) {
        return undefined;
    }
    if (entry.kind === 'instance') {
        return { backend, kind: 'instance' };
    }
    const { folder, objectType } = entry;
    if (entry.kind === 'node' && typeof folder === 'string' && folder && !folder.includes('.')) {
        return isMediaPlayerObjectType(objectType) ? { backend, kind: 'node', folder, objectType } : undefined;
    }
    return undefined;
}

/**
 * Reads the player definitions from the content of templates/media-players.json.
 *
 * @param json Parsed json `{ players: [...] }`.
 * @returns The valid definitions, the first one per backend wins.
 */
export function parseMediaPlayerDefinitions(json: unknown): MediaPlayerDefinition[] {
    const list: unknown = json && typeof json === 'object' && 'players' in json ? json.players : undefined;
    const result: MediaPlayerDefinition[] = [];
    for (const raw of Array.isArray(list) ? list : []) {
        const def = toMediaPlayerDefinition(raw);
        if (def && !result.some(d => d.backend === def.backend)) {
            result.push(def);
        }
    }
    return result;
}

/** how the admin finds the players of each backend - edit templates/media-players.json */
export const mediaPlayerDefinitions: readonly MediaPlayerDefinition[] = parseMediaPlayerDefinitions(mediaPlayersJson);

/**
 * Player definition of a backend.
 *
 * @param backend Backend.
 * @returns The definition, undefined when templates/media-players.json has none.
 */
export function mediaPlayerDefinitionOf(backend: MediaBackend | undefined): MediaPlayerDefinition | undefined {
    return backend ? mediaPlayerDefinitions.find(d => d.backend === backend) : undefined;
}

/**
 * Whether an id is a player the adapter accepts, following templates/media-players.json.
 *
 * @param id Object id.
 * @param type Object type; checked for `node` definitions only, undefined = not checked.
 * @returns true for `<adapter>.<N>.<folder>.<name>` of the definition's object type (`node`) and for
 * `<adapter>.<N>` or any object below it (`instance`, see mediaPlayerIdOf).
 */
export function isSelectableMediaPlayer(id: string, type?: string): boolean {
    const parts = id.trim().split('.');
    const def = mediaPlayerDefinitionOf(mediaBackendOf(id));
    if (!def || parts.length < 2 || !/^\d+$/.test(parts[1])) {
        return false;
    }
    if (def.kind === 'instance') {
        return parts.slice(2).every(part => part !== '');
    }
    return (
        parts.length === 4 &&
        parts[2] === def.folder &&
        parts[3] !== '' &&
        (type === undefined || type === def.objectType)
    );
}

/**
 * Player id the adapter uses for an id: ids of an `instance` backend are cut to `<adapter>.<instance>`,
 * all other ids stay unchanged.
 *
 * @param id Object id.
 * @returns The player id.
 */
export function mediaPlayerIdOf(id: string): string {
    const def = mediaPlayerDefinitionOf(mediaBackendOf(id));
    if (def?.kind === 'instance') {
        return id.trim().split('.').slice(0, 2).join('.');
    }
    return id;
}

/** one standard item of the bar: switched off, or other colors than the adapter default (#rrggbb) */
export type MediaToolbarConfig = {
    /** false = item is not added (deactivateDefaultItems); volumePresets has no switch, it follows the preset list */
    enabled?: boolean;
    colorOn?: string;
    colorOff?: string;
};

/** one volume preset, sent to the adapter as `name?value` */
export type MediaVolumePreset = { name: string; value: number };

/** volume range of the panel when the entry sets none */
export const mediaVolumeDefaults = { minValue: 0, maxValue: 100 };

/** answer of {@link SENDTO_GET_MEDIA_PLAYER_COMMAND} */
export type MediaPlayerInfo = {
    /** the adapter accepts the id */
    ok: boolean;
    backend?: MediaBackend;
    /** findings of the check, empty when ok */
    messages: string[];
    /** names offered for the lists - empty when the adapter cannot read them */
    options: Record<MediaListKind, string[]>;
};

/** sendTo of main.ts: checks a player id and reads the names for the lists ({ id } -> {@link MediaPlayerInfo}) */
export const SENDTO_GET_MEDIA_PLAYER_COMMAND = 'getMediaPlayer';

export type MediaEntry = {
    card: Extract<AdminCardTypes, 'cardMedia'>;
    uniqueName: string;
    /** headline of the page, empty = uniqueName (only set by a page link, the panel shows the player name) */
    headline?: string;
    /** device, channel or folder of the player - not a state; the adapter name alone takes its lowest instance */
    mediaId: string;
    /** name of the player, empty = read from the adapter */
    name?: string;
    /** volume range of the panel slider */
    minValue?: number;
    maxValue?: number;
    /** colors as #rrggbb, empty = adapter default */
    colorMediaIcon?: string;
    colorMediaArtist?: string;
    /** squeezeboxrpc only */
    colorMediaTitle?: string;
    /** settings of the standard items, missing item = adapter default */
    toolbar?: Partial<Record<MediaToolbarItem, MediaToolbarConfig>>;
    speakerList?: string[];
    playList?: string[];
    favoriteList?: string[];
    volumePresets?: MediaVolumePreset[];
    /** own page items, shown after the standard items */
    pageItems: (AdminPageItemConfig | undefined)[];
} & PageScrollFields &
    PageConfigBaseFields;

/**
 * Creates a fresh media entry without player.
 *
 * @param uniqueName unique page name
 * @returns The entry, everything left to the adapter defaults.
 */
export function emptyMediaEntry(uniqueName: string): MediaEntry {
    return {
        card: 'cardMedia',
        uniqueName,
        mediaId: '',
        pageItems: [],
        hidden: false,
        alwaysOn: 'none',
    };
}

/**
 * Standard items a media entry shows on the panel, in their order.
 *
 * The online item is only shown by the adapter while the player is offline, all others as long as
 * they are not switched off; volumePresets needs at least one preset.
 *
 * @param entry Media entry.
 * @param backend Backend of the player.
 * @returns The visible standard items.
 */
export function mediaVisibleToolbarItems(entry: MediaEntry, backend: MediaBackend): MediaToolbarItem[] {
    return mediaBackendFeatures[backend].items.filter(item =>
        item === 'volumePresets' ? (entry.volumePresets ?? []).length > 0 : entry.toolbar?.[item]?.enabled !== false,
    );
}

export type TrashItem = {
    textTrash: string;
    customTrash: string;
    iconColor: string;
    icon: string;
};

/** Number of waste types a cardTrash entry holds - the card cannot show more. */
export const trashItemCount = 6;

/** Icon colours of a fresh cardTrash entry, one per waste type. */
const trashItemColors: string[] = ['#3c3fff', '#fffd77', '#d2d2d2', '#de8900', '#d2d2d2', '#d2d2d2'];

/**
 * The {@link trashItemCount} items of a cardTrash entry, filled up with defaults.
 *
 * Entries written before the single fields per waste type became an array carry no `items` at all,
 * and a shortened list can be left behind by a hand edited configuration. Both would otherwise
 * break every consumer of `items`.
 *
 * @param items Stored items, may be missing or too short.
 * @returns Exactly {@link trashItemCount} items.
 */
export function normalizeTrashItems(items: TrashItem[] | undefined): TrashItem[] {
    const stored = Array.isArray(items) ? items : [];
    return Array.from({ length: trashItemCount }, (_, i) => {
        const item: Partial<TrashItem> = stored.length > i ? stored[i] : {};
        return {
            textTrash: item.textTrash ?? '',
            customTrash: item.customTrash ?? '',
            iconColor: item.iconColor ?? trashItemColors[i],
            icon: item.icon ?? '',
        };
    });
}

export type TrashEntry = {
    card: 'cardTrash';
    uniqueName: string;
    headline: string;
    countItems: number; // Anzahl der anzuzeigenden Müllarten
    trashImport: boolean; // true = Import from iCal Adapter, false = Import from .ics file
    trashState: string; // Object ID Selector
    trashFile: string; // textfield for file name incl. path
    items: TrashItem[]; // Array statt 6 einzelne Felder pro Typ
} & PageConfigBaseFields;

// Rückgabewert-Typ für das Navigation Assignment Panel
export type NavigationAssignment = {
    topic: string;

    navigation?: {
        next?: string;
        prev?: string;
        home?: string;
        parent?: string;
    };
};

export type NavigationAssignmentList = NavigationAssignment[];
/**
 * Pseudo card of the admin: a page link shows the content of another admin page under its own
 * name. Only the metadata (navigation, start page, hidden, alwaysOn) and the headline belong to the link, all
 * other fields come from the target. The adapter replaces the link with a copy of the target
 * before the pages are built ({@link resolvePageLinks}), so it never sees this card.
 */
export const pageLinkCard = 'pageLink';

export type PageLinkEntry = {
    card: typeof pageLinkCard;
    uniqueName: string;
    /** headline of the page, empty = headline of the target, if that is empty too its uniqueName */
    headline?: string;
    /** uniqueName of the linked admin page */
    target: string;
} & PageConfigBaseFields;

export type PageConfigEntry =
    | QREntry
    | UnlockEntry
    | TrashEntry
    | ChartEntry
    | MenuEntry
    | PowerEntry
    | Thermo2Entry
    | ThermoEntry
    | MediaEntry
    | PageLinkEntry;
export type PageConfig = PageConfigEntry;
/** a page entry with real content - everything but a page link */
export type PageContentEntry = Exclude<PageConfigEntry, PageLinkEntry>;

/**
 * Whether an admin page entry is a page link.
 *
 * @param entry Admin page configuration entry.
 * @returns True for a page link.
 */
export function isPageLinkEntry(entry: PageConfigEntry | undefined | null): entry is PageLinkEntry {
    return !!entry && entry.card === pageLinkCard;
}

/**
 * Why a page link cannot be resolved, undefined if it can.
 *
 * @param link The page link.
 * @param entries All admin page entries.
 * @returns 'missing' without a target or if it does not exist, 'link' if the target is a link itself.
 */
export function pageLinkProblem(
    link: PageLinkEntry,
    entries: readonly PageConfigEntry[],
): 'missing' | 'link' | undefined {
    const target = link.target ? entries.find(e => e && e.uniqueName === link.target) : undefined;
    if (!target) {
        return 'missing';
    }
    return isPageLinkEntry(target) ? 'link' : undefined;
}

/**
 * Replaces every page link by a copy of its target page. The copy takes uniqueName, hidden,
 * alwaysOn, navigation and the start page flag of the link; everything else (page items,
 * card fields) comes from the target. Headline: the one of the link, else the one of the target,
 * else the uniqueName of the target. Links whose target is missing or a link itself are
 * dropped and reported.
 *
 * @param entries Admin page entries (`native.pageConfig`).
 * @returns The entries without links and the links that could not be resolved.
 */
export function resolvePageLinks(entries: readonly PageConfigEntry[]): {
    entries: PageContentEntry[];
    unresolved: { uniqueName: string; target: string; problem: 'missing' | 'link' }[];
} {
    const result: PageContentEntry[] = [];
    const unresolved: { uniqueName: string; target: string; problem: 'missing' | 'link' }[] = [];
    for (const entry of entries) {
        if (!entry) {
            continue;
        }
        if (!isPageLinkEntry(entry)) {
            result.push(entry);
            continue;
        }
        const target = entries.find(e => e && e.uniqueName === entry.target);
        if (!target || isPageLinkEntry(target)) {
            unresolved.push({
                uniqueName: entry.uniqueName,
                target: entry.target,
                problem: target ? 'link' : 'missing',
            });
            continue;
        }
        const copy: PageContentEntry = structuredClone(target);
        copy.uniqueName = entry.uniqueName;
        copy.headline = entry.headline || target.headline || target.uniqueName;
        copy.hidden = entry.hidden;
        copy.alwaysOn = entry.alwaysOn;
        copy.navigationAssignment = entry.navigationAssignment
            ? structuredClone(entry.navigationAssignment)
            : undefined;
        copy.isMainPage = !!entry.isMainPage;
        if (copy.card === 'cardChart' || copy.card === 'cardPower') {
            // the script navigation belongs to the script page of the target, the link navigates on its own
            copy.scriptNavigation = false;
            delete copy.scriptName;
        }
        result.push(copy);
    }
    return { entries: result, unresolved };
}

/**
 * Whether an admin page entry is flagged as the start page of its assigned panels.
 *
 * Screensavers live in their own table (`screensaverConfig`) and can never be a start page. The stored
 * `uniqueName` is never changed by the flag - the adapter publishes the page under
 * {@link mainPageName} and the admin only overlays the displayed name.
 *
 * @param entry Admin page configuration entry.
 * @returns True if the entry is the start page.
 */
export function isMainPageEntry(entry: PageConfigEntry): boolean {
    return 'isMainPage' in entry && !!entry.isMainPage;
}

export type PanelStatus =
    | 'offline'
    | 'initializing'
    | 'connecting'
    | 'connected'
    | 'online'
    | 'flashing'
    | 'error'
    | 'setup'
    | 'deactivated';

export const panelStatusStates: Record<number, PanelStatus> = {
    0: 'offline', // Panel ist offline, keine belegbare Verbindung zum Adapter
    1: 'initializing', // Panel Objekt initialisiert. Nur im Startup / Skriptübertragung
    2: 'connecting', // Panel baut mqtt-Verbindung auf. Nur im Startup / Skriptübertragung
    3: 'connected', // Panel hat mqtt-Verbindung aufgebaut, aber noch kein Online-Status. Nur im Startup / Skriptübertragung
    4: 'online', // Panel TFT hat sich gemeldet und ist online
    5: 'flashing', // Panel wird geflasht
    6: 'error', // Panel hat einen Fehler gemeldet (z.B. Verbindungsfehler, Fehler beim Flashen, etc.)
    7: 'setup', // Panel befindet sich im Einrichtungsmodus
    8: 'deactivated', // Panel ist per cmd.activated deaktiviert
};

export const panelStatusColors: Record<PanelStatus, string> = {
    offline: '#9E9E9E',
    initializing: '#9E9E9E',
    connecting: '#03A9F4',
    connected: '#2196F3',
    online: '#4CAF50',
    flashing: '#FFC107',
    setup: '#d99800',
    error: '#F44336',
    // Violett: der einzige Status, den der Anwender selbst setzt - hebt sich von allen anderen ab
    deactivated: '#AB47BC',
};

export const panelStatusTranslationKeys: Record<PanelStatus, string> = {
    offline: 'Panel_status_offline',
    initializing: 'Panel_status_initializing',
    connecting: 'Panel_status_connecting',
    connected: 'Panel_status_connected',
    online: 'Panel_status_online',
    flashing: 'Panel_status_flashing',
    setup: 'Panel_status_setup',
    error: 'Panel_status_error',
    deactivated: 'Panel_status_deactivated',
};

export function reversePanelStatusStates(value: PanelStatus): number {
    const reversed: Record<PanelStatus, number> = {} as Record<PanelStatus, number>;
    for (const key in panelStatusStates) {
        if (Object.prototype.hasOwnProperty.call(panelStatusStates, key)) {
            const value = panelStatusStates[key];
            reversed[value] = parseInt(key, 10);
        }
    }
    return reversed[value];
}

export const requiredScriptDataPoints = {
    airCondition: {
        name: 'airCondition',
        description: 'Not everything for every card',
        data: {
            ACTUAL: {
                role: 'value.temperature',
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
            },
            SET: { role: 'level.temperature', type: 'number', useKey: true, required: true, writeable: true },
            SET2: { role: 'level.temperature', type: 'number', useKey: true, required: false, writeable: true },
            BOOST: {
                role: ['switch.mode.boost', 'switch.boost'],
                type: 'boolean',
                required: false,
                writeable: true,
                trigger: true,
            },
            ERROR: { role: 'indicator.error', type: 'boolean', required: false, writeable: false, trigger: true },
            HUMIDITY: { role: 'value.humidity', type: 'number', required: false, writeable: false, trigger: true },
            MAINTAIN: {
                role: 'indicator.maintenance',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
            },
            MODE: {
                role: 'value.mode.airconditioner',
                type: ['number', 'string'],
                required: false,
                writeable: false,
                trigger: true,
                description: `0: OFF, 1: AUTO, 2: COOL, 3: HEAT, 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.  (alternative type: 'string' for direct display) iif missed pick ModeSet -`,
            },
            MODESET: {
                role: 'level.mode.airconditioner',
                type: ['number'],
                required: false,
                writeable: true,
                trigger: true,
                description: `0: OFF, 1: COOL, 2: HEAT, 3: AUTO,//soweit eingebaut 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.`,
            },
            POWER: {
                role: 'switch',
                type: 'boolean',
                required: false,
                writeable: true,
                description: 'use MODE for on/off',
            },
            SPEED: { role: 'level.mode.fan', type: 'number', required: false, writeable: true, trigger: true },
            SWING: { role: 'level.mode.swing', type: 'number', required: false, writeable: true, trigger: true },
            SWING2: { role: 'switch.mode.swing', type: 'boolean', required: false, writeable: true, trigger: true },
            UNREACH: {
                role: 'indicator.maintenance.unreach',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                description: '',
            },
        },
    },
    blind: {
        updatedVersion: true,
        name: 'blind',
        description: '',
        data: {
            ACTUAL: {
                role: ['value.blind', 'level.blind'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            SET: { role: 'level.blind', type: 'number', required: true, writeable: true },
            CLOSE: { role: 'button.close.blind', type: 'boolean', required: true, writeable: true },
            OPEN: { role: 'button.open.blind', type: 'boolean', required: true, writeable: true },
            STOP: { role: 'button.stop.blind', type: 'boolean', required: true, writeable: true },
            TILT_ACTUAL: {
                role: ['level.tilt', 'value.tilt'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
            },
            TILT_SET: { role: 'level.tilt', type: 'number', required: false, writeable: true },
            TILT_CLOSE: { role: 'button.close.tilt', type: 'boolean', required: false, writeable: true },
            TILT_OPEN: { role: 'button.open.tilt', type: 'boolean', required: false, writeable: true },
            TILT_STOP: { role: 'button.stop.tilt', type: 'boolean', required: false, writeable: true },
        },
    },
    button: {
        updatedVersion: true,
        name: 'button',
        description: 'Switch',
        data: {
            SET: { role: 'button', type: 'boolean', required: true, writeable: true },
        },
    },
    ct: {
        updatedVersion: true,
        name: 'ct',
        description: 'für Lampen die das weiße Licht zwischen kalt und warm ändern können',
        data: {
            DIMMER: { role: 'level.dimmer', type: 'number', required: true, trigger: true, writeable: true },
            ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            ON_ACTUAL: {
                role: ['sensor.light', 'switch.light'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'ON',
            },
            TEMPERATURE: {
                role: 'level.color.temperature',
                type: 'number',
                required: true,
                writeable: true,
                trigger: true,
            },
        },
    },
    dimmer: {
        updatedVersion: true,
        name: 'dimmer',
        description: 'Licht ein- / ausschalten und dimmen',
        data: {
            SET: { role: 'level.dimmer', type: 'number', required: true, writeable: true },
            ACTUAL: {
                role: ['value.dimmer', 'level.dimmer'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            ON_SET: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            ON_ACTUAL: {
                role: ['sensor.light', 'switch.light'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'ON_SET',
            },
        },
    },
    door: {
        name: 'door',
        description: '',
        data: {
            ACTUAL: { role: 'sensor.door', type: 'boolean', required: true, writeable: false, trigger: true },
            BUTTONTEXT: { role: ['state', 'text'], type: 'string', required: false, writeable: false, trigger: true },
        },
    },
    gate: {
        name: 'gate',
        description: '',
        data: {
            ACTUAL: { role: 'value.blind', type: 'number', required: false, writeable: false, trigger: true },
            SET: { role: 'switch.gate', type: 'boolean', required: true, writeable: true, trigger: true },
            STOP: { role: 'button.stop', type: 'boolean', required: false, writeable: true, trigger: true },
        },
    },
    hue: {
        updatedVersion: true,
        name: 'hue',
        description: '',
        data: {
            DIMMER: { role: 'level.dimmer', type: 'number', required: true, trigger: true, writeable: true },
            ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            ON_ACTUAL: {
                role: ['sensor.light', 'switch.light'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'ON',
            },
            TEMPERATURE: {
                role: 'level.color.temperature',
                type: 'number',
                required: false,
                writeable: true,
                trigger: true,
            },
            HUE: { role: 'level.color.hue', type: 'number', required: true, writeable: true, trigger: true },
        },
    },
    humidity: {
        updatedVersion: true,
        name: 'humidity',
        description: '',
        data: { ACTUAL: { role: 'value.humidity', type: 'number', required: true, writeable: false, trigger: true } },
    },
    info: {
        updatedVersion: true,
        name: 'info',
        description: 'Universal Datenpunkt für diverse Anwendungen',
        data: {
            ACTUAL: {
                role: 'state',
                type: ['string', 'number', 'boolean', 'mixed'],
                required: true,
                writeable: false,
                useKey: true,
                trigger: true,
            },
            COLORDEC: {
                role: 'value.rgb',
                type: 'number',
                required: false,
                writeable: false,
                useKey: true,
                trigger: true,
            },
            BUTTONTEXT: {
                role: ['text'],
                type: 'string',
                required: false,
                writeable: false,
                useKey: true,
                trigger: true,
            },
            USERICON: { role: 'state', type: 'string', required: false, writeable: false, useKey: true, trigger: true },
        },
    },
    light: {
        updatedVersion: true,
        name: 'light',
        description: 'ein Lichtschalter',
        data: {
            ON_ACTUAL: {
                role: ['sensor.light', 'switch.light'],
                type: 'boolean',
                required: true,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            SET: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            BUTTONTEXT: { role: 'text', type: 'string', required: false, writeable: false, trigger: true },
        },
    },
    lock: {
        name: 'lock',
        description: 'Türschloss',
        data: {
            ACTUAL: {
                role: ['state', 'sensor.lock'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            OPEN: { role: 'button', type: 'boolean', required: false, writeable: true },
            SET: { role: 'switch.lock', type: 'boolean', required: true, writeable: true },
        },
    },
    media: {
        updatedVersion: true,
        name: 'media',
        description: 'Medienwiedergabe (Play, Pause, Stop, Next, Previous)',
        data: {
            STATE: {
                role: 'media.state',
                type: 'boolean',
                required: true,
                writeable: false,
                trigger: true,
                description:
                    'True if playing, false if paused/stopped. If the media device supports more states, use read funtion to convert it to true/false.',
            },
        },
    },
    motion: {
        updatedVersion: true,
        name: 'motion',
        description: 'Status of the motion sensor or presence detector (motion or presence detected)',
        data: { ACTUAL: { role: 'sensor.motion', type: 'boolean', required: true, writeable: false, trigger: true } },
    },
    rgb: {
        updatedVersion: true,
        name: 'rgb',
        description: 'Farblicht mit einzelnen Farbkanälen',
        data: {
            RED: { role: 'level.color.red', type: 'number', required: true, writeable: true, trigger: true },
            GREEN: { role: 'level.color.green', type: 'number', required: true, writeable: true, trigger: true },
            BLUE: { role: 'level.color.blue', type: 'number', required: true, writeable: true, trigger: true },
            ON_ACTUAL: {
                role: ['sensor.light', 'switch.light'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
            },
            ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            DIMMER: { role: 'level.dimmer', type: 'number', required: false, writeable: true, trigger: true },
            TEMPERATURE: {
                role: 'level.color.temperature',
                type: 'number',
                required: false,
                writeable: true,
                trigger: true,
            },
        },
    },
    rgbSingle: {
        updatedVersion: true,
        name: 'rgbSingle',
        description: 'Farblicht ohne Farbkanäle',
        data: {
            RGB: { role: 'level.color.rgb', type: 'string', required: true, writeable: true, trigger: true },
            ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            DIMMER: { role: 'level.dimmer', type: 'number', required: false, writeable: true, trigger: true },
            TEMPERATURE: {
                role: 'level.color.temperature',
                type: 'number',
                required: false,
                writeable: true,
                trigger: true,
            },
            ON_ACTUAL: {
                role: ['sensor.light', 'switch.light'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'ON',
            },
        },
    },
    select: {
        updatedVersion: true,
        name: 'select',
        description: 'Auswahlbox',
        data: {
            ACTUAL: {
                role: ['value.mode.select'],
                type: ['number', 'string'],
                required: true,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            SET: {
                role: 'level.mode.select',
                type: ['number', 'string'],
                required: true,
                writeable: true,
                trigger: true,
            },
        },
    },
    slider: {
        updatedVersion: true,
        name: 'slider',
        description: 'Slider to set a numerical value',
        data: {
            SET: { role: 'level', type: 'number', required: true, writeable: true, useKey: true },
            ACTUAL: {
                role: ['value', 'level'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
                useKey: true,
            },
            SET2: { role: 'level', type: 'number', required: false, writeable: true, useKey: true },
            ACTUAL2: {
                role: ['value', 'level'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET2',
                useKey: true,
            },
            SET3: { role: 'level', type: 'number', required: false, writeable: true, useKey: true },
            ACTUAL3: {
                role: ['value', 'level'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET3',
                useKey: true,
            },
        },
    },
    socket: {
        updatedVersion: true,
        name: 'socket',
        description: 'Steckdosen, Schalter, Relais, usw. alles was man mit true/false steuern kann',
        data: {
            ACTUAL: {
                role: 'sensor.switch',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            SET: { role: 'switch', type: 'boolean', required: true, writeable: true },
            BUTTONTEXT: { role: ['state', 'text'], type: 'string', required: false, writeable: false, trigger: true },
        },
    },
    temperature: {
        updatedVersion: true,
        name: 'temperature',
        description: '',
        data: {
            ACTUAL: { role: 'value.temperature', type: 'number', required: true, writeable: false, trigger: true },
        },
    },
    thermostat: {
        name: 'thermostat',
        description: '',
        data: {
            ACTUAL: {
                role: 'value.temperature',
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            SET: { role: 'level.temperature', type: 'number', required: true, writeable: true },
            MODE: {
                role: 'value.mode.thermostat',
                type: ['number', 'string'],
                required: false,
                writeable: false,
                trigger: true,
                description: `0: OFF, 1: AUTO, 2: COOL, 3: HEAT, 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.  (alternative type: 'string' for direct display) iif missed pick ModeSet -`,
            },
            MODESET: {
                role: 'level.mode.thermostat',
                type: ['number'],
                required: false,
                writeable: true,
                trigger: true,
                description: `0: OFF, 1: COOL, 2: HEAT, 3: AUTO,//soweit eingebaut 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.`,
            },
            BOOST: {
                role: ['switch.mode.boost', 'switch.boost'],
                type: 'boolean',
                required: false,
                writeable: true,
                trigger: true,
            },
            ERROR: {
                role: 'indicator.error',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                description: 'Not supported in cardThermo2',
            },
            LOWBAT: {
                role: 'indicator.maintenance.lowbat',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                description: '',
            },
            UNREACH: {
                role: 'indicator.maintenance.unreach',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                description: '',
            },
            HUMIDITY: { role: 'value.humidity', type: 'number', required: false, writeable: false, trigger: true },
            MAINTAIN: {
                role: 'indicator.maintenance',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                description: 'Not supported in cardThermo2',
            },
            PARTY: {
                role: 'switch.mode.party',
                type: 'boolean',
                required: false,
                trigger: true,
                description: 'Not supported in cardThermo2',
            },
            POWER: { role: 'switch.power', type: 'boolean', required: false, writeable: true, trigger: true },
            VACATION: {
                role: 'state',
                type: 'boolean',
                useKey: true,
                required: false,
                trigger: true,
                description: 'Not supported in cardThermo2',
            },
            WINDOWOPEN: {
                role: ['sensor.window'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
            },
            WORKING: {
                role: 'indicator.working',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                description: 'Not supported in cardThermo2',
            },
            USERICON: {
                role: 'state',
                type: 'string',
                useKey: true,
                required: false,
                writeable: false,
                trigger: true,
                description: 'Not supported in cardThermo2',
            },
        },
    },
    timeTable: {
        updatedVersion: true,
        name: 'timeTable',
        description: 'Time table for the Departure (Fahrplan Adapter)',
        data: {
            noNeed: {
                role: 'state',
                type: 'string',
                required: false,
                description: 'Just use the template for this - ask TT-Tom :)',
            },
        },
    },
    volume: {
        updatedVersion: true,
        name: 'volume',
        description: '',
        data: {
            ACTUAL: {
                role: ['value.volume', 'level.volume'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            SET: { role: 'level.volume', type: 'number', required: true, writeable: true },
            MUTE: { role: 'media.mute', type: 'boolean', required: false, writeable: true, trigger: true },
        },
    },
    warning: {
        name: 'warning',
        description: '',
        data: {
            INFO: { role: 'weather.title', type: 'string', required: true, writeable: false, trigger: true },
            LEVEL: { role: 'value.warning', type: 'number', required: true, writeable: false, trigger: true },
            TITLE: { role: 'weather.title.short', type: 'string', required: true, writeable: false, trigger: true },
        },
    },
    window: {
        updatedVersion: true,
        name: 'window',
        description: '',
        data: {
            ACTUAL: { role: 'sensor.window', type: 'boolean', required: true, writeable: false, trigger: true },
            BUTTONTEXT: { role: ['state', 'text'], type: 'string', required: false, writeable: false },
        },
    },
    'level.mode.fan': {
        name: 'fan',
        description: '',
        data: {
            ACTUAL: {
                role: ['sensor.switch', 'state'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            MODE: { role: 'level.mode.fan', type: 'number', required: false, writeable: true, trigger: true },
            SET: { role: 'switch', type: 'boolean', required: true, writeable: true },
            SPEED: { role: 'level.speed', type: 'number', required: true, writeable: true, trigger: true },
        },
    },
    'level.timer': {
        name: 'level.timer',
        description: 'Ein countdown Timer (intern/extern) oder eine Uhrzeit (extern)',
        data: {
            ACTUAL: {
                role: ['value.timer', 'level.timer', 'date'],
                type: 'number',
                required: false,
                trigger: true,
                writeable: false,
                description: 'Das wird angezeigt - date in hh:mm, timer in mm:ss',
            },
            SET: {
                role: ['level.timer', 'date'],
                type: 'number',
                required: false,
                writeable: true,
                description: 'Hier wird ein geänderter Wert hingeschrieben',
            },
            STATE: {
                role: 'button',
                type: 'boolean',
                required: false,
                writeable: true,
                description: 'wenn die oberen nicht benutzt wird hier getriggert wenn ein interner Timer endet.',
            },
            STATUS: {
                role: 'level.mode',
                type: 'number',
                required: false,
                trigger: true,
                writeable: true,
                description: '0: OFF , 1: PAUSE, 2: ON/RUNNING',
            },
        },
    },
    'sensor.alarm.flood': {
        name: 'sensor.alarm.flood',
        description: 'Sensor für Hochwasser',
        data: {
            ACTUAL: { role: 'sensor.alarm.flood', type: 'boolean', required: true, writeable: false, trigger: true },
        },
    },
    'value.humidity': {
        updatedVersion: true,
        name: 'humidity',
        description: '',
        data: { ACTUAL: { role: 'value.humidity', type: 'number', required: true, writeable: false, trigger: true } },
    },
    'value.temperature': {
        updatedVersion: true,
        name: 'value.temperature',
        description: '',
        data: {
            ACTUAL: { role: 'value.temperature', type: 'number', required: true, writeable: false, trigger: true },
        },
    },
} as const;

export const CHANNEL_ROLES_LIST = Object.keys(requiredScriptDataPoints) as (keyof typeof requiredScriptDataPoints)[];
export type ChannelRole = keyof typeof requiredScriptDataPoints;
export type IconScaleElement = IconColorElement | IconSelectElement;

export type ChannelColorConfig = Pick<AdminPageItemConfig, 'trueColor' | 'falseColor' | 'scale'>;

/** Mode list of a light item (roles rgbSingle, rgb, ct, hue): selection state + selectable entries. */
export type ChannelModeListConfig = Pick<AdminPageItemConfig, 'inSel_Alias' | 'modeList'>;

export type IconSelectElement = {
    valIcon_min: number;
    valIcon_max: number;
    valIcon_best?: number;
};
export type IconColorElement = {
    val_min: number;
    val_max: number;
    val_best?: number;
    /**
     * Optional best-color (nur wirksam, wenn `val_best` gesetzt ist).
     */
    color_best?: RGB;
    /**
     * Color scale mode. Default is 'mixed'.
     * - 'mixed': interpolate linearly between two RGB colors.
     * - 'cie': interpolate using CIE color table.
     * - 'hue': interpolate via hue/saturation/brightness.
     * - 'triGrad': three-color gradient red→yellow→green, ignores custom colors.
     * - 'triGradAnchor': like triGrad but anchors yellow to val_best.
     * - 'quadriGrad': four-color gradient red→yellow→green→blue, ignores custom colors.
     * - 'quadriGradAnchor': like quadriGrad but anchors green to val_best.
     */
    mode?: 'mixed' | 'hue' | 'cie' | 'triGrad' | 'triGradAnchor' | 'quadriGrad' | 'quadriGradAnchor';
    /**
     * Apply logarithmic scaling. Use 'max' or 'min'.
     * Undefined = linear scaling.
     */
    log10?: 'max' | 'min';
};

/**
 * Lightweight type guard for IconColorElement.
 * - Checks presence & finiteness of required numbers.
 * - Optional fields, if present, must be of the right *shape*.
 * - `color_best` may be {r, g, b} or the script form {red, green, blue} - the config manager normalizes it
 *   once (`normalizeIconColorElement`) before the scale reaches the runtime.
 * - No range constraints (val_min may be > val_max).
 *
 * @param x unknown
 * @returns true if x is IconColorElement
 */
export function isIconColorScaleElement(x: unknown): x is IconColorElement {
    if (typeof x !== 'object' || x === null) {
        return false;
    }

    const v = x as Partial<IconColorElement>;

    // required
    if (!Number.isFinite(v.val_min)) {
        return false;
    }
    if (!Number.isFinite(v.val_max)) {
        return false;
    }

    // optional numbers
    if (v.val_best != null && !Number.isFinite(v.val_best)) {
        return false;
    }

    // optional enums
    if (v.log10 != null && v.log10 !== 'max' && v.log10 !== 'min') {
        return false;
    }
    if (
        v.mode != null &&
        v.mode !== 'mixed' &&
        v.mode !== 'hue' &&
        v.mode !== 'cie' &&
        v.mode !== 'triGrad' &&
        v.mode !== 'triGradAnchor' &&
        v.mode !== 'quadriGrad' &&
        v.mode !== 'quadriGradAnchor'
    ) {
        return false;
    }

    // optional color object - admin form {r, g, b} or script form {red, green, blue}
    if (v.color_best != null && !Color.isRGB(v.color_best) && !Color.isScriptRGB(v.color_best)) {
        return false;
    }

    return true;
}

export type PageBaseItemSimple = {
    useColor?: boolean;
    targetPageLongPress?: string;
    longPress?: string;
    interpolateColor?: boolean;
    minValueBrightness?: number;
    maxValueBrightness?: number;
    minValueColorTemp?: number;
    maxValueColorTemp?: number;
    minValueLevel?: number;
    maxValueLevel?: number;
    minValueTilt?: number;
    maxValueTilt?: number;
    minValue?: number;
    maxValue?: number;
    stepValue?: number;
    prefixName?: string;
    suffixName?: string;
    prefixValue?: string;
    suffixValue?: string;
    name?: string;
    secondRow?: string;
    buttonText?: string;
    buttonTextOff?: string;
    unit?: string;
    colormode?: string;
    modeList?: string[];
    hidePassword?: boolean;
    autoCreateALias?: boolean;
    yAxis?: string;
    yAxisTicks?: number[] | string;
    xAxisDecorationId?: string;
    useValue?: boolean;
    monobutton?: boolean;
    inSel_ChoiceState?: boolean; //deprecated
    inSel_Alias?: string;
    iconArray?: string[];
    customIcons?: any[];
    fontSize?: 0 | 1 | 2 | 3 | 4 | 5;
    actionStringArray?: string[];
    alwaysOnDisplay?: boolean;
    useValueConditions?: string | null;
};

export type Beispiel = Pick<PageBaseItemSimple, 'minValue' | 'maxValue' | 'stepValue'>;

/**
 * Action a hardware button of a panel triggers, as the admin stores it in
 * `native.panels[].buttonLeft` / `native.panels[].buttonRight`.
 *
 * It is the serializable form of `ConfigButtonFunction` (`src/lib/types/types.ts`): there the state
 * of a datapoint mode becomes a `Dataitem` once the panel resolved it, here it stays the id of the
 * datapoint. The members mirror that type one by one so an entry can be handed over unchanged.
 *
 * `undefined` (field missing) means "not configured in the admin" - the value of the configuration
 * script keeps its effect. `null` is a configured "no action".
 */
export type AdminButtonFunction =
    | {
          /** navigate to a navigation point of this panel */
          mode: 'page';
          /** name of the navigation point (`cmd.goToNavigationPoint` lists them all) */
          page: string;
      }
    | {
          /** flip a boolean datapoint */
          mode: 'switch';
          /** id of the datapoint */
          state: string;
      }
    | {
          /** set a datapoint to true */
          mode: 'button';
          /** id of the datapoint */
          state: string;
      }
    | {
          /** set a datapoint and flip it back after `delay` seconds */
          mode: 'buttonOnDelayOff' | 'buttonOffDelayOn' | 'buttonDelayOn' | 'buttonDelayOff';
          /** delay in seconds, see `ConfigButtonFunction`; missing = 0.25 s */
          delay?: number;
          /** id of the datapoint */
          state: string;
      }
    | null;

/** Modes of `AdminButtonFunction` in the order the admin dialog offers them. */
export const ADMIN_BUTTON_MODES = [
    'page',
    'switch',
    'button',
    'buttonOnDelayOff',
    'buttonOffDelayOn',
    'buttonDelayOn',
    'buttonDelayOff',
] as const;

/** Mode of a hardware button action. */
export type AdminButtonMode = (typeof ADMIN_BUTTON_MODES)[number];

/** Modes that need a datapoint instead of a page. */
export const ADMIN_BUTTON_STATE_MODES: readonly AdminButtonMode[] = [
    'switch',
    'button',
    'buttonOnDelayOff',
    'buttonOffDelayOn',
    'buttonDelayOn',
    'buttonDelayOff',
];

/** Modes that flip the datapoint back after a delay. */
export const ADMIN_BUTTON_DELAY_MODES: readonly AdminButtonMode[] = [
    'buttonOnDelayOff',
    'buttonOffDelayOn',
    'buttonDelayOn',
    'buttonDelayOff',
];

/** Delay the adapter uses when none is configured, in seconds (`panel.ts`: 250 ms). */
export const ADMIN_BUTTON_DEFAULT_DELAY = 0.25;
/** Smallest delay the adapter accepts, in seconds. */
export const ADMIN_BUTTON_MIN_DELAY = 0.001;
/** Largest delay the adapter accepts, in seconds (2^31-1 ms). */
export const ADMIN_BUTTON_MAX_DELAY = 2_147_483;

/* ---------------------------------------------------------------------------------------------
 * Conversion of a configuration script into the admin configuration (sendTo `convertScriptToAdmin`)
 * ------------------------------------------------------------------------------------------- */

/** sendTo command of the adapter: plan (dryRun) or execute the conversion of a panel's script */
export const SENDTO_CONVERT_SCRIPT_COMMAND = 'convertScriptToAdmin';

/**
 * What happens with a page of the global script whose name exists in the admin with a different content:
 * keepAdmin - the admin entry stays as it is, the panel is assigned to it (default);
 * takeScript - the content of the admin entry is replaced by the global page, every existing assignment stays and
 * the panel is added (this changes the page on the other assigned panels as well);
 * skip - nothing changes, the page stays in the script of this panel.
 */
export type ConvertGlobalDecision = 'keepAdmin' | 'takeScript' | 'skip';

export const CONVERT_GLOBAL_DECISIONS: readonly ConvertGlobalDecision[] = ['keepAdmin', 'takeScript', 'skip'];

/** the default of {@link ConvertGlobalDecision} when the request carries none for a page */
export const CONVERT_GLOBAL_DEFAULT_DECISION: ConvertGlobalDecision = 'keepAdmin';

export type ConvertScriptRequest = {
    panelTopic: string;
    dryRun: boolean;
    /** decisions for the conflicts of the plan (`ConvertScriptPlan.conflicts`), by uniqueName */
    globalDecisions?: Record<string, ConvertGlobalDecision>;
};

/** a page of the global script whose admin entry of the same name differs from it */
export type ConvertGlobalConflict = {
    uniqueName: string;
    /** page type of the script */
    type: string;
    /** card of the existing admin entry */
    card: string;
    /** the decision the plan was made with */
    decision: ConvertGlobalDecision;
    /** topics the existing admin entry is assigned to (`*` = all panels) */
    assignedPanels: string[];
    /** top level fields of the admin entry that differ */
    differences: string[];
};

/** why a page, the screensaver or a button of the script is not converted */
export type ConvertSkipReason =
    | 'unsupportedPageType'
    | 'nameExists'
    | 'itemNotSupported'
    | 'fieldNotSupported'
    | 'adminOnly'
    | 'adminAlreadyNavigated'
    | 'adminEntryMissing'
    | 'screensaverExists'
    | 'screensaverItemNotSupported'
    | 'screensaverEmpty'
    | 'buttonConfigured'
    | 'buttonNotSupported';

/** a page of the script and what the conversion does with it */
export type ConvertPagePlan = {
    uniqueName: string;
    /** page type of the script (`cardGrid`, `cardThermo2`, …) */
    type: string;
    /** card of the admin entry */
    card: string;
    itemCount: number;
    navigation: NavigationLinks;
    /**
     * create - a new admin entry; assignNavigation - the admin entry exists (power/chart), only the navigation of
     * this panel is assigned; removeReference - the script page is a dead reference and is only removed from the script
     */
    action: 'create' | 'assignNavigation' | 'removeReference';
    /**
     * create only: uniqueName of the admin entry when it differs from the script name - the start page
     * `main` is stored as `main_<panel>` with `isMainPage` when the name is taken by another panel's page
     */
    storedAs?: string;
    /** removeReference only: why the script page is a dead reference */
    reason?: Extract<ConvertSkipReason, 'adminOnly' | 'adminAlreadyNavigated'>;
    /** the page comes from the global script (the global script itself is never rewritten) */
    global?: boolean;
    /** create only: items taken over as raw items, see {@link ConvertRawItem} */
    rawItems?: ConvertRawItem[];
    /**
     * create only: positions of the items (e.g. `items[2]`) whose long press was dropped - only the grid pages
     * ({@link longPressCards}) have a long press
     */
    longPressDropped?: string[];
    /**
     * global pages whose name exists in the admin: identical - same content, only the panel is assigned
     * (assignNavigation); keepAdmin / takeScript - the decision on a conflict (assignNavigation / create)
     */
    existing?: 'identical' | 'keepAdmin' | 'takeScript';
};

export type ConvertSkipped = { uniqueName: string; type: string; reason: ConvertSkipReason; detail?: string };

/**
 * an item the admin editor cannot express - it is taken over as raw item (unchanged behavior) instead of
 * keeping the page in the script
 */
export type ConvertRawItem = {
    /** where it stands in the script, e.g. `items[2]` or `left[0]` */
    item: string;
    format: RawItemFormat;
    /** why the editor cannot express it */
    detail: string;
};

export type ConvertScriptPlan = {
    panelTopic: string;
    panelName: string;
    /** id of the script object (`scriptName` of the configuration) */
    scriptId: string;
    scriptFound: boolean;
    pages: ConvertPagePlan[];
    skipped: ConvertSkipped[];
    screensaver?: {
        name: string;
        mode: ScreensaverMode;
        itemCount: number;
        notifyCount: number;
        /** items taken over as raw items, see {@link ConvertRawItem} */
        rawItems?: ConvertRawItem[];
    };
    screensaverSkipped?: { reason: ConvertSkipReason; detail?: string };
    buttons: { left?: AdminButtonFunction; right?: AdminButtonFunction };
    buttonsSkipped: { side: 'left' | 'right'; reason: ConvertSkipReason; detail?: string }[];
    /** pages of the global script that differ from the admin entry of the same name - the user decides */
    conflicts?: ConvertGlobalConflict[];
    /** no page, screensaver or button to convert and nothing to remove from the script */
    nothingToDo: boolean;
};

export type ConvertScriptResult = ConvertScriptPlan & {
    executed: boolean;
    backupId?: string;
    deletedBackups: string[];
    renamedBackups: { from: string; to: string }[];
    scriptRewritten: boolean;
    /** what could not be changed in the script source (left untouched) */
    scriptNotes: string[];
    /** the panel was reloaded in the running adapter (hot reload, no restart) */
    panelReloaded: boolean;
    /**
     * the adapter restarts itself right after this answer: the admin entries are written into the instance
     * object, which the js-controller answers with a restart; the entries are used from that start on
     */
    adapterRestarts: boolean;
    /**
     * the admin entries could not be written into the instance object, but the plan is stored in the meta object
     * (`native.pendingScriptConversion`) and the adapter applies it at its next start
     */
    pendingApplyAtStart?: boolean;
    error?: string;
};
