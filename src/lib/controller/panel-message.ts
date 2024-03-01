import { IClientPublishOptions } from 'mqtt';
import { SendTopicAppendix } from '../const/definition';
import { AdapterClassDefinition, BaseClass } from '../classes/library';
import { MQTTClientClass, callbackMessageType } from '../classes/mqtt';
import { Panel } from './panel';

/**
 * Übernimmt das senden von Payloads an die mqtt Klasse - delay zwischen einzelnen Messages
 * 1 * pro Klasse Panel
 */
export class PanelSend extends BaseClass {
    private messageDb: { payload: string; opt?: IClientPublishOptions }[] = [];
    private messageDbTasmota: { topic: string; payload: string; opt?: IClientPublishOptions }[] = [];

    private messageTimeout: ioBroker.Timeout | undefined;
    private messageTimeoutTasmota: ioBroker.Timeout | undefined;
    private mqttClient: MQTTClientClass;
    private topic: string = '';
    private losingMessageCount = 0;

    _panel: Panel | undefined = undefined;

    constructor(adapter: AdapterClassDefinition, config: { name: string; mqttClient: MQTTClientClass; topic: string }) {
        super(adapter, config.name);
        this.mqttClient = config.mqttClient;
        this.mqttClient.subscript(config.topic + '/stat/RESULT', this.onMessage);
        this.topic = config.topic + SendTopicAppendix;
    }
    public set panel(panel: Panel) {
        this._panel = panel;
    }

    onMessage: callbackMessageType = async (topic: string, message: string) => {
        if (!topic.endsWith('/stat/RESULT')) {
            //this.log.debug(`Receive command ${topic} with ${message}`);
            return;
        }
        const msg = JSON.parse(message);
        if (msg) {
            if (msg.CustomSend === 'Done') {
                if (this.messageTimeout) this.adapter.clearTimeout(this.messageTimeout);
                this.losingMessageCount = 0;
                const msg = this.messageDb.shift();
                if (false && msg) this.log.debug(`Receive ack for ${JSON.stringify(msg)}`);
                this.sendMessageLoop();
            }
        }
    };
    public get panel(): Panel {
        if (!this._panel) throw new Error('Error P1: Panel undefinied!');
        return this._panel;
    }

    readonly addMessage = (payload: string, opt?: IClientPublishOptions): void => {
        this.messageDb.push({ payload: payload, opt: opt });
        if (this.messageTimeout === undefined) {
            this.sendMessageLoop();
        }
    };

    private readonly sendMessageLoop = (): void => {
        const msg = this.messageDb[0];
        if (msg === undefined || this.unload) {
            this.messageTimeout = undefined;
            return;
        }
        if (this.losingMessageCount++ > 3) {
            if (this._panel) this._panel.isOnline = false;
        }
        if (this._panel && !this._panel.isOnline) this.messageDb = [];
        this.addMessageTasmota(this.topic, msg.payload, msg.opt);
        this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, 1000);
    };

    readonly addMessageTasmota = (topic: string, payload: string, opt?: IClientPublishOptions): void => {
        if (
            this.messageDbTasmota.length > 0 &&
            !this.messageDbTasmota.some((a) => a.topic === topic && a.payload === payload && a.opt === opt)
        )
            return;
        this.messageDbTasmota.push({ topic: topic, payload: payload, opt: opt });

        if (this.messageTimeoutTasmota === undefined) {
            this.sendMessageLoopTasmota();
        }
    };
    private readonly sendMessageLoopTasmota = (): void => {
        const msg = this.messageDbTasmota.shift();
        if (msg === undefined || this.unload) {
            this.messageTimeoutTasmota = undefined;
            return;
        }
        this.log.debug(`send payload: ${JSON.stringify(msg)} to panel.`);
        this.mqttClient.publish(msg.topic, msg.payload, msg.opt);
        this.messageTimeoutTasmota = this.adapter.setTimeout(this.sendMessageLoopTasmota, 20);
    };

    async delete(): Promise<void> {
        await super.delete();
        if (this.messageTimeout) this.adapter.clearTimeout(this.messageTimeout);
        if (this.messageTimeoutTasmota) this.adapter.clearTimeout(this.messageTimeoutTasmota);
    }
}
