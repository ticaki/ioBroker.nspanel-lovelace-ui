import type { IClientPublishOptions } from 'mqtt';
import type { callbackMessageType } from '../classes/mqtt';
import type { PanelChannel } from '../classes/panel-channel';
import { BaseClass, type AdapterClassDefinition } from '../controller/library';

/** Listener for CustomSend payloads and buzzer commands going to the browser */
export type VirtualChannelListener = (payload: string) => void;

/**
 * Does the MQTT topic filter match the topic? Supports `+` (one level) and `#` (rest).
 *
 * @param filter topic filter
 * @param topic concrete topic
 * @returns true if the topic matches the filter
 */
export function mqttTopicMatches(filter: string, topic: string): boolean {
    const f = filter.split('/');
    const t = topic.split('/');
    for (let i = 0; i < f.length; i++) {
        if (f[i] === '#') {
            return true;
        }
        if (i >= t.length) {
            return false;
        }
        if (f[i] !== '+' && f[i] !== t[i]) {
            return false;
        }
    }
    return f.length === t.length;
}

/**
 * In-process `PanelChannel` for exactly one web panel.
 *
 * The panel publishes to `<topic>/cmnd/…` as it does with Tasmota. CustomSend payloads and
 * buzzer commands are handed to the listeners (the WebSocket session), everything else is
 * dropped. The browser's answers come back through `injectReceive` (`tele/RESULT`) and
 * `injectAck` (`stat/RESULT`, the `Done` Tasmota sends for every CustomSend).
 */
export class VirtualPanelChannel extends BaseClass implements PanelChannel {
    readonly topic: string;
    private subscriptions: { filter: string; callback: callbackMessageType }[] = [];
    private commandListeners: VirtualChannelListener[] = [];
    private buzzerListeners: VirtualChannelListener[] = [];

    constructor(adapter: AdapterClassDefinition, topic: string, name: string = '') {
        super(adapter, name || `VirtualChannel-${topic}`);
        this.topic = topic;
    }

    onCommand(listener: VirtualChannelListener): void {
        if (!this.commandListeners.includes(listener)) {
            this.commandListeners.push(listener);
        }
    }

    onBuzzer(listener: VirtualChannelListener): void {
        if (!this.buzzerListeners.includes(listener)) {
            this.buzzerListeners.push(listener);
        }
    }

    offCommand(listener: VirtualChannelListener): void {
        this.commandListeners = this.commandListeners.filter(l => l !== listener);
    }

    offBuzzer(listener: VirtualChannelListener): void {
        this.buzzerListeners = this.buzzerListeners.filter(l => l !== listener);
    }

    async publish(topic: string, message: string, _opt?: IClientPublishOptions): Promise<void> {
        if (this.unload) {
            return;
        }
        const command = this.commandOf(topic);
        switch (command) {
            case 'CustomSend': {
                for (const l of this.commandListeners) {
                    l(message);
                }
                break;
            }
            case 'Buzzer': {
                for (const l of this.buzzerListeners) {
                    l(message);
                }
                break;
            }
            default: {
                if (this.adapter.config.debugLogMqtt) {
                    this.log.debug(`Dropped ${topic} (${message}) - not supported by web panels`);
                }
            }
        }
        return Promise.resolve();
    }

    subscribe(filter: string, callback: callbackMessageType): Promise<void> {
        if (!this.subscriptions.some(s => s.filter === filter && s.callback === callback)) {
            this.subscriptions.push({ filter, callback });
        }
        return Promise.resolve();
    }

    unsubscribe(filter: string): void {
        const index = this.subscriptions.findIndex(s => s.filter === filter);
        if (index !== -1) {
            this.subscriptions.splice(index, 1);
        }
    }

    removeByFunction(callback: callbackMessageType): void {
        this.subscriptions = this.subscriptions.filter(s => s.callback !== callback);
    }

    /**
     * Deliver an event of the browser as `<topic>/tele/RESULT` `{"CustomRecv": payload}`.
     *
     * @param payload the event string, e.g. `event,buttonPress2,…`
     */
    async injectReceive(payload: string): Promise<void> {
        await this.deliver(`${this.topic}/tele/RESULT`, JSON.stringify({ CustomRecv: payload }));
    }

    /**
     * Deliver the acknowledgement Tasmota would send for a CustomSend: `<topic>/stat/RESULT`
     * `{"CustomSend":"Done"}`.
     */
    async injectAck(): Promise<void> {
        await this.deliver(`${this.topic}/stat/RESULT`, JSON.stringify({ CustomSend: 'Done' }));
    }

    async delete(): Promise<void> {
        await super.delete();
        this.subscriptions = [];
        this.commandListeners = [];
        this.buzzerListeners = [];
    }

    private commandOf(topic: string): string | undefined {
        const prefix = `${this.topic}/cmnd/`;
        return topic.startsWith(prefix) ? topic.slice(prefix.length) : undefined;
    }

    private async deliver(topic: string, message: string): Promise<void> {
        if (this.unload) {
            return;
        }
        // a handler may remove itself (one-shot) - iterate over a copy
        for (const s of [...this.subscriptions]) {
            if (!mqttTopicMatches(s.filter, topic)) {
                continue;
            }
            try {
                const remove = await s.callback(topic, message);
                if (remove === true) {
                    this.subscriptions = this.subscriptions.filter(x => x !== s);
                }
            } catch (e) {
                this.log.error(`Handler for ${topic} failed: ${String(e)}`);
            }
        }
    }
}
