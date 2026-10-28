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
  adapterDecidedLink: () => adapterDecidedLink,
  applyNavigationOverlay: () => applyNavigationOverlay,
  assignmentSourceOf: () => assignmentSourceOf,
  effectiveNavigation: () => effectiveNavigation,
  effectiveScriptLinks: () => effectiveScriptLinks,
  isNavigationApplied: () => isNavigationApplied,
  isNavigationLinkKind: () => isNavigationLinkKind,
  isOverrideStale: () => isOverrideStale,
  mergeNavigationOverride: () => mergeNavigationOverride,
  navigationLinkKinds: () => navigationLinkKinds,
  navigationLinksDiffer: () => navigationLinksDiffer,
  overrideOf: () => overrideOf,
  removeNavigationOverride: () => removeNavigationOverride,
  setNavigationLink: () => setNavigationLink,
  setOverrideLink: () => setOverrideLink
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
function linkOrUndefined(value) {
  return value ? value : void 0;
}
function navigationLinksDiffer(a, b) {
  return navigationLinkKinds.some((kind) => linkOrUndefined(a[kind]) !== linkOrUndefined(b[kind]));
}
function isOverrideStale(override, currentScriptLinks) {
  var _a;
  return navigationLinksDiffer((_a = override.scriptLinks) != null ? _a : {}, currentScriptLinks);
}
function mergeNavigationOverride(override, currentScriptLinks) {
  var _a, _b;
  const result = {};
  const snapshot = (_a = override.scriptLinks) != null ? _a : {};
  const user = (_b = override.navigation) != null ? _b : {};
  for (const kind of navigationLinkKinds) {
    const changedByUser = linkOrUndefined(user[kind]) !== linkOrUndefined(snapshot[kind]);
    const value = changedByUser ? linkOrUndefined(user[kind]) : linkOrUndefined(currentScriptLinks[kind]);
    if (value) {
      result[kind] = value;
    }
  }
  return result;
}
function overrideOf(overrides, panelTopic, page) {
  return overrides.find((o) => o && o.panelTopic === panelTopic && o.page === page);
}
function setOverrideLink(overrides, panelTopic, page, kind, target, scriptLinks) {
  var _a;
  if (!page || target === page) {
    return overrides;
  }
  const index = overrides.findIndex((o) => o && o.panelTopic === panelTopic && o.page === page);
  const existing = index === -1 ? void 0 : overrides[index];
  const navigation = { ...existing ? (_a = existing.navigation) != null ? _a : {} : scriptLinks };
  if (linkOrUndefined(navigation[kind]) === linkOrUndefined(target)) {
    return overrides;
  }
  if (target === void 0) {
    delete navigation[kind];
  } else {
    navigation[kind] = target;
  }
  let updated;
  if (existing) {
    const refreshSnapshot = isOverrideStale(existing, scriptLinks);
    updated = refreshSnapshot ? { ...existing, navigation, scriptLinks: { ...scriptLinks } } : { ...existing, navigation };
  } else {
    updated = { panelTopic, page, navigation, scriptLinks: { ...scriptLinks } };
  }
  return index === -1 ? [...overrides, updated] : overrides.map((o, i) => i === index ? updated : o);
}
function removeNavigationOverride(overrides, panelTopic, page) {
  if (!overrideOf(overrides, panelTopic, page)) {
    return overrides;
  }
  return overrides.filter((o) => !(o && o.panelTopic === panelTopic && o.page === page));
}
function effectiveScriptLinks(entry, overrides, panelTopic) {
  var _a;
  if (entry.generated || entry.origin !== "script" && entry.origin !== "global" || !entry.scriptLinks) {
    return void 0;
  }
  const override = overrideOf(overrides, panelTopic, entry.page);
  return { ...override ? (_a = override.navigation) != null ? _a : {} : entry.scriptLinks };
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
function configuredLinksOf(item, entries, panelTopic, touchedPages, resolve, overrides) {
  if (!touchedPages.has(item.page) || item.generated) {
    return void 0;
  }
  let links;
  if (item.origin === "admin" && item.adminPageName) {
    const entry = entries.find((e) => e && e.uniqueName === item.adminPageName);
    links = entry ? effectiveNavigation(entry, panelTopic) : void 0;
  } else {
    links = effectiveScriptLinks(item, overrides, panelTopic);
  }
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
function ownChainLinksOf(item, entries, panelTopic, overrides, resolve) {
  if (item.nodeType === "stateRef" || item.generated) {
    return void 0;
  }
  let links;
  if (item.origin === "admin") {
    const entry = item.adminPageName ? entries.find((e) => e && e.uniqueName === item.adminPageName) : void 0;
    links = entry ? effectiveNavigation(entry, panelTopic) : void 0;
  } else {
    links = effectiveScriptLinks(item, overrides, panelTopic);
  }
  return links ? { prev: resolve(links.prev), next: resolve(links.next) } : void 0;
}
function adapterDecidedLink(map, entries, panelTopic, page, link, overrides = []) {
  var _a;
  const resolve = targetResolver(entries);
  const self = map.find((e) => e.page === page);
  if (!self) {
    return void 0;
  }
  const admins = [];
  for (const other of map) {
    if (other.page === page || other.origin !== "admin") {
      continue;
    }
    const own2 = ownChainLinksOf(other, entries, panelTopic, overrides, resolve);
    if (own2) {
      admins.push({ page: other.page, ...own2 });
    }
  }
  if (!admins.length) {
    return void 0;
  }
  const opposite = link === "prev" ? "next" : "prev";
  const direct = admins.find((o) => o[opposite] === page);
  if (direct) {
    return direct.page;
  }
  const own = ownChainLinksOf(self, entries, panelTopic, overrides, resolve);
  const neighbour = own == null ? void 0 : own[link];
  if (!neighbour) {
    return void 0;
  }
  const selfIsAdmin = self.origin === "admin";
  if (link === "next") {
    if (selfIsAdmin && !(own == null ? void 0 : own.prev)) {
      return void 0;
    }
    return (_a = admins.find((o) => o.next === neighbour && !o.prev)) == null ? void 0 : _a.page;
  }
  if (selfIsAdmin) {
    return void 0;
  }
  const previous = map.find((e) => e.page === neighbour);
  const previousOwn = previous ? ownChainLinksOf(previous, entries, panelTopic, overrides, resolve) : void 0;
  if (previousOwn && previousOwn.next !== page) {
    return void 0;
  }
  const chain = admins.filter((o) => o.prev === neighbour);
  const last = chain[chain.length - 1];
  return last && !last.next ? last.page : void 0;
}
function applyNavigationOverlay(map, entries, panelTopic, touchedPages, overrides = []) {
  const resolve = targetResolver(entries);
  const configured = /* @__PURE__ */ new Map();
  for (const item of map) {
    const links = configuredLinksOf(item, entries, panelTopic, touchedPages, resolve, overrides);
    if (links) {
      configured.set(item.page, links);
    }
  }
  return map.map((item) => {
    var _a, _b;
    const links = configured.get(item.page);
    if (!links) {
      return item;
    }
    const nav = {
      prev: (_a = adapterDecidedLink(map, entries, panelTopic, item.page, "prev", overrides)) != null ? _a : links.prev,
      next: (_b = adapterDecidedLink(map, entries, panelTopic, item.page, "next", overrides)) != null ? _b : links.next,
      home: links.home,
      parent: links.parent
    };
    if (nav.home === item.page) {
      nav.home = void 0;
    }
    if (nav.parent === item.page) {
      nav.parent = void 0;
    }
    if (!links.prev && !links.next && !nav.home && !nav.parent && item.page !== import_adminShareConfig.mainPageName) {
      nav.home = import_adminShareConfig.mainPageName;
    }
    return { ...item, ...nav };
  });
}
function isNavigationApplied(map, entries, panelTopic, page, overrides = []) {
  const item = map.find((e) => e.page === page);
  if (!item) {
    return true;
  }
  const touched = /* @__PURE__ */ new Set([page]);
  const expected = applyNavigationOverlay(map, entries, panelTopic, touched, overrides).find((e) => e.page === page);
  const links = configuredLinksOf(item, entries, panelTopic, touched, targetResolver(entries), overrides);
  if (!expected || !links) {
    return true;
  }
  const same = (a, b) => (a || void 0) === (b || void 0);
  const known = new Set(map.map((e) => e.page));
  const applied = (configured, actual) => !configured || !known.has(configured) || same(configured, actual);
  const prevByAdmin = adapterDecidedLink(map, entries, panelTopic, page, "prev", overrides) !== void 0;
  const nextByAdmin = adapterDecidedLink(map, entries, panelTopic, page, "next", overrides) !== void 0;
  return (expected.home && !known.has(expected.home) ? true : same(expected.home, item.home)) && (expected.parent && !known.has(expected.parent) ? true : same(expected.parent, item.parent)) && (prevByAdmin || applied(links.prev, item.prev)) && (nextByAdmin || applied(links.next, item.next));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adapterDecidedLink,
  applyNavigationOverlay,
  assignmentSourceOf,
  effectiveNavigation,
  effectiveScriptLinks,
  isNavigationApplied,
  isNavigationLinkKind,
  isOverrideStale,
  mergeNavigationOverride,
  navigationLinkKinds,
  navigationLinksDiffer,
  overrideOf,
  removeNavigationOverride,
  setNavigationLink,
  setOverrideLink
});
//# sourceMappingURL=navigationEdit.js.map
