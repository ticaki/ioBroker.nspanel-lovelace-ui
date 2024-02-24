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
var pageNotification_exports = {};
__export(pageNotification_exports, {
  PageNotify: () => PageNotify
});
module.exports = __toCommonJS(pageNotification_exports);
var import_Page = require("../classes/Page");
var import_Color = require("../const/Color");
var import_tools = require("../const/tools");
class PageNotify extends import_Page.Page {
  config;
  items;
  lastpage;
  step = 1;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  tempItem;
  constructor(config, options) {
    super(config, options);
    this.config = options.config;
    if (options.items && (options.items.card == "popupNotify" || options.items.card == "popupNotify2"))
      this.items = options.items;
    this.minUpdateInterval = 1e3;
    this.neverDeactivateTrigger = true;
  }
  async init() {
    const config = structuredClone(this.config);
    const tempConfig = this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config) : config;
    (0, import_tools.setTriggeredToState)(tempConfig, ["entity1"]);
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    this.items.card = this.card;
    await super.init();
  }
  setLastPage(p) {
    if (p !== this)
      this.lastpage = p;
  }
  async update() {
    var _a, _b, _c, _d, _e, _f, _g;
    const message = {};
    const items = this.items;
    if (!items)
      return;
    let value = null;
    if (items.card === "popupNotify" || items.card === "popupNotify2") {
      const data = items.data;
      value = await (0, import_tools.getValueEntryNumber)(data.entity1);
      if (value === null)
        value = (_a = await (0, import_tools.getValueEntryBoolean)(data.entity1)) != null ? _a : true;
      message.headline = (_b = data.headline && await data.headline.getString()) != null ? _b : "";
      message.hColor = await (0, import_tools.getIconEntryColor)(data.colorHeadline, value, import_Color.White);
      message.blText = (_c = data.buttonLeft && await data.buttonLeft.getString()) != null ? _c : "";
      message.blColor = await (0, import_tools.getIconEntryColor)(data.colorButtonLeft, value, import_Color.White);
      message.brText = (_d = data.buttonRight && await data.buttonRight.getString()) != null ? _d : "";
      message.brColor = await (0, import_tools.getIconEntryColor)(data.colorButtonRight, value, import_Color.White);
      message.text = (_e = data.text && await data.text.getString()) != null ? _e : "";
      message.textColor = await (0, import_tools.getIconEntryColor)(data.colorText, value, import_Color.White);
      message.timeout = (_f = data.timeout && await data.timeout.getNumber()) != null ? _f : 0;
    }
    if (items.card === "popupNotify") {
      this.sendToPanel(this.getMessage(message));
      return;
    } else if (items.card === "popupNotify2") {
      const data = items.data;
      message.fontSet = (_g = data.textSize && await data.textSize.getString()) != null ? _g : "";
      message.icon = await (0, import_tools.getIconEntryValue)(data.icon, value, "");
      message.iconColor = await (0, import_tools.getIconEntryColor)(data.icon, value, import_Color.White);
      this.sendToPanel(this.getMessage2(message));
      return;
    }
  }
  getMessage(message) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    return (0, import_tools.getPayload)(
      "entityUpdateDetail",
      this.id,
      (_a = message.headline) != null ? _a : "",
      (_b = message.hColor) != null ? _b : "",
      (_c = message.blText) != null ? _c : "",
      (_d = message.blColor) != null ? _d : "",
      (_e = message.brText) != null ? _e : "",
      (_f = message.brColor) != null ? _f : "",
      (_g = message.text) != null ? _g : "",
      (_h = message.textColor) != null ? _h : "",
      String((_i = message.timeout) != null ? _i : 0)
    );
  }
  getMessage2(message) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    return (0, import_tools.getPayload)(
      "entityUpdateDetail",
      this.id,
      (_a = message.headline) != null ? _a : "",
      (_b = message.hColor) != null ? _b : "",
      (_c = message.blText) != null ? _c : "",
      (_d = message.blColor) != null ? _d : "",
      (_e = message.brText) != null ? _e : "",
      (_f = message.brColor) != null ? _f : "",
      (_g = message.text) != null ? _g : "",
      (_h = message.textColor) != null ? _h : "",
      String((_i = message.timeout) != null ? _i : 0),
      (_j = message.fontSet) != null ? _j : "0",
      (_k = message.icon) != null ? _k : "",
      (_l = message.iconColor) != null ? _l : ""
    );
  }
  async onStateTrigger() {
    this.panel.setActivePage(this);
  }
  async onButtonEvent(_event) {
    this.log.debug("we are here");
    if (_event.action === "notifyAction") {
      const data = this.items && this.items.card === "popupNotify" && this.items.data;
      if (data) {
        if (data.setValue2) {
          if (_event.opt === "yes")
            data.setValue1 && await data.setValue1.setStateTrue();
          else
            data.setValue2 && await data.setValue2.setStateTrue();
        } else
          data.setValue1 && await data.setValue1.setStateAsync(_event.opt === "yes");
      }
    }
    if (this.lastpage)
      this.panel.setActivePage(this.lastpage);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageNotify
});
//# sourceMappingURL=pageNotification.js.map
