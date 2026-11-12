"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var screensaver_exports = {};
__export(screensaver_exports, {
  Screensaver: () => Screensaver,
  resolveScreensaverOptions: () => resolveScreensaverOptions
});
module.exports = __toCommonJS(screensaver_exports);
var Definition = __toESM(require("../const/definition"));
var globals = __toESM(require("../types/function-and-const"));
var import_icon_mapping = require("../const/icon_mapping");
var import_Page = require("../classes/Page");
var tools = __toESM(require("../const/tools"));
var import_pageItem = require("./pageItem");
var import_Color = require("../const/Color");
var import_adminShareConfig = require("../types/adminShareConfig");
var import_screensaver_timer = require("./screensaver-timer");
var _Screensaver_instances, sendNotify_fn;
function isScreensaverConfig(config) {
  return typeof config.card === "string" && config.card.startsWith("screensaver");
}
function resolveScreensaverOptions(options) {
  const config = options.config;
  if (!config || !isScreensaverConfig(config)) {
    return { options };
  }
  const mode = config.mode;
  const card = config.card;
  if (globals.isScreenSaverMode(mode) && typeof card === "string" && globals.isScreenSaverCardType(card)) {
    return { options };
  }
  return {
    options: { ...options, config: { ...config, card: "screensaver", mode: "standard" } },
    rejected: { mode, card }
  };
}
const _Screensaver = class _Screensaver extends import_Page.Page {
  //readonly mode: Types.ScreensaverModeType = 'standard';
  constructor(config, pageOptions) {
    var _a, _b;
    const { options, rejected } = resolveScreensaverOptions(pageOptions);
    if (rejected) {
      config.adapter.log.warn(
        `Screensaver '${config.name}' of panel '${config.panel.friendlyName || config.panel.name}': mode '${String(rejected.mode)}' (card '${String(rejected.card)}') is not known to this adapter version - using 'standard' instead. The stored configuration stays unchanged.`
      );
    }
    if (!options.config || options.config.card !== "screensaver" && options.config.card !== "screensaver2" && options.config.card !== "screensaver3" && options.config.card !== "screensaver5") {
      config.adapter.log.error(
        `Invalid card for screensaver: ${options ? JSON.stringify(options) : "undefined"}`
      );
      return;
    }
    switch (options.config.mode) {
      case "standard":
      case "alternate": {
        config.card = "screensaver";
        break;
      }
      case "advanced": {
        config.card = "screensaver2";
        break;
      }
      case "easyview": {
        config.card = "screensaver3";
        break;
      }
      case "tiles": {
        config.card = "screensaver5";
        break;
      }
    }
    options.alwaysOn = "none";
    super(config, options, true);
    __privateAdd(this, _Screensaver_instances);
    __publicField(this, "items");
    __publicField(this, "step", 0);
    __publicField(this, "blockButtons");
    __publicField(this, "rotationTime", 3e5);
    __publicField(this, "screensaverSwipe", false);
    __publicField(this, "_infoIcon", "");
    __publicField(this, "timeoutRotation");
    /** time of the last burst that was really sent, a press on an item sets it back to 0 */
    __publicField(this, "lastUpdateTs", 0);
    __publicField(this, "updateThrottle");
    /** counts the runs of update(): only the newest may send, an older one read older values */
    __publicField(this, "updateRun", 0);
    /** last sent message per type, see {@link sendIfChanged} */
    __publicField(this, "lastSent", /* @__PURE__ */ new Map());
    /** a touch cleared the active notification on the HMI: it takes `weatherUpdate` and `color~` again */
    __publicField(this, "notifyHidden", false);
    __publicField(this, "headingNotification", "");
    __publicField(this, "textNotification", "");
    __publicField(this, "customNotification", false);
    __publicField(this, "activeNotification", false);
    __publicField(this, "activeNotifyId", "");
    /** timer instead of the clock, undefined = none or not usable */
    __publicField(this, "clockTimer");
    __publicField(this, "timerSources", /* @__PURE__ */ new Map());
    __publicField(this, "timerMemory", /* @__PURE__ */ new Map());
    /** unit and kind of the data states as far as read */
    __publicField(this, "timerCommon", /* @__PURE__ */ new Map());
    __publicField(this, "timerPatterns", []);
    __publicField(this, "timerSelection", import_screensaver_timer.TIMER_OFF);
    /** the timer was tapped away, the clock is shown - only at runtime */
    __publicField(this, "timerTappedAway", false);
    __publicField(this, "lastTimerTap", 0);
    __publicField(this, "timerTick");
    /** page items of this panel that use this timer, see {@link addClockTimerListener} */
    __publicField(this, "clockTimerListeners", /* @__PURE__ */ new Set());
    /** a page item is the source of the timer, see {@link connectClockTimerItem} */
    __publicField(this, "timerItem");
    /** last timer message on the display, the time trigger of the clock must not repeat it */
    __publicField(this, "lastTimerPayload", "");
    /** timer status of the last `color~` */
    __publicField(this, "colorTimerStatus", "off");
    /** the last `color~` was for a shown timer */
    __publicField(this, "colorTimerShown", false);
    /** the HMI drops `color~` while a notification is shown */
    __publicField(this, "colorsDropped", false);
    /** the HMI drops `weatherUpdate` while a notification is shown */
    __publicField(this, "weatherDropped", false);
    /**
     * The page was loaded again (`pageType~`): `time~` follows the content of the next update(), behind `color~` and
     * `weatherUpdate~` - the HMI sets the clock from a global variable while loading the page, it is not urgent.
     */
    __publicField(this, "timeAfterRender", false);
    __publicField(this, "onTimerItemChange", () => {
      this.clockTimerListeners.forEach((listener) => listener());
      void this.onStateTriggerSuperDoNotOverride("timer", this);
    });
    __publicField(this, "onTimerPatternState", (id, state) => {
      var _a;
      if (this.applyTimerPatternState(id, state)) {
        (_a = this.clockTimerListeners) == null ? void 0 : _a.forEach((listener) => listener());
        void this.onStateTriggerSuperDoNotOverride(id, this);
      }
    });
    __publicField(this, "rotationLoop", async () => {
      if (!this.visibility) {
        return;
      }
      await this.update();
      if (this.rotationTime === 0) {
        this.step = 0;
        return;
      }
      this.step = this.step > 1e4 ? 0 : this.step + 1;
      if (this.unload || this.adapter.unload) {
        return;
      }
      this.timeoutRotation = this.adapter.setTimeout(
        this.rotationLoop,
        this.rotationTime < 3e3 ? 3e3 : this.rotationTime
      );
    });
    /**
     * ..
     *
     * @param _dp - the dp that triggered the state
     * @param from - the class that triggered the state
     */
    __publicField(this, "onStateTrigger", async (_dp, from) => {
      const config = this.config;
      if (!config || !globals.isScreenSaverCardType(config.card)) {
        return;
      }
      if (from === this) {
        await this.onTimerStatesChanged();
        return;
      }
      if (from instanceof import_pageItem.PageItem && this.pageItems) {
        const index = parseInt(from.id.split("?")[1]);
        const item = this.pageItems[index];
        if (item && item.config) {
          const place = item.config.modeScr;
          if (place !== void 0) {
            switch (place) {
              case "left":
              case "bottom":
              case "indicator":
              case "alternate":
              case "favorit": {
                await this.update();
                break;
              }
              case "mricon": {
                await this.HandleScreensaverStatusIcons();
                break;
              }
              case "time": {
                await this.HandleTime();
                break;
              }
              case "date": {
                await this.HandleDate();
                break;
              }
              case "notify": {
                await this.HandleNotification();
                break;
              }
            }
          }
        }
      }
    });
    this.screensaverSwipe = (_a = options.config.screensaverSwipe) != null ? _a : false;
    this.clockTimer = ((_b = options.config.clockTimer) == null ? void 0 : _b.enabled) ? options.config.clockTimer : void 0;
    this.rotationTime = options.config.rotationTime !== 0 && options.config.rotationTime < 3 ? 3e3 : options.config.rotationTime * 1e3;
    this.neverDeactivateTrigger = true;
    this.replayTriggerPerSource = true;
  }
  async init() {
    await super.init();
    this.pageItems = await this.createPageItems(this.pageItemConfig);
    await this.basePanel.setScreensaverSwipe(this.screensaverSwipe);
    if (this.pageItems) {
      const indicators = this.pageItems.filter((x) => x && x.config && x.config.modeScr === "indicator");
      for (let a = 0; a < indicators.length; a++) {
        await this.library.writedp(
          `panels.${this.basePanel.name}.buttons.indicator-${a + 1}`,
          void 0,
          Definition.genericStateObjects.panel.panels.buttons.indicator
        );
        await this.library.writedp(
          `panels.${this.basePanel.name}.buttons.indicatorLong-${a + 1}`,
          void 0,
          Definition.genericStateObjects.panel.panels.buttons.indicatorLong
        );
      }
    }
    await this.initClockTimer();
  }
  /**
   * Connects the states of the timer. A timer that can not run is dropped with one warning, the clock stays.
   */
  async initClockTimer() {
    var _a, _b, _c, _d, _e, _f;
    const timer = this.clockTimer;
    if (!timer || this.timerSources.size > 0 || this.timerPatterns.length > 0) {
      return;
    }
    const label = `Screensaver '${this.name}' of panel '${this.basePanel.friendlyName || this.basePanel.name}'`;
    if ((0, import_adminShareConfig.clockTimerUsesPageItem)(timer) && (0, import_adminShareConfig.isClockTimerComplete)(timer)) {
      return;
    }
    if (!(0, import_adminShareConfig.isClockTimerComplete)(timer)) {
      const reason = (0, import_adminShareConfig.clockTimerUsesPageItem)(timer) ? "no page item is chosen" : (0, import_adminShareConfig.clockTimerUsesSlots)(timer) ? `invalid slot patterns (${(0, import_adminShareConfig.checkClockTimerPatterns)((_a = timer.activePattern) != null ? _a : "", (_b = timer.dataPattern) != null ? _b : "")}): '${(_c = timer.activePattern) != null ? _c : ""}', '${(_d = timer.dataPattern) != null ? _d : ""}' - both need exactly one * after a path` : "the on/off state and the data state are both required";
      this.log.warn(`${label}: timer is ignored, ${reason}.`);
      this.clockTimer = void 0;
      return;
    }
    const states = this.controller.statesControler;
    try {
      if ((0, import_adminShareConfig.clockTimerUsesSlots)(timer)) {
        const patterns = [((_e = timer.activePattern) != null ? _e : "").trim(), ((_f = timer.dataPattern) != null ? _f : "").trim()];
        if (patterns.some((p) => p.startsWith(`${this.adapter.namespace}.`))) {
          throw new Error(`patterns must not refer to the adapter's own namespace: ${patterns.join(", ")}`);
        }
        this.timerPatterns = patterns;
        for (const pattern of patterns) {
          await states.subscribePattern(pattern, this.onTimerPatternState);
        }
        for (const pattern of patterns) {
          const found = await this.adapter.getForeignStatesAsync(pattern);
          for (const [id, state] of Object.entries(found)) {
            this.applyTimerPatternState(id, state);
          }
        }
      } else {
        const activeId = timer.activeState.trim();
        const dataId = timer.dataState.trim();
        await states.setTrigger(activeId, this);
        await states.setTrigger(dataId, this);
        this.timerSources.set("", {
          activeId,
          dataId,
          activeVal: await states.getStateVal(activeId),
          dataVal: await states.getStateVal(dataId)
        });
      }
    } catch (err) {
      this.log.warn(`${label}: timer is ignored: ${String(err)}`);
      await this.releaseTimerPatterns();
      this.timerSources.clear();
      this.clockTimer = void 0;
    }
  }
  /**
   * Connects a page item as the source of the timer, also while its page was never shown. No item, no countdown or
   * a circle (the item uses this screensaver): one warning and the clock stays, the states of the item are not read.
   */
  async connectClockTimerItem() {
    var _a;
    const itemId = (_a = this.clockTimer) == null ? void 0 : _a.itemId;
    if (!itemId || this.timerItem) {
      return;
    }
    const found = this.basePanel.findPageItemsById(itemId);
    const item = found.length === 1 ? await found[0].page.getPageItemAt(found[0].index) : void 0;
    let problem = "";
    if (found.length > 1) {
      problem = `the id is used by ${found.length} items of this panel`;
    } else if (!item) {
      problem = "this panel has no such item";
    } else if (item.usesScreensaverTimer) {
      problem = "the item itself uses the timer of the screensaver, that is a circle: remove 'use the timer of the screensaver' from the item or choose another source";
    } else if (!item.isCountdownSource()) {
      problem = "the item shows no countdown (alarm clock or display without STATUS)";
    }
    if (problem || !item) {
      this.log.warn(
        `Screensaver '${this.name}' of panel '${this.basePanel.friendlyName || this.basePanel.name}': timer from page item '${itemId}' is ignored: ${problem}.`
      );
      this.clockTimer = void 0;
      await (item == null ? void 0 : item.delete());
      return;
    }
    this.timerItem = item;
    await item.useAsClockTimerSource(this.onTimerItemChange);
  }
  /**
   * ends the subscriptions by pattern
   */
  async releaseTimerPatterns() {
    const patterns = this.timerPatterns;
    this.timerPatterns = [];
    for (const pattern of patterns) {
      try {
        await this.controller.statesControler.unsubscribePattern(pattern, this.onTimerPatternState);
      } catch (err) {
        this.log.debug(`Timer: unsubscribe of ${pattern} failed: ${String(err)}`);
      }
    }
  }
  /**
   * takes the value of a slot state; a slot of which both states are deleted is gone
   *
   * @param id state id
   * @param state the state, null when it was deleted
   * @returns true when something changed
   */
  applyTimerPatternState(id, state) {
    const [activePattern, dataPattern] = this.timerPatterns;
    const val = state ? state.val : void 0;
    let changed = false;
    for (const [pattern, field] of [
      [activePattern, "activeVal"],
      [dataPattern, "dataVal"]
    ]) {
      const key = (0, import_screensaver_timer.timerSlotKey)(pattern, id);
      if (key === void 0) {
        continue;
      }
      let source = this.timerSources.get(key);
      if (!source) {
        if (val === void 0) {
          continue;
        }
        source = {
          activeId: activePattern.replace("*", key),
          dataId: dataPattern.replace("*", key),
          activeVal: void 0,
          dataVal: void 0
        };
        this.timerSources.set(key, source);
      }
      if (source[field] !== val) {
        source[field] = val;
        changed = true;
      }
      if (source.activeVal === void 0 && source.dataVal === void 0) {
        this.timerSources.delete(key);
      }
    }
    return changed;
  }
  /**
   * the values of the two states of a simple timer; the trigger follows
   *
   * @param dp state id
   * @param state old and new state
   * @param state.old old state
   * @param state.new new state
   */
  async onStateChange(dp, state) {
    var _a, _b;
    const source = (_a = this.timerSources) == null ? void 0 : _a.get("");
    if ((source == null ? void 0 : source.activeId) === dp) {
      source.activeVal = state.new.val;
    }
    if ((source == null ? void 0 : source.dataId) === dp) {
      source.dataVal = state.new.val;
    }
    if ((source == null ? void 0 : source.activeId) === dp || (source == null ? void 0 : source.dataId) === dp) {
      (_b = this.clockTimerListeners) == null ? void 0 : _b.forEach((listener) => listener());
    }
    return Promise.resolve();
  }
  /**
   * unit and kind of a data state, read once
   *
   * @param id data state
   * @returns what the object says
   */
  async timerCommonOf(id) {
    const known = this.timerCommon.get(id);
    if (known) {
      return known;
    }
    const obj = await this.controller.statesControler.getObjectAsync(id);
    if (!obj || obj.type !== "state") {
      return { countdownState: false };
    }
    const common = { unit: obj.common.unit, countdownState: (0, import_screensaver_timer.isCountdownCommon)(obj.common) };
    this.timerCommon.set(id, common);
    return common;
  }
  /**
   * The next memory of all slots, the current one stays as it is.
   *
   * @param now current time in ms
   * @returns the memory per slot and whether a new timer began
   */
  async evaluateTimerSlots(now) {
    const memory = /* @__PURE__ */ new Map();
    let started = false;
    if (this.timerItem) {
      const key = "item";
      const step = (0, import_screensaver_timer.stepTimerItem)(this.timerMemory.get(key), await this.timerItem.getCountdownView());
      memory.set(key, step.memory);
      return { memory, started: step.started };
    }
    for (const [key, source] of this.timerSources) {
      const common = await this.timerCommonOf(source.dataId);
      const step = (0, import_screensaver_timer.stepTimerSlot)(
        this.timerMemory.get(key),
        {
          on: (0, import_screensaver_timer.isTimerOn)(source.activeVal),
          value: source.dataVal,
          unit: common.unit,
          countdownState: common.countdownState
        },
        now
      );
      memory.set(key, step.memory);
      started = started || step.started;
    }
    return { memory, started };
  }
  /**
   * What a page item of this panel can do with the timer (`useScreensaverTimer`). Only reads: the evaluation of the
   * display - and with it a tapped away timer and the sending of the display - stays with {@link refreshTimer}.
   *
   * @returns undefined when this screensaver has no usable timer
   */
  async getClockTimerAccess() {
    var _a;
    if (!this.clockTimer) {
      return void 0;
    }
    const now = Date.now();
    const { memory } = await this.evaluateTimerSlots(now);
    const selection = (0, import_screensaver_timer.selectTimer)(memory, now);
    if (this.timerItem) {
      const view = await this.timerItem.getCountdownView();
      return {
        selection,
        ticking: (0, import_screensaver_timer.nextTimerWakeMs)(memory, selection, false, now) !== void 0,
        canStart: view.status === "off" && view.canStart,
        canStop: view.status !== "off" && view.canStop
      };
    }
    const shown = selection.key === void 0 ? void 0 : this.timerSources.get(selection.key);
    const free = await this.findTimerStartSlot();
    return {
      selection,
      ticking: (0, import_screensaver_timer.nextTimerWakeMs)(memory, selection, false, now) !== void 0,
      canStart: !!free && free.activeCommon.write !== false && free.dataCommon.write !== false,
      canStop: !!shown && ((_a = await this.timerStateCommon(shown.activeId)) == null ? void 0 : _a.write) !== false
    };
  }
  /**
   * Starts the timer in the lowest free slot: first the data, so that switching on never sees the old one.
   *
   * @param seconds duration
   * @returns true when it was written
   */
  async startClockTimer(seconds) {
    if (this.timerItem) {
      return this.timerItem.startAsClockTimerSource(seconds);
    }
    const slot = await this.findTimerStartSlot();
    if (!slot || seconds <= 0 || slot.activeCommon.write === false || slot.dataCommon.write === false) {
      return false;
    }
    const value = (0, import_screensaver_timer.timerStartValue)(slot.dataCommon, seconds, Date.now());
    return await this.writeTimerState(slot.source.dataId, value) && await this.writeTimerState(slot.source.activeId, (0, import_screensaver_timer.timerActiveValue)(slot.activeCommon, true));
  }
  /**
   * Switches off the slot that is shown.
   *
   * @returns true when it was written
   */
  async stopClockTimer() {
    if (this.timerItem) {
      return this.timerItem.stopAsClockTimerSource();
    }
    const access = await this.getClockTimerAccess();
    const shown = (access == null ? void 0 : access.selection.key) === void 0 ? void 0 : this.timerSources.get(access.selection.key);
    const common = shown && await this.timerStateCommon(shown.activeId);
    if (!shown || !common || common.write === false) {
      return false;
    }
    return this.writeTimerState(shown.activeId, (0, import_screensaver_timer.timerActiveValue)(common, false));
  }
  /**
   * A page item is told about every change of the states of the timer.
   *
   * @param listener called on a change, must not throw
   */
  addClockTimerListener(listener) {
    this.clockTimerListeners.add(listener);
  }
  /**
   * @param listener as given to {@link addClockTimerListener}
   */
  removeClockTimerListener(listener) {
    var _a;
    (_a = this.clockTimerListeners) == null ? void 0 : _a.delete(listener);
  }
  /**
   * @returns the slot a start takes: the lowest one that is off and whose two states exist
   */
  async findTimerStartSlot() {
    for (const key of (0, import_screensaver_timer.orderTimerSlotKeys)(this.timerSources.keys())) {
      const source = this.timerSources.get(key);
      if (!source || (0, import_screensaver_timer.isTimerOn)(source.activeVal)) {
        continue;
      }
      const activeCommon = await this.timerStateCommon(source.activeId);
      const dataCommon = await this.timerStateCommon(source.dataId);
      if (activeCommon && dataCommon) {
        return { source, activeCommon, dataCommon };
      }
    }
    return void 0;
  }
  /**
   * @param id state id
   * @returns common of the state, undefined when it does not exist
   */
  async timerStateCommon(id) {
    const obj = await this.controller.statesControler.getObjectAsync(id);
    return (obj == null ? void 0 : obj.type) === "state" ? obj.common : void 0;
  }
  /**
   * @param id state id
   * @param value value to write, as a command - only states of the adapter are written confirmed
   * @returns false when it failed, that is logged
   */
  async writeTimerState(id, value) {
    try {
      await this.adapter.setForeignStateAsync(id, value, id.startsWith(`${this.adapter.namespace}.`));
      return true;
    } catch (err) {
      this.log.warn(`Timer: cannot write ${id}: ${String(err)}`);
      return false;
    }
  }
  /**
   * Evaluates all slots for now. A new timer, or another slot on the display, brings a tapped away timer back.
   *
   * @returns what the display has to show
   */
  async refreshTimer() {
    if (!this.clockTimer) {
      return import_screensaver_timer.TIMER_OFF;
    }
    const now = Date.now();
    const { memory, started } = await this.evaluateTimerSlots(now);
    this.timerMemory = memory;
    const selection = (0, import_screensaver_timer.selectTimer)(this.timerMemory, now);
    if (started || selection.status === "off" || selection.key !== void 0 && selection.key !== this.timerSelection.key) {
      this.timerTappedAway = false;
    }
    this.timerSelection = selection;
    return selection;
  }
  /**
   * a state of the timer changed: without a timer before and after it there is nothing to send
   */
  async onTimerStatesChanged() {
    const before = this.timerSelection.status;
    const selection = await this.refreshTimer();
    if (before !== "off" || selection.status !== "off") {
      await this.HandleTime();
    }
  }
  clearTimerTick() {
    if (this.timerTick) {
      this.adapter.clearTimeout(this.timerTick);
      this.timerTick = void 0;
    }
  }
  /**
   * Wakes up for the next change of the display that comes without a state change.
   *
   * @param selection what the display shows
   */
  scheduleTimerTick(selection) {
    this.clearTimerTick();
    if (!this.visibility || this.unload || this.adapter.unload) {
      return;
    }
    const wait = (0, import_screensaver_timer.nextTimerWakeMs)(this.timerMemory, selection, this.timerTappedAway, Date.now());
    if (wait !== void 0) {
      this.timerTick = this.adapter.setTimeout(() => {
        this.timerTick = void 0;
        void this.HandleTime();
      }, wait);
    }
  }
  /**
   * Build the screensaver message for requested places (order-preserving, parallel).
   *
   * - Runs only for screensaver cards.
   * - Keeps configured order by collecting (place, index, payload) and sorting by index per place.
   * - Numeric `enabled` → overwrite by index; boolean `enabled=false` → skip.
   *
   * @param places Places to include in the message.
   */
  async getData(places) {
    var _a;
    const config = this.config;
    if (!config || !globals.isScreenSaverCardType(config.card)) {
      return null;
    }
    const message = {
      options: {
        indicator: [],
        left: [],
        time: [],
        date: [],
        bottom: [],
        mricon: [],
        favorit: [],
        alternate: [],
        notify: []
      }
    };
    const overwrite = {
      indicator: [],
      left: [],
      time: [],
      date: [],
      bottom: [],
      mricon: [],
      favorit: [],
      alternate: [],
      notify: []
    };
    if (!this.pageItems) {
      return message;
    }
    const model = "model" in config ? config.model : "eu";
    const layout = this.mode;
    const results = await Promise.all(
      this.pageItems.map(async (pageItem, idx) => {
        var _a2, _b, _c, _d;
        const place = (_a2 = pageItem == null ? void 0 : pageItem.config) == null ? void 0 : _a2.modeScr;
        if (!place) {
          return null;
        }
        if (place === "alternate" && this.mode !== "alternate") {
          return null;
        }
        if (!places.includes(place)) {
          return null;
        }
        const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
        if (max === 0) {
          return null;
        }
        if (place !== "notify") {
          const enabledNum = await tools.getEnabledNumber((_c = (_b = pageItem.dataItems) == null ? void 0 : _b.data) == null ? void 0 : _c.enabled);
          if (enabledNum != null) {
            if (enabledNum >= 0) {
              const payload2 = await pageItem.getPageItemPayload();
              if (payload2 !== "") {
                return { kind: "overwrite", place, enabledIndex: enabledNum, payload: payload2 };
              }
            }
            return null;
          }
        }
        const enabledBool = await pageItem.isEnabled();
        if (enabledBool === false) {
          if ((_d = pageItem.config) == null ? void 0 : _d.fillIfBelowMin) {
            const payload2 = await pageItem.getPageItemPayload(true);
            return { kind: "filler", place, idx, payload: payload2 };
          }
          return null;
        }
        const payload = await pageItem.getPageItemPayload();
        return { kind: "append", place, idx, payload };
      })
    );
    const combinedByPlace = {
      indicator: [],
      left: [],
      time: [],
      date: [],
      bottom: [],
      mricon: [],
      favorit: [],
      alternate: [],
      notify: []
    };
    for (const r of results) {
      if (!r) {
        continue;
      }
      if (r.kind === "overwrite") {
        overwrite[r.place][r.enabledIndex] = r.payload;
      } else {
        combinedByPlace[r.place].push({ idx: r.idx, payload: r.payload, isFiller: r.kind === "filler" });
      }
    }
    for (const key in message.options) {
      const place = key;
      if (!places.includes(place)) {
        continue;
      }
      const maxForFill = (_a = Definition.ScreenSaverConst[layout][place].maxEntries[model]) != null ? _a : Definition.ScreenSaverConst[layout][place].maxEntries.eu;
      const combined = combinedByPlace[place].sort((a, b) => a.idx - b.idx);
      const regularCount = combined.filter((e) => !e.isFiller).length;
      let fillersLeft = Math.max(0, maxForFill - regularCount);
      for (const entry of combined) {
        if (entry.isFiller) {
          if (fillersLeft > 0) {
            message.options[place].push(entry.payload);
            fillersLeft--;
          }
        } else {
          message.options[place].push(entry.payload);
        }
      }
      Object.assign(message.options[place], overwrite[place]);
      let max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
      if (max == null) {
        max = Definition.ScreenSaverConst[layout][place].maxEntries.eu;
      }
      if (place === "notify") {
        message.options[place] = message.options[place].filter((n) => n && n !== "~~~~~");
        max = message.options[place].length;
      }
      let items = message.options[place] || [];
      if (items.length > max) {
        const windows = Math.ceil(items.length / max);
        const windowIdx = this.step % windows;
        items = items.slice(max * windowIdx, max * (windowIdx + 1));
        message.options[place] = items;
      }
      for (let i = 0; i < max; i++) {
        const msg = message.options[place][i];
        if (!msg) {
          message.options[place][i] = tools.getPayload("", "", "", "", "", "");
        } else {
          const arr = msg.split("~");
          arr[0] = "";
          if (place !== "indicator" && place !== "notify") {
            arr[1] = "";
          }
          if (place !== "notify" && arr.length > 2) {
            if (!this.readsIconFont(place)) {
              arr[2] = tools.stripIconFontSuffix(arr[2]);
            } else {
              arr[2] = tools.dropIconFontWithoutGlyphs(arr[2]);
            }
          }
          message.options[place][i] = tools.getPayloadArrayRemoveTilde(arr);
        }
      }
    }
    return message;
  }
  /**
   * Send (or clear) a screensaver notification to the panel if the panel is online.
   *
   * @param enabled When true, send heading + text; otherwise clear the notify.
   */
  sendNotify(enabled) {
    if (!this.basePanel.isOnline) {
      return;
    }
    this.customNotification = enabled && (this.headingNotification !== "" || this.textNotification !== "");
    void this.HandleNotification();
  }
  notifyPayload(enabled, heading, text) {
    return enabled ? tools.getPayloadRemoveTilde("notify", heading, text) : tools.getPayload("notify", "", "");
  }
  /**
   * Sends a message of a filtered type when it differs from the last one of that type.
   *
   * @param kind type of the message
   * @param payload the message
   * @returns true when it was sent
   */
  sendIfChanged(kind, payload) {
    if (this.lastSent.get(kind) === payload) {
      return false;
    }
    this.lastSent.set(kind, payload);
    super.resetLastMessage();
    this.sendToPanel(payload, false);
    return true;
  }
  /**
   * Sends again what the HMI dropped while a notification was shown (`tNotifyHead`/`tNotifyText` not empty): the
   * memory holds these messages as sent. Only useful as soon as the notification is gone from the display.
   */
  resendDropped() {
    const weather = this.lastSent.get("weatherUpdate");
    if (this.weatherDropped && weather !== void 0) {
      this.lastSent.delete("weatherUpdate");
      this.weatherDropped = false;
      this.sendWeather(weather);
    }
    if (this.colorsDropped) {
      this.lastSent.delete("color");
      this.sendColors();
    }
  }
  sendWeather(payload) {
    if (this.sendIfChanged("weatherUpdate", payload)) {
      this.weatherDropped = this.dropsValues();
    }
  }
  /**
   * Any touch makes the HMI clear a notification by itself (`tc0` press, unless the display is off) - and the adapter
   * only hears of `bExit` or of the indicator. The notification stays active here and is not sent again: it comes
   * back with the next `pageType~` or a new content. What the HMI dropped behind it can go out now. With a standby
   * brightness of 0 the touch may have hit a dark display and cleared nothing: then what follows still counts as
   * dropped and is repeated with the next touch or the end of the notification.
   */
  onTouch() {
    if (!this.activeNotification) {
      return;
    }
    const dim = this.basePanel.dim;
    this.notifyHidden = (dim.dayMode ? dim.standby : dim.nightStandby) > 0;
    this.resendDropped();
  }
  /**
   * @returns true while the HMI drops `weatherUpdate` and `color~`
   */
  dropsValues() {
    return this.activeNotification && !this.notifyHidden;
  }
  /**
   * The memory of the filtered messages goes with the one of the base class.
   */
  resetLastMessage() {
    super.resetLastMessage();
    this.lastSent.clear();
  }
  /**
   * A wanted `pageType~` must reach the panel, also when it is the last message: nothing else was sent since then.
   *
   * @param force see {@link Page.sendType}
   */
  sendType(force) {
    if (force || this.basePanel.lastCard !== this.card) {
      super.resetLastMessage();
    }
    super.sendType(force);
  }
  /**
   * The screensaver takes its first colors along with the pageType: `pageType~<card>~~<bg>?<time>?<ampm>?<date>`
   * (the values of the fields 1-4 of `color~`). TFT 6.1.0+ sets them while loading the page, before it is drawn the
   * first time - without them `color~` draws the whole page again. Older TFTs only read field 1 and keep field 3 in
   * a variable the screensavers do not use. `color~` still follows for all other colors.
   *
   * @returns the pageType message with the colors
   */
  getPageTypePayload() {
    const payload = super.getPageTypePayload();
    if (!globals.isScreenSaverCardType(this.card)) {
      return payload;
    }
    return `${payload}~~${this.pageTypeColors()}`;
  }
  /**
   * @returns background, time, AM/PM and date color as RGB565, separated by `?`
   */
  pageTypeColors() {
    return [import_Color.Color.background, this.timeColor(), import_Color.Color.fgTimeAmPm, import_Color.Color.fgDate].map((color) => import_Color.Color.rgb_dec565(color)).join("?");
  }
  /**
   * Every `pageType~` loads the page again on the HMI: empty values, default colors and no notification
   * (`vscope` 0, `txt` empty in tNotifyHead and tNotifyText, `load` hides both), whoever asked for it.
   * Everything follows with the next update(), each way that sends a pageType runs one.
   *
   * @param payload the message
   * @param ackForType see {@link BaseTriggeredPage.sendToPanelClass}
   * @param force see {@link BaseTriggeredPage.sendToPanelClass}
   * @param opt see {@link BaseTriggeredPage.sendToPanelClass}
   */
  sendToPanelClass(payload, ackForType, force, opt) {
    if (payload.startsWith("pageType~")) {
      this.lastSent.clear();
      this.activeNotification = false;
      this.colorsDropped = false;
      this.weatherDropped = false;
      this.lastTimerPayload = "";
      this.notifyHidden = false;
      this.lastUpdateTs = 0;
      this.timeAfterRender = true;
    }
    super.sendToPanelClass(payload, ackForType, force, opt);
  }
  /** Current info icon (readonly property wrapper). */
  get infoIcon() {
    return this._infoIcon;
  }
  /**
   * Update the info icon and trigger time handling refresh.
   */
  set infoIcon(infoIcon) {
    this._infoIcon = infoIcon;
    void this.HandleTime();
  }
  /**
   * Update the screensaver view with data for selected places.
   * - Prepends an empty payload to 'alternate' if it contains entries
   * - Sends a 'weatherUpdate' payload with concatenated place arrays and the colors, only when they changed: the same
   *   content sends nothing and starts no pause
   * - At most one burst every 2 s: a change arriving earlier waits for one deferred update, which reads the values
   *   again. Time/date updates are not affected, a press on an item ends the pause.
   * - Status icons and notifications come along with every update that is not deferred, only when they changed.
   * - After a `pageType~` the order is `color~` (draws the empty page with its background), `weatherUpdate~`,
   *   `time~` and then everything else.
   */
  async update() {
    if (!this.visibility) {
      return;
    }
    const run = ++this.updateRun;
    await super.update();
    const message = await this.getData(["left", "bottom", "indicator", "alternate", "favorit"]);
    if (run !== this.updateRun || !this.visibility) {
      return;
    }
    if (message === null) {
      await this.sendTimeAfterRender();
      return;
    }
    if (message.options.alternate.length > 0) {
      message.options.alternate.unshift(tools.getPayload("", "", "", "", "", ""));
    }
    const arr = [
      ...message.options.favorit || [],
      ...message.options.left || [],
      ...message.options.bottom || [],
      ...message.options.alternate || [],
      ...message.options.indicator || []
    ];
    const msg = tools.getPayload("weatherUpdate", tools.getPayloadArray(arr));
    if (this.lastSent.get("weatherUpdate") !== msg || this.lastSent.get("color") !== this.colorPayload()) {
      const now = Date.now();
      const wait = this.lastUpdateTs + _Screensaver.minUpdateInterval - now;
      if (wait > 0) {
        if (!this.updateThrottle && !this.unload && !this.adapter.unload) {
          this.updateThrottle = this.adapter.setTimeout(() => {
            this.updateThrottle = void 0;
            void this.update();
          }, wait);
        }
        await this.sendTimeAfterRender();
        return;
      }
      this.lastUpdateTs = now;
      this.sendColors();
      this.sendWeather(msg);
    }
    await this.sendTimeAfterRender();
    await this.HandleScreensaverStatusIcons();
    await this.HandleNotification();
  }
  /**
   * Sends `time~` once after a `pageType~`, see {@link timeAfterRender}.
   */
  async sendTimeAfterRender() {
    if (!this.timeAfterRender) {
      return;
    }
    this.timeAfterRender = false;
    await this.HandleTime();
  }
  async createPageItems(pageItemsConfig) {
    return await super.createPageItems(pageItemsConfig);
  }
  sendColors() {
    var _a, _b;
    const colorPayload = this.colorPayload();
    this.colorTimerStatus = (_b = (_a = this.timerSelection) == null ? void 0 : _a.status) != null ? _b : "off";
    this.colorTimerShown = this.isTimerShown();
    if (this.sendIfChanged("color", colorPayload)) {
      this.colorsDropped = this.dropsValues();
    }
  }
  colorPayload() {
    return `color~${import_Color.Color.rgb_dec565(import_Color.Color.background)}~${import_Color.Color.rgb_dec565(this.timeColor())}~${import_Color.Color.rgb_dec565(import_Color.Color.fgTimeAmPm)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgDate)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgMain)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgBar)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgMainAlt)}~${import_Color.Color.rgb_dec565(this.timeAddColor())}`;
  }
  /**
   * @returns color of the info icon: the timer overrides it as long as it is active
   */
  timeAddColor() {
    var _a;
    switch ((_a = this.timerSelection) == null ? void 0 : _a.status) {
      case "running":
      case "paused":
        return import_Color.Color.Orange;
      case "expired":
        return import_Color.Color.Red;
      default:
        return import_Color.Color.fgTimeAdd;
    }
  }
  /**
   * @returns color of the time: the one of the timer while it is on the display - after a tap to the clock only the
   * icon keeps it
   */
  timeColor() {
    return this.isTimerShown() ? this.timeAddColor() : import_Color.Color.fgTime;
  }
  /**
   * @returns true while the display shows the timer instead of the clock
   */
  isTimerShown() {
    var _a, _b;
    const status = (_b = (_a = this.timerSelection) == null ? void 0 : _a.status) != null ? _b : "off";
    return status !== "off" && !this.timerTappedAway;
  }
  async onVisibilityChange(v) {
    this.step = 0;
    if (v) {
      this.lastUpdateTs = 0;
      this.resetLastMessage();
      this.timerTappedAway = false;
      this.lastTimerTap = 0;
      this.lastTimerPayload = "";
      this.timeAfterRender = true;
      this.sendType();
      await this.restartRotationLoop();
      await this.sendTimeAfterRender();
    } else {
      if (this.timeoutRotation) {
        this.adapter.clearTimeout(this.timeoutRotation);
      }
      this.clearTimerTick();
    }
  }
  async restartRotationLoop() {
    if (this.timeoutRotation) {
      this.adapter.clearTimeout(this.timeoutRotation);
    }
    await this.rotationLoop();
  }
  async HandleTime() {
    if (this.basePanel.isOnline === false) {
      return;
    }
    const timer = await this.refreshTimer();
    const timerActive = timer.status !== "off";
    if (timerActive && !this.visibility) {
      return;
    }
    const showTimer = timerActive && !this.timerTappedAway;
    let text = timer.text;
    if (!showTimer) {
      const message = await this.getData(["time"]);
      if (message === null || !message.options.time[0]) {
        this.log.debug("HandleTime: no message, no time or panel is offline");
        return;
      }
      text = message.options.time[0].split("~")[5];
    }
    let icon = `${this.infoIcon ? `~${import_icon_mapping.Icons.GetIcon(this.infoIcon)}` : ""}`;
    if (timerActive) {
      const iconName = timer.status === "expired" ? "timer-alert" : timer.status === "paused" ? "timer-pause" : "timer-sand";
      icon = `~${import_icon_mapping.Icons.GetIcon(iconName)}`;
    } else if (this.basePanel.isVirtual) {
    } else if (this.basePanel.info.nspanel.displayVersion === "0.0.0") {
      if (!this.adapter.config.hideDeveloperSymbols) {
        icon = `~${import_icon_mapping.Icons.GetIcon("cog-refresh-outline")}`;
      }
    } else if (!icon && tools.isVersionOlder(this.basePanel.info.nspanel.displayVersion, this.basePanel.info.nspanel.onlineVersion)) {
      icon = `~${import_icon_mapping.Icons.GetIcon("wrench-clock")}`;
    }
    const colorsChanged = !!this.clockTimer && this.visibility && (this.colorTimerStatus !== timer.status || this.colorTimerShown !== showTimer);
    const payload = `time~${text}${icon}`;
    this.scheduleTimerTick(timer);
    if (colorsChanged && !showTimer) {
      this.sendColors();
    }
    if (!showTimer || payload !== this.lastTimerPayload) {
      this.lastTimerPayload = showTimer ? payload : "";
      this.sendToPanel(payload, false);
    }
    if (colorsChanged && showTimer) {
      this.sendColors();
    }
  }
  async HandleDate() {
    if (this.basePanel.isOnline === false) {
      return;
    }
    const message = await this.getData(["date"]);
    if (message === null || !message.options.date[0]) {
      this.log.debug("HandleDate: no message, no date or panel is offline");
      return;
    }
    this.sendToPanel(`date~${message.options.date[0].split("~")[5]}`, false);
  }
  async HandleScreensaverStatusIcons() {
    var _a, _b, _c, _d, _e, _f;
    if (!this.visibility) {
      return;
    }
    const message = await this.getData(["mricon"]);
    if (message === null) {
      return;
    }
    const mrIcon1 = ((_a = message.options.mricon[0]) != null ? _a : "").split("~");
    const mrIcon2 = ((_b = message.options.mricon[1]) != null ? _b : "").split("~");
    const msgArray = [
      "statusUpdate",
      (_c = mrIcon1[2]) != null ? _c : "",
      (_d = mrIcon1[3]) != null ? _d : "",
      (_e = mrIcon2[2]) != null ? _e : "",
      (_f = mrIcon2[3]) != null ? _f : "",
      this.basePanel.info.nspanel.bigIconLeft ? "1" : "",
      this.basePanel.info.nspanel.bigIconRight ? "1" : ""
    ];
    const msg = tools.getPayloadArrayRemoveTilde(msgArray);
    this.sendIfChanged("statusUpdate", msg);
  }
  async HandleNotification() {
    if (this.basePanel.isOnline === false) {
      return;
    }
    const message = await this.getData(["notify"]);
    if (message === null) {
      return;
    }
    const notifyList = message.options.notify.map((n) => n.split("~")).filter((n) => n[4] !== "" || n[5] !== "").map((n) => {
      const s = n[5].split("<sp!it>");
      const { heading, text } = (0, import_adminShareConfig.screensaverNotifyLines)({ icon: n[2], headline: s[0], text: n[4] });
      const prio = !isNaN(parseInt(s[1], 10)) ? parseInt(s[1], 10) : 99;
      const buzzer = s[2];
      const id = n[1];
      return { heading, text, prio, id, buzzer };
    }).sort((a, b) => a.prio === b.prio ? 0 : a.prio > b.prio ? 1 : -1);
    if (this.customNotification === true) {
      __privateMethod(this, _Screensaver_instances, sendNotify_fn).call(this, this.customNotification, this.headingNotification, this.textNotification);
    } else if (notifyList.length > 0) {
      const heading = notifyList[0].heading;
      const text = notifyList[0].text;
      if (heading !== "" || text !== "") {
        if (this.activeNotifyId != notifyList[0].id && this.lastSent.get("notify") !== this.notifyPayload(true, heading, text) && notifyList[0].buzzer && this.basePanel.dim.dayMode && this.basePanel.isBuzzerAllowed) {
          this.basePanel.sendToTasmota(`${this.basePanel.topic}/cmnd/Buzzer`, notifyList[0].buzzer.trim());
        }
        this.activeNotifyId = notifyList[0].id;
        __privateMethod(this, _Screensaver_instances, sendNotify_fn).call(this, true, heading, text);
      }
    } else {
      this.activeNotifyId = "";
      __privateMethod(this, _Screensaver_instances, sendNotify_fn).call(this, false);
    }
  }
  async setGlobalNotificationDismiss(id) {
    var _a;
    if (!id) {
      return;
    }
    for (const item of this.pageItems || []) {
      if (item && ((_a = item.config) == null ? void 0 : _a.role) === "isDismissiblePerEvent") {
        const gId = item.getGlobalDismissibleID();
        if (gId === id && await item.isEnabled()) {
          item.setDismissiblePerEvent();
        }
      }
    }
    await this.HandleNotification();
  }
  async deactivateNotify() {
    var _a, _b;
    if (this.activeNotifyId) {
      const id = this.activeNotifyId.split("?")[1];
      if (id && !isNaN(parseInt(id, 10))) {
        const item = (_a = this.pageItems) == null ? void 0 : _a[parseInt(id, 10)];
        if (item && ((_b = item.config) == null ? void 0 : _b.role) === "isDismissiblePerEvent") {
          item.setDismissiblePerEvent();
          const globalId = item.getGlobalDismissibleID();
          if (globalId) {
            await this.controller.setGlobalNotificationDismiss(globalId);
          }
        }
      }
      this.activeNotifyId = "";
      await this.HandleNotification();
      return true;
    }
    return false;
  }
  /**
   * The first tap on a shown timer switches to the clock: no gesture, no notification, no page change. Taps of the
   * same double click that follow are swallowed, see {@link Screensaver.timerTapWindow}.
   *
   * @param action action of the event
   * @param opt taps counted by the HMI
   * @returns true when the tap is done
   */
  async onTimerTap(action, opt) {
    this.onTouch();
    if (action !== "bExit" || !this.clockTimer) {
      return false;
    }
    const now = Date.now();
    const timer = await this.refreshTimer();
    if (timer.status !== "off" && !this.timerTappedAway) {
      this.timerTappedAway = true;
      this.lastTimerTap = now;
      await this.HandleTime();
      this.lastSent.delete("notify");
      await this.HandleNotification();
      return true;
    }
    if (this.basePanel.screenSaverDoubleClick && now - this.lastTimerTap < _Screensaver.timerTapWindow && parseInt(opt) > 1) {
      this.lastTimerTap = now;
      return true;
    }
    return false;
  }
  async onScreensaverTap() {
    const result = await this.deactivateNotify();
    if (result) {
      return true;
    }
    return false;
  }
  /**
   * A tap on a screensaver item (`event,buttonPress2,<page>?<n>,button`) is handled by
   * {@link onButtonEvent} alone: it writes `buttons.indicator-N` and runs the command of the item
   * once. The base implementation would run the command here already - with the option
   * "indicators act as buttons" off that navigates to the main page before the panel reaches
   * `onButtonEvent` of this page (the indicator state was never written), with the option on the
   * command ran twice (a switch was flipped back at once). Everything else (popups) stays as is.
   *
   * @param id item id
   * @param popup popup type
   * @param action button action
   * @param value value of the action
   * @param event the incoming event
   */
  async onPopupRequest(id, popup, action, value, event = null) {
    var _a, _b, _c;
    if (action === "button") {
      return;
    }
    if ((popup === "popupShutter" || popup === "popupShutter2") && ((_c = (_b = (_a = this.pageItems) == null ? void 0 : _a[Number(id)]) == null ? void 0 : _b.dataItems) == null ? void 0 : _c.role) === "blind") {
      return;
    }
    await super.onPopupRequest(id, popup, action, value, event);
  }
  async onButtonEvent(event) {
    if (event.page !== void 0 && event.id && this.pageItems && this.pageItems[event.id]) {
      if (this.blockButtons || this.unload || this.adapter.unload) {
        return;
      }
      this.blockButtons = this.adapter.setTimeout(() => {
        this.blockButtons = void 0;
      }, 500);
      this.onTouch();
      this.lastUpdateTs = 0;
      await this.releaseTriggerThrottle();
      await this.writeIndicatorButton(this.pageItems[event.id]);
      await this.pageItems[event.id].onCommand(event.action, event.opt);
    }
  }
  /**
   * Writes `buttons.indicator-N` (tap) or `buttons.indicatorLong-N` (long press) for an indicator item (nothing for
   * other items)
   *
   * @param item the pressed item
   * @param state `indicator` for a tap, `indicatorLong` for a long press
   */
  async writeIndicatorButton(item, state = "indicator") {
    if (!item || !this.pageItems) {
      return;
    }
    const indicators = this.pageItems.filter((x) => x && x.config && x.config.modeScr === "indicator");
    for (let a = 0; a < indicators.length; a++) {
      if (indicators[a] === item) {
        await this.library.writedp(
          `panels.${this.basePanel.name}.buttons.${state}-${a + 1}`,
          true,
          Definition.genericStateObjects.panel.panels.buttons[state]
        );
      }
    }
  }
  /**
   * true for an event of an item of this screensaver (`<page>?<n>,button`)
   *
   * @param event the event of the panel
   */
  isIndicatorEvent(event) {
    var _a;
    return event.page !== void 0 && !!event.id && !!((_a = this.pageItems) == null ? void 0 : _a[Number(event.id)]);
  }
  /**
   * true when a tap on the indicator does something itself: an action configured at the item - button, switch,
   * cycle values, page or popup. `confirm` only guards such an action, alone it is none; a state that is merely
   * writable is no action either (a blind never moves).
   *
   * @param item the indicator item
   */
  isIndicatorKey(item) {
    var _a, _b, _c;
    const entry = item == null ? void 0 : item.dataItems;
    if (!entry || entry.type !== "button" && entry.type !== "switch") {
      return false;
    }
    const data = entry.data;
    return !!(data.setNavi || ((_a = data.setValue1) == null ? void 0 : _a.writeable) || ((_b = data.setValue2) == null ? void 0 : _b.writeable) || entry.type === "button" && ((_c = data.setValue3) == null ? void 0 : _c.writeable) && data.valueList || data.popup);
  }
  /**
   * A short tap on a tile of the TFT 6.0.8+ (`<page>?<n>,button,<taps>`, the taps counted together with the
   * background): `buttons.indicator-N` is always written, a key runs its command.
   *
   * @param event the event of the panel
   * @returns true when the item is a key and ran its command, false: the caller treats the tap like a touch of the
   *     background
   */
  async onIndicatorTap(event) {
    var _a;
    const item = (_a = this.pageItems) == null ? void 0 : _a[Number(event.id)];
    if (!item || this.unload || this.adapter.unload) {
      return false;
    }
    await this.writeIndicatorButton(item);
    if (!this.isIndicatorKey(item)) {
      return false;
    }
    this.onTouch();
    this.lastUpdateTs = 0;
    await this.releaseTriggerThrottle();
    await item.onCommand(event.action, event.opt);
    return true;
  }
  /**
   * true when the indicator has a long press of its own (`setNaviLongPress` or `longPress`,
   * config-manager getScreensaverIndicatorLongPress)
   *
   * @param item the indicator item
   */
  hasIndicatorLongPress(item) {
    const entry = item == null ? void 0 : item.dataItems;
    if (!entry || entry.type !== "button" && entry.type !== "switch") {
      return false;
    }
    return !!(entry.data.setNaviLongPress || entry.data.longPress);
  }
  /**
   * A long press on a tile of the TFT 6.0.9+ (`buttonPress3,<page>?<n>,button,<taps>`, sent while the finger is
   * still down): `buttons.indicatorLong-N` is always written; an indicator with a long press of its own runs it
   * ({@link PageItem.onCommandLongPress}) - the short press is not run then.
   *
   * @param event the event of the panel
   * @returns true when the long press of the item ran, false: the caller treats it like a tap
   *     ({@link onIndicatorTap})
   */
  async onIndicatorLongPress(event) {
    var _a;
    const item = (_a = this.pageItems) == null ? void 0 : _a[Number(event.id)];
    if (!item || this.unload || this.adapter.unload) {
      return false;
    }
    await this.writeIndicatorButton(item, "indicatorLong");
    if (!this.hasIndicatorLongPress(item)) {
      return false;
    }
    this.onTouch();
    this.lastUpdateTs = 0;
    await this.releaseTriggerThrottle();
    await item.onCommandLongPress(event.action, event.opt);
    return true;
  }
  async delete() {
    var _a;
    await super.delete();
    if (this.timeoutRotation) {
      this.adapter.clearTimeout(this.timeoutRotation);
    }
    if (this.updateThrottle) {
      this.adapter.clearTimeout(this.updateThrottle);
    }
    if (this.blockButtons) {
      this.adapter.clearTimeout(this.blockButtons);
    }
    this.clearTimerTick();
    this.clockTimerListeners.clear();
    (_a = this.timerItem) == null ? void 0 : _a.removeClockTimerSource(this.onTimerItemChange);
    this.timerItem = void 0;
    await this.releaseTimerPatterns();
  }
  goLeft() {
  }
  goRight() {
  }
  /**
   * true when the HMI page of this screensaver reads the font suffix `¬<id>` of the icons of a place:
   * screensaver5 (`tiles`) in its indicator fields
   *
   * @param place place of the items
   */
  readsIconFont(place) {
    var _a;
    return ((_a = this.config) == null ? void 0 : _a.card) === "screensaver5" && place === "indicator";
  }
  get mode() {
    if (!this.config || this.config.card !== "screensaver" && this.config.card !== "screensaver2" && this.config.card !== "screensaver3" && this.config.card !== "screensaver5") {
      return "standard";
    }
    return this.config.mode;
  }
  set mode(mode) {
    if (!this.config || this.config.card !== "screensaver" && this.config.card !== "screensaver2" && this.config.card !== "screensaver3" && this.config.card !== "screensaver5") {
      return;
    }
    if (globals.isScreenSaverMode(mode)) {
      this.config.mode = mode;
    } else {
      globals.exhaustiveCheck(mode);
      this.log.error(`Invalid mode: ${mode}`);
    }
  }
  overwriteModel(mode, init = false) {
    if (mode === _Screensaver.mapModeToNumber(this.mode)) {
      return;
    }
    switch (mode) {
      case 0:
      case 1: {
        this.card = "screensaver";
        if (this.config) {
          this.config.card = "screensaver";
        }
        break;
      }
      case 2: {
        this.card = "screensaver2";
        if (this.config) {
          this.config.card = "screensaver2";
        }
        break;
      }
      case 3: {
        this.card = "screensaver3";
        if (this.config) {
          this.config.card = "screensaver3";
        }
        break;
      }
      case 4: {
        this.card = "screensaver5";
        if (this.config) {
          this.config.card = "screensaver5";
        }
        break;
      }
      default: {
        globals.exhaustiveCheck(mode);
        this.log.error(`Invalid mode: ${mode}`);
        return;
      }
    }
    this.mode = _Screensaver.mapNumberToMode(mode);
    if (!init && this.visibility) {
      this.sendType();
      void this.update();
    }
  }
  static mapModeToNumber(mode) {
    const index = globals.arrayOfScreensaverModes.findIndex((x) => x === mode);
    return Math.min(
      Math.max(index, 0),
      globals.arrayOfScreensaverModes.length - 1
    );
  }
  static mapNumberToMode(mode) {
    return globals.arrayOfScreensaverModes[mode];
  }
};
_Screensaver_instances = new WeakSet();
sendNotify_fn = function(enabled, heading = "", text = "") {
  if (!this.basePanel.isOnline) {
    return;
  }
  const wasActive = this.activeNotification;
  this.activeNotification = enabled && (heading !== "" || text !== "");
  if (!this.activeNotification && !wasActive) {
    return;
  }
  if (this.sendIfChanged("notify", this.notifyPayload(this.activeNotification, heading, text))) {
    this.notifyHidden = false;
  }
  if (!this.activeNotification) {
    this.resendDropped();
  }
};
/** Minimum pause between two weatherUpdate/color bursts - protects the Nextion serial buffer */
__publicField(_Screensaver, "minUpdateInterval", 2e3);
/**
 * A tap that follows a tap on the timer is still the same double click up to this long after it (and the one
 * before, for more than two taps). The HMI has no limit of its own - all screensaver pages: `tc0` press does
 * `vaTap.val+=1` and prepares `bExit,<vaTap>`, its release sends it. Only `tmSleep` sets `vaTap.val=0` when the
 * display dims after `sleepTimeout`, or a reload of the page. So every later tap arrives with opt > 1 and this
 * limit must come from here: a quick double tap is over within it, even with the way over Tasmota and MQTT.
 */
__publicField(_Screensaver, "timerTapWindow", 1e3);
let Screensaver = _Screensaver;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Screensaver,
  resolveScreensaverOptions
});
//# sourceMappingURL=screensaver.js.map
