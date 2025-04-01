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
var Library = __toESM(require("../classes/library"));
var import_states_controller = require("./states-controller");
var Panel = __toESM(require("./panel"));
var import_definition = require("../const/definition");
var import_system_notifications = require("../classes/system-notifications");
var import_tools = require("../const/tools");
var import_axios = __toESM(require("axios"));
var import_Color = require("../const/Color");
import_axios.default.defaults.timeout = 1e4;
class Controller extends Library.BaseClass {
  mqttClient;
  statesControler;
  panels = [];
  minuteLoopTimeout;
  dateUpdateTimeout;
  dailyIntervalTimeout;
  dataCache = {};
  systemNotification;
  constructor(adapter, options) {
    super(adapter, options.name);
    import_Color.Color.setTheme(import_Color.Color.currentTheme);
    this.adapter.controller = this;
    this.mqttClient = options.mqttClient;
    this.statesControler = new import_states_controller.StatesControler(this.adapter);
    for (const panelConfig of options.panels) {
      if (panelConfig === void 0) {
        continue;
      }
      const index = this.adapter.config.panels.findIndex((panel2) => panel2.topic === panelConfig.topic);
      if (index === -1) {
        this.adapter.testSuccessful = false;
        this.adapter.log.error(`Panel ${panelConfig.name} with topic ${panelConfig.topic} not found in config`);
        continue;
      }
      panelConfig.name = this.adapter.config.panels[index].id;
      panelConfig.friendlyName = this.adapter.config.panels[index].name;
      panelConfig.controller = this;
      this.adapter.log.info(`Create panel ${panelConfig.name} with topic ${panelConfig.topic}`);
      const panel = new Panel.Panel(adapter, panelConfig);
      this.panels.push(panel);
    }
    this.systemNotification = new import_system_notifications.SystemNotifications(this.adapter);
    this.log.debug(`${this.name} created`);
  }
  minuteLoop = async () => {
    const minute = (/* @__PURE__ */ new Date()).getMinutes();
    if (minute === 0) {
      this.panels.forEach((panel) => {
        panel.sendDimmode();
      });
    }
    await this.statesControler.setInternalState("///time", await this.getCurrentTime(), true);
    const diff = 6e4 - Date.now() % 6e4 + 10;
    if (this.unload) {
      return;
    }
    this.minuteLoopTimeout = this.adapter.setTimeout(this.minuteLoop, diff);
  };
  /**
   * Update Date every day at 0:00:01....
   *
   * @returns void
   */
  dateUpdateLoop = async () => {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 1);
    const diff = d.getTime() - Date.now();
    this.log.debug(`Set current Date with time: ${new Date(await this.getCurrentTime()).toString()}`);
    await this.statesControler.setInternalState("///date", this.getCurrentTime(), true);
    if (this.unload) {
      return;
    }
    this.dateUpdateTimeout = this.adapter.setTimeout(this.dateUpdateLoop, diff);
  };
  getCurrentTime = async () => {
    return new Promise((resolve) => resolve(Date.now()));
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
  async init() {
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
    const newPanels = [];
    await this.library.writedp(`panels`, void 0, import_definition.genericStateObjects.panel._channel);
    void this.systemNotification.init();
    this.log.debug(`Create ${this.panels.length} panels`);
    for (const panel of this.panels) {
      await this.adapter.delay(100);
      if (await panel.isValid()) {
        newPanels.push(panel);
        void panel.init();
      } else {
        await panel.delete();
        this.adapter.testSuccessful = false;
        this.log.error(`Panel ${panel.name} has a invalid configuration.`);
      }
    }
    this.panels = newPanels;
    void this.minuteLoop();
    void this.dateUpdateLoop();
    await this.getTasmotaVersion();
    this.dailyIntervalTimeout = this.adapter.setInterval(this.dailyInterval, 24 * 60 * 60 * 1e3);
  }
  async delete() {
    await super.delete();
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
    for (const a of this.panels) {
      if (a) {
        await a.delete();
      }
    }
  }
  async notificationToPanel() {
    if (!this.panels) {
      return;
    }
    await this.statesControler.setInternalState("///Notifications", true, true);
  }
  dailyInterval = async () => {
    await this.getTasmotaVersion();
  };
  async getTasmotaVersion() {
    const urlString = "https://api.github.com/repositories/80286288/releases/latest";
    try {
      const response = await (0, import_axios.default)(urlString, { headers: { "User-Agent": "ioBroker" } });
      if (response && response.status === 200) {
        const data = response.data;
        const TasmotaTagName = data.tag_name;
        const TasmotaVersionOnline = TasmotaTagName.replace(/v/i, "");
        for (const p of this.panels) {
          if (p) {
            p.info.tasmota.onlineVersion = TasmotaVersionOnline;
          }
        }
      }
    } catch {
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Controller
});
//# sourceMappingURL=controller.js.map
