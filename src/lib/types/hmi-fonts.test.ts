import { expect } from 'chai';
import {
    HMI_FONTS,
    HMI_TEXT_SIZES,
    isAsciiOnlyTextSize,
    isHmiTextSize,
    isIconTextSize,
    isNameOnlyPopupTitle,
} from './adminShareConfig';

describe('lib/types - isNameOnlyPopupTitle', () => {
    it('is true for the pages without item names on the card', () => {
        expect(isNameOnlyPopupTitle('cardThermo2')).to.equal(true);
        expect(isNameOnlyPopupTitle('cardMedia')).to.equal(true);
    });

    it('is false for the pages that show the item name', () => {
        for (const card of ['cardEntities', 'cardGrid', 'cardGrid2', 'cardGrid3', 'cardSchedule', 'cardThermo']) {
            expect(isNameOnlyPopupTitle(card)).to.equal(false);
        }
        expect(isNameOnlyPopupTitle(undefined)).to.equal(false);
    });
});

describe('lib/types - HMI fonts (textSize)', () => {
    it('describes every font 0-5', () => {
        expect(HMI_TEXT_SIZES).to.deep.equal([0, 1, 2, 3, 4, 5]);
        expect(HMI_TEXT_SIZES.map(n => HMI_FONTS[n].px)).to.deep.equal([24, 32, 32, 48, 80, 128]);
    });

    it('only fonts 1, 3 and 4 draw icons, the default does as well', () => {
        expect(HMI_TEXT_SIZES.filter(n => isIconTextSize(n))).to.deep.equal([1, 3, 4]);
        expect(isIconTextSize(undefined)).to.equal(true);
        expect(isIconTextSize(7)).to.equal(false);
        expect(isIconTextSize(-1)).to.equal(false);
    });

    it('font 5 is ascii only', () => {
        expect(HMI_TEXT_SIZES.filter(n => isAsciiOnlyTextSize(n))).to.deep.equal([5]);
        expect(isAsciiOnlyTextSize(undefined)).to.equal(false);
    });

    it('recognises valid text sizes', () => {
        expect(isHmiTextSize(0)).to.equal(true);
        expect(isHmiTextSize(5)).to.equal(true);
        expect(isHmiTextSize(1.5)).to.equal(false);
        expect(isHmiTextSize(6)).to.equal(false);
        expect(isHmiTextSize('1')).to.equal(false);
    });
});
