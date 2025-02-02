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
var config_manager_exports = {};
__export(config_manager_exports, {
  ConfigManager: () => ConfigManager
});
module.exports = __toCommonJS(config_manager_exports);
var import_library = require("../classes/library");
var import_Color = require("../const/Color");
var import_config_manager_const = require("../const/config-manager-const");
class ConfigManager extends import_library.BaseClass {
  //private test: ConfigManager.DeviceState;
  constructor(adapter) {
    super(adapter, "config-manager");
  }
  async setScriptConfig(configuration) {
    const config = Object.assign(import_config_manager_const.defaultConfig, configuration);
    if (!config || !(0, import_config_manager_const.isConfig)(config)) {
      this.log.error(`Invalid configuration from Script: ${config ? JSON.stringify(config) : "undefined"}`);
      return;
    }
    const pageItems = [];
    if (config.bottomScreensaverEntity) {
      for (const item of config.bottomScreensaverEntity) {
        if (item) {
          pageItems.push(await this.getEntityData(item, "bottom"));
        }
      }
    }
    if (config.indicatorScreensaverEntity) {
      for (const item of config.indicatorScreensaverEntity) {
        if (item) {
          pageItems.push(await this.getEntityData(item, "indicator"));
        }
      }
    }
    if (config.leftScreensaverEntity) {
      for (const item of config.leftScreensaverEntity) {
        if (item) {
          pageItems.push(await this.getEntityData(item, "left"));
        }
      }
    }
    this.log.debug(`pageItems count: ${pageItems.length}`);
    const convertedConfig = {
      dpInit: "",
      alwaysOn: "none",
      uniqueID: "scr",
      useColor: false,
      config: {
        card: "screensaver2",
        mode: "advanced",
        rotationTime: 0,
        model: "eu",
        data: void 0
      },
      pageItems
    };
    this.log.debug(`convertedConfig: ${JSON.stringify(convertedConfig)}`);
  }
  async getEntityData(entity, mode) {
    const result = {
      modeScr: mode,
      type: "text",
      data: { entity2: {} }
    };
    const obj = await this.adapter.getObjectAsync(entity.ScreensaverEntity);
    if (entity.ScreensaverEntityUnitText || entity.ScreensaverEntityUnitText === "") {
      result.data.entity2.unit = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityUnitText);
    } else if (obj && obj.common && obj.common.unit) {
      result.data.entity2.unit = { type: "const", constVal: obj.common.unit };
    }
    if (entity.ScreensaverEntityFactor) {
      result.data.entity2.factor = { type: "const", constVal: entity.ScreensaverEntityFactor };
    }
    if (entity.ScreensaverEntityDecimalPlaces) {
      result.data.entity2.decimal = { type: "const", constVal: entity.ScreensaverEntityDecimalPlaces };
    }
    let color = void 0;
    if (entity.ScreensaverEntityOnColor) {
      if (typeof entity.ScreensaverEntityOnColor === "string") {
        color = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityOnColor);
      } else if (import_Color.Color.isRGB(entity.ScreensaverEntityOnColor)) {
        color = { type: "const", constVal: entity.ScreensaverEntityOnColor };
      } else if (import_Color.Color.isScriptRGB(entity.ScreensaverEntityOnColor)) {
        color = { type: "const", constVal: import_Color.Color.convertScriptRGBtoRGB(entity.ScreensaverEntityOnColor) };
      } else {
        this.adapter.log.error(`Invalid color value: ${JSON.stringify(entity.ScreensaverEntityOnColor)}`);
      }
    } else if (entity.ScreensaverEntityIconColor) {
      if (typeof entity.ScreensaverEntityIconColor === "string") {
        color = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconColor);
      } else if (import_Color.Color.isRGB(entity.ScreensaverEntityIconColor)) {
        color = { type: "const", constVal: entity.ScreensaverEntityIconColor };
      } else if (import_Color.Color.isScriptRGB(entity.ScreensaverEntityIconColor)) {
        color = { type: "const", constVal: import_Color.Color.convertScriptRGBtoRGB(entity.ScreensaverEntityIconColor) };
      } else {
        this.adapter.log.error(`Invalid color value: ${JSON.stringify(entity.ScreensaverEntityIconColor)}`);
      }
    }
    let colorOff = void 0;
    if (entity.ScreensaverEntityIconOff) {
      if (typeof entity.ScreensaverEntityIconOff === "string") {
        colorOff = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOff);
      } else if (import_Color.Color.isRGB(entity.ScreensaverEntityIconOff)) {
        colorOff = { type: "const", constVal: entity.ScreensaverEntityIconOff };
      } else if (import_Color.Color.isScriptRGB(entity.ScreensaverEntityIconOff)) {
        color = { type: "const", constVal: import_Color.Color.convertScriptRGBtoRGB(entity.ScreensaverEntityIconOff) };
      } else {
        this.adapter.log.error(`Invalid color value: ${JSON.stringify(entity.ScreensaverEntityIconOff)}`);
      }
    }
    if (entity.ScreensaverEntityIconOn) {
      result.data.icon = {
        true: { value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOn) }
      };
      if (color) {
        result.data.icon.true.color = color;
      }
    }
    if (entity.ScreensaverEntityIconOff) {
      result.data.icon = {
        false: { value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOff) }
      };
      if (color) {
        result.data.icon.false.color = colorOff;
      }
    }
    if (entity.ScreensaverEntityOnText) {
      result.data.text = { true: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityOnText) };
    } else if (entity.ScreensaverEntityText) {
      result.data.text = { true: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityText) };
    }
    if (entity.ScreensaverEntityOffText) {
      result.data.text = { false: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityOffText) };
    }
    if (isPageItemDataItemsOptions(result)) {
      return result;
    }
    throw new Error("Invalid data");
  }
  async getFieldAsDataItemConfig(possibleId, isTrigger = false) {
    const state = possibleId.endsWith(".") ? void 0 : await this.adapter.getForeignStateAsync(possibleId);
    if (state !== void 0 && state !== null) {
      if (isTrigger) {
        return { type: "triggered", dp: possibleId };
      }
      return { type: "state", dp: possibleId };
    }
    return { type: "const", constVal: possibleId };
  }
}
function isPageItemDataItemsOptions(obj) {
  return obj && obj.modeScr && obj.type === "text" && obj.data && obj.data.entity2;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConfigManager
});
//# sourceMappingURL=config-manager.js.map
