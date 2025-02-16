import type * as MQTT from '../classes/mqtt';
import * as Library from '../classes/library';
import { StatesControler } from './states-controller';
import * as Panel from './panel';
import { genericStateObjects } from '../const/definition';
import { SystemNotifications } from '../classes/system-notifications';
import { getInternalDefaults } from '../const/tools';
import axios from 'axios';
import type { TasmotaOnlineResponse, nsPanelState, nsPanelStateVal } from '../types/types';
import { Color } from '../const/Color';
import { stateRoleArray } from '../types/pages';

axios.defaults.timeout = 10000;

/**
 * Controller Class
 */
export class Controller extends Library.BaseClass {
    mqttClient: MQTT.MQTTClientClass;
    statesControler: StatesControler;
    panels: Panel.Panel[] = [];
    private minuteLoopTimeout: ioBroker.Timeout | undefined;
    private dateUpdateTimeout: ioBroker.Timeout | undefined;
    private dailyIntervalTimeout: ioBroker.Interval | undefined;
    private dataCache: Record<string, { time: number; data: any }> = {};
    systemNotification: SystemNotifications;

    constructor(
        adapter: Library.AdapterClassDefinition,
        options: { mqttClient: MQTT.MQTTClientClass; name: string; panels: Partial<Panel.panelConfigPartial>[] },
    ) {
        super(adapter, options.name);
        Color.setTheme(Color.currentTheme);
        this.adapter.controller = this;
        this.mqttClient = options.mqttClient;
        this.statesControler = new StatesControler(this.adapter);

        this.adapter.log.info(JSON.stringify(stateRoleArray));
        for (const panelConfig of options.panels) {
            if (panelConfig === undefined) {
                continue;
            }
            panelConfig.controller = this;
            this.adapter.log.info(`Create panel ${panelConfig.name} with topic ${panelConfig.topic}`);
            const panel = new Panel.Panel(adapter, panelConfig as Panel.panelConfigPartial);
            this.panels.push(panel);
        }
        this.systemNotification = new SystemNotifications(this.adapter);
    }

    minuteLoop = async (): Promise<void> => {
        if (this.unload) {
            return;
        }
        await this.statesControler.setInternalState('///time', await this.getCurrentTime(), true);
        const diff = 60000 - (Date.now() % 60000) + 10;
        this.minuteLoopTimeout = this.adapter.setTimeout(this.minuteLoop, diff);
    };

    /**
     * Update Date every hour....
     *
     * @returns void
     */
    dateUpdateLoop = async (): Promise<void> => {
        if (this.unload) {
            return;
        }
        const d: Date = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(0, 0, 1);
        const diff = d.getTime() - Date.now();
        this.log.debug(`Set current Date with time: ${new Date(await this.getCurrentTime()).toString()}`);
        await this.statesControler.setInternalState('///date', this.getCurrentTime(), true);
        this.dateUpdateTimeout = this.adapter.setTimeout(this.dateUpdateLoop, diff);
    };
    getCurrentTime = async (): Promise<number> => {
        return new Promise(resolve => resolve(Date.now()));
    };

    /**
     *....
     *
     * @param id - id of the state
     * @param _state - state
     * @returns nsPanelStateVal
     */
    onInternalCommand = async (id: string, _state: nsPanelState | undefined): Promise<nsPanelStateVal> => {
        if (!id.startsWith('///')) {
            return null;
        }
        const token = id.split('///').pop();
        switch (token) {
            case 'AdapterStoppedBoolean':
            case 'AdapterNoConnectionBoolean':
            case 'AdapterNoConnection':
            case 'AdapterStopped': {
                if (this.dataCache[token] && this.dataCache[token].time < Date.now() - 5000) {
                    delete this.dataCache[token];
                }
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
                if (!list || !list.token) {
                    return null;
                }

                let total = 0;
                let withProblems = 0;
                for (const item of list.rows) {
                    const obj = item.value;
                    if (!obj.common.enabled || obj.common.mode !== 'daemon') {
                        continue;
                    }
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
                            if (token === 'AdapterStoppedBoolean') {
                                return true;
                            }
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
                            if (token === 'AdapterNoConnectionBoolean') {
                                return true;
                            }
                        }
                        total++;
                    }
                }
                if (token === 'AdapterNoConnectionBoolean' || token === 'AdapterStoppedBoolean') {
                    return false;
                }
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

        for (const panel of this.panels) {
            if (await panel.isValid()) {
                newPanels.push(panel);
                await panel.init();
            } else {
                await panel.delete();
                this.log.error(`Panel ${panel.name} has a invalid configuration.`);
            }
        }
        this.panels = newPanels;
        void this.minuteLoop();
        void this.dateUpdateLoop();
        await this.getTasmotaVersion();
        this.dailyIntervalTimeout = this.adapter.setInterval(this.dailyInterval, 24 * 60 * 60 * 1000);
    }

    async delete(): Promise<void> {
        if (this.minuteLoopTimeout) {
            this.adapter.clearTimeout(this.minuteLoopTimeout);
        }
        if (this.dateUpdateTimeout) {
            this.adapter.clearTimeout(this.dateUpdateTimeout);
        }
        if (this.dailyIntervalTimeout) {
            this.adapter.clearInterval(this.dailyIntervalTimeout);
        }
        await super.delete();
        for (const a of this.panels) {
            await a.delete();
        }
    }

    async notificationToPanel(): Promise<void> {
        if (!this.panels) {
            return;
        }
        await this.statesControler.setInternalState('///Notifications', true, true);
    }

    dailyInterval = async (): Promise<void> => {
        await this.getTasmotaVersion();
    };

    async getTasmotaVersion(): Promise<void> {
        const urlString = 'https://api.github.com/repositories/80286288/releases/latest';
        try {
            const response = await axios(urlString, { headers: { 'User-Agent': 'ioBroker' } });

            if (response && response.status === 200) {
                const data = response.data as TasmotaOnlineResponse;

                const TasmotaTagName = data.tag_name; // Filter JSON by "tag_name" and write to variable
                const TasmotaVersionOnline = TasmotaTagName.replace(/v/i, ''); // Filter unnecessary "v" from variable and write to release variable
                for (const p of this.panels) {
                    if (p) {
                        p.info.tasmota.onlineVersion = TasmotaVersionOnline;
                    }
                }
            }
        } catch {
            // do nothing
        }
    }
}
