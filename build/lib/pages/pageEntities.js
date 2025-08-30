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
var import_tools = require("../const/tools");
var import_pageMenu = require("./pageMenu");
const PageEntitiesMessageDefault = {
  event: "entityUpd",
  headline: "Page Entities",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  options: ["~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~"]
};
class PageEntities extends import_pageMenu.PageMenu {
  config;
  items;
  constructor(config, options) {
    super(config, options);
    if (!options.config || options.config.card !== "cardEntities") {
      throw new Error("wrong card, should never happen");
    }
    this.iconLeftP = "arrow-up-bold-outline";
    this.iconLeft = "arrow-up-bold";
    this.iconRightP = "arrow-down-bold-outline";
    this.iconRight = "arrow-down-bold";
    this.config = options.config;
    if (options.items && options.items.card == "cardEntities") {
      this.items = options.items;
    }
    this.minUpdateInterval = 1e3;
  }
  async init() {
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.basePanel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    this.items.card = this.card;
    await super.init();
  }
  async update() {
    var _a, _b;
    if (!this.visibility || ((_a = this.items) == null ? void 0 : _a.card) !== "cardEntities") {
      return;
    }
    const message = {};
    const arr = (await this.getOptions([])).slice(0, this.maxItems);
    message.options = arr;
    message.headline = this.library.getTranslation(
      (_b = this.items && this.items.data.headline && await this.items.data.headline.getString()) != null ? _b : ""
    );
    message.navigation = this.getNavigation();
    const msg = Object.assign(structuredClone(PageEntitiesMessageDefault), message);
    this.sendToPanel(this.getMessage(msg), false);
  }
  getMessage(message) {
    return (0, import_tools.getPayload)("entityUpd", message.headline, message.navigation, (0, import_tools.getPayloadArray)(message.options));
  }
  async onStateTrigger() {
    await this.update();
  }
  async onButtonEvent(_event) {
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageEntities
});
//# sourceMappingURL=pageEntities.js.map
