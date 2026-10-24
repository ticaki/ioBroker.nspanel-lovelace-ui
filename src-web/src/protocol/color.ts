export interface RGB {
    r: number;
    g: number;
    b: number;
}

/**
 * Converts a RGB565 value (the colour format of the Nextion display, sent as decimal
 * number) to 8 bit RGB. The 5/6 bit channels are expanded to the full 0-255 range, so
 * 65535 becomes pure white and 0 pure black.
 *
 * @param value the RGB565 value
 */
export function color565ToRgb(value: number): RGB {
    const v = Math.max(0, Math.min(65535, Math.trunc(value)));
    const r5 = (v >> 11) & 0x1f;
    const g6 = (v >> 5) & 0x3f;
    const b5 = v & 0x1f;
    return {
        r: Math.round((r5 * 255) / 31),
        g: Math.round((g6 * 255) / 63),
        b: Math.round((b5 * 255) / 31),
    };
}

/** Inverse of {@link color565ToRgb}, same formula as `Color.rgb_dec565` in the adapter */
export function rgbToColor565(rgb: RGB): number {
    return ((rgb.r >> 3) << 11) | ((rgb.g >> 2) << 5) | (rgb.b >> 3);
}

/**
 * Converts a RGB565 field to a css colour. An empty or invalid field gives `fallback`.
 *
 * @param value the field (decimal number or string)
 * @param fallback css colour used for invalid input, white by default
 */
export function color565ToCss(value: number | string | undefined, fallback = '#ffffff'): string {
    const n = typeof value === 'number' ? value : value === undefined || value === '' ? NaN : Number(value);
    if (!Number.isFinite(n)) {
        return fallback;
    }
    const { r, g, b } = color565ToRgb(n);
    return `rgb(${r}, ${g}, ${b})`;
}
