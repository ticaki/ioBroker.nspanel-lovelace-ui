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
            dp: "accuweather.0.Current.Temperature"
          },
          entityDateFormat: {
            type: "const",
            constVal: null
          },
          entityDecimalPlaces: {
            type: "const",
            constVal: null
          },
          entityFactor: void 0,
          entityIconColor: {
            type: "state",
            read: (val) => {
              switch (val) {
                case 24:
                case 30:
                case 31:
                  return (0, import_color.rgb_dec565)(import_color.swExceptional);
                case 7:
                case 8:
                case 38:
                  return (0, import_color.rgb_dec565)(import_color.swCloudy);
                case 11:
                  return (0, import_color.rgb_dec565)(import_color.swFog);
                case 25:
                  return (0, import_color.rgb_dec565)(import_color.swHail);
                case 15:
                  return (0, import_color.rgb_dec565)(import_color.swLightning);
                case 16:
                case 17:
                case 41:
                case 42:
                  return (0, import_color.rgb_dec565)(import_color.swLightningRainy);
                case 33:
                case 34:
                case 37:
                  return (0, import_color.rgb_dec565)(import_color.swClearNight);
                case 3:
                case 4:
                case 6:
                case 35:
                case 36:
                  return (0, import_color.rgb_dec565)(import_color.swPartlycloudy);
                case 18:
                  return (0, import_color.rgb_dec565)(import_color.swPouring);
                case 12:
                case 13:
                case 14:
                case 26:
                case 39:
                case 40:
                  return (0, import_color.rgb_dec565)(import_color.swRainy);
                case 19:
                case 20:
                case 21:
                case 22:
                case 23:
                case 43:
                case 44:
                  return (0, import_color.rgb_dec565)(import_color.swSnowy);
                case 29:
                  return (0, import_color.rgb_dec565)(import_color.swSnowyRainy);
                case 1:
                case 2:
                case 5:
                  return (0, import_color.rgb_dec565)(import_color.swSunny);
                case 32:
                  return (0, import_color.rgb_dec565)(import_color.swWindy);
                default:
                  return (0, import_color.rgb_dec565)(import_color.White);
              }
            },
            dp: "accuweather.0.Current.WeatherIcon"
          },
          entityIconColorScale: void 0,
          entityIconOn: {
            type: "triggered",
            dp: "accuweather.0.Current.WeatherIcon",
            read: (val) => {
              switch (val) {
                case 30:
                  return "weather-sunny-alert";
                case 24:
                case 31:
                  return "snowflake-alert";
                case 7:
                case 8:
                case 38:
                  return "weather-cloudy";
                case 11:
                  return "weather-fog";
                case 25:
                  return "weather-hail";
                case 15:
                  return "weather-lightning";
                case 16:
                case 17:
                case 41:
                case 42:
                  return "weather-lightning-rainy";
                case 33:
                case 34:
                case 37:
                  return "weather-night";
                case 3:
                case 4:
                case 6:
                case 35:
                case 36:
                  return "weather-partly-cloudy";
                case 18:
                  return "weather-pouring";
                case 12:
                case 13:
                case 14:
                case 26:
                case 39:
                case 40:
                  return "weather-rainy";
                case 19:
                case 20:
                case 21:
                case 22:
                case 23:
                case 43:
                case 44:
                  return "weather-snowy";
                case 29:
                  return "weather-snowy-rainy";
                case 1:
                case 2:
                case 5:
                  return "weather-sunny";
                case 32:
                  return "weather-windy";
                default:
                  return "alert-circle-outline";
              }
            }
          },
          entityIconOff: void 0,
          entityIconSelect: void 0,
          entityOffColor: void 0,
          entityOffText: void 0,
          entityOnColor: void 0,
          entityOnText: void 0,
          entityText: void 0,
          entityUnitText: {
            type: "const",
            constVal: "\xB0C"
          }
        }
      ],
      leftEntity: [],
      bottomEntity: [
        {
          entity: {
            type: "state",
            dp: "accuweather.0.Daily.Day1.Sunrise",
            forceType: "string"
          },
          entityDateFormat: {
            type: "const",
            constVal: JSON.stringify({ hour: "2-digit", minute: "2-digit" })
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
            constVal: import_color.Yellow
          },
          entityIconColorScale: void 0,
          entityIconOff: void 0,
          entityIconOn: {
            type: "const",
            constVal: "weather-sunset-up"
          },
          entityIconSelect: void 0,
          entityOffColor: {
            type: "const",
            constVal: import_color.Yellow
          },
          entityOffText: void 0,
          entityOnColor: void 0,
          entityOnText: void 0,
          entityText: {
            type: "const",
            constVal: "Sonne"
          },
          entityUnitText: void 0
        },
        {
          entity: {
            type: "state",
            dp: "accuweather.0.Current.WindSpeed"
          },
          entityDateFormat: void 0,
          entityDecimalPlaces: {
            type: "const",
            constVal: 1
          },
          entityFactor: {
            type: "const",
            constVal: 1e3 / 3600
          },
          entityIconColor: void 0,
          entityIconColorScale: {
            type: "const",
            constVal: { val_min: 0, val_max: 120 }
          },
          entityIconOff: void 0,
          entityIconOn: {
            type: "const",
            constVal: "weather-windy"
          },
          entityIconSelect: void 0,
          entityOffColor: void 0,
          entityOffText: void 0,
          entityOnColor: void 0,
          entityOnText: void 0,
          entityText: {
            type: "const",
            constVal: "Wind"
          },
          entityUnitText: {
            type: "const",
            constVal: "m/s"
          }
        },
        {
          entity: {
            type: "state",
            dp: "accuweather.0.Current.WindGust"
          },
          entityDateFormat: void 0,
          entityDecimalPlaces: {
            type: "const",
            constVal: 1
          },
          entityFactor: {
            type: "const",
            constVal: 1e3 / 3600
          },
          entityIconColor: void 0,
          entityIconColorScale: {
            type: "const",
            constVal: { val_min: 0, val_max: 120 }
          },
          entityIconOff: void 0,
          entityIconOn: {
            type: "const",
            constVal: "weather-tornado"
          },
          entityIconSelect: void 0,
          entityOffColor: void 0,
          entityOffText: void 0,
          entityOnColor: void 0,
          entityOnText: void 0,
          entityText: {
            type: "const",
            constVal: "B\xF6en"
          },
          entityUnitText: {
            type: "const",
            constVal: "m/s"
          }
        },
        {
          entity: {
            type: "state",
            dp: "accuweather.0.Current.WindDirectionText"
          },
          entityDateFormat: void 0,
          entityDecimalPlaces: {
            type: "const",
            constVal: 0
          },
          entityFactor: void 0,
          entityIconColor: void 0,
          entityIconColorScale: void 0,
          entityIconOff: void 0,
          entityIconOn: {
            type: "const",
            constVal: "windsock"
          },
          entityIconSelect: void 0,
          entityOffColor: void 0,
          entityOffText: void 0,
          entityOnColor: {
            type: "const",
            constVal: import_color.White
          },
          entityOnText: void 0,
          entityText: {
            type: "const",
            constVal: "Windr."
          },
          entityUnitText: {
            type: "const",
            constVal: "\xB0"
          }
        }
      ],
      indicatorEntity: [],
      mrIconEntity: [
        {
          entity: {
            type: "internal",
            dp: "Relais1"
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
      locale: "de-DE",
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
