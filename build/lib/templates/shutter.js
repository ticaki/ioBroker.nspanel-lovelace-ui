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
var shutter_exports = {};
__export(shutter_exports, {
  shutterTemplates: () => shutterTemplates
});
module.exports = __toCommonJS(shutter_exports);
var Color = __toESM(require("../const/Color"));
const shutterTemplates = [
  {
    template: "generic.shutter",
    role: "rgb",
    type: "shutter",
    adapter: "",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "window-shutter-open" },
          color: { type: "const", constVal: Color.Yellow }
        },
        false: {
          value: { type: "const", constVal: "window-shutter" },
          color: { type: "const", constVal: Color.HMIOff }
        },
        scale: void 0,
        maxBri: void 0,
        minBri: void 0
      },
      entity1: {
        value: { mode: "auto", role: "level.blind", type: "triggered", dp: "" },
        decimal: void 0,
        factor: void 0,
        unit: void 0,
        minScale: { type: "const", constVal: 0 },
        maxScale: { type: "const", constVal: 100 }
      },
      entity2: {
        value: { mode: "auto", role: "level.tilt", type: "triggered", dp: "" },
        decimal: void 0,
        factor: void 0,
        unit: void 0,
        minScale: { type: "const", constVal: 0 },
        maxScale: { type: "const", constVal: 100 }
      },
      text: {
        true: {
          type: "const",
          constVal: "text"
        },
        false: void 0
      },
      headline: {
        type: "const",
        constVal: "Shutter"
      },
      text1: {
        true: {
          type: "const",
          constVal: "text1"
        },
        false: void 0
      },
      text2: {
        true: {
          type: "const",
          constVal: "text2"
        },
        false: void 0
      },
      up: {
        type: "state",
        dp: "",
        mode: "auto",
        role: ["button.open.blind", "button.open"]
      },
      down: {
        type: "state",
        dp: "",
        mode: "auto",
        role: ["button.close.blind", "button.close"]
      },
      up2: {
        type: "state",
        dp: "",
        mode: "auto",
        role: ["button.open.tilt"]
      },
      stop2: {
        type: "state",
        dp: "",
        mode: "auto",
        role: ["button.stop.tilt"]
      }
    }
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  shutterTemplates
});
//# sourceMappingURL=shutter.js.map
