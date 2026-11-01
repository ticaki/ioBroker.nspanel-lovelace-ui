import { expect } from 'chai';
import {
    dropScriptNavigation,
    findPowerEntryForScript,
    isScriptNavigatedPower,
    legacyPowerStates,
    migrateLegacyPower,
    type LegacyPowerRow,
    type PowerEntry,
    type PowerSlotConfig,
} from '../types/adminShareConfig';
import { buildPowerPage, buildPowerSlotData } from '../pages/pagePower';

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
    /** a row the way the old jsonConfig table stored it (speed bounds partly as strings) */
    const row: LegacyPowerRow = {
        pageName: 'energie',
        headline: 'Energie',
        alwaysOnDisplay: true,
        hiddenByTrigger: false,
        power1_icon: 'solar-power-variant',
        power1_iconColor: '#ffff00',
        _power1_useColorScale: false,
        power1_state: '0_userdata.0.pv',
        power1_valueDecimal: 1,
        power1_valueUnit: 'kW',
        power1_entityHeadline: 'PV',
        power1_minSpeedScale: '0',
        power1_maxSpeedScale: 5000,
        power1_reverse: true,
        power2_icon: 'battery',
        power2_iconColor: '#00ff00',
        _power2_useColorScale: true,
        power2_minColorScale: -1000,
        power2_maxColorScale: 1000,
        power2_bestColorScale: 0,
        power2_state: '0_userdata.0.battery',
        power2_valueUnit: 'W',
        power2_maxSpeedScale: '100',
        power3_icon: 'flash',
        power3_iconColor: '#ff0000',
        power3_state: null,
        power7_state: '0_userdata.0.house',
        power7_valueDecimal: 0,
        power8_selInternalCalculation: true,
        power8_state: '',
        power8_selPowerSupply: [1, '2', 9],
        power8_valueDecimal: 1,
        power8_valueUnit: 'kW',
    };

    it('maps the flat fields the way the old table path read them and keeps the navigation in the script', () => {
        const { entries, messages, changed } = migrateLegacyPower([row], [], { '0_userdata.0.battery': 'kW' });
        const e = entries[0] as PowerEntry;

        expect(changed).to.equal(true);
        expect(messages).to.deep.equal([]);
        expect(e.card).to.equal('cardPower');
        expect(e.uniqueName).to.equal('energie');
        expect(e.scriptName).to.equal('energie');
        expect(e.scriptNavigation).to.equal(true);
        expect(e.headline).to.equal('Energie');
        expect(e.alwaysOn).to.equal('always');
        expect(e.hidden).to.equal(false);
        expect(e.leftTop).to.deep.equal({
            icon: 'solar-power-variant',
            iconColor: '#ffff00',
            state: '0_userdata.0.pv',
            valueDecimal: 1,
            valueUnit: 'kW',
            entityHeadline: 'PV',
            useColorScale: false,
            minColorScale: 0,
            maxColorScale: 10_000,
            bestColorScale: 0,
            // a bound stored as string was ignored by the old path
            minSpeedScale: 0,
            maxSpeedScale: 5000,
            reverse: true,
        });
        expect(isScriptNavigatedPower(e)).to.equal(true);
    });

    it('takes the unit of the state object before the unit of the table', () => {
        const e = migrateLegacyPower([row], [], { '0_userdata.0.battery': 'kW' }).entries[0] as PowerEntry;

        expect(e.leftMiddle.valueUnit).to.equal('kW');
        // no unit at the state: the table unit stays, an empty one becomes W
        expect(e.leftTop.valueUnit).to.equal('kW');
        expect(e.homeTop.valueUnit).to.equal('W');
    });

    it('uses the color scale only with all bounds and the static color only with the scale switched off', () => {
        const e = migrateLegacyPower([row], []).entries[0] as PowerEntry;

        expect(e.leftMiddle.useColorScale).to.equal(true);
        expect(e.leftMiddle.iconColor).to.equal('');
        expect(e.leftMiddle.maxSpeedScale).to.equal(10_000);
        // never toggled: the old path showed no static color
        expect(e.leftBottom.iconColor).to.equal('');
        expect(e.leftBottom.useColorScale).to.equal(false);
        expect(e.leftBottom.state).to.equal('');

        const partial = migrateLegacyPower(
            [{ pageName: 'p', _power1_useColorScale: true, power1_minColorScale: 0, power1_maxColorScale: 100 }],
            [],
        ).entries[0] as PowerEntry;
        expect(partial.leftTop.useColorScale).to.equal(false);
    });

    it('keeps the internal sum with the slots that feed it and the table unit', () => {
        const e = migrateLegacyPower([row], [], { '0_userdata.0.house': 'W' }).entries[0] as PowerEntry;

        expect(e.homeBot).to.deep.equal({
            selInternalCalculation: true,
            state: '',
            selPowerSupply: [1, 2],
            valueDecimal: 1,
            valueUnit: 'kW',
        });
        expect(e.homeTop).to.deep.equal({ state: '0_userdata.0.house', valueDecimal: 0, valueUnit: 'W' });
    });

    it('renames on a name clash, warns and keeps the script name', () => {
        // an entry made in the admin under the same name
        const other: PowerEntry = { ...(migrateLegacyPower([row], []).entries[0] as PowerEntry) };
        delete other.scriptName;
        delete other.scriptNavigation;
        const first = migrateLegacyPower([row], [other]);
        const entry = first.entries[1] as PowerEntry;

        expect(entry.uniqueName).to.equal('energie_power');
        expect(entry.scriptName).to.equal('energie');
        expect(first.messages).to.have.length(1);
        expect(first.messages[0]).to.contain('energie_power');
        expect(findPowerEntryForScript(first.entries, 'energie')).to.equal(entry);

        const second = migrateLegacyPower([row], [other, { ...entry, scriptName: 'x' }]);
        expect(second.entries[2].uniqueName).to.equal('energie_power2');
    });

    it('skips rows migrated before and rows without a name', () => {
        const once = migrateLegacyPower([row], []);
        const twice = migrateLegacyPower([row, { pageName: '  ' }], once.entries);

        expect(twice.changed).to.equal(false);
        expect(twice.entries).to.have.length(1);
    });

    it('collects the states of all values for the unit lookup', () => {
        expect(legacyPowerStates([row, { pageName: 'y', power5_state: ' a.b ' }])).to.deep.equal([
            '0_userdata.0.pv',
            '0_userdata.0.battery',
            '0_userdata.0.house',
            'a.b',
        ]);
    });

    it('ends the script navigation once the admin assigns one', () => {
        const e = migrateLegacyPower([row], []).entries[0] as PowerEntry;
        const assigned = dropScriptNavigation({ ...e, navigationAssignment: [{ topic: 't' }] }) as PowerEntry;

        expect(assigned.scriptNavigation).to.equal(undefined);
        expect(assigned.scriptName).to.equal('energie');
        expect(isScriptNavigatedPower(assigned)).to.equal(false);
        expect(dropScriptNavigation(e)).to.equal(e);
    });
});

describe('pages/pagePower - buildPowerPage', () => {
    it('uses the runtime page name for the internal sum and the page id', () => {
        const e = migrateLegacyPower([{ pageName: 'energie', power8_selInternalCalculation: true }], []).entries[0];
        const adapter = { config: {} as Record<string, unknown> };
        const page = buildPowerPage(e as PowerEntry, adapter, 'scriptName');

        expect(page.uniqueID).to.equal('scriptName');
        expect(JSON.stringify(page.config)).to.contain('///scriptName/powerSum');
        expect((adapter.config.pagePowerdata as { pageName: string }[])[0].pageName).to.equal('scriptName');
    });
});
