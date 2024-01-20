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
var types_d_exports = {};
__export(types_d_exports, {
  checkPageType: () => checkPageType,
  checkSortedPlayerType: () => checkSortedPlayerType,
  isEventMethod: () => isEventMethod,
  isMediaOptional: () => isMediaOptional,
  isPageMediaItem: () => isPageMediaItem,
  isPageThermoItem: () => isPageThermoItem,
  isPlayerWithMediaDevice: () => isPlayerWithMediaDevice,
  isPopupType: () => isPopupType
});
module.exports = __toCommonJS(types_d_exports);
const ArrayPlayerTypeWithMediaDevice = ["alexa2", "sonos", "squeezeboxrpc"];
const ArrayPlayerTypeWithOutMediaDevice = ["spotify-premium", "volumio", "bosesoundtouch"];
function isPlayerWithMediaDevice(F) {
  return ArrayPlayerTypeWithMediaDevice.indexOf(F) != -1;
}
function checkSortedPlayerType(F) {
  const test = F;
  if (test == F) {
  }
}
function isMediaOptional(F) {
  switch (F) {
    case "seek":
    case "crossfade":
    case "speakerlist":
    case "playlist":
    case "tracklist":
    case "equalizer":
    case "repeat":
    case "favorites":
      return true;
    default:
      return false;
  }
}
function isEventMethod(F) {
  switch (F) {
    case "startup":
    case "sleepReached":
    case "pageOpenDetail":
    case "buttonPress2":
    case "renderCurrentPage":
    case "button1":
    case "button2":
      return true;
    default:
      log(`Please report to developer: Unknown EventMethod: ${F} `, "warn");
      return false;
  }
}
function isPopupType(F) {
  switch (F) {
    case "popupFan":
    case "popupInSel":
    case "popupLight":
    case "popupLightNew":
    case "popupNotify":
    case "popupShutter":
    case "popupThermo":
    case "popupTimer":
      return true;
    default:
      log(`Please report to developer: Unknown PopupType: ${F} `, "warn");
      return false;
  }
}
function checkPageType(F, A) {
  A.type = F;
}
function isPageMediaItem(F) {
  return "adapterPlayerInstance" in F;
}
function isPageThermoItem(F) {
  return "popupThermoMode1" in F;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkPageType,
  checkSortedPlayerType,
  isEventMethod,
  isMediaOptional,
  isPageMediaItem,
  isPageThermoItem,
  isPlayerWithMediaDevice,
  isPopupType
});
//# sourceMappingURL=types-d.js.map
