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
var panel_setup_exports = {};
__export(panel_setup_exports, {
  matchPanelForSetup: () => matchPanelForSetup
});
module.exports = __toCommonJS(panel_setup_exports);
function matchPanelForSetup(panels, macId, topic) {
  const isSameDevice = (p) => p.kind !== "web" && p.id === macId;
  const conflictIndex = panels.findIndex((p) => p.topic === topic && !isSameDevice(p));
  if (conflictIndex !== -1) {
    return { error: "sendToTopicInUse", conflictIndex };
  }
  const index = panels.findIndex(isSameDevice);
  return index === -1 ? { isNew: true, index: -1 } : { isNew: false, index };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  matchPanelForSetup
});
//# sourceMappingURL=panel-setup.js.map
