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
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
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
  },
  "button.esphome.powerplug": {
    role: "",
    type: "button",
    adapter: "esphome",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "power-plug" },
          color: { type: "const", constVal: Color.Green }
        },
        false: {
          value: { type: "const", constVal: "power-plug-off-outline" },
          color: { type: "const", constVal: Color.Gray }
        }
      },
      entity1: {
        value: {
          mode: "auto",
          type: "triggered",
          role: "",
          dp: "",
          regexp: /esphome\.[0-9]+\..+?\.Switch\..+?\.state/
        }
      },
      text: {
        true: { type: "const", constVal: "Plug" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "on" },
        false: { type: "const", constVal: "off" }
      },
      setValue1: {
        mode: "auto",
        type: "state",
        role: "",
        dp: "",
        regexp: /esphome\.[0-9]+\..+?\.Switch\..+?\.state/
      }
    }
  },
  "button.service.adapter.noconnection": {
    role: "",
    type: "button",
    adapter: "",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "checkbox-intermediate" },
          color: { type: "const", constVal: Color.Yellow },
          text: { value: { type: "internal", dp: "///AdapterNoConnection" } }
        },
        false: {
          value: { type: "const", constVal: "checkbox-marked-outline" },
          color: { type: "const", constVal: Color.Green },
          text: { value: { type: "internal", dp: "///AdapterNoConnection" } }
        }
      },
      entity1: {
        value: { type: "internal", dp: "///AdapterNoConnectionBoolean" }
      },
      text: {
        true: { type: "const", constVal: "Not connected" },
        false: { type: "const", constVal: "all connected" }
      },
      text1: { true: { type: "internal", dp: "///AdapterNoConnection" }, false: void 0 }
    }
  },
  "button.service.adapter.stopped": {
    role: "",
    type: "button",
    adapter: "",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "checkbox-intermediate" },
          color: { type: "const", constVal: Color.Red },
          text: { value: { type: "internal", dp: "///AdapterStopped" } }
        },
        false: {
          value: { type: "const", constVal: "checkbox-marked-outline" },
          color: { type: "const", constVal: Color.Green },
          text: { value: { type: "internal", dp: "///AdapterStopped" } }
        }
      },
      entity1: {
        value: { type: "internal", dp: "///AdapterStoppedBoolean" }
      },
      text: {
        true: { type: "const", constVal: "Stopped" },
        false: void 0
      },
      text1: { true: { type: "internal", dp: "///AdapterStopped" }, false: void 0 }
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buttonTemplates
});
//# sourceMappingURL=button.js.map
