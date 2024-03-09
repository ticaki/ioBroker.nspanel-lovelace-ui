import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import mixPlugin from 'colord/plugins/mix';

extend([namesPlugin, mixPlugin]);

export type RGB = {
    r: number;
    g: number;
    b: number;
};

export interface ColorThemenInterface {
    good: RGB;
    bad: RGB;
    true: RGB;
    false: RGB;
    activated: RGB;
    deactivated: RGB;
    attention: RGB;
    info: RGB;
}

export class Color {
    static readonly HMIOff: RGB = { r: 68, g: 115, b: 158 }; // Blue-Off - Original Entity Off
    static readonly HMIOn: RGB = { r: 3, g: 169, b: 244 }; // Blue-On
    static readonly HMIDark: RGB = { r: 29, g: 29, b: 29 }; // Original Background Color
    static readonly Off: RGB = { r: 253, g: 128, b: 0 }; // Orange-Off - nicer color transitions
    static readonly On: RGB = { r: 253, g: 216, b: 53 };
    static readonly MSRed: RGB = { r: 251, g: 105, b: 98 };
    static readonly MSYellow: RGB = { r: 255, g: 235, b: 156 };
    static readonly MSGreen: RGB = { r: 121, g: 222, b: 121 };
    static readonly Red: RGB = { r: 255, g: 0, b: 0 };
    static readonly White: RGB = { r: 255, g: 255, b: 255 };
    static readonly Yellow: RGB = { r: 255, g: 255, b: 0 };
    static readonly Green: RGB = { r: 0, g: 255, b: 0 };
    static readonly Blue: RGB = { r: 0, g: 0, b: 255 };
    static readonly DarkBlue: RGB = { r: 0, g: 0, b: 136 };
    static readonly Gray: RGB = { r: 136, g: 136, b: 136 };
    static readonly Black: RGB = { r: 0, g: 0, b: 0 };
    static readonly Cyan: RGB = { r: 0, g: 255, b: 255 };
    static readonly Magenta: RGB = { r: 255, g: 0, b: 255 };
    static readonly colorSpotify: RGB = { r: 30, g: 215, b: 96 };
    static readonly colorAlexa: RGB = { r: 49, g: 196, b: 243 };
    static readonly colorSonos: RGB = { r: 216, g: 161, b: 88 };
    static readonly colorRadio: RGB = { r: 255, g: 127, b: 0 };
    static readonly BatteryFull: RGB = { r: 96, g: 176, b: 62 };
    static readonly BatteryEmpty: RGB = { r: 179, g: 45, b: 25 };

    //Menu Icon Colors
    static readonly Menu: RGB = { r: 150, g: 150, b: 100 };
    static readonly MenuLowInd: RGB = { r: 255, g: 235, b: 156 };
    static readonly MenuHighInd: RGB = { r: 251, g: 105, b: 98 };

    //Dynamische Indikatoren (Abstufung grün nach gelb nach rot)
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

    //Screensaver Default Theme Colors
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

    //Auto-Weather-Colors
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

    static good: RGB | string = 'default.color.from.start.good';
    static bad: RGB | string = 'default.color.from.start.bad';
    static true: RGB | string = 'default.color.from.start.true';
    static false: RGB | string = 'default.color.from.start.false';
    static activated: RGB | string = 'default.color.from.start.activated';
    static deactivated: RGB | string = 'default.color.from.start.deactivated';
    static attention: RGB | string = 'default.color.from.start.attention';
    static info: RGB | string = 'default.color.from.start.info';

    static getColorFromDefault(s: any): RGB | string {
        if (typeof s === 'string') {
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
            }
        }
        return s;
    }
    static currentTheme: ColorThemenInterface = {
        good: Color.Green,
        bad: Color.Red,
        true: Color.Green,
        false: Color.Red,
        activated: Color.Yellow,
        deactivated: Color.Gray,
        attention: Color.Cyan,
        info: Color.White,
    };

    /**
     * set color theme...
     * @param s
     */
    static setTheme(s: ColorThemenInterface): void {
        Color.good = s.good;
        Color.bad = s.bad;
        Color.true = s.true;
        Color.false = s.false;
        Color.activated = s.activated;
        Color.deactivated = s.deactivated;
        Color.attention = s.attention;
        Color.info = s.info;
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

    static scale(number: number, inMax: number | null, inMin: number | null, outMin: number, outMax: number): number {
        if (inMin === null || inMax === null) return number;
        return outMax + outMin - (((number - inMax) * (outMax - outMin)) / (inMin - inMax) + outMin);
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

    /**
     *
     * @param c1 from this color
     * @param c2 to this
     * @param r 0-1 mix value
     * @returns RGB
     */
    static mixColor(c1: RGB, c2: RGB, r: number): RGB {
        return colord(c1).mix(c2, r).toRgb();
    }
    static InterpolateNum(d1: number, d2: number, fraction: number): number {
        return d1 + (d2 - d1) * fraction;
    }

    static darken(c: RGB, s: number): RGB {
        s = Color.scale(s, 0, 1, 0, 0.6);
        return colord(c).darken(s).toRgb();
    }
    /**
     * Convert radians to degrees
     * @param rad radians to convert, expects rad in range +/- PI per Math.atan2
     * @returns {number} degrees equivalent of rad
     */
    static rad2deg(rad: number): number {
        return (360 + (180 * rad) / Math.PI) % 360;
    }

    static ColorToHex(color: number): string {
        const hexadecimal: string = color.toString(16);
        return hexadecimal.length == 1 ? '0' + hexadecimal : hexadecimal;
    }

    static ConvertRGBtoHex(red: number, green: number, blue: number): string {
        return '#' + Color.ColorToHex(red) + Color.ColorToHex(green) + Color.ColorToHex(blue);
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
     * @param hue in range [0, 360]
     * @param saturation in range 0 to 1
     * @param value in range 0 to 1
     * @returns {[number, number, number]} [r, g,b] in range 0 to 255
     */
    static hsv2rgb(hue: number, saturation: number, value: number): [number, number, number] {
        hue /= 60;
        const chroma = value * saturation;
        const x = chroma * (1 - Math.abs((hue % 2) - 1));
        const rgb: [number, number, number] =
            hue <= 1
                ? [chroma, x, 0]
                : hue <= 2
                  ? [x, chroma, 0]
                  : hue <= 3
                    ? [0, chroma, x]
                    : hue <= 4
                      ? [0, x, chroma]
                      : hue <= 5
                        ? [x, 0, chroma]
                        : [chroma, 0, x];

        return rgb.map((v) => (v + value - chroma) * 255) as [number, number, number];
    }
    static hsv2RGB(hue: number, saturation: number, value: number): RGB {
        const arr = Color.hsv2rgb(hue, saturation, value);
        return { r: arr[0], g: arr[1], b: arr[2] };
    }

    static hsvtodec(hue: number | null, saturation: number, value: number): string | null {
        if (hue === null) return null;
        const result = Color.hsv2rgb(hue, saturation, value);
        return String(Color.rgb_dec565({ r: result[0], g: result[1], b: result[2] }));
    }

    static resultToRgb(r: string): RGB {
        const arr = r.split('|');
        return Color.pos_to_color(parseInt(arr[0]), parseInt(arr[1]));
    }
    static getHue(red: number, green: number, blue: number): number {
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
        if (hue < 0) hue = hue + 360;

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
     *
     * @param red
     * @param green
     * @param blue
     * @returns
     */
    static rgb_to_cie(red: number, green: number, blue: number): string {
        //Apply a gamma correction to the RGB values, which makes the color more vivid and more the like the color displayed on the screen of your device
        const vred = red > 0.04045 ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : red / 12.92;
        const vgreen = green > 0.04045 ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : green / 12.92;
        const vblue = blue > 0.04045 ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : blue / 12.92;

        //RGB values to XYZ using the Wide RGB D65 conversion formula
        const X = vred * 0.664511 + vgreen * 0.154324 + vblue * 0.162028;
        const Y = vred * 0.283881 + vgreen * 0.668433 + vblue * 0.047685;
        const Z = vred * 0.000088 + vgreen * 0.07231 + vblue * 0.986039;

        //Calculate the xy values from the XYZ values
        const ciex = (X / (X + Y + Z)).toFixed(4);
        const ciey = (Y / (X + Y + Z)).toFixed(4);
        const cie = '[' + ciex + ',' + ciey + ']';

        return cie;
    }
    static isRGB(F: RGB | any): F is RGB {
        return typeof F == 'object' && 'r' in F && 'b' in F && 'g' in F;
    }
    static isOldRGB(F: RGB | any): F is RGB {
        return typeof F == 'object' && 'r' in F && 'b' in F && 'g' in F;
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
        10000: { r: 207, g: 218, b: 255 },
        10100: { r: 207, g: 218, b: 255 },
        10200: { r: 206, g: 217, b: 255 },
        10300: { r: 205, g: 217, b: 255 },
        10400: { r: 204, g: 216, b: 255 },
        10500: { r: 204, g: 216, b: 255 },
        10600: { r: 203, g: 215, b: 255 },
        10700: { r: 202, g: 215, b: 255 },
        10800: { r: 202, g: 214, b: 255 },
        10900: { r: 201, g: 214, b: 255 },
        11000: { r: 200, g: 213, b: 255 },
        11100: { r: 200, g: 213, b: 255 },
        11200: { r: 199, g: 212, b: 255 },
        11300: { r: 198, g: 212, b: 255 },
        11400: { r: 198, g: 212, b: 255 },
        11500: { r: 197, g: 211, b: 255 },
        11600: { r: 197, g: 211, b: 255 },
        11700: { r: 197, g: 210, b: 255 },
        11800: { r: 196, g: 210, b: 255 },
        11900: { r: 195, g: 210, b: 255 },
        12000: { r: 195, g: 209, b: 255 },
    };
}
