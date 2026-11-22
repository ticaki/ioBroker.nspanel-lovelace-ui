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
var alexa_timer_exports = {};
__export(alexa_timer_exports, {
  AlexaTimer: () => AlexaTimer,
  AlexaTimerRegistry: () => AlexaTimerRegistry,
  START_RETRY_DELAY_MS: () => START_RETRY_DELAY_MS,
  START_TRIGGER_DELAY_MS: () => START_TRIGGER_DELAY_MS,
  STOPPED_KEEP_MS: () => STOPPED_KEEP_MS,
  alexaCountdownView: () => alexaCountdownView,
  alexaTimerCommand: () => alexaTimerCommand,
  parseAlexaTimerList: () => parseAlexaTimerList,
  pruneStoppedTimers: () => pruneStoppedTimers,
  selectAlexaTimer: () => selectAlexaTimer
});
module.exports = __toCommonJS(alexa_timer_exports);
var import_alexa_alarm = require("./alexa-alarm");
var import_adminShareConfig = require("../types/adminShareConfig");
const STOPPED_KEEP_MS = 12e4;
const START_TRIGGER_DELAY_MS = 5e3;
const START_RETRY_DELAY_MS = 5e3;
function parseAlexaTimerList(value) {
  let raw = value;
  if (typeof value === "string") {
    try {
      raw = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) {
    return [];
  }
  const out = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }
    const id = Reflect.get(entry, "id");
    const triggerTime = Reflect.get(entry, "triggerTime");
    const label = Reflect.get(entry, "label");
    const durationMillis = Reflect.get(entry, "durationMillis");
    if (typeof id !== "string" || !id || typeof triggerTime !== "number" || !Number.isFinite(triggerTime)) {
      continue;
    }
    out.push({
      id,
      triggerTime,
      label: typeof label === "string" ? label : null,
      durationMillis: typeof durationMillis === "number" ? durationMillis : 0
    });
  }
  return out;
}
function selectAlexaTimer(input) {
  var _a;
  const visible = input.list.filter((t) => !input.stopped.has(t.id)).sort((a, b) => a.triggerTime - b.triggerTime || a.id.localeCompare(b.id));
  if (visible.length === 0) {
    return { status: "off", entry: void 0 };
  }
  const due = visible.find((t) => t.triggerTime <= input.now);
  if (due) {
    return { status: "expired", entry: due };
  }
  const triggered = input.triggered && !(input.nextTimerId !== null && input.stopped.has(input.nextTimerId));
  if (triggered) {
    const ringing = (_a = visible.find((t) => t.id === input.nextTimerId)) != null ? _a : visible[0];
    return { status: "expired", entry: ringing };
  }
  return { status: "running", entry: visible[0] };
}
function pruneStoppedTimers(stopped, list, now) {
  const out = /* @__PURE__ */ new Map();
  for (const [id, end] of stopped) {
    if (list.some((t) => t.id === id) && now <= end + STOPPED_KEEP_MS) {
      out.set(id, end);
    }
  }
  return out;
}
function alexaTimerCommand(seconds, language) {
  const whole = Math.max(1, Math.round(seconds));
  const minutes = whole % 60 === 0 ? whole / 60 : void 0;
  if (language === "de") {
    return minutes !== void 0 ? `stelle einen Timer auf ${minutes} ${minutes === 1 ? "Minute" : "Minuten"}` : `stelle einen Timer auf ${whole} ${whole === 1 ? "Sekunde" : "Sekunden"}`;
  }
  return minutes !== void 0 ? `set a timer for ${minutes} ${minutes === 1 ? "minute" : "minutes"}` : `set a timer for ${whole} ${whole === 1 ? "second" : "seconds"}`;
}
function alexaCountdownView(selection, canStart, now) {
  const entry = selection.entry;
  if (selection.status === "off" || !entry) {
    return { status: "off", remainingMs: 0, canStart, canStop: false };
  }
  if (selection.status === "expired") {
    return { status: "expired", remainingMs: 0, canStart, canStop: true };
  }
  return {
    status: "running",
    remainingMs: Math.max(0, entry.triggerTime - now),
    endTs: entry.triggerTime,
    canStart,
    canStop: true
  };
}
class AlexaTimer {
  config;
  host;
  list = [];
  triggered = false;
  nextTimerId = null;
  /** stopped ids with the end of their timer, see {@link pruneStoppedTimers} */
  stopped = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  startTimers = [];
  /** the states of the device were found */
  found = false;
  subscribed = false;
  deleted = false;
  /** resolves when the states were read the first time */
  ready;
  /**
   * @param config instance and device
   * @param host access to the adapter
   */
  constructor(config, host) {
    this.config = { instance: config.instance, serial: config.serial };
    this.host = host;
    this.ready = this.init();
  }
  /** `<instance>.Echo-Devices.<serial>` */
  get deviceId() {
    return `${this.config.instance}.Echo-Devices.${this.config.serial}`;
  }
  get timerPattern() {
    return `${this.deviceId}.Timer.*`;
  }
  async init() {
    if (!(0, import_adminShareConfig.isAlexaTimerComplete)(this.config)) {
      this.host.log.warn(
        `Alexa timer: instance '${this.config.instance}' / device '${this.config.serial}' is not complete - the timer is ignored.`
      );
      return;
    }
    try {
      await this.host.subscribePattern(this.timerPattern, this.onState);
      this.subscribed = true;
      const states = await this.host.getForeignStates(this.timerPattern);
      for (const [id, state] of Object.entries(states)) {
        this.apply(id, state);
      }
      this.found = `${this.deviceId}.Timer.activeTimerList` in states;
      if (!this.found) {
        this.host.log.warn(
          `Alexa timer: ${this.deviceId}.Timer.activeTimerList does not exist - is the device or the alexa2 instance correct?`
        );
      }
    } catch (err) {
      this.host.log.warn(`Alexa timer: cannot read the timers of ${this.deviceId}: ${String(err)}`);
    }
    this.notify();
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
   * @param state the state
   * @returns true when something of the timers changed
   */
  apply(id, state) {
    const val = state ? state.val : void 0;
    switch (id.slice(`${this.deviceId}.Timer.`.length)) {
      case "activeTimerList": {
        this.list = parseAlexaTimerList(val);
        this.found = true;
        this.stopped = pruneStoppedTimers(this.stopped, this.list, this.host.now());
        return true;
      }
      case "triggered": {
        const triggered = val === true;
        const changed = triggered !== this.triggered;
        this.triggered = triggered;
        return changed;
      }
      case "nextTimerId": {
        const next = typeof val === "string" && val ? val : null;
        const changed = next !== this.nextTimerId;
        this.nextTimerId = next;
        return changed;
      }
      default:
        return false;
    }
  }
  /**
   * @returns the shown timer now
   */
  getSelection() {
    const now = this.host.now();
    this.stopped = pruneStoppedTimers(this.stopped, this.list, now);
    return selectAlexaTimer({
      list: this.list,
      triggered: this.triggered,
      nextTimerId: this.nextTimerId,
      stopped: new Set(this.stopped.keys()),
      now
    });
  }
  /**
   * @returns true when a timer can be started: the device was found
   */
  canStart() {
    return this.found && !this.deleted;
  }
  /**
   * @returns true when a timer is shown that can be stopped
   */
  canStop() {
    return !this.deleted && this.getSelection().entry !== void 0;
  }
  /**
   * @returns the shown timer as a countdown (screensaver, page item)
   */
  getView() {
    return alexaCountdownView(this.getSelection(), this.canStart(), this.host.now());
  }
  /**
   * Sets a timer by a text command. alexa2 learns about it only from the history: it is read
   * {@link START_TRIGGER_DELAY_MS} later, and once more after {@link START_RETRY_DELAY_MS} when the timer is not in
   * the list by then.
   *
   * @param seconds duration
   * @returns true when the command was written
   */
  async start(seconds) {
    if (seconds <= 0 || !this.canStart()) {
      return false;
    }
    const known = new Set(this.list.map((t) => t.id));
    const text = alexaTimerCommand(seconds, this.host.language());
    try {
      await this.host.setForeignState(`${this.deviceId}.Commands.textCommand`, text);
    } catch (err) {
      this.host.log.warn(`Alexa timer: cannot write the text command of ${this.deviceId}: ${String(err)}`);
      return false;
    }
    this.host.log.debug(`Alexa timer: '${text}' sent to ${this.deviceId}`);
    this.clearStartTimers();
    this.startTimers.push(
      this.host.setTimeout(() => {
        void this.readHistory().then(() => {
          this.startTimers.push(
            this.host.setTimeout(() => {
              if (!this.list.some((t) => !known.has(t.id))) {
                void this.readHistory();
              }
            }, START_RETRY_DELAY_MS)
          );
        });
      }, START_TRIGGER_DELAY_MS)
    );
    return true;
  }
  /**
   * Stops the shown timer at Amazon and hides it at once.
   *
   * @returns true when the stop was written
   */
  async stop() {
    const entry = this.getSelection().entry;
    if (!entry || this.deleted) {
      return false;
    }
    try {
      await this.host.setForeignState(`${this.deviceId}.Timer.stopTimerId`, entry.id);
    } catch (err) {
      this.host.log.warn(`Alexa timer: cannot stop the timer of ${this.deviceId}: ${String(err)}`);
      return false;
    }
    this.host.log.debug(`Alexa timer: timer ${entry.id} of ${this.deviceId} stopped`);
    this.stopped.set(entry.id, entry.triggerTime);
    this.notify();
    return true;
  }
  async readHistory() {
    if (this.deleted) {
      return;
    }
    try {
      await this.host.setForeignState(`${this.config.instance}.History.#trigger`, true);
    } catch (err) {
      this.host.log.warn(`Alexa timer: cannot ask ${this.config.instance} for the history: ${String(err)}`);
    }
  }
  clearStartTimers() {
    for (const timer of this.startTimers) {
      this.host.clearTimeout(timer);
    }
    this.startTimers = [];
  }
  async delete() {
    this.deleted = true;
    this.clearStartTimers();
    this.listeners.clear();
    if (this.subscribed) {
      this.subscribed = false;
      try {
        await this.host.unsubscribePattern(this.timerPattern, this.onState);
      } catch (err) {
        this.host.log.debug(`Alexa timer: unsubscribe of ${this.timerPattern} failed: ${String(err)}`);
      }
    }
  }
}
class AlexaTimerRegistry {
  host;
  timers = /* @__PURE__ */ new Map();
  alarms = /* @__PURE__ */ new Map();
  /**
   * @param host access to the adapter
   */
  constructor(host) {
    this.host = host;
  }
  /**
   * @param config instance and device
   * @returns the timer of the device, its states are read (see {@link AlexaTimer.ready})
   */
  get(config) {
    const key = `${config.instance}.Echo-Devices.${config.serial}`;
    let timer = this.timers.get(key);
    if (!timer) {
      timer = new AlexaTimer(config, this.host);
      this.timers.set(key, timer);
    }
    return timer;
  }
  /**
   * @param config instance and device
   * @returns the alarms of the device, its states are read (see {@link AlexaAlarms.ready})
   */
  getAlarms(config) {
    const key = `${config.instance}.Echo-Devices.${config.serial}`;
    let alarms = this.alarms.get(key);
    if (!alarms) {
      alarms = new import_alexa_alarm.AlexaAlarms(config, this.host, this.host.getChannelIds);
      this.alarms.set(key, alarms);
    }
    return alarms;
  }
  async deleteAll() {
    const timers = [...this.timers.values()];
    const alarms = [...this.alarms.values()];
    this.timers.clear();
    this.alarms.clear();
    await Promise.all([...timers.map((t) => t.delete()), ...alarms.map((a) => a.delete())]);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlexaTimer,
  AlexaTimerRegistry,
  START_RETRY_DELAY_MS,
  START_TRIGGER_DELAY_MS,
  STOPPED_KEEP_MS,
  alexaCountdownView,
  alexaTimerCommand,
  parseAlexaTimerList,
  pruneStoppedTimers,
  selectAlexaTimer
});
//# sourceMappingURL=alexa-timer.js.map
