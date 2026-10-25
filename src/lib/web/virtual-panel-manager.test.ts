import { expect } from 'chai';
import type { Controller } from '../controller/controller';
import type { Panel, panelConfigPartial } from '../controller/panel';
import type { PanelChannel } from '../classes/panel-channel';
import {
    VirtualPanelManager,
    type WebClient,
    legacyWebPanelTree,
    removeLegacyWebPanelTrees,
} from './virtual-panel-manager';
import type { ServerFrame } from './web-protocol';

const REAL_TOPIC = 'emu_topic';
const REAL_ID = 'D4_8A_FC_9F_64_60';
const WEB_TOPIC = 'webtest';
const WEB_ID = 'web_0123456789ab';

type FakePanel = {
    name: string;
    friendlyName: string;
    topic: string;
    isVirtual: boolean;
    isClone: boolean;
    unload: boolean;
    isOnline: boolean;
    info: { nspanel: { model: string } };
    panelSend: { resetMessageDB: () => void };
    queueResets: number;
    channel: PanelChannel;
    acks: number;
    received: string[];
    sent: string[];
};

type Timer = { fn: () => void; ms: number; cleared: boolean };

function fakeAdapter(panels: any[]): any {
    const noop = (): void => undefined;
    const logs: string[] = [];
    const timers: Timer[] = [];
    return {
        logs,
        timers,
        log: {
            silly: noop,
            debug: noop,
            info: (m: string) => logs.push(`info:${m}`),
            warn: (m: string) => logs.push(`warn:${m}`),
            error: (m: string) => logs.push(`error:${m}`),
        },
        config: { debugLogMqtt: false, useBetaTFT: false, panels },
        unload: false,
        namespace: 'nspanel-lovelace-ui.0',
        library: { cleandp: (s: string) => s, cleanUpTree: async () => undefined },
        setTimeout: (fn: () => void, ms: number) => {
            const t: Timer = { fn, ms, cleared: false };
            timers.push(t);
            return t;
        },
        clearTimeout: (t: Timer) => {
            t.cleared = true;
        },
    };
}

/**
 * A controller that creates fake panels which, like the real Panel, subscribe to tele/# and stat/# of their channel.
 *
 * @param adapter the fake adapter (its panel table is used for id lookups)
 * @param realPanels configurations the controller knows (what getPanelConfig returns)
 */
function fakeController(adapter: any, realPanels: Partial<panelConfigPartial>[]): any {
    const ctrl: any = {
        panels: [] as FakePanel[],
        virtualPanelManager: undefined,
        globalPanelInfo: { availableTftFirmwareVersion: { tft: '5.1.1' }, availableTasmotaFirmwareVersion: '' },
        getPanelConfig: (topicOrId: string) => {
            const topic = adapter.config.panels.find((p: any) => p.id === topicOrId)?.topic ?? topicOrId;
            return realPanels.find(p => p.topic === topic);
        },
        createPanel: async (config: Partial<panelConfigPartial>, channel: PanelChannel): Promise<FakePanel> => {
            const panel: FakePanel = {
                name: config.name!,
                friendlyName: config.friendlyName ?? config.name!,
                topic: config.topic!,
                isVirtual: config.kind === 'web',
                isClone: config.kind === 'web' && !!config.sourceTopic,
                unload: false,
                isOnline: true,
                info: { nspanel: { model: config.model ?? 'eu' } },
                panelSend: {
                    resetMessageDB: (): void => {
                        panel.queueResets++;
                    },
                },
                queueResets: 0,
                channel,
                acks: 0,
                received: [],
                sent: [],
            };
            await channel.subscribe(`${panel.topic}/tele/#`, async (_t, message) => {
                panel.received.push(JSON.parse(message).CustomRecv);
            });
            await channel.subscribe(`${panel.topic}/stat/#`, async () => {
                panel.acks++;
            });
            ctrl.panels.push(panel);
            return panel;
        },
        addVirtualPanel: async (config: Partial<panelConfigPartial>, channel: PanelChannel) =>
            ctrl.createPanel(config, channel),
        removePanel: async (panel: FakePanel) => {
            ctrl.panels = ctrl.panels.filter((p: FakePanel) => p !== panel);
            panel.unload = true;
        },
    };
    return ctrl;
}

function client(): WebClient & { frames: ServerFrame[]; closed: string[] } {
    const c = {
        frames: [] as ServerFrame[],
        closed: [] as string[],
        send: (frame: ServerFrame): void => {
            c.frames.push(frame);
        },
        close: (reason: string): void => {
            c.closed.push(reason);
        },
    };
    return c;
}

function setup(): { adapter: any; ctrl: any; manager: VirtualPanelManager; real: FakePanel } {
    const adapter = fakeAdapter([
        { name: 'emu', topic: REAL_TOPIC, id: REAL_ID, ip: '1.2.3.4', model: 'eu' },
        { name: 'Webtest', topic: WEB_TOPIC, id: WEB_ID, ip: '', model: 'eu', kind: 'web' },
    ]);
    const realConfig: Partial<panelConfigPartial> = { topic: REAL_TOPIC, name: REAL_ID, pages: [], navigation: [] };
    const ctrl = fakeController(adapter, [realConfig, { topic: WEB_TOPIC, name: WEB_ID }]);
    const manager = new VirtualPanelManager(adapter, ctrl as Controller);
    const real: FakePanel = {
        name: REAL_ID,
        friendlyName: 'emu',
        topic: REAL_TOPIC,
        isVirtual: false,
        isClone: false,
        unload: false,
        isOnline: true,
        info: { nspanel: { model: 'eu' } },
        panelSend: { resetMessageDB: (): void => undefined },
        queueResets: 0,
        channel: {} as PanelChannel,
        acks: 0,
        received: [],
        sent: [],
    };
    ctrl.panels.push(real);
    return { adapter, ctrl, manager, real };
}

describe('lib/web/virtual-panel-manager - clones', () => {
    it('creates one clone per endpoint, shared by every browser, with the tree of the hardware panel', async () => {
        const { ctrl, manager } = setup();
        const a = client();
        const b = client();
        const entryA = await manager.attach(REAL_TOPIC, a);
        const entryB = await manager.attach(REAL_ID, b);
        expect(entryA).to.not.equal(undefined);
        expect(entryB).to.equal(entryA);
        const clones = ctrl.panels.filter((p: FakePanel) => p.isVirtual);
        expect(clones.length).to.equal(1);
        expect(clones[0].name).to.equal(REAL_ID);
        expect(clones[0].friendlyName).to.equal('emu (Web)');
        expect(clones[0].topic).to.equal(`${REAL_TOPIC}/web`);
        expect(clones[0].isClone).to.equal(true);
        expect(a.frames[0]).to.deep.equal({
            t: 'hello',
            model: 'eu',
            topic: REAL_TOPIC,
            name: REAL_ID,
            friendlyName: 'emu (Web)',
            tftVersion: '5.1.1',
            kind: 'clone',
        });
        expect(b.frames[0]).to.deep.equal(a.frames[0]);
        expect(manager.listPanels()).to.deep.equal([
            { topic: REAL_TOPIC, id: REAL_ID, name: 'emu', model: 'eu', kind: 'tasmota', clients: 2 },
            { topic: WEB_TOPIC, id: WEB_ID, name: 'Webtest', model: 'eu', kind: 'web', clients: 0 },
        ]);
    });

    it('broadcasts cmd with a running seq and buzzer to all browsers, acks once per seq', async () => {
        const { ctrl, manager } = setup();
        const a = client();
        const b = client();
        const entry = (await manager.attach(REAL_TOPIC, a))!;
        await manager.attach(REAL_TOPIC, b);
        const clone: FakePanel = ctrl.panels.find((p: FakePanel) => p.isVirtual);
        await entry.channel.publish(`${REAL_TOPIC}/web/cmnd/CustomSend`, 'pageType~screensaver');
        await entry.channel.publish(`${REAL_TOPIC}/web/cmnd/CustomSend`, 'time~12:00');
        await entry.channel.publish(`${REAL_TOPIC}/web/cmnd/Buzzer`, '1,1,1');
        expect(a.frames.slice(1)).to.deep.equal([
            { t: 'cmd', p: 'pageType~screensaver', seq: 1 },
            { t: 'cmd', p: 'time~12:00', seq: 2 },
            { t: 'buzzer', p: '1,1,1' },
        ]);
        expect(b.frames.slice(1)).to.deep.equal(a.frames.slice(1));
        // both browsers ack seq 1 - the panel gets one Done
        await manager.onClientFrame(entry, { t: 'ack', seq: 1 });
        await manager.onClientFrame(entry, { t: 'ack', seq: 1 });
        expect(clone.acks).to.equal(1);
        // unknown seq is ignored, ack without seq is passed on
        await manager.onClientFrame(entry, { t: 'ack', seq: 99 });
        expect(clone.acks).to.equal(1);
        await manager.onClientFrame(entry, { t: 'ack' });
        expect(clone.acks).to.equal(2);
        await manager.onClientFrame(entry, { t: 'ack', seq: 2 });
        expect(clone.acks).to.equal(3);
        // recv of every browser is injected
        await manager.onClientFrame(entry, { t: 'recv', p: 'event,startup,55,eu,5.1.1' });
        await manager.onClientFrame(entry, { t: 'recv', p: 'event,buttonPress2,x,bExit' });
        expect(clone.received).to.deep.equal(['event,startup,55,eu,5.1.1', 'event,buttonPress2,x,bExit']);
    });

    it('keeps the clone after the last browser left and removes it when the grace period is over', async () => {
        const { adapter, ctrl, manager } = setup();
        const a = client();
        const b = client();
        const entry = (await manager.attach(REAL_TOPIC, a))!;
        await manager.attach(REAL_TOPIC, b);
        const clone: FakePanel = ctrl.panels.find((p: FakePanel) => p.isVirtual);
        manager.detach(entry, a);
        expect(adapter.timers.length).to.equal(0);
        expect(clone.isOnline).to.equal(true);
        manager.detach(entry, b);
        // no browser left: the panel is offline like a switched off display, the clone is kept for a day
        expect(clone.isOnline).to.equal(false);
        expect(adapter.timers.length).to.equal(1);
        expect(adapter.timers[0].ms).to.equal(24 * 60 * 60 * 1000);
        expect(ctrl.panels.filter((p: FakePanel) => p.isVirtual).length).to.equal(1);
        // a browser comes back in time - the timer is cancelled and the same clone is used
        const c = client();
        const again = await manager.attach(REAL_TOPIC, c);
        expect(again).to.equal(entry);
        expect(adapter.timers[0].cleared).to.equal(true);
        // the first browser after a pause gets a fresh send queue (first attach, then this one)
        expect(clone.queueResets).to.equal(2);
        manager.detach(entry, c);
        expect(adapter.timers.length).to.equal(2);
        adapter.timers[1].fn();
        await new Promise(resolve => setImmediate(resolve));
        expect(ctrl.panels.filter((p: FakePanel) => p.isVirtual).length).to.equal(0);
        expect(manager.listPanels()[0].clients).to.equal(0);
    });

    it('removes the clone with its hardware panel and closes the browsers without bye', async () => {
        const { ctrl, manager } = setup();
        const a = client();
        const entry = (await manager.attach(REAL_TOPIC, a))!;
        await manager.removeClonesOf(REAL_TOPIC);
        expect(ctrl.panels.filter((p: FakePanel) => p.isVirtual).length).to.equal(0);
        expect(a.closed).to.deep.equal(['panel removed']);
        expect(a.frames.some(f => f.t === 'bye')).to.equal(false);
        // frames after the removal go nowhere
        await entry.channel.publish(`${REAL_TOPIC}/web/cmnd/CustomSend`, 'x');
        expect(a.frames.filter(f => f.t === 'cmd').length).to.equal(0);
    });

    it('closes a browser without bye while the hardware panel is not running, says bye for unknown panels', async () => {
        const { ctrl, manager, real } = setup();
        ctrl.panels = ctrl.panels.filter((p: FakePanel) => p !== real);
        const a = client();
        expect(await manager.attach(REAL_TOPIC, a)).to.equal(undefined);
        expect(a.closed).to.deep.equal(['panel not running']);
        expect(a.frames).to.deep.equal([]);
        const b = client();
        expect(await manager.attach('nothing', b)).to.equal(undefined);
        expect(b.frames).to.deep.equal([{ t: 'bye', reason: 'unknown panel' }]);
        expect(manager.hasPanel('nothing')).to.equal(false);
        expect(manager.hasPanel(REAL_TOPIC)).to.equal(true);
        expect(manager.hasPanel(WEB_ID)).to.equal(true);
    });

    it('says goodbye to everyone on deleteAll', async () => {
        const { ctrl, manager } = setup();
        const a = client();
        await manager.attach(REAL_TOPIC, a);
        await manager.deleteAll();
        expect(a.frames[a.frames.length - 1]).to.deep.equal({ t: 'bye', reason: 'shutdown' });
        expect(a.closed).to.deep.equal(['shutdown']);
        expect(ctrl.panels.filter((p: FakePanel) => p.isVirtual).length).to.equal(0);
    });
});

describe('lib/web/virtual-panel-manager - standalone web panels', () => {
    it('hands the controller a channel and connects browsers to the panel built with it', async () => {
        const { adapter, ctrl, manager } = setup();
        const channel = manager.channelFor(WEB_TOPIC);
        expect(manager.channelFor(WEB_TOPIC)).to.equal(channel);
        // nobody can connect before the controller created the panel
        const early = client();
        expect(await manager.attach(WEB_TOPIC, early)).to.equal(undefined);
        expect(early.closed).to.deep.equal(['panel not running']);
        const panel: FakePanel = await ctrl.createPanel(
            { name: WEB_ID, friendlyName: 'Webtest', topic: WEB_TOPIC, kind: 'web', model: 'us-p' },
            channel,
        );
        const a = client();
        const entry = (await manager.attach(WEB_ID, a))!;
        expect(entry.kind).to.equal('web');
        expect(entry.channel).to.equal(channel);
        expect(a.frames[0]).to.deep.equal({
            t: 'hello',
            model: 'us-p',
            topic: WEB_TOPIC,
            name: WEB_ID,
            friendlyName: 'Webtest',
            tftVersion: '1.0.0',
            kind: 'web',
        });
        await channel.publish(`${WEB_TOPIC}/cmnd/CustomSend`, 'pageType~pageStartup');
        expect(a.frames[1]).to.deep.equal({ t: 'cmd', p: 'pageType~pageStartup', seq: 1 });
        await manager.onClientFrame(entry, { t: 'ack', seq: 1 });
        expect(panel.acks).to.equal(1);
        // no grace timer for a standalone panel - it lives with the adapter, offline without a browser
        manager.detach(entry, a);
        expect(panel.isOnline).to.equal(false);
        expect(adapter.timers.length).to.equal(0);
        expect(manager.channelFor(WEB_TOPIC)).to.equal(channel);
        // a clone removal does not touch it
        await manager.removeClonesOf(WEB_TOPIC);
        expect(manager.channelFor(WEB_TOPIC)).to.equal(channel);
    });
});

describe('lib/web/virtual-panel-manager - removeLegacyWebPanelTrees', () => {
    it('recognises the trees of former web panels', () => {
        expect(legacyWebPanelTree('panels.D4_8A_FC_9F_64_60_web')).to.equal('panels.D4_8A_FC_9F_64_60_web');
        expect(legacyWebPanelTree('panels.D4_8A_FC_9F_64_60_web2.info.isOnline')).to.equal(
            'panels.D4_8A_FC_9F_64_60_web2',
        );
        expect(legacyWebPanelTree('panels.D4_8A_FC_9F_64_60_web9.cmd.dim.active')).to.equal(
            'panels.D4_8A_FC_9F_64_60_web9',
        );
        expect(legacyWebPanelTree('panels.D4_8A_FC_9F_64_60_web10')).to.equal(undefined);
        expect(legacyWebPanelTree('panels.D4_8A_FC_9F_64_60.info.isOnline')).to.equal(undefined);
        expect(legacyWebPanelTree('panels.web_0123456789ab.info.isOnline')).to.equal(undefined);
        expect(legacyWebPanelTree('panels.webpanel')).to.equal(undefined);
    });

    it('removes each tree once, also when only states of it are left', async () => {
        const adapter = fakeAdapter([]);
        const deleted: string[] = [];
        const cleaned: string[][] = [];
        adapter.library.cleanUpTree = async (_hold: string[], filter: string[]) => {
            cleaned.push(filter);
        };
        adapter.getObjectListAsync = async () => ({
            rows: [
                { id: 'nspanel-lovelace-ui.0.panels.D4_8A_FC_9F_64_60' },
                { id: 'nspanel-lovelace-ui.0.panels.D4_8A_FC_9F_64_60.info.isOnline' },
                { id: 'nspanel-lovelace-ui.0.panels.D4_8A_FC_9F_64_60_web' },
                { id: 'nspanel-lovelace-ui.0.panels.D4_8A_FC_9F_64_60_web.info.isOnline' },
                { id: 'nspanel-lovelace-ui.0.panels.D4_8A_FC_9F_64_60_web2.cmd.dim.active' },
                { id: 'nspanel-lovelace-ui.0.panels.D4_8A_FC_9F_64_60_web9' },
                { id: 'nspanel-lovelace-ui.0.panels.D4_8A_FC_9F_64_60_web10' },
                { id: 'nspanel-lovelace-ui.0.panels.web_0123456789ab' },
                { id: 'nspanel-lovelace-ui.0.panels.webpanel' },
            ],
        });
        adapter.delObjectAsync = async (id: string) => {
            deleted.push(id);
        };
        const count = await removeLegacyWebPanelTrees(adapter);
        expect(count).to.equal(3);
        expect(deleted).to.deep.equal([
            'panels.D4_8A_FC_9F_64_60_web',
            'panels.D4_8A_FC_9F_64_60_web2',
            'panels.D4_8A_FC_9F_64_60_web9',
        ]);
        expect(cleaned).to.deep.equal([
            ['panels.D4_8A_FC_9F_64_60_web.'],
            ['panels.D4_8A_FC_9F_64_60_web2.'],
            ['panels.D4_8A_FC_9F_64_60_web9.'],
        ]);
        expect(adapter.logs.some((l: string) => l.startsWith('info:') && l.includes('3'))).to.equal(true);
    });

    it('does nothing when there is nothing to remove', async () => {
        const adapter = fakeAdapter([]);
        adapter.getObjectListAsync = async () => ({ rows: [{ id: 'nspanel-lovelace-ui.0.panels.A' }] });
        adapter.delObjectAsync = async () => {
            throw new Error('must not be called');
        };
        expect(await removeLegacyWebPanelTrees(adapter)).to.equal(0);
        expect(adapter.logs).to.deep.equal([]);
    });
});

// keep the Panel type referenced for the fake (documentation of what the manager relies on)
export type _PanelShape = Pick<
    Panel,
    'name' | 'friendlyName' | 'topic' | 'isVirtual' | 'isClone' | 'isOnline' | 'info'
>;
