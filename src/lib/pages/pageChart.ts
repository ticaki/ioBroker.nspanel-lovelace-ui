import type { ConfigManager } from '../classes/config-manager';
import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { Color } from '../const/Color';
import { getIconEntryColor, getPayload } from '../const/tools';
import { chartDefaults, type ChartDetailsExternal } from '../types/adminShareConfig';
import type * as pages from '../types/pages';
import type { IncomingEvent } from '../types/types';

const PageChartMessageDefault: pages.PageChartMessage = {
    event: 'entityUpd',
    headline: 'Page Chart',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    color: '', //Balkenfarbe
    text: '', //Bezeichnung y Achse
    ticks: [], //Werte y Achse
    value: '', //Werte x Achse
};

/** what a chart page sends: y ticks and the value string, both in the x10 space of the panel */
export type ChartData = {
    ticksChart: string[];
    valuesChart: string;
    /** the values were divided by this factor (line chart, automatic); 1 or undefined = untouched */
    factor?: number;
};

export class PageChart extends Page {
    items: pages.cardChartDataItems | undefined;
    protected dbDetails?: ChartDetailsExternal;
    protected chartTimeout: ioBroker.Timeout | undefined | null;
    protected oldDatabaseData: any[] | null = null;

    constructor(config: PageInterface, options: pages.PageBase) {
        if (config.card !== 'cardChart' && config.card !== 'cardLChart') {
            return;
        }
        super(config, options);
        if (options.config && (options.config.card == 'cardChart' || options.config.card == 'cardLChart')) {
            this.config = options.config;
        } else {
            throw new Error('Missing config!');
        }
        this.minUpdateInterval = 60_000;
    }

    async init(): Promise<void> {
        if (this.items && this.items.data && this.items.data.dbData) {
            const dbDetails = await this.items.data.dbData.getObject();
            if (isChartDetailsExternal(dbDetails)) {
                this.dbDetails = dbDetails;
            }
        }
        await super.init();
    }

    public async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        await super.update();
        const message: Partial<pages.PageChartMessage> = {};
        message.navigation = this.getNavigation();
        message.headline = `Error`;
        message.ticks = ['~'];
        message.value = '~';

        if (this.items) {
            const items = this.items;
            const { valuesChart, ticksChart, factor } = await this.getChartData();

            message.headline = (items.data.headline && (await items.data.headline.getTranslatedString())) ?? this.name;
            message.color = await getIconEntryColor(items.data.color, true, Color.White);
            const text = (items.data.text && (await items.data.text.getString())) ?? '';
            // the y-axis label carries the automatic factor, e.g. "W x10"
            message.text = factor && factor > 1 ? `${text} x${factor}`.trim() : text;
            message.value = valuesChart;
            message.ticks = ticksChart;
        }
        if (message.value) {
            this.log.debug(`Value: ${message.value}`);
        }
        if (message.ticks) {
            this.log.debug(`Ticks: ${message.ticks.join(',')}`);
        }
        this.sendType(true);
        this.sendToPanel(this.getMessage(message), false);
    }

    /**
     * Classic path: a script page `type: 'cardChart' | 'cardLChart'` matched by `pageName` against the
     * admin table `pageChartdata`. Produces the same page config as the PageConfig tab (see admin.ts),
     * including the `dbData` item for the DB source, so both configuration ways share one code path.
     *
     * @param configManager the running ConfigManager (adapter access, state checks)
     * @param index index of the matching entry in `adapter.config.pageChartdata`
     * @param gridItem page base to extend
     * @param messages collected configuration messages
     * @param page the script page definition
     */
    static async getChartPageConfig(
        configManager: ConfigManager,
        index: number,
        gridItem: pages.PageBase,
        messages: string[],
        page: ScriptConfig.PageChart,
    ): Promise<{ gridItem: pages.PageBase; messages: string[] }> {
        const adapter = configManager.adapter;
        const config = adapter.config.pageChartdata[index];
        let stateExistValue = '';
        let stateExistTicks = '';
        if (config) {
            const card = config.selChartType;
            adapter.log.debug(`get pageconfig Card: ${card}`);
            const useDb = config.selInstanceDataSource === 1;
            if (useDb) {
                // AdapterVersion
                if (await configManager.existsState(config.setStateForDB)) {
                    stateExistValue = config.setStateForDB;
                }
            } else {
                // oldScriptVersion
                if (await configManager.existsState(config.setStateForValues)) {
                    stateExistValue = config.setStateForValues;
                }
            }
            if (await configManager.existsState(config.setStateForTicks)) {
                stateExistTicks = config.setStateForTicks;
            }
            const dbData: ChartDetailsExternal | undefined = useDb
                ? {
                      instance: config.selInstance || '',
                      state: stateExistValue,
                      hours: config.rangeHours || chartDefaults.rangeHours,
                      maxTicks: config.maxXAxisTicks || chartDefaults.maxXAxisTicks,
                      factor: config.factorCardChart || chartDefaults.factorCardChart,
                      maxLabels: config.maxXAxisLabels || chartDefaults.maxXAxisLabels,
                  }
                : undefined;

            gridItem = {
                ...gridItem,
                uniqueID: config.pageName,
                alwaysOn: page.alwaysOnDisplay || config.alwaysOnDisplay ? 'always' : 'none',
                hidden: page.hiddenByTrigger || config.hiddenByTrigger,
                config: {
                    card: card,
                    data: {
                        headline: await configManager.getFieldAsDataItemConfig(page.heading || config.headline || ''),
                        text: { type: 'const', constVal: config.txtlabelYAchse || '' },
                        color: { true: { color: { type: 'const', constVal: config.chart_color } } },
                        ticks: { type: 'triggered', dp: stateExistTicks },
                        value: { type: 'triggered', dp: stateExistValue },
                        dbData: dbData ? { type: 'const', constVal: JSON.stringify(dbData) } : undefined,
                    },
                },
                pageItems: [],
            };
            return { gridItem, messages };
        }
        throw new Error('No config for cardChart found');
    }

    // Überschreiben der getChartData-Methode
    async getChartData(ticksChart: string[] = ['~'], valuesChart = '~'): Promise<ChartData> {
        // oldScriptVersion bleibt unverändert
        if (this.items) {
            const items = this.items;
            const tempTicks = (items.data.ticks && (await items.data.ticks.getObject())) ?? [];
            const tempValues = (items.data.value && (await items.data.value.getString())) ?? '';
            if (tempTicks && Array.isArray(tempTicks) && tempTicks.length > 0) {
                ticksChart = tempTicks;
            }
            if (tempValues && typeof tempValues === 'string' && tempValues.length > 0) {
                valuesChart = tempValues;
            }
        }
        this.log.debug(`Data from States (oldScriptVersion)`);
        return { ticksChart, valuesChart };
    }

    async getChartDataDB(ticksChart: string[] = ['~'], valuesChart = '~'): Promise<ChartData> {
        this.log.warn('getChartDataDB not implemented in base PageChart class');
        return { ticksChart, valuesChart };
    }

    /**
     * Reads history values via `getHistory` of a history/sql/influxdb instance.
     *
     * @param _id state id to read
     * @param _rangeHours time window in hours, ending now
     * @param _instance db instance, `influxdb.0` or `system.adapter.influxdb.0`
     * @param query what the chart type needs from the history
     * @param query.aggregate 'average' (one value per interval) or 'none' (raw values)
     * @param query.count number of intervals (bar: hours, line: fine grid); also used as `limit`
     */
    protected async getDataFromDB(
        _id: string,
        _rangeHours: number,
        _instance: string,
        query: { aggregate: 'average' | 'none'; count: number },
    ): Promise<any[] | null> {
        if (!_instance) {
            return null;
        }
        // accept both `influxdb.0` (admin table, PageConfig tab) and `system.adapter.influxdb.0`
        const instanceId = _instance.startsWith('system.adapter.') ? _instance : `system.adapter.${_instance}`;
        const alive = await this.adapter.getForeignStateAsync(`${instanceId}.alive`);
        if (!alive || !alive.val) {
            this.log.warn(`PageChart: ${this.name} - DB instance ${_instance} is not alive`);
            return null;
        }
        if (this.unload || this.adapter.unload) {
            return null;
        }
        return new Promise((resolve, reject) => {
            if (this.chartTimeout) {
                resolve(this.oldDatabaseData || null);
                return;
            }
            this.chartTimeout = this.adapter.setTimeout(() => {
                this.chartTimeout = null;
                if (this.unload || this.adapter.unload) {
                    resolve(null);
                    return;
                }
                reject(
                    new Error(`PageChart: ${this.name} - DB: ${_instance} - Timeout getting history for state ${_id}`),
                );
            }, 15_000);
            try {
                this.adapter.sendTo(
                    _instance,
                    'getHistory',
                    {
                        id: _id,
                        options: {
                            start: Date.now() - _rangeHours * 60 * 60 * 1000,
                            end: Date.now(),
                            /** number of intervals for 'average' (one value per interval, spread over start..end) */
                            count: query.count,
                            /** do not return more entries than limit */
                            limit: query.count,
                            /** if null values should be included (false), replaced by last not null value (true) or replaced with 0 (0) */
                            ignoreNull: true,
                            aggregate: query.aggregate,
                            /** round result to number of digits after decimal point */
                            round: 1,
                        },
                    },
                    result => {
                        if (this.chartTimeout) {
                            this.adapter.clearTimeout(this.chartTimeout);
                        }
                        this.chartTimeout = null;
                        if (this.unload || this.adapter.unload) {
                            resolve(null);
                            return;
                        }
                        if (result && 'result' in result) {
                            if (Array.isArray(result.result)) {
                                this.log.debug(`Data points retrieved from DB: ${result.result.length}`);
                                this.log.debug(`Data points: ${JSON.stringify(result.result)}`);
                                for (let i = 0; i < result.result.length; i++) {
                                    this.log.debug(
                                        `Value: ${result.result[i].val}, ISO-Timestring: ${new Date(result.result[i].ts).toISOString()}`,
                                    );
                                }
                                this.oldDatabaseData = result.result;
                                resolve(result.result);
                                return;
                            }
                        }
                        reject(new Error('No data found'));
                        return;
                    },
                );
            } catch (error) {
                reject(new Error(`Error in getDataFromDB: ${error as string}`));
            }
        });
    }

    private getMessage(_message: Partial<pages.PageChartMessage>): string {
        let result: pages.PageChartMessage = PageChartMessageDefault;
        result = { ...result, ..._message };
        return getPayload(
            'entityUpd',
            result.headline,
            result.navigation,
            result.color,
            result.text,
            result.ticks.join(':'),
            result.value,
        );
    }

    protected async onVisibilityChange(val: boolean): Promise<void> {
        // breche laufenden Timer immer ab wenn sich die Sichtbarkeit ändert
        if (val) {
            await this.update();
        }
    }

    protected async onStateTrigger(_id: string): Promise<void> {
        if (this.unload || this.adapter.unload) {
            return;
        }
        this.adapter.setTimeout(() => this.update(), 50);
    }

    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        //if (event.page && event.id && this.pageItems) {
        //    this.pageItems[event.id as any].setPopupAction(event.action, event.opt);
        //}
    }

    async delete(): Promise<void> {
        if (this.chartTimeout) {
            this.adapter.clearTimeout(this.chartTimeout);
        }
        this.chartTimeout = null;
        await super.delete();
    }
}

export function isChartDetailsExternal(obj: unknown): obj is ChartDetailsExternal {
    if (!obj || typeof obj !== 'object') {
        return false;
    }
    const o = obj as Record<string, unknown>;
    return typeof o.instance === 'string' && o.instance !== '' && typeof o.state === 'string' && o.state !== '';
}
