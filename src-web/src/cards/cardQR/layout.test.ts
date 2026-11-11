import { describe, expect, it } from 'vitest';
import { stageSize, theme } from '../../style/theme';
import { qrLayout } from './layout';

describe('qrLayout', () => {
    it('keeps the eu geometry on the landscape models', () => {
        const layout = qrLayout('eu');
        expect(qrLayout('us-l')).toBe(layout);
        expect(layout.code).toEqual({ left: 12, top: 88 });
        expect(layout.entities.map(e => [e.left, e.top])).toEqual([
            [230, 96],
            [230, 196],
        ]);
        expect(layout.switchBesideName).toBe(false);
    });

    it('puts the code on top and the rows below it on the portrait models', () => {
        const layout = qrLayout('us-p');
        expect(qrLayout('web-p')).toBe(layout);
        const { width, height } = stageSize('us-p');
        // the code centred below the title bar
        expect(layout.code.left * 2 + layout.codeSize).toBe(width);
        expect(layout.code.top).toBeGreaterThanOrEqual(theme.titleBarHeight);
        let previousBottom = layout.code.top + layout.codeSize;
        for (const row of layout.entities) {
            expect(row.top).toBeGreaterThanOrEqual(previousBottom);
            expect(row.top + layout.entityHeight).toBeLessThanOrEqual(height);
            previousBottom = row.top + layout.entityHeight;
        }
        expect(layout.switchBesideName).toBe(true);
    });
});
