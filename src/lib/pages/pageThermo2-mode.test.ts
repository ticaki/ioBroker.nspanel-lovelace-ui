/**
 * cardThermo2: the mode text comes from the current common.states of the mode datapoint (Dataitem option
 * commonStates) instead of a list generated into a read script when the panel is built.
 */
import { expect } from 'chai';
import { PageThermo2 } from './pageThermo2';
import { DEFAULT_CLIMATE_MODES } from '../const/common-states';
import type { ConfigManager } from '../classes/config-manager';
import type * as pages from '../types/pages';
import type { NSPanel } from '../types/NSPanel';

/**
 * Loose guard: the fake has what getPage uses of the config manager.
 *
 * @param v candidate
 * @returns true if it can stand in for the config manager
 */
function isConfigManager(v: unknown): v is ConfigManager {
    return typeof v === 'object' && v !== null && 'adapter' in v && 'searchDatapointsForItems' in v;
}

/**
 * Loose guard for the script page.
 *
 * @param v candidate
 * @returns true for a cardThermo2 page with thermo items
 */
function isThermo2Page(v: unknown): v is ScriptConfig.PageThermo2 {
    return typeof v === 'object' && v !== null && 'type' in v && v.type === 'cardThermo2' && 'thermoItems' in v;
}

/**
 * Loose guard for the grid item.
 *
 * @param v candidate
 * @returns true if it has a config
 */
function isPageBase(v: unknown): v is pages.PageBase {
    return typeof v === 'object' && v !== null && 'config' in v;
}

/**
 * Config manager for `PageThermo2.getPage` with a small object database.
 *
 * @param objects common by id
 * @returns An object usable as ConfigManager for getPage().
 */
function fakeConfigManager(objects: Record<string, Partial<ioBroker.StateCommon>>): ConfigManager {
    const noop = (): void => undefined;
    const fake = {
        adapter: {
            language: 'de',
            config: { defaultValueCardThermo: false },
            log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
            getForeignObjectAsync: async (
                id: string,
            ): Promise<{ _id: string; type: 'state'; common: Partial<ioBroker.StateCommon>; native: object } | null> =>
                objects[id] ? { _id: id, type: 'state', common: objects[id], native: {} } : null,
        },
        existsState: async (): Promise<boolean> => true,
        existsAndWriteableState: async (): Promise<boolean> => true,
        getIconColor: async (): Promise<NSPanel.DataItemsOptions> => ({
            type: 'const',
            constVal: { r: 0, g: 255, b: 0 },
        }),
        searchDatapointsForItems: async (): Promise<Record<string, Record<string, NSPanel.DataItemsOptions>>> => ({
            thermostat: {
                SET: { type: 'state', dp: 'alias.0.T.SET' },
                ACTUAL: { type: 'state', dp: 'alias.0.T.ACTUAL' },
                MODE: { type: 'triggered', dp: 'alias.0.T.MODE', read: 'return val' },
            },
        }),
    };
    if (!isConfigManager(fake)) {
        throw new Error('fake config manager incomplete');
    }
    return fake;
}

/**
 * Builds the page and returns the mode data item of its first circuit.
 *
 * @param objects common by id
 * @param item thermo item
 * @returns options of data.mode
 */
async function modeOf(
    objects: Record<string, Partial<ioBroker.StateCommon>>,
    item: Record<string, unknown>,
): Promise<unknown> {
    const gridItem = { config: { card: 'cardThermo2' } };
    const page = { type: 'cardThermo2', uniqueName: 'heizung', items: [], thermoItems: [item] };
    if (!isPageBase(gridItem) || !isThermo2Page(page)) {
        throw new Error('test page incomplete');
    }
    const { gridItem: result } = await PageThermo2.getPage(fakeConfigManager(objects), page, gridItem, []);
    const config: unknown = result.config;
    if (typeof config !== 'object' || config === null || !('data' in config) || !Array.isArray(config.data)) {
        throw new Error('no circuits');
    }
    const circuit: unknown = config.data[0];
    if (typeof circuit !== 'object' || circuit === null || !('mode' in circuit)) {
        throw new Error('circuit without mode');
    }
    return circuit.mode;
}

const CHANNEL: Partial<ioBroker.StateCommon> = { role: 'thermostat', name: 'Wohnzimmer', type: 'number' };

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
        expect(mode).to.deep.equal({
            type: 'triggered',
            dp: 'alias.0.T.MODE',
            read: 'return ["Aus","An"][val] || val',
        });
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
