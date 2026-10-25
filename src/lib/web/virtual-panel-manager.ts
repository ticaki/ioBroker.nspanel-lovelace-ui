import type { Controller } from '../controller/controller';
import { BaseClass, type AdapterClassDefinition } from '../controller/library';
import type { Panel, panelConfigPartial } from '../controller/panel';
import type { NSpanelModel } from '../types/types';
import { VirtualPanelChannel } from './virtual-panel-channel';
import type { ClientFrame, ServerFrame, WebPanelKind } from './web-protocol';

/** A clone of a hardware panel is removed after this long without a connected browser */
export const WEB_PANEL_GRACE_MS = 24 * 60 * 60 * 1000;
/** `seq` numbers waiting for an ack are kept up to this count (nobody acks when no browser is connected) */
const MAX_PENDING_ACKS = 256;
/** Display version reported to the adapter when no TFT version is known */
const WEB_PANEL_FALLBACK_TFT_VERSION = '1.0.0';
/** Object trees of former web panels (one tree per browser session): `panels.<id>_web`, `panels.<id>_web2` … `_web9` */
const LEGACY_WEB_TREE = /^(panels\.[^.]+_web[2-9]?)(\.|$)/;

/**
 * Is this object id (relative to the instance) part of a tree a former web panel left behind?
 *
 * @param id object id without the instance namespace, e.g. `panels.D4_8A_FC_9F_64_60_web2.info.isOnline`
 * @returns the root of the tree (`panels.<id>_web<n>`), undefined if the id belongs to something else
 */
export function legacyWebPanelTree(id: string): string | undefined {
    return LEGACY_WEB_TREE.exec(id)?.[1];
}

/** The browser side of a connection as seen by the manager (a WebSocket in production) */
export interface WebClient {
    send(frame: ServerFrame): void;
    /** close the connection without a `bye` frame - the browser connects again */
    close(reason: string): void;
}

/** One web panel = one endpoint (`/<topic>`), shared by every browser that opens it */
export type WebPanelEntry = {
    /** topic of the endpoint: the hardware panel (clone) or the standalone web panel */
    topic: string;
    kind: WebPanelKind;
    channel: VirtualPanelChannel;
    clients: Set<WebClient>;
    /** last `seq` sent with a cmd frame */
    seq: number;
    /** `seq` numbers sent and not yet acknowledged, oldest first */
    pending: number[];
    /** clone only: removal after the grace period without a browser */
    graceTimer: ioBroker.Timeout | undefined;
};

export type WebPanelListEntry = {
    topic: string;
    id: string;
    name: string;
    model: NSpanelModel;
    kind: 'tasmota' | 'web';
    /** connected browsers */
    clients: number;
};

/**
 * Deletes the object trees former web panels left behind (`panels.<id>_web`, `panels.<id>_web<n>`).
 * A clone shares the tree of its hardware panel now, so those trees are dead.
 *
 * @param adapter the adapter
 * @returns number of trees removed
 */
export async function removeLegacyWebPanelTrees(adapter: AdapterClassDefinition): Promise<number> {
    const prefix = `${adapter.namespace}.panels.`;
    let count = 0;
    try {
        // every object (device, channel, state) - a tree may have lost its device object already
        const list = await adapter.getObjectListAsync({ startkey: prefix, endkey: `${prefix}香` });
        const trees = new Set<string>();
        for (const row of list?.rows ?? []) {
            const id = row.id.startsWith(`${adapter.namespace}.`) ? row.id.slice(adapter.namespace.length + 1) : row.id;
            const tree = legacyWebPanelTree(id);
            if (tree) {
                trees.add(tree);
            }
        }
        for (const tree of trees) {
            // forget the states, then remove the whole tree
            await adapter.library.cleanUpTree([], [`${tree}.`], 2);
            await adapter.delObjectAsync(tree, { recursive: true });
            count++;
        }
    } catch (e) {
        adapter.log.warn(`Could not remove old web panel object trees: ${String(e)}`);
    }
    if (count > 0) {
        adapter.log.info(`Removed ${count} object tree(s) of former web panels (panels.*_web*)`);
    }
    return count;
}

/**
 * Owns the web panels: one panel per endpoint, shared by all browsers that open it.
 *
 * - Clone of a hardware panel (`/<topic>` of a panel of the admin table): created on the first
 *   browser connection, shares the states tree `panels.<id>` with the hardware panel, removed
 *   after `WEB_PANEL_GRACE_MS` without a browser or together with the hardware panel.
 * - Standalone web panel (table entry with `kind: 'web'`): created by the controller at start
 *   like a hardware panel, with the channel from `channelFor()`.
 */
export class VirtualPanelManager extends BaseClass {
    private readonly controller: Controller;
    /** endpoint topic -> web panel */
    private entries: Map<string, WebPanelEntry> = new Map();

    constructor(adapter: AdapterClassDefinition, controller: Controller) {
        super(adapter, 'WebPanels');
        this.controller = controller;
        controller.virtualPanelManager = this;
    }

    /** Hardware panels and standalone web panels a browser can connect to */
    listPanels(): WebPanelListEntry[] {
        const result: WebPanelListEntry[] = [];
        for (const p of this.adapter.config.panels) {
            if (!p || !p.topic) {
                continue;
            }
            const kind = p.kind === 'web' ? 'web' : 'tasmota';
            if (kind === 'tasmota' && !this.controller.getPanelConfig(p.topic)) {
                continue;
            }
            result.push({
                topic: p.topic,
                id: p.id,
                name: p.name,
                model: p.model || 'eu',
                kind,
                clients: this.entries.get(p.topic)?.clients.size ?? 0,
            });
        }
        return result;
    }

    /**
     * Is there an endpoint for this topic or id?
     *
     * @param topicOrId topic or id of a hardware panel or a standalone web panel
     * @returns true if a browser can connect to it
     */
    hasPanel(topicOrId: string): boolean {
        return this.resolve(topicOrId) !== undefined;
    }

    /**
     * The channel of a standalone web panel - created on first use, the controller hands it to
     * the panel. The same channel is kept when the panel is reloaded, so connected browsers
     * stay connected.
     *
     * @param topic topic of the web panel (admin table)
     * @returns the channel
     */
    channelFor(topic: string): VirtualPanelChannel {
        return this.channelForEntry(topic).channel;
    }

    /**
     * Connect a browser to the web panel of an endpoint. A clone is created on the first
     * connection. Sends the hello frame on success.
     *
     * @param topicOrId topic or id of a hardware panel or a standalone web panel
     * @param client the browser side
     * @returns the web panel, undefined if the browser could not be connected (it was told why
     * with `bye`, or just closed so it tries again when the panel is not running right now)
     */
    async attach(topicOrId: string, client: WebClient): Promise<WebPanelEntry | undefined> {
        if (this.unload || this.adapter.unload) {
            client.send({ t: 'bye', reason: 'shutdown' });
            client.close('shutdown');
            return undefined;
        }
        const target = this.resolve(topicOrId);
        if (!target) {
            this.log.warn(`No panel for '${topicOrId}'`);
            client.send({ t: 'bye', reason: 'unknown panel' });
            client.close('unknown panel');
            return undefined;
        }
        let entry: WebPanelEntry | undefined;
        let panel: Panel | undefined;
        if (target.kind === 'web') {
            entry = this.channelForEntry(target.topic);
            panel = this.controller.panels.find(p => p.isVirtual && p.topic === target.topic);
            if (!panel) {
                // deactivated or not (yet) created - the browser tries again later
                this.log.debug(`Web panel ${target.topic} is not running - browser closed`);
                client.close('panel not running');
                return undefined;
            }
        } else {
            const real = this.controller.panels.find(p => !p.isVirtual && p.topic === target.topic);
            if (!real) {
                // the hardware panel is being reloaded or is deactivated - the browser tries again later
                this.log.debug(`Panel ${target.topic} is not running - browser closed`);
                client.close('panel not running');
                return undefined;
            }
            entry = this.entries.get(target.topic);
            if (!entry) {
                entry = await this.createClone(target.topic, target.id, target.name);
                if (!entry) {
                    client.send({ t: 'bye', reason: 'unknown panel' });
                    client.close('unknown panel');
                    return undefined;
                }
            }
            panel = this.panelOf(entry);
            if (!panel) {
                client.send({ t: 'bye', reason: 'unknown panel' });
                client.close('unknown panel');
                return undefined;
            }
        }
        if (entry.graceTimer) {
            this.adapter.clearTimeout(entry.graceTimer);
            entry.graceTimer = undefined;
        }
        if (entry.clients.size === 0) {
            // nobody acknowledged while no browser was connected - drop the stalled queue so the
            // startup of this browser is answered right away
            panel.panelSend.resetMessageDB();
        }
        entry.clients.add(client);
        client.send({
            t: 'hello',
            model: panel.info.nspanel.model,
            topic: target.topic,
            name: panel.name,
            friendlyName: panel.friendlyName,
            tftVersion: this.tftVersion(panel.info.nspanel.model),
            kind: entry.kind,
        });
        this.log.debug(`Browser connected to ${panel.friendlyName} (${entry.clients.size} connected)`);
        return entry;
    }

    /**
     * A browser went away. A clone without browsers is removed after the grace period.
     *
     * @param entry the web panel
     * @param client the browser that closed
     */
    detach(entry: WebPanelEntry, client: WebClient): void {
        if (!entry.clients.delete(client)) {
            return;
        }
        if (entry.clients.size > 0 || this.unload || this.adapter.unload) {
            return;
        }
        // without a browser the panel is offline like a switched off display: the send queue is
        // dropped and the panel offers `pageType~pageStartup` to the next browser right away
        const panel = this.panelOf(entry);
        if (panel && !panel.unload && panel.isOnline) {
            this.log.info(`No browser left on ${panel.friendlyName} - offline`);
            panel.isOnline = false;
        }
        if (entry.kind !== 'clone') {
            return;
        }
        if (entry.graceTimer) {
            this.adapter.clearTimeout(entry.graceTimer);
        }
        entry.graceTimer = this.adapter.setTimeout(() => {
            entry.graceTimer = undefined;
            void this.removeEntry(entry, 'grace period over', false);
        }, WEB_PANEL_GRACE_MS);
        this.log.debug(
            `Last browser of ${entry.topic} disconnected - clone kept for ${WEB_PANEL_GRACE_MS / 3_600_000} h`,
        );
    }

    /**
     * A frame from a browser. `ack` with a `seq` is passed on once per `seq` (the first browser
     * wins), `ack` without `seq` always, `recv` always.
     *
     * @param entry the web panel
     * @param frame the parsed frame
     */
    async onClientFrame(entry: WebPanelEntry, frame: ClientFrame): Promise<void> {
        if (entry.channel.unload) {
            return;
        }
        if (frame.t === 'recv') {
            await entry.channel.injectReceive(frame.p);
            return;
        }
        if (frame.seq === undefined) {
            await entry.channel.injectAck();
            return;
        }
        const index = entry.pending.indexOf(frame.seq);
        if (index === -1) {
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`Ignore repeated ack ${frame.seq} for ${entry.topic}`);
            }
            return;
        }
        entry.pending.splice(index, 1);
        await entry.channel.injectAck();
    }

    /**
     * Remove the clone of a hardware panel (the panel is removed or reloaded). Connected
     * browsers are closed without `bye`, so they connect again and get a fresh clone.
     *
     * @param topic topic of the hardware panel
     */
    async removeClonesOf(topic: string): Promise<void> {
        const entry = this.entries.get(topic);
        if (entry && entry.kind === 'clone') {
            await this.removeEntry(entry, 'panel removed', false);
        }
    }

    /** Remove every web panel and tell the browsers goodbye (adapter stops) */
    async deleteAll(): Promise<void> {
        for (const entry of [...this.entries.values()]) {
            await this.removeEntry(entry, 'shutdown', true);
        }
    }

    async delete(): Promise<void> {
        await this.deleteAll();
        if (this.controller.virtualPanelManager === this) {
            this.controller.virtualPanelManager = undefined;
        }
        await super.delete();
    }

    /**
     * Endpoint of a topic or id from the admin panel table.
     *
     * @param topicOrId topic or id
     * @returns the table entry with its kind, undefined if unknown or (hardware) without configuration
     */
    private resolve(topicOrId: string): { topic: string; id: string; name: string; kind: WebPanelKind } | undefined {
        if (!topicOrId) {
            return undefined;
        }
        const row =
            this.adapter.config.panels.find(p => p && p.topic === topicOrId) ??
            this.adapter.config.panels.find(p => p && p.id === topicOrId);
        if (!row || !row.topic) {
            return undefined;
        }
        if (row.kind === 'web') {
            return { topic: row.topic, id: row.id, name: row.name, kind: 'web' };
        }
        if (!this.controller.getPanelConfig(row.topic)) {
            return undefined;
        }
        return { topic: row.topic, id: row.id, name: row.name, kind: 'clone' };
    }

    private channelForEntry(topic: string): WebPanelEntry {
        let entry = this.entries.get(topic);
        if (!entry) {
            entry = this.createEntry(topic, 'web', topic);
        }
        return entry;
    }

    private createEntry(topic: string, kind: WebPanelKind, channelTopic: string): WebPanelEntry {
        const channel = new VirtualPanelChannel(this.adapter, channelTopic, `WebChannel-${topic}`);
        const entry: WebPanelEntry = {
            topic,
            kind,
            channel,
            clients: new Set(),
            seq: 0,
            pending: [],
            graceTimer: undefined,
        };
        channel.onCommand(payload => {
            entry.seq++;
            entry.pending.push(entry.seq);
            if (entry.pending.length > MAX_PENDING_ACKS) {
                entry.pending.splice(0, entry.pending.length - MAX_PENDING_ACKS);
            }
            for (const c of entry.clients) {
                c.send({ t: 'cmd', p: payload, seq: entry.seq });
            }
        });
        channel.onBuzzer(payload => {
            for (const c of entry.clients) {
                c.send({ t: 'buzzer', p: payload });
            }
        });
        this.entries.set(topic, entry);
        return entry;
    }

    /**
     * Create the clone of a hardware panel: same configuration, same states tree (`name` = id of
     * the hardware panel), own topic `<topic>/web` and an in-process channel.
     *
     * @param topic topic of the hardware panel
     * @param id id of the hardware panel (admin table)
     * @param name name of the hardware panel (admin table)
     * @returns the entry, undefined if the panel could not be created
     */
    private async createClone(topic: string, id: string, name: string): Promise<WebPanelEntry | undefined> {
        const source = this.controller.getPanelConfig(topic);
        if (!source) {
            return undefined;
        }
        const { channel: _channel, controller: _controller, ...plain } = source;
        const config = structuredClone(plain) as Partial<panelConfigPartial>;
        config.name = id || this.library.cleandp(topic);
        config.friendlyName = `${name || topic} (Web)`;
        config.topic = `${topic}/web`;
        config.sourceTopic = topic;
        config.kind = 'web';
        config.model = this.adapter.config.panels.find(p => p.topic === topic)?.model || config.model || 'eu';
        const entry = this.createEntry(topic, 'clone', config.topic);
        const panel = await this.controller.addVirtualPanel(config, entry.channel);
        if (!panel) {
            this.entries.delete(topic);
            await entry.channel.delete();
            return undefined;
        }
        this.log.info(`Web panel ${config.friendlyName} created for ${topic}`);
        return entry;
    }

    private async removeEntry(entry: WebPanelEntry, reason: string, bye: boolean): Promise<void> {
        if (!this.entries.delete(entry.topic)) {
            return;
        }
        if (entry.graceTimer) {
            this.adapter.clearTimeout(entry.graceTimer);
            entry.graceTimer = undefined;
        }
        for (const c of entry.clients) {
            if (bye) {
                c.send({ t: 'bye', reason });
            }
            c.close(reason);
        }
        entry.clients.clear();
        if (entry.kind === 'clone') {
            const panel = this.panelOf(entry);
            if (panel) {
                await this.controller.removePanel(panel);
            }
            this.log.info(`Web panel of ${entry.topic} removed (${reason})`);
        }
        await entry.channel.delete();
    }

    /**
     * The panel instance that talks through the channel of this entry.
     *
     * @param entry the web panel
     * @returns the panel, undefined while it is not (or no longer) created
     */
    private panelOf(entry: WebPanelEntry): Panel | undefined {
        return this.controller.panels.find(p => p.isVirtual && p.topic === entry.channel.topic);
    }

    private tftVersion(model: NSpanelModel): string {
        const suffix = model === 'eu' ? '' : `-${model}`;
        const key = this.adapter.config.useBetaTFT ? `tft${suffix}-beta` : `tft${suffix}`;
        return this.controller.globalPanelInfo.availableTftFirmwareVersion[key] || WEB_PANEL_FALLBACK_TFT_VERSION;
    }
}
