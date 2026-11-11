import { describe, expect, it } from 'vitest';
import { stageSize, theme } from '../../style/theme';
import { thermoLayout, type TargetGeometry, type ThermoLayout } from './layout';

interface Box {
    left: number;
    top: number;
    width: number;
    height: number;
}

function overlaps(a: Box, b: Box): boolean {
    return (
        a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height
    );
}

function around(x: number, y: number, size: number): Box {
    return { left: x - size / 2, top: y - size / 2, width: size, height: size };
}

/** the touch areas: arrows, detail button, mode cells */
function touchAreas(layout: ThermoLayout, targets: readonly TargetGeometry[]): Box[] {
    const out: Box[] = [];
    for (const t of targets) {
        out.push(around(t.down.x, t.down.y, t.arrowHit), around(t.up.x, t.up.y, t.arrowHit));
    }
    out.push(around(layout.detail.x, layout.detail.y, layout.detail.hit));
    for (const cell of layout.actions) {
        out.push({ left: cell.x, top: cell.y, width: layout.actionWidth, height: layout.actionHeight });
    }
    return out;
}

function expectInside(boxes: Box[], width: number, height: number): void {
    for (const box of boxes) {
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.left + box.width).toBeLessThanOrEqual(width);
        expect(box.top).toBeGreaterThanOrEqual(theme.titleBarHeight);
        expect(box.top + box.height).toBeLessThanOrEqual(height);
    }
}

function expectNoOverlap(boxes: Box[]): void {
    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            expect(overlaps(boxes[i], boxes[j]), `${i} / ${j}`).toBe(false);
        }
    }
}

describe('thermoLayout', () => {
    it('keeps the eu geometry on the landscape models', () => {
        const layout = thermoLayout('eu');
        expect(thermoLayout('us-l')).toBe(layout);
        expect(layout.single).toMatchObject({ x: 277, y: 163, down: { x: 173 }, up: { x: 401 }, arrowSize: 68 });
        expect(layout.dual.map(t => [t.down.x, t.x, t.up.x])).toEqual([
            [160, 228, 296],
            [322, 390, 458],
        ]);
        expect(layout.actions.map(a => a.x)).toEqual([8, 62, 116, 170, 224, 278, 332, 386]);
        expect(layout.texts.map(t => t.top)).toEqual([90, 124, 159, 192]);
    });

    it('puts the portrait mode buttons in two rows of four like the us-p HMI', () => {
        const layout = thermoLayout('us-p');
        expect(thermoLayout('web-p')).toBe(layout);
        const centres = layout.actions.map(a => [a.x + layout.actionWidth / 2, a.y + layout.actionHeight / 2]);
        expect(centres).toEqual([
            [57, 393],
            [125, 393],
            [193, 393],
            [261, 393],
            [57, 448],
            [125, 448],
            [193, 448],
            [261, 448],
        ]);
        // two targets: arrow up above, arrow down below the digits
        for (const t of layout.dual) {
            expect(t.up.x).toBe(t.x);
            expect(t.up.y).toBeLessThan(t.y);
            expect(t.down.y).toBeGreaterThan(t.y);
        }
    });

    it('fits the portrait touch areas into the us-p stage without overlap', () => {
        const layout = thermoLayout('us-p');
        const { width, height } = stageSize('us-p');
        for (const targets of [[layout.single], layout.dual]) {
            const boxes = touchAreas(layout, targets);
            expectInside(boxes, width, height);
            expectNoOverlap(boxes);
        }
        const texts = layout.texts.map(t => ({ left: t.left, top: t.top, width: t.width, height: 20 }));
        expectInside(texts, width, height);
        expectNoOverlap(texts);
    });
});
