import http, { type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import type { Logger } from '../log.js';
import { isFlashNextionCmd, parseSingleCommand, splitBacklog } from './const/backlog.js';
import type { StateStore } from '../persistence.js';
import { buildStatus0, buildStatusFwrOnly, buildStatusNet, buildStatusSensor, type SimRuntimeInfo } from './payloads/StatusBuilder.js';
import { SUFFIX_RESULT } from './const/topics.js';

export interface HttpTasmotaBridge {
    publishTele(suffix: string, payload: string): void;
    publishStat(suffix: string, payload: string): void;
    isConnected(): boolean;
}

export interface HttpTasmotaEvents {
    onCredentialsChanged(): Promise<void> | void;
    onRestart(): Promise<void> | void;
}

export class HttpTasmota {
    private server: Server | null = null;
    private readonly log: Logger;
    private readonly store: StateStore;
    private readonly runtime: SimRuntimeInfo;
    private readonly displayVersion: string;
    private readonly events: HttpTasmotaEvents;
    private readonly listenIp: string;
    private readonly listenPort: number;
    private credentialsDirty = false;
    private bridge: HttpTasmotaBridge | null = null;

    constructor(opts: {
        log: Logger;
        store: StateStore;
        runtime: SimRuntimeInfo;
        displayVersion: string;
        events: HttpTasmotaEvents;
        listenIp: string;
        listenPort: number;
    }) {
        this.log = opts.log;
        this.store = opts.store;
        this.runtime = opts.runtime;
        this.displayVersion = opts.displayVersion;
        this.events = opts.events;
        this.listenIp = opts.listenIp;
        this.listenPort = opts.listenPort;
    }

    setBridge(bridge: HttpTasmotaBridge | null): void {
        this.bridge = bridge;
    }

    async start(): Promise<void> {
        const server = http.createServer((req, res) => this.handleRequest(req, res));
        this.server = server;
        await new Promise<void>((resolve, reject) => {
            server.once('error', reject);
            server.listen(this.listenPort, this.listenIp, () => {
                server.removeListener('error', reject);
                resolve();
            });
        });
        const addr = server.address();
        this.log.info({ addr }, 'HTTP listening');
    }

    async stop(): Promise<void> {
        const s = this.server;
        if (!s) {
            return;
        }
        await new Promise<void>(resolve => s.close(() => resolve()));
        this.server = null;
    }

    private handleRequest(req: IncomingMessage, res: ServerResponse): void {
        if (!req.url || req.method !== 'GET') {
            res.writeHead(405, { 'content-type': 'text/plain' });
            res.end('Method Not Allowed');
            return;
        }
        const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
        if (url.pathname !== '/cm') {
            res.writeHead(404, { 'content-type': 'text/plain' });
            res.end('Not Found');
            return;
        }
        const cmnd = url.searchParams.get('cmnd');
        if (cmnd === null) {
            res.writeHead(400, { 'content-type': 'text/plain' });
            res.end('Missing cmnd');
            return;
        }
        this.log.info({ cmnd }, 'HTTP /cm');
        this.credentialsDirty = false;
        const result = this.dispatch(cmnd);
        const body = JSON.stringify(result);
        res.writeHead(200, {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-cache',
        });
        res.end(body);

        if (this.credentialsDirty) {
            void Promise.resolve(this.events.onCredentialsChanged()).catch(err =>
                this.log.error({ err: (err as Error).message }, 'onCredentialsChanged failed'),
            );
        }
    }

    private dispatch(input: string): Record<string, unknown> {
        const lower = input.toLowerCase();
        if (lower.startsWith('backlog')) {
            const remainder = input.slice('backlog'.length).trim();
            return this.handleBacklog(remainder);
        }
        const parsed = parseSingleCommand(input);
        return this.handleSingle(parsed.cmd, parsed.args);
    }

    private handleBacklog(chain: string): Record<string, unknown> {
        const entries = splitBacklog(chain);
        const aggregate: Record<string, unknown> = {};
        for (const e of entries) {
            const r = this.handleSingle(e.cmd, e.args);
            for (const [k, v] of Object.entries(r)) {
                if (!(k in aggregate)) {
                    aggregate[k] = v;
                }
            }
        }
        return aggregate;
    }

    private handleSingle(cmdRaw: string, args: string): Record<string, unknown> {
        const cmd = cmdRaw.trim();
        const lower = cmd.toLowerCase();

        if (isFlashNextionCmd(cmd)) {
            this.log.warn({ cmd }, 'FlashNextion ignored by simulator');
            return { [cmd]: 'Done' };
        }

        switch (lower) {
            case 'status':
                return this.handleStatus(args.trim());
            case 'mqtthost':
                return this.setKv('MqttHost', 'mqttHost', args, true);
            case 'mqttport':
                return this.setNumeric('MqttPort', 'mqttPort', args, true);
            case 'mqttuser':
                return this.setKv('MqttUser', 'mqttUser', args, true);
            case 'mqttpassword': {
                const pw = args.trim();
                this.log.info({ len: pw.length, head: pw.slice(0, 3), tail: pw.slice(-3) }, 'MqttPassword stored');
                this.store.update({ mqttPassword: pw });
                this.credentialsDirty = true;
                return { MqttPassword: '****' };
            }
            case 'mqttclient':
                return this.setKv('MqttClient', 'mqttClient', args, true);
            case 'fulltopic': {
                const ft = args.trim();
                this.store.update({ fullTopic: ft });
                const topic = ft.replace(/\/?%prefix%\/?$/, '').replace(/\/$/, '');
                if (topic) {
                    this.store.update({ topic });
                }
                this.credentialsDirty = true;
                return { FullTopic: ft };
            }
            case 'friendlyname1': {
                const v = args.trim();
                this.store.update({ friendlyName: v });
                return { FriendlyName1: v };
            }
            case 'hostname': {
                const v = args.trim();
                this.store.update({ hostname: v });
                return { Hostname: v };
            }
            case 'setoption103':
                return this.setNumeric('SetOption103', 'setOption103', args, false);
            case 'setoption111':
                return this.setNumeric('SetOption111', 'setOption111', args, false);
            case 'setoption132':
                return this.setNumeric('SetOption132', 'setOption132', args, false);
            case 'weblog': {
                const v = Number(args.trim());
                if (Number.isFinite(v)) {
                    this.store.update({ weblog: v });
                }
                return { WebLog: this.store.state.weblog };
            }
            case 'template': {
                const v = args.trim();
                this.store.update({ template: v });
                return { Template: v };
            }
            case 'module': {
                const v = Number(args.trim());
                if (Number.isFinite(v)) {
                    this.store.update({ moduleType: v });
                }
                return { Module: `${this.store.state.moduleType} (User configured)` };
            }
            case 'timezone': {
                const v = args.trim();
                this.store.update({ timezoneOffset: v });
                return { Timezone: v };
            }
            case 'adcparam':
                return { AdcParam: args.trim() };
            case 'getdriverversion':
                return { nlui_driver_version: this.displayVersion };
            case 'ping': {
                const host = args.trim() || 'localhost';
                const result = {
                    Ping: {
                        [host]: {
                            Reachable: true,
                            IP: '127.0.0.1',
                            Success: 4,
                            Errors: 0,
                            Timeout: 0,
                            MinTime: 1,
                            MaxTime: 3,
                            AvgTime: 2,
                        },
                    },
                };
                if (this.bridge?.isConnected()) {
                    setTimeout(() => this.bridge?.publishTele(SUFFIX_RESULT, JSON.stringify(result)), 200).unref?.();
                }
                return result;
            }
            case 'mqttretry':
                return { MqttRetry: Number(args.trim()) || 10 };
            case 'urlfetch': {
                const url = args.trim();
                this.log.info({ url }, 'UrlFetch (simulated download)');
                if (this.bridge?.isConnected()) {
                    setTimeout(() => this.bridge?.publishStat(SUFFIX_RESULT, JSON.stringify({ UrlFetch: 'Done' })), 200).unref?.();
                }
                return { UrlFetch: 'Done' };
            }
            case 'ufsdelete':
                return { UfsDelete: 'Done' };
            case 'ufsrename':
                return { UfsRename: 'Done' };
            case 'updatedriverversion': {
                this.log.info({ url: args.trim() }, 'UpdateDriverVersion (simulated)');
                if (this.bridge?.isConnected()) {
                    setTimeout(
                        () => this.bridge?.publishStat(SUFFIX_RESULT, JSON.stringify({ UpdateDriverVersion: 'Done' })),
                        200,
                    ).unref?.();
                }
                return { UpdateDriverVersion: 'Done' };
            }
            case 'restart': {
                const v = Number(args.trim());
                if (v >= 1) {
                    this.store.update({ bootCount: this.store.state.bootCount + 1 });
                    void Promise.resolve(this.events.onRestart()).catch(err =>
                        this.log.error({ err: (err as Error).message }, 'onRestart failed'),
                    );
                    return { Restart: 'Restarting' };
                }
                return { Restart: 'No' };
            }
            default:
                this.log.debug({ cmd, args }, 'Unhandled tasmota cmd, returning generic Done');
                return { [cmd]: 'Done' };
        }
    }

    private setKv(
        responseKey: string,
        stateKey: 'mqttHost' | 'mqttUser' | 'mqttClient',
        args: string,
        markDirty: boolean,
    ): Record<string, unknown> {
        const v = args.trim();
        this.store.update({ [stateKey]: v });
        if (markDirty) {
            this.credentialsDirty = true;
        }
        return { [responseKey]: v };
    }

    private setNumeric(
        responseKey: string,
        stateKey: 'mqttPort' | 'setOption103' | 'setOption111' | 'setOption132',
        args: string,
        markDirty: boolean,
    ): Record<string, unknown> {
        const v = Number(args.trim());
        if (!Number.isFinite(v)) {
            return { [responseKey]: this.store.state[stateKey] };
        }
        if (stateKey === 'setOption103' || stateKey === 'setOption111' || stateKey === 'setOption132') {
            this.store.update({ [stateKey]: v === 0 ? 0 : 1 });
        } else {
            this.store.update({ [stateKey]: v });
        }
        if (markDirty) {
            this.credentialsDirty = true;
        }
        return { [responseKey]: v };
    }

    private handleStatus(arg: string): Record<string, unknown> {
        switch (arg) {
            case '':
            case '0':
                return buildStatus0(this.store.state, this.runtime);
            case '2':
                return buildStatusFwrOnly(this.runtime);
            case '5':
                return buildStatusNet(this.store.state);
            case '10':
                return buildStatusSensor();
            default:
                return { Status: `Status ${arg} not implemented` };
        }
    }
}
