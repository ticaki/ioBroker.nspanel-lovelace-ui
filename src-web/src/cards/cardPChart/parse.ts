import type { ParseContext } from '../CardContract';
import { emptyEntity, field, parseEntityUpdHeader, toNumber } from '../../protocol/split';
import type { Navigation } from '../../protocol/types';
import { leadingInt } from '../cardChart/parse';

/**
 * Model of `cardPChart` (pie chart, TFT 6.0.5).
 *
 * Payload (see `src/lib/pages/pageChartPie.ts` and `pie-scale.ts`):
 *
 * `entityUpd~title~[nav left]~[nav right]~<14>~<15 legend mode>~<16>~name~number~text~color~name~…`
 *
 * - field 14 is not read by the panel for this card (title and legend use the normal text colour)
 * - field 15: legend mode `0` name only, `1` + value text, `2` + percentage, `3` value text and
 *   percentage; empty or anything else = 3
 * - field 16 stays empty
 * - from field 17 on every slice takes four fields `Name~Number~Value text~Color` (RGB565 decimal);
 *   at most {@link MAX_SLICES} slices, everything after is ignored (never summed up)
 * - the number is read as an integer, negative numbers count as 0; the percentages are computed here
 */
export interface PieModel {
    title: string;
    navigation: Navigation;
    legendMode: PieLegendMode;
    /** at most {@link MAX_SLICES}, in legend order */
    slices: PieSlice[];
    /** sum of the slice numbers */
    total: number;
    /** `true` when the sum is 0: no pie, the panel shows a hint instead */
    noData: boolean;
    /** false until the first `entityUpd` */
    received: boolean;
}

export type PieLegendMode = 0 | 1 | 2 | 3;

export interface PieSlice {
    name: string;
    /** integer >= 0, size of the slice */
    value: number;
    /** finished value text as sent, e.g. `5.20 kWh` */
    text: string;
    /** RGB565 colour as sent */
    color: number;
    /** share of {@link PieModel.total} in tenths of a percent (`530` = 53.0 %), 0 when the total is 0 */
    permille: number;
    /** {@link permille} printed with one decimal, e.g. `53.0` */
    percentText: string;
}

/** the panel draws at most this many slices - HMI 6.0.5: m0.h/40 = 5 legend rows (6 from m0.h >= 240 px on) */
export const MAX_SLICES = 5;

/** fields per slice from field 17 on */
const SLICE_FIELDS = 4;

/** index of the first slice field inside `rest` of the header (field 17 of the payload) */
const FIRST_SLICE = 3;

export function initial(): PieModel {
    return {
        title: '',
        navigation: { left: emptyEntity(), right: emptyEntity() },
        legendMode: 3,
        slices: [],
        total: 0,
        noData: true,
        received: false,
    };
}

/**
 * Legend mode of field 15: `0`-`3`, empty or anything else is `3` (like `pieLegendMode` of the adapter).
 *
 * @param text the raw field
 */
export function parseLegendMode(text: string): PieLegendMode {
    if (text.trim() === '') {
        return 3;
    }
    const mode = Number(text);
    return mode === 0 || mode === 1 || mode === 2 ? mode : 3;
}

/**
 * The share of a slice in tenths of a percent, truncated like the integer arithmetic of the panel:
 * `5200 / 9800` -> `530` (53.0 %), `1 / 3` -> `333`.
 *
 * @param value the slice number
 * @param total the sum of all slice numbers
 */
export function permilleOf(value: number, total: number): number {
    if (total <= 0 || value <= 0) {
        return 0;
    }
    return Math.trunc((value * 1000) / total);
}

/**
 * `530` -> `53.0`, `7` -> `0.7`, `1000` -> `100.0`
 *
 * @param permille tenths of a percent
 */
export function formatPercent(permille: number): string {
    return `${Math.trunc(permille / 10)}.${permille % 10}`;
}

/**
 * Reads the slices from `rest` (the fields after the navigation): four fields each, at most MAX_SLICES,
 * the list ends at the first slice without name and number.
 *
 * @param rest the fields after the navigation (`rest[0]` is field 14)
 */
function parseSlices(rest: readonly string[]): Omit<PieSlice, 'permille' | 'percentText'>[] {
    const result: Omit<PieSlice, 'permille' | 'percentText'>[] = [];
    for (let i = FIRST_SLICE; i < rest.length && result.length < MAX_SLICES; i += SLICE_FIELDS) {
        const name = field(rest, i);
        const numberField = field(rest, i + 1);
        if (name === '' && numberField === '') {
            break;
        }
        result.push({
            name,
            value: Math.max(0, leadingInt(numberField)),
            text: field(rest, i + 2),
            color: toNumber(rest[i + 3], 65535),
        });
    }
    return result;
}

export function parseEntityUpd(args: string[], _prev: PieModel, _ctx: ParseContext): PieModel {
    const { title, navigation, rest } = parseEntityUpdHeader(args);
    const raw = parseSlices(rest);
    const total = raw.reduce((sum, s) => sum + s.value, 0);
    const slices: PieSlice[] = raw.map(s => {
        const permille = permilleOf(s.value, total);
        return { ...s, permille, percentText: formatPercent(permille) };
    });
    return {
        title,
        navigation,
        legendMode: parseLegendMode(field(rest, 1)),
        slices,
        total,
        noData: total === 0,
        received: true,
    };
}
