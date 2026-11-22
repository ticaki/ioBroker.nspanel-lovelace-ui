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
var alexa_alarm_exports = {};
__export(alexa_alarm_exports, {
  AlexaAlarms: () => AlexaAlarms,
  alarmClockTime: () => alarmClockTime,
  alarmTimeValue: () => alarmTimeValue,
  alexaAlarmLabel: () => alexaAlarmLabel,
  alexaAlarmsOf: () => alexaAlarmsOf,
  isPastSingleAlarm: () => isPastSingleAlarm,
  nextActiveAlarm: () => nextActiveAlarm,
  parseAlarmTime: () => parseAlarmTime,
  selectAlexaAlarm: () => selectAlexaAlarm
});
module.exports = __toCommonJS(alexa_alarm_exports);
const ALARM_FIELDS = ["time", "date", "enabled", "nextTriggerDate", "recurringPattern", "recurringDays", "label"];
function parseAlarmTime(value) {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?/.exec(value.trim());
  if (!match) {
    return void 0;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? { hour, minute } : void 0;
}
function alarmClockTime(entry) {
  if (entry.nextTriggerDate !== void 0) {
    const date = new Date(entry.nextTriggerDate);
    return { hour: date.getHours(), minute: date.getMinutes() };
  }
  return parseAlarmTime(entry.time);
}
function isPastSingleAlarm(entry, now) {
  if (entry.recurringPattern !== "0" && entry.recurringPattern !== "") {
    return false;
  }
  if (entry.nextTriggerDate !== void 0) {
    return entry.nextTriggerDate <= now;
  }
  const time = parseAlarmTime(entry.time);
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entry.date);
  if (!time || !date) {
    return false;
  }
  const at = new Date(Number(date[1]), Number(date[2]) - 1, Number(date[3]), time.hour, time.minute).getTime();
  return at <= now;
}
function nextActiveAlarm(entries) {
  var _a;
  let best;
  for (const entry of entries) {
    if (!entry.enabled || entry.nextTriggerDate === void 0) {
      continue;
    }
    if (!best || entry.nextTriggerDate < ((_a = best.nextTriggerDate) != null ? _a : Infinity) || entry.nextTriggerDate === best.nextTriggerDate && entry.id < best.id) {
      best = entry;
    }
  }
  return best;
}
function selectAlexaAlarm(entries, alarmId) {
  if (alarmId === void 0) {
    return { entry: nextActiveAlarm(entries), missing: false };
  }
  const entry = entries.find((e) => e.id === alarmId);
  return { entry, missing: !entry };
}
function alexaAlarmLabel(entry, once) {
  const time = parseAlarmTime(entry.time);
  const parts = [];
  if (entry.label) {
    parts.push(entry.label);
  }
  parts.push(
    time ? `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}` : entry.time || "?"
  );
  if (entry.recurringDays) {
    parts.push(entry.recurringDays);
  } else if (entry.recurringPattern === "0" || entry.recurringPattern === "") {
    parts.push(entry.date ? `${once} ${entry.date}` : once);
  } else {
    parts.push(entry.recurringPattern);
  }
  return parts.join(" \xB7 ");
}
function alexaAlarmsOf(prefix, states) {
  const byId = /* @__PURE__ */ new Map();
  for (const [id, val] of states) {
    if (!id.startsWith(prefix)) {
      continue;
    }
    const rest = id.slice(prefix.length).split(".");
    if (rest.length !== 2 || !ALARM_FIELDS.includes(rest[1])) {
      continue;
    }
    let fields = byId.get(rest[0]);
    if (!fields) {
      fields = /* @__PURE__ */ new Map();
      byId.set(rest[0], fields);
    }
    fields.set(rest[1], val);
  }
  const text = (v) => typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
  const out = [];
  for (const [id, fields] of byId) {
    if (!fields.has("time") && !fields.has("enabled")) {
      continue;
    }
    const next = fields.get("nextTriggerDate");
    out.push({
      id,
      time: text(fields.get("time")),
      date: text(fields.get("date")),
      enabled: fields.get("enabled") === true,
      nextTriggerDate: typeof next === "number" && Number.isFinite(next) && next > 0 ? next : void 0,
      recurringPattern: text(fields.get("recurringPattern")),
      recurringDays: text(fields.get("recurringDays")),
      label: text(fields.get("label"))
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
function alarmTimeValue(hour, minute) {
  const h = Math.min(23, Math.max(0, Math.floor(hour)));
  const m = Math.min(59, Math.max(0, Math.floor(minute)));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}
class AlexaAlarms {
  config;
  host;
  readChannels;
  /** value per state id below `Alarm.` */
  states = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  subscribed = false;
  deleted = false;
  /** resolves when the states were read the first time */
  ready;
  /**
   * @param config instance and device
   * @param host access to the adapter
   * @param readChannels reads the alarm channels of the device, undefined: {@link refresh} does nothing
   */
  constructor(config, host, readChannels) {
    this.config = { instance: config.instance, serial: config.serial };
    this.host = host;
    this.readChannels = readChannels;
    this.ready = this.init();
  }
  /** `<instance>.Echo-Devices.<serial>.Alarm.` */
  get prefix() {
    return `${this.config.instance}.Echo-Devices.${this.config.serial}.Alarm.`;
  }
  async init() {
    try {
      await this.host.subscribePattern(`${this.prefix}*`, this.onState);
      this.subscribed = true;
      const states = await this.host.getForeignStates(`${this.prefix}*`);
      for (const [id, state] of Object.entries(states)) {
        this.apply(id, state);
      }
    } catch (err) {
      this.host.log.warn(`Alexa alarm: cannot read the alarms of ${this.prefix}*: ${String(err)}`);
    }
    this.notify();
  }
  /**
   * Drops the alarms whose channel is gone - a deleted alarm whose states were left over.
   */
  async refresh() {
    if (this.deleted || !this.readChannels) {
      return;
    }
    try {
      const channels = new Set(await this.readChannels(`${this.prefix}*`));
      let changed = false;
      for (const id of [...this.states.keys()]) {
        const alarm = id.slice(this.prefix.length).split(".")[0];
        if (id.slice(this.prefix.length).includes(".") && !channels.has(alarm)) {
          this.states.delete(id);
          changed = true;
        }
      }
      if (changed) {
        this.notify();
      }
    } catch (err) {
      this.host.log.debug(`Alexa alarm: cannot read the alarm channels of ${this.prefix}*: ${String(err)}`);
    }
  }
  /**
   * @param listener called on every change, must not throw
   */
  addListener(listener) {
    this.listeners.add(listener);
  }
  /**
   * @param listener as given to {@link addListener}
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }
  notify() {
    if (!this.deleted) {
      this.listeners.forEach((listener) => listener());
    }
  }
  onState = (id, state) => {
    if (this.apply(id, state)) {
      this.notify();
    }
  };
  /**
   * @param id state id
   * @param state the state, null when it was deleted
   * @returns true when something changed
   */
  apply(id, state) {
    if (!id.startsWith(this.prefix)) {
      return false;
    }
    if (!state) {
      return this.states.delete(id);
    }
    const val = state.val;
    if (this.states.has(id) && this.states.get(id) === val) {
      return false;
    }
    this.states.set(id, val);
    return true;
  }
  /**
   * @returns all alarms of the device
   */
  getAlarms() {
    return alexaAlarmsOf(this.prefix, this.states);
  }
  /**
   * @param alarmId fixed alarm, undefined = the next active one
   * @returns what the item shows
   */
  select(alarmId) {
    return selectAlexaAlarm(this.getAlarms(), alarmId);
  }
  /**
   * Switches an alarm on or off (`enabled`).
   *
   * @param alarmId the alarm
   * @param on true = on
   * @returns true when it was written
   */
  async setEnabled(alarmId, on) {
    return this.write(`${this.prefix}${alarmId}.enabled`, on);
  }
  /**
   * Sets the time of an alarm (`time`).
   *
   * @param alarmId the alarm
   * @param hour hour
   * @param minute minute
   * @returns true when it was written
   */
  async setTime(alarmId, hour, minute) {
    return this.write(`${this.prefix}${alarmId}.time`, alarmTimeValue(hour, minute));
  }
  async write(id, val) {
    if (this.deleted) {
      return false;
    }
    try {
      await this.host.setForeignState(id, val);
      this.host.log.debug(`Alexa alarm: ${id} = ${String(val)}`);
      return true;
    } catch (err) {
      this.host.log.warn(`Alexa alarm: cannot write ${id}: ${String(err)}`);
      return false;
    }
  }
  async delete() {
    this.deleted = true;
    this.listeners.clear();
    if (this.subscribed) {
      this.subscribed = false;
      try {
        await this.host.unsubscribePattern(`${this.prefix}*`, this.onState);
      } catch (err) {
        this.host.log.debug(`Alexa alarm: unsubscribe of ${this.prefix}* failed: ${String(err)}`);
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlexaAlarms,
  alarmClockTime,
  alarmTimeValue,
  alexaAlarmLabel,
  alexaAlarmsOf,
  isPastSingleAlarm,
  nextActiveAlarm,
  parseAlarmTime,
  selectAlexaAlarm
});
//# sourceMappingURL=alexa-alarm.js.map
