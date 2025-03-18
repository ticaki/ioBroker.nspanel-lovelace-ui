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
var number_exports = {};
__export(number_exports, {
  numberTemplates: () => numberTemplates
});
module.exports = __toCommonJS(number_exports);
var import_Color = require("../const/Color");
const numberTemplates = {
  "number.volume": {
    role: "",
    adapter: "",
    type: "button",
    data: {
      icon: {
        true: {
          value: {
            type: "triggered",
            mode: "auto",
            role: "value.volume",
            dp: "",
            read: `{
                            if (val > 66) {
                                return 'volume-high';
                            }
                            if (val > 33) {
                                return 'volume-medium';
                            }
                            if (val > 0) {
                                return 'volume-low';
                            }
                            return 'volume-mute';
                        }`
          },
          text: {
            value: {
              type: "triggered",
              mode: "auto",
              role: "value.volume",
              dp: ""
            },
            unit: { type: "const", constVal: "%" }
          },
          color: { type: "const", constVal: import_Color.Color.Red }
        },
        false: void 0,
        scale: { type: "const", constVal: { min: 0, max: 100 } }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "value.volume",
          dp: ""
        },
        set: {
          type: "state",
          mode: "auto",
          role: "level.volume",
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "volume" },
        false: void 0
      }
    }
  },
  "number.slider": {
    role: "",
    adapter: "",
    type: "button",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "plus-minus-variant" },
          text: {
            value: {
              type: "state",
              mode: "auto",
              role: ["value", "level"],
              dp: ""
            },
            unit: { type: "const", constVal: "%" }
          },
          color: { type: "const", constVal: import_Color.Color.Red }
        },
        false: void 0,
        scale: { type: "const", constVal: { min: 0, max: 100 } }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: ["value", "level"],
          dp: ""
        },
        set: {
          type: "state",
          mode: "auto",
          role: "level",
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "slider" },
        false: void 0
      }
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  numberTemplates
});
//# sourceMappingURL=number.js.map
