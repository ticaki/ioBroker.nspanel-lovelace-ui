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
var pageEntities_exports = {};
__export(pageEntities_exports, {
  PageEntities: () => PageEntities
});
module.exports = __toCommonJS(pageEntities_exports);
var import_Page = require("../classes/Page");
var import_tools = require("../const/tools");
const PageEntitiesMessageDefault = {
  event: "entityUpd",
  headline: "Page Grid",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  options: ["~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~"]
};
class PageEntities extends import_Page.Page {
  config;
  items;
  step = 1;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  tempItem;
  constructor(config, options) {
    super(config, options);
    this.config = options.config;
    if (options.items && options.items.card == "cardEntities")
      this.items = options.items;
    this.minUpdateInterval = 2e3;
  }
  async init() {
    const config = structuredClone(this.config);
    const tempConfig = this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config) : config;
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    this.items.card = this.card;
    await super.init();
  }
  async update() {
    var _a;
    const message = {};
    message.options = [];
    if (this.pageItems) {
      const maxItems = 4;
      for (let a = 0; a < maxItems; a++) {
        const temp = this.pageItems[a];
        if (temp)
          message.options[a] = await temp.getPageItemPayload();
      }
    }
    message.headline = this.library.getTranslation(
      (_a = this.items && this.items.data.headline && await this.items.data.headline.getString()) != null ? _a : ""
    );
    message.navigation = this.getNavigation();
    const msg = Object.assign(PageEntitiesMessageDefault, message);
    this.sendToPanel(this.getMessage(msg));
  }
  getMessage(message) {
    return (0, import_tools.getPayload)("entityUpd", message.headline, message.navigation, (0, import_tools.getPayloadArray)(message.options));
  }
  async onStateTrigger() {
    this.update();
  }
  async onButtonEvent(_event) {
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageEntities
});
//# sourceMappingURL=pageEntities.js.map
