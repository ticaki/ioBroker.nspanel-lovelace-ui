import { describe, expect, it } from 'vitest';
import {
    ENTRIES_PER_PAGE,
    entriesPerPage,
    inSelGrid,
    handleCommand,
    initial,
    normalizeEntry,
    pageCount,
    pageEntries,
    parseEntityUpdateDetail,
    parseEntityUpdateDetail2,
} from './parse';

const ctx = { pageType: 'popupInSel', pageArgs: [] };

/** `PageItem.getDetailPayload` type `insel` for an alexa speaker list (formatInSelText adds `\r\n`) */
const PAYLOAD =
    'entityUpdateDetail2~0?2~~1374~Lautsprecher~Echo Spot\r\nBuero~Esszimmer\r\nAlexa?Heimkino?Esszimmer?Echo Dot\r\nGästezimmer?Echo Spot\r\nBuero?Terrasse\r\n(Sonos)?Überall?Echo 4\r\nGartenhaus 2';

describe('popupInSel', () => {
    it('parses entityUpdateDetail2 via handleCommand', () => {
        const fields = PAYLOAD.split('~');
        const m = handleCommand(fields[0], fields.slice(1), initial(), ctx);
        expect(m).toBeDefined();
        expect(m?.entityName).toBe('0?2');
        expect(m?.iconColor).toBe(1374);
        expect(m?.type).toBe('Lautsprecher');
        expect(m?.current).toBe('Echo Spot\nBuero');
        expect(m?.list).toHaveLength(8);
        expect(m?.list[3]).toBe('Echo Dot\nGästezimmer');
        expect(m?.received).toBe(true);
    });

    it('ignores other commands and entityUpdateDetail', () => {
        expect(handleCommand('entityUpdateDetail', ['a'], initial(), ctx)).toBeUndefined();
        expect(parseEntityUpdateDetail(['a'], initial(), ctx)).toBeUndefined();
    });

    it('pages 12 entries at a time', () => {
        const list = Array.from({ length: 30 }, (_, i) => `e${i}`).join('?');
        const m = parseEntityUpdateDetail2(['x', '', '65535', 'T', 'e13', list], initial(), ctx);
        expect(pageCount(m)).toBe(3);
        expect(pageEntries(m, 0)).toHaveLength(ENTRIES_PER_PAGE);
        expect(pageEntries(m, 2).map(e => e.index)).toEqual([24, 25, 26, 27, 28, 29]);
        expect(pageEntries(m, 1)[0]).toEqual({ index: 12, text: 'e12' });
        expect(pageCount(parseEntityUpdateDetail2(['x', '', '', 'T', '', ''], m, ctx))).toBe(1);
    });

    it('pages 16 entries on the web models (web-l 4 x 4, web-p 2 x 8)', () => {
        expect(entriesPerPage('eu')).toBe(12);
        expect(entriesPerPage('us-l')).toBe(12);
        expect(entriesPerPage('web-l')).toBe(16);
        expect(entriesPerPage('web-p')).toBe(16);
        expect(entriesPerPage('us-p')).toBe(12);
        expect(inSelGrid('web-p')).toMatchObject({ columns: 2, rows: 8, columnWidth: 150 });
        expect(inSelGrid('web-l')).toMatchObject({ columns: 4, rows: 4, columnWidth: 156, columnLeft: 8 });
        const list = Array.from({ length: 30 }, (_, i) => `e${i}`).join('?');
        const m = parseEntityUpdateDetail2(['x', '', '65535', 'T', 'e13', list], initial(), ctx);
        expect(pageCount(m, 16)).toBe(2);
        expect(pageEntries(m, 1, 16)[0]).toEqual({ index: 16, text: 'e16' });
        // the last row of web-p stays above the bottom of the stage
        const g = inSelGrid('web-p');
        expect(g.rowCenterY + (g.rows - 0.5) * g.rowPitch).toBeLessThanOrEqual(640);
        const u = inSelGrid('us-p');
        expect(u.rowCenterY + (u.rows - 0.5) * u.rowPitch).toBeLessThanOrEqual(480);
    });

    it('drops the trailing CR LF of the entries (formatInSelText, emu recording)', () => {
        const m = parseEntityUpdateDetail2(
            ['4?6', '', '2016', 'Auswahl', 'Komfort\r\n', 'Aus\r\n?Eco\r\n?Komfort\r\n?Boost\r\n'],
            initial(),
            ctx,
        );
        expect(m.list).toEqual(['Aus', 'Eco', 'Komfort', 'Boost']);
        expect(m.current).toBe('Komfort');
        expect(normalizeEntry('Echo Spot\r\nBuero\r\n')).toBe('Echo Spot\nBuero');
    });

    it('uses the pageArgs as fallback for entity name and icon', () => {
        const m = parseEntityUpdateDetail2(['', '', '', 'T', '', ''], initial(), {
            pageType: 'popupInSel',
            pageArgs: ['1?0', '', ''],
        });
        expect(m.entityName).toBe('1?0');
        expect(m.icon).toBe('');
        expect(m.list).toEqual([]);
        expect(m.iconColor).toBe(65535);
    });
});
