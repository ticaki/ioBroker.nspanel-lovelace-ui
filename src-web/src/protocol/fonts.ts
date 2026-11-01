/**
 * The Nextion fonts 0-5 of the HMI (6.0.2) - the font id the adapter appends to an icon/value
 * field as `¬<n>` (admin field `textSize`, script option `fontSize`). Verified on hardware:
 *
 * | id | Nextion px | content                                            |
 * |----|-----------:|----------------------------------------------------|
 * | 0  |         24 | text only (many special characters), no icons      |
 * | 1  |         32 | NotoSans: icons and text                           |
 * | 2  |         32 | text only (many special characters), no icons      |
 * | 3  |         48 | icons and text                                     |
 * | 4  |         80 | NotoSans bold: icons and text                      |
 * | 5  |        128 | bold, ASCII only: no icons, no `°`, no umlauts     |
 *
 * Characters a font does not contain are not drawn: an icon in font 0, 2 or 5 stays empty, a
 * value in font 5 loses every non-ASCII character. The same table for the admin lives in
 * `src/lib/types/adminShareConfig.ts` (`HMI_FONTS`).
 */

/** Metrics and content of a Nextion font of the HMI, in stage pixels */
export interface NextionFont {
    /** line height of the bitmap font on the HMI */
    px: number;
    /** css font size of text: Noto Sans with a cap height of 0.714 em matches the pictures */
    fontSize: number;
    /** css size of a MDI glyph: the icons fill about 0.9 of the Nextion line height */
    iconSize: number;
    fontWeight: 400 | 700;
    /** the font contains the icon glyphs */
    icons: boolean;
    /** the font only contains printable ASCII */
    asciiOnly: boolean;
}

/**
 * The css sizes were measured on the emulator pictures (cap heights 13, 18, 17, 26, 43, 67 px).
 */
export const NEXTION_FONTS: readonly NextionFont[] = [
    { px: 24, fontSize: 18, iconSize: 22, fontWeight: 400, icons: false, asciiOnly: false },
    { px: 32, fontSize: 25, iconSize: 29, fontWeight: 400, icons: true, asciiOnly: false },
    { px: 32, fontSize: 24, iconSize: 29, fontWeight: 400, icons: false, asciiOnly: false },
    { px: 48, fontSize: 36, iconSize: 43, fontWeight: 400, icons: true, asciiOnly: false },
    { px: 80, fontSize: 60, iconSize: 70, fontWeight: 700, icons: true, asciiOnly: false },
    { px: 128, fontSize: 94, iconSize: 112, fontWeight: 700, icons: false, asciiOnly: true },
];

/** css font size of text in the Nextion fonts 0-5 */
export const NEXTION_FONT_SIZE: readonly number[] = NEXTION_FONTS.map(f => f.fontSize);

/**
 * The metrics of a Nextion font.
 *
 * @param font the font from the field (`¬<n>`), undefined when the field has none
 * @param fallback the font the HMI uses for the element without a `¬<n>`
 */
export function nextionFont(font: number | undefined, fallback: number): NextionFont {
    const index = font !== undefined && font >= 0 && font < NEXTION_FONTS.length ? font : fallback;
    return NEXTION_FONTS[index] ?? NEXTION_FONTS[1];
}

export interface FontField {
    /** the field without the `¬<n>` suffix */
    body: string;
    /** font 0-5 from the suffix, undefined without one */
    font: number | undefined;
}

/**
 * Splits a trailing `¬<n>` (n = 0-5) off a field.
 *
 * @param field the icon/value field as the adapter sends it
 */
export function splitFontSuffix(field: string): FontField {
    const sized = /¬([0-5])$/.exec(field);
    return sized ? { body: field.slice(0, sized.index), font: Number(sized[1]) } : { body: field, font: undefined };
}

/**
 * True for a character of the icon font: private use area (MDI glyphs) and the own icons at
 * U+FD40-U+FDFF.
 *
 * @param ch one character (code point)
 */
export function isIconChar(ch: string): boolean {
    const cp = ch.codePointAt(0) ?? 0;
    return (cp >= 0xe000 && cp <= 0xf8ff) || (cp >= 0xfd40 && cp <= 0xfdff) || cp >= 0xf0000;
}

/**
 * The part of a text the font can draw, like the HMI: fonts without icons drop the icon glyphs,
 * the ASCII-only font drops everything outside of U+0020-U+007E. Without an explicit font the
 * text stays unchanged (the element font of the HMI draws what the card puts there).
 *
 * @param text the text
 * @param font the font from the `¬<n>` suffix, undefined without one
 */
export function drawableText(text: string, font: number | undefined): string {
    if (font === undefined) {
        return text;
    }
    const nf = NEXTION_FONTS[font];
    if (!nf) {
        return text;
    }
    let out = '';
    for (const ch of text) {
        if (nf.asciiOnly) {
            const cp = ch.codePointAt(0) ?? 0;
            if (cp >= 0x20 && cp <= 0x7e) {
                out += ch;
            }
        } else if (nf.icons || !isIconChar(ch)) {
            out += ch;
        }
    }
    return out;
}

/**
 * A field with `¬<n>` reduced to what the HMI draws: suffix removed, characters the font lacks
 * removed.
 *
 * @param field the icon/value field as the adapter sends it
 */
export function drawableField(field: string): FontField {
    const { body, font } = splitFontSuffix(field);
    return { body: drawableText(body, font), font };
}
