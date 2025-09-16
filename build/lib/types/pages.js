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
  isCardEntitiesType: () => isCardEntitiesType,
  isCardGridType: () => isCardGridType,
  isCardMenuHalfPageScrollType: () => isCardMenuHalfPageScrollType,
  isCardMenuRole: () => isCardMenuRole,
  isClosingBehavior: () => isClosingBehavior,
  isColorEntryType: () => isColorEntryType,
  isPageMenuConfig: () => isPageMenuConfig,
  isPlaceholderType: () => isPlaceholderType,
  isQRButtonEvent: () => isQRButtonEvent,
  isScreenSaverCardType: () => isScreenSaverCardType,
  isScreenSaverMode: () => isScreenSaverMode,
  isScreenSaverModeAsNumber: () => isScreenSaverModeAsNumber,
  isStateRole: () => isStateRole,
  screenSaverCardArray: () => screenSaverCardArray,
  screenSaverModeArray: () => screenSaverModeArray,
  stateRoleArray: () => stateRoleArray
});
module.exports = __toCommonJS(pages_exports);
function isCardEntitiesType(F) {
  return ["cardEntities", "cardSchedule"].indexOf(F) !== -1;
}
function isCardGridType(F) {
  return ["cardGrid", "cardGrid2", "cardGrid3", "cardThermo2", "cardMedia"].indexOf(F) !== -1;
}
function isCardMenuHalfPageScrollType(F) {
  return ["cardGrid", "cardGrid2", "cardGrid3", "cardThermo2"].indexOf(F) !== -1;
}
function isCardMenuRole(F) {
  return isCardEntitiesType(F) || isCardGridType(F);
}
function isPageMenuConfig(F) {
  if (typeof F !== "object" || F === null || !("card" in F)) {
    return false;
  }
  return isCardMenuRole(F.card);
}
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
function isScreenSaverModeAsNumber(F) {
  if (typeof F !== "number") {
    return false;
  }
  const N = F;
  switch (N) {
    case 0:
    case 1:
    case 2:
    case 3:
      return true;
    default:
      exhaustiveCheck(N);
      console.info(`${F} is not isScreenSaverModeAsNumber!`);
      return false;
  }
}
const stateRoleArray = arrayOfAllStateRole([
  "button",
  "button.close",
  "button.close.blind",
  "button.close.tilt",
  "button.next",
  "button.open",
  "button.open.blind",
  "button.open.tilt",
  "button.pause",
  "button.play",
  "button.press",
  "button.prev",
  "button.stop",
  "button.stop.blind",
  "button.stop.tilt",
  "button.volume.down",
  "button.volume.up",
  "date",
  "date.sunrise.forecast.0",
  "date.sunrise.forecast.1",
  "date.sunset.forecast.0",
  "date.sunset.forecast.1",
  "indicator.error",
  "indicator.lowbat",
  "indicator.maintenance",
  "indicator.maintenance.lowbat",
  "indicator.maintenance.unreach",
  "indicator.working",
  "level",
  "level.blind",
  "level.brightness",
  "level.color.blue",
  "level.color.cie",
  "level.color.green",
  "level.color.hue",
  "level.color.name",
  "level.color.red",
  "level.color.rgb",
  "level.color.temperature",
  "level.color.white",
  "level.dimmer",
  "level.mode.airconditioner",
  "level.mode.fan",
  "level.mode.thermostat",
  "level.speed",
  "level.mode.swing",
  "level.temperature",
  "level.tilt",
  "level.value",
  "level.volume",
  "media.album",
  "media.artist",
  "media.duration",
  "media.elapsed",
  "media.elapsed.text",
  "media.mode.repeat",
  "media.mode.shuffle",
  "media.mute",
  "media.playlist",
  "media.seek",
  "media.state",
  "media.title",
  "sensor.door",
  "sensor.light",
  "sensor.motion",
  "sensor.open",
  "sensor.window",
  "state",
  "state.light",
  "switch",
  "switch.gate",
  "switch.light",
  "switch.lock",
  "switch.mode.auto",
  "switch.mode.boost",
  "switch.boost",
  "switch.mode.manual",
  "switch.mode.party",
  "switch.mode.swing",
  "switch.power",
  "text",
  "timestamp",
  "value",
  "value.battery",
  "value.blind",
  "value.dimmer",
  "value.humidity",
  "value.power",
  "value.rgb",
  "value.temperature",
  "value.tilt",
  "value.volume",
  "value.warning",
  "weather.icon.forecast",
  "weather.title",
  "weather.title.short",
  "level.mode.select",
  "value.mode.select",
  "level.timer",
  "value.timer",
  "level.mode",
  "sensor.alarm.flood",
  "indicator.reachable",
  "sensor.switch",
  "date.sunrise",
  "date.sunset",
  "weather.icon",
  "weather.icon.name",
  "value.uv",
  "value.direction.wind",
  "value.speed.wind",
  "value.mode.airconditioner",
  "value.mode.thermostat",
  "indicator",
  "indicator.connected",
  "level.volume.group",
  "media.mode.crossfade",
  "media.station",
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
  isCardEntitiesType,
  isCardGridType,
  isCardMenuHalfPageScrollType,
  isCardMenuRole,
  isClosingBehavior,
  isColorEntryType,
  isPageMenuConfig,
  isPlaceholderType,
  isQRButtonEvent,
  isScreenSaverCardType,
  isScreenSaverMode,
  isScreenSaverModeAsNumber,
  isStateRole,
  screenSaverCardArray,
  screenSaverModeArray,
  stateRoleArray
});
//# sourceMappingURL=pages.js.map
