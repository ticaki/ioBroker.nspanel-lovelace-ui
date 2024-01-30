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
var types_exports = {};
__export(types_exports, {
  SerialTypeArray: () => SerialTypeArray,
  buildNSPanelString: () => buildNSPanelString,
  checkSortedPlayerType: () => checkSortedPlayerType,
  isColorEntryType: () => isColorEntryType,
  isEventMethod: () => isEventMethod,
  isEventType: () => isEventType,
  isIconScaleElement: () => isIconScaleElement,
  isPageMedia: () => isPageMedia,
  isPageMediaItem: () => isPageMediaItem,
  isPagePower: () => isPagePower,
  isPageThermoItem: () => isPageThermoItem,
  isPlayerWithMediaDevice: () => isPlayerWithMediaDevice,
  isPopupType: () => isPopupType,
  isRGB: () => isRGB
});
module.exports = __toCommonJS(types_exports);
function buildNSPanelString(...tokens) {
  return tokens.join("~");
}
const ArrayPlayerTypeWithMediaDevice = ["alexa2", "sonos", "squeezeboxrpc"];
const ArrayPlayerTypeWithOutMediaDevice = ["spotify-premium", "volumio", "bosesoundtouch"];
function isPlayerWithMediaDevice(F) {
  return ArrayPlayerTypeWithMediaDevice.indexOf(F) != -1;
}
function checkSortedPlayerType(F) {
  return F;
}
function isRGB(F) {
  return typeof F == "object" && "red" in F && "blue" in F && "green" in F;
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
      throw new Error(`Please report to developer: Unknown EventMethod: ${F} `);
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
      console.info(`Unknown PopupType: ${F} `);
      return false;
  }
}
function isPageMediaItem(F) {
  return "adapterPlayerInstance" in F;
}
function isPageThermoItem(F) {
  return "popupThermoMode1" in F;
}
function isPageMedia(F) {
  return F.type == "cardMedia";
}
function isPagePower(F) {
  return F.type == "cardPower";
}
const SerialTypeArray = [
  "light",
  "shutter",
  "delete",
  "text",
  "button",
  "switch",
  "number",
  "input_sel",
  "timer",
  "fan"
];
function isColorEntryType(F) {
  if ("true" in F && "false" in F && "scale" in F)
    return true;
  return false;
}
function isIconScaleElement(F) {
  return F && "val_min" in F && "val_max" in F;
}
function isEventType(F) {
  return ["event"].indexOf(F) != -1;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SerialTypeArray,
  buildNSPanelString,
  checkSortedPlayerType,
  isColorEntryType,
  isEventMethod,
  isEventType,
  isIconScaleElement,
  isPageMedia,
  isPageMediaItem,
  isPagePower,
  isPageThermoItem,
  isPlayerWithMediaDevice,
  isPopupType,
  isRGB
});
//# sourceMappingURL=types.js.map
