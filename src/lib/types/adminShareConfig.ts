import type { RGB } from '../const/Color';

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
}

export type NavigationMap = NavigationMapEntry[];

export interface PanelListEntry {
    panelName: string;
    friendlyName: string;
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
    textSize?: 0 | 1 | 2 | 3 | 4 | 5;
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
    /** Native-Modus: Item wird direkt als NSPanel.PageItemDataItemsOptions übergeben */
    useNative?: boolean;
    /** Rohe NSPanel.PageItemDataItemsOptions-Konfiguration (nur wenn useNative=true) */
    native?: any;
    /**
     * cardThermo2 only: 0-based index of the heat circuit the item belongs to, the item is shown
     * while that circuit is selected. Undefined = shown for every circuit. An airCondition channel
     * counts as two circuits (heating and cooling), see the wiki page PageThermo2.
     */
    filter?: number;
};

export type MenuEntry = {
    card: Extract<AdminCardTypes, 'cardGrid' | 'cardGrid2' | 'cardGrid3' | 'cardEntities' | 'cardSchedule'>; // Supported card types - will be extended
    headline: string;
    pageItems: (AdminPageItemConfig | undefined)[];
    scrollPresentation?: 'classic' | 'arrow';
    uniqueName: string;
} & PageConfigBaseFields;

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
} & PageConfigBaseFields;

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
export type PageConfigEntry = QREntry | UnlockEntry | TrashEntry | ChartEntry | MenuEntry | PowerEntry | Thermo2Entry;
export type PageConfig = QREntry | UnlockEntry | TrashEntry | ChartEntry | MenuEntry | PowerEntry | Thermo2Entry;

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
export function isMainPageEntry(entry: PageConfig | PageConfigEntry): boolean {
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
