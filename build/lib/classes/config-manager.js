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
var import_library = require("./library");
var import_Color = require("../const/Color");
var import_config_manager_const = require("../const/config-manager-const");
var import_pages = require("../types/pages");
var import_navigation = require("./navigation");
var import_readme = require("../tools/readme");
class ConfigManager extends import_library.BaseClass {
  //private test: ConfigManager.DeviceState;
  colorOn = import_Color.Color.On;
  colorOff = import_Color.Color.Off;
  colorDefault = import_Color.Color.Off;
  scriptVersion = "0.2.2";
  constructor(adapter) {
    super(adapter, "config-manager");
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
   * If any errors occur during the process, they are logged and included in the returned messages.
   */
  async setScriptConfig(configuration) {
    const config = Object.assign(import_config_manager_const.defaultConfig, configuration);
    if (!config || !(0, import_config_manager_const.isConfig)(config)) {
      this.log.error(`Invalid configuration from Script: ${config ? JSON.stringify(config) : "undefined"}`);
      return ["Invalid configuration"];
    }
    let messages = [`version: ${config.version}`];
    const version = config.version.split(".").map((item, i) => parseInt(item) * Math.pow(100, 2 - i)).reduce((a, b) => a + b);
    const requiredVersion = this.scriptVersion.split(".").map((item, i) => parseInt(item) * Math.pow(100, 2 - i)).reduce((a, b) => a + b);
    if (version < requiredVersion) {
      messages.push(`Script version ${config.version} is lower than the required version ${this.scriptVersion}!`);
      this.log.warn(messages[messages.length - 1]);
    }
    let panelConfig = { pages: [], navigation: [] };
    if (!config.panelTopic) {
      this.log.error(`Required field panelTopic is missing in ${config.panelName || "unknown"}!`);
      messages.push("Required field panelTopic is missing");
      return messages;
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
    if (config.defaultColor) {
      this.colorDefault = import_Color.Color.convertScriptRGBtoRGB(config.defaultColor);
    }
    if (config.defaultOnColor) {
      this.colorOn = import_Color.Color.convertScriptRGBtoRGB(config.defaultOnColor);
    }
    if (config.defaultOffColor) {
      this.colorOff = import_Color.Color.convertScriptRGBtoRGB(config.defaultOffColor);
    }
    try {
      panelConfig.pages.push(await this.getScreensaverConfig(config));
    } catch (error) {
      messages.push(`Screensaver configuration error - ${error}`);
      this.log.error(messages[messages.length - 1]);
    }
    if (config.pages.length > 1) {
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
      if (panelConfig.navigation.length > 1) {
        panelConfig.navigation = panelConfig.navigation.map((item, index, array) => {
          if (index === 0) {
            return {
              ...item,
              left: { single: array[array.length - 1].name },
              right: { single: array[index + 1].name }
            };
          } else if (index === array.length - 1) {
            return { ...item, left: { single: array[index - 1].name }, right: { single: array[0].name } };
          }
          return {
            ...item,
            left: { single: array[index - 1].name },
            right: { single: array[index + 1].name }
          };
        });
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
      return messages;
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
    const obj = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
    if (obj) {
      obj.native.scriptConfig = obj.native.scriptConfig || [];
      obj.native.scriptConfig = obj.native.scriptConfig.filter(
        (item, i) => obj.native.scriptConfig.findIndex((item2) => item2.topic === item.topic) === i
      );
      obj.native.scriptConfig = obj.native.scriptConfig.filter((item) => item.topic !== panelConfig.topic);
      obj.native.scriptConfig = obj.native.scriptConfig.filter(
        (item) => this.adapter.config.panels.findIndex((a) => a.topic === item.topic) !== -1
      );
      obj.native.scriptConfig.push(panelConfig);
      await this.adapter.setForeignObjectAsync(this.adapter.namespace, obj);
    }
    messages.push(`done`);
    return messages.map((a) => a.replaceAll("Error: ", ""));
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
          if (page.heading) {
            page.native.config = page.native.config || {};
            page.native.config.data = page.native.config.data || {};
            page.native.config.data.headline = await this.getFieldAsDataItemConfig(page.heading);
          }
          panelConfig.pages.push(page.native);
          continue;
        }
        if (page.type !== "cardGrid" && page.type !== "cardGrid2" && page.type !== "cardGrid3" && page.type !== "cardEntities" && page.type !== "cardThermo") {
          const msg = `${page.heading || "unknown"} with card type ${page.type} not implemented yet!`;
          messages.push(msg);
          this.log.warn(msg);
          continue;
        }
        if (!page.uniqueName) {
          messages.push(`Page ${page.heading || "unknown"} has no uniqueName!`);
          this.log.error(messages[messages.length - 1]);
          continue;
        }
        if ((config.subPages || []).includes(page)) {
          const left = page.prev || page.parent || void 0;
          const right = page.next || page.home || void 0;
          const navItem = {
            name: page.uniqueName,
            left: left ? { single: left } : void 0,
            right: right ? page.home ? { single: right } : { double: right } : void 0,
            page: page.uniqueName
          };
          panelConfig.navigation.push(navItem);
        }
        let gridItem = {
          dpInit: "",
          alwaysOn: "none",
          uniqueID: page.uniqueName || "",
          useColor: false,
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
        if (page.type === "cardThermo") {
          ({ gridItem, messages } = await this.getPageThermo(page, gridItem, messages));
        }
        if (page.items) {
          for (const item of page.items) {
            if (!item) {
              continue;
            }
            try {
              const itemConfig = await this.getPageItemConfig(item, page);
              if (itemConfig && gridItem.pageItems) {
                gridItem.pageItems.push(itemConfig);
              }
            } catch (error) {
              messages.push(
                `Configuration error in page ${page.heading || "unknown"} with uniqueName ${page.uniqueName} - ${error}`
              );
              this.log.error(messages[messages.length - 1]);
            }
          }
          panelConfig.pages.push(gridItem);
        }
      }
    }
    return { panelConfig, messages };
  }
  async getPageThermo(page, gridItem, messages) {
    if (page.type !== "cardThermo" || !gridItem.config || gridItem.config.card !== "cardThermo") {
      return { gridItem, messages };
    }
    if (!page.items || !page.items[0] || page.items[0].id == null) {
      const msg = "Thermo page has no items or item 0 has no id!";
      messages.push(msg);
      this.log.error(msg);
      return { gridItem, messages };
    }
    gridItem.template = "thermo.script";
    gridItem.dpInit = page.items[0].id;
    return { gridItem, messages };
  }
  async getPageNaviItemConfig(item, page) {
    if (!(page.type === "cardGrid" || page.type === "cardGrid2" || page.type === "cardGrid3" || page.type === "cardEntities") || !item.targetPage || !item.navigate) {
      this.log.warn(`Page type ${page.type} not supported for navigation item!`);
      return void 0;
    }
    let itemConfig = void 0;
    const specialRole = page.type === "cardGrid" || page.type === "cardGrid2" || page.type === "cardGrid3" ? "textNotIcon" : "iconNotText";
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
            false: {
              value: {
                type: "const",
                constVal: item.icon2 || item.icon || "gesture-tap-button"
              },
              color: await this.getIconColor(item.offColor, this.colorOff)
            },
            scale: item.colorScale ? { type: "const", constVal: item.colorScale } : void 0,
            maxBri: void 0,
            minBri: void 0
          },
          text1: {
            true: item.name ? await this.getFieldAsDataItemConfig(item.name) : void 0
          },
          text: {
            true: item.buttonText ? await this.getFieldAsDataItemConfig(item.buttonText) : void 0,
            false: item.buttonTextOff ? await this.getFieldAsDataItemConfig(item.buttonTextOff) : item.buttonText ? await this.getFieldAsDataItemConfig(item.buttonText) : void 0
          }
        }
      };
    }
    const obj = item.id && !item.id.endsWith(".") ? await this.adapter.getForeignObjectAsync(item.id) : void 0;
    const role = obj && obj.common.role ? obj.common.role : void 0;
    const commonName = obj && obj.common ? typeof obj.common.name === "string" ? obj.common.name : obj.common.name[this.library.getLocalLanguage()] : void 0;
    if (obj && (!obj.common || !obj.common.role)) {
      throw new Error(`Role missing in ${item.id}!`);
    }
    if (role) {
      if (!await this.checkRequiredDatapoints(role, item)) {
        return;
      }
    }
    const getButtonsTextTrue = async (item2, on) => {
      return item2.buttonText ? await this.getFieldAsDataItemConfig(item2.buttonText) : await this.existsState(`${item2.id}.BUTTONTEXT`) ? { type: "triggered", dp: `${item2.id}.BUTTONTEXT` } : { type: "const", constVal: `${on}` };
    };
    const getButtonsTextFalse = async (item2, on, off) => {
      return item2.buttonTextOff ? await this.getFieldAsDataItemConfig(item2.buttonTextOff) : await this.existsState(`${item2.id}.BUTTONTEXTOFF`) ? { type: "triggered", dp: `${item2.id}.BUTTONTEXTOFF` } : item2.buttonText ? await this.getFieldAsDataItemConfig(item2.buttonText) : await this.existsState(`${item2.id}.BUTTONTEXT`) ? { type: "triggered", dp: `${item2.id}.BUTTONTEXT` } : { type: "const", constVal: `${off || on}` };
    };
    switch (role) {
      case "socket":
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
                  constVal: item.icon || (role === "socket" ? "power-socket-de" : "lightbulb")
                },
                color: await this.getIconColor(item.onColor, this.colorOn)
              },
              false: {
                value: {
                  type: "const",
                  constVal: item.icon2 || item.icon || (role === "socket" ? "power-socket-de" : "lightbulb-outline")
                },
                color: await this.getIconColor(item.offColor, this.colorOff)
              },
              scale: item.colorScale ? { type: "const", constVal: item.colorScale } : void 0,
              maxBri: void 0,
              minBri: void 0
            },
            text1: {
              true: await getButtonsTextTrue(item, "on"),
              false: await getButtonsTextFalse(item, "on", "off")
            },
            text: {
              true: await this.getFieldAsDataItemConfig(item.name || commonName || "Light")
            },
            entity1: {
              value: {
                type: "triggered",
                dp: `${item.id}.${role === "dimmer" || role == "hue" ? "ON_ACTUAL" : "ACTUAL"}`
              }
            },
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
                  constVal: item.icon2 || item.icon || "gesture-tap-button"
                },
                color: await this.getIconColor(item.offColor, this.colorOff)
              },
              scale: item.colorScale ? { type: "const", constVal: item.colorScale } : void 0,
              maxBri: void 0,
              minBri: void 0
            },
            text1: {
              true: await getButtonsTextTrue(item, "on"),
              false: await getButtonsTextFalse(item, "on", "off")
            },
            text: {
              true: await this.getFieldAsDataItemConfig(item.name || commonName || "Button")
            },
            entity1: role === void 0 ? void 0 : {
              value: { type: "triggered", dp: `${item.id}.ACTUAL` }
            },
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        itemConfig = tempItem;
        break;
      }
      case "humidity":
      case "value.humidity": {
        {
          itemConfig = {
            type: "button",
            dpInit: item.id,
            role: specialRole,
            color: {
              true: await this.getIconColor(item.onColor, this.colorOn),
              false: await this.getIconColor(item.offColor, this.colorOff),
              scale: item.colorScale ? item.colorScale : void 0
            },
            template: "button.humidity",
            data: {
              text: {
                true: await getButtonsTextTrue(item, "on"),
                false: await getButtonsTextFalse(item, "on", "off")
              },
              text1: {
                true: await this.getFieldAsDataItemConfig(item.name || commonName || "Humidity")
              },
              setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
            }
          };
          break;
        }
        break;
      }
      case "temperature":
      case "thermostat":
      case "value.temperature": {
        itemConfig = {
          type: "button",
          dpInit: item.id,
          role: specialRole,
          template: "button.temperature",
          color: {
            true: await this.getIconColor(item.onColor, this.colorOn),
            false: await this.getIconColor(item.offColor, this.colorOff),
            scale: item.colorScale ? item.colorScale : void 0
          },
          data: {
            text1: {
              true: await getButtonsTextTrue(item, "on"),
              false: await getButtonsTextFalse(item, "on", "off")
            },
            text: {
              true: await this.getFieldAsDataItemConfig(item.name || commonName || "Temperature")
            },
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "gate": {
        if (await this.checkRequiredDatapoints("gate", item, "feature")) {
          itemConfig = {
            template: "text.gate.isOpen",
            dpInit: item.id,
            type: "button",
            color: {
              true: await this.getIconColor(item.onColor, this.colorOn),
              false: await this.getIconColor(item.offColor, this.colorOff),
              scale: item.colorScale ? item.colorScale : void 0
            },
            data: {
              text: {
                true: await getButtonsTextTrue(item, "on"),
                false: await getButtonsTextFalse(item, "on", "off")
              },
              text1: {
                true: await this.getFieldAsDataItemConfig(item.name || commonName || "Gate")
              },
              entity1: {
                value: {
                  type: "triggered",
                  mode: "auto",
                  role: "value.blind",
                  read: "return val >= 1",
                  forceType: "boolean",
                  dp: ""
                }
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
              scale: item.colorScale ? item.colorScale : void 0
            },
            data: {
              text: {
                true: await getButtonsTextTrue(item, "on"),
                false: await getButtonsTextFalse(item, "on", "off")
              },
              text1: {
                true: await this.getFieldAsDataItemConfig(item.name || commonName || "Gate")
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
            scale: item.colorScale ? item.colorScale : void 0
          },
          data: {
            text1: {
              true: await getButtonsTextTrue(item, "on"),
              false: await getButtonsTextFalse(item, "on", "off")
            },
            text: {
              true: await this.getFieldAsDataItemConfig(item.name || commonName || "Door")
            },
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
            scale: item.colorScale ? item.colorScale : void 0
          },
          data: {
            text1: {
              true: await getButtonsTextTrue(item, "on"),
              false: await getButtonsTextFalse(item, "on", "off")
            },
            text: {
              true: await this.getFieldAsDataItemConfig(item.name || commonName || "Window")
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
            true: await this.getIconColor(item.onColor, this.colorOn),
            false: await this.getIconColor(item.offColor, this.colorOff),
            scale: item.colorScale ? item.colorScale : void 0
          },
          data: {
            text1: {
              true: await getButtonsTextTrue(item, "yes"),
              false: await getButtonsTextFalse(item, "yes", "no")
            },
            text: {
              true: await this.getFieldAsDataItemConfig(item.name || commonName || "Motion")
            },
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "volumeGroup":
      case "volume": {
        itemConfig = {
          template: "button.volume",
          dpInit: item.id,
          type: "button",
          color: {
            true: await this.getIconColor(item.onColor, this.colorOn),
            false: await this.getIconColor(item.offColor, this.colorOff),
            scale: item.colorScale ? item.colorScale : void 0
          },
          data: {
            text1: {
              true: await getButtonsTextTrue(item, "on"),
              false: await getButtonsTextFalse(item, "on", "off")
            },
            text: {
              true: await this.getFieldAsDataItemConfig(item.name || commonName || "Volume")
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
            true: await this.getIconColor(item.onColor || `${item.id}.COLORDEC`, this.colorOn),
            false: await this.getIconColor(item.offColor || `${item.id}.COLORDEC`, this.colorOff),
            scale: item.colorScale ? item.colorScale : void 0
          },
          data: {
            text1: {
              true: await getButtonsTextTrue(item, "on"),
              false: await getButtonsTextFalse(item, "on", "off")
            },
            text: {
              true: await this.getFieldAsDataItemConfig(item.name || commonName || "Warning")
            },
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
          color: {
            true: await this.getIconColor(item.onColor || `${item.id}.COLORDEC`, this.colorOn),
            false: await this.getIconColor(item.offColor || `${item.id}.COLORDEC`, this.colorOff),
            scale: item.colorScale
          },
          data: {
            text1: {
              true: await getButtonsTextTrue(item, "on"),
              false: await getButtonsTextFalse(item, "on", "off")
            },
            text: {
              true: await this.getFieldAsDataItemConfig(item.name || commonName || "Light")
            },
            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : void 0
          }
        };
        break;
      }
      case "cie":
      case "blind":
      case "buttonSensor":
      case "value.time":
      case "level.timer":
      case "value.alarmtime":
      case "level.mode.fan":
      case "lock":
      case "slider":
      case "switch.mode.wlan":
      case "media":
      case "timeTable":
      case "airCondition": {
        throw new Error(`DP: ${item.id} - Navigation for channel: ${role} not implemented yet!!`);
      }
      default:
        (0, import_pages.exhaustiveCheck)(role);
        throw new Error(`DP: ${item.id} - Channel role ${role} is not supported!!!`);
    }
    return itemConfig;
  }
  async getPageItemConfig(item, page) {
    let itemConfig = void 0;
    if (item.navigate) {
      if (!item.targetPage || typeof item.targetPage !== "string") {
        throw new Error(`TargetPage missing in ${item && item.id || "no id"}!`);
      }
      return await this.getPageNaviItemConfig(item, page);
    }
    if (item.id && !item.id.endsWith(".")) {
      const obj = await this.adapter.getForeignObjectAsync(item.id);
      if (obj) {
        if (!(obj.common && obj.common.role)) {
          throw new Error(`Role missing in ${item.id}!`);
        }
        const role = obj.common.role;
        if (!import_config_manager_const.requiredFeatureDatapoints[role] && !import_config_manager_const.requiredScriptDataPoints[role]) {
          throw new Error(`Channel role ${role} not supported!`);
        }
        if (!await this.checkRequiredDatapoints(role, item)) {
          return;
        }
        const specialRole = page.type === "cardGrid" || page.type === "cardGrid2" || page.type === "cardGrid3" ? "textNotIcon" : "iconNotText";
        const commonName = typeof obj.common.name === "string" ? obj.common.name : obj.common.name[this.library.getLocalLanguage()];
        switch (role) {
          case "timeTable": {
            itemConfig = {
              template: "text.alias.fahrplan.departure",
              dpInit: item.id
            };
            break;
          }
          case "socket":
          case "light": {
            const tempItem = {
              type: "light",
              data: {
                icon: {
                  true: {
                    value: {
                      type: "const",
                      constVal: item.icon || role === "socket" ? "power-socket-de" : "lightbulb"
                    },
                    color: await this.getIconColor(item.onColor, this.colorOn)
                  },
                  false: {
                    value: {
                      type: "const",
                      constVal: item.icon2 || role === "socket" ? "power-socket-de" : "lightbulb-outline"
                    },
                    color: await this.getIconColor(item.offColor, this.colorOff)
                  },
                  scale: item.colorScale ? { type: "const", constVal: item.colorScale } : void 0,
                  maxBri: void 0,
                  minBri: void 0
                },
                colorMode: { type: "const", constVal: false },
                headline: await this.getFieldAsDataItemConfig(item.name || commonName || "Light"),
                entity1: {
                  value: { type: "triggered", dp: `${item.id}.ACTUAL` },
                  set: { type: "state", dp: `${item.id}.SET` }
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
                  scale: item.colorScale ? { type: "const", constVal: item.colorScale } : void 0,
                  maxBri: item.maxValueBrightness ? { type: "const", constVal: item.maxValueBrightness } : void 0,
                  minBri: item.minValueBrightness ? { type: "const", constVal: item.minValueBrightness } : void 0
                },
                colorMode: item.colormode ? { type: "const", constVal: !!item.colormode } : void 0,
                dimmer: {
                  value: { type: "triggered", dp: `${item.id}.ACTUAL` },
                  set: { type: "state", dp: `${item.id}.SET` },
                  maxScale: item.maxValueBrightness ? { type: "const", constVal: item.maxValueBrightness } : void 0,
                  minScale: item.minValueBrightness ? { type: "const", constVal: item.minValueBrightness } : void 0
                },
                headline: await this.getFieldAsDataItemConfig(item.name || commonName || "Dimmer"),
                text1: {
                  true: {
                    type: "const",
                    constVal: `Brightness`
                  }
                },
                entity1: {
                  value: { type: "triggered", dp: `${item.id}.ON_ACTUAL` },
                  set: { type: "state", dp: `${item.id}.ON_SET` }
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
                  scale: item.colorScale ? { type: "const", constVal: item.colorScale } : void 0,
                  maxBri: item.maxValueBrightness ? { type: "const", constVal: item.maxValueBrightness } : void 0,
                  minBri: item.minValueBrightness ? { type: "const", constVal: item.minValueBrightness } : void 0
                },
                colorMode: item.colormode ? { type: "const", constVal: !!item.colormode } : void 0,
                dimmer: {
                  value: { type: "triggered", dp: `${item.id}.DIMMER` },
                  maxScale: item.maxValueBrightness ? { type: "const", constVal: item.maxValueBrightness } : void 0,
                  minScale: item.minValueBrightness ? { type: "const", constVal: item.minValueBrightness } : void 0
                },
                headline: await this.getFieldAsDataItemConfig(item.name || commonName || role),
                hue: role !== "hue" ? void 0 : {
                  type: "triggered",
                  dp: `${item.id}.HUE`
                },
                Red: role !== "rgb" ? void 0 : {
                  type: "triggered",
                  dp: `${item.id}.RED`
                },
                Green: role !== "rgb" ? void 0 : {
                  type: "triggered",
                  dp: `${item.id}.GREEN`
                },
                Blue: role !== "rgb" ? void 0 : {
                  type: "triggered",
                  dp: `${item.id}.BLUE`
                },
                White: role !== "rgb" ? void 0 : await this.existsState(`${item.id}.WHITE`) ? {
                  value: {
                    type: "triggered",
                    dp: `${item.id}.WHITE`
                  }
                } : void 0,
                color: role !== "rgbSingle" ? void 0 : {
                  true: {
                    type: "triggered",
                    dp: `${item.id}.RGB`
                  }
                },
                ct: {
                  value: { type: "triggered", dp: `${item.id}.TEMPERATURE` },
                  maxScale: item.maxValueColorTemp ? { type: "const", constVal: item.maxValueColorTemp } : void 0,
                  minScale: item.minValueColorTemp ? { type: "const", constVal: item.minValueColorTemp } : void 0
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
                  value: { type: "triggered", dp: `${item.id}.ON_ACTUAL` },
                  set: { type: "state", dp: `${item.id}.ON` }
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
                  scale: item.colorScale ? { type: "const", constVal: item.colorScale } : void 0,
                  maxBri: void 0,
                  minBri: void 0
                },
                text: {
                  true: item.buttonText ? await this.getFieldAsDataItemConfig(item.buttonText) : await this.existsState(`${item.id}.BUTTONTEXT`) ? { type: "state", dp: `${item.id}.BUTTONTEXT` } : { type: "state", dp: `${item.id}.ACTUAL` },
                  false: item.buttonTextOff ? await this.getFieldAsDataItemConfig(item.buttonTextOff) : await this.existsState(`${item.id}.BUTTONTEXTOFF`) ? { type: "state", dp: `${item.id}.BUTTONTEXTOFF` } : item.buttonText ? await this.getFieldAsDataItemConfig(item.buttonText) : await this.existsState(`${item.id}.BUTTONTEXT`) ? { type: "state", dp: `${item.id}.BUTTONTEXT` } : { type: "state", dp: `${item.id}.ACTUAL` }
                },
                text1: {
                  true: item.name ? await this.getFieldAsDataItemConfig(item.name) : void 0
                },
                entity1: {
                  value: { type: "triggered", dp: `${item.id}.SET` }
                }
              }
            };
            itemConfig = tempItem;
            break;
          }
          case "blind": {
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
                  scale: item.colorScale ? { type: "const", constVal: item.colorScale } : void 0,
                  maxBri: void 0,
                  minBri: void 0
                },
                text: {
                  true: { type: "const", constVal: "Position" }
                },
                headline: item.name ? await this.getFieldAsDataItemConfig(item.name) : { type: "const", constVal: commonName != null ? commonName : "Blind" },
                entity1: {
                  value: { type: "triggered", dp: `${item.id}.ACTUAL` },
                  minScale: item.minValueLevel ? { type: "const", constVal: item.minValueLevel } : void 0,
                  maxScale: item.maxValueLevel ? { type: "const", constVal: item.maxValueLevel } : void 0,
                  set: { type: "state", dp: `${item.id}.SET` }
                },
                entity2: {
                  value: { type: "triggered", dp: `${item.id}.TILT_ACTUAL` },
                  minScale: item.minValueTilt ? { type: "const", constVal: item.minValueTilt } : void 0,
                  maxScale: item.maxValueTilt ? { type: "const", constVal: item.maxValueTilt } : void 0,
                  set: { type: "state", dp: `${item.id}.TILT_SET` }
                },
                up: { type: "state", dp: `${item.id}.OPEN` },
                down: { type: "state", dp: `${item.id}.CLOSE` },
                stop: { type: "state", dp: `${item.id}.STOP` },
                up2: { type: "state", dp: `${item.id}.TILT_OPEN` },
                down2: { type: "state", dp: `${item.id}.TILT_CLOSE` },
                stop2: { type: "state", dp: `${item.id}.TILT_STOP` }
              }
            };
            itemConfig = tempItem;
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
                  text: {
                    true: { type: "const", constVal: "Position" }
                  },
                  headline: item.name ? await this.getFieldAsDataItemConfig(item.name) : { type: "const", constVal: commonName != null ? commonName : "Garage" },
                  entity1: {
                    value: { type: "triggered", dp: `${item.id}.ACTUAL` }
                  },
                  entity2: void 0,
                  up: { type: "state", dp: `${item.id}.SET`, write: "return true;" },
                  down: { type: "state", dp: `${item.id}.SET`, write: "return false;" },
                  stop: { type: "state", dp: `${item.id}.STOP` }
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
                  scale: item.colorScale
                }
              };
            }
            break;
          }
          case "motion":
          case "info":
          case "humidity":
          case "temperature":
          case "value.temperature":
          case "value.humidity":
          case "door":
          case "window": {
            let iconOn = "door-open";
            let iconOff = "door-closed";
            let iconUnstable = "";
            let textOn = void 0;
            let textOff = void 0;
            let adapterRole = "";
            let commonUnit = void 0;
            switch (role) {
              case "motion": {
                iconOn = "motion-sensor";
                iconOff = "motion-sensor";
                iconUnstable = "";
                adapterRole = "iconNotText";
                textOn = "On";
                textOff = "Off";
                break;
              }
              case "door": {
                adapterRole = "iconNotText";
                iconOn = "door-open";
                iconOff = "door-closed";
                iconUnstable = "door-closed";
                textOn = "Opened";
                textOff = "Closed";
                break;
              }
              case "window": {
                iconOn = "window-open-variant";
                iconOff = "window-closed-variant";
                iconUnstable = "window-closed-variant";
                adapterRole = "iconNotText";
                textOn = "Opened";
                textOff = "Closed";
                break;
              }
              case "info": {
                iconOn = "information-outline";
                iconOff = "information-outline";
                adapterRole = specialRole;
                break;
              }
              case "temperature":
              case "value.temperature": {
                iconOn = "thermometer";
                iconOff = "snowflake-thermometer";
                iconUnstable = "sun-thermometer";
                adapterRole = specialRole;
                const obj2 = await this.existsState(`${item.id}.ACTUAL`) ? await this.adapter.getForeignObjectAsync(`${item.id}.ACTUAL`) : void 0;
                commonUnit = obj2 && obj2.common && obj2.common.unit ? obj2.common.unit : void 0;
                break;
              }
              case "humidity":
              case "value.humidity": {
                iconOn = "water-percent";
                iconOff = "water-off";
                iconUnstable = "water-percent-alert";
                adapterRole = specialRole;
                const o = await this.existsState(`${item.id}.ACTUAL`) ? await this.adapter.getForeignObjectAsync(`${item.id}.ACTUAL`) : void 0;
                commonUnit = o && o.common && o.common.unit ? o.common.unit : void 0;
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
                    color: await this.getIconColor(item.onColor, this.colorOn),
                    text: {
                      value: { type: "state", dp: `${item.id}.ACTUAL` },
                      unit: commonUnit ? { type: "const", constVal: commonUnit } : void 0
                    }
                  },
                  false: {
                    value: await this.getFieldAsDataItemConfig(item.icon2 || iconOff),
                    color: await this.getIconColor(item.offColor, this.colorOff),
                    text: {
                      value: { type: "state", dp: `${item.id}.ACTUAL` },
                      unit: commonUnit ? { type: "const", constVal: commonUnit } : void 0
                    }
                  },
                  unstable: {
                    value: await this.getFieldAsDataItemConfig(item.icon3 || iconUnstable)
                  },
                  scale: item.colorScale ? { type: "const", constVal: item.colorScale } : void 0,
                  maxBri: void 0,
                  minBri: void 0
                },
                text1: {
                  true: item.buttonText ? await this.getFieldAsDataItemConfig(item.buttonText) : await this.existsState(`${item.id}.BUTTONTEXT`) ? { type: "state", dp: `${item.id}.BUTTONTEXT` } : textOn ? { type: "const", constVal: textOn } : { type: "state", dp: `${item.id}.ACTUAL` },
                  false: item.buttonTextOff ? await this.getFieldAsDataItemConfig(item.buttonTextOff) : await this.existsState(`${item.id}.BUTTONTEXTOFF`) ? { type: "state", dp: `${item.id}.BUTTONTEXTOFF` } : textOff ? { type: "const", constVal: textOff } : item.buttonText ? await this.getFieldAsDataItemConfig(item.buttonText) : await this.existsState(`${item.id}.BUTTONTEXT`) ? { type: "state", dp: `${item.id}.BUTTONTEXT` } : { type: "state", dp: `${item.id}.ACTUAL` }
                },
                text: {
                  true: item.name ? await this.getFieldAsDataItemConfig(item.name) : commonName ? { type: "const", constVal: commonName } : void 0
                },
                entity1: {
                  value: { type: "triggered", dp: `${item.id}.ACTUAL` }
                },
                entity2: role === "temperature" || role === "value.temperature" || role === "humidity" || role === "value.humidity" ? {
                  value: { type: "state", dp: `${item.id}.ACTUAL` },
                  unit: commonUnit ? { type: "const", constVal: commonUnit } : void 0
                } : {
                  value: { type: "state", dp: `${item.id}.ACTUAL` }
                }
              }
            };
            itemConfig = tempItem;
            break;
          }
          case "thermostat":
            break;
          case "volumeGroup":
          case "volume": {
            itemConfig = {
              template: "number.volume",
              dpInit: item.id,
              type: "number",
              role: specialRole,
              color: {
                true: await this.getIconColor(item.onColor, this.colorOn),
                false: await this.getIconColor(item.offColor, this.colorOff),
                scale: item.colorScale
              },
              data: {
                text: {
                  true: item.name ? await this.getFieldAsDataItemConfig(item.name) : void 0
                }
              }
            };
            break;
          }
          case "warning":
          case "cie":
          case "buttonSensor":
          case "value.time":
          case "level.timer":
          case "value.alarmtime":
          case "level.mode.fan":
          case "lock":
          case "slider":
          case "switch.mode.wlan":
          case "media":
          case "airCondition": {
            throw new Error(`DP: ${item.id} - Channel role ${role} not implemented yet!!`);
            break;
          }
          default:
            (0, import_pages.exhaustiveCheck)(role);
            throw new Error(`DP: ${item.id} - Channel role ${role} is not supported!!!`);
        }
        return itemConfig;
      }
      throw new Error(`Object ${item.id} not found!`);
    }
    return void 0;
  }
  async getScreensaverConfig(config) {
    let pageItems = [];
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
        pageItems.push({
          template: "text.accuweather.favorit",
          dpInit: `/^accuweather\\.${instance}.+/`,
          modeScr: "favorit"
        });
        pageItems = pageItems.concat([
          // Bottom 1 - accuWeather.0. Forecast Day 1
          {
            template: "text.accuweather.sunriseset",
            dpInit: `/^accuweather\\.${instance}.Daily.+/`,
            modeScr: "bottom"
          },
          // Bottom 1 - accuWeather.0. Forecast Day 1
          {
            template: "text.accuweather.bot2values",
            dpInit: `/^accuweather\\.${instance}.+?d1$/g`,
            modeScr: "bottom"
          },
          // Bottom 2 - accuWeather.0. Forecast Day 2
          {
            template: "text.accuweather.bot2values",
            dpInit: `/^accuweather\\.${instance}.+?d2$/`,
            modeScr: "bottom"
          },
          // Bottom 3 - accuWeather.0. Forecast Day 3
          {
            template: "text.accuweather.bot2values",
            dpInit: `/^accuweather\\.${instance}.+?d3$/`,
            modeScr: "bottom"
          },
          // Bottom 4 - accuWeather.0. Forecast Day 4
          {
            template: "text.accuweather.bot2values",
            dpInit: `/^accuweather\\.${instance}.+?d4$/`,
            modeScr: "bottom"
          },
          // Bottom 5 - accuWeather.0. Forecast Day 5
          {
            template: "text.accuweather.bot2values",
            dpInit: `/^accuweather\\.${instance}.+?d5$/`,
            modeScr: "bottom"
          },
          // Bottom 7 - Sonnenaufgang - Sonnenuntergang im Wechsel
          // Bottom 8 - Windgeschwindigkeit
          {
            role: "text",
            dpInit: "",
            type: "text",
            modeScr: "bottom",
            data: {
              entity1: {
                value: {
                  type: "triggered",
                  dp: `accuweather.${instance}.Current.WindSpeed`
                },
                decimal: {
                  type: "const",
                  constVal: 1
                },
                factor: {
                  type: "const",
                  constVal: 1e3 / 3600
                },
                unit: void 0
              },
              entity2: {
                value: {
                  type: "triggered",
                  dp: `accuweather.${instance}.Current.WindSpeed`
                },
                decimal: {
                  type: "const",
                  constVal: 1
                },
                factor: {
                  type: "const",
                  constVal: 1e3 / 3600
                },
                unit: {
                  type: "const",
                  constVal: "m/s"
                }
              },
              icon: {
                true: {
                  value: {
                    type: "const",
                    constVal: "weather-windy"
                  },
                  color: {
                    type: "const",
                    constVal: import_Color.Color.MSRed
                  }
                },
                false: {
                  value: {
                    type: "const",
                    constVal: "weather-windy"
                  },
                  color: {
                    type: "const",
                    constVal: import_Color.Color.MSGreen
                  }
                },
                scale: {
                  type: "const",
                  constVal: { val_min: 0, val_max: 80 }
                },
                maxBri: void 0,
                minBri: void 0
              },
              text: {
                true: {
                  type: "const",
                  constVal: "Wind"
                },
                false: void 0
              }
            }
          },
          // Bottom 9 - Böen
          {
            role: "text",
            dpInit: "",
            type: "text",
            modeScr: "bottom",
            data: {
              entity1: {
                value: {
                  type: "triggered",
                  dp: `accuweather.${instance}.Current.WindGust`
                },
                decimal: {
                  type: "const",
                  constVal: 1
                },
                factor: {
                  type: "const",
                  constVal: 1e3 / 3600
                },
                unit: void 0
              },
              entity2: {
                value: {
                  type: "triggered",
                  dp: `accuweather.${instance}.Current.WindGust`
                },
                decimal: {
                  type: "const",
                  constVal: 1
                },
                factor: {
                  type: "const",
                  constVal: 1e3 / 3600
                },
                unit: {
                  type: "const",
                  constVal: "m/s"
                }
              },
              icon: {
                true: {
                  value: {
                    type: "const",
                    constVal: "weather-tornado"
                  },
                  color: {
                    type: "const",
                    constVal: import_Color.Color.MSRed
                  }
                },
                false: {
                  value: {
                    type: "const",
                    constVal: "weather-tornado"
                  },
                  color: {
                    type: "const",
                    constVal: import_Color.Color.MSGreen
                  }
                },
                scale: {
                  type: "const",
                  constVal: { val_min: 0, val_max: 80 }
                },
                maxBri: void 0,
                minBri: void 0
              },
              text: {
                true: {
                  type: "const",
                  constVal: "B\xF6en"
                },
                false: void 0
              }
            }
          },
          // Bottom 10 - Windrichtung
          {
            role: "text",
            dpInit: "",
            type: "text",
            modeScr: "bottom",
            data: {
              entity2: {
                value: {
                  type: "triggered",
                  dp: `accuweather.${instance}.Current.WindDirectionText`
                },
                decimal: {
                  type: "const",
                  constVal: 0
                },
                factor: void 0,
                unit: {
                  type: "const",
                  constVal: "\xB0"
                }
              },
              icon: {
                true: {
                  value: {
                    type: "const",
                    constVal: "windsock"
                  },
                  color: {
                    type: "const",
                    constVal: "#FFFFFF"
                  }
                },
                false: {
                  value: void 0,
                  color: void 0
                },
                scale: void 0,
                maxBri: void 0,
                minBri: void 0
              },
              text: {
                true: {
                  type: "const",
                  constVal: "Windr."
                },
                false: void 0
              }
            }
          },
          // Bottom 12 - UV-Index
          {
            role: "text",
            dpInit: "",
            type: "text",
            modeScr: "bottom",
            data: {
              entity1: {
                value: {
                  type: "triggered",
                  dp: `accuweather.${instance}.Current.UVIndex`
                },
                decimal: void 0,
                factor: void 0,
                unit: void 0
              },
              entity2: {
                value: {
                  type: "triggered",
                  dp: `accuweather.${instance}.Current.UVIndex`,
                  forceType: "string"
                },
                decimal: void 0,
                factor: void 0,
                unit: void 0
              },
              icon: {
                true: {
                  value: {
                    type: "const",
                    constVal: "solar-power"
                  },
                  color: {
                    type: "const",
                    constVal: import_Color.Color.MSRed
                  }
                },
                false: {
                  value: {
                    type: "const",
                    constVal: "solar-power"
                  },
                  color: {
                    type: "const",
                    constVal: import_Color.Color.MSGreen
                  }
                },
                scale: {
                  type: "const",
                  constVal: { val_min: 0, val_max: 9 }
                },
                maxBri: void 0,
                minBri: void 0
              },
              text: {
                true: {
                  type: "const",
                  constVal: "UV"
                },
                false: void 0
              }
            }
          }
        ]);
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
        pageItems.push(await this.getMrEntityData(config.mrIcon1ScreensaverEntity, "mricon", "1"));
      } catch (error) {
        throw new Error(`mrIcon1ScreensaverEntity - ${error}`);
      }
    }
    if (config.mrIcon2ScreensaverEntity) {
      try {
        pageItems.push(await this.getMrEntityData(config.mrIcon2ScreensaverEntity, "mricon", "2"));
      } catch (error) {
        throw new Error(`mrIcon2ScreensaverEntity - ${error}`);
      }
    }
    this.log.debug(`Screensaver pageItems count: ${pageItems.length}`);
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
                local: "de",
                format: {
                  weekday: "long",
                  month: "short",
                  year: "numeric",
                  day: "numeric"
                }
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
        data: void 0
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
      for (const dp in (import_config_manager_const.requiredFeatureDatapoints[role2] || {}).data) {
        try {
          const o = dp !== "" ? await this.adapter.getForeignObjectAsync(`${item2.id}.${dp}`) : void 0;
          if (!o && !import_config_manager_const.requiredScriptDataPoints[role2].data[dp].required) {
            continue;
          }
          if (!o || !this.checkStringVsStringOrArray(import_config_manager_const.requiredScriptDataPoints[role2].data[dp].role, o.common.role) || import_config_manager_const.requiredScriptDataPoints[role2].data[dp].type !== "mixed" && o.common.type !== import_config_manager_const.requiredScriptDataPoints[role2].data[dp].type || import_config_manager_const.requiredScriptDataPoints[role2].data[dp].writeable && !o.common.write) {
            if (!o) {
              throw new Error(`Datapoint ${item2.id}.${dp} is missing and is required for role ${role2}!`);
            } else {
              throw new Error(
                `Datapoint ${item2.id}.${dp}:${!this.checkStringVsStringOrArray(import_config_manager_const.requiredScriptDataPoints[role2].data[dp].role, o.common.role) ? ` role: ${o.common.role} should be ${(0, import_readme.getStringOrArray)(import_config_manager_const.requiredScriptDataPoints[role2].data[dp].role)})` : ""} ${import_config_manager_const.requiredScriptDataPoints[role2].data[dp].type !== "mixed" && o.common.type !== import_config_manager_const.requiredScriptDataPoints[role2].data[dp].type ? ` type: ${o.common.type} should be ${import_config_manager_const.requiredScriptDataPoints[role2].data[dp].type}` : ""}${import_config_manager_const.requiredScriptDataPoints[role2].data[dp].writeable && !o.common.write ? " must be writeable!" : ""} `
              );
            }
          }
        } catch (err) {
          error += err;
        }
      }
      if (error) {
        throw new Error(error);
      }
      return true;
    };
    const _checkDataPoints = async (role2, item2) => {
      let error = "";
      for (const dp in (import_config_manager_const.requiredFeatureDatapoints[role2] || {}).data) {
        try {
          const o = dp !== "" ? await this.adapter.getForeignObjectAsync(`${item2.id}.${dp}`) : void 0;
          if (!o && !import_config_manager_const.requiredFeatureDatapoints[role2].data[dp].required) {
            continue;
          }
          if (!o || !this.checkStringVsStringOrArray(
            import_config_manager_const.requiredFeatureDatapoints[role2].data[dp].role,
            o.common.role
          ) || import_config_manager_const.requiredFeatureDatapoints[role2].data[dp].type !== "mixed" && o.common.type !== import_config_manager_const.requiredFeatureDatapoints[role2].data[dp].type) {
            if (!o) {
              throw new Error(`Datapoint ${item2.id}.${dp} is missing and is required for role ${role2}!`);
            } else {
              throw new Error(
                `Datapoint ${item2.id}.${dp}:${!this.checkStringVsStringOrArray(import_config_manager_const.requiredFeatureDatapoints[role2].data[dp].role, o.common.role) ? ` role: ${o.common.role} should be ${(0, import_readme.getStringOrArray)(import_config_manager_const.requiredFeatureDatapoints[role2].data[dp].role)}` : ""} ${import_config_manager_const.requiredFeatureDatapoints[role2].data[dp].type !== "mixed" && o.common.type !== import_config_manager_const.requiredFeatureDatapoints[role2].data[dp].type ? ` type: ${o.common.type} should be ${import_config_manager_const.requiredFeatureDatapoints[role2].data[dp].type}` : ""}${import_config_manager_const.requiredFeatureDatapoints[role2].data[dp].writeable && !o.common.write ? " must be writeable!" : ""} `
              );
            }
          }
        } catch (err) {
          error += err;
        }
      }
      if (error) {
        throw new Error(error);
      }
      return true;
    };
    if (mode === "both" || mode === "script") {
      try {
        if (await _checkScriptDataPoints(role, item)) {
          return true;
        }
      } catch (error) {
        try {
          if (await _checkDataPoints(role, item)) {
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
        if (await _checkDataPoints(role, item)) {
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
  async getMrEntityData(entity, mode, nr) {
    const result = {
      modeScr: mode,
      type: "text",
      data: { entity1: {} }
    };
    if (entity.ScreensaverEntity && entity.ScreensaverEntity.endsWith(`Relay.${nr}`)) {
      result.data.entity1.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity, true);
    } else {
      result.data.entity1.value = {
        type: "internal",
        dp: `cmd/power${nr}`
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
      result.data.icon.true.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOff);
    }
    if (entity.ScreensaverEntityValue) {
      result.data.icon.false.text = {
        value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityValue),
        unit: entity.ScreensaverEntityValueUnit ? await this.getFieldAsDataItemConfig(entity.ScreensaverEntityValueUnit) : void 0,
        decimal: entity.ScreensaverEntityValueDecimalPlace ? { type: "const", constVal: entity.ScreensaverEntityValueDecimalPlace } : void 0,
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
    if (!result.data.entity1) {
      throw new Error("Invalid data");
    }
    result.data.entity2 = result.data.entity1;
    let obj;
    if (entity.ScreensaverEntity && !entity.ScreensaverEntity.endsWith(".")) {
      obj = await this.adapter.getObjectAsync(entity.ScreensaverEntity);
      result.data.entity1.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity, true);
    }
    const dataType = obj && obj.common && obj.common.type ? obj.common.type : void 0;
    if (entity.ScreensaverEntityUnitText || entity.ScreensaverEntityUnitText === "") {
      result.data.entity1.unit = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityUnitText);
    } else if (obj && obj.common && obj.common.unit) {
      result.data.entity1.unit = { type: "const", constVal: obj.common.unit };
    }
    if (entity.ScreensaverEntityFactor) {
      result.data.entity1.factor = { type: "const", constVal: entity.ScreensaverEntityFactor };
    }
    if (entity.ScreensaverEntityDecimalPlaces) {
      result.data.entity1.decimal = { type: "const", constVal: entity.ScreensaverEntityDecimalPlaces };
    }
    if (entity.ScreensaverEntityDateFormat) {
      result.data.entity1.dateFormat = {
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
                const items = [${entity.ScreensaverEntityIconSelect.map((item) => `{${item.value}, ${item.icon}}`).join(", ")}];
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
    const state = import_Color.Color.isScriptRGB(possibleId) || possibleId === "" || possibleId.endsWith(".") ? void 0 : await this.adapter.getForeignStateAsync(possibleId);
    if (!import_Color.Color.isScriptRGB(possibleId) && state !== void 0 && state !== null) {
      if (isTrigger) {
        return { type: "triggered", dp: possibleId };
      }
      return { type: "state", dp: possibleId };
    }
    return { type: "const", constVal: possibleId };
  }
  async getIconColor(item, def = void 0) {
    if (isIconScaleElement(item)) {
    } else if (typeof item === "string") {
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
    this.adapter.log.error(`Invalid color value: ${JSON.stringify(item)}`);
    return void 0;
  }
  async existsState(id) {
    return await this.adapter.getForeignStateAsync(id) !== null;
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
