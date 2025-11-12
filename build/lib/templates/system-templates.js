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
var system_templates_exports = {};
__export(system_templates_exports, {
  systemNavigation: () => systemNavigation,
  systemPages: () => systemPages
});
module.exports = __toCommonJS(system_templates_exports);
var import_Color = require("../const/Color");
const popupNotification = {
  dpInit: "",
  alwaysOn: "ignore",
  uniqueID: "///popupNotificationSystem",
  config: {
    card: "popupNotify",
    data: {
      details: { type: "internal", dp: "system/popupNotification", change: "ts" },
      setStateYes: { type: "internal", dp: "cmd/NotificationCleared" },
      setStateMid: { type: "internal", dp: "cmd/NotificationClearedAll" }
    }
  },
  pageItems: [],
  items: void 0
};
const popupNotification2 = {
  dpInit: "",
  alwaysOn: "ignore",
  uniqueID: "///popupNotificationCustom",
  config: {
    card: "popupNotify",
    data: {
      details: { type: "internal", dp: "cmd/popupNotificationCustom", change: "ts" },
      setStateYes: { type: "internal", dp: "cmd/NotificationCustomRight" },
      setStateMid: { type: "internal", dp: "cmd/NotificationCustomMid" },
      setStateNo: { type: "internal", dp: "cmd/NotificationCustomLeft" },
      setStateID: { type: "internal", dp: "cmd/NotificationCustomID" },
      setGlobalYes: { type: "internal", dp: "///cmd/NotificationCustomRight" },
      setGlobalMid: { type: "internal", dp: "///cmd/NotificationCustomMid" },
      setGlobalNo: { type: "internal", dp: "///cmd/NotificationCustomLeft" },
      setGlobalID: { type: "internal", dp: "///cmd/NotificationCustomID" }
    }
  },
  pageItems: [],
  items: void 0
};
const AdapterInformation = {
  //type: 'sonstiges',
  //card: 'cardEntities',
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///Adapter-Info",
  config: {
    card: "cardEntities",
    data: {
      headline: {
        type: "const",
        constVal: "Adapter-Info."
      }
    }
  },
  pageItems: [
    {
      template: "button.service.adapter.noconnection",
      dpInit: "",
      data: {
        setNavi: { type: "const", constVal: "///AdapterNotConnectedDetail" }
      }
    },
    {
      template: "button.service.adapter.stopped",
      dpInit: "",
      data: {
        setNavi: { type: "const", constVal: "///AdapterStoppedDetail" }
      }
    },
    {
      role: "",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "bell-badge-outline" },
            color: { type: "const", constVal: import_Color.Color.Green }
          },
          false: {
            value: { type: "const", constVal: "bell-outline" },
            color: { type: "const", constVal: import_Color.Color.Blue }
          }
        },
        entity1: {
          value: {
            type: "triggered",
            dp: "admin.0.info.updatesNumber",
            read: "return val != 0"
          }
        },
        text: {
          true: { type: "const", constVal: "Updates" },
          false: void 0
        },
        text1: {
          true: { type: "state", dp: "admin.0.info.updatesNumber" },
          false: { type: "const", constVal: "0" }
        },
        setNavi: { type: "const", constVal: "///AdapterUpdate" }
      }
    }
  ],
  items: void 0
};
const ServiceUnlock = {
  uniqueID: "///unlock",
  alwaysOn: "always",
  dpInit: "",
  pageItems: [],
  config: {
    card: "cardAlarm",
    data: {
      alarmType: { type: "const", constVal: "unlock" },
      headline: { type: "const", constVal: "Service-Unlock" },
      entity1: void 0,
      button1: void 0,
      button2: void 0,
      button3: void 0,
      button4: void 0,
      icon: void 0,
      pin: { type: "const", constVal: "-1" },
      setNavi: { type: "const", constVal: "///Overview" }
    }
  }
};
const ServiceOverview = {
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///Overview",
  config: {
    card: "cardGrid2",
    data: {
      headline: {
        type: "const",
        constVal: "Overview"
      }
    }
  },
  pageItems: [
    {
      role: "",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "folder-alert-outline" },
            color: { type: "const", constVal: import_Color.Color.Yellow }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Adapter" },
          false: void 0
        },
        setNavi: { type: "const", constVal: "///Adapter-Info" }
      }
    },
    {
      role: "",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "monitor" },
            color: { type: "const", constVal: import_Color.Color.Red }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Display" },
          false: void 0
        },
        setNavi: { type: "const", constVal: "///ScreensaverOptions" }
        //confirm: { type: 'const', constVal: 'test' },
      }
    },
    {
      role: "",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "power" },
            color: { type: "const", constVal: import_Color.Color.option1 }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Relais" },
          false: void 0
        },
        setNavi: { type: "const", constVal: "///RelaisOption" }
      }
    },
    {
      role: "",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "information-variant" },
            color: { type: "const", constVal: import_Color.Color.option2 }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Device" },
          false: void 0
        },
        setNavi: { type: "const", constVal: "///DeviceOption" }
      }
    },
    {
      role: "",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "wifi" },
            color: { type: "const", constVal: import_Color.Color.option3 }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Network" },
          false: void 0
        },
        setNavi: { type: "const", constVal: "///NetworkOption" }
      }
    },
    {
      role: "",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "cog-outline" },
            color: { type: "const", constVal: import_Color.Color.option4 }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "System" },
          false: void 0
        },
        setNavi: { type: "const", constVal: "///SystemOption" }
      }
    }
  ],
  items: void 0
};
const AdapterNotConnectedDetail = {
  //card: 'cardEntities',
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///AdapterNotConnectedDetail",
  config: {
    card: "cardEntities",
    cardRole: "AdapterConnection",
    scrollType: "page",
    filterType: "false",
    data: {
      headline: {
        type: "const",
        constVal: "Adapter Offline"
      }
    }
  },
  pageItems: [],
  items: void 0
};
const AdapterStoppedDetail = {
  //card: 'cardEntities',
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///AdapterStoppedDetail",
  config: {
    card: "cardEntities",
    cardRole: "AdapterStopped",
    scrollType: "page",
    filterType: "false",
    data: {
      headline: {
        type: "const",
        constVal: "Adapter stopped"
      }
    }
  },
  pageItems: [],
  items: void 0
};
const AdapterUpdateDetail = {
  dpInit: "admin.0.",
  alwaysOn: "none",
  uniqueID: "///AdapterUpdate",
  config: {
    card: "cardEntities",
    cardRole: "AdapterUpdates",
    scrollType: "page",
    data: {
      headline: {
        type: "const",
        constVal: "Adapter update"
      },
      list: {
        mode: "auto",
        type: "state",
        dp: "",
        regexp: /\.info\.updatesJson$/,
        role: ""
      }
    }
  },
  pageItems: [],
  items: void 0
};
const ScreensaverOptions = {
  //type: 'sonstiges',
  //card: 'cardEntities',
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///ScreensaverOptions",
  config: {
    card: "cardGrid3",
    scrollType: "page",
    data: {
      headline: {
        type: "const",
        constVal: "ScreensaverOptions"
      }
    }
  },
  pageItems: [
    {
      role: "",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "brightness-6" },
            color: { type: "const", constVal: import_Color.Color.Yellow }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Brightness" },
          false: void 0
        },
        setNavi: { type: "const", constVal: "///ScreensaverBrightness" }
      }
    },
    {
      role: "",
      type: "button",
      dpInit: "",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "monitor-dashboard" },
            color: { type: "const", constVal: import_Color.Color.Yellow }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Layout" },
          false: void 0
        },
        setNavi: { type: "const", constVal: "///ScreensaverLayout" }
      }
    }
  ],
  items: void 0
};
const ScreensaverBrightness = {
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///ScreensaverBrightness",
  config: {
    card: "cardEntities",
    scrollType: "page",
    data: {
      headline: {
        type: "const",
        constVal: "ScreensaverBrightness"
      }
    }
  },
  pageItems: [
    // switch Doppelklick
    {
      role: "",
      type: "switch",
      data: {
        entity1: {
          value: { type: "internal", dp: "cmd/screenSaverDoubleClick" }
        },
        icon: {
          true: {
            value: { type: "const", constVal: "switch" },
            color: { type: "const", constVal: import_Color.Color.Green }
          },
          false: {
            value: { type: "const", constVal: "switch" },
            color: { type: "const", constVal: import_Color.Color.Red }
          }
        },
        text: { true: { type: "const", constVal: "DoubleClick" }, false: void 0 }
      }
    },
    // slider Timeout to Screensaver
    {
      role: "",
      type: "number",
      data: {
        entity1: {
          value: { type: "internal", dp: "cmd/screenSaverTimeout" }
        },
        minValue1: { type: "const", constVal: 0 },
        maxValue1: { type: "const", constVal: 90 },
        icon: {
          true: {
            value: { type: "const", constVal: "clock-time-twelve-outline" },
            color: { type: "const", constVal: import_Color.Color.White }
          },
          false: void 0
        },
        text: { true: { type: "const", constVal: "screenSaverTimeout" }, false: void 0 }
      }
    },
    // slider Helligkeit Standby
    {
      role: "",
      type: "number",
      data: {
        entity1: {
          value: { type: "internal", dp: "cmd/dimStandby" }
        },
        minValue1: { type: "const", constVal: 0 },
        maxValue1: { type: "const", constVal: 100 },
        icon: {
          true: {
            value: { type: "const", constVal: "clock-time-twelve-outline" },
            color: { type: "const", constVal: import_Color.Color.White }
          },
          false: void 0
        },
        text: { true: { type: "const", constVal: "dimStandby" }, false: void 0 }
      }
    },
    // slider Helligkeit aktiv
    {
      role: "",
      type: "number",
      data: {
        entity1: {
          value: { type: "internal", dp: "cmd/dimActive" }
        },
        minValue1: { type: "const", constVal: 0 },
        maxValue1: { type: "const", constVal: 100 },
        icon: {
          true: {
            value: { type: "const", constVal: "clock-time-twelve-outline" },
            color: { type: "const", constVal: import_Color.Color.White }
          },
          false: void 0
        },
        text: { true: { type: "const", constVal: "dimActive" }, false: void 0 }
      }
    },
    // slider Helligkeit Nacht Standby
    {
      role: "",
      type: "number",
      data: {
        entity1: {
          value: { type: "internal", dp: "cmd/dimNightStandby" }
        },
        minValue1: { type: "const", constVal: 0 },
        maxValue1: { type: "const", constVal: 100 },
        icon: {
          true: {
            value: { type: "const", constVal: "clock-time-twelve-outline" },
            color: { type: "const", constVal: import_Color.Color.White }
          },
          false: void 0
        },
        text: { true: { type: "const", constVal: "dimNightStandby" }, false: void 0 }
      }
    },
    // slider Helligkeit Nacht aktiv
    {
      role: "",
      type: "number",
      data: {
        entity1: {
          value: { type: "internal", dp: "cmd/dimNightActive" }
        },
        minValue1: { type: "const", constVal: 0 },
        maxValue1: { type: "const", constVal: 100 },
        icon: {
          true: {
            value: { type: "const", constVal: "clock-time-twelve-outline" },
            color: { type: "const", constVal: import_Color.Color.White }
          },
          false: void 0
        },
        text: { true: { type: "const", constVal: "dimNightActive" }, false: void 0 }
      }
    },
    // slider Helligkeit Nacht Start
    {
      role: "",
      type: "number",
      data: {
        entity1: {
          value: { type: "internal", dp: "cmd/dimNightHourStart" }
        },
        minValue1: { type: "const", constVal: 0 },
        maxValue1: { type: "const", constVal: 23 },
        icon: {
          true: {
            value: { type: "const", constVal: "clock-time-twelve-outline" },
            color: { type: "const", constVal: import_Color.Color.White }
          },
          false: void 0
        },
        text: { true: { type: "const", constVal: "dimNightHourStart" }, false: void 0 }
      }
    },
    // slider Helligkeit Nacht Ende
    {
      role: "",
      type: "number",
      data: {
        entity1: {
          value: { type: "internal", dp: "cmd/dimNightHourEnd" }
        },
        minValue1: { type: "const", constVal: 0 },
        maxValue1: { type: "const", constVal: 23 },
        icon: {
          true: {
            value: { type: "const", constVal: "clock-time-twelve-outline" },
            color: { type: "const", constVal: import_Color.Color.White }
          },
          false: void 0
        },
        text: { true: { type: "const", constVal: "dimNightHourEnd" }, false: void 0 }
      }
    }
  ],
  items: void 0
};
const ScreensaverLayout = {
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///ScreensaverLayout",
  config: {
    card: "cardEntities",
    scrollType: "page",
    data: {
      headline: {
        type: "const",
        constVal: "ScreensaverLayout"
      }
    }
  },
  pageItems: [
    {
      role: "text.list",
      type: "button",
      template: "button.iconLeftSize",
      dpInit: ""
    },
    {
      role: "text.list",
      type: "button",
      template: "button.iconRightSize",
      dpInit: ""
    },
    {
      role: "",
      type: "input_sel",
      data: {
        headline: { type: "const", constVal: "screenSaverLayout" },
        entityInSel: {
          value: { type: "internal", dp: "cmd/screenSaverLayout" }
        },
        icon: {
          true: {
            value: { type: "const", constVal: "monitor" },
            color: { type: "const", constVal: import_Color.Color.Green }
          },
          false: void 0
        },
        text: { true: { type: "internal", dp: "cmd/screenSaverLayout" }, false: void 0 },
        /**
         * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
         */
        //valueList: { type: 'internal', dp: 'cmd/screenSaverLayout', read: 'return val ? val.split(";") : []' },
        valueList: { type: "const", constVal: "standard?alternate?advanced?easyview" }
      }
    },
    {
      role: "",
      type: "number",
      data: {
        entity1: {
          value: { type: "internal", dp: "cmd/screenSaverRotationTime" }
        },
        minValue1: { type: "const", constVal: 0 },
        maxValue1: { type: "const", constVal: 60 },
        icon: {
          true: {
            value: { type: "const", constVal: "clock-time-twelve-outline" },
            color: { type: "const", constVal: import_Color.Color.White }
          },
          false: void 0
        },
        text: { true: { type: "const", constVal: "screenSaverRotationtime" }, false: void 0 }
      }
    }
  ],
  items: void 0
};
const RelaisOption = {
  //type: 'sonstiges',
  //card: 'cardEntities',
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///RelaisOption",
  config: {
    card: "cardEntities",
    data: {
      headline: {
        type: "const",
        constVal: "RelaisOption"
      }
    }
  },
  pageItems: [
    {
      role: "",
      type: "button",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "numeric-1-circle-outline" },
            color: { type: "const", constVal: import_Color.Color.Gray }
          },
          false: {
            value: { type: "const", constVal: "numeric-1-circle" },
            color: { type: "const", constVal: import_Color.Color.Yellow }
          }
        },
        entity1: {
          value: {
            type: "internal",
            dp: "cmd/detachLeft"
          }
        },
        text: {
          true: { type: "const", constVal: "HW-Button left" },
          false: void 0
        },
        text1: {
          true: { type: "const", constVal: "decoupled" },
          false: { type: "const", constVal: "coupled" }
        }
      }
    },
    {
      role: "",
      type: "button",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "numeric-2-circle-outline" },
            color: { type: "const", constVal: import_Color.Color.Gray }
          },
          false: {
            value: { type: "const", constVal: "numeric-2-circle" },
            color: { type: "const", constVal: import_Color.Color.Yellow }
          }
        },
        entity1: {
          value: {
            type: "internal",
            dp: "cmd/detachRight"
          }
        },
        text: {
          true: { type: "const", constVal: "HW-Button right" },
          false: void 0
        },
        text1: {
          true: { type: "const", constVal: "decoupled" },
          false: { type: "const", constVal: "coupled" }
        }
      }
    }
  ],
  items: void 0
};
const DeviceOption = {
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///DeviceOption",
  config: {
    card: "cardEntities",
    data: {
      headline: {
        type: "const",
        constVal: "DeviceOption"
      }
    }
  },
  pageItems: [
    {
      role: "",
      type: "button",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "information-outline" },
            color: { type: "const", constVal: import_Color.Color.option4 }
          },
          false: {
            value: { type: "const", constVal: "information-variant" },
            color: { type: "const", constVal: import_Color.Color.off }
          }
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Tasmota-Restart" },
          false: void 0
        },
        text1: {
          true: {
            type: "const",
            constVal: "restart"
          },
          false: void 0
        },
        confirm: { type: "const", constVal: "sure?" },
        setValue2: {
          type: "internal",
          dp: "cmd/TasmotaRestart"
        }
      }
    },
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "information-outline" },
            color: { type: "const", constVal: import_Color.Color.Green }
          },
          false: {
            value: { type: "const", constVal: "information-variant" },
            color: { type: "const", constVal: import_Color.Color.Gray }
          }
        },
        entity1: {
          value: {
            type: "const",
            constVal: "cmd/tasmotaVersion"
          }
        },
        text: {
          true: { type: "const", constVal: "Tasmota-Version" },
          false: void 0
        },
        text1: {
          true: {
            type: "internal",
            dp: "info/tasmotaVersion"
          },
          false: void 0
        }
      }
    },
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "information-outline" },
            color: { type: "const", constVal: import_Color.Color.Green }
          },
          false: {
            value: { type: "const", constVal: "information-variant" },
            color: { type: "const", constVal: import_Color.Color.Gray }
          }
        },
        entity1: {
          value: {
            type: "const",
            constVal: "cmd/displayVersion"
          }
        },
        text: {
          true: { type: "const", constVal: "TFT-Version" },
          false: void 0
        },
        text1: {
          true: {
            type: "internal",
            dp: "info/displayVersion"
          },
          false: void 0
        }
      }
    },
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "information-outline" },
            color: { type: "const", constVal: import_Color.Color.Green }
          },
          false: {
            value: { type: "const", constVal: "information-variant" },
            color: { type: "const", constVal: import_Color.Color.Gray }
          }
        },
        entity1: {
          value: {
            type: "const",
            constVal: "cmd/modelVersion"
          }
        },
        text: {
          true: { type: "const", constVal: "HW-Nspanel-Version" },
          false: void 0
        },
        text1: {
          true: {
            type: "internal",
            dp: "info/modelVersion"
          },
          false: void 0
        }
      }
    }
  ],
  items: void 0
};
const NetworkOption = {
  //type: 'sonstiges',
  //card: 'cardEntities',
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///NetworkOption",
  config: {
    card: "cardEntities",
    data: {
      headline: {
        type: "const",
        constVal: "Network"
      }
    },
    scrollType: "page"
  },
  pageItems: [
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "desktop-mac" },
            color: { type: "const", constVal: import_Color.Color.info }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Hostname" },
          false: void 0
        },
        text1: {
          true: {
            type: "internalState",
            dp: "info/Tasmota",
            read: `return val ? val.net.Hostname : '';`
          },
          false: void 0
        }
      }
    },
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "ip-network-outline" },
            color: { type: "const", constVal: import_Color.Color.info }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "IP" },
          false: void 0
        },
        text1: {
          true: {
            type: "internalState",
            dp: "info/Tasmota",
            read: `return val ? val.net.IPAddress : '';`
          },
          false: void 0
        }
      }
    },
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "dns-outline" },
            color: { type: "const", constVal: import_Color.Color.info }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "DNS" },
          false: void 0
        },
        text1: {
          true: {
            type: "internalState",
            dp: "info/Tasmota",
            read: `return val ? val.net.DNSServer1 : '';`
          },
          false: void 0
        }
      }
    },
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "router-network" },
            color: { type: "const", constVal: import_Color.Color.info }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Mac" },
          false: void 0
        },
        text1: {
          true: {
            type: "internalState",
            dp: "info/Tasmota",
            read: `return val ? val.net.Mac : '';`
          },
          false: void 0
        }
      }
    },
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "signal-distance-variant" },
            color: { type: "const", constVal: import_Color.Color.info }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Wifi-SSId" },
          false: void 0
        },
        text1: {
          true: {
            type: "internalState",
            dp: "info/Tasmota",
            read: `return val ? val.sts.Wifi.SSId : '';`
          },
          false: void 0
        }
      }
    },
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "signal" },
            color: { type: "const", constVal: import_Color.Color.info }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "RSSI" },
          false: void 0
        },
        text1: {
          true: {
            type: "internalState",
            dp: "info/Tasmota",
            read: `return val ? val.sts.Wifi.RSSI + ' %' : '';`
          },
          false: void 0
        }
      }
    },
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "wifi-strength-2" },
            color: { type: "const", constVal: import_Color.Color.info }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Signal" },
          false: void 0
        },
        text1: {
          true: {
            type: "internalState",
            dp: "info/Tasmota",
            read: `return val ? val.sts.Wifi.Signal + ' db' : '';`
          },
          false: void 0
        }
      }
    },
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "sort-clock-ascending-outline" },
            color: { type: "const", constVal: import_Color.Color.info }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Wifi-Downtime" },
          false: void 0
        },
        text1: {
          true: {
            type: "internalState",
            dp: "info/Tasmota",
            read: `return val ? val.sts.Wifi.Downtime : '';`
          },
          false: void 0
        }
      }
    },
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "signal-distance-variant" },
            color: { type: "const", constVal: import_Color.Color.info }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Mode" },
          false: void 0
        },
        text1: {
          true: {
            type: "internalState",
            dp: "info/Tasmota",
            read: `return val ? val.sts.Wifi.Mode : '';`
          },
          false: void 0
        }
      }
    },
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "timeline-clock-outline" },
            color: { type: "const", constVal: import_Color.Color.info }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "Channel" },
          false: void 0
        },
        text1: {
          true: {
            type: "internalState",
            dp: "info/Tasmota",
            read: `return val ? val.sts.Wifi.Channel : '';`
          },
          false: void 0
        }
      }
    },
    {
      role: "",
      type: "text",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: "router-wireless-settings" },
            color: { type: "const", constVal: import_Color.Color.info }
          },
          false: void 0
        },
        entity1: {
          value: {
            type: "const",
            constVal: true
          }
        },
        text: {
          true: { type: "const", constVal: "AP" },
          false: void 0
        },
        text1: {
          true: {
            type: "internalState",
            dp: "info/Tasmota",
            read: `return val ? val.sts.Wifi.AP : '';`
          },
          false: void 0
        }
      }
    }
  ],
  items: void 0
};
const SystemOption = {
  //type: 'sonstiges',
  //card: 'cardEntities',
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///SystemOption",
  config: {
    card: "cardEntities",
    data: {
      headline: {
        type: "const",
        constVal: "System"
      }
    },
    scrollType: "page"
  },
  pageItems: [
    {
      role: "",
      type: "switch",
      data: {
        entity1: {
          value: { type: "internal", dp: "cmd/hideCards" }
        },
        icon: {
          true: {
            value: { type: "const", constVal: "switch" },
            color: { type: "const", constVal: import_Color.Color.Green }
          },
          false: {
            value: { type: "const", constVal: "switch" },
            color: { type: "const", constVal: import_Color.Color.Red }
          }
        },
        text: { true: { type: "const", constVal: "Hide Cards" }, false: void 0 },
        setValue1: { type: "internal", dp: "cmd/hideCards" }
      }
    }
  ],
  items: void 0
};
const systemPages = [
  popupNotification,
  popupNotification2,
  AdapterInformation,
  ServiceUnlock,
  ServiceOverview,
  AdapterStoppedDetail,
  AdapterNotConnectedDetail,
  AdapterUpdateDetail,
  ScreensaverOptions,
  ScreensaverBrightness,
  ScreensaverLayout,
  RelaisOption,
  DeviceOption,
  NetworkOption,
  SystemOption
];
const systemNavigation = [
  {
    name: "///service",
    page: "///unlock",
    left: { single: "main" }
  },
  {
    name: "///Overview",
    page: "///Overview",
    right: { double: "main" },
    optional: "notifications"
  },
  {
    name: "///Adapter-Info",
    page: "///Adapter-Info",
    left: { double: "///Overview" }
  },
  {
    name: "///AdapterStoppedDetail",
    page: "///AdapterStoppedDetail",
    left: { double: "///Adapter-Info" }
  },
  {
    name: "///AdapterNotConnectedDetail",
    page: "///AdapterNotConnectedDetail",
    left: { double: "///Adapter-Info" }
  },
  {
    name: "///AdapterUpdate",
    page: "///AdapterUpdate",
    left: { double: "///Adapter-Info" }
  },
  {
    name: "///ScreensaverOptions",
    page: "///ScreensaverOptions",
    left: { double: "///Overview" }
  },
  {
    name: "///ScreensaverBrightness",
    page: "///ScreensaverBrightness",
    left: { double: "///ScreensaverOptions" }
  },
  {
    name: "///ScreensaverLayout",
    page: "///ScreensaverLayout",
    left: { double: "///ScreensaverOptions" }
  },
  {
    name: "///RelaisOption",
    page: "///RelaisOption",
    left: { double: "///Overview" }
  },
  {
    name: "///DeviceOption",
    page: "///DeviceOption",
    left: { double: "///Overview" }
  },
  {
    name: "///NetworkOption",
    page: "///NetworkOption",
    left: { double: "///Overview" }
  },
  {
    name: "///SystemOption",
    page: "///SystemOption",
    left: { double: "///Overview" }
  },
  {
    name: "///PopupInfo",
    page: "///PopupInfo",
    left: { double: "///Overview" }
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  systemNavigation,
  systemPages
});
//# sourceMappingURL=system-templates.js.map
