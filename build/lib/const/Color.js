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
var Color_exports = {};
__export(Color_exports, {
  Color: () => Color
});
module.exports = __toCommonJS(Color_exports);
var import_colord = require("colord");
var import_names = __toESM(require("colord/plugins/names"));
var import_mix = __toESM(require("colord/plugins/mix"));
(0, import_colord.extend)([import_names.default, import_mix.default]);
class Color {
  static HMIOff = { r: 68, g: 115, b: 158 };
  // Blue-Off - Original Entity Off
  static HMIOn = { r: 3, g: 169, b: 244 };
  // Blue-On
  static HMIDark = { r: 29, g: 29, b: 29 };
  // Original Background Color
  static Off = { r: 253, g: 128, b: 0 };
  // Orange-Off - nicer color transitions
  static On = { r: 253, g: 216, b: 53 };
  static MSRed = { r: 251, g: 105, b: 98 };
  static MSYellow = { r: 255, g: 235, b: 156 };
  static MSGreen = { r: 121, g: 222, b: 121 };
  static Red = { r: 255, g: 0, b: 0 };
  static White = { r: 255, g: 255, b: 255 };
  static Yellow = { r: 255, g: 255, b: 0 };
  static Green = { r: 0, g: 255, b: 0 };
  static Blue = { r: 0, g: 0, b: 255 };
  static DarkBlue = { r: 0, g: 0, b: 136 };
  static Gray = { r: 136, g: 136, b: 136 };
  static Black = { r: 0, g: 0, b: 0 };
  static Cyan = { r: 0, g: 255, b: 255 };
  static Magenta = { r: 255, g: 0, b: 255 };
  static colorSpotify = { r: 30, g: 215, b: 96 };
  static colorAlexa = { r: 49, g: 196, b: 243 };
  static colorSonos = { r: 216, g: 161, b: 88 };
  static colorRadio = { r: 255, g: 127, b: 0 };
  static BatteryFull = { r: 96, g: 176, b: 62 };
  static BatteryEmpty = { r: 179, g: 45, b: 25 };
  //Menu Icon Colors
  static Menu = { r: 150, g: 150, b: 100 };
  static MenuLowInd = { r: 255, g: 235, b: 156 };
  static MenuHighInd = { r: 251, g: 105, b: 98 };
  //Dynamische Indikatoren (Abstufung grün nach gelb nach rot)
  static colorScale0 = { r: 99, g: 190, b: 123 };
  static colorScale1 = { r: 129, g: 199, b: 126 };
  static colorScale2 = { r: 161, g: 208, b: 127 };
  static colorScale3 = { r: 129, g: 217, b: 126 };
  static colorScale4 = { r: 222, g: 226, b: 131 };
  static colorScale5 = { r: 254, g: 235, b: 132 };
  static colorScale6 = { r: 255, g: 210, b: 129 };
  static colorScale7 = { r: 251, g: 185, b: 124 };
  static colorScale8 = { r: 251, g: 158, b: 117 };
  static colorScale9 = { r: 248, g: 131, b: 111 };
  static colorScale10 = { r: 248, g: 105, b: 107 };
  //Screensaver Default Theme Colors
  static scbackground = { r: 0, g: 0, b: 0 };
  static scbackgroundInd1 = { r: 255, g: 0, b: 0 };
  static scbackgroundInd2 = { r: 121, g: 222, b: 121 };
  static scbackgroundInd3 = { r: 255, g: 255, b: 0 };
  static sctime = { r: 255, g: 255, b: 255 };
  static sctimeAMPM = { r: 255, g: 255, b: 255 };
  static scdate = { r: 255, g: 255, b: 255 };
  static sctMainIcon = { r: 255, g: 255, b: 255 };
  static sctMainText = { r: 255, g: 255, b: 255 };
  static sctForecast1 = { r: 255, g: 255, b: 255 };
  static sctForecast2 = { r: 255, g: 255, b: 255 };
  static sctForecast3 = { r: 255, g: 255, b: 255 };
  static sctForecast4 = { r: 255, g: 255, b: 255 };
  static sctF1Icon = { r: 255, g: 235, b: 156 };
  static sctF2Icon = { r: 255, g: 235, b: 156 };
  static sctF3Icon = { r: 255, g: 235, b: 156 };
  static sctF4Icon = { r: 255, g: 235, b: 156 };
  static sctForecast1Val = { r: 255, g: 255, b: 255 };
  static sctForecast2Val = { r: 255, g: 255, b: 255 };
  static sctForecast3Val = { r: 255, g: 255, b: 255 };
  static sctForecast4Val = { r: 255, g: 255, b: 255 };
  static scbar = { r: 255, g: 255, b: 255 };
  static sctMainIconAlt = { r: 255, g: 255, b: 255 };
  static sctMainTextAlt = { r: 255, g: 255, b: 255 };
  static sctTimeAdd = { r: 255, g: 255, b: 255 };
  //Auto-Weather-Colors
  static swClearNight = { r: 150, g: 150, b: 100 };
  static swCloudy = { r: 75, g: 75, b: 75 };
  static swExceptional = { r: 255, g: 50, b: 50 };
  static swFog = { r: 150, g: 150, b: 150 };
  static swHail = { r: 200, g: 200, b: 200 };
  static swLightning = { r: 200, g: 200, b: 0 };
  static swLightningRainy = { r: 200, g: 200, b: 150 };
  static swPartlycloudy = { r: 150, g: 150, b: 150 };
  static swPouring = { r: 50, g: 50, b: 255 };
  static swRainy = { r: 100, g: 100, b: 255 };
  static swSnowy = { r: 150, g: 150, b: 150 };
  static swSnowyRainy = { r: 150, g: 150, b: 255 };
  static swSunny = { r: 255, g: 255, b: 0 };
  static swWindy = { r: 150, g: 150, b: 150 };
  static good = "default.color.from.start.good";
  static bad = "default.color.from.start.bad";
  static true = "default.color.from.start.true";
  static false = "default.color.from.start.false";
  static activated = "default.color.from.start.activated";
  static deactivated = "default.color.from.start.deactivated";
  static attention = "default.color.from.start.attention";
  static info = "default.color.from.start.info";
  static getColorFromDefault(s) {
    if (typeof s === "string") {
      switch (s) {
        case "default.color.from.start.good":
          return Color.good;
        case "default.color.from.start.bad":
          return Color.bad;
        case "default.color.from.start.true":
          return Color.true;
        case "default.color.from.start.false":
          return Color.false;
        case "default.color.from.start.activated":
          return Color.activated;
        case "default.color.from.start.deactivated":
          return Color.deactivated;
        case "default.color.from.start.attention":
          return Color.attention;
        case "default.color.from.start.info":
          return Color.info;
      }
    }
    return s;
  }
  static currentTheme = {
    good: Color.Green,
    bad: Color.Red,
    true: Color.Green,
    false: Color.Red,
    activated: Color.Yellow,
    deactivated: Color.Gray,
    attention: Color.Cyan,
    info: Color.White
  };
  /**
   * set color theme...
   * @param s
   */
  static setTheme(s) {
    Color.good = s.good;
    Color.bad = s.bad;
    Color.true = s.true;
    Color.false = s.false;
    Color.activated = s.activated;
    Color.deactivated = s.deactivated;
    Color.attention = s.attention;
    Color.info = s.info;
  }
  static rgb_dec565(rgb) {
    return rgb.r >> 3 << 11 | rgb.g >> 2 << 5 | rgb.b >> 3;
  }
  static decToRgb(decimal) {
    return {
      r: decimal >> 11 << 3 & 255,
      g: decimal >> 5 << 2 & 255,
      b: decimal << 3 & 255
    };
  }
  static rgbHexToObject(rgb) {
    const result = { r: 0, g: 0, b: 0 };
    if (rgb.startsWith("#") && rgb.length == 7) {
      result.r = parseInt(rgb.substring(1, 3), 16);
      result.g = parseInt(rgb.substring(3, 5), 16);
      result.b = parseInt(rgb.substring(5), 16);
    }
    return result;
  }
  static scale(number, inMax, inMin, outMin, outMax) {
    if (inMin === null || inMax === null)
      return number;
    return outMax + outMin - ((number - inMax) * (outMax - outMin) / (inMin - inMax) + outMin);
  }
  static HandleColorScale(valueScaletemp) {
    switch (valueScaletemp) {
      case "0":
        return Color.rgb_dec565(Color.colorScale0);
      case "1":
        return Color.rgb_dec565(Color.colorScale1);
      case "2":
        return Color.rgb_dec565(Color.colorScale2);
      case "3":
        return Color.rgb_dec565(Color.colorScale3);
      case "4":
        return Color.rgb_dec565(Color.colorScale4);
      case "5":
        return Color.rgb_dec565(Color.colorScale5);
      case "6":
        return Color.rgb_dec565(Color.colorScale6);
      case "7":
        return Color.rgb_dec565(Color.colorScale7);
      case "8":
        return Color.rgb_dec565(Color.colorScale8);
      case "9":
        return Color.rgb_dec565(Color.colorScale9);
      case "10":
        return Color.rgb_dec565(Color.colorScale10);
      default:
        return Color.rgb_dec565(Color.colorScale10);
    }
  }
  static Interpolate(color1, color2, fraction) {
    const r = Color.InterpolateNum(color1.r, color2.r, fraction);
    const g = Color.InterpolateNum(color1.g, color2.g, fraction);
    const b = Color.InterpolateNum(color1.b, color2.b, fraction);
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  }
  /**
   *
   * @param c1 from this color
   * @param c2 to this
   * @param r 0-1 mix value
   * @returns RGB
   */
  static mixColor(c1, c2, r) {
    return (0, import_colord.colord)(c1).mix(c2, r).toRgb();
  }
  static InterpolateNum(d1, d2, fraction) {
    return d1 + (d2 - d1) * fraction;
  }
  static darken(c, s) {
    s = Color.scale(s, 0, 1, 0, 0.6);
    return (0, import_colord.colord)(c).darken(s).toRgb();
  }
  /**
   * Convert radians to degrees
   * @param rad radians to convert, expects rad in range +/- PI per Math.atan2
   * @returns {number} degrees equivalent of rad
   */
  static rad2deg(rad) {
    return (360 + 180 * rad / Math.PI) % 360;
  }
  static ColorToHex(color) {
    const hexadecimal = color.toString(16);
    return hexadecimal.length == 1 ? "0" + hexadecimal : hexadecimal;
  }
  static ConvertRGBtoHex(red, green, blue) {
    return "#" + Color.ColorToHex(red) + Color.ColorToHex(green) + Color.ColorToHex(blue);
  }
  static ConvertWithColordtoRgb(colorName) {
    return (0, import_colord.colord)(colorName).toRgb();
  }
  static ConvertHexToRgb(hex) {
    return {
      r: parseInt(hex.substring(1, 3), 16),
      g: parseInt(hex.substring(3, 5), 16),
      b: parseInt(hex.substring(5, 7), 16)
    };
  }
  /**
   * Convert h,s,v values to r,g,b
   * @param hue in range [0, 360]
   * @param saturation in range 0 to 1
   * @param value in range 0 to 1
   * @returns {[number, number, number]} [r, g,b] in range 0 to 255
   */
  static hsv2rgb(hue, saturation, value) {
    hue /= 60;
    const chroma = value * saturation;
    const x = chroma * (1 - Math.abs(hue % 2 - 1));
    const rgb = hue <= 1 ? [chroma, x, 0] : hue <= 2 ? [x, chroma, 0] : hue <= 3 ? [0, chroma, x] : hue <= 4 ? [0, x, chroma] : hue <= 5 ? [x, 0, chroma] : [chroma, 0, x];
    return rgb.map((v) => (v + value - chroma) * 255);
  }
  static hsv2RGB(hue, saturation, value) {
    const arr = Color.hsv2rgb(hue, saturation, value);
    return { r: arr[0], g: arr[1], b: arr[2] };
  }
  static hsvtodec(hue, saturation, value) {
    if (hue === null)
      return null;
    const result = Color.hsv2rgb(hue, saturation, value);
    return String(Color.rgb_dec565({ r: result[0], g: result[1], b: result[2] }));
  }
  static resultToRgb(r) {
    const arr = r.split("|");
    return Color.pos_to_color(parseInt(arr[0]), parseInt(arr[1]));
  }
  static getHue(red, green, blue) {
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
  static pos_to_color(x, y) {
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
    const hsv = Color.rad2deg(Math.atan2(y, x));
    const rgb = Color.hsv2rgb(hsv, sat, 1);
    return { r: Math.round(rgb[0]), g: Math.round(rgb[1]), b: Math.round(rgb[2]) };
  }
  /**
   *
   * @param red
   * @param green
   * @param blue
   * @returns
   */
  static rgb_to_cie(red, green, blue) {
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
  static isRGB(F) {
    return typeof F == "object" && "r" in F && "b" in F && "g" in F;
  }
  static isOldRGB(F) {
    return typeof F == "object" && "r" in F && "b" in F && "g" in F;
  }
  /*
  static getBlendedColorfunction(color: RGB | null, percent: number) {
      // limit percent between 0 and 1.
      // this percent is the amount of 'color' rgb components to use
      let p = percent > 0 ? percent : 0;
      p = p < 1 ? p : 1;
  
      // amount of 'this' rgb components to use
      const tp = 1 - p;
  
      // blend the colors
      const red = Math.round(tp * this.r + p * color.r);
      const green = Math.round(tp * this.g + p * color.g);
      const blue = Math.round(tp * this.b + p * color.b);
  
      // return new color object
      return (red, green, blue);
  } // getBlendedColor ()
  var newColor = c.getBlendedColor(new Color('#ffffff'), 0.50);*/
  static kelvinToRGB = {
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
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Color
});
//# sourceMappingURL=Color.js.map
