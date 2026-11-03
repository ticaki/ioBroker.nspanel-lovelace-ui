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
var pie_scale_exports = {};
__export(pie_scale_exports, {
  PIE_TARGET_SUM: () => PIE_TARGET_SUM,
  finishPieSlices: () => finishPieSlices,
  formatPieValueText: () => formatPieValueText,
  mergePieRest: () => mergePieRest,
  parsePieScriptString: () => parsePieScriptString,
  pieColorToDec: () => pieColorToDec,
  pieLegendMode: () => pieLegendMode,
  pieSlicesToPayload: () => pieSlicesToPayload,
  sanitizePieText: () => sanitizePieText,
  scalePieValues: () => scalePieValues
});
module.exports = __toCommonJS(pie_scale_exports);
var import_Color = require("../const/Color");
var import_adminShareConfig = require("../types/adminShareConfig");
const PIE_TARGET_SUM = 1e6;
function sanitizePieText(text) {
  return (text != null ? text : "").replace(/~/g, "-").trim();
}
function scalePieValues(values) {
  const clean = values.map((v) => Number.isFinite(v) && v > 0 ? v : 0);
  const sum = clean.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    return clean.map(() => 0);
  }
  const factor = PIE_TARGET_SUM / sum;
  return clean.map((v) => v > 0 ? Math.max(1, Math.round(v * factor)) : 0);
}
function formatPieValueText(value, decimals, unit) {
  const d = Number.isFinite(decimals) ? Math.min(10, Math.max(0, Math.round(decimals))) : 2;
  const n = Number.isFinite(value) ? value : 0;
  const u = sanitizePieText(unit);
  return sanitizePieText(`${n.toFixed(d)}${u ? ` ${u}` : ""}`);
}
function pieColorToDec(color) {
  const c = (color != null ? color : "").trim();
  if (/^\d+$/.test(c)) {
    return String(Math.min(65535, parseInt(c, 10)));
  }
  if (c) {
    const rgb = import_Color.Color.ConvertWithColordtoRgb(c);
    if (import_Color.Color.isRGB(rgb)) {
      return String(import_Color.Color.rgb_dec565(rgb));
    }
  }
  return String(import_Color.Color.rgb_dec565(import_Color.Color.White));
}
function parsePieScriptString(text, otherName) {
  const fields = (text != null ? text : "").split("~");
  const slices = [];
  for (let i = 0; i + 3 < fields.length; i += 4) {
    const n = parseFloat(fields[i + 1]);
    slices.push({
      name: sanitizePieText(fields[i]),
      value: Number.isFinite(n) ? n : 0,
      text: sanitizePieText(fields[i + 2]),
      color: pieColorToDec(fields[i + 3])
    });
  }
  return mergePieRest(slices, otherName);
}
function mergePieRest(slices, otherName) {
  if (slices.length <= import_adminShareConfig.PCHART_MAX_SLICES) {
    return [...slices];
  }
  const keep = slices.slice(0, import_adminShareConfig.PCHART_MAX_SLICES - 1);
  const rest = slices.slice(import_adminShareConfig.PCHART_MAX_SLICES - 1);
  const sum = rest.reduce((a, s) => a + (Number.isFinite(s.value) && s.value > 0 ? s.value : 0), 0);
  keep.push({ name: sanitizePieText(otherName), value: sum, text: "", color: rest[0].color });
  return keep;
}
function finishPieSlices(slices) {
  const cut = slices.slice(0, import_adminShareConfig.PCHART_MAX_SLICES);
  const values = scalePieValues(cut.map((s) => s.value));
  return cut.map((s, i) => ({
    name: sanitizePieText(s.name),
    value: values[i],
    text: sanitizePieText(s.text),
    color: s.color
  }));
}
function pieSlicesToPayload(slices) {
  return slices.map((s) => `${s.name}~${s.value}~${s.text}~${s.color}`).join("~");
}
function pieLegendMode(mode) {
  return mode != null && Number.isInteger(mode) && mode >= 0 && mode <= 3 ? mode : 3;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PIE_TARGET_SUM,
  finishPieSlices,
  formatPieValueText,
  mergePieRest,
  parsePieScriptString,
  pieColorToDec,
  pieLegendMode,
  pieSlicesToPayload,
  sanitizePieText,
  scalePieValues
});
//# sourceMappingURL=pie-scale.js.map
