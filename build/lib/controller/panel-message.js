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
  _panel = void 0;
  constructor(adapter, config) {
    super(adapter, config.name);
    this.mqttClient = config.mqttClient;
    this.mqttClient.subscript(config.topic + "/stat/RESULT", this.onMessage);
    this.topic = config.topic + import_definition.SendTopicAppendix;
  }
  set panel(panel) {
    this._panel = panel;
  }
  onMessage = async (topic, message) => {
    if (!topic.endsWith("/stat/RESULT")) {
      return;
    }
    const msg = JSON.parse(message);
    if (msg) {
      if (msg.CustomSend === "Done") {
        if (this.messageTimeout)
          this.adapter.clearTimeout(this.messageTimeout);
        this.losingMessageCount = 0;
        const msg2 = this.messageDb.shift();
        if (false)
          this.log.debug(`Receive ack for ${JSON.stringify(msg2)}`);
        this.sendMessageLoop();
      }
    }
  };
  get panel() {
    if (!this._panel)
      throw new Error("Error P1: Panel undefinied!");
    return this._panel;
  }
  addMessage = (payload, opt) => {
    this.messageDb.push({ payload, opt });
    if (this.messageTimeout === void 0) {
      this.sendMessageLoop();
    }
  };
  sendMessageLoop = () => {
    const msg = this.messageDb[0];
    if (msg === void 0 || this.unload) {
      this.messageTimeout = void 0;
      return;
    }
    if (this.losingMessageCount++ > 5) {
      if (this._panel)
        this._panel.isOnline = false;
    }
    if (this._panel && !this._panel.isOnline)
      this.messageDb = [];
    this.addMessageTasmota(this.topic, msg.payload, msg.opt);
    this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, 1e3);
  };
  addMessageTasmota = (topic, payload, opt) => {
    if (this.messageDbTasmota.length > 0 && !this.messageDbTasmota.some((a) => a.topic === topic && a.payload === payload && a.opt === opt))
      return;
    this.messageDbTasmota.push({ topic, payload, opt });
    if (this.messageTimeoutTasmota === void 0) {
      this.sendMessageLoopTasmota();
    }
  };
  sendMessageLoopTasmota = () => {
    const msg = this.messageDbTasmota.shift();
    if (msg === void 0 || this.unload) {
      this.messageTimeoutTasmota = void 0;
      return;
    }
    this.log.debug(`send payload: ${JSON.stringify(msg)} to panel.`);
    this.mqttClient.publish(msg.topic, msg.payload, msg.opt);
    this.messageTimeoutTasmota = this.adapter.setTimeout(this.sendMessageLoopTasmota, 20);
  };
  async delete() {
    await super.delete();
    if (this.messageTimeout)
      this.adapter.clearTimeout(this.messageTimeout);
    if (this.messageTimeoutTasmota)
      this.adapter.clearTimeout(this.messageTimeoutTasmota);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PanelSend
});
//# sourceMappingURL=panel-message.js.map
