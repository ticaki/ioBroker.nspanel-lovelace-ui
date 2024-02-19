import { PageItemOptionsTemplate } from '../types/type-pageItem';
import * as Color from '../const/Color';

export const textTemplates: PageItemOptionsTemplate[] = [
    {
        template: 'text.window.isOpen',
        role: 'text',
        adapter: '',
        type: 'text',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'window-open-variant' },
                    color: { type: 'const', constVal: Color.Cyan },
                },
                false: {
                    value: { type: 'const', constVal: 'window-closed-variant' },
                    color: { type: 'const', constVal: Color.Green },
                },
                scale: undefined,
                maxBri: undefined,
                minBri: undefined,
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'sensor.window',
                    dp: '',
                },
                decimal: undefined,
                factor: undefined,
                unit: undefined,
            },
            text: {
                true: { type: 'const', constVal: 'text' },
                false: undefined,
            },
            text1: {
                true: { type: 'const', constVal: 'open' },
                false: { type: 'const', constVal: 'close' },
            },
        },
    },
    {
        template: 'text.window.isClose',
        role: 'text',
        adapter: '',
        type: 'text',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'window-open-variant' },
                    color: { type: 'const', constVal: Color.Cyan },
                },
                false: {
                    value: { type: 'const', constVal: 'window-closed-variant' },
                    color: { type: 'const', constVal: Color.Green },
                },
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'sensor.window',
                    dp: '',
                    read: 'return !val',
                },
            },
            text: {
                true: { type: 'const', constVal: 'text' },
                false: undefined,
            },
            text1: {
                true: { type: 'const', constVal: 'open' },
                false: { type: 'const', constVal: 'close' },
            },
        },
    },
    {
        template: 'text.temperature',
        role: 'text',
        adapter: '',
        type: 'text',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'temperature-celsius' },
                    text: {
                        type: 'triggered',
                        mode: 'auto',
                        role: 'value.temperature',
                        dp: '',
                        read: 'return Math.round(val*10)/10',
                    },
                    color: { type: 'const', constVal: Color.Red },
                },
                false: {
                    value: { type: 'const', constVal: 'temperature-celsius' },
                    color: { type: 'const', constVal: Color.Blue },
                },
                scale: { type: 'const', constVal: { min: 0, max: 30 } },
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'value.temperature',
                    dp: '',
                },
            },
            text: {
                true: { type: 'const', constVal: 'Temperature' },
                false: undefined,
            },
            text1: {
                true: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'value.temperature',
                    dp: '',
                    read: 'return Math.round(parseFloat(val)*10)/10',
                },
                false: undefined,
            },
        },
    },
    {
        template: 'text.battery',
        role: 'text',
        adapter: '',
        type: 'text',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'battery' },
                    text: {
                        type: 'triggered',
                        mode: 'auto',
                        role: 'value.battery',
                        dp: '',
                    },
                    color: { type: 'const', constVal: Color.Green },
                },
                false: {
                    value: { type: 'const', constVal: 'battery-outline' },
                    color: { type: 'const', constVal: Color.Red },
                },
                scale: { type: 'const', constVal: { min: 0, max: 100 } },
            },
            entity1: {
                value: {
                    type: 'state',
                    mode: 'auto',
                    role: 'value.battery',
                    dp: '',
                },
            },
            text: {
                true: { type: 'const', constVal: 'Battery' },
                false: undefined,
            },
            entity2: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'value.battery',
                    dp: '',
                },
                unit: { type: 'const', constVal: '%' },
            },
        },
    },
];
