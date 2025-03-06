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
var config_custom_exports = {};
__export(config_custom_exports, {
  Testconfig: () => Testconfig
});
module.exports = __toCommonJS(config_custom_exports);
var import_Color = require("./const/Color");
const pageGridMain = {
  alwaysOn: "none",
  uniqueID: "main",
  config: {
    card: "cardGrid",
    data: {
      headline: {
        type: "const",
        constVal: "\xDCbersicht"
      }
    }
  },
  pageItems: [
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "window-open-variant" },
            color: { type: "const", constVal: import_Color.Color.Red }
          },
          false: {
            value: { type: "const", constVal: "window-closed-variant" },
            color: { type: "const", constVal: import_Color.Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.NSPanel.Allgemein.Fenster.Status_offene"
          }
        },
        text: {
          true: {
            type: "triggered",
            dp: "0_userdata.0.NSPanel.Allgemein.Fenster.Anzahl_offene"
          },
          false: {
            type: "const",
            constVal: "Fenster"
          }
        },
        setNavi: {
          type: "const",
          constVal: 12
        }
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "door-open" },
            color: { type: "const", constVal: import_Color.Color.Red }
          },
          false: {
            value: { type: "const", constVal: "door-closed" },
            color: { type: "const", constVal: import_Color.Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.NSPanel.Allgemein.T\xFCren.Status_offene"
          }
        },
        text: {
          true: {
            type: "triggered",
            dp: "0_userdata.0.NSPanel.Allgemein.T\xFCren.Anzahl_offene"
          },
          false: {
            type: "const",
            constVal: "T\xFCren"
          }
        },
        setNavi: {
          type: "const",
          constVal: 11
        }
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "lightbulb" },
            color: { type: "const", constVal: import_Color.Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: import_Color.Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.NSPanel.Allgemein.Licht.Status_Ein"
          }
        },
        text: {
          true: {
            type: "triggered",
            dp: "0_userdata.0.NSPanel.Allgemein.Licht.Anzahl_Ein"
          },
          false: {
            type: "const",
            constVal: "Licht"
          }
        },
        setNavi: {
          type: "const",
          constVal: 14
        }
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "lock" },
            color: { type: "const", constVal: import_Color.Color.Green }
          },
          false: {
            value: { type: "const", constVal: "lock-open-variant" },
            color: { type: "const", constVal: import_Color.Color.Red }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.NSPanel.Allgemein.T\xFCrschloss.state"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "T\xFCrschlo\xDF"
          },
          false: void 0
        }
      }
    }
  ]
};
const pagenEntitiesAdapter = {
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "adapter",
  config: {
    card: "cardEntities",
    cardRole: "AdapterStopped",
    scrollType: "page",
    data: {
      headline: {
        type: "const",
        constVal: "Adapter"
      }
    }
  },
  pageItems: [],
  items: void 0
};
const pageScreensaverTest = {
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "scr",
  useColor: false,
  config: {
    card: "screensaver2",
    mode: "advanced",
    rotationTime: 10,
    model: "eu",
    data: void 0,
    screensaverSwipe: false,
    screensaverIndicatorButtons: false
  },
  // Config of Entitys
  pageItems: [
    //Datum und Zeit
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "time",
      data: {
        entity2: {
          value: {
            type: "internal",
            dp: "///time"
          },
          dateFormat: {
            type: "const",
            constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
          }
        }
      }
    },
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "date",
      data: {
        entity2: {
          value: {
            type: "internal",
            dp: "///date"
          },
          dateFormat: {
            type: "const",
            constVal: {
              local: "de",
              format: {
                weekday: "long",
                month: "short",
                year: "numeric",
                day: "numeric"
              }
            }
          }
        }
      }
    },
    //Favorit
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "favorit",
      data: {
        entity2: {
          value: { type: "triggered", dp: "accuweather.0.Current.Temperature" },
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
        icon: {
          true: {
            value: {
              type: "state",
              /** How to use
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
          false: { value: void 0, color: void 0 }
        },
        text: {
          true: void 0,
          false: void 0
        }
      }
    },
    //left
    {
      // Left 1 - temperatur flur Panel
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "left",
      data: {
        entity1: void 0,
        entity2: {
          value: {
            type: "triggered",
            dp: "alias.0.NSPanel.Flur.Sensor.ANALOG.Temperature.ACTUAL"
          },
          decimal: {
            type: "const",
            constVal: 1
          },
          unit: {
            type: "const",
            constVal: "\xB0C"
          }
        },
        icon: {
          true: {
            value: {
              type: "const",
              constVal: "thermometer"
            },
            color: {
              type: "const",
              constVal: import_Color.Color.MSRed
            }
          },
          false: {
            value: void 0,
            color: {
              type: "const",
              constVal: import_Color.Color.MSGreen
            }
          },
          scale: {
            type: "const",
            constVal: { val_min: 0, val_max: 35, val_best: 20 }
          },
          maxBri: void 0,
          minBri: void 0
        }
      }
    },
    {
      // Left 2 - Wärmeverbrauch
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "left",
      data: {
        entity1: void 0,
        entity2: {
          value: {
            type: "triggered",
            dp: "alias.0.Heizung.W\xE4rmeTagesVerbrauch.ACTUAL"
          },
          decimal: {
            type: "const",
            constVal: 1
          },
          unit: {
            type: "const",
            constVal: "kWh"
          }
        },
        icon: {
          true: {
            value: {
              type: "const",
              constVal: "counter"
            },
            color: {
              type: "const",
              constVal: import_Color.Color.MSRed
            }
          },
          false: {
            value: void 0,
            color: {
              type: "const",
              constVal: import_Color.Color.MSGreen
            }
          },
          scale: {
            type: "const",
            constVal: { val_min: 0, val_max: 5e3 }
          },
          maxBri: void 0,
          minBri: void 0
        }
      }
    },
    {
      // Left 3 - Mülltermin
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "left",
      data: {
        entity1: void 0,
        entity2: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.Abfallkalender.1.date"
          },
          dateFormat: {
            type: "const",
            constVal: {
              local: "de",
              format: {
                month: "2-digit",
                year: "numeric",
                day: "2-digit"
              }
            }
          }
        },
        icon: {
          true: {
            value: {
              type: "const",
              constVal: "trash-can"
            },
            color: {
              type: "triggered",
              dp: "0_userdata.0.Abfallkalender.1.color"
            }
          },
          false: {
            value: void 0,
            color: void 0
          }
        }
      }
    },
    //Bottom
    // Bottom 1 - Sonenaufgang
    {
      template: "text.accuweather.sunriseset",
      dpInit: "/^accuweather.0.Daily.+/",
      modeScr: "bottom"
    },
    // Bottom 2 - Wind
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "bottom",
      data: {
        entity1: {
          value: {
            type: "triggered",
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
        entity2: {
          value: {
            type: "triggered",
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
            value: void 0,
            color: {
              type: "const",
              constVal: import_Color.Color.MSGreen
            }
          },
          scale: {
            type: "const",
            constVal: { val_min: 0, val_max: 120 }
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
    // Bottom 3 - Böen
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "bottom",
      data: {
        entity1: {
          value: {
            type: "triggered",
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
          unit: void 0
        },
        entity2: {
          value: {
            type: "triggered",
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
    // Bottom 4 - Windrichtung
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "bottom",
      data: {
        entity2: {
          value: {
            type: "triggered",
            dp: "accuweather.0.Current.WindDirectionText"
          },
          decimal: {
            type: "const",
            constVal: 0
          },
          factor: void 0,
          unit: {
            type: "const",
            constVal: ""
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
              constVal: import_Color.Color.White
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
    // Bottom 5 - Feuchte
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "bottom",
      data: {
        entity1: {
          value: {
            type: "triggered",
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
        entity2: {
          value: {
            type: "triggered",
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
        icon: {
          true: {
            value: {
              type: "const",
              constVal: "water-percent"
            },
            color: {
              type: "const",
              constVal: import_Color.Color.MSGreen
            }
          },
          false: {
            value: void 0,
            color: {
              type: "const",
              constVal: import_Color.Color.MSRed
            }
          },
          scale: {
            type: "const",
            constVal: { val_min: 0, val_max: 100, val_best: 65 }
          },
          maxBri: void 0,
          minBri: void 0
        },
        text: {
          true: {
            type: "const",
            constVal: "Feuchte"
          },
          false: void 0
        }
      }
    },
    // Bottom 6 - UV-Index
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "bottom",
      data: {
        entity1: {
          value: {
            type: "triggered",
            dp: "accuweather.0.Current.UVIndex"
          },
          decimal: {
            type: "const",
            constVal: 0
          },
          factor: void 0,
          unit: {
            type: "const",
            constVal: ""
          }
        },
        entity2: {
          value: {
            type: "triggered",
            dp: "accuweather.0.Current.UVIndex"
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
        icon: {
          true: {
            value: {
              type: "const",
              constVal: "solar-power"
            },
            color: {
              type: "const",
              constVal: import_Color.Color.MSGreen
            }
          },
          false: {
            value: void 0,
            color: {
              type: "const",
              constVal: import_Color.Color.MSRed
            }
          },
          scale: {
            type: "const",
            constVal: { val_min: 0, val_max: 9, val_best: 0 }
          },
          maxBri: void 0,
          minBri: void 0
        },
        text: {
          true: {
            type: "const",
            constVal: "UV Index"
          },
          false: void 0
        }
      }
    },
    // Bottom 7 - Wettervorschau morgen
    {
      template: "text.accuweather.bot2values",
      dpInit: "/^accuweather\\.0.+?d1$/",
      modeScr: "bottom"
    },
    // Bottom 8 - Wettervorschau übermorgen
    {
      template: "text.accuweather.bot2values",
      dpInit: "/^accuweather\\.0.+?d2$/",
      modeScr: "bottom"
    },
    // Bottom 9 - Wettervorschau + 3 Tage
    {
      template: "text.accuweather.bot2values",
      dpInit: "/^accuweather\\.0.+?d3$/",
      modeScr: "bottom"
    },
    // Bottom 10 - Wettervorschau + 4 Tage
    {
      template: "text.accuweather.bot2values",
      dpInit: "/^accuweather\\.0.+?d4$/",
      modeScr: "bottom"
    },
    // Bottom 11 - Wettervorschau + 5 Tage
    {
      template: "text.accuweather.bot2values",
      dpInit: "/^accuweather\\.0.+?d5$/",
      modeScr: "bottom"
    },
    //Indicator
    //indicator 1
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "indicator",
      data: {
        entity1: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.NSPanel.Allgemein.Fenster.Status_offene"
          }
        },
        icon: {
          true: {
            value: { type: "const", constVal: "window-open-variant" },
            color: { type: "const", constVal: import_Color.Color.Red }
          },
          false: {
            value: { type: "const", constVal: "window-closed-variant" },
            color: { type: "const", constVal: import_Color.Color.Green }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        text: {
          true: {
            type: "const",
            constVal: "Fenster"
          },
          false: void 0
        }
      }
    },
    //indicator 2
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "indicator",
      data: {
        entity1: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.NSPanel.Allgemein.T\xFCren.Status_offene"
          }
        },
        icon: {
          true: {
            value: { type: "const", constVal: "door-open" },
            color: { type: "const", constVal: import_Color.Color.Red }
          },
          false: {
            value: { type: "const", constVal: "door-closed" },
            color: { type: "const", constVal: import_Color.Color.Green }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        text: {
          true: {
            type: "const",
            constVal: "T\xFCren"
          },
          false: void 0
        }
      }
    },
    //indicator 3
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "indicator",
      data: {
        entity1: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.NSPanel.Allgemein.Licht.Status_Ein"
          }
        },
        icon: {
          true: {
            value: { type: "const", constVal: "lightbulb" },
            color: { type: "const", constVal: import_Color.Color.Red }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: import_Color.Color.Green }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        text: {
          true: {
            type: "const",
            constVal: "Licht"
          },
          false: void 0
        }
      }
    },
    //indicator 4
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "indicator",
      data: {
        entity1: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.NSPanel.Allgemein.T\xFCrschloss.state"
          }
        },
        icon: {
          true: {
            value: { type: "const", constVal: "lock" },
            color: { type: "const", constVal: import_Color.Color.Green }
          },
          false: {
            value: { type: "const", constVal: "lock-open" },
            color: { type: "const", constVal: import_Color.Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        text: {
          true: {
            type: "const",
            constVal: "T\xFCrschloss"
          },
          false: void 0
        }
      }
    },
    //indicator 5
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "indicator",
      data: {
        entity1: {
          value: {
            type: "triggered",
            dp: "vw-connect.0.TMBLE7NS2K8033846.status.isCarLocked"
          }
        },
        icon: {
          true: {
            value: { type: "const", constVal: "car-key" },
            color: { type: "const", constVal: import_Color.Color.Green }
          },
          false: {
            value: void 0,
            color: { type: "const", constVal: import_Color.Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        text: {
          true: {
            type: "const",
            constVal: "Auto"
          },
          false: void 0
        }
      }
    },
    //indicator 6
    {
      role: "battery",
      template: "text.battery",
      dpInit: "0_userdata.0",
      modeScr: "indicator"
    },
    //indicator 7
    {
      role: "text",
      type: "text",
      dpInit: "",
      modeScr: "indicator",
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
            dp: "0_userdata.0.NSPanel.Allgemein.Fenster.Status_offene"
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
    //mrIcon1/2
    {
      // mricon 1
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "mricon",
      data: {
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Steckdosen.Schreibtisch.Control.Power"
          }
        },
        icon: {
          true: {
            value: {
              type: "const",
              constVal: "lightbulb"
            },
            color: {
              type: "const",
              constVal: import_Color.Color.Yellow
            }
          },
          false: {
            value: {
              type: "const",
              constVal: "lightbulb-outline"
            },
            color: {
              type: "const",
              constVal: import_Color.Color.HMIOff
            }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        text: {
          true: void 0,
          false: void 0
        }
      }
    },
    {
      // mricon 2
      role: "combined",
      dpInit: "",
      type: "text",
      modeScr: "mricon",
      data: {
        entity1: {
          value: {
            type: "internal",
            dp: "cmd/power2"
          }
        },
        icon: {
          true: {
            value: {
              type: "const",
              constVal: "lightbulb"
            },
            color: {
              type: "const",
              constVal: import_Color.Color.Yellow
            },
            text: {
              value: {
                type: "state",
                dp: "0_userdata.0.example_state_number"
              }
            }
          },
          false: {
            value: {
              type: "const",
              constVal: "lightbulb-outline"
            },
            color: {
              type: "const",
              constVal: import_Color.Color.HMIOff
            }
          }
        }
      }
    }
  ]
};
const Testconfig = [
  {
    pages: [pageGridMain, pageScreensaverTest, pagenEntitiesAdapter],
    // override by password.ts
    navigation: [
      {
        name: "main",
        //main ist die erste Seite
        left: { single: "2" },
        // arrow-top-left-bold-outline
        right: { single: "1" },
        page: "main"
      },
      {
        name: "1",
        left: { single: "main" },
        right: { single: "2" },
        page: "adapter"
      },
      {
        name: "2",
        left: { single: "1" },
        right: { single: "main" },
        page: "fahrplanrouten"
      }
    ],
    topic: "SmartHome/NSPanel_1",
    name: "Buero",
    config: {
      // dat hier hat noch keine bedeutung glaube ich :)
      momentLocale: "",
      locale: "de-DE",
      iconBig1: false,
      iconBig2: false
    },
    timeout: 30,
    // dat kommt vom Admin
    dimLow: 20,
    dimHigh: 90
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Testconfig
});
//# sourceMappingURL=config-custom.js.map
