import type { ConfigManager } from '../classes/config-manager';
import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { Color } from '../const/Color';
import { getIconEntryColor, getPayload } from '../const/tools';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
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

/**
 * untested
 */
export class PageChart extends Page {
    items: pages.cardChartDataItems | undefined;
    index: number = 0;
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;
    adminConfig = this.adapter.config.pageChartdata[this.index];

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        if (config.card !== 'cardChart') {
            return;
        }
        super(config, options);
        if (options.config && options.config.card == 'cardChart') {
            this.config = options.config;
        } else {
            throw new Error('Missing config!');
        }
        this.index = this.config.index;
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardChartDataItemOptions> =
            this.enums || this.dpInit
                ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardChartDataItems> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        if (tempItem) {
            tempItem.card = 'cardChart';
        }
        this.items = tempItem as pages.cardChartDataItems;
        await super.init();
    }

    /**
     *
     * @returns // TODO: remove this
     */
    public async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        const message: Partial<pages.PageChartMessage> = {};
        if (this.items && this.adminConfig != null) {
            const items = this.items;
            const chartData = await this.getChartData();

            message.headline = (items.data.headline && (await items.data.headline.getTranslatedString())) ?? this.name;
            message.navigation = this.getNavigation();
            message.color = await getIconEntryColor(items.data.color, true, Color.White);
            message.text = (items.data.text && (await items.data.text.getString())) ?? '';
            message.value = chartData.valuesChart;
            message.ticks = chartData.ticksChart;
        }
        if (message.value) {
            this.log.debug(message.value);
        }
        if (message.ticks) {
            this.log.debug(`Ticks: ${message.ticks.join(',')}`);
        }
        this.sendToPanel(this.getMessage(message), false);
    }

    static async getChartPageConfig(
        adapter: NspanelLovelaceUi,
        index: number,
        configManager: ConfigManager,
    ): Promise<pages.PageBaseConfig> {
        const config = adapter.config.pageChartdata[index];
        let stateExistValue = '';
        let stateExistTicks = '';
        if (config) {
            if (await configManager.existsState(config.setStateForValues)) {
                stateExistValue = config.setStateForValues;
            }
            if (await configManager.existsState(config.setStateForTicks)) {
                stateExistTicks = config.setStateForTicks;
            }

            const result: pages.PageBaseConfig = {
                uniqueID: config.pageName,
                alwaysOn: config.alwaysOnDisplay ? 'always' : 'none',
                config: {
                    card: 'cardChart',
                    index: index,
                    data: {
                        headline: { type: 'const', constVal: config.headline || '' },
                        text: { type: 'const', constVal: config.txtlabelYAchse || '' },
                        color: { true: { color: { type: 'const', constVal: config.chart_color } } },
                        ticks: { type: 'triggered', dp: stateExistTicks },
                        value: { type: 'triggered', dp: stateExistValue },
                    },
                },
                pageItems: [],
            };
            return result;
        }
        throw new Error('No config for cardChart found');
    }

    private async getChartData(): Promise<{ ticksChart: string[]; valuesChart: string }> {
        let ticksChart: string[] = [];
        let valuesChart = '';

        if (this.items && this.adminConfig != null) {
            const items = this.items;

            switch (this.adminConfig.selInstanceDataSource) {
                case 0: {
                    // oldScriptVersion
                    const tempTicks = (items.data.ticks && (await items.data.ticks.getObject())) ?? [];
                    const tempValues = (items.data.value && (await items.data.value.getString())) ?? '';
                    if (tempTicks && Array.isArray(tempTicks)) {
                        ticksChart = tempTicks;
                    } else if (typeof tempValues === 'string') {
                        const timeValueRegEx = /~\d+:(\d+)/g;
                        const sorted: number[] = [...(tempValues.matchAll(timeValueRegEx) || [])]
                            .map(x => parseFloat(x[1]))
                            .sort((x, y) => (x < y ? -1 : 1));
                        const minValue = sorted[0];
                        const maxValue = sorted[sorted.length - 1];
                        const tick = Math.max(Number(((maxValue - minValue) / 5).toFixed()), 10);
                        let currentTick = minValue - tick;
                        while (currentTick < maxValue + tick) {
                            ticksChart.push(String(currentTick));
                            currentTick += tick;
                        }
                    }
                    if (tempValues && typeof tempValues === 'string') {
                        valuesChart = tempValues;
                    }
                    break;
                }
                case 1: {
                    // AdapterVersion

                    const rangeHours = this.adminConfig.rangeHours;
                    const stateValue = this.adminConfig.setStateForValues;
                    const instance = this.adminConfig.selInstance;
                    const maxXAxisTicks = this.adminConfig.maxXAxisTicks;
                    const factor = 100;

                    try {
                        const dbDaten = await this.getDataFromDB(stateValue, rangeHours, instance);
                        if (dbDaten && Array.isArray(dbDaten)) {
                            this.log.debug(`Data from DB: ${JSON.stringify(dbDaten)}`);

                            const stepXAchsis = rangeHours / maxXAxisTicks;

                            for (let i = 0; i < rangeHours; i++) {
                                const deltaHour = rangeHours - i;
                                const targetDate = new Date(Date.now() - deltaHour * 60 * 60 * 1000);

                                //Check history items for requested hours
                                for (let j = 0, targetValue = 0; j < dbDaten.length; j++) {
                                    const valueDate = new Date(dbDaten[j].ts);
                                    const value = Math.round((dbDaten[j].val / factor) * 10);

                                    if (valueDate > targetDate) {
                                        if (targetDate.getHours() % stepXAchsis == 0) {
                                            valuesChart += `${targetValue}^${targetDate.getHours()}:00` + `~`;
                                        } else {
                                            valuesChart += `${targetValue}~`;
                                        }
                                        break;
                                    } else {
                                        targetValue = value;
                                    }
                                }
                            }

                            valuesChart = valuesChart.substring(0, valuesChart.length - 1);

                            if (typeof valuesChart === 'string') {
                                let timeValueRegEx;
                                if (this.adminConfig.selChartType == 1) {
                                    timeValueRegEx = /(?<=~)[^:^~]+/g; // Funktioniert nur bei BarChart
                                } else {
                                    timeValueRegEx = /~\d+:(\d+)/g; // Funktioniert nur bei LineChart
                                }
                                const sorted = [...(valuesChart.matchAll(timeValueRegEx) || [])]
                                    .map(x => parseFloat(x[1]))
                                    .sort((x, y) => (x < y ? -1 : 1));
                                const minValue = sorted[0];
                                const maxValue = sorted[sorted.length - 1];
                                const tick = Math.max(Number(((maxValue - minValue) / 5).toFixed()), 10);
                                let currentTick = minValue - tick;
                                while (currentTick < maxValue + tick) {
                                    ticksChart.push(String(currentTick));
                                    currentTick += tick;
                                }
                            }
                        }
                    } catch (error) {
                        this.log.error(`Error fetching data from DB: ${error}`);
                    }
                    break;
                }
                default:
                    break;
            }
        }

        return { ticksChart, valuesChart };
    }

    private async getDataFromDB(_id: string, _rangeHours: number, _instance: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.adapter.sendTo(
                    _instance,
                    'getHistory',
                    {
                        id: _id,
                        options: {
                            start: Date.now() - _rangeHours * 60 * 60 * 1000,
                            end: Date.now(),
                            count: _rangeHours,
                            limit: _rangeHours,
                            ignoreNull: true,
                            aggregate: 'onchange',
                        },
                    },
                    function (result) {
                        if (result && 'result' in result) {
                            if (Array.isArray(result.result)) {
                                for (let i = 0; i < result.result.length; i++) {
                                    console.log(
                                        `Value: ${result.result[i].val}, ISO-Timestring: ${new Date(result.result[i].ts).toISOString()}`,
                                    );
                                }
                                if (Array.isArray(result.result)) {
                                    resolve(result.result);
                                } else {
                                    reject(new Error('Unexpected result format'));
                                }
                            } else {
                                reject(new Error('No data found'));
                            }
                        }
                    },
                );
            }, 1000);
        });
    }

    private getMessage(_message: Partial<pages.PageChartMessage>): string {
        let result: pages.PageChartMessage = PageChartMessageDefault;
        result = Object.assign(result, _message) as pages.PageChartMessage;
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
        if (val && this.adminConfig.selInstanceDataSource === 1) {
            this.adapter
                .getForeignStateAsync(`system.adapter.${this.adminConfig.selInstance}.alive`)
                .then(state => {
                    if (state && state.val) {
                        this.log.debug(`Instance ${this.adminConfig.selInstance} is alive`);
                    } else {
                        this.log.debug(`Instance ${this.adminConfig.selInstance} is not alive`);
                    }
                })
                .catch(e => {
                    this.log.debug(`Instance ${this.adminConfig.selInstance} not found: ${e}`);
                });
        } else if (this.adminConfig.selInstanceDataSource === 0) {
            // check if value state exists
            this.adapter
                .getForeignStateAsync(this.adminConfig.setStateForValues)
                .then(state => {
                    if (state && state.val) {
                        this.log.debug(`State ${this.adminConfig.setStateForValues} for Values is exists`);
                    } else {
                        this.log.debug(`State ${this.adminConfig.setStateForValues} for Values is not exists`);
                    }
                })
                .catch(e => {
                    this.log.debug(`State ${this.adminConfig.setStateForValues} not found: ${e}`);
                });
            // check if ticks state exists
            this.adapter
                .getForeignStateAsync(this.adminConfig.setStateForTicks)
                .then(state => {
                    if (state && state.val) {
                        this.log.debug(`State ${this.adminConfig.setStateForTicks} for Ticks is exists`);
                    } else {
                        this.log.debug(`State ${this.adminConfig.setStateForTicks} for ticks is not exists`);
                    }
                })
                .catch(e => {
                    this.log.debug(`State ${this.adminConfig.setStateForTicks} not found: ${e}`);
                });
        }
        await super.onVisibilityChange(val);
    }

    protected async onStateTrigger(_id: string): Promise<void> {
        if (this.unload) {
            return;
        }
        this.adapter.setTimeout(() => this.update(), 50);
    }

    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        //if (event.page && event.id && this.pageItems) {
        //    this.pageItems[event.id as any].setPopupAction(event.action, event.opt);
        //}
    }
}
