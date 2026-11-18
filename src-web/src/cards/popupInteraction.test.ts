import { describe, expect, it } from 'vitest';
import type React from 'react';
import type { CardProps } from './CardContract';
import { ColorWheel } from './popupLight/ColorWheel';
import type { PopupShutterModel } from './popupShutter/parse';
import { PopupShutter } from './popupShutter/PopupShutter';

/**
 * A long press on a screensaver indicator opens the popup while the finger is still down - the
 * release then lands on the popup without a press there. Elements that react on the release must
 * ignore it.
 */

function pointer(pointerId: number, clientX = 50, clientY = 50): React.PointerEvent<HTMLDivElement> {
    return { pointerId, clientX, clientY } as React.PointerEvent<HTMLDivElement>;
}

const box = {
    getBoundingClientRect: (): { left: number; top: number; width: number; height: number } => ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
    }),
} as HTMLDivElement;

describe('popup elements that react on the release', () => {
    it('color wheel: a release without a press picks nothing', () => {
        const picks: string[] = [];
        const wheel = new ColorWheel({ size: 100, onPick: (x, y, size) => picks.push(`${x}|${y}|${size}`) });
        wheel['root'].current = box;
        const down = wheel['onPointerDown'];
        const up = wheel['onPointerUp'];
        up(pointer(1));
        expect(picks).toEqual([]);
        down(pointer(2));
        up(pointer(2));
        expect(picks).toEqual(['80|80|160']);
        // the same release again is no tap
        up(pointer(2));
        expect(picks).toHaveLength(1);
    });

    it('popupShutter2 window: a release without a press does not move the shutter', () => {
        const sent: unknown[][] = [];
        const props = {
            model: { position: 20, entityName: 'shutter.x' },
            ctx: { pageType: 'popupShutter2', pageArgs: [] },
            press: (id: string, action: string, value?: string | number): void => {
                sent.push([id, action, value]);
            },
        } as unknown as CardProps<PopupShutterModel>;
        const popup = new PopupShutter(props);
        popup['windowRef'].current = box;
        const down = popup['onWindowDown'];
        const up = popup['onWindowTap'];
        up(pointer(1, 50, 35));
        expect(sent).toEqual([]);
        down(pointer(4, 50, 35));
        up(pointer(4, 50, 35));
        expect(sent).toEqual([['shutter.x', 'positionSlider', 35]]);
    });
});
