import { glyphToName } from '../../../icons/iconData';
import { toNumber } from '../../../protocol/split';
import type { Entity6 } from '../../../protocol/types';

/**
 * Popup the display opens for an entity type (`event,pageOpenDetail,<popup>,<id>`), `undefined`
 * when the type has no popup. See `PageItem.GeneratePopup` in the adapter.
 *
 * @param type the entity type
 */
export function popupForType(type: string): string | undefined {
    switch (type) {
        case 'light':
            return 'popupLight';
        case 'light2':
            return 'popupLightNew';
        case 'fan':
            return 'popupFan';
        case 'shutter':
            return 'popupShutter';
        case 'shutter2':
            return 'popupShutter2';
        case 'number':
            return 'popupSlider';
        case 'input_sel':
            return 'popupInSel';
        case 'timer':
            return 'popupTimer';
        default:
            return undefined;
    }
}

/** Entity types with an on/off toggle (`optionalValue` is `1` or `0`) */
export function hasToggle(type: string): boolean {
    return type === 'light' || type === 'light2' || type === 'switch' || type === 'fan';
}

/** `true` when `optionalValue` means "on" */
export function isOn(optionalValue: string): boolean {
    return optionalValue === '1';
}

export interface ShutterButton {
    /** icon glyph, empty = button hidden */
    icon: string;
    enabled: boolean;
}

export interface ShutterOptions {
    up: ShutterButton;
    stop: ShutterButton;
    down: ShutterButton;
}

/**
 * Parses the `optionalValue` of a shutter: `iconUp|iconStop|iconDown[|enable|disable|enable]`.
 * The three enable fields are optional (the HMI readme only knows the icons), missing = enabled.
 *
 * @param optionalValue the field
 */
export function parseShutterOptions(optionalValue: string): ShutterOptions {
    const parts = optionalValue.split('|');
    const button = (i: number): ShutterButton => {
        const icon = parts[i] ?? '';
        const flag = parts[i + 3];
        return { icon, enabled: icon !== '' && flag !== 'disable' };
    };
    return { up: button(0), stop: button(1), down: button(2) };
}

export interface NumberOptions {
    value: number;
    min: number;
    max: number;
}

/**
 * Parses the `optionalValue` of a number: `value|min|max`.
 *
 * @param optionalValue the field
 */
export function parseNumberOptions(optionalValue: string): NumberOptions {
    const parts = optionalValue.split('|');
    const min = toNumber(parts[1], 0);
    let max = toNumber(parts[2], 100);
    if (max <= min) {
        max = min + 1;
    }
    const value = Math.min(max, Math.max(min, toNumber(parts[0], min)));
    return { value, min, max };
}

export interface IconField {
    /** the icon glyph, undefined when the field holds no icon */
    glyph: string | undefined;
    /** text after the glyph (role `combined`) or the whole field (role `textNotIcon`) */
    text: string;
    /** Nextion font 0-5 from a trailing `¬<n>` (item option `fontSize`), undefined without one */
    font?: number;
}

/**
 * Pixel size of the Nextion fonts 0-5 (wiki ScriptConfig `fontSize`): 0 = 24 text, 1 = 32 icons,
 * 2 = 32 text, 3 = 48 icons, 4 = 80 icons, 5 = 128 ascii
 */
export const NEXTION_FONT_SIZE: readonly number[] = [24, 32, 32, 48, 80, 128];

/**
 * Splits the icon field: the adapter can send a glyph, plain text (a value shown instead of an
 * icon) or a glyph followed by text (role `combined`), each optionally followed by `¬<font>`.
 *
 * @param icon the field
 */
export function splitIconField(icon: string): IconField {
    const sized = /¬([0-5])$/.exec(icon);
    if (sized) {
        return { ...splitIconField(icon.slice(0, sized.index)), font: Number(sized[1]) };
    }
    if (icon === '') {
        return { glyph: undefined, text: '' };
    }
    const first = String.fromCodePoint(icon.codePointAt(0) ?? 0);
    if (glyphToName(first) !== undefined) {
        return { glyph: first, text: icon.slice(first.length) };
    }
    return { glyph: undefined, text: icon };
}

/** The `optionalValue` shown as text on a grid tile (cardGrid3), empty when it is a state flag */
export function gridValueText(entity: Entity6): string {
    switch (entity.type) {
        case 'number':
            return String(parseNumberOptions(entity.optionalValue).value);
        case 'text':
        case 'input_sel':
        case 'timer':
            return entity.optionalValue;
        case 'button':
            return entity.optionalValue === '1' || entity.optionalValue === '0' ? '' : entity.optionalValue;
        default:
            return '';
    }
}
