import { expect } from 'chai';
import { dynamicNamePanelText, hasDynamicName, visibleValueConfig } from './channelValueConfig';

describe('src-admin - visibleValueConfig', () => {
    const config = {
        valueStateId: '0_userdata.0.name',
        unit: '°C',
        prefix: 'pre ',
        suffix: ' post',
        dateFormat: { local: 'de-DE', format: { dateStyle: 'short' as const } },
    };

    it('keeps every field when all sections are shown', () => {
        expect(visibleValueConfig(config, {})).to.deep.equal(config);
        expect(visibleValueConfig(config, { showUnit: true, showDateFormat: true })).to.deep.equal(config);
    });

    it('clears unit and date format of the dynamic name (sections hidden)', () => {
        expect(visibleValueConfig(config, { showUnit: false, showDateFormat: false })).to.deep.equal({
            valueStateId: '0_userdata.0.name',
            unit: '',
            prefix: 'pre ',
            suffix: ' post',
            dateFormat: '',
        });
    });

    it('handles a missing config', () => {
        expect(visibleValueConfig(undefined, { showUnit: false })).to.deep.equal({ unit: '' });
    });
});

describe('src-admin - dynamic name panel text', () => {
    it('hasDynamicName: value state id, prefix or suffix set', () => {
        expect(hasDynamicName(undefined)).to.equal(false);
        expect(hasDynamicName({ valueStateId: '', prefix: '', suffix: '' })).to.equal(false);
        expect(hasDynamicName({ valueStateId: 'a.b.c', prefix: '', suffix: '' })).to.equal(true);
        expect(hasDynamicName({ valueStateId: '', prefix: 'a.b.c', suffix: '' })).to.equal(true);
        expect(hasDynamicName({ valueStateId: '', prefix: '', suffix: ' Uhr' })).to.equal(true);
    });

    it('empty Name field: prefix + value + suffix, without a space of its own', () => {
        expect(dynamicNamePanelText('', { prefix: '0', value: ' ', suffix: '0' })).to.equal('0 0');
        expect(dynamicNamePanelText('', { prefix: '', value: '24.11.2026 17:42', suffix: 'Uhr' })).to.equal(
            '24.11.2026 17:42Uhr',
        );
    });

    it('typed name: prefix + name + suffix', () => {
        expect(dynamicNamePanelText('Küche', { prefix: 'pre ', value: 'x', suffix: ' Uhr' })).to.equal(
            'pre Küche Uhr',
        );
    });
});
