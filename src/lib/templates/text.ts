import { PageItemOptionsTemplate } from '../types/type-pageItem';

export const textTemplates: PageItemOptionsTemplate[] = [
    {
        /**
         * zu 100% geschlossen zu 0% geschlossen read und write mit jeweils 100-val benutzen um das zu 100% geöffnet zu ändern.
         */

        template: 'waste-calendar.plastic',
        role: 'text.list',
        type: 'text',
        adapter: '0_userdata.0',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'trash-can' },
                    color: { type: 'state', dp: '.1.color', mode: 'auto', role: 'state' },
                },
            },
            entity1: {
                value: { type: 'const', constVal: true },
            },
            text: {
                true: { type: 'state', dp: '.1.event', mode: 'auto', role: 'state' },
                false: undefined,
            },
            text1: {
                true: { type: 'state', dp: '.1.date', mode: 'auto', role: 'state' },
                false: undefined,
            },
        },
    },
    {
        template: 'waste-calendar.bio',
        role: 'text.list',
        type: 'text',
        adapter: '0_userdata.0',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'trash-can' },
                    color: { type: 'state', dp: '.2.color', mode: 'auto', role: 'state' },
                },
            },
            entity1: {
                value: { type: 'const', constVal: true },
            },
            text: {
                true: { type: 'state', dp: '.2.event', mode: 'auto', role: 'state' },
                false: undefined,
            },
            text1: {
                true: { type: 'state', dp: '.2.date', mode: 'auto', role: 'state' },
                false: undefined,
            },
        },
    },
    {
        template: 'waste-calendar.house',
        role: 'text.list',
        type: 'text',
        adapter: '0_userdata.0',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'trash-can' },
                    color: { type: 'state', dp: '.3.color', mode: 'auto', role: 'state' },
                },
            },
            entity1: {
                value: { type: 'const', constVal: true },
            },
            text: {
                true: { type: 'state', dp: '.3.event', mode: 'auto', role: 'state' },
                false: undefined,
            },
            text1: {
                true: { type: 'state', dp: '.3.date', mode: 'auto', role: 'state' },
                false: undefined,
            },
        },
    },
    {
        template: 'waste-calendar.paper',
        role: 'text.list',
        type: 'text',
        adapter: '0_userdata.0',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'trash-can' },
                    color: { type: 'state', dp: '.4.color', mode: 'auto', role: 'state' },
                },
            },
            entity1: {
                value: { type: 'const', constVal: true },
            },
            text: {
                true: { type: 'state', dp: '.4.event', mode: 'auto', role: 'state' },
                false: undefined,
            },
            text1: {
                true: { type: 'state', dp: '.4.date', mode: 'auto', role: 'state' },
                false: undefined,
            },
        },
    },
];
