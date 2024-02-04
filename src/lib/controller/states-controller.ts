// BaseClass extends

import { IClientPublishOptions } from 'mqtt';
import { Dataitem } from '../classes/data-item';
import { AdapterClassDefinition, BaseClass } from '../classes/library';
import { DataItemsOptions } from '../types/types';
import { Controller } from './panel-controller';
import { PanelSend } from './panel-message';
import { isPageRole } from '../types/pages';
import { Panel } from './panel';

export interface BaseClassTriggerdInterface {
    name: string;
    adapter: AdapterClassDefinition;
    panelSend: PanelSend;
    alwaysOn?: 'none' | 'always' | 'action';
    panel: Panel;
}
/**
 * Basisklasse für alles das auf Statestriggern soll - also jede card / popup
 * übernimmt auch die Sichtbarkeitssteuerung das triggern wird pausiert wenn nicht sichtbar
 * mit async onStateTrigger(): Promise<void> {} können abgeleitete Klassen auf Triggerereignisse reagieren
 */
export class BaseClassTriggerd extends BaseClass {
    private updateTimeout: ioBroker.Timeout | undefined;
    private waitForTimeout: ioBroker.Timeout | undefined;
    private doUpdate: boolean = true;
    protected minUpdateInterval: number;
    protected visibility: boolean = false;
    protected controller: Controller;
    readonly panelSend: PanelSend;
    public alwaysOn: 'none' | 'always' | 'action';
    private alwaysOnState: ioBroker.Timeout | undefined;
    private lastMessage: string = '';
    protected panel: Panel;

    protected sendToPanel: (payload: string, opt?: IClientPublishOptions) => void = (
        payload: string,
        opt?: IClientPublishOptions,
    ) => {
        if (payload == this.lastMessage) return;
        this.lastMessage = payload;

        this.sendToPanelClass(payload, opt);
    };
    resetLastMessage(): void {
        this.lastMessage = '';
    }
    private sendToPanelClass: (payload: string, opt?: IClientPublishOptions) => void = () => {};

    constructor(card: BaseClassTriggerdInterface) {
        super(card.adapter, card.name);
        this.minUpdateInterval = 15000;
        if (!this.adapter.controller) throw new Error('No controller! bye bye');
        this.controller = this.adapter.controller;
        this.panelSend = card.panelSend;
        this.alwaysOn = card.alwaysOn ?? 'none';
        this.panel = card.panel;
        if (typeof this.panelSend.addMessage === 'function') this.sendToPanelClass = card.panelSend.addMessage;
    }
    readonly onStateTriggerSuperDoNotOverride = async (response: 'now' | 'medium' | 'slow'): Promise<boolean> => {
        if (!this.visibility || this.unload) return false;
        if (this.waitForTimeout) return false;
        if (this.updateTimeout && response !== 'now') {
            this.doUpdate = true;
            return false;
        } else {
            this.waitForTimeout = this.adapter.setTimeout(() => {
                this.waitForTimeout = undefined;
                this.onStateTrigger();
                if (this.alwaysOnState) this.adapter.clearTimeout(this.alwaysOnState);
                if (this.alwaysOn === 'action') {
                    this.alwaysOnState = this.adapter.setTimeout(
                        () => {
                            this.panel.sendScreeensaverTimeout(this.panel.timeout);
                        },
                        this.panel.timeout * 1000 || 10000,
                    );
                }
            }, 50);
            this.updateTimeout = this.adapter.setTimeout(async () => {
                if (this.unload) return;
                this.updateTimeout = undefined;
                if (this.doUpdate) {
                    this.doUpdate = false;
                    await this.onStateTrigger();
                }
            }, this.minUpdateInterval);
            return true;
        }
    };
    protected async onStateTrigger(): Promise<void> {
        this.adapter.log.warn(
            `<- instance of [${Object.getPrototypeOf(this)}] is triggert but dont react or call super.onStateTrigger()`,
        );
    }
    getPayloadArray(s: (string | any)[]): string {
        return s.join('~');
    }
    getPayload(...s: string[]): string {
        return s.join('~');
    }
    private async stopTriggerTimeout(): Promise<void> {
        if (this.updateTimeout) {
            this.adapter.clearTimeout(this.updateTimeout);
            this.updateTimeout = undefined;
        }
    }
    async delete(): Promise<void> {
        await super.delete();
        await this.setVisibility(false);
        if (this.waitForTimeout) this.adapter.clearTimeout(this.waitForTimeout);
        if (this.alwaysOnState) this.adapter.clearTimeout(this.alwaysOnState);
        await this.stopTriggerTimeout();
    }
    getVisibility = (): boolean => {
        return this.visibility;
    };
    setVisibility = async (v: boolean, force: boolean = false): Promise<void> => {
        if (v !== this.visibility || force) {
            this.visibility = v;
            if (this.visibility) {
                if (this.alwaysOn != 'none') {
                    this.panel.sendScreeensaverTimeout(0);

                    if (this.alwaysOn === 'action') {
                        this.alwaysOnState = this.adapter.setTimeout(
                            () => {
                                this.panel.sendScreeensaverTimeout(this.panel.timeout);
                            },
                            this.panel.timeout * 2 * 1000 || 5000,
                        );
                    }
                } else this.panel.sendScreeensaverTimeout(this.panel.timeout);
                this.log.debug(`Switch page to visible${force ? ' (forced)' : ''}!`);
                this.resetLastMessage();
                this.controller && this.controller.statesControler.activateTrigger(this);
            } else {
                if (this.alwaysOnState) this.adapter.clearTimeout(this.alwaysOnState);
                this.panel.sendScreeensaverTimeout(this.panel.timeout);
                this.log.debug(`Switch page to invisible${force ? ' (forced)' : ''}!`);
                this.stopTriggerTimeout();
                this.controller && this.controller.statesControler.deactivateTrigger(this);
            }
            await this.onVisibilityChange(v);
        } else this.visibility = v;
    };
    /**
     * Event when visibility is on Change.
     */
    protected async onVisibilityChange(val: boolean): Promise<void> {
        val;
        this.adapter.log.warn(
            `<- instance of [${Object.getPrototypeOf(
                this,
            )}] not react on onVisibilityChange(), or call super.onVisibilityChange()`,
        );
    }
}

/**
 * Verwendet um Lesezugriffe auf die States umzusetzten, die im NSPanel ververwendet werden.
 * Adapter eigenen States sind verboten
 * Speichert Zugriff zwischen das kann mit timespan vereinflusst werden.
 */
export class StatesControler extends BaseClass {
    private triggerDB: {
        [key: string]: {
            state: ioBroker.State;
            to: BaseClassTriggerd[];
            ts: number;
            subscribed: boolean[];
            response: ('now' | 'medium' | 'slow')[];
        };
    } = {};
    private stateDB: { [key: string]: { state: ioBroker.State; ts: number } } = {};
    private tempObjectDB: { [key: string]: { [id: string]: ioBroker.Object } } | undefined = undefined;
    timespan: number;
    constructor(adapter: AdapterClassDefinition, name: string = '', timespan: number = 15000) {
        super(adapter, name || 'StatesDBReadOnly');
        this.timespan = timespan;
    }
    deletePage(p: BaseClassTriggerd): void {
        const removeId = [];
        for (const id in this.triggerDB) {
            const index = this.triggerDB[id].to.findIndex((a) => a == p);
            if (index !== -1) {
                const entry = this.triggerDB[id];
                for (const key in entry) {   
                    const k = key as keyof typeof entry;
                    const item = entry[k];
                    if (Array.isArray(item)) {
                        item.splice(index, 1);
                    }
                }
                this.triggerDB[id].to.splice(index, 1);
                this.triggerDB[id].subscribed.splice(index, 1);
                this.triggerDB[id].response.splice(index, 1);
                this.triggerDB[id].to.splice(index, 1);
            }
        }
    }
    /**
     * Set a subscript to a foreignState and write current state/value to db
     * @param id state id
     * @param from the page that handle the trigger
     */
    async setTrigger(id: string, from: BaseClassTriggerd, response: 'now' | 'medium' | 'slow' = 'slow'): Promise<void> {
        if (id.startsWith(this.adapter.namespace)) {
            this.log.warn(`Id: ${id} refers to the adapter's own namespace, this is not allowed!`);
            return;
            //throw new Error(`Id: ${id} refers to the adapter's own namespace, this is not allowed!`);
        }
        if (this.triggerDB[id] !== undefined) {
            const index = this.triggerDB[id].to.findIndex((a) => a == from);
            if (index === -1) {
                this.triggerDB[id].to.push(from);
                this.triggerDB[id].subscribed.push(false);
                this.triggerDB[id].response.push(response);
            } else {
                if (this.triggerDB[id].response[index] !== response) {
                    if (response === 'now') this.triggerDB[id].response[index] = 'now';
                }
            }
        } else {
            const state = await this.adapter.getForeignStateAsync(id);
            if (state) {
                // erstelle keinen trigger für das gleiche parent doppelt..
                await this.adapter.subscribeForeignStatesAsync(id);

                this.triggerDB[id] = {
                    state,
                    to: [from],
                    ts: Date.now(),
                    subscribed: [false],
                    response: [response],
                };
                if (this.stateDB[id] !== undefined) {
                    delete this.stateDB[id];
                }
            }
            this.log.debug(`Set a new trigger to ${id}`);
        }
    }

    /**
     * Activate the triggers of a page. First subscribes to the state.
     * @param to Page
     */
    async activateTrigger(to: BaseClassTriggerd): Promise<void> {
        for (const id in this.triggerDB) {
            const entry = this.triggerDB[id];
            const index = entry.to.indexOf(to);
            if (index === -1) continue;
            if (entry.subscribed[index]) continue;
            if (!entry.subscribed.some((a) => a)) {
                await this.adapter.subscribeForeignStatesAsync(id);
                const state = await this.adapter.getForeignStateAsync(id);
                if (state) {
                    entry.state = state;
                }
            }
            entry.subscribed[index] = true;
        }
    }

    /**
     * Deactivate the triggers of a page. Last unsubscribes to the state.
     * @param to Page
     */
    async deactivateTrigger(to: BaseClassTriggerd): Promise<void> {
        for (const id in this.triggerDB) {
            const entry = this.triggerDB[id];
            const index = entry.to.indexOf(to);
            if (index === -1) continue;
            if (!entry.subscribed[index]) continue;
            entry.subscribed[index] = false;
            if (!entry.subscribed.some((a) => a)) {
                await this.adapter.unsubscribeForeignStatesAsync(id);
            }
        }
    }
    /**
     * Read a state from DB or js-controller
     * @param id state id with namespace
     * @returns
     */
    async getState(
        id: string,
        response: 'now' | 'medium' | 'slow' = 'slow',
    ): Promise<ioBroker.State | null | undefined> {
        let timespan = this.timespan;
        if (response === 'medium') timespan = 3000;
        else if (response === 'now') timespan = 0;
        if (this.triggerDB[id] !== undefined && this.triggerDB[id].subscribed.some((a) => a)) {
            return this.triggerDB[id].state;
        } else if (this.stateDB[id] && timespan) {
            if (Date.now() - timespan - this.stateDB[id].ts < 0) {
                return this.stateDB[id].state;
            }
        }
        const state = await this.adapter.getForeignStateAsync(id);
        if (state) {
            this.stateDB[id] = { state: state, ts: Date.now() };
            return state;
        }
        throw new Error(`State id invalid ${id} no data!`);
    }
    async onStateChange(dp: string, state: ioBroker.State | null | undefined): Promise<void> {
        if (dp && state) {
            if (this.triggerDB[dp]) {
                if (this.triggerDB[dp].state) {
                    this.log.debug(`Trigger from ${dp} with state ${JSON.stringify(state)}`);
                    this.triggerDB[dp].ts = Date.now();
                    if (this.triggerDB[dp].state.val !== state.val || this.triggerDB[dp].state.ack !== state.ack) {
                        this.triggerDB[dp].state = state;
                        if (state.ack) {
                            this.triggerDB[dp].to.forEach(
                                (c, index) =>
                                    c.onStateTriggerSuperDoNotOverride &&
                                    c.onStateTriggerSuperDoNotOverride(this.triggerDB[dp].response[index]),
                            );
                        }
                    }
                }
            }
        }
    }
    async setStateAsync(item: Dataitem, val: ioBroker.StateValue, writeable: boolean): Promise<void> {
        if (item.options.type === 'state' || item.options.type === 'triggered') {
            if (item.options.dp) {
                const ack = item.options.dp.startsWith(this.adapter.namespace);
                this.log.debug(`setStateAsync(${item.options.dp}, ${val}, ${ack})`);
                if (item.trueType === 'number' && typeof val === 'string') val = parseFloat(val);
                else if (item.trueType === 'number' && typeof val === 'boolean') val = val ? 1 : 0;
                else if (item.trueType === 'boolean') val = !!val;
                if (item.trueType === 'string') val = String(val);
                this.updateDBState(item.options.dp, val, ack);
                if (writeable) await this.adapter.setForeignStateAsync(item.options.dp, val, ack);
                else this.log.error(`Forbidden write attempts on a read-only state! id: ${item.options.dp}`);
            }
        } else if (item.options.type === 'internal') {
            if (this.triggerDB[item.options.dp]) {
                if (this.setInternalState(item.options.dp, val))
                    await this.onStateChange(item.options.dp, this.triggerDB[item.options.dp].state);
            }
        }
    }
    private setInternalState(id: string, val: ioBroker.StateValue): boolean {
        if (this.triggerDB[id] !== undefined) {
            this.triggerDB[id].state = {
                ...this.triggerDB[id].state,
                val,
                ack: true,
                ts: Date.now(),
            };
            return true;
        }
        return false;
    }

    private updateDBState(id: string, val: ioBroker.StateValue, ack: boolean): void {
        if (this.triggerDB[id] !== undefined) {
            this.triggerDB[id].state.val = val;
            this.triggerDB[id].state.ack = ack;
        } else if (this.stateDB[id] !== undefined) {
            this.stateDB[id].state.val = val;
            this.stateDB[id].state.ack = ack;
        }
    }

    /**
     * Create dataitems from a json (deep)
     * @param data Json with configuration to create dataitems
     * @param parent Page etc.
     * @returns then json with values dataitem or undefined
     */
    async createDataItems(data: any, parent: any): Promise<any> {
        for (const i in data) {
            const d = data[i];
            if (d === undefined) continue;
            if (typeof d === 'object' && !('type' in d)) {
                data[i] = await this.createDataItems(d, parent);
            } else if (typeof d === 'object' && 'type' in d) {
                data[i] =
                    data[i] !== undefined
                        ? new Dataitem(this.adapter, { ...d, name: `${this.name}.${parent.name}.${i}` }, parent, this)
                        : undefined;
                if (data[i] !== undefined && !(await data[i].isValidAndInit())) {
                    data[i] = undefined;
                }
            }
        }
        return data;
    }

    async getDataItemsFromAuto(dpInit: string, data: any): Promise<any> {
        if (dpInit === '') return {};
        if (this.tempObjectDB === undefined) {
            this.tempObjectDB = {};
            this.adapter.setTimeout(() => {
                this.tempObjectDB = undefined;
            }, 300000);
        }
        for (const i in data) {
            const t = data[i];
            if (t === undefined) continue;
            if (typeof t === 'object' && !('type' in t)) {
                data[i] = await this.getDataItemsFromAuto(dpInit, t);
            } else if (typeof t === 'object' && 'type' in t) {
                const d = t as DataItemsOptions;
                let found = false;
                if ((d.type !== 'triggered' && d.type !== 'state') || !d.mode || d.mode !== 'auto') continue;
                for (const role of Array.isArray(d.role) ? d.role : [d.role]) {
                    if (!isPageRole(role)) {
                        throw new Error(`${d.dp} has a unkowned role ${d.role}`);
                    }
                    if (!this.tempObjectDB[dpInit]) {
                        this.tempObjectDB[dpInit] = await this.adapter.getForeignObjectsAsync(`${dpInit}.*`);
                    }
                    if (!this.tempObjectDB[dpInit]) {
                        this.log.warn(`Dont find states for ${dpInit}!`);
                    }

                    for (const id in this.tempObjectDB[dpInit]) {
                        const obj: ioBroker.Object = this.tempObjectDB[dpInit][id];
                        if (obj && obj.common && obj.type === 'state') {
                            if (obj.common.role === role) {
                                if (found) {
                                    this.log.warn(`Found more as 1 state for role ${role} in ${dpInit}`);
                                    break;
                                }
                                d.dp = id;
                                d.mode = 'done';
                                found = true;
                            }
                        }
                    }
                    if (found) break;
                }
                if (!found) {
                    data[i] = undefined;
                    this.log.warn(`No state found for role ${JSON.stringify(d.role)} in ${dpInit}`);
                }
            }
        }
        return data;
    }

    /**
     * what the name says
     * @param id
     * @returns
     */
    async existsState(id: string): Promise<boolean> {
        if (id.startsWith(this.adapter.namespace)) {
            return this.adapter.library.readdb(id.replace(this.adapter.namespace, '')) !== undefined;
        } else {
            return (await this.adapter.getForeignStateAsync(id)) !== undefined;
        }
    }
}
