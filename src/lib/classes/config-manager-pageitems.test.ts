/**
 * Characterization tests (golden master) for ConfigManager.getPageItemConfig() and
 * ConfigManager.getPageNaviItemConfig().
 *
 * Both functions are run against a fake object database for every channel role of
 * `requiredScriptDataPoints` and a set of item variants. The complete output (item config,
 * messages, log output, mutated item, thrown error) is compared with a stored snapshot.
 * The snapshot records the behaviour before a refactoring - every difference after the
 * refactoring is a change of behaviour.
 *
 * Update the snapshot after an intended change of behaviour:
 *   UPDATE_SNAPSHOTS=1 npx mocha --config test/mocharc.custom.json src/lib/classes/config-manager-pageitems.test.ts
 */
import { expect } from 'chai';
import * as fs from 'node:fs';
import path from 'node:path';
import { requiredScriptDataPoints } from '../const/config-manager-const';
import { StatesControler } from '../controller/states-controller';
import { ConfigManager } from './config-manager';

const SNAPSHOT_FILE = path.join(__dirname, '__snapshots__', 'config-manager-pageitems.snap.json');
const UPDATE = process.env.UPDATE_SNAPSHOTS === '1' || process.env.UPDATE_SNAPSHOTS === 'true';

type Snapshot = Record<string, unknown>;

const snapshot: Snapshot = fs.existsSync(SNAPSHOT_FILE) ? JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8')) : {};
const recorded: Snapshot = {};

/**
 * Converts a value into its JSON form. RegExp become strings, undefined properties are dropped.
 *
 * @param value Any value.
 * @returns The JSON compatible value.
 */
function normalize(value: unknown): unknown {
    if (value === undefined) {
        return '__undefined__';
    }
    return JSON.parse(
        JSON.stringify(value, (_key: string, v: unknown): unknown =>
            v instanceof RegExp ? `RegExp(${v.toString()})` : v,
        ),
    );
}

/**
 * Compares the value with the stored snapshot or records it in update mode.
 *
 * @param name Unique name of the case.
 * @param value The value to compare.
 */
function matchSnapshot(name: string, value: unknown): void {
    const actual = normalize(value);
    if (UPDATE) {
        recorded[name] = actual;
        return;
    }
    if (!(name in snapshot)) {
        throw new Error(`No snapshot for '${name}' - run the tests with UPDATE_SNAPSHOTS=1 to record it.`);
    }
    expect(actual, name).to.deep.equal(snapshot[name]);
}

// ---------------------------------------------------------------------------------------------
// fake object database
// ---------------------------------------------------------------------------------------------

type ObjectDB = Record<string, ioBroker.Object>;

/**
 * Adds a state object.
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
 * Adds a channel object.
 *
 * @param db Object database.
 * @param id Channel id.
 * @param role Channel role.
 * @param name Common name.
 */
function addChannel(db: ObjectDB, id: string, role: string, name: ioBroker.StringOrTranslated): void {
    db[id] = { _id: id, type: 'channel', common: { name, role }, native: {} };
}

/**
 * First or last element of a value or array.
 *
 * @param v Value or array.
 * @param last Take the last element instead of the first.
 * @returns The element.
 */
function pick<T>(v: T | T[] | undefined, last = false): T | undefined {
    return Array.isArray(v) ? v[last ? v.length - 1 : 0] : v;
}

/**
 * Id-safe form of a channel role (dots would mix up the substring search of the states controller).
 *
 * @param role Channel role.
 * @returns The role without dots.
 */
function roleId(role: string): string {
    return role.replace(/\./g, '_');
}

const ROLES = Object.keys(requiredScriptDataPoints) as ScriptConfig.channelRoles[];

/** Device variants (channel ids) created for every channel role. */
const DEVICES = {
    // every datapoint of requiredScriptDataPoints
    full: (role: string): string => `alias.0.full.${roleId(role)}`,
    // only the required datapoints
    min: (role: string): string => `alias.0.min.${roleId(role)}`,
    // every datapoint with the last alternative role/type, other values, plus BUTTONTEXT, BUTTONTEXTOFF and ENABLED
    ext: (role: string): string => `alias.0.ext.${roleId(role)}`,
    // channel without any datapoint
    empty: (role: string): string => `alias.0.empty.${roleId(role)}`,
};

/**
 * Builds the object database used by all tests.
 *
 * @returns The object database and the state values.
 */
function buildDatabase(): { objects: ObjectDB; states: Record<string, ioBroker.State> } {
    const objects: ObjectDB = {};
    const states: Record<string, ioBroker.State> = {};

    for (const role of ROLES) {
        const data = requiredScriptDataPoints[role].data as Record<
            string,
            { role: string | string[]; type: string | string[]; required: boolean; writeable: boolean } | undefined
        >;
        for (const variant of ['full', 'min', 'ext', 'empty'] as const) {
            const dev = DEVICES[variant](role);
            addChannel(objects, dev, role, { en: `${variant} ${role}`, de: `${variant} ${role} (de)` });
            if (variant === 'empty') {
                continue;
            }
            for (const key of Object.keys(data)) {
                const entry = data[key];
                if (!entry || (variant === 'min' && !entry.required)) {
                    continue;
                }
                const id = `${dev}.${key}`;
                const last = variant === 'ext';
                const common: Partial<ioBroker.StateCommon> = {
                    role: pick(entry.role, last) || 'state',
                    type: (pick(entry.type, last) || 'mixed') as ioBroker.CommonType,
                    write: !!entry.writeable,
                    unit: key === 'ACTUAL' ? 'W' : undefined,
                    min: 0,
                    max: 100,
                };
                if (key === 'MODE' || key === 'MODESET' || key === 'LIST') {
                    common.states = { 0: 'OFF', 1: 'AUTO', 2: 'COOL' };
                }
                if (role === 'media' && key === 'STATE') {
                    // full: supported media adapter, ext: unsupported adapter, min: alias target missing
                    common.alias = {
                        id: variant === 'full' ? 'mpd.0.state' : `mediaplayer.0.${variant}.state`,
                    };
                }
                if (role === 'select' && key === 'SET' && variant === 'ext') {
                    common.alias = { id: 'alias.0.helper.states' };
                }
                addState(objects, id, common);
                const num = variant === 'ext' ? 3000 : 42;
                const val = common.type === 'boolean' ? true : common.type === 'string' ? 'abc' : num;
                states[id] = { val, ack: true, ts: 0, lc: 0, from: '' };
            }
            if (variant === 'ext') {
                addState(objects, `${dev}.BUTTONTEXT`, { role: 'text', type: 'string' });
                addState(objects, `${dev}.BUTTONTEXTOFF`, { role: 'text', type: 'string' });
                addState(objects, `${dev}.ENABLED`, { role: 'indicator', type: 'boolean' });
            }
        }
    }

    // media alias targets (the min one does not exist)
    addState(objects, 'mpd.0.state', { role: 'media.state', type: 'boolean' });
    addState(objects, 'mediaplayer.0.ext.state', { role: 'media.state', type: 'boolean' });

    // helper states for item options given as state id
    addState(objects, 'alias.0.helper.text', { role: 'text', type: 'string' });
    addState(objects, 'alias.0.helper.icon', { role: 'text', type: 'string' });
    addState(objects, 'alias.0.helper.color', { role: 'level.color.rgb', type: 'string' });
    addState(objects, 'alias.0.helper.number', { role: 'level', type: 'number', write: true });
    addState(objects, 'alias.0.helper.readonly', { role: 'value', type: 'number', write: false });
    addState(objects, 'alias.0.helper.switch', { role: 'switch', type: 'boolean', write: true });
    addState(objects, 'alias.0.helper.states', {
        role: 'level.mode',
        type: 'number',
        write: true,
        states: { 0: 'zero', 1: 'one' },
    });

    // media channel whose STATE has no alias
    addChannel(objects, 'alias.0.media.noAlias', 'media', 'media without alias');
    addState(objects, 'alias.0.media.noAlias.STATE', { role: 'media.state', type: 'boolean' });

    // objects for the generic tests
    addChannel(objects, 'alias.0.noRole', '', 'no role');
    (objects['alias.0.noRole'].common as { role?: string }).role = undefined;
    addChannel(objects, 'alias.0.unsupported', 'unknown.role', 'unsupported');
    addState(objects, 'alias.0.custom.writeable', { role: 'level', type: 'number', write: true, name: 'Custom W' });
    addState(objects, 'alias.0.custom.readonly', { role: 'value', type: 'number', write: false, name: 'Custom R' });

    return { objects, states };
}

const DB = buildDatabase();

// ---------------------------------------------------------------------------------------------
// fake adapter
// ---------------------------------------------------------------------------------------------

type LogEntry = [level: string, text: string];

/**
 * Adapter stub with the fake object database.
 *
 * @param logs Receives the log output (info, warn, error).
 * @param config Adapter configuration.
 * @returns An object usable as adapter for ConfigManager.
 */
function fakeAdapter(logs: LogEntry[], config: Record<string, unknown> = {}): any {
    const noop = (): void => undefined;
    const objects = DB.objects;
    return {
        namespace: 'nspanel-lovelace-ui.0',
        language: 'de',
        unload: false,
        library: { getLocalLanguage: (): string => 'de' },
        log: {
            silly: noop,
            debug: noop,
            info: (t: string): number => logs.push(['info', t]),
            warn: (t: string): number => logs.push(['warn', t]),
            error: (t: string): number => logs.push(['error', t]),
        },
        config: { panels: [{ topic: 'panel/a', name: 'a' }], testCase: false, ...config },
        setInterval: (): number => 1,
        clearInterval: noop,
        setTimeout: (): number => 1,
        clearTimeout: noop,
        getForeignObjectAsync: async (id: string): Promise<ioBroker.Object | null> =>
            objects[id] ? structuredClone(objects[id]) : null,
        getForeignObjectsAsync: async (): Promise<ObjectDB> => structuredClone(objects),
        getEnumsAsync: async (): Promise<Record<string, Record<string, never>>> => ({
            'enum.rooms': {},
            'enum.functions': {},
        }),
        getForeignStateAsync: async (id: string): Promise<ioBroker.State | null> =>
            DB.states[id] ? structuredClone(DB.states[id]) : null,
        getForeignStatesAsync: async (): Promise<Record<string, never>> => ({}),
        getStateAsync: async (): Promise<null> => null,
        getObjectViewAsync: async (
            _design: string,
            _search: string,
            params: { startkey?: string },
        ): Promise<{ rows: { id: string }[] }> =>
            params?.startkey === 'system.adapter.mpd.' ? { rows: [{ id: 'system.adapter.mpd.0' }] } : { rows: [] },
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

type Fn = 'item' | 'navi';

/**
 * Runs one of the two functions and collects everything observable.
 *
 * @param fn Function to call.
 * @param item The page item (gets cloned).
 * @param page The page.
 * @param config Adapter configuration.
 * @returns The observable result.
 */
async function run(
    fn: Fn,
    item: Record<string, unknown>,
    page: Record<string, unknown>,
    config: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
    resetStatesController();
    const logs: LogEntry[] = [];
    const manager = new ConfigManager(fakeAdapter(logs, config), true);
    const usedItem = structuredClone(item) as unknown as ScriptConfig.PageItem;
    const usedPage = structuredClone(page) as unknown as ScriptConfig.PageType;
    const result: Record<string, unknown> = {};
    try {
        if (fn === 'item') {
            const r = await manager.getPageItemConfig(usedItem, usedPage, []);
            result.itemConfig = r.itemConfig ?? '__undefined__';
            result.messages = r.messages;
            if (r.pageConfig !== undefined) {
                result.pageConfig = r.pageConfig;
            }
        } else {
            result.itemConfig = (await manager.getPageNaviItemConfig(usedItem, usedPage)) ?? '__undefined__';
        }
    } catch (e) {
        result.error = e instanceof Error ? e.message : String(e);
    }
    result.logs = logs;
    result.itemAfter = usedItem;
    await manager.delete();
    resetStatesController();
    return result;
}

// ---------------------------------------------------------------------------------------------
// pages and items
// ---------------------------------------------------------------------------------------------

/**
 * A page of the given card type.
 *
 * @param type Card type.
 * @returns The page.
 */
function page(type: string): Record<string, unknown> {
    return { type, uniqueName: `test-${type}`, heading: 'Test', items: [] };
}

const PAGES = {
    grid: page('cardGrid'),
    grid2: page('cardGrid2'),
    entities: page('cardEntities'),
    schedule: page('cardSchedule'),
    thermo: page('cardThermo'),
};

/** Item with (almost) every option set as constant. */
const KITCHEN_SINK_CONST: Record<string, unknown> = {
    name: 'Kitchen',
    icon: 'lightbulb',
    icon2: 'lightbulb-outline',
    icon3: 'alarm',
    onColor: { red: 10, green: 20, blue: 30 },
    offColor: { red: 40, green: 50, blue: 60 },
    colorScale: { val_min: 0, val_max: 100, val_best: 50 },
    unit: 'kW',
    fontSize: 3,
    prefixName: 'pre ',
    suffixName: ' suf',
    prefixValue: '<',
    suffixValue: '>',
    buttonText: 'On',
    buttonTextOff: 'Off',
    secondRow: 'second row',
    minValue: 1,
    maxValue: 99,
    stepValue: 2,
    minValueBrightness: 5,
    maxValueBrightness: 95,
    minValueColorTemp: 2000,
    maxValueColorTemp: 6500,
    minValueLevel: 3,
    maxValueLevel: 97,
    minValueTilt: 4,
    maxValueTilt: 96,
    colormode: 'xy',
    modeList: ['one', 'two', 'three'],
    confirm: 'Sure?',
    filter: 2,
    targetPage: 'otherPage',
    targetPageLongPress: 'longPage',
    longPress: 'alias.0.helper.switch',
    useValueConditions: 'cond',
    interpolateColor: true,
    useColor: true,
    asControl: true,
    inSel_Alias: 'alias.0.not.existing.sel',
    shutterIcons: [
        { id: 'alias.0.helper.switch', icon: 'fan', icon2: 'fan-off', iconOnColor: { red: 1, green: 2, blue: 3 } },
        { id: 'alias.0.not.existing', icon: 'window-open' },
        { id: 'alias.0.helper.number', icon: 'lock', iconOffColor: { red: 4, green: 5, blue: 6 } },
    ],
    sliderItems: [
        { heading: 'S1', id: 'alias.0.helper.number', minValue: 1, maxValue: 10, stepValue: 1, zeroValue: true },
        { heading: 'S2', id: 'alias.0.helper.readonly', icon1: 'fan', icon2: 'fan-off' },
        { heading: 'S3' },
    ],
};

/** Item options given as state ids. */
const KITCHEN_SINK_STATES: Record<string, unknown> = {
    name: 'alias.0.helper.text',
    icon: 'alias.0.helper.icon',
    icon2: 'alias.0.helper.icon',
    onColor: 'alias.0.helper.color',
    offColor: 'alias.0.helper.color',
    prefixName: 'alias.0.helper.text',
    suffixName: 'alias.0.helper.text',
    prefixValue: 'alias.0.helper.text',
    suffixValue: 'alias.0.helper.text',
    buttonText: 'alias.0.helper.text',
    buttonTextOff: 'alias.0.helper.text',
    useValueConditions: 'alias.0.helper.text',
    inSel_Alias: 'alias.0.helper.states',
    confirm: { text: 'Really?', icon: 'alert', color: { r: 1, g: 2, b: 3 } },
    fontSize: 0,
    targetPage: 'otherPage',
    enabled: false,
};

type Scenario = {
    name: string;
    fn: Fn;
    device: keyof typeof DEVICES;
    page: Record<string, unknown>;
    item?: Record<string, unknown>;
    config?: Record<string, unknown>;
};

/** Scenarios that run for every channel role. */
const ROLE_SCENARIOS: Scenario[] = [
    { name: 'item grid full', fn: 'item', device: 'full', page: PAGES.grid },
    { name: 'item grid2 full', fn: 'item', device: 'full', page: PAGES.grid2 },
    { name: 'item entities full', fn: 'item', device: 'full', page: PAGES.entities },
    { name: 'item schedule full', fn: 'item', device: 'full', page: PAGES.schedule },
    { name: 'item grid useValue', fn: 'item', device: 'full', page: PAGES.grid, item: { useValue: true } },
    { name: 'item grid min', fn: 'item', device: 'min', page: PAGES.grid },
    { name: 'item entities min', fn: 'item', device: 'min', page: PAGES.entities },
    { name: 'item grid empty channel', fn: 'item', device: 'empty', page: PAGES.grid },
    { name: 'item grid ext', fn: 'item', device: 'ext', page: PAGES.grid },
    { name: 'item entities const options', fn: 'item', device: 'full', page: PAGES.entities, item: KITCHEN_SINK_CONST },
    { name: 'item grid const options', fn: 'item', device: 'full', page: PAGES.grid, item: KITCHEN_SINK_CONST },
    {
        name: 'item entities state options',
        fn: 'item',
        device: 'full',
        page: PAGES.entities,
        item: KITCHEN_SINK_STATES,
    },
    { name: 'item grid state options', fn: 'item', device: 'full', page: PAGES.grid, item: KITCHEN_SINK_STATES },
    {
        name: 'item entities shutterClosedIsZero',
        fn: 'item',
        device: 'full',
        page: PAGES.entities,
        config: { shutterClosedIsZero: true },
    },
    {
        name: 'item entities min const options',
        fn: 'item',
        device: 'min',
        page: PAGES.entities,
        item: KITCHEN_SINK_CONST,
    },
    {
        name: 'item entities min state options',
        fn: 'item',
        device: 'min',
        page: PAGES.entities,
        item: KITCHEN_SINK_STATES,
    },
    {
        name: 'item entities ext const options',
        fn: 'item',
        device: 'ext',
        page: PAGES.entities,
        item: KITCHEN_SINK_CONST,
    },
    { name: 'item entities confirm invalid', fn: 'item', device: 'full', page: PAGES.entities, item: { confirm: {} } },
    { name: 'item grid icon only', fn: 'item', device: 'full', page: PAGES.grid, item: { icon: 'home' } },
    {
        name: 'item entities onColor only',
        fn: 'item',
        device: 'full',
        page: PAGES.entities,
        item: { onColor: { red: 1, green: 2, blue: 3 } },
    },
    { name: 'item grid asControl', fn: 'item', device: 'full', page: PAGES.grid, item: { asControl: true } },
    { name: 'item entities role socket', fn: 'item', device: 'full', page: PAGES.entities, item: { role: 'socket' } },
    { name: 'item entities enabled true', fn: 'item', device: 'ext', page: PAGES.entities, item: { enabled: true } },
    {
        name: 'navi grid full',
        fn: 'navi',
        device: 'full',
        page: PAGES.grid,
        item: { navigate: true, targetPage: 'naviTarget' },
    },
    {
        name: 'navi entities full',
        fn: 'navi',
        device: 'full',
        page: PAGES.entities,
        item: { navigate: true, targetPage: 'naviTarget' },
    },
    {
        name: 'navi grid useValue',
        fn: 'navi',
        device: 'full',
        page: PAGES.grid,
        item: { navigate: true, targetPage: 'naviTarget', useValue: true },
    },
    {
        name: 'navi grid min',
        fn: 'navi',
        device: 'min',
        page: PAGES.grid,
        item: { navigate: true, targetPage: 'naviTarget' },
    },
    {
        name: 'navi grid ext',
        fn: 'navi',
        device: 'ext',
        page: PAGES.grid,
        item: { navigate: true, targetPage: 'naviTarget' },
    },
    {
        name: 'navi entities const options',
        fn: 'navi',
        device: 'full',
        page: PAGES.entities,
        item: { ...KITCHEN_SINK_CONST, longPress: undefined, navigate: true, targetPage: 'naviTarget' },
    },
    {
        name: 'navi grid const options',
        fn: 'navi',
        device: 'full',
        page: PAGES.grid,
        item: { ...KITCHEN_SINK_CONST, longPress: undefined, navigate: true, targetPage: 'naviTarget' },
    },
    {
        name: 'navi grid longPress',
        fn: 'navi',
        device: 'full',
        page: PAGES.grid,
        item: { navigate: true, targetPage: 'naviTarget', longPress: 'alias.0.helper.switch' },
    },
    {
        name: 'navi grid icon only',
        fn: 'navi',
        device: 'full',
        page: PAGES.grid,
        item: { navigate: true, targetPage: 'naviTarget', icon: 'home' },
    },
    {
        name: 'navi grid targetPageLongPress',
        fn: 'navi',
        device: 'full',
        page: PAGES.grid,
        item: { navigate: true, targetPage: 'naviTarget', targetPageLongPress: 'longPage' },
    },
    {
        name: 'navi entities ext const options',
        fn: 'navi',
        device: 'ext',
        page: PAGES.entities,
        item: { ...KITCHEN_SINK_CONST, longPress: undefined, navigate: true, targetPage: 'naviTarget' },
    },
    {
        name: 'navi grid both longPress options',
        fn: 'navi',
        device: 'full',
        page: PAGES.grid,
        item: { navigate: true, targetPage: 'naviTarget', longPress: 'x', targetPageLongPress: 'y' },
    },
    {
        name: 'navi entities state options',
        fn: 'navi',
        device: 'full',
        page: PAGES.entities,
        item: { ...KITCHEN_SINK_STATES, navigate: true, targetPage: 'naviTarget' },
    },
    {
        name: 'navi entities shutterClosedIsZero',
        fn: 'navi',
        device: 'full',
        page: PAGES.entities,
        item: { navigate: true, targetPage: 'naviTarget' },
        config: { shutterClosedIsZero: true },
    },
    {
        name: 'navi entities role socket',
        fn: 'navi',
        device: 'full',
        page: PAGES.entities,
        item: { navigate: true, targetPage: 'naviTarget', role: 'socket' },
    },
    {
        name: 'navi via getPageItemConfig',
        fn: 'item',
        device: 'full',
        page: PAGES.grid,
        item: { navigate: true, targetPage: 'naviTarget' },
    },
];

/** Cases that do not depend on a channel role. */
const GENERIC_CASES: { name: string; fn: Fn; item: Record<string, unknown>; page: Record<string, unknown> }[] = [
    { name: 'item id delete', fn: 'item', item: { id: 'delete' }, page: PAGES.grid },
    { name: 'item id empty', fn: 'item', item: { id: 'empty' }, page: PAGES.grid },
    { name: 'item without id', fn: 'item', item: { name: 'x' }, page: PAGES.grid },
    { name: 'item id only dots', fn: 'item', item: { id: '...' }, page: PAGES.grid },
    { name: 'item id trailing dot', fn: 'item', item: { id: 'alias.0.full.light.' }, page: PAGES.grid },
    { name: 'item object not found', fn: 'item', item: { id: 'alias.0.not.existing' }, page: PAGES.grid },
    { name: 'item role missing', fn: 'item', item: { id: 'alias.0.noRole' }, page: PAGES.grid },
    { name: 'item role unsupported', fn: 'item', item: { id: 'alias.0.unsupported' }, page: PAGES.grid },
    {
        name: 'item native',
        fn: 'item',
        item: { native: { type: 'text', data: { entity1: { value: { type: 'const', constVal: 1 } } } } },
        page: PAGES.grid,
    },
    { name: 'item native invalid', fn: 'item', item: { native: { foo: 1 } }, page: PAGES.grid },
    {
        name: 'item navigate without targetPage',
        fn: 'item',
        item: { id: 'alias.0.full.light', navigate: true },
        page: PAGES.grid,
    },
    {
        name: 'item navigate targetPage not string',
        fn: 'item',
        item: { id: 'alias.0.full.light', navigate: true, targetPage: 5 },
        page: PAGES.grid,
    },
    {
        name: 'item custom writeable',
        fn: 'item',
        item: { type: 'custom', id: 'alias.0.custom.writeable' },
        page: PAGES.grid,
    },
    {
        name: 'item custom writeable options',
        fn: 'item',
        item: { ...KITCHEN_SINK_CONST, type: 'custom', id: 'alias.0.custom.writeable' },
        page: PAGES.entities,
    },
    {
        name: 'item custom readonly',
        fn: 'item',
        item: { type: 'custom', id: 'alias.0.custom.readonly' },
        page: PAGES.grid,
    },
    {
        name: 'item custom readonly options',
        fn: 'item',
        item: { ...KITCHEN_SINK_STATES, type: 'custom', id: 'alias.0.custom.readonly' },
        page: PAGES.entities,
    },
    { name: 'item media without alias', fn: 'item', item: { id: 'alias.0.media.noAlias' }, page: PAGES.grid },
    {
        name: 'item media without alias asControl',
        fn: 'item',
        item: { id: 'alias.0.media.noAlias', asControl: true },
        page: PAGES.grid,
    },
    {
        name: 'item custom on channel',
        fn: 'item',
        item: { type: 'custom', id: 'alias.0.full.light' },
        page: PAGES.grid,
    },
    {
        name: 'navi native',
        fn: 'navi',
        item: {
            navigate: true,
            targetPage: 'naviTarget',
            native: { type: 'button', data: { icon: { true: { value: { type: 'const', constVal: 'home' } } } } },
        },
        page: PAGES.grid,
    },
    {
        name: 'navi native with setNavi',
        fn: 'navi',
        item: {
            navigate: true,
            native: { type: 'button', data: { setNavi: { type: 'const', constVal: 'own' } } },
        },
        page: PAGES.grid,
    },
    {
        name: 'navi native without targetPage',
        fn: 'navi',
        item: { navigate: true, native: { type: 'button', data: {} } },
        page: PAGES.grid,
    },
    {
        name: 'navi native invalid',
        fn: 'navi',
        item: { navigate: true, targetPage: 'x', native: { foo: 1 } },
        page: PAGES.grid,
    },
    { name: 'navi without id', fn: 'navi', item: { navigate: true, targetPage: 'naviTarget' }, page: PAGES.grid },
    {
        name: 'navi without id options',
        fn: 'navi',
        item: { ...KITCHEN_SINK_CONST, navigate: true, targetPage: 'naviTarget' },
        page: PAGES.entities,
    },
    {
        name: 'navi without id state options',
        fn: 'navi',
        item: { ...KITCHEN_SINK_STATES, navigate: true, targetPage: 'naviTarget' },
        page: PAGES.entities,
    },
    { name: 'navi without navigate', fn: 'navi', item: { id: 'alias.0.full.light' }, page: PAGES.grid },
    {
        name: 'navi on unsupported page',
        fn: 'navi',
        item: { id: 'alias.0.full.light', navigate: true, targetPage: 'naviTarget' },
        page: PAGES.thermo,
    },
    {
        name: 'navi custom',
        fn: 'navi',
        item: { type: 'custom', navigate: true, targetPage: 'naviTarget' },
        page: PAGES.grid,
    },
    {
        name: 'navi custom on channel with options',
        fn: 'navi',
        item: {
            ...KITCHEN_SINK_CONST,
            type: 'custom',
            id: 'alias.0.full.light',
            navigate: true,
            targetPage: 'naviTarget',
        },
        page: PAGES.grid,
    },
    {
        name: 'navi custom state options',
        fn: 'navi',
        item: { ...KITCHEN_SINK_STATES, type: 'custom', navigate: true, targetPage: 'naviTarget' },
        page: PAGES.grid,
    },
    {
        name: 'navi object not found',
        fn: 'navi',
        item: { id: 'alias.0.not.existing', navigate: true, targetPage: 'naviTarget' },
        page: PAGES.grid,
    },
    {
        name: 'navi role missing',
        fn: 'navi',
        item: { id: 'alias.0.noRole', navigate: true, targetPage: 'naviTarget' },
        page: PAGES.grid,
    },
    {
        name: 'navi role unsupported',
        fn: 'navi',
        item: { id: 'alias.0.unsupported', navigate: true, targetPage: 'naviTarget' },
        page: PAGES.grid,
    },
    {
        name: 'navi id trailing dot',
        fn: 'navi',
        item: { id: 'alias.0.full.light.', navigate: true, targetPage: 'naviTarget' },
        page: PAGES.grid,
    },
];

// ---------------------------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------------------------

describe('lib/classes/config-manager - page items (golden master)', function () {
    this.timeout(20_000);

    after(() => {
        if (UPDATE) {
            fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
            const sorted: Snapshot = {};
            for (const key of Object.keys(recorded).sort()) {
                sorted[key] = recorded[key];
            }
            fs.writeFileSync(SNAPSHOT_FILE, `${JSON.stringify(sorted, null, 2)}\n`);
        }
    });

    for (const role of ROLES) {
        describe(`channel role ${role}`, () => {
            for (const s of ROLE_SCENARIOS) {
                it(s.name, async () => {
                    const item = { ...(s.item ?? {}), id: DEVICES[s.device](role) };
                    const name = `role ${role} | ${s.name}`;
                    matchSnapshot(name, await run(s.fn, item, s.page, s.config));
                });
            }
        });
    }

    describe('generic', () => {
        for (const c of GENERIC_CASES) {
            it(c.name, async () => {
                matchSnapshot(`generic | ${c.name}`, await run(c.fn, c.item, c.page));
            });
        }
    });

    it('snapshot has no stale entries', function () {
        if (UPDATE) {
            this.skip();
        }
        const expected = new Set<string>();
        for (const role of ROLES) {
            for (const s of ROLE_SCENARIOS) {
                expected.add(`role ${role} | ${s.name}`);
            }
        }
        for (const c of GENERIC_CASES) {
            expected.add(`generic | ${c.name}`);
        }
        const stale = Object.keys(snapshot).filter(k => !expected.has(k));
        expect(stale, 'snapshot entries without test case').to.deep.equal([]);
    });

    it('is deterministic (same input twice gives the same output)', async () => {
        for (const role of ROLES) {
            const item = { ...KITCHEN_SINK_CONST, id: DEVICES.full(role) };
            const a = normalize(await run('item', item, PAGES.entities));
            const b = normalize(await run('item', item, PAGES.entities));
            expect(a, role).to.deep.equal(b);
        }
    });

    it('keeps a color scale with color_best in the script form and normalizes the color to {r, g, b}', async () => {
        const scriptScale = { val_min: 0, val_max: 100, val_best: 50, color_best: { red: 1, green: 2, blue: 3 } };
        const adminScale = { val_min: 0, val_max: 100, val_best: 50, color_best: { r: 1, g: 2, b: 3 } };
        for (const fn of ['item', 'navi'] as const) {
            const item =
                fn === 'navi'
                    ? {
                          id: DEVICES.full('value.temperature'),
                          navigate: true,
                          targetPage: 'naviTarget',
                          name: 'Temp',
                          colorScale: scriptScale,
                      }
                    : { ...KITCHEN_SINK_CONST, id: DEVICES.full('value.temperature'), colorScale: scriptScale };
            const result = await run(fn, item, fn === 'navi' ? PAGES.grid : PAGES.entities);
            expect(result.error, `${fn}: no error`).to.equal(undefined);
            const after = result.itemAfter as { colorScale?: unknown };
            expect(after.colorScale, `${fn}: item normalized once at the entry`).to.deep.equal(adminScale);
            const json = JSON.stringify(normalize(result.itemConfig));
            expect(json, `${fn}: scale handed over with the admin form of color_best`).to.include(
                JSON.stringify(adminScale),
            );
        }
    });
});
