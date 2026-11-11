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
var panelConfigExport_exports = {};
__export(panelConfigExport_exports, {
  PANEL_CONFIG_FORMAT: () => PANEL_CONFIG_FORMAT,
  PANEL_CONFIG_VERSION: () => PANEL_CONFIG_VERSION,
  buildPanelConfigExport: () => buildPanelConfigExport,
  effectivePageAssignment: () => effectivePageAssignment,
  exportMiscOfPanel: () => exportMiscOfPanel,
  exportPagesOfPanel: () => exportPagesOfPanel,
  exportScreensaverOfPanel: () => exportScreensaverOfPanel,
  pageSecretFields: () => pageSecretFields,
  pagesWithStrippedSecrets: () => pagesWithStrippedSecrets,
  panelConfigExportFileName: () => panelConfigExportFileName,
  panelConfigGroups: () => panelConfigGroups,
  panelPagesWithSecrets: () => panelPagesWithSecrets,
  panelSettingStateIds: () => panelSettingStateIds,
  panelSettingStates: () => panelSettingStates,
  stripPageForExport: () => stripPageForExport
});
module.exports = __toCommonJS(panelConfigExport_exports);
var import_adminShareConfig = require("./adminShareConfig");
const PANEL_CONFIG_FORMAT = "nspanel-lovelace-ui.panelConfig";
const PANEL_CONFIG_VERSION = 1;
const panelConfigGroups = ["pages", "screensaver", "misc"];
const panelSettingStates = [
  { id: "activated", type: "boolean" },
  { id: "tempOffset", type: "number" },
  { id: "isBuzzerAllowed", type: "boolean" },
  { id: "hideCards", type: "boolean" },
  { id: "detachLeft", type: "boolean" },
  { id: "detachRight", type: "boolean" },
  { id: "mainNavigationPoint", type: "string" },
  { id: "screenSaver.timeout", type: "number" },
  { id: "screenSaver.layout", type: "number" },
  { id: "screenSaver.rotationTime", type: "number" },
  { id: "screenSaver.doubleClick", type: "boolean" },
  { id: "screenSaver.infoIcon", type: "string" },
  { id: "dim.standby", type: "number" },
  { id: "dim.active", type: "number" },
  { id: "dim.dayMode", type: "boolean" },
  { id: "dim.nightStandby", type: "number" },
  { id: "dim.nightActive", type: "number" },
  { id: "dim.nightHourStart", type: "number" },
  { id: "dim.nightHourEnd", type: "number" },
  { id: "dim.schedule", type: "boolean" }
];
function panelSettingStateIds(panelId, namespace) {
  const out = {};
  for (const s of panelSettingStates) {
    out[s.id] = `${namespace}.panels.${panelId}.cmd.${s.id}`;
  }
  return out;
}
function effectivePageAssignment(page, topic) {
  const list = Array.isArray(page.navigationAssignment) ? page.navigationAssignment : [];
  const all = list.find((a) => a && a.topic === import_adminShareConfig.ALL_PANELS_SPECIAL_ID);
  const own = list.find((a) => a && a.topic === topic);
  if (own) {
    if (!own.navigation && all) {
      return void 0;
    }
    return { kind: "own", navigation: own.navigation };
  }
  if (all) {
    return { kind: "all", navigation: all.navigation };
  }
  return void 0;
}
function isExcludedAllPage(page, topic) {
  const list = Array.isArray(page.navigationAssignment) ? page.navigationAssignment : [];
  return list.some((a) => a && a.topic === import_adminShareConfig.ALL_PANELS_SPECIAL_ID) && list.some((a) => a && a.topic === topic && !a.navigation);
}
function pageSecretFields(page) {
  const out = [];
  if (page.card === "cardAlarm" && page.pin != null && page.pin !== -1) {
    out.push("pin");
  }
  if (page.card === "cardQR" && page.qrPass) {
    out.push("qrPass");
  }
  return out;
}
function stripPageForExport(page, includeSecrets = false) {
  const copy = structuredClone(page);
  delete copy.navigationAssignment;
  if (includeSecrets) {
    return { page: copy, stripped: [] };
  }
  const stripped = pageSecretFields(copy);
  for (const field of stripped) {
    Reflect.deleteProperty(copy, field);
  }
  return { page: copy, stripped };
}
function exportPagesOfPanel(native, topic, includeSecrets = false) {
  var _a;
  const entries = ((_a = native.pageConfig) != null ? _a : []).filter(
    (p) => !!p && typeof p.uniqueName === "string"
  );
  const pages = [];
  const names = /* @__PURE__ */ new Set();
  const push = (entry, assignment, navigation) => {
    const { page, stripped } = stripPageForExport(entry, includeSecrets);
    const out = { page, assignment };
    if (navigation) {
      out.navigation = structuredClone(navigation);
    }
    if (stripped.length) {
      out.strippedSecrets = stripped;
    }
    pages.push(out);
    names.add(entry.uniqueName);
  };
  for (const entry of entries) {
    const effective = effectivePageAssignment(entry, topic);
    if (effective) {
      push(entry, effective.kind, effective.navigation);
    }
  }
  for (const exported of [...pages]) {
    const link = exported.page;
    if (!(0, import_adminShareConfig.isPageLinkEntry)(link) || names.has(link.target)) {
      continue;
    }
    const target = entries.find((e) => e.uniqueName === link.target);
    if (target) {
      push(target, "none");
    }
  }
  return {
    pages,
    excludedAllPages: entries.filter((e) => isExcludedAllPage(e, topic)).map((e) => e.uniqueName)
  };
}
function exportScreensaverOfPanel(native, topic) {
  var _a, _b, _c;
  const hit = ((_a = native.screensaverConfig) != null ? _a : []).find((e) => e && Array.isArray(e.panels) && e.panels.includes(topic));
  if (!hit) {
    return { entry: null, notify: [] };
  }
  const entry = structuredClone((0, import_adminShareConfig.normalizeScreensaverEntry)(hit));
  entry.panels = [];
  const ids = new Set(((_b = entry.notify) != null ? _b : []).filter((id) => typeof id === "string"));
  const notify = ((_c = native.screensaverNotify) != null ? _c : []).filter((n) => n && ids.has(n.id)).map((n) => structuredClone(n));
  return { entry, notify };
}
function isPanelSettingValue(val) {
  return typeof val === "boolean" || typeof val === "number" || typeof val === "string";
}
function exportMiscOfPanel(native, panel, states) {
  var _a, _b;
  const topic = (_a = panel.topic) != null ? _a : "";
  const out = {
    navigationOverrides: ((_b = native.navigationOverrides) != null ? _b : []).filter((o) => o && o.panelTopic === topic).map((o) => {
      var _a2, _b2;
      return {
        page: o.page,
        navigation: structuredClone((_a2 = o.navigation) != null ? _a2 : {}),
        scriptLinks: structuredClone((_b2 = o.scriptLinks) != null ? _b2 : {})
      };
    }),
    states: {}
  };
  if (panel.buttonLeft !== void 0) {
    out.buttonLeft = structuredClone(panel.buttonLeft);
  }
  if (panel.buttonRight !== void 0) {
    out.buttonRight = structuredClone(panel.buttonRight);
  }
  if (panel.noScript) {
    out.noScript = true;
  }
  for (const s of panelSettingStates) {
    const val = states[s.id];
    if (isPanelSettingValue(val) && typeof val === s.type) {
      out.states[s.id] = val;
    }
  }
  return out;
}
function buildPanelConfigExport(input) {
  var _a, _b, _c;
  const { native, panel, states } = input;
  const topic = (_a = panel.topic) != null ? _a : "";
  const out = {
    format: PANEL_CONFIG_FORMAT,
    version: PANEL_CONFIG_VERSION,
    secretsIncluded: input.includeSecrets === true,
    exportedAt: input.now.toISOString(),
    source: {
      id: (_b = panel.id) != null ? _b : "",
      topic,
      name: (_c = panel.name) != null ? _c : "",
      model: panel.model || "eu",
      kind: panel.kind === "web" ? "web" : "tasmota"
    },
    groups: {
      pages: exportPagesOfPanel(native, topic, input.includeSecrets === true),
      screensaver: exportScreensaverOfPanel(native, topic),
      misc: exportMiscOfPanel(native, panel, states)
    }
  };
  if (input.adapterVersion) {
    out.adapterVersion = input.adapterVersion;
  }
  return out;
}
function panelConfigExportFileName(panelName, now) {
  const safe = panelName.trim().replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "panel";
  const pad = (n) => String(n).padStart(2, "0");
  return `nspanel-${safe}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}
function panelPagesWithSecrets(native, topic) {
  return exportPagesOfPanel(native, topic).pages.filter((p) => {
    var _a;
    return (_a = p.strippedSecrets) == null ? void 0 : _a.length;
  }).map((p) => {
    var _a;
    return { uniqueName: p.page.uniqueName, fields: (_a = p.strippedSecrets) != null ? _a : [] };
  });
}
function pagesWithStrippedSecrets(data) {
  return data.groups.pages.pages.filter((p) => {
    var _a;
    return (_a = p.strippedSecrets) == null ? void 0 : _a.length;
  }).map((p) => p.page.uniqueName);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PANEL_CONFIG_FORMAT,
  PANEL_CONFIG_VERSION,
  buildPanelConfigExport,
  effectivePageAssignment,
  exportMiscOfPanel,
  exportPagesOfPanel,
  exportScreensaverOfPanel,
  pageSecretFields,
  pagesWithStrippedSecrets,
  panelConfigExportFileName,
  panelConfigGroups,
  panelPagesWithSecrets,
  panelSettingStateIds,
  panelSettingStates,
  stripPageForExport
});
//# sourceMappingURL=panelConfigExport.js.map
