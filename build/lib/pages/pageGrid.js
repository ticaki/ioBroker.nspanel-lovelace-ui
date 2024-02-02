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
var pageGrid_exports = {};
__export(pageGrid_exports, {
  PageGrid: () => PageGrid
});
module.exports = __toCommonJS(pageGrid_exports);
var import_Color = require("../const/Color");
var import_icon_mapping = require("../const/icon_mapping");
var import_Page = require("./Page");
var import_tools = require("../const/tools");
class PageGrid extends import_Page.Page {
  constructor(config) {
    super({ ...config, card: "cardGrid" });
  }
  async getPageItem(item, id) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
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
        const rgb = item.role == "rgb" ? await (0, import_Color.getDecfromRGBThree)(item) : item.data.color && await item.data.color.getRGBDec();
        const hue = item.role == "hue" && item.data.hue ? (0, import_Color.hsvtodec)(await item.data.hue.getNumber(), 1, 1) : null;
        const v = item.data.entity.value ? await item.data.entity.value.getBoolean() : true;
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
          message.iconColor = (_b = hue != null ? hue : rgb) != null ? _b : await (0, import_Color.GetIconColor)(item, dimmer != null ? dimmer : 100);
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
        message.displayName = (_c = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, true)) != null ? _c : message.displayName;
        return this.getItemMesssage(message);
        break;
      }
      case "blind": {
        message.type = "shutter";
        const value = await (0, import_tools.getValueEntryNumber)(item.data.entity);
        message.icon = import_icon_mapping.Icons.GetIcon(
          (_d = item.data.icon.true.value && await item.data.icon.true.value.getString()) != null ? _d : "window-open"
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
        message.displayName = (_e = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, true)) != null ? _e : message.displayName;
        return this.getItemMesssage(message);
        break;
      }
      case "gate":
      case "door":
      case "window": {
        message.type = "text";
        let value = await (0, import_tools.getValueEntryBoolean)(item.data.entity);
        if (value !== null) {
          if (item.role === "gate")
            value = !value;
          let icon = "";
          message.iconColor = await (0, import_Color.GetIconColor)(item, (value != null ? value : true) ? true : false);
          if (value) {
            icon = (_f = item.data.icon.true.value && await item.data.icon.true.value.getString()) != null ? _f : item.role === "door" ? "door-open" : item.role === "window" ? "window-open-variant" : "garage-open";
            message.optionalValue = (0, import_tools.getTranslation)(this.library, "window", "opened");
          } else {
            icon = (_g = item.data.icon.false.value && await item.data.icon.false.value.getString()) != null ? _g : item.role === "door" ? "door-closed" : item.role === "window" ? "window-closed-variant" : "garage";
            message.optionalValue = (0, import_tools.getTranslation)(this.library, "window", "closed");
          }
          message.displayName = (_h = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, value)) != null ? _h : message.displayName;
          message.icon = import_icon_mapping.Icons.GetIcon(icon);
          return this.getItemMesssage(message);
        } else {
          this.log.error(`Missing data value for ${this.name}-${id} role:${item.role}`);
        }
        break;
      }
      case "motion": {
        message.type = "text";
        const value = await (0, import_tools.getValueEntryBoolean)(item.data.entity);
        if (value !== null) {
          message.iconColor = await (0, import_Color.GetIconColor)(item, (value != null ? value : true) ? true : false);
          message.icon = import_icon_mapping.Icons.GetIcon(await (0, import_tools.getIconEntryValue)(item.data.icon, value, "motion-sensor"));
          message.optionalValue = (0, import_tools.getTranslation)(this.library, value ? "on" : "off");
          message.displayName = (_i = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, value)) != null ? _i : message.displayName;
          return this.getItemMesssage(message);
        } else {
          this.log.error(`Missing data value for ${this.name}-${id} role:${item.role}`);
        }
        break;
      }
      case "buttonSensor":
      case "switch":
      case "button": {
        let value = (_j = item.data.set && item.data.set.value1 && await item.data.set.value1.getBoolean()) != null ? _j : null;
        if (value === null && item.role === "buttonSensor")
          value = true;
        if (value !== null) {
          message.type = item.role === "buttonSensor" ? "input_sel" : "button";
          message.iconColor = await (0, import_Color.GetIconColor)(item, value);
          message.icon = import_icon_mapping.Icons.GetIcon(await (0, import_tools.getIconEntryValue)(item.data.icon, value, "gesture-tap-button"));
          message.displayName = (_k = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, value)) != null ? _k : "";
          message.optionalValue = (_l = await (0, import_tools.getValueEntryString)(item.data.entity)) != null ? _l : "PRESS";
          return this.getItemMesssage(message);
        } else {
          this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
        }
        break;
      }
      case "value.time":
      case "level.timer": {
        const value = (_m = item.data.set && item.data.set.value1 && await item.data.set.value1.getNumber()) != null ? _m : null;
        if (value !== null) {
          message.type = "timer";
          message.iconColor = await (0, import_Color.GetIconColor)(item, value);
          message.icon = import_icon_mapping.Icons.GetIcon(await (0, import_tools.getIconEntryValue)(item.data.icon, true, "gesture-tap-button"));
          message.optionalValue = (_n = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, true)) != null ? _n : "PRESS";
          return this.getItemMesssage(message);
        } else {
          this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
        }
        break;
      }
      case "value.alarmtime": {
        const value = (_o = item.data.set && item.data.set.value1 && await item.data.set.value1.getNumber()) != null ? _o : null;
        if (value !== null) {
          message.type = "timer";
          message.iconColor = ((_p = await (0, import_tools.getValueEntryString)(item.data.entityOptional)) != null ? _p : "") == "paused" ? await (0, import_tools.getIconEntryColor)(item.data.icon, true, String((0, import_Color.rgb_dec565)(import_Color.colorScale10))) : await (0, import_tools.getIconEntryColor)(item.data.icon, false, String((0, import_Color.rgb_dec565)(import_Color.colorScale0)));
          message.displayName = new Date(
            (await (0, import_tools.getValueEntryNumber)(item.data.entity) || 0) * 1e3
          ).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          message.icon = import_icon_mapping.Icons.GetIcon(await (0, import_tools.getIconEntryValue)(item.data.icon, true, "timer-outline"));
          message.optionalValue = (_q = await (0, import_tools.getValueEntryTextOnOff)(item.data.text, true)) != null ? _q : "PRESS";
          return this.getItemMesssage(message);
        } else {
          this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
        }
        break;
      }
      case "level.mode.fan": {
        message.type = "fan";
        const value = (_r = await (0, import_tools.getValueEntryBoolean)(item.data.entity)) != null ? _r : false;
        message.iconColor = await (0, import_Color.GetIconColor)(item, value);
        message.icon = import_icon_mapping.Icons.GetIcon(await (0, import_tools.getIconEntryValue)(item.data.icon, value, "fan"));
        message.optionalValue = value ? "1" : "0";
        break;
      }
    }
    return "~delete~~~~~";
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageGrid
});
//# sourceMappingURL=pageGrid.js.map
