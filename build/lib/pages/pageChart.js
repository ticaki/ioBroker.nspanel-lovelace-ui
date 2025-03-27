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
  step = 1;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  constructor(config, options) {
    super(config, options);
    if (options.config && options.config.card == "cardChart") {
      this.config = options.config;
    }
    this.minUpdateInterval = 1e3;
  }
  async init() {
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    this.items.card = "cardChart";
    await super.init();
  }
  /**
   *
   * @returns
   */
  async update() {
    var _a, _b, _c;
    if (!this.visibility) {
      return;
    }
    this.panel.lastCard = "";
    this.sendType();
    const message = {};
    const items = this.items;
    if (!items || items.card !== "cardChart") {
      return;
    }
    const data = items.data;
    message.headline = (_a = data.headline && await data.headline.getTranslatedString()) != null ? _a : this.name;
    message.navigation = this.getNavigation();
    message.color = await (0, import_tools.getIconEntryColor)(data.color, true, import_Color.Color.White);
    message.text = (_b = await (0, import_tools.getEntryTextOnOff)(data.text, true)) != null ? _b : "";
    message.value = (_c = data.value && await data.value.getString()) != null ? _c : "";
    message.ticks = [];
    const ticks = data.ticks && await data.ticks.getObject();
    if (ticks && Array.isArray(ticks)) {
      message.ticks = ticks;
    } else if (message.value) {
      const timeValueRegEx = /~\d+:(\d+)/g;
      const sorted = [...message.value.matchAll(timeValueRegEx) || []].map((x) => parseFloat(x[1])).sort((x, y) => x < y ? -1 : 1);
      const minValue = sorted[0];
      const maxValue = sorted[sorted.length - 1];
      const tick = Math.max(Number(((maxValue - minValue) / 5).toFixed()), 10);
      let currentTick = minValue - tick;
      while (currentTick < maxValue + tick) {
        message.ticks.push(String(currentTick));
        currentTick += tick;
      }
    }
    this.sendToPanel(this.getMessage(message));
  }
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
    return "";
  }
  async onStateTrigger(_id) {
    if (this.unload) {
      return;
    }
    this.adapter.setTimeout(() => this.update(), 50);
  }
  /**
   *a
   *
   * @param _event
   * @returns
   */
  async onButtonEvent(_event) {
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageChart
});
//# sourceMappingURL=pageChart.js.map
