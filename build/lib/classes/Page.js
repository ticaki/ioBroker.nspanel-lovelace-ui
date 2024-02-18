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
          this.pageItems[a] = import_pageItem.PageItem.getPageItem(config, this.pageItemConfig[a], this);
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
