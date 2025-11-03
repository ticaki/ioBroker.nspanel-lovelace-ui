import { type PageInterface } from '../classes/PageInterface';
import type * as pages from '../types/pages';
import { isChartDetailsExternal, PageChart } from './pageChart';

export class PageChartBar extends PageChart {
    constructor(config: PageInterface, options: pages.PageBase) {
        // Aufruf des Konstruktors der Basisklasse
        super(config, options);
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
        // Wenn DB Details vorhanden sind, getChartData auf getChartDataDB setzen
        // Dies ist notwendig, da PageChart die Methode getChartDataScript als Standardmethode hat
        if (this.items && this.items.data && this.items.data.dbData) {
            const dbDetails = await this.items.data.dbData.getObject();
            if (isChartDetailsExternal(dbDetails)) {
                this.dbDetails = dbDetails;
                this.getChartData = this.getChartDataDB;
            }
        }
        await super.init();
    }

    // Eventuelles überschreiben der getChartData-Methode
    async getChartDataDB(
        ticksChart: string[] = ['~'],
        valuesChart = '~',
    ): Promise<{ ticksChart: string[]; valuesChart: string }> {
        if (this.dbDetails) {
            const items = this.dbDetails;

            const rangeHours = items.hours || 24;
            const stateValue = items.state || '';
            const instance = items.instance || '';
            const maxXAxisLabels = items.maxLabels || 4;
            const factor = items.factor || 1;
            const tempScale: number[] = [];

            try {
                const dbDaten = await this.getDataFromDB(stateValue, rangeHours, instance);
                if (dbDaten && Array.isArray(dbDaten) && dbDaten.length > 0) {
                    this.log.debug(`Data from DB: ${JSON.stringify(dbDaten)}`);

                    const stepXAchsis = rangeHours / maxXAxisLabels;

                    valuesChart = '';
                    for (let i = 0; i < rangeHours; i++) {
                        const deltaHour = rangeHours - i;
                        const targetDate = new Date(Date.now() - deltaHour * 3600 * 1000);

                        //Check history items for requested hours
                        for (let j = 0, targetValue = 0; j < dbDaten.length; j++) {
                            const valueDate = new Date(dbDaten[j].ts);
                            const value = Math.round((dbDaten[j].val / factor) * 10);
                            tempScale.push(value);

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

                    // create ticks
                    const max = Math.max(...tempScale);
                    const min = 0;
                    const intervall = Math.max(Number(((max - min) / 5).toFixed()), 10);

                    this.log.debug(`Scale Min: ${min}, Max: ${max} Intervall: ${intervall}`);

                    const tempTickChart: string[] = [];
                    let currentTick = min;
                    while (currentTick < max + intervall) {
                        tempTickChart.push(String(currentTick));
                        currentTick += intervall;
                    }
                    ticksChart = tempTickChart;
                } else {
                    this.log.warn(`No data found for state ${stateValue} in the last ${rangeHours} hours`);
                }
            } catch (error) {
                this.log.error(`Error fetching data from DB: ${error as string}`);
            }
        }

        return { ticksChart, valuesChart };
    }
}
