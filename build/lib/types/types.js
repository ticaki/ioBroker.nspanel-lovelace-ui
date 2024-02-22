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
  isEventMethod: () => isEventMethod,
  isEventType: () => isEventType,
  isIconScaleElement: () => isIconScaleElement,
  isPartialIconScaleElement: () => isPartialIconScaleElement,
  isPopupType: () => isPopupType,
  isValueDateFormat: () => isValueDateFormat
});
module.exports = __toCommonJS(types_exports);
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
function isValueDateFormat(F) {
  return F && typeof F === "object" && F.local !== void 0 && F.format !== void 0;
}
function isIconScaleElement(F) {
  return F && "val_min" in F && "val_max" in F;
}
function isPartialIconScaleElement(F) {
  return F && ("val_min" in F || "val_max" in F);
}
function isEventType(F) {
  return ["event"].indexOf(F) != -1;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SerialTypeArray,
  isEventMethod,
  isEventType,
  isIconScaleElement,
  isPartialIconScaleElement,
  isPopupType,
  isValueDateFormat
});
//# sourceMappingURL=types.js.map
