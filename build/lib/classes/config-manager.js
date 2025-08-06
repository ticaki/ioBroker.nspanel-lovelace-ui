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
var config_manager_exports = {};
__export(config_manager_exports, {
  ConfigManager: () => ConfigManager
});
module.exports = __toCommonJS(config_manager_exports);
var import_Color = require("../const/Color");
var configManagerConst = __toESM(require("../const/config-manager-const"));
var import_states_controller = require("../controller/states-controller");
var import_pageQR = require("../pages/pageQR");
var import_pagePower = require("../pages/pagePower");
var import_pageChart = require("../pages/pageChart");
var import_readme = require("../tools/readme");
var import_pages = require("../types/pages");
var Types = __toESM(require("../types/types"));
var import_library = require("./library");
var import_navigation = require("./navigation");
var import_tools = require("../const/tools");
var fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
class ConfigManager extends import_library.BaseClass {
  //private test: ConfigManager.DeviceState;
  colorOn = import_Color.Color.On;
  colorOff = import_Color.Color.Off;
  colorDefault = import_Color.Color.Off;
  dontWrite = false;
  extraConfigLogging = false;
  breakingVersion = "0.6.0";
  statesController;
  constructor(adapter, dontWrite = false) {
    super(adapter, "config-manager");
    this.dontWrite = dontWrite;
    this.statesController = new import_states_controller.StatesControler(adapter);
  }
  /**
   * Sets the script configuration for the panel.
   *
   * @param configuration - The configuration object to set.
   * @returns - A promise that resolves to an array of messages indicating the result of the operation.
   *
   * This method performs the following steps:
   * 1. Merges the provided configuration with the default configuration.
   * 2. Validates the configuration.
   * 3. Checks if the script version meets the required version.
   * 4. Configures the panel settings including topic, name, and colors.
   * 5. Configures the screensaver and pages.
   * 6. Sets up navigation for the panel.
   * 7. Ensures unique page names and handles duplicates.
   * 8. Updates the adapter's foreign object with the new configuration.
   *
   * If any errors occur during the process, they are logged and included in the returned messages..
   */
  async setScriptConfig(configuration) {
    configuration.advancedOptions = Object.assign(
      configManagerConst.defaultConfig.advancedOptions || {},
      configuration.advancedOptions || {}
    );
    const config = Object.assign(configManagerConst.defaultConfig, configuration);
    if (!config || !configManagerConst.isConfig(config, this.adapter)) {
      this.log.error(
        `Invalid configuration from Script: ${config ? config.panelName || config.panelTopic || JSON.stringify(config) : "undefined"}`
      );
      return { messages: ["Invalid configuration"], panelConfig: void 0 };
    }
    let messages = [];
    this.log.info(`Start converting configuration for ${config.panelName || config.panelTopic}`);
    let file = void 0;
    if (fs.existsSync(import_path.default.join(__dirname, "../../script"))) {
      file = fs.readFileSync(import_path.default.join(__dirname, "../../script/example_sendTo_script_iobroker.ts"), "utf8");
    }
    const vTemp = (file == null ? void 0 : file.match(/const.version.+'(\d\.\d\.\d)';/)) || [];
    const scriptVersion = vTemp[1] ? vTemp[1] : "";
    const version = (0, import_tools.getVersionAsNumber)(config.version);
    const requiredVersion = (0, import_tools.getVersionAsNumber)(scriptVersion);
    const breakingVersion = (0, import_tools.getVersionAsNumber)(this.breakingVersion);
    if (version < breakingVersion) {
      messages.push(
        `Update Script! Panel for Topic: ${config.panelTopic} - Script version ${config.version} is too low! Aborted! Required version is >=${this.breakingVersion}!`
      );
      this.log.error(messages[messages.length - 1]);
      return { messages: ["Invalid configuration"], panelConfig: void 0 };
    }
    if (version < requiredVersion) {
      messages.push(
        `Update Script! Panel for Topic: ${config.panelTopic} Script version ${config.version} is lower than the required version ${scriptVersion}!`
      );
      this.log.warn(messages[messages.length - 1]);
    } else if (version > requiredVersion) {
      messages.push(
        `Update Adapter! Panel for Topic: ${config.panelTopic} Script version ${config.version} is higher than the required version ${scriptVersion}!`
      );
      this.log.warn(messages[messages.length - 1]);
    } else {
      messages.push(`Panel for Topic: ${config.panelTopic} Script version ${config.version} is correct!`);
    }
    if (config.advancedOptions && config.advancedOptions.extraConfigLogging) {
      this.extraConfigLogging = true;
      config.advancedOptions.extraConfigLogging = false;
    }
    config.subPages = config.subPages.filter(
      (item) => config.pages.findIndex((item2) => item.uniqueName === item2.uniqueName) === -1
    );
    let panelConfig = { pages: [], navigation: [] };
    if (!config.panelTopic) {
      this.log.error(`Required field panelTopic is missing in ${config.panelName || "unknown"}!`);
      messages.push("Required field panelTopic is missing");
      return { messages, panelConfig: void 0 };
    }
    panelConfig.updated = true;
    if (config.panelTopic.endsWith(".cmnd.CustomSend")) {
      panelConfig.topic = config.panelTopic.split(".").slice(0, -2).join(".");
    } else {
      panelConfig.topic = config.panelTopic;
    }
    if (config.panelName) {
      panelConfig.name = config.panelName;
    } else {
      panelConfig.name = `NSPanel-${config.panelTopic}`;
    }
    if (config.defaultOnColor) {
      this.colorOn = import_Color.Color.convertScriptRGBtoRGB(config.defaultOnColor);
    }
    if (config.defaultOffColor) {
      this.colorOff = import_Color.Color.convertScriptRGBtoRGB(config.defaultOffColor);
    }
    try {
      const screensaver = await this.getScreensaverConfig(config);
      if (screensaver && screensaver.config && (screensaver.config.card === "screensaver" || screensaver.config.card === "screensaver2" || screensaver.config.card === "screensaver3") && config.advancedOptions) {
        screensaver.config.screensaverSwipe = !!config.advancedOptions.screensaverSwipe;
        screensaver.config.screensaverIndicatorButtons = !!config.advancedOptions.screensaverIndicatorButtons;
      }
      panelConfig.pages.push(screensaver);
    } catch (error) {
      messages.push(`Screensaver configuration error - ${error}`);
      this.log.warn(messages[messages.length - 1]);
    }
    if (config.pages.length > 0) {
      for (let a = 0; a < config.pages.length; a++) {
        const page = config.pages[a];
        let uniqueID = "";
        if (page.type === void 0) {
          uniqueID = page.native.uniqueID || "";
        } else {
          uniqueID = page.uniqueName || "";
        }
        if (uniqueID === "") {
          continue;
        }
        panelConfig.navigation.push({
          name: uniqueID,
          left: void 0,
          right: void 0,
          page: uniqueID
        });
      }
      const nav = panelConfig.navigation;
      if (nav && nav.length > 0) {
        const index = nav.findIndex((item) => item.name === "main");
        if (index !== -1) {
          const item = nav.splice(index, 1)[0];
          nav.unshift(item);
        }
      }
      if (panelConfig.navigation.length > 0) {
        panelConfig.navigation = panelConfig.navigation.filter((item) => item != null);
        if (panelConfig.navigation.length > 1) {
          panelConfig.navigation = panelConfig.navigation.map((item, index, array) => {
            if (index === 0) {
              return {
                ...item,
                left: { single: array[array.length - 1].name },
                right: { single: array[index + 1].name }
              };
            } else if (index === array.length - 1) {
              return {
                ...item,
                left: { single: array[index - 1].name },
                right: { single: array[0].name }
              };
            }
            return {
              ...item,
              left: { single: array[index - 1].name },
              right: { single: array[index + 1].name }
            };
          });
        }
        panelConfig.navigation[panelConfig.navigation.length - 1].right = { single: "///service" };
        panelConfig.navigation[0].left = { single: "///service" };
      }
    }
    const names = [];
    let double = false;
    for (const page of config.pages) {
      if (page && page.type !== void 0) {
        if (names.includes(page.uniqueName)) {
          double = true;
          this.log.error(messages[messages.length - 1]);
          messages.push(`Abort - double uniqueName ${page.uniqueName} in config!`);
        } else {
          names.push(page.uniqueName);
        }
      }
    }
    if (double) {
      return { messages, panelConfig: void 0 };
    }
    ({ panelConfig, messages } = await this.getPageConfig(config, panelConfig, messages));
    const nav1 = config.navigation;
    const nav2 = panelConfig.navigation;
    if (nav1 != null && (0, import_navigation.isNavigationItemConfigArray)(nav1) && (0, import_navigation.isNavigationItemConfigArray)(nav2)) {
      panelConfig.navigation = nav1.concat(nav2);
      panelConfig.navigation = panelConfig.navigation.filter(
        (a, p) => a && panelConfig.navigation.findIndex((b) => b && a && b.name === a.name) === p
      );
    }
    if (configManagerConst.isButton(config.buttonLeft)) {
      panelConfig.buttons = panelConfig.buttons || { left: null, right: null };
      panelConfig.buttons.left = config.buttonLeft;
    } else {
      messages.push(`Button left wrong configured!`);
      this.log.warn(messages[messages.length - 1]);
    }
    if (configManagerConst.isButton(config.buttonRight)) {
      panelConfig.buttons = panelConfig.buttons || { left: null, right: null };
      panelConfig.buttons.right = config.buttonRight;
    } else {
      messages.push(`Button right wrong configured!`);
      this.log.warn(messages[messages.length - 1]);
    }
    if (panelConfig.pages.length === 0) {
      messages.push(`No pages found! This needs to be fixed!`);
      this.log.error(messages[messages.length - 1]);
    } else if (panelConfig.navigation.length === 0) {
      messages.push(`No navigation items found! This needs to be fixed!`);
      this.log.error(messages[messages.length - 1]);
    } else if (panelConfig.navigation.findIndex((item) => item && item.name === "main") === -1) {
      messages.push(`No entry found for \u2018main\u2019 in the navigation!`);
      this.log.warn(messages[messages.length - 1]);
    }
    const obj = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
    if (obj && !this.dontWrite) {
      if (!obj.native.scriptConfigRaw || !Array.isArray(obj.native.scriptConfigRaw)) {
        obj.native.scriptConfigRaw = [];
      }
      obj.native.scriptConfigRaw = obj.native.scriptConfigRaw.filter(
        (item, i) => obj.native.scriptConfigRaw.findIndex((item2) => item2.panelTopic === item.panelTopic) === i
      );
      obj.native.scriptConfigRaw = obj.native.scriptConfigRaw.filter(
        (item) => item.panelTopic !== configuration.panelTopic
      );
      obj.native.scriptConfigRaw = obj.native.scriptConfigRaw.filter(
        (item) => this.adapter.config.panels.findIndex((a) => a.topic === item.panelTopic) !== -1
      );
      obj.native.scriptConfig = obj.native.scriptConfig || [];
      obj.native.scriptConfig = obj.native.scriptConfig.filter(
        (item, i) => obj.native.scriptConfig.findIndex((item2) => item2.topic === item.topic) === i
      );
      obj.native.scriptConfig = obj.native.scriptConfig.filter((item) => item.topic !== panelConfig.topic);
      obj.native.scriptConfig = obj.native.scriptConfig.filter(
        (item) => this.adapter.config.panels.findIndex((a) => a.topic === item.topic) !== -1
      );
      obj.native.scriptConfigRaw.push(configuration);
      obj.native.scriptConfig.push(panelConfig);
      await this.adapter.setForeignObjectAsync(this.adapter.namespace, obj);
    }
    messages.push(`done`);
    return { messages: messages.map((a) => a.replaceAll("Error: ", "")), panelConfig };
  }
  async getPageConfig(config, panelConfig, messages) {
    if (panelConfig.pages === void 0) {
      panelConfig.pages = [];
    }
    if (config.pages) {
      for (const page of config.pages.concat(config.subPages || [])) {
        if (!page) {
          continue;
        }
        if (page.type === void 0 && page.native) {
          if ((config.subPages || []).includes(page)) {
            const left = page.prev || page.parent || void 0;
            const right = page.next || page.home || void 0;
            if (left || right) {
              const navItem = {
                name: page.native.uniqueID || "",
                left: left ? page.prev ? { single: left } : { double: left } : void 0,
                right: right ? page.next ? { single: right } : { double: right } : void 0,
                page: page.native.uniqueID
              };
              panelConfig.navigation.push(navItem);
            } else {
              const msg = `Page: ${page.native.uniqueID || "unknown"} dont have any navigation!`;
              messages.push(msg);
              continue;
            }
          }
          if (page.heading) {
            page.native.config = page.native.config || {};
            page.native.config.data = page.native.config.data || {};
            page.native.config.data.headline = await this.getFieldAsDataItemConfig(page.heading);
          }
          panelConfig.pages.push(page.native);
          continue;
        }
        if (page.type !== "cardGrid" && page.type !== "cardGrid2" && page.type !== "cardGrid3" && page.type !== "cardEntities" && page.type !== "cardThermo" && page.type !== "cardQR" && page.type !== "cardPower" && page.type !== "cardChart" && page.type !== "cardLChart") {
          const msg = `${page.heading || "unknown"} with card type ${page.type} not implemented yet!..`;
          messages.push(msg);
          this.log.warn(msg);
          continue;
        }
        if (!page.uniqueName) {
          messages.push(
            `Page ${"heading" in page && page.heading ? page.heading : page.type || "unknown"} has no uniqueName!`
          );
          this.log.error(messages[messages.length - 1]);
          continue;
        }
        if ((config.subPages || []).includes(page)) {
          const left = page.prev || page.parent || void 0;
          let right = page.next || page.home || void 0;
          if (!left && !right) {
            const msg = `Page: ${page.uniqueName} dont have any navigation! Node 'main' provisionally added as home!`;
            messages.push(msg);
            this.log.warn(msg);
            page.home = "main";
            right = page.home;
          }
          if (left || right) {
            const navItem = {
              name: page.uniqueName,
              left: left ? page.prev ? { single: left } : { double: left } : void 0,
              right: right ? page.next ? { single: right } : { double: right } : void 0,
              page: page.uniqueName
            };
            panelConfig.navigation.push(navItem);
          }
        }
        if (page.type === "cardQR") {
          if (!Array.isArray(this.adapter.config.pageQRdata)) {
            messages.push(`No pageQR configured in Admin for ${page.uniqueName}`);
            this.log.warn(messages[messages.length - 1]);
            continue;
          }
          const index = this.adapter.config.pageQRdata.findIndex((item) => item.pageName === page.uniqueName);
          if (index === -1) {
            messages.push(`No pageQRdata found for ${page.uniqueName}`);
            this.log.warn(messages[messages.length - 1]);
            continue;
          }
          panelConfig.pages.push(await import_pageQR.PageQR.getQRPageConfig(this.adapter, index, this));
          continue;
        }
        if (page.type === "cardPower") {
          if (!Array.isArray(this.adapter.config.pagePowerdata)) {
            messages.push(`No pagePower configured in Admin for ${page.uniqueName}`);
            this.log.warn(messages[messages.length - 1]);
            continue;
          }
          const index = this.adapter.config.pagePowerdata.findIndex(
            (item) => item.pageName === page.uniqueName
          );
          if (index === -1) {
            messages.push(`No pagePowerdata found for ${page.uniqueName}`);
            this.log.warn(messages[messages.length - 1]);
            continue;
          }
          panelConfig.pages.push(await import_pagePower.PagePower.getPowerPageConfig(this.adapter, index, this));
          continue;
        }
        if (page.type === "cardChart" || page.type === "cardLChart") {
          if (!Array.isArray(this.adapter.config.pageChartdata)) {
            messages.push(`No pageChart configured in Admin for ${page.uniqueName}`);
            this.log.warn(messages[messages.length - 1]);
            continue;
          }
          const index = this.adapter.config.pageChartdata.findIndex(
            (item) => item.pageName === page.uniqueName
          );
          if (index === -1) {
            messages.push(`No pageChartdata found for ${page.uniqueName}`);
            this.log.warn(messages[messages.length - 1]);
            continue;
          }
          panelConfig.pages.push(await import_pageChart.PageChart.getChartPageConfig(this.adapter, index, this));
          continue;
        }
        let gridItem = {
          dpInit: "",
          alwaysOn: page.alwaysOnDisplay ? typeof page.alwaysOnDisplay === "boolean" ? "always" : "action" : "none",
          uniqueID: page.uniqueName || "",
          useColor: false,
          hidden: page.hiddenByTrigger || false,
          config: {
            card: page.type,
            data: {
              headline: await this.getFieldAsDataItemConfig(page.heading || "")
            }
          },
          pageItems: []
        };
        if (gridItem.config.card === "cardGrid" || gridItem.config.card === "cardGrid2" || gridItem.config.card === "cardGrid3" || gridItem.config.card === "cardEntities") {
          gridItem.config.scrollType = "page";
        }
        try {
          if (page.type === "cardThermo") {
            ({ gridItem, messages } = await this.getPageThermo(page, gridItem, messages));
          }
        } catch (error) {
          messages.push(
            `Configuration error in page ${page.heading || "unknown"} with uniqueName ${page.uniqueName} - ${error}`
          );
          this.log.warn(messages[messages.length - 1]);
          continue;
        }
        if (page.items) {
          for (let a = 0; a < page.items.length; a++) {
            const item = page.items[a];
            if (!item) {
              continue;
            }
            if (page.type === "cardThermo" && a === 0) {
              continue;
            }
            try {
              const temp = await this.getPageItemConfig(item, page, messages);
              const itemConfig = temp.itemConfig;
              messages = temp.messages;
              if (itemConfig && gridItem.pageItems) {
                gridItem.pageItems.push(itemConfig);
              }
            } catch (error) {
              messages.push(
                `Configuration error in page ${page.heading || "unknown"} with uniqueName ${page.uniqueName} - ${error}`
              );
              this.log.warn(messages[messages.length - 1]);
            }
          }
          panelConfig.pages.push(gridItem);
        }
      }
    }
    return { panelConfig, messages };
  }
  async getPageThermo(page, gridItem, messages) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (page.type !== "cardThermo" || !gridItem.config || gridItem.config.card !== "cardThermo") {
      return { gridItem, messages };
    }
    if (!page.items || !page.items[0]) {
      const msg = `${page.uniqueName}: Thermo page has no item or item 0 has no id!`;
      messages.push(msg);
      this.log.warn(msg);
      return { gridItem, messages };
    }
    const item = page.items[0];
    if (!item || !item.id || item.id.endsWith(".")) {
      const msg = `${page.uniqueName} id: ${page.items[0].id} is invalid!`;
      messages.push(msg);
      this.log.error(msg);
      return { gridItem, messages };
    }
    const o = await this.adapter.getForeignObjectAsync(item.id);
    if (!o || !o.common || !o.common.role) {
      const msg = `${page.uniqueName} id: ${page.items[0].id} has a invalid object!`;
      messages.push(msg);
      this.log.error(msg);
      return { gridItem, messages };
    }
    const role = o.common.role;
    if (role !== "thermostat" && role !== "airCondition") {
      const msg = `${page.uniqueName} id: ${page.items[0].id} role '${role}' not supported for cardThermo!`;
      messages.push(msg);
      this.log.error(msg);
      return { gridItem, messages };
    }
    let foundedStates;
    try {
      foundedStates = await this.searchDatapointsForItems(
        configManagerConst.requiredScriptDataPoints,
        role,
        item.id,
        messages
      );
    } catch {
      return { gridItem, messages };
    }
    gridItem.dpInit = item.id;
    gridItem = {
      ...gridItem,
      card: "cardThermo",
      alwaysOn: "none",
      useColor: false,
      items: void 0,
      config: {
        card: "cardThermo",
        data: {
          headline: await this.getFieldAsDataItemConfig(page.heading || "thermostat"),
          mixed1: {
            value: { type: "const", constVal: "Temperature" }
          },
          mixed2: foundedStates[role].ACTUAL ? {
            value: foundedStates[role].ACTUAL,
            factor: { type: "const", constVal: 1 },
            decimal: { type: "const", constVal: 1 },
            unit: item.unit != null ? await this.getFieldAsDataItemConfig(item.unit) : void 0
          } : void 0,
          mixed3: foundedStates[role].HUMIDITY ? {
            value: { type: "const", constVal: "Humidity2" }
          } : void 0,
          mixed4: foundedStates[role].HUMIDITY ? {
            value: foundedStates[role].HUMIDITY,
            factor: { type: "const", constVal: 1 },
            decimal: { type: "const", constVal: 0 },
            unit: { type: "const", constVal: "%" }
          } : void 0,
          tempStep: item.stepValue != null ? await this.getFieldAsDataItemConfig(item.stepValue) : void 0,
          minTemp: item.minValue != null ? await this.getFieldAsDataItemConfig(item.minValue) : void 0,
          maxTemp: item.maxValue != null ? await this.getFieldAsDataItemConfig(item.maxValue) : void 0,
          unit: item.unit != null ? await this.getFieldAsDataItemConfig(item.unit) : void 0,
          set1: foundedStates[role].SET,
          set2: role === "airCondition" ? foundedStates[role].SET2 : void 0
        }
      },
      pageItems: []
    };
    gridItem.pageItems = gridItem.pageItems || [];
    if (role === "thermostat" || role === "airCondition" && !foundedStates[role].MODE) {
      if (foundedStates[role].AUTOMATIC && !foundedStates[role].MANUAL) {
        foundedStates[role].MANUAL = JSON.parse(JSON.stringify(foundedStates[role].AUTOMATIC));
        if (foundedStates[role].MANUAL.type === "triggered") {
          foundedStates[role].MANUAL.read = "return !val";
          foundedStates[role].MANUAL.write = "return !val";
        }
      } else if (!foundedStates[role].AUTOMATIC && foundedStates[role].MANUAL) {
        foundedStates[role].AUTOMATIC = JSON.parse(JSON.stringify(foundedStates[role].MANUAL));
        if (foundedStates[role].AUTOMATIC.type === "triggered") {
          foundedStates[role].AUTOMATIC.read = "return !val";
          foundedStates[role].AUTOMATIC.write = "return !val";
        }
      }
      if (foundedStates[role].AUTOMATIC) {
        gridItem.pageItems.push({
          role: "button",
          type: "button",
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "alpha-a-circle" },
                color: { type: "const", constVal: import_Color.Color.activated }
              },
              false: {
                value: { type: "const", constVal: "alpha-a-circle-outline" },
                color: { type: "const", constVal: import_Color.Color.deactivated }
              }
            },
            entity1: {
              value: foundedStates[role].AUTOMATIC,
              set: foundedStates[role].AUTOMATIC
            }
          }
        });
      }
      if (foundedStates[role].MANUAL) {
        gridItem.pageItems.push({
          role: "button",
          type: "button",
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "alpha-m-circle" },
                color: { type: "const", constVal: import_Color.Color.activated }
              },
              false: {
                value: { type: "const", constVal: "alpha-m-circle-outline" },
                color: { type: "const", constVal: import_Color.Color.deactivated }
              }
            },
            entity1: {
              value: foundedStates[role].MANUAL,
              set: foundedStates[role].MANUAL
            }
          }
        });
      }
      if (foundedStates[role].OFF) {
        gridItem.pageItems.push({
          role: "button",
          type: "button",
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "power-off" },
                color: { type: "const", constVal: import_Color.Color.activated }
              },
              false: {
                value: { type: "const", constVal: "power-off" },
                color: { type: "const", constVal: import_Color.Color.deactivated }
              }
            },
            entity1: {
              value: foundedStates[role].OFF,
              set: foundedStates[role].OFF
            }
          }
        });
      }
    } else if ((_a = foundedStates[role]) == null ? void 0 : _a.MODE) {
      let states = ["OFF", "AUTO", "COOL", "HEAT", "ECO", "FAN", "DRY"];
      if (foundedStates[role].MODE.dp) {
        const o2 = await this.adapter.getForeignObjectAsync(foundedStates[role].MODE.dp);
        if ((_b = o2 == null ? void 0 : o2.common) == null ? void 0 : _b.states) {
          states = o2.common.states;
        }
      }
      const tempItem = {
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "power-off" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: void 0,
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: { ...foundedStates[role].MODE, read: `return val == index}` },
            set: { ...foundedStates[role].MODE, write: `return index}` }
          }
        }
      };
      if (((_d = (_c = tempItem == null ? void 0 : tempItem.data) == null ? void 0 : _c.icon) == null ? void 0 : _d.true) && ((_f = (_e = tempItem == null ? void 0 : tempItem.data) == null ? void 0 : _e.icon) == null ? void 0 : _f.false) && ((_g = tempItem == null ? void 0 : tempItem.data) == null ? void 0 : _g.entity1)) {
        let index = typeof states == "object" ? Array.isArray(states) ? states.findIndex((item2) => item2 === "OFF") : states.OFF !== void 0 ? "OFF" : -1 : -1;
        if (index != -1) {
          tempItem.data.icon.true.value = { type: "const", constVal: "power-off" };
          tempItem.data.entity1.value = { ...foundedStates[role].MODE, read: `return val == ${index}` };
          tempItem.data.entity1.set = { ...foundedStates[role].MODE, write: `return ${index}` };
          gridItem.pageItems.push(JSON.parse(JSON.stringify(tempItem)));
        }
        index = typeof states == "object" ? Array.isArray(states) ? states.findIndex((item2) => item2 === "AUTO") : states.AUTO !== void 0 ? "AUTO" : -1 : -1;
        if (index != -1) {
          tempItem.data.icon.true.value = { type: "const", constVal: "alpha-a-circle" };
          tempItem.data.icon.false.value = { type: "const", constVal: "alpha-a-circle-outline" };
          tempItem.data.entity1.value = { ...foundedStates[role].MODE, read: `return val == ${index}` };
          tempItem.data.entity1.set = { ...foundedStates[role].MODE, write: `return ${index}` };
          gridItem.pageItems.push(JSON.parse(JSON.stringify(tempItem)));
        }
        index = typeof states == "object" ? Array.isArray(states) ? states.findIndex((item2) => item2 === "COOL") : states.COOL !== void 0 ? "COOL" : -1 : -1;
        if (index != -1) {
          tempItem.data.icon.true.value = { type: "const", constVal: "snowflake" };
          tempItem.data.entity1.value = { ...foundedStates[role].MODE, read: `return val == ${index}` };
          tempItem.data.entity1.set = { ...foundedStates[role].MODE, write: `return ${index}` };
          gridItem.pageItems.push(JSON.parse(JSON.stringify(tempItem)));
        }
        let token = "HEAT";
        index = typeof states == "object" ? Array.isArray(states) ? states.findIndex((item2) => item2 === token) : states[token] !== void 0 ? token : -1 : -1;
        if (index != -1) {
          tempItem.data.icon.true.value = { type: "const", constVal: "fire" };
          tempItem.data.entity1.value = { ...foundedStates[role].MODE, read: `return val == ${index}` };
          tempItem.data.entity1.set = { ...foundedStates[role].MODE, write: `return ${index}` };
          gridItem.pageItems.push(JSON.parse(JSON.stringify(tempItem)));
        }
        token = "ECO";
        index = typeof states == "object" ? Array.isArray(states) ? states.findIndex((item2) => item2 === token) : states[token] !== void 0 ? token : -1 : -1;
        if (index != -1) {
          tempItem.data.icon.true.value = { type: "const", constVal: "alpha-e-circle-outline" };
          tempItem.data.entity1.value = { ...foundedStates[role].MODE, read: `return val == ${index}` };
          tempItem.data.entity1.set = { ...foundedStates[role].MODE, write: `return ${index}` };
          gridItem.pageItems.push(JSON.parse(JSON.stringify(tempItem)));
        }
        token = "FAN_ONLY";
        index = typeof states == "object" ? Array.isArray(states) ? states.findIndex((item2) => item2 === token) : states[token] !== void 0 ? token : -1 : -1;
        if (index != -1) {
          tempItem.data.icon.true.value = { type: "const", constVal: "fan" };
          tempItem.data.entity1.value = { ...foundedStates[role].MODE, read: `return val == ${index}` };
          tempItem.data.entity1.set = { ...foundedStates[role].MODE, write: `return ${index}` };
          gridItem.pageItems.push(JSON.parse(JSON.stringify(tempItem)));
        }
        token = "DRY";
        index = typeof states == "object" ? Array.isArray(states) ? states.findIndex((item2) => item2 === token) : states[token] !== void 0 ? token : -1 : -1;
        if (index != -1) {
          tempItem.data.icon.true.value = { type: "const", constVal: "water-percent" };
          tempItem.data.entity1.value = { ...foundedStates[role].MODE, read: `return val == ${index}` };
          tempItem.data.entity1.set = { ...foundedStates[role].MODE, write: `return ${index}` };
          gridItem.pageItems.push(JSON.parse(JSON.stringify(tempItem)));
        }
      }
    }
    if (foundedStates[role].POWER) {
      gridItem.pageItems.push({
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "power-standby" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "power-standby" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: foundedStates[role].POWER,
            set: foundedStates[role].POWER
          }
        }
      });
    }
    if (foundedStates[role].BOOST) {
      gridItem.pageItems.push({
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "fast-forward-60" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "fast-forward-60" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: foundedStates[role].BOOST,
            set: foundedStates[role].BOOST
          }
        }
      });
    }
    if (foundedStates[role].WINDOWOPEN) {
      gridItem.pageItems.push({
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "window-open-variant" },
              color: { type: "const", constVal: import_Color.Color.open }
            },
            false: {
              value: { type: "const", constVal: "window-closed-variant" },
              color: { type: "const", constVal: import_Color.Color.close }
            }
          },
          entity1: {
            value: foundedStates[role].WINDOWOPEN
          }
        }
      });
    }
    if (foundedStates[role].PARTY) {
      gridItem.pageItems.push({
        role: "button",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "party-popper" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "party-popper" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: foundedStates[role].PARTY,
            set: foundedStates[role].PARTY
          }
        }
      });
    }
    if (foundedStates[role].MAINTAIN) {
      gridItem.pageItems.push({
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "account-wrench" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "account-wrench" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: foundedStates[role].MAINTAIN
          }
        }
      });
    }
    if (foundedStates[role].UNREACH) {
      gridItem.pageItems.push({
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "wifi-off" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "wifi" },
              color: { type: "const", constVal: import_Color.Color.good }
            }
          },
          entity1: {
            value: foundedStates[role].UNREACH
          }
        }
      });
    }
    if (foundedStates[role].MAINTAIN) {
      gridItem.pageItems.push({
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "account-wrench" },
              color: { type: "const", constVal: import_Color.Color.true }
            },
            false: {
              value: { type: "const", constVal: "account-wrench" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: foundedStates[role].MAINTAIN
          }
        }
      });
    }
    if (foundedStates[role].LOWBAT) {
      gridItem.pageItems.push({
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "battery-low" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "battery-high" },
              color: { type: "const", constVal: import_Color.Color.good }
            }
          },
          entity1: {
            value: foundedStates[role].LOWBAT
          }
        }
      });
    }
    if (foundedStates[role].ERROR) {
      gridItem.pageItems.push({
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "alert-circle" },
              color: { type: "const", constVal: import_Color.Color.bad }
            },
            false: {
              value: { type: "const", constVal: "alert-circle" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: foundedStates[role].ERROR
          }
        }
      });
    }
    if (foundedStates[role].VACATION) {
      gridItem.pageItems.push({
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "palm-tree" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "palm-tree" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: foundedStates[role].VACATION
          }
        }
      });
    }
    if (foundedStates[role].WORKING) {
      gridItem.pageItems.push({
        role: "indicator",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "briefcase-check" },
              color: { type: "const", constVal: import_Color.Color.activated }
            },
            false: {
              value: { type: "const", constVal: "briefcase-check" },
              color: { type: "const", constVal: import_Color.Color.deactivated }
            }
          },
          entity1: {
            value: foundedStates[role].WORKING
          }
        }
      });
    }
    if (item.setThermoAlias) {
      if (item.popupThermoMode1 && item.setThermoAlias[0] && await this.existsState(item.setThermoAlias[0])) {
        gridItem.pageItems.push({
          role: "",
          type: "input_sel",
          dpInit: "",
          data: {
            entityInSel: {
              value: { type: "triggered", dp: item.setThermoAlias[0] }
            },
            color: {
              true: await this.getIconColor(item.onColor, this.colorOn),
              false: await this.getIconColor(item.onColor, this.colorOn)
            },
            headline: item.name ? await this.getFieldAsDataItemConfig(item.name) : void 0,
            valueList: { type: "const", constVal: item.popupThermoMode1 }
          }
        });
      }
      if (item.popupThermoMode2 && item.setThermoAlias[1] && await this.existsState(item.setThermoAlias[1])) {
        gridItem.pageItems.push({
          role: "",
          type: "input_sel",
          dpInit: "",
          data: {
            entityInSel: {
              value: { type: "triggered", dp: item.setThermoAlias[1] }
            },
            color: {
              true: await this.getIconColor(item.onColor, this.colorOn),
              false: await this.getIconColor(item.onColor, this.colorOn)
            },
            headline: item.name ? await this.getFieldAsDataItemConfig(item.name) : void 0,
            valueList: { type: "const", constVal: item.popupThermoMode2 }
          }
        });
      }
      if (item.popupThermoMode3 && item.setThermoAlias[2] && await this.existsState(item.setThermoAlias[2])) {
        gridItem.pageItems.push({
          role: "",
          type: "input_sel",
          dpInit: "",
          data: {
            entityInSel: {
              value: { type: "triggered", dp: item.setThermoAlias[2] }
            },
            color: {
              true: await this.getIconColor(item.onColor, this.colorOn),
              false: await this.getIconColor(item.onColor, this.colorOn)
            },
            headline: item.name ? await this.getFieldAsDataItemConfig(item.name) : void 0,
            valueList: { type: "const", constVal: item.popupThermoMode3 }
          }
        });
      }
    }
    return { gridItem, messages };
  }
  async getPageNaviItemConfig(item, page) {
    var _a, _b, _c, _d;
    if (!(page.type === "cardGrid" || page.type === "cardGrid2" || page.type === "cardGrid3" || page.type === "cardEntities") || !item.targetPage || !item.navigate) {
      this.log.warn(`Page type ${page.type} not supported for navigation item!`);
      return void 0;
    }
    let itemConfig = void 0;
    const specialRole = page.type === "cardGrid" || page.type === "cardGrid2" || page.type === "cardGrid3" ? "textNotIcon" : "iconNotText";
    const obj = item.id && !item.id.endsWith(".") ? await this.adapter.getForeignObjectAsync(item.id) : void 0;
    if (obj && (!obj.common || !obj.common.role)) {
      throw new Error(`Role missing in ${page.uniqueName}.${item.id}!`);
    }
    const role = obj ? obj.common.role : null;
    const commonName = obj && obj.common ? typeof obj.common.name === "string" ? obj.common.name : obj.common.name[this.library.getLocalLanguage()] : void 0;
    const getButtonsTextTrue = async (item2, def1) => {
      return item2.buttonText ? await this.getFieldAsDataItemConfig(item2.buttonText) : await this.existsState(`${item2.id}.BUTTONTEXT`) ? { type: "triggered", dp: `${item2.id}.BUTTONTEXT` } : await this.getFieldAsDataItemConfig(item2.name || commonName || def1);
    };
    const getButtonsTextFalse = async (item2, def1 = "") => {
      return item2.buttonTextOff ? await this.getFieldAsDataItemConfig(item2.buttonTextOff) : await this.existsState(`${item2.id}.BUTTONTEXTOFF`) ? { type: "triggered", dp: `${item2.id}.BUTTONTEXTOFF` } : item2.buttonText ? await this.getFieldAsDataItemConfig(item2.buttonText) : await this.existsState(`${item2.id}.BUTTONTEXT`) ? { type: "triggered", dp: `${item2.id}.BUTTONTEXT` } : await this.getFieldAsDataItemConfig(item2.name || commonName || def1);
    };
    const text = {
      true: await getButtonsTextTrue(item, role || ""),
      false: await getButtonsTextFalse(item, role || ""),
      textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0,
      prefix: item.prefixName ? await this.getFieldAsDataItemConfig(item.prefixName) : void 0,
      suffix: item.suffixName ? await this.getFieldAsDataItemConfig(item.suffixName) : void 0
    };
    if (!item.id) {
      return {
        type: "button",
        data: {
          setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0,
          icon: {
            true: {
              value: {
                type: "const",
                constVal: item.icon || "gesture-tap-button"
              },
              color: await this.getIconColor(item.onColor, this.colorOn)
            },
            scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
            maxBri: void 0,
            minBri: void 0
          },
          text1: {
            true: { type: "const", constVal: "press" }
          },
          text
        }
      };
    }
    if (obj && (!obj.common || !obj.common.role) || role == null) {
      throw new Error(`Role missing in ${page.uniqueName}.${item.id}!`);
    }
    if (!configManagerConst.requiredScriptDataPoints[role]) {
      this.log.warn(`Channel role ${role} not supported!`);
      throw new Error(`Channel role ${role} not supported!`);
    }
    const foundedStates = await this.searchDatapointsForItems(
      configManagerConst.requiredScriptDataPoints,
      role,
      item.id,
      []
    );
    item.icon2 = item.icon2 || item.icon;
    switch (role) {
      case "socket": {
        let icon;
        let icon2;
        if (item.role) {
          switch (item.role) {
            case "socket": {
              icon = "power-socket-de";
              icon2 = "power-socket-de";
              break;
            }
          }
        }
        icon = item.icon || icon || "power";
        icon2 = item.icon2 || icon2 || "power-standby";
        const tempItem = {
          type: "button",
          role: "button",
          data: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: icon
                },
                color: await this.getIconColor(item.onColor, this.colorOn)
              },
              false: {
                value: {
                  type: "const",
                  constVal: icon2
                },
                color: await this.getIconColor(item.offColor, this.colorOff)
              },
              scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
              maxBri: void 0,
              minBri: void 0
            },
            text1: {
              true: { type: "const", constVal: "on" },
              false: { type: "const", constVal: "off" }
            },
            text,
            entity1: {
              value: foundedStates[role].ACTUAL
            },
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        itemConfig = tempItem;
        break;
      }
      case "light":
      case "dimmer":
      case "hue":
      case "rgb":
      case "rgbSingle":
      case "ct": {
        const tempItem = {
          type: "button",
          role: role === "rgb" ? "rgbThree" : role,
          data: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: item.icon || "lightbulb"
                },
                color: await this.getIconColor(item.onColor, this.colorOn)
              },
              false: {
                value: {
                  type: "const",
                  constVal: item.icon2 || "lightbulb-outline"
                },
                color: await this.getIconColor(item.offColor, this.colorOff)
              },
              scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
              maxBri: void 0,
              minBri: void 0
            },
            text1: {
              true: { type: "const", constVal: "on" },
              false: { type: "const", constVal: "off" }
            },
            text,
            entity1: { value: foundedStates[role].ON_ACTUAL },
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        itemConfig = tempItem;
        break;
      }
      case void 0:
      case "button": {
        const tempItem = {
          type: "button",
          role: "button",
          data: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: item.icon || "gesture-tap-button"
                },
                color: await this.getIconColor(item.onColor, this.colorOn)
              },
              false: {
                value: {
                  type: "const",
                  constVal: item.icon2 || "gesture-tap-button"
                },
                color: await this.getIconColor(item.offColor, this.colorOff)
              },
              scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
              maxBri: void 0,
              minBri: void 0
            },
            text1: {
              true: { type: "const", constVal: "on" },
              false: { type: "const", constVal: "off" }
            },
            text,
            entity1: {
              value: foundedStates[role].ACTUAL
            },
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        itemConfig = tempItem;
        break;
      }
      case "value.humidity":
      case "humidity": {
        let commonUnit = "";
        if (foundedStates[role].ACTUAL && foundedStates[role].ACTUAL.dp) {
          const o = await this.adapter.getForeignObjectAsync(foundedStates[role].ACTUAL.dp);
          if (o && o.common && o.common.unit) {
            commonUnit = o.common.unit;
          }
        }
        itemConfig = {
          type: "button",
          dpInit: item.id,
          role: specialRole,
          template: "button.humidity",
          data: {
            entity1: {
              value: foundedStates[role].ACTUAL,
              unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0
            },
            icon: {
              true: {
                value: item.icon ? { type: "const", constVal: item.icon } : void 0,
                color: await this.getIconColor(item.onColor, this.colorOn),
                text: {
                  value: foundedStates[role].ACTUAL,
                  unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0,
                  textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0
                }
              },
              false: {
                value: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0,
                color: await this.getIconColor(item.offColor, this.colorOff),
                text: {
                  value: foundedStates[role].ACTUAL,
                  unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0,
                  textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0
                }
              },
              scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : {
                type: "const",
                constVal: { val_min: 0, val_max: 100, val_best: 50, mode: "triGrad" }
              }
            },
            text,
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "value.temperature":
      case "temperature":
      case "airCondition":
      case "thermostat": {
        let commonUnit = "";
        if (foundedStates[role].ACTUAL && foundedStates[role].ACTUAL.dp) {
          const o = await this.adapter.getForeignObjectAsync(foundedStates[role].ACTUAL.dp);
          if (o && o.common && o.common.unit) {
            commonUnit = o.common.unit;
          }
        }
        itemConfig = {
          type: "button",
          dpInit: item.id,
          role: specialRole,
          template: "button.temperature",
          data: {
            entity1: {
              value: foundedStates[role].ACTUAL,
              unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0
            },
            icon: {
              true: {
                value: item.icon ? { type: "const", constVal: item.icon } : void 0,
                color: await this.getIconColor(item.onColor, this.colorOn),
                text: {
                  value: foundedStates[role].ACTUAL,
                  unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0,
                  textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0
                }
              },
              false: {
                value: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0,
                color: await this.getIconColor(item.offColor, this.colorOff),
                text: {
                  value: foundedStates[role].ACTUAL,
                  unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0,
                  textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0
                }
              },
              scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0
            },
            text,
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "gate": {
        let tempMinScale = 100;
        let tempMaxScale = 0;
        if (this.adapter.config.shutterClosedIsZero) {
          tempMinScale = 0;
          tempMaxScale = 100;
        }
        if (await this.checkRequiredDatapoints("gate", item, "feature")) {
          itemConfig = {
            template: "text.gate.isOpen",
            dpInit: item.id,
            type: "button",
            color: {
              true: await this.getIconColor(item.onColor, this.colorOn),
              false: await this.getIconColor(item.offColor, this.colorOff),
              scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
            },
            icon: {
              true: item.icon ? { type: "const", constVal: item.icon } : void 0,
              false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
            },
            data: {
              text,
              text1: {
                true: { type: "const", constVal: "opened" },
                false: { type: "const", constVal: "closed" }
              },
              entity1: {
                value: foundedStates[role].ACTUAL,
                minScale: { type: "const", constVal: (_a = item.minValueLevel) != null ? _a : tempMinScale },
                maxScale: { type: "const", constVal: (_b = item.maxValueLevel) != null ? _b : tempMaxScale }
              },
              setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
            }
          };
        } else {
          itemConfig = {
            template: "text.gate.isOpen",
            dpInit: item.id,
            type: "button",
            color: {
              true: await this.getIconColor(item.onColor, this.colorOn),
              false: await this.getIconColor(item.offColor, this.colorOff),
              scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
            },
            icon: {
              true: item.icon ? { type: "const", constVal: item.icon } : void 0,
              false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
            },
            data: {
              entity1: { value: foundedStates[role].ACTUAL },
              text,
              text1: {
                true: { type: "const", constVal: "opened" },
                false: { type: "const", constVal: "closed" }
              },
              setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
            }
          };
        }
        break;
      }
      case "door": {
        itemConfig = {
          template: "text.door.isOpen",
          dpInit: item.id,
          type: "button",
          color: {
            true: await this.getIconColor(item.onColor, this.colorOn),
            false: await this.getIconColor(item.offColor, this.colorOff),
            scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
          },
          data: {
            entity1: { value: foundedStates[role].ACTUAL },
            text1: {
              true: { type: "const", constVal: "opened" },
              false: { type: "const", constVal: "closed" }
            },
            text,
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "window": {
        itemConfig = {
          template: "text.window.isOpen",
          dpInit: item.id,
          type: "button",
          color: {
            true: await this.getIconColor(item.onColor, this.colorOn),
            false: await this.getIconColor(item.offColor, this.colorOff),
            scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
          },
          data: {
            entity1: { value: foundedStates[role].ACTUAL },
            text1: {
              true: { type: "const", constVal: "opened" },
              false: { type: "const", constVal: "closed" }
            },
            text,
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "motion": {
        itemConfig = {
          template: "text.motion",
          dpInit: item.id,
          type: "button",
          color: {
            true: await this.getIconColor(item.onColor, this.colorOn),
            false: await this.getIconColor(item.offColor, this.colorOff),
            scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
          },
          data: {
            entity1: { value: foundedStates[role].ACTUAL },
            text1: {
              true: { type: "const", constVal: "motion" },
              false: { type: "const", constVal: "none" }
            },
            text,
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "volume": {
        let commonUnit = "";
        if (foundedStates[role].ACTUAL && foundedStates[role].ACTUAL.dp) {
          const o = await this.adapter.getForeignObjectAsync(foundedStates[role].ACTUAL.dp);
          if (o && o.common && o.common.unit) {
            commonUnit = o.common.unit;
          }
        }
        itemConfig = {
          template: "button.volume",
          dpInit: item.id,
          type: "button",
          color: {
            true: await this.getIconColor(item.onColor, this.colorOn),
            false: await this.getIconColor(item.offColor, this.colorOff),
            scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
          },
          data: {
            entity1: {
              value: foundedStates[role].ACTUAL,
              unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0
            },
            text,
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "warning": {
        itemConfig = {
          template: "text.warning",
          dpInit: item.id,
          type: "button",
          color: {
            true: await this.getIconColor(item.onColor, this.colorOn),
            false: await this.getIconColor(item.offColor, this.colorOff),
            scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
          },
          data: {
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "info": {
        itemConfig = {
          template: "text.info",
          dpInit: item.id,
          type: "button",
          role: "info",
          color: {
            true: await this.getIconColor(item.onColor || `${item.id}.COLORDEC`, this.colorOn),
            false: await this.getIconColor(item.offColor || `${item.id}.COLORDEC`, this.colorOff),
            scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : item.icon ? { type: "const", constVal: item.icon } : void 0
          },
          data: {
            text,
            text1: {
              true: foundedStates[role].ACTUAL,
              false: null
            },
            entity1: {
              value: foundedStates[role].ACTUAL
            },
            entity2: {
              value: foundedStates[role].ACTUAL
            },
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "blind": {
        let tempMinScale = 100;
        let tempMaxScale = 0;
        if (this.adapter.config.shutterClosedIsZero) {
          tempMinScale = 0;
          tempMaxScale = 100;
        }
        itemConfig = {
          template: "text.shutter.navigation",
          dpInit: item.id,
          type: "button",
          color: {
            true: await this.getIconColor(item.onColor, this.colorOn),
            false: await this.getIconColor(item.offColor, this.colorOff),
            scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
          },
          data: {
            text1: {
              true: { type: "const", constVal: "opened" },
              false: { type: "const", constVal: "closed" }
            },
            text,
            entity1: {
              value: foundedStates[role].ACTUAL,
              minScale: { type: "const", constVal: (_c = item.minValueLevel) != null ? _c : tempMinScale },
              maxScale: { type: "const", constVal: (_d = item.maxValueLevel) != null ? _d : tempMaxScale }
            },
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "timeTable":
        break;
      case "select": {
        itemConfig = {
          type: "button",
          dpInit: item.id,
          role: "",
          template: "button.select",
          color: {
            true: await this.getIconColor(item.onColor, this.colorOn),
            false: await this.getIconColor(item.offColor, this.colorOff),
            scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
          },
          data: {
            entity1: {
              value: foundedStates[role].ACTUAL
              //set: foundedStates[role].SET,
            },
            text,
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "lock": {
        itemConfig = {
          template: "text.lock",
          dpInit: item.id,
          type: "button",
          role: "",
          color: {
            true: await this.getIconColor(item.onColor, this.colorOn),
            false: await this.getIconColor(item.offColor, this.colorOff),
            scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
          },
          data: {
            text,
            entity1: foundedStates[role].ACTUAL ? { value: foundedStates[role].ACTUAL } : { value: foundedStates[role].SET },
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "slider": {
        let commonUnit = "";
        if (foundedStates[role].ACTUAL && foundedStates[role].ACTUAL.dp) {
          const o = await this.adapter.getForeignObjectAsync(foundedStates[role].ACTUAL.dp);
          if (o && o.common && o.common.unit) {
            commonUnit = o.common.unit;
          }
        }
        itemConfig = {
          template: "button.slider",
          dpInit: item.id,
          type: "button",
          color: {
            true: await this.getIconColor(item.onColor, this.colorOn),
            false: await this.getIconColor(item.offColor, this.colorOff),
            scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
          },
          data: {
            entity1: {
              value: foundedStates[role].ACTUAL,
              unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0
            },
            text,
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "level.timer": {
        itemConfig = {
          role: "button",
          type: "button",
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: item.icon || "timer" },
                color: await this.getIconColor(item.onColor, this.colorOn)
              },
              false: {
                value: { type: "const", constVal: item.icon2 || "timer" },
                color: await this.getIconColor(item.offColor, this.colorOff)
              },
              scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0
            },
            entity1: foundedStates[role].ACTUAL ? {
              value: foundedStates[role].ACTUAL
            } : void 0,
            text,
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      //case 'cie':
      case "sensor.alarm.flood": {
        throw new Error(
          `DP: ${page.uniqueName}.${item.id} - Navigation for channel: ${role} not implemented yet!!`
        );
      }
      case "level.mode.fan": {
        itemConfig = {
          type: "button",
          dpInit: item.id,
          role: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: item.icon || "fan" },
                color: { type: "const", constVal: item.onColor || import_Color.Color.Green }
              },
              false: {
                value: { type: "const", constVal: item.icon2 || "fan-off" },
                color: { type: "const", constVal: item.offColor || import_Color.Color.Red }
              }
            },
            entity1: {
              value: foundedStates[role].ACTUAL
              //set: foundedStates[role].SET,
            },
            text,
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      default:
        (0, import_pages.exhaustiveCheck)(role);
        throw new Error(`DP: ${page.uniqueName}.${item.id} - Channel role ${role} is not supported!!!`);
    }
    return itemConfig;
  }
  async searchDatapointsForItems(db, role, dpInit, messages) {
    const result = JSON.parse(
      JSON.stringify(configManagerConst.checkedDatapoints)
    );
    let ups = false;
    if (db[role] && db[role].data && result[role]) {
      const data = db[role].data;
      for (const d in data) {
        const dp = d;
        if (!data[dp] || !this.statesController) {
          continue;
        }
        const entry = data[dp];
        if (dp in result[role]) {
          const dp2 = dp;
          result[role][dp2] = await this.statesController.getIdbyAuto(
            `${dpInit}.`,
            entry.role,
            "",
            entry.useKey ? new RegExp(`.${dp}$`.replaceAll(".", "\\.")) : void 0,
            entry.trigger,
            entry.writeable,
            entry.type
          );
          const alternate = entry.alternate;
          if (!result[role][dp2] && alternate && data[alternate]) {
            const entry2 = data[alternate];
            result[role][dp2] = await this.statesController.getIdbyAuto(
              `${dpInit}.`,
              entry2.role,
              "",
              entry2.useKey ? new RegExp(`.${alternate}$`.replaceAll(".", "\\.")) : void 0,
              entry.trigger,
              entry2.writeable,
              entry.type
            );
          }
          if (!result[role][dp2]) {
            if (entry.required || this.extraConfigLogging) {
              messages.push(
                `${entry.required ? "Required:" : "Optional:"} ${dp}: ${dpInit}, channel role: ${role} - missing - searching for ${entry.useKey ? `dp end: ${dp}, ` : ""}type: ${JSON.stringify(entry.type)}, role: ${JSON.stringify(entry.role)}${entry.writeable ? ", common.write: true" : ""}`
              );
              if (entry.required) {
                ups = true;
                this.log.error(messages[messages.length - 1]);
              } else {
                this.log.info(messages[messages.length - 1]);
              }
            }
          }
        } else {
          this.log.error(
            `Channel role ${role} - key: ${dp} not found in checkedDatapoints! Please check code!`
          );
        }
      }
      if (ups) {
        throw new Error("Missing datapoints! check log for details");
      }
    } else {
      throw new Error(`Role ${role} not supported!`);
    }
    return result;
  }
  async getPageItemConfig(item, page, messages = []) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
    let itemConfig = void 0;
    if (item.navigate) {
      if (!item.targetPage || typeof item.targetPage !== "string") {
        throw new Error(`TargetPage missing in ${item && item.id || "no id"}!`);
      }
      return { itemConfig: await this.getPageNaviItemConfig(item, page), messages };
    }
    if (item.id && !item.id.endsWith(".")) {
      const obj = await this.adapter.getForeignObjectAsync(item.id);
      if (obj) {
        if (!(obj.common && obj.common.role)) {
          throw new Error(`Role missing in^${item.id}!`);
        }
        const role = obj.common.role;
        if (!configManagerConst.requiredScriptDataPoints[role]) {
          this.log.warn(`Channel role ${role} not supported!`);
          throw new Error(`Channel role ${role} not supported!`);
        }
        const foundedStates = await this.searchDatapointsForItems(
          configManagerConst.requiredScriptDataPoints,
          role,
          item.id,
          messages
        );
        const specialRole = page.type === "cardGrid" || page.type === "cardGrid2" || page.type === "cardGrid3" ? "textNotIcon" : "iconNotText";
        const commonName = typeof obj.common.name === "string" ? obj.common.name : obj.common.name[this.library.getLocalLanguage()];
        const getButtonsTextTrue = async (item2, def1) => {
          return item2.buttonText ? await this.getFieldAsDataItemConfig(item2.buttonText) : await this.existsState(`${item2.id}.BUTTONTEXT`) ? { type: "triggered", dp: `${item2.id}.BUTTONTEXT` } : await this.getFieldAsDataItemConfig(item2.name || commonName || def1);
        };
        const getButtonsTextFalse = async (item2, def1 = "") => {
          return item2.buttonTextOff ? await this.getFieldAsDataItemConfig(item2.buttonTextOff) : await this.existsState(`${item2.id}.BUTTONTEXTOFF`) ? { type: "triggered", dp: `${item2.id}.BUTTONTEXTOFF` } : item2.buttonText ? await this.getFieldAsDataItemConfig(item2.buttonText) : await this.existsState(`${item2.id}.BUTTONTEXT`) ? { type: "triggered", dp: `${item2.id}.BUTTONTEXT` } : await this.getFieldAsDataItemConfig(item2.name || commonName || def1);
        };
        const text = {
          true: await getButtonsTextTrue(item, role || ""),
          false: await getButtonsTextFalse(item, role || ""),
          textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0,
          prefix: item.prefixName ? await this.getFieldAsDataItemConfig(item.prefixName) : void 0,
          suffix: item.suffixName ? await this.getFieldAsDataItemConfig(item.suffixName) : void 0
        };
        const headline = await getButtonsTextTrue(item, role || "");
        item.icon2 = item.icon2 || item.icon;
        switch (role) {
          case "timeTable": {
            itemConfig = {
              template: "text.alias.fahrplan.departure",
              dpInit: item.id
            };
            break;
          }
          case "socket": {
            let icon;
            let icon2;
            if (item.role) {
              switch (item.role) {
                case "socket": {
                  icon = "power-socket-de";
                  icon2 = "power-socket-de";
                  break;
                }
              }
            }
            icon = item.icon || icon || "power";
            icon2 = item.icon2 || icon2 || "power-standby";
            const tempItem = {
              type: "switch",
              role: "",
              data: {
                icon: {
                  true: {
                    value: { type: "const", constVal: icon },
                    color: await this.getIconColor(item.onColor, this.colorOn)
                  },
                  false: {
                    value: { type: "const", constVal: icon2 },
                    color: await this.getIconColor(item.offColor, this.colorOff)
                  },
                  scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
                  maxBri: void 0,
                  minBri: void 0
                },
                text,
                entity1: {
                  value: foundedStates[role].ACTUAL,
                  set: foundedStates[role].SET
                }
              }
            };
            itemConfig = tempItem;
            break;
          }
          case "light": {
            const tempItem = {
              type: "light",
              role: "light",
              data: {
                icon: {
                  true: {
                    value: {
                      type: "const",
                      constVal: item.icon || "lightbulb"
                    },
                    color: await this.getIconColor(item.onColor, this.colorOn)
                  },
                  false: {
                    value: {
                      type: "const",
                      constVal: item.icon2 || "lightbulb-outline"
                    },
                    color: await this.getIconColor(item.offColor, this.colorOff)
                  },
                  scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
                  maxBri: void 0,
                  minBri: void 0
                },
                colorMode: { type: "const", constVal: false },
                headline,
                entity1: {
                  value: foundedStates[role].ON_ACTUAL,
                  set: foundedStates[role].SET
                }
              }
            };
            itemConfig = tempItem;
            break;
          }
          case "dimmer": {
            const tempItem = {
              type: "light",
              role: "dimmer",
              data: {
                icon: {
                  true: {
                    value: {
                      type: "const",
                      constVal: item.icon || "lightbulb"
                    },
                    color: await this.getIconColor(item.onColor, this.colorOn)
                  },
                  false: {
                    value: {
                      type: "const",
                      constVal: item.icon2 || "lightbulb-outline"
                    },
                    color: await this.getIconColor(item.offColor, this.colorOff)
                  },
                  scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
                  maxBri: item.maxValueBrightness ? { type: "const", constVal: item.maxValueBrightness } : void 0,
                  minBri: item.minValueBrightness ? { type: "const", constVal: item.minValueBrightness } : void 0
                },
                colorMode: item.colormode ? { type: "const", constVal: !!item.colormode } : void 0,
                dimmer: {
                  value: foundedStates[role].ACTUAL,
                  set: foundedStates[role].SET,
                  maxScale: item.maxValueBrightness ? { type: "const", constVal: item.maxValueBrightness } : void 0,
                  minScale: item.minValueBrightness ? { type: "const", constVal: item.minValueBrightness } : void 0
                },
                headline,
                text1: {
                  true: {
                    type: "const",
                    constVal: `Brightness`
                  }
                },
                entity1: {
                  value: foundedStates[role].ON_ACTUAL,
                  set: foundedStates[role].ON_SET
                }
              }
            };
            itemConfig = tempItem;
            break;
          }
          case "rgbSingle":
          case "ct":
          case "rgb":
          case "hue": {
            let isKelvin = true;
            if ((_a = foundedStates[role].TEMPERATURE) == null ? void 0 : _a.dp) {
              const state = await this.adapter.getForeignStateAsync(foundedStates[role].TEMPERATURE.dp);
              if (state && typeof state.val === "number" && state.val <= 1e3) {
                isKelvin = false;
              }
            }
            let valueList2 = void 0;
            const selectExist = item.inSel_Alias && await this.existsState(item.inSel_Alias);
            if (selectExist && item.inSel_Alias) {
              const select = await this.adapter.getForeignObjectAsync(item.inSel_Alias);
              if (select && select.common && select.common.type === "string") {
                valueList2 = item.modeList ? { type: "const", constVal: item.modeList } : void 0;
              }
            }
            const tempItem = {
              type: "light",
              role: role === "hue" ? "hue" : role === "rgb" ? "rgbThree" : role === "rgbSingle" ? "rgbSingle" : "ct",
              data: {
                icon: {
                  true: {
                    value: {
                      type: "const",
                      constVal: item.icon || "lightbulb"
                    },
                    color: await this.getIconColor(item.onColor, this.colorOn)
                  },
                  false: {
                    value: {
                      type: "const",
                      constVal: item.icon2 || "lightbulb-outline"
                    },
                    color: await this.getIconColor(item.offColor, this.colorOff)
                  },
                  scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
                  maxBri: item.maxValueBrightness ? { type: "const", constVal: item.maxValueBrightness } : void 0,
                  minBri: item.minValueBrightness ? { type: "const", constVal: item.minValueBrightness } : void 0
                },
                colorMode: item.colormode ? { type: "const", constVal: !!item.colormode } : void 0,
                dimmer: {
                  value: foundedStates[role].DIMMER,
                  maxScale: item.maxValueBrightness ? { type: "const", constVal: item.maxValueBrightness } : void 0,
                  minScale: item.minValueBrightness ? { type: "const", constVal: item.minValueBrightness } : void 0
                },
                headline,
                hue: role !== "hue" ? void 0 : foundedStates[role].HUE,
                Red: role !== "rgb" ? void 0 : foundedStates[role].RED,
                Green: role !== "rgb" ? void 0 : foundedStates[role].GREEN,
                Blue: role !== "rgb" ? void 0 : foundedStates[role].BLUE,
                //White: role !== 'rgb' ? undefined : { value: foundedStates[role].WHITE },
                color: role !== "rgbSingle" ? void 0 : {
                  true: foundedStates[role].RGB
                },
                ct: {
                  value: foundedStates[role].TEMPERATURE,
                  maxScale: item.maxValueColorTemp ? { type: "const", constVal: item.maxValueColorTemp } : void 0,
                  minScale: item.minValueColorTemp ? { type: "const", constVal: item.minValueColorTemp } : void 0,
                  mode: { type: "const", constVal: isKelvin ? "kelvin" : "mired" }
                },
                text1: {
                  true: {
                    type: "const",
                    constVal: `Brightness`
                  }
                },
                text2: {
                  true: {
                    type: "const",
                    constVal: `Colour temperature`
                  }
                },
                text3: role === "ct" ? void 0 : {
                  true: {
                    type: "const",
                    constVal: `Color`
                  }
                },
                entity1: {
                  value: foundedStates[role].ON_ACTUAL,
                  set: foundedStates[role].ON
                },
                valueList: item.modeList ? { type: "const", constVal: item.modeList } : void 0,
                valueList2,
                entityInSel: {
                  value: item.inSel_Alias && selectExist ? { type: "triggered", dp: item.inSel_Alias } : void 0,
                  set: item.inSel_Alias && selectExist ? { type: "triggered", dp: item.inSel_Alias } : void 0
                }
              }
            };
            itemConfig = tempItem;
            break;
          }
          case "button": {
            const tempItem = {
              type: "button",
              role: "button",
              data: {
                icon: {
                  true: {
                    value: {
                      type: "const",
                      constVal: item.icon || "gesture-tap-button"
                    },
                    color: await this.getIconColor(item.onColor, this.colorOn)
                  },
                  false: {
                    value: {
                      type: "const",
                      constVal: item.icon2 || "gesture-tap-button"
                    },
                    color: await this.getIconColor(item.offColor, this.colorOff)
                  },
                  scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
                  maxBri: void 0,
                  minBri: void 0
                },
                text,
                text1: {
                  true: { type: "const", constVal: "press" }
                },
                setValue2: foundedStates[role].SET
              }
            };
            itemConfig = tempItem;
            break;
          }
          case "blind": {
            if (foundedStates[role].TILT_OPEN || foundedStates[role].TILT_CLOSE || foundedStates[role].TILT_STOP) {
              const tempItem = {
                type: "shutter",
                role: "blind",
                data: {
                  icon: {
                    true: {
                      value: {
                        type: "const",
                        constVal: item.icon || "window-shutter-open"
                      },
                      color: await this.getIconColor(item.onColor, this.colorOn)
                    },
                    false: {
                      value: {
                        type: "const",
                        constVal: item.icon2 || "window-shutter"
                      },
                      color: await this.getIconColor(item.offColor, this.colorOff)
                    },
                    unstable: {
                      value: {
                        type: "const",
                        constVal: item.icon3 || "window-shutter-alert"
                      }
                    },
                    scale: {
                      type: "const",
                      constVal: (_b = Types.isIconColorScaleElement(item.colorScale)) != null ? _b : {
                        val_min: 0,
                        val_max: 100
                      }
                    },
                    maxBri: void 0,
                    minBri: void 0
                  },
                  text: { true: { type: "const", constVal: (_c = item.secondRow) != null ? _c : "" } },
                  headline,
                  entity1: {
                    value: foundedStates[role].ACTUAL,
                    minScale: { type: "const", constVal: (_d = item.minValueLevel) != null ? _d : 0 },
                    maxScale: { type: "const", constVal: (_e = item.maxValueLevel) != null ? _e : 100 },
                    set: foundedStates[role].SET
                  },
                  entity2: {
                    value: foundedStates[role].TILT_ACTUAL,
                    minScale: { type: "const", constVal: (_f = item.minValueTilt) != null ? _f : 0 },
                    maxScale: { type: "const", constVal: (_g = item.maxValueTilt) != null ? _g : 100 },
                    set: foundedStates[role].TILT_SET
                  },
                  up: foundedStates[role].OPEN,
                  down: foundedStates[role].CLOSE,
                  stop: foundedStates[role].STOP,
                  up2: foundedStates[role].TILT_OPEN,
                  down2: foundedStates[role].TILT_CLOSE,
                  stop2: foundedStates[role].TILT_STOP
                }
              };
              itemConfig = tempItem;
            } else {
              const I2 = (_h = item.shutterIcons && item.shutterIcons[0]) != null ? _h : void 0;
              const R2 = item.shutterIcons && item.shutterIcons[0] && item.shutterIcons[0].id && await this.existsState(item.shutterIcons[0].id) ? item.shutterIcons[0].id : void 0;
              const S2 = R2 && await this.existsAndWriteableState(R2) ? R2 : void 0;
              const I3 = (_i = item.shutterIcons && item.shutterIcons[1]) != null ? _i : void 0;
              const R3 = item.shutterIcons && item.shutterIcons[1] && item.shutterIcons[1].id && await this.existsState(item.shutterIcons[1].id) ? item.shutterIcons[1].id : void 0;
              const S3 = R3 && await this.existsAndWriteableState(R3) ? R3 : void 0;
              const I4 = (_j = item.shutterIcons && item.shutterIcons[2]) != null ? _j : void 0;
              const R4 = item.shutterIcons && item.shutterIcons[2] && item.shutterIcons[2].id && await this.existsState(item.shutterIcons[2].id) ? item.shutterIcons[2].id : void 0;
              const S4 = R4 && await this.existsAndWriteableState(R4) ? R4 : void 0;
              const tempItem = {
                type: "shutter2",
                role: "blind",
                data: {
                  icon: {
                    true: {
                      value: {
                        type: "const",
                        constVal: item.icon || "window-shutter-open"
                      },
                      color: await this.getIconColor(item.onColor, this.colorOn)
                    },
                    false: {
                      value: {
                        type: "const",
                        constVal: item.icon2 || "window-shutter"
                      },
                      color: await this.getIconColor(item.offColor, this.colorOff)
                    },
                    unstable: {
                      value: {
                        type: "const",
                        constVal: item.icon3 || "window-shutter-alert"
                      }
                    },
                    scale: {
                      type: "const",
                      constVal: (_k = Types.isIconColorScaleElement(item.colorScale)) != null ? _k : {
                        val_min: 0,
                        val_max: 100
                      }
                    },
                    maxBri: void 0,
                    minBri: void 0
                  },
                  text: { true: { type: "const", constVal: (_l = item.secondRow) != null ? _l : "" } },
                  headline,
                  entity1: {
                    value: foundedStates[role].ACTUAL,
                    minScale: { type: "const", constVal: (_m = item.minValueLevel) != null ? _m : 0 },
                    maxScale: { type: "const", constVal: (_n = item.maxValueLevel) != null ? _n : 100 },
                    set: foundedStates[role].SET
                  },
                  entity2: R2 ? {
                    value: { type: "triggered", dp: R2 },
                    set: S2 ? { type: "state", dp: S2 } : void 0
                  } : void 0,
                  icon2: I2 ? {
                    true: {
                      value: {
                        type: "const",
                        constVal: (I2 == null ? void 0 : I2.icon) || "window-shutter"
                      },
                      color: await this.getIconColor(I2 == null ? void 0 : I2.iconOnColor, this.colorOn)
                    },
                    false: {
                      value: {
                        type: "const",
                        constVal: (I2 == null ? void 0 : I2.icon2) || "window-shutter"
                      },
                      color: await this.getIconColor(I2 == null ? void 0 : I2.iconOffColor, this.colorOn)
                    }
                  } : void 0,
                  entity3: R3 ? {
                    value: { type: "triggered", dp: R3 },
                    set: S3 ? { type: "state", dp: S3 } : void 0
                  } : void 0,
                  icon3: I3 ? {
                    true: {
                      value: {
                        type: "const",
                        constVal: (I3 == null ? void 0 : I3.icon) || "window-shutter"
                      },
                      color: await this.getIconColor(I3 == null ? void 0 : I3.iconOnColor, this.colorOn)
                    },
                    false: {
                      value: {
                        type: "const",
                        constVal: (I3 == null ? void 0 : I3.icon2) || "window-shutter"
                      },
                      color: await this.getIconColor(I3 == null ? void 0 : I3.iconOffColor, this.colorOn)
                    }
                  } : void 0,
                  entity4: R4 ? {
                    value: { type: "triggered", dp: R4 },
                    set: S4 ? { type: "state", dp: S4 } : void 0
                  } : void 0,
                  icon4: I4 ? {
                    true: {
                      value: {
                        type: "const",
                        constVal: (I4 == null ? void 0 : I4.icon) || "window-shutter"
                      },
                      color: await this.getIconColor(I4 == null ? void 0 : I4.iconOnColor, this.colorOn)
                    },
                    false: {
                      value: {
                        type: "const",
                        constVal: (I4 == null ? void 0 : I4.icon2) || "window-shutter"
                      },
                      color: await this.getIconColor(I4 == null ? void 0 : I4.iconOffColor, this.colorOn)
                    }
                  } : void 0,
                  up: foundedStates[role].OPEN,
                  down: foundedStates[role].CLOSE,
                  stop: foundedStates[role].STOP
                }
              };
              itemConfig = tempItem;
            }
            break;
          }
          case "gate": {
            if (await this.checkRequiredDatapoints("gate", item, "feature")) {
              itemConfig = {
                type: "shutter",
                role: "gate",
                data: {
                  icon: {
                    true: {
                      value: {
                        type: "const",
                        constVal: item.icon || "garage-open"
                      },
                      color: await this.getIconColor(item.onColor, this.colorOn)
                    },
                    false: {
                      value: {
                        type: "const",
                        constVal: item.icon2 || "garage"
                      },
                      color: await this.getIconColor(item.offColor, this.colorOff)
                    },
                    unstable: {
                      value: {
                        type: "const",
                        constVal: item.icon3 || "garage-alert"
                      }
                    },
                    scale: item.colorScale ? { type: "const", constVal: item.colorScale } : void 0,
                    maxBri: void 0,
                    minBri: void 0
                  },
                  text,
                  headline,
                  entity1: {
                    value: foundedStates[role].ACTUAL
                  },
                  entity2: void 0,
                  up: { type: "state", dp: `${item.id}.SET`, write: "return true;" },
                  down: { type: "state", dp: `${item.id}.SET`, write: "return false;" },
                  stop: foundedStates[role].STOP
                }
              };
              break;
            } else {
              itemConfig = {
                template: "text.gate.isOpen",
                dpInit: item.id,
                color: {
                  true: await this.getIconColor(item.onColor, this.colorOn),
                  false: await this.getIconColor(item.offColor, this.colorOff),
                  scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
                },
                data: {
                  entity1: { value: foundedStates[role].ACTUAL }
                }
              };
            }
            break;
          }
          case "motion":
          case "info":
          case "humidity":
          case "value.humidity":
          case "thermostat":
          case "airCondition":
          case "value.temperature":
          case "temperature":
          case "door":
          case "window": {
            let iconOn = "door-open";
            let iconOff = "door-closed";
            let iconUnstable = "";
            let textOn = void 0;
            let textOff = void 0;
            let adapterRole = "";
            let commonUnit = "";
            let scaleVal = {};
            switch (role) {
              case "motion": {
                iconOn = "motion-sensor";
                iconOff = "motion-sensor";
                iconUnstable = "";
                adapterRole = "iconNotText";
                textOn = "motion";
                textOff = "none";
                break;
              }
              case "door": {
                adapterRole = "iconNotText";
                iconOn = "door-open";
                iconOff = "door-closed";
                iconUnstable = "door-closed";
                textOn = "opened";
                textOff = "closed";
                break;
              }
              case "window": {
                iconOn = "window-open-variant";
                iconOff = "window-closed-variant";
                iconUnstable = "window-closed-variant";
                adapterRole = "iconNotText";
                textOn = "opened";
                textOff = "closed";
                break;
              }
              case "info": {
                iconOn = "information-outline";
                iconOff = "information-off-outline";
                if (foundedStates[role].ACTUAL && foundedStates[role].ACTUAL.dp) {
                  const o = await this.adapter.getForeignObjectAsync(foundedStates[role].ACTUAL.dp);
                  if (((_o = o == null ? void 0 : o.common) == null ? void 0 : _o.type) === "boolean") {
                    adapterRole = "iconNotText";
                  } else {
                    adapterRole = specialRole;
                  }
                }
                break;
              }
              case "thermostat":
              case "airCondition":
              case "value.temperature":
              case "temperature": {
                iconOn = "thermometer";
                iconOff = "snowflake-thermometer";
                iconUnstable = "sun-thermometer";
                adapterRole = specialRole;
                if (foundedStates[role].ACTUAL && foundedStates[role].ACTUAL.dp) {
                  const o = await this.adapter.getForeignObjectAsync(foundedStates[role].ACTUAL.dp);
                  if (o && o.common && o.common.unit) {
                    commonUnit = o.common.unit;
                  }
                }
                scaleVal = { val_min: 40, val_max: -10, val_best: 25, mode: "quadriGradAnchor" };
                break;
              }
              case "value.humidity":
              case "humidity": {
                iconOn = "water-percent";
                iconOff = "water-off";
                iconUnstable = "water-percent-alert";
                adapterRole = specialRole;
                if (foundedStates[role].ACTUAL && foundedStates[role].ACTUAL.dp) {
                  const o = await this.adapter.getForeignObjectAsync(foundedStates[role].ACTUAL.dp);
                  if (o && o.common && o.common.unit) {
                    commonUnit = o.common.unit;
                  }
                }
                scaleVal = { val_min: 0, val_max: 100, val_best: 50, mode: "triGrad" };
                break;
              }
            }
            const tempItem = {
              type: "text",
              role: adapterRole,
              data: {
                icon: {
                  true: {
                    value: await this.getFieldAsDataItemConfig(item.icon || iconOn),
                    color: await this.getIconColor(
                      item.onColor || `${item.id}.COLORDEC`,
                      this.colorOn
                    ),
                    text: await this.existsState(`${item.id}.ACTUAL`) ? {
                      value: foundedStates[role].ACTUAL,
                      unit: item.unit ? { type: "const", constVal: item.unit } : void 0,
                      textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0
                    } : void 0
                  },
                  false: {
                    value: await this.getFieldAsDataItemConfig(item.icon2 || iconOff),
                    color: await this.getIconColor(
                      item.offColor || `${item.id}.COLORDEC`,
                      this.colorOff
                    ),
                    text: await this.existsState(`${item.id}.ACTUAL`) ? {
                      value: foundedStates[role].ACTUAL,
                      unit: item.unit ? { type: "const", constVal: item.unit } : void 0,
                      textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0
                    } : void 0
                  },
                  unstable: {
                    value: await this.getFieldAsDataItemConfig(item.icon3 || iconUnstable)
                  },
                  scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : { type: "const", constVal: scaleVal },
                  maxBri: void 0,
                  minBri: void 0
                },
                text1: textOn ? {
                  true: { type: "const", constVal: textOn },
                  false: textOff ? { type: "const", constVal: textOff } : void 0
                } : void 0,
                text,
                entity1: {
                  value: foundedStates[role].ACTUAL
                },
                entity2: role === "temperature" || role === "humidity" || role === "info" || role === "value.temperature" || role === "value.humidity" ? {
                  value: foundedStates[role].ACTUAL,
                  unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0
                } : void 0
              }
            };
            itemConfig = tempItem;
            break;
          }
          case "volume": {
            let commonUnit = "";
            if (foundedStates[role].ACTUAL && foundedStates[role].ACTUAL.dp) {
              const o = await this.adapter.getForeignObjectAsync(foundedStates[role].ACTUAL.dp);
              if (o && o.common && o.common.unit) {
                commonUnit = o.common.unit;
              }
            }
            const icontemp = item.icon2 || item.icon;
            itemConfig = {
              template: "number.volume",
              dpInit: item.id,
              type: "number",
              role: specialRole,
              color: {
                true: await this.getIconColor(item.onColor, this.colorOn),
                false: await this.getIconColor(item.offColor, this.colorOff),
                scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
              },
              icon: {
                true: item.icon ? { type: "const", constVal: item.icon } : void 0,
                false: icontemp ? { type: "const", constVal: icontemp } : void 0
              },
              data: {
                entity1: {
                  value: foundedStates[role].ACTUAL,
                  unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0,
                  set: foundedStates[role].SET
                },
                minValue1: item.minValue ? { type: "const", constVal: item.minValue } : void 0,
                maxValue1: item.maxValue ? { type: "const", constVal: item.maxValue } : void 0,
                switch1: foundedStates[role].MUTE,
                text
              }
            };
            break;
          }
          case "select": {
            itemConfig = {
              type: "input_sel",
              dpInit: item.id,
              role: "",
              color: {
                true: await this.getIconColor(item.onColor, this.colorOn),
                false: await this.getIconColor(item.offColor, this.colorOff),
                scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
              },
              icon: {
                true: item.icon ? { type: "const", constVal: item.icon } : void 0,
                false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
              },
              data: {
                entityInSel: {
                  value: foundedStates[role].ACTUAL,
                  set: foundedStates[role].SET
                },
                text: { true: foundedStates[role].ACTUAL },
                valueList: item.modeList ? { type: "const", constVal: item.modeList } : void 0,
                icon: {
                  true: {
                    value: { type: "const", constVal: "clipboard-list-outline" },
                    color: { type: "const", constVal: import_Color.Color.Green }
                  },
                  false: {
                    value: { type: "const", constVal: "clipboard-list" },
                    color: { type: "const", constVal: import_Color.Color.Red }
                  }
                },
                headline: { type: "const", constVal: item.name || commonName || role }
              }
            };
            break;
          }
          case "lock": {
            item.icon2 = item.icon2 || item.icon;
            itemConfig = {
              type: "shutter",
              role: "",
              icon: {
                true: item.icon ? { type: "const", constVal: item.icon } : void 0,
                false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
              },
              data: {
                icon: {
                  true: {
                    value: await this.getFieldAsDataItemConfig(item.icon || "lock-open-variant"),
                    color: await this.getIconColor(item.onColor, this.colorOn)
                  },
                  false: {
                    value: {
                      type: "const",
                      constVal: item.icon2 || "lock"
                    },
                    color: await this.getIconColor(item.offColor, this.colorOff)
                  }
                },
                text: {
                  true: { type: "const", constVal: "lockOpen" },
                  false: { type: "const", constVal: "lockClosed" }
                },
                headline,
                entity1: {
                  value: foundedStates[role].ACTUAL
                },
                entity2: void 0,
                valueList: item.modeList ? { type: "const", constVal: item.modeList } : {
                  type: "const",
                  constVal: ["lock-open-check-outline", "lock-open-variant", "lock"]
                },
                up: foundedStates[role].OPEN,
                stop: foundedStates[role].SET ? JSON.parse(
                  JSON.stringify(
                    Object.assign(foundedStates[role].SET, {
                      type: "state",
                      write: "return true"
                    })
                  )
                ) : void 0,
                down: foundedStates[role].SET ? JSON.parse(
                  JSON.stringify(
                    Object.assign(foundedStates[role].SET, {
                      type: "state",
                      write: "return false"
                    })
                  )
                ) : void 0,
                up2: void 0,
                down2: void 0,
                stop2: void 0
              }
            };
            break;
          }
          case "slider": {
            let commonUnit = "";
            if (foundedStates[role].ACTUAL && foundedStates[role].ACTUAL.dp) {
              const o = await this.adapter.getForeignObjectAsync(foundedStates[role].ACTUAL.dp);
              if (o && o.common && o.common.unit) {
                commonUnit = o.common.unit;
              }
            }
            itemConfig = {
              dpInit: item.id,
              type: "number",
              role: specialRole,
              data: {
                icon: {
                  true: {
                    value: item.icon ? { type: "const", constVal: item.icon } : { type: "const", constVal: "plus-minus-variant" },
                    text: {
                      value: foundedStates[role].ACTUAL,
                      unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0
                    },
                    color: await this.getIconColor(item.onColor, this.colorOn)
                  },
                  false: item.icon2 ? {
                    value: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0,
                    color: await this.getIconColor(item.offColor, this.colorOff)
                  } : void 0,
                  scale: { type: "const", constVal: { min: 0, max: 100 } }
                },
                entity1: {
                  value: item.sliderItems && item.sliderItems[0] && item.sliderItems[0].id && await this.existsAndWriteableState(item.sliderItems[0].id) ? { type: "triggered", dp: item.sliderItems[0].id } : foundedStates[role].ACTUAL,
                  set: item.sliderItems && item.sliderItems[0] && item.sliderItems[0].id && await this.existsAndWriteableState(item.sliderItems[0].id) ? { type: "triggered", dp: item.sliderItems[0].id } : foundedStates[role].SET
                },
                heading1: {
                  type: "const",
                  constVal: item.sliderItems && item.sliderItems[0] ? item.sliderItems[0].heading : "Slider 1"
                },
                minValue1: item.sliderItems && item.sliderItems[0] && item.sliderItems[0].minValue ? { type: "const", constVal: item.sliderItems[0].minValue } : void 0,
                maxValue1: item.sliderItems && item.sliderItems[0] && item.sliderItems[0].maxValue ? { type: "const", constVal: item.sliderItems[0].maxValue } : void 0,
                zero1: item.sliderItems && item.sliderItems[0] && item.sliderItems[0].zeroValue ? { type: "const", constVal: item.sliderItems[0].zeroValue } : void 0,
                steps1: item.sliderItems && item.sliderItems[0] && item.sliderItems[0].stepValue ? { type: "const", constVal: item.sliderItems[0].stepValue } : void 0,
                entity2: {
                  value: item.sliderItems && item.sliderItems[1] && item.sliderItems[1].id && await this.existsAndWriteableState(item.sliderItems[1].id) ? { type: "triggered", dp: item.sliderItems[1].id } : foundedStates[role].ACTUAL2,
                  set: item.sliderItems && item.sliderItems[1] && item.sliderItems[1].id && await this.existsAndWriteableState(item.sliderItems[1].id) ? { type: "triggered", dp: item.sliderItems[1].id } : foundedStates[role].SET2
                },
                heading2: {
                  type: "const",
                  constVal: item.sliderItems && item.sliderItems[1] ? item.sliderItems[1].heading : "Slider 2"
                },
                minValue2: item.sliderItems && item.sliderItems[1] && item.sliderItems[1].minValue ? { type: "const", constVal: item.sliderItems[1].minValue } : void 0,
                maxValue2: item.sliderItems && item.sliderItems[1] && item.sliderItems[1].maxValue ? { type: "const", constVal: item.sliderItems[1].maxValue } : void 0,
                zero2: item.sliderItems && item.sliderItems[1] && item.sliderItems[1].zeroValue ? { type: "const", constVal: item.sliderItems[1].zeroValue } : void 0,
                steps2: item.sliderItems && item.sliderItems[1] && item.sliderItems[1].stepValue ? { type: "const", constVal: item.sliderItems[1].stepValue } : void 0,
                entity3: {
                  value: item.sliderItems && item.sliderItems[2] && item.sliderItems[2].id && await this.existsAndWriteableState(item.sliderItems[2].id) ? { type: "triggered", dp: item.sliderItems[2].id } : foundedStates[role].ACTUAL3,
                  set: item.sliderItems && item.sliderItems[2] && item.sliderItems[2].id && await this.existsAndWriteableState(item.sliderItems[2].id) ? { type: "triggered", dp: item.sliderItems[2].id } : foundedStates[role].SET3
                },
                heading3: {
                  type: "const",
                  constVal: item.sliderItems && item.sliderItems[2] ? item.sliderItems[2].heading : "Slider 3"
                },
                minValue3: item.sliderItems && item.sliderItems[2] && item.sliderItems[2].minValue ? { type: "const", constVal: item.sliderItems[2].minValue } : void 0,
                maxValue3: item.sliderItems && item.sliderItems[2] && item.sliderItems[2].maxValue ? { type: "const", constVal: item.sliderItems[2].maxValue } : void 0,
                zero3: item.sliderItems && item.sliderItems[2] && item.sliderItems[2].zeroValue ? { type: "const", constVal: item.sliderItems[2].zeroValue } : void 0,
                steps3: item.sliderItems && item.sliderItems[2] && item.sliderItems[2].stepValue ? { type: "const", constVal: item.sliderItems[2].stepValue } : void 0,
                text: {
                  true: { type: "const", constVal: item.name || "slider" },
                  false: void 0
                }
              }
            };
            break;
          }
          case "warning": {
            itemConfig = {
              template: "text.warning",
              role: "text",
              type: "text",
              dpInit: item.id,
              data: {
                icon: {
                  true: {
                    value: { type: "const", constVal: item.icon || "alert-decagram-outline" },
                    color: await this.getIconColor(item.onColor, this.colorOn)
                  },
                  false: {
                    value: { type: "const", constVal: item.icon2 || "alert-decagram-outline" },
                    color: await this.getIconColor(item.offColor, this.colorOff)
                  }
                }
              }
            };
            break;
          }
          case "level.timer": {
            let isAlarm = false;
            if (foundedStates[role].ACTUAL && foundedStates[role].ACTUAL.dp) {
              const o = await this.adapter.getForeignObjectAsync(foundedStates[role].ACTUAL.dp);
              if (o && o.common && o.common.role === "date") {
                isAlarm = true;
              }
            }
            const icon = isAlarm ? foundedStates[role].SET ? "clock-edit-outline" : "alarm" : foundedStates[role].SET ? "timer-edit-outline" : foundedStates[role].ACTUAL ? "timer-outline" : "timer";
            const iconFalse = isAlarm ? "alarm-off" : foundedStates[role].SET ? "timer-off-outline" : foundedStates[role].ACTUAL ? "timer-off-outline" : "timer-off";
            item.icon2 = item.icon2 || item.icon;
            itemConfig = {
              role: "timer",
              type: "timer",
              dpInit: "",
              data: {
                icon: {
                  true: {
                    value: {
                      type: "const",
                      constVal: item.icon || icon || "timer"
                    },
                    color: await this.getIconColor(item.onColor, this.colorOn)
                  },
                  false: {
                    value: {
                      type: "const",
                      constVal: item.icon2 || iconFalse || "timer"
                    },
                    color: await this.getIconColor(item.offColor, this.colorOff)
                  },
                  scale: Types.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
                  maxBri: void 0,
                  minBri: void 0
                },
                entity1: { value: foundedStates[role].ACTUAL, set: foundedStates[role].SET },
                headline: { type: "const", constVal: "Timer" },
                setValue1: foundedStates[role].STATE,
                setValue2: foundedStates[role].STATUS
              }
            };
            break;
          }
          case "sensor.alarm.flood": {
            throw new Error(`DP: ${item.id} - Channel role ${role} not implemented yet!!`);
          }
          case "level.mode.fan": {
            let states;
            let keys;
            if ((_p = foundedStates[role].MODE) == null ? void 0 : _p.dp) {
              const o = await this.adapter.getForeignObjectAsync(foundedStates[role].MODE.dp);
              if ((_q = o == null ? void 0 : o.common) == null ? void 0 : _q.states) {
                states = Object.values(o.common.states).map(String);
                keys = Object.keys(o.common.states).map(String);
              }
            }
            itemConfig = {
              role: "fan",
              type: "fan",
              dpInit: "",
              data: {
                icon: {
                  true: {
                    value: { type: "const", constVal: item.icon || "fan" },
                    color: { type: "const", constVal: item.onColor || import_Color.Color.Green }
                  },
                  false: {
                    value: { type: "const", constVal: item.icon2 || "fan-off" },
                    color: { type: "const", constVal: item.offColor || import_Color.Color.Red }
                  }
                },
                entity1: {
                  value: foundedStates[role].ACTUAL,
                  set: foundedStates[role].SET
                },
                speed: {
                  value: foundedStates[role].SPEED,
                  maxScale: { type: "const", constVal: item.maxValueLevel || 100 }
                },
                headline: { type: "const", constVal: item.name || commonName || role },
                text: { true: { type: "const", constVal: "Speed" }, false: void 0 },
                //entityInSel: { value: { type: 'const', constVal: '2' } },
                entityInSel: { value: foundedStates[role].MODE },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                //valueList: { type: 'const', constVal: '1?2?3?4?5' },
                valueList: item.modeList ? { type: "const", constVal: item.modeList } : {
                  type: "const",
                  constVal: Array.isArray(keys) ? keys : []
                },
                valueList2: item.modeList ? void 0 : { type: "const", constVal: Array.isArray(states) ? states : [] }
                /* valueList: {
                    type: 'const',
                    constVal: Array.isArray(states) ? states.join('?') : JSON.stringify(states),
                }, */
              }
            };
            break;
          }
          default:
            (0, import_pages.exhaustiveCheck)(role);
            throw new Error(`DP: ${item.id} - Channel role ${role} is not supported!!!`);
        }
        return { itemConfig, messages };
      }
      throw new Error(`Object ${item.id} not found!`);
    }
    return { itemConfig: void 0, messages };
  }
  async getScreensaverConfig(config) {
    let pageItems = [];
    if (config.favoritScreensaverEntity) {
      for (const item of config.favoritScreensaverEntity) {
        if (item) {
          try {
            pageItems.push(await this.getEntityData(item, "favorit", config));
          } catch (error) {
            throw new Error(`favoritScreensaverEntity - ${error}`);
          }
        }
      }
    }
    if (config.alternateScreensaverEntity) {
      for (const item of config.alternateScreensaverEntity) {
        if (item) {
          try {
            pageItems.push(await this.getEntityData(item, "alternate", config));
          } catch (error) {
            throw new Error(`alternateScreensaverEntity - ${error}`);
          }
        }
      }
    }
    if (config.bottomScreensaverEntity) {
      for (const item of config.bottomScreensaverEntity) {
        if (item) {
          try {
            pageItems.push(await this.getEntityData(item, "bottom", config));
          } catch (error) {
            throw new Error(`bottomScreensaverEntity - ${error}`);
          }
        }
      }
    }
    if (config.weatherEntity) {
      if (config.weatherEntity.startsWith("accuweather.") && config.weatherEntity.endsWith(".")) {
        const instance = config.weatherEntity.split(".")[1];
        if (pageItems.findIndex((x) => x.modeScr === "favorit") === -1) {
          pageItems.push({
            template: "text.accuweather.favorit",
            dpInit: `/^accuweather\\.${instance}.+/`,
            modeScr: "favorit"
          });
        }
        if (config.weatherAddDefaultItems) {
          pageItems = pageItems.concat([
            // Bottom 1 - accuWeather.0. Forecast Day 1
            {
              template: "text.accuweather.sunriseset",
              dpInit: `/^accuweather\\.${instance}.Daily.+/`,
              modeScr: "bottom"
            },
            // Bottom 2 - accuWeather.0. Forecast Day 1
            {
              template: "text.accuweather.bot2values",
              dpInit: `/^accuweather\\.${instance}.+?d1$/g`,
              modeScr: "bottom"
            },
            // Bottom 3 - accuWeather.0. Forecast Day 2
            {
              template: "text.accuweather.bot2values",
              dpInit: `/^accuweather\\.${instance}.+?d2$/`,
              modeScr: "bottom"
            },
            // Bottom 4 - accuWeather.0. Forecast Day 3
            {
              template: "text.accuweather.bot2values",
              dpInit: `/^accuweather\\.${instance}.+?d3$/`,
              modeScr: "bottom"
            },
            // Bottom 5 - accuWeather.0. Forecast Day 4
            {
              template: "text.accuweather.bot2values",
              dpInit: `/^accuweather\\.${instance}.+?d4$/`,
              modeScr: "bottom"
            },
            // Bottom 6 - accuWeather.0. Forecast Day 5
            {
              template: "text.accuweather.bot2values",
              dpInit: `/^accuweather\\.${instance}.+?d5$/`,
              modeScr: "bottom"
            },
            // Bottom 7 - Windgeschwindigkeit
            {
              template: "text.accuweather.windspeed",
              dpInit: `/^accuweather\\.${instance}./`,
              modeScr: "bottom"
            },
            // Bottom 8 - Böen
            {
              template: "text.accuweather.windgust",
              dpInit: `/^accuweather\\.${instance}./`,
              modeScr: "bottom"
            },
            // Bottom 9 - Windrichtung
            {
              template: "text.accuweather.winddirection",
              dpInit: `/^accuweather\\.${instance}./`,
              modeScr: "bottom"
            },
            // Bottom 10 - UV-Index
            {
              template: "text.accuweather.uvindex",
              dpInit: `/^accuweather\\.${instance}./`,
              modeScr: "bottom"
            }
          ]);
        }
      } else if (config.weatherEntity.startsWith("openweathermap.") && config.weatherEntity.endsWith(".")) {
        const instance = config.weatherEntity.split(".")[1];
        if (pageItems.findIndex((x) => x.modeScr === "favorit") === -1) {
          pageItems.push({
            template: "text.openweathermap.favorit",
            dpInit: `/^openweathermap\\.${instance}.+/`,
            modeScr: "favorit"
          });
        }
        if (config.weatherAddDefaultItems) {
          pageItems = pageItems.concat([
            // Bottom 1 - openweathermap.0. sunset
            {
              template: "text.openweathermap.sunriseset",
              dpInit: `/^openweathermap\\.${instance}\\.forecast\\.current.+/`,
              modeScr: "bottom"
            },
            // Bottom 2 - openweathermap.0. Forecast Day 1
            {
              template: "text.openweathermap.bot2values",
              dpInit: `/^openweathermap\\.${instance}.+?\\.day0/`,
              modeScr: "bottom"
            },
            // Bottom 3 - openweathermap.0. Forecast Day 2
            {
              template: "text.openweathermap.bot2values",
              dpInit: `/^openweathermap\\.${instance}.+?\\.day1/`,
              modeScr: "bottom"
            },
            // Bottom 4 - openweathermap.0. Forecast Day 3
            {
              template: "text.openweathermap.bot2values",
              dpInit: `/^openweathermap\\.${instance}.+?\\.day2/`,
              modeScr: "bottom"
            },
            // Bottom 5 - openweathermap.0. Forecast Day 4
            {
              template: "text.openweathermap.bot2values",
              dpInit: `/^openweathermap\\.${instance}.+?\\.day3/`,
              modeScr: "bottom"
            },
            // Bottom 6 - openweathermap.0. Forecast Day 5
            {
              template: "text.openweathermap.bot2values",
              dpInit: `/^openweathermap\\.${instance}.+?\\.day4/`,
              modeScr: "bottom"
            },
            // Bottom 7 - openweathermap.0. Forecast Day 5
            {
              template: "text.openweathermap.bot2values",
              dpInit: `/^openweathermap\\.${instance}.+?\\.day5/`,
              modeScr: "bottom"
            },
            // Bottom 8 - Windgeschwindigkeit
            {
              template: "text.openweathermap.windspeed",
              dpInit: `/^openweathermap\\.${instance}./`,
              modeScr: "bottom"
            },
            // Bottom 9 - Böen
            {
              template: "text.openweathermap.windgust",
              dpInit: `/^openweathermap\\.${instance}./`,
              modeScr: "bottom"
            },
            // Bottom 10 - Windrichtung
            {
              template: "text.openweathermap.winddirection",
              dpInit: `/^openweathermap\\.${instance}./`,
              modeScr: "bottom"
            }
          ]);
        }
      }
    }
    if (config.indicatorScreensaverEntity) {
      for (const item of config.indicatorScreensaverEntity) {
        if (item) {
          try {
            pageItems.push(await this.getEntityData(item, "indicator", config));
          } catch (error) {
            throw new Error(`indicatorScreensaverEntity - ${error}`);
          }
        }
      }
    }
    if (config.leftScreensaverEntity) {
      for (const item of config.leftScreensaverEntity) {
        if (item) {
          try {
            pageItems.push(await this.getEntityData(item, "left", config));
          } catch (error) {
            throw new Error(`leftScreensaverEntity - ${error}`);
          }
        }
      }
    }
    if (config.mrIcon1ScreensaverEntity) {
      try {
        pageItems.push(await this.getMrEntityData(config.mrIcon1ScreensaverEntity, "mricon"));
      } catch (error) {
        throw new Error(`mrIcon1ScreensaverEntity - ${error}`);
      }
    }
    if (config.mrIcon2ScreensaverEntity) {
      try {
        pageItems.push(await this.getMrEntityData(config.mrIcon2ScreensaverEntity, "mricon"));
      } catch (error) {
        throw new Error(`mrIcon2ScreensaverEntity - ${error}`);
      }
    }
    this.log.debug(`Screensaver pageItems count: ${pageItems.length}`);
    const format = {
      weekday: "long",
      month: "2-digit",
      year: "numeric",
      day: "numeric"
    };
    if (!this.adapter.config.weekdayFormat) {
      format.weekday = "short";
    }
    if (!this.adapter.config.yearFormat) {
      format.year = "2-digit";
    }
    switch (this.adapter.config.monthFormat) {
      case 0:
        format.month = "long";
        break;
      case 1:
        format.month = "short";
        break;
      case 2:
      default:
        format.month = "2-digit";
        break;
    }
    pageItems = pageItems.concat([
      {
        role: "text",
        dpInit: "",
        type: "text",
        modeScr: "time",
        data: {
          entity2: {
            value: {
              type: "internal",
              dp: "///time"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            }
          }
        }
      },
      {
        role: "text",
        dpInit: "",
        type: "text",
        modeScr: "date",
        data: {
          entity2: {
            value: {
              type: "internal",
              dp: "///date"
            },
            dateFormat: {
              type: "const",
              constVal: {
                local: this.adapter.language || "en",
                format
              }
            }
          }
        }
      }
    ]);
    pageItems = pageItems.concat(config.nativePageItems || []);
    return {
      dpInit: "",
      alwaysOn: "none",
      uniqueID: "scr",
      useColor: false,
      config: {
        card: "screensaver",
        mode: "standard",
        rotationTime: 0,
        model: "eu",
        data: void 0,
        screensaverIndicatorButtons: false,
        screensaverSwipe: false
      },
      pageItems
    };
  }
  /**
   * Checks if the required datapoints for a given role and item are present and valid.
   *
   * @param role - The role to check the datapoints for.
   * @param item - The item to check the datapoints for.
   * @param mode - The mode of checking, can be 'both', 'script', or 'feature'. Defaults to 'both'. 'script' and 'feature' will only check the respective datapoints.
   * @returns A promise that resolves to true if all required datapoints are present and valid, otherwise throws an error with mode='both'. Return false if mode='feature' or 'script'.
   * @throws Will throw an error if a required datapoint is missing or invalid and mode='both'.
   */
  async checkRequiredDatapoints(role, item, mode = "both") {
    const _checkScriptDataPoints = async (role2, item2) => {
      let error = "";
      const subItem = configManagerConst.requiredScriptDataPoints[role2];
      if (subItem && subItem.data) {
        for (const dp in subItem.data) {
          if (!(dp in subItem.data)) {
            continue;
          }
          const key = dp;
          try {
            const o = dp !== "" && !dp.endsWith(".") ? await this.adapter.getForeignObjectAsync(`${item2.id}.${dp}`) : void 0;
            if (!o || subItem.data[key] === void 0 || !subItem.data[key].required) {
              continue;
            }
            if (!o || !this.checkStringVsStringOrArray(subItem.data[key].role, o.common.role) || !this.checkStringVsStringOrArray(subItem.data[key].type, o.common.type) || subItem.data[key].writeable && !o.common.write) {
              if (!o) {
                throw new Error(
                  `Datapoint ${item2.id}.${dp} is missing and is required for role ${role2}!`
                );
              } else {
                throw new Error(
                  `Datapoint ${item2.id}.${dp}:${!this.checkStringVsStringOrArray(subItem.data[key].role, o.common.role) ? ` role: ${o.common.role} should be ${(0, import_readme.getStringOrArray)(subItem.data[key].role)})` : ""} ${subItem.data[key].type !== "mixed" && o.common.type !== subItem.data[key].type ? ` type: ${o.common.type} should be ${(0, import_readme.getStringOrArray)(subItem.data[key].type)}` : ""}${subItem.data[key].writeable && !o.common.write ? " must be writeable!" : ""} `
                );
              }
            }
          } catch (err) {
            error += err.replaceAll("Error: ", "");
          }
        }
      } else {
        throw new Error(`Role ${role2} is not supported!`);
      }
      if (error) {
        throw new Error(error);
      }
      return true;
    };
    const _checkDataPoints = async () => {
      return false;
    };
    if (mode === "both" || mode === "script") {
      try {
        if (await _checkScriptDataPoints(role, item)) {
          return true;
        }
      } catch (error) {
        try {
          if (await _checkDataPoints()) {
            return true;
          }
        } catch {
          if (mode === "both") {
            throw new Error(error);
          } else {
            return false;
          }
        }
        throw new Error(error);
      }
    } else {
      try {
        if (await _checkDataPoints()) {
          return true;
        }
      } catch (error) {
        if (mode === "feature") {
          throw new Error(error);
        } else {
          return false;
        }
      }
    }
    return true;
  }
  checkStringVsStringOrArray(item, test) {
    if (test === void 0) {
      return false;
    }
    if (Array.isArray(item)) {
      return item.includes(test);
    }
    return item === test;
  }
  async getMrEntityData(entity, mode) {
    const result = {
      modeScr: mode,
      type: "text",
      data: { entity1: {} }
    };
    if (entity.type === "native") {
      const temp = JSON.parse(JSON.stringify(entity.native));
      temp.type = void 0;
      return temp;
    } else if (entity.type === "template") {
      const temp = JSON.parse(JSON.stringify(entity));
      temp.type = void 0;
      return temp;
    }
    if (entity.ScreensaverEntity && entity.ScreensaverEntity !== `Relay.2` && entity.ScreensaverEntity !== `Relay.1`) {
      result.data.entity1.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity, true);
    } else if (entity.ScreensaverEntity) {
      result.data.entity1.value = {
        type: "internal",
        dp: `cmd/power${entity.ScreensaverEntity === `Relay.2` ? 2 : 1}`
      };
    }
    result.data.icon = {
      true: {
        value: {
          type: "const",
          constVal: "lightbulb"
        },
        color: {
          type: "const",
          constVal: import_Color.Color.Yellow
        }
      },
      false: {
        value: {
          type: "const",
          constVal: "lightbulb-outline"
        },
        color: {
          type: "const",
          constVal: import_Color.Color.HMIOff
        }
      },
      scale: void 0,
      maxBri: void 0,
      minBri: void 0
    };
    if (entity.ScreensaverEntityOnColor) {
      result.data.icon.true.color = await this.getIconColor(entity.ScreensaverEntityOnColor || this.colorOn);
    }
    if (entity.ScreensaverEntityOffColor) {
      result.data.icon.false.color = await this.getIconColor(entity.ScreensaverEntityOffColor || this.colorOff);
    }
    if (entity.ScreensaverEntityIconOn) {
      result.data.icon.true.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOn);
    }
    if (entity.ScreensaverEntityIconOff) {
      result.data.icon.false.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOff);
    }
    if (entity.ScreensaverEntityValue) {
      result.data.icon.false.text = {
        value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityValue, true),
        unit: entity.ScreensaverEntityValueUnit ? await this.getFieldAsDataItemConfig(entity.ScreensaverEntityValueUnit) : void 0,
        decimal: entity.ScreensaverEntityValueDecimalPlace != null ? { type: "const", constVal: entity.ScreensaverEntityValueDecimalPlace } : void 0,
        factor: void 0
      };
      result.role = "combined";
      result.data.icon.true.text = result.data.icon.false.text;
    }
    if (isPageItemDataItemsOptions(result)) {
      return result;
    }
    throw new Error("Invalid data");
  }
  async getEntityData(entity, mode, defaultColors) {
    const result = {
      modeScr: mode,
      type: "text",
      data: { entity1: {} }
    };
    if (entity.type === "native") {
      const temp = structuredClone(entity.native);
      return temp;
    } else if (entity.type === "template") {
      const temp = structuredClone(entity);
      delete temp.type;
      return temp;
    }
    if (!result.data.entity1) {
      throw new Error("Invalid data");
    }
    result.data.entity2 = this.library.cloneGenericObject(result.data.entity1);
    if (mode === "indicator") {
      result.type = "button";
    }
    let obj;
    if (entity.ScreensaverEntity && !entity.ScreensaverEntity.endsWith(".")) {
      obj = await this.adapter.getForeignObjectAsync(entity.ScreensaverEntity);
      result.data.entity1.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity, true);
      result.data.entity2.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity);
    }
    const dataType = obj && obj.common && obj.common.type ? obj.common.type : void 0;
    if (entity.ScreensaverEntityUnitText || entity.ScreensaverEntityUnitText === "") {
      result.data.entity1.unit = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityUnitText);
      result.data.entity2.unit = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityUnitText);
    } else if (obj && obj.common && obj.common.unit) {
      result.data.entity1.unit = { type: "const", constVal: obj.common.unit };
      result.data.entity2.unit = { type: "const", constVal: obj.common.unit };
    }
    if (entity.ScreensaverEntityFactor) {
      result.data.entity1.factor = { type: "const", constVal: entity.ScreensaverEntityFactor };
      result.data.entity2.factor = { type: "const", constVal: entity.ScreensaverEntityFactor };
    }
    if (entity.ScreensaverEntityDecimalPlaces != null) {
      result.data.entity1.decimal = { type: "const", constVal: entity.ScreensaverEntityDecimalPlaces };
      result.data.entity2.decimal = { type: "const", constVal: entity.ScreensaverEntityDecimalPlaces };
    }
    if (entity.ScreensaverEntityDateFormat) {
      result.data.entity1.dateFormat = {
        type: "const",
        constVal: { local: "de", format: entity.ScreensaverEntityDateFormat }
      };
      result.data.entity2.dateFormat = {
        type: "const",
        constVal: { local: "de", format: entity.ScreensaverEntityDateFormat }
      };
    }
    let color = void 0;
    if (entity.ScreensaverEntityOnColor) {
      color = await this.getIconColor(entity.ScreensaverEntityOnColor || this.colorOn);
    } else if (entity.ScreensaverEntityIconColor && !isIconScaleElement(entity.ScreensaverEntityIconColor)) {
      color = await this.getIconColor(entity.ScreensaverEntityIconColor || this.colorDefault);
    } else {
      color = await this.getIconColor(defaultColors.defaultOnColor || this.colorDefault);
    }
    let colorOff = void 0;
    if (entity.ScreensaverEntityOffColor) {
      colorOff = await this.getIconColor(entity.ScreensaverEntityOffColor);
    } else if (entity.ScreensaverEntityOffColor !== null) {
      colorOff = await this.getIconColor(defaultColors.defaultOffColor);
    }
    if (entity.ScreensaverEntityIconOn) {
      result.data.icon = {
        true: { value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOn) }
      };
    }
    if (dataType === "number" && entity.ScreensaverEntityIconSelect && Array.isArray(entity.ScreensaverEntityIconSelect)) {
      const obj2 = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity);
      if (obj2 && obj2.type === "state") {
        entity.ScreensaverEntityIconSelect.sort((a, b) => a.value - b.value);
        obj2.read = `
                    const items = [${entity.ScreensaverEntityIconSelect.map((item) => `{val: ${item.value}, icon: "${item.icon}"}`).join(", ")}];
                    for (let i = 1; i < items.length; i++) {
                        if (val <= items[i].val) {return items[i].icon;}
                    }
                    return items[items.length - 1].icon;`;
        result.data.icon = {
          ...result.data.icon,
          true: {
            value: obj2
          }
        };
      }
    }
    if (color) {
      result.data.icon = result.data.icon || {};
      result.data.icon.true = result.data.icon.true || {};
      result.data.icon.true.color = color;
    }
    if (entity.ScreensaverEntityIconOff) {
      result.data.icon = {
        ...result.data.icon,
        ...{
          false: { value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOff) }
        }
      };
    }
    if (color) {
      result.data.icon = result.data.icon || {};
      result.data.icon.false = result.data.icon.false || {};
      result.data.icon.false.color = colorOff;
    }
    if (entity.ScreensaverEntityIconColor && isIconScaleElement(entity.ScreensaverEntityIconColor)) {
      result.data.icon = {
        ...result.data.icon,
        scale: {
          type: "const",
          constVal: entity.ScreensaverEntityIconColor
        }
      };
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
    if (typeof possibleId === "string") {
      const state = import_Color.Color.isScriptRGB(possibleId) || possibleId === "" || possibleId.endsWith(".") ? false : await this.existsState(possibleId);
      if (!import_Color.Color.isScriptRGB(possibleId) && state) {
        if (isTrigger) {
          return { type: "triggered", dp: possibleId };
        }
        return { type: "state", dp: possibleId };
      }
    }
    return { type: "const", constVal: possibleId };
  }
  async getIconColor(item, def = void 0) {
    if (isIconScaleElement(item)) {
    } else if (typeof item === "string" && await this.existsState(item)) {
      return await this.getFieldAsDataItemConfig(item);
    } else if (import_Color.Color.isRGB(item)) {
      return { type: "const", constVal: item };
    } else if (import_Color.Color.isScriptRGB(item)) {
      return { type: "const", constVal: import_Color.Color.convertScriptRGBtoRGB(item) };
    } else if (import_Color.Color.isRGB(def)) {
      return { type: "const", constVal: def };
    } else if (import_Color.Color.isScriptRGB(def)) {
      return { type: "const", constVal: import_Color.Color.convertScriptRGBtoRGB(def) };
    }
    this.adapter.log.warn(`Invalid color value: ${JSON.stringify(item)}`);
    return void 0;
  }
  async existsState(id) {
    if (!id || id.endsWith(".")) {
      return false;
    }
    return await this.adapter.getForeignStateAsync(id) != null;
  }
  async existsAndWriteableState(id) {
    var _a;
    if (!await this.existsState(id)) {
      return false;
    }
    const state = await this.adapter.getForeignObjectAsync(id);
    return state != null && ((_a = state.common) == null ? void 0 : _a.write) === true;
  }
  async delete() {
    var _a;
    await ((_a = this.statesController) == null ? void 0 : _a.delete());
    this.statesController = void 0;
  }
}
function isIconScaleElement(obj) {
  return obj && obj.val_min !== void 0 && obj.val_max !== void 0;
}
function isPageItemDataItemsOptions(obj) {
  return obj && obj.modeScr && obj.data;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConfigManager
});
//# sourceMappingURL=config-manager.js.map
