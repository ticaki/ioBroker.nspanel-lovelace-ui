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
  BaseClassTriggerd: () => BaseClassTriggerd,
  StatesControler: () => StatesControler
});
module.exports = __toCommonJS(states_controller_exports);
var import_data_item = require("../classes/data-item");
var import_library = require("../classes/library");
var import_pages = require("../types/pages");
class BaseClassTriggerd extends import_library.BaseClass {
  updateTimeout;
  waitForTimeout;
  doUpdate = true;
  minUpdateInterval;
  visibility = false;
  controller;
  panelSend;
  lastMessage = "";
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
    super(card.adapter, card.name);
    this.minUpdateInterval = 15e3;
    this.controller = this.adapter.controller;
    this.panelSend = card.panelSend;
    if (typeof card.panelSend.addMessage === "function")
      this.sendToPanelClass = card.panelSend.addMessage;
  }
  onStateTriggerSuperDoNotOverride = async () => {
    if (!this.visibility)
      return false;
    if (this.waitForTimeout)
      return false;
    if (this.updateTimeout) {
      this.doUpdate = true;
      return false;
    } else {
      this.waitForTimeout = this.adapter.setTimeout(() => {
        this.waitForTimeout = void 0;
        this.onStateTrigger();
      }, 50);
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
  getPayloadArray(s) {
    return s.join("~");
  }
  getPayload(...s) {
    return s.join("~");
  }
  async stopTriggerTimeout() {
    if (this.updateTimeout)
      this.adapter.clearTimeout(this.updateTimeout);
  }
  async delete() {
    await super.delete();
    await this.stopTriggerTimeout();
  }
  getVisibility = () => {
    return this.visibility;
  };
  setVisibility = async (v, force = false) => {
    if (v !== this.visibility || force) {
      this.visibility = v;
      if (this.visibility) {
        this.log.debug(`Switch page to visible${force ? " (forced)" : ""}!`);
        this.resetLastMessage();
        this.controller && this.controller.readOnlyDB.activateTrigger(this);
      } else {
        this.log.debug(`Switch page to invisible${force ? " (forced)" : ""}!`);
        this.stopTriggerTimeout();
        this.controller && this.controller.readOnlyDB.deactivateTrigger(this);
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
class StatesControler extends import_library.BaseClass {
  triggerDB = {};
  stateDB = {};
  tempObjectDB = void 0;
  timespan;
  constructor(adapter, name = "", timespan = 15e3) {
    super(adapter, name || "StatesDBReadOnly");
    this.timespan = timespan;
  }
  async setTrigger(id, from, response = "slow") {
    if (id.startsWith(this.adapter.namespace)) {
      this.log.warn(`Id: ${id} refers to the adapter's own namespace, this is not allowed!`);
      return;
    }
    if (this.triggerDB[id] !== void 0) {
      if (this.triggerDB[id].to.indexOf(from) == -1) {
        this.triggerDB[id].to.push(from);
        this.triggerDB[id].subscribed.push(false);
        this.triggerDB[id].response.push(response);
      }
    } else {
      const state = await this.adapter.getForeignStateAsync(id);
      if (state) {
        await this.adapter.subscribeForeignStatesAsync(id);
        this.triggerDB[id] = {
          state,
          to: [from],
          ts: Date.now(),
          subscribed: [false],
          response: [response]
        };
      }
      this.log.debug(`Set a new trigger to ${id}`);
    }
  }
  async activateTrigger(to) {
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
      timespan = 3e3;
    else if (response === "now")
      timespan = 0;
    if (this.triggerDB[id] !== void 0 && this.triggerDB[id].subscribed.some((a) => a)) {
      return this.triggerDB[id].state;
    } else if (this.stateDB[id] && timespan) {
      if (Date.now() - timespan - this.stateDB[id].ts < 0) {
        return this.stateDB[id].state;
      }
    }
    const state = await this.adapter.getForeignStateAsync(id);
    if (state) {
      this.stateDB[id] = { state, ts: Date.now() };
      return state;
    }
    throw new Error(`State id invalid ${id} no data!`);
  }
  async onStateChange(dp, state) {
    if (dp && state) {
      if (this.triggerDB[dp]) {
        if (this.triggerDB[dp].state) {
          this.log.debug(`Trigger from ${dp} with state ${JSON.stringify(state)}`);
          this.triggerDB[dp].ts = Date.now();
          if (this.triggerDB[dp].state.val !== state.val || this.triggerDB[dp].state.ack !== state.ack) {
            this.triggerDB[dp].state = state;
            if (state.ack) {
              this.triggerDB[dp].to.forEach(
                (c) => c.onStateTriggerSuperDoNotOverride && c.onStateTriggerSuperDoNotOverride()
              );
            }
          }
        }
      }
    }
  }
  async setStateAsync(item, val) {
    if (item.options.type === "state" || item.options.type === "triggered") {
      if (item.options.dp) {
        const ack = item.options.dp.startsWith(this.adapter.namespace);
        this.log.debug(`setStateAsync(${item.options.dp}, ${val}, ${ack})`);
        if (item.type === "number" && typeof val === "string")
          val = parseFloat(val);
        if (item.type === "boolean")
          val = !!val;
        if (item.type === "string")
          val = String(val);
        this.updateDBState(item.options.dp, val, ack);
        await this.adapter.setForeignStateAsync(item.options.dp, val, ack);
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
  updateDBState(id, val, ack) {
    if (this.triggerDB[id] !== void 0) {
      this.triggerDB[id].state.val = val;
      this.triggerDB[id].state.ack = ack;
    } else if (this.stateDB[id] !== void 0) {
      this.stateDB[id].state.val = val;
      this.stateDB[id].state.ack = ack;
    }
  }
  async createDataItems(data, parent) {
    for (const i in data) {
      const d = data[i];
      if (d === void 0)
        continue;
      if (typeof d === "object" && !("type" in d)) {
        data[i] = await this.createDataItems(d, parent);
      } else if (typeof d === "object" && "type" in d) {
        data[i] = data[i] !== void 0 ? new import_data_item.Dataitem(this.adapter, { ...d, name: `${this.name}.${parent.name}.${i}` }, parent, this) : void 0;
        if (data[i] !== void 0 && !await data[i].isValidAndInit()) {
          data[i] = void 0;
        }
      }
    }
    return data;
  }
  async getDataItemsFromAuto(dpInit, data) {
    if (dpInit === "")
      return {};
    if (this.tempObjectDB === void 0) {
      this.tempObjectDB = {};
      this.adapter.setTimeout(() => {
        this.tempObjectDB = void 0;
      }, 3e5);
    }
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
          if (!(0, import_pages.isPageRole)(role)) {
            throw new Error(`${d.dp} has a unkowned role ${d.role}`);
          }
          if (!this.tempObjectDB[dpInit]) {
            this.tempObjectDB[dpInit] = await this.adapter.getForeignObjectsAsync(`${dpInit}.*`);
          }
          if (!this.tempObjectDB[dpInit]) {
            this.log.warn(`Dont find states for ${dpInit}!`);
          }
          for (const id in this.tempObjectDB[dpInit]) {
            const obj = this.tempObjectDB[dpInit][id];
            if (obj && obj.common && obj.type === "state") {
              if (obj.common.role === role) {
                if (found) {
                  this.log.warn(`Found more as 1 state for role ${role} in ${dpInit}`);
                  break;
                }
                d.dp = id;
                d.mode = "done";
                found = true;
              }
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
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseClassTriggerd,
  StatesControler
});
//# sourceMappingURL=states-controller.js.map