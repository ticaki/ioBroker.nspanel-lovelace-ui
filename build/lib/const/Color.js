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
var Color_exports = {};
__export(Color_exports, {
  BatteryEmpty: () => BatteryEmpty,
  BatteryFull: () => BatteryFull,
  Black: () => Black,
  Blue: () => Blue,
  ColorToHex: () => ColorToHex,
  ConvertHexToRgb: () => ConvertHexToRgb,
  ConvertRGBtoHex: () => ConvertRGBtoHex,
  Cyan: () => Cyan,
  DarkBlue: () => DarkBlue,
  Gray: () => Gray,
  Green: () => Green,
  HMIDark: () => HMIDark,
  HMIOff: () => HMIOff,
  HMIOn: () => HMIOn,
  HandleColorScale: () => HandleColorScale,
  Interpolate: () => Interpolate,
  InterpolateNum: () => InterpolateNum,
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
  getDecfromRGBThree: () => getDecfromRGBThree,
  getHue: () => getHue,
  hsv2rgb: () => hsv2rgb,
  hsvtodec: () => hsvtodec,
  isRGB: () => isRGB,
  pos_to_color: () => pos_to_color,
  rad2deg: () => rad2deg,
  rgbHexToObject: () => rgbHexToObject,
  rgb_dec565: () => rgb_dec565,
  rgb_to_cie: () => rgb_to_cie,
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
module.exports = __toCommonJS(Color_exports);
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
  if (inMin === null || inMax === null)
    return number;
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
function Interpolate(color1, color2, fraction) {
  const r = InterpolateNum(color1.red, color2.red, fraction);
  const g = InterpolateNum(color1.green, color2.green, fraction);
  const b = InterpolateNum(color1.blue, color2.blue, fraction);
  return { red: Math.round(r), green: Math.round(g), blue: Math.round(b) };
}
function InterpolateNum(d1, d2, fraction) {
  return d1 + (d2 - d1) * fraction;
}
function rad2deg(rad) {
  return (360 + 180 * rad / Math.PI) % 360;
}
function ColorToHex(color) {
  const hexadecimal = color.toString(16);
  return hexadecimal.length == 1 ? "0" + hexadecimal : hexadecimal;
}
function ConvertRGBtoHex(red, green, blue) {
  return "#" + ColorToHex(red) + ColorToHex(green) + ColorToHex(blue);
}
function ConvertHexToRgb(hex) {
  return {
    red: parseInt(hex.substring(1, 3), 16),
    green: parseInt(hex.substring(3, 5), 16),
    blue: parseInt(hex.substring(5, 7), 16)
  };
}
function hsv2rgb(hue, saturation, value) {
  hue /= 60;
  const chroma = value * saturation;
  const x = chroma * (1 - Math.abs(hue % 2 - 1));
  const rgb = hue <= 1 ? [chroma, x, 0] : hue <= 2 ? [x, chroma, 0] : hue <= 3 ? [0, chroma, x] : hue <= 4 ? [0, x, chroma] : hue <= 5 ? [x, 0, chroma] : [chroma, 0, x];
  return rgb.map((v) => (v + value - chroma) * 255);
}
function hsvtodec(hue, saturation, value) {
  if (hue === null)
    return null;
  const result = hsv2rgb(hue, saturation, value);
  return String(rgb_dec565({ red: result[0], green: result[1], blue: result[2] }));
}
function getHue(red, green, blue) {
  const min = Math.min(Math.min(red, green), blue);
  const max = Math.max(Math.max(red, green), blue);
  if (min == max) {
    return 0;
  }
  let hue = 0;
  if (max == red) {
    hue = (green - blue) / (max - min);
  } else if (max == green) {
    hue = 2 + (blue - red) / (max - min);
  } else {
    hue = 4 + (red - green) / (max - min);
  }
  hue = hue * 60;
  if (hue < 0)
    hue = hue + 360;
  return Math.round(hue);
}
function pos_to_color(x, y) {
  let r = 160 / 2;
  x = Math.round((x - r) / r * 100) / 100;
  y = Math.round((r - y) / r * 100) / 100;
  r = Math.sqrt(x * x + y * y);
  let sat = 0;
  if (r > 1) {
    sat = 0;
  } else {
    sat = r;
  }
  const hsv = rad2deg(Math.atan2(y, x));
  const rgb = hsv2rgb(hsv, sat, 1);
  return { red: Math.round(rgb[0]), green: Math.round(rgb[1]), blue: Math.round(rgb[2]) };
}
function rgb_to_cie(red, green, blue) {
  const vred = red > 0.04045 ? Math.pow((red + 0.055) / (1 + 0.055), 2.4) : red / 12.92;
  const vgreen = green > 0.04045 ? Math.pow((green + 0.055) / (1 + 0.055), 2.4) : green / 12.92;
  const vblue = blue > 0.04045 ? Math.pow((blue + 0.055) / (1 + 0.055), 2.4) : blue / 12.92;
  const X = vred * 0.664511 + vgreen * 0.154324 + vblue * 0.162028;
  const Y = vred * 0.283881 + vgreen * 0.668433 + vblue * 0.047685;
  const Z = vred * 88e-6 + vgreen * 0.07231 + vblue * 0.986039;
  const ciex = (X / (X + Y + Z)).toFixed(4);
  const ciey = (Y / (X + Y + Z)).toFixed(4);
  const cie = "[" + ciex + "," + ciey + "]";
  return cie;
}
function isRGB(F) {
  return typeof F == "object" && "red" in F && "blue" in F && "green" in F;
}
const getDecfromRGBThree = async (item) => {
  var _a, _b, _c;
  if (!item)
    return String(rgb_dec565(White));
  const red = (_a = item.data.red && await item.data.red.getNumber()) != null ? _a : -1;
  const green = (_b = item.data.red && await item.data.red.getNumber()) != null ? _b : -1;
  const blue = (_c = item.data.red && await item.data.red.getNumber()) != null ? _c : -1;
  if (red === -1 || blue === -1 || green === -1)
    return null;
  return String(rgb_dec565({ red, green, blue }));
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BatteryEmpty,
  BatteryFull,
  Black,
  Blue,
  ColorToHex,
  ConvertHexToRgb,
  ConvertRGBtoHex,
  Cyan,
  DarkBlue,
  Gray,
  Green,
  HMIDark,
  HMIOff,
  HMIOn,
  HandleColorScale,
  Interpolate,
  InterpolateNum,
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
  getDecfromRGBThree,
  getHue,
  hsv2rgb,
  hsvtodec,
  isRGB,
  pos_to_color,
  rad2deg,
  rgbHexToObject,
  rgb_dec565,
  rgb_to_cie,
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
//# sourceMappingURL=Color.js.map
