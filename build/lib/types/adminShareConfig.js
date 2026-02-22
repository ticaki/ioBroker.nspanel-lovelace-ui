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
  ALL_PANELS_SPECIAL_ID: () => ALL_PANELS_SPECIAL_ID,
  SAVE_PANEL_NAVIGATION_COMMAND: () => SAVE_PANEL_NAVIGATION_COMMAND,
  SENDTO_GET_PAGES_All_COMMAND: () => SENDTO_GET_PAGES_All_COMMAND,
  SENDTO_GET_PAGES_COMMAND: () => SENDTO_GET_PAGES_COMMAND,
  SENDTO_GET_PANELS_COMMAND: () => SENDTO_GET_PANELS_COMMAND,
  SENDTO_GET_PANEL_NAVIGATION_COMMAND: () => SENDTO_GET_PANEL_NAVIGATION_COMMAND,
  panelStatusColors: () => panelStatusColors,
  panelStatusStates: () => panelStatusStates,
  reversePanelStatusStates: () => reversePanelStatusStates
});
module.exports = __toCommonJS(adminShareConfig_exports);
const ALL_PANELS_SPECIAL_ID = "///ALL_PANELS_SPECIAL";
const SENDTO_GET_PANEL_NAVIGATION_COMMAND = "getPanelNavigation";
const SAVE_PANEL_NAVIGATION_COMMAND = "savePanelNavigation";
const SENDTO_GET_PANELS_COMMAND = "getPanels";
const SENDTO_GET_PAGES_COMMAND = "getPagesForPanel";
const SENDTO_GET_PAGES_All_COMMAND = "getAllPages";
const ADAPTER_NAME = "nspanel-lovelace-ui";
const panelStatusStates = {
  0: "offline",
  // Panel ist offline, keine belegbare Verbindung zum Adapter
  1: "initializing",
  // Panel Objekt initialisiert. Nur im Startup / Skriptübertragung
  2: "connecting",
  // Panel baut mqtt-Verbindung auf. Nur im Startup / Skriptübertragung
  3: "connected",
  // Panel hat mqtt-Verbindung aufgebaut, aber noch kein Online-Status. Nur im Startup / Skriptübertragung
  4: "online",
  // Panel TFT hat sich gemeldet und ist online
  5: "flashing",
  // Panel wird geflasht
  6: "error"
  // Panel hat einen Fehler gemeldet (z.B. Verbindungsfehler, Fehler beim Flashen, etc.)
};
const panelStatusColors = {
  offline: "grey",
  initializing: "grey",
  connecting: "lightblue",
  connected: "blue",
  online: "green",
  flashing: "yellow",
  error: "red"
};
function reversePanelStatusStates(value) {
  const reversed = {};
  for (const key in panelStatusStates) {
    if (Object.prototype.hasOwnProperty.call(panelStatusStates, key)) {
      const value2 = panelStatusStates[key];
      reversed[value2] = parseInt(key, 10);
    }
  }
  return reversed[value];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ADAPTER_NAME,
  ALL_PANELS_SPECIAL_ID,
  SAVE_PANEL_NAVIGATION_COMMAND,
  SENDTO_GET_PAGES_All_COMMAND,
  SENDTO_GET_PAGES_COMMAND,
  SENDTO_GET_PANELS_COMMAND,
  SENDTO_GET_PANEL_NAVIGATION_COMMAND,
  panelStatusColors,
  panelStatusStates,
  reversePanelStatusStates
});
//# sourceMappingURL=adminShareConfig.js.map
