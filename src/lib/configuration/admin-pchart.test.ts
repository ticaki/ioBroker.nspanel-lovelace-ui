import { expect } from 'chai';
import {
    emptyPChartEntry,
    emptyPChartSlot,
    PCHART_MAX_SLICES,
    PCHART_SOURCE_SCRIPT,
    PCHART_CUSTOM_HOURS_DEFAULT,
    PCHART_SOURCE_SLOTS,
    pchartDefaults,
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

    it('slot source with a range: dbData with instance and range key, value items without trigger', () => {
        const ranged: PChartEntry = { ...entry, rangeKey: 'lastMonth', selInstance: 'influxdb.0' };
        const config = buildPChartPageConfig(ranged);

        expect(dbDataOf(ranged)).to.deep.equal({ instance: 'influxdb.0', rangeKey: 'lastMonth' });
        expect(config.data.slices?.map(s => s?.value)).to.deep.equal([
            { type: 'state', dp: 'alias.0.Netz.Bezug' },
            { type: 'state', dp: 'alias.0.PV.Eigen' },
            { type: 'state', dp: 'alias.0.Netz.Einspeisung' },
        ]);
        expect(isPChartDetailsExternal(dbDataOf(ranged))).to.equal(true);
    });

    it('custom range: the hours travel with the query, other ranges carry none', () => {
        expect(dbDataOf({ ...entry, rangeKey: 'custom', rangeHours: 36, selInstance: 'sql.0' })).to.deep.equal({
            instance: 'sql.0',
            rangeKey: 'custom',
            hours: 36,
        });
        // custom without usable hours = the one default (editor, page config and resolveRange agree)
        expect(dbDataOf({ ...entry, rangeKey: 'custom', rangeHours: 0, selInstance: 'sql.0' })?.hours).to.equal(
            PCHART_CUSTOM_HOURS_DEFAULT,
        );
        expect(pchartDefaults.rangeHours).to.equal(PCHART_CUSTOM_HOURS_DEFAULT);
        expect(dbDataOf({ ...entry, rangeKey: 'd1', rangeHours: 36, selInstance: 'sql.0' })).to.deep.equal({
            instance: 'sql.0',
            rangeKey: 'd1',
        });
    });

    it('a range without an instance still builds (the page warns at runtime and shows 0), unknown keys mean current', () => {
        expect(dbDataOf({ ...entry, rangeKey: 'h1', selInstance: '' })).to.deep.equal({ instance: '', rangeKey: 'h1' });
        expect(dbDataOf({ ...entry, rangeKey: 'current', selInstance: 'sql.0' })).to.equal(undefined);
        expect(dbDataOf({ ...entry, rangeKey: 'nope' as PChartEntry['rangeKey'], selInstance: 'sql.0' })).to.equal(
            undefined,
        );
        expect(isPChartDetailsExternal({ instance: 'x', rangeKey: 'current' })).to.equal(false);
        expect(isPChartDetailsExternal({ instance: 'x', rangeKey: 'today' })).to.equal(true);
        expect(isPChartDetailsExternal({ instance: 'x', hours: 24 })).to.equal(false);
        expect(isPChartDetailsExternal(null)).to.equal(false);
    });

    it('script source: only the triggered data point, no slices and no dbData even with a range', () => {
        const script: PChartEntry = {
            ...entry,
            selInstanceDataSource: PCHART_SOURCE_SCRIPT,
            setStateForValues: '0_userdata.0.pie',
            rangeKey: 'd1',
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
        expect(config.data.slices?.[4]?.color).to.deep.equal({ type: 'const', constVal: pchartDefaults.slotColors[4] });
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
        expect(fresh.rangeKey).to.equal('current');
        expect(fresh.rangeHours).to.equal(pchartDefaults.rangeHours);
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
