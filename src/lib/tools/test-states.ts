/**
 * Test environment: the objects of `templates/test-states.json` (alias channels of every channel role plus plain
 * states for power, charts, trash, ...) and their creation by the developer button `createTestStates`.
 *
 * The JSON describes a channel by its role and the initial values of its datapoints; type, role and write flag
 * of a datapoint come from `requiredScriptDataPoints` unless the JSON overrides them. Every datapoint becomes a
 * state below `userdata` (holds the value) and an alias state below `alias` pointing to it.
 */
import { requiredScriptDataPoints } from '../const/config-manager-const';

/** command of the developer button (sendTo) */
export const CREATE_TEST_STATES_COMMAND = 'createTestStates';

/** a datapoint of a test channel: only the initial value or the value with common overrides */
export type TestStateDefinition = {
    /** initial value; a string `{{ts:+15m}}` becomes a timestamp, `{{date:+3d}}` inside a string a local date */
    val?: ioBroker.StateValue;
    name?: string;
    role?: string;
    type?: ioBroker.CommonType;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
    states?: Record<string, string>;
    write?: boolean;
};

export type TestChannelDefinition = {
    /** id below the roots, e.g. `Licht.Flur` */
    id: string;
    /** channel role of the adapter (key of requiredScriptDataPoints) */
    role: string;
    name: string;
    states: Record<string, ioBroker.StateValue | TestStateDefinition>;
};

export type TestPlainStateDefinition = TestStateDefinition & {
    id: string;
    name: string;
    type: ioBroker.CommonType;
    role: string;
};

export type TestStatesFile = {
    version: number;
    /** root of the value states, e.g. `0_userdata.0.NSPanelTest` */
    userdata: string;
    /** root of the alias channels, e.g. `alias.0.NSPanelTest` */
    alias: string;
    channels: TestChannelDefinition[];
    /** states without alias (power, charts, trash, ...), created below `userdata` */
    states: TestPlainStateDefinition[];
};

/** an object to create, with the initial value for states */
export type TestObject = {
    id: string;
    obj: ioBroker.SettableObject;
    val?: ioBroker.StateValue;
};

/** what the adapter needs to create the objects (subset of the adapter, replaced in the tests) */
export type TestStatesTarget = {
    getForeignObjectAsync: (id: string) => Promise<ioBroker.Object | null | undefined>;
    setForeignObjectAsync: (id: string, obj: ioBroker.SettableObject) => Promise<unknown>;
    setForeignStateAsync: (id: string, val: ioBroker.StateValue, ack: boolean) => Promise<unknown>;
};

export type TestStatesResult = {
    /** objects created (folders, channels and states) */
    created: number;
    /** objects that existed and were left untouched */
    skipped: number;
    /** states that got their initial value */
    values: number;
    /** objects that could not be created */
    failed: number;
};

type DatapointDefinition = {
    role: string | string[];
    type: ioBroker.CommonType | ioBroker.CommonType[];
    writeable?: boolean;
};

/**
 * Type guard for the object form of a datapoint in the JSON.
 *
 * @param value entry of `states`
 */
function isStateDefinition(value: unknown): value is TestStateDefinition {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Datapoints of a channel role, undefined for an unknown role.
 *
 * @param role channel role
 */
function datapointsOf(role: string): Record<string, DatapointDefinition> | undefined {
    if (!(role in requiredScriptDataPoints)) {
        return undefined;
    }
    const entry = requiredScriptDataPoints[role as keyof typeof requiredScriptDataPoints];
    return entry.data;
}

/**
 * Replaces the time placeholders of a value.
 *
 * @param val value of the JSON
 * @param now reference time
 */
export function resolveTestValue(val: ioBroker.StateValue | undefined, now: number): ioBroker.StateValue | undefined {
    if (typeof val !== 'string') {
        return val;
    }
    const units: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    const ts = /^\{\{ts:([+-]\d+)([smhd])\}\}$/.exec(val);
    if (ts) {
        return now + Number(ts[1]) * units[ts[2]];
    }
    return val.replace(/\{\{date:([+-]\d+)d\}\}/g, (_match, days: string) => {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + Number(days));
        const pad = (n: number): string => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`;
    });
}

/**
 * ioBroker type of a value.
 *
 * @param val the value
 */
function typeOfValue(val: ioBroker.StateValue | undefined): ioBroker.CommonType {
    switch (typeof val) {
        case 'number':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'string':
            return 'string';
        default:
            return 'mixed';
    }
}

/**
 * The state role of every datapoint of a channel: a role list of the adapter takes its first role that no other
 * datapoint of the channel uses (the adapter finds most datapoints by their role).
 *
 * @param definitions datapoints of the channel role
 * @param names datapoints of the channel in the JSON
 * @param overrides roles given in the JSON
 */
function chooseRoles(
    definitions: Record<string, DatapointDefinition>,
    names: string[],
    overrides: Record<string, string | undefined>,
): Record<string, string> {
    const result: Record<string, string> = {};
    const used = new Set<string>();
    for (const name of names) {
        const role = overrides[name] ?? definitions[name]?.role;
        if (typeof role === 'string') {
            result[name] = role;
            used.add(role);
        }
    }
    for (const name of names) {
        if (result[name]) {
            continue;
        }
        const roles = definitions[name]?.role;
        const list = Array.isArray(roles) ? roles : ['state'];
        const role = list.find(r => !used.has(r)) ?? list[0];
        result[name] = role;
        used.add(role);
    }
    return result;
}

/**
 * The common part of a state.
 *
 * @param def datapoint of the JSON
 * @param name name of the state
 * @param role state role
 * @param type state type
 * @param write write flag
 */
function stateCommon(
    def: TestStateDefinition,
    name: string,
    role: string,
    type: ioBroker.CommonType,
    write: boolean,
): ioBroker.StateCommon {
    const common: ioBroker.StateCommon = { name, role, type, read: true, write };
    if (def.unit !== undefined) {
        common.unit = def.unit;
    }
    if (def.min !== undefined) {
        common.min = def.min;
    }
    if (def.max !== undefined) {
        common.max = def.max;
    }
    if (def.step !== undefined) {
        common.step = def.step;
    }
    if (def.states !== undefined) {
        common.states = def.states;
    }
    return common;
}

/**
 * Folder objects for the root and every parent of the ids below it that is no object of the list itself.
 *
 * @param root root id (gets a folder too)
 * @param ids ids of the objects below the root
 * @param known ids of the objects of the list
 */
function folderObjects(root: string, ids: string[], known: Set<string>): TestObject[] {
    const result: TestObject[] = [];
    const seen = new Set<string>();
    const rootParts = root.split('.').length;
    for (const id of ids) {
        const parts = id.split('.');
        for (let i = rootParts; i < parts.length; i++) {
            const parent = parts.slice(0, i).join('.');
            if (seen.has(parent) || known.has(parent)) {
                continue;
            }
            seen.add(parent);
            result.push({
                id: parent,
                obj: { type: 'folder', common: { name: parts[i - 1] }, native: {} },
            });
        }
    }
    return result;
}

/**
 * Problems of the JSON: unknown channel roles, missing required datapoints, datapoints without a type.
 *
 * @param data content of test-states.json
 * @returns one text per problem, empty when everything is fine
 */
export function validateTestStates(data: TestStatesFile): string[] {
    const problems: string[] = [];
    const ids = new Set<string>();
    for (const channel of data.channels) {
        if (ids.has(channel.id)) {
            problems.push(`${channel.id}: duplicate id`);
        }
        ids.add(channel.id);
        const definitions = datapointsOf(channel.role);
        if (!definitions) {
            problems.push(`${channel.id}: unknown channel role ${channel.role}`);
            continue;
        }
        for (const [dp, def] of Object.entries(definitions)) {
            const required = (def as { required?: boolean }).required === true;
            if (required && !(dp in channel.states)) {
                problems.push(`${channel.id}: required datapoint ${dp} missing`);
            }
        }
        for (const [dp, entry] of Object.entries(channel.states)) {
            const known = definitions[dp];
            const override = isStateDefinition(entry) ? entry : undefined;
            if (!known && !(override?.role && override.type)) {
                problems.push(`${channel.id}.${dp}: not a datapoint of ${channel.role} and no role/type given`);
            }
        }
    }
    for (const state of data.states) {
        if (ids.has(state.id)) {
            problems.push(`${state.id}: duplicate id`);
        }
        ids.add(state.id);
    }
    return problems;
}

/**
 * All objects of the test environment in creation order (folders, channels, states).
 *
 * @param data content of test-states.json
 * @param now reference time of the time placeholders
 */
export function buildTestObjects(data: TestStatesFile, now: number = Date.now()): TestObject[] {
    const userdata: TestObject[] = [];
    const alias: TestObject[] = [];

    for (const channel of data.channels) {
        const definitions = datapointsOf(channel.role) ?? {};
        const names = Object.keys(channel.states);
        const overrides: Record<string, string | undefined> = {};
        for (const name of names) {
            const entry = channel.states[name];
            overrides[name] = isStateDefinition(entry) ? entry.role : undefined;
        }
        const roles = chooseRoles(definitions, names, overrides);
        const channelAlias = `${data.alias}.${channel.id}`;
        alias.push({
            id: channelAlias,
            obj: { type: 'channel', common: { name: channel.name, role: channel.role }, native: {} },
        });
        for (const name of names) {
            const entry = channel.states[name];
            const def: TestStateDefinition = isStateDefinition(entry) ? entry : { val: entry };
            const val = resolveTestValue(def.val, now);
            const known = definitions[name];
            const knownType = known && !Array.isArray(known.type) ? known.type : undefined;
            const type = def.type ?? knownType ?? typeOfValue(val);
            const write = def.write ?? known?.writeable === true;
            const stateName = def.name ?? `${channel.name} ${name}`;
            const target = `${data.userdata}.${channel.id}.${name}`;
            userdata.push({
                id: target,
                obj: { type: 'state', common: stateCommon(def, stateName, roles[name], type, true), native: {} },
                val,
            });
            const aliasCommon = stateCommon(def, stateName, roles[name], type, write);
            aliasCommon.alias = { id: target };
            alias.push({ id: `${channelAlias}.${name}`, obj: { type: 'state', common: aliasCommon, native: {} } });
        }
    }

    for (const state of data.states) {
        userdata.push({
            id: `${data.userdata}.${state.id}`,
            obj: {
                type: 'state',
                common: stateCommon(state, state.name, state.role, state.type, state.write ?? true),
                native: {},
            },
            val: resolveTestValue(state.val, now),
        });
    }

    const userdataIds = userdata.map(o => o.id);
    const aliasIds = alias.map(o => o.id);
    return [
        ...folderObjects(data.userdata, userdataIds, new Set(userdataIds)),
        ...userdata,
        ...folderObjects(data.alias, aliasIds, new Set(aliasIds)),
        ...alias,
    ];
}

/**
 * Creates every object that does not exist yet and gives a newly created state its initial value. Existing
 * objects keep their definition and value.
 *
 * @param target adapter functions
 * @param objects objects of {@link buildTestObjects}
 * @param onError called with the id and the error of an object that could not be created
 */
export async function createTestObjects(
    target: TestStatesTarget,
    objects: TestObject[],
    onError: (id: string, error: unknown) => void = (): void => undefined,
): Promise<TestStatesResult> {
    const result: TestStatesResult = { created: 0, skipped: 0, values: 0, failed: 0 };
    for (const entry of objects) {
        try {
            if (await target.getForeignObjectAsync(entry.id)) {
                result.skipped++;
                continue;
            }
            await target.setForeignObjectAsync(entry.id, entry.obj);
            result.created++;
            if (entry.obj.type === 'state' && entry.val !== undefined) {
                await target.setForeignStateAsync(entry.id, entry.val, true);
                result.values++;
            }
        } catch (error) {
            result.failed++;
            onError(entry.id, error);
        }
    }
    return result;
}

/**
 * Type guard for the content of test-states.json (checks the structure, not every field).
 *
 * @param data parsed JSON
 */
export function isTestStatesFile(data: unknown): data is TestStatesFile {
    if (typeof data !== 'object' || data === null) {
        return false;
    }
    const d = data as Record<string, unknown>;
    return (
        typeof d.userdata === 'string' &&
        typeof d.alias === 'string' &&
        Array.isArray(d.channels) &&
        Array.isArray(d.states) &&
        d.channels.every(
            c =>
                typeof c === 'object' &&
                c !== null &&
                typeof (c as Record<string, unknown>).id === 'string' &&
                typeof (c as Record<string, unknown>).role === 'string' &&
                isStateDefinition((c as Record<string, unknown>).states),
        ) &&
        d.states.every(
            s =>
                isStateDefinition(s) &&
                typeof (s as Record<string, unknown>).id === 'string' &&
                typeof (s as Record<string, unknown>).type === 'string',
        )
    );
}

/**
 * Parses the JSON of the test environment.
 *
 * @param text content of test-states.json
 * @returns the data, throws on a broken file
 */
export function parseTestStatesFile(text: string): TestStatesFile {
    const data: unknown = JSON.parse(text);
    if (!isTestStatesFile(data)) {
        throw new Error('test-states.json has an unexpected structure');
    }
    return data;
}
