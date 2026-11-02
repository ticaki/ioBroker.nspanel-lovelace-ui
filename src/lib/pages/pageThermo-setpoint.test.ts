import { expect } from 'chai';
import { snapSetTemperature } from './pageThermo';

describe('lib/pages - cardThermo set temperature', () => {
    it('keeps a value that already sits on the step grid', () => {
        // 19.0 °C with 15.0 to 28.0 °C in steps of 0.5 °C - the defaults of an alias channel
        expect(snapSetTemperature(190, 150, 280, 5)).to.equal(190);
        expect(snapSetTemperature(215, 150, 300, 5)).to.equal(215);
    });

    it('snaps a value between two steps onto the nearer one', () => {
        expect(snapSetTemperature(192, 150, 280, 5)).to.equal(190);
        expect(snapSetTemperature(193, 150, 280, 5)).to.equal(195);
        expect(snapSetTemperature(204, 150, 300, 10)).to.equal(200);
    });

    it('works with a step of one tenth and with a lower limit of zero', () => {
        expect(snapSetTemperature(215, 150, 300, 1)).to.equal(215);
        expect(snapSetTemperature(215, 0, 300, 5)).to.equal(215);
    });

    it('pulls a value outside the limits back onto them', () => {
        expect(snapSetTemperature(100, 150, 280, 5)).to.equal(150);
        expect(snapSetTemperature(400, 150, 280, 5)).to.equal(280);
    });

    it('steps down instead of leaving the maximum behind', () => {
        // 28.3 °C as the maximum is not on the grid - 28.0 °C is the highest value left
        expect(snapSetTemperature(283, 150, 283, 5)).to.equal(280);
    });

    it('treats a step below one tenth as one tenth', () => {
        expect(snapSetTemperature(187, 150, 280, 0)).to.equal(187);
        expect(snapSetTemperature(187, 150, 280, Number.NaN)).to.equal(187);
    });
});
