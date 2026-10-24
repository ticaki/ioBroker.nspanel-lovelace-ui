import { describe, expect, it } from 'vitest';
import { handleCommand, initial, parseEntityUpd } from './parse';

describe('pageStartup', () => {
    it('ignores data but counts it', () => {
        const ctx = { pageType: 'pageStartup', pageArgs: [] };
        const m = handleCommand('time', ['1:00'], parseEntityUpd(['x'], initial(), ctx), ctx);
        expect(m.ignored).toBe(2);
    });
});
