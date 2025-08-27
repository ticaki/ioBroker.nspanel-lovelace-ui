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
  return "mode" in F && (F.mode === "page" && F.page || "state" in F && (F.mode === "switch" || F.mode === "button") && F.state && !F.state.endsWith("."));
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
  airCondition: {
    ACTUAL: null,
    SET: null,
    SET2: null,
    BOOST: null,
    ERROR: null,
    HUMIDITY: null,
    MAINTAIN: null,
    MODE: null,
    MODESET: null,
    POWER: null,
    SPEED: null,
    SWING: null,
    SWING2: null,
    UNREACH: null
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
  button: {
    SET: null
  },
  ct: {
    DIMMER: null,
    ON: null,
    ON_ACTUAL: null,
    TEMPERATURE: null
  },
  dimmer: {
    SET: null,
    ACTUAL: null,
    ON_SET: null,
    ON_ACTUAL: null
  },
  door: {
    ACTUAL: null,
    BUTTONTEXT: null
  },
  gate: {
    ACTUAL: null,
    SET: null,
    STOP: null
  },
  hue: {
    DIMMER: null,
    ON: null,
    ON_ACTUAL: null,
    TEMPERATURE: null,
    HUE: null
  },
  humidity: {
    ACTUAL: null
  },
  info: {
    ACTUAL: null,
    COLORDEC: null,
    BUTTONTEXT: null,
    USERICON: null
  },
  light: {
    ON_ACTUAL: null,
    SET: null,
    BUTTONTEXT: null
  },
  lock: {
    ACTUAL: null,
    OPEN: null,
    SET: null
  },
  motion: {
    ACTUAL: null
  },
  rgb: {
    RED: null,
    GREEN: null,
    BLUE: null,
    ON_ACTUAL: null,
    ON: null,
    DIMMER: null,
    TEMPERATURE: null
  },
  rgbSingle: {
    RGB: null,
    ON: null,
    DIMMER: null,
    TEMPERATURE: null,
    ON_ACTUAL: null
  },
  select: {
    ACTUAL: null,
    SET: null
  },
  slider: {
    SET: null,
    ACTUAL: null,
    SET2: null,
    ACTUAL2: null,
    SET3: null,
    ACTUAL3: null
  },
  socket: {
    ACTUAL: null,
    SET: null,
    BUTTONTEXT: null
  },
  temperature: {
    ACTUAL: null
  },
  thermostat: {
    ACTUAL: null,
    SET: null,
    MODE: null,
    MODESET: null,
    BOOST: null,
    ERROR: null,
    LOWBAT: null,
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
  timeTable: {
    noNeed: null
  },
  volume: {
    ACTUAL: null,
    SET: null,
    MUTE: null
  },
  warning: {
    INFO: null,
    LEVEL: null,
    TITLE: null
  },
  window: {
    ACTUAL: null,
    BUTTONTEXT: null
  },
  "level.mode.fan": {
    ACTUAL: null,
    MODE: null,
    SET: null,
    SPEED: null
  },
  "level.timer": {
    ACTUAL: null,
    SET: null,
    STATE: null,
    STATUS: null
  },
  "sensor.alarm.flood": {
    ACTUAL: null
  },
  "value.humidity": {
    ACTUAL: null
  },
  "value.temperature": {
    ACTUAL: null
  }
};
const templateDatapoint = {
  UNREACH: {
    role: "indicator.maintenance.unreach",
    type: "boolean",
    required: false,
    writeable: false,
    trigger: true,
    description: ""
  },
  LOWBAT: {
    role: "indicator.maintenance.lowbat",
    type: "boolean",
    required: false,
    writeable: false,
    trigger: true,
    description: ""
  }
};
const requiredScriptDataPoints = {
  airCondition: {
    name: "airCondition",
    description: "Not everything for every card",
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
      BOOST: {
        role: ["switch.mode.boost", "switch.boost"],
        type: "boolean",
        required: false,
        writeable: true,
        trigger: true
      },
      ERROR: { role: "indicator.error", type: "boolean", required: false, writeable: false, trigger: true },
      HUMIDITY: { role: "value.humidity", type: "number", required: false, writeable: false, trigger: true },
      MAINTAIN: {
        role: "indicator.maintenance",
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true
      },
      MODE: {
        role: "value.mode.airconditioner",
        type: ["number", "string"],
        required: false,
        writeable: false,
        trigger: true,
        description: `0: OFF, 1: AUTO, 2: COOL, 3: HEAT, 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.  (alternative type: 'string' for direct display) iif missed pick ModeSet -`
      },
      MODESET: {
        role: "level.mode.airconditioner",
        type: ["number"],
        required: false,
        writeable: true,
        trigger: true,
        description: `0: OFF, 1: COOL, 2: HEAT, 3: AUTO,//soweit eingebaut 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.`
      },
      POWER: {
        role: "switch",
        type: "boolean",
        required: false,
        writeable: true,
        description: "use MODE for on/off"
      },
      SPEED: { role: "level.mode.fan", type: "number", required: false, writeable: true, trigger: true },
      SWING: { role: "level.mode.swing", type: "number", required: false, writeable: true, trigger: true },
      SWING2: { role: "switch.mode.swing", type: "boolean", required: false, writeable: true, trigger: true },
      UNREACH: templateDatapoint.UNREACH
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
        trigger: true,
        alternate: "SET"
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
  button: {
    updatedVersion: true,
    name: "button",
    description: "Switch",
    data: {
      SET: { role: "button", type: "boolean", required: true, writeable: true }
    }
  },
  ct: {
    updatedVersion: true,
    name: "ct",
    description: "f\xFCr Lampen die das wei\xDFe Licht zwischen kalt und warm \xE4ndern k\xF6nnen",
    data: {
      DIMMER: { role: "level.dimmer", type: "number", required: true, trigger: true, writeable: true },
      ON: { role: "switch.light", type: "boolean", required: true, writeable: true },
      ON_ACTUAL: {
        role: ["sensor.light", "switch.light"],
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true,
        alternate: "ON"
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
        trigger: true,
        alternate: "SET"
      },
      ON_SET: { role: "switch.light", type: "boolean", required: true, writeable: true },
      ON_ACTUAL: {
        role: ["sensor.light", "switch.light"],
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true,
        alternate: "ON_SET"
      }
    }
  },
  door: {
    name: "door",
    description: "",
    data: {
      ACTUAL: { role: "sensor.door", type: "boolean", required: true, writeable: false, trigger: true },
      BUTTONTEXT: { role: ["state", "text"], type: "string", required: false, writeable: false, trigger: true }
    }
  },
  gate: {
    name: "gate",
    description: "",
    data: {
      ACTUAL: { role: "value.blind", type: "number", required: false, writeable: false, trigger: true },
      SET: { role: "switch.gate", type: "boolean", required: true, writeable: true, trigger: true },
      STOP: { role: "button.stop", type: "boolean", required: false, writeable: true, trigger: true }
    }
  },
  hue: {
    updatedVersion: true,
    name: "hue",
    description: "",
    data: {
      DIMMER: { role: "level.dimmer", type: "number", required: true, trigger: true, writeable: true },
      ON: { role: "switch.light", type: "boolean", required: true, writeable: true },
      ON_ACTUAL: {
        role: ["sensor.light", "switch.light"],
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true,
        alternate: "ON"
      },
      TEMPERATURE: {
        role: "level.color.temperature",
        type: "number",
        required: false,
        writeable: true,
        trigger: true
      },
      HUE: { role: "level.color.hue", type: "number", required: true, writeable: true, trigger: true }
    }
  },
  humidity: {
    updatedVersion: true,
    name: "humidity",
    description: "",
    data: { ACTUAL: { role: "value.humidity", type: "number", required: true, writeable: false, trigger: true } }
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
      COLORDEC: {
        role: "value.rgb",
        type: "number",
        required: false,
        writeable: false,
        useKey: true,
        trigger: true
      },
      BUTTONTEXT: {
        role: ["text"],
        type: "string",
        required: false,
        writeable: false,
        useKey: true,
        trigger: true
      },
      USERICON: { role: "state", type: "string", required: false, writeable: false, useKey: true, trigger: true }
    }
  },
  light: {
    updatedVersion: true,
    name: "light",
    description: "ein Lichtschalter",
    data: {
      ON_ACTUAL: {
        role: ["sensor.light", "switch.light"],
        type: "boolean",
        required: true,
        writeable: false,
        trigger: true,
        alternate: "SET"
      },
      SET: { role: "switch.light", type: "boolean", required: true, writeable: true },
      BUTTONTEXT: { role: "text", type: "string", required: false, writeable: false, trigger: true }
    }
  },
  lock: {
    name: "lock",
    description: "T\xFCrschloss",
    data: {
      ACTUAL: {
        role: ["state"],
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true,
        alternate: "SET"
      },
      OPEN: { role: "button", type: "boolean", required: false, writeable: true },
      SET: { role: "switch.lock", type: "boolean", required: true, writeable: true }
    }
  },
  motion: {
    updatedVersion: true,
    name: "motion",
    description: "Status of the motion sensor or presence detector (motion or presence detected)",
    data: { ACTUAL: { role: "sensor.motion", type: "boolean", required: true, writeable: false, trigger: true } }
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
        required: false,
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
      }
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
        trigger: true,
        alternate: "ON"
      }
    }
  },
  select: {
    updatedVersion: true,
    name: "select",
    description: "Auswahlbox",
    data: {
      ACTUAL: {
        role: ["value.mode.select"],
        type: "number",
        required: true,
        writeable: false,
        trigger: true
      },
      SET: { role: "level.mode.select", type: "number", required: true, writeable: true, trigger: true }
    }
  },
  slider: {
    updatedVersion: true,
    name: "slider",
    description: "Slider to set a numerical value",
    data: {
      SET: { role: "level", type: "number", required: true, writeable: true, useKey: true },
      ACTUAL: {
        role: ["value", "level"],
        type: "number",
        required: false,
        writeable: false,
        trigger: true,
        alternate: "SET",
        useKey: true
      },
      SET2: { role: "level", type: "number", required: false, writeable: true, useKey: true },
      ACTUAL2: {
        role: ["value", "level"],
        type: "number",
        required: false,
        writeable: false,
        trigger: true,
        alternate: "SET2",
        useKey: true
      },
      SET3: { role: "level", type: "number", required: false, writeable: true, useKey: true },
      ACTUAL3: {
        role: ["value", "level"],
        type: "number",
        required: false,
        writeable: false,
        trigger: true,
        alternate: "SET3",
        useKey: true
      }
    }
  },
  socket: {
    updatedVersion: true,
    name: "socket",
    description: "Steckdosen, Schalter, Relais, usw. alles was man mit true/false steuern kann",
    data: {
      ACTUAL: {
        role: "sensor.switch",
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true,
        alternate: "SET"
      },
      SET: { role: "switch", type: "boolean", required: true, writeable: true },
      BUTTONTEXT: { role: ["state", "text"], type: "string", required: false, writeable: false, trigger: true }
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
  thermostat: {
    name: "thermostat",
    description: "",
    data: {
      ACTUAL: {
        role: "value.temperature",
        type: "number",
        required: false,
        writeable: false,
        trigger: true,
        alternate: "SET"
      },
      SET: { role: "level.temperature", type: "number", required: true, writeable: true },
      MODE: {
        role: "value.mode.thermostat",
        type: ["number", "string"],
        required: false,
        writeable: false,
        trigger: true,
        description: `0: OFF, 1: AUTO, 2: COOL, 3: HEAT, 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.  (alternative type: 'string' for direct display) iif missed pick ModeSet -`
      },
      MODESET: {
        role: "level.mode.thermostat",
        type: ["number"],
        required: false,
        writeable: true,
        trigger: true,
        description: `0: OFF, 1: COOL, 2: HEAT, 3: AUTO,//soweit eingebaut 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.`
      },
      BOOST: {
        role: ["switch.mode.boost", "switch.boost"],
        type: "boolean",
        required: false,
        writeable: true,
        trigger: true
      },
      ERROR: {
        role: "indicator.error",
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true,
        description: "Not supported in cardThermo2"
      },
      LOWBAT: templateDatapoint.LOWBAT,
      UNREACH: templateDatapoint.UNREACH,
      HUMIDITY: { role: "value.humidity", type: "number", required: false, writeable: false, trigger: true },
      MAINTAIN: {
        role: "indicator.maintenance",
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true,
        description: "Not supported in cardThermo2"
      },
      PARTY: {
        role: "switch.mode.party",
        type: "boolean",
        required: false,
        trigger: true,
        description: "Not supported in cardThermo2"
      },
      POWER: { role: "switch.power", type: "boolean", required: false, writeable: true, trigger: true },
      VACATION: {
        role: "state",
        type: "boolean",
        useKey: true,
        required: false,
        trigger: true,
        description: "Not supported in cardThermo2"
      },
      WINDOWOPEN: {
        role: ["sensor.window"],
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true
      },
      WORKING: {
        role: "indicator.working",
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true,
        description: "Not supported in cardThermo2"
      },
      USERICON: {
        role: "state",
        type: "string",
        useKey: true,
        required: false,
        writeable: false,
        trigger: true,
        description: "Not supported in cardThermo2"
      }
    }
  },
  timeTable: {
    updatedVersion: true,
    name: "timeTable",
    description: "Time table for the Departure (Fahrplan Adapter)",
    data: {
      noNeed: {
        role: "state",
        type: "string",
        required: false,
        description: "Just use the template for this - ask TT-Tom :)"
      }
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
        trigger: true,
        alternate: "SET"
      },
      SET: { role: "level.volume", type: "number", required: true, writeable: true },
      MUTE: { role: "media.mute", type: "boolean", required: false, writeable: true, trigger: true }
    }
  },
  warning: {
    name: "warning",
    description: "",
    data: {
      INFO: { role: "weather.title", type: "string", required: true, writeable: false, trigger: true },
      LEVEL: { role: "value.warning", type: "number", required: true, writeable: false, trigger: true },
      TITLE: { role: "weather.title.short", type: "string", required: true, writeable: false, trigger: true }
    }
  },
  window: {
    updatedVersion: true,
    name: "window",
    description: "",
    data: {
      ACTUAL: { role: "sensor.window", type: "boolean", required: true, writeable: false, trigger: true },
      BUTTONTEXT: { role: ["state", "text"], type: "string", required: false, writeable: false }
    }
  },
  "level.mode.fan": {
    name: "fan",
    description: "",
    data: {
      ACTUAL: {
        role: ["sensor.switch", "state"],
        type: "boolean",
        required: false,
        writeable: false,
        trigger: true,
        alternate: "SET"
      },
      MODE: { role: "level.mode.fan", type: "number", required: false, writeable: true, trigger: true },
      SET: { role: "switch", type: "boolean", required: true, writeable: true },
      SPEED: { role: "level.speed", type: "number", required: true, writeable: true, trigger: true }
    }
  },
  "level.timer": {
    name: "level.timer",
    description: "Ein countdown Timer (intern/extern) oder eine Uhrzeit (extern)",
    data: {
      ACTUAL: {
        role: ["value.timer", "level.timer", "date"],
        type: "number",
        required: false,
        trigger: true,
        writeable: false,
        description: "Das wird angezeigt - date in hh:mm, timer in mm:ss"
      },
      SET: {
        role: ["level.timer", "date"],
        type: "number",
        required: false,
        writeable: true,
        description: "Hier wird ein ge\xE4nderter Wert hingeschrieben"
      },
      STATE: {
        role: "button",
        type: "boolean",
        required: false,
        writeable: true,
        description: "wenn die oberen nicht benutzt wird hier getriggert wenn ein interner Timer endet."
      },
      STATUS: {
        role: "level.mode",
        type: "number",
        required: false,
        trigger: true,
        writeable: true,
        description: "0: OFF , 1: PAUSE, 2: ON/RUNNING"
      }
    }
  },
  "sensor.alarm.flood": {
    name: "sensor.alarm.flood",
    description: "Sensor f\xFCr Hochwasser",
    data: {
      ACTUAL: { role: "sensor.alarm.flood", type: "boolean", required: true, writeable: false, trigger: true }
    }
  },
  "value.humidity": {
    updatedVersion: true,
    name: "humidity",
    description: "",
    data: { ACTUAL: { role: "value.humidity", type: "number", required: true, writeable: false, trigger: true } }
  },
  "value.temperature": {
    updatedVersion: true,
    name: "value.temperature",
    description: "",
    data: {
      ACTUAL: { role: "value.temperature", type: "number", required: true, writeable: false, trigger: true }
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
