import { isChartDetailsExternal, PageChart } from './pageChart';
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
    async getChartDataDB(
        ticksChart: string[] = ['~'],
        valuesChart = '~',
    ): Promise<{ ticksChart: string[]; valuesChart: string }> {
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
            const maxX = 1440; // 24h = 1440min

            const tempScale: number[] = [];

            try {
                const dbDaten = await this.getDataFromDB(stateValue, hoursRangeFromNow, instance);
                if (dbDaten && Array.isArray(dbDaten) && dbDaten.length > 0) {
                    let ticksAndLabels = '';
                    let coordinates = '';

                    const ticksAndLabelsList = [];
                    const date = new Date();
                    date.setSeconds(0, 0);
                    const ts = Math.round(date.getTime() / 1000);
                    const tsStart = ts - hoursRangeFromNow * 3600;

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
                    ticksAndLabelsList.push(
                        `${String(maxX - 10)}^${new Date(ts * 1000).getHours().toString().padStart(2, '0')}:${new Date(ts * 1000).getMinutes().toString().padStart(2, '0')}`,
                    );
                    ticksAndLabels = ticksAndLabelsList.join('+');

                    const list = [];
                    const startTs = Math.round(dbDaten[0].ts / 1000);
                    const endTs = Math.round(dbDaten[dbDaten.length - 1].ts / 1000);
                    const counter = dbDaten.length > 1 ? Math.max((endTs - startTs) / maxX, 1) : 1;
                    for (let i = 0; i < dbDaten.length; i++) {
                        const time = Math.round((dbDaten[i].ts / 1000 - startTs) / counter);
                        const value = Math.round(dbDaten[i].val);
                        if (value != null) {
                            list.push(`${time}:${value}`);
                            tempScale.push(value);
                        }
                    }

                    list.pop(); // remove last element to avoid overflow
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

                        // ensure at least a minimal span to avoid zero interval
                        const span = Math.max(roundedMax - roundedMin, 10);
                        const interval = Math.max(Number((span / 5).toFixed()), 10);

                        this.log.debug(
                            `Scale Min: ${roundedMin} (raw ${rawMin}), Max: ${roundedMax} (raw ${rawMax}) interval: ${interval}`,
                        );
                        const tempTickChart: string[] = [];
                        let currentTick = roundedMin - interval * 2;
                        while (currentTick < roundedMax + interval) {
                            tempTickChart.push(String(currentTick));
                            currentTick += interval;
                        }
                        ticksChart = tempTickChart;
                    }
                } else {
                    this.log.warn(`No data found for state ${stateValue} in the last ${hoursRangeFromNow} hours`);
                }
            } catch (error) {
                this.log.error(`Error fetching data from DB: ${error as string}`);
            }
        }

        return { ticksChart, valuesChart };
    }
}
