import mqtt, { type IClientPublishOptions } from 'mqtt'; // import namespace "mqtt"
import { Level } from 'level';

//@ts-expect-error no types
import aedesPersistencelevel from 'aedes-persistence-level';
import * as factory from 'aedes-server-factory';
import { BaseClass, type AdapterClassDefinition } from './library';

import Aedes, { type Client } from 'aedes';
import { type Server } from 'net';
import { randomUUID } from 'node:crypto';
import * as forge from 'node-forge';
import type { Controller } from '../controller/controller';
export type callbackMessageType = (topic: string, message: string) => Promise<void | boolean>;
export type callbackConnectType = () => Promise<void>;

// RSA-Schlüsselpaar erzeugen (4096 Bit für hohe Sicherheit)

export class MQTTClientClass extends BaseClass {
    client: mqtt.MqttClient;
    data: any = {};
    ready: boolean = false;
    public messageCallback: callbackMessageType;
    clientId: string;
    private subscriptDB: { topic: string; callback: callbackMessageType }[] = [];
    _onConnect?: { timeout: ioBroker.Timeout | undefined; callback: (timeout: ioBroker.Timeout | undefined) => void };
    _onDisconnect?: {
        timeout: ioBroker.Timeout | undefined;
        callback: (timeout: ioBroker.Timeout | undefined) => void;
    };

    constructor(
        adapter: AdapterClassDefinition,
        ip: string,
        port: number,
        username: string,
        password: string,
        tls: boolean,
        callback: callbackMessageType,
    ) {
        super(adapter, 'mqttClient');
        this.clientId = `iobroker_${randomUUID()}`;
        this.messageCallback = callback;
        this.client = mqtt.connect(`${tls ? 'tls' : 'mqtt'}://${ip}:${port}`, {
            username: username,
            password: password,
            clientId: this.clientId,
            rejectUnauthorized: false,
        });
        this.client.on('connect', () => {
            this.log.info(`Connection is active.`);
            this.ready = true;
            if (this._onConnect) {
                this._onConnect.callback(this._onConnect.timeout);
            }
            void this.adapter.setState('info.connection', true, true);
        });
        this.client.on('disconnect', () => {
            this.log.info(`Disconnected.`);
            this.ready = false;
            this.log.debug(`disconnected`);
            if (this._onDisconnect) {
                void this._onDisconnect.callback(this._onDisconnect.timeout);
            }
            void this.adapter.setState('info.connection', false, true);
        });
        this.client.on('error', err => {
            this.ready = false;
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            this.log.error(`${String(err)}`);
        });

        this.client.on('close', () => {
            this.ready = false;
            this.log.info(`Connection is closed.`);
            if (this._onDisconnect) {
                void this._onDisconnect.callback(this._onDisconnect.timeout);
            }
            void this.adapter.setState('info.connection', false, true);
        });

        this.client.on('message', (topic, message) => {
            const _helper = async (topic: string, message: Buffer): Promise<void> => {
                const callbacks = this.subscriptDB.filter(i => {
                    return topic.startsWith(i.topic.replace('/#', ''));
                });
                if (this.adapter.config.debugLogMqtt) {
                    this.log.debug(
                        `Incoming message for ${callbacks.length} subproceses. topic: ${topic} message: ${message.toString()}`,
                    );
                }
                const remove = [];
                for (const c of callbacks) {
                    if (await c.callback(topic, message.toString())) {
                        remove.push(c);
                    }
                }
                if (remove.length > 0) {
                    remove.forEach(a => this.unsubscribe(a.topic));
                }
            };
            void _helper(topic, message);
        });
    }
    async waitConnectAsync(timeout: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this._onConnect = {
                timeout: this.adapter.setTimeout(() => {
                    reject(new Error(`Timeout for main mqttclient after ${timeout}ms`));
                }, timeout),
                callback: (timeout: ioBroker.Timeout | undefined) => {
                    if (timeout) {
                        this.adapter.clearTimeout(timeout);
                    }
                    this._onConnect = undefined;
                    resolve();
                },
            };
        });
    }
    async waitPanelConnectAsync(_topic: string, timeout: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const topic = `${_topic}/tele/INFO1`;
            this.log.debug(`wait for panel connect: ${topic}`);
            let ref: ioBroker.Timeout | undefined = undefined;
            if (timeout > 0) {
                ref = this.adapter.setTimeout(() => {
                    reject(new Error(`Timeout for main mqttclient after ${timeout}ms`));
                }, timeout);
            }

            void this.subscript(topic, async (_topic, _message) => {
                if (ref) {
                    this.adapter.clearTimeout(ref);
                }
                this.log.debug(`done connect: ${topic}`);
                resolve();
                return true;
            });
        });
    }
    async publish(topic: string, message: string, opt?: IClientPublishOptions): Promise<void> {
        try {
            if (!this.client.connected) {
                if (this.adapter.config.debugLogMqtt) {
                    this.log.debug(`Not connected. Can't publish topic: ${topic} with message: ${message}.`);
                }
                return;
            }
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`Publish topic: ${topic} with message: ${message}.`);
            }
            await this.client.publishAsync(topic, message, opt);
        } catch (e) {
            this.log.error(`Error in publish: ${e as string}`);
        }
    }

    unsubscribe(topic: string): void {
        const index = this.subscriptDB.findIndex(m => m.topic === topic);
        if (index !== -1) {
            this.subscriptDB.splice(index, 1);
            this.log.debug(`unsubscribe from: ${topic}`);
            this.client.unsubscribe(topic);
        }
    }

    async subscript(topic: string, callback: callbackMessageType): Promise<void> {
        if (this.subscriptDB.findIndex(m => m.topic === topic && m.callback === callback) !== -1) {
            return;
        }
        const aNewOne = this.subscriptDB.findIndex(m => m.topic === topic) === -1;
        this.subscriptDB.push({ topic, callback });
        if (aNewOne) {
            this.log.debug(`subscripe to: ${topic}`);

            await this.client.subscribeAsync(topic, { qos: 1 });
        }
    }
    async destroy(): Promise<void> {
        await this.delete();
        const endMqttClient = (): Promise<void> => {
            return new Promise(resolve => {
                this.client.end(false, () => {
                    resolve();
                });
            });
        };
        await endMqttClient();
    }
}

export class MQTTServerClass extends BaseClass {
    aedes: Aedes;
    server: Server;
    controller: Controller | undefined;
    intervals: (ioBroker.Interval | undefined)[] = [];
    callbacks: { [key: string]: { callback: () => void; timeout: ioBroker.Timeout | undefined } } = {};
    ready: boolean = false;
    test: Promise<void> | undefined = undefined;

    static async createMQTTServer(
        adapter: AdapterClassDefinition,
        port: number,
        username: string,
        password: string,
        path: string,
    ): Promise<MQTTServerClass> {
        let keys: Record<string, string> = {};

        if (
            !(await adapter.fileExistsAsync(adapter.namespace, 'keys/private-key.pem')) ||
            !(await adapter.fileExistsAsync(adapter.namespace, 'keys/public-key.pem')) ||
            !(await adapter.fileExistsAsync(adapter.namespace, 'keys/certificate.pem'))
        ) {
            adapter.log.info(`Create new keys for MQTT server.`);
            const prekeys = forge.pki.rsa.generateKeyPair(4096);
            keys.privateKey = forge.pki.privateKeyToPem(prekeys.privateKey);
            keys.publicKey = forge.pki.publicKeyToPem(prekeys.publicKey);

            // Zertifikat erstellen
            const cert = forge.pki.createCertificate();
            cert.publicKey = prekeys.publicKey;
            cert.serialNumber = '01'; // Eine eindeutige Seriennummer als HEX
            cert.validity.notBefore = new Date();
            cert.validity.notAfter = new Date();
            cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1); // 1 Jahr gültig

            // Zertifikats-Infos (X.509 Subject & Issuer)
            const attrs = [
                { name: 'commonName', value: 'localhost' },
                { name: 'countryName', value: 'DE' },
                { name: 'organizationName', value: 'Meine Firma' },
            ];
            cert.setSubject(attrs);
            cert.setIssuer(attrs);

            // Selbstsignieren mit SHA-256
            cert.sign(prekeys.privateKey, forge.md.sha256.create());

            // PEM-Format exportieren
            keys.certPem = forge.pki.certificateToPem(cert);

            // In Dateien speichern

            // Schlüssel in Dateien speichern
            await adapter.writeFileAsync(adapter.namespace, 'keys/private-key.pem', keys.privateKey);
            await adapter.writeFileAsync(adapter.namespace, 'keys/public-key.pem', keys.publicKey);
            await adapter.writeFileAsync(adapter.namespace, 'keys/certificate.pem', keys.certPem);
        } else {
            keys = {
                publicKey: (await adapter.readFileAsync(adapter.namespace, 'keys/public-key.pem')).file.toString(),
                privateKey: (await adapter.readFileAsync(adapter.namespace, 'keys/private-key.pem')).file.toString(),
                certPem: (await adapter.readFileAsync(adapter.namespace, 'keys/certificate.pem')).file.toString(),
            };
        }
        return new MQTTServerClass(adapter, port, username, password, path, keys);
    }

    constructor(
        adapter: AdapterClassDefinition,
        port: number,
        username: string,
        password: string,
        path: string,
        keyPair: Record<string, string>,
    ) {
        super(adapter, 'mqttServer');
        const persistence = aedesPersistencelevel(new Level(path));

        this.aedes = new Aedes({ persistence: persistence });
        this.server = factory.createServer(this.aedes, {
            tls: {
                key: Buffer.from(keyPair.privateKey),
                cert: Buffer.from(keyPair.certPem),
            },
        });
        //this.server = createServer(this.aedes.handle);

        this.server.listen(port, () => {
            this.ready = true;
            this.log.info(`Started and listening on port ${port}`);
        });
        this.aedes.authenticate = (
            client: Client,
            un: Readonly<string | undefined>,
            pw: Readonly<Buffer | undefined>,
            callback: any,
        ) => {
            const confirm = username === un && password == pw?.toString();
            if (!confirm) {
                this.log.warn(`Login denied client: ${client.id}. User name or password wrong! ${pw?.toString()}`);
            } else {
                this.log.debug(`Client ${client.id} login successful.`);
            }
            callback(null, confirm);
        };
        this.aedes.on('client', (client: Client) => {
            for (const key in this.callbacks) {
                if (this.callbacks[key]) {
                    if (client.id.startsWith(key)) {
                        if (this.adapter.config.debugLogMqtt) {
                            this.log.debug(`Client ${client.id} connected. Call callback.`);
                        }
                        if (this.callbacks[key].timeout) {
                            this.adapter.clearTimeout(this.callbacks[key].timeout);
                            this.callbacks[key].timeout = undefined;
                        }
                        this.callbacks[key].callback();
                        delete this.callbacks[key];
                    }
                }
            }
            const interval: ioBroker.Interval | undefined = this.adapter.setInterval(
                index => {
                    if (this.controller) {
                        const result = this.controller.mqttClientConnected(client.id);
                        if (result) {
                            this.log.debug(`Client ${client.id} connected.`);
                        }
                        if (result || result === undefined) {
                            this.adapter.clearInterval(this.intervals[index]);
                            this.intervals[index] = undefined;

                            // clear outdated intervals from top to bottom. Break if one is not undefined
                            for (let a = this.intervals.length - 1; a >= 0; a--) {
                                if (this.intervals[a] === undefined) {
                                    this.intervals.splice(a, 1);
                                } else {
                                    break;
                                }
                            }
                        }
                    }
                },
                1000,
                this.intervals.length,
            );
            this.intervals.push(interval);
        });
    }

    destroy(): void {
        void this.delete();
        for (let a = this.intervals.length - 1; a >= 0; a--) {
            if (this.intervals[a] !== undefined) {
                this.adapter.clearInterval(this.intervals[a]);
            }
        }
        this.intervals = [];
        this.aedes.close();
        this.server.close();
    }
}
