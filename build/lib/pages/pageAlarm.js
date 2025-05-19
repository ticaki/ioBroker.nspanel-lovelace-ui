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
var pages = __toESM(require("../types/pages"));
const PageAlarmMessageDefault = {
  event: "entityUpd",
  headline: "Page Alarm",
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
  step = 1;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  status = "armed";
  alarmType = "alarm";
  items;
  async setMode(m) {
    await this.library.writedp(
      `panels.${this.panel.name}.alarm.${this.name}.mode`,
      m,
      import_definition.genericStateObjects.panel.panels.alarm.cardAlarm.mode
    );
  }
  async getStatus() {
    const state = this.adapter.library.readdb(`panels.${this.panel.name}.alarm.${this.name}.status`);
    if (state) {
      if (typeof state.val === "number") {
        this.status = alarmStates[state.val];
      }
    }
    return this.status;
  }
  async setStatus(value) {
    this.status = value;
    await this.library.writedp(
      `panels.${this.panel.name}.alarm.${this.name}.status`,
      alarmStates.indexOf(this.status),
      import_definition.genericStateObjects.panel.panels.alarm.cardAlarm.status
    );
  }
  pin = "0";
  failCount = 0;
  constructor(config, options) {
    super(config, options);
    if (options.config && options.config.card == "cardAlarm") {
      this.config = options.config;
    }
    this.minUpdateInterval = 500;
    this.neverDeactivateTrigger = true;
  }
  async init() {
    var _a, _b;
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    this.items.card = "cardAlarm";
    await this.library.writedp(
      `panels.${this.panel.name}.alarm.${this.name}`,
      void 0,
      import_definition.genericStateObjects.panel.panels.alarm.cardAlarm._channel
    );
    await super.init();
    this.alarmType = (_a = this.items && this.items.data && this.items.data.alarmType && await this.items.data.alarmType.getString()) != null ? _a : "alarm";
    if (this.alarmType === "alarm") {
      const status = await this.getStatus();
      if (status === "pending") {
        await this.setStatus("armed");
      } else if (status === "arming") {
        await this.setStatus("disarmed");
      } else {
        await this.setStatus(this.status);
      }
    } else {
      await this.setStatus("armed");
    }
    this.pin = (_b = this.items && this.items.data && this.items.data.pin && await this.items.data.pin.getString()) != null ? _b : "";
    if (this.pin == "-1") {
      this.pin = this.adapter.config.pw1 ? this.adapter.config.pw1 : "";
    }
  }
  /**
   *
   * @returns // Failback
   */
  async update() {
    var _a, _b, _c, _d, _e;
    if (!this.visibility) {
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
      if (this.status === "armed" || this.status === "triggered") {
        message.button1 = "disarm";
        message.status1 = "D1";
        message.button2 = "";
        message.status2 = "";
        message.button3 = "";
        message.status3 = "";
        message.button4 = "";
        message.status4 = "";
      } else {
        message.button1 = (_b = data.button1 && await data.button1.getTranslatedString()) != null ? _b : this.library.getTranslation("arm_away");
        message.status1 = message.button1 ? "A1" : "";
        message.button2 = (_c = data.button2 && await data.button2.getTranslatedString()) != null ? _c : this.library.getTranslation("arm_home");
        message.status2 = message.button2 ? "A2" : "";
        message.button3 = (_d = data.button3 && await data.button3.getTranslatedString()) != null ? _d : this.library.getTranslation("arm_night");
        message.status3 = message.button3 ? "A3" : "";
        message.button4 = (_e = data.button4 && await data.button4.getTranslatedString()) != null ? _e : this.library.getTranslation("arm_vacation");
        message.status4 = message.button4 ? "A4" : "";
      }
      if (this.status == "armed") {
        message.icon = import_icon_mapping.Icons.GetIcon("shield-home");
        message.iconColor = "63488";
        message.numpad = "enable";
        message.flashing = "disable";
      } else if (this.status == "disarmed") {
        message.icon = import_icon_mapping.Icons.GetIcon("shield-off");
        message.iconColor = String(import_Color.Color.rgb_dec565(import_Color.Color.Green));
        message.numpad = "enable";
        message.flashing = "disable";
      } else if (this.status == "arming" || this.status == "pending") {
        message.icon = import_icon_mapping.Icons.GetIcon("shield");
        message.iconColor = String(import_Color.Color.rgb_dec565({ r: 243, g: 179, b: 0 }));
        message.numpad = "disable";
        message.flashing = "enable";
      } else if (this.status == "triggered") {
        message.icon = import_icon_mapping.Icons.GetIcon("bell-ring");
        message.iconColor = String(import_Color.Color.rgb_dec565({ r: 223, g: 76, b: 30 }));
        message.numpad = "enable";
        message.flashing = "enable";
      }
    } else if (this.alarmType === "unlock") {
      message.button1 = "unlock";
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
    this.sendToPanel(this.getMessage(message), false);
  }
  static async getAlarmPageConfig(adapter, index) {
    const config = adapter.config.pageAlarmdata[index];
    const button1Name = "arm_away";
    let button2Name = "";
    let button3Name = "";
    let button4Name = "";
    if (config.check_A2 && config.state_A2 !== "") {
      button2Name = config.state_A2;
    }
    if (config.check_A3 && config.state_A3 !== "") {
      button3Name = config.state_A3;
    }
    if (config.check_A4 && config.state_A4 !== "") {
      button4Name = config.state_A4;
    }
    const result = {
      uniqueID: config.pageName,
      alwaysOn: "always",
      pageItems: [],
      config: {
        card: "cardAlarm",
        //index: index,
        data: {
          alarmType: { type: "const", constVal: config.pageType },
          headline: { type: "const", constVal: config.headline },
          entity1: void 0,
          button1: { type: "const", constVal: button1Name },
          button2: { type: "const", constVal: button2Name },
          button3: { type: "const", constVal: button3Name },
          button4: { type: "const", constVal: button4Name },
          icon: void 0,
          pin: { type: "const", constVal: config.pageAlarmPincode },
          approved: { type: "const", constVal: config.check_approved }
          //setNavi: { type: 'const', constVal: 'pageAlarm' },
        }
      }
    };
    return result;
  }
  getMessage(message) {
    let result = PageAlarmMessageDefault;
    result = Object.assign(result, message);
    return (0, import_tools.getPayload)(
      "entityUpd",
      result.headline,
      result.navigation,
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
    );
  }
  async onVisibilityChange(val) {
    if (val) {
      this.log.debug(`Alarm page ${this.name} is visible`);
    }
    await super.onVisibilityChange(val);
  }
  async onStateTrigger(id) {
    if (this.items && this.items.card === "cardAlarm") {
      const approved = this.items.data && this.items.data.approved;
      if (approved && approved.options.type === "triggered" && approved.options.dp === id) {
        await this.getStatus();
        const val = await approved.getBoolean();
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
        if (this.unload) {
          return;
        }
        this.adapter.setTimeout(() => this.update(), 50);
      }
    }
  }
  /**
   *
   *
   * @param _event // ButtonEvent form Tasmota
   * @returns // Failback
   */
  async onButtonEvent(_event) {
    var _a;
    const button = _event.action;
    const value = _event.opt;
    if (!this.items || this.items.card !== "cardAlarm") {
      return;
    }
    const approved = this.items.data && this.items.data.approved;
    if (pages.isAlarmButtonEvent(button)) {
      await this.getStatus();
      if (this.status === "triggered") {
        return;
      }
      if (this.pin && this.pin != value) {
        if (++this.failCount < 3) {
          this.log.warn(`Wrong pin entered. try ${this.failCount} of 3`);
        } else {
          this.log.error("Wrong pin entered. locked!");
          await this.setStatus("triggered");
        }
        this.update;
        return;
      }
      this.log.debug(`Alarm event ${button} value: ${value}`);
      switch (button) {
        case "A1":
        case "A2":
        case "A3":
        case "A4": {
          if (this.status === "disarmed" && approved) {
            await this.setStatus("arming");
            await this.setMode(button);
            if (this.unload) {
              return;
            }
            this.adapter.setTimeout(() => this.update(), 50);
          } else if (this.status === "arming") {
          } else if (!approved) {
            await this.setStatus("armed");
            await this.setMode(button);
            if (this.unload) {
              return;
            }
            this.adapter.setTimeout(() => this.update(), 50);
          }
          break;
        }
        case "D1": {
          if (this.status === "armed" && approved) {
            await this.setStatus("pending");
            await this.setMode(button);
            if (this.unload) {
              return;
            }
            this.adapter.setTimeout(() => this.update(), 50);
          } else if (this.status === "pending") {
          } else if (!approved) {
            await this.setStatus("disarmed");
            await this.setMode(button);
            if (this.unload) {
              return;
            }
            this.adapter.setTimeout(() => this.update(), 50);
          }
          break;
        }
        case "U1": {
          const entry = this.items;
          const item = entry.data;
          const value2 = (_a = item.setNavi && await item.setNavi.getString()) != null ? _a : null;
          if (value2 !== null) {
            await this.panel.navigation.setTargetPageByName(value2);
            break;
          }
          await this.setStatus("armed");
          break;
        }
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageAlarm
});
//# sourceMappingURL=pageAlarm.js.map
