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
const popupWelcome = {
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///WelcomePopup",
  config: {
    card: "popupNotify",
    data: {
      entity1: { value: { type: "const", constVal: "hm" } },
      headline: { type: "const", constVal: "welcomeHToken" },
      colorHeadline: { true: { color: { type: "const", constVal: import_Color.Color.Green } } },
      buttonLeft: { type: "const", constVal: "" },
      colorButtonLeft: { true: { color: { type: "const", constVal: import_Color.Color.White } } },
      buttonRight: { type: "const", constVal: "" },
      colorButtonRight: { true: { color: { type: "const", constVal: import_Color.Color.White } } },
      text: { type: "const", constVal: "welcomeTToken" },
      // text: { type: 'const', constVal: 'Text Test ${pl}' },
      colorText: { true: { color: { type: "const", constVal: import_Color.Color.White } } },
      timeout: { type: "const", constVal: 3 }
      // {placeholder: {text: '' oder dp: ''}} im Text muss dann ${dieserKeyStehtImText} stehen
      // optionalValue: { type: 'const', constVal: { dieserKeyStehtImText: { text: 'das ist ein placeholder' } } },
      //setValue1: { type: 'const', constVal: true }, // alleine ist es ein switch
      //setValue2: { type: 'const', constVal: true }, // mit setValue2 wird 1, bei yes und 2 bei no auf true gesetzt
    }
  },
  pageItems: [],
  items: void 0
};
const popupNotification = {
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///popupNotification",
  config: {
    card: "popupNotify",
    data: {
      entity1: { value: { type: "internal", dp: "cmd/popupNotification", read: "return true" } },
      headline: { type: "internal", dp: "cmd/popupNotification", read: "return JSON.parse(val).headline" },
      colorHeadline: { true: { color: { type: "const", constVal: import_Color.Color.Green } } },
      buttonLeft: { type: "const", constVal: "nextF" },
      colorButtonLeft: { true: { color: { type: "const", constVal: import_Color.Color.White } } },
      buttonRight: { type: "const", constVal: "ok" },
      colorButtonRight: { true: { color: { type: "const", constVal: import_Color.Color.White } } },
      text: { type: "internal", dp: "cmd/popupNotification", read: "return JSON.parse(val).text" },
      // text: { type: 'const', constVal: 'Text Test ${pl}' },
      colorText: { true: { color: { type: "const", constVal: import_Color.Color.White } } },
      timeout: { type: "const", constVal: 0 },
      // {placeholder: {text: '' oder dp: ''}}
      // optionalValue: { type: 'const', constVal: { pl: { text: 'das ist ein placeholder' } } },
      setValue1: { type: "internalState", dp: "cmd/NotificationCleared" },
      setValue2: { type: "internalState", dp: "cmd/NotificationNext" },
      closingBehaviour: { type: "const", constVal: "none" }
    }
  },
  pageItems: [],
  items: void 0
};
const popupNotification2 = {
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///popupNotification2",
  config: {
    card: "popupNotify",
    data: {
      entity1: { value: { type: "internal", dp: "cmd/popupNotification2", read: "return true" } },
      headline: { type: "internal", dp: "cmd/popupNotification2", read: "return JSON.parse(val).headline" },
      colorHeadline: { true: { color: { type: "const", constVal: import_Color.Color.Green } } },
      buttonLeft: { type: "const", constVal: "nextF" },
      colorButtonLeft: { true: { color: { type: "const", constVal: import_Color.Color.White } } },
      buttonRight: { type: "const", constVal: "ok" },
      colorButtonRight: { true: { color: { type: "const", constVal: import_Color.Color.Green } } },
      text: { type: "internal", dp: "cmd/popupNotification2", read: "return JSON.parse(val).text" },
      // text: { type: 'const', constVal: 'Text Test ${pl}' },
      colorText: { true: { color: { type: "const", constVal: import_Color.Color.White } } },
      timeout: { type: "const", constVal: 0 },
      setValue1: { type: "internalState", dp: "cmd/NotificationCleared2" },
      setValue2: { type: "internalState", dp: "cmd/NotificationNext2" },
      closingBehaviour: { type: "const", constVal: "none" }
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
  useColor: false,
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
  useColor: false,
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
            color: { type: "const", constVal: import_Color.Color.Green }
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
            color: { type: "const", constVal: import_Color.Color.Green }
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
            color: { type: "const", constVal: import_Color.Color.Green }
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
  useColor: false,
  config: {
    card: "cardEntities",
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
        text: { true: { type: "const", constVal: "DoubleClick" }, false: void 0 },
        setValue1: { type: "internal", dp: "cmd/screenSaverDoubleClick" }
      }
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
const RelaisOption = {
  //type: 'sonstiges',
  //card: 'cardEntities',
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///RelaisOption",
  useColor: false,
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
        },
        setValue1: {
          type: "internal",
          dp: "cmd/detachLeft"
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
        },
        setValue1: {
          type: "internal",
          dp: "cmd/detachRight"
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
  useColor: false,
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
  useColor: false,
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
      role: "textNotIcon",
      type: "text",
      data: {
        icon: {
          true: {
            text: { value: { type: "const", constVal: "1" } },
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
      role: "textNotIcon",
      type: "text",
      data: {
        icon: {
          true: {
            text: { value: { type: "const", constVal: "2" } },
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
      role: "textNotIcon",
      type: "text",
      data: {
        icon: {
          true: {
            text: { value: { type: "const", constVal: "3" } },
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
      role: "textNotIcon",
      type: "text",
      data: {
        icon: {
          true: {
            text: { value: { type: "const", constVal: "4" } },
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
      role: "textNotIcon",
      type: "text",
      data: {
        icon: {
          true: {
            text: { value: { type: "const", constVal: "5" } },
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
      role: "textNotIcon",
      type: "text",
      data: {
        icon: {
          true: {
            text: { value: { type: "const", constVal: "6" } },
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
            read: `return val ? val.sts.Wifi.RSSI : '';`
          },
          false: void 0
        }
      }
    },
    {
      role: "textNotIcon",
      type: "text",
      data: {
        icon: {
          true: {
            text: { value: { type: "const", constVal: "7" } },
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
      role: "textNotIcon",
      type: "text",
      data: {
        icon: {
          true: {
            text: { value: { type: "const", constVal: "8" } },
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
    }
  ],
  items: void 0
};
const systemPages = [
  popupWelcome,
  popupNotification,
  popupNotification2,
  AdapterInformation,
  ServiceUnlock,
  ServiceOverview,
  AdapterStoppedDetail,
  AdapterNotConnectedDetail,
  AdapterUpdateDetail,
  ScreensaverOptions,
  RelaisOption,
  DeviceOption,
  NetworkOption
];
const systemNavigation = [
  {
    name: "///service",
    //main ist die erste Seite
    page: "///unlock",
    left: { single: "main" }
    // Die 4 bezieht sich auf den name: 4
    //right: { single: 'alarm1', double: '2' },
  },
  {
    name: "///Overview",
    //main ist die erste Seite
    page: "///Overview",
    right: { double: "main" },
    // Die 4 bezieht sich auf den name: 4
    optional: "notifications"
    //right: { single: 'abfall1', double: 'main' },
  },
  {
    name: "///Adapter-Info",
    //main ist die erste Seite
    page: "///Adapter-Info",
    left: { double: "///Overview" }
    // Die 4 bezieht sich auf den name: 4
    //right: { single: 'abfall1', double: 'main' },
  },
  {
    name: "///AdapterStoppedDetail",
    //main ist die erste Seite
    page: "///AdapterStoppedDetail",
    left: { double: "///Adapter-Info" }
    // Die 4 bezieht sich auf den name: 4
    //right: { single: 'abfall1', double: 'main' },
  },
  {
    name: "///AdapterNotConnectedDetail",
    //main ist die erste Seite
    page: "///AdapterNotConnectedDetail",
    left: { double: "///Adapter-Info" }
    // Die 4 bezieht sich auf den name: 4
    //right: { single: 'abfall1', double: 'main' },
  },
  {
    name: "///AdapterUpdate",
    //main ist die erste Seite
    page: "///AdapterUpdate",
    left: { double: "///Adapter-Info" }
    // Die 4 bezieht sich auf den name: 4
    //right: { single: 'abfall1', double: 'main' },
  },
  {
    name: "///ScreensaverOptions",
    //main ist die erste Seite
    page: "///ScreensaverOptions",
    left: { double: "///Overview" }
    // Die 4 bezieht sich auf den name: 4
    //right: { single: 'abfall1', double: 'main' },
  },
  {
    name: "///RelaisOption",
    //main ist die erste Seite
    page: "///RelaisOption",
    left: { double: "///Overview" }
    // Die 4 bezieht sich auf den name: 4
    //right: { single: 'abfall1', double: 'main' },
  },
  {
    name: "///DeviceOption",
    //main ist die erste Seite
    page: "///DeviceOption",
    left: { double: "///Overview" }
    // Die 4 bezieht sich auf den name: 4
    //right: { single: 'abfall1', double: 'main' },
  },
  {
    name: "///NetworkOption",
    //main ist die erste Seite
    page: "///NetworkOption",
    left: { double: "///Overview" }
    // Die 4 bezieht sich auf den name: 4
    //right: { single: 'abfall1', double: 'main' },
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  systemNavigation,
  systemPages
});
//# sourceMappingURL=system-templates.js.map
