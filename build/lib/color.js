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
var color_exports = {};
__export(color_exports, {
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
  HandleColorScale: () => HandleColorScale,
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
  rgbHexToObject: () => rgbHexToObject,
  rgb_dec565: () => rgb_dec565,
  scale: () => scale,
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
module.exports = __toCommonJS(color_exports);
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
function rgb_dec565(rgb) {
  return rgb.red >> 3 << 11 | rgb.green >> 2 << 5 | rgb.blue >> 3;
}
function rgbHexToObject(rgb) {
  const result = { red: 0, green: 0, blue: 0 };
  if (rgb.startsWith("#") && rgb.length == 7) {
    result.red = parseInt(rgb.substring(1, 3), 16);
    result.green = parseInt(rgb.substring(3, 5), 16);
    result.blue = parseInt(rgb.substring(5), 16);
  }
  return result;
}
function scale(number, inMin, inMax, outMin, outMax) {
  return outMax + outMin - ((number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);
}
function HandleColorScale(valueScaletemp) {
  switch (valueScaletemp) {
    case "0":
      return rgb_dec565(colorScale0);
    case "1":
      return rgb_dec565(colorScale1);
    case "2":
      return rgb_dec565(colorScale2);
    case "3":
      return rgb_dec565(colorScale3);
    case "4":
      return rgb_dec565(colorScale4);
    case "5":
      return rgb_dec565(colorScale5);
    case "6":
      return rgb_dec565(colorScale6);
    case "7":
      return rgb_dec565(colorScale7);
    case "8":
      return rgb_dec565(colorScale8);
    case "9":
      return rgb_dec565(colorScale9);
    case "10":
      return rgb_dec565(colorScale10);
    default:
      return rgb_dec565(colorScale10);
  }
}
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
  HandleColorScale,
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
  rgbHexToObject,
  rgb_dec565,
  scale,
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
//# sourceMappingURL=color.js.map
