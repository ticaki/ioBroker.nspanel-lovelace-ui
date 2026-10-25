import { describe, expect, it } from 'vitest';
import { clampTime, handleCommand, initial, pad2, parseEntityUpdateDetail } from './parse';

const ctx = { pageType: 'popupTimer', pageArgs: [] };

describe('popupTimer', () => {
    it('parses a paused timer (role timer, value > 0)', () => {
        // PageItem.getDetailPayload popupTimer: entityName, '', iconColor, entityName, min, sec, editable, a1-3, t1-3
        const args = '0?3~~2016~0?3~5~30~0~begin~~clear~Weiter~~Löschen'.split('~');
        const m = parseEntityUpdateDetail(args, initial(), ctx);
        expect(m.entityName).toBe('0?3');
        expect(m.iconColor).toBe(2016);
        expect(m.minutes).toBe(5);
        expect(m.seconds).toBe(30);
        expect(m.editable).toBe(false);
        expect(m.buttons).toEqual([
            { action: 'begin', label: 'Weiter' },
            { action: '', label: '' },
            { action: 'clear', label: 'Löschen' },
        ]);
        expect(m.updates).toBe(1);
    });

    it('parses a running timer and an editable stopped one', () => {
        const run = parseEntityUpdateDetail('t~~63488~t~0~59~0~~pause~~~Pause~'.split('~'), initial(), ctx);
        expect(run.buttons.map(b => b.action)).toEqual(['', 'pause', '']);
        expect(run.seconds).toBe(59);
        const idle = parseEntityUpdateDetail('t~~2016~t~0~0~1~begin~~clear~Start~~clear'.split('~'), run, ctx);
        expect(idle.editable).toBe(true);
        expect(idle.updates).toBe(2);
    });

    it('clamps to 0-59 and pads to two digits', () => {
        const m = parseEntityUpdateDetail(['t', '', '', 't', '75', '-3', '1'], initial(), ctx);
        expect(m.minutes).toBe(59);
        expect(m.seconds).toBe(0);
        expect(clampTime(12.7)).toBe(12);
        expect(pad2(7)).toBe('07');
        expect(pad2(42)).toBe('42');
    });

    it('falls back to the pageArgs and ignores other commands', () => {
        const m = parseEntityUpdateDetail(['', '', '', ''], initial(), {
            pageType: 'popupTimer',
            pageArgs: ['1?4', '', ''],
        });
        expect(m.entityName).toBe('1?4');
        expect(m.icon).toBe('');
        expect(handleCommand('statusUpdate', [], m, ctx)).toBeUndefined();
    });
});
