import { describe, expect, it } from 'vitest';
import glyphMap from '../../icons/glyph-map.json';
import { initial, parseEntityUpd } from './parse';

const glyphByName: Record<string, string> = Object.fromEntries(Object.entries(glyphMap).map(([g, n]) => [n, g]));

const ctx = { pageType: 'cardUnlock', pageArgs: [] };

describe('cardUnlock', () => {
    it('parses the unlock payload of pageAlarm.ts (alarmType unlock)', () => {
        const payload = `entityUpd~Haustür~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~unlock.haustuer~Entsperren~U1~~~~~~~${glyphByName['lock-remove']}~63488~enable~enable`;
        const m = parseEntityUpd(payload.split('~').slice(1), initial(), ctx);
        expect(m.title).toBe('Haustür');
        expect(m.id).toBe('unlock.haustuer');
        expect(m.buttons[0]).toEqual({ label: 'Entsperren', action: 'U1' });
        expect(m.buttons[1]).toEqual({ label: '', action: '' });
        expect(m.icon).toBe(glyphByName['lock-remove']);
        expect(m.iconColor).toBe(63488);
        expect(m.numpadEnabled).toBe(true);
        expect(m.flashing).toBe(true);
    });

    it('parses the locked state (triggered)', () => {
        const payload = `entityUpd~Haustür~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~unlock.haustuer~gesperrt~~~~~~~~${glyphByName['lock-off']}~63488~disable~enable`;
        const m = parseEntityUpd(payload.split('~').slice(1), initial(), ctx);
        expect(m.buttons[0]).toEqual({ label: 'gesperrt', action: '' });
        expect(m.numpadEnabled).toBe(false);
    });
});
