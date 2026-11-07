import { describe, expect, it } from 'vitest';
import type { PanelModel } from '../../protocol/types';
import { stageSize } from '../../style/theme';
import { areaSizes } from './parse';
import {
    ADVANCED_PORTRAIT_SEPARATOR,
    advancedIndicatorCells,
    easyviewColumns,
    isWebPortrait,
    landscapeWidth,
    notifyTextBox,
    portraitColumns,
    standardColumns,
    tilesGeometry,
    type Box,
} from './layout';

/** `true` when the two boxes overlap */
function overlaps(a: Box, b: Box): boolean {
    return (
        a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height
    );
}

/** every box lies on the stage of the model */
function onStage(boxes: readonly Box[], model: PanelModel): boolean {
    const stage = stageSize(model);
    return boxes.every(
        b => b.left >= 0 && b.top >= 0 && b.left + b.width <= stage.width && b.top + b.height <= stage.height,
    );
}

describe('screensaver layout', () => {
    it('uses the portrait layouts only on web-p, the eu width on us-p', () => {
        expect(isWebPortrait('web-p')).toBe(true);
        expect(isWebPortrait('us-p')).toBe(false);
        expect(isWebPortrait('web-l')).toBe(false);
        expect(landscapeWidth('eu')).toBe(480);
        expect(landscapeWidth('us-l')).toBe(480);
        expect(landscapeWidth('us-p')).toBe(480);
        expect(landscapeWidth('web-l')).toBe(640);
    });

    it('keeps the eu columns of standard, alternate and EasyView', () => {
        expect(standardColumns(4, false).map(c => c.left)).toEqual([137, 219, 301, 383]);
        expect(standardColumns(3, true).map(c => c.left)).toEqual([219, 301, 383]);
        expect(easyviewColumns(3, 480).map(c => [c.left, c.width])).toEqual([
            [23, 144],
            [167, 144],
            [311, 144],
        ]);
    });

    it('widens the columns on web-l', () => {
        const standard = standardColumns(areaSizes('standard', 'web-l').bottom, false);
        expect(standard).toHaveLength(6);
        expect(standard[5].left + standard[5].width).toBeLessThanOrEqual(640);
        const alternate = standardColumns(areaSizes('alternate', 'web-l').bottom, true);
        expect(alternate.map(c => c.left)).toEqual([219, 301, 383, 465, 547]);
        const easy = easyviewColumns(areaSizes('easyview', 'web-l').bottom, 640);
        expect(easy.map(c => c.width)).toEqual([148, 148, 148, 148]);
        const indicators = advancedIndicatorCells('web-l', areaSizes('advanced', 'web-l').indicator);
        expect(indicators.map(c => c.left)).toEqual([178, 234, 290, 346, 402, 458, 514, 570]);
        expect(onStage(indicators, 'web-l')).toBe(true);
    });

    it('lays the web-p bottom out in rows of 4 columns of 80 px', () => {
        const columns = portraitColumns(7, [420, 527]);
        expect(columns.map(c => [c.left, c.top])).toEqual([
            [0, 420],
            [80, 420],
            [160, 420],
            [240, 420],
            [0, 527],
            [80, 527],
            [160, 527],
        ]);
        expect(portraitColumns(9, [0, 100])).toHaveLength(8);
        const cells = advancedIndicatorCells('web-p', 12);
        // 1-4: 2 x 2 block right of the left column, below time and date
        expect(cells.slice(0, 4).map(c => [c.left, c.top, c.width, c.height])).toEqual([
            [160, 110, 80, 60],
            [240, 110, 80, 60],
            [160, 170, 80, 60],
            [240, 170, 80, 60],
        ]);
        // 5-12: two rows of 4
        expect(cells.slice(4).map(c => [c.left, c.top])).toEqual([
            [0, 240],
            [80, 240],
            [160, 240],
            [240, 240],
            [0, 288],
            [80, 288],
            [160, 288],
            [240, 288],
        ]);
        expect(onStage(cells, 'web-p')).toBe(true);
        cells.forEach((a, i) => cells.slice(i + 1).forEach(b => expect(overlaps(a, b)).toBe(false)));
        // the separator lies between the last indicator row and the first bottom row (346)
        expect(Math.max(...cells.map(c => c.top + c.height))).toBeLessThanOrEqual(ADVANCED_PORTRAIT_SEPARATOR);
        expect(ADVANCED_PORTRAIT_SEPARATOR).toBeLessThan(346);
    });

    it('keeps the eu tiles geometry', () => {
        const geo = tilesGeometry('eu');
        expect(geo.indicators.map(c => [c.left, c.top])).toEqual([
            [16, 0],
            [106, 0],
            [196, 0],
            [286, 0],
            [376, 0],
            [16, 107],
            [376, 107],
        ]);
        expect(geo.bottom.map(c => [c.left, c.top])).toEqual([
            [16, 214],
            [106, 214],
            [196, 214],
            [286, 214],
            [376, 214],
        ]);
        expect(geo.clock).toEqual({ left: 106, top: 112, width: 270, height: 81 });
        expect(geo.timeIcon).toEqual({ top: 141, left: 99 });
        expect(geo.bars).toEqual([
            { left: 17, top: 315, width: 184, height: 5 },
            { left: 281, top: 315, width: 184, height: 5 },
        ]);
        expect(tilesGeometry('us-l')).toEqual(geo);
    });

    it('has a cell for every tiles place of every model, without overlap', () => {
        for (const model of ['eu', 'us-l', 'us-p', 'web-l', 'web-p'] as const) {
            const geo = tilesGeometry(model);
            const sizes = areaSizes('tiles', model);
            expect(geo.indicators, model).toHaveLength(sizes.indicator);
            expect(geo.bottom, model).toHaveLength(sizes.bottom);
            // the bottom cells up to the end of the value (cap top 73, 18 px)
            const bottom: Box[] = geo.bottom.map(c => ({ left: c.left, top: c.top ?? 0, width: c.width, height: 91 }));
            const boxes = [...geo.indicators, ...bottom, geo.clock, ...geo.bars];
            expect(onStage(boxes, model), model).toBe(true);
            boxes.forEach((a, i) =>
                boxes
                    .slice(i + 1)
                    .forEach(b => expect(overlaps(a, b), `${model} ${JSON.stringify([a, b])}`).toBe(false)),
            );
        }
    });

    it('puts the web-l clock between two indicators on each side and the web-p rows in the HMI order', () => {
        const webl = tilesGeometry('web-l');
        expect(webl.clock).toEqual({ left: 185, top: 112, width: 270, height: 81 });
        expect(webl.indicators.slice(7).map(c => c.left)).toEqual([5, 95, 455, 545]);
        const webp = tilesGeometry('web-p');
        expect(webp.indicators.map(c => c.top)).toEqual([0, 0, 0, 0, 128, 128, 128, 128]);
        expect(webp.clock.top).toBe(261);
        expect(webp.bottom.map(c => c.top)).toEqual([366, 366, 366, 366, 473, 473, 473, 473]);
        expect(webp.bars.map(b => [b.left, b.top, b.width])).toEqual([
            [1, 630, 130],
            [189, 630, 130],
        ]);
        expect(webp.notify.lines).toBe(6);
        const usp = tilesGeometry('us-p');
        expect(usp.indicators.map(c => c.top)).toEqual([0, 0, 0, 0, 238, 238, 238, 238]);
        expect(usp.bottom.map(c => c.top)).toEqual([368, 368, 368, 368]);
        expect(usp.notify.lines).toBe(2);
    });

    it('places the notification text centred in landscape and full width in portrait', () => {
        expect(notifyTextBox(480, false)).toEqual({ left: 88, width: 304 });
        expect(notifyTextBox(640, false)).toEqual({ left: 168, width: 304 });
        expect(notifyTextBox(320, true)).toEqual({ left: 8, width: 304 });
    });
});
