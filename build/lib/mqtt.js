"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var mqtt_exports = {};
__export(mqtt_exports, {
  MQTTClientClass: () => MQTTClientClass,
  MQTTServerClass: () => MQTTServerClass
});
module.exports = __toCommonJS(mqtt_exports);
var import_mqtt = __toESM(require("mqtt"));
var import_level = require("level");
var import_aedes_persistence_level = __toESM(require("aedes-persistence-level"));
var import_library = require("./library");
var import_aedes = __toESM(require("aedes"));
var import_net = require("net");
class MQTTClientClass extends import_library.BaseClass {
  client;
  data = {};
  messageCallback;
  constructor(adapter, ip, port, username, password, callback) {
    super(adapter, "mqttClient");
    this.messageCallback = callback;
    this.client = import_mqtt.default.connect(`mqtt://${ip}:${port}`, {
      username,
      password,
      clientId: `iobroker_${this.adapter.namespace}`
    });
    this.client.on("connect", () => {
      this.log.info(`Connection is active.`);
      this.adapter.setState("info.connection", true, true);
      this.client.subscribe("espresense/#", (err) => {
        if (err) {
          this.log.error(`On subscribe: ${err}`);
        }
      });
    });
    this.client.on("disconnect", () => {
      this.adapter.setState("info.connection", false, true);
      this.log.debug(`disconnected`);
    });
    this.client.on("error", (err) => {
      this.log.error(`${err}`);
    });
    this.client.on("close", () => {
      this.adapter.setState("info.connection", false, true);
      this.log.info(`Connection is closed.`);
    });
    this.client.on("message", (topic, message) => {
      let value;
      let type = "";
      try {
        value = JSON.parse(message.toString());
        if (typeof value == "string")
          throw new Error("nope");
        type = typeof value;
      } catch (e) {
        value = message.toString();
        if (isNaN(value)) {
          if (value == "ON" || value == "OFF") {
            type = "boolean";
            value = value == "ON";
          } else {
            type = "string";
          }
        } else if (value == "") {
          type = "string";
        } else {
          type = "number";
          value = parseFloat(value);
        }
      }
      this.log.debug(`${topic}: ${type} - ${typeof value == "object" ? JSON.stringify(value) : value}`);
      this.messageCallback(topic, value);
    });
  }
  async publish(topic, message, opt) {
    this.log.debug(`Publishing topic: ${topic} with message: ${message}.`);
    await this.client.publishAsync(topic, message, opt);
  }
  destroy() {
    this.client.end();
  }
}
class MQTTServerClass extends import_library.BaseClass {
  aedes;
  server;
  constructor(adapter, port, username, password, path) {
    super(adapter, "mqttServer");
    const persistence = (0, import_aedes_persistence_level.default)(new import_level.Level(path));
    this.aedes = new import_aedes.default({ persistence });
    this.server = (0, import_net.createServer)(this.aedes.handle);
    this.server.listen(port, () => {
      this.log.info(`Started and listening on port ${port}`);
    });
    this.aedes.authenticate = (client, un, pw, callback) => {
      const confirm = username === un && password == pw.toString();
      if (!confirm)
        this.log.warn(`Login denied client: ${client.id}. User name or password wrong!`);
      else
        this.log.info(`Client ${client.id} login successful.`);
      callback(null, confirm);
    };
  }
  destroy() {
    this.aedes.close();
    this.server.close();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MQTTClientClass,
  MQTTServerClass
});
//# sourceMappingURL=mqtt.js.map
