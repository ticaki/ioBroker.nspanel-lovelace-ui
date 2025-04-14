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
var panel_message_exports = {};
__export(panel_message_exports, {
  PanelSend: () => PanelSend
});
module.exports = __toCommonJS(panel_message_exports);
var import_definition = require("../const/definition");
var import_library = require("../classes/library");
class PanelSend extends import_library.BaseClass {
  messageDb = [];
  messageDbTasmota = [];
  messageTimeout;
  messageTimeoutTasmota;
  mqttClient;
  topic = "";
  losingMessageCount = 0;
  _losingDelay = 1e3;
  panel = void 0;
  get losingDelay() {
    if (this._losingDelay < 3e4) {
      this._losingDelay = this._losingDelay + 1e3;
    }
    return this._losingDelay;
  }
  set losingDelay(value) {
    if (value > 3e4) {
      value = 3e4;
    }
    if (value < 1e3) {
      value = 1e3;
    }
    this._losingDelay = value;
  }
  constructor(adapter, config) {
    super(adapter, config.name);
    this.mqttClient = config.mqttClient;
    void this.mqttClient.subscript(`${config.topic}/stat/RESULT`, this.onMessage);
    this.topic = config.topic + import_definition.SendTopicAppendix;
    this.panel = config.panel;
  }
  onMessage = async (topic, message) => {
    if (!topic.endsWith("/stat/RESULT")) {
      return;
    }
    if (this.adapter.config.debugLogMqtt) {
      this.log.debug(`Receive command ${topic} with ${message}`);
    }
    const msg = JSON.parse(message);
    const ackForType = this.messageDb[0] && this.messageDb[0].ackForType;
    if (msg) {
      if (ackForType && msg.CustomSend === "renderCurrentPage" || !ackForType && msg.CustomSend === "Done") {
        if (this.messageTimeout) {
          this.adapter.clearTimeout(this.messageTimeout);
        }
        this.losingMessageCount = 0;
        this._losingDelay = 0;
        const oldMessage = this.messageDb.shift();
        if (oldMessage) {
          if (oldMessage.payload === "pageType~pageStartup") {
            this.messageDb = [];
          }
          if (this.adapter.config.debugLogMqtt) {
            this.log.debug(`Receive ack for ${JSON.stringify(oldMessage)}`);
          }
        }
        if (this.unload) {
          return;
        }
        this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, 100);
      }
    }
  };
  addMessage = (payload, ackForType, opt) => {
    if (this.messageTimeout !== void 0 && this.messageDb.length > 0 && this.messageDb.some((a) => a.payload === payload && a.opt === opt)) {
      return;
    }
    this.messageDb.push({ payload, opt, ackForType });
    if (this.messageTimeout === void 0) {
      void this.sendMessageLoop();
    }
  };
  sendMessageLoop = async () => {
    const msg = this.messageDb[0];
    if (msg === void 0 || this.unload) {
      this.messageTimeout = void 0;
      return;
    }
    if (this.panel && !this.panel.isOnline) {
      this.messageDb = [];
    }
    if (this.losingMessageCount > 0 && this.adapter.config.additionalLog) {
      this.log.warn(`send payload: ${JSON.stringify(msg)} to panel. Losing count: ${this.losingMessageCount}`);
    }
    if (this.losingMessageCount++ > 30) {
      if (this.panel) {
        this.panel.isOnline = false;
      }
    }
    if (this.unload) {
      return;
    }
    this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, this.losingDelay);
    this.addMessageTasmota(this.topic, msg.payload, msg.opt);
  };
  addMessageTasmota = (topic, payload, opt) => {
    if (this.messageDbTasmota.length > 0 && this.messageDbTasmota.some((a) => a.topic === topic && a.payload === payload && a.opt === opt)) {
      return;
    }
    this.messageDbTasmota.push({ topic, payload, opt });
    if (this.messageTimeoutTasmota === void 0) {
      void this.sendMessageLoopTasmota();
    }
  };
  sendMessageLoopTasmota = async () => {
    const msg = this.messageDbTasmota.shift();
    if (msg === void 0 || this.unload) {
      this.messageTimeoutTasmota = void 0;
      return;
    }
    if (this.adapter.config.debugLogMqtt) {
      this.log.debug(`send payload: ${JSON.stringify(msg)} to panel.`);
    }
    this.messageTimeoutTasmota = true;
    await this.mqttClient.publish(msg.topic, msg.payload, { ...msg.opt, qos: 1 });
    if (this.unload) {
      return;
    }
    this.messageTimeoutTasmota = this.adapter.setTimeout(this.sendMessageLoopTasmota, 20);
  };
  async delete() {
    await super.delete();
    this.mqttClient.unsubscribe(`${this.topic}/stat/RESULT`);
    if (this.messageTimeout) {
      this.adapter.clearTimeout(this.messageTimeout);
    }
    if (this.messageTimeoutTasmota && this.messageTimeoutTasmota !== true) {
      this.adapter.clearTimeout(this.messageTimeoutTasmota);
    }
    this.messageDb = [];
    this.messageDbTasmota = [];
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PanelSend
});
//# sourceMappingURL=panel-message.js.map
