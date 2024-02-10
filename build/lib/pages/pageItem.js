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
var import_icon_mapping = require("../const/icon_mapping");
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
    this.dataItems = tempItem;
  }
  async getPageItemPayload() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    if (this.dataItems && this.config) {
      const item = this.dataItems;
      const message = {};
      const template = import_TpageItem.templatePageElements[this.config.type];
      message.displayName = (_a = item.headline && await item.headline.getString()) != null ? _a : "";
      message.intNameEntity = this.id;
      switch (this.config.type) {
        case "light": {
          message.type = "light";
          const t = "item.role" in template && template[this.config.role];
          if (!t)
            break;
          const dimmer = t.data.dimmer ? item.dimmer && await item.dimmer.getNumber() : null;
          const rgb = t.data.RGB3 ? (_b = await tools.getDecfromRGBThree(item)) != null ? _b : await tools.getEntryColor(item.color, true, Color.White) : null;
          const hue = t.data.hue && item.hue ? Color.hsvtodec(await item.hue.getNumber(), 1, 1) : null;
          let v = (_c = !!t.data.entity1 && await tools.getValueEntryBoolean(item.entity1)) != null ? _c : true;
          if (t.data.entity1 === "invert")
            v = !v;
          message.icon = t.data.icon ? await tools.getIconEntryValue(item.icon, v, t.data.icon.true.value, t.data.icon.false.value) : "";
          if (v) {
            message.optionalValue = "1";
            message.iconColor = (_d = hue != null ? hue : rgb) != null ? _d : await tools.GetIconColor(item.icon, dimmer != null ? dimmer : 100);
          } else {
            message.optionalValue = "0";
            message.iconColor = await tools.GetIconColor(item.icon, false);
          }
          message.displayName = t.data.text1 ? ((_e = await tools.getEntryTextOnOff(item.text, v)) != null ? _e : v) ? t.data.text1.true : t.data.text1.false : message.displayName;
          return tools.getItemMesssage(message);
          break;
        }
        case "shutter": {
          message.type = "shutter";
          const t = "item.role" in template && template[this.config.role];
          if (!t)
            break;
          let value = await tools.getValueEntryNumber(item.entity1);
          if (value === null) {
            this.log.warn(`Entity ${this.config.role} has no value!`);
            break;
          }
          if (t.data.entity1 === "invert")
            value = 100 - value;
          message.icon = await tools.getIconEntryValue(item.icon, value < 5, "window-open");
          message.icon = t.data.icon ? await tools.getIconEntryValue(
            item.icon,
            value < 5,
            t.data.icon.true.value,
            t.data.icon.false.value
          ) : "";
          const optionalValue = t.data.optionalData === true ? [
            import_icon_mapping.Icons.GetIcon("arrow-up"),
            import_icon_mapping.Icons.GetIcon("stop"),
            import_icon_mapping.Icons.GetIcon("arrow-down"),
            "enable",
            "enable",
            "enable"
          ] : t.data.optionalData === void 0 ? ["", "", "", "disable", "disable", "disable"] : t.data.optionalData === "state" && item.valueList ? await item.valueList.getObject() : [
            import_icon_mapping.Icons.GetIcon(t.data.optionalData[0]),
            import_icon_mapping.Icons.GetIcon(t.data.optionalData[1]),
            import_icon_mapping.Icons.GetIcon(t.data.optionalData[2]),
            t.data.optionalData[3],
            t.data.optionalData[4],
            t.data.optionalData[5]
          ];
          const optionalValueC = Array.isArray(optionalValue) && optionalValue.every((a) => typeof a === "string") ? optionalValue : ["", "", "", "disable", "disable", "disable"];
          message.optionalValue = optionalValueC.join("|");
          message.displayName = (_f = t.data.text && (await tools.getEntryTextOnOff(item.text, true) || t.data.text.true)) != null ? _f : message.displayName;
          return tools.getItemMesssage(message);
          break;
        }
        case "text": {
          message.type = "text";
          const t = this.config.role in template && template[this.config.role];
          if (!t)
            break;
          let value = t.data.entity1 ? await tools.getValueEntryBoolean(item.entity1) : null;
          if (value !== null) {
            if (t.data.entity1 === "invert")
              value = !value;
            let icon = "";
            message.iconColor = await tools.GetIconColor(item.icon, (value != null ? value : true) ? true : false);
            icon = t.data.icon ? await tools.getIconEntryValue(
              item.icon,
              value,
              t.data.icon.true.value,
              t.data.icon.false.value
            ) : "";
            if (t.data.optionalData) {
              if (typeof t.data.optionalData === "string") {
                const arr = t.data.optionalData.split("?");
                if (arr.length > 0) {
                  message.optionalValue = !value && arr.length > 1 ? arr[1] : arr[0];
                }
              } else
                message.optionalValue = this.library.getTranslation(
                  (_g = await tools.getEntryTextOnOff(item.text, value)) != null ? _g : ""
                );
            }
            message.displayName = (_h = t.data.text && await tools.getEntryTextOnOff(item.text, value)) != null ? _h : message.displayName;
            message.icon = import_icon_mapping.Icons.GetIcon(icon);
            return tools.getItemMesssage(message);
          } else {
            this.log.error(`Missing data value for ${this.name}-${this.id} role:${this.config.role}`);
          }
          this.log.debug(JSON.stringify(message));
          break;
        }
        case "number": {
          break;
        }
        case "button": {
          if (item.entity1 && item.entity1.value) {
            let value;
            if (item.entity1.value.type === "string") {
            } else if (item.entity1.value.type === "number") {
            } else if (item.entity1.value.type === "boolean") {
              value = await tools.getValueEntryBoolean(item.entity1);
            }
            if (value === void 0)
              break;
            message.displayName = (_i = await tools.getEntryTextOnOff(item.text, value)) != null ? _i : "test1";
            message.optionalValue = (_j = await tools.getEntryTextOnOff(item.text1, value)) != null ? _j : "test2";
            message.icon = await tools.getIconEntryValue(item.icon, value, "home", "account");
            message.iconColor = await tools.GetIconColor(
              item.icon,
              typeof value === "number" ? value : !!value
            );
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
          message.type = "input_sel";
          const value = (_k = await tools.getValueEntryNumber(item.entity1)) != null ? _k : await tools.getValueEntryBoolean(item.entity1);
          message.icon = await tools.getIconEntryValue(item.icon, !!(value != null ? value : true), "gesture-tap-button");
          message.iconColor = (_l = await tools.GetIconColor(
            item.icon,
            value != null ? value : true,
            Color.HMIOn,
            Color.HMIOff,
            true,
            true,
            0,
            100
          )) != null ? _l : Color.HMIOn;
          message.optionalValue = (_m = await tools.getEntryTextOnOff(item.text, !!value)) != null ? _m : "PRESS";
          this.log.debug(JSON.stringify(message));
          return tools.getItemMesssage(message);
          break;
        }
        case "switch":
        case "delete":
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
    }
    return "";
  }
  async GenerateDetailPage(mode) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    if (!this.config || !this.dataItems)
      return null;
    const item = this.dataItems;
    const message = {};
    const template = import_TpageItem.templatePageItems[mode][this.config.role];
    message.entityName = this.id;
    switch (mode) {
      case "popupLight": {
        switch (this.config.role) {
          case "light":
          case "socket":
          case "dimmer":
          case "hue":
          case "ct":
          case "rgbSingle":
          case "rgb": {
            message.type = "2Sliders";
            if (message.type !== "2Sliders")
              return null;
            if (template.type !== message.type)
              return null;
            message.buttonState = (_a = template.buttonState ? await tools.getValueEntryBoolean(item.entity1) : null) != null ? _a : "disable";
            const dimmer = item.dimmer && await item.dimmer.getNumber();
            if (dimmer != null && template.slider1Pos) {
              if (item.minValue1 != void 0 && item.maxValue1) {
                message.slider1Pos = Math.trunc(
                  Color.scale(
                    dimmer,
                    await item.minValue1.getNumber(),
                    await item.maxValue1.getNumber(),
                    100,
                    0
                  )
                );
              } else {
                message.slider1Pos = dimmer;
              }
            }
            message.slidersColor = template.slidersColor ? String(Color.rgb_dec565(template.slidersColor)) : (_b = await tools.getIconEntryColor(item.icon, false, Color.White)) != null ? _b : "disable";
            let rgb;
            switch (this.config.role) {
              case "socket":
              case "light":
              case "dimmer":
              case "ct":
                break;
              case "hue":
                rgb = (_c = rgb != null ? rgb : await tools.getDecfromHue(item)) != null ? _c : null;
                break;
              case "rgbSingle":
              case "rgb":
                break;
            }
            if (rgb !== null && template.hueMode) {
              message.hueMode = true;
              message.slidersColor = rgb;
            }
            message.slider2Pos = "disable";
            let ct = template.slider2Pos ? await tools.getValueEntryNumber(item.entity2) : null;
            if (ct != null && template.slider2Pos !== false) {
              const max = (_d = item.maxValue2 && await item.maxValue2.getNumber()) != null ? _d : template.slider2Pos;
              ct = ct > max ? max : ct < 0 ? 0 : ct;
              if (item.minValue2 !== void 0) {
                const min = (_e = await item.minValue2.getNumber()) != null ? _e : 0;
                message.slider2Pos = Math.trunc(Color.scale(ct < min ? min : ct, min, max, 100, 0));
              } else {
                message.slider2Pos = Math.trunc(Color.scale(ct, 0, max, 100, 0));
              }
            }
            if ((_f = template.popup && item.valueList && await item.valueList.getString()) != null ? _f : false) {
              message.popup = true;
            }
            message.slider1Translation = template.slider1Translation !== false ? (_g = item.valueList && await item.valueList.getString()) != null ? _g : template.slider1Translation : "";
            message.slider2Translation = template.slider2Translation !== false ? (_h = item.valueList && await item.valueList.getString()) != null ? _h : template.slider2Translation : "";
            message.hue_translation = template.hue_translation !== false ? (_i = item.valueList && await item.valueList.getString()) != null ? _i : template.hue_translation : "";
            break;
          }
        }
        break;
      }
      case "popupFan":
      case "popupInSel": {
        message.type = "insel";
        if (message.type !== "insel")
          return null;
        const value = (_j = await tools.getValueEntryBoolean(item.entity1)) != null ? _j : true;
        message.textColor = await tools.getEntryColor(item.color, value, Color.White);
        message.headline = this.library.getTranslation(
          (_k = item.headline && await item.headline.getString()) != null ? _k : ""
        );
        let list = (_m = (_l = item.valueList && await item.valueList.getObject()) != null ? _l : item.valueList && await item.valueList.getString()) != null ? _m : [
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
    if (template.type !== message.type) {
      throw new Error(`Template ${template.type} is not ${message.type} for role: ${this.config.role}`);
    }
    return this.getDetailPayload(message);
    return null;
  }
  async delete() {
    super.delete();
  }
  async setPopupAction(action, value) {
    var _a;
    if (value === void 0 || this.dataItems === void 0)
      return;
    if (action === "mode-insel") {
      if (!this.dataItems.setList)
        return;
      let list = await this.dataItems.setList.getObject();
      if (list === null) {
        list = await this.dataItems.setList.getString();
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
    } else if (action === "button") {
      const value2 = (_a = this.dataItems.setNavi && await this.dataItems.setNavi.getString()) != null ? _a : null;
      if (value2 !== null) {
        this.panel.navigation.setTargetPageByName(value2);
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageItem
});
//# sourceMappingURL=pageItem.js.map
