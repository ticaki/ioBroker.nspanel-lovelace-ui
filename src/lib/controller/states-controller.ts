// BaseClass extends

import { Dataitem } from './data-item';
import { BaseClass } from './library';
import type { nsPanelState, nsPanelStateVal } from '../types/types';
import { getRegExp } from '../const/tools';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import type { StateRole } from '../types/pages';
import type { BaseTriggeredPage } from '../classes/baseClassPage';
import type { NSPanel } from '../types/NSPanel';

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
            to: BaseTriggeredPage[];
            ts: number;
            subscribed: boolean[];
            common: ioBroker.StateCommon;
            internal?: boolean;
            f?: getInternalFunctionType;
            triggerAllowed: boolean[];
            change: ('ne' | 'ts')[];
        };
    } = {};

    // Performance-optimized lookup maps
    private targetToTriggerMap = new Map<BaseTriggeredPage, Set<string>>();
    private activeTriggerCount = new Map<string, number>();
    /**
     * Holds subscriptions created while the subscription system is temporarily blocked.
     *
     * - `undefined`: blocking is not active (normal mode, new subscriptions are applied immediately).
     * - `string[]`: blocking is active; new subscriptions are collected here until the block is lifted.
     */
    private blockedSubscriptions: string[] | undefined;
    private deletePageInterval: ioBroker.Interval | undefined;

    private stateDB: { [key: string]: { state: ioBroker.State; ts: number; common: ioBroker.StateCommon } } = {};
    objectDatabase: Record<string, ioBroker.Object | null> = {};
    intervalObjectDatabase: ioBroker.Interval | undefined;

    timespan: number;

    constructor(adapter: NspanelLovelaceUi, name: string = '', timespan: number = 15_000) {
        super(adapter, name || 'StatesDB');
        this.timespan = timespan;
        this.deletePageInterval = this.adapter.setInterval(async () => {
            this.deletePageLoop();
        }, 180_000);
        this.intervalObjectDatabase = this.adapter.setInterval(() => {
            if (this.unload || this.adapter.unload) {
                return;
            }
            this.objectDatabase = {};
            // ADDED: Cleanup expired stateDB entries to prevent memory leaks
            this.cleanupStateDB();
        }, 180_000);
    }
    deletePageLoop = (f?: getInternalFunctionType): void => {
        const removeIds: string[] = [];

        // Performance-optimiert: Verwende for..in statt Object.keys()
        for (const id in this.triggerDB) {
            const entry = this.triggerDB[id];
            const removeIdx: number[] = [];

            if (f && entry.f === f) {
                removeIds.push(id);
                continue;
            }

            // Sammle zu löschende Indizes aus entry.to
            for (let i = 0; i < entry.to.length; i++) {
                const it = entry.to[i];
                if (it?.unload || it?.parent?.unload || it?.parent?.basePanel?.unload || it?.parent?.parent?.unload) {
                    removeIdx.push(i);
                }
            }

            if (removeIdx.length > 0) {
                // FIXED: Sichere Array-Manipulation mit expliziten Array-Namen
                // Absteigend sortieren, damit Splices Indizes nicht verschieben
                removeIdx.sort((a, b) => b - a);

                // Für alle relevanten Array-Properties den gleichen Index entfernen
                const arrayProperties = ['to', 'subscribed', 'triggerAllowed', 'change'] as const;
                for (const idx of removeIdx) {
                    for (const prop of arrayProperties) {
                        const arr = entry[prop] as any[];
                        if (arr && Array.isArray(arr) && idx >= 0 && idx < arr.length) {
                            arr.splice(idx, 1);
                        }
                    }
                }

                // Update performance maps
                for (const idx of removeIdx) {
                    const target = entry.to[idx];
                    if (target) {
                        this.removeFromTargetMap(target, id);
                    }
                }
            }

            if (entry.to.length === 0 && !entry.internal) {
                removeIds.push(id);
            }
        }

        // Cleanup for removed IDs
        this.blockedSubscriptions = [];
        for (const id of removeIds) {
            //await this.adapter.unsubscribeForeignStatesAsync(id);
            delete this.triggerDB[id];
            this.activeTriggerCount.delete(id);
        }

        while (this.blockedSubscriptions && this.blockedSubscriptions.length > 0) {
            for (let idx = this.blockedSubscriptions.length - 1; idx >= 0; idx--) {
                if (idx >= this.blockedSubscriptions.length) {
                    continue;
                }
                //const id = this.blockedSubscriptions[idx];
                //await this.adapter.subscribeForeignStatesAsync(id);
                this.blockedSubscriptions.splice(idx, 1);
            }
        }
        this.blockedSubscriptions = undefined;
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

        // Cleanup performance maps
        this.targetToTriggerMap.clear();
        this.activeTriggerCount.clear();
    }

    // Performance optimization helper methods
    private addToTargetMap(target: BaseTriggeredPage, triggerId: string): void {
        if (!this.targetToTriggerMap.has(target)) {
            this.targetToTriggerMap.set(target, new Set());
        }
        this.targetToTriggerMap.get(target)!.add(triggerId);
    }

    private removeFromTargetMap(target: BaseTriggeredPage, triggerId: string): void {
        const triggers = this.targetToTriggerMap.get(target);
        if (triggers) {
            triggers.delete(triggerId);
            if (triggers.size === 0) {
                this.targetToTriggerMap.delete(target);
            }
        }
    }

    private incrementActiveTrigger(triggerId: string): void {
        const current = this.activeTriggerCount.get(triggerId) || 0;
        this.activeTriggerCount.set(triggerId, current + 1);
    }

    private decrementActiveTrigger(triggerId: string): void {
        const current = this.activeTriggerCount.get(triggerId) || 0;
        if (current <= 1) {
            this.activeTriggerCount.delete(triggerId);
        } else {
            this.activeTriggerCount.set(triggerId, current - 1);
        }
    }

    /**
     * Cleanup expired entries from stateDB to prevent memory leaks
     * OPTIMIERT: Regelmäßige Bereinigung des Cache
     */
    private cleanupStateDB(): void {
        const now = Date.now();
        const expiredIds: string[] = [];

        for (const id in this.stateDB) {
            const entry = this.stateDB[id];
            const age = now - entry.ts;
            // Keep entries 2x timespan
            if (age > this.timespan * 2) {
                expiredIds.push(id);
            }
        }

        for (const id of expiredIds) {
            delete this.stateDB[id];
        }

        if (expiredIds.length > 0 && this.adapter.config.debugLogStates) {
            this.log.debug(`Cleaned up ${expiredIds.length} expired stateDB entries`);
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
        from: BaseTriggeredPage,
        internal: boolean = false,
        trigger: boolean = true,
        change?: 'ts',
    ): Promise<void> {
        // 1) Eigener Namespace? → verboten
        if (
            id.startsWith(this.adapter.namespace) &&
            !(id.includes('.alarm.') && (id.endsWith('.approve') || id.endsWith('.status')))
        ) {
            this.log.warn(`Id: ${id} refers to the adapter's own namespace, this is not allowed!`);
            return;
        }

        const existing = this.triggerDB[id];

        // 2) Bereits vorhanden → Empfänger anhängen (falls nicht schon drin)
        if (existing) {
            // OPTIMIERT: Verwende indexOf für bessere Performance als findIndex
            const idx = existing.to.indexOf(from);
            if (idx === -1) {
                existing.to.push(from);
                existing.subscribed.push(false);
                existing.triggerAllowed.push(trigger);
                existing.change.push(change ?? 'ne');

                // Update performance maps
                this.addToTargetMap(from, id);

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
            if (this.unload || this.adapter.unload) {
                return;
            }
            if (this.blockedSubscriptions) {
                if (!this.blockedSubscriptions.includes(id)) {
                    this.blockedSubscriptions.push(id);
                }
            } else {
                //await this.adapter.subscribeForeignStatesAsync(id);
            }
            if (this.adapter.config.debugLogStates) {
                this.log.debug(`Set a new trigger for ${from.basePanel.name}.${from.name} to ${id}`);
            }

            // Add to performance maps
            this.addToTargetMap(from, id);

            // 5) Fremd-State & -Objekt holen
            const state = await this.adapter.getForeignStateAsync(id);
            if (state) {
                this.triggerDB[id].state = state;
            }

            // 6) DB befüllen, abonnieren, evtl. alten stateDB-Eintrag entfernen
            // OPTIMIERT: Verwende has() statt !== undefined
            if (this.stateDB[id]) {
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
     * OPTIMIERT: Verwende performance maps für bessere Effizienz
     *
     * @param to Page
     */
    async activateTrigger(to: BaseTriggeredPage | undefined): Promise<void> {
        if (!to) {
            return;
        }

        // OPTIMIERT: Verwende Map für direkte Lookup statt Iteration über alle IDs
        const triggerIds = this.targetToTriggerMap.get(to);
        if (triggerIds) {
            for (const id of triggerIds) {
                const entry = this.triggerDB[id];
                if (!entry) {
                    continue;
                }

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

                const hasActiveSubscription = entry.subscribed.some(a => a);
                if (!hasActiveSubscription) {
                    entry.subscribed[index] = true;
                    this.incrementActiveTrigger(id);
                    //await this.adapter.subscribeForeignStatesAsync(id);
                    const state = await this.adapter.getForeignStateAsync(id);
                    if (state) {
                        entry.state = state;
                    }
                } else {
                    entry.subscribed[index] = true;
                    this.incrementActiveTrigger(id);
                }
            }
        }

        // Fallback: Check parent relationships (less common case)
        for (const id in this.triggerDB) {
            const entry = this.triggerDB[id];
            const index = entry.to.findIndex(a => a.parent && a.parent === to);
            if (index === -1) {
                continue;
            }
            if (entry.subscribed[index]) {
                continue;
            }
            if (!entry.triggerAllowed[index]) {
                continue;
            }

            const hasActiveSubscription = entry.subscribed.some(a => a);
            if (!hasActiveSubscription) {
                entry.subscribed[index] = true;
                this.incrementActiveTrigger(id);
                //await this.adapter.subscribeForeignStatesAsync(id);
                const state = await this.adapter.getForeignStateAsync(id);
                if (state) {
                    entry.state = state;
                }
            } else {
                entry.subscribed[index] = true;
                this.incrementActiveTrigger(id);
            }
        }
    }

    /**
     * Deactivate the triggers of a pageItem for self or parent page. Last unsubscribes to the state.
     * OPTIMIERT: Verwende performance maps und effizientere Suche
     *
     * @param to Page
     */
    async deactivateTrigger(to: BaseTriggeredPage): Promise<void> {
        if (to.neverDeactivateTrigger) {
            return;
        }

        // OPTIMIERT: Verwende direkte Map-Lookup für bessere Performance
        const triggerIds = this.targetToTriggerMap.get(to);
        if (triggerIds) {
            for (const id of triggerIds) {
                const entry = this.triggerDB[id];
                if (!entry || entry.internal) {
                    continue;
                }

                const index = entry.to.indexOf(to);
                if (index === -1 || !entry.subscribed[index]) {
                    continue;
                }

                // Check if parent has another active page
                const indexParent = entry.to.findIndex(a => a.parent && a.parent === to);
                if (indexParent !== -1 && entry.subscribed[indexParent]) {
                    continue; // parent has another page that is still active
                }

                entry.subscribed[index] = false;
                this.decrementActiveTrigger(id);

                if (this.adapter.config.debugLogStates) {
                    this.log.debug(`Deactivate trigger from ${to.name} to ${id}`);
                }

                // Check if no subscriptions are left
                const hasActiveSubscriptions = entry.subscribed.some(a => a);
                if (!hasActiveSubscriptions) {
                    if (this.blockedSubscriptions) {
                        const idx = this.blockedSubscriptions.indexOf(id);
                        if (idx !== -1) {
                            this.blockedSubscriptions.splice(idx, 1);
                        }
                    }
                    //await this.adapter.unsubscribeForeignStatesAsync(id);
                }
            }
        }

        // Handle any remaining entries not in the map (edge case)
        for (const id in this.triggerDB) {
            const entry = this.triggerDB[id];
            if (entry.internal) {
                continue;
            }

            const index = entry.to.indexOf(to);
            if (index === -1 || !entry.subscribed[index]) {
                continue;
            }

            // Check if already handled by map lookup
            const triggerIdsForTarget = this.targetToTriggerMap.get(to);
            if (triggerIdsForTarget && triggerIdsForTarget.has(id)) {
                continue; // Already handled above
            }

            const indexParent = entry.to.findIndex(a => a.parent && a.parent === to);
            if (indexParent !== -1 && entry.subscribed[indexParent]) {
                continue; // parent has another page that is still active
            }

            entry.subscribed[index] = false;
            this.decrementActiveTrigger(id);

            if (this.adapter.config.debugLogStates) {
                this.log.debug(`Deactivate trigger from ${to.name} to ${id}`);
            }

            const hasActiveSubscriptions = entry.subscribed.some(a => a);
            if (!hasActiveSubscriptions) {
                if (this.blockedSubscriptions) {
                    const idx = this.blockedSubscriptions.indexOf(id);
                    if (idx !== -1) {
                        this.blockedSubscriptions.splice(idx, 1);
                    }
                }
                //await this.adapter.unsubscribeForeignStatesAsync(id);
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
     * OPTIMIERT: Verbesserte Cache-Strategie und Performance
     *
     * @param id state id with namespace
     * @param internal if the state is internal
     * @returns nsPanelState or null
     */
    async getState(id: string, internal: boolean = false): Promise<nsPanelState | null> {
        // 1) TriggerDB has priority (subscribed or internal states)
        const triggerEntry = this.triggerDB[id];
        if (triggerEntry && (triggerEntry.internal || triggerEntry.subscribed.some(a => a))) {
            let state: nsPanelState | null = null;
            const f = triggerEntry.f;
            if (f) {
                state = {
                    ...triggerEntry.state,
                    val: await f(id, undefined),
                };
            } else {
                state = triggerEntry.state;
            }
            return state;
        }

        // 2) Check stateDB cache with timespan validation
        const cachedEntry = this.stateDB[id];
        if (cachedEntry) {
            const age = Date.now() - cachedEntry.ts;
            if (age < this.timespan) {
                return cachedEntry.state;
            }
            // Cache expired, remove it
            delete this.stateDB[id];
        }

        // 3) Handle internal states (with '/')
        if (id.includes('/')) {
            internal = true;
        }

        if (!internal) {
            try {
                const state = await this.adapter.getForeignStateAsync(id);
                if (state != null) {
                    // Update cache only if we don't have it in stateDB
                    if (!this.stateDB[id]) {
                        const obj = await this.getObjectAsync(id);
                        if (!obj || !obj.common || obj.type !== 'state') {
                            throw new Error(`Got invalid object for ${id}`);
                        }
                        this.stateDB[id] = { state: state, ts: Date.now(), common: obj.common };
                    } else {
                        // Update existing cache
                        this.stateDB[id].state = state;
                        this.stateDB[id].ts = Date.now();
                    }
                    return state;
                }
                if (state === null) {
                    return null;
                }
            } catch (e: any) {
                this.log.error(`Error 1005: ${typeof e === 'string' ? e.replaceAll('Error: ', '') : e}`);
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
                if (this.triggerDB[id] !== undefined && this.triggerDB[id].common.states) {
                    this.triggerDB[id].common.states = j;
                }
                if (this.stateDB[id] !== undefined && this.stateDB[id].common.states) {
                    this.stateDB[id].common.states = j;
                }
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
     * Performance-optimized version for high-frequency calls (1000s per minute).
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

        // Cache adapter namespace for string comparisons
        const adapterNamespace = this.adapter.namespace;
        const debugLogEnabled = this.adapter.config.debugLogStates;

        // Pre-calculate common checks to avoid repeated string operations
        const startsWithUserdata = dp.startsWith('0_userdata.0');
        const startsWithAlias = dp.startsWith('alias.0');
        const startsWithNamespace = dp.startsWith(adapterNamespace);

        const entry = this.triggerDB[dp];

        // --- Trigger/ACK-Pfad ------------------------------------------------------
        if (entry?.state) {
            // Only create debug log if enabled to avoid string operations
            if (debugLogEnabled) {
                this.log.debug(`Trigger from ${dp} with state ${JSON.stringify(state)}`);
            }

            // Cache old values before updating (avoid object creation if not needed)
            const oldVal = entry.state.val;
            const oldAck = entry.state.ack;
            const oldTs = entry.state.ts;
            const oldFrom = entry.state.from;
            const oldLc = entry.state.lc;

            // Update triggerDB entry
            entry.ts = Date.now();
            entry.state = state;

            const isSystemOrAlias = startsWithUserdata || startsWithAlias || (!state.ack && startsWithNamespace);
            const mayTrigger = state.ack || entry.internal || isSystemOrAlias;

            if (mayTrigger) {
                // Cache array references to avoid repeated property access
                const to = entry.to;
                const toLength = to.length;

                // Early exit if no targets
                if (toLength === 0) {
                    return;
                }

                const changes = entry.change || [];
                const subscribed = entry.subscribed || [];
                const allowed = entry.triggerAllowed || [];
                const hasValChange = oldVal !== state.val;
                const hasAckChange = oldAck !== state.ack;

                // Only create oldState object if we have targets that need it
                let oldState: nsPanelState | undefined;

                for (let i = 0; i < toLength; i++) {
                    const target = to[i];

                    // Skip unloaded targets early
                    if (target.unload) {
                        continue;
                    }

                    // Check for changes efficiently
                    const hasChange = hasValChange || hasAckChange || changes[i] === 'ts';
                    if (!hasChange) {
                        if (debugLogEnabled) {
                            this.log.debug(`Ignore trigger from state ${dp} no change!`);
                        }
                        continue;
                    }

                    // Create oldState only when needed and once
                    if (!oldState) {
                        oldState = {
                            val: oldVal,
                            ack: oldAck,
                            from: oldFrom,
                            ts: oldTs,
                            lc: oldLc,
                        };
                    }

                    // Call target state change handler
                    await target.onStateChange(dp, { old: oldState, new: state });

                    // Check subscription and trigger permissions efficiently
                    const isSubscribed = target.neverDeactivateTrigger || subscribed[i];
                    const isAllowed = allowed[i];

                    if (!isSubscribed || !isAllowed) {
                        if (debugLogEnabled && i === toLength - 1) {
                            this.log.debug(`Ignore trigger from state ${dp} not subscribed or not allowed!`);
                            this.log.debug(
                                `c: ${target.name} !c.neverDeactivateTrigger: ${!target.neverDeactivateTrigger} && ` +
                                    `!subscribed[${i}]: ${!subscribed[i]} || !allowed[${i}]: ${!allowed[i]}`,
                            );
                        }
                        continue;
                    }

                    // Handle parent/direct trigger routing
                    const parent = target.parent;
                    if (parent && target.triggerParent && !parent.unload && !parent.sleep) {
                        await parent.onStateTriggerSuperDoNotOverride?.(dp, target);
                    } else {
                        await target.onStateTriggerSuperDoNotOverride?.(dp, target);
                    }
                }
            } else if (debugLogEnabled) {
                this.log.debug(`Ignore trigger from state ${dp} ack is false!`);
            }
        } else if (this.stateDB[dp]) {
            // Fast path for stateDB updates
            const stateEntry = this.stateDB[dp];
            stateEntry.state = state as ioBroker.State;
            stateEntry.ts = state.ts;
        }

        // --- Primitive-Update-Pfad (nur Nicht-Objekte) -----------------------------
        // Early primitive check to avoid unnecessary processing
        const v = state.val;
        if (v !== null && v !== undefined && typeof v === 'object') {
            return;
        }

        // Handle adapter namespace states efficiently
        if (!state.ack && startsWithNamespace) {
            // Cache namespace replacement to avoid repeated string operations
            const namespacePrefix = `${adapterNamespace}.`;
            const id = dp.slice(namespacePrefix.length); // More efficient than replace()
            const libState = this.library.readdb(id);

            if (libState) {
                this.library.setdb(id, {
                    ...libState,
                    val: this.isStateValue(state.val) ? state.val : null,
                    ts: state.ts,
                    ack: state.ack,
                });

                // Forward to panels only if writable and controller exists
                if (libState.obj?.common?.write && this.adapter.controller) {
                    const panels = this.adapter.controller.panels;
                    for (const panel of panels) {
                        await panel.onStateChange(id, state);
                    }
                }
            }
        }

        // System host notifications (less frequent, can stay as is)
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
                        this.log.error(
                            `Cannot write state ${item.options.dp} with value ${val}: ${typeof e === 'string' ? e : e.message}`,
                        );
                        // prevent further write attempts
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
            // if we change this onStateTrigger change 'ne' not work correcty
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
        if (!adapter.unload) {
            StatesControler.tempObjectDBTimeout = adapter.setTimeout(() => {
                if (adapter.unload) {
                    return;
                }
                StatesControler.tempObjectDBTimeout = undefined;
                StatesControler.TempObjectDB = { data: undefined, keys: [], enums: undefined };
            }, 20_000);
        }
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
    }): Promise<NSPanel.DataItemsOptions | undefined> {
        const { dpInit, role = '', enums = '', regexp, triggered, writeable, commonType = '' } = options;

        const status = { ok: true };
        let item: NSPanel.DataItemsOptions | undefined;
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
                    const d = t as NSPanel.DataItemsOptions;
                    let found = false;
                    if ((d.type !== 'triggered' && d.type !== 'state') || !d.mode || d.mode !== 'auto') {
                        continue;
                    }
                    if (tempObjectDB.keys.length === 0) {
                        this.log.warn(`Dont finds states for ${dpInit} dpinit is ${typeof dpInit}`);
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
