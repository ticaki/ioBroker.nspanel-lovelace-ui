"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var pageNotification_exports = {};
__export(pageNotification_exports, {
  PageNotify: () => PageNotify
});
module.exports = __toCommonJS(pageNotification_exports);
var import_Page = require("../classes/Page");
var import_Color = require("../const/Color");
var import_tools = require("../const/tools");
var pages = __toESM(require("../types/pages"));
class PageNotify extends import_Page.Page {
  config;
  items;
  lastpage = [];
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
    const tempConfig = this.enums || this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    (0, import_tools.setTriggeredToState)(tempConfig, ["entity1", "optinalValue"]);
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    this.items.card = this.card;
    await super.init();
  }
  setLastPage(p) {
    if (p !== this) {
      if (p !== void 0)
        this.lastpage.push(p);
      else
        this.lastpage = [];
    }
  }
  removeLastPage(_p) {
    this.lastpage = this.lastpage.filter((a) => a !== _p);
    this.lastpage.forEach((a) => a.removeLastPage(_p));
  }
  async update() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const message = {};
    const items = this.items;
    if (!items)
      return;
    this.log.debug("update notification page!");
    let value = null;
    if (items.card === "popupNotify" || items.card === "popupNotify2") {
      const data = items.data;
      value = await (0, import_tools.getValueEntryNumber)(data.entity1);
      if (value === null)
        value = (_a = await (0, import_tools.getValueEntryBoolean)(data.entity1)) != null ? _a : true;
      message.headline = this.library.getTranslation((_b = data.headline && await data.headline.getString()) != null ? _b : "");
      message.hColor = await (0, import_tools.getIconEntryColor)(data.colorHeadline, value, import_Color.White);
      message.blText = (_c = data.buttonLeft && await data.buttonLeft.getString()) != null ? _c : "";
      message.blColor = await (0, import_tools.getIconEntryColor)(data.colorButtonLeft, value, import_Color.White);
      message.brText = (_d = data.buttonRight && await data.buttonRight.getString()) != null ? _d : "";
      message.brColor = await (0, import_tools.getIconEntryColor)(data.colorButtonRight, value, import_Color.White);
      message.text = (_e = data.text && await data.text.getString()) != null ? _e : "";
      if (message.text)
        message.text = this.library.getTranslation(message.text);
      if (message.text)
        message.text = message.text.replaceAll("\n", "\r\n").replaceAll("/r/n", "\r\n");
      message.textColor = await (0, import_tools.getIconEntryColor)(data.colorText, value, import_Color.White);
      const placeholder = (_f = data.optionalValue && await data.optionalValue.getObject()) != null ? _f : null;
      if (placeholder && pages.isPlaceholderType(placeholder)) {
        for (const key in placeholder) {
          const target = placeholder[key];
          let val = (_g = target.dp && await this.panel.statesControler.getStateVal(target.dp)) != null ? _g : "";
          if (val === "")
            val = (_h = target.text) != null ? _h : "";
          message.text = message.text.replaceAll("${" + key + "}", val);
        }
      }
      message.timeout = (_i = data.timeout && await data.timeout.getNumber()) != null ? _i : 0;
    }
    if (items.card === "popupNotify") {
      this.sendToPanel(this.getMessage(message));
      return;
    } else if (items.card === "popupNotify2") {
      const data = items.data;
      message.fontSet = (_j = data.textSize && await data.textSize.getString()) != null ? _j : "";
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
  async onStateTrigger(_dp) {
    this.log.debug("state triggerd " + _dp);
    if (_dp.includes("popupNotification"))
      this.panel.setActivePage(this);
  }
  async onButtonEvent(_event) {
    if (_event.action === "notifyAction") {
      const data = this.items && this.items.card === "popupNotify" && this.items.data;
      if (data) {
        if (data.setValue2) {
          if (_event.opt === "yes")
            data.setValue1 && data.setValue1.setStateTrue();
          else
            data.setValue2 && data.setValue2.setStateTrue();
        } else
          data.setValue1 && data.setValue1.setStateAsync(_event.opt === "yes");
      }
    } else {
      if (this.name.includes("///popupNotification"))
        this.lastpage = this.lastpage.filter((a) => !a.name.includes("///popupNotification"));
      const p = this.lastpage.pop();
      if (p) {
        p.removeLastPage(this);
        this.log.debug("Set active page from popup to " + p.name);
        await this.panel.setActivePage(p);
      } else {
        const page = this.panel.navigation.getCurrentPage();
        this.log.debug("Set active page from currentpage to " + page.name);
        await this.panel.setActivePage(page);
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageNotify
});
//# sourceMappingURL=pageNotification.js.map
