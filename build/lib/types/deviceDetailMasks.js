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
var deviceDetailMasks_exports = {};
__export(deviceDetailMasks_exports, {
  deviceDetailMasks: () => deviceDetailMasks,
  generalDeviceDetailMask: () => generalDeviceDetailMask
});
module.exports = __toCommonJS(deviceDetailMasks_exports);
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
    {
      key: "lowBattery",
      group: "energy",
      icon: "battery-alert",
      rules: [{ role: ["indicator.lowbat", "indicator.maintenance.lowbat"] }]
    },
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
  },
  {
    // HomematicIP cloud: hmip.N.devices.<id>, the states lie in channels.0, channels.1, … and info
    // (radiator thermostat of a productive ioBroker, 2026-11-24)
    adapter: "hmip",
    deviceLevel: 4,
    stateDepth: 3,
    entries: [
      {
        key: "lowBattery",
        group: "energy",
        icon: "battery-alert",
        rules: [{ role: "indicator.maintenance.lowbat", dp: ".lowBat" }]
      },
      {
        key: "temperature",
        group: "climate",
        icon: "thermometer",
        rules: [{ role: "value.temperature", dp: ".valveActualTemperature" }]
      },
      {
        key: "setpoint",
        group: "climate",
        icon: "home-thermometer",
        rules: [{ role: "level.temperature", dp: ".setPointTemperature" }]
      },
      {
        key: "valvePosition",
        group: "climate",
        icon: "valve",
        rules: [{ role: "value", dp: ".valvePosition" }]
      },
      // role value, no unit
      { key: "rssi", group: "connection", icon: "wifi", rules: [{ role: "value", dp: ".rssiDeviceValue" }] },
      {
        key: "unreachable",
        group: "connection",
        icon: "lan-disconnect",
        rules: [{ role: "indicator", dp: ".unreach" }]
      },
      { key: "firmware", group: "info", icon: "chip", rules: [{ role: "text", dp: ".firmwareVersion" }] }
    ]
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deviceDetailMasks,
  generalDeviceDetailMask
});
//# sourceMappingURL=deviceDetailMasks.js.map
