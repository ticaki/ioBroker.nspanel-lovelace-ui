import * as utils from '@iobroker/adapter-core';
import type { Library } from '../controller/library';
import type { Controller } from '../controller/controller';
import type { MQTTClientClass, MQTTServerClass } from '../classes/mqtt';
import type { NSPanel } from './NSPanel';

declare class NspanelLovelaceUi extends utils.Adapter {
    library: Library;
    mqttClient: MQTTClientClass | undefined;
    mqttServer: MQTTServerClass | undefined;
    controller: Controller | undefined;
    unload: boolean;
    testSuccessful: boolean;
    async fetch(url: string, init?: RequestInit, timeout = 30_000): Promise<unknown>;
    async getVersionsJson(): Promise<Record<string, string> | undefined>;
    async convertAdminPageItemToPageItemConfig(
        preItem: any,
        prePage: any,
        messages: string[],
    ): Promise<{
        pageItem: NSPanel.PageItemDataItemsOptions | undefined;
        messages: string[];
        error: string | undefined;
    }>;
}
