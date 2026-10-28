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
var navigation_overrides_exports = {};
__export(navigation_overrides_exports, {
  adminReplacedPageIds: () => adminReplacedPageIds,
  applyNavigationOverrides: () => applyNavigationOverrides,
  isOverridableNavigationItem: () => isOverridableNavigationItem,
  isOverrideStale: () => import_navigationEdit2.isOverrideStale,
  linksOfNavigationItem: () => linksOfNavigationItem,
  mergeNavigationOverride: () => import_navigationEdit2.mergeNavigationOverride,
  navigationItemWithLinks: () => navigationItemWithLinks,
  navigationLinksDiffer: () => import_navigationEdit2.navigationLinksDiffer,
  recordGeneratedPage: () => recordGeneratedPage,
  scriptLinksByPage: () => scriptLinksByPage
});
module.exports = __toCommonJS(navigation_overrides_exports);
var import_adminShareConfig = require("../types/adminShareConfig");
var import_navigationEdit = require("../types/navigationEdit");
var import_navigationEdit2 = require("../types/navigationEdit");
function linkOrUndefined(value) {
  return value ? value : void 0;
}
function linksOfNavigationItem(item) {
  var _a, _b, _c, _d;
  const links = {};
  if (!item) {
    return links;
  }
  const prev = linkOrUndefined((_a = item.left) == null ? void 0 : _a.single);
  const next = linkOrUndefined((_b = item.right) == null ? void 0 : _b.single);
  const home = linkOrUndefined((_c = item.right) == null ? void 0 : _c.double);
  const parent = linkOrUndefined((_d = item.left) == null ? void 0 : _d.double);
  if (prev) {
    links.prev = prev;
  }
  if (next) {
    links.next = next;
  }
  if (home) {
    links.home = home;
  }
  if (parent) {
    links.parent = parent;
  }
  return links;
}
function navigationItemWithLinks(item, links) {
  if (!item) {
    return item;
  }
  const self = /* @__PURE__ */ new Set([item.name, item.page]);
  const target = (value) => {
    const link = linkOrUndefined(value);
    return link && !self.has(link) ? link : void 0;
  };
  const { left: _left, right: _right, ...rest } = item;
  const result = { ...rest };
  const prev = target(links.prev);
  const parent = target(links.parent);
  const next = target(links.next);
  const home = target(links.home);
  if (prev || parent) {
    result.left = {};
    if (prev) {
      result.left.single = prev;
    }
    if (parent) {
      result.left.double = parent;
    }
  }
  if (next || home) {
    result.right = {};
    if (next) {
      result.right.single = next;
    }
    if (home) {
      result.right.double = home;
    }
  }
  return result;
}
function isOverridableNavigationItem(item) {
  return !!item && !!item.page && item.name === item.page;
}
function scriptLinksByPage(navigation) {
  const result = {};
  for (const item of navigation) {
    if (isOverridableNavigationItem(item)) {
      result[item.page] = linksOfNavigationItem(item);
    }
  }
  return result;
}
function adminReplacedPageIds(pageConfig, panelTopic, adminOverridesScriptPages) {
  const result = [];
  for (const entry of pageConfig) {
    if (!entry || !entry.navigationAssignment || !entry.card) {
      continue;
    }
    const source = (0, import_navigationEdit.assignmentSourceOf)(entry, panelTopic);
    if (source !== "panel" && source !== "all") {
      continue;
    }
    const pageId = (0, import_adminShareConfig.isMainPageEntry)(entry) ? import_adminShareConfig.mainPageName : entry.uniqueName;
    if ((adminOverridesScriptPages || pageId === import_adminShareConfig.mainPageName) && pageId && !result.includes(pageId)) {
      result.push(pageId);
    }
  }
  return result;
}
function applyNavigationOverrides(navigation, overrides, panelTopic, generatedPageIds, replacedPageIds = []) {
  var _a, _b;
  const result = navigation.map((item) => item ? structuredClone(item) : item);
  const states = /* @__PURE__ */ new Map();
  const skipped = [];
  const generated = new Set(generatedPageIds);
  const replaced = new Set(replacedPageIds);
  for (const override of overrides) {
    if (!override || override.panelTopic !== panelTopic || !override.page) {
      continue;
    }
    if (generated.has(override.page)) {
      skipped.push({ page: override.page, reason: "generated" });
      continue;
    }
    if (replaced.has(override.page)) {
      skipped.push({ page: override.page, reason: "replaced" });
      continue;
    }
    const index = result.findIndex((item2) => item2 && item2.page === override.page);
    const item = index === -1 ? null : result[index];
    if (!item) {
      skipped.push({ page: override.page, reason: "missing" });
      continue;
    }
    if (!isOverridableNavigationItem(item)) {
      skipped.push({ page: override.page, reason: "unsupported" });
      continue;
    }
    const currentScriptLinks = linksOfNavigationItem(item);
    const navigationLinks = { ...(_a = override.navigation) != null ? _a : {} };
    let updated = navigationItemWithLinks(item, navigationLinks);
    if (updated && !updated.left && !updated.right && updated.name !== import_adminShareConfig.mainPageName) {
      updated = navigationItemWithLinks(item, { home: import_adminShareConfig.mainPageName });
    }
    result[index] = updated;
    states.set(override.page, {
      navigation: navigationLinks,
      scriptLinks: { ...(_b = override.scriptLinks) != null ? _b : {} },
      stale: (0, import_navigationEdit.isOverrideStale)(override, currentScriptLinks)
    });
  }
  return { navigation: result, states, skipped };
}
function recordGeneratedPage(target, pageId) {
  if (!pageId) {
    return;
  }
  if (!target.generatedPageIds) {
    target.generatedPageIds = [];
  }
  if (!target.generatedPageIds.includes(pageId)) {
    target.generatedPageIds.push(pageId);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adminReplacedPageIds,
  applyNavigationOverrides,
  isOverridableNavigationItem,
  isOverrideStale,
  linksOfNavigationItem,
  mergeNavigationOverride,
  navigationItemWithLinks,
  navigationLinksDiffer,
  recordGeneratedPage,
  scriptLinksByPage
});
//# sourceMappingURL=navigation-overrides.js.map
