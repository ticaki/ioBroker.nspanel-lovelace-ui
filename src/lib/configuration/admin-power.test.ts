import { expect } from 'chai';
import {
    dropScriptNavigation,
    emptyPowerSlot,
    findPowerEntryForScript,
    isScriptNavigatedPower,
    migrateLegacyPower,
    type LegacyPowerRow,
    type PageConfigEntry,
    type PowerEntry,
    type PowerSlotConfig,
} from '../types/adminShareConfig';
import { buildPowerSlotData } from '../pages/pagePower';

/**
 * The scale object the runtime reads for the icon color of a power slot, if any.
 *
 * @param slot Per-slot configuration as stored by the React editor.
 * @returns The constVal of icon.scale, or undefined when no scale was built.
 */
function scaleOf(slot: PowerSlotConfig): Record<string, unknown> | undefined {
    return buildPowerSlotData(slot).icon.scale?.constVal;
}

describe('lib/configuration - buildPowerSlotData', () => {
    it('builds the color scale with the classic defaults when only the upper bound was typed in', () => {
        // Exactly the slot that showed a white icon: the editor stores a bound only once it was edited,
        // so a slot whose lower bound was left at its displayed default carries no minColorScale.
        const slot: PowerSlotConfig = {
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
        const slot: PowerSlotConfig = {
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

describe('lib/types/adminShareConfig - migration of the table "Page Power"', () => {
    const row: LegacyPowerRow = {
        pageName: 'energie',
        headline: 'Energie',
        alwaysOnDisplay: true,
        hiddenByTrigger: false,
        power1_icon: 'solar-power',
        power1_iconColor: '#ffcc00',
        power1_state: '0_userdata.0.pv',
        power1_valueDecimal: 1,
        power1_valueUnit: 'kW',
        power1_entityHeadline: 'PV',
        _power1_useColorScale: true,
        power1_minColorScale: -400,
        power1_maxColorScale: 6000,
        power1_bestColorScale: 0,
        power1_minSpeedScale: 0,
        power1_maxSpeedScale: 6000,
        power1_reverse: true,
        power7_state: '0_userdata.0.haus',
        power7_valueDecimal: 2,
        power7_valueUnit: 'kW',
        power8_selInternalCalculation: true,
        power8_selPowerSupply: [1, 3],
        power8_valueDecimal: 0,
        power8_valueUnit: 'W',
    };
    /** a page of another card type that already occupies the name */
    const qr: PageConfigEntry = {
        card: 'cardQR',
        uniqueName: 'energie',
        headline: 'QR',
        ssidUrlTel: '',
        setState: '',
        wlanhidden: false,
        pwdhidden: false,
    };

    it('maps the flat power1..power8 fields onto the slots and keeps the navigation in the script', () => {
        const { entries, messages, changed } = migrateLegacyPower([row], []);
        const entry = entries[0] as PowerEntry;

        expect(changed).to.equal(true);
        expect(messages).to.deep.equal([]);
        expect(entry.card).to.equal('cardPower');
        expect(entry.uniqueName).to.equal('energie');
        expect(entry.scriptName).to.equal('energie');
        expect(entry.alwaysOn).to.equal('always');
        expect(entry.hidden).to.equal(false);
        expect(entry.leftTop).to.deep.equal({
            icon: 'solar-power',
            iconColor: '#ffcc00',
            state: '0_userdata.0.pv',
            valueDecimal: 1,
            valueUnit: 'kW',
            entityHeadline: 'PV',
            useColorScale: true,
            minColorScale: -400,
            maxColorScale: 6000,
            bestColorScale: 0,
            minSpeedScale: 0,
            maxSpeedScale: 6000,
            reverse: true,
        });
        expect(entry.homeTop).to.deep.equal({ state: '0_userdata.0.haus', valueDecimal: 2, valueUnit: 'kW' });
        expect(entry.homeBot).to.deep.equal({
            selInternalCalculation: true,
            state: '',
            selPowerSupply: [1, 3],
            valueDecimal: 0,
            valueUnit: 'W',
        });
        expect(isScriptNavigatedPower(entry)).to.equal(true);
    });

    it('fills a slot the old row says nothing about with the defaults of an empty slot', () => {
        const entry = migrateLegacyPower([{ pageName: 'x' }], []).entries[0] as PowerEntry;

        expect(entry.rightBottom).to.deep.equal({ ...emptyPowerSlot(), useColorScale: false, reverse: false });
        expect(entry.homeTop).to.deep.equal({ state: '', valueDecimal: 0, valueUnit: 'W' });
        expect(entry.homeBot.selPowerSupply).to.deep.equal([]);
        expect(entry.alwaysOn).to.equal('none');
        expect(entry.hidden).to.equal(false);
    });

    it('keeps the colour scale of a migrated slot - the runtime must see the same scale as before', () => {
        const entry = migrateLegacyPower([row], []).entries[0] as PowerEntry;

        expect(buildPowerSlotData(entry.leftTop).icon.scale?.constVal).to.deep.equal({
            val_min: -400,
            val_max: 6000,
            val_best: 0,
            mode: 'triGrad',
        });
        // without the flag `_power1_useColorScale` the slot keeps its static colour
        const noScale = migrateLegacyPower([{ ...row, _power1_useColorScale: false }], []).entries[0] as PowerEntry;
        expect(buildPowerSlotData(noScale.leftTop).icon.scale).to.equal(undefined);
        expect(buildPowerSlotData(noScale.leftTop).icon.true.color.constVal).to.equal('#ffcc00');
    });

    it('takes the slot indices of the internal sum as a list and drops impossible ones', () => {
        const single = migrateLegacyPower([{ ...row, power8_selPowerSupply: 4 }], []).entries[0] as PowerEntry;
        expect(single.homeBot.selPowerSupply).to.deep.equal([4]);

        const dirty = migrateLegacyPower([{ ...row, power8_selPowerSupply: [0, 2, 7, 6] }], [])
            .entries[0] as PowerEntry;
        expect(dirty.homeBot.selPowerSupply).to.deep.equal([2, 6]);
    });

    it('renames on a name clash, warns and keeps the script name', () => {
        const first = migrateLegacyPower([row], [qr]);
        const entry = first.entries[1] as PowerEntry;

        expect(entry.uniqueName).to.equal('energie_power');
        expect(entry.scriptName).to.equal('energie');
        expect(first.messages).to.have.length(1);
        expect(first.messages[0]).to.contain('energie_power');

        // a second clash counts up
        const second = migrateLegacyPower([row], [qr, { ...entry, scriptName: 'other' }]);
        expect(second.entries[2].uniqueName).to.equal('energie_power2');
    });

    it('skips rows migrated before and rows without a name', () => {
        const once = migrateLegacyPower([row], []);
        const twice = migrateLegacyPower([row, { pageName: '  ' }], once.entries);

        expect(twice.changed).to.equal(false);
        expect(twice.entries).to.deep.equal(once.entries);
        expect(migrateLegacyPower(undefined, []).changed).to.equal(false);
    });

    it('finds the entry of a script page by its script name first', () => {
        const migrated = migrateLegacyPower([row], [qr]).entries;

        expect(findPowerEntryForScript(migrated, 'energie')?.uniqueName).to.equal('energie_power');
        expect(findPowerEntryForScript(migrated, 'energie_power')?.uniqueName).to.equal('energie_power');
        expect(findPowerEntryForScript(migrated, 'nope')).to.equal(undefined);
    });

    it('ends the script navigation once the admin assigns one', () => {
        const entry = migrateLegacyPower([row], []).entries[0];

        expect(dropScriptNavigation(entry)).to.equal(entry);

        const assigned = dropScriptNavigation({ ...entry, navigationAssignment: [{ topic: 'nspanel/x' }] });
        expect(assigned).to.not.have.property('scriptNavigation');
        expect((assigned as PowerEntry).scriptName).to.equal('energie');
        expect(isScriptNavigatedPower(assigned)).to.equal(false);
    });
});
