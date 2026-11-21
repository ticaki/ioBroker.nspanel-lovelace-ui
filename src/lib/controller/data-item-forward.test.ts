/**
 * The panel's own states `panels.<panel>.cmd.power1/power2/TasmotaRestart` as data points: a data item of the same
 * panel uses the internal state `<panel>/cmd/<name>` instead (the adapter does not subscribe its own states), other
 * states stay as they are.
 */
import { expect } from 'chai';
import { StatesControler } from './states-controller';
import { Dataitem } from './data-item';
import { Panel } from './panel';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import type { BaseTriggeredPage } from '../classes/baseClassPage';
import type { NSPanel } from '../types/NSPanel';

const NS = 'nspanel-lovelace-ui.0';

type Env = {
    states: StatesControler;
    adapter: NspanelLovelaceUi;
    page: BaseTriggeredPage;
    warns: string[];
    commands: [string, NSPanel.StateValue | undefined, boolean | undefined][];
};

/**
 * @param v candidate
 * @returns true if it can stand in for the adapter
 */
function isAdapter(v: unknown): v is NspanelLovelaceUi {
    return typeof v === 'object' && v !== null && 'namespace' in v && 'setTimeout' in v && 'log' in v;
}

/**
 * @param v candidate
 * @returns true if it can stand in for a page
 */
function isPage(v: unknown): v is BaseTriggeredPage {
    return typeof v === 'object' && v !== null && 'onStateTriggerSuperDoNotOverride' in v && 'basePanel' in v;
}

/**
 * A states controller with the internal states of panel `panel` and a page of that panel.
 *
 * @returns the environment
 */
async function setupEnv(): Promise<Env> {
    const noop = (): void => undefined;
    const warns: string[] = [];
    const commands: Env['commands'] = [];
    const fake = {
        namespace: NS,
        unload: false,
        language: 'en',
        library: { getTranslation: (s: string): string => s },
        config: {},
        log: { silly: noop, debug: noop, info: noop, warn: (m: string): void => void warns.push(m), error: noop },
        setInterval: (): undefined => undefined,
        clearInterval: noop,
        setTimeout: (): undefined => undefined,
        clearTimeout: noop,
        getForeignObjectAsync: async (): Promise<ioBroker.Object | null> => null,
        getForeignStateAsync: async (): Promise<ioBroker.State | null> => null,
        subscribeForeignStatesAsync: async (): Promise<void> => undefined,
        unsubscribeForeignStatesAsync: async (): Promise<void> => undefined,
        subscribeForeignObjectsAsync: async (): Promise<void> => undefined,
        unsubscribeForeignObjectsAsync: async (): Promise<void> => undefined,
        setForeignStateAsync: async (): Promise<void> => undefined,
    };
    if (!isAdapter(fake)) {
        throw new Error('fake adapter incomplete');
    }
    const states = new StatesControler(fake);
    const common: ioBroker.StateCommon = { name: '', type: 'boolean', role: 'switch', read: true, write: true };
    for (const id of ['panel/cmd/power1', 'panel/cmd/power2', 'panel/cmd/TasmotaRestart', 'panel/cmd/dimActive']) {
        await states.setInternalState(id, false, true, common, async (dp, state) => {
            commands.push([dp, state?.val, state?.ack]);
            return null;
        });
    }
    const fakePage = {
        name: 'page',
        unload: false,
        sleep: false,
        neverDeactivateTrigger: false,
        triggerParent: false,
        parent: undefined,
        basePanel: { name: 'panel', unload: false },
        onStateTriggerSuperDoNotOverride: async (): Promise<boolean> => true,
        onStateChange: async (): Promise<void> => undefined,
    };
    if (!isPage(fakePage)) {
        throw new Error('fake page incomplete');
    }
    return { states, adapter: fake, page: fakePage, warns, commands };
}

describe('Dataitem - own panel cmd states', () => {
    it('forwards cmd.power1 of the own panel to the internal state and keeps read/write', async () => {
        const env = await setupEnv();
        const item = await Dataitem.create(
            env.adapter,
            { type: 'triggered', dp: `${NS}.panels.panel.cmd.power1`, read: 'return !val;', change: 'ts' },
            env.page,
            env.states,
        );
        expect(item).to.not.equal(null);
        expect(item?.options).to.include({
            type: 'internal',
            dp: 'panel/cmd/power1',
            read: 'return !val;',
            change: 'ts',
        });
        expect(env.warns).to.deep.equal([]);
        expect(item?.writeable).to.equal(true);

        await item?.setState(true);
        expect(env.commands).to.deep.include(['panel/cmd/power1', true, false]);
    });

    it('forwards cmd.power2 and cmd.TasmotaRestart of type state', async () => {
        const env = await setupEnv();
        for (const cmd of ['power2', 'TasmotaRestart']) {
            const item = await Dataitem.create(
                env.adapter,
                { type: 'state', dp: `${NS}.panels.panel.cmd.${cmd}` },
                env.page,
                env.states,
            );
            expect(item?.options).to.include({ type: 'internal', dp: `panel/cmd/${cmd}` });
        }
        expect(env.warns).to.deep.equal([]);
    });

    it('leaves cmd.power1 of another panel unchanged', () => {
        const env = setupEnvSync();
        const item = new Dataitem(
            env.adapter,
            { type: 'state', dp: `${NS}.panels.other.cmd.power1` },
            env.page,
            env.states,
        );
        expect(item.options).to.include({ type: 'state', dp: `${NS}.panels.other.cmd.power1` });
    });

    it('leaves other own states unchanged', () => {
        const env = setupEnvSync();
        for (const dp of [
            `${NS}.panels.panel.cmd.dimActive`,
            `${NS}.panels.panel.cmd.dim.active`,
            `${NS}.panels.panel.cmd.power1.x`,
            `${NS}.panels.panelx.cmd.power1`,
            `nspanel-lovelace-ui.1.panels.panel.cmd.power1`,
        ]) {
            const item = new Dataitem(env.adapter, { type: 'triggered', dp }, env.page, env.states);
            expect(item.options).to.include({ type: 'triggered', dp });
        }
    });

    it('does not forward without a panel', () => {
        const env = setupEnvSync();
        const page = { ...env.page, basePanel: undefined };
        if (!isPage(page)) {
            throw new Error('fake page incomplete');
        }
        const item = new Dataitem(
            env.adapter,
            { type: 'state', dp: `${NS}.panels.panel.cmd.power1` },
            page,
            env.states,
        );
        expect(item.options).to.include({ type: 'state', dp: `${NS}.panels.panel.cmd.power1` });
    });
});

/**
 * The environment without the internal states (the constructor needs none).
 *
 * @returns adapter, states controller and page
 */
function setupEnvSync(): Pick<Env, 'adapter' | 'states' | 'page'> {
    const noop = (): void => undefined;
    const fake = {
        namespace: NS,
        unload: false,
        config: {},
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        setInterval: (): undefined => undefined,
        clearInterval: noop,
        setTimeout: (): undefined => undefined,
        clearTimeout: noop,
    };
    if (!isAdapter(fake)) {
        throw new Error('fake adapter incomplete');
    }
    const fakePage = {
        name: 'page',
        basePanel: { name: 'panel' },
        onStateTriggerSuperDoNotOverride: async (): Promise<boolean> => true,
    };
    if (!isPage(fakePage)) {
        throw new Error('fake page incomplete');
    }
    return { adapter: fake, states: new StatesControler(fake), page: fakePage };
}

describe('Panel - internal cmd/power1/power2 give the relay state', () => {
    /**
     * A panel `p` (without constructor) whose internal relay states are registered in a real states controller,
     * with handleInternalCommand as function like onInternalCommand.
     *
     * @returns panel, states controller, data item environment and the Tasmota commands
     */
    async function setupPanel(): Promise<{ panel: any; env: Env; tasmota: [string, string][] }> {
        const env = await setupEnv();
        const tasmota: [string, string][] = [];
        const panel: any = Object.create(Panel.prototype);
        Object.assign(panel, {
            name: 'p',
            topic: 'ns_panel',
            relay: { power1: null, power2: null },
            controller: { panels: [] },
            statesControler: env.states,
            library: { writedp: async (): Promise<void> => undefined },
            sendToTasmota: (topic: string, payload: string): void => void tasmota.push([topic, payload]),
        });
        Object.defineProperty(panel, 'isVirtual', { value: false });
        const common: ioBroker.StateCommon = { name: '', type: 'boolean', role: 'switch', read: true, write: true };
        for (const id of ['p/cmd/power1', 'p/cmd/power2']) {
            await env.states.setInternalState(id, false, true, common, (dp, state) =>
                panel.handleInternalCommand(dp, state),
            );
        }
        return { panel, env, tasmota };
    }

    it('null until Tasmota reported, then the state of stat/POWER1/2', async () => {
        const { panel, env } = await setupPanel();
        expect((await env.states.getState('p/cmd/power1'))?.val).to.equal(null);

        await panel.onRelayState('power1', true);
        await panel.onRelayState('power2', false);
        expect((await env.states.getState('p/cmd/power1'))?.val).to.equal(true);
        expect((await env.states.getState('p/cmd/power2'))?.val).to.equal(false);

        const page = { ...env.page, basePanel: { name: 'p', unload: false } };
        if (!isPage(page)) {
            throw new Error('fake page incomplete');
        }
        const item = await Dataitem.create(
            env.adapter,
            { type: 'triggered', dp: `${NS}.panels.p.cmd.power1` },
            page,
            env.states,
        );
        expect(await item?.getBoolean()).to.equal(true);

        await panel.onRelayState('power1', false);
        expect(await item?.getBoolean()).to.equal(false);
    });

    it('writing the data item sends cmnd/POWER1', async () => {
        const { panel, env, tasmota } = await setupPanel();
        await panel.onRelayState('power1', false);
        const page = { ...env.page, basePanel: { name: 'p', unload: false } };
        if (!isPage(page)) {
            throw new Error('fake page incomplete');
        }
        const item = await Dataitem.create(
            env.adapter,
            { type: 'state', dp: `${NS}.panels.p.cmd.power1` },
            page,
            env.states,
        );
        await item?.setState(true);
        expect(tasmota).to.deep.equal([['ns_panel/cmnd/POWER1', 'ON']]);
    });
});
