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
var import_data_item = require("../controller/data-item");
var import_function_and_const = require("../types/function-and-const");
var import_baseClassPage = require("../classes/baseClassPage");
class PageItem extends import_baseClassPage.BaseTriggeredPage {
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
  // for select - force next read of common
  updateCommon = { lastRequest: 0, counts: 0 };
  constructor(config, options) {
    super({
      name: config.name,
      adapter: config.adapter,
      panel: config.panel,
      dpInit: config.dpInit
    });
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
    const tempItem = await this.parent.basePanel.statesControler.createDataItems(
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
            const test = list && list[a] && list[a].id && await this.parent.basePanel.statesControler.getObjectAsync(list[a].id);
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
          if (!this.parent.basePanel.persistentPageItems[this.id]) {
            this.parent.basePanel.persistentPageItems[this.id] = this;
          }
        }
        break;
      }
    }
    if (["screensaver", "screensaver2", "screensaver3", "popupNotify", "popupNotify2"].indexOf(this.parent.card) !== -1) {
      if (!this.parent.basePanel.persistentPageItems[this.id]) {
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
        this.parent.basePanel.persistentPageItems[this.id] = this;
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
        `${this.parent.currentItem ? this.parent.currentItem.ident : this.parent.items[0].ident}.Music-Provider.*`
      );
      if (states) {
        this.tempData = Object.keys(states);
      }
    }
  }
  async getPageItemPayload() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga;
    await this.controller.statesControler.activateTrigger(this);
    this.lastPopupType = void 0;
    if (this.dataItems && this.config) {
      this.visibility = false;
      this.triggerParent = true;
      const entry = this.dataItems;
      const message = {};
      message.intNameEntity = this.id;
      if (!await this.isEnabled()) {
        return "";
      }
      switch (entry.type) {
        case "light":
        case "light2": {
          const item = entry.data;
          if (this.config.role === "volume.mute") {
            message.type = "light";
          } else {
            message.type = (0, import_function_and_const.isCardGridType)(this.parent.card) && (this.config.role === "light" || this.config.role === "socket") ? "switch" : this.parent.basePanel.overrideLightPopup ? this.parent.basePanel.lightPopupV2 && this.parent.basePanel.meetsVersion("4.7.5") ? "light2" : "light" : entry.type;
          }
          const v = await tools.getValueEntryBoolean(item.entity1);
          const dimmer = (_a = item.dimmer && item.dimmer.value && await item.dimmer.value.getNumber()) != null ? _a : null;
          if (this.config.role === "volume.mute") {
            message.icon = await tools.getIconEntryValue(item.icon, !!v, "volume-high");
            message.optionalValue = v ? "1" : "0";
            message.iconColor = await tools.getIconEntryColor(item.icon, !!v, import_Color.Color.on, import_Color.Color.off);
          } else {
            let rgb = (_c = (_b = await tools.getRGBfromRGBThree(item)) != null ? _b : item.color && item.color.true && await item.color.true.getRGBValue()) != null ? _c : null;
            const nhue = (_d = item.hue && await item.hue.getNumber()) != null ? _d : null;
            if (rgb === null && nhue) {
              rgb = (_e = import_Color.Color.hsv2RGB(nhue, 1, 1)) != null ? _e : null;
            }
            message.icon = await tools.getIconEntryValue(item.icon, v, "", "");
            let colorMode = !item.colorMode ? "none" : await item.colorMode.getBoolean() ? "hue" : "ct";
            if (colorMode === "none") {
              const ctState = item.ct && item.ct.value && await item.ct.value.getState();
              const colorState = (_j = (_i = (_h = (_g = (_f = item.Red && await item.Red.getState()) != null ? _f : item.Green && await item.Green.getState()) != null ? _g : item.Blue && await item.Blue.getState()) != null ? _h : item.color && item.color.true && await item.color.true.getState()) != null ? _i : item.hue && await item.hue.getState()) != null ? _j : null;
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
            const iconColor = dimmer != null ? ((_l = (_k = item.icon) == null ? void 0 : _k.true) == null ? void 0 : _l.color) ? await item.icon.true.color.getRGBValue() : import_Color.Color.Yellow : null;
            message.iconColor = (_n = (_m = colorMode === "hue" ? await tools.GetIconColor(
              rgb != null ? rgb : void 0,
              dimmer != null ? dimmer > 30 ? dimmer : 30 : v
            ) : await tools.getTemperaturColorFromValue(item.ct, dimmer != null ? dimmer : 100)) != null ? _m : iconColor ? await tools.GetIconColor(iconColor, dimmer != null ? dimmer > 30 ? dimmer : 30 : v) : await tools.getIconEntryColor(item.icon, dimmer != null ? dimmer : v, import_Color.Color.Yellow)) != null ? _n : "";
            if (v) {
              message.optionalValue = "1";
            } else {
              message.optionalValue = "0";
            }
          }
          message.displayName = this.library.getTranslation(
            (_p = (_o = await tools.getEntryTextOnOff(item.headline, v)) != null ? _o : message.displayName) != null ? _p : ""
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
            (_r = (_q = await tools.getEntryTextOnOff(item.headline, !!value)) != null ? _q : message.displayName) != null ? _r : ""
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
            (_t = (_s = await tools.getEntryTextOnOff(item.headline, !!value)) != null ? _s : message.displayName) != null ? _t : ""
          );
          return tools.getItemMesssage(message);
        }
        case "number": {
          if (entry.type === "number") {
            const item = entry.data;
            message.type = "number";
            const number = (_u = await tools.getValueEntryNumber(item.entity1, false)) != null ? _u : 0;
            const value = (_v = item.switch1 && await item.switch1.getBoolean()) != null ? _v : null;
            message.displayName = this.library.getTranslation(
              (_w = await tools.getEntryTextOnOff(item.text, true)) != null ? _w : ""
            );
            message.icon = entry.role === "textNotIcon" ? (_x = await tools.getIconEntryValue(item.icon, value, "", null, true)) != null ? _x : "" : (_y = await tools.getIconEntryValue(item.icon, value !== true, "")) != null ? _y : "";
            message.iconColor = (_z = await tools.getIconEntryColor(item.icon, value !== true, import_Color.Color.HMIOn)) != null ? _z : "";
            let min = item.entity1 && item.entity1.value && item.entity1.value.common.min;
            let max = item.entity1 && item.entity1.value && item.entity1.value.common.max;
            min = (_B = (_A = item.minValue1 && await item.minValue1.getNumber()) != null ? _A : min) != null ? _B : 0;
            max = (_D = (_C = item.maxValue1 && await item.maxValue1.getNumber()) != null ? _C : max) != null ? _D : 100;
            return tools.getPayloadRemoveTilde(
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
            if (entry.role === "text.states") {
              const key = value ? "true" : "false";
              const dataitem = ((_E = item.text) == null ? void 0 : _E[key]) ? (0, import_data_item.isDataItem)(item.text[key]) ? item.text[key] : item.text[key].value : null;
              const states = dataitem ? await dataitem.getCommonStates() : null;
              if (states && dataitem) {
                const v = await dataitem.getString();
                if (v != null && states[v]) {
                  message.displayName = (_F = this.library.getTranslation(states[v])) != null ? _F : "";
                }
              }
            } else {
              message.displayName = this.library.getTranslation(
                (_G = await tools.getEntryTextOnOff(item.text, !!value)) != null ? _G : ""
              );
            }
            if (entry.type === "switch") {
              message.optionalValue = (value != null ? value : true) ? "1" : "0";
            } else if (entry.type === "button") {
              message.optionalValue = (value != null ? value : true) ? "1" : "0";
              if ((0, import_function_and_const.isCardEntitiesType)(this.parent.card)) {
                message.optionalValue = (_H = this.library.getTranslation(await tools.getEntryTextOnOff(item.text1, !!value))) != null ? _H : message.optionalValue;
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
                    (_J = (_I = await tools.getValueEntryString(item.entity2)) != null ? _I : await tools.getEntryTextOnOff(item.text1, value)) != null ? _J : ""
                  );
                }
              }
            }
            if (entry.type === "button" && entry.data.confirm) {
              if (this.confirmClick === "unlock") {
                if ((0, import_function_and_const.isCardEntitiesType)(this.parent.card)) {
                  message.optionalValue = (_K = await entry.data.confirm.getString()) != null ? _K : message.optionalValue;
                }
                this.confirmClick = Date.now();
              } else {
                this.confirmClick = "lock";
              }
            }
            message.icon = await tools.getIconEntryValue(item.icon, value, "home");
            switch (entry.role) {
              case "textNotIcon": {
                message.icon = (_L = await tools.getIconEntryValue(item.icon, value, "", null, true)) != null ? _L : "";
                break;
              }
              case "iconNotText": {
                message.icon = (_M = await tools.getIconEntryValue(item.icon, value, "", null, false)) != null ? _M : "";
                break;
              }
              case "battery": {
                const val = (_N = await tools.getValueEntryBoolean(item.entity3)) != null ? _N : false;
                message.icon = (_O = await tools.getIconEntryValue(item.icon, val, "", "", false)) != null ? _O : "";
                break;
              }
              case "combined": {
                message.icon = (_P = await tools.getIconEntryValue(item.icon, value, "", null, false)) != null ? _P : "";
                message.icon += (_Q = await tools.getIconEntryValue(item.icon, value, "", null, true)) != null ? _Q : "";
                break;
              }
              default: {
                message.icon = (_S = await tools.getIconEntryValue(
                  item.icon,
                  !!value,
                  "",
                  null,
                  (_R = !(0, import_function_and_const.isCardEntitiesType)(this.parent.card) && !this.parent.card.startsWith("screens")) != null ? _R : false
                )) != null ? _S : "";
              }
            }
            const additionalId = entry.data.additionalId ? await entry.data.additionalId.getString() : "";
            message.iconColor = await tools.getIconEntryColor(item.icon, value != null ? value : true, import_Color.Color.HMIOn);
            return tools.getPayloadRemoveTilde(
              entry.type,
              message.intNameEntity + additionalId,
              message.icon,
              message.iconColor,
              (_T = message.displayName) != null ? _T : "",
              message.optionalValue
            );
          }
          break;
        }
        case "input_sel": {
          const item = entry.data;
          message.type = "input_sel";
          let value = (_U = await tools.getValueEntryNumber(item.entityInSel)) != null ? _U : await tools.getValueEntryBoolean(item.entityInSel);
          if (entry.role === "alexa-speaker") {
            value = this.parent.currentItem === this.parent.items[0];
          }
          message.icon = await tools.getIconEntryValue(item.icon, !!(value != null ? value : true), "gesture-tap-button");
          message.iconColor = (_V = await tools.getIconEntryColor(item.icon, !!(value != null ? value : true), import_Color.Color.HMIOff)) != null ? _V : import_Color.Color.HMIOn;
          message.displayName = this.library.getTranslation(
            (_X = (_W = await tools.getEntryTextOnOff(item.headline, !!(value != null ? value : true))) != null ? _W : message.displayName) != null ? _X : ""
          );
          message.optionalValue = this.library.getTranslation(
            (_Y = await tools.getEntryTextOnOff(item.text, !!(value != null ? value : true), true)) != null ? _Y : "PRESS"
          );
          return tools.getItemMesssage(message);
          break;
        }
        case "fan":
          {
            if (entry.type === "fan") {
              const item = entry.data;
              message.type = "fan";
              const value = (_Z = await tools.getValueEntryBoolean(item.entity1)) != null ? _Z : null;
              message.displayName = this.library.getTranslation(
                (_$ = (__ = await tools.getEntryTextOnOff(item.headline, true)) != null ? __ : message.displayName) != null ? _$ : ""
              );
              message.icon = (_aa = await tools.getIconEntryValue(item.icon, value, "")) != null ? _aa : "";
              message.iconColor = (_ba = await tools.getIconEntryColor(item.icon, value, import_Color.Color.HMIOn)) != null ? _ba : "";
              return tools.getPayloadRemoveTilde(
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
            const value = (_da = (_ca = item.entity1 && item.entity1.value && await tools.getValueEntryNumber(item.entity1)) != null ? _ca : this.tempData && this.tempData.time) != null ? _da : 0;
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
                (_ea = await tools.getEntryTextOnOff(item.text, value !== 0)) != null ? _ea : opt
              );
              message.displayName = this.library.getTranslation(
                (_ga = (_fa = await tools.getEntryTextOnOff(item.headline, true)) != null ? _fa : message.displayName) != null ? _ga : ""
              );
              return tools.getPayloadRemoveTilde(
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
            return tools.getPayloadRemoveTilde("", "delete", "", "", "", "");
          }
          break;
      }
    }
    this.log.warn(
      `Something went wrong on ${this.id} type: ${this.config && this.config.type} role: ${this.dataItems && this.dataItems.role} dataitems.type: ${this.dataItems && this.dataItems.type}!`
    );
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
        result = { ...result, ...message };
        return tools.getPayloadRemoveTilde(
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
        result = { ...result, ...message };
        return tools.getPayloadRemoveTilde(
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
        result = { ...result, ...message };
        return tools.getPayloadRemoveTilde(
          result.headline,
          result.entityName,
          result.currentState,
          result.list
        );
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
        result = { ...result, ...message };
        return tools.getPayloadRemoveTilde(
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
        result = { ...result, ...message };
        return tools.getPayloadRemoveTilde(
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
        result = { ...result, ...message };
        return tools.getPayloadRemoveTilde(
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
        result = { ...result, ...message };
        return tools.getPayloadRemoveTilde(
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
        result = { ...result, ...message };
        return tools.getPayloadRemoveTilde(
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
    var _a, _b, _c;
    if (this.config && this.dataItems) {
      const entry = this.dataItems;
      if ((_a = entry.data) == null ? void 0 : _a.enabled) {
        if (((_b = this.config) == null ? void 0 : _b.role) === "isDismissiblePerEvent") {
          if ((_c = this.tempData) == null ? void 0 : _c.isDismissiblePerEvent) {
            return false;
          }
        }
        const val = await tools.getEnabled(entry.data.enabled);
        return val != null ? val : true;
      }
    }
    return true;
  }
  async onStateChange(_dp, _state) {
    var _a, _b, _c;
    if (_state.old.val !== _state.new.val) {
      if (((_a = this.config) == null ? void 0 : _a.role) === "isDismissiblePerEvent") {
        if ((_c = (_b = this.dataItems) == null ? void 0 : _b.data) == null ? void 0 : _c.enabled) {
          if (Array.isArray(this.dataItems.data.enabled)) {
            let found = false;
            for (const en of this.dataItems.data.enabled) {
              if (en && "dp" in en.options && en.options.dp === _dp) {
                found = true;
              }
            }
            if (found) {
              const val = await tools.getEnabled(this.dataItems.data.enabled);
              if (!val) {
                this.tempData = { ...this.tempData, isDismissiblePerEvent: false };
              }
            }
          } else {
            const en = this.dataItems.data.enabled;
            if ("dp" in en.options && en.options.dp === _dp) {
              const val = await tools.getEnabled(en);
              if (!val) {
                this.tempData = { ...this.tempData, isDismissiblePerEvent: false };
              }
            }
          }
        }
      }
    }
  }
  getGlobalDismissibleID() {
    var _a, _b;
    if (((_a = this.config) == null ? void 0 : _a.role) === "isDismissiblePerEvent") {
      return ((_b = this.config) == null ? void 0 : _b.dismissibleIDGlobal) || null;
    }
    return null;
  }
  setDismissiblePerEvent() {
    var _a;
    if (((_a = this.config) == null ? void 0 : _a.role) === "isDismissiblePerEvent") {
      this.tempData = { ...this.tempData, isDismissiblePerEvent: true };
    }
  }
  async GeneratePopup(mode) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha, _ia, _ja, _ka, _la, _ma, _na, _oa, _pa, _qa, _ra, _sa, _ta, _ua, _va, _wa, _xa, _ya, _za, _Aa, _Ba;
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
          case "volume.mute":
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
            if (this.config.role !== "volume.mute") {
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
              message.slider2Translation = (_t = item.text2 && item.text2.true && await item.text2.true.getString()) != null ? _t : void 0;
              message.hue_translation = (_u = item.text3 && item.text3.true && await item.text3.true.getString()) != null ? _u : void 0;
            } else {
              message.slider2Pos = "disable";
              message.slidersColor = (_v = await tools.getIconEntryColor(
                item.icon,
                message.buttonState !== false,
                import_Color.Color.White
              )) != null ? _v : "disable";
            }
            message.slider1Translation = (_w = item.text1 && item.text1.true && await item.text1.true.getString()) != null ? _w : void 0;
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
          const value = (_x = await tools.getValueEntryBoolean(item.entity1)) != null ? _x : null;
          message.icon = (_y = await tools.getIconEntryValue(item.icon, value, "")) != null ? _y : "";
          message.iconColor = (_z = await tools.getIconEntryColor(item.icon, value, import_Color.Color.HMIOn)) != null ? _z : "";
          message.slider1 = String((_A = await tools.getScaledNumber(item.speed)) != null ? _A : "");
          message.slider1Max = String(
            (_B = item.speed && item.speed.maxScale && await item.speed.maxScale.getNumber()) != null ? _B : "100"
          );
          message.buttonstate = value ? "1" : "0";
          message.speedText = this.library.getTranslation(
            (_C = await tools.getEntryTextOnOff(item.text, value)) != null ? _C : ""
          );
          let force = false;
          if (this.updateCommon.counts < 4) {
            if (Date.now() - this.updateCommon.lastRequest > 5e3) {
              this.updateCommon.counts = 0;
            } else {
              this.updateCommon.counts++;
            }
          } else {
            this.updateCommon.counts = 0;
            this.updateCommon.lastRequest = Date.now();
            force = true;
          }
          const sList = item.entityInSel && await this.getListFromStates(
            item.entityInSel,
            item.valueList,
            entry.role,
            "valueList2" in item ? item.valueList2 : void 0,
            force
          );
          if (sList !== void 0 && sList.list !== void 0 && sList.value !== void 0 && sList.states !== void 0) {
            if (sList.list.length > 0) {
              sList.list = sList.list.slice(0, 48);
              message.modeList = Array.isArray(sList.list) ? sList.list.map((a) => tools.formatInSelText(a.replace("?", ""))).join("?") : "";
              message.mode = tools.formatInSelText(this.library.getTranslation(sList.value));
            }
          } else {
            let list = (_E = (_D = item.valueList && await item.valueList.getObject()) != null ? _D : item.valueList && await item.valueList.getString()) != null ? _E : "";
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
            message.modeList = list.map((a) => a.replace("?", "")).join("?");
            if (message.modeList && message.modeList.length > 900) {
              message.modeList = message.modeList.slice(0, 900);
              this.log.warn("Value list has more as 900 chars!");
            }
            const n = (_F = await tools.getValueEntryNumber(item.entityInSel)) != null ? _F : 0;
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
        let value = (_G = await tools.getValueEntryNumber(item.entityInSel)) != null ? _G : await tools.getValueEntryBoolean(item.entityInSel);
        if (entry.role === "alexa-speaker") {
          value = this.parent.currentItem === this.parent.items[0];
        }
        message.textColor = (_H = await tools.getIconEntryColor(item.icon, !!(value != null ? value : true), import_Color.Color.HMIOff)) != null ? _H : import_Color.Color.HMIOn;
        message.currentState = mode === "popupThermo" ? this.library.getTranslation((_I = item.headline && await item.headline.getString()) != null ? _I : "") : "entity2" in item ? (_J = await tools.getValueEntryString(item.entity2)) != null ? _J : "" : "";
        message.headline = this.library.getTranslation(
          (_K = item.headline && await item.headline.getString()) != null ? _K : ""
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
            message.list = Array.isArray(sList.list) ? sList.list.map((a) => tools.formatInSelText(a.replace("?", ""))).join("?") : "";
            message.currentState = tools.formatInSelText(this.library.getTranslation(sList.value));
            if (mode !== "popupThermo") {
              break;
            }
            message = { ...message, type: "popupThermo" };
            if (message.type === "popupThermo") {
              message.headline = this.library.getTranslation(
                (_M = (_L = await tools.getEntryTextOnOff(item.headline, true)) != null ? _L : message.headline) != null ? _M : ""
              );
            }
            break;
          }
        }
        let list = (_O = (_N = item.valueList && await item.valueList.getObject()) != null ? _N : item.valueList && await item.valueList.getString()) != null ? _O : [
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
        message.list = list.map((a) => a.replace("?", "")).join("?");
        if (message.list && message.list.length > 900) {
          message.list = message.list.slice(0, 900);
          this.log.warn("Value list has more as 900 chars!");
        }
        const n = (_P = await tools.getValueEntryNumber(item.entityInSel)) != null ? _P : 0;
        if (Array.isArray(list) && n != null && n < list.length) {
          message.currentState = list[n];
        }
        if (mode !== "popupThermo") {
          break;
        }
        message = { ...message, type: "popupThermo" };
        if (message.type === "popupThermo") {
          message.headline = this.library.getTranslation(
            (_R = (_Q = await tools.getEntryTextOnOff(item.headline, true)) != null ? _Q : message.headline) != null ? _R : ""
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
        let pos1 = (_S = await tools.getValueEntryNumber(item.entity1)) != null ? _S : "disable";
        if (pos1 === "disable") {
          pos1 = (_T = await tools.getValueEntryBoolean(item.entity1)) != null ? _T : "disable";
        }
        message.text2 = (_U = await tools.getEntryTextOnOff(item.text, typeof pos1 === "boolean" ? pos1 : true)) != null ? _U : "";
        message.text2 = this.library.getTranslation(message.text2);
        let pos2 = (_V = await tools.getValueEntryNumber(item.entity2)) != null ? _V : "disable";
        if (pos1 !== "disable") {
          pos1 = !this.adapter.config.shutterClosedIsZero && typeof pos1 === "number" ? 100 - pos1 : pos1;
          message.icon = (_W = await tools.getIconEntryValue(item.icon, pos1, "")) != null ? _W : "";
        } else if (typeof pos2 !== "string") {
          pos2 = !this.adapter.config.shutterClosedIsZero && typeof pos2 === "number" ? 100 - pos2 : pos2;
          message.icon = (_X = await tools.getIconEntryValue(item.icon, pos2, "")) != null ? _X : "";
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
            message.pos1text = (_Y = await tools.getEntryTextOnOff(item.text1, true)) != null ? _Y : "";
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
            message.pos2text = (_Z = await tools.getEntryTextOnOff(item.text2, true)) != null ? _Z : "";
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
        message.text2 = (__ = await tools.getEntryTextOnOff(item.text, typeof pos1 === "boolean" ? pos1 : true)) != null ? __ : "";
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
          message.iconT2 = (_$ = await tools.getIconEntryValue(item.icon2, val != null ? val : true, "window-open")) != null ? _$ : "";
          message.iconT2Color = (_aa = await tools.getIconEntryColor(item.icon2, pos1, import_Color.Color.White)) != null ? _aa : "";
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
          message.iconM2 = (_ba = await tools.getIconEntryValue(item.icon3, val, "window-open")) != null ? _ba : "";
          message.iconM2Color = (_ca = await tools.getIconEntryColor(item.icon3, val, import_Color.Color.White)) != null ? _ca : "";
          message.iconM2Enable = "enable";
        }
        if (item.entity4) {
          let val = await tools.getValueEntryNumber(item.entity4);
          if (val === null || val === void 0) {
            val = await tools.getValueEntryBoolean(item.entity4);
          }
          message.iconB2 = (_da = await tools.getIconEntryValue(item.icon4, val, "window-open")) != null ? _da : "";
          message.iconB2Color = (_ea = await tools.getIconEntryColor(item.icon4, val, import_Color.Color.White)) != null ? _ea : "";
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
          let value = !item.setValue1 ? (_fa = item.entity1 && await tools.getValueEntryNumber(item.entity1)) != null ? _fa : null : (_ga = this.tempData && this.tempData.time) != null ? _ga : 0;
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
                  message.editable = ((_ia = (_ha = item.entity1) == null ? void 0 : _ha.set) == null ? void 0 : _ia.writeable) ? "1" : "0";
                  message.action1 = ((_ja = item.setValue2) == null ? void 0 : _ja.writeable) ? "begin" : "disable";
                  message.action3 = ((_la = (_ka = item.entity1) == null ? void 0 : _ka.set) == null ? void 0 : _la.writeable) ? "clear" : "disable";
                  message.text1 = this.library.getTranslation("continue");
                  message.text3 = this.library.getTranslation("clear");
                  break;
                }
                case 2: {
                  message.editable = "0";
                  message.action2 = ((_ma = item.setValue2) == null ? void 0 : _ma.writeable) ? "pause" : "disable";
                  message.action3 = ((_oa = (_na = item.entity1) == null ? void 0 : _na.set) == null ? void 0 : _oa.writeable) ? "clear" : "disable";
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
                  message.editable = ((_qa = (_pa = item.entity1) == null ? void 0 : _pa.set) == null ? void 0 : _qa.writeable) ? "1" : "0";
                  message.action1 = ((_ra = item.setValue2) == null ? void 0 : _ra.writeable) ? "begin" : "disable";
                  message.action3 = ((_ta = (_sa = item.entity1) == null ? void 0 : _sa.set) == null ? void 0 : _ta.writeable) ? "clear" : "disable";
                  message.text1 = this.library.getTranslation("start");
                  message.text3 = this.library.getTranslation("clear");
                  break;
                }
                case 2: {
                  message.editable = "0";
                  message.action2 = ((_ua = item.setValue2) == null ? void 0 : _ua.writeable) ? "pause" : "disable";
                  message.action3 = ((_wa = (_va = item.entity1) == null ? void 0 : _va.set) == null ? void 0 : _wa.writeable) ? "clear" : "disable";
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
            message[`tSlider${b}`] = this.library.getTranslation((_xa = await heading.getString()) != null ? _xa : "");
          }
          message[`tIconS${b}M`] = import_icon_mapping.Icons.GetIcon("minus-box");
          message[`tIconS${b}P`] = import_icon_mapping.Icons.GetIcon("plus-box");
          const minValue = item[`minValue${b}`];
          let min = 0;
          if (minValue) {
            min = (_ya = await minValue.getNumber()) != null ? _ya : 0;
          } else if (entity && entity.value && entity.value.common.min != void 0) {
            min = entity.value.common.min;
          }
          message[`hSlider${b}MinVal`] = String(min);
          const maxValue = item[`maxValue${b}`];
          let max = 100;
          if (maxValue) {
            max = (_za = await maxValue.getNumber()) != null ? _za : 100;
          } else if (entity && entity.value && entity.value.common.max != void 0) {
            max = entity.value.common.max;
          }
          message[`hSlider${b}MaxVal`] = String(max);
          v = v != null ? import_Color.Color.scale(v, 0, 100, min, max) : v;
          message[`hSlider${b}CurVal`] = String(v != null ? v : "");
          const steps = item[`steps${b}`];
          message[`hSlider${b}Step`] = "1";
          if (steps) {
            message[`hSlider${b}Step`] = String((_Aa = await steps.getNumber()) != null ? _Aa : "1");
          } else if (entity && entity.value && entity.value.common.step != void 0) {
            message[`hSlider${b}Step`] = String(entity.value.common.step);
          }
          const zero = item[`zero${b}`];
          if (zero) {
            message[`hSlider${b}ZeroVal`] = String((_Ba = await zero.getNumber()) != null ? _Ba : "");
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
    this.unload = true;
    if (this.parent.basePanel != null && this.parent.basePanel.persistentPageItems != null) {
      if (this.parent.basePanel.persistentPageItems[this.id]) {
        if (!this.parent.basePanel.unload) {
          return;
        }
        delete this.parent.basePanel.persistentPageItems[this.id];
      }
    }
    this.visibility = false;
    this.unload = true;
    await this.controller.statesControler.deactivateTrigger(this);
    await this.controller.statesControler.deletePageLoop();
    await super.delete();
  }
  async onCommandLongPress(action, value) {
    var _a;
    if (value === void 0 || this.dataItems === void 0) {
      return false;
    }
    const entry = this.dataItems;
    if (action.startsWith("mode-")) {
      action = "mode";
    }
    let done = false;
    switch (action) {
      case "button": {
        if (entry.type === "button" || entry.type === "switch") {
          this.log.debug(`Button ${this.id} was long pressed!`);
          const item = entry.data;
          const value2 = (_a = item.setNaviLongPress && await item.setNaviLongPress.getString()) != null ? _a : null;
          if (value2 !== null) {
            await this.parent.basePanel.navigation.setTargetPageByName(value2);
            done = true;
          }
        }
      }
    }
    return done;
  }
  async onCommand(action, value) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G;
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
          this.log.debug(`Button ${this.id} was pressed!`);
          if (this.parent.isScreensaver) {
            if (!this.parent.screensaverIndicatorButtons) {
              this.parent.basePanel.navigation.resetPosition();
              await this.parent.basePanel.navigation.setCurrentPage();
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
          if (entry.role === "repeatValue") {
            const v = await ((_b = (_a = entry.data.entity1) == null ? void 0 : _a.value) == null ? void 0 : _b.getString());
            if (v != null && ((_d = (_c = entry.data.entity1) == null ? void 0 : _c.set) == null ? void 0 : _d.writeable)) {
              await entry.data.entity1.set.setState(v);
            } else if (v != null && ((_f = (_e = entry.data.entity1) == null ? void 0 : _e.value) == null ? void 0 : _f.writeable)) {
              await entry.data.entity1.value.setState(v);
            }
            break;
          }
          if (entry.role === "SonosSpeaker") {
            if (!this.parent || !(((_g = this.parent.config) == null ? void 0 : _g.card) === "cardMedia")) {
              break;
            }
            if (this.parent.directChildPage) {
              this.log.debug(
                `Button with role:selectGrid id:${this.id} show Page:${this.parent.directChildPage.id}`
              );
              await this.parent.basePanel.setActivePage(this.parent.directChildPage);
            } else if (this.parent.config) {
              this.log.debug(`Create temp page for Button with role:selectGrid id:${this.id}`);
              const list = await ((_i = (_h = entry.data.entity3) == null ? void 0 : _h.value) == null ? void 0 : _i.getObject());
              const tempConfig = {
                id: `temp253451_${this.parent.id}`,
                name: `sub_${this.parent.name}`,
                adapter: this.adapter,
                panel: this.parent.basePanel,
                card: list == null || !Array.isArray(list) || list.length == 0 || list.length > 4 && list.length <= 6 || list.length > 8 && list.length <= 12 ? "cardGrid" : list.length <= 4 ? "cardGrid3" : "cardGrid2"
              };
              const pageConfig = {
                uniqueID: `temp253451_${this.parent.id}`,
                alwaysOn: this.parent.alwaysOn,
                items: void 0,
                dpInit: this.parent.config.ident,
                // important a string not regexp
                config: {
                  card: "cardGrid2",
                  cardRole: entry.role,
                  options: {
                    cardRoleList: list
                  },
                  data: {
                    headline: {
                      type: "const",
                      constVal: "speakerList"
                    }
                  }
                },
                pageItems: []
              };
              this.parent.directChildPage = this.parent.basePanel.newPage(tempConfig, pageConfig);
              if (this.parent.directChildPage) {
                this.parent.directChildPage.directParentPage = this.parent;
                await this.parent.directChildPage.init();
                await this.parent.basePanel.setActivePage(this.parent.directChildPage);
              }
            }
            break;
          }
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
            const test = (_j = item.popup.isActive && await item.popup.isActive.getBoolean()) != null ? _j : true;
            if (test && item.popup.getMessage && item.popup.setMessage) {
              const message = await item.popup.getMessage.getString();
              const headline = (_k = item.popup.getHeadline && await item.popup.getHeadline.getString()) != null ? _k : "";
              if (message) {
                await item.popup.setMessage.setState(
                  JSON.stringify({ headline, message })
                );
              }
            }
            break;
          }
          let value2 = (_l = item.setNavi && await item.setNavi.getString()) != null ? _l : null;
          let nav = false;
          if (value2 !== null) {
            await this.parent.basePanel.navigation.setTargetPageByName(value2);
            nav = true;
          }
          if (item.entity1 && item.entity1.set && item.entity1.set.writeable) {
            await item.entity1.set.setStateFlip();
            break;
          }
          if (item.setTrue && item.setFalse && item.setTrue.writeable && item.setFalse.writeable) {
            value2 = (_n = item.entity1 && await ((_m = item.entity1.value) == null ? void 0 : _m.getBoolean())) != null ? _n : false;
            if (value2) {
              await item.setFalse.setStateTrue();
            } else {
              await item.setTrue.setStateTrue();
            }
            break;
          }
          if (item.setValue1 && item.setValue1.writeable) {
            await item.setValue1.setStateFlip();
            break;
          }
          if (item.setValue2 && item.setValue2.writeable) {
            await item.setValue2.setStateTrue();
            break;
          }
          if (nav) {
            break;
          }
          if ((_p = (_o = item.entity1) == null ? void 0 : _o.value) == null ? void 0 : _p.writeable) {
            await item.entity1.value.setStateFlip();
            break;
          }
        } else if (entry.type === "light" || entry.type === "light2") {
          if (entry.role === "volume.mute") {
            const value2 = (_r = ((_q = entry.data.entity1) == null ? void 0 : _q.value) && await entry.data.entity1.value.getBoolean()) != null ? _r : null;
            if (value2) {
              await ((_s = entry.data.setValue2) == null ? void 0 : _s.setStateTrue());
            } else {
              await ((_t = entry.data.setValue1) == null ? void 0 : _t.setStateTrue());
            }
            break;
          }
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
          if ((_u = item.entity1) == null ? void 0 : _u.set) {
            await item.entity1.set.setStateFlip();
          } else if ((_w = (_v = item.entity1) == null ? void 0 : _v.value) == null ? void 0 : _w.writeable) {
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
          if (this.unload || this.adapter.unload) {
            break;
          }
          this.timeouts.brightnessSlider = this.adapter.setTimeout(
            async (item2, value2) => {
              var _a2, _b2, _c2, _d2;
              if (((_b2 = (_a2 = item2 == null ? void 0 : item2.dimmer) == null ? void 0 : _a2.value) == null ? void 0 : _b2.writeable) || ((_d2 = (_c2 = item2 == null ? void 0 : item2.dimmer) == null ? void 0 : _c2.set) == null ? void 0 : _d2.writeable)) {
                await tools.setScaledNumber(item2.dimmer, parseInt(value2));
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
            if (!Array.isArray(entity.set.options.role) && ((_x = entity.set.options.role) == null ? void 0 : _x.startsWith("button"))) {
              await entity.set.setStateTrue();
            } else if (!Array.isArray(entity.set.options.role) && ((_y = entity.set.options.role) == null ? void 0 : _y.startsWith("switch"))) {
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
          if (this.unload || this.adapter.unload) {
            break;
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
          if (entry.type === "light" && entry.role === "volume.mute") {
            if (value !== "1") {
              await ((_z = entry.data.setValue2) == null ? void 0 : _z.setStateTrue());
            } else {
              await ((_A = entry.data.setValue1) == null ? void 0 : _A.setStateTrue());
            }
            break;
          }
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
                if (import_Color.Color.isRGB(rgb) && ((_B = item == null ? void 0 : item.color) == null ? void 0 : _B.true) && item.color.true.options.role !== "level.color.rgb") {
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
                  min = (_C = await minValue.getNumber()) != null ? _C : 0;
                } else if (entity && entity.value && entity.value.common.min != void 0) {
                  min = entity.value.common.min;
                }
                const maxValue = item[`maxValue${b}`];
                let max = 100;
                if (maxValue) {
                  max = (_D = await maxValue.getNumber()) != null ? _D : 100;
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
        if (this.unload || this.adapter.unload) {
          break;
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
              ((_E = this.dataItems.data.entity1) == null ? void 0 : _E.set) && await this.dataItems.data.entity1.set.setState(r);
            }
            break;
          }
          case "ex-timer": {
            const t = value.split(":").reduce((p, c, i) => {
              return String(parseInt(p) + parseInt(c) * 60 ** (2 - i));
            });
            const r = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, parseInt(t), 0)).getTime();
            if (this.dataItems && this.dataItems.type == "timer" && this.dataItems.data) {
              ((_F = this.dataItems.data.entity1) == null ? void 0 : _F.set) && await this.dataItems.data.entity1.set.setState(r);
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
                ((_G = this.dataItems.data.entity1) == null ? void 0 : _G.set) && await this.dataItems.data.entity1.set.setState(r);
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
    if (from && this.parent.basePanel.isOnline && this.parent === this.parent.basePanel.screenSaver && this.parent.basePanel.screenSaver) {
      await this.parent.basePanel.screenSaver.onStateTrigger(id, from);
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
        if (((_b = this.parent.currentItem) == null ? void 0 : _b.ident) && await this.parent.isPlaying()) {
          await this.adapter.setForeignStateAsync(
            `${this.parent.currentItem.ident}.Commands.textCommand`,
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
      if (item.entityInSel) {
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
          if (item.entityInSel.set && item.entityInSel.set.writeable) {
            await item.entityInSel.set.setState(value);
          } else if (item.entityInSel.value && item.entityInSel.value.writeable) {
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
        const obj = await this.parent.basePanel.statesControler.getObjectAsync(list[v].id);
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
  async getListFromStates(entityInSel, valueList, role, valueList2 = void 0, force = false) {
    var _a, _b, _c, _d, _e, _f;
    const list = {};
    if (entityInSel && entityInSel.value) {
      if (role === "alexa-speaker") {
        if (entityInSel.value.options.dp) {
          list.list = [];
          list.states = [];
          for (const a in this.tempData) {
            list.list.push(this.tempData[a].name);
            list.states.push(this.tempData[a].name);
          }
          const dp = ((_a = this.parent.currentItem) == null ? void 0 : _a.ident) || ((_b = entityInSel == null ? void 0 : entityInSel.value) == null ? void 0 : _b.options.dp) || "";
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
                this.log.warn(
                  `Alexa playlist: no matching state for token "${stateToken}" source "${source.join(", ")}".`
                );
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
          const o = await entityInSel.value.getCommonStates(force);
          const v = await entityInSel.value.getString();
          const al = await (valueList == null ? void 0 : valueList.getObject());
          if (o) {
            list.list = [];
            list.states = [];
            list.value = "";
            for (const a in o) {
              const str = String(o[a]).replace(/\r?\n/g, "").trim();
              const allow = !Array.isArray(al) || al.length === 0 || al.includes(str);
              if (allow) {
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
            if (value && !Number.isNaN(value) && !list.value) {
              list.value = list.list[value - 1];
            }
          }
        }
      } else if (["string", "number"].indexOf((_e = entityInSel.value.type) != null ? _e : "") !== -1 && (await entityInSel.value.getCommonStates(force) || valueList2 != null)) {
        let states = null;
        const value = await tools.getValueEntryString(entityInSel);
        switch (role) {
          /*case 'spotify-tracklist': {
              if (valueList) {
                  const val = (await valueList.getObject()) as NSPanel.spotifyPlaylist | null;
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
          case "2valuesIsValue": {
            if (!valueList || !valueList2) {
              this.log.error("2values requires both valueList and valueList2!");
              states = [];
              break;
            }
            const filter = await valueList.getObject() || [];
            let fulllist = await valueList2.getObject() || [];
            const isStringArray = (x) => Array.isArray(x) && x.every((v) => typeof v === "string");
            if (!isStringArray(filter) || !isStringArray(fulllist)) {
              this.log.error("2values: valueList/valueList2 must be string[]!");
              states = [];
              break;
            }
            list.value = value != null ? value : "";
            if (filter.length > 0) {
              fulllist = fulllist.filter((v) => filter.includes(v));
            }
            states = fulllist;
            break;
          }
          default: {
            states = await entityInSel.value.getCommonStates(force);
          }
        }
        if (value !== null && states) {
          list.list = [];
          list.states = [];
          if (Array.isArray(states)) {
            for (let a = 0; a < states.length; a++) {
              list.list.push(this.library.getTranslation(String(states[a])));
              if (role === "2valuesIsValue") {
                list.states.push(String(states[a]));
              } else {
                list.states.push(String(a));
              }
            }
            if (!list.value && role !== "2valuesIsValue") {
              list.value = states[parseInt(value)] || void 0;
            }
          } else {
            for (const a in states) {
              list.list.push(this.library.getTranslation(String(states[a])));
              list.states.push(String(a));
              if (!list.value) {
                list.value = states[value];
              }
            }
          }
        }
      } else if (["string", "number"].indexOf((_f = entityInSel.value.type) != null ? _f : "") !== -1 && valueList) {
        list.list = [];
        list.states = [];
        const v = await (valueList == null ? void 0 : valueList.getObject());
        if (v && Array.isArray(v) && v.every((ve) => typeof ve === "string")) {
          const value = await tools.getValueEntryString(entityInSel);
          for (let a = 0; a < v.length; a++) {
            const arr = v[a].split("?");
            if (arr.length >= 2) {
              list.list.push(this.library.getTranslation(arr[0]));
              list.states.push(String(arr[1]));
              list.value = list.value || (v[a][1] === value ? v[a][0] : list.value);
            } else {
              list.list.push(this.library.getTranslation(v[a]));
              list.states.push(String(a));
            }
          }
        }
        list.value = await tools.getValueEntryString(entityInSel) || void 0;
      }
    } else {
      list.list = [];
      list.states = [];
      const v = await (valueList == null ? void 0 : valueList.getObject());
      if (v && Array.isArray(v) && v.every((ve) => typeof ve === "string")) {
        for (let a = 0; a < v.length; a++) {
          const arr = v[a].split("?");
          if (arr.length >= 2) {
            list.list.push(this.library.getTranslation(arr[0]));
            list.states.push(String(arr[1]));
          } else {
            list.list.push(this.library.getTranslation(v[a]));
            list.states.push(String(a));
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
