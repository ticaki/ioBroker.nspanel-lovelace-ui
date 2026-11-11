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
var test_states_exports = {};
__export(test_states_exports, {
  CREATE_TEST_STATES_COMMAND: () => CREATE_TEST_STATES_COMMAND,
  buildTestObjects: () => buildTestObjects,
  createTestObjects: () => createTestObjects,
  isTestStatesFile: () => isTestStatesFile,
  parseTestStatesFile: () => parseTestStatesFile,
  resolveTestValue: () => resolveTestValue,
  validateTestStates: () => validateTestStates
});
module.exports = __toCommonJS(test_states_exports);
var import_config_manager_const = require("../const/config-manager-const");
const CREATE_TEST_STATES_COMMAND = "createTestStates";
function isStateDefinition(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function datapointsOf(role) {
  if (!(role in import_config_manager_const.requiredScriptDataPoints)) {
    return void 0;
  }
  const entry = import_config_manager_const.requiredScriptDataPoints[role];
  return entry.data;
}
function resolveTestValue(val, now) {
  if (typeof val !== "string") {
    return val;
  }
  const units = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 };
  const ts = /^\{\{ts:([+-]\d+)([smhd])\}\}$/.exec(val);
  if (ts) {
    return now + Number(ts[1]) * units[ts[2]];
  }
  return val.replace(/\{\{date:([+-]\d+)d\}\}/g, (_match, days) => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + Number(days));
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`;
  });
}
function typeOfValue(val) {
  switch (typeof val) {
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "string":
      return "string";
    default:
      return "mixed";
  }
}
function chooseRoles(definitions, names, overrides) {
  var _a, _b, _c, _d;
  const result = {};
  const used = /* @__PURE__ */ new Set();
  for (const name of names) {
    const role = (_b = overrides[name]) != null ? _b : (_a = definitions[name]) == null ? void 0 : _a.role;
    if (typeof role === "string") {
      result[name] = role;
      used.add(role);
    }
  }
  for (const name of names) {
    if (result[name]) {
      continue;
    }
    const roles = (_c = definitions[name]) == null ? void 0 : _c.role;
    const list = Array.isArray(roles) ? roles : ["state"];
    const role = (_d = list.find((r) => !used.has(r))) != null ? _d : list[0];
    result[name] = role;
    used.add(role);
  }
  return result;
}
function stateCommon(def, name, role, type, write) {
  const common = { name, role, type, read: true, write };
  if (def.unit !== void 0) {
    common.unit = def.unit;
  }
  if (def.min !== void 0) {
    common.min = def.min;
  }
  if (def.max !== void 0) {
    common.max = def.max;
  }
  if (def.step !== void 0) {
    common.step = def.step;
  }
  if (def.states !== void 0) {
    common.states = def.states;
  }
  return common;
}
function folderObjects(root, ids, known) {
  const result = [];
  const seen = /* @__PURE__ */ new Set();
  const rootParts = root.split(".").length;
  for (const id of ids) {
    const parts = id.split(".");
    for (let i = rootParts; i < parts.length; i++) {
      const parent = parts.slice(0, i).join(".");
      if (seen.has(parent) || known.has(parent)) {
        continue;
      }
      seen.add(parent);
      result.push({
        id: parent,
        obj: { type: "folder", common: { name: parts[i - 1] }, native: {} }
      });
    }
  }
  return result;
}
function validateTestStates(data) {
  const problems = [];
  const ids = /* @__PURE__ */ new Set();
  for (const channel of data.channels) {
    if (ids.has(channel.id)) {
      problems.push(`${channel.id}: duplicate id`);
    }
    ids.add(channel.id);
    const definitions = datapointsOf(channel.role);
    if (!definitions) {
      problems.push(`${channel.id}: unknown channel role ${channel.role}`);
      continue;
    }
    for (const [dp, def] of Object.entries(definitions)) {
      const required = def.required === true;
      if (required && !(dp in channel.states)) {
        problems.push(`${channel.id}: required datapoint ${dp} missing`);
      }
    }
    for (const [dp, entry] of Object.entries(channel.states)) {
      const known = definitions[dp];
      const override = isStateDefinition(entry) ? entry : void 0;
      if (!known && !((override == null ? void 0 : override.role) && override.type)) {
        problems.push(`${channel.id}.${dp}: not a datapoint of ${channel.role} and no role/type given`);
      }
    }
  }
  for (const state of data.states) {
    if (ids.has(state.id)) {
      problems.push(`${state.id}: duplicate id`);
    }
    ids.add(state.id);
  }
  return problems;
}
function buildTestObjects(data, now = Date.now()) {
  var _a, _b, _c, _d, _e, _f;
  const userdata = [];
  const alias = [];
  for (const channel of data.channels) {
    const definitions = (_a = datapointsOf(channel.role)) != null ? _a : {};
    const names = Object.keys(channel.states);
    const overrides = {};
    for (const name of names) {
      const entry = channel.states[name];
      overrides[name] = isStateDefinition(entry) ? entry.role : void 0;
    }
    const roles = chooseRoles(definitions, names, overrides);
    const channelAlias = `${data.alias}.${channel.id}`;
    alias.push({
      id: channelAlias,
      obj: { type: "channel", common: { name: channel.name, role: channel.role }, native: {} }
    });
    for (const name of names) {
      const entry = channel.states[name];
      const def = isStateDefinition(entry) ? entry : { val: entry };
      const val = resolveTestValue(def.val, now);
      const known = definitions[name];
      const knownType = known && !Array.isArray(known.type) ? known.type : void 0;
      const type = (_c = (_b = def.type) != null ? _b : knownType) != null ? _c : typeOfValue(val);
      const write = (_d = def.write) != null ? _d : (known == null ? void 0 : known.writeable) === true;
      const stateName = (_e = def.name) != null ? _e : `${channel.name} ${name}`;
      const target = `${data.userdata}.${channel.id}.${name}`;
      userdata.push({
        id: target,
        obj: { type: "state", common: stateCommon(def, stateName, roles[name], type, true), native: {} },
        val
      });
      const aliasCommon = stateCommon(def, stateName, roles[name], type, write);
      aliasCommon.alias = { id: target };
      alias.push({ id: `${channelAlias}.${name}`, obj: { type: "state", common: aliasCommon, native: {} } });
    }
  }
  for (const state of data.states) {
    userdata.push({
      id: `${data.userdata}.${state.id}`,
      obj: {
        type: "state",
        common: stateCommon(state, state.name, state.role, state.type, (_f = state.write) != null ? _f : true),
        native: {}
      },
      val: resolveTestValue(state.val, now)
    });
  }
  const userdataIds = userdata.map((o) => o.id);
  const aliasIds = alias.map((o) => o.id);
  return [
    ...folderObjects(data.userdata, userdataIds, new Set(userdataIds)),
    ...userdata,
    ...folderObjects(data.alias, aliasIds, new Set(aliasIds)),
    ...alias
  ];
}
async function createTestObjects(target, objects, onError = () => void 0) {
  const result = { created: 0, skipped: 0, values: 0, failed: 0 };
  for (const entry of objects) {
    try {
      if (await target.getForeignObjectAsync(entry.id)) {
        result.skipped++;
        continue;
      }
      await target.setForeignObjectAsync(entry.id, entry.obj);
      result.created++;
      if (entry.obj.type === "state" && entry.val !== void 0) {
        await target.setForeignStateAsync(entry.id, entry.val, true);
        result.values++;
      }
    } catch (error) {
      result.failed++;
      onError(entry.id, error);
    }
  }
  return result;
}
function isTestStatesFile(data) {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const d = data;
  return typeof d.userdata === "string" && typeof d.alias === "string" && Array.isArray(d.channels) && Array.isArray(d.states) && d.channels.every(
    (c) => typeof c === "object" && c !== null && typeof c.id === "string" && typeof c.role === "string" && isStateDefinition(c.states)
  ) && d.states.every(
    (s) => isStateDefinition(s) && typeof s.id === "string" && typeof s.type === "string"
  );
}
function parseTestStatesFile(text) {
  const data = JSON.parse(text);
  if (!isTestStatesFile(data)) {
    throw new Error("test-states.json has an unexpected structure");
  }
  return data;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CREATE_TEST_STATES_COMMAND,
  buildTestObjects,
  createTestObjects,
  isTestStatesFile,
  parseTestStatesFile,
  resolveTestValue,
  validateTestStates
});
//# sourceMappingURL=test-states.js.map
