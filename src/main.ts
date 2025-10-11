import {
    SENDTO_GET_PANEL_NAVIGATION_COMMAND,
    SAVE_PANEL_NAVIGATION_COMMAND,
    SENDTO_GET_PAGES_COMMAND,
    SENDTO_GET_PANELS_COMMAND,
    SENDTO_GET_PAGES_All_COMMAND,
} from './lib/types/adminShareConfig';
/*
 * Created with @iobroker/create-adapter v2.5.0..
 */
//FlashNextionAdv0 http://nspanel.de/nspanel-v4.6.0.tft ist die 55
// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import { Library } from './lib/controller/library';
import 'source-map-support/register';
// Load your modules here, e.g.:
// import * as fs from "fs";
import * as MQTT from './lib/classes/mqtt';
import { Controller } from './lib/controller/controller';
import { Icons } from './lib/const/icon_mapping';
import * as definition from './lib/const/definition';
import { ConfigManager } from './lib/classes/config-manager';
import type { panelConfigPartial } from './lib/controller/panel';
import { generateAliasDocumentation } from './lib/tools/readme';
import axios from 'axios';
import { URL } from 'url';
import type * as pages from './lib/types/pages';
import * as fs from 'fs';
import type { NavigationItemConfig } from './lib/classes/navigation';
import path from 'path';
import type { NavigationSavePayload, PanelListEntry, PanelInfo } from './lib/types/adminShareConfig';
//import fs from 'fs';
axios.defaults.timeout = 15_000;

class NspanelLovelaceUi extends utils.Adapter {
    library: Library;
    mqttClient: MQTT.MQTTClientClass | undefined;
    mqttServer: MQTT.MQTTServerClass | undefined;
    controller: Controller | undefined;
    unload: boolean = false;
    timeoutAdmin: ioBroker.Timeout | undefined;
    timeoutAdmin2: ioBroker.Timeout | undefined;
    timeoutAdminArray: (ioBroker.Timeout | undefined)[] = [];

    intervalAdminArray: (ioBroker.Interval | undefined)[] = [];

    mainConfiguration: panelConfigPartial[] | undefined;

    scriptConfigBacklog: any[] = [];

    fetchs: Map<AbortController, ioBroker.Timeout | undefined> = new Map();

    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({
            ...options,
            name: 'nspanel-lovelace-ui',
            useFormatDate: true,
        });
        this.library = new Library(this);
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
        // init some propertys so we dont need undefined checks
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    private async onReady(): Promise<void> {
        await this.extendForeignObjectAsync(this.namespace, {
            type: 'meta',
            common: { name: { en: 'Nspanel Instance', de: 'Nspanel Instanze' }, type: 'meta.folder' },
            native: {},
        });

        if (this.config.forceTFTVersion) {
            this.log.warn(
                `⚠️  TFT firmware is pinned to version ${this.config.forceTFTVersion}. Remember: you will always stay on this version until you change it.`,
            );
            if (this.config.forceTFTVersion === '0.0.0') {
                this.log.warn(
                    `⚠️  Developer version of the TFT firmware is used. This version may be unstable and have bugs! No support in the forum!`,
                );
            }
        }

        if (this.config.fixBrokenCommonTypes) {
            //fix broken common.type in alias.0 from iobroker.device
            const states = await this.getForeignObjectsAsync('alias.0.*');
            this.log.info('Fix broken common.type in alias.0');
            if (states) {
                for (const id in states) {
                    if (
                        states[id] &&
                        states[id].type === 'state' &&
                        states[id].common &&
                        //@ts-expect-error
                        states[id].common.type === 'state'
                    ) {
                        this.log.warn(`Fix broken common.type in ${id} set to 'mixed'`);
                        states[id].common.type = 'mixed';
                        await this.extendForeignObjectAsync(id, states[id]);
                    }
                }
            }
            const o = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
            if (o && o.native) {
                o.native.fixBrokenCommonTypes = false;
                await this.extendForeignObjectAsync(`system.adapter.${this.namespace}`, o);
                return;
            }
        }

        await generateAliasDocumentation();

        if (this.config.weatherEntity === undefined || typeof this.config.weatherEntity !== 'string') {
            this.config.weatherEntity = '';
        } else if (
            this.config.weatherEntity !== '' &&
            definition.weatherEntities.findIndex(a => this.config.weatherEntity.startsWith(a)) === -1
        ) {
            this.log.error(
                `Invalid weatherEntity index, set to ${this.config.weatherEntity}. Report this to the developer! Use custom.`,
            );
            this.config.weatherEntity = '';
        }

        //try {
        this.mainConfiguration = [];
        const obj = await this.getForeignObjectAsync(this.namespace);
        if (obj && obj.native) {
            const config = [];
            if (obj.native.scriptConfigRaw || obj.native.scriptConfig) {
                const panelsText = (this.config.panels || []).map(a => `[${a.name}#${a.topic}]`).join(', ');
                const configsText = (obj.native.scriptConfigRaw as any[])?.map(a => `${a.panelTopic}`).join(', ');

                // Überblicks-Logs
                this.log.info(`Configured panels: name#topic -> ${panelsText}`);
                this.log.info(`Found ${obj.native.scriptConfigRaw.length} script configs for topics: ${configsText}`);
                this.log.info(
                    `Detailed configuration checks are suppressed here. Full validation output is only shown when the configuration script is sent to the adapter.`,
                );

                const manager = new ConfigManager(this, true);
                manager.log.warn = function (_msg: string) {
                    // silence ConfigManager warnings
                };

                for (const a of this.config.panels) {
                    if (!a || !a.topic) {
                        continue;
                    }

                    let usedConfig: 'raw' | 'converted' | null = null;
                    let rawFound = false;
                    let rawConversionFailed = false;

                    // 1) RAW versuchen
                    const raw = (obj.native.scriptConfigRaw as any[])?.find(
                        (b: { panelTopic: string }) => b.panelTopic === a.topic,
                    );
                    if (raw) {
                        rawFound = true;
                        const c = await manager.setScriptConfig(raw);
                        if (c && c.messages && c.messages.length > 0) {
                            if (!c.messages[0].startsWith('Panel')) {
                                this.log.warn(c.messages[0]);
                            }
                        }
                        if (c && c.panelConfig) {
                            config.push(c.panelConfig);
                            usedConfig = 'raw';
                        } else {
                            rawConversionFailed = true; // RAW existiert, aber Umwandlung fehlgeschlagen
                        }
                    }

                    // 2) Fallback: converted
                    if (!usedConfig) {
                        const conv = (obj.native.scriptConfig as any[]).find(
                            (b: { topic: string }) => b.topic === a.topic,
                        );
                        if (conv) {
                            config.push(conv);
                            usedConfig = 'converted';
                        }
                    }

                    // 3) Ergebnis-Log pro Panel
                    if (!usedConfig) {
                        this.log.warn(`No script config found for ${a.topic}`);
                        await manager.delete();
                    } else if (usedConfig === 'raw') {
                        this.log.debug(`Config for ${a.topic}: raw`);
                    } else {
                        // usedConfig === 'converted'
                        if (rawFound && rawConversionFailed) {
                            this.log.warn(
                                `Config for ${a.topic}: converted (RAW conversion failed). ` +
                                    `Please update the configuration script and send it to the adapter again.`,
                            );
                        } else {
                            this.log.warn(`Config for ${a.topic}: converted`);
                        }
                    }
                }
            }
            try {
                this.mainConfiguration = await ConfigManager.getConfig(this, config);
            } catch (e: any) {
                this.log.error(`Error in configuration: ${e.message}`);
                this.mainConfiguration = [];
                return;
            }
        }

        /*} catch (e: any) {
            this.log.warn(`Invalid configuration stopped! ${e}`);
            return;
        }*/
        if (this.config.mqttServer && this.config.mqttPort && this.config.mqttUsername) {
            this.config.mqttPassword = this.config.mqttPassword || '';

            const port = await this.getPortAsync(this.config.mqttPort);
            if (port != this.config.mqttPort) {
                this.log.error(`Port ${this.config.mqttPort} is already in use!`);
                this.log.error(`Please change the port in the admin settings to ${port}!`);
                this.log.error('Stopping adapter!');
                if (this.stop) {
                    await this.stop();
                }
                return;
            }
            this.mqttServer = await MQTT.MQTTServerClass.createMQTTServer(
                this,
                this.config.mqttPort,
                this.config.mqttUsername,
                this.config.mqttPassword,
                './mqtt',
                false,
            );
            this.config.mqttIp = '127.0.0.1';
        }
        if (
            this.config.doubleClickTime === undefined ||
            typeof this.config.doubleClickTime !== 'number' ||
            !(this.config.doubleClickTime > 0)
        ) {
            this.config.doubleClickTime = 350;
        }

        //check config
        try {
            Icons.adapter = this;
            await this.library.init();
            const states = await this.getStatesAsync('*');
            await this.library.initStates(states);
            await this.onMqttConnect();
            await this.delay(1000);

            // set all .info.nspanel.isOnline to false
            for (const id in states) {
                if (id.endsWith('.info.isOnline')) {
                    await this.library.writedp(id, false, definition.genericStateObjects.panel.panels.info.isOnline);
                }
            }
            this.log.debug('Check configuration!');

            if (!this.config.pw1 || typeof this.config.pw1 !== 'string') {
                this.log.warn('No pin entered for the service page! Please set a pin in the admin settings!');
            }

            if (!(this.config.mqttIp && this.config.mqttPort && this.config.mqttUsername && this.config.mqttPassword)) {
                this.log.error('Invalid admin configuration for mqtt!');
                return;
            }
            /*const test = await this.getObjectViewAsync('system', 'instance', {
                startkey: `system.adapter`,
                endkey: `system.adapter}`,
            });
            this.log.debug(JSON.stringify(test));*/
            this.mqttClient = new MQTT.MQTTClientClass(
                this,
                this.config.mqttIp,
                this.config.mqttPort,
                this.config.mqttUsername,
                this.config.mqttPassword,
                this.config.mqttServer,
                async (topic, message) => {
                    this.log.debug(`${topic} ${message}`);
                },
            );
            if (!this.mqttClient) {
                return;
            }
            await this.mqttClient.waitConnectAsync(5000);

            if (
                !this.mainConfiguration ||
                !Array.isArray(this.mainConfiguration) ||
                this.mainConfiguration.length === 0
            ) {
                await this.delay(100);
                await this.mqttClient.destroy();
                await this.delay(100);
                this.log.error('No configuration - adapter on hold!');
                return;
            }
            this.mainConfiguration = structuredClone(this.mainConfiguration);
            let counter = 0;
            for (const a of this.mainConfiguration) {
                try {
                    if (a && a.pages) {
                        const names: string[] = [];
                        for (const p of a.pages) {
                            counter++;
                            if (!('uniqueID' in p)) {
                                continue;
                            }
                            if (
                                p.config?.card === 'screensaver' ||
                                p.config?.card === 'screensaver2' ||
                                p.config?.card === 'screensaver3'
                            ) {
                                p.uniqueID = `#${p.uniqueID}`;
                            }
                            if (names.indexOf(p.uniqueID) !== -1) {
                                throw new Error(
                                    `PanelTopic: ${a.topic} uniqueID ${p.uniqueID} is double! Ignore this panel!`,
                                );
                            }
                            names.push(p.uniqueID);
                        }
                    }
                } catch (e: any) {
                    const index = this.mainConfiguration.findIndex(b => b === a);
                    this.mainConfiguration.splice(index, 1);
                    this.log.error(`Error: ${e}`);
                }
            }
            await this.subscribeForeignStatesAsync('*');

            if (counter === 0) {
                return;
            }
            const mem = process.memoryUsage().heapUsed / 1024;
            this.log.debug(String(`${mem}k`));
            this.controller = new Controller(this, {
                mqttClient: this.mqttClient,
                name: 'controller',
                panels: structuredClone(this.mainConfiguration),
            });

            /*setInterval(() => {
                this.log.debug(
                    `${Math.trunc(mem)}k/${String(Math.trunc(process.memoryUsage().heapUsed / 1024))}k Start/Jetzt: `,
                );
                }, 60000);*/
        } catch (e: any) {
            this.log.error(`Error onReady: ${e}`);
        }
    }

    private onMqttConnect = async (): Promise<void> => {
        const _helper = async (tasmota: any): Promise<void> => {
            try {
                const state = this.library.readdb(`panels.${tasmota.id}.info.nspanel.firmwareUpdate`);
                if (state && typeof state.val === 'number' && state.val >= 100) {
                    this.log.debug(`Force an MQTT reconnect from the Nspanel with the ip ${tasmota.ip} in 10 seconds!`);
                    await axios.get(
                        `http://${tasmota.ip}/cm?` +
                            `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                            `&cmnd=Backlog Restart 1`,
                    );
                } else {
                    this.log.info(`Update detected on the Nspanel with the ip ${tasmota.ip}!!`);
                }
            } catch (e: any) {
                this.log.warn(
                    `Error: This usually means that the NSpanel with ip ${tasmota.ip} is not online or has not been set up properly in the configuration! ${e}`,
                );
            }
        };
        for (const tasmota of this.config.panels) {
            if (tasmota && tasmota.ip) {
                void _helper(tasmota);
            }
        }
        await this.setState('info.connection', true, true);
    };

    async fetch(url: string, init?: RequestInit, timeout = 30_000): Promise<unknown> {
        const controller = new AbortController();

        // 30 seconds timeout
        const timeoutId = this.setTimeout(() => {
            // Abort and remove entry to avoid leak
            try {
                controller.abort();
            } catch {
                // ignore
            }
            this.fetchs.delete(controller);
        }, timeout);

        this.fetchs.set(controller, timeoutId);

        try {
            const response = await fetch(url, {
                ...init,
                method: init?.method ?? 'GET',
                signal: controller.signal,
            });
            if (response.status === 200) {
                return await response.json();
            }
            throw new Error({ status: response.status, statusText: response.statusText } as any);
        } finally {
            // always clear timeout and remove the controller
            const id = this.fetchs.get(controller);
            if (typeof id !== 'undefined') {
                this.clearTimeout(id);
            }
            this.fetchs.delete(controller);
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances.
     *
     * @param callback Callback so the adapter can finish what it has to do.
     */
    private async onUnload(callback: () => void): Promise<void> {
        try {
            this.unload = true;
            if (this.timeoutAdmin) {
                this.clearTimeout(this.timeoutAdmin);
            }
            if (this.timeoutAdmin2) {
                this.clearTimeout(this.timeoutAdmin2);
            }
            for (const [controller, timeoutId] of this.fetchs.entries()) {
                try {
                    if (timeoutId) {
                        this.clearTimeout(timeoutId);
                    }
                    controller.abort();
                } catch {
                    // ignore errors during abort/clear
                }
            }
            this.fetchs.clear();

            this.timeoutAdminArray.forEach(a => {
                if (a) {
                    this.clearTimeout(a);
                }
            });
            this.intervalAdminArray.forEach(a => {
                if (a) {
                    this.clearInterval(a);
                }
            });
            if (this.controller) {
                await this.controller.delete();
            }
            if (this.mqttClient) {
                await this.mqttClient.destroy();
            }
            if (this.mqttServer) {
                this.mqttServer.destroy();
            }
            callback();
        } catch {
            callback();
        }
    }

    /**
     * Is called if a subscribed state changes
     *
     * @param id   The id of the state that changed
     * @param state The state object holding the new value and meta information of the state
     */
    private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
        if (state) {
            if (this.controller) {
                await this.controller.statesControler.onStateChange(id, state);
            }
        } else {
            // The state was deleted
            // this.log.info(`state ${id} deleted`);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Somee message was sent to this instance over message box. Used by email, pushover, text2speech,
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  */
    private async onMessage(obj: ioBroker.Message): Promise<void> {
        if (typeof obj === 'object' && obj.message !== undefined && obj.command) {
            this.log.debug(JSON.stringify(obj));
            if (obj.command === 'tftInstallSendToMQTT') {
                if (obj.message.online === 'no') {
                    obj.command = 'tftInstallSendTo';
                }
            }
            const scriptPath = `script.js.${this.library.cleandp(this.namespace, false, true)}`;
            switch (obj.command) {
                case SENDTO_GET_PAGES_COMMAND: {
                    const names: string[] = [];
                    if (obj?.message?.panelTopic) {
                        if (this.controller?.panels) {
                            const panel = this.controller.panels.find(a => a.topic === obj.message.panelTopic);
                            if (panel) {
                                const db = panel.navigation.getDatabase();

                                if (db) {
                                    for (const p of db) {
                                        if (p?.page) {
                                            names.push(p.page.name);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { result: names }, obj.callback);
                    }
                    break;
                }
                case SENDTO_GET_PAGES_All_COMMAND: {
                    let names: string[] = [];
                    if (this.controller?.panels) {
                        for (const panel of this.controller.panels) {
                            if (panel) {
                                const db = panel.navigation.getDatabase();

                                if (db) {
                                    for (const p of db) {
                                        if (p?.page) {
                                            names.push(p.page.name);
                                        }
                                    }
                                }
                            }
                        }
                        names = Array.from(new Set(names));
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { result: names }, obj.callback);
                    }
                    break;
                }
                case SENDTO_GET_PANELS_COMMAND: {
                    const names: PanelInfo[] = [];
                    if (this.controller?.panels) {
                        for (const p of this.controller.panels) {
                            if (p) {
                                names.push({ panelTopic: p.topic, friendlyName: p.friendlyName || p.name });
                            }
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { result: names }, obj.callback);
                    }
                    break;
                }
                case SAVE_PANEL_NAVIGATION_COMMAND: {
                    if (obj.message && this.controller?.panels) {
                        const data = obj.message as NavigationSavePayload;
                        const panel = this.controller.panels.find(a => a.name === data.panelName);
                        if (panel) {
                            await panel.saveNavigationMap(data.pages);
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                    break;
                }
                case SENDTO_GET_PANEL_NAVIGATION_COMMAND: {
                    const nav: PanelListEntry[] = [];

                    if (this.controller?.panels) {
                        for (const p of this.controller.panels) {
                            if (p) {
                                nav.push(await p.getNavigationArrayForFlow());
                            }
                        }
                    } else {
                        break;
                    }

                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { result: nav }, obj.callback);
                    }

                    break;
                }
                case 'getWeatherEntity': {
                    const adapterObj = await this.getObjectViewAsync('system', 'instance', {
                        startkey: 'system.adapter.',
                        endkey: 'system.adapter.\u9999',
                    });
                    const adapters: string[] = [];
                    if (adapterObj && adapterObj.rows && adapterObj.rows.length > 0) {
                        for (const r of adapterObj.rows) {
                            if (r && r.id && definition.weatherEntities.findIndex(a => r.id.includes(a)) !== -1) {
                                adapters.push(r.id.replace('system.adapter.', ''));
                            }
                        }
                    }
                    const result = adapters.sort().map(a => {
                        return { value: a, label: a };
                    });
                    result.unshift({ label: this.library.getTranslation('custom'), value: '' });

                    if (obj.callback) {
                        this.sendTo(
                            obj.from,
                            obj.command,
                            result ? result : [{ label: 'Not available', value: '' }],
                            obj.callback,
                        );
                    }
                    break;
                }
                case 'config': {
                    const obj1 = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
                    if (
                        obj1 &&
                        obj1.native &&
                        JSON.stringify(obj1.native.Testconfig2) !== JSON.stringify(obj.message)
                    ) {
                        obj1.native.Testconfig2 = obj.message;
                        await this.setForeignObjectAsync(`system.adapter.${this.namespace}`, obj1);
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                    break;
                }
                case 'updateCustom': {
                    if (obj.message && obj.message.state) {
                        const state = await this.getForeignObjectAsync(obj.message.state);
                        if (state && state.common && state.common.custom && state.common.custom[this.namespace]) {
                            this.log.debug(`updateCustom ${JSON.stringify(state.common.custom[this.namespace])}`);
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                    break;
                }
                case 'ScriptConfigGlobal': {
                    const manager = new ConfigManager(this);
                    try {
                        let r: {
                            messages: string[];
                            panelConfig:
                                | (Omit<Partial<panelConfigPartial>, 'pages' | 'navigation'> & {
                                      navigation: NavigationItemConfig[];
                                      pages: pages.PageBase[];
                                  })
                                | undefined;
                        } = { messages: [], panelConfig: undefined };
                        const config = structuredClone(obj.message.panelTopic);
                        r = await manager.setScriptConfig({ ...obj.message, panelTopic: config });
                        await manager.delete();
                        const result = r.messages;
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, result, obj.callback);
                        }
                    } catch (e: any) {
                        this.log.error(`Error in script config processing: ${e.message}`);
                        if (obj.callback) {
                            this.sendTo(
                                obj.from,
                                obj.command,
                                `Error in script config processing: ${e.message}`,
                                obj.callback,
                            );
                        }
                    }
                    break;
                }
                case 'ScriptConfig': {
                    //this.log.debug(`ScriptConfig ${JSON.stringify(obj.message)}`);
                    let result = ['something went wrong'];
                    if (obj.message) {
                        if (this.scriptConfigBacklog.length > 3) {
                            if (obj.callback) {
                                this.sendTo(
                                    obj.from,
                                    obj.command,
                                    `⚠️ Too many configuration changes at once. Please wait a few seconds.`,
                                    obj.callback,
                                );
                            }
                            break;
                        }
                        this.scriptConfigBacklog.push(obj);
                        if (this.scriptConfigBacklog.length > 1) {
                            break;
                        }

                        while (this.scriptConfigBacklog[0] != null) {
                            const manager = new ConfigManager(this);
                            const obj = this.scriptConfigBacklog[0];
                            //try {
                            let r: {
                                messages: string[];
                                panelConfig:
                                    | (Omit<Partial<panelConfigPartial>, 'pages' | 'navigation'> & {
                                          navigation: NavigationItemConfig[];
                                          pages: pages.PageBase[];
                                      })
                                    | undefined;
                            } = { messages: [], panelConfig: undefined };
                            if (obj.message.panelTopic && Array.isArray(obj.message.panelTopic)) {
                                const topics = JSON.parse(JSON.stringify(obj.message.panelTopic));
                                for (const a of topics) {
                                    r = await manager.setScriptConfig({ ...obj.message, panelTopic: a });
                                }
                            } else {
                                r = await manager.setScriptConfig(obj.message);
                            }
                            //this.log.debug(`ScriptConfig result ${JSON.stringify(r.panelConfig)}`);

                            let reloaded = false;
                            //try {
                            if (r.panelConfig) {
                                const arr = await ConfigManager.getConfig(this, [r.panelConfig]);
                                if (arr && arr.length > 0) {
                                    const config = arr[0];
                                    if (this.controller && config) {
                                        const topic = config.topic;

                                        if (topic) {
                                            const index = this.controller.panels.findIndex(a => a.topic === topic);
                                            if (index !== -1) {
                                                const name =
                                                    this.controller.panels[index].friendlyName ||
                                                    config.name ||
                                                    config.topic;
                                                await this.controller.removePanel(this.controller.panels[index]);
                                                if (this.unload) {
                                                    if (obj.callback) {
                                                        this.sendTo(
                                                            obj.from,
                                                            obj.command,
                                                            'Adapter is stopping',
                                                            obj.callback,
                                                        );
                                                    }
                                                    return;
                                                }
                                                await this.delay(1500);
                                                if (this.unload) {
                                                    if (obj.callback) {
                                                        this.sendTo(
                                                            obj.from,
                                                            obj.command,
                                                            'Adapter is stopping',
                                                            obj.callback,
                                                        );
                                                    }
                                                    return;
                                                }
                                                await this.controller.addPanel(config);

                                                const msg = `✅ Panel "${name}" reloaded with updated configuration.`;
                                                this.log.info(msg);
                                                r.messages.push(msg);
                                                reloaded = true;
                                            } else {
                                                r.messages.push(
                                                    `Panel ${topic} not found in controller. Configuration saved. Adapter restart required!`,
                                                );
                                            }
                                        } else {
                                            r.messages.push(
                                                `Panel ${topic} not found in script.   Configuration saved. Adapter restart required!`,
                                            );
                                        }
                                    } else {
                                        r.messages.push(
                                            this.controller
                                                ? `Controller not exist.  Configuration saved. Adapter restart required!`
                                                : `Config not exist. `,
                                        );
                                    }
                                } else {
                                    r.messages.push(`No config found after conversion`);
                                }
                            } else {
                                r.messages.push(`Please send more as 0, '', false, null or undefined!`);
                            }
                            /*} catch (e: any) {
                                        this.log.error(`Error in configuration: ${e.message}`);
                                    }*/
                            if (!reloaded) {
                                const msg = `❌ Panel was not restarted due to configuration errors or missing panel instance. Please verify the panel topic and base configuration.`;
                                this.log.info(msg);
                                r.messages.push(msg);
                            }
                            await manager.delete();
                            result = r.messages;
                            if (obj.callback) {
                                this.sendTo(obj.from, obj.command, result, obj.callback);
                            }
                            /*} catch (e: any) {
                                this.log.error(`Error in script config processing: ${e.message}`);
                                if (obj.callback) {
                                    this.sendTo(
                                        obj.from,
                                        obj.command,
                                        `Error in script config processing: ${e.message}`,
                                        obj.callback,
                                    );
                                }
                            }*/
                            this.scriptConfigBacklog.shift();
                            if (this.scriptConfigBacklog.length > 0) {
                                await this.delay(3000);
                            }
                        }
                        break;
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, 'something when wrong', obj.callback);
                    }
                    break;
                }

                case 'testCase': {
                    // Test mode handler - returns success if adapter is initialized properly
                    const testSuccessful = !!(this.mqttClient && this.controller);
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { testSuccessful }, obj.callback);
                    }
                    break;
                }
                case 'getTasmotaDevices': {
                    if (this.config.panels) {
                        const devices = this.config.panels.map(a => {
                            return { label: `${a.ip} (${a.name})`, value: a.ip };
                        });
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, devices, obj.callback);
                        }
                        break;
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case 'nsPanelInit': {
                    if (obj.message) {
                        try {
                            if (
                                obj.message.tasmotaIP &&
                                (obj.message.mqttIp || obj.message.internalServerIp) &&
                                obj.message.mqttServer != null &&
                                obj.message.mqttPort &&
                                obj.message.mqttUsername &&
                                obj.message.mqttPassword &&
                                obj.message.tasmotaTopic
                            ) {
                                if (obj.message.mqttServer == 'false' || !obj.message.mqttServer) {
                                    obj.message.mqttServer = false;
                                } else {
                                    obj.message.mqttServer = true;
                                }
                                this.log.info(
                                    `Sending mqtt config & base config to tasmota: ${obj.message.tasmotaIP} with user ${obj.message.mqttUsername} && ${obj.message.mqttPassword}`,
                                );
                                let u = new URL(
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                        `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                        `&cmnd=status 5`,
                                );
                                let r = await axios.get(u.href);
                                if (!r || !r.data || !r.data.StatusNET || !r.data.StatusNET.Mac) {
                                    this.log.warn(`Device with topic ${obj.message.tasmotaTopic} not found!`);
                                    if (obj.callback) {
                                        this.sendTo(
                                            obj.from,
                                            obj.command,
                                            { error: 'sendToDeviceNotFound' },
                                            obj.callback,
                                        );
                                    }
                                    break;
                                }
                                let mac = r.data.StatusNET.Mac;
                                const topic = obj.message.tasmotaTopic;
                                const appendix = r.data.StatusNET.Mac.replace(/:/g, '').slice(-6);
                                const mqttClientId = `${this.library.cleandp(obj.message.tasmotaName)}-${appendix}`;
                                const url: string =
                                    ` MqttHost ${obj.message.mqttServer ? obj.message.internalServerIp : obj.message.mqttIp};` +
                                    ` MqttPort ${obj.message.mqttPort}; MqttUser ${obj.message.mqttUsername}; MqttPassword ${obj.message.mqttPassword};` +
                                    ` FullTopic ${`${topic}/%prefix%/`.replaceAll('//', '/')};` +
                                    ` MqttRetry 10; FriendlyName1 ${obj.message.tasmotaName}; Hostname ${obj.message.tasmotaName.replaceAll(/[^a-zA-Z0-9_-]/g, '_')};` +
                                    ` MqttClient ${mqttClientId};` +
                                    ` ${obj.message.mqttServer ? 'SetOption132 1; SetOption103 1 ' : 'SetOption132 0; SetOption103 0'}; Restart 1`;
                                u = new URL(
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                        `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                        `&cmnd=Backlog${encodeURIComponent(url)}`,
                                );
                                this.log.info(
                                    `Sending mqtt config & base config to tasmota with IP ${obj.message.tasmotaIP} and name ${obj.message.tasmotaName}.`,
                                );
                                await axios.get(u.href);
                                this.mqttClient && (await this.mqttClient.waitPanelConnectAsync(topic, 60_000));

                                u = new URL(
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                        `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                        `&cmnd=Backlog${encodeURIComponent(
                                            ` WebLog 2;SetOption111 1; template {"NAME":"${obj.message.tasmotaName}", "GPIO":[0,0,0,0,3872,0,0,0,0,0,32,0,0,0,0,225,0,480,224,1,0,0,0,33,0,0,0,0,0,0,0,0,0,0,4736,0],"FLAG":0,"BASE":1};` +
                                                ` Module 0;${this.config.timezone ? definition.getTasmotaTimeZone(this.config.timezone) : ''}: restart 1`,
                                        )}`,
                                );

                                await axios.get(u.href);
                                this.mqttClient && (await this.mqttClient.waitPanelConnectAsync(topic, 60_000));

                                u = new URL(
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                        `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                        `&cmnd=status 0`,
                                );
                                r = await axios.get(u.href);
                                if (!r || !r.data || !r.data.StatusNET || !r.data.StatusNET.Mac) {
                                    this.log.warn(`Device with topic ${obj.message.tasmotaTopic} not found!`);
                                    if (obj.callback) {
                                        this.sendTo(
                                            obj.from,
                                            obj.command,
                                            { error: 'sendToDeviceNotFound2' },
                                            obj.callback,
                                        );
                                    }
                                    break;
                                }
                                const config = this.config;
                                const panels = config.panels ?? [];
                                const index = panels.findIndex(a => a.topic === obj.message.tasmotaTopic);
                                const item: (typeof this.config.panels)[number] =
                                    index === -1 ? { name: '', ip: '', topic: '', id: '', model: '' } : panels[index];
                                const ipIndex = panels.findIndex(a => a.ip === obj.message.tasmotaIP);
                                let update = false;
                                if (index !== -1 && ipIndex !== index) {
                                    this.log.error('Topic and ip are not on the same panel!');
                                    if (obj.callback) {
                                        this.sendTo(
                                            obj.from,
                                            obj.command,
                                            { error: 'sendToIpTopicDifferent' },
                                            obj.callback,
                                        );
                                    }
                                    break;
                                } else {
                                    update = index !== -1;
                                }
                                mac = r.data.StatusNET.Mac;
                                item.model = obj.message.model;
                                item.name = obj.message.tasmotaName;
                                item.topic = topic;
                                item.id = this.library.cleandp(mac);
                                item.ip = r.data.StatusNET.IPAddress;

                                if (index === -1) {
                                    panels.push(item);
                                }
                                let result: axios.AxiosResponse<any, any> | undefined = undefined;
                                try {
                                    result = await axios.get(
                                        'https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json',
                                    );
                                    if (!result || !result.data) {
                                        this.log.error('No version found!');
                                        if (obj.callback) {
                                            this.sendTo(
                                                obj.from,
                                                obj.command,
                                                { error: 'sendToRequestFail' },
                                                obj.callback,
                                            );
                                        }
                                        break;
                                    }
                                    const version = obj.message.useBetaTFT
                                        ? result.data[`berry-beta`].split('_')[0]
                                        : result.data.berry.split('_')[0];
                                    const url =
                                        `http://${obj.message.tasmotaIP}/cm?` +
                                        `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                        `&cmnd=Backlog UfsRename autoexec.be,autoexec.old; UrlFetch https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/tasmota/berry/${version}/autoexec.be; Restart 1`;
                                    this.log.info(
                                        `Installing berry on tasmota with IP ${obj.message.tasmotaIP}, name ${obj.message.tasmotaName}.`,
                                    );
                                    this.log.debug(`URL: ${url}`);
                                    await axios.get(url);
                                    this.mqttClient && (await this.mqttClient.waitPanelConnectAsync(topic, 20_000));
                                    await this.delay(7000);
                                } catch (e: any) {
                                    this.log.error(`Error: while installing berry - ${e}`);
                                }
                                try {
                                    await this.delay(3000);

                                    const cmnd = await this.getTFTVersionOnline(
                                        obj.message.model,
                                        obj.message.useBetaTFT,
                                        this.config.forceTFTVersion,
                                        result,
                                    );
                                    if (!cmnd) {
                                        this.log.error('No version found!');
                                        if (obj.callback) {
                                            this.sendTo(
                                                obj.from,
                                                obj.command,
                                                { error: 'sendToRequestFail' },
                                                obj.callback,
                                            );
                                        }
                                        break;
                                    }
                                    if (this.mqttClient) {
                                        await this.mqttClient.publish(`${topic}/cmnd/Backlog`, `${cmnd}`);
                                        await this.delay(100);
                                        await this.mqttClient.publish(`${topic}/cmnd/Backlog`, ``);
                                    }
                                    this.log.info(
                                        `Installing tft on tasmota with IP ${obj.message.tasmotaIP} and name ${obj.message.tasmotaName}.`,
                                    );
                                } catch (e: any) {
                                    this.log.error(`Error: ${e}`);
                                    if (obj.callback) {
                                        this.sendTo(
                                            obj.from,
                                            obj.command,
                                            { error: 'sendToRequestFail' },
                                            obj.callback,
                                        );
                                    }
                                }
                                await this.createConfigurationScript(item.name, item.topic);

                                if (obj.callback) {
                                    this.sendTo(
                                        obj.from,
                                        obj.command,
                                        {
                                            result: update
                                                ? 'sendToNSPanelUpdateDataSuccess'
                                                : 'sendToNSPanelInitDataSuccess',
                                            native: { panels: panels },
                                            saveConfig: true,
                                        },
                                        obj.callback,
                                    );
                                }
                            }
                        } catch (e: any) {
                            this.log.error(`Error: while sending mqtt config & base config to tasmota - ${e}`);
                            if (obj.callback) {
                                this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail' }, obj.callback);
                            }
                        }
                        break;
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                    //Backlog UrlFetch https://raw.githubusercontent.com/joBr99/nspanel-lovelace-ui/main/tasmota/autoexec.be; Restart 1
                    //Backlog UpdateDriverVersion https://raw.githubusercontent.com/joBr99/nspanel-lovelace-ui/main/tasmota/autoexec.be; Restart 1
                }

                case 'berryInstallSendTo': {
                    if (obj.message) {
                        if (obj.message.tasmotaIP) {
                            try {
                                let result: axios.AxiosResponse<any, any> | undefined = undefined;

                                result = await axios.get(
                                    'https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json',
                                );
                                if (!result || !result.data) {
                                    this.log.error('No version found!');
                                    if (obj.callback) {
                                        this.sendTo(
                                            obj.from,
                                            obj.command,
                                            { error: 'sendToRequestFail' },
                                            obj.callback,
                                        );
                                    }
                                    break;
                                }
                                const version = obj.message.useBetaTFT
                                    ? result.data[`berry-beta`].split('_')[0]
                                    : result.data.berry.split('_')[0];
                                const url =
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                    `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                    `&cmnd=Backlog UfsDelete autoexec.old; UfsRename autoexec.be,autoexec.old; UrlFetch https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/tasmota/berry/${version}/autoexec.be; Restart 1`;

                                this.log.info(`Installing berry on tasmota with IP ${obj.message.tasmotaIP}`);
                                await axios.get(url);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: any) {
                                this.log.error(`Error: while installing berry - ${e}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail' }, obj.callback);
                                }
                            }
                            break;
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case 'tftInstallSendTo': {
                    if (obj.message) {
                        if (obj.message.tasmotaIP /*&& obj.message.internalServerIp*/) {
                            try {
                                const cmnd = await this.getTFTVersionOnline(
                                    obj.message.model,
                                    obj.message.useBetaTFT,
                                    this.config.forceTFTVersion,
                                );
                                if (!cmnd) {
                                    this.log.error('No version found!');
                                    if (obj.callback) {
                                        this.sendTo(
                                            obj.from,
                                            obj.command,
                                            { error: 'sendToRequestFail' },
                                            obj.callback,
                                        );
                                    }
                                    break;
                                }
                                const url =
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                    `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                    `&cmnd=Backlog ${cmnd}`;
                                this.log.debug(url);
                                await axios.get(url);

                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: any) {
                                this.log.error(`Error: ${e}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail' }, obj.callback);
                                }
                            }
                            break;
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case 'tftInstallSendToMQTT': {
                    if (obj.message) {
                        if (obj.message.topic /*&& obj.message.internalServerIp*/) {
                            try {
                                const cmnd = await this.getTFTVersionOnline(
                                    obj.message.model,
                                    obj.message.useBetaTFT,
                                    this.config.forceTFTVersion,
                                );
                                if (!cmnd) {
                                    this.log.error('No version found!');
                                    if (obj.callback) {
                                        this.sendTo(
                                            obj.from,
                                            obj.command,
                                            { error: 'sendToRequestFail' },
                                            obj.callback,
                                        );
                                    }
                                    break;
                                }

                                if (this.controller?.panels) {
                                    const index = this.controller.panels.findIndex(a => a.topic === obj.message.topic);
                                    if (index !== -1) {
                                        const panel = this.controller.panels[index];
                                        panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, cmnd);
                                        await this.delay(100);
                                        panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, ``);
                                    }
                                }

                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: any) {
                                this.log.error(`Error: ${e}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail' }, obj.callback);
                                }
                            }
                            break;
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }

                case 'getRandomMqttCredentials': {
                    if (obj.message) {
                        const allowedChars: string[] = [
                            ...'abcdefghijklmnopqrstuvwxyz',
                            ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                            ...'0123456789',
                            ...'()*+-.:<=>[]_',
                        ];
                        const allowedCharsUser: string[] = [
                            ...'abcdefghijklmnopqrstuvwxyz',
                            ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', // c|Yh7Pe<&1ap34t/]S&TxDwL&KDWqW-Se_D@vtXh,z]|T[RIqLgz.>^3H1j<
                        ];
                        const passwordLength = 50;
                        const usernameLength = 15;
                        const getString = (c: string[], length: number): string => {
                            let result = '';
                            for (let i = 0; i < length; i++) {
                                const random = Math.floor(Math.random() * c.length);
                                result += c[random];
                            }
                            return result;
                        };

                        const result = {
                            native: {
                                mqttUsername: getString(allowedCharsUser, usernameLength),
                                mqttPassword: getString(allowedChars, passwordLength),
                                mqttPort: await this.getPortAsync(8883),
                                saveConfig: true,
                            },
                        };
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, result, obj.callback);
                        }
                        break;
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'error' }, obj.callback);
                    }
                    break;
                }
                case 'selectPanel': {
                    if (this.mainConfiguration && obj.message?.id) {
                        let msg: any[] = [];
                        switch (obj.message.id) {
                            case 'panel': {
                                msg = this.mainConfiguration.map(a => {
                                    const index = this.config.panels.findIndex(b => b.topic === a.topic);
                                    if (index !== -1) {
                                        return { value: a.topic, label: this.config.panels[index].name };
                                    }
                                    return null;
                                });
                                msg = msg.filter(a => a);
                                msg.sort((a, b) => a.label.localeCompare(b.label));
                                break;
                            }
                            case 'uniqueID': {
                                if (obj.message.panel) {
                                    const index: number = this.mainConfiguration.findIndex(
                                        a => a.topic === obj.message.panel,
                                    );
                                    if (index !== -1) {
                                        msg = this.mainConfiguration[index].pages.map(a => {
                                            return { label: a.uniqueID, value: a.uniqueID };
                                        });
                                        msg.sort((a, b) => a.label.localeCompare(b.label));
                                        break;
                                    }
                                }
                                msg = [];
                                break;
                            }
                            case 'navigationNames': {
                                if (obj.message.table && Array.isArray(obj.message.table)) {
                                    msg = obj.message.table.map((a: { name: string }) => {
                                        return a.name;
                                    });
                                    msg = msg.filter(a => a && a !== obj.message.name);
                                    msg.sort((a, b) => a.localeCompare(b));
                                    break;
                                }
                                msg = [];
                                break;
                            }
                        }

                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, msg, obj.callback);
                            break;
                        }
                    }

                    this.sendTo(obj.from, obj.command, null, obj.callback);
                    break;
                }
                case '_loadNavigationOverview': {
                    if (this.mainConfiguration && obj.message?.panel) {
                        let msg: any[] = [];
                        let useNavigation = false;
                        let configFrom = '';
                        const index: number = this.mainConfiguration.findIndex(a => a.topic === obj.message.panel);
                        if (index !== -1) {
                            let nav: any[] = [];
                            const o = await this.getForeignObjectAsync(this.namespace);
                            if (o?.native?.navigation && o.native.navigation[obj.message.panel]) {
                                nav = o.native.navigation[obj.message.panel].data;
                                useNavigation = o.native.navigation[obj.message.panel].useNavigation;
                                configFrom = 'Adminconfiguration';
                            } else {
                                nav = this.mainConfiguration[index].navigation;
                                configFrom = 'Scriptconfiguration';
                            }
                            msg = nav.map(a => {
                                return a
                                    ? {
                                          name: a.name,
                                          page: a.page,
                                          left1: a.left?.single,
                                          left2: a.left?.double,
                                          right1: a.right?.single,
                                          right2: a.right?.double,
                                      }
                                    : null;
                            });
                            msg = msg.filter(a => a);
                        }
                        if (obj.callback) {
                            this.sendTo(
                                obj.from,
                                obj.command,
                                {
                                    native: {
                                        _NavigationOverviewTable: msg,
                                        _useNavigation: useNavigation,
                                        _configFrom: configFrom,
                                    },
                                },
                                obj.callback,
                            );
                        }
                        break;
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case '_saveNavigationOverview': {
                    if (obj.message?.table && obj.message?.panel && this.mainConfiguration) {
                        const o = await this.getForeignObjectAsync(this.namespace);
                        if (o && o.native) {
                            const index: number = this.mainConfiguration.findIndex(a => a.topic === obj.message.panel);
                            if (index !== -1) {
                                let result = obj.message.table.map(
                                    (a: { name: any; page: any; left1: any; left2: any; right1: any; right2: any }) => {
                                        return a && a.name && a.page && (a.left1 || a.left2 || a.right1 || a.right2)
                                            ? {
                                                  name: a.name,
                                                  page: a.page,
                                                  left:
                                                      a.left1 || a.left2 ? { single: a.left1, double: a.left2 } : null,
                                                  right:
                                                      a.right1 || a.right2
                                                          ? { single: a.right1, double: a.right2 }
                                                          : null,
                                              }
                                            : null;
                                    },
                                );
                                result = result.filter((a: any) => a);
                                o.native.navigation = o.native.navigation ?? {};
                                o.native.navigation[obj.message.panel] = {
                                    useNavigation: obj.message.useNavigation === 'true',
                                    data: result,
                                };

                                await this.setForeignObjectAsync(this.namespace, o);
                            }
                            if (obj.callback) {
                                this.sendTo(obj.from, obj.command, null, obj.callback);
                            }
                            break;
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case '_clearNavigationOverview': {
                    if (obj.message?.table && obj.message?.panel && this.mainConfiguration) {
                        const o = await this.getForeignObjectAsync(this.namespace);
                        if (o && o.native && o.native.navigation && o.native.navigation[obj.message.panel]) {
                            o.native.navigation[obj.message.panel] = undefined;
                            await this.setForeignObjectAsync(this.namespace, o);
                        }
                        if (obj.callback) {
                            this.sendTo(
                                obj.from,
                                obj.command,
                                {
                                    native: {
                                        _NavigationOverviewTable: [],
                                        _useNavigation: false,
                                        _configFrom: 'None!',
                                    },
                                },
                                obj.callback,
                            );
                        }
                        break;
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case 'tasmotaRestartSendTo': {
                    if (obj.message) {
                        if (obj.message.tasmotaIP /*&& obj.message.internalServerIp*/) {
                            try {
                                const url =
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                    `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                    `&cmnd=Restart 1`;
                                this.log.debug(url);
                                await axios.get(url);

                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: any) {
                                this.log.error(`Error: ${e}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail' }, obj.callback);
                                }
                            }
                            break;
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case 'resetTasmota': {
                    if (obj.message) {
                        if (obj.message.tasmotaIP /*&& obj.message.internalServerIp*/) {
                            try {
                                const url =
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                    `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                    `&cmnd=reset 4`;
                                this.log.debug(`Reset to factory defaults tasmota with IP ${obj.message.tasmotaIP}`);
                                await axios.get(url);

                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: any) {
                                this.log.error(`Error: ${e}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail' }, obj.callback);
                                }
                            }
                            break;
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }

                case 'refreshMaintainTable': {
                    const added: string[] = [];
                    let result: any[] = [];
                    const flashingText = this.library.getTranslation('Updating');
                    const flashingObj: Record<string, string> = {};

                    let file = undefined;
                    if (fs.existsSync(path.join(__dirname, '../script'))) {
                        file = fs.readFileSync(
                            path.join(__dirname, '../script/example_sendTo_script_iobroker.ts'),
                            'utf8',
                        );
                    }
                    const vTemp = file?.match(/const version = '(\d+\.\d+\.\d+)';/) || [];
                    const version = vTemp[1] ? vTemp[1] : '';

                    for (let a = 0; a < this.config.panels.length; a++) {
                        const panel = this.config.panels[a];
                        const state = this.library.readdb(`panels.${panel.id}.info.nspanel.firmwareUpdate`);
                        if (state && typeof state.val === 'number' && state.val < 100) {
                            flashingObj[panel.id] = `${flashingText}: ${state.val}%`;
                        }
                    }

                    if (this.controller?.panels) {
                        const updateText = this.library.getTranslation('updateAvailable');
                        const checkText = this.library.getTranslation('check!');
                        const temp = [];
                        for (const a of this.controller.panels) {
                            let check = false;
                            let tv = '';
                            let nv = '';
                            let sv = '';
                            const ft = flashingObj[a.name];
                            const scriptId = this.library.cleandp(
                                `${scriptPath}.${this.library.cleandp(a.friendlyName, false, true)}`,
                            );
                            const o = await this.getForeignObjectAsync(scriptId);
                            if (o) {
                                const temp = o.common.source.match(/const.version.+'(\d+\.\d+\.\d+)';/)?.[1] ?? '';
                                if (temp !== version) {
                                    check = true;
                                    sv = `${temp} (${updateText}: v${version})`;
                                } else {
                                    sv = temp;
                                }
                            }
                            if (a.info) {
                                if (a.info.tasmota?.firmwareversion) {
                                    const temp = a.info.tasmota.firmwareversion.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
                                    if (temp && temp[1]) {
                                        tv = `${temp[1]}`;
                                    }
                                }
                                if (a.info.tasmota?.onlineVersion && tv) {
                                    const temp = a.info.tasmota.onlineVersion.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
                                    if (temp && temp[1] && temp[1] !== tv) {
                                        tv += ` (${updateText})`;
                                        check = true;
                                    }
                                }
                                tv = tv ? `v${tv}` : '';
                                if (a.info.nspanel?.displayVersion) {
                                    const temp = a.info.nspanel.displayVersion.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
                                    if (temp && temp[1]) {
                                        nv = `${temp[1]}`;
                                    }
                                }
                                if (a.info.nspanel?.onlineVersion && nv) {
                                    const temp = a.info.nspanel.onlineVersion.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
                                    if (temp && temp[1] && temp[1] !== nv) {
                                        if (nv === '0.0.0') {
                                            nv += ` (Developer version!)`;
                                        } else {
                                            nv += ` (${updateText})`;
                                        }
                                        check = true;
                                    }
                                }
                                nv = nv ? `v${nv}` : '';
                            }
                            added.push(a.topic);

                            temp.push({
                                _check: check,
                                _Headline: `${a.friendlyName} (${ft ? ft : `${check ? checkText : `${a.isOnline ? 'online' : 'offline'}`}`})`,
                                _name: a.friendlyName,
                                _ip: a.info?.tasmota?.net?.IPAddress
                                    ? a.info.tasmota.net.IPAddress
                                    : 'offline - waiting',
                                _online: a.isOnline ? 'yes' : 'no',
                                _topic: a.topic,
                                _id: a.info?.tasmota?.net?.Mac ? a.info.tasmota.net.Mac : '',
                                _tftVersion: nv ? nv : '???',
                                _tasmotaVersion: tv ? tv : '???',
                                _ScriptVersion: sv ? `v${sv}` : '???',
                                _nsPanelModel: a.info?.nspanel?.model
                                    ? a.info.nspanel.model == 'eu'
                                        ? ''
                                        : a.info.nspanel.model
                                    : '',
                            });
                        }
                        result = result.concat(temp);
                    }
                    if (this.config.panels) {
                        const temp2 = this.config.panels.filter(a => {
                            return added.findIndex(b => b === a.topic) === -1;
                        });
                        const temp = [];
                        for (const a of temp2) {
                            const ft = flashingObj[a.name];
                            let sv = version;
                            const scriptId = this.library.cleandp(
                                `${scriptPath}.${this.library.cleandp(a.name, false, true)}`,
                            );
                            const o = await this.getForeignObjectAsync(scriptId);
                            if (o) {
                                const temp = o.common.source.match(/const.version.+'(\d+\.\d+\.\d+)';/)?.[1] ?? '';
                                if (temp !== version) {
                                    sv = temp ? temp : version;
                                }
                            }
                            temp.push({
                                _check: true,
                                _Headline: `${a.name} (${
                                    ft
                                        ? ft
                                        : `${
                                              this.mainConfiguration
                                                  ? this.mainConfiguration.findIndex(b => b.topic === a.topic) === -1
                                                      ? 'Missing configuration!'
                                                      : 'offline - waiting'
                                                  : 'offline'
                                          }`
                                })`,
                                _name: a.name,
                                _ip: this.mainConfiguration
                                    ? this.mainConfiguration.findIndex(b => b.topic === a.topic) === -1
                                        ? 'Missing configuration!'
                                        : 'offline - waiting'
                                    : 'offline',
                                _online: 'no',
                                _topic: a.topic,
                                _id: '',
                                _tftVersion: '---',
                                _tasmotaVersion: '---',
                                _ScriptVersion: sv ? `v${sv}` : '???',
                                _nsPanelModel: a.model,
                            });
                        }
                        result = result.concat(temp);
                    }
                    if (result.length > 0) {
                        result.sort((a, b) => a._name.localeCompare(b._name));
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, { native: { _maintainPanels: result } }, obj.callback);
                        }
                        break;
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case 'createScript': {
                    const result = await this.createConfigurationScript(obj.message.name, obj.message.topic);
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, result, obj.callback);
                    }
                    break;
                }
                case 'getIcons': {
                    const icons = Array.from(Icons.iconMap, ([name]) => name).map(a => {
                        return { label: a, value: a };
                    });
                    this.sendTo(obj.from, obj.command, icons, obj.callback);
                    break;
                }
                case 'getIconBase64': {
                    try {
                        if (fs.existsSync(path.join(__dirname, '../script'))) {
                            const fileContent = fs.readFileSync(path.join(__dirname, '../script/icons.json'), 'utf-8');
                            const icons = JSON.parse(fileContent);
                            const index = icons.findIndex((a: { name: string }) => a.name === obj.message.icon);
                            let img = '';
                            if (index !== -1) {
                                img = icons[index].base64;
                            }
                            this.sendTo(obj.from, obj.command, img, obj.callback);
                        }
                    } catch (error) {
                        console.error('Fehler beim Verarbeiten der Datei:', error);
                    }

                    break;
                }
                case 'updateTasmota': {
                    let language = this.library.getLocalLanguage();
                    language = language === 'zh-cn' ? 'en' : language;
                    const cmnd = `OtaUrl http://ota.tasmota.com/tasmota32/release/tasmota32-${language.toUpperCase()}.bin; Upgrade 1`;

                    if (this.controller?.panels) {
                        const index = this.controller.panels.findIndex(a => a.topic === obj.message.topic);
                        if (index !== -1) {
                            const panel = this.controller.panels[index];
                            panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, cmnd);
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                    break;
                }
                case 'openTasmotaConsole':
                case 'openLinkToTasmota': {
                    if (obj.callback) {
                        this.sendTo(
                            obj.from,
                            obj.command,
                            {
                                openUrl: `http://${obj.message.ip}:80/${obj.command === 'openTasmotaConsole' ? 'cs?' : ''}`,
                                saveConfig: false,
                            },
                            obj.callback,
                        );
                    }
                    break;
                }
                case 'getTimeZones': {
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, definition.tasmotaTimeZonesAdmin, obj.callback);
                    }
                    break;
                }
                case 'openLinkAliasTable': {
                    if (obj.callback) {
                        this.sendTo(
                            obj.from,
                            obj.command,
                            {
                                openUrl: obj.message.url,
                                saveConfig: false,
                            },
                            obj.callback,
                        );
                    }
                    break;
                }
                case 'screensaverNotify': {
                    // sendTo('nspanel-lovelace-ui.0', 'screensaverNotify', { panel: 'panelTopic', heading: 'Heading', text: 'Text', enabled: true });
                    if (obj.message?.panel && this.controller?.panels) {
                        const panel = this.controller.panels.find(a => a.topic === obj.message.topic);
                        if (panel?.screenSaver) {
                            if (typeof obj.message.heading === 'string') {
                                await panel.statesControler.setInternalState(
                                    `${panel.name}/cmd/screensaverHeadingNotification`,
                                    obj.message.heading,
                                    false,
                                );
                            }
                            if (typeof obj.message.text === 'string') {
                                await panel.statesControler.setInternalState(
                                    `${panel.name}/cmd/screensaverTextNotification`,
                                    obj.message.text,
                                    false,
                                );
                            }
                            await panel.statesControler.setInternalState(
                                `${panel.name}/cmd/screensaverActivateNotification`,
                                !!obj.message.enabled,
                                false,
                            );
                            //panel.screenSaver.textNotification = obj.message.text || '';
                            //panel.screenSaver.sendNotify(!!obj.message.enabled);
                        } else {
                            this.log.warn(`Panel ${obj.message.panel} not exists!`);
                        }
                    } else {
                        this.log.warn(
                            `Missing panel in screensaverNotify: ${JSON.stringify(obj.message)} or controller not ready!`,
                        );
                    }
                    // Send response in callback if required
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case 'buzzer': {
                    // sendTo('nspanel-lovelace-ui.0', 'buzzer', { panel: 'panelTopic', command: '1,2,3,0xF54' });
                    if (obj.message?.panel && this.controller?.panels) {
                        const panel = this.controller.panels.find(a => a.topic === obj.message.panel);
                        if (panel && typeof obj.message.command === 'string' && obj.message.command.trim()) {
                            await panel.statesControler.setInternalState(
                                `${panel.name}/cmd/buzzer`,
                                obj.message.command.trim(),
                                false,
                            );
                        } else {
                            this.log.warn(`Panel ${obj.message.panel} not found or invalid buzzer command!`);
                        }
                    } else {
                        this.log.warn(
                            `Missing panel or command in buzzer: ${JSON.stringify(obj.message)} or controller not ready!`,
                        );
                    }
                    // Send response in callback if required
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                    break;
                }
                default: {
                    // Send response in callback if required
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                }
            }
        } else {
            if (obj.callback) {
                this.sendTo(obj.from, obj.command, { error: 'failed' }, obj.callback);
            }
        }
    }

    async writeStateExternalAsync(dp: string, val: ioBroker.StateValue): Promise<void> {
        if (dp.startsWith(this.namespace)) {
            return;
        }
        await this.setForeignStateAsync(dp, val, false);
    }
    async createGlobalConfigurationScript(): Promise<any> {
        const scriptPath = `script.js.${this.library.cleandp(this.namespace, false, true)}`;

        const folder: ioBroker.ChannelObject = {
            type: 'channel',
            _id: scriptPath,
            common: {
                name: this.namespace,
                expert: true,
            },
            native: {},
        };
        await this.extendForeignObjectAsync(scriptPath, folder);

        // Skript erstellen
        const scriptId = this.library.cleandp(`${scriptPath}.globalPageConfig`);
        this.log.debug(`Create/Update script ${scriptId}`);
        if (fs.existsSync(path.join(__dirname, '../script'))) {
            let file = fs.readFileSync(path.join(__dirname, '../script/globalPageConfig.ts'), 'utf8');
            const baseFile = fs.readFileSync(
                path.join(__dirname, '../script/example_sendTo_script_iobroker.ts'),
                'utf8',
            );

            const o = await this.getForeignObjectAsync(scriptId);
            if (baseFile && file) {
                file = file.replace(
                    /await sendToAsync\('nspanel-lovelace-ui\.0', 'ScriptConfigGlobal',/,
                    `await sendToAsync('${this.namespace}', 'ScriptConfigGlobal',`,
                );
                const token = 'stopScript(scriptName, undefined)';
                if (o) {
                    const indexFrom = baseFile.indexOf(token);
                    const indexTo = o.common.source.indexOf(token);
                    if (indexFrom !== -1 && indexTo !== -1) {
                        this.log.info(`Update script ${scriptId}`);
                        file = o.common.source.substring(0, indexTo) + baseFile.substring(indexFrom);
                    } else {
                        this.log.warn(`Update script ${scriptId} something whent wrong!`);
                        return { error: `Update script ${scriptId} something whent wrong!` };
                    }
                    this.log.info(`Update global script ${scriptId}`);
                } else {
                    const indexFrom = baseFile.indexOf(token);
                    const indexTo = file.indexOf(token);
                    if (indexFrom !== -1 && indexTo !== -1) {
                        this.log.info(`Update script ${scriptId}`);
                        file = file.substring(0, indexTo) + baseFile.substring(indexFrom);
                    } else {
                        this.log.warn(`Update script ${scriptId} something whent wrong!`);
                        return { error: `Update script ${scriptId} something whent wrong!` };
                    }
                    this.log.info(`Create global script ${scriptId}`);
                }
                const script: ioBroker.ScriptObject = {
                    type: 'script',
                    _id: scriptId,
                    common: {
                        name: 'Global page configuration',
                        engineType: 'TypeScript/ts',
                        engine: `system.adapter.javascript.0`,
                        source: file,
                        debug: false,
                        verbose: false,
                        enabled: o?.common.enabled ?? true,
                    },
                    native: {},
                };
                await this.extendForeignObjectAsync(scriptId, script);
                return [];
            }
        }
    }
    async createConfigurationScript(panelName: string, panelTopic: string): Promise<any> {
        await this.createGlobalConfigurationScript();

        const scriptPath = `script.js.${this.library.cleandp(this.namespace, false, true)}`;

        const folder: ioBroker.ChannelObject = {
            type: 'channel',
            _id: scriptPath,
            common: {
                name: this.namespace,
                expert: true,
            },
            native: {},
        };
        await this.extendForeignObjectAsync(scriptPath, folder);

        // Skript erstellen
        const scriptId = this.library.cleandp(`${scriptPath}.${this.library.cleandp(panelName, false, true)}`);
        this.log.debug(`Create script ${scriptId}`);
        if (fs.existsSync(path.join(__dirname, '../script')) && panelName && panelTopic) {
            let file = fs.readFileSync(path.join(__dirname, '../script/example_sendTo_script_iobroker.ts'), 'utf8');
            const o = await this.getForeignObjectAsync(scriptId);
            if (file) {
                file = file.replace(`panelTopic: 'topic',`, `panelTopic: '${panelTopic}',`);
                file = file.replace(
                    /await sendToAsync\('nspanel-lovelace-ui\.0', 'ScriptConfig',/,
                    `await sendToAsync('${this.namespace}', 'ScriptConfig',`,
                );
                if (o) {
                    const token = '*  END STOP END STOP END - No more configuration - END STOP END STOP END       *';
                    const indexFrom = file.indexOf(token);
                    const indexTo = o.common.source.indexOf(token);
                    if (indexFrom !== -1 && indexTo !== -1) {
                        this.log.info(`Update script ${scriptId}`);
                        file = o.common.source.substring(0, indexTo) + file.substring(indexFrom);
                    } else {
                        this.log.warn(`Update script ${scriptId} something whent wrong!`);
                        return { error: `Update script ${scriptId} something whent wrong!` };
                    }
                } else {
                    this.log.info(`Create script ${scriptId}`);
                }
                const script: ioBroker.ScriptObject = {
                    type: 'script',
                    _id: scriptId,
                    common: {
                        name: panelName,
                        engineType: 'TypeScript/ts',
                        engine: `system.adapter.javascript.0`,
                        source: file,
                        debug: false,
                        verbose: false,
                        enabled: o?.common.enabled ?? true,
                    },
                    native: {},
                };
                await this.extendForeignObjectAsync(scriptId, script);
                return [];
            }
        }
    }
    async getTFTVersionOnline(
        m: string,
        beta: boolean,
        alpha: string,
        result?: axios.AxiosResponse<any, any>,
    ): Promise<string | null> {
        if (!result) {
            result = await axios.get(
                'https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json',
                { timeout: 10_000 },
            );
        }
        const data = result?.data;
        if (!data) {
            this.log.error('No version data received.');
            return null;
        }
        data['tft-alpha'] = alpha;

        const modelSuffix = m ? `-${m}` : '';
        const key = alpha ? `tft${modelSuffix}-alpha` : beta ? `tft${modelSuffix}-beta` : `tft${modelSuffix}`;

        const entry = data[key] as string | undefined;
        if (!entry) {
            this.log.error(`No version entry for key "${key}".`);
            return null;
        }

        const version = String(entry).split('_')[0]; // z.B. "1.2.3" aus "1.2.3_filename"
        if (!version) {
            this.log.error(`Invalid version in entry for "${key}": ${entry}`);
            return null;
        }

        const fileName = `nspanel${modelSuffix}-v${version}.tft`;
        const url = `http://nspanel.de/${encodeURIComponent(fileName)}`;
        const cmnd = `FlashNextionAdv0 ${url}`;

        if (alpha) {
            this.log.warn(`⚠️  Installing pinned ${alpha} TFT firmware – for testing only.`);
        }

        this.log.debug(cmnd);
        return cmnd;
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new NspanelLovelaceUi(options);
} else {
    // otherwise start the instance directly
    (() => new NspanelLovelaceUi())();
}
