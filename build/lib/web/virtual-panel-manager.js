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
var virtual_panel_manager_exports = {};
__export(virtual_panel_manager_exports, {
  VirtualPanelManager: () => VirtualPanelManager,
  WEB_PANEL_GRACE_MS: () => WEB_PANEL_GRACE_MS,
  WEB_PANEL_MAX_SESSIONS: () => WEB_PANEL_MAX_SESSIONS
});
module.exports = __toCommonJS(virtual_panel_manager_exports);
var import_node_crypto = require("node:crypto");
var import_library = require("../controller/library");
var import_virtual_panel_channel = require("./virtual-panel-channel");
const WEB_PANEL_GRACE_MS = 24 * 60 * 60 * 1e3;
const WEB_PANEL_MAX_SESSIONS = 8;
const WEB_PANEL_FALLBACK_TFT_VERSION = "1.0.0";
class VirtualPanelManager extends import_library.BaseClass {
  controller;
  sessions = /* @__PURE__ */ new Map();
  constructor(adapter, controller) {
    super(adapter, "WebPanels");
    this.controller = controller;
    controller.virtualPanelManager = this;
  }
  /** Real panels a browser can connect to */
  listPanels() {
    const result = [];
    for (const p of this.adapter.config.panels) {
      if (!p || !p.topic || !this.controller.getPanelConfig(p.topic)) {
        continue;
      }
      result.push({
        topic: p.topic,
        id: p.id,
        name: p.name,
        model: p.model || "eu",
        sessions: [...this.sessions.values()].filter((s) => s.sourceTopic === p.topic).length
      });
    }
    return result;
  }
  /**
   * Is there a real panel for this topic or id?
   *
   * @param topicOrId topic or id of the real panel
   * @returns true if a web panel can be created for it
   */
  hasPanel(topicOrId) {
    return this.controller.getPanelConfig(topicOrId) !== void 0;
  }
  /**
   * Bind a browser to a web panel: an existing session (same id, same real panel) is taken
   * over, otherwise a new clone is created. Sends the hello frame on success.
   *
   * @param topicOrId topic or id of the real panel
   * @param sessionId session id the browser remembered, undefined for a new one
   * @param client the browser side
   * @returns the session, undefined if no panel could be bound (client is told why and closed)
   */
  async attach(topicOrId, sessionId, client) {
    if (this.unload) {
      client.close("shutdown");
      return void 0;
    }
    const source = this.controller.getPanelConfig(topicOrId);
    if (!source || !source.topic) {
      this.log.warn(`No panel for '${topicOrId}'`);
      client.send({ t: "bye", reason: "unknown panel" });
      client.close("unknown panel");
      return void 0;
    }
    let session = sessionId ? this.sessions.get(sessionId) : void 0;
    if (session && session.sourceTopic !== source.topic) {
      session = void 0;
    }
    if (session) {
      if (session.graceTimer) {
        this.adapter.clearTimeout(session.graceTimer);
        session.graceTimer = void 0;
      }
      if (session.client && session.client !== client) {
        session.client.send({ t: "bye", reason: "replaced" });
        session.client.close("replaced");
      }
      session.client = client;
      this.log.debug(`Session ${session.id} bound again to ${session.panel.name}`);
    } else {
      session = await this.createSession(source, client);
      if (!session) {
        client.send({ t: "bye", reason: "no free slot" });
        client.close("no free slot");
        return void 0;
      }
    }
    client.send({
      t: "hello",
      session: session.id,
      model: session.panel.info.nspanel.model,
      topic: source.topic,
      name: session.panel.name,
      friendlyName: session.panel.friendlyName,
      tftVersion: this.tftVersion(session.panel.info.nspanel.model)
    });
    return session;
  }
  /**
   * The browser went away - keep the panel for the grace period.
   *
   * @param session the session
   * @param client the client that closed, ignored if the session was already taken over
   */
  detach(session, client) {
    if (session.client !== client) {
      return;
    }
    session.client = void 0;
    session.disconnectedAt = Date.now();
    if (this.unload || this.adapter.unload) {
      return;
    }
    session.graceTimer = this.adapter.setTimeout(() => {
      void this.removeSession(session, "grace period over");
    }, WEB_PANEL_GRACE_MS);
    this.log.debug(`Session ${session.id} disconnected - ${session.panel.name} kept for reconnect`);
  }
  /**
   * A frame from the browser.
   *
   * @param session the session
   * @param frame the parsed frame
   */
  async onClientFrame(session, frame) {
    if (session.channel.unload) {
      return;
    }
    if (frame.t === "ack") {
      await session.channel.injectAck();
    } else {
      await session.channel.injectReceive(frame.p);
    }
  }
  /**
   * Remove all web panels of a real panel.
   *
   * @param topic topic of the real panel
   */
  async removeClonesOf(topic) {
    for (const session of [...this.sessions.values()]) {
      if (session.sourceTopic === topic) {
        await this.removeSession(session, "panel removed");
      }
    }
  }
  async deleteAll() {
    for (const session of [...this.sessions.values()]) {
      await this.removeSession(session, "shutdown");
    }
  }
  async delete() {
    await this.deleteAll();
    if (this.controller.virtualPanelManager === this) {
      this.controller.virtualPanelManager = void 0;
    }
    await super.delete();
  }
  async createSession(source, client) {
    var _a, _b, _c, _d;
    const sourceTopic = source.topic;
    const slot = this.freeSlot(sourceTopic);
    if (slot === void 0) {
      this.log.warn(`No free web panel slot for ${sourceTopic} (max ${WEB_PANEL_MAX_SESSIONS})`);
      return void 0;
    }
    const id = (_b = (_a = this.adapter.config.panels.find((p) => p.topic === sourceTopic)) == null ? void 0 : _a.id) != null ? _b : this.library.cleandp(sourceTopic);
    const realName = (_d = (_c = this.adapter.config.panels.find((p) => p.topic === sourceTopic)) == null ? void 0 : _c.name) != null ? _d : sourceTopic;
    const sessionId = (0, import_node_crypto.randomUUID)();
    const { channel: _channel, controller: _controller, ...plain } = source;
    const config = structuredClone(plain);
    config.name = slot === 1 ? `${id}_web` : `${id}_web${slot}`;
    config.friendlyName = slot === 1 ? `${realName} (Web)` : `${realName} (Web ${slot})`;
    config.topic = `${sourceTopic}/web/${sessionId}`;
    config.sourceTopic = sourceTopic;
    config.kind = "web";
    const channel = new import_virtual_panel_channel.VirtualPanelChannel(this.adapter, config.topic, `${config.friendlyName}-Channel`);
    channel.onCommand((payload) => {
      var _a2;
      const s = this.sessions.get(sessionId);
      (_a2 = s == null ? void 0 : s.client) == null ? void 0 : _a2.send({ t: "cmd", p: payload });
    });
    channel.onBuzzer((payload) => {
      var _a2;
      const s = this.sessions.get(sessionId);
      (_a2 = s == null ? void 0 : s.client) == null ? void 0 : _a2.send({ t: "buzzer", p: payload });
    });
    const panel = await this.controller.addVirtualPanel(config, channel);
    if (!panel) {
      await channel.delete();
      return void 0;
    }
    const session = {
      id: sessionId,
      sourceTopic,
      slot,
      panel,
      channel,
      client,
      graceTimer: void 0,
      disconnectedAt: 0
    };
    this.sessions.set(sessionId, session);
    this.log.info(`Web panel ${panel.name} created for ${sourceTopic}`);
    return session;
  }
  /**
   * Lowest free slot; if all are taken, the slot of the longest disconnected session is freed.
   *
   * @param sourceTopic topic of the real panel
   * @returns the slot, undefined if every slot has a connected browser
   */
  freeSlot(sourceTopic) {
    const used = [...this.sessions.values()].filter((s) => s.sourceTopic === sourceTopic);
    for (let slot = 1; slot <= WEB_PANEL_MAX_SESSIONS; slot++) {
      if (!used.some((s) => s.slot === slot)) {
        return slot;
      }
    }
    const idle = used.filter((s) => !s.client).sort((a, b) => a.disconnectedAt - b.disconnectedAt).shift();
    if (!idle) {
      return void 0;
    }
    void this.removeSession(idle, "slot needed");
    return idle.slot;
  }
  async removeSession(session, reason) {
    if (!this.sessions.delete(session.id)) {
      return;
    }
    if (session.graceTimer) {
      this.adapter.clearTimeout(session.graceTimer);
      session.graceTimer = void 0;
    }
    if (session.client) {
      session.client.send({ t: "bye", reason });
      session.client.close(reason);
      session.client = void 0;
    }
    await this.controller.removePanel(session.panel);
    await session.channel.delete();
    this.log.info(`Web panel ${session.panel.name} removed (${reason})`);
  }
  tftVersion(model) {
    const suffix = model === "eu" ? "" : `-${model}`;
    const key = this.adapter.config.useBetaTFT ? `tft${suffix}-beta` : `tft${suffix}`;
    return this.controller.globalPanelInfo.availableTftFirmwareVersion[key] || WEB_PANEL_FALLBACK_TFT_VERSION;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VirtualPanelManager,
  WEB_PANEL_GRACE_MS,
  WEB_PANEL_MAX_SESSIONS
});
//# sourceMappingURL=virtual-panel-manager.js.map
