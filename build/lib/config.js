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
var config_exports = {};
__export(config_exports, {
  Testconfig: () => Testconfig,
  welcomePopupPayload: () => welcomePopupPayload
});
module.exports = __toCommonJS(config_exports);
var import_color = require("./const/color");
const Testconfig = {
  screenSaverConfig: {
    mode: "standard",
    entitysConfig: {
      favoritEntity: [
        {
          entity: {
            type: "triggered",
            dp: "0_userdata.0.trigger1"
          },
          entityDateFormat: {
            type: "const",
            constVal: null
          },
          entityDecimalPlaces: {
            type: "const",
            constVal: null
          },
          entityFactor: {
            type: "const",
            constVal: null
          },
          entityIconColor: {
            type: "const",
            constVal: null
          },
          entityIconColorScale: {
            type: "const",
            constVal: null
          },
          entityIconOff: {
            type: "const",
            constVal: "home"
          },
          entityIconOn: {
            type: "const",
            constVal: "account"
          },
          entityIconSelect: {
            type: "const",
            constVal: null
          },
          entityOffColor: {
            type: "const",
            constVal: import_color.MSGreen
          },
          entityOffText: {
            type: "const",
            constVal: "entityOffText"
          },
          entityOnColor: {
            type: "const",
            constVal: import_color.MSRed
          },
          entityOnText: {
            type: "const",
            constVal: "entityOnText"
          },
          entityText: {
            type: "const",
            constVal: null
          },
          entityUnitText: {
            type: "const",
            constVal: "Adapter"
          }
        }
      ],
      leftEntity: [],
      bottomEntity: [
        {
          entity: {
            type: "state",
            dp: "0_userdata.0.test1"
          },
          entityDateFormat: {
            type: "const",
            constVal: null
          },
          entityDecimalPlaces: {
            type: "const",
            constVal: 0
          },
          entityFactor: {
            type: "const",
            constVal: 1
          },
          entityIconColor: {
            type: "const",
            constVal: null
          },
          entityIconColorScale: {
            type: "const",
            constVal: null
          },
          entityIconOff: {
            type: "const",
            constVal: "home"
          },
          entityIconOn: {
            type: "const",
            constVal: "home-outline"
          },
          entityIconSelect: {
            type: "const",
            constVal: null
          },
          entityOffColor: {
            type: "const",
            constVal: import_color.Yellow
          },
          entityOffText: {
            type: "const",
            constVal: "entityOffText"
          },
          entityOnColor: {
            type: "const",
            constVal: import_color.Green
          },
          entityOnText: {
            type: "const",
            constVal: "entityOnText"
          },
          entityText: {
            type: "const",
            constVal: null
          },
          entityUnitText: {
            type: "const",
            constVal: "Adapter"
          }
        },
        {
          entity: {
            type: "const",
            constVal: "Thursday, February 6th, 2014 9:20pm"
          },
          entityDateFormat: {
            type: "const",
            constVal: null
          },
          entityDecimalPlaces: {
            type: "const",
            constVal: null
          },
          entityFactor: {
            type: "const",
            constVal: null
          },
          entityIconColor: {
            type: "const",
            constVal: null
          },
          entityIconColorScale: {
            type: "const",
            constVal: null
          },
          entityIconOff: {
            type: "const",
            constVal: "home"
          },
          entityIconOn: {
            type: "const",
            constVal: "iconon"
          },
          entityIconSelect: {
            type: "const",
            constVal: "iconoff"
          },
          entityOffColor: {
            type: "const",
            constVal: (0, import_color.rgb_dec565)(import_color.Black)
          },
          entityOffText: {
            type: "const",
            constVal: "entityOffText"
          },
          entityOnColor: {
            type: "const",
            constVal: (0, import_color.rgb_dec565)(import_color.Green)
          },
          entityOnText: {
            type: "const",
            constVal: "entityOnText"
          },
          entityText: {
            type: "const",
            constVal: null
          },
          entityUnitText: {
            type: "const",
            constVal: "entityUnitText"
          }
        },
        {
          entity: {
            type: "const",
            constVal: "4"
          },
          entityDateFormat: {
            type: "const",
            constVal: null
          },
          entityDecimalPlaces: {
            type: "const",
            constVal: null
          },
          entityFactor: {
            type: "const",
            constVal: null
          },
          entityIconColor: {
            type: "const",
            constVal: null
          },
          entityIconColorScale: {
            type: "const",
            constVal: null
          },
          entityIconOff: {
            type: "const",
            constVal: "home"
          },
          entityIconOn: {
            type: "const",
            constVal: "iconon"
          },
          entityIconSelect: {
            type: "const",
            constVal: "iconoff"
          },
          entityOffColor: {
            type: "const",
            constVal: (0, import_color.rgb_dec565)(import_color.Black)
          },
          entityOffText: {
            type: "const",
            constVal: "entityOffText"
          },
          entityOnColor: {
            type: "const",
            constVal: (0, import_color.rgb_dec565)(import_color.Green)
          },
          entityOnText: {
            type: "const",
            constVal: "entityOnText"
          },
          entityText: {
            type: "const",
            constVal: null
          },
          entityUnitText: {
            type: "const",
            constVal: "entityUnitText"
          }
        },
        {
          entity: {
            type: "const",
            constVal: "5"
          },
          entityDateFormat: {
            type: "const",
            constVal: null
          },
          entityDecimalPlaces: {
            type: "const",
            constVal: null
          },
          entityFactor: {
            type: "const",
            constVal: null
          },
          entityIconColor: {
            type: "const",
            constVal: null
          },
          entityIconColorScale: {
            type: "const",
            constVal: null
          },
          entityIconOff: {
            type: "const",
            constVal: "home"
          },
          entityIconOn: {
            type: "const",
            constVal: "iconon"
          },
          entityIconSelect: {
            type: "const",
            constVal: "iconoff"
          },
          entityOffColor: {
            type: "const",
            constVal: (0, import_color.rgb_dec565)(import_color.Black)
          },
          entityOffText: {
            type: "const",
            constVal: "entityOffText"
          },
          entityOnColor: {
            type: "const",
            constVal: (0, import_color.rgb_dec565)(import_color.Green)
          },
          entityOnText: {
            type: "const",
            constVal: "entityOnText"
          },
          entityText: {
            type: "const",
            constVal: null
          },
          entityUnitText: {
            type: "const",
            constVal: "entityUnitText"
          }
        }
      ],
      indicatorEntity: [],
      mrIconEntity: [
        {
          entity: {
            type: "const",
            constVal: true
          },
          entityIconOff: {
            type: "const",
            constVal: "calendar-minus"
          },
          entityIconOn: {
            type: "const",
            constVal: "calendar-plus"
          },
          entityOffColor: {
            type: "const",
            constVal: import_color.White
          },
          entityOnColor: {
            type: "const",
            constVal: import_color.Red
          },
          entityValue: {
            type: "const",
            constVal: 5
          },
          entityValueDecimalPlace: {
            type: "const",
            constVal: 0
          },
          entityValueUnit: {
            type: "const",
            constVal: null
          },
          entityIconSelect: {
            type: "const",
            constVal: null
          }
        },
        {
          entity: {
            type: "const",
            constVal: false
          },
          entityIconOff: {
            type: "const",
            constVal: "calendar-minus"
          },
          entityIconOn: {
            type: "const",
            constVal: "home"
          },
          entityOffColor: {
            type: "const",
            constVal: import_color.White
          },
          entityOnColor: {
            type: "const",
            constVal: import_color.Red
          },
          entityValue: {
            type: "const",
            constVal: 2
          },
          entityValueDecimalPlace: {
            type: "const",
            constVal: 0
          },
          entityValueUnit: {
            type: "const",
            constVal: null
          },
          entityIconSelect: {
            type: "const",
            constVal: null
          }
        }
      ]
    },
    config: {
      momentLocale: "",
      locale: "",
      iconBig1: false,
      iconBig2: false
    }
  },
  topic: "nspanel/ns_panel2",
  name: "Wohnzimmer"
};
const welcomePopupPayload = "entityUpdateDetail~ -~Willkommen zum NSPanel~63488~~2000~~2000~  Einen sch\xF6nen Tag                w\xFCnschen dir                Armilar, TT-Tom, ticaki         & Kuckuckmann~2000~3~1~\uF4DD~2000";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Testconfig,
  welcomePopupPayload
});
//# sourceMappingURL=config.js.map
