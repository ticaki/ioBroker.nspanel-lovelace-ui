import { RGB } from './types';

export const HMIOff: RGB = { red: 68, green: 115, blue: 158 }; // Blue-Off - Original Entity Off
export const HMIOn: RGB = { red: 3, green: 169, blue: 244 }; // Blue-On
export const HMIDark: RGB = { red: 29, green: 29, blue: 29 }; // Original Background Color
export const Off: RGB = { red: 253, green: 128, blue: 0 }; // Orange-Off - nicer color transitions
export const On: RGB = { red: 253, green: 216, blue: 53 };
export const MSRed: RGB = { red: 251, green: 105, blue: 98 };
export const MSYellow: RGB = { red: 255, green: 235, blue: 156 };
export const MSGreen: RGB = { red: 121, green: 222, blue: 121 };
export const Red: RGB = { red: 255, green: 0, blue: 0 };
export const White: RGB = { red: 255, green: 255, blue: 255 };
export const Yellow: RGB = { red: 255, green: 255, blue: 0 };
export const Green: RGB = { red: 0, green: 255, blue: 0 };
export const Blue: RGB = { red: 0, green: 0, blue: 255 };
export const DarkBlue: RGB = { red: 0, green: 0, blue: 136 };
export const Gray: RGB = { red: 136, green: 136, blue: 136 };
export const Black: RGB = { red: 0, green: 0, blue: 0 };
export const Cyan: RGB = { red: 0, green: 255, blue: 255 };
export const Magenta: RGB = { red: 255, green: 0, blue: 255 };
export const colorSpotify: RGB = { red: 30, green: 215, blue: 96 };
export const colorAlexa: RGB = { red: 49, green: 196, blue: 243 };
export const colorSonos: RGB = { red: 216, green: 161, blue: 88 };
export const colorRadio: RGB = { red: 255, green: 127, blue: 0 };
export const BatteryFull: RGB = { red: 96, green: 176, blue: 62 };
export const BatteryEmpty: RGB = { red: 179, green: 45, blue: 25 };

//Menu Icon Colors
export const Menu: RGB = { red: 150, green: 150, blue: 100 };
export const MenuLowInd: RGB = { red: 255, green: 235, blue: 156 };
export const MenuHighInd: RGB = { red: 251, green: 105, blue: 98 };

//Dynamische Indikatoren (Abstufung grün nach gelb nach rot)
export const colorScale0: RGB = { red: 99, green: 190, blue: 123 };
export const colorScale1: RGB = { red: 129, green: 199, blue: 126 };
export const colorScale2: RGB = { red: 161, green: 208, blue: 127 };
export const colorScale3: RGB = { red: 129, green: 217, blue: 126 };
export const colorScale4: RGB = { red: 222, green: 226, blue: 131 };
export const colorScale5: RGB = { red: 254, green: 235, blue: 132 };
export const colorScale6: RGB = { red: 255, green: 210, blue: 129 };
export const colorScale7: RGB = { red: 251, green: 185, blue: 124 };
export const colorScale8: RGB = { red: 251, green: 158, blue: 117 };
export const colorScale9: RGB = { red: 248, green: 131, blue: 111 };
export const colorScale10: RGB = { red: 248, green: 105, blue: 107 };

//Screensaver Default Theme Colors
export const scbackground: RGB = { red: 0, green: 0, blue: 0 };
export const scbackgroundInd1: RGB = { red: 255, green: 0, blue: 0 };
export const scbackgroundInd2: RGB = { red: 121, green: 222, blue: 121 };
export const scbackgroundInd3: RGB = { red: 255, green: 255, blue: 0 };
export const sctime: RGB = { red: 255, green: 255, blue: 255 };
export const sctimeAMPM: RGB = { red: 255, green: 255, blue: 255 };
export const scdate: RGB = { red: 255, green: 255, blue: 255 };
export const sctMainIcon: RGB = { red: 255, green: 255, blue: 255 };
export const sctMainText: RGB = { red: 255, green: 255, blue: 255 };
export const sctForecast1: RGB = { red: 255, green: 255, blue: 255 };
export const sctForecast2: RGB = { red: 255, green: 255, blue: 255 };
export const sctForecast3: RGB = { red: 255, green: 255, blue: 255 };
export const sctForecast4: RGB = { red: 255, green: 255, blue: 255 };
export const sctF1Icon: RGB = { red: 255, green: 235, blue: 156 };
export const sctF2Icon: RGB = { red: 255, green: 235, blue: 156 };
export const sctF3Icon: RGB = { red: 255, green: 235, blue: 156 };
export const sctF4Icon: RGB = { red: 255, green: 235, blue: 156 };
export const sctForecast1Val: RGB = { red: 255, green: 255, blue: 255 };
export const sctForecast2Val: RGB = { red: 255, green: 255, blue: 255 };
export const sctForecast3Val: RGB = { red: 255, green: 255, blue: 255 };
export const sctForecast4Val: RGB = { red: 255, green: 255, blue: 255 };
export const scbar: RGB = { red: 255, green: 255, blue: 255 };
export const sctMainIconAlt: RGB = { red: 255, green: 255, blue: 255 };
export const sctMainTextAlt: RGB = { red: 255, green: 255, blue: 255 };
export const sctTimeAdd: RGB = { red: 255, green: 255, blue: 255 };

//Auto-Weather-Colors
export const swClearNight: RGB = { red: 150, green: 150, blue: 100 };
export const swCloudy: RGB = { red: 75, green: 75, blue: 75 };
export const swExceptional: RGB = { red: 255, green: 50, blue: 50 };
export const swFog: RGB = { red: 150, green: 150, blue: 150 };
export const swHail: RGB = { red: 200, green: 200, blue: 200 };
export const swLightning: RGB = { red: 200, green: 200, blue: 0 };
export const swLightningRainy: RGB = { red: 200, green: 200, blue: 150 };
export const swPartlycloudy: RGB = { red: 150, green: 150, blue: 150 };
export const swPouring: RGB = { red: 50, green: 50, blue: 255 };
export const swRainy: RGB = { red: 100, green: 100, blue: 255 };
export const swSnowy: RGB = { red: 150, green: 150, blue: 150 };
export const swSnowyRainy: RGB = { red: 150, green: 150, blue: 255 };
export const swSunny: RGB = { red: 255, green: 255, blue: 0 };
export const swWindy: RGB = { red: 150, green: 150, blue: 150 };

export function rgb_dec565(rgb: RGB): number {
    //return ((Math.floor(rgb.red / 255 * 31) << 11) | (Math.floor(rgb.green / 255 * 63) << 5) | (Math.floor(rgb.blue / 255 * 31)));
    return ((rgb.red >> 3) << 11) | ((rgb.green >> 2) << 5) | (rgb.blue >> 3);
}

export function rgbHexToObject(rgb: string): RGB {
    const result = { red: 0, green: 0, blue: 0 };
    if (rgb.startsWith('#') && rgb.length == 7) {
        result.red = parseInt(rgb.substring(1, 3), 16);
        result.green = parseInt(rgb.substring(3, 5), 16);
        result.blue = parseInt(rgb.substring(5), 16);
    }
    return result;
}
