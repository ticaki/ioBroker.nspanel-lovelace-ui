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
  Screensaver: () => Screensaver
});
module.exports = __toCommonJS(screensaver_exports);
var Definition = __toESM(require("../const/definition"));
var globals = __toESM(require("../types/function-and-const"));
var import_icon_mapping = require("../const/icon_mapping");
var import_Page = require("../classes/Page");
var tools = __toESM(require("../const/tools"));
var import_pageItem = require("./pageItem");
var import_Color = require("../const/Color");
var _Screensaver_instances, sendNotify_fn;
const _Screensaver = class _Screensaver extends import_Page.Page {
  //readonly mode: Types.ScreensaverModeType = 'standard';
  constructor(config, options) {
    var _a, _b;
    if (!options.config || options.config.card !== "screensaver" && options.config.card !== "screensaver2" && options.config.card !== "screensaver3") {
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
    }
    options.alwaysOn = "none";
    super(config, options);
    __privateAdd(this, _Screensaver_instances);
    __publicField(this, "items");
    __publicField(this, "step", 0);
    __publicField(this, "blockButtons");
    __publicField(this, "rotationTime", 3e5);
    __publicField(this, "screensaverIndicatorButtons", false);
    __publicField(this, "screensaverSwipe", false);
    __publicField(this, "_infoIcon", "");
    __publicField(this, "timeoutRotation");
    __publicField(this, "headingNotification", "");
    __publicField(this, "textNotification", "");
    __publicField(this, "customNotification", false);
    __publicField(this, "activeNotification", false);
    __publicField(this, "activeNotifyId", "");
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
      if (!config || config.card !== "screensaver" && config.card !== "screensaver2" && config.card !== "screensaver3") {
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
    this.screensaverIndicatorButtons = (_a = options.config.screensaverIndicatorButtons) != null ? _a : false;
    this.screensaverSwipe = (_b = options.config.screensaverSwipe) != null ? _b : false;
    this.rotationTime = options.config.rotationTime !== 0 && options.config.rotationTime < 3 ? 3e3 : options.config.rotationTime * 1e3;
    this.neverDeactivateTrigger = true;
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
      }
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
        var _a, _b, _c;
        const place = (_a = pageItem == null ? void 0 : pageItem.config) == null ? void 0 : _a.modeScr;
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
          return null;
        }
        const payload = await pageItem.getPageItemPayload();
        return { kind: "append", place, idx, payload };
      })
    );
    const appendsByPlace = {
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
        appendsByPlace[r.place].push({ idx: r.idx, payload: r.payload });
      }
    }
    for (const key in message.options) {
      const place = key;
      if (!places.includes(place)) {
        continue;
      }
      const ordered = appendsByPlace[place].sort((a, b) => a.idx - b.idx).map((e) => e.payload);
      message.options[place].push(...ordered);
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
   * Update the screensaver view with data for selected places and refresh status icons.
   * - Prepends an empty payload to 'alternate' if it contains entries
   * - Sends a 'weatherUpdate' payload with concatenated place arrays
   */
  async update() {
    if (!this.visibility) {
      return;
    }
    const message = await this.getData(["left", "bottom", "indicator", "alternate", "favorit"]);
    if (message === null) {
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
    this.sendToPanel(msg, false);
    this.sendColors();
    await this.HandleScreensaverStatusIcons();
    await this.HandleNotification();
  }
  async createPageItems(pageItemsConfig) {
    return await super.createPageItems(pageItemsConfig);
  }
  sendColors() {
    const colorPayload = `color~${import_Color.Color.rgb_dec565(import_Color.Color.background)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgTime)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgTimeAmPm)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgDate)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgMain)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgForecast)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgBar)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgMainAlt)}~${import_Color.Color.rgb_dec565(import_Color.Color.fgTimeAdd)}`;
    this.sendToPanel(colorPayload, false);
  }
  async onVisibilityChange(v) {
    this.step = 0;
    if (v) {
      this.sendType();
      await this.HandleTime();
      await this.restartRotationLoop();
    } else {
      if (this.timeoutRotation) {
        this.adapter.clearTimeout(this.timeoutRotation);
      }
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
    const message = await this.getData(["time"]);
    if (message === null || !message.options.time[0]) {
      this.log.debug("HandleTime: no message, no time or panel is offline");
      return;
    }
    let icon = `${this.infoIcon ? `~${import_icon_mapping.Icons.GetIcon(this.infoIcon)}` : ""}`;
    if (this.basePanel.info.nspanel.displayVersion === "0.0.0") {
      if (!this.adapter.config.hideDeveloperSymbols) {
        icon = `~${import_icon_mapping.Icons.GetIcon("cog-refresh-outline")}`;
      }
    } else if (!icon && this.basePanel.info.nspanel.onlineVersion !== this.basePanel.info.nspanel.displayVersion) {
      icon = `~${import_icon_mapping.Icons.GetIcon("wrench-clock")}`;
    }
    this.sendToPanel(`time~${message.options.time[0].split("~")[5]}${icon}`, false);
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
    var _a, _b, _c, _d;
    if (!this.visibility) {
      return;
    }
    const message = await this.getData(["mricon"]);
    if (message === null) {
      return;
    }
    const mrIcon1 = message.options.mricon[0].split("~");
    const mrIcon2 = message.options.mricon[1].split("~");
    const msgArray = [
      "statusUpdate",
      (_a = mrIcon1[2]) != null ? _a : "",
      (_b = mrIcon1[3]) != null ? _b : "",
      (_c = mrIcon2[2]) != null ? _c : "",
      (_d = mrIcon2[3]) != null ? _d : "",
      this.basePanel.info.nspanel.bigIconLeft ? "1" : "",
      this.basePanel.info.nspanel.bigIconRight ? "1" : ""
    ];
    const msg = tools.getPayloadArrayRemoveTilde(msgArray);
    this.sendToPanel(msg, false);
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
      const text = n[4];
      const prio = !isNaN(parseInt(s[1], 10)) ? parseInt(s[1], 10) : 99;
      const buzzer = s[2];
      const heading = `${n[2]} ${s[0]}`.trim();
      const id = n[1];
      return { heading, text, prio, id, buzzer };
    }).sort((a, b) => a.prio === b.prio ? 0 : a.prio > b.prio ? 1 : -1);
    if (this.customNotification === true) {
      __privateMethod(this, _Screensaver_instances, sendNotify_fn).call(this, this.customNotification, this.headingNotification, this.textNotification);
    } else if (notifyList.length > 0) {
      const heading = notifyList[0].heading;
      const text = notifyList[0].text;
      if (heading !== "" || text !== "") {
        if (this.activeNotifyId != notifyList[0].id && notifyList[0].buzzer && this.basePanel.dim.dayMode && this.basePanel.isBuzzerAllowed) {
          this.basePanel.sendToTasmota(`${this.basePanel.topic}/cmnd/Buzzer`, notifyList[0].buzzer.trim());
        }
        this.activeNotifyId = notifyList[0].id;
        __privateMethod(this, _Screensaver_instances, sendNotify_fn).call(this, true, heading, text);
      }
    } else if (this.activeNotification) {
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
  async onScreensaverTap() {
    const result = await this.deactivateNotify();
    if (result) {
      return true;
    }
    return false;
  }
  async onButtonEvent(event) {
    if (event.page && event.id && this.pageItems && this.pageItems[event.id]) {
      if (this.blockButtons) {
        return;
      }
      const indicators = this.pageItems.filter((x) => x && x.config && x.config.modeScr === "indicator");
      for (let a = 0; a < indicators.length; a++) {
        if (indicators[a] === this.pageItems[event.id]) {
          await this.library.writedp(
            `panels.${this.basePanel.name}.buttons.indicator-${a + 1}`,
            true,
            Definition.genericStateObjects.panel.panels.buttons.indicator
          );
        }
      }
      await this.pageItems[event.id].onCommand(event.action, event.opt);
      if (this.unload || this.adapter.unload) {
        return;
      }
      this.blockButtons = this.adapter.setTimeout(() => {
        this.blockButtons = void 0;
      }, 500);
    }
  }
  async delete() {
    await super.delete();
    if (this.timeoutRotation) {
      this.adapter.clearTimeout(this.timeoutRotation);
    }
    if (this.blockButtons) {
      this.adapter.clearTimeout(this.blockButtons);
    }
  }
  goLeft() {
  }
  goRight() {
  }
  get mode() {
    if (!this.config || this.config.card !== "screensaver" && this.config.card !== "screensaver2" && this.config.card !== "screensaver3") {
      return "standard";
    }
    return this.config.mode;
  }
  set mode(mode) {
    if (!this.config || this.config.card !== "screensaver" && this.config.card !== "screensaver2" && this.config.card !== "screensaver3") {
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
  this.activeNotification = enabled && (heading !== "" || text !== "");
  const msg = this.activeNotification ? tools.getPayloadRemoveTilde("notify", heading, text) : tools.getPayload("notify", "", "");
  this.sendToPanel(msg, false);
};
let Screensaver = _Screensaver;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Screensaver
});
//# sourceMappingURL=screensaver.js.map
