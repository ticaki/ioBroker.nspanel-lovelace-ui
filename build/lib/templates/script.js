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
          value: { type: "const", constVal: "power-soket-de" },
          color: { type: "const", constVal: import_Color.Color.Off }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "",
          dp: "",
          regexp: /\.SET/
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
          regexp: /\.SET/
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
      colorMode: { type: "const", constVal: "hue" },
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
          constVal: "brightness"
        },
        false: void 0
      },
      text2: {
        true: {
          type: "const",
          constVal: "Colour brightness"
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
      colorMode: { type: "const", constVal: "none" },
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
          constVal: "brightness"
        },
        false: void 0
      },
      text2: {
        true: {
          type: "const",
          constVal: "Colour brightness"
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
      colorMode: { type: "const", constVal: "none" },
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
          constVal: "brightness"
        },
        false: void 0
      },
      text2: {
        true: {
          type: "const",
          constVal: "Colour brightness"
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
      colorMode: { type: "const", constVal: "none" },
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
          constVal: "brightness"
        },
        false: void 0
      },
      text2: {
        true: {
          type: "const",
          constVal: "Colour brightness"
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
      colorMode: { type: "const", constVal: "ct" },
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
          constVal: "brightness"
        },
        false: void 0
      },
      text2: {
        true: {
          type: "const",
          constVal: "Colour brightness"
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
      colorMode: { type: "const", constVal: "none" },
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
          constVal: "brightness"
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
