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
var page_states_exports = {};
__export(page_states_exports, {
  collectPageStates: () => collectPageStates,
  emptyStateNode: () => emptyStateNode,
  mergeStateInfo: () => mergeStateInfo
});
module.exports = __toCommonJS(page_states_exports);
const minChannelSegments = 3;
function collectStateIds(node, found) {
  if (node === null || typeof node !== "object") {
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "dp" && typeof value === "string" && value) {
      found.add(value);
    } else {
      collectStateIds(value, found);
    }
  }
}
function constOf(field) {
  if (!field || typeof field !== "object") {
    return void 0;
  }
  const item = field;
  return item.type === "const" && typeof item.constVal === "string" ? item.constVal : void 0;
}
function commonChannel(ids) {
  const segments = ids[0].split(".");
  let shared = segments.length;
  for (const id of ids.slice(1)) {
    const other = id.split(".");
    let i = 0;
    while (i < shared && i < other.length && segments[i] === other[i]) {
      i++;
    }
    shared = i;
  }
  return shared >= minChannelSegments ? segments.slice(0, shared).join(".") : "";
}
function emptyStateNode(id, isChannel) {
  return { id, isChannel, roles: [], types: [], states: [], headlines: [], iconsTrue: [], iconsFalse: [] };
}
function collectPageStates(sources) {
  const nodes = /* @__PURE__ */ new Map();
  const addTo = (list, value) => {
    if (typeof value === "string" && value && !list.includes(value)) {
      list.push(value);
    }
  };
  const add = (id, isChannel, source, used) => {
    var _a, _b, _c, _d, _e, _f, _g;
    let node = nodes.get(id);
    if (!node) {
      node = emptyStateNode(id, isChannel);
      nodes.set(id, node);
    }
    node.isChannel = node.isChannel || isChannel;
    addTo(node.roles, source.role);
    addTo(node.types, source.type);
    addTo(node.headlines, constOf((_a = source.data) == null ? void 0 : _a.headline));
    addTo(node.iconsTrue, constOf((_d = (_c = (_b = source.data) == null ? void 0 : _b.icon) == null ? void 0 : _c.true) == null ? void 0 : _d.value));
    addTo(node.iconsFalse, constOf((_g = (_f = (_e = source.data) == null ? void 0 : _e.icon) == null ? void 0 : _f.false) == null ? void 0 : _g.value));
    for (const state of used) {
      addTo(node.states, state);
    }
  };
  for (const source of sources) {
    if (!(source == null ? void 0 : source.data)) {
      continue;
    }
    const found = /* @__PURE__ */ new Set();
    collectStateIds(source.data, found);
    const ids = [...found];
    if (ids.length === 0) {
      continue;
    }
    if (ids.length === 1) {
      add(ids[0], false, source, []);
      continue;
    }
    const channel = commonChannel(ids);
    if (channel) {
      add(
        channel,
        true,
        source,
        ids.map((id) => id.slice(channel.length + 1))
      );
    } else {
      for (const id of ids) {
        add(id, false, source, []);
      }
    }
  }
  return [...nodes.values()];
}
function mergeStateInfo(known, state) {
  var _a, _b, _c, _d, _e, _f;
  const merged = {
    roles: [...(_a = known == null ? void 0 : known.roles) != null ? _a : []],
    types: [...(_b = known == null ? void 0 : known.types) != null ? _b : []],
    states: [...(_c = known == null ? void 0 : known.states) != null ? _c : []],
    headlines: [...(_d = known == null ? void 0 : known.headlines) != null ? _d : []],
    iconsTrue: [...(_e = known == null ? void 0 : known.iconsTrue) != null ? _e : []],
    iconsFalse: [...(_f = known == null ? void 0 : known.iconsFalse) != null ? _f : []]
  };
  for (const [target, values] of [
    [merged.roles, state.roles],
    [merged.types, state.types],
    [merged.states, state.states],
    [merged.headlines, state.headlines],
    [merged.iconsTrue, state.iconsTrue],
    [merged.iconsFalse, state.iconsFalse]
  ]) {
    for (const value of values) {
      if (value && !target.includes(value)) {
        target.push(value);
      }
    }
  }
  return merged;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  collectPageStates,
  emptyStateNode,
  mergeStateInfo
});
//# sourceMappingURL=page-states.js.map
