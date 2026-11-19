import { describe, expect, it } from 'vitest';
import { LONG_PRESS_BLINK_COLORS } from '../cards/screensaver/interaction';
import { NAV_LONG_PRESS_MS, navColor, navLongPressEvent } from './navLongPress';

describe('navigation arrow long press', () => {
    it('has the hold time of tmLPNav', () => {
        expect(NAV_LONG_PRESS_MS).toBe(500);
    });

    it('sends buttonPress3 with the id of the navigation entity', () => {
        expect(navLongPressEvent('bUp')).toBe('event,buttonPress3,bUp,button');
    });

    it('keeps the colour while not armed', () => {
        expect(navColor(1234, undefined)).toBe(1234);
    });

    it('blinks yellow first, then green, like the clock of the screensaver', () => {
        expect(LONG_PRESS_BLINK_COLORS).toEqual([65504, 2016]);
        expect(navColor(1234, 0)).toBe(65504);
        expect(navColor(1234, 1)).toBe(2016);
        expect(navColor(1234, 2)).toBe(65504);
    });
});
