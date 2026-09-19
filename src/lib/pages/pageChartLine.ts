import { isChartDetailsExternal, PageChart, type ChartData } from './pageChart';
import { buildLineScale } from './chart-scale';
import { type PageInterface } from '../classes/PageInterface';
import type * as pages from '../types/pages';

export class PageChartLine extends PageChart {
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
        // create DataItems
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
    async getChartDataDB(ticksChart: string[] = ['~'], valuesChart = '~'): Promise<ChartData> {
        let factor = 1;
        if (this.dbDetails) {
            const items = this.dbDetails;

            // AdapterVersion
            const hoursRangeFromNow = items.hours || 24; //Zeitspanne in Stunden, die von jetzt an zurückgerechnet wird
            const stateValue = items.state || ''; // State, von dem die Daten abgerufen werden sollen
            const instance = items.instance || ''; // Datenbankadapter-Instanz, die die Daten abruft
            const maxXAxisLabels = items.maxLabels || 4; // alle x Stunden ein Label, wenn maxLabels 4 ist, dann alle 4 Stunden ein Label
            const maxXAxisTicks = items.maxTicks || 2; // alle x Stunden ein Tick, wenn maxTicks 2 ist, dann alle 2 Stunden ein Tick
            const xAxisTicksInterval = maxXAxisTicks > 0 ? maxXAxisTicks * 60 : 60; // Intervall in Minuten zwischen den X-Achsen-Ticks (z.B. 60 für 1 Tick pro Stunde)
            const xAxisLabelInterval = maxXAxisLabels > 0 ? maxXAxisLabels * 60 : 120; // Intervall in Minuten zwischen den X-Achsen-Beschriftungen (z.B. 120 für 1 Beschriftung pro 2 Stunden)
            const maxX = hoursRangeFromNow * 60; // 24h = 1440min

            try {
                // averages on a 5-minute grid (24 h = 288 points), capped at 500 — spread over the whole window
                const dbDaten = await this.getDataFromDB(stateValue, hoursRangeFromNow, instance, {
                    aggregate: 'average',
                    count: Math.min(hoursRangeFromNow * 12, 500),
                });
                if (dbDaten && Array.isArray(dbDaten) && dbDaten.length > 0) {
                    const date = new Date();
                    date.setSeconds(0, 0);
                    const ts = Math.round(date.getTime() / 1000);
                    const tsStart = ts - hoursRangeFromNow * 3600;

                    // Schritt 1: Koordinaten direkt aus DB-Daten berechnen (x10, das Panel teilt wieder durch 10)
                    const points: { pos: number; value: number }[] = [];
                    for (const entry of dbDaten) {
                        if (entry.val == null) {
                            continue;
                        }
                        const pos = Math.round((entry.ts / 1000 - tsStart) / 60);
                        if (pos >= 0 && pos <= maxX) {
                            points.push({ pos, value: Math.round(Number(entry.val) * 10) });
                        }
                    }
                    // the panel prints a tick with at most two characters: scale large values down (see chart-scale.ts)
                    const scale = buildLineScale(points.map(p => p.value));
                    factor = scale.factor;
                    const coordinates = points.map((p, i) => `${p.pos}:${scale.values[i]}`).join('~');

                    // Schritt 2: Ticks und Labels passend zur Zeitspanne erstellen
                    const ticksAndLabelsList: (string | number)[] = [];
                    for (let x = tsStart, i = 0; x < ts; x += xAxisTicksInterval * 60, i += xAxisTicksInterval) {
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
                    const lastTickTs = ts - 50 * 60;
                    const lastTickDate = new Date(lastTickTs * 1000);
                    ticksAndLabelsList.push(
                        `${String(maxX - 50)}^${lastTickDate.getHours().toString().padStart(2, '0')}:${lastTickDate.getMinutes().toString().padStart(2, '0')}`,
                    );
                    const ticksAndLabels = ticksAndLabelsList.join('+');

                    valuesChart = `${ticksAndLabels}~${coordinates}`;

                    this.log.debug(`Ticks & Label: ${ticksAndLabels}`);
                    this.log.debug(`Coordinates: ${coordinates}`);

                    // Schritt 3: Y-Ticks aus den (skalierten) Werten
                    if (scale.ticks.length > 0) {
                        this.log.debug(
                            `Scale: factor ${factor}, ticks ${scale.ticks[0]} … ${scale.ticks[scale.ticks.length - 1]} (${scale.ticks.length})`,
                        );
                        ticksChart = scale.ticks.map(String);
                    }
                } else {
                    this.log.warn(`No data found for state ${stateValue} in the last ${hoursRangeFromNow} hours`);
                }
            } catch (error) {
                this.log.error(`Error fetching data from DB: ${error as string}`);
            }
        }

        return { ticksChart, valuesChart, factor };
    }
}
