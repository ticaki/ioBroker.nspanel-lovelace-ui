import { describe, expect, it } from 'vitest';
import { optionalBoolean, optionalNumber, popupEntityId, popupTitle, snapToStep } from './fields';
import { initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

const ctx = { pageType: 'popupSlider', pageArgs: ['number.volume', 'Lautstärke'] };

// payload as built by getDetailPayload('popupSlider'): entityName + 3 x 9 fields
const TWO_SLIDERS =
    'entityUpdateDetail~number.volume~Lautstärke~\u{F0374}~\u{F0416}~35~0~100~~1~enable' +
    '~Bass~\u{F0374}~\u{F0416}~-2~-10~10~0~0.5~enable' +
    '~~~~~~~~~disable';

function args(payload: string): string[] {
    return payload.split('~').slice(1);
}

describe('popupSlider', () => {
    it('parses the visible sliders with their payload number', () => {
        const m = parseEntityUpdateDetail(args(TWO_SLIDERS), initial(), ctx);
        expect(m.received).toBe(true);
        expect(m.entityName).toBe('number.volume');
        expect(m.sliders).toHaveLength(2);
        expect(m.sliders[0]).toEqual({
            number: 1,
            label: 'Lautstärke',
            iconMinus: '\u{F0374}',
            iconPlus: '\u{F0416}',
            value: 35,
            min: 0,
            max: 100,
            zero: undefined,
            step: 1,
        });
        expect(m.sliders[1]).toMatchObject({
            number: 2,
            label: 'Bass',
            value: -2,
            min: -10,
            max: 10,
            zero: 0,
            step: 0.5,
        });
    });

    it('keeps the payload number when the first slider is hidden', () => {
        const payload =
            'entityUpdateDetail~n~~~~~~~~~disable~Mitte~\u{F0374}~\u{F0416}~50~0~100~~1~enable~~~~~~~~~disable';
        const m = parseEntityUpdateDetail(args(payload), initial(), ctx);
        expect(m.sliders.map(s => s.number)).toEqual([2]);
    });

    it('falls back to min, 0..100 and step 1 for empty fields', () => {
        const payload = 'entityUpdateDetail~n~Wert~~~~~~~~enable';
        const m = parseEntityUpdateDetail(args(payload), initial(), ctx);
        expect(m.sliders[0]).toMatchObject({ value: 0, min: 0, max: 100, step: 1, iconMinus: '', iconPlus: '' });
    });

    it('ignores entityUpd', () => {
        const m = parseEntityUpdateDetail(args(TWO_SLIDERS), initial(), ctx);
        expect(parseEntityUpd(['x'], m, ctx)).toBe(m);
    });
});

describe('popup field helpers', () => {
    it('reads disable as undefined', () => {
        expect(optionalNumber('disable')).toBeUndefined();
        expect(optionalNumber('')).toBeUndefined();
        expect(optionalNumber('42')).toBe(42);
        expect(optionalBoolean('1')).toBe(true);
        expect(optionalBoolean('0')).toBe(false);
        expect(optionalBoolean('disable')).toBeUndefined();
    });

    it('prefers the page arguments for id and title', () => {
        expect(popupEntityId(ctx, 'fallback')).toBe('number.volume');
        expect(popupTitle(ctx, 'fallback')).toBe('Lautstärke');
        expect(popupEntityId({ pageType: 'popupSlider', pageArgs: [] }, 'fallback')).toBe('fallback');
        expect(popupTitle({ pageType: 'popupSlider', pageArgs: [] }, 'fallback')).toBe('fallback');
    });

    it('snaps to the step inside the range', () => {
        expect(snapToStep(37.4, 0, 100, 5)).toBe(35);
        expect(snapToStep(-20, -10, 10, 0.5)).toBe(-10);
        expect(snapToStep(1.26, -10, 10, 0.5)).toBe(1.5);
        expect(snapToStep(3.3, 0, 10, 0)).toBe(3.3);
    });
});
