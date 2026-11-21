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
var chart_thin_exports = {};
__export(chart_thin_exports, {
  linePointsBytes: () => linePointsBytes,
  thinLinePoints: () => thinLinePoints
});
module.exports = __toCommonJS(chart_thin_exports);
function linePointsBytes(points) {
  let bytes = 0;
  for (const p of points) {
    bytes += pointBytes(p);
  }
  return bytes;
}
function pointBytes(p) {
  return Buffer.byteLength(`~${p.x}:${p.y}`, "utf8");
}
function verticalDistance(left, p, right) {
  const dx = right.x - left.x;
  const lineY = dx === 0 ? (left.y + right.y) / 2 : left.y + (right.y - left.y) * (p.x - left.x) / dx;
  return Math.abs(p.y - lineY);
}
function thinLinePoints(points, budgetBytes) {
  let bytes = linePointsBytes(points);
  if (bytes <= budgetBytes || points.length <= 2) {
    return points;
  }
  let minIndex = 0;
  let maxIndex = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].y < points[minIndex].y) {
      minIndex = i;
    }
    if (points[i].y > points[maxIndex].y) {
      maxIndex = i;
    }
  }
  const lastIndex = points.length - 1;
  const result = points.slice();
  const fixed = points.map((_p, i) => i === 0 || i === lastIndex || i === minIndex || i === maxIndex);
  const distances = result.map(
    (p, i) => fixed[i] ? Infinity : verticalDistance(result[i - 1], p, result[i + 1])
  );
  while (bytes > budgetBytes) {
    let best = -1;
    for (let i = 1; i < result.length - 1; i++) {
      if (distances[i] !== Infinity && (best === -1 || distances[i] < distances[best])) {
        best = i;
      }
    }
    if (best === -1) {
      break;
    }
    bytes -= pointBytes(result[best]);
    result.splice(best, 1);
    distances.splice(best, 1);
    fixed.splice(best, 1);
    for (const i of [best - 1, best]) {
      if (!fixed[i]) {
        distances[i] = verticalDistance(result[i - 1], result[i], result[i + 1]);
      }
    }
  }
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  linePointsBytes,
  thinLinePoints
});
//# sourceMappingURL=chart-thin.js.map
