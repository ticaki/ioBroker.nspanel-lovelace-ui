import type { SimulatorConfig } from '../config.js';
import type { Logger } from '../log.js';
import { makeDefaultState, StateStore } from '../persistence.js';
import { BerryBridge } from './BerryBridge.js';
import { HttpTasmota } from './HttpTasmota.js';
import { MqttTransport } from './MqttTransport.js';
import { TasmotaStub } from './TasmotaStub.js';
import { TftState } from './TftState.js';
import { buildStartupEvent } from './payloads/EventBuilder.js';
import { buildInfo1, buildState } from './payloads/TeleBuilder.js';
import { SUFFIX_INFO1, SUFFIX_RESULT, SUFFIX_STATE } from './const/topics.js';
import type { SimRuntimeInfo } from './payloads/StatusBuilder.js';

export class Simulator {
    private readonly cfg: SimulatorConfig;
    private readonly log: Logger;
    private store!: StateStore;
    private http!: HttpTasmota;
    private mqtt!: MqttTransport;
    private tasmota!: TasmotaStub;
    private berry!: BerryBridge;
    private tft!: TftState;
    private readonly bootStart = new Date();

    constructor(cfg: SimulatorConfig, log: Logger) {
        this.cfg = cfg;
        this.log = log;
    }

    private get runtime(): SimRuntimeInfo {
        return {
            firmwareVersion: this.cfg.firmwareVersion,
            model: this.cfg.model,
            bootStartUtc: this.bootStart.toISOString().replace('Z', '').slice(0, 19),
            uptimeSec: Math.floor((Date.now() - this.bootStart.getTime()) / 1000),
        };
    }

    async start(): Promise<void> {
        const fallback = makeDefaultState({ mac: this.cfg.mac, ipAddress: this.cfg.simulatedIp });
        if (this.cfg.topic) {
            fallback.topic = this.cfg.topic;
        }
        this.store = await StateStore.load(this.cfg.statePath, fallback, this.log.child({ comp: 'state' }));

        if (this.cfg.init) {
            this.log.warn('--init: wiping persisted MQTT credentials, waiting for fresh nsPanelInit');
            this.store.clearCredentials();
        }

        if (this.cfg.topic && this.store.state.topic !== this.cfg.topic) {
            this.store.update({ topic: this.cfg.topic });
        }

        this.tft = new TftState(this.log.child({ comp: 'tft' }));
        this.tft.setBootResetHandler(() => this.scheduleBootEvent('pageType~pageStartup'));
        this.tft.setSleepHandler(card => {
            // emit raw sleepReached first (always)
            this.berry?.emitEvent(['sleepReached', card, '', '']);
            this.maybeScheduleAutoWake(card);
        });
        this.mqtt = new MqttTransport({
            log: this.log.child({ comp: 'mqtt' }),
            handler: (cmd, payload) => this.onMqttCommand(cmd, payload),
        });
        this.tasmota = new TasmotaStub({
            publisher: this.mqtt,
            store: this.store,
            log: this.log.child({ comp: 'tasmota' }),
            runtime: this.runtime,
            displayVersion: this.cfg.displayVersion,
        });
        this.berry = new BerryBridge({
            publisher: this.mqtt,
            tft: this.tft,
            log: this.log.child({ comp: 'berry' }),
            ackDelayMs: this.cfg.ackDelayMs,
        });

        this.http = new HttpTasmota({
            log: this.log.child({ comp: 'http' }),
            store: this.store,
            runtime: this.runtime,
            displayVersion: this.cfg.displayVersion,
            events: {
                onCredentialsChanged: () => this.maybeAutoConnect(),
                onRestart: () => this.handleRestart(),
            },
            listenIp: this.cfg.httpListenIp,
            listenPort: this.cfg.httpListenPort,
        });
        await this.http.start();

        if (this.canConnect()) {
            await this.connectAndAnnounce();
        } else {
            this.log.info('Idle: waiting for nsPanelInit (Backlog with MQTT credentials) on HTTP /cm');
        }
    }

    async stop(): Promise<void> {
        if (this.autoWakeTimer) {
            clearTimeout(this.autoWakeTimer);
            this.autoWakeTimer = null;
        }
        this.tft?.shutdown();
        await this.mqtt?.disconnect('shutdown');
        await this.http?.stop();
    }

    private canConnect(): boolean {
        const s = this.store.state;
        return Boolean(s.mqttHost && s.mqttPort && s.topic);
    }

    private async maybeAutoConnect(): Promise<void> {
        if (!this.canConnect()) {
            this.log.debug('Credentials not yet complete after backlog');
            return;
        }
        if (this.mqtt.isConnected()) {
            this.log.debug('Already connected; will reconnect on Restart');
        }
    }

    private async handleRestart(): Promise<void> {
        if (!this.canConnect()) {
            this.log.warn('Restart requested but MQTT credentials incomplete');
            return;
        }
        await this.connectAndAnnounce();
    }

    private async connectAndAnnounce(): Promise<void> {
        const s = this.store.state;
        const topic = s.topic;
        if (!s.mqttHost || !s.mqttPort || !topic) {
            this.log.error('connectAndAnnounce called without complete credentials');
            return;
        }
        const clientId = s.mqttClient ?? `nspanel-sim-${s.mac.replace(/:/g, '').slice(-6)}`;
        const useTls = s.setOption103 === 1;
        try {
            await this.mqtt.connect({
                host: s.mqttHost,
                port: s.mqttPort,
                username: s.mqttUser,
                password: s.mqttPassword,
                clientId,
                topic,
                useTls,
            });
        } catch (err: unknown) {
            this.log.error({ err: (err as Error).message, useTls }, 'MQTT connect failed');
            return;
        }

        this.http.setBridge({
            publishTele: (suffix, payload) => this.mqtt.publishTele(suffix, payload),
            publishStat: (suffix, payload) => this.mqtt.publishStat(suffix, payload),
            isConnected: () => this.mqtt.isConnected(),
        });

        this.mqtt.publishTele(SUFFIX_INFO1, JSON.stringify(buildInfo1(s, this.cfg.firmwareVersion)));
        this.mqtt.publishTele(SUFFIX_STATE, JSON.stringify(buildState(s, this.runtime)));

        this.scheduleBootEvent('initial connect');
    }

    private autoWakeTimer: NodeJS.Timeout | null = null;

    private maybeScheduleAutoWake(cardAtSleep: string): void {
        if (!this.cfg.autoWake) {
            return;
        }
        if (this.autoWakeTimer) {
            clearTimeout(this.autoWakeTimer);
            this.autoWakeTimer = null;
        }
        const min = Math.max(0, this.cfg.autoWakeMinSec);
        const max = Math.max(min, this.cfg.autoWakeMaxSec);
        const delay = min + Math.random() * (max - min);
        this.log.info({ delaySec: Math.round(delay), cardAtSleep }, 'auto-wake scheduled');
        const t = setTimeout(() => {
            this.autoWakeTimer = null;
            if (!this.tft.get().isAsleep) {
                this.log.debug('auto-wake skipped — already awake');
                return;
            }
            // Real panel sends bExit twice (opt=1, opt=2) ~300ms apart, sometimes a 3rd (opt=3) right after
            this.berry.emitEvent(['buttonPress2', 'screensaver', 'bExit', '1']);
            setTimeout(() => this.berry.emitEvent(['buttonPress2', 'screensaver', 'bExit', '2']), 300).unref?.();
            this.log.info('auto-wake fired bExit sequence');
        }, delay * 1000);
        t.unref?.();
        this.autoWakeTimer = t;
    }

    private scheduleBootEvent(reason: string): void {
        if (!this.mqtt.isConnected()) {
            this.log.debug({ reason }, 'Skip boot event — MQTT not connected');
            return;
        }
        setTimeout(() => {
            if (!this.mqtt.isConnected()) {
                return;
            }
            this.mqtt.publishTele(
                SUFFIX_RESULT,
                buildStartupEvent({ startupId: this.cfg.startupId, model: this.cfg.model, hmiVersion: this.cfg.hmiVersion }),
            );
            this.log.info(
                { startupId: this.cfg.startupId, model: this.cfg.model, hmiVersion: this.cfg.hmiVersion, reason },
                'Boot event sent',
            );
        }, 500).unref?.();
    }

    private onMqttCommand(cmd: string, payload: string): void {
        if (cmd === 'CustomSend') {
            this.berry.onCustomSend(payload);
            return;
        }
        this.tasmota.handle(cmd, payload);
    }
}
