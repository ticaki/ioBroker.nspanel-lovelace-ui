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
    private checkState: boolean = true;
    protected adminConfig = this.adapter.config.pageChartdata[this.index];

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        if (config.card !== 'cardChart' && config.card !== 'cardLChart') {
            return;
        }
        super(config, options);
        if (options.config && (options.config.card == 'cardChart' || options.config.card == 'cardLChart')) {
            this.config = options.config;
        } else {
            throw new Error('Missing config!');
        }
        this.index = this.config.index;
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        /* const config = structuredClone(this.config);
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
            tempItem.card = this.card;
            this.log.debug(`init Card: ${this.card}`);
        }
        this.items = tempItem as pages.cardChartDataItems; */
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
        message.navigation = this.getNavigation();
        message.headline = `Error`;

        if (this.checkState) {
            if (this.items && this.adminConfig != null) {
                const items = this.items;
                const { valuesChart, ticksChart } = await this.getChartData();

                message.headline =
                    (items.data.headline && (await items.data.headline.getTranslatedString())) ?? this.name;
                message.color = await getIconEntryColor(items.data.color, true, Color.White);
                message.text = (items.data.text && (await items.data.text.getString())) ?? '';
                message.value = valuesChart;
                message.ticks = ticksChart;
            }
            if (message.value) {
                this.log.debug(`Value: ${message.value}`);
            }
            if (message.ticks) {
                this.log.debug(`Ticks: ${message.ticks.join(',')}`);
            }
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
            const card = config.selChartType;
            console.debug(`get pageconfig Card: ${card}`);
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
                    card: card,
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

    protected async getChartData(): Promise<{ ticksChart: string[]; valuesChart: string }> {
        const ticksChart: string[] = [];
        const valuesChart = '';

        return { ticksChart, valuesChart };
    }

    protected async getDataFromDB(_id: string, _rangeHours: number, _instance: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const timeout = this.adapter.setTimeout(() => {
                reject(new Error(`error  in system`));
            }, 5000);
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
                result => {
                    if (timeout) {
                        this.adapter.clearTimeout(timeout);
                    }
                    if (result && 'result' in result) {
                        if (Array.isArray(result.result)) {
                            for (let i = 0; i < result.result.length; i++) {
                                this.log.debug(
                                    `Value: ${result.result[i].val}, ISO-Timestring: ${new Date(result.result[i].ts).toISOString()}`,
                                );
                            }
                            resolve(result.result);
                        }
                    }
                    reject(new Error('No data found'));
                },
            );
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
        // check if value state exists
        if (val) {
            const state = await this.adapter.getForeignStateAsync(this.adminConfig.setStateForValues);
            if (state && state.val) {
                this.log.debug(`State ${this.adminConfig.setStateForValues} for Values is exists`);
            } else {
                this.log.debug(`State ${this.adminConfig.setStateForValues} for Values is not exists`);
                this.checkState = false;
            }
        }
        if (val && this.adminConfig.selInstanceDataSource === 1) {
            const state = await this.adapter.getForeignStateAsync(
                `system.adapter.${this.adminConfig.selInstance}.alive`,
            );
            if (state && state.val) {
                this.log.debug(`Instance ${this.adminConfig.selInstance} is alive`);
            } else {
                this.log.debug(`Instance ${this.adminConfig.selInstance} is not alive`);
                this.checkState = false;
            }
        } else if (val && this.adminConfig.selInstanceDataSource === 0) {
            // check if ticks state exists
            const state = await this.adapter.getForeignStateAsync(this.adminConfig.setStateForTicks);
            if (state && state.val) {
                this.log.debug(`State ${this.adminConfig.setStateForTicks} for Ticks is exists`);
            } else {
                this.log.debug(`State ${this.adminConfig.setStateForTicks} for ticks is not exists`);
                this.checkState = false;
            }
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
