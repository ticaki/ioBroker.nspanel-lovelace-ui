"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_library = require("./lib/classes/library");
var import_register = require("source-map-support/register");
var MQTT = __toESM(require("./lib/classes/mqtt"));
var import_config = require("./lib/config");
var import_panel_controller = require("./lib/controller/panel-controller");
var import_icon_mapping = require("./lib/const/icon_mapping");
var import_definition = require("./lib/const/definition");
class NspanelLovelaceUi extends utils.Adapter {
  library;
  mqttClient;
  mqttServer;
  controller;
  constructor(options = {}) {
    super({
      ...options,
      name: "nspanel-lovelace-ui"
    });
    this.library = new import_library.Library(this);
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  async onReady() {
    import_icon_mapping.Icons.adapter = this;
    this.library = new import_library.Library(this);
    this.setTimeout(() => {
      this.library.init();
      this.log.debug("Check configuration!");
      if (!(this.config.mqttIp && this.config.mqttPort && this.config.mqttUsername && this.config.mqttPassword))
        return;
      this.log.debug(this.adapterDir);
      this.mqttClient = new MQTT.MQTTClientClass(
        this,
        this.config.mqttIp,
        this.config.mqttPort,
        this.config.mqttUsername,
        this.config.mqttPassword,
        (topic, message) => {
          this.log.debug(topic + " " + message);
        }
      );
      import_config.Testconfig.name = this.config.name;
      import_config.Testconfig.topic = this.config.topic;
      this.log.debug(String(process.memoryUsage().heapUsed));
      this.controller = new import_panel_controller.Controller(this, {
        mqttClient: this.mqttClient,
        name: "controller",
        panels: [JSON.parse(JSON.stringify(import_config.Testconfig))]
      });
      setTimeout(() => {
        this.log.debug(String(process.memoryUsage().heapUsed)), 2e3;
      });
    }, 3e3);
  }
  onUnload(callback) {
    try {
      callback();
    } catch (e) {
      callback();
    }
  }
  onStateChange(id, state) {
    if (state) {
      if (this.controller) {
        this.controller.readOnlyDB.onStateChange(id, state);
      }
    } else {
      this.log.info(`state ${id} deleted`);
    }
  }
  onMessage(obj) {
    var _a, _b, _c, _d, _e;
    if (typeof obj === "object" && obj.message) {
      if (obj.command) {
        this.log.info(JSON.stringify(obj));
        if (obj.command === "scs-field") {
          const result = [];
          const data = import_definition.ScreenSaverConst[obj.message.type];
          for (const key in data) {
            const max = data[key].maxEntries;
            for (let a = 0; a < max; a++) {
              result.push({ label: `${a + 1} ${key}`, value: `${a + 1}#${key}` });
            }
          }
          if (obj.callback)
            this.sendTo(obj.from, obj.command, result, obj.callback);
          return;
        } else if (obj.command === "reload") {
          const result = {};
          const keyToValue = obj.message.field;
          this.log.debug(keyToValue);
          result.currentfield = obj.message.entry + "#" + obj.message.field;
          const fields = {};
          const v1 = import_config.Testconfig.screenSaverConfig.entitysConfig;
          const key = obj.message.entry.split("#")[1];
          const v2 = v1[key];
          const index = obj.message.entry.split("#")[0] - 1;
          const v3 = v2[index];
          if (v3 !== void 0) {
            let v4 = v3.entityValue.value;
            switch (keyToValue) {
              case "value": {
                v4 = v3.entityValue.value;
                break;
              }
              case "decimal": {
                v4 = v3.entityValue.decimal;
                break;
              }
              case "factor": {
                v4 = v3.entityValue.factor;
                break;
              }
              case "unit": {
                v4 = v3.entityValue.unit;
                break;
              }
              case "date": {
                v4 = v3.entityDateFormat;
                break;
              }
              case "iconon": {
                v4 = v3.entityIcon.true.value;
                break;
              }
              case "icononcolor": {
                v4 = v3.entityIcon.true.color;
                break;
              }
              case "iconoff": {
                v4 = v3.entityIcon.false.value;
                break;
              }
              case "iconoffcolor": {
                v4 = v3.entityIcon.true.color;
                break;
              }
              case "iconscale": {
                v4 = v3.entityIcon.scale;
                break;
              }
              case "texton": {
                v4 = v3.entityText.true;
                break;
              }
              case "textoff": {
                v4 = v3.entityText.false;
                break;
              }
              default:
                result.currentfield = "";
            }
            if (v4) {
              switch (v4.type) {
                case "const": {
                  fields.entity_value_type = v4.type;
                  fields.entity_value_constVal = String((_a = v4.constVal) != null ? _a : "");
                  fields.entity_value_forcetyp = (_b = v4.forceType) != null ? _b : "";
                  break;
                }
                case "triggered":
                case "state": {
                  fields.entity_value_type = v4.type;
                  fields.entity_value_dp = String((_c = v4.dp) != null ? _c : "");
                  fields.entity_value_forcetyp = String((_d = v4.forceType) != null ? _d : "");
                  fields.entity_value_read = String((_e = v4.read) != null ? _e : "");
                  break;
                }
                case "internal": {
                  break;
                }
              }
            }
            this.log.debug(JSON.stringify({ native: Object.assign(result, fields) }));
            if (obj.callback)
              this.sendTo(obj.from, obj.command, { native: Object.assign(result, fields) }, obj.callback);
            return;
          }
        }
        if (obj.callback)
          this.sendTo(obj.from, obj.command, [], obj.callback);
      }
    }
  }
  async writeStateExternalAsync(dp, val) {
    if (dp.startsWith(this.namespace))
      return;
    await this.setForeignStateAsync(dp, val, false);
  }
}
if (require.main !== module) {
  module.exports = (options) => new NspanelLovelaceUi(options);
} else {
  (() => new NspanelLovelaceUi())();
}
//# sourceMappingURL=main.js.map
