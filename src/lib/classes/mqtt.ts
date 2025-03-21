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
export type callbackMessageType = (topic: string, message: string) => void;
export type callbackConnectType = () => Promise<void>;

// RSA-Schlüsselpaar erzeugen (4096 Bit für hohe Sicherheit)

export class MQTTClientClass extends BaseClass {
    client: mqtt.MqttClient;
    data: any = {};
    ready: boolean = false;
    public messageCallback: callbackMessageType;
    clientId: string;
    private subscriptDB: { topic: string; callback: callbackMessageType }[] = [];

    constructor(
        adapter: AdapterClassDefinition,
        ip: string,
        port: number,
        username: string,
        password: string,
        tls: boolean,
        callback: callbackMessageType,
        onConnect?: callbackConnectType,
        onDisconnect?: callbackConnectType,
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
            if (onConnect) {
                void onConnect();
            }
        });
        this.client.on('disconnect', () => {
            this.log.info(`Disconnected.`);
            this.ready = false;
            this.log.debug(`disconnected`);
            if (onDisconnect) {
                void onDisconnect();
            }
        });
        this.client.on('error', err => {
            this.ready = false;
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            this.log.error(`${String(err)}`);
        });

        this.client.on('close', () => {
            this.ready = false;
            this.log.info(`Connection is closed.`);
            if (onDisconnect) {
                void onDisconnect();
            }
        });

        this.client.on('message', (topic, message) => {
            const callbacks = this.subscriptDB.filter(i => {
                return topic.startsWith(i.topic.replace('/#', ''));
            });
            /*this.log.debug(
                `Incoming message for ${callbacks.length} subproceses. topic: ${topic} message: ${message}}`,
            );*/
            callbacks.forEach(c => c.callback(topic, message.toString()));
        });
    }

    async publish(topic: string, message: string, opt?: IClientPublishOptions): Promise<void> {
        if (!this.client.connected) {
            //this.log.debug(`Not connected. Can't publish topic: ${topic} with message: ${message}.`);
            return;
        }
        await this.client.publishAsync(topic, message, opt);
    }

    subscript(topic: string, callback: callbackMessageType): void {
        if (this.subscriptDB.findIndex(m => m.topic === topic && m.callback === callback) !== -1) {
            return;
        }
        const aNewOne = this.subscriptDB.findIndex(m => m.topic === topic) === -1;
        this.subscriptDB.push({ topic, callback });
        if (aNewOne) {
            this.log.debug(`subscripe to: ${topic}`);

            this.client.subscribe(topic, err => {
                if (err) {
                    this.log.error(`On subscribe: ${err}`);
                }
            });
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
    ready: boolean = false;

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
                this.log.info(`Client ${client.id} login successful.`);
            }
            callback(null, confirm);
        };
    }
    destroy(): void {
        void this.delete();
        this.aedes.close();
        this.server.close();
    }
}
