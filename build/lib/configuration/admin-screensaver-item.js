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
var admin_screensaver_item_exports = {};
__export(admin_screensaver_item_exports, {
  hexToScriptRGB: () => hexToScriptRGB,
  screensaverFallbackIcon: () => screensaverFallbackIcon,
  screensaverItemToScript: () => screensaverItemToScript,
  screensaverRawToScript: () => screensaverRawToScript
});
module.exports = __toCommonJS(admin_screensaver_item_exports);
var import_adminShareConfig = require("../types/adminShareConfig");
var import_Color = require("../const/Color");
var import_page_item_defaults = require("../const/page-item-defaults");
const screensaverFallbackIcon = "help-circle-outline";
function hexToScriptRGB(hex) {
  if (typeof hex !== "string" || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return void 0;
  }
  const rgb = import_Color.Color.ConvertHexToRgb(hex);
  return { red: rgb.r, green: rgb.g, blue: rgb.b };
}
function screensaverItemToScript(item, area, info = {}) {
  var _a, _b, _c, _d, _e, _f;
  if (item.raw) {
    return screensaverRawToScript(item.raw, area);
  }
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
function screensaverRawToScript(raw, area) {
  const config = structuredClone(raw.config);
  if (raw.format === "native") {
    return { type: "native", native: { ...config, modeScr: area } };
  }
  if (config.type === "template") {
    config.modeScr = area;
  } else if (config.type === "native" && (0, import_adminShareConfig.isRawItemObject)(config.native)) {
    config.native = { ...config.native, modeScr: area };
  }
  return config;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  hexToScriptRGB,
  screensaverFallbackIcon,
  screensaverItemToScript,
  screensaverRawToScript
});
//# sourceMappingURL=admin-screensaver-item.js.map
