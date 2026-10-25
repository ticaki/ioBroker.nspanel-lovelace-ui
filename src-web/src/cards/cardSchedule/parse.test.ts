import { describe, expect, it } from 'vitest';
import { initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

const ctx = { pageType: 'cardSchedule', pageArgs: [] };

/** what PageSchedule sends for cardTrash: 6 text rows */
const TRASH =
    'entityUpd~Testabfall~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~text~4?1?0~~17299~Papier~03.02.26~text~4?1?1~~65504~Gelbe Tonne~03.02.26~text~4?1?2~~41667~Biomüll~06.02.26~text~4?1?3~~38066~Müll~10.02.26~text~4?1?4~~41667~Biomüll~20.02.26~text~4?1?5~~65504~Gelbe Tonne~24.02.26';

describe('cardSchedule parse', () => {
    it('parses 6 rows', () => {
        const m = parseEntityUpd(TRASH.split('~').slice(1), initial(), ctx);
        expect(m.title).toBe('Testabfall');
        expect(m.entities).toHaveLength(6);
        expect(m.entities[5]).toEqual({
            type: 'text',
            id: '4?1?5',
            icon: '',
            iconColor: 65504,
            displayName: 'Gelbe Tonne',
            optionalValue: '24.02.26',
        });
    });

    it('fills missing rows as empty and cuts beyond 6', () => {
        const short = parseEntityUpd(
            ['T', ...Array<string>(12).fill(''), 'text', 'a', '', '1', 'n', 'v'],
            initial(),
            ctx,
        );
        expect(short.entities).toHaveLength(1);
        const many = ['T', ...Array<string>(12).fill('')];
        for (let i = 0; i < 8; i++) {
            many.push('text', `id${i}`, '', '65535', `n${i}`, 'v');
        }
        expect(parseEntityUpd(many, initial(), ctx).entities).toHaveLength(6);
    });

    it('does not handle entityUpdateDetail', () => {
        expect(parseEntityUpdateDetail([], initial(), ctx)).toBeUndefined();
    });
});
