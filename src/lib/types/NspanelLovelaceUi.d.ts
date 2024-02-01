import * as utils from '@iobroker/adapter-core';
import { Library } from '../classes/library';
import { Controller } from '../controller/panel-controller';
import { MQTTClientClass, MQTTServerClass } from '../classes/mqtt';

declare class NspanelLovelaceUi extends utils.Adapter {
    library: Library;
    mqttClient: MQTTClientClass | undefined;
    mqttServer: MQTTServerClass | undefined;
    controller: Controller | undefined;
}
