import { expect } from 'chai';
import { textSizeLabel, textSizeOfOption, textSizeOptions } from './textSizeOptions';
import { screensaverItemHasIconFont } from '../../src/lib/types/adminShareConfig';

describe('src-admin/textSizeOptions', () => {
    it('offers the icon fonts for an icon, a stored other font stays', () => {
        expect(textSizeOptions(undefined, false)).to.deep.equal(['', '1', '3', '4']);
        expect(textSizeOptions(5, false)).to.deep.equal(['', '1', '3', '4', '5']);
        expect(textSizeOptions(undefined, true)).to.deep.equal(['', '0', '1', '2', '3', '4', '5']);
    });

    it('labels the fonts from the font table', () => {
        const t = (key: string): string => `<${key}>`;
        expect(textSizeLabel('', t)).to.equal('<valueEntryDialog_textSizeDefault>');
        expect(textSizeLabel('3', t)).to.equal('3 – 48 px');
        expect(textSizeLabel('4', t)).to.equal('4 – 80 px <valueEntryDialog_textSizeBold>');
        expect(textSizeLabel('0', t)).to.equal('0 – 24 px (<valueEntryDialog_textSizeTextOnly>)');
    });

    it('reads the option back, default and invalid give undefined', () => {
        expect(textSizeOfOption('4')).to.equal(4);
        expect(textSizeOfOption('0')).to.equal(0);
        expect(textSizeOfOption('')).to.equal(undefined);
        expect(textSizeOfOption(null)).to.equal(undefined);
        expect(textSizeOfOption('9')).to.equal(undefined);
    });

    it('the icon font of a screensaver item: tiles and indicator only', () => {
        expect(screensaverItemHasIconFont('tiles', 'bottom')).to.equal(false);
        expect(screensaverItemHasIconFont('tiles', 'indicator')).to.equal(true);
        expect(screensaverItemHasIconFont('tiles', 'left')).to.equal(false);
        expect(screensaverItemHasIconFont('advanced', 'indicator')).to.equal(false);
        expect(screensaverItemHasIconFont(undefined, 'bottom')).to.equal(false);
    });
});
