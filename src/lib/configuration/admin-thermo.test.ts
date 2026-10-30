import { expect } from 'chai';
import { emptyThermoEntry, type ThermoEntry } from '../types/adminShareConfig';
import { buildThermoScriptPage } from './admin';

describe('lib/configuration - buildThermoScriptPage', () => {
    it('builds the script page from the channel, unit and limits of the entry', () => {
        const entry: ThermoEntry = {
            ...emptyThermoEntry('wohnzimmer'),
            headline: 'Wohnzimmer',
            channelId: 'alias.0.Wohnzimmer.Thermostat',
            unit: '°C',
            minValue: 100,
            maxValue: 300,
            stepValue: 1,
        };
        const page = buildThermoScriptPage(entry);

        expect(page.type).to.equal('cardThermo');
        expect(page.uniqueName).to.equal('wohnzimmer');
        expect(page.heading).to.equal('Wohnzimmer');
        expect(page.items).to.have.length(1);
        expect(page.items[0]).to.deep.equal({
            id: 'alias.0.Wohnzimmer.Thermostat',
            unit: '°C',
            minValue: 100,
            maxValue: 300,
            stepValue: 1,
        });
    });

    it('passes the limits on unchanged - the adapter decides between tenths and degrees', () => {
        const entry: ThermoEntry = {
            ...emptyThermoEntry('bad'),
            channelId: 'alias.0.Bad.Thermostat',
            minValue: 15,
            maxValue: 28,
            stepValue: 0.5,
        };
        const [item] = buildThermoScriptPage(entry).items;

        expect(item).to.include({ minValue: 15, maxValue: 28, stepValue: 0.5 });
        expect(item.unit).to.equal(undefined);
    });

    it('takes the uniqueName as heading when the headline is empty and trims the texts', () => {
        const entry: ThermoEntry = {
            ...emptyThermoEntry('kueche'),
            headline: '',
            channelId: '  alias.0.Küche.Thermostat ',
            unit: ' °F ',
        };
        const page = buildThermoScriptPage(entry);

        expect(page.heading).to.equal('kueche');
        expect(page.items[0].id).to.equal('alias.0.Küche.Thermostat');
        expect(page.items[0].unit).to.equal('°F');
    });

    it('leaves empty or invalid limits and an empty unit to the adapter defaults', () => {
        const entry: ThermoEntry = {
            ...emptyThermoEntry('flur'),
            channelId: 'alias.0.Flur.Thermostat',
            unit: '   ',
            minValue: Number.NaN,
            maxValue: '300' as unknown as number,
            stepValue: undefined,
        };
        const [item] = buildThermoScriptPage(entry).items;

        expect(item.unit).to.equal(undefined);
        expect(item.minValue).to.equal(undefined);
        expect(item.maxValue).to.equal(undefined);
        expect(item.stepValue).to.equal(undefined);
    });

    it('keeps a limit of 0 - it is a legal minimum', () => {
        const entry: ThermoEntry = { ...emptyThermoEntry('keller'), channelId: 'alias.0.Keller', minValue: 0 };

        expect(buildThermoScriptPage(entry).items[0].minValue).to.equal(0);
    });

    it('returns an item without id for the empty entry of the editor', () => {
        const page = buildThermoScriptPage(emptyThermoEntry('neu'));

        expect(page.heading).to.equal('neu');
        expect(page.items[0].id).to.equal('');
    });
});
