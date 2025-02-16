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
var import_pages = require("../types/pages");
class ConfigManager extends import_library.BaseClass {
  //private test: ConfigManager.DeviceState;
  colorOn = import_Color.Color.On;
  colorOff = import_Color.Color.Off;
  colorDefault = import_Color.Color.Off;
  constructor(adapter) {
    super(adapter, "config-manager");
  }
  async setScriptConfig(configuration) {
    const config = Object.assign(import_config_manager_const.defaultConfig, configuration);
    if (!config || !(0, import_config_manager_const.isConfig)(config)) {
      this.log.error(`Invalid configuration from Script: ${config ? JSON.stringify(config) : "undefined"}`);
      return;
    }
    let panelConfig = { pages: [], navigation: [] };
    if (!config.panelTopic) {
      this.log.error(`Required field panelTopic is missing in ${config.panelName || "unknown"}!`);
      return;
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
    panelConfig.pages.push(await this.getScreensaverConfig(config));
    if (config.pages.length > 1) {
      for (let a = 0; a < config.pages.length; a++) {
        const page = config.pages[a];
        if (page.type === void 0 || page.uniqueName == null) {
          continue;
        }
        panelConfig.navigation.push({
          name: page.uniqueName,
          left: void 0,
          right: void 0,
          page: page.uniqueName
        });
      }
      if (panelConfig.navigation.length > 1) {
        panelConfig.navigation = panelConfig.navigation.map((item, index, array) => {
          if (index === 0) {
            return {
              ...item,
              left: { single: array[array.length - 1].name },
              right: { single: array[0].name }
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
      }
    }
    panelConfig = await this.getGridConfig(config, panelConfig);
    this.log.debug(`panelConfig: ${JSON.stringify(panelConfig)}`);
    const obj = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
    if (obj) {
      obj.native.scriptConfig = obj.native.scriptConfig || [];
      const index = obj.native.scriptConfig.findIndex((item) => item.name === panelConfig.name);
      if (index !== -1) {
        obj.native.scriptConfig[index] = panelConfig;
      } else {
        obj.native.scriptConfig.push(panelConfig);
      }
      await this.adapter.setForeignObjectAsync(this.adapter.namespace, obj);
    }
  }
  async getGridConfig(config, result) {
    if (result.pages === void 0) {
      result.pages = [];
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
          result.pages.push(page.native);
          continue;
        }
        if (page.type !== "cardGrid" && page.type !== "cardGrid2" && page.type !== "cardGrid3" && page.type !== "cardEntities") {
          continue;
        }
        if (!page.uniqueName) {
          this.log.error(`Page ${page.heading || "unknown"} has no uniqueName!`);
          continue;
        }
        const left = page.prev || page.parent && page.parent.type !== void 0 && page.parent.uniqueName || void 0;
        const right = page.next || page.home || void 0;
        const navItem = {
          name: page.uniqueName,
          left: left ? { single: left } : void 0,
          right: right ? { single: right } : void 0,
          page: page.uniqueName
        };
        result.navigation.push(navItem);
        const gridItem = {
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
        if (page.items) {
          for (const item of page.items) {
            if (!item) {
              continue;
            }
            let itemConfig = void 0;
            if (item.id && !item.id.endsWith(".")) {
              const obj = await this.adapter.getForeignObjectAsync(item.id);
              if (obj) {
                if (!(obj.common && obj.common.role)) {
                  this.log.error(`Role missing in ${item.id}!`);
                  continue;
                }
                const role = obj.common.role;
                if (!import_config_manager_const.requiredDatapoints[role]) {
                  this.log.warn(`Role ${role} not implemented yet!`);
                  continue;
                }
                let ok = true;
                for (const dp in import_config_manager_const.requiredDatapoints[role]) {
                  const o = dp !== "" ? await this.adapter.getForeignObjectAsync(`${item.id}.${dp}`) : void 0;
                  if (!o && !import_config_manager_const.requiredOutdatedDataPoints[role][dp].required && !import_config_manager_const.requiredDatapoints[role][dp].required) {
                    continue;
                  }
                  if (!o || o.common.role !== import_config_manager_const.requiredOutdatedDataPoints[role][dp].role || o.common.type !== import_config_manager_const.requiredOutdatedDataPoints[role][dp].type) {
                    if (!o || o.common.role !== import_config_manager_const.requiredDatapoints[role][dp].role || o.common.type !== import_config_manager_const.requiredDatapoints[role][dp].type) {
                      ok = false;
                      if (!o) {
                        this.log.error(`Datapoint ${item.id}.${dp} is missing and required!`);
                      } else {
                        this.log.error(
                          `Datapoint ${item.id}.${dp} has wrong role: ${o.common.role !== import_config_manager_const.requiredDatapoints[role][dp].role ? `${o.common.role} should be ${import_config_manager_const.requiredDatapoints[role][dp].role}` : `ok`} - type: ${o.common.type !== import_config_manager_const.requiredDatapoints[role][dp].type ? `${o.common.role} should be ${import_config_manager_const.requiredDatapoints[role][dp].type}` : `ok`}`
                        );
                      }
                      break;
                    }
                  }
                }
                if (!ok) {
                  continue;
                }
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
                            color: {
                              type: "const",
                              constVal: item.onColor || import_Color.Color.activated
                            }
                          },
                          false: {
                            value: {
                              type: "const",
                              constVal: item.icon2 || role === "socket" ? "power-socket-de" : "lightbulb-outline"
                            },
                            color: {
                              type: "const",
                              constVal: item.offColor || import_Color.Color.deactivated
                            }
                          },
                          scale: void 0,
                          maxBri: void 0,
                          minBri: void 0
                        },
                        colorMode: { type: "const", constVal: false },
                        headline: await this.getFieldAsDataItemConfig(
                          item.name || commonName || "Light"
                        ),
                        entity1: {
                          value: { type: "triggered", dp: `${item.id}.SET` }
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
                            color: {
                              type: "const",
                              constVal: item.onColor || import_Color.Color.activated
                            }
                          },
                          false: {
                            value: {
                              type: "const",
                              constVal: item.icon2 || "lightbulb-outline"
                            },
                            color: {
                              type: "const",
                              constVal: item.offColor || import_Color.Color.deactivated
                            }
                          },
                          scale: void 0,
                          maxBri: item.maxValueBrightness ? { type: "const", constVal: item.maxValueBrightness } : void 0,
                          minBri: item.minValueBrightness ? { type: "const", constVal: item.minValueBrightness } : void 0
                        },
                        colorMode: item.colormode ? { type: "const", constVal: !!item.colormode } : void 0,
                        dimmer: {
                          value: { type: "triggered", dp: `${item.id}.SET` },
                          maxScale: item.maxValueBrightness ? { type: "const", constVal: item.maxValueBrightness } : void 0,
                          minScale: item.minValueBrightness ? { type: "const", constVal: item.minValueBrightness } : void 0
                        },
                        headline: await this.getFieldAsDataItemConfig(
                          item.name || commonName || "Dimmer"
                        ),
                        text1: {
                          true: {
                            type: "const",
                            constVal: `Brightness`
                          }
                        },
                        entity1: {
                          value: { type: "triggered", dp: `${item.id}.ON_SET` }
                        }
                      }
                    };
                    itemConfig = tempItem;
                    break;
                  }
                  case "hue": {
                    const tempItem = {
                      type: "light",
                      role: "hue",
                      data: {
                        icon: {
                          true: {
                            value: {
                              type: "const",
                              constVal: item.icon || "lightbulb"
                            },
                            color: {
                              type: "const",
                              constVal: item.onColor || import_Color.Color.activated
                            }
                          },
                          false: {
                            value: {
                              type: "const",
                              constVal: item.icon2 || "lightbulb-outline"
                            },
                            color: {
                              type: "const",
                              constVal: item.offColor || import_Color.Color.deactivated
                            }
                          },
                          scale: void 0,
                          maxBri: item.maxValueBrightness ? { type: "const", constVal: item.maxValueBrightness } : void 0,
                          minBri: item.minValueBrightness ? { type: "const", constVal: item.minValueBrightness } : void 0
                        },
                        colorMode: item.colormode ? { type: "const", constVal: !!item.colormode } : void 0,
                        dimmer: {
                          value: { type: "triggered", dp: `${item.id}.DIMMER` },
                          maxScale: item.maxValueBrightness ? { type: "const", constVal: item.maxValueBrightness } : void 0,
                          minScale: item.minValueBrightness ? { type: "const", constVal: item.minValueBrightness } : void 0
                        },
                        headline: await this.getFieldAsDataItemConfig(
                          item.name || commonName || "HUE"
                        ),
                        hue: {
                          type: "triggered",
                          dp: `${item.id}.HUE`
                        },
                        ct: {
                          value: { type: "triggered", dp: `${item.id}.CT` },
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
                        text3: {
                          true: {
                            type: "const",
                            constVal: `Color`
                          }
                        },
                        entity1: {
                          value: { type: "triggered", dp: `${item.id}.ON` }
                        }
                      }
                    };
                    itemConfig = tempItem;
                    break;
                  }
                  case "rgb":
                  case "rgbSingle":
                  case "ct":
                  case "blind":
                  case "door":
                  case "window":
                  case "volumeGroup":
                  case "volume":
                  case "info":
                  case "humidity":
                  case "temperature":
                  case "value.temperature":
                  case "value.humidity":
                  case "sensor.door":
                  case "sensor.window":
                  case "thermostat":
                  case "warning":
                  case "cie":
                  case "gate":
                  case "motion":
                  case "buttonSensor":
                  case "button":
                  case "value.time":
                  case "level.timer":
                  case "value.alarmtime":
                  case "level.mode.fan":
                  case "lock":
                  case "slider":
                  case "switch.mode.wlan":
                  case "media":
                  case "airCondition": {
                    this.log.error(`Role ${role} not implemented yet!`);
                    break;
                  }
                  default:
                    (0, import_pages.exhaustiveCheck)(role);
                    this.log.error(`Role ${role} not implemented yet!`);
                }
                if (itemConfig) {
                  gridItem.pageItems.push(itemConfig);
                }
              }
            }
          }
        }
        result.pages.push(gridItem);
      }
    }
    return result;
  }
  async getScreensaverConfig(config) {
    let pageItems = [];
    if (config.bottomScreensaverEntity) {
      for (const item of config.bottomScreensaverEntity) {
        if (item) {
          pageItems.push(await this.getEntityData(item, "bottom", config));
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
          pageItems.push(await this.getEntityData(item, "indicator", config));
        }
      }
    }
    if (config.leftScreensaverEntity) {
      for (const item of config.leftScreensaverEntity) {
        if (item) {
          pageItems.push(await this.getEntityData(item, "left", config));
        }
      }
    }
    if (config.mrIcon1ScreensaverEntity) {
      pageItems.push(await this.getMrEntityData(config.mrIcon1ScreensaverEntity, "mricon", "1"));
    }
    if (config.mrIcon2ScreensaverEntity) {
      pageItems.push(await this.getMrEntityData(config.mrIcon2ScreensaverEntity, "mricon", "2"));
    }
    this.log.debug(`pageItems count: ${pageItems.length}`);
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
    result.data.entity2 = result.data.entity1;
    let obj;
    if (entity.ScreensaverEntity && !entity.ScreensaverEntity.endsWith(".")) {
      obj = await this.adapter.getObjectAsync(entity.ScreensaverEntity);
      result.data.entity1.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity, true);
    }
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
    } else {
      colorOff = await this.getIconColor(defaultColors.defaultOffColor);
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
        ...result.data.icon,
        ...{
          false: { value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOff) }
        }
      };
      if (color) {
        result.data.icon.false.color = colorOff;
      }
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
    const state = possibleId === "" || possibleId.endsWith(".") ? void 0 : await this.adapter.getForeignStateAsync(possibleId);
    if (state !== void 0 && state !== null) {
      if (isTrigger) {
        return { type: "triggered", dp: possibleId };
      }
      return { type: "state", dp: possibleId };
    }
    return { type: "const", constVal: possibleId };
  }
  async getIconColor(item) {
    if (isIconScaleElement(item)) {
    } else if (typeof item === "string") {
      return await this.getFieldAsDataItemConfig(item);
    } else if (import_Color.Color.isRGB(item)) {
      return { type: "const", constVal: item };
    } else if (import_Color.Color.isScriptRGB(item)) {
      return { type: "const", constVal: import_Color.Color.convertScriptRGBtoRGB(item) };
    }
    this.adapter.log.error(`Invalid color value: ${JSON.stringify(item)}`);
    return void 0;
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
