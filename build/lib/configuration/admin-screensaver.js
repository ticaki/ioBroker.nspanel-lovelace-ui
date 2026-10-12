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
  hexToScriptRGB: () => hexToScriptRGB,
  isScreensaverPage: () => isScreensaverPage,
  objectNameOf: () => objectNameOf,
  screensaverFallbackIcon: () => screensaverFallbackIcon,
  screensaverItemToScript: () => screensaverItemToScript,
  screensaverMrIconToScript: () => screensaverMrIconToScript,
  screensaverStateIds: () => screensaverStateIds
});
module.exports = __toCommonJS(admin_screensaver_exports);
var import_adminShareConfig = require("../types/adminShareConfig");
var import_Color = require("../const/Color");
var import_page_item_defaults = require("../const/page-item-defaults");
const adminScreensaverPageId = "scr-admin";
const screensaverFallbackIcon = "help-circle-outline";
function hexToScriptRGB(hex) {
  if (typeof hex !== "string" || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return void 0;
  }
  const rgb = import_Color.Color.ConvertHexToRgb(hex);
  return { red: rgb.r, green: rgb.g, blue: rgb.b };
}
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
    if (item && !item.template && item.state) {
      ids.add(item.state);
    }
  }
  return [...ids];
}
function allItems(entry) {
  var _a, _b, _c;
  return [entry.favorit, entry.alternate, ...(_a = entry.left) != null ? _a : [], ...(_b = entry.bottom) != null ? _b : [], ...(_c = entry.indicator) != null ? _c : []];
}
function screensaverItemToScript(item, area, info = {}) {
  var _a, _b, _c, _d, _e, _f;
  if (item.template) {
    const element2 = {
      type: "template",
      template: item.template,
      dpInit: (_a = item.state) != null ? _a : "",
      modeScr: area
    };
    if (item.enabled) {
      element2.enabled = item.enabled;
    }
    if (item.visibleCondition) {
      element2.visibleCondition = item.visibleCondition;
    }
    return element2;
  }
  let iconOn = item.iconOn || null;
  let iconOff = item.iconOff || null;
  if (!iconOn && !((_b = item.iconSelect) == null ? void 0 : _b.length)) {
    const defaults = info.role || info.channelRole ? (0, import_page_item_defaults.getScreensaverItemDefaultsByRole)((_c = info.role) != null ? _c : "", info.channelRole) : null;
    iconOn = (defaults == null ? void 0 : defaults.iconOn) || screensaverFallbackIcon;
    iconOff = iconOff || (defaults == null ? void 0 : defaults.iconOff) || null;
  }
  const element = {
    type: "script",
    ScreensaverEntity: item.state,
    ScreensaverEntityText: item.headline || info.name || "",
    ScreensaverEntityIconOn: iconOn,
    ScreensaverEntityIconOff: iconOff,
    ScreensaverEntityOnText: (_d = item.textOn) != null ? _d : null,
    ScreensaverEntityOffText: (_e = item.textOff) != null ? _e : null
  };
  if (item.unit !== void 0) {
    element.ScreensaverEntityUnitText = item.unit;
  }
  if (typeof item.factor === "number") {
    element.ScreensaverEntityFactor = item.factor;
  }
  if (typeof item.decimals === "number") {
    element.ScreensaverEntityDecimalPlaces = item.decimals;
  }
  if (item.dateFormat) {
    element.ScreensaverEntityDateFormat = item.dateFormat;
  }
  const onColor = hexToScriptRGB(item.colorOn);
  if (onColor) {
    element.ScreensaverEntityOnColor = onColor;
  }
  const offColor = hexToScriptRGB(item.colorOff);
  if (offColor) {
    element.ScreensaverEntityOffColor = offColor;
  }
  if (item.colorScale) {
    element.ScreensaverEntityIconColor = item.colorScale;
  } else if (item.colorState) {
    element.ScreensaverEntityIconColor = item.colorState;
  }
  if ((_f = item.iconSelect) == null ? void 0 : _f.length) {
    element.ScreensaverEntityIconSelect = item.iconSelect.map((s) => ({ icon: s.icon, value: s.value }));
  }
  if (item.enabled) {
    element.ScreensaverEntityEnabled = item.enabled;
  }
  if (item.visibleCondition) {
    element.ScreensaverEntityVisibleCondition = item.visibleCondition;
  }
  if (area === "indicator" && item.action) {
    switch (item.action.kind) {
      case "button":
        element.ScreensaverEntityButton = item.action.state || null;
        break;
      case "switch":
        element.ScreensaverEntitySwitch = item.action.state || null;
        break;
      case "navigate":
        element.ScreensaverEntityNaviToPage = item.action.page || null;
        break;
    }
  }
  return element;
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
    ScreensaverEntityOnColor: hexToScriptRGB(cfg.onColor),
    ScreensaverEntityOffColor: hexToScriptRGB(cfg.offColor)
  };
  return element;
}
function buildScreensaverScriptConfig(entry, panelTopic, states = {}) {
  var _a, _b, _c;
  const convert = (item, area) => {
    var _a2;
    return item ? screensaverItemToScript(item, area, (_a2 = states[item.state]) != null ? _a2 : {}) : void 0;
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
    notifyScreensaverEntity: void 0,
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
  screensaverStateIds
});
//# sourceMappingURL=admin-screensaver.js.map
