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
  arrayOfAllConfigRequiredFields: () => arrayOfAllConfigRequiredFields,
  checkedDatapoints: () => checkedDatapoints,
  defaultConfig: () => defaultConfig,
  isButton: () => isButton,
  isConfig: () => isConfig,
  requiredScriptDataPoints: () => requiredScriptDataPoints
});
module.exports = __toCommonJS(config_manager_const_exports);
var import_pages = require("../types/pages");
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
function isButton(F) {
  if (F === void 0) {
    return false;
  }
  if (F === null) {
    return true;
  }
  return "mode" in F && (F.mode === "page" && F.page || "state" in F && (F.mode === "switch" || F.mode === "button") && F.state);
}
function isConfig(F, adapter) {
  if (F === void 0) {
    return false;
  }
  const requiredFields = [
    "panelTopic",
    "weatherEntity",
    "defaultOnColor",
    "defaultOffColor",
    "defaultBackgroundColor",
    "pages",
    "subPages",
    "buttonLeft",
    "buttonRight",
    "bottomScreensaverEntity",
    "favoritScreensaverEntity",
    "alternateScreensaverEntity",
    "leftScreensaverEntity",
    "indicatorScreensaverEntity",
    "mrIcon1ScreensaverEntity",
    "mrIcon2ScreensaverEntity"
  ];
  for (const field of requiredFields) {
    if (F[field] === void 0) {
      adapter.log.warn(`Required field '${field}' is missing in config - Aborting for this panel`);
      return false;
    }
  }
  return true;
}
const arrayOfAllConfigRequiredFields = (0, import_pages.arrayOfAll)();
const defaultConfig = {
  version: "0",
  panelTopic: "",
  weatherEntity: "",
  bottomScreensaverEntity: [],
  favoritScreensaverEntity: [],
  alternateScreensaverEntity: [],
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
  buttonLeft: null,
  buttonRight: null,
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
const checkedDatapoints = {
  motion: {
    ACTUAL: null
  },
  dimmer: {
    SET: null,
    ACTUAL: null,
    ON_SET: null,
    ON_ACTUAL: null
  },
  ct: {
    DIMMER: null,
    ON: null,
    ON_ACTUAL: null,
    TEMPERATURE: null
  },
  window: {
    ACTUAL: null,
    COLORDEC: null,
    BUTTONTEXT: null
  },
  humidity: {
    ACTUAL: null
  },
  "value.humidity": {
    ACTUAL: null
  },
  timeTable: {
    noNeed: null
  },
  hue: {
    DIMMER: null,
    ON: null,
    ON_ACTUAL: null,
    TEMPERATURE: null,
    HUE: null
  },
  info: {
    ACTUAL: null,
    COLORDEC: null,
    BUTTONTEXT: null,
    USERICON: null
  },
  blind: {
    ACTUAL: null,
    SET: null,
    CLOSE: null,
    OPEN: null,
    STOP: null,
    TILT_ACTUAL: null,
    TILT_SET: null,
    TILT_CLOSE: null,
    TILT_OPEN: null,
    TILT_STOP: null
  },
  airCondition: {
    ACTUAL: null,
    SET: null,
    SET2: null,
    AUTO: null,
    COOL: null,
    BOOST: null,
    ERROR: null,
    HEAT: null,
    HUMIDITY: null,
    MAINTAIN: null,
    MODE: null,
    OFF: null,
    POWER: null,
    SPEED: null,
    SWING: null,
    UNREACH: null
  },
  socket: {
    ACTUAL: null,
    SET: null,
    COLORDEC: null,
    BUTTONTEXT: null
  },
  light: {
    ACTUAL: null,
    SET: null,
    COLORDEC: null,
    BUTTONTEXT: null
  },
  volume: {
    ACTUAL: null,
    SET: null,
    MUTE: null
  },
  rgb: {
    RED: null,
    GREEN: null,
    BLUE: null,
    ON_ACTUAL: null,
    ON: null,
    DIMMER: null,
    TEMPERATURE: null,
    WHITE: null
  },
  rgbSingle: {
    RGB: null,
    ON: null,
    DIMMER: null,
    TEMPERATURE: null,
    ON_ACTUAL: null
  },
  slider: {
    SET: null,
    ACTUAL: null
  },
  button: {
    SET: null
  },
  select: {
    ACTUAL: null,
    SET: null
  },
  temperature: {
    ACTUAL: null
  },
  "value.temperature": {
    ACTUAL: null
  },
  thermostat: {
    ACTUAL: null,
    SET: null,
    MODE: null,
    BOOST: null,
    //AUTOMATIC: null,
    ERROR: null,
    LOWBAT: null,
    //MANUAL: null,
    UNREACH: null,
    HUMIDITY: null,
    MAINTAIN: null,
    PARTY: null,
    POWER: null,
    VACATION: null,
    WINDOWOPEN: null,
    WORKING: null,
    USERICON: null
  },
  "level.timer": {
    ACTUAL: null,
    STATE: null
  },
  gate: {
    ACTUAL: null
  },
  door: {
    ACTUAL: null,
    COLORDEC: null,
    BUTTONTEXT: null
  },
  "level.mode.fan": {
    ACTUAL: null,
    MODE: null,
    SET: null,
    SPEED: null
  },
  lock: {
    ACTUAL: null,
    OPEN: null,
    SET: null
  },
  warning: {
    INFO: null,
    LEVEL: null,
    TITLE: null
  }
};
const requiredScriptDataPoints = {
  motion: {
    updatedVersion: true,
    name: "motion",
    description: "Status of the motion sensor or presence detector (motion or presence detected)",
    data: { ACTUAL: { role: "sensor.motion", type: "boolean", required: true, writeable: false, trigger: true } }
  },
  timeTable: {
    updatedVersion: true,
    name: "timeTable",
    description: "Time table for the heating",
    data: {
      noNeed: {
        role: "state",
        type: "string",
        required: false,
        description: "Just use the template for this - ask TT-Tom :)"
      }
    }
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
    updatedVersion: true,
    name: "dimmer",
    description: "Licht ein- / ausschalten und dimmen",
    data: {
      SET: { role: "level.dimmer", type: "number", required: true, writeable: true },
      ACTUAL: {
        role: ["value.dimmer", "level.dimmer"],
        type: "number",
        required: false,
        writeable: false,
        trigger: true
      },
      ON_SET: { role: "switch.light", type: "boolean", required: true, writeable: true },
      ON_ACTUAL: {
        role: ["sensor.light", "switch.light"],
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true
      }
    }
  },
  ct: {
    updatedVersion: true,
    name: "ct",
    description: "f\xFCr Lampen die das wei\xDFe Licht zwischen kalt und warm \xE4ndern k\xF6nnen",
    data: {
      DIMMER: { role: "level.dimmer", type: "number", required: true, writeable: true },
      ON: { role: "switch.light", type: "boolean", required: true, writeable: true },
      ON_ACTUAL: {
        role: ["sensor.light", "switch.light"],
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true
      },
      TEMPERATURE: {
        role: "level.color.temperature",
        type: "number",
        required: true,
        writeable: true,
        trigger: true
      }
    }
  },
  window: {
    updatedVersion: true,
    name: "window",
    description: "",
    data: {
      ACTUAL: { role: "sensor.window", type: "boolean", required: true, writeable: false, trigger: true },
      COLORDEC: { role: "state", type: "number", required: false, writeable: false },
      //Farbcode über DP steuern
      BUTTONTEXT: { role: ["state", "text"], type: "string", required: false, writeable: false }
      //Button-Text über DP steuern
    }
  },
  humidity: {
    updatedVersion: true,
    name: "humidity",
    description: "",
    data: { ACTUAL: { role: "value.humidity", type: "number", required: true, writeable: false, trigger: true } }
  },
  "value.humidity": {
    updatedVersion: true,
    name: "humidity",
    description: "",
    data: { ACTUAL: { role: "value.humidity", type: "number", required: true, writeable: false, trigger: true } }
  },
  hue: {
    updatedVersion: true,
    name: "hue",
    description: "",
    data: {
      DIMMER: { role: "level.dimmer", type: "number", required: true, writeable: true },
      ON: { role: "switch.light", type: "boolean", required: true, writeable: true },
      ON_ACTUAL: {
        role: ["sensor.light", "switch.light"],
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true
      },
      TEMPERATURE: {
        role: "level.color.temperature",
        type: "number",
        required: false,
        writeable: true,
        trigger: true
      },
      HUE: { role: "level.color.hue", type: "number", required: true, writeable: true, trigger: true }
      //SCENE: { role: 'state', type: 'number', required: false, writeable: true }, //für popupInSel
    }
  },
  info: {
    updatedVersion: true,
    name: "info",
    description: "Universal Datenpunkt f\xFCr diverse Anwendungen",
    data: {
      ACTUAL: {
        role: "state",
        type: ["string", "number", "boolean", "mixed"],
        required: true,
        writeable: false,
        useKey: true,
        trigger: true
      },
      COLORDEC: { role: "value.rgb", type: "number", required: false, writeable: false, useKey: true },
      //Farbcode über DP senden
      BUTTONTEXT: { role: ["text"], type: "string", required: false, writeable: false, useKey: true },
      //Button-Text über DP senden bei cardEntity
      USERICON: { role: "state", type: "string", required: false, writeable: false, useKey: true }
      //Benutzerdefinierte Iconnamen über DP senden
    }
  },
  blind: {
    updatedVersion: true,
    name: "blind",
    description: "",
    data: {
      ACTUAL: {
        role: ["value.blind", "level.blind"],
        type: "number",
        required: false,
        writeable: false,
        trigger: true
      },
      SET: { role: "level.blind", type: "number", required: true, writeable: true },
      CLOSE: { role: "button.close.blind", type: "boolean", required: true, writeable: true },
      OPEN: { role: "button.open.blind", type: "boolean", required: true, writeable: true },
      STOP: { role: "button.stop.blind", type: "boolean", required: true, writeable: true },
      TILT_ACTUAL: {
        role: ["level.tilt", "value.tilt"],
        type: "number",
        required: false,
        writeable: false,
        trigger: true
      },
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
      ACTUAL: {
        role: "value.temperature",
        type: "number",
        required: false,
        writeable: false,
        trigger: true
      },
      SET: { role: "level.temperature", type: "number", useKey: true, required: true, writeable: true },
      SET2: { role: "level.temperature", type: "number", useKey: true, required: false, writeable: true },
      AUTO: { role: "switch.mode.auto", type: "boolean", required: false, writeable: false, trigger: true },
      COOL: { role: "state", type: "boolean", useKey: true, required: false, writeable: false, trigger: true },
      BOOST: { role: "switch.mode.boost", type: "boolean", required: false, writeable: true, trigger: true },
      ERROR: { role: "indicator.error", type: "boolean", required: false, writeable: false, trigger: true },
      HEAT: { role: "state", type: "boolean", useKey: true, required: false, writeable: false, trigger: true },
      HUMIDITY: { role: "value.humidity", type: "number", required: false, writeable: false, trigger: true },
      MAINTAIN: {
        role: "indicator.maintenance",
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true
      },
      MODE: {
        role: "level.mode.airconditioner",
        type: "number",
        required: false,
        writeable: true,
        trigger: true
      },
      OFF: { role: "state", type: "boolean", required: false, writeable: false },
      //off
      POWER: { role: "switch", type: "boolean", required: false, writeable: true },
      //on
      SPEED: { role: "level.mode.fan", type: "number", required: false, writeable: true, trigger: true },
      SWING: { role: "switch.mode.swing", type: "boolean", required: false, writeable: true, trigger: true },
      UNREACH: {
        role: "indicator.maintenance",
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true
      }
    }
  },
  socket: {
    updatedVersion: true,
    name: "socket",
    description: "Steckdosen, Schalter, Relais, usw. schalten",
    data: {
      ACTUAL: { role: "switch", type: "boolean", required: true, writeable: false, trigger: true },
      SET: { role: "switch", type: "boolean", required: false, writeable: true },
      COLORDEC: { role: "state", type: "number", required: false, writeable: false },
      //Farbcode über DP steuern
      BUTTONTEXT: { role: ["state", "text"], type: "string", required: false, writeable: false }
      //Button-Text über DP steuern bei cardEntity
    }
  },
  light: {
    updatedVersion: true,
    name: "light",
    description: "ein Lichtschalter",
    data: {
      ACTUAL: {
        role: ["switch.light", "sensor.light"],
        type: "boolean",
        required: true,
        writeable: false,
        trigger: true
      },
      SET: { role: "switch.light", type: "boolean", required: false, writeable: true },
      COLORDEC: { role: "state", type: "number", required: false, writeable: false },
      //Farbcode über DP steuern
      BUTTONTEXT: { role: "text", type: "string", required: false, writeable: false }
      //Button-Text über DP steuern bei cardEntity
    }
  },
  volume: {
    updatedVersion: true,
    name: "volume",
    description: "",
    data: {
      ACTUAL: {
        role: ["value.volume", "level.volume"],
        type: "number",
        required: false,
        writeable: false,
        trigger: true
      },
      SET: { role: "level.volume", type: "number", required: true, writeable: true },
      MUTE: { role: "media.mute", type: "boolean", required: false, writeable: true }
    }
  },
  rgb: {
    updatedVersion: true,
    name: "rgb",
    description: "Farblicht mit einzelnen Farbkan\xE4len",
    data: {
      RED: { role: "level.color.red", type: "number", required: true, writeable: true, trigger: true },
      GREEN: { role: "level.color.green", type: "number", required: true, writeable: true, trigger: true },
      BLUE: { role: "level.color.blue", type: "number", required: true, writeable: true, trigger: true },
      ON_ACTUAL: {
        role: ["sensor.light", "switch.light"],
        type: "boolean",
        required: true,
        writeable: false,
        trigger: true
      },
      ON: { role: "switch.light", type: "boolean", required: true, writeable: true },
      DIMMER: { role: "level.dimmer", type: "number", required: false, writeable: true, trigger: true },
      TEMPERATURE: {
        role: "level.color.temperature",
        type: "number",
        required: false,
        writeable: true,
        trigger: true
      },
      // entweder oder
      WHITE: { role: "level.color.white", type: "number", required: false, writeable: true, trigger: true }
      // mit prüfen
      //VALUE: { role: 'state', type: 'number', required: false, writeable: true }, //für popupInSel
    }
  },
  rgbSingle: {
    updatedVersion: true,
    name: "rgbSingle",
    description: "Farblicht ohne Farbkan\xE4le",
    data: {
      RGB: { role: "level.color.rgb", type: "string", required: true, writeable: true, trigger: true },
      ON: { role: "switch.light", type: "boolean", required: true, writeable: true },
      DIMMER: { role: "level.dimmer", type: "number", required: false, writeable: true, trigger: true },
      TEMPERATURE: {
        role: "level.color.temperature",
        type: "number",
        required: false,
        writeable: true,
        trigger: true
      },
      ON_ACTUAL: {
        role: ["sensor.light", "switch.light"],
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true
      }
      // VALUE: { role: 'state', type: 'number', required: false, writeable: true }, //für popupInSel
    }
  },
  slider: {
    updatedVersion: true,
    name: "slider",
    description: "Slider to set a numerical value",
    data: {
      SET: { role: "level", type: "number", required: true, writeable: true },
      ACTUAL: { role: ["value", "level"], type: "number", required: false, writeable: false, trigger: true }
    }
  },
  button: {
    updatedVersion: true,
    name: "button",
    description: "Switch",
    data: { SET: { role: "button", type: "boolean", required: true, writeable: true } }
  },
  select: {
    updatedVersion: true,
    name: "select",
    description: "Auswahlbox",
    data: {
      ACTUAL: {
        role: ["value.mode.select", "level.mode.select"],
        type: "number",
        required: true,
        writeable: false,
        trigger: true
      },
      SET: { role: "level.mode.select", type: "number", required: true, writeable: false, trigger: true }
    }
  },
  temperature: {
    updatedVersion: true,
    name: "temperature",
    description: "",
    data: {
      ACTUAL: { role: "value.temperature", type: "number", required: true, writeable: false, trigger: true }
    }
  },
  "value.temperature": {
    updatedVersion: true,
    name: "value.temperature",
    description: "",
    data: {
      ACTUAL: { role: "value.temperature", type: "number", required: true, writeable: false, trigger: true },
      USERICON: { role: "state", type: "string", required: false, writeable: false }
      // benutzerdefinierter Iconname über DP senden
    }
  },
  thermostat: {
    name: "thermostat",
    description: "",
    data: {
      ACTUAL: {
        role: "value.temperature",
        type: "number",
        required: false,
        writeable: false
      },
      SET: { role: "level.temperature", type: "number", required: true, writeable: true },
      MODE: { role: "level.mode.thermostat", type: "number", required: false, writeable: true },
      BOOST: { role: "switch.mode.boost", type: "boolean", required: false, writeable: true },
      //AUTOMATIC: { role: 'state', type: 'boolean', required: false },
      ERROR: { role: "indicator.error", type: "boolean", required: false, writeable: false },
      LOWBAT: { role: "indicator.maintenance.lowbat", type: "boolean", required: false, writeable: false },
      //MANUAL: { role: 'state', type: 'boolean', required: false },
      UNREACH: { role: "indicator.maintenance.unreach", type: "boolean", required: false, writeable: false },
      HUMIDITY: { role: "value.humidity", type: "number", required: false, writeable: false },
      MAINTAIN: { role: "indicator.maintenance", type: "boolean", required: false, writeable: false },
      PARTY: { role: "switch.mode.party", type: "boolean", required: false },
      POWER: { role: "switch.power", type: "boolean", required: false, writeable: true },
      VACATION: { role: "state", type: "boolean", useKey: true, required: false },
      WINDOWOPEN: { role: ["state", "sensor.window"], type: "boolean", required: false, writeable: false },
      WORKING: { role: "indicator.working", type: "boolean", required: false, writeable: false },
      USERICON: { role: "state", type: "string", useKey: true, required: false, writeable: false }
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
      ACTUAL: {
        role: ["switch.lock", "state"],
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true
      },
      OPEN: { role: "button", type: "boolean", required: false, writeable: true },
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CustomTemplates,
  arrayOfAllConfigRequiredFields,
  checkedDatapoints,
  defaultConfig,
  isButton,
  isConfig,
  requiredScriptDataPoints
});
//# sourceMappingURL=config-manager-const.js.map
