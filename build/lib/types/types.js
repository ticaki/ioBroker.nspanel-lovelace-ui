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
  buildNSPanelString: () => buildNSPanelString,
  checkSortedPlayerType: () => checkSortedPlayerType,
  convertToEvent: () => convertToEvent,
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
function convertToEvent(msg) {
  var _a, _b, _c;
  msg = (JSON.parse(msg) || {}).CustomRecv;
  if (msg === void 0)
    return null;
  const temp = msg.split(",");
  if (!isEventType(temp[0]))
    return null;
  if (!isEventMethod(temp[1]))
    return null;
  const arr = String(temp[3]).split("?");
  if (arr[2])
    return {
      type: temp[0],
      method: temp[1],
      page: parseInt(arr[0]),
      subPage: parseInt(arr[1]),
      command: isButtonActionType(arr[2]) ? arr[2] : "",
      mode: temp[2],
      opt: (_a = temp[4]) != null ? _a : ""
    };
  else if (arr[1])
    return {
      type: temp[0],
      method: temp[1],
      page: parseInt(arr[0]),
      command: isButtonActionType(arr[1]) ? arr[1] : "",
      mode: temp[2],
      opt: (_b = temp[4]) != null ? _b : ""
    };
  else
    return {
      type: temp[0],
      method: temp[1],
      command: isButtonActionType(arr[0]) ? arr[0] : "",
      mode: temp[2],
      opt: (_c = temp[4]) != null ? _c : ""
    };
}
function isButtonActionType(F) {
  switch (F) {
    case "bExit":
    case "bUp":
    case "bNext":
    case "bSubNext":
    case "bPrev":
    case "bSubPrev":
    case "bHome":
    case "notifyAction":
    case "OnOff":
    case "button":
    case "up":
    case "stop":
    case "down":
    case "positionSlider":
    case "tiltOpen":
    case "tiltStop":
    case "tiltSlider":
    case "tiltClose":
    case "brightnessSlider":
    case "colorTempSlider":
    case "colorWheel":
    case "tempUpd":
    case "tempUpdHighLow":
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
    case "timer-start":
    case "timer-pause":
    case "timer-cancle":
    case "timer-finish":
    case "hvac_action":
    case "mode-modus1":
    case "mode-modus2":
    case "mode-modus3":
    case "number-set":
    case "mode-preset_modes":
    case "A1":
    case "A2":
    case "A3":
    case "A4":
    case "D1":
    case "U1":
      return true;
    default:
      console.info(F + " is not isButtonActionType!");
      return false;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildNSPanelString,
  checkSortedPlayerType,
  convertToEvent,
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
