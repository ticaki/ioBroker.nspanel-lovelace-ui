import * as Color from '../const/Color';
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
};
