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
var states_controller_exports = {};
__export(states_controller_exports, {
  StatesControler: () => StatesControler
});
module.exports = __toCommonJS(states_controller_exports);
var import_data_item = require("./data-item");
var import_library = require("./library");
var import_tools = require("../const/tools");
class StatesControler extends import_library.BaseClass {
  triggerDB = {};
  /**
   * Subscriptions by pattern, for states that come and go at runtime: per pattern one subscription of the adapter
   * and any number of listeners. Kept apart from triggerDB, which needs an entry per existing id - so unsubscribing
   * an id there never touches a pattern. A state matched by a pattern and an id can arrive twice, the listeners
   * have to take that.
   */
  patternTriggers = /* @__PURE__ */ new Map();
  lastObjectDatabaseCleanup = Date.now();
  // Performance-optimized lookup maps
  targetToTriggerMap = /* @__PURE__ */ new Map();
  activeTriggerCount = /* @__PURE__ */ new Map();
  /**
   * Holds subscriptions created while the subscription system is temporarily blocked.
   *
   * - `undefined`: blocking is not active (normal mode, new subscriptions are applied immediately).
   * - `string[]`: blocking is active; new subscriptions are collected here until the block is lifted.
   */
  blockedSubscriptions;
  deletePageInterval;
  stateDB = {};
  objectDatabase = {};
  intervalObjectDatabase;
  /** wait before the collected object subscriptions are sent - many triggers arrive at once on a startup */
  static OBJECT_SUBSCRIBE_DELAY_MS = 500;
  /**
   * An object subscription outlives its triggerDB entry this long: a page change removes the entries of the hidden
   * page and the next visit brings them back - that must not unsubscribe and subscribe again every time.
   */
  static OBJECT_UNSUBSCRIBE_GRACE_MS = 18e4;
  /** common fields the panel was built on - existing elements keep them, see onObjectChange */
  static STRUCTURE_COMMON_KEYS = ["role", "type", "write", "read"];
  /** ids whose object is subscribed (or about to be): the foreign ids of triggerDB plus those within the grace time */
  objectSubscriptions = /* @__PURE__ */ new Set();
  /** collected ids for the next {@link flushObjectSubscriptions} */
  objectSubscribeQueue = /* @__PURE__ */ new Set();
  objectSubscribeTimeout;
  /** ids that left triggerDB, still subscribed: since when - see {@link expireObjectSubscriptions} */
  objectUnsubscribePending = /* @__PURE__ */ new Map();
  /** ids that were told once that a structure field changed / that the object was deleted */
  objectStructureReported = /* @__PURE__ */ new Set();
  objectDeletedReported = /* @__PURE__ */ new Set();
  timespan;
  constructor(adapter, name = "", timespan = 500) {
    super(adapter, name || "StatesDB");
    this.timespan = timespan;
    this.deletePageInterval = this.adapter.setInterval(async () => {
      void this.deletePageLoop();
    }, 18e4);
    this.intervalObjectDatabase = this.adapter.setInterval(() => {
      if (this.unload || this.adapter.unload) {
        return;
      }
      this.objectDatabase = {};
      this.cleanupStateDB();
      void this.expireObjectSubscriptions();
    }, 18e4);
  }
  deletePageLoop = async (f) => {
    var _a, _b, _c, _d, _e;
    const removeIds = [];
    for (const id in this.triggerDB) {
      const entry = this.triggerDB[id];
      const removeIdx = [];
      if (f && entry.f === f) {
        removeIds.push(id);
        continue;
      }
      for (let i = 0; i < entry.to.length; i++) {
        const it = entry.to[i];
        if ((it == null ? void 0 : it.unload) || ((_a = it == null ? void 0 : it.parent) == null ? void 0 : _a.unload) || ((_c = (_b = it == null ? void 0 : it.parent) == null ? void 0 : _b.basePanel) == null ? void 0 : _c.unload) || ((_e = (_d = it == null ? void 0 : it.parent) == null ? void 0 : _d.parent) == null ? void 0 : _e.unload)) {
          removeIdx.push(i);
        }
      }
      if (removeIdx.length > 0) {
        removeIdx.sort((a, b) => b - a);
        const arrayProperties = ["to", "subscribed", "triggerAllowed", "change"];
        for (const idx of removeIdx) {
          for (const prop of arrayProperties) {
            const arr = entry[prop];
            if (arr && Array.isArray(arr) && idx >= 0 && idx < arr.length) {
              arr.splice(idx, 1);
            }
          }
        }
        for (const idx of removeIdx) {
          const target = entry.to[idx];
          if (target) {
            this.removeFromTargetMap(target, id);
          }
        }
      }
      if (entry.to.length === 0 && !entry.internal) {
        removeIds.push(id);
      }
    }
    this.blockedSubscriptions = [];
    for (const id of removeIds) {
      if (!id.startsWith(this.adapter.namespace)) {
        if (!id.startsWith(this.adapter.namespace)) {
          await this.adapter.unsubscribeForeignStatesAsync(id);
        }
      }
      delete this.triggerDB[id];
      this.activeTriggerCount.delete(id);
      this.releaseObjectSubscription(id);
    }
    while (this.blockedSubscriptions && this.blockedSubscriptions.length > 0) {
      for (let idx = this.blockedSubscriptions.length - 1; idx >= 0; idx--) {
        if (idx >= this.blockedSubscriptions.length) {
          continue;
        }
        const id = this.blockedSubscriptions[idx];
        if (!id.startsWith(this.adapter.namespace)) {
          await this.adapter.subscribeForeignStatesAsync(id);
        }
        this.blockedSubscriptions.splice(idx, 1);
      }
    }
    this.blockedSubscriptions = void 0;
  };
  async delete() {
    await super.delete();
    if (StatesControler.tempObjectDBTimeout) {
      this.adapter.clearTimeout(StatesControler.tempObjectDBTimeout);
    }
    if (this.intervalObjectDatabase) {
      this.adapter.clearInterval(this.intervalObjectDatabase);
    }
    if (this.deletePageInterval) {
      this.adapter.clearInterval(this.deletePageInterval);
    }
    if (this.objectSubscribeTimeout) {
      this.adapter.clearTimeout(this.objectSubscribeTimeout);
      this.objectSubscribeTimeout = void 0;
    }
    const subscribed = [...this.objectSubscriptions].filter((id) => !this.objectSubscribeQueue.has(id));
    this.objectSubscriptions.clear();
    this.objectSubscribeQueue.clear();
    this.objectUnsubscribePending.clear();
    if (subscribed.length > 0) {
      try {
        await this.adapter.unsubscribeForeignObjectsAsync(subscribed);
      } catch {
      }
    }
    this.targetToTriggerMap.clear();
    this.activeTriggerCount.clear();
  }
  // Performance optimization helper methods
  addToTargetMap(target, triggerId) {
    if (!this.targetToTriggerMap.has(target)) {
      this.targetToTriggerMap.set(target, /* @__PURE__ */ new Set());
    }
    this.targetToTriggerMap.get(target).add(triggerId);
  }
  removeFromTargetMap(target, triggerId) {
    const triggers = this.targetToTriggerMap.get(target);
    if (triggers) {
      triggers.delete(triggerId);
      if (triggers.size === 0) {
        this.targetToTriggerMap.delete(target);
      }
    }
  }
  incrementActiveTrigger(triggerId) {
    const current = this.activeTriggerCount.get(triggerId) || 0;
    this.activeTriggerCount.set(triggerId, current + 1);
  }
  decrementActiveTrigger(triggerId) {
    const current = this.activeTriggerCount.get(triggerId) || 0;
    if (current <= 1) {
      this.activeTriggerCount.delete(triggerId);
    } else {
      this.activeTriggerCount.set(triggerId, current - 1);
    }
  }
  /**
   * Cleanup expired entries from stateDB to prevent memory leaks
   * OPTIMIERT: Regelmäßige Bereinigung des Cache
   */
  cleanupStateDB() {
    const now = Date.now();
    const expiredIds = [];
    for (const id in this.stateDB) {
      const entry = this.stateDB[id];
      const age = now - entry.ts;
      if (age > this.timespan * 2) {
        expiredIds.push(id);
      }
    }
    for (const id of expiredIds) {
      delete this.stateDB[id];
    }
    if (expiredIds.length > 0 && this.adapter.config.debugLogStates) {
      this.log.debug(`Cleaned up ${expiredIds.length} expired stateDB entries`);
    }
  }
  clearObjectDatabase() {
    if (this.lastObjectDatabaseCleanup > Date.now() - 2e4) {
      return;
    }
    this.objectDatabase = {};
    this.lastObjectDatabaseCleanup = Date.now();
  }
  /**
   * Listens to all states of a pattern, also to those that do not exist yet. Pair with {@link unsubscribePattern}.
   *
   * @param pattern state id with `*`, it also matches across dots
   * @param listener gets id and state; state null when the state was deleted
   */
  async subscribePattern(pattern, listener) {
    const entry = this.patternTriggers.get(pattern);
    if (entry) {
      entry.listeners.add(listener);
      return;
    }
    const body = pattern.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
    this.patternTriggers.set(pattern, { regex: new RegExp(`^${body}$`), listeners: /* @__PURE__ */ new Set([listener]) });
    await this.adapter.subscribeForeignStatesAsync(pattern);
  }
  /**
   * Ends {@link subscribePattern}, the last listener of a pattern ends the subscription of the adapter.
   *
   * @param pattern the pattern
   * @param listener the listener
   */
  async unsubscribePattern(pattern, listener) {
    const entry = this.patternTriggers.get(pattern);
    if (!entry) {
      return;
    }
    entry.listeners.delete(listener);
    if (entry.listeners.size === 0) {
      this.patternTriggers.delete(pattern);
      await this.adapter.unsubscribeForeignStatesAsync(pattern);
    }
  }
  /**
   * hands a state to the listeners of its patterns
   *
   * @param dp state id
   * @param state the state, null when it was deleted
   */
  notifyPatternListeners(dp, state) {
    for (const entry of this.patternTriggers.values()) {
      if (entry.regex.test(dp)) {
        for (const listener of [...entry.listeners]) {
          listener(dp, state);
        }
      }
    }
  }
  /**
   * A state was deleted: only subscriptions by pattern care, an id of triggerDB keeps its last value.
   *
   * @param dp state id
   */
  onStateDeleted(dp) {
    this.notifyPatternListeners(dp, null);
  }
  existsState(id) {
    return this.triggerDB[id] !== void 0 || this.stateDB[id] !== void 0;
  }
  /**
   * Registriert einen Trigger auf einen *fremden* State (nicht im eigenen Namespace)
   * und initialisiert die Trigger-Datenbank inkl. Abo & aktuellem Wert.
   *
   * Hinweise:
   * - Eigene States (im Adapter-Namespace) sind hier verboten.
   * - Bei bereits existierendem Eintrag wird der Empfänger nur ergänzt.
   *
   * @param id        Fremd-State-ID
   * @param from      Auslösende/abonniert-werdende Klasse
   * @param internal  true = interner Trigger (kein Fremd-Abo erwartet)
   * @param trigger   ob dieser Empfänger durch Änderungen ausgelöst werden darf
   * @param change    optional: 'ts' → löse auch ohne Wert-/Ack-Änderung (Zeitstempel)
   */
  async setTrigger(id, from, internal = false, trigger = true, change) {
    if (id.startsWith(this.adapter.namespace) && !(id.includes(".alarm.") && (id.endsWith(".approve") || id.endsWith(".status")))) {
      this.log.warn(`Id: ${id} refers to the adapter's own namespace, this is not allowed!`);
      return;
    }
    const existing = this.triggerDB[id];
    if (existing) {
      const idx = existing.to.indexOf(from);
      if (idx === -1) {
        existing.to.push(from);
        existing.subscribed.push(false);
        existing.triggerAllowed.push(trigger);
        existing.change.push(change != null ? change : "ne");
        this.addToTargetMap(from, id);
        if (this.adapter.config.debugLogStates) {
          this.log.debug(`Add a trigger for ${from.name} to ${id}`);
        }
      }
      return;
    }
    if (internal) {
      this.log.error("setInternal Trigger too early");
      return;
    }
    this.triggerDB[id] = {
      state: { val: null, ack: false, ts: 0, from: "", lc: 0 },
      to: [from],
      ts: Date.now(),
      subscribed: [false],
      common: { name: id, type: "number", role: "state", write: false, read: true },
      triggerAllowed: [trigger],
      change: [change != null ? change : "ne"],
      internal: false,
      placeholder: true
    };
    try {
      const obj = await this.getObjectAsync(id);
      if (!obj || obj.type !== "state" || !obj.common) {
        delete this.triggerDB[id];
        throw new Error(`Got invalid object for ${id}`);
      }
      this.triggerDB[id].common = obj.common;
      delete this.triggerDB[id].placeholder;
      if (this.unload || this.adapter.unload) {
        return;
      }
      this.queueObjectSubscription(id);
      if (this.blockedSubscriptions) {
        if (!this.blockedSubscriptions.includes(id)) {
          this.blockedSubscriptions.push(id);
        }
      } else {
        if (!id.startsWith(this.adapter.namespace)) {
          await this.adapter.subscribeForeignStatesAsync(id);
        }
      }
      if (this.adapter.config.debugLogStates) {
        this.log.debug(`Set a new trigger for ${from.basePanel.name}.${from.name} to ${id}`);
      }
      this.addToTargetMap(from, id);
      const state = await this.adapter.getForeignStateAsync(id);
      if (state) {
        this.triggerDB[id].state = state;
      }
      if (this.stateDB[id]) {
        delete this.stateDB[id];
      }
    } catch (err) {
      delete this.triggerDB[id];
      this.releaseObjectSubscription(id);
      throw err;
    }
  }
  /**
   * Activate the triggers of a pageItem for self or parent. First subscribes to the state.
   * OPTIMIERT: Verwende performance maps für bessere Effizienz
   *
   * @param to Page
   */
  async activateTrigger(to) {
    if (!to) {
      return;
    }
    const triggerIds = this.targetToTriggerMap.get(to);
    if (triggerIds) {
      for (const id of triggerIds) {
        const entry = this.triggerDB[id];
        if (!entry) {
          continue;
        }
        const index = entry.to.indexOf(to);
        if (index === -1) {
          continue;
        }
        if (entry.subscribed[index]) {
          continue;
        }
        if (!entry.triggerAllowed[index]) {
          continue;
        }
        const hasActiveSubscription = entry.subscribed.some((a) => a);
        if (!hasActiveSubscription) {
          entry.subscribed[index] = true;
          this.incrementActiveTrigger(id);
          if (!id.startsWith(this.adapter.namespace)) {
            await this.adapter.subscribeForeignStatesAsync(id);
          }
          const state = await this.adapter.getForeignStateAsync(id);
          if (state) {
            entry.state = state;
          }
        } else {
          entry.subscribed[index] = true;
          this.incrementActiveTrigger(id);
        }
      }
    }
    for (const id in this.triggerDB) {
      const entry = this.triggerDB[id];
      const index = entry.to.findIndex((a) => a.parent && a.parent === to);
      if (index === -1) {
        continue;
      }
      if (entry.subscribed[index]) {
        continue;
      }
      if (!entry.triggerAllowed[index]) {
        continue;
      }
      const hasActiveSubscription = entry.subscribed.some((a) => a);
      if (!hasActiveSubscription) {
        entry.subscribed[index] = true;
        this.incrementActiveTrigger(id);
        if (!id.startsWith(this.adapter.namespace)) {
          await this.adapter.subscribeForeignStatesAsync(id);
        }
        const state = await this.adapter.getForeignStateAsync(id);
        if (state) {
          entry.state = state;
        }
      } else {
        entry.subscribed[index] = true;
        this.incrementActiveTrigger(id);
      }
    }
  }
  /**
   * Deactivate the triggers of a pageItem for self or parent page. Last unsubscribes to the state.
   * OPTIMIERT: Verwende performance maps und effizientere Suche
   *
   * @param to Page
   */
  async deactivateTrigger(to) {
    if (to.neverDeactivateTrigger) {
      return;
    }
    const triggerIds = this.targetToTriggerMap.get(to);
    if (triggerIds) {
      for (const id of triggerIds) {
        const entry = this.triggerDB[id];
        if (!entry || entry.internal) {
          continue;
        }
        const index = entry.to.indexOf(to);
        if (index === -1 || !entry.subscribed[index]) {
          continue;
        }
        const indexParent = entry.to.findIndex((a) => a.parent && a.parent === to);
        if (indexParent !== -1 && entry.subscribed[indexParent]) {
          continue;
        }
        entry.subscribed[index] = false;
        this.decrementActiveTrigger(id);
        if (this.adapter.config.debugLogStates) {
          this.log.debug(`Deactivate trigger from ${to.name} to ${id}`);
        }
        const hasActiveSubscriptions = entry.subscribed.some((a) => a);
        if (!hasActiveSubscriptions) {
          if (this.blockedSubscriptions) {
            const idx = this.blockedSubscriptions.indexOf(id);
            if (idx !== -1) {
              this.blockedSubscriptions.splice(idx, 1);
            }
          }
          if (!id.startsWith(this.adapter.namespace)) {
            await this.adapter.unsubscribeForeignStatesAsync(id);
          }
        }
      }
    }
    for (const id in this.triggerDB) {
      const entry = this.triggerDB[id];
      if (entry.internal) {
        continue;
      }
      const index = entry.to.indexOf(to);
      if (index === -1 || !entry.subscribed[index]) {
        continue;
      }
      const triggerIdsForTarget = this.targetToTriggerMap.get(to);
      if (triggerIdsForTarget && triggerIdsForTarget.has(id)) {
        continue;
      }
      const indexParent = entry.to.findIndex((a) => a.parent && a.parent === to);
      if (indexParent !== -1 && entry.subscribed[indexParent]) {
        continue;
      }
      entry.subscribed[index] = false;
      this.decrementActiveTrigger(id);
      if (this.adapter.config.debugLogStates) {
        this.log.debug(`Deactivate trigger from ${to.name} to ${id}`);
      }
      const hasActiveSubscriptions = entry.subscribed.some((a) => a);
      if (!hasActiveSubscriptions) {
        if (this.blockedSubscriptions) {
          const idx = this.blockedSubscriptions.indexOf(id);
          if (idx !== -1) {
            this.blockedSubscriptions.splice(idx, 1);
          }
        }
        if (!id.startsWith(this.adapter.namespace)) {
          await this.adapter.unsubscribeForeignStatesAsync(id);
        }
      }
    }
  }
  async getStateVal(id) {
    var _a;
    try {
      const state = await this.getState(id);
      if (state) {
        return (_a = state.val) != null ? _a : null;
      }
    } catch (e) {
      this.log.error(`Error 1004: ${typeof e === "string" ? e.replaceAll("Error: ", "") : e}`);
    }
    return null;
  }
  /**
   * Read a state from DB or js-controller
   * OPTIMIERT: Verbesserte Cache-Strategie und Performance
   *
   * @param id state id with namespace
   * @param internal if the state is internal
   * @returns nsPanelState or null
   */
  async getState(id, internal = false) {
    const triggerEntry = this.triggerDB[id];
    if (triggerEntry && (triggerEntry.internal || triggerEntry.subscribed.some((a) => a))) {
      let state = null;
      const f = triggerEntry.f;
      if (f) {
        state = {
          ...triggerEntry.state,
          val: await f(id, void 0)
        };
      } else {
        state = triggerEntry.state;
      }
      return state;
    }
    const cachedEntry = this.stateDB[id];
    if (cachedEntry) {
      const age = Date.now() - cachedEntry.ts;
      if (age < this.timespan) {
        return cachedEntry.state;
      }
      delete this.stateDB[id];
    }
    if (id.includes("/")) {
      internal = true;
    }
    if (!internal) {
      try {
        const state = await this.adapter.getForeignStateAsync(id);
        if (state != null) {
          if (!this.stateDB[id]) {
            const obj = await this.getObjectAsync(id);
            if (!obj || !obj.common || obj.type !== "state") {
              throw new Error(`Got invalid object for ${id}`);
            }
            this.stateDB[id] = { state, ts: Date.now(), common: obj.common };
          } else {
            this.stateDB[id].state = state;
            this.stateDB[id].ts = Date.now();
          }
          return state;
        }
        if (state === null) {
          return null;
        }
      } catch (e) {
        this.log.error(`Error 1005: ${typeof e === "string" ? e.replaceAll("Error: ", "") : e}`);
        return null;
      }
    }
    throw new Error(`State id invalid ${id} no data!`);
  }
  getType(id) {
    if (!id) {
      return void 0;
    }
    if (this.triggerDB[id] !== void 0 && this.triggerDB[id].common) {
      return this.triggerDB[id].common.type;
    }
    if (this.stateDB[id] !== void 0) {
      return this.stateDB[id].common.type;
    }
    return void 0;
  }
  async getCommonStates(id) {
    if (!id) {
      return null;
    }
    let j = void 0;
    if (this.triggerDB[id] !== void 0 && this.triggerDB[id].common && !this.triggerDB[id].placeholder) {
      j = this.triggerDB[id].common.states;
    } else if (this.stateDB[id] !== void 0 && this.stateDB[id].common) {
      j = this.stateDB[id].common.states;
    }
    if (!j || typeof j === "string") {
      return null;
    }
    if (Array.isArray(j)) {
      const a = {};
      j.forEach((e, i) => a[String(i)] = e);
      j = a;
    }
    return j;
  }
  /**
   * The most recent common the controller knows for a state - the display fields of a data item come from here.
   * Its structure fields are not meant to be used, they can be newer than what the data item checked.
   *
   * @param id state id
   * @returns the common or undefined if the state is not cached right now
   */
  getLiveCommon(id) {
    const trigger = this.triggerDB[id];
    if (trigger && !trigger.internal && !trigger.placeholder && trigger.common) {
      return trigger.common;
    }
    const cached = this.stateDB[id];
    if (cached == null ? void 0 : cached.common) {
      return cached.common;
    }
    const obj = this.objectDatabase[id];
    if (obj && obj.type === "state" && obj.common) {
      return obj.common;
    }
    return void 0;
  }
  /**
   * Subscribes the object of a foreign state of triggerDB - collected and sent as one call, see
   * {@link flushObjectSubscriptions}. Internal states (with '/') and the adapter's own states are left out.
   * An id within the grace time is still subscribed, it only loses its mark.
   *
   * @param id state id
   */
  queueObjectSubscription(id) {
    if (id.includes("/") || id.startsWith(this.adapter.namespace)) {
      return;
    }
    this.objectUnsubscribePending.delete(id);
    if (this.objectSubscriptions.has(id)) {
      return;
    }
    this.objectSubscriptions.add(id);
    this.objectSubscribeQueue.add(id);
    this.scheduleObjectSubscriptionFlush();
  }
  /**
   * An id left triggerDB: its object stays subscribed for {@link OBJECT_UNSUBSCRIBE_GRACE_MS}, a page change
   * usually brings it back. {@link expireObjectSubscriptions} ends it later.
   *
   * @param id state id
   */
  releaseObjectSubscription(id) {
    if (!this.objectSubscriptions.has(id)) {
      return;
    }
    if (this.objectSubscribeQueue.has(id)) {
      this.objectSubscribeQueue.delete(id);
      this.objectSubscriptions.delete(id);
      return;
    }
    if (!this.objectUnsubscribePending.has(id)) {
      this.objectUnsubscribePending.set(id, Date.now());
    }
  }
  /**
   * Ends the object subscriptions whose ids left triggerDB at least {@link OBJECT_UNSUBSCRIBE_GRACE_MS} ago and did
   * not come back - one call with all ids. Runs with the periodic cleanup of the object cache.
   *
   * @param now current time
   */
  async expireObjectSubscriptions(now = Date.now()) {
    const expired = [];
    for (const [id, since] of this.objectUnsubscribePending) {
      if (this.triggerDB[id]) {
        this.objectUnsubscribePending.delete(id);
        continue;
      }
      if (now - since >= StatesControler.OBJECT_UNSUBSCRIBE_GRACE_MS) {
        expired.push(id);
      }
    }
    if (expired.length === 0 || this.unload || this.adapter.unload) {
      return;
    }
    for (const id of expired) {
      this.objectUnsubscribePending.delete(id);
      this.objectSubscriptions.delete(id);
    }
    try {
      await this.adapter.unsubscribeForeignObjectsAsync(expired);
    } catch (e) {
      this.log.warn(`Cannot unsubscribe objects: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  scheduleObjectSubscriptionFlush() {
    if (this.objectSubscribeTimeout || this.unload || this.adapter.unload) {
      return;
    }
    this.objectSubscribeTimeout = this.adapter.setTimeout(() => {
      this.objectSubscribeTimeout = void 0;
      void this.flushObjectSubscriptions();
    }, StatesControler.OBJECT_SUBSCRIBE_DELAY_MS);
  }
  /**
   * Sends the collected object subscriptions - one call with all ids.
   */
  async flushObjectSubscriptions() {
    if (this.objectSubscribeTimeout) {
      this.adapter.clearTimeout(this.objectSubscribeTimeout);
      this.objectSubscribeTimeout = void 0;
    }
    const subscribe = [...this.objectSubscribeQueue];
    this.objectSubscribeQueue.clear();
    if (this.unload || this.adapter.unload) {
      return;
    }
    if (subscribe.length > 0) {
      try {
        await this.adapter.subscribeForeignObjectsAsync(subscribe);
      } catch (e) {
        this.log.warn(`Cannot subscribe objects: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  /**
   * A subscribed object changed. The display fields ({@link DISPLAY_COMMON_KEYS}) of the caches follow it and are
   * shown with the next update that comes anyway - an object change triggers no redraw of its own. The structure
   * fields of the caches stay as the existing elements were built on them - a change is reported once.
   * The object cache gets the whole new object, so elements created later use the new structure.
   * A deleted object changes nothing. Also an id within the grace time of its subscription is handled - without a
   * triggerDB entry only the object cache and stateDB are updated.
   *
   * @param id object id
   * @param obj the new object, null if it was deleted
   */
  onObjectChange(id, obj) {
    if (this.unload || this.adapter.unload) {
      return;
    }
    const entry = this.triggerDB[id];
    const trigger = entry && !entry.internal && !entry.placeholder ? entry : void 0;
    const cached = this.stateDB[id];
    if (!trigger && !cached && !this.objectSubscriptions.has(id)) {
      return;
    }
    if (!obj) {
      delete this.objectDatabase[id];
      if (!this.objectDeletedReported.has(id)) {
        this.objectDeletedReported.add(id);
        this.log.warn(
          `Object ${id} was deleted - the panel keeps its last values until the configuration changes or the adapter restarts`
        );
      }
      return;
    }
    if (obj.type !== "state" || !obj.common) {
      return;
    }
    this.objectDeletedReported.delete(id);
    this.objectDatabase[id] = obj;
    const common = obj.common;
    let structureChanged = false;
    for (const cache of [trigger, cached]) {
      if (!cache) {
        continue;
      }
      const changes = StatesControler.compareCommon(cache.common, common);
      structureChanged || (structureChanged = changes.structure);
      if (changes.display) {
        cache.common = StatesControler.withDisplayFields(cache.common, common);
      }
    }
    if (structureChanged && !this.objectStructureReported.has(id)) {
      this.objectStructureReported.add(id);
      this.log.info(
        `Object ${id}: changed ${StatesControler.STRUCTURE_COMMON_KEYS.join("/")} - elements already shown keep the old settings until they are created again (e.g. on the next page change), decisions made when the configuration was built stay until the adapter restarts`
      );
    }
  }
  /**
   * Which kind of fields differ between two commons.
   *
   * @param before common in the cache
   * @param after common of the changed object
   * @returns display: a display field differs, structure: a structure field differs
   */
  static compareCommon(before, after) {
    const differs = (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]);
    return {
      display: import_data_item.DISPLAY_COMMON_KEYS.some(differs),
      structure: StatesControler.STRUCTURE_COMMON_KEYS.some(differs)
    };
  }
  /**
   * A new common (new reference, so data items notice it) with the display fields of `source` and everything
   * else of `target`.
   *
   * @param target cached common
   * @param source common of the changed object
   * @returns the new common
   */
  static withDisplayFields(target, source) {
    const result = { ...target };
    for (const key of import_data_item.DISPLAY_COMMON_KEYS) {
      if (source[key] !== void 0) {
        Object.assign(result, { [key]: source[key] });
      } else {
        delete result[key];
      }
    }
    return result;
  }
  isStateValue(v) {
    return v === null || v === void 0 || typeof v === "string" || typeof v === "number" || typeof v === "boolean";
  }
  /**
   * Handle incoming state changes from ioBroker.
   *
   * Performance-optimized version for high-frequency calls (1000s per minute).
   * Responsibilities:
   *  - Update the internal triggerDB entry for the given datapoint.
   *  - Decide whether the state change should trigger dependent classes.
   *  - Forward primitive values to library cache and panels if required.
   *  - Forward system.host changes to systemNotification.
   *
   * Notes:
   *  - Active subscriptions (visible & neverDeactivateTrigger) are checked later, not here.
   *  - Object values are ignored (only primitive values are cached/forwarded).
   *
   * @param dp     Datapoint ID (internal/external state id)
   * @param state  New ioBroker state object or null/undefined
   */
  async onStateChange(dp, state) {
    var _a, _b, _c, _d;
    if (!dp || !state) {
      return;
    }
    const adapterNamespace = this.adapter.namespace;
    const debugLogEnabled = this.adapter.config.debugLogStates;
    const startsWithUserdata = dp.startsWith("0_userdata.0");
    const startsWithAlias = dp.startsWith("alias.0");
    const startsWithNamespace = dp.startsWith(adapterNamespace);
    const entry = this.triggerDB[dp];
    if (this.patternTriggers.size > 0 && (state.ack || startsWithUserdata || startsWithAlias)) {
      this.notifyPatternListeners(dp, state);
    }
    if (entry == null ? void 0 : entry.state) {
      if (debugLogEnabled) {
        this.log.debug(`Trigger from ${dp} with state ${JSON.stringify(state)}`);
      }
      const oldVal = entry.state.val;
      const oldAck = entry.state.ack;
      const oldTs = entry.state.ts;
      const oldFrom = entry.state.from;
      const oldLc = entry.state.lc;
      entry.ts = Date.now();
      entry.state = state;
      entry.f !== void 0 && await entry.f(dp, entry.state);
      const isSystemOrAlias = startsWithUserdata || startsWithAlias || !state.ack && startsWithNamespace;
      const mayTrigger = state.ack || entry.internal || isSystemOrAlias;
      if (mayTrigger) {
        const to = entry.to;
        const toLength = to.length;
        if (toLength === 0) {
          return;
        }
        const changes = entry.change || [];
        const subscribed = entry.subscribed || [];
        const allowed = entry.triggerAllowed || [];
        const hasValChange = oldVal !== state.val;
        const hasAckChange = oldAck !== state.ack;
        let oldState;
        for (let i = 0; i < toLength; i++) {
          const target = to[i];
          if (target.unload) {
            continue;
          }
          const hasChange = hasValChange || hasAckChange || changes[i] === "ts";
          if (!hasChange) {
            if (debugLogEnabled) {
              this.log.debug(`Ignore trigger from state ${dp} no change!`);
            }
            continue;
          }
          if (!oldState) {
            oldState = {
              val: oldVal,
              ack: oldAck,
              from: oldFrom,
              ts: oldTs,
              lc: oldLc
            };
          }
          await target.onStateChange(dp, { old: oldState, new: state });
          const isSubscribed = target.neverDeactivateTrigger || subscribed[i];
          const isAllowed = allowed[i];
          if (!isSubscribed || !isAllowed) {
            if (debugLogEnabled && i === toLength - 1) {
              this.log.debug(`Ignore trigger from state ${dp} not subscribed or not allowed!`);
              this.log.debug(
                `c: ${target.name} !c.neverDeactivateTrigger: ${!target.neverDeactivateTrigger} && !subscribed[${i}]: ${!subscribed[i]} || !allowed[${i}]: ${!allowed[i]}`
              );
            }
            continue;
          }
          const parent = target.parent;
          if (parent && target.triggerParent && !parent.unload && !parent.sleep) {
            await ((_a = parent.onStateTriggerSuperDoNotOverride) == null ? void 0 : _a.call(parent, dp, target));
          } else {
            await ((_b = target.onStateTriggerSuperDoNotOverride) == null ? void 0 : _b.call(target, dp, target));
          }
        }
      } else if (debugLogEnabled) {
        this.log.debug(`Ignore trigger from state ${dp} ack is false!`);
      }
    } else if (this.stateDB[dp]) {
      const stateEntry = this.stateDB[dp];
      stateEntry.state = state;
      stateEntry.ts = state.ts;
    }
    const v = state.val;
    if (v !== null && v !== void 0 && typeof v === "object") {
      return;
    }
    if (!state.ack && startsWithNamespace) {
      const namespacePrefix = `${adapterNamespace}.`;
      const id = dp.slice(namespacePrefix.length);
      const libState = this.library.readdb(id);
      if (libState) {
        this.library.setdb(id, {
          ...libState,
          val: this.isStateValue(state.val) ? state.val : null,
          ts: state.ts,
          ack: state.ack
        });
        if (((_d = (_c = libState.obj) == null ? void 0 : _c.common) == null ? void 0 : _d.write) && this.adapter.controller) {
          await this.adapter.controller.onLibraryStateChange(id, state);
          const panels = this.adapter.controller.panels;
          for (const panel of panels) {
            await panel.onStateChange(id, state);
          }
        }
      }
    }
    if (dp.startsWith("system.host") && this.adapter.controller) {
      await this.adapter.controller.systemNotification.onStateChange(dp, state);
    }
  }
  async setState(item, val, writeable) {
    if (item.options.type === "state" || item.options.type === "triggered") {
      if (item.options.dp) {
        const ack = item.options.dp.startsWith(this.adapter.namespace);
        this.log.debug(`setState(${item.options.dp}, ${val}, ${ack})`);
        if (item.trueType() === "number" && typeof val === "string") {
          val = parseFloat(val);
        } else if (item.trueType() === "number" && typeof val === "boolean") {
          val = val ? 1 : 0;
        } else if (item.trueType() === "boolean") {
          val = !!val;
        }
        if (item.trueType() === "string") {
          val = String(val);
        }
        if (writeable) {
          try {
            await this.adapter.setForeignStateAsync(item.options.dp, val, ack);
          } catch (e) {
            this.log.error(
              `Cannot write state ${item.options.dp} with value ${val}: ${typeof e === "string" ? e : e.message}`
            );
            item.writeable = false;
            throw e;
          }
        } else {
          this.log.error(`Forbidden write attempts on a read-only state! id: ${item.options.dp}`);
        }
      }
    } else if (item.options.type === "internal" || item.options.type === "internalState") {
      if (this.triggerDB[item.options.dp]) {
        await this.setInternalState(item.options.dp, val, false);
      }
    }
  }
  /**
   * Set a internal state and trigger
   *
   * @param id something like 'cmd/blabla'
   * @param val Value
   * @param ack false use value/ true use func
   * @param common optional for first call
   * @param func optional for first call
   * @returns true if set
   */
  async setInternalState(id, val, ack = false, common = void 0, func = void 0) {
    var _a;
    if (this.triggerDB[id] !== void 0) {
      const f = this.triggerDB[id].f;
      const newState = {
        ...this.triggerDB[id].state,
        // if ack and function take value of function otherwise val
        val: ack && f ? (_a = await f(id, void 0)) != null ? _a : val : val,
        ack,
        ts: Date.now()
      };
      await this.onStateChange(id, newState);
      return true;
    } else if (common) {
      if (this.adapter.config.debugLogStates) {
        this.log.debug(`Add internal state ${id} with ${JSON.stringify(common)}`);
      }
      this.triggerDB[id] = {
        state: { ts: Date.now(), val: null, ack, from: "", lc: Date.now() },
        to: [],
        ts: Date.now(),
        subscribed: [],
        common,
        internal: true,
        f: func,
        triggerAllowed: [],
        change: []
      };
    }
    return false;
  }
  /**
   * Create dataitems from a json (deep)
   *
   * @param data Json with configuration to create dataitems
   * @param parent Page etc.
   * @param target optional target
   * @param path optional path
   * @param options so far only constant to use in getState().read
   * @returns then json with values dataitem or undefined
   */
  async createDataItems(data, parent, target = {}, path = "data", options) {
    var _a, _b;
    for (const i in data) {
      const d = data[i];
      if (d === void 0) {
        continue;
      }
      if (typeof d === "object" && !("type" in d)) {
        target[i] = await this.createDataItems(
          d,
          parent,
          ((_a = target[i]) != null ? _a : Array.isArray(d)) ? [] : {},
          `${path}.${i}`,
          options
        );
      } else if (typeof d === "object" && "type" in d) {
        target[i] = data[i] !== void 0 ? (_b = await import_data_item.Dataitem.create(
          this.adapter,
          { ...d, name: `${this.name}.${parent.name}.${i}.${path}`, constants: options },
          parent,
          this
        )) != null ? _b : void 0 : void 0;
        if (target[i] !== void 0 && !await target[i].isValidAndInit()) {
          target[i] = void 0;
        }
      }
    }
    if (Object.keys(target).length === 0) {
      return void 0;
    }
    return target;
  }
  /**
   * Temporäes Datenobject zum speichern aller Enums und Objecte
   */
  static TempObjectDB = {
    data: void 0,
    keys: [],
    enums: void 0
  };
  static tempObjectDBTimeout;
  static getTempObjectDB(adapter) {
    if (StatesControler.tempObjectDBTimeout) {
      adapter.clearTimeout(StatesControler.tempObjectDBTimeout);
    }
    if (!adapter.unload) {
      StatesControler.tempObjectDBTimeout = adapter.setTimeout(() => {
        if (adapter.unload) {
          return;
        }
        StatesControler.tempObjectDBTimeout = void 0;
        StatesControler.TempObjectDB = { data: void 0, keys: [], enums: void 0 };
      }, 2e4);
    }
    return StatesControler.TempObjectDB;
  }
  /**
   * Filterfunktion umso genauer die Filter um so weniger Ressourcen werden verbraucht.
   *
   * @param dpInit string RegExp oder '' für aus; string wird mit include verwendet.
   * @param enums string, string[], RegExp als String übergeben oder ein String der mit include verwenden wird.
   * @returns 2 arrays keys: gefilterte keys und data: alle Objekte...
   */
  async getFilteredObjects(dpInit, enums) {
    const tempObjectDB = StatesControler.getTempObjectDB(this.adapter);
    if (!tempObjectDB.data) {
      tempObjectDB.data = await this.adapter.getForeignObjectsAsync(`*`);
      if (!tempObjectDB.data) {
        throw new Error("getObjects fail. Critical Error!");
      }
      tempObjectDB.keys = Object.keys(tempObjectDB.data);
      const temp = await this.adapter.getEnumsAsync(["rooms", "functions"]);
      tempObjectDB.enums = { ...temp["enum.rooms"], ...temp["enum.functions"] };
    }
    const result = {
      data: tempObjectDB.data,
      keys: tempObjectDB.keys
    };
    if (dpInit) {
      if (typeof dpInit !== "string") {
        result.keys = tempObjectDB.keys.filter((a) => a.match(dpInit) !== null);
      } else {
        result.keys = tempObjectDB.keys.filter((a) => a.includes(dpInit));
      }
    }
    if (enums && tempObjectDB.enums) {
      if (typeof enums === "string") {
        enums = [enums];
      }
      let r;
      for (const e of enums) {
        const regexp = (0, import_tools.getRegExp)(e);
        let t = [];
        for (const a in tempObjectDB.enums) {
          if (!regexp && a.includes(e) || regexp && a.match(regexp) !== null) {
            if (tempObjectDB.enums[a] && tempObjectDB.enums[a].common && tempObjectDB.enums[a].common.members) {
              t = t.concat(tempObjectDB.enums[a].common.members);
            }
          }
        }
        if (!r) {
          r = t;
        } else {
          r = r.filter((a) => t.indexOf(a) !== -1);
        }
      }
      result.keys = result.keys.filter((a) => r && r.some((b) => a.startsWith(b)));
    }
    return result;
  }
  /**
   * Retrieves the ID of a state automatically based on the provided options.
   *
   * @param options - Configuration for the automatic state lookup.
   * @param options.dpInit - The initial data point, either a string or a regular expression.
   * @param options.role - The expected role of the state, either a single StateRole or an array of roles.
   * @param options.enums - One or more enum IDs that the state should belong to.
   * @param options.regexp - A regular expression to match the state ID.
   * @param options.triggered - If true, the returned object will be of type "triggered" instead of "state".
   * @param options.writeable - If true, only writeable states will be considered.
   * @param options.commonType - The expected common type of the state, either a single type or an array of types.
   * @param options.warnIfNoStates - false: no warning when dpInit has no states at all (default true).
   * @returns A promise that resolves to a `DataItemsOptions` object if a matching state is found,
   * otherwise `undefined`.
   */
  async getIdbyAuto(options) {
    const {
      dpInit,
      role = "",
      enums = "",
      regexp,
      triggered,
      writeable,
      commonType = "",
      warnIfNoStates = true
    } = options;
    const status = { ok: true };
    let item;
    if (triggered) {
      item = {
        type: "triggered",
        role,
        dp: "",
        mode: "auto",
        regexp,
        writeable,
        commonType
      };
    } else {
      item = {
        type: "state",
        role,
        dp: "",
        mode: "auto",
        regexp,
        writeable,
        commonType
      };
    }
    const data = await this.getDataItemsFromAuto(dpInit, { item }, "", enums, status, true, warnIfNoStates);
    if (status.ok && data && data.item && data.item.dp) {
      return item;
    }
    return void 0;
  }
  async getDataItemsFromAuto(dpInit, data, appendix, enums = "", status, ignoreMultiple = false, warnIfNoStates = true) {
    if (dpInit === "" && enums === void 0) {
      return data;
    }
    const tempObjectDB = await this.getFilteredObjects(dpInit, enums);
    if (tempObjectDB.data) {
      for (const i in data) {
        const t = data[i];
        if (t === void 0) {
          continue;
        }
        if (typeof t === "object" && !("type" in t)) {
          data[i] = await this.getDataItemsFromAuto(
            dpInit,
            t,
            appendix,
            enums,
            status,
            false,
            warnIfNoStates
          );
        } else if (typeof t === "object" && "type" in t) {
          const d = t;
          let found = false;
          if (d.type !== "triggered" && d.type !== "state" || !d.mode || d.mode !== "auto") {
            continue;
          }
          if (tempObjectDB.keys.length === 0 && warnIfNoStates) {
            this.log.warn(`Dont finds states for ${dpInit} dpinit is ${typeof dpInit}`);
          }
          for (const role of Array.isArray(d.role) ? d.role : [d.role || ""]) {
            for (const commonType of Array.isArray(d.commonType) ? d.commonType : [d.commonType || ""]) {
              for (const id of tempObjectDB.keys) {
                const obj = tempObjectDB.data[id];
                if (obj && obj.common && obj.type === "state" && (d.dp === "" || id.includes(d.dp)) && (role === "" || obj.common.role === role) && (!commonType || obj.common.type === commonType) && (!d.writeable || obj.common.write === d.writeable) && (!d.regexp || id.match(d.regexp) !== null)) {
                  if (found) {
                    if (!ignoreMultiple) {
                      this.log.warn(
                        `Found more as 1 state for role ${role} in ${dpInit} with .dp: ${d.dp ? d.dp.toString() : "empty"} and .regexp: ${d.regexp ? d.regexp.toString() : "empty"}`
                      );
                    }
                    break;
                  }
                  d.dp = id;
                  d.mode = "done";
                  found = true;
                }
              }
              if (found) {
                break;
              }
            }
            if (found) {
              break;
            }
          }
          if (!found) {
            if (d.required) {
              status && (status.ok = false);
              this.log.warn(
                `No state found for role ${JSON.stringify(d.role)} in ${dpInit.toString()} with with .dp: ${d.dp ? d.dp.toString() : "empty"} and .regexp: ${d.regexp ? d.regexp.toString() : "empty"}`
              );
            }
            data[i] = void 0;
          }
        }
      }
    }
    return data;
  }
  async getObjectAsync(id) {
    if (this.objectDatabase[id] !== void 0) {
      return this.objectDatabase[id];
    } else if (this.triggerDB[id] != void 0 && this.triggerDB[id].internal) {
      return { _id: "", type: "state", common: this.triggerDB[id].common, native: {} };
    }
    const obj = await this.adapter.getForeignObjectAsync(id);
    this.objectDatabase[id] = obj != null ? obj : null;
    return obj != null ? obj : null;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StatesControler
});
//# sourceMappingURL=states-controller.js.map
