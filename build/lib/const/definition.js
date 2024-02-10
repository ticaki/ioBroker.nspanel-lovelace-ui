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
  ScreenSaverAllPlaces: () => ScreenSaverAllPlaces,
  ScreenSaverConst: () => ScreenSaverConst,
  ScreenSaverPlaces: () => ScreenSaverPlaces,
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
      name: "genericStateObjects.state",
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
        name: "genericStateObjects.panel"
      },
      native: {}
    },
    panels: {
      _channel: {
        _id: "",
        type: "device",
        common: {
          name: "genericStateObjects.panels"
        },
        native: {}
      },
      cmd: {
        _channel: {
          _id: "",
          type: "channel",
          common: {
            name: "genericStateObjects.cmd"
          },
          native: {}
        },
        power1: {
          _id: "",
          type: "state",
          common: {
            name: "genericStateObjects.power1",
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
            name: "genericStateObjects.power2",
            type: "boolean",
            role: "switch",
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
            name: "genericStateObjects.info"
          },
          native: {}
        },
        status: {
          _id: "",
          type: "state",
          common: {
            name: "genericStateObjects.status",
            type: "string",
            role: "json",
            read: true,
            write: false
          },
          native: {}
        }
      }
    }
  },
  presense: {
    _id: "",
    type: "state",
    common: {
      name: "genericStateObjects.presense",
      type: "boolean",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  },
  customString: {
    _id: "User_State",
    type: "state",
    common: {
      name: "genericStateObjects.customString",
      type: "string",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  },
  devices: {
    _id: "",
    type: "folder",
    common: {
      name: "devices.folder"
    },
    native: {}
  },
  rooms: {
    _id: "",
    type: "folder",
    common: {
      name: "rooms.folder"
    },
    native: {}
  },
  settings: {
    _id: "",
    type: "folder",
    common: {
      name: "settings.folder"
    },
    native: {}
  },
  global: {
    _id: "",
    type: "folder",
    common: {
      name: "settings.global"
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
const ScreenSaverPlaces = ["favoritEntity", "leftEntity", "bottomEntity", "alternateEntity", "indicatorEntity"];
const ScreenSaverAllPlaces = [
  "favoritEntity",
  "leftEntity",
  "bottomEntity",
  "alternateEntity",
  "indicatorEntity",
  "mrIconEntity"
];
const ScreenSaverConst = {
  standard: {
    leftEntity: {
      maxEntries: 0
    },
    bottomEntity: {
      maxEntries: 4
    },
    alternateEntity: {
      maxEntries: 0
    },
    indicatorEntity: {
      maxEntries: 0
    },
    mrIconEntity: {
      maxEntries: 2
    },
    favoritEntity: {
      maxEntries: 1
    }
  },
  alternate: {
    leftEntity: {
      maxEntries: 0
    },
    bottomEntity: {
      maxEntries: 3
    },
    alternateEntity: {
      maxEntries: 1
    },
    indicatorEntity: {
      maxEntries: 0
    },
    mrIconEntity: {
      maxEntries: 2
    },
    favoritEntity: {
      maxEntries: 1
    }
  },
  advanced: {
    leftEntity: {
      maxEntries: 3
    },
    bottomEntity: {
      maxEntries: 6
    },
    alternateEntity: {
      maxEntries: 0
    },
    indicatorEntity: {
      maxEntries: 5
    },
    mrIconEntity: {
      maxEntries: 2
    },
    favoritEntity: {
      maxEntries: 1
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
  ScreenSaverAllPlaces,
  ScreenSaverConst,
  ScreenSaverPlaces,
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
