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
  arrayOfAll: () => arrayOfAll,
  exhaustiveCheck: () => exhaustiveCheck,
  isAlarmButtonEvent: () => isAlarmButtonEvent,
  isButtonActionType: () => isButtonActionType,
  isClosingBehavior: () => isClosingBehavior,
  isColorEntryType: () => isColorEntryType,
  isPlaceholderType: () => isPlaceholderType,
  isQRButtonEvent: () => isQRButtonEvent,
  isScreenSaverCardType: () => isScreenSaverCardType,
  isScreenSaverMode: () => isScreenSaverMode,
  isStateRole: () => isStateRole,
  screenSaverCardArray: () => screenSaverCardArray,
  screenSaverModeArray: () => screenSaverModeArray,
  stateRoleArray: () => stateRoleArray
});
module.exports = __toCommonJS(pages_exports);
const arrayOfAll = () => (array) => array;
function exhaustiveCheck(_param) {
}
const arrayOfAllStateRole = arrayOfAll();
const arrayOfAllScreenSaverMode = arrayOfAll();
const arrayOfAllScreenSaverCards = arrayOfAll();
const screenSaverCardArray = arrayOfAllScreenSaverCards([
  "screensaver",
  "screensaver2",
  "screensaver3"
]);
function isScreenSaverCardType(F) {
  if (typeof F !== "string") {
    return false;
  }
  switch (F) {
    case "screensaver":
    case "screensaver2":
    case "screensaver3":
      return true;
    default:
      console.info(`${F} is not isScreenSaverCardType!`);
      return false;
  }
}
const screenSaverModeArray = arrayOfAllScreenSaverMode(["standard", "advanced", "alternate", "easyview"]);
function isScreenSaverMode(F) {
  if (typeof F !== "string") {
    return false;
  }
  switch (F) {
    case "standard":
    case "advanced":
    case "alternate":
    case "easyview":
      return true;
    default:
      console.info(`${F} is not isScreenSaverMode!`);
      return false;
  }
}
const stateRoleArray = arrayOfAllStateRole([
  "value.power",
  "button.play",
  "button.pause",
  "button.next",
  "button.prev",
  "button.stop",
  "button.volume.up",
  "button.volume.down",
  "media.seek",
  // (common.type=number) %
  "media.mode.shuffle",
  //(common.type=number) 0 - none, 1 - all, 2 - one
  "media.mode.repeat",
  //(common.type=boolean)
  "media.state",
  //['play','stop','pause'] or [0 - pause, 1 - play, 2 - stop] or [true - playing/false - pause]
  "media.artist",
  "media.album",
  "media.title",
  "media.duration",
  "media.elapsed.text",
  "media.elapsed",
  "media.mute",
  "level.volume",
  "media.playlist",
  "button.open.blind",
  "button.open",
  "button.close.blind",
  "button.close",
  "button.stop.blind",
  "button.stop",
  "button.open.tilt",
  "button.stop.tilt",
  "button.close.tilt",
  "level.tilt",
  "level.blind",
  "level.color.name",
  "state",
  "level.color.blue",
  "level.color.red",
  "level.color.green",
  "level.color.white",
  "level.brightness",
  "switch",
  "button",
  "sensor.window",
  "sensor.open",
  "value.temperature",
  "value.battery",
  "indicator.lowbat",
  "value",
  "level.temperature",
  "level.value",
  "date",
  "date.sunrise.forecast.0",
  "date.sunset.forecast.0",
  "date.sunrise.forecast.1",
  "date.sunset.forecast.1",
  "value.humidity",
  "switch.gate",
  "sensor.door",
  "value.blind",
  "value.volume",
  "sensor.motion",
  ""
]);
function isStateRole(F) {
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
      return true;
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
    case "eu":
      return true;
    default:
      console.info(`${F} is not isButtonActionType!`);
      return false;
  }
}
function isAlarmButtonEvent(F) {
  return ["A1", "A2", "A3", "A4", "D1", "U1"].indexOf(F) !== -1;
}
function isClosingBehavior(F) {
  return ["both", "yes", "no", "none"].indexOf(F) !== -1;
}
function isQRButtonEvent(F) {
  return ["OnOff"].indexOf(F) !== -1;
}
function isColorEntryType(F) {
  if ("true" in F && "false" in F && "scale" in F) {
    return true;
  }
  return false;
}
function isPlaceholderType(F) {
  if (!F || typeof F !== "object") {
    return false;
  }
  for (const a in F) {
    let count = 0;
    if (!F[a]) {
      return false;
    }
    for (const b in F[a]) {
      if (["text", "dp"].indexOf(b) !== -1 && F[a][b] !== void 0) {
        count++;
      }
    }
    if (count !== 1) {
      return false;
    }
  }
  return true;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  arrayOfAll,
  exhaustiveCheck,
  isAlarmButtonEvent,
  isButtonActionType,
  isClosingBehavior,
  isColorEntryType,
  isPlaceholderType,
  isQRButtonEvent,
  isScreenSaverCardType,
  isScreenSaverMode,
  isStateRole,
  screenSaverCardArray,
  screenSaverModeArray,
  stateRoleArray
});
//# sourceMappingURL=pages.js.map
