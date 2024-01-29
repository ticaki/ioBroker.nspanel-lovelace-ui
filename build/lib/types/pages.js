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
var pages_exports = {};
__export(pages_exports, {
  isPageRole: () => isPageRole
});
module.exports = __toCommonJS(pages_exports);
function isPageRole(F) {
  switch (F) {
    case "button.play":
    case "button.pause":
    case "button.next":
    case "button.prev":
    case "button.stop":
    case "button.volume.up":
    case "button.volume.down":
    case "media.seek":
    case "media.mode.shuffle":
    case "media.mode.repeat":
    case "media.state":
    case "media.artist":
    case "media.album":
    case "media.title":
    case "media.duration":
    case "media.elapsed.text":
    case "media.elapsed":
    case "media.mute":
    case "level.volume":
    case "media.playlist":
      return true;
    default:
      return false;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isPageRole
});
//# sourceMappingURL=pages.js.map
