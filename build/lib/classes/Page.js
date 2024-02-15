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
class Page extends import_states_controller.BaseClassPage {
  card;
  id;
  uniqueID;
  dpInit = "";
  constructor(card, pageItemsConfig) {
    super(card, pageItemsConfig);
    this.card = card.card;
    this.id = card.id;
    this.uniqueID = card.uniqueID;
  }
  async init() {
  }
  async onButtonEvent(event) {
    this.log.warn(`Event received but no handler! ${JSON.stringify(event)}`);
  }
  sendType() {
    this.sendToPanel(`pageType~${this.card}`);
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
          this.pageItems[a] = new import_pageItem.PageItem(config, this.pageItemConfig[a]);
          await this.pageItems[a].init();
        }
      }
      this.sendType();
      this.update();
    } else {
      if (this.pageItems) {
        for (const item of this.pageItems) {
          await item.delete();
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
    if ((0, import_types.isPopupType)(popup) && action !== "bExit") {
      msg = await item.GeneratePopup(popup);
    } else if (action && value !== void 0) {
      item.onCommand(action, value);
      return;
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
