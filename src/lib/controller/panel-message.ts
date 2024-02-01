import { IClientPublishOptions } from 'mqtt';
import { SendTopicAppendix } from '../const/definition';
import { AdapterClassDefinition, BaseClass } from '../classes/library';
import { MQTTClientClass } from '../classes/mqtt';
import { Panel } from './panel';
import { BaseClassTriggerd } from './states-controller';

export class BaseClassPanelSend extends BaseClassTriggerd {}

/**
 * Übernimmt das senden von Payloads an die mqtt Klasse - delay zwischen einzelnen Messages
 * 1 * pro Klasse Panel
 */
export class PanelSend extends BaseClass {
    private messageDb: { payload: string; opt?: IClientPublishOptions }[] = [];
    private messageTimeout: ioBroker.Timeout | undefined;
    private mqttClient: MQTTClientClass;
    private topic: string = '';

    _panel: Panel | undefined = undefined;

    constructor(adapter: AdapterClassDefinition, config: { name: string; mqttClient: MQTTClientClass; topic: string }) {
        super(adapter, config.name);
        this.mqttClient = config.mqttClient;
        this.topic = config.topic + SendTopicAppendix;
    }
    public set panel(panel: Panel) {
        this._panel = panel;
    }
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
        const msg = this.messageDb.shift();
        if (msg === undefined || this.unload) {
            this.messageTimeout = undefined;
            return;
        }
        this.log.debug(`send payload: ${JSON.stringify(msg)} to panel.`);
        this.mqttClient.publish(this.topic, msg.payload, msg.opt);
        this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, 25);
    };

    async delete(): Promise<void> {
        await super.delete();
        if (this.messageTimeout) this.adapter.clearTimeout(this.messageTimeout);
    }
}
