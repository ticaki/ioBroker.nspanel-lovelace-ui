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
var screensaver_notify_queue_exports = {};
__export(screensaver_notify_queue_exports, {
  SCREENSAVER_NOTIFY_DEFAULT_PRIORITY: () => SCREENSAVER_NOTIFY_DEFAULT_PRIORITY,
  SCREENSAVER_NOTIFY_QUEUE_MAX: () => SCREENSAVER_NOTIFY_QUEUE_MAX,
  SCREENSAVER_NOTIFY_QUEUE_PREFIX: () => SCREENSAVER_NOTIFY_QUEUE_PREFIX,
  applyScreensaverNotify: () => applyScreensaverNotify,
  mergeScreensaverNotify: () => mergeScreensaverNotify,
  parseScreensaverNotifyDetails: () => parseScreensaverNotifyDetails,
  removesScreensaverNotify: () => removesScreensaverNotify,
  screensaverNotifyQueueCandidate: () => screensaverNotifyQueueCandidate,
  screensaverNotifyQueueEntry: () => screensaverNotifyQueueEntry,
  screensaverNotifyQueueId: () => screensaverNotifyQueueId
});
module.exports = __toCommonJS(screensaver_notify_queue_exports);
var import_Color = require("../const/Color");
var import_icon_mapping = require("../const/icon_mapping");
var import_tools = require("../const/tools");
var import_adminShareConfig = require("../types/adminShareConfig");
const SCREENSAVER_NOTIFY_QUEUE_MAX = 10;
const SCREENSAVER_NOTIFY_DEFAULT_PRIORITY = 50;
const SCREENSAVER_NOTIFY_QUEUE_PREFIX = "sendTo:";
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseScreensaverNotifyDetails(message) {
  if (!isRecord(message) || typeof message.id !== "string" || message.id === "") {
    return void 0;
  }
  const headline = typeof message.headline === "string" ? message.headline : typeof message.heading === "string" ? message.heading : "";
  const buzzer = message.buzzer === true ? import_adminShareConfig.screensaverNotifyDefaultBuzzer : typeof message.buzzer === "string" && message.buzzer.trim() ? message.buzzer.trim() : void 0;
  return {
    id: message.id,
    priority: typeof message.priority === "number" && Number.isFinite(message.priority) ? message.priority : SCREENSAVER_NOTIFY_DEFAULT_PRIORITY,
    enabled: message.enabled !== false,
    headline,
    text: typeof message.text === "string" ? message.text : "",
    icon: typeof message.icon === "string" && message.icon !== "" ? message.icon : void 0,
    buzzer,
    colorHeadline: message.colorHeadline != null ? (0, import_tools.getRGBFromValue)(message.colorHeadline) : void 0,
    colorText: message.colorText != null ? (0, import_tools.getRGBFromValue)(message.colorText) : void 0,
    backgroundBlink: (0, import_adminShareConfig.isHexColor)(message.backgroundBlink) ? message.backgroundBlink : void 0,
    type: message.type === "acknowledge" ? "acknowledge" : "information",
    global: message.global !== false
  };
}
function removesScreensaverNotify(details) {
  return !details.enabled || details.priority <= 0;
}
function applyScreensaverNotify(queue, details, seq) {
  if (removesScreensaverNotify(details)) {
    if (details.priority <= -100) {
      return queue.filter((e) => !e.id.startsWith(details.id));
    }
    return queue.filter((e) => e.id !== details.id);
  }
  const index = queue.findIndex((e) => e.id === details.id);
  const entry = screensaverNotifyQueueEntry(details, index === -1 ? seq : queue[index].seq);
  const next = index === -1 ? [...queue, entry] : queue.map((e, i) => i === index ? entry : e);
  return next.sort((a, b) => a.priority - b.priority || a.seq - b.seq).slice(0, SCREENSAVER_NOTIFY_QUEUE_MAX);
}
function screensaverNotifyQueueEntry(details, seq) {
  const { heading, text } = (0, import_adminShareConfig.screensaverNotifyLines)({
    icon: details.icon ? import_icon_mapping.Icons.GetIcon(details.icon) : "",
    headline: details.headline,
    text: details.text
  });
  return {
    id: details.id,
    priority: details.priority,
    heading,
    text,
    buzzer: details.buzzer,
    blink: (0, import_adminShareConfig.isHexColor)(details.backgroundBlink) ? import_Color.Color.rgb_dec565(import_Color.Color.ConvertHexToRgb(details.backgroundBlink)) : void 0,
    colors: { head: details.colorHeadline, text: details.colorText },
    acknowledge: details.type === "acknowledge",
    global: details.global,
    seq
  };
}
function screensaverNotifyQueueCandidate(entry) {
  return {
    id: `${SCREENSAVER_NOTIFY_QUEUE_PREFIX}${entry.id}`,
    heading: entry.heading,
    text: entry.text,
    prio: entry.priority,
    buzzer: entry.buzzer,
    blink: entry.blink,
    colors: entry.colors
  };
}
function screensaverNotifyQueueId(activeId) {
  return activeId.startsWith(SCREENSAVER_NOTIFY_QUEUE_PREFIX) ? activeId.slice(SCREENSAVER_NOTIFY_QUEUE_PREFIX.length) : void 0;
}
function mergeScreensaverNotify(queue, admin) {
  return [...queue, ...admin].sort((a, b) => a.prio - b.prio);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SCREENSAVER_NOTIFY_DEFAULT_PRIORITY,
  SCREENSAVER_NOTIFY_QUEUE_MAX,
  SCREENSAVER_NOTIFY_QUEUE_PREFIX,
  applyScreensaverNotify,
  mergeScreensaverNotify,
  parseScreensaverNotifyDetails,
  removesScreensaverNotify,
  screensaverNotifyQueueCandidate,
  screensaverNotifyQueueEntry,
  screensaverNotifyQueueId
});
//# sourceMappingURL=screensaver-notify-queue.js.map
