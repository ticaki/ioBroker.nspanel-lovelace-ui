import {
    SENDTO_GET_PANEL_NAVIGATION_COMMAND,
    SAVE_PANEL_NAVIGATION_COMMAND,
    SENDTO_GET_PAGES_COMMAND,
    SENDTO_GET_PANELS_COMMAND,
    SENDTO_GET_PAGES_All_COMMAND,
    ALL_PANELS_SPECIAL_ID,
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

import * as MQTT from './lib/classes/mqtt';
import { Controller } from './lib/controller/controller';
import { Icons } from './lib/const/icon_mapping';
import * as definition from './lib/const/definition';
import { ConfigManager } from './lib/classes/config-manager';
import type { panelConfigPartial } from './lib/controller/panel';
import { generateAliasDocumentation } from './lib/tools/readme';
import { URL } from 'url';
import type * as pages from './lib/types/pages';
import * as fs from 'fs';
import type { NavigationItemConfig } from './lib/classes/navigation';
import path from 'path';
import { testScriptConfig } from './lib/const/test';
import type { NavigationSavePayload, PanelListEntry, PanelInfo, PageConfig } from './lib/types/adminShareConfig';
import { isTasmotaStatusNet } from './lib/types/function-and-const';
import type { oldQRType } from './lib/types/types';
import iCal from 'node-ical';

class NspanelLovelaceUi extends utils.Adapter {
    library: Library;
    mqttClient: MQTT.MQTTClientClass | undefined;
    mqttServer: MQTT.MQTTServerClass | undefined;
    controller: Controller | undefined;
    unload: boolean = false;
    testSuccessful: boolean = true;
    timeoutAdmin: ioBroker.Timeout | undefined;
    timeoutAdmin2: ioBroker.Timeout | undefined;
    timeoutAdminArray: (ioBroker.Timeout | undefined)[] = [];

    intervalAdminArray: (ioBroker.Interval | undefined)[] = [];

    mainConfiguration: panelConfigPartial[] | undefined;

    testCaseConfig: any; // just for testing
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
        }
        const o = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
        if (o && o.native) {
            let change = false;
            const native = o.native as any;
            if (native.fixBrokenCommonTypes === true) {
                native.fixBrokenCommonTypes = false;
                change = true;
            }
            native.pageConfig = native.pageConfig || [];
            if (native.pageUnlockConfig && !native.pageConfig) {
                native.pageConfig = native.pageUnlockConfig;
                delete native.pageUnlockConfig;
                change = true;
            }
            if (native.pageQRdata) {
                native.pageQRdata.forEach((page: oldQRType) => {
                    const temp: PageConfig = {
                        card: 'cardQR',
                        uniqueName: page.pageName,
                        headline: page.headline,
                        selType: page.selType,
                        ssidUrlTel: page.SSIDURLTEL,
                        setState: page.setState || '',
                        wlanhidden: page.wlanhidden || false,
                        pwdhidden: page.pwdhidden || false,
                        hidden: page.hiddenByTrigger || false,
                        alwaysOn: page.alwaysOnDisplay ? 'always' : 'none',
                    };

                    native.pageConfig.push(temp);
                });
                delete native.pageQRdata;
                change = true;
            }

            if (change) {
                const uniquePages = new Map();
                for (const p of native.pageConfig ?? []) {
                    if (p?.uniqueName) {
                        if (uniquePages.has(p.uniqueName)) {
                            this.log.warn(`Duplicate uniqueName '${p.uniqueName}' found in pageConfig!`);
                            continue;
                        }
                        uniquePages.set(p.uniqueName, p);
                    }
                }
                native.pageConfig = [...uniquePages.values()];
                await this.setForeignObject(`system.adapter.${this.namespace}`, o);
                this.log.warn(`Updated configuration of ${this.namespace} to the latest version. Restart adapter!`);
                return;
            }
        }

        await generateAliasDocumentation();
        if (this.config.testCase) {
            this.log.warn('Testcase mode!');
        }

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
                this.config.testCase,
            );
            this.config.mqttIp = '127.0.0.1';
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
                this.testSuccessful = false;
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

            if (this.config.testCase) {
                await this.extendForeignObjectAsync('0_userdata.0.boolean', {
                    type: 'state',
                    common: { name: 'boolean', type: 'boolean' },
                    native: {},
                });
                await this.extendForeignObjectAsync('0_userdata.0.number', {
                    type: 'state',
                    common: { name: 'number', type: 'number' },
                    native: {},
                });
                await this.extendForeignObjectAsync('0_userdata.0.string', {
                    type: 'state',
                    common: { name: 'string', type: 'string' },
                    native: {},
                });
                await this.onMessage({
                    _id: Date.now(),
                    message: testScriptConfig,
                    command: 'ScriptConfig',
                    from: 'system.adapter.admin.0',
                    callback: () => {},
                } as unknown as ioBroker.Message);
                await this.delay(3000);
                this.mainConfiguration = this.testCaseConfig;
                const test = new MQTT.MQTTClientClass(
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
                await test.waitConnectAsync(5000);

                await test.subscribe('test/123456/cmnd/#', async (topic, message) => {
                    this.log.debug(`Testcase ${topic}`);
                    if (message === 'pageType~pageStartup') {
                        await test.publish('test/123456/stat/RESULT', '{"CustomSend": "Done"}');
                        await test.publish('test/123456/tele/RESULT', '{"CustomRecv":"event,startup,54,eu"}');
                    } else if (topic === 'test/123456/cmnd/STATUS0') {
                        await test.publish(
                            'test/123456/stat/STATUS0',
                            '{"Status":{"Module":0,"DeviceName":"NSPanel 4 Test","FriendlyName":["Tasmota",""],"Topic":"ns_panel4","ButtonTopic":"0","Power":"00","PowerLock":"00",' +
                                '"PowerOnState":3,"LedState":1,"LedMask":"FFFF","SaveData":1,"SaveState":1,"SwitchTopic":"0","SwitchMode":' +
                                '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ButtonRetain":0,"SwitchRetain":0,"SensorRetain":0,"PowerRetain":0,"InfoRetain":0,' +
                                '"StateRetain":0,"StatusRetain":0},"StatusPRM":{"Baudrate":115200,"SerialConfig":"8N1","GroupTopic":"tasmotas",' +
                                '"OtaUrl":"http://ota.tasmota.com/tasmota32/release/tasmota32-nspanel.bin","RestartReason":"Vbat power on reset","Uptime":"0T00:07:28","StartupUTC":' +
                                '"2025-02-19T09:23:29","Sleep":50,"CfgHolder":4617,"BootCount":59,"BCResetTime":"2024-01-06T17:11:30","SaveCount":110},"StatusFWR":{"Version":"14.4.1(release-nspanel)",' +
                                '"BuildDateTime":"2024-12-15T13:33:11","Core":"3_1_0","SDK":"5.3.2","CpuFrequency":160,"Hardware":"ESP32-D0WD-V3 v3.1","CR":"502/699"},"StatusLOG":{"SerialLog":2,' +
                                '"WebLog":1,"MqttLog":3,"SysLog":0,"LogHost":"","LogPort":514,"SSId":["xxx",""],"TelePeriod":300,"Resolution":"558180C0","SetOption":' +
                                '["00008009","2805C80001000600003C5A0A192800000000","00000080","00006000","00004000","00000000"]},"StatusMEM":{"ProgramSize":2017,"Free":862,"Heap":148,"StackLowMark":' +
                                '3,"PsrMax":2048,"PsrFree":2025,"ProgramFlashSize":4096,"FlashSize":4096,"FlashChipId":"16405E","FlashFrequency":40,"FlashMode":"DIO","Features":["0809",' +
                                '"9F9AD7DF","0015A001","B7F7BFCF","05DA9BC4","E0360DC7","480840D2","20200000","D4BC482D","810A80F1","00000014"],"Drivers":"1,2,!3,!4,!5,7,!8,9,10,11,12,!14,!16,' +
                                '!17,!20,!21,24,26,!27,29,!34,!35,38,50,52,!59,!60,62,!63,!66,!67,!68,!73,!75,82,!86,!87,!88,!121","Sensors":"1,2,3,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,' +
                                '21,22,26,31,34,37,39,40,42,43,45,51,52,55,56,58,59,64,66,67,74,85,92,95,98,103,105,109,127","I2CDriver":"7,8,9,10,11,12,13,14,15,17,18,20,24,29,31,36,41,42,44,46,48,58' +
                                ',62,65,69,76,77,82,89"},"StatusNET":{"Hostname":"ns-panel4-0112","IPAddress":"192.168.178.174","Gateway":"192.168.178.1","Subnetmask":"255.255.254.0","DNSServer1":' +
                                '"192.168.179.21","DNSServer2":"0.0.0.0","Mac":"A0:B7:A5:54:C0:71","IP6Global":"","IP6Local":"xxx","Ethernet":{"Hostname":"","IPAddress":"0.0.0.0","Gateway":"0.0.0.0",' +
                                '"Subnetmask":"0.0.0.0","DNSServer1":"192.168.179.21","DNSServer2":"0.0.0.0","Mac":"00:00:00:00:00:00","IP6Global":"","IP6Local":""},"Webserver":2,"HTTP_API":1,' +
                                '"WifiConfig":4,"WifiPower":16.0},"StatusMQT":{"MqttHost":"xxx","MqttPort":1883,"MqttClientMask":"ns_panel4","MqttClient":"ns_panel4","MqttUser":"xxx","MqttCount":1,' +
                                '"MAX_PACKET_SIZE":1200,"KEEPALIVE":30,"SOCKET_TIMEOUT":4},"StatusTIM":{"UTC":"2025-02-19T09:30:57Z","Local":"2025-02-19T10:30:57","StartDST":"2025-03-30T02:00:00",' +
                                '"EndDST":"2025-10-26T03:00:00","Timezone":"+01:00","Sunrise":"07:50","Sunset":"18:17"},"StatusSNS":{"Time":"2025-02-19T10:30:57","ANALOG":{"Temperature1":-3.2},"TempUnit"' +
                                ':"C"},"StatusSTS":{"Time":"2025-02-19T10:30:57","Uptime":"0T00:07:28","UptimeSec":448,"Heap":146,"SleepMode":"Dynamic","Sleep":50,"LoadAvg":19,"MqttCount":1,"Berry":' +
                                '{"HeapUsed":16,"Objects":212},"POWER1":"OFF","POWER2":"OFF","Wifi":{"AP":1,"SSId":"Keller","BSSId":"DC:15:C8:EB:3E:B8","Channel":7,"Mode":"HT40","RSSI":46,"Signal":-77,' +
                                '"LinkCount":1,"Downtime":"0T00:00:03"}}}',
                        );
                    }
                });
            }
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
            await this.subscribeStatesAsync('*');

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
            this.testSuccessful = false;
            this.log.error(`Error onReady: ${e}`);
        }
    }

    private onMqttConnect = async (): Promise<void> => {
        const _helper = async (tasmota: any): Promise<void> => {
            try {
                const state = this.library.readdb(`panels.${tasmota.id}.info.nspanel.firmwareUpdate`);
                if (state && typeof state.val === 'number' && state.val >= 100) {
                    this.log.debug(`Force an MQTT reconnect from the Nspanel with the ip ${tasmota.ip} in 10 seconds!`);
                    await this.fetch(
                        `http://${tasmota.ip}/cm?` +
                            `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                            `&cmnd=Backlog Restart 1`,
                    );
                } else {
                    this.log.info(`Update detected on the Nspanel with the ip ${tasmota.ip}!!`);
                }
            } catch (e: any) {
                this.log.warn(
                    `Error: This usually means that the NSpanel with ip ${tasmota.ip} is not online or has not been set up properly in the configuration! Error: ${e ? e.message : ''}`,
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
                    let names: string[] = [];
                    if (obj?.message?.panelTopic) {
                        if (this.controller?.panels) {
                            if (obj.message.panelTopic === ALL_PANELS_SPECIAL_ID) {
                                const temp: Set<string> = new Set();
                                this.controller.panels.forEach(a => {
                                    const b = a.navigation
                                        .getDatabase()
                                        .map(b => b?.page?.name)
                                        .filter(a => a != null);
                                    if (temp.size === 0) {
                                        for (const c of b) {
                                            if (c) {
                                                temp.add(c);
                                            }
                                        }
                                    } else {
                                        const lookup = new Set(b.filter(Boolean));

                                        const toRemove = [];
                                        for (const t of temp) {
                                            if (!lookup.has(t)) {
                                                toRemove.push(t);
                                            }
                                        }
                                        for (const r of toRemove) {
                                            temp.delete(r);
                                        }
                                    }
                                });

                                names = Array.from(temp);
                            } else {
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
                            if (this.config.testCase) {
                                this.testCaseConfig = [r.panelConfig];
                            } else {
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
                                    r.messages.push(`Invalid configuration!`);
                                }
                                /*} catch (e: any) {
                                        this.log.error(`Error in configuration: ${e.message}`);
                                    }*/
                                if (!reloaded) {
                                    const msg = `❌ Panel was not restarted due to configuration errors or missing panel instance. Please verify the panel topic and base configuration.`;
                                    this.log.info(msg);
                                    r.messages.push(msg);
                                }
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
                case 'setPopupNotification': {
                    if (this.controller && obj.message) {
                        await this.controller.setPopupNotification(obj.message);
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                    break;
                }

                case 'testCase': {
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { testSuccessful: this.testSuccessful }, obj.callback);
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
                                let r = await this.fetch(u.href);
                                if (!isTasmotaStatusNet(r)) {
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

                                if (!r || !r.StatusNET || !r.StatusNET.Mac) {
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
                                let mac = r.StatusNET.Mac;
                                const topic = obj.message.tasmotaTopic;
                                const appendix = r.StatusNET.Mac.replace(/:/g, '').slice(-6);
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
                                await this.fetch(u.href);
                                this.mqttClient && (await this.mqttClient.waitPanelConnectAsync(topic, 60_000));

                                u = new URL(
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                        `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                        `&cmnd=Backlog${encodeURIComponent(
                                            ` WebLog 2;SetOption111 1; template {"NAME":"${obj.message.tasmotaName}", "GPIO":[0,0,0,0,3872,0,0,0,0,0,32,0,0,0,0,225,0,480,224,1,0,0,0,33,0,0,0,0,0,0,0,0,0,0,4736,0],"FLAG":0,"BASE":1};` +
                                                ` Module 0;${this.config.timezone ? definition.getTasmotaTimeZone(this.config.timezone) : ''}: restart 1`,
                                        )}`,
                                );

                                await this.fetch(u.href);
                                this.mqttClient && (await this.mqttClient.waitPanelConnectAsync(topic, 60_000));

                                u = new URL(
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                        `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                        `&cmnd=status 0`,
                                );
                                r = await this.fetch(u.href);
                                if (!isTasmotaStatusNet(r)) {
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
                                if (!r || !r.StatusNET || !r.StatusNET.Mac) {
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
                                mac = r.StatusNET.Mac;
                                item.model = obj.message.model;
                                item.name = obj.message.tasmotaName;
                                item.topic = topic;
                                item.id = this.library.cleandp(mac);
                                item.ip = r.StatusNET.IPAddress;

                                if (index === -1) {
                                    panels.push(item);
                                }
                                let result: Record<string, string> | undefined = undefined;
                                try {
                                    const url =
                                        `http://${obj.message.tasmotaIP}/cm?` +
                                        `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                        `&cmnd=GetDriverVersion`;
                                    try {
                                        result = (await this.fetch(url, undefined, 3000)) as
                                            | Record<string, string>
                                            | undefined;
                                    } catch {
                                        //ignore
                                    }
                                    if (!result || result.nlui_driver_version !== '-1') {
                                        result = (await this.fetch(
                                            'https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json',
                                        )) as Record<string, string> | undefined;
                                        if (!result) {
                                            this.log.error('No version found!');
                                            if (obj.callback) {
                                                this.sendTo(
                                                    obj.from,
                                                    obj.command,
                                                    { error: 'sendToRequestFail1' },
                                                    obj.callback,
                                                );
                                            }
                                            break;
                                        }
                                        const version = obj.message.useBetaTFT
                                            ? result[`berry-beta`].split('_')[0]
                                            : result.berry.split('_')[0];
                                        const url =
                                            `http://${obj.message.tasmotaIP}/cm?` +
                                            `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                            `&cmnd=Backlog UfsRename autoexec.be,autoexec.old; UrlFetch https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/tasmota/berry/${version}/autoexec.be; Restart 1`;
                                        this.log.info(
                                            `Installing berry on tasmota with IP ${obj.message.tasmotaIP}, name ${obj.message.tasmotaName}.`,
                                        );
                                        this.log.debug(`URL: ${url}`);
                                        await this.fetch(url);
                                        this.mqttClient && (await this.mqttClient.waitPanelConnectAsync(topic, 20_000));
                                        await this.delay(7000);
                                    } else {
                                        this.log.info(
                                            `Emulator detected on tasmota with IP ${obj.message.tasmotaIP} and name ${obj.message.tasmotaName}, skipping berry install.`,
                                        );
                                    }
                                } catch (e: any) {
                                    this.log.error(`Error: while installing berry - ${e}`);
                                }
                                if (result?.nlui_driver_version !== '-1') {
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
                                                    { error: 'sendToRequestFail2' },
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
                                                { error: 'sendToRequestFail3' },
                                                obj.callback,
                                            );
                                        }
                                        throw e;
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
                                this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail4' }, obj.callback);
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
                                let result: Record<string, string> | undefined = undefined;

                                result = (await this.fetch(
                                    'https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json',
                                )) as Record<string, string> | undefined;
                                if (!result) {
                                    this.log.error('No version found!');
                                    if (obj.callback) {
                                        this.sendTo(
                                            obj.from,
                                            obj.command,
                                            { error: 'sendToRequestFail5' },
                                            obj.callback,
                                        );
                                    }
                                    break;
                                }
                                const version = obj.message.useBetaTFT
                                    ? result[`berry-beta`].split('_')[0]
                                    : result.berry.split('_')[0];
                                const url =
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                    `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                    `&cmnd=Backlog UfsDelete autoexec.old; UfsRename autoexec.be,autoexec.old; UrlFetch https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/tasmota/berry/${version}/autoexec.be; Restart 1`;

                                this.log.info(`Installing berry on tasmota with IP ${obj.message.tasmotaIP}`);
                                await this.fetch(url);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: any) {
                                this.log.error(`Error: while installing berry - ${e}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail6' }, obj.callback);
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
                                            { error: 'sendToRequestFail7' },
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
                                await this.fetch(url);

                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: any) {
                                this.log.error(`Error: ${e}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail8' }, obj.callback);
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
                                            { error: 'sendToRequestFail9' },
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
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail10' }, obj.callback);
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
                                await this.fetch(url);

                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: any) {
                                this.log.error(`Error: ${e}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail11' }, obj.callback);
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
                                await this.fetch(url);

                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: any) {
                                this.log.error(`Error: ${e}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail12' }, obj.callback);
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
                    const result = (await this.fetch(
                        'https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json',
                    )) as Record<string, string>;
                    if ('tasmota' in result) {
                        const cmnd = `OtaUrl http://ota.tasmota.com/tasmota32/release-${result.tasmota.trim()}/tasmota32-${language.toUpperCase()}.bin; Upgrade 1`;

                        if (this.controller?.panels) {
                            const index = this.controller.panels.findIndex(a => a.topic === obj.message.topic);
                            if (index !== -1) {
                                const panel = this.controller.panels[index];
                                panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, cmnd);
                            }
                        }
                    } else {
                        this.log.warn(`Error getting Tasmota version!`);
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
                case 'uploadIcs': {
                    if (obj.command === 'uploadIcs') {
                        try {
                            const { filename, content } = obj.message as { filename: string; content: string };

                            // Speicherpfad definieren (z.B. im Adapter-Verzeichnis)
                            const uploadDir = path.join(this.adapterDir, 'ics-files');
                            this.log.debug(`ICS-Datei Upload Verzeichnis: ${uploadDir}`);

                            // Verzeichnis erstellen falls nicht vorhanden
                            if (!fs.existsSync(uploadDir)) {
                                fs.mkdirSync(uploadDir, { recursive: true });
                            }

                            const filePath = path.join(uploadDir, filename);
                            this.log.debug(`ICS-Datei Pfad: ${filePath}`);
                            fs.writeFileSync(filePath, content, 'utf8');

                            this.log.info(`ICS-Datei gespeichert: ${filePath}`);

                            // Optional: ICS-Datei verarbeiten
                            //await this.processIcsFile(filePath);
                            const data = iCal.parseICS(content);

                            let entryCount = 0;

                            const eventNames = new Set<string>();
                            for (const k in data) {
                                if (data[k].type === 'VEVENT') {
                                    const eventName = data[k].summary;
                                    if (eventName && eventName.trim() !== '') {
                                        eventNames.add(eventName);
                                    }
                                }
                                entryCount++;
                                if (entryCount >= 6) {
                                    break;
                                }
                            }
                            const events = Array.from(eventNames).map(name => ({ summary: name }));
                            this.log.debug(
                                `ICS-Datei verarbeitet. Folgende Ereignisse gefunden: ${JSON.stringify(events)}`,
                            );

                            // Antwort senden
                            if (obj.callback) {
                                this.sendTo(
                                    obj.from,
                                    obj.command,
                                    { success: true, path: filePath, events: events },
                                    obj.callback,
                                );
                            }
                        } catch (error: any) {
                            this.log.error(`Fehler beim ICS-Upload: ${error}`);
                            if (obj.callback) {
                                this.sendTo(
                                    obj.from,
                                    obj.command,
                                    { success: false, error: error.message },
                                    obj.callback,
                                );
                            }
                        }
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
        result?: Record<string, string>,
    ): Promise<string | null> {
        if (!result) {
            result = (await this.fetch(
                'https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json',
            )) as Record<string, string> | undefined;
        }
        const data = result;
        if (!data) {
            this.log.error('No version data received.');
            return null;
        }
        data['tft-alpha'] = alpha;

        const modelSuffix = m ? `-${m}` : '';
        const alphaKey = alpha ? `tft${modelSuffix}-alpha` : '';
        const betaKey = beta ? `tft${modelSuffix}-beta` : '';
        const defaultKey = `tft${modelSuffix}`;

        let entry = alpha && data[alphaKey] ? data[alphaKey] : '';
        entry = !entry && beta && data[betaKey] ? data[betaKey] : entry;
        entry = !entry && data[defaultKey] ? data[defaultKey] : entry;

        if (!entry) {
            this.log.error(`No version entry for key "${defaultKey}".`);
            return null;
        }

        const version = String(entry).split('_')[0]; // z.B. "1.2.3" aus "1.2.3_filename"
        if (!version) {
            this.log.error(`Invalid version in entry for "${defaultKey}": ${entry}`);
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
