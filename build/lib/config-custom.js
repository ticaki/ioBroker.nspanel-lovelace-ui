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
  //type: 'sonstiges',
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
  ],
  items: void 0
};
const pageGridTueren = {
  //type: 'sonstiges',
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
  //type: 'sonstiges',
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
  //type: 'sonstiges',
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
  //type: 'sonstiges',
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
  //type: 'sonstiges',
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
  //type: 'sonstiges',
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
  //type: 'sonstiges',
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
  //type: 'sonstiges',
  card: "cardEntities",
  dpInit: "0_userdata.0.Abfallkalender",
  uniqueID: "abfall",
  template: "entities.waste-calendar"
};
const pagePowerTest1 = {
  //type: 'sonstiges',
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
            color: { type: "const", constVal: import_Color.Color.MSGreen },
            text: void 0
          },
          false: {
            value: void 0,
            color: { type: "const", constVal: import_Color.Color.MSRed },
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
            color: { type: "const", constVal: import_Color.Color.MSGreen },
            text: void 0
          },
          false: {
            value: void 0,
            color: { type: "const", constVal: import_Color.Color.MSRed },
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
            color: { type: "const", constVal: import_Color.Color.MSGreen },
            text: void 0
          },
          false: {
            value: void 0,
            color: { type: "const", constVal: import_Color.Color.MSRed },
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
            color: { type: "const", constVal: import_Color.Color.MSGreen },
            text: void 0
          },
          false: {
            value: void 0,
            color: { type: "const", constVal: import_Color.Color.MSRed },
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
const pageFahrplanTimetable = {
  card: "cardEntities",
  dpInit: "fahrplan.0.DepartureTimetable0",
  uniqueID: "fahrplanabfahrten",
  template: "entities.fahrplan.departure-timetable"
};
const pageFahrplanRoutes = {
  card: "cardEntities",
  dpInit: "fahrplan.0.0",
  uniqueID: "fahrplanrouten",
  template: "entities.fahrplan.routes"
};
const pageThermoTemplate = {
  card: "cardThermo",
  template: "thermo.hmip.valve",
  alwaysOn: "always",
  uniqueID: "thermo",
  enums: ["enum.rooms.office"],
  dpInit: ""
};
const pageThermo = {
  card: "cardThermo",
  template: "thermo.hmip.wallthermostat",
  alwaysOn: "always",
  uniqueID: "thermo1",
  enums: ["enum.rooms.living_room"],
  dpInit: ""
};
const pageAlarm = {
  uniqueID: "uidAlarm",
  alwaysOn: "always",
  dpInit: "",
  pageItems: [],
  config: {
    card: "cardAlarm",
    data: {
      headline: {
        type: "const",
        constVal: "Alarmanalage"
      },
      entity1: void 0,
      button1: {
        type: "const",
        constVal: "Vollschutz"
      },
      button2: {
        type: "const",
        constVal: "Zuhause"
      },
      button3: {
        type: "const",
        constVal: "Nacht"
      },
      button4: {
        type: "const",
        constVal: "Besuch"
      },
      icon: void 0,
      pin: {
        type: "const",
        constVal: "1234"
      },
      approved: { type: "triggered", dp: "0_userdata.0.Alarmtrigger", change: "ts" }
    }
  }
};
const pageUnlockTest = {
  uniqueID: "unlock1",
  alwaysOn: "always",
  dpInit: "",
  pageItems: [],
  config: {
    card: "cardAlarm",
    data: {
      alarmType: { type: "const", constVal: "unlock" },
      headline: { type: "const", constVal: "Unlock" },
      entity1: void 0,
      button1: void 0,
      button2: void 0,
      button3: void 0,
      button4: void 0,
      icon: void 0,
      pin: { type: "const", constVal: "12345" },
      setNavi: { type: "const", constVal: "3" }
    }
  }
};
const popupTest = {
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "popup1",
  useColor: false,
  config: {
    card: "popupNotify",
    data: {
      entity1: { value: { type: "triggered", dp: "0_userdata.0.example_state_boolean" } },
      headline: { type: "state", dp: "0_userdata.0.NSPanel.Flur.popupNotify.popupNotifyHeading" },
      colorHeadline: { true: { color: { type: "const", constVal: "#F80000" } } },
      buttonLeft: { type: "state", dp: "0_userdata.0.NSPanel.Flur.popupNotify.popupNotifyButton1Text" },
      colorButtonLeft: { true: { color: { type: "const", constVal: import_Color.Color.Green } } },
      buttonRight: { type: "state", dp: "0_userdata.0.NSPanel.Flur.popupNotify.popupNotifyButton2Text" },
      colorButtonRight: { true: { color: { type: "const", constVal: import_Color.Color.White } } },
      //text: { type: 'const', constVal: 'Text Test ${pl}' },
      text: { type: "state", dp: "0_userdata.0.NSPanel.Flur.popupNotify.popupNotifyText" },
      colorText: { true: { color: { type: "const", constVal: import_Color.Color.White } } },
      timeout: { type: "state", dp: "0_userdata.0.NSPanel.Flur.popupNotify.popupNotifySleepTimeout" },
      // {placeholder: {text: '' oder dp: ''}} im Text muss dann ${dieserKeyStehtImText} stehen
      // optionalValue: { type: 'const', constVal: { dieserKeyStehtImText: { text: 'das ist ein placeholder' } } },
      setValue1: { type: "state", dp: "0_userdata.0.NSPanel.Flur.popupNotify.popupNotifyAction" }
      // alleine ist es ein switch
      //setValue2: { type: 'const', constVal: true }, // mit setValue2 wird 1, bei yes und 2 bei no auf true gesetzt
    }
  },
  pageItems: [],
  items: void 0
};
const pageGridTest = {
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "testlicht",
  useColor: false,
  items: void 0,
  config: {
    card: "cardGrid",
    data: {
      headline: {
        type: "const",
        constVal: "test Licht"
      }
    }
  },
  pageItems: [
    {
      template: "script.ct",
      dpInit: "alias.0.Licht.testCT"
    },
    {
      template: "script.rgb",
      dpInit: "alias.0.Licht.RGB"
    },
    {
      template: "script.rgbSingle",
      dpInit: "alias.0.Licht.rgbSingle"
    },
    {
      template: "script.rgbSingleHEX",
      dpInit: "alias.0.Licht.rgbSingle"
    },
    {
      template: "script.dimmer",
      dpInit: "alias.0.Licht.testdimmer"
    },
    {
      template: "script.hue",
      dpInit: "alias.0.Licht.testHue"
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
    data: void 0
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
    pages: [
      pageGridMain,
      pageGridTueren,
      pageGridFenster1,
      pageGridFenster2,
      pageGridLicht1,
      pageGridLicht2,
      pageGridLicht3,
      pageGridLicht4,
      pagePowerTest1,
      pageScreensaverTest,
      pageAbfall,
      pageFahrplanTimetable,
      pageFahrplanRoutes,
      pageThermoTemplate,
      pagenEntitiesAdapter,
      pageAlarm,
      pageUnlockTest,
      popupTest,
      pageThermo,
      pageGridTest
    ],
    // override by password.ts
    navigation: [
      {
        name: "main",
        //main ist die erste Seite
        page: "main",
        left: { single: "10" },
        // arrow-top-left-bold-outline
        right: { single: "1" },
        //
        optional: "notifications"
      },
      {
        name: "11",
        left: { double: "main" },
        // Das main bezieht sich auf den name: main
        right: { double: "main" },
        page: "tuer"
        // das tuer bezieht sich auf die uniqueID oben in pages
      },
      {
        name: "12",
        left: { double: "main" },
        right: { single: "13" },
        page: "fenster1"
      },
      {
        name: "13",
        left: { single: "12" },
        right: { double: "main" },
        page: "fenster2"
      },
      {
        name: "14",
        left: { double: "main" },
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
        right: { double: "main" },
        page: "licht4"
      },
      {
        name: "1",
        left: { single: "main" },
        right: { single: "2" },
        page: "abfall"
      },
      {
        name: "2",
        left: { single: "1" },
        right: { single: "3" },
        page: "power1"
      },
      {
        name: "3",
        left: { single: "2" },
        right: { single: "4" },
        page: "fahrplanabfahrten"
      },
      {
        name: "4",
        left: { single: "3" },
        right: { single: "6" },
        page: "fahrplanrouten"
      },
      {
        name: "6",
        left: { single: "4" },
        right: { single: "7" },
        page: "thermo"
      },
      {
        name: "7",
        left: { single: "6" },
        right: { single: "8" },
        page: "adapter"
      },
      {
        name: "8",
        left: { single: "7" },
        right: { single: "9" },
        page: "///unlock"
      },
      {
        name: "9",
        left: { single: "8" },
        right: { single: "10" },
        page: "testlicht"
      },
      {
        name: "10",
        left: { single: "9" },
        right: { single: "main" },
        page: "thermo1"
      }
    ],
    topic: "SmartHome/NSPanel_1",
    name: "B\xFCro",
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
