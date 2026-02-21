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
var light_exports = {};
__export(light_exports, {
  lightTemplates: () => lightTemplates
});
module.exports = __toCommonJS(light_exports);
var import_Color = require("../const/Color");
const lightTemplates = {
  "light.shelly.rgbw2": {
    role: "rgbSingle",
    type: "light",
    adapter: "0_userdata.0",
    data: {
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
      colorMode: { type: "const", constVal: true },
      headline: { type: "const", constVal: "SHRGB2" },
      dimmer: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "level.brightness",
          dp: ""
        }
      },
      White: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "level.color.white",
          dp: ""
        },
        maxScale: {
          type: "const",
          constVal: 254
        },
        minScale: {
          type: "const",
          constVal: 0
        }
      },
      Red: {
        type: "triggered",
        mode: "auto",
        role: "level.color.red",
        dp: ""
      },
      Blue: {
        type: "triggered",
        mode: "auto",
        role: "level.color.blue",
        dp: ""
      },
      Green: {
        type: "triggered",
        mode: "auto",
        role: "level.color.green",
        dp: ""
      },
      entity1: {
        // button
        value: {
          type: "triggered",
          mode: "auto",
          role: "switch",
          dp: ""
        },
        decimal: void 0,
        factor: void 0,
        unit: void 0
      },
      entityInSel: {
        // button
        value: {
          type: "triggered",
          mode: "auto",
          role: "state",
          dp: ".lights.effect"
        },
        decimal: void 0,
        factor: void 0,
        unit: void 0
      },
      text1: {
        true: {
          type: "const",
          constVal: "Colour brightness"
        },
        false: void 0
      },
      text2: {
        true: {
          type: "const",
          constVal: "White brightness"
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
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  lightTemplates
});
//# sourceMappingURL=light.js.map
