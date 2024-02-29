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
  Testconfig: () => Testconfig
});
module.exports = __toCommonJS(config_custom_exports);
var Color = __toESM(require("./const/Color"));
const pageGridMain = {
  card: "cardGrid",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "main",
  useColor: false,
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
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "window-closed-variant" },
            color: { type: "const", constVal: Color.Green }
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
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "door-closed" },
            color: { type: "const", constVal: Color.Green }
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
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
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
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "lock-open-variant" },
            color: { type: "const", constVal: Color.Red }
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
  ],
  items: void 0
};
const pageGridTueren = {
  card: "cardGrid",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "tuer",
  useColor: false,
  config: {
    card: "cardGrid",
    data: {
      headline: {
        type: "const",
        constVal: "Status T\xFCren"
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
            value: { type: "const", constVal: "door-open" },
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "door-closed" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.T\xFCren.Haust\xFCr.ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Haust\xFCr"
          },
          false: void 0
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
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "door-closed" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.T\xFCren.Terassent\xFCr.ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Terasse"
          },
          false: void 0
        }
      }
    }
  ],
  items: void 0
};
const pageGridFenster1 = {
  card: "cardGrid",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "fenster1",
  useColor: false,
  config: {
    card: "cardGrid",
    data: {
      headline: {
        type: "const",
        constVal: "Status Fenster"
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
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "window-closed-variant" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Fenster.WC-Fenster.ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "G\xE4ste WC"
          },
          false: void 0
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
            value: { type: "const", constVal: "window-open-variant" },
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "window-closed-variant" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Fenster.K\xFCchenfenster.ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "K\xFCche"
          },
          false: void 0
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
            value: { type: "const", constVal: "window-open-variant" },
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "window-closed-variant" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Fenster.B\xFCrofenster.ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "B\xFCro"
          },
          false: void 0
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
            value: { type: "const", constVal: "window-open-variant" },
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "window-closed-variant" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Fenster.JosiFenster.ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Josi"
          },
          false: void 0
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
            value: { type: "const", constVal: "window-open-variant" },
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "window-closed-variant" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Fenster.Schalfzimmerfenster.ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Schalfzimmer"
          },
          false: void 0
        }
      }
    }
  ],
  items: void 0
};
const pageGridFenster2 = {
  card: "cardGrid",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "fenster2",
  useColor: false,
  config: {
    card: "cardGrid",
    data: {
      headline: {
        type: "const",
        constVal: "Status Dachfenster"
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
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "window-closed-variant" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Fenster.Dachfenster1.ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Dach 1"
          },
          false: void 0
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
            value: { type: "const", constVal: "window-open-variant" },
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "window-closed-variant" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Fenster.Dachfenster2.ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Dach 2"
          },
          false: void 0
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
            value: { type: "const", constVal: "window-open-variant" },
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "window-closed-variant" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Fenster.Dachfenster3.ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Dach 3"
          },
          false: void 0
        }
      }
    }
  ],
  items: void 0
};
const pageGridLicht1 = {
  card: "cardGrid",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "licht1",
  useColor: false,
  config: {
    card: "cardGrid",
    data: {
      headline: {
        type: "const",
        constVal: "Licht unten"
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
            value: { type: "const", constVal: "lightbulb" },
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Licht.Licht_Treppe.ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Treppe"
          },
          false: void 0
        },
        setValue1: { type: "state", dp: "alias.0.Licht.Licht_Treppe.SET" }
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
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Licht.LED_K\xFCche.ON_ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "K\xFCche Sp\xFCle"
          },
          false: void 0
        },
        setValue1: { type: "state", dp: "alias.0.Licht.LED_K\xFCche.ON_SET" }
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
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Licht.LED_K\xFCche_Board.ON_ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "K\xFCche Board"
          },
          false: void 0
        },
        setValue1: { type: "state", dp: "alias.0.Licht.LED_K\xFCche_Board.ON_SET" }
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
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Licht.LED_HWR.ON_ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "HWR"
          },
          false: void 0
        },
        setValue1: { type: "state", dp: "alias.0.Licht.LED_HWR.ON_SET" }
      }
    }
  ],
  items: void 0
};
const pageGridLicht2 = {
  card: "cardGrid",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "licht2",
  useColor: false,
  config: {
    card: "cardGrid",
    data: {
      headline: {
        type: "const",
        constVal: "Licht oben"
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
            value: { type: "const", constVal: "lightbulb" },
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Licht.Licht_B\xFCro.ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "B\xFCro"
          },
          false: void 0
        },
        setValue1: { type: "state", dp: "alias.0.Licht.Licht_B\xFCro.SET" }
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
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Steckdosen.Schreibtisch.Control.Power"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "B\xFCro Schreibtisch"
          },
          false: void 0
        },
        setValue1: { type: "state", dp: "alias.0.Steckdosen.Schreibtisch.Control.Power" }
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
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Licht.Licht_Dach.ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Dach"
          },
          false: void 0
        },
        setValue1: { type: "state", dp: "alias.0.Licht.Licht_Dach.SET" }
      }
    }
  ],
  items: void 0
};
const pageGridLicht3 = {
  card: "cardGrid",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "licht3",
  useColor: false,
  config: {
    card: "cardGrid",
    data: {
      headline: {
        type: "const",
        constVal: "Licht Josi"
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
            value: { type: "const", constVal: "lightbulb" },
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Licht.Licht_Josi_Decke.ON"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Decke"
          },
          false: void 0
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
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Licht.RegalJosiKalt.ON_ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Regal kalt"
          },
          false: void 0
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
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Licht.RegalJosiWarm.ON_ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Regal warm"
          },
          false: void 0
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
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Licht.RegalJosiEfeu.ON_ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Efeu"
          },
          false: void 0
        }
      }
    }
  ],
  items: void 0
};
const pageGridLicht4 = {
  card: "cardGrid",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "licht4",
  useColor: false,
  config: {
    card: "cardGrid",
    data: {
      headline: {
        type: "const",
        constVal: "Licht Wohnzimmer"
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
            value: { type: "const", constVal: "lightbulb" },
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Licht.LED_TV.ON_ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "TV"
          },
          false: void 0
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
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Licht.LED_Board.ON_ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Regal"
          },
          false: void 0
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
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Steckdosen.Sterne_WZ.Control.Power"
          }
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
    {
      role: "text.list",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "lightbulb" },
            color: { type: "const", constVal: Color.Yellow }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "alias.0.Licht.LED_WZ.ON_ACTUAL"
          }
        },
        text: {
          true: {
            type: "const",
            constVal: "Decke"
          },
          false: void 0
        }
      }
    }
  ],
  items: void 0
};
const pageAbfall = {
  card: "cardEntities",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "abfall",
  useColor: false,
  config: {
    card: "cardEntities",
    data: {
      headline: {
        type: "const",
        constVal: "Abfall"
      }
    }
  },
  pageItems: [
    {
      role: "text.list",
      type: "text",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "trash-can" },
            color: { type: "state", dp: "0_userdata.0.Abfallkalender.1.color" }
          }
        },
        entity1: {
          value: { type: "const", constVal: true }
        },
        text: {
          true: { type: "state", dp: "0_userdata.0.Abfallkalender.1.event" },
          false: void 0
        },
        text1: {
          true: { type: "state", dp: "0_userdata.0.Abfallkalender.1.date" },
          false: void 0
        }
      }
    },
    {
      role: "text.list",
      type: "text",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "trash-can" },
            color: { type: "state", dp: "0_userdata.0.Abfallkalender.2.color" }
          }
        },
        entity1: {
          value: { type: "const", constVal: true }
        },
        text: {
          true: { type: "state", dp: "0_userdata.0.Abfallkalender.2.event" },
          false: void 0
        },
        text1: {
          true: { type: "state", dp: "0_userdata.0.Abfallkalender.2.date" },
          false: void 0
        }
      }
    },
    {
      role: "text.list",
      type: "text",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "trash-can" },
            color: { type: "state", dp: "0_userdata.0.Abfallkalender.3.color" }
          }
        },
        entity1: {
          value: { type: "const", constVal: true }
        },
        text: {
          true: { type: "state", dp: "0_userdata.0.Abfallkalender.3.event" },
          false: void 0
        },
        text1: {
          true: { type: "state", dp: "0_userdata.0.Abfallkalender.3.date" },
          false: void 0
        }
      }
    },
    {
      role: "text.list",
      type: "text",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "trash-can" },
            color: { type: "state", dp: "0_userdata.0.Abfallkalender.4.color" }
          }
        },
        entity1: {
          value: { type: "const", constVal: true }
        },
        text: {
          true: { type: "state", dp: "0_userdata.0.Abfallkalender.4.event" },
          false: void 0
        },
        text1: {
          true: { type: "state", dp: "0_userdata.0.Abfallkalender.4.date" },
          false: void 0
        }
      }
    }
  ],
  items: void 0
};
const pageAbfallTemplate = {
  card: "cardEntities",
  dpInit: "0_userdata.0.Abfallkalender",
  uniqueID: "abfall1",
  template: "entities.waste-calendar"
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
      headline: { type: "const", constVal: "Stromverteilung" },
      homeIcon: {
        true: {
          value: { type: "const", constVal: "home-lightning-bolt-outline" },
          color: void 0
        },
        false: {
          value: void 0,
          color: void 0
        }
      },
      homeValueTop: void 0,
      homeValueBot: {
        value: { type: "internal", dp: "///power1/powerSum" },
        math: { type: "const", constVal: "return r2+l2" }
      },
      leftTop: void 0,
      leftMiddle: {
        icon: {
          true: {
            value: { type: "const", constVal: "solar-power-variant-outline" },
            color: { type: "const", constVal: Color.MSGreen },
            text: void 0
          },
          false: {
            value: void 0,
            color: { type: "const", constVal: Color.MSRed },
            text: void 0
          },
          scale: { type: "const", constVal: { val_min: 0, val_max: 650, val_best: 650 } }
        },
        value: {
          value: { type: "triggered", dp: "mqtt.2.Solar.P_AC" },
          decimal: { type: "const", constVal: 0 },
          unit: { type: "const", constVal: "W" }
        },
        speed: {
          value: {
            type: "state",
            dp: "mqtt.2.Solar.P_AC",
            read: `{
                            let v = val*125/650; 
                            v = v<0?0:v>125?125:v; 
                            return (v*-1).toFixed(0);
                        }`
          }
        }
      },
      leftBottom: {
        icon: {
          true: {
            value: { type: "const", constVal: "tumble-dryer" },
            color: { type: "const", constVal: Color.MSGreen },
            text: void 0
          },
          false: {
            value: void 0,
            color: { type: "const", constVal: Color.MSRed },
            text: void 0
          },
          scale: { type: "const", constVal: { val_min: 0, val_max: 2e3, val_best: 0 } }
        },
        value: {
          value: { type: "triggered", dp: "alias.0.Trockner.Leistung" },
          unit: { type: "const", constVal: "W" }
        },
        speed: {
          value: {
            type: "state",
            dp: "alias.0.Trockner.Leistung",
            read: `{
                            let v = val*125/2000; 
                            v = v<0?0:v>125?125:v; 
                            return (v*-1).toFixed(0);
                        }`
          }
        }
      },
      rightTop: {
        icon: {
          true: {
            value: { type: "const", constVal: "washing-machine" },
            color: { type: "const", constVal: Color.MSGreen },
            text: void 0
          },
          false: {
            value: void 0,
            color: { type: "const", constVal: Color.MSRed },
            text: void 0
          },
          scale: { type: "const", constVal: { val_min: 0, val_max: 2e3, val_best: 0 } }
        },
        value: {
          value: { type: "triggered", dp: "alias.0.WMA.Leistung" },
          unit: { type: "const", constVal: "W" }
        },
        speed: {
          value: {
            type: "state",
            dp: "alias.0.WMA.Leistung",
            read: `{
                            let v = val*125/2000; 
                            v = v<0?0:v>125?125:v; 
                            return (v*-1).toFixed(0);
                        }`
          }
        }
      },
      rightMiddle: {
        icon: {
          true: {
            value: { type: "const", constVal: "transmission-tower" },
            color: { type: "const", constVal: Color.MSGreen },
            text: void 0
          },
          false: {
            value: void 0,
            color: { type: "const", constVal: Color.MSRed },
            text: void 0
          },
          scale: { type: "const", constVal: { val_min: 0, val_max: 5e3, val_best: 0 } }
        },
        value: {
          value: { type: "triggered", dp: "alias.0.Stromzaehler.Daten.Leistung" },
          unit: { type: "const", constVal: "W" }
        },
        speed: {
          value: {
            type: "state",
            dp: "alias.0.Stromzaehler.Daten.Leistung",
            read: `{
                            let v = val*125/5000; 
                            v = v<0?0:v>125?125:v; 
                            return (v).toFixed(0);
                        }`
          }
        }
      },
      rightBottom: void 0
    }
  },
  items: void 0
};
const pageEntitiesFahrplan = {
  card: "cardEntities",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "fahrplan",
  useColor: false,
  config: {
    card: "cardEntities",
    data: {
      headline: {
        type: "const",
        constVal: "Fahrplan S-Bhf"
      }
    }
  },
  pageItems: [
    {
      role: "text.list",
      type: "text",
      dpInit: "fahrplan.0.DepartureTimetable0",
      data: {
        icon: {
          true: {
            value: { role: "", mode: "auto", type: "state", dp: ".0.Mode$" },
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { role: "", mode: "auto", type: "state", dp: ".0.Mode$" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            role: "state",
            mode: "auto",
            type: "triggered",
            dp: ".0.DepartureDelayed$"
          }
        },
        entity2: {
          value: {
            role: "date",
            mode: "auto",
            type: "triggered",
            dp: ".0.Departure$",
            read: "return val && val !=0 ? val : null"
          },
          dateFormat: {
            type: "const",
            constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
          }
        },
        text: {
          true: {
            role: "state",
            mode: "auto",
            type: "triggered",
            dp: ".0.Direction$"
          },
          false: void 0
        },
        text1: {
          true: {
            role: "date",
            mode: "auto",
            type: "triggered",
            dp: ".0.DeparturePlanned$",
            read: `{ return new Date(val).toLocaleTimeString().slice(0,6) }`
          },
          false: void 0
        }
      }
    },
    {
      role: "text.list",
      type: "text",
      dpInit: "fahrplan.0.DepartureTimetable0",
      data: {
        icon: {
          true: {
            value: { role: "", mode: "auto", type: "state", dp: ".1.Mode$" },
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { role: "", mode: "auto", type: "state", dp: ".1.Mode$" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            role: "",
            mode: "auto",
            type: "state",
            dp: ".1.DepartureDelayed$"
          }
        },
        entity2: {
          value: {
            role: "",
            mode: "auto",
            type: "state",
            dp: ".1.Departure$",
            read: "return val === 0 ? null : val"
          },
          dateFormat: {
            type: "const",
            constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
          }
        },
        text: {
          true: {
            role: "",
            mode: "auto",
            type: "state",
            dp: ".1.Direction$"
          },
          false: void 0
        },
        text1: {
          true: {
            role: "",
            mode: "auto",
            type: "state",
            dp: ".1.DeparturePlanned$",
            read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
          },
          false: void 0
        }
      }
    },
    {
      role: "text.list",
      type: "text",
      dpInit: "fahrplan.0.DepartureTimetable0",
      data: {
        icon: {
          true: {
            value: { role: "", mode: "auto", type: "state", dp: ".2.Mode$" },
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { role: "", mode: "auto", type: "state", dp: ".2.Mode$" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            role: "",
            mode: "auto",
            type: "state",
            dp: ".2.DepartureDelayed$"
          }
        },
        entity2: {
          value: {
            role: "",
            mode: "auto",
            type: "state",
            dp: ".2.Departure$",
            read: "return val === 0 ? null : val"
          },
          dateFormat: {
            type: "const",
            constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
          }
        },
        text: {
          true: {
            role: "",
            mode: "auto",
            type: "state",
            dp: ".2.Direction$"
          },
          false: void 0
        },
        text1: {
          true: {
            role: "",
            mode: "auto",
            type: "state",
            dp: ".2.DeparturePlanned$",
            read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
          },
          false: void 0
        }
      }
    },
    {
      role: "text.list",
      type: "text",
      dpInit: "fahrplan.0.DepartureTimetable0",
      data: {
        icon: {
          true: {
            value: { role: "", mode: "auto", type: "state", dp: ".3.Mode$" },
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { role: "", mode: "auto", type: "state", dp: ".3.Mode$" },
            color: { type: "const", constVal: Color.Green }
          }
        },
        entity1: {
          value: {
            role: "",
            mode: "auto",
            type: "state",
            dp: ".3.DepartureDelayed$"
          }
        },
        entity2: {
          value: {
            role: "",
            mode: "auto",
            type: "state",
            dp: ".3.Departure$",
            read: "return val === 0 ? null : val"
          },
          dateFormat: {
            type: "const",
            constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
          }
        },
        text: {
          true: {
            role: "",
            mode: "auto",
            type: "state",
            dp: ".3.Direction$"
          },
          false: void 0
        },
        text1: {
          true: {
            role: "",
            mode: "auto",
            type: "state",
            dp: ".3.DeparturePlanned$",
            read: `{ return new Date(val).toLocaleTimeString().slice(0,5) }`
          },
          false: void 0
        }
      }
    }
  ]
};
const pageEntitiesFahrplanTemplate = {
  card: "cardEntities",
  dpInit: "fahrplan.0.DepartureTimetable0",
  uniqueID: "fahrplan1",
  template: "entities.departure-timetable"
};
const pageScreensaverTest = {
  card: "screensaver",
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "scr",
  useColor: false,
  config: {
    card: "screensaver2",
    mode: "advanced",
    rotationTime: 10,
    model: "eu",
    data: void 0
  },
  pageItems: [
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
    {
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
              constVal: Color.MSRed
            }
          },
          false: {
            value: void 0,
            color: {
              type: "const",
              constVal: Color.MSGreen
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
              constVal: Color.MSRed
            }
          },
          false: {
            value: void 0,
            color: {
              type: "const",
              constVal: Color.MSGreen
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
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "bottom",
      data: {
        entity1: void 0,
        entity2: {
          value: {
            type: "state",
            dp: "accuweather.0.Daily.Day1.Sunrise",
            read: "return new Date(val).getTime()",
            forceType: "number"
          },
          dateFormat: {
            type: "const",
            constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
          }
        },
        icon: {
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
        text: {
          true: {
            type: "const",
            constVal: "Sun"
          },
          false: void 0
        }
      }
    },
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
              constVal: Color.MSRed
            }
          },
          false: {
            value: void 0,
            color: {
              type: "const",
              constVal: Color.MSGreen
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
              constVal: Color.MSRed
            }
          },
          false: {
            value: {
              type: "const",
              constVal: "weather-tornado"
            },
            color: {
              type: "const",
              constVal: Color.MSGreen
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
        text: {
          true: {
            type: "const",
            constVal: "Windr."
          },
          false: void 0
        }
      }
    },
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
              constVal: Color.MSGreen
            }
          },
          false: {
            value: void 0,
            color: {
              type: "const",
              constVal: Color.MSRed
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
            constVal: "Feuchte."
          },
          false: void 0
        }
      }
    },
    {
      role: "text",
      dpInit: "",
      type: "text",
      modeScr: "bottom",
      data: {
        entity1: void 0,
        entity2: {
          value: {
            type: "state",
            dp: "accuweather.0.Daily.Day1.Sunset",
            read: "return new Date(val).getTime()",
            forceType: "number"
          },
          dateFormat: {
            type: "const",
            constVal: { local: "de", format: { hour: "2-digit", minute: "2-digit" } }
          }
        },
        icon: {
          true: {
            value: {
              type: "const",
              constVal: "weather-sunset-down"
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
        text: {
          true: {
            type: "const",
            constVal: "Sun"
          },
          false: void 0
        }
      }
    },
    {
      role: "2values",
      dpInit: "",
      type: "text",
      modeScr: "bottom",
      data: {
        entity1: {
          value: { type: "triggered", dp: "accuweather.0.Summary.TempMin_d1" },
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
          value: { type: "triggered", dp: "accuweather.0.Summary.TempMax_d1" },
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
              dp: "accuweather.0.Summary.WeatherIcon_d1"
            },
            color: {
              type: "triggered",
              dp: "accuweather.0.Summary.WeatherIcon_d1",
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
          true: {
            type: "state",
            dp: "accuweather.0.Summary.DayOfWeek_d1"
          },
          false: void 0
        }
      }
    },
    {
      role: "2values",
      dpInit: "",
      type: "text",
      modeScr: "bottom",
      data: {
        entity1: {
          value: { type: "triggered", dp: "accuweather.0.Summary.TempMin_d2" },
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
          value: { type: "triggered", dp: "accuweather.0.Summary.TempMax_d2" },
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
              dp: "accuweather.0.Summary.WeatherIcon_d2"
            },
            color: {
              type: "triggered",
              dp: "accuweather.0.Summary.WeatherIcon_d2",
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
          true: {
            type: "state",
            dp: "accuweather.0.Summary.DayOfWeek_d2"
          },
          false: void 0
        }
      }
    },
    {
      role: "2values",
      dpInit: "",
      type: "text",
      modeScr: "bottom",
      data: {
        entity1: {
          value: { type: "triggered", dp: "accuweather.0.Summary.TempMin_d3" },
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
          value: { type: "triggered", dp: "accuweather.0.Summary.TempMax_d3" },
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
              dp: "accuweather.0.Summary.WeatherIcon_d3"
            },
            color: {
              type: "triggered",
              dp: "accuweather.0.Summary.WeatherIcon_d3",
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
          true: {
            type: "state",
            dp: "accuweather.0.Summary.DayOfWeek_d3"
          },
          false: void 0
        }
      }
    },
    {
      role: "2values",
      dpInit: "",
      type: "text",
      modeScr: "bottom",
      data: {
        entity1: {
          value: { type: "triggered", dp: "accuweather.0.Summary.TempMin_d4" },
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
          value: { type: "triggered", dp: "accuweather.0.Summary.TempMax_d4" },
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
              dp: "accuweather.0.Summary.WeatherIcon_d4"
            },
            color: {
              type: "triggered",
              dp: "accuweather.0.Summary.WeatherIcon_d4",
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
          true: {
            type: "state",
            dp: "accuweather.0.Summary.DayOfWeek_d4"
          },
          false: void 0
        }
      }
    },
    {
      role: "2values",
      dpInit: "",
      type: "text",
      modeScr: "bottom",
      data: {
        entity1: {
          value: { type: "triggered", dp: "accuweather.0.Summary.TempMin_d5" },
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
          value: { type: "triggered", dp: "accuweather.0.Summary.TempMax_d5" },
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
              dp: "accuweather.0.Summary.WeatherIcon_d5"
            },
            color: {
              type: "triggered",
              dp: "accuweather.0.Summary.WeatherIcon_d5",
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
          true: {
            type: "state",
            dp: "accuweather.0.Summary.DayOfWeek_d5"
          },
          false: void 0
        }
      }
    },
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
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "window-closed-variant" },
            color: { type: "const", constVal: Color.Green }
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
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "door-closed" },
            color: { type: "const", constVal: Color.Green }
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
            color: { type: "const", constVal: Color.Red }
          },
          false: {
            value: { type: "const", constVal: "lightbulb-outline" },
            color: { type: "const", constVal: Color.Green }
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
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: { type: "const", constVal: "lock-open" },
            color: { type: "const", constVal: Color.Red }
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
            color: { type: "const", constVal: Color.Green }
          },
          false: {
            value: void 0,
            color: { type: "const", constVal: Color.Red }
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
    {
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
        text: {
          true: void 0,
          false: void 0
        }
      }
    },
    {
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
              constVal: Color.Yellow
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
              constVal: Color.HMIOff
            }
          }
        }
      }
    }
  ]
};
const Testconfig = [
  {
    pages: [
      pagePowerTest1,
      pageScreensaverTest,
      pageAbfall,
      pageAbfallTemplate,
      pageGridMain,
      pageGridTueren,
      pageGridFenster1,
      pageGridFenster2,
      pageGridLicht1,
      pageGridLicht2,
      pageGridLicht3,
      pageGridLicht4,
      pageEntitiesFahrplan,
      pageEntitiesFahrplanTemplate
    ],
    navigation: [
      {
        name: "main",
        page: "main",
        left: { single: "5" },
        right: { single: "1", double: "main" }
      },
      {
        name: "11",
        left: { single: "main" },
        right: { single: "main" },
        page: "tuer"
      },
      {
        name: "12",
        left: { single: "main" },
        right: { single: "13" },
        page: "fenster1"
      },
      {
        name: "13",
        left: { single: "12" },
        right: { single: "main" },
        page: "fenster2"
      },
      {
        name: "14",
        left: { single: "main" },
        right: { single: "15" },
        page: "licht1"
      },
      {
        name: "15",
        left: { single: "14" },
        right: { single: "16" },
        page: "licht2"
      },
      {
        name: "16",
        left: { single: "15" },
        right: { single: "17" },
        page: "licht3"
      },
      {
        name: "17",
        left: { single: "16" },
        right: { single: "main" },
        page: "licht4"
      },
      {
        name: "1",
        left: { single: "main" },
        right: { single: "4" },
        page: "abfall"
      },
      {
        name: "2",
        left: { single: "4" },
        right: { single: "3" },
        page: "power1"
      },
      {
        name: "3",
        left: { single: "2" },
        right: { single: "5" },
        page: "fahrplan"
      },
      {
        name: "4",
        left: { single: "1" },
        right: { single: "2" },
        page: "abfall1"
      },
      {
        name: "5",
        left: { single: "3" },
        right: { single: "main" },
        page: "fahrplan1"
      }
    ],
    topic: "SmartHome/NSPanel_1",
    name: "B\xFCro",
    config: {
      momentLocale: "",
      locale: "de-DE",
      iconBig1: false,
      iconBig2: false
    },
    timeout: 30,
    dimLow: 20,
    dimHigh: 90
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Testconfig
});
//# sourceMappingURL=config-custom.js.map
