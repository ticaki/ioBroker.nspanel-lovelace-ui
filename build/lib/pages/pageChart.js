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
  //index: number = 0;
  checkState = true;
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
  /**
   *
   * @returns // TODO: remove this
   */
  async update() {
    var _a, _b;
    if (!this.visibility) {
      return;
    }
    const message = {};
    message.navigation = this.getNavigation();
    message.headline = `Error`;
    message.ticks = ["~"];
    message.value = "~";
    if (this.checkState) {
      if (this.items) {
        const items = this.items;
        const { valuesChart, ticksChart } = await this.getChartData();
        message.headline = (_a = items.data.headline && await items.data.headline.getTranslatedString()) != null ? _a : this.name;
        message.color = await (0, import_tools.getIconEntryColor)(items.data.color, true, import_Color.Color.White);
        message.text = (_b = items.data.text && await items.data.text.getString()) != null ? _b : "";
        message.value = valuesChart;
        message.ticks = ticksChart;
      }
      if (message.value) {
        this.log.debug(`Value: ${message.value}`);
      }
      if (message.ticks) {
        this.log.debug(`Ticks: ${message.ticks.join(",")}`);
      }
    }
    this.sendType(true);
    this.sendToPanel(this.getMessage(message), false);
  }
  static async getChartPageConfig(configManager, index, gridItem, messages, page) {
    const adapter = configManager.adapter;
    const config = adapter.config.pageChartdata[index];
    let stateExistValue = "";
    let stateExistTicks = "";
    if (config) {
      const card = config.selChartType;
      adapter.log.debug(`get pageconfig Card: ${card}`);
      if (config.selInstanceDataSource === 1) {
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
      gridItem = {
        ...gridItem,
        uniqueID: config.pageName,
        alwaysOn: page.alwaysOnDisplay || config.alwaysOnDisplay ? "always" : "none",
        hidden: page.hiddenByTrigger || config.hiddenByTrigger,
        config: {
          card,
          //index: index,
          data: {
            headline: await configManager.getFieldAsDataItemConfig(page.heading || config.headline || ""),
            text: { type: "const", constVal: config.txtlabelYAchse || "" },
            color: { true: { color: { type: "const", constVal: config.chart_color } } },
            ticks: { type: "triggered", dp: stateExistTicks },
            value: { type: "triggered", dp: stateExistValue }
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
    return { ticksChart, valuesChart };
  }
  async getChartDataDB(ticksChart = ["~"], valuesChart = "~") {
    this.log.warn("getChartDataScript not implemented in base PageChart class");
    return { ticksChart, valuesChart };
  }
  async getDataFromDB(_id, _rangeHours, _instance) {
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
              count: _rangeHours,
              limit: _rangeHours,
              ignoreNull: true,
              aggregate: "average",
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
    var _a, _b, _c, _d, _e;
    if (val) {
      this.checkState = false;
      if (!this.items) {
        this.log.warn("AdminConfig is not set, cannot check states");
        this.checkState = false;
      } else {
        try {
          const cfg = this.items.data;
          const ds = cfg.instanceDataSource && await ((_a = cfg.instanceDataSource) == null ? void 0 : _a.getNumber());
          const sfv = cfg.setStateForValues && await ((_b = cfg.setStateForValues) == null ? void 0 : _b.getString());
          const sft = cfg.setStateForTicks && await ((_c = cfg.setStateForTicks) == null ? void 0 : _c.getString());
          const sfd = cfg.setStateForDB && await ((_d = cfg.setStateForDB) == null ? void 0 : _d.getString());
          const si = cfg.dbInstance && await ((_e = cfg.dbInstance) == null ? void 0 : _e.getString());
          this.log.debug(
            `onVisibilityChange checking states with dataSource: ${ds}, setStateForValues: ${sfv}, setStateForTicks: ${sft}, setStateForDB: ${sfd}, selInstance: ${si}`
          );
          if (ds === 0) {
            if (sfv != null && sfv !== "") {
              const state = await this.adapter.getForeignStateAsync(sfv);
              if (state && state.val !== null && state.val !== void 0) {
                this.log.debug(`State ${sfv} for Values exists and has value: ${state.val}`);
                this.checkState = true;
              } else if (state) {
                this.log.warn(`State ${sfv} for Values exists but has no value`);
              } else {
                this.log.error(`State ${sfv} for Values does not exist`);
              }
            } else {
              this.log.error("No setStateForValues configured");
            }
            if (sft != null && sft !== "") {
              const state = await this.adapter.getForeignStateAsync(sft);
              if (state && state.val !== null && state.val !== void 0) {
                this.log.debug(`State ${sft} for Ticks exists and has value: ${state.val}`);
                this.checkState = true;
              } else if (state) {
                this.log.warn(`State ${sft} for Ticks exists but has no value`);
                this.checkState = false;
              } else {
                this.log.error(`State ${sft} for Ticks does not exist`);
                this.checkState = false;
              }
            } else {
              this.log.error("No setStateForTicks configured");
              this.checkState = false;
            }
          } else if (ds === 1) {
            if (si != null && si !== "") {
              const alive = await this.adapter.getForeignStateAsync(`system.adapter.${si}.alive`);
              if (alive && alive.val) {
                this.log.debug(`Instance ${si} is alive`);
                this.checkState = true;
              } else {
                this.log.warn(`Instance ${si} is not alive`);
                this.checkState = false;
              }
            } else {
              this.log.error("No selInstance configured");
              this.checkState = false;
            }
            if (sfd != null && sfd !== "") {
              const state = await this.adapter.getForeignStateAsync(sfd);
              if (state) {
                this.log.debug(`State ${sfd} for DB exists`);
                this.checkState = true;
              } else {
                this.log.warn(`State ${sfd} for DB does not exist`);
                this.checkState = false;
              }
            } else {
              this.log.error("No setStateForDB configured");
              this.checkState = false;
            }
          } else {
            this.log.error("Unknown instanceDataSource, skipping specific checks");
            this.checkState = false;
          }
        } catch (error) {
          this.log.error(`Error onVisibilityChange: ${error}`);
        }
      }
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
  return obj && typeof obj === "object" && "instance" in obj && typeof obj.instance === "string" && obj.instance && "state" in obj && typeof obj.state === "string" && obj.state;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageChart,
  isChartDetailsExternal
});
//# sourceMappingURL=pageChart.js.map
