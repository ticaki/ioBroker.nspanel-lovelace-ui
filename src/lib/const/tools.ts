import { isDataItem, type Dataitem } from '../controller/data-item';
import type { Library } from '../controller/library';
import { Color, type RGB } from '../const/Color';
import { Icons } from './icon_mapping';
import type { ChangeTypeOfKeys } from '../types/pages';
import type * as types from '../types/types';
import * as globals from '../types/function-and-const';
import type { NSPanel } from '../types/NSPanel';

export const messageItemDefault: NSPanel.MessageItem = {
    type: 'input_sel',
    intNameEntity: '',
    icon: '',
    iconColor: '',
    displayName: '',
    optionalValue: '',
};
export function ifValueEntryIs(
    i: ChangeTypeOfKeys<NSPanel.ValueEntryType, Dataitem | undefined>,
    type: ioBroker.CommonType,
): boolean {
    if (i && i.value && i.value.type) {
        return i.value.type === type;
    }
    return false;
}

export async function setValueEntry(
    i: ChangeTypeOfKeys<NSPanel.ValueEntryType, Dataitem | undefined>,
    value: number | boolean | string,
    sca: boolean = true,
): Promise<void> {
    if (!i || !i.value) {
        return;
    }

    let res: number | boolean | string = value;
    if (typeof value === 'number') {
        res = value / ((i.factor && (await i.factor.getNumber())) ?? 1);
        if (sca && i.minScale !== undefined && i.maxScale !== undefined) {
            const min = await i.minScale.getNumber();
            const max = await i.maxScale.getNumber();
            if (min !== null && max !== null) {
                res = Math.round(Color.scale(res, 0, 100, min, max));
            }
        }
    }
    if (i.set && i.set.writeable) {
        await i.set.setState(res);
    } else if (i.value.writeable) {
        await i.value.setState(res);
    } else if (i.set || i.value) {
        const t = i.set || i.value;
        t.log.warn(`${t.name || '???'} is not writeable`);
    }
}
export async function getValueEntryNumber(
    i: ChangeTypeOfKeys<NSPanel.ValueEntryType | NSPanel.ScaledNumberType, Dataitem | undefined>,
    s: boolean = true,
    options?: { ignoreDecimal?: boolean },
): Promise<number | null> {
    if (!i) {
        return null;
    }
    const nval = i.value && (await i.value.getNumber());
    if (nval !== null && nval !== undefined) {
        let res = nval * ((i.factor && (await i.factor.getNumber())) ?? 1);
        if (s && i.minScale !== undefined && i.maxScale !== undefined) {
            const min = await i.minScale.getNumber();
            const max = await i.maxScale.getNumber();
            if (min !== null && max !== null) {
                res = Color.scale(res, min, max, 0, 100);
            }
        }
        const d = ('decimal' in i && i.decimal && (await i.decimal.getNumber())) ?? null;
        if (!options?.ignoreDecimal && d !== null && d !== false) {
            res = Math.round(res * 10 ** d) / 10 ** d;
        }
        if ('negate' in i && i.negate) {
            const reverse = await i.negate.getBoolean();
            if (reverse != null && reverse) {
                res = -res;
            }
        }
        return res;
    }
    return null;
}
function getScaledNumberRaw(
    n: number,
    min: number | null,
    max: number | null,
    oldValue: number | null | false = null,
): number {
    if (min !== null && max !== null) {
        if (oldValue === null) {
            n = Math.round(Color.scale(n, min, max, 0, 100));
        } else {
            n = Color.scale(n, min, max, 0, 100);
            /*if (oldValue !== false) {
                if (oldValue > n) {
                    n = Math.floor(n);
                } else {
                    n = Math.ceil(n);
                }
            } else */ {
                n = Math.round(n);
            }
        }
    }
    return n;
}

export async function getScaledNumber(
    i: ChangeTypeOfKeys<NSPanel.ScaledNumberType, Dataitem | undefined>,
): Promise<number | null> {
    if (!i) {
        return null;
    }
    let value = i.value && (await i.value.getNumber());
    if (value != null) {
        value = value * ((i.factor && (await i.factor.getNumber())) ?? 1);
        if (i.minScale !== undefined && i.maxScale !== undefined) {
            const min = await i.minScale.getNumber();
            const max = await i.maxScale.getNumber();
            value = getScaledNumberRaw(value, min, max);
        }

        if ('negate' in i && i.negate) {
            const reverse = await i.negate.getBoolean();
            if (reverse != null && reverse) {
                value = -value;
            }
        }
        return value;
    }
    return null;
}

export async function getTemperaturColorFromValue(
    i: ChangeTypeOfKeys<NSPanel.ScaledNumberType, Dataitem | undefined>,
    dimmer: number = 100,
): Promise<string | null> {
    if (!i) {
        return null;
    }
    const nval = i.value && (await i.value.getNumber());
    const mode = i.mode && (await i.mode.getString());
    let kelvin = 3500;
    if (nval !== null && nval !== undefined) {
        if (mode === 'mired') {
            kelvin = 10 ** 6 / nval;
        } else {
            kelvin = nval;
        }

        //kelvin = kelvin > 6500 ? 6500 : kelvin < 2200 ? 2200 : kelvin;

        let r = Color.kelvinToRGB[Math.trunc(kelvin / 100) * 100];
        if (r) {
            r = Color.brightness(r, Color.scale(dimmer, 0, 100, 0.3, 1));
        }
        return r ? String(Color.rgb_dec565(r)) : null;
    }
    return null;
}

export async function getSliderCTFromValue(
    i: ChangeTypeOfKeys<NSPanel.ScaledNumberType, Dataitem | undefined>,
): Promise<string | null> {
    if (!i) {
        return null;
    }
    const nval = i.value && (await i.value.getNumber());
    const mode = i.mode && (await i.mode.getString());
    let r = 3500;
    if (nval !== null && nval !== undefined) {
        if (i.minScale !== undefined && i.maxScale !== undefined) {
            const min = await i.minScale.getNumber();
            const max = await i.maxScale.getNumber();
            if (min !== null && max !== null) {
                if (mode === 'mired') {
                    r = Math.round(Color.scale(nval, min, max, 0, 100));
                } else {
                    r = Math.round(Color.scale(nval, min, max, 100, 0));
                }
            }
        } else if (i.value && i.value.common && i.value.common.min !== undefined && i.value.common.max !== undefined) {
            if (mode === 'mired') {
                r = Math.round(Color.scale(nval, i.value.common.min, i.value.common.max, 0, 100));
            } else {
                r = Math.round(Color.scale(nval, i.value.common.min, i.value.common.max, 100, 0));
            }
        } else {
            if (mode === 'mired') {
                r = Math.round(Color.scale(nval, 153, 500, 0, 100));
            } else {
                r = Math.round(Color.scale(nval, 2200, 6500, 100, 0));
            }
        }

        return r !== null ? String(r) : null;
    }
    return null;
}
export async function setSliderCTFromValue(
    i: ChangeTypeOfKeys<NSPanel.ScaledNumberType, Dataitem | undefined>,
    value: number,
): Promise<void> {
    if (!i || !i.value) {
        return;
    }
    const mode = i.mode && (await i.mode.getString());
    //value = 100 - value;
    let r = value;

    if (i.minScale !== undefined && i.maxScale !== undefined) {
        const min = await i.minScale.getNumber();
        const max = await i.maxScale.getNumber();
        if (min !== null && max !== null) {
            if (mode === 'mired') {
                r = Math.round(Color.scale(r, 0, 100, min, max));
            } else {
                r = Math.round(Color.scale(r, 0, 100, max, min));
            }
        }
    } else if (i.value && i.value.common && i.value.common.min !== undefined && i.value.common.max !== undefined) {
        if (mode === 'mired') {
            r = Math.round(Color.scale(r, 0, 100, i.value.common.max, i.value.common.min));
        } else {
            r = Math.round(Color.scale(r, 0, 100, i.value.common.min, i.value.common.max));
        }
    } else {
        if (mode === 'mired') {
            r = Math.round(Color.scale(r, 0, 100, 153, 500));
        } else {
            r = Math.round(Color.scale(r, 0, 100, 6500, 2200));
        }
    }
    if (i.set && i.set.writeable) {
        await i.value.setState(r);
    } else {
        await i.value.setState(r);
    }
}

export async function setScaledNumber(
    i: ChangeTypeOfKeys<NSPanel.ScaledNumberType, Dataitem | undefined>,
    value: number,
): Promise<void> {
    if (!i || (!i.set && !i.value)) {
        return;
    }

    if (i.minScale !== undefined && i.maxScale !== undefined) {
        value = Color.scale(value, 0, 100, (await i.minScale.getNumber()) ?? 0, (await i.maxScale.getNumber()) ?? 100);
    }
    if (i.set?.options.scale) {
        const scale = i.set.options.scale;
        value = Color.scale(value, 0, 100, scale.min, scale.max ?? 100);
    }
    if (i.set?.writeable) {
        await i.set.setState(value);
    } else if (i.value?.writeable) {
        await i.value.setState(value);
    }
}

export async function getIconEntryValue(
    i: ChangeTypeOfKeys<NSPanel.IconEntryType, Dataitem | undefined> | undefined,
    on: boolean | number | null,
    def: string,
    defOff: string | null = null,
    getText: boolean = false,
): Promise<string> {
    if (i === undefined) {
        return '';
    }
    on = on ?? true;
    if (!i) {
        return Icons.GetIcon(on ? def : defOff || def);
    }

    const text = getText ? (i.true && i.true.text && (await getValueEntryString(i.true.text))) || null : null;
    if (text !== null) {
        const textFalse = (i.false && i.false.text && (await getValueEntryString(i.false.text))) || null;
        if (typeof on === 'number' && textFalse !== null) {
            const scale = i.scale && (await i.scale.getObject());
            if (globals.isPartialColorScaleElement(scale)) {
                if ((scale.val_min && scale.val_min >= on) || (scale.val_max && scale.val_max <= on)) {
                    return text;
                }
                textFalse;
            }
        }
        if (!on) {
            return textFalse || text;
        }
        return text;
    }
    const icon = (i.true && i.true.value && (await i.true.value.getString())) || null;
    const scaleM = i.scale && (await i.scale.getObject());

    if (typeof on === 'boolean') {
        const scale = globals.isPartialIconSelectScaleElement(scaleM) ? scaleM : { valIcon_min: 0, valIcon_max: 1 };

        if (scale.valIcon_min === 1 && scale.valIcon_max === 0) {
            on = !on;
        }
        if (scale.valIcon_best !== undefined && scale.valIcon_best == 0) {
            on = !on;
        }
        if (!on) {
            return Icons.GetIcon(
                (i.false && i.false.value && (await i.false.value.getString())) || defOff || icon || def,
            );
        }
    } else if (typeof on === 'number') {
        const scale = globals.isPartialIconSelectScaleElement(scaleM) ? scaleM : { valIcon_min: 0, valIcon_max: 1 };
        const swap = scale.valIcon_min > scale.valIcon_max;
        const min = swap ? scale.valIcon_max : scale.valIcon_min;
        const max = swap ? scale.valIcon_min : scale.valIcon_max;
        if (min < on && max > on) {
            return Icons.GetIcon(
                (i.unstable && i.unstable.value && (await i.unstable.value.getString())) || icon || def,
            );
        } else if ((!swap && max > on) || (swap && min < on)) {
            return Icons.GetIcon(
                (i.false && i.false.value && (await i.false.value.getString())) || defOff || icon || def,
            );
        }
    }
    return Icons.GetIcon(icon ?? def);
}

export async function getIconEntryColor(
    i: ChangeTypeOfKeys<NSPanel.ColorEntryTypeBooleanStandard, Dataitem | undefined> | undefined,
    value: boolean | number | null,
    def: string | RGB | number,
    defOff: string | RGB | null = null,
): Promise<string> {
    value = value ?? true;
    if (typeof def === 'number') {
        def = Color.decToRgb(def);
    } else if (typeof def === 'string') {
        def = Color.decToRgb(parseInt(def));
    }

    if (typeof defOff === 'number') {
        defOff = Color.decToRgb(defOff);
    } else if (defOff === null) {
        defOff = null;
    } else if (typeof defOff === 'string') {
        defOff = Color.decToRgb(parseInt(defOff));
    }

    if (!i) {
        return String(Color.rgb_dec565(def));
    }
    if (typeof value === 'boolean') {
        const color = i.true && i.true.color && (await i.true.color.getRGBDec());
        const scale = i.scale && (await i.scale.getObject());
        if (scale) {
            if (globals.isIconColorScaleElement(scale)) {
                if (scale.val_min === 1 && scale.val_max === 0) {
                    value = !value;
                }
                if (scale.val_best !== undefined && scale.val_best == 0) {
                    value = !value;
                }
            }
        }
        if (!value) {
            return (
                (i.false && i.false.color && (await i.false.color.getRGBDec())) ??
                (defOff && String(Color.rgb_dec565(defOff))) ??
                color ??
                String(Color.rgb_dec565(def))
            );
        }
        return color ?? String(Color.rgb_dec565(def));
    } else if (typeof value === 'number') {
        let cto = i.true && i.true.color && (await i.true.color.getRGBValue());
        let cfrom = i.false && i.false.color && (await i.false.color.getRGBValue());
        const scale = i.scale && (await i.scale.getObject());
        if ((!cto || !cfrom) && globals.isIconColorScaleElement(scale)) {
            switch (scale.mode) {
                case 'hue':
                case 'cie':
                case 'mixed': {
                    break;
                }
                case 'triGrad':
                case 'triGradAnchor':
                case 'quadriGrad':
                case 'quadriGradAnchor': {
                    cto = cto || Color.HMIOn;
                    cfrom = cfrom || Color.HMIOff;
                }
            }
        }

        if (cto && cfrom && scale) {
            let rColor: RGB = cto;
            if (globals.isIconColorScaleElement(scale)) {
                let swap = false;
                let vMin = scale.val_min;
                let vMax = scale.val_max;
                if (vMax < vMin) {
                    const temp = vMax;
                    vMax = vMin;
                    vMin = temp;
                    const temp2 = cto;
                    cto = cfrom;
                    cfrom = temp2;
                    swap = true;
                }
                vMin = vMin < value ? vMin : value;
                vMax = vMax > value ? vMax : value;

                let vBest = scale.val_best ?? undefined;
                vBest = vBest !== undefined ? Math.min(vMax, Math.max(vMin, vBest)) : undefined;
                let factor = 1;
                let func = Color.mixColor;
                switch (scale.mode) {
                    case 'hue':
                        func = Color.mixColorHue;
                        break;
                    case 'cie':
                        func = Color.mixColorCie;
                        break;
                    case 'mixed':
                        func = Color.mixColor;
                        break;
                    case 'triGradAnchor':
                        if (scale.val_best !== undefined) {
                            func = Color.triGradAnchor;
                            break;
                        }
                    // eslint-disable-next-line no-fallthrough
                    case 'triGrad':
                        func = Color.triGradColorScale;
                        break;
                    case 'quadriGradAnchor':
                        if (scale.val_best !== undefined) {
                            func = Color.quadriGradAnchor;
                            break;
                        }
                    // eslint-disable-next-line no-fallthrough
                    case 'quadriGrad':
                        func = Color.quadriGradColorScale;
                        break;
                }
                if (vMin == vMax) {
                    rColor = cto;
                } else if (vBest === undefined) {
                    factor = (value - vMin) / (vMax - vMin);
                    factor = Math.min(1, Math.max(0, factor));
                    factor = getLogFromIconScale(scale, factor);
                    rColor = func(cfrom, cto, factor, { swap });
                } else if (value >= vBest) {
                    cfrom = scale.val_best !== undefined && scale.color_best ? scale.color_best : cfrom;
                    factor = 1 - (value - vBest) / (vMax - vBest);
                    factor = Math.min(1, Math.max(0, factor));
                    factor = getLogFromIconScale(scale, factor);
                    rColor = func(cfrom, cto, factor, { swap, anchorHigh: true });
                } else {
                    cto = scale.val_best !== undefined && scale.color_best ? scale.color_best : cto;
                    factor = (value - vMin) / (vBest - vMin);
                    factor = Math.min(1, Math.max(0, factor));
                    factor = 1 - getLogFromIconScale(scale, 1 - factor);
                    rColor = func(cfrom, cto, factor, { swap });
                }
                return String(Color.rgb_dec565(rColor));
            } else if (globals.isPartialColorScaleElement(scale)) {
                if ((scale.val_min && scale.val_min >= value) || (scale.val_max && scale.val_max <= value)) {
                    return String(Color.rgb_dec565(cto));
                }
                String(Color.rgb_dec565(cfrom));
            }
        }
        if (value) {
            if (cto) {
                return String(Color.rgb_dec565(cto));
            }
        } else if (cfrom) {
            return String(Color.rgb_dec565(cfrom));
        } else if (cto) {
            return String(Color.rgb_dec565(cto));
        }
    }
    return String(Color.rgb_dec565(def));
}

function getLogFromIconScale(i: types.IconColorElement, factor: number): number {
    if (i.log10 !== undefined) {
        if (i.log10 === 'max') {
            factor = factor * (90 / 10) + 1;
            factor = factor < 1 ? 1 : factor > 10 ? 10 : factor;
            factor = Math.log10(factor);
        } else {
            factor = (1 - factor) * (90 / 10) + 1;
            factor = factor < 1 ? 1 : factor > 10 ? 10 : factor;
            factor = Math.log10(factor);
            factor = 1 - factor;
        }
    }
    return factor;
}
export async function GetIconColor(
    item: ChangeTypeOfKeys<NSPanel.IconEntryType, Dataitem | undefined> | undefined | RGB,
    value: boolean | number | null,
    min: number | null = null,
    max: number | null = null,
    offColor: RGB | null = null,
): Promise<string> {
    // dimmer
    if (item === undefined) {
        return '';
    }
    if (Color.isRGB(item)) {
        const onColor = item;
        if (typeof value === 'number') {
            let val: number = typeof value === 'number' ? value : 0;
            const maxValue = max ?? 100;
            const minValue = min ?? 0;
            val = val > maxValue ? maxValue : val;
            val = val < minValue ? minValue : val;
            return String(
                Color.rgb_dec565(
                    !offColor
                        ? Color.darken(onColor ? onColor : Color.HMIOn, Color.scale(val, maxValue, minValue, 0, 1))
                        : Color.Interpolate(
                              offColor,
                              onColor ? onColor : Color.HMIOn,
                              Color.scale(val, maxValue, minValue, 0, 1),
                          ),
                ),
            );
        }
        if (value) {
            return String(Color.rgb_dec565(onColor ? onColor : Color.HMIOn));
        }
        return String(Color.rgb_dec565(offColor ? offColor : Color.HMIOff));
    }
    const onColor = item.true && item.true.color && (await item.true.color.getRGBValue());
    offColor = (item.false && item.false.color && (await item.false.color.getRGBValue())) || null;
    if (typeof value === 'number') {
        let val: number = typeof value === 'number' ? value : 0;
        const maxValue = ((item.maxBri && (await item.maxBri.getNumber())) || max) ?? 100;
        const minValue = ((item.minBri && (await item.minBri.getNumber())) || min) ?? 0;
        val = val > maxValue ? maxValue : val;
        val = val < minValue ? minValue : val;
        return String(
            Color.rgb_dec565(
                !offColor
                    ? Color.darken(onColor ? onColor : Color.HMIOn, Color.scale(val, maxValue, minValue, 0, 1))
                    : Color.Interpolate(
                          offColor,
                          onColor ? onColor : Color.HMIOn,
                          Color.scale(val, maxValue, minValue, 0, 1),
                      ),
            ),
        );
    }

    if (value) {
        return String(Color.rgb_dec565(onColor ? onColor : Color.HMIOn));
    }
    return String(Color.rgb_dec565(offColor ? offColor : Color.HMIOff));
}

export async function getEntryColor(
    i: ChangeTypeOfKeys<NSPanel.ColorEntryType, Dataitem | undefined> | undefined,
    value: boolean | number,
    def: string | number | RGB,
): Promise<string> {
    if (i === undefined) {
        return '';
    }
    if (typeof def === 'number') {
        def = String(def);
    } else if (typeof def !== 'string') {
        def = String(Color.rgb_dec565(def));
    }
    if (!i) {
        return def;
    }
    const color = i.true && (await i.true.getRGBDec());
    if (!value) {
        return (i.false && (await i.false.getRGBDec())) ?? color ?? def;
    }
    return color ?? def;
}

/**
 * Returns the display text for a boolean-like entry.
 *
 * - Supports both Dataitem and structured entries with `true` / `false` parts.
 * - If `on` is a number, values > 0 are treated as `true`.
 * - If the resolved value is `null` or `undefined`, `null` is returned to signal "no result".
 * - When `useCommon` is true, `common.states` is used for mapping state labels.
 *
 * @param i Entry or Dataitem that defines the "true" and "false" variants.
 * @param on Boolean or number to select side; `null`/`undefined` defaults to "true".
 * @param useCommon Whether to resolve values through `common.states` mapping.
 * @returns Resolved display text, or `null` if no meaningful result exists.
 */
export async function getEntryTextOnOff(
    i: ChangeTypeOfKeys<NSPanel.TextEntryType | NSPanel.TextEntryType2, Dataitem | undefined> | undefined | Dataitem,
    on: boolean | number | null,
    useCommon: boolean = false,
): Promise<string | null> {
    if (!i) {
        return null;
    }
    if (typeof on === 'number') {
        on = on > 0;
    }
    let value = '';
    let v: string | null = null;
    if (!isDataItem(i)) {
        if (isDataItem(i.true)) {
            v = (i.true && (await i.true.getString())) ?? null;
            if (useCommon) {
                const states =
                    ((i.true && i.true.common && i.true.common.states) as Record<string, string> | string[]) ?? null;
                if (states && v !== null && typeof states === 'object') {
                    if (!Array.isArray(states)) {
                        v = states[v] ?? v;
                    } else if (!isNaN(Number(v))) {
                        v = states[Number(v)] ?? v;
                    }
                }
            }
            value = v ?? '';
        } else {
            value = (i.true && i.true.prefix && (await i.true.prefix.getString())) ?? '';
            v = (i.true && i.true.value && (await i.true.value.getString())) ?? null;
            value += v ?? '';
            value += (i.true && i.true.suffix && (await i.true.suffix.getString())) ?? '';
        }

        if (!(on ?? true)) {
            let value2 = '';
            let v2: string | null = null;
            if (isDataItem(i.false)) {
                v2 = (i.false && (await i.false.getString())) ?? null;
                if (useCommon) {
                    const states =
                        ((i.false && i.false.common && i.false.common.states) as Record<string, string> | string[]) ??
                        null;
                    if (states && v2 !== null && typeof states === 'object') {
                        if (!Array.isArray(states)) {
                            v2 = states[v2] ?? v2;
                        } else if (!isNaN(Number(v2))) {
                            v2 = states[Number(v2)] ?? v2;
                        }
                    }
                }
                value2 = v2 ?? '';
            } else {
                value2 = (i.false && i.false.prefix && (await i.false.prefix.getString())) ?? '';
                v2 = (i.false && i.false.value && (await i.false.value.getString())) ?? null;
                value2 += v2 ?? '';
                value2 += (i.false && i.false.suffix && (await i.false.suffix.getString())) ?? '';
            }

            return v2 == null ? (v == null ? null : value) : value2;
        }

        return v == null ? null : value;
    }
    return (await i.getString()) ?? null;
}

export async function getEnabled(items: Dataitem | undefined | (Dataitem | undefined)[]): Promise<boolean | null> {
    if (!items) {
        return null;
    }
    if (Array.isArray(items)) {
        const tasts: Promise<boolean | null>[] = [];
        for (const item of items) {
            if (item) {
                tasts.push(item.getBoolean());
            }
        }
        const results = await Promise.all(tasts);
        return results.every(r => r);
    }
    return await items.getBoolean();
}

export async function getEnabledNumber(items: Dataitem | undefined | (Dataitem | undefined)[]): Promise<number | null> {
    if (!items) {
        return null;
    }
    if (Array.isArray(items)) {
        const tasts: Promise<number | null>[] = [];
        for (const item of items) {
            if (item) {
                tasts.push(item.getNumber());
            }
        }
        const n = await Promise.all(tasts);
        return n.reduce((a, b) => (a || 0) + (b || 0), 0);
    }
    return await items.getNumber();
}

export async function getValueEntryBoolean(
    i: ChangeTypeOfKeys<NSPanel.ValueEntryType, Dataitem | undefined> | undefined,
): Promise<boolean | null> {
    if (!i) {
        return null;
    }
    const nval = i.value && (await i.value.getBoolean());
    if (nval !== undefined) {
        return nval;
    }
    return null;
}
function isTextSizeEntryType(F: any): F is ChangeTypeOfKeys<NSPanel.TextSizeEntryType, Dataitem | undefined> {
    return 'textSize' in (F as NSPanel.TextSizeEntryType);
}
export async function getValueEntryString(
    i: ChangeTypeOfKeys<NSPanel.ValueEntryType, Dataitem | undefined> | undefined,
    v: number | null = null,
): Promise<string | null> {
    if (!i || !i.value) {
        return null;
    }
    const nval = v !== null ? v : await getValueEntryNumber(i);
    const format = ((i.dateFormat && (await i.dateFormat.getObject())) as any) ?? null;
    const unit = (await i.unit?.getString()) ?? i.value.common.unit ?? '';
    const prefix = (await i.prefix?.getString()) ?? '';
    const suffix = (await i.suffix?.getString()) ?? '';

    if (nval !== null && nval !== undefined) {
        let res = '';
        if (globals.isValueDateFormat(format)) {
            if (nval < 0) {
                return null;
            }
            const temp = new Date(nval);
            if (isValidDate(temp)) {
                res = temp.toLocaleString(format.local, format.format);
            }
        } else {
            const d = ('decimal' in i && i.decimal && (await i.decimal.getNumber())) ?? null;
            if (d !== null && d !== false) {
                res = nval.toLocaleString((format && format.local) ?? 'de-DE', {
                    minimumFractionDigits: d,
                    maximumFractionDigits: d,
                    useGrouping: false,
                });
            } else {
                res = nval.toLocaleString((format && format.local) ?? 'de-DE', {
                    useGrouping: false,
                });
            }
        }

        res = prefix + res + unit + suffix;
        let opt = '';
        if (isTextSizeEntryType(i)) {
            opt = String((i.textSize && (await i.textSize.getNumber())) ?? '');
        }
        return res + (opt ? `¬${opt}` : '');
    }
    let res = await i.value.getString();

    if (res != null) {
        if (globals.isValueDateFormat(format)) {
            const temp = new Date(res);
            if (isValidDate(temp)) {
                res = temp.toLocaleString(format.local, format.format);
            }
        }

        res = prefix + res + unit + suffix;
        let opt = '';
        if (isTextSizeEntryType(i)) {
            opt = String((i.textSize && (await i.textSize.getNumber())) ?? '');
        }
        res += opt ? `¬${opt}` : '';
    }
    return res;
}

/**
 * Aligns a given text to the specified size and alignment.
 * If the text length is greater than or equal to the specified size,
 * the original text is returned unchanged. Otherwise, the text is padded
 * with spaces to match the desired size and alignment.
 *
 * @param text - The input string to be aligned.
 * @param size - The total size of the resulting string after alignment.
 *               If the input text is shorter than this size, it will be padded with spaces.
 * @param align - The alignment type. Can be one of the following:
 *                - `'left'`: Aligns the text to the left and pads with spaces on the right.
 *                - `'right'`: Aligns the text to the right and pads with spaces on the left.
 *                - `'center'`: Centers the text and pads with spaces equally on both sides.
 *                             If the padding is uneven, the extra space is added to the right.
 * @returns A promise that resolves to the aligned string.
 * @example
 * ```typescript
 * const result = await alignText("Hello", 10, "left");
 * console.log(result); // "Hello     "
 *
 * const result = await alignText("Hello", 10, "right");
 * console.log(result); // "     Hello"
 *
 * const result = await alignText("Hello", 10, "center");
 * console.log(result); // "  Hello   "
 * ```
 */
export function alignText(text: string, size: number, align: 'left' | 'right' | 'center'): string {
    if (text.length >= size) {
        return text;
    }
    let text2 = '';
    const diff = size - text.length;
    if (align === 'left') {
        text2 = text + ' '.repeat(diff);
    } else if (align === 'right') {
        text2 = ' '.repeat(diff) + text;
    } else if (align === 'center') {
        const right = Math.floor(diff / 2);
        const left = diff - right;
        text2 = ' '.repeat(left) + text + ' '.repeat(right);
    }
    return text2;
}

export const siPrefixes = [
    // Unterhalb von 0
    { prefix: 'f', name: 'femto', factor: -5 },
    { prefix: 'p', name: 'pico', factor: -4 },
    { prefix: 'n', name: 'nano', factor: -3 },
    { prefix: 'μ', name: 'micro', factor: -2 },
    { prefix: 'm', name: 'milli', factor: -1 },

    // Oberhalb von 0
    { prefix: 'k', name: 'kilo', factor: 1 },
    { prefix: 'M', name: 'mega', factor: 2 },
    { prefix: 'G', name: 'giga', factor: 3 },
    { prefix: 'T', name: 'tera', factor: 4 },
    { prefix: 'P', name: 'peta', factor: 5 },
];
/**
 * Converts a numerical value into a human-readable format with an appropriate SI prefix and unit.
 * The function adjusts the value and unit dynamically based on the provided constraints such as space and decimal precision.
 *
 * @param i - An object containing the value entry and associated metadata. It can be undefined.
 * @param v - The numerical value to be formatted. If null, the value is retrieved from the `i` parameter.
 * @param space - The maximum number of characters allowed for the formatted value (excluding the unit).
 * @param unit - The unit of the value. If null, it is inferred from the `i` parameter or the SI prefix.
 * @param startFactor - The starting SI prefix factor (e.g., 0 for base unit, 1 for kilo, -1 for milli). Defaults to 0.
 * @param minFactor - The minimum SI prefix factor allowed. Defaults to 0.
 * @returns A promise that resolves to an object containing:
 * - `value`: The formatted value as a string, adjusted to fit within the specified space.
 * - `unit`: The unit of the value, including the appropriate SI prefix.
 * - `endFactor`: The final SI prefix factor used for formatting.
 * @throws An error if `v` and `unit` are not both null or both defined.
 * - The function uses a predefined list of SI prefixes to determine the appropriate scaling for the value.
 * - If the value cannot be formatted to fit within the specified space, the function attempts to adjust the SI prefix factor.
 * - The function ensures that the formatted value does not exceed the allowed space, including the unit and decimal precision.
 * - If the value is null or undefined, it is retrieved from the `i` parameter using the `getValueEntryNumber` function.
 * - The function supports both positive and negative SI prefixes (e.g., kilo, milli).
 * @example
 * ```typescript
 * const result = await getValueAutoUnit(
 *     someValueEntry,
 *     12345,
 *     6,
 *     null,
 *     0,
 *     -2
 * );
 * console.log(result);
 * // Output: { value: "12.3k", unit: "k", endFactor: 1 }
 * ```
 */
export async function getValueAutoUnit(
    i: ChangeTypeOfKeys<NSPanel.ValueEntryType, Dataitem | undefined> | undefined,
    v: number | null,
    space: number,
    unit: string | null = null,
    startFactor: number | null = null,
    minFactor: number = 0,
): Promise<{ value?: string; unit?: string | null; endFactor?: number }> {
    if (!i || !i.value) {
        return {};
    }

    if ((v != null && unit == null) || (v == null && unit != null)) {
        throw new Error('v and unit must be both null or both not null');
    }
    let value = v != null ? v : await getValueEntryNumber(i, undefined, { ignoreDecimal: true });
    const cUnit = ((i.unit && (await i.unit.getString())) ?? i.value.common.unit ?? '').trim();
    const decimal = ('decimal' in i && i.decimal && (await i.decimal.getNumber())) ?? null;
    const fits = false;
    if (minFactor === undefined || minFactor === null) {
        minFactor = 0;
        for (const p of siPrefixes) {
            if (cUnit.startsWith(p.prefix)) {
                minFactor = p.factor;
                break;
            }
        }
    }
    let res = '';
    //let opt = '';
    let unitFactor = startFactor == null || startFactor < minFactor ? minFactor : startFactor;

    if (value !== null && value !== undefined) {
        const isNegativ = value < 0;
        value = Math.abs(value);
        let factor = 0;
        if (unit == null && cUnit !== null) {
            for (const p of siPrefixes) {
                if (cUnit.startsWith(p.prefix)) {
                    unit = cUnit.substring(p.prefix.length);
                    factor = p.factor;
                    break;
                }
            }
            if (unit === null) {
                unit = cUnit;
            }
        }
        value *= 10 ** (3 * factor);
        let tempValue = value / 10 ** (3 * unitFactor);

        let d = decimal != null && decimal !== false ? decimal : 1;
        const calSpace = space - (d ? d + 1 : 0);
        //calSpace = calSpace > 4 ? 4 : calSpace;
        d = calSpace > 3 ? d : d - (3 - calSpace);
        d = d < 0 ? 0 : d;
        let endlessCouter = 0;
        while (!fits) {
            if (unitFactor > 5 || unitFactor < minFactor || endlessCouter++ > 10) {
                res = unitFactor < minFactor ? (value /*/ 10 ** d*/ / 10 ** (3 * ++unitFactor)).toFixed(d) : 'error';
                break;
            }
            tempValue = Math.round(tempValue * 10 ** d) / 10 ** d;
            if (Math.round(tempValue * 10 ** d) === 0 || tempValue < 1 * 10 ** (Math.floor(calSpace / 2) - 1)) {
                tempValue = value / 10 ** (3 * --unitFactor);
                continue;
            }

            res = tempValue.toFixed(d);
            if (res.length > space) {
                if (tempValue >= 10 ** calSpace) {
                    tempValue = value / 10 ** (3 * ++unitFactor);
                    continue;
                }
            } else {
                break;
            }
        }

        //if (isTextSizeEntryType(i)) {
        //    opt = String((i.textSize && (await i.textSize.getNumber())) ?? '');
        //}
        res = isNegativ ? `-${res}` : res;
    }
    const index = siPrefixes.findIndex(a => a.factor === unitFactor);
    unit = index !== -1 ? siPrefixes[index].prefix + unit : unit;

    return { value: res, unit: unit, endFactor: unitFactor };
}

export function getTranslation(library: Library, key1: any, key2?: string): string {
    let result = key2 ?? key1;
    if (key2 !== undefined) {
        result = library.getLocalTranslation(key1, key2);
    }
    result = library.getTranslation(result || key1);
    return result;
}

export const getRGBfromRGBThree = async (item: NSPanel.PageItemLightDataItems['data']): Promise<RGB | null> => {
    if (!item) {
        return Color.White;
    }
    const red = (item.Red && (await item.Red.getNumber())) ?? -1;
    const green = (item.Green && (await item.Green.getNumber())) ?? -1;
    const blue = (item.Blue && (await item.Blue.getNumber())) ?? -1;
    if (red === -1 || blue === -1 || green === -1) {
        return null;
    }
    return { r: red, g: green, b: blue };
};
export const getDecfromRGBThree = async (item: NSPanel.PageItemLightDataItems['data']): Promise<string | null> => {
    const rgb = await getRGBfromRGBThree(item);
    if (!rgb) {
        return null;
    }
    return String(Color.rgb_dec565(rgb));
};
export const setRGBThreefromRGB = async (item: NSPanel.PageItemLightDataItems['data'], c: RGB): Promise<void> => {
    if (!item || !item.Red || !item.Green || !item.Blue) {
        return;
    }
    await item.Red.setState(c.r);
    await item.Green.setState(c.g);
    await item.Blue.setState(c.b);
};

export const getDecfromHue = async (item: NSPanel.PageItemLightDataItems['data']): Promise<string | null> => {
    if (!item || !item.hue) {
        return null;
    }
    const hue = await item.hue.getNumber();
    let saturation = Math.abs((item.saturation && (await item.saturation.getNumber())) ?? 1);
    if (saturation > 1) {
        saturation = 1;
    }
    if (hue === null) {
        return null;
    }
    const arr = Color.hsv2rgb(hue, saturation, 1);
    return String(Color.rgb_dec565({ r: arr[0], g: arr[1], b: arr[2] }));
};

export const setHuefromRGB = async (item: NSPanel.PageItemLightDataItems['data'], c: RGB): Promise<void> => {
    if (!item || !item.hue || !Color.isRGB(c)) {
        return;
    }
    if (!item.hue.writeable) {
        return;
    }
    //let saturation = Math.abs((item.saturation && (await item.saturation.getNumber())) ?? 1);
    //if (saturation > 1) saturation = 1;
    const hue = Color.getHue(c.r, c.g, c.b);
    await item.hue.setState(hue);
};

/**
 * Formatiert Eingabetext (String oder Array) in max. zwei Zeilen mit Limit.
 * - Trennt nach 12 Zeichen für Zeile 1
 * - Zeile 2 ggf. auf 12 Zeichen gekürzt, mit "..."
 * - ersetzt ?, _ usw. für bessere Lesbarkeit
 *
 * @param text {string | string[] | null | undefined} Eingabetext
 */
export function formatInSelText(text: string | string[] | null | undefined): string {
    if (!text) {
        return 'error';
    }

    // Normalisieren → Array von Wörtern
    const words = Array.isArray(text)
        ? text
        : text.replaceAll('?', ' ').replaceAll('__', '_').replaceAll('_', ' ').split(/\s+/);

    const MAX_LINE = 12;
    const MAX_LINE2 = 12;
    const TRUNCATE = 9;

    // Zeile 1 aufbauen
    const line1: string[] = [];
    let len1 = 0;
    for (const word of words) {
        if (len1 + word.length + (line1.length ? 1 : 0) > MAX_LINE) {
            break;
        }
        line1.push(word);
        len1 += word.length + 1;
    }

    // Rest in Zeile 2
    const line2Words = words.slice(line1.length);
    let line2 = line2Words.join(' ');
    if (line2.length > MAX_LINE2) {
        line2 = `${line2.substring(0, TRUNCATE)}...`;
    }

    return line1.length > 0 ? `${line1.join(' ')}\r\n${line2.trim()}` : line2.trim();
}

/**
 * Create a part of the panel messsage for bottom icons. if event === '' u get '~~~~~~'.
 * default for event: input_sel
 *
 * @param msg {Partial<NSPanel.MessageItem>}
 * @returns string
 */
export function getItemMesssage(msg: Partial<NSPanel.MessageItem> | undefined): string {
    if (!msg || !msg.intNameEntity || !msg.type) {
        return '~~~~~';
    }
    const id: string[] = [];
    if (msg.mainId) {
        id.push(msg.mainId);
    }
    if (msg.subId) {
        id.push(msg.subId);
    }
    if (msg.intNameEntity) {
        id.push(msg.intNameEntity);
    }
    return getPayloadRemoveTilde(
        msg.type ?? messageItemDefault.type,
        id.join('?') ?? messageItemDefault.intNameEntity,
        msg.icon ?? messageItemDefault.icon,
        msg.iconColor ?? messageItemDefault.iconColor,
        msg.displayName ?? messageItemDefault.displayName.replaceAll('~', '-'),
        msg.optionalValue ?? messageItemDefault.optionalValue.replaceAll('~', '-'),
    );
}

export function getPayloadArrayRemoveTilde(s: any[]): string {
    return s.map(i => String(i).replaceAll('~', '-')).join('~');
}
export function getPayloadRemoveTilde(...s: string[]): string {
    return s.map(i => i.replaceAll('~', '-')).join('~');
}
export function getPayloadArray(s: any[]): string {
    return s.join('~');
}
export function getPayload(...s: string[]): string {
    return s.join('~');
}

// JSON-like value incl. RegExp support
type Jsonish = undefined | null | string | number | boolean | RegExp | Jsonish[] | { [k: string]: Jsonish };

/**
 * Strict plain-object check (no arrays, no RegExp, no Date, …).
 *
 * @param v Value to check
 */
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    Object.prototype.toString.call(v) === '[object Object]';

/**
 * Normalize `null` to `undefined` (your merging rules treat them equally).
 *
 * @param v     Value to normalize
 */
const nn = <T extends Jsonish>(v: T): Exclude<T, null> | undefined => (v === null ? undefined : v) as any;

/**
 * Detect DataItemsOptions-like objects that must be treated atomically (no deep merge).
 *
 * Rules (as specified):
 * - If `mode === 'auto'` then the object is atomic when it has at least one of:
 * - `regexp` OR `role` OR `commonType`
 * - If `mode` is NOT present:
 * - atomic if `type === 'const'` AND has `constVal`
 * - atomic if `type === 'state' | 'triggered'` AND has `dp` (string)
 *
 * @param o Value to check
 */
function isAtomicDataItem(o: unknown): boolean {
    if (!isPlainObject(o)) {
        return false;
    }

    const mode = (o as any).mode;
    const type = (o as any).type;

    if (mode === 'auto') {
        const hasQualifier = 'regexp' in (o as any) || 'role' in (o as any) || 'commonType' in (o as any);
        return !!hasQualifier;
    }
    if (type === 'const') {
        return 'constVal' in (o as any);
    }
    if (type === 'state' || type === 'triggered') {
        return typeof (o as any).dp === 'string';
    }

    return false;
}

/**
 * Deep-assign for JSON-like structures with special rules:
 * - `null` → `undefined`
 * - `source` overrides `def`; if `source === undefined`, keep `def` (clone)
 * - Plain objects deep-merge, EXCEPT atomic DataItemsOptions (replace whole object)
 * - Arrays: source replaces def
 * - Non-mutating; recursion depth guard
 *
 * @param def Default/base object
 * @param source Source object to merge on top
 * @param level Recursion level (for internal use)
 */
export function deepAssign(def: Record<any, any>, source: Record<any, any>, level: number = 0): any {
    if (level > 20) {
        throw new Error('Max level reached! Possible circular structure.');
    }

    def = nn(def) as Record<any, any>;
    source = nn(source) as Record<any, any>;

    if (source === undefined) {
        return cloneJson(def);
    }

    if (isPlainObject(def) && isPlainObject(source)) {
        // Atomic short-circuit (replace entire object)
        if (isAtomicDataItem(source) || isAtomicDataItem(def)) {
            return cloneJson(source ?? def);
        }

        const out: Record<string, Jsonish> = {};
        const keys = new Set([...Object.keys(def), ...Object.keys(source)]);
        for (const k of keys) {
            const dv = nn((def as Record<string, Jsonish>)[k]);
            const sv = nn((source as Record<string, Jsonish>)[k]);

            if (sv === undefined) {
                out[k] = cloneJson(dv);
            } else if (isPlainObject(dv) && isPlainObject(sv)) {
                out[k] = deepAssign(dv, sv, level + 1);
            } else if (Array.isArray(dv) && Array.isArray(sv)) {
                out[k] = cloneJson(sv); // arrays: replace
            } else {
                out[k] = cloneJson(sv);
            }
        }
        return out;
    }

    // Non-plain or mixed → source wins
    return cloneJson(source);
}

/**
 * Safe deep clone for Jsonish (supports RegExp).
 *
 * @param v Value to clone
 */
function cloneJson<T extends Jsonish>(v: any): any {
    v = nn(v) as T;

    if (v instanceof RegExp) {
        return new RegExp(v.source, v.flags) as any as T;
    }
    if (Array.isArray(v)) {
        return v.map(cloneJson) as unknown as T;
    }
    if (isPlainObject(v)) {
        const o: Record<string, Jsonish> = {};
        for (const k of Object.keys(v)) {
            o[k] = cloneJson((v as any)[k]);
        }
        return o as T;
    }
    return v;
}

export function getInternalDefaults(
    type: ioBroker.StateCommon['type'],
    role: ioBroker.StateCommon['role'],
    write: boolean = true,
): ioBroker.StateCommon {
    return {
        name: '',
        type: type,
        role: role,
        read: true,
        write: write,
    };
}

export function setTriggeredToState(theObject: any, exclude: string[]): void {
    if (theObject instanceof Array) {
        for (let i = 0; i < theObject.length; i++) {
            setTriggeredToState(theObject[i], exclude);
        }
    } else {
        for (const prop in theObject) {
            if (exclude.indexOf(prop) !== -1) {
                continue;
            }
            if (prop == 'type') {
                if (theObject[prop] === 'triggered') {
                    theObject[prop] = 'state';
                }
            }
            if (theObject[prop] instanceof Object || theObject[prop] instanceof Array) {
                setTriggeredToState(theObject[prop], exclude);
            }
        }
    }
}

export function getRegExp(input: string, options?: { startsWith?: boolean; endsWith?: boolean }): RegExp | null {
    if (!input) {
        return null;
    }
    if (input.startsWith('/') && input.lastIndexOf('/') > 0 && input.endsWith('/')) {
        const last = input.lastIndexOf('/');
        const pattern = input.slice(1, last);
        const flags = input.slice(last + 1);
        return new RegExp(pattern, flags || undefined);
    }

    // 2) beginnt mit '/', endet aber nicht mit '/' → als String behandeln + Warnung
    if (input.startsWith('/')) {
        console.warn(`getRegExp: string starts with '/' but not closed -> treating as literal string.`);
        input = input.slice(1); // führenden / wegnehmen, sonst doppelt escaped
    }

    // 3) normaler String → escapen + optionale Anchors
    let pattern = escapeRegex(input);

    // Falls kein expliziter Start/End-Anker verlangt → .+? einsetzen
    if (!options?.startsWith) {
        pattern = `.*?${pattern}`;
    } else {
        pattern = `^${pattern}`;
    }

    if (!options?.endsWith) {
        pattern = `${pattern}.*?`;
    } else {
        pattern = `${pattern}$`;
    }

    return new RegExp(pattern);
}

function escapeRegex(s: string): string {
    return s.replace(/[\\^$.*+?()[\]{}|/]/g, '\\$&');
}

/*export function insertLinebreak(text: string, lineLength: number): string {
    let counter = 0;
    let a = 0;
    let olda = a;
    while (counter++ < 30) {
        if (a + lineLength >= text.length) {
            break;
        }
        const n = text.lastIndexOf('\n', lineLength + a);
        if (n > a) {
            a = n;
            continue;
        }
        a = text.lastIndexOf(' ', lineLength + a);
        if (olda === a) {
            break;
        }
        olda = a;
        text = `${text.slice(0, a)}\n${text.slice(++a)}`;
    }
    return text;
}*/
export function insertLinebreak(text: string, lineLength: number): string {
    if (lineLength <= 0 || !text) {
        return text;
    }

    const result: string[] = [];
    const lines = text.split('\n'); // vorhandene Zeilen beibehalten

    for (const line of lines) {
        if (line.length <= lineLength) {
            result.push(line);
            continue;
        }

        let start = 0;
        const len = line.length;

        while (start < len) {
            const end = Math.min(start + lineLength, len);

            // Wenn wir am Zeilenende sind -> einfach pushen
            if (end === len) {
                result.push(line.slice(start));
                break;
            }

            // Versuche, an der letzten Leerstelle vor end zu umbrechen
            const breakPos = line.lastIndexOf(' ', end);
            if (breakPos <= start) {
                // Kein Leerzeichen im Bereich -> harter Umbruch
                result.push(line.slice(start, end));
                start = end;
            } else {
                // Weiches Wrapping an Leerzeichen
                result.push(line.slice(start, breakPos));
                start = breakPos + 1; // Leerzeichen überspringen
            }
        }
    }

    return result.join('\n');
}

export function isValidDate(d: Date): d is Date {
    if (!d) {
        return false;
    }
    return d instanceof Date && !isNaN(d.getTime());
}

export function getVersionAsNumber(version: string): number {
    return version
        .split('.')
        .map((item, i) => parseInt(item) * Math.pow(1000, 2 - i))
        .reduce((a, b) => a + b);
}

export function isVersionGreaterOrEqual(a: string, b: string): boolean {
    const aNum = getVersionAsNumber(a);
    const bNum = getVersionAsNumber(b);
    return aNum >= bNum;
}
export function buildScrollingText(
    title: string,
    options: {
        maxSize?: number;
        prefix?: string;
        suffix?: string;
        sep?: string;
        rightFixed?: string;
        gap?: string;
        pos?: number;
        anchorRatio?: number; // 0..1, wo im linken Fenster der Titelanfang initial steht (Default 0.25)
    } = {},
): { text: string; nextPos: number } {
    const {
        maxSize = 35,
        prefix = '',
        suffix = '',
        sep = ' ',
        rightFixed,
        gap = '      ',
        pos = 0,
        anchorRatio = 0.38,
    } = options;

    const right = rightFixed ?? suffix ?? '';
    const useSep = right.length > 0 ? sep : '';
    const leftAvailable = maxSize - prefix.length - useSep.length - right.length;

    if (leftAvailable <= 0) {
        const fixed = `${prefix}${useSep}${right}`;
        return { text: fixed.slice(-maxSize), nextPos: pos };
    }

    // Kurz: mittig ausrichten
    if (title.length <= leftAvailable) {
        const extra = leftAvailable - title.length;
        const leftPad = Math.floor(extra / 2);
        const rightPad = extra - leftPad;
        const left = ' '.repeat(leftPad) + title + ' '.repeat(rightPad);
        return { text: `${prefix}${left}${useSep}${right}`, nextPos: pos };
    }

    // Lang: Anfang des Titels bei ~anchorRatio der Fensterbreite platzieren
    // Zyklus: Lücke links + Titel + Lücke rechts
    const cycle = gap + title + gap;
    const cycleLen = cycle.length;
    const doubled = cycle + cycle;

    const titleStart = gap.length; // Index des ersten Titelzeichens im cycle
    const anchor = Math.max(0, Math.min(1, anchorRatio));
    const viewAnchor = Math.floor(leftAvailable * anchor); // Position im Fenster für den Titelanfang
    const baseOff = (titleStart - viewAnchor + cycleLen) % cycleLen;

    const posNorm = (pos + baseOff) % cycleLen;
    const left = doubled.substr(posNorm, leftAvailable);

    const full = `${prefix}${left}${useSep}${right}`;
    const nextPos = (pos + 1) % cycleLen;

    return { text: full, nextPos };
}

/**
 * Convert a duration in milliseconds to a human-readable time string.
 *
 * Format rules:
 * - Hours: unbounded (0 .. ∞), no leading zeros (e.g., "0", "1", "26")
 * - Minutes: at least one digit; no leading zero if < 10 (e.g., "3", "12")
 * - Seconds: always two digits (e.g., "05", "40")
 * - If hours === 0, the output is "M:SS" (e.g., "1:05", "12:00")
 * - If hours > 0, the output is "H:MM:SS" (e.g., "1:01:40", "26:00:00")
 *
 * Edge cases:
 * - Negative inputs are treated as 0.
 * - Non-finite inputs (NaN, Infinity) result in "0:00".
 *
 * @param ms Duration in milliseconds.
 * @returns A time string formatted as "M:SS" or "H:MM:SS" per the rules above.
 * @example
 * formatHMS(65_000);           // "1:05"
 * formatHMS(3_700_000);        // "1:01:40"
 * formatHMS(26 * 3_600_000);   // "26:00:00"
 * formatHMS(-500);             // "0:00"
 * formatHMS(Number.NaN);       // "0:00"
 */
export function formatHMS(ms: number): string {
    if (!Number.isFinite(ms) || ms < 0) {
        ms = 0;
    }

    const totalSeconds: number = Math.floor(ms / 1000);
    const hours: number = Math.floor(totalSeconds / 3600);
    const minutes: number = Math.floor((totalSeconds % 3600) / 60);
    const seconds: number = totalSeconds % 60;

    const minutesStr = String(minutes); // minutes: no leading zero
    const secondsStr: string = String(seconds).padStart(2, '0'); // seconds: always 2 digits

    if (hours > 0) {
        // hours: unbounded, no leading zeros; minutes padded to 2 when hours are present
        return `${hours}:${minutesStr.padStart(2, '0')}:${secondsStr}`;
    }
    // hours === 0 -> "M:SS"
    return `${minutesStr}:${secondsStr}`;
}

export function getStringFromStringOrTranslated(
    adapter: ioBroker.Adapter,
    input: ioBroker.StringOrTranslated,
    def?: string,
): string {
    if (typeof input === 'string') {
        return input;
    }
    if (adapter.language && input[adapter.language]) {
        return input[adapter.language] as string;
    }
    if (input.en) {
        return input.en;
    }
    return def ?? ``;
}

export default formatHMS;
