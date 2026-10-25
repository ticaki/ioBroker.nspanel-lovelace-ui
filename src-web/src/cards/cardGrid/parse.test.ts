import { describe, expect, it } from 'vitest';
import { gridLayout } from './CardGrid';
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

    it('keeps at most 9 tiles (cardGrid2 on us-p)', () => {
        const many = ['T', ...Array<string>(12).fill('')];
        for (let i = 0; i < 12; i++) {
            many.push('switch', `id${i}`, '', '65535', `n${i}`, '1');
        }
        expect(parseEntityUpd(many, initial(), ctx).entities).toHaveLength(9);
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
});
