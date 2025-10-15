"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
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
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var library_exports = {};
__export(library_exports, {
  BaseClass: () => BaseClass,
  Library: () => Library
});
module.exports = __toCommonJS(library_exports);
var import_fs = __toESM(require("fs"));
var import_definition = require("../const/definition");
var LocalTranslations = __toESM(require("../../../templates/translations.json"));
var _adapter, _prefix;
class BaseClass {
  unload = false;
  log;
  adapter;
  library;
  name = ``;
  friendlyName = ``;
  constructor(adapter, name = "", logName = "") {
    this.name = name;
    this.friendlyName = logName ? logName : this.name;
    this.log = new CustomLog(adapter, this.friendlyName);
    this.adapter = adapter;
    this.library = adapter.library;
  }
  async delete() {
    this.unload = true;
  }
}
class CustomLog {
  constructor(adapter, text = "") {
    __privateAdd(this, _adapter);
    __privateAdd(this, _prefix);
    __privateSet(this, _adapter, adapter);
    __privateSet(this, _prefix, text);
  }
  getName() {
    return __privateGet(this, _prefix);
  }
  debug(log, log2 = "") {
    __privateGet(this, _adapter).log.debug(log2 ? `[${log}] ${log2}` : `[${__privateGet(this, _prefix)}] ${log}`);
  }
  info(log, log2 = "") {
    __privateGet(this, _adapter).log.info(log2 ? `[${log}] ${log2}` : `[${__privateGet(this, _prefix)}] ${log}`);
  }
  warn(log, log2 = "") {
    __privateGet(this, _adapter).log.warn(log2 ? `[${log}] ${log2}` : `[${__privateGet(this, _prefix)}] ${log}`);
  }
  error(log, log2 = "") {
    __privateGet(this, _adapter).log.error(log2 ? `[${log}] ${log2}` : `[${__privateGet(this, _prefix)}] ${log}`);
    if (__privateGet(this, _adapter).config.testCase) {
      throw new Error(log2 ? `[${log}] ${log2}` : `[${__privateGet(this, _prefix)}] No Erros while testing - ${log}`);
    }
  }
  setLogPrefix(text) {
    __privateSet(this, _prefix, text);
  }
}
_adapter = new WeakMap();
_prefix = new WeakMap();
class Library extends BaseClass {
  stateDataBase = {};
  forbiddenDirs = [];
  translation = {};
  unknownTokens = {};
  unknownTokensInterval;
  defaults = {
    updateStateOnChangeOnly: true
  };
  constructor(adapter, _options = null) {
    super(adapter, "library");
    this.stateDataBase = {};
  }
  async init() {
    await this.checkLanguage();
    if (this.adapter.config.logUnknownTokens) {
      this.unknownTokensInterval = this.adapter.setInterval(() => {
        this.log.info(`Unknown tokens: ${JSON.stringify(this.unknownTokens)}`);
      }, 6e4);
    }
  }
  /**
  /**
   * Write/create states and channels from a JSON subtree using a definition.
   *
   * Parallelization:
   * - Parent channel is created first (sequential).
   * - Children (array items or object keys) are processed in parallel with a concurrency limit.
   *
   * @param prefix       ioBroker datapoint prefix to write into (e.g., "adapter.0.foo")
   * @param objNode      JSON-path into the definition (used by getObjectDefFromJson)
   * @param def          Definition JSON (mapping of nodes to Channel/State object definitions)
   * @param data         Source JSON subtree to materialize under `prefix`
   * @param expandTree   If true, arrays below a state are expanded into channels instead of being stringified
   * @param concurrency  Max number of parallel child writes (default: 8)
   * @returns Promise<void>
   */
  async writeFromJson(prefix, objNode, def, data, expandTree = false, concurrency = 8) {
    if (!def || typeof def !== "object") {
      return;
    }
    const t = typeof data;
    if (data === void 0 || t !== "string" && t !== "number" && t !== "boolean" && t !== "object") {
      return;
    }
    const objectDefinition = objNode ? await this.getObjectDefFromJson(`${objNode}`, def, data) : null;
    if (objectDefinition) {
      objectDefinition.native = {
        ...objectDefinition.native || {},
        objectDefinitionReference: objNode
      };
    }
    const queue = [];
    let active = 0;
    const runLimited = async (task) => {
      if (active >= concurrency) {
        await new Promise((resolve) => queue.push(async () => resolve()));
      }
      active++;
      try {
        return await task();
      } finally {
        active--;
        const next = queue.shift();
        if (next) {
          next().catch(() => void 0);
        }
      }
    };
    const processArrayItem = (idx, item) => runLimited(async () => {
      if (!objectDefinition) {
        return;
      }
      const defChannel = this.getChannelObject(objectDefinition);
      const dp = `${prefix}${`00${idx}`.slice(-2)}`;
      await this.writedp(dp, null, defChannel);
      await this.writeFromJson(dp, `${objNode}`, def, item, expandTree, concurrency);
    });
    const processObjectKey = (key, value) => runLimited(async () => {
      await this.writeFromJson(`${prefix}.${key}`, `${objNode}.${key}`, def, value, expandTree, concurrency);
    });
    if (typeof data === "object" && data !== null) {
      if (Array.isArray(data)) {
        if (!objectDefinition) {
          return;
        }
        if (objectDefinition.type === "state" && !expandTree) {
          const serialized = JSON.stringify(data) || "[]";
          await this.writeFromJson(prefix, objNode, def, serialized, expandTree, concurrency);
          return;
        }
        const tasks2 = data.map((item, idx) => processArrayItem(idx, item));
        await Promise.all(tasks2);
        return;
      }
      if (objectDefinition) {
        const defChannel = this.getChannelObject(objectDefinition);
        await this.writedp(prefix, null, defChannel);
      }
      if (data === null) {
        return;
      }
      const entries = Object.entries(data);
      const tasks = entries.map(([k, v]) => processObjectKey(k, v));
      await Promise.all(tasks);
      return;
    }
    if (!objectDefinition) {
      return;
    }
    await this.writedp(prefix, data, objectDefinition);
  }
  /**
   * Get the ioBroker.Object out of stateDefinition
   *
   * @param key is the deep linking key to the definition
   * @param def is the definition object
   * @param data  is the definition dataset
   * @returns ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.StateObject
   */
  async getObjectDefFromJson(key, def, data) {
    let result = this.deepJsonValue(key, def);
    if (result === null || result === void 0) {
      const k = key.split(".");
      if (k && k[k.length - 1].startsWith("_")) {
        result = import_definition.genericStateObjects.customString;
        result = structuredClone(result);
      } else {
        this.log.debug(`No definition for ${key}!`);
        result = import_definition.genericStateObjects.default;
        result = structuredClone(result);
        switch (typeof data) {
          case "number":
          case "bigint":
            {
              result.common.type = "number";
              result.common.role = "value";
            }
            break;
          case "boolean":
            {
              result.common.type = "boolean";
              result.common.role = "indicator";
            }
            break;
          case "string":
            {
              result.common.type = "string";
              result.common.role = "text";
            }
            break;
          case "symbol":
          case "undefined":
          case "object":
          case "function":
            {
              result.common.type = "string";
              result.common.role = "json";
            }
            break;
        }
      }
    } else {
      result = structuredClone(result);
    }
    return result;
  }
  deepJsonValue(key, data) {
    if (!key || !data || typeof data !== "object" || typeof key !== "string") {
      throw new Error(`Error(222) data or key are missing/wrong type!`);
    }
    const k = key.split(`.`);
    let c = 0, s = data;
    while (c < k.length) {
      s = s[k[c++]];
      if (s === void 0) {
        return null;
      }
    }
    return s;
  }
  /**
   * Get a channel/device definition from property _channel out of a getObjectDefFromJson() result or a default definition.
   *
   * @param definition the definition object
   * @returns ioBroker.ChannelObject | ioBroker.DeviceObject or a default channel obj
   */
  getChannelObject(definition = null) {
    const def = definition && definition._channel || null;
    const result = {
      _id: def ? def._id : "",
      type: def ? def.type == "channel" ? "channel" : def.type === "device" ? "device" : "folder" : "folder",
      common: {
        name: def && def.common && def.common.name || "no definition"
      },
      native: def && def.native || {}
    };
    return result;
  }
  /**
   * Write/create the specified datapoint with a value.
   *
   * Behavior:
   * - Creates/extends the ioBroker object when it does not exist in the in-memory DB.
   * - Channels/Devices are created/updated but never written as states.
   * - For states, writes only when:
   *   - `val !== undefined` and
   *   - (`defaults.updateStateOnChangeOnly` is true) OR (old value differs) OR (`forceWrite` is true) OR (`!node.ack`)
   * - Values are converted to the target ioBroker common.type (if available).
   * - Skips write operations for disallowed directories (as per `isDirAllowed`).
   *
   * @param dp         Datapoint id (will be normalized via `cleandp`).
   * @param val        New value (channels/devices use `undefined` and will not be written).
   * @param obj        Object definition for creation/extension (Channel/Device/State); required if the node is new.
   * @param ack        Acknowledged flag for state write.
   * @param forceWrite Force write even if `val` equals old value.
   * @returns Promise<void>
   * @throws Error if a new state must be created but `obj` is missing.
   */
  async writedp(dp, val, obj = null, ack = true, forceWrite = false) {
    var _a, _b, _c;
    dp = this.cleandp(dp);
    let node = this.readdb(dp);
    const disallowed = !this.isDirAllowed(dp);
    if (node === void 0) {
      if (!obj) {
        throw new Error("writedp: trying to create a state without object information.");
      }
      obj._id = `${this.adapter.name}.${this.adapter.instance}.${dp}`;
      if (typeof obj.common.name === "string") {
        obj.common.name = await this.getTranslationObj(obj.common.name);
      }
      if (!disallowed) {
        if (obj.type === "state" && obj.common.states) {
          const existing = await this.adapter.getObjectAsync(dp);
          if (existing) {
            existing.common.states = obj.common.states;
            await this.adapter.setObject(dp, existing);
          }
        }
        await this.adapter.extendObject(dp, obj);
      }
      const stateType = obj.type !== "state" ? void 0 : (_a = obj == null ? void 0 : obj.common) == null ? void 0 : _a.type;
      node = this.setdb(dp, obj.type, void 0, stateType, true, Date.now(), obj);
    } else if (node.init && obj) {
      if (typeof obj.common.name === "string") {
        obj.common.name = await this.getTranslationObj(obj.common.name);
      }
      if (!disallowed) {
        if (obj.type === "state" && obj.common.states) {
          const existing = await this.adapter.getObjectAsync(dp);
          if (existing) {
            existing.common.states = obj.common.states;
            await this.adapter.setObject(dp, existing);
          }
        }
        await this.adapter.extendObject(dp, obj);
        node.init = false;
      }
    }
    if (obj && obj.type !== "state") {
      return;
    }
    if (node && !(node.type === "state" && val === void 0)) {
      this.setdb(dp, node.type, val, node.stateTyp, false, void 0, void 0, node.init);
    }
    if (node && val !== void 0 && (this.defaults.updateStateOnChangeOnly || node.val != val || forceWrite || !node.ack)) {
      const targetType = (_c = (_b = obj == null ? void 0 : obj.common) == null ? void 0 : _b.type) != null ? _c : node.stateTyp;
      if (targetType && typeof val !== targetType) {
        val = this.convertToType(val, targetType);
      }
      if (!disallowed) {
        await this.adapter.setState(dp, {
          val,
          ts: Date.now(),
          ack
        });
      }
    }
  }
  setForbiddenDirs(dirs) {
    this.forbiddenDirs = this.forbiddenDirs.concat(dirs);
  }
  isDirAllowed(dp) {
    if (dp && dp.split(".").length <= 2) {
      return true;
    }
    for (const a of this.forbiddenDirs) {
      if (dp.search(new RegExp(a, "g")) != -1) {
        return false;
      }
    }
    return true;
  }
  getStates(str) {
    const result = {};
    for (const dp in this.stateDataBase) {
      if (dp.search(new RegExp(str, "g")) != -1) {
        result[dp] = this.stateDataBase[dp];
      }
    }
    return result;
  }
  async cleanUpTree(hold, filter, deep) {
    let del = [];
    for (const dp in this.stateDataBase) {
      if (filter && filter.filter((a) => dp.startsWith(a) || a.startsWith(dp)).length == 0) {
        continue;
      }
      if (hold.filter((a) => dp.startsWith(a) || a.startsWith(dp)).length > 0) {
        continue;
      }
      delete this.stateDataBase[dp];
      del.push(dp.split(".").slice(0, deep).join("."));
    }
    del = del.filter((item, pos, arr) => {
      return arr.indexOf(item) == pos;
    });
    for (const a of del) {
      await this.adapter.delObjectAsync(a, { recursive: true });
      this.log.debug(`Clean up tree delete: ${a}`);
    }
  }
  /**
   * Remove forbidden chars from datapoint string.
   *
   * @param string Datapoint string to clean
   * @param lowerCase lowerCase() first param.
   * @param removePoints remove . from dp
   * @returns void
   */
  cleandp(string, lowerCase = false, removePoints = false) {
    if (!string && typeof string != "string") {
      return string;
    }
    string = string.replace(this.adapter.FORBIDDEN_CHARS, "_");
    if (removePoints) {
      string = string.replace(/[^0-9A-Za-z_-]/gu, "_");
    } else {
      string = string.replace(/[^0-9A-Za-z._-]/gu, "_");
    }
    return lowerCase ? string.toLowerCase() : string;
  }
  /**
   * Convert an arbitrary value to the requested target type and return an ioBroker.StateValue.
   *
   * Rules:
   * - 'string': primitives -> String(value); arrays/objects -> JSON string.
   * - 'number': numbers stay; booleans -> 1/0; strings parsed with comma support ("1,23" -> 1.23); NaN -> 0.
   * - 'boolean': booleans stay; numbers -> value !== 0; strings -> common truthy/falsey keywords; otherwise Boolean(value).
   * - 'array' | 'json': always JSON string of the input.
   *
   * @param value Input value to convert (may be primitive, array, or object)
   * @param type  Target type: 'string' | 'number' | 'boolean' | 'array' | 'json'
   * @returns Converted value as ioBroker.StateValue (string | number | boolean | null)
   * @throws Error if `type` is 'undefined'
   */
  convertToType(value, type) {
    if (value === null) {
      return null;
    }
    if (type === "undefined") {
      throw new Error('convertToType: type "undefined" not allowed');
    }
    if (value === void 0) {
      value = "";
    }
    if (type === "mixed") {
      if (["string", "number", "boolean"].includes(typeof value)) {
        return value;
      }
      type = Array.isArray(value) ? "array" : "json";
    }
    if (type === "object") {
      type = "json";
    }
    const toJsonString = (v) => JSON.stringify(v);
    switch (type) {
      case "string": {
        if (typeof value === "string") {
          return value;
        }
        if (typeof value === "object") {
          return toJsonString(value);
        }
        return String(value);
      }
      case "number": {
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }
        if (typeof value === "boolean") {
          return value ? 1 : 0;
        }
        if (typeof value === "string") {
          const n = Number(value.trim().replace(",", "."));
          return Number.isFinite(n) ? n : 0;
        }
        return 0;
      }
      case "boolean": {
        if (typeof value === "boolean") {
          return value;
        }
        if (typeof value === "number") {
          return value !== 0;
        }
        if (typeof value === "string") {
          const s = value.trim().toLowerCase();
          if (["true", "1", "on", "yes", "y"].includes(s)) {
            return true;
          }
          if (["false", "0", "off", "no", "n", ""].includes(s)) {
            return false;
          }
          return Boolean(s);
        }
        return Boolean(value);
      }
      case "array":
      case "json": {
        return toJsonString(value);
      }
    }
  }
  readdb(dp) {
    return this.stateDataBase[this.cleandp(dp)];
  }
  setdb(dp, type, val = void 0, stateType = void 0, ack = true, ts = Date.now(), obj = void 0, init = false) {
    if (typeof type == "object") {
      type = type;
      this.stateDataBase[dp] = type;
    } else {
      type = type;
      this.stateDataBase[dp] = {
        type,
        stateTyp: stateType !== void 0 ? stateType : this.stateDataBase[dp] !== void 0 && this.stateDataBase[dp].stateTyp !== void 0 ? this.stateDataBase[dp].stateTyp : void 0,
        val,
        ack,
        ts: ts ? ts : Date.now(),
        obj: obj !== void 0 ? obj : this.stateDataBase[dp] !== void 0 && this.stateDataBase[dp].obj !== void 0 ? this.stateDataBase[dp].obj : void 0,
        init
      };
    }
    return this.stateDataBase[dp];
  }
  async memberDeleteAsync(data) {
    if (this.unknownTokensInterval) {
      this.adapter.clearInterval(this.unknownTokensInterval);
    }
    for (const d of data) {
      await d.delete();
    }
  }
  async fileExistAsync(file) {
    if (import_fs.default.existsSync(`./admin/${file}`)) {
      return true;
    }
    return false;
  }
  /**
   * Initialise the database with the states to prevent unnecessary creation and writing.
   *
   * @param states States that are to be read into the database during initialisation.
   * @returns void
   */
  async initStates(states) {
    if (!states) {
      return;
    }
    this.stateDataBase = {};
    const removedChannels = [];
    for (const state in states) {
      const dp = state.replace(`${this.adapter.name}.${this.adapter.instance}.`, "");
      const del = !this.isDirAllowed(dp);
      if (!del) {
        const obj = await this.adapter.getObjectAsync(dp);
        this.setdb(
          dp,
          "state",
          states[state] ? states[state].val : void 0,
          obj && obj.common && obj.common.type ? obj.common.type : void 0,
          states[state] && states[state].ack,
          states[state] && states[state].ts ? states[state].ts : Date.now(),
          obj == null ? void 0 : obj,
          true
        );
      } else {
        if (!removedChannels.every((a) => !dp.startsWith(a))) {
          continue;
        }
        const channel = dp.split(".").slice(0, 4).join(".");
        removedChannels.push(channel);
        await this.adapter.delObjectAsync(channel, { recursive: true });
        this.log.debug(`Delete channel with dp:${channel}`);
      }
    }
  }
  /**
   * Resets states that have not been updated in the database in offset time.
   *
   * @param prefix String with which states begin that are reset.
   * @param offset Time in ms since last update.
   * @param del Delete the state if it is not updated.
   * @returns void
   */
  async garbageColleting(prefix, offset = 2e3, del = false) {
    if (!prefix) {
      return;
    }
    if (this.stateDataBase) {
      for (const id in this.stateDataBase) {
        if (id.startsWith(prefix)) {
          const state = this.stateDataBase[id];
          if (!state || state.val == void 0) {
            continue;
          }
          if (state.ts < Date.now() - offset) {
            if (del) {
              await this.cleanUpTree([], [id], -1);
              continue;
            }
            let newVal;
            switch (state.stateTyp) {
              case "string":
                if (typeof state.val == "string") {
                  if (state.val.startsWith("{") && state.val.endsWith("}")) {
                    newVal = "{}";
                  } else if (state.val.startsWith("[") && state.val.endsWith("]")) {
                    newVal = "[]";
                  } else {
                    newVal = "";
                  }
                } else {
                  newVal = "";
                }
                break;
              case "bigint":
              case "number":
                newVal = -1;
                break;
              case "boolean":
                newVal = false;
                break;
              case "symbol":
              case "object":
              case "function":
                newVal = null;
                break;
              case "undefined":
                newVal = void 0;
                break;
            }
            await this.writedp(id, newVal);
          }
        }
      }
    }
  }
  getLocalLanguage() {
    if (this.adapter.language) {
      return this.adapter.language;
    }
    return "en";
  }
  getTranslation(key) {
    if (!key) {
      return "";
    }
    if (this.translation[key] !== void 0) {
      return this.translation[key];
    }
    if (this.adapter.config.logUnknownTokens) {
      this.unknownTokens[key] = "";
    }
    return key;
  }
  existTranslation(key) {
    return this.translation[key] !== void 0;
  }
  async getTranslationObj(key) {
    const language = ["en", "de", "ru", "pt", "nl", "fr", "it", "es", "pl", "uk", "zh-cn"];
    const result = {};
    for (const l of language) {
      try {
        const i = await Promise.resolve().then(() => __toESM(require(`../../../admin/i18n/${l}/translations.json`)));
        if (i[key] !== void 0) {
          result[l] = i[key];
        }
      } catch {
        if (this.adapter.config.logUnknownTokens) {
          this.unknownTokens[key] = "";
        }
        return key;
      }
    }
    if (result.en == void 0) {
      if (this.adapter.config.logUnknownTokens) {
        this.unknownTokens[key] = "";
      }
      return key;
    }
    return result;
  }
  async checkLanguage() {
    try {
      this.log.debug(`Load language ${this.adapter.language}`);
      this.translation = await Promise.resolve().then(() => __toESM(require(`../../../admin/i18n/${this.adapter.language}/translations.json`)));
    } catch {
      this.log.warn(`Language ${this.adapter.language} not exist!`);
    }
  }
  sortText(text) {
    text.sort((a, b) => {
      const nameA = a.toUpperCase();
      const nameB = b.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
    return text;
  }
  /**
   *
   * @param text string to replace a Date
   * @param noti appendix to translation key
   * @param day true = Mo, 12.05 - false = 12.05
   * @returns Monday first March
   */
  convertSpeakDate(text, noti = "", day = false) {
    if (!text || typeof text !== `string`) {
      return ``;
    }
    const b = text.split(`.`);
    if (day) {
      b[0] = b[0].split(" ")[2];
    }
    return ` ${`${(/* @__PURE__ */ new Date(`${b[1]}/${b[0]}/${(/* @__PURE__ */ new Date()).getFullYear()}`)).toLocaleString(this.getLocalLanguage(), {
      weekday: day ? "long" : void 0,
      day: "numeric",
      month: `long`
    })} `.replace(/([0-9]+\.)/gu, (x) => {
      const result = this.getTranslation(x + noti);
      if (result != x + noti) {
        return result;
      }
      return this.getTranslation(x);
    })}`;
  }
  getLocalTranslation(group, key) {
    try {
      if (group in LocalTranslations) {
        const result = LocalTranslations[group];
        if (key in result) {
          return result[key]["de-DE"];
        }
      }
    } catch {
      return key;
    }
    return key;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseClass,
  Library
});
//# sourceMappingURL=library.js.map
