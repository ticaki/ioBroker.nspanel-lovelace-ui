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
var berry_driver_exports = {};
__export(berry_driver_exports, {
  driverGeneration: () => driverGeneration,
  isEmulatorDriverVersion: () => isEmulatorDriverVersion,
  parseDriverVersion: () => parseDriverVersion
});
module.exports = __toCommonJS(berry_driver_exports);
function parseDriverVersion(v) {
  if (typeof v === "number") {
    return Number.isFinite(v) ? Math.trunc(v) : 0;
  }
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
function isEmulatorDriverVersion(v) {
  return parseDriverVersion(v) < 0;
}
function driverGeneration(v) {
  return Math.abs(parseDriverVersion(v));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  driverGeneration,
  isEmulatorDriverVersion,
  parseDriverVersion
});
//# sourceMappingURL=berry-driver.js.map
