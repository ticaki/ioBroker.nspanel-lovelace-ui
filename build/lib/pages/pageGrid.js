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
var import_Page = require("../classes/Page");
var import_tools = require("../const/tools");
var import_Color = require("../const/Color");
var import_icon_mapping = require("../const/icon_mapping");
const PageGridMessageDefault = {
  event: "entityUpd",
  headline: "Page Grid",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  options: ["~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~"]
};
const PageGrid2MessageDefault = {
  event: "entityUpd",
  headline: "Page Grid",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  options: ["~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~"]
};
class PageGrid extends import_Page.Page {
  config;
  items;
  maxItems;
  step = 0;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  tempItem;
  constructor(config, options) {
    super(config, options);
    this.config = options.config;
    if (options.items && (options.items.card == "cardGrid" || options.items.card == "cardGrid2"))
      this.items = options.items;
    this.maxItems = this.card === "cardGrid" ? 6 : 8;
    this.minUpdateInterval = 2e3;
  }
  async init() {
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
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
    if (!this.visibility)
      return;
    const message = {};
    message.options = [];
    if (!this.items || this.items.card !== "cardGrid" && this.items.card !== "cardGrid2")
      return;
    if (this.pageItems) {
      let maxItems = this.card === "cardGrid" ? 6 : 8;
      let a = 0;
      if (this.pageItems.length > maxItems) {
        a = maxItems * this.step;
        maxItems = a + maxItems;
      }
      for (; a < maxItems; a++) {
        const temp = this.pageItems[a];
        if (temp)
          message.options[a] = await temp.getPageItemPayload();
      }
    }
    message.headline = this.library.getTranslation(
      (_a = this.items && this.items.data.headline && await this.items.data.headline.getString()) != null ? _a : ""
    );
    message.navigation = this.getNavigation();
    const msg = Object.assign(
      this.card === "cardGrid" ? PageGridMessageDefault : PageGrid2MessageDefault,
      message
    );
    this.sendToPanel(this.getMessage(msg));
  }
  getMessage(message) {
    return (0, import_tools.getPayload)("entityUpd", message.headline, message.navigation, (0, import_tools.getPayloadArray)(message.options));
  }
  async onStateTrigger() {
    await this.update();
  }
  async onButtonEvent(_event) {
  }
  goLeft() {
    if (--this.step < 0) {
      this.step = 0;
      this.panel.navigation.goLeft();
    } else
      this.update();
  }
  goRight() {
    const length = this.pageItems ? this.pageItems.length : 0;
    if (++this.step * this.maxItems >= length) {
      this.step--;
      this.panel.navigation.goRight();
    } else
      this.update();
  }
  getNavigation() {
    const length = this.pageItems ? this.pageItems.length : 0;
    if (this.maxItems >= length) {
      return super.getNavigation();
    }
    let left = "";
    let right = "";
    if (this.step <= 0) {
      left = this.panel.navigation.buildNavigationString("left");
    }
    if ((this.step + 1) * this.maxItems >= length) {
      right = this.panel.navigation.buildNavigationString("right");
    }
    if (!left)
      left = (0, import_tools.getPayload)(
        "button",
        "bSubPrev",
        import_icon_mapping.Icons.GetIcon("arrow-left-bold"),
        String((0, import_Color.rgb_dec565)(import_Color.HMIOn)),
        "",
        ""
      );
    if (!right)
      right = (0, import_tools.getPayload)(
        "button",
        "bSubNext",
        import_icon_mapping.Icons.GetIcon("arrow-right-bold"),
        String((0, import_Color.rgb_dec565)(import_Color.HMIOn)),
        "",
        ""
      );
    return (0, import_tools.getPayload)(left, right);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageGrid
});
//# sourceMappingURL=pageGrid.js.map
