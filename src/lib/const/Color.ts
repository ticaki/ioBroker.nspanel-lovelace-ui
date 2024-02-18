import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

extend([namesPlugin]);

import { RGB } from '../types/Color';

export const HMIOff: RGB = { r: 68, g: 115, b: 158 }; // Blue-Off - Original Entity Off
export const HMIOn: RGB = { r: 3, g: 169, b: 244 }; // Blue-On
export const HMIDark: RGB = { r: 29, g: 29, b: 29 }; // Original Background Color
export const Off: RGB = { r: 253, g: 128, b: 0 }; // Orange-Off - nicer color transitions
export const On: RGB = { r: 253, g: 216, b: 53 };
export const MSRed: RGB = { r: 251, g: 105, b: 98 };
export const MSYellow: RGB = { r: 255, g: 235, b: 156 };
export const MSGreen: RGB = { r: 121, g: 222, b: 121 };
export const Red: RGB = { r: 255, g: 0, b: 0 };
export const White: RGB = { r: 255, g: 255, b: 255 };
export const Yellow: RGB = { r: 255, g: 255, b: 0 };
export const Green: RGB = { r: 0, g: 255, b: 0 };
export const Blue: RGB = { r: 0, g: 0, b: 255 };
export const DarkBlue: RGB = { r: 0, g: 0, b: 136 };
export const Gray: RGB = { r: 136, g: 136, b: 136 };
export const Black: RGB = { r: 0, g: 0, b: 0 };
export const Cyan: RGB = { r: 0, g: 255, b: 255 };
export const Magenta: RGB = { r: 255, g: 0, b: 255 };
export const colorSpotify: RGB = { r: 30, g: 215, b: 96 };
export const colorAlexa: RGB = { r: 49, g: 196, b: 243 };
export const colorSonos: RGB = { r: 216, g: 161, b: 88 };
export const colorRadio: RGB = { r: 255, g: 127, b: 0 };
export const BatteryFull: RGB = { r: 96, g: 176, b: 62 };
export const BatteryEmpty: RGB = { r: 179, g: 45, b: 25 };

//Menu Icon Colors
export const Menu: RGB = { r: 150, g: 150, b: 100 };
export const MenuLowInd: RGB = { r: 255, g: 235, b: 156 };
export const MenuHighInd: RGB = { r: 251, g: 105, b: 98 };

//Dynamische Indikatoren (Abstufung grün nach gelb nach rot)
export const colorScale0: RGB = { r: 99, g: 190, b: 123 };
export const colorScale1: RGB = { r: 129, g: 199, b: 126 };
export const colorScale2: RGB = { r: 161, g: 208, b: 127 };
export const colorScale3: RGB = { r: 129, g: 217, b: 126 };
export const colorScale4: RGB = { r: 222, g: 226, b: 131 };
export const colorScale5: RGB = { r: 254, g: 235, b: 132 };
export const colorScale6: RGB = { r: 255, g: 210, b: 129 };
export const colorScale7: RGB = { r: 251, g: 185, b: 124 };
export const colorScale8: RGB = { r: 251, g: 158, b: 117 };
export const colorScale9: RGB = { r: 248, g: 131, b: 111 };
export const colorScale10: RGB = { r: 248, g: 105, b: 107 };

//Screensaver Default Theme Colors
export const scbackground: RGB = { r: 0, g: 0, b: 0 };
export const scbackgroundInd1: RGB = { r: 255, g: 0, b: 0 };
export const scbackgroundInd2: RGB = { r: 121, g: 222, b: 121 };
export const scbackgroundInd3: RGB = { r: 255, g: 255, b: 0 };
export const sctime: RGB = { r: 255, g: 255, b: 255 };
export const sctimeAMPM: RGB = { r: 255, g: 255, b: 255 };
export const scdate: RGB = { r: 255, g: 255, b: 255 };
export const sctMainIcon: RGB = { r: 255, g: 255, b: 255 };
export const sctMainText: RGB = { r: 255, g: 255, b: 255 };
export const sctForecast1: RGB = { r: 255, g: 255, b: 255 };
export const sctForecast2: RGB = { r: 255, g: 255, b: 255 };
export const sctForecast3: RGB = { r: 255, g: 255, b: 255 };
export const sctForecast4: RGB = { r: 255, g: 255, b: 255 };
export const sctF1Icon: RGB = { r: 255, g: 235, b: 156 };
export const sctF2Icon: RGB = { r: 255, g: 235, b: 156 };
export const sctF3Icon: RGB = { r: 255, g: 235, b: 156 };
export const sctF4Icon: RGB = { r: 255, g: 235, b: 156 };
export const sctForecast1Val: RGB = { r: 255, g: 255, b: 255 };
export const sctForecast2Val: RGB = { r: 255, g: 255, b: 255 };
export const sctForecast3Val: RGB = { r: 255, g: 255, b: 255 };
export const sctForecast4Val: RGB = { r: 255, g: 255, b: 255 };
export const scbar: RGB = { r: 255, g: 255, b: 255 };
export const sctMainIconAlt: RGB = { r: 255, g: 255, b: 255 };
export const sctMainTextAlt: RGB = { r: 255, g: 255, b: 255 };
export const sctTimeAdd: RGB = { r: 255, g: 255, b: 255 };

//Auto-Weather-Colors
export const swClearNight: RGB = { r: 150, g: 150, b: 100 };
export const swCloudy: RGB = { r: 75, g: 75, b: 75 };
export const swExceptional: RGB = { r: 255, g: 50, b: 50 };
export const swFog: RGB = { r: 150, g: 150, b: 150 };
export const swHail: RGB = { r: 200, g: 200, b: 200 };
export const swLightning: RGB = { r: 200, g: 200, b: 0 };
export const swLightningRainy: RGB = { r: 200, g: 200, b: 150 };
export const swPartlycloudy: RGB = { r: 150, g: 150, b: 150 };
export const swPouring: RGB = { r: 50, g: 50, b: 255 };
export const swRainy: RGB = { r: 100, g: 100, b: 255 };
export const swSnowy: RGB = { r: 150, g: 150, b: 150 };
export const swSnowyRainy: RGB = { r: 150, g: 150, b: 255 };
export const swSunny: RGB = { r: 255, g: 255, b: 0 };
export const swWindy: RGB = { r: 150, g: 150, b: 150 };

//const defaultOnColor = HMIOn;
//const defaultOffColor = HMIOff;

export function rgb_dec565(rgb: RGB): number {
    //return ((Math.floor(rgb.red / 255 * 31) << 11) | (Math.floor(rgb.green / 255 * 63) << 5) | (Math.floor(rgb.blue / 255 * 31)));
    return ((rgb.r >> 3) << 11) | ((rgb.g >> 2) << 5) | (rgb.b >> 3);
}

export function decToRgb(decimal: number): RGB {
    return {
        r: ((decimal >> 11) << 3) & 0xff,
        g: ((decimal >> 5) << 2) & 0xff,
        b: (decimal << 3) & 0xff,
    };
}

export function rgbHexToObject(rgb: string): RGB {
    const result: RGB = { r: 0, g: 0, b: 0 };
    if (rgb.startsWith('#') && rgb.length == 7) {
        result.r = parseInt(rgb.substring(1, 3), 16);
        result.g = parseInt(rgb.substring(3, 5), 16);
        result.b = parseInt(rgb.substring(5), 16);
    }
    return result;
}

export function scale(
    number: number,
    inMax: number | null,
    inMin: number | null,
    outMin: number,
    outMax: number,
): number {
    if (inMin === null || inMax === null) return number;
    return outMax + outMin - (((number - inMax) * (outMax - outMin)) / (inMin - inMax) + outMin);
}

export function HandleColorScale(valueScaletemp: string): number {
    switch (valueScaletemp) {
        case '0':
            return rgb_dec565(colorScale0);
        case '1':
            return rgb_dec565(colorScale1);
        case '2':
            return rgb_dec565(colorScale2);
        case '3':
            return rgb_dec565(colorScale3);
        case '4':
            return rgb_dec565(colorScale4);
        case '5':
            return rgb_dec565(colorScale5);
        case '6':
            return rgb_dec565(colorScale6);
        case '7':
            return rgb_dec565(colorScale7);
        case '8':
            return rgb_dec565(colorScale8);
        case '9':
            return rgb_dec565(colorScale9);
        case '10':
            return rgb_dec565(colorScale10);
        default:
            return rgb_dec565(colorScale10);
    }
}
export function Interpolate(color1: RGB, color2: RGB, fraction: number): RGB {
    const r: number = InterpolateNum(color1.r, color2.r, fraction);
    const g: number = InterpolateNum(color1.g, color2.g, fraction);
    const b: number = InterpolateNum(color1.b, color2.b, fraction);
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

export function InterpolateNum(d1: number, d2: number, fraction: number): number {
    return d1 + (d2 - d1) * fraction;
}

export function darken(c: RGB, s: number): RGB {
    s = scale(s, 0, 1, 0, 0.6);
    return colord(c).darken(s).toRgb();
}
/**
 * Convert radians to degrees
 * @param rad radians to convert, expects rad in range +/- PI per Math.atan2
 * @returns {number} degrees equivalent of rad
 */
export function rad2deg(rad: number): number {
    return (360 + (180 * rad) / Math.PI) % 360;
}

export function ColorToHex(color: number): string {
    const hexadecimal: string = color.toString(16);
    return hexadecimal.length == 1 ? '0' + hexadecimal : hexadecimal;
}

export function ConvertRGBtoHex(red: number, green: number, blue: number): string {
    return '#' + ColorToHex(red) + ColorToHex(green) + ColorToHex(blue);
}
export function ConvertNametoRgb(colorName: string): RGB {
    return colord(colorName).toRgb();
}
export function ConvertHexToRgb(hex: string): RGB {
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
export function hsv2rgb(hue: number, saturation: number, value: number): [number, number, number] {
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
export function hsv2RGB(hue: number, saturation: number, value: number): RGB {
    const arr = hsv2rgb(hue, saturation, value);
    return { r: arr[0], g: arr[1], b: arr[2] };
}

export function hsvtodec(hue: number | null, saturation: number, value: number): string | null {
    if (hue === null) return null;
    const result = hsv2rgb(hue, saturation, value);
    return String(rgb_dec565({ r: result[0], g: result[1], b: result[2] }));
}

export function resultToRgb(r: string): RGB {
    const arr = r.split('|');
    return pos_to_color(parseInt(arr[0]), parseInt(arr[1]));
}
export function getHue(red: number, green: number, blue: number): number {
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

export function pos_to_color(x: number, y: number): RGB {
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

    const hsv = rad2deg(Math.atan2(y, x));
    const rgb = hsv2rgb(hsv, sat, 1);

    return { r: Math.round(rgb[0]), g: Math.round(rgb[1]), b: Math.round(rgb[2]) };
}

/**
 *
 * @param red
 * @param green
 * @param blue
 * @returns
 */
export function rgb_to_cie(red: number, green: number, blue: number): string {
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
export function isRGB(F: RGB | any): F is RGB {
    return typeof F == 'object' && 'r' in F && 'b' in F && 'g' in F;
}
export function isOldRGB(F: RGB | any): F is RGB {
    return typeof F == 'object' && 'r' in F && 'b' in F && 'g' in F;
}
/*
export function getBlendedColorfunction(color: RGB | null, percent: number) {
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
export const kelvinToRGB: { [key: number]: RGB } = {
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
