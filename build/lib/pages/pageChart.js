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
  PageChart: () => PageChart
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
  index = 0;
  checkState = true;
  adminConfig;
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
    this.index = this.config.index;
    this.minUpdateInterval = 6e4;
    this.adminConfig = this.adapter.config.pageChartdata[this.index];
  }
  async init() {
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
    if (this.checkState) {
      if (this.items && this.adminConfig != null) {
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
          index,
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
  async getChartData() {
    const ticksChart = [];
    const valuesChart = "";
    return { ticksChart, valuesChart };
  }
  async getDataFromDB(_id, _rangeHours, _instance) {
    return new Promise((resolve, reject) => {
      try {
        const timeout = this.adapter.setTimeout(() => {
          reject(new Error(`error  in system`));
        }, 5e3);
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
            if (timeout) {
              this.adapter.clearTimeout(timeout);
            }
            if (result && "result" in result) {
              if (Array.isArray(result.result)) {
                for (let i = 0; i < result.result.length; i++) {
                  this.log.debug(
                    `Value: ${result.result[i].val}, ISO-Timestring: ${new Date(result.result[i].ts).toISOString()}`
                  );
                }
                resolve(result.result);
              }
            }
            reject(new Error("No data found"));
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
      this.checkState = false;
      if (!this.adminConfig) {
        this.log.warn("AdminConfig is not set, cannot check states");
        this.checkState = false;
      } else {
        try {
          const cfg = this.adminConfig;
          const ds = cfg.selInstanceDataSource;
          if (ds === 0) {
            if (cfg.setStateForValues != null && cfg.setStateForValues !== "") {
              const state = await this.adapter.getForeignStateAsync(cfg.setStateForValues);
              if (state && state.val !== null && state.val !== void 0) {
                this.log.debug(
                  `State ${cfg.setStateForValues} for Values exists and has value: ${state.val}`
                );
                this.checkState = true;
              } else if (state) {
                this.log.warn(`State ${cfg.setStateForValues} for Values exists but has no value`);
              } else {
                this.log.error(`State ${cfg.setStateForValues} for Values does not exist`);
              }
            } else {
              this.log.error("No setStateForValues configured");
            }
            if (cfg.setStateForTicks != null && cfg.setStateForTicks !== "") {
              const state = await this.adapter.getForeignStateAsync(cfg.setStateForTicks);
              if (state && state.val !== null && state.val !== void 0) {
                this.log.debug(
                  `State ${cfg.setStateForTicks} for Ticks exists and has value: ${state.val}`
                );
                this.checkState = true;
              } else if (state) {
                this.log.warn(`State ${cfg.setStateForTicks} for Ticks exists but has no value`);
                this.checkState = false;
              } else {
                this.log.error(`State ${cfg.setStateForTicks} for Ticks does not exist`);
                this.checkState = false;
              }
            } else {
              this.log.error("No setStateForTicks configured");
              this.checkState = false;
            }
          } else if (ds === 1) {
            if (cfg.selInstance != null && cfg.selInstance !== "") {
              const alive = await this.adapter.getForeignStateAsync(
                `system.adapter.${cfg.selInstance}.alive`
              );
              if (alive && alive.val) {
                this.log.debug(`Instance ${cfg.selInstance} is alive`);
                this.checkState = true;
              } else {
                this.log.warn(`Instance ${cfg.selInstance} is not alive`);
                this.checkState = false;
              }
            } else {
              this.log.error("No selInstance configured");
              this.checkState = false;
            }
            if (cfg.setStateForDB != null && cfg.setStateForDB !== "") {
              const state = await this.adapter.getForeignStateAsync(cfg.setStateForDB);
              if (state) {
                this.log.debug(`State ${cfg.setStateForDB} for DB exists`);
                this.checkState = true;
              } else {
                this.log.warn(`State ${cfg.setStateForDB} for DB does not exist`);
                this.checkState = false;
              }
            } else {
              this.log.error("No setStateForDB configured");
              this.checkState = false;
            }
          } else {
            this.log.error("Unknown selInstanceDataSource, skipping specific checks");
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
  }
  async onButtonEvent(_event) {
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageChart
});
//# sourceMappingURL=pageChart.js.map
