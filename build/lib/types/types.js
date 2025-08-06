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
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var types_exports = {};
__export(types_exports, {
  SerialTypeArray: () => SerialTypeArray,
  arrayOfScreensaverModes: () => arrayOfScreensaverModes,
  isEventMethod: () => isEventMethod,
  isEventType: () => isEventType,
  isIconColorScaleElement: () => isIconColorScaleElement,
  isIconSelectScaleElement: () => isIconSelectScaleElement,
  isPartialColorScaleElement: () => isPartialColorScaleElement,
  isPartialIconSelectScaleElement: () => isPartialIconSelectScaleElement,
  isPopupType: () => isPopupType,
  isValueDateFormat: () => isValueDateFormat,
  screenSaverInfoIcons: () => screenSaverInfoIcons,
  screenSaverInfoIconsUseable: () => screenSaverInfoIconsUseable
});
module.exports = __toCommonJS(types_exports);
var pages = __toESM(require("./pages"));
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
function isIconColorScaleElement(F) {
  if (!F) {
    return false;
  }
  if ("color_best" in F && F.color_best) {
    F.color_best = convertColorScaleBest(F.color_best);
  }
  return "val_min" in F && "val_max" in F && typeof F.val_min === "number" && typeof F.val_max === "number";
}
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
function isEventType(F) {
  return ["event"].indexOf(F) != -1;
}
const arrayOfModes = pages.arrayOfAll();
const arrayOfScreensaverModes = arrayOfModes(["standard", "alternate", "advanced", "easyview"]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SerialTypeArray,
  arrayOfScreensaverModes,
  isEventMethod,
  isEventType,
  isIconColorScaleElement,
  isIconSelectScaleElement,
  isPartialColorScaleElement,
  isPartialIconSelectScaleElement,
  isPopupType,
  isValueDateFormat,
  screenSaverInfoIcons,
  screenSaverInfoIconsUseable
});
//# sourceMappingURL=types.js.map
