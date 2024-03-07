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
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var system_templates_exports = {};
__export(system_templates_exports, {
  systemNavigation: () => systemNavigation,
  systemTemplates: () => systemTemplates
});
module.exports = __toCommonJS(system_templates_exports);
var Color = __toESM(require("./Color"));
const popupWelcome = {
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///WelcomePopup",
  config: {
    card: "popupNotify",
    data: {
      entity1: { value: { type: "state", dp: "0_userdata.0.example_state" } },
      headline: { type: "const", constVal: "welcomeHToken" },
      colorHeadline: { true: { color: { type: "const", constVal: Color.Green } } },
      buttonLeft: { type: "const", constVal: "" },
      colorButtonLeft: { true: { color: { type: "const", constVal: Color.White } } },
      buttonRight: { type: "const", constVal: "" },
      colorButtonRight: { true: { color: { type: "const", constVal: Color.White } } },
      text: { type: "const", constVal: "welcomeTToken" },
      // text: { type: 'const', constVal: 'Text Test ${pl}' },
      colorText: { true: { color: { type: "const", constVal: Color.White } } },
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
      colorHeadline: { true: { color: { type: "const", constVal: Color.Green } } },
      buttonLeft: { type: "const", constVal: "nextF" },
      colorButtonLeft: { true: { color: { type: "const", constVal: Color.White } } },
      buttonRight: { type: "const", constVal: "ok" },
      colorButtonRight: { true: { color: { type: "const", constVal: Color.White } } },
      text: { type: "internal", dp: "cmd/popupNotification", read: "return JSON.parse(val).text" },
      // text: { type: 'const', constVal: 'Text Test ${pl}' },
      colorText: { true: { color: { type: "const", constVal: Color.White } } },
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
      colorHeadline: { true: { color: { type: "const", constVal: Color.Green } } },
      buttonLeft: { type: "const", constVal: "nextF" },
      colorButtonLeft: { true: { color: { type: "const", constVal: Color.White } } },
      buttonRight: { type: "const", constVal: "ok" },
      colorButtonRight: { true: { color: { type: "const", constVal: Color.Green } } },
      text: { type: "internal", dp: "cmd/popupNotification2", read: "return JSON.parse(val).text" },
      // text: { type: 'const', constVal: 'Text Test ${pl}' },
      colorText: { true: { color: { type: "const", constVal: Color.White } } },
      timeout: { type: "const", constVal: 0 },
      setValue1: { type: "internalState", dp: "cmd/NotificationCleared2" },
      setValue2: { type: "internalState", dp: "cmd/NotificationNext2" },
      closingBehaviour: { type: "const", constVal: "none" }
    }
  },
  pageItems: [],
  items: void 0
};
const pageAdapterInformation = {
  //type: 'sonstiges',
  //card: 'cardEntities',
  dpInit: "",
  alwaysOn: "none",
  uniqueID: "///adapter-info",
  useColor: false,
  config: {
    card: "cardEntities",
    data: {
      headline: {
        type: "const",
        constVal: "Adapter-Information"
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
    }
  ],
  items: void 0
};
const pageServiceUnlock = {
  //card: 'cardAlarm',
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
      pin: { type: "const", constVal: "" },
      setNavi: { type: "const", constVal: "///Overview" }
    }
  }
};
const pageGridOverview = {
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
            value: { type: "const", constVal: "power" },
            color: { type: "const", constVal: Color.Yellow }
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
        setNavi: { type: "const", constVal: "///adapter-info" }
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
const systemTemplates = [
  popupWelcome,
  popupNotification,
  popupNotification2,
  pageAdapterInformation,
  pageServiceUnlock,
  pageGridOverview,
  AdapterStoppedDetail,
  AdapterNotConnectedDetail
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
    right: { double: "main" }
    // Die 4 bezieht sich auf den name: 4
    //right: { single: 'abfall1', double: 'main' },
  },
  {
    name: "///adapter-info",
    //main ist die erste Seite
    page: "///adapter-info",
    left: { double: "///Overview" }
    // Die 4 bezieht sich auf den name: 4
    //right: { single: 'abfall1', double: 'main' },
  },
  {
    name: "///AdapterStoppedDetail",
    //main ist die erste Seite
    page: "///AdapterStoppedDetail",
    left: { double: "///adapter-info" }
    // Die 4 bezieht sich auf den name: 4
    //right: { single: 'abfall1', double: 'main' },
  },
  {
    name: "///AdapterNotConnectedDetail",
    //main ist die erste Seite
    page: "///AdapterNotConnectedDetail",
    left: { double: "///adapter-info" }
    // Die 4 bezieht sich auf den name: 4
    //right: { single: 'abfall1', double: 'main' },
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  systemNavigation,
  systemTemplates
});
//# sourceMappingURL=system-templates.js.map
