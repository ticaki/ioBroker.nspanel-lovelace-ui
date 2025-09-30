import type * as MQTT from '../classes/mqtt';
import * as Library from './library';
import { StatesControler } from './states-controller';
import * as Panel from './panel';
import { genericStateObjects } from '../const/definition';
import { SystemNotifications } from '../classes/system-notifications';
import { getInternalDefaults } from '../const/tools';
import axios from 'axios';
import type { TasmotaOnlineResponse, nsPanelState, nsPanelStateVal } from '../types/types';
import { Color } from '../const/Color';

axios.defaults.timeout = 15_000;

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
    private options: { mqttClient: MQTT.MQTTClientClass; name: string; panels: Partial<Panel.panelConfigPartial>[] };
    public globalPanelInfo: { availableTftFirmwareVersion: string; availableTasmotaFirmwareVersion: string } = {
        availableTftFirmwareVersion: '',
        availableTasmotaFirmwareVersion: '',
    };

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
        this.options = options;
        if (this.adapter.mqttServer) {
            this.adapter.mqttServer.controller = this;
        }
        void this.init(options.panels);
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
            const currentTimeString = await this.getCurrentTimeString();
            await this.statesControler.setInternalState('///timeString', currentTimeString, true);
            await this.adapter.delay(10);
        } catch (e) {
            this.log.error(`minuteLoop error: ${e instanceof Error ? e.message : JSON.stringify(e)}`);
            // Fehler werden geschluckt, damit die Loop nicht stoppt
        }

        // Nächste Ausführung exakt zur nächsten Minute (+10 ms Puffer)
        const next = new Date(now);
        next.setSeconds(0, 10);
        next.setMinutes(now.getMinutes() + 1);
        const diff = next.getTime() - Date.now();
        if (this.unload || this.adapter.unload) {
            return;
        }
        this.minuteLoopTimeout = this.adapter.setTimeout(() => this.minuteLoop(), diff);
    };

    /**
     * Update Date every day at 0:00:01....
     *
     * @returns void
     */
    hourLoop = async (): Promise<void> => {
        // Zeitpunkt: nächster Tag 00:00:01
        const now = new Date();
        const next = new Date(now);
        const hourNow = now.getHours();
        next.setHours(now.getHours() + 1, 0, 4);

        const diff = next.getTime() - now.getTime();

        try {
            if (hourNow === 0) {
                const currentTime = await this.getCurrentTime();
                this.log.debug(`Set current Date with time: ${new Date(currentTime).toString()}`);
                await this.statesControler.setInternalState('///date', currentTime, true);
            }
        } catch (err: any) {
            this.log.error(`dateUpdateLoop failed: ${err}`);
        }

        if (hourNow % 8 === 0) {
            await this.checkOnlineVersion();
        }
        if (this.unload || this.adapter.unload) {
            return;
        }
        this.dateUpdateTimeout = this.adapter.setTimeout(() => this.hourLoop(), diff);
    };
    getCurrentTime = async (): Promise<number> => {
        return new Promise(resolve => resolve(Date.now()));
    };
    getCurrentTimeString = async (): Promise<string> => {
        return new Promise(resolve =>
            resolve(new Date().toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit' })),
        );
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

    async init(panels: Partial<Panel.panelConfigPartial>[]): Promise<void> {
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
            '///timeString',
            await this.getCurrentTimeString(),
            true,
            {
                name: '',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            this.getCurrentTimeString,
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

        const tasks: Promise<void>[] = [];
        for (const panelConfig of panels) {
            if (panelConfig === undefined) {
                continue;
            }
            tasks.push(this.addPanel(structuredClone(panelConfig)));
        }

        await Promise.all(tasks);
        void this.minuteLoop();
        void this.hourLoop();
        await this.checkOnlineVersion();
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
        if (await newPanel.isValid()) {
            this.panels.push(newPanel);
            await newPanel.init();
            newPanel.initDone = true;
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
        const tasks: Promise<void>[] = [];
        for (const a of this.panels) {
            if (a) {
                tasks.push(a.delete());
            }
        }
        await Promise.all(tasks);
        this.panels = [];
        this.dataCache = {};
    }

    async notificationToPanel(): Promise<void> {
        if (!this.panels) {
            return;
        }
        await this.statesControler.setInternalState('///Notifications', true, true);
    }

    checkOnlineVersion = async (): Promise<void> => {
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
            this.globalPanelInfo.availableTftFirmwareVersion = version.trim();
            for (const panel of this.panels) {
                panel.info.nspanel.onlineVersion = this.globalPanelInfo.availableTftFirmwareVersion;
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

                this.globalPanelInfo.availableTasmotaFirmwareVersion = TasmotaVersionOnline;
                for (const panel of this.panels) {
                    panel.info.tasmota.onlineVersion = this.globalPanelInfo.availableTasmotaFirmwareVersion;
                }
            }
        } catch {
            // do nothing
        }
    }
}
