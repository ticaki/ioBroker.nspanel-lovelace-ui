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
var test_exports = {};
__export(test_exports, {
  testScriptConfig: () => testScriptConfig
});
module.exports = __toCommonJS(test_exports);
const testScriptConfig = {
  panelTopic: "test/123456",
  weatherEntity: "brightsky.0.",
  defaultOffColor: { red: 253, green: 128, blue: 0 },
  defaultOnColor: { red: 253, green: 216, blue: 53 },
  defaultBackgroundColor: { red: 29, green: 29, blue: 29 },
  weatherAddDefaultItems: {
    forecastDay1: true,
    sunriseSet: true,
    windSpeed: true,
    windGust: true,
    windDirection: true,
    forecastDay2: true,
    solar: true
  },
  pages: [
    {
      type: "cardGrid2",
      uniqueName: "main",
      heading: "Wohnzimmer",
      useColor: true,
      items: [
        {
          id: "0_userdata.0.Einzelne_Ger\xE4te.Info",
          name: "Gartenhaus",
          icon: "storefront-outline",
          onColor: { red: 150, green: 150, blue: 100 },
          navigate: true,
          targetPage: "grid1"
        },
        { id: "alias.0.NSPanel.allgemein.shutterOnly", name: "2" },
        { id: "alias.0.Licht.lights.Ger\xE4t_1", name: "3" },
        { id: "alias.0.Licht.lights.Ger\xE4t_2", name: "4" }
      ]
    },
    {
      uniqueName: "grid1",
      heading: "Grid 1",
      items: [
        {
          id: "0_userdata.0.Einzelne_Ger\xE4te.Info",
          name: "Gartenhaus",
          icon: "storefront-outline",
          onColor: { red: 150, green: 150, blue: 100 },
          navigate: true,
          targetPage: "grid1"
        },
        { id: "alias.0.NSPanel.allgemein.shutterOnly", name: "2" },
        { id: "alias.0.Licht.lights.Ger\xE4t_1", name: "3" },
        { id: "alias.0.Licht.lights.Ger\xE4t_2", name: "4" }
      ],
      type: "cardGrid",
      hiddenByTrigger: true,
      useColor: true
    }
  ],
  subPages: [],
  favoritScreensaverEntity: [
    {
      type: "template",
      template: "text.openweathermap.favorit",
      dpInit: "/^openweathermap\\.0.+/",
      modeScr: "favorit"
    }
  ],
  alternateScreensaverEntity: [],
  indicatorScreensaverEntity: [
    {
      type: "script",
      ScreensaverEntity: "alias.0.NSPanel.allgemein.Status_offene_Fenster.ACTUAL",
      ScreensaverEntityFactor: 1,
      ScreensaverEntityDecimalPlaces: 0,
      ScreensaverEntityIconOn: "window-open-variant",
      ScreensaverEntityIconOff: "window-closed-variant",
      ScreensaverEntityText: "Fenster",
      ScreensaverEntityUnitText: "%",
      ScreensaverEntityIconColor: { val_min: 0, val_max: 1 }
    },
    {
      type: "script",
      ScreensaverEntity: "alias.0.NSPanel.allgemein.Status_offene_Tuer.ACTUAL",
      ScreensaverEntityFactor: 1,
      ScreensaverEntityDecimalPlaces: 0,
      ScreensaverEntityIconOn: "door-open",
      ScreensaverEntityIconOff: "door-closed",
      ScreensaverEntityText: "T\xFCr",
      ScreensaverEntityUnitText: "",
      ScreensaverEntityIconColor: { val_min: 0, val_max: 1 }
    },
    {
      type: "script",
      ScreensaverEntity: "alias.0.NSPanel.allgemein.Status_Licht_An.ACTUAL",
      ScreensaverEntityFactor: 1,
      ScreensaverEntityDecimalPlaces: 0,
      ScreensaverEntityIconOn: "lightbulb",
      ScreensaverEntityIconOff: null,
      ScreensaverEntityText: "Licht",
      ScreensaverEntityUnitText: "",
      ScreensaverEntityIconColor: { val_min: 0, val_max: 1 }
    },
    {
      type: "script",
      ScreensaverEntity: "alias.0.T\xFCrschloss.ACTUAL",
      ScreensaverEntityFactor: 1,
      ScreensaverEntityDecimalPlaces: 0,
      ScreensaverEntityIconOn: "lock",
      ScreensaverEntityIconOff: "lock-open",
      ScreensaverEntityText: "T\xFCrschloss",
      ScreensaverEntityUnitText: "",
      ScreensaverEntityIconColor: { val_min: 0, val_max: 1, val_best: 1 }
    },
    {
      type: "script",
      ScreensaverEntity: "alias.0.NSPanel.allgemein.Auto.Safety.ACTUAL",
      ScreensaverEntityFactor: 1,
      ScreensaverEntityDecimalPlaces: 0,
      ScreensaverEntityIconOn: "car-key",
      ScreensaverEntityIconOff: null,
      ScreensaverEntityText: "Auto",
      ScreensaverEntityUnitText: "",
      ScreensaverEntityIconColor: { val_min: 0, val_max: 1, val_best: 1 }
    }
  ],
  bottomScreensaverEntity: [],
  leftScreensaverEntity: [
    {
      type: "script",
      ScreensaverEntity: "alias.0.NSPanel.Flur.Sensor.ANALOG.Temperature.ACTUAL",
      ScreensaverEntityFactor: 1,
      ScreensaverEntityDecimalPlaces: 1,
      ScreensaverEntityIconOn: "thermometer",
      ScreensaverEntityIconOff: null,
      ScreensaverEntityText: "Temperatur",
      ScreensaverEntityUnitText: "\xB0C",
      ScreensaverEntityIconColor: { val_min: 0, val_max: 35, val_best: 22 }
    },
    {
      type: "script",
      ScreensaverEntity: "alias.0.Heizung.W\xE4rmeTagesVerbrauch.ACTUAL",
      ScreensaverEntityFactor: 1,
      ScreensaverEntityDecimalPlaces: 1,
      ScreensaverEntityIconOn: "counter",
      ScreensaverEntityIconOff: null,
      ScreensaverEntityText: "W\xE4rme",
      ScreensaverEntityUnitText: " kWh",
      ScreensaverEntityIconColor: { red: 255, green: 235, blue: 156 }
    },
    {
      type: "script",
      ScreensaverEntity: "alias.0.NSPanel.allgemein.Abfall.event1.INFO",
      ScreensaverEntityFactor: 1,
      ScreensaverEntityDecimalPlaces: 0,
      ScreensaverEntityDateFormat: { year: "numeric", month: "2-digit", day: "2-digit" },
      ScreensaverEntityIconOn: "trash-can",
      ScreensaverEntityIconOff: null,
      ScreensaverEntityText: "Abfall",
      ScreensaverEntityUnitText: "",
      ScreensaverEntityIconColor: "0_userdata.0.Abfallkalender.1.color"
    }
  ],
  mrIcon1ScreensaverEntity: {
    type: "script",
    ScreensaverEntity: "Relay.1",
    ScreensaverEntityIconOn: "lightbulb",
    ScreensaverEntityIconOff: null,
    ScreensaverEntityValue: null,
    ScreensaverEntityValueDecimalPlace: 0,
    ScreensaverEntityValueUnit: null,
    ScreensaverEntityOnColor: { red: 253, green: 216, blue: 53 },
    ScreensaverEntityOffColor: { red: 68, green: 115, blue: 158 }
  },
  mrIcon2ScreensaverEntity: {
    type: "script",
    ScreensaverEntity: "Relay.2",
    ScreensaverEntityIconOn: "lightbulb",
    ScreensaverEntityIconOff: null,
    ScreensaverEntityValue: null,
    ScreensaverEntityValueDecimalPlace: 0,
    ScreensaverEntityValueUnit: null,
    ScreensaverEntityOnColor: { red: 253, green: 216, blue: 53 },
    ScreensaverEntityOffColor: { red: 68, green: 115, blue: 158 }
  },
  buttonLeft: { mode: "page", page: "main" },
  buttonRight: null,
  version: "0.10.11"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  testScriptConfig
});
//# sourceMappingURL=test.js.map
