'use strict';

const mqtt = require('mqtt');
const { PayloadLog } = require('./payload-log');

/**
 * A virtual NSPanel: Tasmota + Berry driver + Nextion display, reduced to what the adapter talks to over MQTT.
 *
 * - `<topic>/cmnd/CustomSend` (display payloads) is recorded and acknowledged like the real driver:
 *   `stat/RESULT {"CustomSend":"Done"}` for every payload, a `pageType~…` additionally with
 *   `event,renderCurrentPage` (old ack mode without crc, TFT < 6.1.0).
 * - `pageType~pageStartup` is answered with `event,startup,<hmi>,<model>,<tft>` (like the startup page of the HMI).
 * - Tasmota commands `STATUS0`, `POWER1/2`, `GetDriverVersion` get plausible answers, everything else is ignored.
 * - The display timeout (`timeout~<s>`) is NOT simulated by default - tests send `sleepReached` themselves, so
 *   no screensaver jumps in while a test navigates. `autoSleep = true` switches the simulation on.
 */
class VirtualNSPanel extends PayloadLog {
    /**
     * @param {object} opt options
     * @param {number} opt.port MQTT port of the adapter's broker (TLS)
     * @param {string} opt.username MQTT user
     * @param {string} opt.password MQTT password
     * @param {string} opt.topic panel topic, e.g. `e2e/nspanel`
     * @param {string} opt.mac MAC address, its cleaned form is the panel id of the admin table
     * @param {string} [opt.model] panel model
     * @param {string} [opt.tftVersion] TFT version reported in the startup event
     * @param {string} [opt.driverVersion] berry driver generation (`nlui_driver_version`)
     */
    constructor(opt) {
        super(`nspanel ${opt.topic}`);
        this.opt = { model: 'eu', tftVersion: '6.0.5', driverVersion: '11', ...opt };
        this.topic = opt.topic;
        /** @type {mqtt.MqttClient | undefined} */
        this.client = undefined;
        /** answer `pageType~pageStartup` with the startup event */
        this.autoStartup = true;
        /** simulate the display timeout (`timeout~<s>` → `event,sleepReached,<card>`) */
        this.autoSleep = false;
        /** current card on the display (last pageType) */
        this.currentCard = '';
        /** last value of `timeout~<s>` */
        this.timeoutSec = undefined;
        this.sleepTimer = undefined;
        /** @type {{ topic: string, payload: string }[]} Tasmota commands (everything but CustomSend) */
        this.tasmotaCommands = [];
        this.relays = { POWER1: 'OFF', POWER2: 'OFF' };
    }

    async connect() {
        this.client = await mqtt.connectAsync(`mqtts://127.0.0.1:${this.opt.port}`, {
            username: this.opt.username,
            password: this.opt.password,
            clientId: `e2e_${this.topic.replace(/\W/g, '_')}_${process.pid}`,
            rejectUnauthorized: false,
            reconnectPeriod: 0,
        });
        this.client.on('message', (topic, message) => {
            this.onMessage(topic, message.toString()).catch(e => {
                console.error(`virtual nspanel: ${String(e)}`);
            });
        });
        await this.client.subscribeAsync(`${this.topic}/cmnd/#`);
        // Tasmota publishes its LWT when it connects
        await this.publish('tele/LWT', 'Online');
    }

    async close() {
        this.stopSleepTimer();
        if (this.client) {
            const c = this.client;
            this.client = undefined;
            await c.endAsync(true);
        }
    }

    /**
     * @param {string} sub topic below the panel topic, e.g. `tele/RESULT`
     * @param {string} payload payload
     */
    async publish(sub, payload) {
        if (!this.client) {
            throw new Error('virtual nspanel is not connected');
        }
        await this.client.publishAsync(`${this.topic}/${sub}`, payload);
    }

    /**
     * Sends an event of the display (`tele/RESULT {"CustomRecv": "<event>"}`).
     *
     * @param {string} event e.g. `event,buttonPress2,bSubNext,button`
     */
    async send(event) {
        // a touch restarts the display timeout like on the real HMI
        this.restartSleepTimer();
        await this.publish('tele/RESULT', JSON.stringify({ CustomRecv: event }));
    }

    async sendStartup() {
        await this.send(`event,startup,55,${this.opt.model},${this.opt.tftVersion}`);
    }

    /**
     * @param {string} topic MQTT topic
     * @param {string} payload payload
     */
    async onMessage(topic, payload) {
        const cmd = topic.slice(`${this.topic}/cmnd/`.length);
        if (cmd === 'CustomSend') {
            await this.onCustomSend(payload);
            return;
        }
        this.tasmotaCommands.push({ topic: cmd, payload });
        switch (cmd.toUpperCase()) {
            case 'STATUS0':
                await this.publish('stat/STATUS0', JSON.stringify(this.status0()));
                break;
            case 'POWER1':
            case 'POWER2': {
                const key = cmd.toUpperCase();
                if (payload === 'ON' || payload === 'OFF') {
                    this.relays[key] = payload;
                }
                await this.publish(`stat/${key}`, this.relays[key]);
                break;
            }
            case 'GETDRIVERVERSION':
                await this.publish('stat/RESULT', JSON.stringify({ nlui_driver_version: this.opt.driverVersion }));
                break;
            default:
                // Rule3, Buzzer, STATUS 10, ... - nothing the tests need
                break;
        }
    }

    /**
     * @param {string} payload CustomSend payload
     */
    async onCustomSend(payload) {
        this.record(payload);
        await this.publish('stat/RESULT', JSON.stringify({ CustomSend: 'Done' }));
        if (payload.startsWith('pageType~')) {
            const card = payload.split('~')[1];
            this.currentCard = card;
            if (card === 'pageStartup') {
                this.stopSleepTimer();
                if (this.autoStartup) {
                    await this.sendStartup();
                }
                return;
            }
            await this.publish('tele/RESULT', JSON.stringify({ CustomRecv: 'event,renderCurrentPage' }));
            this.restartSleepTimer();
        } else if (payload.startsWith('timeout~')) {
            this.timeoutSec = Number(payload.split('~')[1]);
            this.restartSleepTimer();
        }
    }

    restartSleepTimer() {
        this.stopSleepTimer();
        if (!this.autoSleep || !this.timeoutSec || this.currentCard.startsWith('screensaver')) {
            return;
        }
        this.sleepTimer = setTimeout(() => {
            this.sleepTimer = undefined;
            if (this.client) {
                void this.publish(
                    'tele/RESULT',
                    JSON.stringify({ CustomRecv: `event,sleepReached,${this.currentCard}` }),
                ).catch(() => undefined);
            }
        }, this.timeoutSec * 1000);
    }

    stopSleepTimer() {
        if (this.sleepTimer) {
            clearTimeout(this.sleepTimer);
            this.sleepTimer = undefined;
        }
    }

    /** @returns {object} a plausible `STATUS0` answer of Tasmota */
    status0() {
        const mac = this.opt.mac;
        return {
            Status: { Module: 0, DeviceName: 'NSPanel E2E', FriendlyName: ['Tasmota', ''], Topic: this.topic },
            StatusPRM: { Uptime: '0T00:01:00', RestartReason: 'Software/System restart' },
            StatusFWR: { Version: '14.4.1(release-nspanel)', Hardware: 'ESP32-D0WD-V3 v3.1' },
            StatusLOG: { SerialLog: 2, WebLog: 2, MqttLog: 0 },
            StatusMEM: { ProgramSize: 2017, Free: 862, Heap: 148 },
            StatusNET: {
                Hostname: 'nspanel-e2e',
                IPAddress: '127.0.0.1',
                Gateway: '127.0.0.1',
                Subnetmask: '255.0.0.0',
                Mac: mac,
                Webserver: 2,
                WifiConfig: 4,
            },
            StatusMQT: { MqttHost: '127.0.0.1', MqttPort: this.opt.port, MqttClient: 'nspanel_e2e', MqttCount: 1 },
            StatusTIM: { UTC: new Date().toISOString(), Timezone: '+01:00', Sunrise: '07:50', Sunset: '18:17' },
            StatusSNS: { Time: new Date().toISOString(), ANALOG: { Temperature1: 21.5 }, TempUnit: 'C' },
            StatusSTS: {
                Time: new Date().toISOString(),
                Uptime: '0T00:01:00',
                UptimeSec: 60,
                Heap: 146,
                POWER1: this.relays.POWER1,
                POWER2: this.relays.POWER2,
                Wifi: { AP: 1, SSId: 'e2e', RSSI: 80, Signal: -60, LinkCount: 1, Downtime: '0T00:00:00' },
            },
        };
    }
}

module.exports = { VirtualNSPanel };
