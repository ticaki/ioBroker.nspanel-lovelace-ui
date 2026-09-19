/**
 * Y-axis scale of the line chart for the panel.
 *
 * Contract of the panel (verified on a NSPanel with the 1.1.x TFT, 19.09.2026): ticks and values arrive
 * in the x10 space, the panel divides both by 10, plots the values between the ticks and prints each tick
 * as an integer with **at most two characters** — 1520 becomes "15", not "152". Values above 99.9 therefore
 * need a factor (like the manual one of the bar chart). The line chart picks it automatically.
 */

/** tick / 10 must fit into two characters: -9 … 99 */
const TICK_MIN = -99;
const TICK_MAX = 999;
const MAX_FACTOR = 1_000_000;

export type LineScale = {
    /** the values were divided by this factor (1 = untouched); show it next to the unit */
    factor: number;
    /** scaled values in the x10 space, same order as the input */
    values: number[];
    /** y-axis ticks in the x10 space */
    ticks: number[];
};

/**
 * Ticks for a set of x10 values: min/max rounded to tens, five steps, two extra ticks at both ends.
 * Same algorithm the adapter used before; kept here so it can be tested.
 *
 * @param values x10 values
 */
export function ticksFor(values: number[]): number[] {
    if (values.length === 0) {
        return [];
    }
    const rawMax = Math.max(...values);
    const rawMin = Math.min(...values);
    const roundedMin = Math.floor(rawMin / 10) * 10;
    const roundedMax = Math.ceil(rawMax / 10) * 10;
    // ensure at least a minimal span to avoid zero interval
    const span = Math.max(roundedMax - roundedMin, 10);
    const interval = Math.max(Number((span / 5).toFixed()), 10);
    const ticks: number[] = [];
    for (let tick = roundedMin - interval * 2; tick < roundedMax + interval; tick += interval) {
        ticks.push(tick);
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
