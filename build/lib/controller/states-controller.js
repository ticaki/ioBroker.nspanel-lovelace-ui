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
  timespan;
  constructor(adapter, name = "", timespan = 15e3) {
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
    }, 18e4);
  }
  deletePageLoop = async (f) => {
    var _a, _b, _c, _d, _e;
    const removeIds = [];
    for (const id of Object.keys(this.triggerDB)) {
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
      if (removeIdx.length) {
        removeIdx.sort((a, b) => b - a);
        for (const idx of removeIdx) {
          for (let idx2 = Object.keys(entry).length - 1; idx2 >= 0; idx2--) {
            const key = Object.keys(entry)[idx2];
            const val = entry[key];
            if (Array.isArray(val) && idx >= 0 && idx < val.length) {
              val.splice(idx, 1);
            }
          }
        }
      }
      if (entry.to.length === 0 && !entry.internal) {
        removeIds.push(id);
      }
    }
    this.blockedSubscriptions = [];
    for (const id of removeIds) {
      delete this.triggerDB[id];
    }
    while (this.blockedSubscriptions && this.blockedSubscriptions.length > 0) {
      for (let idx = this.blockedSubscriptions.length - 1; idx >= 0; idx--) {
        if (idx >= this.blockedSubscriptions.length) {
          continue;
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
    if (id.startsWith(this.adapter.namespace)) {
      this.log.warn(`Id: ${id} refers to the adapter's own namespace, this is not allowed!`);
      return;
    }
    const existing = this.triggerDB[id];
    if (existing) {
      const idx = existing.to.findIndex((a) => a === from);
      if (idx === -1) {
        existing.to.push(from);
        existing.subscribed.push(false);
        existing.triggerAllowed.push(trigger);
        existing.change.push(change != null ? change : "ne");
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
      internal: false
    };
    try {
      const obj = await this.getObjectAsync(id);
      if (!obj || obj.type !== "state" || !obj.common) {
        delete this.triggerDB[id];
        throw new Error(`Got invalid object for ${id}`);
      }
      this.triggerDB[id].common = obj.common;
      if (this.unload || this.adapter.unload) {
        return;
      }
      if (this.blockedSubscriptions) {
        if (!this.blockedSubscriptions.includes(id)) {
          this.blockedSubscriptions.push(id);
        }
      } else {
      }
      if (this.adapter.config.debugLogStates) {
        this.log.debug(`Set a new trigger for ${from.basePanel.name}.${from.name} to ${id}`);
      }
      const state = await this.adapter.getForeignStateAsync(id);
      if (state) {
        this.triggerDB[id].state = state;
      }
      if (this.stateDB[id] !== void 0) {
        delete this.stateDB[id];
      }
    } catch (err) {
      delete this.triggerDB[id];
      throw err;
    }
  }
  /**
   * Activate the triggers of a pageItem for self or parent. First subscribes to the state.
   *
   * @param to Page
   */
  async activateTrigger(to) {
    if (!to) {
      return;
    }
    for (const id in this.triggerDB) {
      const entry = this.triggerDB[id];
      const index = entry.to.findIndex((a) => a === to || a.parent && a.parent === to);
      if (index === -1) {
        continue;
      }
      if (entry.subscribed[index]) {
        continue;
      }
      if (!entry.triggerAllowed[index]) {
        continue;
      }
      if (!entry.subscribed.some((a) => a)) {
        entry.subscribed[index] = true;
        const state = await this.adapter.getForeignStateAsync(id);
        if (state) {
          entry.state = state;
        }
      }
      entry.subscribed[index] = true;
    }
  }
  /**
   * Deactivate the triggers of a pageItem for self or parent page. Last unsubscribes to the state.
   *
   * @param to Page
   */
  async deactivateTrigger(to) {
    for (const id in this.triggerDB) {
      if (to.neverDeactivateTrigger) {
        continue;
      }
      const entry = this.triggerDB[id];
      if (entry.internal) {
        continue;
      }
      const index = entry.to.indexOf(to);
      if (index === -1) {
        continue;
      }
      const indexParent = entry.to.findIndex((a) => a.parent && a.parent === to);
      if (indexParent !== -1 && entry.subscribed[indexParent]) {
        continue;
      }
      if (!entry.subscribed[index]) {
        continue;
      }
      entry.subscribed[index] = false;
      if (this.adapter.config.debugLogStates) {
        this.log.debug(`Deactivate trigger from ${to.name} to ${id}`);
      }
      if (!entry.subscribed.some((a) => a)) {
        if (this.blockedSubscriptions) {
          const idx = this.blockedSubscriptions.indexOf(id);
          if (idx !== -1) {
            this.blockedSubscriptions.splice(idx, 1);
          }
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
   *
   * @param id state id with namespace
   * @param internal if the state is internal
   * @returns nsPanelState or null
   */
  async getState(id, internal = false) {
    if (this.triggerDB[id] !== void 0 && (this.triggerDB[id].internal || this.triggerDB[id].subscribed.some((a) => a))) {
      let state = null;
      const f = this.triggerDB[id].f;
      if (f) {
        state = {
          ...this.triggerDB[id].state,
          val: await f(id, void 0)
        };
      } else {
        state = this.triggerDB[id].state;
      }
      return state;
    } else if (this.stateDB[id]) {
      return this.stateDB[id].state;
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
  async getCommonStates(id, force = false) {
    if (!id) {
      return null;
    }
    let j = void 0;
    if (force) {
      const obj = await this.adapter.getForeignObjectAsync(id);
      if (obj && obj.common && obj.common.states) {
        j = obj.common.states;
      }
    } else if (this.triggerDB[id] !== void 0 && this.triggerDB[id].common) {
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
  isStateValue(v) {
    return v === null || v === void 0 || typeof v === "string" || typeof v === "number" || typeof v === "boolean";
  }
  /**
   * Handle incoming state changes from ioBroker.
   *
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
    var _a, _b;
    if (!dp || !state) {
      return;
    }
    const entry = this.triggerDB[dp];
    if (entry == null ? void 0 : entry.state) {
      if (this.adapter.config.debugLogStates) {
        this.log.debug(`Trigger from ${dp} with state ${JSON.stringify(state)}`);
      }
      entry.ts = Date.now();
      const oldState = {
        val: entry.state.val,
        ack: entry.state.ack,
        from: entry.state.from,
        ts: entry.state.ts,
        lc: entry.state.lc
      };
      entry.state = state;
      const isSystemOrAlias = dp.startsWith("0_userdata.0") || dp.startsWith("alias.0");
      const mayTrigger = state.ack || entry.internal || isSystemOrAlias;
      if (mayTrigger) {
        const to = entry.to;
        const changes = entry.change || [];
        const subscribed = entry.subscribed || [];
        const allowed = entry.triggerAllowed || [];
        const hasValChange = oldState.val !== state.val;
        for (let i = 0; i < to.length; i++) {
          const target = to[i];
          const hasChange = hasValChange || oldState.ack !== state.ack || changes[i] === "ts";
          if (!hasChange) {
            this.log.debug(`Ignore trigger from state ${dp} no change!`);
            continue;
          } else if (!target.unload) {
            await target.onStateChange(dp, { old: oldState, new: state });
          }
          const notSubscribedOrNotAllowed = !target.neverDeactivateTrigger && !subscribed[i] || !allowed[i];
          if (notSubscribedOrNotAllowed) {
            if (i === to.length - 1) {
              this.log.debug(`Ignore trigger from state ${dp} not subscribed or not allowed!`);
              this.log.debug(
                `c: ${target.name} !c.neverDeactivateTrigger: ${!target.neverDeactivateTrigger} && !this.triggerDB[dp].subscribed[i]: ${!subscribed[i]} || !this.triggerDB[dp].triggerAllowed[i]: ${!allowed[i]}`
              );
            }
            continue;
          }
          if (target.parent && target.triggerParent && !target.parent.unload && !target.parent.sleep) {
            if (target.parent.onStateTriggerSuperDoNotOverride) {
              await target.parent.onStateTriggerSuperDoNotOverride(dp, target);
            }
          } else if (!target.unload) {
            if (target.onStateTriggerSuperDoNotOverride) {
              await target.onStateTriggerSuperDoNotOverride(dp, target);
            }
          }
        }
      } else {
        this.log.debug(`Ignore trigger from state ${dp} ack is false!`);
      }
    } else if (this.stateDB[dp]) {
      this.stateDB[dp].state = state;
      this.stateDB[dp].ts = state.ts;
    }
    const v = state.val;
    const isPrimitive = v === null || v === void 0 || typeof v !== "object";
    if (!isPrimitive) {
      return;
    }
    if (dp.startsWith(this.adapter.namespace)) {
      const id = dp.replace(`${this.adapter.namespace}.`, "");
      const libState = this.library.readdb(id);
      if (libState) {
        this.library.setdb(id, {
          ...libState,
          val: this.isStateValue(state.val) ? state.val : null,
          ts: state.ts,
          ack: state.ack
        });
      }
      if (((_b = (_a = libState == null ? void 0 : libState.obj) == null ? void 0 : _a.common) == null ? void 0 : _b.write) && this.adapter.controller) {
        for (const panel of this.adapter.controller.panels) {
          await panel.onStateChange(id, state);
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
            item.common.write = false;
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
      f && await f(id, this.triggerDB[id].state);
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
    var _a;
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
        target[i] = data[i] !== void 0 ? new import_data_item.Dataitem(
          this.adapter,
          { ...d, name: `${this.name}.${parent.name}.${i}.${path}`, constants: options },
          parent,
          this
        ) : void 0;
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
   * @returns A promise that resolves to a `DataItemsOptions` object if a matching state is found,
   * otherwise `undefined`.
   */
  async getIdbyAuto(options) {
    const { dpInit, role = "", enums = "", regexp, triggered, writeable, commonType = "" } = options;
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
    const data = await this.getDataItemsFromAuto(dpInit, { item }, "", enums, status, true);
    if (status.ok && data && data.item && data.item.dp) {
      return item;
    }
    return void 0;
  }
  async getDataItemsFromAuto(dpInit, data, appendix, enums = "", status, ignoreMultiple = false) {
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
          data[i] = await this.getDataItemsFromAuto(dpInit, t, appendix, enums, status);
        } else if (typeof t === "object" && "type" in t) {
          const d = t;
          let found = false;
          if (d.type !== "triggered" && d.type !== "state" || !d.mode || d.mode !== "auto") {
            continue;
          }
          if (tempObjectDB.keys.length === 0) {
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
