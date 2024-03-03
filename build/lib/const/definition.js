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
var definition_exports = {};
__export(definition_exports, {
  AliasPath: () => AliasPath,
  Debug: () => Debug,
  Defaults: () => Defaults,
  NSPanelReceiveTopic: () => NSPanelReceiveTopic,
  NSPanelSendTopic: () => NSPanelSendTopic,
  NSPanel_Alarm_Path: () => NSPanel_Alarm_Path,
  NSPanel_Path: () => NSPanel_Path,
  ReiveTopicAppendix: () => ReiveTopicAppendix,
  ScreenSaverConst: () => ScreenSaverConst,
  SendTopicAppendix: () => SendTopicAppendix,
  autoCreateAlias: () => autoCreateAlias,
  berry_driver_version: () => berry_driver_version,
  defaultBackgroundColorParam: () => defaultBackgroundColorParam,
  defaultChannel: () => defaultChannel,
  defaultColorParam: () => defaultColorParam,
  defaultOffColorParam: () => defaultOffColorParam,
  defaultOnColorParam: () => defaultOnColorParam,
  desired_display_firmware_version: () => desired_display_firmware_version,
  genericStateObjects: () => genericStateObjects,
  scriptVersion: () => scriptVersion,
  tasmotaOtaUrl: () => tasmotaOtaUrl,
  tasmotaOtaVersion: () => tasmotaOtaVersion,
  tasmota_web_admin_password: () => tasmota_web_admin_password,
  tasmota_web_admin_user: () => tasmota_web_admin_user,
  tft_version: () => tft_version,
  weatherAdapterInstance: () => weatherAdapterInstance,
  weatherEntityPath: () => weatherEntityPath,
  weatherScreensaverTempMinMax: () => weatherScreensaverTempMinMax
});
module.exports = __toCommonJS(definition_exports);
var import_Color = require("./Color");
const defaultChannel = {
  _id: "",
  type: "channel",
  common: {
    name: "Hey no description... "
  },
  native: {}
};
const genericStateObjects = {
  default: {
    _id: "No_definition",
    type: "state",
    common: {
      name: "StateObjects.state",
      type: "string",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  },
  panel: {
    _channel: {
      _id: "",
      type: "folder",
      common: {
        name: "StateObjects.panel"
      },
      native: {}
    },
    panels: {
      _channel: {
        _id: "",
        type: "device",
        common: {
          name: "StateObjects.panels"
        },
        native: {}
      },
      buttons: {
        _channel: {
          _id: "",
          type: "channel",
          common: {
            name: "StateObjects.buttons"
          },
          native: {}
        },
        left: {
          _id: "",
          type: "state",
          common: {
            name: "StateObjects.buttons.left",
            type: "boolean",
            role: "button.press",
            read: true,
            write: false
          },
          native: {}
        },
        right: {
          _id: "",
          type: "state",
          common: {
            name: "StateObjects.buttons.right",
            type: "boolean",
            role: "button.press",
            read: true,
            write: false
          },
          native: {}
        }
      },
      cmd: {
        _channel: {
          _id: "",
          type: "channel",
          common: {
            name: "StateObjects.cmd"
          },
          native: {}
        },
        screenSaver: {
          _id: "",
          type: "state",
          common: {
            name: "StateObjects.screenSaver",
            type: "string",
            role: "value.text",
            read: true,
            write: true,
            states: {}
          },
          native: {}
        },
        mainNavigationPoint: {
          _id: "",
          type: "state",
          common: {
            name: "StateObjects.mainNavigationPoint",
            type: "string",
            role: "value.text",
            read: true,
            write: true,
            states: {}
          },
          native: {}
        },
        goToNavigationPoint: {
          _id: "",
          type: "state",
          common: {
            name: "StateObjects.navigateToPage",
            type: "string",
            role: "value.text",
            read: true,
            write: true,
            states: {}
          },
          native: {}
        },
        power1: {
          _id: "",
          type: "state",
          common: {
            name: "StateObjects.power1",
            type: "boolean",
            role: "switch",
            read: true,
            write: true
          },
          native: {}
        },
        power2: {
          _id: "",
          type: "state",
          common: {
            name: "StateObjects.power2",
            type: "boolean",
            role: "switch",
            read: true,
            write: true
          },
          native: {}
        },
        detachLeft: {
          _id: "",
          type: "state",
          common: {
            name: "StateObjects.detachLeft",
            type: "boolean",
            role: "switch",
            read: true,
            write: true
          },
          native: {}
        },
        detachRight: {
          _id: "",
          type: "state",
          common: {
            name: "StateObjects.detachRight",
            type: "boolean",
            role: "switch",
            read: true,
            write: true
          },
          native: {}
        },
        screensaverTimeout: {
          _id: "",
          type: "state",
          common: {
            name: "StateObjects.screensaverTimeout",
            type: "number",
            role: "value",
            unit: "s",
            read: true,
            write: true
          },
          native: {}
        },
        dimStandby: {
          _id: "",
          type: "state",
          common: {
            name: "StateObjects.dimStandby",
            type: "number",
            role: "value",
            unit: "%",
            read: true,
            write: true
          },
          native: {}
        },
        dimActive: {
          _id: "",
          type: "state",
          common: {
            name: "StateObjects.dimActive",
            type: "number",
            role: "value",
            unit: "%",
            read: true,
            write: true
          },
          native: {}
        }
      },
      info: {
        _channel: {
          _id: "",
          type: "channel",
          common: {
            name: "StateObjects.info"
          },
          native: {}
        },
        status: {
          _id: "",
          type: "state",
          common: {
            name: "StateObjects.status",
            type: "string",
            role: "json",
            read: true,
            write: false
          },
          native: {}
        },
        nspanel: {
          _channel: {
            _id: "",
            type: "channel",
            common: {
              name: "StateObjects.nspanel"
            },
            native: {}
          },
          currentPage: {
            _id: "",
            type: "state",
            common: {
              name: "StateObjects.currentPage",
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          displayVersion: {
            _id: "",
            type: "state",
            common: {
              name: "StateObjects.displayVersion",
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          model: {
            _id: "",
            type: "state",
            common: {
              name: "StateObjects.model",
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          bigIconLeft: {
            _id: "",
            type: "state",
            common: {
              name: "StateObjects.bigIconLeft",
              type: "boolean",
              role: "indicator",
              read: true,
              write: false
            },
            native: {}
          },
          bigIconRight: {
            _id: "",
            type: "state",
            common: {
              name: "StateObjects.bigIconRight",
              type: "boolean",
              role: "indicator",
              read: true,
              write: false
            },
            native: {}
          },
          isOnline: {
            _id: "",
            type: "state",
            common: {
              name: "StateObjects.isOnline",
              type: "boolean",
              role: "indicator.reachable",
              read: true,
              write: false
            },
            native: {}
          }
        },
        tasmota: {
          _channel: {
            _id: "",
            type: "channel",
            common: {
              name: "Tasmota"
            },
            native: {}
          },
          uptime: {
            _id: "",
            type: "state",
            common: {
              name: "StateObjects.uptime",
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          wifi: {
            _channel: {
              _id: "",
              type: "channel",
              common: {
                name: "StateObjects.wifi"
              },
              native: {}
            },
            ssid: {
              _id: "",
              type: "state",
              common: {
                name: "StateObjects.ssid",
                type: "string",
                role: "text",
                read: true,
                write: false
              },
              native: {}
            },
            rssi: {
              _id: "",
              type: "state",
              common: {
                name: "StateObjects.rssi",
                type: "string",
                role: "text",
                read: true,
                write: false
              },
              native: {}
            },
            downtime: {
              _id: "",
              type: "state",
              common: {
                name: "StateObjects.downtime",
                type: "string",
                role: "text",
                read: true,
                write: false
              },
              native: {}
            }
          },
          net: {
            _channel: {
              _id: "",
              type: "channel",
              common: {
                name: "StateObjects.net"
              },
              native: {}
            },
            ip: {
              _id: "",
              type: "state",
              common: {
                name: "StateObjects.ip",
                type: "string",
                role: "text",
                read: true,
                write: false
              },
              native: {}
            },
            gateway: {
              _id: "",
              type: "state",
              common: {
                name: "StateObjects.gateway",
                type: "string",
                role: "text",
                read: true,
                write: false
              },
              native: {}
            },
            dnsserver: {
              _id: "",
              type: "state",
              common: {
                name: "StateObjects.dnsserver",
                type: "string",
                role: "text",
                read: true,
                write: false
              },
              native: {}
            },
            subnetmask: {
              _id: "",
              type: "state",
              common: {
                name: "StateObjects.subnetmask",
                type: "string",
                role: "text",
                read: true,
                write: false
              },
              native: {}
            },
            hostname: {
              _id: "",
              type: "state",
              common: {
                name: "StateObjects.hostname",
                type: "string",
                role: "text",
                read: true,
                write: false
              },
              native: {}
            },
            mac: {
              _id: "",
              type: "state",
              common: {
                name: "StateObjects.mac",
                type: "string",
                role: "text",
                read: true,
                write: false
              },
              native: {}
            }
          }
        }
      },
      alarm: {
        _channel: {
          _id: "",
          type: "channel",
          common: {
            name: "StateObjects.alarm"
          },
          native: {}
        },
        cardAlarm: {
          _channel: {
            _id: "",
            type: "channel",
            common: {
              name: "StateObjects.cardAlarm"
            },
            native: {}
          },
          status: {
            _id: "",
            type: "state",
            common: {
              name: "StateObjects.power2",
              type: "number",
              role: "value",
              states: ["disarmed", "armed", "arming", "pending", "triggered"],
              read: true,
              write: false
            },
            native: {}
          },
          trigger: {
            _id: "",
            type: "state",
            common: {
              name: "StateObjects.power2",
              type: "boolean",
              role: "button",
              read: false,
              write: true
            },
            native: {}
          },
          arm: {
            _id: "",
            type: "state",
            common: {
              name: "StateObjects.power2",
              type: "boolean",
              role: "button",
              read: false,
              write: true
            },
            native: {}
          }
        }
      }
    }
  },
  customString: {
    _id: "User_State",
    type: "state",
    common: {
      name: "StateObjects.customString",
      type: "string",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  }
};
const Defaults = {
  state: {
    _id: "No_definition",
    type: "state",
    common: {
      name: "No definition",
      type: "string",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  }
};
const Debug = false;
const NSPanelReceiveTopic = "mqtt.0.SmartHome.NSPanel_1.tele.RESULT";
const NSPanelSendTopic = "mqtt.0.SmartHome.NSPanel_1.cmnd.CustomSend";
const tasmota_web_admin_user = "admin";
const tasmota_web_admin_password = "";
const tasmotaOtaVersion = "tasmota32-DE.bin";
const NSPanel_Path = "0_userdata.0.NSPanel.1.";
const NSPanel_Alarm_Path = "0_userdata.0.NSPanel.";
const weatherAdapterInstance = "accuweather.0.";
const weatherScreensaverTempMinMax = "MinMax";
const weatherEntityPath = "alias.0.Wetter";
const autoCreateAlias = true;
const AliasPath = "alias.0." + NSPanel_Path.substring(13, NSPanel_Path.length);
const defaultOffColorParam = import_Color.Off;
const defaultOnColorParam = import_Color.On;
const defaultColorParam = import_Color.Off;
const defaultBackgroundColorParam = import_Color.HMIDark;
const scriptVersion = "v4.3.3.33";
const tft_version = "v4.3.3";
const desired_display_firmware_version = 53;
const berry_driver_version = 9;
const tasmotaOtaUrl = "http://ota.tasmota.com/tasmota32/release/";
const ScreenSaverConst = {
  standard: {
    left: {
      maxEntries: { eu: 0 }
    },
    bottom: {
      maxEntries: { eu: 4 }
    },
    alternate: {
      maxEntries: { eu: 0 }
    },
    indicator: {
      maxEntries: { eu: 0 }
    },
    mricon: {
      maxEntries: { eu: 2 }
    },
    favorit: {
      maxEntries: { eu: 1 }
    },
    time: {
      maxEntries: { eu: 1 }
    },
    date: {
      maxEntries: { eu: 1 }
    }
  },
  alternate: {
    left: {
      maxEntries: { eu: 0 }
    },
    bottom: {
      maxEntries: { eu: 3 }
    },
    alternate: {
      maxEntries: { eu: 1 }
    },
    indicator: {
      maxEntries: { eu: 0 }
    },
    mricon: {
      maxEntries: { eu: 2 }
    },
    favorit: {
      maxEntries: { eu: 1 }
    },
    time: {
      maxEntries: { eu: 1 }
    },
    date: {
      maxEntries: { eu: 1 }
    }
  },
  advanced: {
    left: {
      maxEntries: { eu: 3 }
    },
    bottom: {
      maxEntries: { eu: 6 }
    },
    alternate: {
      maxEntries: { eu: 0 }
    },
    indicator: {
      maxEntries: { eu: 5 }
    },
    mricon: {
      maxEntries: { eu: 2 }
    },
    favorit: {
      maxEntries: { eu: 1 }
    },
    time: {
      maxEntries: { eu: 1 }
    },
    date: {
      maxEntries: { eu: 1 }
    }
  }
};
const ReiveTopicAppendix = "/tele/RESULT";
const SendTopicAppendix = "/cmnd/CustomSend";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AliasPath,
  Debug,
  Defaults,
  NSPanelReceiveTopic,
  NSPanelSendTopic,
  NSPanel_Alarm_Path,
  NSPanel_Path,
  ReiveTopicAppendix,
  ScreenSaverConst,
  SendTopicAppendix,
  autoCreateAlias,
  berry_driver_version,
  defaultBackgroundColorParam,
  defaultChannel,
  defaultColorParam,
  defaultOffColorParam,
  defaultOnColorParam,
  desired_display_firmware_version,
  genericStateObjects,
  scriptVersion,
  tasmotaOtaUrl,
  tasmotaOtaVersion,
  tasmota_web_admin_password,
  tasmota_web_admin_user,
  tft_version,
  weatherAdapterInstance,
  weatherEntityPath,
  weatherScreensaverTempMinMax
});
//# sourceMappingURL=definition.js.map
