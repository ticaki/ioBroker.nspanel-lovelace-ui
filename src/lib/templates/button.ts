import * as Color from '../const/Color';
import { PageItemOptionsTemplate } from '../types/type-pageItem';

export const buttonTemplates: PageItemOptionsTemplate[] = [
    {
        role: 'text.list',
        type: 'button',
        template: 'button.iconLeftSize',
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
    {
        role: 'text.list',
        type: 'button',
        template: 'button.iconRightSize',
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
];
