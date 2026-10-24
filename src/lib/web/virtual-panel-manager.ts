import { randomUUID } from 'node:crypto';
import type { Controller } from '../controller/controller';
import { BaseClass, type AdapterClassDefinition } from '../controller/library';
import type { Panel, panelConfigPartial } from '../controller/panel';
import type { NSpanelModel } from '../types/types';
import { VirtualPanelChannel } from './virtual-panel-channel';
import type { ClientFrame, ServerFrame } from './web-protocol';

/** A web panel survives a lost connection this long and is bound again by its session id */
export const WEB_PANEL_GRACE_MS = 24 * 60 * 60 * 1000;
/** Web panels per real panel - each holds its own states tree `panels.<id>_web<n>` */
export const WEB_PANEL_MAX_SESSIONS = 8;
/** session ids a browser may bring along (`?session=`), anything else gets a server generated one */
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
/** Display version reported to the adapter when no TFT version is known */
const WEB_PANEL_FALLBACK_TFT_VERSION = '1.0.0';

/** The browser side of a session as seen by the manager (a WebSocket in production) */
export interface SessionClient {
    send(frame: ServerFrame): void;
    close(reason: string): void;
}

export type WebPanelSession = {
    id: string;
    /** topic of the real panel this one is cloned from */
    sourceTopic: string;
    /** 1-based slot, decides the name: slot 1 -> `<id>_web`, slot 2 -> `<id>_web2`, ... */
    slot: number;
    panel: Panel;
    channel: VirtualPanelChannel;
    client: SessionClient | undefined;
    graceTimer: ioBroker.Timeout | undefined;
    disconnectedAt: number;
};

export type WebPanelListEntry = { topic: string; id: string; name: string; model: NSpanelModel; sessions: number };

/**
 * Creates, binds and removes web panels (clones of real panels) - one per browser session.
 */
export class VirtualPanelManager extends BaseClass {
    private readonly controller: Controller;
    private sessions: Map<string, WebPanelSession> = new Map();

    constructor(adapter: AdapterClassDefinition, controller: Controller) {
        super(adapter, 'WebPanels');
        this.controller = controller;
        controller.virtualPanelManager = this;
    }

    /** Real panels a browser can connect to */
    listPanels(): WebPanelListEntry[] {
        const result: WebPanelListEntry[] = [];
        for (const p of this.adapter.config.panels) {
            if (!p || !p.topic || !this.controller.getPanelConfig(p.topic)) {
                continue;
            }
            result.push({
                topic: p.topic,
                id: p.id,
                name: p.name,
                model: p.model || 'eu',
                sessions: [...this.sessions.values()].filter(s => s.sourceTopic === p.topic).length,
            });
        }
        return result;
    }

    /**
     * Is there a real panel for this topic or id?
     *
     * @param topicOrId topic or id of the real panel
     * @returns true if a web panel can be created for it
     */
    hasPanel(topicOrId: string): boolean {
        return this.controller.getPanelConfig(topicOrId) !== undefined;
    }

    /**
     * Bind a browser to a web panel: an existing session (same id, same real panel) is taken
     * over, otherwise a new clone is created. Sends the hello frame on success.
     *
     * @param topicOrId topic or id of the real panel
     * @param sessionId session id the browser remembered, undefined for a new one
     * @param client the browser side
     * @returns the session, undefined if no panel could be bound (client is told why and closed)
     */
    async attach(
        topicOrId: string,
        sessionId: string | undefined,
        client: SessionClient,
    ): Promise<WebPanelSession | undefined> {
        if (this.unload) {
            client.close('shutdown');
            return undefined;
        }
        const source = this.controller.getPanelConfig(topicOrId);
        if (!source || !source.topic) {
            this.log.warn(`No panel for '${topicOrId}'`);
            client.send({ t: 'bye', reason: 'unknown panel' });
            client.close('unknown panel');
            return undefined;
        }

        let session = sessionId ? this.sessions.get(sessionId) : undefined;
        if (session && session.sourceTopic !== source.topic) {
            session = undefined;
        }
        if (session) {
            if (session.graceTimer) {
                this.adapter.clearTimeout(session.graceTimer);
                session.graceTimer = undefined;
            }
            if (session.client && session.client !== client) {
                session.client.send({ t: 'bye', reason: 'replaced' });
                session.client.close('replaced');
            }
            session.client = client;
            this.log.debug(`Session ${session.id} bound again to ${session.panel.name}`);
        } else {
            session = await this.createSession(source, client, sessionId);
            if (!session) {
                client.send({ t: 'bye', reason: 'no free slot' });
                client.close('no free slot');
                return undefined;
            }
        }
        client.send({
            t: 'hello',
            session: session.id,
            model: session.panel.info.nspanel.model,
            topic: source.topic,
            name: session.panel.name,
            friendlyName: session.panel.friendlyName,
            tftVersion: this.tftVersion(session.panel.info.nspanel.model),
        });
        return session;
    }

    /**
     * The browser went away - keep the panel for the grace period.
     *
     * @param session the session
     * @param client the client that closed, ignored if the session was already taken over
     */
    detach(session: WebPanelSession, client: SessionClient): void {
        if (session.client !== client) {
            return;
        }
        session.client = undefined;
        session.disconnectedAt = Date.now();
        if (this.unload || this.adapter.unload) {
            return;
        }
        session.graceTimer = this.adapter.setTimeout(() => {
            void this.removeSession(session, 'grace period over');
        }, WEB_PANEL_GRACE_MS);
        this.log.debug(`Session ${session.id} disconnected - ${session.panel.name} kept for reconnect`);
    }

    /**
     * A frame from the browser.
     *
     * @param session the session
     * @param frame the parsed frame
     */
    async onClientFrame(session: WebPanelSession, frame: ClientFrame): Promise<void> {
        if (session.channel.unload) {
            return;
        }
        if (frame.t === 'ack') {
            await session.channel.injectAck();
        } else {
            await session.channel.injectReceive(frame.p);
        }
    }

    /**
     * Remove all web panels of a real panel.
     *
     * @param topic topic of the real panel
     */
    async removeClonesOf(topic: string): Promise<void> {
        for (const session of [...this.sessions.values()]) {
            if (session.sourceTopic === topic) {
                await this.removeSession(session, 'panel removed');
            }
        }
    }

    async deleteAll(): Promise<void> {
        for (const session of [...this.sessions.values()]) {
            await this.removeSession(session, 'shutdown');
        }
    }

    async delete(): Promise<void> {
        await this.deleteAll();
        if (this.controller.virtualPanelManager === this) {
            this.controller.virtualPanelManager = undefined;
        }
        await super.delete();
    }

    private async createSession(
        source: Partial<panelConfigPartial>,
        client: SessionClient,
        requestedId?: string,
    ): Promise<WebPanelSession | undefined> {
        const sourceTopic = source.topic!;
        const slot = this.freeSlot(sourceTopic);
        if (slot === undefined) {
            this.log.warn(`No free web panel slot for ${sourceTopic} (max ${WEB_PANEL_MAX_SESSIONS})`);
            return undefined;
        }
        const id =
            this.adapter.config.panels.find(p => p.topic === sourceTopic)?.id ?? this.library.cleandp(sourceTopic);
        const realName = this.adapter.config.panels.find(p => p.topic === sourceTopic)?.name ?? sourceTopic;
        // the browser keeps its id in localStorage - using it lets a reload (or a reconnect after an
        // adapter restart) bind to the same session instead of occupying a new slot
        const sessionId =
            requestedId && SESSION_ID_PATTERN.test(requestedId) && !this.sessions.has(requestedId)
                ? requestedId
                : randomUUID();
        const { channel: _channel, controller: _controller, ...plain } = source;
        const config = structuredClone(plain) as Partial<panelConfigPartial>;
        config.name = slot === 1 ? `${id}_web` : `${id}_web${slot}`;
        config.friendlyName = slot === 1 ? `${realName} (Web)` : `${realName} (Web ${slot})`;
        config.topic = `${sourceTopic}/web/${sessionId}`;
        config.sourceTopic = sourceTopic;
        config.kind = 'web';
        const channel = new VirtualPanelChannel(this.adapter, config.topic, `${config.friendlyName}-Channel`);
        channel.onCommand(payload => {
            const s = this.sessions.get(sessionId);
            s?.client?.send({ t: 'cmd', p: payload });
        });
        channel.onBuzzer(payload => {
            const s = this.sessions.get(sessionId);
            s?.client?.send({ t: 'buzzer', p: payload });
        });
        const panel = await this.controller.addVirtualPanel(config, channel);
        if (!panel) {
            await channel.delete();
            return undefined;
        }
        const session: WebPanelSession = {
            id: sessionId,
            sourceTopic,
            slot,
            panel,
            channel,
            client,
            graceTimer: undefined,
            disconnectedAt: 0,
        };
        this.sessions.set(sessionId, session);
        this.log.info(`Web panel ${panel.name} created for ${sourceTopic}`);
        return session;
    }

    /**
     * Lowest free slot; if all are taken, the slot of the longest disconnected session is freed.
     *
     * @param sourceTopic topic of the real panel
     * @returns the slot, undefined if every slot has a connected browser
     */
    private freeSlot(sourceTopic: string): number | undefined {
        const used = [...this.sessions.values()].filter(s => s.sourceTopic === sourceTopic);
        for (let slot = 1; slot <= WEB_PANEL_MAX_SESSIONS; slot++) {
            if (!used.some(s => s.slot === slot)) {
                return slot;
            }
        }
        const idle = used
            .filter(s => !s.client)
            .sort((a, b) => a.disconnectedAt - b.disconnectedAt)
            .shift();
        if (!idle) {
            return undefined;
        }
        // the slot is reused right away - remove synchronously from the map, the panel goes in the background
        void this.removeSession(idle, 'slot needed');
        return idle.slot;
    }

    private async removeSession(session: WebPanelSession, reason: string): Promise<void> {
        if (!this.sessions.delete(session.id)) {
            return;
        }
        if (session.graceTimer) {
            this.adapter.clearTimeout(session.graceTimer);
            session.graceTimer = undefined;
        }
        if (session.client) {
            session.client.send({ t: 'bye', reason });
            session.client.close(reason);
            session.client = undefined;
        }
        await this.controller.removePanel(session.panel);
        await session.channel.delete();
        this.log.info(`Web panel ${session.panel.name} removed (${reason})`);
    }

    private tftVersion(model: NSpanelModel): string {
        const suffix = model === 'eu' ? '' : `-${model}`;
        const key = this.adapter.config.useBetaTFT ? `tft${suffix}-beta` : `tft${suffix}`;
        return this.controller.globalPanelInfo.availableTftFirmwareVersion[key] || WEB_PANEL_FALLBACK_TFT_VERSION;
    }
}
