import * as MQTT from '../classes/mqtt';
import * as Library from '../classes/library';
import { StatesControler } from './states-controller';
import * as Panel from './panel';
import { genericStateObjects } from '../const/definition';

export class Controller extends Library.BaseClass {
    mqttClient: MQTT.MQTTClientClass;
    statesControler: StatesControler;
    panels: Panel.Panel[] = [];
    private minuteLoopTimeout: ioBroker.Timeout | undefined;
    private dateUpdateTimeout: ioBroker.Timeout | undefined;

    constructor(
        adapter: Library.AdapterClassDefinition,
        options: { mqttClient: MQTT.MQTTClientClass; name: string; panels: Partial<Panel.panelConfigPartial>[] },
    ) {
        super(adapter, options.name);
        this.adapter.controller = this;
        this.mqttClient = options.mqttClient;
        this.statesControler = new StatesControler(this.adapter);
        this.statesControler.setInternalState(
            '///time',
            this.getCurrentTime(),
            true,
            {
                name: '',
                type: 'number',
                role: 'value.time',
                read: true,
                write: false,
            },
            this.getCurrentTime,
        );
        this.statesControler.setInternalState(
            '///date',
            this.getCurrentTime(),
            true,
            {
                name: '',
                type: 'number',
                role: 'value.time',
                read: true,
                write: false,
            },
            this.getCurrentTime,
        );
        for (const panelConfig of options.panels) {
            if (panelConfig === undefined) continue;
            panelConfig.controller = this;
            if (!Panel.isPanelConfig(panelConfig)) {
                this.log.warn(`Panelconfig for ${panelConfig.name} is invalid!`);
                continue;
            }
            const panel = new Panel.Panel(adapter, panelConfig);
            this.panels.push(panel);
        }
    }

    minuteLoop = (): void => {
        if (this.unload) return;
        this.statesControler.setInternalState('///time', this.getCurrentTime(), true);
        const diff = 60000 - (Date.now() % 60000) + 10;
        this.minuteLoopTimeout = this.adapter.setTimeout(this.minuteLoop, diff);
    };

    /**
     * Update Date 2 times per day because of daylight saving.
     * @returns
     */
    dateUpdateLoop = (): void => {
        if (this.unload) return;
        this.statesControler.setInternalState('///date', this.getCurrentTime(), true);
        const d: Date = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(0, 0, 0);
        const diff = d.getTime() - Date.now();
        this.dateUpdateTimeout = this.adapter.setTimeout(this.dateUpdateLoop, diff);
    };
    getCurrentTime = (): number => {
        return Date.now();
    };

    async init(): Promise<void> {
        const newPanels = [];
        this.library.writedp(`panels`, undefined, genericStateObjects.panel._channel);

        for (const panel of this.panels)
            if (await panel.isValid()) {
                newPanels.push(panel);
                await panel.init();
            } else {
                await panel.delete();
                this.log.error(`Panel ${panel.name} has a invalid configuration.`);
            }
        this.panels = newPanels;
        this.minuteLoop();
        this.dateUpdateLoop();
    }
    async delete(): Promise<void> {
        if (this.minuteLoopTimeout) this.adapter.clearTimeout(this.minuteLoopTimeout);
        if (this.dateUpdateTimeout) this.adapter.clearTimeout(this.dateUpdateTimeout);
        await super.delete();
        for (const a of this.panels) await a.delete();
    }
}
