// BaseClass extends

import type { IClientPublishOptions } from 'mqtt';
import type { PageInterface } from '../classes/Page';
import { Dataitem } from '../classes/data-item';
import { BaseClass } from '../classes/library';
import type { PageItem } from '../pages/pageItem';
import type { PageItemDataItemsOptions } from '../types/type-pageItem';
import type { DataItemsOptions, nsPanelState, nsPanelStateVal } from '../types/types';
import type { Controller } from './controller';
import type { Panel } from './panel';
import type { PanelSend } from './panel-message';
import { genericStateObjects } from '../const/definition';
import { getRegExp } from '../const/tools';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';

export interface BaseClassTriggerdInterface {
    name: string;
    adapter: NspanelLovelaceUi;
    panelSend: PanelSend;
    alwaysOn?: 'none' | 'always' | 'action';
    panel: Panel;
    dpInit?: string | RegExp;
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
    neverDeactivateTrigger: boolean = false;
    sleep: boolean = true;
    parent: BaseClassTriggerd | undefined = undefined;
    triggerParent: boolean = false;
    dpInit: string | RegExp = '';
    protected enums: string | string[] = '';
    protected device: string = '';
    protected sendToPanel: (payload: string, opt?: IClientPublishOptions) => void = (
        payload: string,
        opt?: IClientPublishOptions,
    ) => {
        if (payload == this.lastMessage) {
            return;
        }
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
        if (!this.adapter.controller) {
            throw new Error('No controller! bye bye');
        }
        this.controller = this.adapter.controller;
        this.panelSend = card.panelSend;
        this.alwaysOn = card.alwaysOn ?? 'none';
        this.panel = card.panel;

        if (typeof this.panelSend.addMessage === 'function') {
            this.sendToPanelClass = card.panelSend.addMessage;
        }
    }

    async reset(): Promise<void> {}

    readonly onStateTriggerSuperDoNotOverride = async (dp: string, from: BaseClassTriggerd): Promise<boolean> => {
        if ((!this.visibility && !(this.neverDeactivateTrigger || from.neverDeactivateTrigger)) || this.unload) {
            return false;
        }
        if (this.sleep && !this.neverDeactivateTrigger) {
            return false;
        }
        if (this.waitForTimeout) {
            return false;
        }
        if (this.updateTimeout) {
            this.doUpdate = true;
            return false;
        }
        this.waitForTimeout = this.adapter.setTimeout(async () => {
            this.waitForTimeout = undefined;
            await this.onStateTrigger(dp, from);
            if (this.alwaysOnState) {
                this.adapter.clearTimeout(this.alwaysOnState);
            }
            if (this.alwaysOn === 'action') {
                this.alwaysOnState = this.adapter.setTimeout(
                    () => {
                        this.panel.sendScreeensaverTimeout(this.panel.timeout);
                    },
                    this.panel.timeout * 1000 || 5000,
                );
            }
        }, 20);
        this.updateTimeout = this.adapter.setTimeout(async () => {
            if (this.unload) {
                return;
            }
            this.updateTimeout = undefined;
            if (this.doUpdate) {
                this.doUpdate = false;
                await this.onStateTrigger(dp, from);
            }
        }, this.minUpdateInterval);
        return true;
    };
    protected async onStateTrigger(_dp: string, _from: BaseClassTriggerd): Promise<void> {
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
        if (this.waitForTimeout) {
            this.adapter.clearTimeout(this.waitForTimeout);
        }
        if (this.alwaysOnState) {
            this.adapter.clearTimeout(this.alwaysOnState);
        }
        await this.stopTriggerTimeout();
    }
    getVisibility = (): boolean => {
        return this.visibility;
    };
    setVisibility = async (v: boolean, force: boolean = false): Promise<void> => {
        if (v !== this.visibility || force) {
            this.visibility = v;
            if (this.visibility) {
                if (this.unload) {
                    return;
                }

                if (this.alwaysOn != 'none') {
                    if (this.alwaysOn === 'action') {
                        this.alwaysOnState = this.adapter.setTimeout(
                            async () => {
                                this.panel.sendScreeensaverTimeout(this.panel.timeout);
                            },
                            this.panel.timeout * 2 * 1000 || 5000,
                        );
                    } else {
                        this.panel.sendScreeensaverTimeout(0);
                    }
                } else {
                    this.panel.sendScreeensaverTimeout(this.panel.timeout);
                }
                this.log.debug(`Switch page to visible${force ? ' (forced)' : ''}!`);
                this.resetLastMessage();
                this.controller && (await this.controller.statesControler.activateTrigger(this));

                this.panel.info.nspanel.currentPage = this.name;
                await this.library.writedp(
                    `panels.${this.panel.name}.info.nspanel.currentPage`,
                    this.name,
                    genericStateObjects.panel.panels.info.nspanel.currentPage,
                );
            } else {
                if (this.alwaysOnState) {
                    this.adapter.clearTimeout(this.alwaysOnState);
                }
                this.log.debug(`Switch page to invisible${force ? ' (forced)' : ''}!`);
                if (!this.neverDeactivateTrigger) {
                    await this.stopTriggerTimeout();
                    this.controller && (await this.controller.statesControler.deactivateTrigger(this));
                }
            }
            await this.onVisibilityChange(v);
        } else {
            this.visibility = v;
        }
    };
    /**
     * Event when visibility is on Change.
     *
     * @param val true/false
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
    pageItemConfig: (PageItemDataItemsOptions | undefined)[] | undefined;
    pageItems: (PageItem | undefined)[] | undefined;
    constructor(card: PageInterface, pageItemsConfig: (PageItemDataItemsOptions | undefined)[] | undefined) {
        super(card);
        this.pageItemConfig = pageItemsConfig;
    }
}
type getInternalFunctionType = (
    id: string,
    state: ioBroker.State | nsPanelState | undefined,
) => Promise<nsPanelStateVal>;
/**
 * Verwendet um Lesezugriffe auf die States umzusetzten, die im NSPanel ververwendet werden.
 * Adapter eigenen States sind verboten
 * Speichert Zugriff zwischen das kann mit timespan vereinflusst werden.
 */
export class StatesControler extends BaseClass {
    private triggerDB: {
        [key: string]: {
            state: nsPanelState;
            to: BaseClassTriggerd[];
            ts: number;
            subscribed: boolean[];
            common: ioBroker.StateCommon;
            internal?: boolean;
            f?: getInternalFunctionType;
            triggerAllowed: boolean[];
            change: ('ne' | 'ts')[];
        };
    } = {};
    private deletePageInterval: ioBroker.Interval | undefined;

    private stateDB: { [key: string]: { state: ioBroker.State; ts: number; common: ioBroker.StateCommon } } = {};
    objectDatabase: Record<string, ioBroker.Object | null> = {};
    intervalObjectDatabase: ioBroker.Interval | undefined;

    timespan: number;

    constructor(adapter: NspanelLovelaceUi, name: string = '', timespan: number = 15000) {
        super(adapter, name || 'StatesDB');
        this.timespan = timespan;
        this.deletePageInterval = this.adapter.setInterval(this.deletePageLoop, 60000);
        this.intervalObjectDatabase = this.adapter.setInterval(() => {
            if (this.unload) {
                return;
            }
            this.intervalObjectDatabase = undefined;
            this.objectDatabase = {};
        }, 1800000);
    }
    private deletePageLoop = (): void => {
        const removeId = [];
        for (const id in this.triggerDB) {
            const entry = this.triggerDB[id];
            const removeIndex = [];
            for (const i of entry.to) {
                if (i.unload) {
                    //this.log.debug('Unload element:  ' + entry.to[i].name);
                    removeIndex.push(Number(i));
                }
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
            if (entry.to.length === 0 && !entry.internal) {
                removeId.push(id);
            }
        }

        for (const id of removeId) {
            delete this.triggerDB[id];
        }
    };

    async delete(): Promise<void> {
        await super.delete();
        if (StatesControler.tempObjectDBTimeout) {
            this.adapter.clearTimeout(StatesControler.tempObjectDBTimeout);
        }
        if (this.intervalObjectDatabase) {
            this.adapter.clearInterval(this.intervalObjectDatabase);
        }
        if (StatesControler.tempObjectDBTimeout) {
            this.adapter.clearTimeout(StatesControler.tempObjectDBTimeout);
        }
        if (this.deletePageInterval) {
            this.adapter.clearInterval(this.deletePageInterval);
        }
    }
    /**
     * Set a subscript to an foreignState and write current state/value to db
     *
     * @param id state id
     * @param from the page that handle the trigger
     * @param internal if the state is internal
     * @param trigger if the state should trigger other classes
     * @param change if the state should trigger other classes
     */
    async setTrigger(
        id: string,
        from: BaseClassTriggerd,
        internal: boolean = false,
        trigger: boolean = true,
        change?: 'ts',
    ): Promise<void> {
        if (id.startsWith(this.adapter.namespace)) {
            this.log.warn(`Id: ${id} refers to the adapter's own namespace, this is not allowed!`);
            return;
            //throw new Error(`Id: ${id} refers to the adapter's own namespace, this is not allowed!`);
        }
        if (this.triggerDB[id] !== undefined) {
            const index = this.triggerDB[id].to.findIndex(a => a == from);
            if (index === -1) {
                this.triggerDB[id].to.push(from);
                this.triggerDB[id].subscribed.push(false);
                this.triggerDB[id].triggerAllowed.push(trigger);
                this.triggerDB[id].change.push(change ? change : 'ne');
            } else {
                //nothing
            }
        } else if (internal) {
            this.log.error('setInternal Trigger too early');
        } else {
            const state = await this.adapter.getForeignStateAsync(id);
            if (state) {
                // erstelle keinen trigger für das gleiche parent doppelt..
                await this.adapter.subscribeForeignStatesAsync(id);
                const obj = await this.getObjectAsync(id);
                if (!obj || !obj.common || obj.type !== 'state') {
                    throw new Error(`Got invalid object for ${id}`);
                }
                this.triggerDB[id] = {
                    state,
                    to: [from],
                    ts: Date.now(),
                    subscribed: [false],
                    common: obj.common,
                    triggerAllowed: [trigger],
                    change: [change ? change : 'ne'],
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
     *
     * @param to Page
     */
    async activateTrigger(to: BaseClassTriggerd | undefined): Promise<void> {
        if (!to) {
            return;
        }
        for (const id in this.triggerDB) {
            const entry = this.triggerDB[id];
            const index = entry.to.indexOf(to);
            if (index === -1) {
                continue;
            }
            if (entry.subscribed[index]) {
                continue;
            }
            if (!entry.triggerAllowed[index]) {
                continue;
            }
            if (!entry.subscribed.some(a => a)) {
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
     *
     * @param to Page
     */
    async deactivateTrigger(to: BaseClassTriggerd): Promise<void> {
        for (const id in this.triggerDB) {
            if (to.neverDeactivateTrigger) {
                continue;
            }
            const entry = this.triggerDB[id];
            if (entry.internal) {
                continue;
            }
            const index = entry.to.indexOf(to);
            if (index === -1) {
                continue;
            }
            if (!entry.subscribed[index]) {
                continue;
            }
            entry.subscribed[index] = false;
            if (!entry.subscribed.some(a => a)) {
                await this.adapter.unsubscribeForeignStatesAsync(id);
            }
        }
    }

    async getStateVal(id: string): Promise<nsPanelState['val'] | null> {
        const state = await this.getState(id, 'now');
        if (state) {
            return state.val ?? null;
        }
        return null;
    }
    /**
     * Read a state from DB or js-controller
     *
     * @param id state id with namespace
     * @param response now or medium
     * @param internal if the state is internal
     * @returns nsPanelState or null
     */
    async getState(
        id: string,
        response: 'now' | 'medium' = 'medium',
        internal: boolean = false,
    ): Promise<nsPanelState | null | undefined> {
        let timespan = this.timespan;
        if (response === 'now') {
            timespan = 10;
        } else {
            timespan = 1000;
        }
        if (
            this.triggerDB[id] !== undefined &&
            (this.triggerDB[id].internal || this.triggerDB[id].subscribed.some(a => a))
        ) {
            let state: nsPanelState | null = null;
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
        if (id.includes('/')) {
            internal = true;
        }
        if (!internal) {
            const state = await this.adapter.getForeignStateAsync(id);
            if (state) {
                if (!this.stateDB[id]) {
                    const obj = await this.getObjectAsync(id);
                    if (!obj || !obj.common || obj.type !== 'state') {
                        throw new Error(`Got invalid object for ${id}`);
                    }
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
        if (this.triggerDB[id] !== undefined && this.triggerDB[id].common) {
            return this.triggerDB[id].common.type;
        }
        if (this.stateDB[id] !== undefined) {
            return this.stateDB[id].common.type;
        }
        return undefined;
    }

    async getCommonStates(id: string, force: boolean = false): Promise<Record<string, string> | undefined> {
        let j: string | string[] | Record<string, string> | undefined = undefined;
        if (force) {
            const obj = await this.adapter.getObjectAsync(id);
            if (obj && obj.common && obj.common.states) {
                j = obj.common.state;
            }
        } else if (this.triggerDB[id] !== undefined && this.triggerDB[id].common) {
            j = this.triggerDB[id].common.states;
        } else if (this.stateDB[id] !== undefined && this.stateDB[id].common) {
            j = this.stateDB[id].common.states;
        }

        if (!j || typeof j === 'string') {
            return undefined;
        }
        if (Array.isArray(j)) {
            const a: Record<string, string> = {};
            j.forEach((e, i) => (a[String(i)] = e));
            j = a;
        }
        return j;
    }

    /**
     * Check if the trigger should trigger other classes. dont check if object has a active subscription. this is done in next step with visible & neverDeactiveTrigger
     *
     * @param dp internal/external
     * @param state iobroker state
     */
    async onStateChange(dp: string, state: nsPanelState | ioBroker.State | null | undefined): Promise<void> {
        if (dp && state) {
            if (this.triggerDB[dp] && this.triggerDB[dp].state) {
                this.log.debug(`Trigger from ${dp} with state ${JSON.stringify(state)}`);
                this.triggerDB[dp].ts = Date.now();
                const oldState = { val: this.triggerDB[dp].state.val, ack: this.triggerDB[dp].state.ack };
                this.triggerDB[dp].state = state;
                if (
                    state.ack ||
                    this.triggerDB[dp].internal ||
                    dp.startsWith('0_userdata.0') ||
                    dp.startsWith('alias.0')
                ) {
                    for (let i = 0; i < this.triggerDB[dp].to.length; i++) {
                        const c = this.triggerDB[dp].to[i];
                        if (
                            oldState.val !== state.val ||
                            oldState.ack !== state.ack ||
                            this.triggerDB[dp].change[i] === 'ts'
                        ) {
                            if (
                                (!c.neverDeactivateTrigger && !this.triggerDB[dp].subscribed[i]) ||
                                !this.triggerDB[dp].triggerAllowed[i]
                            ) {
                                this.log.debug(`Ignore trigger from state ${dp} not subscribed or not allowed!`);
                                return;
                            }
                            if (c.parent && c.triggerParent && !c.parent.unload && !c.parent.sleep) {
                                c.parent.onStateTriggerSuperDoNotOverride &&
                                    (await c.parent.onStateTriggerSuperDoNotOverride(dp, c));
                            } else if (!c.unload) {
                                c.onStateTriggerSuperDoNotOverride && (await c.onStateTriggerSuperDoNotOverride(dp, c));
                            }
                        } else {
                            this.log.debug(`Ignore trigger from state ${dp} no change!`);
                        }
                    }
                } else {
                    this.log.debug(`Ignore trigger from state ${dp} ack is false!`);
                }
            }
            if (state.val === null || state.val === undefined || typeof state.val !== 'object') {
                if (dp.startsWith(this.adapter.namespace)) {
                    const id = dp.replace(`${this.adapter.namespace}.`, '');
                    const libState = this.library.readdb(id);
                    if (libState) {
                        this.library.setdb(id, {
                            ...libState,
                            val: state.val,
                            ts: state.ts,
                            ack: state.ack,
                        });
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
                if (dp.startsWith('system.host')) {
                    this.adapter.controller &&
                        (await this.adapter.controller.systemNotification.onStateChange(dp, state as ioBroker.State));
                }
            }
        }
    }
    async setStateAsync(item: Dataitem, val: ioBroker.StateValue, writeable: boolean): Promise<void> {
        if (item.options.type === 'state' || item.options.type === 'triggered') {
            if (item.options.dp) {
                const ack = item.options.dp.startsWith(this.adapter.namespace);
                this.log.debug(`setStateAsync(${item.options.dp}, ${val}, ${ack})`);
                if (item.trueType() === 'number' && typeof val === 'string') {
                    val = parseFloat(val);
                } else if (item.trueType() === 'number' && typeof val === 'boolean') {
                    val = val ? 1 : 0;
                } else if (item.trueType() === 'boolean') {
                    val = !!val;
                }
                if (item.trueType() === 'string') {
                    val = String(val);
                }
                if (writeable) {
                    await this.adapter.setForeignStateAsync(item.options.dp, val, ack);
                } else {
                    this.log.error(`Forbidden write attempts on a read-only state! id: ${item.options.dp}`);
                }
            }
        } else if (item.options.type === 'internal' || item.options.type === 'internalState') {
            if (this.triggerDB[item.options.dp]) {
                await this.setInternalState(item.options.dp, val, false);
            }
        }
    }

    /**
     * Set a internal state and trigger
     *
     * @param id something like 'cmd/blabla'
     * @param val Value
     * @param ack false use value/ true use func
     * @param common optional for first call
     * @param func optional for first call
     * @returns true if set
     */
    public async setInternalState(
        id: string,
        val: nsPanelStateVal,
        ack: boolean = false,
        common: ioBroker.StateCommon | undefined = undefined,
        func: getInternalFunctionType | undefined = undefined,
    ): Promise<boolean> {
        if (this.triggerDB[id] !== undefined) {
            const f = this.triggerDB[id].f;

            const newState = {
                ...this.triggerDB[id].state,
                // if ack and function take value of function otherwise val
                val: ack && f ? ((await f(id, undefined)) ?? val) : val,
                ack: ack,
                ts: Date.now(),
            };

            // use this to trigger pages
            await this.onStateChange(id, newState);

            // here we trigger the state command
            f && (await f(id, this.triggerDB[id].state));

            return true;

            // create the db entry
        } else if (common) {
            this.log.debug(`Add internal state ${id} with ${JSON.stringify(common)}`);
            this.triggerDB[id] = {
                state: { ts: Date.now(), val: null, ack: ack, from: '', lc: Date.now() },
                to: [],
                ts: Date.now(),
                subscribed: [],
                common: common,
                internal: true,
                f: func,
                triggerAllowed: [],
                change: [],
            };
        }
        return false;
    }

    /**
     * Create dataitems from a json (deep)
     *
     * @param data Json with configuration to create dataitems
     * @param parent Page etc.
     * @param target optional target
     * @returns then json with values dataitem or undefined
     */
    async createDataItems(data: any, parent: any, target: any = {}): Promise<any> {
        for (const i in data) {
            const d = data[i];
            if (d === undefined) {
                continue;
            }
            if (typeof d === 'object' && !('type' in d)) {
                target[i] = await this.createDataItems(d, parent, (target[i] ?? Array.isArray(d)) ? [] : {});
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

    /**
     * Temporäes Datenobject zum speichern aller Enums und Objecte
     */
    static TempObjectDB: {
        data: Record<string, ioBroker.Object> | undefined;
        keys: string[];
        enums: Record<string, ioBroker.EnumObject> | undefined;
    } = {
        data: undefined,
        keys: [],
        enums: undefined,
    };
    static tempObjectDBTimeout: ioBroker.Timeout | undefined;
    static getTempObjectDB(adapter: NspanelLovelaceUi): typeof StatesControler.TempObjectDB {
        if (StatesControler.tempObjectDBTimeout) {
            adapter.clearTimeout(StatesControler.tempObjectDBTimeout);
        }

        StatesControler.tempObjectDBTimeout = adapter.setTimeout(() => {
            if (adapter.unload) {
                return;
            }
            StatesControler.tempObjectDBTimeout = undefined;
            StatesControler.TempObjectDB = { data: undefined, keys: [], enums: undefined };
        }, 60000);

        return StatesControler.TempObjectDB;
    }
    /**
     * Filterfunktion umso genauer die Filter um so weniger Ressourcen werden verbraucht.
     *
     * @param dpInit string RegExp oder '' für aus; string wird mit include verwendet.
     * @param enums string, string[], RegExp als String übergeben oder ein String der mit include verwenden wird.
     * @returns 2 arrays keys: gefilterte keys und data: alle Objekte...
     */
    async getFilteredObjects(dpInit: string | RegExp, enums?: string | string[]): Promise<typeof result> {
        const tempObjectDB = StatesControler.getTempObjectDB(this.adapter);
        if (!tempObjectDB.data) {
            tempObjectDB.data = await this.adapter.getForeignObjectsAsync(`*`);
            if (!tempObjectDB.data) {
                throw new Error('getObjects fail. Critical Error!');
            }
            tempObjectDB.keys = Object.keys(tempObjectDB.data);
            const temp = await this.adapter.getEnumsAsync(['rooms', 'functions']);
            tempObjectDB.enums = Object.assign(temp['enum.rooms'], temp['enum.functions']);
        }
        const result: { data: Record<string, ioBroker.Object> | undefined; keys: string[] } = {
            data: tempObjectDB.data,
            keys: tempObjectDB.keys,
        };
        if (dpInit) {
            if (typeof dpInit !== 'string') {
                result.keys = tempObjectDB.keys.filter(a => a.match(dpInit) !== null);
            } else {
                result.keys = tempObjectDB.keys.filter(a => a.includes(dpInit));
            }
        }
        if (enums && tempObjectDB.enums) {
            if (typeof enums === 'string') {
                enums = [enums];
            }
            let r: string[] | undefined;
            for (const e of enums) {
                const regexp = getRegExp(e);
                let t: string[] = [];
                for (const a in tempObjectDB.enums) {
                    if ((!regexp && a.includes(e)) || (regexp && a.match(regexp) !== null)) {
                        if (
                            tempObjectDB.enums[a] &&
                            tempObjectDB.enums[a].common &&
                            tempObjectDB.enums[a].common.members
                        ) {
                            t = t.concat(tempObjectDB.enums[a].common.members);
                        }
                    }
                }
                if (!r) {
                    r = t;
                } else {
                    r = r.filter(a => t.indexOf(a) !== -1);
                }
            }
            result.keys = result.keys.filter(a => r && r.some(b => a.startsWith(b)));
        }
        return result;
    }
    async getDataItemsFromAuto(
        dpInit: string | RegExp,
        data: any,
        appendix?: string,
        enums?: string | string[],
    ): Promise<any> {
        if (dpInit === '' && enums === undefined) {
            return data;
        }
        const tempObjectDB = await this.getFilteredObjects(dpInit, enums);
        if (tempObjectDB.data) {
            for (const i in data) {
                const t = data[i];
                if (t === undefined) {
                    continue;
                }
                if (typeof t === 'object' && !('type' in t)) {
                    data[i] = await this.getDataItemsFromAuto(dpInit, t, appendix, enums);
                } else if (typeof t === 'object' && 'type' in t) {
                    const d = t as DataItemsOptions;
                    let found = false;
                    if ((d.type !== 'triggered' && d.type !== 'state') || !d.mode || d.mode !== 'auto') {
                        continue;
                    }

                    for (const role of Array.isArray(d.role) ? d.role : [d.role]) {
                        //throw new Error(`${d.dp} has a unkowned role ${d.role}`);

                        if (tempObjectDB.keys.length === 0) {
                            this.log.warn(`Dont find states for ${dpInit}!`);
                        }

                        for (const id of tempObjectDB.keys) {
                            const obj: ioBroker.Object = tempObjectDB.data[id];

                            if (
                                obj &&
                                obj.common &&
                                obj.type === 'state' &&
                                (d.dp === '' || id.includes(d.dp)) &&
                                (role === '' || obj.common.role === role) &&
                                (!d.regexp || id.match(d.regexp) !== null)
                            ) {
                                if (found) {
                                    this.log.warn(
                                        `Found more as 1 state for role ${role} in ${dpInit} with .dp: ${
                                            d.dp ? d.dp.toString() : 'empty'
                                        } and .regexp: ${d.regexp ? d.regexp.toString() : 'empty'}`,
                                    );
                                    break;
                                }
                                d.dp = id;
                                d.mode = 'done';
                                found = true;
                            }
                        }
                        if (found) {
                            break;
                        }
                    }
                    if (!found) {
                        data[i] = undefined;
                        this.log.warn(
                            `No state found for role ${JSON.stringify(d.role)} in ${dpInit.toString()} with with .dp: ${
                                d.dp ? d.dp.toString() : 'empty'
                            } and .regexp: ${d.regexp ? d.regexp.toString() : 'empty'}`,
                        );
                    }
                }
            }
        }
        return data;
    }

    async getObjectAsync(id: string): Promise<ioBroker.Object | null> {
        if (this.objectDatabase[id] !== undefined) {
            return this.objectDatabase[id];
        } else if (this.triggerDB[id] !== undefined && this.triggerDB[id].internal) {
            return { _id: '', type: 'state', common: this.triggerDB[id].common, native: {} };
        }
        const obj = await this.adapter.getForeignObjectAsync(id);
        this.objectDatabase[id] = obj ?? null;
        return obj ?? null;
    }
}
