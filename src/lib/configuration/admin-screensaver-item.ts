/**
 * Screensaver item of the admin -> ScreenSaverElement of the script configuration.
 *
 * Pure functions without adapter or page types - shared by the adapter (admin-screensaver.ts re-exports them)
 * and the admin (the raw data dialog starts with the script element of a standard item).
 */
import { isRawItemObject } from '../types/adminShareConfig';
import type { ScreensaverItemConfig, ScreensaverItemRaw } from '../types/adminShareConfig';
import { Color } from '../const/Color';
import { getScreensaverItemDefaultsByRole } from '../const/page-item-defaults';

/** areas of the screensaver whose items the entry stores (the script names of the arrays follow) */
export type ScreensaverScriptArea = 'favorit' | 'alternate' | 'left' | 'bottom' | 'indicator';

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
    if (item.raw) {
        return screensaverRawToScript(item.raw, area);
    }
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
        // the admin stores color_best as {r,g,b} - the script type accepts that form as well
        element.ScreensaverEntityIconColor = item.colorScale;
    } else if (item.colorState) {
        // the color comes from a state (config manager: getIconColor reads it)
        element.ScreensaverEntityIconColor = item.colorState;
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
 * A raw item of the admin as the ScreenSaverElement of the script configuration: format `script` is the
 * element itself, format `native` the runtime item wrapped as `{ type: 'native', native }`.
 *
 * The area is where the item is placed in the admin. The config manager places a template element and a
 * runtime item by their `modeScr` (it ignores the area of the list for them), so `modeScr` is set to the
 * area - a different `modeScr` in the entered configuration would show the item somewhere else than the
 * admin shows it. A script element (`type: 'script'`) takes the area from its list anyway.
 *
 * @param raw raw configuration of the item
 * @param area area of the screensaver the item is placed in
 */
export function screensaverRawToScript(
    raw: ScreensaverItemRaw,
    area: ScreensaverScriptArea,
): ScriptConfig.ScreenSaverElement {
    const config = structuredClone(raw.config);
    if (raw.format === 'native') {
        return { type: 'native', native: { ...config, modeScr: area } };
    }
    if (config.type === 'template') {
        config.modeScr = area;
    } else if (config.type === 'native' && isRawItemObject(config.native)) {
        config.native = { ...config.native, modeScr: area };
    }
    // not validated here: the config manager checks the element like one of the script
    return config as ScriptConfig.ScreenSaverElement;
}
