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
var adminShareConfig_exports = {};
__export(adminShareConfig_exports, {
  ADAPTER_NAME: () => ADAPTER_NAME,
  SAVE_PANEL_NAVIGATION_COMMAND: () => SAVE_PANEL_NAVIGATION_COMMAND,
  SENDTO_GET_PAGES_COMMAND: () => SENDTO_GET_PAGES_COMMAND,
  SENDTO_GET_PANELS_COMMAND: () => SENDTO_GET_PANELS_COMMAND,
  SENDTO_GET_PANEL_NAVIGATION_COMMAND: () => SENDTO_GET_PANEL_NAVIGATION_COMMAND
});
module.exports = __toCommonJS(adminShareConfig_exports);
const SENDTO_GET_PANEL_NAVIGATION_COMMAND = "getPanelNavigation";
const SAVE_PANEL_NAVIGATION_COMMAND = "savePanelNavigation";
const SENDTO_GET_PANELS_COMMAND = "getPanels";
const SENDTO_GET_PAGES_COMMAND = "getPagesForPanel";
const ADAPTER_NAME = "nspanel-lovelace-ui";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ADAPTER_NAME,
  SAVE_PANEL_NAVIGATION_COMMAND,
  SENDTO_GET_PAGES_COMMAND,
  SENDTO_GET_PANELS_COMMAND,
  SENDTO_GET_PANEL_NAVIGATION_COMMAND
});
//# sourceMappingURL=adminShareConfig.js.map
