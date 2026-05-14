import { expect } from 'chai';
import { Color } from './Color';
import type { RGB } from './Color';

const BLACK: RGB = { r: 0, g: 0, b: 0 };
const WHITE: RGB = { r: 255, g: 255, b: 255 };
const RED: RGB = { r: 255, g: 0, b: 0 };
const BLUE: RGB = { r: 0, g: 0, b: 255 };

describe('lib/const/Color', () => {
    describe('Color.scale', () => {
        it('maps the input range to the output range', () => {
            expect(Color.scale(50, 0, 100, 0, 255)).to.be.closeTo(127.5, 0.5);
        });
        it('maps boundaries exactly', () => {
            expect(Color.scale(0, 0, 100, 0, 255)).to.equal(0);
            expect(Color.scale(100, 0, 100, 0, 255)).to.equal(255);
        });
        it('returns the input unchanged when inMin is null', () => {
            expect(Color.scale(42, null, 100, 0, 255)).to.equal(42);
        });
        it('returns the input unchanged when inMax is null', () => {
            expect(Color.scale(42, 0, null, 0, 255)).to.equal(42);
        });
    });

    describe('Color.rgb_dec565 / Color.decToRgb', () => {
        it('encodes black as 0', () => {
            expect(Color.rgb_dec565(BLACK)).to.equal(0);
        });
        it('encodes white as 0xFFFF (65535)', () => {
            expect(Color.rgb_dec565(WHITE)).to.equal(0xff_ff);
        });
        it('produces a 16-bit value within range', () => {
            const result = Color.rgb_dec565({ r: 128, g: 128, b: 128 });
            expect(result).to.be.at.least(0);
            expect(result).to.be.at.most(0xff_ff);
        });
        it('decodes 0 back to black', () => {
            expect(Color.decToRgb(0)).to.deep.equal(BLACK);
        });
        it('round-trips primary colors with 5/6/5-bit precision', () => {
            // Note: 565 is lossy; we accept some quantization error.
            const back = Color.decToRgb(Color.rgb_dec565(RED));
            expect(back.r).to.be.at.least(248); // top 5 bits of 255 → 248
            expect(back.g).to.equal(0);
            expect(back.b).to.equal(0);
        });
    });

    describe('Color.ConvertRGBtoHex / ConvertHexToRgb', () => {
        it('encodes white as #ffffff', () => {
            expect(Color.ConvertRGBtoHex(255, 255, 255)).to.equal('#ffffff');
        });
        it('encodes black as #000000', () => {
            expect(Color.ConvertRGBtoHex(0, 0, 0)).to.equal('#000000');
        });
        it('pads single hex digits', () => {
            expect(Color.ConvertRGBtoHex(10, 11, 12)).to.equal('#0a0b0c');
        });
        it('decodes hex strings back to RGB', () => {
            expect(Color.ConvertHexToRgb('#0a0b0c')).to.deep.equal({ r: 10, g: 11, b: 12 });
        });
        it('round-trips RGB → hex → RGB', () => {
            const hex = Color.ConvertRGBtoHex(123, 45, 67);
            expect(Color.ConvertHexToRgb(hex)).to.deep.equal({ r: 123, g: 45, b: 67 });
        });
    });

    describe('Color.rgbHexToObject', () => {
        it('parses valid #rrggbb', () => {
            expect(Color.rgbHexToObject('#0a0b0c')).to.deep.equal({ r: 10, g: 11, b: 12 });
        });
        it('returns black for invalid input', () => {
            expect(Color.rgbHexToObject('not-a-hex')).to.deep.equal(BLACK);
        });
        it('returns black for #-prefixed input of wrong length', () => {
            expect(Color.rgbHexToObject('#abc')).to.deep.equal(BLACK);
        });
    });

    describe('Color.hsv2rgb / hsv2RGB', () => {
        it('converts (0, 1, 1) to red', () => {
            expect(Color.hsv2rgb(0, 1, 1)).to.deep.equal([255, 0, 0]);
        });
        it('converts (120, 1, 1) to green', () => {
            expect(Color.hsv2rgb(120, 1, 1)).to.deep.equal([0, 255, 0]);
        });
        it('converts (240, 1, 1) to blue', () => {
            expect(Color.hsv2rgb(240, 1, 1)).to.deep.equal([0, 0, 255]);
        });
        it('produces gray for zero saturation', () => {
            const [r, g, b] = Color.hsv2rgb(0, 0, 0.5);
            expect(r).to.equal(g);
            expect(g).to.equal(b);
        });
        it('hsv2RGB returns RGB object form', () => {
            expect(Color.hsv2RGB(0, 1, 1)).to.deep.equal({ r: 255, g: 0, b: 0 });
        });
    });

    describe('Color.hsvtodec', () => {
        it('returns null for null hue', () => {
            expect(Color.hsvtodec(null, 1, 1)).to.equal(null);
        });
        it('returns a numeric string for valid hue', () => {
            const result = Color.hsvtodec(0, 1, 1);
            expect(result).to.be.a('string');
            expect(Number.isFinite(Number(result))).to.equal(true);
        });
    });

    describe('Color.getHue', () => {
        it('returns 0 for pure red', () => {
            expect(Color.getHue(255, 0, 0)).to.equal(0);
        });
        it('returns 120 for pure green', () => {
            expect(Color.getHue(0, 255, 0)).to.equal(120);
        });
        it('returns 240 for pure blue', () => {
            expect(Color.getHue(0, 0, 255)).to.equal(240);
        });
        it('returns 0 for gray (delta=0)', () => {
            expect(Color.getHue(128, 128, 128)).to.equal(0);
        });
    });

    describe('Color.brightness', () => {
        it('clamps near-zero multiplier to min 1', () => {
            const c = Color.brightness({ r: 100, g: 100, b: 100 }, 0);
            expect(c.r).to.be.at.least(1);
            expect(c.g).to.be.at.least(1);
            expect(c.b).to.be.at.least(1);
        });
        it('clamps very high values to 255', () => {
            const c = Color.brightness({ r: 200, g: 200, b: 200 }, 10);
            expect(c.r).to.equal(255);
            expect(c.g).to.equal(255);
            expect(c.b).to.equal(255);
        });
        it('keeps the value for multiplier 1', () => {
            expect(Color.brightness({ r: 50, g: 50, b: 50 }, 1)).to.deep.equal({ r: 50, g: 50, b: 50 });
        });
    });

    describe('Color.darken', () => {
        it('produces a darker color', () => {
            const original = { r: 200, g: 200, b: 200 };
            const dark = Color.darken(original, 0.8);
            const sumOriginal = original.r + original.g + original.b;
            const sumDark = dark.r + dark.g + dark.b;
            expect(sumDark).to.be.below(sumOriginal);
        });
    });

    describe('Color.Interpolate / InterpolateNum', () => {
        it('Interpolate at fraction 0 returns first color', () => {
            expect(Color.Interpolate(RED, BLUE, 0)).to.deep.equal(RED);
        });
        it('Interpolate at fraction 1 returns second color', () => {
            expect(Color.Interpolate(RED, BLUE, 1)).to.deep.equal(BLUE);
        });
        it('Interpolate at 0.5 sits in the middle', () => {
            const mid = Color.Interpolate(RED, BLUE, 0.5);
            expect(mid.r).to.be.closeTo(127.5, 0.5);
            expect(mid.b).to.be.closeTo(127.5, 0.5);
        });
        it('InterpolateNum interpolates linearly', () => {
            expect(Color.InterpolateNum(0, 100, 0.25)).to.equal(25);
            expect(Color.InterpolateNum(100, 0, 0.25)).to.equal(75);
        });
    });

    describe('Color.mixColor', () => {
        it('rounds the interpolated values', () => {
            const result = Color.mixColor({ r: 0, g: 0, b: 0 }, { r: 10, g: 10, b: 10 }, 0.55);
            expect(result.r).to.equal(6);
            expect(result.g).to.equal(6);
            expect(result.b).to.equal(6);
        });
    });

    describe('type guards', () => {
        it('isRGB accepts RGB-shape objects', () => {
            expect(Color.isRGB({ r: 1, g: 2, b: 3 })).to.equal(true);
        });
        it('isRGB rejects non-RGB inputs', () => {
            expect(Color.isRGB({ red: 1 })).to.equal(false);
        });
        it('isHex accepts #rrggbb strings', () => {
            expect(Color.isHex('#aabbcc')).to.equal(true);
        });
        it('isHex rejects shorter or non-prefixed strings', () => {
            expect(Color.isHex('aabbcc')).to.equal(false);
            expect(Color.isHex('#abc')).to.equal(false);
        });
        it('isScriptRGB accepts {red,green,blue}', () => {
            expect(Color.isScriptRGB({ red: 1, green: 2, blue: 3 })).to.equal(true);
        });
        it('convertScriptRGBtoRGB renames keys', () => {
            expect(Color.convertScriptRGBtoRGB({ red: 1, green: 2, blue: 3 })).to.deep.equal({ r: 1, g: 2, b: 3 });
        });
    });

    describe('Color.ColorToHex', () => {
        it('formats single-digit hex as two digits', () => {
            expect(Color.ColorToHex(0)).to.equal('00');
            expect(Color.ColorToHex(15)).to.equal('0f');
        });
        it('formats two-digit hex as-is', () => {
            expect(Color.ColorToHex(255)).to.equal('ff');
        });
    });

    describe('Color.HandleColorScale', () => {
        it('returns dec565 for known scale values', () => {
            const v = Color.HandleColorScale('5');
            expect(Number.isFinite(v)).to.equal(true);
        });
        it('falls back to colorScale10 for unknown input', () => {
            expect(Color.HandleColorScale('99')).to.equal(Color.HandleColorScale('10'));
        });
    });

    describe('Color.rgb_to_cie', () => {
        it('returns a [x,y] string with values in [0,1]', () => {
            const cie = Color.rgb_to_cie(0.5, 0.5, 0.5);
            expect(cie).to.match(/^\[\d?\.\d{4},\d?\.\d{4}\]$/);
        });
    });

    describe('Color.ConvertWithColordtoRgb', () => {
        it('converts named CSS colors', () => {
            // colord adds an alpha channel; check r/g/b only
            const red = Color.ConvertWithColordtoRgb('red');
            expect(red.r).to.equal(255);
            expect(red.g).to.equal(0);
            expect(red.b).to.equal(0);
            const lime = Color.ConvertWithColordtoRgb('lime');
            expect(lime.r).to.equal(0);
            expect(lime.g).to.equal(255);
            expect(lime.b).to.equal(0);
            const blue = Color.ConvertWithColordtoRgb('blue');
            expect(blue.r).to.equal(0);
            expect(blue.g).to.equal(0);
            expect(blue.b).to.equal(255);
        });
    });
});
