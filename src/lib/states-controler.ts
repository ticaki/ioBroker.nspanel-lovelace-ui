// BaseClass extends

import { AdapterClassDefinition, BaseClass } from './library';

export class BaseClassTriggerd extends BaseClass {
    protected updateTimeout: ioBroker.Timeout | undefined;
    protected doUpdate: boolean = true;
    protected minUpdateInterval: number;
    constructor(adapter: AdapterClassDefinition, name: string = '', minUpdateInterval: number = 15000) {
        super(adapter, name);
        this.minUpdateInterval = minUpdateInterval;
    }
    async onStateTrigger(): Promise<boolean> {
        if (this.updateTimeout) {
            this.doUpdate = true;
            return false;
        } else {
            this.updateTimeout = this.adapter.setTimeout(async () => {
                if (this.unload) return;
                this.updateTimeout = undefined;
                if (this.doUpdate) await this.onStateTrigger();
            }, this.minUpdateInterval);
            return true;
        }
    }
    async delete(): Promise<void> {
        if (this.updateTimeout) this.adapter.clearTimeout(this.updateTimeout);
    }
}

export class StatesDBReadOnly extends BaseClass {
    private triggerDB: { [key: string]: { state: ioBroker.State; to: BaseClassTriggerd[]; ts: number } } = {};
    private stateDB: { [key: string]: { state: ioBroker.State; ts: number } } = {};
    timespan: number;
    constructor(adapter: AdapterClassDefinition, name: string = '', timespan: number = 15000) {
        super(adapter, name);
        this.timespan = timespan;
    }
    async setTrigger(id: string, from: BaseClassTriggerd): Promise<void> {
        if (id.startsWith(this.adapter.namespace))
            throw new Error(`Id: ${id} links to own namespace of adapter, this is not allowed!`);
        if (this.triggerDB[id] !== undefined) {
            if (this.triggerDB[id].to.indexOf(from) == -1) this.triggerDB[id].to.push(from);
        } else {
            const state = await this.adapter.getForeignStateAsync(id);
            if (state) {
                await this.adapter.subscribeForeignStatesAsync(id);
                this.triggerDB[id] = {
                    state,
                    to: [from],
                    ts: Date.now(),
                };
            }
            this.log.debug(`Set to new trigger to ${id}`);
        }
    }

    async getValue(id: string): Promise<ioBroker.State | null | undefined> {
        if (this.triggerDB[id] !== undefined) {
            return this.triggerDB[id].state;
        } else if (this.stateDB[id]) {
            if (Date.now() - this.timespan - this.stateDB[id].ts < 0) {
                return this.stateDB[id].state;
            }
        }
        const state = await this.adapter.getForeignStateAsync(id);
        if (state) {
            this.stateDB[id].state = state;
            this.stateDB[id].ts = Date.now();
            return state;
        }
        throw new Error(`State id invalid ${id} no data!`);
    }
    async onStateChange(dp: string, state: ioBroker.State | null | undefined): Promise<void> {
        if (dp && state && state.ack) {
            if (this.triggerDB[dp]) {
                if (this.triggerDB[dp].state) {
                    this.log.debug(`Trigger from ${dp} with state ${JSON.stringify(state)}`);
                    this.triggerDB[dp].ts = Date.now();
                    if (this.triggerDB[dp].state.val !== state.val) {
                        this.triggerDB[dp].state = state;
                        this.triggerDB[dp].to.forEach((c) => c.onStateTrigger && c.onStateTrigger());
                    }
                }
            }
        }
    }
}
