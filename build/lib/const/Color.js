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
var Color_exports = {};
__export(Color_exports, {
  BatteryEmpty: () => BatteryEmpty,
  BatteryFull: () => BatteryFull,
  Black: () => Black,
  Blue: () => Blue,
  ColorToHex: () => ColorToHex,
  ConvertHexToRgb: () => ConvertHexToRgb,
  ConvertRGBtoHex: () => ConvertRGBtoHex,
  ConvertWithColordtoRgb: () => ConvertWithColordtoRgb,
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
  darken: () => darken,
  decToRgb: () => decToRgb,
  getHue: () => getHue,
  hsv2RGB: () => hsv2RGB,
  hsv2rgb: () => hsv2rgb,
  hsvtodec: () => hsvtodec,
  isOldRGB: () => isOldRGB,
  isRGB: () => isRGB,
  kelvinToRGB: () => kelvinToRGB,
  pos_to_color: () => pos_to_color,
  rad2deg: () => rad2deg,
  resultToRgb: () => resultToRgb,
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
var import_colord = require("colord");
var import_names = __toESM(require("colord/plugins/names"));
(0, import_colord.extend)([import_names.default]);
const HMIOff = { r: 68, g: 115, b: 158 };
const HMIOn = { r: 3, g: 169, b: 244 };
const HMIDark = { r: 29, g: 29, b: 29 };
const Off = { r: 253, g: 128, b: 0 };
const On = { r: 253, g: 216, b: 53 };
const MSRed = { r: 251, g: 105, b: 98 };
const MSYellow = { r: 255, g: 235, b: 156 };
const MSGreen = { r: 121, g: 222, b: 121 };
const Red = { r: 255, g: 0, b: 0 };
const White = { r: 255, g: 255, b: 255 };
const Yellow = { r: 255, g: 255, b: 0 };
const Green = { r: 0, g: 255, b: 0 };
const Blue = { r: 0, g: 0, b: 255 };
const DarkBlue = { r: 0, g: 0, b: 136 };
const Gray = { r: 136, g: 136, b: 136 };
const Black = { r: 0, g: 0, b: 0 };
const Cyan = { r: 0, g: 255, b: 255 };
const Magenta = { r: 255, g: 0, b: 255 };
const colorSpotify = { r: 30, g: 215, b: 96 };
const colorAlexa = { r: 49, g: 196, b: 243 };
const colorSonos = { r: 216, g: 161, b: 88 };
const colorRadio = { r: 255, g: 127, b: 0 };
const BatteryFull = { r: 96, g: 176, b: 62 };
const BatteryEmpty = { r: 179, g: 45, b: 25 };
const Menu = { r: 150, g: 150, b: 100 };
const MenuLowInd = { r: 255, g: 235, b: 156 };
const MenuHighInd = { r: 251, g: 105, b: 98 };
const colorScale0 = { r: 99, g: 190, b: 123 };
const colorScale1 = { r: 129, g: 199, b: 126 };
const colorScale2 = { r: 161, g: 208, b: 127 };
const colorScale3 = { r: 129, g: 217, b: 126 };
const colorScale4 = { r: 222, g: 226, b: 131 };
const colorScale5 = { r: 254, g: 235, b: 132 };
const colorScale6 = { r: 255, g: 210, b: 129 };
const colorScale7 = { r: 251, g: 185, b: 124 };
const colorScale8 = { r: 251, g: 158, b: 117 };
const colorScale9 = { r: 248, g: 131, b: 111 };
const colorScale10 = { r: 248, g: 105, b: 107 };
const scbackground = { r: 0, g: 0, b: 0 };
const scbackgroundInd1 = { r: 255, g: 0, b: 0 };
const scbackgroundInd2 = { r: 121, g: 222, b: 121 };
const scbackgroundInd3 = { r: 255, g: 255, b: 0 };
const sctime = { r: 255, g: 255, b: 255 };
const sctimeAMPM = { r: 255, g: 255, b: 255 };
const scdate = { r: 255, g: 255, b: 255 };
const sctMainIcon = { r: 255, g: 255, b: 255 };
const sctMainText = { r: 255, g: 255, b: 255 };
const sctForecast1 = { r: 255, g: 255, b: 255 };
const sctForecast2 = { r: 255, g: 255, b: 255 };
const sctForecast3 = { r: 255, g: 255, b: 255 };
const sctForecast4 = { r: 255, g: 255, b: 255 };
const sctF1Icon = { r: 255, g: 235, b: 156 };
const sctF2Icon = { r: 255, g: 235, b: 156 };
const sctF3Icon = { r: 255, g: 235, b: 156 };
const sctF4Icon = { r: 255, g: 235, b: 156 };
const sctForecast1Val = { r: 255, g: 255, b: 255 };
const sctForecast2Val = { r: 255, g: 255, b: 255 };
const sctForecast3Val = { r: 255, g: 255, b: 255 };
const sctForecast4Val = { r: 255, g: 255, b: 255 };
const scbar = { r: 255, g: 255, b: 255 };
const sctMainIconAlt = { r: 255, g: 255, b: 255 };
const sctMainTextAlt = { r: 255, g: 255, b: 255 };
const sctTimeAdd = { r: 255, g: 255, b: 255 };
const swClearNight = { r: 150, g: 150, b: 100 };
const swCloudy = { r: 75, g: 75, b: 75 };
const swExceptional = { r: 255, g: 50, b: 50 };
const swFog = { r: 150, g: 150, b: 150 };
const swHail = { r: 200, g: 200, b: 200 };
const swLightning = { r: 200, g: 200, b: 0 };
const swLightningRainy = { r: 200, g: 200, b: 150 };
const swPartlycloudy = { r: 150, g: 150, b: 150 };
const swPouring = { r: 50, g: 50, b: 255 };
const swRainy = { r: 100, g: 100, b: 255 };
const swSnowy = { r: 150, g: 150, b: 150 };
const swSnowyRainy = { r: 150, g: 150, b: 255 };
const swSunny = { r: 255, g: 255, b: 0 };
const swWindy = { r: 150, g: 150, b: 150 };
function rgb_dec565(rgb) {
  return rgb.r >> 3 << 11 | rgb.g >> 2 << 5 | rgb.b >> 3;
}
function decToRgb(decimal) {
  return {
    r: decimal >> 11 << 3 & 255,
    g: decimal >> 5 << 2 & 255,
    b: decimal << 3 & 255
  };
}
function rgbHexToObject(rgb) {
  const result = { r: 0, g: 0, b: 0 };
  if (rgb.startsWith("#") && rgb.length == 7) {
    result.r = parseInt(rgb.substring(1, 3), 16);
    result.g = parseInt(rgb.substring(3, 5), 16);
    result.b = parseInt(rgb.substring(5), 16);
  }
  return result;
}
function scale(number, inMax, inMin, outMin, outMax) {
  if (inMin === null || inMax === null)
    return number;
  return outMax + outMin - ((number - inMax) * (outMax - outMin) / (inMin - inMax) + outMin);
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
  const r = InterpolateNum(color1.r, color2.r, fraction);
  const g = InterpolateNum(color1.g, color2.g, fraction);
  const b = InterpolateNum(color1.b, color2.b, fraction);
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}
function InterpolateNum(d1, d2, fraction) {
  return d1 + (d2 - d1) * fraction;
}
function darken(c, s) {
  s = scale(s, 0, 1, 0, 0.6);
  return (0, import_colord.colord)(c).darken(s).toRgb();
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
function ConvertWithColordtoRgb(colorName) {
  return (0, import_colord.colord)(colorName).toRgb();
}
function ConvertHexToRgb(hex) {
  return {
    r: parseInt(hex.substring(1, 3), 16),
    g: parseInt(hex.substring(3, 5), 16),
    b: parseInt(hex.substring(5, 7), 16)
  };
}
function hsv2rgb(hue, saturation, value) {
  hue /= 60;
  const chroma = value * saturation;
  const x = chroma * (1 - Math.abs(hue % 2 - 1));
  const rgb = hue <= 1 ? [chroma, x, 0] : hue <= 2 ? [x, chroma, 0] : hue <= 3 ? [0, chroma, x] : hue <= 4 ? [0, x, chroma] : hue <= 5 ? [x, 0, chroma] : [chroma, 0, x];
  return rgb.map((v) => (v + value - chroma) * 255);
}
function hsv2RGB(hue, saturation, value) {
  const arr = hsv2rgb(hue, saturation, value);
  return { r: arr[0], g: arr[1], b: arr[2] };
}
function hsvtodec(hue, saturation, value) {
  if (hue === null)
    return null;
  const result = hsv2rgb(hue, saturation, value);
  return String(rgb_dec565({ r: result[0], g: result[1], b: result[2] }));
}
function resultToRgb(r) {
  const arr = r.split("|");
  return pos_to_color(parseInt(arr[0]), parseInt(arr[1]));
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
  return { r: Math.round(rgb[0]), g: Math.round(rgb[1]), b: Math.round(rgb[2]) };
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
  return typeof F == "object" && "r" in F && "b" in F && "g" in F;
}
function isOldRGB(F) {
  return typeof F == "object" && "r" in F && "b" in F && "g" in F;
}
const kelvinToRGB = {
  1e3: { r: 255, g: 56, b: 0 },
  1100: { r: 255, g: 71, b: 0 },
  1200: { r: 255, g: 83, b: 0 },
  1300: { r: 255, g: 93, b: 0 },
  1400: { r: 255, g: 101, b: 0 },
  1500: { r: 255, g: 109, b: 0 },
  1600: { r: 255, g: 115, b: 0 },
  1700: { r: 255, g: 121, b: 0 },
  1800: { r: 255, g: 126, b: 0 },
  1900: { r: 255, g: 131, b: 0 },
  2e3: { r: 255, g: 138, b: 18 },
  2100: { r: 255, g: 142, b: 33 },
  2200: { r: 255, g: 147, b: 44 },
  2300: { r: 255, g: 152, b: 54 },
  2400: { r: 255, g: 157, b: 63 },
  2500: { r: 255, g: 161, b: 72 },
  2600: { r: 255, g: 165, b: 79 },
  2700: { r: 255, g: 169, b: 87 },
  2800: { r: 255, g: 173, b: 94 },
  2900: { r: 255, g: 177, b: 101 },
  3e3: { r: 255, g: 180, b: 107 },
  3100: { r: 255, g: 184, b: 114 },
  3200: { r: 255, g: 187, b: 120 },
  3300: { r: 255, g: 190, b: 126 },
  3400: { r: 255, g: 193, b: 132 },
  3500: { r: 255, g: 196, b: 137 },
  3600: { r: 255, g: 199, b: 143 },
  3700: { r: 255, g: 201, b: 148 },
  3800: { r: 255, g: 204, b: 153 },
  3900: { r: 255, g: 206, b: 159 },
  4e3: { r: 255, g: 209, b: 163 },
  4100: { r: 255, g: 211, b: 168 },
  4200: { r: 255, g: 213, b: 173 },
  4300: { r: 255, g: 215, b: 177 },
  4400: { r: 255, g: 217, b: 182 },
  4500: { r: 255, g: 219, b: 186 },
  4600: { r: 255, g: 221, b: 190 },
  4700: { r: 255, g: 223, b: 194 },
  4800: { r: 255, g: 225, b: 198 },
  4900: { r: 255, g: 227, b: 202 },
  5e3: { r: 255, g: 228, b: 206 },
  5100: { r: 255, g: 230, b: 210 },
  5200: { r: 255, g: 232, b: 213 },
  5300: { r: 255, g: 233, b: 217 },
  5400: { r: 255, g: 235, b: 220 },
  5500: { r: 255, g: 236, b: 224 },
  5600: { r: 255, g: 238, b: 227 },
  5700: { r: 255, g: 239, b: 230 },
  5800: { r: 255, g: 240, b: 233 },
  5900: { r: 255, g: 242, b: 236 },
  6e3: { r: 255, g: 243, b: 239 },
  6100: { r: 255, g: 244, b: 242 },
  6200: { r: 255, g: 245, b: 245 },
  6300: { r: 255, g: 246, b: 247 },
  6400: { r: 255, g: 248, b: 251 },
  6500: { r: 255, g: 249, b: 253 },
  6600: { r: 254, g: 249, b: 255 },
  6700: { r: 252, g: 247, b: 255 },
  6800: { r: 249, g: 246, b: 255 },
  6900: { r: 247, g: 245, b: 255 },
  7e3: { r: 245, g: 243, b: 255 },
  7100: { r: 243, g: 242, b: 255 },
  7200: { r: 240, g: 241, b: 255 },
  7300: { r: 239, g: 240, b: 255 },
  7400: { r: 237, g: 239, b: 255 },
  7500: { r: 235, g: 238, b: 255 },
  7600: { r: 233, g: 237, b: 255 },
  7700: { r: 231, g: 236, b: 255 },
  7800: { r: 230, g: 235, b: 255 },
  7900: { r: 228, g: 234, b: 255 },
  8e3: { r: 227, g: 233, b: 255 },
  8100: { r: 225, g: 232, b: 255 },
  8200: { r: 224, g: 231, b: 255 },
  8300: { r: 222, g: 230, b: 255 },
  8400: { r: 221, g: 230, b: 255 },
  8500: { r: 220, g: 229, b: 255 },
  8600: { r: 218, g: 229, b: 255 },
  8700: { r: 217, g: 227, b: 255 },
  8800: { r: 216, g: 227, b: 255 },
  8900: { r: 215, g: 226, b: 255 },
  9e3: { r: 214, g: 225, b: 255 },
  9100: { r: 212, g: 225, b: 255 },
  9200: { r: 211, g: 224, b: 255 },
  9300: { r: 210, g: 223, b: 255 },
  9400: { r: 209, g: 223, b: 255 },
  9500: { r: 208, g: 222, b: 255 },
  9600: { r: 207, g: 221, b: 255 },
  9700: { r: 207, g: 221, b: 255 },
  9800: { r: 206, g: 220, b: 255 },
  9900: { r: 205, g: 220, b: 255 },
  1e4: { r: 207, g: 218, b: 255 },
  10100: { r: 207, g: 218, b: 255 },
  10200: { r: 206, g: 217, b: 255 },
  10300: { r: 205, g: 217, b: 255 },
  10400: { r: 204, g: 216, b: 255 },
  10500: { r: 204, g: 216, b: 255 },
  10600: { r: 203, g: 215, b: 255 },
  10700: { r: 202, g: 215, b: 255 },
  10800: { r: 202, g: 214, b: 255 },
  10900: { r: 201, g: 214, b: 255 },
  11e3: { r: 200, g: 213, b: 255 },
  11100: { r: 200, g: 213, b: 255 },
  11200: { r: 199, g: 212, b: 255 },
  11300: { r: 198, g: 212, b: 255 },
  11400: { r: 198, g: 212, b: 255 },
  11500: { r: 197, g: 211, b: 255 },
  11600: { r: 197, g: 211, b: 255 },
  11700: { r: 197, g: 210, b: 255 },
  11800: { r: 196, g: 210, b: 255 },
  11900: { r: 195, g: 210, b: 255 },
  12e3: { r: 195, g: 209, b: 255 }
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
  ConvertWithColordtoRgb,
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
  darken,
  decToRgb,
  getHue,
  hsv2RGB,
  hsv2rgb,
  hsvtodec,
  isOldRGB,
  isRGB,
  kelvinToRGB,
  pos_to_color,
  rad2deg,
  resultToRgb,
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
