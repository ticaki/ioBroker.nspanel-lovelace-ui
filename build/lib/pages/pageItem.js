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
var import_icon_mapping = require("../const/icon_mapping");
var import_pages = require("../types/pages");
var import_baseClassPage = require("../classes/baseClassPage");
class PageItem extends import_baseClassPage.BaseClassTriggerd {
  defaultOnColor = import_Color.Color.White;
  defaultOffColor = import_Color.Color.Blue;
  config;
  dataItems;
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
    this.id = config.id;
    this.config = options;
    if (!config || !config.parent) {
      throw new Error(`PageItem ${this.id} has no parent page`);
    }
    this.parent = config && config.parent;
    this.name = `${this.parent.name}.${this.id}`;
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
    var _a, _b, _c, _d, _e, _f;
    if (!this.config) {
      return;
    }
    const config = structuredClone(this.config);
    const tempItem = await this.parent.currentPanel.statesControler.createDataItems(
      config.data,
      this,
      {},
      "data",
      config.readOptions
    );
    this.dataItems = { ...config, data: tempItem };
    this.canBeHidden = !!((_a = this.dataItems.data) == null ? void 0 : _a.enabled);
    if (this.dataItems.data && "enabled" in this.dataItems.data && this.dataItems.data.enabled) {
      this.canBeHidden = true;
    }
    switch (this.dataItems.type) {
      case "number":
      case "button":
      case "switch":
      case "shutter2":
      case "empty":
      case "input_sel":
      case "light":
      case "light2":
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
            const test = list && list[a] && list[a].id && await this.parent.currentPanel.statesControler.getObjectAsync(list[a].id);
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
          if ((_d = (_c = (_b = this.dataItems.data.entity1) == null ? void 0 : _b.value) == null ? void 0 : _c.common) == null ? void 0 : _d.role) {
            if (["value.timer", "level.timer"].indexOf(this.dataItems.data.entity1.value.common.role) !== -1) {
              this.tempData = { status: "pause", role: "ex-timer" };
              break;
            }
            this.tempData = { status: "pause", role: "ex-alarm" };
            break;
          }
          this.tempData = { status: "pause", value: 0, role: "timer" };
          if (!this.parent.currentPanel.persistentPageItems[this.id]) {
            this.parent.currentPanel.persistentPageItems[this.id] = this;
          }
        }
        break;
      }
    }
    if (["screensaver", "screensaver2", "screensaver3", "popupNotify", "popupNotify2"].indexOf(this.parent.card) !== -1) {
      if (!this.parent.currentPanel.persistentPageItems[this.id]) {
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
        this.parent.currentPanel.persistentPageItems[this.id] = this;
        await this.controller.statesControler.activateTrigger(this);
      }
    }
    if (this.config.role === "alexa-speaker") {
      const id = (_e = this.parent.items[0].ident) != null ? _e : "";
      const arr = id.split(".").slice(0, 3);
      const str = arr.join(".");
      const devices = str && arr.length === 3 ? await this.adapter.getObjectViewAsync("system", "device", {
        startkey: `${str}.`,
        endkey: `${str}${String.fromCharCode(65533)}`
      }) : { rows: [] };
      this.tempData = [];
      if (devices && devices.rows && devices.rows.length > 0) {
        if (this.dataItems && this.dataItems.type === "input_sel") {
          const data = this.dataItems.data;
          let filter = await ((_f = data == null ? void 0 : data.valueList) == null ? void 0 : _f.getObject()) || null;
          filter = Array.isArray(filter) && filter.length > 0 ? filter : null;
          for (const instance of devices.rows) {
            if (instance && instance.value && instance.id && instance.id.split(".").length === 4) {
              if (await this.adapter.getForeignObjectAsync(`${instance.id}.Player`)) {
                const name = typeof instance.value.common.name === "object" ? instance.value.common.name.en : instance.value.common.name;
                if (!filter || filter.includes(name)) {
                  this.log.debug(`Alexa device: ${name} deviceId: ${instance.id}`);
                  this.tempData.push({
                    id: instance.id,
                    name
                  });
                }
              }
            }
          }
        }
        this.log.debug(`Alexa devices found: ${this.tempData.length} frosm ${devices.rows.length}`);
      }
    } else if (this.config.role === "alexa-playlist" && this.dataItems && this.dataItems.type === "input_sel" && this.parent.card === "cardMedia") {
      const states = await this.adapter.getForeignStatesAsync(
        `${this.parent.currentItems ? this.parent.currentItems.ident : this.parent.items[0].ident}.Music-Provider.*`
      );
      if (states) {
        this.tempData = Object.keys(states);
      }
    }
  }
  async getPageItemPayload() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea;
    await this.controller.statesControler.activateTrigger(this);
    this.lastPopupType = void 0;
    if (this.dataItems && this.config) {
      this.visibility = false;
      this.triggerParent = true;
      const entry = this.dataItems;
      const message = {};
      message.intNameEntity = this.id;
      if ((_a = entry.data) == null ? void 0 : _a.enabled) {
        const en = await entry.data.enabled.getBoolean();
        if (en === false) {
          return "";
        }
      }
      switch (entry.type) {
        case "light":
        case "light2": {
          const item = entry.data;
          message.type = (0, import_pages.isCardGridType)(this.parent.card) && (this.config.role === "light" || this.config.role === "socket") ? "switch" : this.parent.currentPanel.overrideLightPopup ? this.parent.currentPanel.lightPopupV2 && this.parent.currentPanel.meetsVersion("4.7.5") ? "light2" : "light" : entry.type;
          const v = await tools.getValueEntryBoolean(item.entity1);
          const dimmer = (_b = item.dimmer && item.dimmer.value && await item.dimmer.value.getNumber()) != null ? _b : null;
          let rgb = (_d = (_c = await tools.getRGBfromRGBThree(item)) != null ? _c : item.color && item.color.true && await item.color.true.getRGBValue()) != null ? _d : null;
          const nhue = (_e = item.hue && await item.hue.getNumber()) != null ? _e : null;
          if (rgb === null && nhue) {
            rgb = (_f = import_Color.Color.hsv2RGB(nhue, 1, 1)) != null ? _f : null;
          }
          message.icon = await tools.getIconEntryValue(item.icon, v, "", "");
          let colorMode = !item.colorMode ? "none" : await item.colorMode.getBoolean() ? "hue" : "ct";
          if (colorMode === "none") {
            const ctState = item.ct && item.ct.value && await item.ct.value.getState();
            const colorState = (_k = (_j = (_i = (_h = (_g = item.Red && await item.Red.getState()) != null ? _g : item.Green && await item.Green.getState()) != null ? _h : item.Blue && await item.Blue.getState()) != null ? _i : item.color && item.color.true && await item.color.true.getState()) != null ? _j : item.hue && await item.hue.getState()) != null ? _k : null;
            if (ctState && colorState) {
              if (ctState.ts > colorState.ts) {
                colorMode = "ct";
              } else {
                colorMode = "hue";
              }
            } else if (ctState) {
              colorMode = "ct";
            } else if (colorState) {
              colorMode = "hue";
            }
          }
          const iconColor = dimmer != null ? ((_m = (_l = item.icon) == null ? void 0 : _l.true) == null ? void 0 : _m.color) ? await item.icon.true.color.getRGBValue() : import_Color.Color.Yellow : null;
          message.iconColor = (_o = (_n = colorMode === "hue" ? await tools.GetIconColor(
            rgb != null ? rgb : void 0,
            dimmer != null ? dimmer > 30 ? dimmer : 30 : v
          ) : await tools.getTemperaturColorFromValue(item.ct, dimmer != null ? dimmer : 100)) != null ? _n : iconColor ? await tools.GetIconColor(iconColor, dimmer != null ? dimmer > 30 ? dimmer : 30 : v) : await tools.getIconEntryColor(item.icon, dimmer != null ? dimmer : v, import_Color.Color.Yellow)) != null ? _o : "";
          if (v) {
            message.optionalValue = "1";
          } else {
            message.optionalValue = "0";
          }
          message.displayName = this.library.getTranslation(
            (_q = (_p = await tools.getEntryTextOnOff(item.headline, v)) != null ? _p : message.displayName) != null ? _q : ""
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
          } else {
            value = !this.adapter.config.shutterClosedIsZero ? 100 - value : value;
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
            (_s = (_r = await tools.getEntryTextOnOff(item.headline, !!value)) != null ? _r : message.displayName) != null ? _s : ""
          );
          return tools.getItemMesssage(message);
        }
        case "shutter2": {
          const item = entry.data;
          message.type = "shutter2";
          let value = await tools.getValueEntryNumber(item.entity1);
          if (value === null) {
            value = await tools.getValueEntryBoolean(item.entity1);
          } else {
            value = !this.adapter.config.shutterClosedIsZero ? 100 - value : value;
          }
          if (value === null) {
            this.log.warn(`Entity ${this.config.role} has no value! No Actual or Set`);
            break;
          }
          message.icon = await tools.getIconEntryValue(item.icon, value, "window-open");
          message.iconColor = await tools.getIconEntryColor(item.icon, value, import_Color.Color.White);
          const optionalValue = [
            (item == null ? void 0 : item.up) ? "arrow-up" : "",
            //up
            (item == null ? void 0 : item.stop) ? "stop" : "",
            //stop
            (item == null ? void 0 : item.stop) ? "arrow-down" : ""
            //down
          ];
          let optionalValueC = Array.isArray(optionalValue) && optionalValue.every((a) => typeof a === "string") ? [...optionalValue] : ["", "", ""];
          optionalValueC = optionalValueC.splice(0, 3).map((a) => a ? import_icon_mapping.Icons.GetIcon(a) : a);
          optionalValueC.forEach((a, i) => {
            if (a) {
              optionalValueC[i + 3] = optionalValueC[i] ? "enable" : "disable";
            } else {
              optionalValueC[i] = "";
              optionalValueC[i + 3] = "disable";
            }
          });
          optionalValueC[3] = value === 0 ? "disable" : optionalValueC[3];
          optionalValueC[5] = value === 100 ? "disable" : optionalValueC[5];
          message.optionalValue = optionalValueC.join("|");
          message.displayName = this.library.getTranslation(
            (_u = (_t = await tools.getEntryTextOnOff(item.headline, !!value)) != null ? _t : message.displayName) != null ? _u : ""
          );
          return tools.getItemMesssage(message);
        }
        case "number": {
          if (entry.type === "number") {
            const item = entry.data;
            message.type = "number";
            const number = (_v = await tools.getValueEntryNumber(item.entity1, false)) != null ? _v : 0;
            const value = (_w = item.switch1 && await item.switch1.getBoolean()) != null ? _w : null;
            message.displayName = this.library.getTranslation(
              (_x = await tools.getEntryTextOnOff(item.text, true)) != null ? _x : ""
            );
            message.icon = entry.role === "textNotIcon" ? (_y = await tools.getIconEntryValue(item.icon, value, "", null, true)) != null ? _y : "" : (_z = await tools.getIconEntryValue(item.icon, value !== true, "")) != null ? _z : "";
            message.iconColor = (_A = await tools.getIconEntryColor(item.icon, value !== true, import_Color.Color.HMIOn)) != null ? _A : "";
            let min = item.entity1 && item.entity1.value && item.entity1.value.common.min;
            let max = item.entity1 && item.entity1.value && item.entity1.value.common.max;
            min = (_C = (_B = item.minValue1 && await item.minValue1.getNumber()) != null ? _B : min) != null ? _C : 0;
            max = (_E = (_D = item.maxValue1 && await item.maxValue1.getNumber()) != null ? _D : max) != null ? _E : 100;
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
              (_F = await tools.getEntryTextOnOff(item.text, !!value)) != null ? _F : ""
            );
            if (entry.type === "switch") {
              message.optionalValue = (value != null ? value : true) ? "1" : "0";
            } else if (entry.type === "button") {
              message.optionalValue = (value != null ? value : true) ? "1" : "0";
              if ((0, import_pages.isCardEntitiesType)(this.parent.card)) {
                message.optionalValue = (_G = this.library.getTranslation(await tools.getEntryTextOnOff(item.text1, !!value))) != null ? _G : message.optionalValue;
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
                    (_I = (_H = await tools.getValueEntryString(item.entity2)) != null ? _H : await tools.getEntryTextOnOff(item.text1, value)) != null ? _I : ""
                  );
                }
              }
            }
            if (entry.type === "button" && entry.data.confirm) {
              if (this.confirmClick === "unlock") {
                if ((0, import_pages.isCardEntitiesType)(this.parent.card)) {
                  message.optionalValue = (_J = await entry.data.confirm.getString()) != null ? _J : message.optionalValue;
                }
                this.confirmClick = Date.now();
              } else {
                this.confirmClick = "lock";
              }
            }
            message.icon = await tools.getIconEntryValue(item.icon, value, "home");
            switch (entry.role) {
              case "textNotIcon": {
                message.icon = (_K = await tools.getIconEntryValue(item.icon, value, "", null, true)) != null ? _K : "";
                break;
              }
              case "iconNotText": {
                message.icon = (_L = await tools.getIconEntryValue(item.icon, value, "", null, false)) != null ? _L : "";
                break;
              }
              case "battery": {
                const val = (_M = await tools.getValueEntryBoolean(item.entity3)) != null ? _M : false;
                message.icon = (_N = await tools.getIconEntryValue(item.icon, val, "", "", false)) != null ? _N : "";
                break;
              }
              case "combined": {
                message.icon = (_O = await tools.getIconEntryValue(item.icon, value, "", null, false)) != null ? _O : "";
                message.icon += (_P = await tools.getIconEntryValue(item.icon, value, "", null, true)) != null ? _P : "";
                break;
              }
              default: {
                message.icon = (_R = await tools.getIconEntryValue(
                  item.icon,
                  !!value,
                  "",
                  null,
                  (_Q = !(0, import_pages.isCardEntitiesType)(this.parent.card) && !this.parent.card.startsWith("screens")) != null ? _Q : false
                )) != null ? _R : "";
              }
            }
            const additionalId = entry.data.additionalId ? await entry.data.additionalId.getString() : "";
            message.iconColor = await tools.getIconEntryColor(item.icon, value != null ? value : true, import_Color.Color.HMIOn);
            return tools.getPayload(
              entry.type,
              message.intNameEntity + additionalId,
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
          let value = (_S = await tools.getValueEntryNumber(item.entityInSel)) != null ? _S : await tools.getValueEntryBoolean(item.entityInSel);
          if (entry.role === "alexa-speaker") {
            value = this.parent.currentItems === this.parent.items[0];
          }
          message.icon = await tools.getIconEntryValue(item.icon, !!(value != null ? value : true), "gesture-tap-button");
          message.iconColor = (_T = await tools.getIconEntryColor(item.icon, !!(value != null ? value : true), import_Color.Color.HMIOff)) != null ? _T : import_Color.Color.HMIOn;
          message.displayName = this.library.getTranslation(
            (_V = (_U = await tools.getEntryTextOnOff(item.headline, !!(value != null ? value : true))) != null ? _U : message.displayName) != null ? _V : ""
          );
          message.optionalValue = this.library.getTranslation(
            (_W = await tools.getEntryTextOnOff(item.text, !!(value != null ? value : true), true)) != null ? _W : "PRESS"
          );
          return tools.getItemMesssage(message);
          break;
        }
        case "fan":
          {
            if (entry.type === "fan") {
              const item = entry.data;
              message.type = "fan";
              const value = (_X = await tools.getValueEntryBoolean(item.entity1)) != null ? _X : null;
              message.displayName = this.library.getTranslation(
                (_Z = (_Y = await tools.getEntryTextOnOff(item.headline, true)) != null ? _Y : message.displayName) != null ? _Z : ""
              );
              message.icon = (__ = await tools.getIconEntryValue(item.icon, value, "")) != null ? __ : "";
              message.iconColor = (_$ = await tools.getIconEntryColor(item.icon, value, import_Color.Color.HMIOn)) != null ? _$ : "";
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
            const value = (_ba = (_aa = item.entity1 && item.entity1.value && await tools.getValueEntryNumber(item.entity1)) != null ? _aa : this.tempData && this.tempData.time) != null ? _ba : 0;
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
                (_ca = await tools.getEntryTextOnOff(item.text, value !== 0)) != null ? _ca : opt
              );
              message.displayName = this.library.getTranslation(
                (_ea = (_da = await tools.getEntryTextOnOff(item.headline, true)) != null ? _da : message.displayName) != null ? _ea : ""
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
        case "empty":
          {
            return tools.getPayload("", "delete", "", "", "", "");
          }
          break;
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
      case "popupShutter2": {
        let result = {
          type: "popupShutter2",
          entityName: "",
          pos1: "",
          text2: "",
          pos1text: "",
          icon: "",
          iconT1: "",
          iconM1: "",
          iconB1: "",
          statusT1: "disable",
          statusM1: "disable",
          statusB1: "disable",
          iconT2: "",
          iconT2Color: "",
          iconT2Enable: "disable",
          iconM2: "",
          iconM2Color: "",
          iconM2Enable: "disable",
          iconB2: "",
          iconB2Color: "",
          iconB2Enable: "disable",
          shutterTyp: "shutter",
          shutterClosedIsZero: this.adapter.config.shutterClosedIsZero ? "1" : "0"
        };
        result = Object.assign(result, message);
        return tools.getPayload(
          "entityUpdateDetail",
          result.entityName,
          result.pos1,
          result.text2,
          result.pos1text,
          result.icon,
          result.iconT1,
          result.iconM1,
          result.iconB1,
          result.statusT1,
          result.statusM1,
          result.statusB1,
          result.iconT2,
          result.iconT2Color,
          result.iconT2Enable,
          result.iconM2,
          result.iconM2Color,
          result.iconM2Enable,
          result.iconB2,
          result.iconB2Color,
          result.iconB2Enable,
          result.shutterTyp,
          result.shutterClosedIsZero
        );
      }
      case "popupSlider": {
        let result = {
          type: "popupSlider",
          entityName: "",
          tSlider1: "",
          tIconS1M: "",
          tIconS1P: "",
          hSlider1CurVal: "",
          hSlider1MinVal: "",
          hSlider1MaxVal: "",
          hSlider1ZeroVal: "",
          hSlider1Step: "",
          hSlider1Visibility: "disable",
          tSlider2: "",
          tIconS2M: "",
          tIconS2P: "",
          hSlider2CurVal: "",
          hSlider2MinVal: "",
          hSlider2MaxVal: "",
          hSlider2ZeroVal: "",
          hSlider2Step: "",
          hSlider2Visibility: "disable",
          tSlider3: "",
          tIconS3M: "",
          tIconS3P: "",
          hSlider3CurVal: "",
          hSlider3MinVal: "",
          hSlider3MaxVal: "",
          hSlider3ZeroVal: "",
          hSlider3Step: "",
          hSlider3Visibility: "disable"
        };
        result = Object.assign(result, message);
        return tools.getPayload(
          "entityUpdateDetail",
          result.entityName,
          result.tSlider1,
          result.tIconS1M,
          result.tIconS1P,
          result.hSlider1CurVal,
          result.hSlider1MinVal,
          result.hSlider1MaxVal,
          result.hSlider1ZeroVal,
          result.hSlider1Step,
          result.hSlider1Visibility,
          result.tSlider2,
          result.tIconS2M,
          result.tIconS2P,
          result.hSlider2CurVal,
          result.hSlider2MinVal,
          result.hSlider2MaxVal,
          result.hSlider2ZeroVal,
          result.hSlider2Step,
          result.hSlider2Visibility,
          result.tSlider3,
          result.tIconS3M,
          result.tIconS3P,
          result.hSlider3CurVal,
          result.hSlider3MinVal,
          result.hSlider3MaxVal,
          result.hSlider3ZeroVal,
          result.hSlider3Step,
          result.hSlider3Visibility
        );
      }
    }
    return "";
  }
  async isEnabled() {
    var _a, _b;
    if (this.config && this.dataItems) {
      const entry = this.dataItems;
      if ((_a = entry.data) == null ? void 0 : _a.enabled) {
        return (_b = await entry.data.enabled.getBoolean()) != null ? _b : true;
      }
    }
    return true;
  }
  async GeneratePopup(mode) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha, _ia, _ja, _ka, _la, _ma, _na, _oa, _pa, _qa, _ra, _sa, _ta, _ua, _va, _wa, _xa, _ya, _za, _Aa;
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
              if (item.dimmer.minScale != void 0 && item.dimmer.maxScale) {
                message.slider1Pos = Math.trunc(
                  import_Color.Color.scale(
                    dimmer,
                    await item.dimmer.minScale.getNumber(),
                    await item.dimmer.maxScale.getNumber(),
                    0,
                    100
                  )
                );
              } else if (((_c = (_b = item.dimmer.value) == null ? void 0 : _b.common) == null ? void 0 : _c.min) !== void 0 && ((_e = (_d = item.dimmer.value) == null ? void 0 : _d.common) == null ? void 0 : _e.max)) {
                message.slider1Pos = Math.trunc(
                  import_Color.Color.scale(
                    dimmer,
                    item.dimmer.value.common.min,
                    item.dimmer.value.common.max,
                    0,
                    100
                  )
                );
              } else {
                message.slider1Pos = dimmer;
              }
            }
            if (message.buttonState !== "disable") {
              message.icon = await tools.getIconEntryValue(item.icon, message.buttonState, "", "");
            }
            message.slidersColor = (_g = await tools.getIconEntryColor(
              item.icon,
              message.slider1Pos === void 0 || message.slider1Pos === "disable" ? null : (_f = message.slider1Pos) != null ? _f : message.buttonState === true,
              import_Color.Color.White
            )) != null ? _g : "disable";
            let rgb = null;
            switch (this.config.role) {
              case "socket":
              case "light":
              case "dimmer":
              case "ct":
                break;
              case "hue": {
                const nhue = (_h = item.hue && await item.hue.getNumber()) != null ? _h : null;
                if (nhue != null) {
                  rgb = (_i = import_Color.Color.hsv2RGB(nhue, 1, 1)) != null ? _i : null;
                }
                break;
              }
              case "rgbThree": {
                rgb = (_j = await tools.getRGBfromRGBThree(item)) != null ? _j : null;
                break;
              }
              case "rgbSingle": {
                rgb = (_k = item.color && item.color.true && await item.color.true.getRGBValue()) != null ? _k : null;
                break;
              }
              case "rgb.hex": {
                rgb = (_l = item.color && item.color.true && await item.color.true.getRGBValue()) != null ? _l : null;
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
            let colorMode = !item.colorMode ? "none" : await item.colorMode.getBoolean() ? "hue" : "ct";
            if (colorMode === "none") {
              const ctState = item.ct && item.ct.value && await item.ct.value.getState();
              const colorState = (_q = (_p = (_o = (_n = (_m = item.Red && await item.Red.getState()) != null ? _m : item.Green && await item.Green.getState()) != null ? _n : item.Blue && await item.Blue.getState()) != null ? _o : item.color && item.color.true && await item.color.true.getState()) != null ? _p : item.hue && await item.hue.getState()) != null ? _q : null;
              if (ctState && colorState) {
                if (ctState.ts > colorState.ts) {
                  colorMode = "ct";
                } else {
                  colorMode = "hue";
                }
              } else if (ctState) {
                colorMode = "ct";
              } else if (colorState) {
                colorMode = "hue";
              }
            }
            message.hueMode = rgb !== null;
            if (rgb !== null && colorMode === "hue") {
              message.slidersColor = await tools.GetIconColor(
                rgb,
                message.slider1Pos !== "disable" && message.slider1Pos != null ? message.slider1Pos > 30 ? message.slider1Pos : 30 : message.buttonState !== "disable" && message.buttonState !== false
              );
            }
            if (message.slider2Pos !== "disable" && colorMode === "ct") {
              message.slidersColor = (_r = await tools.getTemperaturColorFromValue(item.ct, dimmer != null ? dimmer : 100)) != null ? _r : "";
            }
            message.popup = !!((_s = item.entityInSel) == null ? void 0 : _s.value);
            message.slider1Translation = (_t = item.text1 && item.text1.true && await item.text1.true.getString()) != null ? _t : void 0;
            message.slider2Translation = (_u = item.text2 && item.text2.true && await item.text2.true.getString()) != null ? _u : void 0;
            message.hue_translation = (_v = item.text3 && item.text3.true && await item.text3.true.getString()) != null ? _v : void 0;
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
          const value = (_w = await tools.getValueEntryBoolean(item.entity1)) != null ? _w : null;
          message.icon = (_x = await tools.getIconEntryValue(item.icon, value, "")) != null ? _x : "";
          message.iconColor = (_y = await tools.getIconEntryColor(item.icon, value, import_Color.Color.HMIOn)) != null ? _y : "";
          message.slider1 = String((_z = await tools.getScaledNumber(item.speed)) != null ? _z : "");
          message.slider1Max = String(
            (_A = item.speed && item.speed.maxScale && await item.speed.maxScale.getNumber()) != null ? _A : "100"
          );
          message.buttonstate = value ? "1" : "0";
          message.speedText = this.library.getTranslation(
            (_B = await tools.getEntryTextOnOff(item.text, value)) != null ? _B : ""
          );
          const sList = item.entityInSel && await this.getListFromStates(
            item.entityInSel,
            item.valueList,
            entry.role,
            "valueList2" in item ? item.valueList2 : void 0
          );
          if (sList !== void 0 && sList.list !== void 0 && sList.value !== void 0 && sList.states !== void 0) {
            if (sList.list.length > 0) {
              sList.list = sList.list.slice(0, 48);
              message.modeList = Array.isArray(sList.list) ? sList.list.map((a) => tools.formatInSelText(a)).join("?") : "";
              message.mode = tools.formatInSelText(this.library.getTranslation(sList.value));
            }
          } else {
            let list = (_D = (_C = item.valueList && await item.valueList.getObject()) != null ? _C : item.valueList && await item.valueList.getString()) != null ? _D : "";
            if (list !== null) {
              if (typeof list === "string") {
                list = list.split("?");
              }
              if (Array.isArray(list)) {
                list = list.slice(0, 48);
              }
            } else {
              list = [];
            }
            list = list.map(
              (a) => tools.formatInSelText(this.library.getTranslation(a))
            );
            message.modeList = list.join("?");
            if (message.modeList && message.modeList.length > 900) {
              message.modeList = message.modeList.slice(0, 900);
              this.log.warn("Value list has more as 900 chars!");
            }
            const n = (_E = await tools.getValueEntryNumber(item.entityInSel)) != null ? _E : 0;
            if (Array.isArray(list) && n != null && n < list.length) {
              message.mode = list[n];
            }
          }
        }
        break;
      }
      case "popupThermo":
      case "popupInSel": {
        if (entry.type !== "input_sel" && entry.type !== "light" && entry.type !== "light2") {
          break;
        }
        const item = entry.data;
        message.type = "insel";
        if (!(message.type === "insel")) {
          return null;
        }
        let value = (_F = await tools.getValueEntryNumber(item.entityInSel)) != null ? _F : await tools.getValueEntryBoolean(item.entityInSel);
        if (entry.role === "alexa-speaker") {
          value = this.parent.currentItems === this.parent.items[0];
        }
        message.textColor = (_G = await tools.getIconEntryColor(item.icon, !!(value != null ? value : true), import_Color.Color.HMIOff)) != null ? _G : import_Color.Color.HMIOn;
        message.currentState = mode === "popupThermo" ? this.library.getTranslation((_H = item.headline && await item.headline.getString()) != null ? _H : "") : "entity2" in item ? (_I = await tools.getValueEntryString(item.entity2)) != null ? _I : "" : "";
        message.headline = this.library.getTranslation(
          (_J = item.headline && await item.headline.getString()) != null ? _J : ""
        );
        const sList = item.entityInSel && await this.getListFromStates(
          item.entityInSel,
          item.valueList,
          entry.role,
          "valueList2" in item ? item.valueList2 : void 0
        );
        if (sList !== void 0 && sList.list !== void 0 && sList.value !== void 0) {
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
                (_L = (_K = await tools.getEntryTextOnOff(item.headline, true)) != null ? _K : message.headline) != null ? _L : ""
              );
            }
            break;
          }
        }
        let list = (_N = (_M = item.valueList && await item.valueList.getObject()) != null ? _M : item.valueList && await item.valueList.getString()) != null ? _N : [
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
        if (message.list && message.list.length > 900) {
          message.list = message.list.slice(0, 900);
          this.log.warn("Value list has more as 900 chars!");
        }
        const n = (_O = await tools.getValueEntryNumber(item.entityInSel)) != null ? _O : 0;
        if (Array.isArray(list) && n != null && n < list.length) {
          message.currentState = list[n];
        }
        if (mode !== "popupThermo") {
          break;
        }
        message = { ...message, type: "popupThermo" };
        if (message.type === "popupThermo") {
          message.headline = this.library.getTranslation(
            (_Q = (_P = await tools.getEntryTextOnOff(item.headline, true)) != null ? _P : message.headline) != null ? _Q : ""
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
        let pos1 = (_R = await tools.getValueEntryNumber(item.entity1)) != null ? _R : "disable";
        if (pos1 === "disable") {
          pos1 = (_S = await tools.getValueEntryBoolean(item.entity1)) != null ? _S : "disable";
        }
        message.text2 = (_T = await tools.getEntryTextOnOff(item.text, typeof pos1 === "boolean" ? pos1 : true)) != null ? _T : "";
        message.text2 = this.library.getTranslation(message.text2);
        let pos2 = (_U = await tools.getValueEntryNumber(item.entity2)) != null ? _U : "disable";
        if (pos1 !== "disable") {
          pos1 = !this.adapter.config.shutterClosedIsZero && typeof pos1 === "number" ? 100 - pos1 : pos1;
          message.icon = (_V = await tools.getIconEntryValue(item.icon, pos1, "")) != null ? _V : "";
        } else if (typeof pos2 !== "string") {
          pos2 = !this.adapter.config.shutterClosedIsZero && typeof pos2 === "number" ? 100 - pos2 : pos2;
          message.icon = (_W = await tools.getIconEntryValue(item.icon, pos2, "")) != null ? _W : "";
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
            message.pos1text = (_X = await tools.getEntryTextOnOff(item.text1, true)) != null ? _X : "";
            message.pos1text = this.library.getTranslation(message.pos1text);
            message.iconL1 = optionalValueC[0];
            message.iconM1 = optionalValueC[1];
            message.iconR1 = optionalValueC[2];
            if (this.config.role == "gate") {
              message.statusL1 = (typeof pos === "boolean" ? false : pos === 100) ? "disable" : optionalValueC[3];
              message.statusM1 = (typeof pos === "boolean" ? pos : pos === "disabled") ? "disable" : optionalValueC[4];
              message.statusR1 = (typeof pos === "boolean" ? !pos : pos === 0) ? "disable" : optionalValueC[5];
            } else {
              message.statusL1 = (typeof pos === "boolean" ? false : pos === 0) ? "disable" : optionalValueC[3];
              message.statusM1 = (typeof pos === "boolean" ? pos : pos === "disabled") ? "disable" : optionalValueC[4];
              message.statusR1 = (typeof pos === "boolean" ? !pos : pos === 100) ? "disable" : optionalValueC[5];
            }
          } else {
            message.pos2 = typeof pos === "boolean" ? "disable" : String(pos);
            message.pos2text = (_Y = await tools.getEntryTextOnOff(item.text2, true)) != null ? _Y : "";
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
      case "popupShutter2": {
        if (entry.type !== "shutter2") {
          break;
        }
        const item = entry.data;
        message.type = "popupShutter2";
        if (!(message.type === "popupShutter2")) {
          break;
        }
        let pos1 = await tools.getValueEntryNumber(item.entity1);
        if (pos1 == null) {
          pos1 = await tools.getValueEntryBoolean(item.entity1);
        }
        message.pos1 = pos1 == null || typeof pos1 === "boolean" ? "disable" : this.adapter.config.shutterClosedIsZero && typeof pos1 === "number" ? (100 - pos1).toFixed() : pos1.toFixed();
        message.text2 = (_Z = await tools.getEntryTextOnOff(item.text, typeof pos1 === "boolean" ? pos1 : true)) != null ? _Z : "";
        message.text2 = this.library.getTranslation(message.text2);
        message.iconT1 = import_icon_mapping.Icons.GetIcon("arrow-up");
        message.iconM1 = import_icon_mapping.Icons.GetIcon("stop");
        message.iconB1 = import_icon_mapping.Icons.GetIcon("arrow-down");
        message.statusT1 = (item == null ? void 0 : item.up) ? "enable" : "disable";
        message.statusM1 = (item == null ? void 0 : item.stop) ? "enable" : "disable";
        message.statusB1 = (item == null ? void 0 : item.down) ? "enable" : "disable";
        message.pos1text = this.library.getTranslation(message.pos1text);
        if (item.entity2) {
          let val = await tools.getValueEntryNumber(item.entity2);
          if (val === null || val === void 0) {
            val = await tools.getValueEntryBoolean(item.entity2);
          }
          message.iconT2 = (__ = await tools.getIconEntryValue(item.icon2, val != null ? val : true, "window-open")) != null ? __ : "";
          message.iconT2Color = (_$ = await tools.getIconEntryColor(item.icon2, pos1, import_Color.Color.White)) != null ? _$ : "";
          message.iconT2Enable = "enable";
        }
        if (item.entity3) {
          let val = await tools.getValueEntryNumber(item.entity3);
          if (val === null || val === void 0) {
            val = await tools.getValueEntryBoolean(item.entity3);
          }
          if (val === null || val === void 0) {
            val = true;
          }
          message.iconM2 = (_aa = await tools.getIconEntryValue(item.icon3, val, "window-open")) != null ? _aa : "";
          message.iconM2Color = (_ba = await tools.getIconEntryColor(item.icon3, val, import_Color.Color.White)) != null ? _ba : "";
          message.iconM2Enable = "enable";
        }
        if (item.entity4) {
          let val = await tools.getValueEntryNumber(item.entity4);
          if (val === null || val === void 0) {
            val = await tools.getValueEntryBoolean(item.entity4);
          }
          message.iconB2 = (_ca = await tools.getIconEntryValue(item.icon4, val, "window-open")) != null ? _ca : "";
          message.iconB2Color = (_da = await tools.getIconEntryColor(item.icon4, val, import_Color.Color.White)) != null ? _da : "";
          message.iconB2Enable = "enable";
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
          let value = !item.setValue1 ? (_ea = item.entity1 && await tools.getValueEntryNumber(item.entity1)) != null ? _ea : null : (_fa = this.tempData && this.tempData.time) != null ? _fa : 0;
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
                  message.editable = ((_ha = (_ga = item.entity1) == null ? void 0 : _ga.set) == null ? void 0 : _ha.writeable) ? "1" : "0";
                  message.action1 = ((_ia = item.setValue2) == null ? void 0 : _ia.writeable) ? "begin" : "disable";
                  message.action3 = ((_ka = (_ja = item.entity1) == null ? void 0 : _ja.set) == null ? void 0 : _ka.writeable) ? "clear" : "disable";
                  message.text1 = this.library.getTranslation("continue");
                  message.text3 = this.library.getTranslation("clear");
                  break;
                }
                case 2: {
                  message.editable = "0";
                  message.action2 = ((_la = item.setValue2) == null ? void 0 : _la.writeable) ? "pause" : "disable";
                  message.action3 = ((_na = (_ma = item.entity1) == null ? void 0 : _ma.set) == null ? void 0 : _na.writeable) ? "clear" : "disable";
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
                  message.editable = ((_pa = (_oa = item.entity1) == null ? void 0 : _oa.set) == null ? void 0 : _pa.writeable) ? "1" : "0";
                  message.action1 = ((_qa = item.setValue2) == null ? void 0 : _qa.writeable) ? "begin" : "disable";
                  message.action3 = ((_sa = (_ra = item.entity1) == null ? void 0 : _ra.set) == null ? void 0 : _sa.writeable) ? "clear" : "disable";
                  message.text1 = this.library.getTranslation("start");
                  message.text3 = this.library.getTranslation("clear");
                  break;
                }
                case 2: {
                  message.editable = "0";
                  message.action2 = ((_ta = item.setValue2) == null ? void 0 : _ta.writeable) ? "pause" : "disable";
                  message.action3 = ((_va = (_ua = item.entity1) == null ? void 0 : _ua.set) == null ? void 0 : _va.writeable) ? "clear" : "disable";
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
      case "popupSlider": {
        if (entry.type !== "number") {
          break;
        }
        const item = entry.data;
        message.type = "popupSlider";
        if (!(message.type === "popupSlider")) {
          break;
        }
        for (let a = 1; a <= 3; a++) {
          const b = ["1", "2", "3"][a - 1];
          const entity = item[`entity${b}`];
          if (!entity || !entity.value) {
            continue;
          }
          let v = await tools.getScaledNumber(entity);
          message[`hSlider${b}CurVal`] = String(v != null ? v : "");
          message[`hSlider${b}Visibility`] = "enable";
          const heading = item[`heading${b}`];
          if (heading) {
            message[`tSlider${b}`] = this.library.getTranslation((_wa = await heading.getString()) != null ? _wa : "");
          }
          message[`tIconS${b}M`] = import_icon_mapping.Icons.GetIcon("minus-box");
          message[`tIconS${b}P`] = import_icon_mapping.Icons.GetIcon("plus-box");
          const minValue = item[`minValue${b}`];
          let min = 0;
          if (minValue) {
            min = (_xa = await minValue.getNumber()) != null ? _xa : 0;
          } else if (entity && entity.value && entity.value.common.min != void 0) {
            min = entity.value.common.min;
          }
          message[`hSlider${b}MinVal`] = String(min);
          const maxValue = item[`maxValue${b}`];
          let max = 100;
          if (maxValue) {
            max = (_ya = await maxValue.getNumber()) != null ? _ya : 100;
          } else if (entity && entity.value && entity.value.common.max != void 0) {
            max = entity.value.common.max;
          }
          message[`hSlider${b}MaxVal`] = String(max);
          v = v != null ? import_Color.Color.scale(v, 0, 100, min, max) : v;
          message[`hSlider${b}CurVal`] = String(v != null ? v : "");
          const steps = item[`steps${b}`];
          message[`hSlider${b}Step`] = "1";
          if (steps) {
            message[`hSlider${b}Step`] = String((_za = await steps.getNumber()) != null ? _za : "1");
          } else if (entity && entity.value && entity.value.common.step != void 0) {
            message[`hSlider${b}Step`] = String(entity.value.common.step);
          }
          const zero = item[`zero${b}`];
          if (zero) {
            message[`hSlider${b}ZeroVal`] = String((_Aa = await zero.getNumber()) != null ? _Aa : "");
          }
        }
        break;
      }
      default: {
        const _exhaustiveCheck = mode;
        return _exhaustiveCheck;
      }
    }
    return this.getDetailPayload(message);
  }
  getLogname() {
    return this.parent ? `${this.parent.name}.${this.id}` : this.id;
  }
  async delete() {
    this.visibility = false;
    this.unload = true;
    await this.controller.statesControler.deactivateTrigger(this);
    if (this.parent.currentPanel.persistentPageItems[this.id]) {
      if (!this.parent.currentPanel.unload) {
        return;
      }
      delete this.parent.currentPanel.persistentPageItems[this.id];
    }
    await super.delete();
    this.controller.statesControler.deletePageLoop();
  }
  async onCommand(action, value) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
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
          if (entry.data && !("entityInSel" in entry.data)) {
            break;
          }
          await this.setListCommand(entry, value);
        }
        break;
      case "button": {
        if (entry.type === "button" || entry.type === "switch") {
          if (this.parent.isScreensaver) {
            if (!this.parent.screensaverIndicatorButtons) {
              this.parent.currentPanel.navigation.resetPosition();
              await this.parent.currentPanel.navigation.setCurrentPage();
              break;
            }
          }
          if (entry.role === "indicator") {
            if (this.parent.card === "cardThermo") {
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
              await this.parent.update();
              return true;
            } else if (this.confirmClick === "unlock" || this.confirmClick - 300 > Date.now()) {
              return true;
            }
            this.confirmClick = "lock";
            await this.parent.update();
          }
          if (item.popup) {
            const test = (_a = item.popup.isActive && await item.popup.isActive.getBoolean()) != null ? _a : true;
            if (test && item.popup.getMessage && item.popup.setMessage) {
              const message = await item.popup.getMessage.getString();
              const headline = (_b = item.popup.getHeadline && await item.popup.getHeadline.getString()) != null ? _b : "";
              if (message) {
                await item.popup.setMessage.setState(
                  JSON.stringify({ headline, message })
                );
              }
            }
            break;
          }
          let value2 = (_c = item.setNavi && await item.setNavi.getString()) != null ? _c : null;
          if (value2 !== null) {
            await this.parent.currentPanel.navigation.setTargetPageByName(value2);
            break;
          }
          value2 = (_d = item.entity1 && item.entity1.set && await item.entity1.set.getBoolean()) != null ? _d : null;
          if (value2 !== null && item.entity1 && item.entity1.set) {
            await item.entity1.set.setStateFlip();
          } else if ((_f = (_e = item.entity1) == null ? void 0 : _e.value) == null ? void 0 : _f.writeable) {
            await item.entity1.value.setStateFlip();
          }
          value2 = (_g = item.setValue1 && await item.setValue1.getBoolean()) != null ? _g : null;
          if (value2 !== null && item.setValue1) {
            await item.setValue1.setStateFlip();
          }
          if (item.setValue2) {
            await item.setValue2.setStateTrue();
          }
        } else if (entry.type === "light" || entry.type === "light2") {
          const item = entry.data;
          item.entity1 && item.entity1.set && await item.entity1.set.setStateFlip();
          item.setValue1 && await item.setValue1.setStateFlip();
        } else if (entry.type === "number") {
          const item = entry.data;
          if (item && item.switch1 && item.switch1.writeable) {
            await item.switch1.setStateFlip();
          }
        } else if (entry.type === "fan") {
          const item = entry.data;
          if ((_h = item.entity1) == null ? void 0 : _h.set) {
            await item.entity1.set.setStateFlip();
          } else if ((_j = (_i = item.entity1) == null ? void 0 : _i.value) == null ? void 0 : _j.writeable) {
            await item.entity1.value.setStateFlip();
          }
        }
        break;
      }
      case "brightnessSlider": {
        if (entry.type === "light" || entry.type === "light2") {
          const item = entry.data;
          if (this.timeouts.brightnessSlider) {
            this.adapter.clearTimeout(this.timeouts.brightnessSlider);
          }
          this.timeouts.brightnessSlider = this.adapter.setTimeout(
            async (item2, value2) => {
              var _a2, _b2, _c2, _d2;
              if (((_b2 = (_a2 = item2 == null ? void 0 : item2.dimmer) == null ? void 0 : _a2.value) == null ? void 0 : _b2.writeable) || ((_d2 = (_c2 = item2 == null ? void 0 : item2.dimmer) == null ? void 0 : _c2.set) == null ? void 0 : _d2.writeable)) {
                const dimmer = await tools.getScaledNumber(item2.dimmer);
                if (dimmer !== null && String(dimmer) != value2) {
                  await tools.setScaledNumber(item2.dimmer, parseInt(value2));
                }
              } else {
                this.log.warn("Dimmer is not writeable!");
              }
            },
            150,
            item,
            value
          );
        }
        break;
      }
      case "button1Press":
      case "button2Press":
      case "button3Press": {
        if (entry.type === "shutter2") {
          const item = entry.data;
          let entity = item.entity4;
          if (action === "button1Press") {
            entity = item.entity2;
          } else if (action === "button2Press") {
            entity = item.entity3;
          }
          if (entity && entity.set && entity.set.writeable) {
            if (!Array.isArray(entity.set.options.role) && ((_k = entity.set.options.role) == null ? void 0 : _k.startsWith("button"))) {
              await entity.set.setStateTrue();
            } else if (!Array.isArray(entity.set.options.role) && ((_l = entity.set.options.role) == null ? void 0 : _l.startsWith("switch"))) {
              await entity.set.setStateFlip();
            }
          }
        }
        break;
      }
      case "colorTempSlider": {
        if (entry.type === "light" || entry.type === "light2") {
          const item = entry.data;
          if (this.timeouts.colorTempSlider) {
            this.adapter.clearTimeout(this.timeouts.colorTempSlider);
          }
          this.timeouts.colorTempSlider = this.adapter.setTimeout(
            async (item2, value2) => {
              if (item2 && item2.White && item2.White.value) {
                await tools.setScaledNumber(item2.White, parseInt(value2));
              }
              if (item2 && item2.ct && item2.ct.value && item2.ct.value.writeable) {
                const ct = await tools.getSliderCTFromValue(item2.ct);
                if (ct !== null && String(ct) != value2) {
                  await tools.setSliderCTFromValue(item2.ct, parseInt(value2));
                }
              } else {
                this.log.warn(
                  `ct ${item2.ct && item2.ct.value ? item2.ct.value.options.dp : ""} is not writeable!`
                );
              }
            },
            150,
            item,
            value
          );
        }
        break;
      }
      case "OnOff": {
        if (entry.type === "light" || entry.type === "light2" || entry.type === "button" || entry.type === "switch" || entry.type === "fan") {
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
        if (entry.type === "light" || entry.type === "light2") {
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
                if (import_Color.Color.isRGB(rgb) && ((_m = item == null ? void 0 : item.color) == null ? void 0 : _m.true) && item.color.true.options.role !== "level.color.rgb") {
                  await item.color.true.setState(JSON.stringify(rgb));
                  break;
                }
              }
              // eslint-disable-next-line no-fallthrough
              case "rgb.hex": {
                const rgb = import_Color.Color.resultToRgb(value);
                if (import_Color.Color.isRGB(rgb)) {
                  item.color && item.color.true && await item.color.true.setState(import_Color.Color.ConvertRGBtoHex(rgb.r, rgb.g, rgb.b));
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
        if (entry.type !== "shutter" && entry.type !== "shutter2") {
          break;
        }
        if (entry.data.up && entry.data.up.writeable) {
          await entry.data.up.setStateTrue();
          break;
        }
      }
      // eslint-disable-next-line no-fallthrough
      case "stop": {
        if (entry.type !== "shutter" && entry.type !== "shutter2") {
          break;
        }
        if (action === "stop" && entry.data.stop && entry.data.stop.writeable) {
          await entry.data.stop.setStateTrue();
          break;
        }
      }
      // eslint-disable-next-line no-fallthrough
      case "down": {
        if (entry.type === "shutter" || entry.type === "shutter2") {
          if (action === "down" && entry.data.down && entry.data.down.writeable) {
            await entry.data.down.setStateTrue();
            break;
          }
          if (entry.type === "shutter") {
            const items2 = entry.data;
            const list = await this.getListCommands(items2.setList);
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
            }
          }
          const items = entry.data;
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
        break;
      }
      /**
       * 100 is right 0 left
       */
      case "positionSlider": {
        if (entry.type === "shutter") {
          const items = entry.data;
          if (tools.ifValueEntryIs(items.entity1, "number")) {
            let v = parseInt(value.trim());
            v = !this.adapter.config.shutterClosedIsZero ? 100 - v : v;
            await tools.setValueEntry(items.entity1, v);
          }
        } else if (entry.type === "shutter2") {
          const items = entry.data;
          if (tools.ifValueEntryIs(items.entity1, "number")) {
            let v = parseInt(value.trim());
            v = this.adapter.config.shutterClosedIsZero ? 100 - v : v;
            await tools.setValueEntry(items.entity1, v);
          }
        }
        break;
        break;
      }
      /**
       * zu 100% geschlossen zu 0% geschlossen
       */
      case "tiltSlider": {
        if (entry.type === "shutter") {
          const items = entry.data;
          if (tools.ifValueEntryIs(items.entity2, "number")) {
            let v = parseInt(value.trim());
            v = !this.adapter.config.shutterClosedIsZero ? 100 - v : v;
            await tools.setValueEntry(items.entity2, v);
          }
        }
        break;
      }
      case "positionSlider1":
      case "positionSlider2":
      case "positionSlider3": {
        if (entry.type !== "number") {
          break;
        }
        const item = entry.data;
        for (let a = 1; a <= 3; a++) {
          const b = ["1", "2", "3"][a - 1];
          if (action === `positionSlider${b}` && item[`entity${b}`]) {
            const entity = item[`entity${b}`];
            if (entity) {
              {
                let v = parseInt(value.trim());
                const minValue = item[`minValue${b}`];
                let min = 0;
                if (minValue) {
                  min = (_n = await minValue.getNumber()) != null ? _n : 0;
                } else if (entity && entity.value && entity.value.common.min != void 0) {
                  min = entity.value.common.min;
                }
                const maxValue = item[`maxValue${b}`];
                let max = 100;
                if (maxValue) {
                  max = (_o = await maxValue.getNumber()) != null ? _o : 100;
                } else if (entity && entity.value && entity.value.common.max != void 0) {
                  max = entity.value.common.max;
                }
                v = v != null ? import_Color.Color.scale(v, min, max, 0, 100) : v;
                await tools.setScaledNumber(entity, Math.round(v));
              }
            }
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
            150,
            value
          );
        } else if (entry.type === "fan") {
          this.timeouts["number-set"] = this.adapter.setTimeout(
            async (value2) => {
              await tools.setValueEntry(entry.data.speed, parseInt(value2), false);
            },
            150,
            value
          );
        }
        break;
      }
      case "timer-begin": {
        if (this.dataItems && this.dataItems.type == "timer" && this.dataItems.data) {
          this.dataItems.data.setValue2 && await this.dataItems.data.setValue2.setState(2);
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
                } else if (!this.parent.sleep && this.parent.getVisibility()) {
                  await this.parent.onStateTriggerSuperDoNotOverride("timer", this);
                }
                if (this.tempInterval) {
                  this.adapter.clearInterval(this.tempInterval);
                }
                this.tempInterval = void 0;
              } else if (this.tempData.value > 0) {
                if (this.visibility) {
                  await this.onStateTrigger();
                } else if (!this.parent.sleep && this.parent.getVisibility()) {
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
              ((_p = this.dataItems.data.entity1) == null ? void 0 : _p.set) && await this.dataItems.data.entity1.set.setState(r);
            }
            break;
          }
          case "ex-timer": {
            const t = value.split(":").reduce((p, c, i) => {
              return String(parseInt(p) + parseInt(c) * 60 ** (2 - i));
            });
            const r = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, parseInt(t), 0)).getTime();
            if (this.dataItems && this.dataItems.type == "timer" && this.dataItems.data) {
              ((_q = this.dataItems.data.entity1) == null ? void 0 : _q.set) && await this.dataItems.data.entity1.set.setState(r);
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
          this.dataItems.data.setValue2 && await this.dataItems.data.setValue2.setState(0);
        }
        if (this.tempData) {
          switch (this.tempData.role) {
            case "ex-alarm":
            case "ex-timer": {
              const r = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)).getTime();
              if (this.dataItems && this.dataItems.type == "timer" && this.dataItems.data) {
                ((_r = this.dataItems.data.entity1) == null ? void 0 : _r.set) && await this.dataItems.data.entity1.set.setState(r);
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
          this.dataItems.data.setValue2 && await this.dataItems.data.setValue2.setState(1);
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
        await this.parent.onPopupRequest(this.id, "popupThermo", "", "", null);
        return;
      }
      const msg = await this.GeneratePopup(this.lastPopupType);
      if (msg) {
        this.sendToPanel(msg, false);
      }
    }
    if (from && this.parent.currentPanel.isOnline && this.parent === this.parent.currentPanel.screenSaver && this.parent.currentPanel.screenSaver) {
      await this.parent.currentPanel.screenSaver.onStateTrigger(id, from);
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
    var _a, _b, _c, _d, _e, _f, _g;
    const item = entry.data;
    if (!item || !("entityInSel" in item)) {
      return false;
    }
    const sList = item.entityInSel && await this.getListFromStates(
      item.entityInSel,
      item.valueList,
      entry.role,
      "valueList2" in item ? item.valueList2 : void 0
    );
    if (sList) {
      if ((entry.role === "spotify-speaker" || entry.role === "spotify-playlist" || entry.role === "spotify-tracklist") && sList.list !== void 0 && sList.list[parseInt(value)] !== void 0 && sList.states !== void 0 && sList.states[parseInt(value)] !== void 0 && item.entityInSel && item.entityInSel.set) {
        const v2 = parseInt(value);
        const index = sList.states[v2] || -1;
        if (index !== -1) {
          await item.entityInSel.set.setState(sList.states[v2]);
        }
      } else if (entry.role === "alexa-speaker" && sList.list !== void 0 && sList.list[parseInt(value)] !== void 0 && item.entityInSel && item.entityInSel.set) {
        const v2 = parseInt(value);
        const index = ((_a = sList.states) == null ? void 0 : _a[v2]) || -1;
        if (((_b = this.parent.currentItems) == null ? void 0 : _b.ident) && await this.parent.isPlaying()) {
          await this.adapter.setForeignStateAsync(
            `${this.parent.currentItems.ident}.Commands.textCommand`,
            `Schiebe Musik auf ${sList.list[v2]}`
          );
        }
        if (index !== -1) {
          this.parent.card == "cardMedia" && await this.parent.updateCurrentPlayer(
            ((_c = this.tempData[index]) == null ? void 0 : _c.id) || "",
            ((_d = this.tempData[index]) == null ? void 0 : _d.name) || ""
          );
        }
        const msg = await this.GeneratePopup("popupInSel");
        if (msg) {
          this.sendToPanel(msg, false);
        }
        return true;
      } else if (entry.role === "alexa-playlist" && sList.list !== void 0 && sList.list[parseInt(value)] !== void 0 && sList.states && sList.states[parseInt(value)] !== void 0 && this.tempData.length > 0) {
        const v2 = parseInt(value);
        if (((_e = this.dataItems) == null ? void 0 : _e.type) === "input_sel" && this.dataItems.data.valueList) {
          const dp = sList.states[v2];
          if (dp) {
            await this.adapter.setForeignStateAsync(dp, sList.list[v2], false);
          }
        }
      } else if (sList.states !== void 0 && sList.states[parseInt(value)] !== void 0 && item.entityInSel && item.entityInSel.value) {
        if (((_g = (_f = item.entityInSel.value) == null ? void 0 : _f.common) == null ? void 0 : _g.type) === "number") {
          await item.entityInSel.value.setState(parseInt(sList.states[parseInt(value)]));
        } else {
          await item.entityInSel.value.setState(sList.states[parseInt(value)]);
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
          if (item.entityInSel.set) {
            await item.entityInSel.set.setState(value);
          } else {
            await item.entityInSel.value.setState(value);
          }
          return true;
        }
      }
      return false;
    }
    const list = await this.getListCommands(item.setList);
    const v = value;
    if (list && list[v]) {
      try {
        const obj = await this.parent.currentPanel.statesControler.getObjectAsync(list[v].id);
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
    var _a, _b, _c, _d, _e, _f;
    const list = {};
    if (entityInSel && entityInSel.value) {
      if (role === "alexa-speaker") {
        if (entityInSel.value.options.dp) {
          list.list = [];
          list.states = [];
          for (const a in this.tempData) {
            list.list.push(this.tempData[a].name);
            list.states.push(a);
          }
          const dp = ((_a = this.parent.currentItems) == null ? void 0 : _a.ident) || ((_b = entityInSel == null ? void 0 : entityInSel.value) == null ? void 0 : _b.options.dp) || "";
          const index = this.tempData.findIndex((a) => dp.includes(a.id));
          if (index !== -1 && !list.value) {
            list.value = this.tempData[index].name;
          }
        }
      } else if (role === "alexa-playlist") {
        this.log.debug(`Get Alexa Playlist start`);
        if (((_c = this.dataItems) == null ? void 0 : _c.type) === "input_sel" && this.dataItems.data.valueList) {
          const raw = await this.dataItems.data.valueList.getObject();
          if (!Array.isArray(raw) || !raw.every((v) => typeof v === "string")) {
            this.log.error("Alexa playlist: valueList must be string[].");
          } else {
            const source = (_d = this.tempData) != null ? _d : [];
            const listOut = [];
            const statesOut = [];
            for (const entry of raw) {
              const sep = entry.indexOf(".");
              if (sep <= 0 || sep >= entry.length - 1) {
                this.log.warn(`Alexa playlist entry "${entry}" is invalid (expected "state.label").`);
                continue;
              }
              const stateToken = entry.slice(0, sep).trim();
              const label = entry.slice(sep + 1).trim();
              const matchedState = source.find((s) => s.includes(stateToken));
              if (!matchedState) {
                this.log.warn(`Alexa playlist: no matching state for token "${stateToken}".`);
                continue;
              }
              listOut.push(label);
              statesOut.push(matchedState);
            }
            list.list = listOut;
            list.states = statesOut;
            list.value = "";
          }
        }
        this.log.debug(`Alexa Playlist list: finish`);
      } else if (role === "spotify-speaker" || role === "spotify-playlist") {
        if (entityInSel.value.options.dp) {
          const o = await entityInSel.value.getCommonStates(true);
          const v = await entityInSel.value.getString();
          const al = await (valueList == null ? void 0 : valueList.getObject());
          if (o) {
            list.list = [];
            list.states = [];
            list.value = "";
            for (const a in o) {
              const str = String(o[a]).replace(/\r?\n/g, "").trim();
              if (!al || al && Array.isArray(al) && (al.includes(str) || al.length === 0)) {
                list.list.push(str);
                list.states.push(a);
                if (a === v && !list.value) {
                  list.value = str;
                }
              }
            }
          }
        }
      } else if (role === "spotify-tracklist") {
        if (valueList2) {
          const arr = await valueList2.getObject();
          if (arr) {
            list.list = [];
            list.states = [];
            const v = await entityInSel.value.getString();
            for (let a = 0; a < arr.length; a++) {
              if (arr[a].id === v && !list.value) {
                list.value = `${arr[a].title}`;
              }
              list.list.push(`${arr[a].title}`);
              list.states.push(String(a + 1));
            }
            const value = await entityInSel.value.getNumber();
            if (value && !list.value) {
              list.value = list.list[value - 1];
            }
          }
        }
      } else if (["string", "number"].indexOf((_e = entityInSel.value.type) != null ? _e : "") !== -1 && (await entityInSel.value.getCommonStates() || valueList2 != null)) {
        let states = void 0;
        const value = await tools.getValueEntryString(entityInSel);
        if (valueList && valueList2) {
          role = "2values";
        }
        switch (role) {
          /*case 'spotify-tracklist': {
              if (valueList) {
                  const val = (await valueList.getObject()) as typePageItem.spotifyPlaylist | null;
                  if (val) {
                      states = {};
                      for (let a = 0; a < val.length; a++) {
                          states[a + 1] = val[a].title;
                      }
                      list.value = value ?? undefined;
                  }
              }
              break;
          }*/
          case "2values": {
            if (!valueList || !valueList2) {
              this.log.error("2values requires both valueList and valueList2!");
              states = {};
              break;
            }
            const raw1 = await valueList.getObject();
            const raw2 = await valueList2.getObject();
            const isStringArray = (x) => Array.isArray(x) && x.every((v) => typeof v === "string");
            if (!isStringArray(raw1) || !isStringArray(raw2)) {
              this.log.error("2values: valueList/valueList2 must be string[]!");
              states = {};
              break;
            }
            const keys = raw1;
            const vals = raw2;
            const len = Math.min(keys.length, vals.length);
            if (keys.length !== vals.length) {
              this.log.warn(
                `2values: length mismatch (keys=${keys.length}, values=${vals.length}); truncating to ${len}.`
              );
            }
            const map = {};
            for (let i = 0; i < len; i++) {
              const k = keys[i];
              const v = (_f = vals[i]) != null ? _f : "";
              if (!k) {
                continue;
              }
              if (map[k] !== void 0) {
                this.log.warn(
                  `2values: duplicate key "${k}" at index ${i} \u2013 overwriting previous value.`
                );
              }
              map[k] = v;
            }
            states = map;
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
    }
    return list;
  }
  static isPageItemTextDataItems(F) {
    return F && typeof F === "object" && "type" in F && F.type === "text";
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageItem
});
//# sourceMappingURL=pageItem.js.map
