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
            const chartData = await this.getChartData();

            message.headline = (items.data.headline && (await items.data.headline.getTranslatedString())) ?? this.name;
            message.navigation = this.getNavigation();
            message.color = await getIconEntryColor(items.data.color, true, Color.White);
            message.text = (items.data.text && (await items.data.text.getString())) ?? '';
            message.value = chartData.values;
            message.ticks = chartData.ticks;
            /*message.ticks = [];
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
            } */
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
    private async getChartData(): Promise<{ ticks: string[]; values: string }> {
        let ticks: string[] = [];
        let values = '';

        const config = this.adapter.config.pageChartdata[this.index];

        let instanceDataSource = '';
        switch (config.selInstanceDataSource) {
            case 1:
                instanceDataSource = config.selInstanceHistory;
                break;
            case 2:
                instanceDataSource = config.selInstanceInflux;
                break;
            case 3:
                instanceDataSource = config.selInstanceSQL;
                break;

            default:
                break;
        }

        if (this.items && config != null) {
            const items = this.items;

            switch (config.selInstanceDataSource) {
                case 0: {
                    // oldScriptVersion
                    const tempTicks = (items.data.ticks && (await items.data.ticks.getObject())) ?? [];
                    const tempValues = (items.data.value && (await items.data.value.getObject())) ?? '';
                    if (tempTicks && Array.isArray(tempTicks)) {
                        ticks = tempTicks;
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
                            ticks.push(String(currentTick));
                            currentTick += tick;
                        }
                    }
                    if (tempValues && typeof tempValues === 'string') {
                        values = tempValues;
                    }
                    break;
                }
                case 1: {
                    // History
                    const rangeHours = config.rangeHours;
                    const maxXAchsisTicks = config.maxXAxisTicks;
                    const factor = 1;

                    this.adapter.sendTo(
                        instanceDataSource,
                        'getHistory',
                        {
                            id: config.setStateForValues,
                            options: {
                                start: Date.now() - 60 * 60 * 1000 * rangeHours,
                                end: Date.now(),
                                count: rangeHours,
                                limit: rangeHours,
                                aggregate: 'average',
                            },
                        },
                        function (result) {
                            let cardChartString = '';
                            const stepXAchsis = rangeHours / maxXAchsisTicks;

                            for (let i = 0; i < rangeHours; i++) {
                                const deltaHour = rangeHours - i;
                                const targetDate = new Date(Date.now() - deltaHour * 60 * 60 * 1000);

                                //Check history items for requested hours
                                if (result && result.message) {
                                    for (let j = 0, targetValue = 0; j < result.message.length; j++) {
                                        const valueDate = new Date(result.message[j].ts);
                                        const value = Math.round((result.message[j].val / factor) * 10);

                                        if (valueDate > targetDate) {
                                            if (targetDate.getHours() % stepXAchsis == 0) {
                                                cardChartString += `${targetValue}^${targetDate.getHours()}:00` + `~`;
                                            } else {
                                                cardChartString += `${targetValue}~`;
                                            }
                                            break;
                                        } else {
                                            targetValue = value;
                                        }
                                    }
                                }
                            }

                            values = cardChartString.substring(0, cardChartString.length - 1);
                        },
                    );
                    if (typeof values === 'string') {
                        const timeValueRegEx = /~\d+:(\d+)/g;
                        const sorted: number[] = [...(values.matchAll(timeValueRegEx) || [])]
                            .map(x => parseFloat(x[1]))
                            .sort((x, y) => (x < y ? -1 : 1));
                        const minValue = sorted[0];
                        const maxValue = sorted[sorted.length - 1];
                        const tick = Math.max(Number(((maxValue - minValue) / 5).toFixed()), 10);
                        let currentTick = minValue - tick;
                        while (currentTick < maxValue + tick) {
                            ticks.push(String(currentTick));
                            currentTick += tick;
                        }
                    }
                    break;
                }
                case 2: {
                    // influx
                    let idMeasurement = config.txtNameMeasurements;
                    if (idMeasurement == '' || idMeasurement == undefined) {
                        idMeasurement = config.setStateForValues;
                    }

                    const influxDbBucket = '';
                    const numberOfHoursAgo = config.rangeHours;
                    const xAxisTicksEveryM = config.maxXAxisTicks;
                    const xAxisLabelEveryM = config.maxXaxisLabels;
                    const query = [
                        `from(bucket: "${influxDbBucket}")`,
                        `|> range(start: -${numberOfHoursAgo}h)`,
                        `|> filter(fn: (r) => r["_measurement"] == "${idMeasurement}")`,
                        '|> filter(fn: (r) => r["_field"] == "value")',
                        '|> drop(columns: ["from", "ack", "q"])',
                        '|> aggregateWindow(every: 1h, fn: last, createEmpty: false)',
                        '|> map(fn: (r) => ({ r with _rtime: int(v: r._time) - int(v: r._start)}))',
                        '|> yield(name: "_result")',
                    ].join('');

                    console.log(`Query: ${query}`);

                    const result: any = await this.adapter.sendToAsync(instanceDataSource, 'query', query);
                    if (result.error) {
                        console.error(result.error);
                        ticks = [];
                        values = '';
                        return { ticks, values };
                    }
                    console.log(JSON.stringify(result));
                    const numResults = result.result.length;
                    let coordinates = '';
                    for (let r = 0; r < numResults; r++) {
                        const list: string[] = [];
                        const numValues = result.result[r].length;

                        for (let i = 0; i < numValues; i++) {
                            const time = Math.round(result.result[r][i]._rtime / 1000 / 1000 / 1000 / 60);
                            const value = Math.round(result.result[r][i]._value * 10);
                            list.push(`${time}:${value}`);
                        }

                        coordinates = list.join('~');
                        console.log(coordinates);
                    }

                    const ticksAndLabelsList: string[] = [];
                    const date = new Date();
                    date.setMinutes(0, 0, 0);
                    const ts = Math.round(date.getTime() / 1000);
                    const tsYesterday = ts - numberOfHoursAgo * 3600;
                    console.log(`Iterate from ${tsYesterday} to ${ts} stepsize=${xAxisTicksEveryM * 60}`);
                    for (let x = tsYesterday, i = 0; x < ts; x += xAxisTicksEveryM * 60, i += xAxisTicksEveryM) {
                        if (i % xAxisLabelEveryM) {
                            ticksAndLabelsList.push(`${i}`);
                        } else {
                            const currentDate = new Date(x * 1000);
                            // Hours part from the timestamp
                            const hours = `0${String(currentDate.getHours())}`;
                            // Minutes part from the timestamp
                            const minutes = `0${String(currentDate.getMinutes())}`;
                            const formattedTime = `${hours.slice(-2)}:${minutes.slice(-2)}`;

                            ticksAndLabelsList.push(`${String(i)}^${formattedTime}`);
                        }
                    }
                    console.log(`Ticks & Label: ${ticksAndLabelsList.join(', ')}`);
                    console.log(`Coordinates: ${coordinates}`);
                    ticks = ticksAndLabelsList;
                    values = coordinates;
                    break;
                }
                case 3: {
                    break;
                }
                case 4: {
                    break;
                }
                default:
                    break;
            }
        }

        return { ticks, values };
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
