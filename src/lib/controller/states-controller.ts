// BaseClass extends

import { IClientPublishOptions } from 'mqtt';
import { PageInterface } from '../classes/Page';
import { Dataitem } from '../classes/data-item';
import { AdapterClassDefinition, BaseClass } from '../classes/library';
import { PageItem } from '../pages/pageItem';
import { PageItemDataItemsOptions } from '../types/type-pageItem';
import { DataItemsOptions } from '../types/types';
import { Controller } from './controller';
import { Panel } from './panel';
import { PanelSend } from './panel-message';
import { genericStateObjects } from '../const/definition';

export interface BaseClassTriggerdInterface {
    name: string;
    adapter: AdapterClassDefinition;
    panelSend: PanelSend;
    alwaysOn?: 'none' | 'always' | 'action';
    panel: Panel;
    dpInit?: string;
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
    public panel: Panel;
    private responseTime: number = 10000000000;
    neverDeactivateTrigger: boolean = false;
    sleep: boolean = true;
    parent: BaseClassTriggerd | undefined = undefined;
    triggerParent: boolean = false;
    dpInit: string = '';
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
        this.minUpdateInterval = 500;
        if (!this.adapter.controller) throw new Error('No controller! bye bye');
        this.controller = this.adapter.controller;
        this.panelSend = card.panelSend;
        this.alwaysOn = card.alwaysOn ?? 'none';
        this.panel = card.panel;

        if (typeof this.panelSend.addMessage === 'function') this.sendToPanelClass = card.panelSend.addMessage;
    }
    readonly onStateTriggerSuperDoNotOverride = async (from: BaseClassTriggerd): Promise<boolean> => {
        if ((!this.visibility && !this.neverDeactivateTrigger) || this.unload) return false;
        if (this.sleep && !this.neverDeactivateTrigger) return false;
        if (this.waitForTimeout) return false;
        if (this.updateTimeout) {
            this.doUpdate = true;
            return false;
        } else {
            this.waitForTimeout = this.adapter.setTimeout(() => {
                this.waitForTimeout = undefined;
                this.onStateTrigger(from);
                if (this.alwaysOnState) this.adapter.clearTimeout(this.alwaysOnState);
                if (this.alwaysOn === 'action') {
                    this.alwaysOnState = this.adapter.setTimeout(
                        () => {
                            this.panel.sendScreeensaverTimeout(this.panel.timeout);
                        },
                        this.panel.timeout * 1000 || 5000,
                    );
                }
            }, 10);
            this.updateTimeout = this.adapter.setTimeout(async () => {
                if (this.unload) return;
                this.updateTimeout = undefined;
                if (this.doUpdate) {
                    this.doUpdate = false;
                    await this.onStateTrigger(from);
                }
            }, this.minUpdateInterval);
            return true;
        }
    };
    protected async onStateTrigger(_from: BaseClassTriggerd): Promise<void> {
        this.adapter.log.warn(
            `<- instance of [${Object.getPrototypeOf(this)}] is triggert but dont react or call super.onStateTrigger()`,
        );
    }

    private async stopTriggerTimeout(): Promise<void> {
        if (this.updateTimeout) {
            this.adapter.clearTimeout(this.updateTimeout);
            this.updateTimeout = undefined;
        }
    }
    async delete(): Promise<void> {
        await this.setVisibility(false);
        this.parent = undefined;
        await super.delete();
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
                if (this.unload) return;

                if (this.alwaysOn != 'none') {
                    if (this.alwaysOn === 'action') {
                        this.alwaysOnState = this.adapter.setTimeout(
                            async () => {
                                await this.panel.sendScreeensaverTimeout(this.panel.timeout);
                            },
                            this.panel.timeout * 2 * 1000 || 5000,
                        );
                    } else {
                        await this.panel.sendScreeensaverTimeout(0);
                    }
                } else this.panel.sendScreeensaverTimeout(this.panel.timeout);
                this.log.debug(`Switch page to visible${force ? ' (forced)' : ''}!`);
                this.resetLastMessage();
                this.controller && (await this.controller.statesControler.activateTrigger(this));

                this.panel.info.nspanel.currentPage = this.name;
                this.library.writedp(
                    `panels.${this.panel.name}.info.nspanel.currentPage`,
                    this.name,
                    genericStateObjects.panel.panels.info.nspanel.currentPage,
                );
            } else {
                if (this.alwaysOnState) this.adapter.clearTimeout(this.alwaysOnState);
                await this.panel.sendScreeensaverTimeout(this.panel.timeout);
                this.log.debug(`Switch page to invisible${force ? ' (forced)' : ''}!`);
                if (!this.neverDeactivateTrigger) {
                    this.stopTriggerTimeout();
                    this.controller && (await this.controller.statesControler.deactivateTrigger(this));
                }
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

export class BaseClassPage extends BaseClassTriggerd {
    readonly pageItemConfig: (PageItemDataItemsOptions | undefined)[] | undefined;
    pageItems: (PageItem | undefined)[] | undefined;
    constructor(card: PageInterface, pageItemsConfig: (PageItemDataItemsOptions | undefined)[] | undefined) {
        super(card);
        this.pageItemConfig = pageItemsConfig;
    }
}
type getInternalFunctionType = (id: string, state: ioBroker.State | undefined) => Promise<ioBroker.StateValue>;
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
            common: ioBroker.StateCommon;
            internal?: boolean;
            f?: getInternalFunctionType;
        };
    } = {};
    private deletePageInterval: ioBroker.Interval | undefined;
    private stateDB: { [key: string]: { state: ioBroker.State; ts: number; common: ioBroker.StateCommon } } = {};
    objectDatabase: Record<string, ioBroker.Object | null> = {};
    intervalObjectDatabase: ioBroker.Interval | undefined;

    timespan: number;

    constructor(adapter: AdapterClassDefinition, name: string = '', timespan: number = 15000) {
        super(adapter, name || 'StatesDBReadOnly');
        this.timespan = timespan;
        this.deletePageInterval = this.adapter.setInterval(this.deletePageLoop, 60000);
        this.intervalObjectDatabase = this.adapter.setInterval(() => {
            if (this.unload) return;
            this.intervalObjectDatabase = undefined;
            this.objectDatabase = {};
        }, 1800000);
    }
    private deletePageLoop = (): void => {
        const removeId = [];
        for (const id in this.triggerDB) {
            const entry = this.triggerDB[id];
            const removeIndex = [];
            for (const i in entry.to) {
                if (entry.to[i].unload) removeIndex.push(Number(i));
            }
            for (const i of removeIndex) {
                for (const key in entry) {
                    const k = key as keyof typeof entry;
                    const item = entry[k];
                    if (Array.isArray(item)) {
                        item.splice(i, 1);
                    }
                }
            }
            if (entry.to.length === 0) removeId.push(id);
        }

        for (const id of removeId) {
            delete this.triggerDB[id];
        }
    };

    async delete(): Promise<void> {
        await super.delete();
        if (this.intervalObjectDatabase) this.adapter.clearInterval(this.intervalObjectDatabase);
        if (StatesControler.tempObjectDBTimeout) this.adapter.clearTimeout(StatesControler.tempObjectDBTimeout);
        if (this.deletePageInterval) this.adapter.clearInterval(this.deletePageInterval);
    }
    /**
     * Set a subscript to a foreignState and write current state/value to db
     * @param id state id
     * @param from the page that handle the trigger
     */
    async setTrigger(id: string, from: BaseClassTriggerd, internal: boolean = false): Promise<void> {
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
            } else {
            }
        } else if (internal) {
            this.log.error('setInternal Trigger too early');
        } else {
            const state = await this.adapter.getForeignStateAsync(id);
            if (state) {
                // erstelle keinen trigger für das gleiche parent doppelt..
                await this.adapter.subscribeForeignStatesAsync(id);
                const obj = await this.getObjectAsync(id);
                if (!obj || !obj.common || obj.type !== 'state') throw new Error('Got invalid object for ' + id);
                this.triggerDB[id] = {
                    state,
                    to: [from],
                    ts: Date.now(),
                    subscribed: [false],
                    common: obj.common,
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
    async activateTrigger(to: BaseClassTriggerd | undefined): Promise<void> {
        if (!to) return;
        for (const id in this.triggerDB) {
            const entry = this.triggerDB[id];
            if (entry.internal) continue;
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
            if (entry.internal) continue;
            const index = entry.to.indexOf(to);
            if (index === -1) continue;
            if (!entry.subscribed[index]) continue;
            entry.subscribed[index] = false;
            if (!entry.subscribed.some((a) => a)) {
                await this.adapter.unsubscribeForeignStatesAsync(id);
            }
        }
    }

    async getStateVal(id: string): Promise<ioBroker.StateValue | null> {
        const state = await this.getState(id, 'now');
        if (state) {
            return state.val ?? null;
        }
        return null;
    }
    /**
     * Read a state from DB or js-controller
     * @param id state id with namespace
     * @returns
     */
    async getState(
        id: string,
        response: 'now' | 'medium' | 'slow' = 'medium',
        internal: boolean = false,
    ): Promise<ioBroker.State | null | undefined> {
        let timespan = this.timespan;
        if (response === 'slow') timespan = 10000;
        else if (response === 'now') timespan = 10;
        else timespan = 1000;
        if (
            this.triggerDB[id] !== undefined &&
            (this.triggerDB[id].internal || this.triggerDB[id].subscribed.some((a) => a))
        ) {
            let state: ioBroker.State | null = null;
            const f = this.triggerDB[id].f;
            if (f) {
                state = {
                    ...this.triggerDB[id].state,
                    val: await f(id, undefined),
                };
            } else {
                state = this.triggerDB[id].state;
            }
            return state;
        } else if (this.stateDB[id] && timespan) {
            if (Date.now() - timespan - this.stateDB[id].ts < 0) {
                return this.stateDB[id].state;
            }
        }
        if (id.includes('/')) internal = true;
        if (!internal) {
            const state = await this.adapter.getForeignStateAsync(id);
            if (state) {
                if (!this.stateDB[id]) {
                    const obj = await this.getObjectAsync(id);
                    if (!obj || !obj.common || obj.type !== 'state') throw new Error('Got invalid object for ' + id);
                    this.stateDB[id] = { state: state, ts: Date.now(), common: obj.common };
                } else {
                    this.stateDB[id].state = state;
                    this.stateDB[id].ts = Date.now();
                }
                return state;
            }
        }
        throw new Error(`State id invalid ${id} no data!`);
    }

    getType(id: string): ioBroker.CommonType | undefined {
        if (this.triggerDB[id] !== undefined && this.triggerDB[id].common) return this.triggerDB[id].common!.type;
        if (this.stateDB[id] !== undefined) return this.stateDB[id].common.type;
        return undefined;
    }

    getCommonStates(id: string): Record<string, string> | undefined {
        let j: string | string[] | Record<string, string> | undefined = undefined;
        if (this.triggerDB[id] !== undefined && this.triggerDB[id].common) j = this.triggerDB[id].common!.states;
        else if (this.stateDB[id] !== undefined) j = this.stateDB[id].common.states;
        if (!j || typeof j === 'string') return undefined;
        if (Array.isArray(j)) {
            const a: Record<string, string> = {};
            j.forEach((e, i) => (a[String(i)] = e));
            j = a;
        }
        return j;
    }

    async onStateChange(dp: string, state: ioBroker.State | null | undefined): Promise<void> {
        if (dp && state) {
            if (this.triggerDB[dp]) {
                if (this.triggerDB[dp].state) {
                    this.log.debug(`Trigger from ${dp} with state ${JSON.stringify(state)}`);
                    this.triggerDB[dp].ts = Date.now();
                    if (this.triggerDB[dp].state.val !== state.val || this.triggerDB[dp].state.ack !== state.ack) {
                        this.triggerDB[dp].state = state;
                        if (state.ack || dp.startsWith('0_userdata.0')) {
                            this.triggerDB[dp].to.forEach((c) => {
                                if (c.parent && c.triggerParent && !c.parent.unload && !c.parent.sleep) {
                                    c.parent.onStateTriggerSuperDoNotOverride &&
                                        c.parent.onStateTriggerSuperDoNotOverride(c);
                                } else if (!c.unload) {
                                    c.onStateTriggerSuperDoNotOverride && c.onStateTriggerSuperDoNotOverride(c);
                                }
                            });
                        }
                    }
                }
            }
            if (dp.startsWith(this.adapter.namespace)) {
                const id = dp.replace(this.adapter.namespace + '.', '');
                const libState = this.library.readdb(id);
                if (libState) {
                    this.library.setdb(id, { ...libState, val: state.val, ts: state.ts, ack: state.ack });
                }

                if (
                    libState &&
                    libState.obj &&
                    libState.obj.common &&
                    libState.obj.common.write &&
                    this.adapter.controller
                ) {
                    for (const panel of this.adapter.controller.panels) {
                        await panel.onStateChange(id, state);
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
                if (item.trueType() === 'number' && typeof val === 'string') val = parseFloat(val);
                else if (item.trueType() === 'number' && typeof val === 'boolean') val = val ? 1 : 0;
                else if (item.trueType() === 'boolean') val = !!val;
                if (item.trueType() === 'string') val = String(val);
                //this.updateDBState(item.options.dp, val, ack);
                if (writeable) await this.adapter.setForeignStateAsync(item.options.dp, val, ack);
                else this.log.error(`Forbidden write attempts on a read-only state! id: ${item.options.dp}`);
            }
        } else if (item.options.type === 'internal') {
            if (this.triggerDB[item.options.dp]) {
                this.setInternalState(item.options.dp, val, false);
            }
        }
    }
    public async setInternalState(
        id: string,
        val: ioBroker.StateValue,
        ack: boolean = false,
        common: ioBroker.StateCommon | undefined = undefined,
        func: getInternalFunctionType | undefined = undefined,
    ): Promise<boolean> {
        if (this.triggerDB[id] !== undefined) {
            const f = this.triggerDB[id].f;
            if (ack) {
                await this.onStateChange(id, {
                    ...this.triggerDB[id].state,
                    val: f ? await f(id, undefined) : val,
                    ack: ack,
                    ts: Date.now(),
                });
            } else {
                if (f)
                    f(id, {
                        ...this.triggerDB[id].state,
                        val: val,
                        ack: ack,
                        ts: Date.now(),
                    });

                this.triggerDB[id].state = {
                    ...this.triggerDB[id].state,
                    val,
                    ack: ack,
                    ts: Date.now(),
                };
            }
            return true;
        } else if (common) {
            this.log.warn(`No warning, just info. add internal state ${id} with ${JSON.stringify(common)}`);
            this.triggerDB[id] = {
                state: { ts: Date.now(), val: null, ack: ack, from: '', lc: Date.now() },
                to: [],
                ts: Date.now(),
                subscribed: [],
                common: common,
                internal: true,
                f: func,
            };
        }
        return false;
    }

    /**
     * Create dataitems from a json (deep)
     * @param data Json with configuration to create dataitems
     * @param parent Page etc.
     * @returns then json with values dataitem or undefined
     */
    async createDataItems(data: any, parent: any, target: any = {}): Promise<any> {
        for (const i in data) {
            const d = data[i];
            if (d === undefined) continue;
            if (typeof d === 'object' && !('type' in d)) {
                target[i] = await this.createDataItems(d, parent, target[i] ?? Array.isArray(d) ? [] : {});
            } else if (typeof d === 'object' && 'type' in d) {
                target[i] =
                    data[i] !== undefined
                        ? new Dataitem(this.adapter, { ...d, name: `${this.name}.${parent.name}.${i}` }, parent, this)
                        : undefined;
                if (target[i] !== undefined && !(await target[i].isValidAndInit())) {
                    target[i] = undefined;
                }
            }
        }
        return target;
    }

    static TempObjectDB: { data: Record<string, ioBroker.Object>; ids: Record<string, boolean> } = {
        data: {},
        ids: {},
    };
    static tempObjectDBTimeout: ioBroker.Timeout | undefined;
    static getTempObjectDB(adapter: AdapterClassDefinition): typeof StatesControler.TempObjectDB {
        if (StatesControler.tempObjectDBTimeout) adapter.clearTimeout(StatesControler.tempObjectDBTimeout);

        StatesControler.tempObjectDBTimeout = adapter.setTimeout(() => {
            if (adapter.unload) return;
            StatesControler.tempObjectDBTimeout = undefined;
            StatesControler.TempObjectDB = { data: {}, ids: {} };
        }, 60000);

        return StatesControler.TempObjectDB;
    }

    async getDataItemsFromAuto(dpInit: string, data: any): Promise<any> {
        if (dpInit === '') return data;
        const tempObjectDB = StatesControler.getTempObjectDB(this.adapter);
        for (const i in data) {
            const t = data[i];
            if (t === undefined) continue;
            if (typeof t === 'object' && !('type' in t)) {
                data[i] = await this.getDataItemsFromAuto(dpInit, t);
            } else if (typeof t === 'object' && 'type' in t) {
                const d = t as DataItemsOptions;
                let found = false;
                if ((d.type !== 'triggered' && d.type !== 'state') || !d.mode || d.mode !== 'auto') continue;
                let endsWith = '';
                // $ means must at the end of id
                if (d.dp && d.dp.endsWith('$')) {
                    endsWith = d.dp.substring(0, d.dp.length - 1);
                }

                for (const role of Array.isArray(d.role) ? d.role : [d.role]) {
                    if (false) {
                        //throw new Error(`${d.dp} has a unkowned role ${d.role}`);
                    }
                    if (!tempObjectDB.ids[dpInit]) {
                        const temp = await this.adapter.getForeignObjectsAsync(`${dpInit}.*`);
                        if (temp) {
                            tempObjectDB.ids[dpInit] = true;
                            tempObjectDB.data = Object.assign(tempObjectDB.data, temp);
                        }
                    }
                    if (!tempObjectDB.ids[dpInit]) {
                        this.log.warn(`Dont find states for ${dpInit}!`);
                    }

                    for (const id in tempObjectDB.data) {
                        if (!id.startsWith(dpInit)) continue;
                        const obj: ioBroker.Object = tempObjectDB.data[id];
                        if (
                            obj &&
                            obj.common &&
                            obj.type === 'state' &&
                            (d.dp === '' || (endsWith ? id.endsWith(endsWith) : id.includes(d.dp))) &&
                            (role === '' || obj.common.role === role)
                        ) {
                            if (found) {
                                this.log.warn(`Found more as 1 state for role ${role} in ${dpInit} with ${d.dp}`);
                                break;
                            }
                            d.dp = id;
                            d.mode = 'done';
                            found = true;
                        }
                    }
                    if (found) break;
                }
                if (!found) {
                    data[i] = undefined;
                    this.log.warn(`No state found for role ${JSON.stringify(d.role)} in ${dpInit} with ${d.dp}`);
                }
            }
        }
        return data;
    }

    async getObjectAsync(id: string): Promise<ioBroker.Object | null> {
        if (this.objectDatabase[id] !== undefined) return this.objectDatabase[id];
        else if (this.triggerDB[id] !== undefined && this.triggerDB[id].internal) {
            return { _id: '', type: 'state', common: this.triggerDB[id].common, native: {} };
        }
        const obj = await this.adapter.getForeignObjectAsync(id);
        this.objectDatabase[id] = obj ?? null;
        return obj ?? null;
    }
}
