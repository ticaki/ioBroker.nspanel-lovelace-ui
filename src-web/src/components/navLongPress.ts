/**
 * Short and long press of the navigation arrows of the title bar, kept free of React so it can be tested without a
 * DOM. Like the card pages of the HMI (`tmLPNav`, 500 ms): the release decides - short `buttonPress2` (next/prev),
 * after the hold time `buttonPress3` (home/parent); from then on heading and arrows blink yellow/green until the
 * release (`nav_long_press_blink.py`).
 */
import { longPressBlinkColor } from '../cards/screensaver/interaction';

/** Hold time of a navigation arrow after which its release sends the long press (`tmLPNav.tim` of the HMI) */
export const NAV_LONG_PRESS_MS = 500;

/**
 * The event the release of a navigation arrow sends after the hold time (the short release goes through `press`, as
 * `event,buttonPress2,<id>,button`).
 *
 * @param entityId id of the navigation entity
 * @returns `event,buttonPress3,<id>,button` - home/parent
 */
export function navLongPressEvent(entityId: string): string {
    return `event,buttonPress3,${entityId},button`;
}

/**
 * RGB565 colour of the heading or an arrow: its own colour, yellow/green while the long press is armed.
 *
 * @param normal the colour without the long press
 * @param phase blink phase since the hold time was over (0 = first, yellow), undefined: not armed
 */
export function navColor(normal: number, phase: number | undefined): number {
    return phase === undefined ? normal : longPressBlinkColor(phase);
}
