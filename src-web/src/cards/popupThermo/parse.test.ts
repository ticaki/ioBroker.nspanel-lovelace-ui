import { describe, expect, it } from 'vitest';
import { handleCommand, initial, pageCount, pageModes, parseEntityUpdateDetail } from './parse';

const ctx = { pageType: 'popupThermo', pageArgs: [] };

/** `PageThermo.onPopupRequest`: two mode rows, the third one missing (`~~~`), trailing empty field */
const PAYLOAD =
    'entityUpdateDetail~thermo~~11487~Modus~0?1~Heizen~Aus?Heizen?Kühlen?Auto~Preset~0?2~Komfort~Eco?Komfort?Boost?Nacht?Urlaub~~~~~';

describe('popupThermo', () => {
    it('parses the three rows of the entityUpdateDetail', () => {
        const m = parseEntityUpdateDetail(PAYLOAD.split('~').slice(1), initial(), ctx);
        expect(m.entityName).toBe('thermo');
        expect(m.icon).toBe('');
        expect(m.iconColor).toBe(11487);
        expect(m.rows).toHaveLength(3);
        expect(m.rows[0]).toEqual({
            heading: 'Modus',
            type: '0?1',
            current: 'Heizen',
            list: ['Aus', 'Heizen', 'Kühlen', 'Auto'],
        });
        expect(m.rows[1].type).toBe('0?2');
        expect(m.rows[1].list).toHaveLength(5);
        expect(m.rows[2]).toEqual({ heading: '', type: '', current: '', list: [] });
        expect(m.received).toBe(true);
    });

    it('pages a row three modes at a time', () => {
        const m = parseEntityUpdateDetail(PAYLOAD.split('~').slice(1), initial(), ctx);
        expect(pageCount(m.rows[0])).toBe(2);
        expect(pageModes(m.rows[0], 1)).toEqual([{ index: 3, text: 'Auto' }]);
        expect(pageCount(m.rows[2])).toBe(1);
        expect(pageModes(m.rows[2], 0)).toEqual([]);
    });

    it('drops the trailing CR LF of the modes (emu recording)', () => {
        const m = parseEntityUpdateDetail(
            [
                '7',
                '',
                '11487',
                'Wohnzimmer',
                '7?11',
                'Auto\r\n',
                'Auto\r\n?MANUAL\r\n',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
            ],
            initial(),
            ctx,
        );
        expect(m.rows.filter(r => r.list.length > 0)).toHaveLength(1);
        expect(m.rows[0]?.list).toEqual(['Auto', 'MANUAL']);
        expect(m.rows[0]?.current).toBe('Auto');
    });

    it('falls back to the pageArgs for id and icon and ignores other commands', () => {
        const m = parseEntityUpdateDetail(['', '', '', 'A', '0?0', 'x', 'x?y'], initial(), {
            pageType: 'popupThermo',
            pageArgs: ['thermo', '', ''],
        });
        expect(m.entityName).toBe('thermo');
        expect(m.icon).toBe('');
        expect(m.iconColor).toBe(65535);
        expect(handleCommand('statusUpdate', [], m, ctx)).toBeUndefined();
    });
});
