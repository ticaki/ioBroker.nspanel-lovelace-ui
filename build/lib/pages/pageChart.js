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
var pageChart_exports = {};
__export(pageChart_exports, {
  PageChart: () => PageChart,
  isChartDetailsExternal: () => isChartDetailsExternal
});
module.exports = __toCommonJS(pageChart_exports);
var import_Page = require("../classes/Page");
var import_Color = require("../const/Color");
var import_tools = require("../const/tools");
var import_adminShareConfig = require("../types/adminShareConfig");
const PageChartMessageDefault = {
  event: "entityUpd",
  headline: "Page Chart",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  color: "",
  //Balkenfarbe
  text: "",
  //Bezeichnung y Achse
  ticks: [],
  //Werte y Achse
  value: ""
  //Werte x Achse
};
class PageChart extends import_Page.Page {
  items;
  dbDetails;
  chartTimeout;
  oldDatabaseData = null;
  constructor(config, options) {
    if (config.card !== "cardChart" && config.card !== "cardLChart") {
      return;
    }
    super(config, options);
    if (options.config && (options.config.card == "cardChart" || options.config.card == "cardLChart")) {
      this.config = options.config;
    } else {
      throw new Error("Missing config!");
    }
    this.minUpdateInterval = 6e4;
  }
  async init() {
    if (this.items && this.items.data && this.items.data.dbData) {
      const dbDetails = await this.items.data.dbData.getObject();
      if (isChartDetailsExternal(dbDetails)) {
        this.dbDetails = dbDetails;
      }
    }
    await super.init();
  }
  async update() {
    var _a, _b;
    if (!this.visibility) {
      return;
    }
    await super.update();
    const message = {};
    message.navigation = this.getNavigation();
    message.headline = `Error`;
    message.ticks = ["~"];
    message.value = "~";
    if (this.items) {
      const items = this.items;
      const { valuesChart, ticksChart, factor } = await this.getChartData();
      message.headline = (_a = items.data.headline && await items.data.headline.getTranslatedString()) != null ? _a : this.name;
      message.color = await (0, import_tools.getIconEntryColor)(items.data.color, true, import_Color.Color.White);
      const text = (_b = items.data.text && await items.data.text.getString()) != null ? _b : "";
      message.text = factor && factor > 1 ? `${text} x${factor}`.trim() : text;
      message.value = valuesChart;
      message.ticks = ticksChart;
    }
    if (message.value) {
      this.log.debug(`Value: ${message.value}`);
    }
    if (message.ticks) {
      this.log.debug(`Ticks: ${message.ticks.join(",")}`);
    }
    this.sendType(true);
    this.sendToPanel(this.getMessage(message), false);
  }
  /**
   * Classic path: a script page `type: 'cardChart' | 'cardLChart'` matched by `pageName` against the
   * admin table `pageChartdata`. Produces the same page config as the PageConfig tab (see admin.ts),
   * including the `dbData` item for the DB source, so both configuration ways share one code path.
   *
   * @param configManager the running ConfigManager (adapter access, state checks)
   * @param index index of the matching entry in `adapter.config.pageChartdata`
   * @param gridItem page base to extend
   * @param messages collected configuration messages
   * @param page the script page definition
   */
  static async getChartPageConfig(configManager, index, gridItem, messages, page) {
    const adapter = configManager.adapter;
    const config = adapter.config.pageChartdata[index];
    let stateExistValue = "";
    let stateExistTicks = "";
    if (config) {
      const card = config.selChartType;
      adapter.log.debug(`get pageconfig Card: ${card}`);
      const useDb = config.selInstanceDataSource === 1;
      if (useDb) {
        if (await configManager.existsState(config.setStateForDB)) {
          stateExistValue = config.setStateForDB;
        }
      } else {
        if (await configManager.existsState(config.setStateForValues)) {
          stateExistValue = config.setStateForValues;
        }
      }
      if (await configManager.existsState(config.setStateForTicks)) {
        stateExistTicks = config.setStateForTicks;
      }
      const dbData = useDb ? {
        instance: config.selInstance || "",
        state: stateExistValue,
        hours: config.rangeHours || import_adminShareConfig.chartDefaults.rangeHours,
        maxTicks: config.maxXAxisTicks || import_adminShareConfig.chartDefaults.maxXAxisTicks,
        factor: config.factorCardChart || import_adminShareConfig.chartDefaults.factorCardChart,
        maxLabels: config.maxXAxisLabels || import_adminShareConfig.chartDefaults.maxXAxisLabels
      } : void 0;
      gridItem = {
        ...gridItem,
        uniqueID: config.pageName,
        alwaysOn: page.alwaysOnDisplay || config.alwaysOnDisplay ? "always" : "none",
        hidden: page.hiddenByTrigger || config.hiddenByTrigger,
        config: {
          card,
          data: {
            headline: await configManager.getFieldAsDataItemConfig(page.heading || config.headline || ""),
            text: { type: "const", constVal: config.txtlabelYAchse || "" },
            color: { true: { color: { type: "const", constVal: config.chart_color } } },
            ticks: { type: "triggered", dp: stateExistTicks },
            value: { type: "triggered", dp: stateExistValue },
            dbData: dbData ? { type: "const", constVal: JSON.stringify(dbData) } : void 0
          }
        },
        pageItems: []
      };
      return { gridItem, messages };
    }
    throw new Error("No config for cardChart found");
  }
  // Überschreiben der getChartData-Methode
  async getChartData(ticksChart = ["~"], valuesChart = "~") {
    var _a, _b;
    if (this.items) {
      const items = this.items;
      const tempTicks = (_a = items.data.ticks && await items.data.ticks.getObject()) != null ? _a : [];
      const tempValues = (_b = items.data.value && await items.data.value.getString()) != null ? _b : "";
      if (tempTicks && Array.isArray(tempTicks) && tempTicks.length > 0) {
        ticksChart = tempTicks;
      }
      if (tempValues && typeof tempValues === "string" && tempValues.length > 0) {
        valuesChart = tempValues;
      }
    }
    this.log.debug(`Data from States (oldScriptVersion)`);
    return { ticksChart, valuesChart };
  }
  async getChartDataDB(ticksChart = ["~"], valuesChart = "~") {
    this.log.warn("getChartDataDB not implemented in base PageChart class");
    return { ticksChart, valuesChart };
  }
  /**
   * Reads history values via `getHistory` of a history/sql/influxdb instance.
   *
   * @param _id state id to read
   * @param _rangeHours time window in hours, ending now
   * @param _instance db instance, `influxdb.0` or `system.adapter.influxdb.0`
   * @param query what the chart type needs from the history
   * @param query.aggregate 'average' (one value per interval) or 'none' (raw values)
   * @param query.count number of intervals (bar: hours, line: fine grid); also used as `limit`
   */
  async getDataFromDB(_id, _rangeHours, _instance, query) {
    if (!_instance) {
      return null;
    }
    const instanceId = _instance.startsWith("system.adapter.") ? _instance : `system.adapter.${_instance}`;
    const alive = await this.adapter.getForeignStateAsync(`${instanceId}.alive`);
    if (!alive || !alive.val) {
      this.log.warn(`PageChart: ${this.name} - DB instance ${_instance} is not alive`);
      return null;
    }
    if (this.unload || this.adapter.unload) {
      return null;
    }
    return new Promise((resolve, reject) => {
      if (this.chartTimeout) {
        resolve(this.oldDatabaseData || null);
        return;
      }
      this.chartTimeout = this.adapter.setTimeout(() => {
        this.chartTimeout = null;
        if (this.unload || this.adapter.unload) {
          resolve(null);
          return;
        }
        reject(
          new Error(`PageChart: ${this.name} - DB: ${_instance} - Timeout getting history for state ${_id}`)
        );
      }, 15e3);
      try {
        this.adapter.sendTo(
          _instance,
          "getHistory",
          {
            id: _id,
            options: {
              start: Date.now() - _rangeHours * 60 * 60 * 1e3,
              end: Date.now(),
              /** number of intervals for 'average' (one value per interval, spread over start..end) */
              count: query.count,
              /** do not return more entries than limit */
              limit: query.count,
              /** if null values should be included (false), replaced by last not null value (true) or replaced with 0 (0) */
              ignoreNull: true,
              aggregate: query.aggregate,
              /** round result to number of digits after decimal point */
              round: 1
            }
          },
          (result) => {
            if (this.chartTimeout) {
              this.adapter.clearTimeout(this.chartTimeout);
            }
            this.chartTimeout = null;
            if (this.unload || this.adapter.unload) {
              resolve(null);
              return;
            }
            if (result && "result" in result) {
              if (Array.isArray(result.result)) {
                this.log.debug(`Data points retrieved from DB: ${result.result.length}`);
                this.log.debug(`Data points: ${JSON.stringify(result.result)}`);
                for (let i = 0; i < result.result.length; i++) {
                  this.log.debug(
                    `Value: ${result.result[i].val}, ISO-Timestring: ${new Date(result.result[i].ts).toISOString()}`
                  );
                }
                this.oldDatabaseData = result.result;
                resolve(result.result);
                return;
              }
            }
            reject(new Error("No data found"));
            return;
          }
        );
      } catch (error) {
        reject(new Error(`Error in getDataFromDB: ${error}`));
      }
    });
  }
  getMessage(_message) {
    let result = PageChartMessageDefault;
    result = { ...result, ..._message };
    return (0, import_tools.getPayload)(
      "entityUpd",
      result.headline,
      result.navigation,
      result.color,
      result.text,
      result.ticks.join(":"),
      result.value
    );
  }
  async onVisibilityChange(val) {
    if (val) {
      await this.update();
    }
  }
  async onStateTrigger(_id) {
    if (this.unload || this.adapter.unload) {
      return;
    }
    this.adapter.setTimeout(() => this.update(), 50);
  }
  async onButtonEvent(_event) {
  }
  async delete() {
    if (this.chartTimeout) {
      this.adapter.clearTimeout(this.chartTimeout);
    }
    this.chartTimeout = null;
    await super.delete();
  }
}
function isChartDetailsExternal(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  const o = obj;
  return typeof o.instance === "string" && o.instance !== "" && typeof o.state === "string" && o.state !== "";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageChart,
  isChartDetailsExternal
});
//# sourceMappingURL=pageChart.js.map
