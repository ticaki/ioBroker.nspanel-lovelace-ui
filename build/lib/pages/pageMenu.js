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
    if (options.config) {
      switch (options.config.card) {
        case "cardSchedule":
        case "cardGrid":
          this.maxItems = 6;
          break;
        case "cardGrid2":
          this.maxItems = this.basePanel.info.nspanel.model === "us-p" ? 9 : 8;
          break;
        case "cardGrid3":
          this.maxItems = 4;
          break;
        case "cardEntities":
          this.maxItems = this.basePanel.info.nspanel.model === "us-p" ? 5 : 4;
          break;
        case "cardThermo2":
          this.maxItems = 9;
          break;
        case "cardChart":
        case "cardLChart":
        case "cardThermo":
        case "cardMedia":
        case "cardQR":
        case "cardAlarm":
        case "cardPower":
        case "screensaver":
        case "screensaver2":
        case "screensaver3":
        case "popupNotify":
        case "popupNotify2":
        default:
          this.log.warn(
            `PageMenu: ${config.card} is not supported in this class. Please use the correct class for this card.`
          );
          break;
      }
    }
  }
  async getOptions(result) {
    if (this.pageItems) {
      if (this.config && (this.config.card === "cardEntities" || this.config.card === "cardSchedule" || this.config.card === "cardGrid" || this.config.card === "cardGrid3" || this.config.card === "cardThermo2" || this.config.card === "cardGrid2")) {
        this.tempItems = await this.getEnabledPageItems() || [];
        if (this.config.filterType === "true" || this.config.filterType === "false") {
          this.tempItems = [];
          const testIt = this.config.filterType === "true";
          for (const p of this.pageItems) {
            if (p && p.dataItems && p.dataItems.data && "entity1" in p.dataItems.data && p.dataItems.data.entity1 && p.dataItems.data.entity1.value && testIt === await p.dataItems.data.entity1.value.getBoolean()) {
              this.tempItems.push(p);
            }
          }
        } else if (typeof this.config.filterType === "number") {
          this.tempItems = [];
          for (const p of this.pageItems) {
            if (p && p.dataItems && (p.dataItems.filter == null || p.dataItems.filter === this.config.filterType)) {
              this.tempItems.push(p);
            }
          }
        }
        const isEntities = this.config.card === "cardEntities" || this.config.card === "cardSchedule" || this.config.card === "cardThermo2";
        let maxItems = this.maxItems;
        let a = 0;
        if (this.tempItems.length > maxItems) {
          a = (isEntities ? maxItems : maxItems / 2) * this.step;
          maxItems = a + maxItems;
        }
        let b = 0;
        if (this.config.scrollType === "page") {
          for (; a < maxItems; a++) {
            const temp = this.tempItems[a];
            result[b++] = temp ? await temp.getPageItemPayload() : "~~~~~";
          }
        } else {
          let a2 = this.step;
          for (; a2 < this.maxItems + this.step; a2++) {
            const temp = this.tempItems[a2];
            result[b++] = temp ? await temp.getPageItemPayload() : "~~~~~";
          }
        }
      }
    }
    return result;
  }
  async onVisibilityChange(val) {
    if (val) {
      if (this.config && (this.config.card === "cardEntities" || this.config.card === "cardSchedule" || this.config.card === "cardGrid" || this.config.card === "cardGrid3" || this.config.card === "cardThermo2" || this.config.card === "cardGrid2")) {
        switch (this.config.card) {
          case "cardSchedule":
          case "cardGrid":
            this.maxItems = 6;
            break;
          case "cardGrid2":
            this.maxItems = this.basePanel.info.nspanel.model === "us-p" ? 9 : 8;
            break;
          case "cardGrid3":
            this.maxItems = 4;
            break;
          case "cardEntities":
            this.maxItems = this.basePanel.info.nspanel.model === "us-p" ? 5 : 4;
            break;
          case "cardThermo2":
            this.maxItems = 9;
            break;
          default:
            this.log.error(`PageMenu: ${this.config.card} is not supported in onVisibilityChange!`);
            break;
        }
        const temp = await (0, import_data_collection_functions.handleCardRole)(this.adapter, this.config.cardRole, this);
        if (temp) {
          this.pageItemConfig = temp;
        }
      }
    } else {
      this.tempItems = [];
    }
    await super.onVisibilityChange(val);
  }
  goLeft(single = false) {
    if (!this.config || this.config.card !== "cardEntities" && this.config.card !== "cardSchedule" && this.config.card !== "cardGrid" && this.config.card !== "cardGrid2" && this.config.card !== "cardThermo2" && this.config.card !== "cardGrid3") {
      return;
    }
    if (!single) {
      if (this.doubleClick) {
        this.adapter.clearTimeout(this.doubleClick);
        this.doubleClick = void 0;
        if (this.lastdirection == "right") {
          this.basePanel.navigation.goLeft();
          return;
        }
      } else {
        this.lastdirection = "left";
        if (this.unload) {
          return;
        }
        this.doubleClick = this.adapter.setTimeout(() => {
          this.goLeft(true);
          this.doubleClick = void 0;
        }, this.adapter.config.doubleClickTime);
        return;
      }
    }
    if (--this.step < 0) {
      this.step = 0;
      this.basePanel.navigation.goLeft();
    } else {
      void this.update();
    }
  }
  goRight(single = false) {
    if (!this.config || this.config.card !== "cardEntities" && this.config.card !== "cardSchedule" && this.config.card !== "cardGrid" && this.config.card !== "cardGrid2" && this.config.card !== "cardThermo2" && this.config.card !== "cardGrid3") {
      return;
    }
    if (!single) {
      if (this.doubleClick) {
        this.adapter.clearTimeout(this.doubleClick);
        this.doubleClick = void 0;
        if (this.lastdirection == "right") {
          this.basePanel.navigation.goRight();
          return;
        }
      } else {
        this.lastdirection = "left";
        if (this.unload) {
          return;
        }
        this.doubleClick = this.adapter.setTimeout(() => {
          this.doubleClick = void 0;
          this.goRight(true);
        }, this.adapter.config.doubleClickTime);
        return;
      }
    }
    const pageScroll = this.config.scrollType === "page";
    const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
    const maxItemsPage = this.config.card === "cardEntities" || this.config.card === "cardSchedule" ? this.maxItems : this.maxItems / 2;
    const maxItemsPagePlus = this.config.card === "cardEntities" || this.config.card === "cardSchedule" ? 0 : this.maxItems / 2;
    if (!pageScroll ? ++this.step + this.maxItems > length : ++this.step * maxItemsPage + maxItemsPagePlus >= length) {
      this.step--;
      this.basePanel.navigation.goRight();
    } else {
      void this.update();
    }
  }
  getNavigation() {
    var _a;
    if (!this.config || this.config.card !== "cardEntities" && this.config.card !== "cardSchedule" && this.config.card !== "cardGrid" && this.config.card !== "cardGrid2" && this.config.card !== "cardGrid3" && this.config.card !== "cardThermo2") {
      this.log.error(
        `PageMenu: ${(_a = this.config) == null ? void 0 : _a.card} is not supported in getNavigation! Please use the correct class for this card.`
      );
      return "";
    }
    const pageScroll = this.config.scrollType === "page";
    const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
    if (this.maxItems >= length) {
      return super.getNavigation();
    }
    let left = "";
    let right = "";
    if (this.step <= 0) {
      left = this.basePanel.navigation.buildNavigationString("left");
    }
    const maxItemsPage = this.config.card === "cardEntities" || this.config.card === "cardSchedule" ? this.maxItems : this.maxItems / 2;
    const maxItemsPagePlus = this.config.card === "cardEntities" || this.config.card === "cardSchedule" ? 0 : this.maxItems / 2;
    if (!pageScroll ? this.step + this.maxItems >= length : (this.step + 1) * maxItemsPage + maxItemsPagePlus >= length) {
      right = this.basePanel.navigation.buildNavigationString("right");
    }
    if (!left) {
      left = (0, import_tools.getPayload)(
        "button",
        "bSubPrev",
        pageScroll ? import_icon_mapping.Icons.GetIcon("arrow-up-bold-outline") : import_icon_mapping.Icons.GetIcon("arrow-up-bold"),
        String(import_Color.Color.rgb_dec565(import_Color.Color.HMIOn)),
        "",
        ""
      );
    }
    if (!right) {
      right = (0, import_tools.getPayload)(
        "button",
        "bSubNext",
        pageScroll ? import_icon_mapping.Icons.GetIcon("arrow-down-bold-outline") : import_icon_mapping.Icons.GetIcon("arrow-down-bold"),
        String(import_Color.Color.rgb_dec565(import_Color.Color.HMIOn)),
        "",
        ""
      );
    }
    return (0, import_tools.getPayload)(left, right);
  }
  async reset() {
    this.step = 0;
  }
  async delete() {
    if (this.doubleClick) {
      this.adapter.clearTimeout(this.doubleClick);
      this.doubleClick = void 0;
    }
    this.tempItems = [];
    await super.delete();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageMenu
});
//# sourceMappingURL=pageMenu.js.map
