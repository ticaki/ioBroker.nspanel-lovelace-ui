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
var import_chart_scale = require("./chart-scale");
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
  // Eventuelles überschreiben der getChartData-Methode
  async getChartDataDB(ticksChart = ["~"], valuesChart = "~") {
    let factor = 1;
    if (this.dbDetails) {
      const items = this.dbDetails;
      const hoursRangeFromNow = items.hours || 24;
      const stateValue = items.state || "";
      const instance = items.instance || "";
      const maxXAxisLabels = items.maxLabels || 4;
      const maxXAxisTicks = items.maxTicks || 2;
      const xAxisTicksInterval = maxXAxisTicks > 0 ? maxXAxisTicks * 60 : 60;
      const xAxisLabelInterval = maxXAxisLabels > 0 ? maxXAxisLabels * 60 : 120;
      const maxX = hoursRangeFromNow * 60;
      try {
        const dbDaten = await this.getDataFromDB(stateValue, hoursRangeFromNow, instance, {
          aggregate: "average",
          count: Math.min(hoursRangeFromNow * 12, 500)
        });
        if (dbDaten && Array.isArray(dbDaten) && dbDaten.length > 0) {
          const date = /* @__PURE__ */ new Date();
          date.setSeconds(0, 0);
          const ts = Math.round(date.getTime() / 1e3);
          const tsStart = ts - hoursRangeFromNow * 3600;
          const points = [];
          for (const entry of dbDaten) {
            if (entry.val == null) {
              continue;
            }
            const pos = Math.round((entry.ts / 1e3 - tsStart) / 60);
            if (pos >= 0 && pos <= maxX) {
              points.push({ pos, value: Math.round(Number(entry.val) * 10) });
            }
          }
          const scale = (0, import_chart_scale.buildLineScale)(points.map((p) => p.value));
          factor = scale.factor;
          const coordinates = points.map((p, i) => `${p.pos}:${scale.values[i]}`).join("~");
          const ticksAndLabelsList = [];
          for (let x = tsStart, i = 0; x < ts; x += xAxisTicksInterval * 60, i += xAxisTicksInterval) {
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
          const lastTickTs = ts - 50 * 60;
          const lastTickDate = new Date(lastTickTs * 1e3);
          ticksAndLabelsList.push(
            `${String(maxX - 50)}^${lastTickDate.getHours().toString().padStart(2, "0")}:${lastTickDate.getMinutes().toString().padStart(2, "0")}`
          );
          const ticksAndLabels = ticksAndLabelsList.join("+");
          valuesChart = `${ticksAndLabels}~${coordinates}`;
          this.log.debug(`Ticks & Label: ${ticksAndLabels}`);
          this.log.debug(`Coordinates: ${coordinates}`);
          if (scale.ticks.length > 0) {
            this.log.debug(
              `Scale: factor ${factor}, ticks ${scale.ticks[0]} \u2026 ${scale.ticks[scale.ticks.length - 1]} (${scale.ticks.length})`
            );
            ticksChart = scale.ticks.map(String);
          }
        } else {
          this.log.warn(`No data found for state ${stateValue} in the last ${hoursRangeFromNow} hours`);
        }
      } catch (error) {
        this.log.error(`Error fetching data from DB: ${error}`);
      }
    }
    return { ticksChart, valuesChart, factor };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageChartLine
});
//# sourceMappingURL=pageChartLine.js.map
