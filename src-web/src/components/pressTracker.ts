/**
 * Remembers the pointer that went down on one element, so the release counts only as a tap when
 * the same pointer pressed that element first.
 *
 * Without it an element that reacts on `pointerup` alone is operated by a release whose press
 * happened somewhere else - e.g. the long press of a screensaver indicator: the adapter opens
 * the popup while the finger is still down, and lifting the finger hit the freshly drawn popup.
 */
export class PressTracker {
    private pointerId: number | undefined;

    /**
     * A pointer went down on the element.
     *
     * @param pointerId `pointerId` of the event
     */
    down(pointerId: number): void {
        this.pointerId = pointerId;
    }

    /**
     * A pointer was released on the element.
     *
     * @param pointerId `pointerId` of the event
     * @returns true if the same pointer pressed the element before - the release is a tap
     */
    up(pointerId: number): boolean {
        if (this.pointerId === undefined || this.pointerId !== pointerId) {
            return false;
        }
        this.pointerId = undefined;
        return true;
    }

    /**
     * The browser took the pointer away (`pointercancel`) or it left the element.
     *
     * @param pointerId `pointerId` of the event
     */
    cancel(pointerId: number): void {
        if (this.pointerId === pointerId) {
            this.pointerId = undefined;
        }
    }
}
