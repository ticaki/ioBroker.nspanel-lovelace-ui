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
  constructor(adapter, ip, port, username, password, tls, callback, onConnect) {
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
      void this.adapter.setState("info.connection", true, true);
      this.ready = true;
      if (onConnect) {
        void onConnect();
      }
    });
    this.client.on("disconnect", () => {
      this.log.info(`Disconnected.`);
      this.ready = false;
      void this.adapter.setState("info.connection", false, true);
      this.log.debug(`disconnected`);
    });
    this.client.on("error", (err) => {
      this.ready = false;
      this.log.error(`${String(err)}`);
    });
    this.client.on("close", () => {
      this.ready = false;
      void this.adapter.setState("info.connection", false, true);
      this.log.info(`Connection is closed.`);
    });
    this.client.on("message", (topic, message) => {
      const callbacks = this.subscriptDB.filter((i) => {
        return topic.startsWith(i.topic.replace("/#", ""));
      });
      callbacks.forEach((c) => c.callback(topic, message.toString()));
    });
  }
  async publish(topic, message, opt) {
    if (!this.client.connected) {
      this.log.debug(`Not connected. Can't publish topic: ${topic} with message: ${message}.`);
      return;
    }
    await this.client.publishAsync(topic, message, opt);
  }
  subscript(topic, callback) {
    if (this.subscriptDB.findIndex((m) => m.topic === topic && m.callback === callback) !== -1) {
      return;
    }
    const aNewOne = this.subscriptDB.findIndex((m) => m.topic === topic) === -1;
    this.subscriptDB.push({ topic, callback });
    if (aNewOne) {
      this.log.debug(`subscripe to: ${topic}`);
      this.client.subscribe(topic, (err) => {
        if (err) {
          this.log.error(`On subscribe: ${err}`);
        }
      });
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
  ready = false;
  static async createMQTTServer(adapter, port, username, password, path) {
    let keys = {};
    if (!await adapter.fileExistsAsync(adapter.namespace, "keys/private-key.pem") || !await adapter.fileExistsAsync(adapter.namespace, "keys/public-key.pem") || !await adapter.fileExistsAsync(adapter.namespace, "keys/certificate.pem")) {
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
        this.log.info(`Client ${client.id} login successful.`);
      }
      callback(null, confirm);
    };
  }
  destroy() {
    void this.delete();
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
