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
  BaseClassPage: () => BaseClassPage,
  BaseClassTriggerd: () => BaseClassTriggerd,
  StatesControler: () => StatesControler
});
module.exports = __toCommonJS(states_controller_exports);
var import_data_item = require("../classes/data-item");
var import_library = require("../classes/library");
var import_definition = require("../const/definition");
var import_tools = require("../const/tools");
class BaseClassTriggerd extends import_library.BaseClass {
  updateTimeout;
  waitForTimeout;
  doUpdate = true;
  minUpdateInterval;
  visibility = false;
  controller;
  panelSend;
  alwaysOn;
  alwaysOnState;
  lastMessage = "";
  panel;
  responseTime = 1e10;
  neverDeactivateTrigger = false;
  sleep = true;
  parent = void 0;
  triggerParent = false;
  dpInit = "";
  enums = "";
  device = "";
  sendToPanel = (payload, opt) => {
    if (payload == this.lastMessage)
      return;
    this.lastMessage = payload;
    this.sendToPanelClass(payload, opt);
  };
  resetLastMessage() {
    this.lastMessage = "";
  }
  sendToPanelClass = () => {
  };
  constructor(card) {
    var _a;
    super(card.adapter, card.name);
    this.minUpdateInterval = 500;
    if (!this.adapter.controller)
      throw new Error("No controller! bye bye");
    this.controller = this.adapter.controller;
    this.panelSend = card.panelSend;
    this.alwaysOn = (_a = card.alwaysOn) != null ? _a : "none";
    this.panel = card.panel;
    if (typeof this.panelSend.addMessage === "function")
      this.sendToPanelClass = card.panelSend.addMessage;
  }
  async reset() {
  }
  onStateTriggerSuperDoNotOverride = async (dp, from) => {
    if (!this.visibility && !(this.neverDeactivateTrigger || from.neverDeactivateTrigger) || this.unload)
      return false;
    if (this.sleep && !this.neverDeactivateTrigger)
      return false;
    if (this.waitForTimeout)
      return false;
    if (this.updateTimeout) {
      this.doUpdate = true;
      return false;
    } else {
      this.waitForTimeout = this.adapter.setTimeout(() => {
        this.waitForTimeout = void 0;
        this.onStateTrigger(dp, from);
        if (this.alwaysOnState)
          this.adapter.clearTimeout(this.alwaysOnState);
        if (this.alwaysOn === "action") {
          this.alwaysOnState = this.adapter.setTimeout(
            () => {
              this.panel.sendScreeensaverTimeout(this.panel.timeout);
            },
            this.panel.timeout * 1e3 || 5e3
          );
        }
      }, 20);
      this.updateTimeout = this.adapter.setTimeout(async () => {
        if (this.unload)
          return;
        this.updateTimeout = void 0;
        if (this.doUpdate) {
          this.doUpdate = false;
          await this.onStateTrigger(dp, from);
        }
      }, this.minUpdateInterval);
      return true;
    }
  };
  async onStateTrigger(_dp, _from) {
    this.adapter.log.warn(
      `<- instance of [${Object.getPrototypeOf(this)}] is triggert but dont react or call super.onStateTrigger()`
    );
  }
  async stopTriggerTimeout() {
    if (this.updateTimeout) {
      this.adapter.clearTimeout(this.updateTimeout);
      this.updateTimeout = void 0;
    }
  }
  async delete() {
    await this.setVisibility(false);
    this.parent = void 0;
    await super.delete();
    if (this.waitForTimeout)
      this.adapter.clearTimeout(this.waitForTimeout);
    if (this.alwaysOnState)
      this.adapter.clearTimeout(this.alwaysOnState);
    await this.stopTriggerTimeout();
  }
  getVisibility = () => {
    return this.visibility;
  };
  setVisibility = async (v, force = false) => {
    if (v !== this.visibility || force) {
      this.visibility = v;
      if (this.visibility) {
        if (this.unload)
          return;
        if (this.alwaysOn != "none") {
          if (this.alwaysOn === "action") {
            this.alwaysOnState = this.adapter.setTimeout(
              async () => {
                await this.panel.sendScreeensaverTimeout(this.panel.timeout);
              },
              this.panel.timeout * 2 * 1e3 || 5e3
            );
          } else {
            await this.panel.sendScreeensaverTimeout(0);
          }
        } else
          this.panel.sendScreeensaverTimeout(this.panel.timeout);
        this.log.debug(`Switch page to visible${force ? " (forced)" : ""}!`);
        this.resetLastMessage();
        this.controller && await this.controller.statesControler.activateTrigger(this);
        this.panel.info.nspanel.currentPage = this.name;
        this.library.writedp(
          `panels.${this.panel.name}.info.nspanel.currentPage`,
          this.name,
          import_definition.genericStateObjects.panel.panels.info.nspanel.currentPage
        );
      } else {
        if (this.alwaysOnState)
          this.adapter.clearTimeout(this.alwaysOnState);
        this.log.debug(`Switch page to invisible${force ? " (forced)" : ""}!`);
        if (!this.neverDeactivateTrigger) {
          this.stopTriggerTimeout();
          this.controller && await this.controller.statesControler.deactivateTrigger(this);
        }
      }
      await this.onVisibilityChange(v);
    } else
      this.visibility = v;
  };
  /**
   * Event when visibility is on Change.
   */
  async onVisibilityChange(val) {
    val;
    this.adapter.log.warn(
      `<- instance of [${Object.getPrototypeOf(
        this
      )}] not react on onVisibilityChange(), or call super.onVisibilityChange()`
    );
  }
}
class BaseClassPage extends BaseClassTriggerd {
  pageItemConfig;
  pageItems;
  constructor(card, pageItemsConfig) {
    super(card);
    this.pageItemConfig = pageItemsConfig;
  }
}
class StatesControler extends import_library.BaseClass {
  triggerDB = {};
  deletePageInterval;
  stateDB = {};
  objectDatabase = {};
  intervalObjectDatabase;
  timespan;
  constructor(adapter, name = "", timespan = 15e3) {
    super(adapter, name || "StatesDB");
    this.timespan = timespan;
    this.deletePageInterval = this.adapter.setInterval(this.deletePageLoop, 6e4);
    this.intervalObjectDatabase = this.adapter.setInterval(() => {
      if (this.unload)
        return;
      this.intervalObjectDatabase = void 0;
      this.objectDatabase = {};
    }, 18e5);
  }
  deletePageLoop = () => {
    const removeId = [];
    for (const id in this.triggerDB) {
      const entry = this.triggerDB[id];
      const removeIndex = [];
      for (const i in entry.to) {
        if (entry.to[i].unload) {
          removeIndex.push(Number(i));
        }
      }
      for (const i of removeIndex) {
        for (const key in entry) {
          const k = key;
          const item = entry[k];
          if (Array.isArray(item)) {
            item.splice(i, 1);
          }
        }
      }
      if (entry.to.length === 0 && !entry.internal)
        removeId.push(id);
    }
    for (const id of removeId) {
      delete this.triggerDB[id];
    }
  };
  async delete() {
    await super.delete();
    if (StatesControler.tempObjectDBTimeout)
      this.adapter.clearTimeout(StatesControler.tempObjectDBTimeout);
    if (this.intervalObjectDatabase)
      this.adapter.clearInterval(this.intervalObjectDatabase);
    if (StatesControler.tempObjectDBTimeout)
      this.adapter.clearTimeout(StatesControler.tempObjectDBTimeout);
    if (this.deletePageInterval)
      this.adapter.clearInterval(this.deletePageInterval);
  }
  /**
   * Set a subscript to an foreignState and write current state/value to db
   * @param id state id
   * @param from the page that handle the trigger
   */
  async setTrigger(id, from, internal = false, trigger = true, change) {
    if (id.startsWith(this.adapter.namespace)) {
      this.log.warn(`Id: ${id} refers to the adapter's own namespace, this is not allowed!`);
      return;
    }
    if (this.triggerDB[id] !== void 0) {
      const index = this.triggerDB[id].to.findIndex((a) => a == from);
      if (index === -1) {
        this.triggerDB[id].to.push(from);
        this.triggerDB[id].subscribed.push(false);
        this.triggerDB[id].triggerAllowed.push(trigger);
        this.triggerDB[id].change.push(change ? change : "ne");
      } else {
      }
    } else if (internal) {
      this.log.error("setInternal Trigger too early");
    } else {
      const state = await this.adapter.getForeignStateAsync(id);
      if (state) {
        await this.adapter.subscribeForeignStatesAsync(id);
        const obj = await this.getObjectAsync(id);
        if (!obj || !obj.common || obj.type !== "state")
          throw new Error("Got invalid object for " + id);
        this.triggerDB[id] = {
          state,
          to: [from],
          ts: Date.now(),
          subscribed: [false],
          common: obj.common,
          triggerAllowed: [trigger],
          change: [change ? change : "ne"]
        };
        if (this.stateDB[id] !== void 0) {
          delete this.stateDB[id];
        }
      }
      this.log.debug(`Set a new trigger to ${id}`);
    }
  }
  /**
   * Activate the triggers of a page. First subscribes to the state.
   * @param to Page
   */
  async activateTrigger(to) {
    if (!to)
      return;
    for (const id in this.triggerDB) {
      const entry = this.triggerDB[id];
      const index = entry.to.indexOf(to);
      if (index === -1)
        continue;
      if (entry.subscribed[index])
        continue;
      if (!entry.triggerAllowed[index])
        continue;
      if (!entry.subscribed.some((a) => a)) {
        await this.adapter.subscribeForeignStatesAsync(id);
        const state = await this.adapter.getForeignStateAsync(id);
        if (state) {
          entry.state = state;
        }
      }
      entry.subscribed[index] = true;
    }
  }
  /**
   * Deactivate the triggers of a page. Last unsubscribes to the state.
   * @param to Page
   */
  async deactivateTrigger(to) {
    for (const id in this.triggerDB) {
      if (to.neverDeactivateTrigger)
        continue;
      const entry = this.triggerDB[id];
      if (entry.internal)
        continue;
      const index = entry.to.indexOf(to);
      if (index === -1)
        continue;
      if (!entry.subscribed[index])
        continue;
      entry.subscribed[index] = false;
      if (!entry.subscribed.some((a) => a)) {
        await this.adapter.unsubscribeForeignStatesAsync(id);
      }
    }
  }
  async getStateVal(id) {
    var _a;
    const state = await this.getState(id, "now");
    if (state) {
      return (_a = state.val) != null ? _a : null;
    }
    return null;
  }
  /**
   * Read a state from DB or js-controller
   * @param id state id with namespace
   * @returns
   */
  async getState(id, response = "medium", internal = false) {
    let timespan = this.timespan;
    if (response === "now")
      timespan = 10;
    else
      timespan = 1e3;
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
    } else if (this.stateDB[id] && timespan) {
      if (Date.now() - timespan - this.stateDB[id].ts < 0) {
        return this.stateDB[id].state;
      }
    }
    if (id.includes("/"))
      internal = true;
    if (!internal) {
      const state = await this.adapter.getForeignStateAsync(id);
      if (state) {
        if (!this.stateDB[id]) {
          const obj = await this.getObjectAsync(id);
          if (!obj || !obj.common || obj.type !== "state")
            throw new Error("Got invalid object for " + id);
          this.stateDB[id] = { state, ts: Date.now(), common: obj.common };
        } else {
          this.stateDB[id].state = state;
          this.stateDB[id].ts = Date.now();
        }
        return state;
      }
    }
    throw new Error(`State id invalid ${id} no data!`);
  }
  getType(id) {
    if (this.triggerDB[id] !== void 0 && this.triggerDB[id].common)
      return this.triggerDB[id].common.type;
    if (this.stateDB[id] !== void 0)
      return this.stateDB[id].common.type;
    return void 0;
  }
  async getCommonStates(id, force = false) {
    let j = void 0;
    if (force) {
      const obj = await this.adapter.getObjectAsync(id);
      if (obj && obj.common && obj.common.states)
        j = obj.common.state;
    } else if (this.triggerDB[id] !== void 0 && this.triggerDB[id].common)
      j = this.triggerDB[id].common.states;
    else if (this.stateDB[id] !== void 0 && this.stateDB[id].common)
      j = this.stateDB[id].common.states;
    if (!j || typeof j === "string")
      return void 0;
    if (Array.isArray(j)) {
      const a = {};
      j.forEach((e, i) => a[String(i)] = e);
      j = a;
    }
    return j;
  }
  /**
   * Check if the trigger should trigger other classes. dont check if object has a active subscription. this is done in next step with visible & neverDeactiveTrigger
   * @param dp internal/external
   * @param state iobroker state
   */
  async onStateChange(dp, state) {
    if (dp && state) {
      if (this.triggerDB[dp] && this.triggerDB[dp].state) {
        this.log.debug(`Trigger from ${dp} with state ${JSON.stringify(state)}`);
        this.triggerDB[dp].ts = Date.now();
        const oldState = { val: this.triggerDB[dp].state.val, ack: this.triggerDB[dp].state.ack };
        this.triggerDB[dp].state = state;
        if (state.ack || this.triggerDB[dp].internal || dp.startsWith("0_userdata.0")) {
          await this.triggerDB[dp].to.forEach(async (c, i) => {
            if (oldState.val !== state.val || oldState.ack !== state.ack || this.triggerDB[dp].change[i] === "ts") {
              if (!c.neverDeactivateTrigger && !this.triggerDB[dp].subscribed[i] || !this.triggerDB[dp].triggerAllowed[i])
                return;
              if (c.parent && c.triggerParent && !c.parent.unload && !c.parent.sleep) {
                c.parent.onStateTriggerSuperDoNotOverride && await c.parent.onStateTriggerSuperDoNotOverride(dp, c);
              } else if (!c.unload) {
                c.onStateTriggerSuperDoNotOverride && await c.onStateTriggerSuperDoNotOverride(dp, c);
              }
            }
          });
        }
      }
      if (state.val === null || state.val === void 0 || typeof state.val !== "object") {
        if (dp.startsWith(this.adapter.namespace)) {
          const id = dp.replace(this.adapter.namespace + ".", "");
          const libState = this.library.readdb(id);
          if (libState) {
            this.library.setdb(id, {
              ...libState,
              val: state.val,
              ts: state.ts,
              ack: state.ack
            });
          }
          if (libState && libState.obj && libState.obj.common && libState.obj.common.write && this.adapter.controller) {
            for (const panel of this.adapter.controller.panels) {
              await panel.onStateChange(id, state);
            }
          }
        }
        if (dp.startsWith("system.host"))
          this.adapter.controller && await this.adapter.controller.systemNotification.onStateChange(dp, state);
      }
    }
  }
  async setStateAsync(item, val, writeable) {
    if (item.options.type === "state" || item.options.type === "triggered") {
      if (item.options.dp) {
        const ack = item.options.dp.startsWith(this.adapter.namespace);
        this.log.debug(`setStateAsync(${item.options.dp}, ${val}, ${ack})`);
        if (item.trueType() === "number" && typeof val === "string")
          val = parseFloat(val);
        else if (item.trueType() === "number" && typeof val === "boolean")
          val = val ? 1 : 0;
        else if (item.trueType() === "boolean")
          val = !!val;
        if (item.trueType() === "string")
          val = String(val);
        if (writeable)
          await this.adapter.setForeignStateAsync(item.options.dp, val, ack);
        else
          this.log.error(`Forbidden write attempts on a read-only state! id: ${item.options.dp}`);
      }
    } else if (item.options.type === "internal" || item.options.type === "internalState") {
      if (this.triggerDB[item.options.dp]) {
        await this.setInternalState(item.options.dp, val, false);
      }
    }
  }
  /**
   * Set a internal state and trigger
   * @param id something like 'cmd/blabla'
   * @param val Value
   * @param ack false use value/ true use func
   * @param common optional for first call
   * @param func optional for first call
   * @returns
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
      this.log.debug(`Add internal state ${id} with ${JSON.stringify(common)}`);
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
   * @param data Json with configuration to create dataitems
   * @param parent Page etc.
   * @returns then json with values dataitem or undefined
   */
  async createDataItems(data, parent, target = {}) {
    var _a;
    for (const i in data) {
      const d = data[i];
      if (d === void 0)
        continue;
      if (typeof d === "object" && !("type" in d)) {
        target[i] = await this.createDataItems(d, parent, ((_a = target[i]) != null ? _a : Array.isArray(d)) ? [] : {});
      } else if (typeof d === "object" && "type" in d) {
        target[i] = data[i] !== void 0 ? new import_data_item.Dataitem(this.adapter, { ...d, name: `${this.name}.${parent.name}.${i}` }, parent, this) : void 0;
        if (target[i] !== void 0 && !await target[i].isValidAndInit()) {
          target[i] = void 0;
        }
      }
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
    if (StatesControler.tempObjectDBTimeout)
      adapter.clearTimeout(StatesControler.tempObjectDBTimeout);
    StatesControler.tempObjectDBTimeout = adapter.setTimeout(() => {
      if (adapter.unload)
        return;
      StatesControler.tempObjectDBTimeout = void 0;
      StatesControler.TempObjectDB = { data: void 0, keys: [], enums: void 0 };
    }, 6e4);
    return StatesControler.TempObjectDB;
  }
  /**
   * Filterfunktion umso genauere Filter um so weniger Ressourcen werden verbraucht.
   * @param dpInit string RegExp oder '' für aus; string wird mit include verwendet.
   * @param enums string, string[], RegExp als String übergeben oder ein String der mit include verwenden wird.
   * @returns 2 arrays keys: gefilterten keys und data: alle Objekte...
   */
  async getFilteredObjects(dpInit, enums) {
    const tempObjectDB = StatesControler.getTempObjectDB(this.adapter);
    if (!tempObjectDB.data) {
      tempObjectDB.data = await this.adapter.getForeignObjectsAsync(`*`);
      if (!tempObjectDB.data)
        throw new Error("getObjects fail. Critical Error!");
      tempObjectDB.keys = Object.keys(tempObjectDB.data);
      const temp = await this.adapter.getEnumsAsync(["rooms", "functions"]);
      tempObjectDB.enums = Object.assign(temp["enum.rooms"], temp["enum.functions"]);
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
            if (tempObjectDB.enums[a] && tempObjectDB.enums[a].common && tempObjectDB.enums[a].common.members)
              t = t.concat(tempObjectDB.enums[a].common.members);
          }
        }
        if (!r)
          r = t;
        else
          r = r.filter((a) => t.indexOf(a) !== -1);
      }
      result.keys = result.keys.filter((a) => r && r.some((b) => a.startsWith(b)));
    }
    return result;
  }
  async getDataItemsFromAuto(dpInit, data, appendix, enums) {
    if (dpInit === "" && enums === void 0)
      return data;
    const tempObjectDB = await this.getFilteredObjects(dpInit, enums);
    if (tempObjectDB.data) {
      for (const i in data) {
        const t = data[i];
        if (t === void 0)
          continue;
        if (typeof t === "object" && !("type" in t)) {
          data[i] = await this.getDataItemsFromAuto(dpInit, t, appendix, enums);
        } else if (typeof t === "object" && "type" in t) {
          const d = t;
          let found = false;
          if (d.type !== "triggered" && d.type !== "state" || !d.mode || d.mode !== "auto")
            continue;
          for (const role of Array.isArray(d.role) ? d.role : [d.role]) {
            if (false) {
            }
            if (tempObjectDB.keys.length === 0) {
              this.log.warn(`Dont find states for ${dpInit}!`);
            }
            for (const id of tempObjectDB.keys) {
              const obj = tempObjectDB.data[id];
              if (obj && obj.common && obj.type === "state" && (d.dp === "" || id.includes(d.dp)) && (role === "" || obj.common.role === role) && (!d.regexp || id.match(d.regexp) !== null)) {
                if (found) {
                  this.log.warn(`Found more as 1 state for role ${role} in ${dpInit} with ${d.dp}`);
                  break;
                }
                d.dp = id;
                d.mode = "done";
                found = true;
              }
            }
            if (found)
              break;
          }
          if (!found) {
            data[i] = void 0;
            this.log.warn(`No state found for role ${JSON.stringify(d.role)} in ${dpInit} with ${d.dp}`);
          }
        }
      }
    }
    return data;
  }
  async getObjectAsync(id) {
    if (this.objectDatabase[id] !== void 0)
      return this.objectDatabase[id];
    else if (this.triggerDB[id] !== void 0 && this.triggerDB[id].internal) {
      return { _id: "", type: "state", common: this.triggerDB[id].common, native: {} };
    }
    const obj = await this.adapter.getForeignObjectAsync(id);
    this.objectDatabase[id] = obj != null ? obj : null;
    return obj != null ? obj : null;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseClassPage,
  BaseClassTriggerd,
  StatesControler
});
//# sourceMappingURL=states-controller.js.map
