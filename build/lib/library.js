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
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var library_exports = {};
__export(library_exports, {
  BaseClass: () => BaseClass,
  Library: () => Library,
  sleep: () => sleep
});
module.exports = __toCommonJS(library_exports);
var import_fs = __toESM(require("fs"));
var import_definition = require("./definition");
var _adapter, _prefix;
class BaseClass {
  unload = false;
  log;
  adapter;
  library;
  name = ``;
  constructor(adapter, name = "") {
    this.name = name;
    this.log = new CustomLog(adapter, this.name);
    this.adapter = adapter;
    this.library = adapter.library;
  }
  async delete() {
    this.unload = true;
  }
}
class CustomLog {
  constructor(adapter, text = "") {
    __privateAdd(this, _adapter, void 0);
    __privateAdd(this, _prefix, void 0);
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
  }
  setLogPrefix(text) {
    __privateSet(this, _prefix, text);
  }
}
_adapter = new WeakMap();
_prefix = new WeakMap();
class Library extends BaseClass {
  stateDataBase = {};
  language = "en";
  forbiddenDirs = [];
  translation = {};
  defaults = {
    updateStateOnChangeOnly: true
  };
  constructor(adapter, _options = null) {
    super(adapter, "library");
    this.stateDataBase = {};
  }
  async init() {
    const obj = await this.adapter.getForeignObjectAsync("system.config");
    if (obj) {
      await this.setLanguage(obj.common.language, true);
    } else {
      await this.setLanguage("en", true);
    }
  }
  async writeFromJson(prefix, objNode, def, data, expandTree = false) {
    if (!def || typeof def !== "object")
      return;
    if (data === void 0 || ["string", "number", "boolean", "object"].indexOf(typeof data) == -1)
      return;
    const objectDefinition = objNode ? await this.getObjectDefFromJson(`${objNode}`, def, data) : null;
    if (objectDefinition)
      objectDefinition.native = {
        ...objectDefinition.native || {},
        objectDefinitionReference: objNode
      };
    if (typeof data === "object" && data !== null) {
      if (Array.isArray(data)) {
        if (!objectDefinition)
          return;
        if (objectDefinition.type !== "state" || expandTree) {
          let a = 0;
          for (const k in data) {
            const defChannel = this.getChannelObject(objectDefinition);
            const dp = `${prefix}${`00${a++}`.slice(-2)}`;
            await this.writedp(dp, null, defChannel);
            await this.writeFromJson(dp, `${objNode}`, def, data[k], expandTree);
          }
        } else {
          this.writeFromJson(prefix, objNode, def, JSON.stringify(data) || "[]", expandTree);
        }
      } else {
        if (objectDefinition) {
          const defChannel = this.getChannelObject(objectDefinition);
          await this.writedp(prefix, null, defChannel);
        }
        if (data === null)
          return;
        for (const k in data) {
          await this.writeFromJson(`${prefix}.${k}`, `${objNode}.${k}`, def, data[k], expandTree);
        }
      }
    } else {
      if (!objectDefinition)
        return;
      await this.writedp(prefix, data, objectDefinition);
    }
  }
  async getObjectDefFromJson(key, def, data) {
    let result = this.deepJsonValue(key, def);
    if (result === null || result === void 0) {
      const k = key.split(".");
      if (k && k[k.length - 1].startsWith("_")) {
        result = import_definition.genericStateObjects.customString;
        result = this.cloneObject(result);
      } else {
        this.log.debug(`No definition for ${key}!`);
        result = import_definition.genericStateObjects.default;
        result = this.cloneObject(result);
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
          case "symbol":
          case "undefined":
          case "object":
          case "function":
            {
              result.common.type = "string";
              result.common.role = "text";
            }
            break;
        }
      }
    } else
      result = this.cloneObject(result);
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
      if (s === void 0)
        return null;
    }
    return s;
  }
  getChannelObject(definition = null) {
    const def = definition && definition._channel || null;
    const result = {
      _id: def ? def._id : "",
      type: def && def.type != "device" ? "channel" : "device",
      common: {
        name: def && def.common && def.common.name || "no definition"
      },
      native: def && def.native || {}
    };
    return result;
  }
  async writedp(dp, val, obj = null, ack = true) {
    dp = this.cleandp(dp);
    let node = this.readdb(dp);
    const del = !this.isDirAllowed(dp);
    if (node === void 0) {
      if (!obj) {
        throw new Error("writedp try to create a state without object informations.");
      }
      obj._id = `${this.adapter.name}.${this.adapter.instance}.${dp}`;
      if (typeof obj.common.name == "string")
        obj.common.name = await this.getTranslationObj(obj.common.name);
      if (!del)
        await this.adapter.extendObjectAsync(dp, obj);
      const stateType = obj && obj.common && obj.common.type;
      node = this.setdb(dp, obj.type, void 0, stateType, true, Date.now(), obj);
    } else if (node.init && obj) {
      if (typeof obj.common.name == "string")
        obj.common.name = await this.getTranslationObj(obj.common.name);
      if (!del)
        await this.adapter.extendObjectAsync(dp, obj);
    }
    if (obj && obj.type !== "state")
      return;
    if (node)
      this.setdb(dp, node.type, val, node.stateTyp, true);
    if (node && (this.defaults.updateStateOnChangeOnly || node.val != val || !node.ack)) {
      const typ = obj && obj.common && obj.common.type || node.stateTyp;
      if (typ && typ != typeof val && val !== void 0)
        val = this.convertToType(val, typ);
      if (!del)
        await this.adapter.setStateAsync(dp, {
          val,
          ts: Date.now(),
          ack
        });
    }
  }
  setForbiddenDirs(dirs) {
    this.forbiddenDirs = this.forbiddenDirs.concat(dirs);
  }
  isDirAllowed(dp) {
    if (dp && dp.split(".").length <= 2)
      return true;
    for (const a in this.forbiddenDirs) {
      if (dp.search(new RegExp(this.forbiddenDirs[a], "g")) != -1) {
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
      if (filter && filter.filter((a) => dp.startsWith(a) || a.startsWith(dp)).length == 0)
        continue;
      if (hold.filter((a) => dp.startsWith(a) || a.startsWith(dp)).length > 0)
        continue;
      delete this.stateDataBase[dp];
      del.push(dp.split(".").slice(0, deep).join("."));
    }
    del = del.filter((item, pos, arr) => {
      return arr.indexOf(item) == pos;
    });
    for (const a in del) {
      await this.adapter.delObjectAsync(del[a], { recursive: true });
      this.log.debug(`Clean up tree delete: ${del[a]}`);
    }
  }
  cleandp(string, lowerCase = false, removePoints = false) {
    if (!string && typeof string != "string")
      return string;
    string = string.replace(this.adapter.FORBIDDEN_CHARS, "_");
    if (removePoints)
      string = string.replace(/[^0-9A-Za-z_-]/gu, "_");
    else
      string = string.replace(/[^0-9A-Za-z\._-]/gu, "_");
    return lowerCase ? string.toLowerCase() : string;
  }
  convertToType(value, type) {
    if (value === null)
      return null;
    if (type === void 0) {
      throw new Error("convertToType type undefined not allowed!");
    }
    if (value === void 0)
      value = "";
    const old_type = typeof value;
    let newValue = typeof value == "object" ? JSON.stringify(value) : value;
    if (type !== old_type) {
      switch (type) {
        case "string":
          newValue = value.toString() || "";
          break;
        case "number":
          newValue = value ? parseFloat(value) : 0;
          break;
        case "boolean":
          newValue = !!value;
          break;
        case "array":
        case "json":
          break;
      }
    }
    return newValue;
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
    for (const d of data)
      await d.delete();
  }
  cloneObject(obj) {
    if (typeof obj !== "object") {
      this.log.error(`Error clone object target is type: ${typeof obj}`);
      return obj;
    }
    return JSON.parse(JSON.stringify(obj));
  }
  cloneGenericObject(obj) {
    if (typeof obj !== "object") {
      this.log.error(`Error clone object target is type: ${typeof obj}`);
      return obj;
    }
    return JSON.parse(JSON.stringify(obj));
  }
  async fileExistAsync(file) {
    if (await import_fs.default.existsSync(`./admin/${file}`))
      return true;
    return false;
  }
  async initStates(states) {
    if (!states)
      return;
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
          states[state] && states[state].val ? states[state].val : void 0,
          obj && obj.common && obj.common.type ? obj.common.type : void 0,
          states[state] && states[state].ack,
          states[state] && states[state].ts ? states[state].ts : Date.now(),
          obj == null ? void 0 : obj,
          true
        );
      } else {
        if (!removedChannels.every((a) => !dp.startsWith(a)))
          continue;
        const channel = dp.split(".").slice(0, 4).join(".");
        removedChannels.push(channel);
        await this.adapter.delObjectAsync(channel, { recursive: true });
        this.log.debug("Delete channel with dp:" + channel);
      }
    }
  }
  async garbageColleting(prefix, offset = 2e3, del = false) {
    if (!prefix)
      return;
    if (this.stateDataBase) {
      for (const id in this.stateDataBase) {
        if (id.startsWith(prefix)) {
          const state = this.stateDataBase[id];
          if (!state || state.val == void 0)
            continue;
          if (state.ts < Date.now() - offset) {
            if (del) {
              await this.cleanUpTree([], [id], -1);
              continue;
            }
            let newVal;
            switch (state.stateTyp) {
              case "string":
                if (typeof state.val == "string") {
                  if (state.val.startsWith("{") && state.val.endsWith("}"))
                    newVal = "{}";
                  else if (state.val.startsWith("[") && state.val.endsWith("]"))
                    newVal = "[]";
                  else
                    newVal = "";
                } else
                  newVal = "";
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
    if (this.language)
      return this.language;
    return "en-En";
  }
  getTranslation(key) {
    if (this.translation[key] !== void 0)
      return this.translation[key];
    return key;
  }
  existTranslation(key) {
    return this.translation[key] !== void 0;
  }
  async getTranslationObj(key) {
    const language = [
      "en",
      "de",
      "ru",
      "pt",
      "nl",
      "fr",
      "it",
      "es",
      "pl",
      "uk",
      "zh-cn"
    ];
    const result = {};
    for (const l of language) {
      try {
        const i = await Promise.resolve().then(() => __toESM(require(`../../admin/i18n/${l}/translations.json`)));
        if (i[key] !== void 0)
          result[l] = i[key];
      } catch (error) {
        return key;
      }
    }
    if (result["en"] == void 0)
      return key;
    return result;
  }
  async setLanguage(language, force = false) {
    if (!language)
      language = "en";
    if (force || this.language != language) {
      try {
        this.translation = await Promise.resolve().then(() => __toESM(require(`../../admin/i18n/${language}/translations.json`)));
        this.language = language;
        return true;
      } catch (error) {
        this.log.error(`Language ${language} not exist!`);
      }
    }
    return false;
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
  convertSpeakDate(text, noti = "", day = false) {
    if (!text || typeof text !== `string`)
      return ``;
    const b = text.split(`.`);
    if (day) {
      b[0] = b[0].split(" ")[2];
    }
    return " " + (new Date(`${b[1]}/${b[0]}/${new Date().getFullYear()}`).toLocaleString(this.language, {
      weekday: day ? "long" : void 0,
      day: "numeric",
      month: `long`
    }) + " ").replace(/([0-9]+\.)/gu, (x) => {
      const result = this.getTranslation(x + noti);
      if (result != x + noti)
        return result;
      return this.getTranslation(x);
    });
  }
}
async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseClass,
  Library,
  sleep
});
//# sourceMappingURL=library.js.map
