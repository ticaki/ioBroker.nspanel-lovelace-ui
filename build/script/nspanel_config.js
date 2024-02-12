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
var nspanel_config_exports = {};
__export(nspanel_config_exports, {
  BatteryEmpty: () => BatteryEmpty,
  BatteryFull: () => BatteryFull,
  Black: () => Black,
  Blue: () => Blue,
  Cyan: () => Cyan,
  DarkBlue: () => DarkBlue,
  Gray: () => Gray,
  Green: () => Green,
  HMIDark: () => HMIDark,
  HMIOff: () => HMIOff,
  HMIOn: () => HMIOn,
  MSGreen: () => MSGreen,
  MSRed: () => MSRed,
  MSYellow: () => MSYellow,
  Magenta: () => Magenta,
  Menu: () => Menu,
  MenuHighInd: () => MenuHighInd,
  MenuLowInd: () => MenuLowInd,
  Off: () => Off,
  On: () => On,
  Red: () => Red,
  Testconfig: () => Testconfig,
  White: () => White,
  Yellow: () => Yellow,
  colorAlexa: () => colorAlexa,
  colorRadio: () => colorRadio,
  colorScale0: () => colorScale0,
  colorScale1: () => colorScale1,
  colorScale10: () => colorScale10,
  colorScale2: () => colorScale2,
  colorScale3: () => colorScale3,
  colorScale4: () => colorScale4,
  colorScale5: () => colorScale5,
  colorScale6: () => colorScale6,
  colorScale7: () => colorScale7,
  colorScale8: () => colorScale8,
  colorScale9: () => colorScale9,
  colorSonos: () => colorSonos,
  colorSpotify: () => colorSpotify,
  scbackground: () => scbackground,
  scbackgroundInd1: () => scbackgroundInd1,
  scbackgroundInd2: () => scbackgroundInd2,
  scbackgroundInd3: () => scbackgroundInd3,
  scbar: () => scbar,
  scdate: () => scdate,
  sctF1Icon: () => sctF1Icon,
  sctF2Icon: () => sctF2Icon,
  sctF3Icon: () => sctF3Icon,
  sctF4Icon: () => sctF4Icon,
  sctForecast1: () => sctForecast1,
  sctForecast1Val: () => sctForecast1Val,
  sctForecast2: () => sctForecast2,
  sctForecast2Val: () => sctForecast2Val,
  sctForecast3: () => sctForecast3,
  sctForecast3Val: () => sctForecast3Val,
  sctForecast4: () => sctForecast4,
  sctForecast4Val: () => sctForecast4Val,
  sctMainIcon: () => sctMainIcon,
  sctMainIconAlt: () => sctMainIconAlt,
  sctMainText: () => sctMainText,
  sctMainTextAlt: () => sctMainTextAlt,
  sctTimeAdd: () => sctTimeAdd,
  sctime: () => sctime,
  sctimeAMPM: () => sctimeAMPM,
  swClearNight: () => swClearNight,
  swCloudy: () => swCloudy,
  swExceptional: () => swExceptional,
  swFog: () => swFog,
  swHail: () => swHail,
  swLightning: () => swLightning,
  swLightningRainy: () => swLightningRainy,
  swPartlycloudy: () => swPartlycloudy,
  swPouring: () => swPouring,
  swRainy: () => swRainy,
  swSnowy: () => swSnowy,
  swSnowyRainy: () => swSnowyRainy,
  swSunny: () => swSunny,
  swWindy: () => swWindy
});
module.exports = __toCommonJS(nspanel_config_exports);
const HMIOff = { red: 68, green: 115, blue: 158 };
const HMIOn = { red: 3, green: 169, blue: 244 };
const HMIDark = { red: 29, green: 29, blue: 29 };
const Off = { red: 253, green: 128, blue: 0 };
const On = { red: 253, green: 216, blue: 53 };
const MSRed = { red: 251, green: 105, blue: 98 };
const MSYellow = { red: 255, green: 235, blue: 156 };
const MSGreen = { red: 121, green: 222, blue: 121 };
const Red = { red: 255, green: 0, blue: 0 };
const White = { red: 255, green: 255, blue: 255 };
const Yellow = { red: 255, green: 255, blue: 0 };
const Green = { red: 0, green: 255, blue: 0 };
const Blue = { red: 0, green: 0, blue: 255 };
const DarkBlue = { red: 0, green: 0, blue: 136 };
const Gray = { red: 136, green: 136, blue: 136 };
const Black = { red: 0, green: 0, blue: 0 };
const Cyan = { red: 0, green: 255, blue: 255 };
const Magenta = { red: 255, green: 0, blue: 255 };
const colorSpotify = { red: 30, green: 215, blue: 96 };
const colorAlexa = { red: 49, green: 196, blue: 243 };
const colorSonos = { red: 216, green: 161, blue: 88 };
const colorRadio = { red: 255, green: 127, blue: 0 };
const BatteryFull = { red: 96, green: 176, blue: 62 };
const BatteryEmpty = { red: 179, green: 45, blue: 25 };
const Menu = { red: 150, green: 150, blue: 100 };
const MenuLowInd = { red: 255, green: 235, blue: 156 };
const MenuHighInd = { red: 251, green: 105, blue: 98 };
const colorScale0 = { red: 99, green: 190, blue: 123 };
const colorScale1 = { red: 129, green: 199, blue: 126 };
const colorScale2 = { red: 161, green: 208, blue: 127 };
const colorScale3 = { red: 129, green: 217, blue: 126 };
const colorScale4 = { red: 222, green: 226, blue: 131 };
const colorScale5 = { red: 254, green: 235, blue: 132 };
const colorScale6 = { red: 255, green: 210, blue: 129 };
const colorScale7 = { red: 251, green: 185, blue: 124 };
const colorScale8 = { red: 251, green: 158, blue: 117 };
const colorScale9 = { red: 248, green: 131, blue: 111 };
const colorScale10 = { red: 248, green: 105, blue: 107 };
const scbackground = { red: 0, green: 0, blue: 0 };
const scbackgroundInd1 = { red: 255, green: 0, blue: 0 };
const scbackgroundInd2 = { red: 121, green: 222, blue: 121 };
const scbackgroundInd3 = { red: 255, green: 255, blue: 0 };
const sctime = { red: 255, green: 255, blue: 255 };
const sctimeAMPM = { red: 255, green: 255, blue: 255 };
const scdate = { red: 255, green: 255, blue: 255 };
const sctMainIcon = { red: 255, green: 255, blue: 255 };
const sctMainText = { red: 255, green: 255, blue: 255 };
const sctForecast1 = { red: 255, green: 255, blue: 255 };
const sctForecast2 = { red: 255, green: 255, blue: 255 };
const sctForecast3 = { red: 255, green: 255, blue: 255 };
const sctForecast4 = { red: 255, green: 255, blue: 255 };
const sctF1Icon = { red: 255, green: 235, blue: 156 };
const sctF2Icon = { red: 255, green: 235, blue: 156 };
const sctF3Icon = { red: 255, green: 235, blue: 156 };
const sctF4Icon = { red: 255, green: 235, blue: 156 };
const sctForecast1Val = { red: 255, green: 255, blue: 255 };
const sctForecast2Val = { red: 255, green: 255, blue: 255 };
const sctForecast3Val = { red: 255, green: 255, blue: 255 };
const sctForecast4Val = { red: 255, green: 255, blue: 255 };
const scbar = { red: 255, green: 255, blue: 255 };
const sctMainIconAlt = { red: 255, green: 255, blue: 255 };
const sctMainTextAlt = { red: 255, green: 255, blue: 255 };
const sctTimeAdd = { red: 255, green: 255, blue: 255 };
const swClearNight = { red: 150, green: 150, blue: 100 };
const swCloudy = { red: 75, green: 75, blue: 75 };
const swExceptional = { red: 255, green: 50, blue: 50 };
const swFog = { red: 150, green: 150, blue: 150 };
const swHail = { red: 200, green: 200, blue: 200 };
const swLightning = { red: 200, green: 200, blue: 0 };
const swLightningRainy = { red: 200, green: 200, blue: 150 };
const swPartlycloudy = { red: 150, green: 150, blue: 150 };
const swPouring = { red: 50, green: 50, blue: 255 };
const swRainy = { red: 100, green: 100, blue: 255 };
const swSnowy = { red: 150, green: 150, blue: 150 };
const swSnowyRainy = { red: 150, green: 150, blue: 255 };
const swSunny = { red: 255, green: 255, blue: 0 };
const swWindy = { red: 150, green: 150, blue: 150 };
const pageMediaTest = {
  card: "cardMedia",
  dpInit: "alexa2.0.Echo-Devices.G091EV0704641J8R.Player",
  initMode: "auto",
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
          constVal: { red: 250, green: 2, blue: 3 }
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
          type: "triggered",
          role: ["level.volume"],
          response: "now",
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
    }
  },
  items: void 0,
  pageItems: [
    {
      role: "text.list",
      type: "input_sel",
      dpInit: void 0,
      initMode: "custom",
      data: {
        color: {
          true: {
            type: "const",
            constVal: HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Red }
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
        valueList: { type: "const", constVal: "home?butter" },
        setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: void 0,
      initMode: "custom",
      data: {
        color: {
          true: {
            type: "const",
            constVal: HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Red }
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
  initMode: "custom",
  alwaysOn: "none",
  uniqueID: "grid1",
  useColor: false,
  config: {
    card: "cardGrid",
    data: {
      headline: {
        type: "const",
        constVal: "\xDCberschrift"
      }
    }
  },
  pageItems: [
    {
      role: "text.list",
      type: "input_sel",
      dpInit: void 0,
      initMode: "custom",
      data: {
        color: {
          true: {
            type: "const",
            constVal: HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Red }
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
        valueList: { type: "const", constVal: "home?butter" },
        setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: void 0,
      initMode: "custom",
      data: {
        color: {
          true: {
            type: "const",
            constVal: HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "arrow-up" },
            color: { type: "const", constVal: Blue }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Red }
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
        setNavi: {
          type: "const",
          constVal: "3"
        },
        setValue1: void 0
      }
    }
  ],
  items: void 0
};
const pageGridTest2 = {
  card: "cardGrid",
  dpInit: "",
  initMode: "custom",
  alwaysOn: "none",
  uniqueID: "grid2",
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
      dpInit: void 0,
      initMode: "custom",
      data: {
        color: {
          true: {
            type: "const",
            constVal: HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Red }
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
        valueList: { type: "const", constVal: "home?butter" },
        setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: void 0,
      initMode: "custom",
      data: {
        color: {
          true: {
            type: "const",
            constVal: HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "account" },
            color: { type: "const", constVal: Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Red }
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
  initMode: "custom",
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
      dpInit: void 0,
      initMode: "custom",
      data: {
        color: {
          true: {
            type: "const",
            constVal: HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Red }
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
        valueList: { type: "const", constVal: "home?butter" },
        setList: { type: "const", constVal: "0_userdata.0.test?1|0_userdata.0.test?2" }
      }
    },
    {
      role: "text.list",
      type: "button",
      dpInit: void 0,
      initMode: "custom",
      data: {
        color: {
          true: {
            type: "const",
            constVal: HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "home" },
            color: { type: "const", constVal: Green }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Red }
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
  initMode: "auto",
  uniqueID: "thermo1",
  dpInit: "",
  alwaysOn: "none",
  pageItems: [
    {
      role: "text.list",
      type: "input_sel",
      dpInit: void 0,
      initMode: "custom",
      data: {
        entity1: {
          value: {
            type: "state",
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
      type: "button",
      dpInit: void 0,
      initMode: "custom",
      data: {
        color: {
          true: {
            type: "const",
            constVal: HMIOn
          },
          false: void 0,
          scale: void 0
        },
        icon: {
          true: {
            value: { type: "const", constVal: "arrow-up" },
            color: { type: "const", constVal: Blue }
          },
          false: {
            value: { type: "const", constVal: "fan" },
            color: { type: "const", constVal: Red }
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
        setNavi: {
          type: "const",
          constVal: "3"
        },
        setValue1: void 0
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
                            return swExceptional; // exceptional

                        case 7: // Cloudy
                        case 8: // Dreary (Overcast)
                        case 38: // Mostly Cloudy
                            return swCloudy; // cloudy

                        case 11: // fog
                            return swFog; // fog

                        case 25: // Sleet
                            return swHail; // Hail

                        case 15: // T-Storms
                            return swLightning; // lightning

                        case 16: // Mostly Cloudy w/ T-Storms
                        case 17: // Partly Sunny w/ T-Storms
                        case 41: // Partly Cloudy w/ T-Storms
                        case 42: // Mostly Cloudy w/ T-Storms
                            return swLightningRainy; // lightning-rainy

                        case 33: // Clear
                        case 34: // Mostly Clear
                        case 37: // Hazy Moonlight
                            return swClearNight;

                        case 3: // Partly Sunny
                        case 4: // Intermittent Clouds
                        case 6: // Mostly Cloudy
                        case 35: // Partly Cloudy
                        case 36: // Intermittent Clouds
                            return swPartlycloudy; // partlycloudy

                        case 18: // pouring
                            return swPouring; // pouring

                        case 12: // Showers
                        case 13: // Mostly Cloudy w/ Showers
                        case 14: // Partly Sunny w/ Showers
                        case 26: // Freezing Rain
                        case 39: // Partly Cloudy w/ Showers
                        case 40: // Mostly Cloudy w/ Showers
                            return swRainy; // rainy

                        case 19: // Flurries
                        case 20: // Mostly Cloudy w/ Flurries
                        case 21: // Partly Sunny w/ Flurries
                        case 22: // Snow
                        case 23: // Mostly Cloudy w/ Snow
                        case 43: // Mostly Cloudy w/ Flurries
                        case 44: // Mostly Cloudy w/ Snow
                            return swSnowy; // snowy

                        case 29: // Rain and Snow
                            return swSnowyRainy; // snowy-rainy

                        case 1: // Sunny
                        case 2: // Mostly Sunny
                        case 5: // Hazy Sunshine
                            return swSunny; // sunny

                        case 32: // windy
                            return swWindy; // windy

                        default:
                            return White;
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
              constVal: Yellow
            }
          },
          false: {
            value: void 0,
            color: {
              type: "const",
              constVal: Blue
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
              constVal: Yellow
            }
          },
          false: {
            value: void 0,
            color: {
              type: "const",
              constVal: Blue
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
              constVal: White
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
  }
};
const Testconfig = {
  pages: [pageThermoTest, pageGridTest1, pageGrid2Test2, pageGridTest2, pageScreensaverTest, pageMediaTest],
  navigation: [
    {
      name: "main",
      page: "thermo1",
      left: { single: "4" },
      right: { single: "1", double: "main" }
    },
    {
      name: "1",
      left: { single: "4" },
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
      right: { single: "1", double: "2" },
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
  timeout: 30
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BatteryEmpty,
  BatteryFull,
  Black,
  Blue,
  Cyan,
  DarkBlue,
  Gray,
  Green,
  HMIDark,
  HMIOff,
  HMIOn,
  MSGreen,
  MSRed,
  MSYellow,
  Magenta,
  Menu,
  MenuHighInd,
  MenuLowInd,
  Off,
  On,
  Red,
  Testconfig,
  White,
  Yellow,
  colorAlexa,
  colorRadio,
  colorScale0,
  colorScale1,
  colorScale10,
  colorScale2,
  colorScale3,
  colorScale4,
  colorScale5,
  colorScale6,
  colorScale7,
  colorScale8,
  colorScale9,
  colorSonos,
  colorSpotify,
  scbackground,
  scbackgroundInd1,
  scbackgroundInd2,
  scbackgroundInd3,
  scbar,
  scdate,
  sctF1Icon,
  sctF2Icon,
  sctF3Icon,
  sctF4Icon,
  sctForecast1,
  sctForecast1Val,
  sctForecast2,
  sctForecast2Val,
  sctForecast3,
  sctForecast3Val,
  sctForecast4,
  sctForecast4Val,
  sctMainIcon,
  sctMainIconAlt,
  sctMainText,
  sctMainTextAlt,
  sctTimeAdd,
  sctime,
  sctimeAMPM,
  swClearNight,
  swCloudy,
  swExceptional,
  swFog,
  swHail,
  swLightning,
  swLightningRainy,
  swPartlycloudy,
  swPouring,
  swRainy,
  swSnowy,
  swSnowyRainy,
  swSunny,
  swWindy
});
//# sourceMappingURL=nspanel_config.js.map
