import type { ConfigManager } from '../classes/config-manager';
import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { Color } from '../const/Color';
import { getIconEntryColor, getPayload } from '../const/tools';
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
    //index: number = 0;
    private checkState: boolean = true;
    //protected adminConfig;

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
        //this.index = this.config.index;
        this.minUpdateInterval = 60_000;
        //this.adminConfig = this.adapter.config.pageChartdata[this.index];
    }

    async init(): Promise<void> {
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
        message.ticks = ['~'];
        message.value = '~';

        if (this.checkState) {
            if (this.items) {
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
        this.sendType(true);
        this.sendToPanel(this.getMessage(message), false);
    }

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
            if (config.selInstanceDataSource === 1) {
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

            gridItem = {
                ...gridItem,
                uniqueID: config.pageName,
                alwaysOn: page.alwaysOnDisplay || config.alwaysOnDisplay ? 'always' : 'none',
                hidden: page.hiddenByTrigger || config.hiddenByTrigger,
                config: {
                    card: card,
                    //index: index,
                    data: {
                        headline: await configManager.getFieldAsDataItemConfig(page.heading || config.headline || ''),
                        text: { type: 'const', constVal: config.txtlabelYAchse || '' },
                        color: { true: { color: { type: 'const', constVal: config.chart_color } } },
                        ticks: { type: 'triggered', dp: stateExistTicks },
                        value: { type: 'triggered', dp: stateExistValue },
                    },
                },
                pageItems: [],
            };
            return { gridItem, messages };
        }
        throw new Error('No config for cardChart found');
    }

    protected async getChartData(): Promise<{ ticksChart: string[]; valuesChart: string }> {
        const ticksChart: string[] = ['~'];
        const valuesChart = '~';
        this.log.warn('getChartData not implemented in base PageChart class');

        return { ticksChart, valuesChart };
    }

    protected async getDataFromDB(_id: string, _rangeHours: number, _instance: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            try {
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
                            aggregate: 'average',
                            round: 1,
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
            } catch (error) {
                reject(new Error(`Error in getDataFromDB: ${error as string}`));
            }
        });
    }

    private getMessage(_message: Partial<pages.PageChartMessage>): string {
        let result: pages.PageChartMessage = PageChartMessageDefault;
        result = { ...result, ..._message } as pages.PageChartMessage;
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
            // Neu: bei Sichtbarkeit immer neu prüfen
            this.checkState = false; // Standardmäßig auf false setzen
            if (!this.items) {
                this.log.warn('AdminConfig is not set, cannot check states');
                this.checkState = false;
            } else {
                // trys klein halten - die fangen auch alle vertipper ab und suchen ist dann lustig
                try {
                    const cfg: any = this.items.data;
                    const ds = cfg.selInstanceDataSource;

                    if (ds === 0) {
                        // Datenquelle: direkte States (setStateForValues + setStateForTicks)
                        if (cfg.setStateForValues != null && cfg.setStateForValues !== '') {
                            const state = await this.adapter.getForeignStateAsync(cfg.setStateForValues);
                            if (state && state.val !== null && state.val !== undefined) {
                                this.log.debug(
                                    `State ${cfg.setStateForValues} for Values exists and has value: ${state.val}`,
                                );
                                this.checkState = true; // Nur hier auf true setzen, wenn alles passt
                            } else if (state) {
                                this.log.warn(`State ${cfg.setStateForValues} for Values exists but has no value`);
                            } else {
                                this.log.error(`State ${cfg.setStateForValues} for Values does not exist`);
                            }
                        } else {
                            this.log.error('No setStateForValues configured');
                        }

                        if (cfg.setStateForTicks != null && cfg.setStateForTicks !== '') {
                            const state = await this.adapter.getForeignStateAsync(cfg.setStateForTicks);
                            if (state && state.val !== null && state.val !== undefined) {
                                this.log.debug(
                                    `State ${cfg.setStateForTicks} for Ticks exists and has value: ${state.val}`,
                                );
                                this.checkState = true;
                            } else if (state) {
                                this.log.warn(`State ${cfg.setStateForTicks} for Ticks exists but has no value`);
                                this.checkState = false;
                            } else {
                                this.log.error(`State ${cfg.setStateForTicks} for Ticks does not exist`);
                                this.checkState = false;
                            }
                        } else {
                            this.log.error('No setStateForTicks configured');
                            this.checkState = false;
                        }
                    } else if (ds === 1) {
                        // Datenquelle: Adapter-Instance (selInstance.alive + setStateForDB)
                        if (cfg.selInstance != null && cfg.selInstance !== '') {
                            const alive = await this.adapter.getForeignStateAsync(
                                `system.adapter.${cfg.selInstance}.alive`,
                            );
                            if (alive && alive.val) {
                                this.log.debug(`Instance ${cfg.selInstance} is alive`);
                                this.checkState = true;
                            } else {
                                this.log.warn(`Instance ${cfg.selInstance} is not alive`);
                                this.checkState = false;
                            }
                        } else {
                            this.log.error('No selInstance configured');
                            this.checkState = false;
                        }

                        if (cfg.setStateForDB != null && cfg.setStateForDB !== '') {
                            const state = await this.adapter.getForeignStateAsync(cfg.setStateForDB);
                            if (state) {
                                this.log.debug(`State ${cfg.setStateForDB} for DB exists`);
                                this.checkState = true;
                            } else {
                                this.log.warn(`State ${cfg.setStateForDB} for DB does not exist`);
                                this.checkState = false;
                            }
                        } else {
                            this.log.error('No setStateForDB configured');
                            this.checkState = false;
                        }
                    } else {
                        this.log.error('Unknown selInstanceDataSource, skipping specific checks');
                        this.checkState = false;
                    }
                } catch (error) {
                    this.log.error(`Error onVisibilityChange: ${error as string}`);
                }
            }
            // ich glaube nicht das du updaten willst, wenn das unsichtbar wird, auch wenns am anfang von this.update() abgefragt wird
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
}
