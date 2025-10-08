import { PageChart } from './pageChart';
import { type PageInterface } from '../classes/PageInterface';
import type * as pages from '../types/pages';

export class PageChartLine extends PageChart {
    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        // Aufruf des Konstruktors der Basisklasse
        super(config, options);
        this.adminConfig = this.adapter.config.pageChartdata[this.index];
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardChartDataItemOptions> =
            this.enums || this.dpInit
                ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardChartDataItems> = await this.basePanel.statesControler.createDataItems(
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
                    const hoursRangeFromNow = this.adminConfig.rangeHours || 24;
                    const stateValue = this.adminConfig.setStateForDB;
                    const instance = this.adminConfig.selInstance;
                    const xAxisTicksInterval =
                        this.adminConfig.maxXAxisTicks > 0 ? this.adminConfig.maxXAxisTicks * 60 : 60;
                    const xAxisLabelInterval =
                        this.adminConfig.maxXAxisLabels > 0 ? this.adminConfig.maxXAxisLabels * 60 : 120;
                    const maxX = 1440; // 24h = 1440min

                    const tempScale: number[] = [];

                    try {
                        const dbDaten = await this.getDataFromDB(stateValue, hoursRangeFromNow, instance);
                        if (dbDaten && Array.isArray(dbDaten) && dbDaten.length > 0) {
                            this.log.debug(`Data from DB: ${JSON.stringify(dbDaten)}`);

                            let ticksAndLabels = '';
                            let coordinates = '';

                            const ticksAndLabelsList = [];
                            const date = new Date();
                            date.setMinutes(0, 0, 0);
                            const ts = Math.round(date.getTime() / 1000);
                            const tsYesterday = ts - hoursRangeFromNow * 3600;

                            for (
                                let x = tsYesterday, i = 0;
                                x < ts;
                                x += xAxisTicksInterval * 60, i += xAxisTicksInterval
                            ) {
                                if (i % xAxisLabelInterval) {
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
                            const lastTs = Math.round(dbDaten[dbDaten.length - 1].ts / 1000);
                            const counter = dbDaten.length > 1 ? Math.max((lastTs - offSetTime) / maxX, 1) : 1;
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
                            if (tempScale.length > 0) {
                                // Round min down to nearest 10 and max up to nearest 10
                                const rawMax = Math.max(...tempScale);
                                const rawMin = Math.min(...tempScale);
                                const roundedMin = Math.floor(rawMin / 10) * 10;
                                const roundedMax = Math.ceil(rawMax / 10) * 10;

                                // ensure at least a minimal span to avoid zero intervall
                                const span = Math.max(roundedMax - roundedMin, 10);
                                const intervall = Math.max(Number((span / 5).toFixed()), 10);

                                this.log.debug(
                                    `Scale Min: ${roundedMin} (raw ${rawMin}), Max: ${roundedMax} (raw ${rawMax}) Intervall: ${intervall}`,
                                );

                                let currentTick = roundedMin - intervall * 2;
                                while (currentTick < roundedMax + intervall) {
                                    ticksChart.push(String(currentTick));
                                    currentTick += intervall;
                                }
                            }
                        } else {
                            this.log.warn(
                                `No data found for state ${stateValue} in the last ${hoursRangeFromNow} hours`,
                            );
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
