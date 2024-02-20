"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var text_exports = {};
__export(text_exports, {
  textTemplates: () => textTemplates
});
module.exports = __toCommonJS(text_exports);
var Color = __toESM(require("../const/Color"));
const textTemplates = [
  {
    template: "text.window.isOpen",
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "window-open-variant" },
          color: { type: "const", constVal: Color.Cyan }
        },
        false: {
          value: { type: "const", constVal: "window-closed-variant" },
          color: { type: "const", constVal: Color.Green }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "sensor.window",
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "text" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "open" },
        false: { type: "const", constVal: "close" }
      }
    }
  },
  {
    template: "text.window.isClose",
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "window-open-variant" },
          color: { type: "const", constVal: Color.Cyan }
        },
        false: {
          value: { type: "const", constVal: "window-closed-variant" },
          color: { type: "const", constVal: Color.Green }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "sensor.window",
          dp: "",
          read: "return !val"
        }
      },
      text: {
        true: { type: "const", constVal: "text" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "open" },
        false: { type: "const", constVal: "close" }
      }
    }
  },
  {
    template: "text.temperature",
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "temperature-celsius" },
          text: {
            type: "triggered",
            mode: "auto",
            role: "value.temperature",
            dp: "",
            read: "return Math.round(val*10)/10"
          },
          color: { type: "const", constVal: Color.Red }
        },
        false: {
          value: { type: "const", constVal: "temperature-celsius" },
          color: { type: "const", constVal: Color.Blue }
        },
        scale: { type: "const", constVal: { min: 0, max: 30 } }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "value.temperature",
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "Temperature" },
        false: void 0
      },
      text1: {
        true: {
          type: "triggered",
          mode: "auto",
          role: "value.temperature",
          dp: "",
          read: "return Math.round(parseFloat(val)*10)/10"
        },
        false: void 0
      }
    }
  },
  {
    template: "text.battery",
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: {
            type: "triggered",
            mode: "auto",
            role: "value.battery",
            dp: "",
            read: `const v = Math.round(val / 10);
                        switch (v) {
                            case 0:
                                return 'battery-outline';
                            case 1:
                            case 2:
                            case 3:
                            case 4:
                            case 5:
                            case 6:
                            case 7:
                            case 8:
                            case 9:
                                return 'battery-' + v + '0';
                            case 10:
                            default:
                                return 'battery';}`
          },
          text: {
            type: "triggered",
            mode: "auto",
            role: "value.battery",
            dp: ""
          },
          color: {
            type: "const",
            constVal: Color.Green
          }
        },
        false: {
          value: void 0,
          color: {
            type: "const",
            constVal: Color.Red
          }
        },
        scale: { type: "const", constVal: { val_min: 10, val_max: 50, log10: "max" } }
      },
      entity1: {
        value: {
          type: "state",
          mode: "auto",
          role: "value.battery",
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "Battery" },
        false: void 0
      },
      entity2: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "value.battery",
          dp: ""
        },
        unit: { type: "const", constVal: "%" }
      }
    }
  },
  {
    template: "text.battery.low",
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "battery-outline" },
          color: { type: "const", constVal: Color.Red }
        },
        false: {
          value: { type: "const", constVal: "battery" },
          color: { type: "const", constVal: Color.Green }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "indicator.lowbat",
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "Battery" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "ok" },
        false: { type: "const", constVal: "low" }
      }
    }
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  textTemplates
});
//# sourceMappingURL=text.js.map
