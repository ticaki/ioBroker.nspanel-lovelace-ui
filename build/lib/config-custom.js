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
var config_custom_exports = {};
__export(config_custom_exports, {
  Testconfig: () => Testconfig,
  pageMediaTest2: () => pageMediaTest2
});
module.exports = __toCommonJS(config_custom_exports);
var Color = __toESM(require("./const/Color"));
const pageEntitiesTest1 = {
  card: "cardEntities",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "entities1",
  useColor: false,
  config: {
    card: "cardEntities",
    data: {
      headline: {
        type: "const",
        constVal: "entities1"
      }
    }
  },
  pageItems: [
    {
      role: "text.list",
      type: "number",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "arrow-up" },
            color: { type: "const", constVal: Color.Blue }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.dimmer"
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: {
            type: "const",
            constVal: "Number"
          },
          false: void 0
        }
      }
    },
    {
      template: "generic.shutter",
      dpInit: "0_userdata.0.shutter_test",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "window-open" },
            color: { type: "const", constVal: "aqua", role: "level.color.name" }
          },
          false: null
        }
      }
    },
    {
      role: "rgb",
      type: "light",
      dpInit: "",
      data: {
        color: {
          true: { type: "triggered", dp: "0_userdata.0.RGB" },
          false: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "lightbulb" },
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.HMIOff }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        colorMode: { type: "const", constVal: true },
        dimmer: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.dimmer"
          }
        },
        entity1: {
          value: { type: "triggered", dp: "0_userdata.0.example_state" },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        entityInSel: void 0,
        text1: {
          true: {
            type: "const",
            constVal: "Licht"
          },
          false: void 0
        },
        text2: {
          true: {
            type: "const",
            constVal: "Picker1"
          },
          false: void 0
        },
        text3: {
          true: {
            type: "const",
            constVal: "Picker2"
          },
          false: void 0
        },
        ct: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.ct"
          }
        },
        valueList: { type: "const", constVal: "home?butter" },
        setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
      }
    },
    {
      role: "text.list",
      type: "fan",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Blue }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        speed: {
          value: {
            type: "const",
            constVal: 1e3
          },
          factor: void 0,
          maxScale: {
            type: "const",
            constVal: 3e3
          }
        },
        headline: {
          type: "const",
          constVal: "Football-Fan"
        },
        text: {
          true: {
            type: "const",
            constVal: "Details"
          },
          false: void 0
        },
        entityInSel: { value: { type: "const", constVal: "2" } },
        valueList: { type: "const", constVal: "1?2?3?4" }
      }
    }
  ],
  items: void 0
};
const pageEntitiesTest2 = {
  card: "cardEntities",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "entities2",
  useColor: false,
  config: {
    card: "cardEntities",
    data: {
      headline: {
        type: "const",
        constVal: "entities2"
      }
    }
  },
  pageItems: [
    {
      role: "timer",
      type: "timer",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "timer" },
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: void 0,
            color: { type: "const", constVal: Color.Green }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        headline: { type: "const", constVal: "Timer" },
        setValue1: { type: "state", dp: "0_userdata.0.example_state" }
      }
    },
    {
      role: "rgbSingle",
      type: "light",
      dpInit: "0_userdata.0.shelly.0.SHRGBW2#258794#1",
      template: "light.shelly.rgbw2"
    },
    {
      type: "shutter",
      dpInit: "0_userdata.0.shelly.0.SHSW-25#C45BBE5FC53F#1",
      template: "shutter.shelly.2PM"
    },
    {
      type: "text",
      dpInit: "zigbee2mqtt.0.0x00158d00041fdbcb",
      template: "text.battery"
    }
  ],
  items: void 0
};
const pagePowerTest1 = {
  card: "cardPower",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "power1",
  useColor: false,
  pageItems: [],
  config: {
    card: "cardPower",
    data: {
      headline: { type: "const", constVal: "headline" },
      homeValueTop: {
        value: { type: "const", constVal: "top" }
      },
      homeValueBot: {
        value: { type: "const", constVal: "bot" }
      },
      leftTop: {
        icon: {
          true: {
            value: { type: "const", constVal: "arrow-up" },
            color: void 0
          },
          false: {
            value: void 0,
            color: void 0
          }
        },
        value: {
          value: { type: "const", constVal: 1 }
        }
      },
      leftMiddle: {
        icon: {
          true: {
            value: { type: "const", constVal: "arrow-left" },
            color: void 0
          },
          false: {
            value: void 0,
            color: void 0
          }
        },
        value: {
          value: { type: "const", constVal: 2 }
        }
      },
      leftBottom: {
        icon: {
          true: {
            value: { type: "const", constVal: "arrow-down" },
            color: void 0
          },
          false: {
            value: void 0,
            color: void 0
          }
        },
        value: {
          value: { type: "const", constVal: 3 }
        }
      },
      rightTop: {
        icon: {
          true: {
            value: { type: "const", constVal: "arrow-up" },
            color: void 0
          },
          false: {
            value: void 0,
            color: void 0
          }
        },
        value: {
          value: { type: "const", constVal: 4 }
        }
      },
      rightMiddle: {
        icon: {
          true: {
            value: { type: "const", constVal: "arrow-right" },
            color: void 0
          },
          false: {
            value: void 0,
            color: void 0
          }
        },
        value: {
          value: { type: "const", constVal: 5 }
        }
      },
      rightBottom: {
        icon: {
          true: {
            value: { type: "const", constVal: "arrow-down" },
            color: void 0
          },
          false: {
            value: void 0,
            color: void 0
          }
        },
        value: {
          value: { type: "const", constVal: 6 }
        }
      },
      homeIcon: {
        true: {
          value: { type: "const", constVal: "home" },
          color: void 0
        },
        false: {
          value: void 0,
          color: void 0
        }
      }
    }
  },
  items: void 0
};
const pageMediaTest = {
  card: "cardMedia",
  dpInit: "alexa2.0.Echo-Devices.G091EV0704641J8R.Player",
  alwaysOn: "none",
  config: {
    card: "cardMedia",
    data: {
      headline: {
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
          type: "triggered",
          dp: "0_userdata.0.spotify-premium.0.player.playlist.trackNo"
        },
        color: {
          type: "const",
          constVal: { r: 250, g: 2, b: 3 }
        }
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
        value: {
          mode: "auto",
          type: "state",
          role: ["level.volume"],
          response: "now",
          scale: { min: 0, max: 100 },
          dp: ""
        },
        set: {
          mode: "auto",
          type: "state",
          role: ["level.volume"],
          response: "medium",
          scale: { min: 0, max: 100 },
          dp: ""
        }
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
        value: {
          mode: "auto",
          type: "state",
          role: "media.mode.shuffle",
          dp: ""
        },
        set: {
          mode: "auto",
          type: "state",
          role: "media.mode.shuffle",
          dp: ""
        }
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
        color: { type: "const", constVal: { r: 250, b: 250, g: 0 } },
        list: void 0,
        action: "cross"
      }
    }
  },
  items: void 0,
  pageItems: [
    {
      role: "spotify-playlist",
      type: "input_sel",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "arrow-up" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entityInSel: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.spotify-premium.0.player.playlist.trackNo"
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        valueList: { type: "state", dp: "0_userdata.0.spotify-premium.0.player.playlist.trackListArray" }
      }
    },
    {
      role: "text.list",
      type: "input_sel",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entityInSel: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        valueList: { type: "const", constVal: "home?butter" },
        setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    }
  ],
  uniqueID: "media1",
  useColor: false
};
const pageAbfall = {
  card: "cardEntities",
  dpInit: "0_userdata.0.Abfallkalender",
  uniqueID: "abfall1",
  template: "waste-calendar.entities"
};
const pageMediaTest2 = {
  card: "cardMedia",
  dpInit: "alexa2.0.Echo-Devices.G091EV0704641J8R.Player",
  alwaysOn: "none",
  config: {
    card: "cardMedia",
    data: {
      headline: {
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
          constVal: { r: 250, g: 2, b: 3 }
        }
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
        value: {
          mode: "auto",
          type: "state",
          role: ["level.volume"],
          response: "now",
          scale: { min: 0, max: 100 },
          dp: ""
        },
        set: {
          mode: "auto",
          type: "state",
          role: ["level.volume"],
          response: "medium",
          scale: { min: 0, max: 100 },
          dp: ""
        }
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
        value: {
          mode: "auto",
          type: "state",
          role: "media.mode.shuffle",
          dp: ""
        },
        set: {
          mode: "auto",
          type: "state",
          role: "media.mode.shuffle",
          dp: ""
        }
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
        color: { type: "const", constVal: { r: 250, b: 250, g: 0 } },
        list: void 0,
        action: "cross"
      }
    }
  },
  items: void 0,
  pageItems: [
    {
      role: "spotify-playlist",
      type: "input_sel",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "arrow-up" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entityInSel: {
          value: {
            type: "state",
            dp: "0_userdata.0.spotify-premium.0.player.playlist.trackNo"
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        valueList: { type: "state", dp: "0_userdata.0.spotify-premium.0.player.playlist.trackListArray" },
        setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    }
  ],
  uniqueID: "media1",
  useColor: false
};
const pageGridTest1 = {
  card: "cardGrid",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "grid1",
  useColor: false,
  config: {
    card: "cardGrid",
    data: {
      headline: {
        type: "const",
        constVal: "grid1"
      }
    }
  },
  pageItems: [
    {
      role: "text.list",
      type: "number",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "arrow-up" },
            color: { type: "const", constVal: Color.Blue }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: 23
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: {
            type: "const",
            constVal: "Number"
          },
          false: void 0
        }
      }
    },
    {
      role: "rgb",
      type: "shutter",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "window-shutter-open" },
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "window-shutter" },
            color: { type: "const", constVal: Color.HMIOff }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: { mode: "auto", role: "level.blind", type: "triggered", dp: "" },
          decimal: void 0,
          factor: void 0,
          unit: void 0,
          minScale: { type: "const", constVal: 0 },
          maxScale: { type: "const", constVal: 100 }
        },
        entity2: {
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
        setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
      }
    },
    {
      role: "rgb",
      type: "light",
      dpInit: "",
      data: {
        color: {
          true: { type: "triggered", dp: "0_userdata.0.RGB" },
          false: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "lightbulb" },
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.HMIOff }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        colorMode: { type: "const", constVal: true },
        dimmer: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.dimmer"
          }
        },
        entity1: {
          value: { type: "triggered", dp: "0_userdata.0.example_state" },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        entityInSel: void 0,
        text1: {
          true: {
            type: "const",
            constVal: "Licht"
          },
          false: void 0
        },
        text2: {
          true: {
            type: "const",
            constVal: "Picker1"
          },
          false: void 0
        },
        text3: {
          true: {
            type: "const",
            constVal: "Picker2"
          },
          false: void 0
        },
        ct: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.ct"
          }
        },
        valueList: { type: "const", constVal: "home?butter" },
        setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
      }
    },
    {
      role: "text.list",
      type: "input_sel",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        headline: { type: "const", constVal: "insel" },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entityInSel: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        valueList: { type: "const", constVal: "home?butter" },
        setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "music" },
            color: { type: "const", constVal: Color.Gray }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: { type: "const", constVal: "Navbutton" },
          false: void 0
        },
        setNavi: {
          type: "const",
          constVal: "3"
        },
        setValue1: void 0
      }
    },
    {
      role: "text.list",
      type: "text",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            text: { type: "const", constVal: "22.2" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: { type: "const", constVal: "text" },
          false: void 0
        },
        text1: {
          true: { type: "const", constVal: "text1" },
          false: void 0
        }
      }
    }
  ],
  items: void 0
};
const pageGridTest2 = {
  card: "cardGrid",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "grid2",
  useColor: false,
  config: {
    card: "cardGrid",
    data: {
      headline: {
        type: "const",
        constVal: "grid2"
      }
    }
  },
  items: void 0,
  pageItems: [
    {
      role: "text.list",
      type: "fan",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        entityInSel: void 0
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "account" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    },
    {
      role: "timer",
      type: "timer",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "timer" },
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: void 0,
            color: { type: "const", constVal: Color.Green }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        headline: { type: "const", constVal: "Timer" },
        setValue1: { type: "state", dp: "0_userdata.0.example_state" }
      }
    },
    {
      type: "text",
      dpInit: "zigbee2mqtt.0.0x00158d00041fdbcb",
      template: "text.temperature"
    }
  ]
};
const pageGridTest4 = {
  card: "cardGrid",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "grid4",
  useColor: false,
  config: {
    card: "cardGrid",
    data: {
      headline: {
        type: "const",
        constVal: "\xDCberschrift2"
      }
    }
  },
  items: void 0,
  pageItems: [
    {
      role: "text.list",
      type: "input_sel",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entityInSel: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        valueList: { type: "const", constVal: "home?butter" },
        setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "account" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    }
  ]
};
const pageGrid2Test2 = {
  card: "cardGrid2",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "grid3",
  useColor: false,
  config: {
    card: "cardGrid2",
    data: {
      headline: {
        type: "const",
        constVal: "\xDCberschrift"
      }
    }
  },
  items: void 0,
  pageItems: [
    {
      role: "text.list",
      type: "input_sel",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entityInSel: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        valueList: { type: "const", constVal: "home?butter" },
        setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    }
  ]
};
const pageThermoTest = {
  card: "cardThermo",
  uniqueID: "thermo1",
  dpInit: "",
  alwaysOn: "none",
  pageItems: [
    {
      role: "text.list",
      type: "input_sel",
      dpInit: "",
      data: {
        entityInSel: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.statesTest"
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        headline: {
          type: "const",
          constVal: "Test"
        }
      }
    },
    {
      role: "text.list",
      type: "input_sel",
      dpInit: "",
      data: {
        entityInSel: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.statesTest"
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        headline: {
          type: "const",
          constVal: "Test"
        }
      }
    },
    {
      role: "text.list",
      type: "input_sel",
      dpInit: "",
      data: {
        entityInSel: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.statesTest"
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        headline: {
          type: "const",
          constVal: "Test"
        }
      }
    },
    {
      role: "text.list",
      type: "input_sel",
      dpInit: "",
      data: {
        entityInSel: {
          value: {
            type: "triggered",
            dp: "0_userdata.0.statesTest"
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        headline: {
          type: "const",
          constVal: "Test"
        }
      }
    },
    {
      role: "indicator",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "arrow-up" },
            color: { type: "const", constVal: Color.Blue }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        },
        setValue1: void 0
      }
    },
    {
      role: "indicator",
      type: "button",
      dpInit: "",
      data: {
        color: {
          true: {
            type: "const",
            constVal: Color.HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Blue }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Color.Red }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entity1: {
          value: { type: "state", dp: "0_userdata.0.example_state" },
          decimal: void 0,
          factor: void 0,
          unit: void 0
        },
        text: {
          true: void 0,
          false: void 0
        }
      }
    }
  ],
  config: {
    card: "cardThermo",
    data: {
      headline: {
        type: "const",
        constVal: "headline"
      },
      current: {
        type: "const",
        constVal: "20"
      },
      unit: {
        type: "const",
        constVal: "\xB0C"
      },
      text1: {
        type: "const",
        constVal: "text1"
      },
      text2: {
        type: "const",
        constVal: "text2"
      },
      minTemp: {
        type: "const",
        constVal: "10"
      },
      maxTemp: {
        type: "const",
        constVal: "60"
      },
      tempStep: {
        type: "const",
        constVal: "5"
      },
      set1: { type: "state", dp: "0_userdata.0.number1" }
    }
  },
  items: void 0,
  useColor: false
};
const pageScreensaverTest = {
  card: "screensaver",
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
          false: { value: void 0, color: void 0 }
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
            type: "internal",
            dp: "cmd/power1"
          }
        },
        entityDateFormat: void 0,
        entityIcon: {
          true: {
            value: {
              type: "const",
              constVal: "lightbulb"
            },
            color: {
              type: "const",
              constVal: Color.Yellow
            }
          },
          false: {
            value: {
              type: "const",
              constVal: "lightbulb-outline"
            },
            color: {
              type: "const",
              constVal: Color.HMIOff
            }
          },
          scale: void 0,
          maxBri: void 0,
          minBri: void 0
        },
        entityIconSelect: void 0,
        entityText: {
          true: void 0,
          false: void 0
        }
      },
      {
        entityValue: {
          value: {
            type: "internal",
            dp: "cmd/power2"
          }
        },
        entityDateFormat: void 0,
        entityIcon: {
          true: {
            value: {
              type: "const",
              constVal: "lightbulb"
            },
            color: {
              type: "const",
              constVal: Color.Yellow
            }
          },
          false: {
            value: {
              type: "const",
              constVal: "lightbulb-outline"
            },
            color: {
              type: "const",
              constVal: Color.HMIOff
            }
          }
        },
        entityIconSelect: void 0,
        entityText: {
          true: void 0,
          false: void 0
        }
      }
    ]
  }
};
const Testconfig = {
  pages: [
    pageGridTest4,
    pageEntitiesTest1,
    pagePowerTest1,
    pageThermoTest,
    pageGridTest1,
    pageGrid2Test2,
    pageGridTest2,
    pageScreensaverTest,
    pageMediaTest,
    pageEntitiesTest2,
    pageAbfall
  ],
  navigation: [
    {
      name: "main",
      page: "entities1",
      left: { single: "7" },
      right: { single: "abfall1", double: "2" }
    },
    {
      name: "5",
      page: "thermo1",
      left: { single: "4" },
      right: { single: "6", double: "main" }
    },
    {
      name: "abfall1",
      page: "abfall1",
      left: { single: "main" },
      right: { single: "entities2", double: "main" }
    },
    {
      name: "entities2",
      page: "entities2",
      left: { single: "main" },
      right: { single: "1", double: "main" }
    },
    {
      name: "6",
      page: "power1",
      left: { single: "5" },
      right: { single: "7", double: "main" }
    },
    {
      name: "7",
      page: "grid4",
      left: { single: "6" },
      right: { single: "main", double: "main" }
    },
    {
      name: "1",
      left: { single: "main" },
      right: { single: "2" },
      page: "grid1"
    },
    {
      name: "2",
      left: { single: "1" },
      right: { single: "3" },
      page: "grid2"
    },
    {
      name: "3",
      left: { single: "2" },
      right: { single: "4", double: "main" },
      page: "media1"
    },
    {
      name: "4",
      left: { single: "3", double: "1" },
      right: { single: "5", double: "2" },
      page: "grid3"
    }
  ],
  topic: "nspanel/ns_panel2",
  name: "Wohnzimmer",
  config: {
    momentLocale: "",
    locale: "de-DE",
    iconBig1: false,
    iconBig2: false
  },
  timeout: 30,
  dimLow: 20,
  dimHigh: 90
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Testconfig,
  pageMediaTest2
});
//# sourceMappingURL=config-custom.js.map
