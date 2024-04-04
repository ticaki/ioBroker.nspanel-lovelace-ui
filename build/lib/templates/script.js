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
var script_exports = {};
__export(script_exports, {
  scriptTemplates: () => scriptTemplates
});
module.exports = __toCommonJS(script_exports);
var import_Color = require("../const/Color");
const scriptTemplates = {
  "script.socket": {
    role: "",
    adapter: "",
    type: "button",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "power-socket-de" },
          color: { type: "const", constVal: import_Color.Color.On }
        },
        false: {
          value: { type: "const", constVal: "power-socket-de" },
          color: { type: "const", constVal: import_Color.Color.Off }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ACTUAL/
        }
      },
      text: {
        true: { type: "const", constVal: "socket" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "on" },
        false: { type: "const", constVal: "off" }
      },
      setValue1: { type: "state", mode: "auto", role: "", dp: "", regexp: /\.SET/ }
    }
  },
  "script.light": {
    role: "",
    adapter: "",
    type: "button",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "lightbulb" },
          color: { type: "const", constVal: import_Color.Color.On }
        },
        false: {
          value: { type: "const", constVal: "lightbulb-outline" },
          color: { type: "const", constVal: import_Color.Color.Off }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ON_ACTUAL/
        }
      },
      text: {
        true: { type: "const", constVal: "lightbulb" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "on" },
        false: { type: "const", constVal: "off" }
      },
      setValue1: { type: "state", mode: "auto", role: "", dp: "", regexp: /\.SET/ }
    }
  },
  "script.hue": {
    role: "hue",
    adapter: "",
    type: "light",
    data: {
      headline: { type: "const", constVal: "HUE Light" },
      colorMode: { type: "const", constVal: true },
      icon: {
        true: {
          value: { type: "const", constVal: "lightbulb" },
          color: { type: "const", constVal: import_Color.Color.activated }
        },
        false: {
          value: { type: "const", constVal: "lightbulb-outline" },
          color: { type: "const", constVal: import_Color.Color.deactivated }
        },
        scale: void 0,
        maxBri: void 0,
        minBri: void 0
      },
      dimmer: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.DIMMER/
        }
      },
      hue: {
        type: "triggered",
        mode: "auto",
        role: "",
        dp: "",
        regexp: /\.HUE/
      },
      ct: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.TEMPERATUR/
        }
      },
      entity1: {
        // button
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ON/
        },
        decimal: void 0,
        factor: void 0,
        unit: void 0
      },
      text1: {
        true: {
          type: "const",
          constVal: "Brightness"
        },
        false: void 0
      },
      text2: {
        true: {
          type: "const",
          constVal: "Colour temperature"
        },
        false: void 0
      },
      text3: {
        true: {
          type: "const",
          constVal: "Color"
        },
        false: void 0
      }
    }
  },
  "script.rgbSingle": {
    role: "rgbSingle",
    adapter: "",
    type: "light",
    data: {
      headline: { type: "const", constVal: "RGB_Single Light" },
      colorMode: { type: "const", constVal: true },
      icon: {
        true: {
          value: { type: "const", constVal: "lightbulb" },
          color: { type: "const", constVal: import_Color.Color.activated }
        },
        false: {
          value: { type: "const", constVal: "lightbulb-outline" },
          color: { type: "const", constVal: import_Color.Color.deactivated }
        },
        scale: void 0,
        maxBri: void 0,
        minBri: void 0
      },
      dimmer: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.DIMMER/
        }
      },
      color: {
        true: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.RGB/
        },
        false: void 0
      },
      ct: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.TEMPERATUR/
        }
      },
      entity1: {
        // button
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ON/
        },
        decimal: void 0,
        factor: void 0,
        unit: void 0
      },
      text1: {
        true: {
          type: "const",
          constVal: "Brightness"
        },
        false: void 0
      },
      text2: {
        true: {
          type: "const",
          constVal: "Colour temperature"
        },
        false: void 0
      },
      text3: {
        true: {
          type: "const",
          constVal: "Color"
        },
        false: void 0
      }
    }
  },
  "script.rgbSingleHEX": {
    role: "rgb.hex",
    adapter: "",
    type: "light",
    data: {
      headline: { type: "const", constVal: "RGB_Single Light" },
      colorMode: { type: "const", constVal: true },
      icon: {
        true: {
          value: { type: "const", constVal: "lightbulb" },
          color: { type: "const", constVal: import_Color.Color.activated }
        },
        false: {
          value: { type: "const", constVal: "lightbulb-outline" },
          color: { type: "const", constVal: import_Color.Color.deactivated }
        },
        scale: void 0,
        maxBri: void 0,
        minBri: void 0
      },
      dimmer: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.DIMMER/
        }
      },
      color: {
        true: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.RGB/
        },
        false: void 0
      },
      ct: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.TEMPERATUR/
        }
      },
      entity1: {
        // button
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ON/
        },
        decimal: void 0,
        factor: void 0,
        unit: void 0
      },
      text1: {
        true: {
          type: "const",
          constVal: "Brightness"
        },
        false: void 0
      },
      text2: {
        true: {
          type: "const",
          constVal: "Colour temperature"
        },
        false: void 0
      },
      text3: {
        true: {
          type: "const",
          constVal: "Color"
        },
        false: void 0
      }
    }
  },
  "script.rgb": {
    role: "rgbThree",
    adapter: "",
    type: "light",
    data: {
      headline: { type: "const", constVal: "RGB Light" },
      colorMode: { type: "const", constVal: true },
      icon: {
        true: {
          value: { type: "const", constVal: "lightbulb" },
          color: { type: "const", constVal: import_Color.Color.activated }
        },
        false: {
          value: { type: "const", constVal: "lightbulb-outline" },
          color: { type: "const", constVal: import_Color.Color.deactivated }
        },
        scale: void 0,
        maxBri: void 0,
        minBri: void 0
      },
      dimmer: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.DIMMER/
        }
      },
      ct: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.TEMPERATUR/
        }
      },
      Red: {
        type: "triggered",
        mode: "auto",
        role: "",
        dp: "",
        regexp: /\.RED/
      },
      Blue: {
        type: "triggered",
        mode: "auto",
        role: "",
        dp: "",
        regexp: /\.BLUE/
      },
      Green: {
        type: "triggered",
        mode: "auto",
        role: "",
        dp: "",
        regexp: /\.GREEN/
      },
      entity1: {
        // button
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ON/
        },
        decimal: void 0,
        factor: void 0,
        unit: void 0
      },
      text1: {
        true: {
          type: "const",
          constVal: "Brightness"
        },
        false: void 0
      },
      text2: {
        true: {
          type: "const",
          constVal: "Colour temperature"
        },
        false: void 0
      },
      text3: {
        true: {
          type: "const",
          constVal: "Color"
        },
        false: void 0
      }
    }
  },
  "script.ct": {
    role: "ct",
    adapter: "",
    type: "light",
    data: {
      headline: { type: "const", constVal: "CT Light" },
      colorMode: { type: "const", constVal: false },
      icon: {
        true: {
          value: { type: "const", constVal: "lightbulb" },
          color: { type: "const", constVal: import_Color.Color.On }
        },
        false: {
          value: { type: "const", constVal: "lightbulb-outline" },
          color: { type: "const", constVal: import_Color.Color.Off }
        },
        scale: void 0,
        maxBri: void 0,
        minBri: void 0
      },
      dimmer: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.DIMMER/
        }
      },
      ct: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.TEMPERATUR/
        }
      },
      entity1: {
        // button
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ON/
        },
        decimal: void 0,
        factor: void 0,
        unit: void 0
      },
      text1: {
        true: {
          type: "const",
          constVal: "Brightness"
        },
        false: void 0
      },
      text2: {
        true: {
          type: "const",
          constVal: "Colour temperature"
        },
        false: void 0
      }
    }
  },
  "script.dimmer": {
    role: "dimmer",
    adapter: "",
    type: "light",
    data: {
      headline: { type: "const", constVal: "dimmer Light" },
      icon: {
        true: {
          value: { type: "const", constVal: "lightbulb" },
          color: { type: "const", constVal: import_Color.Color.On }
        },
        false: {
          value: { type: "const", constVal: "lightbulb-outline" },
          color: { type: "const", constVal: import_Color.Color.Off }
        },
        scale: void 0,
        maxBri: void 0,
        minBri: void 0
      },
      dimmer: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.SET/
        }
      },
      entity1: {
        // button
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ON_SET/
        },
        decimal: void 0,
        factor: void 0,
        unit: void 0
      },
      text1: {
        true: {
          type: "const",
          constVal: "Brightness"
        },
        false: void 0
      }
    }
  },
  "script.gate": {
    role: "",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "garage-open" },
          color: { type: "const", constVal: import_Color.Color.open }
        },
        false: {
          value: { type: "const", constVal: "garage" },
          color: { type: "const", constVal: import_Color.Color.close }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ACTUAL/
        }
      },
      text: {
        true: { type: "const", constVal: "Garage" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "open" },
        false: { type: "const", constVal: "closed" }
      }
    }
  },
  "script.door": {
    role: "",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "door-open" },
          color: { type: "const", constVal: import_Color.Color.open }
        },
        false: {
          value: { type: "const", constVal: "door-closed" },
          color: { type: "const", constVal: import_Color.Color.close }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ACTUAL/
        }
      },
      text: {
        true: { type: "const", constVal: "door" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "open" },
        false: { type: "const", constVal: "closed" }
      }
    }
  },
  "script.motion": {
    role: "",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "motion-sensor" },
          color: { type: "const", constVal: import_Color.Color.On }
        },
        false: {
          value: { type: "const", constVal: "motion-sensor" },
          color: { type: "const", constVal: import_Color.Color.Off }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ACTUAL/
        }
      },
      text: {
        true: { type: "const", constVal: "motion" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "On" },
        false: { type: "const", constVal: "Off" }
      }
    }
  },
  "script.humidity": {
    role: "",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "water-percent" },
          color: { type: "const", constVal: import_Color.Color.Green }
        },
        false: {
          value: { type: "const", constVal: "wwater-percent" },
          color: { type: "const", constVal: import_Color.Color.Red }
        },
        scale: {
          type: "const",
          constVal: { val_min: 0, val_max: 100, val_best: 60 }
        },
        maxBri: void 0,
        minBri: void 0
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ACTUAL/
        }
      },
      entity2: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ACTUAL/
        },
        unit: { type: "const", constVal: "%" }
      },
      text: {
        true: { type: "const", constVal: "humidity" },
        false: void 0
      }
    }
  },
  "script.temperature": {
    role: "",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "thermometer" },
          color: { type: "const", constVal: import_Color.Color.Green }
        },
        false: {
          value: { type: "const", constVal: "thermometer" },
          color: { type: "const", constVal: import_Color.Color.Red }
        },
        scale: {
          type: "const",
          constVal: { val_min: 0, val_max: 40, val_best: 25 }
        },
        maxBri: void 0,
        minBri: void 0
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ACTUAL/
        }
      },
      entity2: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ACTUAL/
        },
        unit: { type: "const", constVal: "\xB0C" }
      },
      text: {
        true: { type: "const", constVal: "temperature" },
        false: void 0
      }
    }
  },
  "script.lock": {
    role: "",
    adapter: "",
    type: "button",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "lock" },
          color: { type: "const", constVal: import_Color.Color.MSGreen }
        },
        false: {
          value: { type: "const", constVal: "lock-open-variant" },
          color: { type: "const", constVal: import_Color.Color.MSRed }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ACTUAL/
        }
      },
      text: {
        true: { type: "const", constVal: "lock" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "lock" },
        false: { type: "const", constVal: "unlock" }
      },
      setValue1: { type: "state", mode: "auto", role: "", dp: "", regexp: /\.SET/ }
    }
  },
  "script.slider": {
    role: "",
    adapter: "",
    type: "number",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "plus-minus-variant" },
          color: { type: "const", constVal: import_Color.Color.HMIOff }
        },
        false: void 0
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ACTUAL/
        },
        set: {
          type: "state",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.SET/
        }
      },
      text: {
        true: { type: "const", constVal: "value" },
        false: void 0
      }
    }
  },
  // Mute sollte icon true/false steuern
  "script.volume": {
    role: "",
    adapter: "",
    type: "number",
    data: {
      icon: {
        true: {
          value: {
            type: "triggered",
            mode: "auto",
            role: "",
            dp: "",
            regexp: /\.ACTUAL/,
            read: `const v = Math.round(val / 10)
                        switch (v) {
                            case 0:
                                return 'volume-mute';
                            case 1:
                            case 2:
                            case 3:
                                return 'volume-low'
                            case 4:
                            case 5:
                            case 6:
                                return 'volume-medium'
                            case 7:
                            case 8:
                            case 9:
                            case 10:
                            default:
                                return 'volume-high';}`
          },
          color: { type: "const", constVal: import_Color.Color.Yellow }
        },
        false: {
          value: { type: "const", constVal: "volume-mute" },
          color: { type: "const", constVal: import_Color.Color.Red }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.ACTUAL/
        },
        set: {
          type: "state",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.SET/
        }
      },
      text: {
        true: { type: "const", constVal: "volume" },
        false: void 0
      }
    }
  },
  "script.warning": {
    role: "",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "alert-outline" },
          color: { type: "triggered", mode: "auto", role: "", dp: "", regexp: /\.LEVEL/ }
        },
        false: void 0
      },
      entity1: {
        value: { type: "const", constVal: true }
      },
      text: {
        true: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.TITLE/
        },
        false: void 0
      },
      text1: {
        true: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.INFO/
        },
        false: void 0
      }
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  scriptTemplates
});
//# sourceMappingURL=script.js.map
