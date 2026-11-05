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
var screensaver_timer_exports = {};
__export(screensaver_timer_exports, {
  TIMER_OFF: () => TIMER_OFF,
  alarmClockOf: () => alarmClockOf,
  isCountdownCommon: () => isCountdownCommon,
  isTimerOn: () => isTimerOn,
  nextAlarmTs: () => nextAlarmTs,
  nextTimerWakeMs: () => nextTimerWakeMs,
  orderTimerSlotKeys: () => orderTimerSlotKeys,
  parseTimerData: () => parseTimerData,
  parseTimerInput: () => parseTimerInput,
  selectTimer: () => selectTimer,
  stepTimerItem: () => stepTimerItem,
  stepTimerSlot: () => stepTimerSlot,
  timerActiveValue: () => timerActiveValue,
  timerClockText: () => timerClockText,
  timerPopupButtons: () => timerPopupButtons,
  timerPopupFields: () => timerPopupFields,
  timerSecondsOf: () => timerSecondsOf,
  timerSlotKey: () => timerSlotKey,
  timerStartValue: () => timerStartValue,
  timerText: () => timerText,
  timerValueOf: () => timerValueOf
});
module.exports = __toCommonJS(screensaver_timer_exports);
const TIMER_OFF = { status: "off", text: "", remainingMs: 0, key: void 0 };
const MINUTE = 6e4;
const TENTH_MINUTE = 6e3;
const TENTHS_UNTIL = 9999 * TENTH_MINUTE;
const MAX_SHOWN_MINUTES = 9999;
const MILLISECONDS_FROM = 1e11;
const SECONDS_FROM = 1e9;
const MAX_WAIT = 864e5;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)?)?$/;
const HOUR_MINUTE = /^(\d{1,2}):(\d{2})$/;
function isTimerOn(value) {
  if (typeof value === "string") {
    return ["true", "on", "1"].includes(value.trim().toLowerCase());
  }
  if (typeof value === "number") {
    return value !== 0 && !Number.isNaN(value);
  }
  return value === true;
}
function isCountdownCommon(common) {
  if (!common) {
    return false;
  }
  if (typeof common.unit === "string" && ["s", "sec", "ms"].includes(common.unit.trim().toLowerCase())) {
    return true;
  }
  return common.role === "value.timer" || common.role === "level.timer";
}
function parseTimerData(value, unit, now) {
  if (typeof value === "number") {
    if (Number.isNaN(value)) {
      return { kind: "none" };
    }
    if (value <= 0) {
      return { kind: "zero" };
    }
    if (value >= MILLISECONDS_FROM) {
      return { kind: "target", targetTs: value };
    }
    if (value >= SECONDS_FROM) {
      return { kind: "target", targetTs: value * 1e3 };
    }
    return { kind: "countdown", remainingMs: (unit == null ? void 0 : unit.trim().toLowerCase()) === "ms" ? value : value * 1e3 };
  }
  if (typeof value !== "string") {
    return { kind: "none" };
  }
  const text = value.trim();
  const hourMinute = HOUR_MINUTE.exec(text);
  if (hourMinute) {
    const hour = Number(hourMinute[1]);
    const minute = Number(hourMinute[2]);
    if (hour > 23 || minute > 59) {
      return { kind: "none" };
    }
    const target = new Date(now);
    target.setHours(hour, minute, 0, 0);
    if (target.getTime() <= now) {
      target.setDate(target.getDate() + 1);
    }
    return { kind: "target", targetTs: target.getTime() };
  }
  if (ISO_DATE.test(text)) {
    const targetTs = new Date(text).getTime();
    return Number.isNaN(targetTs) ? { kind: "none" } : { kind: "target", targetTs };
  }
  return { kind: "none" };
}
function stepTimerSlot(prev, input, now) {
  if (!input.on) {
    return { memory: { on: false, raw: input.value, data: { kind: "none" } }, started: false };
  }
  const before = (prev == null ? void 0 : prev.on) ? prev.data : { kind: "none" };
  if ((prev == null ? void 0 : prev.on) && prev.raw === input.value) {
    return { memory: prev, started: false };
  }
  const parsed = parseTimerData(input.value, input.unit, now);
  let data;
  if (parsed.kind === "target" || parsed.kind === "countdown") {
    data = parsed;
  } else if (before.kind !== "none" || parsed.kind === "zero" && input.countdownState) {
    data = { kind: "elapsed" };
  } else {
    data = { kind: "none" };
  }
  return { memory: { on: true, raw: input.value, data }, started: isNewRun(before, data) };
}
function isNewRun(before, data) {
  switch (data.kind) {
    case "none":
      return false;
    case "elapsed":
      return before.kind === "none";
    case "target":
      return before.kind !== "target" || before.targetTs !== data.targetTs;
    case "countdown":
      return before.kind !== "countdown" || data.remainingMs > before.remainingMs;
  }
}
function remainingOf(data, now) {
  switch (data.kind) {
    case "none":
      return void 0;
    case "elapsed":
      return 0;
    case "target":
      return Math.max(0, data.targetTs - now);
    case "countdown":
      return Math.max(0, data.remainingMs);
  }
}
function timerText(remainingMs) {
  const remaining = Math.max(0, remainingMs);
  if (remaining > TENTHS_UNTIL) {
    return String(Math.min(Math.ceil(remaining / MINUTE), MAX_SHOWN_MINUTES));
  }
  const tenths = Math.ceil(remaining / TENTH_MINUTE);
  return `${Math.floor(tenths / 10)}.${tenths % 10}`;
}
function nextTextChangeMs(remainingMs) {
  if (remainingMs <= TENTHS_UNTIL) {
    return remainingMs % TENTH_MINUTE || TENTH_MINUTE;
  }
  if (remainingMs > MAX_SHOWN_MINUTES * MINUTE) {
    return remainingMs - MAX_SHOWN_MINUTES * MINUTE;
  }
  return Math.min(remainingMs % MINUTE || MINUTE, remainingMs - TENTHS_UNTIL);
}
function selectTimer(slots, now) {
  let best;
  for (const key of [...slots.keys()].sort()) {
    const memory = slots.get(key);
    const remainingMs = (memory == null ? void 0 : memory.on) ? remainingOf(memory.data, now) : void 0;
    if (remainingMs !== void 0 && (!best || remainingMs < best.remainingMs)) {
      best = { key, remainingMs, paused: !!(memory == null ? void 0 : memory.paused) };
    }
  }
  if (!best) {
    return TIMER_OFF;
  }
  return {
    status: best.paused ? "paused" : best.remainingMs > 0 ? "running" : "expired",
    text: timerText(best.remainingMs),
    remainingMs: best.remainingMs,
    key: best.key
  };
}
function nextTimerWakeMs(slots, selection, tappedAway, now) {
  if (selection.status !== "running") {
    return void 0;
  }
  let wait;
  for (const [key, memory] of slots) {
    if (!memory.on || memory.data.kind !== "target") {
      continue;
    }
    const remainingMs = memory.data.targetTs - now;
    if (remainingMs <= 0) {
      continue;
    }
    const next = key === selection.key && !tappedAway ? nextTextChangeMs(remainingMs) : remainingMs;
    wait = wait === void 0 ? next : Math.min(wait, next);
  }
  return wait === void 0 ? void 0 : Math.min(wait, MAX_WAIT);
}
function timerSlotKey(pattern, id) {
  const star = pattern.indexOf("*");
  if (star === -1) {
    return void 0;
  }
  const prefix = pattern.slice(0, star);
  const suffix = pattern.slice(star + 1);
  if (id.length <= prefix.length + suffix.length || !id.startsWith(prefix) || !id.endsWith(suffix)) {
    return void 0;
  }
  return id.slice(prefix.length, id.length - suffix.length);
}
function stepTimerItem(prev, view) {
  let data;
  switch (view.status) {
    case "off":
      return { memory: { on: false, raw: null, data: { kind: "none" } }, started: false };
    case "expired":
      data = { kind: "elapsed" };
      break;
    case "paused":
      data = { kind: "countdown", remainingMs: view.remainingMs };
      break;
    case "running":
      data = view.endTs === void 0 ? { kind: "countdown", remainingMs: view.remainingMs } : { kind: "target", targetTs: view.endTs };
      break;
  }
  const memory = { on: true, raw: null, data, paused: view.status === "paused" };
  return { memory, started: isNewRun((prev == null ? void 0 : prev.on) ? prev.data : { kind: "none" }, data) };
}
const MAX_POPUP_SECONDS = 99 * 60 + 59;
const MS_PER_DAY = 864e5;
function timerSecondsOf(value, unit) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.ceil(isUnitMs(unit) ? value / 1e3 : value);
}
function timerValueOf(seconds, unit) {
  return isUnitMs(unit) ? seconds * 1e3 : seconds;
}
function isUnitMs(unit) {
  return typeof unit === "string" && unit.trim().toLowerCase() === "ms";
}
function timerClockText(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((v) => String(v).padStart(2, "0")).join(":");
}
function timerPopupFields(seconds) {
  const s = Math.min(MAX_POPUP_SECONDS, Math.max(0, Math.floor(seconds)));
  return { minutes: String(Math.floor(s / 60)), seconds: String(s % 60) };
}
function parseTimerInput(value) {
  const parts = (value != null ? value : "").split(":").map((v) => parseInt(v, 10));
  if (parts.length !== 3 || parts.some((v) => Number.isNaN(v) || v < 0)) {
    return void 0;
  }
  return [parts[0], parts[1], parts[2]];
}
function alarmClockOf(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return { hour: 0, minute: 0 };
  }
  if (value < MS_PER_DAY) {
    const minutes = Math.floor(value / MINUTE);
    return { hour: Math.floor(minutes / 60), minute: minutes % 60 };
  }
  const date = new Date(value >= SECONDS_FROM && value < MILLISECONDS_FROM ? value * 1e3 : value);
  return { hour: date.getHours(), minute: date.getMinutes() };
}
function nextAlarmTs(hour, minute, now) {
  const target = new Date(now);
  target.setHours(Math.min(23, Math.max(0, hour)), Math.min(59, Math.max(0, minute)), 0, 0);
  if (target.getTime() <= now) {
    const hours = target.getHours();
    const minutes = target.getMinutes();
    target.setDate(target.getDate() + 1);
    target.setHours(hours, minutes, 0, 0);
  }
  return target.getTime();
}
function timerStartValue(common, seconds, now) {
  if (isCountdownCommon(common)) {
    return timerValueOf(seconds, common.unit);
  }
  const targetTs = now + seconds * 1e3;
  return common.type === "string" ? new Date(targetTs).toISOString() : targetTs;
}
function timerActiveValue(common, on) {
  if (common.type === "number") {
    return on ? 1 : 0;
  }
  if (common.type === "string") {
    return on ? "true" : "false";
  }
  return on;
}
function orderTimerSlotKeys(keys) {
  return [...keys].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}
function timerPopupButtons(input) {
  const start = (text) => ({ action: "begin", text });
  const pause = (text) => ({ action: "pause", text });
  const cancel = { action: "clear", text: "timer_cancel" };
  const clear = { action: "clear", text: "timer_clear" };
  const finish = { action: "finish", text: "timer_finish" };
  switch (input.mode) {
    case "timer": {
      if (input.status === "run") {
        return { editable: false, buttons: [pause("timer_pause"), cancel, finish] };
      }
      if (input.status === "expired") {
        return { editable: false, buttons: [void 0, finish, void 0] };
      }
      if (input.seconds <= 0) {
        return { editable: true, buttons: [start("timer_start"), void 0, void 0] };
      }
      const text = input.status === "pause" ? "timer_continue" : "timer_start";
      return { editable: true, buttons: [start(text), void 0, cancel] };
    }
    case "ex-timer": {
      if (input.status === void 0) {
        return { editable: input.canSet, buttons: [void 0, void 0, input.canSet ? clear : void 0] };
      }
      const canClear = input.canSet || input.canStatus;
      if (input.status === 2) {
        if (input.seconds <= 0) {
          return { editable: false, buttons: [void 0, canClear ? finish : void 0, void 0] };
        }
        return {
          editable: false,
          buttons: [
            input.canStatus ? pause("timer_pause") : void 0,
            canClear ? cancel : void 0,
            canClear ? finish : void 0
          ]
        };
      }
      return {
        editable: input.canSet,
        buttons: [
          input.canStatus ? start(input.status === 1 ? "timer_continue" : "timer_start") : void 0,
          void 0,
          canClear ? clear : void 0
        ]
      };
    }
    case "ex-alarm": {
      if (input.status === 2) {
        return {
          editable: false,
          buttons: [void 0, input.canStatus ? pause("timer_off") : void 0, void 0]
        };
      }
      return {
        editable: input.canSet,
        buttons: [
          void 0,
          input.status !== void 0 && input.canStatus ? start("timer_on") : void 0,
          void 0
        ]
      };
    }
    case "ss-timer": {
      switch (input.status) {
        case "off":
          return {
            editable: input.canStart,
            buttons: [void 0, input.canStart ? start("timer_start") : void 0, void 0]
          };
        case "running":
        case "paused":
          return { editable: false, buttons: [void 0, input.canStop ? cancel : void 0, void 0] };
        case "expired":
          return { editable: false, buttons: [void 0, input.canStop ? finish : void 0, void 0] };
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TIMER_OFF,
  alarmClockOf,
  isCountdownCommon,
  isTimerOn,
  nextAlarmTs,
  nextTimerWakeMs,
  orderTimerSlotKeys,
  parseTimerData,
  parseTimerInput,
  selectTimer,
  stepTimerItem,
  stepTimerSlot,
  timerActiveValue,
  timerClockText,
  timerPopupButtons,
  timerPopupFields,
  timerSecondsOf,
  timerSlotKey,
  timerStartValue,
  timerText,
  timerValueOf
});
//# sourceMappingURL=screensaver-timer.js.map
