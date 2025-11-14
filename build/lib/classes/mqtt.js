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
var import_library = require("../controller/library");
var import_aedes = __toESM(require("aedes"));
var import_node_crypto = require("node:crypto");
var forge = __toESM(require("node-forge"));
class MQTTClientClass extends import_library.BaseClass {
  client;
  data = {};
  ready = false;
  messageCallback;
  clientId;
  // Flat registry of subscriptions (topic + callback)
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
      this.log.debug("MQTT connected.");
      this.ready = true;
      if (this._onConnect) {
        this._onConnect.callback(this._onConnect.timeout);
      }
      void this.adapter.setState("info.connection", true, true);
    });
    this.client.on("disconnect", () => {
      this.ready = false;
      this.log.info("MQTT disconnected (graceful).");
      if (this._onDisconnect) {
        void this._onDisconnect.callback(this._onDisconnect.timeout);
      }
      void this.adapter.setState("info.connection", false, true);
    });
    this.client.on("error", (err) => {
      this.ready = false;
      this.log.error(`MQTT error: ${String(err)}`);
    });
    this.client.on("close", () => {
      this.ready = false;
      this.log.info("MQTT connection closed.");
      if (this._onDisconnect) {
        void this._onDisconnect.callback(this._onDisconnect.timeout);
      }
      void this.adapter.setState("info.connection", false, true);
    });
    this.client.on("message", (topic, message) => {
      const _helper = async (topic2, message2) => {
        const callbacks = this.subscriptDB.filter((entry) => topic2.startsWith(entry.topic.replace("/#", "")));
        if (this.adapter.config.debugLogMqtt) {
          this.log.debug(
            `MQTT message: matched ${callbacks.length} handler(s) | topic="${topic2}" | payload="${message2.toString()}"`
          );
        }
        const toRemove = [];
        for (const c of callbacks) {
          try {
            if (await c.callback(topic2, message2.toString())) {
              toRemove.push({ topic: c.topic, callback: c.callback });
            }
          } catch (e) {
            this.log.warn(
              `MQTT handler threw for topic="${topic2}": ${String(e)} (handler kept, no unsubscribe)`
            );
          }
        }
        if (toRemove.length > 0) {
          for (const rem of toRemove) {
            const before = this.countCallbacks(rem.topic);
            this.removeSubscriptionEntry(rem.topic, rem.callback);
            const after = this.countCallbacks(rem.topic);
            if (after === 0) {
              this.unsubscribe(rem.topic);
            } else if (this.adapter.config.debugLogMqtt) {
              this.log.debug(
                `MQTT keep subscription: topic="${rem.topic}" still has ${after}/${before} handler(s)`
              );
            }
          }
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
        callback: (timeoutRef) => {
          if (timeoutRef) {
            this.adapter.clearTimeout(timeoutRef);
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
      this.log.debug(`Wait for panel connect on: ${topic}`);
      let ref;
      if (timeout > 0) {
        ref = this.adapter.setTimeout(() => {
          reject(new Error(`Timeout for main mqttclient after ${timeout}ms`));
        }, timeout);
      }
      void this.subscribe(topic, async () => {
        if (ref) {
          this.adapter.clearTimeout(ref);
        }
        this.log.debug(`Panel connect detected: ${topic}`);
        resolve();
        return true;
      });
    });
  }
  async publish(topic, message, opt) {
    try {
      if (!this.client.connected) {
        if (this.adapter.config.debugLogMqtt) {
          this.log.debug(`Publish skipped (not connected): topic="${topic}" payload="${message}"`);
        }
        return;
      }
      if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`Publish: topic="${topic}" payload="${message}"`);
      }
      await this.client.publishAsync(topic, message, opt);
    } catch (e) {
      this.log.error(`Error in publish (topic="${topic}"): ${e}`);
    }
  }
  unsubscribe(topic) {
    const index = this.subscriptDB.findIndex((m) => m.topic === topic);
    if (index !== -1) {
      this.subscriptDB.splice(index, 1);
      const count = this.countCallbacks(topic);
      if (count === 0) {
        this.log.debug(`unsubscribe from: ${topic}`);
        this.client.unsubscribe(topic);
      } else if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`keep subscription: topic="${topic}" still has ${count} handler(s)`);
      }
    }
  }
  removeByFunction(callback) {
    const toRemove = this.subscriptDB.filter((m) => m.callback === callback);
    for (const rem of toRemove) {
      this.removeSubscriptionEntry(rem.topic, rem.callback);
      const count = this.countCallbacks(rem.topic);
      if (count === 0) {
        this.log.debug(`unsubscribe from: ${rem.topic}`);
        this.client.unsubscribe(rem.topic);
      } else if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`keep subscription: topic="${rem.topic}" still has ${count} handler(s)`);
      }
    }
  }
  async subscribe(topic, callback) {
    if (this.subscriptDB.findIndex((m) => m.topic === topic && m.callback === callback) !== -1) {
      if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`subscribe skipped (duplicate handler): ${topic}`);
      }
      return;
    }
    const firstOnTopic = this.subscriptDB.findIndex((m) => m.topic === topic) === -1;
    this.subscriptDB.push({ topic, callback });
    if (firstOnTopic) {
      this.log.debug(`subscribe to: ${topic}`);
      await this.client.subscribeAsync(topic, { qos: 1 });
    } else if (this.adapter.config.debugLogMqtt) {
      const count = this.countCallbacks(topic);
      this.log.debug(`added handler for topic="${topic}" (handlers on topic: ${count})`);
    }
  }
  async destroy() {
    await this.delete();
    const endMqttClient = () => new Promise((resolve) => {
      this.client.end(false, () => resolve());
    });
    await endMqttClient();
  }
  // ========= Internal helpers (no change to external API/returns) =========
  /**
   * Count registered callbacks for a given topic.
   *
   * @param topic the topic to check
   */
  countCallbacks(topic) {
    return this.subscriptDB.reduce((acc, m) => m.topic === topic ? acc + 1 : acc, 0);
  }
  /**
   * Remove exactly one (topic, callback) pair from registry (no logging, no broker action).
   *
   * @param topic the topic
   * @param callback the callback
   */
  removeSubscriptionEntry(topic, callback) {
    const idx = this.subscriptDB.findIndex((m) => m.topic === topic && m.callback === callback);
    if (idx !== -1) {
      this.subscriptDB.splice(idx, 1);
    }
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
  static async createMQTTServer(adapter, port, username, password, path, testCase = false) {
    var _a;
    let mqttKeys;
    if (await adapter.fileExistsAsync(adapter.namespace, "keys/private-key.pem") && await adapter.fileExistsAsync(adapter.namespace, "keys/public-key.pem") && await adapter.fileExistsAsync(adapter.namespace, "keys/certificate.pem")) {
      try {
        const privateKey = (await adapter.readFileAsync(adapter.namespace, "keys/private-key.pem")).file.toString();
        const publicKey = (await adapter.readFileAsync(adapter.namespace, "keys/public-key.pem")).file.toString();
        const certificate = (await adapter.readFileAsync(adapter.namespace, "keys/certificate.pem")).file.toString();
        await adapter.writeFileAsync(`${adapter.namespace}.keys`, "private-key.pem", privateKey);
        await adapter.writeFileAsync(`${adapter.namespace}.keys`, "public-key.pem", publicKey);
        await adapter.writeFileAsync(`${adapter.namespace}.keys`, "certificate.pem", certificate);
        await adapter.delFileAsync(adapter.namespace, "keys/private-key.pem");
        await adapter.delFileAsync(adapter.namespace, "keys/public-key.pem");
        await adapter.delFileAsync(adapter.namespace, "keys/certificate.pem");
        adapter.log.info(`Moved keys to ${adapter.namespace}.keys`);
      } catch (err) {
        adapter.log.error(`Failed to migrate key files: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    if (await adapter.fileExistsAsync(`${adapter.namespace}.keys`, "private-key.pem") && await adapter.fileExistsAsync(`${adapter.namespace}.keys`, "public-key.pem") && await adapter.fileExistsAsync(`${adapter.namespace}.keys`, "certificate.pem")) {
      try {
        mqttKeys = { privateKey: "", publicKey: "", certPem: "" };
        mqttKeys.privateKey = (await adapter.readFileAsync(`${adapter.namespace}.keys`, "private-key.pem")).file.toString();
        mqttKeys.publicKey = (await adapter.readFileAsync(`${adapter.namespace}.keys`, "public-key.pem")).file.toString();
        mqttKeys.certPem = (await adapter.readFileAsync(`${adapter.namespace}.keys`, "certificate.pem")).file.toString();
        await adapter.extendObject(`${adapter.namespace}`, {
          type: "meta",
          native: {
            mqttKeys
          }
        });
        await adapter.delFileAsync(`${adapter.namespace}.keys`, "private-key.pem");
        await adapter.delFileAsync(`${adapter.namespace}.keys`, "public-key.pem");
        await adapter.delFileAsync(`${adapter.namespace}.keys`, "certificate.pem");
        adapter.log.info(`Moved keys to ${adapter.namespace}.keys`);
      } catch (err) {
        adapter.log.error(`Failed to migrate key files: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    const obj = await adapter.getObjectAsync(`${adapter.namespace}`);
    if ((_a = obj == null ? void 0 : obj.native) == null ? void 0 : _a.mqttKeys) {
      mqttKeys = obj.native.mqttKeys;
    }
    if (!((mqttKeys == null ? void 0 : mqttKeys.privateKey) && (mqttKeys == null ? void 0 : mqttKeys.publicKey) && (mqttKeys == null ? void 0 : mqttKeys.certPem))) {
      adapter.log.info(`Create new keys for MQTT server.`);
      mqttKeys = { privateKey: "", publicKey: "", certPem: "" };
      const prekeys = forge.pki.rsa.generateKeyPair(4096);
      mqttKeys.privateKey = forge.pki.privateKeyToPem(prekeys.privateKey);
      mqttKeys.publicKey = forge.pki.publicKeyToPem(prekeys.publicKey);
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
      mqttKeys.certPem = forge.pki.certificateToPem(cert);
      await adapter.extendObject(`${adapter.namespace}`, {
        type: "meta",
        native: {
          mqttKeys
        }
      });
    }
    return new MQTTServerClass(adapter, port, username, password, path, mqttKeys, testCase);
  }
  constructor(adapter, port, username, password, path, keyPair, testCase = false) {
    super(adapter, "mqttServer");
    const persistence = (0, import_aedes_persistence_level.default)(new import_level.Level(path));
    this.aedes = new import_aedes.default({ persistence });
    if (testCase) {
    }
    this.server = factory.createServer(this.aedes, {
      tls: {
        key: Buffer.from(keyPair.privateKey),
        cert: Buffer.from(keyPair.certPem)
      }
    });
    this.server.listen(port, () => {
      this.ready = true;
      this.log.info(`MQTT server started and listening on port ${port}`);
    });
    this.server.on("error", (err) => {
      this.ready = false;
      this.log.error(`MQTT server error on port ${port}: ${String(err)}`);
    });
    this.aedes.authenticate = (client, un, pw, callback) => {
      const confirm = username === un && password === (pw == null ? void 0 : pw.toString());
      if (!confirm) {
        this.log.warn(`Login denied: client="${client.id}", username="${un != null ? un : "undefined"}"`);
      } else {
        this.log.debug(`Client "${client.id}" login successful (user="${un != null ? un : "undefined"}").`);
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
