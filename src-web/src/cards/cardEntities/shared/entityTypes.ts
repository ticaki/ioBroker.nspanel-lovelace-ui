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

/** Metrics of a Nextion font of the HMI, in stage pixels */
export interface NextionFont {
    /** css font size of text: Noto Sans with a cap height of 0.714 em matches the pictures */
    fontSize: number;
    /** css size of a MDI glyph: the icons fill about 0.9 of the Nextion line height */
    iconSize: number;
    fontWeight: 400 | 700;
}

/**
 * The Nextion fonts 0-5 of the HMI (`fontSize` of a script item, `¬<n>` in the icon field):
 * 0 = 24 px text (noto-sans-24), 1 = 32 px icons and text (NotoSans-Regular), 2 = 32 px text
 * (noto-sans-32), 3 = 48 px icons and text, 4 = 80 px bold icons and text (NotoSans-Bold),
 * 5 = 128 px bold, ascii only. The Nextion size is the line height of the bitmap font; the
 * css sizes were measured on the emulator pictures (cap heights 13, 18, 17, 26, 43, 67 px).
 */
export const NEXTION_FONTS: readonly NextionFont[] = [
    { fontSize: 18, iconSize: 22, fontWeight: 400 },
    { fontSize: 25, iconSize: 29, fontWeight: 400 },
    { fontSize: 24, iconSize: 29, fontWeight: 400 },
    { fontSize: 36, iconSize: 43, fontWeight: 400 },
    { fontSize: 60, iconSize: 70, fontWeight: 700 },
    { fontSize: 94, iconSize: 112, fontWeight: 700 },
];

/** css font size of text in the Nextion fonts 0-5 */
export const NEXTION_FONT_SIZE: readonly number[] = NEXTION_FONTS.map(f => f.fontSize);

/**
 * The metrics of a Nextion font.
 *
 * @param font the font from the icon field (`¬<n>`), undefined when the field has none
 * @param fallback the font the HMI uses for the element without a `¬<n>`
 */
export function nextionFont(font: number | undefined, fallback: number): NextionFont {
    const index = font !== undefined && font >= 0 && font < NEXTION_FONTS.length ? font : fallback;
    return NEXTION_FONTS[index] ?? NEXTION_FONTS[1];
}

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
