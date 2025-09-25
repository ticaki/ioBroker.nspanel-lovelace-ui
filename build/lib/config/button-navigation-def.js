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
var button_navigation_def_exports = {};
__export(button_navigation_def_exports, {
  ButtonNavigationDef: () => ButtonNavigationDef
});
module.exports = __toCommonJS(button_navigation_def_exports);
var import_Color = require("../const/Color");
const ButtonNavigationDef = {
  airCondition: {
    iconOn: "air-conditioner",
    iconOff: "air-conditioner",
    colorOn: import_Color.Color.hot,
    colorOff: import_Color.Color.cold,
    textOn: "on",
    textOff: "off",
    stateName: "ACTUAL"
  },
  blind: {
    iconOn: "window-shutter-open",
    iconOff: "window-shutter",
    colorOn: import_Color.Color.open,
    colorOff: import_Color.Color.close,
    textOn: "open",
    textOff: "close",
    stateName: "ACTUAL"
  },
  button: {
    iconOn: "gesture-tap-button",
    iconOff: "gesture-tap-button",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    textOn: "pressed",
    textOff: "press",
    stateName: "ACTUAL"
  },
  ct: {
    iconOn: "lightbulb",
    iconOff: "lightbulb-outline",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    textOn: "on",
    textOff: "off",
    stateName: "ACTUAL"
  },
  dimmer: {
    iconOn: "lightbulb",
    iconOff: "lightbulb-outline",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    textOn: "on",
    textOff: "off",
    stateName: "ACTUAL"
  },
  door: {
    iconOn: "door-open",
    iconOff: "door-closed",
    colorOn: import_Color.Color.open,
    colorOff: import_Color.Color.close,
    textOn: "open",
    textOff: "close",
    stateName: "ACTUAL"
  },
  gate: {
    iconOn: "gate-open",
    iconOff: "gate",
    colorOn: import_Color.Color.open,
    colorOff: import_Color.Color.close,
    textOn: "open",
    textOff: "close",
    stateName: "ACTUAL"
  },
  hue: {
    iconOn: "lightbulb",
    iconOff: "lightbulb-outline",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    textOn: "on",
    textOff: "off",
    stateName: "ON"
  },
  humidity: {
    iconOn: "water-percent",
    iconOff: "water-percent",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    textOn: "on",
    textOff: "off",
    colorScale: { val_min: 0, val_max: 100, val_best: 50, mode: "triGrad" },
    stateName: "ACTUAL"
  },
  info: {
    iconOn: "information-outline",
    iconOff: "information-off-outline",
    colorOn: import_Color.Color.info,
    colorOff: import_Color.Color.off,
    textOn: "info",
    textOff: "no info",
    stateName: "ACTUAL"
  },
  "level.mode.fan": {
    iconOn: "fan",
    iconOff: "fan-off",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    textOn: "on",
    textOff: "off",
    stateName: "ACTUAL"
  },
  "level.timer": {
    iconOn: "timer",
    iconOff: "timer-off",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    textOn: "on",
    textOff: "off",
    stateName: "ACTUAL"
  },
  light: {
    iconOn: "lightbulb",
    iconOff: "lightbulb-outline",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    textOn: "on",
    textOff: "off",
    stateName: "ACTUAL"
  },
  lock: {
    iconOn: "lock-open",
    iconOff: "lock",
    colorOn: import_Color.Color.open,
    colorOff: import_Color.Color.close,
    textOn: "unlocked",
    textOff: "locked",
    stateName: "ACTUAL"
  },
  media: {
    iconOn: "play",
    iconOff: "pause",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    textOn: "play",
    textOff: "pause",
    stateName: "STATE"
  },
  motion: {
    iconOn: "motion",
    iconOff: "motion-outline",
    colorOn: import_Color.Color.attention,
    colorOff: import_Color.Color.off,
    textOn: "motion",
    textOff: "no motion",
    stateName: "ACTUAL"
  },
  rgb: {
    iconOn: "lightbulb",
    iconOff: "lightbulb-outline",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    textOn: "on",
    textOff: "off",
    stateName: "ACTUAL"
  },
  rgbSingle: {
    iconOn: "lightbulb",
    iconOff: "lightbulb-outline",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    textOn: "on",
    textOff: "off",
    stateName: "ACTUAL"
  },
  select: {
    iconOn: "menu-down",
    iconOff: "menu-down",
    colorOn: import_Color.Color.activated,
    colorOff: import_Color.Color.deactivated,
    textOn: "selected",
    textOff: "not selected",
    stateName: "ACTUAL"
  },
  "sensor.alarm.flood": {
    iconOn: "water-alert-outline",
    iconOff: "water-outline",
    colorOn: import_Color.Color.attention,
    colorOff: import_Color.Color.off,
    textOn: "alarm",
    textOff: "no alarm",
    stateName: "ACTUAL"
  },
  slider: {
    iconOn: "tune",
    iconOff: "tune",
    colorOn: import_Color.Color.good,
    colorOff: import_Color.Color.bad,
    textOn: "on",
    textOff: "off",
    stateName: "ACTUAL"
  },
  socket: {
    iconOn: "power-socket-de",
    iconOff: "power-plug-off",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    textOn: "on",
    textOff: "off",
    stateName: "ACTUAL"
  },
  temperature: {
    iconOn: "thermometer",
    iconOff: "thermometer",
    colorOn: import_Color.Color.hot,
    colorOff: import_Color.Color.cold,
    colorScale: { val_min: -20, val_max: 40, val_best: 22, mode: "quadriGradAnchor" },
    stateName: "ACTUAL"
  },
  thermostat: {
    iconOn: "thermostat",
    iconOff: "thermostat",
    colorOn: import_Color.Color.hot,
    colorOff: import_Color.Color.cold,
    colorScale: { val_min: -20, val_max: 40, val_best: 22, mode: "quadriGradAnchor" },
    stateName: "ACTUAL"
  },
  timeTable: {
    iconOn: "timetable",
    iconOff: "timetable",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    textOn: "on",
    textOff: "off",
    stateName: "ACTUAL"
  },
  "value.humidity": {
    iconOn: "water-percent",
    iconOff: "water-percent",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    colorScale: { val_min: 0, val_max: 100, val_best: 50, mode: "triGrad" },
    stateName: "ACTUAL"
  },
  "value.temperature": {
    iconOn: "thermostat",
    iconOff: "thermostat",
    colorOn: import_Color.Color.hot,
    colorOff: import_Color.Color.cold,
    colorScale: { val_min: -20, val_max: 40, val_best: 22, mode: "quadriGradAnchor" },
    stateName: "ACTUAL"
  },
  volume: {
    iconOn: "volume-high",
    iconOff: "volume-mute",
    colorOn: import_Color.Color.on,
    colorOff: import_Color.Color.off,
    stateName: "ACTUAL"
  },
  window: {
    iconOn: "window-open-variant",
    iconOff: "window-closed-variant",
    colorOn: import_Color.Color.open,
    colorOff: import_Color.Color.close,
    textOn: "open",
    textOff: "close",
    stateName: "ACTUAL"
  },
  warning: {
    iconOn: "alert-circle-outline",
    iconOff: "alert-circle-outline",
    colorOn: import_Color.Color.attention,
    colorOff: import_Color.Color.off,
    textOn: "warning",
    textOff: "no warning",
    stateName: "ACTUAL"
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ButtonNavigationDef
});
//# sourceMappingURL=button-navigation-def.js.map
