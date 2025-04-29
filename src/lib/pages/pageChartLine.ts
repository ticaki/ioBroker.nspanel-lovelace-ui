import { PageChart } from './pageChart';
import { type PageInterface } from '../classes/PageInterface';
import type * as pages from '../types/pages';

export class PageChartLine extends PageChart {
    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        // Aufruf des Konstruktors der Basisklasse
        super(config, options);
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

                    const rangeHours = this.adminConfig.rangeHours;
                    const stateValue = this.adminConfig.setStateForValues;
                    const instance = this.adminConfig.selInstance;
                    const maxXAxisTicks = this.adminConfig.maxXAxisTicks;
                    //const factor = this.adminConfig.factorCardChart;
                    const tempScale: number[] = [];

                    try {
                        const dbDaten = await this.getDataFromDB(stateValue, rangeHours, instance);
                        if (dbDaten && Array.isArray(dbDaten)) {
                            this.log.debug(`Data from DB: ${JSON.stringify(dbDaten)}`);

                            let coordinates = '';
                            for (let r = 0; r < dbDaten.length; r++) {
                                const list: string[] = [];
                                const numValues = dbDaten[r].length;

                                for (let i = 0; i < numValues; i++) {
                                    const time = Math.round(dbDaten[r][i]._rtime / 1000 / 1000 / 1000 / 60);
                                    const value = Math.round(dbDaten[r][i]._value * 10);
                                    list.push(`${time}:${value}`);
                                    tempScale.push(value);
                                }
                                coordinates = list.join('~');
                                this.log.debug(coordinates);
                            }

                            const ticksAndLabelsList: string[] = [];
                            const date = new Date();
                            date.setMinutes(0, 0, 0);
                            const ts = Math.round(date.getTime() / 1000);
                            const tsYesterday = ts - rangeHours * 3600;

                            this.log.debug(`Iterate from ${tsYesterday} to ${ts} stepsize=${maxXAxisTicks * 60}`);

                            for (let x = tsYesterday, i = 0; x < ts; x += maxXAxisTicks * 60, i += maxXAxisTicks) {
                                if (i % maxXAxisTicks) {
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

                            this.log.debug(`Ticks & Label: ${JSON.stringify(ticksAndLabelsList)}`);
                            this.log.debug(`Coordinates: ${coordinates}`);

                            valuesChart = `${ticksAndLabelsList.join('+')}~${coordinates}`;

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
