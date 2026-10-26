/**
 * Decision logic of the screensaver gestures, kept free of React so it can be tested
 * without a DOM.
 */

/** Pointer movement from this distance on is a swipe, not a tap */
export const SWIPE_MIN_PX = 50;

export interface TapState {
    /** taps counted since the screensaver was shown */
    tapCount: number;
}

/**
 * Counts a tap on the screensaver. The real display knows no double tap: it counts the taps
 * since the screensaver page was shown (`bExit,1`, `bExit,2`, …) without any time limit, the
 * adapter's "double click" option just waits for the second one. The count starts again
 * when the screensaver page is shown again.
 *
 * @param prev the previous tap state
 */
export function nextTap(prev: TapState): TapState {
    return { tapCount: prev.tapCount + 1 };
}

/**
 * What a tap on an indicator icon (advanced layout, bottom row) does.
 *
 * The real display sends the indicator press (`event,buttonPress2,<id>,button`) dimmed or
 * not (seen in the adapter log of a hardware panel), it never counts as a screensaver tap.
 * The tap wakes the display like every other touch. An indicator without an id has nothing
 * to send; the tap is swallowed (the real HMI ignores it).
 *
 * @param entityId id of the indicator entity, empty when none
 */
export function indicatorTapTarget(entityId: string): 'indicator' | 'none' {
    return entityId !== '' ? 'indicator' : 'none';
}

/**
 * Classifies the pointer movement between down and up: a swipe action or `undefined` for a tap.
 *
 * @param dx horizontal movement in px
 * @param dy vertical movement in px
 */
export function swipeAction(dx: number, dy: number): 'swipeUp' | 'swipeDown' | 'swipeLeft' | 'swipeRight' | undefined {
    if (Math.hypot(dx, dy) < SWIPE_MIN_PX) {
        return undefined;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? 'swipeRight' : 'swipeLeft';
    }
    return dy > 0 ? 'swipeDown' : 'swipeUp';
}
