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
var button_exports = {};
__export(button_exports, {
  buttonTemplates: () => buttonTemplates
});
module.exports = __toCommonJS(button_exports);
var Color = __toESM(require("../const/Color"));
const buttonTemplates = {
  "button.iconLeftSize": {
    role: "text.list",
    type: "button",
    adapter: "",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "size-m" },
          color: { type: "const", constVal: Color.Yellow }
        },
        false: {
          value: void 0,
          color: { type: "const", constVal: Color.Green }
        }
      },
      entity1: {
        value: {
          type: "internal",
          dp: "cmd/bigIconLeft"
        }
      },
      text: {
        true: { type: "const", constVal: "IconLeft" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "big" },
        false: { type: "const", constVal: "medium" }
      },
      setValue1: {
        type: "internal",
        dp: "cmd/bigIconLeft"
      }
    }
  },
  "button.iconRightSize": {
    role: "text.list",
    type: "button",
    adapter: "",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "size-m" },
          color: { type: "const", constVal: Color.Yellow }
        },
        false: {
          value: void 0,
          color: { type: "const", constVal: Color.Green }
        }
      },
      entity1: {
        value: {
          type: "internal",
          dp: "cmd/bigIconRight"
        }
      },
      text: {
        true: { type: "const", constVal: "IconRight" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "big" },
        false: { type: "const", constVal: "medium" }
      },
      setValue1: {
        type: "internal",
        dp: "cmd/bigIconRight"
      }
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buttonTemplates
});
//# sourceMappingURL=button.js.map
