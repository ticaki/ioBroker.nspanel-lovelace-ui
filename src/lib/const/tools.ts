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
    isPartialIconColorScaleElement,
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
                res = Math.round(Color.scale(res, 100, 0, min, max));
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
        if (d !== null && d !== false) {
            res = Math.round(res * 10 ** d) / 10 ** d;
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
            n = Math.round(Color.scale(n, max, min, 0, 100));
        } else {
            n = Color.scale(n, 100, 0, min, max);
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
    if (nval !== null && nval !== undefined) {
        if (i.minScale !== undefined && i.maxScale !== undefined) {
            const min = await i.minScale.getNumber();
            const max = await i.maxScale.getNumber();
            nval = getScaledNumberRaw(nval, min, max);
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
    let nval = i.value && (await i.value.getNumber());
    const mode = i.mode && (await i.mode.getString());
    let kelvin = 3500;
    if (nval !== null && nval !== undefined) {
        if (i.minScale !== undefined && i.maxScale !== undefined) {
            const min = await i.minScale.getNumber();
            const max = await i.maxScale.getNumber();
            nval = getScaledNumberRaw(nval, min, max);
        }
        if (mode === 'mired') {
            kelvin = 10 ** 6 / nval;
        } else {
            kelvin = nval;
        }
        kelvin = kelvin > 7000 ? 7000 : kelvin < 1800 ? 1800 : kelvin;

        let r = Color.kelvinToRGB[Math.trunc(kelvin / 100) * 100];
        r = Color.darken(r, Color.scale(dimmer, 100, 0, 0, 1));
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
    let nval = i.value && (await i.value.getNumber());
    const mode = i.mode && (await i.mode.getString());
    let r = 3500;
    if (nval !== null && nval !== undefined) {
        if (i.minScale !== undefined && i.maxScale !== undefined) {
            const min = await i.minScale.getNumber();
            const max = await i.maxScale.getNumber();
            if (min !== null && max !== null) {
                nval = Math.round(Color.scale(nval, max, min, 1800, 7000));
            }
        } else if (i.value && i.value.common && i.value.common.min !== undefined && i.value.common.max !== undefined) {
            if (mode === 'mired') {
                nval = Math.round(Color.scale(nval, i.value.common.max, i.value.common.min, 1800, 7000));
            } else {
                nval = Math.round(Color.scale(nval, i.value.common.min, i.value.common.max, 1800, 7000));
            }
        }
        if (mode === 'mired') {
            r = 10 ** 6 / nval;
        } else {
            r = nval;
        }
        r = r > 7000 ? 7000 : r < 1800 ? 1800 : r;

        r = getScaledNumberRaw(r, 1800, 7000);
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
    const nval = (i.value && (await i.value.getNumber())) ?? null;
    const mode = i.mode && (await i.mode.getString());
    //value = 100 - value;
    if (nval !== null) {
        let r = getScaledNumberRaw(value, 1800, 7000, false);
        r = r > 7000 ? 7000 : r < 1800 ? 1800 : r;
        if (mode === 'mired') {
            r = 10 ** 6 / r;
        }
        if (i.minScale !== undefined && i.maxScale !== undefined) {
            const min = await i.minScale.getNumber();
            const max = await i.maxScale.getNumber();
            if (min !== null && max !== null) {
                r = Math.round(Color.scale(nval, 7000, 1800, min, max));
            }
        }
        if (i.value && i.value.common && i.value.common.min !== undefined && i.value.common.max !== undefined) {
            if (mode === 'mired') {
                r = Math.round(Color.scale(r, i.value.common.max, i.value.common.min, 1800, 7000));
            } else {
                r = Math.round(Color.scale(r, i.value.common.min, i.value.common.max, 1800, 7000));
            }
        }
        if (i.set && i.set.writeable) {
            await i.value.setStateAsync(r);
        } else if (nval !== value) {
            await i.value.setStateAsync(r);
        }
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
            if (isPartialIconColorScaleElement(scale)) {
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
        const scale = isPartialIconColorScaleElement(scaleM) ? scaleM : { val_min: 0, val_max: 1 };

        if (scale.val_min === 1 && scale.val_max === 0) {
            on = !on;
        }
        if (scale.val_best !== undefined && scale.val_best == 0) {
            on = !on;
        }
        if (!on) {
            return Icons.GetIcon(
                (i.false && i.false.value && (await i.false.value.getString())) || defOff || icon || def,
            );
        }
    } else if (typeof on === 'number') {
        const scale = isPartialIconColorScaleElement(scaleM) ? scaleM : { val_min: 0, val_max: 100 };
        const swap = scale.val_min > scale.val_max;
        const min = swap ? scale.val_max : scale.val_min;
        const max = swap ? scale.val_min : scale.val_max;
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
        if (cto && cfrom && scale) {
            let rColor: RGB = cto;
            if (isIconColorScaleElement(scale)) {
                let vMin = scale.val_min < value ? scale.val_min : value;
                let vMax = scale.val_max > value ? scale.val_max : value;
                if (vMax < vMin) {
                    const temp = vMax;
                    vMax = vMin;
                    vMin = temp;
                    const temp2 = cto;
                    cto = cfrom;
                    cfrom = temp2;
                }
                let vBest = scale.val_best ?? undefined;
                vBest = vBest !== undefined ? Math.min(vMax, Math.max(vMin, vBest)) : undefined;
                let factor = 1;
                const func =
                    scale.mode === 'hue'
                        ? Color.mixColorHue
                        : scale.mode === 'cie'
                          ? Color.mixColorCie
                          : Color.mixColor;
                if (vMin == vMax) {
                    rColor = cto;
                } else if (vBest === undefined) {
                    factor = (value - vMin) / (vMax - vMin);
                    factor = Math.min(1, Math.max(0, factor));
                    factor = getLogFromIconScale(scale, factor);
                    rColor = func(cfrom, cto, factor);
                } else if (value >= vBest) {
                    factor = 1 - (value - vBest) / (vMax - vBest);
                    factor = Math.min(1, Math.max(0, factor));
                    factor = getLogFromIconScale(scale, factor);
                    rColor = func(cfrom, cto, factor);
                } else {
                    factor = (value - vMin) / (vBest - vMin);
                    factor = Math.min(1, Math.max(0, factor));
                    factor = 1 - getLogFromIconScale(scale, 1 - factor);
                    rColor = func(cfrom, cto, factor);
                }
                return String(Color.rgb_dec565(rColor));
            } else if (isPartialIconColorScaleElement(scale)) {
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
    if (nval !== null && nval !== undefined) {
        const format = ((i.dateFormat && (await i.dateFormat.getObject())) as any) ?? null;
        let res = '';
        if (isValueDateFormat(format)) {
            if (nval <= 0) {
                return null;
            }
            res = new Date(nval).toLocaleString(format.local, format.format);
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
        res += (i.unit && (await i.unit.getString())) ?? i.value.common.unit ?? '';
        if (isTextSizeEntryType(i)) {
            opt = String((i.textSize && (await i.textSize.getNumber())) ?? '');
        }
        res += opt ? `¬${opt}` : '';
    }
    return res;
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
