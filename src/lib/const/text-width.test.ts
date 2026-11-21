import { expect } from 'chai';
import { FONT_WIDTH_MODELS, FONT_WIDTH_TABLES } from './font-widths';
import {
    charAdvance,
    fitText,
    fontHeight,
    fontWidthModel,
    hasGlyph,
    isFontId,
    textWidth,
    wrapText,
} from './text-width';

const cp = (ch: string): number => ch.codePointAt(0) ?? -1;

// reference values read directly from the zi tables of the 6.1.1 HMIs (left + width + right)
describe('lib/const/text-width - charAdvance / hasGlyph', () => {
    it('advances of single characters in font 0 (Noto Sans 24)', () => {
        expect(charAdvance(cp('i'), 0, 'eu')).to.equal(5);
        expect(charAdvance(cp('W'), 0, 'eu')).to.equal(16);
        expect(charAdvance(cp('ä'), 0, 'eu')).to.equal(10);
        expect(charAdvance(cp('€'), 0, 'eu')).to.equal(10);
        expect(charAdvance(cp(' '), 0, 'eu')).to.equal(5);
        expect(charAdvance(cp('中'), 0, 'eu')).to.equal(19);
    });
    it('advances of single characters in font 2 (Noto Sans 32)', () => {
        expect(charAdvance(cp('i'), 2, 'eu')).to.equal(6);
        expect(charAdvance(cp('W'), 2, 'eu')).to.equal(22);
        expect(charAdvance(cp('ä'), 2, 'eu')).to.equal(13);
        expect(charAdvance(cp('€'), 2, 'eu')).to.equal(14);
    });
    it('advances in the fonts 1, 3, 4, 5', () => {
        expect(charAdvance(cp('W'), 1, 'eu')).to.equal(22);
        expect(charAdvance(cp('i'), 3, 'eu')).to.equal(9);
        expect(charAdvance(cp('W'), 3, 'eu')).to.equal(32);
        expect(charAdvance(cp('ä'), 3, 'eu')).to.equal(20);
        expect(charAdvance(cp('W'), 4, 'eu')).to.equal(57);
        expect(charAdvance(cp('W'), 5, 'eu')).to.equal(109);
    });
    it('"`" and "´" are empty 1 px glyphs in font 0 (open: check on the device)', () => {
        expect(charAdvance(cp('`'), 0, 'eu')).to.equal(1);
        expect(charAdvance(cp('´'), 0, 'eu')).to.equal(1);
    });
    it('missing characters have advance 0 and no glyph', () => {
        expect(hasGlyph(cp('€'), 3, 'eu')).to.equal(false);
        expect(charAdvance(cp('€'), 3, 'eu')).to.equal(0);
        expect(hasGlyph(cp('ä'), 5, 'eu')).to.equal(false);
        expect(hasGlyph(cp('中'), 1, 'eu')).to.equal(false);
        expect(hasGlyph(cp('…'), 0, 'eu')).to.equal(false);
        expect(hasGlyph(cp('😀'), 0, 'eu')).to.equal(false);
        expect(hasGlyph(cp('ä'), 0, 'eu')).to.equal(true);
    });
    it('icons of the icon fonts 1/3/4 have their real advance', () => {
        for (const model of ['eu', 'us-l', 'us-p'] as const) {
            expect(hasGlyph(0xe0_00, 1, model)).to.equal(true);
            expect(charAdvance(0xe0_00, 1, model)).to.equal(27);
            expect(charAdvance(0xf9_00, 3, model)).to.equal(43);
            expect(charAdvance(0xfd_ff, 4, model)).to.equal(66);
        }
        // icon + text
        expect(textWidth(' 21', 1, 'eu')).to.equal(27 + textWidth(' 21', 1, 'eu'));
        // supplementary code points can not be in a zi font
        expect(hasGlyph(0xf_03_35, 1, 'eu')).to.equal(false);
        // gap in the icon range, and no icons in the text fonts
        expect(hasGlyph(0xfd_17, 1, 'eu')).to.equal(false);
        expect(hasGlyph(0xe0_00, 0, 'eu')).to.equal(false);
        expect(hasGlyph(0xe0_00, 5, 'eu')).to.equal(false);
    });
    it('font heights', () => {
        expect([0, 1, 2, 3, 4, 5].map(f => fontHeight(f, 'eu'))).to.deep.equal([24, 32, 32, 48, 80, 128]);
        expect([0, 1, 2, 3, 4, 5].map(f => fontHeight(f, 'us-p'))).to.deep.equal([24, 32, 32, 48, 80, 128]);
    });
    it('unknown font id throws, isFontId checks', () => {
        expect(() => charAdvance(cp('a'), 6, 'eu')).to.throw(RangeError);
        expect(() => textWidth('a', -1, 'eu')).to.throw(RangeError);
        expect(() => textWidth('a', 1.5, 'eu')).to.throw(RangeError);
        expect(isFontId(0)).to.equal(true);
        expect(isFontId(5)).to.equal(true);
        expect(isFontId(6)).to.equal(false);
        expect(isFontId(8)).to.equal(false);
        expect(isFontId(10)).to.equal(false);
        expect(() => charAdvance(cp('a'), 7, 'eu')).to.throw(RangeError);
        expect(isFontId('0')).to.equal(false);
    });
});

describe('lib/const/text-width - models', () => {
    it('us-p font 2 has other advances than eu (digit 14 instead of 13)', () => {
        expect(charAdvance(cp('0'), 2, 'eu')).to.equal(13);
        expect(charAdvance(cp('0'), 2, 'us-l')).to.equal(13);
        expect(charAdvance(cp('0'), 2, 'us-p')).to.equal(14);
        expect(charAdvance(cp('!'), 0, 'eu')).to.equal(7);
        expect(charAdvance(cp('!'), 0, 'us-p')).to.equal(5);
        expect(textWidth('21.5', 2, 'eu')).to.not.equal(textWidth('21.5', 2, 'us-p'));
    });
    it('€ is missing in us-p', () => {
        expect(hasGlyph(cp('€'), 0, 'eu')).to.equal(true);
        expect(hasGlyph(cp('€'), 0, 'us-l')).to.equal(true);
        expect(hasGlyph(cp('€'), 0, 'us-p')).to.equal(false);
        expect(hasGlyph(cp('€'), 2, 'us-p')).to.equal(false);
    });
    it('CJK characters beyond the common set only in us-l', () => {
        expect(hasGlyph(cp('丁'), 0, 'us-l')).to.equal(true);
        expect(charAdvance(cp('丁'), 0, 'us-l')).to.equal(19);
        expect(charAdvance(cp('丁'), 2, 'us-l')).to.equal(26);
        expect(hasGlyph(cp('丁'), 0, 'eu')).to.equal(false);
        expect(hasGlyph(cp('丁'), 0, 'us-p')).to.equal(false);
    });
    it('web models use the tables of their templates', () => {
        expect(fontWidthModel('web-l')).to.equal('eu');
        expect(fontWidthModel('web-p')).to.equal('us-p');
        expect(fontWidthModel('us-l')).to.equal('us-l');
        expect(charAdvance(cp('0'), 2, 'web-p')).to.equal(14);
        expect(charAdvance(cp('0'), 2, 'web-l')).to.equal(13);
    });
    it('identical fonts share one table', () => {
        expect(FONT_WIDTH_TABLES).to.have.length(10);
        expect(FONT_WIDTH_MODELS.eu[1]).to.equal(FONT_WIDTH_MODELS['us-p'][1]);
        expect(FONT_WIDTH_MODELS.eu[0]).to.not.equal(FONT_WIDTH_MODELS['us-l'][0]);
    });
    it('every table decodes to its character count', () => {
        for (const model of ['eu', 'us-l', 'us-p'] as const) {
            for (let f = 0; f < 6; f++) {
                expect(() => fontHeight(f, model)).to.not.throw();
            }
        }
    });
});

describe('lib/const/text-width - font 9 (single icon of popupNotify3)', () => {
    it('icons have advance 255 in all models, height 255', () => {
        for (const model of ['eu', 'us-l', 'us-p', 'web-l', 'web-p'] as const) {
            expect(isFontId(9)).to.equal(true);
            expect(fontHeight(9, model)).to.equal(255);
            expect(hasGlyph(0xe0_00, 9, model)).to.equal(true);
            expect(charAdvance(0xf9_00, 9, model)).to.equal(255);
            expect(charAdvance(0xfd_ff, 9, model)).to.equal(255);
        }
    });
    it('text characters are missing', () => {
        expect(hasGlyph(cp('a'), 9, 'eu')).to.equal(false);
        expect(charAdvance(cp('a'), 9, 'eu')).to.equal(0);
        expect(hasGlyph(0xfe_00, 9, 'eu')).to.equal(false);
        expect(textWidth('\uE6E8\uE6E9', 9, 'eu')).to.equal(510);
    });
    it('fitText/wrapText return at most one character, without ellipsis', () => {
        expect(fitText('\uE6E8', 9, 'eu', 255)).to.equal('\uE6E8');
        expect(fitText('\uE6E8\uE6E9', 9, 'eu', 1000)).to.equal('\uE6E8');
        expect(fitText('\uE6E8', 9, 'eu', 254)).to.equal('');
        expect(fitText('', 9, 'eu', 255)).to.equal('');
        expect(wrapText('\uE6E8 \uE6E9\n\uE6EA', 9, 'eu', 1000, 3)).to.deep.equal(['\uE6E8']);
        expect(wrapText('\uE6E8', 9, 'eu', 1000, 0)).to.deep.equal([]);
    });
});

describe('lib/const/text-width - textWidth', () => {
    it('sum of the advances', () => {
        expect(textWidth('Hallo', 0, 'eu')).to.equal(44);
        expect(textWidth('Wohnzimmer', 0, 'eu')).to.equal(111);
        expect(textWidth('Hallo Welt', 2, 'eu')).to.equal(112);
        expect(textWidth('', 0, 'eu')).to.equal(0);
    });
    it('spax is added between the characters', () => {
        expect(textWidth('Hallo', 0, 'eu', 2)).to.equal(44 + 4 * 2);
        expect(textWidth('a', 0, 'eu', 3)).to.equal(10);
        expect(textWidth('', 0, 'eu', 3)).to.equal(0);
    });
    it('iterates over code points (surrogate pairs count once, missing glyph = 0)', () => {
        expect(textWidth('a😀b', 0, 'eu')).to.equal(21);
        expect(textWidth('a😀b', 0, 'eu', 1)).to.equal(21 + 2);
    });
});

describe('lib/const/text-width - fitText', () => {
    it('returns the text unchanged if it fits exactly', () => {
        expect(fitText('Hallo', 0, 'eu', 44)).to.equal('Hallo');
        expect(fitText('Hallo', 0, 'eu', 1000)).to.equal('Hallo');
    });
    it('one pixel too narrow: cut with ellipsis (font has no "…" -> "...")', () => {
        // Hal = 28, ... = 15
        expect(fitText('Hallo', 0, 'eu', 43)).to.equal('Hal...');
        expect(textWidth('Hal...', 0, 'eu')).to.equal(43);
    });
    it('without ellipsis: the longest prefix that fits', () => {
        expect(fitText('Hallo', 0, 'eu', 43, { ellipsis: '' })).to.equal('Hall');
    });
    it('custom ellipsis', () => {
        expect(fitText('Hallo', 0, 'eu', 43, { ellipsis: '.' })).to.equal('Hall.');
    });
    it('no space in front of the ellipsis', () => {
        // Hallo + space = 49, + ... = 64
        expect(fitText('Hallo Welt', 0, 'eu', 64)).to.equal('Hallo...');
    });
    it('spax is taken into account', () => {
        expect(fitText('Hallo', 0, 'eu', 44, { spax: 1 })).to.not.equal('Hallo');
        expect(fitText('Hallo', 0, 'eu', 48, { spax: 1 })).to.equal('Hallo');
    });
    it('empty text', () => {
        expect(fitText('', 0, 'eu', 0)).to.equal('');
        expect(fitText('', 0, 'eu', 10)).to.equal('');
    });
    it('if not even the ellipsis fits, plain cut', () => {
        expect(fitText('Hallo', 0, 'eu', 14)).to.equal('H');
        expect(fitText('Hallo', 0, 'eu', 12)).to.equal('');
    });
    it('does not split surrogate pairs, emoji have width 0', () => {
        expect(fitText('a😀bc', 0, 'eu', 10, { ellipsis: '' })).to.equal('a😀');
        expect(fitText('😀😀', 0, 'eu', 0)).to.equal('😀😀');
    });
    it('missing glyphs cost nothing', () => {
        expect(fitText('W€W', 3, 'eu', 64)).to.equal('W€W');
    });
});

describe('lib/const/text-width - wrapText', () => {
    it('one line if it fits', () => {
        expect(wrapText('Hallo Welt', 0, 'eu', textWidth('Hallo Welt', 0, 'eu'), 3)).to.deep.equal(['Hallo Welt']);
    });
    it('breaks at spaces, the space is dropped', () => {
        expect(wrapText('Hallo Welt', 0, 'eu', textWidth('Hallo Welt', 0, 'eu') - 1, 3)).to.deep.equal([
            'Hallo',
            'Welt',
        ]);
        expect(wrapText('Hallo   Welt', 0, 'eu', 44, 3)).to.deep.equal(['Hallo', 'Welt']);
    });
    it('a word too wide on its own is broken character by character', () => {
        // Wohn = 49, zimm = 45, zimme = 55
        expect(wrapText('Wohnzimmer', 0, 'eu', 50, 5)).to.deep.equal(['Wohn', 'zimm', 'er']);
        expect(wrapText('ab Wohnzimmer', 0, 'eu', 50, 5)).to.deep.equal(['ab', 'Wohn', 'zimm', 'er']);
    });
    it('keeps existing line breaks', () => {
        expect(wrapText('a\nb', 0, 'eu', 100, 5)).to.deep.equal(['a', 'b']);
        expect(wrapText('a\r\nb', 0, 'eu', 100, 5)).to.deep.equal(['a', 'b']);
        expect(wrapText('a\n\nb', 0, 'eu', 100, 5)).to.deep.equal(['a', '', 'b']);
    });
    it('maxLines: the last line is cut with ellipsis', () => {
        // Hallo = 44, Hallo + space = 49 > 60 - 15
        expect(wrapText('Hallo Welt Hallo', 0, 'eu', 60, 1)).to.deep.equal(['Hallo...']);
        expect(wrapText('Hallo Welt Hallo Welt', 0, 'eu', 60, 2)).to.deep.equal(['Hallo', 'Welt...']);
        expect(wrapText('Hallo Welt Hallo', 0, 'eu', 60, 1, { ellipsis: '' })).to.deep.equal(['Hallo ']);
    });
    it('maxLines with a following paragraph: ellipsis behind the line', () => {
        expect(wrapText('Hallo\nWelt', 0, 'eu', 60, 1)).to.deep.equal(['Hallo...']);
        expect(wrapText('Hallo\nWelt', 0, 'eu', 50, 1)).to.deep.equal(['Hall...']);
    });
    it('every line fits', () => {
        const text = 'Die Waschmaschine im Keller ist fertig, bitte die Wäsche aufhängen und den Flusensieb reinigen';
        for (const model of ['eu', 'us-l', 'us-p'] as const) {
            for (const width of [60, 120, 200, 464]) {
                for (const line of wrapText(text, 0, model, width, 10)) {
                    expect(textWidth(line, 0, model)).to.be.at.most(width);
                }
            }
        }
        const lines = wrapText(text, 0, 'eu', 200, 2);
        expect(lines).to.have.length(2);
        expect(lines[1].endsWith('...')).to.equal(true);
    });
    it('edge cases', () => {
        expect(wrapText('', 0, 'eu', 100, 3)).to.deep.equal(['']);
        expect(wrapText('Hallo', 0, 'eu', 100, 0)).to.deep.equal([]);
        expect(() => wrapText('Hallo', 8, 'eu', 100, 0)).to.throw(RangeError);
    });
});
