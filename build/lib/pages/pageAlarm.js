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
var pageAlarm_exports = {};
__export(pageAlarm_exports, {
  PageAlarm: () => PageAlarm
});
module.exports = __toCommonJS(pageAlarm_exports);
var import_Page = require("../classes/Page");
var import_Color = require("../const/Color");
var import_definition = require("../const/definition");
var import_icon_mapping = require("../const/icon_mapping");
var import_tools = require("../const/tools");
var globals = __toESM(require("../types/function-and-const"));
const PageAlarmMessageDefault = {
  event: "entityUpd",
  headline: "Page Grid",
  intNameEntity: "",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  button1: "",
  status1: "",
  button2: "",
  status2: "",
  button3: "",
  status3: "",
  button4: "",
  status4: "",
  icon: "",
  iconColor: "",
  numpad: "disable",
  flashing: "disable"
};
const alarmStates = ["disarmed", "armed", "arming", "pending", "triggered"];
class PageAlarm extends import_Page.Page {
  status = "armed";
  useStates = true;
  alarmType = "alarm";
  pathToStates = "";
  items;
  approveId = "";
  statusState = "";
  isGlobal = false;
  updatePanelTimeout = null;
  async setMode(m) {
    if (this.useStates) {
      await this.library.writedp(
        `${this.pathToStates}.mode`,
        m,
        import_definition.genericStateObjects.panel.panels.alarm.cardAlarm.mode
      );
    }
  }
  /**
   * Get the current alarm status.
   *
   * Reads the persisted status from the configured states (if state
   * management is enabled) and maps numeric indices to the corresponding
   * AlarmStates value.
   *
   * @returns Promise resolving to the current alarm status
   */
  async getStatus() {
    if (this.useStates) {
      const state = this.library.readdb(`${this.pathToStates}.status`);
      if (state) {
        if (typeof state.val === "number") {
          this.status = alarmStates[state.val];
        }
      }
    }
    return this.status;
  }
  /**
   * Set the current alarm status and persist it when using states.
   *
   * @param value - new alarm status to set
   * @returns Promise that resolves when the status has been persisted
   */
  async setStatus(value) {
    this.status = value;
    if (this.useStates) {
      await this.library.writedp(
        `${this.pathToStates}.status`,
        alarmStates.indexOf(this.status),
        import_definition.genericStateObjects.panel.panels.alarm.cardAlarm.status
      );
    }
    if (this.isGlobal) {
      await this.basePanel.controller.setGlobalAlarmStatus(this.name, this.status);
    }
  }
  async setStatusGlobal(value) {
    this.status = value;
    this.delayUpdate();
  }
  pin = "0";
  failCount = 0;
  pinFailTimeout = null;
  constructor(config, options) {
    var _a, _b;
    super(config, options);
    if (options.config && options.config.card == "cardAlarm") {
      this.config = options.config;
    }
    const data = (_a = this.config) == null ? void 0 : _a.data;
    this.pathToStates = this.library.cleandp(`panels.${this.basePanel.name}.alarm.${this.name}`, false, false);
    if (((_b = data == null ? void 0 : data.global) == null ? void 0 : _b.type) === "const" && !!data.global.constVal) {
      this.isGlobal = true;
      this.pathToStates = this.library.cleandp(`alarm.${this.name}`, false, false);
    }
    this.minUpdateInterval = 500;
    this.neverDeactivateTrigger = true;
    this.approveId = this.library.cleandp(`${this.pathToStates}.approve`, false, false);
    this.statusState = this.library.cleandp(`${this.pathToStates}.status`, false, false);
  }
  /**
   * Initialize the alarm page.
   *
   * This method prepares dataitems, default channels and initial runtime
   * values (pin, alarmType, status). It is called during the Page
   * initialization sequence and may perform asynchronous calls to the
   * StatesController and adapter library.
   *
   * @returns Promise that resolves when initialization is complete
   */
  async init() {
    var _a, _b, _c, _d;
    const config = structuredClone(this.config);
    if (!((config == null ? void 0 : config.card) === "cardAlarm" && config.data)) {
      throw new Error("PageAlarm: invalid configuration");
    }
    await this.library.writedp(this.approveId, false, import_definition.genericStateObjects.panel.panels.alarm.cardAlarm.approve);
    config.data.approveState = {
      type: "triggered",
      dp: `${this.adapter.namespace}.${this.approveId}`
    };
    config.data.statusState = {
      type: "triggered",
      dp: `${this.adapter.namespace}.${this.statusState}`
    };
    const tempConfig = this.enums || this.dpInit ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.basePanel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    this.items.card = "cardAlarm";
    await super.init();
    this.useStates = true;
    this.alarmType = (_c = ((_b = (_a = this.items) == null ? void 0 : _a.data) == null ? void 0 : _b.alarmType) && await this.items.data.alarmType.getString()) != null ? _c : "alarm";
    {
      await this.library.writedp(
        `panels.${this.basePanel.name}.alarm`,
        void 0,
        import_definition.genericStateObjects.panel.panels.alarm._channel
      );
      await this.library.writedp(`alarm`, void 0, import_definition.genericStateObjects.panel.panels.alarm._channel);
      await this.library.writedp(
        `${this.pathToStates}`,
        void 0,
        import_definition.genericStateObjects.panel.panels.alarm.cardAlarm._channel
      );
    }
    if (this.alarmType === "alarm") {
      const status = await this.getStatus();
      if (status === "pending") {
        await this.setStatus("armed");
      } else if (status === "arming") {
        await this.setStatus("disarmed");
      } else {
        await this.setStatus(this.status);
      }
      await this.library.writedp(
        `${this.pathToStates}.mode`,
        "",
        import_definition.genericStateObjects.panel.panels.alarm.cardAlarm.mode
      );
    } else {
      await this.setStatus("armed");
    }
    this.pin = (_d = this.items && this.items.data && this.items.data.pin && await this.items.data.pin.getString()) != null ? _d : "";
    if (this.pin == "-1") {
      this.pin = this.adapter.config.pw1 ? this.adapter.config.pw1 : "";
    }
  }
  /**
   * Build the current message payload and send it to the panel.
   *
   * The message is assembled from the configured dataitems and the
   * internal alarm status. If the page is not visible or incorrectly
   * configured the update is skipped.
   *
   * @returns Promise that resolves after the message was sent (or skipped)
   */
  async update() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    if (!this.visibility || this.unload || this.adapter.unload) {
      return;
    }
    const message = {};
    const items = this.items;
    if (!items || items.card !== "cardAlarm") {
      return;
    }
    const data = items.data;
    await this.getStatus();
    message.intNameEntity = this.id;
    message.headline = (_a = data.headline && await data.headline.getTranslatedString()) != null ? _a : this.name;
    message.navigation = this.getNavigation();
    if (this.alarmType === "alarm") {
      if (this.pinFailTimeout) {
        message.button1 = `${this.library.getTranslation("locked_for")}`;
        message.status1 = "";
        message.button2 = ` ${2 ** this.failCount} s`;
        message.status2 = "";
        message.button3 = "";
        message.status3 = "";
        message.button4 = "";
        message.status4 = "";
        message.icon = import_icon_mapping.Icons.GetIcon("key-alert-outline");
        message.iconColor = String(import_Color.Color.rgb_dec565({ r: 255, g: 0, b: 0 }));
        message.numpad = "disable";
        message.flashing = "enable";
      } else if (this.status === "armed") {
        message.button1 = (_b = data.button5 && await data.button5.getTranslatedString()) != null ? _b : "";
        message.status1 = message.button1 ? "D1" : "";
        message.button2 = (_c = data.button6 && await data.button6.getTranslatedString()) != null ? _c : "";
        message.status2 = message.button2 ? "D2" : "";
        message.button3 = (_d = data.button7 && await data.button7.getTranslatedString()) != null ? _d : "";
        message.status3 = message.button3 ? "D3" : "";
        message.button4 = (_e = data.button8 && await data.button8.getTranslatedString()) != null ? _e : "";
        message.status4 = message.button4 ? "D4" : "";
        message.icon = import_icon_mapping.Icons.GetIcon("shield-home");
        message.iconColor = "63488";
        message.numpad = "enable";
        message.flashing = "disable";
      } else if (this.status === "disarmed") {
        message.button1 = (_f = data.button1 && await data.button1.getTranslatedString()) != null ? _f : "";
        message.status1 = message.button1 ? "A1" : "";
        message.button2 = (_g = data.button2 && await data.button2.getTranslatedString()) != null ? _g : "";
        message.status2 = message.button2 ? "A2" : "";
        message.button3 = (_h = data.button3 && await data.button3.getTranslatedString()) != null ? _h : "";
        message.status3 = message.button3 ? "A3" : "";
        message.button4 = (_i = data.button4 && await data.button4.getTranslatedString()) != null ? _i : "";
        message.status4 = message.button4 ? "A4" : "";
        message.icon = import_icon_mapping.Icons.GetIcon("shield-off");
        message.iconColor = String(import_Color.Color.rgb_dec565(import_Color.Color.Green));
        message.numpad = "enable";
        message.flashing = "disable";
      } else if (this.status == "arming" || this.status == "pending") {
        message.button1 = this.library.getTranslation(this.status);
        message.status1 = "";
        message.button2 = "";
        message.status2 = "";
        message.button3 = "";
        message.status3 = "";
        message.button4 = "";
        message.status4 = "";
        message.icon = import_icon_mapping.Icons.GetIcon(this.status == "arming" ? "shield" : "shield-off");
        message.iconColor = String(import_Color.Color.rgb_dec565({ r: 243, g: 179, b: 0 }));
        message.numpad = "disable";
        message.flashing = "enable";
      } else {
        message.button1 = this.library.getTranslation(this.status);
        message.status1 = "";
        message.button2 = "";
        message.status2 = "";
        message.button3 = "";
        message.status3 = "";
        message.button4 = "";
        message.status4 = "";
        message.icon = import_icon_mapping.Icons.GetIcon("bell-ring");
        message.iconColor = String(import_Color.Color.rgb_dec565({ r: 223, g: 76, b: 30 }));
        message.numpad = "enable";
        message.flashing = "enable";
      }
    } else if (this.alarmType === "unlock") {
      if (this.pinFailTimeout) {
        message.button1 = `${this.library.getTranslation("locked_for")}`;
        message.status1 = "";
        message.button2 = ` ${2 ** this.failCount} s`;
        message.status2 = "";
        message.button3 = "";
        message.status3 = "";
        message.button4 = "";
        message.status4 = "";
        message.icon = import_icon_mapping.Icons.GetIcon("key-alert-outline");
        message.iconColor = String(import_Color.Color.rgb_dec565({ r: 255, g: 0, b: 0 }));
        message.numpad = "disable";
        message.flashing = "enable";
      } else if (this.status == "triggered") {
        message.button1 = this.library.getTranslation("locked");
        message.status1 = "";
        message.button2 = "";
        message.status2 = "";
        message.button3 = "";
        message.status3 = "";
        message.button4 = "";
        message.status4 = "";
        message.icon = import_icon_mapping.Icons.GetIcon("lock-off");
        message.iconColor = String(import_Color.Color.rgb_dec565({ r: 255, g: 0, b: 0 }));
        message.numpad = "disable";
        message.flashing = "enable";
      } else {
        message.button1 = this.library.getTranslation("unlock");
        message.status1 = "U1";
        message.button2 = "";
        message.status2 = "";
        message.button3 = "";
        message.status3 = "";
        message.button4 = "";
        message.status4 = "";
        message.icon = import_icon_mapping.Icons.GetIcon("lock-remove");
        message.iconColor = String(import_Color.Color.rgb_dec565({ r: 223, g: 76, b: 30 }));
        message.numpad = "enable";
        message.flashing = "enable";
      }
    }
    this.sendToPanel(this.getMessage(message), false);
  }
  getMessage(message) {
    let result = PageAlarmMessageDefault;
    result = { ...result, ...message };
    return (0, import_tools.getPayload)(
      (0, import_tools.getPayloadRemoveTilde)("entityUpd", result.headline),
      result.navigation,
      (0, import_tools.getPayloadRemoveTilde)(
        result.intNameEntity,
        result.button1,
        result.status1,
        result.button2,
        result.status2,
        result.button3,
        result.status3,
        result.button4,
        result.status4,
        result.icon,
        result.iconColor,
        result.numpad,
        result.flashing
      )
    );
  }
  async onStateChange(id, _state) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    if (this.unload || this.adapter.unload) {
      return;
    }
    if (id && !_state.new.ack && ((_a = this.items) == null ? void 0 : _a.card) === "cardAlarm") {
      if (id === ((_e = (_d = (_c = (_b = this.items) == null ? void 0 : _b.data) == null ? void 0 : _c.approveState) == null ? void 0 : _d.options) == null ? void 0 : _e.dp)) {
        const approved = this.items.data && await ((_f = this.items.data.approved) == null ? void 0 : _f.getBoolean());
        if (approved) {
          if (this.updatePanelTimeout) {
            this.adapter.clearTimeout(this.updatePanelTimeout);
            this.updatePanelTimeout = null;
          }
          await this.getStatus();
          const val = _state.new.val;
          if (val) {
            if (this.status === "pending") {
              await this.setStatus("disarmed");
            } else if (this.status === "arming") {
              await this.setStatus("armed");
            }
          } else {
            if (this.status === "pending") {
              await this.setStatus("armed");
            } else if (this.status === "arming") {
              await this.setStatus("disarmed");
            }
          }
          await this.adapter.setForeignStateAsync(id, !!val, true);
          if (this.unload || this.adapter.unload) {
            return;
          }
          this.delayUpdate();
        }
      }
      if (id === ((_j = (_i = (_h = (_g = this.items) == null ? void 0 : _g.data) == null ? void 0 : _h.statusState) == null ? void 0 : _i.options) == null ? void 0 : _j.dp) && typeof _state.new.val === "number") {
        if (this.updatePanelTimeout) {
          this.adapter.clearTimeout(this.updatePanelTimeout);
          this.updatePanelTimeout = null;
        }
        await this.setStatus(_state.new.val in alarmStates ? alarmStates[_state.new.val] : "disarmed");
        if (this.unload || this.adapter.unload) {
          return;
        }
        this.delayUpdate();
      }
    }
  }
  async onStateTrigger(_dp, _from) {
  }
  /**
   * Handle a button event coming from the panel.
   *
   * The incoming event contains the action code (A1/A2/A3/A4/D1/U1/...) and
   * an optional value (for example a numeric PIN). This method validates
   * the PIN (when configured), updates the internal status machine and
   * triggers the configured mode/state writes.
   *
   * @param _event - event payload from the touch panel
   * @returns Promise that resolves after the event has been handled
   */
  async onButtonEvent(_event) {
    var _a, _b;
    if (this.unload || this.adapter.unload) {
      return;
    }
    const button = _event.action;
    const value = _event.opt;
    if (!this.items || this.items.card !== "cardAlarm") {
      return;
    }
    const approved = this.items.data && await ((_a = this.items.data.approved) == null ? void 0 : _a.getBoolean());
    if (globals.isAlarmButtonEvent(button)) {
      await this.getStatus();
      if (this.status === "triggered") {
        return;
      }
      if (this.pin && this.pin != value) {
        this.log.warn(
          `Wrong pin entered. try ${++this.failCount}! Delay next attempt by ${2 ** this.failCount} seconds`
        );
        this.pinFailTimeout = this.adapter.setTimeout(
          async () => {
            this.pinFailTimeout = null;
            void this.update();
          },
          2 ** this.failCount * 1e3
        );
        await this.update();
        return;
      }
      this.failCount = 0;
      this.log.debug(`Alarm event ${button} value: ${value}`);
      switch (button) {
        case "A1":
        case "A2":
        case "A3":
        case "A4": {
          if (this.status === "disarmed" && approved) {
            await this.setStatus("arming");
            await this.setMode(button);
            if (this.unload || this.adapter.unload) {
              return;
            }
            this.delayUpdate();
          } else if (this.status === "arming") {
          } else if (!approved) {
            await this.setStatus("armed");
            await this.setMode(button);
            if (this.unload || this.adapter.unload) {
              return;
            }
            this.delayUpdate();
          }
          break;
        }
        case "D1":
        case "D2":
        case "D3":
        case "D4": {
          if (this.status === "armed" && approved) {
            await this.setStatus("pending");
            await this.setMode(button);
            if (this.unload || this.adapter.unload) {
              return;
            }
            this.delayUpdate();
          } else if (this.status === "pending") {
          } else if (!approved) {
            await this.setStatus("disarmed");
            await this.setMode(button);
            if (this.unload || this.adapter.unload) {
              return;
            }
            this.delayUpdate();
          }
          break;
        }
        case "U1": {
          const entry = this.items;
          const item = entry.data;
          const value2 = (_b = item.setNavi && await item.setNavi.getString()) != null ? _b : null;
          if (value2 !== null) {
            await this.basePanel.navigation.setTargetPageByName(value2);
            break;
          }
          await this.setStatus("disarmed");
          await this.setStatus("armed");
          break;
        }
      }
    }
  }
  delayUpdate() {
    if (this.updatePanelTimeout) {
      this.adapter.clearTimeout(this.updatePanelTimeout);
      this.updatePanelTimeout = null;
    }
    if (this.unload || this.adapter.unload) {
      return;
    }
    this.updatePanelTimeout = this.adapter.setTimeout(
      () => {
        this.updatePanelTimeout = null;
        void this.update();
      },
      50 + Math.ceil(Math.random() * 50)
    );
  }
  async delete() {
    if (this.updatePanelTimeout) {
      this.adapter.clearTimeout(this.updatePanelTimeout);
      this.updatePanelTimeout = null;
    }
    if (this.pinFailTimeout) {
      this.adapter.clearTimeout(this.pinFailTimeout);
      this.pinFailTimeout = null;
    }
    await super.delete();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageAlarm
});
//# sourceMappingURL=pageAlarm.js.map
