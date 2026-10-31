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
var admin_screensaver_exports = {};
__export(admin_screensaver_exports, {
  adminScreensaverPageId: () => adminScreensaverPageId,
  applyScreensaverEntry: () => applyScreensaverEntry,
  buildScreensaverScriptConfig: () => buildScreensaverScriptConfig,
  findScreensaverEntry: () => findScreensaverEntry,
  hexToScriptRGB: () => import_admin_screensaver_item2.hexToScriptRGB,
  isScreensaverPage: () => isScreensaverPage,
  objectNameOf: () => objectNameOf,
  screensaverFallbackIcon: () => import_admin_screensaver_item2.screensaverFallbackIcon,
  screensaverItemToScript: () => import_admin_screensaver_item2.screensaverItemToScript,
  screensaverMrIconToScript: () => screensaverMrIconToScript,
  screensaverNotifyToScript: () => screensaverNotifyToScript,
  screensaverRawToScript: () => import_admin_screensaver_item2.screensaverRawToScript,
  screensaverStateIds: () => screensaverStateIds
});
module.exports = __toCommonJS(admin_screensaver_exports);
var import_adminShareConfig = require("../types/adminShareConfig");
var import_Color = require("../const/Color");
var import_admin_screensaver_item = require("./admin-screensaver-item");
var import_admin_screensaver_item2 = require("./admin-screensaver-item");
const adminScreensaverPageId = "scr-admin";
function objectNameOf(obj, lang) {
  var _a;
  const raw = (_a = obj == null ? void 0 : obj.common) == null ? void 0 : _a.name;
  if (typeof raw === "string") {
    return raw;
  }
  if (raw && typeof raw === "object") {
    const map = raw;
    return map[lang] || map.en || Object.values(map)[0] || "";
  }
  return "";
}
function screensaverStateIds(entry) {
  const ids = /* @__PURE__ */ new Set();
  for (const item of allItems(entry)) {
    if (item && !item.raw && !item.template && item.state) {
      ids.add(item.state);
    }
  }
  return [...ids];
}
function allItems(entry) {
  var _a, _b, _c;
  return [entry.favorit, entry.alternate, ...(_a = entry.left) != null ? _a : [], ...(_b = entry.bottom) != null ? _b : [], ...(_c = entry.indicator) != null ? _c : []];
}
function screensaverMrIconToScript(cfg) {
  var _a;
  if (!cfg || !cfg.entity && !cfg.value) {
    return void 0;
  }
  const element = {
    type: "script",
    ScreensaverEntity: cfg.entity || null,
    ScreensaverEntityIconOn: cfg.iconOn || null,
    ScreensaverEntityIconOff: cfg.iconOff || null,
    ScreensaverEntityIconSelect: ((_a = cfg.iconSelect) == null ? void 0 : _a.length) ? Object.fromEntries(cfg.iconSelect.map((s) => [s.value, s.icon])) : null,
    ScreensaverEntityValue: cfg.value || null,
    ScreensaverEntityValueDecimalPlace: typeof cfg.valueDecimals === "number" ? cfg.valueDecimals : null,
    ScreensaverEntityValueUnit: cfg.valueUnit || null,
    ScreensaverEntityOnColor: (0, import_admin_screensaver_item.hexToScriptRGB)(cfg.onColor),
    ScreensaverEntityOffColor: (0, import_admin_screensaver_item.hexToScriptRGB)(cfg.offColor)
  };
  return element;
}
function screensaverNotifyToScript(cfg) {
  var _a, _b, _c, _d, _e;
  const enabled = ((_a = cfg == null ? void 0 : cfg.enabled) != null ? _a : []).map((e) => e.trim()).filter((e) => !!e);
  if (!cfg || enabled.length === 0) {
    return void 0;
  }
  const condition = (_b = cfg.visibleCondition) == null ? void 0 : _b.trim();
  const element = {
    type: "script",
    Priority: typeof cfg.priority === "number" ? cfg.priority : 99,
    Headline: (_c = cfg.headline) != null ? _c : "",
    Text: (_d = cfg.text) != null ? _d : "",
    Enabled: enabled.length === 1 ? enabled[0] : enabled,
    ...condition ? { VisibleCondition: condition } : {}
  };
  if (cfg.headlinePrefix) {
    element.HeadlinePrefix = cfg.headlinePrefix;
  }
  if (cfg.headlineUnit) {
    element.HeadlineUnit = cfg.headlineUnit;
  }
  if (cfg.headlineIcon) {
    element.HeadlineIcon = cfg.headlineIcon;
  }
  if (cfg.textPrefix) {
    element.TextPrefix = cfg.textPrefix;
  }
  if (cfg.textSuffix) {
    element.TextSuffix = cfg.textSuffix;
  }
  if (cfg.dismissible) {
    element.isDismissiblePerEvent = true;
    if ((_e = cfg.dismissibleId) == null ? void 0 : _e.trim()) {
      element.dismissibleIDGlobal = cfg.dismissibleId.trim();
    }
  }
  if (cfg.buzzer === true || typeof cfg.buzzer === "string" && cfg.buzzer.trim()) {
    element.buzzer = cfg.buzzer === true ? true : String(cfg.buzzer).trim();
  }
  return element;
}
function buildScreensaverScriptConfig(entry, panelTopic, states = {}, notifyList = []) {
  var _a, _b, _c;
  const convert = (item, area) => {
    var _a2;
    return item ? (0, import_admin_screensaver_item.screensaverItemToScript)(item, area, item.raw ? {} : (_a2 = states[item.state]) != null ? _a2 : {}) : void 0;
  };
  const present = (list) => list.filter((e) => !!e);
  const favorit = convert(entry.favorit, "favorit");
  const alternate = convert(entry.alternate, "alternate");
  const config = {
    version: "admin",
    scriptName: `admin.screensaver.${entry.name}`,
    panelName: void 0,
    panelTopic,
    weatherEntity: entry.weatherEntity,
    weatherAddDefaultItems: entry.weatherAddDefaultItems,
    favoritScreensaverEntity: favorit ? [favorit] : [],
    alternateScreensaverEntity: alternate ? [alternate] : [],
    // left and indicator keep their gaps - the panel places them by index
    leftScreensaverEntity: ((_a = entry.left) != null ? _a : []).map((i) => convert(i, "left")),
    bottomScreensaverEntity: present(((_b = entry.bottom) != null ? _b : []).map((i) => convert(i, "bottom"))),
    indicatorScreensaverEntity: ((_c = entry.indicator) != null ? _c : []).map((i) => convert(i, "indicator")),
    mrIcon1ScreensaverEntity: screensaverMrIconToScript(entry.mrIcon1),
    mrIcon2ScreensaverEntity: screensaverMrIconToScript(entry.mrIcon2),
    notifyScreensaverEntity: (0, import_adminShareConfig.screensaverNotifyOfEntry)(entry, notifyList).map((n) => screensaverNotifyToScript(n)).filter((n) => !!n),
    // the colors the adapter resolves from its global settings (config manager getIconColor)
    defaultOnColor: import_Color.Color.on,
    defaultOffColor: import_Color.Color.off,
    defaultBackgroundColor: void 0,
    pages: [],
    subPages: [],
    buttonLeft: null,
    buttonRight: null,
    advancedOptions: {
      screensaverSwipe: !!entry.screensaverSwipe,
      screensaverIndicatorButtons: !!entry.screensaverIndicatorButtons
    }
  };
  return config;
}
function findScreensaverEntry(entries, topic) {
  const hits = (entries != null ? entries : []).filter((e) => e && Array.isArray(e.panels) && e.panels.includes(topic));
  return { entry: hits[0], others: hits.slice(1).map((e) => e.name) };
}
function applyScreensaverEntry(page, entry) {
  var _a, _b, _c, _d, _e;
  page.uniqueID = adminScreensaverPageId;
  const config = page.config;
  config.card = (0, import_adminShareConfig.screensaverCardOfMode)(entry.mode);
  config.mode = entry.mode;
  config.rotationTime = typeof entry.rotationTime === "number" && entry.rotationTime > 0 ? entry.rotationTime : 0;
  config.screensaverSwipe = !!entry.screensaverSwipe;
  config.screensaverIndicatorButtons = !!entry.screensaverIndicatorButtons;
  for (const raw of (_a = page.pageItems) != null ? _a : []) {
    const item = raw;
    const format = (_e = (_d = (_c = (_b = item == null ? void 0 : item.data) == null ? void 0 : _b.entity2) == null ? void 0 : _c.dateFormat) == null ? void 0 : _d.constVal) == null ? void 0 : _e.format;
    if (!format) {
      continue;
    }
    if (item.modeScr === "time" && entry.clockFormat) {
      format.hour12 = entry.clockFormat === "12h";
    } else if (item.modeScr === "date") {
      if (entry.weekdayFormat) {
        format.weekday = entry.weekdayFormat;
      }
      if (entry.monthFormat) {
        format.month = entry.monthFormat;
      }
      if (entry.yearFormat) {
        format.year = entry.yearFormat;
      }
    }
  }
}
function isScreensaverPage(page) {
  var _a;
  const card = (_a = page == null ? void 0 : page.config) == null ? void 0 : _a.card;
  return card === "screensaver" || card === "screensaver2" || card === "screensaver3";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adminScreensaverPageId,
  applyScreensaverEntry,
  buildScreensaverScriptConfig,
  findScreensaverEntry,
  hexToScriptRGB,
  isScreensaverPage,
  objectNameOf,
  screensaverFallbackIcon,
  screensaverItemToScript,
  screensaverMrIconToScript,
  screensaverNotifyToScript,
  screensaverRawToScript,
  screensaverStateIds
});
//# sourceMappingURL=admin-screensaver.js.map
