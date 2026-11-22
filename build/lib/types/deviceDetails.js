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
  SENDTO_GET_DEVICE_DETAILS_COMMAND: () => SENDTO_GET_DEVICE_DETAILS_COMMAND,
  buildDeviceDetailRows: () => buildDeviceDetailRows,
  deviceDetailAutoSubName: () => deviceDetailAutoSubName,
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
  deviceDetailSubNames: () => deviceDetailSubNames,
  deviceDetailsAdapter: () => deviceDetailsAdapter,
  deviceDetailsLearnedOf: () => deviceDetailsLearnedOf,
  deviceDetailsRuntimeOf: () => deviceDetailsRuntimeOf,
  deviceSelectionError: () => deviceSelectionError,
  deviceShortPressOf: () => deviceShortPressOf,
  exchangeDeviceDetailRowState: () => exchangeDeviceDetailRowState,
  generalDeviceDetailMask: () => generalDeviceDetailMask,
  hasCommonStatesList: () => hasCommonStatesList,
  hasOwnDeviceDetailMask: () => hasOwnDeviceDetailMask,
  isDeviceDetailState: () => isDeviceDetailState,
  isDeviceDetailsConfig: () => isDeviceDetailsConfig,
  isDeviceShortPressState: () => isDeviceShortPressState,
  tickDeviceDetailRow: () => tickDeviceDetailRow,
  tickedDeviceDetailRowsFirst: () => tickedDeviceDetailRowsFirst,
  updatedDeviceDetailsLearned: () => updatedDeviceDetailsLearned
});
module.exports = __toCommonJS(deviceDetails_exports);
const SENDTO_GET_DEVICE_DETAILS_COMMAND = "getDeviceDetails";
const DEVICE_DETAIL_ROW_ROLE = "deviceDetail";
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
      return config.shortPress;
    default:
      return "state";
  }
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
  return {
    deviceId: config.deviceId,
    entries: config.entries.filter((e) => e.id !== "").map((e) => ({ key: e.key, id: e.id }))
  };
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
function updatedDeviceDetailsLearned(learned, before, after) {
  if (!after.deviceId) {
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
function deviceDetailAutoSubName(deviceId, id) {
  var _a, _b;
  const rest = id.startsWith(`${deviceId}.`) ? id.slice(deviceId.length + 1) : id;
  const parts = rest.split(".");
  const end = (_a = parts[parts.length - 1]) != null ? _a : "";
  const folder = parts.slice(0, -1).join(".");
  const digits = ((_b = end.match(/\d+/g)) != null ? _b : []).join(" ");
  return [folder, digits].filter(Boolean).join(" ") || end;
}
function deviceDetailSubNames(deviceId, rows) {
  var _a;
  const count = /* @__PURE__ */ new Map();
  for (const r of rows) {
    count.set(r.name, ((_a = count.get(r.name)) != null ? _a : 0) + 1);
  }
  const autos = rows.map((r) => deviceDetailAutoSubName(deviceId, r.id));
  return rows.map((r, index) => {
    var _a2, _b, _c;
    const duplicate = ((_a2 = count.get(r.name)) != null ? _a2 : 0) > 1;
    let auto = autos[index];
    if (duplicate && rows.some((o, i) => i !== index && o.name === r.name && autos[i] === auto)) {
      auto = r.id.startsWith(`${deviceId}.`) ? r.id.slice(deviceId.length + 1) : r.id;
    }
    const own = (_c = (_b = r.subName) == null ? void 0 : _b.trim()) != null ? _c : "";
    return { duplicate, auto, text: own || (duplicate ? auto : "") };
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEVICE_DETAIL_NAME_PREFIX,
  DEVICE_DETAIL_ROW_ROLE,
  SENDTO_GET_DEVICE_DETAILS_COMMAND,
  buildDeviceDetailRows,
  deviceDetailAutoSubName,
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
  deviceDetailSubNames,
  deviceDetailsAdapter,
  deviceDetailsLearnedOf,
  deviceDetailsRuntimeOf,
  deviceSelectionError,
  deviceShortPressOf,
  exchangeDeviceDetailRowState,
  generalDeviceDetailMask,
  hasCommonStatesList,
  hasOwnDeviceDetailMask,
  isDeviceDetailState,
  isDeviceDetailsConfig,
  isDeviceShortPressState,
  tickDeviceDetailRow,
  tickedDeviceDetailRowsFirst,
  updatedDeviceDetailsLearned
});
//# sourceMappingURL=deviceDetails.js.map
