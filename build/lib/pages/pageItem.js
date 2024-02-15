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
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var pageItem_exports = {};
__export(pageItem_exports, {
  PageItem: () => PageItem
});
module.exports = __toCommonJS(pageItem_exports);
var Color = __toESM(require("../const/Color"));
var import_type_pageItem = require("../types/type-pageItem");
var tools = __toESM(require("../const/tools"));
var import_states_controller = require("../controller/states-controller");
var import_icon_mapping = require("../const/icon_mapping");
class PageItem extends import_states_controller.BaseClassTriggerd {
  defaultOnColor = Color.White;
  defaultOffColor = Color.Blue;
  config;
  dataItems;
  panel;
  id;
  lastPopupType = void 0;
  parent;
  constructor(config, options) {
    super({ ...config });
    this.panel = config.panel;
    this.id = config.id;
    this.config = options;
    this.parent = options && config.parent;
  }
  async init() {
    if (!this.config)
      return;
    const config = { ...this.config };
    const tempConfig = this.config.initMode === "auto" && this.config.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.config.dpInit, config.data) : config.data;
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.dataItems = { ...config, data: tempItem };
  }
  async getPageItemPayload() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
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
          message.type = "light";
          const v = await tools.getValueEntryBoolean(item.entity1);
          const dimmer = (_a = item.dimmer && item.dimmer.value && await item.dimmer.value.getNumber()) != null ? _a : null;
          let rgb = (_c = (_b = await tools.getRGBfromRGBThree(item)) != null ? _b : item.color && item.color.true && await item.color.true.getRGBValue()) != null ? _c : null;
          const nhue = (_d = item.hue && await item.hue.getNumber()) != null ? _d : null;
          if (rgb === null && nhue)
            rgb = (_e = Color.hsv2RGB(nhue, 1, 1)) != null ? _e : null;
          message.icon = await tools.getIconEntryValue(item.icon, v, "", "");
          message.iconColor = (_g = (_f = rgb && await tools.GetIconColor(rgb, dimmer !== null ? dimmer > 20 ? dimmer : 20 : v)) != null ? _f : await tools.GetIconColor(item.icon, dimmer !== null ? dimmer > 20 ? dimmer : 20 : v)) != null ? _g : "";
          if (v) {
            message.optionalValue = "1";
          } else {
            message.optionalValue = "0";
          }
          message.displayName = (_h = await tools.getEntryTextOnOff(item.text1, v)) != null ? _h : message.displayName;
          return tools.getItemMesssage(message);
          break;
        }
        case "shutter": {
          const item = entry.data;
          message.type = "shutter";
          const value = await tools.getValueEntryNumber(item.entity1);
          if (value === null) {
            this.log.warn(`Entity ${this.config.role} has no value!`);
            break;
          }
          message.icon = await tools.getIconEntryValue(item.icon, value < 40, "window-open");
          message.iconColor = await tools.getIconEntryColor(item.icon, value < 40, Color.White);
          const optionalValue = item.valueList ? await item.valueList.getObject() : [
            import_icon_mapping.Icons.GetIcon("arrow-up"),
            import_icon_mapping.Icons.GetIcon("stop"),
            import_icon_mapping.Icons.GetIcon("arrow-down"),
            "enable",
            "enable",
            "enable"
          ];
          let optionalValueC = Array.isArray(optionalValue) && optionalValue.every((a) => typeof a === "string") ? [...optionalValue] : ["", "", ""];
          optionalValueC = optionalValueC.splice(0, 3);
          optionalValueC.forEach((a, i) => {
            if (a)
              optionalValueC[i + 3] = "enable";
            else {
              optionalValueC[i] = "";
              optionalValueC[i + 3] = "disable";
            }
          });
          message.optionalValue = optionalValueC.join("|");
          message.displayName = (_i = item.headline && await item.headline.getString()) != null ? _i : "";
          message.displayName = this.library.getTranslation(message.displayName);
          return tools.getItemMesssage(message);
          break;
        }
        case "button": {
          const item = entry.data;
          if (item.entity1 && item.entity1.value) {
            message.optionalValue = !!(item.setValue1 && await item.setValue1.getBoolean()) ? "0" : "1";
            message.displayName = (_j = await tools.getEntryTextOnOff(item.text, message.optionalValue === "1")) != null ? _j : "test1";
            message.icon = await tools.getIconEntryValue(
              item.icon,
              message.optionalValue === "1",
              "home",
              "account"
            );
            message.iconColor = await tools.GetIconColor(item.icon, message.optionalValue === "1");
            return tools.getPayload(
              "button",
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
          const value = (_k = await tools.getValueEntryNumber(item.entityInSel)) != null ? _k : await tools.getValueEntryBoolean(item.entityInSel);
          message.icon = await tools.getIconEntryValue(item.icon, !!(value != null ? value : true), "gesture-tap-button");
          message.iconColor = (_l = await tools.GetIconColor(item.icon, value != null ? value : true, 0, 100, Color.HMIOff)) != null ? _l : Color.HMIOn;
          message.optionalValue = (_m = await tools.getEntryTextOnOff(item.text, !!value)) != null ? _m : "PRESS";
          this.log.debug(JSON.stringify(message));
          return tools.getItemMesssage(message);
          break;
        }
      }
    }
    return "~~~~~";
  }
  getDetailPayload(message) {
    var _a;
    this.triggerParent = false;
    if (!message.type)
      return "";
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
          textColor: String(Color.rgb_dec565(Color.White)),
          currentState: "",
          list: ""
        };
        result = Object.assign(result, message);
        return tools.getPayload(
          "entityUpdateDetail2",
          result.entityName,
          "",
          result.textColor,
          result.type,
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
          pos2: ""
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    if (!this.config || !this.dataItems)
      return null;
    const entry = this.dataItems;
    let message = {};
    message.entityName = this.id;
    this.visibility = true;
    this.lastPopupType = mode;
    switch (mode) {
      case "popupLight": {
        switch (this.config.role) {
          case "light":
          case "socket":
          case "dimmer":
          case "hue":
          case "ct":
          case "rgbSingle":
          case "rgb":
          default: {
            message.type = "2Sliders";
            if (message.type !== "2Sliders" || entry.type !== "light")
              return null;
            const item = entry.data;
            message.buttonState = (_a = await tools.getValueEntryBoolean(item.entity1)) != null ? _a : "disable";
            const dimmer = item.dimmer && item.dimmer.value && await item.dimmer.value.getNumber();
            if (dimmer != null && item.dimmer) {
              item.dimmer.minScale;
              if (item.dimmer.minScale != void 0 && item.dimmer.maxScale) {
                message.slider1Pos = Math.trunc(
                  Color.scale(
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
            message.slidersColor = (_b = await tools.getIconEntryColor(item.icon, false, Color.White)) != null ? _b : "disable";
            let rgb = null;
            switch (this.config.role) {
              case "socket":
              case "light":
              case "dimmer":
              case "ct":
                break;
              case "hue": {
                const nhue = (_c = item.hue && await item.hue.getNumber()) != null ? _c : null;
                if (nhue)
                  rgb = (_d = Color.hsv2RGB(nhue, 1, 1)) != null ? _d : null;
                break;
              }
              case "rgbSingle": {
                rgb = (_e = await tools.getRGBfromRGBThree(item)) != null ? _e : null;
                break;
              }
              case "rgb": {
                rgb = (_f = item.color && item.color.true && await item.color.true.getRGBValue()) != null ? _f : null;
                break;
              }
            }
            if (rgb !== null) {
              message.hueMode = true;
              message.slidersColor = await tools.GetIconColor(
                rgb,
                message.slider1Pos !== "disable" && message.slider1Pos !== void 0 ? message.slider1Pos > 20 ? message.slider1Pos : 20 : message.buttonState !== "disable" && message.buttonState !== false
              );
            }
            message.slider2Pos = "disable";
            if (item.ct && item.ct.value) {
              const ct = await tools.getScaledNumber(item.ct);
              if (ct) {
                message.slider2Pos = Math.trunc(ct);
              }
            }
            message.popup = message.slider2Pos !== "disable" && rgb !== null;
            message.slider1Translation = (_g = item.text1 && item.text1.true && await item.text1.true.getString()) != null ? _g : void 0;
            message.slider2Translation = (_h = item.text2 && item.text2.true && await item.text2.true.getString()) != null ? _h : void 0;
            message.hue_translation = (_i = item.text3 && item.text3.true && await item.text3.true.getString()) != null ? _i : void 0;
            if (message.slider1Translation !== void 0)
              message.slider1Translation = this.library.getTranslation(message.slider1Translation);
            if (message.slider2Translation !== void 0)
              message.slider2Translation = this.library.getTranslation(message.slider2Translation);
            if (message.hue_translation !== void 0)
              message.hue_translation = this.library.getTranslation(message.hue_translation);
            break;
          }
        }
        break;
      }
      case "popupFan":
      case "popupThermo":
      case "popupInSel": {
        if (entry.type !== "input_sel" && entry.type !== "light")
          break;
        const item = entry.data;
        message.type = "insel";
        if (!(message.type === "insel"))
          return null;
        if (item.entityInSel && item.entityInSel.value && ["string", "number"].indexOf((_j = item.entityInSel.value.trueType()) != null ? _j : "") && item.entityInSel.value.getCommonStates()) {
          const states = item.entityInSel.value.getCommonStates();
          const value2 = await tools.getValueEntryString(item.entityInSel);
          if (value2 !== null && states && states[value2] !== void 0) {
            message.textColor = await tools.getEntryColor(item.color, !!value2, Color.White);
            const list2 = [];
            for (const a in states) {
              list2.push(this.library.getTranslation(String(states[a])));
            }
            if (list2.length > 0) {
              message.list = Array.isArray(list2) ? list2.map((a) => tools.formatInSelText(a)).join("?") : "";
              message.currentState = tools.formatInSelText(this.library.getTranslation(states[value2]));
              if (mode !== "popupThermo")
                break;
              message = { ...message, type: "popupThermo" };
              if (message.type === "popupThermo") {
                message.headline = this.library.getTranslation(
                  (_k = item.headline && await item.headline.getString()) != null ? _k : ""
                );
              }
              break;
            }
          }
        }
        const value = (_l = await tools.getValueEntryBoolean(item.entityInSel)) != null ? _l : true;
        message.textColor = await tools.getEntryColor(item.color, value, Color.White);
        message.currentState = this.library.getTranslation(
          (_m = item.headline && await item.headline.getString()) != null ? _m : ""
        );
        let list = (_o = (_n = item.valueList && await item.valueList.getObject()) != null ? _n : item.valueList && await item.valueList.getString()) != null ? _o : [
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
          if (typeof list === "string")
            list = list.split("?");
        } else
          list = [];
        message.list = Array.isArray(list) ? list.map((a) => tools.formatInSelText(a)).join("?") : "";
        if (mode !== "popupThermo")
          break;
        message = { ...message, type: "popupThermo" };
        if (message.type === "popupThermo") {
          message.headline = this.library.getTranslation(
            (_p = item.headline && await item.headline.getString()) != null ? _p : ""
          );
        }
        break;
      }
      case "popupLightNew":
      case "popupNotify":
      case "popupShutter": {
        if (entry.type !== "shutter")
          break;
        const item = entry.data;
        message.type = "popupShutter";
        if (!(message.type === "popupShutter"))
          return null;
        message.text2 = (_q = item.text && item.text.true && await item.text.true.getString()) != null ? _q : "";
        message.text2 = this.library.getTranslation(message.text2);
        const pos1 = (_r = await tools.getValueEntryNumber(item.entity1)) != null ? _r : void 0;
        const pos2 = (_s = await tools.getValueEntryNumber(item.entity2)) != null ? _s : void 0;
        if (pos1 !== void 0)
          message.icon = (_t = await tools.getIconEntryValue(item.icon, pos1 < 40, "")) != null ? _t : "";
        else if (pos2 !== void 0)
          message.icon = (_u = await tools.getIconEntryValue(item.icon, pos2 < 40, "")) != null ? _u : "";
        const optionalValue = item.valueList ? await item.valueList.getObject() : [
          import_icon_mapping.Icons.GetIcon("arrow-up"),
          import_icon_mapping.Icons.GetIcon("stop"),
          import_icon_mapping.Icons.GetIcon("arrow-down"),
          import_icon_mapping.Icons.GetIcon("arrow-up"),
          import_icon_mapping.Icons.GetIcon("stop"),
          import_icon_mapping.Icons.GetIcon("arrow-down")
        ];
        const arr = [pos1, pos2];
        for (let index = 0; index < arr.length; index++) {
          const pos = arr[index];
          if (pos == void 0)
            continue;
          const i = index * 3;
          let optionalValueC = Array.isArray(optionalValue) && optionalValue.every((a) => typeof a === "string") ? [...optionalValue] : ["", "", ""];
          optionalValueC = optionalValueC.splice(i, 3);
          optionalValueC.forEach((a, i2) => {
            if (a)
              optionalValueC[i2 + 3] = "enable";
            else {
              optionalValueC[i2] = "";
              optionalValueC[i2 + 3] = "disable";
            }
          });
          if (index === 0) {
            message.pos1 = String(pos);
            message.pos1text = (_v = await tools.getEntryTextOnOff(item.text1, true)) != null ? _v : "";
            message.pos1text = this.library.getTranslation(message.pos1text);
            message.iconL1 = optionalValueC[0];
            message.iconM1 = optionalValueC[1];
            message.iconR1 = optionalValueC[2];
            message.statusL1 = optionalValueC[3];
            message.statusM1 = optionalValueC[4];
            message.statusR1 = optionalValueC[5];
          } else {
            message.pos2 = String(pos);
            message.pos2text = (_w = await tools.getEntryTextOnOff(item.text2, true)) != null ? _w : "";
            message.pos2text = this.library.getTranslation(message.pos2text);
            message.iconL2 = optionalValueC[0];
            message.iconM2 = optionalValueC[1];
            message.iconR2 = optionalValueC[2];
            message.statusL2 = optionalValueC[3];
            message.statusM2 = optionalValueC[4];
            message.statusR2 = optionalValueC[5];
          }
        }
      }
      case "popupTimer":
    }
    return this.getDetailPayload(message);
    return null;
  }
  async delete() {
    this.visibility = false;
    await this.controller.statesControler.deactivateTrigger(this);
    await super.delete();
    this.parent = void 0;
  }
  async onCommand(action, value) {
    var _a, _b, _c;
    if (value === void 0 || this.dataItems === void 0)
      return;
    const entry = this.dataItems;
    switch (action) {
      case "mode-insel":
        {
          if (entry.type !== "input_sel")
            break;
          const item = entry.data;
          if (item.entityInSel && item.entityInSel.value && ["string", "number"].indexOf((_a = item.entityInSel.value.trueType()) != null ? _a : "") && item.entityInSel.value.getCommonStates() && !item.setList) {
            const states = item.entityInSel.value.getCommonStates();
            if (value !== null && states !== void 0) {
              const list2 = [];
              for (const a in states) {
                list2.push(String(a));
              }
              if (list2[parseInt(value)] !== void 0) {
                await item.entityInSel.value.setStateAsync(list2[parseInt(value)]);
                break;
              }
            }
          }
          if (!item.setList)
            return;
          const list = await this.getListCommands(item.setList);
          const v = value;
          if (list && list[v]) {
            try {
              const obj = await this.adapter.getForeignObjectAsync(list[v].id);
              if (!obj || !obj.common || obj.type !== "state")
                throw new Error("Dont get obj!");
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
                        return;
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
                this.log.debug(`------------Set dp ${list[v].id} to ${String(newValue)}!`);
              } else {
                this.log.error(`Try to set a null value to ${list[v].id}!`);
              }
            } catch (e) {
              this.log.error(`Id ${list[v].id} is not valid!`);
            }
          } else {
          }
        }
        break;
      case "button": {
        if (entry.type === "button") {
          const item = entry.data;
          let value2 = (_b = item.setNavi && await item.setNavi.getString()) != null ? _b : null;
          if (value2 !== null) {
            this.panel.navigation.setTargetPageByName(value2);
            break;
          }
          value2 = (_c = item.setValue1 && await item.setValue1.getBoolean()) != null ? _c : null;
          if (value2 !== null) {
            await item.setValue1.setStateFlip();
          }
          if (this.config && this.parent && this.config.role == "arrow") {
          }
        } else if (entry.type === "light") {
          const item = entry.data;
          item.entity1 && item.entity1.value && await item.entity1.value.setStateFlip();
        }
        break;
      }
      case "brightnessSlider": {
        if (entry.type === "light") {
          const item = entry.data;
          if (item && item.dimmer && item.dimmer.value && item.dimmer.value.writeable) {
            const dimmer = await tools.getScaledNumber(item.dimmer);
            if (dimmer !== null && String(dimmer) != value)
              await tools.setScaledNumber(item.dimmer, parseInt(value));
          } else {
            this.log.warn("Dimmer is not writeable!");
          }
        }
        break;
      }
      case "OnOff": {
        if (entry.type === "light") {
          const item = entry.data;
          if (item && item.entity1 && item.entity1.value && item.entity1.value.writeable) {
            await item.entity1.value.setStateAsync(value === "1");
          } else {
            this.log.warn("entity1 is not writeable!");
          }
        }
        break;
      }
      case "colorWheel": {
        if (entry.type === "light") {
          const item = entry.data;
          if (item && this.config && item.entity1 && item.entity1.value && item.entity1.value.writeable) {
            switch (this.config.role) {
              case "socket":
              case "light":
              case "dimmer":
              case "ct":
                break;
              case "hue":
                await tools.setHuefromRGB(item, Color.resultToRgb(value));
                break;
              case "rgbSingle": {
                const rgb = Color.resultToRgb(value);
                await tools.setRGBThreefromRGB(item, rgb);
                break;
              }
              case "rgb": {
                const rgb = Color.resultToRgb(value);
                if (Color.isRGB(rgb)) {
                  item.color && item.color.true && await item.color.true.setStateAsync(JSON.stringify(rgb));
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
      case "up":
      case "stop":
      case "down": {
        if (entry.type === "shutter") {
          const items = entry.data;
          const list = await this.getListCommands(items.setList);
          if (list !== null && list.length > 2) {
            switch (action) {
              case "up": {
                await this.adapter.setStateAsync(list[0].id, parseInt(list[0].value));
                break;
              }
              case "stop": {
                await this.adapter.setStateAsync(list[1].id, parseInt(list[1].value));
                break;
              }
              case "down": {
                await this.adapter.setStateAsync(list[2].id, parseInt(list[2].value));
                break;
              }
            }
          } else {
            if (items.entity1 && items.entity1.value && items.entity1.minScale && items.entity1.maxScale) {
              if (items.entity1.value.type === "number") {
                switch (action) {
                  case "up": {
                    const value2 = await items.entity1.maxScale.getNumber();
                    if (value2 !== null)
                      await items.entity1.value.setStateAsync(value2);
                    break;
                  }
                  case "stop": {
                    const value2 = await tools.getValueEntryNumber(items.entity1);
                    if (value2 !== null)
                      await tools.setValueEntryNumber(items.entity1, value2);
                    break;
                  }
                  case "down": {
                    const value2 = await items.entity1.minScale.getNumber();
                    if (value2 !== null)
                      await items.entity1.value.setStateAsync(value2);
                    break;
                  }
                }
              } else if (items.entity1.value.type === "boolean") {
                if (action !== "stop")
                  await items.entity1.value.setStateFlip();
              }
            }
          }
        }
        break;
      }
      case "positionSlider": {
        if (entry.type === "shutter") {
          const items = entry.data;
          await tools.setValueEntryNumber(items.entity1, parseInt(value));
        }
        break;
      }
      case "tiltSlider": {
        if (entry.type === "shutter") {
          const items = entry.data;
          await tools.setValueEntryNumber(items.entity2, parseInt(value));
        }
        break;
      }
    }
  }
  async onStateTrigger() {
    if (this.lastPopupType) {
      if (this.lastPopupType === "popupThermo") {
        this.log.debug(`Trigger from popupThermo `);
        this.parent && this.parent.onPopupRequest("0", "popupThermo", "", "");
      } else {
        const msg = await this.GeneratePopup(this.lastPopupType);
        if (msg)
          this.sendToPanel(msg);
      }
    }
  }
  async getListCommands(setList) {
    if (!setList)
      return null;
    let list = await setList.getObject();
    if (list === null) {
      const temp = await setList.getString();
      if (temp === null)
        return null;
      list = temp.split("|").map((a) => {
        const t = a.split("?");
        return (0, import_type_pageItem.islistCommandUnion)(t[2]) ? { id: t[0], value: t[1], command: t[2] } : { id: t[0], value: t[1] };
      });
    }
    return list;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageItem
});
//# sourceMappingURL=pageItem.js.map
