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
  PageItem: () => PageItem,
  isMediaButtonActionType: () => isMediaButtonActionType,
  messageItemDefault: () => messageItemDefault
});
module.exports = __toCommonJS(Page_exports);
var import_library = require("../classes/library");
var import_panel_message = require("../controller/panel-message");
const messageItemDefault = {
  type: "input_sel",
  intNameEntity: "",
  icon: "",
  iconColor: "",
  displayName: "",
  optionalValue: ""
};
class Page extends import_panel_message.BaseClassPanelSend {
  card;
  id;
  panel;
  constructor(card) {
    super(card);
    this.card = card.card;
    this.id = card.id;
    this.panel = card.panel;
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
      this.sendType();
      this.update();
    }
  }
  async update() {
    this.adapter.log.warn(
      `<- instance of [${Object.getPrototypeOf(this)}] update() is not defined or call super.onStateTrigger()`
    );
  }
  getItemMesssage(msg) {
    var _a, _b, _c, _d, _e, _f;
    if (!msg || !msg.intNameEntity || !msg.type)
      return "~~~~~";
    const id = [];
    if (msg.mainId)
      id.push(msg.mainId);
    if (msg.subId)
      id.push(msg.subId);
    if (msg.intNameEntity)
      id.push(msg.intNameEntity);
    return this.getPayload(
      (_a = msg.type) != null ? _a : messageItemDefault.type,
      (_b = id.join("?")) != null ? _b : messageItemDefault.intNameEntity,
      (_c = msg.icon) != null ? _c : messageItemDefault.icon,
      (_d = msg.iconColor) != null ? _d : messageItemDefault.iconColor,
      (_e = msg.displayName) != null ? _e : messageItemDefault.displayName,
      (_f = msg.optionalValue) != null ? _f : messageItemDefault.optionalValue
    );
  }
}
class PageItem extends import_library.BaseClass {
  config;
  pageItems = [];
  constructor(adapter, options) {
    super(adapter, "Page");
    this.config = options;
  }
  async init() {
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
  PageItem,
  isMediaButtonActionType,
  messageItemDefault
});
//# sourceMappingURL=Page.js.map
