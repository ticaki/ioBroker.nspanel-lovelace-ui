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
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
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
var factory = __toESM(require("aedes-server-factory"));
var import_library = require("./library");
var import_aedes = __toESM(require("aedes"));
var import_node_crypto = require("node:crypto");
var forge = __toESM(require("node-forge"));
class MQTTClientClass extends import_library.BaseClass {
  client;
  data = {};
  ready = false;
  messageCallback;
  clientId;
  subscriptDB = [];
  _onConnect;
  _onDisconnect;
  constructor(adapter, ip, port, username, password, tls, callback) {
    super(adapter, "mqttClient");
    this.clientId = `iobroker_${(0, import_node_crypto.randomUUID)()}`;
    this.messageCallback = callback;
    this.client = import_mqtt.default.connect(`${tls ? "tls" : "mqtt"}://${ip}:${port}`, {
      username,
      password,
      clientId: this.clientId,
      rejectUnauthorized: false
    });
    this.client.on("connect", () => {
      this.log.info(`Connection is active.`);
      this.ready = true;
      if (this._onConnect) {
        this._onConnect.callback(this._onConnect.timeout);
      }
      void this.adapter.setState("info.connection", true, true);
    });
    this.client.on("disconnect", () => {
      this.log.info(`Disconnected.`);
      this.ready = false;
      this.log.debug(`disconnected`);
      if (this._onDisconnect) {
        void this._onDisconnect.callback(this._onDisconnect.timeout);
      }
      void this.adapter.setState("info.connection", false, true);
    });
    this.client.on("error", (err) => {
      this.ready = false;
      this.log.error(`${String(err)}`);
    });
    this.client.on("close", () => {
      this.ready = false;
      this.log.info(`Connection is closed.`);
      if (this._onDisconnect) {
        void this._onDisconnect.callback(this._onDisconnect.timeout);
      }
      void this.adapter.setState("info.connection", false, true);
    });
    this.client.on("message", (topic, message) => {
      const _helper = async (topic2, message2) => {
        const callbacks = this.subscriptDB.filter((i) => {
          return topic2.startsWith(i.topic.replace("/#", ""));
        });
        if (this.adapter.config.debugLogMqtt) {
          this.log.debug(
            `Incoming message for ${callbacks.length} subproceses. topic: ${topic2} message: ${message2.toString()}`
          );
        }
        const remove = [];
        for (const c of callbacks) {
          if (await c.callback(topic2, message2.toString())) {
            remove.push(c);
          }
        }
        if (remove.length > 0) {
          remove.forEach((a) => this.unsubscribe(a.topic));
        }
      };
      void _helper(topic, message);
    });
  }
  async waitConnectAsync(timeout) {
    return new Promise((resolve, reject) => {
      this._onConnect = {
        timeout: this.adapter.setTimeout(() => {
          reject(new Error(`Timeout for main mqttclient after ${timeout}ms`));
        }, timeout),
        callback: (timeout2) => {
          if (timeout2) {
            this.adapter.clearTimeout(timeout2);
          }
          this._onConnect = void 0;
          resolve();
        }
      };
    });
  }
  async waitPanelConnectAsync(_topic, timeout) {
    return new Promise((resolve, reject) => {
      const topic = `${_topic}/tele/INFO1`;
      this.log.debug(`wait for panel connect: ${topic}`);
      let ref = void 0;
      if (timeout > 0) {
        ref = this.adapter.setTimeout(() => {
          reject(new Error(`Timeout for main mqttclient after ${timeout}ms`));
        }, timeout);
      }
      void this.subscript(topic, async (_topic2, _message) => {
        if (ref) {
          this.adapter.clearTimeout(ref);
        }
        this.log.debug(`done connect: ${topic}`);
        resolve();
        return true;
      });
    });
  }
  async publish(topic, message, opt) {
    try {
      if (!this.client.connected) {
        if (this.adapter.config.debugLogMqtt) {
          this.log.debug(`Not connected. Can't publish topic: ${topic} with message: ${message}.`);
        }
        return;
      }
      if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`Publish topic: ${topic} with message: ${message}.`);
      }
      await this.client.publishAsync(topic, message, opt);
    } catch (e) {
      this.log.error(`Error in publish: ${e}`);
    }
  }
  unsubscribe(topic) {
    const index = this.subscriptDB.findIndex((m) => m.topic === topic);
    if (index !== -1) {
      this.subscriptDB.splice(index, 1);
      this.log.debug(`unsubscribe from: ${topic}`);
      this.client.unsubscribe(topic);
    }
  }
  async subscript(topic, callback) {
    if (this.subscriptDB.findIndex((m) => m.topic === topic && m.callback === callback) !== -1) {
      return;
    }
    const aNewOne = this.subscriptDB.findIndex((m) => m.topic === topic) === -1;
    this.subscriptDB.push({ topic, callback });
    if (aNewOne) {
      this.log.debug(`subscripe to: ${topic}`);
      await this.client.subscribeAsync(topic, { qos: 1 });
    }
  }
  async destroy() {
    await this.delete();
    const endMqttClient = () => {
      return new Promise((resolve) => {
        this.client.end(false, () => {
          resolve();
        });
      });
    };
    await endMqttClient();
  }
}
class MQTTServerClass extends import_library.BaseClass {
  aedes;
  server;
  controller;
  intervals = [];
  callbacks = {};
  ready = false;
  test = void 0;
  static async createMQTTServer(adapter, port, username, password, path) {
    let keys = {};
    if (!await adapter.fileExistsAsync(adapter.namespace, "keys/private-key.pem") || !await adapter.fileExistsAsync(adapter.namespace, "keys/public-key.pem") || !await adapter.fileExistsAsync(adapter.namespace, "keys/certificate.pem")) {
      adapter.log.info(`Create new keys for MQTT server.`);
      const prekeys = forge.pki.rsa.generateKeyPair(4096);
      keys.privateKey = forge.pki.privateKeyToPem(prekeys.privateKey);
      keys.publicKey = forge.pki.publicKeyToPem(prekeys.publicKey);
      const cert = forge.pki.createCertificate();
      cert.publicKey = prekeys.publicKey;
      cert.serialNumber = "01";
      cert.validity.notBefore = /* @__PURE__ */ new Date();
      cert.validity.notAfter = /* @__PURE__ */ new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
      const attrs = [
        { name: "commonName", value: "localhost" },
        { name: "countryName", value: "DE" },
        { name: "organizationName", value: "Meine Firma" }
      ];
      cert.setSubject(attrs);
      cert.setIssuer(attrs);
      cert.sign(prekeys.privateKey, forge.md.sha256.create());
      keys.certPem = forge.pki.certificateToPem(cert);
      await adapter.writeFileAsync(adapter.namespace, "keys/private-key.pem", keys.privateKey);
      await adapter.writeFileAsync(adapter.namespace, "keys/public-key.pem", keys.publicKey);
      await adapter.writeFileAsync(adapter.namespace, "keys/certificate.pem", keys.certPem);
    } else {
      keys = {
        publicKey: (await adapter.readFileAsync(adapter.namespace, "keys/public-key.pem")).file.toString(),
        privateKey: (await adapter.readFileAsync(adapter.namespace, "keys/private-key.pem")).file.toString(),
        certPem: (await adapter.readFileAsync(adapter.namespace, "keys/certificate.pem")).file.toString()
      };
    }
    return new MQTTServerClass(adapter, port, username, password, path, keys);
  }
  constructor(adapter, port, username, password, path, keyPair) {
    super(adapter, "mqttServer");
    const persistence = (0, import_aedes_persistence_level.default)(new import_level.Level(path));
    this.aedes = new import_aedes.default({ persistence });
    this.server = factory.createServer(this.aedes, {
      tls: {
        key: Buffer.from(keyPair.privateKey),
        cert: Buffer.from(keyPair.certPem)
      }
    });
    this.server.listen(port, () => {
      this.ready = true;
      this.log.info(`Started and listening on port ${port}`);
    });
    this.aedes.authenticate = (client, un, pw, callback) => {
      const confirm = username === un && password == (pw == null ? void 0 : pw.toString());
      if (!confirm) {
        this.log.warn(`Login denied client: ${client.id}. User name or password wrong! ${pw == null ? void 0 : pw.toString()}`);
      } else {
        this.log.debug(`Client ${client.id} login successful.`);
      }
      callback(null, confirm);
    };
    this.aedes.on("client", (client) => {
      for (const key in this.callbacks) {
        if (this.callbacks[key]) {
          if (client.id.startsWith(key)) {
            if (this.adapter.config.debugLogMqtt) {
              this.log.debug(`Client ${client.id} connected. Call callback.`);
            }
            if (this.callbacks[key].timeout) {
              this.adapter.clearTimeout(this.callbacks[key].timeout);
              this.callbacks[key].timeout = void 0;
            }
            this.callbacks[key].callback();
            delete this.callbacks[key];
          }
        }
      }
      const interval = this.adapter.setInterval(
        (index) => {
          if (this.controller) {
            const result = this.controller.mqttClientConnected(client.id);
            if (result) {
              this.log.debug(`Client ${client.id} connected.`);
            }
            if (result || result === void 0) {
              this.adapter.clearInterval(this.intervals[index]);
              this.intervals[index] = void 0;
              for (let a = this.intervals.length - 1; a >= 0; a--) {
                if (this.intervals[a] === void 0) {
                  this.intervals.splice(a, 1);
                } else {
                  break;
                }
              }
            }
          }
        },
        1e3,
        this.intervals.length
      );
      this.intervals.push(interval);
    });
  }
  destroy() {
    void this.delete();
    for (let a = this.intervals.length - 1; a >= 0; a--) {
      if (this.intervals[a] !== void 0) {
        this.adapter.clearInterval(this.intervals[a]);
      }
    }
    this.intervals = [];
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
