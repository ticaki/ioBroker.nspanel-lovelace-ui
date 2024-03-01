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
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_library = require("./lib/classes/library");
var import_register = require("source-map-support/register");
var MQTT = __toESM(require("./lib/classes/mqtt"));
var import_config_custom = require("./lib/config-custom");
var import_controller = require("./lib/controller/controller");
var import_icon_mapping = require("./lib/const/icon_mapping");
var import_definition = require("./lib/const/definition");
class NspanelLovelaceUi extends utils.Adapter {
  library;
  mqttClient;
  mqttServer;
  controller;
  unload = false;
  constructor(options = {}) {
    super({
      ...options,
      name: "nspanel-lovelace-ui",
      useFormatDate: true
    });
    this.library = new import_library.Library(this);
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    import_icon_mapping.Icons.adapter = this;
    this.library = new import_library.Library(this);
    if (!this.config.Testconfig2) {
      if (this.config.onlyStartFromSystemConfig) {
        this.log.warn("No configuration stopped!");
        return;
      }
      this.log.warn("No configuration use dev test config!");
      this.config.Testconfig2 = import_config_custom.Testconfig;
    }
    if (!this.config.Testconfig2 || !Array.isArray(this.config.Testconfig2) || !this.config.Testconfig2[0] || !this.config.Testconfig2[0].pages) {
      this.log.warn("Adapter on hold, user restart needed!");
      return;
    }
    try {
      this.config.Testconfig2[0].pages[0] = this.config.Testconfig2[0].pages[0];
      this.config.Testconfig2[0].timeout = this.config.timeout;
    } catch (e) {
      this.log.warn("Invalid configuration stopped!");
      return;
    }
    this.setTimeout(async () => {
      if (!import_config_custom.Testconfig[0].pages)
        return;
      const names = [];
      for (const p of import_config_custom.Testconfig[0].pages) {
        if (p.card === "screensaver" || p.card === "screensaver2")
          continue;
        if (!("uniqueID" in p))
          continue;
        if (names.indexOf(p.uniqueID) !== -1)
          throw new Error(`uniqueID ${p.uniqueID} is double!`);
        names.push(p.uniqueID);
      }
      await this.library.init();
      const states = await this.getStatesAsync("*");
      await this.library.initStates(states);
      for (const id in states) {
        if (id.endsWith(".info.nspanel.isOnline"))
          await this.library.writedp(id, false, import_definition.genericStateObjects.panel.panels.info.nspanel.isOnline);
      }
      this.log.debug("Check configuration!");
      if (!(this.config.mqttIp && this.config.mqttPort && this.config.mqttUsername && this.config.mqttPassword)) {
        this.log.error("Invalid admin configuration for mqtt!");
        return;
      }
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
      if (!this.mqttClient)
        return;
      const testconfig = structuredClone(this.config.Testconfig2);
      testconfig[0].name = this.config.name;
      testconfig[0].topic = this.config.topic;
      const mem = process.memoryUsage().heapUsed / 1024;
      this.log.debug(String(mem + "k"));
      this.controller = new import_controller.Controller(this, {
        mqttClient: this.mqttClient,
        name: "controller",
        panels: testconfig
      });
      await this.controller.init();
      setInterval(() => {
        this.log.debug(
          Math.trunc(mem) + "k/" + String(Math.trunc(process.memoryUsage().heapUsed / 1024)) + "k Start/Jetzt: "
        );
      }, 6e4);
    }, 1500);
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   */
  async onUnload(callback) {
    try {
      this.unload = true;
      if (this.controller)
        await this.controller.delete;
      callback();
    } catch (e) {
      callback();
    }
  }
  // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
  // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
  // /**
  //  * Is called if a subscribed object changes
  //  */
  // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
  //     if (obj) {
  //         // The object was changed
  //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
  //     } else {
  //         // The object was deleted
  //         this.log.info(`object ${id} deleted`);
  //     }
  // }
  /**
   * Is called if a subscribed state changes
   */
  async onStateChange(id, state) {
    if (state) {
      if (this.controller) {
        this.controller.statesControler.onStateChange(id, state);
      }
    } else {
      this.log.info(`state ${id} deleted`);
    }
  }
  // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
  // /**
  //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
  //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
  //  */
  async onMessage(obj) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (typeof obj === "object" && obj.message) {
      if (obj.command) {
        this.log.info(JSON.stringify(obj));
        if (obj.command === "scs-field") {
        } else if (obj.command === "reload" || obj.command === "setData") {
          const result = {};
          const keyToValue = obj.message.field;
          this.log.debug(keyToValue);
          result.currentfield = obj.message.entry + "#" + obj.message.field;
          const fields = {};
          const v1 = this.config.Testconfig2[0].pages[0].screenSaverConfig.entitysConfig;
          const key = obj.message.entry.split("#")[1];
          const v2 = v1[key];
          const index = obj.message.entry.split("#")[0] - 1;
          const v3 = v2[index];
          if (v3 !== void 0) {
            let v4 = void 0;
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
            if (v4 && "reload" == obj.command) {
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
            } else if (obj.command === "setData") {
              const res = obj.message;
              const mytype = res.entity_value_type;
              v4 = void 0;
              switch (mytype) {
                case "const": {
                  v4 = {
                    type: mytype,
                    constVal: (_f = res.entity_value_constVal) != null ? _f : "",
                    forceType: (_g = res.entity_value_forcetyp) != null ? _g : ""
                  };
                  if (v4.forceType == "string") {
                    v4.constVal = String(v4.constVal);
                  } else if (v4.forceType == "number") {
                    v4.constVal = Number(v4.constVal);
                  } else if (v4.forceType == "boolean") {
                    v4.constVal = !!v4.constVal;
                  }
                  break;
                }
                case "triggered":
                case "state": {
                  v4 = {
                    type: mytype,
                    dp: (_h = res.entity_value_dp) != null ? _h : "",
                    read: res.entity_value_read || void 0,
                    forceType: res.entity_value_forcetyp || void 0
                  };
                  break;
                }
                case "internal": {
                  break;
                }
              }
              let change = true;
              switch (keyToValue) {
                case "value": {
                  v3.entityValue.value = v4;
                  break;
                }
                case "decimal": {
                  v3.entityValue.decimal = v4;
                  break;
                }
                case "factor": {
                  v3.entityValue.factor = v4;
                  break;
                }
                case "unit": {
                  v3.entityValue.unit = v4;
                  break;
                }
                case "date": {
                  v3.entityDateFormat = v4;
                  break;
                }
                case "iconon": {
                  v3.entityIcon.true.value = v4;
                  break;
                }
                case "icononcolor": {
                  v3.entityIcon.true.color = v4;
                  break;
                }
                case "iconoff": {
                  v3.entityIcon.false.value = v4;
                  break;
                }
                case "iconoffcolor": {
                  v3.entityIcon.true.color = v4;
                  break;
                }
                case "iconscale": {
                  v3.entityIcon.scale;
                  break;
                }
                case "texton": {
                  v3.entityText.true = v4;
                  break;
                }
                case "textoff": {
                  v3.entityText.false = v4;
                  break;
                }
                default:
                  change = false;
                  result.currentfield = "";
              }
              if (change) {
                this.config.Testconfig2[0].pages[0].screenSaverConfig.entitysConfig[key][index] = v3;
                const obj2 = await this.getForeignObjectAsync("system.adapter." + this.namespace);
                if (obj2 && obj2.native && JSON.stringify(obj2.native.Testconfig2) !== JSON.stringify(this.config.Testconfig2)) {
                  obj2.native.Testconfig2 = this.config.Testconfig2;
                  await this.setForeignObjectAsync("system.adapter." + this.namespace, obj2);
                }
              }
            }
            this.log.debug(JSON.stringify({ native: Object.assign(result, fields) }));
            if (obj.callback)
              this.sendTo(obj.from, obj.command, { native: Object.assign(result, fields) }, obj.callback);
            return;
          }
        } else if (obj.command = "config") {
          const obj1 = await this.getForeignObjectAsync("system.adapter." + this.namespace);
          if (obj1 && obj1.native && JSON.stringify(obj1.native.Testconfig2) !== JSON.stringify(obj.message)) {
            obj1.native.Testconfig2 = obj.message;
            await this.setForeignObjectAsync("system.adapter." + this.namespace, obj1);
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
