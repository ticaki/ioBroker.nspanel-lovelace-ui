import * as MQTT from '../classes/mqtt';
import * as Library from '../classes/library';
import { StatesControler } from './states-controller';
import * as Panel from './panel';

export class Controller extends Library.BaseClass {
    mqttClient: MQTT.MQTTClientClass;
    private DBPanels: Panel.Panel[] = [];
    statesControler: StatesControler;
    panel: Panel.Panel[] = [];
    constructor(
        adapter: Library.AdapterClassDefinition,
        options: { mqttClient: MQTT.MQTTClientClass; name: string; panels: Partial<Panel.panelConfigPartial>[] },
    ) {
        super(adapter, options.name);
        this.adapter.controller = this;
        this.mqttClient = options.mqttClient;
        this.statesControler = new StatesControler(this.adapter);
        for (const panelConfig of options.panels) {
            panelConfig.controller = this;
            if (!Panel.isPanelConfig(panelConfig)) {
                this.log.warn(`Panelconfig for ${panelConfig.name} is invalid!`);
                continue;
            }
            const panel = new Panel.Panel(adapter, panelConfig);
            this.checkPanel(panel);
        }
    }
    async checkPanel(panel: Panel.Panel): Promise<void> {
        if (await panel.isValid()) {
            this.panel.push(panel);
            await panel.init();
        } else {
            panel.delete();
            this.log.error(`Panel ${panel.name} has a invalid configuration.`);
        }
    }
    async delete(): Promise<void> {
        await super.delete();
        this.panel.forEach((a) => a.delete());
    }
}
