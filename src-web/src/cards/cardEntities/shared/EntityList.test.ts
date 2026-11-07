import { describe, expect, it } from 'vitest';
import { ENTITIES_ROW_HEIGHT, ENTITIES_TOP } from '../CardEntities';
import { SCHEDULE_ROW_HEIGHT, SCHEDULE_TOP } from '../../cardSchedule/CardSchedule';
import { entityListLayout } from './EntityList';
import { rowGeometry, valueLineHeight, type RowOptions } from './EntityRow';

function entities(model: Parameters<typeof entityListLayout>[1]): ReturnType<typeof entityListLayout> {
    return entityListLayout('cardEntities', model, ENTITIES_TOP, ENTITIES_ROW_HEIGHT);
}

function schedule(model: Parameters<typeof entityListLayout>[1]): ReturnType<typeof entityListLayout> {
    return entityListLayout('cardSchedule', model, SCHEDULE_TOP, SCHEDULE_ROW_HEIGHT, true);
}

describe('entityListLayout', () => {
    it('keeps the hardware layouts', () => {
        expect(entities('eu')).toEqual({
            count: 4,
            rowHeight: 57,
            compact: false,
            valueWidth: undefined,
            fit: false,
            margin: 33,
        });
        expect(entities('us-l')).toEqual({
            count: 4,
            rowHeight: 57,
            compact: false,
            valueWidth: undefined,
            fit: false,
            margin: 33,
        });
        expect(entities('us-p')).toEqual({
            count: 5,
            rowHeight: 74,
            compact: true,
            valueWidth: undefined,
            fit: true,
            margin: 33,
        });
        expect(schedule('eu')).toEqual({
            count: 6,
            rowHeight: 35,
            compact: true,
            valueWidth: undefined,
            fit: false,
            margin: 33,
        });
        expect(schedule('us-l')).toEqual({
            count: 6,
            rowHeight: 35,
            compact: true,
            valueWidth: undefined,
            fit: false,
            margin: 33,
        });
        expect(schedule('us-p')).toEqual({
            count: 6,
            rowHeight: 46,
            compact: true,
            valueWidth: undefined,
            fit: true,
            margin: 33,
        });
    });

    it('lays the rows out on web-l: normal rows, value column of 220 px', () => {
        expect(entities('web-l')).toEqual({
            count: 4,
            rowHeight: 57,
            compact: false,
            valueWidth: 220,
            fit: true,
            margin: 0,
        });
        // the 6 rows use the height: floor((320 - 79 - 8) / 6)
        expect(schedule('web-l')).toEqual({
            count: 6,
            rowHeight: 38,
            compact: false,
            valueWidth: 220,
            fit: true,
            margin: 0,
        });
    });

    it('lays the rows out on web-p: compact rows, value column of 110 px', () => {
        expect(entities('web-p')).toEqual({
            count: 8,
            rowHeight: 71,
            compact: true,
            valueWidth: 110,
            fit: true,
            margin: 0,
        });
        expect(schedule('web-p')).toEqual({
            count: 11,
            rowHeight: 49,
            compact: true,
            valueWidth: 110,
            fit: true,
            margin: 0,
        });
    });
});

const EU: RowOptions = { compact: false, fit: false, margin: 33 };
const EU_SCHEDULE: RowOptions = { compact: true, fit: false, margin: 33 };
const US_P: RowOptions = { compact: true, fit: true, margin: 33 };
const WEB_P: RowOptions = { compact: true, fit: true, margin: 0, valueWidth: 110 };
const WEB_L: RowOptions = { compact: false, fit: true, margin: 0, valueWidth: 220 };

/** [nameRight, controlRight] of a row */
function edges(type: string, options: RowOptions): [number, number] {
    const g = rowGeometry(type, options);
    return [g.nameRight, g.controlRight];
}

describe('rowGeometry', () => {
    it('keeps the HMI columns of eu and us-l', () => {
        expect(edges('switch', EU)).toEqual([206, 62]);
        expect(edges('shutter', EU)).toEqual([206, 54]);
        expect(edges('number', EU)).toEqual([206, 56]);
        expect(edges('input_sel', EU)).toEqual([206, 56]);
        expect(edges('text', EU)).toEqual([206, 56]);
        expect(rowGeometry('text', EU).valueWidth).toBeUndefined();
        expect(rowGeometry('shutter', EU)).toMatchObject({ shutterCell: 51.5, toggleWidth: 45, sliderWidth: 94 });
        expect(rowGeometry('input_sel', EU).textButtonWidth).toBe(240);
        // cardSchedule: compact rows with the 66 px value box at x 433
        expect(edges('text', EU_SCHEDULE)).toEqual([121, 47]);
        expect(rowGeometry('text', EU_SCHEDULE).valueWidth).toBe(66);
        expect(edges('switch', EU_SCHEDULE)).toEqual([121, 62]);
        expect(edges('shutter', EU_SCHEDULE)).toEqual([121, 54]);
    });

    it('ends the name at the left edge of the control on us-p', () => {
        // shutter: three 44 px tap areas ending at the content edge, the name keeps 320 - 67 - 165 = 88 px
        expect(edges('shutter', US_P)).toEqual([165, 33]);
        expect(rowGeometry('shutter2', US_P).shutterCell).toBe(44);
        expect(edges('switch', US_P)).toEqual([110, 62]);
        expect(edges('text', US_P)).toEqual([121, 47]);
        expect(edges('number', US_P)).toEqual([167, 47]);
        expect(rowGeometry('number', US_P).sliderWidth).toBe(60);
        expect(edges('input_sel', US_P)).toEqual([165, 47]);
        expect(edges('timer', US_P)).toEqual([165, 47]);
        expect(edges('button', US_P)).toEqual([165, 47]);
        expect(edges('', US_P)).toEqual([47, 47]);
    });

    it('uses the full width on web-p: no empty strip, value column 110 px', () => {
        expect(edges('shutter', WEB_P)).toEqual([132, 0]);
        expect(edges('switch', WEB_P)).toEqual([77, 29]);
        expect(edges('text', WEB_P)).toEqual([132, 14]);
        expect(edges('number', WEB_P)).toEqual([134, 14]);
        expect(edges('input_sel', WEB_P)).toEqual([132, 14]);
        expect(rowGeometry('input_sel', WEB_P).textButtonWidth).toBe(110);
    });

    it('uses the full width on web-l: value column 220 px, the name ends at every control', () => {
        expect(edges('shutter', WEB_L)).toEqual([175.5, 21]);
        expect(edges('switch', WEB_L)).toEqual([82, 29]);
        expect(edges('text', WEB_L)).toEqual([242, 14]);
        expect(edges('number', WEB_L)).toEqual([168, 14]);
        expect(edges('input_sel', WEB_L)).toEqual([242, 14]);
        expect(rowGeometry('text', WEB_L).valueWidth).toBe(220);
    });
});

describe('valueLineHeight', () => {
    it('leaves room for the descenders and grows by an even number of pixels', () => {
        expect(valueLineHeight(17)).toBe(23);
        expect(valueLineHeight(18)).toBe(24);
        for (const size of [12, 17, 18, 24]) {
            expect((valueLineHeight(size) - size) % 2).toBe(0);
            expect(valueLineHeight(size)).toBeGreaterThanOrEqual(size * 1.2);
        }
        // fits the tightest row (cardSchedule eu, 35 px)
        expect(valueLineHeight(17)).toBeLessThan(35);
    });
});
