import { expect } from 'chai';
import { emptyThermo2Entry, type Thermo2Entry } from '../types/adminShareConfig';
import { buildThermo2ScriptPage } from './admin';

describe('lib/configuration - buildThermo2ScriptPage', () => {
    it('builds the alias form from the channel of a circuit', () => {
        const entry: Thermo2Entry = {
            ...emptyThermo2Entry('heizung'),
            thermoItems: [
                { channelId: 'alias.0.Wohnzimmer.Thermostat', name: 'Wohnzimmer', minValue: 10, maxValue: 25 },
                { source: 'alias', channelId: 'alias.0.Bad.Thermostat', stepValue: 1 },
            ],
        };
        const page = buildThermo2ScriptPage(entry);

        expect(page.type).to.equal('cardThermo2');
        expect(page.uniqueName).to.equal('heizung');
        expect(page.items).to.deep.equal([]);
        expect(page.sortOrder).to.equal('V');
        expect(page.thermoItems).to.have.length(2);
        expect(page.thermoItems[0]).to.include({
            id: 'alias.0.Wohnzimmer.Thermostat',
            name: 'Wohnzimmer',
            minValue: 10,
            maxValue: 25,
            unit: '',
        });
        expect(page.thermoItems[0].stepValue).to.equal(undefined);
        expect(page.thermoItems[0].icon).to.equal(undefined);
        expect(page.thermoItems[0].modeList).to.equal(undefined);
        expect(page.thermoItems[1]).to.include({ id: 'alias.0.Bad.Thermostat', stepValue: 1 });
        expect(page.thermoItems[1].name).to.equal(undefined);
    });

    it('builds the data point form and skips a circuit without set or actual state', () => {
        const entry: Thermo2Entry = {
            ...emptyThermo2Entry('heizung'),
            thermoItems: [
                {
                    source: 'states',
                    channelId: '',
                    setState: '0_userdata.0.T.SET ',
                    actualState: '0_userdata.0.T.ACTUAL',
                    humidityState: '',
                    modeState: '0_userdata.0.T.MODE',
                    name: 'Küche',
                },
                { source: 'states', channelId: '', setState: '0_userdata.0.T.SET', actualState: '' },
            ],
        };
        const page = buildThermo2ScriptPage(entry);

        expect(page.thermoItems).to.have.length(1);
        const circuit = page.thermoItems[0] as { set: string; thermoId1: string; thermoId2?: string; modeId?: string };
        expect(circuit.set).to.equal('0_userdata.0.T.SET');
        expect(circuit.thermoId1).to.equal('0_userdata.0.T.ACTUAL');
        expect(circuit.thermoId2).to.equal(undefined);
        expect(circuit.modeId).to.equal('0_userdata.0.T.MODE');
        expect('id' in circuit).to.equal(false);
    });

    it('converts colors, icons, units and the mode list', () => {
        const entry: Thermo2Entry = {
            ...emptyThermo2Entry('heizung'),
            sortOrder: 'HM',
            thermoItems: [
                {
                    channelId: 'alias.0.Bad.Klima',
                    name2: 'Kühlen',
                    icon: 'thermometer-lines',
                    onColor: '#ff0000',
                    unit: ' °F ',
                    icon2: '',
                    onColor2: 'keine Farbe',
                    unit2: '',
                    iconHeatCycle: 'radiator',
                    iconHeatCycleOnColor: '#00ff00',
                    iconHeatCycleOffColor2: '#000080',
                    modeList: [' Aus ', '', 'Heizen'],
                },
            ],
        };
        const page = buildThermo2ScriptPage(entry);
        const circuit = page.thermoItems[0];

        expect(page.sortOrder).to.equal('HM');
        expect(circuit).to.include({ id: 'alias.0.Bad.Klima', name2: 'Kühlen', icon: 'thermometer-lines', unit: '°F' });
        expect(circuit.onColor).to.deep.equal({ red: 255, green: 0, blue: 0 });
        expect(circuit.onColor2).to.equal(undefined);
        expect(circuit.icon2).to.equal(undefined);
        expect(circuit.unit2).to.equal(undefined);
        expect(circuit.iconHeatCycle).to.equal('radiator');
        expect(circuit.iconHeatCycleOnColor).to.deep.equal({ red: 0, green: 255, blue: 0 });
        expect(circuit.iconHeatCycleOffColor2).to.deep.equal({ red: 0, green: 0, blue: 128 });
        expect(circuit.modeList).to.deep.equal(['Aus', 'Heizen']);
    });

    it('skips circuits without channel, trims the fields and ignores an unknown sort order', () => {
        const entry: Thermo2Entry = {
            ...emptyThermo2Entry('heizung'),
            sortOrder: 'X' as never,
            thermoItems: [
                { channelId: '', name: 'leer' },
                { channelId: '  alias.0.Küche.Thermostat ', name: '  Küche ' },
                { channelId: '   ', name: 'nur Leerzeichen' },
            ],
        };
        const page = buildThermo2ScriptPage(entry);

        expect(page.sortOrder).to.equal(undefined);
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
