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
var import_Color = require("../const/Color");
var import_icon_mapping = require("../const/icon_mapping");
var import_tools = require("../const/tools");
const PageEntitiesMessageDefault = {
  event: "entityUpd",
  headline: "Page Entities",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  options: ["~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~"]
};
class PageEntities extends import_Page.Page {
  config;
  items;
  maxItems = 4;
  step = 0;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  lastNavClick = 0;
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
    if (this.pageItems) {
      let a = this.step;
      for (; a < this.maxItems + this.step; a++) {
        const temp = this.pageItems[a];
        if (temp)
          message.options[a - this.step] = await temp.getPageItemPayload();
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
    await this.update();
  }
  async onButtonEvent(_event) {
  }
  goLeft() {
    if (--this.step < 0 && Date.now() - this.lastNavClick > 300) {
      this.step = 0;
      this.panel.navigation.goLeft();
    } else
      this.update();
    this.lastNavClick = Date.now();
  }
  goRight() {
    const length = this.pageItems ? this.pageItems.length : 0;
    if (++this.step + this.maxItems >= length && Date.now() - this.lastNavClick > 300) {
      this.step--;
      this.panel.navigation.goRight();
    } else
      this.update();
    this.lastNavClick = Date.now();
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
    if (this.step + 1 + this.maxItems >= length) {
      right = this.panel.navigation.buildNavigationString("right");
    }
    if (!left)
      left = (0, import_tools.getPayload)("button", "bSubPrev", import_icon_mapping.Icons.GetIcon("arrow-up-bold"), String((0, import_Color.rgb_dec565)(import_Color.HMIOn)), "", "");
    if (!right)
      right = (0, import_tools.getPayload)(
        "button",
        "bSubNext",
        import_icon_mapping.Icons.GetIcon("arrow-down-bold"),
        String((0, import_Color.rgb_dec565)(import_Color.HMIOn)),
        "",
        ""
      );
    return (0, import_tools.getPayload)(left, right);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageEntities
});
//# sourceMappingURL=pageEntities.js.map
