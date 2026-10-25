import { describe, expect, it } from 'vitest';
import {
    bannerAt,
    FRAME_INTERVAL_MS,
    FRAMES_PER_LOOP,
    frameIndex,
    lastDistinctTick,
    LONGER_AFTER_MS,
    LONGER_AFTER_TICKS,
    SPLASH_LOOPS,
} from './sequence';

describe('startup sequence', () => {
    it('advances one frame per 200 ms tick and loops', () => {
        expect(FRAME_INTERVAL_MS).toBe(200);
        expect(frameIndex(0)).toBe(0);
        expect(frameIndex(1)).toBe(1);
        expect(frameIndex(FRAMES_PER_LOOP)).toBe(0);
        expect(frameIndex(FRAMES_PER_LOOP * 5 + 3)).toBe(3);
        expect(frameIndex(-1)).toBe(0);
    });

    it('shows the title during the splash loops, then waiting, then longer than usual', () => {
        // pageSplash: two loops with picture 113 (title), then pageStartup with 114
        expect(bannerAt(0)).toBe('title');
        expect(bannerAt(SPLASH_LOOPS * FRAMES_PER_LOOP - 1)).toBe('title');
        expect(bannerAt(SPLASH_LOOPS * FRAMES_PER_LOOP)).toBe('waiting');
        // pageStartup: picture 115 once usual_cnt reached 10 = 11.2 s after the page opened, for good
        expect(LONGER_AFTER_MS).toBe(11200);
        expect(LONGER_AFTER_TICKS).toBe(56);
        const longer = SPLASH_LOOPS * FRAMES_PER_LOOP + LONGER_AFTER_TICKS;
        expect(bannerAt(longer - 1)).toBe('waiting');
        expect(bannerAt(longer)).toBe('longer');
        expect(bannerAt(longer + 100000)).toBe('longer');
    });

    it('the tick counter may wrap once the last banner is reached', () => {
        const wrap = lastDistinctTick();
        expect(bannerAt(wrap)).toBe('longer');
        expect(bannerAt(wrap * 2)).toBe('longer');
        for (let t = wrap; t < wrap * 3; t++) {
            expect(bannerAt(t)).toBe('longer');
        }
    });
});
