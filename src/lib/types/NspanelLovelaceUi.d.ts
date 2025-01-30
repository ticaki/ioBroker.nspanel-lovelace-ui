import * as utils from '@iobroker/adapter-core';
import type { Library } from '../classes/library';
import type { Controller } from '../controller/controller';
import type { MQTTClientClass, MQTTServerClass } from '../classes/mqtt';

declare class NspanelLovelaceUi extends utils.Adapter {
    library: Library;
    mqttClient: MQTTClientClass | undefined;
    mqttServer: MQTTServerClass | undefined;
    controller: Controller | undefined;
    unload: boolean;
}
