import { describe, expect, it } from 'vitest';
import { handleCommand, initial, parseEntityUpdateDetail } from './parse';

const ctx = { pageType: 'popupNotify3', pageArgs: [] };

/** `popupNotify3Message` of the adapter: icon, text, two buttons, timeout 20 */
const PAYLOAD = 'entityUpdateDetail~pop~\uE5D8~64512~Unwetterwarnung~65535~3~\uEE1D~1024~\uE68D~2016~20';

describe('popupNotify3 parse', () => {
    it('parses the entityUpdateDetail of the adapter', () => {
        const m = parseEntityUpdateDetail(PAYLOAD.split('~').slice(1), initial(), ctx);
        expect(m.entityName).toBe('pop');
        expect(m.icon).toBe('\uE5D8');
        expect(m.iconColor).toBe(64512);
        expect(m.text).toBe('Unwetterwarnung');
        expect(m.textColor).toBe(65535);
        expect(m.font).toBe(3);
        expect(m.buttons).toEqual([
            { icon: '\uEE1D', color: 1024 },
            { icon: '\uE68D', color: 2016 },
        ]);
        expect(m.timeout).toBe(20);
        expect(m.updates).toBe(1);
    });

    it('empty font = 3, empty button icons, CR LF lines', () => {
        const m = parseEntityUpdateDetail(
            ['pop', '\uE739', '63488', 'WC\r\nbesetzt', '65535', '', '', '', '', '', '0'],
            initial(),
            ctx,
        );
        expect(m.font).toBe(3);
        expect(m.text).toBe('WC\nbesetzt');
        expect(m.buttons.map(b => b.icon)).toEqual(['', '']);
        expect(m.timeout).toBe(0);
        const f0 = parseEntityUpdateDetail(['pop', '\uE739', '0', 'a', '0', '0'], initial(), ctx);
        expect(f0.font).toBe(0);
    });

    it('timeout2 and exitPopup', () => {
        const m = initial();
        expect(handleCommand('timeout2', ['30'], m, ctx)?.timeout).toBe(30);
        expect(handleCommand('exitPopup', [], m, ctx)?.exitRequests).toBe(1);
        expect(handleCommand('other', [], m, ctx)).toBeUndefined();
    });
});
