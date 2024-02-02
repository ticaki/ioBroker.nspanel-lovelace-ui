import { Dataitem } from '../classes/data-item';
import { ChangeTypeOfPageItem, IconEntryType, TextEntryType, ValueEntryType } from '../types/pageItem';
import { ChangeTypeOfKeys } from './definition';
import { Library } from '../classes/library';

export async function getValueEntryNumber(
    i: ChangeTypeOfKeys<ValueEntryType, Dataitem | undefined>,
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
): Promise<string> {
    if (!i) return def;
    const icon = i.true.value && (await i.true.value.getString());
    if (!on) {
        return (i.false.value && (await i.false.value.getString())) ?? icon ?? def;
    }
    return icon ?? def;
}
export async function getIconEntryColor(
    i: ChangeTypeOfPageItem<IconEntryType, Dataitem | undefined>,
    on: boolean,
    def: string,
): Promise<string> {
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
    i: ChangeTypeOfKeys<ValueEntryType, Dataitem | undefined> | undefined,
): Promise<boolean | null> {
    if (!i) return null;
    const nval = i.value && (await i.value.getBoolean());
    if (nval !== undefined) {
        return nval;
    }
    return null;
}

export async function getValueEntryString(
    i: ChangeTypeOfKeys<ValueEntryType, Dataitem | undefined> | undefined,
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
