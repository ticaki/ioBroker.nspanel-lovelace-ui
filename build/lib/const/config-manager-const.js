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
  requiredDatapoints: () => requiredDatapoints,
  requiredOutdatedDataPoints: () => requiredOutdatedDataPoints
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
const requiredOutdatedDataPoints = {
  motion: {
    ACTUAL: {
      role: "sensor.motion",
      type: "boolean",
      required: true
    }
  },
  cie: {
    CIE: {
      role: "level.color.cie",
      type: "number",
      required: true
    },
    DIMMER: {
      role: "level.dimmer",
      type: "boolean",
      required: true
    },
    ON: {
      role: "switch.light",
      type: "boolean",
      required: true
    },
    ON_ACTUAL: {
      role: "state.light",
      type: "boolean",
      required: true
    },
    TEMPERATURE: {
      role: "level.color.temperature",
      type: "number",
      required: true
    }
  },
  dimmer: {
    SET: {
      role: "level.dimmer",
      type: "number",
      required: true
    },
    ACTUAL: {
      role: "value.dimmer",
      type: "number",
      required: true
    },
    ON_SET: {
      role: "switch.light",
      type: "boolean",
      required: true
    },
    ON_ACTUAL: {
      role: "switch.light",
      type: "boolean",
      required: true
    }
  },
  timeTable: {
    ACTUAL: {
      role: "state",
      type: "string",
      required: true
    },
    VEHICLE: {
      role: "state",
      type: "string",
      required: true
    },
    DIRECTION: {
      role: "state",
      type: "string",
      required: true
    },
    DELAY: {
      role: "state",
      type: "boolean",
      required: true
    }
  },
  ct: {
    DIMMER: {
      role: "level.dimmer",
      type: "number",
      required: true
    },
    ON: {
      role: "switch.light",
      type: "boolean",
      required: true
    },
    TEMPERATURE: {
      role: "level.color.temperature",
      type: "number",
      required: true
    }
  },
  window: {
    ACTUAL: {
      role: "sensor.window",
      type: "boolean",
      required: true
    }
  },
  humidity: {
    ACTUAL: {
      role: "value.humidity",
      type: "number",
      required: true
    }
  },
  hue: {
    DIMMER: {
      role: "level.dimmer",
      type: "number",
      required: true
    },
    ON: {
      role: "switch.light",
      type: "boolean",
      required: true
    },
    ON_ACTUAL: {
      role: "state.light",
      type: "boolean",
      required: true
    },
    TEMPERATURE: {
      role: "level.color.temperature",
      type: "number",
      required: true
    },
    HUE: {
      role: "level.color.hue",
      type: "number",
      required: false
    }
  },
  info: {
    ACTUAL: {
      role: "state",
      type: "string",
      required: true
    }
  },
  blind: {
    ACTUAL: {
      role: "value.blind",
      type: "number",
      required: true
    },
    SET: {
      role: "level.blind",
      type: "number",
      required: true
    },
    CLOSE: {
      role: "button.close.blind",
      type: "boolean",
      required: true
    },
    OPEN: {
      role: "button.open.blind",
      type: "boolean",
      required: true
    },
    STOP: {
      role: "button.stop.blind",
      type: "boolean",
      required: true
    },
    TILT_ACTUAL: {
      role: "value.tilt",
      type: "number",
      required: false
    },
    TILT_SET: {
      role: "level.tilt",
      type: "number",
      required: false
    },
    TILT_CLOSE: {
      role: "button.close.tilt",
      type: "boolean",
      required: false
    },
    TILT_OPEN: {
      role: "button.open.tilt",
      type: "boolean",
      required: false
    },
    TILT_STOP: {
      role: "button.stop.tilt",
      type: "boolean",
      required: false
    }
  },
  airCondition: {
    ACTUAL: {
      role: "value.temperature",
      type: "number",
      required: true
    },
    SET: {
      role: "level.temperature",
      type: "number",
      required: true
    },
    AUTO: {
      role: "state",
      type: "boolean",
      required: false
    },
    COOL: {
      role: "state",
      type: "boolean",
      required: false
    },
    BOOST: {
      role: "switch.boost",
      type: "boolean",
      required: false
    },
    ERROR: {
      role: "indicator.error",
      type: "boolean",
      required: false
    },
    HEAT: {
      role: "state",
      type: "boolean",
      required: false
    },
    HUMINITY: {
      role: "value.humidity",
      type: "number",
      required: false
    },
    MAINTAIN: {
      role: "indicator.maintainance",
      type: "boolean",
      required: false
    },
    MODE: {
      role: "level.mode.aircondition",
      type: "number",
      required: true
    },
    OFF: {
      role: "state",
      type: "boolean",
      required: true
    },
    POWER: {
      role: "state",
      type: "boolean",
      required: false
    },
    SPEED: {
      role: "level.mode.fan",
      type: "number",
      required: false
    },
    SWING: {
      role: "switch.mode.swing",
      type: "boolean",
      required: false
    },
    UNREACH: {
      role: "indicator.maintainance",
      type: "boolean",
      required: false
    }
  },
  socket: {
    ACTUAL: {
      role: "switch",
      type: "boolean",
      required: false
    },
    SET: {
      role: "switch",
      type: "boolean",
      required: true
    }
  },
  light: {
    ACTUAL: {
      role: "switch.light",
      type: "boolean",
      required: false
    },
    SET: {
      role: "switch.light",
      type: "boolean",
      required: true
    }
  },
  volume: {
    ACTUAL: {
      role: "value.volume",
      type: "number",
      required: true
    },
    SET: {
      role: "level.volume",
      type: "number",
      required: true
    },
    MUTE: {
      role: "media.mute",
      type: "boolean",
      required: true
    }
  },
  rgb: {
    RED: {
      role: "level.color.red",
      type: "number",
      required: true
    },
    GREEN: {
      role: "level.color.green",
      type: "number",
      required: true
    },
    BLUE: {
      role: "level.color.blue",
      type: "number",
      required: true
    },
    ON_ACTUAL: {
      role: "state.light",
      type: "boolean",
      required: true
    },
    ON: {
      role: "switch.light",
      type: "boolean",
      required: true
    },
    DIMMER: {
      role: "level.dimmer",
      type: "number",
      required: true
    },
    TEMPERATURE: {
      role: "level.color.temperature",
      type: "number",
      required: true
    },
    WHITE: {
      role: "level.color.white",
      type: "number",
      required: false
    }
  },
  rbgSingle: {
    RGB: {
      role: "level.color.rgb",
      type: "number",
      required: true
    },
    ON: {
      role: "switch.light",
      type: "boolean",
      required: true
    },
    DIMMER: {
      role: "level.dimmer",
      type: "number",
      required: true
    },
    TEMPERATURE: {
      role: "level.color.temperature",
      type: "number",
      required: true
    },
    ON_ACTUAL: {
      role: "state.light",
      type: "boolean",
      required: true
    }
  },
  slider: {
    SET: {
      role: "level",
      type: "number",
      required: true
    },
    ACTUAL: {
      role: "value",
      type: "number",
      required: true
    }
  },
  button: {
    SET: {
      role: "button",
      type: "boolean",
      required: true
    }
  },
  buttonSensor: {
    ACTUAL: {
      role: "state",
      type: "boolean",
      required: true
    }
  },
  temperature: {
    ACTUAL: {
      role: "value.temperature",
      type: "number",
      required: true
    },
    SECOND: {
      role: "value.humidity",
      type: "number",
      required: false
    }
  },
  "value.temperature": {
    ACTUAL: {
      role: "value.temperature",
      type: "number",
      required: true
    },
    SECOND: {
      role: "value.humidity",
      type: "number",
      required: false
    }
  },
  thermostat: {
    ACTUAL: {
      role: "value.temperature",
      type: "number",
      required: true
    },
    SET: {
      role: "level.temperature",
      type: "number",
      required: true
    },
    MODE: {
      role: "level.mode.thermostat",
      type: "number",
      required: true
    },
    BOOST: {
      role: "state",
      type: "boolean",
      required: false
    },
    AUTOMATIC: {
      role: "state",
      type: "boolean",
      required: true
    },
    ERROR: {
      role: "indicator.error",
      type: "boolean",
      required: false
    },
    LOWBAT: {
      role: "indicator.maintainance",
      type: "boolean",
      required: false
    },
    MANUAL: {
      role: "state",
      type: "boolean",
      required: false
    },
    UNREACH: {
      role: "indicator.maintainance",
      type: "boolean",
      required: false
    },
    HUMINITY: {
      role: "value.humidity",
      type: "number",
      required: false
    },
    MAINTAIN: {
      role: "indicator.maintainance",
      type: "boolean",
      required: false
    },
    PARTY: {
      role: "state",
      type: "boolean",
      required: false
    },
    POWER: {
      role: "state",
      type: "boolean",
      required: false
    },
    VACATION: {
      role: "state",
      type: "boolean",
      required: false
    },
    WINDOWOPEN: {
      role: "state",
      type: "boolean",
      required: false
    },
    WORKING: {
      role: "state",
      type: "boolean",
      required: false
    }
  },
  // hier gehts weiter
  "level.timer": {
    ACTUAL: {
      role: "timestamp",
      type: "number",
      required: true
    },
    SET: {
      role: "state",
      type: "string",
      required: true
    }
  },
  gate: {
    ACTUAL: {
      role: "switch.gate",
      type: "boolean",
      required: true
    },
    SET: {
      role: "switch.gate",
      type: "boolean",
      required: true
    },
    STOP: {
      role: "button.stop",
      type: "boolean",
      required: true
    }
  },
  door: {
    ACTUAL: {
      role: "sensor.door",
      type: "boolean",
      required: true
    }
  },
  "level.mode.fan": {
    ACTUAL: {
      role: "state",
      type: "boolean",
      required: true
    },
    MODE: {
      role: "state",
      type: "number",
      required: true
    },
    SET: {
      role: "state",
      type: "boolean",
      required: true
    },
    SPEED: {
      role: "state",
      type: "number",
      required: true
    }
  },
  lock: {
    ACTUAL: {
      role: "state",
      type: "boolean",
      required: true
    },
    OPEN: {
      role: "button",
      type: "boolean",
      required: true
    },
    SET: {
      role: "switch.lock",
      type: "boolean",
      required: true
    }
  },
  warning: {
    INFO: {
      role: "weather.title",
      type: "string",
      required: true
    },
    LEVEL: {
      role: "value.warning",
      type: "number",
      required: true
    },
    TITLE: {
      role: "weather.title.short",
      type: "string",
      required: true
    }
  },
  weatherforecast: {
    ICON: {
      role: "weather.icon.forecast",
      type: "string",
      required: true
    },
    TEMP: {
      role: "value.temperature",
      type: "number",
      required: true
    }
  },
  WIFI: {
    ACTUAL: {
      role: "state",
      type: "string",
      required: true
    }
  }
};
const requiredDatapoints = {
  motion: {
    ACTUAL: {
      role: "sensor.motion",
      type: "boolean",
      required: true
    }
  },
  cie: {
    CIE: {
      role: "level.color.cie",
      type: "number",
      required: true
    },
    DIMMER: {
      role: "level.dimmer",
      type: "boolean",
      required: true
    },
    ON: {
      role: "switch.light",
      type: "boolean",
      required: true
    },
    ON_ACTUAL: {
      role: "state.light",
      type: "boolean",
      required: true
    },
    TEMPERATURE: {
      role: "level.color.temperature",
      type: "number",
      required: true
    }
  },
  dimmer: {
    SET: {
      role: "level.dimmer",
      type: "number",
      required: true
    },
    ACTUAL: {
      role: "value.dimmer",
      type: "number",
      required: true
    },
    ON_SET: {
      role: "switch.light",
      type: "boolean",
      required: true
    },
    ON_ACTUAL: {
      role: "switch.light",
      type: "boolean",
      required: true
    }
  },
  timeTable: {
    ACTUAL: {
      role: "text",
      type: "string",
      required: true
    },
    VEHICLE: {
      role: "text",
      type: "string",
      required: true
    },
    DIRECTION: {
      role: "text",
      type: "string",
      required: true
    },
    DELAY: {
      role: "indicator",
      type: "boolean",
      required: true
    }
  },
  ct: {
    DIMMER: {
      role: "level.dimmer",
      type: "number",
      required: true
    },
    ON: {
      role: "switch.light",
      type: "boolean",
      required: true
    },
    TEMPERATURE: {
      role: "level.color.temperature",
      type: "number",
      required: true
    }
  },
  window: {
    ACTUAL: {
      role: "sensor.window",
      type: "boolean",
      required: true
    }
  },
  humidity: {
    ACTUAL: {
      role: "value.humidity",
      type: "number",
      required: true
    }
  },
  hue: {
    DIMMER: {
      role: "level.dimmer",
      type: "number",
      required: true
    },
    ON: {
      role: "switch.light",
      type: "boolean",
      required: true
    },
    ON_ACTUAL: {
      role: "sensor.light",
      type: "boolean",
      required: true
    },
    TEMPERATURE: {
      role: "level.color.temperature",
      type: "number",
      required: true
    },
    HUE: {
      role: "level.color.hue",
      type: "number",
      required: false
    }
  },
  info: {
    ACTUAL: {
      role: "text",
      type: "string",
      required: true
    }
  },
  blind: {
    ACTUAL: {
      role: "value.blind",
      type: "number",
      required: true
    },
    SET: {
      role: "level.blind",
      type: "number",
      required: true
    },
    CLOSE: {
      role: "button.close.blind",
      type: "boolean",
      required: true
    },
    OPEN: {
      role: "button.open.blind",
      type: "boolean",
      required: true
    },
    STOP: {
      role: "button.stop.blind",
      type: "boolean",
      required: true
    },
    TILT_ACTUAL: {
      role: "value.tilt",
      type: "number",
      required: false
    },
    TILT_SET: {
      role: "level.tilt",
      type: "number",
      required: false
    },
    TILT_CLOSE: {
      role: "button.close.tilt",
      type: "boolean",
      required: false
    },
    TILT_OPEN: {
      role: "button.open.tilt",
      type: "boolean",
      required: false
    },
    TILT_STOP: {
      role: "button.stop.tilt",
      type: "boolean",
      required: false
    }
  },
  airCondition: {
    ACTUAL: {
      role: "value.temperature",
      type: "number",
      required: true
    },
    SET: {
      role: "level.temperature",
      type: "number",
      required: true
    },
    AUTO: {
      role: "switch",
      type: "boolean",
      required: false
    },
    COOL: {
      role: "switch",
      type: "boolean",
      required: false
    },
    BOOST: {
      role: "switch.boost",
      type: "boolean",
      required: false
    },
    ERROR: {
      role: "indicator.error",
      type: "boolean",
      required: false
    },
    HEAT: {
      role: "switch",
      type: "boolean",
      required: false
    },
    HUMINITY: {
      role: "value.humidity",
      type: "number",
      required: false
    },
    MAINTAIN: {
      role: "indicator.maintainance",
      type: "boolean",
      required: false
    },
    MODE: {
      role: "level.mode.aircondition",
      type: "number",
      required: true
    },
    OFF: {
      role: "switch",
      type: "boolean",
      required: true
    },
    POWER: {
      role: "switch",
      type: "boolean",
      required: false
    },
    SPEED: {
      role: "level.mode.fan",
      type: "number",
      required: false
    },
    SWING: {
      role: "switch.mode.swing",
      type: "boolean",
      required: false
    },
    UNREACH: {
      role: "indicator.maintenance.unreach",
      type: "boolean",
      required: false
    }
  },
  socket: {
    ACTUAL: {
      role: "switch",
      type: "boolean",
      required: false
    },
    SET: {
      role: "switch",
      type: "boolean",
      required: true
    }
  },
  light: {
    ACTUAL: {
      role: "sensor.light",
      type: "boolean",
      required: false
    },
    SET: {
      role: "switch.light",
      type: "boolean",
      required: true
    }
  },
  volume: {
    ACTUAL: {
      role: "value.volume",
      type: "number",
      required: true
    },
    SET: {
      role: "level.volume",
      type: "number",
      required: true
    },
    MUTE: {
      role: "media.mute",
      type: "boolean",
      required: true
    }
  },
  rgb: {
    RED: {
      role: "level.color.red",
      type: "number",
      required: true
    },
    GREEN: {
      role: "level.color.green",
      type: "number",
      required: true
    },
    BLUE: {
      role: "level.color.blue",
      type: "number",
      required: true
    },
    ON_ACTUAL: {
      role: "sensor.light",
      type: "boolean",
      required: true
    },
    ON: {
      role: "switch.light",
      type: "boolean",
      required: true
    },
    DIMMER: {
      role: "level.dimmer",
      type: "number",
      required: true
    },
    TEMPERATURE: {
      role: "level.color.temperature",
      type: "number",
      required: true
    },
    WHITE: {
      role: "level.color.white",
      type: "number",
      required: false
    }
  },
  rbgSingle: {
    RGB: {
      role: "level.color.rgb",
      type: "number",
      required: true
    },
    ON: {
      role: "switch.light",
      type: "boolean",
      required: true
    },
    DIMMER: {
      role: "level.dimmer",
      type: "number",
      required: true
    },
    TEMPERATURE: {
      role: "level.color.temperature",
      type: "number",
      required: true
    },
    ON_ACTUAL: {
      role: "sensor.light",
      type: "boolean",
      required: true
    }
  },
  slider: {
    SET: {
      role: "level",
      type: "number",
      required: true
    },
    ACTUAL: {
      role: "value",
      type: "number",
      required: true
    }
  },
  button: {
    SET: {
      role: "button",
      type: "boolean",
      required: true
    }
  },
  buttonSensor: {
    ACTUAL: {
      role: "button.press",
      type: "boolean",
      required: true
    }
  },
  temperature: {
    ACTUAL: {
      role: "value.temperature",
      type: "number",
      required: true
    },
    SECOND: {
      role: "value.humidity",
      type: "number",
      required: false
    }
  },
  "value.temperature": {
    ACTUAL: {
      role: "value.temperature",
      type: "number",
      required: true
    },
    SECOND: {
      role: "value.humidity",
      type: "number",
      required: false
    }
  },
  thermostat: {
    ACTUAL: {
      role: "value.temperature",
      type: "number",
      required: true
    },
    SET: {
      role: "level.temperature",
      type: "number",
      required: true
    },
    MODE: {
      role: "level.mode.thermostat",
      type: "number",
      required: true
    },
    BOOST: {
      role: "switch.boost",
      type: "boolean",
      required: false
    },
    AUTOMATIC: {
      role: "switch.mode.auto",
      type: "boolean",
      required: true
    },
    ERROR: {
      role: "indicator.error",
      type: "boolean",
      required: false
    },
    LOWBAT: {
      role: "indicator.maintainance.lowbat",
      type: "boolean",
      required: false
    },
    MANUAL: {
      role: "switch.mode.manual",
      type: "boolean",
      required: false
    },
    UNREACH: {
      role: "indicator.maintainance",
      type: "boolean",
      required: false
    },
    HUMINITY: {
      role: "value.humidity",
      type: "number",
      required: false
    },
    MAINTAIN: {
      role: "indicator.maintainance",
      type: "boolean",
      required: false
    },
    PARTY: {
      role: "switch.mode.party",
      type: "boolean",
      required: false
    },
    POWER: {
      role: "switch.power",
      type: "boolean",
      required: false
    },
    VACATION: {
      role: "switch",
      type: "boolean",
      required: false
    },
    WINDOWOPEN: {
      role: "switch",
      type: "boolean",
      required: false
    },
    WORKING: {
      role: "indicator.working",
      type: "boolean",
      required: false
    }
  }
  //
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CustomTemplates,
  defaultConfig,
  isConfig,
  requiredDatapoints,
  requiredOutdatedDataPoints
});
//# sourceMappingURL=config-manager-const.js.map
