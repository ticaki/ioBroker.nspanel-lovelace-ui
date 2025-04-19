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
        const config = this.adapter.config.pageChartdata[this.index];
        if (this.items && config != null) {
            const items = this.items;

            message.headline = (items.data.headline && (await items.data.headline.getTranslatedString())) ?? this.name;
            message.navigation = this.getNavigation();
            message.color = await getIconEntryColor(items.data.color, true, Color.White);
            message.text = (items.data.text && (await items.data.text.getString())) ?? '';
            message.value = (items.data.value && (await items.data.value.getString())) ?? '';
            message.ticks = [];
            const ticks = items.data.ticks && (await items.data.ticks.getObject());
            if (ticks && Array.isArray(ticks)) {
                message.ticks = ticks;
            } else if (message.value) {
                const timeValueRegEx = /~\d+:(\d+)/g;
                const sorted: number[] = [...(message.value.matchAll(timeValueRegEx) || [])]
                    .map(x => parseFloat(x[1]))
                    .sort((x, y) => (x < y ? -1 : 1));
                const minValue = sorted[0];
                const maxValue = sorted[sorted.length - 1];
                const tick = Math.max(Number(((maxValue - minValue) / 5).toFixed()), 10);
                let currentTick = minValue - tick;
                while (currentTick < maxValue + tick) {
                    message.ticks.push(String(currentTick));
                    currentTick += tick;
                }
            }
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
                        color: { true: { color: { type: 'const', constVal: Color.Yellow } } },
                        ticks: { type: 'triggered', dp: stateExistTicks },
                        value: { type: 'triggered', dp: stateExistValue },
                    },
                },
                pageItems: [],
            };
            return result;
        }
        throw new Error('No config for cardQR found');
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
        return '';
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
