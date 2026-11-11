import { describe, expect, it } from 'vitest';
import { gridLayout, tileTouch } from './CardGrid';
import { initial, parseEntityUpd } from './parse';

const ctx = { pageType: 'cardGrid', pageArgs: [] };

/** what PageGrid sends for cardGrid2: 8 options, unused ones are `~~~~~` */
const GRID2 = `entityUpd~Wohnzimmer~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~switch~2?1?0~~65504~Decke~1~switch~2?1?1~~17299~Stehlampe~0~shutter~2?1?2~~65535~Rollo~|||enable|enable|enable~fan~2?1?3~~17299~Lüfter~0${'~'.repeat(4 * 6)}`;

describe('cardGrid parse', () => {
    it('parses the readme example (same format as cardEntities)', () => {
        const raw =
            'entityUpd~LightTest~button~navigate.prev~<~65535~~~button~navigate.next~>~65535~~~light~light.bed_light~A~17299~Bed Light~0~light~light.ceiling_lights~B~52231~Ceiling Lights~1~switch~switch.ac~C~17299~AC~0~switch~switch.decorative_lights~D~65222~Decorative Lights~1';
        const m = parseEntityUpd(raw.split('~').slice(1), initial(), ctx);
        expect(m.title).toBe('LightTest');
        expect(m.entities.map(e => e.id)).toEqual([
            'light.bed_light',
            'light.ceiling_lights',
            'switch.ac',
            'switch.decorative_lights',
        ]);
    });

    it('parses 8 slots of a cardGrid2 payload including the empty ones', () => {
        const m = parseEntityUpd(GRID2.split('~').slice(1), initial(), { pageType: 'cardGrid2', pageArgs: [] });
        expect(m.entities).toHaveLength(8);
        expect(m.navigation.left.id).toBe('bSubPrev');
        expect(m.entities[2].type).toBe('shutter');
        expect(m.entities[3].displayName).toBe('Lüfter');
        expect(m.entities[4].type).toBe('');
    });

    it('keeps at most 15 tiles (cardGrid2 on web-p)', () => {
        const many = ['T', ...Array<string>(12).fill('')];
        for (let i = 0; i < 18; i++) {
            many.push('switch', `id${i}`, '', '65535', `n${i}`, '1');
        }
        expect(parseEntityUpd(many, initial(), ctx).entities).toHaveLength(15);
    });

    it('lays the tiles out as 3x2, 4x2 (us-p 3x3) and 2x2', () => {
        expect(gridLayout('cardGrid', 'eu')).toMatchObject({ columns: 3, rows: 2, columnWidth: 147, rowHeight: 119 });
        expect(gridLayout('cardGrid2', 'eu')).toMatchObject({ columns: 4, rows: 2, columnWidth: 112 });
        expect(gridLayout('cardGrid2', 'us-p')).toMatchObject({ columns: 3, rows: 3 });
        expect(gridLayout('cardGrid3', 'eu')).toMatchObject({
            columns: 2,
            rows: 2,
            columnWidth: 223,
            nameFontSize: 24,
        });
    });

    it('lays the tiles out on the web models (doc/web-panel/SMARTPHONE.md)', () => {
        // web-l: contentWidth 640 (no empty strip), rows of 119
        expect(gridLayout('cardGrid', 'web-l')).toMatchObject({
            columns: 4,
            rows: 2,
            columnWidth: 160,
            rowHeight: 119,
        });
        expect(gridLayout('cardGrid2', 'web-l')).toMatchObject({
            columns: 5,
            rows: 2,
            columnWidth: 128,
            rowHeight: 119,
        });
        expect(gridLayout('cardGrid3', 'web-l')).toMatchObject({
            columns: 3,
            rows: 2,
            columnWidth: 213,
            rowHeight: 119,
            valueWidth: 140,
            nameFontSize: 24,
        });
        // web-p: contentWidth 320, rows share 640 - 62 - 18 = 560
        expect(gridLayout('cardGrid', 'web-p')).toMatchObject({
            columns: 2,
            rows: 5,
            columnWidth: 160,
            rowHeight: 112,
        });
        expect(gridLayout('cardGrid2', 'web-p')).toMatchObject({
            columns: 3,
            rows: 5,
            columnWidth: 106,
            rowHeight: 112,
        });
        expect(gridLayout('cardGrid3', 'web-p')).toMatchObject({
            columns: 2,
            rows: 4,
            columnWidth: 160,
            rowHeight: 140,
        });
    });

    it('keeps the hardware layouts', () => {
        expect(gridLayout('cardGrid', 'us-l')).toMatchObject({ columns: 3, left: 1, columnWidth: 147 });
        // us-p uses the full 320 px like its HMI (tile centres 83 / 238 and 53 / 159 / 267)
        expect(gridLayout('cardGrid', 'us-p')).toMatchObject({ columns: 2, rows: 3, columnWidth: 160, rowHeight: 133 });
        expect(gridLayout('cardGrid2', 'us-p')).toMatchObject({
            columns: 3,
            rows: 3,
            columnWidth: 106,
            rowHeight: 133,
        });
        expect(gridLayout('cardGrid3', 'us-p')).toMatchObject({
            columns: 2,
            rows: 2,
            columnWidth: 160,
            rowHeight: 200,
        });
    });

    it('switches a tile on a short tap and opens its popup when it is held', () => {
        // how the HMI behaves (checked against a real panel): a tap switches, holding opens the
        // detail popup - a light tile must not send `buttonPress3`, the adapter would switch it
        expect(tileTouch('light', false)).toEqual({ kind: 'press' });
        expect(tileTouch('light', true)).toEqual({ kind: 'popup', popup: 'popupLight' });
        expect(tileTouch('light2', true)).toEqual({ kind: 'popup', popup: 'popupLightNew' });
        expect(tileTouch('fan', true)).toEqual({ kind: 'popup', popup: 'popupFan' });
        expect(tileTouch('shutter', true)).toEqual({ kind: 'popup', popup: 'popupShutter' });
        expect(tileTouch('shutter2', true)).toEqual({ kind: 'popup', popup: 'popupShutter2' });
        expect(tileTouch('number', true)).toEqual({ kind: 'popup', popup: 'popupSlider' });
        expect(tileTouch('input_sel', true)).toEqual({ kind: 'popup', popup: 'popupInSel' });
        expect(tileTouch('timer', true)).toEqual({ kind: 'popup', popup: 'popupTimer' });
    });

    it('keeps the long press event for tiles without a popup', () => {
        for (const type of ['switch', 'button', 'text', '']) {
            expect(tileTouch(type, false)).toEqual({ kind: 'press' });
            expect(tileTouch(type, true)).toEqual({ kind: 'longPress' });
        }
    });
});
