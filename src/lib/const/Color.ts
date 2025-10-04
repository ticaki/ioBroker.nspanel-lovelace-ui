import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import mixPlugin from 'colord/plugins/mix';

extend([namesPlugin, mixPlugin]);

export type mixedOptions = {
    swap?: boolean;
    anchorHigh?: boolean;
};
export type RGB = {
    r: number;
    g: number;
    b: number;
};

export type hex = `#${string}`;

interface MixedOptions {
    swap?: boolean;
}
export interface ColorThemenInterface {
    good: RGB;
    bad: RGB;
    true: RGB;
    false: RGB;
    activated: RGB;
    deactivated: RGB;
    attention: RGB;
    info: RGB;
    option1: RGB;
    option2: RGB;
    option3: RGB;
    option4: RGB;
    open: RGB;
    close: RGB;
    hot: RGB;
    cold: RGB;
    on: RGB;
    off: RGB;
    light: RGB;
    dark: RGB;
    warning?: RGB;
    success?: RGB;
    neutral?: RGB;
    background?: RGB;
    highlight?: RGB;
    disabled?: RGB;
    // Navigation
    navLeft: RGB;
    navRight: RGB;
    navDownLeft: RGB;
    navDownRight: RGB;
    navDown: RGB;
    navHome: RGB;
    navParent: RGB;
    sunny?: RGB;
    partlyCloudy?: RGB;
    cloudy?: RGB;
    fog?: RGB;
    hail?: RGB;
    lightning?: RGB;
    lightningRainy?: RGB;
    pouring?: RGB;
    rainy?: RGB;
    snowy?: RGB;
    snowyHeavy?: RGB;
    snowyRainy?: RGB;
    windy?: RGB;
    tornado?: RGB;
    clearNight?: RGB;
    exceptional?: RGB;
    foreground?: RGB;
    fgTime?: RGB;
    fgTimeAmPm?: RGB;
    fgDate?: RGB;
    fgMain?: RGB;
    fgMainAlt?: RGB;
    fgTimeAdd?: RGB;
    fgForecast?: RGB;
    fgBar?: RGB;
    solar?: RGB;
    temperature?: RGB;
    gust?: RGB;
    sunrise?: RGB;
    sunset?: RGB;
    // Neue Media-spezifische Theme-Einträge
    mediaArtistOn?: RGB;
    mediaArtistOff?: RGB;
    mediaTitleOn?: RGB;
    mediaTitleOff?: RGB;
    mediaOnOffColor?: RGB;
}

/**
 * check if Color has all propertys of ColorThemenInterface
 *
 * @param k just a key
 * @returns any
 */
export function test(k: keyof ColorThemenInterface): any {
    return Color[k];
}
class ColorBase {
    constructor() {}
    static good: RGB | string = 'default.color.from.start.good';
    static bad: RGB | string = 'default.color.from.start.bad';
    static true: RGB | string = 'default.color.from.start.true';
    static false: RGB | string = 'default.color.from.start.false';
    static activated: RGB | string = 'default.color.from.start.activated';
    static deactivated: RGB | string = 'default.color.from.start.deactivated';
    static attention: RGB | string = 'default.color.from.start.attention';
    static info: RGB | string = 'default.color.from.start.info';
    static option1: RGB | string = 'default.color.from.start.option1';
    static option2: RGB | string = 'default.color.from.start.option2';
    static option3: RGB | string = 'default.color.from.start.option3';
    static option4: RGB | string = 'default.color.from.start.option4';
    static open: RGB | string = 'default.color.from.start.open';
    static close: RGB | string = 'default.color.from.start.close';
    static hot: RGB | string = 'default.color.from.start.hot';
    static cold: RGB | string = 'default.color.from.start.cold';
    static on: RGB | string = 'default.color.from.start.on';
    static off: RGB | string = 'default.color.from.start.off';
    static light: RGB | string = 'default.color.from.start.light';
    static dark: RGB | string = 'default.color.from.start.dark';
    static warning: RGB | string = 'default.color.from.start.warning';
    static success: RGB | string = 'default.color.from.start.success';
    static neutral: RGB | string = 'default.color.from.start.neutral';
    static background: RGB | string = 'default.color.from.start.background';
    static highlight: RGB | string = 'default.color.from.start.highlight';
    static disabled: RGB | string = 'default.color.from.start.disabled';
    // Navigation
    static navLeft: RGB | string = 'default.color.from.start.navLeft';
    static navRight: RGB | string = 'default.color.from.start.navRight';
    static navDownLeft: RGB | string = 'default.color.from.start.navDownLeft';
    static navDownRight: RGB | string = 'default.color.from.start.navDownRight';
    static navDown: RGB | string = 'default.color.from.start.navDown';
    static navHome: RGB | string = 'default.color.from.start.navHome';
    static navParent: RGB | string = 'default.color.from.start.navParent';
    static sunny: RGB | string = 'default.color.from.start.sunny';
    static partlyCloudy: RGB | string = 'default.color.from.start.partlyCloudy';
    static cloudy: RGB | string = 'default.color.from.start.cloudy';
    static fog: RGB | string = 'default.color.from.start.fog';
    static hail: RGB | string = 'default.color.from.start.hail';
    static lightning: RGB | string = 'default.color.from.start.lightning';
    static lightningRainy: RGB | string = 'default.color.from.start.lightningRainy';
    static pouring: RGB | string = 'default.color.from.start.pouring';
    static rainy: RGB | string = 'default.color.from.start.rainy';
    static snowy: RGB | string = 'default.color.from.start.snowy';
    static snowyHeavy: RGB | string = 'default.color.from.start.snowyHeavy';
    static snowyRainy: RGB | string = 'default.color.from.start.snowyRainy';
    static windy: RGB | string = 'default.color.from.start.windy';
    static tornado: RGB | string = 'default.color.from.start.tornado';
    static clearNight: RGB | string = 'default.color.from.start.clearNight';
    static exceptional: RGB | string = 'default.color.from.start.exceptional';
    static foreground: RGB | string = 'default.color.from.start.foreground';
    static fgTime: RGB | string = 'default.color.from.start.foreground';
    static fgTimeAmPm: RGB | string = 'default.color.from.start.foreground';
    static fgDate: RGB | string = 'default.color.from.start.foreground';
    static fgMain: RGB | string = 'default.color.from.start.foreground';
    static fgMainAlt: RGB | string = 'default.color.from.start.foreground';
    static fgTimeAdd: RGB | string = 'default.color.from.start.foreground';
    static fgForecast: RGB | string = 'default.color.from.start.foreground';
    static fgBar: RGB | string = 'default.color.from.start.foreground';
    static solar: RGB | string = 'default.color.from.start.solar';
    static temperature: RGB | string = 'default.color.from.start.temperature';
    static gust: RGB | string = 'default.color.from.start.gust';
    static sunrise: RGB | string = 'default.color.from.start.sunrise';
    static sunset: RGB | string = 'default.color.from.start.sunset';
    // Neue Media-spezifische Defaults
    static mediaArtistOn: RGB | string = 'default.color.from.start.mediaArtistOn';
    static mediaArtistOff: RGB | string = 'default.color.from.start.mediaArtistOff';
    static mediaTitleOn: RGB | string = 'default.color.from.start.mediaTitleOn';
    static mediaTitleOff: RGB | string = 'default.color.from.start.mediaTitleOff';
    static mediaOnOffColor: RGB | string = 'default.color.from.start.mediaOnOffColor';
}

export class Color extends ColorBase {
    // ——— Extra dark additions (neu) ———
    static readonly ExtraDarkRed: RGB = { r: 40, g: 0, b: 0 }; // very dark backdrop with warm tint
    static readonly ExtraDarkGreen: RGB = { r: 0, g: 40, b: 0 }; // very dark backdrop with status/ok tint
    static readonly ExtraDarkBlue: RGB = { r: 0, g: 0, b: 40 }; // very dark backdrop with cool tint

    // ——— Very dark / Black-ish ———
    static readonly Black: RGB = { r: 0, g: 0, b: 0 }; // absolute black, OLED backgrounds
    static readonly HMIDark: RGB = { r: 29, g: 29, b: 29 }; // original background color
    static readonly Charcoal: RGB = { r: 30, g: 30, b: 30 }; // deep dark panels/cards
    static readonly DarkGrayBlue: RGB = { r: 10, g: 13, b: 30 }; // dark bluish UI bars
    static readonly DeepOcean: RGB = { r: 0, g: 60, b: 120 }; // very dark cool header strip
    static readonly DarkBlue: RGB = { r: 0, g: 0, b: 146 }; // dark blue accents

    // ——— Grays / Neutrals ———
    static readonly DarkGray: RGB = { r: 64, g: 64, b: 64 }; // disabled controls, muted icons
    static readonly AshGray: RGB = { r: 110, g: 110, b: 110 }; // secondary labels
    static readonly Divider: RGB = { r: 120, g: 130, b: 140 }; // separators, chart gridlines
    static readonly Gray: RGB = { r: 136, g: 136, b: 136 }; // neutral text on light bg
    static readonly LightGray: RGB = { r: 211, g: 211, b: 211 }; // cards/kacheln light
    static readonly ForegroundSoft: RGB = { r: 210, g: 220, b: 230 }; // soft UI foregrounds
    static readonly ForegroundStrong: RGB = { r: 245, g: 248, b: 252 }; // headlines on dark
    static readonly White: RGB = { r: 255, g: 255, b: 255 }; // primary text on dark

    // ——— Reds ———
    static readonly LavaDeep: RGB = { r: 92, g: 12, b: 12 }; // critical banners (dark)
    static readonly LavaGlow: RGB = { r: 156, g: 32, b: 26 }; // alarm background
    static readonly MagmaRed: RGB = { r: 200, g: 34, b: 28 }; // danger buttons
    static readonly LavaCore: RGB = { r: 180, g: 22, b: 0 }; // strong warning fill
    static readonly Brown: RGB = { r: 165, g: 42, b: 42 }; // brownish alerts
    static readonly BatteryEmpty: RGB = { r: 179, g: 45, b: 25 }; // battery critical
    static readonly Sunset: RGB = { r: 255, g: 94, b: 77 }; // live/record indicator
    static readonly MSRed: RGB = { r: 251, g: 105, b: 98 }; // soft error/warn
    static readonly Coral: RGB = { r: 255, g: 127, b: 80 }; // notification accent
    static readonly Red: RGB = { r: 255, g: 0, b: 0 }; // hard error

    // ——— Oranges / Warme Töne ———
    static readonly FireGlow: RGB = { r: 255, g: 80, b: 0 }; // strong warning CTA
    static readonly EmberOrange: RGB = { r: 255, g: 109, b: 36 }; // active highlight
    static readonly colorRadio: RGB = { r: 255, g: 127, b: 0 }; // radio/stream accent
    static readonly Off: RGB = { r: 253, g: 128, b: 0 }; // off/inactive warm
    static readonly Orange: RGB = { r: 255, g: 165, b: 0 }; // classic orange
    static readonly Mango: RGB = { r: 255, g: 166, b: 77 }; // decorative warm
    static readonly Sand: RGB = { r: 237, g: 201, b: 175 }; // sand beige, backgrounds
    static readonly colorSonos: RGB = { r: 216, g: 161, b: 88 }; // brand warm

    // ——— Yellows ———
    static readonly FireYellow: RGB = { r: 255, g: 201, b: 71 }; // warm emphasis
    static readonly FlameYellow: RGB = { r: 255, g: 220, b: 60 }; // bright highlight
    static readonly Sun: RGB = { r: 255, g: 223, b: 0 }; // sunny yellow
    static readonly On: RGB = { r: 253, g: 216, b: 53 }; // activated state (warm)
    static readonly MSYellow: RGB = { r: 255, g: 235, b: 156 }; // soft warn/info
    static readonly MenuLowInd: RGB = { r: 255, g: 235, b: 156 }; // menu low indicator
    static readonly Yellow: RGB = { r: 255, g: 255, b: 0 }; // peak indicator

    // ——— Greens ———
    static readonly Palm: RGB = { r: 0, g: 153, b: 76 }; // confirm/apply
    static readonly BatteryFull: RGB = { r: 96, g: 176, b: 62 }; // battery ok
    static readonly MSGreen: RGB = { r: 121, g: 222, b: 121 }; // soft success
    static readonly colorSpotify: RGB = { r: 30, g: 215, b: 96 }; // media active
    static readonly Mint: RGB = { r: 189, g: 252, b: 201 }; // subtle success bg
    static readonly Lime: RGB = { r: 173, g: 255, b: 47 }; // fresh success
    static readonly Green: RGB = { r: 0, g: 255, b: 0 }; // max OK / full

    // ——— Cyans / Blue-greens ———
    static readonly Turquoise: RGB = { r: 64, g: 224, b: 208 }; // decorative info
    static readonly colorAlexa: RGB = { r: 49, g: 196, b: 243 }; // voice assistant
    static readonly HMIOn: RGB = { r: 3, g: 169, b: 244 }; // CTA/primary active
    static readonly HMIOff: RGB = { r: 68, g: 115, b: 158 }; // inactive (cool)
    static readonly DarkHMIOff: RGB = { r: 54, g: 92, b: 126 }; // inactive (cool)
    static readonly TechMint: RGB = { r: 200, g: 255, b: 255 }; // clean info bg
    static readonly Cyan: RGB = { r: 0, g: 255, b: 255 }; // info/neutral progress

    // ——— Blues ———
    static readonly Ocean: RGB = { r: 0, g: 119, b: 190 }; // primary (cool)
    static readonly BlueLight: RGB = { r: 135, g: 206, b: 250 }; // light info
    static readonly TimeAccent: RGB = { r: 160, g: 200, b: 255 }; // time accent
    static readonly TimePrimary: RGB = { r: 220, g: 240, b: 255 }; // clock main
    static readonly Blue: RGB = { r: 0, g: 0, b: 255 }; // strong link/series
    static readonly TealBlue: RGB = { r: 0, g: 20, b: 156 }; // slightly brighter teal-blue
    static readonly BrightTealBlue: RGB = { r: 50, g: 30, b: 156 }; // brighter teal-blue with red tint
    static readonly GrayBlue: RGB = { r: 90, g: 90, b: 200 }; // softer gray-blue, ~30% lighter
    static readonly LightGrayBlue: RGB = { r: 130, g: 130, b: 230 }; // softer gray-blue, ~30% lighter

    // ——— Violets / Pinks ———
    static readonly Purple: RGB = { r: 128, g: 0, b: 128 }; // category/secondary
    static readonly Orchid: RGB = { r: 218, g: 112, b: 214 }; // decorative
    static readonly Violet: RGB = { r: 238, g: 130, b: 238 }; // secondary highlight
    static readonly Magenta: RGB = { r: 255, g: 0, b: 255 }; // attention/beta
    static readonly Pink: RGB = { r: 255, g: 192, b: 203 }; // soft badges

    // ——— Menu Icon Colors (unverändert, referenziert oben nach Farbwertnähe) ———
    static readonly Menu: RGB = { r: 150, g: 150, b: 100 }; // neutral menu icon
    static readonly MenuHighInd: RGB = { r: 251, g: 105, b: 98 }; // high indicator

    // ——— Dynamische Indikatoren (unverändert) ———
    static readonly colorScale0: RGB = { r: 99, g: 190, b: 123 };
    static readonly colorScale1: RGB = { r: 129, g: 199, b: 126 };
    static readonly colorScale2: RGB = { r: 161, g: 208, b: 127 };
    static readonly colorScale3: RGB = { r: 129, g: 217, b: 126 };
    static readonly colorScale4: RGB = { r: 222, g: 226, b: 131 };
    static readonly colorScale5: RGB = { r: 254, g: 235, b: 132 };
    static readonly colorScale6: RGB = { r: 255, g: 210, b: 129 };
    static readonly colorScale7: RGB = { r: 251, g: 185, b: 124 };
    static readonly colorScale8: RGB = { r: 251, g: 158, b: 117 };
    static readonly colorScale9: RGB = { r: 248, g: 131, b: 111 };
    static readonly colorScale10: RGB = { r: 248, g: 105, b: 107 };

    // ——— Screensaver Default Theme Colors (unverändert) ———
    static readonly scbackground: RGB = { r: 0, g: 0, b: 0 };
    static readonly scbackgroundInd1: RGB = { r: 255, g: 0, b: 0 };
    static readonly scbackgroundInd2: RGB = { r: 121, g: 222, b: 121 };
    static readonly scbackgroundInd3: RGB = { r: 255, g: 255, b: 0 };
    static readonly sctime: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctimeAMPM: RGB = { r: 255, g: 255, b: 255 };
    static readonly scdate: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctMainIcon: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctMainText: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctForecast1: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctForecast2: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctForecast3: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctForecast4: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctF1Icon: RGB = { r: 255, g: 235, b: 156 };
    static readonly sctF2Icon: RGB = { r: 255, g: 235, b: 156 };
    static readonly sctF3Icon: RGB = { r: 255, g: 235, b: 156 };
    static readonly sctF4Icon: RGB = { r: 255, g: 235, b: 156 };
    static readonly sctForecast1Val: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctForecast2Val: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctForecast3Val: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctForecast4Val: RGB = { r: 255, g: 255, b: 255 };
    static readonly scbar: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctMainIconAlt: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctMainTextAlt: RGB = { r: 255, g: 255, b: 255 };
    static readonly sctTimeAdd: RGB = { r: 255, g: 255, b: 255 };

    // ——— Auto-Weather-Colors (unverändert) ———
    static readonly swClearNight: RGB = { r: 150, g: 150, b: 100 };
    static readonly swCloudy: RGB = { r: 75, g: 75, b: 75 };
    static readonly swExceptional: RGB = { r: 255, g: 50, b: 50 };
    static readonly swFog: RGB = { r: 150, g: 150, b: 150 };
    static readonly swHail: RGB = { r: 200, g: 200, b: 200 };
    static readonly swLightning: RGB = { r: 200, g: 200, b: 0 };
    static readonly swLightningRainy: RGB = { r: 200, g: 200, b: 150 };
    static readonly swPartlycloudy: RGB = { r: 150, g: 150, b: 150 };
    static readonly swPouring: RGB = { r: 50, g: 50, b: 255 };
    static readonly swRainy: RGB = { r: 100, g: 100, b: 255 };
    static readonly swSnowy: RGB = { r: 150, g: 150, b: 150 };
    static readonly swSnowyRainy: RGB = { r: 150, g: 150, b: 255 };
    static readonly swSunny: RGB = { r: 255, g: 255, b: 0 };
    static readonly swWindy: RGB = { r: 150, g: 150, b: 150 };
    static getColorFromDefaultOrReturn(s: any): RGB | string {
        if (typeof s === 'string' && s && s.startsWith('default.color.from.start.')) {
            switch (s) {
                case 'default.color.from.start.good':
                    return Color.good;
                case 'default.color.from.start.bad':
                    return Color.bad;
                case 'default.color.from.start.true':
                    return Color.true;
                case 'default.color.from.start.false':
                    return Color.false;
                case 'default.color.from.start.activated':
                    return Color.activated;
                case 'default.color.from.start.deactivated':
                    return Color.deactivated;
                case 'default.color.from.start.attention':
                    return Color.attention;
                case 'default.color.from.start.info':
                    return Color.info;
                case 'default.color.from.start.option1':
                    return Color.option1;
                case 'default.color.from.start.option2':
                    return Color.option2;
                case 'default.color.from.start.option3':
                    return Color.option3;
                case 'default.color.from.start.option4':
                    return Color.option4;
                case 'default.color.from.start.open':
                    return Color.open;
                case 'default.color.from.start.close':
                    return Color.close;
                case 'default.color.from.start.hot':
                    return Color.hot;
                case 'default.color.from.start.cold':
                    return Color.cold;
                case 'default.color.from.start.on':
                    return Color.on;
                case 'default.color.from.start.off':
                    return Color.off;
                case 'default.color.from.start.light':
                    return Color.light;
                case 'default.color.from.start.dark':
                    return Color.dark;
                case 'default.color.from.start.warning':
                    return Color.warning;
                case 'default.color.from.start.success':
                    return Color.success;
                case 'default.color.from.start.neutral':
                    return Color.neutral;
                case 'default.color.from.start.background':
                    return Color.background;
                case 'default.color.from.start.highlight':
                    return Color.highlight;
                case 'default.color.from.start.disabled':
                    return Color.disabled;
                case 'default.color.from.start.navLeft':
                    return Color.navLeft;
                case 'default.color.from.start.navRight':
                    return Color.navRight;
                case 'default.color.from.start.navDownLeft':
                    return Color.navDownLeft;
                case 'default.color.from.start.navDownRight':
                    return Color.navDownRight;
                case 'default.color.from.start.navDown':
                    return Color.navDown;
                case 'default.color.from.start.navHome':
                    return Color.navHome;
                case 'default.color.from.start.navParent':
                    return Color.navParent;
                case 'default.color.from.start.sunny':
                    return Color.sunny;
                case 'default.color.from.start.partlyCloudy':
                    return Color.partlyCloudy;
                case 'default.color.from.start.cloudy':
                    return Color.cloudy;
                case 'default.color.from.start.fog':
                    return Color.fog;
                case 'default.color.from.start.hail':
                    return Color.hail;
                case 'default.color.from.start.lightning':
                    return Color.lightning;
                case 'default.color.from.start.lightningRainy':
                    return Color.lightningRainy;
                case 'default.color.from.start.pouring':
                    return Color.pouring;
                case 'default.color.from.start.rainy':
                    return Color.rainy;
                case 'default.color.from.start.snowy':
                    return Color.snowy;
                case 'default.color.from.start.snowyHeavy':
                    return Color.snowyHeavy;
                case 'default.color.from.start.snowyRainy':
                    return Color.snowyRainy;
                case 'default.color.from.start.windy':
                    return Color.windy;
                case 'default.color.from.start.tornado':
                    return Color.tornado;
                case 'default.color.from.start.clearNight':
                    return Color.clearNight;
                case 'default.color.from.start.exceptional':
                    return Color.exceptional;
                case 'default.color.from.start.foreground':
                    return Color.foreground;
                case 'default.color.from.start.fgTime':
                    return Color.fgTime;
                case 'default.color.from.start.fgTimeAmPm':
                    return Color.fgTimeAmPm;
                case 'default.color.from.start.fgDate':
                    return Color.fgDate;
                case 'default.color.from.start.fgMain':
                    return Color.fgMain;
                case 'default.color.from.start.fgMainAlt':
                    return Color.fgMainAlt;
                case 'default.color.from.start.fgTimeAdd':
                    return Color.fgTimeAdd;
                case 'default.color.from.start.fgForecast':
                    return Color.fgForecast;
                case 'default.color.from.start.fgBar':
                    return Color.fgBar;
                case 'default.color.from.start.solar':
                    return Color.solar;
                case 'default.color.from.start.temperature':
                    return Color.temperature;
                case 'default.color.from.start.gust':
                    return Color.gust;
                case 'default.color.from.start.sunrise':
                    return Color.sunrise;
                case 'default.color.from.start.sunset':
                    return Color.sunset;
                // Neue Media-spezifische Defaults
                case 'default.color.from.start.mediaArtistOn':
                    return Color.mediaArtistOn;
                case 'default.color.from.start.mediaArtistOff':
                    return Color.mediaArtistOff;
                case 'default.color.from.start.mediaTitleOn':
                    return Color.mediaTitleOn;
                case 'default.color.from.start.mediaTitleOff':
                    return Color.mediaTitleOff;
                case 'default.color.from.start.mediaOnOffColor':
                    return Color.mediaOnOffColor;
                default:
                    console.warn(`Color.getColorFromDefault: unknown default color ${s}`);
            }
        }
        return s;
    }

    // default
    static defaultTheme: ColorThemenInterface = {
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
        navLeft: Color.White,
        navRight: Color.White,
        navDownLeft: Color.White,
        navDownRight: Color.White,
        navDown: Color.White,
        navHome: Color.White,
        navParent: Color.White,
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
        mediaArtistOn: Color.Yellow,
        mediaArtistOff: Color.Gray,
        mediaTitleOn: Color.Yellow,
        mediaTitleOff: Color.Gray,
        mediaOnOffColor: Color.White,
    };

    // tropical
    static topicalTheme: ColorThemenInterface = {
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
        mediaOnOffColor: Color.Turquoise,
    };

    // technical
    static technicalTheme: ColorThemenInterface = {
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
        mediaOnOffColor: Color.Cyan,
    };

    // sunset
    static sunsetTheme: ColorThemenInterface = {
        good: Color.MSGreen,
        bad: Color.MSRed,
        true: Color.On,
        false: Color.Off,
        activated: Color.Yellow,
        deactivated: Color.Gray,
        attention: Color.colorRadio,
        info: Color.White,
        option1: Color.Red,
        option2: Color.Orange ?? { r: 255, g: 140, b: 0 },
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
        fgTimeAmPm: Color.Orange ?? { r: 255, g: 140, b: 0 },
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
        mediaOnOffColor: Color.Orange ?? { r: 255, g: 140, b: 0 },
    };

    // volcano
    static volcanoTheme: ColorThemenInterface = {
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

        background: Color.LavaCore, // jetzt feuriges Rot als Hintergrund
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

        fgTime: Color.FlameYellow, // Uhrzeit sehr strahlend
        fgTimeAmPm: Color.FireGlow, // AM/PM orange
        fgDate: Color.FireGlow, // Datum klar sichtbar (kräftiges Orange)
        fgMain: Color.White, // Haupttext neutral
        fgMainAlt: Color.FlameYellow, // alternative Haupttexte in Gelb
        fgTimeAdd: Color.FireGlow,
        fgForecast: Color.FlameYellow, // Forecast-Werte hellgelb für Kontrast
        fgBar: Color.AshGray,
        // Media-spezifisch
        mediaArtistOn: Color.LavaCore,
        mediaArtistOff: Color.AshGray,
        mediaTitleOn: Color.White,
        mediaTitleOff: Color.FlameYellow,
        mediaOnOffColor: Color.FireGlow,
    };

    /**
     * set color theme...
     *
     * @param s ColorThemenInterface
     */
    static setTheme(s: ColorThemenInterface): void {
        for (const a in s) {
            if (a) {
                const value = s[a as keyof ColorThemenInterface];
                if (value !== undefined) {
                    Color[a as keyof ColorThemenInterface] = value;
                }
            }
        }
    }

    static rgb_dec565(rgb: RGB): number {
        //return ((Math.floor(rgb.red / 255 * 31) << 11) | (Math.floor(rgb.green / 255 * 63) << 5) | (Math.floor(rgb.blue / 255 * 31)));
        return ((rgb.r >> 3) << 11) | ((rgb.g >> 2) << 5) | (rgb.b >> 3);
    }

    static decToRgb(decimal: number): RGB {
        return {
            r: ((decimal >> 11) << 3) & 0xff,
            g: ((decimal >> 5) << 2) & 0xff,
            b: (decimal << 3) & 0xff,
        };
    }

    static rgbHexToObject(rgb: string): RGB {
        const result: RGB = { r: 0, g: 0, b: 0 };
        if (rgb.startsWith('#') && rgb.length == 7) {
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
    static scale(number: number, inMin: number | null, inMax: number | null, outMin: number, outMax: number): number {
        if (inMax === null || inMin === null) {
            return number;
        }
        return outMax + outMin - (((number - inMax) * (outMax - outMin)) / (inMin - inMax) + outMin);
    }

    static mixColorHue(startRGB: RGB, endRGB: RGB, t: number, _options?: mixedOptions): RGB {
        const startHSB = colord(startRGB).toHsv();
        const endHSB = colord(endRGB).toHsv();

        t = Math.min(1, Math.max(0, t));

        // Hue muss über den kürzesten Weg interpoliert werden
        const deltaH = ((endHSB.h - startHSB.h + 540) % 360) - 180;
        const h = (startHSB.h + t * deltaH + 360) % 360;

        const s = startHSB.s + t * (endHSB.s - startHSB.s);
        const v = startHSB.v + t * (endHSB.v - startHSB.v);

        return colord({ h, s, v }).toRgb();
    }

    static HandleColorScale(valueScaletemp: string): number {
        switch (valueScaletemp) {
            case '0':
                return Color.rgb_dec565(Color.colorScale0);
            case '1':
                return Color.rgb_dec565(Color.colorScale1);
            case '2':
                return Color.rgb_dec565(Color.colorScale2);
            case '3':
                return Color.rgb_dec565(Color.colorScale3);
            case '4':
                return Color.rgb_dec565(Color.colorScale4);
            case '5':
                return Color.rgb_dec565(Color.colorScale5);
            case '6':
                return Color.rgb_dec565(Color.colorScale6);
            case '7':
                return Color.rgb_dec565(Color.colorScale7);
            case '8':
                return Color.rgb_dec565(Color.colorScale8);
            case '9':
                return Color.rgb_dec565(Color.colorScale9);
            case '10':
                return Color.rgb_dec565(Color.colorScale10);
            default:
                return Color.rgb_dec565(Color.colorScale10);
        }
    }
    static Interpolate(color1: RGB, color2: RGB, fraction: number): RGB {
        const r: number = Color.InterpolateNum(color1.r, color2.r, fraction);
        const g: number = Color.InterpolateNum(color1.g, color2.g, fraction);
        const b: number = Color.InterpolateNum(color1.b, color2.b, fraction);
        return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
    }

    static triGradAnchor(_from: RGB, _to: RGB, factor: number, _options?: mixedOptions): RGB {
        factor = _options?.anchorHigh ? (1 - factor) / 2 + 0.5 : factor / 2;
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
    static triGradColorScale(_from: RGB, _to: RGB, factor: number, _options?: mixedOptions): RGB {
        factor = Math.min(1, Math.max(0, factor));
        let r = 0;
        let g = 0;
        const b = 0;
        if (_options?.swap === true) {
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

    static quadriGradAnchor(_from: RGB, _to: RGB, factor: number, _options?: mixedOptions): RGB {
        factor = _options?.anchorHigh ? (1 - factor) / 2 + 0.5 : factor / 2;
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

    static quadriGradColorScale(_from: RGB, _to: RGB, factor: number, _options?: MixedOptions): RGB {
        // clamp 0..1
        let f = Math.min(1, Math.max(0, factor));

        if (_options?.swap) {
            f = 1 - f;
        }

        // Skala in 4 Segmente teilen: 0–0.25, 0.25–0.5, 0.5–0.75, 0.75–1
        const seg = Math.floor(f * 4);
        const local = f * 4 - seg; // 0..1 innerhalb des Segments

        let r = 0,
            g = 0,
            b = 0;

        switch (seg) {
            case 0: // Rot → Gelb
                r = 255;
                g = Math.round(255 * local);
                break;
            case 1: // Gelb → Grün
                g = 255;
                r = Math.round(255 * (1 - local));
                break;
            case 2: // Grün → Cyan
                g = 255;
                b = Math.round(255 * local);
                break;
            case 3: // Cyan → Blau
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
    static mixColorCie(c1: RGB, c2: RGB, r: number, _options?: mixedOptions): RGB {
        return colord(c1).mix(c2, r).toRgb();
    }

    /**
     *
     * @param c1 from this color
     * @param c2 to this
     * @param x 0-1 mix value
     * @param _options no use
     * @returns RGB
     */
    static mixColor(c1: RGB, c2: RGB, x: number, _options?: mixedOptions): RGB {
        const r = Math.round(c1.r + (c2.r - c1.r) * x);
        const g = Math.round(c1.g + (c2.g - c1.g) * x);
        const b = Math.round(c1.b + (c2.b - c1.b) * x);
        return { r, g, b };
    }
    static InterpolateNum(d1: number, d2: number, fraction: number): number {
        return d1 + (d2 - d1) * fraction;
    }
    static brightness(c: RGB, s: number): RGB {
        //s = Color.scale(s, 0, 1, 0, 0.6);
        let r = c.r * s;
        let g = c.g * s;
        let b = c.b * s;
        r = Math.min(255, Math.max(1, r));
        g = Math.min(255, Math.max(1, g));
        b = Math.min(255, Math.max(1, b));
        return { r, g, b };
    }

    static darken(c: RGB, s: number): RGB {
        s = Color.scale(s, 0, 1, 0, 0.5);
        return colord(c).darken(s).toRgb();
    }
    /**
     * Convert radians to degrees
     *
     * @param rad radians to convert, expects rad in range +/- PI per Math.atan2
     * @returns degrees equivalent of rad
     */
    static rad2deg(rad: number): number {
        return (360 + (180 * rad) / Math.PI) % 360;
    }

    static ColorToHex(color: number): string {
        const hexadecimal: string = color.toString(16);
        return hexadecimal.length == 1 ? `0${hexadecimal}` : hexadecimal;
    }

    static ConvertRGBtoHex(red: number, green: number, blue: number): string {
        return `#${Color.ColorToHex(red)}${Color.ColorToHex(green)}${Color.ColorToHex(blue)}`;
    }
    static ConvertWithColordtoRgb(colorName: string): RGB {
        return colord(colorName).toRgb();
    }
    static ConvertHexToRgb(hex: string): RGB {
        return {
            r: parseInt(hex.substring(1, 3), 16),
            g: parseInt(hex.substring(3, 5), 16),
            b: parseInt(hex.substring(5, 7), 16),
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
    static hsv2rgb(hue: number, saturation: number, value: number): [number, number, number] {
        const c = value * saturation; // chroma
        const h = (hue % 360) / 60; // Hue-Sektor [0..6)
        const x = c * (1 - Math.abs((h % 2) - 1));
        const m = value - c;

        let rgb: [number, number, number];
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
                break; // sector 5
        }

        // Offset addieren + 0–255 skalieren
        return rgb.map(v => Math.round((v + m) * 255)) as [number, number, number];
    }
    static hsv2RGB(hue: number, saturation: number, value: number): RGB {
        const arr = Color.hsv2rgb(hue, saturation, value);
        return { r: arr[0], g: arr[1], b: arr[2] };
    }

    static hsvtodec(hue: number | null, saturation: number, value: number): string | null {
        if (hue === null) {
            return null;
        }
        const result = Color.hsv2rgb(hue, saturation, value);
        return String(Color.rgb_dec565({ r: result[0], g: result[1], b: result[2] }));
    }

    static resultToRgb(r: string): RGB {
        const arr = r.split('|');
        return Color.pos_to_color(parseInt(arr[0]), parseInt(arr[1]));
    }
    static getHue(red: number, green: number, blue: number): number {
        const min = Math.min(red, green, blue);
        const max = Math.max(red, green, blue);
        const delta = max - min;

        if (delta === 0) {
            return 0;
        } // grau → kein Hue

        let hue: number;
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

    static pos_to_color(x: number, y: number): RGB {
        let r = 160 / 2;
        x = Math.round(((x - r) / r) * 100) / 100;
        y = Math.round(((r - y) / r) * 100) / 100;

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
    static rgb_to_cie(red: number, green: number, blue: number): string {
        //Apply a gamma correction to the RGB values, which makes the color more vivid and more the like the color displayed on the screen of your device
        const vred = red > 0.040_45 ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : red / 12.92;
        const vgreen = green > 0.040_45 ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : green / 12.92;
        const vblue = blue > 0.040_45 ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : blue / 12.92;

        //RGB values to XYZ using the Wide RGB D65 conversion formula
        const X = vred * 0.664_511 + vgreen * 0.154_324 + vblue * 0.162_028;
        const Y = vred * 0.283_881 + vgreen * 0.668_433 + vblue * 0.047_685;
        const Z = vred * 0.000_088 + vgreen * 0.072_31 + vblue * 0.986_039;

        //Calculate the xy values from the XYZ values
        const ciex = (X / (X + Y + Z)).toFixed(4);
        const ciey = (Y / (X + Y + Z)).toFixed(4);
        const cie = `[${ciex},${ciey}]`;

        return cie;
    }
    static isRGB(F: any): F is RGB {
        return typeof F == 'object' && 'r' in F && 'b' in F && 'g' in F;
    }

    static isHex(F: any): F is hex {
        return typeof F == 'string' && F.startsWith('#') && F.length == 7;
    }

    static isScriptRGB(F: any): F is ScriptConfig.RGB {
        return typeof F == 'object' && 'red' in F && 'blue' in F && 'green' in F;
    }

    static convertScriptRGBtoRGB(F: any): RGB {
        return { r: F.red, g: F.green, b: F.blue };
    }

    static isOldRGB(F: any): F is RGB {
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
    static readonly kelvinToRGB: { [key: number]: RGB } = {
        1000: { r: 255, g: 56, b: 0 },
        1100: { r: 255, g: 71, b: 0 },
        1200: { r: 255, g: 83, b: 0 },
        1300: { r: 255, g: 93, b: 0 },
        1400: { r: 255, g: 101, b: 0 },
        1500: { r: 255, g: 109, b: 0 },
        1600: { r: 255, g: 115, b: 0 },
        1700: { r: 255, g: 121, b: 0 },
        1800: { r: 255, g: 126, b: 0 },
        1900: { r: 255, g: 131, b: 0 },
        2000: { r: 255, g: 138, b: 18 },
        2100: { r: 255, g: 142, b: 33 },
        2200: { r: 255, g: 147, b: 44 },
        2300: { r: 255, g: 152, b: 54 },
        2400: { r: 255, g: 157, b: 63 },
        2500: { r: 255, g: 161, b: 72 },
        2600: { r: 255, g: 165, b: 79 },
        2700: { r: 255, g: 169, b: 87 },
        2800: { r: 255, g: 173, b: 94 },
        2900: { r: 255, g: 177, b: 101 },
        3000: { r: 255, g: 180, b: 107 },
        3100: { r: 255, g: 184, b: 114 },
        3200: { r: 255, g: 187, b: 120 },
        3300: { r: 255, g: 190, b: 126 },
        3400: { r: 255, g: 193, b: 132 },
        3500: { r: 255, g: 196, b: 137 },
        3600: { r: 255, g: 199, b: 143 },
        3700: { r: 255, g: 201, b: 148 },
        3800: { r: 255, g: 204, b: 153 },
        3900: { r: 255, g: 206, b: 159 },
        4000: { r: 255, g: 209, b: 163 },
        4100: { r: 255, g: 211, b: 168 },
        4200: { r: 255, g: 213, b: 173 },
        4300: { r: 255, g: 215, b: 177 },
        4400: { r: 255, g: 217, b: 182 },
        4500: { r: 255, g: 219, b: 186 },
        4600: { r: 255, g: 221, b: 190 },
        4700: { r: 255, g: 223, b: 194 },
        4800: { r: 255, g: 225, b: 198 },
        4900: { r: 255, g: 227, b: 202 },
        5000: { r: 255, g: 228, b: 206 },
        5100: { r: 255, g: 230, b: 210 },
        5200: { r: 255, g: 232, b: 213 },
        5300: { r: 255, g: 233, b: 217 },
        5400: { r: 255, g: 235, b: 220 },
        5500: { r: 255, g: 236, b: 224 },
        5600: { r: 255, g: 238, b: 227 },
        5700: { r: 255, g: 239, b: 230 },
        5800: { r: 255, g: 240, b: 233 },
        5900: { r: 255, g: 242, b: 236 },
        6000: { r: 255, g: 243, b: 239 },
        6100: { r: 255, g: 244, b: 242 },
        6200: { r: 255, g: 245, b: 245 },
        6300: { r: 255, g: 246, b: 247 },
        6400: { r: 255, g: 248, b: 251 },
        6500: { r: 255, g: 249, b: 253 },
        6600: { r: 254, g: 249, b: 255 },
        6700: { r: 252, g: 247, b: 255 },
        6800: { r: 249, g: 246, b: 255 },
        6900: { r: 247, g: 245, b: 255 },
        7000: { r: 245, g: 243, b: 255 },
        7100: { r: 243, g: 242, b: 255 },
        7200: { r: 240, g: 241, b: 255 },
        7300: { r: 239, g: 240, b: 255 },
        7400: { r: 237, g: 239, b: 255 },
        7500: { r: 235, g: 238, b: 255 },
        7600: { r: 233, g: 237, b: 255 },
        7700: { r: 231, g: 236, b: 255 },
        7800: { r: 230, g: 235, b: 255 },
        7900: { r: 228, g: 234, b: 255 },
        8000: { r: 227, g: 233, b: 255 },
        8100: { r: 225, g: 232, b: 255 },
        8200: { r: 224, g: 231, b: 255 },
        8300: { r: 222, g: 230, b: 255 },
        8400: { r: 221, g: 230, b: 255 },
        8500: { r: 220, g: 229, b: 255 },
        8600: { r: 218, g: 229, b: 255 },
        8700: { r: 217, g: 227, b: 255 },
        8800: { r: 216, g: 227, b: 255 },
        8900: { r: 215, g: 226, b: 255 },
        9000: { r: 214, g: 225, b: 255 },
        9100: { r: 212, g: 225, b: 255 },
        9200: { r: 211, g: 224, b: 255 },
        9300: { r: 210, g: 223, b: 255 },
        9400: { r: 209, g: 223, b: 255 },
        9500: { r: 208, g: 222, b: 255 },
        9600: { r: 207, g: 221, b: 255 },
        9700: { r: 207, g: 221, b: 255 },
        9800: { r: 206, g: 220, b: 255 },
        9900: { r: 205, g: 220, b: 255 },
        10_000: { r: 207, g: 218, b: 255 },
        10_100: { r: 207, g: 218, b: 255 },
        10_200: { r: 206, g: 217, b: 255 },
        10_300: { r: 205, g: 217, b: 255 },
        10_400: { r: 204, g: 216, b: 255 },
        10_500: { r: 204, g: 216, b: 255 },
        10_600: { r: 203, g: 215, b: 255 },
        10_700: { r: 202, g: 215, b: 255 },
        10_800: { r: 202, g: 214, b: 255 },
        10_900: { r: 201, g: 214, b: 255 },
        11_000: { r: 200, g: 213, b: 255 },
        11_100: { r: 200, g: 213, b: 255 },
        11_200: { r: 199, g: 212, b: 255 },
        11_300: { r: 198, g: 212, b: 255 },
        11_400: { r: 198, g: 212, b: 255 },
        11_500: { r: 197, g: 211, b: 255 },
        11_600: { r: 197, g: 211, b: 255 },
        11_700: { r: 197, g: 210, b: 255 },
        11_800: { r: 196, g: 210, b: 255 },
        11_900: { r: 195, g: 210, b: 255 },
        12_000: { r: 195, g: 209, b: 255 },
    };
}
