import mqtt, { IClientPublishOptions } from 'mqtt'; // import namespace "mqtt"
import { Level } from 'level';

//@ts-expect-error no types
import aedesPersistencelevel from 'aedes-persistence-level';

import { AdapterClassDefinition, BaseClass } from './library';

import Aedes, { Client } from 'aedes';
import { Server, createServer } from 'net';
import { NspanelLovelaceUi } from '../main';

type callbackMessageType = (topic: string, message: string) => void;

export class MQTTClientClass extends BaseClass {
    client: mqtt.MqttClient;
    data: any = {};
    ready: boolean = false;
    public messageCallback: callbackMessageType;

    private subscriptDB: { topic: string; callback: callbackMessageType }[] = [];

    constructor(
        adapter: AdapterClassDefinition,
        ip: string,
        port: number,
        username: string,
        password: string,
        callback: callbackMessageType,
    ) {
        super(adapter, 'mqttClient');
        this.messageCallback = callback;
        this.client = mqtt.connect(`mqtt://${ip}:${port}`, {
            username: username,
            password: password,
            clientId: `iobroker_${this.adapter.namespace}`,
        });
        this.client.on('connect', () => {
            this.log.info(`Connection is active.`);
            this.adapter.setState('info.connection', true, true);
            this.ready = true;
        });
        this.client.on('disconnect', () => {
            this.ready = false;
            this.adapter.setState('info.connection', false, true);
            this.log.debug(`disconnected`);
        });
        this.client.on('error', (err) => {
            this.ready = false;
            this.log.error(`${err}`);
        });

        this.client.on('close', () => {
            this.ready = false;
            this.adapter.setState('info.connection', false, true);
            this.log.info(`Connection is closed.`);
        });

        this.client.on('message', (topic, message) => {
            this.log.debug(`Incoming message topic: ${topic} message: ${message}}`);
            const callbacks = this.subscriptDB.filter((i) => {
                return topic.startsWith(i.topic);
            });
            this.log.debug(`Incoming message for ${callbacks.length} subproceses`);
            callbacks.forEach((c) => c.callback(topic, message.toString()));
        });
    }

    async publish(topic: string, message: string, opt?: IClientPublishOptions): Promise<void> {
        this.log.debug(`Publishing topic: ${topic} with message: ${message}.`);
        await this.client.publishAsync(topic, message, opt);
    }

    subscript(topic: string, callback: callbackMessageType): void {
        if (this.subscriptDB.findIndex((m) => m.topic === topic && m.callback === callback) !== -1) return;
        if (!this.ready) {
            setTimeout(
                (topic, callback) => {
                    this.subscript(topic, callback);
                },
                5000,
                topic,
                callback,
            );
            return;
        }
        const aNewOne = this.subscriptDB.findIndex((m) => m.topic === topic) !== -1;
        this.subscriptDB.push({ topic, callback });
        if (aNewOne) {
            this.client.subscribe(topic, (err) => {
                if (err) {
                    this.log.error(`On subscribe: ${err}`);
                }
            });
        }
    }
    destroy(): void {
        this.client.end();
    }
}

export class MQTTServerClass extends BaseClass {
    aedes: Aedes;
    server: Server;
    constructor(adapter: NspanelLovelaceUi, port: number, username: string, password: string, path: string) {
        super(adapter, 'mqttServer');
        const persistence = aedesPersistencelevel(new Level(path));
        this.aedes = new Aedes({ persistence: persistence });
        this.server = createServer(this.aedes.handle);

        this.server.listen(port, () => {
            this.log.info(`Started and listening on port ${port}`);
        });
        this.aedes.authenticate = (
            client: Client,
            un: Readonly<string | undefined>,
            pw: Readonly<Buffer | undefined>,
            callback: any,
        ) => {
            const confirm = username === un && password == pw!.toString();
            if (!confirm) this.log.warn(`Login denied client: ${client.id}. User name or password wrong!`);
            else this.log.info(`Client ${client.id} login successful.`);
            callback(null, confirm);
        };
    }
    destroy(): void {
        this.aedes.close();
        this.server.close();
    }
}
