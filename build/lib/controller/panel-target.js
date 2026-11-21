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
var panel_target_exports = {};
__export(panel_target_exports, {
  resolvePanelTargets: () => resolvePanelTargets,
  uniquePanelNames: () => uniquePanelNames
});
module.exports = __toCommonJS(panel_target_exports);
function resolvePanelTargets(panels, target) {
  if (!target) {
    return { panels: [...panels], missing: [] };
  }
  const found = [];
  const missing = [];
  for (const t of Array.isArray(target) ? target : [target]) {
    const panel = panels.find((p) => p.name === t || p.friendlyName === t || p.topic === t);
    if (panel) {
      found.push(panel);
    } else {
      missing.push(String(t));
    }
  }
  return { panels: found, missing };
}
function uniquePanelNames(panels) {
  return [...new Set(panels.map((p) => p.name))];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  resolvePanelTargets,
  uniquePanelNames
});
//# sourceMappingURL=panel-target.js.map
