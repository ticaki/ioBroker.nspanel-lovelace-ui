import * as Color from '../const/color';
import { BaseClass } from './library';
import { BaseClassTriggerd, StatesDBReadOnly } from '../controller/states-controler';
import * as NSPanel from '../types/types';

export class Dataitem extends BaseClass {
    private options: NSPanel.DataItemsOptions;
    private obj: ioBroker.Object | null | undefined;
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
                this.type = this.options.valType ? this.options.valType : undefined;
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
                this.obj = await this.adapter.getForeignObjectAsync(this.options.dp);
                if (!this.obj || this.obj.type != 'state' || !this.obj.common) {
                    throw new Error(`801: ${this.options.dp} has no state object! Bye Bye`);
                }
                this.type = this.type || this.obj.common.type;
                this.options.role = this.obj.common.role;
                const value = await this.readOnlyDB.getValue(this.options.dp);
                if (this.options.type == 'state') return !!value;
                this.readOnlyDB.setTrigger(this.options.dp, this.parent);
                return !!value;
        }
        return false;
    }
    async getRawValue(): Promise<NSPanel.State | null | undefined> {
        switch (this.options.type) {
            case 'const':
                return this.options.value;
            case 'state':
            case 'triggered':
                if (this.options.dp === undefined)
                    throw new Error(`Error 1002 type is ${this.options.type} but dp is undefined`);
                return await this.readOnlyDB.getValue(this.options.dp);
        }
        return null;
    }

    async getObject(): Promise<object | null> {
        const state = await this.getRawValue();
        if (state && state.val) {
            if (typeof state.val === 'string') {
                try {
                    const value = JSON.parse(state.val);
                    return value;
                } catch (e) {
                    this.log.warn('incorrect json!');
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
        const state = await this.getRawValue();
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
    }

    async getNumber(): Promise<number | null> {
        const result = await this.getRawValue();
        if (result && !isNaN(parseInt(String(result.val)))) {
            return parseInt(result.val as string);
        }
        return null;
    }
    async getBoolean(): Promise<boolean | null> {
        const result = await this.getRawValue();
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
