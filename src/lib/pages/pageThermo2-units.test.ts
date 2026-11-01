import { expect } from 'chai';
import { PageThermo2 } from './pageThermo2';

/**
 * Minimal config manager for `PageThermo2.getPage`: the builder only needs the log, the two state
 * checks, an icon color and the datapoints of the channel.
 *
 * @returns An object usable as ConfigManager for getPage().
 */
function fakeConfigManager(): any {
    const noop = (): void => undefined;
    return {
        adapter: {
            language: 'de',
            config: { defaultValueCardThermo: false },
            log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
            getForeignObjectAsync: async (id: string): Promise<any> => ({
                _id: id,
                common: { role: 'thermostat', name: 'Wohnzimmer', type: 'number' },
                native: {},
            }),
        },
        existsState: async (): Promise<boolean> => true,
        existsAndWriteableState: async (): Promise<boolean> => true,
        getIconColor: async (): Promise<any> => ({ type: 'const', constVal: { r: 0, g: 255, b: 0 } }),
        searchDatapointsForItems: async (): Promise<any> => ({
            thermostat: {
                SET: { type: 'state', dp: 'alias.0.Thermostat.SET' },
                ACTUAL: { type: 'state', dp: 'alias.0.Thermostat.ACTUAL' },
                HUMIDITY: { type: 'state', dp: 'alias.0.Thermostat.HUMIDITY' },
            },
        }),
    };
}

/**
 * A cardThermo2 page with one circuit taken from an alias channel.
 *
 * @param unit Unit of line 1 (actual temperature), empty = adapter default.
 * @param unit2 Unit of line 3 (humidity), empty = adapter default.
 * @returns The script page.
 */
function thermoPage(unit?: string, unit2?: string): any {
    return {
        type: 'cardThermo2',
        uniqueName: 'heizung',
        items: [],
        thermoItems: [{ id: 'alias.0.Thermostat', name: 'Wohnzimmer', unit, unit2 }],
    };
}

/**
 * Builds the page and returns the data of its first circuit.
 *
 * @param unit Unit of line 1.
 * @param unit2 Unit of line 3.
 * @returns The data object the panel is built from.
 */
async function circuitData(unit?: string, unit2?: string): Promise<any> {
    const gridItem: any = { config: { card: 'cardThermo2' } };
    const { gridItem: result } = await PageThermo2.getPage(fakeConfigManager(), thermoPage(unit, unit2), gridItem, []);
    return (result.config as any).data[0];
}

describe('lib/pages - cardThermo2 units', () => {
    it('uses the unit of line 1 for the actual temperature and for the set temperature', async () => {
        const data = await circuitData('°F', 'rH');
        expect(data.entity1.unit.constVal).to.equal('°F');
        expect(data.entity3.unit.constVal).to.equal('°F');
    });

    it('uses the unit of line 3 for the humidity', async () => {
        const data = await circuitData('°F', 'rH');
        expect(data.entity2.unit.constVal).to.equal('rH');
    });

    it('falls back to the adapter defaults without units', async () => {
        const data = await circuitData();
        expect(data.entity1.unit.constVal).to.equal('°C');
        expect(data.entity2.unit.constVal).to.equal('%');
        expect(data.entity3.unit.constVal).to.equal('°C');
    });
});
