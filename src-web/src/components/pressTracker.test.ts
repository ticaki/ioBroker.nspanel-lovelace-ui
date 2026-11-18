import { describe, expect, it } from 'vitest';
import { PressTracker } from './pressTracker';

describe('PressTracker', () => {
    it('ignores a release without a press on the element', () => {
        const press = new PressTracker();
        expect(press.up(1)).toBe(false);
    });

    it('accepts the release of the pointer that pressed, once', () => {
        const press = new PressTracker();
        press.down(7);
        expect(press.up(8)).toBe(false);
        expect(press.up(7)).toBe(true);
        expect(press.up(7)).toBe(false);
    });

    it('forgets a cancelled press', () => {
        const press = new PressTracker();
        press.down(3);
        press.cancel(4);
        press.cancel(3);
        expect(press.up(3)).toBe(false);
    });
});
