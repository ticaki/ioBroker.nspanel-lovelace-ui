/**
 * cardThermo2: the mode text comes from the current common.states of the mode datapoint (Dataitem option
 * commonStates) instead of a list generated into a read script when the panel is built.
 */
import { expect } from 'chai';
import { PageThermo2 } from './pageThermo2';
import { DEFAULT_CLIMATE_MODES } from '../const/common-states';

/**
 * Config manager for `PageThermo2.getPage` with a small object database.
 *
 * @param objects common by id
 * @returns An object usable as ConfigManager for getPage().
 */
function fakeConfigManager(objects: Record<string, Partial<ioBroker.StateCommon>>): any {
    const noop = (): void => undefined;
    return {
        adapter: {
            language: 'de',
            config: { defaultValueCardThermo: false },
            log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
            getForeignObjectAsync: async (id: string): Promise<any> =>
                objects[id] ? { _id: id, type: 'state', common: objects[id], native: {} } : null,
        },
        existsState: async (): Promise<boolean> => true,
        existsAndWriteableState: async (): Promise<boolean> => true,
        getIconColor: async (): Promise<any> => ({ type: 'const', constVal: { r: 0, g: 255, b: 0 } }),
        searchDatapointsForItems: async (): Promise<any> => ({
            thermostat: {
                SET: { type: 'state', dp: 'alias.0.T.SET' },
                ACTUAL: { type: 'state', dp: 'alias.0.T.ACTUAL' },
                MODE: { type: 'triggered', dp: 'alias.0.T.MODE', read: 'return val' },
            },
        }),
    };
}

/**
 * Builds the page and returns the mode data item of its first circuit.
 *
 * @param objects common by id
 * @param item thermo item
 * @returns options of data.mode
 */
async function modeOf(objects: Record<string, Partial<ioBroker.StateCommon>>, item: any): Promise<any> {
    const gridItem: any = { config: { card: 'cardThermo2' } };
    const page = { type: 'cardThermo2', uniqueName: 'heizung', items: [], thermoItems: [item] };
    const { gridItem: result } = await PageThermo2.getPage(fakeConfigManager(objects), page as any, gridItem, []);
    return (result.config as any).data[0].mode;
}

const CHANNEL = { role: 'thermostat', name: 'Wohnzimmer', type: 'number' } as Partial<ioBroker.StateCommon>;

describe('lib/pages - cardThermo2 mode text', () => {
    it('channel: MODE with states resolves its text at runtime, keeping an unknown value', async () => {
        const mode = await modeOf(
            { 'alias.0.T': CHANNEL, 'alias.0.T.MODE': { type: 'number', states: { 0: 'Aus', 1: 'Auto' } } },
            { id: 'alias.0.T' },
        );
        expect(mode).to.deep.equal({
            type: 'triggered',
            dp: 'alias.0.T.MODE',
            commonStates: { mode: 'text', keepValue: true },
        });
    });

    it('channel: MODE without states keeps the generated list', async () => {
        const mode = await modeOf(
            { 'alias.0.T': CHANNEL, 'alias.0.T.MODE': { type: 'number' } },
            { id: 'alias.0.T', modeList: ['Aus', 'An'] },
        );
        expect(mode.read).to.equal('return ["Aus","An"][val] || val');
        expect(mode.commonStates).to.equal(undefined);
    });

    it('modeId without modeList: current states, the built-in list without states', async () => {
        const mode = await modeOf(
            { 'alias.0.T.ACT': { type: 'number' }, 'alias.0.T.MODE': { type: 'number', states: { 0: 'Aus' } } },
            { thermoId1: 'alias.0.T.ACT', modeId: 'alias.0.T.MODE', set: 'alias.0.T.SET' },
        );
        expect(mode).to.deep.equal({
            type: 'triggered',
            dp: 'alias.0.T.MODE',
            commonStates: { mode: 'text', defaultStates: [...DEFAULT_CLIMATE_MODES] },
        });
    });

    it('modeId with modeList: the list of the user stays a constant', async () => {
        const mode = await modeOf(
            { 'alias.0.T.ACT': { type: 'number' }, 'alias.0.T.MODE': { type: 'number', states: { 0: 'Aus' } } },
            { thermoId1: 'alias.0.T.ACT', modeId: 'alias.0.T.MODE', set: 'alias.0.T.SET', modeList: ['A', 'B'] },
        );
        expect(mode).to.deep.equal({ type: 'triggered', dp: 'alias.0.T.MODE', read: 'return ["A","B"][val]' });
    });
});
