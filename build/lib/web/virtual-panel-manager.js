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
  legacyWebPanelTree: () => legacyWebPanelTree,
  removeLegacyWebPanelTrees: () => removeLegacyWebPanelTrees
});
module.exports = __toCommonJS(virtual_panel_manager_exports);
var import_library = require("../controller/library");
var import_virtual_panel_channel = require("./virtual-panel-channel");
const WEB_PANEL_GRACE_MS = 24 * 60 * 60 * 1e3;
const MAX_PENDING_ACKS = 256;
const WEB_PANEL_FALLBACK_TFT_VERSION = "1.0.0";
const LEGACY_WEB_TREE = /^(panels\.[^.]+_web[2-9]?)(\.|$)/;
function legacyWebPanelTree(id) {
  var _a;
  return (_a = LEGACY_WEB_TREE.exec(id)) == null ? void 0 : _a[1];
}
async function removeLegacyWebPanelTrees(adapter) {
  var _a;
  const prefix = `${adapter.namespace}.panels.`;
  let count = 0;
  try {
    const list = await adapter.getObjectListAsync({ startkey: prefix, endkey: `${prefix}\u9999` });
    const trees = /* @__PURE__ */ new Set();
    for (const row of (_a = list == null ? void 0 : list.rows) != null ? _a : []) {
      const id = row.id.startsWith(`${adapter.namespace}.`) ? row.id.slice(adapter.namespace.length + 1) : row.id;
      const tree = legacyWebPanelTree(id);
      if (tree) {
        trees.add(tree);
      }
    }
    for (const tree of trees) {
      await adapter.library.cleanUpTree([], [`${tree}.`], 2);
      await adapter.delObjectAsync(tree, { recursive: true });
      count++;
    }
  } catch (e) {
    adapter.log.warn(`Could not remove old web panel object trees: ${String(e)}`);
  }
  if (count > 0) {
    adapter.log.info(`Removed ${count} object tree(s) of former web panels (panels.*_web*)`);
  }
  return count;
}
class VirtualPanelManager extends import_library.BaseClass {
  controller;
  /** endpoint topic -> web panel */
  entries = /* @__PURE__ */ new Map();
  constructor(adapter, controller) {
    super(adapter, "WebPanels");
    this.controller = controller;
    controller.virtualPanelManager = this;
  }
  /** Hardware panels and standalone web panels a browser can connect to */
  listPanels() {
    var _a, _b;
    const result = [];
    for (const p of this.adapter.config.panels) {
      if (!p || !p.topic) {
        continue;
      }
      const kind = p.kind === "web" ? "web" : "tasmota";
      if (kind === "tasmota" && !this.controller.getPanelConfig(p.topic)) {
        continue;
      }
      result.push({
        topic: p.topic,
        id: p.id,
        name: p.name,
        model: p.model || "eu",
        kind,
        clients: (_b = (_a = this.entries.get(p.topic)) == null ? void 0 : _a.clients.size) != null ? _b : 0
      });
    }
    return result;
  }
  /**
   * Is there an endpoint for this topic or id?
   *
   * @param topicOrId topic or id of a hardware panel or a standalone web panel
   * @returns true if a browser can connect to it
   */
  hasPanel(topicOrId) {
    return this.resolve(topicOrId) !== void 0;
  }
  /**
   * The channel of a standalone web panel - created on first use, the controller hands it to
   * the panel. The same channel is kept when the panel is reloaded, so connected browsers
   * stay connected.
   *
   * @param topic topic of the web panel (admin table)
   * @returns the channel
   */
  channelFor(topic) {
    return this.channelForEntry(topic).channel;
  }
  /**
   * Connect a browser to the web panel of an endpoint. A clone is created on the first
   * connection. Sends the hello frame on success.
   *
   * @param topicOrId topic or id of a hardware panel or a standalone web panel
   * @param client the browser side
   * @returns the web panel, undefined if the browser could not be connected (it was told why
   * with `bye`, or just closed so it tries again when the panel is not running right now)
   */
  async attach(topicOrId, client) {
    if (this.unload || this.adapter.unload) {
      client.send({ t: "bye", reason: "shutdown" });
      client.close("shutdown");
      return void 0;
    }
    const target = this.resolve(topicOrId);
    if (!target) {
      this.log.warn(`No panel for '${topicOrId}'`);
      client.send({ t: "bye", reason: "unknown panel" });
      client.close("unknown panel");
      return void 0;
    }
    let entry;
    let panel;
    if (target.kind === "web") {
      entry = this.channelForEntry(target.topic);
      panel = this.controller.panels.find((p) => p.isVirtual && p.topic === target.topic);
      if (!panel) {
        this.log.debug(`Web panel ${target.topic} is not running - browser closed`);
        client.close("panel not running");
        return void 0;
      }
    } else {
      const real = this.controller.panels.find((p) => !p.isVirtual && p.topic === target.topic);
      if (!real) {
        this.log.debug(`Panel ${target.topic} is not running - browser closed`);
        client.close("panel not running");
        return void 0;
      }
      entry = this.entries.get(target.topic);
      if (!entry) {
        entry = await this.createClone(target.topic, target.id, target.name);
        if (!entry) {
          client.send({ t: "bye", reason: "unknown panel" });
          client.close("unknown panel");
          return void 0;
        }
      }
      panel = this.panelOf(entry);
      if (!panel) {
        client.send({ t: "bye", reason: "unknown panel" });
        client.close("unknown panel");
        return void 0;
      }
    }
    if (entry.graceTimer) {
      this.adapter.clearTimeout(entry.graceTimer);
      entry.graceTimer = void 0;
    }
    if (entry.clients.size === 0) {
      panel.panelSend.resetMessageDB();
    }
    entry.clients.add(client);
    client.send({
      t: "hello",
      model: panel.info.nspanel.model,
      topic: target.topic,
      name: panel.name,
      friendlyName: panel.friendlyName,
      tftVersion: this.tftVersion(panel.info.nspanel.model),
      kind: entry.kind
    });
    this.log.debug(`Browser connected to ${panel.friendlyName} (${entry.clients.size} connected)`);
    return entry;
  }
  /**
   * A browser went away. A clone without browsers is removed after the grace period.
   *
   * @param entry the web panel
   * @param client the browser that closed
   */
  detach(entry, client) {
    if (!entry.clients.delete(client)) {
      return;
    }
    if (entry.clients.size > 0 || this.unload || this.adapter.unload) {
      return;
    }
    const panel = this.panelOf(entry);
    if (panel && !panel.unload && panel.isOnline) {
      this.log.info(`No browser left on ${panel.friendlyName} - offline`);
      panel.isOnline = false;
    }
    if (entry.kind !== "clone") {
      return;
    }
    if (entry.graceTimer) {
      this.adapter.clearTimeout(entry.graceTimer);
    }
    entry.graceTimer = this.adapter.setTimeout(() => {
      entry.graceTimer = void 0;
      void this.removeEntry(entry, "grace period over", false);
    }, WEB_PANEL_GRACE_MS);
    this.log.debug(
      `Last browser of ${entry.topic} disconnected - clone kept for ${WEB_PANEL_GRACE_MS / 36e5} h`
    );
  }
  /**
   * A frame from a browser. `ack` with a `seq` is passed on once per `seq` (the first browser
   * wins), `ack` without `seq` always, `recv` always.
   *
   * @param entry the web panel
   * @param frame the parsed frame
   */
  async onClientFrame(entry, frame) {
    if (entry.channel.unload) {
      return;
    }
    if (frame.t === "recv") {
      await entry.channel.injectReceive(frame.p);
      return;
    }
    if (frame.seq === void 0) {
      await entry.channel.injectAck();
      return;
    }
    const index = entry.pending.indexOf(frame.seq);
    if (index === -1) {
      if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`Ignore repeated ack ${frame.seq} for ${entry.topic}`);
      }
      return;
    }
    entry.pending.splice(index, 1);
    await entry.channel.injectAck();
  }
  /**
   * Remove the clone of a hardware panel (the panel is removed or reloaded). Connected
   * browsers are closed without `bye`, so they connect again and get a fresh clone.
   *
   * @param topic topic of the hardware panel
   */
  async removeClonesOf(topic) {
    const entry = this.entries.get(topic);
    if (entry && entry.kind === "clone") {
      await this.removeEntry(entry, "panel removed", false);
    }
  }
  /** Remove every web panel and tell the browsers goodbye (adapter stops) */
  async deleteAll() {
    for (const entry of [...this.entries.values()]) {
      await this.removeEntry(entry, "shutdown", true);
    }
  }
  async delete() {
    await this.deleteAll();
    if (this.controller.virtualPanelManager === this) {
      this.controller.virtualPanelManager = void 0;
    }
    await super.delete();
  }
  /**
   * Endpoint of a topic or id from the admin panel table.
   *
   * @param topicOrId topic or id
   * @returns the table entry with its kind, undefined if unknown or (hardware) without configuration
   */
  resolve(topicOrId) {
    var _a;
    if (!topicOrId) {
      return void 0;
    }
    const row = (_a = this.adapter.config.panels.find((p) => p && p.topic === topicOrId)) != null ? _a : this.adapter.config.panels.find((p) => p && p.id === topicOrId);
    if (!row || !row.topic) {
      return void 0;
    }
    if (row.kind === "web") {
      return { topic: row.topic, id: row.id, name: row.name, kind: "web" };
    }
    if (!this.controller.getPanelConfig(row.topic)) {
      return void 0;
    }
    return { topic: row.topic, id: row.id, name: row.name, kind: "clone" };
  }
  channelForEntry(topic) {
    let entry = this.entries.get(topic);
    if (!entry) {
      entry = this.createEntry(topic, "web", topic);
    }
    return entry;
  }
  createEntry(topic, kind, channelTopic) {
    const channel = new import_virtual_panel_channel.VirtualPanelChannel(this.adapter, channelTopic, `WebChannel-${topic}`);
    const entry = {
      topic,
      kind,
      channel,
      clients: /* @__PURE__ */ new Set(),
      seq: 0,
      pending: [],
      graceTimer: void 0
    };
    channel.onCommand((payload) => {
      entry.seq++;
      entry.pending.push(entry.seq);
      if (entry.pending.length > MAX_PENDING_ACKS) {
        entry.pending.splice(0, entry.pending.length - MAX_PENDING_ACKS);
      }
      for (const c of entry.clients) {
        c.send({ t: "cmd", p: payload, seq: entry.seq });
      }
    });
    channel.onBuzzer((payload) => {
      for (const c of entry.clients) {
        c.send({ t: "buzzer", p: payload });
      }
    });
    this.entries.set(topic, entry);
    return entry;
  }
  /**
   * Create the clone of a hardware panel: same configuration, same states tree (`name` = id of
   * the hardware panel), own topic `<topic>/web` and an in-process channel.
   *
   * @param topic topic of the hardware panel
   * @param id id of the hardware panel (admin table)
   * @param name name of the hardware panel (admin table)
   * @returns the entry, undefined if the panel could not be created
   */
  async createClone(topic, id, name) {
    var _a;
    const source = this.controller.getPanelConfig(topic);
    if (!source) {
      return void 0;
    }
    const { channel: _channel, controller: _controller, ...plain } = source;
    const config = structuredClone(plain);
    config.name = id || this.library.cleandp(topic);
    config.friendlyName = `${name || topic} (Web)`;
    config.topic = `${topic}/web`;
    config.sourceTopic = topic;
    config.kind = "web";
    config.model = ((_a = this.adapter.config.panels.find((p) => p.topic === topic)) == null ? void 0 : _a.model) || config.model || "eu";
    const entry = this.createEntry(topic, "clone", config.topic);
    const panel = await this.controller.addVirtualPanel(config, entry.channel);
    if (!panel) {
      this.entries.delete(topic);
      await entry.channel.delete();
      return void 0;
    }
    this.log.info(`Web panel ${config.friendlyName} created for ${topic}`);
    return entry;
  }
  async removeEntry(entry, reason, bye) {
    if (!this.entries.delete(entry.topic)) {
      return;
    }
    if (entry.graceTimer) {
      this.adapter.clearTimeout(entry.graceTimer);
      entry.graceTimer = void 0;
    }
    for (const c of entry.clients) {
      if (bye) {
        c.send({ t: "bye", reason });
      }
      c.close(reason);
    }
    entry.clients.clear();
    if (entry.kind === "clone") {
      const panel = this.panelOf(entry);
      if (panel) {
        await this.controller.removePanel(panel);
      }
      this.log.info(`Web panel of ${entry.topic} removed (${reason})`);
    }
    await entry.channel.delete();
  }
  /**
   * The panel instance that talks through the channel of this entry.
   *
   * @param entry the web panel
   * @returns the panel, undefined while it is not (or no longer) created
   */
  panelOf(entry) {
    return this.controller.panels.find((p) => p.isVirtual && p.topic === entry.channel.topic);
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
  legacyWebPanelTree,
  removeLegacyWebPanelTrees
});
//# sourceMappingURL=virtual-panel-manager.js.map
