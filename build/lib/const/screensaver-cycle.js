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
var screensaver_cycle_exports = {};
__export(screensaver_cycle_exports, {
  cycleValueToState: () => cycleValueToState,
  nextCycleIndex: () => nextCycleIndex,
  normalizeCycleValues: () => normalizeCycleValues
});
module.exports = __toCommonJS(screensaver_cycle_exports);
function cycleNumber(text) {
  const n = Number(text.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function normalizeCycleValues(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  return list.filter((v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean").map((v) => String(v).trim()).filter((v) => v !== "");
}
function cycleValueToState(value, type) {
  var _a;
  const text = value.trim();
  if (text === "") {
    return null;
  }
  const lower = text.toLowerCase();
  switch (type) {
    case "number":
      return cycleNumber(text);
    case "boolean":
      if (lower === "true" || lower === "1") {
        return true;
      }
      return lower === "false" || lower === "0" ? false : null;
    case "string":
      return text;
    default:
      if (lower === "true" || lower === "false") {
        return lower === "true";
      }
      return (_a = cycleNumber(text)) != null ? _a : text;
  }
}
function nextCycleIndex(values, current, type, last) {
  if (typeof current !== "string" && typeof current !== "number" && typeof current !== "boolean") {
    return 0;
  }
  const value = cycleValueToState(String(current), type);
  if (value === null) {
    return 0;
  }
  const matches = (entry) => entry !== void 0 && cycleValueToState(entry, type) === value;
  const position = last !== void 0 && matches(values[last]) ? last : values.findIndex((entry) => matches(entry));
  return position < 0 ? 0 : (position + 1) % values.length;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cycleValueToState,
  nextCycleIndex,
  normalizeCycleValues
});
//# sourceMappingURL=screensaver-cycle.js.map
