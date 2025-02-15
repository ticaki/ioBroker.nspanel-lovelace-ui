/*
 * Created with @iobroker/create-adapter v2.5.0..
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import { Library } from './lib/classes/library';
import 'source-map-support/register';
// Load your modules here, e.g.:
// import * as fs from "fs";
import * as MQTT from './lib/classes/mqtt';
import { Testconfig } from './lib/config';
import { Controller } from './lib/controller/controller';
import { Icons } from './lib/const/icon_mapping';
import { genericStateObjects } from './lib/const/definition';
import { ConfigManager } from './lib/controller/config-manager';
import type { panelConfigPartial } from './lib/controller/panel';

class NspanelLovelaceUi extends utils.Adapter {
    library: Library;
    mqttClient: MQTT.MQTTClientClass | undefined;
    mqttServer: MQTT.MQTTServerClass | undefined;
    controller: Controller | undefined;
    unload: boolean = false;
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
     * Is called when databases are connected and adapter received configuration...
     */
    private async onReady(): Promise<void> {
        await this.extendForeignObjectAsync(this.namespace, {
            type: 'meta',
            common: { name: { en: 'Nspanel Instance', de: 'Nspanel Instanze' }, type: 'meta.folder' },
            native: {},
        });

        this.library = new Library(this);
        await this.delay(2000);
        if (!this.config.Testconfig2) {
            if (this.config.onlyStartFromSystemConfig) {
                this.log.warn('No configuration stopped!');
                return;
            }
            this.log.warn('No configuration use dev test config!');
            let testconfig = Testconfig;
            try {
                const path = './lib/config-custom.js';
                testconfig = (await import(path)).Testconfig;
            } catch {
                // nothing
            }
            this.config.Testconfig2 = testconfig;
        }
        if (
            !this.config.Testconfig2 ||
            !Array.isArray(this.config.Testconfig2) ||
            !this.config.Testconfig2[0] ||
            !this.config.Testconfig2[0].pages
        ) {
            this.log.warn('Adapter on hold, user restart needed!');
            return;
        }
        try {
            const obj = await this.getForeignObjectAsync(this.namespace);
            if (obj && obj.native && obj.native.scriptConfig) {
                const scriptConfig = obj.native.scriptConfig as Partial<panelConfigPartial>[];
                // übergangsweise adden wir hier die seiten die wir haben ins erste panel
                //this.config.Testconfig2 = { ...this.config.Testconfig2, ...obj.native.scriptConfig };
                let changed = false;
                for (let b = scriptConfig.length - 1; b >= 0; b--) {
                    const index = this.config.panels.findIndex(a => a.name === scriptConfig[b].name);
                    if (index !== -1) {
                        continue;
                    }
                    changed = true;
                    if (!scriptConfig[b].updated) {
                        scriptConfig.splice(b, 1);
                        continue;
                    }
                    scriptConfig[b].updated = false;
                    if (scriptConfig[b].name !== undefined && scriptConfig[b].topic !== undefined) {
                        this.config.panels.push({ name: scriptConfig[b].name!, topic: scriptConfig[b].topic! });
                    }
                }
                if (changed) {
                    await this.setForeignObjectAsync(this.namespace, obj);
                    const o = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
                    if (o) {
                        o.native.panels = this.config.panels;
                        await this.setForeignObjectAsync(`system.adapter.${this.namespace}`, o);
                    }
                }
                for (let b = 0; b < scriptConfig.length; b++) {
                    const a = scriptConfig[b];
                    if (!a || !a.pages) {
                        continue;
                    }
                    if (!this.config.Testconfig2[b]) {
                        this.config.Testconfig2[b] = {};
                    }
                    if (!this.config.Testconfig2[b].pages) {
                        this.config.Testconfig2[b].pages = [];
                    }
                    this.config.Testconfig2[b].pages = (this.config.Testconfig2[b] as panelConfigPartial).pages.filter(
                        a => {
                            if (scriptConfig[b].pages!.find(b => b.uniqueID === a.uniqueID)) {
                                return false;
                            }
                            return true;
                        },
                    );

                    a.pages = (this.config.Testconfig2[b].pages || []).concat(a.pages);
                    this.config.Testconfig2[b] = {
                        ...((this.config.Testconfig2[b] as panelConfigPartial) || {}),
                        ...a,
                    };
                }
                this.config.Testconfig2[0].pages![0] = this.config.Testconfig2[0].pages![0];
                this.config.Testconfig2[0].timeout = this.config.timeout;
            }
        } catch {
            this.log.warn('Invalid configuration stopped!');
            return;
        }

        if (
            this.config.doubleClickTime === undefined ||
            typeof this.config.doubleClickTime !== 'number' ||
            !(this.config.doubleClickTime > 0)
        ) {
            this.config.doubleClickTime = 400;
        }
        //this.log.debug(JSON.stringify(this.config.Testconfig2[0].dpInit))

        //this.config.Testconfig2[0].pages[1].dpInit = this.config.mediaid;
        this.setTimeout(async () => {
            //check config
            Icons.adapter = this;

            await this.library.init();
            const states = await this.getStatesAsync('*');
            await this.library.initStates(states);

            // set all .info.nspanel.isOnline to false
            for (const id in states) {
                if (id.endsWith('.info.isOnline')) {
                    await this.library.writedp(id, false, genericStateObjects.panel.panels.info.isOnline);
                }
            }
            this.log.debug('Check configuration!');
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
                (topic, message) => {
                    this.log.debug(`${topic} ${message}`);
                },
            );
            if (!this.mqttClient) {
                return;
            }
            const testconfig = structuredClone(this.config.Testconfig2);
            let counter = 0;
            for (const a of testconfig) {
                if (a && a.pages) {
                    const names: string[] = [];
                    for (const p of a.pages) {
                        counter++;
                        if (!('uniqueID' in p)) {
                            continue;
                        }
                        if (p.card === 'screensaver' || p.card === 'screensaver2' || p.card === 'screensaver3') {
                            p.uniqueID = `#${p.uniqueID}`;
                        }
                        if (names.indexOf(p.uniqueID) !== -1) {
                            throw new Error(`uniqueID ${p.uniqueID} is double!`);
                        }
                        names.push(p.uniqueID);
                    }
                }
            }
            if (counter === 0) {
                return;
            }
            //testconfig[0].name = this.config.name;
            //testconfig[0].topic = this.config.topic;
            const mem = process.memoryUsage().heapUsed / 1024;
            this.log.debug(String(`${mem}k`));
            this.controller = new Controller(this, {
                mqttClient: this.mqttClient,
                name: 'controller',
                panels: testconfig,
            });
            await this.controller.init();
            setInterval(() => {
                this.log.debug(
                    `${Math.trunc(mem)}k/${String(Math.trunc(process.memoryUsage().heapUsed / 1024))}k Start/Jetzt: `,
                );
            }, 60000);
        }, 2500);
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances.
     *
     * @param callback Callback so the adapter can finish what it has to do
     */
    private async onUnload(callback: () => void): Promise<void> {
        try {
            this.unload = true;
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);
            if (this.controller) {
                this.controller.delete;
            }
            callback();
        } catch {
            callback();
        }
    }
    //test
    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  */
    // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

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
            this.log.info(`state ${id} deleted`);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Somee message was sent to this instance over message box. Used by email, pushover, text2speech, ........
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  */
    private async onMessage(obj: ioBroker.Message): Promise<void> {
        if (typeof obj === 'object' && obj.message) {
            //this.log.info(JSON.stringify(obj));
            switch (obj.command) {
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
                    break;
                }
                case 'updateCustom': {
                    if (obj.message && obj.message.state) {
                        const state = await this.getForeignObjectAsync(obj.message.state);
                        if (state && state.common && state.common.custom && state.common.custom[this.namespace]) {
                            this.log.debug(`updateCustom ${JSON.stringify(state.common.custom[this.namespace])}`);
                        }
                    }
                    break;
                }
                case 'ScriptConfig': {
                    if (obj.message) {
                        const manager = new ConfigManager(this);
                        await manager.setScriptConfig(obj.message);
                    }
                    break;
                }
                default: {
                    // Send response in callback if required
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                }
            }
        }
    }

    async writeStateExternalAsync(dp: string, val: ioBroker.StateValue): Promise<void> {
        if (dp.startsWith(this.namespace)) {
            return;
        }
        await this.setForeignStateAsync(dp, val, false);
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new NspanelLovelaceUi(options);
} else {
    // otherwise start the instance directly
    (() => new NspanelLovelaceUi())();
}
