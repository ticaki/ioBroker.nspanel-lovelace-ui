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
var panelConfigImport_exports = {};
__export(panelConfigImport_exports, {
  SCREENSAVER_CHOICE_KEY: () => SCREENSAVER_CHOICE_KEY,
  applyPanelImport: () => applyPanelImport,
  configDiff: () => configDiff,
  danglingNavigation: () => danglingNavigation,
  importSecretPages: () => importSecretPages,
  navigationDiff: () => navigationDiff,
  panelConfiguredGroups: () => panelConfiguredGroups,
  panelImportChanges: () => panelImportChanges,
  panelOverwriteSummary: () => panelOverwriteSummary,
  panelSettingDefaults: () => panelSettingDefaults,
  parsePanelConfigImport: () => parsePanelConfigImport,
  planPanelImport: () => planPanelImport,
  plannedPageContent: () => plannedPageContent,
  plannedScreensaverContent: () => plannedScreensaverContent,
  remapPageReferences: () => remapPageReferences,
  sameConfig: () => sameConfig,
  samePage: () => samePage,
  scriptPagesFromMeta: () => scriptPagesFromMeta,
  splitImportGroups: () => splitImportGroups
});
module.exports = __toCommonJS(panelConfigImport_exports);
var import_adminShareConfig = require("./adminShareConfig");
var import_panelConfigExport = require("./panelConfigExport");
function isDict(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function isNavigationLinks(value) {
  return isDict(value) && Object.entries(value).every(
    ([k, v]) => ["next", "prev", "home", "parent"].includes(k) && (v === void 0 || typeof v === "string")
  );
}
function isButtonFunction(value) {
  return value === null || isDict(value) && typeof value.mode === "string";
}
function pagesGroupProblem(value) {
  if (!isDict(value) || !Array.isArray(value.pages)) {
    return "groups.pages";
  }
  const names = /* @__PURE__ */ new Set();
  for (const [i, p] of value.pages.entries()) {
    const where = `groups.pages.pages[${i}]`;
    if (!isDict(p) || !isDict(p.page)) {
      return where;
    }
    if (typeof p.page.uniqueName !== "string" || !p.page.uniqueName || typeof p.page.card !== "string") {
      return `${where}.page`;
    }
    if (names.has(p.page.uniqueName)) {
      return `${where}.page.uniqueName`;
    }
    names.add(p.page.uniqueName);
    if (p.assignment !== "own" && p.assignment !== "all" && p.assignment !== "none") {
      return `${where}.assignment`;
    }
    if (p.navigation !== void 0 && !isNavigationLinks(p.navigation)) {
      return `${where}.navigation`;
    }
    if (p.strippedSecrets !== void 0 && (!Array.isArray(p.strippedSecrets) || p.strippedSecrets.some((f) => f !== "pin" && f !== "qrPass"))) {
      return `${where}.strippedSecrets`;
    }
  }
  if (value.excludedAllPages !== void 0 && (!Array.isArray(value.excludedAllPages) || value.excludedAllPages.some((n) => typeof n !== "string"))) {
    return "groups.pages.excludedAllPages";
  }
  return void 0;
}
function screensaverGroupProblem(value) {
  if (!isDict(value) || !Array.isArray(value.notify)) {
    return "groups.screensaver";
  }
  const entry = value.entry;
  if (entry !== null) {
    if (!isDict(entry) || typeof entry.name !== "string" || typeof entry.mode !== "string") {
      return "groups.screensaver.entry";
    }
    for (const area of ["left", "bottom", "indicator"]) {
      if (entry[area] !== void 0 && !Array.isArray(entry[area])) {
        return `groups.screensaver.entry.${area}`;
      }
    }
    if (entry.notify !== void 0 && (!Array.isArray(entry.notify) || entry.notify.some((n) => typeof n !== "string"))) {
      return "groups.screensaver.entry.notify";
    }
  }
  for (const [i, n] of value.notify.entries()) {
    if (!isDict(n) || typeof n.id !== "string" || !Array.isArray(n.enabled)) {
      return `groups.screensaver.notify[${i}]`;
    }
  }
  return void 0;
}
function miscGroupProblem(value) {
  if (!isDict(value) || !Array.isArray(value.navigationOverrides) || !isDict(value.states)) {
    return "groups.misc";
  }
  for (const key of ["buttonLeft", "buttonRight"]) {
    if (key in value && value[key] !== void 0 && !isButtonFunction(value[key])) {
      return `groups.misc.${key}`;
    }
  }
  if (value.noScript !== void 0 && typeof value.noScript !== "boolean") {
    return "groups.misc.noScript";
  }
  for (const [i, o] of value.navigationOverrides.entries()) {
    if (!isDict(o) || typeof o.page !== "string" || !isNavigationLinks(o.navigation)) {
      return `groups.misc.navigationOverrides[${i}]`;
    }
  }
  for (const [k, v] of Object.entries(value.states)) {
    if (typeof v !== "boolean" && typeof v !== "number" && typeof v !== "string") {
      return `groups.misc.states.${k}`;
    }
  }
  return void 0;
}
function parsePanelConfigImport(text) {
  var _a, _b, _c;
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: { key: "importErrorJson", detail: e instanceof Error ? e.message : String(e) } };
  }
  if (!isDict(json) || json.format !== import_panelConfigExport.PANEL_CONFIG_FORMAT) {
    return { ok: false, error: { key: "importErrorFormat" } };
  }
  if (typeof json.version !== "number" || !Number.isInteger(json.version) || json.version < 1) {
    return { ok: false, error: { key: "importErrorStructure", detail: "version" } };
  }
  if (json.version > import_panelConfigExport.PANEL_CONFIG_VERSION) {
    return { ok: false, error: { key: "importErrorVersion", detail: String(json.version) } };
  }
  const source = json.source;
  if (!isDict(source) || typeof source.topic !== "string" || typeof source.model !== "string") {
    return { ok: false, error: { key: "importErrorStructure", detail: "source" } };
  }
  if (!isDict(json.groups)) {
    return { ok: false, error: { key: "importErrorStructure", detail: "groups" } };
  }
  const groups = json.groups;
  const problem = (_b = (_a = groups.pages !== void 0 ? pagesGroupProblem(groups.pages) : void 0) != null ? _a : groups.screensaver !== void 0 ? screensaverGroupProblem(groups.screensaver) : void 0) != null ? _b : groups.misc !== void 0 ? miscGroupProblem(groups.misc) : void 0;
  if (problem) {
    return { ok: false, error: { key: "importErrorStructure", detail: problem } };
  }
  const file = {
    format: import_panelConfigExport.PANEL_CONFIG_FORMAT,
    version: json.version,
    secretsIncluded: json.secretsIncluded === true,
    exportedAt: typeof json.exportedAt === "string" ? json.exportedAt : "",
    source: {
      id: typeof source.id === "string" ? source.id : "",
      topic: source.topic,
      name: typeof source.name === "string" ? source.name : "",
      model: source.model,
      kind: source.kind === "web" ? "web" : "tasmota"
    },
    groups: {}
  };
  if (typeof json.adapterVersion === "string") {
    file.adapterVersion = json.adapterVersion;
  }
  if (groups.pages !== void 0) {
    const pages = structuredClone(groups.pages);
    pages.excludedAllPages = (_c = pages.excludedAllPages) != null ? _c : [];
    file.groups.pages = pages;
  }
  if (groups.screensaver !== void 0) {
    file.groups.screensaver = structuredClone(groups.screensaver);
  }
  if (groups.misc !== void 0) {
    file.groups.misc = structuredClone(groups.misc);
  }
  return { ok: true, file };
}
function splitImportGroups(file, selected) {
  const present = import_panelConfigExport.panelConfigGroups.filter((g) => selected.includes(g) && file.groups[g] !== void 0);
  const missing = import_panelConfigExport.panelConfigGroups.filter((g) => selected.includes(g) && file.groups[g] === void 0);
  return { present, missing };
}
const panelSettingDefaults = {
  activated: true,
  tempOffset: 0,
  isBuzzerAllowed: true,
  hideCards: false,
  detachLeft: false,
  detachRight: false,
  "screenSaver.timeout": 15,
  "screenSaver.doubleClick": true,
  "screenSaver.infoIcon": "",
  "dim.standby": 15,
  "dim.active": 80,
  "dim.dayMode": true,
  "dim.nightStandby": 0,
  "dim.nightActive": 30,
  "dim.nightHourStart": 22,
  "dim.nightHourEnd": 7,
  "dim.schedule": true
};
function scriptPageName(page) {
  if (!isDict(page)) {
    return void 0;
  }
  if (typeof page.uniqueName === "string" && page.uniqueName) {
    return page.uniqueName;
  }
  if (typeof page.uniqueID === "string" && page.uniqueID) {
    return page.uniqueID;
  }
  return typeof page.globalLink === "string" && page.globalLink ? page.globalLink : void 0;
}
function scriptPagesFromMeta(metaNative, topic) {
  const native = isDict(metaNative) ? metaNative : {};
  const global = [];
  const globalRaw = native.globalConfigRaw;
  if (isDict(globalRaw) && globalRaw.type === "globalConfig" && Array.isArray(globalRaw.subPages)) {
    for (const p of globalRaw.subPages) {
      const name = scriptPageName(p);
      if (name && !global.includes(name)) {
        global.push(name);
      }
    }
  }
  const raw = Array.isArray(native.scriptConfigRaw) ? native.scriptConfigRaw.find((r) => isDict(r) && r.panelTopic === topic) : void 0;
  const conv = Array.isArray(native.scriptConfig) ? native.scriptConfig.find((r) => isDict(r) && r.topic === topic) : void 0;
  const convPages = isDict(conv) && Array.isArray(conv.pages) ? conv.pages.filter((p) => !(isDict(p) && isDict(p.config) && String(p.config.card).startsWith("screensaver"))).map(scriptPageName).filter((n) => !!n && n !== "scr") : [];
  const globalIds = isDict(conv) && Array.isArray(conv.globalPageIds) ? conv.globalPageIds : [];
  let local = [];
  if (isDict(raw)) {
    for (const list of [raw.pages, raw.subPages]) {
      if (Array.isArray(list)) {
        local.push(...list.map(scriptPageName).filter((n) => !!n));
      }
    }
  } else {
    local = convPages.filter((n) => !globalIds.includes(n));
  }
  for (const n of convPages) {
    if (!local.includes(n) && !global.includes(n)) {
      global.push(n);
    }
  }
  return { panel: [...new Set(local)].filter((n) => !global.includes(n)), global };
}
function panelConfiguredGroups(native, topic, states) {
  var _a, _b, _c, _d;
  const out = [];
  if (((_a = native.pageConfig) != null ? _a : []).some((p) => {
    var _a2;
    return p && ((_a2 = p.navigationAssignment) != null ? _a2 : []).some((a) => a && a.topic === topic);
  })) {
    out.push("pages");
  }
  if (((_b = native.screensaverConfig) != null ? _b : []).some((e) => e && Array.isArray(e.panels) && e.panels.includes(topic))) {
    out.push("screensaver");
  }
  const panel = ((_c = native.panels) != null ? _c : []).find((p) => p && p.topic === topic);
  if (panel && (panel.buttonLeft !== void 0 || panel.buttonRight !== void 0 || !!panel.noScript) || ((_d = native.navigationOverrides) != null ? _d : []).some((o) => o && o.panelTopic === topic) || Object.entries(panelSettingDefaults).some(([id, def]) => states[id] !== void 0 && states[id] !== def)) {
    out.push("misc");
  }
  return out;
}
function canonical(value) {
  if (Array.isArray(value)) {
    return value.map((v) => v === void 0 ? null : canonical(v));
  }
  if (isDict(value)) {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] !== void 0) {
        out[key] = canonical(value[key]);
      }
    }
    return out;
  }
  return value;
}
function sameConfig(a, b) {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}
function comparablePage(page, ignore) {
  const copy = { ...page };
  delete copy.navigationAssignment;
  for (const field of ignore) {
    delete copy[field];
  }
  if (Array.isArray(copy.pageItems)) {
    copy.pageItems = copy.pageItems.map((item) => {
      if (!isDict(item)) {
        return item;
      }
      const rest = { ...item };
      delete rest.itemId;
      return rest;
    });
  }
  return copy;
}
function samePage(existing, imported, stripped = []) {
  return sameConfig(comparablePage(existing, stripped), comparablePage(imported, stripped));
}
function shortValue(value) {
  if (value === void 0) {
    return "";
  }
  const text = typeof value === "string" ? value : JSON.stringify(canonical(value));
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}
function itemLabel(item) {
  if (!isDict(item)) {
    return "";
  }
  if (typeof item.name === "string" && item.name) {
    return item.name;
  }
  if (isDict(item.channelId) && typeof item.channelId.valueStateId === "string") {
    return item.channelId.valueStateId;
  }
  if (typeof item.state === "string") {
    return item.state;
  }
  return typeof item.role === "string" ? item.role : "";
}
const ITEM_LISTS = ["pageItems", "left", "bottom", "indicator", "alternate", "items", "circuits"];
function configDiff(existing, imported, ignore = []) {
  var _a, _b;
  const a = isDict(existing) ? existing : {};
  const b = isDict(imported) ? imported : {};
  const out = [];
  const keys = [.../* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !ignore.includes(k)).sort();
  for (const key of keys) {
    const va = a[key];
    const vb = b[key];
    if (sameConfig(va, vb)) {
      continue;
    }
    if (ITEM_LISTS.includes(key) && (Array.isArray(va) || Array.isArray(vb))) {
      const la = Array.isArray(va) ? va : [];
      const lb = Array.isArray(vb) ? vb : [];
      for (let i = 0; i < Math.max(la.length, lb.length); i++) {
        const ia = (_a = la[i]) != null ? _a : null;
        const ib = (_b = lb[i]) != null ? _b : null;
        const stripId = (v) => {
          if (!isDict(v)) {
            return v;
          }
          const rest = { ...v };
          delete rest.itemId;
          return rest;
        };
        if (sameConfig(stripId(ia), stripId(ib))) {
          continue;
        }
        if (ia === null) {
          out.push({ kind: "item", list: key, position: i + 1, change: "added", label: itemLabel(ib) });
        } else if (ib === null) {
          out.push({ kind: "item", list: key, position: i + 1, change: "removed", label: itemLabel(ia) });
        } else {
          const da = isDict(ia) ? ia : {};
          const db = isDict(ib) ? ib : {};
          const fields = [.../* @__PURE__ */ new Set([...Object.keys(da), ...Object.keys(db)])].filter((f) => f !== "itemId" && !sameConfig(da[f], db[f])).sort();
          out.push({
            kind: "item",
            list: key,
            position: i + 1,
            change: "changed",
            label: itemLabel(ib) || itemLabel(ia),
            fields,
            values: fields.map((f) => ({
              field: f,
              existing: shortValue(da[f]),
              imported: shortValue(db[f])
            }))
          });
        }
      }
      continue;
    }
    out.push({ kind: "field", field: key, existing: shortValue(va), imported: shortValue(vb) });
  }
  return out;
}
function navigationDiff(existing, imported) {
  var _a, _b;
  const out = [];
  for (const link of ["prev", "next", "home", "parent"]) {
    const a = (_a = existing == null ? void 0 : existing[link]) != null ? _a : "";
    const b = (_b = imported == null ? void 0 : imported[link]) != null ? _b : "";
    if (a !== b) {
      out.push({ kind: "navigation", link, existing: a, imported: b });
    }
  }
  return out;
}
function remapNavigation(nav, map) {
  if (!nav) {
    return nav;
  }
  const out = { ...nav };
  for (const link of ["prev", "next", "home", "parent"]) {
    const v = out[link];
    if (v !== void 0 && map.has(v)) {
      out[link] = map.get(v);
    }
  }
  return out;
}
function remapPageReferences(page, map) {
  var _a, _b;
  const copy = structuredClone(page);
  if (map.size === 0) {
    return copy;
  }
  const rename = (v) => typeof v === "string" && map.has(v) ? map.get(v) : v;
  if (copy.card === "cardAlarm" && copy.setNavi) {
    copy.setNavi = (_a = rename(copy.setNavi)) != null ? _a : void 0;
  }
  if ((0, import_adminShareConfig.isPageLinkEntry)(copy)) {
    copy.target = (_b = rename(copy.target)) != null ? _b : copy.target;
  }
  if ("pageItems" in copy && Array.isArray(copy.pageItems)) {
    copy.pageItems = copy.pageItems.map((item) => {
      var _a2;
      if (!item) {
        return item;
      }
      const out = { ...item };
      if (out.targetPage !== void 0) {
        out.targetPage = (_a2 = rename(out.targetPage)) != null ? _a2 : void 0;
      }
      if (typeof out.targetPageLongPress === "string") {
        out.targetPageLongPress = rename(out.targetPageLongPress);
      }
      return out;
    });
  }
  return copy;
}
function mapScreensaverItems(entry, fn) {
  var _a, _b, _c;
  const copy = structuredClone(entry);
  const each = (list) => list == null ? void 0 : list.map((i) => i ? fn(i) : void 0);
  if (copy.favorit) {
    copy.favorit = fn(copy.favorit);
  }
  if (copy.alternate) {
    copy.alternate = each(copy.alternate);
  }
  copy.left = (_a = each(copy.left)) != null ? _a : [];
  copy.bottom = (_b = each(copy.bottom)) != null ? _b : [];
  copy.indicator = (_c = each(copy.indicator)) != null ? _c : [];
  return copy;
}
function remapScreensaver(entry, pages, itemIds, notify) {
  var _a;
  const copy = mapScreensaverItems((0, import_adminShareConfig.normalizeScreensaverEntry)(entry), (item) => {
    var _a2;
    const page = (_a2 = item.action) == null ? void 0 : _a2.page;
    if (item.action && page !== void 0 && pages.has(page)) {
      return { ...item, action: { ...item.action, page: pages.get(page) } };
    }
    return item;
  });
  if (((_a = copy.clockTimer) == null ? void 0 : _a.itemId) && itemIds.has(copy.clockTimer.itemId)) {
    copy.clockTimer = { ...copy.clockTimer, itemId: itemIds.get(copy.clockTimer.itemId) };
  }
  if (copy.notify) {
    copy.notify = copy.notify.map((id) => {
      var _a2;
      return (_a2 = notify.get(id)) != null ? _a2 : id;
    });
  }
  return copy;
}
function remapButton(action, map) {
  var _a;
  if (action && action.mode === "page" && map.has(action.page)) {
    return { ...action, page: (_a = map.get(action.page)) != null ? _a : action.page };
  }
  return action === void 0 ? void 0 : structuredClone(action);
}
function targetNoScript(native, topic) {
  var _a;
  return ((_a = native.panels) != null ? _a : []).some((p) => p && p.topic === topic && p.noScript === true);
}
const SCREENSAVER_CHOICE_KEY = "///screensaver-entry";
function nameSuffix(topic) {
  var _a;
  const last = (_a = topic.split("/").filter(Boolean).pop()) != null ? _a : "";
  return last.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "import";
}
function proposeName(base, topic, taken) {
  const first = `${base}_${nameSuffix(topic)}`;
  let name = first;
  for (let n = 2; taken.has(name) || name === import_adminShareConfig.mainPageName; n++) {
    name = `${first}_${n}`;
  }
  return name;
}
function nameProblem(name, taken, planned) {
  if (!name.trim() || name !== name.trim()) {
    return "importNameEmpty";
  }
  if (name === import_adminShareConfig.mainPageName) {
    return "importNameMain";
  }
  if (name.startsWith("///")) {
    return "importNameReserved";
  }
  if (planned.has(name)) {
    return "importNameTwice";
  }
  return taken.has(name) ? "importNameExists" : void 0;
}
function otherTopics(page, topic) {
  var _a;
  return [
    ...new Set(((_a = page.navigationAssignment) != null ? _a : []).map((a) => a == null ? void 0 : a.topic).filter((t) => !!t && t !== topic))
  ];
}
function mapItemIdsByPosition(imported, existing, map) {
  const ia = "pageItems" in imported && Array.isArray(imported.pageItems) ? imported.pageItems : [];
  const ea = "pageItems" in existing && Array.isArray(existing.pageItems) ? existing.pageItems : [];
  ia.forEach((item, i) => {
    var _a;
    const from = item == null ? void 0 : item.itemId;
    const to = (_a = ea[i]) == null ? void 0 : _a.itemId;
    if (from && to) {
      map.set(from, to);
    }
  });
}
function comparableScreensaver(entry, list) {
  const copy = { ...(0, import_adminShareConfig.normalizeScreensaverEntry)(entry) };
  delete copy.name;
  delete copy.panels;
  if (Array.isArray(entry.notify)) {
    copy.notify = entry.notify.map((id) => {
      const n = list.find((x) => x && x.id === id);
      if (!n) {
        return id;
      }
      const rest = { ...n };
      delete rest.id;
      return rest;
    });
  }
  return copy;
}
function planPanelImport(input) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const { native, topic, file } = input;
  const choices = (_a = input.choices) != null ? _a : {};
  const { present, missing } = splitImportGroups(file, input.groups);
  const mode = (_b = input.mode) != null ? _b : "merge";
  const plan = {
    topic,
    mode,
    groups: present,
    missingGroups: missing,
    pages: [],
    renames: {},
    valid: true
  };
  const existing = ((_c = native.pageConfig) != null ? _c : []).filter(
    (p) => !!p && typeof p.uniqueName === "string"
  );
  const byName = new Map(existing.map((p) => [p.uniqueName, p]));
  const taken = new Set(byName.keys());
  const renames = /* @__PURE__ */ new Map();
  if (present.includes("pages") && file.groups.pages) {
    const imported = file.groups.pages.pages;
    let rows = [];
    for (let round = 0; round <= imported.length + 1; round++) {
      const before = renames.size;
      const used = /* @__PURE__ */ new Set([...taken, ...renames.values()]);
      rows = imported.map((imp, index) => {
        var _a2, _b2, _c2;
        const original = imp.page.uniqueName;
        const stripped = (_a2 = imp.strippedSecrets) != null ? _a2 : [];
        const ex = byName.get(original);
        const base = {
          index,
          original,
          sharedWith: ex ? otherTopics(ex, topic) : [],
          assignment: imp.assignment,
          strippedSecrets: stripped
        };
        const choice = choices[original];
        if (!ex) {
          return {
            ...base,
            conflict: "none",
            action: (choice == null ? void 0 : choice.action) === "skip" ? "skip" : "add",
            name: original
          };
        }
        if (samePage(ex, remapPageReferences(imp.page, renames), stripped)) {
          return {
            ...base,
            conflict: "identical",
            action: (choice == null ? void 0 : choice.action) === "skip" ? "skip" : "merge",
            name: original
          };
        }
        const action = choice && ["rename", "replace", "skip"].includes(choice.action) ? choice.action : "rename";
        if (action !== "rename") {
          return { ...base, conflict: "different", action, name: original };
        }
        const name = (_c2 = (_b2 = renames.get(original)) != null ? _b2 : choice == null ? void 0 : choice.name) != null ? _c2 : proposeName(original, topic, used);
        used.add(name);
        renames.set(original, name);
        return { ...base, conflict: "different", action, name };
      });
      if (renames.size === before) {
        break;
      }
    }
    for (const [from] of renames) {
      if (!rows.some((r) => r.original === from && r.action === "rename")) {
        renames.delete(from);
      }
    }
    for (const row of rows) {
      if (row.action !== "rename") {
        continue;
      }
      const others = new Set(
        rows.filter((r) => r !== row && r.action !== "skip" && r.action !== "merge" && r.action !== "replace").map((r) => r.name)
      );
      row.nameError = nameProblem(row.name, taken, others);
      if (row.nameError) {
        plan.valid = false;
      }
    }
    for (const row of rows) {
      const ex = byName.get(row.original);
      if (row.action !== "merge" || !ex) {
        continue;
      }
      const imp = imported[row.index];
      const before = (0, import_panelConfigExport.effectivePageAssignment)(ex, topic);
      if (imp.assignment === "none") {
        row.status = (before == null ? void 0 : before.kind) === "own" ? "unassign" : "unchanged";
      } else if (!before) {
        row.status = "assign";
      } else {
        row.status = sameConfig((_d = before.navigation) != null ? _d : {}, (_e = remapNavigation(imp.navigation, renames)) != null ? _e : {}) ? "unchanged" : "navigation";
      }
    }
    const script = input.script;
    const scriptActive = mode === "merge" && !targetNoScript(native, topic);
    for (const row of rows) {
      if (!script || row.action === "skip" || imported[row.index].assignment === "none") {
        continue;
      }
      const node = imported[row.index].page.isMainPage ? import_adminShareConfig.mainPageName : row.name;
      if (scriptActive && script.panel.includes(node)) {
        row.scriptPage = native.adminOverridesScriptPages || node === import_adminShareConfig.mainPageName ? "local" : "localBlocked";
      } else if (script.global.includes(node)) {
        row.scriptPage = "global";
      }
    }
    plan.pages = rows;
  }
  plan.renames = Object.fromEntries(renames);
  const ssFile = file.groups.screensaver;
  if (present.includes("screensaver") && (ssFile == null ? void 0 : ssFile.entry)) {
    const entries = ((_f = native.screensaverConfig) != null ? _f : []).filter(
      (e) => !!e && typeof e.name === "string"
    );
    const list = (_g = native.screensaverNotify) != null ? _g : [];
    const itemIds = /* @__PURE__ */ new Map();
    for (const row of plan.pages) {
      const ex = byName.get(row.original);
      if (row.action === "merge" && ex && file.groups.pages) {
        mapItemIdsByPosition(file.groups.pages.pages[row.index].page, ex, itemIds);
      }
    }
    const imp = remapScreensaver(ssFile.entry, renames, itemIds, /* @__PURE__ */ new Map());
    const impComparable = comparableScreensaver(imp, ssFile.notify);
    const original = ssFile.entry.name;
    const identical = (_i = (_h = entries.find(
      (e) => {
        var _a2;
        return ((_a2 = e.panels) != null ? _a2 : []).includes(topic) && sameConfig(comparableScreensaver(e, list), impComparable);
      }
    )) != null ? _h : entries.find((e) => e.name === original && sameConfig(comparableScreensaver(e, list), impComparable))) != null ? _i : entries.find((e) => sameConfig(comparableScreensaver(e, list), impComparable));
    const sameName = entries.find((e) => e.name === original);
    const choice = choices[SCREENSAVER_CHOICE_KEY];
    const sharedWith = (e) => {
      var _a2;
      return ((_a2 = e == null ? void 0 : e.panels) != null ? _a2 : []).filter((t) => t !== topic);
    };
    if (identical) {
      plan.screensaver = {
        original,
        conflict: "identical",
        action: (choice == null ? void 0 : choice.action) === "skip" ? "skip" : "merge",
        name: identical.name,
        existing: identical.name,
        sharedWith: sharedWith(identical),
        status: ((_j = identical.panels) != null ? _j : []).includes(topic) ? "unchanged" : "assign"
      };
    } else if (!sameName) {
      plan.screensaver = {
        original,
        conflict: "none",
        action: (choice == null ? void 0 : choice.action) === "skip" ? "skip" : "add",
        name: original,
        sharedWith: []
      };
    } else {
      const action = choice && ["rename", "replace", "skip"].includes(choice.action) ? choice.action : "rename";
      const names = new Set(entries.map((e) => e.name));
      const name = action === "rename" ? (_k = choice == null ? void 0 : choice.name) != null ? _k : proposeName(original, topic, names) : original;
      const row = {
        original,
        conflict: "different",
        action,
        name,
        existing: sameName.name,
        sharedWith: sharedWith(sameName)
      };
      if (action === "rename") {
        row.nameError = !name.trim() || name !== name.trim() ? "importNameEmpty" : names.has(name) ? "importNameExists" : void 0;
        if (row.nameError) {
          plan.valid = false;
        }
      }
      plan.screensaver = row;
    }
  }
  return plan;
}
function usedItemIds(pages) {
  const out = /* @__PURE__ */ new Set();
  for (const p of pages) {
    if ("pageItems" in p && Array.isArray(p.pageItems)) {
      for (const item of p.pageItems) {
        if (item == null ? void 0 : item.itemId) {
          out.add(item.itemId);
        }
      }
    }
  }
  return out;
}
function assignItemIds(page, used, map, preferred = []) {
  if (!("pageItems" in page) || !Array.isArray(page.pageItems)) {
    return;
  }
  page.pageItems = page.pageItems.map((item, i) => {
    if (!item) {
      return item;
    }
    const old = item.itemId;
    let id = preferred[i];
    if (!id || used.has(id)) {
      id = old && !used.has(old) ? old : (0, import_adminShareConfig.newItemId)(used);
    }
    used.add(id);
    if (old && old !== id) {
      map.set(old, id);
    }
    return { ...item, itemId: id };
  });
}
function applyPanelImport(input, plan) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
  const { native, topic, file } = input;
  const renames = new Map(Object.entries(plan.renames));
  const report = {
    skippedGroups: [...plan.missingGroups],
    added: [],
    merged: [],
    unchanged: [],
    renamed: [],
    replaced: [],
    skipped: [],
    secrets: [],
    mainPageRemoved: [],
    excludedAllPages: [],
    notifyRenamed: [],
    scriptDisabled: false,
    overridesRemoved: [],
    overridesImported: []
  };
  const result = { native: {}, states: {}, report };
  const itemIds = /* @__PURE__ */ new Map();
  if (plan.groups.includes("pages") && file.groups.pages) {
    const pages = structuredClone(((_a = native.pageConfig) != null ? _a : []).filter((p) => !!p));
    for (const p of pages) {
      if (Array.isArray(p.navigationAssignment)) {
        p.navigationAssignment = p.navigationAssignment.filter((a) => a && a.topic !== topic);
      }
    }
    const used = usedItemIds(pages);
    const touched = /* @__PURE__ */ new Set();
    const hasAll = (p) => {
      var _a2;
      return ((_a2 = p.navigationAssignment) != null ? _a2 : []).find((a) => a && a.topic === import_adminShareConfig.ALL_PANELS_SPECIAL_ID);
    };
    for (const row of plan.pages) {
      const imp = file.groups.pages.pages[row.index];
      if (row.action === "skip") {
        report.skipped.push(row.original);
        continue;
      }
      const navigation = remapNavigation(imp.navigation, renames);
      const final = remapPageReferences(imp.page, renames);
      final.uniqueName = row.name;
      const index = pages.findIndex((p) => p.uniqueName === row.original);
      if (row.action === "merge" && index !== -1) {
        const ex = pages[index];
        mapItemIdsByPosition(imp.page, ex, itemIds);
        if (imp.assignment !== "none") {
          const all = hasAll(ex);
          if (!all || !sameConfig((_b = all.navigation) != null ? _b : {}, navigation != null ? navigation : {}) || row.scriptPage === "global") {
            ex.navigationAssignment = [
              ...(_c = ex.navigationAssignment) != null ? _c : [],
              all ? { topic, navigation: navigation != null ? navigation : {} } : { topic, navigation }
            ];
          }
          touched.add(ex.uniqueName);
        }
        (row.status === "unchanged" ? report.unchanged : report.merged).push(row.original);
        continue;
      }
      const assignment = imp.assignment === "none" ? [] : [{ topic, navigation }];
      if (row.action === "replace" && index !== -1) {
        const ex = pages[index];
        for (const field of row.strippedSecrets) {
          if (field in ex) {
            Reflect.set(final, field, Reflect.get(ex, field));
          }
        }
        const preferred = "pageItems" in ex && Array.isArray(ex.pageItems) ? ex.pageItems.map((i) => i == null ? void 0 : i.itemId) : [];
        for (const id of preferred) {
          if (id) {
            used.delete(id);
          }
        }
        assignItemIds(final, used, itemIds, preferred);
        final.navigationAssignment = [...(_d = ex.navigationAssignment) != null ? _d : [], ...assignment];
        pages[index] = final;
        report.replaced.push(row.original);
        setSafeSecrets(
          final,
          row.strippedSecrets.filter((f) => !(f in ex))
        );
      } else {
        assignItemIds(final, used, itemIds);
        final.navigationAssignment = assignment;
        setSafeSecrets(final, row.strippedSecrets);
        pages.push(final);
        if (row.action === "rename") {
          report.renamed.push({ from: row.original, to: row.name });
          const ex = index !== -1 ? pages[index] : void 0;
          if (ex && hasAll(ex) && imp.assignment !== "none") {
            ex.navigationAssignment = [...(_e = ex.navigationAssignment) != null ? _e : [], { topic }];
            report.excludedAllPages.push(ex.uniqueName);
          }
        } else {
          report.added.push(row.name);
        }
      }
      if (imp.assignment !== "none") {
        touched.add(row.name);
      }
    }
    for (const name of file.groups.pages.excludedAllPages) {
      const p = pages.find((x) => x.uniqueName === name);
      if (p && hasAll(p) && !touched.has(name) && !((_f = p.navigationAssignment) != null ? _f : []).some((a) => a.topic === topic)) {
        p.navigationAssignment = [...(_g = p.navigationAssignment) != null ? _g : [], { topic }];
        report.excludedAllPages.push(name);
      }
    }
    const main = pages.find((p) => touched.has(p.uniqueName) && p.isMainPage && (0, import_panelConfigExport.effectivePageAssignment)(p, topic));
    if (main) {
      const before = (_i = ((_h = native.pageConfig) != null ? _h : []).find(
        (p) => p && p.isMainPage && (0, import_panelConfigExport.effectivePageAssignment)(p, topic)
      )) == null ? void 0 : _i.uniqueName;
      if (before !== main.uniqueName) {
        report.mainPage = main.uniqueName;
      }
      for (const p of pages) {
        if (p === main || !p.isMainPage || !(0, import_panelConfigExport.effectivePageAssignment)(p, topic)) {
          continue;
        }
        const own = ((_j = p.navigationAssignment) != null ? _j : []).some((a) => a.topic === topic);
        p.navigationAssignment = own ? ((_k = p.navigationAssignment) != null ? _k : []).filter((a) => a.topic !== topic) : [...(_l = p.navigationAssignment) != null ? _l : [], { topic }];
        report.mainPageRemoved.push(p.uniqueName);
      }
    }
    result.native.pageConfig = pages;
    report.secrets = importSecretPages(input, plan);
  }
  const ss = plan.screensaver;
  if (plan.groups.includes("screensaver") && file.groups.screensaver) {
    const entries = structuredClone(((_m = native.screensaverConfig) != null ? _m : []).filter((e) => !!e));
    for (const e of entries) {
      if (Array.isArray(e.panels)) {
        e.panels = e.panels.filter((t) => t !== topic);
      }
    }
    const list = structuredClone((_n = native.screensaverNotify) != null ? _n : []);
    const entry = file.groups.screensaver.entry;
    if (!entry) {
      report.screensaver = { action: "removed", name: "" };
    } else if (ss && ss.action !== "skip") {
      const notifyIds = /* @__PURE__ */ new Map();
      const wanted = new Set((_o = entry.notify) != null ? _o : []);
      for (const n of file.groups.screensaver.notify.filter((x) => wanted.has(x.id))) {
        const ex = list.find((x) => x.id === n.id);
        if (ex && sameConfig(ex, n)) {
          continue;
        }
        if (ex) {
          const id = (0, import_adminShareConfig.newScreensaverNotifyId)(list);
          list.push({ ...structuredClone(n), id });
          notifyIds.set(n.id, id);
          report.notifyRenamed.push({ from: n.id, to: id });
        } else {
          list.push(structuredClone(n));
        }
      }
      const imp = remapScreensaver(entry, renames, itemIds, notifyIds);
      if (ss.action === "merge") {
        const target = entries.find((e) => e.name === ss.existing);
        if (target) {
          target.panels = [...(_p = target.panels) != null ? _p : [], topic];
        }
      } else if (ss.action === "replace") {
        const index = entries.findIndex((e) => e.name === ss.existing);
        const panels = index !== -1 ? (_q = entries[index].panels) != null ? _q : [] : [];
        const replacement = { ...imp, name: (_r = ss.existing) != null ? _r : ss.original, panels: [...panels, topic] };
        if (index !== -1) {
          entries[index] = replacement;
        } else {
          entries.push(replacement);
        }
      } else {
        entries.push({ ...imp, name: ss.name, panels: [topic] });
      }
      report.screensaver = {
        action: ss.action === "merge" && ss.status === "unchanged" ? "unchanged" : ss.action,
        name: ss.action === "replace" ? (_s = ss.existing) != null ? _s : ss.name : ss.name
      };
      result.native.screensaverNotify = list;
    } else if (ss) {
      report.screensaver = { action: "skip", name: ss.original };
    }
    result.native.screensaverConfig = entries;
  }
  const miscFile = plan.groups.includes("misc") ? file.groups.misc : void 0;
  const overwrite = plan.mode === "overwrite";
  if (miscFile || overwrite) {
    const panels = structuredClone((_t = native.panels) != null ? _t : []);
    const panel = panels.find((p) => p && p.topic === topic);
    if (panel) {
      if (miscFile) {
        for (const key of ["buttonLeft", "buttonRight"]) {
          if (key in miscFile && miscFile[key] !== void 0) {
            panel[key] = remapButton(miscFile[key], renames);
          } else {
            delete panel[key];
          }
        }
      }
      if (overwrite) {
        report.scriptDisabled = panel.noScript !== true;
        panel.noScript = true;
      }
      result.native.panels = panels;
    }
  }
  if (overwrite) {
    const imported = ((_u = miscFile == null ? void 0 : miscFile.navigationOverrides) != null ? _u : []).map((o) => {
      var _a2, _b2;
      return {
        panelTopic: topic,
        page: o.page,
        navigation: (_a2 = remapNavigation(o.navigation, renames)) != null ? _a2 : {},
        scriptLinks: structuredClone((_b2 = o.scriptLinks) != null ? _b2 : {})
      };
    });
    report.overridesRemoved = ((_v = native.navigationOverrides) != null ? _v : []).filter((o) => o && o.panelTopic === topic).map((o) => o.page);
    report.overridesImported = imported.map((o) => o.page);
    result.native.navigationOverrides = [
      ...structuredClone(((_w = native.navigationOverrides) != null ? _w : []).filter((o) => o && o.panelTopic !== topic)),
      ...imported
    ];
  }
  if (miscFile) {
    const misc = miscFile;
    const adminScreensaver = ((_y = (_x = result.native.screensaverConfig) != null ? _x : native.screensaverConfig) != null ? _y : []).some(
      (e) => e && Array.isArray(e.panels) && e.panels.includes(topic)
    );
    for (const s of import_panelConfigExport.panelSettingStates) {
      const val = misc.states[s.id];
      if (val === void 0 || typeof val !== s.type) {
        continue;
      }
      if (adminScreensaver && (s.id === "screenSaver.layout" || s.id === "screenSaver.rotationTime")) {
        continue;
      }
      result.states[s.id] = s.id === "mainNavigationPoint" && typeof val === "string" ? (_z = renames.get(val)) != null ? _z : val : val;
    }
  }
  return result;
}
function setSafeSecrets(page, fields) {
  if (page.card === "cardAlarm" && fields.includes("pin")) {
    page.pin = -1;
  }
  if (page.card === "cardQR" && fields.includes("qrPass")) {
    page.qrPass = "";
  }
}
function plannedPageContent(file, plan, row) {
  var _a;
  const imp = (_a = file.groups.pages) == null ? void 0 : _a.pages[row.index];
  if (!imp) {
    return void 0;
  }
  const renames = new Map(Object.entries(plan.renames));
  return { page: remapPageReferences(imp.page, renames), navigation: remapNavigation(imp.navigation, renames) };
}
function plannedScreensaverContent(file, plan) {
  var _a;
  const entry = (_a = file.groups.screensaver) == null ? void 0 : _a.entry;
  return entry ? remapScreensaver(entry, new Map(Object.entries(plan.renames)), /* @__PURE__ */ new Map(), /* @__PURE__ */ new Map()) : void 0;
}
function importSecretPages(input, plan) {
  var _a;
  if (!plan.groups.includes("pages")) {
    return [];
  }
  const out = [];
  for (const row of plan.pages) {
    if (!row.strippedSecrets.length) {
      continue;
    }
    if (row.action === "add" || row.action === "rename") {
      out.push({ page: row.name, fields: [...row.strippedSecrets] });
    } else if (row.action === "replace") {
      const ex = ((_a = input.native.pageConfig) != null ? _a : []).find((p) => p && p.uniqueName === row.original);
      const missing = row.strippedSecrets.filter((f) => !ex || !(f in ex));
      if (missing.length) {
        out.push({ page: row.name, fields: missing });
      }
    }
  }
  return out;
}
function targetPageView(pages, topic) {
  var _a;
  const out = {};
  for (const p of pages) {
    const effective = p ? (0, import_panelConfigExport.effectivePageAssignment)(p, topic) : void 0;
    if (effective) {
      out[p.uniqueName] = { page: comparablePage(p, []), navigation: (_a = effective.navigation) != null ? _a : {} };
    }
  }
  return out;
}
function targetScreensaverView(entries, list, topic) {
  const entry = entries.find((e) => e && Array.isArray(e.panels) && e.panels.includes(topic));
  return entry ? comparableScreensaver(entry, list) : null;
}
function panelImportChanges(input, plan, targetStates) {
  var _a, _b, _c, _d, _e;
  const { native, topic } = input;
  const result = applyPanelImport(input, plan);
  const out = [];
  const after = result.native;
  if (after.pageConfig && !sameConfig(targetPageView((_a = native.pageConfig) != null ? _a : [], topic), targetPageView(after.pageConfig, topic))) {
    out.push("pages");
  }
  if (after.screensaverConfig && !sameConfig(
    targetScreensaverView((_b = native.screensaverConfig) != null ? _b : [], (_c = native.screensaverNotify) != null ? _c : [], topic),
    targetScreensaverView(
      after.screensaverConfig,
      (_e = (_d = after.screensaverNotify) != null ? _d : native.screensaverNotify) != null ? _e : [],
      topic
    )
  )) {
    out.push("screensaver");
  }
  if (plan.groups.includes("misc") || plan.mode === "overwrite") {
    const panelView = (panels) => {
      const p = (panels != null ? panels : []).find((x) => x && x.topic === topic);
      return { buttonLeft: p == null ? void 0 : p.buttonLeft, buttonRight: p == null ? void 0 : p.buttonRight, noScript: !!(p == null ? void 0 : p.noScript) };
    };
    const overrides = (list) => (list != null ? list : []).filter((o) => o && o.panelTopic === topic).map((o) => ({ page: o.page, navigation: o.navigation, scriptLinks: o.scriptLinks })).sort((a, b) => a.page.localeCompare(b.page));
    if (after.panels && !sameConfig(panelView(native.panels), panelView(after.panels)) || after.navigationOverrides && !sameConfig(overrides(native.navigationOverrides), overrides(after.navigationOverrides)) || Object.entries(result.states).some(([id, val]) => targetStates[id] !== val)) {
      out.push("misc");
    }
  }
  return out;
}
function adminNodesOnTarget(pages, topic) {
  const out = /* @__PURE__ */ new Set();
  for (const p of pages) {
    if (p && (0, import_panelConfigExport.effectivePageAssignment)(p, topic)) {
      out.add(p.uniqueName);
      if (p.isMainPage) {
        out.add(import_adminShareConfig.mainPageName);
      }
    }
  }
  return out;
}
function ownAdminNodes(pages, topic) {
  var _a;
  const out = /* @__PURE__ */ new Set();
  for (const p of pages) {
    if (p && ((_a = (0, import_panelConfigExport.effectivePageAssignment)(p, topic)) == null ? void 0 : _a.kind) === "own") {
      out.add(p.isMainPage ? import_adminShareConfig.mainPageName : p.uniqueName);
    }
  }
  return out;
}
function panelOverwriteSummary(input, plan) {
  var _a, _b;
  const { native, topic } = input;
  const result = applyPanelImport({ ...input, mode: "overwrite" }, { ...plan, mode: "overwrite" });
  const before = ((_a = native.pageConfig) != null ? _a : []).filter((p) => !!p);
  const after = (_b = result.native.pageConfig) != null ? _b : before;
  const afterOn = adminNodesOnTarget(after, topic);
  const scriptActive = !targetNoScript(native, topic);
  const out = {
    removedOwnPages: before.filter((p) => {
      var _a2;
      return ((_a2 = (0, import_panelConfigExport.effectivePageAssignment)(p, topic)) == null ? void 0 : _a2.kind) === "own" && !afterOn.has(p.uniqueName);
    }).map((p) => p.uniqueName),
    scriptActive,
    overridesRemoved: result.report.overridesRemoved,
    overridesImported: result.report.overridesImported,
    remainingAllPages: after.filter((p) => {
      var _a2;
      return ((_a2 = (0, import_panelConfigExport.effectivePageAssignment)(p, topic)) == null ? void 0 : _a2.kind) === "all";
    }).map((p) => p.uniqueName)
  };
  if (input.script) {
    out.scriptPages = scriptActive ? [...input.script.panel] : [];
    const own = ownAdminNodes(after, topic);
    out.remainingGlobalPages = input.script.global.filter((n) => !own.has(n));
  }
  return out;
}
function danglingNavigation(input, result) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const { native, topic } = input;
  const pages = ((_b = (_a = result.native.pageConfig) != null ? _a : native.pageConfig) != null ? _b : []).filter((p) => !!p);
  const panels = (_d = (_c = result.native.panels) != null ? _c : native.panels) != null ? _d : [];
  const scriptOn = !panels.some((p) => p && p.topic === topic && p.noScript === true);
  const known = adminNodesOnTarget(pages, topic);
  for (const n of (_f = (_e = input.script) == null ? void 0 : _e.global) != null ? _f : []) {
    known.add(n);
  }
  if (scriptOn) {
    for (const n of (_h = (_g = input.script) == null ? void 0 : _g.panel) != null ? _h : []) {
      known.add(n);
    }
  }
  const ok = (target) => !target || target.startsWith("///") || known.has(target);
  const links = [];
  const check = (page, nav, override) => {
    for (const link of ["prev", "next", "home", "parent"]) {
      const target = nav == null ? void 0 : nav[link];
      if (typeof target === "string" && !ok(target)) {
        links.push(override ? { page, link, target, override } : { page, link, target });
      }
    }
  };
  for (const p of pages) {
    const effective = (0, import_panelConfigExport.effectivePageAssignment)(p, topic);
    if (effective) {
      check(p.uniqueName, effective.navigation, false);
    }
  }
  for (const o of (_j = (_i = result.native.navigationOverrides) != null ? _i : native.navigationOverrides) != null ? _j : []) {
    if (o && o.panelTopic === topic && known.has(o.page)) {
      check(o.page, o.navigation, true);
    }
  }
  return { links, incomplete: !input.script };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SCREENSAVER_CHOICE_KEY,
  applyPanelImport,
  configDiff,
  danglingNavigation,
  importSecretPages,
  navigationDiff,
  panelConfiguredGroups,
  panelImportChanges,
  panelOverwriteSummary,
  panelSettingDefaults,
  parsePanelConfigImport,
  planPanelImport,
  plannedPageContent,
  plannedScreensaverContent,
  remapPageReferences,
  sameConfig,
  samePage,
  scriptPagesFromMeta,
  splitImportGroups
});
//# sourceMappingURL=panelConfigImport.js.map
