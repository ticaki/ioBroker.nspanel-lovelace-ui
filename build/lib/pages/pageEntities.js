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
var import_data_collection_functions = require("./data-collection-functions");
const PageEntitiesMessageDefault = {
  event: "entityUpd",
  headline: "Page Entities",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  options: ["~~~~~", "~~~~~", "~~~~~", "~~~~~", "~~~~~"]
};
class PageEntities extends import_Page.Page {
  config;
  maxItems = 4;
  step = 0;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  lastNavClick = 0;
  tempItems;
  items;
  constructor(config, options) {
    super(config, options);
    if (!options.config || options.config.card !== "cardEntities") {
      throw new Error("wrong card, should never happen");
    }
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
      if (this.config && this.config.card == "cardEntities") {
        if (this.config.scrollType === "page") {
          let maxItems = this.maxItems;
          let a = 0;
          if (this.pageItems.length > maxItems) {
            a = maxItems * this.step;
            maxItems = a + maxItems;
          }
          let b = 0;
          let pageItems = this.pageItems;
          if (this.config.filterType === "true" || this.config.filterType === "false") {
            this.tempItems = [];
            const testIt = this.config.filterType === "true";
            for (const a2 of this.pageItems) {
              if (a2 && a2.dataItems && a2.dataItems.data && "entity1" in a2.dataItems.data && a2.dataItems.data.entity1 && a2.dataItems.data.entity1.value && testIt === await a2.dataItems.data.entity1.value.getBoolean())
                this.tempItems.push(a2);
            }
            pageItems = this.tempItems;
          }
          for (; a < maxItems; a++) {
            const temp = pageItems[a];
            message.options[b++] = temp ? await temp.getPageItemPayload() : "~~~~~";
          }
        } else {
          let a = this.step;
          for (; a < this.maxItems + this.step; a++) {
            const temp = this.pageItems[a];
            message.options[a - this.step] = temp ? await temp.getPageItemPayload() : "~~~~~";
          }
        }
      }
    }
    message.headline = this.library.getTranslation(
      (_a = this.items && this.items.data.headline && await this.items.data.headline.getString()) != null ? _a : ""
    );
    message.navigation = this.getNavigation();
    const msg = Object.assign(structuredClone(PageEntitiesMessageDefault), message);
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
  async onVisibilityChange(val) {
    if (val) {
      if (this.config.card === "cardEntities") {
        const temp = await (0, import_data_collection_functions.handleCardRole)(this.adapter, this.config.cardRole, this);
        if (temp)
          this.pageItemConfig = temp;
      }
    }
    await super.onVisibilityChange(val);
  }
  goLeft() {
    if (!this.config || this.config.card !== "cardEntities")
      return;
    if (this.config.scrollType === "page") {
      this.goLeftP();
      return;
    }
    if (--this.step < 0 && Date.now() - this.lastNavClick > 300) {
      this.step = 0;
      this.panel.navigation.goLeft();
    } else
      this.update();
    this.lastNavClick = Date.now();
  }
  goRight() {
    if (!this.config || this.config.card !== "cardEntities")
      return;
    if (this.config.scrollType === "page") {
      this.goRightP();
      return;
    }
    const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
    if (++this.step + this.maxItems > length && Date.now() - this.lastNavClick > 300) {
      this.step--;
      this.panel.navigation.goRight();
    } else
      this.update();
    this.lastNavClick = Date.now();
  }
  getNavigation() {
    if (!this.config || this.config.card !== "cardEntities")
      return "";
    if (this.config.scrollType === "page") {
      return this.getNavigationP();
    }
    const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
    if (this.maxItems >= length) {
      return super.getNavigation();
    }
    let left = "";
    let right = "";
    if (this.step <= 0) {
      left = this.panel.navigation.buildNavigationString("left");
    }
    if (this.step + this.maxItems >= length) {
      right = this.panel.navigation.buildNavigationString("right");
    }
    if (!left)
      left = (0, import_tools.getPayload)(
        "button",
        "bSubPrev",
        import_icon_mapping.Icons.GetIcon("arrow-up-bold"),
        String(import_Color.Color.rgb_dec565(import_Color.Color.HMIOn)),
        "",
        ""
      );
    if (!right)
      right = (0, import_tools.getPayload)(
        "button",
        "bSubNext",
        import_icon_mapping.Icons.GetIcon("arrow-down-bold"),
        String(import_Color.Color.rgb_dec565(import_Color.Color.HMIOn)),
        "",
        ""
      );
    return (0, import_tools.getPayload)(left, right);
  }
  goLeftP() {
    if (--this.step < 0) {
      this.step = 0;
      this.panel.navigation.goLeft();
    } else
      this.update();
  }
  goRightP() {
    const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
    if (++this.step * this.maxItems >= length) {
      this.step--;
      this.panel.navigation.goRight();
    } else
      this.update();
  }
  getNavigationP() {
    const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
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
        import_icon_mapping.Icons.GetIcon("arrow-up-bold-outline"),
        String(import_Color.Color.rgb_dec565(import_Color.Color.HMIOn)),
        "",
        ""
      );
    if (!right)
      right = (0, import_tools.getPayload)(
        "button",
        "bSubNext",
        import_icon_mapping.Icons.GetIcon("arrow-down-bold-outline"),
        String(import_Color.Color.rgb_dec565(import_Color.Color.HMIOn)),
        "",
        ""
      );
    return (0, import_tools.getPayload)(left, right);
  }
  async reset() {
    this.step = 0;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageEntities
});
//# sourceMappingURL=pageEntities.js.map
