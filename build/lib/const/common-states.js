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
var common_states_exports = {};
__export(common_states_exports, {
  DEFAULT_CLIMATE_MODES: () => DEFAULT_CLIMATE_MODES,
  commonStatesToRecord: () => commonStatesToRecord,
  matchesStatesToken: () => matchesStatesToken,
  resolveStatesText: () => resolveStatesText,
  resolveStatesToken: () => resolveStatesToken,
  statesList: () => statesList,
  withCommonStates: () => withCommonStates
});
module.exports = __toCommonJS(common_states_exports);
const DEFAULT_CLIMATE_MODES = ["OFF", "AUTO", "COOL", "HEAT", "ECO", "FAN_ONLY", "DRY"];
const NUMERIC_KEY = /^-?\d+(\.\d+)?$/;
function commonStatesToRecord(states) {
  if (!states || typeof states === "string") {
    return null;
  }
  if (Array.isArray(states)) {
    const record = {};
    states.forEach((text, index) => record[String(index)] = text);
    return record;
  }
  return states;
}
function resolveStatesText(states, val, keepValue) {
  const record = commonStatesToRecord(states);
  let text = void 0;
  if (record && (val === null || typeof val !== "object")) {
    const key = String(val);
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      text = record[key];
    }
  }
  if (keepValue) {
    return text || val;
  }
  return text;
}
function statesList(states, part) {
  const record = commonStatesToRecord(states);
  if (!record) {
    return [];
  }
  return part === "keys" ? Object.keys(record).map(String) : Object.values(record).map(String);
}
function isStatesList(states) {
  return Array.isArray(states);
}
function resolveStatesToken(token, states, stateType) {
  if (isStatesList(states)) {
    const position = states.indexOf(token);
    if (position === -1) {
      return void 0;
    }
    return stateType === "string" ? token : position;
  }
  if (states && typeof states === "object") {
    for (const key of Object.keys(states)) {
      if (states[key] === token) {
        return stateType !== "string" && NUMERIC_KEY.test(key) ? Number(key) : key;
      }
    }
    if (states[token] !== void 0) {
      return token;
    }
  }
  return void 0;
}
function matchesStatesToken(val, resolved) {
  return val == resolved;
}
function withCommonStates(item, commonStates) {
  if (item.type !== "state" && item.type !== "triggered") {
    return void 0;
  }
  const result = { ...item, commonStates };
  delete result.read;
  if (commonStates.mode === "token") {
    delete result.write;
  }
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_CLIMATE_MODES,
  commonStatesToRecord,
  matchesStatesToken,
  resolveStatesText,
  resolveStatesToken,
  statesList,
  withCommonStates
});
//# sourceMappingURL=common-states.js.map
