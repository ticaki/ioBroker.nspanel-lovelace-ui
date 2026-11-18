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
var navigation_locked_exports = {};
__export(navigation_locked_exports, {
  LOCKED_PAGE_ICON: () => LOCKED_PAGE_ICON,
  LOCKED_PAGE_NOTIFY_ID: () => LOCKED_PAGE_NOTIFY_ID,
  LOCKED_PAGE_TEXT_KEY: () => LOCKED_PAGE_TEXT_KEY,
  lockedPageFont: () => lockedPageFont,
  lockedPageNotification: () => lockedPageNotification
});
module.exports = __toCommonJS(navigation_locked_exports);
var import_Color = require("../const/Color");
var import_text_width = require("../const/text-width");
const LOCKED_PAGE_NOTIFY_ID = "navigationPageLocked";
const LOCKED_PAGE_TEXT_KEY = "navigation_page_locked";
const LOCKED_PAGE_ICON = "cancel";
const FONTS = [3, 2, 0];
function lockedPageFont(text, model) {
  var _a;
  const codePoints = Array.from(text, (ch) => {
    var _a2;
    return (_a2 = ch.codePointAt(0)) != null ? _a2 : 0;
  });
  return (_a = FONTS.find((font) => codePoints.every((cp) => (0, import_text_width.hasGlyph)(cp, font, model)))) != null ? _a : 3;
}
function lockedPageNotification(text, model) {
  return {
    id: LOCKED_PAGE_NOTIFY_ID,
    priority: 50,
    type: "information",
    global: false,
    alwaysOn: false,
    headline: "",
    text,
    textSize: String(lockedPageFont(text, model)),
    buttonLeft: "",
    buttonMid: "",
    buttonRight: "",
    icon: LOCKED_PAGE_ICON,
    iconColor: import_Color.Color.Red,
    largeIcon: true,
    buzzer: false
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LOCKED_PAGE_ICON,
  LOCKED_PAGE_NOTIFY_ID,
  LOCKED_PAGE_TEXT_KEY,
  lockedPageFont,
  lockedPageNotification
});
//# sourceMappingURL=navigation-locked.js.map
