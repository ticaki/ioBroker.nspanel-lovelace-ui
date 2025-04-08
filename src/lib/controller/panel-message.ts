import type { IClientPublishOptions } from 'mqtt';
import { SendTopicAppendix } from '../const/definition';
import { BaseClass, type AdapterClassDefinition } from '../classes/library';
import type { MQTTClientClass, callbackMessageType } from '../classes/mqtt';
import type { Panel } from './panel';

/**
 * Übernimmt das senden von Payloads an die mqtt Klasse - delay zwischen einzelnen Messages
 * 1 * pro Klasse Panel
 */
export class PanelSend extends BaseClass {
    private messageDb: { payload: string; opt?: IClientPublishOptions }[] = [];
    private messageDbTasmota: { topic: string; payload: string; opt?: IClientPublishOptions }[] = [];

    private messageTimeout: ioBroker.Timeout | undefined;
    private messageTimeoutTasmota: ioBroker.Timeout | true | undefined;
    private mqttClient: MQTTClientClass;
    private topic: string = '';
    private losingMessageCount = 0;

    private _losingDelay = 1000;
    panel: Panel | undefined = undefined;

    get losingDelay(): number {
        if (this._losingDelay < 30000) {
            this._losingDelay = this._losingDelay + 1000;
        }
        return this._losingDelay;
    }
    set losingDelay(value: number) {
        if (value > 30000) {
            value = 30000;
        }
        if (value < 1000) {
            value = 1000;
        }
        this._losingDelay = value;
    }
    constructor(
        adapter: AdapterClassDefinition,
        config: { name: string; mqttClient: MQTTClientClass; topic: string; panel: Panel },
    ) {
        super(adapter, config.name);
        this.mqttClient = config.mqttClient;
        void this.mqttClient.subscript(`${config.topic}/stat/RESULT`, this.onMessage);
        this.topic = config.topic + SendTopicAppendix;
        this.panel = config.panel;
    }

    onMessage: callbackMessageType = async (topic: string, message: string) => {
        if (!topic.endsWith('/stat/RESULT')) {
            //this.log.debug(`Receive command ${topic} with ${message}`);
            return;
        }
        const msg = JSON.parse(message);
        if (msg) {
            if (msg.CustomSend === 'Done') {
                if (this.messageTimeout) {
                    this.adapter.clearTimeout(this.messageTimeout);
                }
                this.losingMessageCount = 0;
                this._losingDelay = 0;
                const msg = this.messageDb.shift();
                if (msg) {
                    if (msg.payload === 'pageType~pageStartup') {
                        this.messageDb = [];
                    }
                    this.log.debug(`Receive ack for ${JSON.stringify(msg)}`);
                }
                if (this.unload) {
                    return;
                }
                this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, 50);
            }
        }
    };

    readonly addMessage = (payload: string, opt?: IClientPublishOptions): void => {
        if (
            this.messageTimeout !== undefined &&
            this.messageDb.length > 0 &&
            this.messageDb.some(a => a.payload === payload && a.opt === opt)
        ) {
            return;
        }
        this.messageDb.push({ payload: payload, opt: opt });
        if (this.messageTimeout === undefined) {
            void this.sendMessageLoop();
        }
    };

    private readonly sendMessageLoop = async (): Promise<void> => {
        const msg = this.messageDb[0];
        if (msg === undefined || this.unload) {
            this.messageTimeout = undefined;
            return;
        }
        if (this.losingMessageCount > 0) {
            this.log.warn(`send payload: ${JSON.stringify(msg)} to panel. Losing count: ${this.losingMessageCount}`);
        }
        if (this.losingMessageCount++ > 3) {
            if (this.panel) {
                this.panel.isOnline = false;
            }
        }
        if (this.panel && !this.panel.isOnline) {
            this.messageDb = [];
        }
        if (this.unload) {
            return;
        }
        this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, this.losingDelay);
        this.addMessageTasmota(this.topic, msg.payload, msg.opt);
    };

    readonly addMessageTasmota = (topic: string, payload: string, opt?: IClientPublishOptions): void => {
        if (
            this.messageDbTasmota.length > 0 &&
            this.messageDbTasmota.some(a => a.topic === topic && a.payload === payload && a.opt === opt)
        ) {
            return;
        }
        this.messageDbTasmota.push({ topic: topic, payload: payload, opt: opt });

        if (this.messageTimeoutTasmota === undefined) {
            void this.sendMessageLoopTasmota();
        }
    };
    private readonly sendMessageLoopTasmota = async (): Promise<void> => {
        const msg = this.messageDbTasmota.shift();
        if (msg === undefined || this.unload) {
            this.messageTimeoutTasmota = undefined;
            return;
        }
        this.log.debug(`send payload: ${JSON.stringify(msg)} to panel.`);
        this.messageTimeoutTasmota = true;
        await this.mqttClient.publish(msg.topic, msg.payload, { ...msg.opt, qos: 1 });
        if (this.unload) {
            return;
        }
        this.messageTimeoutTasmota = this.adapter.setTimeout(this.sendMessageLoopTasmota, 20);
    };

    async delete(): Promise<void> {
        await super.delete();
        this.mqttClient.unsubscribe(`${this.topic}/stat/RESULT`);
        if (this.messageTimeout) {
            this.adapter.clearTimeout(this.messageTimeout);
        }
        if (this.messageTimeoutTasmota && this.messageTimeoutTasmota !== true) {
            this.adapter.clearTimeout(this.messageTimeoutTasmota);
        }
    }
}
