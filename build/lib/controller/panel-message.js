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
  BERRY_DRIVER_CRC_PREFIX: () => BERRY_DRIVER_CRC_PREFIX,
  DISPLAY_ACK_TIMEOUT: () => DISPLAY_ACK_TIMEOUT,
  PanelSend: () => PanelSend
});
module.exports = __toCommonJS(panel_message_exports);
var import_definition = require("../const/definition");
var import_library = require("./library");
var import_crc16 = require("../tools/crc16");
const STALE_DONE_WINDOW = 1e3;
const DONE_NEXT_DELAY = 250;
const DISPLAY_ACK_NEXT_DELAY = 0;
const DISPLAY_ACK_TIMEOUT = 500;
const BERRY_DRIVER_CRC_PREFIX = 12;
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
  /** Display ack mode: waits for the display ack after the 'Done' of the head of the queue */
  doneFallback;
  /**
   * The display acknowledges every processed message with `event,ack,<crc>` and a page change with
   * `event,renderCurrentPage,<crc>` (TFT 6.1.0+). Set by the first renderCurrentPage with a crc, reset by a
   * restart of the display.
   */
  _displayAck = false;
  _losingDelay = 1e3;
  panel = void 0;
  get displayAck() {
    return this._displayAck;
  }
  set displayAck(v) {
    if (v !== this._displayAck) {
      this.log.debug(`Display ack mode ${v ? "on" : "off"}`);
    }
    this._displayAck = v;
    if (!v) {
      this.clearDoneFallback();
    }
  }
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
    this.clearDoneFallback();
    this.losingMessageCount = 0;
    this._losingDelay = 1e3;
    this.staleDone = 0;
  }
  clearDoneFallback() {
    if (this.doneFallback) {
      this.adapter.clearTimeout(this.doneFallback);
    }
    this.doneFallback = void 0;
  }
  /**
   * Acknowledgement from the display with the crc of the message it processed (TFT 6.1.0+).
   * A `renderCurrentPage` with a crc switches to the display ack mode. Only an ack with the crc of the
   * head of the queue counts: `renderCurrentPage` for a pageType, `ack` for every other message.
   *
   * @param kind `ack` or `renderCurrentPage`
   * @param crc the crc the display sent
   */
  onDisplayAck(kind, crc) {
    if (this.unload || this.adapter.unload) {
      return;
    }
    if (kind === "renderCurrentPage") {
      this.displayAck = true;
    } else if (!this.displayAck) {
      if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`Ignore display ack ${crc} - display ack mode is off`);
      }
      return;
    }
    const head = this.messageDb[0];
    if (!head || head.sent === 0 || head.ackForType !== (kind === "renderCurrentPage") || head.crc !== crc) {
      if (this.adapter.config.debugLogMqtt) {
        this.log.debug(
          `Ignore display ${kind} ${crc} - ${head ? `head ${JSON.stringify(head)}` : "queue is empty"}`
        );
      }
      return;
    }
    this.acknowledgeHead(DISPLAY_ACK_NEXT_DELAY);
  }
  /**
   * The head of the queue reached its goal: remove it and send the next message after `delay`.
   *
   * @param delay pause before the next message (ms)
   */
  acknowledgeHead(delay) {
    if (this.messageTimeout) {
      this.adapter.clearTimeout(this.messageTimeout);
    }
    this.clearDoneFallback();
    this.losingMessageCount = 0;
    this._losingDelay = 1e3;
    const oldMessage = this.messageDb.shift();
    if (oldMessage) {
      const expected = oldMessage.sent - (this.displayAck || oldMessage.ackForType ? oldMessage.done : 1);
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
    if (this.unload || this.adapter.unload) {
      this.messageTimeout = void 0;
      return;
    }
    this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, delay);
  }
  /**
   * Display ack mode: Tasmota's 'Done' only tells that the bytes went to the display. Without a display ack
   * within {@link DISPLAY_ACK_TIMEOUT} the message counts as done anyway.
   *
   * @param head the head of the queue the 'Done' belongs to
   */
  onDoneInDisplayAckMode(head) {
    if (!head || head.sent === 0) {
      if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`Ignore 'Done' - ${head ? `${JSON.stringify(head)} not sent yet` : "queue is empty"}`);
      }
      return;
    }
    head.done++;
    if (head.ackForType || this.doneFallback) {
      return;
    }
    if (this.unload || this.adapter.unload) {
      return;
    }
    this.doneFallback = this.adapter.setTimeout(() => {
      this.doneFallback = void 0;
      if (this.messageDb[0] !== head) {
        return;
      }
      if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`No display ack for ${JSON.stringify(head)} - 'Done' counts`);
      }
      this.acknowledgeHead(0);
    }, DISPLAY_ACK_TIMEOUT);
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
        if (this.displayAck) {
          if (msg.CustomSend === "Done") {
            this.onDoneInDisplayAckMode(head);
          }
          return;
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
          this.acknowledgeHead(DONE_NEXT_DELAY);
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
    this.warnIfTooLong(payload);
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
    const replaced = this.findReplaceable(payload, ackForType, opt, lastPageType);
    if (replaced) {
      replaced.payload = payload;
      replaced.crc = (0, import_crc16.panelFrameCrc)(payload);
      return;
    }
    this.messageDb.push({
      payload,
      crc: (0, import_crc16.panelFrameCrc)(payload),
      opt,
      ackForType,
      sent: 0,
      done: 0
    });
    if (this.messageTimeout === void 0) {
      void this.sendMessageLoop();
    }
  };
  /**
   * The panel only needs the newest state of a page or of a popup: a new `entityUpd` takes the place of an older one
   * that was not sent yet, `entityUpdateDetail` per item id. Nothing moves in the queue. A message that was sent waits
   * for its ack and stays as it is, so ack and retry only ever see what was really sent. A pageType ends the page.
   *
   * @param payload the new message
   * @param ackForType kind of ack of the new message
   * @param opt options of the new message
   * @param lastPageType index of the last pageType in the queue
   * @returns the queued message to overwrite
   */
  findReplaceable(payload, ackForType, opt, lastPageType) {
    const fields = payload.split("~", 2);
    const isPage = fields[0] === "entityUpd";
    const isDetail = fields[0] === "entityUpdateDetail";
    if (!isPage && !isDetail) {
      return void 0;
    }
    for (let i = this.messageDb.length - 1; i > lastPageType; i--) {
      const queued = this.messageDb[i];
      const other = queued.payload.split("~", 2);
      if (queued.sent === 0 && queued.ackForType === ackForType && queued.opt === opt && other[0] === fields[0] && (isPage || other[1] === fields[1])) {
        return queued;
      }
    }
    return void 0;
  }
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
    this.addMessageTasmota(this.topic, this.withCrcPrefix(msg), msg.opt);
  };
  /**
   * A Berry driver of generation {@link BERRY_DRIVER_CRC_PREFIX} or newer takes the crc from the adapter:
   * `^XXXX^<payload>`. A web panel gets the payload as it is.
   *
   * @param msg the queued message
   * @returns what goes to the CustomSend topic
   */
  withCrcPrefix(msg) {
    var _a, _b;
    const panel = this.panel;
    if (!panel || panel.isVirtual || !(((_b = (_a = panel.info) == null ? void 0 : _a.nspanel) == null ? void 0 : _b.berryDriverVersion) >= BERRY_DRIVER_CRC_PREFIX)) {
      return msg.payload;
    }
    return `${(0, import_crc16.crcPrefix)(msg.crc)}${msg.payload}`;
  }
  /**
   * Logs a warning when the payload does not fit into the receive buffer of the display.
   * Only a warning - the message is sent anyway.
   *
   * @param payload the message for the panel
   */
  warnIfTooLong(payload) {
    var _a;
    if ((_a = this.panel) == null ? void 0 : _a.isVirtual) {
      return;
    }
    const bytes = Buffer.byteLength(payload, "utf8");
    if (bytes > import_definition.MAX_PANEL_PAYLOAD_BYTES) {
      this.log.warn(
        `Message to the panel has ${bytes} bytes, the display can receive only ${import_definition.MAX_PANEL_PAYLOAD_BYTES} bytes: ${payload.slice(0, 60)}...`
      );
    }
  }
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
    this.clearDoneFallback();
    this.onMessage = async () => {
    };
    this.panel = void 0;
    this.messageDb = [];
    this.messageDbTasmota = [];
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BERRY_DRIVER_CRC_PREFIX,
  DISPLAY_ACK_TIMEOUT,
  PanelSend
});
//# sourceMappingURL=panel-message.js.map
