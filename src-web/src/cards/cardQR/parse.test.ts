import { describe, expect, it } from 'vitest';
import { handleCommand, initial, isQREntityVisible, parseEntityUpd, parseEntityUpdateDetail } from './parse';
import { qrModules } from './qr';

const ctx = { pageType: 'cardQR', pageArgs: [] };

/** PageQR.getMessage, wifi with password shown as text (glyphs of wifi and key-wireless) */
const WIFI =
    'entityUpd~Wlan~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~WIFI:T:WPA;S:GastWlan;P:geheim123;H:;~text~0~~2047~SSID~GastWlan~text~1~~2016~Password~geheim123';

/** PageQR.getMessage, wifi with a switch as second entity */
const SWITCH =
    'entityUpd~Gast Wlan~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~WIFI:T:WPA;S:GastWlan;P:geheim123;H:;~text~0~~65504~SSID~GastWlan~switch~1~~2016~WlanOn~1';

/** the example of HMI/Readme.md */
const README =
    'entityUpd~Guest Wifi~button~navigate.prev~<~65535~~~button~navigate.next~>~65535~~~WIFI:S:test_ssid;T:WPA;P:test_pw;;~text~iText.test_ssid~~17299~Name~test_ssid~text~iText.test_pw~~17299~Password~test_pw';

function args(payload: string): string[] {
    return payload.split('~').slice(1);
}

describe('cardQR parse', () => {
    it('parses the adapter payload', () => {
        const m = parseEntityUpd(args(WIFI), initial(), ctx);
        expect(m.title).toBe('Wlan');
        expect(m.navigation.left.id).toBe('bSubPrev');
        expect(m.text).toBe('WIFI:T:WPA;S:GastWlan;P:geheim123;H:;');
        expect(m.entities).toHaveLength(2);
        expect(m.entities[0]).toEqual({
            type: 'text',
            id: '0',
            icon: '',
            iconColor: 2047,
            displayName: 'SSID',
            optionalValue: 'GastWlan',
        });
        expect(m.entities[1].displayName).toBe('Password');
        expect(m.entities[1].optionalValue).toBe('geheim123');
    });

    it('parses a switch entity', () => {
        const m = parseEntityUpd(args(SWITCH), initial(), ctx);
        expect(m.entities[1].type).toBe('switch');
        expect(m.entities[1].optionalValue).toBe('1');
        expect(isQREntityVisible(m.entities[1])).toBe(true);
    });

    it('parses the readme example', () => {
        const m = parseEntityUpd(args(README), initial(), ctx);
        expect(m.title).toBe('Guest Wifi');
        expect(m.text).toBe('WIFI:S:test_ssid;T:WPA;P:test_pw;;');
        expect(m.entities[0].id).toBe('iText.test_ssid');
        expect(m.entities[1].optionalValue).toBe('test_pw');
    });

    it('hides disabled entities and keeps the default of PageQR', () => {
        const m = parseEntityUpd(
            args('entityUpd~Page QR~button~bSubPrev~~~~~button~bSubNext~~~~~disabled~disabled~~~~~~disabled~~~~~'),
            initial(),
            ctx,
        );
        expect(m.text).toBe('disabled');
        expect(isQREntityVisible(m.entities[0])).toBe(false);
        expect(isQREntityVisible(m.entities[1])).toBe(false);
    });

    it('leaves popups and counts other commands', () => {
        const m = parseEntityUpd(args(WIFI), initial(), ctx);
        expect(parseEntityUpdateDetail(['x'], m, ctx)).toBeUndefined();
        expect(handleCommand('statusUpdate', [], m, ctx)?.otherCommands).toBe(1);
    });
});

describe('cardQR code', () => {
    it('encodes the text into a module matrix', () => {
        const qr = qrModules('WIFI:T:WPA;S:GastWlan;P:geheim123;H:;');
        expect(qr).toBeDefined();
        expect(qr?.size).toBeGreaterThanOrEqual(21);
        // finder pattern in the upper left corner: dark module at 0/0, light at 1/1
        expect(qr?.get(0, 0)).toBe(true);
        expect(qr?.get(1, 1)).toBe(false);
    });

    it('returns undefined for empty text and caches the result', () => {
        expect(qrModules('')).toBeUndefined();
        expect(qrModules('abc')).toBe(qrModules('abc'));
    });
});
