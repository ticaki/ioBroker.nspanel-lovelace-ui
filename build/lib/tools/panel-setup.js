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
var panel_setup_exports = {};
__export(panel_setup_exports, {
  SCRIPT_END_STOP_TOKEN: () => SCRIPT_END_STOP_TOKEN,
  duplicatePanelIdIndexes: () => duplicatePanelIdIndexes,
  matchPanelForSetup: () => matchPanelForSetup,
  migrateScriptConfigTopic: () => migrateScriptConfigTopic,
  panelIndexForMqttClient: () => panelIndexForMqttClient,
  replacePanelTopicInScript: () => replacePanelTopicInScript
});
module.exports = __toCommonJS(panel_setup_exports);
function matchPanelForSetup(panels, macId, topic, name, normalizeName) {
  const isSameDevice = (p) => p.kind !== "web" && p.id === macId;
  const conflictIndex = panels.findIndex((p) => p.topic === topic && !isSameDevice(p));
  if (conflictIndex !== -1) {
    return { error: "sendToTopicInUse", conflictIndex };
  }
  const wanted = normalizeName(name);
  const nameConflictIndex = panels.findIndex((p) => !!p.name && !isSameDevice(p) && normalizeName(p.name) === wanted);
  if (nameConflictIndex !== -1) {
    return { error: "sendToNameInUse", conflictIndex: nameConflictIndex };
  }
  const index = panels.findIndex(isSameDevice);
  return index === -1 ? { isNew: true, index: -1 } : { isNew: false, index };
}
function duplicatePanelIdIndexes(panels) {
  const seen = /* @__PURE__ */ new Set();
  const duplicates = [];
  panels.forEach((p, i) => {
    if (!(p == null ? void 0 : p.id)) {
      return;
    }
    if (seen.has(p.id)) {
      duplicates.push(i);
    } else {
      seen.add(p.id);
    }
  });
  return duplicates;
}
const SCRIPT_END_STOP_TOKEN = "*  END STOP END STOP END - No more configuration - END STOP END STOP END       *";
function replacePanelTopicInScript(source, oldTopic, newTopic) {
  if (!oldTopic || oldTopic === newTopic) {
    return { source, count: 0 };
  }
  const end = source.indexOf(SCRIPT_END_STOP_TOKEN);
  const head = end === -1 ? source : source.substring(0, end);
  const tail = end === -1 ? "" : source.substring(end);
  const pattern = /(?<![\w$])(["']?)panelTopic\1(\s*:\s*)(["'`])((?:(?!\3)[^\\\n])*)\3/g;
  let count = 0;
  const lines = head.split("\n").map((line) => {
    if (line.trimStart().startsWith("//")) {
      return line;
    }
    return line.replace(pattern, (match, keyQuote, colon, quote, value) => {
      if (value.trim() !== oldTopic) {
        return match;
      }
      count++;
      const escaped = newTopic.replaceAll("\\", "\\\\").replaceAll(quote, `\\${quote}`);
      return `${keyQuote}panelTopic${keyQuote}${colon}${quote}${escaped}${quote}`;
    });
  });
  return count === 0 ? { source, count } : { source: lines.join("\n") + tail, count };
}
function migrateScriptConfigTopic(native, oldTopic, newTopic, script) {
  const result = { moved: 0, dropped: 0 };
  const isEntry = (value) => !!value && typeof value === "object" && !Array.isArray(value);
  const sameTopic = oldTopic === newTopic;
  const renames = (entry) => !!script && entry.scriptName === script.from;
  const moveList = (list, key) => {
    if (!Array.isArray(list) || !list.some((e) => isEntry(e) && e[key] === oldTopic && (!sameTopic || renames(e)))) {
      return void 0;
    }
    const out = [];
    for (const entry of list) {
      if (!sameTopic && isEntry(entry) && entry[key] === newTopic) {
        result.dropped++;
        continue;
      }
      if (isEntry(entry) && entry[key] === oldTopic) {
        result.moved++;
        const moved = { ...entry, [key]: newTopic };
        if (script && renames(entry)) {
          moved.scriptName = script.to;
        }
        out.push(moved);
        continue;
      }
      out.push(entry);
    }
    return out;
  };
  if (!oldTopic || !newTopic || sameTopic && !script) {
    return result;
  }
  result.scriptConfigRaw = moveList(native.scriptConfigRaw, "panelTopic");
  result.scriptConfig = moveList(native.scriptConfig, "topic");
  return result;
}
function panelIndexForMqttClient(clientId, panels) {
  const exact = [];
  panels.forEach((p, i) => {
    if (p.isVirtual || !p.clientName || clientId.length !== p.clientName.length + 7) {
      return;
    }
    if (clientId.startsWith(`${p.clientName}-`) && /^[0-9a-f]{6}$/i.test(clientId.slice(-6))) {
      exact.push(i);
    }
  });
  if (exact.length > 0) {
    const hex = clientId.slice(-6).toLowerCase();
    const byMac = exact.find(
      (i) => panels[i].macId.replace(/[^0-9a-f]/gi, "").toLowerCase().endsWith(hex)
    );
    return byMac != null ? byMac : exact[0];
  }
  return panels.findIndex((p) => !p.isVirtual && clientId.startsWith(p.clientName));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SCRIPT_END_STOP_TOKEN,
  duplicatePanelIdIndexes,
  matchPanelForSetup,
  migrateScriptConfigTopic,
  panelIndexForMqttClient,
  replacePanelTopicInScript
});
//# sourceMappingURL=panel-setup.js.map
