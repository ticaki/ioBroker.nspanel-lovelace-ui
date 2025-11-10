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
  "text.clock": {
    role: "text",
    dpInit: "",
    adapter: "",
    type: "text",
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
      },
      icon: {
        true: {
          value: { type: "const", constVal: "clock-outline" },
          color: { type: "const", constVal: import_Color.Color.foreground },
          text: {
            value: {
              type: "internal",
              dp: "///time"
            },
            dateFormat: {
              type: "const",
              constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
            },
            textSize: { type: "const", constVal: 1 }
          }
        }
      }
    }
  },
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
          value: { type: "const", constVal: "window-closed-variant" },
          color: { type: "const", constVal: import_Color.Color.close }
        },
        false: {
          value: { type: "const", constVal: "window-open-variant" },
          color: { type: "const", constVal: import_Color.Color.open }
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
        true: { type: "const", constVal: "closed" },
        false: { type: "const", constVal: "opened" }
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
        scale: { type: "const", constVal: { val_min: 40, val_max: 0, val_best: 25, mode: "quadriGradAnchor" } }
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
          read: "return val < 0"
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
        true: { type: "const", constVal: "gate" },
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
    role: "",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: {
            mode: "auto",
            role: "state",
            type: "triggered",
            dp: "",
            regexp: /\.USERICON$/,
            def: "information-outline"
          },
          color: {
            mode: "auto",
            role: "value.rgb",
            type: "triggered",
            dp: "",
            regexp: /\.COLORDEC$/,
            def: import_Color.Color.activated
          },
          text: {
            value: {
              mode: "auto",
              role: "state",
              type: "triggered",
              dp: "",
              regexp: /\.ACTUAL$/,
              def: "info"
            }
          }
        },
        false: {
          value: {
            mode: "auto",
            role: "state",
            type: "triggered",
            dp: "",
            regexp: /\.USERICON$/,
            def: "information-off-outline"
          },
          color: {
            mode: "auto",
            role: "value.rgb",
            type: "triggered",
            dp: "",
            regexp: /\.COLORDEC$/,
            def: import_Color.Color.deactivated
          },
          text: {
            value: {
              mode: "auto",
              role: "state",
              type: "triggered",
              dp: "",
              regexp: /\.ACTUAL$/,
              def: "info"
            }
          }
        }
      },
      entity1: {
        value: { mode: "auto", role: "state", type: "triggered", dp: "", regexp: /\.ACTUAL$/, def: "info" }
      },
      text: {
        true: { mode: "auto", role: "text", type: "triggered", dp: "", regexp: /\.BUTTONTEXT$/, def: "info" },
        false: {
          mode: "auto",
          role: "text",
          type: "triggered",
          dp: "",
          regexp: /\.BUTTONTEXTOFF$/,
          def: "info_off"
        }
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
          value: { type: "const", constVal: "alert-outline" },
          color: { type: "const", constVal: import_Color.Color.Yellow }
        },
        false: void 0,
        scale: { type: "const", constVal: { val_min: 4, val_max: 0, mode: "triGrad" } }
      },
      entity1: {
        value: { mode: "auto", role: "value.warning", type: "triggered", dp: "", regexp: /\.LEVEL$/, def: 0 }
      },
      text: {
        true: {
          mode: "auto",
          role: "weather.title.short",
          type: "triggered",
          dp: "",
          regexp: /\.TITLE$/,
          def: "title"
        },
        false: void 0
      },
      text1: {
        true: {
          mode: "auto",
          role: "weather.title",
          type: "triggered",
          dp: "",
          regexp: /\.INFO$/,
          def: "info"
        },
        false: void 0
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
  "text.sainlogic.windarrow": {
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
          constVal: { val_min: 60, val_max: 0, val_best: 20, mode: "triGradAnchor" }
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
  "text.custom.windarrow": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "sainlogic",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "value.speed.wind",
          type: "triggered",
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
          role: "value.speed.wind",
          type: "triggered",
          dp: ``
        },
        decimal: {
          type: "const",
          constVal: 0
        }
      },
      icon: {
        true: {
          value: {
            mode: "auto",
            role: "value.direction.wind",
            type: "triggered",
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
          constVal: { val_min: 120, val_max: 0, val_best: 20, mode: "triGradAnchor" }
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
  "text.hmip.windcombo": {
    role: "textNotIcon",
    type: "text",
    modeScr: "bottom",
    adapter: "hmip",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /.channels\.1\.windSpeed/,
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
          regexp: /.channels\.1\.windSpeed/,
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
          text: {
            value: {
              mode: "auto",
              role: "",
              type: "triggered",
              regexp: /\.channels\.1\.windDirection/,
              dp: ``,
              read: `{
                                const directions = [
                                    "N",  "NNE", "NE",  "ENE",
                                    "E",  "ESE", "SE",  "SSE",
                                    "S",  "SSW", "SW",  "WSW",
                                    "W",  "WNW", "NW",  "NNW"
                                ];

                                const index = Math.round((val % 360) / 22.5) % 16;
                                return directions[index];
                            }`
            }
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
          constVal: { val_min: 130, val_max: 0, mode: "triGrad" }
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
  "text.isOnline": {
    role: "text",
    adapter: "",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "earth" },
          color: { type: "const", constVal: import_Color.Color.Green }
        },
        false: {
          value: { type: "const", constVal: "earth-off" },
          color: { type: "const", constVal: import_Color.Color.Red }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: ["indicator.reachable"],
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "Internet" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "online" },
        false: { type: "const", constVal: "offline" }
      }
    }
  },
  "text.openweathermap.sunriseset": {
    role: "4values",
    adapter: "openweathermap",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "weather-sunset-up" },
          color: { type: "const", constVal: { r: 253, g: 251, b: 29 } }
        },
        false: {
          value: { type: "const", constVal: "weather-sunset-down" },
          color: { type: "const", constVal: { r: 255, g: 138, b: 18 } }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "date.sunrise",
          dp: "",
          read: `
                        if (new Date().getDate() !== new Date(val).getDate()){
                            return null;
                        }
                        const t = new Date(val).getTime();
                        if (t < Date.now()) return null;
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
          role: "date.sunset",
          dp: "",
          read: `
                    if (new Date().getDate() !== new Date(val).getDate()){
                        return null;
                    }
                    const n = Date.now();
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
          role: "date.sunrise",
          dp: ""
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
  "text.openweathermap.favorit": {
    role: "text",
    adapter: "openweathermap",
    type: "text",
    modeScr: "favorit",
    data: {
      entity2: {
        value: {
          role: "value.temperature",
          mode: "auto",
          type: "state",
          dp: "",
          regexp: /\.current\.temperature$/
        },
        decimal: {
          type: "const",
          constVal: 1
        },
        factor: void 0
        /*unit: {
            type: 'const',
            constVal: '°C',
        },*/
      },
      icon: {
        true: {
          value: {
            type: "state",
            role: "weather.icon",
            mode: "auto",
            dp: "",
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
                    if (val && val.split('/').length > 1) {
                        val = val.split('/').pop();
                        val = val.split('.')[0];
                    }
                    switch (val) {
                        case "01d":
                            return 'weather-sunny';
                        case "01n":
                            return 'weather-night';
                        case "02d": //few clouds day
                            return 'weather-partly-cloudy';
                        case "02n": //few clouds night
                            return 'weather-night-partly-cloudy';
                        case "03d": //scattered clouds
                        case "03n":
                            return 'weather-cloudy';
                        case "04d": // cloudy
                        case "04n":
                            return 'weather-cloudy'; 
                        case "09d": //shower rain 
                        case "09n":
                            return 'weather-rainy';
                        case "10d": //rain 
                        case "10n":
                            return 'weather-pouring';
                        case "11d": //Thunderstorm 
                        case "11n":
                            return 'weather-lightning';
                        case "13d": //snow 
                        case "13n":
                            return 'weather-snowy';
                        case "50d": //mist 
                        case "50n":
                            return 'weather-fog';
                        default:
                            return 'alert-circle-outline';                         
                    }
                        }`
          },
          color: {
            type: "triggered",
            role: "weather.icon",
            mode: "auto",
            dp: "",
            read: `
                            if (val && val.split('/').length > 1) {
                                val = val.split('/').pop();
                                val = val.split('.')[0];
                            }
                            switch (val) {
                                case "01d": //clear sky day
                                    return Color.sunny;
                                case "01n": //clear sky night
                                    return Color.clearNight;
                                case "02d": //few clouds day
                                case "02n": //few clouds night
                                    return Color.partlyCloudy;
                                case "03d": //scattered clouds
                                case "03n":
                                    return Color.cloudy;
                                case "04d": //broken clouds
                                case "04n":
                                    return Color.cloudy;
                                case "09d": //shower rain 
                                case "09n":
                                    return Color.rainy;
                                case "10d": //rain 
                                case "10n":
                                    return Color.pouring;
                                case "11d": //Thunderstorm 
                                case "11n":
                                    return Color.lightningRainy;
                                case "13d": //snow 
                                case "13n":
                                    return Color.snowy;
                                case "50d": //mist 
                                case "50n":
                                    return Color.fog;
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
  "text.openweathermap.bot2values": {
    role: "2values",
    type: "text",
    modeScr: "bottom",
    adapter: "openweathermap",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /\.temperatureMin$/
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
          regexp: /\.temperatureMax$/
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
            type: "state",
            role: "",
            regexp: /.icon$/,
            mode: "auto",
            dp: "",
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
                    if (val && val.split('/').length > 1) {
                        val = val.split('/').pop();
                        val = val.split('.')[0];
                    }
                    switch (val) {
                        case "01d":
                            return 'weather-sunny';
                        case "01n":
                            return 'weather-night';
                        case "02d": //few clouds day
                            return 'weather-partly-cloudy';
                        case "02n": //few clouds night
                            return 'weather-night-partly-cloudy';
                        case "03d": //scattered clouds
                        case "03n":
                            return 'weather-cloudy';
                        case "04d": // cloudy
                        case "04n":
                            return 'weather-cloudy'; 
                        case "09d": //shower rain 
                        case "09n":
                            return 'weather-rainy';
                        case "10d": //rain 
                        case "10n":
                            return 'weather-pouring';
                        case "11d": //Thunderstorm 
                        case "11n":
                            return 'weather-lightning';
                        case "13d": //snow 
                        case "13n":
                            return 'weather-snowy';
                        case "50d": //mist 
                        case "50n":
                            return 'weather-fog';
                        default:
                            return 'alert-circle-outline';                         
                    }
                        }`
          },
          color: {
            type: "triggered",
            role: "",
            regexp: /.icon$/,
            mode: "auto",
            dp: "",
            read: `
                            if (val && val.split('/').length > 1) {
                                val = val.split('/').pop();
                                val = val.split('.')[0];
                            }
                            switch (val) {
                                case "01d": //clear sky day
                                    return Color.sunny;
                                case "01n": //clear sky night
                                    return Color.clearNight;
                                case "02d": //few clouds day
                                case "02n": //few clouds night
                                    return Color.partlyCloudy;
                                case "03d": //scattered clouds
                                case "03n":
                                    return Color.cloudy;
                                case "04d": //broken clouds
                                case "04n":
                                    return Color.cloudy;
                                case "09d": //shower rain 
                                case "09n":
                                    return Color.rainy;
                                case "10d": //rain 
                                case "10n":
                                    return Color.pouring;
                                case "11d": //Thunderstorm 
                                case "11n":
                                    return Color.lightningRainy;
                                case "13d": //snow 
                                case "13n":
                                    return Color.snowy;
                                case "50d": //mist 
                                case "50n":
                                    return Color.fog;
                                default:
                                    return Color.White;
                            }`
          }
        },
        false: { value: void 0, color: void 0 }
      },
      text: {
        true: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /\.date$/,
          read: `{
                        if (!val) {
                            return null;
                        }
                        const date = new Date(val);
                        if (!date) {
                            return null;
                        }
                        return date.toLocaleDateString(language || 'en', { weekday: "short" });
                    }`
        },
        false: void 0
      }
    }
  },
  "text.openweathermap.windspeed": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "openweathermap",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /^openweathermap\.[0-9]+\.forecast\.current\.windSpeed/,
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
          regexp: /^openweathermap\.[0-9]+\.forecast\.current\.windSpeed/,
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
  "text.openweathermap.winddirection": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "openweathermap",
    data: {
      entity2: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /^openweathermap\.[0-9]+\.forecast\.current\.windDirection$/,
          dp: ``,
          read: `{
                        const directions = [
                            "N",  "NNO", "NO",  "ONO",
                            "O",  "OSO", "SO",  "SSO",
                            "S",  "SSW", "SW",  "WSW",
                            "W",  "WNW", "NW",  "NNW"
                        ];
                        
                        // 360 Grad in 16 Sektoren aufteilen - 22.5\xB0 pro Richtung
                        const index = Math.round(((val % 360) / 22.5)) % 16;
                        return directions[index];
                    }`
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
  "text.openweathermap.windgust": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "openweathermap",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /^openweathermap\.[0-9]+\.forecast\.current\.windGust$/,
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
          regexp: /^openweathermap\.[0-9]+\.forecast\.current\.windGust$/,
          dp: ``
        },
        decimal: {
          type: "const",
          constVal: 0
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
  "text.pirate-weather.favorit": {
    role: "text",
    adapter: "pirate-weather",
    type: "text",
    modeScr: "favorit",
    data: {
      entity2: {
        value: {
          role: "value.temperature",
          mode: "auto",
          type: "state",
          dp: "",
          regexp: /\.currently\.temperature$/
        },
        decimal: {
          type: "const",
          constVal: 1
        },
        factor: void 0
        /*unit: {
            type: 'const',
            constVal: '°C',
        },*/
      },
      icon: {
        true: {
          value: {
            type: "state",
            role: "weather.icon.name",
            mode: "auto",
            dp: "",
            read: `switch (val) {
                                case 'cloudy':
                                case 'mostly-cloudy-day':
                                case 'mostly-cloudy-night':
                                    return 'weather-cloudy';
                                case 'fog':
                                case 'mist':
                                case 'smoke':
                                    return 'weather-fog';
                                case 'hail':
                                    return 'weather-hail';
                                case 'haze':
                                    return 'weather-hazy'
                                case 'thunderstorm':
                                    return 'weather-lightning';
                                case 'possible-precipitation-day':
                                case 'possible-precipitation-night':
                                    return 'weather-lightning-rainy';
                                case 'clear-night':
                                case 'mostly-clear-night':
                                    return 'weather-night';
                                case 'partly-cloudy-night':
                                    return 'weather-night-partly-cloudy';
                                case 'mostly-cloudy-day':
                                case 'partly-cloudy-day':
                                    return 'weather-partly-cloudy';
                                case 'possible-rain-day':
                                case 'possible-rain-night':
                                    return 'weather-partly-rainy';
                                case 'possible-snow-night':
                                case 'possible-snow-day':
                                    return 'weather-partly-snowy';
                                case 'possible-sleet-day':
                                case 'possible-sleet-night':
                                    return 'weather-partly-snowy-rainy';
                                case 'rain':
                                case 'heavy-rain':
                                case 'precipitation':
                                    return 'weather-pouring';
                                case 'drizzle':
                                case 'light-rain':
                                    return 'weather-rainy';
                                case 'light-snow':
                                case 'snow':
                                    return 'weather-snowy';
                                case 'heavy-sleet':
                                case 'heavy-snow':
                                case 'flurries':
                                    return 'weather-snowy-heavy';
                                case 'sleet':
                                case 'light-sleet':
                                case 'very-light-sleet':
                                    return 'weather-snowy-rainy';
                                case 'clear-day':
                                case 'mostly-clear-day':
                                    return 'weather-sunny';
                                case 'dangerous-wind':
                                    return 'weather-tornado';
                                case 'wind':
                                    return 'weather-windy';
                                case 'breezy':
                                    return 'weather-windy-variant';
                                default:
                                    return 'alert-circle-outline';
                            }`
          },
          color: {
            type: "triggered",
            role: "weather.icon.name",
            mode: "auto",
            dp: "",
            read: `
                            switch (val) {
                                case 'cloudy':
                                case 'mostly-cloudy-day':
                                case 'mostly-cloudy-night':
                                    return Color.cloudy; // cloudy

                                case 'fog':
                                case 'mist':
                                case 'haze':
                                case 'smoke':
                                    return Color.fog;

                                case 'hail':
                                    return Color.hail;

                                case 'thunderstorm': // T-Storms
                                    return Color.lightning;

                                case 'clear-night':
                                case 'mostly-clear-night':
                                    return Color.clearNight;

                                case 'partly-cloudy-day':
                                    return Color.partlyCloudy;

                                case 'partly-cloudy-night':
                                    return Color.partlyCloudy;

                                case 'rain':
                                case 'heavy-rain':
                                case 'precipitation':
                                    return Color.pouring;

                                case 'possible-rain-day':
                                case 'possible-rain-night':
                                case 'possible-precipitation-night':
                                case 'possible-precipitation-day':
                                case 'drizzle':
                                case 'light-rain':
                                    return Color.rainy;

                                case 'light-snow':
                                case 'snow':
                                case 'heavy-sleet':
                                case 'heavy-snow':
                                case 'flurries':
                                case 'possible-snow-day':
                                case 'possible-snow-night':
                                case 'possible-sleet-day':
                                case 'possible-sleet-night':
                                    return Color.snowy;

                                case 'sleet':
                                case 'light-sleet':
                                case 'very-light-sleet':
                                    return Color.snowyRainy;

                                case 'clear-day':
                                case 'mostly-clear-day':
                                    return Color.sunny;

                                case 'dangerous-wind':
                                case 'breezy':
                                case 'wind':
                                    return Color.windy;

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
  "text.pirate-weather.bot2values": {
    role: "2values",
    type: "text",
    modeScr: "bottom",
    adapter: "pirate-weather",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /\.temperatureMin$/
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
          regexp: /\.temperatureMax$/
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
            type: "state",
            role: "",
            regexp: /.icon$/,
            mode: "auto",
            dp: "",
            /**
             * How to use
             * this run its own this. U dont have accress to variables that no definied for this.
             * Color: in a import of color.ts
             * val: is the incoming value - raw
             *
             * The best thing is to write the function with () => { here }. Then remove the () => {}
             * and convert it into a template literal, using ``. A return is mandatory.
             */
            read: `
                            switch (val) {
                                case 'cloudy':
                                case 'mostly-cloudy-day':
                                case 'mostly-cloudy-night':
                                    return 'weather-cloudy';
                                case 'fog':
                                case 'mist':
                                case 'smoke':
                                    return 'weather-fog';
                                case 'hail':
                                    return 'weather-hail';
                                case 'haze':
                                    return 'weather-hazy'
                                case 'thunderstorm':
                                    return 'weather-lightning';
                                case 'possible-precipitation-day':
                                case 'possible-precipitation-night':
                                    return 'weather-lightning-rainy';
                                case 'clear-night':
                                case 'mostly-clear-night':
                                    return 'weather-night';
                                case 'partly-cloudy-night':
                                    return 'weather-night-partly-cloudy';
                                case 'mostly-cloudy-day':
                                case 'partly-cloudy-day':
                                    return 'weather-partly-cloudy';
                                case 'possible-rain-day':
                                case 'possible-rain-night':
                                    return 'weather-partly-rainy';
                                case 'possible-snow-night':
                                case 'possible-snow-day':
                                    return 'weather-partly-snowy';
                                case 'possible-sleet-day':
                                case 'possible-sleet-night':
                                    return 'weather-partly-snowy-rainy';
                                case 'rain':
                                case 'heavy-rain':
                                case 'precipitation':
                                    return 'weather-pouring';
                                case 'drizzle':
                                case 'light-rain':
                                    return 'weather-rainy';
                                case 'light-snow':
                                case 'snow':
                                    return 'weather-snowy';
                                case 'heavy-sleet':
                                case 'heavy-snow':
                                case 'flurries':
                                    return 'weather-snowy-heavy';
                                case 'sleet':
                                case 'light-sleet':
                                case 'very-light-sleet':
                                    return 'weather-snowy-rainy';
                                case 'clear-day':
                                case 'mostly-clear-day':
                                    return 'weather-sunny';
                                case 'dangerous-wind':
                                    return 'weather-tornado';
                                case 'wind':
                                    return 'weather-windy';
                                case 'breezy':
                                    return 'weather-windy-variant';
                                default:
                                    return 'alert-circle-outline';
                            }`
          },
          color: {
            type: "triggered",
            role: "",
            regexp: /.icon$/,
            mode: "auto",
            dp: "",
            read: `
                            switch (val) {
                                case 'cloudy':
                                case 'mostly-cloudy-day':
                                case 'mostly-cloudy-night':
                                    return Color.cloudy; // cloudy
                                case 'fog':
                                case 'mist':
                                case 'haze':
                                case 'smoke':
                                    return Color.fog;
                                case 'hail':
                                    return Color.hail;
                                case 'thunderstorm': // T-Storms
                                    return Color.lightning;
                                case 'clear-night':
                                case 'mostly-clear-night':
                                    return Color.clearNight;
                                case 'partly-cloudy-day':
                                    return Color.partlyCloudy;
                                case 'partly-cloudy-night':
                                    return Color.partlyCloudy;
                                case 'rain':
                                case 'heavy-rain':
                                case 'precipitation':
                                    return Color.pouring;
                                case 'possible-rain-day':
                                case 'possible-rain-night':
                                case 'possible-precipitation-night':
                                case 'possible-precipitation-day':
                                case 'drizzle':
                                case 'light-rain':
                                    return Color.rainy;
                                case 'light-snow':
                                case 'snow':
                                case 'heavy-sleet':
                                case 'heavy-snow':
                                case 'flurries':
                                case 'possible-snow-day':
                                case 'possible-snow-night':
                                case 'possible-sleet-day':
                                case 'possible-sleet-night':
                                    return Color.snowy
                                case 'sleet':
                                case 'light-sleet':
                                case 'very-light-sleet':
                                    return Color.snowyRainy;
                                case 'clear-day':
                                case 'mostly-clear-day':
                                    return Color.sunny;
                                case 'dangerous-wind':
                                case 'breezy':
                                case 'wind':
                                    return Color.windy;
                                default:
                                    return Color.White;
                            }`
          }
        },
        false: { value: void 0, color: void 0 }
      },
      text: {
        true: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /\.time$/,
          read: `{
                        if (!val) {
                            return null;
                        }
                        const date = new Date(val);
                        if (!date) {
                            return null;
                        }
                        return date.toLocaleDateString(language || 'en', { weekday: "short" });
                    }`
        },
        false: void 0
      }
    }
  },
  "text.pirate-weather.sunriseset": {
    role: "4values",
    adapter: "pirate-weather",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "weather-sunset-up" },
          color: { type: "const", constVal: import_Color.Color.sunny }
        },
        false: {
          value: { type: "const", constVal: "weather-sunset-down" },
          color: { type: "const", constVal: import_Color.Color.warning }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "date.sunrise",
          dp: "",
          read: `
            if (new Date().getDate() !== new Date(val).getDate()){
              return null;
            }
            const t = new Date(val).getTime();
            if (t < Date.now()) return null;
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
          role: "date.sunset",
          dp: "",
          read: `
            if (new Date().getDate() !== new Date(val).getDate()){
              return null;
            }
            const n = Date.now();
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
        value: { type: "triggered", mode: "auto", role: "date.sunrise", dp: "" },
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
  "text.pirate-weather.windspeed": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "pirate-weather",
    data: {
      entity1: {
        value: { mode: "auto", role: "", type: "triggered", regexp: /\.windSpeed$/, dp: `` },
        decimal: { type: "const", constVal: 0 },
        unit: void 0
      },
      entity2: {
        value: { mode: "auto", role: "", type: "triggered", regexp: /\.windSpeed$/, dp: `` },
        decimal: { type: "const", constVal: 0 }
      },
      icon: {
        true: {
          value: { type: "const", constVal: "weather-windy" },
          color: { type: "const", constVal: import_Color.Color.windy }
        },
        scale: { type: "const", constVal: { val_min: 0, val_max: 80 } },
        maxBri: void 0,
        minBri: void 0
      },
      text: { true: { type: "const", constVal: "Wind" }, false: void 0 }
    }
  },
  "text.pirate-weather.winddirection": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "pirate-weather",
    data: {
      entity2: {
        value: { mode: "auto", role: "", type: "triggered", regexp: /\.windBearingText$/, dp: `` },
        decimal: { type: "const", constVal: 0 },
        factor: void 0,
        unit: { type: "const", constVal: "" }
      },
      icon: {
        true: {
          value: { type: "const", constVal: "windsock" },
          color: { type: "const", constVal: import_Color.Color.info }
        },
        false: { value: void 0, color: void 0 },
        scale: void 0,
        maxBri: void 0,
        minBri: void 0
      },
      text: { true: { type: "const", constVal: "Windr." }, false: void 0 }
    }
  },
  "text.pirate-weather.windgust": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "pirate-weather",
    data: {
      entity1: {
        value: { mode: "auto", role: "", type: "triggered", regexp: /\.windGust$/, dp: `` },
        decimal: { type: "const", constVal: 0 },
        unit: void 0
      },
      entity2: {
        value: { mode: "auto", role: "", type: "triggered", regexp: /\.windGust$/, dp: `` },
        decimal: { type: "const", constVal: 0 }
      },
      icon: {
        true: {
          value: { type: "const", constVal: "weather-tornado" },
          color: { type: "const", constVal: import_Color.Color.gust }
        },
        scale: { type: "const", constVal: { val_min: 0, val_max: 80 } },
        maxBri: void 0,
        minBri: void 0
      },
      text: { true: { type: "const", constVal: "B\xF6en" }, false: void 0 }
    }
  },
  "text.pirate-weather.uvindex": {
    role: "text",
    type: "text",
    adapter: "pirate-weather",
    data: {
      entity1: {
        value: { type: "triggered", mode: "auto", role: "value.uv", dp: "", forceType: "string" },
        decimal: void 0,
        factor: void 0,
        unit: void 0
      },
      entity2: {
        value: { mode: "auto", role: "value.uv", type: "triggered", dp: ``, forceType: "string" },
        decimal: void 0,
        factor: void 0,
        unit: void 0
      },
      icon: {
        true: {
          value: { type: "const", constVal: "solar-power" },
          color: { type: "const", constVal: import_Color.Color.solar }
        },
        scale: { type: "const", constVal: { val_min: 0, val_max: 9 } },
        maxBri: void 0,
        minBri: void 0
      },
      text: { true: { type: "const", constVal: "UV" }, false: void 0 }
    }
  },
  "text.pirate-weather.hourlyweather": {
    role: "",
    type: "text",
    adapter: "pirate-weather",
    data: {
      entity1: {
        value: { mode: "auto", role: "", type: "triggered", dp: "", regexp: /\.temperature$/ },
        decimal: { type: "const", constVal: 0 },
        factor: void 0
      },
      entity2: {
        value: { mode: "auto", role: "", type: "triggered", dp: "", regexp: /\.temperature$/ },
        decimal: { type: "const", constVal: 0 },
        factor: void 0
      },
      icon: {
        true: {
          value: {
            type: "state",
            role: "",
            regexp: /.icon$/,
            mode: "auto",
            dp: "",
            read: `
              switch (val) {
                case 'cloudy':
                case 'mostly-cloudy-day':
                case 'mostly-cloudy-night':
                  return 'weather-cloudy';
                case 'fog':
                case 'mist':
                case 'smoke':
                  return 'weather-fog';
                case 'hail':
                  return 'weather-hail';
                case 'haze':
                  return 'weather-hazy'
                case 'thunderstorm':
                  return 'weather-lightning';
                case 'possible-precipitation-day':
                case 'possible-precipitation-night':
                  return 'weather-lightning-rainy';
                case 'clear-night':
                case 'mostly-clear-night':
                  return 'weather-night';
                case 'partly-cloudy-night':
                  return 'weather-night-partly-cloudy';
                case 'mostly-cloudy-day':
                case 'partly-cloudy-day':
                  return 'weather-partly-cloudy';
                case 'possible-rain-day':
                case 'possible-rain-night':
                  return 'weather-partly-rainy';
                case 'possible-snow-night':
                case 'possible-snow-day':
                  return 'weather-partly-snowy';
                case 'possible-sleet-day':
                case 'possible-sleet-night':
                  return 'weather-partly-snowy-rainy';
                case 'rain':
                case 'heavy-rain':
                case 'precipitation':
                  return 'weather-pouring';
                case 'drizzle':
                case 'light-rain':
                  return 'weather-rainy';
                case 'light-snow':
                case 'snow':
                  return 'weather-snowy';
                case 'heavy-sleet':
                case 'heavy-snow':
                case 'flurries':
                  return 'weather-snowy-heavy';
                case 'sleet':
                case 'light-sleet':
                case 'very-light-sleet':
                  return 'weather-snowy-rainy';
                case 'clear-day':
                case 'mostly-clear-day':
                  return 'weather-sunny';
                case 'dangerous-wind':
                  return 'weather-tornado';
                case 'wind':
                  return 'weather-windy';
                case 'breezy':
                  return 'weather-windy-variant';
                default:
                  return 'alert-circle-outline';
              }`
          },
          color: {
            type: "triggered",
            role: "",
            regexp: /.icon$/,
            mode: "auto",
            dp: "",
            read: `
              switch (val) {
                case 'cloudy':
                case 'mostly-cloudy-day':
                case 'mostly-cloudy-night':
                  return Color.cloudy;
                case 'fog':
                case 'mist':
                case 'haze':
                case 'smoke':
                  return Color.fog;
                case 'hail':
                  return Color.hail;
                case 'thunderstorm':
                  return Color.lightning;
                case 'clear-night':
                case 'mostly-clear-night':
                  return Color.clearNight;
                case 'partly-cloudy-day':
                case 'partly-cloudy-night':
                  return Color.partlyCloudy;
                case 'rain':
                case 'heavy-rain':
                case 'precipitation':
                  return Color.pouring;
                case 'possible-rain-day':
                case 'possible-rain-night':
                case 'possible-precipitation-night':
                case 'possible-precipitation-day':
                case 'drizzle':
                case 'light-rain':
                  return Color.rainy;
                case 'light-snow':
                case 'snow':
                case 'heavy-sleet':
                case 'heavy-snow':
                case 'flurries':
                case 'possible-snow-day':
                case 'possible-snow-night':
                case 'possible-sleet-day':
                case 'possible-sleet-night':
                  return Color.snowy
                case 'sleet':
                case 'light-sleet':
                case 'very-light-sleet':
                  return Color.snowyRainy;
                case 'clear-day':
                case 'mostly-clear-day':
                  return Color.sunny;
                case 'dangerous-wind':
                case 'breezy':
                case 'wind':
                  return Color.windy;
                default:
                  return Color.White;
              }`
          }
        },
        false: { value: void 0, color: void 0 }
      },
      text: {
        true: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /\.time$/,
          read: `{
            if (!val) return null;
            const date = new Date(val);
            if (!date) return null;
            return date.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit" });
          }`
        },
        false: void 0
      }
    }
  },
  "text.brightsky.sunriseset": {
    role: "4values",
    adapter: "brightsky",
    type: "text",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "weather-sunset-up" },
          color: { type: "const", constVal: import_Color.Color.sunrise }
        },
        false: {
          value: { type: "const", constVal: "weather-sunset-down" },
          color: { type: "const", constVal: import_Color.Color.sunset }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "date.sunrise.forecast.0",
          dp: "",
          read: `
            if (new Date().getDate() !== new Date(val).getDate()){
              return null;
            }
            const t = new Date(val).getTime();
            if (t < Date.now()) return null;
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
          read: `
            if (new Date().getDate() !== new Date(val).getDate()){
              return null;
            }
            const n = Date.now();
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
        value: { type: "triggered", mode: "auto", role: "date.sunrise.forecast.1", dp: "" },
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
  //Brightsky favorit dayly weather
  "text.brightsky.favorit": {
    role: "text",
    adapter: "brightsky",
    type: "text",
    modeScr: "favorit",
    data: {
      entity2: {
        value: {
          role: "value.temperature",
          mode: "auto",
          type: "state",
          dp: "",
          regexp: /\.current\.temperature$/
        },
        decimal: {
          type: "const",
          constVal: 1
        },
        factor: void 0
        /*unit: {
            type: 'const',
            constVal: '°C',
        },*/
      },
      icon: {
        true: {
          value: {
            type: "state",
            role: "",
            regexp: /.icon_special$/,
            mode: "auto",
            dp: ""
          },
          color: {
            type: "triggered",
            role: "",
            regexp: /.icon_special$/,
            mode: "auto",
            dp: "",
            read: `
                            switch (val) {
                                case 'weather-cloudy':
                                    return Color.cloudy; // cloudy
                                case 'weather-fog':
                                    return Color.fog;
                                case 'weather-hail':
                                    return Color.hail;
                                case 'weather-lightning': // T-Storms
                                    return Color.lightning;
                                case 'weather-night':
                                    return Color.clearNight;
                                case 'weather-partly-cloudy':
                                case 'weather-night-partly-cloudy':
                                    return Color.partlyCloudy;
                                case 'weather-pouring':
                                    return Color.pouring;
                                case 'weather-partly-rainy':
                                case 'weather-lightning-rainy':
                                case 'weather-rainy':
                                    return Color.rainy;
                                case 'weather-partly-snowy':
                                case 'weather-snowy-rainy':
                                case 'weather-snowy-heavy':
                                case 'weather-partly-snowy':
                                case 'weather-partly-snowy':
                                    return Color.snowy
                                case 'weather-partly-snowy-rainy':
                                    return Color.snowyRainy;
                                case 'weather-sunny':
                                    return Color.sunny;
                                case 'weather-tornado':
                                case 'weather-windy':
                                case 'weather-windy-variant':
                                    return Color.windy;
                                default:
                                    return Color.Red;
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
  //Brightsky min max temperature and day icon
  "text.brightsky.bot2values": {
    role: "2values",
    type: "text",
    modeScr: "bottom",
    adapter: "brightsky",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /\.temperature_min$/
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
          regexp: /\.temperature_max$/
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
            type: "state",
            role: "",
            regexp: /.icon_special$/,
            mode: "auto",
            dp: ""
          },
          color: {
            type: "triggered",
            role: "",
            regexp: /.icon_special$/,
            mode: "auto",
            dp: "",
            read: `
                            switch (val) {
                                case 'weather-cloudy':
                                    return Color.cloudy; // cloudy
                                case 'weather-fog':
                                    return Color.fog;
                                case 'weather-hail':
                                    return Color.hail;
                                case 'weather-lightning': // T-Storms
                                    return Color.lightning;
                                case 'weather-night':
                                    return Color.clearNight;
                                case 'weather-partly-cloudy':
                                    return Color.partlyCloudy;
                                case 'weather-pouring':
                                    return Color.pouring;
                                case 'weather-partly-rainy':
                                case 'weather-lightning-rainy':
                                    return Color.rainy;
                                case 'weather-partly-snowy':
                                case 'weather-snowy-rainy':
                                case 'weather-snowy-heavy':
                                case 'weather-partly-snowy':
                                case 'weather-partly-snowy':
                                    return Color.snowy
                                case 'weather-partly-snowy-rainy':
                                    return Color.snowyRainy;
                                case 'weather-sunny':
                                    return Color.sunny;
                                case 'weather-tornado':
                                case 'weather-windy':
                                case 'weather-windy-variant':
                                    return Color.windy;
                                default:
                                    return Color.Red;
                            }`
          }
        },
        false: { value: void 0, color: void 0 }
      },
      text: {
        true: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /\.timestamp$/,
          read: `{
                        if (!val) {
                            return null;
                        }
                        const date = new Date(val);
                        if (!date) {
                            return null;
                        }
                        return date.toLocaleDateString(language || 'en', { weekday: "short" });
                    }`
        },
        false: void 0
      }
    }
  },
  //Brightsky temperature and hourly icon
  "text.brightsky.bot1Value": {
    role: "",
    type: "text",
    modeScr: "bottom",
    adapter: "brightsky",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /\.temperature$/
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
          regexp: /\.temperature$/
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
            type: "state",
            role: "",
            regexp: /.icon$/,
            mode: "auto",
            dp: "",
            /**
             * How to use
             * this run its own this. U dont have accress to variables that no definied for this.
             * Color: in a import of color.ts
             * val: is the incoming value - raw
             *
             * The best thing is to write the function with () => { here }. Then remove the () => {}
             * and convert it into a template literal, using ``. A return is mandatory.
             */
            read: `
                            switch (val) {
                                case 'cloudy':
                                case 'mostly-cloudy-day':
                                case 'mostly-cloudy-night':
                                    return 'weather-cloudy';
                                case 'fog':
                                case 'mist':
                                case 'smoke':
                                    return 'weather-fog';
                                case 'hail':
                                    return 'weather-hail';
                                case 'haze':
                                    return 'weather-hazy'
                                case 'thunderstorm':
                                    return 'weather-lightning';
                                case 'possible-precipitation-day':
                                case 'possible-precipitation-night':
                                    return 'weather-lightning-rainy';
                                case 'clear-night':
                                case 'mostly-clear-night':
                                    return 'weather-night';
                                case 'partly-cloudy-night':
                                    return 'weather-night-partly-cloudy';
                                case 'mostly-cloudy-day':
                                case 'partly-cloudy-day':
                                    return 'weather-partly-cloudy';
                                case 'possible-rain-day':
                                case 'possible-rain-night':
                                    return 'weather-partly-rainy';
                                case 'possible-snow-night':
                                case 'possible-snow-day':
                                    return 'weather-partly-snowy';
                                case 'possible-sleet-day':
                                case 'possible-sleet-night':
                                    return 'weather-partly-snowy-rainy';
                                case 'rain':
                                case 'heavy-rain':
                                case 'precipitation':
                                    return 'weather-pouring';
                                case 'drizzle':
                                case 'light-rain':
                                    return 'weather-rainy';
                                case 'light-snow':
                                case 'snow':
                                    return 'weather-snowy';
                                case 'heavy-sleet':
                                case 'heavy-snow':
                                case 'flurries':
                                    return 'weather-snowy-heavy';
                                case 'sleet':
                                case 'light-sleet':
                                case 'very-light-sleet':
                                    return 'weather-snowy-rainy';
                                case 'clear-day':
                                case 'mostly-clear-day':
                                    return 'weather-sunny';
                                case 'dangerous-wind':
                                    return 'weather-tornado';
                                case 'wind':
                                    return 'weather-windy';
                                case 'breezy':
                                    return 'weather-windy-variant';
                                default:
                                    return 'alert-circle-outline';
                            }`
          },
          color: {
            type: "triggered",
            role: "",
            regexp: /.icon$/,
            mode: "auto",
            dp: "",
            read: `
                            switch (val) {
                                case 'cloudy':
                                case 'mostly-cloudy-day':
                                case 'mostly-cloudy-night':
                                    return Color.cloudy; // cloudy
                                case 'fog':
                                case 'mist':
                                case 'haze':
                                case 'smoke':
                                    return Color.fog;
                                case 'hail':
                                    return Color.hail;
                                case 'thunderstorm': // T-Storms
                                    return Color.lightning;
                                case 'clear-night':
                                case 'mostly-clear-night':
                                    return Color.clearNight;
                                case 'partly-cloudy-day':
                                    return Color.partlyCloudy;
                                case 'partly-cloudy-night':
                                    return Color.partlyCloudy;
                                case 'rain':
                                case 'heavy-rain':
                                case 'precipitation':
                                    return Color.pouring;
                                case 'possible-rain-day':
                                case 'possible-rain-night':
                                case 'possible-precipitation-night':
                                case 'possible-precipitation-day':
                                case 'drizzle':
                                case 'light-rain':
                                    return Color.rainy;
                                case 'light-snow':
                                case 'snow':
                                case 'heavy-sleet':
                                case 'heavy-snow':
                                case 'flurries':
                                case 'possible-snow-day':
                                case 'possible-snow-night':
                                case 'possible-sleet-day':
                                case 'possible-sleet-night':
                                    return Color.snowy
                                case 'sleet':
                                case 'light-sleet':
                                case 'very-light-sleet':
                                    return Color.snowyRainy;
                                case 'clear-day':
                                case 'mostly-clear-day':
                                    return Color.sunny;
                                case 'dangerous-wind':
                                case 'breezy':
                                case 'wind':
                                    return Color.windy;
                                default:
                                    return Color.White;
                            }`
          }
        },
        false: { value: void 0, color: void 0 }
      },
      text: {
        true: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /\.timestamp$/,
          read: `{
                        if (!val) {
                            return null;
                        }
                        const date = new Date(val);
                        if (!date) {
                            return null;
                        }
                        return date.toLocaleTimeString(language || 'en', { hour: 'numeric' });
                    }`
        },
        false: void 0
      }
    }
  },
  // Brightsky wind speed
  "text.brightsky.windspeed": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "brightsky",
    data: {
      entity1: {
        value: { mode: "auto", role: "", type: "triggered", regexp: /\.wind_speed_10$/, dp: `` },
        decimal: { type: "const", constVal: 0 },
        unit: void 0
      },
      entity2: {
        value: { mode: "auto", role: "", type: "triggered", regexp: /\.wind_speed_10$/, dp: `` },
        decimal: { type: "const", constVal: 0 }
      },
      icon: {
        true: {
          value: { type: "const", constVal: "weather-windy" },
          color: { type: "const", constVal: import_Color.Color.windy }
        },
        scale: { type: "const", constVal: { val_min: 0, val_max: 80 } },
        maxBri: void 0,
        minBri: void 0
      },
      text: {
        true: { type: "const", constVal: "Wind" },
        false: void 0
      }
    }
  },
  // Brightsky wind direction
  "text.brightsky.winddirection": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "brightsky",
    data: {
      entity2: {
        value: { mode: "auto", role: "", type: "triggered", regexp: /\.wind_bearing_text$/, dp: `` },
        decimal: { type: "const", constVal: 0 },
        factor: void 0,
        unit: { type: "const", constVal: "" }
      },
      icon: {
        true: {
          value: { type: "const", constVal: "windsock" },
          color: { type: "const", constVal: import_Color.Color.info }
        },
        false: { value: void 0, color: void 0 },
        scale: void 0,
        maxBri: void 0,
        minBri: void 0
      },
      text: {
        true: { type: "const", constVal: "Windr." },
        false: void 0
      }
    }
  },
  // Brightsky wind gust
  "text.brightsky.windgust": {
    role: "text",
    type: "text",
    modeScr: "bottom",
    adapter: "brightsky",
    data: {
      entity1: {
        value: { mode: "auto", role: "", type: "triggered", regexp: /\.wind_gust_speed_10$/, dp: `` },
        decimal: { type: "const", constVal: 0 },
        unit: void 0
      },
      entity2: {
        value: { mode: "auto", role: "", type: "triggered", regexp: /\.wind_gust_speed_10$/, dp: `` },
        decimal: { type: "const", constVal: 0 }
      },
      icon: {
        true: {
          value: { type: "const", constVal: "weather-tornado" },
          color: { type: "const", constVal: import_Color.Color.gust }
        },
        scale: { type: "const", constVal: { val_min: 0, val_max: 80 } },
        maxBri: void 0,
        minBri: void 0
      },
      text: {
        true: { type: "const", constVal: "B\xF6en" },
        false: void 0
      }
    }
  },
  // Brightsky solar radiation
  "text.brightsky.solar": {
    role: "text",
    type: "text",
    adapter: "brightsky",
    data: {
      entity1: {
        value: { type: "triggered", mode: "auto", role: "", regexp: /\.solar_10$/, dp: `` },
        decimal: void 0,
        factor: void 0,
        unit: void 0
      },
      entity2: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          regexp: /\.solar_10$/,
          dp: ``,
          forceType: "string"
        },
        decimal: { type: "const", constVal: 0 },
        factor: { type: "const", constVal: 1e3 },
        unit: { type: "const", constVal: " W/m\xB2" }
      },
      icon: {
        true: {
          value: { type: "const", constVal: "solar-power" },
          color: { type: "const", constVal: import_Color.Color.solar }
        },
        scale: { type: "const", constVal: { val_min: 0, val_max: 9 } },
        maxBri: void 0,
        minBri: void 0
      },
      text: {
        true: { type: "const", constVal: "Solar" },
        false: void 0
      }
    }
  },
  //Brightsky favorit hourly weather
  "text.brightsky.hourlyweather": {
    role: "",
    type: "text",
    adapter: "brightsky",
    data: {
      entity1: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /\.temperature$/
        },
        decimal: {
          type: "const",
          constVal: 0
        },
        factor: void 0
      },
      entity2: {
        value: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /\.temperature$/
        },
        decimal: {
          type: "const",
          constVal: 0
        },
        factor: void 0
      },
      icon: {
        true: {
          value: {
            type: "state",
            role: "",
            regexp: /.icon$/,
            mode: "auto",
            dp: "",
            /**
             * How to use
             * this run its own this. U dont have accress to variables that no definied for this.
             * Color: in a import of color.ts
             * val: is the incoming value - raw
             *
             * The best thing is to write the function with () => { here }. Then remove the () => {}
             * and convert it into a template literal, using ``. A return is mandatory.
             */
            read: `
                            switch (val) {
                                case 'cloudy':
                                case 'mostly-cloudy-day':
                                case 'mostly-cloudy-night':
                                    return 'weather-cloudy';
                                case 'fog':
                                case 'mist':
                                case 'smoke':
                                    return 'weather-fog';
                                case 'hail':
                                    return 'weather-hail';
                                case 'haze':
                                    return 'weather-hazy'
                                case 'thunderstorm':
                                    return 'weather-lightning';
                                case 'possible-precipitation-day':
                                case 'possible-precipitation-night':
                                    return 'weather-lightning-rainy';
                                case 'clear-night':
                                case 'mostly-clear-night':
                                    return 'weather-night';
                                case 'partly-cloudy-night':
                                    return 'weather-night-partly-cloudy';
                                case 'mostly-cloudy-day':
                                case 'partly-cloudy-day':
                                    return 'weather-partly-cloudy';
                                case 'possible-rain-day':
                                case 'possible-rain-night':
                                    return 'weather-partly-rainy';
                                case 'possible-snow-night':
                                case 'possible-snow-day':
                                    return 'weather-partly-snowy';
                                case 'possible-sleet-day':
                                case 'possible-sleet-night':
                                    return 'weather-partly-snowy-rainy';
                                case 'rain':
                                case 'heavy-rain':
                                case 'precipitation':
                                    return 'weather-pouring';
                                case 'drizzle':
                                case 'light-rain':
                                    return 'weather-rainy';
                                case 'light-snow':
                                case 'snow':
                                    return 'weather-snowy';
                                case 'heavy-sleet':
                                case 'heavy-snow':
                                case 'flurries':
                                    return 'weather-snowy-heavy';
                                case 'sleet':
                                case 'light-sleet':
                                case 'very-light-sleet':
                                    return 'weather-snowy-rainy';
                                case 'clear-day':
                                case 'mostly-clear-day':
                                    return 'weather-sunny';
                                case 'dangerous-wind':
                                    return 'weather-tornado';
                                case 'wind':
                                    return 'weather-windy';
                                case 'breezy':
                                    return 'weather-windy-variant';
                                default:
                                    return 'alert-circle-outline';
                            }`
          },
          color: {
            type: "triggered",
            role: "",
            regexp: /.icon$/,
            mode: "auto",
            dp: "",
            read: `
                            switch (val) {
                                case 'cloudy':
                                case 'mostly-cloudy-day':
                                case 'mostly-cloudy-night':
                                    return Color.cloudy; // cloudy
                                case 'fog':
                                case 'mist':
                                case 'haze':
                                case 'smoke':
                                    return Color.fog;
                                case 'hail':
                                    return Color.hail;
                                case 'thunderstorm': // T-Storms
                                    return Color.lightning;
                                case 'clear-night':
                                case 'mostly-clear-night':
                                    return Color.clearNight;
                                case 'partly-cloudy-day':
                                    return Color.partlyCloudy;
                                case 'partly-cloudy-night':
                                    return Color.partlyCloudy;
                                case 'rain':
                                case 'heavy-rain':
                                case 'precipitation':
                                    return Color.pouring;
                                case 'possible-rain-day':
                                case 'possible-rain-night':
                                case 'possible-precipitation-night':
                                case 'possible-precipitation-day':
                                case 'drizzle':
                                case 'light-rain':
                                    return Color.rainy;
                                case 'light-snow':
                                case 'snow':
                                case 'heavy-sleet':
                                case 'heavy-snow':
                                case 'flurries':
                                case 'possible-snow-day':
                                case 'possible-snow-night':
                                case 'possible-sleet-day':
                                case 'possible-sleet-night':
                                    return Color.snowy
                                case 'sleet':
                                case 'light-sleet':
                                case 'very-light-sleet':
                                    return Color.snowyRainy;
                                case 'clear-day':
                                case 'mostly-clear-day':
                                    return Color.sunny;
                                case 'dangerous-wind':
                                case 'breezy':
                                case 'wind':
                                    return Color.windy;
                                default:
                                    return Color.White;
                            }`
          }
        },
        false: { value: void 0, color: void 0 }
      },
      text: {
        true: {
          mode: "auto",
          role: "",
          type: "triggered",
          dp: "",
          regexp: /\.timestamp$/,
          read: `{
                        if (!val) {
                            return null;
                        }
                        const date = new Date(val);
                        if (!date) {
                            return null;
                        }
                        return date.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit" });
                    }`
        },
        false: void 0
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
          color: { type: "const", constVal: { r: 253, g: 251, b: 29 } }
        },
        false: {
          value: { type: "const", constVal: "weather-sunset-down" },
          color: { type: "const", constVal: { r: 255, g: 138, b: 18 } }
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
                        return Color.exceptional; // exceptional

                    case 7: // Cloudy
                    case 8: // Dreary (Overcast)
                    case 38: // Mostly Cloudy
                        return Color.cloudy; // cloudy

                    case 11: // fog
                        return Color.fog; // fog

                    case 25: // Sleet
                        return Color.hail; // Hail

                    case 15: // T-Storms
                        return Color.lightning; // lightning

                    case 16: // Mostly Cloudy w/ T-Storms
                    case 17: // Partly Sunny w/ T-Storms
                    case 41: // Partly Cloudy w/ T-Storms
                    case 42: // Mostly Cloudy w/ T-Storms
                        return Color.lightningRainy; // lightning-rainy

                    case 33: // Clear
                    case 34: // Mostly Clear
                    case 37: // Hazy Moonlight
                        return Color.clearNight;

                    case 3: // Partly Sunny
                    case 4: // Intermittent Clouds
                    case 6: // Mostly Cloudy
                    case 35: // Partly Cloudy
                    case 36: // Intermittent Clouds
                        return Color.partlyCloudy; // partlycloudy

                    case 18: // pouring
                        return Color.pouring; // pouring

                    case 12: // Showers
                    case 13: // Mostly Cloudy w/ Showers
                    case 14: // Partly Sunny w/ Showers
                    case 26: // Freezing Rain
                    case 39: // Partly Cloudy w/ Showers
                    case 40: // Mostly Cloudy w/ Showers
                        return Color.rainy; // rainy

                    case 19: // Flurries
                    case 20: // Mostly Cloudy w/ Flurries
                    case 21: // Partly Sunny w/ Flurries
                    case 22: // Snow
                    case 23: // Mostly Cloudy w/ Snow
                    case 43: // Mostly Cloudy w/ Flurries
                    case 44: // Mostly Cloudy w/ Snow
                        return Color.snowy; // snowy

                    case 29: // Rain and Snow
                        return Color.snowyRainy; // snowy-rainy

                    case 1: // Sunny
                    case 2: // Mostly Sunny
                    case 5: // Hazy Sunshine
                        return Color.sunny; // sunny

                    case 32: // windy
                        return Color.windy; // windy

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
                                        return Color.tornado; // exceptional

                                    case 7: // Cloudy
                                    case 8: // Dreary (Overcast)
                                    case 38: // Mostly Cloudy
                                        return Color.cloudy; // cloudy

                                    case 11: // fog
                                        return Color.fog; // fog

                                    case 25: // Sleet
                                        return Color.hail; // Hail

                                    case 15: // T-Storms
                                        return Color.lightning; // lightning

                                    case 16: // Mostly Cloudy w/ T-Storms
                                    case 17: // Partly Sunny w/ T-Storms
                                    case 41: // Partly Cloudy w/ T-Storms
                                    case 42: // Mostly Cloudy w/ T-Storms
                                        return Color.lightningRainy; // lightning-rainy

                                    case 33: // Clear
                                    case 34: // Mostly Clear
                                    case 37: // Hazy Moonlight
                                        return Color.clearNight;

                                    case 3: // Partly Sunny
                                    case 4: // Intermittent Clouds
                                    case 6: // Mostly Cloudy
                                    case 35: // Partly Cloudy
                                    case 36: // Intermittent Clouds
                                        return Color.partlyCloudy; // partlycloudy

                                    case 18: // pouring
                                        return Color.pouring; // pouring

                                    case 12: // Showers
                                    case 13: // Mostly Cloudy w/ Showers
                                    case 14: // Partly Sunny w/ Showers
                                    case 26: // Freezing Rain
                                    case 39: // Partly Cloudy w/ Showers
                                    case 40: // Mostly Cloudy w/ Showers
                                        return Color.rainy; // rainy

                                    case 19: // Flurries
                                    case 20: // Mostly Cloudy w/ Flurries
                                    case 21: // Partly Sunny w/ Flurries
                                    case 22: // Snow
                                    case 23: // Mostly Cloudy w/ Snow
                                    case 43: // Mostly Cloudy w/ Flurries
                                    case 44: // Mostly Cloudy w/ Snow
                                        return Color.snowy; // snowy

                                    case 29: // Rain and Snow
                                        return Color.snowyRainy; // snowy-rainy

                                    case 1: // Sunny
                                    case 2: // Mostly Sunny
                                    case 5: // Hazy Sunshine
                                        return Color.sunny; // sunny

                                    case 32: // windy
                                        return Color.windy; // windy

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
  "text.roborock.status": {
    role: "text.states",
    adapter: "roborock.0.Devices",
    type: "text",
    data: {
      icon: {
        true: {
          value: {
            type: "triggered",
            mode: "auto",
            regexp: /\.deviceStatus\.state$/,
            dp: "",
            read: `{
                            switch (val) {
                                case 0:
                                    return 'progress-question';
                                case 1:
                                    return 'restart';
                                case 2:
                                    return 'sleep';
                                case 3:
                                    return 'timer-stop-outline';
                                case 4:
                                    return 'remote';
                                case 5:
                                    return 'broom';
                                case 6:
                                    return 'home-circle-outline';
                                case 7:
                                    return 'hand-back-right-outline';
                                case 8:
                                    return 'battery-charging-medium';
                                case 9:
                                    return 'battery-alert-variant-outline';
                                case 10:
                                    return 'motion-pause-outline';
                                case 11:
                                    return 'liquid-spot';
                                case 12:
                                    return 'alert-outline';
                                case 13:
                                    return 'power-off';
                                case 14:
                                    return 'update';
                                case 15:
                                    return 'home-heart';
                                case 16:
                                    return 'arrow-down-bold-hexagon-outline';
                                case 17:
                                    return 'select-place';
                                case 18:
                                    return 'floor-plan';
                                case 22:
                                    return 'delete-empty-outline';
                                case 23:
                                    return 'wiper-wash';
                                case 26:
                                    return 'wiper-wash';
                                case 28:
                                    return 'call-made';
                                case 29:
                                    return 'map';
                                case 100:
                                    return 'battery';
                                default:
                                    return '?';
                            }
                        }`
          },
          color: { type: "const", constVal: import_Color.Color.Green }
        }
      },
      entity1: {
        value: {
          mode: "auto",
          type: "triggered",
          regexp: /\.deviceStatus\.state$/,
          dp: ""
        }
      },
      text: {
        true: { type: "triggered", mode: "auto", regexp: /\.deviceStatus\.state$/, dp: "" },
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
