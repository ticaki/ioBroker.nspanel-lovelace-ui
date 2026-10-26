import { describe, expect, it } from 'vitest';
import glyphMap from '../../icons/glyph-map.json';
import { handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

const glyphByName: Record<string, string> = Object.fromEntries(Object.entries(glyphMap).map(([g, n]) => [n, g]));

/** HMI glyph of a MDI icon name */
function glyph(name: string): string {
    return glyphByName[name];
}

const ctx = { pageType: 'cardAlarm', pageArgs: [] };

/** what `pageAlarm.ts` sends while the alarm is armed (four disarm buttons, shield-home in red) */
const ARMED = `entityUpd~Alarm~button~bSubPrev~${glyph('arrow-up-bold')}~65535~~~button~bSubNext~~65535~~~alarm.haus~Deaktivieren - Zuhause~D1~Deaktivieren - Unterwegs~D2~Deaktivieren - Nacht~D3~~~${glyph('shield-home')}~63488~enable~disable`;

/** pin fail timeout: text in the first two buttons without actions, numpad disabled, icon flashing */
const LOCKED = `entityUpd~Alarm~button~bSubPrev~${glyph('arrow-up-bold')}~65535~~~button~bSubNext~~65535~~~alarm.haus~gesperrt für~~ 4 s~~~~~~${glyph('key-alert-outline')}~63488~disable~enable`;

function args(payload: string): string[] {
    return payload.split('~').slice(1);
}

describe('cardAlarm', () => {
    it('parses the armed state of the adapter', () => {
        const m = parseEntityUpd(args(ARMED), initial(), ctx);
        expect(m.title).toBe('Alarm');
        expect(m.navigation.left.id).toBe('bSubPrev');
        expect(m.navigation.left.icon).toBe(glyph('arrow-up-bold'));
        expect(m.navigation.right.icon).toBe('');
        expect(m.id).toBe('alarm.haus');
        expect(m.buttons).toEqual([
            { label: 'Deaktivieren - Zuhause', action: 'D1' },
            { label: 'Deaktivieren - Unterwegs', action: 'D2' },
            { label: 'Deaktivieren - Nacht', action: 'D3' },
            { label: '', action: '' },
        ]);
        expect(m.icon).toBe(glyph('shield-home'));
        expect(m.iconColor).toBe(63488);
        expect(m.numpadEnabled).toBe(true);
        expect(m.flashing).toBe(false);
        expect(m.cornerButton).toBeUndefined();
    });

    it('parses the locked state (numpad disabled, flashing)', () => {
        const m = parseEntityUpd(args(LOCKED), initial(), ctx);
        expect(m.buttons[0]).toEqual({ label: 'gesperrt für', action: '' });
        expect(m.buttons[1]).toEqual({ label: ' 4 s', action: '' });
        expect(m.icon).toBe(glyph('key-alert-outline'));
        expect(m.numpadEnabled).toBe(false);
        expect(m.flashing).toBe(true);
    });

    it('parses the unlock variant', () => {
        const m = parseEntityUpd(
            args(
                `entityUpd~Tür~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~unlock.tuer~Entsperren~U1~~~~~~~${glyph('lock-remove')}~63488~enable~enable`,
            ),
            initial(),
            ctx,
        );
        expect(m.buttons[0]).toEqual({ label: 'Entsperren', action: 'U1' });
        expect(m.icon).toBe(glyph('lock-remove'));
        expect(m.flashing).toBe(true);
    });

    it('reads the optional corner button of the HMI readme', () => {
        const m = parseEntityUpd([...args(ARMED), glyph('home'), '65504', 'bHome'], initial(), ctx);
        expect(m.cornerButton).toEqual({ icon: glyph('home'), iconColor: 65504, id: 'bHome' });
    });

    it('tolerates a short payload', () => {
        const m = parseEntityUpd(['Alarm'], initial(), ctx);
        expect(m.title).toBe('Alarm');
        expect(m.buttons).toHaveLength(4);
        expect(m.numpadEnabled).toBe(false);
    });

    it('has no popups and no other commands', () => {
        const m = initial();
        expect(parseEntityUpdateDetail(['x'], m, ctx)).toBeUndefined();
        expect(handleCommand('color', ['1'], m, ctx)).toBeUndefined();
    });
});
