import * as Color from '../const/Color';
import { BaseClass } from './library';
import { BaseClassTriggerd, StatesControler } from '../controller/states-controller';
import * as NSPanel from '../types/types';

export class Dataitem extends BaseClass {
    options: NSPanel.DataItemsOptions;
    //private obj: ioBroker.Object | null | undefined;
    stateDB: StatesControler;
    type: ioBroker.CommonType | undefined = undefined;
    parent: BaseClassTriggerd;
    private _writeable: boolean = false;
    /**
     * Call isValidAndInit() after constructor and check return value - if false, this object is not configured correctly.
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
                this.setTypeFromValue(this.options.constVal);
                break;
            case 'state':
            case 'triggered':
                this.type = this.options.forceType ? this.options.forceType : undefined;
                // all work is done in isValidAndInit
                break;
            case 'internalState':
            case 'internal': {
                if (!this.options.dp.startsWith('///'))
                    this.options.dp = this.parent.panel.name + '/' + this.options.dp;
                this.type = undefined;
            }
        }
    }
    public get writeable(): boolean {
        return this._writeable;
    }
    /**
     * Init and check dp is valid
     * @returns if false value is not valid
     */
    async isValidAndInit(): Promise<boolean> {
        switch (this.options.type) {
            case 'const':
                return !(this.options.constVal === undefined || this.options.constVal === null);
            case 'state':
            case 'internal':
            case 'internalState':
            case 'triggered':
                if (!this.options.dp) return false;
                this.options.dp = this.options.dp.replace(
                    '${this.namespace}',
                    `${this.adapter.namespace}.panels.${this.parent.panel.name}`,
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
                if (this.options.type == 'triggered') this.stateDB.setTrigger(this.options.dp, this.parent);
                else if (this.options.type == 'internal') this.stateDB.setTrigger(this.options.dp, this.parent, true);
                else if (this.options.type == 'internalState')
                    this.stateDB.setTrigger(this.options.dp, this.parent, true, false);
                const value = await this.stateDB.getState(
                    this.options.dp,
                    this.options.type == 'triggered' ||
                        this.options.type == 'internal' ||
                        this.options.type == 'internalState'
                        ? 'medium'
                        : this.options.response,
                );
                return value !== null && value !== undefined;
        }
        return false;
    }
    private async getRawState(): Promise<NSPanel.State | null | undefined> {
        switch (this.options.type) {
            case 'const':
                return { val: this.options.constVal, ack: true, ts: Date.now(), lc: Date.now(), from: '' };
            case 'state':
            case 'triggered':
                if (!this.options.dp) {
                    throw new Error(`Error 1002 type is ${this.options.type} but dp is undefined`);
                }
                return await this.stateDB.getState(
                    this.options.dp,
                    this.options.type == 'triggered' ? 'medium' : this.options.response,
                );
            case 'internalState':
            case 'internal': {
                return await this.stateDB.getState(this.options.dp, 'now');
            }
        }
        return null;
    }

    trueType(): ioBroker.CommonType | undefined {
        return 'dp' in this.options ? this.stateDB.getType(this.options.dp) ?? this.type : this.type;
    }

    async getCommonStates(force: boolean = false): Promise<Record<string, string> | undefined> {
        return 'dp' in this.options ? this.stateDB.getCommonStates(this.options.dp, force) : undefined;
    }

    async getState(): Promise<NSPanel.State | null | undefined> {
        let state = await this.getRawState();
        if (state) {
            state = structuredClone(state);
            if (this.options.type !== 'const' && this.options.read) {
                try {
                    if (typeof this.options.read === 'string')
                        state.val = new Function('val', 'Color', `${this.options.read}`)(state.val, Color);
                    else state.val = this.options.read(state.val);
                    //this.log.debug(JSON.stringify(state.val));
                } catch (e) {
                    this.log.error(
                        `Read for dp: ${this.options.dp} is invalid! read: ${this.options.read} Error: ${e}`,
                    );
                }
            }
        }
        return state;
    }

    async getObject(): Promise<object | null> {
        const state = await this.getState();
        if (state && state.val) {
            if (typeof state.val === 'string') {
                try {
                    const value = JSON.parse(state.val);
                    return value;
                } catch (e) {
                    let value = state.val;
                    if (typeof value === 'string') {
                        value = value.trim();
                        if (value.startsWith('#')) {
                            const v = Color.ConvertWithColordtoRgb(value);
                            if (Color.isRGB(v)) return v;
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

    async getRGBValue(): Promise<Color.RGB | null> {
        const value = await this.getObject();
        if (value) {
            if (Color.isRGB(value)) return value;
            if (typeof value == 'object' && 'red' in value && 'blue' in value && 'green' in value) {
                return { r: value.red as number, g: value.green as number, b: value.blue as number };
            }
        }
        return null;
    }
    async getIconScale(): Promise<NSPanel.IconScaleElement | null> {
        const value = await this.getObject();
        if (value) {
            if (NSPanel.isIconScaleElement(value)) return value;
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
    async getTranslatedString(): Promise<string | null> {
        const val = await this.getString();
        if (val) {
            return await this.library.getTranslation(val);
        }
        return null;
    }

    async getString(): Promise<string | null> {
        const state = await this.getState();
        switch (this.options.type) {
            case 'const':
                return state && state.val !== null ? String(state.val) : null;
            case 'state':
            case 'triggered':
                if (this.options.substring) {
                    const args = this.options.substring;
                    return state && state.val !== null ? String(state.val).substring(args[0], args[1]) : null;
                }
                return state && state.val !== null ? String(state.val) : null;
            case 'internalState':
            case 'internal':
                return state && state.val !== null ? String(state.val) : null;
        }
        return null;
    }

    async getNumber(): Promise<number | null> {
        const result = await this.getState();
        if (
            result &&
            (typeof result.val === 'number' ||
                (typeof result.val === 'string' && result.val && !isNaN(parseInt(result.val))))
        ) {
            let val = parseFloat(String(result.val));
            if (this.options.scale !== undefined) {
                val = Math.trunc(Color.scale(val, this.options.scale.max, this.options.scale.min, 0, 100));
            }
            return val;
        }
        return null;
    }
    async getBoolean(): Promise<boolean | null> {
        const result = await this.getState();
        if (result && result.val !== null) {
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
            case 'symbol':
            case 'object':
            case 'function':
                this.type = 'object';
        }
    }
    async setStateTrue(): Promise<void> {
        await this.setStateAsync(true);
    }
    async setStateFalse(): Promise<void> {
        await this.setStateAsync(false);
    }
    /**
     * Flip this 'ON'/'OFF', 0/1 or true/false. Depend on this.type
     */
    async setStateFlip(): Promise<void> {
        const value = await this.getBoolean();
        this.log.debug(String(value));
        switch (this.trueType()) {
            case 'boolean':
                await this.setStateAsync(!value);
                break;
            case 'number':
                await this.setStateAsync(value ? 0 : 1);
                break;
            case 'string':
                await this.setStateAsync(value ? 'OFF' : 'ON');
                break;
        }
    }
    /**
     * Set a internal, const or external State
     * @param val number | boolean | string | null
     * @returns
     */
    async setStateAsync(val: ioBroker.StateValue): Promise<void> {
        if (val === undefined) return;
        if (this.options.type === 'const') {
            this.options.constVal = val;
        } else {
            if (this.options.write) val = new Function('val', 'Color', `${this.options.write}`)(val, Color);
            await this.stateDB.setStateAsync(this, val, this._writeable);
        }
    }
}

export function isDataItem(F: object | Dataitem): F is Dataitem {
    if (F instanceof Dataitem) return true;
    return false;
}
