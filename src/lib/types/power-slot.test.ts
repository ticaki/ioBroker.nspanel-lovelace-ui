import { expect } from 'chai';
import { emptyPowerSlot } from './adminShareConfig';

describe('lib/types - emptyPowerSlot', () => {
    it('stores the scale bounds the editor displays instead of leaving them undefined', () => {
        // Without these fields the editor shows 0 / 10000 / 0 but never writes them, and the adapter
        // had to fall back to its own defaults to build the color scale.
        const slot = emptyPowerSlot();

        expect(slot.minColorScale).to.equal(0);
        expect(slot.maxColorScale).to.equal(10_000);
        expect(slot.bestColorScale).to.equal(0);
        expect(slot.minSpeedScale).to.equal(0);
        expect(slot.maxSpeedScale).to.equal(10_000);
    });

    it('starts with the scale switched off and no state', () => {
        const slot = emptyPowerSlot();

        expect(slot.useColorScale).to.equal(false);
        expect(slot.state).to.equal('');
        expect(slot.valueUnit).to.equal('W');
    });

    it('returns a fresh object on every call', () => {
        expect(emptyPowerSlot()).to.not.equal(emptyPowerSlot());
    });
});
