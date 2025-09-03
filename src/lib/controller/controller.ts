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
        switch (this.adapter.config.colorTheme) {
            case 1:
                Color.setTheme(Color.topicalTheme);
                break;
            case 2:
                Color.setTheme(Color.technicalTheme);
                break;
            case 3:
                Color.setTheme(Color.sunsetTheme);
                break;
            case 4:
                Color.setTheme(Color.volcanoTheme);
                break;
            case 0:
            default:
                Color.setTheme(Color.defaultTheme);
                break;
        }
        this.adapter.controller = this;
        this.mqttClient = options.mqttClient;
        this.statesControler = new StatesControler(this.adapter);
        this.systemNotification = new SystemNotifications(this.adapter);
        if (this.adapter.mqttServer) {
            this.adapter.mqttServer.controller = this;
        }
        for (const panelConfig of options.panels) {
            if (panelConfig === undefined) {
                continue;
            }
            void this.addPanel(panelConfig);
            /*const index = this.adapter.config.panels.findIndex(panel => panel.topic === panelConfig.topic);
            if (index === -1) {
                this.adapter.testSuccessful = false;
                this.adapter.log.error(`Panel ${panelConfig.name} with topic ${panelConfig.topic} not found in config`);
                continue;
            }
            panelConfig.name = this.adapter.config.panels[index].id;
            panelConfig.friendlyName = this.adapter.config.panels[index].name;
            panelConfig.controller = this;
            this.adapter.log.info(`Create panel ${panelConfig.name} with topic ${panelConfig.topic}`);
            const panel = new Panel.Panel(adapter, panelConfig as Panel.panelConfigPartial);
            this.panels.push(panel);*/
        }
        this.log.debug(`${this.name} created`);
    }

    minuteLoop = async (): Promise<void> => {
        const now = new Date();
        const minute = now.getMinutes();

        try {
            // Top-of-hour: Dimmode an alle Panels
            if (minute === 0) {
                for (const panel of this.panels) {
                    panel.sendDimmode();
                }
            }

            // Jede 5. Minute bei Minute==1,6,11,...
            if (minute % 5 === 1) {
                for (const panel of this.panels) {
                    panel.requestStatusTasmota();
                }
            }

            const currentTime = await this.getCurrentTime();
            await this.statesControler.setInternalState('///time', currentTime, true);
        } catch {
            // Fehler werden geschluckt, damit die Loop nicht stoppt
        }

        if (this.unload) {
            return;
        }

        // Nächste Ausführung exakt zur nächsten Minute (+10 ms Puffer)
        const next = new Date(now);
        next.setSeconds(0, 10);
        next.setMinutes(now.getMinutes() + 1);
        const diff = next.getTime() - Date.now();

        this.minuteLoopTimeout = this.adapter.setTimeout(() => this.minuteLoop(), diff);
    };

    /**
     * Update Date every day at 0:00:01....
     *
     * @returns void
     */
    dateUpdateLoop = async (): Promise<void> => {
        // Zeitpunkt: nächster Tag 00:00:01
        const now = new Date();
        const next = new Date(now);
        next.setDate(now.getDate() + 1);
        next.setHours(0, 0, 1, 0);

        const diff = next.getTime() - now.getTime();

        if (this.unload) {
            return;
        }

        try {
            const currentTime = await this.getCurrentTime();
            this.log.debug(`Set current Date with time: ${new Date(currentTime).toString()}`);
            await this.statesControler.setInternalState('///date', currentTime, true);
        } catch (err: any) {
            this.log.error(`dateUpdateLoop failed: ${err}`);
        }

        this.dateUpdateTimeout = this.adapter.setTimeout(() => this.dateUpdateLoop(), diff);
    };
    getCurrentTime = async (): Promise<number> => {
        return new Promise(resolve => resolve(Date.now()));
    };

    /**
     * Handles internal commands based on the provided id and state.
     *
     * @param id - The identifier for the internal command.
     * @param _state - The state associated with the command.
     * @returns The value of the internal state or null if not applicable.
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
        //const newPanels = [];
        // erzeuge übergeordneten channel
        await this.library.writedp(`panels`, undefined, genericStateObjects.panel._channel);

        void this.systemNotification.init();
        /*this.log.debug(`Create ${this.panels.length} panels`);
        for (const panel of this.panels) {
            await this.adapter.delay(100);
            if (await panel.isValid()) {
                newPanels.push(panel);
                void panel.init();
            } else {
                await panel.delete();
                this.adapter.testSuccessful = false;
                this.log.error(`Panel ${panel.name} has a invalid configuration.`);
            }
        }
        this.panels = newPanels;*/
        void this.minuteLoop();
        void this.dateUpdateLoop();
        await this.getTasmotaVersion();
        await this.getTFTVersion();
        this.dailyIntervalTimeout = this.adapter.setInterval(this.dailyInterval, 24 * 60 * 60 * 1000);
    }

    addPanel = async (panel: Partial<Panel.panelConfigPartial>): Promise<void> => {
        let index = this.panels.findIndex(p => p.topic === panel.topic);
        if (index !== -1) {
            this.adapter.testSuccessful = false;
            this.adapter.log.error(`Panel ${panel.name} with topic ${panel.topic} already exists`);
            return;
        }
        index = this.adapter.config.panels.findIndex(p => p.topic === panel.topic);
        if (index === -1) {
            this.adapter.testSuccessful = false;
            this.adapter.log.error(`Panel ${panel.name} with topic ${panel.topic} not found in config`);
            return;
        }

        panel.name = this.adapter.config.panels[index].id;
        panel.friendlyName = this.adapter.config.panels[index].name;
        panel.controller = this;
        // merge adapter navigation
        const o = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
        if (panel?.topic && o && o.native && o.native.navigation) {
            if (o.native.navigation[panel.topic] && o.native.navigation[panel.topic].useNavigation) {
                panel.navigation = o.native.navigation[panel.topic].data;
            }
        }
        const newPanel = new Panel.Panel(this.adapter, panel as Panel.panelConfigPartial);
        await this.adapter.delay(100);
        if (await newPanel.isValid()) {
            this.panels.push(newPanel);
            await newPanel.init();
            this.log.debug(`Panel ${newPanel.name} created`);
        } else {
            await newPanel.delete();
            this.adapter.testSuccessful = false;
            this.log.error(`Panel ${panel.name} has a invalid configuration.`);
        }
    };

    removePanel = async (panel: Panel.Panel): Promise<void> => {
        const index = this.panels.findIndex(p => p.topic === panel.topic);
        if (index !== -1) {
            this.panels.splice(index, 1);
            await panel.delete();
            this.log.info(`Panel ${panel.topic} deleted`);
        } else {
            this.log.error(`Panel ${panel.topic} not found`);
        }
    };

    mqttClientConnected = (id: string): boolean | undefined => {
        if (id === this.mqttClient.clientId) {
            return true;
        }
        const index = this.panels.findIndex(p => id.startsWith(this.library.cleandp(p.friendlyName)));
        if (index !== -1) {
            if (this.panels[index].initDone) {
                this.panels[index].restartLoops();
                return true;
            }
        }
        return false;
    };

    async delete(): Promise<void> {
        await super.delete();
        if (this.minuteLoopTimeout) {
            this.adapter.clearTimeout(this.minuteLoopTimeout);
        }
        if (this.dateUpdateTimeout) {
            this.adapter.clearTimeout(this.dateUpdateTimeout);
        }
        if (this.dailyIntervalTimeout) {
            this.adapter.clearInterval(this.dailyIntervalTimeout);
        }
        if (this.systemNotification) {
            await this.systemNotification.delete();
        }
        if (this.statesControler) {
            await this.statesControler.delete();
        }
        for (const a of this.panels) {
            if (a) {
                await a.delete();
            }
        }
    }

    async notificationToPanel(): Promise<void> {
        if (!this.panels) {
            return;
        }
        await this.statesControler.setInternalState('///Notifications', true, true);
    }

    dailyInterval = async (): Promise<void> => {
        await this.getTFTVersion();
        await this.getTasmotaVersion();
    };

    async getTFTVersion(): Promise<void> {
        try {
            const result = await axios.get(
                'https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json',
            );
            if (result.status !== 200) {
                this.log.warn(`Error getting TFT version: ${result.status}`);
                return;
            }

            const version = this.adapter.config.useBetaTFT
                ? result.data['tft-beta'].split('_')[0]
                : result.data.tft.split('_')[0];
            for (const p of this.panels) {
                if (p) {
                    p.info.nspanel.onlineVersion = version;
                }
            }
        } catch {
            // nothing
        }
    }
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
