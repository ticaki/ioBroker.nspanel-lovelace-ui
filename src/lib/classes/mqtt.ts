import mqtt, { type IClientPublishOptions } from 'mqtt'; // import namespace "mqtt"
import { Level } from 'level';

//@ts-expect-error no types
import aedesPersistencelevel from 'aedes-persistence-level';
import * as factory from 'aedes-server-factory';
import { BaseClass, type AdapterClassDefinition } from '../controller/library';

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

    // Flat registry of subscriptions (topic + callback)
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
            username,
            password,
            clientId: this.clientId,
            rejectUnauthorized: false,
        });

        this.client.on('connect', () => {
            this.log.debug('MQTT connected.');
            this.ready = true;
            if (this._onConnect) {
                this._onConnect.callback(this._onConnect.timeout);
            }
            void this.adapter.setState('info.connection', true, true);
        });

        this.client.on('disconnect', () => {
            this.ready = false;
            this.log.info('MQTT disconnected (graceful).');
            if (this._onDisconnect) {
                void this._onDisconnect.callback(this._onDisconnect.timeout);
            }
            void this.adapter.setState('info.connection', false, true);
        });

        this.client.on('error', err => {
            this.ready = false;

            this.log.error(`MQTT error: ${String(err)}`);
        });

        this.client.on('close', () => {
            this.ready = false;
            this.log.info('MQTT connection closed.');
            if (this._onDisconnect) {
                void this._onDisconnect.callback(this._onDisconnect.timeout);
            }
            void this.adapter.setState('info.connection', false, true);
        });

        this.client.on('message', (topic, message) => {
            const _helper = async (topic: string, message: Buffer): Promise<void> => {
                // NOTE: Simple prefix match with '/#' trimming, unchanged semantics
                const callbacks = this.subscriptDB.filter(entry => topic.startsWith(entry.topic.replace('/#', '')));

                if (this.adapter.config.debugLogMqtt) {
                    this.log.debug(
                        `MQTT message: matched ${callbacks.length} handler(s) | topic="${topic}" | payload="${message.toString()}"`,
                    );
                }

                const toRemove: Array<{ topic: string; callback: callbackMessageType }> = [];
                for (const c of callbacks) {
                    try {
                        if (await c.callback(topic, message.toString())) {
                            toRemove.push({ topic: c.topic, callback: c.callback });
                        }
                    } catch (e) {
                        this.log.warn(
                            `MQTT handler threw for topic="${topic}": ${String(e)} (handler kept, no unsubscribe)`,
                        );
                    }
                }

                if (toRemove.length > 0) {
                    // Remove only the finished callback entries.
                    for (const rem of toRemove) {
                        const before = this.countCallbacks(rem.topic);
                        this.removeSubscriptionEntry(rem.topic, rem.callback);
                        const after = this.countCallbacks(rem.topic);

                        if (after === 0) {
                            // No remaining callbacks for this topic -> broker unsubscribe
                            this.unsubscribe(rem.topic); // keeps external log text and behavior of unsubscribe()
                        } else if (this.adapter.config.debugLogMqtt) {
                            this.log.debug(
                                `MQTT keep subscription: topic="${rem.topic}" still has ${after}/${before} handler(s)`,
                            );
                        }
                    }
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
                callback: (timeoutRef: ioBroker.Timeout | undefined) => {
                    if (timeoutRef) {
                        this.adapter.clearTimeout(timeoutRef);
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
            this.log.debug(`Wait for panel connect on: ${topic}`);
            let ref: ioBroker.Timeout | undefined;
            if (timeout > 0) {
                ref = this.adapter.setTimeout(() => {
                    reject(new Error(`Timeout for main mqttclient after ${timeout}ms`));
                }, timeout);
            }

            void this.subscribe(topic, async () => {
                if (ref) {
                    this.adapter.clearTimeout(ref);
                }
                this.log.debug(`Panel connect detected: ${topic}`);
                resolve();
                return true; // remove this one-shot listener
            });
        });
    }

    async publish(topic: string, message: string, opt?: IClientPublishOptions): Promise<void> {
        try {
            if (!this.client.connected) {
                if (this.adapter.config.debugLogMqtt) {
                    this.log.debug(`Publish skipped (not connected): topic="${topic}" payload="${message}"`);
                }
                return;
            }
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`Publish: topic="${topic}" payload="${message}"`);
            }
            await this.client.publishAsync(topic, message, opt);
        } catch (e) {
            this.log.error(`Error in publish (topic="${topic}"): ${e as string}`);
        }
    }

    unsubscribe(topic: string): void {
        // Remove a single entry then unsubscribe broker-side; this mirrors original behavior.
        const index = this.subscriptDB.findIndex(m => m.topic === topic);
        if (index !== -1) {
            this.subscriptDB.splice(index, 1);
            const count = this.countCallbacks(topic);
            if (count === 0) {
                this.log.debug(`unsubscribe from: ${topic}`);
                this.client.unsubscribe(topic);
            } else if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`keep subscription: topic="${topic}" still has ${count} handler(s)`);
            }
        }
    }
    removeByFunction(callback: callbackMessageType): void {
        // Remove all entries with this callback, then unsubscribe broker-side if needed.
        const toRemove = this.subscriptDB.filter(m => m.callback === callback);
        for (const rem of toRemove) {
            this.removeSubscriptionEntry(rem.topic, rem.callback);
            const count = this.countCallbacks(rem.topic);
            if (count === 0) {
                this.log.debug(`unsubscribe from: ${rem.topic}`);
                this.client.unsubscribe(rem.topic);
            } else if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`keep subscription: topic="${rem.topic}" still has ${count} handler(s)`);
            }
        }
    }

    async subscribe(topic: string, callback: callbackMessageType): Promise<void> {
        // Prevent duplicate (topic+callback) pairs
        if (this.subscriptDB.findIndex(m => m.topic === topic && m.callback === callback) !== -1) {
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`subscribe skipped (duplicate handler): ${topic}`);
            }
            return;
        }

        const firstOnTopic = this.subscriptDB.findIndex(m => m.topic === topic) === -1;
        this.subscriptDB.push({ topic, callback });

        if (firstOnTopic) {
            this.log.debug(`subscribe to: ${topic}`);
            await this.client.subscribeAsync(topic, { qos: 1 });
        } else if (this.adapter.config.debugLogMqtt) {
            const count = this.countCallbacks(topic);
            this.log.debug(`added handler for topic="${topic}" (handlers on topic: ${count})`);
        }
    }

    async destroy(): Promise<void> {
        await this.delete();
        const endMqttClient = (): Promise<void> =>
            new Promise(resolve => {
                this.client.end(false, () => resolve());
            });
        await endMqttClient();
    }

    // ========= Internal helpers (no change to external API/returns) =========

    /**
     * Count registered callbacks for a given topic.
     *
     * @param topic the topic to check
     */
    private countCallbacks(topic: string): number {
        return this.subscriptDB.reduce((acc, m) => (m.topic === topic ? acc + 1 : acc), 0);
    }

    /**
     * Remove exactly one (topic, callback) pair from registry (no logging, no broker action).
     *
     * @param topic the topic
     * @param callback the callback
     */
    private removeSubscriptionEntry(topic: string, callback: callbackMessageType): void {
        const idx = this.subscriptDB.findIndex(m => m.topic === topic && m.callback === callback);
        if (idx !== -1) {
            this.subscriptDB.splice(idx, 1);
        }
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
        testCase: boolean = false,
    ): Promise<MQTTServerClass> {
        let mqttKeys: Record<'certPem' | 'privateKey' | 'publicKey', string> | undefined;

        if (
            (await adapter.fileExistsAsync(adapter.namespace, 'keys/private-key.pem')) &&
            (await adapter.fileExistsAsync(adapter.namespace, 'keys/public-key.pem')) &&
            (await adapter.fileExistsAsync(adapter.namespace, 'keys/certificate.pem'))
        ) {
            try {
                const privateKey = (
                    await adapter.readFileAsync(adapter.namespace, 'keys/private-key.pem')
                ).file.toString();
                const publicKey = (
                    await adapter.readFileAsync(adapter.namespace, 'keys/public-key.pem')
                ).file.toString();
                const certificate = (
                    await adapter.readFileAsync(adapter.namespace, 'keys/certificate.pem')
                ).file.toString();

                await adapter.writeFileAsync(`${adapter.namespace}.keys`, 'private-key.pem', privateKey);
                await adapter.writeFileAsync(`${adapter.namespace}.keys`, 'public-key.pem', publicKey);
                await adapter.writeFileAsync(`${adapter.namespace}.keys`, 'certificate.pem', certificate);

                await adapter.delFileAsync(adapter.namespace, 'keys/private-key.pem');
                await adapter.delFileAsync(adapter.namespace, 'keys/public-key.pem');
                await adapter.delFileAsync(adapter.namespace, 'keys/certificate.pem');
                adapter.log.info(`Moved keys to ${adapter.namespace}.keys`);
            } catch (err) {
                adapter.log.error(`Failed to migrate key files: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        if (
            (await adapter.fileExistsAsync(`${adapter.namespace}.keys`, 'private-key.pem')) &&
            (await adapter.fileExistsAsync(`${adapter.namespace}.keys`, 'public-key.pem')) &&
            (await adapter.fileExistsAsync(`${adapter.namespace}.keys`, 'certificate.pem'))
        ) {
            try {
                mqttKeys = { privateKey: '', publicKey: '', certPem: '' };
                mqttKeys.privateKey = (
                    await adapter.readFileAsync(`${adapter.namespace}.keys`, 'private-key.pem')
                ).file.toString();
                mqttKeys.publicKey = (
                    await adapter.readFileAsync(`${adapter.namespace}.keys`, 'public-key.pem')
                ).file.toString();
                mqttKeys.certPem = (
                    await adapter.readFileAsync(`${adapter.namespace}.keys`, 'certificate.pem')
                ).file.toString();
                await adapter.extendObject(`${adapter.namespace}`, {
                    type: 'meta',
                    native: {
                        mqttKeys,
                    },
                });

                await adapter.delFileAsync(`${adapter.namespace}.keys`, 'private-key.pem');
                await adapter.delFileAsync(`${adapter.namespace}.keys`, 'public-key.pem');
                await adapter.delFileAsync(`${adapter.namespace}.keys`, 'certificate.pem');
                adapter.log.info(`Moved keys to ${adapter.namespace}.keys`);
            } catch (err) {
                adapter.log.error(`Failed to migrate key files: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        const obj = await adapter.getObjectAsync(`${adapter.namespace}`);
        if (obj?.native?.mqttKeys) {
            mqttKeys = obj.native.mqttKeys as keyof typeof mqttKeys;
        }

        if (!(mqttKeys?.privateKey && mqttKeys?.publicKey && mqttKeys?.certPem)) {
            adapter.log.info(`Create new keys for MQTT server.`);
            mqttKeys = { privateKey: '', publicKey: '', certPem: '' };

            // Schlüsselpaar generieren
            const prekeys = forge.pki.rsa.generateKeyPair(4096);
            mqttKeys.privateKey = forge.pki.privateKeyToPem(prekeys.privateKey);
            mqttKeys.publicKey = forge.pki.publicKeyToPem(prekeys.publicKey);

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
            mqttKeys.certPem = forge.pki.certificateToPem(cert);

            // In Dateien speichern

            // Schlüssel in Objekt speichern
            await adapter.extendObject(`${adapter.namespace}`, {
                type: 'meta',
                native: {
                    mqttKeys,
                },
            });
        }
        return new MQTTServerClass(adapter, port, username, password, path, mqttKeys, testCase);
    }

    constructor(
        adapter: AdapterClassDefinition,
        port: number,
        username: string,
        password: string,
        path: string,
        keyPair: Record<string, string>,
        testCase: boolean = false,
    ) {
        super(adapter, 'mqttServer');
        const persistence = aedesPersistencelevel(new Level(path));

        this.aedes = new Aedes({ persistence: persistence });
        if (testCase) {
            //nothing
        }
        this.server = factory.createServer(this.aedes, {
            tls: {
                key: Buffer.from(keyPair.privateKey),
                cert: Buffer.from(keyPair.certPem),
            },
        });
        //this.server = createServer(this.aedes.handle);

        this.server.listen(port, () => {
            this.ready = true;
            this.log.info(`MQTT server started and listening on port ${port}`);
        });

        // Logge explizit Fehler beim Server-Socket (z. B. Port schon belegt)
        this.server.on('error', err => {
            this.ready = false;
            this.log.error(`MQTT server error on port ${port}: ${String(err)}`);
        });
        this.aedes.authenticate = (
            client: Client,
            un: Readonly<string | undefined>,
            pw: Readonly<Buffer | undefined>,
            callback: any,
        ) => {
            const confirm = username === un && password === pw?.toString();
            if (!confirm) {
                this.log.warn(`Login denied: client="${client.id}", username="${un ?? 'undefined'}"`);
            } else {
                this.log.debug(`Client "${client.id}" login successful (user="${un ?? 'undefined'}").`);
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
