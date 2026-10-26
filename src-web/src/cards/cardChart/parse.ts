import type { ParseContext } from '../CardContract';
import { emptyEntity, field, parseEntityUpdHeader, toNumber } from '../../protocol/split';
import type { Navigation } from '../../protocol/types';

/**
 * Model of `cardChart` (bars) and `cardLChart` (line).
 *
 * Payloads (see `src/lib/pages/pageChart.ts`, `getMessage`):
 *
 * - bar:  `entityUpd~title~[nav left]~[nav right]~color~yLabel~tick[:tick]*~value[^xLabel]~value…`
 *   every value is its own `~` field, the list ends at the first empty field
 * - line: `entityUpd~title~[nav left]~[nav right]~color~yLabel~tick[:tick]*~xTicks~x:y~x:y…`
 *   `xTicks` = `pos[^label][+pos[^label]]*`, every point is its own `~` field
 *
 * All numbers are integers in the x10 space of the panel (`152` = 15.2), ticks included.
 */
export interface ChartModel {
    /** derived from the pageType of the `entityUpd` */
    kind: 'bar' | 'line';
    title: string;
    navigation: Navigation;
    /** RGB565 colour of the bars / line as sent */
    color: number;
    /** 80 % of {@link color}, computed like the HMI (`vaColorD`) */
    colorDark: number;
    /** label of the y-axis, drawn rotated character by character */
    yLabel: string;
    /** y-axis ticks as sent (split at `:`), raw strings - the HMI converts them one by one */
    yTicks: string[];
    /** bar chart: the values in order */
    bars: ChartBar[];
    /** line chart: the raw `xTicks` field, `''` = "No Data" */
    xTicksField: string;
    /** line chart: entries of {@link xTicksField}, split at `+` */
    xTicks: ChartXTick[];
    /** line chart: the points in order */
    points: ChartPoint[];
    /** the HMI shows "No Data" when the field after the y-label (bar: ticks, line: x-ticks) is empty */
    noData: boolean;
    /** false until the first `entityUpd` */
    received: boolean;
}

export interface ChartBar {
    /** x10 value, leading integer of the field (`7^2:00` -> 7) */
    value: number;
    /** text behind `^`, '' = no label and no grid line */
    label: string;
}

export interface ChartXTick {
    /** x position (minutes in the DB mode) */
    pos: number;
    /** text behind `^`, '' = tick without label */
    label: string;
}

export interface ChartPoint {
    x: number;
    y: number;
}

/**
 * Converts like the Nextion `covx`: the leading integer of a string, 0 when there is none.
 * `7^2:00` -> 7, `-52` -> -52, `` -> 0.
 */
export function leadingInt(text: string): number {
    const match = /^\s*[-+]?\d+/.exec(text);
    return match ? Number.parseInt(match[0], 10) : 0;
}

/**
 * The darker colour the HMI draws the bars and the line with: every channel at 80 %.
 * Integer arithmetic like the Nextion script (`vaColorD`).
 *
 * @param color RGB565 colour
 */
export function darkColor565(color: number): number {
    const c = Math.max(0, Math.min(65535, Math.trunc(color)));
    const r = c >> 11;
    const g = (c >> 5) % 64;
    const b = c % 32;
    return (Math.trunc((r * 8) / 10) << 11) + (Math.trunc((g * 8) / 10) << 5) + Math.trunc((b * 8) / 10);
}

export function initial(): ChartModel {
    return {
        kind: 'bar',
        title: '',
        navigation: { left: emptyEntity(), right: emptyEntity() },
        color: 65535,
        colorDark: darkColor565(65535),
        yLabel: '',
        yTicks: [],
        bars: [],
        xTicksField: '',
        xTicks: [],
        points: [],
        noData: false,
        received: false,
    };
}

/** Fields from `offset` on until the first empty one - the HMI stops its loop there */
function takeUntilEmpty(fields: readonly string[], offset: number): string[] {
    const result: string[] = [];
    for (let i = offset; i < fields.length && fields[i] !== ''; i++) {
        result.push(fields[i]);
    }
    return result;
}

/** `value[^label]` */
function parseBar(fieldText: string): ChartBar {
    const caret = fieldText.indexOf('^');
    return {
        value: leadingInt(fieldText),
        label: caret === -1 ? '' : fieldText.slice(caret + 1),
    };
}

/** `pos[^label]` */
function parseXTick(entry: string): ChartXTick {
    const caret = entry.indexOf('^');
    return {
        pos: leadingInt(entry),
        label: caret === -1 ? '' : entry.slice(caret + 1),
    };
}

/** `x:y` - a missing part counts as 0 like `covx` of an empty string */
function parsePoint(fieldText: string): ChartPoint {
    const parts = fieldText.split(':');
    return { x: leadingInt(field(parts, 0)), y: leadingInt(field(parts, 1)) };
}

/** `cardLChart` draws lines, everything else bars */
export function kindOf(pageType: string): ChartModel['kind'] {
    return pageType === 'cardLChart' ? 'line' : 'bar';
}

export function parseEntityUpd(args: string[], _prev: ChartModel, ctx: ParseContext): ChartModel {
    const kind = kindOf(ctx.pageType);
    const { title, navigation, rest } = parseEntityUpdHeader(args);
    const color = toNumber(rest[0], 0);
    const yLabel = field(rest, 1);
    const ticksField = field(rest, 2);
    const yTicks = ticksField === '' ? [] : ticksField.split(':');
    const base: ChartModel = {
        ...initial(),
        kind,
        title,
        navigation,
        color,
        colorDark: darkColor565(color),
        yLabel,
        yTicks,
        received: true,
    };
    if (kind === 'line') {
        const xTicksField = field(rest, 3);
        return {
            ...base,
            xTicksField,
            xTicks: xTicksField === '' ? [] : xTicksField.split('+').map(parseXTick),
            points: takeUntilEmpty(rest, 4).map(parsePoint),
            noData: xTicksField === '',
        };
    }
    return {
        ...base,
        bars: takeUntilEmpty(rest, 3).map(parseBar),
        noData: ticksField === '',
    };
}
