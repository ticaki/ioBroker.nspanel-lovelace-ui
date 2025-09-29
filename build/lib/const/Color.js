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
  Color: () => Color,
  test: () => test
});
module.exports = __toCommonJS(Color_exports);
var import_colord = require("colord");
var import_names = __toESM(require("colord/plugins/names"));
var import_mix = __toESM(require("colord/plugins/mix"));
var _a, _b, _c;
(0, import_colord.extend)([import_names.default, import_mix.default]);
function test(k) {
  return Color[k];
}
class ColorBase {
  constructor() {
  }
  static good = "default.color.from.start.good";
  static bad = "default.color.from.start.bad";
  static true = "default.color.from.start.true";
  static false = "default.color.from.start.false";
  static activated = "default.color.from.start.activated";
  static deactivated = "default.color.from.start.deactivated";
  static attention = "default.color.from.start.attention";
  static info = "default.color.from.start.info";
  static option1 = "default.color.from.start.option1";
  static option2 = "default.color.from.start.option2";
  static option3 = "default.color.from.start.option3";
  static option4 = "default.color.from.start.option4";
  static open = "default.color.from.start.open";
  static close = "default.color.from.start.close";
  static hot = "default.color.from.start.hot";
  static cold = "default.color.from.start.cold";
  static on = "default.color.from.start.on";
  static off = "default.color.from.start.off";
  static light = "default.color.from.start.light";
  static dark = "default.color.from.start.dark";
  static warning = "default.color.from.start.warning";
  static success = "default.color.from.start.success";
  static neutral = "default.color.from.start.neutral";
  static background = "default.color.from.start.background";
  static highlight = "default.color.from.start.highlight";
  static disabled = "default.color.from.start.disabled";
  // Navigation
  static navLeft = "default.color.from.start.navLeft";
  static navRight = "default.color.from.start.navRight";
  static navDownLeft = "default.color.from.start.navDownLeft";
  static navDownRight = "default.color.from.start.navDownRight";
  static navDown = "default.color.from.start.navDown";
  static navHome = "default.color.from.start.navHome";
  static navParent = "default.color.from.start.navParent";
  static sunny = "default.color.from.start.sunny";
  static partlyCloudy = "default.color.from.start.partlyCloudy";
  static cloudy = "default.color.from.start.cloudy";
  static fog = "default.color.from.start.fog";
  static hail = "default.color.from.start.hail";
  static lightning = "default.color.from.start.lightning";
  static lightningRainy = "default.color.from.start.lightningRainy";
  static pouring = "default.color.from.start.pouring";
  static rainy = "default.color.from.start.rainy";
  static snowy = "default.color.from.start.snowy";
  static snowyHeavy = "default.color.from.start.snowyHeavy";
  static snowyRainy = "default.color.from.start.snowyRainy";
  static windy = "default.color.from.start.windy";
  static tornado = "default.color.from.start.tornado";
  static clearNight = "default.color.from.start.clearNight";
  static exceptional = "default.color.from.start.exceptional";
  static foreground = "default.color.from.start.foreground";
  static fgTime = "default.color.from.start.foreground";
  static fgTimeAmPm = "default.color.from.start.foreground";
  static fgDate = "default.color.from.start.foreground";
  static fgMain = "default.color.from.start.foreground";
  static fgMainAlt = "default.color.from.start.foreground";
  static fgTimeAdd = "default.color.from.start.foreground";
  static fgForecast = "default.color.from.start.foreground";
  static fgBar = "default.color.from.start.foreground";
  static solar = "default.color.from.start.solar";
  static temperature = "default.color.from.start.temperature";
  static gust = "default.color.from.start.gust";
  static sunrise = "default.color.from.start.sunrise";
  static sunset = "default.color.from.start.sunset";
  // Neue Media-spezifische Defaults
  static mediaArtistOn = "default.color.from.start.mediaArtistOn";
  static mediaArtistOff = "default.color.from.start.mediaArtistOff";
  static mediaTitleOn = "default.color.from.start.mediaTitleOn";
  static mediaTitleOff = "default.color.from.start.mediaTitleOff";
  static mediaOnOffColor = "default.color.from.start.mediaOnOffColor";
}
class Color extends ColorBase {
  // ——— Extra dark additions (neu) ———
  static ExtraDarkRed = { r: 40, g: 0, b: 0 };
  // very dark backdrop with warm tint
  static ExtraDarkGreen = { r: 0, g: 40, b: 0 };
  // very dark backdrop with status/ok tint
  static ExtraDarkBlue = { r: 0, g: 0, b: 40 };
  // very dark backdrop with cool tint
  // ——— Very dark / Black-ish ———
  static Black = { r: 0, g: 0, b: 0 };
  // absolute black, OLED backgrounds
  static HMIDark = { r: 29, g: 29, b: 29 };
  // original background color
  static Charcoal = { r: 30, g: 30, b: 30 };
  // deep dark panels/cards
  static DarkGrayBlue = { r: 10, g: 13, b: 30 };
  // dark bluish UI bars
  static DeepOcean = { r: 0, g: 60, b: 120 };
  // very dark cool header strip
  static DarkBlue = { r: 0, g: 0, b: 146 };
  // dark blue accents
  // ——— Grays / Neutrals ———
  static DarkGray = { r: 64, g: 64, b: 64 };
  // disabled controls, muted icons
  static AshGray = { r: 110, g: 110, b: 110 };
  // secondary labels
  static Divider = { r: 120, g: 130, b: 140 };
  // separators, chart gridlines
  static Gray = { r: 136, g: 136, b: 136 };
  // neutral text on light bg
  static LightGray = { r: 211, g: 211, b: 211 };
  // cards/kacheln light
  static ForegroundSoft = { r: 210, g: 220, b: 230 };
  // soft UI foregrounds
  static ForegroundStrong = { r: 245, g: 248, b: 252 };
  // headlines on dark
  static White = { r: 255, g: 255, b: 255 };
  // primary text on dark
  // ——— Reds ———
  static LavaDeep = { r: 92, g: 12, b: 12 };
  // critical banners (dark)
  static LavaGlow = { r: 156, g: 32, b: 26 };
  // alarm background
  static MagmaRed = { r: 200, g: 34, b: 28 };
  // danger buttons
  static LavaCore = { r: 180, g: 22, b: 0 };
  // strong warning fill
  static Brown = { r: 165, g: 42, b: 42 };
  // brownish alerts
  static BatteryEmpty = { r: 179, g: 45, b: 25 };
  // battery critical
  static Sunset = { r: 255, g: 94, b: 77 };
  // live/record indicator
  static MSRed = { r: 251, g: 105, b: 98 };
  // soft error/warn
  static Coral = { r: 255, g: 127, b: 80 };
  // notification accent
  static Red = { r: 255, g: 0, b: 0 };
  // hard error
  // ——— Oranges / Warme Töne ———
  static FireGlow = { r: 255, g: 80, b: 0 };
  // strong warning CTA
  static EmberOrange = { r: 255, g: 109, b: 36 };
  // active highlight
  static colorRadio = { r: 255, g: 127, b: 0 };
  // radio/stream accent
  static Off = { r: 253, g: 128, b: 0 };
  // off/inactive warm
  static Orange = { r: 255, g: 165, b: 0 };
  // classic orange
  static Mango = { r: 255, g: 166, b: 77 };
  // decorative warm
  static Sand = { r: 237, g: 201, b: 175 };
  // sand beige, backgrounds
  static colorSonos = { r: 216, g: 161, b: 88 };
  // brand warm
  // ——— Yellows ———
  static FireYellow = { r: 255, g: 201, b: 71 };
  // warm emphasis
  static FlameYellow = { r: 255, g: 220, b: 60 };
  // bright highlight
  static Sun = { r: 255, g: 223, b: 0 };
  // sunny yellow
  static On = { r: 253, g: 216, b: 53 };
  // activated state (warm)
  static MSYellow = { r: 255, g: 235, b: 156 };
  // soft warn/info
  static MenuLowInd = { r: 255, g: 235, b: 156 };
  // menu low indicator
  static Yellow = { r: 255, g: 255, b: 0 };
  // peak indicator
  // ——— Greens ———
  static Palm = { r: 0, g: 153, b: 76 };
  // confirm/apply
  static BatteryFull = { r: 96, g: 176, b: 62 };
  // battery ok
  static MSGreen = { r: 121, g: 222, b: 121 };
  // soft success
  static colorSpotify = { r: 30, g: 215, b: 96 };
  // media active
  static Mint = { r: 189, g: 252, b: 201 };
  // subtle success bg
  static Lime = { r: 173, g: 255, b: 47 };
  // fresh success
  static Green = { r: 0, g: 255, b: 0 };
  // max OK / full
  // ——— Cyans / Blue-greens ———
  static Turquoise = { r: 64, g: 224, b: 208 };
  // decorative info
  static colorAlexa = { r: 49, g: 196, b: 243 };
  // voice assistant
  static HMIOn = { r: 3, g: 169, b: 244 };
  // CTA/primary active
  static HMIOff = { r: 68, g: 115, b: 158 };
  // inactive (cool)
  static DarkHMIOff = { r: 54, g: 92, b: 126 };
  // inactive (cool)
  static TechMint = { r: 200, g: 255, b: 255 };
  // clean info bg
  static Cyan = { r: 0, g: 255, b: 255 };
  // info/neutral progress
  // ——— Blues ———
  static Ocean = { r: 0, g: 119, b: 190 };
  // primary (cool)
  static BlueLight = { r: 135, g: 206, b: 250 };
  // light info
  static TimeAccent = { r: 160, g: 200, b: 255 };
  // time accent
  static TimePrimary = { r: 220, g: 240, b: 255 };
  // clock main
  static Blue = { r: 0, g: 0, b: 255 };
  // strong link/series
  static TealBlue = { r: 0, g: 20, b: 156 };
  // slightly brighter teal-blue
  static BrightTealBlue = { r: 50, g: 30, b: 156 };
  // brighter teal-blue with red tint
  static GrayBlue = { r: 90, g: 90, b: 200 };
  // softer gray-blue, ~30% lighter
  static LightGrayBlue = { r: 130, g: 130, b: 230 };
  // softer gray-blue, ~30% lighter
  // ——— Violets / Pinks ———
  static Purple = { r: 128, g: 0, b: 128 };
  // category/secondary
  static Orchid = { r: 218, g: 112, b: 214 };
  // decorative
  static Violet = { r: 238, g: 130, b: 238 };
  // secondary highlight
  static Magenta = { r: 255, g: 0, b: 255 };
  // attention/beta
  static Pink = { r: 255, g: 192, b: 203 };
  // soft badges
  // ——— Menu Icon Colors (unverändert, referenziert oben nach Farbwertnähe) ———
  static Menu = { r: 150, g: 150, b: 100 };
  // neutral menu icon
  static MenuHighInd = { r: 251, g: 105, b: 98 };
  // high indicator
  // ——— Dynamische Indikatoren (unverändert) ———
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
  // ——— Screensaver Default Theme Colors (unverändert) ———
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
  // ——— Auto-Weather-Colors (unverändert) ———
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
  static getColorFromDefaultOrReturn(s) {
    if (typeof s === "string" && s && s.startsWith("default.color.from.start.")) {
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
        case "default.color.from.start.option1":
          return Color.option1;
        case "default.color.from.start.option2":
          return Color.option2;
        case "default.color.from.start.option3":
          return Color.option3;
        case "default.color.from.start.option4":
          return Color.option4;
        case "default.color.from.start.open":
          return Color.open;
        case "default.color.from.start.close":
          return Color.close;
        case "default.color.from.start.hot":
          return Color.hot;
        case "default.color.from.start.cold":
          return Color.cold;
        case "default.color.from.start.on":
          return Color.on;
        case "default.color.from.start.off":
          return Color.off;
        case "default.color.from.start.light":
          return Color.light;
        case "default.color.from.start.dark":
          return Color.dark;
        case "default.color.from.start.warning":
          return Color.warning;
        case "default.color.from.start.success":
          return Color.success;
        case "default.color.from.start.neutral":
          return Color.neutral;
        case "default.color.from.start.background":
          return Color.background;
        case "default.color.from.start.highlight":
          return Color.highlight;
        case "default.color.from.start.disabled":
          return Color.disabled;
        case "default.color.from.start.navLeft":
          return Color.navLeft;
        case "default.color.from.start.navRight":
          return Color.navRight;
        case "default.color.from.start.navDownLeft":
          return Color.navDownLeft;
        case "default.color.from.start.navDownRight":
          return Color.navDownRight;
        case "default.color.from.start.navDown":
          return Color.navDown;
        case "default.color.from.start.navHome":
          return Color.navHome;
        case "default.color.from.start.navParent":
          return Color.navParent;
        case "default.color.from.start.sunny":
          return Color.sunny;
        case "default.color.from.start.partlyCloudy":
          return Color.partlyCloudy;
        case "default.color.from.start.cloudy":
          return Color.cloudy;
        case "default.color.from.start.fog":
          return Color.fog;
        case "default.color.from.start.hail":
          return Color.hail;
        case "default.color.from.start.lightning":
          return Color.lightning;
        case "default.color.from.start.lightningRainy":
          return Color.lightningRainy;
        case "default.color.from.start.pouring":
          return Color.pouring;
        case "default.color.from.start.rainy":
          return Color.rainy;
        case "default.color.from.start.snowy":
          return Color.snowy;
        case "default.color.from.start.snowyHeavy":
          return Color.snowyHeavy;
        case "default.color.from.start.snowyRainy":
          return Color.snowyRainy;
        case "default.color.from.start.windy":
          return Color.windy;
        case "default.color.from.start.tornado":
          return Color.tornado;
        case "default.color.from.start.clearNight":
          return Color.clearNight;
        case "default.color.from.start.exceptional":
          return Color.exceptional;
        case "default.color.from.start.foreground":
          return Color.foreground;
        case "default.color.from.start.fgTime":
          return Color.fgTime;
        case "default.color.from.start.fgTimeAmPm":
          return Color.fgTimeAmPm;
        case "default.color.from.start.fgDate":
          return Color.fgDate;
        case "default.color.from.start.fgMain":
          return Color.fgMain;
        case "default.color.from.start.fgMainAlt":
          return Color.fgMainAlt;
        case "default.color.from.start.fgTimeAdd":
          return Color.fgTimeAdd;
        case "default.color.from.start.fgForecast":
          return Color.fgForecast;
        case "default.color.from.start.fgBar":
          return Color.fgBar;
        case "default.color.from.start.solar":
          return Color.solar;
        case "default.color.from.start.temperature":
          return Color.temperature;
        case "default.color.from.start.gust":
          return Color.gust;
        case "default.color.from.start.sunrise":
          return Color.sunrise;
        case "default.color.from.start.sunset":
          return Color.sunset;
        // Neue Media-spezifische Defaults
        case "default.color.from.start.mediaArtistOn":
          return Color.mediaArtistOn;
        case "default.color.from.start.mediaArtistOff":
          return Color.mediaArtistOff;
        case "default.color.from.start.mediaTitleOn":
          return Color.mediaTitleOn;
        case "default.color.from.start.mediaTitleOff":
          return Color.mediaTitleOff;
        case "default.color.from.start.mediaOnOffColor":
          return Color.mediaOnOffColor;
        default:
          console.warn(`Color.getColorFromDefault: unknown default color ${s}`);
      }
    }
    return s;
  }
  // default
  static defaultTheme = {
    good: Color.Green,
    bad: Color.Red,
    true: Color.Green,
    false: Color.Red,
    activated: Color.Yellow,
    deactivated: Color.Gray,
    attention: Color.Cyan,
    info: Color.White,
    option1: Color.Yellow,
    option2: Color.MSYellow,
    option3: Color.MSRed,
    option4: Color.MSGreen,
    open: Color.Red,
    close: Color.Green,
    hot: Color.Red,
    cold: Color.Blue,
    on: Color.On,
    off: Color.Off,
    light: Color.White,
    dark: Color.Gray,
    warning: Color.Orange,
    success: Color.Green,
    neutral: Color.Gray,
    background: Color.HMIDark,
    highlight: Color.HMIOn,
    disabled: Color.HMIOff,
    navLeft: Color.HMIOn,
    navRight: Color.HMIOn,
    navDownLeft: Color.On,
    navDownRight: Color.On,
    navDown: Color.Off,
    navHome: Color.Yellow,
    navParent: Color.Gray,
    sunny: Color.swSunny,
    partlyCloudy: Color.swPartlycloudy,
    cloudy: Color.swCloudy,
    fog: Color.swFog,
    hail: Color.swHail,
    lightning: Color.swLightning,
    lightningRainy: Color.swLightningRainy,
    pouring: Color.swPouring,
    rainy: Color.swRainy,
    snowy: Color.swSnowy,
    snowyHeavy: Color.swSnowy,
    snowyRainy: Color.swSnowyRainy,
    windy: Color.swWindy,
    tornado: Color.swExceptional,
    clearNight: Color.swClearNight,
    exceptional: Color.swExceptional,
    foreground: Color.White,
    solar: Color.On,
    temperature: Color.Red,
    gust: Color.Blue,
    sunrise: Color.Yellow,
    sunset: Color.Orange,
    // NEW theme keys
    fgTime: Color.White,
    fgTimeAmPm: Color.MSYellow,
    fgDate: Color.LightGray,
    fgMain: Color.White,
    fgMainAlt: Color.MSYellow,
    fgTimeAdd: Color.HMIOn,
    fgForecast: Color.LightGray,
    fgBar: Color.LightGray,
    // Media-spezifisch
    mediaArtistOn: Color.White,
    mediaArtistOff: Color.Gray,
    mediaTitleOn: Color.Red,
    mediaTitleOff: Color.Gray,
    mediaOnOffColor: Color.White
  };
  // tropical
  static topicalTheme = {
    good: Color.Palm,
    bad: Color.Coral,
    true: Color.Lime,
    false: Color.Sunset,
    activated: Color.Turquoise,
    deactivated: Color.Sand,
    attention: Color.Mango,
    info: Color.Orchid,
    option1: Color.Turquoise,
    option2: Color.Mango,
    option3: Color.Coral,
    option4: Color.Lime,
    open: Color.Ocean,
    close: Color.Palm,
    hot: Color.Sunset,
    cold: Color.Turquoise,
    on: Color.Mango,
    off: Color.Sand,
    light: Color.Sun,
    dark: Color.Ocean,
    warning: Color.Coral,
    success: Color.Palm,
    neutral: Color.Sand,
    background: Color.DeepOcean,
    highlight: Color.Sunset,
    disabled: Color.Gray,
    navLeft: Color.Turquoise,
    navRight: Color.Turquoise,
    navDownLeft: Color.Mango,
    navDownRight: Color.Mango,
    navDown: Color.Sun,
    navHome: Color.Sunset,
    navParent: Color.Sand,
    sunny: Color.Sun,
    partlyCloudy: Color.BlueLight,
    cloudy: Color.Sand,
    fog: Color.LightGray,
    hail: Color.LightGray,
    lightning: Color.Mango,
    lightningRainy: Color.Coral,
    pouring: Color.Ocean,
    rainy: Color.Blue,
    snowy: Color.White,
    snowyHeavy: Color.LightGray,
    snowyRainy: Color.BlueLight,
    windy: Color.Turquoise,
    tornado: Color.Red,
    clearNight: Color.Ocean,
    exceptional: Color.Red,
    foreground: Color.Sun,
    gust: Color.Turquoise,
    sunrise: Color.Sun,
    sunset: Color.Sunset,
    // NEW theme keys
    fgTime: Color.Sun,
    fgTimeAmPm: Color.Mango,
    fgDate: Color.Sand,
    fgMain: Color.Orchid,
    fgMainAlt: Color.Mango,
    fgTimeAdd: Color.Turquoise,
    fgForecast: Color.Sand,
    fgBar: Color.Sand,
    solar: Color.Sun,
    temperature: Color.Sunset,
    // Media-spezifisch
    mediaArtistOn: Color.Turquoise,
    mediaArtistOff: Color.Sand,
    mediaTitleOn: Color.White,
    mediaTitleOff: Color.LightGray,
    mediaOnOffColor: Color.Turquoise
  };
  // technical
  static technicalTheme = {
    good: Color.HMIOn,
    bad: Color.MSRed,
    true: Color.Green,
    false: Color.Red,
    activated: Color.Cyan,
    deactivated: Color.Gray,
    attention: Color.Yellow,
    info: Color.White,
    option1: Color.Blue,
    option2: Color.LightGray,
    option3: Color.Cyan,
    option4: Color.HMIOff,
    open: Color.Cyan,
    close: Color.DarkBlue,
    hot: Color.Red,
    cold: Color.Blue,
    on: Color.HMIOn,
    off: Color.DarkHMIOff,
    light: Color.White,
    dark: Color.DarkGray,
    warning: Color.Yellow,
    success: Color.Green,
    neutral: Color.Gray,
    background: Color.DarkGrayBlue,
    highlight: Color.Cyan,
    disabled: Color.HMIOff,
    navLeft: Color.Cyan,
    navRight: Color.Cyan,
    navDownLeft: Color.Blue,
    navDownRight: Color.Blue,
    navDown: Color.DarkBlue,
    navHome: Color.Yellow,
    navParent: Color.HMIOff,
    sunny: Color.Yellow,
    partlyCloudy: Color.BlueLight,
    cloudy: Color.HMIOff,
    fog: Color.LightGray,
    hail: Color.LightGray,
    lightning: Color.Yellow,
    lightningRainy: Color.MSYellow,
    pouring: Color.GrayBlue,
    rainy: Color.LightGrayBlue,
    snowy: Color.White,
    snowyHeavy: Color.LightGray,
    snowyRainy: Color.BlueLight,
    windy: Color.Cyan,
    gust: Color.Cyan,
    sunrise: Color.Cyan,
    sunset: Color.Yellow,
    tornado: Color.MSRed,
    clearNight: Color.HMIOff,
    exceptional: Color.MSRed,
    foreground: Color.TechMint,
    solar: Color.MSYellow,
    temperature: Color.TechMint,
    // NEW theme keys
    fgTime: Color.TechMint,
    fgTimeAmPm: Color.Cyan,
    fgDate: Color.LightGray,
    fgMain: Color.White,
    fgMainAlt: Color.Cyan,
    fgTimeAdd: Color.Cyan,
    fgForecast: Color.BlueLight,
    fgBar: Color.DarkGray,
    // Media-spezifisch
    mediaArtistOn: Color.TechMint,
    mediaArtistOff: Color.AshGray,
    mediaTitleOn: Color.White,
    mediaTitleOff: Color.DarkGray,
    mediaOnOffColor: Color.Cyan
  };
  // sunset
  static sunsetTheme = {
    good: Color.MSGreen,
    bad: Color.MSRed,
    true: Color.On,
    false: Color.Off,
    activated: Color.Yellow,
    deactivated: Color.Gray,
    attention: Color.colorRadio,
    info: Color.White,
    option1: Color.Red,
    option2: (_a = Color.Orange) != null ? _a : { r: 255, g: 140, b: 0 },
    option3: Color.Magenta,
    option4: Color.colorSonos,
    open: Color.Red,
    close: Color.Green,
    hot: Color.Off,
    cold: Color.DarkBlue,
    on: Color.Yellow,
    off: Color.Off,
    light: Color.White,
    dark: Color.HMIDark,
    warning: Color.Off,
    success: Color.Green,
    neutral: Color.Gray,
    background: { r: 48, g: 27, b: 63 },
    highlight: Color.Magenta,
    disabled: Color.HMIOff,
    navLeft: Color.Off,
    navRight: Color.Off,
    navDownLeft: Color.Magenta,
    navDownRight: Color.Magenta,
    navDown: Color.Yellow,
    navHome: Color.colorSonos,
    navParent: Color.Gray,
    sunny: Color.On,
    partlyCloudy: Color.colorSonos,
    cloudy: Color.Off,
    fog: Color.LightGray,
    hail: Color.LightGray,
    lightning: Color.Magenta,
    lightningRainy: Color.Red,
    pouring: Color.DarkBlue,
    rainy: Color.Blue,
    snowy: Color.White,
    snowyHeavy: Color.LightGray,
    snowyRainy: Color.Violet,
    windy: Color.Orange,
    tornado: Color.Red,
    clearNight: Color.DarkBlue,
    exceptional: Color.MSRed,
    foreground: Color.Yellow,
    solar: Color.On,
    temperature: Color.Magenta,
    gust: Color.Orange,
    sunrise: Color.Orange,
    sunset: Color.Magenta,
    // NEW theme keys
    fgTime: Color.Yellow,
    fgTimeAmPm: (_b = Color.Orange) != null ? _b : { r: 255, g: 140, b: 0 },
    fgDate: Color.Orange,
    fgMain: Color.Magenta,
    fgMainAlt: Color.Magenta,
    fgTimeAdd: Color.Magenta,
    fgForecast: Color.colorSonos,
    fgBar: Color.Off,
    // Media-spezifisch
    mediaArtistOn: Color.Sunset,
    mediaArtistOff: Color.Gray,
    mediaTitleOn: Color.Yellow,
    mediaTitleOff: Color.Off,
    mediaOnOffColor: (_c = Color.Orange) != null ? _c : { r: 255, g: 140, b: 0 }
  };
  // volcano
  static volcanoTheme = {
    good: Color.FlameYellow,
    bad: Color.MagmaRed,
    true: Color.FlameYellow,
    false: Color.MagmaRed,
    activated: Color.FireGlow,
    deactivated: Color.AshGray,
    attention: Color.FireGlow,
    info: Color.White,
    option1: Color.FireGlow,
    option2: Color.FlameYellow,
    option3: Color.MagmaRed,
    option4: Color.LavaGlow,
    open: Color.MagmaRed,
    close: Color.MSGreen,
    hot: Color.MagmaRed,
    cold: Color.Blue,
    on: Color.FireGlow,
    off: Color.Charcoal,
    light: Color.White,
    dark: Color.Gray,
    warning: Color.FireGlow,
    success: Color.MSGreen,
    neutral: Color.AshGray,
    background: Color.LavaCore,
    // jetzt feuriges Rot als Hintergrund
    highlight: Color.FireGlow,
    disabled: Color.AshGray,
    navLeft: Color.FireGlow,
    navRight: Color.FireGlow,
    navDownLeft: Color.FlameYellow,
    navDownRight: Color.FlameYellow,
    navDown: Color.MagmaRed,
    navHome: Color.FlameYellow,
    navParent: Color.AshGray,
    sunny: Color.FlameYellow,
    partlyCloudy: Color.FireGlow,
    cloudy: Color.AshGray,
    fog: Color.LightGray,
    hail: Color.LightGray,
    lightning: Color.FlameYellow,
    lightningRainy: Color.FireGlow,
    pouring: Color.DarkBlue,
    rainy: Color.Blue,
    snowy: Color.White,
    snowyHeavy: Color.LightGray,
    snowyRainy: Color.BlueLight,
    windy: Color.AshGray,
    gust: Color.FireGlow,
    sunrise: Color.FlameYellow,
    sunset: Color.FireGlow,
    tornado: Color.MagmaRed,
    clearNight: Color.Charcoal,
    exceptional: Color.MagmaRed,
    foreground: Color.FlameYellow,
    solar: Color.FlameYellow,
    temperature: Color.MagmaRed,
    fgTime: Color.FlameYellow,
    // Uhrzeit sehr strahlend
    fgTimeAmPm: Color.FireGlow,
    // AM/PM orange
    fgDate: Color.FireGlow,
    // Datum klar sichtbar (kräftiges Orange)
    fgMain: Color.White,
    // Haupttext neutral
    fgMainAlt: Color.FlameYellow,
    // alternative Haupttexte in Gelb
    fgTimeAdd: Color.FireGlow,
    fgForecast: Color.FlameYellow,
    // Forecast-Werte hellgelb für Kontrast
    fgBar: Color.AshGray,
    // Media-spezifisch
    mediaArtistOn: Color.LavaCore,
    mediaArtistOff: Color.AshGray,
    mediaTitleOn: Color.White,
    mediaTitleOff: Color.FlameYellow,
    mediaOnOffColor: Color.FireGlow
  };
  /**
   * set color theme...
   *
   * @param s ColorThemenInterface
   */
  static setTheme(s) {
    for (const a in s) {
      if (a) {
        const value = s[a];
        if (value !== void 0) {
          Color[a] = value;
        }
      }
    }
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
  /**
   * Scales a number from one range to another range.
   *
   * This function takes a number and maps it from an input range
   * (defined by `inMin` and `inMax`) to an output range
   * (defined by `outMin` and `outMax`). If either `inMin` or `inMax`
   * is `null`, the function returns the input number unchanged.
   *
   * @param number - The number to be scaled.
   * @param inMin - The minimum value of the input range. If `null`, scaling is skipped.
   * @param inMax - The maximum value of the input range. If `null`, scaling is skipped.
   * @param outMin - The minimum value of the output range.
   * @param outMax - The maximum value of the output range.
   * @returns The scaled number, or the input number if `inMin` or `inMax` is `null`.
   */
  static scale(number, inMin, inMax, outMin, outMax) {
    if (inMax === null || inMin === null) {
      return number;
    }
    return outMax + outMin - ((number - inMax) * (outMax - outMin) / (inMin - inMax) + outMin);
  }
  static mixColorHue(startRGB, endRGB, t, _options) {
    const startHSB = (0, import_colord.colord)(startRGB).toHsv();
    const endHSB = (0, import_colord.colord)(endRGB).toHsv();
    t = Math.min(1, Math.max(0, t));
    const deltaH = (endHSB.h - startHSB.h + 540) % 360 - 180;
    const h = (startHSB.h + t * deltaH + 360) % 360;
    const s = startHSB.s + t * (endHSB.s - startHSB.s);
    const v = startHSB.v + t * (endHSB.v - startHSB.v);
    return (0, import_colord.colord)({ h, s, v }).toRgb();
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
  static triGradAnchor(_from, _to, factor, _options) {
    factor = (_options == null ? void 0 : _options.anchorHigh) ? (1 - factor) / 2 + 0.5 : factor / 2;
    return Color.triGradColorScale(_from, _to, factor, { ..._options });
  }
  /**
   * Interpolate between two colors
   *
   * @param _from ignored
   * @param _to ignored
   * @param factor 0-1 mix value
   * @param _options swap input and use triGradAnchor
   * @returns RGB
   */
  static triGradColorScale(_from, _to, factor, _options) {
    factor = Math.min(1, Math.max(0, factor));
    let r = 0;
    let g = 0;
    const b = 0;
    if ((_options == null ? void 0 : _options.swap) === true) {
      factor = 1 - factor;
    }
    if (factor < 0.5) {
      r = 255;
      g = Math.round(510 * factor);
    } else {
      g = 255;
      r = Math.round(510 - 510 * factor);
    }
    return { r, g, b };
  }
  static quadriGradAnchor(_from, _to, factor, _options) {
    factor = (_options == null ? void 0 : _options.anchorHigh) ? (1 - factor) / 2 + 0.5 : factor / 2;
    return Color.quadriGradColorScale(_from, _to, factor, { ..._options });
  }
  /**
   * Generates a color gradient based on a four-segment scale, transitioning through red, green, and blue.
   * The gradient is determined by the `factor` parameter, which ranges from 0 to 1.
   *
   * @param _from - The starting RGB color (not used in the current implementation).
   * @param _to - The ending RGB color (not used in the current implementation).
   * @param factor - A number between 0 and 1 that determines the position in the gradient.
   *                 Values closer to 0 result in red, transitioning through green, and ending in blue.
   * @param _options - Optional settings for the gradient generation.
   *                   - `swap` (boolean): If `false`, the gradient direction is reversed.
   * @returns An RGB object representing the interpolated color at the specified `factor`..
   */
  static quadriGradColorScale(_from, _to, factor, _options) {
    let f = Math.min(1, Math.max(0, factor));
    if (_options == null ? void 0 : _options.swap) {
      f = 1 - f;
    }
    const seg = Math.floor(f * 4);
    const local = f * 4 - seg;
    let r = 0, g = 0, b = 0;
    switch (seg) {
      case 0:
        r = 255;
        g = Math.round(255 * local);
        break;
      case 1:
        g = 255;
        r = Math.round(255 * (1 - local));
        break;
      case 2:
        g = 255;
        b = Math.round(255 * local);
        break;
      case 3:
        b = 255;
        g = Math.round(255 * (1 - local));
        break;
    }
    return { r, g, b };
  }
  /**
   *
   * @param c1 from this color
   * @param c2 to this
   * @param r 0-1 mix value
   * @param _options no use
   * @returns RGB
   */
  static mixColorCie(c1, c2, r, _options) {
    return (0, import_colord.colord)(c1).mix(c2, r).toRgb();
  }
  /**
   *
   * @param c1 from this color
   * @param c2 to this
   * @param x 0-1 mix value
   * @param _options no use
   * @returns RGB
   */
  static mixColor(c1, c2, x, _options) {
    const r = Math.round(c1.r + (c2.r - c1.r) * x);
    const g = Math.round(c1.g + (c2.g - c1.g) * x);
    const b = Math.round(c1.b + (c2.b - c1.b) * x);
    return { r, g, b };
  }
  static InterpolateNum(d1, d2, fraction) {
    return d1 + (d2 - d1) * fraction;
  }
  static brightness(c, s) {
    let r = c.r * s;
    let g = c.g * s;
    let b = c.b * s;
    r = Math.min(255, Math.max(1, r));
    g = Math.min(255, Math.max(1, g));
    b = Math.min(255, Math.max(1, b));
    return { r, g, b };
  }
  static darken(c, s) {
    s = Color.scale(s, 0, 1, 0, 0.5);
    return (0, import_colord.colord)(c).darken(s).toRgb();
  }
  /**
   * Convert radians to degrees
   *
   * @param rad radians to convert, expects rad in range +/- PI per Math.atan2
   * @returns degrees equivalent of rad
   */
  static rad2deg(rad) {
    return (360 + 180 * rad / Math.PI) % 360;
  }
  static ColorToHex(color) {
    const hexadecimal = color.toString(16);
    return hexadecimal.length == 1 ? `0${hexadecimal}` : hexadecimal;
  }
  static ConvertRGBtoHex(red, green, blue) {
    return `#${Color.ColorToHex(red)}${Color.ColorToHex(green)}${Color.ColorToHex(blue)}`;
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
   *
   * @param hue in range [0, 360]
   * @param saturation in range 0 to 1
   * @param value in range 0 to 1
   * @returns [r, g,b] in range 0 to 255
   */
  static hsv2rgb(hue, saturation, value) {
    const c = value * saturation;
    const h = hue % 360 / 60;
    const x = c * (1 - Math.abs(h % 2 - 1));
    const m = value - c;
    let rgb;
    switch (Math.floor(h)) {
      case 0:
        rgb = [c, x, 0];
        break;
      case 1:
        rgb = [x, c, 0];
        break;
      case 2:
        rgb = [0, c, x];
        break;
      case 3:
        rgb = [0, x, c];
        break;
      case 4:
        rgb = [x, 0, c];
        break;
      default:
        rgb = [c, 0, x];
        break;
    }
    return rgb.map((v) => Math.round((v + m) * 255));
  }
  static hsv2RGB(hue, saturation, value) {
    const arr = Color.hsv2rgb(hue, saturation, value);
    return { r: arr[0], g: arr[1], b: arr[2] };
  }
  static hsvtodec(hue, saturation, value) {
    if (hue === null) {
      return null;
    }
    const result = Color.hsv2rgb(hue, saturation, value);
    return String(Color.rgb_dec565({ r: result[0], g: result[1], b: result[2] }));
  }
  static resultToRgb(r) {
    const arr = r.split("|");
    return Color.pos_to_color(parseInt(arr[0]), parseInt(arr[1]));
  }
  static getHue(red, green, blue) {
    const min = Math.min(red, green, blue);
    const max = Math.max(red, green, blue);
    const delta = max - min;
    if (delta === 0) {
      return 0;
    }
    let hue;
    if (max === red) {
      hue = (green - blue) / delta;
    } else if (max === green) {
      hue = 2 + (blue - red) / delta;
    } else {
      hue = 4 + (red - green) / delta;
    }
    hue = (hue * 60 + 360) % 360;
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
   * Convert RGB to CIE 1931
   *
   * @param red red value
   * @param green green value
   * @param blue blue value
   * @returns CIE 1931 color space
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
    const cie = `[${ciex},${ciey}]`;
    return cie;
  }
  static isRGB(F) {
    return typeof F == "object" && "r" in F && "b" in F && "g" in F;
  }
  static isScriptRGB(F) {
    return typeof F == "object" && "red" in F && "blue" in F && "green" in F;
  }
  static convertScriptRGBtoRGB(F) {
    return { r: F.red, g: F.green, b: F.blue };
  }
  static isOldRGB(F) {
    return this.isRGB(F);
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
  Color,
  test
});
//# sourceMappingURL=Color.js.map
