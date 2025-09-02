"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
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
var pages = __toESM(require("../types/pages"));
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
  /** Optional arrow item used when scrollPresentation === 'arrow'. */
  arrowPageItem;
  nextArrow = false;
  tempItems;
  constructor(config, options) {
    if (!pages.isPageMenuConfig(config)) {
      throw new Error(`PageMenu: invalid config (card=${config.card})`);
    }
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
        case "cardMedia":
          this.maxItems = 5;
          break;
        case "cardChart":
        case "cardLChart":
        case "cardThermo":
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
  async init() {
    await super.init();
    const temp = await this.createPageItems([
      {
        type: "button",
        dpInit: "",
        role: "button",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "arrow-right-bold-circle-outline" },
              color: { type: "const", constVal: { red: 205, green: 142, blue: 153 } }
            }
          },
          entity1: { value: { type: "const", constVal: true } },
          additionalId: { type: "const", constVal: "-NextPageArrow" }
        }
      }
    ]);
    if (!temp || !temp[0]) {
      throw new Error("PageMenu: unable to create arrowPageItem");
    }
    this.arrowPageItem = temp[0];
  }
  /**
   * Build the list of payload strings for the current view.
   *
   * Modes:
   * - "classic": windowed paging using `this.maxItems`.
   *     - Respects `config.scrollType`: "page" (full page) or "half" (half page).
   *     - "half" is only effective for grid/thermo cards; otherwise falls back to "page".
   * - "arrow": always returns exactly `this.maxItems` slots; the last slot is optionally
   *     replaced by `arrowPageItem`. Now also shows on the last page to wrap to the first.
   *
   * Order is preserved (sequential awaits). Resets `this.step` if it points beyond the list.
   *
   * @param result Pre-allocated result array to fill with payload strings.
   * @returns Filled `result`.
   */
  async getOptions(result) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!this.pageItems || !this.config) {
      return result;
    }
    this.tempItems = await this.getEnabledPageItems() || [];
    if (this.config.filterType === "true" || this.config.filterType === "false") {
      const wantTrue = this.config.filterType === "true";
      const filtered = [];
      for (const p of this.pageItems) {
        if (((_a = p == null ? void 0 : p.dataItems) == null ? void 0 : _a.data) && "entity1" in p.dataItems.data && ((_b = p.dataItems.data.entity1) == null ? void 0 : _b.value) && wantTrue === await p.dataItems.data.entity1.value.getBoolean()) {
          filtered.push(p);
        }
      }
      this.tempItems = filtered;
    } else if (typeof this.config.filterType === "number") {
      const filtered = [];
      for (const p of this.pageItems) {
        if ((p == null ? void 0 : p.dataItems) && (p.dataItems.filter == null || p.dataItems.filter === this.config.filterType)) {
          filtered.push(p);
        }
      }
      this.tempItems = filtered;
    }
    const items = (_c = this.tempItems) != null ? _c : [];
    const total = items.length;
    const maxItems = Math.max(0, this.maxItems | 0);
    for (let i = 0; i < maxItems; i++) {
      result[i] = (_d = result[i]) != null ? _d : "~~~~~";
    }
    const style = (_e = this.config.scrollPresentation) != null ? _e : "classic";
    if (style === "classic") {
      const requestedScrollType = this.config.scrollType === "half" ? "half" : "page";
      const cardAllowsHalf = pages.isCardMenuHalfPageScrollType(this.config.card);
      const effectiveScrollType = requestedScrollType === "half" && cardAllowsHalf ? "half" : "page";
      const stride = total > maxItems ? effectiveScrollType === "page" ? maxItems : Math.max(1, Math.floor(maxItems / 2)) : 0;
      let start = stride > 0 ? this.step * stride : 0;
      if (start >= total) {
        this.step = 0;
        start = 0;
      }
      const end = Math.min(start + maxItems, total);
      let outIdx = 0;
      for (let i = start; i < end; i++, outIdx++) {
        const item = items[i];
        result[outIdx] = item ? (_f = await item.getPageItemPayload()) != null ? _f : "~~~~~" : "~~~~~";
      }
      while (outIdx < maxItems) {
        result[outIdx++] = "~~~~~";
      }
      return result;
    }
    if (style === "arrow") {
      if (maxItems <= 0) {
        return result;
      }
      let start = this.step * maxItems;
      if (start >= total) {
        this.step = 0;
        start = 0;
      }
      for (let i = 0; i < maxItems; i++) {
        const idx = start + i;
        const item = items[idx];
        result[i] = item ? (_g = await item.getPageItemPayload()) != null ? _g : "~~~~~" : "~~~~~";
      }
      const moreAfterWindow = start + maxItems < total;
      const moreBeforeWindow = start > 0;
      const multiplePages = total > maxItems;
      const shouldShowArrow = multiplePages && (moreAfterWindow || moreBeforeWindow);
      if (shouldShowArrow) {
        this.nextArrow = true;
        result[maxItems - 1] = this.arrowPageItem ? (_h = await this.arrowPageItem.getPageItemPayload()) != null ? _h : "~~~~~" : "~~~~~";
      } else {
        this.nextArrow = false;
      }
      return result;
    }
    return result;
  }
  async onVisibilityChange(val) {
    if (val) {
      if (this.config && pages.isPageMenuConfig(this.config)) {
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
          case "cardMedia":
            this.maxItems = 5;
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
      this.step = 0;
    } else {
      this.tempItems = [];
    }
    await super.onVisibilityChange(val);
  }
  goLeft(single = false) {
    if (this.config.scrollPresentation === "arrow") {
      super.goLeft();
      return;
    }
    if (!this.config || !pages.isPageMenuConfig(this.config)) {
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
    if (this.config.scrollPresentation === "arrow") {
      super.goRight();
      return;
    }
    if (!this.config || !pages.isPageMenuConfig(this.config)) {
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
    if (this.config.scrollPresentation === "arrow") {
      return super.getNavigation();
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
        String(import_Color.Color.rgb_dec565(import_Color.Color.navDown)),
        "",
        ""
      );
    }
    if (!right) {
      right = (0, import_tools.getPayload)(
        "button",
        "bSubNext",
        pageScroll ? import_icon_mapping.Icons.GetIcon("arrow-down-bold-outline") : import_icon_mapping.Icons.GetIcon("arrow-down-bold"),
        String(import_Color.Color.rgb_dec565(import_Color.Color.navDown)),
        "",
        ""
      );
    }
    return (0, import_tools.getPayload)(left, right);
  }
  async onButtonEvent(event) {
    if (this.nextArrow && event.id.endsWith("-NextPageArrow")) {
      this.step++;
      await this.update();
    }
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
