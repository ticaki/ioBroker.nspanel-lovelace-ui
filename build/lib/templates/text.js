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
var import_Color = require("../const/Color");
const textTemplates = {
  "text.window.isOpen": {
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "window-open-variant" },
          color: { type: "const", constVal: import_Color.Color.open }
        },
        false: {
          value: { type: "const", constVal: "window-closed-variant" },
          color: { type: "const", constVal: import_Color.Color.close }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: ["sensor.window", "sensor.open"],
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "window" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "opened" },
        false: { type: "const", constVal: "closed" }
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
          color: { type: "const", constVal: import_Color.Color.Cyan }
        },
        false: {
          value: { type: "const", constVal: "window-closed-variant" },
          color: { type: "const", constVal: import_Color.Color.Green }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: ["sensor.window", "sensor.open"],
          dp: "",
          read: "return !val"
        }
      },
      text: {
        true: { type: "const", constVal: "window" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "opened" },
        false: { type: "const", constVal: "closed" }
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
          color: { type: "const", constVal: import_Color.Color.Red }
        },
        false: {
          value: { type: "const", constVal: "temperature-celsius" },
          color: { type: "const", constVal: import_Color.Color.Blue }
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
    /**
     * entity1 enthält den Füllstand
     * entity2 ebenfalls
     * entity3 ist true für laden und false für entladen. default ist false entity3 wird nicht automatisch gefunden
     */
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
            constVal: import_Color.Color.Green
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
            constVal: import_Color.Color.Red
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
    /**
     * entity1 enthält den Füllstand
     * entity2 ebenfalls
     * entity3 ist true für laden und false für entladen. default ist false entity3 wird nicht automatisch gefunden
     */
    template: "text.battery",
    role: "battery",
    adapter: "bydhvs",
    type: "text",
    dpInit: "/bydhvs\\.#\xB0^\xB0#\\./",
    data: {
      icon: {
        true: {
          value: {
            type: "triggered",
            mode: "auto",
            role: "value.battery",
            dp: "",
            regexp: /\.State\.SOC$/,
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
              dp: "",
              regexp: /\.State\.SOC$/
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
            dp: "",
            regexp: /\.State\.SOC$/,
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
          dp: "",
          regexp: /\.State\.SOC$/
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
          dp: "",
          regexp: /\.State\.SOC$/
        },
        unit: { type: "const", constVal: "%" }
      },
      entity3: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "value.power",
          dp: "",
          regexp: /\.State\.Power$/,
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
          color: { type: "const", constVal: import_Color.Color.Red }
        },
        false: {
          value: { type: "const", constVal: "battery" },
          color: { type: "const", constVal: import_Color.Color.Green }
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
  "text.accuweather.sunriseset": {
    role: "4values",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "weather-sunset-up" },
          color: { type: "const", constVal: { r: 255, g: 138, b: 18 } }
        },
        false: {
          value: { type: "const", constVal: "weather-sunset-down" },
          color: { type: "const", constVal: { r: 255, g: 209, b: 163 } }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "date.sunrise.forecast.0",
          dp: "",
          read: `const n = Date.now();
                        const t = new Date(val).getTime();
                        if (t < n) return null;
                        return t;`
        },
        dateFormat: {
          type: "const",
          constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
        }
      },
      entity2: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "date.sunset.forecast.0",
          dp: "",
          read: `const n = Date.now();
                    const t = new Date(val).getTime();
                    if (t < n) return null;
                    return t;`
        },
        dateFormat: {
          type: "const",
          constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
        }
      },
      entity3: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "date.sunrise.forecast.1",
          dp: "",
          read: `const n = Date.now();
                    const t = new Date(val).getTime();
                    if (t < n) return null;
                    return t;`
        },
        dateFormat: {
          type: "const",
          constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
        }
      },
      entity4: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "date.sunset.forecast.1",
          dp: "",
          read: `const n = Date.now();
                    const t = new Date(val).getTime();
                    if (t < n) return null;
                    return t;`
        },
        dateFormat: {
          type: "const",
          constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
        }
      },
      text: {
        true: { type: "const", constVal: "sunriseToken" },
        false: { type: "const", constVal: "sunsetToken" }
      },
      text1: void 0
    }
  },
  "text.accuweather.favorit": {
    role: "text",
    adapter: "accuweather",
    type: "text",
    modeScr: "favorit",
    data: {
      entity2: {
        value: {
          role: "value.temperature",
          mode: "auto",
          type: "state",
          dp: "",
          regexp: /\.Current\.Temperature$/
        },
        decimal: {
          type: "const",
          constVal: null
        },
        factor: void 0,
        unit: {
          type: "const",
          constVal: "\xB0C"
        }
      },
      icon: {
        true: {
          value: {
            type: "state",
            role: "value",
            mode: "auto",
            dp: "",
            regexp: /\.Current\.WeatherIcon$/,
            /**
             * How to use
             * this run its own this. U dont have accress to variables that no definied for this.
             * Color: in a import of color.ts
             * val: is the incoming value - raw
             *
             * The best thing is to write the function with () => { here }. Then remove the () => {}
             * and convert it into a template literal, using ``. A return is mandatory.
             */
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
            type: "triggered",
            role: "value",
            mode: "auto",
            dp: "",
            regexp: /\.Current\.WeatherIcon$/,
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
                }`
          }
        },
        false: { value: void 0, color: void 0 }
      },
      text: {
        true: void 0,
        false: void 0
      }
    }
  },
  "text.accuweather.bot2values": {
    role: "2values",
    type: "text",
    modeScr: "bottom",
    adapter: "accuweather",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /^accuweather\.[0-9]+\.Summary\.TempMin_/
        },
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
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /^accuweather\.[0-9]+\.Summary\.TempMax_/
        },
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
            regexp: /^accuweather\.[0-9]+\.Summary\.WeatherIcon_/,
            dp: "",
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
            dp: "",
            regexp: /^accuweather\.[0-9]+\.Summary\.WeatherIcon_/,
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
        true: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /^accuweather\.[0-9]+\.Summary\.DayOfWeek_/
        },
        false: void 0
      }
    }
  },
  "text.accuweather.windspeed": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "accuweather",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /^accuweather\.[0-9]+\.Current\.WindSpeed/,
          dp: ``
        },
        decimal: {
          type: "const",
          constVal: 0
        },
        unit: void 0
      },
      entity2: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /^accuweather\.[0-9]+\.Current\.WindSpeed/,
          dp: ``
        },
        decimal: {
          type: "const",
          constVal: 0
        },
        unit: {
          type: "const",
          constVal: "km/h"
        }
      },
      icon: {
        true: {
          value: {
            type: "const",
            constVal: "weather-windy"
          },
          color: {
            type: "const",
            constVal: import_Color.Color.MSRed
          }
        },
        false: {
          value: {
            type: "const",
            constVal: "weather-windy"
          },
          color: {
            type: "const",
            constVal: import_Color.Color.MSGreen
          }
        },
        scale: {
          type: "const",
          constVal: { val_min: 0, val_max: 80 }
        },
        maxBri: void 0,
        minBri: void 0
      },
      text: {
        true: {
          type: "const",
          constVal: "Wind"
        },
        false: void 0
      }
    }
  },
  "text.accuweather.winddirection": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "accuweather",
    data: {
      entity2: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /^accuweather\.[0-9]+\.Current\.WindDirectionText/,
          dp: ``
        },
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
            type: "const",
            constVal: "windsock"
          },
          color: {
            type: "const",
            constVal: "#FFFFFF"
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
        true: {
          type: "const",
          constVal: "Windr."
        },
        false: void 0
      }
    }
  },
  "text.accuweather.uvindex": {
    role: "text",
    type: "text",
    adapter: "accuweather",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /^accuweather\.[0-9]+\.Current\.UVIndex$/,
          dp: ``,
          forceType: "string"
        },
        decimal: void 0,
        factor: void 0,
        unit: void 0
      },
      entity2: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /^accuweather\.[0-9]+\.Current\.UVIndex$/,
          dp: ``,
          forceType: "string"
        },
        decimal: void 0,
        factor: void 0,
        unit: void 0
      },
      icon: {
        true: {
          value: {
            type: "const",
            constVal: "solar-power"
          },
          color: {
            type: "const",
            constVal: import_Color.Color.MSRed
          }
        },
        false: {
          value: {
            type: "const",
            constVal: "solar-power"
          },
          color: {
            type: "const",
            constVal: import_Color.Color.MSGreen
          }
        },
        scale: {
          type: "const",
          constVal: { val_min: 0, val_max: 9 }
        },
        maxBri: void 0,
        minBri: void 0
      },
      text: {
        true: {
          type: "const",
          constVal: "UV"
        },
        false: void 0
      }
    }
  },
  "text.accuweather.windgust": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "accuweather",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /^accuweather\.[0-9]+\.Current\.WindGust/,
          dp: ``
        },
        decimal: {
          type: "const",
          constVal: 0
        },
        unit: void 0
      },
      entity2: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /^accuweather\.[0-9]+\.Current\.WindGust/,
          dp: ``
        },
        decimal: {
          type: "const",
          constVal: 0
        },
        unit: {
          type: "const",
          constVal: "km/h"
        }
      },
      icon: {
        true: {
          value: {
            type: "const",
            constVal: "weather-tornado"
          },
          color: {
            type: "const",
            constVal: import_Color.Color.MSRed
          }
        },
        false: {
          value: {
            type: "const",
            constVal: "weather-tornado"
          },
          color: {
            type: "const",
            constVal: import_Color.Color.MSGreen
          }
        },
        scale: {
          type: "const",
          constVal: { val_min: 0, val_max: 80 }
        },
        maxBri: void 0,
        minBri: void 0
      },
      text: {
        true: {
          type: "const",
          constVal: "B\xF6en"
        },
        false: void 0
      }
    }
  },
  "text.fahrplan.departure": {
    role: "text.list",
    type: "text",
    adapter: "fahrplan",
    data: {
      icon: {
        true: {
          value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.Mode$/ },
          color: { type: "const", constVal: import_Color.Color.Red }
        },
        false: {
          value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.Mode$/ },
          color: { type: "const", constVal: import_Color.Color.Green }
        }
      },
      entity1: {
        value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.DepartureDelayed$/ }
      },
      entity2: {
        value: {
          role: "date",
          mode: "auto",
          type: "state",
          dp: "",
          regexp: /\.Departure$/,
          read: "return val === 0 ? null : val"
        },
        dateFormat: {
          type: "const",
          constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
        }
      },
      text: {
        true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.Direction$/ },
        false: void 0
      },
      text1: {
        true: {
          role: "date",
          mode: "auto",
          type: "state",
          dp: "",
          regexp: /\.DeparturePlanned$/,
          read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
        },
        false: void 0
      }
    }
  },
  "text.alias.fahrplan.departure": {
    role: "text.list",
    type: "text",
    adapter: "",
    data: {
      icon: {
        true: {
          value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.VEHICLE$/ },
          color: { type: "const", constVal: import_Color.Color.Red }
        },
        false: {
          value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.VEHICLE$/ },
          color: { type: "const", constVal: import_Color.Color.Green }
        }
      },
      entity1: {
        value: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.DELAY$/ }
      },
      entity2: {
        value: {
          role: "date",
          mode: "auto",
          type: "state",
          dp: "",
          regexp: /\.Departure$/,
          read: "return val === 0 ? null : val"
        },
        dateFormat: {
          type: "const",
          constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
        }
      },
      text: {
        true: { role: "state", mode: "auto", type: "state", dp: "", regexp: /\.DIRECTION$/ },
        false: void 0
      },
      text1: {
        true: {
          role: "date",
          mode: "auto",
          type: "state",
          dp: "",
          regexp: /\.ACTUAL$/,
          read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
        },
        false: void 0
      }
    }
  },
  "text.door.isOpen": {
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "door-open" },
          color: { type: "const", constVal: import_Color.Color.open }
        },
        false: {
          value: { type: "const", constVal: "door-closed" },
          color: { type: "const", constVal: import_Color.Color.close }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: ["sensor.door", "sensor.open"],
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "door" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "opened" },
        false: { type: "const", constVal: "closed" }
      }
    }
  },
  "text.gate.isOpen": {
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "garage-open" },
          color: { type: "const", constVal: import_Color.Color.open }
        },
        false: {
          value: { type: "const", constVal: "garage" },
          color: { type: "const", constVal: import_Color.Color.close }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: ["sensor.door", "switch.gate", "sensor.open"],
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "door" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "opened" },
        false: { type: "const", constVal: "closed" }
      }
    }
  },
  "text.motion": {
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "motion-sensor" },
          color: { type: "const", constVal: import_Color.Color.open }
        },
        false: {
          value: { type: "const", constVal: "motion-sensor" },
          color: { type: "const", constVal: import_Color.Color.close }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: ["sensor.motion"],
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "motion" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "On" },
        false: { type: "const", constVal: "Off" }
      }
    }
  },
  "text.info": {
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "information-outline" },
          color: {
            mode: "auto",
            role: "state",
            type: "state",
            dp: "",
            regexp: /\.COLORDEC$/,
            def: import_Color.Color.activated
          }
        },
        false: {
          value: { type: "const", constVal: "information-outline" },
          color: {
            mode: "auto",
            role: "state",
            type: "state",
            dp: "",
            regexp: /\.COLORDEC$/,
            def: import_Color.Color.deactivated
          }
        }
      },
      entity1: {
        value: { mode: "auto", role: "state", type: "triggered", dp: "", regexp: /\.ACTUAL$/, def: "info" }
      },
      text: {
        true: { mode: "auto", role: "state", type: "triggered", dp: "", regexp: /\.BUTTONTEXT$/, def: "info" }
      },
      text1: {
        true: { mode: "auto", role: "state", type: "triggered", dp: "", regexp: /\.ACTUAL$/, def: "info" }
      }
    }
  },
  "text.warning": {
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "gesture-tap-button" },
          color: {
            mode: "auto",
            role: "value.warning",
            type: "state",
            dp: "",
            regexp: /\.LEVEL$/,
            def: import_Color.Color.deactivated
          }
        },
        false: {
          value: { type: "const", constVal: "gesture-tap-button" },
          color: {
            mode: "auto",
            role: "value.warning",
            type: "state",
            dp: "",
            regexp: /\.LEVEL$/,
            def: import_Color.Color.deactivated
          }
        }
      },
      entity1: void 0,
      text: {
        true: { type: "const", constVal: "window" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "opened" },
        false: { type: "const", constVal: "closed" }
      }
    }
  },
  "text.wlan": {
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "wlan" },
          color: { type: "const", constVal: import_Color.Color.Green }
        },
        false: void 0
      },
      entity1: void 0,
      text: {
        true: { type: "const", constVal: "SSID" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "opened" },
        false: void 0
      }
    }
  },
  "text.shutter.navigation": {
    type: "text",
    role: "blind",
    adapter: "",
    data: {
      icon: {
        true: {
          value: {
            type: "const",
            constVal: "window-shutter-open"
          },
          color: {
            type: "const",
            constVal: import_Color.Color.On
          }
        },
        false: {
          value: {
            type: "const",
            constVal: "window-shutter"
          },
          color: {
            type: "const",
            constVal: import_Color.Color.Off
          }
        },
        unstable: {
          value: {
            type: "const",
            constVal: "window-shutter-alert"
          }
        },
        scale: void 0,
        maxBri: void 0,
        minBri: void 0
      },
      text: {
        true: { type: "const", constVal: "Blind" }
      },
      text1: {
        true: { type: "const", constVal: "opened" },
        false: { type: "const", constVal: "closed" }
      },
      entity1: {
        value: { mode: "auto", role: "", type: "triggered", dp: "", regexp: /\.ACTUAL$/ }
      },
      entity2: {
        value: { mode: "auto", role: "", type: "triggered", dp: "", regexp: /\.TILT_ACTUAL$/ }
      }
    }
  },
  "text.lock": {
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "lock-open-variant" },
          color: { type: "const", constVal: import_Color.Color.Cyan }
        },
        false: {
          value: { type: "const", constVal: "lock" },
          color: { type: "const", constVal: import_Color.Color.Green }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: ["switch.lock", "state"],
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "lock" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "isOpen" },
        false: { type: "const", constVal: "isClose" }
      }
    }
  },
  "text.sainlogic.windcombo": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "sainlogic",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /^sainlogic\.[0-9]+\.weather\.current\.windgustspeed/,
          dp: ``
        },
        decimal: {
          type: "const",
          constVal: 0
        },
        unit: void 0
      },
      entity2: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /^sainlogic\.[0-9]+\.weather\.current\.windgustspeed/,
          dp: ``
        },
        decimal: {
          type: "const",
          constVal: 0
        },
        unit: {
          type: "const",
          constVal: "km/h"
        }
      },
      icon: {
        true: {
          value: {
            mode: "auto",
            role: "",
            type: "triggered",
            regexp: /^sainlogic\.[0-9]+\.weather\.current\.winddir/,
            dp: ``,
            read: `{
                            let dir = (val || 0)
                            dir = (dir - (options?.directionOfPanel || 0) + 360) % 360

                            let icon = 'arrow-'
                            let icontop/*: 'bottom-' | 'top-' | 'down-' | 'up-' | ''*/ = ''
                            let iconleft/*: 'left-' | 'right-' | ''*/ = ''
                            if (dir > 292.5 || dir < 67.5) {
                                icontop = 'top-'
                            }
                            else if(dir < 247.5 && dir > 112.5) {
                                icontop = 'bottom-'
                            }
                            if (dir < 337.5 && dir > 212.5) {
                                iconleft = 'left-'
                            }
                            else if((dir < 157.5 && dir > 32.5)) {
                                iconleft = 'right-'
                            }
                            if (iconleft === '' && icontop) {
                                if (icontop === 'top-') {
                                    icontop = 'up-';
                                } else {
                                    icontop = 'down-';
                                }

                            }
                            return icon + icontop + iconleft + (options?.icon || 'bold-outline')
                        }`
          },
          color: {
            type: "const",
            constVal: import_Color.Color.MSRed
          }
        },
        false: {
          color: {
            type: "const",
            constVal: import_Color.Color.MSGreen
          }
        },
        scale: {
          type: "const",
          constVal: { val_min: 60, val_max: 0, mode: "triGrad", log: "max" }
        },
        maxBri: void 0,
        minBri: void 0
      },
      text: {
        true: {
          type: "const",
          constVal: "Wind"
        },
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
