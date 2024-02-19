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
var Definition = __toESM(require("../const/definition"));
var Color = __toESM(require("../const/Color"));
var import_moment = __toESM(require("moment"));
var import_moment_parseformat = __toESM(require("moment-parseformat"));
var import_msg_def = require("../types/msg-def");
var import_Page = require("../classes/Page");
var import_icon_mapping = require("../const/icon_mapping");
var import_tools = require("../const/tools");
class Screensaver extends import_Page.Page {
  entitysConfig;
  layout = "standard";
  config2;
  items = {
    favoritEntity: [],
    leftEntity: [],
    bottomEntity: [],
    alternateEntity: [],
    indicatorEntity: [],
    mrIconEntity: []
  };
  rotationTime;
  timoutRotation = void 0;
  step = 0;
  constructor(config, options) {
    switch (options.mode) {
      case "standard":
      case "alternate": {
        config.card = "screensaver";
        break;
      }
      case "advanced": {
        config.card = "screensaver2";
        break;
      }
    }
    config.alwaysOn = "none";
    super(config, void 0);
    this.entitysConfig = options.entitysConfig;
    this.layout = options.mode;
    this.config2 = this.panel.config;
    import_moment.default.locale(this.config2.momentLocale);
    this.rotationTime = options.rotationTime !== 0 && options.rotationTime < 3 ? 3e3 : options.rotationTime * 1e3;
  }
  async init() {
    const config = this.entitysConfig;
    if (this.controller) {
      for (const key of Definition.ScreenSaverAllPlaces) {
        for (const entry of config[key]) {
          if (entry == null || entry === void 0) {
            this.items[key].push(void 0);
            continue;
          }
          const tempItem = await this.controller.statesControler.createDataItems(entry, this);
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
  }
  async update() {
    if (!this.visibility) {
      this.log.error("get update command but not visible!");
      return;
    }
    const payload = { eventType: "weatherUpdate", value: {} };
    payload.value[this.layout] = [];
    const value = payload.value[this.layout];
    if (value === void 0)
      return;
    for (const place of Definition.ScreenSaverPlaces) {
      let maxItems = Definition.ScreenSaverConst[this.layout][place].maxEntries;
      let i = 0;
      if (place == "bottomEntity") {
        i = maxItems * this.step;
        maxItems = maxItems * (this.step + 1);
      }
      for (i; i < maxItems; i++) {
        const item = this.items[place][i];
        if (item === null || item === void 0 || item.entityValue === void 0 || item.entityValue.value === void 0) {
          value.push({ icon: "", iconColor: "", displayName: "", optionalValue: "" });
          continue;
        }
        let iconColor = String(Color.rgb_dec565(Color.White));
        let icon = "";
        if (item.entityIcon && item.entityIcon.true && item.entityIcon.true.value) {
          const val2 = await item.entityIcon.true.value.getString();
          if (val2 !== null)
            icon = import_icon_mapping.Icons.GetIcon(val2);
        }
        let val = await item.entityValue.value.getNumber();
        if (item.entityValue.value.type == "number" && val !== null) {
          if (item.entityValue.factor) {
            const v = await item.entityValue.factor.getNumber();
            if (v !== null)
              val *= v;
          }
          if (item.entityValue.decimal) {
            const v = await item.entityValue.decimal.getNumber();
            if (v !== null)
              val = val.toFixed(v);
          }
          if (item.entityValue.unit) {
            const v = await item.entityValue.unit.getString();
            if (v !== null)
              val += v;
          }
          iconColor = await GetScreenSaverEntityColor(item);
        } else if (item.entityValue.value.type == "boolean") {
          val = await item.entityValue.value.getBoolean();
          iconColor = await GetScreenSaverEntityColor(item);
          if (!val && item.entityIcon && item.entityIcon.false && item.entityIcon.false.value) {
            const t = await item.entityIcon.false.value.getString();
            if (t !== null)
              icon = import_icon_mapping.Icons.GetIcon(t);
          }
          const b = val ? "true" : "false";
          if (item.entityText != void 0) {
            const i2 = item.entityText[b];
            if (i2 !== void 0) {
              const t = await i2.getString();
              if (t !== null)
                val = this.library.getTranslation(t);
            } else {
              const i3 = item.entityText.true;
              const t = i3 !== void 0 ? await i3.getString() : null;
              if (t !== null)
                val = this.library.getTranslation(t);
            }
          }
        } else if (item.entityValue.value.type == "string" && (val = await item.entityValue.value.getString()) !== null) {
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
              this.config2.locale,
              entityDateFormat !== null ? entityDateFormat : void 0
            );
          }
        }
        let temp = item.entityIcon && item.entityIcon.true && item.entityIcon.true.color ? await item.entityIcon.true.color.getRGBDec() : null;
        iconColor = temp ? temp : iconColor;
        temp = item.entityText && item.entityText.true ? await item.entityText.true.getString() : null;
        const entityText = temp ? this.library.getTranslation(temp) : "";
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
  sendStatusUpdate(payload, layout) {
    switch (payload.eventType) {
      case "statusUpdate":
        this.sendToPanel(
          (0, import_tools.getPayload)(
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
            (0, import_tools.getPayload)(
              "",
              "",
              a.icon,
              a.iconColor,
              "displayName" in a ? a.displayName : "",
              a.optionalValue
            )
          )
        );
        this.sendToPanel((0, import_tools.getPayloadArray)([...result, ""]));
        break;
      }
    }
  }
  async onVisibilityChange(v) {
    this.step = -1;
    if (v) {
      this.sendType();
      this.rotationLoop();
    } else {
      if (this.timoutRotation)
        this.adapter.clearTimeout(this.timoutRotation);
    }
  }
  rotationLoop = async () => {
    if (this.unload)
      return;
    if (!this.visibility)
      return;
    const l = this.entitysConfig.bottomEntity.length;
    const m = Definition.ScreenSaverConst[this.layout].bottomEntity.maxEntries;
    if (l <= m * ++this.step)
      this.step = 0;
    await this.update();
    if (l <= m || this.rotationTime === 0)
      return;
    this.timoutRotation = this.adapter.setTimeout(
      this.rotationLoop,
      this.rotationTime < 3e3 ? 3e3 : this.rotationTime
    );
  };
  onStateTrigger = async () => {
    this.update();
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
      let value = await (0, import_tools.getValueEntryNumber)(item.entityValue);
      if (value === null)
        value = await (0, import_tools.getValueEntryString)(item.entityValue);
      if (value === null)
        value = await (0, import_tools.getValueEntryBoolean)(item.entityValue);
      if (value === null) {
        payload[`icon${s}`] = "";
        payload[`icon${s}Color`] = "";
        payload[`icon${s}Font`] = "";
        continue;
      }
      const entity = item.entityValue && item.entityValue.value ? item.entityValue.value.type == "string" ? await item.entityValue.value.getString() : await item.entityValue.value.getBoolean() : null;
      const offcolor = item.entityIcon && item.entityIcon.false && item.entityIcon.false.color ? await item.entityIcon.false.color.getRGBDec() : String(Color.rgb_dec565(Color.White));
      const onColor = item.entityIcon && item.entityIcon.true && item.entityIcon.true.color ? await item.entityIcon.true.color.getRGBDec() : null;
      payload[`icon${s}Color`] = offcolor !== null ? offcolor : String(Color.rgb_dec565(Color.White));
      if (item.entityValue != null || value !== null || onColor != null) {
        if (entity != null && onColor) {
          if (typeof entity == "string") {
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
          } else {
            if (entity) {
              payload[`icon${s}Color`] = onColor;
            }
          }
        }
        const entityIconSelect = item.entityIconSelect ? await item.entityIconSelect.getObject() : null;
        const onIcon = item.entityIcon && item.entityIcon.true && item.entityIcon.true.value ? await item.entityIcon.true.value.getString() : null;
        const offIcon = item.entityIcon && item.entityIcon.false && item.entityIcon.false.value ? await item.entityIcon.false.value.getString() : null;
        const selectIcon = typeof entity !== "boolean" && entity !== null && entityIconSelect ? entityIconSelect[entity] : void 0;
        if (selectIcon) {
          payload[`icon${s}`] = import_icon_mapping.Icons.GetIcon(selectIcon);
          this.log.debug("SelectIcon: " + JSON.stringify(payload), "info");
        } else if (entity && onIcon) {
          payload[`icon${s}`] = import_icon_mapping.Icons.GetIcon(onIcon);
          this.log.debug("Icon if true " + JSON.stringify(payload), "info");
        } else {
          if (offIcon) {
            payload[`icon${s}`] = import_icon_mapping.Icons.GetIcon(offIcon);
            this.log.debug("Icon1 else true " + JSON.stringify(payload), "info");
          } else if (onIcon) {
            payload[`icon${s}`] = import_icon_mapping.Icons.GetIcon(onIcon);
            this.log.debug("Icon1 else false " + JSON.stringify(payload), "info");
          }
        }
        if (value !== null && value !== void 0) {
          payload[`icon${s}`] += typeof value === "string" ? value : "";
          const unit = item.entityValue && item.entityValue.unit ? await item.entityValue.unit.getString() : null;
          if (unit !== null)
            payload[`icon${s}`] += unit;
        }
      } else {
        payload[`icon${s}Color`] = String(Color.rgb_dec565(Color.Black));
      }
      payload[`icon${s}Font`] = this.config2[`iconBig${s}`] ? "1" : "";
    }
    this.sendStatusUpdate(payload, this.layout);
  }
  async delete() {
    await super.delete();
    if (this.timoutRotation)
      this.adapter.clearTimeout(this.timoutRotation);
  }
}
async function GetScreenSaverEntityColor(item) {
  if (item && item.entityValue) {
    let colorReturn;
    const entityAsNumber = item.entityValue.value !== void 0 ? await item.entityValue.value.getNumber() : null;
    const entityFactor = item.entityValue.factor !== void 0 ? await item.entityValue.factor.getNumber() : null;
    const entityIconColorScale = item.entityIcon && "scale" in item.entityIcon && item.entityIcon.scale !== void 0 ? await item.entityIcon.scale.getIconScale() : null;
    const entityOnColor = item.entityIcon && item.entityIcon.true && item.entityIcon.true.color ? await item.entityIcon.true.color.getRGBDec() : null;
    const entityOffColor = item.entityIcon && item.entityIcon.false && item.entityIcon.false.color ? await item.entityIcon.false.color.getRGBDec() : null;
    if (item.entityValue.value) {
      if (entityIconColorScale !== null) {
        if (item.entityValue.value.type == "boolean") {
          const iconvalbest = entityIconColorScale && entityIconColorScale.val_best !== void 0 ? !!entityIconColorScale.val_best : false;
          if (iconvalbest == await item.entityValue.value.getBoolean()) {
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
            if (await item.entityValue.value.getBoolean()) {
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
        const entityAsBoolean = item.entityValue && item.entityValue.value ? await item.entityValue.value.getBoolean() : null;
        if (item.entityValue.value.type == "boolean" || item.entityValue.value.type == "number") {
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
            if (entityOnColor !== null)
              colorReturn = entityOnColor;
            else
              colorReturn = Color.rgb_dec565(Color.White);
          }
        } else {
          colorReturn = Color.rgb_dec565(Color.White);
        }
      }
      return String(colorReturn);
    }
  }
  return String(Color.rgb_dec565(Color.White));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Screensaver
});
//# sourceMappingURL=screensaver.js.map
