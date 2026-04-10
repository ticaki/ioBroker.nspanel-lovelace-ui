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
var page_item_defaults_exports = {};
__export(page_item_defaults_exports, {
  getPageItemDefaultsByRole: () => getPageItemDefaultsByRole,
  getPageNaviItemDefaultsByRole: () => getPageNaviItemDefaultsByRole,
  pageItemDefaults: () => pageItemDefaults,
  pageNaviItemDefaults: () => pageNaviItemDefaults
});
module.exports = __toCommonJS(page_item_defaults_exports);
const pageItemDefaults = {
  // ── On/Off switches ───────────────────────────────────────────────────────
  socket: {
    iconOn: "power",
    iconOff: "power-standby",
    colorOn: "on",
    colorOff: "off"
  },
  /** Applied when item.role === 'socket' inside case 'socket'. */
  socketPlug: {
    iconOn: "power-socket-de",
    iconOff: "power-socket-de",
    colorOn: "on",
    colorOff: "off"
  },
  // ── Lights ────────────────────────────────────────────────────────────────
  light: {
    iconOn: "lightbulb",
    iconOff: "lightbulb-outline",
    colorOn: "light",
    colorOff: "dark"
  },
  dimmer: {
    iconOn: "lightbulb",
    iconOff: "lightbulb-outline",
    colorOn: "light",
    colorOff: "dark"
  },
  /** Covers case 'ct' */
  ct: {
    iconOn: "lightbulb",
    iconOff: "lightbulb-outline",
    colorOn: "light",
    colorOff: "dark"
  },
  /** Covers case 'rgb' */
  rgb: {
    iconOn: "lightbulb",
    iconOff: "lightbulb-outline",
    colorOn: "light",
    colorOff: "dark"
  },
  /** Covers case 'hue' */
  hue: {
    iconOn: "lightbulb",
    iconOff: "lightbulb-outline",
    colorOn: "light",
    colorOff: "dark"
  },
  /** Covers case 'rgbSingle' */
  rgbSingle: {
    iconOn: "lightbulb",
    iconOff: "lightbulb-outline",
    colorOn: "light",
    colorOff: "dark"
  },
  // ── Button ────────────────────────────────────────────────────────────────
  button: {
    iconOn: "gesture-tap-button",
    iconOff: "gesture-tap-button",
    colorOn: "activated",
    colorOff: "deactivated"
  },
  // ── Shutters / blinds ─────────────────────────────────────────────────────
  blind: {
    iconOn: "window-shutter-open",
    iconOff: "window-shutter",
    iconUnstable: "window-shutter-alert",
    colorOn: "open",
    colorOff: "close"
  },
  /** Default icons for individual shutterIcon entries (shutter2 variant). */
  shutterSlaveIcon: {
    iconOn: "window-shutter",
    iconOff: "window-shutter",
    colorOn: "open",
    colorOff: "close"
  },
  // ── Gate ──────────────────────────────────────────────────────────────────
  gate: {
    iconOn: "garage-open",
    iconOff: "garage",
    iconUnstable: "garage-alert",
    colorOn: "open",
    colorOff: "close"
  },
  // ── Sensors ───────────────────────────────────────────────────────────────
  motion: {
    iconOn: "motion-sensor",
    iconOff: "motion-sensor",
    colorOn: "good",
    colorOff: "bad"
  },
  door: {
    iconOn: "door-open",
    iconOff: "door-closed",
    iconUnstable: "door-closed",
    colorOn: "good",
    colorOff: "bad"
  },
  window: {
    iconOn: "window-open-variant",
    iconOff: "window-closed-variant",
    iconUnstable: "window-closed-variant",
    colorOn: "good",
    colorOff: "bad"
  },
  /**
   * Covers cases: 'thermostat', 'airCondition', 'temperature', 'value.temperature'.
   * All share identical icon/color defaults.
   */
  thermostat: {
    iconOn: "thermometer",
    iconOff: "snowflake-thermometer",
    iconUnstable: "sun-thermometer",
    colorOn: "good",
    colorOff: "bad"
  },
  /**
   * Covers cases: 'humidity', 'value.humidity'.
   */
  humidity: {
    iconOn: "water-percent",
    iconOff: "water-off",
    iconUnstable: "water-percent-alert",
    colorOn: "good",
    colorOff: "bad"
  },
  // ── Info ──────────────────────────────────────────────────────────────────
  /**
   * Fallback icons when item has no icon and no USERICON state.
   * Colors are fallbacks when neither item color nor COLORDEC state is available.
   */
  info: {
    iconOn: "information-outline",
    iconOff: "information-off-outline",
    colorOn: "bad",
    colorOff: "bad"
  },
  // ── Volume ────────────────────────────────────────────────────────────────
  /**
   * colorOn / colorOff apply both to the outer template color and to the
   * inner icon constVal color.  innerIconMute is the icon shown when muted.
   */
  volume: {
    iconOn: "volume-mute",
    // inner icon – muted / off state
    iconOff: "volume-mute",
    // inner icon – muted / off state (same)
    colorOn: "on",
    colorOff: "off"
  },
  // ── Select ────────────────────────────────────────────────────────────────
  /**
   * colorOn / colorOff reference concrete named colors (Color.Green / Color.Red),
   * used directly as constVal (not through getIconColor).
   */
  select: {
    iconOn: "clipboard-list-outline",
    iconOff: "clipboard-list",
    colorOn: "Green",
    colorOff: "Red"
  },
  // ── Lock ──────────────────────────────────────────────────────────────────
  lock: {
    iconOn: "lock-open-variant",
    iconOff: "lock",
    colorOn: "open",
    colorOff: "close"
  },
  // ── Slider ────────────────────────────────────────────────────────────────
  slider: {
    iconOn: "plus-minus-variant",
    iconOff: "",
    colorOn: "activated",
    colorOff: "deactivated"
  },
  // ── Warning ───────────────────────────────────────────────────────────────
  warning: {
    iconOn: "alert-decagram-outline",
    iconOff: "alert-decagram-outline",
    colorOn: "attention",
    colorOff: "deactivated"
  },
  // ── Timer ─────────────────────────────────────────────────────────────────
  /**
   * 'iconOn' / 'iconOff' are the absolute fallbacks (no SET, no ACTUAL state).
   * The additional conditional icon names are chosen based on isAlarm and
   * available foundedStates in config-manager.
   */
  timer: {
    iconOn: "timer",
    iconOff: "timer-off",
    // conditional icons - normal (non-alarm) mode
    iconOnEdit: "timer-edit-outline",
    // has SET state
    iconOnOutline: "timer-outline",
    // has ACTUAL state but no SET
    iconOffOutline: "timer-off-outline",
    // has SET or ACTUAL state - false side
    // conditional icons - alarm mode
    iconAlarm: "alarm",
    // isAlarm + no SET
    iconAlarmEdit: "clock-edit-outline",
    // isAlarm + has SET
    iconAlarmOff: "alarm-off",
    // isAlarm - false side
    colorOn: "activated",
    colorOff: "deactivated"
  },
  // ── Fan ───────────────────────────────────────────────────────────────────
  /**
   * colorOn / colorOff reference concrete named colors (Color.Green / Color.Red),
   * used directly as constVal.
   */
  fan: {
    iconOn: "fan",
    iconOff: "fan-off",
    colorOn: "Green",
    colorOff: "Red"
  },
  // ── Media ─────────────────────────────────────────────────────────────────
  /** Used when item.asControl is true (direct play/pause control). */
  media: {
    iconOn: "pause",
    iconOff: "play",
    colorOn: "on",
    colorOff: "off"
  },
  /** Used when item.asControl is false (navigation to a media page). */
  mediaNav: {
    iconOn: "play-box-multiple",
    iconOff: "play-box-multiple-outline",
    colorOn: "activated",
    colorOff: "deactivated"
  }
};
const pageNaviItemDefaults = {
  // ── Custom / button-without-id ────────────────────────────────────────────
  /** Used for item.type === 'custom' and for items without an id. */
  custom: {
    iconOn: "gesture-tap-button",
    iconOff: "gesture-tap-button",
    colorOn: "activated",
    colorOff: "deactivated"
  },
  // ── On/Off switch ─────────────────────────────────────────────────────────
  socket: {
    iconOn: "power",
    iconOff: "power-standby",
    colorOn: "on",
    colorOff: "off"
  },
  // ── Lights ────────────────────────────────────────────────────────────────
  /** Covers cases: 'light', 'dimmer', 'hue', 'rgb', 'rgbSingle', 'ct'. */
  light: {
    iconOn: "lightbulb",
    iconOff: "lightbulb-outline",
    colorOn: "light",
    colorOff: "dark"
  },
  // ── Button / undefined role ───────────────────────────────────────────────
  button: {
    iconOn: "gesture-tap-button",
    iconOff: "gesture-tap-button",
    colorOn: "activated",
    colorOff: "deactivated"
  },
  // ── Humidity ──────────────────────────────────────────────────────────────
  /** Covers cases: 'humidity', 'value.humidity'. Icons from template. */
  humidity: {
    iconOn: "water-percent",
    iconOff: "water-percent",
    colorOn: "cold",
    colorOff: "hot",
    template: "button.humidity"
  },
  // ── Temperature ───────────────────────────────────────────────────────────
  /** Covers cases: 'thermostat', 'airCondition', 'temperature', 'value.temperature'. Icons from template. */
  thermostat: {
    iconOn: "temperature-celsius",
    iconOff: "temperature-celsius",
    colorOn: "hot",
    colorOff: "cold",
    template: "button.temperature"
  },
  // ── Gate ──────────────────────────────────────────────────────────────────
  /** Icons from template 'text.gate.isOpen'. */
  gate: {
    iconOn: "garage-open",
    iconOff: "garage",
    colorOn: "open",
    colorOff: "close",
    template: "text.gate.isOpen"
  },
  // ── Door ──────────────────────────────────────────────────────────────────
  /** Icons from template 'text.door.isOpen'. */
  door: {
    iconOn: "door-open",
    iconOff: "door-closed",
    colorOn: "open",
    colorOff: "close",
    template: "text.door.isOpen"
  },
  // ── Window ────────────────────────────────────────────────────────────────
  /** Icons from template 'text.window.isOpen'. */
  window: {
    iconOn: "window-open-variant",
    iconOff: "window-closed-variant",
    colorOn: "open",
    colorOff: "close",
    template: "text.window.isOpen"
  },
  // ── Media navigation ──────────────────────────────────────────────────────
  media: {
    iconOn: "play-box-multiple",
    iconOff: "play-box-multiple-outline",
    colorOn: "activated",
    colorOff: "deactivated"
  },
  // ── Motion sensor ─────────────────────────────────────────────────────────
  /** Icons from template 'text.motion'. */
  motion: {
    iconOn: "motion-sensor",
    iconOff: "motion-sensor",
    colorOn: "attention",
    colorOff: "deactivated",
    template: "text.motion"
  },
  // ── Volume ────────────────────────────────────────────────────────────────
  /** Icons from template 'button.volume' (dynamic in practice). */
  volume: {
    iconOn: "volume-mute",
    iconOff: "volume-mute",
    colorOn: "activated",
    colorOff: "deactivated",
    template: "button.volume"
  },
  // ── Warning ───────────────────────────────────────────────────────────────
  /** Icons from template 'text.warning'. No static off-icon in template. */
  warning: {
    iconOn: "alert-outline",
    iconOff: "",
    colorOn: "attention",
    colorOff: "deactivated",
    template: "text.warning"
  },
  // ── Info ──────────────────────────────────────────────────────────────────
  info: {
    iconOn: "information-outline",
    iconOff: "information-off-outline",
    colorOn: "activated",
    colorOff: "deactivated"
  },
  // ── Blind / shutter ───────────────────────────────────────────────────────
  /** Icons from template 'text.shutter.navigation'. */
  blind: {
    iconOn: "window-shutter-open",
    iconOff: "window-shutter",
    colorOn: "open",
    colorOff: "close",
    template: "text.shutter.navigation"
  },
  // ── Select ────────────────────────────────────────────────────────────────
  /** Icons from template 'button.select'. */
  select: {
    iconOn: "clipboard-list-outline",
    iconOff: "clipboard-list",
    colorOn: "activated",
    colorOff: "deactivated",
    template: "button.select"
  },
  // ── Lock ──────────────────────────────────────────────────────────────────
  /** Icons from template 'text.lock'. */
  lock: {
    iconOn: "lock-open-variant",
    iconOff: "lock",
    colorOn: "open",
    colorOff: "close",
    template: "text.lock"
  },
  // ── Slider ────────────────────────────────────────────────────────────────
  /** Icons from template 'button.slider'. No static off-icon in template. */
  slider: {
    iconOn: "plus-minus-variant",
    iconOff: "",
    colorOn: "good",
    colorOff: "bad",
    template: "button.slider"
  },
  // ── Timer ─────────────────────────────────────────────────────────────────
  timer: {
    iconOn: "timer",
    iconOff: "timer-off",
    colorOn: "activated",
    colorOff: "deactivated"
  },
  // ── Fan ───────────────────────────────────────────────────────────────────
  fan: {
    iconOn: "fan",
    iconOff: "fan-off",
    colorOn: "Green",
    colorOff: "Red"
  },
  // ── Time table ────────────────────────────────────────────────────────────
  /**
   * Icons are fully dynamic (fetched from VEHICLE state).
   * Empty strings indicate no static fallback.
   */
  timeTable: {
    iconOn: "",
    iconOff: "",
    colorOn: "Red",
    colorOff: "Green",
    template: "button.alias.fahrplan.departure"
  }
};
const ITEM_ROLE_KEY = {
  socket: "socket",
  light: "light",
  dimmer: "dimmer",
  ct: "ct",
  rgb: "rgb",
  hue: "hue",
  rgbSingle: "rgbSingle",
  button: "button",
  blind: "blind",
  gate: "gate",
  motion: "motion",
  door: "door",
  window: "window",
  thermostat: "thermostat",
  airCondition: "thermostat",
  temperature: "thermostat",
  "value.temperature": "thermostat",
  humidity: "humidity",
  "value.humidity": "humidity",
  info: "info",
  volume: "volume",
  select: "select",
  lock: "lock",
  slider: "slider",
  warning: "warning",
  "level.timer": "timer",
  "level.mode.fan": "fan",
  media: "mediaNav"
};
const NAVI_ROLE_KEY = {
  socket: "socket",
  light: "light",
  dimmer: "light",
  hue: "light",
  rgb: "light",
  rgbSingle: "light",
  ct: "light",
  button: "button",
  humidity: "humidity",
  "value.humidity": "humidity",
  thermostat: "thermostat",
  airCondition: "thermostat",
  temperature: "thermostat",
  "value.temperature": "thermostat",
  gate: "gate",
  door: "door",
  window: "window",
  media: "media",
  motion: "motion",
  volume: "volume",
  warning: "warning",
  info: "info",
  blind: "blind",
  select: "select",
  lock: "lock",
  slider: "slider",
  "level.timer": "timer",
  "level.mode.fan": "fan",
  timeTable: "timeTable"
};
function getPageItemDefaultsByRole(role) {
  const key = ITEM_ROLE_KEY[role];
  return key != null ? pageItemDefaults[key] : null;
}
function getPageNaviItemDefaultsByRole(role) {
  const key = NAVI_ROLE_KEY[role];
  return key != null ? pageNaviItemDefaults[key] : null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPageItemDefaultsByRole,
  getPageNaviItemDefaultsByRole,
  pageItemDefaults,
  pageNaviItemDefaults
});
//# sourceMappingURL=page-item-defaults.js.map
