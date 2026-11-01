import { glyphToName } from '../../../icons/iconData';
import { drawableField } from '../../../protocol/fonts';
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
    /** the value clamped to `min`..`max` (position of the knob) */
    value: number;
    min: number;
    max: number;
    /** the value as the adapter sent it, the HMI shows it unchanged next to the slider */
    text: string;
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
    return { value, min, max, text: parts[0] ?? '' };
}

export interface IconField {
    /** the icon glyph, undefined when the field holds no icon */
    glyph: string | undefined;
    /** text after the glyph (role `combined`) or the whole field (role `textNotIcon`) */
    text: string;
    /** Nextion font 0-5 from a trailing `¬<n>` (item option `fontSize`), undefined without one */
    font?: number;
}

export { NEXTION_FONTS, NEXTION_FONT_SIZE, nextionFont, type NextionFont } from '../../../protocol/fonts';

/**
 * Splits the icon field: the adapter can send a glyph, plain text (a value shown instead of an
 * icon) or a glyph followed by text (role `combined`), each optionally followed by `¬<font>`.
 * With a `¬<font>` only what that font can draw is kept (see {@link drawableField}): an icon in
 * font 0, 2 or 5 is gone, font 5 drops every non-ASCII character.
 *
 * @param icon the field
 */
export function splitIconField(icon: string): IconField {
    const { body, font } = drawableField(icon);
    if (font !== undefined) {
        return { ...splitIconField(body), font };
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

/**
 * The `optionalValue` of a grid tile as text, empty when it is a state flag. The HMI does not
 * show it on the tiles (cardGrid3 draws the value in the icon field, `useValue`); kept for
 * tooltips and tests.
 *
 * @param entity the tile
 */
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
