import { Page, type PageInterface } from '../classes/Page';
import { Color } from '../const/Color';
import { getEntryTextOnOff, getIconEntryColor, getPayload } from '../const/tools';
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
    items: pages.PageBaseConfig['items'];
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
        if (options.config && options.config.card == 'cardChart') {
            this.config = options.config;
        }
        this.minUpdateInterval = 1000;
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
        this.items = tempItem as pages.cardChartDataItems;
        // set card because we lose it
        this.items.card = 'cardChart';
        await super.init();
    }

    /**
     *
     * @returns
     */
    public async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        this.panel.lastCard = '';
        this.sendType();
        const message: Partial<pages.PageChartMessage> = {};
        const items = this.items;
        if (!items || items.card !== 'cardChart') {
            return;
        }
        const data = items.data;

        message.headline = (data.headline && (await data.headline.getTranslatedString())) ?? this.name;
        message.navigation = this.getNavigation();
        message.color = await getIconEntryColor(data.color, true, Color.White);
        message.text = (await getEntryTextOnOff(data.text, true)) ?? '';
        message.value = (data.value && (await data.value.getString())) ?? '';
        message.ticks = [];
        const ticks = data.ticks && (await data.ticks.getObject());
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
        this.sendToPanel(this.getMessage(message));
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
    /**
     *a
     *
     * @param _event
     * @returns
     */
    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        //if (event.page && event.id && this.pageItems) {
        //    this.pageItems[event.id as any].setPopupAction(event.action, event.opt);
        //}
    }
}
