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
  uniqueID;
  config;
  dpInit = "";
  constructor(card, pageItemsConfig) {
    var _a;
    super(card, pageItemsConfig && pageItemsConfig.pageItems);
    this.card = card.card;
    this.id = card.id;
    this.uniqueID = card.uniqueID;
    this.dpInit = (_a = card.dpInit) != null ? _a : "";
    this.config = pageItemsConfig && pageItemsConfig.config;
  }
  async init() {
    var _a;
    if (this.pageItemConfig) {
      for (let a = 0; a < this.pageItemConfig.length; a++) {
        let options = this.pageItemConfig[a];
        if (options === void 0)
          continue;
        options = await this.getItemFromTemplate(options);
        if (!options)
          continue;
        const dpInit = (_a = this.dpInit ? this.dpInit : options.dpInit) != null ? _a : "";
        options.data = dpInit ? await this.panel.statesControler.getDataItemsFromAuto(dpInit, options.data) : options.data;
        this.pageItemConfig[a] = options;
      }
    }
  }
  async getItemFromTemplate(options, subTemplate = "", loop = 0) {
    if ("template" in options && options.template) {
      let index = -1;
      let template;
      const n = loop === 0 ? options.template : subTemplate;
      if (!n)
        return void 0;
      index = import_templateArray.pageItemTemplates.findIndex((a) => a.template === n);
      if (index !== -1)
        template = import_templateArray.pageItemTemplates[index];
      if (index === -1 || !template) {
        this.log.error("Dont find template " + options.template);
        return void 0;
      }
      if (template.adapter && !options.dpInit.startsWith(template.adapter) && !this.dpInit.startsWith(template.adapter)) {
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
      options = (0, import_tools.deepAssign)(newTemplate, options);
      if (template.subTemplate !== void 0) {
        if (loop > 10) {
          throw new Error(
            `Endless loop in getItemFromTemplate() detected! From ${template.subTemplate} for ${template.template}. Bye Bye`
          );
        }
        const o = await this.getItemFromTemplate(options, template.subTemplate, ++loop);
        if (o !== void 0)
          options = o;
        else
          this.log.warn(`Dont get a template from ${template.subTemplate} for ${template.template}`);
      }
    }
    return options;
  }
  async onButtonEvent(event) {
    this.log.warn(`Event received but no handler! ${JSON.stringify(event)}`);
  }
  sendType() {
    this.sendToPanel(`pageType~${this.card}`);
  }
  static getPage(config, that) {
    if ("template" in config && config.template) {
      let index = -1;
      let template;
      for (const i of [import_card.cardTemplates]) {
        index = i.findIndex((a) => a.template === config.template);
        if (index !== -1) {
          template = i[index];
          break;
        }
      }
      if (index === -1 || !template) {
        that.log.error("dont find template " + config.template);
        return config;
      }
      if (template.adapter && !config.dpInit.startsWith(template.adapter)) {
        return config;
      }
      const newTemplate = structuredClone(template);
      delete newTemplate.adapter;
      if (config.card && config.card !== template.card) {
        that.log.error(config.card + "is not equal with " + template.card);
        return config;
      }
      config = (0, import_tools.deepAssign)(newTemplate, config);
    }
    return config;
  }
  async onVisibilityChange(val) {
    if (val) {
      if (!this.pageItems && this.pageItemConfig) {
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
          this.pageItems[a] = import_pageItem.PageItem.getPageItem(config, this.pageItemConfig[a]);
          this.pageItems[a] && await this.pageItems[a].init();
        }
      }
      this.sendType();
      this.update();
    } else {
      if (this.pageItems) {
        for (const item of this.pageItems) {
          item && await item.delete();
        }
        this.pageItems = void 0;
      }
    }
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
