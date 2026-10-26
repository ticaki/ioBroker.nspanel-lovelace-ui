import { describe, expect, it } from 'vitest';
import { color565ToCss, color565ToRgb, rgbToColor565 } from './color';

describe('color565', () => {
    it('maps the limits', () => {
        expect(color565ToRgb(0)).toEqual({ r: 0, g: 0, b: 0 });
        expect(color565ToRgb(65535)).toEqual({ r: 255, g: 255, b: 255 });
    });
    it('round trips the adapter formula', () => {
        // Color.rgb_dec565({r:255,g:0,b:0}) = 63488
        expect(rgbToColor565({ r: 255, g: 0, b: 0 })).toBe(63488);
        expect(color565ToRgb(63488)).toEqual({ r: 255, g: 0, b: 0 });
        expect(color565ToRgb(2016)).toEqual({ r: 0, g: 255, b: 0 });
        expect(color565ToRgb(31)).toEqual({ r: 0, g: 0, b: 255 });
    });
    it('gives css colours and falls back', () => {
        expect(color565ToCss('63488')).toBe('rgb(255, 0, 0)');
        expect(color565ToCss(17299)).toBe(color565ToCss('17299'));
        expect(color565ToCss('')).toBe('#ffffff');
        expect(color565ToCss(undefined, '#000')).toBe('#000');
        expect(color565ToCss('abc')).toBe('#ffffff');
    });
});
