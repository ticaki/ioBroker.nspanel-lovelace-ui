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
  testConfigMedia: () => testConfigMedia,
  welcomePopupPayload: () => welcomePopupPayload
});
module.exports = __toCommonJS(config_exports);
var Color = __toESM(require("./const/Color"));
const Testconfig = {
  screenSaverConfig: {
    mode: "advanced",
    rotationTime: 0,
    entitysConfig: {
      favoritEntity: [
        {
          entityIconSelect: void 0,
          entityValue: {
            value: { type: "triggered", dp: "accuweather.0.Current.Temperature" },
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
          entityDateFormat: {
            type: "const",
            constVal: null
          },
          entityIcon: {
            true: {
              value: {
                type: "state",
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
                            }`,
                dp: "accuweather.0.Current.WeatherIcon"
              },
              color: {
                type: "triggered",
                dp: "accuweather.0.Current.WeatherIcon",
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
            false: { value: void 0, color: void 0 },
            scale: void 0,
            maxBri: void 0,
            minBri: void 0
          },
          entityText: {
            true: void 0,
            false: void 0
          }
        }
      ],
      leftEntity: [
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.WindSpeed"
            },
            decimal: {
              type: "const",
              constVal: 1
            },
            factor: {
              type: "const",
              constVal: 1e3 / 3600
            },
            unit: {
              type: "const",
              constVal: "m/s"
            }
          },
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "weather-windy"
              },
              color: void 0
            },
            false: {
              value: void 0,
              color: void 0
            },
            scale: {
              type: "const",
              constVal: { val_min: 0, val_max: 80 }
            },
            maxBri: void 0,
            minBri: void 0
          },
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "Wind"
            },
            false: void 0
          }
        },
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.WindGust"
            },
            decimal: {
              type: "const",
              constVal: 1
            },
            factor: {
              type: "const",
              constVal: 1e3 / 3600
            },
            unit: {
              type: "const",
              constVal: "m/s"
            }
          },
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "weather-tornado"
              },
              color: void 0
            },
            false: {
              value: void 0,
              color: void 0
            },
            scale: {
              type: "const",
              constVal: { val_min: 0, val_max: 7.2 }
            },
            maxBri: void 0,
            minBri: void 0
          },
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "B\xF6en"
            },
            false: void 0
          }
        },
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.WindDirectionText"
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
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "windsock"
              },
              color: {
                type: "const",
                constVal: "#FF00FF"
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
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "Windr."
            },
            false: void 0
          }
        }
      ],
      bottomEntity: [
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Daily.Day1.Sunrise",
              forceType: "string"
            },
            decimal: {
              type: "const",
              constVal: 0
            },
            factor: {
              type: "const",
              constVal: 1
            },
            unit: {
              type: "const",
              constVal: "\xB0C"
            }
          },
          entityDateFormat: {
            type: "const",
            constVal: JSON.stringify({ hour: "2-digit", minute: "2-digit" })
          },
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "weather-sunset-up"
              },
              color: {
                type: "const",
                constVal: Color.Yellow
              }
            },
            false: {
              value: void 0,
              color: {
                type: "const",
                constVal: Color.Blue
              }
            },
            scale: void 0,
            maxBri: void 0,
            minBri: void 0
          },
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "TokenSun"
            },
            false: void 0
          }
        },
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.WindSpeed"
            },
            decimal: {
              type: "const",
              constVal: 1
            },
            factor: {
              type: "const",
              constVal: 1e3 / 3600
            },
            unit: {
              type: "const",
              constVal: "m/s"
            }
          },
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "weather-windy"
              },
              color: void 0
            },
            false: {
              value: void 0,
              color: void 0
            },
            scale: {
              type: "const",
              constVal: { val_min: 0, val_max: 80 }
            },
            maxBri: void 0,
            minBri: void 0
          },
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "Wind"
            },
            false: void 0
          }
        },
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.WindGust"
            },
            decimal: {
              type: "const",
              constVal: 1
            },
            factor: {
              type: "const",
              constVal: 1e3 / 3600
            },
            unit: {
              type: "const",
              constVal: "m/s"
            }
          },
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "weather-tornado"
              },
              color: void 0
            },
            false: {
              value: void 0,
              color: void 0
            },
            scale: {
              type: "const",
              constVal: { val_min: 0, val_max: 7.2 }
            },
            maxBri: void 0,
            minBri: void 0
          },
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "B\xF6en"
            },
            false: void 0
          }
        },
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.WindDirectionText"
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
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "windsock"
              },
              color: {
                type: "const",
                constVal: "#FF00FF"
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
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "Windr."
            },
            false: void 0
          }
        },
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.RelativeHumidity"
            },
            decimal: {
              type: "const",
              constVal: 1
            },
            factor: void 0,
            unit: {
              type: "const",
              constVal: "%"
            }
          },
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "water-percent"
              },
              color: void 0
            },
            false: {
              value: void 0,
              color: void 0
            },
            scale: {
              type: "const",
              constVal: { val_min: 0, val_max: 100, val_best: 65 }
            },
            maxBri: void 0,
            minBri: void 0
          },
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "Feuchte."
            },
            false: void 0
          }
        },
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.DewPoint"
            },
            decimal: {
              type: "const",
              constVal: 1
            },
            factor: void 0,
            unit: {
              type: "const",
              constVal: "\xB0C"
            }
          },
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "thermometer-water"
              },
              color: {
                type: "const",
                constVal: "#7799FF"
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
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "Taup."
            },
            false: void 0
          }
        }
      ],
      alternateEntity: [],
      indicatorEntity: [
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Daily.Day1.Sunrise",
              forceType: "string"
            },
            decimal: {
              type: "const",
              constVal: 0
            },
            factor: {
              type: "const",
              constVal: 1
            },
            unit: {
              type: "const",
              constVal: "\xB0C"
            }
          },
          entityDateFormat: {
            type: "const",
            constVal: JSON.stringify({ hour: "2-digit", minute: "2-digit" })
          },
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "weather-sunset-up"
              },
              color: {
                type: "const",
                constVal: Color.Yellow
              }
            },
            false: {
              value: void 0,
              color: {
                type: "const",
                constVal: Color.Blue
              }
            },
            scale: void 0,
            maxBri: void 0,
            minBri: void 0
          },
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "Sonne"
            },
            false: void 0
          }
        },
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.WindGust"
            },
            decimal: {
              type: "const",
              constVal: 1
            },
            factor: {
              type: "const",
              constVal: 1e3 / 3600
            },
            unit: {
              type: "const",
              constVal: "m/s"
            }
          },
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "weather-tornado"
              },
              color: void 0
            },
            false: {
              value: void 0,
              color: void 0
            },
            scale: {
              type: "const",
              constVal: { val_min: 0, val_max: 7.2 }
            },
            maxBri: void 0,
            minBri: void 0
          },
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "B\xF6en"
            },
            false: void 0
          }
        },
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.WindDirectionText"
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
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "windsock"
              },
              color: {
                type: "const",
                constVal: "#FF00FF"
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
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "Windr."
            },
            false: void 0
          }
        },
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.WindSpeed"
            },
            decimal: {
              type: "const",
              constVal: 1
            },
            factor: {
              type: "const",
              constVal: 1e3 / 3600
            },
            unit: {
              type: "const",
              constVal: "m/s"
            }
          },
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "weather-windy"
              },
              color: void 0
            },
            false: {
              value: void 0,
              color: void 0
            },
            scale: {
              type: "const",
              constVal: { val_min: 0, val_max: 80 }
            },
            maxBri: void 0,
            minBri: void 0
          },
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "Wind"
            },
            false: void 0
          }
        },
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.WindGust"
            },
            decimal: {
              type: "const",
              constVal: 1
            },
            factor: {
              type: "const",
              constVal: 1e3 / 3600
            },
            unit: {
              type: "const",
              constVal: "m/s"
            }
          },
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "weather-tornado"
              },
              color: void 0
            },
            false: {
              value: void 0,
              color: void 0
            },
            scale: {
              type: "const",
              constVal: { val_min: 0, val_max: 7.2 }
            },
            maxBri: void 0,
            minBri: void 0
          },
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "B\xF6en"
            },
            false: void 0
          }
        }
      ],
      mrIconEntity: [
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.WindDirectionText"
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
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "windsock"
              },
              color: {
                type: "const",
                constVal: Color.White
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
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "Windr."
            },
            false: void 0
          }
        },
        {
          entityValue: {
            value: {
              type: "state",
              dp: "accuweather.0.Current.WindDirectionText"
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
          entityDateFormat: void 0,
          entityIcon: {
            true: {
              value: {
                type: "const",
                constVal: "windsock"
              },
              color: {
                type: "const",
                constVal: "#FF00FF"
              }
            },
            false: {
              value: void 0,
              color: {
                type: "const",
                constVal: "#FF00FF"
              }
            },
            scale: void 0,
            maxBri: void 0,
            minBri: void 0
          },
          entityIconSelect: void 0,
          entityText: {
            true: {
              type: "const",
              constVal: "Windr."
            },
            false: void 0
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
  name: "Wohnzimmer",
  timeout: 1
};
const welcomePopupPayload = "entityUpdateDetail~ -~Willkommen zum NSPanel~63488~~2000~~2000~  Einen sch\xF6nen Tag                w\xFCnschen dir                Armilar, TT-Tom, ticaki         & Kuckuckmann~2000~3~1~\uF4DD~2000";
const testConfigMedia = {
  card: "cardMedia",
  dpInit: "alexa2.0.Echo-Devices.G091EV0704641J8R.Player",
  initMode: "auto",
  config: {
    heading: {
      type: "const",
      constVal: "home"
    },
    alwaysOnDisplay: {
      type: "const",
      constVal: "test"
    },
    album: {
      mode: "auto",
      type: "state",
      role: "media.album",
      dp: ""
    },
    titel: {
      on: {
        type: "const",
        constVal: true
      },
      text: {
        mode: "auto",
        type: "triggered",
        role: "media.title",
        dp: ""
      },
      color: {
        type: "const",
        constVal: { red: 250, green: 2, blue: 3 }
      },
      icon: void 0,
      list: void 0
    },
    duration: {
      mode: "auto",
      type: "state",
      role: "media.duration",
      dp: ""
    },
    elapsed: {
      mode: "auto",
      type: "triggered",
      role: ["media.elapsed", "media.elapsed.text"],
      dp: ""
    },
    volume: {
      mode: "auto",
      type: "triggered",
      role: ["level.volume"],
      dp: ""
    },
    artist: {
      on: {
        type: "const",
        constVal: true
      },
      text: {
        mode: "auto",
        type: "state",
        role: "media.artist",
        dp: ""
      },
      color: void 0,
      icon: {
        type: "const",
        constVal: "diameter"
      },
      list: void 0
    },
    shuffle: {
      mode: "auto",
      type: "state",
      role: "media.mode.shuffle",
      dp: ""
    },
    icon: {
      type: "const",
      constVal: "dialpad"
    },
    play: {
      mode: "auto",
      type: "state",
      role: ["button.play"],
      dp: ""
    },
    mediaState: {
      mode: "auto",
      type: "triggered",
      role: ["media.state"],
      dp: ""
    },
    stop: {
      mode: "auto",
      type: "state",
      role: ["button.stop"],
      dp: ""
    },
    pause: {
      mode: "auto",
      type: "state",
      role: "button.pause",
      dp: ""
    },
    forward: {
      mode: "auto",
      type: "state",
      role: "button.next",
      dp: ""
    },
    backward: {
      mode: "auto",
      type: "state",
      role: "button.prev",
      dp: ""
    },
    logo: {
      on: {
        type: "const",
        constVal: true
      },
      text: { type: "const", constVal: "1" },
      icon: { type: "const", constVal: "home" },
      color: { type: "const", constVal: { red: 250, blue: 250, green: 0 } },
      list: void 0,
      action: "cross"
    },
    toolbox: [
      {
        on: {
          type: "const",
          constVal: true
        },
        text: { type: "const", constVal: "Repeat" },
        icon: { type: "const", constVal: "repeat" },
        color: { type: "const", constVal: { red: 123, blue: 112, green: 0 } },
        list: { type: "state", dp: "", mode: "auto", role: "media.playlist" },
        action: "cross"
      },
      {
        on: {
          type: "const",
          constVal: true
        },
        text: { type: "const", constVal: "1" },
        icon: { type: "const", constVal: "home" },
        color: { type: "const", constVal: { red: 123, blue: 112, green: 0 } },
        list: void 0,
        action: "cross"
      },
      {
        on: {
          type: "const",
          constVal: true
        },
        text: { type: "const", constVal: "1" },
        icon: { type: "const", constVal: "home" },
        color: { type: "const", constVal: { red: 123, blue: 112, green: 0 } },
        list: void 0,
        action: "cross"
      },
      {
        on: {
          type: "const",
          constVal: false
        },
        text: { type: "const", constVal: "1" },
        icon: { true: { type: "const", constVal: "reply" }, false: { type: "const", constVal: "replay" } },
        color: { type: "const", constVal: { red: 123, blue: 112, green: 0 } },
        list: void 0,
        action: "cross"
      },
      {
        on: {
          type: "const",
          constVal: false
        },
        text: { type: "const", constVal: "1" },
        icon: { type: "const", constVal: "home" },
        color: { type: "const", constVal: { red: 123, blue: 112, green: 0 } },
        list: void 0,
        action: "cross"
      },
      {
        on: {
          type: "const",
          constVal: true
        },
        text: { type: "const", constVal: "1" },
        icon: { type: "const", constVal: "home" },
        color: { type: "const", constVal: { red: 123, blue: 112, green: 0 } },
        list: void 0,
        action: "cross"
      },
      {
        on: {
          type: "const",
          constVal: true
        },
        text: { type: "const", constVal: "1" },
        icon: { type: "const", constVal: "home" },
        color: { type: "const", constVal: { red: 123, blue: 112, green: 0 } },
        list: void 0,
        action: "cross"
      },
      {
        on: {
          type: "const",
          constVal: true
        },
        text: { type: "const", constVal: "1" },
        icon: { type: "const", constVal: "home" },
        color: { type: "const", constVal: { red: 123, blue: 112, green: 0 } },
        list: void 0,
        action: "cross"
      }
    ]
  },
  items: void 0,
  writeItems: void 0
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Testconfig,
  testConfigMedia,
  welcomePopupPayload
});
//# sourceMappingURL=config.js.map
