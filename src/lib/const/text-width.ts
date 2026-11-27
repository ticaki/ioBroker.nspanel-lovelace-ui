/**
 * Pixel widths of texts on the Nextion display, from the width tables of the HMI fonts (font-widths.ts, generated
 * by HMI/tools/font_widths.py from the 6.1.1 HMIs of eu, us-l and us-p).
 *
 * The advance of a character is left + width + right of its glyph box; the Nextion has no kerning and no
 * ligatures. Width of a line = sum of the advances + spax * (n - 1), n = number of code points (spax = horizontal
 * spacing of the text object, default 0). A character the font does not have is not drawn by the Nextion and has
 * the advance 0.
 *
 * OPEN (not checked on the device/emulator yet):
 * - whether spax is still added for a character the font does not have - it is counted here,
 * - '`' (U+0060) and '´' (U+00B4) have the advance 1 in fonts 0 and 2 (eu/us-l/us-p): in the zi table they are
 *   empty 1 px glyphs (width 1, left/right 0, no ink) - the font converter apparently failed on them, the Nextion
 *   then draws nothing and advances 1 px.
 *
 * The tables contain all glyphs, icons included (icon fonts 1/3/4: U+E000..U+FDFF, one advance per font: 27/43/66).
 *
 * Font ids (6.1.1, same for all models): 0 = Noto Sans 24, 1 = Noto Sans 32 (Latin-1 + icons), 2 = Noto Sans 32,
 * 3 = Noto Sans 48 (Latin-1 + icons), 4 = Noto Sans Bold 80 (Latin-1 + icons), 5 = Noto Sans Bold 128 (ASCII).
 * Fonts 1/3/4/5 are identical in all models; fonts 0/2 differ: us-l has additional CJK characters (same advances as
 * eu otherwise), us-p has partly different advances and lacks e.g. the currency signs U+20A0..U+20CF (€).
 *
 * Models: the web panels render with browser fonts, not with the zi fonts - there the tables are only an
 * approximation; web-l uses the eu tables and web-p the us-p tables (the templates of the web models, see
 * doc/web-panel/SMARTPHONE.md).
 *
 * Font 9 (HMI 6.2.0, all models) = the single big icon of popupNotify3: 255 x 255 px icons, left/right 0, no
 * generated table - every code point of the icon range U+E000..U+FDFF counts as present with the advance 255 (the
 * font only contains the icons of templates/popup-notify3-icons.json). The field always shows exactly ONE
 * icon: fitText/wrapText return at most 1 character (no ellipsis), textWidth/charAdvance work as usual.
 * Fonts 6..8 (mono, corners, clock) have no table.
 *
 * An unknown font id throws a RangeError (see isFontId to check a value from outside first).
 */
import type { NSpanelModel } from '../types/types';
import { FONT_WIDTH_MODELS, FONT_WIDTH_TABLES, type FontWidthModel, type FontWidthTable } from './font-widths';

/** Ellipsis used when the font has U+2026, otherwise ELLIPSIS_FALLBACK. */
export const ELLIPSIS = '…';
export const ELLIPSIS_FALLBACK = '...';

export interface TextFitOptions {
    /**
     * Appended to a cut text. Default: '…' if the font has it, otherwise '...' (none of the fonts of HMI 6.1.1 has
     * '…'). '' cuts without ellipsis.
     */
    ellipsis?: string;
    /** horizontal spacing (spax) of the text object, default 0 */
    spax?: number;
}

interface FontLookup {
    /** advance of a code point, undefined if the font does not have it */
    readonly advance: (codePoint: number) => number | undefined;
    readonly missing: number;
    readonly height: number;
    /** the text object shows at most this many characters (font 9) */
    readonly maxChars?: number;
}

/** font id of the single big icon of popupNotify3 (HMI 6.2.0) */
export const NOTIFY_ICON_FONT = 9;
const NOTIFY_ICON_SIZE = 255;
const ICON_FIRST = 0xe0_00;
const ICON_LAST = 0xfd_ff;

const notifyIconFont: FontLookup = {
    advance: cp => (cp >= ICON_FIRST && cp <= ICON_LAST ? NOTIFY_ICON_SIZE : undefined),
    missing: 0,
    height: NOTIFY_ICON_SIZE,
    maxChars: 1,
};

const lookups = new Map<FontWidthTable, FontLookup>();

/**
 * The table model of a panel model (web models use the table of their template).
 *
 * @param model panel model
 */
export function fontWidthModel(model: NSpanelModel): FontWidthModel {
    switch (model) {
        case 'web-l':
            return 'eu';
        case 'web-p':
            return 'us-p';
        default:
            return model;
    }
}

function decodeTable(table: FontWidthTable): FontLookup {
    const advances = new Map<number, number>();
    let cp = 0;
    for (const segment of table.data.join(' ').split(' ')) {
        const [gap, items] = segment.split(':');
        cp += parseInt(gap, 36);
        for (const item of (items ?? '').split(',')) {
            const [advance, count] = item.split('*');
            const a = parseInt(advance, 36);
            const n = count === undefined ? 1 : parseInt(count, 36);
            for (let i = 0; i < n; i++) {
                advances.set(cp++, a);
            }
        }
    }
    if (advances.size !== table.count) {
        throw new Error(`text-width: font table ${table.name} decodes to ${advances.size} instead of ${table.count}`);
    }
    return { advance: cp => advances.get(cp), missing: table.missing, height: table.height };
}

function getFont(fontId: number, model: NSpanelModel): FontLookup {
    if (fontId === NOTIFY_ICON_FONT) {
        return notifyIconFont;
    }
    const table = FONT_WIDTH_TABLES[FONT_WIDTH_MODELS[fontWidthModel(model)][fontId] ?? -1];
    if (!table) {
        throw new RangeError(`text-width: unknown font id ${fontId}`);
    }
    let lookup = lookups.get(table);
    if (!lookup) {
        lookup = decodeTable(table);
        lookups.set(table, lookup);
    }
    return lookup;
}

/**
 * true if widths exist for this font id: 0..5 and 9 (the same font ids for all models)
 *
 * @param fontId value to check
 */
export function isFontId(fontId: unknown): fontId is number {
    return (
        typeof fontId === 'number' &&
        Number.isInteger(fontId) &&
        ((fontId >= 0 && fontId < FONT_WIDTH_MODELS.eu.length) || fontId === NOTIFY_ICON_FONT)
    );
}

/**
 * height of the font in px
 *
 * @param fontId font id (position among the fonts of the HMI)
 * @param model panel model
 */
export function fontHeight(fontId: number, model: NSpanelModel): number {
    return getFont(fontId, model).height;
}

/**
 * true if the font has a glyph (text or icon) for the code point
 *
 * @param codePoint Unicode code point
 * @param fontId font id (position among the fonts of the HMI)
 * @param model panel model
 */
export function hasGlyph(codePoint: number, fontId: number, model: NSpanelModel): boolean {
    return getFont(fontId, model).advance(codePoint) !== undefined;
}

function advanceOf(font: FontLookup, codePoint: number): number {
    return font.advance(codePoint) ?? font.missing;
}

/**
 * horizontal advance of a code point in px, 0 if the font does not have it
 *
 * @param codePoint Unicode code point
 * @param fontId font id (position among the fonts of the HMI)
 * @param model panel model
 */
export function charAdvance(codePoint: number, fontId: number, model: NSpanelModel): number {
    return advanceOf(getFont(fontId, model), codePoint);
}

function codePoints(text: string): number[] {
    const out: number[] = [];
    for (const ch of text) {
        out.push(ch.codePointAt(0) ?? 0);
    }
    return out;
}

// width of cps in px with spacing
function widthOf(cps: readonly number[], font: FontLookup, spax: number): number {
    let sum = 0;
    for (const cp of cps) {
        sum += advanceOf(font, cp);
    }
    return sum + (cps.length > 1 ? spax * (cps.length - 1) : 0);
}

/**
 * width of a single line of text in px (iterates over code points, not UTF-16 units)
 *
 * @param text the text
 * @param fontId font id (position among the fonts of the HMI)
 * @param model panel model
 * @param spax horizontal spacing of the text object in px
 */
export function textWidth(text: string, fontId: number, model: NSpanelModel, spax = 0): number {
    return widthOf(codePoints(text), getFont(fontId, model), spax);
}

function resolveEllipsis(font: FontLookup, ellipsis: string | undefined): string {
    if (ellipsis !== undefined) {
        return ellipsis;
    }
    return font.advance(ELLIPSIS.codePointAt(0) ?? 0) !== undefined ? ELLIPSIS : ELLIPSIS_FALLBACK;
}

// number of leading code points of cps that fit into maxWidth when followed by suffix (suffix may be empty)
function fittingPrefix(
    cps: readonly number[],
    suffix: readonly number[],
    font: FontLookup,
    maxWidth: number,
    spax: number,
): number {
    const suffixWidth = widthOf(suffix, font, spax);
    let width = 0;
    let n = 0;
    for (const cp of cps) {
        const next = width + advanceOf(font, cp) + (n > 0 ? spax : 0);
        const total = next + (suffix.length > 0 ? spax + suffixWidth : 0);
        if (total > maxWidth) {
            break;
        }
        width = next;
        n++;
    }
    return n;
}

// cuts cps so that it plus the ellipsis fits; force = add the ellipsis even if cps fits as a whole
function cutWithEllipsis(
    cps: readonly number[],
    font: FontLookup,
    maxWidth: number,
    ellipsis: string,
    spax: number,
    force: boolean,
): string {
    if (!force && widthOf(cps, font, spax) <= maxWidth) {
        return String.fromCodePoint(...cps);
    }
    const suffix = codePoints(ellipsis);
    if (suffix.length > 0 && widthOf(suffix, font, spax) <= maxWidth) {
        let n = fittingPrefix(cps, suffix, font, maxWidth, spax);
        // no space in front of the ellipsis ("Welt..." instead of "Welt ...")
        while (n > 0 && cps[n - 1] === 0x20) {
            n--;
        }
        return String.fromCodePoint(...cps.slice(0, n)) + ellipsis;
    }
    // no ellipsis or not even the ellipsis fits: plain cut
    return String.fromCodePoint(...cps.slice(0, fittingPrefix(cps, [], font, maxWidth, spax)));
}

// font with a character limit (font 9 = single icon of popupNotify3): the first maxChars characters that fit
function fitLimited(
    cps: readonly number[],
    font: FontLookup,
    maxChars: number,
    maxWidth: number,
    spax: number,
): string {
    const head = cps.slice(0, maxChars);
    return String.fromCodePoint(...head.slice(0, fittingPrefix(head, [], font, maxWidth, spax)));
}

/**
 * Cuts text to maxWidth px. If the whole text fits, it is returned unchanged. Otherwise the longest prefix is
 * kept that fits together with the ellipsis (see TextFitOptions.ellipsis, '' = longest prefix without ellipsis);
 * spaces directly in front of the ellipsis are dropped.
 * If not even the ellipsis fits, the longest prefix without ellipsis is returned.
 * Font 9 (single icon of popupNotify3): at most the first character, without ellipsis.
 *
 * @param text the text
 * @param fontId font id (position among the fonts of the HMI)
 * @param model panel model
 * @param maxWidth maximum width in px
 * @param opts ellipsis and spax
 */
export function fitText(
    text: string,
    fontId: number,
    model: NSpanelModel,
    maxWidth: number,
    opts?: TextFitOptions,
): string {
    const font = getFont(fontId, model);
    if (font.maxChars !== undefined) {
        return fitLimited(codePoints(text), font, font.maxChars, maxWidth, opts?.spax ?? 0);
    }
    const ellipsis = resolveEllipsis(font, opts?.ellipsis);
    return cutWithEllipsis(codePoints(text), font, maxWidth, ellipsis, opts?.spax ?? 0, false);
}

interface Span {
    start: number;
    end: number;
}

// greedy wrapping of one paragraph (no line breaks inside) into spans of cps
function wrapParagraph(cps: readonly number[], font: FontLookup, maxWidth: number, spax: number): Span[] {
    const space = 0x20;
    const lines: Span[] = [];
    let line: Span | null = null;
    let i = 0;
    while (i <= cps.length) {
        let j = i;
        while (j < cps.length && cps[j] !== space) {
            j++;
        }
        const start: number = line ? line.start : i;
        if (widthOf(cps.slice(start, j), font, spax) <= maxWidth) {
            line = { start, end: j };
        } else if (line && i === j) {
            // a further space that does not fit any more is dropped like the one at a soft break
        } else {
            if (line) {
                // soft break: the space between line and word is dropped
                lines.push(line);
                line = null;
            }
            // hard break only if the word alone is too wide
            let k = i;
            while (widthOf(cps.slice(k, j), font, spax) > maxWidth) {
                const n = Math.max(1, fittingPrefix(cps.slice(k, j), [], font, maxWidth, spax));
                lines.push({ start: k, end: k + n });
                k += n;
            }
            line = { start: k, end: j };
        }
        i = j + 1;
    }
    if (line) {
        lines.push(line);
    }
    return lines;
}

/**
 * Wraps text into at most maxLines lines of at most maxWidth px each - the semantics of insertLinebreak (tools.ts)
 * in pixels instead of characters:
 * - existing line breaks (\n, \r\n) are kept as hard breaks, an empty paragraph gives an empty line,
 * - soft break at spaces (greedy), the space at the break is dropped,
 * - a word that is too wide on its own is broken character by character,
 * - if there are more than maxLines lines, the last line is cut with fitText + ellipsis (opts.ellipsis, '' = none).
 *
 * The Nextion isbr wraps character by character (observed on the emulator 2026-11-18), not at spaces - therefore
 * the adapter builds the lines itself and joins them with a line break; every line must be <= maxWidth, otherwise
 * the Nextion wraps it once more.
 *
 * On the panel the lines are joined with CR LF (\r\n), CR alone is not enough for the Nextion.
 *
 * '' gives [''], maxLines < 1 gives []. Font 9 (single icon of popupNotify3): one line with at most the first
 * character of the text.
 *
 * @param text the text
 * @param fontId font id (position among the fonts of the HMI)
 * @param model panel model
 * @param maxWidth maximum width in px
 * @param maxLines maximum number of lines
 * @param opts ellipsis and spax
 */
export function wrapText(
    text: string,
    fontId: number,
    model: NSpanelModel,
    maxWidth: number,
    maxLines: number,
    opts?: TextFitOptions,
): string[] {
    const font = getFont(fontId, model);
    if (maxLines < 1) {
        return [];
    }
    const spax = opts?.spax ?? 0;
    if (font.maxChars !== undefined) {
        return [fitLimited(codePoints(text.split(/\r?\n/)[0] ?? ''), font, font.maxChars, maxWidth, spax)];
    }
    const lines: { cps: readonly number[]; span: Span }[] = [];
    for (const paragraph of text.split(/\r?\n/)) {
        const cps = codePoints(paragraph);
        for (const span of wrapParagraph(cps, font, maxWidth, spax)) {
            lines.push({ cps, span });
        }
    }
    const out = lines.slice(0, maxLines).map(l => String.fromCodePoint(...l.cps.slice(l.span.start, l.span.end)));
    const last = lines[maxLines - 1];
    const next = lines[maxLines];
    if (last && next) {
        const ellipsis = resolveEllipsis(font, opts?.ellipsis);
        // same paragraph: the rest of the paragraph is cut, otherwise the ellipsis is forced behind the line
        const sameParagraph = next.cps === last.cps;
        const rest = sameParagraph ? last.cps.slice(last.span.start) : last.cps.slice(last.span.start, last.span.end);
        out[maxLines - 1] = cutWithEllipsis(rest, font, maxWidth, ellipsis, spax, true);
    }
    return out;
}
