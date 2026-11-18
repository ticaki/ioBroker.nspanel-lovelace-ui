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
var popupNotify3_exports = {};
__export(popupNotify3_exports, {
  NOTIFY3_DEFAULT_ICON_LEFT: () => NOTIFY3_DEFAULT_ICON_LEFT,
  NOTIFY3_DEFAULT_ICON_NEXT: () => NOTIFY3_DEFAULT_ICON_NEXT,
  NOTIFY3_DEFAULT_ICON_RIGHT: () => NOTIFY3_DEFAULT_ICON_RIGHT,
  NOTIFY3_FALLBACK_ICON: () => NOTIFY3_FALLBACK_ICON,
  NOTIFY3_TEXT: () => NOTIFY3_TEXT,
  NOTIFY3_TEXT_MAX_BYTES: () => NOTIFY3_TEXT_MAX_BYTES,
  POPUP_NOTIFY3: () => POPUP_NOTIFY3,
  POPUP_NOTIFY3_ICONS: () => POPUP_NOTIFY3_ICONS,
  POPUP_NOTIFY3_MIN_VERSION: () => POPUP_NOTIFY3_MIN_VERSION,
  POPUP_NOTIFY3_MODELS: () => POPUP_NOTIFY3_MODELS,
  cutUtf8: () => cutUtf8,
  notify3Font: () => notify3Font,
  notify3Icon: () => notify3Icon,
  notify3Text: () => notify3Text,
  popupNotify3Buttons: () => popupNotify3Buttons,
  popupNotify3Message: () => popupNotify3Message,
  supportsPopupNotify3: () => supportsPopupNotify3,
  usePopupNotify3: () => usePopupNotify3
});
module.exports = __toCommonJS(popupNotify3_exports);
var import_Color = require("../const/Color");
var import_icon_mapping = require("../const/icon_mapping");
var import_text_width = require("../const/text-width");
var import_tools = require("../const/tools");
const POPUP_NOTIFY3 = "popupNotify3";
const POPUP_NOTIFY3_MIN_VERSION = "6.2.0";
const POPUP_NOTIFY3_MODELS = /* @__PURE__ */ new Set(["eu", "us-l", "us-p"]);
const POPUP_NOTIFY3_ICONS = [
  // general
  "alert",
  "information-outline",
  "doorbell",
  "package-variant-closed",
  "mailbox-up",
  "phone-ring",
  "shield-alert",
  "alarm-light",
  "window-open-variant",
  "door-open",
  "garage-open",
  "ev-station",
  "power-socket-de",
  "battery-alert-variant-outline",
  // appointments
  "calendar",
  "calendar-alert",
  "calendar-clock",
  "bell-ring",
  "trash-can",
  // offline
  "wifi-off",
  "web-off",
  "cloud-off-outline",
  "lan-disconnect",
  // occupied
  "cancel",
  "toilet",
  "door-closed-lock",
  // weather
  "weather-rainy",
  "weather-lightning",
  "weather-lightning-rainy",
  "weather-hail",
  "weather-pouring",
  "weather-snowy-heavy",
  "weather-windy",
  "weather-tornado",
  "home-flood",
  "snowflake-alert",
  "sun-thermometer",
  "weather-fog",
  // appliances done / failed
  "washing-machine",
  "tumble-dryer",
  "dishwasher",
  "washing-machine-alert",
  "tumble-dryer-alert",
  "dishwasher-alert",
  "fridge-alert",
  "water-boiler-alert",
  "robot-vacuum-alert",
  "radiator-off",
  // danger
  "water-alert",
  "smoke-detector-alert",
  "fire-alert"
];
const ICON_SET = new Set(POPUP_NOTIFY3_ICONS);
const BUTTON_FONT = 4;
const NOTIFY3_DEFAULT_ICON_LEFT = "close-thick";
const NOTIFY3_DEFAULT_ICON_RIGHT = "check-bold";
const NOTIFY3_DEFAULT_ICON_NEXT = "arrow-right-bold";
const LANDSCAPE = { width: 464, lines: { 0: 2, 2: 1, 3: 1 } };
const PORTRAIT = { width: 304, lines: { 0: 4, 2: 3, 3: 2 } };
const NOTIFY3_TEXT = {
  eu: LANDSCAPE,
  "us-l": LANDSCAPE,
  "us-p": PORTRAIT,
  "web-l": { ...LANDSCAPE, width: 624 },
  "web-p": PORTRAIT
};
const NOTIFY3_TEXT_MAX_BYTES = 199;
function supportsPopupNotify3(target) {
  if (target.isVirtual) {
    return true;
  }
  return POPUP_NOTIFY3_MODELS.has(target.model) && !!target.displayVersion && (0, import_tools.isVersionGreaterOrEqual)(target.displayVersion, POPUP_NOTIFY3_MIN_VERSION);
}
function isKnownIcon(name) {
  return import_icon_mapping.Icons.iconMap.has(name);
}
const NOTIFY3_FALLBACK_ICON = "information-outline";
function notify3Icon(details, target) {
  const icon = typeof details.icon === "string" ? details.icon.trim() : "";
  if (icon && isKnownIcon(icon) && (target.isVirtual || ICON_SET.has(icon))) {
    return { icon };
  }
  return {
    icon: NOTIFY3_FALLBACK_ICON,
    warning: `popupNotify3: icon '${icon}' not available for the large notification - showing ${NOTIFY3_FALLBACK_ICON}`
  };
}
function usePopupNotify3(details, target) {
  if ((details == null ? void 0 : details.largeIcon) !== true) {
    return { use: false };
  }
  if (!supportsPopupNotify3(target)) {
    return {
      use: false,
      warning: `popupNotify3: largeIcon needs TFT ${POPUP_NOTIFY3_MIN_VERSION} or newer (panel: ${target.model} ${target.displayVersion || "unknown"}) - notification shown as classic popup`
    };
  }
  const { warning } = notify3Icon(details, target);
  return warning ? { use: true, warning } : { use: true };
}
function notify3Font(textSize) {
  let n = Number.NaN;
  if (typeof textSize === "number") {
    n = textSize;
  } else if (typeof textSize === "string" && textSize.trim() !== "") {
    n = Number(textSize);
  }
  if (!Number.isFinite(n)) {
    return 3;
  }
  if (n < 1) {
    return 0;
  }
  if (n < 3) {
    return 2;
  }
  return 3;
}
function cutUtf8(text, maxBytes) {
  if (Buffer.byteLength(text, "utf8") <= maxBytes) {
    return text;
  }
  const cps = Array.from(text);
  let bytes = 0;
  let n = 0;
  for (const ch of cps) {
    const b = Buffer.byteLength(ch, "utf8");
    if (bytes + b > maxBytes) {
      break;
    }
    bytes += b;
    n++;
  }
  return cps.slice(0, n).join("").replace(/\r$/, "");
}
function notify3Text(text, font, model) {
  const layout = NOTIFY3_TEXT[model];
  const clean = text.replaceAll("/r/n", "\n").replaceAll("~", "-");
  const maxLines = layout.lines[font];
  const out = maxLines <= 1 ? (0, import_text_width.fitText)(clean.replace(/\r?\n/g, " "), font, model, layout.width) : (0, import_text_width.wrapText)(clean, font, model, layout.width, maxLines).join("\r\n");
  return cutUtf8(out, NOTIFY3_TEXT_MAX_BYTES);
}
function buttonIcon(name, fallback, side, target, warnings) {
  const wanted = typeof name === "string" ? name.trim() : "";
  if (!wanted) {
    return fallback;
  }
  const glyph = isKnownIcon(wanted) ? import_icon_mapping.Icons.GetIcon(wanted) : "";
  const cp = glyph.codePointAt(0);
  if (cp === void 0 || !target.isVirtual && !(0, import_text_width.hasGlyph)(cp, BUTTON_FONT, target.model)) {
    warnings.push(
      `popupNotify3: unknown ${side} '${wanted}' - ${fallback ? `'${fallback}' used instead` : "button hidden"}`
    );
    return fallback;
  }
  return wanted;
}
function popupNotify3Buttons(details, queueLength, target) {
  const warnings = [];
  const leftDefault = details.buttonLeft ? NOTIFY3_DEFAULT_ICON_LEFT : queueLength > 1 ? NOTIFY3_DEFAULT_ICON_NEXT : "";
  const rightDefault = details.buttonRight ? NOTIFY3_DEFAULT_ICON_RIGHT : "";
  return {
    left: buttonIcon(details.buttonLeftIcon, leftDefault, "buttonLeftIcon", target, warnings),
    right: buttonIcon(details.buttonRightIcon, rightDefault, "buttonRightIcon", target, warnings),
    warnings
  };
}
function dec565(rgb, def) {
  return String(import_Color.Color.rgb_dec565(rgb != null ? rgb : def));
}
function popupNotify3Message(input) {
  var _a;
  const { details, target } = input;
  const font = notify3Font(details.textSize);
  const buttons = popupNotify3Buttons(details, input.queueLength, target);
  const payload = (0, import_tools.getPayloadRemoveTilde)(
    "entityUpdateDetail",
    input.id,
    import_icon_mapping.Icons.GetIcon(notify3Icon(details, target).icon),
    dec565(details.iconColor, import_Color.Color.White),
    notify3Text((_a = details.text) != null ? _a : "", font, target.model),
    dec565(details.colorText, import_Color.Color.White),
    String(font),
    buttons.left ? import_icon_mapping.Icons.GetIcon(buttons.left) : "",
    buttons.left ? dec565(details.colorButtonLeft, import_Color.Color.Yellow) : "",
    buttons.right ? import_icon_mapping.Icons.GetIcon(buttons.right) : "",
    buttons.right ? dec565(details.colorButtonRight, import_Color.Color.Green) : "",
    String(input.timeout)
  );
  return { payload, warnings: buttons.warnings };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NOTIFY3_DEFAULT_ICON_LEFT,
  NOTIFY3_DEFAULT_ICON_NEXT,
  NOTIFY3_DEFAULT_ICON_RIGHT,
  NOTIFY3_FALLBACK_ICON,
  NOTIFY3_TEXT,
  NOTIFY3_TEXT_MAX_BYTES,
  POPUP_NOTIFY3,
  POPUP_NOTIFY3_ICONS,
  POPUP_NOTIFY3_MIN_VERSION,
  POPUP_NOTIFY3_MODELS,
  cutUtf8,
  notify3Font,
  notify3Icon,
  notify3Text,
  popupNotify3Buttons,
  popupNotify3Message,
  supportsPopupNotify3,
  usePopupNotify3
});
//# sourceMappingURL=popupNotify3.js.map
