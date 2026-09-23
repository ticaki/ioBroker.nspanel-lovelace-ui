import { expect } from 'chai';
import { buildLineScale, niceStep, ticksFor } from './chart-scale';

describe('lib/pages - chart-scale', () => {
    it('keeps temperatures untouched (the classic case, ticks fit two characters)', () => {
        // 13.3 … 2.0 °C as x10 values, the script example of the docs
        const scale = buildLineScale([133, 129, 113, 60, 20]);

        expect(scale.factor).to.equal(1);
        expect(scale.values).to.deep.equal([133, 129, 113, 60, 20]);
        expect(scale.ticks).to.deep.equal([0, 50, 100, 150]);
    });

    it('divides watts by 10 so that 152 W is printed as 15 instead of a cut "15" of 152', () => {
        // exactly the values of the first panel test: 152.0 W flat, then 120.0 W
        const scale = buildLineScale([1520, 1520, 1520, 1520, 1200]);

        expect(scale.factor).to.equal(10);
        expect(scale.values).to.deep.equal([152, 152, 152, 152, 120]);
        expect(scale.ticks).to.deep.equal([120, 130, 140, 150, 160]);
    });

    it('grows the factor in steps of 10 until the ticks fit', () => {
        expect(buildLineScale([65_000, 12_000]).factor).to.equal(100);
        expect(buildLineScale([9_000_000]).factor).to.equal(10_000);
    });

    it('keeps a winter day untouched: no extra ticks below the minimum, so nothing drops below -99', () => {
        // -5.2 … 3.5 °C: the former two extra ticks (-100, -80) forced factor 10 and a flat curve at zero
        const scale = buildLineScale([-52, -48, -31, -10, 5, 21, 35]);

        expect(scale.factor).to.equal(1);
        expect(scale.ticks).to.deep.equal([-60, -40, -20, 0, 20, 40]);
    });

    it('still scales frost: -25.0 °C itself does not fit two characters', () => {
        const scale = buildLineScale([-250, 50]);

        expect(scale.factor).to.equal(10);
        expect(scale.ticks.every(t => t >= -99 && t <= 999)).to.equal(true);
    });

    it('uses 1-2-5 steps so the panel prints round integer labels', () => {
        expect(niceStep(55)).to.equal(20); // 12.1 … 17.6 °C -> 12 14 16 18 instead of 9 10 12 13 14 15 16 18
        expect(niceStep(42)).to.equal(10);
        expect(niceStep(120)).to.equal(50); // no 25: 2.5 would print as "3"
        expect(niceStep(0)).to.equal(10);
        expect(ticksFor([121, 176])).to.deep.equal([120, 140, 160, 180]);
        expect(ticksFor([13, 133])).to.deep.equal([0, 50, 100, 150]);
    });

    it('builds data ticks only: from the step below the minimum to the step above the maximum', () => {
        expect(ticksFor([50, 131])).to.deep.equal([40, 60, 80, 100, 120, 140]);
        expect(ticksFor([])).to.deep.equal([]);
        // a single value: at least two ticks
        expect(ticksFor([5])).to.deep.equal([0, 10]);
        expect(ticksFor([200, 200])).to.deep.equal([200, 210]);
    });
});
