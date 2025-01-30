/* eslint-disable @typescript-eslint/no-unused-vars */

declare namespace ConfigManager {
    interface DeviceState {
        /**
         * The Type of the device like shutter, light, etc.
         */
        device: string;

        /**
         * States connected to the device.
         */
        configStates: ConfigState[];
    }

    interface ConfigState {
        /**
         * Datapoint id.
         */
        id: string;

        /**
         * The role this id has in the device.
         */
        role: string;

        /**
         * function() function to transform the value.
         */
        read?: string;

        /**
         * The type of the value. This is used to determine how the value should be displayed in the UI.
         */
        type?: string;
    }

    interface CustomTemplate {
        /**
         * The name of the template.
         */
        device: string;

        /**
         * the states to use in the template.
         */
        states: Partial<Record<ioBrokerRoles, true | null>>[];
    }
    type ioBrokerRoles =
        | 'button.open.blind'
        | 'button.close.blind'
        | 'button.open.tilt'
        | 'button.close.tilt'
        | 'button.stop.tilt'
        | 'button.stop.blind'
        | 'level.blind'
        | 'sensor.window'
        | 'value.battery'
        | 'value.temperature'
        | 'value.humidity';
}
