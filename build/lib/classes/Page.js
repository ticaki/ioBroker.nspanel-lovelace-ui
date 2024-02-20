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
var import_light = require("../templates/light");
var import_shutter = require("../templates/shutter");
var import_text = require("../templates/text");
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
    if (this.pageItemConfig) {
      for (let a = 0; a < this.pageItemConfig.length; a++) {
        const options2 = this.pageItemConfig[a];
        if (options2 === void 0)
          continue;
        if ("template" in options2 && options2.template) {
          let index = -1;
          let template;
          for (const i of [import_text.textTemplates, import_shutter.shutterTemplates, import_light.lightTemplates]) {
            index = i.findIndex((a2) => a2.template === options2.template);
            if (index !== -1) {
              template = i[index];
              break;
            }
          }
          if (index === -1 || !template) {
            this.log.error("Dont find template " + options2.template);
            this.pageItemConfig[a] = void 0;
            continue;
          }
          if (template.adapter && !options2.dpInit.startsWith(template.adapter) && !this.dpInit.startsWith(template.adapter)) {
            this.log.error(
              "Missing dbInit or dbInit not starts with" + template.adapter + " for template " + options2.template
            );
            this.pageItemConfig[a] = void 0;
            continue;
          }
          const newTemplate = structuredClone(template);
          delete newTemplate.adapter;
          if (options2.type && options2.type !== template.type) {
            this.log.error("Type: " + options2.type + "is not equal with " + template.type);
            this.pageItemConfig[a] = void 0;
            continue;
          }
          options2.type = template.type;
          options2.role = template.role;
          this.pageItemConfig[a] = (0, import_tools.deepAssign)(newTemplate, options2);
        }
      }
    }
  }
  async onButtonEvent(event) {
    this.log.warn(`Event received but no handler! ${JSON.stringify(event)}`);
  }
  sendType() {
    this.sendToPanel(`pageType~${this.card}`);
  }
  static getPage(config2, that) {
    if ("template" in config2 && config2.template) {
      let index = -1;
      let template;
      for (const i of [import_card.cardTemplates]) {
        index = i.findIndex((a) => a.template === config2.template);
        if (index !== -1) {
          template = i[index];
          break;
        }
      }
      if (index === -1 || !template) {
        that.log.error("dont find template " + config2.template);
        return config2;
      }
      if (template.adapter && !config2.dpInit.startsWith(template.adapter)) {
        return config2;
      }
      const newTemplate = structuredClone(template);
      delete newTemplate.adapter;
      if (config2.card && config2.card !== template.card) {
        that.log.error(config2.card + "is not equal with " + template.card);
        return config2;
      }
      config2 = (0, import_tools.deepAssign)(newTemplate, config2);
    }
    return config2;
  }
  async onVisibilityChange(val) {
    if (val) {
      if (!this.pageItems && this.pageItemConfig) {
        this.pageItems = [];
        for (let a = 0; a < this.pageItemConfig.length; a++) {
          const config2 = {
            name: "PI",
            adapter: this.adapter,
            panel: this.panel,
            panelSend: this.panelSend,
            card: "cardItemSpecial",
            id: `${this.id}?${a}`,
            parent: this
          };
          this.pageItems[a] = import_pageItem.PageItem.getPageItem(config2, this.pageItemConfig[a]);
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
    this.log.debug(`Trigger from popupThermo 1 `);
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
