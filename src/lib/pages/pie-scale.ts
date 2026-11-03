/**
 * Pure helpers of the pie chart page (cardPChart, TFT 6.0.5).
 *
 * Contract of the panel:
 * - from field 17 on every slice takes four fields `Name~Number~Value text~Color`, at most six slices,
 *   everything after the sixth is ignored, the panel never sums anything up;
 * - the number is an integer >= 0 and only sets the size of the slice, negative numbers become 0 in the
 *   panel; the panel multiplies the sum by 720 in 32 bit, so the sum has to stay below 2 000 000;
 * - the percentages are computed by the panel, the value text is printed as it is;
 * - `~` is the field separator and must not appear in any field.
 */

import { Color } from '../const/Color';
import { PCHART_MAX_SLICES } from '../types/adminShareConfig';

/** one slice as the page sends it */
export type PieSlice = {
    /** legend name, no `~` */
    name: string;
    /** size of the slice, integer >= 0 and scaled so that the sum fits the panel */
    value: number;
    /** finished value text, e.g. `5.20 kWh`, no `~` */
    text: string;
    /** RGB565 as decimal string */
    color: string;
};

/** a slice before scaling: the raw number as read from the state or the string */
export type PieSliceInput = Omit<PieSlice, 'value'> & { value: number };

/** the slice numbers are scaled to about this sum (panel limit: below 2 000 000) */
export const PIE_TARGET_SUM = 1_000_000;

/**
 * Removes the field separator from a text that goes into the payload.
 *
 * @param text any text
 */
export function sanitizePieText(text: string | null | undefined): string {
    return (text ?? '').replace(/~/g, '-').trim();
}

/**
 * Scales the raw numbers to integers whose sum is about PIE_TARGET_SUM: a constant factor keeps the
 * proportions, rounding never drops a positive value to 0. Negative, NaN and infinite values count as 0.
 * All zero: the values stay 0 (the panel then shows the legend without a pie).
 *
 * @param values raw numbers in slice order
 */
export function scalePieValues(values: readonly number[]): number[] {
    const clean = values.map(v => (Number.isFinite(v) && v > 0 ? v : 0));
    const sum = clean.reduce((a, b) => a + b, 0);
    if (sum <= 0) {
        return clean.map(() => 0);
    }
    const factor = PIE_TARGET_SUM / sum;
    return clean.map(v => (v > 0 ? Math.max(1, Math.round(v * factor)) : 0));
}

/**
 * Value text of a slice: the number with the given decimals and the unit, e.g. `5.20 kWh`.
 *
 * @param value raw number
 * @param decimals decimal places, 0-10
 * @param unit unit, empty = none
 */
export function formatPieValueText(value: number, decimals: number, unit: string | undefined): string {
    const d = Number.isFinite(decimals) ? Math.min(10, Math.max(0, Math.round(decimals))) : 2;
    const n = Number.isFinite(value) ? value : 0;
    const u = sanitizePieText(unit);
    return sanitizePieText(`${n.toFixed(d)}${u ? ` ${u}` : ''}`);
}

/**
 * Color field of a slice as RGB565 decimal: a decimal number is passed through, a hex or css color is
 * converted, anything else falls back to white.
 *
 * @param color `63488`, `#ff0000` or a color name
 */
export function pieColorToDec(color: string | null | undefined): string {
    const c = (color ?? '').trim();
    if (/^\d+$/.test(c)) {
        return String(Math.min(65_535, parseInt(c, 10)));
    }
    if (c) {
        const rgb = Color.ConvertWithColordtoRgb(c);
        if (Color.isRGB(rgb)) {
            return String(Color.rgb_dec565(rgb));
        }
    }
    return String(Color.rgb_dec565(Color.White));
}

/**
 * Parses the text of the script data point (format of the old NSPanel script): `Name~Number~Value text~Color~…`, four fields per
 * slice, an incomplete last group is dropped. More than PCHART_MAX_SLICES slices: the sixth and all
 * following are summed up as one slice named `otherName` with an empty value text and the color of the
 * sixth. The numbers are not scaled here, see finishPieSlices.
 *
 * @param text the state value
 * @param otherName translated name of the summary slice
 */
export function parsePieScriptString(text: string | null | undefined, otherName: string): PieSliceInput[] {
    const fields = (text ?? '').split('~');
    const slices: PieSliceInput[] = [];
    for (let i = 0; i + 3 < fields.length; i += 4) {
        const n = parseFloat(fields[i + 1]);
        slices.push({
            name: sanitizePieText(fields[i]),
            value: Number.isFinite(n) ? n : 0,
            text: sanitizePieText(fields[i + 2]),
            color: pieColorToDec(fields[i + 3]),
        });
    }
    return mergePieRest(slices, otherName);
}

/**
 * Keeps the first PCHART_MAX_SLICES - 1 slices and sums the rest up as one slice, if there are more than
 * PCHART_MAX_SLICES. Exactly six or fewer slices stay as they are.
 *
 * @param slices slices in order
 * @param otherName translated name of the summary slice
 */
export function mergePieRest(slices: readonly PieSliceInput[], otherName: string): PieSliceInput[] {
    if (slices.length <= PCHART_MAX_SLICES) {
        return [...slices];
    }
    const keep = slices.slice(0, PCHART_MAX_SLICES - 1);
    const rest = slices.slice(PCHART_MAX_SLICES - 1);
    const sum = rest.reduce((a, s) => a + (Number.isFinite(s.value) && s.value > 0 ? s.value : 0), 0);
    keep.push({ name: sanitizePieText(otherName), value: sum, text: '', color: rest[0].color });
    return keep;
}

/**
 * Scales the numbers and cuts the list to what the panel reads.
 *
 * @param slices slices with raw numbers
 */
export function finishPieSlices(slices: readonly PieSliceInput[]): PieSlice[] {
    const cut = slices.slice(0, PCHART_MAX_SLICES);
    const values = scalePieValues(cut.map(s => s.value));
    return cut.map((s, i) => ({
        name: sanitizePieText(s.name),
        value: values[i],
        text: sanitizePieText(s.text),
        color: s.color,
    }));
}

/**
 * The slice fields of the payload (field 17 on): `Name~Number~Value text~Color` per slice.
 *
 * @param slices finished slices
 */
export function pieSlicesToPayload(slices: readonly PieSlice[]): string {
    return slices.map(s => `${s.name}~${s.value}~${s.text}~${s.color}`).join('~');
}

/**
 * Legend mode for field 15: 0-3, anything else = 3 (name, value and percent).
 *
 * @param mode configured mode
 */
export function pieLegendMode(mode: number | null | undefined): number {
    return mode != null && Number.isInteger(mode) && mode >= 0 && mode <= 3 ? mode : 3;
}
