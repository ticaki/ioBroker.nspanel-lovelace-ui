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
var virtual_panel_channel_exports = {};
__export(virtual_panel_channel_exports, {
  VirtualPanelChannel: () => VirtualPanelChannel,
  mqttTopicMatches: () => mqttTopicMatches
});
module.exports = __toCommonJS(virtual_panel_channel_exports);
var import_library = require("../controller/library");
function mqttTopicMatches(filter, topic) {
  const f = filter.split("/");
  const t = topic.split("/");
  for (let i = 0; i < f.length; i++) {
    if (f[i] === "#") {
      return true;
    }
    if (i >= t.length) {
      return false;
    }
    if (f[i] !== "+" && f[i] !== t[i]) {
      return false;
    }
  }
  return f.length === t.length;
}
class VirtualPanelChannel extends import_library.BaseClass {
  topic;
  subscriptions = [];
  commandListeners = [];
  buzzerListeners = [];
  constructor(adapter, topic, name = "") {
    super(adapter, name || `VirtualChannel-${topic}`);
    this.topic = topic;
  }
  onCommand(listener) {
    if (!this.commandListeners.includes(listener)) {
      this.commandListeners.push(listener);
    }
  }
  onBuzzer(listener) {
    if (!this.buzzerListeners.includes(listener)) {
      this.buzzerListeners.push(listener);
    }
  }
  offCommand(listener) {
    this.commandListeners = this.commandListeners.filter((l) => l !== listener);
  }
  offBuzzer(listener) {
    this.buzzerListeners = this.buzzerListeners.filter((l) => l !== listener);
  }
  async publish(topic, message, _opt) {
    if (this.unload) {
      return;
    }
    const command = this.commandOf(topic);
    switch (command) {
      case "CustomSend": {
        for (const l of this.commandListeners) {
          l(message);
        }
        break;
      }
      case "Buzzer": {
        for (const l of this.buzzerListeners) {
          l(message);
        }
        break;
      }
      default: {
        if (this.adapter.config.debugLogMqtt) {
          this.log.debug(`Dropped ${topic} (${message}) - not supported by web panels`);
        }
      }
    }
    return Promise.resolve();
  }
  subscribe(filter, callback) {
    if (!this.subscriptions.some((s) => s.filter === filter && s.callback === callback)) {
      this.subscriptions.push({ filter, callback });
    }
    return Promise.resolve();
  }
  unsubscribe(filter) {
    const index = this.subscriptions.findIndex((s) => s.filter === filter);
    if (index !== -1) {
      this.subscriptions.splice(index, 1);
    }
  }
  removeByFunction(callback) {
    this.subscriptions = this.subscriptions.filter((s) => s.callback !== callback);
  }
  /**
   * Deliver an event of the browser as `<topic>/tele/RESULT` `{"CustomRecv": payload}`.
   *
   * @param payload the event string, e.g. `event,buttonPress2,…`
   */
  async injectReceive(payload) {
    await this.deliver(`${this.topic}/tele/RESULT`, JSON.stringify({ CustomRecv: payload }));
  }
  /**
   * Deliver the acknowledgement Tasmota would send for a CustomSend: `<topic>/stat/RESULT`
   * `{"CustomSend":"Done"}`.
   */
  async injectAck() {
    await this.deliver(`${this.topic}/stat/RESULT`, JSON.stringify({ CustomSend: "Done" }));
  }
  async delete() {
    await super.delete();
    this.subscriptions = [];
    this.commandListeners = [];
    this.buzzerListeners = [];
  }
  commandOf(topic) {
    const prefix = `${this.topic}/cmnd/`;
    return topic.startsWith(prefix) ? topic.slice(prefix.length) : void 0;
  }
  async deliver(topic, message) {
    if (this.unload) {
      return;
    }
    for (const s of [...this.subscriptions]) {
      if (!mqttTopicMatches(s.filter, topic)) {
        continue;
      }
      try {
        const remove = await s.callback(topic, message);
        if (remove === true) {
          this.subscriptions = this.subscriptions.filter((x) => x !== s);
        }
      } catch (e) {
        this.log.error(`Handler for ${topic} failed: ${String(e)}`);
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VirtualPanelChannel,
  mqttTopicMatches
});
//# sourceMappingURL=virtual-panel-channel.js.map
