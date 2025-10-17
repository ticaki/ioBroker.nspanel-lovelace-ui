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
var globals = __toESM(require("../types/function-and-const"));
var import_function_and_const = require("../types/function-and-const");
var import_library = require("../controller/library");
var import_navigation = require("./navigation");
var fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_pageThermo2 = require("../pages/pageThermo2");
var import_pageMedia = require("../pages/pageMedia");
var import_type_pageItem = require("../types/type-pageItem");
var import_tools = require("../const/tools");
class ConfigManager extends import_library.BaseClass {
  //private test: ConfigManager.DeviceState;
  //colorOn: RGB = Color.On;
  //colorOff: RGB = Color.Off;
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
    if (!configuration || typeof configuration !== "object") {
      this.log.error(`Invalid configuration from Script: ${configuration || "undefined"}`);
      return { messages: ["Abort: Invalid configuration"], panelConfig: void 0 };
    }
    if (configManagerConst.isGlobalConfig(configuration)) {
      let panelConfig2 = { pages: [], navigation: [], scriptVersion: "" };
      let messages2 = [];
      const tempConfig = { ...configuration, pages: [] };
      ({ panelConfig: panelConfig2, messages: messages2 } = await this.getPageConfig(tempConfig, panelConfig2, messages2));
      const obj2 = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
      if (obj2 && !this.dontWrite) {
        obj2.native = obj2.native || {};
        obj2.native.globalConfigRaw = configuration;
        await this.adapter.setForeignObject(this.adapter.namespace, obj2);
      }
      messages2.push(`done`);
      return { messages: messages2.map((a) => a.replaceAll("Error: ", "")), panelConfig: panelConfig2 };
    }
    configuration.advancedOptions = {
      ...configManagerConst.defaultConfig.advancedOptions || {},
      ...configuration.advancedOptions || {}
    };
    const config = {
      ...configManagerConst.defaultConfig,
      ...configuration
    };
    if (!config || !configManagerConst.isConfig(config, this.adapter)) {
      this.log.error(
        `Invalid configuration from Script: ${config ? config.panelName || config.panelTopic || JSON.stringify(config) : "undefined"}`
      );
      return { messages: ["Abort: Invalid configuration"], panelConfig: void 0 };
    }
    const panelItem = this.adapter.config.panels.find((item) => item.topic === config.panelTopic);
    if (!panelItem) {
      this.log.error(`Panel for Topic: ${config.panelTopic} not found in adapter config!`);
      return {
        messages: [
          `Abort: Topic: ${config.panelTopic} not found in Adapter configuration! Maybe wrong topic?!`
        ],
        panelConfig: void 0
      };
    }
    let messages = [];
    this.log.debug(`Start converting configuration for ${config.panelName || config.panelTopic}`);
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
        `Update Script! Panel for Topic: ${config.panelTopic} - name: ${panelItem.name} Script version ${config.version} is too low! Aborted! Required version is >=${this.breakingVersion}!`
      );
      this.log.error(messages[messages.length - 1]);
      return { messages, panelConfig: void 0 };
    }
    if (version < requiredVersion) {
      messages.push(
        `Update Script! Panel for Topic: ${config.panelTopic} name: ${panelItem.name} Script version ${config.version} is lower than the required version ${scriptVersion}!`
      );
      this.log.warn(messages[messages.length - 1]);
    } else if (version > requiredVersion) {
      messages.push(
        `Update Adapter! Panel for Topic: ${config.panelTopic} name: ${panelItem.name} Script version ${config.version} is higher than the required version ${scriptVersion}!`
      );
      this.log.warn(messages[messages.length - 1]);
    } else {
      messages.push(
        `Panel for Topic: ${config.panelTopic} name: ${panelItem.name} Script version ${config.version} is correct!`
      );
    }
    {
      const navigationAdjustRun = (oldUniqueName, newUniqueName, pages, renamedPages, maxRun = 3, indexRun = 0, runPrefix = "") => {
        if (!oldUniqueName || !newUniqueName || oldUniqueName === newUniqueName) {
          return pages;
        }
        if (indexRun++ > maxRun) {
          this.log.warn(
            `navigationAdjustRun for ${oldUniqueName} to ${newUniqueName} aborted - maxRun ${maxRun} reached!`
          );
          return pages;
        }
        const pageIndex = pages.findIndex((item) => item.uniqueName === oldUniqueName);
        if (pageIndex === -1) {
          return pages;
        }
        let page = pages[pageIndex];
        if (!page) {
          return pages;
        }
        renamedPages[oldUniqueName] = newUniqueName;
        page = { ...structuredClone(page), uniqueName: newUniqueName };
        pages.push(page);
        if ("items" in page && page.items) {
          for (let i = 0; i < page.items.length; i++) {
            const item = page.items[i];
            if (item && item.navigate && item.targetPage) {
              const origin = item.targetPage;
              for (const key in renamedPages) {
                const value = renamedPages[key];
                if (origin === value) {
                  item.targetPage = value;
                  continue;
                }
              }
              if (renamedPages[item.targetPage]) {
                item.targetPage = renamedPages[item.targetPage];
                continue;
              }
              const newName = `${runPrefix}_${item.targetPage}_copy_nav_${Math.floor(Math.random() * 1e5)}`;
              if (pages.findIndex((it) => it.uniqueName === newName) === -1) {
                pages = navigationAdjustRun(
                  item.targetPage,
                  newName,
                  pages,
                  renamedPages,
                  maxRun,
                  indexRun,
                  runPrefix
                );
              }
              item.targetPage = newName;
            }
          }
        }
        for (const t of ["next", "prev", "home", "parent"]) {
          const tag = t;
          if (page[tag] === oldUniqueName) {
            for (const key in renamedPages) {
              const value = renamedPages[key];
              if (page[tag] === value) {
                continue;
              }
            }
            if (renamedPages[page[tag]]) {
              page[tag] = renamedPages[page[tag]];
              continue;
            }
            const newName = `${runPrefix}_${page[tag]}_copy_nav_${Math.floor(Math.random() * 1e5)}`;
            if (pages.findIndex((it) => it.uniqueName === newName) === -1) {
              pages = navigationAdjustRun(
                page[tag],
                newName,
                pages,
                renamedPages,
                maxRun,
                indexRun,
                runPrefix
              );
            }
            page[tag] = newName;
          }
        }
        return pages;
      };
      const obj2 = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
      if (obj2 && obj2.native && obj2.native.globalConfigRaw) {
        const globalConfig = obj2.native.globalConfigRaw;
        if (globalConfig && configManagerConst.isGlobalConfig(globalConfig)) {
          globalConfig.maxNavigationAdjustRuns = globalConfig.maxNavigationAdjustRuns && globalConfig.maxNavigationAdjustRuns > 0 ? globalConfig.maxNavigationAdjustRuns : 3;
          const removeGlobalPageIndexs = /* @__PURE__ */ new Set();
          for (let i = 0; i < config.pages.length; i++) {
            const page = config.pages[i];
            if (page && "globalLink" in page && page.globalLink) {
              const gIndex = globalConfig.subPages.findIndex((item) => item.uniqueName === page.globalLink);
              const gPage = gIndex !== -1 ? globalConfig.subPages[gIndex] : void 0;
              if (gPage) {
                for (const t of ["next", "prev"]) {
                  const tag = t;
                  if (gPage[tag] != null) {
                    const gIndex2 = globalConfig.subPages.findIndex(
                      (item) => item.uniqueName === gPage[tag]
                    );
                    const index = config.pages.findIndex(
                      (item) => "globalLink" in item && item.globalLink === gPage[tag] || item.uniqueName === gPage[tag]
                    );
                    if (gIndex2 !== -1 && index === -1) {
                      let msg = `Global page ${gPage.uniqueName} ${tag} link to subPage ${gPage[tag]}. `;
                      if (tag === "next") {
                        msg += `Remove ${gPage[tag]} from subPages and add to pages at index ${i + 1}!`;
                      } else {
                        msg += `This is not recommended! Prev navigation will "randomly" change the order of pages! Consider to remove it!`;
                      }
                      messages.push(msg);
                      config.pages.splice(i + 1, 0, {
                        globalLink: gPage[tag]
                      });
                    }
                  }
                }
              }
            }
          }
          for (let i = config.pages.length - 1; i >= 0; i--) {
            const page = config.pages[i];
            if (page && "globalLink" in page && page.globalLink) {
              const gIndex = globalConfig.subPages.findIndex((item) => item.uniqueName === page.globalLink);
              let gPage = gIndex !== -1 ? globalConfig.subPages[gIndex] : void 0;
              if (gPage) {
                if (page.uniqueName != null && page.uniqueName !== gPage.uniqueName) {
                  globalConfig.subPages = navigationAdjustRun(
                    gPage.uniqueName,
                    page.uniqueName,
                    globalConfig.subPages,
                    {},
                    globalConfig.maxNavigationAdjustRuns,
                    0,
                    page.uniqueName
                  );
                  const index = globalConfig.subPages.findIndex(
                    (p) => p.uniqueName === page.uniqueName
                  );
                  if (index !== -1) {
                    gPage = globalConfig.subPages[index];
                    gPage.uniqueName = page.uniqueName;
                  }
                } else {
                  removeGlobalPageIndexs.add(gIndex);
                }
                config.pages[i] = {
                  ...gPage,
                  prev: void 0,
                  next: void 0,
                  home: void 0,
                  parent: void 0
                };
                if (page.heading) {
                  config.pages[i].heading = page.heading;
                }
              } else {
                config.pages.splice(i, 1);
                const msg = `Global page with uniqueName ${page.globalLink} not found!`;
                messages.push(msg);
                this.log.warn(msg);
              }
            }
          }
          for (let i = config.subPages.length - 1; i >= 0; i--) {
            const page = config.subPages[i];
            if (page && "globalLink" in page && page.globalLink) {
              const gIndex = globalConfig.subPages.findIndex((item) => item.uniqueName === page.globalLink);
              let gPage = gIndex !== -1 ? globalConfig.subPages[gIndex] : void 0;
              if (gPage) {
                if (page.uniqueName != null && page.uniqueName !== gPage.uniqueName) {
                  globalConfig.subPages = navigationAdjustRun(
                    gPage.uniqueName,
                    page.uniqueName,
                    globalConfig.subPages,
                    {},
                    globalConfig.maxNavigationAdjustRuns,
                    0,
                    page.uniqueName
                  );
                  const index = globalConfig.subPages.findIndex(
                    (p) => p.uniqueName === page.uniqueName
                  );
                  if (index !== -1) {
                    gPage = globalConfig.subPages[index];
                    gPage.uniqueName = page.uniqueName;
                  }
                } else {
                  removeGlobalPageIndexs.add(gIndex);
                }
                const existNav = page.prev != null || page.parent != null || page.next != null || page.home != null;
                config.subPages[i] = {
                  ...gPage,
                  prev: existNav ? page.prev : gPage.prev,
                  parent: existNav ? page.parent : gPage.parent,
                  next: existNav ? page.next : gPage.next,
                  home: existNav ? page.home : gPage.home
                };
                if (page.heading) {
                  config.subPages[i].heading = page.heading;
                }
              } else {
                config.subPages.splice(i, 1);
                const msg = `Global page with uniqueName ${page.globalLink} not found!`;
                messages.push(msg);
                this.log.warn(msg);
              }
            }
          }
          for (const index of Array.from(removeGlobalPageIndexs).sort((a, b) => b - a)) {
            globalConfig.subPages.splice(index, 1);
          }
          config.subPages = config.subPages.concat(globalConfig.subPages || []);
          config.navigation = (config.navigation || []).concat(globalConfig.navigation || []);
          config.nativePageItems = (config.nativePageItems || []).concat(globalConfig.nativePageItems || []);
        }
      }
    }
    if (config.advancedOptions && config.advancedOptions.extraConfigLogging) {
      this.extraConfigLogging = true;
      config.advancedOptions.extraConfigLogging = false;
    }
    config.subPages = config.subPages.filter(
      (item) => config.pages.findIndex((item2) => item.uniqueName === item2.uniqueName) === -1
    );
    let panelConfig = { pages: [], navigation: [], scriptVersion: config.version };
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
    try {
      const result = await this.getScreensaverConfig(config, messages);
      const screensaver = result.configArray;
      messages = result.messages;
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
          messages.push(`Abort - double uniqueName ${page.uniqueName} in config!`);
          this.log.error(messages[messages.length - 1]);
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
    var _a, _b, _c, _d, _e, _f, _g;
    if (panelConfig.pages === void 0) {
      panelConfig.pages = [];
    }
    if (config.pages) {
      const scriptPages = config.pages.concat(config.subPages || []);
      for (const page of scriptPages) {
        if (!page) {
          continue;
        }
        if (page.type === void 0 && page.native) {
          if ((config.subPages || []).includes(page)) {
            let left = page.prev || page.parent || void 0;
            let right = page.next || page.home || void 0;
            if (left && left === page.uniqueName) {
              left = "";
              messages.push(
                `Page: ${page.native.uniqueID || "unknown"} has left navigation to itself! Removed!`
              );
              this.log.warn(messages[messages.length - 1]);
            }
            if (right && right === page.uniqueName) {
              right = "";
              messages.push(
                `Page: ${page.native.uniqueID || "unknown"} has right navigation to itself! Removed!`
              );
              this.log.warn(messages[messages.length - 1]);
            }
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
        if (page.type !== "cardGrid" && page.type !== "cardGrid2" && page.type !== "cardGrid3" && page.type !== "cardEntities" && page.type !== "cardThermo" && page.type !== "cardThermo2" && page.type !== "cardQR" && page.type !== "cardPower" && page.type !== "cardChart" && page.type !== "cardLChart" && page.type !== "cardMedia" && page.type !== "cardSchedule") {
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
        let gridItem = {
          dpInit: "",
          alwaysOn: page.alwaysOnDisplay ? typeof page.alwaysOnDisplay === "boolean" ? "always" : "action" : "none",
          uniqueID: page.uniqueName || "",
          hidden: page.hiddenByTrigger || false,
          config: {
            card: page.type,
            data: {
              headline: await this.getFieldAsDataItemConfig(page.heading || "")
            },
            index: 0
          },
          pageItems: []
        };
        if ((((_a = gridItem.config) == null ? void 0 : _a.card) === "cardGrid" || ((_b = gridItem.config) == null ? void 0 : _b.card) === "cardGrid2" || ((_c = gridItem.config) == null ? void 0 : _c.card) === "cardGrid3" || ((_d = gridItem.config) == null ? void 0 : _d.card) === "cardEntities" || ((_e = gridItem.config) == null ? void 0 : _e.card) === "cardSchedule" || ((_f = gridItem.config) == null ? void 0 : _f.card) === "cardThermo2" || ((_g = gridItem.config) == null ? void 0 : _g.card) === "cardMedia") && (page.type === "cardGrid" || page.type === "cardGrid2" || page.type === "cardGrid3" || page.type === "cardEntities" || page.type === "cardSchedule" || page.type === "cardThermo2" || page.type === "cardMedia")) {
          gridItem.config.scrollType = page.scrollType || "page";
          gridItem.config.scrollPresentation = page.scrollPresentation || "classic";
          if (globals.isPageMenuConfig(gridItem.config) && gridItem.config.scrollPresentation === "auto") {
            gridItem.config.scrollAutoTiming = "scrollAutoTiming" in page && page.scrollAutoTiming || 15;
          }
        }
        try {
          if (page.type === "cardThermo") {
            ({ gridItem, messages } = await this.getPageThermo(page, gridItem, messages));
          }
        } catch (error) {
          messages.push(
            `Configuration error in page thermo ${page.heading || "unknown"} with uniqueName ${page.uniqueName} - ${error}`
          );
          this.log.warn(messages[messages.length - 1]);
          continue;
        }
        try {
          if (page.type === "cardThermo2") {
            ({ gridItem, messages } = await import_pageThermo2.PageThermo2.getPage(this, page, gridItem, messages));
          }
        } catch (error) {
          messages.push(
            `Configuration error in page thermo2 ${page.heading || "unknown"} with uniqueName ${page.uniqueName} - ${error}`
          );
          this.log.warn(messages[messages.length - 1]);
          continue;
        }
        try {
          if (page.type === "cardMedia") {
            ({ gridItem, messages } = await import_pageMedia.PageMedia.getPage(this, page, gridItem, messages));
          }
        } catch (error) {
          messages.push(
            `Configuration error in page media ${page.heading || "unknown"} with uniqueName ${page.uniqueName} - ${error}`
          );
          this.log.warn(messages[messages.length - 1]);
          continue;
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
          try {
            ({ gridItem, messages } = await import_pageQR.PageQR.getQRPageConfig(this, page, index, gridItem, messages));
          } catch (error) {
            messages.push(
              `Configuration error in page qr ${page.heading || "unknown"} with uniqueName ${page.uniqueName} - ${error}`
            );
            this.log.warn(messages[messages.length - 1]);
            continue;
          }
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
          try {
            ({ gridItem, messages } = await import_pagePower.PagePower.getPowerPageConfig(
              this,
              page,
              index,
              gridItem,
              messages
            ));
          } catch (error) {
            messages.push(
              `Configuration error in page power ${page.heading || "unknown"} with uniqueName ${page.uniqueName} - ${error}`
            );
            this.log.warn(messages[messages.length - 1]);
            continue;
          }
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
          try {
            ({ gridItem, messages } = await import_pageChart.PageChart.getChartPageConfig(
              this,
              index,
              gridItem,
              messages,
              page
            ));
          } catch (error) {
            messages.push(
              `Configuration error in page chart ${page.heading || "unknown"} with uniqueName ${page.uniqueName} - ${error}`
            );
            this.log.warn(messages[messages.length - 1]);
            continue;
          }
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
              if (temp.pageConfig) {
                temp.pageConfig.parent = page.uniqueName;
                scriptPages.push(temp.pageConfig);
                config.subPages.push(temp.pageConfig);
              }
            } catch (error) {
              messages.push(
                `Configuration error in page ${page.heading || "unknown"} with uniqueName ${page.uniqueName} pageitem - ${error}`
              );
              this.log.warn(messages[messages.length - 1]);
            }
          }
        }
        panelConfig.pages.push(gridItem);
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
    if (!item || !("id" in item) || !item.id || item.id.endsWith(".")) {
      const msg = `${page.uniqueName} id: ${"id" in item ? item.id : "invalid"} is invalid!`;
      messages.push(msg);
      this.log.error(msg);
      return { gridItem, messages };
    }
    const o = await this.adapter.getForeignObjectAsync(item.id);
    if (!o || !o.common || !o.common.role) {
      const msg = `${page.uniqueName} id: ${item.id} has a invalid object!`;
      messages.push(msg);
      this.log.error(msg);
      return { gridItem, messages };
    }
    const role = o.common.role;
    if (role !== "thermostat" && role !== "airCondition") {
      const msg = `${page.uniqueName} id: ${item.id} role '${role}' not supported for cardThermo!`;
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
              true: await this.getIconColor(item.onColor, import_Color.Color.activated),
              false: await this.getIconColor(item.onColor, import_Color.Color.deactivated)
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
              true: await this.getIconColor(item.onColor, import_Color.Color.activated),
              false: await this.getIconColor(item.onColor, import_Color.Color.deactivated)
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
              true: await this.getIconColor(item.onColor, import_Color.Color.activated),
              false: await this.getIconColor(item.onColor, import_Color.Color.deactivated)
            },
            headline: item.name ? await this.getFieldAsDataItemConfig(item.name) : void 0,
            valueList: { type: "const", constVal: item.popupThermoMode3 }
          }
        });
      }
    }
    return { gridItem, messages };
  }
  isNativePageItem(item) {
    return "native" in item && item.native !== void 0 && item.native !== null;
  }
  isPageBaseItem(item) {
    return !("native" in item);
  }
  async getPageNaviItemConfig(item, page) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (this.isNativePageItem(item)) {
      if (!(0, import_type_pageItem.isPageItemDataItemsOptions)(item.native)) {
        throw new Error(`Native item is not a valid PageItemDataItemsOptions`);
      }
      if (item.navigate && !item.targetPage) {
        throw new Error(`Navigate true but no targetPage defined in native item`);
      }
      return {
        ...item.native,
        data: {
          ...item.native.data,
          setNavi: { type: "const", constVal: item.targetPage }
        }
      };
    }
    if (!globals.isCardMenuRole(page.type) || !item.navigate || !item.targetPage) {
      this.log.warn(`Page type ${page.type} not supported for navigation item!`);
      return void 0;
    }
    let itemConfig = void 0;
    const obj = "id" in item && item.id && !item.id.endsWith(".") ? await this.adapter.getForeignObjectAsync(item.id) : void 0;
    if (obj && (!obj.common || !obj.common.role)) {
      throw new Error(`Role missing in ${page.uniqueName}.${"id" in item ? item.id : ""}!`);
    }
    const role = obj ? obj.common.role : null;
    const commonName = obj && obj.common ? typeof obj.common.name === "string" ? obj.common.name : obj.common.name[this.library.getLocalLanguage()] : void 0;
    const getButtonsTextTrue = async (item2, def1) => {
      return item2.buttonText ? await this.getFieldAsDataItemConfig(item2.buttonText, true) : item2.id && await this.existsState(`${item2.id}.BUTTONTEXT`) ? { type: "triggered", dp: `${item2.id}.BUTTONTEXT` } : await this.getFieldAsDataItemConfig(def1, true);
    };
    const getButtonsTextFalse = async (item2, def1) => {
      return item2.buttonTextOff ? await this.getFieldAsDataItemConfig(item2.buttonTextOff, true) : item2.id && await this.existsState(`${item2.id}.BUTTONTEXTOFF`) ? { type: "triggered", dp: `${item2.id}.BUTTONTEXTOFF` } : await getButtonsTextTrue(item2, def1);
    };
    const text1 = {
      true: await getButtonsTextTrue(item, "press"),
      false: await getButtonsTextFalse(item, "press")
    };
    const text = {
      true: {
        value: item.name ? await this.getFieldAsDataItemConfig(item.name) : commonName ? { type: "const", constVal: commonName } : { type: "const", constVal: "Info" },
        prefix: item.prefixName ? await this.getFieldAsDataItemConfig(item.prefixName) : void 0,
        suffix: item.suffixName ? await this.getFieldAsDataItemConfig(item.suffixName) : void 0
      },
      false: {
        value: item.name ? await this.getFieldAsDataItemConfig(item.name) : commonName ? { type: "const", constVal: commonName } : { type: "const", constVal: "Info" },
        prefix: item.prefixName ? await this.getFieldAsDataItemConfig(item.prefixName) : void 0,
        suffix: item.suffixName ? await this.getFieldAsDataItemConfig(item.suffixName) : void 0
      },
      textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0
    };
    const iconTextDefaults = {
      unit: item.unit ? { type: "const", constVal: item.unit } : void 0,
      textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0,
      prefix: globals.isCardEntitiesType(page.type) && item.prefixValue ? await this.getFieldAsDataItemConfig(item.prefixValue) : void 0,
      suffix: globals.isCardEntitiesType(page.type) && item.suffixValue ? await this.getFieldAsDataItemConfig(item.suffixValue) : void 0
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
              color: await this.getIconColor(item.onColor, import_Color.Color.activated)
            },
            scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
            maxBri: void 0,
            minBri: void 0
          },
          text1,
          text
        }
      };
    }
    if (role == null) {
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
    let valueDisplayRole = "iconNotText";
    if (globals.isCardGridType(page.type) && item.useValue) {
      const actual = (_a = foundedStates == null ? void 0 : foundedStates[role]) == null ? void 0 : _a.ACTUAL;
      let t;
      if (actual == null ? void 0 : actual.dp) {
        const o = await this.adapter.getForeignObjectAsync(actual.dp);
        t = (_b = o == null ? void 0 : o.common) == null ? void 0 : _b.type;
      } else {
        t = actual == null ? void 0 : actual.type;
      }
      valueDisplayRole = t === "string" || t === "number" || t === "mixed" ? "textNotIcon" : "iconNotText";
    }
    this.log.debug(
      `page: '${page.type}' Item: '${item.id}', role: '${role}', valueDisplayRole: '${valueDisplayRole}', useValue: ${item.useValue}`
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
                  constVal: String(icon)
                },
                color: await this.getIconColor(item.onColor, import_Color.Color.on)
              },
              false: {
                value: {
                  type: "const",
                  constVal: icon2
                },
                color: await this.getIconColor(item.offColor, import_Color.Color.off)
              },
              scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
              maxBri: void 0,
              minBri: void 0
            },
            text1,
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
                color: await this.getIconColor(item.onColor, import_Color.Color.light)
              },
              false: {
                value: {
                  type: "const",
                  constVal: item.icon2 || "lightbulb-outline"
                },
                color: await this.getIconColor(item.offColor, import_Color.Color.dark)
              },
              scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
              maxBri: void 0,
              minBri: void 0
            },
            text1,
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
          role: "",
          data: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: item.icon || "gesture-tap-button"
                },
                color: await this.getIconColor(item.onColor, import_Color.Color.activated)
              },
              false: {
                value: {
                  type: "const",
                  constVal: item.icon2 || "gesture-tap-button"
                },
                color: await this.getIconColor(item.offColor, import_Color.Color.deactivated)
              },
              scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
              maxBri: void 0,
              minBri: void 0
            },
            text1,
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
          role: valueDisplayRole,
          template: "button.humidity",
          data: {
            entity1: {
              value: foundedStates[role].ACTUAL,
              unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0
            },
            icon: {
              true: {
                value: item.icon ? { type: "const", constVal: item.icon } : void 0,
                color: await this.getIconColor(item.onColor, import_Color.Color.cold),
                text: {
                  ...iconTextDefaults,
                  value: foundedStates[role].ACTUAL
                }
              },
              false: {
                value: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0,
                color: await this.getIconColor(item.offColor, import_Color.Color.hot),
                text: {
                  ...iconTextDefaults,
                  value: foundedStates[role].ACTUAL
                }
              },
              scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : {
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
          role: valueDisplayRole,
          template: "button.temperature",
          data: {
            entity1: {
              value: foundedStates[role].ACTUAL,
              unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0
            },
            icon: {
              true: {
                value: item.icon ? { type: "const", constVal: item.icon } : void 0,
                color: await this.getIconColor(item.onColor, import_Color.Color.hot),
                text: {
                  ...iconTextDefaults,
                  value: foundedStates[role].ACTUAL
                }
              },
              false: {
                value: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0,
                color: await this.getIconColor(item.offColor, import_Color.Color.cold),
                text: {
                  ...iconTextDefaults,
                  value: foundedStates[role].ACTUAL
                }
              },
              scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0
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
              true: await this.getIconColor(item.onColor, import_Color.Color.open),
              false: await this.getIconColor(item.offColor, import_Color.Color.close),
              scale: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
            },
            icon: {
              true: item.icon ? { type: "const", constVal: item.icon } : void 0,
              false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
            },
            data: {
              text,
              text1,
              entity1: {
                value: foundedStates[role].ACTUAL,
                minScale: { type: "const", constVal: (_c = item.minValueLevel) != null ? _c : tempMinScale },
                maxScale: { type: "const", constVal: (_d = item.maxValueLevel) != null ? _d : tempMaxScale }
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
              true: await this.getIconColor(item.onColor, import_Color.Color.open),
              false: await this.getIconColor(item.offColor, import_Color.Color.close),
              scale: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
            },
            icon: {
              true: item.icon ? { type: "const", constVal: item.icon } : void 0,
              false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
            },
            data: {
              entity1: { value: foundedStates[role].ACTUAL },
              text,
              text1,
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
            true: await this.getIconColor(item.onColor, import_Color.Color.open),
            false: await this.getIconColor(item.offColor, import_Color.Color.close),
            scale: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
          },
          data: {
            entity1: { value: foundedStates[role].ACTUAL },
            text1,
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
            true: await this.getIconColor(item.onColor, import_Color.Color.open),
            false: await this.getIconColor(item.offColor, import_Color.Color.close),
            scale: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
          },
          data: {
            entity1: { value: foundedStates[role].ACTUAL },
            text1,
            text,
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "media": {
        itemConfig = {
          template: void 0,
          type: "button",
          role: "iconNotText",
          dpInit: item.id,
          data: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: item.icon || "play-box-multiple"
                },
                color: await this.getIconColor(item.onColor, import_Color.Color.activated)
              },
              false: {
                value: {
                  type: "const",
                  constVal: item.icon2 || "play-box-multiple-outline"
                },
                color: await this.getIconColor(item.offColor, import_Color.Color.deactivated)
              },
              scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0
            },
            text,
            entity1: {
              value: foundedStates[role].STATE
            },
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
            true: await this.getIconColor(item.onColor, import_Color.Color.attention),
            false: await this.getIconColor(item.offColor, import_Color.Color.deactivated),
            scale: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
          },
          data: {
            entity1: { value: foundedStates[role].ACTUAL },
            text1,
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
          role: valueDisplayRole,
          color: {
            true: await this.getIconColor(item.onColor, import_Color.Color.activated),
            false: await this.getIconColor(item.offColor, import_Color.Color.deactivated),
            scale: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
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
            icon: {
              false: {
                value: { type: "const", constVal: "volume-mute" },
                text: {
                  value: foundedStates[role].ACTUAL,
                  unit: { type: "const", constVal: "%" }
                },
                color: { type: "const", constVal: import_Color.Color.off }
              },
              true: {
                value: foundedStates[role].ACTUAL ? {
                  ...foundedStates[role].ACTUAL,
                  read: `{
                                                            if (val > 66) {
                                                                return 'volume-high';
                                                            }
                                                            if (val > 33) {
                                                                return 'volume-medium';
                                                            }
                                                            if (val > 0) {
                                                                return 'volume-low';
                                                            }
                                                            return 'volume-mute';
                                                        }`
                } : void 0,
                text: {
                  value: foundedStates[role].ACTUAL,
                  unit: { type: "const", constVal: "%" }
                },
                color: { type: "const", constVal: import_Color.Color.on }
              }
            },
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
            true: await this.getIconColor(item.onColor, import_Color.Color.attention),
            false: await this.getIconColor(item.offColor, import_Color.Color.deactivated),
            scale: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
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
        let adapterRole = "";
        let commonUnit = "";
        if (foundedStates[role].ACTUAL && foundedStates[role].ACTUAL.dp) {
          const o = await this.adapter.getForeignObjectAsync(foundedStates[role].ACTUAL.dp);
          if ((_e = o == null ? void 0 : o.common) == null ? void 0 : _e.unit) {
            commonUnit = o.common.unit;
          }
          if (((_f = o == null ? void 0 : o.common) == null ? void 0 : _f.type) === "boolean") {
            adapterRole = "iconNotText";
          } else {
            adapterRole = valueDisplayRole;
          }
        }
        itemConfig = {
          type: "button",
          role: adapterRole,
          template: void 0,
          data: {
            icon: {
              true: {
                value: item.icon ? { type: "const", constVal: item.icon } : {
                  type: "const",
                  constVal: "information-outline"
                },
                color: await this.getIconColor(item.onColor || `${item.id}.COLORDEC`, import_Color.Color.activated),
                text: {
                  value: foundedStates[role].ACTUAL
                }
              },
              false: {
                value: item.icon2 ? { type: "const", constVal: item.icon2 } : item.icon ? { type: "const", constVal: item.icon } : {
                  type: "const",
                  constVal: "information-off-outline"
                },
                color: await this.getIconColor(
                  item.offColor || `${item.id}.COLORDEC`,
                  import_Color.Color.deactivated
                ),
                text: {
                  value: foundedStates[role].ACTUAL
                }
              },
              scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0
            },
            text,
            text1,
            entity1: {
              value: foundedStates[role].ACTUAL
            },
            entity2: {
              value: foundedStates[role].ACTUAL,
              unit: item.unit ? { type: "const", constVal: item.unit } : { type: "const", constVal: commonUnit },
              prefix: globals.isCardEntitiesType(page.type) && item.prefixValue ? await this.getFieldAsDataItemConfig(item.prefixValue) : void 0,
              suffix: globals.isCardEntitiesType(page.type) && item.suffixValue ? await this.getFieldAsDataItemConfig(item.suffixValue) : void 0
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
          role: valueDisplayRole,
          color: {
            true: await this.getIconColor(item.onColor, import_Color.Color.open),
            false: await this.getIconColor(item.offColor, import_Color.Color.close),
            scale: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
          },
          icon: {
            true: item.icon ? { type: "const", constVal: item.icon } : void 0,
            false: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0
          },
          data: {
            text1,
            text,
            entity1: {
              value: foundedStates[role].ACTUAL,
              minScale: { type: "const", constVal: (_g = item.minValueLevel) != null ? _g : tempMinScale },
              maxScale: { type: "const", constVal: (_h = item.maxValueLevel) != null ? _h : tempMaxScale }
            },
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "select": {
        itemConfig = {
          type: "button",
          dpInit: item.id,
          role: "",
          template: "button.select",
          color: {
            true: await this.getIconColor(item.onColor, import_Color.Color.activated),
            false: await this.getIconColor(item.offColor, import_Color.Color.deactivated),
            scale: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
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
            true: await this.getIconColor(item.onColor, import_Color.Color.open),
            false: await this.getIconColor(item.offColor, import_Color.Color.close),
            scale: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
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
          role: valueDisplayRole,
          color: {
            true: await this.getIconColor(item.onColor, import_Color.Color.good),
            false: await this.getIconColor(item.offColor, import_Color.Color.bad),
            scale: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
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
                color: await this.getIconColor(item.onColor, import_Color.Color.activated)
              },
              false: {
                value: { type: "const", constVal: item.icon2 || "timer" },
                color: await this.getIconColor(item.offColor, import_Color.Color.deactivated)
              },
              scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0
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
      case "timeTable": {
        itemConfig = {
          template: "button.alias.fahrplan.departure",
          dpInit: item.id,
          type: "button",
          data: {
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      default:
        (0, import_function_and_const.exhaustiveCheck)(role);
        throw new Error(`DP: ${page.uniqueName}.${item.id} - Channel role ${role} is not supported!!!`);
    }
    if (!itemConfig) {
      this.log.warn(
        `No configuration generated for item "${item.id}" on page "${page.uniqueName}" (role: ${role}).`
      );
      return void 0;
    }
    if (item.filter != null) {
      itemConfig.filter = item.filter;
    }
    if (item.enabled === false) {
      if (!itemConfig.data) {
        itemConfig.data = {};
      }
      itemConfig.data.enabled = { type: "const", constVal: false };
    } else if (await this.existsState(`${item.id}.ENABLED`)) {
      if (!itemConfig.data) {
        itemConfig.data = {};
      }
      itemConfig.data.enabled = { type: "triggered", dp: `${item.id}.ENABLED` };
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
      for (const d of Object.keys(data)) {
        const dp = d;
        if (!data[dp] || !this.statesController) {
          continue;
        }
        const entry = data[dp];
        if (dp in result[role]) {
          const dp2 = dp;
          const expectedId = `${dpInit}.${dp}`;
          if (!entry.useKey || await this.existsState(expectedId)) {
            result[role][dp2] = await this.statesController.getIdbyAuto({
              dpInit: entry.useKey ? expectedId : dpInit,
              role: entry.role,
              enums: "",
              regexp: entry.useKey ? new RegExp(`\\.${dp}$`) : void 0,
              triggered: entry.trigger,
              writeable: entry.writeable,
              commonType: entry.type
            });
          } else {
            result[role][dp2] = void 0;
          }
          const alternate = entry.alternate;
          if (!result[role][dp2] && alternate && data[alternate]) {
            const expectedAltId = `${dpInit}.${alternate}`;
            const entry2 = data[alternate];
            if (!entry2.useKey || await this.existsState(expectedAltId)) {
              result[role][dp2] = await this.statesController.getIdbyAuto({
                dpInit: entry2.useKey ? expectedAltId : dpInit,
                role: entry2.role,
                enums: "",
                regexp: entry.useKey ? new RegExp(`\\.${alternate}$`) : void 0,
                triggered: entry.trigger,
                writeable: entry2.writeable,
                commonType: entry.type
              });
            }
          }
          if (!result[role][dp2]) {
            if (entry.required || this.extraConfigLogging) {
              messages.push(
                `${entry.required ? "Required:" : "Optional:"} ${String(dp)}: ${dpInit}, channel role: ${role} - missing - searching for ${entry.useKey ? `dp: ${expectedId}, ` : ""}type: ${JSON.stringify(entry.type)}, role: ${JSON.stringify(entry.role)}${entry.writeable ? ", common.write: true" : ""}`
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
            `Channel role ${role} - key: ${String(dp)} not found in checkedDatapoints! Please check code!`
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    let itemConfig = void 0;
    if (item.navigate) {
      if (!item.targetPage || typeof item.targetPage !== "string") {
        throw new Error(`TargetPage missing in ${item && "id" in item && item.id || "no id"}!`);
      }
      return { itemConfig: await this.getPageNaviItemConfig(item, page), messages };
    }
    if (this.isNativePageItem(item)) {
      if (!(0, import_type_pageItem.isPageItemDataItemsOptions)(item.native)) {
        throw new Error(`Native item is not a valid PageItemDataItemsOptions`);
      }
      itemConfig = item.native;
      return { itemConfig, messages };
    }
    if ("id" in item && item.id) {
      if (["delete", "empty"].includes(item.id)) {
        return { itemConfig: { type: "empty", data: void 0 }, messages };
      }
      if (item.id.endsWith(".")) {
        item.id = item.id.split(".").filter((a) => a).join(".");
        if (!item.id) {
          throw new Error(`ID missing in item or only dots found!`);
        }
      }
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
        let valueDisplayRole = "iconNotText";
        if (globals.isCardGridType(page.type) && item.useValue) {
          const actual = (_a = foundedStates == null ? void 0 : foundedStates[role]) == null ? void 0 : _a.ACTUAL;
          let t;
          if (actual == null ? void 0 : actual.dp) {
            const o = await this.adapter.getForeignObjectAsync(actual.dp);
            t = (_b = o == null ? void 0 : o.common) == null ? void 0 : _b.type;
          } else {
            t = actual == null ? void 0 : actual.type;
          }
          valueDisplayRole = t === "string" || t === "number" || t === "mixed" ? "textNotIcon" : "iconNotText";
        }
        this.log.debug(
          `page: '${page.type}' Item: '${item.id}', role: '${role}', valueDisplayRole: '${valueDisplayRole}', useValue: ${item.useValue}`
        );
        const commonName = typeof obj.common.name === "string" ? obj.common.name : obj.common.name[this.library.getLocalLanguage()];
        const getButtonsTextTrue = async (item2, def1) => {
          return item2.buttonText ? await this.getFieldAsDataItemConfig(item2.buttonText, true) : item2.id && await this.existsState(`${item2.id}.BUTTONTEXT`) ? { type: "triggered", dp: `${item2.id}.BUTTONTEXT` } : await this.getFieldAsDataItemConfig(item2.name || commonName || def1, true);
        };
        const getButtonsTextFalse = async (item2, def1) => {
          return item2.buttonTextOff ? await this.getFieldAsDataItemConfig(item2.buttonTextOff, true) : item2.id && await this.existsState(`${item2.id}.BUTTONTEXTOFF`) ? { type: "triggered", dp: `${item2.id}.BUTTONTEXTOFF` } : await getButtonsTextTrue(item2, def1);
        };
        const text = {
          true: {
            value: await getButtonsTextTrue(item, role || ""),
            prefix: item.prefixName ? await this.getFieldAsDataItemConfig(item.prefixName) : void 0,
            suffix: item.suffixName ? await this.getFieldAsDataItemConfig(item.suffixName) : void 0
          },
          false: {
            value: await getButtonsTextFalse(item, role || ""),
            prefix: item.prefixName ? await this.getFieldAsDataItemConfig(item.prefixName) : void 0,
            suffix: item.suffixName ? await this.getFieldAsDataItemConfig(item.suffixName) : void 0
          },
          textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0
        };
        const headline = await getButtonsTextTrue(item, role || "");
        item.icon2 = item.icon2 || item.icon;
        const iconTextDefaults = {
          unit: item.unit ? { type: "const", constVal: item.unit } : void 0,
          textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0,
          prefix: globals.isCardEntitiesType(page.type) && item.prefixValue ? await this.getFieldAsDataItemConfig(item.prefixValue) : void 0,
          suffix: globals.isCardEntitiesType(page.type) && item.suffixValue ? await this.getFieldAsDataItemConfig(item.suffixValue) : void 0
        };
        let pageConfig = void 0;
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
                    color: await this.getIconColor(item.onColor, import_Color.Color.on)
                  },
                  false: {
                    value: { type: "const", constVal: icon2 },
                    color: await this.getIconColor(item.offColor, import_Color.Color.off)
                  },
                  scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
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
                    color: await this.getIconColor(item.onColor, import_Color.Color.light)
                  },
                  false: {
                    value: {
                      type: "const",
                      constVal: item.icon2 || "lightbulb-outline"
                    },
                    color: await this.getIconColor(item.offColor, import_Color.Color.dark)
                  },
                  scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
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
                    color: await this.getIconColor(item.onColor, import_Color.Color.light)
                  },
                  false: {
                    value: {
                      type: "const",
                      constVal: item.icon2 || "lightbulb-outline"
                    },
                    color: await this.getIconColor(item.offColor, import_Color.Color.dark)
                  },
                  scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
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
            if ((_c = foundedStates[role].TEMPERATURE) == null ? void 0 : _c.dp) {
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
                    color: await this.getIconColor(item.onColor, import_Color.Color.light)
                  },
                  false: {
                    value: {
                      type: "const",
                      constVal: item.icon2 || "lightbulb-outline"
                    },
                    color: await this.getIconColor(item.offColor, import_Color.Color.dark)
                  },
                  scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
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
                    color: await this.getIconColor(item.onColor, import_Color.Color.activated)
                  },
                  false: {
                    value: {
                      type: "const",
                      constVal: item.icon2 || "gesture-tap-button"
                    },
                    color: await this.getIconColor(item.offColor, import_Color.Color.deactivated)
                  },
                  scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
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
                      color: await this.getIconColor(item.onColor, import_Color.Color.open)
                    },
                    false: {
                      value: {
                        type: "const",
                        constVal: item.icon2 || "window-shutter"
                      },
                      color: await this.getIconColor(item.offColor, import_Color.Color.close)
                    },
                    unstable: {
                      value: {
                        type: "const",
                        constVal: item.icon3 || "window-shutter-alert"
                      }
                    },
                    scale: {
                      type: "const",
                      constVal: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : {
                        val_min: 0,
                        val_max: 100
                      }
                    },
                    maxBri: void 0,
                    minBri: void 0
                  },
                  text: { true: { type: "const", constVal: (_d = item.secondRow) != null ? _d : "" } },
                  headline,
                  entity1: {
                    value: foundedStates[role].ACTUAL,
                    minScale: { type: "const", constVal: (_e = item.minValueLevel) != null ? _e : 0 },
                    maxScale: { type: "const", constVal: (_f = item.maxValueLevel) != null ? _f : 100 },
                    set: foundedStates[role].SET
                  },
                  entity2: {
                    value: foundedStates[role].TILT_ACTUAL,
                    minScale: { type: "const", constVal: (_g = item.minValueTilt) != null ? _g : 0 },
                    maxScale: { type: "const", constVal: (_h = item.maxValueTilt) != null ? _h : 100 },
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
              const I2 = (_i = item.shutterIcons && item.shutterIcons[0]) != null ? _i : void 0;
              const R2 = item.shutterIcons && item.shutterIcons[0] && item.shutterIcons[0].id && await this.existsState(item.shutterIcons[0].id) ? item.shutterIcons[0].id : void 0;
              const S2 = R2 && await this.existsAndWriteableState(R2) ? R2 : void 0;
              const I3 = (_j = item.shutterIcons && item.shutterIcons[1]) != null ? _j : void 0;
              const R3 = item.shutterIcons && item.shutterIcons[1] && item.shutterIcons[1].id && await this.existsState(item.shutterIcons[1].id) ? item.shutterIcons[1].id : void 0;
              const S3 = R3 && await this.existsAndWriteableState(R3) ? R3 : void 0;
              const I4 = (_k = item.shutterIcons && item.shutterIcons[2]) != null ? _k : void 0;
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
                      color: await this.getIconColor(item.onColor, import_Color.Color.open)
                    },
                    false: {
                      value: {
                        type: "const",
                        constVal: item.icon2 || "window-shutter"
                      },
                      color: await this.getIconColor(item.offColor, import_Color.Color.close)
                    },
                    unstable: {
                      value: {
                        type: "const",
                        constVal: item.icon3 || "window-shutter-alert"
                      }
                    },
                    scale: {
                      type: "const",
                      constVal: (_l = globals.isIconColorScaleElement(item.colorScale)) != null ? _l : {
                        val_min: 0,
                        val_max: 100
                      }
                    },
                    maxBri: void 0,
                    minBri: void 0
                  },
                  text: { true: { type: "const", constVal: (_m = item.secondRow) != null ? _m : "" } },
                  headline,
                  entity1: {
                    value: foundedStates[role].ACTUAL,
                    minScale: { type: "const", constVal: (_n = item.minValueLevel) != null ? _n : 0 },
                    maxScale: { type: "const", constVal: (_o = item.maxValueLevel) != null ? _o : 100 },
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
                      color: await this.getIconColor(I2 == null ? void 0 : I2.iconOnColor, import_Color.Color.open)
                    },
                    false: {
                      value: {
                        type: "const",
                        constVal: (I2 == null ? void 0 : I2.icon2) || "window-shutter"
                      },
                      color: await this.getIconColor(I2 == null ? void 0 : I2.iconOffColor, import_Color.Color.close)
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
                      color: await this.getIconColor(I3 == null ? void 0 : I3.iconOnColor, import_Color.Color.open)
                    },
                    false: {
                      value: {
                        type: "const",
                        constVal: (I3 == null ? void 0 : I3.icon2) || "window-shutter"
                      },
                      color: await this.getIconColor(I3 == null ? void 0 : I3.iconOffColor, import_Color.Color.close)
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
                      color: await this.getIconColor(I4 == null ? void 0 : I4.iconOnColor, import_Color.Color.open)
                    },
                    false: {
                      value: {
                        type: "const",
                        constVal: (I4 == null ? void 0 : I4.icon2) || "window-shutter"
                      },
                      color: await this.getIconColor(I4 == null ? void 0 : I4.iconOffColor, import_Color.Color.close)
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
                      color: await this.getIconColor(item.onColor, import_Color.Color.open)
                    },
                    false: {
                      value: {
                        type: "const",
                        constVal: item.icon2 || "garage"
                      },
                      color: await this.getIconColor(item.offColor, import_Color.Color.close)
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
                  up: ((_p = foundedStates[role].SET) == null ? void 0 : _p.type) === "state" ? {
                    ...foundedStates[role].SET,
                    type: "state",
                    dp: `${item.id}.SET`,
                    write: "return true;"
                  } : void 0,
                  down: ((_q = foundedStates[role].SET) == null ? void 0 : _q.type) === "state" ? {
                    ...foundedStates[role].SET,
                    type: "state",
                    dp: `${item.id}.SET`,
                    write: "return false;"
                  } : void 0,
                  stop: foundedStates[role].STOP
                }
              };
              break;
            } else {
              itemConfig = {
                template: "text.gate.isOpen",
                dpInit: item.id,
                color: {
                  true: await this.getIconColor(item.onColor, import_Color.Color.open),
                  false: await this.getIconColor(item.offColor, import_Color.Color.close),
                  scale: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
                },
                data: {
                  entity1: { value: foundedStates[role].ACTUAL }
                }
              };
            }
            break;
          }
          case "motion":
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
              case "thermostat":
              case "airCondition":
              case "value.temperature":
              case "temperature": {
                iconOn = "thermometer";
                iconOff = "snowflake-thermometer";
                iconUnstable = "sun-thermometer";
                adapterRole = valueDisplayRole;
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
                adapterRole = valueDisplayRole;
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
              template: "",
              data: {
                icon: {
                  true: {
                    value: await this.getFieldAsDataItemConfig(item.icon || iconOn),
                    color: await this.getIconColor(
                      item.onColor || `${item.id}.COLORDEC`,
                      import_Color.Color.good
                    ),
                    text: await this.existsState(`${item.id}.ACTUAL`) ? {
                      ...iconTextDefaults,
                      value: foundedStates[role].ACTUAL
                    } : void 0
                  },
                  false: {
                    value: await this.getFieldAsDataItemConfig(item.icon2 || iconOff),
                    color: await this.getIconColor(
                      item.offColor || `${item.id}.COLORDEC`,
                      import_Color.Color.bad
                    ),
                    text: await this.existsState(`${item.id}.ACTUAL`) ? {
                      ...iconTextDefaults,
                      value: foundedStates[role].ACTUAL
                    } : void 0
                  },
                  unstable: {
                    value: await this.getFieldAsDataItemConfig(item.icon3 || iconUnstable)
                  },
                  scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : { type: "const", constVal: scaleVal },
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
                entity2: role === "temperature" || role === "humidity" || role === "value.temperature" || role === "value.humidity" ? {
                  value: foundedStates[role].ACTUAL,
                  prefix: globals.isCardEntitiesType(page.type) && item.prefixValue ? await this.getFieldAsDataItemConfig(item.prefixValue) : void 0,
                  suffix: globals.isCardEntitiesType(page.type) && item.suffixValue ? await this.getFieldAsDataItemConfig(item.suffixValue) : void 0,
                  unit: item.unit || commonUnit ? { type: "const", constVal: item.unit || commonUnit } : void 0
                } : void 0
              }
            };
            itemConfig = tempItem;
            break;
          }
          case "info": {
            let adapterRole = "";
            let commonUnit = "";
            if (foundedStates[role].ACTUAL && foundedStates[role].ACTUAL.dp) {
              const o = await this.adapter.getForeignObjectAsync(foundedStates[role].ACTUAL.dp);
              if (o && o.common) {
                if (o.common.unit) {
                  commonUnit = o.common.unit;
                }
                if (o.common.type === "boolean") {
                  adapterRole = "iconNotText";
                } else {
                  adapterRole = valueDisplayRole;
                }
              }
            }
            const icontemp = item.icon2 || item.icon;
            const tempItem = {
              type: "text",
              role: adapterRole,
              template: "",
              data: {
                icon: {
                  true: {
                    value: item.icon ? await this.getFieldAsDataItemConfig(item.icon) : await this.existsState(`${item.id}.USERICON`) ? { type: "triggered", dp: `${item.id}.USERICON` } : { type: "const", constVal: "information-outline" },
                    color: item.onColor ? await this.getIconColor(item.onColor, import_Color.Color.good) : await this.existsState(`${item.id}.COLORDEC`) ? { type: "triggered", dp: `${item.id}.COLORDEC` } : { type: "const", constVal: import_Color.Color.bad },
                    text: await this.existsState(`${item.id}.ACTUAL`) ? {
                      ...iconTextDefaults,
                      value: foundedStates[role].ACTUAL
                    } : void 0
                  },
                  false: {
                    value: icontemp ? await this.getFieldAsDataItemConfig(icontemp) : await this.existsState(`${item.id}.USERICON`) ? { type: "triggered", dp: `${item.id}.USERICON` } : { type: "const", constVal: "information-off-outline" },
                    color: item.offColor ? await this.getIconColor(item.offColor, import_Color.Color.good) : await this.existsState(`${item.id}.COLORDEC`) ? { type: "triggered", dp: `${item.id}.COLORDEC` } : { type: "const", constVal: import_Color.Color.bad },
                    text: await this.existsState(`${item.id}.ACTUAL`) ? {
                      ...iconTextDefaults,
                      value: foundedStates[role].ACTUAL
                    } : void 0
                  },
                  scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0
                },
                text,
                text1: { true: foundedStates[role].ACTUAL },
                entity1: { value: foundedStates[role].ACTUAL },
                entity2: {
                  value: foundedStates[role].ACTUAL,
                  unit: item.unit ? { type: "const", constVal: item.unit } : { type: "const", constVal: commonUnit },
                  prefix: globals.isCardEntitiesType(page.type) && item.prefixValue ? await this.getFieldAsDataItemConfig(item.prefixValue) : void 0,
                  suffix: globals.isCardEntitiesType(page.type) && item.suffixValue ? await this.getFieldAsDataItemConfig(item.suffixValue) : void 0
                }
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
              role: valueDisplayRole,
              color: {
                true: await this.getIconColor(item.onColor, import_Color.Color.on),
                false: await this.getIconColor(item.offColor, import_Color.Color.off),
                scale: globals.isIconColorScaleElement(item.colorScale) ? item.colorScale : void 0
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
                text,
                icon: {
                  false: {
                    value: { type: "const", constVal: "volume-mute" },
                    text: {
                      value: foundedStates[role].ACTUAL,
                      unit: { type: "const", constVal: "%" },
                      textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0
                    },
                    color: { type: "const", constVal: import_Color.Color.off }
                  },
                  true: {
                    value: foundedStates[role].ACTUAL ? {
                      ...foundedStates[role].ACTUAL,
                      read: `{
                                                            if (val > 66) {
                                                                return 'volume-high';
                                                            }
                                                            if (val > 33) {
                                                                return 'volume-medium';
                                                            }
                                                            if (val > 0) {
                                                                return 'volume-low';
                                                            }
                                                            return 'volume-mute';
                                                        }`
                    } : void 0,
                    text: {
                      value: foundedStates[role].ACTUAL,
                      unit: { type: "const", constVal: "%" },
                      textSize: item.fontSize ? { type: "const", constVal: item.fontSize } : void 0
                    },
                    color: { type: "const", constVal: import_Color.Color.on }
                  }
                }
              }
            };
            break;
          }
          case "select": {
            item.icon2 = item.icon2 || item.icon;
            if (!item.modeList && foundedStates[role].SET && foundedStates[role].SET.dp) {
              const o = await this.adapter.getForeignObjectAsync(foundedStates[role].SET.dp);
              if (o && o.common && !o.common.states) {
                const alias = (_r = o.common.alias) == null ? void 0 : _r.id;
                if (alias) {
                  const aliasObj = await this.adapter.getForeignObjectAsync(alias);
                  if (aliasObj && aliasObj.type === "state" && aliasObj.common && aliasObj.common.states) {
                    if (foundedStates[role].SET.dp === ((_s = foundedStates[role].ACTUAL) == null ? void 0 : _s.dp)) {
                      foundedStates[role].ACTUAL = { ...foundedStates[role].SET, dp: alias };
                    }
                    foundedStates[role].SET = { ...foundedStates[role].SET, dp: alias };
                  }
                }
              }
            }
            itemConfig = {
              type: "input_sel",
              dpInit: item.id,
              role: "",
              /* color: {
                  true: await this.getIconColor(item.onColor, Color.),
                  false: await this.getIconColor(item.offColor, Color.),
                  scale: Types.isIconColorScaleElement(item.colorScale) ? item.colorScale : undefined,
              },
              icon: {
                  true: item.icon ? { type: 'const', constVal: item.icon } : undefined,
                  false: item.icon2 ? { type: 'const', constVal: item.icon2 } : undefined,
              }, */
              data: {
                entityInSel: {
                  value: foundedStates[role].ACTUAL,
                  set: foundedStates[role].SET
                },
                text: { true: foundedStates[role].ACTUAL },
                valueList: item.modeList ? { type: "const", constVal: item.modeList } : void 0,
                icon: {
                  true: {
                    value: { type: "const", constVal: item.icon || "clipboard-list-outline" },
                    color: { type: "const", constVal: item.onColor || import_Color.Color.Green }
                  },
                  false: {
                    value: { type: "const", constVal: item.icon2 || "clipboard-list" },
                    color: { type: "const", constVal: item.offColor || import_Color.Color.Red }
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
                    color: await this.getIconColor(item.onColor, import_Color.Color.open)
                  },
                  false: {
                    value: {
                      type: "const",
                      constVal: item.icon2 || "lock"
                    },
                    color: await this.getIconColor(item.offColor, import_Color.Color.close)
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
                  JSON.stringify({
                    ...foundedStates[role].SET,
                    type: "state",
                    write: "return true"
                  })
                ) : void 0,
                down: foundedStates[role].SET ? JSON.parse(
                  JSON.stringify({
                    ...foundedStates[role].SET,
                    type: "state",
                    write: "return false"
                  })
                ) : void 0,
                up2: void 0,
                down2: void 0,
                stop2: void 0
              }
            };
            break;
          }
          case "slider": {
            itemConfig = {
              dpInit: item.id,
              type: "number",
              role: valueDisplayRole,
              template: "",
              data: {
                icon: {
                  true: {
                    value: item.icon ? { type: "const", constVal: item.icon } : { type: "const", constVal: "plus-minus-variant" },
                    text: {
                      ...iconTextDefaults,
                      value: foundedStates[role].ACTUAL
                    },
                    color: await this.getIconColor(item.onColor, import_Color.Color.activated)
                  },
                  false: item.icon2 ? {
                    value: item.icon2 ? { type: "const", constVal: item.icon2 } : void 0,
                    text: {
                      ...iconTextDefaults,
                      value: foundedStates[role].ACTUAL
                    },
                    color: await this.getIconColor(item.offColor, import_Color.Color.deactivated)
                  } : void 0,
                  scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0
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
                    color: await this.getIconColor(item.onColor, import_Color.Color.attention)
                  },
                  false: {
                    value: { type: "const", constVal: item.icon2 || "alert-decagram-outline" },
                    color: await this.getIconColor(item.offColor, import_Color.Color.deactivated)
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
                    color: await this.getIconColor(item.onColor, import_Color.Color.activated)
                  },
                  false: {
                    value: {
                      type: "const",
                      constVal: item.icon2 || iconFalse || "timer"
                    },
                    color: await this.getIconColor(item.offColor, import_Color.Color.deactivated)
                  },
                  scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0,
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
            if ((_t = foundedStates[role].MODE) == null ? void 0 : _t.dp) {
              const o = await this.adapter.getForeignObjectAsync(foundedStates[role].MODE.dp);
              if ((_u = o == null ? void 0 : o.common) == null ? void 0 : _u.states) {
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
          case "media": {
            const offIcon = item.icon2 || item.icon;
            let id = ((_v = foundedStates[role].STATE) == null ? void 0 : _v.dp) || item.id;
            let defaultColorOn = import_Color.Color.on;
            let defaultColorOff = import_Color.Color.off;
            let defaultIconOn = "pause";
            let defaultIconOff = "play";
            let nav = void 0;
            if (!await this.existsState(id)) {
              throw new Error(`DP: ${item.id} - media STATE ${id} not found!`);
            }
            if (!item.asControl) {
              const o = await this.adapter.getForeignObjectAsync(id);
              if (!o || !((_w = o.common.alias) == null ? void 0 : _w.id)) {
                throw new Error(`DP: ${item.id} - media STATE ${id} has no alias!`);
              }
              id = o.common.alias.id;
              if (!await this.existsState(id)) {
                throw new Error(`DP: ${item.id} - media ALIAS STATE ${id} not found!`);
              }
              const { messages: messages2 } = await import_pageMedia.PageMedia.getPage(
                this,
                {
                  media: { id },
                  uniqueName: `media-${item.id}`,
                  type: "cardMedia",
                  items: [],
                  heading: ""
                },
                {
                  template: void 0,
                  dpInit: id,
                  uniqueID: `media-${item.id}`,
                  pageItems: [],
                  config: { card: "cardMedia", data: {} },
                  alwaysOn: "none"
                },
                [],
                true
              );
              if (messages2[0] !== "done") {
                throw new Error(`DP: ${item.id} - media ALIAS STATE ${id} not supported!`);
              }
              pageConfig = {
                type: "cardMedia",
                uniqueName: `media-${item.id}`,
                media: { id },
                heading: "",
                items: []
              };
              nav = { type: "const", constVal: `media-${item.id}` };
              defaultColorOn = import_Color.Color.activated;
              defaultColorOff = import_Color.Color.deactivated;
              defaultIconOn = "play-box-multiple";
              defaultIconOff = "play-box-multiple-outline";
            }
            itemConfig = {
              role: "",
              type: "button",
              dpInit: item.id,
              template: void 0,
              data: {
                icon: {
                  true: {
                    value: item.icon ? { type: "const", constVal: item.icon } : { type: "const", constVal: defaultIconOn },
                    color: await this.getIconColor(item.onColor, defaultColorOn)
                  },
                  false: {
                    value: offIcon ? { type: "const", constVal: offIcon } : { type: "const", constVal: defaultIconOff },
                    color: await this.getIconColor(item.offColor, defaultColorOff)
                  },
                  scale: globals.isIconColorScaleElement(item.colorScale) ? { type: "const", constVal: item.colorScale } : void 0
                },
                text,
                text1: {
                  true: headline
                },
                entity1: {
                  value: foundedStates[role].STATE
                },
                setNavi: nav
              }
            };
            break;
          }
          default: {
            (0, import_function_and_const.exhaustiveCheck)(role);
            const roleStr = typeof role === "string" ? role : String(role);
            throw new Error(`DP: ${item.id} - Channel role ${roleStr} is not supported!!!`);
          }
        }
        if (item.filter != null && itemConfig) {
          itemConfig.filter = item.filter;
        }
        if (item.enabled === false && itemConfig) {
          if (!itemConfig.data) {
            itemConfig.data = {};
          }
          itemConfig.data.enabled = { type: "const", constVal: false };
        } else if (itemConfig && await this.existsState(`${item.id}.ENABLED`)) {
          if (!itemConfig.data) {
            itemConfig.data = {};
          }
          itemConfig.data.enabled = { type: "triggered", dp: `${item.id}.ENABLED` };
        }
        return { itemConfig, messages, pageConfig };
      }
      throw new Error(`Object ${item.id} not found!`);
    }
    return { itemConfig: void 0, messages };
  }
  async getScreensaverConfig(config, messages = []) {
    var _a, _b, _c, _d, _e, _f;
    let pageItems = [];
    const loadElementSection = async (items, mode, errorLabel) => {
      if (!items || items.length === 0) {
        return [];
      }
      const tasks = items.map(
        (item) => this.getEntityData(item, mode, config).catch((err) => {
          const msg = `${errorLabel} - ${String(err)}`;
          messages.push(msg);
          this.log.error(msg);
          return null;
        })
      );
      const res = await Promise.all(tasks);
      return res.filter((r) => !!r);
    };
    const loadNotifySection = async (items, mode, errorLabel) => {
      if (!items || items.length === 0) {
        return [];
      }
      const tasks = items.map(
        (item) => this.getNotifyEntityData(item, mode).catch((err) => {
          const msg = `${errorLabel} - ${String(err)}`;
          messages.push(msg);
          this.log.error(msg);
          return null;
        })
      );
      const res = await Promise.all(tasks);
      return res.filter((r) => !!r);
    };
    const loadElementSectionUndef = async (items, mode, errorLabel) => {
      if (!items || items.length === 0) {
        return [];
      }
      const tasks = items.map((item) => {
        if (!item) {
          return Promise.resolve(null);
        }
        return this.getEntityData(item, mode, config).catch((err) => {
          const msg = `${errorLabel} - ${String(err)}`;
          messages.push(msg);
          this.log.error(msg);
          return null;
        });
      });
      const res = await Promise.all(tasks);
      return res.filter((r) => !!r);
    };
    const loadMrIcon = async (entity, errorLabel) => {
      if (!entity) {
        return [];
      }
      try {
        const r = await this.getMrEntityData(entity, "mricon");
        return [r];
      } catch (err) {
        {
          const msg = `${errorLabel} - ${String(err)}`;
          messages.push(msg);
          this.log.error(msg);
          return [];
        }
      }
    };
    const countBefore = {
      favorit: ((_a = config.favoritScreensaverEntity) == null ? void 0 : _a.length) || 0,
      alternate: ((_b = config.alternateScreensaverEntity) == null ? void 0 : _b.length) || 0,
      left: ((_c = config.leftScreensaverEntity) == null ? void 0 : _c.length) || 0,
      bottom: ((_d = config.bottomScreensaverEntity) == null ? void 0 : _d.length) || 0,
      indicator: ((_e = config.indicatorScreensaverEntity) == null ? void 0 : _e.length) || 0,
      mrIcon1: config.mrIcon1ScreensaverEntity ? 1 : 0,
      mrIcon2: config.mrIcon2ScreensaverEntity ? 1 : 0,
      notify: ((_f = config.notifyScreensaverEntity) == null ? void 0 : _f.length) || 0
    };
    const blocks = await Promise.all([
      loadElementSection(config.favoritScreensaverEntity, "favorit", "favoritScreensaverEntity"),
      loadElementSection(config.alternateScreensaverEntity, "alternate", "alternateScreensaverEntity"),
      loadElementSectionUndef(config.leftScreensaverEntity, "left", "leftScreensaverEntity"),
      loadElementSection(config.bottomScreensaverEntity, "bottom", "bottomScreensaverEntity"),
      loadElementSectionUndef(config.indicatorScreensaverEntity, "indicator", "indicatorScreensaverEntity"),
      loadMrIcon(config.mrIcon1ScreensaverEntity, "mrIcon1ScreensaverEntity"),
      loadMrIcon(config.mrIcon2ScreensaverEntity, "mrIcon2ScreensaverEntity"),
      loadNotifySection(config.notifyScreensaverEntity, "notify", "notifyScreensaverEntity")
    ]);
    const blockNames = [
      "favorit",
      "alternate",
      "left",
      "bottom",
      "indicator",
      "mrIcon1",
      "mrIcon2",
      "notify"
    ];
    for (let i = 0; i < blocks.length; i++) {
      const arr = blocks[i];
      const blockName = blockNames[i];
      const expectedCount = Object.values(countBefore)[i];
      if (arr.length < expectedCount) {
        const msg = `Warning: ${blockName}ScreensaverEntity - loaded ${arr.length} of ${expectedCount} configured items`;
        messages.push(msg);
        this.log.warn(msg);
      }
      pageItems.push(...arr);
    }
    if (this.adapter.config.weatherEntity) {
      config.weatherEntity = this.adapter.config.weatherEntity;
    }
    if (config.weatherEntity) {
      config.weatherEntity = `${config.weatherEntity.split(".").slice(0, 2).join(".")}.`;
      const toAdd = [];
      const add = config.weatherAddDefaultItems;
      const addAll = add === true;
      const want = (k) => addAll || add != null && typeof add === "object" && add[k] !== void 0 && add[k] === true;
      if (config.weatherEntity.startsWith("accuweather.") && config.weatherEntity.endsWith(".")) {
        const instance = config.weatherEntity.split(".")[1];
        if (pageItems.findIndex((x) => x.modeScr === "favorit") === -1) {
          pageItems.push({
            template: "text.accuweather.favorit",
            dpInit: `/^accuweather\\.${instance}.+/`,
            modeScr: "favorit"
          });
        }
        {
          if (want("sunriseSet")) {
            toAdd.push({
              template: "text.accuweather.sunriseset",
              dpInit: `/^accuweather\\.${instance}.Daily.+/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay1")) {
            toAdd.push({
              template: "text.accuweather.bot2values",
              dpInit: `/^accuweather\\.${instance}.+?d1$/g`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay2")) {
            toAdd.push({
              template: "text.accuweather.bot2values",
              dpInit: `/^accuweather\\.${instance}.+?d2$/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay3")) {
            toAdd.push({
              template: "text.accuweather.bot2values",
              dpInit: `/^accuweather\\.${instance}.+?d3$/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay4")) {
            toAdd.push({
              template: "text.accuweather.bot2values",
              dpInit: `/^accuweather\\.${instance}.+?d4$/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay5")) {
            toAdd.push({
              template: "text.accuweather.bot2values",
              dpInit: `/^accuweather\\.${instance}.+?d5$/`,
              modeScr: "bottom"
            });
          }
          if (want("windSpeed")) {
            toAdd.push({
              template: "text.accuweather.windspeed",
              dpInit: `/^accuweather\\.${instance}./`,
              modeScr: "bottom"
            });
          }
          if (want("windGust")) {
            toAdd.push({
              template: "text.accuweather.windgust",
              dpInit: `/^accuweather\\.${instance}./`,
              modeScr: "bottom"
            });
          }
          if (want("windDirection")) {
            toAdd.push({
              template: "text.accuweather.winddirection",
              dpInit: `/^accuweather\\.${instance}./`,
              modeScr: "bottom"
            });
          }
          if (want("uvIndex")) {
            toAdd.push({
              template: "text.accuweather.uvindex",
              dpInit: `/^accuweather\\.${instance}./`,
              modeScr: "bottom"
            });
          }
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
        {
          if (want("sunriseSet")) {
            toAdd.push({
              template: "text.openweathermap.sunriseset",
              dpInit: `/^openweathermap\\.${instance}\\.forecast\\.current.+/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay1")) {
            toAdd.push({
              template: "text.openweathermap.bot2values",
              dpInit: `/^openweathermap\\.${instance}.+?\\.day0/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay2")) {
            toAdd.push({
              template: "text.openweathermap.bot2values",
              dpInit: `/^openweathermap\\.${instance}.+?\\.day1/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay3")) {
            toAdd.push({
              template: "text.openweathermap.bot2values",
              dpInit: `/^openweathermap\\.${instance}.+?\\.day2/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay4")) {
            toAdd.push({
              template: "text.openweathermap.bot2values",
              dpInit: `/^openweathermap\\.${instance}.+?\\.day3/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay5")) {
            toAdd.push({
              template: "text.openweathermap.bot2values",
              dpInit: `/^openweathermap\\.${instance}.+?\\.day4/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay6")) {
            toAdd.push({
              template: "text.openweathermap.bot2values",
              dpInit: `/^openweathermap\\.${instance}.+?\\.day5/`,
              modeScr: "bottom"
            });
          }
          if (want("windSpeed")) {
            toAdd.push({
              template: "text.openweathermap.windspeed",
              dpInit: `/^openweathermap\\.${instance}./`,
              modeScr: "bottom"
            });
          }
          if (want("windGust")) {
            toAdd.push({
              template: "text.openweathermap.windgust",
              dpInit: `/^openweathermap\\.${instance}./`,
              modeScr: "bottom"
            });
          }
          if (want("windDirection")) {
            toAdd.push({
              template: "text.openweathermap.winddirection",
              dpInit: `/^openweathermap\\.${instance}./`,
              modeScr: "bottom"
            });
          }
        }
      } else if (config.weatherEntity.startsWith("pirate-weather.") && config.weatherEntity.endsWith(".")) {
        const instance = config.weatherEntity.split(".")[1];
        if (pageItems.findIndex((x) => x.modeScr === "favorit") === -1) {
          pageItems.push({
            template: "text.pirate-weather.favorit",
            dpInit: `/^pirate-weather\\.${instance}\\.weather\\.currently\\./`,
            modeScr: "favorit"
          });
        }
        {
          if (want("sunriseSet")) {
            toAdd.push({
              template: "text.pirate-weather.sunriseset",
              dpInit: `/^pirate-weather\\.${instance}\\.weather\\.daily\\.00.+/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay1")) {
            toAdd.push({
              template: "text.pirate-weather.bot2values",
              dpInit: `/^pirate-weather\\.${instance}.+?\\.daily\\.01/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay2")) {
            toAdd.push({
              template: "text.pirate-weather.bot2values",
              dpInit: `/^pirate-weather\\.${instance}.+?\\.daily\\.02/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay3")) {
            toAdd.push({
              template: "text.pirate-weather.bot2values",
              dpInit: `/^pirate-weather\\.${instance}.+?\\.daily\\.03/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay4")) {
            toAdd.push({
              template: "text.pirate-weather.bot2values",
              dpInit: `/^pirate-weather\\.${instance}.+?\\.daily\\.04/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay5")) {
            toAdd.push({
              template: "text.pirate-weather.bot2values",
              dpInit: `/^pirate-weather\\.${instance}.+?\\.daily\\.05/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay6")) {
            toAdd.push({
              template: "text.pirate-weather.bot2values",
              dpInit: `/^pirate-weather\\.${instance}.+?\\.daily\\.06/`,
              modeScr: "bottom"
            });
          }
          if (want("windSpeed")) {
            toAdd.push({
              template: "text.pirate-weather.windspeed",
              dpInit: `/^pirate-weather\\.${instance}\\.weather\\.currently./`,
              modeScr: "bottom"
            });
          }
          if (want("windGust")) {
            toAdd.push({
              template: "text.pirate-weather.windgust",
              dpInit: `/^pirate-weather\\.${instance}\\.weather\\.currently./`,
              modeScr: "bottom"
            });
          }
          if (want("windDirection")) {
            toAdd.push({
              template: "text.pirate-weather.winddirection",
              dpInit: `/^pirate-weather\\.${instance}\\.weather\\.currently./`,
              modeScr: "bottom"
            });
          }
          if (want("uvIndex")) {
            toAdd.push({
              template: "text.pirate-weather.uvindex",
              dpInit: `/^pirate-weather\\.${instance}\\.weather\\.currently./`,
              modeScr: "bottom"
            });
          }
        }
      } else if (config.weatherEntity.startsWith("brightsky.") && config.weatherEntity.endsWith(".")) {
        const instance = config.weatherEntity.split(".")[1];
        if (pageItems.findIndex((x) => x.modeScr === "favorit") === -1) {
          pageItems.push({
            template: "text.brightsky.favorit",
            dpInit: `/^brightsky\\.${instance}\\.current\\./`,
            modeScr: "favorit"
          });
        }
        {
          if (want("sunriseSet")) {
            toAdd.push({
              template: "text.brightsky.sunriseset",
              dpInit: `/^brightsky\\.${instance}\\.daily\\.00.+/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay1")) {
            toAdd.push({
              template: "text.brightsky.bot2values",
              dpInit: `/^brightsky\\.${instance}\\.daily\\.01/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay2")) {
            toAdd.push({
              template: "text.brightsky.bot2values",
              dpInit: `/^brightsky\\.${instance}\\.daily\\.02/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay3")) {
            toAdd.push({
              template: "text.brightsky.bot2values",
              dpInit: `/^brightsky\\.${instance}\\.daily\\.03/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay4")) {
            toAdd.push({
              template: "text.brightsky.bot2values",
              dpInit: `/^brightsky\\.${instance}\\.daily\\.04/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay5")) {
            toAdd.push({
              template: "text.brightsky.bot2values",
              dpInit: `/^brightsky\\.${instance}\\.daily\\.05/`,
              modeScr: "bottom"
            });
          }
          if (want("forecastDay6")) {
            toAdd.push({
              template: "text.brightsky.bot2values",
              dpInit: `/^brightsky\\.${instance}\\.daily\\.06/`,
              modeScr: "bottom"
            });
          }
          if (want("windSpeed")) {
            toAdd.push({
              template: "text.brightsky.windspeed",
              dpInit: `/^brightsky\\.${instance}\\.current./`,
              modeScr: "bottom"
            });
          }
          if (want("windGust")) {
            toAdd.push({
              template: "text.brightsky.windgust",
              dpInit: `/^brightsky\\.${instance}\\.current./`,
              modeScr: "bottom"
            });
          }
          if (want("windDirection")) {
            toAdd.push({
              template: "text.brightsky.winddirection",
              dpInit: `/^brightsky\\.${instance}\\.current./`,
              modeScr: "bottom"
            });
          }
          if (want("solar")) {
            toAdd.push({
              template: "text.brightsky.solar",
              dpInit: `/^brightsky\\.${instance}\\.current./`,
              modeScr: "bottom"
            });
          }
        }
      } else {
        const adapterPrefix = config.weatherEntity.split(".")[0];
        if (adapterPrefix !== "accuweather" && adapterPrefix !== "openweathermap" && adapterPrefix !== "pirate-weather" && adapterPrefix !== "brightsky") {
          const msg = `Weather adapter '${adapterPrefix}' is not supported. Supported adapters: accuweather, openweathermap, pirate-weather, brightsky`;
          messages.push(msg);
          this.log.warn(msg);
        }
      }
      if (toAdd.length) {
        pageItems = pageItems.concat(toAdd);
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
    const configArray = {
      dpInit: "",
      alwaysOn: "none",
      uniqueID: "scr",
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
    return { configArray, messages };
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
      result.data.icon.true.color = await this.getIconColor(entity.ScreensaverEntityOnColor || import_Color.Color.on);
    }
    if (entity.ScreensaverEntityOffColor) {
      result.data.icon.false.color = await this.getIconColor(entity.ScreensaverEntityOffColor || import_Color.Color.off);
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
    if (isScreensaverPageItemDataItemsOptions(result)) {
      return result;
    }
    throw new Error("Invalid data");
  }
  async getNotifyEntityData(entity, mode) {
    const result = {
      modeScr: mode,
      role: "",
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
    result.data.entity1.value = await this.getFieldAsDataItemConfig(entity.Headline || " ", true);
    if (entity.HeadlinePrefix) {
      result.data.entity1.prefix = await this.getFieldAsDataItemConfig(entity.HeadlinePrefix);
    }
    if (entity.HeadlineUnit) {
      result.data.entity1.unit = await this.getFieldAsDataItemConfig(entity.HeadlineUnit);
    }
    result.data.entity1.suffix = {
      type: "const",
      constVal: `<sp!it>${typeof entity.Priority === "number" ? entity.Priority : 99}<sp!it>${entity.buzzer ? entity.buzzer === true ? "1,2,3,0xF54" : entity.buzzer : ""}`
    };
    result.data.entity2 = structuredClone(result.data.entity1);
    if (entity.Text) {
      result.data.text = {
        true: {
          value: await this.getFieldAsDataItemConfig(entity.Text, true),
          prefix: entity.TextPrefix ? await this.getFieldAsDataItemConfig(entity.TextPrefix) : void 0,
          suffix: entity.TextSuffix ? await this.getFieldAsDataItemConfig(entity.TextSuffix) : void 0
        }
      };
    }
    if (entity.HeadlineIcon) {
      result.data.icon = {
        true: { value: await this.getFieldAsDataItemConfig(entity.HeadlineIcon) }
      };
    }
    if ("Enabled" in entity && entity.Enabled != null) {
      if (Array.isArray(entity.Enabled)) {
        for (const en of entity.Enabled) {
          if (typeof en === "string" && await this.existsState(en)) {
            result.data.enabled = result.data.enabled || [];
            if (Array.isArray(result.data.enabled)) {
              result.data.enabled.push({
                type: "triggered",
                dp: en,
                read: "VisibleCondition" in entity && entity.VisibleCondition ? `return ${entity.VisibleCondition};` : void 0
              });
            }
          } else {
            result.data.enabled = result.data.enabled || [];
            if (Array.isArray(result.data.enabled)) {
              result.data.enabled.push({
                type: "const",
                constVal: false
              });
            }
          }
        }
        if (!result.data.enabled || !Array.isArray(result.data.enabled) || result.data.enabled.length === 0) {
          throw new Error(
            `No valid Enabled states in Notify element with Headline ${entity.Headline} and Text ${entity.Text}`
          );
        }
      } else if (typeof entity.Enabled === "string") {
        if (await this.existsState(entity.Enabled)) {
          result.data.enabled = await this.getFieldAsDataItemConfig(entity.Enabled, true);
          if ("VisibleCondition" in entity && entity.VisibleCondition && result.data.enabled) {
            result.data.enabled = {
              ...result.data.enabled,
              read: `return ${entity.VisibleCondition};`
            };
          }
        } else {
          throw new Error(`Enabled state ${entity.Enabled} does not exist!`);
        }
      }
    } else {
      throw new Error(
        `No Enabled or VisibleCondition in Notify element with Headline ${entity.Headline} and Text ${entity.Text}`
      );
    }
    if (entity.isDismissiblePerEvent) {
      result.role = "isDismissiblePerEvent";
      if (entity.dismissibleIDGlobal) {
        result.dismissibleIDGlobal = entity.dismissibleIDGlobal;
      }
    }
    return result;
  }
  async getEntityData(entity, mode, defaultColors) {
    var _a, _b;
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
      if ("enabled" in temp) {
        if (Array.isArray(temp.enabled)) {
          for (const en of temp.enabled) {
            if (typeof en === "string" && await this.existsState(en)) {
              result.data.enabled = result.data.enabled || [];
              if (Array.isArray(result.data.enabled)) {
                result.data.enabled.push({
                  type: "triggered",
                  dp: en,
                  read: "visibleCondition" in temp && typeof temp.visibleCondition === "string" && temp.visibleCondition ? `return ${temp.visibleCondition};` : void 0
                });
              }
            }
          }
        } else if (temp.enabled !== void 0) {
          if (temp.enabled === false) {
            throw new Error(
              `Template ${entity.template} for modeScr: ${entity.modeScr} is hardcoded disabled! This makes no sense!`
            );
          }
          if (typeof temp.enabled === "string") {
            if (await this.existsState(temp.enabled)) {
              temp.data = temp.data || {};
              temp.data.enabled = await this.getFieldAsDataItemConfig(temp.enabled, true);
            } else {
              throw new Error(`Enabled state ${temp.enabled} does not exist!`);
            }
          }
          if ("visibleCondition" in temp) {
            if (typeof temp.visibleCondition === "string" && ((_a = temp.data) == null ? void 0 : _a.enabled) && temp.visibleCondition) {
              temp.data.enabled = {
                ...temp.data.enabled,
                read: `
                                    val = ${!Array.isArray(temp.data.enabled) && typeof ((_b = temp.data.enabled) == null ? void 0 : _b.read) === "string" ? `(val) => {${temp.data.enabled.read}}(val);` : null} ?? val
                                    return ${temp.visibleCondition};`
              };
            }
            delete temp.visibleCondition;
          }
        }
      }
      "visibleCondition" in temp && delete temp.visibleCondition;
      "enabled" in temp && delete temp.enabled;
      delete temp.type;
      return temp;
    }
    if (!result.data.entity1) {
      throw new Error("Invalid data");
    }
    result.data.entity2 = structuredClone(result.data.entity1);
    let obj;
    if (entity.ScreensaverEntity && !entity.ScreensaverEntity.endsWith(".")) {
      obj = await this.adapter.getForeignObjectAsync(entity.ScreensaverEntity);
      result.data.entity1.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity, true);
      result.data.entity2.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity);
    }
    if (mode === "indicator") {
      result.type = "button";
      if ("ScreensaverEntityButton" in entity && entity.ScreensaverEntityButton) {
        result.data.setValue2 = await this.existsAndWriteableState(entity.ScreensaverEntityButton) ? { type: "state", dp: entity.ScreensaverEntityButton } : void 0;
      } else if ("ScreensaverEntitySwitch" in entity && entity.ScreensaverEntitySwitch) {
        result.data.setValue1 = await this.existsAndWriteableState(entity.ScreensaverEntitySwitch) ? { type: "state", dp: entity.ScreensaverEntitySwitch } : void 0;
      } else if ("ScreensaverEntityNaviToPage" in entity && entity.ScreensaverEntityNaviToPage) {
        result.data.setNavi = {
          type: "const",
          constVal: entity.ScreensaverEntityNaviToPage
        };
      }
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
      color = await this.getIconColor(entity.ScreensaverEntityOnColor || import_Color.Color.on);
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
    if ("ScreensaverEntityEnabled" in entity && entity.ScreensaverEntityEnabled != null) {
      if (!Array.isArray(entity.ScreensaverEntityEnabled)) {
        if (await this.existsState(entity.ScreensaverEntityEnabled)) {
          result.data.enabled = await this.getFieldAsDataItemConfig(
            entity.ScreensaverEntityEnabled ? entity.ScreensaverEntityEnabled : true,
            true
          );
          if ("ScreensaverEntityVisibleCondition" in entity && entity.ScreensaverEntityVisibleCondition && typeof entity.ScreensaverEntityVisibleCondition === "string" && result.data.enabled) {
            result.data.enabled = {
              ...result.data.enabled,
              read: `
                return ${entity.ScreensaverEntityVisibleCondition};
                `
            };
          }
        } else {
          throw new Error(
            `ScreensaverEntityEnabled state ${entity.ScreensaverEntityEnabled} does not exist!`
          );
        }
      } else {
        throw new Error("ScreensaverEntityEnabled must be a string!");
      }
    } else if ("ScreensaverEntityVisibleCondition" in entity && entity.ScreensaverEntityVisibleCondition && result.data.entity1.value) {
      result.data.enabled = {
        ...result.data.entity1.value,
        read: `
                return ${entity.ScreensaverEntityVisibleCondition};
                `
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
    if (isScreensaverPageItemDataItemsOptions(result)) {
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
    } else if (typeof item === "string" && (item == null ? void 0 : item.startsWith("default.color.from.start."))) {
      return { type: "const", constVal: item };
    } else if (typeof def === "string" && (def == null ? void 0 : def.startsWith("default.color.from.start."))) {
      return { type: "const", constVal: def };
    }
    return void 0;
  }
  validStateId(id) {
    return !!id && !id.endsWith(".");
  }
  async existsState(id) {
    var _a;
    if (this.validStateId(id) === false) {
      return false;
    }
    const o = await ((_a = this.statesController) == null ? void 0 : _a.getObjectAsync(id));
    if (!o || o.type !== "state") {
      return false;
    }
    return true;
  }
  async existsAndWriteableState(id) {
    var _a, _b;
    if (this.validStateId(id) === false) {
      return false;
    }
    const o = await ((_a = this.statesController) == null ? void 0 : _a.getObjectAsync(id));
    if (!o || o.type !== "state") {
      return false;
    }
    return ((_b = o.common) == null ? void 0 : _b.write) === true;
  }
  async delete() {
    var _a;
    await ((_a = this.statesController) == null ? void 0 : _a.delete());
    this.statesController = void 0;
  }
  static async getConfig(adapter, scriptConfig) {
    const result = [];
    if (scriptConfig.length === 0) {
      const topics = (adapter.config.panels || []).map((p) => p == null ? void 0 : p.topic).filter(Boolean).join(", ");
      if (!adapter.config.testCase) {
        adapter.log.error(`No compatible config found for topics: ${topics}. Adapter paused!`);
        throw new Error(`No compatible config found for topics: ${topics}. Adapter paused!`);
      }
      adapter.log.warn(`No compatible config found for topics: ${topics}. Continuing due to testCase=true.`);
    }
    if (scriptConfig) {
      for (let b = 0; b < scriptConfig.length; b++) {
        for (let c = b <= 0 ? 1 : b - 1; c < scriptConfig.length; c++) {
          if (c === b || !scriptConfig[c] || !scriptConfig[b].pages || !scriptConfig[c].pages) {
            continue;
          }
          let pages = structuredClone(scriptConfig[c].pages);
          if (pages) {
            pages = pages.filter((a) => {
              var _a, _b, _c;
              if (((_a = a.config) == null ? void 0 : _a.card) === "screensaver" || ((_b = a.config) == null ? void 0 : _b.card) === "screensaver2" || ((_c = a.config) == null ? void 0 : _c.card) === "screensaver3") {
                return false;
              }
              if (scriptConfig[b].pages.find((b2) => b2.uniqueID === a.uniqueID)) {
                return false;
              }
              return true;
            });
            scriptConfig[b].pages = scriptConfig[b].pages.concat(pages);
          }
        }
      }
      for (let b = 0; b < scriptConfig.length; b++) {
        const s = scriptConfig[b];
        if (!s || !s.pages) {
          continue;
        }
        const panel = {};
        if (!panel.pages) {
          panel.pages = [];
        }
        if (!panel.navigation) {
          panel.navigation = [];
        }
        panel.pages = panel.pages.filter((a) => {
          if (s.pages.find((b2) => b2.uniqueID === a.uniqueID)) {
            return false;
          }
          return true;
        });
        panel.navigation = panel.navigation.filter((a) => {
          if (s.navigation && s.navigation.find((b2) => a == null || b2 == null || b2.name === a.name)) {
            return false;
          }
          return true;
        });
        s.navigation = (panel.navigation || []).concat(s.navigation || []);
        s.pages = (panel.pages || []).concat(s.pages || []);
        result[b] = {
          ...{},
          ...result[b],
          ...panel,
          ...s
        };
      }
    }
    return result;
  }
}
function isIconScaleElement(obj) {
  return obj && obj.val_min !== void 0 && obj.val_max !== void 0;
}
function isScreensaverPageItemDataItemsOptions(obj) {
  return obj && obj.modeScr && obj.data;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConfigManager
});
//# sourceMappingURL=config-manager.js.map
