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
    var _a;
    if (!this.visibility)
      return;
    const message = {};
    const items = this.items;
    if (!items || items.card !== "cardQR")
      return;
    const data = items.data;
    if (this.pageItems) {
      message.options = [];
      const maxItems = 2;
      for (let a = 0; a < maxItems; a++) {
        const temp = this.pageItems[a];
        if (temp)
          message.options[a] = await temp.getPageItemPayload();
      }
    }
    message.headline = (_a = data.headline && await data.headline.getTranslatedString()) != null ? _a : this.name;
    message.navigation = this.getNavigation();
    this.sendToPanel(this.getMessage(message));
  }
  getMessage(_message) {
    return "";
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
