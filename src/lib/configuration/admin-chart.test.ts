import { expect } from 'chai';
import {
    chartDefaults,
    dropScriptNavigation,
    emptyChartEntry,
    findChartEntryForScript,
    isScriptNavigatedChart,
    migrateLegacyCharts,
    type ChartEntry,
    type LegacyChartRow,
    type PageConfigEntry,
} from '../types/adminShareConfig';
import { buildChartPageConfig } from '../pages/pageChart';

/**
 * The query object the runtime reads from the const item dbData, if any.
 *
 * @param entry Chart entry as stored by the PageConfig editor.
 * @returns The parsed JSON of dbData, or undefined when the entry uses the script source.
 */
function dbDataOf(entry: ChartEntry): Record<string, unknown> | undefined {
    const item = buildChartPageConfig(entry).data.dbData;
    if (!item || !('constVal' in item) || typeof item.constVal !== 'string') {
        return undefined;
    }
    return JSON.parse(item.constVal);
}

describe('lib/configuration - buildChartPageConfig', () => {
    it('uses the script states and no dbData for the script source', () => {
        const entry: ChartEntry = {
            ...emptyChartEntry('strom'),
            setStateForTicks: '0_userdata.0.Charts.Strom.scale',
            setStateForValues: '0_userdata.0.Charts.Strom.werte',
        };
        const config = buildChartPageConfig(entry);

        expect(config.card).to.equal('cardChart');
        expect(config.data.ticks).to.deep.equal({ type: 'triggered', dp: '0_userdata.0.Charts.Strom.scale' });
        expect(config.data.value).to.deep.equal({ type: 'triggered', dp: '0_userdata.0.Charts.Strom.werte' });
        expect(config.data.dbData).to.equal(undefined);
    });

    it('carries the DB query as JSON with the defaults for fields that were left empty', () => {
        // exactly what the editor stores when the user only picks instance and state
        const entry: ChartEntry = {
            card: 'cardChart',
            uniqueName: 'temperatur',
            selChartType: 'cardLChart',
            selInstanceDataSource: 1,
            selInstance: 'influxdb.0',
            setStateForDB: 'accuweather.0.Current.Temperature',
        };
        const config = buildChartPageConfig(entry);

        expect(config.card).to.equal('cardLChart');
        expect(config.data.value).to.deep.equal({ type: 'triggered', dp: 'accuweather.0.Current.Temperature' });
        expect(dbDataOf(entry)).to.deep.equal({
            instance: 'influxdb.0',
            state: 'accuweather.0.Current.Temperature',
            hours: 24,
            maxTicks: 2,
            factor: 1,
            maxLabels: 4,
        });
    });

    it('keeps the values that were typed in', () => {
        const entry: ChartEntry = {
            ...emptyChartEntry('strom'),
            selInstanceDataSource: 1,
            selInstance: 'sql.0',
            setStateForDB: 'alias.0.Stromdaten.Leistung',
            rangeHours: 48,
            maxXAxisTicks: 4,
            factorCardChart: 100,
            maxXAxisLabels: 6,
        };

        expect(dbDataOf(entry)).to.deep.equal({
            instance: 'sql.0',
            state: 'alias.0.Stromdaten.Leistung',
            hours: 48,
            maxTicks: 4,
            factor: 100,
            maxLabels: 6,
        });
    });

    it('falls back to the defaults for chart type and color', () => {
        const config = buildChartPageConfig({ card: 'cardChart', uniqueName: 'x' });

        expect(config.card).to.equal(chartDefaults.selChartType);
        expect(config.data.color).to.deep.equal({
            true: { color: { type: 'const', constVal: chartDefaults.chartColor } },
        });
        expect(config.data.headline).to.deep.equal({ type: 'const', constVal: 'Page Chart' });
    });

    it('creates new entries with the same defaults the adapter falls back to', () => {
        // display (editor), storage (handleAdd) and runtime (admin.ts) must not diverge — see #777
        const entry = emptyChartEntry('neu');

        expect(entry.card).to.equal('cardChart');
        expect(entry.headline).to.equal('neu');
        expect(entry.chartColor).to.equal(chartDefaults.chartColor);
        expect(entry.selChartType).to.equal(chartDefaults.selChartType);
        expect(entry.selInstanceDataSource).to.equal(chartDefaults.selInstanceDataSource);
        expect(entry.rangeHours).to.equal(chartDefaults.rangeHours);
        expect(entry.maxXAxisTicks).to.equal(chartDefaults.maxXAxisTicks);
        expect(entry.factorCardChart).to.equal(chartDefaults.factorCardChart);
        expect(entry.maxXAxisLabels).to.equal(chartDefaults.maxXAxisLabels);
        expect(entry.alwaysOn).to.equal('none');
        expect(entry.hidden).to.equal(false);
    });
});

describe('lib/types/adminShareConfig - migration of the table "Page Chart"', () => {
    const row: LegacyChartRow = {
        pageName: 'heizung',
        headline: 'Heizung',
        alwaysOnDisplay: true,
        hiddenByTrigger: false,
        chart_color: '#00FF00',
        selChartType: 'cardLChart',
        selInstanceDataSource: 1,
        selInstance: 'influxdb.0',
        setStateForTicks: '',
        setStateForValues: '',
        setStateForDB: '0_userdata.0.power',
        txtlabelYAchse: 'W',
        rangeHours: 12,
        maxXAxisTicks: 3,
        factorCardChart: 10,
        maxXAxisLabels: 6,
    };
    const qr: PageConfigEntry = {
        card: 'cardQR',
        uniqueName: 'heizung',
        headline: 'QR',
        ssidUrlTel: '',
        setState: '',
        wlanhidden: false,
        pwdhidden: false,
    };

    it('maps the old field names and keeps the navigation in the script', () => {
        const { entries, messages, changed } = migrateLegacyCharts([row], []);

        expect(changed).to.equal(true);
        expect(messages).to.deep.equal([]);
        expect(entries).to.deep.equal([
            {
                card: 'cardChart',
                uniqueName: 'heizung',
                scriptName: 'heizung',
                scriptNavigation: true,
                headline: 'Heizung',
                chartColor: '#00FF00',
                txtLabelYAchse: 'W',
                selChartType: 'cardLChart',
                selInstanceDataSource: 1,
                setStateForTicks: '',
                setStateForValues: '',
                selInstance: 'influxdb.0',
                setStateForDB: '0_userdata.0.power',
                rangeHours: 12,
                maxXAxisTicks: 3,
                factorCardChart: 10,
                maxXAxisLabels: 6,
                hidden: false,
                alwaysOn: 'always',
            },
        ]);
        expect(isScriptNavigatedChart(entries[0])).to.equal(true);
    });

    it('fills missing values with the chart defaults', () => {
        const entry = migrateLegacyCharts([{ pageName: 'x' }], []).entries[0] as ChartEntry;

        expect(entry.chartColor).to.equal(chartDefaults.chartColor);
        expect(entry.selChartType).to.equal('cardChart');
        expect(entry.selInstanceDataSource).to.equal(0);
        expect(entry.rangeHours).to.equal(chartDefaults.rangeHours);
        expect(entry.alwaysOn).to.equal('none');
        expect(entry.hidden).to.equal(false);
    });

    it('renames on a name clash, warns and keeps the script name', () => {
        const first = migrateLegacyCharts([row], [qr]);
        const entry = first.entries[1] as ChartEntry;

        expect(entry.uniqueName).to.equal('heizung_chart');
        expect(entry.scriptName).to.equal('heizung');
        expect(first.messages).to.have.length(1);
        expect(first.messages[0]).to.contain('heizung_chart');

        // a second clash counts up
        const second = migrateLegacyCharts([{ ...row, pageName: 'heizung' }], [qr, { ...entry, scriptName: 'other' }]);
        expect(second.entries[2].uniqueName).to.equal('heizung_chart2');
    });

    it('skips rows migrated before and rows without a name', () => {
        const once = migrateLegacyCharts([row], []);
        const twice = migrateLegacyCharts([row, { pageName: '  ' }], once.entries);

        expect(twice.changed).to.equal(false);
        expect(twice.entries).to.deep.equal(once.entries);
        expect(migrateLegacyCharts(undefined, []).changed).to.equal(false);
    });

    it('finds the entry of a script page by its script name first', () => {
        const migrated = migrateLegacyCharts([row], [qr]).entries;

        expect(findChartEntryForScript(migrated, 'heizung')?.uniqueName).to.equal('heizung_chart');
        expect(findChartEntryForScript(migrated, 'heizung_chart')?.uniqueName).to.equal('heizung_chart');
        expect(findChartEntryForScript(migrated, 'nope')).to.equal(undefined);
    });

    it('ends the script navigation once the admin assigns one', () => {
        const entry = migrateLegacyCharts([row], []).entries[0];

        expect(dropScriptNavigation(entry)).to.equal(entry);
        expect(dropScriptNavigation({ ...entry, navigationAssignment: [] })).to.deep.equal({
            ...entry,
            navigationAssignment: [],
        });

        const assigned = dropScriptNavigation({ ...entry, navigationAssignment: [{ topic: 'nspanel/x' }] });
        expect(assigned).to.not.have.property('scriptNavigation');
        expect((assigned as ChartEntry).scriptName).to.equal('heizung');
        expect(isScriptNavigatedChart(assigned)).to.equal(false);
    });
});
