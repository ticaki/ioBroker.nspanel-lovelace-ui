import { expect } from 'chai';
import type * as ShareConfig from '../types/adminShareConfig';
import { buildPowerSlotData } from './admin';

/**
 * The scale object the runtime reads for the icon color of a power slot, if any.
 *
 * @param slot Per-slot configuration as stored by the React editor.
 * @returns The constVal of icon.scale, or undefined when no scale was built.
 */
function scaleOf(slot: ShareConfig.PowerSlotConfig): Record<string, unknown> | undefined {
    return buildPowerSlotData(slot).icon.scale?.constVal;
}

describe('lib/configuration - buildPowerSlotData', () => {
    it('builds the color scale with the classic defaults when only the upper bound was typed in', () => {
        // Exactly the slot that showed a white icon: the editor stores a bound only once it was edited,
        // so a slot whose lower bound was left at its displayed default carries no minColorScale.
        const slot: ShareConfig.PowerSlotConfig = {
            icon: 'washing-machine',
            iconColor: '',
            state: 'alias.0.WMA.Leistung',
            valueDecimal: 0,
            valueUnit: 'W',
            entityHeadline: 'Waschmaschine',
            useColorScale: true,
            maxColorScale: 2500,
            maxSpeedScale: 2500,
        };

        expect(scaleOf(slot)).to.deep.equal({ val_min: 0, val_max: 2500, val_best: 0, mode: 'triGrad' });
    });

    it('builds the color scale from the defaults alone when no bound was typed in', () => {
        expect(scaleOf({ useColorScale: true })).to.deep.equal({
            val_min: 0,
            val_max: 10_000,
            val_best: 0,
            mode: 'triGrad',
        });
    });

    it('keeps bounds that were typed in', () => {
        const slot: ShareConfig.PowerSlotConfig = {
            useColorScale: true,
            minColorScale: -400,
            maxColorScale: 6000,
            bestColorScale: 0,
        };

        expect(scaleOf(slot)).to.deep.equal({ val_min: -400, val_max: 6000, val_best: 0, mode: 'triGrad' });
    });

    it('drops the static icon color while the scale is active', () => {
        const data = buildPowerSlotData({ useColorScale: true, iconColor: '#00f900' });

        expect(data.icon.true.color.constVal).to.equal('');
    });

    it('builds no scale and keeps the static icon color when the scale is off', () => {
        const data = buildPowerSlotData({ useColorScale: false, iconColor: '#00f900', maxColorScale: 2500 });

        expect(data.icon.scale).to.equal(undefined);
        expect(data.icon.true.color.constVal).to.equal('#00f900');
    });

    it('agrees with the synthetic pagePowerdata record on the defaults', () => {
        // dataForCardPower() writes 0 / 10000 / 0 into adapter.config.pagePowerdata for the same slot;
        // the scale handed to the runtime must not differ from that record.
        const data = buildPowerSlotData({ useColorScale: true });

        expect(data.icon.scale.constVal.val_min).to.equal(0);
        expect(data.icon.scale.constVal.val_max).to.equal(10_000);
        expect(data.icon.scale.constVal.val_best).to.equal(0);
    });
});
