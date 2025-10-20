import _fs from 'fs';
import { genericStateObjects } from '../const/definition';

import * as LocalTranslations from '../../../templates/translations.json';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
// only change this for other adapters
export type AdapterClassDefinition = NspanelLovelaceUi;

export type LibraryStateVal = LibraryStateValJson | undefined;
type LibraryStateValJson = {
    type: ioBroker.ObjectType;
    stateTyp: string | undefined;
    val: ioBroker.StateValue | undefined;
    ts: number;
    ack: boolean;
    obj: ioBroker.Object | undefined;
    init: boolean;
};

// Generic library module and base classes, do not insert specific adapter code here.

/**
 * Base class with this.log function.
 */
export class BaseClass {
    unload: boolean = false;
    log: CustomLog;
    adapter: AdapterClassDefinition;
    library: Library;
    name: string = ``;
    friendlyName: string = ``;

    constructor(adapter: AdapterClassDefinition, name: string = '', logName: string = '') {
        this.name = name;
        this.friendlyName = logName ? logName : this.name;
        this.log = new CustomLog(adapter, this.friendlyName);
        this.adapter = adapter;
        this.library = adapter.library;
    }
    async delete(): Promise<void> {
        this.unload = true;
    }
}

class CustomLog {
    #adapter: AdapterClassDefinition;
    #prefix: string;
    constructor(adapter: AdapterClassDefinition, text: string = '') {
        this.#adapter = adapter;
        this.#prefix = text;
    }
    getName(): string {
        return this.#prefix;
    }
    debug(log: string, log2: string = ''): void {
        this.#adapter.log.debug(log2 ? `[${log}] ${log2}` : `[${this.#prefix}] ${log}`);
    }
    info(log: string, log2: string = ''): void {
        this.#adapter.log.info(log2 ? `[${log}] ${log2}` : `[${this.#prefix}] ${log}`);
    }
    warn(log: string, log2: string = ''): void {
        this.#adapter.log.warn(log2 ? `[${log}] ${log2}` : `[${this.#prefix}] ${log}`);
    }
    error(log: string, log2: string = ''): void {
        this.#adapter.log.error(log2 ? `[${log}] ${log2}` : `[${this.#prefix}] ${log}`);
        if (this.#adapter.config.testCase) {
            throw new Error(log2 ? `[${log}] ${log2}` : `[${this.#prefix}] No Erros while testing - ${log}`);
        }
    }
    setLogPrefix(text: string): void {
        this.#prefix = text;
    }
}

export class Library extends BaseClass {
    private stateDataBase: { [key: string]: LibraryStateVal } = {};
    private forbiddenDirs: string[] = [];
    private translation: Record<'custom' | 'standard', { [key: string]: string }> = { custom: {}, standard: {} };
    private unknownTokens: Record<string, string> = {};
    private unknownTokensInterval: ioBroker.Interval | undefined;
    defaults = {
        updateStateOnChangeOnly: true,
    };

    constructor(adapter: AdapterClassDefinition, _options: any = null) {
        super(adapter, 'library');
        this.stateDataBase = {};
    }

    async init(): Promise<void> {
        await this.checkLanguage();
        if (this.adapter.config.logUnknownTokens) {
            this.unknownTokensInterval = this.adapter.setInterval(() => {
                this.log.info(`Unknown tokens: ${JSON.stringify(this.unknownTokens)}`);
            }, 60_000);
        }
    }

    /**
    /**
     * Write/create states and channels from a JSON subtree using a definition.
     *
     * Parallelization:
     * - Parent channel is created first (sequential).
     * - Children (array items or object keys) are processed in parallel with a concurrency limit.
     *
     * @param prefix       ioBroker datapoint prefix to write into (e.g., "adapter.0.foo")
     * @param objNode      JSON-path into the definition (used by getObjectDefFromJson)
     * @param def          Definition JSON (mapping of nodes to Channel/State object definitions)
     * @param data         Source JSON subtree to materialize under `prefix`
     * @param expandTree   If true, arrays below a state are expanded into channels instead of being stringified
     * @param concurrency  Max number of parallel child writes (default: 8)
     * @returns Promise<void>
     */
    async writeFromJson(
        prefix: string,
        objNode: string,
        def: any, // keep as-is if your defs are large/complex; can be tightened later
        data: unknown,
        expandTree: boolean = false,
        concurrency: number = 8,
    ): Promise<void> {
        // Type guards
        if (!def || typeof def !== 'object') {
            return;
        }
        const t = typeof data;
        if (data === undefined || (t !== 'string' && t !== 'number' && t !== 'boolean' && t !== 'object')) {
            return;
        }

        // Resolve object definition for the current node
        const objectDefinition = objNode ? await this.getObjectDefFromJson(`${objNode}`, def, data as any) : null;

        if (objectDefinition) {
            objectDefinition.native = {
                ...(objectDefinition.native || {}),
                objectDefinitionReference: objNode,
            };
        }

        // Simple concurrency limiter (no dependency)
        const queue: Array<() => Promise<void>> = [];
        let active = 0;
        const runLimited = async <T>(task: () => Promise<T>): Promise<T> => {
            if (active >= concurrency) {
                await new Promise<void>(resolve => queue.push(async () => resolve()));
            }
            active++;
            try {
                return await task();
            } finally {
                active--;
                const next = queue.shift();
                if (next) {
                    next().catch(() => void 0);
                }
            }
        };

        // Helper to process an array element (index -> channel + recurse)
        const processArrayItem = (idx: number, item: unknown): Promise<void> =>
            runLimited(async () => {
                if (!objectDefinition) {
                    return;
                }
                const defChannel = this.getChannelObject(objectDefinition);
                const dp = `${prefix}${`00${idx}`.slice(-2)}`; // e.g. foo.00, foo.01
                await this.writedp(dp, null, defChannel); // create folder
                await this.writeFromJson(dp, `${objNode}`, def, item, expandTree, concurrency);
            });

        // Helper to process an object key (key -> recurse)
        const processObjectKey = (key: string, value: unknown): Promise<void> =>
            runLimited(async () => {
                await this.writeFromJson(`${prefix}.${key}`, `${objNode}.${key}`, def, value, expandTree, concurrency);
            });

        // Branch: objects/arrays
        if (typeof data === 'object' && data !== null) {
            // Arrays
            if (Array.isArray(data)) {
                if (!objectDefinition) {
                    return;
                }

                // When definition says "state" and we don't expand: stringify once
                if (objectDefinition.type === 'state' && !expandTree) {
                    const serialized = JSON.stringify(data) || '[]';
                    await this.writeFromJson(prefix, objNode, def, serialized, expandTree, concurrency);
                    return;
                }

                // Else: expand array to child channels, process items in parallel (limited)
                const tasks = data.map((item, idx) => processArrayItem(idx, item));
                await Promise.all(tasks);
                return;
            }

            // Plain object
            // Ensure parent folder exists if we have a definition
            if (objectDefinition) {
                const defChannel = this.getChannelObject(objectDefinition);
                await this.writedp(prefix, null, defChannel);
            }

            // Null → nothing to do
            if (data === null) {
                return;
            }

            // Process keys in parallel (limited)
            const entries = Object.entries(data as Record<string, unknown>);
            const tasks = entries.map(([k, v]) => processObjectKey(k, v));
            await Promise.all(tasks);
            return;
        }

        // Primitives (string/number/boolean) — must be a state
        if (!objectDefinition) {
            return;
        }
        await this.writedp(prefix, data as ioBroker.StateValue, objectDefinition);
    }

    /**
     * Get the ioBroker.Object out of stateDefinition
     *
     * @param key is the deep linking key to the definition
     * @param def is the definition object
     * @param data  is the definition dataset
     * @returns ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.StateObject
     */
    async getObjectDefFromJson(
        key: string,
        def: any,
        data: any,
    ): Promise<ioBroker.StateObject | ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.FolderObject | null> {
        //let result = await jsonata(`${key}`).evaluate(data);
        let result = this.deepJsonValue(key, def);
        if (result === null || result === undefined) {
            const k = key.split('.');
            if (k && k[k.length - 1].startsWith('_')) {
                result = genericStateObjects.customString;
                result = structuredClone(result);
            } else {
                this.log.debug(`No definition for ${key}!`);
                result = genericStateObjects.default;
                result = structuredClone(result);
                switch (typeof data) {
                    case 'number':
                    case 'bigint':
                        {
                            result.common.type = 'number';
                            result.common.role = 'value';
                        }
                        break;
                    case 'boolean':
                        {
                            result.common.type = 'boolean';
                            result.common.role = 'indicator';
                        }
                        break;
                    case 'string':
                        {
                            result.common.type = 'string';
                            result.common.role = 'text';
                        }
                        break;
                    case 'symbol':
                    case 'undefined':
                    case 'object':
                    case 'function':
                        {
                            result.common.type = 'string';
                            result.common.role = 'json';
                        }
                        break;
                }
            }
        } else {
            result = structuredClone(result);
        }
        return result;
    }

    deepJsonValue(key: string, data: any): any {
        if (!key || !data || typeof data !== 'object' || typeof key !== 'string') {
            throw new Error(`Error(222) data or key are missing/wrong type!`);
        }
        const k = key.split(`.`);
        let c = 0,
            s = data;
        while (c < k.length) {
            s = s[k[c++]];
            if (s === undefined) {
                return null;
            }
        }
        return s;
    }

    /**
     * Get a channel/device definition from property _channel out of a getObjectDefFromJson() result or a default definition.
     *
     * @param definition the definition object
     * @returns ioBroker.ChannelObject | ioBroker.DeviceObject or a default channel obj
     */
    getChannelObject(
        definition: (ioBroker.Object & { _channel?: ioBroker.Object }) | null = null,
    ): ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.FolderObject {
        const def = (definition && definition._channel) || null;
        const result: ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.FolderObject = {
            _id: def ? def._id : '',
            type: def ? (def.type == 'channel' ? 'channel' : def.type === 'device' ? 'device' : 'folder') : 'folder',
            common: {
                name: (def && def.common && def.common.name) || 'no definition',
            },
            native: (def && def.native) || {},
        };
        return result;
    }

    /**
     * Write/create the specified datapoint with a value.
     *
     * Behavior:
     * - Creates/extends the ioBroker object when it does not exist in the in-memory DB.
     * - Channels/Devices are created/updated but never written as states.
     * - For states, writes only when:
     *   - `val !== undefined` and
     *   - (`defaults.updateStateOnChangeOnly` is true) OR (old value differs) OR (`forceWrite` is true) OR (`!node.ack`)
     * - Values are converted to the target ioBroker common.type (if available).
     * - Skips write operations for disallowed directories (as per `isDirAllowed`).
     *
     * @param dp         Datapoint id (will be normalized via `cleandp`).
     * @param val        New value (channels/devices use `undefined` and will not be written).
     * @param obj        Object definition for creation/extension (Channel/Device/State); required if the node is new.
     * @param ack        Acknowledged flag for state write.
     * @param forceWrite Force write even if `val` equals old value.
     * @returns Promise<void>
     * @throws Error if a new state must be created but `obj` is missing.
     */
    async writedp(
        dp: string,
        val: ioBroker.StateValue | undefined,
        obj:
            | ioBroker.ChannelObject
            | ioBroker.DeviceObject
            | ioBroker.FolderObject
            | ioBroker.StateObject
            | null = null,
        ack: boolean = true,
        forceWrite: boolean = false,
    ): Promise<void> {
        // Normalize id and check DB
        dp = this.cleandp(dp);
        let node = this.readdb(dp);
        const disallowed = !this.isDirAllowed(dp);

        // Create/extend object if not known yet
        if (node === undefined) {
            if (!obj) {
                throw new Error('writedp: trying to create a state without object information.');
            }

            // Ensure full _id (adapter namespace)
            obj._id = `${this.adapter.name}.${this.adapter.instance}.${dp}`;

            // Translate name if string
            if (typeof obj.common.name === 'string') {
                obj.common.name = await this.getTranslationObj(obj.common.name);
            }

            // Persist object unless path is disallowed
            if (!disallowed) {
                // Preserve/merge `states` explicitly if provided
                if (obj.type === 'state' && obj.common.states) {
                    const existing = await this.adapter.getObjectAsync(dp);
                    if (existing) {
                        existing.common.states = obj.common.states;
                        await this.adapter.setObject(dp, existing);
                    }
                }
                await this.adapter.extendObject(dp, obj);
            }

            const stateType = obj.type !== 'state' ? undefined : obj?.common?.type;
            node = this.setdb(dp, obj.type, undefined, stateType, true, Date.now(), obj);
        } else if (node.init && obj) {
            // Object already known in DB but marked as init → extend/update once
            if (typeof obj.common.name === 'string') {
                obj.common.name = await this.getTranslationObj(obj.common.name);
            }

            if (!disallowed) {
                if (obj.type === 'state' && obj.common.states) {
                    const existing = await this.adapter.getObjectAsync(dp);
                    if (existing) {
                        existing.common.states = obj.common.states;
                        await this.adapter.setObject(dp, existing);
                    }
                }
                await this.adapter.extendObject(dp, obj);
                node.init = false;
            }
        }

        // If the object exists and is NOT a state → nothing to write
        if (obj && obj.type !== 'state') {
            return;
        }

        // Update in-memory DB value unless it is a state with undefined value
        if (node && !(node.type === 'state' && val === undefined)) {
            this.setdb(dp, node.type, val, node.stateTyp, false, undefined, undefined, node.init);
        }

        // Decide whether to write the state value
        if (
            node &&
            val !== undefined &&
            (this.defaults.updateStateOnChangeOnly || node.val != val || forceWrite || !node.ack)
        ) {
            // Convert to target type if necessary
            const targetType = obj?.common?.type ?? node.stateTyp;
            if (targetType && typeof val !== targetType) {
                val = this.convertToType(val, targetType as 'string' | 'number' | 'boolean' | 'array' | 'json');
            }

            if (!disallowed) {
                await this.adapter.setState(dp, {
                    val: val,
                    ts: Date.now(),
                    ack,
                });
            }
        }
    }

    setForbiddenDirs(dirs: any[]): void {
        this.forbiddenDirs = this.forbiddenDirs.concat(dirs);
    }

    isDirAllowed(dp: string): boolean {
        if (dp && dp.split('.').length <= 2) {
            return true;
        }
        for (const a of this.forbiddenDirs) {
            if (dp.search(new RegExp(a, 'g')) != -1) {
                return false;
            }
        }
        return true;
    }

    getStates(str: string): { [key: string]: LibraryStateVal } {
        const result: { [key: string]: LibraryStateVal } = {};
        for (const dp in this.stateDataBase) {
            if (dp.search(new RegExp(str, 'g')) != -1) {
                result[dp] = this.stateDataBase[dp];
            }
        }
        return result;
    }

    async cleanUpTree(hold: string[], filter: string[] | null, deep: number): Promise<void> {
        let del = [];
        for (const dp in this.stateDataBase) {
            if (filter && filter.filter(a => dp.startsWith(a) || a.startsWith(dp)).length == 0) {
                continue;
            }
            if (hold.filter(a => dp.startsWith(a) || a.startsWith(dp)).length > 0) {
                continue;
            }
            delete this.stateDataBase[dp];
            del.push(dp.split('.').slice(0, deep).join('.'));
        }
        del = del.filter((item, pos, arr) => {
            return arr.indexOf(item) == pos;
        });
        for (const a of del) {
            await this.adapter.delObjectAsync(a, { recursive: true });
            this.log.debug(`Clean up tree delete: ${a}`);
        }
    }

    /**
     * Remove forbidden chars from datapoint string.
     *
     * @param string Datapoint string to clean
     * @param lowerCase lowerCase() first param.
     * @param removePoints remove . from dp
     * @returns void
     */
    cleandp(string: string, lowerCase: boolean = false, removePoints: boolean = false): string {
        if (!string && typeof string != 'string') {
            return string;
        }

        string = string.replace(this.adapter.FORBIDDEN_CHARS, '_');
        // hardliner
        if (removePoints) {
            string = string.replace(/[^0-9A-Za-z_-]/gu, '_');
        } else {
            string = string.replace(/[^0-9A-Za-z._-]/gu, '_');
        }
        return lowerCase ? string.toLowerCase() : string;
    }

    /**
     * Convert an arbitrary value to the requested target type and return an ioBroker.StateValue.
     *
     * Rules:
     * - 'string': primitives -> String(value); arrays/objects -> JSON string.
     * - 'number': numbers stay; booleans -> 1/0; strings parsed with comma support ("1,23" -> 1.23); NaN -> 0.
     * - 'boolean': booleans stay; numbers -> value !== 0; strings -> common truthy/falsey keywords; otherwise Boolean(value).
     * - 'array' | 'json': always JSON string of the input.
     *
     * @param value Input value to convert (may be primitive, array, or object)
     * @param type  Target type: 'string' | 'number' | 'boolean' | 'array' | 'json'
     * @returns Converted value as ioBroker.StateValue (string | number | boolean | null)
     * @throws Error if `type` is 'undefined'
     */
    convertToType(
        value: ioBroker.StateValue | unknown[] | Record<string, unknown> | null,
        type: 'string' | 'number' | 'boolean' | 'array' | 'json' | 'undefined' | 'object' | 'mixed',
    ): ioBroker.StateValue {
        if (value === null) {
            return null;
        }
        if (type === 'undefined') {
            throw new Error('convertToType: type "undefined" not allowed');
        }
        if (value === undefined) {
            value = '';
        }
        if (type === 'mixed') {
            if (['string', 'number', 'boolean'].includes(typeof value)) {
                return value as ioBroker.StateValue;
            }
            type = Array.isArray(value) ? 'array' : 'json';
        }
        if (type === 'object') {
            type = 'json';
        }

        // Helper: stringify objects/arrays safely
        const toJsonString = (v: unknown): string => JSON.stringify(v);

        switch (type) {
            case 'string': {
                if (typeof value === 'string') {
                    return value;
                }
                if (typeof value === 'object') {
                    return toJsonString(value);
                }
                return String(value);
            }

            case 'number': {
                if (typeof value === 'number' && Number.isFinite(value)) {
                    return value;
                }
                if (typeof value === 'boolean') {
                    return value ? 1 : 0;
                }
                if (typeof value === 'string') {
                    const n = Number(value.trim().replace(',', '.'));
                    return Number.isFinite(n) ? n : 0;
                }
                // objects/arrays → cannot parse meaningfully → 0
                return 0;
            }

            case 'boolean': {
                if (typeof value === 'boolean') {
                    return value;
                }
                if (typeof value === 'number') {
                    return value !== 0;
                }
                if (typeof value === 'string') {
                    const s = value.trim().toLowerCase();
                    if (['true', '1', 'on', 'yes', 'y'].includes(s)) {
                        return true;
                    }
                    if (['false', '0', 'off', 'no', 'n', ''].includes(s)) {
                        return false;
                    }
                    return Boolean(s);
                }
                // objects/arrays → truthiness
                return Boolean(value);
            }
            case 'array':
            case 'json': {
                // Always return JSON string for array/json targets
                return toJsonString(value);
            }
        }
    }

    readdb(dp: string): LibraryStateVal {
        return this.stateDataBase[this.cleandp(dp)];
    }

    setdb(
        dp: string,
        type: ioBroker.ObjectType | LibraryStateVal,
        val: ioBroker.StateValue | undefined = undefined,
        stateType: string | undefined = undefined,
        ack: boolean = true,
        ts: number = Date.now(),
        obj: ioBroker.Object | undefined = undefined,
        init: boolean = false,
    ): LibraryStateVal {
        if (typeof type == 'object') {
            type = type as LibraryStateVal;
            this.stateDataBase[dp] = type;
        } else {
            type = type as ioBroker.ObjectType;
            this.stateDataBase[dp] = {
                type: type,
                stateTyp:
                    stateType !== undefined
                        ? stateType
                        : this.stateDataBase[dp] !== undefined && this.stateDataBase[dp].stateTyp !== undefined
                          ? this.stateDataBase[dp].stateTyp
                          : undefined,
                val: val,
                ack: ack,
                ts: ts ? ts : Date.now(),
                obj:
                    obj !== undefined
                        ? obj
                        : this.stateDataBase[dp] !== undefined && this.stateDataBase[dp].obj !== undefined
                          ? this.stateDataBase[dp].obj
                          : undefined,
                init: init,
            };
        }
        return this.stateDataBase[dp];
    }

    async memberDeleteAsync(data: any[]): Promise<void> {
        if (this.unknownTokensInterval) {
            this.adapter.clearInterval(this.unknownTokensInterval);
        }
        for (const d of data) {
            await d.delete();
        }
    }

    async fileExistAsync(file: string): Promise<boolean> {
        if (_fs.existsSync(`./admin/${file}`)) {
            return true;
        }
        return false;
    }

    /**
     * Initialise the database with the states to prevent unnecessary creation and writing.
     *
     * @param states States that are to be read into the database during initialisation.
     * @returns void
     */
    async initStates(states: { [key: string]: { val: ioBroker.StateValue; ts: number; ack: boolean } }): Promise<void> {
        if (!states) {
            return;
        }
        this.stateDataBase = {};
        const removedChannels: string[] = [];
        for (const state in states) {
            const dp = state.replace(`${this.adapter.name}.${this.adapter.instance}.`, '');
            const del = !this.isDirAllowed(dp);
            if (!del) {
                const obj = await this.adapter.getObjectAsync(dp);
                this.setdb(
                    dp,
                    'state',
                    states[state] ? states[state].val : undefined,
                    obj && obj.common && obj.common.type ? obj.common.type : undefined,
                    states[state] && states[state].ack,
                    states[state] && states[state].ts ? states[state].ts : Date.now(),
                    obj == null ? undefined : obj,
                    true,
                );
            } else {
                if (!removedChannels.every(a => !dp.startsWith(a))) {
                    continue;
                }
                const channel = dp.split('.').slice(0, 4).join('.');
                removedChannels.push(channel);
                await this.adapter.delObjectAsync(channel, { recursive: true });
                this.log.debug(`Delete channel with dp:${channel}`);
            }
        }
    }

    /**
     * Resets states that have not been updated in the database in offset time.
     *
     * @param prefix String with which states begin that are reset.
     * @param offset Time in ms since last update.
     * @param del Delete the state if it is not updated.
     * @returns void
     */
    async garbageColleting(prefix: string, offset: number = 2000, del = false): Promise<void> {
        if (!prefix) {
            return;
        }
        if (this.stateDataBase) {
            for (const id in this.stateDataBase) {
                if (id.startsWith(prefix)) {
                    const state = this.stateDataBase[id];
                    if (!state || state.val == undefined) {
                        continue;
                    }
                    if (state.ts < Date.now() - offset) {
                        if (del) {
                            await this.cleanUpTree([], [id], -1);
                            continue;
                        }
                        let newVal: -1 | '' | '{}' | '[]' | false | null | undefined;
                        switch (state.stateTyp) {
                            case 'string':
                                if (typeof state.val == 'string') {
                                    if (state.val.startsWith('{') && state.val.endsWith('}')) {
                                        newVal = '{}';
                                    } else if (state.val.startsWith('[') && state.val.endsWith(']')) {
                                        newVal = '[]';
                                    } else {
                                        newVal = '';
                                    }
                                } else {
                                    newVal = '';
                                }
                                break;
                            case 'bigint':
                            case 'number':
                                newVal = -1;
                                break;

                            case 'boolean':
                                newVal = false;
                                break;
                            case 'symbol':
                            case 'object':
                            case 'function':
                                newVal = null;
                                break;
                            case 'undefined':
                                newVal = undefined;
                                break;
                        }
                        await this.writedp(id, newVal);
                    }
                }
            }
        }
    }

    getLocalLanguage(): ioBroker.Languages {
        if (this.adapter.language) {
            return this.adapter.language;
        }
        return 'en';
    }
    getTranslation(key: string | null | undefined): string {
        if (!key) {
            return '';
        }
        if (this.translation.standard[key] !== undefined) {
            return this.translation.standard[key];
        }
        if (this.translation.custom[key] !== undefined) {
            return this.translation.custom[key];
        }
        if (this.adapter.config.logUnknownTokens) {
            this.unknownTokens[key] = '';
        }
        return key;
    }
    existTranslation(key: string): boolean {
        if (this.translation.standard[key] !== undefined) {
            return true;
        }
        if (this.translation.custom[key] !== undefined) {
            return true;
        }
        return false;
    }

    async getTranslationObj(key: string): Promise<ioBroker.StringOrTranslated> {
        const language: ioBroker.Languages[] = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'];
        const result: Partial<Record<ioBroker.Languages, string>> = {};
        for (const l of language) {
            try {
                const i = await import(`../../../admin/i18n/${l}/translations.json`);
                if (i[key] !== undefined) {
                    result[l] = i[key];
                }
            } catch {
                if (this.adapter.config.logUnknownTokens) {
                    this.unknownTokens[key] = '';
                }
                return key;
            }
        }
        if (result.en == undefined) {
            if (this.adapter.config.logUnknownTokens) {
                this.unknownTokens[key] = '';
            }
            return key;
        }
        return result as ioBroker.StringOrTranslated;
    }

    async checkLanguage(): Promise<void> {
        try {
            this.log.debug(`Load language ${this.adapter.language}`);
            this.translation.standard = await import(`../../../admin/i18n/${this.adapter.language}/translations.json`);
        } catch {
            this.log.warn(`Standard: Language ${this.adapter.language} not exist!`);
        }
        try {
            this.log.debug(`Load language ${this.adapter.language} from custom`);
            this.translation.custom = await import(`../../../admin/custom/i18n/${this.adapter.language}.json`);
        } catch {
            this.log.warn(`Custom: Language ${this.adapter.language} not exist!`);
        }
    }
    sortText(text: string[]): string[] {
        text.sort((a, b) => {
            const nameA = a.toUpperCase(); // ignore upper and lowercase
            const nameB = b.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }

            return 0;
        });
        return text;
    }
    /**
     *
     * @param text string to replace a Date
     * @param noti appendix to translation key
     * @param day true = Mo, 12.05 - false = 12.05
     * @returns Monday first March
     */
    convertSpeakDate(text: string, noti: string = '', day = false): string {
        if (!text || typeof text !== `string`) {
            return ``;
        }
        const b = text.split(`.`);
        if (day) {
            b[0] = b[0].split(' ')[2];
        }
        return ` ${`${new Date(`${b[1]}/${b[0]}/${new Date().getFullYear()}`).toLocaleString(this.getLocalLanguage(), {
            weekday: day ? 'long' : undefined,
            day: 'numeric',
            month: `long`,
        })} `.replace(/([0-9]+\.)/gu, x => {
            const result = this.getTranslation(x + noti);
            if (result != x + noti) {
                return result;
            }
            return this.getTranslation(x);
        })}`;
    }

    getLocalTranslation(group: keyof typeof LocalTranslations, key: string): string {
        try {
            if (group in LocalTranslations) {
                const result = LocalTranslations[group];
                if (key in result) {
                    return result[key as keyof typeof result]['de-DE'];
                }
            }
        } catch {
            // do nothing
            return key;
        }
        return key;
    }
}
