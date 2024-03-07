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
var Page_exports = {};
__export(Page_exports, {
  Page: () => Page,
  isMediaButtonActionType: () => isMediaButtonActionType
});
module.exports = __toCommonJS(Page_exports);
var import_states_controller = require("../controller/states-controller");
var import_types = require("../types/types");
var import_pageItem = require("../pages/pageItem");
var import_card = require("../templates/card");
var import_tools = require("../const/tools");
var import_templateArray = require("../templates/templateArray");
class Page extends import_states_controller.BaseClassPage {
  card;
  id;
  //readonly enums: string | string[];
  config;
  //config: Card['config'];
  constructor(card, pageItemsConfig) {
    var _a;
    super(card, pageItemsConfig && pageItemsConfig.pageItems);
    this.card = card.card;
    this.id = card.id;
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
    var _a, _b;
    if (this.pageItemConfig) {
      for (let a = 0; a < this.pageItemConfig.length; a++) {
        let options = this.pageItemConfig[a];
        if (options === void 0)
          continue;
        options = await this.getItemFromTemplate(options);
        if (!options)
          continue;
        options.dpInit = typeof options.dpInit === "string" && options.device ? options.dpInit.replace("#\xB0^\xB0#", options.device) : options.dpInit;
        if (options.dpInit && typeof options.dpInit === "string") {
          const reg = (0, import_tools.getRegExp)(options.dpInit);
          if (reg) {
            options.dpInit = reg;
          }
        }
        const dpInit = (_a = this.dpInit ? this.dpInit : options.dpInit) != null ? _a : "";
        const enums = this.enums ? this.enums : options.enums;
        options.data = dpInit || enums ? await this.panel.statesControler.getDataItemsFromAuto(
          (_b = this.dpInit ? this.dpInit : options.dpInit) != null ? _b : "",
          options.data,
          "appendix" in options ? options.appendix : void 0,
          this.enums ? this.enums : options.enums
        ) : options.data;
        this.pageItemConfig[a] = options;
      }
    }
  }
  async getItemFromTemplate(options, subtemplate = "", loop = 0) {
    if ("template" in options && options.template) {
      const template = subtemplate ? import_templateArray.pageItemTemplates[subtemplate] : import_templateArray.pageItemTemplates[options.template];
      const name = options.template;
      if (!template) {
        this.log.error("Dont find template " + options.template);
        return void 0;
      }
      if (template.adapter && typeof options.dpInit === "string" && !options.dpInit.includes(template.adapter) && typeof this.dpInit === "string" && !this.dpInit.includes(template.adapter)) {
        this.log.error(
          "Missing dbInit or dbInit not starts with" + template.adapter + " for template " + options.template
        );
        return void 0;
      }
      const newTemplate = structuredClone(template);
      delete newTemplate.adapter;
      if (options.type && options.type !== template.type) {
        this.log.error("Type: " + options.type + "is not equal with " + template.type);
        return void 0;
      }
      options.type = template.type;
      options.role = template.role;
      if (options.appendix) {
        this.log.debug("c");
      }
      options = (0, import_tools.deepAssign)(newTemplate, options);
      if (template.template !== void 0) {
        if (loop > 10) {
          throw new Error(
            `Endless loop in getItemFromTemplate() detected! From ${template.template} for ${name}. Bye Bye`
          );
        }
        const o = await this.getItemFromTemplate(options, template.template, ++loop);
        if (o !== void 0)
          options = o;
        else
          this.log.warn(`Dont get a template from ${template.template} for ${name}`);
      }
    }
    return options;
  }
  async onButtonEvent(event) {
    this.log.warn(`Event received but no handler! ${JSON.stringify(event)}`);
  }
  sendType() {
    if (this.panel.lastCard !== this.card)
      this.sendToPanel(`pageType~${this.card}`);
    this.panel.lastCard = this.card;
  }
  static getPage(config, that) {
    if ("template" in config && config.template) {
      const template = import_card.cardTemplates[config.template];
      if (!template) {
        that.log.error("dont find template " + config.template);
        return config;
      }
      if (config.dpInit && typeof config.dpInit === "string") {
        const reg = (0, import_tools.getRegExp)(config.dpInit);
        if (reg) {
          config.dpInit = reg;
        }
        if (template.adapter && typeof config.dpInit === "string" && !config.dpInit.startsWith(template.adapter)) {
          return config;
        }
      }
      const newTemplate = structuredClone(template);
      delete newTemplate.adapter;
      config = (0, import_tools.deepAssign)(newTemplate, config);
    }
    return config;
  }
  async createPageItems() {
    if (this.pageItemConfig) {
      this.pageItems = [];
      for (let a = 0; a < this.pageItemConfig.length; a++) {
        const config = {
          name: "PI",
          adapter: this.adapter,
          panel: this.panel,
          panelSend: this.panelSend,
          card: "cardItemSpecial",
          id: `${this.id}?${a}`,
          parent: this
        };
        this.pageItems[a] = await import_pageItem.PageItem.getPageItem(config, this.pageItemConfig[a]);
      }
    }
  }
  goLeft() {
    this.panel.navigation.goLeft();
  }
  goRight() {
    this.panel.navigation.goRight();
  }
  async onVisibilityChange(val) {
    if (val) {
      await this.createPageItems();
      await this.sendType();
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
  setLastPage(_p) {
  }
  removeLastPage(_p) {
  }
  getNavigation() {
    return this.panel.navigation.buildNavigationString();
  }
  async update() {
    this.adapter.log.warn(
      `<- instance of [${Object.getPrototypeOf(this)}] update() is not defined or call super.onStateTrigger()`
    );
  }
  async onPopupRequest(id, popup, action, value, _event = null) {
    if (!this.pageItems)
      return;
    const i = typeof id === "number" ? id : parseInt(id);
    const item = this.pageItems[i];
    if (!item)
      return;
    let msg = null;
    if (action && value !== void 0 && await item.onCommand(action, value)) {
      return;
    } else if ((0, import_types.isPopupType)(popup) && action !== "bExit") {
      msg = await item.GeneratePopup(popup);
    }
    if (msg !== null) {
      this.sleep = true;
      this.sendToPanel(msg);
    }
  }
  async delete() {
    await super.delete();
    this.pageItems = [];
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
