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
var panelTopicMigration_exports = {};
__export(panelTopicMigration_exports, {
  migratePanelTopic: () => migratePanelTopic
});
module.exports = __toCommonJS(panelTopicMigration_exports);
function migratePage(page, oldTopic, newTopic) {
  const list = page == null ? void 0 : page.navigationAssignment;
  if (!Array.isArray(list) || !list.some((a) => a && a.topic === oldTopic)) {
    return void 0;
  }
  const hasNew = list.some((a) => a && a.topic === newTopic);
  const navigationAssignment = hasNew ? list.filter((a) => !a || a.topic !== oldTopic) : list.map((a) => a && a.topic === oldTopic ? { ...a, topic: newTopic } : a);
  return { ...page, navigationAssignment };
}
function migrateScreensaver(entry, oldTopic, newTopic) {
  const panels = entry == null ? void 0 : entry.panels;
  if (!Array.isArray(panels) || !panels.includes(oldTopic)) {
    return void 0;
  }
  const next = panels.includes(newTopic) ? panels.filter((t) => t !== oldTopic) : panels.map((t) => t === oldTopic ? newTopic : t);
  return { ...entry, panels: next };
}
function migratePanelTopic(native, oldTopic, newTopic) {
  const result = {};
  if (!oldTopic || !newTopic || oldTopic === newTopic) {
    return result;
  }
  if (Array.isArray(native.pageConfig)) {
    let changed = false;
    const pages = native.pageConfig.map((page) => {
      const moved = migratePage(page, oldTopic, newTopic);
      if (moved) {
        changed = true;
        return moved;
      }
      return page;
    });
    if (changed) {
      result.pageConfig = pages;
    }
  }
  if (Array.isArray(native.screensaverConfig)) {
    let changed = false;
    const entries = native.screensaverConfig.map((entry) => {
      const moved = migrateScreensaver(entry, oldTopic, newTopic);
      if (moved) {
        changed = true;
        return moved;
      }
      return entry;
    });
    if (changed) {
      result.screensaverConfig = entries;
    }
  }
  if (Array.isArray(native.navigationOverrides)) {
    const list = native.navigationOverrides;
    if (list.some((o) => o && o.panelTopic === oldTopic)) {
      const pagesOfNew = new Set(list.filter((o) => o && o.panelTopic === newTopic).map((o) => o.page));
      result.navigationOverrides = list.filter((o) => !o || o.panelTopic !== oldTopic || !pagesOfNew.has(o.page)).map((o) => o && o.panelTopic === oldTopic ? { ...o, panelTopic: newTopic } : o);
    }
  }
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  migratePanelTopic
});
//# sourceMappingURL=panelTopicMigration.js.map
