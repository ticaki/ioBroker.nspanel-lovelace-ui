import { describe, expect, it } from 'vitest';
import { mediaGeometry } from './CardMedia';

describe('cardMedia layout', () => {
    it('spreads the blocks of the portrait models with equal gaps below the title bar', () => {
        for (const [model, height] of [
            ['web-p', 640],
            ['us-p', 480],
        ] as const) {
            const g = mediaGeometry(model);
            const rows = model === 'web-p' ? 2 : 1;
            // [top, bottom] of logo, name/artist, controls, volume and the option rows
            const blocks: [number, number][] = [
                [g.logo.top, g.logo.top + g.logo.box],
                [g.text.nameTop, g.text.artistTop + 28],
                [g.controlsTop, g.controlsTop + 56],
                [g.volumeTop, g.volumeTop + 36],
            ];
            for (let r = 0; r < rows; r++) {
                const top = g.options.top + r * g.options.rowPitch;
                blocks.push([top, top + g.options.height]);
            }
            const gaps = [blocks[0][0] - 62];
            for (let i = 1; i < blocks.length; i++) {
                gaps.push(blocks[i][0] - blocks[i - 1][1]);
            }
            gaps.push(height - blocks[blocks.length - 1][1]);
            const min = Math.min(...gaps);
            const max = Math.max(...gaps);
            expect(min, model).toBeGreaterThan(10);
            // equal gaps, the rounding rest stays at the bottom
            expect(max - min, `${model}: ${gaps.join(',')}`).toBeLessThanOrEqual(blocks.length + 1);
        }
    });

    it('shows 8 options in 2 rows of 4 on web-p', () => {
        const g = mediaGeometry('web-p').options;
        expect(g.columns).toBe(4);
        expect(g.width).toBe(80);
        // a text option like "22:15" fits into the 80 px cell
        expect(g.fontSize).toBeLessThanOrEqual(20);
        expect(5 * g.fontSize * 0.6).toBeLessThan(g.width - 4);
    });
});
