import { expect } from 'chai';
import { emptyThermo2Entry, type Thermo2Entry } from '../types/adminShareConfig';
import { buildThermo2ScriptPage } from './admin';

describe('lib/configuration - buildThermo2ScriptPage', () => {
    it('builds the script page from the alias channels of the entry', () => {
        const entry: Thermo2Entry = {
            ...emptyThermo2Entry('heizung'),
            thermoItems: [
                { channelId: 'alias.0.Wohnzimmer.Thermostat', name: 'Wohnzimmer', minValue: 10, maxValue: 25 },
                { channelId: 'alias.0.Bad.Thermostat', stepValue: 1 },
            ],
        };
        const page = buildThermo2ScriptPage(entry);

        expect(page.type).to.equal('cardThermo2');
        expect(page.uniqueName).to.equal('heizung');
        expect(page.items).to.deep.equal([]);
        expect(page.thermoItems).to.have.length(2);
        expect(page.thermoItems[0]).to.include({
            id: 'alias.0.Wohnzimmer.Thermostat',
            name: 'Wohnzimmer',
            minValue: 10,
            maxValue: 25,
        });
        expect(page.thermoItems[0].stepValue).to.equal(undefined);
        expect(page.thermoItems[1]).to.include({ id: 'alias.0.Bad.Thermostat', stepValue: 1 });
        expect(page.thermoItems[1].name).to.equal(undefined);
    });

    it('skips circuits without channel and trims the fields', () => {
        const entry: Thermo2Entry = {
            ...emptyThermo2Entry('heizung'),
            thermoItems: [
                { channelId: '', name: 'leer' },
                { channelId: '  alias.0.Küche.Thermostat ', name: '  Küche ' },
                { channelId: '   ', name: 'nur Leerzeichen' },
            ],
        };
        const page = buildThermo2ScriptPage(entry);

        expect(page.thermoItems).to.have.length(1);
        expect(page.thermoItems[0]).to.include({ id: 'alias.0.Küche.Thermostat', name: 'Küche' });
    });

    it('leaves empty or invalid limits to the adapter defaults', () => {
        const entry: Thermo2Entry = {
            ...emptyThermo2Entry('heizung'),
            thermoItems: [
                {
                    channelId: 'alias.0.Bad.Thermostat',
                    name: '',
                    minValue: 0,
                    maxValue: Number.NaN,
                    stepValue: '0.5' as unknown as number,
                },
            ],
        };
        const [circuit] = buildThermo2ScriptPage(entry).thermoItems;

        expect(circuit.name).to.equal(undefined);
        expect(circuit.minValue).to.equal(undefined);
        expect(circuit.maxValue).to.equal(undefined);
        expect(circuit.stepValue).to.equal(undefined);
    });

    it('returns no circuit for the empty entry of the editor', () => {
        const page = buildThermo2ScriptPage(emptyThermo2Entry('neu'));

        expect(page.thermoItems).to.deep.equal([]);
    });
});
