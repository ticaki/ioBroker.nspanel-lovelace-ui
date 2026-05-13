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
var globals = __toESM(require("../types/function-and-const"));
var import_data_collection_functions = require("./data-collection-functions");
class PageMenu extends import_Page.Page {
  autoLoopTimeout;
  maxItems = 4;
  step = 0;
  iconLeft = "";
  iconRight = "";
  iconLeftP = "";
  iconRightP = "";
  lastdirection = null;
  /** Optional arrow item used when scrollPresentation === 'arrow'. */
  arrowPageItem;
  nextArrow = false;
  tempItems;
  constructor(config, options) {
    if (!globals.isPageMenuConfig(config)) {
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
              color: { type: "const", constVal: import_Color.Color.navRight }
            }
          },
          entity1: { value: { type: "const", constVal: true } },
          additionalId: { type: "const", constVal: "-NextPageArrow" },
          text: { true: { type: "const", constVal: "more" } }
        }
      }
    ]);
    if (!temp || !temp[0]) {
      throw new Error("PageMenu: unable to create arrowPageItem");
    }
    this.arrowPageItem = temp[0];
  }
  nextTick() {
    this.step++;
    void this.update();
  }
  autoLoop() {
    if (this.autoLoopTimeout) {
      this.adapter.clearTimeout(this.autoLoopTimeout);
    }
    if (!this.config || this.config.scrollPresentation !== "auto") {
      return;
    }
    if (this.unload || this.adapter.unload) {
      return;
    }
    this.autoLoopTimeout = this.adapter.setTimeout(
      () => {
        if (this.visibility && !this.sleep && !this.unload || this.adapter.unload) {
          this.nextTick();
        }
        this.autoLoop();
      },
      (this.config.scrollAutoTiming < 2 ? 3e3 : this.config.scrollAutoTiming * 1e3) || 15e3
    );
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
    var _a, _b, _c, _d, _e, _f;
    if (!this.pageItems || !this.config) {
      return result;
    }
    this.tempItems = await this.getEnabledPageItems() || [];
    if (this.config.filterType === true || this.config.filterType === false) {
      const wantTrue = this.config.filterType === true;
      const filtered = [];
      for (const p of this.tempItems) {
        if (((_a = p == null ? void 0 : p.dataItems) == null ? void 0 : _a.data) && "entity1" in p.dataItems.data && ((_b = p.dataItems.data.entity1) == null ? void 0 : _b.value) && wantTrue === await p.dataItems.data.entity1.value.getBoolean()) {
          filtered.push(p);
        }
      }
      this.tempItems = filtered;
    } else if (typeof this.config.filterType === "number") {
      const filtered = [];
      for (const p of this.tempItems) {
        if ((p == null ? void 0 : p.dataItems) && (p.dataItems.filter == null || p.dataItems.filter === this.config.filterType || typeof p.dataItems.filter === "number" && p.dataItems.filter < 0 && p.dataItems.filter !== -this.config.filterType)) {
          filtered.push(p);
        }
      }
      this.tempItems = filtered;
    } else if (typeof this.config.filterType === "string") {
      const filtered = [];
      const filter = this.config.filterType.split(",");
      for (const p of this.tempItems) {
        if ((p == null ? void 0 : p.dataItems) && (typeof p.dataItems.filter !== "string" || filter.indexOf(String(p.dataItems.filter)) !== -1)) {
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
    const rawStyle = (_e = this.config.scrollPresentation) != null ? _e : "classic";
    const style = rawStyle === "auto" ? "classic" : rawStyle;
    if (style === "classic") {
      const requestedScrollType = this.config.scrollType === "half" ? "half" : "page";
      const cardAllowsHalf = globals.isCardMenuHalfPageScrollType(this.config.card);
      const effectiveScrollType = requestedScrollType === "half" && cardAllowsHalf ? "half" : "page";
      const stride = total > maxItems ? effectiveScrollType === "page" ? maxItems : Math.max(1, Math.floor(maxItems / 2)) : 0;
      let start = stride > 0 ? this.step * stride : 0;
      if (start >= total) {
        this.step = 0;
        start = 0;
      }
      const end = Math.min(start + maxItems, total);
      let outIdx = 0;
      const tasks = [];
      for (let i = start; i < end; i++, outIdx++) {
        const item = items[i];
        if (item) {
          tasks.push(
            item.getPageItemPayload().then((p) => p != null ? p : "~~~~~").catch(() => "~~~~~")
          );
        } else {
          tasks.push(Promise.resolve("~~~~~"));
        }
      }
      const results = await Promise.all(tasks);
      for (let j = 0; j < results.length; j++) {
        result[j] = results[j];
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
      const multiplePages = total > maxItems;
      let start = this.step * (maxItems - (multiplePages ? 1 : 0));
      if (start >= total) {
        this.step = 0;
        start = 0;
      }
      const moreAfterWindow = start + maxItems < total;
      const moreBeforeWindow = start > 0;
      const shouldShowArrow = multiplePages && (moreAfterWindow || moreBeforeWindow);
      const tasks = [];
      for (let i = 0; i < maxItems - (shouldShowArrow ? 1 : 0); i++) {
        const idx = start + i;
        const item = items[idx];
        if (item) {
          tasks.push(
            item.getPageItemPayload().then((p) => p != null ? p : "~~~~~").catch(() => "~~~~~")
          );
        } else {
          tasks.push(Promise.resolve("~~~~~"));
        }
      }
      const results = await Promise.all(tasks);
      for (let i = 0; i < maxItems - (shouldShowArrow ? 1 : 0); i++) {
        result[i] = results[i];
      }
      if (shouldShowArrow) {
        this.nextArrow = true;
        result[maxItems - 1] = this.arrowPageItem ? (_f = await this.arrowPageItem.getPageItemPayload()) != null ? _f : "~~~~~" : "~~~~~";
      } else {
        this.nextArrow = false;
      }
      return result;
    }
    return result;
  }
  async onVisibilityChange(val) {
    var _a;
    if (val) {
      if (this.directParentPage) {
        const dp = this.directParentPage.getdpInitForChild();
        if (dp) {
          if (typeof dp === "string") {
            const v = (0, import_tools.getRegExp)(`^${dp.replace(/\./g, "\\.").replace(/\*/g, ".*")}`);
            if (v) {
              this.dpInit = v;
            }
          } else {
            this.dpInit = dp;
          }
        }
      }
      if (this.config && globals.isPageMenuConfig(this.config)) {
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
        const temp = await (0, import_data_collection_functions.handleCardRole)(this.adapter, this.config.cardRole, this, (_a = this.config) == null ? void 0 : _a.options);
        if (temp) {
          this.pageItemConfig = temp;
        }
      }
      this.step = 0;
      this.autoLoop();
    } else {
      if (this.autoLoopTimeout) {
        this.adapter.clearTimeout(this.autoLoopTimeout);
      }
      this.tempItems = [];
    }
    await super.onVisibilityChange(val);
  }
  goLeft(short = false) {
    if (this.config.scrollPresentation && ["arrow", "auto"].indexOf(this.config.scrollPresentation) !== -1) {
      super.goLeft(short);
      return;
    }
    if (!this.config || !globals.isPageMenuConfig(this.config)) {
      return;
    }
    if (!short) {
      super.goLeft(short);
      return;
    }
    const total = this.tempItems && this.tempItems.length || this.pageItems && this.pageItems.length || 0;
    const maxItems = Math.max(0, this.maxItems | 0);
    const requested = this.config.scrollType === "half" ? "half" : "page";
    const effective = requested === "half" && globals.isCardMenuHalfPageScrollType(this.config.card) ? "half" : "page";
    const stride = effective === "page" ? maxItems : Math.max(1, Math.floor(maxItems / 2));
    if (stride === 0 || total <= maxItems) {
      super.goLeft(short);
      return;
    }
    const prevStart = (this.step - 1) * stride;
    if (prevStart < 0) {
      super.goLeft(short);
    } else {
      this.step -= 1;
      void this.update();
    }
  }
  goRight(short = false) {
    if (this.config.scrollPresentation && ["arrow", "auto"].indexOf(this.config.scrollPresentation) !== -1) {
      super.goRight(short);
      return;
    }
    if (!this.config || !globals.isPageMenuConfig(this.config)) {
      return;
    }
    if (!short) {
      super.goRight(short);
      return;
    }
    const total = this.tempItems && this.tempItems.length || this.pageItems && this.pageItems.length || 0;
    const maxItems = Math.max(0, this.maxItems | 0);
    const requested = this.config.scrollType === "half" ? "half" : "page";
    const effective = requested === "half" && globals.isCardMenuHalfPageScrollType(this.config.card) ? "half" : "page";
    const stride = effective === "page" ? maxItems : Math.max(1, Math.floor(maxItems / 2));
    const nextStart = (this.step + 1) * stride;
    if (nextStart >= total) {
      super.goRight(short);
    } else {
      this.step += 1;
      void this.update();
    }
  }
  getNavigation() {
    if (this.config.scrollPresentation && ["arrow", "auto"].indexOf(this.config.scrollPresentation) !== -1) {
      return super.getNavigation();
    }
    const total = this.tempItems && this.tempItems.length || this.pageItems && this.pageItems.length || 0;
    const maxItems = Math.max(0, this.maxItems | 0);
    if (maxItems === 0 || total <= maxItems) {
      return super.getNavigation();
    }
    const requested = this.config.scrollType === "half" ? "half" : "page";
    const cardAllowsHalf = globals.isCardMenuHalfPageScrollType(this.config.card);
    const effective = requested === "half" && cardAllowsHalf ? "half" : "page";
    const stride = effective === "page" ? maxItems : Math.max(1, Math.floor(maxItems / 2));
    const start = this.step * stride;
    const hasPrev = start > 0;
    const hasNext = start + maxItems < total;
    let left = hasPrev ? "" : super.getNavigation("left");
    let right = hasNext ? "" : super.getNavigation("right");
    if (!left) {
      left = (0, import_tools.getPayloadRemoveTilde)(
        "button",
        "bSubPrev",
        effective === "page" ? import_icon_mapping.Icons.GetIcon("arrow-up-bold-outline") : import_icon_mapping.Icons.GetIcon("arrow-up-bold"),
        String(import_Color.Color.rgb_dec565(import_Color.Color.navDown)),
        "",
        ""
      );
    }
    if (!right) {
      right = (0, import_tools.getPayloadRemoveTilde)(
        "button",
        "bSubNext",
        effective === "page" ? import_icon_mapping.Icons.GetIcon("arrow-down-bold-outline") : import_icon_mapping.Icons.GetIcon("arrow-down-bold"),
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
  removeTempItems() {
    this.tempItems = void 0;
    this.tempItems = [];
  }
  async reset() {
    this.step = 0;
  }
  getMessage(message) {
    return (0, import_tools.getPayload)(
      (0, import_tools.getPayloadRemoveTilde)("entityUpd", message.headline),
      message.navigation,
      (0, import_tools.getPayloadArray)(message.options)
    );
  }
  onInternalCommand = async (_id, _state) => {
    throw new Error("Method not implemented.");
  };
  async delete() {
    this.unload = true;
    if (this.autoLoopTimeout) {
      this.adapter.clearTimeout(this.autoLoopTimeout);
      this.autoLoopTimeout = void 0;
    }
    if (this.arrowPageItem) {
      await this.arrowPageItem.delete();
      this.arrowPageItem = void 0;
    }
    await this.basePanel.statesControler.deletePageLoop(this.onInternalCommand);
    this.tempItems = void 0;
    await super.delete();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageMenu
});
//# sourceMappingURL=pageMenu.js.map
