import { type PageInterface } from '../classes/PageInterface';
import type * as pages from '../types/pages';
import { isChartDetailsExternal, PageChart } from './pageChart';

/**
 * Klasse zur Darstellung von Balkendiagrammen (Bar Charts)
 * Erweitert die PageChart-Klasse um spezifische Funktionalität für Balkendiagramme
 */
export class PageChartBar extends PageChart {
    constructor(config: PageInterface, options: pages.PageBase) {
        // Aufruf des Konstruktors der Basisklasse
        super(config, options);
    }

    /**
     * Initialisiert die Balkendiagramm-Seite
     * - Verarbeitet die Konfiguration (Auto-Modus über Enums oder dpInit)
     * - Erstellt die Datenelemente
     * - Prüft ob DB-Details vorhanden sind und setzt ggf. die DB-Datenabruf-Methode
     */
    async init(): Promise<void> {
        const config = structuredClone(this.config);

        // Suche nach States für den Auto-Modus (über Enums oder dpInit)
        const tempConfig: Partial<pages.cardChartDataItemOptions> =
            this.enums || this.dpInit
                ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;

        // Erstelle die Datenelemente aus der Konfiguration
        const tempItem: Partial<pages.cardChartDataItems> = await this.basePanel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        if (tempItem) {
            tempItem.card = this.card as 'cardChart';
            this.log.debug(`init Card: ${this.card}`);
        }
        this.items = tempItem as pages.cardChartDataItems;

        // Wenn DB-Details vorhanden sind, getChartData auf getChartDataDB setzen
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

    /**
     * Holt Diagrammdaten aus der Datenbank und bereitet sie für die Darstellung auf
     * Überschreibt die Standard-Methode aus PageChart für den Fall, dass DB-Details konfiguriert sind
     *
     * @param ticksChart - Array für die Y-Achsen-Beschriftung (Standard: ['~'])
     * @param valuesChart - String mit den Diagrammwerten (Standard: '~')
     * @returns Objekt mit ticksChart (Y-Achsen-Ticks) und valuesChart (Datenpunkte mit optionalen Zeitangaben)
     */
    async getChartDataDB(
        ticksChart: string[] = ['~'],
        valuesChart = '~',
    ): Promise<{ ticksChart: string[]; valuesChart: string }> {
        if (this.dbDetails) {
            const items = this.dbDetails;

            // Konfigurationsparameter aus den DB-Details extrahieren
            const rangeHours = items.hours || 24; // Zeitbereich in Stunden
            const stateValue = items.state || ''; // State-ID für die Daten
            const instance = items.instance || ''; // DB-Instanz
            const maxXAxisLabels = items.maxLabels || 4; // Maximale Anzahl der X-Achsen-Beschriftungen
            const factor = items.factor || 1; // Umrechnungsfaktor für die Werte
            const tempScale: number[] = []; // Temporäres Array für die Skalierung

            try {
                // Daten aus der Datenbank abrufen
                const dbDaten = await this.getDataFromDB(stateValue, rangeHours, instance);
                if (dbDaten && Array.isArray(dbDaten) && dbDaten.length > 0) {
                    this.log.debug(`Data from DB: ${JSON.stringify(dbDaten)}`);

                    // Berechne den Abstand zwischen X-Achsen-Beschriftungen
                    //const stepXAchsis = rangeHours / maxXAxisLabels;

                    valuesChart = '';
                    // Iteriere über jede Stunde im Zeitbereich
                    for (let i = 0; i < rangeHours; i++) {
                        const deltaHour = rangeHours - i;
                        const targetDate = new Date(Date.now() - deltaHour * 3600 * 1000);

                        // Suche den passenden Wert für die aktuelle Stunde in den DB-Daten
                        for (let j = 0, targetValue = 0; j < dbDaten.length; j++) {
                            const valueDate = new Date(dbDaten[j].ts);
                            const value = Math.round((dbDaten[j].val / factor) * 10);
                            tempScale.push(value);

                            // Wenn der DB-Eintrag nach der Zielzeit liegt
                            if (valueDate > targetDate) {
                                // Füge Zeitangabe hinzu, wenn es ein Label-Schritt ist
                                //if (targetDate.getHours() % stepXAchsis == 0) {
                                if (targetDate.getHours() % maxXAxisLabels == 0) {
                                    valuesChart += `${targetValue}^${targetDate.getHours()}:00~`;
                                } else {
                                    valuesChart += `${targetValue}~`;
                                }
                                break;
                            } else {
                                targetValue = value;
                            }
                        }
                    }

                    // Entferne das letzte Trennzeichen
                    valuesChart = valuesChart.substring(0, valuesChart.length - 1);

                    // Erstelle die Y-Achsen-Skalierung (Ticks)
                    const max = Math.max(...tempScale);
                    const min = 0;
                    const intervall = Math.max(Number(((max - min) / 5).toFixed()), 10);

                    this.log.debug(`Scale Min: ${min}, Max: ${max} Intervall: ${intervall}`);

                    // Erstelle Tick-Array für Y-Achse
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
