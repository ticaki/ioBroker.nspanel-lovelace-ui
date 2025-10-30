"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var pageChartLine_exports = {};
__export(pageChartLine_exports, {
  PageChartLine: () => PageChartLine
});
module.exports = __toCommonJS(pageChartLine_exports);
var import_pageChart = require("./pageChart");
class PageChartLine extends import_pageChart.PageChart {
  constructor(config, options) {
    super(config, options);
  }
  async init() {
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.basePanel.statesControler.createDataItems(
      tempConfig,
      this
    );
    if (tempItem) {
      tempItem.card = this.card;
      this.log.debug(`init Card: ${this.card}`);
    }
    this.items = tempItem;
    if (this.items && this.items.data && this.items.data.dbData) {
      const dbDetails = await this.items.data.dbData.getObject();
      if ((0, import_pageChart.isChartDetailsExternal)(dbDetails)) {
        this.dbDetails = dbDetails;
        this.getChartData = this.getChartDataDB;
      }
    }
    await super.init();
  }
  // Überschreiben der getChartDataDB-Methode
  async getChartDataDB(ticksChart = ["~"], valuesChart = "~") {
    if (this.items) {
      const items = this.items;
      const hoursRangeFromNow = items.data.rangeHours && await items.data.rangeHours.getNumber() || 24;
      const stateValue = items.data.setStateForDB && await items.data.setStateForDB.getString() || "";
      const instance = items.data.dbInstance && await items.data.dbInstance.getString() || "";
      const maxXAxisLabels = items.data.maxXAxisLabels && await items.data.maxXAxisLabels.getNumber() || 4;
      const maxXAxisTicks = items.data.maxXAxisTicks && await items.data.maxXAxisTicks.getNumber() || 60;
      const xAxisTicksInterval = maxXAxisTicks > 0 ? maxXAxisTicks * 60 : 60;
      const xAxisLabelInterval = maxXAxisLabels > 0 ? maxXAxisLabels * 60 : 120;
      const maxX = 1440;
      const tempScale = [];
      try {
        const dbDaten = await this.getDataFromDB(stateValue, hoursRangeFromNow, instance);
        if (dbDaten && Array.isArray(dbDaten) && dbDaten.length > 0) {
          this.log.debug(`Data from DB: ${JSON.stringify(dbDaten)}`);
          let ticksAndLabels = "";
          let coordinates = "";
          const ticksAndLabelsList = [];
          const date = /* @__PURE__ */ new Date();
          date.setMinutes(0, 0, 0);
          const ts = Math.round(date.getTime() / 1e3);
          const tsYesterday = ts - hoursRangeFromNow * 3600;
          for (let x = tsYesterday, i = 0; x < ts; x += xAxisTicksInterval * 60, i += xAxisTicksInterval) {
            if (i % xAxisLabelInterval) {
              ticksAndLabelsList.push(i);
            } else {
              const currentDate = new Date(x * 1e3);
              const hours = `0${currentDate.getHours()}`;
              const minutes = `0${currentDate.getMinutes()}`;
              const formattedTime = `${hours.slice(-2)}:${minutes.slice(-2)}`;
              ticksAndLabelsList.push(`${String(i)}^${formattedTime}`);
            }
          }
          ticksAndLabels = ticksAndLabelsList.join("+");
          const list = [];
          const offSetTime = Math.round(dbDaten[0].ts / 1e3);
          const lastTs = Math.round(dbDaten[dbDaten.length - 1].ts / 1e3);
          const counter = dbDaten.length > 1 ? Math.max((lastTs - offSetTime) / maxX, 1) : 1;
          for (let i = 0; i < dbDaten.length; i++) {
            const time = Math.round((dbDaten[i].ts / 1e3 - offSetTime) / counter);
            const value = Math.round(dbDaten[i].val * 10);
            if (value != null && value != 0) {
              list.push(`${time}:${value}`);
              tempScale.push(value);
            }
          }
          coordinates = list.join("~");
          valuesChart = `${ticksAndLabels}~${coordinates}`;
          this.log.debug(`Ticks & Label: ${ticksAndLabels}`);
          this.log.debug(`Coordinates: ${coordinates}`);
          if (tempScale.length > 0) {
            const rawMax = Math.max(...tempScale);
            const rawMin = Math.min(...tempScale);
            const roundedMin = Math.floor(rawMin / 10) * 10;
            const roundedMax = Math.ceil(rawMax / 10) * 10;
            const span = Math.max(roundedMax - roundedMin, 10);
            const intervall = Math.max(Number((span / 5).toFixed()), 10);
            this.log.debug(
              `Scale Min: ${roundedMin} (raw ${rawMin}), Max: ${roundedMax} (raw ${rawMax}) Intervall: ${intervall}`
            );
            const tempTickChart = [];
            let currentTick = roundedMin - intervall * 2;
            while (currentTick < roundedMax + intervall) {
              tempTickChart.push(String(currentTick));
              currentTick += intervall;
            }
            ticksChart = tempTickChart;
          }
        } else {
          this.log.warn(`No data found for state ${stateValue} in the last ${hoursRangeFromNow} hours`);
        }
      } catch (error) {
        this.log.error(`Error fetching data from DB: ${error}`);
      }
    }
    return { ticksChart, valuesChart };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageChartLine
});
//# sourceMappingURL=pageChartLine.js.map
