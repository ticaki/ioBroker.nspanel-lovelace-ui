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
var navigationEdit_exports = {};
__export(navigationEdit_exports, {
  applyNavigationOverlay: () => applyNavigationOverlay,
  assignmentSourceOf: () => assignmentSourceOf,
  effectiveNavigation: () => effectiveNavigation,
  isNavigationApplied: () => isNavigationApplied,
  isNavigationLinkKind: () => isNavigationLinkKind,
  navigationLinkKinds: () => navigationLinkKinds,
  setNavigationLink: () => setNavigationLink
});
module.exports = __toCommonJS(navigationEdit_exports);
var import_adminShareConfig = require("./adminShareConfig");
const navigationLinkKinds = ["prev", "next", "home", "parent"];
function isNavigationLinkKind(value) {
  return typeof value === "string" && navigationLinkKinds.includes(value);
}
function assignmentRows(entry, panelTopic) {
  const list = Array.isArray(entry.navigationAssignment) ? entry.navigationAssignment : [];
  return {
    panel: list.find((a) => a && a.topic === panelTopic),
    all: list.find((a) => a && a.topic === import_adminShareConfig.ALL_PANELS_SPECIAL_ID)
  };
}
function assignmentSourceOf(entry, panelTopic) {
  const { panel, all } = assignmentRows(entry, panelTopic);
  if (panel) {
    return !panel.navigation && all ? "excluded" : "panel";
  }
  return all ? "all" : "none";
}
function effectiveNavigation(entry, panelTopic) {
  var _a, _b;
  const { panel, all } = assignmentRows(entry, panelTopic);
  switch (assignmentSourceOf(entry, panelTopic)) {
    case "panel":
      return { ...(_a = panel == null ? void 0 : panel.navigation) != null ? _a : {} };
    case "all":
      return { ...(_b = all == null ? void 0 : all.navigation) != null ? _b : {} };
    default:
      return void 0;
  }
}
function setNavigationLink(entries, uniqueName, panelTopic, kind, target, scope) {
  var _a, _b;
  const index = entries.findIndex((e) => e && e.uniqueName === uniqueName);
  if (index === -1) {
    return entries;
  }
  const entry = entries[index];
  if (target !== void 0 && (target === uniqueName || target === import_adminShareConfig.mainPageName && (0, import_adminShareConfig.isMainPageEntry)(entry))) {
    return entries;
  }
  const list = Array.isArray(entry.navigationAssignment) ? entry.navigationAssignment : [];
  const topic = scope === "all" ? import_adminShareConfig.ALL_PANELS_SPECIAL_ID : panelTopic;
  const rowIndex = list.findIndex((a) => a && a.topic === topic);
  let navigation;
  if (rowIndex === -1) {
    const inherited = scope === "panel" ? (_a = list.find((a) => a && a.topic === import_adminShareConfig.ALL_PANELS_SPECIAL_ID)) == null ? void 0 : _a.navigation : void 0;
    navigation = { ...inherited != null ? inherited : {} };
  } else {
    navigation = { ...(_b = list[rowIndex].navigation) != null ? _b : {} };
  }
  if (target === void 0) {
    delete navigation[kind];
  } else {
    navigation[kind] = target;
  }
  const row = rowIndex === -1 ? { topic, navigation } : { ...list[rowIndex], navigation };
  const navigationAssignment = rowIndex === -1 ? [...list, row] : list.map((a, i) => i === rowIndex ? row : a);
  const updated = (0, import_adminShareConfig.dropScriptNavigation)({ ...entry, navigationAssignment });
  return entries.map((e, i) => i === index ? updated : e);
}
function targetResolver(entries) {
  const mainAliases = new Set(
    entries.filter((e) => e && (0, import_adminShareConfig.isMainPageEntry)(e) && e.uniqueName !== import_adminShareConfig.mainPageName).map((e) => e.uniqueName)
  );
  return (target) => {
    if (!target) {
      return void 0;
    }
    return mainAliases.has(target) ? import_adminShareConfig.mainPageName : target;
  };
}
function configuredLinksOf(item, entries, panelTopic, touchedPages, resolve) {
  if (!touchedPages.has(item.page) || item.origin !== "admin" || !item.adminPageName) {
    return void 0;
  }
  const entry = entries.find((e) => e && e.uniqueName === item.adminPageName);
  const links = entry ? effectiveNavigation(entry, panelTopic) : void 0;
  if (!links) {
    return void 0;
  }
  return {
    prev: resolve(links.prev),
    next: resolve(links.next),
    home: resolve(links.home),
    parent: resolve(links.parent)
  };
}
function applyNavigationOverlay(map, entries, panelTopic, touchedPages) {
  const resolve = targetResolver(entries);
  const configured = /* @__PURE__ */ new Map();
  for (const item of map) {
    const links = configuredLinksOf(item, entries, panelTopic, touchedPages, resolve);
    if (links) {
      configured.set(item.page, links);
    }
  }
  const effectiveOf = (item) => {
    var _a;
    return (_a = configured.get(item.page)) != null ? _a : item;
  };
  const counterpart = (page, link) => {
    var _a;
    return (_a = map.find((other) => other.page !== page && effectiveOf(other)[link] === page)) == null ? void 0 : _a.page;
  };
  return map.map((item) => {
    var _a, _b;
    const links = configured.get(item.page);
    if (!links) {
      return item;
    }
    const nav = {
      prev: (_a = links.prev) != null ? _a : counterpart(item.page, "next"),
      next: (_b = links.next) != null ? _b : counterpart(item.page, "prev"),
      home: links.home,
      parent: links.parent
    };
    if (nav.home === item.page) {
      nav.home = void 0;
    }
    if (nav.parent === item.page) {
      nav.parent = void 0;
    }
    if (!nav.prev && !nav.next && !nav.home && !nav.parent && item.page !== import_adminShareConfig.mainPageName) {
      nav.home = import_adminShareConfig.mainPageName;
    }
    return { ...item, ...nav };
  });
}
function isNavigationApplied(map, entries, panelTopic, page) {
  const item = map.find((e) => e.page === page);
  if (!item) {
    return true;
  }
  const expected = applyNavigationOverlay(map, entries, panelTopic, /* @__PURE__ */ new Set([page])).find((e) => e.page === page);
  const links = configuredLinksOf(item, entries, panelTopic, /* @__PURE__ */ new Set([page]), targetResolver(entries));
  if (!expected || !links) {
    return true;
  }
  const same = (a, b) => (a || void 0) === (b || void 0);
  const known = new Set(map.map((e) => e.page));
  const applied = (configured, actual) => !configured || !known.has(configured) || same(configured, actual);
  return (expected.home && !known.has(expected.home) ? true : same(expected.home, item.home)) && (expected.parent && !known.has(expected.parent) ? true : same(expected.parent, item.parent)) && applied(links.prev, item.prev) && applied(links.next, item.next);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  applyNavigationOverlay,
  assignmentSourceOf,
  effectiveNavigation,
  isNavigationApplied,
  isNavigationLinkKind,
  navigationLinkKinds,
  setNavigationLink
});
//# sourceMappingURL=navigationEdit.js.map
