import * as MQTT from './mqtt';
import * as Library from './library';
import { NspanelLovelaceUi } from '../main';
import { Screensaver, ScreensaverConfig } from './screensaver';

export class Controller extends Library.BaseClass {
    private mqttClient: MQTT.MQTTClientClass;
    private DBPanels: any[] = [];
    constructor(
        adapter: NspanelLovelaceUi,
        options: { mqttClient: MQTT.MQTTClientClass; name: string },
        panels: ScreensaverConfig[],
    ) {
        super(adapter, options.name);
        this.mqttClient = options.mqttClient;
        for (const c of panels) {
            this.DBPanels.push(new Screensaver(adapter, c));
        }
    }
}
