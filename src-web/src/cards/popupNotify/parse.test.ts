import { describe, expect, it } from 'vitest';
import { cssFontSize, fontSize, handleCommand, initial, lineHeight, maxLines, parseEntityUpdateDetail } from './parse';

const ctx = { pageType: 'popupNotify', pageArgs: [] };

/** `PagePopup.getMessage`: information with three buttons, font 0, no icon */
const PAYLOAD =
    'popupNotify~TFT-Firmware Update~65504~Nein~63488~Später~65504~Ja~2016~30.05.2022 14:35:39\r\n\r\nEs ist eine neue Version verfügbar~65535~0~0~~65535';

describe('popupNotify', () => {
    it('parses the entityUpdateDetail of the adapter', () => {
        const m = parseEntityUpdateDetail(PAYLOAD.split('~'), initial(), ctx);
        expect(m.entityName).toBe('popupNotify');
        expect(m.heading).toBe('TFT-Firmware Update');
        expect(m.headingColor).toBe(65504);
        expect(m.buttons.map(b => b.text)).toEqual(['Nein', 'Später', 'Ja']);
        expect(m.buttons.map(b => b.color)).toEqual([63488, 65504, 2016]);
        expect(m.text).toBe('30.05.2022 14:35:39\n\nEs ist eine neue Version verfügbar');
        expect(m.textColor).toBe(65535);
        expect(m.timeout).toBe(0);
        expect(m.font).toBe(0);
        expect(m.icon).toBe('');
        expect(m.updates).toBe(1);
    });

    it('parses icon, icon colour, font and timeout', () => {
        const args = [
            'popupNotify',
            'Temperatur',
            '65535',
            '',
            '',
            '',
            '',
            'OK',
            '2016',
            '20.5 °C',
            '65535',
            '30',
            '4',
            '',
            '2016',
        ];
        const m = parseEntityUpdateDetail(args, initial(), ctx);
        expect(m.icon).toBe('');
        expect(m.iconColor).toBe(2016);
        expect(m.font).toBe(4);
        expect(fontSize(m.font)).toBe(80);
        expect(m.timeout).toBe(30);
        expect(m.buttons[0].text).toBe('');
        expect(m.buttons[2].text).toBe('OK');
    });

    it('accepts the literal \\r\\n of example files as line break', () => {
        const m = parseEntityUpdateDetail(
            ['popupNotify', 'H', '65535', '', '', '', '', '', '', 'a\\r\\nb'],
            initial(),
            ctx,
        );
        expect(m.text).toBe('a\nb');
    });

    it('handles timeout2 and exitPopup, ignores the rest', () => {
        const m = handleCommand('timeout2', ['15'], initial(), ctx);
        expect(m?.timeout).toBe(15);
        const e = handleCommand('exitPopup', [], initial(), ctx);
        expect(e?.exitRequests).toBe(1);
        expect(handleCommand('weatherUpdate', ['x'], initial(), ctx)).toBeUndefined();
    });

    it('maps the font ids of the HMI', () => {
        expect([0, 1, 2, 3, 4, 5, 9].map(fontSize)).toEqual([24, 32, 32, 48, 80, 128, 24]);
        expect([0, 3, 5].map(lineHeight)).toEqual([24, 48, 128]);
        expect([0, 1, 3, 4, 5].map(cssFontSize)).toEqual([18, 24, 36, 60, 96]);
        expect([0, 1, 2, 3, 4, 5, 9].map(maxLines)).toEqual([7, 5, 5, 4, 2, 1, 7]);
    });
});
