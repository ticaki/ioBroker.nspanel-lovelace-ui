import { IClientPublishOptions } from 'mqtt';
import { SendTopicAppendix } from '../const/definition';
import { AdapterClassDefinition, BaseClass } from '../classes/library';
import { MQTTClientClass } from '../classes/mqtt';
import { Panel } from './panel';
import { BaseClassTriggerd } from './states-controler';

export class BaseClassPanelSend extends BaseClassTriggerd {
    protected readonly panelSend: PanelSend;
    readonly sendToPanel: (payload: string, opt?: IClientPublishOptions) => void;

    constructor(adapter: AdapterClassDefinition, panelSend: PanelSend, name: string) {
        super(adapter, name);
        this.panelSend = panelSend;
        this.sendToPanel = panelSend.addMessage;
    }
}

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
            this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, 20);
        }
    };

    private readonly sendMessageLoop = (): void => {
        const msg = this.messageDb.shift();
        if (msg === undefined || this.unload) {
            this.messageTimeout = undefined;
            return;
        }
        this.log.debug(`send payload: ${msg} to panel.`);
        this.mqttClient.publish(this.topic, msg.payload, msg.opt);
        this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, 200);
    };

    async delete(): Promise<void> {
        await super.delete();
        if (this.messageTimeout) this.adapter.clearTimeout(this.messageTimeout);
    }
}
