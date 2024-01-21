import * as Color from './color';
import { BaseClass } from './library';
import * as NSPanel from './types';

export class Dataitem extends BaseClass {
    private options: NSPanel.DataItemsOptions;
    private obj: ioBroker.Object | null | undefined;

    type: ioBroker.StateValue | undefined = undefined;
    get: any;
    /**
     * Call isValidAndInit() after constructor and check return value - if false, this object is not configured correctly.
     * @param adapter this of adapter
     * @param options {DataItemsOptions}
     * @param val must be valid for type 'const'
     */
    constructor(adapter: any, options: NSPanel.DataItemsOptions) {
        super(adapter, options.name);
        this.options = options;
        this.options.type = options.type;
        switch (this.options.type) {
            case 'const':
                if (!this.options.constVal) {
                    this.log.error(`Error in constructor val == '' not allow in type const!`);
                }
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
                this.options.timespan = this.options.timespan ? this.options.timespan : 60000;
                // all work is done in isValidAndInit
                break;
            case 'triggered':
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
                this.type = this.obj.common.type;
                this.options.role = this.obj.common.role || '';
                this.options.value = await this.adapter.getForeignStateAsync(this.options.dp);
                if (this.options.type == 'state') return !!this.options.value;
                this.adapter.subscribeForeignStatesAsync(this.options.dp);
            // TODO: this.options.type == 'triggered' left - set current value to global db
        }
        return false;
    }
    async getRawValue(): Promise<ioBroker.State | null | undefined> {
        switch (this.options.type) {
            case 'const':
                return this.options.value;
            case 'state':
                if (
                    this.options.timespan == null ||
                    (this.options.value && Date.now() - this.options.value.ts + this.options.timespan > 0)
                ) {
                    if (this.options.dp === undefined) return this.options.value;
                    this.options.value = await this.adapter.getForeignStateAsync(this.options.dp);
                    if (this.options.value) this.options.value.ts = Date.now();
                }
                return this.options.value;
            case 'triggered':
                // TODO get Value from global db
                return this.options.value;
        }
    }
    async getRGBValue(): Promise<NSPanel.RGB | null> {
        let value = await this.getString();
        if (value !== null && typeof value === 'string') {
            try {
                value = JSON.parse(value);
                if (NSPanel.isRGB(value)) return value;
            } catch (e) {
                this.log.warn('incorrect json!');
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
        if (result && !isNaN(parseInt(result.val as string))) {
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

    private setTypeFromValue(val: ioBroker.StateValue | undefined): void {
        switch (typeof val) {
            case 'string':
                this.type = 'string';
                break;
            case 'number':
            case 'bigint':
                this.type = 'number';
                break;
            case 'boolean':
            case 'symbol':
            case 'undefined':
            case 'object':
            case 'function':
                this.type = typeof val;
        }
    }
}
