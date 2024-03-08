import { Color } from '../const/Color';
import { PageItemOptionsTemplate } from '../types/type-pageItem';
import { TemplateIdent } from '../types/types';

export const buttonTemplates: Partial<Record<TemplateIdent, PageItemOptionsTemplate>> = {
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
                    color: { type: 'const', constVal: Color.Green },
                },
                false: {
                    value: { type: 'const', constVal: 'power-plug-off-outline' },
                    color: { type: 'const', constVal: Color.Gray },
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
                    color: { type: 'const', constVal: 'Color.bad' },
                    text: { value: { type: 'internal', dp: '///AdapterNoConnection' } },
                },

                false: {
                    value: { type: 'const', constVal: 'checkbox-marked-outline' },
                    color: { type: 'const', constVal: 'Color.good' },
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
                    color: { type: 'const', constVal: Color.Red },
                    text: { value: { type: 'internal', dp: '///AdapterStopped' } },
                },

                false: {
                    value: { type: 'const', constVal: 'checkbox-marked-outline' },
                    color: { type: 'const', constVal: Color.Green },
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
};
