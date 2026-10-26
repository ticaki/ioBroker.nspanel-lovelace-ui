import { describe, expect, it } from 'vitest';
import { initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

const ctx = { pageType: 'popupFan', pageArgs: ['fan.living', 'Ventilator'] };

function args(payload: string): string[] {
    return payload.split('~').slice(1);
}

describe('popupFan', () => {
    it('parses switch, speed and the mode list', () => {
        // getDetailPayload('popupFan'): entityName~icon~iconColor~buttonstate~slider1~slider1Max~speedText~mode~modeList
        const m = parseEntityUpdateDetail(
            args('entityUpdateDetail~fan.living~\u{F0210}~1024~1~2~5~Stufe~Auto~Aus?Niedrig?Mittel?Hoch?Auto'),
            initial(),
            ctx,
        );
        expect(m).toEqual({
            entityName: 'fan.living',
            icon: '\u{F0210}',
            iconColor: 1024,
            power: true,
            speed: 2,
            speedMax: 5,
            speedLabel: 'Stufe',
            mode: 'Auto',
            modes: ['Aus', 'Niedrig', 'Mittel', 'Hoch', 'Auto'],
            received: true,
        });
    });

    it('handles a fan without modes and without speed', () => {
        const m = parseEntityUpdateDetail(args('entityUpdateDetail~fan.1~\u{F0210}~65535~0~~100~~~'), initial(), ctx);
        expect(m.power).toBe(false);
        expect(m.speed).toBeUndefined();
        expect(m.speedMax).toBe(100);
        expect(m.modes).toEqual([]);
        expect(m.mode).toBe('');
    });

    it('keeps the line breaks the adapter formats into the mode texts', () => {
        const m = parseEntityUpdateDetail(
            args('entityUpdateDetail~f~~~1~1~3~~Sehr\r\nhoch~Niedrig?Sehr\r\nhoch'),
            initial(),
            ctx,
        );
        expect(m.modes).toEqual(['Niedrig', 'Sehr\r\nhoch']);
        expect(m.mode).toBe('Sehr\r\nhoch');
    });

    it('ignores entityUpd', () => {
        const m = initial();
        expect(parseEntityUpd(['x'], m, ctx)).toBe(m);
    });
});
