import { Dataitem } from '../classes/data-item';
import {
    ChangeTypeOfPageItem,
    IconEntryType,
    PageItemDataitems,
    TextEntryType,
    ValueEntryType,
} from '../types/type-pageItem';
import { ChangeTypeOfKeys } from './definition';
import { Library } from '../classes/library';
import { RGB } from '../types/Color';
import { White, hsv2rgb, rgb_dec565 } from './Color';

export async function getValueEntryNumber(
    i: ChangeTypeOfPageItem<ValueEntryType, Dataitem | undefined>,
): Promise<number | null> {
    if (!i) return null;
    const nval = i.value && (await i.value.getNumber());
    if (nval !== null && nval !== undefined) {
        return nval * ((i.factor && (await i.factor.getNumber())) ?? 1);
    }
    return null;
}

export async function getIconEntryValue(
    i: ChangeTypeOfPageItem<IconEntryType, Dataitem | undefined>,
    on: boolean,
    def: string,
    defOff: string | null = null,
): Promise<string> {
    if (!i) return on ? def : defOff ?? def;
    const icon = i.true.value && (await i.true.value.getString());
    if (!on) {
        return (i.false.value && (await i.false.value.getString())) ?? defOff ?? icon ?? def;
    }
    return icon ?? def;
}
export async function getIconEntryColor(
    i: ChangeTypeOfPageItem<IconEntryType, Dataitem | undefined>,
    on: boolean,
    def: string | number | RGB,
): Promise<string> {
    if (typeof def === 'number') def = String(def);
    else if (typeof def !== 'string') def = String(rgb_dec565(def));
    if (!i) return def;
    const icon = i.true.color && (await i.true.color.getRGBDec());
    if (!on) {
        return (i.false.color && (await i.false.color.getRGBDec())) ?? icon ?? def;
    }
    return icon ?? def;
}
export async function getValueEntryTextOnOff(
    i: ChangeTypeOfKeys<TextEntryType, Dataitem | undefined> | undefined,
    on: boolean,
): Promise<string | null> {
    if (!i) return null;
    const value = i.true && (await i.true.getString());
    if (!on) {
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
    const nval = await i.value.getNumber();
    if (nval !== null && nval !== undefined) {
        const res = nval * ((i.factor && (await i.factor.getNumber())) ?? 1);

        const d = i.decimal && (await i.decimal.getNumber());
        let result: string = String(res);
        if (d || d === 0) {
            result = res.toFixed(d);
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
