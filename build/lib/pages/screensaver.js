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
var screensaver_exports = {};
__export(screensaver_exports, {
  Screensaver: () => Screensaver
});
module.exports = __toCommonJS(screensaver_exports);
var import_data_item = require("../classes/data-item");
var Definition = __toESM(require("../const/definition"));
var Color = __toESM(require("../const/color"));
var Icons = __toESM(require("../const/icon_mapping"));
var import_moment = __toESM(require("moment"));
var import_moment_parseformat = __toESM(require("moment-parseformat"));
var import_msg_def = require("../types/msg-def");
var import_panel_message = require("../controller/panel-message");
class Screensaver extends import_panel_message.BaseClassPanelSend {
  entitysConfig;
  layout = "standard";
  readOnlyDB;
  config;
  items = {
    favoritEntity: [],
    leftEntity: [],
    bottomEntity: [],
    indicatorEntity: [],
    mrIconEntity: []
  };
  mode;
  constructor(adapter, config, panelSend, readOnlyDB) {
    super(adapter, panelSend, "screensaver");
    this.entitysConfig = config.entitysConfig;
    this.mode = config.mode;
    this.config = config.config;
    import_moment.default.locale(config.config.momentLocale);
    this.readOnlyDB = readOnlyDB;
  }
  async init() {
    const config = this.entitysConfig;
    for (const key of Definition.ScreenSaverAllPlaces) {
      for (const entry of config[key]) {
        if (entry == null || entry === void 0) {
          this.items[key].push(void 0);
          continue;
        }
        const tempItem = {};
        for (const j1 in entry) {
          const j = j1;
          const data = entry[j];
          tempItem[j] = data !== void 0 ? new import_data_item.Dataitem(this.adapter, { ...data, name: j }, this, this.readOnlyDB) : void 0;
          if (tempItem[j] !== void 0 && !await tempItem[j].isValidAndInit()) {
            tempItem[j] = void 0;
          }
        }
        switch (key) {
          case "favoritEntity":
          case "leftEntity":
          case "bottomEntity":
          case "indicatorEntity":
            this.items[key].push(tempItem);
            break;
          case "mrIconEntity":
            this.items["mrIconEntity"].push(tempItem);
            break;
        }
      }
    }
  }
  async update() {
    const payload = { eventType: "weatherUpdate", value: {} };
    payload.value[this.layout] = [];
    const value = payload.value[this.layout];
    if (value === void 0)
      return;
    for (const place of Definition.ScreenSaverPlaces) {
      const maxItems = Definition.ScreenSaverConst[this.layout][place].maxEntries;
      for (let i = 0; i < maxItems; i++) {
        const item = this.items[place][i];
        if (item === null || item === void 0 || item.entity === void 0) {
          value.push({ icon: "", iconColor: "", displayName: "", optionalValue: "" });
          continue;
        }
        let iconColor = String(Color.rgb_dec565(Color.White));
        let icon = "";
        if (item.entityIconOn) {
          const val2 = await item.entityIconOn.getString();
          if (val2 !== null)
            icon = Icons.GetIcon(val2);
        }
        let val = await item.entity.getNumber();
        if (item.entity.type == "number" && val !== null) {
          if (item.entityFactor) {
            const v = await item.entityFactor.getNumber();
            if (v !== null)
              val *= v;
          }
          if (item.entityDecimalPlaces) {
            const v = await item.entityDecimalPlaces.getNumber();
            const v2 = item.entityUnitText ? await item.entityUnitText.getString() : null;
            if (v !== null)
              val = val.toFixed(v) + (v2 !== null ? v2 : "");
          }
          iconColor = await GetScreenSaverEntityColor(item);
        } else if (item.entity.type == "boolean") {
          val = await item.entity.getBoolean();
          iconColor = await GetScreenSaverEntityColor(item);
          if (!val && item.entityIconOff) {
            const t = await item.entityIconOff.getString();
            if (t !== null)
              icon = Icons.GetIcon(t);
          }
          if (val && item.entityOnText != void 0) {
            const t = await item.entityOnText.getString();
            if (t !== null)
              val = t;
          } else if (!val && item.entityOffText != void 0) {
            const t = await item.entityOffText.getString();
            if (t !== null)
              val = t;
          }
        } else if (item.entity.type == "string" && (val = await item.entity.getString()) !== null) {
          iconColor = await GetScreenSaverEntityColor(item);
          const pformat = (0, import_moment_parseformat.default)(val);
          this.log.debug(
            "moments.js --> Datum " + val + " valid?: " + (0, import_moment.default)(val, pformat, true).isValid(),
            "info"
          );
          if ((0, import_moment.default)(val, pformat, true).isValid()) {
            const DatumZeit = (0, import_moment.default)(val, pformat).unix();
            const entityDateFormat = item.entityDateFormat ? await item.entityDateFormat.getObject() : null;
            val = new Date(DatumZeit * 1e3).toLocaleString(
              this.config.locale,
              entityDateFormat !== null ? entityDateFormat : void 0
            );
          }
        }
        let temp = item.entityIconColor ? await item.entityIconColor.getRGBDec() : null;
        iconColor = temp ? temp : iconColor;
        temp = item.entityText ? await item.entityText.getString() : null;
        const entityText = temp ? temp : "";
        value.push({ icon, iconColor, displayName: entityText, optionalValue: val ? String(val) : "" });
      }
    }
    if (this.layout === "alternate") {
      const lastIndex = payload.value[this.layout].length - 1;
      payload.value[this.layout].push(payload.value[this.layout][lastIndex]);
      payload.value[this.layout][lastIndex] = { icon: "", iconColor: "", displayName: "", optionalValue: "" };
    }
    this.log.debug("HandleScreensaverUpdate payload: " + JSON.stringify(payload.value[this.layout]));
    this.sendStatusUpdate(payload, this.layout);
    this.HandleScreensaverStatusIcons();
  }
  sendType() {
    switch (this.layout) {
      case "standard": {
        this.sendToPanel("pageType~screensaver");
        break;
      }
      case "alternate": {
        this.sendToPanel("pageType~screensaver");
        break;
      }
      case "advanced": {
        this.sendToPanel("pageType~screensaver2");
        break;
      }
    }
  }
  sendStatusUpdate(payload, layout) {
    switch (payload.eventType) {
      case "statusUpdate":
        this.sendToPanel(
          this.getPayload(
            payload.eventType,
            payload.icon1,
            payload.icon1Color,
            payload.icon2,
            payload.icon2Color,
            payload.icon1Font,
            payload.icon2Font,
            ""
          )
        );
        break;
      case "weatherUpdate": {
        let value = payload.value[layout];
        if (!value)
          return;
        const result = [payload.eventType];
        const check = import_msg_def.weatherUpdateTestArray[layout];
        value = value.filter((item, pos) => check[pos]);
        value.forEach((item, pos) => {
          const test = check[pos];
          if (item.icon && !test.icon)
            item.icon = "";
          if (item.iconColor && !test.iconColor)
            item.iconColor = "";
          if (item.displayName && (!("displayName" in test) || !test.displayName))
            item.displayName = "";
          if (item.optionalValue && !test.icon)
            item.icon = "";
        });
        value.forEach(
          (a) => a && result.push(
            this.getPayload(
              "",
              "",
              a.icon,
              a.iconColor,
              "displayName" in a ? a.displayName : "",
              a.optionalValue
            )
          )
        );
        this.sendToPanel(this.getPayloadArray([...result, ""]));
        break;
      }
    }
  }
  getPayloadArray(s) {
    return s.join("~");
  }
  getPayload(...s) {
    return s.join("~");
  }
  onStateTrigger = async () => {
    if (!await super.onStateTrigger())
      return false;
    this.update();
    return true;
  };
  async HandleScreensaverStatusIcons() {
    const payload = { eventType: "statusUpdate" };
    const maxItems = Definition.ScreenSaverConst[this.layout]["mrIconEntity"].maxEntries;
    for (let i = 0; i < maxItems; i++) {
      const s = i == 0 ? "1" : "2";
      const item = this.items["mrIconEntity"][i];
      if (item === null || item === void 0) {
        payload[`icon${s}`] = "";
        payload[`icon${s}Color`] = "";
        payload[`icon${s}Font`] = "";
        continue;
      }
      let value = null;
      if (item.entityValue) {
        switch (item.entityValue.type) {
          case "string": {
            const v = await item.entityValue.getString();
            if (v !== null)
              value = v;
            break;
          }
          case "number": {
            value = 0;
            const v = await item.entityValue.getNumber();
            const c = item.entityValueDecimalPlace ? await item.entityValueDecimalPlace.getNumber() : null;
            if (v !== null)
              value = v;
            if (c !== null)
              value = (value || 0).toFixed(c);
            break;
          }
          case "boolean": {
            value = false;
            const v = item.entityValue ? await item.entityValue.getBoolean() : null;
            if (v !== null)
              value = v;
            break;
          }
          case "object":
            const s2 = i == 0 ? "1" : "2";
            payload[`icon${s2}`] = "";
            payload[`icon${s2}Color`] = "";
            payload[`icon${s2}Font`] = "";
            continue;
        }
      }
      const entity = item.entity ? item.entity.type == "string" ? await item.entity.getString() : await item.entity.getBoolean() : null;
      const offcolor = item.entityOffColor ? await item.entityOffColor.getRGBDec() : String(Color.rgb_dec565(Color.White));
      const onColor = item.entityOnColor ? await item.entityOnColor.getRGBDec() : null;
      payload[`icon${s}Color`] = offcolor !== null ? offcolor : String(Color.rgb_dec565(Color.White));
      if (item.entity != null || value !== null || item.entityValue != null) {
        if (entity != null && onColor) {
          if (typeof entity == "string") {
            this.log.debug("Entity ist String");
            switch (entity.toUpperCase()) {
              case "ON":
              case "OK":
              case "AN":
              case "YES":
              case "TRUE":
              case "ONLINE":
                payload[`icon${s}Color`] = onColor;
                break;
              default:
            }
            if (Definition.Debug)
              this.log.debug(
                "Value: " + item.entity + " Color: " + JSON.stringify(payload[`icon${s}Color`]),
                "info"
              );
          } else {
            this.log.debug("Entity ist kein String", "info");
            if (entity) {
              payload[`icon${s}Color`] = onColor;
            }
          }
        }
        const entityIconSelect = item.entityIconSelect ? await item.entityIconSelect.getObject() : null;
        const onIcon = item.entityIconOn ? await item.entityIconOn.getString() : null;
        const offIcon = item.entityIconOff ? await item.entityIconOff.getString() : null;
        const selectIcon = typeof entity !== "boolean" && entity !== null && entityIconSelect ? entityIconSelect[entity] : void 0;
        if (selectIcon) {
          payload[`icon${s}`] = Icons.GetIcon(selectIcon);
          this.log.debug("SelectIcon: " + JSON.stringify(payload), "info");
        } else if (entity && onIcon) {
          payload[`icon${s}`] = Icons.GetIcon(onIcon);
          this.log.debug("Icon if true " + JSON.stringify(payload), "info");
        } else {
          if (offIcon) {
            payload[`icon${s}`] = Icons.GetIcon(offIcon);
            this.log.debug("Icon1 else true " + JSON.stringify(payload), "info");
          } else if (onIcon) {
            payload[`icon${s}`] = Icons.GetIcon(onIcon);
            this.log.debug("Icon1 else false " + JSON.stringify(payload), "info");
          }
        }
        if (value !== null && value !== void 0) {
          payload[`icon${s}`] += String(value);
          const unit = item.entityValueUnit ? await item.entityValueUnit.getString() : null;
          if (unit !== null)
            payload[`icon${s}`] += unit;
        }
      } else {
        payload[`icon${s}Color`] = String(Color.rgb_dec565(Color.Black));
      }
      payload[`icon${s}Font`] = this.config[`iconBig${s}`] ? "1" : "";
    }
    this.sendStatusUpdate(payload, this.layout);
  }
}
async function GetScreenSaverEntityColor(item) {
  if (item && item.entity) {
    let colorReturn;
    const entityAsNumber = item.entity ? await item.entity.getNumber() : null;
    const entityFactor = item.entityFactor ? await item.entityFactor.getNumber() : null;
    const entityIconColor = item.entityIconColor ? await item.entityIconColor.getRGBDec() : null;
    const entityIconColorScale = item.entityIconColorScale ? await item.entityIconColorScale.getIconScale() : null;
    const entityOnColor = item.entityOnColor ? await item.entityOnColor.getRGBDec() : null;
    const entityOffColor = item.entityOffColor ? await item.entityOffColor.getRGBDec() : null;
    if (entityIconColor !== null && entityIconColorScale !== null) {
      if (item.entity.type == "boolean") {
        const iconvalbest = entityIconColorScale && entityIconColorScale.val_best !== void 0 ? !!entityIconColorScale.val_best : false;
        if (iconvalbest == await item.entity.getBoolean()) {
          if (entityOnColor !== null)
            colorReturn = entityOnColor;
          else
            colorReturn = Color.rgb_dec565(Color.colorScale0);
        } else {
          if (entityOffColor !== null)
            colorReturn = entityOffColor;
          else
            colorReturn = Color.rgb_dec565(Color.colorScale10);
        }
      } else if (entityIconColorScale !== null && entityAsNumber !== null) {
        const iconvalmin = entityIconColorScale.val_min != void 0 ? entityIconColorScale.val_min : 0;
        const iconvalmax = entityIconColorScale.val_max != void 0 ? entityIconColorScale.val_max : 100;
        const iconvalbest = entityIconColorScale.val_best != void 0 ? entityIconColorScale.val_best : iconvalmin;
        let valueScale = entityAsNumber * (entityFactor !== null ? entityFactor : 1);
        if (iconvalmin == 0 && iconvalmax == 1) {
          if (await item.entity.getBoolean()) {
            if (entityOnColor !== null)
              colorReturn = entityOnColor;
            else
              colorReturn = Color.rgb_dec565(Color.colorScale0);
          } else {
            if (entityOffColor !== null)
              colorReturn = entityOffColor;
            else
              colorReturn = Color.rgb_dec565(Color.colorScale10);
          }
        } else {
          if (iconvalbest == iconvalmin) {
            valueScale = Color.scale(valueScale, iconvalmin, iconvalmax, 10, 0);
          } else {
            if (valueScale < iconvalbest) {
              valueScale = Color.scale(valueScale, iconvalmin, iconvalbest, 0, 10);
            } else if (valueScale > iconvalbest || iconvalbest != iconvalmin) {
              valueScale = Color.scale(valueScale, iconvalbest, iconvalmax, 10, 0);
            } else {
              valueScale = Color.scale(valueScale, iconvalmin, iconvalmax, 10, 0);
            }
          }
          if (valueScale > 10)
            valueScale = 10;
          if (valueScale < 0)
            valueScale = 0;
          const valueScaletemp = Math.round(valueScale).toFixed();
          colorReturn = Color.HandleColorScale(valueScaletemp);
        }
      } else {
        colorReturn = Color.rgb_dec565(Color.White);
      }
    } else {
      const entityAsBoolean = item.entity ? await item.entity.getBoolean() : null;
      if (item.entity.type == "boolean" || item.entity.type == "number") {
        if (entityAsBoolean !== null) {
          if (entityAsBoolean) {
            if (entityOnColor !== null)
              colorReturn = entityOnColor;
            else
              colorReturn = Color.rgb_dec565(Color.White);
          } else {
            if (entityOffColor !== null)
              colorReturn = entityOffColor;
            else
              colorReturn = Color.rgb_dec565(Color.White);
          }
        } else {
          if (entityOffColor !== null)
            colorReturn = entityOffColor;
          else
            colorReturn = Color.rgb_dec565(Color.White);
        }
      } else {
        colorReturn = Color.rgb_dec565(Color.White);
      }
    }
    return String(colorReturn);
  }
  return String(Color.rgb_dec565(Color.White));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Screensaver
});
//# sourceMappingURL=screensaver.js.map
