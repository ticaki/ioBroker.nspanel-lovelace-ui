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
var shutter_exports = {};
__export(shutter_exports, {
  shutterTemplates: () => shutterTemplates
});
module.exports = __toCommonJS(shutter_exports);
var import_Color = require("../const/Color");
const shutterTemplates = {
  "generic.shutter": {
    /**
     * zu 100% geschlossen zu 0% geschlossen read und write mit jeweils 100-val benutzen um das zu 100% geöffnet zu ändern.
     */
    role: "",
    type: "shutter",
    adapter: "",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "window-shutter-open" },
          color: { type: "const", constVal: import_Color.Color.open }
        },
        false: {
          value: { type: "const", constVal: "window-shutter" },
          color: { type: "const", constVal: import_Color.Color.close }
        },
        scale: void 0,
        maxBri: void 0,
        minBri: void 0
      },
      // 1. slider
      entity1: {
        // button
        value: { mode: "auto", role: "level.blind", type: "triggered", dp: "" },
        decimal: void 0,
        factor: void 0,
        unit: void 0,
        minScale: { type: "const", constVal: 0 },
        maxScale: { type: "const", constVal: 100 }
      },
      // 2. slider
      entity2: {
        // button
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
      /**
       * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
       */
      //valueList: { type: 'const', constVal: 'home?butter' },
      /**
       * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
       */
      //setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
    }
  },
  "shutter.shelly.2PM": {
    role: "",
    type: "shutter",
    template: "shutter.basic.onlyV",
    adapter: "0_userdata.0",
    data: {
      // 1. slider
      entity1: {
        // button
        value: { mode: "auto", role: "level.blind", type: "triggered", dp: ".Shutter.Position" },
        decimal: void 0,
        factor: void 0,
        unit: void 0,
        minScale: { type: "const", constVal: 0 },
        maxScale: { type: "const", constVal: 100 }
      },
      // 2. slider
      entity2: void 0,
      headline: {
        type: "const",
        constVal: "SHSW-25"
      },
      up: {
        type: "state",
        dp: ".Shutter.Open",
        mode: "auto",
        role: ["button"]
      },
      down: {
        type: "state",
        dp: ".Shutter.Close",
        mode: "auto",
        role: ["button"]
      },
      stop: {
        type: "state",
        dp: ".Shutter.Pause",
        mode: "auto",
        role: ["button"]
      }
    }
  },
  "shutter.basic": {
    role: "",
    type: "shutter",
    adapter: "",
    data: {
      up: void 0,
      down: void 0,
      stop: void 0,
      icon: {
        true: {
          value: { type: "const", constVal: "window-shutter-open" },
          color: { type: "const", constVal: import_Color.Color.On }
        },
        false: {
          value: { type: "const", constVal: "window-shutter" },
          color: { type: "const", constVal: import_Color.Color.Off }
        }
      },
      text: {
        true: {
          type: "const",
          constVal: "Shutter control"
        },
        false: void 0
      },
      text1: {
        true: {
          type: "const",
          constVal: "up/down"
        },
        false: void 0
      },
      text2: {
        true: {
          type: "const",
          constVal: "tilt"
        },
        false: void 0
      }
    }
  },
  "shutter.basic.onlyV": {
    role: "",
    type: "shutter",
    template: "shutter.basic",
    adapter: "",
    data: {
      up: void 0,
      down: void 0,
      text2: {
        true: null,
        false: null
      }
    }
  },
  "shutter.deconz.ikea.fyrtur": {
    role: "",
    type: "shutter",
    template: "shutter.basic.onlyV",
    adapter: "deconz",
    data: {
      // 1. slider
      entity1: {
        // button
        value: { mode: "auto", role: "level.value", type: "triggered", dp: ".lift" },
        decimal: void 0,
        factor: void 0,
        unit: void 0,
        minScale: { type: "const", constVal: 1 },
        maxScale: { type: "const", constVal: 78 }
      },
      up: { mode: "auto", role: "level.value", type: "state", dp: ".lift", write: "return 1" },
      down: { mode: "auto", role: "level.value", type: "state", dp: ".lift", write: "return 78" },
      stop: {
        type: "state",
        dp: ".stop",
        mode: "auto",
        role: ["button"]
      }
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  shutterTemplates
});
//# sourceMappingURL=shutter.js.map
