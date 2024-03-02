import * as MQTT from '../classes/mqtt';
import * as Library from '../classes/library';
import { StatesControler } from './states-controller';
import * as Panel from './panel';
import { genericStateObjects } from '../const/definition';
import { SystemNotifications } from '../classes/system-notifications';

export class Controller extends Library.BaseClass {
    mqttClient: MQTT.MQTTClientClass;
    statesControler: StatesControler;
    panels: Panel.Panel[] = [];
    private minuteLoopTimeout: ioBroker.Timeout | undefined;
    private dateUpdateTimeout: ioBroker.Timeout | undefined;

    systemNotification: SystemNotifications;

    constructor(
        adapter: Library.AdapterClassDefinition,
        options: { mqttClient: MQTT.MQTTClientClass; name: string; panels: Partial<Panel.panelConfigPartial>[] },
    ) {
        super(adapter, options.name);
        this.adapter.controller = this;
        this.mqttClient = options.mqttClient;
        this.statesControler = new StatesControler(this.adapter);

        for (const panelConfig of options.panels) {
            if (panelConfig === undefined) continue;
            panelConfig.controller = this;
            const panel = new Panel.Panel(adapter, panelConfig as Panel.panelConfigPartial);
            this.panels.push(panel);
        }
        this.systemNotification = new SystemNotifications(this.adapter);
    }

    minuteLoop = async (): Promise<void> => {
        if (this.unload) return;
        this.statesControler.setInternalState('///time', await this.getCurrentTime(), true);
        const diff = 60000 - (Date.now() % 60000) + 10;
        this.minuteLoopTimeout = this.adapter.setTimeout(this.minuteLoop, diff);
    };

    /**
     * Update Date every hour.
     * @returns
     */
    dateUpdateLoop = async (): Promise<void> => {
        if (this.unload) return;
        const d: Date = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(0, 0, 1);
        const diff = d.getTime() - Date.now();
        this.log.debug('Set current Date with time: ' + new Date(await this.getCurrentTime()).toString);
        await this.statesControler.setInternalState('///date', await this.getCurrentTime(), true);
        this.dateUpdateTimeout = this.adapter.setTimeout(this.dateUpdateLoop, diff);
    };
    getCurrentTime = async (): Promise<number> => {
        return Date.now();
    };

    async init(): Promise<void> {
        await this.statesControler.setInternalState(
            '///time',
            await this.getCurrentTime(),
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
        await this.statesControler.setInternalState(
            '///date',
            await this.getCurrentTime(),
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
        const newPanels = [];
        // erzeuge übergeordneten channel
        await this.library.writedp(`panels`, undefined, genericStateObjects.panel._channel);

        await this.systemNotification.init();

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

    async notificationToPanel(): Promise<void> {
        if (!this.panels) return;
        this.statesControler.setInternalState('///Notifications', true, true);
    }
}
