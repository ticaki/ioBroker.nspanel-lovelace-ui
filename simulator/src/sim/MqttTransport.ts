import mqtt, { type MqttClient, type IClientOptions } from 'mqtt';
import type { Logger } from '../log.js';
import { LWT_OFFLINE, LWT_ONLINE, SUFFIX_LWT } from './const/topics.js';

export interface MqttCredentials {
    host: string;
    port: number;
    username: string | null;
    password: string | null;
    clientId: string;
    topic: string;
    useTls: boolean;
}

export type CommandHandler = (commandName: string, payload: string) => void;

export class MqttTransport {
    private client: MqttClient | null = null;
    private readonly log: Logger;
    private readonly handler: CommandHandler;
    private creds: MqttCredentials | null = null;

    constructor(opts: { log: Logger; handler: CommandHandler }) {
        this.log = opts.log;
        this.handler = opts.handler;
    }

    isConnected(): boolean {
        return this.client?.connected === true;
    }

    get topic(): string {
        return this.creds?.topic ?? '';
    }

    async connect(creds: MqttCredentials): Promise<void> {
        await this.disconnect('Reconnect');
        this.creds = creds;

        const scheme = creds.useTls ? 'mqtts' : 'mqtt';
        const url = `${scheme}://${creds.host}:${creds.port}`;
        const options: IClientOptions = {
            clientId: creds.clientId,
            clean: true,
            keepalive: 30,
            reconnectPeriod: 5000,
            connectTimeout: 10_000,
            will: {
                topic: `${creds.topic}/tele/${SUFFIX_LWT}`,
                payload: Buffer.from(LWT_OFFLINE),
                qos: 0,
                retain: true,
            },
        };
        if (creds.username) {
            options.username = creds.username;
        }
        if (creds.password) {
            options.password = creds.password;
        }
        if (creds.useTls) {
            options.rejectUnauthorized = false;
        }

        this.log.info(
            {
                url,
                clientId: creds.clientId,
                topic: creds.topic,
                user: creds.username ?? '<anon>',
                tls: creds.useTls,
                pwLen: creds.password?.length ?? 0,
                pwHead: creds.password?.slice(0, 3) ?? '',
                pwTail: creds.password?.slice(-3) ?? '',
            },
            'MQTT connect',
        );
        const client = mqtt.connect(url, options);
        this.client = client;

        client.on('error', err => this.log.error({ err: err.message }, 'MQTT error'));
        client.on('reconnect', () => this.log.warn('MQTT reconnecting'));
        client.on('close', () => this.log.warn('MQTT closed'));

        await new Promise<void>((resolve, reject) => {
            const onConnect = (): void => {
                client.removeListener('error', onErrorOnce);
                resolve();
            };
            const onErrorOnce = (err: Error): void => {
                client.removeListener('connect', onConnect);
                client.end(true);
                reject(err);
            };
            client.once('connect', onConnect);
            client.once('error', onErrorOnce);
        });

        client.on('message', (topic, payload) => {
            const text = payload.toString('utf8');
            const prefix = `${creds.topic}/cmnd/`;
            if (!topic.startsWith(prefix)) {
                this.log.debug({ topic }, 'Ignoring message outside cmnd/ namespace');
                return;
            }
            const cmd = topic.slice(prefix.length);
            this.log.debug({ cmd, payload: text }, 'cmnd received');
            try {
                this.handler(cmd, text);
            } catch (err: unknown) {
                this.log.error({ err: (err as Error).message, cmd }, 'Command handler threw');
            }
        });

        await new Promise<void>((resolve, reject) => {
            client.subscribe(`${creds.topic}/cmnd/+`, { qos: 0 }, err => (err ? reject(err) : resolve()));
        });

        client.publish(`${creds.topic}/tele/${SUFFIX_LWT}`, LWT_ONLINE, { retain: true, qos: 0 });
        this.log.info({ topic: creds.topic }, 'MQTT subscribed and LWT=Online published');
    }

    publishStat(suffix: string, payload: string): void {
        const c = this.client;
        const t = this.creds?.topic;
        if (!c || !t) {
            this.log.warn({ suffix }, 'publishStat called before connect');
            return;
        }
        c.publish(`${t}/stat/${suffix}`, payload, { qos: 0 });
    }

    publishTele(suffix: string, payload: string): void {
        const c = this.client;
        const t = this.creds?.topic;
        if (!c || !t) {
            this.log.warn({ suffix }, 'publishTele called before connect');
            return;
        }
        c.publish(`${t}/tele/${suffix}`, payload, { qos: 0 });
    }

    publishStatRetained(suffix: string, payload: string): void {
        const c = this.client;
        const t = this.creds?.topic;
        if (!c || !t) {
            return;
        }
        c.publish(`${t}/stat/${suffix}`, payload, { qos: 0, retain: true });
    }

    async disconnect(reason: string): Promise<void> {
        const c = this.client;
        if (!c) {
            return;
        }
        const t = this.creds?.topic;
        try {
            if (t && c.connected) {
                c.publish(`${t}/tele/${SUFFIX_LWT}`, LWT_OFFLINE, { retain: true, qos: 0 });
            }
            await new Promise<void>(resolve => c.end(false, undefined, () => resolve()));
        } catch (err: unknown) {
            this.log.warn({ err: (err as Error).message, reason }, 'MQTT disconnect error');
        }
        this.client = null;
    }
}
