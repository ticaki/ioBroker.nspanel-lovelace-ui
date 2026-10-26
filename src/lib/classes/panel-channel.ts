import type { IClientPublishOptions } from 'mqtt';
import type { callbackMessageType } from './mqtt';

/**
 * Message channel between the adapter and one panel.
 *
 * A real NSPanel talks over MQTT (`MQTTClientClass`), a web panel over an in-process
 * channel (`VirtualPanelChannel`). Topics keep the Tasmota layout
 * (`<topic>/cmnd/…`, `<topic>/stat/…`, `<topic>/tele/…`) so the panel logic does not
 * care which transport is behind it.
 */
export interface PanelChannel {
    publish(topic: string, message: string, opt?: IClientPublishOptions): Promise<void>;
    subscribe(topic: string, callback: callbackMessageType): Promise<void>;
    unsubscribe(topic: string): void;
    removeByFunction(callback: callbackMessageType): void;
}
