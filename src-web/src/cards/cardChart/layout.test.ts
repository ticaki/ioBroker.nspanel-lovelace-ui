import { describe, expect, it } from 'vitest';
import { parseCommand } from '../../protocol/commands';
import { stageSize } from '../../style/theme';
import { layoutChart, PLOT, PLOT_BAR, PLOT_BAR_PORTRAIT, PLOT_PORTRAIT, plotFor, type Primitive } from './layout';
import { initial, parseEntityUpd } from './parse';

const NAV = 'button~bSubPrev~~65535~~~button~bSubNext~~65535~~~';
const BAR = `entityUpd~Strom~${NAV}48192~W~20:40:60:80:100~10~70^6:00~30~90^12:00~50~60^18:00~20~40^0:00`;
const LINE = `entityUpd~Temp~${NAV}48192~°C~100:150:200:250~0^02:00+120+240^06:00~0:136~60:133~120:130~180:125~240:120`;

function parse(payload: string, pageType: string): ReturnType<typeof initial> {
    return parseEntityUpd(parseCommand(payload).args, initial(), { pageType, pageArgs: [] });
}

/**
 * smallest and largest x / y of the drawn primitives; a text box counts with its centre (the x labels
 * are centred on their tick in a box of 12 px per character, wider than the text)
 */
function extent(primitives: Primitive[]): { minX: number; maxX: number; minY: number; maxY: number } {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const p of primitives) {
        if (p.kind === 'line' || p.kind === 'rect') {
            xs.push(p.x1, p.x2);
            ys.push(p.y1, p.y2);
        } else if (p.kind === 'fill') {
            xs.push(p.x, p.x + p.w);
            ys.push(p.y, p.y + p.h);
        } else if (!p.rotated) {
            xs.push(p.x + p.w / 2);
            ys.push(p.y, p.y + p.h);
        }
    }
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

describe('plotFor', () => {
    it('keeps the eu plot areas on the landscape models', () => {
        expect(plotFor('bar')).toBe(PLOT_BAR);
        expect(plotFor('line')).toBe(PLOT);
        expect(plotFor('bar', 'eu')).toBe(PLOT_BAR);
        expect(plotFor('line', 'us-l')).toBe(PLOT);
    });

    it('uses the hotspot m0 of the us-p HMI on the portrait models', () => {
        expect(plotFor('bar', 'us-p')).toEqual({ x: 10, y: 90, w: 300, h: 370 });
        expect(plotFor('bar', 'web-p')).toBe(PLOT_BAR_PORTRAIT);
        // the line chart keeps the offset of the eu plot to its hotspot
        expect(PLOT_PORTRAIT.x - PLOT_BAR_PORTRAIT.x).toBe(PLOT.x - PLOT_BAR.x);
        expect(PLOT_PORTRAIT.y + PLOT_PORTRAIT.h).toBe(
            PLOT_BAR_PORTRAIT.y + PLOT_BAR_PORTRAIT.h + (PLOT.y + PLOT.h - PLOT_BAR.y - PLOT_BAR.h),
        );
        expect(plotFor('line', 'us-p')).toBe(PLOT_PORTRAIT);
    });

    it('draws both charts inside the us-p stage below the title bar', () => {
        const { width, height } = stageSize('us-p');
        for (const [payload, pageType] of [
            [BAR, 'cardChart'],
            [LINE, 'cardLChart'],
        ] as const) {
            const model = parse(payload, pageType);
            const { primitives } = layoutChart(model, plotFor(model.kind, 'us-p'));
            const box = extent(primitives);
            expect(box.minX).toBeGreaterThanOrEqual(0);
            expect(box.maxX).toBeLessThanOrEqual(width);
            expect(box.minY).toBeGreaterThanOrEqual(62);
            expect(box.maxY).toBeLessThanOrEqual(height);
        }
    });
});
