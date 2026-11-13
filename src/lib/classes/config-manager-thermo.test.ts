/**
 * Unit tests for the mode row of the classic thermostat card (`cardThermo`) built by
 * `ConfigManager.getPageThermo()`.
 *
 * A channel with the role `airCondition` and a MODE datapoint gets one button per supported
 * mode. Which value the generated read/write script has to compare against depends on the
 * shape of `common.states` of the MODE datapoint:
 *
 * - array (`['OFF', 'AUTO', ...]`) - the position in the array is the state value
 * - record (`{ 0: 'OFF', 1: 'AUTO', ... }`) - the key is the state value, the token is the value
 * - missing - the built-in list of seven modes is used, the position is the state value
 *
 * The record shape is the normal case in ioBroker and used to build no mode row at all.
 * A key that is no number has to be quoted, otherwise `return val == off` would be generated.
 */
import { expect } from 'chai';
import { Color } from '../const/Color';
import { StatesControler } from '../controller/states-controller';
import type * as pages from '../types/pages';
import { ConfigManager } from './config-manager';

// ---------------------------------------------------------------------------------------------
// fake object database
// ---------------------------------------------------------------------------------------------

type ObjectDB = Record<string, ioBroker.Object>;

/** Channel ids of the test devices - no id is the prefix of another one. */
const CHANNELS = {
    /** common.states as a record with numeric keys, MODE is a number */
    recordNumeric: 'alias.0.thermoModes.recordNumeric',
    /** common.states as a record with tokens as keys, MODE is a string */
    recordString: 'alias.0.thermoModes.recordString',
    /** common.states as an array, MODE is a number */
    arrayStates: 'alias.0.thermoModes.arrayStates',
    /** no common.states at all, MODE is a number */
    withoutStates: 'alias.0.thermoModes.withoutStates',
    /** array states plus the indicator datapoints MAINTAIN and UNREACH */
    indicators: 'alias.0.thermoModes.indicators',
};

/**
 * Adds a state object to the fake object database.
 *
 * @param db Object database.
 * @param id State id.
 * @param common Common part of the state.
 */
function addState(db: ObjectDB, id: string, common: Partial<ioBroker.StateCommon>): void {
    db[id] = {
        _id: id,
        type: 'state',
        common: { name: id.split('.').pop() ?? id, read: true, write: false, type: 'mixed', role: 'state', ...common },
        native: {},
    };
}

/**
 * Adds an airCondition channel with the required SET datapoint and a MODE datapoint.
 *
 * @param db Object database.
 * @param id Channel id.
 * @param modeType Common type of the MODE datapoint.
 * @param states common.states of the MODE datapoint, undefined leaves it out.
 */
function addAirCondition(
    db: ObjectDB,
    id: string,
    modeType: ioBroker.CommonType,
    states: string[] | Record<string, string> | undefined,
): void {
    db[id] = { _id: id, type: 'channel', common: { name: id, role: 'airCondition' }, native: {} };
    addState(db, `${id}.SET`, { role: 'level.temperature', type: 'number', write: true, min: 5, max: 30 });
    addState(db, `${id}.ACTUAL`, { role: 'value.temperature', type: 'number', write: false, unit: '°C' });
    addState(db, `${id}.MODE`, {
        role: 'value.mode.airconditioner',
        type: modeType,
        write: false,
        states,
    });
}

/**
 * Builds the object database used by all tests.
 *
 * @returns The object database.
 */
function buildDatabase(): ObjectDB {
    const objects: ObjectDB = {};
    addAirCondition(objects, CHANNELS.recordNumeric, 'number', {
        0: 'OFF',
        1: 'AUTO',
        2: 'COOL',
        3: 'HEAT',
        4: 'ECO',
        5: 'FAN_ONLY',
        6: 'DRY',
    });
    addAirCondition(objects, CHANNELS.recordString, 'string', { off: 'OFF', cool: 'COOL' });
    addAirCondition(objects, CHANNELS.arrayStates, 'number', ['OFF', 'AUTO', 'COOL', 'HEAT', 'ECO', 'FAN_ONLY', 'DRY']);
    addAirCondition(objects, CHANNELS.withoutStates, 'number', undefined);
    addAirCondition(objects, CHANNELS.indicators, 'number', ['OFF', 'AUTO', 'COOL']);
    addState(objects, `${CHANNELS.indicators}.MAINTAIN`, { role: 'indicator.maintenance', type: 'boolean' });
    addState(objects, `${CHANNELS.indicators}.UNREACH`, { role: 'indicator.maintenance.unreach', type: 'boolean' });
    return objects;
}

const DB = buildDatabase();

// ---------------------------------------------------------------------------------------------
// fake adapter
// ---------------------------------------------------------------------------------------------

/**
 * Adapter stub with the fake object database - only the members ConfigManager uses.
 *
 * @returns An object usable as adapter for ConfigManager.
 */
function fakeAdapter(): any {
    const noop = (): void => undefined;
    return {
        namespace: 'nspanel-lovelace-ui.0',
        language: 'en',
        unload: false,
        library: { getLocalLanguage: (): string => 'en' },
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        config: { panels: [{ topic: 'panel/a', name: 'a' }], testCase: false },
        setInterval: (): number => 1,
        clearInterval: noop,
        setTimeout: (): number => 1,
        clearTimeout: noop,
        getForeignObjectAsync: async (id: string): Promise<ioBroker.Object | null> =>
            DB[id] ? structuredClone(DB[id]) : null,
        getForeignObjectsAsync: async (): Promise<ObjectDB> => structuredClone(DB),
        getEnumsAsync: async (): Promise<Record<string, Record<string, never>>> => ({
            'enum.rooms': {},
            'enum.functions': {},
        }),
        getForeignStateAsync: async (): Promise<null> => null,
        getForeignStatesAsync: async (): Promise<Record<string, never>> => ({}),
        getStateAsync: async (): Promise<null> => null,
        getObjectViewAsync: async (): Promise<{ rows: { id: string }[] }> => ({ rows: [] }),
        setForeignObjectAsync: async (): Promise<void> => undefined,
        setObjectNotExistsAsync: async (): Promise<void> => undefined,
        subscribeForeignStatesAsync: async (): Promise<void> => undefined,
        unsubscribeForeignStatesAsync: async (): Promise<void> => undefined,
    };
}

/**
 * Resets the static object cache of the states controller.
 */
function resetStatesController(): void {
    StatesControler.TempObjectDB = { data: undefined, keys: [], enums: undefined };
    StatesControler.tempObjectDBTimeout = undefined;
}

// ---------------------------------------------------------------------------------------------
// runner
// ---------------------------------------------------------------------------------------------

/** The part of a generated page item the mode row tests look at. */
type ModeButton = {
    role?: string;
    type?: string;
    data?: {
        icon?: {
            true?: { value?: { constVal?: unknown }; color?: { constVal?: unknown } };
            false?: { value?: { constVal?: unknown }; color?: { constVal?: unknown } };
        };
        entity1?: {
            value?: { dp?: string; read?: string };
            set?: { dp?: string; write?: string };
        };
    };
};

/**
 * Runs getPageThermo() for one of the test channels and returns the generated page items.
 *
 * @param channel Channel id of the thermostat.
 * @returns The page items of the card and the messages getPageThermo collected.
 */
async function runThermo(channel: string): Promise<{ items: ModeButton[]; messages: string[] }> {
    resetStatesController();
    const manager = new ConfigManager(fakeAdapter(), true);
    let gridItem = {
        uniqueID: 'thermoTest',
        hidden: false,
        alwaysOn: 'none',
        dpInit: '',
        config: { card: 'cardThermo', data: { headline: { type: 'const', constVal: 'Thermo' } } },
        pageItems: [],
    } as unknown as pages.PageBase;
    const page = {
        type: 'cardThermo',
        uniqueName: 'thermoTest',
        heading: 'Thermo',
        items: [{ id: channel }],
    } as unknown as ScriptConfig.PageThermo;
    let messages: string[] = [];
    ({ gridItem, messages } = await manager.getPageThermo(page, gridItem, messages));
    await manager.delete();
    resetStatesController();
    return { items: (gridItem.pageItems ?? []) as unknown as ModeButton[], messages };
}

/**
 * Read script of a generated mode button.
 *
 * @param item The page item.
 * @returns The read script.
 */
function readOf(item: ModeButton): string | undefined {
    return item.data?.entity1?.value?.read;
}

/**
 * Write script of a generated mode button.
 *
 * @param item The page item.
 * @returns The write script.
 */
function writeOf(item: ModeButton): string | undefined {
    return item.data?.entity1?.set?.write;
}

/**
 * Icon of the active state of a generated mode button.
 *
 * @param item The page item.
 * @returns The icon name.
 */
function activeIconOf(item: ModeButton): unknown {
    return item.data?.icon?.true?.value?.constVal;
}

/**
 * Color of the active state of a generated page item.
 *
 * @param item The page item.
 * @returns The color.
 */
function activeColorOf(item: ModeButton): unknown {
    return item.data?.icon?.true?.color?.constVal;
}

/**
 * Icon of the inactive state of a generated mode button - undefined if the button has none.
 *
 * @param item The page item.
 * @returns The icon name or undefined.
 */
function inactiveIconOf(item: ModeButton): unknown {
    return item.data?.icon?.false?.value?.constVal;
}

// ---------------------------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------------------------

describe('ConfigManager.getPageThermo() mode row of cardThermo', () => {
    describe('common.states as a record with numeric keys', () => {
        it('builds one button for every mode of the record', async () => {
            const { items } = await runThermo(CHANNELS.recordNumeric);
            expect(items.length, 'one button per mode').to.equal(7);
            for (const item of items) {
                expect(item.role).to.equal('button');
                expect(item.type).to.equal('button');
                expect(item.data?.entity1?.value?.dp).to.equal(`${CHANNELS.recordNumeric}.MODE`);
                expect(item.data?.entity1?.set?.dp).to.equal(`${CHANNELS.recordNumeric}.MODE`);
            }
        });

        it('compares against the key of the record, not against the position of the token', async () => {
            const { items } = await runThermo(CHANNELS.recordNumeric);
            expect(items.map(readOf)).to.deep.equal([
                'return val == 0',
                'return val == 1',
                'return val == 2',
                'return val == 3',
                'return val == 4',
                'return val == 5',
                'return val == 6',
            ]);
        });

        it('writes the key of the record', async () => {
            const { items } = await runThermo(CHANNELS.recordNumeric);
            expect(items.map(writeOf)).to.deep.equal([
                'return 0',
                'return 1',
                'return 2',
                'return 3',
                'return 4',
                'return 5',
                'return 6',
            ]);
        });

        it('uses the icons in the order OFF, AUTO, COOL, HEAT, ECO, FAN_ONLY, DRY', async () => {
            const { items } = await runThermo(CHANNELS.recordNumeric);
            expect(items.map(activeIconOf)).to.deep.equal([
                'power-off',
                'alpha-a-circle',
                'snowflake',
                'fire',
                'alpha-e-circle-outline',
                'fan',
                'water-percent',
            ]);
            for (const item of items) {
                expect(item.data?.icon?.true?.color?.constVal).to.deep.equal(Color.activated);
                expect(item.data?.icon?.false?.color?.constVal).to.deep.equal(Color.deactivated);
            }
        });

        it('gives an inactive icon to AUTO only - no other mode inherits the outline A', async () => {
            const { items } = await runThermo(CHANNELS.recordNumeric);
            expect(items.map(inactiveIconOf)).to.deep.equal([
                undefined,
                'alpha-a-circle-outline',
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
            ]);
        });
    });

    describe('common.states as a record with tokens as keys', () => {
        it('quotes a key that is no number so the script compares against a string', async () => {
            const { items } = await runThermo(CHANNELS.recordString);
            expect(items.length, 'only the two modes of the record').to.equal(2);
            expect(items.map(readOf)).to.deep.equal(['return val == "off"', 'return val == "cool"']);
            expect(items.map(writeOf)).to.deep.equal(['return "off"', 'return "cool"']);
            expect(items.map(activeIconOf)).to.deep.equal(['power-off', 'snowflake']);
        });
    });

    describe('common.states as an array', () => {
        it('uses the position in the array as state value', async () => {
            const { items } = await runThermo(CHANNELS.arrayStates);
            expect(items.length).to.equal(7);
            expect(items.map(readOf)).to.deep.equal([
                'return val == 0',
                'return val == 1',
                'return val == 2',
                'return val == 3',
                'return val == 4',
                'return val == 5',
                'return val == 6',
            ]);
            expect(items.map(activeIconOf)).to.deep.equal([
                'power-off',
                'alpha-a-circle',
                'snowflake',
                'fire',
                'alpha-e-circle-outline',
                'fan',
                'water-percent',
            ]);
        });
    });

    describe('without common.states', () => {
        it('falls back to the built-in list of seven modes', async () => {
            const { items } = await runThermo(CHANNELS.withoutStates);
            expect(items.length).to.equal(7);
            expect(items.map(readOf)).to.deep.equal([
                'return val == 0',
                'return val == 1',
                'return val == 2',
                'return val == 3',
                'return val == 4',
                'return val == 5',
                'return val == 6',
            ]);
            expect(items.map(activeIconOf)).to.deep.equal([
                'power-off',
                'alpha-a-circle',
                'snowflake',
                'fire',
                'alpha-e-circle-outline',
                'fan',
                'water-percent',
            ]);
        });
    });

    describe('indicators below the mode row', () => {
        it('a MAINTAIN datapoint builds exactly one wrench', async () => {
            const { items } = await runThermo(CHANNELS.indicators);
            const wrenches = items.filter(item => activeIconOf(item) === 'account-wrench');
            expect(wrenches.length).to.equal(1);
        });

        it('the wrench turns red when maintenance is due', async () => {
            const { items } = await runThermo(CHANNELS.indicators);
            const wrench = items.find(item => activeIconOf(item) === 'account-wrench');
            expect(wrench, 'no maintenance indicator was built').to.not.equal(undefined);
            expect(activeColorOf(wrench as ModeButton)).to.equal(Color.bad);
            expect(inactiveIconOf(wrench as ModeButton)).to.equal('account-wrench');
        });

        it('the unreach indicator is built next to it', async () => {
            const { items } = await runThermo(CHANNELS.indicators);
            expect(items.filter(item => activeIconOf(item) === 'wifi-off').length).to.equal(1);
        });
    });
});
