import type { ConfigManager } from '../classes/config-manager';
import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { Color } from '../const/Color';
import { getIconEntryColor, getPayload } from '../const/tools';
import { chartDefaults, type ChartDetailsExternal, type ChartEntry } from '../types/adminShareConfig';
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

/**
 * Page config of a chart page from a PageConfig entry. The DB source travels as JSON in the
 * const item `dbData` (see ChartDetailsExternal); the script source only uses `ticks` and `value`.
 * Used by the admin pages (admin.ts) and by script pages that refer to a chart entry.
 *
 * @param entry chart entry as stored by the PageConfig editor
 */
export function buildChartPageConfig(entry: ChartEntry): pages.cardChartDataItemOptions {
    const d = chartDefaults;
    const dbData: ChartDetailsExternal | undefined =
        entry.selInstanceDataSource === 1
            ? {
                  instance: entry.selInstance || '',
                  state: entry.setStateForDB || '',
                  hours: entry.rangeHours ?? d.rangeHours,
                  maxTicks: entry.maxXAxisTicks ?? d.maxXAxisTicks,
                  factor: entry.factorCardChart ?? d.factorCardChart,
                  maxLabels: entry.maxXAxisLabels ?? d.maxXAxisLabels,
              }
            : undefined;
    return {
        card: entry.selChartType || d.selChartType,
        data: {
            headline: { type: 'const', constVal: entry.headline || 'Page Chart' },
            text: { type: 'const', constVal: entry.txtLabelYAchse || '' },
            color: { true: { color: { type: 'const', constVal: entry.chartColor || d.chartColor } } },
            ticks: { type: 'triggered', dp: entry.setStateForTicks || '' },
            value: { type: 'triggered', dp: entry.setStateForValues || entry.setStateForDB || '' },
            dbData: dbData ? { type: 'const', constVal: JSON.stringify(dbData) } : undefined,
        },
    };
}

/** what a chart asks the history for */
export type HistoryQuery = {
    /** 'average' (one value per interval) or 'none' (raw values) */
    aggregate: 'average' | 'none';
    /** number of intervals (bar: hours, line: fine grid) */
    count: number;
    /** do not return more entries than this; left out = no limit (pie: one aggregated value only) */
    limit?: number;
    /** true = no extra points before start and after end (pie: one average only) */
    removeBorderValues?: boolean;
    /** digits after the decimal point, default 1 */
    round?: number;
};

/** the cards the chart classes draw: bar, line (PageChart) and pie (PageChartPie) */
const chartCards: readonly pages.PageTypeCards[] = ['cardChart', 'cardLChart', 'cardPChart'];

export class PageChart extends Page {
    items: pages.cardChartDataItems | undefined;
    protected dbDetails?: ChartDetailsExternal;
    /** running getHistory timeouts, one per state id (the pie chart queries several states) */
    protected chartTimeouts: Map<string, ioBroker.Timeout> = new Map();
    /** last history result per state id, returned while a query for the same state is still running */
    protected oldDatabaseData: Map<string, any[]> = new Map();

    constructor(config: PageInterface, options: pages.PageBase) {
        if (!chartCards.includes(config.card)) {
            return;
        }
        super(config, options);
        if (options.config && chartCards.includes(options.config.card)) {
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
        const message = await this.getUpdateMessage();
        if (!this.visibility) {
            // the panel moved on while the history was read - nothing to draw any more
            return;
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
     * The fields of the next entityUpd: bar and line chart read ticks and values via getChartData,
     * the pie chart overrides this with its slices.
     */
    protected async getUpdateMessage(): Promise<Partial<pages.PageChartMessage>> {
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
        return message;
    }

    /**
     * Script page `type: 'cardChart' | 'cardLChart'` that refers to a chart entry of the page config
     * (deprecated transition after the migration of the table "Page Chart"): the entry delivers the
     * content, the script the navigation. The page keeps the script name as id, so prev/next in the
     * script still match even if the migration renamed the entry.
     *
     * @param configManager the running ConfigManager
     * @param entry chart entry of the page config
     * @param gridItem page base to extend
     * @param page the script page definition
     */
    static async getChartPageConfigFromEntry(
        configManager: ConfigManager,
        entry: ChartEntry,
        gridItem: pages.PageBase,
        page: ScriptConfig.PageChart,
    ): Promise<pages.PageBase> {
        const config = buildChartPageConfig(entry);
        if (page.heading) {
            config.data.headline = await configManager.getFieldAsDataItemConfig(page.heading);
        }
        return {
            ...gridItem,
            uniqueID: page.uniqueName,
            alwaysOn: page.alwaysOnDisplay ? 'always' : (entry.alwaysOn ?? 'none'),
            hidden: !!(page.hiddenByTrigger || entry.hidden),
            config,
            pageItems: [],
        };
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
     * Reads history values via `getHistory` of a history/sql/influxdb instance over the last hours.
     *
     * @param _id state id to read
     * @param _rangeHours time window in hours, ending now
     * @param _instance db instance, `influxdb.0` or `system.adapter.influxdb.0`
     * @param query what the chart type needs from the history, see getDataFromDBWindow; `limit` defaults to `count`
     */
    protected async getDataFromDB(
        _id: string,
        _rangeHours: number,
        _instance: string,
        query: HistoryQuery,
    ): Promise<any[] | null> {
        const end = Date.now();
        return this.getDataFromDBWindow(_id, end - _rangeHours * 60 * 60 * 1000, end, _instance, {
            ...query,
            limit: query.limit ?? query.count,
        });
    }

    /**
     * Reads history values via `getHistory` of a history/sql/influxdb instance over an explicit window
     * (pie chart: calendar ranges with a fixed start and end).
     *
     * @param _id state id to read
     * @param start start of the window in milliseconds
     * @param end end of the window in milliseconds
     * @param _instance db instance, `influxdb.0` or `system.adapter.influxdb.0`
     * @param query what the chart type needs from the history
     * @param query.aggregate 'average' (one value per interval) or 'none' (raw values)
     * @param query.count number of intervals (bar: hours, line: fine grid)
     * @param query.limit do not return more entries than this, left out = no limit
     * @param query.removeBorderValues true = no extra points before start and after end (pie: one average only)
     * @param query.round digits after the decimal point, default 1
     */
    protected async getDataFromDBWindow(
        _id: string,
        start: number,
        end: number,
        _instance: string,
        query: HistoryQuery,
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
            if (this.chartTimeouts.has(_id)) {
                resolve(this.oldDatabaseData.get(_id) ?? null);
                return;
            }
            const timeout = this.adapter.setTimeout(() => {
                this.chartTimeouts.delete(_id);
                if (this.unload || this.adapter.unload) {
                    resolve(null);
                    return;
                }
                reject(
                    new Error(`PageChart: ${this.name} - DB: ${_instance} - Timeout getting history for state ${_id}`),
                );
            }, 15_000);
            if (timeout) {
                this.chartTimeouts.set(_id, timeout);
            }
            try {
                this.adapter.sendTo(
                    _instance,
                    'getHistory',
                    {
                        id: _id,
                        options: {
                            start,
                            end,
                            /** number of intervals for 'average' (one value per interval, spread over start..end) */
                            count: query.count,
                            /** do not return more entries than limit (not sent for an aggregated single value) */
                            ...(query.limit !== undefined ? { limit: query.limit } : {}),
                            /** if null values should be included (false), replaced by last not null value (true) or replaced with 0 (0) */
                            ignoreNull: true,
                            aggregate: query.aggregate,
                            /** round result to number of digits after decimal point */
                            round: query.round ?? 1,
                            ...(query.removeBorderValues ? { removeBorderValues: true } : {}),
                        },
                    },
                    result => {
                        const timeout = this.chartTimeouts.get(_id);
                        if (timeout) {
                            this.adapter.clearTimeout(timeout);
                        }
                        this.chartTimeouts.delete(_id);
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
                                this.oldDatabaseData.set(_id, result.result);
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

    protected getMessage(_message: Partial<pages.PageChartMessage>): string {
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
        for (const timeout of this.chartTimeouts.values()) {
            this.adapter.clearTimeout(timeout);
        }
        this.chartTimeouts.clear();
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
