"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var pages_exports = {};
__export(pages_exports, {
  convertToEvent: () => convertToEvent,
  isButtonActionType: () => isButtonActionType,
  isColorEntryType: () => isColorEntryType,
  isPageRole: () => isPageRole
});
module.exports = __toCommonJS(pages_exports);
var Types = __toESM(require("./types"));
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
function convertToEvent(msg) {
  var _a, _b, _c, _d;
  msg = (JSON.parse(msg) || {}).CustomRecv;
  if (msg === void 0)
    return null;
  const temp = msg.split(",");
  if (!Types.isEventType(temp[0]))
    return null;
  if (!Types.isEventMethod(temp[1]))
    return null;
  let popup = void 0;
  if (temp[1] === "pageOpenDetail")
    popup = temp.splice(2, 1)[0];
  const arr = String(temp[2]).split("?");
  if (arr[3])
    return {
      type: temp[0],
      method: temp[1],
      target: parseInt(arr[3]),
      page: parseInt(arr[1]),
      cmd: parseInt(arr[0]),
      popup,
      id: arr[2],
      action: isButtonActionType(temp[3]) ? temp[3] : temp[3],
      opt: (_a = temp[4]) != null ? _a : ""
    };
  if (arr[2])
    return {
      type: temp[0],
      method: temp[1],
      page: parseInt(arr[0]),
      cmd: parseInt(arr[1]),
      popup,
      id: arr[2],
      action: isButtonActionType(temp[3]) ? temp[3] : temp[3],
      opt: (_b = temp[4]) != null ? _b : ""
    };
  else if (arr[1])
    return {
      type: temp[0],
      method: temp[1],
      page: parseInt(arr[0]),
      popup,
      id: arr[1],
      action: isButtonActionType(temp[3]) ? temp[3] : temp[3],
      opt: (_c = temp[4]) != null ? _c : ""
    };
  else
    return {
      type: temp[0],
      method: temp[1],
      popup,
      id: arr[0],
      action: isButtonActionType(temp[3]) ? temp[3] : temp[3],
      opt: (_d = temp[4]) != null ? _d : ""
    };
}
function isColorEntryType(F) {
  if ("true" in F && "false" in F && "scale" in F)
    return true;
  return false;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  convertToEvent,
  isButtonActionType,
  isColorEntryType,
  isPageRole
});
//# sourceMappingURL=pages.js.map
