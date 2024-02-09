import * as MQTT from '../classes/mqtt';
import * as Library from '../classes/library';
import { StatesControler } from './states-controller';
import * as Panel from './panel';

export class Controller extends Library.BaseClass {
    mqttClient: MQTT.MQTTClientClass;
    statesControler: StatesControler;
    panels: Panel.Panel[] = [];
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
            this.panels.push(panel);
        }
    }

    async init(): Promise<void> {
        const newPanels = [];
        for (const panel of this.panels)
            if (await panel.isValid()) {
                newPanels.push(panel);
                await panel.init();
            } else {
                panel.delete();
                this.log.error(`Panel ${panel.name} has a invalid configuration.`);
            }
        this.panels = newPanels;
    }
    async delete(): Promise<void> {
        await super.delete();
        this.panels.forEach((a) => a.delete());
    }
}
