"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var controller_exports = {};
__export(controller_exports, {
  Controller: () => Controller
});
module.exports = __toCommonJS(controller_exports);
var Library = __toESM(require("./library"));
var import_states_controller = require("./states-controller");
var Panel = __toESM(require("./panel"));
var import_definition = require("../const/definition");
var import_system_notifications = require("../classes/system-notifications");
var import_tools = require("../const/tools");
var import_Color = require("../const/Color");
class Controller extends Library.BaseClass {
  mqttClient;
  statesControler;
  panels = [];
  minuteLoopTimeout;
  dateUpdateTimeout;
  dailyIntervalTimeout;
  dataCache = {};
  options;
  globalPanelInfo = {
    availableTftFirmwareVersion: "",
    availableTasmotaFirmwareVersion: ""
  };
  systemNotification;
  constructor(adapter, options) {
    super(adapter, options.name);
    switch (this.adapter.config.colorTheme) {
      case 1:
        import_Color.Color.setTheme(import_Color.Color.topicalTheme);
        break;
      case 2:
        import_Color.Color.setTheme(import_Color.Color.technicalTheme);
        break;
      case 3:
        import_Color.Color.setTheme(import_Color.Color.sunsetTheme);
        break;
      case 4:
        import_Color.Color.setTheme(import_Color.Color.volcanoTheme);
        break;
      case 5: {
        const custom = this.buildCustomColorTheme();
        import_Color.Color.setTheme(custom);
        this.adapter.log.debug(`Custom ColorTheme angewendet: ${JSON.stringify(custom)}`);
        break;
      }
      case 0:
      default:
        import_Color.Color.setTheme(import_Color.Color.defaultTheme);
        break;
    }
    this.adapter.controller = this;
    this.mqttClient = options.mqttClient;
    this.statesControler = new import_states_controller.StatesControler(this.adapter);
    this.systemNotification = new import_system_notifications.SystemNotifications(this.adapter);
    this.options = options;
    if (this.adapter.mqttServer) {
      this.adapter.mqttServer.controller = this;
    }
    void this.init(options.panels);
    this.log.debug(`${this.name} created`);
  }
  minuteLoop = async () => {
    const now = /* @__PURE__ */ new Date();
    const minute = now.getMinutes();
    try {
      if (minute === 0) {
        for (const panel of this.panels) {
          panel.sendDimmode();
        }
      }
      if (minute % 5 === 1) {
        for (const panel of this.panels) {
          panel.requestStatusTasmota();
        }
      }
      const currentTime = await this.getCurrentTime();
      await this.statesControler.setInternalState("///time", currentTime, true);
      const currentTimeString = await this.getCurrentTimeString();
      await this.statesControler.setInternalState("///timeString", currentTimeString, true);
      await this.adapter.delay(10);
    } catch (e) {
      this.log.error(`minuteLoop error: ${e instanceof Error ? e.message : JSON.stringify(e)}`);
    }
    const next = new Date(now);
    next.setSeconds(0, 10);
    next.setMinutes(now.getMinutes() + 1);
    const diff = next.getTime() - Date.now();
    if (this.unload || this.adapter.unload) {
      return;
    }
    this.minuteLoopTimeout = this.adapter.setTimeout(() => this.minuteLoop(), diff);
  };
  /**
   * Update Date every day at 0:00:01....
   *
   * @returns void
   */
  hourLoop = async () => {
    const now = /* @__PURE__ */ new Date();
    const next = new Date(now);
    const hourNow = now.getHours();
    next.setHours(now.getHours() + 1, 0, 4);
    const diff = next.getTime() - now.getTime();
    try {
      if (hourNow === 0) {
        const currentTime = await this.getCurrentTime();
        this.log.debug(`Set current Date with time: ${new Date(currentTime).toString()}`);
        await this.statesControler.setInternalState("///date", currentTime, true);
      }
    } catch (err) {
      this.log.error(`dateUpdateLoop failed: ${err}`);
    }
    if (hourNow % 8 === 0) {
      await this.checkOnlineVersion();
    }
    if (this.unload || this.adapter.unload) {
      return;
    }
    this.dateUpdateTimeout = this.adapter.setTimeout(() => this.hourLoop(), diff);
  };
  getCurrentTime = async () => {
    return new Promise((resolve) => resolve(Date.now()));
  };
  getCurrentTimeString = async () => {
    return new Promise(
      (resolve) => resolve((/* @__PURE__ */ new Date()).toLocaleString("de-DE", { hour: "2-digit", minute: "2-digit" }))
    );
  };
  /**
   * Handles internal commands based on the provided id and state.
   *
   * @param id - The identifier for the internal command.
   * @param _state - The state associated with the command.
   * @returns The value of the internal state or null if not applicable.
   */
  onInternalCommand = async (id, _state) => {
    if (!id.startsWith("///")) {
      return null;
    }
    const token = id.split("///").pop();
    switch (token) {
      case "cmd/NotificationCustomID": {
        if (!_state || typeof _state.val === "object") {
          break;
        }
        await this.library.writedp(`pagePopup.id`, _state.val, import_definition.genericStateObjects.panel.panels.pagePopup.id);
        break;
      }
      case "cmd/NotificationCustomRight": {
        if (!_state || typeof _state.val === "object") {
          break;
        }
        await this.library.writedp(
          `pagePopup.buttonRight`,
          _state.val,
          import_definition.genericStateObjects.panel.panels.pagePopup.buttonRight
        );
        break;
      }
      case "cmd/NotificationCustomLeft": {
        if (!_state || typeof _state.val === "object") {
          break;
        }
        await this.library.writedp(
          `pagePopup.buttonLeft`,
          _state.val,
          import_definition.genericStateObjects.panel.panels.pagePopup.buttonLeft
        );
        break;
      }
      case "cmd/NotificationCustomMid": {
        if (!_state || typeof _state.val === "object") {
          break;
        }
        await this.library.writedp(
          `pagePopup.buttonMid`,
          _state.val,
          import_definition.genericStateObjects.panel.panels.pagePopup.buttonMid
        );
        break;
      }
      case "AdapterStoppedBoolean":
      case "AdapterNoConnectionBoolean":
      case "AdapterNoConnection":
      case "AdapterStopped": {
        if (this.dataCache[token] && this.dataCache[token].time < Date.now() - 5e3) {
          delete this.dataCache[token];
        }
        let save = false;
        if (!this.dataCache[token]) {
          this.dataCache[token] = { time: Date.now(), data: {} };
          save = true;
        }
        let list;
        if (save) {
          list = await this.adapter.getObjectViewAsync("system", "instance", {
            startkey: `system.adapter`,
            endkey: `system.adapter}`
          });
          this.dataCache[token].data[`system#view.instance`] = list;
        } else {
          list = this.dataCache[token].data[`system#view.instance`];
        }
        if (!list || !list.token) {
          return null;
        }
        let total = 0;
        let withProblems = 0;
        for (const item of list.rows) {
          const obj = item.value;
          if (!obj.common.enabled || obj.common.mode !== "daemon") {
            continue;
          }
          if (token === "AdapterStopped" || token === "AdapterStoppedBoolean") {
            let state;
            if (save) {
              state = await this.adapter.getForeignStateAsync(`${item.id}.alive`);
              this.dataCache[token].data[`${item.id}.alive`] = state;
            } else {
              state = this.dataCache[token].data[`${item.id}.alive`];
            }
            if (state && !state.val) {
              withProblems++;
              if (token === "AdapterStoppedBoolean") {
                return true;
              }
            }
            total++;
          } else if (token === "AdapterNoConnection" || token === "AdapterNoConnectionBoolean") {
            const nID = item.id.split(".").slice(2).join(".");
            let state;
            if (save) {
              state = await this.adapter.getForeignStateAsync(`${nID}.info.connection`);
              this.dataCache[token].data[`${nID}.info.connection`] = state;
            } else {
              state = this.dataCache[token].data[`${nID}.info.connection`];
            }
            if (state && !state.val) {
              withProblems++;
              if (token === "AdapterNoConnectionBoolean") {
                return true;
              }
            }
            total++;
          }
        }
        if (token === "AdapterNoConnectionBoolean" || token === "AdapterStoppedBoolean") {
          return false;
        }
        return `(${withProblems}/${total})`;
      }
    }
    return null;
  };
  async init(panels) {
    await this.statesControler.setInternalState(
      "///time",
      await this.getCurrentTime(),
      true,
      {
        name: "",
        type: "number",
        role: "value.time",
        read: true,
        write: false
      },
      this.getCurrentTime
    );
    await this.statesControler.setInternalState(
      "///timeString",
      await this.getCurrentTimeString(),
      true,
      {
        name: "",
        type: "string",
        role: "text",
        read: true,
        write: false
      },
      this.getCurrentTimeString
    );
    await this.statesControler.setInternalState(
      "///date",
      await this.getCurrentTime(),
      true,
      {
        name: "",
        type: "number",
        role: "value.time",
        read: true,
        write: false
      },
      this.getCurrentTime
    );
    await this.statesControler.setInternalState(
      `///AdapterNoConnection`,
      "",
      true,
      (0, import_tools.getInternalDefaults)("string", "text", false),
      this.onInternalCommand
    );
    await this.statesControler.setInternalState(
      `///AdapterStopped`,
      "",
      true,
      (0, import_tools.getInternalDefaults)("string", "text", false),
      this.onInternalCommand
    );
    await this.statesControler.setInternalState(
      `///AdapterNoConnectionBoolean`,
      true,
      true,
      (0, import_tools.getInternalDefaults)("boolean", "indicator", false),
      this.onInternalCommand
    );
    await this.statesControler.setInternalState(
      `///AdapterStoppedBoolean`,
      true,
      true,
      (0, import_tools.getInternalDefaults)("boolean", "indicator", false),
      this.onInternalCommand
    );
    await this.statesControler.setInternalState(
      `///cmd/NotificationCustomLeft`,
      "",
      true,
      (0, import_tools.getInternalDefaults)("string", "text", false),
      this.onInternalCommand
    );
    await this.statesControler.setInternalState(
      `///cmd/NotificationCustomMid`,
      "",
      true,
      (0, import_tools.getInternalDefaults)("string", "text", false),
      this.onInternalCommand
    );
    await this.statesControler.setInternalState(
      `///cmd/NotificationCustomRight`,
      "",
      true,
      (0, import_tools.getInternalDefaults)("string", "text", false),
      this.onInternalCommand
    );
    await this.statesControler.setInternalState(
      `///cmd/NotificationCustomID`,
      "",
      true,
      (0, import_tools.getInternalDefaults)("string", "text", false),
      this.onInternalCommand
    );
    await this.library.writedp(`panels`, void 0, import_definition.genericStateObjects.panel._channel);
    await this.library.writedp(`pagePopup`, void 0, import_definition.genericStateObjects.panel.panels.pagePopup._channel);
    for (const key of Object.keys(import_definition.genericStateObjects.panel.panels.pagePopup)) {
      if (key !== "_channel") {
        await this.library.writedp(
          `pagePopup.${key}`,
          void 0,
          import_definition.genericStateObjects.panel.panels.pagePopup[key]
        );
      }
    }
    void this.systemNotification.init();
    const tasks = [];
    for (const panelConfig of panels) {
      if (panelConfig === void 0) {
        continue;
      }
      tasks.push(this.addPanel(structuredClone(panelConfig)));
    }
    await Promise.all(tasks);
    void this.minuteLoop();
    void this.hourLoop();
    await this.checkOnlineVersion();
  }
  addPanel = async (panel) => {
    let index = this.panels.findIndex((p) => p.topic === panel.topic);
    if (index !== -1) {
      this.adapter.testSuccessful = false;
      this.adapter.log.error(`Panel ${panel.name} with topic ${panel.topic} already exists`);
      return;
    }
    index = this.adapter.config.panels.findIndex((p) => p.topic === panel.topic);
    if (index === -1) {
      this.adapter.testSuccessful = false;
      this.adapter.log.error(`Panel ${panel.name} with topic ${panel.topic} not found in config`);
      return;
    }
    panel.name = this.adapter.config.panels[index].id;
    panel.friendlyName = this.adapter.config.panels[index].name;
    panel.controller = this;
    const o = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
    if ((panel == null ? void 0 : panel.topic) && o && o.native && o.native.navigation) {
      if (o.native.navigation[panel.topic] && o.native.navigation[panel.topic].useNavigation) {
        panel.navigation = o.native.navigation[panel.topic].data;
      }
    }
    const newPanel = new Panel.Panel(this.adapter, panel);
    if (await newPanel.isValid()) {
      await newPanel.init();
      this.panels.push(newPanel);
      newPanel.initDone = true;
      this.log.debug(`Panel ${newPanel.name} created`);
    } else {
      await newPanel.delete();
      this.adapter.testSuccessful = false;
      this.log.error(`Panel ${panel.name} has a invalid configuration.`);
    }
  };
  removePanel = async (panel) => {
    const index = this.panels.findIndex((p) => p.topic === panel.topic);
    if (index !== -1) {
      this.panels.splice(index, 1);
      await panel.delete();
      this.log.info(`Panel ${panel.topic} deleted`);
    } else {
      this.log.error(`Panel ${panel.topic} not found`);
    }
  };
  mqttClientConnected = (id) => {
    if (id === this.mqttClient.clientId) {
      return true;
    }
    const index = this.panels.findIndex((p) => id.startsWith(this.library.cleandp(p.friendlyName)));
    if (index !== -1) {
      if (this.panels[index].initDone) {
        this.panels[index].restartLoops();
        return true;
      }
    }
    return false;
  };
  async setGlobalNotificationDismiss(id) {
    if (!id) {
      return;
    }
    for (const panel of this.panels) {
      if (panel.screenSaver) {
        await panel.screenSaver.setGlobalNotificationDismiss(id);
      }
    }
  }
  async setGlobalAlarmStatus(name, status) {
    for (const panel of this.panels) {
      for (const page of panel.pages) {
        if ((page == null ? void 0 : page.card) === "cardAlarm" && "isGlobal" in page && page.isGlobal && page.name === name) {
          await page.setStatusGlobal(status);
        }
      }
    }
  }
  async delete() {
    this.unload = true;
    if (this.minuteLoopTimeout) {
      this.adapter.clearTimeout(this.minuteLoopTimeout);
    }
    if (this.dateUpdateTimeout) {
      this.adapter.clearTimeout(this.dateUpdateTimeout);
    }
    if (this.dailyIntervalTimeout) {
      this.adapter.clearInterval(this.dailyIntervalTimeout);
    }
    if (this.systemNotification) {
      await this.systemNotification.delete();
    }
    if (this.statesControler) {
      await this.statesControler.delete();
    }
    const tasks = [];
    for (const a of this.panels) {
      if (a) {
        tasks.push(a.delete());
      }
    }
    await Promise.all(tasks);
    this.panels = [];
    this.dataCache = {};
    await super.delete();
  }
  async setPopupNotification(data) {
    let temp;
    try {
      temp = typeof data === "string" ? JSON.parse(data) : data;
    } catch {
      this.log.error("setPopupNotification: Invalid data format, must be valid JSON or object");
      return;
    }
    this.log.debug(`setPopupNotification called with data: ${JSON.stringify(temp)}`);
    const details = {
      id: typeof temp.id === "string" ? temp.id : "missing",
      priority: typeof temp.priority === "number" ? temp.priority : 50,
      alwaysOn: typeof temp.alwaysOn === "boolean" ? temp.alwaysOn : true,
      type: typeof temp.type === "string" ? temp.type : "information",
      global: temp.global !== false,
      headline: typeof temp.headline === "string" ? temp.headline : "Missing Headline",
      text: typeof temp.text === "string" ? temp.text : "Missing Text",
      buttonLeft: typeof temp.buttonLeft === "string" ? temp.buttonLeft : "",
      buttonMid: typeof temp.buttonMid === "string" ? temp.buttonMid : "",
      buttonRight: typeof temp.buttonRight === "string" ? temp.buttonRight : "",
      icon: typeof temp.icon === "string" ? temp.icon : void 0,
      iconColor: temp.iconColor != null ? (0, import_tools.getRGBFromValue)(temp.iconColor) : void 0,
      textSize: typeof temp.textSize === "string" ? temp.textSize : typeof temp.textSize === "number" ? String(temp.textSize) : void 0,
      colorHeadline: temp.colorHeadline != null ? (0, import_tools.getRGBFromValue)(temp.colorHeadline) : void 0,
      colorText: temp.colorText != null ? (0, import_tools.getRGBFromValue)(temp.colorText) : void 0,
      colorButtonLeft: temp.colorButtonLeft != null ? (0, import_tools.getRGBFromValue)(temp.colorButtonLeft) : void 0,
      colorButtonMid: temp.colorButtonMid != null ? (0, import_tools.getRGBFromValue)(temp.colorButtonMid) : void 0,
      colorButtonRight: temp.colorButtonRight != null ? (0, import_tools.getRGBFromValue)(temp.colorButtonRight) : void 0,
      buzzer: !temp.buzzer || !(temp.buzzer === true || typeof temp.buzzer === "string") ? false : temp.buzzer
    };
    let panels = [];
    if (!temp.panel) {
      panels = this.panels;
    } else {
      if (!Array.isArray(temp.panel)) {
        temp.panel = [temp.panel];
      }
      for (const pName of temp.panel) {
        const panel = this.panels.find((p) => p.name === pName || p.friendlyName === pName);
        if (!panel) {
          this.log.error(`setPopupMessage: Panel ${pName} not found`);
          continue;
        }
        panels.push(panel);
      }
    }
    temp.global = details.global && panels.length > 1;
    for (const panel of panels) {
      await this.statesControler.setInternalState(
        `${panel.name}/cmd/popupNotificationCustom`,
        JSON.stringify(details),
        false
      );
    }
  }
  async notificationToPanel() {
    if (!this.panels) {
      return;
    }
    await this.statesControler.setInternalState("///Notifications", true, true);
  }
  checkOnlineVersion = async () => {
    await this.getTFTVersion();
    await this.getTasmotaVersion();
  };
  async getTFTVersion() {
    try {
      const result = await this.adapter.fetch(
        "https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json"
      );
      const data = result;
      if (!data) {
        this.log.error("No version data received.");
        return;
      }
      const version = this.adapter.config.useBetaTFT ? result["tft-beta"].split("_")[0] : result.tft.split("_")[0];
      this.globalPanelInfo.availableTftFirmwareVersion = version.trim();
      for (const panel of this.panels) {
        panel.info.nspanel.onlineVersion = this.globalPanelInfo.availableTftFirmwareVersion;
      }
      this.globalPanelInfo.availableTasmotaFirmwareVersion = result.tasmota.trim();
      for (const panel of this.panels) {
        panel.info.tasmota.onlineVersion = this.globalPanelInfo.availableTasmotaFirmwareVersion;
      }
    } catch {
    }
  }
  async getTasmotaVersion() {
    var _a, _b;
    try {
      const result = await this.adapter.fetch(
        "https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json"
      );
      const TasmotaVersionOnline = result.tasmota.trim();
      this.globalPanelInfo.availableTasmotaFirmwareVersion = TasmotaVersionOnline;
      for (const panel of this.panels) {
        panel.info.tasmota.onlineVersion = this.globalPanelInfo.availableTasmotaFirmwareVersion;
      }
    } catch {
    }
    return (_b = (_a = this.globalPanelInfo) == null ? void 0 : _a.availableTasmotaFirmwareVersion) != null ? _b : "";
  }
  /**
   * Baut ein zusammengefasstes Farb-Objekt aus allen Color-Accordion Arrays.
   * Nimmt Color.defaultTheme als Basis und überschreibt nur definierte Werte.
   */
  buildCustomColorTheme() {
    const cfg = this.adapter.config;
    const result = { ...import_Color.Color.defaultTheme };
    const merge = (arr) => {
      if (!Array.isArray(arr) || !arr[0]) {
        return;
      }
      for (const [k, v] of Object.entries(arr[0])) {
        if (typeof v === "string" && v.trim() !== "" && /^col[A-Z]/.test(k)) {
          const keyNoPrefix = k.replace(/^col/, "");
          const kTemp = keyNoPrefix.length ? keyNoPrefix.charAt(0).toLowerCase() + keyNoPrefix.slice(1) : keyNoPrefix;
          if (import_Color.Color.isHex(v)) {
            const colRgb = import_Color.Color.ConvertHexToRgb(v);
            if (import_Color.Color.isRGB(colRgb) && kTemp in result) {
              result[kTemp] = colRgb;
            }
          } else {
            this.log.debug(`Color property ${k} with value ${v} is not valid and will be ignored.`);
          }
        }
      }
    };
    merge(cfg.colorStates);
    merge(cfg.colorNavigation);
    merge(cfg.colorWeatherIcon);
    merge(cfg.colorDisplay);
    merge(cfg.colorWeatherForecast);
    merge(cfg.colorScreensaver);
    merge(cfg.colorCardMedia);
    return result;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Controller
});
//# sourceMappingURL=controller.js.map
