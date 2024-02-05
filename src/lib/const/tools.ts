import { Dataitem } from '../classes/data-item';
import {
    ChangeTypeOfPageItem,
    ColorEntryType,
    IconEntryType,
    PageItemDataitems,
    TextEntryType,
    ValueEntryType,
} from '../types/type-pageItem';
import { ChangeTypeOfKeys } from './definition';
import { Library } from '../classes/library';
import { RGB } from '../types/Color';
import { White, hsv2rgb, rgb_dec565, scale } from './Color';
import { Icons } from './icon_mapping';

export async function getValueEntryNumber(
    i: ChangeTypeOfPageItem<ValueEntryType, Dataitem | undefined>,
): Promise<number | null> {
    if (!i) return null;
    const nval = i.value && (await i.value.getNumber());
    if (nval !== null && nval !== undefined) {
        let res = nval * ((i.factor && (await i.factor.getNumber())) ?? 1);
        if (i.minScale !== undefined && i.maxScale !== undefined) {
            const min = await i.minScale.getNumber();
            const max = await i.maxScale.getNumber();
            if (min !== null && max !== null) {
                res = scale(res, min, max, 0, 100);
            }
        }
        return res;
    }
    return null;
}

export async function getIconEntryValue(
    i: ChangeTypeOfPageItem<IconEntryType, Dataitem | undefined>,
    on: boolean | null,
    def: string,
    defOff: string | null = null,
): Promise<string> {
    on = on ?? true;
    if (!i) return Icons.GetIcon(on ? def : defOff ?? def);
    const icon = i.true.value && (await i.true.value.getString());
    if (!on) {
        return Icons.GetIcon((i.false.value && (await i.false.value.getString())) ?? defOff ?? icon ?? def);
    }
    return Icons.GetIcon(icon ?? def);
}
export async function getIconEntryColor(
    i: ChangeTypeOfPageItem<IconEntryType, Dataitem | undefined>,
    on: boolean | null,
    def: string | RGB | number,
    defOff: string | RGB | null = null,
): Promise<string> {
    on = on ?? true;
    if (typeof def === 'number') def = String(def);
    else if (typeof def !== 'string') def = String(rgb_dec565(def));

    if (typeof defOff === 'number') defOff = String(def);
    else if (defOff === null) defOff = null;
    else if (typeof defOff !== 'string') defOff = String(rgb_dec565(defOff));

    if (!i) return def;
    const icon = i.true.color && (await i.true.color.getRGBDec());
    if (!on) {
        return (i.false.color && (await i.false.color.getRGBDec())) ?? defOff ?? icon ?? def;
    }
    return icon ?? def;
}

export async function getEntryColor(
    i: ChangeTypeOfPageItem<ColorEntryType, Dataitem | undefined>,
    value: boolean | number,
    def: string | number | RGB,
): Promise<string> {
    if (typeof def === 'number') def = String(def);
    else if (typeof def !== 'string') def = String(rgb_dec565(def));
    if (!i) return def;
    const icon = i.true && (await i.true.getRGBDec());
    if (!value) {
        return (i.false && (await i.false.getRGBDec())) ?? icon ?? def;
    }
    return icon ?? def;
}
export async function getEntryTextOnOff(
    i: ChangeTypeOfKeys<TextEntryType, Dataitem | undefined> | undefined,
    on: boolean | null,
): Promise<string | null> {
    if (!i) return null;
    const value = i.true && (await i.true.getString());
    if (!(on ?? true)) {
        return (i.false && (await i.false.getString())) ?? value ?? null;
    }
    return value ?? null;
}

export async function getValueEntryBoolean(
    i: ChangeTypeOfPageItem<ValueEntryType, Dataitem | undefined> | undefined,
): Promise<boolean | null> {
    if (!i) return null;
    const nval = i.value && (await i.value.getBoolean());
    if (nval !== undefined) {
        return nval;
    }
    return null;
}

export async function getValueEntryString(
    i: ChangeTypeOfPageItem<ValueEntryType, Dataitem | undefined> | undefined,
): Promise<string | null> {
    if (!i || !i.value) return null;
    const nval = await getValueEntryNumber(i);
    if (nval !== null && nval !== undefined) {
        const d = (i.decimal && (await i.decimal.getNumber())) ?? null;
        let result: string = String(nval);
        if (d !== null) {
            result = nval.toFixed(d);
        }
        return result + ((i.unit && (await i.unit.getString())) ?? '');
    }
    const res = await i.value.getString();
    if (res != null) res + ((i.unit && (await i.unit.getString())) ?? '');
    return res;
}

export function getTranslation(library: Library, key1: any | string, key2?: string): string {
    let result = key2 ?? key1;
    if (key2 !== undefined) {
        result = library.getLocalTranslation(key1, key2);
    }
    result = library.getTranslation(result || key1);
    return result;
}

export const getDecfromRGBThree = async (item: PageItemDataitems): Promise<string | null> => {
    if (!item) return String(rgb_dec565(White));
    const red = (item.data.Red && (await item.data.Red.getNumber())) ?? -1;
    const green = (item.data.Green && (await item.data.Green.getNumber())) ?? -1;
    const blue = (item.data.Blue && (await item.data.Blue.getNumber())) ?? -1;
    if (red === -1 || blue === -1 || green === -1) return null;
    return String(rgb_dec565({ red, green, blue }));
};

export const getDecfromHue = async (item: PageItemDataitems): Promise<string | null> => {
    if (!item || !item.data.hue) return null;
    const hue = await item.data.hue.getNumber();
    let saturation = Math.abs((item.data.saturation && (await item.data.saturation.getNumber())) ?? 1);
    if (saturation > 1) saturation = 1;
    if (hue === null) return null;
    const arr = hsv2rgb(hue, saturation, 1);
    return String(rgb_dec565({ red: arr[0], green: arr[1], blue: arr[2] }));
};

export function formatInSelText(Text: string[] | string): string {
    let splitText = Text;
    if (!Array.isArray(splitText)) splitText = splitText.split(' ');
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
        textLineTwo = textLineTwo.substring(0, 9) + '...';
    }
    if (textLineOne.length != 0) {
        return textLineOne + '\r\n' + textLineTwo.trim();
    } else {
        return textLineTwo.trim();
    }
}
