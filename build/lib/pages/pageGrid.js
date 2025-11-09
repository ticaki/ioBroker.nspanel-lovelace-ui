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
var pageGrid_exports = {};
__export(pageGrid_exports, {
  PageGrid: () => PageGrid
});
module.exports = __toCommonJS(pageGrid_exports);
var import_pageMenu = require("./pageMenu");
const PageGridMessageDefault = {
  event: "entityUpd",
  headline: "Page Grid",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  options: ["~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~"]
};
const PageGrid2MessageDefault = {
  ...PageGridMessageDefault,
  options: ["~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~"]
};
const PageGrid2USPMessageDefault = {
  ...PageGridMessageDefault,
  options: ["~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~"]
};
const PageGrid3MessageDefault = {
  ...PageGridMessageDefault,
  options: ["~~~~~", "~~~~~", "~~~~~"]
};
class PageGrid extends import_pageMenu.PageMenu {
  config;
  items;
  constructor(config, options) {
    var _a, _b, _c;
    super(config, options);
    if (!(((_a = options.config) == null ? void 0 : _a.card) === "cardGrid" || ((_b = options.config) == null ? void 0 : _b.card) === "cardGrid2" || ((_c = options.config) == null ? void 0 : _c.card) === "cardGrid3")) {
      throw new Error("PageGrid: invalid config card");
    }
    this.config = options.config;
    this.iconLeftP = "arrow-left-bold-outline";
    this.iconLeft = "arrow-up-bold";
    this.iconRightP = "arrow-right-bold-outline";
    this.iconRight = "arrow-down-bold";
    if (options.items && (options.items.card == "cardGrid" || options.items.card == "cardGrid2" || options.items.card == "cardGrid3")) {
      this.items = options.items;
    }
    this.minUpdateInterval = 500;
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
    var _a;
    if (!this.visibility) {
      return;
    }
    const message = {};
    message.options = [];
    if (!this.items || this.items.card !== "cardGrid" && this.items.card !== "cardGrid2" && this.items.card !== "cardGrid3") {
      return;
    }
    if (!this.config || this.config.card !== "cardGrid" && this.config.card !== "cardGrid2" && this.config.card !== "cardGrid3") {
      return;
    }
    const arr = (await this.getOptions([])).slice(0, this.maxItems);
    message.options = arr;
    message.headline = this.library.getTranslation(
      (_a = this.items && this.items.data.headline && await this.items.data.headline.getString()) != null ? _a : ""
    );
    message.navigation = this.getNavigation();
    const msg = {
      ...this.card === "cardGrid" ? PageGridMessageDefault : this.card === "cardGrid2" ? this.basePanel.info.nspanel.model === "us-p" ? PageGrid2USPMessageDefault : PageGrid2MessageDefault : PageGrid3MessageDefault,
      ...message
    };
    this.sendToPanel(this.getMessage(msg), false);
  }
  async onStateTrigger() {
    await this.update();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageGrid
});
//# sourceMappingURL=pageGrid.js.map
