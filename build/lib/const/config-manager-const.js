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
  requiredDatapoints: () => requiredDatapoints
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
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CustomTemplates,
  defaultConfig,
  isConfig,
  requiredDatapoints
});
//# sourceMappingURL=config-manager-const.js.map
