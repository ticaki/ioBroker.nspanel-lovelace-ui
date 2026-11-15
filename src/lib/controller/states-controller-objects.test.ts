/**
 * Live common of foreign states: object subscriptions per triggerDB entry, objectChange updates the display fields
 * of the caches, the structure stays frozen, the active receivers are redrawn although the value did not change.
 */
import { expect } from 'chai';
import { StatesControler } from './states-controller';
import { Dataitem } from './data-item';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import type { BaseTriggeredPage } from '../classes/baseClassPage';
import type { NSPanel } from '../types/NSPanel';

const NS = 'nspanel-lovelace-ui.0';

type Timer = { cb: () => void; ms: number; cleared: boolean; done: boolean };

/** test double of a page / page item */
type FakeTarget = {
    name: string;
    unload: boolean;
    sleep: boolean;
    neverDeactivateTrigger: boolean;
    triggerParent: boolean;
    parent: FakeTarget | undefined;
    basePanel: { name: string; unload: boolean };
    calls: string[];
    onStateTriggerSuperDoNotOverride: (dp: string, from: BaseTriggeredPage) => Promise<boolean>;
    onStateChange: () => Promise<void>;
};

type Env = {
    states: StatesControler;
    adapter: NspanelLovelaceUi;
    objects: Record<string, ioBroker.Object>;
    values: Record<string, ioBroker.StateValue>;
    objectSubs: (string | string[])[];
    objectUnsubs: (string | string[])[];
    written: [string, unknown][];
    logs: { info: string[]; warn: string[]; error: string[] };
    runTimers: () => Promise<void>;
    timers: Timer[];
};

/**
 * Builds a state object.
 *
 * @param id state id
 * @param common common of the state
 * @returns the object
 */
function stateObject(id: string, common: Partial<ioBroker.StateCommon>): ioBroker.Object {
    return {
        _id: id,
        type: 'state',
        common: { name: id, type: 'number', role: 'level', read: true, write: true, ...common },
        native: {},
    };
}

/**
 * A states controller on a fake adapter with an object and a state database.
 *
 * @param objects objects by id
 * @param values state values by id
 * @returns the environment
 */
function setupEnv(objects: Record<string, ioBroker.Object>, values: Record<string, ioBroker.StateValue> = {}): Env {
    const noop = (): void => undefined;
    const objectSubs: (string | string[])[] = [];
    const objectUnsubs: (string | string[])[] = [];
    const written: [string, unknown][] = [];
    const logs = { info: [] as string[], warn: [] as string[], error: [] as string[] };
    const timers: Timer[] = [];
    const adapter = {
        namespace: NS,
        unload: false,
        language: 'en',
        library: { getTranslation: (s: string): string => s },
        config: {},
        log: {
            silly: noop,
            debug: noop,
            info: (m: string): void => void logs.info.push(m),
            warn: (m: string): void => void logs.warn.push(m),
            error: (m: string): void => void logs.error.push(m),
        },
        setInterval: (): undefined => undefined,
        clearInterval: noop,
        setTimeout: (cb: () => void, ms: number): Timer => {
            const timer = { cb, ms, cleared: false, done: false };
            timers.push(timer);
            return timer;
        },
        clearTimeout: (t: Timer | undefined): void => {
            if (t) {
                t.cleared = true;
            }
        },
        getForeignObjectAsync: async (id: string): Promise<ioBroker.Object | null> =>
            objects[id] ? structuredClone(objects[id]) : null,
        getForeignStateAsync: async (id: string): Promise<ioBroker.State | null> =>
            id in values ? { val: values[id], ack: true, ts: 1, lc: 1, from: '' } : null,
        subscribeForeignStatesAsync: async (): Promise<void> => undefined,
        unsubscribeForeignStatesAsync: async (): Promise<void> => undefined,
        subscribeForeignObjectsAsync: async (p: string | string[]): Promise<void> => void objectSubs.push(p),
        unsubscribeForeignObjectsAsync: async (p: string | string[]): Promise<void> => void objectUnsubs.push(p),
        setForeignStateAsync: async (id: string, val: unknown): Promise<void> => void written.push([id, val]),
    } as unknown as NspanelLovelaceUi;
    const states = new StatesControler(adapter);
    const runTimers = async (): Promise<void> => {
        for (const timer of [...timers]) {
            if (!timer.cleared && !timer.done) {
                timer.done = true;
                timer.cb();
            }
        }
        // the callbacks start async work
        await new Promise(resolve => setImmediate(resolve));
    };
    return { states, adapter, objects, values, objectSubs, objectUnsubs, written, logs, runTimers, timers };
}

/**
 * A page or page item that records its triggers.
 *
 * @param name name
 * @param options overrides
 * @returns the fake
 */
function fakeTarget(name: string, options: Partial<FakeTarget> = {}): FakeTarget {
    const target: FakeTarget = {
        name,
        unload: false,
        sleep: false,
        neverDeactivateTrigger: false,
        triggerParent: false,
        parent: undefined,
        basePanel: { name: 'panel', unload: false },
        calls: [],
        onStateTriggerSuperDoNotOverride: async (dp: string): Promise<boolean> => {
            target.calls.push(dp);
            return true;
        },
        onStateChange: async (): Promise<void> => undefined,
        ...options,
    };
    return target;
}

/**
 * @param target fake
 * @returns the fake as receiver type
 */
function asPage(target: FakeTarget): BaseTriggeredPage {
    return target as unknown as BaseTriggeredPage;
}

/**
 * The changed object as the js-controller hands it over.
 *
 * @param env environment
 * @param id state id
 * @param common changed fields
 * @returns the new object
 */
function changeObject(env: Env, id: string, common: Partial<ioBroker.StateCommon>): ioBroker.Object {
    const obj = structuredClone(env.objects[id]);
    obj.common = { ...obj.common, ...common } as ioBroker.StateCommon;
    env.objects[id] = obj;
    return structuredClone(obj);
}

/**
 * @param list calls of subscribe/unsubscribe
 * @returns all ids of the calls
 */
function flat(list: (string | string[])[]): string[] {
    return list.flatMap(e => (Array.isArray(e) ? e : [e]));
}

const A = 'hm-rpc.0.dev.MODE';
const B = 'hm-rpc.0.dev.LEVEL';
const C = 'alias.0.dev.TEXT';

/**
 * @returns objects for the ids A, B, C
 */
function baseObjects(): Record<string, ioBroker.Object> {
    return {
        [A]: stateObject(A, { states: { 0: 'Aus', 1: 'An' }, unit: '' }),
        [B]: stateObject(B, { unit: '%', min: 0, max: 100 }),
        [C]: stateObject(C, { type: 'string', role: 'text' }),
    };
}

describe('lib/controller/states-controller - object subscriptions', () => {
    it('subscribes the objects of new triggers collected in one call, once per id', async () => {
        const env = setupEnv(baseObjects(), { [A]: 0, [B]: 10, [C]: 'x' });
        const p1 = fakeTarget('p1');
        const p2 = fakeTarget('p2', { basePanel: { name: 'panel2', unload: false } });
        await env.states.setTrigger(A, asPage(p1));
        await env.states.setTrigger(A, asPage(p2));
        await env.states.setTrigger(B, asPage(p1));
        await env.states.setTrigger(C, asPage(p2));
        expect(env.objectSubs, 'collected, not sent yet').to.deep.equal([]);
        await env.runTimers();
        expect(env.objectSubs).to.deep.equal([[A, B, C]]);
        // another receiver of a known id subscribes nothing
        await env.states.setTrigger(B, asPage(p2));
        await env.runTimers();
        expect(env.objectSubs).to.have.length(1);
    });

    it('unsubscribes when deletePageLoop removes the entry, not while another receiver is left', async () => {
        const env = setupEnv(baseObjects(), { [A]: 0, [B]: 10 });
        const p1 = fakeTarget('p1');
        const p2 = fakeTarget('p2');
        await env.states.setTrigger(A, asPage(p1));
        await env.states.setTrigger(A, asPage(p2));
        await env.states.setTrigger(B, asPage(p1));
        await env.states.flushObjectSubscriptions();
        p1.unload = true;
        await env.states.deletePageLoop();
        await env.runTimers();
        expect(flat(env.objectUnsubs)).to.deep.equal([B]);
        p2.unload = true;
        await env.states.deletePageLoop();
        await env.runTimers();
        expect(flat(env.objectUnsubs)).to.deep.equal([B, A]);
    });

    it('does not depend on activating and deactivating the receivers', async () => {
        const env = setupEnv(baseObjects(), { [A]: 0 });
        const p1 = fakeTarget('p1');
        await env.states.setTrigger(A, asPage(p1));
        await env.states.flushObjectSubscriptions();
        await env.states.activateTrigger(asPage(p1));
        await env.states.deactivateTrigger(asPage(p1));
        await env.states.activateTrigger(asPage(p1));
        await env.runTimers();
        expect(env.objectSubs).to.deep.equal([[A]]);
        expect(env.objectUnsubs).to.deep.equal([]);
    });

    it('a removed and added again id before the queue is sent causes no call', async () => {
        const env = setupEnv(baseObjects(), { [A]: 0 });
        const p1 = fakeTarget('p1');
        await env.states.setTrigger(A, asPage(p1));
        await env.states.flushObjectSubscriptions();
        p1.unload = true;
        await env.states.deletePageLoop();
        const p2 = fakeTarget('p2');
        await env.states.setTrigger(A, asPage(p2));
        await env.runTimers();
        expect(env.objectSubs).to.deep.equal([[A]]);
        expect(env.objectUnsubs).to.deep.equal([]);
    });

    it('subscribes no object of internal states and of the own namespace', async () => {
        const own = `${NS}.panels.p.alarm.approve`;
        const env = setupEnv({ ...baseObjects(), [own]: stateObject(own, { type: 'boolean', role: 'switch' }) });
        const p1 = fakeTarget('p1');
        await env.states.setTrigger(own, asPage(p1));
        await env.states.setInternalState('panel/cmd/x', 1, false, {
            name: 'x',
            type: 'number',
            role: 'value',
            read: true,
            write: true,
        });
        await env.runTimers();
        expect(env.objectSubs).to.deep.equal([]);
    });
});

describe('lib/controller/states-controller - objectChange', () => {
    it('updates the display fields of triggerDB and stateDB', async () => {
        const env = setupEnv(baseObjects(), { [A]: 0, [B]: 10 });
        const p1 = fakeTarget('p1');
        await env.states.setTrigger(A, asPage(p1));
        // B only read: stateDB
        await env.states.getState(B);
        await env.states.flushObjectSubscriptions();

        env.states.onObjectChange(A, changeObject(env, A, { states: { 0: 'Off', 1: 'On', 2: 'Auto' } }));
        expect(await env.states.getCommonStates(A)).to.deep.equal({ 0: 'Off', 1: 'On', 2: 'Auto' });
        expect(env.states.objectDatabase[A]?.common.states).to.deep.equal({ 0: 'Off', 1: 'On', 2: 'Auto' });

        env.states.onObjectChange(B, changeObject(env, B, { unit: 'pct', max: 255, name: 'Level' }));
        const live = env.states.getLiveCommon(B);
        expect(live?.unit).to.equal('pct');
        expect(live?.max).to.equal(255);
        expect(live?.name).to.equal('Level');
    });

    it('removes a display field that is gone', async () => {
        const env = setupEnv(baseObjects(), { [A]: 0 });
        await env.states.setTrigger(A, asPage(fakeTarget('p1')));
        const obj = changeObject(env, A, {});
        delete (obj.common as Partial<ioBroker.StateCommon>).states;
        env.states.onObjectChange(A, obj);
        expect(await env.states.getCommonStates(A)).to.equal(null);
    });

    it('keeps the structure fields and reports their change once', async () => {
        const env = setupEnv(baseObjects(), { [A]: 0 });
        await env.states.setTrigger(A, asPage(fakeTarget('p1')));
        env.states.onObjectChange(A, changeObject(env, A, { type: 'string', role: 'text', write: false }));
        env.states.onObjectChange(A, changeObject(env, A, { role: 'value' }));
        expect(env.states.getType(A)).to.equal('number');
        expect(env.states.getLiveCommon(A)?.role).to.equal('level');
        expect(env.states.getLiveCommon(A)?.write).to.equal(true);
        expect(env.logs.info.filter(m => m.includes(A))).to.have.length(1);
    });

    it('changes nothing for a deleted object and warns once', async () => {
        const env = setupEnv(baseObjects(), { [A]: 0 });
        const p1 = fakeTarget('p1');
        await env.states.setTrigger(A, asPage(p1));
        await env.states.activateTrigger(asPage(p1));
        env.states.onObjectChange(A, null);
        env.states.onObjectChange(A, null);
        expect(await env.states.getCommonStates(A)).to.deep.equal({ 0: 'Aus', 1: 'An' });
        expect(env.logs.warn.filter(m => m.includes(A))).to.have.length(1);
        await env.runTimers();
        expect(p1.calls).to.deep.equal([]);
    });

    it('ignores objects that are not its own', async () => {
        const env = setupEnv(baseObjects());
        env.states.onObjectChange('system.adapter.x.0', null);
        env.states.onObjectChange(A, changeObject(env, A, { unit: 'x' }));
        expect(env.logs.warn).to.deep.equal([]);
        expect(env.states.objectDatabase[A]).to.equal(undefined);
    });

    it('redraws the active receivers once after several changes, although the value is the same', async () => {
        const env = setupEnv(baseObjects(), { [A]: 0 });
        const active = fakeTarget('active');
        const inactive = fakeTarget('inactive');
        const persistent = fakeTarget('persistent', { neverDeactivateTrigger: true });
        const parent = fakeTarget('page');
        const child = fakeTarget('child', { parent, triggerParent: true });
        await env.states.setTrigger(A, asPage(active));
        await env.states.setTrigger(A, asPage(inactive));
        await env.states.setTrigger(A, asPage(persistent));
        await env.states.setTrigger(A, asPage(child));
        await env.states.activateTrigger(asPage(active));
        await env.states.activateTrigger(asPage(child));
        await env.states.flushObjectSubscriptions();

        // a state change with the same value triggers nobody
        await env.states.onStateChange(A, { val: 0, ack: true, ts: 1, lc: 1, from: '' });
        expect([active, inactive, persistent, parent, child].flatMap(t => t.calls)).to.deep.equal([]);

        env.states.onObjectChange(A, changeObject(env, A, { states: { 0: 'Off', 1: 'On' } }));
        env.states.onObjectChange(A, changeObject(env, A, { states: { 0: 'Zu', 1: 'Auf' } }));
        env.states.onObjectChange(A, changeObject(env, A, { states: { 0: 'Zu', 1: 'Auf' }, unit: 'x' }));
        const pending = env.timers.filter(t => !t.cleared && t.ms === StatesControler.OBJECT_CHANGE_DEBOUNCE_MS);
        expect(pending, 'debounced to one timer').to.have.length(1);
        expect(active.calls).to.deep.equal([]);

        await env.runTimers();
        expect(active.calls).to.deep.equal([A]);
        expect(persistent.calls).to.deep.equal([A]);
        expect(parent.calls, 'the parent of a triggerParent item').to.deep.equal([A]);
        expect(child.calls).to.deep.equal([]);
        expect(inactive.calls).to.deep.equal([]);
    });

    it('does not redraw when only a structure field changed', async () => {
        const env = setupEnv(baseObjects(), { [A]: 0 });
        const active = fakeTarget('active');
        await env.states.setTrigger(A, asPage(active));
        await env.states.activateTrigger(asPage(active));
        env.states.onObjectChange(A, changeObject(env, A, { role: 'value' }));
        await env.runTimers();
        expect(active.calls).to.deep.equal([]);
    });

    it('the periodic cleanup of the object cache does not lose a changed common', async () => {
        const env = setupEnv(baseObjects(), { [A]: 0 });
        await env.states.setTrigger(A, asPage(fakeTarget('p1')));
        env.states.onObjectChange(A, changeObject(env, A, { states: { 0: 'Neu' } }));
        env.states.objectDatabase = {};
        expect(await env.states.getCommonStates(A)).to.deep.equal({ 0: 'Neu' });
    });
});

describe('lib/controller/data-item - common', () => {
    /**
     * @param env environment
     * @param options data item options
     * @param parent receiver
     * @returns the data item
     */
    async function item(env: Env, options: NSPanel.DataItemsOptions, parent: FakeTarget): Promise<Dataitem> {
        const created = await Dataitem.create(env.adapter, options, asPage(parent), env.states);
        expect(created, 'data item is valid').to.not.equal(null);
        return created as Dataitem;
    }

    it('keeps the structure frozen and shows the display fields live', async () => {
        const env = setupEnv(baseObjects(), { [B]: 10 });
        const dataitem = await item(env, { type: 'triggered', dp: B }, fakeTarget('p1'));
        expect(dataitem.common.unit).to.equal('%');
        env.states.onObjectChange(
            B,
            changeObject(env, B, {
                unit: '°C',
                min: -10,
                max: 40,
                step: 0.5,
                type: 'string',
                role: 'text',
                write: false,
            }),
        );
        expect(dataitem.common.unit).to.equal('°C');
        expect(dataitem.common.min).to.equal(-10);
        expect(dataitem.common.max).to.equal(40);
        expect(dataitem.common.step).to.equal(0.5);
        expect(dataitem.common.type).to.equal('number');
        expect(dataitem.common.role).to.equal('level');
        expect(dataitem.common.write).to.equal(true);
        expect(dataitem.writeable).to.equal(true);
        expect(dataitem.type).to.equal('number');
        expect(dataitem.options.role).to.equal('level');
        expect(dataitem.trueType()).to.equal('number');
    });

    it('follows the object cache for a state that is only read', async () => {
        const env = setupEnv(baseObjects(), { [B]: 10 });
        const dataitem = await item(env, { type: 'state', dp: B }, fakeTarget('p1'));
        expect(dataitem.common.unit).to.equal('%');
        env.states.onObjectChange(B, changeObject(env, B, { unit: 'W' }));
        expect(dataitem.common.unit).to.equal('W');
    });

    it('a failed write switches write off in common as before', async () => {
        const env = setupEnv(baseObjects(), { [B]: 10 });
        const dataitem = await item(env, { type: 'state', dp: B }, fakeTarget('p1'));
        dataitem.writeable = false;
        expect(dataitem.common.write).to.equal(false);
        expect(dataitem.common.unit).to.equal('%');
    });
});

describe('lib/controller/data-item - option commonStates', () => {
    const MODE = 'hm-rpc.0.ac.MODE';

    /**
     * @param common common of MODE
     * @param val value of MODE
     * @returns environment
     */
    function modeEnv(common: Partial<ioBroker.StateCommon>, val: ioBroker.StateValue): Env {
        return setupEnv({ [MODE]: stateObject(MODE, common) }, { [MODE]: val });
    }

    /**
     * @param env environment
     * @param commonStates the option
     * @param type data item type
     * @returns the data item
     */
    async function modeItem(
        env: Env,
        commonStates: NSPanel.DataItemCommonStates,
        type: 'state' | 'triggered' = 'triggered',
    ): Promise<Dataitem> {
        const created = await Dataitem.create(
            env.adapter,
            type === 'state' ? { type, dp: MODE, commonStates } : { type, dp: MODE, commonStates },
            asPage(fakeTarget('item')),
            env.states,
        );
        expect(created).to.not.equal(null);
        return created as Dataitem;
    }

    /**
     * @param env environment
     * @param common changed fields
     */
    function change(env: Env, common: Partial<ioBroker.StateCommon>): void {
        env.states.onObjectChange(MODE, changeObject(env, MODE, common));
    }

    it('text with keepValue (cardThermo2 MODE): current text, unknown value as it is', async () => {
        const env = modeEnv({ states: { 0: 'Aus', 1: 'Heizen' } }, 1);
        const item = await modeItem(env, { mode: 'text', keepValue: true });
        expect(await item.getString()).to.equal('Heizen');
        change(env, { states: { 0: 'Off', 1: 'Heat' } });
        expect(await item.getString()).to.equal('Heat');
        // inactive trigger: the value comes from the short-lived read cache
        env.states.timespan = 0;
        env.values[MODE] = 5;
        expect(await item.getString()).to.equal('5');
    });

    it('text with default list (cardThermo2 modeId): built-in list until the datapoint has states', async () => {
        const env = modeEnv({}, 2);
        const item = await modeItem(env, { mode: 'text', defaultStates: ['OFF', 'AUTO', 'COOL'] });
        expect((await item.getState())?.val).to.equal('COOL');
        change(env, { states: { 2: 'Kühlen' } });
        expect((await item.getState())?.val).to.equal('Kühlen');
        change(env, { states: { 0: 'Aus' } });
        expect((await item.getState())?.val, 'unknown value without fallback').to.equal(undefined);
    });

    it('list (fan valueList/valueList2): keys and texts of the current states', async () => {
        const env = modeEnv({ states: ['Low', 'High'] }, 0);
        const keys = await modeItem(env, { mode: 'list', part: 'keys' }, 'state');
        const texts = await modeItem(env, { mode: 'list', part: 'values' }, 'state');
        expect(await keys.getObject()).to.deep.equal(['0', '1']);
        expect(await texts.getObject()).to.deep.equal(['Low', 'High']);
        // the fan reads MODE triggered as entityInSel - that entry gets the object changes
        await env.states.setTrigger(MODE, asPage(fakeTarget('fan')));
        change(env, { states: { 1: 'Eco', 3: 'Turbo' } });
        expect(await keys.getObject()).to.deep.equal(['1', '3']);
        expect(await texts.getObject()).to.deep.equal(['Eco', 'Turbo']);
    });

    it('token (airCondition buttons): compares and writes the current value of the token', async () => {
        const env = modeEnv({ states: { 0: 'OFF', 2: 'COOL' } }, 2);
        const option: NSPanel.DataItemCommonStates = { mode: 'token', token: 'COOL', defaultStates: ['OFF'] };
        const value = await modeItem(env, option);
        const set = await modeItem(env, option, 'state');
        expect(await value.getBoolean()).to.equal(true);
        await set.setState(true);
        expect(env.written).to.deep.equal([[MODE, 2]]);

        change(env, { states: { 0: 'OFF', 7: 'COOL' } });
        expect(await value.getBoolean(), 'MODE is still 2').to.equal(false);
        await set.setState(true);
        expect(env.written[1]).to.deep.equal([MODE, 7]);
    });

    it('token without states uses the default list', async () => {
        const env = modeEnv({}, 1);
        const option: NSPanel.DataItemCommonStates = { mode: 'token', token: 'AUTO', defaultStates: ['OFF', 'AUTO'] };
        const value = await modeItem(env, option);
        const set = await modeItem(env, option, 'state');
        expect(await value.getBoolean()).to.equal(true);
        await set.setState(true);
        expect(env.written).to.deep.equal([[MODE, 1]]);
    });

    it('token of a string MODE writes the key', async () => {
        const env = modeEnv({ type: 'string', states: { off: 'OFF', cool: 'COOL' } }, 'cool');
        const option: NSPanel.DataItemCommonStates = { mode: 'token', token: 'COOL' };
        const value = await modeItem(env, option);
        const set = await modeItem(env, option, 'state');
        expect(await value.getBoolean()).to.equal(true);
        await set.setState(true);
        expect(env.written).to.deep.equal([[MODE, 'cool']]);
    });

    it('token that is gone: writes nothing and warns once', async () => {
        const env = modeEnv({ states: { 0: 'OFF', 2: 'COOL' } }, 2);
        const option: NSPanel.DataItemCommonStates = { mode: 'token', token: 'COOL' };
        const value = await modeItem(env, option);
        const set = await modeItem(env, option, 'state');
        change(env, { states: { 0: 'OFF', 1: 'HEAT' } });
        await set.setState(true);
        await set.setState(true);
        expect(env.written).to.deep.equal([]);
        expect(env.logs.warn.filter(m => m.includes('COOL'))).to.have.length(1);
        expect(await value.getBoolean()).to.equal(false);
    });
});
