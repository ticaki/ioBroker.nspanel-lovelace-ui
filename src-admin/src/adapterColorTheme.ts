/**
 * Color theme of the adapter instance for the admin: default colors and color suggestions are taken
 * from it, so they match what the panel shows.
 */
import { Color, type ColorThemenInterface, type RGB } from '../../src/lib/const/Color';
import { ADAPTER_NAME } from '../../src/lib/types/adminShareConfig';

/** The part of the admin socket the theme is read with. */
export interface ColorThemeSocket {
    getObject: (id: string) => Promise<{ native?: Record<string, unknown> } | null | undefined>;
}

/**
 * Reads the color theme from the configuration of the adapter instance.
 *
 * @param socket Admin socket, may be missing
 * @param adapterName Name of the adapter
 * @param instance Number of the instance
 * @returns The theme of the instance, the default theme without socket or on an error
 */
export async function loadAdapterColorTheme(
    socket: ColorThemeSocket | null | undefined,
    adapterName: string = ADAPTER_NAME,
    instance: number | string = 0,
): Promise<ColorThemenInterface> {
    if (!socket) {
        return Color.defaultTheme;
    }
    try {
        const obj = await socket.getObject(`system.adapter.${adapterName}.${instance}`);
        return Color.getThemeFromNative(obj?.native);
    } catch {
        return Color.defaultTheme;
    }
}

/**
 * Resolves a color key to its color: first a key of the theme (`on`, `activated`, `open`), then a named
 * color of the Color class (`Green`, `Red`).
 *
 * @param theme Color theme
 * @param colorKey Key to resolve
 * @returns The color, null when the key names no color
 */
export function resolveThemeColor(theme: ColorThemenInterface, colorKey: string): RGB | null {
    for (const source of [theme, Color]) {
        const value: unknown = Reflect.get(source, colorKey);
        if (typeof value === 'object' && value !== null && Color.isRGB(value)) {
            return value;
        }
    }
    return null;
}

/**
 * Converts a color for a color field.
 *
 * @param color Color
 * @returns Hex color `#rrggbb`
 */
export function rgbToHex(color: RGB): string {
    return Color.ConvertRGBtoHex(color.r, color.g, color.b);
}

/**
 * The color of a key as hex color.
 *
 * @param theme Color theme
 * @param colorKey Key to resolve, see {@link resolveThemeColor}
 * @param fallback Color when the key names no color
 * @returns Hex color `#rrggbb`
 */
export function themeColorHex(theme: ColorThemenInterface, colorKey: string, fallback: RGB): string {
    return rgbToHex(resolveThemeColor(theme, colorKey) ?? fallback);
}
