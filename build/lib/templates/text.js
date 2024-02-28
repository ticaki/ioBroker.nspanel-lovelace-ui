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
const textTemplates = {
  "text.window.isOpen": {
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
        true: { type: "const", constVal: "window" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "open" },
        false: { type: "const", constVal: "close" }
      }
    }
  },
  "text.window.isClose": {
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
        true: { type: "const", constVal: "window" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "open" },
        false: { type: "const", constVal: "close" }
      }
    }
  },
  "text.temperature": {
    role: "",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "temperature-celsius" },
          text: {
            value: {
              type: "triggered",
              mode: "auto",
              role: "value.temperature",
              dp: "",
              read: "return Math.round(val*10)/10"
            }
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
  "text.battery": {
    role: "battery",
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
            read: `const v = Math.round(val / 10)
                        switch (v) {
                            case 0:
                                return 'battery-charging-outline';
                            case 1:
                            case 2:
                            case 3:
                            case 4:
                            case 5:
                            case 6:
                            case 7:
                            case 8:
                            case 9:
                                return 'battery-charging-' + v + '0';
                            case 10:
                            default:
                                return 'battery-charging';}`
          },
          text: {
            value: {
              type: "triggered",
              mode: "auto",
              role: "value.battery",
              dp: ""
            },
            unit: {
              type: "const",
              constVal: "%"
            },
            textSize: { type: "const", constVal: 2 }
          },
          color: {
            type: "const",
            constVal: Color.Green
          }
        },
        false: {
          value: {
            type: "triggered",
            mode: "auto",
            role: "value.battery",
            dp: "",
            read: `const v = Math.round(val / 10)
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
  "text.battery.bydhvs": {
    template: "text.battery",
    role: "battery",
    adapter: "bydhvs",
    type: "text",
    data: {
      icon: {
        true: {
          value: {
            type: "triggered",
            mode: "auto",
            role: "value.battery",
            dp: ".State.SOC$",
            read: `const v = Math.round(val / 10)
                        switch (v) {
                            case 0:
                                return 'battery-charging-outline';
                            case 1:
                            case 2:
                            case 3:
                            case 4:
                            case 5:
                            case 6:
                            case 7:
                            case 8:
                            case 9:
                                return 'battery-charging-' + v + '0';
                            case 10:
                            default:
                                return 'battery-charging';}`
          },
          text: {
            value: {
              type: "triggered",
              mode: "auto",
              role: "value.battery",
              dp: ".State.SOC$"
            },
            unit: {
              type: "const",
              constVal: "%"
            },
            textSize: { type: "const", constVal: 2 }
          },
          color: void 0
        },
        false: {
          value: {
            type: "triggered",
            mode: "auto",
            role: "value.battery",
            dp: ".State.SOC$",
            read: `const v = Math.round(val / 10)
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
          color: void 0
        },
        scale: { type: "const", constVal: { val_min: 10, val_max: 50, log10: "max" } }
      },
      entity1: {
        value: {
          type: "state",
          mode: "auto",
          role: "value.battery",
          dp: ".State.SOC$"
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
          dp: ".State.SOC$"
        },
        unit: { type: "const", constVal: "%" }
      },
      entity3: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "value.power",
          dp: ".State.Power$",
          read: "return val <= 0"
        }
      }
    }
  },
  "text.battery.low": {
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
  },
  "text.accuweather.bot2values": {
    role: "2values",
    type: "text",
    modeScr: "bottom",
    data: {
      entity1: {
        value: { mode: "auto", role: "", type: "triggered", dp: ".Summary.TempMin_" },
        decimal: {
          type: "const",
          constVal: 0
        },
        factor: void 0,
        unit: {
          type: "const",
          constVal: "\xB0 "
        }
      },
      entity2: {
        value: { mode: "auto", role: "", type: "triggered", dp: ".Summary.TempMax_" },
        decimal: {
          type: "const",
          constVal: 0
        },
        factor: void 0,
        unit: {
          type: "const",
          constVal: "\xB0"
        }
      },
      icon: {
        true: {
          value: {
            mode: "auto",
            role: "",
            type: "triggered",
            dp: ".Summary.WeatherIcon_",
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
          color: {
            mode: "auto",
            role: "",
            type: "triggered",
            dp: ".Summary.WeatherIcon_",
            read: `{
                                switch (val) {
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
                                }
                            }`
          }
        },
        false: {
          value: void 0,
          color: void 0
        },
        scale: void 0,
        maxBri: void 0,
        minBri: void 0
      },
      text: {
        true: { mode: "auto", role: "", type: "triggered", dp: ".Summary.DayOfWeek_" },
        false: void 0
      }
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  textTemplates
});
//# sourceMappingURL=text.js.map
