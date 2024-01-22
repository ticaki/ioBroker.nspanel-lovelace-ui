import { AdapterClassDefinition, BaseClass } from './library';
import { MQTTClientClass } from './mqtt';
import { BaseClassTriggerd } from './states-controler';

export class BaseClassPanelSend extends BaseClassTriggerd {
    protected readonly panelSend: PanelSend;
    readonly sendToPanel: (payload: string) => void;

    constructor(adapter: AdapterClassDefinition, panelSend: PanelSend, name: string) {
        super(adapter, name);
        this.panelSend = panelSend;
        this.sendToPanel = panelSend.addMessage;
    }
}

export class PanelSend extends BaseClass {
    private messageDb: string[] = [];
    private messageTimeout: ioBroker.Timeout | undefined;
    private mqttClient: MQTTClientClass;
    private topic: string = '';
    readonly panel: any;
    constructor(
        adapter: AdapterClassDefinition,
        config: { panel: any; name: string; mqttClient: MQTTClientClass; topic: string },
    ) {
        super(adapter, config.name);
        this.panel = config.panel;
        this.mqttClient = config.mqttClient;
        this.topic = config.topic;
    }
    readonly addMessage = (payload: string): void => {
        this.messageDb.push(payload);
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
        this.mqttClient.publish(this.topic, msg);
        this.messageTimeout = this.adapter.setTimeout(this.sendMessageLoop, 20);
    };

    async delete(): Promise<void> {
        await super.delete();
        if (this.messageTimeout) this.adapter.clearTimeout(this.messageTimeout);
    }
}
