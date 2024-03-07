import * as MQTT from '../classes/mqtt';
import * as Library from '../classes/library';
import { StatesControler } from './states-controller';
import * as Panel from './panel';
import { genericStateObjects } from '../const/definition';
import { SystemNotifications } from '../classes/system-notifications';
import { getInternalDefaults } from '../const/tools';

export class Controller extends Library.BaseClass {
    mqttClient: MQTT.MQTTClientClass;
    statesControler: StatesControler;
    panels: Panel.Panel[] = [];
    private minuteLoopTimeout: ioBroker.Timeout | undefined;
    private dateUpdateTimeout: ioBroker.Timeout | undefined;

    private dataCache: Record<string, { time: number; data: any }> = {};
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

    /**
     *....
     * @param id
     * @param _state
     * @returns
     */
    onInternalCommand = async (id: string, _state: ioBroker.State | undefined): Promise<ioBroker.StateValue> => {
        if (!id.startsWith('///')) return null;
        const token = id.split('///').pop();
        switch (token) {
            case 'AdapterStoppedBoolean':
            case 'AdapterNoConnectionBoolean':
            case 'AdapterNoConnection':
            case 'AdapterStopped': {
                if (this.dataCache[token] && this.dataCache[token].time < Date.now() - 5000)
                    delete this.dataCache[token];
                let save = false;
                if (!this.dataCache[token]) {
                    this.dataCache[token] = { time: Date.now(), data: {} };
                    save = true;
                }
                let list;
                if (save) {
                    list = await this.adapter.getObjectViewAsync('system', 'instance', {
                        startkey: `system.adapter`,
                        endkey: `system.adapter}`,
                    });
                    this.dataCache[token].data[`system#view.instance`] = list;
                } else {
                    list = this.dataCache[token].data[`system#view.instance`];
                }

                let total = 0;
                let withProblems = 0;
                for (const item of list.rows) {
                    const obj = item.value;
                    if (!obj.common.enabled || obj.common.mode !== 'daemon') continue;
                    if (token === 'AdapterStopped' || token === 'AdapterStoppedBoolean') {
                        let state;
                        if (save) {
                            state = await this.adapter.getForeignStateAsync(`${item.id}.alive`);
                            this.dataCache[token].data[`${item.id}.alive`] = state;
                        } else {
                            state = this.dataCache[token].data[`${item.id}.alive`];
                        }
                        if (state && !state.val) {
                            withProblems++;
                            if (token === 'AdapterStoppedBoolean') return true;
                        }
                        total++;
                    } else if (token === 'AdapterNoConnection' || token === 'AdapterNoConnectionBoolean') {
                        const nID = item.id.split('.').slice(2).join('.');
                        let state;
                        if (save) {
                            state = await this.adapter.getForeignStateAsync(`${nID}.info.connection`);
                            this.dataCache[token].data[`${nID}.info.connection`] = state;
                        } else {
                            state = this.dataCache[token].data[`${nID}.info.connection`];
                        }
                        if (state && !state.val) {
                            withProblems++;
                            if (token === 'AdapterNoConnectionBoolean') return true;
                        }
                        total++;
                    }
                }
                if (token === 'AdapterNoConnectionBoolean' || token === 'AdapterStoppedBoolean') return false;
                return `(${withProblems}/${total})`;
            }
        }
        return null;
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
        await this.statesControler.setInternalState(
            `///AdapterNoConnection`,
            '',
            true,
            getInternalDefaults('string', 'text', false),
            this.onInternalCommand,
        );
        await this.statesControler.setInternalState(
            `///AdapterStopped`,
            '',
            true,
            getInternalDefaults('string', 'text', false),
            this.onInternalCommand,
        );
        await this.statesControler.setInternalState(
            `///AdapterNoConnectionBoolean`,
            true,
            true,
            getInternalDefaults('boolean', 'indicator', false),
            this.onInternalCommand,
        );
        await this.statesControler.setInternalState(
            `///AdapterStoppedBoolean`,
            true,
            true,
            getInternalDefaults('boolean', 'indicator', false),
            this.onInternalCommand,
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
