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
var screensaver_info_font_exports = {};
__export(screensaver_info_font_exports, {
  SCREENSAVER_INFO_FONT_DEFAULT: () => SCREENSAVER_INFO_FONT_DEFAULT,
  SCREENSAVER_INFO_FONT_STATES: () => SCREENSAVER_INFO_FONT_STATES,
  screensaverInfoFont: () => screensaverInfoFont
});
module.exports = __toCommonJS(screensaver_info_font_exports);
const SCREENSAVER_INFO_FONT_DEFAULT = 2;
const SCREENSAVER_INFO_FONT_STATES = {
  0: "24px text",
  1: "32px icons+text",
  2: "32px text",
  3: "48px icons+text",
  4: "80px bold icons+text",
  5: "128px bold ASCII"
};
function isScreensaverInfoFont(n) {
  return n === 0 || n === 1 || n === 2 || n === 3 || n === 4 || n === 5;
}
function screensaverInfoFont(value) {
  let n = Number.NaN;
  if (typeof value === "number") {
    n = value;
  } else if (typeof value === "string" && value.trim() !== "") {
    n = Number(value);
  }
  return isScreensaverInfoFont(n) ? n : SCREENSAVER_INFO_FONT_DEFAULT;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SCREENSAVER_INFO_FONT_DEFAULT,
  SCREENSAVER_INFO_FONT_STATES,
  screensaverInfoFont
});
//# sourceMappingURL=screensaver-info-font.js.map
