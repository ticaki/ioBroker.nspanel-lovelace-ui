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
var pageQR_exports = {};
__export(pageQR_exports, {
  PageQR: () => PageQR
});
module.exports = __toCommonJS(pageQR_exports);
var import_Page = require("../classes/Page");
var import_icon_mapping = require("../const/icon_mapping");
var import_tools = require("../const/tools");
const PageQRMessageDefault = {
  event: "entityUpd",
  headline: "Page QR",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  textQR: "",
  //textQR
  type1: "text",
  //type -> text or switch
  internalName1: "ssid",
  //internalName
  iconId1: import_icon_mapping.Icons.GetIcon("wifi"),
  //iconId
  iconColor1: "65535",
  //iconColor
  displayName1: "SSId",
  //displayName
  optionalValue1: "",
  //optionalValue
  type2: "text",
  //type2 -> text or switch
  internalName2: "pwd",
  //internalName2
  iconId2: import_icon_mapping.Icons.GetIcon("key"),
  //iconId2
  iconColor2: "65535",
  //iconColor2
  displayName2: "Password",
  //displayName2
  optionalValue2: ""
  //optionalvalue2
};
class PageQR extends import_Page.Page {
  items;
  step = 1;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  status = "armed";
  constructor(config, options) {
    super(config, options);
    if (options.config && options.config.card == "cardQR")
      this.config = options.config;
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
    this.items.card = "cardQR";
    await super.init();
  }
  /**
   *
   * @returns
   */
  async update() {
    var _a, _b;
    if (!this.visibility)
      return;
    const message = {};
    const items = this.items;
    if (!items || items.card !== "cardQR")
      return;
    const data = items.data;
    message.headline = (_a = data.headline && await data.headline.getTranslatedString()) != null ? _a : this.name;
    message.navigation = this.getNavigation();
    message.textQR = (_b = data.qrcode && data.qrcode.true && await data.qrcode.true.getString()) != null ? _b : "WIFI:T:undefined;S:undefined;P:undefined;H:undefined;";
    const tempstr = message.textQR.split(";");
    for (let w = 0; w < tempstr.length - 1; w++) {
      if (tempstr[w].substring(5, 6) == "T") {
        tempstr[w].slice(7) == "undefined" ? this.log.warn("Adjust data (T) for the QR page under data. Follow the instructions in the wiki.") : "";
      }
      if (tempstr[w].substring(0, 1) == "S") {
        tempstr[w].slice(2) == "undefined" ? this.log.warn("Adjust data (S) for the QR page under data. Follow the instructions in the wiki.") : message.optionalValue1 = tempstr[w].slice(2);
      }
      if (tempstr[w].substring(0, 1) == "P") {
        message.optionalValue2 = tempstr[w].slice(2);
      }
    }
    if (data.pwdHidden && await data.pwdHidden.getBoolean()) {
      message.type2 = "switch";
      message.iconColor2 = "65535";
      message.iconId2 = "";
      message.displayName2 = "Wlan enabled";
      message.internalName2 = "switch";
      message.optionalValue2 = "0";
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
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageQR
});
//# sourceMappingURL=pageQR.js.map
