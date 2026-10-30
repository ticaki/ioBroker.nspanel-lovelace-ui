/**
 * Conversion of a configuration script into the admin configuration (sendTo `convertScriptToAdmin`,
 * work package 1: the pure planning step).
 *
 * The functions here are the inverse of the code that turns admin entries back into the script form at
 * runtime: `convertAdminPageItemToPageItemConfig` (main.ts), `buildThermo2ScriptPage` /
 * `buildThermoScriptPage` / `buildMediaScriptPage` (admin.ts), `buildScreensaverScriptConfig`
 * (admin-screensaver.ts) and
 * `applyAdminButtons` (panel-buttons.ts). Everything those functions cannot produce is reported as not
 * convertible - a page is only converted as a whole, so the panel behaves exactly as before.
 *
 * No I/O happens here: the caller hands in the raw script configuration (`native.scriptConfigRaw`) and
 * the admin tables, and gets back the plan, the entries to create and the cleaned script configuration.
 */
import { isButton } from '../const/config-manager-const';
import { mainPageName } from '../const/default-pages';
import {
    ALL_PANELS_SPECIAL_ID,
    dropScriptNavigation,
    emptyChannelValueConfig,
    findChartEntryForScript,
    findPowerEntryForScript,
    isMainPageEntry,
    isScriptNavigatedChart,
    isScriptNavigatedPower,
    newScreensaverNotifyId,
    normalizeScrollFields,
    screensaverWeatherItemKeys,
    thermo2SortOrders,
    type AdminButtonFunction,
    type AdminPageItemConfig,
    type ChannelValueConfig,
    type ConvertPagePlan,
    type ConvertScriptPlan,
    type ConvertSkipReason,
    type ConvertSkipped,
    CONVERT_GLOBAL_DEFAULT_DECISION,
    type ConvertGlobalConflict,
    type ConvertGlobalDecision,
    type IconColorElement,
    type MediaEntry,
    type MediaToolbarConfig,
    type MediaToolbarItem,
    type MediaVolumePreset,
    type MenuEntry,
    type NavigationLinks,
    type PageConfigEntry,
    type PageScrollFields,
    type ScreensaverEntry,
    type ScreensaverItemConfig,
    type ScreensaverMode,
    type ScreensaverMrIconConfig,
    type ScreensaverNotifyConfig,
    type ScreensaverWeatherItems,
    type ScrollCard,
    type Thermo2CircuitConfig,
    type Thermo2Entry,
    type Thermo2SortOrder,
    type ThermoEntry,
} from '../types/adminShareConfig';
import { isIconColorScaleElement } from '../types/function-and-const';
import { findScreensaverEntry } from './admin-screensaver';
import { mergeGlobalConfig, type GlobalPageSource } from './global-config-merge';

/** the panel entry of the admin (`native.panels[i]`) as far as the conversion needs it */
export type ScriptToAdminPanel = {
    name: string;
    topic: string;
    /** missing = not configured in the admin; `null` = configured "no action" */
    buttonLeft?: AdminButtonFunction;
    buttonRight?: AdminButtonFunction;
};

export type ScriptToAdminInput = {
    /** `native.scriptConfigRaw` entry of the panel */
    raw: ScriptConfig.Config;
    panel: ScriptToAdminPanel;
    pageConfig: readonly PageConfigEntry[];
    screensaverConfig: readonly ScreensaverEntry[];
    screensaverNotify: readonly ScreensaverNotifyConfig[];
    /**
     * `native.weatherEntity` of the instance. When set, the config manager replaces the weather entity of
     * every script with it - the screensaver entry then leaves the field to the global setting as well.
     */
    instanceWeatherEntity?: string;
    /**
     * Screensaver version of the panel (stored state `cmd.screenSaver.layout`). Without it the version is
     * taken from the areas the script uses: left or indicator items need `advanced`, an alternate item
     * `alternate`, everything else `standard`.
     */
    screensaverMode?: ScreensaverMode;
    /** whether the script object exists - filled in by the caller, the planner cannot know */
    scriptFound?: boolean;
    /** id generator for new notifications (tests), default {@link newScreensaverNotifyId} */
    notifyIdFactory?: (existing: readonly ScreensaverNotifyConfig[]) => string;
    /**
     * `native.globalConfigRaw` of the meta object. When it is a global configuration the plan is made on the
     * pages as the runtime merges them for this panel ({@link mergeGlobalConfig}); the global script itself is
     * never rewritten.
     */
    globalConfigRaw?: unknown;
    /** decisions for global pages that differ from the admin entry of the same name, by uniqueName */
    globalDecisions?: Readonly<Record<string, ConvertGlobalDecision>>;
};

export type ScriptToAdminResult = {
    plan: ConvertScriptPlan;
    /** entries to create */
    newPages: PageConfigEntry[];
    /** the complete page configuration after the conversion (creations and assigned navigations applied) */
    updatedPages: PageConfigEntry[];
    screensaverEntry?: ScreensaverEntry;
    /** notifications to add to `native.screensaverNotify` */
    newNotify: ScreensaverNotifyConfig[];
    buttons: { left?: AdminButtonFunction; right?: AdminButtonFunction };
    /** the script configuration without the converted and dead pages, the screensaver emptied, converted buttons null */
    cleanedRaw: ScriptConfig.Config;
    /** uniqueNames the script source has to lose (create, assignNavigation and removeReference) */
    removedFromScript: string[];
    clearScreensaverInScript: boolean;
    clearButtonsInScript: ('left' | 'right')[];
};

/** thrown inside the converters, caught per page / screensaver / button */
class ConvertError extends Error {
    constructor(
        readonly reason: ConvertSkipReason,
        readonly detail: string,
    ) {
        super(`${reason}: ${detail}`);
    }
}

type Dict = Record<string, unknown>;

/**
 * Whether a value is a plain object (not null, not an array).
 *
 * @param value Any value.
 */
function isDict(value: unknown): value is Dict {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Rejects keys of an object that are neither mapped nor known to be without effect.
 *
 * @param obj Object of the script.
 * @param mapped Keys the admin can express.
 * @param ignored Keys the adapter never reads (dropped without notice).
 * @param reason Reason to report.
 * @param where Prefix of the detail, e.g. `items[2]`.
 */
function rejectUnknownKeys(
    obj: Dict,
    mapped: readonly string[],
    ignored: readonly string[],
    reason: ConvertSkipReason,
    where: string,
): void {
    for (const key of Object.keys(obj)) {
        if (obj[key] === undefined || mapped.includes(key) || ignored.includes(key)) {
            continue;
        }
        throw new ConvertError(reason, `${where}.${key}: not available in the admin`);
    }
}

/**
 * The RGB object of the script as `#rrggbb`; undefined for a missing value.
 *
 * @param value Value of the script.
 * @param reason Reason to report when it is no RGB object.
 * @param where Field name for the detail.
 */
function rgbToHex(value: unknown, reason: ConvertSkipReason, where: string): string | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (isDict(value)) {
        const parts = [value.red, value.green, value.blue];
        if (parts.every(p => typeof p === 'number' && Number.isInteger(p) && p >= 0 && p <= 255)) {
            return `#${parts.map(p => (p as number).toString(16).padStart(2, '0')).join('')}`;
        }
    }
    throw new ConvertError(reason, `${where}: only an RGB object {red, green, blue} can be converted`);
}

/**
 * A string field of the script; undefined stays undefined.
 *
 * @param value Value of the script.
 * @param reason Reason to report for another type.
 * @param where Field name for the detail.
 */
function str(value: unknown, reason: ConvertSkipReason, where: string): string | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== 'string') {
        throw new ConvertError(reason, `${where}: expected a text`);
    }
    return value;
}

/**
 * A text the admin builders trim: it has to be already trimmed, otherwise the panel would show something
 * else. Empty text counts as missing (the builders leave it out as well).
 *
 * @param value Value of the script.
 * @param reason Reason to report.
 * @param where Field name for the detail.
 */
function trimmedText(value: unknown, reason: ConvertSkipReason, where: string): string | undefined {
    const text = str(value, reason, where);
    if (text === undefined || text === '') {
        return undefined;
    }
    if (text.trim() !== text) {
        throw new ConvertError(reason, `${where}: the admin trims the text`);
    }
    return text;
}

/**
 * A number field of the script; undefined / null stay undefined.
 *
 * @param value Value of the script.
 * @param reason Reason to report for another type.
 * @param where Field name for the detail.
 */
function num(value: unknown, reason: ConvertSkipReason, where: string): number | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new ConvertError(reason, `${where}: expected a number`);
    }
    return value;
}

/**
 * A boolean field of the script; undefined / null stay undefined.
 *
 * @param value Value of the script.
 * @param reason Reason to report for another type.
 * @param where Field name for the detail.
 */
function bool(value: unknown, reason: ConvertSkipReason, where: string): boolean | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== 'boolean') {
        throw new ConvertError(reason, `${where}: expected true or false`);
    }
    return value;
}

/**
 * The color scale of a script item as the admin stores it (`color_best` as {r,g,b}).
 *
 * @param value Value of the script.
 * @param reason Reason to report.
 * @param where Field name for the detail.
 */
function colorScaleToAdmin(value: unknown, reason: ConvertSkipReason, where: string): IconColorElement | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    const scale = isDict(value) ? { ...value } : value;
    const best = isDict(scale) ? scale.color_best : undefined;
    if (isDict(scale)) {
        delete scale.color_best;
    }
    if (!isIconColorScaleElement(scale)) {
        throw new ConvertError(reason, `${where}: only a color scale {val_min, val_max, ...} can be converted`);
    }
    if (best === undefined || best === null) {
        return scale;
    }
    const hex = rgbToHex(best, reason, `${where}.color_best`) ?? '#000000';
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return { ...scale, color_best: { r, g, b } };
}

/**
 * Whether a text looks like the id of a state - the script path would read the state while the admin
 * stores a constant.
 *
 * @param text Text of the script.
 */
function looksLikeStateId(text: string): boolean {
    if (text === '///timeString') {
        // the data item resolves this constant to the internal state on both paths
        return false;
    }
    return text.startsWith('///') || /^[a-zA-Z0-9_-]+\.\d+\./.test(text);
}

/* ---------------------------------------------------------------------------------------------
 * page items
 * ------------------------------------------------------------------------------------------- */

/** fields of a script page item `convertAdminPageItemToPageItemConfig` produces */
const itemMappedKeys = [
    'navigate',
    'targetPage',
    'id',
    'type',
    'icon',
    'icon2',
    'onColor',
    'offColor',
    'colorScale',
    'targetPageLongPress',
    'longPress',
    'prefixName',
    'suffixName',
    'prefixValue',
    'suffixValue',
    'name',
    'unit',
    'modeList',
    'useValue',
    'inSel_Alias',
    'fontSize',
    'filter',
    'useValueConditions',
    'minValue',
    'maxValue',
    'secondRow',
    'minValueBrightness',
    'maxValueBrightness',
    'minValueColorTemp',
    'maxValueColorTemp',
    'colormode',
] as const;

/** fields of a script page item the config manager never reads - dropping them changes nothing */
const itemIgnoredKeys = [
    'uniqueName',
    'popupVersion',
    'useColor',
    'interpolateColor',
    'hidePassword',
    'autoCreateALias',
    'yAxis',
    'yAxisTicks',
    'xAxisDecorationId',
    'monobutton',
    'inSel_ChoiceState',
    'iconArray',
    'customIcons',
    'actionStringArray',
    'shutterType',
    'alwaysOnDisplay',
] as const;

/** fields of a custom item (`type: 'custom'`) the admin passes on */
const customItemMappedKeys = [
    'type',
    'id',
    'navigate',
    'targetPage',
    'targetPageLongPress',
    'longPress',
    'icon',
    'icon2',
    'name',
    'onColor',
    'offColor',
    'colorScale',
] as const;

/**
 * Whether a script item stands for an empty place (`id: 'empty'` / `'delete'` without navigation).
 *
 * @param item Item of the script.
 */
function isEmptyPlace(item: Dict): boolean {
    return !item.navigate && !('native' in item) && (item.id === 'empty' || item.id === 'delete');
}

/**
 * One page item of the script as the admin stores it - the exact inverse of
 * `convertAdminPageItemToPageItemConfig` (main.ts).
 *
 * @param item Item of the script.
 * @param where Prefix for the detail, e.g. `items[2]`.
 */
function convertPageItem(item: Dict, where: string): AdminPageItemConfig {
    const reason: ConvertSkipReason = 'itemNotSupported';
    if ('native' in item) {
        throw new ConvertError(reason, `${where}: native item`);
    }
    const custom = item.type === 'custom';
    if (item.type !== undefined && item.type !== null && !custom) {
        throw new ConvertError(reason, `${where}.type: unknown type`);
    }
    if (custom) {
        rejectUnknownKeys(item, customItemMappedKeys, [], reason, where);
    } else {
        rejectUnknownKeys(item, itemMappedKeys, itemIgnoredKeys, reason, where);
    }

    const id = str(item.id, reason, `${where}.id`);
    const navigate = item.navigate === true;
    if (item.navigate !== undefined && item.navigate !== null && typeof item.navigate !== 'boolean') {
        throw new ConvertError(reason, `${where}.navigate: expected true or false`);
    }
    const targetPage = str(item.targetPage, reason, `${where}.targetPage`);
    if (navigate && !targetPage) {
        throw new ConvertError(reason, `${where}: navigate without targetPage`);
    }
    if (!navigate && targetPage) {
        throw new ConvertError(reason, `${where}.targetPage: only used with navigate: true`);
    }
    if (!navigate && !id) {
        throw new ConvertError(reason, `${where}: id missing`);
    }
    if (!id && custom) {
        throw new ConvertError(reason, `${where}: id missing`);
    }

    const channelId: ChannelValueConfig = {
        valueStateId: id ?? '',
        unit: '',
        prefix: '',
        suffix: '',
        dateFormat: '',
    };
    const admin: AdminPageItemConfig = { channelId };
    if (navigate) {
        admin.isNavigation = true;
        admin.targetPage = targetPage;
    }
    if (custom) {
        admin.type = 'custom';
    }
    const icon = str(item.icon, reason, `${where}.icon`);
    if (icon !== undefined) {
        admin.trueIcon = icon;
    }
    const icon2 = str(item.icon2, reason, `${where}.icon2`);
    if (icon2 !== undefined) {
        admin.falseIcon = icon2;
    }
    const onColor = rgbToHex(item.onColor, reason, `${where}.onColor`);
    if (onColor !== undefined) {
        admin.trueColor = onColor;
    }
    const offColor = rgbToHex(item.offColor, reason, `${where}.offColor`);
    if (offColor !== undefined) {
        admin.falseColor = offColor;
    }
    const longPress = str(item.longPress, reason, `${where}.longPress`);
    if (longPress !== undefined) {
        admin.longPress = longPress;
    }
    const targetPageLongPress = str(item.targetPageLongPress, reason, `${where}.targetPageLongPress`);
    if (targetPageLongPress !== undefined) {
        admin.targetPageLongPress = targetPageLongPress;
    }
    const scale = colorScaleToAdmin(item.colorScale, reason, `${where}.colorScale`);
    if (scale !== undefined) {
        admin.scale = scale;
    }
    const name = str(item.name, reason, `${where}.name`);
    if (custom) {
        if (name !== undefined) {
            admin.name = name;
        }
        return admin;
    }

    const prefixName = str(item.prefixName, reason, `${where}.prefixName`);
    const suffixName = str(item.suffixName, reason, `${where}.suffixName`);
    if (prefixName || suffixName) {
        // the admin carries prefix and suffix of the name in the value entry - its state id becomes the name
        admin.valueEntry = {
            valueStateId: name ?? '',
            unit: '',
            prefix: prefixName ?? '',
            suffix: suffixName ?? '',
            dateFormat: '',
        };
    } else if (name !== undefined) {
        admin.name = name;
    }
    // prefix and suffix of the value: convertAdminPageItemToPageItemConfig maps channelId.prefix to prefixValue
    // and channelId.suffix to suffixValue
    channelId.prefix = str(item.prefixValue, reason, `${where}.prefixValue`) ?? '';
    channelId.suffix = str(item.suffixValue, reason, `${where}.suffixValue`) ?? '';
    channelId.unit = str(item.unit, reason, `${where}.unit`) ?? '';

    const fontSize = num(item.fontSize, reason, `${where}.fontSize`);
    if (fontSize !== undefined) {
        if (![0, 1, 2, 3, 4, 5].includes(fontSize)) {
            throw new ConvertError(reason, `${where}.fontSize: expected 0 to 5`);
        }
        admin.textSize = fontSize as AdminPageItemConfig['textSize'];
    }
    const useValue = bool(item.useValue, reason, `${where}.useValue`);
    if (useValue !== undefined) {
        admin.useValue = useValue;
    }
    const inSel = str(item.inSel_Alias, reason, `${where}.inSel_Alias`);
    if (inSel !== undefined) {
        admin.inSel_Alias = inSel;
    }
    if (item.modeList !== undefined && item.modeList !== null) {
        const list = item.modeList;
        if (!Array.isArray(list) || list.length === 0 || !list.every(m => typeof m === 'string')) {
            throw new ConvertError(reason, `${where}.modeList: expected a list of texts with at least one entry`);
        }
        admin.modeList = [...list];
    }
    const filter = num(item.filter, reason, `${where}.filter`);
    if (filter !== undefined) {
        admin.filter = filter;
    }
    // an empty condition is dropped: the admin path hands an empty text to the config manager as undefined
    const useValueConditions = str(item.useValueConditions, reason, `${where}.useValueConditions`);
    if (useValueConditions) {
        admin.useValueConditions = useValueConditions;
    }
    // the config manager reads both for role volume only - kept for every item like the admin path does
    const minValue = num(item.minValue, reason, `${where}.minValue`);
    if (minValue !== undefined) {
        admin.minValue = minValue;
    }
    const maxValue = num(item.maxValue, reason, `${where}.maxValue`);
    if (maxValue !== undefined) {
        admin.maxValue = maxValue;
    }
    // role blind: second text row - the config manager shows '' for a missing one, so '' is dropped
    const secondRow = str(item.secondRow, reason, `${where}.secondRow`);
    if (secondRow) {
        admin.secondRow = secondRow;
    }
    // light ranges (dimmer, ct, rgb, rgbSingle, hue): the config manager takes them only when truthy, so 0
    // means "not set" there - it is dropped without a word, the panel stays the same
    for (const key of ['minValueBrightness', 'maxValueBrightness', 'minValueColorTemp', 'maxValueColorTemp'] as const) {
        const value = num(item[key], reason, `${where}.${key}`);
        if (value) {
            admin[key] = value;
        }
    }
    // the config manager only asks whether colormode is set at all (`!!item.colormode`) - 'rgb' and 'xy'
    // both switch the color mode on
    if (item.colormode) {
        admin.colormode = true;
    }
    return admin;
}

/**
 * Whether an admin item stands for an empty place (the explicit form a trailing empty place of the script
 * keeps, see {@link convertPageItems}).
 *
 * @param item Item of the admin.
 */
function isEmptyAdminItem(item: AdminPageItemConfig): boolean {
    const id = item.channelId.valueStateId;
    return !item.isNavigation && !item.useNative && (id === 'empty' || id === 'delete');
}

/**
 * Whether a script item is dropped by the config manager without taking a place: no id, no navigation
 * and no native configuration (`getPageItemConfig` returns no item for it).
 *
 * @param item Item of the script.
 */
function isDroppedItem(item: Dict): boolean {
    return !item.navigate && !('native' in item) && item.type !== 'custom' && !item.id;
}

/**
 * The page items of a script page as the admin stores them.
 *
 * A `null` item of the script and an item without id and navigation are dropped - the config manager
 * skips them, they take no place on the panel. `id: 'empty'` becomes an empty place (undefined); at the
 * end of the list the admin drops empty places, so a trailing one stays an explicit item with the id
 * `empty`.
 *
 * @param items Items of the script page.
 */
function convertPageItems(items: unknown): (AdminPageItemConfig | undefined)[] {
    if (items === undefined || items === null) {
        return [];
    }
    if (!Array.isArray(items)) {
        throw new ConvertError('fieldNotSupported', 'items: expected a list');
    }
    const out: (AdminPageItemConfig | undefined)[] = [];
    items.forEach((item: unknown, index) => {
        if (item === null || item === undefined) {
            return;
        }
        if (!isDict(item)) {
            throw new ConvertError('itemNotSupported', `items[${index}]: expected an object`);
        }
        if (isEmptyPlace(item)) {
            out.push(undefined);
            return;
        }
        if (isDroppedItem(item)) {
            return;
        }
        out.push(convertPageItem(item, `items[${index}]`));
    });
    for (let i = out.length - 1; i >= 0 && out[i] === undefined; i--) {
        out[i] = { channelId: emptyChannelValueConfig('empty') };
    }
    return out;
}

/* ---------------------------------------------------------------------------------------------
 * pages
 * ------------------------------------------------------------------------------------------- */

const pageMappedKeys = [
    'type',
    'uniqueName',
    'heading',
    'items',
    'prev',
    'next',
    'home',
    'parent',
    'hiddenByTrigger',
    'alwaysOnDisplay',
] as const;
/**
 * fields of a script page the config manager does not read - the navigation icons and their colors
 * among them: the arrows come from the navigation class on both paths
 */
const pageIgnoredKeys = [
    'useColor',
    'subPage',
    'filterType',
    'prevIcon',
    'prevIconColor',
    'nextIcon',
    'nextIconColor',
    'homeIcon',
    'homeIconColor',
    'parentIcon',
    'parentIconColor',
] as const;
const scrollKeys = ['scrollType', 'scrollPresentation', 'scrollAutoTiming'] as const;

type PageCommon = {
    uniqueName: string;
    headline: string;
    hidden: boolean;
    alwaysOn: 'none' | 'always' | 'action';
    navigation: NavigationLinks;
};

/**
 * Whether an admin entry creates a page for the panel (`createPagesFromConfig`): an assignment for the
 * topic counts, or one for all panels unless the topic is excluded from it.
 *
 * @param entry Admin entry.
 * @param topic Topic of the panel.
 */
function entryCoversPanel(entry: PageConfigEntry, topic: string): boolean {
    const assignments = entry.navigationAssignment ?? [];
    const all = assignments.find(a => a.topic === ALL_PANELS_SPECIAL_ID);
    const own = assignments.find(a => a.topic === topic);
    if (own) {
        return !(!own.navigation && all);
    }
    return !!all;
}

/**
 * The navigation of a script page in the admin form.
 *
 * A sub page carries its links itself; without any link the config manager gives it `home: main`. A
 * page of `pages` gets its links from its position in the ring the config manager builds from the order
 * of the list - its own link fields are ignored there; those links are filled in once every page of
 * `pages` is classified ({@link ringLinks}), here they stay empty.
 *
 * @param page Page of the script.
 * @param isSub The page comes from `subPages`.
 */
function pageNavigation(page: Dict, isSub: boolean): NavigationLinks {
    const reason: ConvertSkipReason = 'fieldNotSupported';
    if (!isSub) {
        return {};
    }
    const links: NavigationLinks = {};
    for (const key of ['prev', 'next', 'home', 'parent'] as const) {
        const value = str(page[key], reason, key);
        if (value) {
            links[key] = value;
        }
    }
    // the config manager takes `prev || parent` for the left and `next || home` for the right button -
    // with a single-press link the double-press link of the same side has no effect
    if (links.prev) {
        delete links.parent;
    }
    if (links.next) {
        delete links.home;
    }
    if (!links.prev && !links.next && !links.home && !links.parent) {
        links.home = mainPageName;
    }
    return links;
}

/**
 * The links of a converted page of `pages`, taken from the ring the config manager built: the
 * surviving predecessor as `prev` - the admin splices the page after it and the successor's `prev`
 * closes the chain - and the surviving successor as `next` only when that successor stays in the
 * script: the script ring no longer knows the converted page, so the link forward has to be stated.
 * A successor that is converted as well names the page as its `prev` itself; stating `next` there
 * would break the chains of existing admin pages hooked between the two (`applyPendingNavigations`
 * keeps an explicit `next` over the chain order). Without a start page in the script the first page
 * follows the default `main` of the adapter.
 *
 * @param name Page of `pages`.
 * @param ring Surviving pages of `pages` in navigation order (`main` first).
 * @param staysInScript Whether a page of the ring stays in the script after the conversion.
 */
function ringLinks(name: string, ring: readonly string[], staysInScript: (name: string) => boolean): NavigationLinks {
    const index = ring.indexOf(name);
    const links: NavigationLinks = {};
    if (index > 0) {
        links.prev = ring[index - 1];
    } else if (index === 0 && !ring.includes(mainPageName)) {
        // a script without start page: the adapter puts its default `main` in front of the ring
        // (ensureMainPage) - the first page has to stay behind it
        links.prev = mainPageName;
    }
    const next = index === -1 ? undefined : ring[index + 1];
    if (next !== undefined && staysInScript(next)) {
        links.next = next;
    }
    return links;
}

/**
 * The fields every convertible script page shares, checked and converted.
 *
 * @param page Page of the script.
 * @param isSub The page comes from `subPages`.
 */
function pageCommon(page: Dict, isSub: boolean): PageCommon {
    const reason: ConvertSkipReason = 'fieldNotSupported';
    const uniqueName = String(page.uniqueName);
    let heading = str(page.heading, reason, 'heading') ?? '';
    if (!heading) {
        if (page.type !== 'cardThermo') {
            throw new ConvertError(reason, 'heading: empty - the admin shows the uniqueName instead');
        }
        // the config manager shows `thermostat` on a cardThermo without heading - the admin entry says so
        heading = 'thermostat';
    }
    if (looksLikeStateId(heading)) {
        throw new ConvertError(reason, 'heading: looks like a state id - the admin shows the text itself');
    }
    const hidden = bool(page.hiddenByTrigger, reason, 'hiddenByTrigger') ?? false;
    let alwaysOn: PageCommon['alwaysOn'] = 'none';
    const aod = page.alwaysOnDisplay;
    if (aod === true) {
        alwaysOn = 'always';
    } else if (aod === 'action') {
        alwaysOn = 'action';
    } else if (aod !== undefined && aod !== null && aod !== false) {
        throw new ConvertError(reason, 'alwaysOnDisplay: expected true, false or action');
    }
    return { uniqueName, headline: heading, hidden, alwaysOn, navigation: pageNavigation(page, isSub) };
}

/**
 * The scroll fields of a script page as the admin stores them - the admin normalizes them per card, so
 * values the card cannot take would change the behaviour and are rejected.
 *
 * @param page Page of the script.
 * @param card Card of the admin entry.
 */
function scrollFields(page: Dict, card: ScrollCard): PageScrollFields {
    const reason: ConvertSkipReason = 'fieldNotSupported';
    const fields: PageScrollFields = {};
    const type = page.scrollType;
    if (type !== undefined && type !== null) {
        if (type !== 'page' && type !== 'half') {
            throw new ConvertError(reason, 'scrollType: expected page or half');
        }
        fields.scrollType = type;
    }
    const presentation = page.scrollPresentation;
    if (presentation !== undefined && presentation !== null) {
        if (presentation !== 'classic' && presentation !== 'arrow' && presentation !== 'auto') {
            throw new ConvertError(reason, 'scrollPresentation: expected classic, arrow or auto');
        }
        fields.scrollPresentation = presentation;
    }
    const timing = num(page.scrollAutoTiming, reason, 'scrollAutoTiming');
    if (timing !== undefined && fields.scrollPresentation === 'auto') {
        fields.scrollAutoTiming = timing;
    }
    // what the config manager makes of the script page
    const scriptType = fields.scrollType ?? 'page';
    const scriptPresentation = fields.scrollPresentation ?? 'classic';
    const scriptTiming = scriptPresentation === 'auto' ? fields.scrollAutoTiming || 15 : undefined;
    const admin = normalizeScrollFields(fields, card);
    if (admin.scrollType !== scriptType) {
        throw new ConvertError(reason, `scrollType: ${scriptType} is not available for ${card} in the admin`);
    }
    if (admin.scrollPresentation !== scriptPresentation) {
        throw new ConvertError(reason, `scrollPresentation: ${scriptPresentation} is not available in the admin`);
    }
    if (admin.scrollPresentation === 'auto' && admin.scrollAutoTiming !== scriptTiming) {
        throw new ConvertError(reason, `scrollAutoTiming: ${String(scriptTiming)} is not available in the admin`);
    }
    return fields;
}

/**
 * Admin entry of a menu page (cardGrid, cardGrid2, cardGrid3, cardEntities, cardSchedule).
 *
 * @param page Page of the script.
 * @param common Converted common fields.
 * @param topic Topic of the panel.
 */
function convertMenuPage(page: Dict, common: PageCommon, topic: string): MenuEntry {
    rejectUnknownKeys(page, [...pageMappedKeys, ...scrollKeys], pageIgnoredKeys, 'fieldNotSupported', 'page');
    const card = page.type as MenuEntry['card'];
    return {
        card,
        uniqueName: common.uniqueName,
        headline: common.headline,
        pageItems: convertPageItems(page.items),
        hidden: common.hidden,
        alwaysOn: common.alwaysOn,
        ...scrollFields(page, card),
        navigationAssignment: [{ topic, navigation: common.navigation }],
    };
}

const thermo2CommonKeys = [
    'name',
    'minValue',
    'maxValue',
    'stepValue',
    'icon',
    'onColor',
    'unit',
    'icon2',
    'onColor2',
    'unit2',
    'iconHeatCycle',
    'iconHeatCycleOnColor',
    'iconHeatCycleOffColor',
    'modeList',
    'power',
] as const;
const thermo2AliasKeys = ['id', 'name2', 'iconHeatCycle2', 'iconHeatCycleOnColor2', 'iconHeatCycleOffColor2'] as const;
const thermo2StateKeys = ['set', 'thermoId1', 'thermoId2', 'modeId'] as const;

/**
 * A limit of a heat circuit: the admin only passes positive numbers on, anything else becomes the
 * adapter default.
 *
 * @param value Value of the script.
 * @param where Field name for the detail.
 */
function thermo2LimitOf(value: unknown, where: string): number | undefined {
    const n = num(value, 'fieldNotSupported', where);
    if (n !== undefined && n <= 0) {
        throw new ConvertError('fieldNotSupported', `${where}: the admin only takes positive numbers`);
    }
    return n;
}

/**
 * One heat circuit of a script cardThermo2 page as the admin stores it - inverse of the circuit part of
 * `buildThermo2ScriptPage` (admin.ts).
 *
 * @param item Circuit of the script.
 * @param where Prefix for the detail.
 */
function convertThermo2Circuit(item: Dict, where: string): Thermo2CircuitConfig {
    const reason: ConvertSkipReason = 'fieldNotSupported';
    const alias = 'id' in item && item.id !== undefined;
    rejectUnknownKeys(
        item,
        [...thermo2CommonKeys, ...(alias ? thermo2AliasKeys : thermo2StateKeys)],
        [],
        reason,
        where,
    );
    const power = str(item.power, reason, `${where}.power`);
    if (power) {
        throw new ConvertError(reason, `${where}.power: the admin has no power state`);
    }
    const circuit: Thermo2CircuitConfig = { channelId: '' };
    const set = (key: keyof Thermo2CircuitConfig, value: string | number | undefined): void => {
        if (value !== undefined) {
            (circuit as Record<string, unknown>)[key] = value;
        }
    };
    set('name', trimmedText(item.name, reason, `${where}.name`));
    set('minValue', thermo2LimitOf(item.minValue, `${where}.minValue`));
    set('maxValue', thermo2LimitOf(item.maxValue, `${where}.maxValue`));
    set('stepValue', thermo2LimitOf(item.stepValue, `${where}.stepValue`));
    set('icon', trimmedText(item.icon, reason, `${where}.icon`));
    set('onColor', rgbToHex(item.onColor, reason, `${where}.onColor`));
    set('unit', trimmedText(item.unit, reason, `${where}.unit`));
    set('icon2', trimmedText(item.icon2, reason, `${where}.icon2`));
    set('onColor2', rgbToHex(item.onColor2, reason, `${where}.onColor2`));
    set('unit2', trimmedText(item.unit2, reason, `${where}.unit2`));
    set('iconHeatCycle', trimmedText(item.iconHeatCycle, reason, `${where}.iconHeatCycle`));
    set('iconHeatCycleOnColor', rgbToHex(item.iconHeatCycleOnColor, reason, `${where}.iconHeatCycleOnColor`));
    set('iconHeatCycleOffColor', rgbToHex(item.iconHeatCycleOffColor, reason, `${where}.iconHeatCycleOffColor`));
    if (item.modeList !== undefined && item.modeList !== null) {
        const list = item.modeList;
        if (
            !Array.isArray(list) ||
            list.length === 0 ||
            !list.every(m => typeof m === 'string' && m.trim() === m && m !== '')
        ) {
            throw new ConvertError(reason, `${where}.modeList: expected trimmed texts with at least one entry`);
        }
        circuit.modeList = [...(list as string[])];
    }
    if (alias) {
        const id = trimmedText(item.id, reason, `${where}.id`);
        if (!id) {
            throw new ConvertError(reason, `${where}.id: empty`);
        }
        circuit.source = 'alias';
        circuit.channelId = id;
        set('name2', trimmedText(item.name2, reason, `${where}.name2`));
        set('iconHeatCycle2', trimmedText(item.iconHeatCycle2, reason, `${where}.iconHeatCycle2`));
        set('iconHeatCycleOnColor2', rgbToHex(item.iconHeatCycleOnColor2, reason, `${where}.iconHeatCycleOnColor2`));
        set('iconHeatCycleOffColor2', rgbToHex(item.iconHeatCycleOffColor2, reason, `${where}.iconHeatCycleOffColor2`));
        return circuit;
    }
    const setState = trimmedText(item.set, reason, `${where}.set`);
    const actual = trimmedText(item.thermoId1, reason, `${where}.thermoId1`);
    if (!setState || !actual) {
        throw new ConvertError(reason, `${where}: set and thermoId1 are required`);
    }
    circuit.source = 'states';
    circuit.setState = setState;
    circuit.actualState = actual;
    set('humidityState', trimmedText(item.thermoId2, reason, `${where}.thermoId2`));
    set('modeState', trimmedText(item.modeId, reason, `${where}.modeId`));
    return circuit;
}

/**
 * Admin entry of a cardThermo2 page - inverse of `buildThermo2ScriptPage` (admin.ts).
 *
 * @param page Page of the script.
 * @param common Converted common fields.
 * @param topic Topic of the panel.
 */
function convertThermo2Page(page: Dict, common: PageCommon, topic: string): Thermo2Entry {
    const reason: ConvertSkipReason = 'fieldNotSupported';
    rejectUnknownKeys(
        page,
        [...pageMappedKeys, ...scrollKeys, 'thermoItems', 'sortOrder'],
        pageIgnoredKeys,
        reason,
        'page',
    );
    const items = page.thermoItems;
    if (!Array.isArray(items)) {
        throw new ConvertError(reason, 'thermoItems: expected a list');
    }
    const thermoItems: Thermo2CircuitConfig[] = [];
    items.forEach((item: unknown, index) => {
        if (item === null || item === undefined) {
            // the config manager logs the gap and skips it, the admin builder skips it as well
            return;
        }
        if (!isDict(item)) {
            throw new ConvertError(reason, `thermoItems[${index}]: expected an object`);
        }
        thermoItems.push(convertThermo2Circuit(item, `thermoItems[${index}]`));
    });
    const sortOrder = page.sortOrder;
    if (sortOrder !== undefined && sortOrder !== null && !thermo2SortOrders.includes(sortOrder as Thermo2SortOrder)) {
        throw new ConvertError(reason, 'sortOrder: unknown value');
    }
    const entry: Thermo2Entry = {
        card: 'cardThermo2',
        uniqueName: common.uniqueName,
        headline: common.headline,
        thermoItems,
        pageItems: convertPageItems(page.items),
        hidden: common.hidden,
        alwaysOn: common.alwaysOn,
        ...scrollFields(page, 'cardThermo2'),
        navigationAssignment: [{ topic, navigation: common.navigation }],
    };
    if (sortOrder !== undefined && sortOrder !== null) {
        entry.sortOrder = sortOrder as Thermo2SortOrder;
    }
    return entry;
}

/**
 * Admin entry of a classic cardThermo page - inverse of `buildThermoScriptPage` (admin.ts).
 *
 * The adapter reads only `heading` and, of `items[0]`, `id`, `unit`, `minValue`, `maxValue` and
 * `stepValue` (`ConfigManager.getPageThermo`). Every other field of the item (`popupThermoMode1..3`,
 * `popUpThermoName`, `setThermoAlias`, icons, colors, ...) and every further item are dropped without
 * notice - the panel never saw them. The page is skipped only when the admin entry would build another
 * page: no item, an item without a state id (or a navigation / native item), a unit that is no text or
 * empty, a limit that is no number.
 *
 * @param page Page of the script.
 * @param common Converted common fields.
 * @param topic Topic of the panel.
 */
function convertThermoPage(page: Dict, common: PageCommon, topic: string): ThermoEntry {
    const reason: ConvertSkipReason = 'fieldNotSupported';
    rejectUnknownKeys(page, pageMappedKeys, pageIgnoredKeys, reason, 'page');
    const items = page.items;
    if (!Array.isArray(items) || items.length === 0) {
        throw new ConvertError(reason, 'items: expected a list with the thermostat as first entry');
    }
    const item: unknown = items[0];
    if (!isDict(item)) {
        throw new ConvertError(reason, 'items[0]: expected an object');
    }
    if (item.native !== undefined && item.native !== null) {
        throw new ConvertError(reason, 'items[0]: native item');
    }
    if (item.navigate === true) {
        throw new ConvertError(reason, 'items[0].navigate: the thermostat page has no navigation item');
    }
    const id = trimmedText(item.id, reason, 'items[0].id');
    if (!id) {
        throw new ConvertError(reason, 'items[0].id: missing');
    }
    const unit = trimmedText(item.unit, reason, 'items[0].unit');
    if (item.unit !== undefined && item.unit !== null && !unit) {
        throw new ConvertError(reason, 'items[0].unit: empty - the admin shows the unit of the state instead');
    }
    const entry: ThermoEntry = {
        card: 'cardThermo',
        uniqueName: common.uniqueName,
        headline: common.headline,
        channelId: id,
        hidden: common.hidden,
        alwaysOn: common.alwaysOn,
        navigationAssignment: [{ topic, navigation: common.navigation }],
    };
    if (unit !== undefined) {
        entry.unit = unit;
    }
    const minValue = num(item.minValue, reason, 'items[0].minValue');
    if (minValue !== undefined) {
        entry.minValue = minValue;
    }
    const maxValue = num(item.maxValue, reason, 'items[0].maxValue');
    if (maxValue !== undefined) {
        entry.maxValue = maxValue;
    }
    const stepValue = num(item.stepValue, reason, 'items[0].stepValue');
    if (stepValue !== undefined) {
        entry.stepValue = stepValue;
    }
    return entry;
}

const mediaMappedKeys = [
    'id',
    'name',
    'colorMediaIcon',
    'colorMediaArtist',
    'colorMediaTitle',
    'speakerList',
    'volumePresets',
    'favoriteList',
    'playList',
    'minValue',
    'maxValue',
    'itemsColorOn',
    'itemsColorOff',
    'deactivateDefaultItems',
] as const;
const mediaToolbarItems: readonly MediaToolbarItem[] = [
    'reminder',
    'online',
    'speakerList',
    'favoriteList',
    'playList',
    'equalizer',
    'clock',
    'volumePresets',
    'trackList',
    'repeat',
    'crossfade',
];

/**
 * A list of names of a media page (`speakerList`, `playList`, `favoriteList`) in the admin form.
 *
 * An empty list means the same as a missing field on both paths (the media tools take every device,
 * the admin builder writes no list) - it is dropped. Repeated names are deduplicated: the tools match
 * with `includes`, the admin builder deduplicates anyway. A name with blanks at the edge or an empty
 * name is rejected: the admin builder would trim or drop it and the list would match other devices.
 *
 * @param value Value of the script.
 * @param where Field name for the detail.
 */
function mediaNameList(value: unknown, where: string): string[] | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    const reason: ConvertSkipReason = 'fieldNotSupported';
    if (!Array.isArray(value)) {
        throw new ConvertError(reason, `${where}: expected a list of names`);
    }
    const names = value as unknown[];
    if (!names.every(n => typeof n === 'string' && n.trim() === n && n !== '')) {
        throw new ConvertError(reason, `${where}: expected trimmed, non-empty names`);
    }
    const unique = [...new Set(names as string[])];
    return unique.length ? unique : undefined;
}

/**
 * Admin entry of a cardMedia page - inverse of `buildMediaScriptPage` (admin.ts).
 *
 * @param page Page of the script.
 * @param common Converted common fields.
 * @param topic Topic of the panel.
 */
function convertMediaPage(page: Dict, common: PageCommon, topic: string): MediaEntry {
    const reason: ConvertSkipReason = 'fieldNotSupported';
    rejectUnknownKeys(page, [...pageMappedKeys, ...scrollKeys, 'media'], pageIgnoredKeys, reason, 'page');
    const media = page.media;
    if (!isDict(media)) {
        throw new ConvertError(reason, 'media: missing (a cardMedia page without the media object)');
    }
    rejectUnknownKeys(media, mediaMappedKeys, [], reason, 'media');
    const mediaId = trimmedText(media.id, reason, 'media.id');
    if (!mediaId) {
        throw new ConvertError(reason, 'media.id: empty');
    }
    const entry: MediaEntry = {
        card: 'cardMedia',
        uniqueName: common.uniqueName,
        headline: common.headline,
        mediaId,
        pageItems: convertPageItems(page.items),
        hidden: common.hidden,
        alwaysOn: common.alwaysOn,
        ...scrollFields(page, 'cardMedia'),
        navigationAssignment: [{ topic, navigation: common.navigation }],
    };
    const name = trimmedText(media.name, reason, 'media.name');
    if (name !== undefined) {
        entry.name = name;
    }
    const minValue = num(media.minValue, reason, 'media.minValue');
    const maxValue = num(media.maxValue, reason, 'media.maxValue');
    if ((minValue !== undefined && minValue < 0) || (maxValue !== undefined && maxValue < 0)) {
        throw new ConvertError(reason, 'media.minValue/maxValue: the admin only takes values from 0');
    }
    if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
        throw new ConvertError(reason, 'media.minValue/maxValue: the admin swaps a reversed range');
    }
    if (minValue !== undefined) {
        entry.minValue = minValue;
    }
    if (maxValue !== undefined) {
        entry.maxValue = maxValue;
    }
    for (const key of ['colorMediaIcon', 'colorMediaArtist', 'colorMediaTitle'] as const) {
        const hex = rgbToHex(media[key], reason, `media.${key}`);
        if (hex !== undefined) {
            entry[key] = hex;
        }
    }
    for (const key of ['speakerList', 'playList', 'favoriteList'] as const) {
        const list = mediaNameList(media[key], `media.${key}`);
        if (list !== undefined) {
            entry[key] = list;
        }
    }
    if (media.volumePresets !== undefined && media.volumePresets !== null) {
        const presets = media.volumePresets;
        if (!Array.isArray(presets) || presets.length === 0) {
            throw new ConvertError(reason, 'media.volumePresets: expected a list with at least one preset');
        }
        const low = minValue ?? 0;
        const high = maxValue ?? 100;
        const out: MediaVolumePreset[] = [];
        for (const raw of presets as unknown[]) {
            const preset = typeof raw === 'string' ? raw : '';
            const match = /^(.*)\?(-?\d+(?:\.\d+)?)$/.exec(preset);
            if (!match) {
                throw new ConvertError(reason, `media.volumePresets: '${preset}' is not name?value`);
            }
            const presetName = match[1];
            const value = Number(match[2]);
            if (presetName.trim() !== presetName || !presetName) {
                throw new ConvertError(reason, `media.volumePresets: '${preset}' - the admin trims the name`);
            }
            if (!Number.isInteger(value) || value < low || value > high) {
                throw new ConvertError(
                    reason,
                    `media.volumePresets: '${preset}' - the admin rounds the value and keeps it between ${low} and ${high}`,
                );
            }
            out.push({ name: presetName, value });
        }
        entry.volumePresets = out;
    }
    const toolbar: Partial<Record<MediaToolbarItem, MediaToolbarConfig>> = {};
    const toolbarOf = (item: string, where: string): MediaToolbarConfig => {
        if (!mediaToolbarItems.includes(item as MediaToolbarItem)) {
            throw new ConvertError(reason, `${where}.${item}: unknown standard item`);
        }
        return (toolbar[item as MediaToolbarItem] ??= {});
    };
    if (media.deactivateDefaultItems !== undefined && media.deactivateDefaultItems !== null) {
        const off = media.deactivateDefaultItems;
        if (!isDict(off)) {
            throw new ConvertError(reason, 'media.deactivateDefaultItems: expected an object');
        }
        for (const [item, value] of Object.entries(off)) {
            if (value === undefined || value === null || value === false) {
                continue;
            }
            if (value !== true || item === 'volumePresets') {
                throw new ConvertError(reason, `media.deactivateDefaultItems.${item}: not available in the admin`);
            }
            toolbarOf(item, 'media.deactivateDefaultItems').enabled = false;
        }
    }
    for (const [field, color] of [
        ['itemsColorOn', 'colorOn'],
        ['itemsColorOff', 'colorOff'],
    ] as const) {
        const colors = media[field];
        if (colors === undefined || colors === null) {
            continue;
        }
        if (!isDict(colors)) {
            throw new ConvertError(reason, `media.${field}: expected an object`);
        }
        for (const [item, value] of Object.entries(colors)) {
            const hex = rgbToHex(value, reason, `media.${field}.${item}`);
            if (hex === undefined) {
                continue;
            }
            if (field === 'itemsColorOff' && item === 'volumePresets') {
                throw new ConvertError(reason, `media.${field}.${item}: not available in the admin`);
            }
            toolbarOf(item, `media.${field}`)[color] = hex;
        }
    }
    if (Object.keys(toolbar).length) {
        entry.toolbar = toolbar;
    }
    return entry;
}

/**
 * A script cardPower / cardChart page that points at an existing admin entry: the page may only carry
 * the navigation - anything else would change the page the panel shows.
 *
 * @param page Page of the script.
 * @param entry The admin entry the page refers to.
 */
function checkReferencePage(page: Dict, entry: Extract<PageConfigEntry, { card: 'cardPower' | 'cardChart' }>): void {
    const reason: ConvertSkipReason = 'fieldNotSupported';
    rejectUnknownKeys(page, pageMappedKeys, pageIgnoredKeys, reason, 'page');
    if (Array.isArray(page.items) && page.items.some(i => i !== null && i !== undefined)) {
        throw new ConvertError(reason, 'items: the admin entry has no page items');
    }
    const heading = str(page.heading, reason, 'heading');
    if (entry.card === 'cardChart' && heading && heading !== entry.headline) {
        throw new ConvertError(reason, 'heading: differs from the headline of the admin entry');
    }
    if (page.hiddenByTrigger === true && !entry.hidden) {
        throw new ConvertError(reason, 'hiddenByTrigger: the admin entry is not hidden');
    }
    const aod = page.alwaysOnDisplay;
    const scriptAlways = entry.card === 'cardPower' ? aod === true : !!aod;
    if (scriptAlways && entry.alwaysOn !== 'always') {
        throw new ConvertError(reason, 'alwaysOnDisplay: the admin entry is not always on');
    }
}

/* ---------------------------------------------------------------------------------------------
 * screensaver
 * ------------------------------------------------------------------------------------------- */

type ScreensaverArea = 'favorit' | 'alternate' | 'left' | 'bottom' | 'indicator';

const screensaverStateKeys = [
    'type',
    'ScreensaverEntity',
    'ScreensaverEntityText',
    'ScreensaverEntityFactor',
    'ScreensaverEntityDecimalPlaces',
    'ScreensaverEntityDateFormat',
    'ScreensaverEntityIconOn',
    'ScreensaverEntityIconOff',
    'ScreensaverEntityUnitText',
    'ScreensaverEntityIconColor',
    'ScreensaverEntityOnColor',
    'ScreensaverEntityOffColor',
    'ScreensaverEntityOnText',
    'ScreensaverEntityOffText',
    'ScreensaverEntityNaviToPage',
    'ScreensaverEntityButton',
    'ScreensaverEntitySwitch',
    'ScreensaverEntityIconSelect',
    'ScreensaverEntityEnabled',
    'ScreensaverEntityVisibleCondition',
    'ScreensaverEntityFillIfBelowMin',
] as const;
const screensaverTemplateKeys = ['type', 'template', 'dpInit', 'modeScr', 'enabled', 'visibleCondition'] as const;

/** the colors of the script the config manager falls back to for an item without own colors */
type ScriptDefaultColors = { on?: string; off?: string };

/**
 * One screensaver element of the script as the admin stores it - inverse of `screensaverItemToScript`
 * (admin-screensaver.ts).
 *
 * The admin builder adds what the script leaves open: a default icon by role, the state name as
 * headline and the adapter default colors. To keep the panel unchanged, items without icon or headline
 * are rejected and the default colors of the script are written into the item.
 *
 * @param element Element of the script.
 * @param area Area of the screensaver.
 * @param where Prefix for the detail.
 * @param defaults `defaultOnColor` / `defaultOffColor` of the script as hex.
 */
function convertScreensaverItem(
    element: Dict,
    area: ScreensaverArea,
    where: string,
    defaults: ScriptDefaultColors,
): ScreensaverItemConfig {
    const reason: ConvertSkipReason = 'screensaverItemNotSupported';
    if (element.type === 'native') {
        throw new ConvertError(reason, `${where}: native element`);
    }
    if (element.type === 'template') {
        rejectUnknownKeys(element, screensaverTemplateKeys, [], reason, where);
        const template = str(element.template, reason, `${where}.template`);
        if (!template) {
            throw new ConvertError(reason, `${where}.template: empty`);
        }
        if (element.modeScr !== area) {
            throw new ConvertError(
                reason,
                `${where}.modeScr: ${String(element.modeScr)} differs from the area ${area}`,
            );
        }
        const item: ScreensaverItemConfig = { state: str(element.dpInit, reason, `${where}.dpInit`) ?? '', template };
        if (element.enabled !== undefined && element.enabled !== null) {
            if (typeof element.enabled !== 'string') {
                throw new ConvertError(reason, `${where}.enabled: the admin takes one state id`);
            }
            if (element.enabled) {
                item.enabled = element.enabled;
            }
        }
        const condition = str(element.visibleCondition, reason, `${where}.visibleCondition`);
        if (condition) {
            item.visibleCondition = condition;
        }
        return item;
    }
    if (element.type !== 'script') {
        throw new ConvertError(reason, `${where}.type: unknown type`);
    }
    rejectUnknownKeys(element, screensaverStateKeys, [], reason, where);
    const item: ScreensaverItemConfig = {
        state: str(element.ScreensaverEntity, reason, `${where}.ScreensaverEntity`) ?? '',
    };
    const headline = str(element.ScreensaverEntityText, reason, `${where}.ScreensaverEntityText`);
    if (!headline) {
        throw new ConvertError(reason, `${where}.ScreensaverEntityText: empty - the admin shows the name of the state`);
    }
    item.headline = headline;
    const iconOn = str(element.ScreensaverEntityIconOn, reason, `${where}.ScreensaverEntityIconOn`);
    const iconOff = str(element.ScreensaverEntityIconOff, reason, `${where}.ScreensaverEntityIconOff`);
    const iconSelect = element.ScreensaverEntityIconSelect;
    if (iconSelect !== undefined && iconSelect !== null) {
        if (
            !Array.isArray(iconSelect) ||
            !iconSelect.every(s => isDict(s) && typeof s.icon === 'string' && typeof s.value === 'number')
        ) {
            throw new ConvertError(reason, `${where}.ScreensaverEntityIconSelect: expected a list of {icon, value}`);
        }
        item.iconSelect = (iconSelect as { icon: string; value: number }[]).map(s => ({
            value: s.value,
            icon: s.icon,
        }));
    }
    if (!iconOn && !item.iconSelect?.length) {
        throw new ConvertError(reason, `${where}.ScreensaverEntityIconOn: empty - the admin adds a default icon`);
    }
    if (iconOn) {
        item.iconOn = iconOn;
    }
    if (iconOff) {
        item.iconOff = iconOff;
    }
    const unit = str(element.ScreensaverEntityUnitText, reason, `${where}.ScreensaverEntityUnitText`);
    if (unit !== undefined) {
        item.unit = unit;
    }
    const factor = num(element.ScreensaverEntityFactor, reason, `${where}.ScreensaverEntityFactor`);
    if (factor !== undefined) {
        item.factor = factor;
    }
    const decimals = num(element.ScreensaverEntityDecimalPlaces, reason, `${where}.ScreensaverEntityDecimalPlaces`);
    if (decimals !== undefined) {
        item.decimals = decimals;
    }
    const dateFormat = element.ScreensaverEntityDateFormat;
    if (dateFormat !== undefined && dateFormat !== null) {
        if (!isDict(dateFormat)) {
            throw new ConvertError(reason, `${where}.ScreensaverEntityDateFormat: expected an object`);
        }
        item.dateFormat = { ...(dateFormat as Intl.DateTimeFormatOptions) };
    }
    const textOn = str(element.ScreensaverEntityOnText, reason, `${where}.ScreensaverEntityOnText`);
    if (textOn) {
        item.textOn = textOn;
    }
    const textOff = str(element.ScreensaverEntityOffText, reason, `${where}.ScreensaverEntityOffText`);
    if (textOff) {
        item.textOff = textOff;
    }

    // colors: OnColor wins, then a fixed or state IconColor, then the script default; a scale is kept apart
    const onColor = element.ScreensaverEntityOnColor;
    if (typeof onColor === 'string') {
        throw new ConvertError(reason, `${where}.ScreensaverEntityOnColor: the admin takes a fixed color only`);
    }
    let colorOn = rgbToHex(onColor, reason, `${where}.ScreensaverEntityOnColor`);
    const iconColor = element.ScreensaverEntityIconColor;
    if (iconColor !== undefined && iconColor !== null && iconColor !== '') {
        if (isDict(iconColor) && (iconColor.val_min !== undefined || iconColor.val_max !== undefined)) {
            // the config manager treats everything with val_min / val_max as scale
            const scale = colorScaleToAdmin(iconColor, reason, `${where}.ScreensaverEntityIconColor`);
            item.colorScale = scale;
        } else if (typeof iconColor === 'string') {
            if (!colorOn) {
                item.colorState = iconColor;
            }
        } else if (!colorOn) {
            colorOn = rgbToHex(iconColor, reason, `${where}.ScreensaverEntityIconColor`);
        }
    }
    if (!colorOn && !item.colorState) {
        colorOn = defaults.on;
    }
    if (colorOn) {
        item.colorOn = colorOn;
    }
    const offColor = element.ScreensaverEntityOffColor;
    if (offColor === null) {
        throw new ConvertError(
            reason,
            `${where}.ScreensaverEntityOffColor: null (no off color) is not available in the admin`,
        );
    }
    if (typeof offColor === 'string') {
        throw new ConvertError(reason, `${where}.ScreensaverEntityOffColor: the admin takes a fixed color only`);
    }
    const colorOff = rgbToHex(offColor, reason, `${where}.ScreensaverEntityOffColor`) ?? defaults.off;
    if (colorOff) {
        item.colorOff = colorOff;
    }

    const enabled = element.ScreensaverEntityEnabled;
    if (enabled !== undefined && enabled !== null) {
        if (typeof enabled !== 'string') {
            throw new ConvertError(reason, `${where}.ScreensaverEntityEnabled: expected a state id`);
        }
        if (enabled) {
            item.enabled = enabled;
        }
    }
    const condition = str(
        element.ScreensaverEntityVisibleCondition,
        reason,
        `${where}.ScreensaverEntityVisibleCondition`,
    );
    if (condition) {
        item.visibleCondition = condition;
    }
    const fill = element.ScreensaverEntityFillIfBelowMin;
    if (fill !== undefined && fill !== null && fill !== true) {
        throw new ConvertError(reason, `${where}.ScreensaverEntityFillIfBelowMin: not available in the admin`);
    }
    if (area === 'indicator') {
        // the config manager takes the first of button, switch and page - the others have no effect
        const button = str(element.ScreensaverEntityButton, reason, `${where}.ScreensaverEntityButton`);
        const switchState = str(element.ScreensaverEntitySwitch, reason, `${where}.ScreensaverEntitySwitch`);
        const navi = str(element.ScreensaverEntityNaviToPage, reason, `${where}.ScreensaverEntityNaviToPage`);
        if (button) {
            item.action = { kind: 'button', state: button };
        } else if (switchState) {
            item.action = { kind: 'switch', state: switchState };
        } else if (navi) {
            item.action = { kind: 'navigate', page: navi };
        }
    }
    return item;
}

const mrIconKeys = [
    'type',
    'ScreensaverEntity',
    'ScreensaverEntityIconOn',
    'ScreensaverEntityIconSelect',
    'ScreensaverEntityIconOff',
    'ScreensaverEntityValue',
    'ScreensaverEntityValueDecimalPlace',
    'ScreensaverEntityValueUnit',
    'ScreensaverEntityOnColor',
    'ScreensaverEntityOffColor',
] as const;

/**
 * A status icon of the script as the admin stores it - inverse of `screensaverMrIconToScript`
 * (admin-screensaver.ts). Undefined when the script has no element, null for an element without state
 * and value: the script still shows its off icon there while the admin shows nothing - the caller
 * rejects it unless the whole screensaver is empty anyway.
 *
 * @param element Element of the script.
 * @param where Prefix for the detail.
 */
function convertMrIcon(element: unknown, where: string): ScreensaverMrIconConfig | undefined | null {
    const reason: ConvertSkipReason = 'screensaverItemNotSupported';
    if (element === undefined || element === null) {
        return undefined;
    }
    if (!isDict(element)) {
        throw new ConvertError(reason, `${where}: expected an object`);
    }
    if (element.type !== 'script') {
        throw new ConvertError(reason, `${where}: only script elements can be converted`);
    }
    rejectUnknownKeys(element, mrIconKeys, [], reason, where);
    const entity = str(element.ScreensaverEntity, reason, `${where}.ScreensaverEntity`);
    const value = str(element.ScreensaverEntityValue, reason, `${where}.ScreensaverEntityValue`);
    if (!entity && !value) {
        return null;
    }
    const cfg: ScreensaverMrIconConfig = {};
    if (entity) {
        cfg.entity = entity;
    }
    if (value) {
        cfg.value = value;
    }
    const iconOn = str(element.ScreensaverEntityIconOn, reason, `${where}.ScreensaverEntityIconOn`);
    if (iconOn) {
        cfg.iconOn = iconOn;
    }
    const iconOff = str(element.ScreensaverEntityIconOff, reason, `${where}.ScreensaverEntityIconOff`);
    if (iconOff) {
        cfg.iconOff = iconOff;
    }
    const select = element.ScreensaverEntityIconSelect;
    if (select !== undefined && select !== null) {
        if (!isDict(select) || !Object.values(select).every(v => typeof v === 'string')) {
            throw new ConvertError(reason, `${where}.ScreensaverEntityIconSelect: expected {value: icon}`);
        }
        const list = Object.entries(select).map(([v, icon]) => ({ value: v, icon: icon as string }));
        if (list.length) {
            cfg.iconSelect = list;
        }
    }
    const decimals = num(
        element.ScreensaverEntityValueDecimalPlace,
        reason,
        `${where}.ScreensaverEntityValueDecimalPlace`,
    );
    if (decimals !== undefined) {
        cfg.valueDecimals = decimals;
    }
    const unit = str(element.ScreensaverEntityValueUnit, reason, `${where}.ScreensaverEntityValueUnit`);
    if (unit) {
        cfg.valueUnit = unit;
    }
    for (const [key, field] of [
        ['ScreensaverEntityOnColor', 'onColor'],
        ['ScreensaverEntityOffColor', 'offColor'],
    ] as const) {
        if (typeof element[key] === 'string') {
            throw new ConvertError(reason, `${where}.${key}: the admin takes a fixed color only`);
        }
        const hex = rgbToHex(element[key], reason, `${where}.${key}`);
        if (hex) {
            cfg[field] = hex;
        }
    }
    return cfg;
}

const notifyKeys = [
    'type',
    'Priority',
    'Headline',
    'HeadlinePrefix',
    'HeadlineUnit',
    'Text',
    'TextSuffix',
    'TextPrefix',
    'HeadlineIcon',
    'isDismissiblePerEvent',
    'dismissibleIDGlobal',
    'buzzer',
    'Enabled',
    'VisibleCondition',
] as const;

/**
 * A notification of the script as the admin stores it (without id) - inverse of
 * `screensaverNotifyToScript` (admin-screensaver.ts).
 *
 * @param element Element of the script.
 * @param where Prefix for the detail.
 */
function convertNotify(element: unknown, where: string): Omit<ScreensaverNotifyConfig, 'id'> {
    const reason: ConvertSkipReason = 'screensaverItemNotSupported';
    if (!isDict(element)) {
        throw new ConvertError(reason, `${where}: expected an object`);
    }
    if (element.type !== 'script') {
        throw new ConvertError(reason, `${where}: only script elements can be converted`);
    }
    rejectUnknownKeys(element, notifyKeys, [], reason, where);
    const rawEnabled = element.Enabled;
    const enabled = Array.isArray(rawEnabled)
        ? rawEnabled
        : rawEnabled === undefined || rawEnabled === null
          ? []
          : [rawEnabled];
    if (enabled.length === 0 || !enabled.every(e => typeof e === 'string' && e.trim() === e && e !== '')) {
        throw new ConvertError(reason, `${where}.Enabled: expected one or more trimmed state ids`);
    }
    const cfg: Omit<ScreensaverNotifyConfig, 'id'> = { enabled: [...(enabled as string[])] };
    const condition = trimmedText(element.VisibleCondition, reason, `${where}.VisibleCondition`);
    if (condition) {
        cfg.visibleCondition = condition;
    }
    const priority = num(element.Priority, reason, `${where}.Priority`);
    if (priority !== undefined) {
        cfg.priority = priority;
    }
    const headline = str(element.Headline, reason, `${where}.Headline`);
    if (headline) {
        cfg.headline = headline;
    }
    const text = str(element.Text, reason, `${where}.Text`);
    if (text) {
        cfg.text = text;
    }
    for (const [key, field] of [
        ['HeadlinePrefix', 'headlinePrefix'],
        ['HeadlineUnit', 'headlineUnit'],
        ['HeadlineIcon', 'headlineIcon'],
        ['TextPrefix', 'textPrefix'],
        ['TextSuffix', 'textSuffix'],
    ] as const) {
        const value = str(element[key], reason, `${where}.${key}`);
        if (value) {
            cfg[field] = value;
        }
    }
    const dismissible = bool(element.isDismissiblePerEvent, reason, `${where}.isDismissiblePerEvent`);
    if (dismissible) {
        cfg.dismissible = true;
        // the global id only counts with isDismissiblePerEvent (config manager)
        const globalId = trimmedText(element.dismissibleIDGlobal, reason, `${where}.dismissibleIDGlobal`);
        if (globalId) {
            cfg.dismissibleId = globalId;
        }
    }
    const buzzer = element.buzzer;
    if (buzzer === true) {
        cfg.buzzer = true;
    } else if (typeof buzzer === 'string' && buzzer.trim()) {
        if (buzzer.trim() !== buzzer) {
            throw new ConvertError(reason, `${where}.buzzer: the admin trims the tone sequence`);
        }
        cfg.buzzer = buzzer;
    } else if (buzzer !== undefined && buzzer !== null && buzzer !== false && buzzer !== '') {
        throw new ConvertError(reason, `${where}.buzzer: expected true or a tone sequence`);
    }
    return cfg;
}

/**
 * The weather items of the script as the admin stores them: `true` means every item (the config manager
 * only adds the ones the weather adapter offers, on both paths).
 *
 * @param value `weatherAddDefaultItems` of the script.
 */
function weatherItemsOf(value: unknown): ScreensaverWeatherItems | undefined {
    if (value === true) {
        return Object.fromEntries(screensaverWeatherItemKeys.map(k => [k, true]));
    }
    if (!isDict(value)) {
        return undefined;
    }
    const items: ScreensaverWeatherItems = {};
    for (const key of screensaverWeatherItemKeys) {
        if (value[key] === true) {
            items[key] = true;
        }
    }
    return Object.keys(items).length ? items : undefined;
}

type ScreensaverResult =
    | { entry: ScreensaverEntry; notify: ScreensaverNotifyConfig[] }
    | { skipped: { reason: ConvertSkipReason; detail?: string } };

/**
 * The screensaver of the script as an admin entry - inverse of `buildScreensaverScriptConfig`
 * (admin-screensaver.ts).
 *
 * @param input Input of the planner.
 */
function convertScreensaver(input: ScriptToAdminInput): ScreensaverResult {
    const { raw, panel } = input;
    if (findScreensaverEntry(input.screensaverConfig, panel.topic).entry) {
        return { skipped: { reason: 'screensaverExists' } };
    }
    try {
        const nativeItems = raw.nativePageItems;
        if (Array.isArray(nativeItems) && nativeItems.length) {
            throw new ConvertError('screensaverItemNotSupported', 'nativePageItems: not available in the admin');
        }
        const defaults: ScriptDefaultColors = {};
        try {
            defaults.on = rgbToHex(raw.defaultOnColor, 'screensaverItemNotSupported', 'defaultOnColor');
            defaults.off = rgbToHex(raw.defaultOffColor, 'screensaverItemNotSupported', 'defaultOffColor');
        } catch {
            // no valid default colors: the config manager falls back to its own default, so does the admin
        }
        const area = (
            name: ScreensaverArea,
            list: unknown,
            keepGaps: boolean,
        ): (ScreensaverItemConfig | undefined)[] => {
            if (list === undefined || list === null) {
                return [];
            }
            if (!Array.isArray(list)) {
                throw new ConvertError('screensaverItemNotSupported', `${name}: expected a list`);
            }
            const out: (ScreensaverItemConfig | undefined)[] = [];
            list.forEach((element: unknown, index) => {
                if (element === null || element === undefined) {
                    if (keepGaps) {
                        out.push(undefined);
                    }
                    return;
                }
                if (!isDict(element)) {
                    throw new ConvertError('screensaverItemNotSupported', `${name}[${index}]: expected an object`);
                }
                out.push(convertScreensaverItem(element, name, `${name}[${index}]`, defaults));
            });
            return out;
        };
        const single = (name: 'favorit' | 'alternate', list: unknown): ScreensaverItemConfig | undefined => {
            const items = area(name, list, false).filter((i): i is ScreensaverItemConfig => !!i);
            if (items.length > 1) {
                throw new ConvertError('screensaverItemNotSupported', `${name}: the admin takes one item`);
            }
            return items[0];
        };
        const favorit = single('favorit', raw.favoritScreensaverEntity);
        const alternate = single('alternate', raw.alternateScreensaverEntity);
        const left = area('left', raw.leftScreensaverEntity, true);
        const bottom = area('bottom', raw.bottomScreensaverEntity, false);
        const indicator = area('indicator', raw.indicatorScreensaverEntity, true);
        const mrIcon1 = convertMrIcon(raw.mrIcon1ScreensaverEntity, 'mrIcon1ScreensaverEntity');
        const mrIcon2 = convertMrIcon(raw.mrIcon2ScreensaverEntity, 'mrIcon2ScreensaverEntity');
        const notifyList = raw.notifyScreensaverEntity;
        const notify: ScreensaverNotifyConfig[] = [];
        if (notifyList !== undefined && notifyList !== null) {
            if (!Array.isArray(notifyList)) {
                throw new ConvertError('screensaverItemNotSupported', 'notifyScreensaverEntity: expected a list');
            }
            const existing = [...input.screensaverNotify];
            notifyList.forEach((element: unknown, index) => {
                const cfg = convertNotify(element, `notifyScreensaverEntity[${index}]`);
                const id = (input.notifyIdFactory ?? newScreensaverNotifyId)(existing);
                const full: ScreensaverNotifyConfig = { id, name: `${panel.name} ${index + 1}`, ...cfg };
                existing.push(full);
                notify.push(full);
            });
        }
        const present = (list: (ScreensaverItemConfig | undefined)[]): boolean => list.some(i => !!i);
        if (
            !favorit &&
            !alternate &&
            !present(left) &&
            !present(bottom) &&
            !present(indicator) &&
            !mrIcon1 &&
            !mrIcon2 &&
            notify.length === 0
        ) {
            return { skipped: { reason: 'screensaverEmpty' } };
        }
        for (const [icon, where] of [
            [mrIcon1, 'mrIcon1ScreensaverEntity'],
            [mrIcon2, 'mrIcon2ScreensaverEntity'],
        ] as const) {
            if (icon === null) {
                throw new ConvertError(
                    'screensaverItemNotSupported',
                    `${where}: without state and value - the script shows the off icon, the admin shows nothing`,
                );
            }
        }
        const mode: ScreensaverMode =
            input.screensaverMode ??
            (present(left) || present(indicator) ? 'advanced' : alternate ? 'alternate' : 'standard');
        const entry: ScreensaverEntry = {
            name: panel.name,
            mode,
            panels: [panel.topic],
            left,
            bottom,
            indicator,
            rotationTime: 0,
            screensaverSwipe: !!raw.advancedOptions?.screensaverSwipe,
            screensaverIndicatorButtons: !!raw.advancedOptions?.screensaverIndicatorButtons,
        };
        if (favorit) {
            entry.favorit = favorit;
        }
        if (alternate) {
            entry.alternate = alternate;
        }
        if (mrIcon1) {
            entry.mrIcon1 = mrIcon1;
        }
        if (mrIcon2) {
            entry.mrIcon2 = mrIcon2;
        }
        if (notify.length) {
            entry.notify = notify.map(n => n.id);
        }
        // the global weather entity of the instance replaces the one of the script (config manager) - then
        // the entry leaves the field to the global setting as well
        if (!input.instanceWeatherEntity) {
            entry.weatherEntity = typeof raw.weatherEntity === 'string' ? raw.weatherEntity : '';
        }
        const weatherItems = weatherItemsOf(raw.weatherAddDefaultItems);
        if (weatherItems) {
            entry.weatherAddDefaultItems = weatherItems;
        }
        return { entry, notify };
    } catch (error) {
        if (error instanceof ConvertError) {
            return { skipped: { reason: error.reason, detail: error.detail } };
        }
        throw error;
    }
}

/**
 * The empty status icon of the script form (configManagerConst.defaultConfig) - the field is required
 * by the config manager, so the cleaned script keeps it.
 */
function emptyMrIcon(): ScriptConfig.ScreenSaverMRElement {
    return {
        type: 'script',
        ScreensaverEntity: null,
        ScreensaverEntityIconOn: null,
        ScreensaverEntityIconSelect: undefined,
        ScreensaverEntityIconOff: null,
        ScreensaverEntityValue: null,
        ScreensaverEntityValueDecimalPlace: null,
        ScreensaverEntityValueUnit: null,
        ScreensaverEntityOnColor: { red: 0, green: 0, blue: 0 },
        ScreensaverEntityOffColor: { red: 0, green: 0, blue: 0 },
    };
}

/* ---------------------------------------------------------------------------------------------
 * buttons
 * ------------------------------------------------------------------------------------------- */

/** the modes of a hardware button the config manager knows (`isButton`) */
const buttonModes: readonly NonNullable<AdminButtonFunction>['mode'][] = [
    'page',
    'switch',
    'button',
    'buttonOnDelayOff',
    'buttonOffDelayOn',
    'buttonDelayOn',
    'buttonDelayOff',
];

/**
 * Whether a script button is the empty form of the template (`{ mode: 'switch', state: '' }`): a known
 * mode whose target (`state`, for `page` the `page`) is empty, null or missing. The config manager
 * rejects it in `isButton`, logs "Button ... wrong configured!" and sets no action - on the panel it is
 * the same as no button at all.
 *
 * @param value `buttonLeft` / `buttonRight` of the script.
 */
function isEmptyButton(value: Dict): boolean {
    const mode = value.mode;
    if (typeof mode !== 'string' || !buttonModes.some(m => m === mode)) {
        return false;
    }
    const target = value[mode === 'page' ? 'page' : 'state'];
    return target === undefined || target === null || target === '';
}

/**
 * A hardware button of the script as the admin stores it - inverse of `applyAdminButtons`
 * (panel-buttons.ts): the admin entry is handed to the panel unchanged, so the script value has to be
 * a valid action already. Undefined for a script button without action - `null`, `undefined` or the
 * empty form of the template ({@link isEmptyButton}), which the panel treats the same way.
 *
 * @param value `buttonLeft` / `buttonRight` of the script.
 */
function convertButton(value: unknown): AdminButtonFunction | undefined {
    const reason: ConvertSkipReason = 'buttonNotSupported';
    if (value === undefined || value === null || (isDict(value) && isEmptyButton(value))) {
        return undefined;
    }
    // isDict first: `isButton` uses `in` and throws for a primitive such as a plain string
    if (!isDict(value) || !isButton(value)) {
        throw new ConvertError(reason, 'not a valid button action');
    }
    const mode = value.mode;
    if (mode === 'page') {
        rejectUnknownKeys(value, ['mode', 'page'], [], reason, 'button');
        return { mode, page: String(value.page) };
    }
    if (typeof value.state !== 'string') {
        throw new ConvertError(reason, 'state: expected a state id');
    }
    if (mode === 'switch' || mode === 'button') {
        rejectUnknownKeys(value, ['mode', 'state'], [], reason, 'button');
        return { mode, state: value.state };
    }
    rejectUnknownKeys(value, ['mode', 'state', 'delay'], [], reason, 'button');
    const delay = num(value.delay, reason, 'delay');
    const action: AdminButtonFunction = {
        mode: mode,
        state: value.state,
    };
    if (delay !== undefined) {
        action.delay = delay;
    }
    return action;
}

/* ---------------------------------------------------------------------------------------------
 * the plan
 * ------------------------------------------------------------------------------------------- */

/**
 * The navigation node name of a script page (what `setScriptConfig` puts into the ring).
 *
 * @param page Page of the script.
 */
function scriptPageId(page: unknown): string {
    if (!isDict(page)) {
        return '';
    }
    if (page.type === undefined) {
        const native = page.native;
        return isDict(native) && typeof native.uniqueID === 'string' ? native.uniqueID : '';
    }
    return typeof page.uniqueName === 'string' ? page.uniqueName : '';
}

/**
 * A value as JSON with sorted object keys - two entries with the same content give the same text whatever
 * the order of their fields. `undefined` fields are dropped like JSON does.
 *
 * @param value Any JSON value.
 */
function canonicalJson(value: unknown): string {
    return JSON.stringify(value, (_key: string, v: unknown): unknown => {
        if (isDict(v)) {
            const sorted: Dict = {};
            for (const key of Object.keys(v).sort()) {
                sorted[key] = v[key];
            }
            return sorted;
        }
        return v;
    });
}

/**
 * The top level fields in which two admin entries differ, `navigationAssignment` left out.
 *
 * @param a First entry.
 * @param b Second entry.
 */
function entryDifferences(a: PageConfigEntry, b: PageConfigEntry): string[] {
    const left: Dict = { ...a };
    const right: Dict = { ...b };
    delete left.navigationAssignment;
    delete right.navigationAssignment;
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
    return keys.filter(key => canonicalJson(left[key]) !== canonicalJson(right[key]));
}

/**
 * Whether the admin entry is assigned to the panel by its topic - not through "all panels" and not excluded.
 * Such an entry replaces a page of the global script at runtime (`AdminConfiguration`).
 *
 * @param entry Admin entry.
 * @param topic Topic of the panel.
 */
function entryAssignedToPanel(entry: PageConfigEntry, topic: string): boolean {
    const assignments = entry.navigationAssignment ?? [];
    const own = assignments.find(a => a.topic === topic);
    if (!own) {
        return false;
    }
    return !(!own.navigation && assignments.some(a => a.topic === ALL_PANELS_SPECIAL_ID));
}

/**
 * The name under which the runtime merges a `{ globalLink }` entry: its `uniqueName` (renamed), else the
 * name of the global page. Empty when the page is no link.
 *
 * @param page Page of the script.
 */
function globalLinkName(page: unknown): string {
    if (!isDict(page) || typeof page.globalLink !== 'string' || page.globalLink === '') {
        return '';
    }
    return typeof page.uniqueName === 'string' ? page.uniqueName : page.globalLink;
}

/**
 * Plans the conversion of the script configuration of one panel into the admin configuration.
 *
 * Pure: nothing is read or written, the result describes what the caller has to store. See the file
 * header for the rules.
 *
 * @param input Script configuration of the panel and the admin tables.
 */
export function planScriptToAdmin(input: ScriptToAdminInput): ScriptToAdminResult {
    const { raw, panel } = input;
    const plan: ConvertScriptPlan = {
        panelTopic: panel.topic,
        panelName: panel.name,
        scriptId: typeof raw.scriptName === 'string' ? raw.scriptName : '',
        scriptFound: !!input.scriptFound,
        pages: [],
        skipped: [],
        buttons: {},
        buttonsSkipped: [],
        nothingToDo: true,
    };
    const newPages: PageConfigEntry[] = [];
    let updatedPages: PageConfigEntry[] = [...input.pageConfig];
    const removedFromScript: string[] = [];
    const removedPages = new Set<string>();
    const removedSubPages = new Set<string>();
    /** names of the `{ globalLink }` entries of the panel script that go */
    const removedLinks = new Set<string>();
    const conflicts: ConvertGlobalConflict[] = [];
    /**
     * A page leaves the script (it is an admin page from now on). A page of the global script is only taken
     * out of the panel script when the panel links it - the global script itself stays as it is.
     *
     * @param uniqueName Name of the page.
     * @param isSub The page comes from `subPages`.
     * @param source Where a page of the global script comes from, undefined for a page of the panel script.
     */
    const remove = (uniqueName: string, isSub: boolean, source?: GlobalPageSource): void => {
        (isSub ? removedSubPages : removedPages).add(uniqueName);
        if (!source) {
            removedFromScript.push(uniqueName);
        } else if (source.kind === 'linked') {
            removedFromScript.push(uniqueName);
            removedLinks.add(uniqueName);
        }
    };
    const usedNames = new Set(updatedPages.map(e => e.uniqueName));

    const rawPages = Array.isArray(raw.pages) ? raw.pages : [];
    const rawSubPages = Array.isArray(raw.subPages) ? raw.subPages : [];
    // the pages as the runtime sees them: the global script merged in for this panel. Navigation copies get
    // a fixed name here (the runtime uses a random one) - they are not converted anyway.
    const merged =
        input.globalConfigRaw !== undefined && input.globalConfigRaw !== null
            ? mergeGlobalConfig(
                  {
                      pages: rawPages,
                      subPages: rawSubPages,
                      navigation: raw.navigation,
                      nativePageItems: raw.nativePageItems,
                  },
                  input.globalConfigRaw,
                  { random: () => 0 },
              )
            : undefined;
    const globalSource = (page: unknown): GlobalPageSource | undefined =>
        merged && isDict(page) ? merged.sources.get(page) : undefined;
    const pages = merged ? merged.pages : rawPages;
    const mergedPageNames = new Set(pages.map(scriptPageId));
    // the config manager drops sub pages named like a page of `pages`; for the global sub pages (the copy a
    // renamed link leaves behind among them) that is silent - the pages of the panel script keep their skip
    const subPages = merged
        ? merged.subPages.filter(p => {
              const source = globalSource(p);
              return !source || source.kind === 'linked' || !mergedPageNames.has(scriptPageId(p));
          })
        : rawSubPages;
    const scriptNavigation = merged ? merged.navigation : raw.navigation;
    // the ring the config manager builds from `pages`: every page with a name, `main` first
    const ring = pages.map(scriptPageId).filter(id => id !== '');
    const mainIndex = ring.indexOf(mainPageName);
    if (mainIndex > 0) {
        ring.unshift(...ring.splice(mainIndex, 1));
    }
    const mainPageNames = new Set(pages.filter(p => isDict(p) && p.type !== undefined).map(scriptPageId));
    // Pages of `pages` that are gone for this panel after the conversion: dead references (the admin entry
    // creates no page for the panel) and references without admin entry. Everything else either stays in
    // the script or becomes an admin page assigned to the panel.
    const deadRing = new Set<string>();
    for (const page of pages) {
        if (!isDict(page) || typeof page.type !== 'string' || typeof page.uniqueName !== 'string') {
            continue;
        }
        const type = page.type;
        let entry: PageConfigEntry | undefined;
        if (type === 'cardQR' || type === 'cardAlarm' || type === 'cardUnlock') {
            entry = input.pageConfig.find(e => e.uniqueName === page.uniqueName);
        } else if (type === 'cardPower' || type === 'cardChart' || type === 'cardLChart') {
            entry =
                type === 'cardPower'
                    ? findPowerEntryForScript(input.pageConfig, page.uniqueName)
                    : findChartEntryForScript(input.pageConfig, page.uniqueName);
            if (entry && (type === 'cardPower' ? isScriptNavigatedPower(entry) : isScriptNavigatedChart(entry))) {
                // gets the navigation of this panel (or stays in the script when that fails)
                continue;
            }
        } else {
            continue;
        }
        if (!entry || !entryCoversPanel(entry, panel.topic)) {
            deadRing.add(page.uniqueName);
        }
    }
    const survivingRing = ring.filter(name => !deadRing.has(name));
    // an admin entry already publishes `main` for this panel: the entry named `main` or any start page
    const mainPageCovered = input.pageConfig.some(
        e => (e.uniqueName === mainPageName || isMainPageEntry(e)) && entryCoversPanel(e, panel.topic),
    );
    /** navigation assignment of every converted page of `pages`, by uniqueName - its links are set after the loop */
    const ringAssignments = new Map<string, { topic: string; navigation?: NavigationLinks }>();
    const explicitNavigation = new Set(
        (Array.isArray(scriptNavigation) ? scriptNavigation : []).map(n => (isDict(n) ? String(n.name) : '')),
    );

    const skip = (uniqueName: string, type: string, reason: ConvertSkipReason, detail?: string): void => {
        plan.skipped.push(detail === undefined ? { uniqueName, type, reason } : { uniqueName, type, reason, detail });
    };

    /**
     * A convertible page as admin entry (the checks of every page included).
     *
     * @param page Page of the script.
     * @param isSub The page comes from `subPages`.
     * @param typeName Page type.
     * @param uniqueName Name of the page.
     */
    const convertPage = (
        page: Dict,
        isSub: boolean,
        typeName: string,
        uniqueName: string,
    ): { entry: PageConfigEntry; common: PageCommon } => {
        if (explicitNavigation.has(uniqueName)) {
            throw new ConvertError('fieldNotSupported', 'navigation: the script overrides the links of the page');
        }
        const common = pageCommon(page, isSub);
        let entry: PageConfigEntry;
        if (typeName === 'cardThermo2') {
            entry = convertThermo2Page(page, common, panel.topic);
        } else if (typeName === 'cardThermo') {
            entry = convertThermoPage(page, common, panel.topic);
        } else if (typeName === 'cardMedia') {
            entry = convertMediaPage(page, common, panel.topic);
        } else {
            entry = convertMenuPage(page, common, panel.topic);
        }
        return { entry, common };
    };

    /**
     * A page of the global script whose name exists in the admin (e.g. another panel took the same global page
     * over already). Same content: only this panel is assigned to the entry. Different content: a conflict the
     * user decides ({@link ConvertGlobalDecision}). An entry that is assigned to this panel already replaces the
     * global page at runtime - the page has nothing left to convert.
     *
     * @param page Page of the merged configuration.
     * @param isSub The page comes from `subPages`.
     * @param typeName Page type.
     * @param uniqueName Name of the page.
     * @param existing The admin entry of that name.
     * @param source Where the page comes from.
     */
    const handleExistingGlobal = (
        page: Dict,
        isSub: boolean,
        typeName: string,
        uniqueName: string,
        existing: PageConfigEntry,
        source: GlobalPageSource,
    ): void => {
        if (entryAssignedToPanel(existing, panel.topic)) {
            if (source.kind === 'linked') {
                plan.pages.push({
                    uniqueName,
                    type: typeName,
                    card: existing.card,
                    itemCount: 0,
                    navigation: {},
                    action: 'removeReference',
                    reason: 'adminAlreadyNavigated',
                    global: true,
                });
                remove(uniqueName, isSub, source);
            }
            return;
        }
        let converted: { entry: PageConfigEntry; common: PageCommon };
        try {
            converted = convertPage(page, isSub, typeName, uniqueName);
        } catch (error) {
            if (error instanceof ConvertError) {
                skip(uniqueName, typeName, error.reason, error.detail);
                return;
            }
            throw error;
        }
        const { entry, common } = converted;
        const differences = entryDifferences(entry, existing);
        let decision: ConvertGlobalDecision | 'identical' = 'identical';
        if (differences.length > 0) {
            decision = input.globalDecisions?.[uniqueName] ?? CONVERT_GLOBAL_DEFAULT_DECISION;
            conflicts.push({
                uniqueName,
                type: typeName,
                card: existing.card,
                decision,
                assignedPanels: (existing.navigationAssignment ?? []).map(a => a.topic),
                differences,
            });
            if (decision === 'skip') {
                skip(
                    uniqueName,
                    typeName,
                    'nameExists',
                    'the page of the global script differs from the admin entry - skipped by choice',
                );
                return;
            }
        }
        const assignment = { topic: panel.topic, navigation: common.navigation };
        const assignments = [...(existing.navigationAssignment ?? []).filter(a => a.topic !== panel.topic), assignment];
        const replacement: PageConfigEntry =
            decision === 'takeScript'
                ? { ...entry, navigationAssignment: assignments }
                : { ...existing, navigationAssignment: assignments };
        updatedPages = updatedPages.map(e => (e === existing ? replacement : e));
        if (!isSub) {
            ringAssignments.set(uniqueName, assignment);
        }
        plan.pages.push({
            uniqueName,
            type: typeName,
            card: replacement.card,
            itemCount: ('pageItems' in replacement ? replacement.pageItems : []).filter(
                i => !!i && !isEmptyAdminItem(i),
            ).length,
            navigation: common.navigation,
            action: decision === 'takeScript' ? 'create' : 'assignNavigation',
            global: true,
            existing: decision,
        });
        remove(uniqueName, isSub, source);
    };

    const handlePage = (page: unknown, isSub: boolean): void => {
        if (page === null || page === undefined || !isDict(page)) {
            return;
        }
        if ('globalLink' in page && page.globalLink) {
            const name = typeof page.uniqueName === 'string' ? page.uniqueName : page.globalLink;
            skip(
                typeof name === 'string' ? name : '',
                'globalLink',
                'unsupportedPageType',
                'page link of the global script',
            );
            return;
        }
        const type = page.type;
        if (type === undefined) {
            skip(scriptPageId(page), 'native', 'unsupportedPageType', 'native page');
            return;
        }
        const typeName = typeof type === 'string' ? type : 'unknown';
        const uniqueName = typeof page.uniqueName === 'string' ? page.uniqueName : '';
        if (!uniqueName) {
            skip('', typeName, 'fieldNotSupported', 'uniqueName missing');
            return;
        }
        const source = globalSource(page);
        if (source && (source.kind === 'navigationCopy' || merged?.copyRoots.has(uniqueName))) {
            // the runtime gives the copies random names on every start - nothing the admin could hold
            skip(
                uniqueName,
                typeName,
                'fieldNotSupported',
                'navigation copy of a renamed page of the global script (random name)',
            );
            return;
        }
        if (isSub && mainPageNames.has(uniqueName)) {
            // the config manager drops a sub page whose name is used by a page of `pages`
            skip(uniqueName, typeName, 'nameExists', 'a page of pages has the same name - the script ignores this one');
            return;
        }
        if (typeName === 'cardQR' || typeName === 'cardAlarm' || typeName === 'cardUnlock') {
            if (source && source.kind !== 'linked') {
                // a dead reference of the global script - nothing to remove from the panel script
                return;
            }
            plan.pages.push({
                uniqueName,
                type: typeName,
                card: typeName,
                itemCount: 0,
                navigation: {},
                action: 'removeReference',
                reason: 'adminOnly',
                ...(source ? { global: true } : {}),
            });
            remove(uniqueName, isSub, source);
            return;
        }
        if (typeName === 'cardPower' || typeName === 'cardChart' || typeName === 'cardLChart') {
            const entry =
                typeName === 'cardPower'
                    ? findPowerEntryForScript(updatedPages, uniqueName)
                    : findChartEntryForScript(updatedPages, uniqueName);
            if (!entry) {
                skip(uniqueName, typeName, 'adminEntryMissing', 'no admin entry with this name');
                return;
            }
            const navigated = typeName === 'cardPower' ? isScriptNavigatedPower(entry) : isScriptNavigatedChart(entry);
            if (!navigated) {
                if (source && source.kind !== 'linked') {
                    return;
                }
                plan.pages.push({
                    uniqueName,
                    type: typeName,
                    card: entry.card,
                    itemCount: 0,
                    navigation: {},
                    action: 'removeReference',
                    reason: 'adminAlreadyNavigated',
                    ...(source ? { global: true } : {}),
                });
                remove(uniqueName, isSub, source);
                return;
            }
            try {
                checkReferencePage(page, entry);
                if (explicitNavigation.has(uniqueName)) {
                    throw new ConvertError(
                        'fieldNotSupported',
                        'navigation: the script overrides the links of the page',
                    );
                }
                const navigation = pageNavigation(page, isSub);
                const assignment = { topic: panel.topic, navigation };
                const assigned: PageConfigEntry = dropScriptNavigation({
                    ...entry,
                    navigationAssignment: [...(entry.navigationAssignment ?? []), assignment],
                });
                updatedPages = updatedPages.map(e => (e === entry ? assigned : e));
                if (!isSub) {
                    ringAssignments.set(uniqueName, assignment);
                }
                plan.pages.push({
                    uniqueName,
                    type: typeName,
                    card: entry.card,
                    itemCount: 0,
                    navigation,
                    action: 'assignNavigation',
                    ...(source ? { global: true } : {}),
                });
                remove(uniqueName, isSub, source);
            } catch (error) {
                if (error instanceof ConvertError) {
                    skip(uniqueName, typeName, error.reason, error.detail);
                    return;
                }
                throw error;
            }
            return;
        }
        if (
            typeName !== 'cardGrid' &&
            typeName !== 'cardGrid2' &&
            typeName !== 'cardGrid3' &&
            typeName !== 'cardEntities' &&
            typeName !== 'cardSchedule' &&
            typeName !== 'cardThermo' &&
            typeName !== 'cardThermo2' &&
            typeName !== 'cardMedia'
        ) {
            skip(uniqueName, typeName, 'unsupportedPageType');
            return;
        }
        if (source) {
            const existing = updatedPages.find(e => e.uniqueName === uniqueName);
            if (existing) {
                handleExistingGlobal(page, isSub, typeName, uniqueName, existing, source);
                return;
            }
        }
        // The start page: when the name `main` is taken by an entry that creates no page for this panel,
        // the page is stored under its own name and published as `main` through `isMainPage`.
        let storedAs: string | undefined;
        if (usedNames.has(uniqueName)) {
            if (uniqueName !== mainPageName || mainPageCovered) {
                skip(uniqueName, typeName, 'nameExists');
                return;
            }
            storedAs = `${mainPageName}_${panel.name.replace(/[^A-Za-z0-9_-]/g, '_')}`;
            if (usedNames.has(storedAs)) {
                skip(uniqueName, typeName, 'nameExists', `${storedAs} exists as well`);
                return;
            }
        }
        try {
            const { entry, common } = convertPage(page, isSub, typeName, uniqueName);
            if (storedAs !== undefined) {
                entry.uniqueName = storedAs;
                entry.isMainPage = true;
            }
            newPages.push(entry);
            updatedPages.push(entry);
            usedNames.add(entry.uniqueName);
            remove(uniqueName, isSub, source);
            if (!isSub && entry.navigationAssignment) {
                ringAssignments.set(uniqueName, entry.navigationAssignment[0]);
            }
            const planned: ConvertPagePlan = {
                uniqueName,
                type: typeName,
                card: entry.card,
                itemCount: ('pageItems' in entry ? entry.pageItems : []).filter(i => !!i && !isEmptyAdminItem(i))
                    .length,
                navigation: common.navigation,
                action: 'create',
            };
            if (storedAs !== undefined) {
                planned.storedAs = storedAs;
            }
            if (source) {
                planned.global = true;
            }
            plan.pages.push(planned);
        } catch (error) {
            if (error instanceof ConvertError) {
                skip(uniqueName, typeName, error.reason, error.detail);
                return;
            }
            throw error;
        }
    };
    for (const page of pages) {
        handlePage(page, false);
    }
    // the links of the converted pages of `pages` - known only now that every page of the ring is classified
    for (const [uniqueName, assignment] of ringAssignments) {
        const links = ringLinks(uniqueName, survivingRing, name => !removedPages.has(name));
        assignment.navigation = links;
        const planned = plan.pages.find(p => p.uniqueName === uniqueName);
        if (planned) {
            planned.navigation = links;
        }
    }
    for (const page of subPages) {
        handlePage(page, true);
    }

    // screensaver
    // the native page items of the global script block the screensaver just like those of the panel script
    const screensaver = convertScreensaver(
        merged ? { ...input, raw: { ...raw, nativePageItems: merged.nativePageItems } } : input,
    );
    let screensaverEntry: ScreensaverEntry | undefined;
    let newNotify: ScreensaverNotifyConfig[] = [];
    if ('skipped' in screensaver) {
        plan.screensaverSkipped = screensaver.skipped;
    } else {
        screensaverEntry = screensaver.entry;
        newNotify = screensaver.notify;
        const entry = screensaver.entry;
        const count = (list: (ScreensaverItemConfig | undefined)[]): number => list.filter(i => !!i).length;
        plan.screensaver = {
            name: entry.name,
            mode: entry.mode,
            itemCount:
                (entry.favorit ? 1 : 0) +
                (entry.alternate ? 1 : 0) +
                count(entry.left) +
                count(entry.bottom) +
                count(entry.indicator) +
                (entry.mrIcon1 ? 1 : 0) +
                (entry.mrIcon2 ? 1 : 0),
            notifyCount: newNotify.length,
        };
    }

    // buttons
    const buttons: ScriptToAdminResult['buttons'] = {};
    const clearButtonsInScript: ('left' | 'right')[] = [];
    for (const [side, scriptValue, adminValue] of [
        ['left', raw.buttonLeft, panel.buttonLeft],
        ['right', raw.buttonRight, panel.buttonRight],
    ] as const) {
        try {
            const action = convertButton(scriptValue);
            if (action === undefined) {
                continue;
            }
            if (adminValue !== undefined) {
                plan.buttonsSkipped.push({ side, reason: 'buttonConfigured' });
                continue;
            }
            buttons[side] = action;
            plan.buttons[side] = action;
            clearButtonsInScript.push(side);
        } catch (error) {
            if (error instanceof ConvertError) {
                plan.buttonsSkipped.push({ side, reason: error.reason, detail: error.detail });
                continue;
            }
            throw error;
        }
    }

    // the script configuration after the conversion
    const cleanedRaw: ScriptConfig.Config = structuredClone(raw);
    const keep =
        (removed: Set<string>) =>
        (page: unknown): boolean => {
            const link = globalLinkName(page);
            if (link !== '') {
                return !removedLinks.has(link);
            }
            return !(isDict(page) && page.type !== undefined && removed.has(scriptPageId(page)));
        };
    cleanedRaw.pages = rawPages.filter(keep(removedPages));
    cleanedRaw.subPages = rawSubPages.filter(keep(removedSubPages));
    const clearScreensaverInScript = !!screensaverEntry;
    if (clearScreensaverInScript) {
        cleanedRaw.favoritScreensaverEntity = [];
        cleanedRaw.alternateScreensaverEntity = [];
        cleanedRaw.leftScreensaverEntity = [];
        cleanedRaw.bottomScreensaverEntity = [];
        cleanedRaw.indicatorScreensaverEntity = [];
        cleanedRaw.mrIcon1ScreensaverEntity = emptyMrIcon();
        cleanedRaw.mrIcon2ScreensaverEntity = emptyMrIcon();
        delete cleanedRaw.notifyScreensaverEntity;
        cleanedRaw.weatherAddDefaultItems = false;
        if (cleanedRaw.advancedOptions) {
            cleanedRaw.advancedOptions = {
                ...cleanedRaw.advancedOptions,
                screensaverSwipe: false,
                screensaverIndicatorButtons: false,
            };
        }
    }
    for (const side of clearButtonsInScript) {
        cleanedRaw[side === 'left' ? 'buttonLeft' : 'buttonRight'] = null;
    }

    if (conflicts.length > 0) {
        plan.conflicts = conflicts;
    }
    plan.nothingToDo =
        plan.pages.length === 0 && !screensaverEntry && buttons.left === undefined && buttons.right === undefined;

    return {
        plan,
        newPages,
        updatedPages,
        screensaverEntry,
        newNotify,
        buttons,
        cleanedRaw,
        removedFromScript,
        clearScreensaverInScript,
        clearButtonsInScript,
    };
}

/** the page plans of a plan, for callers that only need a quick look (admin dialog) */
export type { ConvertPagePlan, ConvertSkipped };
