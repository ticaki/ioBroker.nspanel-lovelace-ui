import { describe, expect, it } from 'vitest';
import {
    CLOCK_BLINK_MS,
    clockBlinkColor,
    clockColor,
    INFO_ICON_ID,
    infoIconRelease,
    indicatorLongPressAllowed,
    isDarkWakeTouch,
    indicatorRelease,
    indicatorTapTarget,
    longPressBlinkColor,
    longPressStillPossible,
    nextTap,
    swipeAction,
} from './interaction';

describe('screensaver interaction', () => {
    describe('indicatorTapTarget', () => {
        it('sends the indicator press, dimmed or awake', () => {
            expect(indicatorTapTarget('light.x')).toBe('indicator');
        });

        it('swallows the tap on an indicator without id', () => {
            expect(indicatorTapTarget('')).toBe('none');
        });
    });

    describe('indicatorRelease', () => {
        it('counts the tile tap with the background taps and sends it with the count', () => {
            const first = indicatorRelease({ tapCount: 0 }, '0?10', 0, 0, false);
            expect(first.send).toEqual({ kind: 'press', press: ['0?10', 'button', 1] });
            // a background tap in between (bExit,2), then the tile again
            const second = indicatorRelease(nextTap(first.tap), '0?10', 3, -2, false);
            expect(second.send).toEqual({ kind: 'press', press: ['0?10', 'button', 3] });
            expect(second.tap.tapCount).toBe(3);
        });

        it('a swipe that starts on the tile is a swipe, no tile tap', () => {
            expect(indicatorRelease({ tapCount: 0 }, '0?10', -80, 5, false).send).toEqual({
                kind: 'press',
                press: ['screensaver', 'swipeLeft'],
            });
        });

        it('a tile without id counts but sends nothing', () => {
            const r = indicatorRelease({ tapCount: 1 }, '', 0, 0, false);
            expect(r.send).toBeUndefined();
            expect(r.tap.tapCount).toBe(2);
        });

        it('after the hold time the release sends buttonPress3 with the taps, the held touch counts as a tap', () => {
            const r = indicatorRelease({ tapCount: 2 }, '0?10', 4, 3, true);
            expect(r.send).toEqual({ kind: 'event', event: 'event,buttonPress3,0?10,button,3' });
            expect(r.tap.tapCount).toBe(3);
        });

        it('a swipe drops the long press too', () => {
            expect(indicatorRelease({ tapCount: 0 }, '0?10', 0, 90, true).send).toEqual({
                kind: 'press',
                press: ['screensaver', 'swipeDown'],
            });
        });

        it('a held tile without id counts but sends nothing', () => {
            const r = indicatorRelease({ tapCount: 0 }, '', 0, 0, true);
            expect(r.send).toBeUndefined();
            expect(r.tap.tapCount).toBe(1);
        });
    });

    describe('longPressBlinkColor', () => {
        it('starts yellow and alternates with green', () => {
            expect(longPressBlinkColor(0)).toBe(65504);
            expect(longPressBlinkColor(1)).toBe(2016);
            expect(longPressBlinkColor(2)).toBe(65504);
            expect(longPressBlinkColor(7)).toBe(2016);
        });
    });

    describe('longPressStillPossible', () => {
        it('a small movement keeps the long press, a clear one (towards a swipe) cancels it', () => {
            expect(longPressStillPossible(0, 0)).toBe(true);
            expect(longPressStillPossible(8, -8)).toBe(true);
            expect(longPressStillPossible(25, 0)).toBe(false);
            expect(longPressStillPossible(0, -60)).toBe(false);
        });
    });

    describe('nextTap', () => {
        it('counts every tap since the screensaver was shown, without a time limit', () => {
            const first = nextTap({ tapCount: 0 });
            expect(first.tapCount).toBe(1);
            const second = nextTap(first);
            expect(second.tapCount).toBe(2);
            expect(nextTap(second).tapCount).toBe(3);
        });
    });

    describe('swipeAction', () => {
        it('is a tap below the minimum distance', () => {
            expect(swipeAction(0, 0)).toBeUndefined();
            expect(swipeAction(30, 30)).toBeUndefined();
        });

        it('picks the dominant direction', () => {
            expect(swipeAction(80, 10)).toBe('swipeRight');
            expect(swipeAction(-80, 10)).toBe('swipeLeft');
            expect(swipeAction(10, 80)).toBe('swipeDown');
            expect(swipeAction(10, -80)).toBe('swipeUp');
        });
    });
});

describe('indicatorLongPressAllowed', () => {
    it('bit N-1 of the mask for indicator N (index N-1)', () => {
        expect(indicatorLongPressAllowed(68, 2)).toBe(true);
        expect(indicatorLongPressAllowed(68, 6)).toBe(true);
        expect(indicatorLongPressAllowed(68, 0)).toBe(false);
        expect(indicatorLongPressAllowed(0, 0)).toBe(false);
        expect(indicatorLongPressAllowed(2048, 11)).toBe(true);
        expect(indicatorLongPressAllowed(1, -1)).toBe(false);
    });
});

describe('isDarkWakeTouch', () => {
    it('only the touch of the dimmed screensaver with standby brightness 0', () => {
        expect(isDarkWakeTouch(false, 0)).toBe(true);
        expect(isDarkWakeTouch(true, 0)).toBe(false);
        expect(isDarkWakeTouch(false, 20)).toBe(false);
    });

    describe('blinking clock of the adapter (statusUpdate field 7)', () => {
        it('blinks red first, then white, 500 ms per phase', () => {
            expect(CLOCK_BLINK_MS).toBe(500);
            expect(clockBlinkColor(0)).toBe(63488);
            expect(clockBlinkColor(1)).toBe(65535);
            expect(clockBlinkColor(2)).toBe(63488);
        });

        it('the long press has priority, without both the clock has its colour', () => {
            expect(clockColor(1234, undefined, undefined)).toBe(1234);
            expect(clockColor(1234, undefined, 1)).toBe(65535);
            expect(clockColor(1234, 0, 1)).toBe(longPressBlinkColor(0));
            expect(clockColor(1234, 1, undefined)).toBe(longPressBlinkColor(1));
        });
    });

    describe('infoIconRelease', () => {
        it('a tap counts with the background taps and sends bInfo,button,<taps>', () => {
            const first = infoIconRelease({ tapCount: 0 }, 0, 0);
            expect(first.press).toEqual([INFO_ICON_ID, 'button', 1]);
            expect(INFO_ICON_ID).toBe('bInfo');
            const second = infoIconRelease(nextTap(first.tap), 2, 3);
            expect(second.press).toEqual(['bInfo', 'button', 3]);
        });

        it('a swipe that starts on the icon is a swipe, but counts', () => {
            const r = infoIconRelease({ tapCount: 1 }, 0, -120);
            expect(r.press).toEqual(['screensaver', 'swipeUp']);
            expect(r.tap.tapCount).toBe(2);
        });

        it('a touch of a dark display sends the tap as well (the adapter only wakes)', () => {
            expect(infoIconRelease({ tapCount: 0 }, 0, 0).press).toEqual(['bInfo', 'button', 1]);
        });
    });
});
