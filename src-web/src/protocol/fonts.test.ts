import { describe, expect, it } from 'vitest';
import glyphMap from '../icons/glyph-map.json';
import { NEXTION_FONTS, drawableField, drawableText, isIconChar, nextionFont, splitFontSuffix } from './fonts';

/** the glyph of a MDI icon as the adapter sends it */
function glyphOf(name: string): string {
    const entry = Object.entries(glyphMap).find(([, n]) => n === name);
    if (!entry) {
        throw new Error(`no glyph for ${name}`);
    }
    return entry[0];
}

const BULB = glyphOf('lightbulb');

describe('Nextion fonts', () => {
    it('has the font table of the HMI', () => {
        expect(NEXTION_FONTS.map(f => f.px)).toEqual([24, 32, 32, 48, 80, 128]);
        expect(NEXTION_FONTS.map(f => f.icons)).toEqual([false, true, false, true, true, false]);
        expect(NEXTION_FONTS.map(f => f.asciiOnly)).toEqual([false, false, false, false, false, true]);
        expect(NEXTION_FONTS.map(f => f.fontWeight)).toEqual([400, 400, 400, 400, 700, 700]);
    });

    it('falls back to the element font without or with an unknown font id', () => {
        expect(nextionFont(undefined, 3)).toBe(NEXTION_FONTS[3]);
        expect(nextionFont(4, 1)).toBe(NEXTION_FONTS[4]);
        expect(nextionFont(9, 0)).toBe(NEXTION_FONTS[0]);
    });

    it('splits the font id suffix off', () => {
        expect(splitFontSuffix('21,4°C¬1')).toEqual({ body: '21,4°C', font: 1 });
        expect(splitFontSuffix(`${BULB}¬0`)).toEqual({ body: BULB, font: 0 });
        expect(splitFontSuffix('¬5')).toEqual({ body: '', font: 5 });
        expect(splitFontSuffix('21,4°C')).toEqual({ body: '21,4°C', font: undefined });
        expect(splitFontSuffix('a¬9')).toEqual({ body: 'a¬9', font: undefined });
        expect(splitFontSuffix('')).toEqual({ body: '', font: undefined });
    });

    it('recognises icon glyphs', () => {
        expect(isIconChar(BULB)).toBe(true);
        expect(isIconChar(String.fromCodePoint(0xfd40))).toBe(true);
        expect(isIconChar('°')).toBe(false);
        expect(isIconChar('ä')).toBe(false);
    });

    it('drops icons in the fonts without icons (0, 2, 5)', () => {
        expect(drawableText(BULB, 0)).toBe('');
        expect(drawableText(BULB, 1)).toBe(BULB);
        expect(drawableText(BULB, 2)).toBe('');
        expect(drawableText(BULB, 3)).toBe(BULB);
        expect(drawableText(BULB, 4)).toBe(BULB);
        expect(drawableText(BULB, 5)).toBe('');
        // without a font id the element font draws the icon
        expect(drawableText(BULB, undefined)).toBe(BULB);
    });

    it('drops every non-ascii character in font 5', () => {
        expect(drawableText('21,4°C', 5)).toBe('21,4C');
        expect(drawableText('Küche 35%', 5)).toBe('Kche 35%');
        expect(drawableText('21,4°C', 0)).toBe('21,4°C');
        expect(drawableText('21,4°C', 2)).toBe('21,4°C');
    });

    it('reduces the fields of the hardware test to what the HMI draws', () => {
        expect(drawableField(`${BULB}¬0`)).toEqual({ body: '', font: 0 });
        expect(drawableField('21,4°C¬1')).toEqual({ body: '21,4°C', font: 1 });
        expect(drawableField(`${BULB}¬2`)).toEqual({ body: '', font: 2 });
        expect(drawableField('48%¬3')).toEqual({ body: '48%', font: 3 });
        expect(drawableField(`${BULB}¬4`)).toEqual({ body: BULB, font: 4 });
        expect(drawableField('35%¬5')).toEqual({ body: '35%', font: 5 });
        expect(drawableField('')).toEqual({ body: '', font: undefined });
        expect(drawableField('21,4°C')).toEqual({ body: '21,4°C', font: undefined });
    });
});
