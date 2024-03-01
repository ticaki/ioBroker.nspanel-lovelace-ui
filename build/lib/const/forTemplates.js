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
var forTemplates_exports = {};
__export(forTemplates_exports, {
  lightIcon: () => lightIcon
});
module.exports = __toCommonJS(forTemplates_exports);
var Color = __toESM(require("./Color"));
const lightIcon = {
  true: {
    value: { type: "const", constVal: "lightbulb" },
    color: { type: "const", constVal: Color.Yellow }
  },
  false: {
    value: { type: "const", constVal: "lightbulb-outline" },
    color: { type: "const", constVal: Color.HMIOff }
  },
  scale: void 0,
  maxBri: void 0,
  minBri: void 0
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  lightIcon
});
//# sourceMappingURL=forTemplates.js.map
