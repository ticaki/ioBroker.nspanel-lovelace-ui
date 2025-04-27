import { PageChart } from './pageChart';
import { type PageInterface } from '../classes/PageInterface';
import type * as pages from '../types/pages';

export class PageBChart extends PageChart {
    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        // Aufruf des Konstruktors der Basisklasse
        super(config, options);
    }

    // Überschreiben der getChartData-Methode
    protected async getChartData(): Promise<{ ticksChart: string[]; valuesChart: string }> {
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
                    // Angepasster Abschnitt für AdapterVersion
                    const rangeHours = this.adminConfig.rangeHours;
                    const stateValue = this.adminConfig.setStateForValues;
                    const instance = this.adminConfig.selInstance;

                    try {
                        const dbDaten = await this.getDataFromDB(stateValue, rangeHours, instance);
                        if (dbDaten && Array.isArray(dbDaten)) {
                            this.log.debug(`Modified Data from DB: ${JSON.stringify(dbDaten)}`);

                            // Beispiel: Neue Logik für die Verarbeitung der Daten
                            dbDaten.forEach(entry => {
                                const valueDate = new Date(entry.ts);
                                const value = Math.round(entry.val * 100) / 100; // Beispiel: Werte auf 2 Dezimalstellen runden
                                valuesChart += `${value} (${valueDate.toISOString()})~`;
                            });

                            valuesChart = valuesChart.substring(0, valuesChart.length - 1);

                            // Beispiel: Neue Logik für die Erstellung der Ticks
                            const min = Math.min(...dbDaten.map(entry => entry.val));
                            const max = Math.max(...dbDaten.map(entry => entry.val));
                            const interval = (max - min) / 5;

                            for (let i = 0; i <= 5; i++) {
                                ticksChart.push((min + i * interval).toFixed(2));
                            }
                        }
                    } catch (error) {
                        this.log.error(`Error fetching data from DB in PageBChart: ${error}`);
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
