import { describe, expect, it } from 'vitest';
import { indicatorTapTarget, nextTap, swipeAction } from './interaction';

describe('screensaver interaction', () => {
    describe('indicatorTapTarget', () => {
        it('sends the indicator press, dimmed or awake', () => {
            expect(indicatorTapTarget('light.x')).toBe('indicator');
        });

        it('swallows the tap on an indicator without id', () => {
            expect(indicatorTapTarget('')).toBe('none');
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
