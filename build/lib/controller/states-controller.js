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
  sleep = true;
  parent = void 0;
  triggerParent = false;
  dpInit = "";
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
    this.minUpdateInterval = 1e3;
    if (!this.adapter.controller)
      throw new Error("No controller! bye bye");
    this.controller = this.adapter.controller;
    this.panelSend = card.panelSend;
    this.alwaysOn = (_a = card.alwaysOn) != null ? _a : "none";
    this.panel = card.panel;
    if (typeof this.panelSend.addMessage === "function")
      this.sendToPanelClass = card.panelSend.addMessage;
  }
  onStateTriggerSuperDoNotOverride = async (response) => {
    if (!this.visibility || this.unload)
      return false;
    if (this.sleep)
      return false;
    if (this.waitForTimeout)
      return false;
    if (this.updateTimeout && response !== "now") {
      this.doUpdate = true;
      return false;
    } else {
      this.waitForTimeout = this.adapter.setTimeout(() => {
        this.waitForTimeout = void 0;
        this.onStateTrigger();
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
      }, 10);
      this.updateTimeout = this.adapter.setTimeout(async () => {
        if (this.unload)
          return;
        this.updateTimeout = void 0;
        if (this.doUpdate) {
          this.doUpdate = false;
          await this.onStateTrigger();
        }
      }, this.minUpdateInterval);
      return true;
    }
  };
  async onStateTrigger() {
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
      } else {
        if (this.alwaysOnState)
          this.adapter.clearTimeout(this.alwaysOnState);
        await this.panel.sendScreeensaverTimeout(this.panel.timeout);
        this.log.debug(`Switch page to invisible${force ? " (forced)" : ""}!`);
        this.stopTriggerTimeout();
        this.controller && await this.controller.statesControler.deactivateTrigger(this);
      }
      await this.onVisibilityChange(v);
    } else
      this.visibility = v;
  };
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
    super(adapter, name || "StatesDBReadOnly");
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
        if (entry.to[i].unload)
          removeIndex.push(Number(i));
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
      if (entry.to.length === 0)
        removeId.push(id);
    }
    for (const id of removeId) {
      delete this.triggerDB[id];
    }
  };
  async delete() {
    await super.delete();
    if (this.intervalObjectDatabase)
      this.adapter.clearInterval(this.intervalObjectDatabase);
    if (StatesControler.tempObjectDBTimeout)
      this.adapter.clearTimeout(StatesControler.tempObjectDBTimeout);
    if (this.deletePageInterval)
      this.adapter.clearInterval(this.deletePageInterval);
  }
  async setTrigger(id, from, response = "slow") {
    if (id.startsWith(this.adapter.namespace)) {
      this.log.warn(`Id: ${id} refers to the adapter's own namespace, this is not allowed!`);
      return;
    }
    if (this.triggerDB[id] !== void 0) {
      const index = this.triggerDB[id].to.findIndex((a) => a == from);
      if (index === -1) {
        this.triggerDB[id].to.push(from);
        this.triggerDB[id].subscribed.push(false);
        this.triggerDB[id].response.push(response);
      } else {
        if (this.triggerDB[id].response[index] !== response) {
          if (response === "now")
            this.triggerDB[id].response[index] = "now";
        }
      }
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
          response: [response],
          common: obj.common
        };
        if (this.stateDB[id] !== void 0) {
          delete this.stateDB[id];
        }
      }
      this.log.debug(`Set a new trigger to ${id}`);
    }
  }
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
  async deactivateTrigger(to) {
    for (const id in this.triggerDB) {
      const entry = this.triggerDB[id];
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
  async getState(id, response = "slow") {
    let timespan = this.timespan;
    if (response === "medium")
      timespan = 500;
    else if (response === "now")
      timespan = 10;
    if (this.triggerDB[id] !== void 0 && this.triggerDB[id].subscribed.some((a) => a)) {
      return this.triggerDB[id].state;
    } else if (this.stateDB[id] && timespan) {
      if (Date.now() - timespan - this.stateDB[id].ts < 0) {
        return this.stateDB[id].state;
      }
    }
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
    throw new Error(`State id invalid ${id} no data!`);
  }
  getType(id) {
    if (this.triggerDB[id] !== void 0)
      return this.triggerDB[id].common.type;
    if (this.stateDB[id] !== void 0)
      return this.stateDB[id].common.type;
    return void 0;
  }
  getCommonStates(id) {
    let j = void 0;
    if (this.triggerDB[id] !== void 0)
      j = this.triggerDB[id].common.states;
    else if (this.stateDB[id] !== void 0)
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
  async onStateChange(dp, state) {
    if (dp && state) {
      if (this.triggerDB[dp]) {
        if (this.triggerDB[dp].state) {
          this.log.debug(`Trigger from ${dp} with state ${JSON.stringify(state)}`);
          this.triggerDB[dp].ts = Date.now();
          if (this.triggerDB[dp].state.val !== state.val || this.triggerDB[dp].state.ack !== state.ack) {
            this.triggerDB[dp].state = state;
            if (state.ack || dp.startsWith("0_userdata.0")) {
              this.triggerDB[dp].to.forEach((c, index) => {
                if (c.parent && c.triggerParent && !c.parent.unload && !c.parent.sleep) {
                  c.parent.onStateTriggerSuperDoNotOverride && c.parent.onStateTriggerSuperDoNotOverride(this.triggerDB[dp].response[index]);
                } else if (!c.unload) {
                  c.onStateTriggerSuperDoNotOverride && c.onStateTriggerSuperDoNotOverride(this.triggerDB[dp].response[index]);
                }
              });
            }
          }
        }
      }
      if (dp.startsWith(this.adapter.namespace)) {
        const id = dp.replace(this.adapter.namespace + ".", "");
        const libState = this.library.readdb(id);
        if (libState) {
          this.library.setdb(id, { ...libState, val: state.val, ts: state.ts, ack: state.ack });
        }
        if (libState && libState.obj && libState.obj.common && libState.obj.common.write && this.adapter.controller) {
          for (const panel of this.adapter.controller.panels) {
            await panel.onStateChange(id, state);
          }
        }
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
    } else if (item.options.type === "internal") {
      if (this.triggerDB[item.options.dp]) {
        if (this.setInternalState(item.options.dp, val))
          await this.onStateChange(item.options.dp, this.triggerDB[item.options.dp].state);
      }
    }
  }
  setInternalState(id, val) {
    if (this.triggerDB[id] !== void 0) {
      this.triggerDB[id].state = {
        ...this.triggerDB[id].state,
        val,
        ack: true,
        ts: Date.now()
      };
      return true;
    }
    return false;
  }
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
  static TempObjectDB = {
    data: {},
    ids: {}
  };
  static tempObjectDBTimeout;
  static getTempObjectDB(adapter) {
    if (StatesControler.tempObjectDBTimeout)
      adapter.clearTimeout(StatesControler.tempObjectDBTimeout);
    StatesControler.tempObjectDBTimeout = adapter.setTimeout(() => {
      if (adapter.unload)
        return;
      StatesControler.tempObjectDBTimeout = void 0;
      StatesControler.TempObjectDB = { data: {}, ids: {} };
    }, 6e4);
    return StatesControler.TempObjectDB;
  }
  async getDataItemsFromAuto(dpInit, data) {
    if (dpInit === "")
      return data;
    const tempObjectDB = StatesControler.getTempObjectDB(this.adapter);
    for (const i in data) {
      const t = data[i];
      if (t === void 0)
        continue;
      if (typeof t === "object" && !("type" in t)) {
        data[i] = await this.getDataItemsFromAuto(dpInit, t);
      } else if (typeof t === "object" && "type" in t) {
        const d = t;
        let found = false;
        if (d.type !== "triggered" && d.type !== "state" || !d.mode || d.mode !== "auto")
          continue;
        for (const role of Array.isArray(d.role) ? d.role : [d.role]) {
          if (false) {
          }
          if (!tempObjectDB.ids[dpInit]) {
            const temp = await this.adapter.getForeignObjectsAsync(`${dpInit}.*`);
            if (temp) {
              tempObjectDB.ids[dpInit] = true;
              tempObjectDB.data = Object.assign(tempObjectDB.data, temp);
            }
          }
          if (!tempObjectDB.ids[dpInit]) {
            this.log.warn(`Dont find states for ${dpInit}!`);
          }
          for (const id in tempObjectDB.data) {
            if (!id.startsWith(dpInit))
              continue;
            const obj = tempObjectDB.data[id];
            if (obj && obj.common && obj.type === "state" && (d.dp === "" || id.includes(d.dp)) && obj.common.role === role) {
              if (found) {
                this.log.warn(`Found more as 1 state for role ${role} in ${dpInit}`);
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
          this.log.warn(`No state found for role ${JSON.stringify(d.role)} in ${dpInit}`);
        }
      }
    }
    return data;
  }
  async existsState(id) {
    if (id.startsWith(this.adapter.namespace)) {
      return this.adapter.library.readdb(id.replace(this.adapter.namespace, "")) !== void 0;
    } else {
      return await this.adapter.getForeignStateAsync(id) !== void 0;
    }
  }
  async getObjectAsync(id) {
    if (this.objectDatabase[id] !== void 0)
      return this.objectDatabase[id];
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
