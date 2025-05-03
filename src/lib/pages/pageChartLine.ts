import { PageChart } from './pageChart';
import { type PageInterface } from '../classes/PageInterface';
import type * as pages from '../types/pages';

export class PageChartLine extends PageChart {
    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        // Aufruf des Konstruktors der Basisklasse
        super(config, options);
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
            tempItem.card = this.card as 'cardChart';
            this.log.debug(`init Card: ${this.card}`);
        }
        this.items = tempItem as pages.cardChartDataItems;
        await super.init();
    }

    // Überschreiben der getChartData-Methode
    async getChartData(): Promise<{ ticksChart: string[]; valuesChart: string }> {
        let ticksChart: string[] = [];
        let valuesChart = '';

        if (this.items && this.adminConfig != null) {
            const items = this.items;

            switch (this.adminConfig.selInstanceDataSource) {
                case 0: {
                    // oldScriptVersion bleibt unverändert
                    const tempTicks = (items.data.ticks && (await items.data.ticks.getObject())) ?? [];
                    const tempValues = (items.data.value && (await items.data.value.getString())) ?? '';
                    if (tempTicks && Array.isArray(tempTicks)) {
                        ticksChart = tempTicks;
                    }
                    if (tempValues && typeof tempValues === 'string') {
                        valuesChart = tempValues;
                    }
                    break;
                }
                case 1: {
                    // AdapterVersion

                    const numberOfHoursAgo = this.adminConfig.rangeHours;
                    const stateValue = this.adminConfig.setStateForValues;
                    const instance = this.adminConfig.selInstance;
                    const xAxisTicksEveryM = 60; //this.adminConfig.maxXAxisTicks;
                    const xAxisLabelEveryM = this.adminConfig.maxXaxisLabels * 60;
                    const maxX = 1440; // 24h = 1440min

                    const tempScale: number[] = [];

                    try {
                        const dbDaten = await this.getDataFromDB(stateValue, numberOfHoursAgo, instance);
                        if (dbDaten && Array.isArray(dbDaten)) {
                            this.log.debug(`Data from DB: ${JSON.stringify(dbDaten)}`);

                            let ticksAndLabels = '';
                            let coordinates = '';

                            const ticksAndLabelsList = [];
                            const date = new Date();
                            date.setMinutes(0, 0, 0);
                            const ts = Math.round(date.getTime() / 1000);
                            const tsYesterday = ts - numberOfHoursAgo * 3600;

                            for (
                                let x = tsYesterday, i = 0;
                                x < ts;
                                x += xAxisTicksEveryM * 60, i += xAxisTicksEveryM
                            ) {
                                if (i % xAxisLabelEveryM) {
                                    ticksAndLabelsList.push(i);
                                } else {
                                    const currentDate = new Date(x * 1000);
                                    // Hours part from the timestamp
                                    const hours = `0${currentDate.getHours()}`;
                                    // Minutes part from the timestamp
                                    const minutes = `0${currentDate.getMinutes()}`;
                                    const formattedTime = `${hours.slice(-2)}:${minutes.slice(-2)}`;
                                    ticksAndLabelsList.push(`${String(i)}^${formattedTime}`);
                                }
                            }
                            ticksAndLabels = ticksAndLabelsList.join('+');

                            const list = [];
                            const offSetTime = Math.round(dbDaten[0].ts / 1000);
                            const counter = Math.round((dbDaten[dbDaten.length - 1].ts / 1000 - offSetTime) / maxX);
                            for (let i = 0; i < dbDaten.length; i++) {
                                const time = Math.round((dbDaten[i].ts / 1000 - offSetTime) / counter);
                                const value = Math.round(dbDaten[i].val * 10);
                                if (value != null && value != 0) {
                                    list.push(`${time}:${value}`);
                                    tempScale.push(value);
                                }
                            }

                            coordinates = list.join('~');
                            valuesChart = `${ticksAndLabels}~${coordinates}`;

                            this.log.debug(`Ticks & Label: ${ticksAndLabels}`);
                            this.log.debug(`Coordinates: ${coordinates}`);

                            // create ticks
                            let max = 0;
                            let min = 0;
                            let intervall = 0;

                            max = Math.max(...tempScale);
                            min = Math.min(...tempScale);
                            this.log.debug(`Scale Min: ${min}, Max: ${max}`);

                            intervall = Math.round(max / 4);
                            ticksChart.push(String(min));

                            for (let count = 0; count < 4; count++) {
                                min = Math.round(min + intervall);
                                ticksChart.push(String(min));
                            }
                        }
                    } catch (error) {
                        this.log.error(`Error fetching data from DB: ${error as string}`);
                    }
                    break;
                }
                default:
                    break;
            }
        }

        return { ticksChart, valuesChart };
    }
}
