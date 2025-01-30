import { BaseClass } from '../classes/library';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';

export class ConfigManager extends BaseClass {
    //private test: ConfigManager.DeviceState;

    constructor(adapter: NspanelLovelaceUi) {
        super(adapter, 'config-manager');
    }
}
