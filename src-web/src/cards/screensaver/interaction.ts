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

/**
 * Hold time of an indicator tile after which its release sends the long press (`tmLP` of screensaver2/5, TFT 6.2.0,
 * `indicator_long_press_release.py`)
 */
export const INDICATOR_LONG_PRESS_MS = 500;

/**
 * true when the indicator starts a long press: its bit (index) is set in the long press mask of `weatherUpdate`
 * (`indicator_long_press_mask.py`). Without it the tile knows no long press, its release is always a tap.
 *
 * @param mask the long press mask
 * @param index position of the indicator in its area, 0 = indicator 1
 */
export function indicatorLongPressAllowed(mask: number, index: number): boolean {
    return index >= 0 && index < 31 && (mask & (1 << index)) !== 0;
}

/**
 * true for a touch of the dimmed screensaver whose standby brightness is 0: it only wakes the dark display, an
 * indicator starts no long press then (HMI 6.2.0: `vaWake` of `tc0` 'down' in `f<N>Icon` 'down'; the adapter
 * swallows the press, `Screensaver.onIndicatorWakeTap`).
 *
 * @param awake the display was woken (`global.awake`)
 * @param standby active standby brightness (`global.dim.standby`)
 */
export function isDarkWakeTouch(awake: boolean, standby: number): boolean {
    return !awake && standby <= 0;
}

/** One phase of the blinking clock while a held indicator tile is armed for the long press */
export const LONG_PRESS_BLINK_MS = 200;

/**
 * RGB565 colours of the blinking clock: yellow (first phase, right when the hold time is over), then green - like the
 * HMI (`indicator_long_press_mask.py`); red would read like 'something is wrong'
 */
export const LONG_PRESS_BLINK_COLORS: readonly [number, number] = [65504, 2016];

/**
 * The colour of the clock in a phase of the blinking - 'you can let go now'
 *
 * @param phase number of {@link LONG_PRESS_BLINK_MS} phases since the hold time was over, 0 = the first
 * @returns the RGB565 colour
 */
export function longPressBlinkColor(phase: number): number {
    return LONG_PRESS_BLINK_COLORS[phase % 2 === 0 ? 0 : 1];
}

/**
 * Pointer movement from this distance on cancels the long press of an indicator tile before its hold time is over:
 * the finger is on its way to a swipe (the real HMI has no such check, but there a swipe on a tile is rare)
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

/** what the release on an indicator tile sends with `press`: `[id, action, taps]` (`buttonPress2`) */
export type IndicatorPress = [string, string, number?];

/**
 * What the release of a touch that started on an indicator tile sends: a `buttonPress2` (tap or swipe) or the raw
 * event of the long press
 */
export type IndicatorSend = { kind: 'press'; press: IndicatorPress } | { kind: 'event'; event: string };

/**
 * The release of a touch that started on an indicator tile (HMI 6.2.0, `indicator_long_press_release.py`): the HMI
 * counts every touch in the same counter (`tc0` 'down', also tiles). Released before
 * {@link INDICATOR_LONG_PRESS_MS} the tile tap sends `buttonPress2,<id>,button,<taps>`, released after it the long
 * press `event,buttonPress3,<id>,button,<taps>` - both only on release. A swipe that starts on the tile is sent as
 * swipe, the tile tap or long press is dropped. A tile without id counts but sends nothing.
 *
 * @param prev the tap state before the touch
 * @param entityId id of the indicator entity, empty when none
 * @param dx horizontal movement in px since the touch started
 * @param dy vertical movement in px
 * @param long true when the tile was held for {@link INDICATOR_LONG_PRESS_MS}
 * @returns the new tap state and what to send, undefined for a tile without id
 */
export function indicatorRelease(
    prev: TapState,
    entityId: string,
    dx: number,
    dy: number,
    long: boolean,
): { tap: TapState; send: IndicatorSend | undefined } {
    const tap = nextTap(prev);
    const swipe = swipeAction(dx, dy);
    if (swipe) {
        return { tap, send: { kind: 'press', press: ['screensaver', swipe] } };
    }
    if (indicatorTapTarget(entityId) !== 'indicator') {
        return { tap, send: undefined };
    }
    if (long) {
        return { tap, send: { kind: 'event', event: `event,buttonPress3,${entityId},button,${tap.tapCount}` } };
    }
    return { tap, send: { kind: 'press', press: [entityId, 'button', tap.tapCount] } };
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

/** One phase of the blinking clock the adapter asks for (field 7 of `statusUpdate`, HMI 6.2.0 `tmBlink`) */
export const CLOCK_BLINK_MS = 500;

/** RGB565 colours of the blinking clock the adapter asks for: red first, then white */
export const CLOCK_BLINK_COLORS: readonly [number, number] = [63488, 65535];

/**
 * The colour of the clock in a phase of the blinking the adapter asks for
 *
 * @param phase number of {@link CLOCK_BLINK_MS} phases since the blinking started, 0 = the first
 * @returns the RGB565 colour
 */
export function clockBlinkColor(phase: number): number {
    return CLOCK_BLINK_COLORS[phase % 2 === 0 ? 0 : 1];
}

/**
 * The colour of the clock: the blinking of a long press has priority, then the blinking the adapter asks for, else
 * the colour of `color~` (HMI 6.2.0: `vaLPOn` before `vaBlink`, both keep the normal colour in `vaLPCol`)
 *
 * @param normal RGB565 colour of `color~` (or the text colour of `dimmode`)
 * @param longPressPhase phase of the long press blinking, undefined: not armed
 * @param alertPhase phase of the blinking the adapter asks for, undefined: off
 * @returns the RGB565 colour
 */
export function clockColor(normal: number, longPressPhase: number | undefined, alertPhase: number | undefined): number {
    if (longPressPhase !== undefined) {
        return longPressBlinkColor(longPressPhase);
    }
    if (alertPhase !== undefined) {
        return clockBlinkColor(alertPhase);
    }
    return normal;
}

/** id of a tap on the info icon next to the clock (`tTimeAdd` of HMI 6.2.0): `buttonPress2,bInfo,button,<taps>` */
export const INFO_ICON_ID = 'bInfo';

/**
 * The release of a touch that started on the info icon next to the clock: like an indicator without long press it
 * counts with the taps of the background and sends `bInfo,button,<taps>`, a swipe from the icon is a swipe. A touch
 * of a dark display sends the tap as well - the adapter drops it (`Screensaver.onIndicatorWakeTap`).
 *
 * @param prev the tap state before the touch
 * @param dx horizontal movement in px since the touch started
 * @param dy vertical movement in px
 * @returns the new tap state and what to send with `press`
 */
export function infoIconRelease(prev: TapState, dx: number, dy: number): { tap: TapState; press: IndicatorPress } {
    const tap = nextTap(prev);
    const swipe = swipeAction(dx, dy);
    if (swipe) {
        return { tap, press: ['screensaver', swipe] };
    }
    return { tap, press: [INFO_ICON_ID, 'button', tap.tapCount] };
}
