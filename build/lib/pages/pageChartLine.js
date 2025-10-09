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
    this.adminConfig = this.adapter.config.pageChartdata[this.index];
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
    await super.init();
  }
  // Überschreiben der getChartData-Methode
  async getChartData() {
    var _a, _b;
    let ticksChart = [];
    let valuesChart = "";
    if (this.items && this.adminConfig != null) {
      const items = this.items;
      switch (this.adminConfig.selInstanceDataSource) {
        case 0: {
          const tempTicks = (_a = items.data.ticks && await items.data.ticks.getObject()) != null ? _a : [];
          const tempValues = (_b = items.data.value && await items.data.value.getString()) != null ? _b : "";
          if (tempTicks && Array.isArray(tempTicks)) {
            ticksChart = tempTicks;
          }
          if (tempValues && typeof tempValues === "string") {
            valuesChart = tempValues;
          }
          break;
        }
        case 1: {
          const hoursRangeFromNow = this.adminConfig.rangeHours || 24;
          const stateValue = this.adminConfig.setStateForDB;
          const instance = this.adminConfig.selInstance;
          const xAxisTicksInterval = this.adminConfig.maxXAxisTicks > 0 ? this.adminConfig.maxXAxisTicks * 60 : 60;
          const xAxisLabelInterval = this.adminConfig.maxXAxisLabels > 0 ? this.adminConfig.maxXAxisLabels * 60 : 120;
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
                let currentTick = roundedMin - intervall * 2;
                while (currentTick < roundedMax + intervall) {
                  ticksChart.push(String(currentTick));
                  currentTick += intervall;
                }
              }
            } else {
              this.log.warn(
                `No data found for state ${stateValue} in the last ${hoursRangeFromNow} hours`
              );
            }
          } catch (error) {
            this.log.error(`Error fetching data from DB: ${error}`);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageChartLine
});
//# sourceMappingURL=pageChartLine.js.map
