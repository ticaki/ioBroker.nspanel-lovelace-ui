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
  ticksFor: () => ticksFor
});
module.exports = __toCommonJS(chart_scale_exports);
const TICK_MIN = -99;
const TICK_MAX = 999;
const MAX_FACTOR = 1e6;
function ticksFor(values) {
  if (values.length === 0) {
    return [];
  }
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  const roundedMin = Math.floor(rawMin / 10) * 10;
  const roundedMax = Math.ceil(rawMax / 10) * 10;
  const span = Math.max(roundedMax - roundedMin, 10);
  const interval = Math.max(Number((span / 5).toFixed()), 10);
  const ticks = [];
  for (let tick = roundedMin - interval * 2; tick < roundedMax + interval; tick += interval) {
    ticks.push(tick);
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
  ticksFor
});
//# sourceMappingURL=chart-scale.js.map
