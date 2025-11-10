import type { IClientPublishOptions } from 'mqtt';
import { SendTopicAppendix } from '../const/definition';
import { BaseClass, type AdapterClassDefinition } from './library';
import type { MQTTClientClass, callbackMessageType } from '../classes/mqtt';
import type { Panel } from './panel';

/**
 * Übernimmt das senden von Payloads an die mqtt Klasse - delay zwischen einzelnen Messages
 * 1 * pro Klasse Panel
 */
export class PanelSend extends BaseClass {
    private messageDb: { payload: string; opt?: IClientPublishOptions; ackForType: boolean }[] = [];
    private messageDbTasmota: { topic: string; payload: string; opt?: IClientPublishOptions }[] = [];

    private messageTimeout: ioBroker.Timeout | undefined;
    private messageTimeoutTasmota: ioBroker.Timeout | true | undefined;
    private mqttClient: MQTTClientClass;
    private topic: string = '';
    private configTopic: string = '';
    private losingMessageCount = 0;

    private _losingDelay = 1000;
    panel: Panel | undefined = undefined;

    get losingDelay(): number {
        return this._losingDelay;
    }
    set losingDelay(v: number) {
        this._losingDelay = Math.max(1000, Math.min(30_000, v));
    }
    constructor(
        adapter: AdapterClassDefinition,
        config: { name: string; mqttClient: MQTTClientClass; topic: string; panel: Panel },
    ) {
        super(adapter, config.name);
        this.mqttClient = config.mqttClient;
        void this.mqttClient.subscribe(`${config.topic}/stat/RESULT`, this.onMessage);
        this.configTopic = config.topic;
        this.topic = config.topic + SendTopicAppendix;
        this.panel = config.panel;
    }

    public resetMessageDB(): void {
        this.messageDb = [];
        if (this.messageTimeout) {
            this.adapter.clearTimeout(this.messageTimeout);
        }
        this.messageTimeout = undefined;
        this.losingMessageCount = 0;
        this._losingDelay = 1000;
    }
    onMessage: callbackMessageType = async (topic: string, message: string) => {
        if (this.unload || this.adapter.unload) {
            return;
        }
        if (!topic.endsWith('/stat/RESULT')) {
            return;
        }
        if (this.adapter.config.debugLogMqtt) {
            this.log.debug(`Receive command ${topic} with ${message}`);
        }
        try {
            const msg = JSON.parse(message);
            const ackForType = this.messageDb[0] && this.messageDb[0].ackForType;
            if (msg) {
                if (
                    (ackForType && msg.CustomSend === 'renderCurrentPage') ||
                    (!ackForType && msg.CustomSend === 'Done')
                ) {
                    if (this.messageTimeout) {
                        this.adapter.clearTimeout(this.messageTimeout);
                    }
                    this.losingMessageCount = 0;
                    this._losingDelay = 1000;
                    const oldMessage = this.messageDb.shift();
                    if (oldMessage) {
                        if (oldMessage.payload === 'pageType~pageStartup') {
                            this.messageDb = [];
                        }
                        if (this.adapter.config.debugLogMqtt) {
                            this.log.debug(`Receive ack for ${JSON.stringify(oldMessage)}`);
                        }
                    }

                    this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, 100);
                } else {
                    if (this.adapter.config.additionalLog) {
                        this.log.info(
                            `1: ${!(ackForType && msg.CustomSend === 'renderCurrentPage')} 2: ${!(!ackForType && msg.CustomSend === 'Done')} msg: ${msg.CustomSend}`,
                        );
                    }
                }
            }
        } catch (err: any) {
            this.log.error(`onMessage: ${err}`);
        }
    };

    readonly addMessage = (
        payload: string,
        ackForType: boolean,
        force?: boolean,
        opt?: IClientPublishOptions,
    ): void => {
        if (
            this.messageTimeout !== undefined &&
            this.messageDb.length > 0 &&
            this.messageDb.some(a => a.payload === payload && a.opt === opt)
        ) {
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`Message ${payload} is already in queue - skip adding`);
            }
            return;
        }
        if (!this.panel?.isOnline && force !== true) {
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`Panel is offline - skip adding message ${payload}`);
            }
            return;
        }
        if (force === true) {
            this.resetMessageDB();
        }
        this.messageDb.push({ payload: payload, opt: opt, ackForType: ackForType });
        if (this.messageTimeout === undefined) {
            void this.sendMessageLoop();
        }
    };

    private readonly sendMessageLoop = async (): Promise<void> => {
        const msg = this.messageDb[0];
        if (this.adapter.config.debugLogMqtt) {
            this.log.debug(
                `sendMessageLoop - messages in queue: ${this.messageDb.length} handling message: ${JSON.stringify(msg)}`,
            );
        }
        if (msg === undefined || this.unload) {
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`No message to send or unload - stop send loop`);
            }
            if (this.messageTimeout) {
                this.adapter.clearTimeout(this.messageTimeout);
            }
            this.messageTimeout = undefined;
            return;
        }

        if (this.losingMessageCount > 0 && this.adapter.config.additionalLog) {
            this.log.warn(`send payload: ${JSON.stringify(msg)} to panel. Losing count: ${this.losingMessageCount}`);
        }
        if (this.losingMessageCount++ > 5) {
            if (this.panel) {
                if (this.adapter.config.additionalLog) {
                    this.log.error(`Losing ${this.losingMessageCount} messages - set panel offline!`);
                }
                this.panel.isOnline = false;
            }
        }
        this.losingDelay = this.losingDelay + 2000;

        if (this.unload) {
            return;
        }
        if (!this.adapter.unload) {
            this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, this.losingDelay);
        }
        this.addMessageTasmota(this.topic, msg.payload, msg.opt);
    };

    readonly addMessageTasmota = (topic: string, payload: string, opt?: IClientPublishOptions): void => {
        if (
            this.messageDbTasmota.length > 0 &&
            this.messageDbTasmota.some(a => a.topic === topic && a.payload === payload && a.opt === opt)
        ) {
            if (this.adapter.config.debugLogMqtt) {
                this.log.debug(`Tasmota Message ${payload} is already in queue - skip adding`);
            }
            return;
        }
        if (this.unload || this.adapter.unload) {
            this.messageDbTasmota = [];
        }

        if (this.adapter.config.debugLogMqtt) {
            this.log.debug(`add Tasmota message ${payload} to queue`);
        }
        this.messageDbTasmota.push({ topic: topic, payload: payload, opt: opt });

        if (this.messageTimeoutTasmota === undefined) {
            void this.sendMessageLoopTasmota();
        }
    };
    private readonly sendMessageLoopTasmota = async (): Promise<void> => {
        const msg = this.messageDbTasmota.shift();
        if (msg === undefined) {
            if (this.messageTimeoutTasmota && this.messageTimeoutTasmota !== true) {
                this.adapter.clearTimeout(this.messageTimeoutTasmota);
            }
            this.messageTimeoutTasmota = undefined;
            return;
        }
        //if (this.adapter.config.debugLogMqtt) {
        this.log.debug(`send payload: ${JSON.stringify(msg)} to panel.`);
        //}
        this.messageTimeoutTasmota = true;
        try {
            await this.mqttClient.publish(msg.topic, msg.payload, { ...(msg.opt ?? {}), qos: 1 });
        } catch (e) {
            this.log.warn(`MQTT publish failed: ${(e as Error).message}`);
            // optional: Requeue
            this.messageDbTasmota.unshift(msg);
            this.losingDelay = this.losingDelay + 1000; // sanfter Backoff
        }
        if (this.unload || this.adapter.unload) {
            return;
        }
        this.messageTimeoutTasmota = this.adapter.setTimeout(this.sendMessageLoopTasmota, 10);
    };

    async delete(): Promise<void> {
        await super.delete();
        this.mqttClient.unsubscribe(`${this.configTopic}/stat/RESULT`);
        if (this.messageTimeout) {
            this.adapter.clearTimeout(this.messageTimeout);
        }
        if (this.messageTimeoutTasmota && this.messageTimeoutTasmota !== true) {
            this.adapter.clearTimeout(this.messageTimeoutTasmota);
        }
        (this as any).onMessage = async () => {};
        this.panel = undefined;
        this.messageDb = [];
        this.messageDbTasmota = [];
    }
}
