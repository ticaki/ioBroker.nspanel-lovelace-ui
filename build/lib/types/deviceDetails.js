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
var deviceDetails_exports = {};
__export(deviceDetails_exports, {
  DEVICE_DETAIL_NAME_PREFIX: () => DEVICE_DETAIL_NAME_PREFIX,
  DEVICE_DETAIL_ROW_ROLE: () => DEVICE_DETAIL_ROW_ROLE,
  DEVICE_PAGE_CHANNEL_ROLES: () => DEVICE_PAGE_CHANNEL_ROLES,
  DEVICE_PAGE_FIELDS: () => DEVICE_PAGE_FIELDS,
  DEVICE_PAGE_INFO_ROLE: () => DEVICE_PAGE_INFO_ROLE,
  DEVICE_PAGE_LAYOUTS: () => DEVICE_PAGE_LAYOUTS,
  DEVICE_PAGE_NAVIGATION_ICON: () => DEVICE_PAGE_NAVIGATION_ICON,
  DEVICE_PAGE_PROGRESS_ROLE: () => DEVICE_PAGE_PROGRESS_ROLE,
  DEVICE_PAGE_RECEIVE_BYTES: () => DEVICE_PAGE_RECEIVE_BYTES,
  DEVICE_PAGE_SLOT_LOOK_FIELDS: () => DEVICE_PAGE_SLOT_LOOK_FIELDS,
  DEVICE_PAGE_STATUS_COMMAND: () => DEVICE_PAGE_STATUS_COMMAND,
  DEVICE_PAGE_STATUS_INTERVAL_MS: () => DEVICE_PAGE_STATUS_INTERVAL_MS,
  DEVICE_PAGE_STATUS_MAX_BYTES: () => DEVICE_PAGE_STATUS_MAX_BYTES,
  DEVICE_PAGE_STATUS_MAX_PARTS: () => DEVICE_PAGE_STATUS_MAX_PARTS,
  DEVICE_PAGE_TEXT_FONT: () => DEVICE_PAGE_TEXT_FONT,
  DEVICE_PAGE_TEXT_MAX_BYTES: () => DEVICE_PAGE_TEXT_MAX_BYTES,
  SENDTO_GET_DEVICE_DETAILS_COMMAND: () => SENDTO_GET_DEVICE_DETAILS_COMMAND,
  buildDeviceDetailRows: () => buildDeviceDetailRows,
  defaultDevicePageConfig: () => defaultDevicePageConfig,
  defaultDevicePageSlots: () => defaultDevicePageSlots,
  deviceDetailEntriesOfRows: () => deviceDetailEntriesOfRows,
  deviceDetailEntryByKey: () => deviceDetailEntryByKey,
  deviceDetailEntryOfRow: () => deviceDetailEntryOfRow,
  deviceDetailEntryOfState: () => deviceDetailEntryOfState,
  deviceDetailGroupColorKey: () => deviceDetailGroupColorKey,
  deviceDetailIdentifier: () => deviceDetailIdentifier,
  deviceDetailMaskOf: () => deviceDetailMaskOf,
  deviceDetailMasks: () => deviceDetailMasks,
  deviceDetailNameKey: () => deviceDetailNameKey,
  deviceDetailRowKind: () => deviceDetailRowKind,
  deviceDetailRuleMatches: () => deviceDetailRuleMatches,
  deviceDetailSubNameTokens: () => deviceDetailSubNameTokens,
  deviceDetailSubNames: () => deviceDetailSubNames,
  deviceDetailsAdapter: () => deviceDetailsAdapter,
  deviceDetailsLearnedOf: () => deviceDetailsLearnedOf,
  deviceDetailsRuntimeOf: () => deviceDetailsRuntimeOf,
  devicePageChannelTakesLongPress: () => devicePageChannelTakesLongPress,
  devicePageChannelTakesNavigation: () => devicePageChannelTakesNavigation,
  devicePageConfigOf: () => devicePageConfigOf,
  devicePageHasStatusIcons: () => devicePageHasStatusIcons,
  devicePageProgressPercent: () => devicePageProgressPercent,
  devicePageSlotAccepts: () => devicePageSlotAccepts,
  devicePageSlotAcceptsChannel: () => devicePageSlotAcceptsChannel,
  devicePageSlotAcceptsNavigation: () => devicePageSlotAcceptsNavigation,
  devicePageSlotCount: () => devicePageSlotCount,
  devicePageSlotFields: () => devicePageSlotFields,
  devicePageSlotHasLook: () => devicePageSlotHasLook,
  devicePageSlotLookOf: () => devicePageSlotLookOf,
  devicePageSlotTakesLongPress: () => devicePageSlotTakesLongPress,
  devicePageSlotTakesNavigation: () => devicePageSlotTakesNavigation,
  devicePageSlotTargetOf: () => devicePageSlotTargetOf,
  deviceSelectionError: () => deviceSelectionError,
  deviceShortPressOf: () => deviceShortPressOf,
  exchangeDeviceDetailRowState: () => exchangeDeviceDetailRowState,
  fitDevicePageSlots: () => fitDevicePageSlots,
  generalDeviceDetailMask: () => generalDeviceDetailMask,
  hasCommonStatesList: () => hasCommonStatesList,
  hasOwnDeviceDetailMask: () => hasOwnDeviceDetailMask,
  isDeviceDetailState: () => isDeviceDetailState,
  isDeviceDetailsConfig: () => isDeviceDetailsConfig,
  isDevicePageLayout: () => isDevicePageLayout,
  isDeviceShortPressState: () => isDeviceShortPressState,
  tickDeviceDetailRow: () => tickDeviceDetailRow,
  tickedDeviceDetailRowsFirst: () => tickedDeviceDetailRowsFirst,
  updatedDeviceDetailsLearned: () => updatedDeviceDetailsLearned
});
module.exports = __toCommonJS(deviceDetails_exports);
var import_adminShareConfig = require("./adminShareConfig");
const SENDTO_GET_DEVICE_DETAILS_COMMAND = "getDeviceDetails";
const DEVICE_DETAIL_ROW_ROLE = "deviceDetail";
const DEVICE_PAGE_INFO_ROLE = "devicePageInfo";
const DEVICE_DETAIL_NAME_PREFIX = "deviceDetail_";
const deviceDetailGroupColorKey = {
  energy: "deviceEnergy",
  climate: "temperature",
  connection: "deviceConnection",
  info: "deviceInfo"
};
function isDeviceShortPressState(state) {
  return state.type === "boolean" && state.write;
}
function deviceShortPressOf(config) {
  switch (config.shortPress) {
    case "none":
    case "navigation":
    case "popup":
    case "devicePage":
      return config.shortPress;
    default:
      return "state";
  }
}
const DEVICE_PAGE_LAYOUTS = {
  /** "Steuern" (control): slots 7-10 are the 2x2 status icons right of the big icon */
  1: ["info", "info", "button", "button", "button", "button", "status", "status", "status", "status"],
  /** "Fortschritt" (progress) */
  2: ["value", "progress", "info", "info", "info", "button"],
  /** "Werte" (values) */
  3: ["info", "info", "info", "info", "info", "info", "switch", "switch"]
};
const DEVICE_PAGE_TEXT_FONT = 0;
const DEVICE_PAGE_STATUS_MAX_BYTES = 63;
const DEVICE_PAGE_STATUS_COMMAND = "devStatus";
const DEVICE_PAGE_STATUS_MAX_PARTS = 3;
const DEVICE_PAGE_STATUS_INTERVAL_MS = 3e3;
const DEVICE_PAGE_RECEIVE_BYTES = {
  1: 943,
  2: 875,
  3: 1019
};
const DEVICE_PAGE_TEXT_MAX_BYTES = 31;
const DEVICE_PAGE_FIELDS = {
  1: {
    mainName: 110,
    status: 390,
    slots: { info: { name: 164, value: 110 }, button: { name: 104 } },
    // at least one status icon: the 2x2 block stands right of the big icon, the info rows get narrower (empty status
    // slots inside the shown block stay empty grid cells)
    slotsWithStatus: { info: { name: 86, value: 110 } }
  },
  2: {
    mainName: 96,
    status: 390,
    slots: {
      value: { name: 190, value: 190, valueFont: 4 },
      progress: { name: 429 },
      info: { name: 104, value: 104 },
      button: { name: 100 }
    }
  },
  3: {
    mainName: 100,
    status: 390,
    slots: { info: { name: 125, value: 125 }, switch: { name: 125 } }
  }
};
function devicePageSlotCount(layout) {
  return DEVICE_PAGE_LAYOUTS[layout].length;
}
function devicePageHasStatusIcons(layout, slots) {
  return DEVICE_PAGE_LAYOUTS[layout].some((kind, i) => kind === "status" && !!slots[i]);
}
function devicePageSlotFields(layout, kind, withStatusIcons) {
  var _a, _b;
  const fields = DEVICE_PAGE_FIELDS[layout];
  return (_b = withStatusIcons ? (_a = fields.slotsWithStatus) == null ? void 0 : _a[kind] : void 0) != null ? _b : fields.slots[kind];
}
function devicePageSlotAccepts(kind, state) {
  const writable = state.write !== false;
  const button = state.read === false;
  switch (kind) {
    case "info":
    case "value":
    case "status":
      return true;
    case "button":
      return button || state.type === "boolean" && writable;
    case "switch":
      return !button && state.type === "boolean" && writable;
    case "progress":
      return !button && state.type === "number";
  }
}
const CHANNEL_SENSOR_ROLES = [
  "temperature",
  "value.temperature",
  "humidity",
  "value.humidity",
  "thermostat",
  "airCondition",
  "motion",
  "door",
  "window",
  "info",
  "warning"
];
const CHANNEL_SWITCH_ROLES = ["socket", "light", "dimmer", "hue", "rgb", "rgbSingle", "ct", "level.mode.fan"];
const CHANNEL_NUMBER_ROLES = ["slider", "volume"];
const CHANNEL_NO_VALUE_ROLES = ["button", "blind", "gate", "lock"];
const CHANNEL_TEXT_ROLES = ["select", "level.timer"];
const DEVICE_PAGE_CHANNEL_ROLES = {
  info: [
    ...CHANNEL_SWITCH_ROLES,
    ...CHANNEL_NUMBER_ROLES,
    ...CHANNEL_TEXT_ROLES,
    ...CHANNEL_NO_VALUE_ROLES,
    ...CHANNEL_SENSOR_ROLES
  ],
  value: [...CHANNEL_SENSOR_ROLES, ...CHANNEL_NUMBER_ROLES, ...CHANNEL_TEXT_ROLES, ...CHANNEL_SWITCH_ROLES],
  progress: CHANNEL_NUMBER_ROLES,
  button: [
    ...CHANNEL_SWITCH_ROLES,
    ...CHANNEL_NUMBER_ROLES,
    ...CHANNEL_TEXT_ROLES,
    ...CHANNEL_NO_VALUE_ROLES,
    ...CHANNEL_SENSOR_ROLES
  ],
  switch: CHANNEL_SWITCH_ROLES,
  status: [
    ...CHANNEL_SWITCH_ROLES,
    ...CHANNEL_NUMBER_ROLES,
    ...CHANNEL_TEXT_ROLES,
    ...CHANNEL_NO_VALUE_ROLES,
    ...CHANNEL_SENSOR_ROLES
  ]
};
function devicePageChannelTakesLongPress(role) {
  return role === "button" || role === "socket";
}
function devicePageSlotTakesLongPress(kind, ref, channelRole) {
  if (!ref) {
    return false;
  }
  return ref.custom === "channel" ? devicePageChannelTakesLongPress(channelRole) : kind === "button" || kind === "switch";
}
function devicePageSlotAcceptsChannel(kind, role) {
  return typeof role === "string" && DEVICE_PAGE_CHANNEL_ROLES[kind].includes(role);
}
const DEVICE_PAGE_PROGRESS_ROLE = "devicePageProgress";
function devicePageProgressPercent(value, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  let percent = value;
  if (typeof min === "number" && typeof max === "number" && max > min) {
    percent = (value - min) / (max - min) * 100;
  }
  return Math.min(100, Math.max(0, Math.round(percent)));
}
const DEVICE_PAGE_SLOT_LOOK_FIELDS = [
  "trueIcon",
  "falseIcon",
  "trueColor",
  "falseColor",
  "longPress",
  "name"
];
const DEVICE_PAGE_NAVIGATION_ICON = "gesture-tap-button";
function devicePageSlotAcceptsNavigation(kind) {
  return kind === "info" || kind === "button" || kind === "status";
}
const CHANNEL_POPUP_ON_TAP_ROLES = ["blind", "gate", "lock", "select", "level.timer"];
function devicePageChannelTakesNavigation(role) {
  return typeof role === "string" && DEVICE_PAGE_CHANNEL_ROLES.info.includes(role) && !CHANNEL_POPUP_ON_TAP_ROLES.includes(role);
}
function devicePageSlotTakesNavigation(ref, channelRole) {
  if (!ref) {
    return false;
  }
  return ref.custom === "channel" ? devicePageChannelTakesNavigation(channelRole) : true;
}
function devicePageSlotTargetOf(ref) {
  var _a;
  if (!ref) {
    return "";
  }
  return ref.custom === "navigation" || ref.isNavigation ? (_a = ref.targetPage) != null ? _a : "" : "";
}
function devicePageSlotLookOf(ref, withOlderIcon = true) {
  var _a;
  const legacy = !withOlderIcon || ref.trueIcon || ref.falseIcon ? "" : (_a = ref.icon) != null ? _a : "";
  const look = {};
  const trueIcon = ref.trueIcon || legacy;
  const falseIcon = ref.falseIcon || legacy;
  if (trueIcon) {
    look.trueIcon = trueIcon;
  }
  if (falseIcon) {
    look.falseIcon = falseIcon;
  }
  if (ref.trueColor) {
    look.trueColor = ref.trueColor;
  }
  if (ref.falseColor) {
    look.falseColor = ref.falseColor;
  }
  if (ref.scale) {
    look.scale = ref.scale;
  }
  if (ref.longPress) {
    look.longPress = ref.longPress;
  }
  if (ref.name) {
    look.name = ref.name;
  }
  if (ref.isNavigation && ref.custom !== "navigation") {
    look.isNavigation = true;
    if (ref.targetPage) {
      look.targetPage = ref.targetPage;
    }
  }
  return look;
}
function devicePageSlotHasLook(ref) {
  return !!ref && Object.keys(devicePageSlotLookOf(ref)).length > 0;
}
function fitDevicePageSlots(slots, layout) {
  return DEVICE_PAGE_LAYOUTS[layout].map((kind, i) => {
    const slot = slots[i];
    if (!slot) {
      return null;
    }
    const out = { ...slot };
    if (kind !== "status") {
      delete out.icon;
    }
    return out;
  });
}
function defaultDevicePageSlots(entries, layout) {
  const rows = entries.filter((e) => e.id !== "");
  let next = 0;
  return DEVICE_PAGE_LAYOUTS[layout].map((kind) => {
    if ((kind === "info" || kind === "value") && next < rows.length) {
      return { ...rows[next++] };
    }
    return null;
  });
}
function defaultDevicePageConfig(entries, layout = 1) {
  return { layout, slots: defaultDevicePageSlots(entries, layout), showInfo: true };
}
function isDevicePageLayout(value) {
  return value === 1 || value === 2 || value === 3;
}
function devicePageStateRefOf(value, keepIcon) {
  var _a;
  if (!isDeviceDetailEntryConfig(value) || value.id === "") {
    return null;
  }
  const ref = { key: value.key, id: value.id };
  const subName = (_a = value.subName) == null ? void 0 : _a.trim();
  if (subName) {
    ref.subName = subName;
  }
  const icon = keepIcon && "icon" in value && typeof value.icon === "string" ? value.icon.trim() : "";
  if (icon) {
    ref.icon = icon;
  }
  return ref;
}
function trimmedField(value, key) {
  var _a;
  const found = (_a = Object.entries(value).find(([k]) => k === key)) == null ? void 0 : _a[1];
  return typeof found === "string" ? found.trim() : "";
}
function devicePageSlotRefOf(value, kind) {
  if (!isDeviceDetailEntryConfig(value)) {
    return null;
  }
  let ref;
  const custom = "custom" in value ? value.custom : void 0;
  const targetPage = trimmedField(value, "targetPage");
  if (custom === "navigation") {
    ref = { key: "", id: "", custom };
    if (targetPage) {
      ref.targetPage = targetPage;
    }
  } else if (custom === "state" || custom === "channel") {
    ref = { key: "", id: value.id.trim(), custom };
  } else {
    ref = devicePageStateRefOf(value, kind === "status");
  }
  if (!ref) {
    return null;
  }
  for (const field of DEVICE_PAGE_SLOT_LOOK_FIELDS) {
    const text = trimmedField(value, field);
    if (text && (!field.endsWith("Color") || /^#[0-9a-f]{6}$/i.test(text))) {
      ref[field] = text;
    }
  }
  if (ref.trueIcon || ref.falseIcon) {
    delete ref.icon;
  }
  const scale = "scale" in value ? value.scale : void 0;
  if ((0, import_adminShareConfig.isIconColorScaleElement)(scale)) {
    ref.scale = { ...scale };
  }
  if (ref.custom !== "navigation" && "isNavigation" in value && value.isNavigation === true) {
    ref.isNavigation = true;
    if (targetPage) {
      ref.targetPage = targetPage;
    }
  }
  return ref;
}
function devicePageStatusRefOf(value) {
  if (isDeviceDetailEntryConfig(value) && "custom" in value && value.custom === true) {
    return { key: "", id: value.id.trim(), custom: true };
  }
  return devicePageStateRefOf(value, false);
}
function devicePageConfigOf(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return void 0;
  }
  const layout = "layout" in value && isDevicePageLayout(value.layout) ? value.layout : 1;
  const rawSlots = "slots" in value && Array.isArray(value.slots) ? value.slots : [];
  const slots = [];
  DEVICE_PAGE_LAYOUTS[layout].forEach((kind, i) => {
    slots.push(devicePageSlotRefOf(rawSlots[i], kind));
  });
  const config = {
    layout,
    slots,
    showInfo: !("showInfo" in value) || value.showInfo !== false
  };
  const icon = "icon" in value && typeof value.icon === "string" ? value.icon.trim() : "";
  if (icon) {
    config.icon = icon;
  }
  const status = "status" in value ? devicePageStatusRefOf(value.status) : null;
  if (status) {
    config.status = status;
  }
  return config;
}
function hasCommonStatesList(states) {
  if (Array.isArray(states)) {
    return states.length > 0;
  }
  return !!states && typeof states === "object" && Object.keys(states).length > 0;
}
function deviceDetailRowKind(common) {
  const writable = common.write !== false;
  if (common.read === false) {
    return "button";
  }
  if (common.type === "boolean") {
    return writable ? "switch" : "boolean";
  }
  if (writable && (common.type === "number" || common.type === "string") && hasCommonStatesList(common.states)) {
    return "select";
  }
  if (common.type === "number") {
    return "number";
  }
  return "text";
}
const generalDeviceDetailMask = {
  adapter: "",
  entries: [
    { key: "switch", group: "info", icon: "toggle-switch", rules: [{ role: "switch" }] },
    {
      key: "power",
      group: "energy",
      icon: "lightning-bolt",
      rules: [{ role: ["value.power", "value.power.active", "value.power.consumption"], unit: "W" }]
    },
    { key: "voltage", group: "energy", icon: "flash", rules: [{ role: "value.voltage" }] },
    { key: "current", group: "energy", icon: "current-ac", rules: [{ role: "value.current" }] },
    {
      key: "energy",
      group: "energy",
      icon: "counter",
      rules: [
        { role: ["value.energy", "value.energy.consumed", "value.energy.active"] },
        { role: "value.power.consumption", unit: "kWh" },
        { role: "value.power.consumption", unit: "Wh" }
      ]
    },
    { key: "battery", group: "energy", icon: "battery", rules: [{ role: "value.battery" }] },
    { key: "batteryVoltage", group: "energy", icon: "battery-charging", rules: [{ role: "battery.voltage" }] },
    { key: "lowBattery", group: "energy", icon: "battery-alert", rules: [{ role: "indicator.lowbat" }] },
    { key: "temperature", group: "climate", icon: "thermometer", rules: [{ role: "value.temperature" }] },
    { key: "setpoint", group: "climate", icon: "home-thermometer", rules: [{ role: "level.temperature" }] },
    { key: "humidity", group: "climate", icon: "water-percent", rules: [{ role: "value.humidity" }] },
    {
      key: "illuminance",
      group: "climate",
      icon: "brightness-5",
      rules: [{ role: ["value.brightness", "value.illuminance"] }]
    },
    { key: "pressure", group: "climate", icon: "gauge", rules: [{ role: "value.pressure" }] },
    { key: "rssi", group: "connection", icon: "wifi", rules: [{ role: "value.rssi" }] },
    { key: "reachable", group: "connection", icon: "lan-connect", rules: [{ role: "indicator.reachable" }] },
    { key: "unreachable", group: "connection", icon: "lan-disconnect", rules: [{ role: "indicator.unreach" }] },
    { key: "ip", group: "connection", icon: "ip-network", rules: [{ role: "info.ip" }] },
    { key: "firmware", group: "info", icon: "chip", rules: [{ role: "info.firmware" }] }
  ]
};
const deviceDetailMasks = [
  {
    // shellyplus1pm#…#1 / SHSW-1#…#1 - Relay0, Input0, Sys, … as sub folders
    adapter: "shelly",
    deviceLevel: 3,
    entries: [
      { key: "switch", group: "info", icon: "toggle-switch", rules: [{ role: "switch", dp: ".Switch" }] },
      { key: "power", group: "energy", icon: "lightning-bolt", rules: [{ role: "value.power", dp: ".Power" }] },
      { key: "voltage", group: "energy", icon: "flash", rules: [{ role: "value.voltage", dp: ".Voltage" }] },
      { key: "current", group: "energy", icon: "current-ac", rules: [{ role: "value.current", dp: ".Current" }] },
      // Gen2+: value.energy, Gen1 (Shelly 1PM, Plug S, …): value.power.consumption - both Wh in Relay0.Energy
      {
        key: "energy",
        group: "energy",
        icon: "counter",
        rules: [
          { role: "value.energy", dp: ".Energy" },
          { role: "value.power.consumption", dp: ".Energy" }
        ]
      },
      // every temperature comes as °C and °F pair, the °C state counts
      {
        key: "temperature",
        group: "climate",
        icon: "thermometer",
        rules: [{ role: "value.temperature", dp: ".temperatureC" }]
      },
      { key: "humidity", group: "climate", icon: "water-percent", rules: [{ role: "value.humidity" }] },
      // role value, unit dBm
      { key: "rssi", group: "connection", icon: "wifi", rules: [{ role: "value", dp: ".rssi" }] },
      {
        key: "reachable",
        group: "connection",
        icon: "lan-connect",
        rules: [{ role: "indicator.reachable", dp: ".online" }]
      },
      { key: "ip", group: "connection", icon: "ip-network", rules: [{ role: "info.ip", dp: ".hostname" }] },
      { key: "firmware", group: "info", icon: "chip", rules: [{ role: "state", dp: ".version" }] },
      // boolean "new firmware available"
      { key: "update", group: "info", icon: "update", rules: [{ role: "state", dp: ".firmware" }] },
      { key: "uptime", group: "info", icon: "timer-outline", rules: [{ role: "value.interval", dp: ".uptime" }] }
    ]
  },
  {
    // Tasmota devices, one channel per device, INFO as sub folder
    adapter: "sonoff",
    deviceLevel: 3,
    entries: [
      { key: "switch", group: "info", icon: "toggle-switch", rules: [{ role: "switch" }] },
      {
        key: "power",
        group: "energy",
        icon: "lightning-bolt",
        rules: [{ role: "value.power.consumption", dp: ".ENERGY_Power" }]
      },
      {
        key: "voltage",
        group: "energy",
        icon: "flash",
        rules: [{ role: "value.voltage", dp: ".ENERGY_Voltage" }]
      },
      {
        key: "current",
        group: "energy",
        icon: "current-ac",
        rules: [{ role: "value.current", dp: ".ENERGY_Current" }]
      },
      {
        key: "energyToday",
        group: "energy",
        icon: "counter",
        rules: [{ role: "value.energy.consumed", dp: ".ENERGY_Today" }]
      },
      {
        key: "energy",
        group: "energy",
        icon: "counter",
        rules: [{ role: "value.power.consumption", dp: ".ENERGY_Total" }]
      },
      { key: "temperature", group: "climate", icon: "thermometer", rules: [{ role: "value.temperature" }] },
      { key: "humidity", group: "climate", icon: "water-percent", rules: [{ role: "value.humidity" }] },
      { key: "illuminance", group: "climate", icon: "brightness-5", rules: [{ role: "value.illuminance" }] },
      // Wifi_RSSI (%) and Wifi_Signal (dBm) both have the role value.rssi - dBm like the other adapters
      { key: "rssi", group: "connection", icon: "wifi", rules: [{ role: "value.rssi", dp: ".Wifi_Signal" }] },
      { key: "reachable", group: "connection", icon: "lan-connect", rules: [{ role: "indicator.reachable" }] },
      { key: "ip", group: "connection", icon: "ip-network", rules: [{ role: "info.ip", dp: ".IPAddress" }] },
      { key: "firmware", group: "info", icon: "chip", rules: [{ role: "info.firmware", dp: ".Version" }] },
      {
        key: "uptime",
        group: "info",
        icon: "timer-outline",
        rules: [{ role: "value.interval", dp: ".UptimeSec" }]
      }
    ]
  },
  {
    // one device object per Zigbee device, all states directly below it
    adapter: "zigbee2mqtt",
    deviceLevel: 3,
    entries: [
      { key: "switch", group: "info", icon: "toggle-switch", rules: [{ role: "switch", dp: ".state" }] },
      { key: "power", group: "energy", icon: "lightning-bolt", rules: [{ role: "value.power" }] },
      { key: "voltage", group: "energy", icon: "flash", rules: [{ role: "value.voltage" }] },
      { key: "current", group: "energy", icon: "current-ac", rules: [{ role: "value.current" }] },
      {
        key: "energy",
        group: "energy",
        icon: "counter",
        rules: [{ role: "value.power.consumption", dp: ".energy" }]
      },
      { key: "battery", group: "energy", icon: "battery", rules: [{ role: "value.battery" }] },
      { key: "batteryVoltage", group: "energy", icon: "battery-charging", rules: [{ role: "battery.voltage" }] },
      { key: "lowBattery", group: "energy", icon: "battery-alert", rules: [{ role: "indicator.lowbat" }] },
      {
        key: "temperature",
        group: "climate",
        icon: "thermometer",
        rules: [{ role: "value.temperature", dp: ".temperature" }]
      },
      {
        key: "deviceTemperature",
        group: "climate",
        icon: "thermometer-lines",
        rules: [{ role: "value.temperature", dp: ".device_temperature" }]
      },
      { key: "humidity", group: "climate", icon: "water-percent", rules: [{ role: "value.humidity" }] },
      {
        key: "illuminance",
        group: "climate",
        icon: "brightness-5",
        rules: [{ role: "value.brightness", dp: ".illuminance" }]
      },
      { key: "pressure", group: "climate", icon: "gauge", rules: [{ role: "value.pressure" }] },
      {
        key: "linkQuality",
        group: "connection",
        icon: "signal",
        rules: [{ role: "state", dp: ".link_quality" }]
      },
      {
        key: "reachable",
        group: "connection",
        icon: "lan-connect",
        rules: [{ role: "indicator.reachable", dp: ".available" }]
      },
      {
        key: "lastSeen",
        group: "connection",
        icon: "clock-outline",
        rules: [{ role: "state", dp: ".last_seen" }]
      }
    ]
  },
  {
    // HomeMatic: hm-rpc.N.<serial>, the states lie in the channels :0, :1, … (sub folders)
    adapter: "hm-rpc",
    deviceLevel: 3,
    entries: [
      { key: "switch", group: "info", icon: "toggle-switch", rules: [{ role: "switch", dp: ".STATE" }] },
      { key: "power", group: "energy", icon: "lightning-bolt", rules: [{ role: "value.power" }] },
      { key: "current", group: "energy", icon: "current-ac", rules: [{ role: "value.current" }] },
      { key: "energy", group: "energy", icon: "counter", rules: [{ role: "value.power.consumption" }] },
      {
        key: "voltage",
        group: "energy",
        icon: "flash",
        rules: [{ role: "value.voltage", dp: ".OPERATING_VOLTAGE" }]
      },
      { key: "lowBattery", group: "energy", icon: "battery-alert", rules: [{ role: "indicator.lowbat" }] },
      {
        key: "temperature",
        group: "climate",
        icon: "thermometer",
        rules: [{ role: "value.temperature", dp: ".ACTUAL_TEMPERATURE" }]
      },
      {
        key: "setpoint",
        group: "climate",
        icon: "home-thermometer",
        rules: [{ role: "level.temperature", dp: ".SET_POINT_TEMPERATURE" }]
      },
      { key: "humidity", group: "climate", icon: "water-percent", rules: [{ role: "value.humidity" }] },
      { key: "rssi", group: "connection", icon: "wifi", rules: [{ role: "value.rssi", dp: ".RSSI_DEVICE" }] },
      {
        key: "unreachable",
        group: "connection",
        icon: "lan-disconnect",
        rules: [{ role: "indicator.unreach", dp: ".UNREACH" }]
      },
      { key: "update", group: "info", icon: "update", rules: [{ role: "indicator", dp: ".UPDATE_PENDING" }] }
    ]
  }
];
function deviceDetailsAdapter(id) {
  var _a;
  return (_a = id.split(".")[0]) != null ? _a : "";
}
function deviceDetailMaskOf(deviceId) {
  var _a;
  const adapter = deviceDetailsAdapter(deviceId);
  return (_a = deviceDetailMasks.find((m) => m.adapter === adapter)) != null ? _a : generalDeviceDetailMask;
}
function hasOwnDeviceDetailMask(deviceId) {
  return deviceDetailMaskOf(deviceId) !== generalDeviceDetailMask;
}
function deviceSelectionError(id, type) {
  if (type === void 0) {
    return "notFound";
  }
  if (type !== "device" && type !== "channel") {
    return "type";
  }
  const parts = id.split(".");
  const level = parts.length;
  if (level < 3) {
    return "root";
  }
  if (level === 3 && parts[2] === "info") {
    return "info";
  }
  const mask = deviceDetailMaskOf(id);
  if (mask.deviceLevel !== void 0 && mask.deviceLevel !== level) {
    return "level";
  }
  return void 0;
}
function isDeviceDetailState(deviceId, stateId) {
  if (!deviceId || !stateId.startsWith(`${deviceId}.`)) {
    return false;
  }
  const rest = stateId.slice(deviceId.length + 1).split(".");
  return rest.length >= 1 && rest.length <= 2 && rest.every((part) => part !== "");
}
function deviceDetailRuleMatches(rule, state) {
  if (rule.role === void 0 && rule.dp === void 0 && rule.unit === void 0) {
    return false;
  }
  if (rule.role !== void 0) {
    const roles = typeof rule.role === "string" ? [rule.role] : rule.role;
    if (!roles.includes(state.role)) {
      return false;
    }
  }
  if (rule.dp !== void 0 && !state.id.endsWith(rule.dp)) {
    return false;
  }
  if (rule.unit !== void 0 && state.unit !== rule.unit) {
    return false;
  }
  return true;
}
function deviceDetailEntryOfState(mask, state) {
  return mask.entries.find((entry) => entry.rules.some((rule) => deviceDetailRuleMatches(rule, state)));
}
function deviceDetailEntryByKey(deviceId, key) {
  var _a;
  if (!key) {
    return void 0;
  }
  return (_a = deviceDetailMaskOf(deviceId).entries.find((e) => e.key === key)) != null ? _a : generalDeviceDetailMask.entries.find((e) => e.key === key);
}
function deviceDetailEntryOfRow(deviceId, key, state) {
  var _a;
  return (_a = deviceDetailEntryByKey(deviceId, key)) != null ? _a : state ? deviceDetailEntryOfState(generalDeviceDetailMask, state) : void 0;
}
function deviceDetailNameKey(key) {
  return `${DEVICE_DETAIL_NAME_PREFIX}${key}`;
}
function deviceDetailIdentifier(deviceId, row) {
  if (row.key) {
    return row.key;
  }
  return `~${row.id.startsWith(`${deviceId}.`) ? row.id.slice(deviceId.length + 1) : row.id}`;
}
function buildDeviceDetailRows(deviceId, states, saved, learned) {
  var _a;
  const mask = deviceDetailMaskOf(deviceId);
  const own = states.filter((s) => isDeviceDetailState(deviceId, s.id)).sort((a, b) => a.id.localeCompare(b.id));
  const byEntry = /* @__PURE__ */ new Map();
  const rest = [];
  for (const state of own) {
    const entry = deviceDetailEntryOfState(mask, state);
    if (entry) {
      const list = (_a = byEntry.get(entry.key)) != null ? _a : [];
      list.push(state);
      byEntry.set(entry.key, list);
    } else {
      rest.push(state);
    }
  }
  const candidates = [];
  for (const entry of mask.entries) {
    const found = byEntry.get(entry.key);
    if (found && found.length > 0) {
      for (const state of found) {
        candidates.push({ key: entry.key, id: state.id, enabled: false });
      }
    } else if (mask !== generalDeviceDetailMask) {
      candidates.push({ key: entry.key, id: "", enabled: false });
    }
  }
  for (const state of rest) {
    candidates.push({ key: "", id: state.id, enabled: false });
  }
  const same = (a, b) => a.key === b.key && a.id === b.id;
  if (saved && saved.length > 0) {
    const first = [];
    for (const s of saved) {
      if (s.id !== "" && !first.some((f) => f.id === s.id)) {
        first.push(
          s.subName ? { key: s.key, id: s.id, enabled: true, subName: s.subName } : { key: s.key, id: s.id, enabled: true }
        );
      }
    }
    const others = [];
    for (const c of candidates) {
      if (first.some((f) => same(f, c))) {
        continue;
      }
      const row = c.id !== "" && first.some((f) => f.id === c.id) ? { ...c, id: "" } : c;
      if (row.id === "" && (row.key === "" || others.some((r) => same(r, row)) || first.some((f) => f.key === row.key))) {
        continue;
      }
      others.push(row);
    }
    return [...first, ...others];
  }
  if (learned !== void 0) {
    const first = [];
    for (const ident of learned) {
      for (const c of candidates) {
        if (c.id && deviceDetailIdentifier(deviceId, c) === ident && !first.some((f) => same(f, c))) {
          first.push({ ...c, enabled: true });
        }
      }
    }
    return [...first, ...candidates.filter((c) => !first.some((f) => same(f, c)))];
  }
  return candidates.map((c) => ({ ...c, enabled: c.key !== "" && c.id !== "" }));
}
function deviceDetailEntriesOfRows(rows) {
  var _a;
  const out = [];
  for (const r of rows) {
    if (r.enabled && r.id !== "" && !out.some((o) => o.id === r.id)) {
      const subName = (_a = r.subName) == null ? void 0 : _a.trim();
      out.push(subName ? { key: r.key, id: r.id, subName } : { key: r.key, id: r.id });
    }
  }
  return out;
}
function exchangeDeviceDetailRowState(rows, index, id, change = {}) {
  const row = rows[index];
  if (!row) {
    return [...rows];
  }
  const old = row.id;
  const out = [];
  rows.forEach((r, i) => {
    if (i === index) {
      out.push({ ...r, ...change, id, enabled: id !== "" && (r.enabled || old === "") });
    } else if (id !== "" && r.id === id) {
      if (old !== "") {
        out.push({ ...r, id: old });
      } else if (r.key !== "") {
        out.push({ ...r, id: "", enabled: false });
      }
    } else {
      out.push(r);
    }
  });
  return out;
}
function tickedDeviceDetailRowsFirst(rows) {
  return [...rows.filter((r) => r.enabled), ...rows.filter((r) => !r.enabled)];
}
function tickDeviceDetailRow(rows, index, enabled) {
  const row = rows[index];
  if (!row) {
    return [...rows];
  }
  const others = tickedDeviceDetailRowsFirst(rows.filter((_r, i) => i !== index));
  const border = others.filter((r) => r.enabled).length;
  return [...others.slice(0, border), { ...row, enabled }, ...others.slice(border)];
}
function isDeviceDetailEntryConfig(value) {
  return !!value && typeof value === "object" && "key" in value && typeof value.key === "string" && "id" in value && typeof value.id === "string" && (!("subName" in value) || value.subName === void 0 || typeof value.subName === "string");
}
function isDeviceDetailsConfig(value) {
  return !!value && typeof value === "object" && "deviceId" in value && typeof value.deviceId === "string" && value.deviceId !== "" && "entries" in value && Array.isArray(value.entries) && value.entries.every(isDeviceDetailEntryConfig);
}
function deviceDetailsRuntimeOf(config) {
  if (!isDeviceDetailsConfig(config)) {
    return void 0;
  }
  const runtime = {
    deviceId: config.deviceId,
    entries: config.entries.filter((e) => e.id !== "").map((e) => {
      var _a;
      const subName = (_a = e.subName) == null ? void 0 : _a.trim();
      return subName ? { key: e.key, id: e.id, subName } : { key: e.key, id: e.id };
    })
  };
  const page = devicePageConfigOf(config.devicePage);
  if (page) {
    const devicePage = {
      layout: page.layout,
      // an own data point or channel that is not entered yet, a navigation slot without target page or in a
      // slot that needs a value: an empty slot
      slots: page.slots.map((slot, i) => {
        if (!slot) {
          return null;
        }
        if (slot.custom === "navigation") {
          const kind = DEVICE_PAGE_LAYOUTS[page.layout][i];
          return slot.targetPage && kind && devicePageSlotAcceptsNavigation(kind) ? slot : null;
        }
        return slot.id !== "" ? slot : null;
      }),
      // without rows the detail page would be empty: no info icon
      showInfo: page.showInfo && runtime.entries.length > 0,
      shortPress: deviceShortPressOf(config)
    };
    if (page.icon) {
      devicePage.icon = page.icon;
    }
    if (page.status && page.status.id !== "") {
      devicePage.status = page.status;
    }
    runtime.devicePage = devicePage;
  }
  return runtime;
}
function deviceDetailsLearnedOf(value) {
  const out = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return out;
  }
  for (const [adapter, list] of Object.entries(value)) {
    if (Array.isArray(list) && list.every((v) => typeof v === "string")) {
      out[adapter] = [...list];
    }
  }
  return out;
}
function updatedDeviceDetailsLearned(learned, before, after, edited) {
  if (!after.deviceId || !edited) {
    return void 0;
  }
  const identifiers = (config) => config.entries.map((e) => deviceDetailIdentifier(config.deviceId, e));
  const now = identifiers(after);
  if (before && before.deviceId === after.deviceId && JSON.stringify(identifiers(before)) === JSON.stringify(now)) {
    return void 0;
  }
  const adapter = deviceDetailsAdapter(after.deviceId);
  if (JSON.stringify(learned[adapter]) === JSON.stringify(now)) {
    return void 0;
  }
  return { ...learned, [adapter]: now };
}
function restOfId(deviceId, id) {
  return id.startsWith(`${deviceId}.`) ? id.slice(deviceId.length + 1) : id;
}
function deviceDetailSubNameTokens(rest) {
  var _a, _b;
  const parts = rest.split(".");
  const end = (_a = parts[parts.length - 1]) != null ? _a : "";
  const folders = parts.slice(0, -1).filter(Boolean);
  return [...folders, ...(_b = end.match(new RegExp("\\p{Lu}+(?!\\p{Ll})|\\p{Lu}?\\p{Ll}+|\\p{L}+|\\d+", "gu"))) != null ? _b : []];
}
function groupSubNames(rests) {
  const tokens = rests.map(deviceDetailSubNameTokens);
  const sets = tokens.map((t) => new Set(t));
  const texts = tokens.map((t) => t.filter((token) => !sets.every((s) => s.has(token))).join(" "));
  return texts.map(
    (text, index) => !text || texts.some((other, i) => i !== index && other === text) ? rests[index] : text
  );
}
function deviceDetailSubNames(deviceId, rows) {
  const groups = /* @__PURE__ */ new Map();
  rows.forEach((r, index) => {
    var _a;
    return groups.set(r.name, [...(_a = groups.get(r.name)) != null ? _a : [], index]);
  });
  const autos = rows.map((r) => restOfId(deviceId, r.id));
  for (const members of groups.values()) {
    if (members.length > 1) {
      const texts = groupSubNames(members.map((i) => autos[i]));
      members.forEach((rowIndex, i) => {
        autos[rowIndex] = texts[i];
      });
    }
  }
  return rows.map((r, index) => {
    var _a, _b, _c, _d;
    const duplicate = ((_b = (_a = groups.get(r.name)) == null ? void 0 : _a.length) != null ? _b : 0) > 1;
    const auto = autos[index];
    const own = (_d = (_c = r.subName) == null ? void 0 : _c.trim()) != null ? _d : "";
    return { duplicate, auto, text: own || (duplicate ? auto : "") };
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEVICE_DETAIL_NAME_PREFIX,
  DEVICE_DETAIL_ROW_ROLE,
  DEVICE_PAGE_CHANNEL_ROLES,
  DEVICE_PAGE_FIELDS,
  DEVICE_PAGE_INFO_ROLE,
  DEVICE_PAGE_LAYOUTS,
  DEVICE_PAGE_NAVIGATION_ICON,
  DEVICE_PAGE_PROGRESS_ROLE,
  DEVICE_PAGE_RECEIVE_BYTES,
  DEVICE_PAGE_SLOT_LOOK_FIELDS,
  DEVICE_PAGE_STATUS_COMMAND,
  DEVICE_PAGE_STATUS_INTERVAL_MS,
  DEVICE_PAGE_STATUS_MAX_BYTES,
  DEVICE_PAGE_STATUS_MAX_PARTS,
  DEVICE_PAGE_TEXT_FONT,
  DEVICE_PAGE_TEXT_MAX_BYTES,
  SENDTO_GET_DEVICE_DETAILS_COMMAND,
  buildDeviceDetailRows,
  defaultDevicePageConfig,
  defaultDevicePageSlots,
  deviceDetailEntriesOfRows,
  deviceDetailEntryByKey,
  deviceDetailEntryOfRow,
  deviceDetailEntryOfState,
  deviceDetailGroupColorKey,
  deviceDetailIdentifier,
  deviceDetailMaskOf,
  deviceDetailMasks,
  deviceDetailNameKey,
  deviceDetailRowKind,
  deviceDetailRuleMatches,
  deviceDetailSubNameTokens,
  deviceDetailSubNames,
  deviceDetailsAdapter,
  deviceDetailsLearnedOf,
  deviceDetailsRuntimeOf,
  devicePageChannelTakesLongPress,
  devicePageChannelTakesNavigation,
  devicePageConfigOf,
  devicePageHasStatusIcons,
  devicePageProgressPercent,
  devicePageSlotAccepts,
  devicePageSlotAcceptsChannel,
  devicePageSlotAcceptsNavigation,
  devicePageSlotCount,
  devicePageSlotFields,
  devicePageSlotHasLook,
  devicePageSlotLookOf,
  devicePageSlotTakesLongPress,
  devicePageSlotTakesNavigation,
  devicePageSlotTargetOf,
  deviceSelectionError,
  deviceShortPressOf,
  exchangeDeviceDetailRowState,
  fitDevicePageSlots,
  generalDeviceDetailMask,
  hasCommonStatesList,
  hasOwnDeviceDetailMask,
  isDeviceDetailState,
  isDeviceDetailsConfig,
  isDevicePageLayout,
  isDeviceShortPressState,
  tickDeviceDetailRow,
  tickedDeviceDetailRowsFirst,
  updatedDeviceDetailsLearned
});
//# sourceMappingURL=deviceDetails.js.map
