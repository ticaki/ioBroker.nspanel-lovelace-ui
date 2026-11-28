import { expect } from 'chai';
import { adminPageItemToScriptItem } from './admin-page-item';
import type { AdminPageItemConfig } from '../types/adminShareConfig';

describe('lib/configuration/admin-page-item - dynamic name', () => {
    const convert = (
        name: string | undefined,
        valueEntry?: { valueStateId: string; prefix: string; suffix: string },
    ): Record<string, unknown> =>
        adminPageItemToScriptItem({
            channelId: { valueStateId: 'alias.0.lamp' },
            name,
            valueEntry: valueEntry ? { ...valueEntry, unit: '', dateFormat: '' } : undefined,
        } as unknown as AdminPageItemConfig) as unknown as Record<string, unknown>;

    it('empty name: the value state id is the name, prefix and suffix are set', () => {
        const item = convert('', { valueStateId: 'alias.0.date', prefix: 'pre ', suffix: ' Uhr' });
        expect(item.name).to.equal('alias.0.date');
        expect(item.prefixName).to.equal('pre ');
        expect(item.suffixName).to.equal(' Uhr');
    });

    it('typed name: the name stays, prefix and suffix are still set', () => {
        const item = convert('Küche', { valueStateId: 'alias.0.date', prefix: 'alias.0.a', suffix: 'alias.0.b' });
        expect(item.name).to.equal('Küche');
        expect(item.prefixName).to.equal('alias.0.a');
        expect(item.suffixName).to.equal('alias.0.b');
    });

    it('without value state id: no name, prefix and suffix are set', () => {
        const item = convert(undefined, { valueStateId: '', prefix: 'alias.0.a', suffix: 'alias.0.b' });
        expect(item.name).to.equal(undefined);
        expect(item.prefixName).to.equal('alias.0.a');
        expect(item.suffixName).to.equal('alias.0.b');
    });

    it('a value of one space (free text) is kept, not trimmed', () => {
        const item = convert(undefined, { valueStateId: ' ', prefix: 'alias.0.a', suffix: 'alias.0.b' });
        expect(item.name).to.equal(' ');
        expect(item.prefixName).to.equal('alias.0.a');
        expect(item.suffixName).to.equal('alias.0.b');
    });

    it('without dynamic name: no prefix and suffix', () => {
        const item = convert('Küche');
        expect(item.name).to.equal('Küche');
        expect(item.prefixName).to.equal(undefined);
        expect(item.suffixName).to.equal(undefined);
    });
});
