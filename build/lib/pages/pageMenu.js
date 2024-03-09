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
var pageMenu_exports = {};
__export(pageMenu_exports, {
  PageMenu: () => PageMenu
});
module.exports = __toCommonJS(pageMenu_exports);
var import_Page = require("../classes/Page");
var import_Color = require("../const/Color");
var import_icon_mapping = require("../const/icon_mapping");
var import_tools = require("../const/tools");
var import_data_collection_functions = require("./data-collection-functions");
class PageMenu extends import_Page.Page {
  maxItems = 4;
  step = 0;
  iconLeft = "";
  iconRight = "";
  iconLeftP = "";
  iconRightP = "";
  doubleClick;
  lastdirection = null;
  tempItems;
  constructor(config, options) {
    super(config, options);
  }
  async getOptions(result) {
    if (this.pageItems) {
      if (this.config && (this.config.card === "cardEntities" || this.config.card === "cardGrid" || this.config.card === "cardGrid2")) {
        let pageItems = this.pageItems;
        if (this.config.filterType === "true" || this.config.filterType === "false") {
          this.tempItems = [];
          const testIt = this.config.filterType === "true";
          for (const p of this.pageItems) {
            if (p && p.dataItems && p.dataItems.data && "entity1" in p.dataItems.data && p.dataItems.data.entity1 && p.dataItems.data.entity1.value && testIt === await p.dataItems.data.entity1.value.getBoolean())
              this.tempItems.push(p);
          }
          pageItems = this.tempItems;
        }
        const isEntities = this.config.card === "cardEntities";
        let maxItems = this.maxItems;
        let a = 0;
        if (this.pageItems.length > maxItems) {
          a = (isEntities ? maxItems : maxItems / 2) * this.step;
          maxItems = a + maxItems;
        }
        let b = 0;
        if (this.config.scrollType === "page") {
          for (; a < maxItems; a++) {
            const temp = pageItems[a];
            result[b++] = temp ? await temp.getPageItemPayload() : "~~~~~";
          }
        } else {
          let a2 = this.step;
          for (; a2 < this.maxItems + this.step; a2++) {
            const temp = pageItems[a2];
            result[b++] = temp ? await temp.getPageItemPayload() : "~~~~~";
          }
        }
      }
    }
    return result;
  }
  async onVisibilityChange(val) {
    if (val) {
      if (this.config && (this.config.card === "cardEntities" || this.config.card === "cardGrid" || this.config.card === "cardGrid2")) {
        const temp = await (0, import_data_collection_functions.handleCardRole)(this.adapter, this.config.cardRole, this);
        if (temp)
          this.pageItemConfig = temp;
      }
    }
    await super.onVisibilityChange(val);
  }
  goLeft(single = false) {
    if (!this.config || this.config.card !== "cardEntities" && this.config.card !== "cardGrid" && this.config.card !== "cardGrid2")
      return;
    if (this.doubleClick) {
      this.adapter.clearTimeout(this.doubleClick);
      this.doubleClick = void 0;
      if (this.lastdirection == "right") {
        this.panel.navigation.goLeft();
        return;
      } else {
      }
    } else if (!single) {
      this.lastdirection = "left";
      this.doubleClick = this.adapter.setTimeout(() => {
        this.goLeft(true);
        this.doubleClick = void 0;
      }, 400);
      return;
    }
    if (--this.step < 0) {
      this.step = 0;
      this.panel.navigation.goLeft();
    } else
      this.update();
  }
  goRight(single = false) {
    if (!this.config || this.config.card !== "cardEntities" && this.config.card !== "cardGrid" && this.config.card !== "cardGrid2")
      return;
    if (this.doubleClick) {
      this.adapter.clearTimeout(this.doubleClick);
      this.doubleClick = void 0;
      if (this.lastdirection == "right") {
        this.panel.navigation.goRight();
        return;
      } else {
      }
    } else if (!single) {
      this.lastdirection = "right";
      this.doubleClick = this.adapter.setTimeout(() => {
        this.doubleClick = void 0;
        this.goRight(true);
      }, 400);
      return;
    }
    const pageScroll = this.config.scrollType === "page";
    const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
    if (!pageScroll ? ++this.step + this.maxItems > length : ++this.step * this.maxItems >= length) {
      this.step--;
      this.panel.navigation.goRight();
    } else
      this.update();
  }
  getNavigation() {
    if (!this.config || this.config.card !== "cardEntities" && this.config.card !== "cardGrid" && this.config.card !== "cardGrid2")
      return "";
    const pageScroll = this.config.scrollType === "page";
    const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
    if (this.maxItems >= length) {
      return super.getNavigation();
    }
    let left = "";
    let right = "";
    if (this.step <= 0) {
      left = this.panel.navigation.buildNavigationString("left");
    }
    if (!pageScroll ? this.step + this.maxItems >= length : (this.step + 1) * this.maxItems >= length) {
      right = this.panel.navigation.buildNavigationString("right");
    }
    if (!left)
      left = (0, import_tools.getPayload)(
        "button",
        "bSubPrev",
        pageScroll ? import_icon_mapping.Icons.GetIcon("arrow-up-bold-outline") : import_icon_mapping.Icons.GetIcon("arrow-up-bold"),
        String(import_Color.Color.rgb_dec565(import_Color.Color.HMIOn)),
        "",
        ""
      );
    if (!right)
      right = (0, import_tools.getPayload)(
        "button",
        "bSubNext",
        pageScroll ? import_icon_mapping.Icons.GetIcon("arrow-down-bold-outline") : import_icon_mapping.Icons.GetIcon("arrow-down-bold"),
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
  PageMenu
});
//# sourceMappingURL=pageMenu.js.map
