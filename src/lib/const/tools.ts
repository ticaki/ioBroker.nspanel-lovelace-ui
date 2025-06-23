import { isDataItem, type Dataitem } from '../classes/data-item';
import type {
    ColorEntryType,
    ColorEntryTypeNew,
    IconEntryType,
    MessageItem,
    PageItemLightDataItems,
    ScaledNumberType,
    TextEntryType,
    TextEntryType2,
    TextSizeEntryType,
    ValueEntryType,
} from '../types/type-pageItem';
import type { Library } from '../classes/library';
import { Color, type RGB } from '../const/Color';
import { Icons } from './icon_mapping';
import type { ChangeTypeOfKeys } from '../types/pages';
import {
    type IconColorElement,
    isIconColorScaleElement,
    isPartialColorScaleElement,
    isPartialIconSelectScaleElement,
    isValueDateFormat,
} from '../types/types';

export const messageItemDefault: MessageItem = {
    type: 'input_sel',
    intNameEntity: '',
    icon: '',
    iconColor: '',
    displayName: '',
    optionalValue: '',
};
export function ifValueEntryIs(
    i: ChangeTypeOfKeys<ValueEntryType, Dataitem | undefined>,
    type: ioBroker.CommonType,
): boolean {
    if (i && i.value && i.value.type) {
        return i.value.type === type;
    }
    return false;
}

export async function setValueEntry(
    i: ChangeTypeOfKeys<ValueEntryType, Dataitem | undefined>,
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
        await i.set.setStateAsync(res);
    } else if (i.value.writeable) {
        await i.value.setStateAsync(res);
    } else if (i.set || i.value) {
        const t = i.set || i.value;
        t.log.warn(t.name || '???' + ' is not writeable');
    }
}
export async function getValueEntryNumber(
    i: ChangeTypeOfKeys<ValueEntryType | ScaledNumberType, Dataitem | undefined>,
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
            n = Color.scale(n, 0, 100, min, max);
            if (oldValue !== false) {
                if (oldValue >= n) {
                    n = Math.floor(n);
                } else {
                    n = Math.ceil(n);
                }
            } else {
                n = Math.round(n);
            }
        }
    }
    return n;
}

export async function getScaledNumber(
    i: ChangeTypeOfKeys<ScaledNumberType, Dataitem | undefined>,
): Promise<number | null> {
    if (!i) {
        return null;
    }
    let nval = i.value && (await i.value.getNumber());
    if (nval != null) {
        nval = nval * ((i.factor && (await i.factor.getNumber())) ?? 1);
        if (i.minScale !== undefined && i.maxScale !== undefined) {
            const min = await i.minScale.getNumber();
            const max = await i.maxScale.getNumber();
            nval = getScaledNumberRaw(nval, min, max);
        }
        if ('negate' in i && i.negate) {
            const reverse = await i.negate.getBoolean();
            if (reverse != null && reverse) {
                nval = -nval;
            }
        }
        return nval;
    }
    return null;
}

export async function getTemperaturColorFromValue(
    i: ChangeTypeOfKeys<ScaledNumberType, Dataitem | undefined>,
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
    i: ChangeTypeOfKeys<ScaledNumberType, Dataitem | undefined>,
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
                    r = Math.round(Color.scale(nval, max, min, 0, 100));
                } else {
                    r = Math.round(Color.scale(nval, min, max, 100, 0));
                }
            }
        } else if (i.value && i.value.common && i.value.common.min !== undefined && i.value.common.max !== undefined) {
            if (mode === 'mired') {
                r = Math.round(Color.scale(nval, i.value.common.max, i.value.common.min, 0, 100));
            } else {
                r = Math.round(Color.scale(nval, i.value.common.min, i.value.common.max, 100, 0));
            }
        } else {
            if (mode === 'mired') {
                r = Math.round(Color.scale(nval, 500, 153, 0, 100));
            } else {
                r = Math.round(Color.scale(nval, 2200, 6500, 100, 0));
            }
        }

        return r !== null ? String(r) : null;
    }
    return null;
}
export async function setSliderCTFromValue(
    i: ChangeTypeOfKeys<ScaledNumberType, Dataitem | undefined>,
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
        await i.value.setStateAsync(r);
    } else {
        await i.value.setStateAsync(r);
    }
}

export async function setScaledNumber(
    i: ChangeTypeOfKeys<ScaledNumberType, Dataitem | undefined>,
    value: number,
): Promise<void> {
    if (!i || !i.value) {
        return;
    }
    const nval = (await i.value.getNumber()) ?? null;
    if (nval !== null) {
        if (i.minScale !== undefined && i.maxScale !== undefined) {
            value = getScaledNumberRaw(value, await i.minScale.getNumber(), await i.maxScale.getNumber(), value);
        }
        if (i.set && i.set.writeable) {
            await i.set.setStateAsync(value);
        } else if (nval !== value) {
            await i.value.setStateAsync(value);
        }
    }
}

export async function getIconEntryValue(
    i: ChangeTypeOfKeys<IconEntryType, Dataitem | undefined> | undefined,
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
            if (isPartialColorScaleElement(scale)) {
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
        const scale = isPartialIconSelectScaleElement(scaleM) ? scaleM : { valIcon_min: 0, valIcon_max: 1 };

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
        const scale = isPartialIconSelectScaleElement(scaleM) ? scaleM : { valIcon_min: 0, valIcon_max: 1 };
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
    i: ChangeTypeOfKeys<ColorEntryTypeNew, Dataitem | undefined> | undefined,
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
            if (isIconColorScaleElement(scale)) {
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
        if ((!cto || !cfrom) && isIconColorScaleElement(scale)) {
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
            if (isIconColorScaleElement(scale)) {
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
            } else if (isPartialColorScaleElement(scale)) {
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

function getLogFromIconScale(i: IconColorElement, factor: number): number {
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
    item: ChangeTypeOfKeys<IconEntryType, Dataitem | undefined> | undefined | RGB,
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
    i: ChangeTypeOfKeys<ColorEntryType, Dataitem | undefined> | undefined,
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
export async function getEntryTextOnOff(
    i: ChangeTypeOfKeys<TextEntryType | TextEntryType2, Dataitem | undefined> | undefined | Dataitem,
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
            //i = i as ChangeTypeOfKeys<TextEntryType, Dataitem>;
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

            return v2 === null ? (v === null ? null : value) : value2;
        }
        return v === null ? null : value;
    }
    return (await i.getString()) ?? null;
}

export async function getValueEntryBoolean(
    i: ChangeTypeOfKeys<ValueEntryType, Dataitem | undefined> | undefined,
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
function isTextSizeEntryType(F: any): F is ChangeTypeOfKeys<TextSizeEntryType, Dataitem | undefined> {
    return 'textSize' in (F as TextSizeEntryType);
}
export async function getValueEntryString(
    i: ChangeTypeOfKeys<ValueEntryType, Dataitem | undefined> | undefined,
    v: number | null = null,
): Promise<string | null> {
    if (!i || !i.value) {
        return null;
    }
    const nval = v !== null ? v : await getValueEntryNumber(i);
    const format = ((i.dateFormat && (await i.dateFormat.getObject())) as any) ?? null;
    if (nval !== null && nval !== undefined) {
        let res = '';
        if (isValueDateFormat(format)) {
            if (nval <= 0) {
                return null;
            }
            const temp = new Date(nval);
            if (isValidDate(temp)) {
                res = temp.toLocaleString(format.local, format.format);
            }
        } else {
            const d = ('decimal' in i && i.decimal && (await i.decimal.getNumber())) ?? null;
            if (d !== null && d !== false) {
                res = nval.toFixed(d);
            } else {
                res = String(nval);
            }
        }
        res = res + ((i.unit && (await i.unit.getString())) ?? i.value.common.unit ?? '');
        let opt = '';
        if (isTextSizeEntryType(i)) {
            opt = String((i.textSize && (await i.textSize.getNumber())) ?? '');
        }
        return res + (opt ? `¬${opt}` : '');
    }
    let res = await i.value.getString();
    let opt = '';
    if (res != null) {
        if (isValueDateFormat(format)) {
            const temp = new Date(res);
            if (isValidDate(temp)) {
                res = temp.toLocaleString(format.local, format.format);
            }
        }
        res += (i.unit && (await i.unit.getString())) ?? i.value.common.unit ?? '';
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
    i: ChangeTypeOfKeys<ValueEntryType, Dataitem | undefined> | undefined,
    v: number | null,
    space: number,
    unit: string | null = null,
    startFactor: number | null = null,
    minFactor: number = 0,
): Promise<{ value?: string; unit?: string | null; endFactor?: number }> {
    if (!i || !i.value) {
        return {};
    }
    const siPrefixes = [
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
    if ((v != null && unit == null) || (v == null && unit != null)) {
        throw new Error('v and unit must be both null or both not null');
    }
    let value = v != null ? v : await getValueEntryNumber(i, undefined, { ignoreDecimal: true });
    const cUnit = ((i.unit && (await i.unit.getString())) ?? i.value.common.unit ?? '').trim();

    const decimal = ('decimal' in i && i.decimal && (await i.decimal.getNumber())) ?? null;
    const fits = false;

    let res = '';
    //let opt = '';
    let unitFactor = startFactor ?? 0;

    if (value !== null && value !== undefined) {
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
        d = calSpace > 3 ? d : d - (3 - calSpace);
        d = d < 0 ? 0 : d;
        let endlessCouter = 0;
        while (!fits) {
            if (unitFactor > 5 || unitFactor < minFactor || endlessCouter++ > 10) {
                res = unitFactor < minFactor ? (value / 10 ** d / 10 ** (3 * ++unitFactor)).toFixed(d) : 'error';
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

export const getRGBfromRGBThree = async (item: PageItemLightDataItems['data']): Promise<RGB | null> => {
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
export const getDecfromRGBThree = async (item: PageItemLightDataItems['data']): Promise<string | null> => {
    const rgb = await getRGBfromRGBThree(item);
    if (!rgb) {
        return null;
    }
    return String(Color.rgb_dec565(rgb));
};
export const setRGBThreefromRGB = async (item: PageItemLightDataItems['data'], c: RGB): Promise<void> => {
    if (!item || !item.Red || !item.Green || !item.Blue) {
        return;
    }
    await item.Red.setStateAsync(c.r);
    await item.Green.setStateAsync(c.g);
    await item.Blue.setStateAsync(c.b);
};

export const getDecfromHue = async (item: PageItemLightDataItems['data']): Promise<string | null> => {
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

export const setHuefromRGB = async (item: PageItemLightDataItems['data'], c: RGB): Promise<void> => {
    if (!item || !item.hue || !Color.isRGB(c)) {
        return;
    }
    if (!item.hue.writeable) {
        return;
    }
    //let saturation = Math.abs((item.saturation && (await item.saturation.getNumber())) ?? 1);
    //if (saturation > 1) saturation = 1;
    const hue = Color.getHue(c.r, c.g, c.b);
    await item.hue.setStateAsync(hue);
};

export function formatInSelText(Text: string[] | string): string {
    if (Text === undefined || Text === null) {
        return `error`;
    }
    let splitText = Text;
    if (typeof splitText === 'string') {
        splitText = splitText.replaceAll('?', ' ').replaceAll('__', '_').replaceAll('_', ' ').split(' ');
    }

    let lengthLineOne = 0;
    const arrayLineOne: string[] = [];
    for (let i = 0; i < splitText.length; i++) {
        lengthLineOne += splitText[i].length + 1;
        if (lengthLineOne > 12) {
            break;
        } else {
            arrayLineOne[i] = splitText[i];
        }
    }
    const textLineOne = arrayLineOne.join(' ');
    const arrayLineTwo: string[] = [];
    for (let i = arrayLineOne.length; i < splitText.length; i++) {
        arrayLineTwo[i] = splitText[i];
    }
    let textLineTwo = arrayLineTwo.join(' ');
    if (textLineTwo.length > 12) {
        textLineTwo = `${textLineTwo.substring(0, 9)}...`;
    }
    if (textLineOne.length != 0) {
        return `${textLineOne}\r\n${textLineTwo.trim()}`;
    }
    return textLineTwo.trim();
}

/**
 * Create a part of the panel messsage for bottom icons. if event === '' u get '~~~~~~'.
 * default for event: input_sel
 *
 * @param msg {Partial<MessageItem>}
 * @returns string
 */
export function getItemMesssage(msg: Partial<MessageItem> | undefined): string {
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
    return getPayload(
        msg.type ?? messageItemDefault.type,
        id.join('?') ?? messageItemDefault.intNameEntity,
        msg.icon ?? messageItemDefault.icon,
        msg.iconColor ?? messageItemDefault.iconColor,
        msg.displayName ?? messageItemDefault.displayName,
        msg.optionalValue ?? messageItemDefault.optionalValue,
    );
}

export function getPayloadArray(s: any[]): string {
    return s.join('~');
}
export function getPayload(...s: string[]): string {
    return s.join('~');
}

/**
 * Deep assign of jsons, dont use this for Json with objects/classes
 *
 * @param def Json with json, number, boolean, strings, null, undefined
 * @param source Json with json, number, boolean, strings, null, undefined
 * @param level ignore
 * @returns Json with json, number, boolean, strings, null, undefined
 */
export function deepAssign(def: Record<any, any>, source: Record<any, any>, level: number = 0): any {
    if (level++ > 20) {
        throw new Error('Max level reached! Circulating object is suspected!');
    }
    for (const k in def) {
        if (typeof def[k] === 'object') {
            if (source[k] === null || def[k] === null) {
                source[k] = undefined;
                def[k] = undefined;
            } else if (source[k] !== undefined) {
                def[k] = deepAssign(def[k], source[k]);
            } else if (def[k] !== undefined) {
                source[k] = def[k];
            }
        } else if (source[k] === undefined) {
            source[k] = def[k];
        } else if (def[k] === undefined) {
            def[k] = source[k];
        }
    }
    for (const k in source) {
        if (typeof source[k] === 'object' && k in source) {
            if (source[k] === null) {
                source[k] = undefined;
                def[k] = undefined;
            } else if (def[k] === undefined) {
                def[k] = source[k];
            }
        }
    }
    return Object.assign(def, source);
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

export function getRegExp(s: string): RegExp | null {
    if (!s.startsWith('/')) {
        return null;
    }
    const i = s.lastIndexOf('/');
    const reg = s.slice(1, i);
    const arg = s.slice(i + 1);
    if (!reg) {
        return null;
    }
    return new RegExp(reg, arg ? arg : undefined);
}

export function insertLinebreak(text: string, lineLength: number): string {
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
}

export function isValidDate(d: Date): d is Date {
    if (!d) {
        return false;
    }
    return d instanceof Date && !isNaN(d.getTime());
}
