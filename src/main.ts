/*
 * Created with @iobroker/create-adapter v2.5.0
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
import { Controller } from './lib/controller/panel-controller';
import { Icons } from './lib/const/icon_mapping';
import { ScreenSaverConst } from './lib/const/definition';

class NspanelLovelaceUi extends utils.Adapter {
    library: Library;
    mqttClient: MQTT.MQTTClientClass | undefined;
    mqttServer: MQTT.MQTTServerClass | undefined;
    controller: Controller | undefined;
    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({
            ...options,
            name: 'nspanel-lovelace-ui',
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
        Icons.adapter = this;
        this.library = new Library(this);
        this.setTimeout(() => {
            this.library.init();
            this.log.debug('Check configuration!');
            if (!(this.config.mqttIp && this.config.mqttPort && this.config.mqttUsername && this.config.mqttPassword))
                return;
            this.log.debug(this.adapterDir);
            this.mqttClient = new MQTT.MQTTClientClass(
                this,
                this.config.mqttIp,
                this.config.mqttPort,
                this.config.mqttUsername,
                this.config.mqttPassword,
                (topic, message) => {
                    this.log.debug(topic + ' ' + message);
                },
            );
            Testconfig.name = this.config.name;
            Testconfig.topic = this.config.topic;
            this.log.debug(String(process.memoryUsage().heapUsed));
            this.controller = new Controller(this, {
                mqttClient: this.mqttClient,
                name: 'controller',
                panels: [JSON.parse(JSON.stringify(Testconfig))],
            });
            setTimeout(() => {
                this.log.debug(String(process.memoryUsage().heapUsed)), 2000;
            });
        }, 3000);
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    private onUnload(callback: () => void): void {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            callback();
        } catch (e) {
            callback();
        }
    }

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
     */
    private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
        if (state) {
            if (this.controller) {
                this.controller.readOnlyDB.onStateChange(id, state);
            }
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  */
    private onMessage(obj: ioBroker.Message): void {
        if (typeof obj === 'object' && obj.message) {
            if (obj.command) {
                // e.g. send email or pushover or whatever
                this.log.info(JSON.stringify(obj));
                if (obj.command === 'scs-field') {
                    const result: { label: string; value: string }[] = [];
                    const data = ScreenSaverConst[obj.message.type as keyof typeof ScreenSaverConst];
                    for (const key in data) {
                        const max = data[key as keyof typeof data].maxEntries;
                        for (let a = 0; a < max; a++) {
                            result.push({ label: `${a + 1} ${key}`, value: `${a + 1}#${key}` });
                        }
                    }
                    if (obj.callback) this.sendTo(obj.from, obj.command, result, obj.callback);
                    return;
                } else if (obj.command === 'reload') {
                    const result: any = {};
                    const keyToValue:
                        | 'value'
                        | 'decimal'
                        | 'factor'
                        | 'unit'
                        | 'date'
                        | 'iconon'
                        | 'icononcolor'
                        | 'iconoff'
                        | 'iconoffcolor'
                        | 'iconscale'
                        | 'texton'
                        | 'textoff' = obj.message.field as typeof keyToValue;
                    this.log.debug(keyToValue);
                    result.currentfield = obj.message.entry + '#' + obj.message.field;
                    const fields: Partial<{
                        entity_value_read: string;
                        entity_value_forcetyp: string;
                        entity_value_dp: string;
                        entity_value_constVal: string;
                        entity_value_type: string;
                    }> = {};
                    const v1 = Testconfig.screenSaverConfig!.entitysConfig;
                    const key = obj.message.entry.split('#')[1] as keyof typeof v1;
                    const v2 = v1[key];
                    const index = obj.message.entry.split('#')[0] - 1;
                    const v3 = v2[index];
                    if (v3 !== undefined) {
                        let v4 = v3.entityValue.value;
                        switch (keyToValue) {
                            case 'value': {
                                v4 = v3.entityValue.value;
                                break;
                            }
                            case 'decimal': {
                                v4 = v3.entityValue.decimal;
                                break;
                            }
                            case 'factor': {
                                v4 = v3.entityValue.factor;
                                break;
                            }
                            case 'unit': {
                                v4 = v3.entityValue.unit;
                                break;
                            }
                            case 'date': {
                                v4 = v3.entityDateFormat;
                                break;
                            }
                            case 'iconon': {
                                v4 = v3.entityIcon.true.value;
                                break;
                            }
                            case 'icononcolor': {
                                v4 = v3.entityIcon.true.color;
                                break;
                            }
                            case 'iconoff': {
                                v4 = v3.entityIcon.false.value;
                                break;
                            }
                            case 'iconoffcolor': {
                                v4 = v3.entityIcon.true.color;
                                break;
                            }
                            case 'iconscale': {
                                v4 = v3.entityIcon.scale;
                                break;
                            }
                            case 'texton': {
                                v4 = v3.entityText.true;
                                break;
                            }
                            case 'textoff': {
                                v4 = v3.entityText.false;
                                break;
                            }
                            default:
                                result.currentfield = '';
                        }
                        if (v4) {
                            switch (v4.type) {
                                case 'const': {
                                    fields.entity_value_type = v4.type;
                                    fields.entity_value_constVal = String(v4.constVal ?? '');
                                    fields.entity_value_forcetyp = v4.forceType ?? '';
                                    break;
                                }
                                case 'triggered':
                                case 'state': {
                                    fields.entity_value_type = v4.type;
                                    fields.entity_value_dp = String(v4.dp ?? '');
                                    fields.entity_value_forcetyp = String(v4.forceType ?? '');
                                    fields.entity_value_read = String(v4.read ?? '');
                                    break;
                                }
                                case 'internal': {
                                    break;
                                }
                            }
                        }
                        this.log.debug(JSON.stringify({ native: Object.assign(result, fields) }));
                        if (obj.callback)
                            this.sendTo(obj.from, obj.command, { native: Object.assign(result, fields) }, obj.callback);
                        return;
                    }
                }

                // Send response in callback if required
                if (obj.callback) this.sendTo(obj.from, obj.command, [], obj.callback);
            }
        }
    }

    async writeStateExternalAsync(dp: string, val: ioBroker.StateValue): Promise<void> {
        if (dp.startsWith(this.namespace)) return;
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
