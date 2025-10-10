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
var button_exports = {};
__export(button_exports, {
  buttonTemplates: () => buttonTemplates
});
module.exports = __toCommonJS(button_exports);
var import_Color = require("../const/Color");
const buttonTemplates = {
  "button.alias.fahrplan.departure": {
    role: "text.list",
    type: "button",
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
  "button.iconLeftSize": {
    role: "text.list",
    type: "button",
    adapter: "",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "size-m" },
          color: { type: "const", constVal: import_Color.Color.Yellow }
        },
        false: {
          value: void 0,
          color: { type: "const", constVal: import_Color.Color.Green }
        }
      },
      entity1: {
        value: {
          type: "internal",
          dp: "cmd/bigIconLeft"
        }
      },
      text: {
        true: { type: "const", constVal: "IconLeft" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "big" },
        false: { type: "const", constVal: "medium" }
      }
    }
  },
  "button.iconRightSize": {
    role: "text.list",
    type: "button",
    adapter: "",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "size-m" },
          color: { type: "const", constVal: import_Color.Color.Yellow }
        },
        false: {
          value: void 0,
          color: { type: "const", constVal: import_Color.Color.Green }
        }
      },
      entity1: {
        value: {
          type: "internal",
          dp: "cmd/bigIconRight"
        }
      },
      text: {
        true: { type: "const", constVal: "IconRight" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "big" },
        false: { type: "const", constVal: "medium" }
      }
    }
  },
  "button.esphome.powerplug": {
    role: "",
    type: "button",
    adapter: "esphome",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "power-plug" },
          color: { type: "const", constVal: import_Color.Color.On }
        },
        false: {
          value: { type: "const", constVal: "power-plug-off-outline" },
          color: { type: "const", constVal: import_Color.Color.Off }
        }
      },
      entity1: {
        value: {
          mode: "auto",
          type: "triggered",
          role: "",
          dp: "",
          regexp: /esphome\.[0-9]+\..+?\.Switch\..+?\.state/
        }
      },
      text: {
        true: { type: "const", constVal: "Plug" },
        false: void 0
      },
      text1: {
        true: { type: "const", constVal: "on" },
        false: { type: "const", constVal: "off" }
      },
      setValue1: {
        mode: "auto",
        type: "state",
        role: "",
        dp: "",
        regexp: /esphome\.[0-9]+\..+?\.Switch\..+?\.state/
      }
    }
  },
  "button.service.adapter.noconnection": {
    role: "",
    type: "button",
    adapter: "",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "checkbox-intermediate" },
          color: { type: "const", constVal: import_Color.Color.bad },
          text: { value: { type: "internal", dp: "///AdapterNoConnection" } }
        },
        false: {
          value: { type: "const", constVal: "checkbox-marked-outline" },
          color: { type: "const", constVal: import_Color.Color.good },
          text: { value: { type: "internal", dp: "///AdapterNoConnection" } }
        }
      },
      entity1: {
        value: { type: "internal", dp: "///AdapterNoConnectionBoolean" }
      },
      text: {
        true: { type: "const", constVal: "Not connected" },
        false: { type: "const", constVal: "all connected" }
      },
      text1: { true: { type: "internal", dp: "///AdapterNoConnection" }, false: void 0 }
    }
  },
  "button.service.adapter.stopped": {
    role: "",
    type: "button",
    adapter: "",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "checkbox-intermediate" },
          color: { type: "const", constVal: import_Color.Color.bad },
          text: { value: { type: "internal", dp: "///AdapterStopped" } }
        },
        false: {
          value: { type: "const", constVal: "checkbox-marked-outline" },
          color: { type: "const", constVal: import_Color.Color.good },
          text: { value: { type: "internal", dp: "///AdapterStopped" } }
        }
      },
      entity1: {
        value: { type: "internal", dp: "///AdapterStoppedBoolean" }
      },
      text: {
        true: { type: "const", constVal: "Stopped" },
        false: void 0
      },
      text1: { true: { type: "internal", dp: "///AdapterStopped" }, false: void 0 }
    }
  },
  "button.temperature": {
    role: "",
    adapter: "",
    type: "button",
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
        scale: {
          type: "const",
          constVal: { val_min: 40, val_max: -10, val_best: 25, mode: "quadriGradAnchor" }
        }
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
  "button.humidity": {
    role: "",
    adapter: "",
    type: "button",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "water-percent" },
          text: {
            value: {
              type: "triggered",
              mode: "auto",
              role: "value.humidity",
              dp: "",
              read: "return Math.round(val)"
            },
            unit: { type: "const", constVal: "%" }
          },
          color: { type: "const", constVal: import_Color.Color.Red }
        },
        false: {
          value: { type: "const", constVal: "water-percent" },
          color: { type: "const", constVal: import_Color.Color.Blue }
        },
        scale: { type: "const", constVal: { min: 0, max: 100 } }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "value.humidity",
          dp: ""
        },
        unit: { type: "const", constVal: "%" }
      },
      text: {
        true: { type: "const", constVal: "Humidity" },
        false: void 0
      },
      text1: {
        true: {
          type: "triggered",
          mode: "auto",
          role: "value.humidity",
          dp: "",
          read: "return Math.round(parseFloat(val))"
        },
        false: void 0
      }
    }
  },
  "button.volume": {
    role: "",
    adapter: "",
    type: "button",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "volume-mute" },
          text: {
            value: {
              type: "triggered",
              mode: "auto",
              role: "value.volume",
              dp: ""
            },
            unit: { type: "const", constVal: "%" }
          },
          color: { type: "const", constVal: import_Color.Color.Red }
        },
        false: {
          value: {
            type: "triggered",
            mode: "auto",
            role: "value.volume",
            dp: "",
            read: `{
                            if (val > 66) {
                                return 'volume-high';
                            }
                            if (val > 33) {
                                return 'volume-medium';
                            }
                            if (val > 0) {
                                return 'volume-low';
                            }
                            return 'volume-mute';
                        }`
          },
          text: {
            value: {
              type: "triggered",
              mode: "auto",
              role: "value.volume",
              dp: ""
            },
            unit: { type: "const", constVal: "%" }
          },
          color: { type: "const", constVal: import_Color.Color.Blue }
        },
        scale: { type: "const", constVal: { min: 0, max: 100 } }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: "media.mute",
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "volume" },
        false: void 0
      },
      text1: {
        true: {
          type: "triggered",
          mode: "auto",
          role: "value.volume",
          dp: "",
          read: "return Math.round(parseFloat(val))"
        },
        false: void 0
      }
    }
  },
  "button.slider": {
    role: "",
    adapter: "",
    type: "button",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "plus-minus-variant" },
          text: {
            value: {
              type: "triggered",
              mode: "auto",
              role: ["value", "level"],
              dp: ""
            },
            unit: { type: "const", constVal: "%" }
          },
          color: { type: "const", constVal: import_Color.Color.Red }
        },
        false: void 0,
        scale: { type: "const", constVal: { min: 0, max: 100 } }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: ["value", "level"],
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "volume" },
        false: void 0
      },
      text1: {
        true: {
          type: "triggered",
          mode: "auto",
          role: ["value", "level"],
          dp: ""
        },
        false: void 0
      }
    }
  },
  "button.select": {
    role: "",
    adapter: "",
    type: "button",
    data: {
      icon: {
        true: {
          value: { type: "const", constVal: "clipboard-list-outline" },
          color: { type: "const", constVal: import_Color.Color.Green }
        },
        false: {
          value: { type: "const", constVal: "clipboard-list" },
          color: { type: "const", constVal: import_Color.Color.Red }
        }
      },
      entity1: {
        value: {
          type: "triggered",
          mode: "auto",
          role: ["value.mode.select"],
          dp: ""
        },
        set: {
          type: "triggered",
          mode: "auto",
          role: ["level.mode.select"],
          dp: ""
        }
      },
      text: {
        true: { type: "const", constVal: "Select" },
        false: void 0
      },
      text1: {
        //true:  { type: 'triggered', mode: 'auto', role: ['value.mode.select'], dp: '' },
        true: { type: "const", constVal: "press" },
        false: void 0
      }
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buttonTemplates
});
//# sourceMappingURL=button.js.map
