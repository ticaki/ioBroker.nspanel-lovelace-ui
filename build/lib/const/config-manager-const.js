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
var config_manager_const_exports = {};
__export(config_manager_const_exports, {
  CustomTemplates: () => CustomTemplates,
  defaultConfig: () => defaultConfig,
  isConfig: () => isConfig,
  requiredFeatureDatapoints: () => requiredFeatureDatapoints,
  requiredScriptDataPoints: () => requiredScriptDataPoints
});
module.exports = __toCommonJS(config_manager_const_exports);
const CustomTemplates = [
  {
    device: "shutter",
    states: [
      { "button.open.blind": true },
      { "button.close.blind": true },
      { "button.open.tilt": true },
      { "button.close.tilt": true },
      { "button.stop.tilt": true },
      { "button.stop.blind": true },
      { "level.blind": true }
    ]
  }
];
function isConfig(F) {
  if (F === void 0) {
    return false;
  }
  const requiredFields = [
    "panelTopic",
    "weatherEntity",
    "defaultColor",
    "defaultOnColor",
    "defaultOffColor",
    "defaultBackgroundColor",
    "pages",
    "subPages",
    "button1",
    "button2",
    "bottomScreensaverEntity"
  ];
  for (const field of requiredFields) {
    if (F[field] === void 0) {
      return false;
    }
  }
  return true;
}
const defaultConfig = {
  version: "0",
  panelTopic: "",
  weatherEntity: "",
  bottomScreensaverEntity: [],
  defaultColor: {
    red: 0,
    green: 0,
    blue: 0
  },
  defaultOnColor: {
    red: 0,
    green: 0,
    blue: 0
  },
  defaultOffColor: {
    red: 0,
    green: 0,
    blue: 0
  },
  defaultBackgroundColor: {
    red: 0,
    green: 0,
    blue: 0
  },
  pages: [],
  subPages: [],
  button1: {
    mode: null,
    page: null,
    entity: null,
    setValue: null,
    setOn: void 0,
    setOff: void 0
  },
  button2: {
    mode: null,
    page: null,
    entity: null,
    setValue: null,
    setOn: void 0,
    setOff: void 0
  },
  leftScreensaverEntity: [],
  indicatorScreensaverEntity: [],
  mrIcon1ScreensaverEntity: {
    type: "script",
    ScreensaverEntity: null,
    ScreensaverEntityIconOn: null,
    ScreensaverEntityIconSelect: void 0,
    ScreensaverEntityIconOff: null,
    ScreensaverEntityValue: null,
    ScreensaverEntityValueDecimalPlace: null,
    ScreensaverEntityValueUnit: null,
    ScreensaverEntityOnColor: {
      red: 0,
      green: 0,
      blue: 0
    },
    ScreensaverEntityOffColor: {
      red: 0,
      green: 0,
      blue: 0
    }
  },
  mrIcon2ScreensaverEntity: {
    type: "script",
    ScreensaverEntity: null,
    ScreensaverEntityIconOn: null,
    ScreensaverEntityIconSelect: void 0,
    ScreensaverEntityIconOff: null,
    ScreensaverEntityValue: null,
    ScreensaverEntityValueDecimalPlace: null,
    ScreensaverEntityValueUnit: null,
    ScreensaverEntityOnColor: {
      red: 0,
      green: 0,
      blue: 0
    },
    ScreensaverEntityOffColor: {
      red: 0,
      green: 0,
      blue: 0
    }
  }
};
const requiredScriptDataPoints = {
  motion: {
    name: "motion",
    description: "Status of the motion sensor or presence detector (motion or presence detected)",
    data: { ACTUAL: { role: "sensor.motion", type: "boolean", required: true, writeable: false } }
  },
  //läuft im Script mit unter RGBsingle, muss nochmal geprüft werden ob sinnvoll
  /* cie: {
      name: 'cie',
      description: '',
      data: {
          CIE: { role: 'level.color.cie', type: 'string', required: true, writeable: true },
          DIMMER: { role: 'level.dimmer', type: 'boolean', required: true, writeable: true },
          ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
          ON_ACTUAL: { role: 'sensor.light', type: 'boolean', required: true, writeable: false },
          TEMPERATURE: { role: 'level.color.temperature', type: 'number', required: true, writeable: true },
      },
  }, */
  dimmer: {
    name: "dimmer",
    description: "Licht ein- / ausschalten und dimmen",
    data: {
      SET: { role: "level.dimmer", type: "number", required: true, writeable: true },
      ACTUAL: { role: "value.dimmer", type: "number", required: true, writeable: false },
      ON_SET: { role: "switch.light", type: "boolean", required: true, writeable: true },
      ON_ACTUAL: { role: "sensor.light", type: "boolean", required: true, writeable: false },
      VALUE: { role: "state", type: "number", required: false, writeable: true }
      //für popupInSel
    }
  },
  timeTable: {
    name: "timeTable",
    description: "F\xFCr die Anzeige der Abfahrtstafel / Route des Fahrplanadapters",
    data: {
      ACTUAL: { role: "state", type: "string", required: true, writeable: false },
      VEHICLE: { role: "state", type: "string", required: true, writeable: false },
      DIRECTION: { role: "state", type: "string", required: true, writeable: false },
      DELAY: { role: "state", type: "boolean", required: true, writeable: false }
    }
  },
  ct: {
    name: "ct",
    description: "f\xFCr Lampen die das wei\xDFe Licht zwischen kalt und warm \xE4ndern k\xF6nnen",
    data: {
      DIMMER: { role: "level.dimmer", type: "number", required: false, writeable: true },
      ON: { role: "switch.light", type: "boolean", required: true, writeable: true },
      ON_ACTUAL: { role: "sensor.light", type: "boolean", required: true, writeable: false },
      TEMPERATURE: { role: "level.color.temperature", type: "number", required: true, writeable: true },
      VALUE: { role: "state", type: "number", required: false, writeable: true }
      //für popupInSel
    }
  },
  window: {
    name: "window",
    description: "",
    data: {
      ACTUAL: { role: "sensor.window", type: "boolean", required: true, writeable: false },
      COLORDEC: { role: "state", type: "number", required: false, writeable: false },
      //Farbcode über DP steuern
      BUTTONTEXT: { role: ["state", "text"], type: "string", required: false, writeable: false }
      //Button-Text über DP steuern
    }
  },
  humidity: {
    name: "humidity",
    description: "",
    data: { ACTUAL: { role: "value.humidity", type: "number", required: true, writeable: false } }
  },
  hue: {
    name: "hue",
    description: "",
    data: {
      DIMMER: { role: "level.dimmer", type: "number", required: false, writeable: true },
      ON: { role: "switch.light", type: "boolean", required: true, writeable: true },
      ON_ACTUAL: { role: "sensor.light", type: "boolean", required: true, writeable: false },
      TEMPERATURE: { role: "level.color.temperature", type: "number", required: false, writeable: true },
      HUE: { role: "level.color.hue", type: "number", required: true, writeable: true },
      VALUE: { role: "state", type: "number", required: false, writeable: true }
      //für popupInSel
    }
  },
  info: {
    name: "info",
    description: "Universal Datenpunkt f\xFCr diverse Anwendungen",
    data: {
      ACTUAL: { role: "state", type: "mixed", required: true, writeable: false },
      COLORDEC: { role: "state", type: "number", required: false, writeable: false },
      //Farbcode über DP senden
      BUTTONTEXT: { role: ["state", "text"], type: "string", required: false, writeable: false },
      //Button-Text über DP senden bei cardEntity
      USERICON: { role: "state", type: "string", required: false, writeable: false }
      //Benutzerdefinierte Iconnamen über DP senden
    }
  },
  blind: {
    name: "blind",
    description: "",
    data: {
      ACTUAL: { role: "value.blind", type: "number", required: true, writeable: false },
      SET: { role: "level.blind", type: "number", required: true, writeable: true },
      CLOSE: { role: "button.close.blind", type: "boolean", required: true, writeable: true },
      OPEN: { role: "button.open.blind", type: "boolean", required: true, writeable: true },
      STOP: { role: "button.stop.blind", type: "boolean", required: true, writeable: true },
      TILT_ACTUAL: { role: "value.tilt", type: "number", required: false, writeable: false },
      TILT_SET: { role: "level.tilt", type: "number", required: false, writeable: true },
      TILT_CLOSE: { role: "button.close.tilt", type: "boolean", required: false, writeable: true },
      TILT_OPEN: { role: "button.open.tilt", type: "boolean", required: false, writeable: true },
      TILT_STOP: { role: "button.stop.tilt", type: "boolean", required: false, writeable: true }
    }
  },
  airCondition: {
    name: "airCondition",
    description: "",
    data: {
      ACTUAL: { role: "value.temperature", type: "number", required: true, writeable: false },
      SET: { role: "level.temperature", type: "number", required: true, writeable: true },
      SET2: { role: "level.temperature", type: "number", required: true, writeable: true },
      AUTO: { role: "state", type: "boolean", required: false, writeable: false },
      COOL: { role: "state", type: "boolean", required: false, writeable: false },
      BOOST: { role: "switch.mode.boost", type: "boolean", required: false, writeable: true },
      ERROR: { role: "indicator.error", type: "boolean", required: false, writeable: false },
      HEAT: { role: "state", type: "boolean", required: false, writeable: false },
      HUMINITY: { role: "value.humidity", type: "number", required: false, writeable: false },
      MAINTAIN: { role: "indicator.maintenance", type: "boolean", required: false, writeable: false },
      MODE: { role: "level.mode.airconditioner", type: "number", required: true, writeable: true },
      OFF: { role: "state", type: "boolean", required: true, writeable: false },
      POWER: { role: "switch.power", type: "boolean", required: false, writeable: true },
      SPEED: { role: "level.mode.fan", type: "number", required: false, writeable: true },
      SWING: { role: "switch.mode.swing", type: "boolean", required: false, writeable: true },
      UNREACH: { role: "indicator.maintenance", type: "boolean", required: false, writeable: false }
    }
  },
  socket: {
    name: "socket",
    description: "Steckdosen, Schalter, Relais, usw. schalten",
    data: {
      ACTUAL: { role: "switch", type: "boolean", required: true, writeable: false },
      SET: { role: "switch", type: "boolean", required: false, writeable: true },
      COLORDEC: { role: "state", type: "number", required: false, writeable: false },
      //Farbcode über DP steuern
      BUTTONTEXT: { role: ["state", "text"], type: "string", required: false, writeable: false },
      //Button-Text über DP steuern bei cardEntity
      STATE: { role: "state", type: "boolean", required: false, writeable: true }
      // für monobutton
    }
  },
  light: {
    name: "light",
    description: "ein Lichtschalter",
    data: {
      ACTUAL: { role: "sensor.light", type: "boolean", required: true, writeable: false },
      SET: { role: "switch.light", type: "boolean", required: true, writeable: true },
      COLORDEC: { role: "state", type: "number", required: false, writeable: false },
      //Farbcode über DP steuern
      BUTTONTEXT: { role: ["state", "text"], type: "string", required: false, writeable: false },
      //Button-Text über DP steuern bei cardEntity
      VALUE: { role: "state", type: "number", required: false, writeable: true }
      //für popupInSel
    }
  },
  volume: {
    name: "volume",
    description: "",
    data: {
      ACTUAL: { role: "value.volume", type: "number", required: true, writeable: false },
      SET: { role: "level.volume", type: "number", required: true, writeable: true },
      MUTE: { role: "media.mute", type: "boolean", required: true, writeable: true }
    }
  },
  rgb: {
    name: "rgb",
    description: "Farblicht mit einzelnen Farbkan\xE4len",
    data: {
      RED: { role: "level.color.red", type: "number", required: true, writeable: true },
      GREEN: { role: "level.color.green", type: "number", required: true, writeable: true },
      BLUE: { role: "level.color.blue", type: "number", required: true, writeable: true },
      ON_ACTUAL: { role: "sensor.light", type: "boolean", required: true, writeable: false },
      ON: { role: "switch.light", type: "boolean", required: true, writeable: true },
      DIMMER: { role: "level.dimmer", type: "number", required: false, writeable: true },
      TEMPERATURE: { role: "level.color.temperature", type: "number", required: false, writeable: true },
      WHITE: { role: "level.color.white", type: "number", required: false, writeable: true },
      VALUE: { role: "state", type: "number", required: false, writeable: true }
      //für popupInSel
    }
  },
  rgbSingle: {
    name: "rgbSingle",
    description: "Farblicht ohne Farbkan\xE4le",
    data: {
      RGB: { role: "level.color.rgb", type: "string", required: true, writeable: true },
      ON: { role: "switch.light", type: "boolean", required: true, writeable: true },
      DIMMER: { role: "level.dimmer", type: "number", required: false, writeable: true },
      TEMPERATURE: { role: "level.color.temperature", type: "number", required: false, writeable: true },
      ON_ACTUAL: { role: "sensor.light", type: "boolean", required: true, writeable: false },
      VALUE: { role: "state", type: "number", required: false, writeable: true }
      //für popupInSel
    }
  },
  slider: {
    name: "slider",
    description: "Slider to set a numerical value",
    data: {
      SET: { role: "level", type: "number", required: true, writeable: true },
      ACTUAL: { role: "value", type: "number", required: true, writeable: false }
    }
  },
  button: {
    name: "button",
    description: "Switch",
    data: { SET: { role: "button", type: "boolean", required: true, writeable: true } }
  },
  buttonSensor: {
    name: "buttonSensor",
    description: "Taster",
    data: { ACTUAL: { role: "button.press", type: "boolean", required: true, writeable: true } }
  },
  temperature: {
    name: "temperature",
    description: "",
    data: {
      ACTUAL: { role: "value.temperature", type: "number", required: true, writeable: false },
      SECOND: { role: "value.humidity", type: "number", required: false, writeable: false }
    }
  },
  "value.temperature": {
    name: "value.temperature",
    description: "",
    data: {
      ACTUAL: { role: "value.temperature", type: "number", required: true, writeable: false },
      SECOND: { role: "value.humidity", type: "number", required: false, writeable: false },
      USERICON: { role: "state", type: "string", required: false, writeable: false }
      // benutzerdefinierter Iconname über DP senden
    }
  },
  thermostat: {
    name: "thermostat",
    description: "",
    data: {
      ACTUAL: { role: "value.temperature", type: "number", required: true, writeable: false },
      SET: { role: "level.temperature", type: "number", required: true, writeable: true },
      MODE: { role: "level.mode.thermostat", type: "number", required: true, writeable: true },
      BOOST: { role: "switch.mode.boost", type: "boolean", required: false, writeable: true },
      AUTOMATIC: { role: "state", type: "boolean", required: true },
      ERROR: { role: "indicator.error", type: "boolean", required: false, writeable: false },
      LOWBAT: { role: "indicator.maintenance.lowbat", type: "boolean", required: false, writeable: false },
      MANUAL: { role: "state", type: "boolean", required: false },
      UNREACH: { role: "indicator.maintenance.unreach", type: "boolean", required: false, writeable: false },
      HUMINITY: { role: "value.humidity", type: "number", required: false, writeable: false },
      MAINTAIN: { role: "indicator.maintenance", type: "boolean", required: false, writeable: false },
      PARTY: { role: "switch.mode.party", type: "boolean", required: false },
      POWER: { role: "switch.power", type: "boolean", required: false, writeable: true },
      VACATION: { role: "state", type: "boolean", required: false },
      WINDOWOPEN: { role: ["state", "sensor.window"], type: "boolean", required: false, writeable: false },
      WORKING: { role: "indicator.working", type: "boolean", required: false, writeable: false },
      USERICON: { role: "state", type: "string", required: false, writeable: false }
      // benutzerdefinierter Iconname über DP senden
    }
  },
  "level.timer": {
    name: "level.timer",
    description: "",
    data: {
      ACTUAL: { role: "timestamp", type: "number", required: true, writeable: true },
      STATE: { role: "state", type: "string", required: true, writeable: true }
    }
  },
  gate: {
    name: "gate",
    description: "",
    data: { ACTUAL: { role: "switch.gate", type: "boolean", required: true, writeable: false } }
  },
  door: {
    name: "door",
    description: "",
    data: {
      ACTUAL: { role: "sensor.door", type: "boolean", required: true, writeable: false },
      COLORDEC: { role: "state", type: "number", required: false, writeable: false },
      // Farbcode über DP steuern
      BUTTONTEXT: { role: ["state", "text"], type: "string", required: false, writeable: false }
      // Button-Text über DP steuern
    }
  },
  "level.mode.fan": {
    name: "level.mode.fan",
    description: "",
    data: {
      ACTUAL: { role: "state", type: "boolean", required: true, writeable: false },
      MODE: { role: "state", type: "number", required: true, writeable: true },
      SET: { role: "state", type: "boolean", required: true, writeable: true },
      SPEED: { role: "state", type: "number", required: true, writeable: true }
    }
  },
  lock: {
    name: "lock",
    description: "T\xFCrschloss",
    data: {
      ACTUAL: { role: "state", type: "boolean", required: true, writeable: false },
      OPEN: { role: "state", type: "boolean", required: false, writeable: false },
      SET: { role: "switch.lock", type: "boolean", required: true, writeable: true }
    }
  },
  warning: {
    name: "warning",
    description: "",
    data: {
      INFO: { role: "weather.title", type: "string", required: true, writeable: false },
      LEVEL: { role: "value.warning", type: "number", required: true, writeable: false },
      TITLE: { role: "weather.title.short", type: "string", required: true, writeable: false }
    }
  },
  weatherforecast: {
    name: "weatherforecast",
    description: "",
    data: {
      ICON: { role: "weather.icon.forecast", type: "string", required: true, writeable: false },
      TEMP: { role: "value.temperature", type: "number", required: true, writeable: false }
    }
  },
  WIFI: {
    name: "WIFI",
    description: "",
    data: {
      ACTUAL: { role: "state", type: "string", required: true, writeable: false },
      SWITCH: { role: "switch", type: "boolean", required: false, writeable: true }
    }
  }
};
const requiredFeatureDatapoints = {
  cie: {
    name: "cie",
    description: "",
    data: {
      CIE: { role: "level.color.cie", type: "string", required: true },
      DIMMER: { role: "level.dimmer", type: "boolean", required: true },
      ON: { role: "switch.light", type: "boolean", required: true },
      ON_ACTUAL: { role: "sensor.light", type: "boolean", required: true },
      TEMPERATURE: { role: "level.color.temperature", type: "number", required: true }
    }
  },
  timeTable: {
    name: "timeTable",
    description: "",
    data: {
      ACTUAL: { role: "text", type: "string", required: true },
      VEHICLE: { role: "text", type: "string", required: true },
      DIRECTION: { role: "text", type: "string", required: true },
      DELAY: { role: "indicator", type: "boolean", required: true }
    }
  },
  info: { name: "info", description: "", data: { ACTUAL: { role: "text", type: "string", required: true } } },
  airCondition: {
    name: "airCondition",
    description: "",
    data: {
      ACTUAL: { role: "value.temperature", type: "number", required: true },
      SET: { role: "level.temperature", type: "number", required: true },
      AUTO: { role: "switch", type: "boolean", required: false },
      COOL: { role: "switch", type: "boolean", required: false },
      BOOST: { role: "switch.mode.boost", type: "boolean", required: false },
      ERROR: { role: "indicator.error", type: "boolean", required: false },
      HEAT: { role: "switch", type: "boolean", required: false },
      HUMINITY: { role: "value.humidity", type: "number", required: false },
      MAINTAIN: { role: "indicator.maintenance", type: "boolean", required: false },
      MODE: { role: "level.mode.airconditioner", type: "number", required: true },
      OFF: { role: "switch", type: "boolean", required: true },
      POWER: { role: "switch.power", type: "boolean", required: false },
      SPEED: { role: "level.mode.fan", type: "number", required: false },
      SWING: { role: "switch.mode.swing", type: "boolean", required: false },
      UNREACH: { role: "indicator.maintenance.unreach", type: "boolean", required: false }
    }
  },
  gate: {
    name: "gate",
    description: "",
    data: {
      ACTUAL: { role: ["value.blind", "value.blind"], type: "number", required: true, writeable: false },
      SET: { role: "switch.gate", type: "boolean", required: true, writeable: true },
      STOP: { role: "button.stop", type: "boolean", required: true, writeable: true }
    }
  },
  thermostat: {
    name: "thermostat",
    description: "",
    data: {
      ACTUAL: { role: "value.temperature", type: "number", required: true },
      SET: { role: "level.temperature", type: "number", required: true },
      MODE: { role: "level.mode.thermostat", type: "number", required: true },
      BOOST: { role: "switch.mode.boost", type: "boolean", required: false },
      AUTOMATIC: { role: "switch.mode.auto", type: "boolean", required: true },
      ERROR: { role: "indicator.error", type: "boolean", required: false },
      LOWBAT: { role: "indicator.maintenance.lowbat", type: "boolean", required: false },
      MANUAL: { role: "switch.mode.manual", type: "boolean", required: false },
      UNREACH: { role: "indicator.maintenance.unreach", type: "boolean", required: false },
      HUMINITY: { role: "value.humidity", type: "number", required: false },
      MAINTAIN: { role: "indicator.maintenance", type: "boolean", required: false },
      PARTY: { role: "switch.mode.party", type: "boolean", required: false },
      POWER: { role: "switch.power", type: "boolean", required: false },
      VACATION: { role: "switch", type: "boolean", required: false },
      WINDOWOPEN: { role: "sensor.window", type: "boolean", required: false },
      WORKING: { role: "indicator.working", type: "boolean", required: false }
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CustomTemplates,
  defaultConfig,
  isConfig,
  requiredFeatureDatapoints,
  requiredScriptDataPoints
});
//# sourceMappingURL=config-manager-const.js.map
