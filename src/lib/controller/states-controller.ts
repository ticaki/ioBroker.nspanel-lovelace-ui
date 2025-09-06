// BaseClass extends

import { Dataitem } from '../classes/data-item';
import { BaseClass } from '../classes/library';
import type { DataItemsOptions, nsPanelState, nsPanelStateVal } from '../types/types';
import { getRegExp } from '../const/tools';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import type { StateRole } from '../types/pages';
import type { BaseClassTriggerd } from '../classes/baseClassPage';

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
            this.objectDatabase = {};
        }, 180000);
    }
    deletePageLoop = (): void => {
        const removeId = [];
        for (const id in this.triggerDB) {
            const entry = this.triggerDB[id];
            const removeIndex = [];
            for (let i = 0; i < entry.to.length; i++) {
                const item = entry.to[i];
                if (item.unload) {
                    //this.log.debug('Unload element:  ' + entry.to[i].name);
                    removeIndex.push(Number(i));
                } else if (item.parent?.basePanel?.unload) {
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
        if (this.deletePageInterval) {
            this.adapter.clearInterval(this.deletePageInterval);
        }
    }
    /**
     * Registriert einen Trigger auf einen *fremden* State (nicht im eigenen Namespace)
     * und initialisiert die Trigger-Datenbank inkl. Abo & aktuellem Wert.
     *
     * Hinweise:
     * - Eigene States (im Adapter-Namespace) sind hier verboten.
     * - Bei bereits existierendem Eintrag wird der Empfänger nur ergänzt.
     *
     * @param id        Fremd-State-ID
     * @param from      Auslösende/abonniert-werdende Klasse
     * @param internal  true = interner Trigger (kein Fremd-Abo erwartet)
     * @param trigger   ob dieser Empfänger durch Änderungen ausgelöst werden darf
     * @param change    optional: 'ts' → löse auch ohne Wert-/Ack-Änderung (Zeitstempel)
     */
    async setTrigger(
        id: string,
        from: BaseClassTriggerd,
        internal: boolean = false,
        trigger: boolean = true,
        change?: 'ts',
    ): Promise<void> {
        // 1) Eigener Namespace? → verboten
        if (id.startsWith(this.adapter.namespace)) {
            this.log.warn(`Id: ${id} refers to the adapter's own namespace, this is not allowed!`);
            return;
        }

        const existing = this.triggerDB[id];

        // 2) Bereits vorhanden → Empfänger anhängen (falls nicht schon drin)
        if (existing) {
            const idx = existing.to.findIndex(a => a === from);
            if (idx === -1) {
                existing.to.push(from);
                existing.subscribed.push(false);
                existing.triggerAllowed.push(trigger);
                existing.change.push(change ?? 'ne');
                if (this.adapter.config.debugLogStates) {
                    this.log.debug(`Add a trigger for ${from.name} to ${id}`);
                }
            }
            return;
        }

        // 3) Neu anlegen: interner Trigger zu früh?
        if (internal) {
            this.log.error('setInternal Trigger too early');
            return;
        }

        // 4) Platz reservieren (default-Werte), bevor wir I/O machen
        this.triggerDB[id] = {
            state: { val: null, ack: false, ts: 0, from: '', lc: 0 },
            to: [from],
            ts: Date.now(),
            subscribed: [false],
            common: { name: id, type: 'number', role: 'state', write: false, read: true },
            triggerAllowed: [trigger],
            change: [change ?? 'ne'],
            internal: false,
        };

        try {
            const obj = await this.getObjectAsync(id);
            if (!obj || obj.type !== 'state' || !obj.common) {
                delete this.triggerDB[id];
                throw new Error(`Got invalid object for ${id}`);
            }
            this.triggerDB[id].common = obj.common;
            if (this.unload) {
                return;
            }
            await this.adapter.subscribeForeignStatesAsync(id);
            if (this.adapter.config.debugLogStates) {
                this.log.debug(`Set a new trigger for ${from.basePanel.name}.${from.name} to ${id}`);
            }
            // 5) Fremd-State & -Objekt holen
            const state = await this.adapter.getForeignStateAsync(id);
            if (state) {
                this.triggerDB[id].state = state;
            }

            // 6) DB befüllen, abonnieren, evtl. alten stateDB-Eintrag entfernen

            if (this.stateDB[id] !== undefined) {
                delete this.stateDB[id];
            }
        } catch (err) {
            // Rollback bei Fehlern
            delete this.triggerDB[id];
            throw err;
        }
    }

    /**
     * Activate the triggers of a pageItem for self or parent. First subscribes to the state.
     *
     * @param to Page
     */
    async activateTrigger(to: BaseClassTriggerd | undefined): Promise<void> {
        if (!to) {
            return;
        }
        for (const id in this.triggerDB) {
            const entry = this.triggerDB[id];
            const index = entry.to.findIndex(a => a === to || (a.parent && a.parent === to));
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
                entry.subscribed[index] = true;
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
     * Deactivate the triggers of a pageItem for self or parent page. Last unsubscribes to the state.
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
            const indexParent = entry.to.findIndex(a => a.parent && a.parent === to);
            if (indexParent !== -1 && entry.subscribed[indexParent]) {
                // parent has another page that is still active
                continue;
            }
            if (!entry.subscribed[index]) {
                continue;
            }
            entry.subscribed[index] = false;
            if (this.adapter.config.debugLogStates) {
                this.log.debug(`Deactivate trigger from ${to.name} to ${id}`);
            }
            if (!entry.subscribed.some(a => a)) {
                await this.adapter.unsubscribeForeignStatesAsync(id);
            }
        }
    }

    async getStateVal(id: string): Promise<nsPanelState['val'] | null> {
        try {
            const state = await this.getState(id);
            if (state) {
                return state.val ?? null;
            }
        } catch (e: any) {
            this.log.error(`Error 1004: ${typeof e === 'string' ? e.replaceAll('Error: ', '') : e}`);
        }
        return null;
    }
    /**
     * Read a state from DB or js-controller
     *
     * @param id state id with namespace
     * @param internal if the state is internal
     * @returns nsPanelState or null
     */
    async getState(id: string, internal: boolean = false): Promise<nsPanelState | null> {
        let timespan = this.timespan;
        timespan = 10;
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
            if (state != null) {
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
            if (state === null) {
                return null;
            }
        }
        throw new Error(`State id invalid ${id} no data!`);
    }

    getType(id: string | undefined): ioBroker.CommonType | undefined {
        if (!id) {
            return undefined;
        }
        if (this.triggerDB[id] !== undefined && this.triggerDB[id].common) {
            return this.triggerDB[id].common.type;
        }
        if (this.stateDB[id] !== undefined) {
            return this.stateDB[id].common.type;
        }
        return undefined;
    }

    async getCommonStates(id: string | undefined, force: boolean = false): Promise<Record<string, string> | null> {
        if (!id) {
            return null;
        }
        let j: string | string[] | Record<string, string> | undefined = undefined;
        if (force) {
            const obj = await this.adapter.getForeignObjectAsync(id);
            if (obj && obj.common && obj.common.states) {
                j = obj.common.states;
            }
        } else if (this.triggerDB[id] !== undefined && this.triggerDB[id].common) {
            j = this.triggerDB[id].common.states;
        } else if (this.stateDB[id] !== undefined && this.stateDB[id].common) {
            j = this.stateDB[id].common.states;
        }

        if (!j || typeof j === 'string') {
            return null;
        }
        if (Array.isArray(j)) {
            const a: Record<string, string> = {};
            j.forEach((e, i) => (a[String(i)] = e));
            j = a;
        }
        return j;
    }

    isStateValue(v: unknown): v is ioBroker.StateValue {
        return (
            v === null || v === undefined || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
        );
    }

    /**
     * Handle incoming state changes from ioBroker.
     *
     * Responsibilities:
     *  - Update the internal triggerDB entry for the given datapoint.
     *  - Decide whether the state change should trigger dependent classes.
     *  - Forward primitive values to library cache and panels if required.
     *  - Forward system.host changes to systemNotification.
     *
     * Notes:
     *  - Active subscriptions (visible & neverDeactivateTrigger) are checked later, not here.
     *  - Object values are ignored (only primitive values are cached/forwarded).
     *
     * @param dp     Datapoint ID (internal/external state id)
     * @param state  New ioBroker state object or null/undefined
     */
    async onStateChange(dp: string, state: nsPanelState | ioBroker.State | null | undefined): Promise<void> {
        if (!dp || !state) {
            return;
        }

        const entry = this.triggerDB[dp];

        // --- Trigger/ACK-Pfad ------------------------------------------------------
        if (entry?.state) {
            if (this.adapter.config.debugLogStates) {
                this.log.debug(`Trigger from ${dp} with state ${JSON.stringify(state)}`);
            }

            // Update triggerDB entry
            entry.ts = Date.now();
            const oldState = { val: entry.state.val, ack: entry.state.ack };
            entry.state = state;

            const isSystemOrAlias = dp.startsWith('0_userdata.0') || dp.startsWith('alias.0');
            const mayTrigger = state.ack || entry.internal || isSystemOrAlias;

            if (mayTrigger) {
                const to = entry.to; // Ziel-Liste von Trigger-Empfängern
                const changes = entry.change || []; // Änderungsregeln je Empfänger
                const subscribed = entry.subscribed || [];
                const allowed = entry.triggerAllowed || [];

                for (let i = 0; i < to.length; i++) {
                    const target = to[i];

                    // Nur reagieren, wenn sich etwas geändert hat (val, ack oder "ts")
                    const hasChange = oldState.val !== state.val || oldState.ack !== state.ack || changes[i] === 'ts';

                    if (!hasChange) {
                        this.log.debug(`Ignore trigger from state ${dp} no change!`);
                        continue;
                    }

                    // Prüfen ob trigger erlaubt und abonniert
                    const notSubscribedOrNotAllowed = (!target.neverDeactivateTrigger && !subscribed[i]) || !allowed[i];

                    if (notSubscribedOrNotAllowed) {
                        if (i === to.length - 1) {
                            this.log.debug(`Ignore trigger from state ${dp} not subscribed or not allowed!`);
                            this.log.debug(
                                `c: ${target.name} !c.neverDeactivateTrigger: ${!target.neverDeactivateTrigger} && ` +
                                    `!this.triggerDB[dp].subscribed[i]: ${!subscribed[i]} || ` +
                                    `!this.triggerDB[dp].triggerAllowed[i]: ${!allowed[i]}`,
                            );
                        }
                        continue;
                    }

                    // Weiterreichen an Parent (falls vorhanden) oder direkt
                    if (target.parent && target.triggerParent && !target.parent.unload && !target.parent.sleep) {
                        if (target.parent.onStateTriggerSuperDoNotOverride) {
                            await target.parent.onStateTriggerSuperDoNotOverride(dp, target);
                        }
                    } else if (!target.unload) {
                        if (target.onStateTriggerSuperDoNotOverride) {
                            await target.onStateTriggerSuperDoNotOverride(dp, target);
                        }
                    }
                }
            } else {
                this.log.debug(`Ignore trigger from state ${dp} ack is false!`);
            }
        }

        // --- Primitive-Update-Pfad (nur Nicht-Objekte) -----------------------------
        const v = state.val;
        const isPrimitive = v === null || v === undefined || typeof v !== 'object';
        if (!isPrimitive) {
            return;
        }

        // Eigene States (im Adapter-Namespace) updaten
        if (dp.startsWith(this.adapter.namespace)) {
            const id = dp.replace(`${this.adapter.namespace}.`, '');
            const libState = this.library.readdb(id);

            if (libState) {
                this.library.setdb(id, {
                    ...libState,
                    val: this.isStateValue(state.val) ? state.val : null,
                    ts: state.ts,
                    ack: state.ack,
                });
            }

            // Weiterreichen an Panels nur wenn state beschreibbar ist
            if (libState?.obj?.common?.write && this.adapter.controller) {
                for (const panel of this.adapter.controller.panels) {
                    await panel.onStateChange(id, state);
                }
            }
        }

        // System-Host-Notifications weiterreichen
        if (dp.startsWith('system.host') && this.adapter.controller) {
            await this.adapter.controller.systemNotification.onStateChange(dp, state as ioBroker.State);
        }
    }
    async setState(item: Dataitem, val: ioBroker.StateValue, writeable: boolean): Promise<void> {
        if (item.options.type === 'state' || item.options.type === 'triggered') {
            if (item.options.dp) {
                const ack = item.options.dp.startsWith(this.adapter.namespace);
                this.log.debug(`setState(${item.options.dp}, ${val}, ${ack})`);
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
                    try {
                        await this.adapter.setForeignStateAsync(item.options.dp, val, ack);
                    } catch (e: any) {
                        item.writeable = false;
                        item.common.write = false;
                        throw e;
                    }
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
            if (this.adapter.config.debugLogStates) {
                this.log.debug(`Add internal state ${id} with ${JSON.stringify(common)}`);
            }
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
     * @param path optional path
     * @param options so far only constant to use in getState().read
     * @returns then json with values dataitem or undefined
     */
    async createDataItems(
        data: any,
        parent: any,
        target: any = {},
        path: string = 'data',
        options?: Record<string, string>,
    ): Promise<any> {
        for (const i in data) {
            const d = data[i];
            if (d === undefined) {
                continue;
            }
            if (typeof d === 'object' && !('type' in d)) {
                target[i] = await this.createDataItems(
                    d,
                    parent,
                    (target[i] ?? Array.isArray(d)) ? [] : {},
                    `${path}.${i}`,
                    options,
                );
            } else if (typeof d === 'object' && 'type' in d) {
                target[i] =
                    data[i] !== undefined
                        ? new Dataitem(
                              this.adapter,
                              { ...d, name: `${this.name}.${parent.name}.${i}.${path}`, constants: options },
                              parent,
                              this,
                          )
                        : undefined;
                if (target[i] !== undefined && !(await (target[i] as Dataitem).isValidAndInit())) {
                    target[i] = undefined;
                }
            }
        }
        if (Object.keys(target).length === 0) {
            return undefined;
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
        }, 10000);

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
            tempObjectDB.enums = { ...temp['enum.rooms'], ...temp['enum.functions'] };
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

    /**
     * Retrieves the ID of a state automatically based on the provided options.
     *
     * @param options - Configuration for the automatic state lookup.
     * @param options.dpInit - The initial data point, either a string or a regular expression.
     * @param options.role - The expected role of the state, either a single StateRole or an array of roles.
     * @param options.enums - One or more enum IDs that the state should belong to.
     * @param options.regexp - A regular expression to match the state ID.
     * @param options.triggered - If true, the returned object will be of type "triggered" instead of "state".
     * @param options.writeable - If true, only writeable states will be considered.
     * @param options.commonType - The expected common type of the state, either a single type or an array of types.
     * @returns A promise that resolves to a `DataItemsOptions` object if a matching state is found,
     * otherwise `undefined`.
     */
    async getIdbyAuto(options: {
        dpInit: string | RegExp;
        role?: StateRole | StateRole[];
        enums?: string | string[];
        regexp?: RegExp;
        triggered?: boolean;
        writeable?: boolean;
        commonType?: ioBroker.CommonType | ioBroker.CommonType[] | '';
    }): Promise<DataItemsOptions | undefined> {
        const { dpInit, role = '', enums = '', regexp, triggered, writeable, commonType = '' } = options;

        const status = { ok: true };
        let item: DataItemsOptions | undefined;
        if (triggered) {
            item = {
                type: 'triggered',
                role,
                dp: '',
                mode: 'auto',
                regexp,
                writeable,
                commonType,
            };
        } else {
            item = {
                type: 'state',
                role,
                dp: '',
                mode: 'auto',
                regexp,
                writeable,
                commonType,
            };
        }
        const data = await this.getDataItemsFromAuto(dpInit, { item: item }, '', enums, status, true);
        if (status.ok && data && data.item && data.item.dp) {
            return item;
        }
        return undefined;
    }

    async getDataItemsFromAuto(
        dpInit: string | RegExp,
        data: any,
        appendix?: string,
        enums: string | string[] = '',
        status?: { ok: boolean },
        ignoreMultiple: boolean = false,
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
                    data[i] = await this.getDataItemsFromAuto(dpInit, t, appendix, enums, status);
                } else if (typeof t === 'object' && 'type' in t) {
                    const d = t as DataItemsOptions;
                    let found = false;
                    if ((d.type !== 'triggered' && d.type !== 'state') || !d.mode || d.mode !== 'auto') {
                        continue;
                    }
                    if (tempObjectDB.keys.length === 0) {
                        this.log.warn(`Dont finds states for ${dpInit}!`);
                    }
                    for (const role of Array.isArray(d.role) ? d.role : [d.role || '']) {
                        //throw new Error(`${d.dp} has a unkowned role ${d.role}`);
                        for (const commonType of Array.isArray(d.commonType) ? d.commonType : [d.commonType || '']) {
                            for (const id of tempObjectDB.keys) {
                                const obj: ioBroker.Object = tempObjectDB.data[id];

                                if (
                                    obj &&
                                    obj.common &&
                                    obj.type === 'state' &&
                                    (d.dp === '' || id.includes(d.dp)) &&
                                    (role === '' || obj.common.role === role) &&
                                    (!commonType || obj.common.type === commonType) &&
                                    (!d.writeable || obj.common.write === d.writeable) &&
                                    (!d.regexp || id.match(d.regexp) !== null)
                                ) {
                                    if (found) {
                                        if (!ignoreMultiple) {
                                            this.log.warn(
                                                `Found more as 1 state for role ${role} in ${dpInit} with .dp: ${
                                                    d.dp ? d.dp.toString() : 'empty'
                                                } and .regexp: ${d.regexp ? d.regexp.toString() : 'empty'}`,
                                            );
                                        }
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
                        if (found) {
                            break;
                        }
                    }
                    if (!found) {
                        if (d.required) {
                            status && (status.ok = false);
                            this.log.warn(
                                `No state found for role ${JSON.stringify(d.role)} in ${dpInit.toString()} with with .dp: ${
                                    d.dp ? d.dp.toString() : 'empty'
                                } and .regexp: ${d.regexp ? d.regexp.toString() : 'empty'}`,
                            );
                        }
                        data[i] = undefined;
                    }
                }
            }
        }
        return data;
    }

    async getObjectAsync(id: string): Promise<ioBroker.Object | null> {
        if (this.objectDatabase[id] !== undefined) {
            return this.objectDatabase[id];
        } else if (this.triggerDB[id] != undefined && this.triggerDB[id].internal) {
            return { _id: '', type: 'state', common: this.triggerDB[id].common, native: {} };
        }
        const obj = await this.adapter.getForeignObjectAsync(id);
        this.objectDatabase[id] = obj ?? null;
        return obj ?? null;
    }
}
