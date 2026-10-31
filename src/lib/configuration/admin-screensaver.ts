import { screensaverCardOfMode, screensaverNotifyOfEntry } from '../types/adminShareConfig';
import type {
    ScreensaverEntry,
    ScreensaverItemConfig,
    ScreensaverMrIconConfig,
    ScreensaverNotifyConfig,
} from '../types/adminShareConfig';
import type * as pages from '../types/pages';
import { Color } from '../const/Color';
import {
    hexToScriptRGB,
    screensaverItemToScript,
    type ScreensaverScriptArea,
    type ScreensaverStateInfo,
} from './admin-screensaver-item';

// pure item conversion, split off for the admin bundle - re-exported for the adapter code and the tests
export {
    hexToScriptRGB,
    screensaverFallbackIcon,
    screensaverItemToScript,
    screensaverRawToScript,
    type ScreensaverScriptArea,
    type ScreensaverStateInfo,
} from './admin-screensaver-item';

/** id the admin screensaver page gets - the script page is `scr`; the panel tells both apart by their origin */
export const adminScreensaverPageId = 'scr-admin';

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
        if (item && !item.raw && !item.template && item.state) {
            ids.add(item.state);
        }
    }
    return [...ids];
}

function allItems(entry: ScreensaverEntry): (ScreensaverItemConfig | undefined)[] {
    return [entry.favorit, entry.alternate, ...(entry.left ?? []), ...(entry.bottom ?? []), ...(entry.indicator ?? [])];
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
 * notification of the admin as the script element; undefined when it has no enabled state (the config
 * manager rejects a notification without one)
 *
 * @param cfg stored notification
 */
export function screensaverNotifyToScript(
    cfg: Omit<ScreensaverNotifyConfig, 'id'> | undefined,
): ScriptConfig.ScreenSaverNotifyElement | undefined {
    const enabled = (cfg?.enabled ?? []).map(e => e.trim()).filter(e => !!e);
    if (!cfg || enabled.length === 0) {
        return undefined;
    }
    const condition = cfg.visibleCondition?.trim();
    const element: ScriptConfig.ScreenSaverNotifyElement = {
        type: 'script',
        Priority: typeof cfg.priority === 'number' ? cfg.priority : 99,
        Headline: cfg.headline ?? '',
        Text: cfg.text ?? '',
        Enabled: enabled.length === 1 ? enabled[0] : enabled,
        ...(condition ? { VisibleCondition: condition } : {}),
    };
    if (cfg.headlinePrefix) {
        element.HeadlinePrefix = cfg.headlinePrefix;
    }
    if (cfg.headlineUnit) {
        element.HeadlineUnit = cfg.headlineUnit;
    }
    if (cfg.headlineIcon) {
        element.HeadlineIcon = cfg.headlineIcon;
    }
    if (cfg.textPrefix) {
        element.TextPrefix = cfg.textPrefix;
    }
    if (cfg.textSuffix) {
        element.TextSuffix = cfg.textSuffix;
    }
    if (cfg.dismissible) {
        element.isDismissiblePerEvent = true;
        if (cfg.dismissibleId?.trim()) {
            element.dismissibleIDGlobal = cfg.dismissibleId.trim();
        }
    }
    if (cfg.buzzer === true || (typeof cfg.buzzer === 'string' && cfg.buzzer.trim())) {
        element.buzzer = cfg.buzzer === true ? true : String(cfg.buzzer).trim();
    }
    return element;
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
 * @param notifyList shared notification list (`native.screensaverNotify`), the entry uses some of them by id
 */
export function buildScreensaverScriptConfig(
    entry: ScreensaverEntry,
    panelTopic: string,
    states: Record<string, ScreensaverStateInfo> = {},
    notifyList: readonly ScreensaverNotifyConfig[] = [],
): ScriptConfig.Config {
    const convert = (
        item: ScreensaverItemConfig | undefined,
        area: ScreensaverScriptArea,
    ): ScriptConfig.ScreenSaverElement | undefined =>
        item ? screensaverItemToScript(item, area, item.raw ? {} : (states[item.state] ?? {})) : undefined;
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
        notifyScreensaverEntity: screensaverNotifyOfEntry(entry, notifyList)
            .map(n => screensaverNotifyToScript(n))
            .filter((n): n is ScriptConfig.ScreenSaverNotifyElement => !!n),
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
