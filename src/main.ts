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

export class NspanelLovelaceUi extends utils.Adapter {
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
        this.setTimeout(() => {
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
                panels: [Testconfig],
            });
            setTimeout(() => {
                this.log.debug(String(process.memoryUsage().heapUsed)), 2000;
            });
        }, 1000);
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
            if (obj.command === 'send') {
                // e.g. send email or pushover or whatever
                this.log.info('send command');

                // Send response in callback if required
                if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
            }
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new NspanelLovelaceUi(options);
} else {
    // otherwise start the instance directly
    (() => new NspanelLovelaceUi())();
}
