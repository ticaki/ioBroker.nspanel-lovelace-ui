import { Color, type RGB } from '../const/Color';
import { BaseClass } from './library';
import type { StatesControler } from '../controller/states-controller';
import type { BaseClassTriggerd } from './baseClassPage';

import * as NSPanel from '../types/types';

export class Dataitem extends BaseClass {
    #compiledReadFn?: (
        val: unknown,
        Color: Color,
        language: string,
        lc: unknown,
        options: unknown,
    ) => NSPanel.StateValue;
    #compiledWriteFn?: (val: unknown, Color: Color) => ioBroker.StateValue;
    options: NSPanel.DataItemsOptions;
    //private obj: ioBroker.Object | null | undefined;
    stateDB: StatesControler;
    type: ioBroker.CommonType | undefined = undefined;
    parent: BaseClassTriggerd;
    common: Partial<ioBroker.StateCommon> = {};
    private _writeable: boolean = false;
    /**
     * Call isValidAndInit() after constructor and check return value - if false, this object is not configured correctly.
     *
     * @param adapter this of adapter
     * @param options {NSPanel.DataItemsOptions}
     * @param parent {BaseClassTriggerd}
     * @param db {StatesControler}
     */
    constructor(adapter: any, options: NSPanel.DataItemsOptions, parent: BaseClassTriggerd, db: StatesControler) {
        super(adapter, options.name || '');
        this.options = options;
        this.stateDB = db;
        this.parent = parent;
        switch (this.options.type) {
            case 'const':
                this.options.constVal = Color.getColorFromDefaultOrReturn(this.options.constVal);
                this.setTypeFromValue(this.options.constVal);
                break;
            case 'state':
            case 'triggered':
                this.type = this.options.forceType ? this.options.forceType : undefined;
                // all work is done in isValidAndInit
                break;
            case 'internalState':
            case 'internal': {
                if (!this.options.dp.startsWith('///')) {
                    this.options.dp = `${this.parent.basePanel.name}/${this.options.dp}`;
                }
                this.type = undefined;
            }
        }
    }
    public get writeable(): boolean {
        return this._writeable;
    }
    public set writeable(b: boolean) {
        this._writeable = b;
    }
    /**
     * Init and check dp is valid
     *
     * @returns if false value is not valid
     */
    async isValidAndInit(): Promise<boolean> {
        switch (this.options.type) {
            case 'const':
                return !(this.options.constVal === undefined || this.options.constVal === null);
            case 'state':
            case 'internal':
            case 'internalState':
            case 'triggered': {
                if (!this.options.dp) {
                    return false;
                }
                this.options.dp = this.options.dp.replace(
                    '${this.namespace}',
                    `${this.adapter.namespace}.panels.${this.parent.basePanel.name}`,
                );
                const obj = await this.stateDB.getObjectAsync(this.options.dp);
                if (!obj || obj.type != 'state' || !obj.common) {
                    this.log.warn(`801: ${this.options.dp} has a invalid state object!`);
                    return false;
                    //throw new Error(`801: ${this.options.dp} has no state object! Bye Bye`);
                }
                this.type = this.type || obj.common.type;
                this.options.role = obj.common.role;
                this._writeable = !!obj.common.write;
                this.common = obj.common;
                if (this.options.type == 'triggered') {
                    await this.stateDB.setTrigger(this.options.dp, this.parent, false, undefined, this.options.change);
                } else if (this.options.type == 'internal') {
                    await this.stateDB.setTrigger(this.options.dp, this.parent, true, undefined, this.options.change);
                } else if (this.options.type == 'internalState') {
                    await this.stateDB.setTrigger(this.options.dp, this.parent, true, false);
                }
                try {
                    await this.stateDB.getState(this.options.dp);
                    return true;
                } catch (e: any) {
                    this.log.error(`Error 1001: ${typeof e === 'string' ? e.replaceAll('Error: ', '') : e}`);
                    return false;
                }
            }
        }
        return false;
    }
    private async getRawState(): Promise<NSPanel.State | null> {
        try {
            switch (this.options.type) {
                case 'const':
                    return { val: this.options.constVal, ack: true, ts: Date.now(), lc: Date.now(), from: '' };
                case 'state':
                case 'triggered':
                    if (!this.options.dp) {
                        throw new Error(`Error 1002 type is ${this.options.type} but dp is undefined`);
                    }
                    return await this.stateDB.getState(this.options.dp);
                case 'internalState':
                case 'internal': {
                    return await this.stateDB.getState(this.options.dp);
                }
            }
        } catch (e: any) {
            this.log.error(`Error 1003: ${e.replaceAll('Error: ', '')}`);
        }
        return null;
    }

    trueType(): ioBroker.CommonType | undefined {
        return 'dp' in this.options ? (this.stateDB.getType(this.options.dp) ?? this.type) : this.type;
    }

    async getCommonStates(force: boolean = false): Promise<Record<string, string> | null> {
        return 'dp' in this.options ? this.stateDB.getCommonStates(this.options.dp, force) : null;
    }

    async getState(): Promise<NSPanel.State | null> {
        let state = await this.getRawState();
        if (state) {
            state = structuredClone(state);
            if (this.options.type !== 'const' && this.options.read) {
                try {
                    if (typeof this.options.read === 'string') {
                        // compile once and cache
                        if (!this.#compiledReadFn) {
                            this.#compiledReadFn = new Function(
                                'val',
                                'Color',
                                'language',
                                'lc',
                                'options',
                                this.options.read,
                            ) as any;
                        }
                        state.val = this.#compiledReadFn!(
                            state.val,
                            Color,
                            this.adapter.language ? this.adapter.language : 'en',
                            state.lc,
                            this.options.constants,
                        );
                    } else {
                        state.val = this.options.read(state.val);
                    }
                    //this.log.debug(JSON.stringify(state.val));
                } catch (e) {
                    this.log.error(
                        `Read for dp: ${this.options.dp} is invalid! read: ${String(this.options.read)} Error: ${String(e)}`,
                    );
                }
            }
        }
        return state;
    }

    async getObject(): Promise<object | null> {
        const state = await this.getState();
        if (state?.val != null) {
            if (typeof state.val === 'string') {
                try {
                    const value = JSON.parse(state.val);
                    return value;
                } catch {
                    let value = state.val;
                    if (typeof value === 'string') {
                        value = value.trim();
                        if (value.startsWith('#')) {
                            const v = Color.ConvertWithColordtoRgb(value);
                            if (Color.isRGB(v)) {
                                return v;
                            }
                        } else if (
                            this.options.role === 'level.color.name' ||
                            this.options.role === 'level.color.rgb'
                        ) {
                            return Color.ConvertWithColordtoRgb(value);
                        }
                    }
                }
            } else if (typeof state.val === 'object') {
                return state.val;
            } else if (typeof state.val === 'number') {
                return Color.decToRgb(state.val);
            }
        }
        return null;
    }
    async getRGBDec(): Promise<string | null> {
        const value = await this.getRGBValue();
        if (value) {
            return String(Color.rgb_dec565(value));
        }
        return null;
    }
    async getRGBValue(): Promise<RGB | null> {
        const value = await this.getObject();
        if (value) {
            if (Color.isRGB(value)) {
                return value;
            }
            if (typeof value == 'object' && 'red' in value && 'blue' in value && 'green' in value) {
                return { r: Number(value.red), g: Number(value.green), b: Number(value.blue) };
            }
        }
        return null;
    }
    async getIconScale(): Promise<NSPanel.IconScaleElement | null> {
        const value = await this.getObject();
        if (value) {
            if (NSPanel.isIconColorScaleElement(value)) {
                return value;
            }
        }
        return null;
    }

    async getTranslatedString(): Promise<string | null> {
        const val = await this.getString();
        if (val !== null) {
            return this.library.getTranslation(val);
        }
        return null;
    }

    /**
     * Returns the state's value as a string, or `null` if no meaningful value exists.
     *
     * Null semantics:
     * - Returns `null` when the underlying state is missing, or `state.val === null`.
     * - For `state` / `triggered` with `substring` set, returns `null` if `state` is missing
     *   or `state.val === null`. (No slicing is attempted in that case.)
     *
     * Notes:
     * - Any non-null value is coerced with `String(...)`.
     * - This method does NOT distinguish "state exists but empty string" — an empty string
     *   is a valid (non-null) return value.
     */
    async getString(): Promise<string | null> {
        const state = await this.getState();
        switch (this.options.type) {
            case 'const':
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                return state && state.val !== null ? String(state.val) : null;
            case 'state':
            case 'triggered':
                if (this.options.substring) {
                    const args = this.options.substring;
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    return state && state.val !== null ? String(state.val).substring(args[0], args[1]) : null;
                }
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                return state && state.val !== null ? String(state.val) : null;
            case 'internalState':
            case 'internal':
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                return state && state.val !== null ? String(state.val) : null;
        }
        return null;
    }

    /**
     * Returns the state's value as a number (scaled when configured), or `null` if not numeric.
     *
     * Null semantics:
     * - Returns `null` when the state is missing, or when `state.val` cannot be interpreted
     *   as a finite number (e.g., undefined, '', non-numeric text).
     *
     * Notes:
     * - Accepts numeric strings ("42", "3.14") and numbers.
     * - When `options.scale` is present, maps the raw value to 0..100 via Color.scale and truncates.
     * - Returns 0 as a valid number when the parsed value is zero; only non-parsable values yield `null`.
     */
    async getNumber(): Promise<number | null> {
        const result = await this.getState();
        if (
            result &&
            (typeof result.val === 'number' ||
                (typeof result.val === 'string' && result.val && !isNaN(Number(result.val))))
        ) {
            let val = parseFloat(String(result.val));
            if (this.options.scale !== undefined) {
                val = Math.trunc(Color.scale(val, this.options.scale.min, this.options.scale.max, 0, 100));
            }
            return val;
        }
        return null;
    }

    /**
     * Returns the state's value as a boolean, or `null` if the datapoint does not exist.
     *
     * Boolean mapping:
     * - String values "ok", "on", "yes", "true", "online" (case-insensitive) => true
     * - Any other present value uses JS truthiness via `!!state.val`
     *
     * Null vs false semantics:
     * - If `getState()` returns an object, a boolean is always produced (true/false).
     * - If `getState()` returns null:
     *   - If the referenced object exists and is of type "state" (via getObjectAsync), returns **false**
     *     (i.e., "state exists but currently has no value" -> treat as off/false).
     *   - If the object does not exist or is not a "state", returns **null**
     *     (i.e., "no such datapoint" -> unknown / not applicable).
     *
     * Use cases:
     * - `false` means the datapoint exists and evaluates to a falsy state.
     * - `null` means "cannot decide": the datapoint is missing or not a state.
     */
    async getBoolean(): Promise<boolean | null> {
        const result = await this.getState();
        if (result) {
            if (typeof result.val === 'string') {
                switch (result.val.toLowerCase()) {
                    case 'ok':
                    case 'on':
                    case 'yes':
                    case 'true':
                    case 'online':
                        return true;
                }
            }
            return !!result.val;
        }
        const o = this.options.dp && (await this.parent.basePanel.statesControler.getObjectAsync(this.options.dp));
        if (o && o.type === 'state') {
            return false;
        }
        return null;
    }

    private setTypeFromValue(val: NSPanel.StateValue | undefined): void {
        switch (typeof val) {
            case 'string':
                this.type = 'string';
                break;
            case 'number':
            case 'bigint':
                this.type = 'number';
                break;
            case 'boolean':
                this.type = 'boolean';
                break;
            case 'undefined':
                this.type = undefined;
                break;
            case 'symbol':
            case 'object':
            case 'function':
                this.type = 'object';
        }
    }
    async setStateTrue(): Promise<void> {
        await this.setState(true);
    }
    async setStateFalse(): Promise<void> {
        await this.setState(false);
    }
    /**
     * Flip this 'ON'/'OFF', 0/1 or true/false. Depend on this.type
     */
    async setStateFlip(): Promise<void> {
        const value = await this.getBoolean();
        this.log.debug(String(value));
        switch (this.type) {
            case 'boolean':
                await this.setState(!value);
                break;
            case 'number':
                await this.setState(value ? 0 : 1);
                break;
            case 'string':
                await this.setState(value ? 'OFF' : 'ON');
                break;
        }
    }
    /**
     * Set a internal, const or external State
     *
     * @param val number | boolean | string | null
     * @returns void
     */
    async setState(val: ioBroker.StateValue): Promise<void> {
        if (val === undefined) {
            return;
        }
        if (this.options.type === 'const') {
            this.options.constVal = val;
        } else {
            // in der Klasse

            // ... im passenden Codepfad:
            try {
                if (this.options.write) {
                    if (typeof this.options.write === 'string') {
                        // compile once and cache
                        if (!this.#compiledWriteFn) {
                            this.#compiledWriteFn = new Function('val', 'Color', this.options.write) as any;
                        }
                        val = this.#compiledWriteFn!(val, Color);
                    } else {
                        val = this.options.write(val);
                    }
                }
            } catch (e) {
                this.log.error(
                    `Write for dp: ${this.options.dp} is invalid! write: ${String(this.options.write)} Error: ${String(e)}`,
                );
            }

            await this.stateDB.setState(this, val, this._writeable);
        }
    }
}

export function isDataItem(F: any): F is Dataitem {
    if (F instanceof Dataitem) {
        return true;
    }
    return false;
}
