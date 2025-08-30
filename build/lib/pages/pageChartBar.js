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
          const rangeHours = this.adminConfig.rangeHours;
          const stateValue = this.adminConfig.setStateForDB;
          const instance = this.adminConfig.selInstance;
          const maxXAxisLabels = this.adminConfig.maxXAxisLabels;
          const factor = this.adminConfig.factorCardChart;
          const tempScale = [];
          try {
            const dbDaten = await this.getDataFromDB(stateValue, rangeHours, instance);
            if (dbDaten && Array.isArray(dbDaten)) {
              this.log.debug(`Data from DB: ${JSON.stringify(dbDaten)}`);
              const stepXAchsis = rangeHours / maxXAxisLabels;
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
              let currentTick = min;
              while (currentTick < max + intervall) {
                ticksChart.push(String(currentTick));
                currentTick += intervall;
              }
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
  PageChartBar
});
//# sourceMappingURL=pageChartBar.js.map
