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
var page_dump_exports = {};
__export(page_dump_exports, {
  buildPageDump: () => buildPageDump,
  findGlobalPage: () => findGlobalPage,
  findScriptPage: () => findScriptPage,
  scriptConfigOfPanel: () => scriptConfigOfPanel,
  scriptScreensaverSection: () => scriptScreensaverSection,
  stripRuntimeSecrets: () => stripRuntimeSecrets,
  toPlainJson: () => toPlainJson
});
module.exports = __toCommonJS(page_dump_exports);
var import_panelConfigExport = require("../types/panelConfigExport");
var import_pageDump = require("../types/pageDump");
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function toPlainJson(value, seen = /* @__PURE__ */ new WeakSet()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value !== "object") {
    return void 0;
  }
  if (value instanceof RegExp) {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (seen.has(value)) {
    return "[circular]";
  }
  seen.add(value);
  let out;
  if (Array.isArray(value)) {
    out = value.map((item) => {
      const copy = toPlainJson(item, seen);
      return copy === void 0 ? null : copy;
    });
  } else {
    const obj = {};
    for (const [key, item] of Object.entries(value)) {
      const copy = toPlainJson(item, seen);
      if (copy !== void 0) {
        obj[key] = copy;
      }
    }
    out = obj;
  }
  seen.delete(value);
  return out;
}
function stripRuntimeSecrets(config) {
  if (!isRecord(config) || !isRecord(config.data)) {
    return [];
  }
  const data = config.data;
  const field = config.card === "cardAlarm" ? "pin" : config.card === "cardQR" ? "password" : void 0;
  if (!field) {
    return [];
  }
  const entry = data[field];
  if (!isRecord(entry) || entry.type !== "const") {
    return [];
  }
  const val = entry.constVal;
  if (val === void 0 || val === null || val === "" || val === -1 || val === "-1") {
    return [];
  }
  delete data[field];
  return [field];
}
function findScriptPage(scriptConfig, name) {
  if (!isRecord(scriptConfig)) {
    return void 0;
  }
  for (const list of ["pages", "subPages"]) {
    const entries = scriptConfig[list];
    if (!Array.isArray(entries)) {
      continue;
    }
    const hit = entries.find(
      (p) => isRecord(p) && p.uniqueName === name && p.globalLink == null
    );
    if (hit) {
      return { list, page: hit };
    }
  }
  return void 0;
}
function findGlobalPage(scriptConfig, globalConfig, name) {
  let link;
  if (isRecord(scriptConfig)) {
    for (const list of ["pages", "subPages"]) {
      const entries = scriptConfig[list];
      if (!Array.isArray(entries) || link) {
        continue;
      }
      link = entries.find(
        (p) => isRecord(p) && typeof p.globalLink === "string" && (typeof p.uniqueName === "string" && p.uniqueName ? p.uniqueName : p.globalLink) === name
      );
    }
  }
  const globalName = link && typeof link.globalLink === "string" ? link.globalLink : name;
  const subPages = isRecord(globalConfig) && Array.isArray(globalConfig.subPages) ? globalConfig.subPages : [];
  const page = subPages.find((p) => isRecord(p) && p.uniqueName === globalName);
  if (!link && !page) {
    return void 0;
  }
  const out = {};
  if (link) {
    out.link = link;
  }
  if (page) {
    out.page = page;
  }
  return out;
}
function scriptScreensaverSection(scriptConfig) {
  if (!isRecord(scriptConfig)) {
    return void 0;
  }
  const out = {};
  for (const [key, value] of Object.entries(scriptConfig)) {
    if (key.endsWith("ScreensaverEntity") || key === "weatherEntity" || key === "weatherAddDefaultItems") {
      out[key] = value;
    }
  }
  return out;
}
function scriptConfigOfPanel(scriptConfigRaw, topic) {
  if (!Array.isArray(scriptConfigRaw)) {
    return void 0;
  }
  return scriptConfigRaw.find((c) => isRecord(c) && c.panelTopic === topic);
}
function adminPageStored(native, name, topic) {
  var _a;
  const entry = ((_a = native.pageConfig) != null ? _a : []).find((p) => !!p && p.uniqueName === name);
  if (!entry) {
    return void 0;
  }
  const { page, stripped } = (0, import_panelConfigExport.stripPageForExport)(entry);
  if (entry.navigationAssignment !== void 0) {
    page.navigationAssignment = structuredClone(entry.navigationAssignment);
  }
  const out = { page };
  const assignment = (0, import_panelConfigExport.effectivePageAssignment)(entry, topic);
  if (assignment) {
    out.assignment = assignment;
  }
  if (stripped.length) {
    out.strippedSecrets = stripped;
  }
  return out;
}
function buildStored(input) {
  var _a, _b;
  const { runtime, panel, native } = input;
  const scriptConfig = panel.noScript ? void 0 : scriptConfigOfPanel(input.scriptConfigRaw, panel.topic);
  const out = {};
  if (runtime.kind === "screensaver") {
    if (runtime.origin === "admin") {
      out.admin = (0, import_panelConfigExport.exportScreensaverOfPanel)(native, panel.topic);
    } else {
      const section = scriptScreensaverSection(scriptConfig);
      if (section) {
        out.script = section;
      }
    }
    return out;
  }
  if (runtime.origin === "admin") {
    const admin = adminPageStored(native, (_a = runtime.adminPageName) != null ? _a : runtime.name, panel.topic);
    if (admin) {
      out.admin = admin;
    }
  } else if (runtime.origin === "script") {
    const hit = findScriptPage(scriptConfig, runtime.name);
    if (hit) {
      out.script = hit;
    }
  } else if (runtime.origin === "global") {
    const hit = findGlobalPage(scriptConfig, input.globalConfigRaw, runtime.name);
    if (hit) {
      out.global = hit;
    }
  }
  const override = ((_b = native.navigationOverrides) != null ? _b : []).find(
    (o) => o && o.panelTopic === panel.topic && o.page === runtime.name
  );
  if (override) {
    out.navigationOverride = override;
  }
  return out;
}
function buildPageDump(input) {
  var _a;
  const { runtime, panel } = input;
  const stored = toPlainJson(buildStored(input));
  const config = toPlainJson(runtime.config);
  const strippedRuntime = stripRuntimeSecrets(config);
  const runtimeOut = {
    name: runtime.name,
    card: runtime.card
  };
  for (const key of ["adminPageName", "generated", "hidden", "alwaysOn", "mode", "navigation"]) {
    if (runtime[key] !== void 0) {
      runtimeOut[key] = toPlainJson(runtime[key]);
    }
  }
  runtimeOut.config = config != null ? config : null;
  runtimeOut.pageItems = (_a = toPlainJson(runtime.pageItems)) != null ? _a : [];
  if (strippedRuntime.length) {
    runtimeOut.strippedSecrets = strippedRuntime;
  }
  const out = {
    format: import_pageDump.PAGE_DUMP_FORMAT,
    version: import_pageDump.PAGE_DUMP_VERSION
  };
  if (input.adapterVersion) {
    out.adapterVersion = input.adapterVersion;
  }
  out.createdAt = input.now.toISOString();
  out.panel = {
    topic: panel.topic,
    name: panel.name,
    model: panel.model,
    kind: panel.kind,
    noScript: panel.noScript
  };
  out.page = { name: runtime.name, kind: runtime.kind, card: runtime.card, origin: runtime.origin };
  out.stored = stored;
  out.runtime = runtimeOut;
  return out;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildPageDump,
  findGlobalPage,
  findScriptPage,
  scriptConfigOfPanel,
  scriptScreensaverSection,
  stripRuntimeSecrets,
  toPlainJson
});
//# sourceMappingURL=page-dump.js.map
