import { screensaverCardOfMode } from '../types/adminShareConfig';
import type { ScreensaverEntry, ScreensaverItemConfig, ScreensaverMrIconConfig } from '../types/adminShareConfig';
import type * as pages from '../types/pages';
import { Color } from '../const/Color';
import { getScreensaverItemDefaultsByRole } from '../const/page-item-defaults';

/** areas of the screensaver whose items the entry stores (the script names of the arrays follow) */
export type ScreensaverScriptArea = 'favorit' | 'alternate' | 'left' | 'bottom' | 'indicator';

/** id the admin screensaver page gets - the script page is `scr`; the panel tells both apart by their origin */
export const adminScreensaverPageId = 'scr-admin';

/** icon of an item that has none and whose role knows no default - the panel cannot draw an item without icon */
export const screensaverFallbackIcon = 'help-circle-outline';

/**
 * what the adapter knows about the state of an item: its name stands in for a missing headline, the
 * role of its channel and its own role pick the default icons when the item has none
 * ({@link getScreensaverItemDefaultsByRole})
 */
export type ScreensaverStateInfo = { name?: string; role?: string; channelRole?: string };

/**
 * `#rrggbb` of the admin dialogs as the RGB object of the script configuration
 *
 * @param hex color of the admin ('#ff2600'), anything else gives undefined
 */
export function hexToScriptRGB(hex: string | undefined): ScriptConfig.RGB | undefined {
    if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
        return undefined;
    }
    const rgb = Color.ConvertHexToRgb(hex);
    return { red: rgb.r, green: rgb.g, blue: rgb.b };
}

/**
 * common.name of an object as plain text in the language of the adapter
 *
 * @param obj object of the state, null when missing
 * @param lang language of the adapter
 */
export function objectNameOf(obj: ioBroker.Object | null | undefined, lang: string): string {
    const raw: unknown = obj?.common?.name;
    if (typeof raw === 'string') {
        return raw;
    }
    if (raw && typeof raw === 'object') {
        const map = raw as Record<string, string>;
        return map[lang] || map.en || Object.values(map)[0] || '';
    }
    return '';
}

/**
 * ids of the states of the state items (templates excluded) - the adapter reads their name (headline
 * fallback, the item dialog promises "empty = name of the state") and role (default icons)
 *
 * @param entry screensaver entry of the admin
 */
export function screensaverStateIds(entry: ScreensaverEntry): string[] {
    const ids = new Set<string>();
    for (const item of allItems(entry)) {
        if (item && !item.template && item.state) {
            ids.add(item.state);
        }
    }
    return [...ids];
}

function allItems(entry: ScreensaverEntry): (ScreensaverItemConfig | undefined)[] {
    return [entry.favorit, entry.alternate, ...(entry.left ?? []), ...(entry.bottom ?? []), ...(entry.indicator ?? [])];
}

/**
 * One item of the admin as the ScreenSaverElement the script configuration uses - a template item
 * becomes the template element (`dpInit` = the object), a state item the script element with the
 * fields of the item dialog.
 *
 * An item without icons gets the default icons of the role of its state, without a known role the
 * {@link screensaverFallbackIcon} - the panel cannot draw an item without icon.
 *
 * @param item stored item
 * @param area area of the screensaver (modeScr of a template element; the action fields only count on an indicator)
 * @param info name and role of the state as the adapter read them
 */
export function screensaverItemToScript(
    item: ScreensaverItemConfig,
    area: ScreensaverScriptArea,
    info: ScreensaverStateInfo = {},
): ScriptConfig.ScreenSaverElement {
    if (item.template) {
        const element: ScriptConfig.ScreenSaverElement = {
            type: 'template',
            template: item.template,
            dpInit: item.state ?? '',
            modeScr: area,
        };
        if (item.enabled) {
            element.enabled = item.enabled;
        }
        if (item.visibleCondition) {
            element.visibleCondition = item.visibleCondition;
        }
        return element;
    }
    let iconOn = item.iconOn || null;
    let iconOff = item.iconOff || null;
    if (!iconOn && !item.iconSelect?.length) {
        const defaults =
            info.role || info.channelRole ? getScreensaverItemDefaultsByRole(info.role ?? '', info.channelRole) : null;
        iconOn = defaults?.iconOn || screensaverFallbackIcon;
        iconOff = iconOff || defaults?.iconOff || null;
    }
    const element: ScriptConfig.ScreenSaverElement = {
        type: 'script',
        ScreensaverEntity: item.state,
        ScreensaverEntityText: item.headline || info.name || '',
        ScreensaverEntityIconOn: iconOn,
        ScreensaverEntityIconOff: iconOff,
        ScreensaverEntityOnText: item.textOn ?? null,
        ScreensaverEntityOffText: item.textOff ?? null,
    };
    if (item.unit !== undefined) {
        element.ScreensaverEntityUnitText = item.unit;
    }
    if (typeof item.factor === 'number') {
        element.ScreensaverEntityFactor = item.factor;
    }
    if (typeof item.decimals === 'number') {
        element.ScreensaverEntityDecimalPlaces = item.decimals;
    }
    if (item.dateFormat) {
        element.ScreensaverEntityDateFormat = item.dateFormat;
    }
    const onColor = hexToScriptRGB(item.colorOn);
    if (onColor) {
        element.ScreensaverEntityOnColor = onColor;
    }
    const offColor = hexToScriptRGB(item.colorOff);
    if (offColor) {
        element.ScreensaverEntityOffColor = offColor;
    }
    if (item.colorScale) {
        // the admin stores color_best as {r,g,b} - the form the adapter works with (convertColorScaleBest
        // accepts both), only the script type spells it {red,green,blue}
        element.ScreensaverEntityIconColor = item.colorScale as unknown as ScriptConfig.IconColorElement;
    }
    if (item.iconSelect?.length) {
        element.ScreensaverEntityIconSelect = item.iconSelect.map(s => ({ icon: s.icon, value: s.value }));
    }
    if (item.enabled) {
        element.ScreensaverEntityEnabled = item.enabled;
    }
    if (item.visibleCondition) {
        element.ScreensaverEntityVisibleCondition = item.visibleCondition;
    }
    if (area === 'indicator' && item.action) {
        switch (item.action.kind) {
            case 'button':
                element.ScreensaverEntityButton = item.action.state || null;
                break;
            case 'switch':
                element.ScreensaverEntitySwitch = item.action.state || null;
                break;
            case 'navigate':
                element.ScreensaverEntityNaviToPage = item.action.page || null;
                break;
        }
    }
    return element;
}

/**
 * MR icon of the admin as the script element; undefined when the icon has neither a state nor a value
 *
 * @param cfg stored icon
 */
export function screensaverMrIconToScript(
    cfg: ScreensaverMrIconConfig | undefined,
): ScriptConfig.ScreenSaverMRElement | undefined {
    if (!cfg || (!cfg.entity && !cfg.value)) {
        return undefined;
    }
    const element = {
        type: 'script',
        ScreensaverEntity: cfg.entity || null,
        ScreensaverEntityIconOn: cfg.iconOn || null,
        ScreensaverEntityIconOff: cfg.iconOff || null,
        ScreensaverEntityIconSelect: cfg.iconSelect?.length
            ? Object.fromEntries(cfg.iconSelect.map(s => [s.value, s.icon]))
            : null,
        ScreensaverEntityValue: cfg.value || null,
        ScreensaverEntityValueDecimalPlace: typeof cfg.valueDecimals === 'number' ? cfg.valueDecimals : null,
        ScreensaverEntityValueUnit: cfg.valueUnit || null,
        ScreensaverEntityOnColor: hexToScriptRGB(cfg.onColor),
        ScreensaverEntityOffColor: hexToScriptRGB(cfg.offColor),
    };
    return element as unknown as ScriptConfig.ScreenSaverMRElement;
}

/**
 * The screensaver part of a script configuration built from an admin entry - the input of
 * `ConfigManager.getScreensaverConfig()`, so both ways share one code path.
 *
 * `weatherEntity` keeps the meaning of the entry: undefined = global setting of the instance (the
 * config manager applies `adapter.config.weatherEntity`), '' = no weather, otherwise the instance.
 *
 * @param entry screensaver entry of the admin
 * @param panelTopic topic of the panel the configuration is built for
 * @param states name and role of the states of the items ({@link screensaverStateIds})
 */
export function buildScreensaverScriptConfig(
    entry: ScreensaverEntry,
    panelTopic: string,
    states: Record<string, ScreensaverStateInfo> = {},
): ScriptConfig.Config {
    const convert = (
        item: ScreensaverItemConfig | undefined,
        area: ScreensaverScriptArea,
    ): ScriptConfig.ScreenSaverElement | undefined =>
        item ? screensaverItemToScript(item, area, states[item.state] ?? {}) : undefined;
    const present = (list: (ScriptConfig.ScreenSaverElement | undefined)[]): ScriptConfig.ScreenSaverElement[] =>
        list.filter((e): e is ScriptConfig.ScreenSaverElement => !!e);

    const favorit = convert(entry.favorit, 'favorit');
    const alternate = convert(entry.alternate, 'alternate');
    const config = {
        version: 'admin',
        scriptName: `admin.screensaver.${entry.name}`,
        panelName: undefined,
        panelTopic,
        weatherEntity: entry.weatherEntity as string,
        weatherAddDefaultItems: entry.weatherAddDefaultItems,
        favoritScreensaverEntity: favorit ? [favorit] : [],
        alternateScreensaverEntity: alternate ? [alternate] : [],
        // left and indicator keep their gaps - the panel places them by index
        leftScreensaverEntity: (entry.left ?? []).map(i => convert(i, 'left')),
        bottomScreensaverEntity: present((entry.bottom ?? []).map(i => convert(i, 'bottom'))),
        indicatorScreensaverEntity: (entry.indicator ?? []).map(i => convert(i, 'indicator')),
        mrIcon1ScreensaverEntity: screensaverMrIconToScript(entry.mrIcon1),
        mrIcon2ScreensaverEntity: screensaverMrIconToScript(entry.mrIcon2),
        notifyScreensaverEntity: undefined,
        // the colors the adapter resolves from its global settings (config manager getIconColor)
        defaultOnColor: Color.on,
        defaultOffColor: Color.off,
        defaultBackgroundColor: undefined,
        pages: [],
        subPages: [],
        buttonLeft: null,
        buttonRight: null,
        advancedOptions: {
            screensaverSwipe: !!entry.screensaverSwipe,
            screensaverIndicatorButtons: !!entry.screensaverIndicatorButtons,
        },
    };
    return config as unknown as ScriptConfig.Config;
}

/**
 * The entry a panel uses: the first one that lists its topic. Further entries with the same topic are
 * returned by name so the caller can warn.
 *
 * @param entries screensaver table of the instance
 * @param topic topic of the panel
 */
export function findScreensaverEntry(
    entries: readonly ScreensaverEntry[] | undefined,
    topic: string,
): { entry: ScreensaverEntry | undefined; others: string[] } {
    const hits = (entries ?? []).filter(e => e && Array.isArray(e.panels) && e.panels.includes(topic));
    return { entry: hits[0], others: hits.slice(1).map(e => e.name) };
}

type DateFormatItem = {
    modeScr?: string;
    data?: {
        entity2?: {
            dateFormat?: { type?: string; constVal?: { local?: string; format?: Intl.DateTimeFormatOptions } };
        };
    };
};

/**
 * Applies what the config manager cannot know from the script form onto the built page: the version
 * (mode and card), rotation time, swipe and indicator buttons, the id of the admin page and the clock /
 * date formats of the entry (undefined = global formats stay).
 *
 * @param page screensaver page as `getScreensaverConfig()` returns it
 * @param entry screensaver entry of the admin
 */
export function applyScreensaverEntry(page: pages.PageBase, entry: ScreensaverEntry): void {
    page.uniqueID = adminScreensaverPageId;
    const config = page.config as pages.PageBase['config'] & {
        card: string;
        mode: string;
        rotationTime: number;
        screensaverSwipe: boolean;
        screensaverIndicatorButtons: boolean;
    };
    config.card = screensaverCardOfMode(entry.mode);
    config.mode = entry.mode;
    config.rotationTime = typeof entry.rotationTime === 'number' && entry.rotationTime > 0 ? entry.rotationTime : 0;
    config.screensaverSwipe = !!entry.screensaverSwipe;
    config.screensaverIndicatorButtons = !!entry.screensaverIndicatorButtons;

    for (const raw of page.pageItems ?? []) {
        const item = raw as unknown as DateFormatItem;
        const format = item?.data?.entity2?.dateFormat?.constVal?.format;
        if (!format) {
            continue;
        }
        if (item.modeScr === 'time' && entry.clockFormat) {
            format.hour12 = entry.clockFormat === '12h';
        } else if (item.modeScr === 'date') {
            if (entry.weekdayFormat) {
                format.weekday = entry.weekdayFormat;
            }
            if (entry.monthFormat) {
                format.month = entry.monthFormat;
            }
            if (entry.yearFormat) {
                format.year = entry.yearFormat;
            }
        }
    }
}

/**
 * true for the screensaver page of a panel configuration (any of the three cards)
 *
 * @param page page of the panel configuration
 */
export function isScreensaverPage(page: { config?: { card?: string } } | undefined | null): boolean {
    const card = page?.config?.card;
    return card === 'screensaver' || card === 'screensaver2' || card === 'screensaver3';
}
