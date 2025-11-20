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
  /**
   * Constructs a new Page instance.
   * Initializes page properties, processes device and dpInit patterns, and sets up the configuration.
   * This is the base constructor for all page types (Grid, Media, Entities, etc.).
   *
   * @param card - Page interface containing card type, ID, and data point initialization pattern
   * @param pageItemsConfig - Optional page configuration including items, enums, device references
   * @param isScreensaver - Whether this page is a screensaver (default: false)
   */
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
   * Initializes the page and all its PageItems.
   * Processes templates, resolves data point patterns (dpInit/enums), and creates PageItem instances.
   * Must be called after construction and before the page is displayed.
   * Derived classes may override this to add page-specific initialization logic.
   *
   * @returns Promise that resolves when all PageItems are initialized
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
  /**
   * Initializes a single PageItem configuration.
   * Resolves data items from auto-discovery (dpInit patterns or enums) and clones the configuration.
   * Used during page initialization and when dynamically creating PageItems.
   *
   * @param item - PageItem configuration to initialize
   * @param overrideDpInit - Optional override for data point initialization pattern
   * @returns Promise resolving to the initialized PageItem configuration, or undefined if invalid
   */
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
  /**
   * Resolves a PageItem configuration from its template definition.
   * Templates provide pre-configured settings for common device types (lights, shutters, etc.).
   * Supports template inheritance and deep merging of color/icon overrides.
   * Validates adapter compatibility and type consistency.
   *
   * @param options - PageItem configuration with template reference
   * @param subtemplate - Optional sub-template identifier for recursive resolution
   * @param loop - Recursion depth counter to prevent infinite loops (max 10)
   * @returns Promise resolving to the merged configuration, or undefined if template not found/invalid
   */
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
  /**
   * Handles incoming button events from the NSPanel.
   * Base implementation logs a warning; derived classes should override this to handle
   * page-specific button interactions (navigation, media controls, alarm actions, etc.).
   *
   * @param event - The incoming event from the panel containing button action and value
   */
  async onButtonEvent(event) {
    this.log.warn(`Event received but no handler! ${JSON.stringify(event)}`);
  }
  /**
   * Sends the page type command to the NSPanel to prepare the display.
   * Determines whether to force-send based on card type and panel state.
   * Some card types (Chart, Thermo) always force-send to ensure correct rendering.
   * Implements throttling to avoid redundant type commands (sends every 15th call if unchanged).
   *
   * @param force - Optional flag to force sending the pageType command regardless of cache
   */
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
      this.log.debug(
        `Register last send type ${this.basePanel.name}-${this.card} block for ${this.basePanel.blockTouchEventsForMs}ms`
      );
      this.sendToPanel(`pageType~${this.card}`, renderCurrentPage);
    } else {
      if (this.lastCardCounter++ > 31) {
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
  /**
   * Creates PageItem instances from configuration.
   * Constructs PageItem objects for interactive elements (lights, buttons, shutters, etc.).
   * Used during page initialization and when dynamically adding items to a page.
   *
   * @param pageItemsConfig - Single or array of PageItem configurations
   * @param ident - Optional identifier prefix for the PageItems (used in naming)
   * @returns Promise resolving to array of created PageItem instances (may contain undefined for invalid configs)
   */
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
  /**
   * Generates the navigation payload string for the NSPanel.
   * If a direct parent page exists, shows an "up" arrow for back navigation.
   * Otherwise delegates to the panel's navigation controller for normal nav behavior.
   *
   * @param side - Optional side to generate navigation for ('left' or 'right'); if omitted, returns both
   * @returns Formatted navigation payload string for MQTT transmission
   */
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
  /**
   * Handles left navigation button press.
   * If a direct parent page exists, navigates to it (for popup/child pages).
   * Otherwise delegates to the panel's navigation controller (history-based navigation).
   *
   * @param short - Whether the navigation is a short press (true) or long press (false)
   */
  goLeft(short) {
    if (this.directParentPage) {
      void this.basePanel.setActivePage(this.directParentPage, false);
      return;
    }
    this.basePanel.navigation.goLeft(short);
  }
  /**
   * Handles right navigation button press.
   * If a direct parent page exists, does nothing (right nav disabled for child pages).
   * Otherwise delegates to the panel's navigation controller (forward navigation).
   *
   * @param short - Whether the navigation is a short press (true) or long press (false)
   */
  goRight(short) {
    if (this.directParentPage) {
      return;
    }
    this.basePanel.navigation.goRight(short);
  }
  /**
   * Called when the page becomes visible or hidden.
   * When visible: creates PageItems, sends page type, and triggers initial update.
   * When hidden: deletes all PageItems to free resources and unsubscribe from states.
   * Derived classes should call super.onVisibilityChange() if overriding.
   *
   * @param val - true if page is becoming visible, false if being hidden
   */
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
  /**
   * Returns the data point initialization pattern for child pages.
   * Base implementation returns empty string; derived classes (like PageMenu)
   * override this to pass dpInit patterns to dynamically created child pages.
   *
   * @returns Data point pattern (string or RegExp) for child page initialization
   */
  getdpInitForChild() {
    return "";
  }
  /**
   * Registers a page as the last active page.
   * Base implementation does nothing; derived classes (like PageMenu with pagination)
   * override this to track navigation history or maintain parent-child relationships.
   *
   * @param _p - The page to register as last active (may be undefined)
   */
  setLastPage(_p) {
  }
  /**
   * Removes a page from the last active page tracking.
   * Base implementation does nothing; derived classes (like PageMenu)
   * override this to clean up navigation history or parent-child relationships.
   *
   * @param _p - The page to remove from tracking (may be undefined)
   */
  removeLastPage(_p) {
  }
  getLastPage() {
    return void 0;
  }
  /**
   * Updates the page content and sends data to the NSPanel.
   * Base implementation logs a warning; all derived page classes MUST override this
   * to implement page-specific rendering logic (e.g., grid items, media player state, chart data).
   * Called when the page becomes visible or when subscribed states change.
   */
  async update() {
    this.adapter.log.warn(
      `<- instance of [${Object.getPrototypeOf(this)}] update() is not defined or call super.onStateTrigger()`
    );
  }
  /**
   * Handles popup requests from the NSPanel (e.g., light color picker, shutter position).
   * Routes the request to the appropriate PageItem, executes commands, or generates popup payloads.
   * Called when user interacts with a PageItem that triggers a popup dialog.
   *
   * @param id - The PageItem index or identifier
   * @param popup - The type of popup to display (e.g., 'popupLight', 'popupShutter')
   * @param action - The button action performed in the popup (e.g., 'OnOff', 'brightnessSlider')
   * @param value - The value from the action (e.g., slider position, color RGB)
   * @param _event - The raw incoming event from the panel (optional)
   * @returns Promise that resolves when popup is handled and sent to panel
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
  async onButtonPress3(id, _popup, action, value, _event = null) {
    if (!this.pageItems || id == "") {
      this.log.debug(
        `onPopupRequest: No pageItems or id this is only a warning if u used a pageitem except: 'arrow': ${id}`
      );
      return false;
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
      return false;
    }
    return !!action && value !== void 0 && await item.onCommandLongPress(action, value);
  }
  /**
   * Cleans up the page and all its resources.
   * Recursively deletes child/parent page references, destroys all PageItems,
   * and calls the base class cleanup (unsubscribes states, clears timers).
   * Must be called when a page is removed from navigation or the adapter unloads.
   *
   * @returns Promise that resolves when cleanup is complete
   */
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
