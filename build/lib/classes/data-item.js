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
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
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
var import_Color = require("../const/Color");
var import_library = require("./library");
var NSPanel = __toESM(require("../types/types"));
class Dataitem extends import_library.BaseClass {
  options;
  //private obj: ioBroker.Object | null | undefined;
  stateDB;
  type = void 0;
  parent;
  common = {};
  _writeable = false;
  /**
   * Call isValidAndInit() after constructor and check return value - if false, this object is not configured correctly.
   *
   * @param adapter this of adapter
   * @param options {NSPanel.DataItemsOptions}
   * @param parent {BaseClassTriggerd}
   * @param db {StatesControler}
   */
  constructor(adapter, options, parent, db) {
    super(adapter, options.name || "");
    this.options = options;
    this.stateDB = db;
    this.parent = parent;
    switch (this.options.type) {
      case "const":
        this.options.constVal = import_Color.Color.getColorFromDefault(this.options.constVal);
        this.setTypeFromValue(this.options.constVal);
        break;
      case "state":
      case "triggered":
        this.type = this.options.forceType ? this.options.forceType : void 0;
        break;
      case "internalState":
      case "internal": {
        if (!this.options.dp.startsWith("///")) {
          this.options.dp = `${this.parent.panel.name}/${this.options.dp}`;
        }
        this.type = void 0;
      }
    }
  }
  get writeable() {
    return this._writeable;
  }
  /**
   * Init and check dp is valid
   *
   * @returns if false value is not valid
   */
  async isValidAndInit() {
    switch (this.options.type) {
      case "const":
        return !(this.options.constVal === void 0 || this.options.constVal === null);
      case "state":
      case "internal":
      case "internalState":
      case "triggered": {
        if (!this.options.dp) {
          return false;
        }
        this.options.dp = this.options.dp.replace(
          "${this.namespace}",
          `${this.adapter.namespace}.panels.${this.parent.panel.name}`
        );
        const obj = await this.stateDB.getObjectAsync(this.options.dp);
        if (!obj || obj.type != "state" || !obj.common) {
          this.log.warn(`801: ${this.options.dp} has a invalid state object!`);
          return false;
        }
        this.type = this.type || obj.common.type;
        this.options.role = obj.common.role;
        this._writeable = !!obj.common.write;
        this.common = obj.common;
        if (this.options.type == "triggered") {
          await this.stateDB.setTrigger(this.options.dp, this.parent, false, void 0, this.options.change);
        } else if (this.options.type == "internal") {
          await this.stateDB.setTrigger(this.options.dp, this.parent, true, void 0, this.options.change);
        } else if (this.options.type == "internalState") {
          await this.stateDB.setTrigger(this.options.dp, this.parent, true, false);
        }
        try {
          const value = await this.stateDB.getState(this.options.dp);
          return value !== null && value !== void 0;
        } catch (e) {
          this.log.error(`Error 1001: ${typeof e === "string" ? e.replaceAll("Error: ", "") : e}`);
          return false;
        }
      }
    }
    return false;
  }
  async getRawState() {
    try {
      switch (this.options.type) {
        case "const":
          return { val: this.options.constVal, ack: true, ts: Date.now(), lc: Date.now(), from: "" };
        case "state":
        case "triggered":
          if (!this.options.dp) {
            throw new Error(`Error 1002 type is ${this.options.type} but dp is undefined`);
          }
          return await this.stateDB.getState(this.options.dp);
        case "internalState":
        case "internal": {
          return await this.stateDB.getState(this.options.dp);
        }
      }
    } catch (e) {
      this.log.error(`Error 1003: ${e.replaceAll("Error: ", "")}`);
    }
    return null;
  }
  trueType() {
    var _a;
    return "dp" in this.options ? (_a = this.stateDB.getType(this.options.dp)) != null ? _a : this.type : this.type;
  }
  async getCommonStates(force = false) {
    return "dp" in this.options ? this.stateDB.getCommonStates(this.options.dp, force) : void 0;
  }
  async getState() {
    let state = await this.getRawState();
    if (state) {
      state = structuredClone(state);
      if (this.options.type !== "const" && this.options.read) {
        try {
          if (typeof this.options.read === "string") {
            state.val = new Function("val", "Color", "language", "options", `${this.options.read}`)(
              state.val,
              import_Color.Color,
              this.adapter.language,
              this.options.constants
            );
          } else {
            state.val = this.options.read(state.val);
          }
        } catch (e) {
          this.log.error(
            `Read for dp: ${this.options.dp} is invalid! read: ${String(this.options.read)} Error: ${String(e)}`
          );
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
        } catch {
          let value = state.val;
          if (typeof value === "string") {
            value = value.trim();
            if (value.startsWith("#")) {
              const v = import_Color.Color.ConvertWithColordtoRgb(value);
              if (import_Color.Color.isRGB(v)) {
                return v;
              }
            } else if (this.options.role === "level.color.name" || this.options.role === "level.color.rgb") {
              return import_Color.Color.ConvertWithColordtoRgb(value);
            }
          }
        }
      } else if (typeof state.val === "object") {
        return state.val;
      } else if (typeof state.val === "number") {
        return import_Color.Color.decToRgb(state.val);
      }
    }
    return null;
  }
  async getRGBValue() {
    const value = await this.getObject();
    if (value) {
      if (import_Color.Color.isRGB(value)) {
        return value;
      }
      if (typeof value == "object" && "red" in value && "blue" in value && "green" in value) {
        return { r: value.red, g: value.green, b: value.blue };
      }
    }
    return null;
  }
  async getIconScale() {
    const value = await this.getObject();
    if (value) {
      if (NSPanel.isIconColorScaleElement(value)) {
        return value;
      }
    }
    return null;
  }
  async getRGBDec() {
    const value = await this.getRGBValue();
    if (value) {
      return String(import_Color.Color.rgb_dec565(value));
    }
    return null;
  }
  async getTranslatedString() {
    const val = await this.getString();
    if (val !== null) {
      return this.library.getTranslation(val);
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
      case "internalState":
      case "internal":
        return state && state.val !== null ? String(state.val) : null;
    }
    return null;
  }
  async getNumber() {
    const result = await this.getState();
    if (result && (typeof result.val === "number" || typeof result.val === "string" && result.val && !isNaN(Number(result.val)))) {
      let val = parseFloat(String(result.val));
      if (this.options.scale !== void 0) {
        val = Math.trunc(import_Color.Color.scale(val, this.options.scale.min, this.options.scale.max, 0, 100));
      }
      return val;
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
        this.type = void 0;
        break;
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
  /**
   * Flip this 'ON'/'OFF', 0/1 or true/false. Depend on this.type
   */
  async setStateFlip() {
    const value = await this.getBoolean();
    this.log.debug(String(value));
    switch (this.type) {
      case "boolean":
        await this.setStateAsync(!value);
        break;
      case "number":
        await this.setStateAsync(value ? 0 : 1);
        break;
      case "string":
        await this.setStateAsync(value ? "OFF" : "ON");
        break;
    }
  }
  /**
   * Set a internal, const or external State
   *
   * @param val number | boolean | string | null
   * @returns void
   */
  async setStateAsync(val) {
    if (val === void 0) {
      return;
    }
    if (this.options.type === "const") {
      this.options.constVal = val;
    } else {
      if (this.options.write) {
        val = new Function("val", "Color", `${String(this.options.write)}`)(val, import_Color.Color);
      }
      await this.stateDB.setStateAsync(this, val, this._writeable);
    }
  }
}
function isDataItem(F) {
  if (F instanceof Dataitem) {
    return true;
  }
  return false;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Dataitem,
  isDataItem
});
//# sourceMappingURL=data-item.js.map
