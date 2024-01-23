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
var states_controler_exports = {};
__export(states_controler_exports, {
  BaseClassTriggerd: () => BaseClassTriggerd,
  StatesDBReadOnly: () => StatesDBReadOnly
});
module.exports = __toCommonJS(states_controler_exports);
var import_library = require("./library");
class BaseClassTriggerd extends import_library.BaseClass {
  updateTimeout;
  doUpdate = true;
  minUpdateInterval;
  constructor(adapter, name = "", minUpdateInterval = 15e3) {
    super(adapter, name);
    this.minUpdateInterval = minUpdateInterval;
  }
  async onStateTrigger() {
    if (this.updateTimeout) {
      this.doUpdate = true;
      return false;
    } else {
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
  }
  async delete() {
    if (this.updateTimeout)
      this.adapter.clearTimeout(this.updateTimeout);
  }
}
class StatesDBReadOnly extends import_library.BaseClass {
  triggerDB = {};
  stateDB = {};
  timespan;
  constructor(adapter, name = "", timespan = 15e3) {
    super(adapter, name || "StatesDBReadOnly");
    this.timespan = timespan;
  }
  async setTrigger(id, from) {
    if (id.startsWith(this.adapter.namespace))
      throw new Error(`Id: ${id} links to own namespace of adapter, this is not allowed!`);
    if (this.triggerDB[id] !== void 0) {
      if (this.triggerDB[id].to.indexOf(from) == -1)
        this.triggerDB[id].to.push(from);
    } else {
      const state = await this.adapter.getForeignStateAsync(id);
      if (state) {
        await this.adapter.subscribeForeignStatesAsync(id);
        this.triggerDB[id] = {
          state,
          to: [from],
          ts: Date.now()
        };
      }
      this.log.debug(`Set to new trigger to ${id}`);
    }
  }
  async getValue(id) {
    if (this.triggerDB[id] !== void 0) {
      return this.triggerDB[id].state;
    } else if (this.stateDB[id]) {
      if (Date.now() - this.timespan - this.stateDB[id].ts < 0) {
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
    if (dp && state && state.ack) {
      if (this.triggerDB[dp]) {
        if (this.triggerDB[dp].state) {
          this.log.debug(`Trigger from ${dp} with state ${JSON.stringify(state)}`);
          this.triggerDB[dp].ts = Date.now();
          if (this.triggerDB[dp].state.val !== state.val) {
            this.triggerDB[dp].state = state;
            this.triggerDB[dp].to.forEach((c) => c.onStateTrigger && c.onStateTrigger());
          }
        }
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseClassTriggerd,
  StatesDBReadOnly
});
//# sourceMappingURL=states-controler.js.map
