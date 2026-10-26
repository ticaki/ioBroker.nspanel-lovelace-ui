import { describe, expect, it } from 'vitest';
import { entityPressEvent } from './entityPress';
import { handleCommand, initial, MEDIA_OPTIONS, parseEntityUpd, parseEntityUpdateDetail, parseOnOff } from './parse';

const ctx = { pageType: 'cardMedia', pageArgs: [] };

/** what PageMedia.getMessage sends for a spotify player (glyphs of play/pause, shuffle, speaker, …) */
const SPOTIFY =
    'entityUpd~Spotify: Küche~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~media~Your Best Excuse | 0:14-4:17~63488~Hands on the Wheel | Hartmann~65535~45~~65535~~number~logo~logo-spotify~2016~Seek~~input_sel~0~~2016~Speaker~PRESS~input_sel~1~~2016~Playlist~PRESS~input_sel~2~~2016~Tracklist~PRESS~number~3~~2016~Equalizer~~button~4~~2016~Repeat~1';

/** the example of HMI/Readme.md */
const README =
    "entityUpd~Kitchen~button~navigation.up~U~65535~~~delete~~~~~~media_player.kitchen~I'm a Hurricane~~Wellmess~~100~A~64704~B~media_pl~media_player.kitchen~C~17299~Kitchen~";

function args(payload: string): string[] {
    return payload.split('~').slice(1);
}

describe('cardMedia parse', () => {
    it('parses the adapter payload', () => {
        const m = parseEntityUpd(args(SPOTIFY), initial(), ctx);
        expect(m.title).toBe('Spotify: Küche');
        expect(m.navigation.left.id).toBe('bSubPrev');
        expect(m.navigation.right.icon).toBe('');
        expect(m.id).toBe('media');
        expect(m.name).toBe('Your Best Excuse | 0:14-4:17');
        expect(m.nameColor).toBe(63488);
        expect(m.artist).toBe('Hands on the Wheel | Hartmann');
        expect(m.artistColor).toBe(65535);
        expect(m.volume).toBe(45);
        expect(m.playPauseIcon).toBe('');
        expect(m.onOffColor).toBe(65535);
        expect(m.shuffleIcon).toBe('');
        expect(m.logo).toEqual({
            type: 'number',
            id: 'logo',
            icon: 'logo-spotify',
            iconColor: 2016,
            displayName: 'Seek',
            optionalValue: '',
        });
        expect(m.options).toHaveLength(MEDIA_OPTIONS);
        expect(m.options[0].type).toBe('input_sel');
        expect(m.options[0].id).toBe('0');
        expect(m.options[3].icon).toBe('');
        expect(m.options[4]).toEqual({
            type: 'button',
            id: '4',
            icon: '',
            iconColor: 2016,
            displayName: 'Repeat',
            optionalValue: '1',
        });
    });

    it('parses the readme example (no bottom row, short payload)', () => {
        const m = parseEntityUpd(args(README), initial(), ctx);
        expect(m.title).toBe('Kitchen');
        expect(m.navigation.right.type).toBe('delete');
        expect(m.id).toBe('media_player.kitchen');
        expect(m.name).toBe("I'm a Hurricane");
        expect(m.nameColor).toBe(65535);
        expect(m.artist).toBe('Wellmess');
        expect(m.volume).toBe(100);
        expect(m.playPauseIcon).toBe('A');
        expect(m.onOffColor).toBe(64704);
        expect(m.shuffleIcon).toBe('B');
        expect(m.logo.type).toBe('media_pl');
        expect(m.logo.displayName).toBe('Kitchen');
        expect(m.options).toHaveLength(MEDIA_OPTIONS);
        expect(m.options.every(o => o.type === '')).toBe(true);
    });

    it('hides the power button for "disable" and the volume when empty', () => {
        expect(parseOnOff('disable')).toBeUndefined();
        expect(parseOnOff('')).toBeUndefined();
        expect(parseOnOff('1374')).toBe(1374);
        const m = parseEntityUpd(args('entityUpd~T~~~~~~~~~~~~~media~~65535~~65535~~~disable~~~~~~~'), initial(), ctx);
        expect(m.volume).toBeUndefined();
        expect(m.onOffColor).toBeUndefined();
        expect(m.playPauseIcon).toBe('');
        expect(m.shuffleIcon).toBe('');
    });

    it('clamps the volume', () => {
        const m = parseEntityUpd(args('entityUpd~T~~~~~~~~~~~~~media~~~~~130~~~~'), initial(), ctx);
        expect(m.volume).toBe(100);
    });

    it('leaves popups and counts other commands', () => {
        const m = parseEntityUpd(args(SPOTIFY), initial(), ctx);
        expect(parseEntityUpdateDetail(['x'], m, ctx)).toBeUndefined();
        expect(handleCommand('statusUpdate', [], m, ctx)?.otherCommands).toBe(1);
    });
});

describe('cardMedia entity press', () => {
    it('requests popups for popup types', () => {
        const m = parseEntityUpd(args(SPOTIFY), initial(), ctx);
        expect(entityPressEvent(m.options[0])).toEqual({ popup: 'popupInSel', id: '0' });
        expect(entityPressEvent(m.options[3])).toEqual({ popup: 'popupSlider', id: '3' });
        expect(entityPressEvent(m.logo)).toEqual({ popup: 'popupSlider', id: 'logo' });
    });

    it('presses buttons, toggles switches, ignores empty slots', () => {
        const m = parseEntityUpd(args(SPOTIFY), initial(), ctx);
        expect(entityPressEvent(m.options[4])).toEqual({ id: '4', action: 'button' });
        expect(
            entityPressEvent({ type: 'switch', id: '2', icon: '', iconColor: 0, displayName: '', optionalValue: '1' }),
        ).toEqual({ id: '2', action: 'OnOff', value: 0 });
        expect(
            entityPressEvent({ type: 'switch', id: '2', icon: '', iconColor: 0, displayName: '', optionalValue: '0' }),
        ).toEqual({ id: '2', action: 'OnOff', value: 1 });
        expect(entityPressEvent(parseEntityUpd(args(README), initial(), ctx).options[0])).toBeUndefined();
    });
});
