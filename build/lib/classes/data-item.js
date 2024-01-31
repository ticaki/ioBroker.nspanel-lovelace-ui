"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var data_item_exports = {};
__export(data_item_exports, {
  Dataitem: () => Dataitem,
  isDataItem: () => isDataItem
});
module.exports = __toCommonJS(data_item_exports);
var Color = __toESM(require("../const/Color"));
var import_library = require("./library");
var NSPanel = __toESM(require("../types/types"));
class Dataitem extends import_library.BaseClass {
  options;
  stateDB;
  type = void 0;
  parent;
  constructor(adapter, options, parent, db) {
    super(adapter, options.name || "");
    this.options = options;
    this.options.type = options.type;
    this.stateDB = db;
    this.parent = parent;
    switch (this.options.type) {
      case "const":
        this.setTypeFromValue(this.options.constVal);
        this.options.state = {
          val: this.options.constVal,
          ack: true,
          ts: Date.now(),
          lc: Date.now(),
          from: ""
        };
        break;
      case "state":
      case "triggered":
        this.type = this.options.forceType ? this.options.forceType : void 0;
        break;
    }
  }
  async isValidAndInit() {
    switch (this.options.type) {
      case "const":
        return this.options.constVal !== void 0;
      case "state":
      case "triggered":
        if (this.options.dp === void 0 || this.options.dp === "")
          return false;
        const obj = await this.adapter.getForeignObjectAsync(this.options.dp);
        if (!obj || obj.type != "state" || !obj.common) {
          this.log.warn(`801: ${this.options.dp} has a invalid state object!`);
          return false;
        }
        this.type = this.type || obj.common.type;
        this.options.role = obj.common.role;
        if (this.options.type == "triggered")
          this.stateDB.setTrigger(this.options.dp, this.parent, this.options.response);
        const value = await this.stateDB.getState(this.options.dp, this.options.response);
        return !!value;
    }
    return false;
  }
  async getRawState() {
    switch (this.options.type) {
      case "const":
        return this.options.state;
      case "state":
      case "triggered":
        if (!this.options.dp) {
          throw new Error(`Error 1002 type is ${this.options.type} but dp is undefined`);
        }
        return await this.stateDB.getState(this.options.dp, this.options.response);
      case "internal": {
      }
    }
    return null;
  }
  async getState() {
    let state = await this.getRawState();
    if (state) {
      state = { ...state };
      if (this.options.type !== "const" && this.options.type !== "internal" && this.options.read) {
        try {
          if (typeof this.options.read === "string")
            state.val = new Function("val", "Color", `${this.options.read}`)(state.val, Color);
          else
            state.val = this.options.read(state.val);
          this.log.debug(JSON.stringify(state.val));
        } catch (e) {
          this.log.error(`Read is invalid: ${this.options.read} Error: ${e}`);
        }
      }
    }
    return state;
  }
  async getObject() {
    const state = await this.getState();
    if (state && state.val) {
      if (typeof state.val === "string") {
        try {
          const value = JSON.parse(state.val);
          return value;
        } catch (e) {
          this.log.warn("Read a incorrect json!");
        }
      } else if (typeof state.val === "object") {
        return state.val;
      }
    }
    return null;
  }
  async getRGBValue() {
    const value = await this.getObject();
    if (value) {
      if (NSPanel.isRGB(value))
        return value;
    }
    return null;
  }
  async getIconScale() {
    const value = await this.getObject();
    if (value) {
      if (NSPanel.isIconScaleElement(value))
        return value;
    }
    return null;
  }
  async getRGBDec() {
    const value = await this.getRGBValue();
    if (value) {
      return String(Color.rgb_dec565(value));
    }
    return null;
  }
  async getString() {
    const state = await this.getState();
    switch (this.options.type) {
      case "const":
        return state && state.val !== null ? String(state.val) : null;
      case "state":
      case "triggered":
        if (this.options.substring) {
          const args = this.options.substring;
          return state && state.val !== null ? String(state.val).substring(args[0], args[1]) : null;
        }
        return state && state.val !== null ? String(state.val) : null;
    }
    return null;
  }
  async getNumber() {
    const result = await this.getState();
    if (result && !isNaN(parseInt(String(result.val)))) {
      return parseFloat(result.val);
    }
    return null;
  }
  async getBoolean() {
    const result = await this.getState();
    if (result && result.val !== null) {
      if (typeof result.val === "string") {
        switch (result.val.toLowerCase()) {
          case "ok":
          case "on":
          case "yes":
          case "true":
          case "online":
            return true;
        }
      }
      return !!result.val;
    }
    return null;
  }
  setTypeFromValue(val) {
    switch (typeof val) {
      case "string":
        this.type = "string";
        break;
      case "number":
      case "bigint":
        this.type = "number";
        break;
      case "boolean":
        this.type = "boolean";
        break;
      case "undefined":
        this.type = "undefined";
      case "symbol":
      case "object":
      case "function":
        this.type = "object";
    }
  }
  async setStateTrue() {
    await this.setStateAsync(true);
  }
  async setStateFalse() {
    await this.setStateAsync(false);
  }
  async setStateFlip() {
    switch (this.type) {
      case "boolean":
        await this.setStateAsync(!await this.getBoolean());
        break;
      case "number":
        await this.setStateAsync(await this.getBoolean() ? 0 : 1);
        break;
      case "string":
        await this.setStateAsync(await this.getBoolean() ? "OFF" : "ON");
        break;
    }
  }
  async setStateAsync(val) {
    if (val === void 0)
      return;
    if (this.options.type === "const") {
      this.options.constVal = val;
    } else {
      await this.stateDB.setStateAsync(this, val);
    }
  }
}
function isDataItem(F) {
  if (F instanceof Dataitem)
    return true;
  return false;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Dataitem,
  isDataItem
});
//# sourceMappingURL=data-item.js.map
