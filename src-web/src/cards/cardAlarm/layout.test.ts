import { describe, expect, it } from 'vitest';
import { stageSize, theme } from '../../style/theme';
import { alarmLayout, type AlarmLayout, type Box } from './layout';

function overlaps(a: Box, b: Box): boolean {
    return (
        a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height
    );
}

/** every key, action button, the PIN field, the status icon and the corner button */
function boxes(layout: AlarmLayout): Box[] {
    const out: Box[] = [];
    for (const y of layout.keyRows) {
        for (const x of layout.keyColumns) {
            out.push({
                left: x - layout.keyWidth / 2,
                top: y - layout.keyHeight / 2,
                width: layout.keyWidth,
                height: layout.keyHeight,
            });
        }
    }
    for (const b of layout.buttons) {
        out.push({
            left: b.x - layout.buttonWidth / 2,
            top: b.y - layout.buttonHeight / 2,
            width: layout.buttonWidth,
            height: layout.buttonHeight,
        });
    }
    out.push(layout.pinBox);
    const icon = layout.statusIcon;
    out.push({ left: icon.x - icon.size / 2, top: icon.y - icon.size / 2, width: icon.size, height: icon.size });
    return out;
}

describe('alarmLayout', () => {
    it('keeps the eu geometry on the landscape models', () => {
        for (const model of ['eu', 'us-l'] as const) {
            const layout = alarmLayout(model);
            expect(layout.titleInBar).toBe(false);
            expect(layout.keyRows).toEqual([118, 176, 234, 290]);
            expect(layout.buttons.map(b => b.x - layout.buttonWidth / 2)).toEqual([300, 300, 300, 300]);
            expect(layout.pinBox).toEqual({ left: 60, top: 11, width: 234, height: 62 });
        }
    });

    it('uses the us-p layout on the portrait models', () => {
        expect(alarmLayout('us-p')).toBe(alarmLayout('web-p'));
        const layout = alarmLayout('us-p');
        expect(layout.titleInBar).toBe(true);
        // tCode below the title bar, the 2x2 block of action buttons, the numpad at the bottom
        expect(layout.pinBox.top).toBeGreaterThanOrEqual(theme.titleBarHeight);
        expect(layout.buttons).toEqual([
            { x: 87, y: 157 },
            { x: 87, y: 218 },
            { x: 241, y: 157 },
            { x: 241, y: 218 },
        ]);
        expect(layout.keyRows).toEqual([276, 335, 393, 449]);
    });

    it('fits the portrait elements into the us-p stage below the title bar without overlap', () => {
        const layout = alarmLayout('us-p');
        const { width, height } = stageSize('us-p');
        const all = boxes(layout);
        for (const box of all) {
            expect(box.left).toBeGreaterThanOrEqual(0);
            expect(box.left + box.width).toBeLessThanOrEqual(width);
            expect(box.top).toBeGreaterThanOrEqual(theme.titleBarHeight);
            expect(box.top + box.height).toBeLessThanOrEqual(height);
        }
        for (let i = 0; i < all.length; i++) {
            for (let j = i + 1; j < all.length; j++) {
                expect(overlaps(all[i], all[j]), `${i} / ${j}`).toBe(false);
            }
        }
        const corner = layout.corner;
        expect(corner.top + corner.size).toBeLessThanOrEqual(height);
    });
});
