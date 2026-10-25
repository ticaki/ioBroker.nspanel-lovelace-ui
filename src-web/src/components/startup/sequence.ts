/**
 * Timing of the boot animation of the HMI (`pageSplash` and `pageStartup` in the HMI file).
 *
 * Both pages have a picture `p0` whose `pic` a 200 ms timer advances through the pictures
 * 101..111 (twelve frames of the animated background are in the HMI, the twelfth is set
 * and replaced within the same tick) and a banner `p1` below it. `pageSplash` runs the
 * loop twice with the title banner (picture 113), then switches to `pageStartup`, which
 * loops with "waiting for content..." (114) and shows "this is taking longer than usual"
 * (115) once `usual_cnt` reached 10 - for good, the picture never changes back: the adapter
 * is down or sends no page, nothing the panel can do about.
 *
 * `usual_cnt` is counted by `tmSpinner` (80 ms): `frame_ptr.val+=spinner_w.val%frapic_w.val`
 * is evaluated left to right by Nextion, `frame_ptr = (frame_ptr + 140) % 1960`, and the
 * counter grows every time it passes 1820 = every 14 ticks = 1.12 s. So the banner changes
 * 11.2 s after `pageStartup` opened (and every 5.6 s the startup event is sent again).
 */

/** `tim` of the timer `tm0` on both pages */
export const FRAME_INTERVAL_MS = 200;

/** frames of the animated background in the HMI */
export const FRAMES_PER_LOOP = 12;

/** `pageSplash` shows the loop twice (`n0.val`) before `pageStartup` opens */
export const SPLASH_LOOPS = 2;

/** `pageStartup` swaps the banner for "taking longer than usual" after 10 x 14 x 80 ms = 11.2 s */
export const LONGER_AFTER_MS = 10 * 14 * 80;

/** ticks of the frame timer on `pageStartup` until the banner changes */
export const LONGER_AFTER_TICKS = LONGER_AFTER_MS / FRAME_INTERVAL_MS;

export type StartupBanner = 'title' | 'waiting' | 'longer';

/**
 * The frame shown at a tick of the 200 ms timer.
 *
 * @param tick ticks since the page opened
 */
export function frameIndex(tick: number): number {
    return Math.max(0, Math.floor(tick)) % FRAMES_PER_LOOP;
}

/**
 * The banner shown at a tick: the title while the splash loops run, "waiting for content"
 * on the startup page, "taking longer than usual" from `LONGER_AFTER_MS` later on - for good.
 *
 * @param tick ticks since the page opened
 */
export function bannerAt(tick: number): StartupBanner {
    const t = Math.max(0, tick);
    const startupOpened = SPLASH_LOOPS * FRAMES_PER_LOOP;
    if (t < startupOpened) {
        return 'title';
    }
    if (t < startupOpened + LONGER_AFTER_TICKS) {
        return 'waiting';
    }
    return 'longer';
}

/** the last tick whose picture differs from all later ticks (the animation keeps looping) */
export function lastDistinctTick(): number {
    return SPLASH_LOOPS * FRAMES_PER_LOOP + LONGER_AFTER_TICKS;
}
