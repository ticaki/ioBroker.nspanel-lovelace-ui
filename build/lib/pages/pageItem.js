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
var tools = __toESM(require("../const/tools"));
var import_TpageItem = require("../templates/TpageItem");
var import_states_controller = require("../controller/states-controller");
class PageItem extends import_states_controller.BaseClassTriggerd {
  defaultOnColor = Color.White;
  defaultOffColor = Color.Blue;
  config;
  dataItems;
  panel;
  id;
  constructor(config, options) {
    super({ ...config });
    this.panel = config.panel;
    this.id = config.id;
    this.config = options;
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    if (this.dataItems && this.config) {
      const entry = this.dataItems;
      const message = {};
      const template = import_TpageItem.templatePageElements[this.config.type];
      message.intNameEntity = this.id;
      switch (entry.type) {
        case "light": {
          const item = entry.data;
          message.type = "light";
          const t = "item.role" in template && template[this.config.role];
          if (!t)
            break;
          const dimmer = t.data.dimmer ? item.dimmer && await item.dimmer.getNumber() : null;
          const rgb = t.data.RGB3 ? (_b = (_a = await tools.getDecfromRGBThree(item)) != null ? _a : item.color && await tools.getEntryColor(item.color, true, Color.White)) != null ? _b : null : null;
          const hue = t.data.hue && item.hue ? Color.hsvtodec(await item.hue.getNumber(), 1, 1) : null;
          let v = (_c = !!t.data.entity1 && await tools.getValueEntryBoolean(item.entity1)) != null ? _c : true;
          if (t.data.entity1 === "invert")
            v = !v;
          message.icon = t.data.icon && item.icon ? await tools.getIconEntryValue(
            item.icon,
            v,
            t.data.icon.true.value,
            t.data.icon.false.value
          ) : "";
          if (v) {
            message.optionalValue = "1";
            message.iconColor = (_e = (_d = hue != null ? hue : rgb) != null ? _d : item.icon && await tools.GetIconColor(item.icon, dimmer != null ? dimmer : 100)) != null ? _e : "";
          } else {
            message.optionalValue = "0";
            message.iconColor = (_f = item.icon && await tools.GetIconColor(item.icon, false)) != null ? _f : "";
          }
          message.displayName = t.data.text1 ? ((_g = await tools.getEntryTextOnOff(item.text, v)) != null ? _g : v) ? t.data.text1.true : t.data.text1.false : message.displayName;
          return tools.getItemMesssage(message);
          break;
        }
        case "button": {
          const item = entry.data;
          if (item.entity1 && item.entity1.value) {
            message.optionalValue = !!(item.setValue1 && await item.setValue1.getBoolean()) ? "0" : "1";
            message.displayName = (_h = await tools.getEntryTextOnOff(item.text, message.optionalValue === "1")) != null ? _h : "test1";
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
          const value = (_i = await tools.getValueEntryNumber(item.entity1)) != null ? _i : await tools.getValueEntryBoolean(item.entity1);
          message.icon = await tools.getIconEntryValue(item.icon, !!(value != null ? value : true), "gesture-tap-button");
          message.iconColor = (_j = await tools.GetIconColor(
            item.icon,
            value != null ? value : true,
            Color.HMIOn,
            Color.HMIOff,
            true,
            true,
            0,
            100
          )) != null ? _j : Color.HMIOn;
          message.optionalValue = (_k = await tools.getEntryTextOnOff(item.text, !!value)) != null ? _k : "PRESS";
          this.log.debug(JSON.stringify(message));
          return tools.getItemMesssage(message);
          break;
        }
      }
    }
    return "~~~~~";
  }
  getDetailPayload(message) {
    if (!message.type)
      return "";
    switch (message.type) {
      case "2Sliders": {
        let result = {
          type: "2Sliders",
          icon: void 0,
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
          "",
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
          headline: "",
          list: ""
        };
        result = Object.assign(result, message);
        return tools.getPayload(
          "entityUpdateDetail2",
          result.entityName,
          "",
          result.textColor,
          result.type,
          result.headline,
          result.list
        );
        break;
      }
      case "popupThermo": {
        let result = {
          type: "popupThermo",
          entityName: "",
          headline: "",
          value: "",
          list: ""
        };
        result = Object.assign(result, message);
        return tools.getPayload(result.headline, result.entityName, result.value, result.list);
        break;
      }
    }
    return "";
  }
  async GenerateDetailPage(mode) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    if (!this.config || !this.dataItems)
      return null;
    const entry = this.dataItems;
    const message = {};
    message.entityName = this.id;
    switch (mode) {
      case "popupFan":
      case "popupThermo": {
        if (entry.type !== "input_sel")
          break;
        const item = entry.data;
        message.type = "popupThermo";
        if (message.type !== "popupThermo")
          return null;
        if (item.entity1 && item.entity1.value && ["string", "number"].indexOf((_a = item.entity1.value.trueType()) != null ? _a : "") && item.entity1.value.getCommonStates()) {
          const states = item.entity1.value.getCommonStates();
          const value = await tools.getValueEntryString(item.entity1);
          if (value !== null && states && states[value] !== void 0) {
            message.headline = this.library.getTranslation(
              (_b = item.headline && await item.headline.getString()) != null ? _b : ""
            );
            const list2 = [];
            for (const a in states) {
              list2.push(this.library.getTranslation(String(states[a])));
            }
            if (list2.length > 0) {
              message.list = Array.isArray(list2) ? list2.map((a) => tools.formatInSelText(a)).join("?") : "";
              break;
            }
          }
        }
        message.value = (_c = await tools.getValueEntryString(item.entity1)) != null ? _c : "";
        message.headline = this.library.getTranslation(
          (_d = item.headline && await item.headline.getString()) != null ? _d : ""
        );
        let list = (_f = (_e = item.valueList && await item.valueList.getObject()) != null ? _e : item.valueList && await item.valueList.getString()) != null ? _f : [
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
        break;
      }
      case "popupInSel": {
        if (entry.type !== "input_sel")
          break;
        const item = entry.data;
        message.type = "insel";
        if (message.type !== "insel")
          return null;
        if (item.entity1 && item.entity1.value && ["string", "number"].indexOf((_g = item.entity1.value.trueType()) != null ? _g : "") && item.entity1.value.getCommonStates()) {
          const states = item.entity1.value.getCommonStates();
          const value2 = await tools.getValueEntryString(item.entity1);
          if (value2 !== null && states && states[value2] !== void 0) {
            message.textColor = await tools.getEntryColor(item.color, !!value2, Color.White);
            message.headline = this.library.getTranslation(
              (_h = item.headline && await item.headline.getString()) != null ? _h : ""
            );
            const list2 = [];
            for (const a in states) {
              list2.push(this.library.getTranslation(String(states[a])));
            }
            if (list2.length > 0) {
              message.list = Array.isArray(list2) ? list2.map((a) => tools.formatInSelText(a)).join("?") : "";
              break;
            }
          }
        }
        const value = (_i = await tools.getValueEntryBoolean(item.entity1)) != null ? _i : true;
        message.textColor = await tools.getEntryColor(item.color, value, Color.White);
        message.headline = this.library.getTranslation(
          (_j = item.headline && await item.headline.getString()) != null ? _j : ""
        );
        let list = (_l = (_k = item.valueList && await item.valueList.getObject()) != null ? _k : item.valueList && await item.valueList.getString()) != null ? _l : [
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
        break;
      }
    }
    return this.getDetailPayload(message);
    return null;
  }
  async delete() {
    super.delete();
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
          if (item.entity1 && item.entity1.value && ["string", "number"].indexOf((_a = item.entity1.value.trueType()) != null ? _a : "") && item.entity1.value.getCommonStates() && !item.setList) {
            const states = item.entity1.value.getCommonStates();
            if (value !== null && states !== void 0) {
              const list2 = [];
              for (const a in states) {
                list2.push(this.library.getTranslation(String(a)));
              }
              if (list2[parseInt(value)] !== void 0) {
                await item.entity1.value.setStateAsync(list2[parseInt(value)]);
                break;
              }
            }
          }
          if (!item.setList)
            return;
          let list = await item.setList.getObject();
          if (list === null) {
            list = await item.setList.getString();
            list = list.split("|").map((a) => {
              const t = a.split("?");
              return { id: t[0], value: t[1] };
            });
          }
          if (list[value]) {
            try {
              const obj = await this.adapter.getForeignObjectAsync(list[value].id);
              if (!obj || !obj.common || obj.type !== "state")
                throw new Error("Dont get obj!");
              const type = obj.common.type;
              const newValue = this.adapter.library.convertToType(list[value].value, type);
              if (newValue !== null) {
                await this.adapter.setForeignStateAsync(
                  list[value].id,
                  newValue,
                  list[value].id.startsWith(this.adapter.namespace)
                );
                this.log.debug(`------------Set dp ${list[value].id} to ${String(newValue)}!`);
              } else {
                this.log.error(`Try to set a null value to ${list[value].id}!`);
              }
            } catch (e) {
              this.log.error(`Id ${list[value].id} is not valid!`);
            }
          } else {
          }
        }
        break;
      case "button": {
        if (entry.type !== "button")
          break;
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
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageItem
});
//# sourceMappingURL=pageItem.js.map
