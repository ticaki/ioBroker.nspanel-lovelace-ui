import { expect } from 'chai';
import { getPowerSpeed, MAX_POWER_SPEED, powerSpeedFromValue } from './pagePower';

/**
 * minimal data item: only the getters the speed item uses
 *
 * @param v the number the state reports
 */
const num = (v: number | null): any => ({ getNumber: async () => v });
/**
 * minimal data item for the checkbox "reverse flow direction"
 *
 * @param v the value of the checkbox
 */
const bool = (v: boolean): any => ({ getBoolean: async () => v });

describe('cardPower: speed of a flow', () => {
    describe('powerSpeedFromValue', () => {
        it('zero power stands still, whatever the scale is', () => {
            expect(powerSpeedFromValue(0, 0, 10_000)).to.equal(0);
            expect(powerSpeedFromValue(0, -4000, 4000)).to.equal(0);
            expect(powerSpeedFromValue(0, 500, 5000)).to.equal(0);
            expect(powerSpeedFromValue(0, null, null)).to.equal(0);
        });

        it('scales the amount of the power to 0 … 100', () => {
            expect(powerSpeedFromValue(2000, 0, 10_000)).to.equal(20);
            expect(powerSpeedFromValue(5000, 0, 10_000)).to.equal(50);
            expect(powerSpeedFromValue(10_000, 0, 10_000)).to.equal(100);
        });

        it('the sign is the direction, the scale is untouched by it', () => {
            expect(powerSpeedFromValue(-2000, 0, 10_000)).to.equal(-20);
            expect(powerSpeedFromValue(-10_000, 0, 10_000)).to.equal(-100);
        });

        it('a negative limit counts with its amount instead of shifting the zero point', () => {
            // the user case: battery -4000 … 4000
            expect(powerSpeedFromValue(2000, -4000, 4000)).to.equal(50);
            expect(powerSpeedFromValue(0, -4000, 4000)).to.equal(0);
            expect(powerSpeedFromValue(-2000, -4000, 4000)).to.equal(-50);
            // only a negative limit entered
            expect(powerSpeedFromValue(-2500, -5000, 0)).to.equal(-50);
        });

        it('two positive limits are a dead band below the minimum', () => {
            expect(powerSpeedFromValue(500, 500, 5000)).to.equal(0);
            expect(powerSpeedFromValue(100, 500, 5000)).to.equal(0);
            expect(powerSpeedFromValue(-100, 500, 5000)).to.equal(0);
            expect(powerSpeedFromValue(2750, 500, 5000)).to.equal(50);
        });

        it('limits the speed to the range of the HMI', () => {
            expect(powerSpeedFromValue(100_000, 0, 10_000)).to.equal(MAX_POWER_SPEED);
            expect(powerSpeedFromValue(-100_000, 0, 10_000)).to.equal(-MAX_POWER_SPEED);
            // without a scale the raw value is the speed - limited as well
            expect(powerSpeedFromValue(2000, null, null)).to.equal(MAX_POWER_SPEED);
        });

        it('swapped or equal limits do not divide by zero', () => {
            expect(powerSpeedFromValue(2000, 10_000, 0)).to.equal(20);
            expect(powerSpeedFromValue(2000, 0, 0)).to.equal(100);
            expect(powerSpeedFromValue(0, 0, 0)).to.equal(0);
        });
    });

    describe('getPowerSpeed', () => {
        it('reads value, factor and scale of the item', async () => {
            const speed = await getPowerSpeed({
                value: num(-2000),
                minScale: num(-4000),
                maxScale: num(4000),
            });
            expect(speed).to.equal(-50);
        });

        it('"reverse flow direction" turns the result around', async () => {
            const item = {
                value: num(2000),
                minScale: num(0),
                maxScale: num(10_000),
                negate: bool(true),
            } as any;
            expect(await getPowerSpeed(item)).to.equal(-20);
        });

        it('a state without a number gives null', async () => {
            expect(await getPowerSpeed({ value: num(null), minScale: num(0), maxScale: num(100) })).to.equal(null);
            expect(await getPowerSpeed(undefined)).to.equal(null);
        });

        it('applies the factor before the scale', async () => {
            const speed = await getPowerSpeed({
                value: num(2),
                factor: num(1000),
                minScale: num(0),
                maxScale: num(10_000),
            });
            expect(speed).to.equal(20);
        });
    });
});
