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
var text_exports = {};
__export(text_exports, {
  textTemplates: () => textTemplates
});
module.exports = __toCommonJS(text_exports);
const textTemplates = [
  {
    template: "waste-calendar.plastic",
    role: "text.list",
    type: "text",
    adapter: "0_userdata.0",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "trash-can" },
          color: { type: "state", dp: ".1.color", mode: "auto", role: "state" }
        }
      },
      entity1: {
        value: { type: "const", constVal: true }
      },
      text: {
        true: { type: "state", dp: ".1.event", mode: "auto", role: "state" },
        false: void 0
      },
      text1: {
        true: { type: "state", dp: ".1.date", mode: "auto", role: "state" },
        false: void 0
      }
    }
  },
  {
    template: "waste-calendar.bio",
    role: "text.list",
    type: "text",
    adapter: "0_userdata.0",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "trash-can" },
          color: { type: "state", dp: ".2.color", mode: "auto", role: "state" }
        }
      },
      entity1: {
        value: { type: "const", constVal: true }
      },
      text: {
        true: { type: "state", dp: ".2.event", mode: "auto", role: "state" },
        false: void 0
      },
      text1: {
        true: { type: "state", dp: ".2.date", mode: "auto", role: "state" },
        false: void 0
      }
    }
  },
  {
    template: "waste-calendar.house",
    role: "text.list",
    type: "text",
    adapter: "0_userdata.0",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "trash-can" },
          color: { type: "state", dp: ".3.color", mode: "auto", role: "state" }
        }
      },
      entity1: {
        value: { type: "const", constVal: true }
      },
      text: {
        true: { type: "state", dp: ".3.event", mode: "auto", role: "state" },
        false: void 0
      },
      text1: {
        true: { type: "state", dp: ".3.date", mode: "auto", role: "state" },
        false: void 0
      }
    }
  },
  {
    template: "waste-calendar.paper",
    role: "text.list",
    type: "text",
    adapter: "0_userdata.0",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "trash-can" },
          color: { type: "state", dp: ".4.color", mode: "auto", role: "state" }
        }
      },
      entity1: {
        value: { type: "const", constVal: true }
      },
      text: {
        true: { type: "state", dp: ".4.event", mode: "auto", role: "state" },
        false: void 0
      },
      text1: {
        true: { type: "state", dp: ".4.date", mode: "auto", role: "state" },
        false: void 0
      }
    }
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  textTemplates
});
//# sourceMappingURL=text.js.map
