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
var pageItem_exports = {};
__export(pageItem_exports, {
  PageItem: () => PageItem
});
module.exports = __toCommonJS(pageItem_exports);
var import_Color = require("../const/Color");
var typePageItem = __toESM(require("../types/type-pageItem"));
var tools = __toESM(require("../const/tools"));
var import_states_controller = require("../controller/states-controller");
var import_icon_mapping = require("../const/icon_mapping");
var import_screensaver = require("./screensaver");
class PageItem extends import_states_controller.BaseClassTriggerd {
  defaultOnColor = import_Color.Color.White;
  defaultOffColor = import_Color.Color.Blue;
  config;
  dataItems;
  panel;
  id;
  lastPopupType = void 0;
  parent;
  tempData = void 0;
  // use this to save some data while object is active
  tempInterval;
  confirmClick = "lock";
  timeouts = {};
  constructor(config, options) {
    super({ ...config });
    this.panel = config.panel;
    this.id = config.id;
    this.config = options;
    this.parent = config && config.parent;
    this.name = this.parent ? `${this.parent.name}.${this.id}` : this.id;
    this.sleep = false;
    this.enums = options && "enums" in options && options.enums ? options.enums : "";
  }
  static async getPageItem(config, options) {
    if (options === void 0) {
      return void 0;
    }
    if (config.panel.persistentPageItems[config.id]) {
      return config.panel.persistentPageItems[config.id];
    }
    const p = new PageItem(config, options);
    await p.init();
    return p;
  }
  async init() {
    var _a, _b, _c;
    if (!this.config) {
      return;
    }
    const config = structuredClone(this.config);
    const tempItem = await this.panel.statesControler.createDataItems(
      config.data,
      this
    );
    this.dataItems = { ...config, data: tempItem };
    switch (this.dataItems.type) {
      case "number":
      case "button":
      case "input_sel":
      case "light":
      case "text":
      case "fan": {
        break;
      }
      case "shutter": {
        const data = this.dataItems.data;
        this.tempData = [];
        this.tempData[0] = data.up && data.up.writeable;
        this.tempData[1] = data.stop && data.stop.writeable;
        this.tempData[2] = data.down && data.down.writeable;
        this.tempData[3] = data.up2 && data.up2.writeable;
        this.tempData[4] = data.stop2 && data.stop2.writeable;
        this.tempData[5] = data.down2 && data.down2.writeable;
        const list = await this.getListCommands(data.setList);
        if (list) {
          for (let a = 0; a < 6; a++) {
            const test = list && list[a] && list[a].id && await this.panel.statesControler.getObjectAsync(list[a].id);
            if (test && test.common && test.common.write) {
              this.tempData[a] = true;
            }
          }
        }
        if (data.entity1 && data.entity1.value) {
          if (data.entity1.value.type === "number" && data.entity1.minScale && data.entity1.maxScale && data.entity1.value && data.entity1.value.writeable || data.entity1.value.type === "boolean" && data.entity1.value && data.entity1.value.writeable) {
            this.tempData[1] = true;
            this.tempData[3] = true;
          }
        }
        if (data.entity2 && data.entity2.value) {
          if (data.entity2.value.type === "number" && data.entity2.minScale && data.entity2.maxScale && data.entity2.value && data.entity2.value.writeable) {
            this.tempData[3] = true;
            this.tempData[5] = true;
          }
        }
        break;
      }
      case "timer": {
        if (this.dataItems.role === "timer" && this.tempData === void 0) {
          if ((_c = (_b = (_a = this.dataItems.data.entity1) == null ? void 0 : _a.value) == null ? void 0 : _b.common) == null ? void 0 : _c.role) {
            if (["value.timer", "level.timer"].indexOf(this.dataItems.data.entity1.value.common.role) !== -1) {
              this.tempData = { status: "pause", role: "ex-timer" };
              break;
            }
            this.tempData = { status: "pause", role: "ex-alarm" };
            break;
          }
          this.tempData = { status: "pause", value: 0, role: "timer" };
          if (!this.panel.persistentPageItems[this.id]) {
            this.panel.persistentPageItems[this.id] = this;
          }
        }
        break;
      }
    }
    if (this.parent && ["screensaver", "screensaver2", "screensaver3", "popupNotify", "popupNotify2"].indexOf(this.parent.card) !== -1) {
      if (!this.panel.persistentPageItems[this.id]) {
        if (this.config.modeScr) {
          switch (this.config.modeScr) {
            case "left":
            case "bottom":
            case "indicator":
            case "alternate":
            case "favorit":
              break;
            case "mricon":
              break;
            case "time":
            case "date":
              this.neverDeactivateTrigger = true;
              break;
          }
        }
        this.panel.persistentPageItems[this.id] = this;
        await this.controller.statesControler.activateTrigger(this);
      }
    }
  }
  async getPageItemPayload() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V;
    await this.controller.statesControler.activateTrigger(this);
    this.lastPopupType = void 0;
    if (this.dataItems && this.config) {
      this.visibility = false;
      this.triggerParent = true;
      const entry = this.dataItems;
      const message = {};
      message.intNameEntity = this.id;
      switch (entry.type) {
        case "light": {
          const item = entry.data;
          message.type = this.parent && this.parent.card.startsWith("cardGrid") && (this.config.role === "light" || this.config.role === "socket") ? "switch" : "light";
          const v = await tools.getValueEntryBoolean(item.entity1);
          const dimmer = (_a = item.dimmer && item.dimmer.value && await item.dimmer.value.getNumber()) != null ? _a : null;
          let rgb = (_c = (_b = await tools.getRGBfromRGBThree(item)) != null ? _b : item.color && item.color.true && await item.color.true.getRGBValue()) != null ? _c : null;
          const nhue = (_d = item.hue && await item.hue.getNumber()) != null ? _d : null;
          if (rgb === null && nhue) {
            rgb = (_e = import_Color.Color.hsv2RGB(nhue, 1, 1)) != null ? _e : null;
          }
          message.icon = await tools.getIconEntryValue(item.icon, v, "", "");
          const colorMode = !item.colorMode ? "none" : await item.colorMode.getBoolean() ? "hue" : "ct";
          message.iconColor = (_g = (_f = colorMode === "hue" ? await tools.GetIconColor(
            rgb != null ? rgb : void 0,
            dimmer != null ? dimmer > 30 ? dimmer : 30 : v
          ) : await tools.getTemperaturColorFromValue(item.ct, dimmer != null ? dimmer : 100)) != null ? _f : await tools.getIconEntryColor(item.icon, dimmer != null ? dimmer : v, import_Color.Color.Yellow)) != null ? _g : "";
          if (v) {
            message.optionalValue = "1";
          } else {
            message.optionalValue = "0";
          }
          message.displayName = this.library.getTranslation(
            (_i = (_h = await tools.getEntryTextOnOff(item.headline, v)) != null ? _h : message.displayName) != null ? _i : ""
          );
          return tools.getItemMesssage(message);
          break;
        }
        case "shutter": {
          const item = entry.data;
          message.type = "shutter";
          let value = await tools.getValueEntryNumber(item.entity1);
          if (value === null) {
            value = await tools.getValueEntryBoolean(item.entity1);
          }
          if (value === null) {
            this.log.warn(`Entity ${this.config.role} has no value! No Actual or Set`);
            break;
          }
          message.icon = await tools.getIconEntryValue(item.icon, value, "window-open");
          message.iconColor = await tools.getIconEntryColor(item.icon, value, import_Color.Color.White);
          const optionalValue = item.valueList ? await item.valueList.getObject() : [
            "arrow-up",
            //up
            "stop",
            //stop
            "arrow-down"
            //down
          ];
          let optionalValueC = Array.isArray(optionalValue) && optionalValue.every((a) => typeof a === "string") ? [...optionalValue] : ["", "", ""];
          optionalValueC = optionalValueC.splice(0, 3).map((a) => a ? import_icon_mapping.Icons.GetIcon(a) : a);
          optionalValueC.forEach((a, i) => {
            if (a) {
              optionalValueC[i + 3] = this.tempData[i] ? "enable" : "disable";
            } else {
              optionalValueC[i] = "";
              optionalValueC[i + 3] = "disable";
            }
          });
          optionalValueC[3] = value === 0 ? "disable" : optionalValueC[3];
          optionalValueC[5] = value === 100 ? "disable" : optionalValueC[5];
          message.optionalValue = optionalValueC.join("|");
          message.displayName = this.library.getTranslation(
            (_k = (_j = await tools.getEntryTextOnOff(item.headline, !!value)) != null ? _j : message.displayName) != null ? _k : ""
          );
          return tools.getItemMesssage(message);
        }
        case "number": {
          if (entry.type === "number") {
            const item = entry.data;
            message.type = "number";
            const number = (_l = await tools.getValueEntryNumber(item.entity1, false)) != null ? _l : 0;
            const value = (_m = item.switch1 && await item.switch1.getBoolean()) != null ? _m : null;
            message.displayName = this.library.getTranslation(
              (_n = await tools.getEntryTextOnOff(item.text, true)) != null ? _n : ""
            );
            message.icon = (_o = await tools.getIconEntryValue(item.icon, value !== true, "")) != null ? _o : "";
            message.iconColor = (_p = await tools.getIconEntryColor(item.icon, value !== true, import_Color.Color.HMIOn)) != null ? _p : "";
            let min = item.entity1 && item.entity1.value && item.entity1.value.common.min;
            let max = item.entity1 && item.entity1.value && item.entity1.value.common.max;
            min = (_r = (_q = item.minValue1 && await item.minValue1.getNumber()) != null ? _q : min) != null ? _r : 0;
            max = (_t = (_s = item.maxValue1 && await item.maxValue1.getNumber()) != null ? _s : max) != null ? _t : 100;
            return tools.getPayload(
              message.type,
              message.intNameEntity,
              message.icon,
              message.iconColor,
              message.displayName,
              `${number}|${min}|${max}`
            );
          }
          break;
        }
        /**
         * entity1 is value to calculate color
         * entity2 is display value
         */
        case "text":
        case "button":
        case "switch": {
          if (entry.type === "text" || entry.type === "button" || entry.type === "switch") {
            const item = entry.data;
            let value = await tools.getValueEntryNumber(item.entity1, true);
            if (value === null) {
              value = await tools.getValueEntryBoolean(item.entity1);
            }
            if (value === null) {
              value = true;
            }
            message.displayName = this.library.getTranslation(
              (_u = await tools.getEntryTextOnOff(item.text, !!value)) != null ? _u : ""
            );
            if (entry.type === "switch") {
              message.optionalValue = (value != null ? value : true) ? "1" : "0";
            } else if (entry.type === "button") {
              message.optionalValue = (value != null ? value : true) ? "1" : "0";
              if (this.parent && this.parent.card === "cardEntities") {
                message.optionalValue = (_v = this.library.getTranslation(await tools.getEntryTextOnOff(item.text1, !!value))) != null ? _v : message.optionalValue;
              }
            } else {
              switch (entry.role) {
                case "2values": {
                  message.optionalValue = ``;
                  const val1 = await tools.getValueEntryNumber(item.entity1);
                  const val2 = await tools.getValueEntryNumber(item.entity2);
                  const unit1 = item.entity1 && item.entity1.unit && await item.entity1.unit.getString();
                  const unit2 = item.entity2 && item.entity2.unit && await item.entity2.unit.getString();
                  if (val1 !== null && val2 !== null) {
                    message.optionalValue = String(val1) + (unit1 != null ? unit1 : "") + String(val2) + (unit2 != null ? unit2 : "");
                    if (typeof value === "number") {
                      value = val1 + val2 / 2;
                    }
                  }
                  break;
                }
                case "4values": {
                  let val = await tools.getValueEntryString(item.entity1);
                  value = true;
                  if (val === null) {
                    value = false;
                    val = await tools.getValueEntryString(item.entity2);
                    if (val === null) {
                      value = true;
                      val = await tools.getValueEntryString(item.entity3);
                      if (val === null) {
                        value = false;
                        val = await tools.getValueEntryString(item.entity4);
                      }
                    }
                  }
                  if (val) {
                    message.optionalValue = this.library.getTranslation(val);
                  } else {
                    message.optionalValue = "";
                  }
                  break;
                }
                default: {
                  message.optionalValue = this.library.getTranslation(
                    (_x = (_w = await tools.getValueEntryString(item.entity2)) != null ? _w : await tools.getEntryTextOnOff(item.text1, value)) != null ? _x : ""
                  );
                }
              }
            }
            if (entry.type === "button" && entry.data.confirm) {
              if (this.confirmClick === "unlock") {
                if (this.parent && this.parent.card === "cardEntities") {
                  message.optionalValue = (_y = await entry.data.confirm.getString()) != null ? _y : message.optionalValue;
                }
                this.confirmClick = Date.now();
              } else {
                this.confirmClick = "lock";
              }
            }
            message.icon = await tools.getIconEntryValue(item.icon, value, "home");
            switch (entry.role) {
              case "textNotIcon": {
                message.icon = (_z = await tools.getIconEntryValue(item.icon, value, "", null, true)) != null ? _z : "";
                break;
              }
              case "iconNotText": {
                message.icon = (_A = await tools.getIconEntryValue(item.icon, value, "", null, false)) != null ? _A : "";
                break;
              }
              case "battery": {
                const val = (_B = await tools.getValueEntryBoolean(item.entity3)) != null ? _B : false;
                message.icon = (_C = await tools.getIconEntryValue(item.icon, val, "", "", false)) != null ? _C : "";
                break;
              }
              case "combined": {
                message.icon = (_D = await tools.getIconEntryValue(item.icon, value, "", null, false)) != null ? _D : "";
                message.icon += (_E = await tools.getIconEntryValue(item.icon, value, "", null, true)) != null ? _E : "";
                break;
              }
              default: {
                message.icon = (_G = await tools.getIconEntryValue(
                  item.icon,
                  !!value,
                  "",
                  null,
                  (_F = this.parent && this.parent.card !== "cardEntities" && !this.parent.card.startsWith("screens")) != null ? _F : false
                )) != null ? _G : "";
              }
            }
            message.iconColor = await tools.getIconEntryColor(item.icon, value != null ? value : true, import_Color.Color.HMIOn);
            return tools.getPayload(
              entry.type,
              message.intNameEntity,
              message.icon,
              message.iconColor,
              message.displayName,
              message.optionalValue
            );
          }
          break;
        }
        case "input_sel": {
          const item = entry.data;
          message.type = "input_sel";
          const value = (_H = await tools.getValueEntryNumber(item.entityInSel)) != null ? _H : await tools.getValueEntryBoolean(item.entityInSel);
          message.icon = await tools.getIconEntryValue(item.icon, !!(value != null ? value : true), "gesture-tap-button");
          message.iconColor = (_I = await tools.getIconEntryColor(item.icon, value != null ? value : true, import_Color.Color.HMIOff)) != null ? _I : import_Color.Color.HMIOn;
          message.displayName = this.library.getTranslation(
            (_K = (_J = await tools.getEntryTextOnOff(item.headline, true)) != null ? _J : message.displayName) != null ? _K : ""
          );
          message.optionalValue = this.library.getTranslation(
            (_L = await tools.getEntryTextOnOff(item.text, !!value, true)) != null ? _L : "PRESS"
          );
          this.log.debug(JSON.stringify(message));
          return tools.getItemMesssage(message);
          break;
        }
        case "fan":
          {
            if (entry.type === "fan") {
              const item = entry.data;
              message.type = "fan";
              const value = (_M = await tools.getValueEntryBoolean(item.entity1)) != null ? _M : null;
              message.displayName = this.library.getTranslation(
                (_O = (_N = await tools.getEntryTextOnOff(item.headline, true)) != null ? _N : message.displayName) != null ? _O : ""
              );
              message.icon = (_P = await tools.getIconEntryValue(item.icon, value, "")) != null ? _P : "";
              message.iconColor = (_Q = await tools.getIconEntryColor(item.icon, value, import_Color.Color.HMIOn)) != null ? _Q : "";
              return tools.getPayload(
                message.type,
                message.intNameEntity,
                message.icon,
                message.iconColor,
                message.displayName,
                value ? "1" : "0"
              );
            }
          }
          break;
        /**
         * 3 Funktionen
         * 1. Countdown
         * 2. Wecker stellen
         * 3. Countdown anzeigen
         */
        case "timer": {
          if (entry.type === "timer") {
            const item = entry.data;
            message.type = "timer";
            const value = (_S = (_R = item.entity1 && item.entity1.value && await tools.getValueEntryNumber(item.entity1)) != null ? _R : this.tempData && this.tempData.time) != null ? _S : 0;
            if (value !== null) {
              let opt = "";
              if (this.tempData) {
                switch (this.tempData.role) {
                  case "ex-timer": {
                    opt = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, value)).toLocaleTimeString("de", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit"
                    });
                    break;
                  }
                  case "ex-alarm": {
                    opt = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, value)).toLocaleTimeString("de", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit"
                    });
                    break;
                  }
                  case "timer": {
                    opt = new Date(
                      (/* @__PURE__ */ new Date()).setHours(0, 0, this.tempData.time || 0, 0)
                    ).toLocaleTimeString("de", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit"
                    });
                    break;
                  }
                }
              }
              const s = item.setValue2 && await item.setValue2.getNumber();
              let v = !!value;
              if (s != null) {
                v = s > 1;
              }
              message.iconColor = await tools.getIconEntryColor(item.icon, v, import_Color.Color.White);
              message.icon = await tools.getIconEntryValue(item.icon, v, "gesture-tap-button");
              message.optionalValue = this.library.getTranslation(
                (_T = await tools.getEntryTextOnOff(item.text, value !== 0)) != null ? _T : opt
              );
              message.displayName = this.library.getTranslation(
                (_V = (_U = await tools.getEntryTextOnOff(item.headline, true)) != null ? _U : message.displayName) != null ? _V : ""
              );
              return tools.getPayload(
                message.type,
                message.intNameEntity,
                message.icon,
                message.iconColor,
                message.displayName,
                message.optionalValue
              );
            }
          }
          break;
        }
      }
    }
    this.log.warn(`Something went wrong on ${this.id} type: ${this.config && this.config.type}!`);
    return "~~~~~";
  }
  getDetailPayload(message) {
    var _a;
    this.triggerParent = false;
    if (!message.type) {
      return "";
    }
    switch (message.type) {
      case "2Sliders": {
        let result = {
          type: "2Sliders",
          icon: "",
          entityName: "test",
          slidersColor: "disable",
          buttonState: "disable",
          slider1Pos: "disable",
          slider2Pos: "disable",
          hueMode: false,
          hue_translation: "",
          slider2Translation: "",
          slider1Translation: "",
          popup: false
        };
        result = Object.assign(result, message);
        return tools.getPayload(
          "entityUpdateDetail",
          result.entityName,
          (_a = result.icon) != null ? _a : "",
          result.slidersColor,
          result.buttonState === "disable" ? "disable" : result.buttonState ? "1" : "0",
          String(result.slider1Pos),
          String(result.slider2Pos),
          result.hueMode ? "enable" : "disable",
          result.hue_translation,
          result.slider2Translation,
          result.slider1Translation,
          result.popup ? "enable" : "disable"
        );
        break;
      }
      case "insel": {
        let result = {
          type: "insel",
          entityName: "",
          headline: "",
          textColor: String(import_Color.Color.rgb_dec565(import_Color.Color.White)),
          currentState: "",
          list: ""
        };
        result = Object.assign(result, message);
        return tools.getPayload(
          "entityUpdateDetail2",
          result.entityName,
          "",
          result.textColor,
          result.headline,
          result.currentState,
          result.list
        );
        break;
      }
      case "popupThermo": {
        let result = {
          type: "popupThermo",
          entityName: "",
          headline: "",
          currentState: "",
          list: ""
        };
        result = Object.assign(result, message);
        return tools.getPayload(result.headline, result.entityName, result.currentState, result.list);
        break;
      }
      case "popupFan": {
        let result = {
          type: "popupFan",
          entityName: "",
          icon: "",
          iconColor: "",
          buttonstate: "",
          slider1: "",
          slider1Max: "",
          speedText: "",
          mode: "",
          modeList: ""
        };
        result = Object.assign(result, message);
        return tools.getPayload(
          "entityUpdateDetail",
          result.entityName,
          result.icon,
          result.iconColor,
          result.buttonstate,
          result.slider1,
          result.slider1Max,
          result.speedText,
          result.mode,
          result.modeList
        );
        break;
      }
      case "popupTimer": {
        let result = {
          type: "popupTimer",
          entityName: "",
          iconColor: "",
          minutes: "",
          seconds: "",
          editable: "0",
          action1: "",
          action2: "",
          action3: "",
          text1: "",
          text2: "",
          text3: ""
        };
        result = Object.assign(result, message);
        return tools.getPayload(
          "entityUpdateDetail",
          result.entityName,
          "",
          result.iconColor,
          result.entityName,
          result.minutes,
          result.seconds,
          result.editable,
          result.action1,
          result.action2,
          result.action3,
          result.text1,
          result.text2,
          result.text3
        );
        break;
      }
      case "popupShutter": {
        let result = {
          type: "popupShutter",
          entityName: "",
          pos1: "",
          text2: "",
          pos1text: "",
          icon: "",
          iconL1: "",
          iconM1: "",
          iconR1: "",
          statusL1: "disable",
          statusM1: "disable",
          statusR1: "disable",
          pos2text: "",
          iconL2: "",
          iconM2: "",
          iconR2: "",
          statusL2: "disable",
          statusM2: "disable",
          statusR2: "disable",
          pos2: "disable"
        };
        result = Object.assign(result, message);
        return tools.getPayload(
          "entityUpdateDetail",
          result.entityName,
          result.pos1,
          result.text2,
          result.pos1text,
          result.icon,
          result.iconL1,
          result.iconM1,
          result.iconR1,
          result.statusL1,
          result.statusM1,
          result.statusR1,
          result.pos2text,
          result.iconL2,
          result.iconM2,
          result.iconR2,
          result.statusL2,
          result.statusM2,
          result.statusR2,
          result.pos2
        );
      }
    }
    return "";
  }
  async GeneratePopup(mode) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da;
    if (!this.config || !this.dataItems) {
      return null;
    }
    const entry = this.dataItems;
    let message = {};
    message.entityName = this.id;
    this.visibility = true;
    this.lastPopupType = mode;
    switch (mode) {
      case "popupLightNew":
      case "popupLight": {
        switch (this.config.role) {
          case "light":
          case "socket":
          case "dimmer":
          case "hue":
          case "ct":
          case "rgbThree":
          case "rgbSingle":
          case "rgb.hex":
          default: {
            message.type = "2Sliders";
            if (message.type !== "2Sliders" || entry.type !== "light") {
              return null;
            }
            const item = entry.data;
            message.buttonState = (_a = await tools.getValueEntryBoolean(item.entity1)) != null ? _a : "disable";
            const dimmer = item.dimmer && item.dimmer.value && await item.dimmer.value.getNumber();
            if (dimmer != null && item.dimmer) {
              item.dimmer.minScale;
              if (item.dimmer.minScale != void 0 && item.dimmer.maxScale) {
                message.slider1Pos = Math.trunc(
                  import_Color.Color.scale(
                    dimmer,
                    await item.dimmer.minScale.getNumber(),
                    await item.dimmer.maxScale.getNumber(),
                    100,
                    0
                  )
                );
              } else {
                message.slider1Pos = dimmer;
              }
            }
            if (message.buttonState !== "disable") {
              message.icon = await tools.getIconEntryValue(item.icon, message.buttonState, "", "");
            }
            message.slidersColor = (_c = await tools.getIconEntryColor(
              item.icon,
              message.slider1Pos === void 0 || message.slider1Pos === "disable" ? null : (_b = message.slider1Pos) != null ? _b : message.buttonState === true,
              import_Color.Color.White
            )) != null ? _c : "disable";
            let rgb = null;
            switch (this.config.role) {
              case "socket":
              case "light":
              case "dimmer":
              case "ct":
                break;
              case "hue": {
                const nhue = (_d = item.hue && await item.hue.getNumber()) != null ? _d : null;
                if (nhue != null) {
                  rgb = (_e = import_Color.Color.hsv2RGB(nhue, 1, 1)) != null ? _e : null;
                }
                break;
              }
              case "rgbThree": {
                rgb = (_f = await tools.getRGBfromRGBThree(item)) != null ? _f : null;
                break;
              }
              case "rgbSingle": {
                rgb = (_g = item.color && item.color.true && await item.color.true.getRGBValue()) != null ? _g : null;
                break;
              }
              case "rgb.hex": {
                rgb = (_h = item.color && item.color.true && await item.color.true.getRGBValue()) != null ? _h : null;
                break;
              }
            }
            message.slider2Pos = "disable";
            if (item.White) {
              const val = await tools.getScaledNumber(item.White);
              message.slider2Pos = val != null ? val : "disable";
            } else if (item.ct && item.ct.value) {
              const ct = await tools.getSliderCTFromValue(item.ct);
              if (ct !== null) {
                message.slider2Pos = parseInt(ct);
              }
            }
            const colorMode = !item.colorMode ? "none" : await item.colorMode.getBoolean() ? "hue" : "ct";
            message.hueMode = rgb !== null;
            if (rgb !== null && colorMode === "hue") {
              message.slidersColor = await tools.GetIconColor(
                rgb,
                message.slider1Pos !== "disable" && message.slider1Pos != null ? message.slider1Pos > 30 ? message.slider1Pos : 30 : message.buttonState !== "disable" && message.buttonState !== false
              );
            }
            if (message.slider2Pos !== "disable" && colorMode === "ct") {
              message.slidersColor = (_i = await tools.getTemperaturColorFromValue(item.ct, dimmer != null ? dimmer : 100)) != null ? _i : "";
            }
            message.popup = message.slider2Pos !== "disable" && rgb !== null;
            message.slider1Translation = (_j = item.text1 && item.text1.true && await item.text1.true.getString()) != null ? _j : void 0;
            message.slider2Translation = (_k = item.text2 && item.text2.true && await item.text2.true.getString()) != null ? _k : void 0;
            message.hue_translation = (_l = item.text3 && item.text3.true && await item.text3.true.getString()) != null ? _l : void 0;
            if (message.slider1Translation !== void 0) {
              message.slider1Translation = this.library.getTranslation(message.slider1Translation);
            }
            if (message.slider2Translation !== void 0) {
              message.slider2Translation = this.library.getTranslation(message.slider2Translation);
            }
            if (message.hue_translation !== void 0) {
              message.hue_translation = this.library.getTranslation(message.hue_translation);
            }
            break;
          }
        }
        break;
      }
      case "popupFan": {
        if (entry.type === "fan") {
          const item = entry.data;
          message.type = "popupFan";
          if (message.type !== "popupFan") {
            break;
          }
          const value = (_m = await tools.getValueEntryBoolean(item.entity1)) != null ? _m : null;
          message.icon = (_n = await tools.getIconEntryValue(item.icon, value, "")) != null ? _n : "";
          message.iconColor = (_o = await tools.getIconEntryColor(item.icon, value, import_Color.Color.HMIOn)) != null ? _o : "";
          message.slider1 = String((_p = await tools.getScaledNumber(item.speed)) != null ? _p : "");
          message.slider1Max = String(
            (_q = item.speed && item.speed.maxScale && await item.speed.maxScale.getNumber()) != null ? _q : "100"
          );
          message.buttonstate = value ? "1" : "0";
          message.speedText = this.library.getTranslation(
            (_r = await tools.getEntryTextOnOff(item.text, value)) != null ? _r : ""
          );
          message.mode = this.library.getTranslation(
            (_s = await tools.getValueEntryString(item.entityInSel)) != null ? _s : ""
          );
          let list = (_u = (_t = item.valueList && await item.valueList.getObject()) != null ? _t : item.valueList && await item.valueList.getString()) != null ? _u : "";
          if (list !== null) {
            if (Array.isArray(list)) {
              list = list.join("?");
            }
          }
          message.modeList = typeof list === "string" ? list : "";
        }
        break;
      }
      case "popupThermo":
      case "popupInSel": {
        if (entry.type !== "input_sel" && entry.type !== "light") {
          break;
        }
        const item = entry.data;
        message.type = "insel";
        if (!(message.type === "insel")) {
          return null;
        }
        const value = (_v = await tools.getValueEntryBoolean(item.entityInSel)) != null ? _v : true;
        message.textColor = await tools.getEntryColor(item.color, value, import_Color.Color.White);
        message.currentState = mode === "popupThermo" ? this.library.getTranslation((_w = item.headline && await item.headline.getString()) != null ? _w : "") : "entity2" in item ? (_x = await tools.getValueEntryString(item.entity2)) != null ? _x : "" : "";
        message.headline = this.library.getTranslation(
          (_y = item.headline && await item.headline.getString()) != null ? _y : ""
        );
        const sList = item.entityInSel && await this.getListFromStates(
          item.entityInSel,
          item.valueList,
          entry.role,
          "valueList2" in item ? item.valueList2 : void 0
        );
        if (sList !== void 0 && sList.list !== void 0 && sList.value !== void 0) {
          message.textColor = await tools.getEntryColor(item.color, !!value, import_Color.Color.White);
          if (sList.list.length > 0) {
            sList.list.splice(48);
            message.list = Array.isArray(sList.list) ? sList.list.map((a) => tools.formatInSelText(a)).join("?") : "";
            message.currentState = tools.formatInSelText(this.library.getTranslation(sList.value));
            if (mode !== "popupThermo") {
              break;
            }
            message = { ...message, type: "popupThermo" };
            if (message.type === "popupThermo") {
              message.headline = this.library.getTranslation(
                (_A = (_z = await tools.getEntryTextOnOff(item.headline, true)) != null ? _z : message.headline) != null ? _A : ""
              );
            }
            break;
          }
        }
        let list = (_C = (_B = item.valueList && await item.valueList.getObject()) != null ? _B : item.valueList && await item.valueList.getString()) != null ? _C : [
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
          "13"
        ];
        if (list !== null) {
          if (typeof list === "string") {
            list = list.split("?");
          }
          if (Array.isArray(list)) {
            list.splice(48);
          }
        } else {
          list = [];
        }
        list = list.map((a) => tools.formatInSelText(this.library.getTranslation(a)));
        message.list = list.join("?");
        if (message.list && message.list.length > 940) {
          message.list = message.list.slice(0, 940);
          this.log.warn("Value list has more as 940 chars!");
        }
        const n = (_D = await tools.getValueEntryNumber(item.entityInSel)) != null ? _D : 0;
        if (Array.isArray(list) && n != null && n < list.length) {
          message.currentState = list[n];
        }
        if (mode !== "popupThermo") {
          break;
        }
        message = { ...message, type: "popupThermo" };
        if (message.type === "popupThermo") {
          message.headline = this.library.getTranslation(
            (_F = (_E = await tools.getEntryTextOnOff(item.headline, true)) != null ? _E : message.headline) != null ? _F : ""
          );
        }
        break;
      }
      case "popupNotify":
        break;
      case "popupShutter": {
        if (entry.type !== "shutter") {
          break;
        }
        const item = entry.data;
        message.type = "popupShutter";
        if (!(message.type === "popupShutter")) {
          break;
        }
        let pos1 = (_G = await tools.getValueEntryNumber(item.entity1)) != null ? _G : "disable";
        if (pos1 === "disable") {
          pos1 = (_H = await tools.getValueEntryBoolean(item.entity1)) != null ? _H : "disable";
        }
        message.text2 = (_I = await tools.getEntryTextOnOff(item.text, typeof pos1 === "boolean" ? pos1 : true)) != null ? _I : "";
        message.text2 = this.library.getTranslation(message.text2);
        const pos2 = (_J = await tools.getValueEntryNumber(item.entity2)) != null ? _J : "disable";
        if (pos1 !== "disable") {
          message.icon = (_K = await tools.getIconEntryValue(item.icon, pos1, "")) != null ? _K : "";
        } else if (pos2 !== "disable") {
          message.icon = (_L = await tools.getIconEntryValue(item.icon, pos2, "")) != null ? _L : "";
        }
        const optionalValue = item.valueList ? await item.valueList.getObject() : [
          "arrow-up",
          //up
          "stop",
          //stop
          "arrow-down",
          //down
          "arrow-top-right",
          //t-up
          "stop",
          //t-stop
          "arrow-bottom-left"
          //t-down
        ];
        const arr = [pos1, pos2];
        for (let index = 0; index < arr.length; index++) {
          const pos = arr[index];
          if (pos == "disable") {
            continue;
          }
          const i = index * 3;
          let optionalValueC = Array.isArray(optionalValue) && optionalValue.every((a) => typeof a === "string") ? [...optionalValue] : ["", "", ""];
          optionalValueC = optionalValueC.splice(i, 3).map((a) => a ? import_icon_mapping.Icons.GetIcon(a) : a);
          optionalValueC.forEach((a, i2) => {
            if (a) {
              optionalValueC[i2 + 3] = this.tempData[i2] ? "enable" : "disable";
            } else {
              optionalValueC[i2] = "";
              optionalValueC[i2 + 3] = "disable";
            }
          });
          if (index === 0) {
            message.pos1 = typeof pos === "boolean" ? "disable" : String(pos);
            message.pos1text = (_M = await tools.getEntryTextOnOff(item.text1, true)) != null ? _M : "";
            message.pos1text = this.library.getTranslation(message.pos1text);
            message.iconL1 = optionalValueC[0];
            message.iconM1 = optionalValueC[1];
            message.iconR1 = optionalValueC[2];
            message.statusL1 = (typeof pos === "boolean" ? false : pos === 0) ? "disable" : optionalValueC[3];
            message.statusM1 = (typeof pos === "boolean" ? pos : pos === "disabled") ? "disable" : optionalValueC[4];
            message.statusR1 = (typeof pos === "boolean" ? !pos : pos === 100) ? "disable" : optionalValueC[5];
          } else {
            message.pos2 = typeof pos === "boolean" ? "disable" : String(pos);
            message.pos2text = (_N = await tools.getEntryTextOnOff(item.text2, true)) != null ? _N : "";
            message.pos2text = this.library.getTranslation(message.pos2text);
            message.iconL2 = optionalValueC[0];
            message.iconM2 = optionalValueC[1];
            message.iconR2 = optionalValueC[2];
            message.statusL2 = pos === 0 ? "disable" : optionalValueC[3];
            message.statusM2 = optionalValueC[4];
            message.statusR2 = pos === 100 ? "disable" : optionalValueC[5];
          }
        }
        break;
      }
      case "popupTimer": {
        if (entry.type !== "timer") {
          break;
        }
        const item = entry.data;
        message.type = "popupTimer";
        if (!(message.type === "popupTimer")) {
          break;
        }
        if (this.tempData) {
          let value = !item.setValue1 ? (_O = item.entity1 && await tools.getValueEntryNumber(item.entity1)) != null ? _O : null : (_P = this.tempData && this.tempData.time) != null ? _P : 0;
          if (value == null) {
            value = 0;
          }
          switch (this.tempData.role) {
            case "ex-timer": {
              message.iconColor = await tools.GetIconColor(item.icon, value > 0);
              message.minutes = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, value)).toLocaleTimeString("de", {
                minute: "2-digit"
              });
              message.seconds = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, value)).toLocaleTimeString("de", {
                second: "2-digit"
              });
              break;
            }
            case "ex-alarm": {
              message.iconColor = await tools.GetIconColor(item.icon, value > 0);
              message.minutes = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, value)).toLocaleTimeString("de", {
                hour: "2-digit"
              });
              message.seconds = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, value)).toLocaleTimeString("de", {
                minute: "2-digit"
              });
              break;
            }
            case "timer": {
              message.iconColor = await tools.GetIconColor(item.icon, this.tempData.status === "run");
              message.minutes = Math.floor(this.tempData.value / 60).toFixed(0);
              message.seconds = Math.floor(this.tempData.value % 60).toFixed(0);
              break;
            }
          }
          switch (this.tempData.role) {
            case "ex-alarm": {
              const status = item.setValue2 && await item.setValue2.getNumber();
              if (status == null) {
                break;
              }
              switch (status) {
                case 0:
                case 1: {
                  message.editable = ((_R = (_Q = item.entity1) == null ? void 0 : _Q.set) == null ? void 0 : _R.writeable) ? "1" : "0";
                  message.action1 = ((_S = item.setValue2) == null ? void 0 : _S.writeable) ? "begin" : "disable";
                  message.action3 = ((_U = (_T = item.entity1) == null ? void 0 : _T.set) == null ? void 0 : _U.writeable) ? "clear" : "disable";
                  message.text1 = this.library.getTranslation("continue");
                  message.text3 = this.library.getTranslation("clear");
                  break;
                }
                case 2: {
                  message.editable = "0";
                  message.action2 = ((_V = item.setValue2) == null ? void 0 : _V.writeable) ? "pause" : "disable";
                  message.action3 = ((_X = (_W = item.entity1) == null ? void 0 : _W.set) == null ? void 0 : _X.writeable) ? "clear" : "disable";
                  message.text2 = this.library.getTranslation("stop");
                  message.text3 = this.library.getTranslation("clear");
                  break;
                }
              }
              break;
            }
            case "ex-timer": {
              const status = item.setValue2 && await item.setValue2.getNumber();
              if (status == null) {
                break;
              }
              switch (status) {
                case 0:
                case 1: {
                  message.editable = ((_Z = (_Y = item.entity1) == null ? void 0 : _Y.set) == null ? void 0 : _Z.writeable) ? "1" : "0";
                  message.action1 = ((__ = item.setValue2) == null ? void 0 : __.writeable) ? "begin" : "disable";
                  message.action3 = ((_aa = (_$ = item.entity1) == null ? void 0 : _$.set) == null ? void 0 : _aa.writeable) ? "clear" : "disable";
                  message.text1 = this.library.getTranslation("start");
                  message.text3 = this.library.getTranslation("clear");
                  break;
                }
                case 2: {
                  message.editable = "0";
                  message.action2 = ((_ba = item.setValue2) == null ? void 0 : _ba.writeable) ? "pause" : "disable";
                  message.action3 = ((_da = (_ca = item.entity1) == null ? void 0 : _ca.set) == null ? void 0 : _da.writeable) ? "clear" : "disable";
                  message.text2 = this.library.getTranslation("stop");
                  message.text3 = this.library.getTranslation("clear");
                  break;
                }
              }
              break;
            }
            case "timer": {
              if (this.tempData.status === "run") {
                message.editable = "0";
                message.action2 = "pause";
                message.text2 = this.library.getTranslation("pause");
              } else if (this.tempData.value > 0) {
                message.editable = "0";
                message.action1 = "begin";
                message.action3 = "clear";
                message.text1 = this.library.getTranslation("continue");
                message.text3 = this.library.getTranslation("clear");
              } else {
                message.editable = "1";
                message.action1 = "begin";
                message.action3 = "clear";
                message.text1 = this.library.getTranslation("Start");
                message.text3 = this.library.getTranslation("clear");
              }
              break;
            }
          }
        }
        break;
      }
    }
    return this.getDetailPayload(message);
  }
  getLogname() {
    return this.parent ? `${this.parent.name}.${this.id}` : this.id;
  }
  async delete() {
    this.visibility = false;
    await this.controller.statesControler.deactivateTrigger(this);
    if (this.panel.persistentPageItems[this.id]) {
      if (!this.panel.unload) {
        return;
      }
    }
    await super.delete();
    this.controller.statesControler.deletePageLoop();
    this.parent = void 0;
  }
  async onCommand(action, value) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (value === void 0 || this.dataItems === void 0) {
      return false;
    }
    const entry = this.dataItems;
    if (action.startsWith("mode-")) {
      action = "mode";
    }
    switch (action) {
      case "mode-preset_modes":
      case "mode":
        {
          if (!("entityInSel" in entry.data)) {
            break;
          }
          await this.setListCommand(entry, value);
        }
        break;
      case "button": {
        if (entry.type === "button") {
          if (this.parent && this.parent instanceof import_screensaver.Screensaver) {
            if (!this.parent.screensaverIndicatorButtons) {
              this.panel.navigation.resetPosition();
              await this.panel.navigation.setCurrentPage();
              break;
            }
          }
          if (entry.role === "indicator") {
            if (this.parent && this.parent.card === "cardThermo") {
              this.log.debug(`Button indicator ${this.id} was pressed!`);
              await this.parent.update();
            }
            break;
          }
          this.log.debug(`Button ${this.id} was pressed!`);
          const item = entry.data;
          if (item.confirm) {
            if (this.confirmClick === "lock") {
              this.confirmClick = "unlock";
              this.parent && await this.parent.update();
              return true;
            } else if (this.confirmClick === "unlock" || this.confirmClick - 300 > Date.now()) {
              return true;
            }
            this.confirmClick = "lock";
            this.parent && await this.parent.update();
          }
          if (item.popup) {
            const test = (_a = item.popup.isActive && await item.popup.isActive.getBoolean()) != null ? _a : true;
            if (test && item.popup.getMessage && item.popup.setMessage) {
              const message = await item.popup.getMessage.getString();
              const headline = (_b = item.popup.getHeadline && await item.popup.getHeadline.getString()) != null ? _b : "";
              if (message) {
                await item.popup.setMessage.setStateAsync(
                  JSON.stringify({ headline, message })
                );
              }
            }
            break;
          }
          let value2 = (_c = item.setNavi && await item.setNavi.getString()) != null ? _c : null;
          if (value2 !== null) {
            await this.panel.navigation.setTargetPageByName(value2);
            break;
          }
          value2 = (_d = item.entity1 && item.entity1.set && await item.entity1.set.getBoolean()) != null ? _d : null;
          if (value2 !== null && item.entity1 && item.entity1.set) {
            await item.entity1.set.setStateFlip();
          }
          value2 = (_e = item.setValue1 && await item.setValue1.getBoolean()) != null ? _e : null;
          if (value2 !== null && item.setValue1) {
            await item.setValue1.setStateFlip();
          }
          if (item.setValue2) {
            await item.setValue2.setStateTrue();
          }
        } else if (entry.type === "light") {
          const item = entry.data;
          item.entity1 && item.entity1.set && await item.entity1.set.setStateFlip();
          item.setValue1 && await item.setValue1.setStateFlip();
        } else if (entry.type === "number") {
          const item = entry.data;
          if (item && item.switch1 && item.switch1.writeable) {
            await item.switch1.setStateFlip();
          }
        }
        break;
      }
      case "brightnessSlider": {
        if (entry.type === "light") {
          const item = entry.data;
          if (item && item.dimmer && item.dimmer.value && item.dimmer.value.writeable) {
            const dimmer = await tools.getScaledNumber(item.dimmer);
            if (dimmer !== null && String(dimmer) != value) {
              await tools.setScaledNumber(item.dimmer, parseInt(value));
            }
          } else {
            this.log.warn("Dimmer is not writeable!");
          }
        }
        break;
      }
      case "colorTempSlider": {
        if (entry.type === "light") {
          const item = entry.data;
          if (item && item.White && item.White.value) {
            await tools.setScaledNumber(item.White, parseInt(value));
          }
          if (item && item.ct && item.ct.value && item.ct.value.writeable) {
            const ct = await tools.getSliderCTFromValue(item.ct);
            if (ct !== null && String(ct) != value) {
              await tools.setSliderCTFromValue(item.ct, parseInt(value));
            }
          } else {
            this.log.warn("ct is not writeable!");
          }
        }
        break;
      }
      case "OnOff": {
        if (entry.type === "light" || entry.type === "button" || entry.type === "switch") {
          const item = entry.data;
          if (item && item.entity1) {
            await tools.setValueEntry(item.entity1, value === "1");
          } else {
            this.log.warn("entity1 is not writeable!");
          }
        }
        break;
      }
      case "colorWheel": {
        if (entry.type === "light") {
          const item = entry.data;
          if (item && this.config) {
            switch (this.config.role) {
              case "socket":
              case "light":
              case "dimmer":
              case "ct":
                break;
              case "hue":
                await tools.setHuefromRGB(item, import_Color.Color.resultToRgb(value));
                break;
              case "rgbThree": {
                const rgb = import_Color.Color.resultToRgb(value);
                await tools.setRGBThreefromRGB(item, rgb);
                break;
              }
              case "rgbSingle": {
                const rgb = import_Color.Color.resultToRgb(value);
                if (import_Color.Color.isRGB(rgb)) {
                  item.color && item.color.true && await item.color.true.setStateAsync(JSON.stringify(rgb));
                }
                break;
              }
              case "rgb.hex": {
                const rgb = import_Color.Color.resultToRgb(value);
                if (import_Color.Color.isRGB(rgb)) {
                  item.color && item.color.true && await item.color.true.setStateAsync(
                    import_Color.Color.ConvertRGBtoHex(rgb.r, rgb.g, rgb.b)
                  );
                }
                break;
              }
            }
          } else {
            this.log.warn("color value is not writeable!");
          }
        }
        break;
      }
      case "tiltOpen": {
        if (entry.type !== "shutter") {
          break;
        }
        if (entry.data.up2 && entry.data.up2.writeable) {
          await entry.data.up2.setStateTrue();
          break;
        }
      }
      // eslint-disable-next-line no-fallthrough
      case "tiltClose": {
        if (entry.type !== "shutter") {
          break;
        }
        if (action === "tiltClose" && entry.data.down2 && entry.data.down2.writeable) {
          await entry.data.down2.setStateTrue();
          break;
        }
      }
      // eslint-disable-next-line no-fallthrough
      case "tiltStop": {
        if (entry.type !== "shutter") {
          break;
        }
        if (action === "tiltStop" && entry.data.stop2 && entry.data.stop2.writeable) {
          await entry.data.stop2.setStateTrue();
          break;
        }
        const items = entry.data;
        const list = await this.getListCommands(items.setList);
        if (list !== null && list.length > 2) {
          switch (action) {
            case "tiltOpen": {
              await this.adapter.setForeignStateAsync(list[0].id, list[0].value);
              break;
            }
            case "tiltStop": {
              await this.adapter.setForeignStateAsync(list[1].id, list[1].value);
              break;
            }
            case "tiltClose": {
              await this.adapter.setForeignStateAsync(list[2].id, list[2].value);
              break;
            }
          }
        } else {
          if (items.entity2 && items.entity2.value) {
            if (items.entity2.value.type === "number" && items.entity2.minScale && items.entity2.maxScale) {
              switch (action) {
                case "tiltOpen": {
                  if (tools.ifValueEntryIs(items.entity2, "number")) {
                    const value2 = await items.entity2.maxScale.getNumber();
                    if (value2 !== null) {
                      await tools.setValueEntry(items.entity2, value2);
                    }
                  }
                  break;
                }
                case "tiltStop": {
                  if (tools.ifValueEntryIs(items.entity2, "number")) {
                    const value2 = await tools.getValueEntryNumber(items.entity2);
                    if (value2 !== null) {
                      await tools.setValueEntry(items.entity2, value2);
                    }
                  }
                  break;
                }
                case "tiltClose": {
                  if (tools.ifValueEntryIs(items.entity2, "number")) {
                    const value2 = await items.entity2.minScale.getNumber();
                    if (value2 !== null) {
                      await tools.setValueEntry(items.entity2, value2);
                    }
                  }
                  break;
                }
              }
            } else if (items.entity2.value.type === "boolean") {
              if (action !== "tiltStop") {
                await items.entity2.value.setStateFlip();
              }
            }
          }
        }
        break;
      }
      case "up": {
        if (entry.type !== "shutter") {
          break;
        }
        if (entry.data.up && entry.data.up.writeable) {
          await entry.data.up.setStateTrue();
          break;
        }
      }
      // eslint-disable-next-line no-fallthrough
      case "stop": {
        if (entry.type !== "shutter") {
          break;
        }
        if (action === "stop" && entry.data.stop && entry.data.stop.writeable) {
          await entry.data.stop.setStateTrue();
          break;
        }
      }
      // eslint-disable-next-line no-fallthrough
      case "down": {
        if (entry.type === "shutter") {
          if (action === "down" && entry.data.down && entry.data.down.writeable) {
            await entry.data.down.setStateTrue();
            break;
          }
          const items = entry.data;
          const list = await this.getListCommands(items.setList);
          if (list !== null && list.length > 2) {
            switch (action) {
              case "up": {
                await this.adapter.setForeignStateAsync(list[0].id, list[0].value);
                break;
              }
              case "stop": {
                await this.adapter.setForeignStateAsync(list[1].id, list[1].value);
                break;
              }
              case "down": {
                await this.adapter.setForeignStateAsync(list[2].id, list[2].value);
                break;
              }
            }
          } else {
            if (items.entity1 && items.entity1.value && items.entity1.minScale && items.entity1.maxScale) {
              if (items.entity1.value.type === "number") {
                switch (action) {
                  case "up": {
                    if (tools.ifValueEntryIs(items.entity1, "number")) {
                      const value2 = await items.entity1.maxScale.getNumber();
                      if (value2 !== null) {
                        await tools.setValueEntry(items.entity1, value2);
                      }
                    }
                    break;
                  }
                  case "stop": {
                    if (tools.ifValueEntryIs(items.entity1, "number")) {
                      const value2 = await tools.getValueEntryNumber(items.entity1);
                      if (value2 !== null) {
                        await tools.setValueEntry(items.entity1, value2);
                      }
                    }
                    break;
                  }
                  case "down": {
                    if (tools.ifValueEntryIs(items.entity1, "number")) {
                      const value2 = await items.entity1.minScale.getNumber();
                      if (value2 !== null) {
                        await tools.setValueEntry(items.entity1, value2);
                      }
                    }
                    break;
                  }
                }
              } else if (items.entity1.value.type === "boolean") {
                if (action !== "stop") {
                  await items.entity1.value.setStateFlip();
                }
              }
            }
          }
        }
        break;
      }
      /**
       * 100 is right 0 left
       */
      case "positionSlider": {
        if (entry.type === "shutter") {
          const items = entry.data;
          if (tools.ifValueEntryIs(items.entity1, "number")) {
            await tools.setValueEntry(items.entity1, parseInt(value));
          }
        }
        break;
      }
      /**
       * zu 100% geschlossen zu 0% geschlossen
       */
      case "tiltSlider": {
        if (entry.type === "shutter") {
          const items = entry.data;
          if (tools.ifValueEntryIs(items.entity2, "number")) {
            await tools.setValueEntry(items.entity2, parseInt(value));
          }
        }
        break;
      }
      case "number-set": {
        if (this.timeouts["number-set"]) {
          this.adapter.clearTimeout(this.timeouts["number-set"]);
        }
        if (entry.type === "number") {
          this.timeouts["number-set"] = this.adapter.setTimeout(
            async (value2) => {
              await tools.setValueEntry(entry.data.entity1, parseInt(value2), false);
            },
            500,
            value
          );
        } else if (entry.type === "fan") {
          this.timeouts["number-set"] = this.adapter.setTimeout(
            async (value2) => {
              await tools.setValueEntry(entry.data.speed, parseInt(value2), false);
            },
            500,
            value
          );
        }
        break;
      }
      case "timer-begin": {
        if (this.dataItems && this.dataItems.type == "timer" && this.dataItems.data) {
          this.dataItems.data.setValue2 && await this.dataItems.data.setValue2.setStateAsync(2);
        }
        switch (this.tempData.role) {
          case "ex-alarm":
          case "ex-timer": {
            break;
          }
          case "timer": {
            if (this.tempInterval) {
              this.adapter.clearInterval(this.tempInterval);
            }
            this.tempData.status = "run";
            if (this.visibility) {
              await this.onStateTrigger();
            }
            this.tempInterval = this.adapter.setInterval(async () => {
              if (this.unload && this.tempInterval) {
                this.adapter.clearInterval(this.tempInterval);
              }
              if (--this.tempData.value <= 0) {
                this.tempData.value = 0;
                this.tempData.status = "stop";
                this.dataItems && this.dataItems.type == "timer" && this.dataItems.data && this.dataItems.data.setValue1 && await this.dataItems.data.setValue1.setStateTrue();
                if (this.visibility) {
                  await this.onStateTrigger();
                } else if (this.parent && !this.parent.sleep && this.parent.getVisibility()) {
                  await this.parent.onStateTriggerSuperDoNotOverride("timer", this);
                }
                if (this.tempInterval) {
                  this.adapter.clearInterval(this.tempInterval);
                }
                this.tempInterval = void 0;
              } else if (this.tempData.value > 0) {
                if (this.visibility) {
                  await this.onStateTrigger();
                } else if (this.parent && !this.parent.sleep && this.parent.getVisibility()) {
                  await this.parent.onStateTriggerSuperDoNotOverride("timer", this);
                }
              }
            }, 1e3);
            break;
          }
        }
        break;
      }
      case "timer-start": {
        switch (this.tempData.role) {
          case "ex-alarm": {
            const t = value.split(":").reduce((p, c, i) => {
              return String(parseInt(p) + parseInt(c) * 60 ** (2 - i));
            });
            const r = new Date((/* @__PURE__ */ new Date()).setHours(0, parseInt(t), 0, 0)).getTime();
            if (this.dataItems && this.dataItems.type == "timer" && this.dataItems.data) {
              ((_f = this.dataItems.data.entity1) == null ? void 0 : _f.set) && await this.dataItems.data.entity1.set.setStateAsync(r);
            }
            break;
          }
          case "ex-timer": {
            const t = value.split(":").reduce((p, c, i) => {
              return String(parseInt(p) + parseInt(c) * 60 ** (2 - i));
            });
            const r = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, parseInt(t), 0)).getTime();
            if (this.dataItems && this.dataItems.type == "timer" && this.dataItems.data) {
              ((_g = this.dataItems.data.entity1) == null ? void 0 : _g.set) && await this.dataItems.data.entity1.set.setStateAsync(r);
            }
            break;
          }
          case "timer": {
            if (this.tempInterval) {
              this.adapter.clearInterval(this.tempInterval);
            }
            if (value) {
              this.tempData.value = value.split(":").reduce((p, c, i) => {
                return String(parseInt(p) + parseInt(c) * 60 ** (2 - i));
              });
            }
            break;
          }
        }
        break;
      }
      case "timer-finish": {
        break;
      }
      case "timer-clear": {
        if (this.dataItems && this.dataItems.type == "timer" && this.dataItems.data) {
          this.dataItems.data.setValue2 && await this.dataItems.data.setValue2.setStateAsync(0);
        }
        if (this.tempData) {
          switch (this.tempData.role) {
            case "ex-alarm":
            case "ex-timer": {
              const r = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)).getTime();
              if (this.dataItems && this.dataItems.type == "timer" && this.dataItems.data) {
                ((_h = this.dataItems.data.entity1) == null ? void 0 : _h.set) && await this.dataItems.data.entity1.set.setStateAsync(r);
              }
              break;
            }
            case "timer":
              {
                this.tempData.value = 0;
                this.tempData.status = "stop";
                if (this.visibility) {
                  await this.onStateTrigger();
                }
                if (this.tempInterval) {
                  this.adapter.clearInterval(this.tempInterval);
                }
              }
              break;
          }
        }
        break;
      }
      case "timer-pause": {
        if (this.dataItems && this.dataItems.type == "timer" && this.dataItems.data) {
          this.dataItems.data.setValue2 && await this.dataItems.data.setValue2.setStateAsync(1);
        }
        if (this.tempData) {
          switch (this.tempData.role) {
            case "ex-alarm":
            case "ex-timer": {
              break;
            }
            case "timer":
              {
                this.tempData.status = "pause";
                if (this.visibility) {
                  await this.onStateTrigger();
                }
                if (this.tempInterval) {
                  this.adapter.clearInterval(this.tempInterval);
                }
              }
              break;
          }
        }
        break;
      }
      default: {
        return false;
      }
    }
    return true;
  }
  async onStateTrigger(id = "", from) {
    if (this.lastPopupType) {
      if (this.lastPopupType === "popupThermo") {
        this.parent && await this.parent.onPopupRequest(this.id, "popupThermo", "", "", null);
        return;
      }
      const msg = await this.GeneratePopup(this.lastPopupType);
      if (msg) {
        this.sendToPanel(msg);
      }
    }
    if (from && this.panel.isOnline && this.parent === this.panel.screenSaver && this.panel.screenSaver) {
      await this.panel.screenSaver.onStateTrigger(id, from);
    }
  }
  async getListCommands(setList) {
    if (!setList) {
      return null;
    }
    let list = await setList.getObject();
    if (list === null) {
      const temp = await setList.getString();
      if (temp === null) {
        return null;
      }
      list = temp.split("|").map((a) => {
        const t = a.split("?");
        return typePageItem.islistCommandUnion(t[2]) ? { id: t[0], value: t[1], command: t[2] } : { id: t[0], value: t[1] };
      });
    }
    return list;
  }
  /**
   * Die Setzliste besteht aus 1 Arrays in Stringform mit trenner | und einem json mit trenner ? { id: t[0], value: t[1] }
   * oder { id: t[0], value: t[1], command: t[2]} command bitte in der funktion nachsehen. Hier sind meist nicht alle beschrieben
   *
   * Standardnutzung, NSPanelauswahl von z.B. Eintrag 2 benutzt das Element 2 aus diesem Array und setzt die ID auf den Wert value
   * 'flip': Liest den State mit ID ein, negiert den Wert und schreibt ihn wieder zurück. string, number, boolean möglich.
   */
  async setListCommand(entry, value) {
    var _a, _b;
    const item = entry.data;
    if (!("entityInSel" in item)) {
      return false;
    }
    const sList = item.entityInSel && await this.getListFromStates(
      item.entityInSel,
      item.valueList,
      entry.role,
      "valueList2" in item ? item.valueList2 : void 0
    );
    if (sList) {
      if (entry.role === "spotify-playlist" && sList.list !== void 0 && "setValue1" in item && sList.list[parseInt(value)] !== void 0 && item.setValue1) {
        await item.setValue1.setStateAsync(parseInt(value) + 1);
        return true;
      } else if (sList.states !== void 0 && sList.states[parseInt(value)] !== void 0 && item.entityInSel && item.entityInSel.value) {
        if (((_b = (_a = item.entityInSel.value) == null ? void 0 : _a.common) == null ? void 0 : _b.type) === "number") {
          await item.entityInSel.value.setStateAsync(parseInt(sList.states[parseInt(value)]));
        } else {
          await item.entityInSel.value.setStateAsync(sList.states[parseInt(value)]);
        }
        return true;
      }
    }
    if (!item.setList) {
      if (item.entityInSel && item.entityInSel.value) {
        let list2 = item.valueList && await item.valueList.getObject() || item.valueList && await item.valueList.getString() || [
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
          "13"
        ];
        if (list2 !== null) {
          if (typeof list2 === "string") {
            list2 = list2.split("?");
          }
          if (Array.isArray(list2)) {
            list2.splice(48);
          }
        } else {
          list2 = [];
        }
        if (Array.isArray(list2) && list2.length > parseInt(value)) {
          await item.entityInSel.value.setStateAsync(value);
          return true;
        }
      }
      return false;
    }
    const list = await this.getListCommands(item.setList);
    const v = value;
    if (list && list[v]) {
      try {
        const obj = await this.panel.statesControler.getObjectAsync(list[v].id);
        if (!obj || !obj.common || obj.type !== "state") {
          throw new Error("Dont get obj!");
        }
        const type = obj.common.type;
        let newValue = null;
        switch (list[v].command) {
          case "flip": {
            const state = await this.adapter.getForeignStateAsync(list[v].id);
            if (state) {
              switch (typeof state.val) {
                case "string": {
                  switch (state.val) {
                    case "ON": {
                      newValue = "OFF";
                      break;
                    }
                    case "OFF": {
                      newValue = "ON";
                      break;
                    }
                    case "TRUE": {
                      newValue = "FALSE";
                      break;
                    }
                    case "FALSE": {
                      newValue = "TRUE";
                      break;
                    }
                    case "START": {
                      newValue = "STOP";
                      break;
                    }
                    case "STOP": {
                      newValue = "START";
                      break;
                    }
                    case "0": {
                      newValue = "1";
                      break;
                    }
                    case "1": {
                      newValue = "0";
                      break;
                    }
                  }
                  break;
                }
                case "number":
                case "bigint": {
                  newValue = state.val === 1 ? 0 : 1;
                  break;
                }
                case "boolean": {
                  newValue = !state.val;
                  break;
                }
                case "symbol":
                case "undefined":
                case "object":
                case "function":
                  return false;
              }
            }
            break;
          }
          case void 0: {
            newValue = this.adapter.library.convertToType(list[v].value, type);
          }
        }
        if (newValue !== null) {
          await this.adapter.setForeignStateAsync(
            list[v].id,
            newValue,
            list[v].id.startsWith(this.adapter.namespace)
          );
          return true;
        }
        this.log.error(`Try to set a null value to ${list[v].id}!`);
      } catch {
        this.log.error(`Id ${list[v].id} is not valid!`);
      }
    }
    return false;
  }
  async getListFromStates(entityInSel, valueList, role, valueList2 = void 0) {
    var _a;
    const list = {};
    if (entityInSel && entityInSel.value && ["string", "number"].indexOf((_a = entityInSel.value.type) != null ? _a : "") !== -1 && (role == "spotify-playlist" || await entityInSel.value.getCommonStates())) {
      let states = void 0;
      const value = await tools.getValueEntryString(entityInSel);
      switch (role) {
        case "spotify-playlist": {
          if (valueList) {
            const val = await valueList.getObject();
            if (val) {
              states = {};
              for (let a = 0; a < val.length; a++) {
                states[a + 1] = val[a].title;
              }
              list.value = value != null ? value : void 0;
            }
          }
          break;
        }
        case "2values": {
          if (!valueList || !valueList2) {
            this.log.error("2values without valueList or valueList2!");
            return {};
          }
          const val1 = await valueList.getObject();
          const val2 = await valueList2.getObject();
          if (!Array.isArray(val1) || !Array.isArray(val2)) {
            this.log.error("2values valueList or valueList2 is not a array!");
            return {};
          }
          states = {};
          for (let a = 0; a < val1.length; a++) {
            states[val1[a]] = val2[a];
          }
          break;
        }
        default: {
          states = await entityInSel.value.getCommonStates();
        }
      }
      if (value !== null && states) {
        list.list = [];
        list.states = [];
        for (const a in states) {
          list.list.push(this.library.getTranslation(String(states[a])));
          list.states.push(a);
        }
        if (!list.value) {
          list.value = states[value];
        }
      }
    }
    return list;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageItem
});
//# sourceMappingURL=pageItem.js.map
