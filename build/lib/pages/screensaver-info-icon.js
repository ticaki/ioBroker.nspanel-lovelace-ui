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
var screensaver_info_icon_exports = {};
__export(screensaver_info_icon_exports, {
  POPUP_NOTIFY_TEXT_WIDTH: () => POPUP_NOTIFY_TEXT_WIDTH,
  SCREENSAVER_CLOCK_BLINK_MIN_VERSION: () => SCREENSAVER_CLOCK_BLINK_MIN_VERSION,
  SCREENSAVER_INFO_FONT_DEFAULT: () => import_screensaver_info_font.SCREENSAVER_INFO_FONT_DEFAULT,
  SCREENSAVER_INFO_FONT_STATES: () => import_screensaver_info_font.SCREENSAVER_INFO_FONT_STATES,
  SCREENSAVER_INFO_ICON_ID: () => SCREENSAVER_INFO_ICON_ID,
  SCREENSAVER_INFO_ICON_TEXTS: () => SCREENSAVER_INFO_ICON_TEXTS,
  SCREENSAVER_INFO_NOTIFY_ID: () => SCREENSAVER_INFO_NOTIFY_ID,
  screensaverInfoFont: () => import_screensaver_info_font.screensaverInfoFont,
  screensaverInfoNotification: () => screensaverInfoNotification,
  screensaverInfoText: () => screensaverInfoText
});
module.exports = __toCommonJS(screensaver_info_icon_exports);
var import_icon_mapping = require("../const/icon_mapping");
var import_popupNotify3 = require("./popupNotify3");
var import_screensaver_info_font = require("../const/screensaver-info-font");
const SCREENSAVER_CLOCK_BLINK_MIN_VERSION = "6.2.0";
const SCREENSAVER_INFO_ICON_ID = "bInfo";
const SCREENSAVER_INFO_NOTIFY_ID = "screensaverInfoIcon";
const SCREENSAVER_INFO_ICON_TEXTS = {
  "timer-sand": "screensaver_info_timer_running",
  "timer-pause": "screensaver_info_timer_paused",
  "timer-alert": "screensaver_info_timer_expired",
  "cog-refresh-outline": "screensaver_info_dev_firmware",
  "wrench-clock": "screensaver_info_firmware_update"
};
const POPUP_NOTIFY_TEXT_WIDTH = {
  eu: { text: 397, withIcon: 285 },
  "us-l": { text: 397, withIcon: 285 },
  "us-p": { text: 307, withIcon: 306 },
  "web-l": { text: 560, withIcon: 446 },
  "web-p": { text: 272, withIcon: 272 }
};
function screensaverInfoText(text, font, model, withIcon) {
  const widths = POPUP_NOTIFY_TEXT_WIDTH[model];
  return (0, import_popupNotify3.notifyTextLines)(text, font, model, withIcon ? widths.withIcon : widths.text, Number.MAX_SAFE_INTEGER).join(
    "\n"
  );
}
function screensaverInfoNotification(popup) {
  const withIcon = import_icon_mapping.Icons.iconMap.has(popup.icon.trim());
  const details = {
    id: SCREENSAVER_INFO_NOTIFY_ID,
    priority: 50,
    type: "information",
    global: false,
    alwaysOn: false,
    headline: "",
    text: screensaverInfoText(popup.text, popup.font, popup.model, withIcon),
    textSize: String(popup.font),
    buttonLeft: "",
    buttonMid: "",
    buttonRight: "",
    largeIcon: false,
    buzzer: false
  };
  if (withIcon && import_icon_mapping.Icons.isIcon(popup.icon)) {
    details.icon = popup.icon;
    details.iconColor = popup.iconColor;
  }
  return details;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  POPUP_NOTIFY_TEXT_WIDTH,
  SCREENSAVER_CLOCK_BLINK_MIN_VERSION,
  SCREENSAVER_INFO_FONT_DEFAULT,
  SCREENSAVER_INFO_FONT_STATES,
  SCREENSAVER_INFO_ICON_ID,
  SCREENSAVER_INFO_ICON_TEXTS,
  SCREENSAVER_INFO_NOTIFY_ID,
  screensaverInfoFont,
  screensaverInfoNotification,
  screensaverInfoText
});
//# sourceMappingURL=screensaver-info-icon.js.map
