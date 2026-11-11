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
 * not (seen in the adapter log of a hardware panel). The tap wakes the display like every other touch.
 * An indicator without an id has nothing to send; the tap is swallowed (the real HMI ignores it).
 *
 * @param entityId id of the indicator entity, empty when none
 */
export function indicatorTapTarget(entityId: string): 'indicator' | 'none' {
    return entityId !== '' ? 'indicator' : 'none';
}

/** Hold time of an indicator tile after which the HMI sends its long press (`tmLP` of screensaver2/5, TFT 6.0.9) */
export const INDICATOR_LONG_PRESS_MS = 500;

/**
 * Pointer movement from this distance on cancels the long press of an indicator tile: the finger is on its way to
 * a swipe (the real HMI has no such check, but there a swipe on a tile is rare)
 */
export const LONG_PRESS_MOVE_PX = 20;

/**
 * true while a held indicator tile may still become a long press: the finger has not moved far
 *
 * @param dx horizontal movement in px since the touch started
 * @param dy vertical movement in px
 */
export function longPressStillPossible(dx: number, dy: number): boolean {
    return Math.hypot(dx, dy) < LONG_PRESS_MOVE_PX;
}

/**
 * The long press of an indicator tile (HMI 6.0.9, `indicator_long_press.py`): sent while the finger is still down,
 * with the tap counter that counts this touch too - `event,buttonPress3,<id>,button,<taps>`; the release sends
 * nothing more. A tile without id counts but sends nothing.
 *
 * @param prev the tap state before the touch
 * @param entityId id of the indicator entity, empty when none
 * @returns the new tap state and the event to send, undefined for a tile without id
 */
export function indicatorLongPress(prev: TapState, entityId: string): { tap: TapState; event: string | undefined } {
    const tap = nextTap(prev);
    return {
        tap,
        event:
            indicatorTapTarget(entityId) === 'indicator'
                ? `event,buttonPress3,${entityId},button,${tap.tapCount}`
                : undefined,
    };
}

/** what the release on an indicator tile sends: `[id, action, taps]` */
export type IndicatorPress = [string, string, number?];

/**
 * The release of a touch that started on an indicator tile (HMI 6.0.8+, `indicator_long_press.py`): the HMI counts
 * every touch in the same counter (`tc0` 'down', also tiles), so the tile tap sends
 * `buttonPress2,<id>,button,<taps>`. A swipe that starts on the tile is sent as swipe, the tile tap is dropped. A
 * tile without id counts but sends nothing. The long press is {@link indicatorLongPress}.
 *
 * @param prev the tap state before the touch
 * @param entityId id of the indicator entity, empty when none
 * @param dx horizontal movement in px since the touch started
 * @param dy vertical movement in px
 */
export function indicatorRelease(
    prev: TapState,
    entityId: string,
    dx: number,
    dy: number,
): { tap: TapState; press: IndicatorPress | undefined } {
    const tap = nextTap(prev);
    const swipe = swipeAction(dx, dy);
    if (swipe) {
        return { tap, press: ['screensaver', swipe] };
    }
    return {
        tap,
        press: indicatorTapTarget(entityId) === 'indicator' ? [entityId, 'button', tap.tapCount] : undefined,
    };
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
