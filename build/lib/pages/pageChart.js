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
  step = 1;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  adminConfig = this.adapter.config.pageChartdata[this.index];
  constructor(config, options) {
    if (config.card !== "cardChart") {
      return;
    }
    super(config, options);
    if (options.config && options.config.card == "cardChart") {
      this.config = options.config;
    } else {
      throw new Error("Missing config!");
    }
    this.index = this.config.index;
    this.minUpdateInterval = 2e3;
  }
  async init() {
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    if (tempItem) {
      tempItem.card = "cardChart";
    }
    this.items = tempItem;
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
    if (this.items && this.adminConfig != null) {
      const items = this.items;
      const chartData = await this.getChartData();
      message.headline = (_a = items.data.headline && await items.data.headline.getTranslatedString()) != null ? _a : this.name;
      message.navigation = this.getNavigation();
      message.color = await (0, import_tools.getIconEntryColor)(items.data.color, true, import_Color.Color.White);
      message.text = (_b = items.data.text && await items.data.text.getString()) != null ? _b : "";
      message.value = chartData.values;
      message.ticks = chartData.ticks;
    }
    if (message.value) {
      this.log.debug(message.value);
    }
    if (message.ticks) {
      this.log.debug(`Ticks: ${message.ticks.join(",")}`);
    }
    this.sendToPanel(this.getMessage(message), false);
  }
  static async getChartPageConfig(adapter, index, configManager) {
    const config = adapter.config.pageChartdata[index];
    let stateExistValue = "";
    let stateExistTicks = "";
    if (config) {
      if (await configManager.existsState(config.setStateForValues)) {
        stateExistValue = config.setStateForValues;
      }
      if (await configManager.existsState(config.setStateForTicks)) {
        stateExistTicks = config.setStateForTicks;
      }
      const result = {
        uniqueID: config.pageName,
        alwaysOn: config.alwaysOnDisplay ? "always" : "none",
        config: {
          card: "cardChart",
          index,
          data: {
            headline: { type: "const", constVal: config.headline || "" },
            text: { type: "const", constVal: config.txtlabelYAchse || "" },
            color: { true: { color: { type: "const", constVal: config.chart_color } } },
            ticks: { type: "triggered", dp: stateExistTicks },
            value: { type: "triggered", dp: stateExistValue }
          }
        },
        pageItems: []
      };
      return result;
    }
    throw new Error("No config for cardChart found");
  }
  async getChartData() {
    var _a, _b;
    let ticks = [];
    let values = "";
    if (this.items && this.adminConfig != null) {
      const items = this.items;
      switch (this.adminConfig.selInstanceDataSource) {
        case 0: {
          const tempTicks = (_a = items.data.ticks && await items.data.ticks.getObject()) != null ? _a : [];
          const tempValues = (_b = items.data.value && await items.data.value.getString()) != null ? _b : "";
          if (tempTicks && Array.isArray(tempTicks)) {
            ticks = tempTicks;
          } else if (typeof tempValues === "string") {
            const timeValueRegEx = /~\d+:(\d+)/g;
            const sorted = [...tempValues.matchAll(timeValueRegEx) || []].map((x) => parseFloat(x[1])).sort((x, y) => x < y ? -1 : 1);
            const minValue = sorted[0];
            const maxValue = sorted[sorted.length - 1];
            const tick = Math.max(Number(((maxValue - minValue) / 5).toFixed()), 10);
            let currentTick = minValue - tick;
            while (currentTick < maxValue + tick) {
              ticks.push(String(currentTick));
              currentTick += tick;
            }
          }
          if (tempValues && typeof tempValues === "string") {
            values = tempValues;
          }
          break;
        }
        case 1: {
          break;
        }
        default:
          break;
      }
    }
    return { ticks, values };
  }
  getDataFromDB = async (_id, _rangeHours, _instance) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1e3);
      return resolve(
        this.adapter.sendTo(
          _instance,
          "getHistory",
          {
            id: _id,
            options: {
              start: Date.now() - _rangeHours * 60 * 60 * 1e3,
              end: Date.now(),
              aggregate: "onchange"
            }
          },
          function(result) {
            if (result && result.message) {
              for (let i = 0; i < result.message.length; i++) {
                console.log(`${result.message[i].val} ${new Date(result.message[i].ts).toISOString()}`);
              }
            }
          }
        )
      );
    });
  };
  getMessage(_message) {
    let result = PageChartMessageDefault;
    result = Object.assign(result, _message);
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
    if (val && this.adminConfig.selInstanceDataSource === 1) {
      this.adapter.getForeignStateAsync(`system.adapter.${this.adminConfig.selInstance}.alive`).then((state) => {
        if (state && state.val) {
          this.log.debug(`Instance ${this.adminConfig.selInstance} is alive`);
        } else {
          this.log.debug(`Instance ${this.adminConfig.selInstance} is not alive`);
        }
      }).catch((e) => {
        this.log.debug(`Instance ${this.adminConfig.selInstance} not found: ${e}`);
      });
    } else if (this.adminConfig.selInstanceDataSource === 0) {
      this.adapter.getForeignStateAsync(this.adminConfig.setStateForValues).then((state) => {
        if (state && state.val) {
          this.log.debug(`State ${this.adminConfig.setStateForValues} for Values is exists`);
        } else {
          this.log.debug(`State ${this.adminConfig.setStateForValues} for Values is not exists`);
        }
      }).catch((e) => {
        this.log.debug(`State ${this.adminConfig.setStateForValues} not found: ${e}`);
      });
      this.adapter.getForeignStateAsync(this.adminConfig.setStateForTicks).then((state) => {
        if (state && state.val) {
          this.log.debug(`State ${this.adminConfig.setStateForTicks} for Ticks is exists`);
        } else {
          this.log.debug(`State ${this.adminConfig.setStateForTicks} for ticks is not exists`);
        }
      }).catch((e) => {
        this.log.debug(`State ${this.adminConfig.setStateForTicks} not found: ${e}`);
      });
    }
    await super.onVisibilityChange(val);
  }
  async onStateTrigger(_id) {
    if (this.unload) {
      return;
    }
    this.adapter.setTimeout(() => this.update(), 50);
  }
  async onButtonEvent(_event) {
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageChart
});
//# sourceMappingURL=pageChart.js.map
