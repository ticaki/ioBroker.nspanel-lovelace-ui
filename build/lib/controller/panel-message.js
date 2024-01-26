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
  BaseClassPanelSend: () => BaseClassPanelSend,
  PanelSend: () => PanelSend
});
module.exports = __toCommonJS(panel_message_exports);
var import_definition = require("../const/definition");
var import_library = require("../classes/library");
var import_states_controler = require("./states-controler");
class BaseClassPanelSend extends import_states_controler.BaseClassTriggerd {
  panelSend;
  sendToPanel;
  constructor(adapter, panelSend, name) {
    super(adapter, name);
    this.panelSend = panelSend;
    this.sendToPanel = panelSend.addMessage;
  }
  getPayloadArray(s) {
    return s.join("~");
  }
  getPayload(...s) {
    return s.join("~");
  }
}
class PanelSend extends import_library.BaseClass {
  messageDb = [];
  messageTimeout;
  mqttClient;
  topic = "";
  _panel = void 0;
  constructor(adapter, config) {
    super(adapter, config.name);
    this.mqttClient = config.mqttClient;
    this.topic = config.topic + import_definition.SendTopicAppendix;
  }
  set panel(panel) {
    this._panel = panel;
  }
  get panel() {
    if (!this._panel)
      throw new Error("Error P1: Panel undefinied!");
    return this._panel;
  }
  addMessage = (payload, opt) => {
    this.messageDb.push({ payload, opt });
    if (this.messageTimeout === void 0) {
      this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, 20);
    }
  };
  sendMessageLoop = () => {
    const msg = this.messageDb.shift();
    if (msg === void 0 || this.unload) {
      this.messageTimeout = void 0;
      return;
    }
    this.log.debug(`send payload: ${JSON.stringify(msg)} to panel.`);
    this.mqttClient.publish(this.topic, msg.payload, msg.opt);
    this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, 200);
  };
  async delete() {
    await super.delete();
    if (this.messageTimeout)
      this.adapter.clearTimeout(this.messageTimeout);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseClassPanelSend,
  PanelSend
});
//# sourceMappingURL=panel-message.js.map
