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
  SCREENSAVER_CLOCK_BLINK_MIN_VERSION: () => SCREENSAVER_CLOCK_BLINK_MIN_VERSION,
  SCREENSAVER_INFO_ICON_ID: () => SCREENSAVER_INFO_ICON_ID,
  SCREENSAVER_INFO_ICON_TEXTS: () => SCREENSAVER_INFO_ICON_TEXTS,
  SCREENSAVER_INFO_NOTIFY_ID: () => SCREENSAVER_INFO_NOTIFY_ID,
  screensaverInfoNotification: () => screensaverInfoNotification
});
module.exports = __toCommonJS(screensaver_info_icon_exports);
var import_icon_mapping = require("../const/icon_mapping");
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
function screensaverInfoNotification(icon, text) {
  const details = {
    id: SCREENSAVER_INFO_NOTIFY_ID,
    priority: 50,
    type: "information",
    global: false,
    alwaysOn: false,
    headline: "",
    text,
    buttonLeft: "",
    buttonMid: "",
    buttonRight: "",
    largeIcon: false,
    buzzer: false
  };
  if (import_icon_mapping.Icons.isIcon(icon)) {
    details.icon = icon;
  }
  return details;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SCREENSAVER_CLOCK_BLINK_MIN_VERSION,
  SCREENSAVER_INFO_ICON_ID,
  SCREENSAVER_INFO_ICON_TEXTS,
  SCREENSAVER_INFO_NOTIFY_ID,
  screensaverInfoNotification
});
//# sourceMappingURL=screensaver-info-icon.js.map
