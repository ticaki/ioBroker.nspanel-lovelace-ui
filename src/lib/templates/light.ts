//import * as Color from '../const/Color';
import { lightIcon } from '../const/forTemplates';
import { PageItemOptionsTemplate } from '../types/type-pageItem';

export const lightTemplates: PageItemOptionsTemplate[] = [
    {
        role: 'rgbSingle',
        type: 'light',
        template: 'light.shelly.rgbw2',
        adapter: '0_userdata.0',
        data: {
            icon: lightIcon,
            colorMode: { type: 'const', constVal: true },
            headline: { type: 'const', constVal: 'SHRGB2' },
            dimmer: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'level.brightness',
                    dp: '',
                },
            },
            White: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'level.color.white',
                    dp: '',
                },
                maxScale: {
                    type: 'const',
                    constVal: 254,
                },
                minScale: {
                    type: 'const',
                    constVal: 0,
                },
            },
            Red: {
                type: 'triggered',
                mode: 'auto',
                role: 'level.color.red',
                dp: '',
            },
            Blue: {
                type: 'triggered',
                mode: 'auto',
                role: 'level.color.blue',
                dp: '',
            },
            Green: {
                type: 'triggered',
                mode: 'auto',
                role: 'level.color.green',
                dp: '',
            },
            entity1: {
                // button
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'switch',
                    dp: '',
                },
                decimal: undefined,
                factor: undefined,
                unit: undefined,
            },
            entityInSel: {
                // button
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'state',
                    dp: '.lights.effect',
                },
                decimal: undefined,
                factor: undefined,
                unit: undefined,
            },
            text1: {
                true: {
                    type: 'const',
                    constVal: 'Colour brightness',
                },
                false: undefined,
            },
            text2: {
                true: {
                    type: 'const',
                    constVal: 'White brightness',
                },
                false: undefined,
            },
            text3: {
                true: {
                    type: 'const',
                    constVal: 'Color',
                },
                false: undefined,
            },
        },
    },
];
