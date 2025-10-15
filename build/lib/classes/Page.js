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
var Page_exports = {};
__export(Page_exports, {
  Page: () => Page,
  isMediaButtonActionType: () => isMediaButtonActionType
});
module.exports = __toCommonJS(Page_exports);
var convertColorScaleBest = __toESM(require("../types/function-and-const"));
var import_baseClassPage = require("./baseClassPage");
var import_pageItem = require("../pages/pageItem");
var import_tools = require("../const/tools");
var import_templateArray = require("../templates/templateArray");
var import_icon_mapping = require("../const/icon_mapping");
var import_Color = require("../const/Color");
class Page extends import_baseClassPage.BaseClassPage {
  card;
  id;
  lastCardCounter = 0;
  //protected overridePageItemsDpInit: string | RegExp = '';
  isScreensaver;
  hidden = false;
  /**
   * Direct reference to the parent page,
   * bypassing navigation logic.
   */
  directParentPage;
  /**
   * Direct reference to the child page,
   * bypassing navigation logic.
   */
  directChildPage;
  //readonly enums: string | string[];
  config;
  //config: Card['config'];
  constructor(card, pageItemsConfig, isScreensaver = false) {
    var _a;
    super(card, pageItemsConfig && pageItemsConfig.alwaysOn, pageItemsConfig && pageItemsConfig.pageItems);
    this.isScreensaver = isScreensaver;
    this.card = card.card;
    this.id = card.id;
    this.hidden = pageItemsConfig && "hidden" in pageItemsConfig ? !!pageItemsConfig.hidden : false;
    this.enums = pageItemsConfig && "enums" in pageItemsConfig && pageItemsConfig.enums ? pageItemsConfig.enums : "";
    this.device = pageItemsConfig && "device" in pageItemsConfig && pageItemsConfig.device ? pageItemsConfig.device : "";
    if (this.device) {
      card.dpInit = typeof card.dpInit === "string" ? card.dpInit.replace("#\xB0^\xB0#", this.device) : card.dpInit;
    }
    if (card.dpInit && typeof card.dpInit === "string") {
      const reg = (0, import_tools.getRegExp)(card.dpInit);
      if (reg) {
        card.dpInit = reg;
      }
    }
    this.dpInit = (_a = card.dpInit) != null ? _a : "";
    this.config = pageItemsConfig && pageItemsConfig.config;
  }
  /**
   * ...
   */
  async init() {
    var _a;
    if (this.pageItemConfig) {
      for (let a = 0; a < this.pageItemConfig.length; a++) {
        let options = this.pageItemConfig[a];
        if (options === void 0) {
          continue;
        }
        if (options.type === "text" && this && this.card === "cardThermo") {
          options.type = "button";
          options.role = "indicator";
        }
        options = await this.getItemFromTemplate(options);
        if (!options) {
          this.log.error(`Dont get a template for ${a} in ${this.name}`);
          continue;
        }
        options.dpInit = typeof options.dpInit === "string" && options.device ? options.dpInit.replace("#\xB0^\xB0#", options.device) : options.dpInit;
        if (options.dpInit && typeof options.dpInit === "string") {
          const reg = (0, import_tools.getRegExp)(options.dpInit, { startsWith: true });
          if (reg) {
            options.dpInit = reg;
          }
        }
        const dpInit = (_a = this.dpInit ? this.dpInit : options.dpInit) != null ? _a : "";
        const enums = this.enums ? this.enums : options.enums;
        if (!dpInit && !enums) {
        }
        options.data = dpInit || enums ? await this.basePanel.statesControler.getDataItemsFromAuto(
          dpInit,
          options.data,
          "appendix" in options ? options.appendix : void 0,
          this.enums ? this.enums : options.enums
        ) : options.data;
        options = structuredClone(options);
        if (options) {
          options.dpInit = dpInit;
        }
        this.pageItemConfig[a] = await this.initPageItems(options);
      }
    }
  }
  async initPageItems(item, overrideDpInit = "") {
    var _a;
    let options = item;
    if (options === void 0) {
      return void 0;
    }
    const dpInit = (_a = overrideDpInit || (this.dpInit ? this.dpInit : options.dpInit)) != null ? _a : "";
    const enums = this.enums ? this.enums : options.enums;
    options.data = dpInit || enums ? await this.basePanel.statesControler.getDataItemsFromAuto(
      dpInit,
      options.data,
      "appendix" in options ? options.appendix : void 0,
      this.enums ? this.enums : options.enums
    ) : options.data;
    options = JSON.parse(JSON.stringify(options));
    if (options) {
      options.dpInit = dpInit;
    }
    return options;
  }
  async getItemFromTemplate(options, subtemplate = "", loop = 0) {
    var _a, _b, _c, _d, _e;
    if ("template" in options && options.template) {
      const template = subtemplate ? import_templateArray.pageItemTemplates[subtemplate] : import_templateArray.pageItemTemplates[options.template];
      const name = options.template;
      if (!template) {
        this.log.error(`Dont find template ${options.template}`);
        return void 0;
      }
      if (template.adapter && typeof options.dpInit === "string" && !options.dpInit.includes(template.adapter) && typeof this.dpInit === "string" && !this.dpInit.includes(template.adapter)) {
        this.log.error(
          `Missing dbInit or dbInit not starts with${template.adapter} for template ${options.template}`
        );
        return void 0;
      }
      const newTemplate = structuredClone(template);
      delete newTemplate.adapter;
      if (options.type && options.type !== template.type && !(options.type == "button" && template.type == "text")) {
        this.log.error(`Type: ${String(options.type)} is not equal with ${template.type}`);
        return void 0;
      }
      const colorTrue = (options.color || {}).true;
      const colorFalse = (options.color || {}).false;
      const colorScale = (options.color || {}).scale;
      const iconTrue = (options.icon || {}).true;
      const iconFalse = (options.icon || {}).false;
      options.type = options.type || template.type;
      options.role = options.role || template.role;
      options = (0, import_tools.deepAssign)(newTemplate, options);
      if (template.template !== void 0) {
        if (loop > 10) {
          throw new Error(
            `Endless loop in getItemFromTemplate() detected! From ${template.template} for ${name}. Bye Bye`
          );
        }
        const o = await this.getItemFromTemplate(options, template.template, ++loop);
        if (o !== void 0) {
          options = o;
        } else {
          this.log.warn(`Dont get a template from ${template.template} for ${name}`);
        }
      }
      if (options.data) {
        options.data.icon = (_a = options.data.icon) != null ? _a : {};
        if (colorTrue) {
          options.data.icon.true = (_b = options.data.icon.true) != null ? _b : {};
          options.data.icon.true.color = colorTrue;
        }
        if (iconTrue) {
          options.data.icon.true = (_c = options.data.icon.true) != null ? _c : {};
          options.data.icon.true.value = iconTrue;
        }
        if (colorFalse) {
          options.data.icon.false = (_d = options.data.icon.false) != null ? _d : {};
          options.data.icon.false.color = colorFalse;
        }
        if (iconFalse) {
          options.data.icon.false = (_e = options.data.icon.false) != null ? _e : {};
          options.data.icon.false.value = iconFalse;
        }
        if (colorScale) {
          options.data.icon.scale = { type: "const", constVal: colorScale };
        }
      }
    }
    return options;
  }
  async onButtonEvent(event) {
    this.log.warn(`Event received but no handler! ${JSON.stringify(event)}`);
  }
  sendType(force) {
    let forceSend = force || false;
    let renderCurrentPage = false;
    switch (this.card) {
      //case 'cardBurnRec':
      case "cardChart":
      case "cardLChart":
      case "cardThermo":
        forceSend = true;
      //@disable-next-line no-fallthrough
      case "cardEntities":
      case "cardGrid":
      case "cardGrid2":
      case "cardGrid3":
      case "cardMedia":
      case "cardQR":
      case "cardAlarm":
      case "cardPower":
      case "screensaver":
      case "screensaver2":
      case "screensaver3":
      case "cardItemSpecial":
      case "cardSchedule":
      case "cardThermo2":
        renderCurrentPage = true;
        break;
      case "popupNotify":
      case "popupNotify2":
        renderCurrentPage = false;
        break;
      default:
        convertColorScaleBest.exhaustiveCheck(this.card);
        break;
    }
    if (forceSend || this.basePanel.lastCard !== this.card) {
      this.basePanel.lastSendTypeDate = Date.now();
      this.log.debug(`Register last send type ${this.card} block for ${this.basePanel.blockTouchEventsForMs}ms`);
      this.sendToPanel(`pageType~${this.card}`, renderCurrentPage);
    } else {
      if (this.lastCardCounter++ > 15) {
        this.lastCardCounter = 0;
        this.basePanel.lastSendTypeDate = Date.now();
        this.log.debug(
          `Register last send type ${this.card} block for ${this.basePanel.blockTouchEventsForMs}ms`
        );
        this.sendToPanel(`pageType~${this.card}`, renderCurrentPage);
      }
    }
    this.basePanel.lastCard = this.card;
  }
  async createPageItems(pageItemsConfig, ident = "") {
    const result = [];
    if (pageItemsConfig) {
      if (!Array.isArray(pageItemsConfig)) {
        pageItemsConfig = [pageItemsConfig];
      }
      for (let a = 0; a < pageItemsConfig.length; a++) {
        const config = {
          name: ident ? ident : `${this.name}|PI`,
          adapter: this.adapter,
          panel: this.basePanel,
          card: "cardItemSpecial",
          id: `${this.id}?${ident ? ident : a}`,
          parent: this
        };
        result[a] = await import_pageItem.PageItem.getPageItem(config, pageItemsConfig[a]);
      }
    }
    return result;
  }
  getNavigation(side) {
    if (this.directParentPage) {
      let left = "";
      let right = "";
      if (!side || side === "left") {
        left = (0, import_tools.getPayloadRemoveTilde)(
          "button",
          "bUp",
          import_icon_mapping.Icons.GetIcon("arrow-up-bold"),
          String(import_Color.Color.rgb_dec565(import_Color.Color.navParent)),
          "",
          ""
        );
      }
      if (!side || side === "right") {
        right = (0, import_tools.getPayload)("", "", "", "", "", "");
      }
      if (!side) {
        return (0, import_tools.getPayload)(left, right);
      }
      return side === "left" ? left : right;
    }
    return this.basePanel.navigation.buildNavigationString(side);
  }
  goLeft() {
    if (this.directParentPage) {
      void this.basePanel.setActivePage(this.directParentPage, false);
      return;
    }
    this.basePanel.navigation.goLeft();
  }
  goRight() {
    if (this.directParentPage) {
      return;
    }
    this.basePanel.navigation.goRight();
  }
  async onVisibilityChange(val) {
    if (val) {
      if (!this.pageItems || this.pageItems.length === 0) {
        this.pageItems = await this.createPageItems(this.pageItemConfig);
      }
      this.sendType();
      await this.update();
    } else {
      if (this.pageItems) {
        for (const item of this.pageItems) {
          item && await item.delete();
        }
        this.pageItems = [];
      }
    }
  }
  getdpInitForChild() {
    return "";
  }
  setLastPage(_p) {
  }
  removeLastPage(_p) {
  }
  async update() {
    this.adapter.log.warn(
      `<- instance of [${Object.getPrototypeOf(this)}] update() is not defined or call super.onStateTrigger()`
    );
  }
  /**
   * Handles a popup request.
   *
   * @param id - The ID of the item.
   * @param popup - The popup type.
   * @param action - The action to be performed.
   * @param value - The value associated with the action.
   * @param _event - The incoming event.
   * @returns A promise that resolves when the popup request is handled.
   */
  async onPopupRequest(id, popup, action, value, _event = null) {
    if (!this.pageItems || id == "") {
      this.log.debug(
        `onPopupRequest: No pageItems or id this is only a warning if u used a pageitem except: 'arrow': ${id}`
      );
      return;
    }
    let item;
    if (isNaN(Number(id)) && typeof id === "string") {
      this.log.error(
        `onPopupRequest: id should be a number but is a string: ${id}. Page name: ${this.name}, Page id: ${this.id}, Page card: ${this.card}`
      );
    } else {
      const i = typeof id === "number" ? id : parseInt(id);
      item = this.pageItems[i];
    }
    if (!item) {
      return;
    }
    let msg = null;
    if (action && value !== void 0 && await item.onCommand(action, value)) {
      return;
    } else if (convertColorScaleBest.isPopupType(popup) && action !== "bExit") {
      this.basePanel.lastCard = "";
      msg = await item.GeneratePopup(popup);
    }
    if (msg !== null) {
      this.sleep = true;
      this.sendToPanel(msg, false);
    }
  }
  async delete() {
    this.unload = true;
    if (this.directChildPage) {
      await this.directChildPage.delete();
      this.directChildPage = void 0;
    }
    if (this.directParentPage) {
      this.directParentPage.directChildPage = void 0;
      this.directParentPage = void 0;
    }
    if (this.pageItems) {
      for (const item of this.pageItems) {
        item && await item.delete();
      }
    }
    this.pageItems = [];
    this.pageItemConfig = [];
    await super.delete();
  }
}
function isMediaButtonActionType(F) {
  switch (F) {
    case "media-back":
    case "media-pause":
    case "media-next":
    case "media-shuffle":
    case "volumeSlider":
    case "mode-speakerlist":
    case "mode-playlist":
    case "mode-tracklist":
    case "mode-repeat":
    case "mode-equalizer":
    case "mode-seek":
    case "mode-crossfade":
    case "mode-favorites":
    case "mode-insel":
    case "media-OnOff":
    case "button":
      return true;
  }
  console.error(`${F} isMediaButtonActionType === false`);
  return false;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Page,
  isMediaButtonActionType
});
//# sourceMappingURL=Page.js.map
