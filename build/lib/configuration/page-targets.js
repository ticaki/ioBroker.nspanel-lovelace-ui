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
var page_targets_exports = {};
__export(page_targets_exports, {
  collectNavigationTargets: () => collectNavigationTargets
});
module.exports = __toCommonJS(page_targets_exports);
function collectNavigationTargets(sources, field) {
  const pages = [];
  const stateRefs = [];
  for (const data of sources) {
    const target = data && field in data ? data[field] : void 0;
    if (!target || typeof target !== "object") {
      continue;
    }
    if (target.type === "const") {
      if (typeof target.constVal === "string" && target.constVal) {
        pages.push(target.constVal);
      }
    } else if (typeof target.dp === "string" && target.dp) {
      stateRefs.push(target.dp);
    }
  }
  return { pages: Array.from(new Set(pages)), stateRefs: Array.from(new Set(stateRefs)) };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  collectNavigationTargets
});
//# sourceMappingURL=page-targets.js.map
