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
var function_and_const_exports = {};
__export(function_and_const_exports, {
  ALARM_BUTTON_EVENTS: () => ALARM_BUTTON_EVENTS,
  SerialTypeArray: () => SerialTypeArray,
  arrayOfAll: () => arrayOfAll,
  arrayOfScreensaverModes: () => arrayOfScreensaverModes,
  convertColorScaleBest: () => convertColorScaleBest,
  exhaustiveCheck: () => exhaustiveCheck,
  isAlarmButtonEvent: () => isAlarmButtonEvent,
  isButtonActionType: () => isButtonActionType,
  isCardEntitiesType: () => isCardEntitiesType,
  isCardGridType: () => isCardGridType,
  isCardMenuHalfPageScrollType: () => isCardMenuHalfPageScrollType,
  isCardMenuRole: () => isCardMenuRole,
  isClosingBehavior: () => isClosingBehavior,
  isColorEntryType: () => isColorEntryType,
  isEventMethod: () => isEventMethod,
  isEventType: () => isEventType,
  isIconColorScaleElement: () => isIconColorScaleElement,
  isIconSelectScaleElement: () => isIconSelectScaleElement,
  isPageMenuConfig: () => isPageMenuConfig,
  isPartialColorScaleElement: () => isPartialColorScaleElement,
  isPartialIconSelectScaleElement: () => isPartialIconSelectScaleElement,
  isPlaceholderType: () => isPlaceholderType,
  isPopupType: () => isPopupType,
  isQRButtonEvent: () => isQRButtonEvent,
  isScreenSaverCardType: () => isScreenSaverCardType,
  isScreenSaverMode: () => isScreenSaverMode,
  isScreenSaverModeAsNumber: () => isScreenSaverModeAsNumber,
  isStateRole: () => isStateRole,
  isTasmotaSTATUS0: () => isTasmotaSTATUS0,
  isTasmotaStatus0Status: () => isTasmotaStatus0Status,
  isTasmotaStatusFWR: () => isTasmotaStatusFWR,
  isTasmotaStatusLOG: () => isTasmotaStatusLOG,
  isTasmotaStatusMEM: () => isTasmotaStatusMEM,
  isTasmotaStatusMQT: () => isTasmotaStatusMQT,
  isTasmotaStatusNet: () => isTasmotaStatusNet,
  isTasmotaStatusPRM: () => isTasmotaStatusPRM,
  isTasmotaStatusSNS: () => isTasmotaStatusSNS,
  isTasmotaStatusSTS: () => isTasmotaStatusSTS,
  isTasmotaStatusTIM: () => isTasmotaStatusTIM,
  isValueDateFormat: () => isValueDateFormat,
  normalizeIconColorElement: () => normalizeIconColorElement,
  screenSaverCardArray: () => screenSaverCardArray,
  screenSaverInfoIcons: () => screenSaverInfoIcons,
  screenSaverInfoIconsUseable: () => screenSaverInfoIconsUseable,
  screenSaverModeArray: () => screenSaverModeArray
});
module.exports = __toCommonJS(function_and_const_exports);
var import_Color = require("../const/Color");
function convertColorScaleBest(F) {
  var _a, _b, _c;
  if (F) {
    return { r: (_a = F.red) != null ? _a : F.r, g: (_b = F.green) != null ? _b : F.g, b: (_c = F.blue) != null ? _c : F.b };
  }
  return void 0;
}
function isPartialColorScaleElement(F) {
  return F && ("val_min" in F || "val_max" in F);
}
function isIconSelectScaleElement(F) {
  return F && "valIcon_min" in F && "valIcon_max" in F;
}
function isPartialIconSelectScaleElement(F) {
  return F && ("valIcon_min" in F || "valIcon_max" in F);
}
function normalizeIconColorElement(el) {
  const copy = { ...el };
  if (copy.color_best) {
    copy.color_best = convertColorScaleBest(copy.color_best);
  }
  return copy;
}
function isIconColorScaleElement(x) {
  if (typeof x !== "object" || x === null) {
    return false;
  }
  const v = x;
  if (!Number.isFinite(v.val_min)) {
    return false;
  }
  if (!Number.isFinite(v.val_max)) {
    return false;
  }
  if (v.val_best != null && !Number.isFinite(v.val_best)) {
    return false;
  }
  if (v.log10 != null && v.log10 !== "max" && v.log10 !== "min") {
    return false;
  }
  if (v.mode != null && v.mode !== "mixed" && v.mode !== "hue" && v.mode !== "cie" && v.mode !== "triGrad" && v.mode !== "triGradAnchor" && v.mode !== "quadriGrad" && v.mode !== "quadriGradAnchor") {
    return false;
  }
  if (v.color_best != null && !import_Color.Color.isRGB(v.color_best)) {
    return false;
  }
  return true;
}
function isEventType(F) {
  return ["event"].indexOf(F) != -1;
}
function isEventMethod(F) {
  switch (F) {
    case "startup":
    case "sleepReached":
    case "pageOpenDetail":
    case "buttonPress2":
    case "buttonPress3":
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
    case "popupShutter2":
    case "popupThermo":
    case "popupTimer":
    case "popupSlider":
      return true;
    default:
      console.info(`Unknown PopupType: ${F} `);
      return false;
  }
}
const SerialTypeArray = [
  "light",
  //popup
  "shutter",
  //popup
  "delete",
  "text",
  "button",
  "switch",
  // nur für cardQR
  "number",
  "input_sel",
  //popup
  "timer",
  //popup
  "fan"
  //popup
];
function isValueDateFormat(F) {
  return F && typeof F === "object" && F.local !== void 0 && F.format !== void 0;
}
const screenSaverInfoIconsUseable = {
  none: "",
  "clock!": "clock-alert-outline",
  "weather!": "weather-sunny-alert",
  "news!": "bell-ring-outline",
  "calendar!": "calendar-alert",
  "alarm!": "alarm",
  "info!": "information-outline",
  "error!": "alert-circle-outline",
  "critical!": "alert-circle"
};
const screenSaverInfoIcons = swapKeyValue(screenSaverInfoIconsUseable);
function swapKeyValue(obj) {
  const swapped = {};
  for (const key in obj) {
    const value = obj[key];
    swapped[value] = key;
  }
  return swapped;
}
const CARD_ENTITIES_TYPES = ["cardEntities", "cardSchedule"];
const CARD_GRID_TYPES = ["cardGrid", "cardGrid2", "cardGrid3", "cardThermo2", "cardMedia"];
const CARD_MENU_HALF_PAGE_SCROLL_TYPES = ["cardGrid", "cardGrid2", "cardGrid3", "cardThermo2"];
function isCardEntitiesType(value) {
  return typeof value === "string" && CARD_ENTITIES_TYPES.includes(value);
}
function isCardGridType(value) {
  return typeof value === "string" && CARD_GRID_TYPES.includes(value);
}
function isCardMenuHalfPageScrollType(value) {
  return typeof value === "string" && CARD_MENU_HALF_PAGE_SCROLL_TYPES.includes(value);
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
const arrayOfAllScreenSaverMode = arrayOfAll();
const arrayOfAllScreenSaverCards = arrayOfAll();
function exhaustiveCheck(_param) {
}
const screenSaverCardArray = arrayOfAllScreenSaverCards([
  "screensaver",
  "screensaver2",
  "screensaver3"
]);
function isScreenSaverCardType(F) {
  if (typeof F !== "string") {
    return false;
  }
  return ["screensaver", "screensaver2", "screensaver3"].includes(F);
}
const screenSaverModeArray = arrayOfAllScreenSaverMode(["standard", "advanced", "alternate", "easyview"]);
function isScreenSaverMode(F) {
  if (typeof F !== "string") {
    return false;
  }
  return ["standard", "advanced", "alternate", "easyview"].includes(F);
}
const SCREENSAVER_MODE_NUMBERS = [0, 1, 2, 3];
function isScreenSaverModeAsNumber(value) {
  return typeof value === "number" && SCREENSAVER_MODE_NUMBERS.includes(value);
}
function isStateRole(F) {
  return true;
}
const BUTTON_ACTION_TYPES = /* @__PURE__ */ new Set([
  "bExit",
  "bUp",
  "bNext",
  "bSubNext",
  "bPrev",
  "bSubPrev",
  "bHome",
  "notifyAction",
  "OnOff",
  "button",
  "up",
  "stop",
  "down",
  "positionSlider",
  "tiltOpen",
  "tiltStop",
  "tiltSlider",
  "tiltClose",
  "brightnessSlider",
  "colorTempSlider",
  "colorWheel",
  "tempUpd",
  "tempUpdHighLow",
  "media-back",
  "media-pause",
  "media-next",
  "media-shuffle",
  "volumeSlider",
  "mode-speakerlist",
  "mode-playlist",
  "mode-tracklist",
  "mode-repeat",
  "mode-equalizer",
  "mode-seek",
  "mode-crossfade",
  "mode-favorites",
  "mode-insel",
  "media-OnOff",
  "timer-start",
  "timer-pause",
  "timer-cancle",
  "timer-finish",
  "hvac_action",
  "mode-modus1",
  "mode-modus2",
  "mode-modus3",
  "number-set",
  "mode-preset_modes",
  "A1",
  "A2",
  "A3",
  "A4",
  "D1",
  "U1",
  "eu"
]);
function isButtonActionType(value) {
  return typeof value === "string" && BUTTON_ACTION_TYPES.has(value);
}
const ALARM_BUTTON_EVENTS = [
  "A1",
  "A2",
  "A3",
  "A4",
  "D1",
  "D2",
  "D3",
  "D4",
  "U1",
  ""
];
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
function isColorEntryType(F) {
  if ("true" in F && "false" in F && "scale" in F) {
    return true;
  }
  return false;
}
function isQRButtonEvent(F) {
  return "OnOff" === F;
}
function isClosingBehavior(F) {
  return ["both", "yes", "no", "none"].indexOf(F) !== -1;
}
function isAlarmButtonEvent(value) {
  return typeof value === "string" && ALARM_BUTTON_EVENTS.includes(value);
}
const arrayOfModes = arrayOfAll();
const arrayOfScreensaverModes = arrayOfModes(["standard", "alternate", "advanced", "easyview"]);
function isTasmotaStatusNet(F) {
  return F && typeof F === "object" && "StatusNET" in F && typeof F.StatusNET === "object";
}
function isTasmotaStatus0Status(F) {
  return F && typeof F === "object" && "Status" in F && typeof F.Status === "object";
}
function isTasmotaStatusPRM(F) {
  return F && typeof F === "object" && "StatusPRM" in F && typeof F.StatusPRM === "object";
}
function isTasmotaStatusFWR(F) {
  return F && typeof F === "object" && "StatusFWR" in F && typeof F.StatusFWR === "object";
}
function isTasmotaStatusLOG(F) {
  return F && typeof F === "object" && "StatusLOG" in F && typeof F.StatusLOG === "object";
}
function isTasmotaStatusMEM(F) {
  return F && typeof F === "object" && "StatusMEM" in F && typeof F.StatusMEM === "object";
}
function isTasmotaStatusMQT(F) {
  return F && typeof F === "object" && "StatusMQT" in F && typeof F.StatusMQT === "object";
}
function isTasmotaStatusTIM(F) {
  return F && typeof F === "object" && "StatusTIM" in F && typeof F.StatusTIM === "object";
}
function isTasmotaStatusSNS(F) {
  return F && typeof F === "object" && "StatusSNS" in F && typeof F.StatusSNS === "object";
}
function isTasmotaStatusSTS(F) {
  return F && typeof F === "object" && "StatusSTS" in F && typeof F.StatusSTS === "object";
}
function isTasmotaSTATUS0(F) {
  return F && typeof F === "object" && isTasmotaStatus0Status(F) && isTasmotaStatusPRM(F) && isTasmotaStatusFWR(F) && isTasmotaStatusLOG(F) && isTasmotaStatusMEM(F) && isTasmotaStatusNet(F) && isTasmotaStatusMQT(F) && isTasmotaStatusTIM(F) && isTasmotaStatusSNS(F) && isTasmotaStatusSTS(F);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ALARM_BUTTON_EVENTS,
  SerialTypeArray,
  arrayOfAll,
  arrayOfScreensaverModes,
  convertColorScaleBest,
  exhaustiveCheck,
  isAlarmButtonEvent,
  isButtonActionType,
  isCardEntitiesType,
  isCardGridType,
  isCardMenuHalfPageScrollType,
  isCardMenuRole,
  isClosingBehavior,
  isColorEntryType,
  isEventMethod,
  isEventType,
  isIconColorScaleElement,
  isIconSelectScaleElement,
  isPageMenuConfig,
  isPartialColorScaleElement,
  isPartialIconSelectScaleElement,
  isPlaceholderType,
  isPopupType,
  isQRButtonEvent,
  isScreenSaverCardType,
  isScreenSaverMode,
  isScreenSaverModeAsNumber,
  isStateRole,
  isTasmotaSTATUS0,
  isTasmotaStatus0Status,
  isTasmotaStatusFWR,
  isTasmotaStatusLOG,
  isTasmotaStatusMEM,
  isTasmotaStatusMQT,
  isTasmotaStatusNet,
  isTasmotaStatusPRM,
  isTasmotaStatusSNS,
  isTasmotaStatusSTS,
  isTasmotaStatusTIM,
  isValueDateFormat,
  normalizeIconColorElement,
  screenSaverCardArray,
  screenSaverInfoIcons,
  screenSaverInfoIconsUseable,
  screenSaverModeArray
});
//# sourceMappingURL=function-and-const.js.map
