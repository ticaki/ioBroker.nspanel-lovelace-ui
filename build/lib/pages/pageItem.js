"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var pageItem_exports = {};
__export(pageItem_exports, {
  PageItem: () => PageItem
});
module.exports = __toCommonJS(pageItem_exports);
var import_Color = require("../const/Color");
var import_icon_mapping = require("../const/icon_mapping");
var import_Page = require("./Page");
var import_tools = require("../const/tools");
var import_TpageItem = require("../templates/TpageItem");
class PageItem extends import_Page.Page {
  defaultOnColor = import_Color.White;
  defaultOffColor = import_Color.Blue;
  constructor(config) {
    super({ ...config, card: "cardItemSpecial" });
  }
  async getPageItemPayload(item, id) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u;
    const message = {};
    message.displayName = (_a = item.data.headline && await item.data.headline.getString()) != null ? _a : "";
    message.intNameEntity = id + "?" + item.role;
    switch (item.role) {
      case "light":
      case "dimmer":
      case "socket":
      case "cie":
      case "rgb":
      case "ct":
      case "hue":
      case "rgbSingle": {
        message.type = "light";
        const dimmer = item.data.dimmer && await item.data.dimmer.getNumber();
        const rgb = item.role == "rgb" ? await (0, import_tools.getDecfromRGBThree)(item) : await (0, import_tools.getEntryColor)(item.data.color, true, import_Color.White);
        const hue = item.role == "hue" && item.data.hue ? (0, import_Color.hsvtodec)(await item.data.hue.getNumber(), 1, 1) : null;
        const v = (_b = item.data.entity1 && item.data.entity1.value && await item.data.entity1.value.getBoolean()) != null ? _b : true;
        switch (item.role) {
          case "socket": {
            message.icon = import_icon_mapping.Icons.GetIcon("power-socket-de");
            break;
          }
          default: {
            message.icon = import_icon_mapping.Icons.GetIcon("lightbulb");
            break;
          }
        }
        if (v) {
          message.optionalValue = "1";
          message.iconColor = (_c = hue != null ? hue : rgb) != null ? _c : await (0, import_Color.GetIconColor)(item, dimmer != null ? dimmer : 100);
          const i = item.data.icon.true.value ? await item.data.icon.true.value.getString() : null;
          if (i !== null)
            message.icon = i;
        } else {
          message.optionalValue = "0";
          message.iconColor = await (0, import_Color.GetIconColor)(item, false);
          const i = item.data.icon.false.value ? await item.data.icon.false.value.getString() : null;
          if (i !== null)
            message.icon = i;
        }
        message.displayName = (_d = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, true)) != null ? _d : message.displayName;
        return this.getItemMesssage(message);
        break;
      }
      case "blind": {
        message.type = "shutter";
        const value = await (0, import_tools.getValueEntryNumber)(item.data.entity1);
        message.icon = import_icon_mapping.Icons.GetIcon(
          (_e = item.data.icon.true.value && await item.data.icon.true.value.getString()) != null ? _e : "window-open"
        );
        message.iconColor = await (0, import_Color.GetIconColor)(item, value !== null ? value : true);
        message.optionalValue = [
          import_icon_mapping.Icons.GetIcon("arrow-up"),
          import_icon_mapping.Icons.GetIcon("stop"),
          import_icon_mapping.Icons.GetIcon("arrow-down"),
          "enable",
          "enable",
          "enable"
        ].join("|");
        message.displayName = (_f = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, true)) != null ? _f : message.displayName;
        return this.getItemMesssage(message);
        break;
      }
      case "gate":
      case "door":
      case "window": {
        message.type = "text";
        let value = await (0, import_tools.getValueEntryBoolean)(item.data.entity1);
        if (value !== null) {
          if (item.role === "gate")
            value = !value;
          let icon = "";
          message.iconColor = await (0, import_Color.GetIconColor)(item, (value != null ? value : true) ? true : false);
          if (value) {
            icon = (_g = item.data.icon.true.value && await item.data.icon.true.value.getString()) != null ? _g : item.role === "door" ? "door-open" : item.role === "window" ? "window-open-variant" : "garage-open";
            message.optionalValue = (0, import_tools.getTranslation)(this.library, "window", "opened");
          } else {
            icon = (_h = item.data.icon.false.value && await item.data.icon.false.value.getString()) != null ? _h : item.role === "door" ? "door-closed" : item.role === "window" ? "window-closed-variant" : "garage";
            message.optionalValue = (0, import_tools.getTranslation)(this.library, "window", "closed");
          }
          message.displayName = (_i = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, value)) != null ? _i : message.displayName;
          message.icon = import_icon_mapping.Icons.GetIcon(icon);
          return this.getItemMesssage(message);
        } else {
          this.log.error(`Missing data value for ${this.name}-${id} role:${item.role}`);
        }
        break;
      }
      case "motion": {
        message.type = "text";
        const value = await (0, import_tools.getValueEntryBoolean)(item.data.entity1);
        if (value !== null) {
          message.iconColor = await (0, import_Color.GetIconColor)(item, (value != null ? value : true) ? true : false);
          message.icon = import_icon_mapping.Icons.GetIcon(await (0, import_tools.getIconEntryValue)(item.data.icon, value, "motion-sensor"));
          message.optionalValue = (0, import_tools.getTranslation)(this.library, value ? "on" : "off");
          message.displayName = (_j = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, value)) != null ? _j : message.displayName;
          return this.getItemMesssage(message);
        } else {
          this.log.error(`Missing data value for ${this.name}-${id} role:${item.role}`);
        }
        break;
      }
      case "buttonSensor":
      case "button": {
        let value = (_k = item.data.setValue1 && await item.data.setValue1.getBoolean()) != null ? _k : null;
        if (value === null && item.role === "buttonSensor")
          value = true;
        if (value !== null) {
          message.type = item.role === "buttonSensor" ? "input_sel" : "button";
          message.iconColor = await (0, import_Color.GetIconColor)(item, value);
          message.icon = import_icon_mapping.Icons.GetIcon(await (0, import_tools.getIconEntryValue)(item.data.icon, value, "gesture-tap-button"));
          message.displayName = (_l = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, value)) != null ? _l : "";
          message.optionalValue = (_m = await (0, import_tools.getValueEntryString)(item.data.entity1)) != null ? _m : "PRESS";
          return this.getItemMesssage(message);
        } else {
          this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
        }
        break;
      }
      case "value.time":
      case "level.timer": {
        const value = (_n = item.data.setValue1 && await item.data.setValue1.getNumber()) != null ? _n : null;
        if (value !== null) {
          message.type = "timer";
          message.iconColor = await (0, import_Color.GetIconColor)(item, value);
          message.icon = import_icon_mapping.Icons.GetIcon(await (0, import_tools.getIconEntryValue)(item.data.icon, true, "gesture-tap-button"));
          message.optionalValue = (_o = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, true)) != null ? _o : "PRESS";
          return this.getItemMesssage(message);
        } else {
          this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
        }
        break;
      }
      case "value.alarmtime": {
        const value = (_p = item.data.setValue1 && await item.data.setValue1.getNumber()) != null ? _p : null;
        if (value !== null) {
          message.type = "timer";
          message.iconColor = ((_q = await (0, import_tools.getValueEntryString)(item.data.entity2)) != null ? _q : "") == "paused" ? await (0, import_tools.getIconEntryColor)(item.data.icon, true, String((0, import_Color.rgb_dec565)(import_Color.colorScale10))) : await (0, import_tools.getIconEntryColor)(item.data.icon, false, String((0, import_Color.rgb_dec565)(import_Color.colorScale0)));
          message.displayName = new Date(
            (await (0, import_tools.getValueEntryNumber)(item.data.entity1) || 0) * 1e3
          ).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          message.icon = import_icon_mapping.Icons.GetIcon(await (0, import_tools.getIconEntryValue)(item.data.icon, true, "timer-outline"));
          message.optionalValue = (_r = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, true)) != null ? _r : "PRESS";
          return this.getItemMesssage(message);
        } else {
          this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
        }
        break;
      }
      case "level.mode.fan": {
        message.type = "fan";
        const value = (_s = await (0, import_tools.getValueEntryBoolean)(item.data.entity1)) != null ? _s : false;
        message.iconColor = await (0, import_Color.GetIconColor)(item, value);
        message.icon = import_icon_mapping.Icons.GetIcon(await (0, import_tools.getIconEntryValue)(item.data.icon, value, "fan"));
        message.optionalValue = value ? "1" : "0";
        return this.getItemMesssage(message);
        break;
      }
      case "media.repeat": {
        message.type = "button";
        const value = item.data.entity1 && item.data.entity1.value && item.data.entity1.value.type === "number" ? await (0, import_tools.getValueEntryNumber)(item.data.entity1) : await (0, import_tools.getValueEntryBoolean)(item.data.entity1);
        if (value !== null) {
          message.iconColor = await (0, import_Color.GetIconColor)(item, !!value);
          if (value === 2) {
            message.icon = "repeat-once";
          } else {
            message.icon = import_icon_mapping.Icons.GetIcon(
              await (0, import_tools.getIconEntryValue)(item.data.icon, !!value, "repeat-variant", "repeat-off")
            );
            message.optionalValue = !!value ? "1" : "0";
            return this.getItemMesssage(message);
          }
        }
        break;
      }
      case "text.list": {
        message.type = "input_sel";
        const value = (_t = item.data.entity1 && item.data.entity1.value && await (0, import_tools.getValueEntryBoolean)(item.data.entity1)) != null ? _t : null;
        message.iconColor = await (0, import_tools.getIconEntryColor)(item.data.icon, value, import_Color.HMIOn, import_Color.HMIOff);
        message.icon = import_icon_mapping.Icons.GetIcon(
          await (0, import_tools.getIconEntryValue)(item.data.icon, value, "clipboard-list", "clipboard-list-outline")
        );
        message.displayName = (_u = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, value)) != null ? _u : "";
        message.optionalValue = !!value ? "1" : "0";
        return this.getItemMesssage(message);
        break;
      }
    }
    return "~delete~~~~~";
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
        return this.getPayload(
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
          textColor: String((0, import_Color.rgb_dec565)(import_Color.White)),
          headline: "",
          list: ""
        };
        result = Object.assign(result, message);
        return this.getPayload(
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
  async GenerateDetailPage(mode, item, id) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    const message = {};
    const template = import_TpageItem.templatePageItems[mode][item.role];
    message.entityName = id;
    switch (mode) {
      case "popupLight": {
        switch (item.role) {
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
            message.buttonState = (_a = template.buttonState ? await (0, import_tools.getValueEntryBoolean)(item.data.entity1) : null) != null ? _a : "disable";
            const dimmer = item.data.dimmer && await item.data.dimmer.getNumber();
            if (dimmer != null && template.slider1Pos) {
              if (item.data.minValue1 != void 0 && item.data.maxValue1) {
                message.slider1Pos = Math.trunc(
                  (0, import_Color.scale)(
                    dimmer,
                    await item.data.minValue1.getNumber(),
                    await item.data.maxValue1.getNumber(),
                    100,
                    0
                  )
                );
              } else {
                message.slider1Pos = dimmer;
              }
            }
            message.slidersColor = template.slidersColor ? String((0, import_Color.rgb_dec565)(template.slidersColor)) : (_b = await (0, import_tools.getIconEntryColor)(item.data.icon, false, import_Color.White)) != null ? _b : "disable";
            let rgb;
            switch (item.role) {
              case "socket":
              case "light":
              case "dimmer":
              case "ct":
                break;
              case "hue":
                rgb = (_c = rgb != null ? rgb : await (0, import_tools.getDecfromHue)(item)) != null ? _c : null;
                break;
              case "rgbSingle":
              case "rgb":
                rgb = await (0, import_tools.getDecfromRGBThree)(item);
                break;
            }
            if (rgb !== null && template.hueMode) {
              message.hueMode = true;
              message.slidersColor = rgb;
            }
            message.slider2Pos = "disable";
            let ct = template.slider2Pos ? await (0, import_tools.getValueEntryNumber)(item.data.entity2) : null;
            if (ct != null && template.slider2Pos !== false) {
              const max = (_d = item.data.maxValue2 && await item.data.maxValue2.getNumber()) != null ? _d : template.slider2Pos;
              ct = ct > max ? max : ct < 0 ? 0 : ct;
              if (item.data.minValue2 !== void 0) {
                const min = (_e = await item.data.minValue2.getNumber()) != null ? _e : 0;
                message.slider2Pos = Math.trunc((0, import_Color.scale)(ct < min ? min : ct, min, max, 100, 0));
              } else {
                message.slider2Pos = Math.trunc((0, import_Color.scale)(ct, 0, max, 100, 0));
              }
            }
            if ((_f = template.popup && item.data.modeList && await item.data.modeList.getString()) != null ? _f : false) {
              message.popup = true;
            }
            message.slider1Translation = template.slider1Translation !== false ? (_g = item.data.modeList && await item.data.modeList.getString()) != null ? _g : template.slider1Translation : "";
            message.slider2Translation = template.slider2Translation !== false ? (_h = item.data.modeList && await item.data.modeList.getString()) != null ? _h : template.slider2Translation : "";
            message.hue_translation = template.hue_translation !== false ? (_i = item.data.modeList && await item.data.modeList.getString()) != null ? _i : template.hue_translation : "";
            break;
          }
        }
        break;
      }
      case "popupFan":
      case "popupInSel": {
        switch (item.role) {
          case "socket":
          case "value.time":
          case "level.timer":
          case "level.mode.fan":
          case "value.alarmtime":
          case "light":
          case "dimmer":
          case "hue":
          case "ct":
          case "cie":
          case "rgbSingle":
          case "rgb":
          case "blind":
          case "door":
          case "window":
          case "gate":
          case "motion":
          case "media.repeat":
          case "buttonSensor":
          case "button":
            break;
          case "text.list": {
            message.type = "insel";
            if (message.type !== "insel" || template.type !== "insel")
              return null;
            const value = template.value ? (_j = await (0, import_tools.getValueEntryBoolean)(item.data.entity1)) != null ? _j : template.value : template.value;
            message.textColor = await (0, import_tools.getEntryColor)(item.data.color, value, template.textColor);
            message.headline = this.library.getTranslation(
              (_k = item.data.headline && await item.data.headline.getString()) != null ? _k : ""
            );
            let list = template.list ? (_l = item.data.modeList && await item.data.modeList.getObject) != null ? _l : template.list : [];
            if (!Array.isArray(list))
              list = [];
            message.list = list.map((a) => (0, import_tools.formatInSelText)(a)).join("?");
            break;
          }
        }
        break;
      }
      case "popupLightNew":
      case "popupNotify":
      case "popupShutter":
      case "popupThermo":
      case "popupTimer":
    }
    if (template.type !== message.type) {
      throw new Error(`Template ${template.type} is not ${message.type} for role: ${item.role}`);
    }
    this.getDetailPayload(message);
    return null;
  }
  async delete() {
    super.delete();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageItem
});
//# sourceMappingURL=pageItem.js.map
