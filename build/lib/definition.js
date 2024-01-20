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
  BatteryEmpty: () => BatteryEmpty,
  BatteryFull: () => BatteryFull,
  Black: () => Black,
  Blue: () => Blue,
  Cyan: () => Cyan,
  DarkBlue: () => DarkBlue,
  Debug: () => Debug,
  Defaults: () => Defaults,
  Gray: () => Gray,
  Green: () => Green,
  HMIDark: () => HMIDark,
  HMIOff: () => HMIOff,
  HMIOn: () => HMIOn,
  MSGreen: () => MSGreen,
  MSRed: () => MSRed,
  MSYellow: () => MSYellow,
  Magenta: () => Magenta,
  Menu: () => Menu,
  MenuHighInd: () => MenuHighInd,
  MenuLowInd: () => MenuLowInd,
  NSPanelReceiveTopic: () => NSPanelReceiveTopic,
  NSPanelSendTopic: () => NSPanelSendTopic,
  NSPanel_Alarm_Path: () => NSPanel_Alarm_Path,
  NSPanel_Einstellungen: () => NSPanel_Einstellungen,
  NSPanel_Firmware: () => NSPanel_Firmware,
  NSPanel_FirmwareBerry: () => NSPanel_FirmwareBerry,
  NSPanel_FirmwareNextion: () => NSPanel_FirmwareNextion,
  NSPanel_FirmwareTasmota: () => NSPanel_FirmwareTasmota,
  NSPanel_Hardware: () => NSPanel_Hardware,
  NSPanel_Infos: () => NSPanel_Infos,
  NSPanel_IoBroker: () => NSPanel_IoBroker,
  NSPanel_Path: () => NSPanel_Path,
  NSPanel_Relays: () => NSPanel_Relays,
  NSPanel_Screensaver: () => NSPanel_Screensaver,
  NSPanel_ScreensaverBrightness: () => NSPanel_ScreensaverBrightness,
  NSPanel_ScreensaverDateformat: () => NSPanel_ScreensaverDateformat,
  NSPanel_ScreensaverDimmode: () => NSPanel_ScreensaverDimmode,
  NSPanel_ScreensaverIndicators: () => NSPanel_ScreensaverIndicators,
  NSPanel_ScreensaverLayout: () => NSPanel_ScreensaverLayout,
  NSPanel_ScreensaverWeather: () => NSPanel_ScreensaverWeather,
  NSPanel_Script: () => NSPanel_Script,
  NSPanel_Sensoren: () => NSPanel_Sensoren,
  NSPanel_Service: () => NSPanel_Service,
  NSPanel_Service_SubPage: () => NSPanel_Service_SubPage,
  NSPanel_Wifi_Info_1: () => NSPanel_Wifi_Info_1,
  NSPanel_Wifi_Info_2: () => NSPanel_Wifi_Info_2,
  Off: () => Off,
  On: () => On,
  Red: () => Red,
  Unlock_Service: () => Unlock_Service,
  White: () => White,
  Yellow: () => Yellow,
  autoCreateAlias: () => autoCreateAlias,
  berry_driver_version: () => berry_driver_version,
  colorAlexa: () => colorAlexa,
  colorRadio: () => colorRadio,
  colorScale0: () => colorScale0,
  colorScale1: () => colorScale1,
  colorScale10: () => colorScale10,
  colorScale2: () => colorScale2,
  colorScale3: () => colorScale3,
  colorScale4: () => colorScale4,
  colorScale5: () => colorScale5,
  colorScale6: () => colorScale6,
  colorScale7: () => colorScale7,
  colorScale8: () => colorScale8,
  colorScale9: () => colorScale9,
  colorSonos: () => colorSonos,
  colorSpotify: () => colorSpotify,
  config: () => config,
  defaultBackgroundColorParam: () => defaultBackgroundColorParam,
  defaultChannel: () => defaultChannel,
  defaultColorParam: () => defaultColorParam,
  defaultOffColorParam: () => defaultOffColorParam,
  defaultOnColorParam: () => defaultOnColorParam,
  desired_display_firmware_version: () => desired_display_firmware_version,
  genericStateObjects: () => genericStateObjects,
  scbackground: () => scbackground,
  scbackgroundInd1: () => scbackgroundInd1,
  scbackgroundInd2: () => scbackgroundInd2,
  scbackgroundInd3: () => scbackgroundInd3,
  scbar: () => scbar,
  scdate: () => scdate,
  scriptVersion: () => scriptVersion,
  sctF1Icon: () => sctF1Icon,
  sctF2Icon: () => sctF2Icon,
  sctF3Icon: () => sctF3Icon,
  sctF4Icon: () => sctF4Icon,
  sctForecast1: () => sctForecast1,
  sctForecast1Val: () => sctForecast1Val,
  sctForecast2: () => sctForecast2,
  sctForecast2Val: () => sctForecast2Val,
  sctForecast3: () => sctForecast3,
  sctForecast3Val: () => sctForecast3Val,
  sctForecast4: () => sctForecast4,
  sctForecast4Val: () => sctForecast4Val,
  sctMainIcon: () => sctMainIcon,
  sctMainIconAlt: () => sctMainIconAlt,
  sctMainText: () => sctMainText,
  sctMainTextAlt: () => sctMainTextAlt,
  sctTimeAdd: () => sctTimeAdd,
  sctime: () => sctime,
  sctimeAMPM: () => sctimeAMPM,
  statesObjects: () => statesObjects,
  swClearNight: () => swClearNight,
  swCloudy: () => swCloudy,
  swExceptional: () => swExceptional,
  swFog: () => swFog,
  swHail: () => swHail,
  swLightning: () => swLightning,
  swLightningRainy: () => swLightningRainy,
  swPartlycloudy: () => swPartlycloudy,
  swPouring: () => swPouring,
  swRainy: () => swRainy,
  swSnowy: () => swSnowy,
  swSnowyRainy: () => swSnowyRainy,
  swSunny: () => swSunny,
  swWindy: () => swWindy,
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
  deviceDB: {
    _id: "",
    type: "state",
    common: {
      name: "genericStateObjects.deviceDB",
      type: "string",
      role: "json",
      read: true,
      write: false
    },
    native: {}
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
const statesObjects = {
  state: {
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
  rooms: {
    _channel: {
      _id: "",
      type: "device",
      common: {
        name: "room.channel"
      },
      native: {}
    },
    restart: {
      _id: "",
      type: "state",
      common: {
        name: "room.restart",
        type: "boolean",
        role: "button",
        read: false,
        write: true
      },
      native: {}
    },
    known_irks: {
      _id: "",
      type: "state",
      common: {
        name: "room.known_irks",
        type: "string",
        role: "text",
        read: true,
        write: false
      },
      native: {}
    },
    known_macs: {
      _id: "",
      type: "state",
      common: {
        name: "room.known_macs",
        type: "string",
        role: "text",
        read: true,
        write: false
      },
      native: {}
    },
    query: {
      _id: "",
      type: "state",
      common: {
        name: "room.query",
        type: "string",
        role: "text",
        read: true,
        write: false
      },
      native: {}
    },
    exclude: {
      _id: "",
      type: "state",
      common: {
        name: "room.exclude",
        type: "string",
        role: "text",
        read: true,
        write: true
      },
      native: {}
    },
    status: {
      _id: "",
      type: "state",
      common: {
        name: "room.status",
        type: "string",
        role: "text",
        read: true,
        write: true
      },
      native: {}
    },
    max_distance: {
      _id: "",
      type: "state",
      common: {
        name: "room.distance",
        type: "number",
        role: "value",
        unit: "m",
        read: true,
        write: true
      },
      native: {}
    },
    absorption: {
      _id: "",
      type: "state",
      common: {
        name: "room.absorption",
        type: "number",
        role: "value",
        read: true,
        write: true
      },
      native: {}
    },
    tx_ref_rssi: {
      _id: "",
      type: "state",
      common: {
        name: "room.tx_ref_rssi",
        type: "number",
        role: "value",
        unit: "db",
        read: true,
        write: false
      },
      native: {}
    },
    rx_adj_rssi: {
      _id: "",
      type: "state",
      common: {
        name: "room.rx_adj_rssi",
        type: "number",
        role: "value",
        unit: "db",
        read: true,
        write: false
      },
      native: {}
    },
    include: {
      _id: "",
      type: "state",
      common: {
        name: "room.include",
        type: "string",
        role: "text",
        read: true,
        write: true
      },
      native: {}
    },
    count_ids: {
      _id: "",
      type: "state",
      common: {
        name: "room.count_ids",
        type: "string",
        role: "text",
        read: true,
        write: false
      },
      native: {}
    },
    arduino_ota: {
      _id: "",
      type: "state",
      common: {
        name: "room.arduino_ota",
        type: "boolean",
        role: "switch",
        read: true,
        write: true
      },
      native: {
        convert: 'val ? "ON" : "OFF"'
      }
    },
    auto_update: {
      _id: "",
      type: "state",
      common: {
        name: "room.auto_update",
        type: "boolean",
        role: "switch",
        read: true,
        write: true
      },
      native: {
        convert: 'val ? "ON" : "OFF"'
      }
    },
    prerelease: {
      _id: "",
      type: "state",
      common: {
        name: "room.prerelease",
        type: "boolean",
        role: "switch",
        read: true,
        write: true
      },
      native: {
        convert: 'val ? "ON" : "OFF"'
      }
    },
    motion: {
      _id: "",
      type: "state",
      common: {
        name: "room.motion",
        type: "boolean",
        role: "indicator",
        read: true,
        write: false
      },
      native: {}
    },
    switch: {
      _id: "",
      type: "state",
      common: {
        name: "room.switch",
        type: "boolean",
        role: "indicator",
        read: true,
        write: false
      },
      native: {}
    },
    button: {
      _id: "",
      type: "state",
      common: {
        name: "room.button",
        type: "boolean",
        role: "indicator",
        read: true,
        write: false
      },
      native: {}
    },
    pir_timeout: {
      _id: "",
      type: "state",
      common: {
        name: "room.pri_timeout",
        type: "number",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    },
    radar_timeout: {
      _id: "",
      type: "state",
      common: {
        name: "room.radar_timeout",
        type: "number",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    },
    switch_1_timeout: {
      _id: "",
      type: "state",
      common: {
        name: "room.switch_1_timeout",
        type: "number",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    },
    switch_2_timeout: {
      _id: "",
      type: "state",
      common: {
        name: "room.switch_2_timeout",
        type: "number",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    },
    button_1: {
      _id: "",
      type: "state",
      common: {
        name: "room.button_1",
        type: "boolean",
        role: "indicator",
        read: true,
        write: false
      },
      native: {}
    },
    button_1_timeout: {
      _id: "",
      type: "state",
      common: {
        name: "room.button_1_timeout",
        type: "number",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    },
    button_2_timeout: {
      _id: "",
      type: "state",
      common: {
        name: "room.button_2_timeout",
        type: "number",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    },
    led_1: {
      _channel: {
        _id: "",
        type: "channel",
        common: {
          name: "room.led_1.channel"
        },
        native: {}
      },
      state: {
        _id: "",
        type: "state",
        common: {
          name: "room.led_1.state",
          type: "boolean",
          role: "indicator",
          read: true,
          write: false
        },
        native: {}
      },
      brightness: {
        _id: "",
        type: "state",
        common: {
          name: "room.led_1.brightness",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      },
      color: {
        _channel: {
          _id: "",
          type: "channel",
          common: {
            name: "room.led_1.color.channel"
          },
          native: {}
        },
        r: {
          _id: "",
          type: "state",
          common: {
            name: "red",
            type: "number",
            role: "value",
            read: true,
            write: false
          },
          native: {}
        },
        g: {
          _id: "",
          type: "state",
          common: {
            name: "green",
            type: "number",
            role: "value",
            read: true,
            write: false
          },
          native: {}
        },
        b: {
          _id: "",
          type: "state",
          common: {
            name: "blue",
            type: "number",
            role: "value",
            read: true,
            write: false
          },
          native: {}
        }
      }
    },
    telemetry: {
      _channel: {
        _id: "",
        type: "channel",
        common: {
          name: "room.telemetry.channel"
        },
        native: {}
      },
      ip: {
        _id: "",
        type: "state",
        common: {
          name: "room.telemetry.ip",
          type: "string",
          role: "text",
          read: true,
          write: false
        },
        native: {}
      },
      uptime: {
        _id: "",
        type: "state",
        common: {
          name: "room.telemetry.uptime",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      },
      firm: {
        _id: "",
        type: "state",
        common: {
          name: "room.telemetry.firm",
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
          name: "room.telemetry.rssi",
          type: "number",
          role: "value",
          unit: "db",
          read: true,
          write: false
        },
        native: {}
      },
      ver: {
        _id: "",
        type: "state",
        common: {
          name: "room.telemetry.ver",
          type: "string",
          role: "text",
          read: true,
          write: false
        },
        native: {}
      },
      count: {
        _id: "",
        type: "state",
        common: {
          name: "room.telemetry.count",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      },
      adverts: {
        _id: "",
        type: "state",
        common: {
          name: "room.telemetry.adverts",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      },
      seen: {
        _id: "",
        type: "state",
        common: {
          name: "room.telemetry.seen",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      },
      reported: {
        _id: "",
        type: "state",
        common: {
          name: "room.telemetry.reported",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      },
      freeHeap: {
        _id: "",
        type: "state",
        common: {
          name: "room.telemetry.freeheap",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      },
      maxHeap: {
        _id: "",
        type: "state",
        common: {
          name: "room.telemetry.maxHeap",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      },
      scanStack: {
        _id: "",
        type: "state",
        common: {
          name: "room.telemetry.scanStack",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      },
      loopStack: {
        _id: "",
        type: "state",
        common: {
          name: "room.telemetry.loopStack",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      },
      bleStack: {
        _id: "",
        type: "state",
        common: {
          name: "room.telemetry.bleStack",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      }
    }
  },
  devices: {
    _channel: {
      _id: "",
      type: "device",
      common: {
        name: "devices.channel"
      },
      native: {}
    },
    mac: {
      _id: "",
      type: "state",
      common: {
        name: "devices.mac",
        type: "string",
        role: "text",
        read: true,
        write: false
      },
      native: {}
    },
    id: {
      _id: "",
      type: "state",
      common: {
        name: "devices.id",
        type: "string",
        role: "text",
        read: true,
        write: false
      },
      native: {}
    },
    name: {
      _id: "",
      type: "state",
      common: {
        name: "devices.name",
        type: "string",
        role: "text",
        read: true,
        write: false
      },
      native: {}
    },
    disc: {
      _id: "",
      type: "state",
      common: {
        name: "devices.disc",
        type: "string",
        role: "text",
        read: true,
        write: false
      },
      native: {}
    },
    idType: {
      _id: "",
      type: "state",
      common: {
        name: "devices.idType",
        type: "number",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    },
    "rssi@1m": {
      _id: "",
      type: "state",
      common: {
        name: "devices.rssi@1m",
        type: "number",
        role: "value",
        unit: "db",
        read: true,
        write: false
      },
      native: {}
    },
    rssi: {
      _id: "",
      type: "state",
      common: {
        name: "devices.rssi",
        type: "number",
        role: "value",
        unit: "db",
        read: true,
        write: false
      },
      native: {}
    },
    raw: {
      _id: "",
      type: "state",
      common: {
        name: "devices.raw",
        type: "number",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    },
    distance: {
      _id: "",
      type: "state",
      common: {
        name: "devices.distance",
        type: "number",
        role: "value",
        unit: "m",
        read: true,
        write: false
      },
      native: {}
    },
    int: {
      _id: "",
      type: "state",
      common: {
        name: "devices.int",
        type: "number",
        role: "value",
        read: true,
        write: false
      },
      native: {}
    },
    close: {
      _id: "",
      type: "state",
      common: {
        name: "devices.close",
        type: "boolean",
        role: "indicator",
        read: true,
        write: false
      },
      native: {}
    }
  },
  settings: {
    _channel: {
      _id: "",
      type: "channel",
      common: {
        name: "settings.channel"
      },
      native: {}
    },
    config: {
      _channel: {
        _id: "",
        type: "channel",
        common: {
          name: "settings.config.channel"
        },
        native: {}
      },
      id: {
        _id: "",
        type: "state",
        common: {
          name: "settings.config.id",
          type: "string",
          role: "text",
          read: true,
          write: false
        },
        native: {}
      },
      name: {
        _id: "",
        type: "state",
        common: {
          name: "devices.name",
          type: "string",
          role: "text",
          read: true,
          write: false
        },
        native: {}
      }
    }
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
const HMIOff = { red: 68, green: 115, blue: 158 };
const HMIOn = { red: 3, green: 169, blue: 244 };
const HMIDark = { red: 29, green: 29, blue: 29 };
const Off = { red: 253, green: 128, blue: 0 };
const On = { red: 253, green: 216, blue: 53 };
const MSRed = { red: 251, green: 105, blue: 98 };
const MSYellow = { red: 255, green: 235, blue: 156 };
const MSGreen = { red: 121, green: 222, blue: 121 };
const Red = { red: 255, green: 0, blue: 0 };
const White = { red: 255, green: 255, blue: 255 };
const Yellow = { red: 255, green: 255, blue: 0 };
const Green = { red: 0, green: 255, blue: 0 };
const Blue = { red: 0, green: 0, blue: 255 };
const DarkBlue = { red: 0, green: 0, blue: 136 };
const Gray = { red: 136, green: 136, blue: 136 };
const Black = { red: 0, green: 0, blue: 0 };
const Cyan = { red: 0, green: 255, blue: 255 };
const Magenta = { red: 255, green: 0, blue: 255 };
const colorSpotify = { red: 30, green: 215, blue: 96 };
const colorAlexa = { red: 49, green: 196, blue: 243 };
const colorSonos = { red: 216, green: 161, blue: 88 };
const colorRadio = { red: 255, green: 127, blue: 0 };
const BatteryFull = { red: 96, green: 176, blue: 62 };
const BatteryEmpty = { red: 179, green: 45, blue: 25 };
const Menu = { red: 150, green: 150, blue: 100 };
const MenuLowInd = { red: 255, green: 235, blue: 156 };
const MenuHighInd = { red: 251, green: 105, blue: 98 };
const colorScale0 = { red: 99, green: 190, blue: 123 };
const colorScale1 = { red: 129, green: 199, blue: 126 };
const colorScale2 = { red: 161, green: 208, blue: 127 };
const colorScale3 = { red: 129, green: 217, blue: 126 };
const colorScale4 = { red: 222, green: 226, blue: 131 };
const colorScale5 = { red: 254, green: 235, blue: 132 };
const colorScale6 = { red: 255, green: 210, blue: 129 };
const colorScale7 = { red: 251, green: 185, blue: 124 };
const colorScale8 = { red: 251, green: 158, blue: 117 };
const colorScale9 = { red: 248, green: 131, blue: 111 };
const colorScale10 = { red: 248, green: 105, blue: 107 };
const scbackground = { red: 0, green: 0, blue: 0 };
const scbackgroundInd1 = { red: 255, green: 0, blue: 0 };
const scbackgroundInd2 = { red: 121, green: 222, blue: 121 };
const scbackgroundInd3 = { red: 255, green: 255, blue: 0 };
const sctime = { red: 255, green: 255, blue: 255 };
const sctimeAMPM = { red: 255, green: 255, blue: 255 };
const scdate = { red: 255, green: 255, blue: 255 };
const sctMainIcon = { red: 255, green: 255, blue: 255 };
const sctMainText = { red: 255, green: 255, blue: 255 };
const sctForecast1 = { red: 255, green: 255, blue: 255 };
const sctForecast2 = { red: 255, green: 255, blue: 255 };
const sctForecast3 = { red: 255, green: 255, blue: 255 };
const sctForecast4 = { red: 255, green: 255, blue: 255 };
const sctF1Icon = { red: 255, green: 235, blue: 156 };
const sctF2Icon = { red: 255, green: 235, blue: 156 };
const sctF3Icon = { red: 255, green: 235, blue: 156 };
const sctF4Icon = { red: 255, green: 235, blue: 156 };
const sctForecast1Val = { red: 255, green: 255, blue: 255 };
const sctForecast2Val = { red: 255, green: 255, blue: 255 };
const sctForecast3Val = { red: 255, green: 255, blue: 255 };
const sctForecast4Val = { red: 255, green: 255, blue: 255 };
const scbar = { red: 255, green: 255, blue: 255 };
const sctMainIconAlt = { red: 255, green: 255, blue: 255 };
const sctMainTextAlt = { red: 255, green: 255, blue: 255 };
const sctTimeAdd = { red: 255, green: 255, blue: 255 };
const swClearNight = { red: 150, green: 150, blue: 100 };
const swCloudy = { red: 75, green: 75, blue: 75 };
const swExceptional = { red: 255, green: 50, blue: 50 };
const swFog = { red: 150, green: 150, blue: 150 };
const swHail = { red: 200, green: 200, blue: 200 };
const swLightning = { red: 200, green: 200, blue: 0 };
const swLightningRainy = { red: 200, green: 200, blue: 150 };
const swPartlycloudy = { red: 150, green: 150, blue: 150 };
const swPouring = { red: 50, green: 50, blue: 255 };
const swRainy = { red: 100, green: 100, blue: 255 };
const swSnowy = { red: 150, green: 150, blue: 150 };
const swSnowyRainy = { red: 150, green: 150, blue: 255 };
const swSunny = { red: 255, green: 255, blue: 0 };
const swWindy = { red: 150, green: 150, blue: 150 };
const autoCreateAlias = true;
const AliasPath = "alias.0." + NSPanel_Path.substring(13, NSPanel_Path.length);
const defaultOffColorParam = Off;
const defaultOnColorParam = On;
const defaultColorParam = Off;
const defaultBackgroundColorParam = HMIDark;
const Unlock_Service = {
  type: "cardUnlock",
  heading: findLocaleServMenu("service_pages"),
  useColor: true,
  items: [
    {
      id: "alias.0.NSPanel.Unlock",
      targetPage: "NSPanel_Service_SubPage",
      autoCreateALias: true
    }
  ]
};
const NSPanel_Service = {
  type: "cardEntities",
  heading: findLocaleServMenu("service_menu"),
  useColor: true,
  items: [
    {
      navigate: true,
      id: "NSPanel_Infos",
      icon: "information-outline",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("infos"),
      buttonText: findLocaleServMenu("more")
    },
    {
      navigate: true,
      id: "NSPanel_Einstellungen",
      icon: "monitor-edit",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("settings"),
      buttonText: findLocaleServMenu("more")
    },
    {
      navigate: true,
      id: "NSPanel_Firmware",
      icon: "update",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("firmware"),
      buttonText: findLocaleServMenu("more")
    },
    {
      id: AliasPath + "Config.rebootNSPanel",
      name: findLocaleServMenu("reboot"),
      icon: "refresh",
      offColor: MSRed,
      onColor: MSGreen,
      buttonText: findLocaleServMenu("start")
    }
  ]
};
const NSPanel_Service_SubPage = {
  type: "cardEntities",
  heading: findLocaleServMenu("service_menu"),
  useColor: true,
  subPage: true,
  parent: Unlock_Service,
  home: "Unlock_Service",
  items: [
    {
      navigate: true,
      id: "NSPanel_Infos",
      icon: "information-outline",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("infos"),
      buttonText: findLocaleServMenu("more")
    },
    {
      navigate: true,
      id: "NSPanel_Einstellungen",
      icon: "monitor-edit",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("settings"),
      buttonText: findLocaleServMenu("more")
    },
    {
      navigate: true,
      id: "NSPanel_Firmware",
      icon: "update",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("firmware"),
      buttonText: findLocaleServMenu("more")
    },
    {
      id: AliasPath + "Config.rebootNSPanel",
      name: findLocaleServMenu("reboot"),
      icon: "refresh",
      offColor: MSRed,
      onColor: MSGreen,
      buttonText: findLocaleServMenu("start")
    }
  ]
};
const NSPanel_Infos = {
  type: "cardEntities",
  heading: findLocaleServMenu("nspanel_infos"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Service,
  home: "NSPanel_Service",
  items: [
    {
      navigate: true,
      id: "NSPanel_Wifi_Info_1",
      icon: "wifi",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("wifi"),
      buttonText: findLocaleServMenu("more")
    },
    {
      navigate: true,
      id: "NSPanel_Sensoren",
      icon: "memory",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("sensors_hardware"),
      buttonText: findLocaleServMenu("more")
    },
    {
      navigate: true,
      id: "NSPanel_IoBroker",
      icon: "information-outline",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("info_iobroker"),
      buttonText: findLocaleServMenu("more")
    },
    {
      id: AliasPath + "Config.Update.UpdateMessage",
      name: findLocaleServMenu("update_message"),
      icon: "message-alert-outline",
      offColor: HMIOff,
      onColor: MSGreen
    }
  ]
};
const NSPanel_Wifi_Info_1 = {
  type: "cardEntities",
  heading: findLocaleServMenu("nspanel_wifi1"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Infos,
  next: "NSPanel_Wifi_Info_2",
  items: [
    {
      id: AliasPath + "ipAddress",
      name: findLocaleServMenu("ip_address"),
      icon: "ip-network-outline",
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Tasmota.Wifi.BSSId",
      name: findLocaleServMenu("mac_address"),
      icon: "check-network",
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Tasmota.Wifi.RSSI",
      name: findLocaleServMenu("rssi"),
      icon: "signal",
      unit: "%",
      colorScale: { val_min: 100, val_max: 0 }
    },
    {
      id: AliasPath + "Tasmota.Wifi.Signal",
      name: findLocaleServMenu("wifi_signal"),
      icon: "signal-distance-variant",
      unit: "dBm",
      colorScale: { val_min: 0, val_max: -100 }
    }
  ]
};
const NSPanel_Wifi_Info_2 = {
  type: "cardEntities",
  heading: findLocaleServMenu("nspanel_wifi2"),
  useColor: true,
  subPage: true,
  prev: "NSPanel_Wifi_Info_1",
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "Tasmota.Wifi.SSId",
      name: findLocaleServMenu("ssid"),
      icon: "signal-distance-variant",
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Tasmota.Wifi.Mode",
      name: findLocaleServMenu("mode"),
      icon: "signal-distance-variant",
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Tasmota.Wifi.Channel",
      name: findLocaleServMenu("channel"),
      icon: "timeline-clock-outline",
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Tasmota.Wifi.AP",
      name: findLocaleServMenu("accesspoint"),
      icon: "router-wireless-settings",
      offColor: Menu,
      onColor: Menu
    }
  ]
};
const NSPanel_Sensoren = {
  type: "cardEntities",
  heading: findLocaleServMenu("sensors1"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Infos,
  next: "NSPanel_Hardware",
  items: [
    {
      id: AliasPath + "Sensor.ANALOG.Temperature",
      name: findLocaleServMenu("room_temperature"),
      icon: "home-thermometer-outline",
      unit: "\xB0C",
      colorScale: { val_min: 0, val_max: 40, val_best: 22 }
    },
    {
      id: AliasPath + "Sensor.ESP32.Temperature",
      name: findLocaleServMenu("esp_temperature"),
      icon: "thermometer",
      unit: "\xB0C",
      colorScale: { val_min: 0, val_max: 100, val_best: 50 }
    },
    {
      id: AliasPath + "Sensor.TempUnit",
      name: findLocaleServMenu("temperature_unit"),
      icon: "temperature-celsius",
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Sensor.Time",
      name: findLocaleServMenu("refresh"),
      icon: "clock-check-outline",
      offColor: Menu,
      onColor: Menu
    }
  ]
};
const NSPanel_Hardware = {
  type: "cardEntities",
  heading: findLocaleServMenu("hardware2"),
  useColor: true,
  subPage: true,
  prev: "NSPanel_Sensoren",
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "Tasmota.Product",
      name: findLocaleServMenu("product"),
      icon: "devices",
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Tasmota.Hardware",
      name: findLocaleServMenu("esp32_hardware"),
      icon: "memory",
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Display.Model",
      name: findLocaleServMenu("nspanel_version"),
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Tasmota.Uptime",
      name: findLocaleServMenu("operating_time"),
      icon: "timeline-clock-outline",
      offColor: Menu,
      onColor: Menu
    }
  ]
};
const NSPanel_IoBroker = {
  type: "cardEntities",
  heading: findLocaleServMenu("info_iobroker"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Infos,
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "IoBroker.ScriptVersion",
      name: findLocaleServMenu("script_version_nspanelts"),
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "IoBroker.NodeJSVersion",
      name: findLocaleServMenu("nodejs_version"),
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "IoBroker.JavaScriptVersion",
      name: findLocaleServMenu("instance_javascript"),
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "IoBroker.ScriptName",
      name: findLocaleServMenu("scriptname"),
      offColor: Menu,
      onColor: Menu
    }
  ]
};
const NSPanel_Einstellungen = {
  type: "cardGrid",
  heading: findLocaleServMenu("settings"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Service,
  home: "NSPanel_Service",
  items: [
    {
      navigate: true,
      id: "NSPanel_Screensaver",
      icon: "monitor-dashboard",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("screensaver"),
      buttonText: findLocaleServMenu("more")
    },
    {
      navigate: true,
      id: "NSPanel_Relays",
      icon: "electric-switch",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("relays"),
      buttonText: findLocaleServMenu("more")
    },
    {
      id: AliasPath + "Config.temperatureUnitNumber",
      icon: "gesture-double-tap",
      name: findLocaleServMenu("temp_unit"),
      offColor: Menu,
      onColor: Menu,
      modeList: ["\xB0C", "\xB0F", "K"]
    },
    {
      id: AliasPath + "Config.localeNumber",
      icon: "select-place",
      name: findLocaleServMenu("language"),
      offColor: Menu,
      onColor: Menu,
      modeList: [
        "en-US",
        "de-DE",
        "nl-NL",
        "da-DK",
        "es-ES",
        "fr-FR",
        "it-IT",
        "ru-RU",
        "nb-NO",
        "nn-NO",
        "pl-PL",
        "pt-PT",
        "af-ZA",
        "ar-SY",
        "bg-BG",
        "ca-ES",
        "cs-CZ",
        "el-GR",
        "et-EE",
        "fa-IR",
        "fi-FI",
        "he-IL",
        "hr-xx",
        "hu-HU",
        "hy-AM",
        "id-ID",
        "is-IS",
        "lb-xx",
        "lt-LT",
        "ro-RO",
        "sk-SK",
        "sl-SI",
        "sv-SE",
        "th-TH",
        "tr-TR",
        "uk-UA",
        "vi-VN",
        "zh-CN",
        "zh-TW"
      ]
    },
    {
      navigate: true,
      id: "NSPanel_Script",
      icon: "code-json",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("script"),
      buttonText: findLocaleServMenu("more")
    }
  ]
};
const NSPanel_Screensaver = {
  type: "cardGrid",
  heading: findLocaleServMenu("screensaver"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Einstellungen,
  home: "NSPanel_Service",
  items: [
    {
      navigate: true,
      id: "NSPanel_ScreensaverDimmode",
      icon: "sun-clock",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("dimmode")
    },
    {
      navigate: true,
      id: "NSPanel_ScreensaverBrightness",
      icon: "brightness-5",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("brightness")
    },
    {
      navigate: true,
      id: "NSPanel_ScreensaverLayout",
      icon: "page-next-outline",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("layout")
    },
    {
      navigate: true,
      id: "NSPanel_ScreensaverWeather",
      icon: "weather-partly-rainy",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("weather")
    },
    {
      navigate: true,
      id: "NSPanel_ScreensaverDateformat",
      icon: "calendar-expand-horizontal",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("date_format")
    },
    {
      navigate: true,
      id: "NSPanel_ScreensaverIndicators",
      icon: "monitor-edit",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("indicators")
    }
  ]
};
const NSPanel_ScreensaverDimmode = {
  type: "cardEntities",
  heading: findLocaleServMenu("dimmode"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Screensaver,
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "Dimmode.brightnessDay",
      name: findLocaleServMenu("brightness_day"),
      icon: "brightness-5",
      offColor: Menu,
      onColor: Menu,
      minValue: 5,
      maxValue: 10
    },
    {
      id: AliasPath + "Dimmode.brightnessNight",
      name: findLocaleServMenu("brightness_night"),
      icon: "brightness-4",
      offColor: Menu,
      onColor: Menu,
      minValue: 0,
      maxValue: 4
    },
    {
      id: AliasPath + "Dimmode.hourDay",
      name: findLocaleServMenu("hour_day"),
      icon: "sun-clock",
      offColor: Menu,
      onColor: Menu,
      minValue: 0,
      maxValue: 23
    },
    {
      id: AliasPath + "Dimmode.hourNight",
      name: findLocaleServMenu("hour_night"),
      icon: "sun-clock-outline",
      offColor: Menu,
      onColor: Menu,
      minValue: 0,
      maxValue: 23
    }
  ]
};
const NSPanel_ScreensaverBrightness = {
  type: "cardEntities",
  heading: findLocaleServMenu("brightness"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Screensaver,
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "ScreensaverInfo.activeBrightness",
      name: findLocaleServMenu("brightness_activ"),
      icon: "brightness-5",
      offColor: Menu,
      onColor: Menu,
      minValue: 20,
      maxValue: 100
    },
    {
      id: AliasPath + "Config.Screensaver.timeoutScreensaver",
      name: findLocaleServMenu("screensaver_timeout"),
      icon: "clock-end",
      offColor: Menu,
      onColor: Menu,
      minValue: 0,
      maxValue: 60
    },
    {
      id: AliasPath + "Config.Screensaver.screenSaverDoubleClick",
      name: findLocaleServMenu("wakeup_doublecklick"),
      icon: "gesture-two-double-tap",
      offColor: HMIOff,
      onColor: HMIOn
    }
  ]
};
const NSPanel_ScreensaverLayout = {
  type: "cardEntities",
  heading: findLocaleServMenu("layout"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Screensaver,
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "Config.Screensaver.alternativeScreensaverLayout",
      name: findLocaleServMenu("alternative_layout"),
      icon: "page-previous-outline",
      offColor: HMIOff,
      onColor: HMIOn
    },
    {
      id: AliasPath + "Config.Screensaver.ScreensaverAdvanced",
      name: findLocaleServMenu("advanced_layout"),
      icon: "page-next-outline",
      offColor: HMIOff,
      onColor: HMIOn
    }
  ]
};
const NSPanel_ScreensaverWeather = {
  type: "cardEntities",
  heading: findLocaleServMenu("weather_parameters"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Screensaver,
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "ScreensaverInfo.weatherForecast",
      name: findLocaleServMenu("weather_forecast_offon"),
      icon: "weather-sunny-off",
      offColor: HMIOff,
      onColor: HMIOn
    },
    {
      id: AliasPath + "ScreensaverInfo.weatherForecastTimer",
      name: findLocaleServMenu("weather_forecast_change_switch"),
      icon: "devices",
      offColor: HMIOff,
      onColor: HMIOn
    },
    {
      id: AliasPath + "ScreensaverInfo.entityChangeTime",
      name: findLocaleServMenu("weather_forecast_change_time"),
      icon: "cog-sync",
      offColor: Menu,
      onColor: Menu,
      minValue: 15,
      maxValue: 60
    },
    {
      id: AliasPath + "Config.Screensaver.autoWeatherColorScreensaverLayout",
      name: findLocaleServMenu("weather_forecast_icon_colors"),
      icon: "format-color-fill",
      offColor: HMIOff,
      onColor: HMIOn
    }
  ]
};
const NSPanel_ScreensaverDateformat = {
  type: "cardEntities",
  heading: findLocaleServMenu("date_format"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Screensaver,
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "Config.Dateformat.Switch.weekday",
      name: findLocaleServMenu("weekday_large"),
      icon: "calendar-expand-horizontal",
      offColor: HMIOff,
      onColor: HMIOn
    },
    {
      id: AliasPath + "Config.Dateformat.Switch.month",
      name: findLocaleServMenu("month_large"),
      icon: "calendar-expand-horizontal",
      offColor: HMIOff,
      onColor: HMIOn
    }
  ]
};
const NSPanel_ScreensaverIndicators = {
  type: "cardEntities",
  heading: findLocaleServMenu("indicators"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Screensaver,
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "Config.MRIcons.alternateMRIconSize.1",
      name: findLocaleServMenu("mr_icon1_size"),
      icon: "format-size",
      offColor: HMIOff,
      onColor: HMIOn
    },
    {
      id: AliasPath + "Config.MRIcons.alternateMRIconSize.2",
      name: findLocaleServMenu("mr_icon2_size"),
      icon: "format-size",
      offColor: HMIOff,
      onColor: HMIOn
    }
  ]
};
const NSPanel_Relays = {
  type: "cardEntities",
  heading: findLocaleServMenu("relays"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Einstellungen,
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "Relay.1",
      name: findLocaleServMenu("relay1_onoff"),
      icon: "power",
      offColor: HMIOff,
      onColor: HMIOn
    },
    {
      id: AliasPath + "Relay.2",
      name: findLocaleServMenu("relay2_onoff"),
      icon: "power",
      offColor: HMIOff,
      onColor: HMIOn
    }
  ]
};
const NSPanel_Script = {
  type: "cardEntities",
  heading: findLocaleServMenu("script"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Einstellungen,
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "Config.ScripgtDebugStatus",
      name: findLocaleServMenu("debugmode_offon"),
      icon: "code-tags-check",
      offColor: HMIOff,
      onColor: HMIOn
    },
    {
      id: AliasPath + "Config.MQTT.portCheck",
      name: findLocaleServMenu("port_check_offon"),
      icon: "check-network",
      offColor: HMIOff,
      onColor: HMIOn
    }
  ]
};
const NSPanel_Firmware = {
  type: "cardEntities",
  heading: findLocaleServMenu("firmware"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Service,
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "autoUpdate",
      name: findLocaleServMenu("automatically_updates"),
      icon: "power",
      offColor: HMIOff,
      onColor: HMIOn
    },
    {
      navigate: true,
      id: "NSPanel_FirmwareTasmota",
      icon: "usb-flash-drive",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("tasmota_firmware"),
      buttonText: findLocaleServMenu("more")
    },
    {
      navigate: true,
      id: "NSPanel_FirmwareBerry",
      icon: "usb-flash-drive",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("berry_driver"),
      buttonText: findLocaleServMenu("more")
    },
    {
      navigate: true,
      id: "NSPanel_FirmwareNextion",
      icon: "cellphone-cog",
      offColor: Menu,
      onColor: Menu,
      name: findLocaleServMenu("nextion_tft_firmware"),
      buttonText: findLocaleServMenu("more")
    }
  ]
};
const NSPanel_FirmwareTasmota = {
  type: "cardEntities",
  heading: findLocaleServMenu("tasmota"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Firmware,
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "Tasmota.Version",
      name: findLocaleServMenu("installed_release"),
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Tasmota_Firmware.onlineVersion",
      name: findLocaleServMenu("available_release"),
      offColor: Menu,
      onColor: Menu
    },
    { id: "Divider" },
    {
      id: AliasPath + "Config.Update.UpdateTasmota",
      name: findLocaleServMenu("update_tasmota"),
      icon: "refresh",
      offColor: HMIOff,
      onColor: MSGreen,
      buttonText: findLocaleServMenu("start")
    }
  ]
};
const NSPanel_FirmwareBerry = {
  type: "cardEntities",
  heading: findLocaleServMenu("berry_driver"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Firmware,
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "Display.BerryDriver",
      name: findLocaleServMenu("installed_release"),
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Berry_Driver.onlineVersion",
      name: findLocaleServMenu("available_release"),
      offColor: Menu,
      onColor: Menu
    },
    { id: "Divider" },
    {
      id: AliasPath + "Config.Update.UpdateBerry",
      name: findLocaleServMenu("update_berry_driver"),
      icon: "refresh",
      offColor: HMIOff,
      onColor: MSGreen,
      buttonText: findLocaleServMenu("start")
    }
  ]
};
const NSPanel_FirmwareNextion = {
  type: "cardEntities",
  heading: findLocaleServMenu("nextion_tft"),
  useColor: true,
  subPage: true,
  parent: NSPanel_Firmware,
  home: "NSPanel_Service",
  items: [
    {
      id: AliasPath + "Display_Firmware.TFT.currentVersion",
      name: findLocaleServMenu("installed_release"),
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Display_Firmware.TFT.desiredVersion",
      name: findLocaleServMenu("desired_release"),
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Display.Model",
      name: findLocaleServMenu("nspanel_model"),
      offColor: Menu,
      onColor: Menu
    },
    {
      id: AliasPath + "Config.Update.UpdateNextion",
      name: "Nextion TFT Update",
      icon: "refresh",
      offColor: HMIOff,
      onColor: MSGreen,
      buttonText: findLocaleServMenu("start")
    }
  ]
};
const config = {
  pages: [
    NSPanel_Service
  ],
  subPages: [
    NSPanel_Service_SubPage,
    NSPanel_Infos,
    NSPanel_Wifi_Info_1,
    NSPanel_Wifi_Info_2,
    NSPanel_Sensoren,
    NSPanel_Hardware,
    NSPanel_IoBroker,
    NSPanel_Einstellungen,
    NSPanel_Screensaver,
    NSPanel_ScreensaverDimmode,
    NSPanel_ScreensaverBrightness,
    NSPanel_ScreensaverLayout,
    NSPanel_ScreensaverWeather,
    NSPanel_ScreensaverDateformat,
    NSPanel_ScreensaverIndicators,
    NSPanel_Relays,
    NSPanel_Script,
    NSPanel_Firmware,
    NSPanel_FirmwareTasmota,
    NSPanel_FirmwareBerry,
    NSPanel_FirmwareNextion
  ],
  leftScreensaverEntity: [],
  bottomScreensaverEntity: [
    {
      ScreensaverEntity: "accuweather.0.Daily.Day1.Sunrise",
      ScreensaverEntityFactor: 1,
      ScreensaverEntityDecimalPlaces: 0,
      ScreensaverEntityDateFormat: { hour: "2-digit", minute: "2-digit" },
      ScreensaverEntityIconOn: "weather-sunset-up",
      ScreensaverEntityIconOff: null,
      ScreensaverEntityText: "Sonne",
      ScreensaverEntityUnitText: "%",
      ScreensaverEntityIconColor: MSYellow
    },
    {
      ScreensaverEntity: "accuweather.0.Current.WindSpeed",
      ScreensaverEntityFactor: 1e3 / 3600,
      ScreensaverEntityDecimalPlaces: 1,
      ScreensaverEntityIconOn: "weather-windy",
      ScreensaverEntityIconOff: null,
      ScreensaverEntityText: "Wind",
      ScreensaverEntityUnitText: "m/s",
      ScreensaverEntityIconColor: { val_min: 0, val_max: 120 }
    },
    {
      ScreensaverEntity: "accuweather.0.Current.WindGust",
      ScreensaverEntityFactor: 1e3 / 3600,
      ScreensaverEntityDecimalPlaces: 1,
      ScreensaverEntityIconOn: "weather-tornado",
      ScreensaverEntityIconOff: null,
      ScreensaverEntityText: "B\xF6en",
      ScreensaverEntityUnitText: "m/s",
      ScreensaverEntityIconColor: { val_min: 0, val_max: 120 }
    },
    {
      ScreensaverEntity: "accuweather.0.Current.WindDirectionText",
      ScreensaverEntityFactor: 1,
      ScreensaverEntityDecimalPlaces: 0,
      ScreensaverEntityIconOn: "windsock",
      ScreensaverEntityIconOff: null,
      ScreensaverEntityText: "Windr.",
      ScreensaverEntityUnitText: "\xB0",
      ScreensaverEntityIconColor: White
    },
    {
      ScreensaverEntity: "accuweather.0.Current.RelativeHumidity",
      ScreensaverEntityFactor: 1,
      ScreensaverEntityDecimalPlaces: 1,
      ScreensaverEntityIconOn: "water-percent",
      ScreensaverEntityIconOff: null,
      ScreensaverEntityText: "Feuchte",
      ScreensaverEntityUnitText: "%",
      ScreensaverEntityIconColor: { val_min: 0, val_max: 100, val_best: 65 }
    },
    {
      ScreensaverEntity: NSPanel_Path + "Relay.1",
      ScreensaverEntityIconOn: "coach-lamp-variant",
      ScreensaverEntityText: "Street",
      ScreensaverEntityOnColor: Yellow,
      ScreensaverEntityOffColor: White,
      ScreensaverEntityOnText: "Is ON",
      ScreensaverEntityOffText: "Not ON"
    }
  ],
  indicatorScreensaverEntity: [],
  mrIcon1ScreensaverEntity: {
    ScreensaverEntity: NSPanel_Path + "Relay.1",
    ScreensaverEntityIconOn: "lightbulb",
    ScreensaverEntityIconOff: null,
    ScreensaverEntityValue: null,
    ScreensaverEntityValueDecimalPlace: 0,
    ScreensaverEntityValueUnit: null,
    ScreensaverEntityOnColor: On,
    ScreensaverEntityOffColor: HMIOff
  },
  mrIcon2ScreensaverEntity: {
    ScreensaverEntity: NSPanel_Path + "Relay.2",
    ScreensaverEntityIconOn: "lightbulb",
    ScreensaverEntityIconOff: null,
    ScreensaverEntityValue: null,
    ScreensaverEntityValueDecimalPlace: 0,
    ScreensaverEntityValueUnit: null,
    ScreensaverEntityOnColor: On,
    ScreensaverEntityOffColor: HMIOff
  },
  button1: {
    mode: null,
    page: null,
    entity: null,
    setValue: null
  },
  button2: {
    mode: null,
    page: null,
    entity: null,
    setValue: null
  },
  panelRecvTopic: NSPanelReceiveTopic,
  panelSendTopic: NSPanelSendTopic,
  weatherEntity: weatherEntityPath,
  defaultOffColor: defaultOffColorParam,
  defaultOnColor: defaultOnColorParam,
  defaultColor: defaultColorParam,
  defaultBackgroundColor: defaultBackgroundColorParam
};
const scriptVersion = "v4.3.3.33";
const tft_version = "v4.3.3";
const desired_display_firmware_version = 53;
const berry_driver_version = 9;
const tasmotaOtaUrl = "http://ota.tasmota.com/tasmota32/release/";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AliasPath,
  BatteryEmpty,
  BatteryFull,
  Black,
  Blue,
  Cyan,
  DarkBlue,
  Debug,
  Defaults,
  Gray,
  Green,
  HMIDark,
  HMIOff,
  HMIOn,
  MSGreen,
  MSRed,
  MSYellow,
  Magenta,
  Menu,
  MenuHighInd,
  MenuLowInd,
  NSPanelReceiveTopic,
  NSPanelSendTopic,
  NSPanel_Alarm_Path,
  NSPanel_Einstellungen,
  NSPanel_Firmware,
  NSPanel_FirmwareBerry,
  NSPanel_FirmwareNextion,
  NSPanel_FirmwareTasmota,
  NSPanel_Hardware,
  NSPanel_Infos,
  NSPanel_IoBroker,
  NSPanel_Path,
  NSPanel_Relays,
  NSPanel_Screensaver,
  NSPanel_ScreensaverBrightness,
  NSPanel_ScreensaverDateformat,
  NSPanel_ScreensaverDimmode,
  NSPanel_ScreensaverIndicators,
  NSPanel_ScreensaverLayout,
  NSPanel_ScreensaverWeather,
  NSPanel_Script,
  NSPanel_Sensoren,
  NSPanel_Service,
  NSPanel_Service_SubPage,
  NSPanel_Wifi_Info_1,
  NSPanel_Wifi_Info_2,
  Off,
  On,
  Red,
  Unlock_Service,
  White,
  Yellow,
  autoCreateAlias,
  berry_driver_version,
  colorAlexa,
  colorRadio,
  colorScale0,
  colorScale1,
  colorScale10,
  colorScale2,
  colorScale3,
  colorScale4,
  colorScale5,
  colorScale6,
  colorScale7,
  colorScale8,
  colorScale9,
  colorSonos,
  colorSpotify,
  config,
  defaultBackgroundColorParam,
  defaultChannel,
  defaultColorParam,
  defaultOffColorParam,
  defaultOnColorParam,
  desired_display_firmware_version,
  genericStateObjects,
  scbackground,
  scbackgroundInd1,
  scbackgroundInd2,
  scbackgroundInd3,
  scbar,
  scdate,
  scriptVersion,
  sctF1Icon,
  sctF2Icon,
  sctF3Icon,
  sctF4Icon,
  sctForecast1,
  sctForecast1Val,
  sctForecast2,
  sctForecast2Val,
  sctForecast3,
  sctForecast3Val,
  sctForecast4,
  sctForecast4Val,
  sctMainIcon,
  sctMainIconAlt,
  sctMainText,
  sctMainTextAlt,
  sctTimeAdd,
  sctime,
  sctimeAMPM,
  statesObjects,
  swClearNight,
  swCloudy,
  swExceptional,
  swFog,
  swHail,
  swLightning,
  swLightningRainy,
  swPartlycloudy,
  swPouring,
  swRainy,
  swSnowy,
  swSnowyRainy,
  swSunny,
  swWindy,
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
