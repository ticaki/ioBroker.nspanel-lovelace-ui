import { describe, expect, it } from 'vitest';
import { stageSize, theme } from '../../style/theme';
import { powerLayout, type Box } from './layout';

function overlaps(a: Box, b: Box): boolean {
    return (
        a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height
    );
}

describe('powerLayout', () => {
    it('keeps the eu geometry on the landscape models', () => {
        const layout = powerLayout('eu');
        expect(powerLayout('us-l')).toBe(layout);
        expect(layout.home).toEqual({ left: 198, top: 70, width: 60, height: 230 });
        expect(layout.slots[0]).toMatchObject({
            box: { left: 18, top: 80 },
            line: { left: 84, top: 109, width: 104, height: 2 },
            vertical: false,
            startsAtItem: true,
            name: { left: 84, top: 79 },
            value: { left: 84, top: 122 },
        });
        expect(layout.slots[5]).toMatchObject({
            box: { left: 378, top: 232 },
            line: { left: 264, width: 104 },
            startsAtItem: false,
        });
    });

    it('puts three items above and three below the wide house on the portrait models', () => {
        const layout = powerLayout('us-p');
        expect(powerLayout('web-p')).toBe(layout);
        expect(layout.wideHome).toBe(true);
        expect(layout.slots.map(s => s.box.left + s.box.width / 2)).toEqual([80, 160, 240, 80, 160, 240]);
        for (const [i, slot] of layout.slots.entries()) {
            const upper = i < 3;
            expect(slot.vertical).toBe(true);
            expect(slot.startsAtItem).toBe(upper);
            // the line runs between item and house
            if (upper) {
                expect(slot.line.top).toBeGreaterThan(slot.box.top + slot.box.height);
                expect(slot.line.top + slot.line.height).toBeLessThan(layout.home.top);
                expect(slot.value.top + slot.value.height).toBeLessThanOrEqual(slot.box.top);
            } else {
                expect(slot.line.top).toBeGreaterThan(layout.home.top + layout.home.height);
                expect(slot.line.top + slot.line.height).toBeLessThan(slot.box.top);
                expect(slot.value.top).toBeGreaterThanOrEqual(slot.box.top + slot.box.height);
            }
        }
    });

    it('fits the portrait layout into the us-p stage without overlap', () => {
        const layout = powerLayout('us-p');
        const { width, height } = stageSize('us-p');
        const boxes: Box[] = [layout.home];
        for (const slot of layout.slots) {
            boxes.push(slot.box, slot.line, slot.value);
        }
        for (const box of boxes) {
            expect(box.left).toBeGreaterThanOrEqual(0);
            expect(box.left + box.width).toBeLessThanOrEqual(width);
            expect(box.top).toBeGreaterThanOrEqual(theme.titleBarHeight);
            expect(box.top + box.height).toBeLessThanOrEqual(height);
        }
        for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
                expect(overlaps(boxes[i], boxes[j]), `${i} / ${j}`).toBe(false);
            }
        }
    });
});
