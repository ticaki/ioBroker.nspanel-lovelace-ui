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
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'sensor.window',
                    dp: '',
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
                        value: {
                            type: 'triggered',
                            mode: 'auto',
                            role: 'value.temperature',
                            dp: '',
                            read: 'return Math.round(val*10)/10',
                        },
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
                    value: {
                        type: 'triggered',
                        mode: 'auto',
                        role: 'value.battery',
                        dp: '',
                        read: `const v = Math.round(val / 10);
                        switch (v) {
                            case 0:
                                return 'battery-outline';
                            case 1:
                            case 2:
                            case 3:
                            case 4:
                            case 5:
                            case 6:
                            case 7:
                            case 8:
                            case 9:
                                return 'battery-' + v + '0';
                            case 10:
                            default:
                                return 'battery';}`,
                    },
                    text: {
                        value: {
                            type: 'triggered',
                            mode: 'auto',
                            role: 'value.battery',
                            dp: '',
                        },
                        unit: {
                            type: 'const',
                            constVal: '%',
                        },
                    },
                    color: {
                        type: 'const',
                        constVal: Color.Green,
                    },
                },
                false: {
                    value: undefined,
                    color: {
                        type: 'const',
                        constVal: Color.Red,
                    },
                },
                scale: { type: 'const', constVal: { val_min: 10, val_max: 50, log10: 'max' } },
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
    {
        template: 'text.battery.low',
        role: 'text',
        adapter: '',
        type: 'text',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'battery-outline' },
                    color: { type: 'const', constVal: Color.Red },
                },
                false: {
                    value: { type: 'const', constVal: 'battery' },
                    color: { type: 'const', constVal: Color.Green },
                },
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'indicator.lowbat',
                    dp: '',
                },
            },
            text: {
                true: { type: 'const', constVal: 'Battery' },
                false: undefined,
            },
            text1: {
                true: { type: 'const', constVal: 'ok' },
                false: { type: 'const', constVal: 'low' },
            },
        },
    },
];
