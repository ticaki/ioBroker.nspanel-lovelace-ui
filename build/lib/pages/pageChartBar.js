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
var pageChartBar_exports = {};
__export(pageChartBar_exports, {
  PageChartBar: () => PageChartBar
});
module.exports = __toCommonJS(pageChartBar_exports);
var import_pageChart = require("./pageChart");
class PageChartBar extends import_pageChart.PageChart {
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
  // Eventuelles überschreiben der getChartData-Methode
  async getChartDataDB(ticksChart = ["~"], valuesChart = "~") {
    if (this.items) {
      const items = this.items;
      const rangeHours = items.data.rangeHours && await items.data.rangeHours.getNumber() || 24;
      const stateValue = items.data.setStateForDB && await items.data.setStateForDB.getString() || "";
      const instance = items.data.dbInstance && await items.data.dbInstance.getString() || "";
      const maxXAxisLabels = items.data.maxXAxisLabels && await items.data.maxXAxisLabels.getNumber() || 4;
      const factor = items.data.factorCardChart && await items.data.factorCardChart.getNumber() || 1;
      const tempScale = [];
      try {
        const dbDaten = await this.getDataFromDB(stateValue, rangeHours, instance);
        if (dbDaten && Array.isArray(dbDaten) && dbDaten.length > 0) {
          this.log.debug(`Data from DB: ${JSON.stringify(dbDaten)}`);
          const stepXAchsis = rangeHours / maxXAxisLabels;
          valuesChart = "";
          for (let i = 0; i < rangeHours; i++) {
            const deltaHour = rangeHours - i;
            const targetDate = new Date(Date.now() - deltaHour * 3600 * 1e3);
            for (let j = 0, targetValue = 0; j < dbDaten.length; j++) {
              const valueDate = new Date(dbDaten[j].ts);
              const value = Math.round(dbDaten[j].val / factor * 10);
              tempScale.push(value);
              if (valueDate > targetDate) {
                if (targetDate.getHours() % stepXAchsis == 0) {
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
          valuesChart = valuesChart.substring(0, valuesChart.length - 1);
          const max = Math.max(...tempScale);
          const min = 0;
          const intervall = Math.max(Number(((max - min) / 5).toFixed()), 10);
          this.log.debug(`Scale Min: ${min}, Max: ${max} Intervall: ${intervall}`);
          const tempTickChart = [];
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
        this.log.error(`Error fetching data from DB: ${error}`);
      }
    }
    return { ticksChart, valuesChart };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageChartBar
});
//# sourceMappingURL=pageChartBar.js.map
