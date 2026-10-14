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
var chart_scale_exports = {};
__export(chart_scale_exports, {
  buildLineScale: () => buildLineScale,
  niceStep: () => niceStep,
  ticksFor: () => ticksFor
});
module.exports = __toCommonJS(chart_scale_exports);
const TICK_MIN = -99;
const TICK_MAX = 999;
const MAX_FACTOR = 1e6;
const NICE_STEPS = [10, 20, 50, 100, 200, 500, 1e3, 2e3, 5e3, 1e4];
function niceStep(span) {
  var _a;
  const raw = Math.max(span, 10) / 5;
  return (_a = NICE_STEPS.find((step) => step >= raw)) != null ? _a : NICE_STEPS[NICE_STEPS.length - 1];
}
function ticksFor(values) {
  if (values.length === 0) {
    return [];
  }
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  const step = niceStep(rawMax - rawMin);
  const lo = Math.floor(rawMin / step) * step;
  const hi = Math.ceil(rawMax / step) * step;
  const ticks = [];
  for (let tick = lo; tick <= hi; tick += step) {
    ticks.push(tick);
  }
  if (ticks.length < 2) {
    ticks.push(lo + step);
  }
  return ticks;
}
function buildLineScale(values) {
  let factor = 1;
  for (; ; ) {
    const scaled = values.map((v) => Math.round(v / factor));
    const ticks = ticksFor(scaled);
    if (ticks.every((t) => t >= TICK_MIN && t <= TICK_MAX) || factor >= MAX_FACTOR) {
      return { factor, values: scaled, ticks };
    }
    factor *= 10;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildLineScale,
  niceStep,
  ticksFor
});
//# sourceMappingURL=chart-scale.js.map
