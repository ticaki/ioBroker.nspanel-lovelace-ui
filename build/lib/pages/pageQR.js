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
var pageQR_exports = {};
__export(pageQR_exports, {
  PageQR: () => PageQR
});
module.exports = __toCommonJS(pageQR_exports);
var import_Page = require("../classes/Page");
var import_tools = require("../const/tools");
var pages = __toESM(require("../types/pages"));
const PageQRMessageDefault = {
  event: "entityUpd",
  headline: "Page QR",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  textQR: "~",
  //textQR
  type1: "disabled",
  //type -> text or switch
  internalName1: "~",
  //internalName
  iconId1: "~",
  //iconId
  iconColor1: "~",
  //iconColor
  displayName1: "~",
  //displayName
  optionalValue1: "~",
  //optionalValue
  type2: "disabled",
  //type2 -> text or switch
  internalName2: "~",
  //internalName2
  iconId2: "~",
  //iconId2
  iconColor2: "~",
  //iconColor2
  displayName2: "~",
  //displayName2
  optionalValue2: "~"
  //optionalvalue2
};
class PageQR extends import_Page.Page {
  items;
  step = 1;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  qrType = "";
  constructor(config, options) {
    if (config.card !== "cardQR")
      return;
    super(config, options);
    if (options.config && options.config.card == "cardQR")
      this.config = options.config;
    else
      throw new Error("Missing config!");
    this.qrType = options.config.qrType;
    this.minUpdateInterval = 1e3;
  }
  async init() {
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    if (tempItem)
      tempItem.card = "cardQR";
    this.items = tempItem;
    await super.init();
  }
  /**
   *
   * @returns
   */
  async update() {
    var _a;
    if (!this.visibility)
      return;
    const message = {};
    if (this.items) {
      const items = this.items;
      message.headline = this.library.getTranslation(
        (_a = items.data.headline && await items.data.headline.getString()) != null ? _a : ""
      );
      message.navigation = this.getNavigation();
      if (this.pageItems) {
        const pageItems = this.pageItems.filter((a) => a && a.dataItems);
        this.log.info(`qrType = ${this.qrType}`);
        switch (this.qrType) {
          case "wifi":
            if (pageItems.length != 2)
              throw new Error("Bad config for WIFI!");
            message.textQR = `WIFI:`;
            break;
          case "url":
            if (pageItems.length != 1)
              throw new Error("Bad config for URL!");
            message.textQR = `URL:https://forum.iobroker.net/topic/58170/sonoff-nspanel-mit-lovelace-ui`;
            break;
          default:
            break;
        }
        for (let a = 0; a < pageItems.length; a++) {
          const temp = pageItems[a];
          if (temp) {
            const arr = (await temp.getPageItemPayload()).split("~");
            this.log.info(`0: ${arr[0]} 1: ${arr[1]} 2: ${arr[2]} 3: ${arr[3]} 4: ${arr[4]} 5: ${arr[5]}`);
            switch (a) {
              case 0:
                message.type1 = arr[0];
                message.displayName1 = arr[4];
                message.internalName1 = arr[1];
                message.iconId1 = arr[2];
                message.iconColor1 = arr[3];
                message.optionalValue1 = arr[5];
                break;
              case 1:
                message.type2 = arr[0] == "button" ? "switch" : "text";
                message.displayName2 = arr[4];
                message.internalName2 = arr[1];
                message.iconId2 = arr[2];
                message.iconColor2 = arr[3];
                message.optionalValue2 = arr[5];
                break;
              default:
                break;
            }
          }
        }
      }
    }
    this.sendToPanel(this.getMessage(message));
  }
  getMessage(_message) {
    let result = PageQRMessageDefault;
    result = Object.assign(result, _message);
    return (0, import_tools.getPayload)(
      "entityUpd",
      result.headline,
      result.navigation,
      result.textQR,
      result.type1,
      result.internalName1,
      result.iconId1,
      result.iconColor1,
      result.displayName1,
      result.optionalValue1,
      result.type2,
      result.internalName2,
      result.iconId2,
      result.iconColor2,
      result.displayName2,
      result.optionalValue2
    );
  }
  async onStateTrigger(_id) {
    this.adapter.setTimeout(() => this.update(), 50);
  }
  /**
   *a
   * @param _event
   * @returns
   */
  async onButtonEvent(_event) {
    const button = _event.action;
    const value = _event.opt;
    if (!this.items || this.items.card !== "cardQR")
      return;
    this.log.info(`button: ${button} value ${value}`);
    if (pages.isQRButtonEvent(button)) {
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageQR
});
//# sourceMappingURL=pageQR.js.map
