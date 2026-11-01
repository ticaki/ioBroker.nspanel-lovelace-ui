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
    /** css font size of text: Noto Sans with a cap height of 0.714 em matches the bitmap font */
    fontSize: number;
    /** css size of a MDI glyph (= advance of an icon glyph in the font file) */
    iconSize: number;
    fontWeight: 400 | 700;
    /** the font contains the icon glyphs */
    icons: boolean;
    /** the font only contains printable ASCII */
    asciiOnly: boolean;
    /** first row of a digit/capital in the bitmap line (0 = top of the line) */
    capTop: number;
    /** top of an icon glyph box of {@link iconSize} in the bitmap line */
    iconTop: number;
}

/**
 * Measured on the font files of HMI 6.0.2 (`HMI/nspanel-v6.0.2.HMI`, sections `<n>.zi`, font id
 * order 3.zi, 4.zi, 2.zi, 5.zi, 1.zi, 7.zi), ink rows of the digit `3` and of the icon
 * `lightbulb` (U+E334) inside the line:
 *
 * | id | file | name                      | line | `3` rows | bulb rows / advance |
 * |----|------|---------------------------|-----:|----------|---------------------|
 * | 0  | 3.zi | noto-sans-24-sp5          |   24 | 5-18     | -                   |
 * | 1  | 4.zi | NotoSans-Regular          |   32 | 7-24     | 6-28 / 27           |
 * | 2  | 2.zi | noto-sans-32-sp5          |   32 | 7-24     | -                   |
 * | 3  | 5.zi | NotoSans-Regular          |   48 | 11-36    | 7-43 / 43           |
 * | 4  | 1.zi | NotoSans-Bold             |   80 | 8-51     | 5-60 / 66           |
 * | 5  | 7.zi | NotoSand-Bold-TxtOnly-128 |  128 | 20-105   | -                   |
 *
 * The MDI bulb fills rows 2..22 of its 24 unit box, so the icon box is as high as the advance
 * and starts 2/24 of it above the first ink row.
 */
export const NEXTION_FONTS: readonly NextionFont[] = [
    { px: 24, fontSize: 18, iconSize: 22, fontWeight: 400, icons: false, asciiOnly: false, capTop: 5, iconTop: 1 },
    { px: 32, fontSize: 25, iconSize: 27, fontWeight: 400, icons: true, asciiOnly: false, capTop: 7, iconTop: 4 },
    { px: 32, fontSize: 24, iconSize: 29, fontWeight: 400, icons: false, asciiOnly: false, capTop: 7, iconTop: 2 },
    { px: 48, fontSize: 36, iconSize: 43, fontWeight: 400, icons: true, asciiOnly: false, capTop: 11, iconTop: 3 },
    { px: 80, fontSize: 60, iconSize: 66, fontWeight: 700, icons: true, asciiOnly: false, capTop: 8, iconTop: 0 },
    { px: 128, fontSize: 120, iconSize: 112, fontWeight: 700, icons: false, asciiOnly: true, capTop: 20, iconTop: 8 },
];

/** Noto Sans: ascender 1.069 em, descender 0.293 em, cap height 0.714 em */
const NOTO_ASCENT = 1.069;
const NOTO_DESCENT = 0.293;
const NOTO_CAP = 0.714;

/**
 * Vertical shift of a css text span with `line-height: px` so that its capitals start at the
 * row of the bitmap font ({@link NextionFont.capTop}).
 *
 * @param nf the font
 */
export function textShift(nf: NextionFont): number {
    const cssCapTop = (nf.px - (NOTO_ASCENT + NOTO_DESCENT) * nf.fontSize) / 2 + (NOTO_ASCENT - NOTO_CAP) * nf.fontSize;
    return Math.round(nf.capTop - cssCapTop);
}

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
