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
var import_library = require("./library");
const STALE_DONE_WINDOW = 1e3;
class PanelSend extends import_library.BaseClass {
  messageDb = [];
  /**
   * 'Done' answers still expected for already acknowledged messages (sent more than once).
   * They must not acknowledge the next message - the count only holds until staleDoneUntil.
   */
  staleDone = 0;
  staleDoneUntil = 0;
  messageDbTasmota = [];
  messageTimeout;
  messageTimeoutTasmota;
  channel;
  topic = "";
  configTopic = "";
  losingMessageCount = 0;
  _losingDelay = 1e3;
  panel = void 0;
  get losingDelay() {
    return this._losingDelay;
  }
  set losingDelay(v) {
    this._losingDelay = Math.max(1e3, Math.min(3e4, v));
  }
  constructor(adapter, config) {
    super(adapter, config.name);
    this.channel = config.channel;
    void this.channel.subscribe(`${config.topic}/stat/RESULT`, this.onMessage);
    this.configTopic = config.topic;
    this.topic = config.topic + import_definition.SendTopicAppendix;
    this.panel = config.panel;
  }
  resetMessageDB() {
    this.messageDb = [];
    if (this.messageTimeout) {
      this.adapter.clearTimeout(this.messageTimeout);
    }
    this.messageTimeout = void 0;
    this.losingMessageCount = 0;
    this._losingDelay = 1e3;
    this.staleDone = 0;
  }
  onMessage = async (topic, message) => {
    if (this.unload || this.adapter.unload) {
      return;
    }
    if (!topic.endsWith("/stat/RESULT")) {
      return;
    }
    if (this.adapter.config.debugLogMqtt) {
      this.log.debug(`Receive command ${topic} with ${message}`);
    }
    try {
      const msg = JSON.parse(message);
      const head = this.messageDb[0];
      const ackForType = head && head.ackForType;
      if (msg) {
        if (msg.CustomSend === "Done" && this.staleDone > 0) {
          const stale = Date.now() <= this.staleDoneUntil;
          this.staleDone = stale ? this.staleDone - 1 : 0;
          if (stale) {
            if (this.adapter.config.debugLogMqtt) {
              this.log.debug(`Ignore late 'Done' of an already acknowledged message`);
            }
            return;
          }
        }
        if (ackForType && msg.CustomSend === "renderCurrentPage" || !ackForType && msg.CustomSend === "Done") {
          if (!head || head.sent === 0) {
            if (this.adapter.config.debugLogMqtt) {
              this.log.debug(
                `Ignore '${msg.CustomSend}' - ${head ? `${JSON.stringify(head)} not sent yet` : "queue is empty"}`
              );
            }
            return;
          }
          if (this.messageTimeout) {
            this.adapter.clearTimeout(this.messageTimeout);
          }
          this.losingMessageCount = 0;
          this._losingDelay = 1e3;
          const oldMessage = this.messageDb.shift();
          if (oldMessage) {
            const expected = oldMessage.sent - (oldMessage.ackForType ? oldMessage.done : 1);
            if (expected > 0) {
              this.staleDone = expected;
              this.staleDoneUntil = Date.now() + STALE_DONE_WINDOW;
            } else {
              this.staleDone = 0;
            }
            if (oldMessage.payload === "pageType~pageStartup") {
              this.messageDb = [];
            }
            if (this.adapter.config.debugLogMqtt) {
              this.log.debug(`Receive ack for ${JSON.stringify(oldMessage)}`);
            }
          }
          this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, 250);
        } else {
          if (ackForType && head.sent > 0 && msg.CustomSend === "Done") {
            head.done++;
          }
          if (this.adapter.config.additionalLog) {
            this.log.info(
              `1: ${!(ackForType && msg.CustomSend === "renderCurrentPage")} 2: ${!(!ackForType && msg.CustomSend === "Done")} msg: ${msg.CustomSend}`
            );
          }
        }
      }
    } catch (err) {
      this.log.error(`onMessage: ${err}`);
    }
  };
  addMessage = (payload, ackForType, force, opt) => {
    var _a;
    const lastPageType = this.messageDb.findLastIndex((a) => a.payload.startsWith("pageType~"));
    if (this.messageTimeout !== void 0 && this.messageDb.length > 0 && this.messageDb.slice(lastPageType + 1).some((a) => a.payload === payload && a.opt === opt)) {
      if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`Message ${payload} is already in queue - skip adding`);
      }
      return;
    }
    if (!((_a = this.panel) == null ? void 0 : _a.isOnline) && force !== true) {
      if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`Panel is offline - skip adding message ${payload}`);
      }
      return;
    }
    if (force === true) {
      this.resetMessageDB();
    }
    this.messageDb.push({ payload, opt, ackForType, sent: 0, done: 0 });
    if (this.messageTimeout === void 0) {
      void this.sendMessageLoop();
    }
  };
  sendMessageLoop = async () => {
    var _a, _b;
    const msg = this.messageDb[0];
    if (this.adapter.config.debugLogMqtt) {
      this.log.debug(
        `sendMessageLoop - messages in queue: ${this.messageDb.length} handling message: ${JSON.stringify(msg)}`
      );
    }
    if (msg === void 0 || this.unload) {
      if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`No message to send or unload - stop send loop`);
      }
      if (this.messageTimeout) {
        this.adapter.clearTimeout(this.messageTimeout);
      }
      this.messageTimeout = void 0;
      return;
    }
    if (this.losingMessageCount > 0 && this.adapter.config.additionalLog && ((_a = this.panel) == null ? void 0 : _a.isOnline)) {
      this.log.warn(`send payload: ${JSON.stringify(msg)} to panel. Losing count: ${this.losingMessageCount}`);
    }
    if (this.losingMessageCount++ > 5) {
      if (this.panel) {
        if (this.adapter.config.additionalLog && ((_b = this.panel) == null ? void 0 : _b.isOnline)) {
          this.log.error(`Losing ${this.losingMessageCount} messages - set panel offline!`);
        }
        this.panel.isOnline = false;
        if (this.panel.isVirtual) {
          await this.panel.setStatus("offline");
        } else if (this.panel.handleLostMessages()) {
          await this.panel.setStatus("offline");
        } else if (this.panel.status !== "flashing") {
          try {
            await this.adapter.fetch(`http://${this.panel.info.tasmota.net.IPAddress}/cm?`, void 0, 500);
          } catch {
            await this.panel.setStatus("offline");
            return;
          }
          await this.panel.setStatus("error");
        }
      }
    }
    this.losingDelay = this.losingDelay + 2e3;
    if (this.unload) {
      return;
    }
    if (!this.adapter.unload) {
      this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, this.losingDelay);
    }
    msg.sent++;
    this.addMessageTasmota(this.topic, msg.payload, msg.opt);
  };
  addMessageTasmota = (topic, payload, opt) => {
    if (this.messageDbTasmota.length > 0 && this.messageDbTasmota.some((a) => a.topic === topic && a.payload === payload && a.opt === opt)) {
      if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`Tasmota Message ${payload} is already in queue - skip adding`);
      }
      return;
    }
    if (this.unload || this.adapter.unload) {
      this.messageDbTasmota = [];
    }
    if (this.adapter.config.debugLogMqtt) {
      this.log.debug(`add Tasmota message ${payload} to queue`);
    }
    this.messageDbTasmota.push({ topic, payload, opt });
    if (this.messageTimeoutTasmota === void 0) {
      void this.sendMessageLoopTasmota();
    }
  };
  sendMessageLoopTasmota = async () => {
    var _a;
    const msg = this.messageDbTasmota.shift();
    if (msg === void 0) {
      if (this.messageTimeoutTasmota && this.messageTimeoutTasmota !== true) {
        this.adapter.clearTimeout(this.messageTimeoutTasmota);
      }
      this.messageTimeoutTasmota = void 0;
      return;
    }
    this.log.debug(`send payload: ${JSON.stringify(msg)} to panel.`);
    this.messageTimeoutTasmota = true;
    try {
      await this.channel.publish(msg.topic, msg.payload, { ...(_a = msg.opt) != null ? _a : {}, qos: 1 });
    } catch (e) {
      this.log.warn(`MQTT publish failed: ${e.message}`);
      this.messageDbTasmota.unshift(msg);
      this.losingDelay = this.losingDelay + 1e3;
    }
    if (this.unload || this.adapter.unload) {
      return;
    }
    this.messageTimeoutTasmota = this.adapter.setTimeout(this.sendMessageLoopTasmota, 10);
  };
  async delete() {
    await super.delete();
    this.channel.unsubscribe(`${this.configTopic}/stat/RESULT`);
    if (this.messageTimeout) {
      this.adapter.clearTimeout(this.messageTimeout);
    }
    if (this.messageTimeoutTasmota && this.messageTimeoutTasmota !== true) {
      this.adapter.clearTimeout(this.messageTimeoutTasmota);
    }
    this.onMessage = async () => {
    };
    this.panel = void 0;
    this.messageDb = [];
    this.messageDbTasmota = [];
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PanelSend
});
//# sourceMappingURL=panel-message.js.map
