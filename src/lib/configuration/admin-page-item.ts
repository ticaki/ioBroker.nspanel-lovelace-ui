/**
 * Admin page item -> script page item, without the config manager.
 *
 * Pure function, shared by the adapter (`convertAdminPageItemToPageItemConfig` in main.ts hands the result to
 * the config manager) and the admin (the raw data dialog starts with the script item of a standard item).
 * Must not import anything that pulls adapter code into the admin bundle.
 */
import { Color } from '../const/Color';
import {
    isIconColorScaleElement,
    isRawItemObject,
    pageItemRawFormat,
    type AdminPageItemConfig,
} from '../types/adminShareConfig';

/**
 * Hex color of the admin as RGB color of the script.
 *
 * @param color Hex color, '' / undefined for none.
 * @param onInvalidColor Called with a color that cannot be read.
 * @returns The script color, undefined for none or an invalid color.
 */
function hexToScriptColor(
    color: string | undefined,
    onInvalidColor: (color: string) => void,
): ScriptConfig.RGB | undefined {
    if (!color) {
        return undefined;
    }
    try {
        const c = Color.ConvertHexToRgb(color);
        return { red: c.r, green: c.g, blue: c.b };
    } catch {
        onInvalidColor(color);
        return undefined;
    }
}

/**
 * The script item of an admin page item, as the config manager gets it at runtime.
 *
 * A raw item (`useNative`) is taken as entered (a copy - the config manager changes the item it gets): format
 * `native` as `{ native }`, format `script` as the script item itself; the fields of the dialog are not applied
 * on top of it.
 *
 * @param preItem Item of the admin.
 * @param onInvalidColor Called with every color that cannot be read (the color is left out).
 * @returns The script item, undefined for a raw item without a configuration object.
 */
export function adminPageItemToScriptItem(
    preItem: AdminPageItemConfig,
    onInvalidColor: (color: string) => void = (): void => undefined,
): ScriptConfig.PageItem | undefined {
    let item: ScriptConfig.PageItem | undefined = undefined;

    if (preItem.useNative) {
        const raw = isRawItemObject(preItem.native) ? structuredClone(preItem.native) : undefined;
        if (raw) {
            item =
                pageItemRawFormat(preItem) === 'native'
                    ? { native: raw }
                    : // script format: not validated here, the config manager checks it like a script item
                      (raw as ScriptConfig.PageItem);
        }
    } else if (preItem.isNavigation) {
        item = {
            navigate: true,
            targetPage: preItem.targetPage ?? '',
            type: null,
            id: preItem.channelId.valueStateId,
        };
    } else {
        item = {
            type: null,
            id: preItem.channelId.valueStateId,
            // role button: pressed and then changes to targetPage (without navigate)
            targetPage: preItem.type !== 'custom' && preItem.targetPage ? preItem.targetPage : undefined,
        };
    }
    if (!item) {
        return undefined;
    }

    // a raw item brings all of its fields itself - the fields of the dialog are not applied on top
    if (!preItem.useNative && !('native' in item)) {
        item.type = preItem.type === 'custom' ? 'custom' : null;
        item.icon = preItem.trueIcon || undefined;
        item.icon2 = preItem.falseIcon || undefined;
        item.onColor = hexToScriptColor(preItem.trueColor, onInvalidColor);
        item.offColor = hexToScriptColor(preItem.falseColor, onInvalidColor);
        item.longPress = preItem.longPress || undefined;
        item.targetPageLongPress = preItem.targetPageLongPress || undefined;
        item.name = preItem.name || undefined;

        if (isIconColorScaleElement(preItem.scale)) {
            // color_best stays {r, g, b} - the script type accepts both forms, the config manager
            // normalizes to {r, g, b} anyway
            item.colorScale = { ...preItem.scale };
        }
        if (item.type !== 'custom') {
            item.fontSize =
                preItem.textSize || preItem.textSize == 0
                    ? (Number(preItem.textSize) as typeof preItem.textSize)
                    : undefined;
            if (!item.name && preItem.valueEntry) {
                item.name = preItem.valueEntry.valueStateId;
                item.suffixName = preItem.valueEntry.suffix ? preItem.valueEntry.suffix : undefined;
                item.prefixName = preItem.valueEntry.prefix ? preItem.valueEntry.prefix : undefined;
            }

            item.prefixValue = preItem.channelId?.prefix ? preItem.channelId.prefix : undefined;
            item.suffixValue = preItem.channelId?.suffix ? preItem.channelId.suffix : undefined;
            item.unit = preItem.channelId?.unit ? preItem.channelId.unit : undefined;
            item.useValue = preItem.useValue;
            item.inSel_Alias = preItem.inSel_Alias || undefined;
            item.modeList = preItem.modeList?.length ? preItem.modeList : undefined;
            // cardThermo2: heat circuit the item belongs to (page items only, not custom items)
            item.filter = typeof preItem.filter === 'number' ? preItem.filter : undefined;
            // condition for the value text (icon text of info, slider, temperature, ... items)
            item.useValueConditions = preItem.useValueConditions ? preItem.useValueConditions : undefined;
            // role volume: range of the volume slider (the config manager reads both for volume only)
            item.minValue = typeof preItem.minValue === 'number' ? preItem.minValue : undefined;
            item.maxValue = typeof preItem.maxValue === 'number' ? preItem.maxValue : undefined;
            // role blind: second text row of the shutter popup
            item.secondRow = preItem.secondRow ? preItem.secondRow : undefined;
            // light ranges and color mode (dimmer, ct, rgb, rgbSingle, hue) - the config manager reads
            // the numbers only when truthy and the color mode only as set / not set
            item.minValueBrightness = preItem.minValueBrightness ? preItem.minValueBrightness : undefined;
            item.maxValueBrightness = preItem.maxValueBrightness ? preItem.maxValueBrightness : undefined;
            item.minValueColorTemp = preItem.minValueColorTemp ? preItem.minValueColorTemp : undefined;
            item.maxValueColorTemp = preItem.maxValueColorTemp ? preItem.maxValueColorTemp : undefined;
            item.colormode = preItem.colormode === true ? 'xy' : undefined;
        }
    }
    return item;
}
