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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
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
        case "button": {
          const item = entry.data;
          if (item.entity1 && item.entity1.value) {
            message.optionalValue = !!(item.setValue1 && await item.setValue1.getBoolean()) ? "0" : "1";
            message.displayName = (_i = await tools.getEntryTextOnOff(item.text, message.optionalValue === "1")) != null ? _i : "test1";
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
          const value = (_j = await tools.getValueEntryNumber(item.entityInSel)) != null ? _j : await tools.getValueEntryBoolean(item.entityInSel);
          message.icon = await tools.getIconEntryValue(item.icon, !!(value != null ? value : true), "gesture-tap-button");
          message.iconColor = (_k = await tools.GetIconColor(item.icon, value != null ? value : true, 0, 100, Color.HMIOff)) != null ? _k : Color.HMIOn;
          message.optionalValue = (_l = await tools.getEntryTextOnOff(item.text, !!value)) != null ? _l : "PRESS";
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
    }
    return "";
  }
  async GenerateDetailPage(mode) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
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
  async setPopupAction(action, value) {
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
          let list = await item.setList.getObject();
          if (list === null) {
            const temp = await item.setList.getString();
            if (temp === null)
              return;
            list = temp.split("|").map((a) => {
              const t = a.split("?");
              return (0, import_type_pageItem.islistCommandUnion)(t[2]) ? { id: t[0], value: t[1], command: t[2] } : { id: t[0], value: t[1] };
            });
          }
          const v = parseInt(value);
          if (list[v]) {
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
    }
  }
  async onStateTrigger() {
    if (this.lastPopupType) {
      if (this.lastPopupType === "popupThermo") {
        this.log.debug(`Trigger from popupThermo `);
        this.parent && this.parent.onPopupRequest("0", "popupThermo", "", "");
      } else {
        const msg = await this.GenerateDetailPage(this.lastPopupType);
        if (msg)
          this.sendToPanel(msg);
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageItem
});
//# sourceMappingURL=pageItem.js.map
