import { describe, expect, it } from 'vitest';
import { indicatorRelease, indicatorTapTarget, nextTap, swipeAction } from './interaction';

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
            const first = indicatorRelease({ tapCount: 0 }, '0?10', 0, 0);
            expect(first.press).toEqual(['0?10', 'button', 1]);
            // a background tap in between (bExit,2), then the tile again
            const second = indicatorRelease(nextTap(first.tap), '0?10', 3, -2);
            expect(second.press).toEqual(['0?10', 'button', 3]);
            expect(second.tap.tapCount).toBe(3);
        });

        it('a swipe that starts on the tile is a swipe, no tile tap', () => {
            expect(indicatorRelease({ tapCount: 0 }, '0?10', -80, 5).press).toEqual(['screensaver', 'swipeLeft']);
        });

        it('a tile without id counts but sends nothing', () => {
            const r = indicatorRelease({ tapCount: 1 }, '', 0, 0);
            expect(r.press).toBeUndefined();
            expect(r.tap.tapCount).toBe(2);
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
