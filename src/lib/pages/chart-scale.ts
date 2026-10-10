/**
 * Y-axis scale of the line chart for the panel.
 *
 * Contract of the panel (verified on a NSPanel with the 1.1.x TFT, 19.–21.09.2026):
 * - ticks and values arrive in the x10 space, the panel divides both by 10 and prints each tick as an
 *   integer with **at most two characters** — 1520 becomes "15", not "152";
 * - the panel spans the y-axis exactly over the data (min … max) and shows only the ticks inside that range
 *   plus the enclosing one below and above; ticks outside are invisible. Extra ticks therefore never give
 *   the curve any headroom, they only risk breaking the two-character rule — so we send data ticks only.
 * Values above 99.9 need a factor (like the manual one of the bar chart). The line chart picks it automatically.
 */

/** tick / 10 must fit into two characters: -9 … 99 */
const TICK_MIN = -99;
const TICK_MAX = 999;
const MAX_FACTOR = 1_000_000;

/** tick steps in the x10 space (1, 2, 5, 10, … units): the panel prints integers, so no 2.5 steps */
const NICE_STEPS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10_000];

export type LineScale = {
    /** the values were divided by this factor (1 = untouched); show it next to the unit */
    factor: number;
    /** scaled values in the x10 space, same order as the input */
    values: number[];
    /** y-axis ticks in the x10 space */
    ticks: number[];
};

/**
 * Smallest 1-2-5 step that gives at most five steps over the span.
 *
 * @param span max - min in the x10 space
 */
export function niceStep(span: number): number {
    const raw = Math.max(span, 10) / 5;
    return NICE_STEPS.find(step => step >= raw) ?? NICE_STEPS[NICE_STEPS.length - 1];
}

/**
 * Ticks for a set of x10 values: a 1-2-5 step, from the step below the minimum to the step above the maximum,
 * no extra ticks (the panel would not show them anyway, see above). At least two ticks.
 *
 * @param values x10 values
 */
export function ticksFor(values: number[]): number[] {
    if (values.length === 0) {
        return [];
    }
    const rawMax = Math.max(...values);
    const rawMin = Math.min(...values);
    const step = niceStep(rawMax - rawMin);
    const lo = Math.floor(rawMin / step) * step;
    const hi = Math.ceil(rawMax / step) * step;
    const ticks: number[] = [];
    for (let tick = lo; tick <= hi; tick += step) {
        ticks.push(tick);
    }
    if (ticks.length < 2) {
        ticks.push(lo + step);
    }
    return ticks;
}

/**
 * Scales x10 values so that every tick label fits the panel; the factor grows in steps of 10.
 *
 * @param values x10 values as read from the history
 */
export function buildLineScale(values: number[]): LineScale {
    let factor = 1;
    for (;;) {
        const scaled = values.map(v => Math.round(v / factor));
        const ticks = ticksFor(scaled);
        if (ticks.every(t => t >= TICK_MIN && t <= TICK_MAX) || factor >= MAX_FACTOR) {
            return { factor, values: scaled, ticks };
        }
        factor *= 10;
    }
}
