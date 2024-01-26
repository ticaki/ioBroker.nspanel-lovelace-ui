import * as Color from '../const/color';
import { BaseClass } from './library';
import { BaseClassTriggerd, StatesDBReadOnly } from '../controller/states-controler';
import * as NSPanel from '../types/types';

export class Dataitem extends BaseClass {
    private options: NSPanel.DataItemsOptions;
    //private obj: ioBroker.Object | null | undefined;
    readOnlyDB: StatesDBReadOnly;
    type: ioBroker.CommonType | 'undefined' | undefined = undefined;
    parent: BaseClassTriggerd;
    /**
     * Call isValidAndInit() after constructor and check return value - if false, this object is not configured correctly.
     * @param adapter this of adapter
     * @param options {NSPanel.DataItemsOptions}
     * @param parent {BaseClassTriggerd}
     * @param db {StatesDBReadOnly}
     */
    constructor(adapter: any, options: NSPanel.DataItemsOptions, parent: BaseClassTriggerd, db: StatesDBReadOnly) {
        super(adapter, options.name || '');
        this.options = options;
        this.options.type = options.type;
        this.readOnlyDB = db;
        this.parent = parent;
        switch (this.options.type) {
            case 'const':
                /*if (!this.options.constVal) {
                    this.log.error(`Error 1001 in constructor val == '' not allow in type const!`);
                }*/
                this.setTypeFromValue(this.options.constVal);
                this.options.value = {
                    val: this.options.constVal,
                    ack: true,
                    ts: Date.now(),
                    lc: Date.now(),
                    from: '',
                };
                break;
            case 'state':
            case 'triggered':
                this.type = this.options.forceType ? this.options.forceType : undefined;
                // all work is done in isValidAndInit
                break;
        }
    }

    /**
     * Init and check dp is valid
     * @returns if false value is not valid
     */
    async isValidAndInit(): Promise<boolean> {
        switch (this.options.type) {
            case 'const':
                return this.options.constVal !== undefined;
            case 'state':
            case 'triggered':
                if (this.options.dp === undefined) return false;
                const obj = await this.adapter.getForeignObjectAsync(this.options.dp);
                if (!obj || obj.type != 'state' || !obj.common) {
                    this.log.warn(`801: ${this.options.dp} has a invalid state object!`);
                    return false;
                    //throw new Error(`801: ${this.options.dp} has no state object! Bye Bye`);
                }
                this.type = this.type || obj.common.type;
                this.options.role = obj.common.role;
                if (this.options.type == 'triggered') this.readOnlyDB.setTrigger(this.options.dp, this.parent);
                const value = await this.readOnlyDB.getState(this.options.dp);
                return !!value;
        }
        return false;
    }
    private async getRawState(): Promise<NSPanel.State | null | undefined> {
        switch (this.options.type) {
            case 'const':
                return this.options.value;
            case 'state':
            case 'triggered':
                if (!this.options.dp) {
                    throw new Error(`Error 1002 type is ${this.options.type} but dp is undefined`);
                }
                return await this.readOnlyDB.getState(this.options.dp);
            case 'internal': {
            }
        }
        return null;
    }
    async getState(): Promise<NSPanel.State | null | undefined> {
        const value = await this.getRawState();
        if (value && this.options.type !== 'const' && this.options.type !== 'internal' && this.options.read) {
            try {
                if (typeof this.options.read === 'string')
                    value.val = new Function('val', `return ${this.options.read}`)(value.val);
                else value.val = this.options.read(value.val);
            } catch (e) {
                this.log.error(`Read is invalid: ${this.options.read} Error: ${e}`);
            }
        }
        return value;
    }

    async getObject(): Promise<object | null> {
        const state = await this.getState();
        if (state && state.val) {
            if (typeof state.val === 'string') {
                try {
                    const value = JSON.parse(state.val);
                    return value;
                } catch (e) {
                    this.log.warn('Read a incorrect json!');
                }
            } else if (typeof state.val === 'object') {
                return state.val;
            }
        }
        return null;
    }

    async getRGBValue(): Promise<NSPanel.RGB | null> {
        const value = await this.getObject();
        if (value) {
            if (NSPanel.isRGB(value)) return value;
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
        }
        return null;
    }

    async getNumber(): Promise<number | null> {
        const result = await this.getState();
        if (result && !isNaN(parseInt(String(result.val)))) {
            return parseFloat(result.val as string);
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
                this.type = 'undefined';
            case 'symbol':
            case 'object':
            case 'function':
                this.type = 'object';
        }
    }
}
