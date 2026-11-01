import { expect } from 'chai';
import { visibleValueConfig } from './channelValueConfig';

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
