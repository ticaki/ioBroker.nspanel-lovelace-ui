import { expect } from 'chai';
import {
    emptyPChartEntry,
    emptyPChartSlot,
    PCHART_MAX_SLICES,
    PCHART_SOURCE_SCRIPT,
    PCHART_SOURCE_SLOTS,
    pchartDefaults,
    pchartRangeHours,
    pchartRangeHoursOf,
    pchartRangeOptionOf,
    type PChartEntry,
} from '../types/adminShareConfig';
import { buildPChartPageConfig, isPChartDetailsExternal } from '../pages/pageChartPie';

/**
 * The query object the runtime reads from the const item dbData, if any.
 *
 * @param entry pie chart entry as stored by the PageConfig editor
 * @returns the parsed JSON of dbData, or undefined without a range
 */
function dbDataOf(entry: PChartEntry): Record<string, unknown> | undefined {
    const item = buildPChartPageConfig(entry).data.dbData;
    if (!item || !('constVal' in item) || typeof item.constVal !== 'string') {
        return undefined;
    }
    return JSON.parse(item.constVal);
}

describe('lib/configuration - buildPChartPageConfig', () => {
    const entry: PChartEntry = {
        ...emptyPChartEntry('energie'),
        headline: 'Energie',
        legendMode: 1,
        decimals: 1,
        slots: [
            { name: 'Netzbezug', state: 'alias.0.Netz.Bezug', unit: 'kWh', color: '#ff0000' },
            { name: '', state: 'alias.0.PV.Eigen', unit: '', color: '' },
            { name: 'leer', state: '', unit: 'W', color: '#00ff00' },
            { name: 'Einspeisung', state: 'alias.0.Netz.Einspeisung', unit: 'kWh', color: '#0000ff' },
        ],
    };

    it('slot source without a range: triggered value items, no dbData, slots without a state are left out', () => {
        const config = buildPChartPageConfig(entry);

        expect(config.card).to.equal('cardPChart');
        expect(config.data.headline).to.deep.equal({ type: 'const', constVal: 'Energie' });
        expect(config.data.legendMode).to.deep.equal({ type: 'const', constVal: 1 });
        expect(config.data.decimals).to.deep.equal({ type: 'const', constVal: 1 });
        expect(config.data.value).to.equal(undefined);
        expect(config.data.dbData).to.equal(undefined);
        expect(config.data.slices).to.deep.equal([
            {
                name: { type: 'const', constVal: 'Netzbezug' },
                value: { type: 'triggered', dp: 'alias.0.Netz.Bezug' },
                unit: { type: 'const', constVal: 'kWh' },
                color: { type: 'const', constVal: '#ff0000' },
            },
            {
                // empty name and unit: the page reads common.name / common.unit; the color falls back to the slot default
                name: undefined,
                value: { type: 'triggered', dp: 'alias.0.PV.Eigen' },
                unit: undefined,
                color: { type: 'const', constVal: pchartDefaults.slotColors[1] },
            },
            {
                name: { type: 'const', constVal: 'Einspeisung' },
                value: { type: 'triggered', dp: 'alias.0.Netz.Einspeisung' },
                unit: { type: 'const', constVal: 'kWh' },
                color: { type: 'const', constVal: '#0000ff' },
            },
        ]);
    });

    it('slot source with a range: dbData with instance and hours, value items without trigger', () => {
        const ranged: PChartEntry = { ...entry, rangeHours: 24, selInstance: 'influxdb.0' };
        const config = buildPChartPageConfig(ranged);

        expect(dbDataOf(ranged)).to.deep.equal({ instance: 'influxdb.0', hours: 24 });
        expect(config.data.slices?.map(s => s?.value)).to.deep.equal([
            { type: 'state', dp: 'alias.0.Netz.Bezug' },
            { type: 'state', dp: 'alias.0.PV.Eigen' },
            { type: 'state', dp: 'alias.0.Netz.Einspeisung' },
        ]);
        expect(isPChartDetailsExternal(dbDataOf(ranged))).to.equal(true);
    });

    it('a range without an instance still builds (the page warns at runtime and shows 0)', () => {
        expect(dbDataOf({ ...entry, rangeHours: 1, selInstance: '' })).to.deep.equal({ instance: '', hours: 1 });
        expect(isPChartDetailsExternal({ instance: 'x', hours: 0 })).to.equal(false);
        expect(isPChartDetailsExternal(null)).to.equal(false);
    });

    it('script source: only the triggered data point, no slices and no dbData even with a range', () => {
        const script: PChartEntry = {
            ...entry,
            selInstanceDataSource: PCHART_SOURCE_SCRIPT,
            setStateForValues: '0_userdata.0.pie',
            rangeHours: 24,
            selInstance: 'influxdb.0',
        };
        const config = buildPChartPageConfig(script);

        expect(config.data.value).to.deep.equal({ type: 'triggered', dp: '0_userdata.0.pie' });
        expect(config.data.slices).to.equal(undefined);
        expect(config.data.dbData).to.equal(undefined);
    });

    it('cuts the slots to what the panel draws and falls back to the defaults', () => {
        const many: PChartEntry = {
            card: 'cardPChart',
            uniqueName: 'x',
            slots: Array.from({ length: 8 }, (_, i) => ({ state: `s.${i}` })),
        };
        const config = buildPChartPageConfig(many);

        expect(config.data.slices).to.have.length(PCHART_MAX_SLICES);
        expect(config.data.headline).to.deep.equal({ type: 'const', constVal: 'Page PChart' });
        expect(config.data.legendMode).to.deep.equal({ type: 'const', constVal: pchartDefaults.legendMode });
        expect(config.data.decimals).to.deep.equal({ type: 'const', constVal: pchartDefaults.decimals });
        expect(config.data.slices?.[5]?.color).to.deep.equal({ type: 'const', constVal: pchartDefaults.slotColors[5] });
    });

    it('an invalid legend mode becomes 3', () => {
        expect(buildPChartPageConfig({ ...entry, legendMode: 7 }).data.legendMode).to.deep.equal({
            type: 'const',
            constVal: 3,
        });
    });

    it('creates new entries with the slots as source and the same defaults the adapter falls back to', () => {
        const fresh = emptyPChartEntry('neu');

        expect(fresh.card).to.equal('cardPChart');
        expect(fresh.headline).to.equal('neu');
        expect(fresh.selInstanceDataSource).to.equal(PCHART_SOURCE_SLOTS);
        expect(fresh.legendMode).to.equal(pchartDefaults.legendMode);
        expect(fresh.decimals).to.equal(pchartDefaults.decimals);
        expect(fresh.rangeHours).to.equal(0);
        expect(fresh.selInstance).to.equal('');
        expect(fresh.setStateForValues).to.equal('');
        expect(fresh.slots).to.have.length(PCHART_MAX_SLICES);
        expect(fresh.slots?.[2]).to.deep.equal(emptyPChartSlot(2));
        expect(fresh.slots?.every(s => s.state === '')).to.equal(true);
        expect(new Set(fresh.slots?.map(s => s.color)).size).to.equal(PCHART_MAX_SLICES);
        expect(fresh.alwaysOn).to.equal('none');
        expect(fresh.hidden).to.equal(false);
        // a fresh entry builds a page without slices and without a DB query
        expect(buildPChartPageConfig(fresh).data.slices).to.deep.equal([]);
        expect(buildPChartPageConfig(fresh).data.dbData).to.equal(undefined);
    });
});

describe('lib/types/adminShareConfig - pie chart range', () => {
    it('maps the stored hours onto the range options and back', () => {
        expect(pchartRangeOptionOf(undefined)).to.equal('current');
        expect(pchartRangeOptionOf(0)).to.equal('current');
        expect(pchartRangeOptionOf(1)).to.equal('hour');
        expect(pchartRangeOptionOf(24)).to.equal('day');
        expect(pchartRangeOptionOf(168)).to.equal('week');
        expect(pchartRangeOptionOf(720)).to.equal('month');
        expect(pchartRangeOptionOf(36)).to.equal('custom');

        expect(pchartRangeHoursOf('current')).to.equal(0);
        expect(pchartRangeHoursOf('hour')).to.equal(1);
        expect(pchartRangeHoursOf('day')).to.equal(24);
        expect(pchartRangeHoursOf('week')).to.equal(pchartRangeHours.week);
        expect(pchartRangeHoursOf('month')).to.equal(24 * 30);
        expect(pchartRangeHoursOf('custom', 36)).to.equal(36);
    });

    it('custom without usable hours falls back to one hour', () => {
        expect(pchartRangeHoursOf('custom')).to.equal(1);
        expect(pchartRangeHoursOf('custom', 0)).to.equal(1);
        expect(pchartRangeHoursOf('custom', NaN)).to.equal(1);
    });
});
