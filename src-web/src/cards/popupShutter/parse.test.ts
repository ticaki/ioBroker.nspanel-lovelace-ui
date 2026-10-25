import { describe, expect, it } from 'vitest';
import { DEFAULT_ICONS, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

const UP = '\u{F005D}';
const STOP = '\u{F04DB}';
const DOWN = '\u{F0045}';
const TILT_UP = '\u{F005C}';
const TILT_DOWN = '\u{F0043}';
const SHUTTER = '\u{F111C}';

function args(payload: string): string[] {
    return payload.split('~').slice(1);
}

describe('popupShutter', () => {
    const ctx = { pageType: 'popupShutter', pageArgs: ['shutter.terrace', 'Terrasse'] };

    it('parses position, buttons and tilt', () => {
        // getDetailPayload('popupShutter'), a shutter with position and tilt (entity2), half open
        const payload =
            `entityUpdateDetail~shutter.terrace~65~Rollo offen~Position~${SHUTTER}~${UP}~${STOP}~${DOWN}~enable~enable~enable` +
            `~Lamellen~${TILT_UP}~${STOP}~${TILT_DOWN}~enable~enable~disable~100`;
        const m = parseEntityUpdateDetail(args(payload), initial(), ctx);
        expect(m.received).toBe(true);
        expect(m.entityName).toBe('shutter.terrace');
        expect(m.position).toBe(65);
        expect(m.text).toBe('Rollo offen');
        expect(m.positionLabel).toBe('Position');
        expect(m.icon).toBe(SHUTTER);
        expect(m.buttons).toEqual({ icons: [UP, STOP, DOWN], enabled: [true, true, true] });
        expect(m.tiltLabel).toBe('Lamellen');
        expect(m.tiltButtons).toEqual({ icons: [TILT_UP, STOP, TILT_DOWN], enabled: [true, true, false] });
        expect(m.tilt).toBe(100);
    });

    it('parses the readme example and the defaults (no tilt, no buttons)', () => {
        // HMI/Readme.md: entityUpdateDetail~1~77 - everything else is missing
        const m = parseEntityUpdateDetail(args('entityUpdateDetail~1~77'), initial(), ctx);
        expect(m.position).toBe(77);
        expect(m.buttons.enabled).toEqual([false, false, false]);
        expect(m.tilt).toBeUndefined();
        expect(m.tiltButtons.enabled).toEqual([false, false, false]);
    });

    it('fully open: the up button is disabled and a boolean entity has no slider', () => {
        const payload = `entityUpdateDetail~s~disable~Offen~~${SHUTTER}~${UP}~${STOP}~${DOWN}~disable~enable~enable~~~~~disable~disable~disable~disable`;
        const m = parseEntityUpdateDetail(args(payload), initial(), ctx);
        expect(m.position).toBeUndefined();
        expect(m.buttons.enabled).toEqual([false, true, true]);
    });

    it('ignores entityUpd', () => {
        const m = initial();
        expect(parseEntityUpd(['x'], m, ctx)).toBe(m);
    });

    it('uses the icons of the HMI when the adapter sends none (emu recording)', () => {
        const payload = 'entityUpdateDetail~4?2~52~~~~~~~enable~enable~enable~~~~~enable~enable~enable~49';
        const m = parseEntityUpdateDetail(args(payload), initial(), ctx);
        expect(m.buttons.icons).toEqual([...DEFAULT_ICONS.position]);
        expect(m.buttons.enabled).toEqual([true, true, true]);
        expect(m.tiltButtons.icons).toEqual([...DEFAULT_ICONS.tilt]);
        expect(m.tilt).toBe(49);
        expect(m.positionLabel).toBe('');
    });
});

describe('popupShutter2', () => {
    const ctx = { pageType: 'popupShutter2', pageArgs: ['shutter2.living', 'Wohnzimmer'] };

    it('parses position, up/stop/down and the three extra buttons', () => {
        // getDetailPayload('popupShutter2'): entity2-4 present, shutterClosedIsZero = 1
        const payload =
            `entityUpdateDetail~shutter2.living~40~Rollo~Position~${SHUTTER}~${UP}~${STOP}~${DOWN}~enable~enable~disable` +
            `~\u{F05B0}~63488~enable~\u{F033E}~2016~enable~\u{F0599}~65504~disable~shutter~1`;
        const m = parseEntityUpdateDetail(args(payload), initial(), ctx);
        expect(m.position).toBe(40);
        expect(m.buttons).toEqual({ icons: [UP, STOP, DOWN], enabled: [true, true, false] });
        expect(m.extra[0]).toEqual({ icon: '\u{F05B0}', color: 63488, enabled: true });
        expect(m.extra[1]).toEqual({ icon: '\u{F033E}', color: 2016, enabled: true });
        expect(m.extra[2]).toEqual({ icon: '\u{F0599}', color: 65504, enabled: false });
        expect(m.shutterType).toBe('shutter');
        expect(m.closedIsZero).toBe(true);
        expect(m.tilt).toBeUndefined();
    });

    it('shows the default icons of the HMI for disabled extra buttons (emu recording)', () => {
        const payload = 'entityUpdateDetail~4?3~60~~~~~~~enable~enable~enable~~~disable~~~disable~~~disable~shutter~1';
        const m = parseEntityUpdateDetail(args(payload), initial(), ctx);
        expect(m.extra.map(b => b.icon)).toEqual([...DEFAULT_ICONS.extra]);
        expect(m.extra.map(b => b.enabled)).toEqual([false, false, false]);
        expect(m.closedIsZero).toBe(true);
    });

    it('treats missing extra buttons as disabled', () => {
        const payload = `entityUpdateDetail~s~disable~~~${SHUTTER}~${UP}~${STOP}~${DOWN}~enable~enable~enable~~~disable~~~disable~~~disable~shutter~0`;
        const m = parseEntityUpdateDetail(args(payload), initial(), ctx);
        expect(m.position).toBeUndefined();
        expect(m.extra.map(e => e.enabled)).toEqual([false, false, false]);
        expect(m.closedIsZero).toBe(false);
    });
});
