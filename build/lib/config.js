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
var config_exports = {};
__export(config_exports, {
  Testconfig: () => Testconfig,
  welcomePopupPayload: () => welcomePopupPayload
});
module.exports = __toCommonJS(config_exports);
var Color = __toESM(require("./const/color"));
const Testconfig = {
  screenSaverConfig: {
    mode: "standard",
    rotationTime: 0,
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
            read: `switch (val) {
                                case 24: // Ice
                                case 30: // Hot
                                case 31: // Cold
                                    return Color.swExceptional; // exceptional

                                case 7: // Cloudy
                                case 8: // Dreary (Overcast)
                                case 38: // Mostly Cloudy
                                    return Color.swCloudy; // cloudy

                                case 11: // fog
                                    return Color.swFog; // fog

                                case 25: // Sleet
                                    return Color.swHail; // Hail

                                case 15: // T-Storms
                                    return Color.swLightning; // lightning

                                case 16: // Mostly Cloudy w/ T-Storms
                                case 17: // Partly Sunny w/ T-Storms
                                case 41: // Partly Cloudy w/ T-Storms
                                case 42: // Mostly Cloudy w/ T-Storms
                                    return Color.swLightningRainy; // lightning-rainy

                                case 33: // Clear
                                case 34: // Mostly Clear
                                case 37: // Hazy Moonlight
                                    return Color.swClearNight;

                                case 3: // Partly Sunny
                                case 4: // Intermittent Clouds
                                case 6: // Mostly Cloudy
                                case 35: // Partly Cloudy
                                case 36: // Intermittent Clouds
                                    return Color.swPartlycloudy; // partlycloudy

                                case 18: // pouring
                                    return Color.swPouring; // pouring

                                case 12: // Showers
                                case 13: // Mostly Cloudy w/ Showers
                                case 14: // Partly Sunny w/ Showers
                                case 26: // Freezing Rain
                                case 39: // Partly Cloudy w/ Showers
                                case 40: // Mostly Cloudy w/ Showers
                                    return Color.swRainy; // rainy

                                case 19: // Flurries
                                case 20: // Mostly Cloudy w/ Flurries
                                case 21: // Partly Sunny w/ Flurries
                                case 22: // Snow
                                case 23: // Mostly Cloudy w/ Snow
                                case 43: // Mostly Cloudy w/ Flurries
                                case 44: // Mostly Cloudy w/ Snow
                                    return Color.swSnowy; // snowy

                                case 29: // Rain and Snow
                                    return Color.swSnowyRainy; // snowy-rainy

                                case 1: // Sunny
                                case 2: // Mostly Sunny
                                case 5: // Hazy Sunshine
                                    return Color.swSunny; // sunny

                                case 32: // windy
                                    return Color.swWindy; // windy

                                default:
                                    return Color.White;
                            }`,
            dp: "accuweather.0.Current.WeatherIcon"
          },
          entityIconColorScale: void 0,
          entityIconOn: {
            type: "triggered",
            dp: "accuweather.0.Current.WeatherIcon",
            read: `{
                            switch (val) {
                                case 30: // Hot
                                    return 'weather-sunny-alert'; // exceptional

                                case 24: // Ice
                                case 31: // Cold
                                    return 'snowflake-alert'; // exceptional

                                case 7: // Cloudy
                                case 8: // Dreary (Overcast)
                                case 38: // Mostly Cloudy
                                    return 'weather-cloudy'; // cloudy

                                case 11: // fog
                                    return 'weather-fog'; // fog

                                case 25: // Sleet
                                    return 'weather-hail'; // Hail

                                case 15: // T-Storms
                                    return 'weather-lightning'; // lightning

                                case 16: // Mostly Cloudy w/ T-Storms
                                case 17: // Partly Sunny w/ T-Storms
                                case 41: // Partly Cloudy w/ T-Storms
                                case 42: // Mostly Cloudy w/ T-Storms
                                    return 'weather-lightning-rainy'; // lightning-rainy

                                case 33: // Clear
                                case 34: // Mostly Clear
                                case 37: // Hazy Moonlight
                                    return 'weather-night';

                                case 3: // Partly Sunny
                                case 4: // Intermittent Clouds
                                case 6: // Mostly Cloudy
                                case 35: // Partly Cloudy
                                case 36: // Intermittent Clouds
                                    return 'weather-partly-cloudy'; // partlycloudy

                                case 18: // pouring
                                    return 'weather-pouring'; // pouring

                                case 12: // Showers
                                case 13: // Mostly Cloudy w/ Showers
                                case 14: // Partly Sunny w/ Showers
                                case 26: // Freezing Rain
                                case 39: // Partly Cloudy w/ Showers
                                case 40: // Mostly Cloudy w/ Showers
                                    return 'weather-rainy'; // rainy

                                case 19: // Flurries
                                case 20: // Mostly Cloudy w/ Flurries
                                case 21: // Partly Sunny w/ Flurries
                                case 22: // Snow
                                case 23: // Mostly Cloudy w/ Snow
                                case 43: // Mostly Cloudy w/ Flurries
                                case 44: // Mostly Cloudy w/ Snow
                                    return 'weather-snowy'; // snowy

                                case 29: // Rain and Snow
                                    return 'weather-snowy-rainy'; // snowy-rainy

                                case 1: // Sunny
                                case 2: // Mostly Sunny
                                case 5: // Hazy Sunshine
                                    return 'weather-sunny'; // sunny

                                case 32: // windy
                                    return 'weather-windy'; // windy

                                default:
                                    return 'alert-circle-outline';
                            }
                        }`
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
            constVal: Color.Yellow
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
            constVal: Color.Yellow
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
            constVal: Color.White
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
            constVal: Color.White
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
      alternateEntity: [],
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
            constVal: Color.White
          },
          entityOnColor: {
            type: "const",
            constVal: Color.Red
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
            constVal: Color.White
          },
          entityOnColor: {
            type: "const",
            constVal: Color.Red
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
