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
  adminConfig = this.adapter.config.pageChartdata[this.index];
  constructor(config, options) {
    super(config, options);
  }
  async init() {
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.panel.statesControler.createDataItems(
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
          const numberOfHoursAgo = this.adminConfig.rangeHours;
          const stateValue = this.adminConfig.setStateForValues;
          const instance = this.adminConfig.selInstance;
          const xAxisTicksEveryM = this.adminConfig.maxXAxisTicks * 60;
          const xAxisLabelEveryM = this.adminConfig.maxXAxisLabels * 60;
          const maxX = 1440;
          const tempScale = [];
          try {
            const dbDaten = await this.getDataFromDB(stateValue, numberOfHoursAgo, instance);
            if (dbDaten && Array.isArray(dbDaten)) {
              this.log.debug(`Data from DB: ${JSON.stringify(dbDaten)}`);
              let ticksAndLabels = "";
              let coordinates = "";
              const ticksAndLabelsList = [];
              const date = /* @__PURE__ */ new Date();
              date.setMinutes(0, 0, 0);
              const ts = Math.round(date.getTime() / 1e3);
              const tsYesterday = ts - numberOfHoursAgo * 3600;
              for (let x = tsYesterday, i = 0; x < ts; x += xAxisTicksEveryM * 60, i += xAxisTicksEveryM) {
                if (i % xAxisLabelEveryM) {
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
              const counter = Math.round((dbDaten[dbDaten.length - 1].ts / 1e3 - offSetTime) / maxX);
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
