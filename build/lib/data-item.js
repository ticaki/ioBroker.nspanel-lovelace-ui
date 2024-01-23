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
  Dataitem: () => Dataitem
});
module.exports = __toCommonJS(data_item_exports);
var Color = __toESM(require("./color"));
var import_library = require("./library");
var NSPanel = __toESM(require("./types"));
class Dataitem extends import_library.BaseClass {
  options;
  obj;
  readOnlyDB;
  type = "undefined";
  parent;
  constructor(adapter, options, that, db) {
    super(adapter, options.name || "");
    this.options = options;
    this.options.type = options.type;
    this.readOnlyDB = db;
    this.parent = that;
    switch (this.options.type) {
      case "const":
        this.setTypeFromValue(this.options.constVal);
        this.options.value = {
          val: this.options.constVal,
          ack: true,
          ts: Date.now(),
          lc: Date.now(),
          from: ""
        };
        break;
      case "state":
      case "triggered":
        break;
    }
  }
  async isValidAndInit() {
    switch (this.options.type) {
      case "const":
        return this.options.constVal !== void 0;
      case "state":
      case "triggered":
        if (this.options.dp === void 0)
          return false;
        this.obj = await this.adapter.getForeignObjectAsync(this.options.dp);
        if (!this.obj || this.obj.type != "state" || !this.obj.common) {
          throw new Error(`801: ${this.options.dp} has no state object! Bye Bye`);
        }
        this.type = this.obj.common.type;
        this.options.role = this.obj.common.role || "";
        const value = await this.readOnlyDB.getValue(this.options.dp);
        if (this.options.type == "state")
          return !!value;
        this.readOnlyDB.setTrigger(this.options.dp, this.parent);
        return !!value;
    }
    return false;
  }
  async getRawValue() {
    switch (this.options.type) {
      case "const":
        return this.options.value;
      case "state":
      case "triggered":
        if (this.options.dp === void 0)
          throw new Error(`Error 1002 type is ${this.options.type} but dp is undefined`);
        return await this.readOnlyDB.getValue(this.options.dp);
    }
    return null;
  }
  async getObject() {
    const state = await this.getRawValue();
    if (state && state.val) {
      if (typeof state.val === "string") {
        try {
          const value = JSON.parse(state.val);
          return value;
        } catch (e) {
          this.log.warn("incorrect json!");
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
    const state = await this.getRawValue();
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
  }
  async getNumber() {
    const result = await this.getRawValue();
    if (result && !isNaN(parseInt(String(result.val)))) {
      return parseInt(result.val);
    }
    return null;
  }
  async getBoolean() {
    const result = await this.getRawValue();
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
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Dataitem
});
//# sourceMappingURL=data-item.js.map
