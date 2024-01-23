import * as MQTT from './mqtt';
import * as Library from './library';
import { NspanelLovelaceUi } from '../main';
import { Screensaver, ScreensaverConfig } from './screensaver';
import { PanelSend } from './panel-message';
import { StatesDBReadOnly } from './states-controler';

export class Controller extends Library.BaseClass {
    private mqttClient: MQTT.MQTTClientClass;
    private DBPanels: any[] = [];
    readOnlyDB: StatesDBReadOnly;
    testPanelSend: PanelSend;
    constructor(
        adapter: NspanelLovelaceUi,
        options: { mqttClient: MQTT.MQTTClientClass; name: string; panels: ScreensaverConfig },
    ) {
        super(adapter, options.name);
        this.mqttClient = options.mqttClient;
        this.readOnlyDB = new StatesDBReadOnly(this.adapter);
        this.testPanelSend = new PanelSend(adapter, {
            panel: 'test',
            name: 'PanelSendClass',
            mqttClient: this.mqttClient,
            topic: '',
        });
        new Screensaver(adapter, options.panels, this.testPanelSend, this.readOnlyDB).init();
    }
}
