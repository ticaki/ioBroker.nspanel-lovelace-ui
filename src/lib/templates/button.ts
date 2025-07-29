import { Color } from '../const/Color';
import type { TemplateItems } from '../types/types';

export const buttonTemplates: TemplateItems = {
    'button.iconLeftSize': {
        role: 'text.list',
        type: 'button',
        adapter: '',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'size-m' },
                    color: { type: 'const', constVal: Color.Yellow },
                },
                false: {
                    value: undefined,
                    color: { type: 'const', constVal: Color.Green },
                },
            },
            entity1: {
                value: {
                    type: 'internal',
                    dp: 'cmd/bigIconLeft',
                },
            },
            text: {
                true: { type: 'const', constVal: 'IconLeft' },
                false: undefined,
            },
            text1: {
                true: { type: 'const', constVal: 'big' },
                false: { type: 'const', constVal: 'medium' },
            },
            setValue1: {
                type: 'internal',
                dp: 'cmd/bigIconLeft',
            },
            /*popup: {
                isActive: {
                    type: 'const',
                    constVal: true,
                },
                getMessage: {
                    type: 'const',
                    constVal: 'test with screensaver options',
                },
                setMessage: {
                    type: 'internal',
                    dp: 'info/PopupInfo',
                },
            },*/
        },
    },
    'button.iconRightSize': {
        role: 'text.list',
        type: 'button',
        adapter: '',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'size-m' },
                    color: { type: 'const', constVal: Color.Yellow },
                },
                false: {
                    value: undefined,
                    color: { type: 'const', constVal: Color.Green },
                },
            },
            entity1: {
                value: {
                    type: 'internal',
                    dp: 'cmd/bigIconRight',
                },
            },
            text: {
                true: { type: 'const', constVal: 'IconRight' },
                false: undefined,
            },
            text1: {
                true: { type: 'const', constVal: 'big' },
                false: { type: 'const', constVal: 'medium' },
            },
            setValue1: {
                type: 'internal',
                dp: 'cmd/bigIconRight',
            },
        },
    },
    'button.esphome.powerplug': {
        role: '',
        type: 'button',
        adapter: 'esphome',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'power-plug' },
                    color: { type: 'const', constVal: Color.On },
                },
                false: {
                    value: { type: 'const', constVal: 'power-plug-off-outline' },
                    color: { type: 'const', constVal: Color.Off },
                },
            },
            entity1: {
                value: {
                    mode: 'auto',
                    type: 'triggered',
                    role: '',
                    dp: '',
                    regexp: /esphome\.[0-9]+\..+?\.Switch\..+?\.state/,
                },
            },
            text: {
                true: { type: 'const', constVal: 'Plug' },
                false: undefined,
            },
            text1: {
                true: { type: 'const', constVal: 'on' },
                false: { type: 'const', constVal: 'off' },
            },
            setValue1: {
                mode: 'auto',
                type: 'state',
                role: '',
                dp: '',
                regexp: /esphome\.[0-9]+\..+?\.Switch\..+?\.state/,
            },
        },
    },
    'button.service.adapter.noconnection': {
        role: '',
        type: 'button',
        adapter: '',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'checkbox-intermediate' },
                    color: { type: 'const', constVal: Color.bad },
                    text: { value: { type: 'internal', dp: '///AdapterNoConnection' } },
                },

                false: {
                    value: { type: 'const', constVal: 'checkbox-marked-outline' },
                    color: { type: 'const', constVal: Color.good },
                    text: { value: { type: 'internal', dp: '///AdapterNoConnection' } },
                },
            },
            entity1: {
                value: { type: 'internal', dp: '///AdapterNoConnectionBoolean' },
            },
            text: {
                true: { type: 'const', constVal: 'Not connected' },
                false: { type: 'const', constVal: 'all connected' },
            },
            text1: { true: { type: 'internal', dp: '///AdapterNoConnection' }, false: undefined },
        },
    },

    'button.service.adapter.stopped': {
        role: '',
        type: 'button',
        adapter: '',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'checkbox-intermediate' },
                    color: { type: 'const', constVal: Color.bad },
                    text: { value: { type: 'internal', dp: '///AdapterStopped' } },
                },

                false: {
                    value: { type: 'const', constVal: 'checkbox-marked-outline' },
                    color: { type: 'const', constVal: Color.good },
                    text: { value: { type: 'internal', dp: '///AdapterStopped' } },
                },
            },
            entity1: {
                value: { type: 'internal', dp: '///AdapterStoppedBoolean' },
            },
            text: {
                true: { type: 'const', constVal: 'Stopped' },
                false: undefined,
            },
            text1: { true: { type: 'internal', dp: '///AdapterStopped' }, false: undefined },
        },
    },
    'button.temperature': {
        role: '',
        adapter: '',
        type: 'button',

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
                scale: {
                    type: 'const',
                    constVal: { val_min: 40, val_max: -10, val_best: 25, mode: 'quadriGradAnchor' },
                },
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
    'button.humidity': {
        role: '',
        adapter: '',
        type: 'button',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'water-percent' },
                    text: {
                        value: {
                            type: 'triggered',
                            mode: 'auto',
                            role: 'value.humidity',
                            dp: '',
                            read: 'return Math.round(val)',
                        },
                        unit: { type: 'const', constVal: '%' },
                    },
                    color: { type: 'const', constVal: Color.Red },
                },
                false: {
                    value: { type: 'const', constVal: 'water-percent' },
                    color: { type: 'const', constVal: Color.Blue },
                },
                scale: { type: 'const', constVal: { min: 0, max: 100 } },
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'value.humidity',
                    dp: '',
                },
                unit: { type: 'const', constVal: '%' },
            },
            text: {
                true: { type: 'const', constVal: 'Humidity' },
                false: undefined,
            },
            text1: {
                true: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'value.humidity',
                    dp: '',
                    read: 'return Math.round(parseFloat(val))',
                },
                false: undefined,
            },
        },
    },
    'button.volume': {
        role: '',
        adapter: '',
        type: 'button',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'volume-mute' },
                    text: {
                        value: {
                            type: 'triggered',
                            mode: 'auto',
                            role: 'value.volume',
                            dp: '',
                        },
                        unit: { type: 'const', constVal: '%' },
                    },
                    color: { type: 'const', constVal: Color.Red },
                },
                false: {
                    value: {
                        type: 'triggered',
                        mode: 'auto',
                        role: 'value.volume',
                        dp: '',
                        read: `{
                            if (val > 66) {
                                return 'volume-high';
                            }
                            if (val > 33) {
                                return 'volume-medium';
                            }
                            if (val > 0) {
                                return 'volume-low';
                            }
                            return 'volume-mute';
                        }`,
                    },
                    text: {
                        value: {
                            type: 'triggered',
                            mode: 'auto',
                            role: 'value.volume',
                            dp: '',
                        },
                        unit: { type: 'const', constVal: '%' },
                    },
                    color: { type: 'const', constVal: Color.Blue },
                },
                scale: { type: 'const', constVal: { min: 0, max: 100 } },
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'media.mute',
                    dp: '',
                },
            },
            text: {
                true: { type: 'const', constVal: 'volume' },
                false: undefined,
            },
            text1: {
                true: {
                    type: 'triggered',
                    mode: 'auto',
                    role: 'value.volume',
                    dp: '',
                    read: 'return Math.round(parseFloat(val))',
                },
                false: undefined,
            },
        },
    },
    'button.slider': {
        role: '',
        adapter: '',
        type: 'button',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'plus-minus-variant' },
                    text: {
                        value: {
                            type: 'triggered',
                            mode: 'auto',
                            role: ['value', 'level'],
                            dp: '',
                        },
                        unit: { type: 'const', constVal: '%' },
                    },
                    color: { type: 'const', constVal: Color.Red },
                },
                false: undefined,
                scale: { type: 'const', constVal: { min: 0, max: 100 } },
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: ['value', 'level'],
                    dp: '',
                },
            },
            text: {
                true: { type: 'const', constVal: 'volume' },
                false: undefined,
            },
            text1: {
                true: {
                    type: 'triggered',
                    mode: 'auto',
                    role: ['value', 'level'],
                    dp: '',
                },
                false: undefined,
            },
        },
    },
    'button.select': {
        role: '',
        adapter: '',
        type: 'button',

        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'clipboard-list-outline' },
                    color: { type: 'const', constVal: Color.Green },
                },
                false: {
                    value: { type: 'const', constVal: 'clipboard-list' },
                    color: { type: 'const', constVal: Color.Red },
                },
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: ['value.mode.select'],
                    dp: '',
                },
                set: {
                    type: 'triggered',
                    mode: 'auto',
                    role: ['level.mode.select'],
                    dp: '',
                },
            },
            text: {
                true: { type: 'const', constVal: 'Select' },
                false: undefined,
            },
            text1: {
                //true:  { type: 'triggered', mode: 'auto', role: ['value.mode.select'], dp: '' },
                true: { type: 'const', constVal: 'press' },
                false: undefined,
            },
        },
    },
};
