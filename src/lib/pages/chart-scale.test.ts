import { expect } from 'chai';
import { buildLineScale, ticksFor } from './chart-scale';

describe('lib/pages - chart-scale', () => {
    it('keeps temperatures untouched (the classic case, ticks fit two characters)', () => {
        // 13.3 … 2.0 °C as x10 values, the script example of the docs
        const scale = buildLineScale([133, 129, 113, 60, 20]);

        expect(scale.factor).to.equal(1);
        expect(scale.values).to.deep.equal([133, 129, 113, 60, 20]);
        expect(scale.ticks).to.deep.equal(ticksFor([133, 129, 113, 60, 20]));
        expect(Math.max(...scale.ticks)).to.be.at.most(999);
    });

    it('divides watts by 10 so that 152 W is printed as 15 instead of a cut "15" of 152', () => {
        // exactly the values of the first panel test: 152.0 W flat, then 120.0 W
        const scale = buildLineScale([1520, 1520, 1520, 1520, 1200]);

        expect(scale.factor).to.equal(10);
        expect(scale.values).to.deep.equal([152, 152, 152, 152, 120]);
        expect(scale.ticks.every(t => t >= -99 && t <= 999)).to.equal(true);
        expect(scale.ticks).to.include(120);
        expect(scale.ticks).to.include(160);
    });

    it('grows the factor in steps of 10 until the ticks fit', () => {
        expect(buildLineScale([65_000, 12_000]).factor).to.equal(100);
        expect(buildLineScale([9_000_000]).factor).to.equal(10_000);
    });

    it('respects the lower bound for negative values', () => {
        // -25.0 … 5.0 °C: ticks reach below -99 with two extra ticks -> factor 10 would be wrong, check the rule itself
        const scale = buildLineScale([-250, 50]);

        expect(scale.ticks.every(t => t >= -99 && t <= 999)).to.equal(true);
    });

    it('builds the ticks like before: tens, five steps, two extra ticks at both ends', () => {
        // 50 … 131 -> rounded 50 … 140, span 90, interval 18, from 50 - 2*18 up to (excluding) 140 + 18
        expect(ticksFor([50, 131])).to.deep.equal([14, 32, 50, 68, 86, 104, 122, 140]);
        expect(ticksFor([])).to.deep.equal([]);
        // a single value: rounded 0 … 10, minimal span 10, interval 10
        expect(ticksFor([5])).to.deep.equal([-20, -10, 0, 10]);
    });
});
