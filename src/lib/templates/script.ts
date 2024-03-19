import { Color } from '../const/Color';
import { TemplateItems } from '../types/types';

export const scriptTemplates: TemplateItems = {
    'script.socket': {
        role: '',
        adapter: '',
        type: 'button',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'power-socket-de' },
                    color: { type: 'const', constVal: Color.true },
                },
                false: {
                    value: { type: 'const', constVal: 'power-soket-de' },
                    color: { type: 'const', constVal: Color.false },
                },
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.ACTUAL/,
                },
            },
            text: {
                true: { type: 'const', constVal: 'socket' },
                false: undefined,
            },
            text1: {
                true: { type: 'const', constVal: 'on' },
                false: { type: 'const', constVal: 'off' },
            },
            setValue1: { type: 'state', mode: 'auto', role: '', dp: '', regexp: /\.SET/ },
        },
    },
    'script.light': {
        role: '',
        adapter: '',
        type: 'button',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'lightbulb' },
                    color: { type: 'const', constVal: Color.true },
                },
                false: {
                    value: { type: 'const', constVal: 'lightbulb-outline' },
                    color: { type: 'const', constVal: Color.false },
                },
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.ON_ACTUAL/,
                },
            },
            text: {
                true: { type: 'const', constVal: 'lightbulb' },
                false: undefined,
            },
            text1: {
                true: { type: 'const', constVal: 'on' },
                false: { type: 'const', constVal: 'off' },
            },
            setValue1: { type: 'state', mode: 'auto', role: '', dp: '', regexp: /\.ON_SET/ },
        },
    },
    'script.hue': {
        role: 'hue',
        adapter: '',
        type: 'light',
        data: {
            headline: { type: 'const', constVal: 'HUE Light' },
            colorMode: { type: 'const', constVal: 'hue' },
            icon: {
                true: {
                    value: { type: 'const', constVal: 'lightbulb' },
                    color: { type: 'const', constVal: Color.activated },
                },
                false: {
                    value: { type: 'const', constVal: 'lightbulb-outline' },
                    color: { type: 'const', constVal: Color.deactivated },
                },
                scale: undefined,
                maxBri: undefined,
                minBri: undefined,
            },
            dimmer: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.DIMMER/,
                },
            },
            hue: {
                type: 'triggered',
                mode: 'auto',
                role: '',
                dp: '',
                regexp: /\.HUE/,
            },
            ct: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.TEMPERATUR/,
                },
            },
            entity1: {
                // button
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.ON/,
                },
                decimal: undefined,
                factor: undefined,
                unit: undefined,
            },
            text1: {
                true: {
                    type: 'const',
                    constVal: 'brightness',
                },
                false: undefined,
            },
            text2: {
                true: {
                    type: 'const',
                    constVal: 'Colour brightness',
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
    'script.rgbSingle': {
        role: 'rgbSingle',
        adapter: '',
        type: 'light',
        data: {
            headline: { type: 'const', constVal: 'RGB_Single Light' },
            colorMode: { type: 'const', constVal: 'none' },
            icon: {
                true: {
                    value: { type: 'const', constVal: 'lightbulb' },
                    color: { type: 'const', constVal: Color.activated },
                },
                false: {
                    value: { type: 'const', constVal: 'lightbulb-outline' },
                    color: { type: 'const', constVal: Color.deactivated },
                },
                scale: undefined,
                maxBri: undefined,
                minBri: undefined,
            },
            dimmer: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.DIMMER/,
                },
            },
            color: {
                true: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.RGB/,
                },
                false: undefined,
            },
            ct: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.TEMPERATUR/,
                },
            },
            entity1: {
                // button
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.ON/,
                },
                decimal: undefined,
                factor: undefined,
                unit: undefined,
            },
            text1: {
                true: {
                    type: 'const',
                    constVal: 'brightness',
                },
                false: undefined,
            },
            text2: {
                true: {
                    type: 'const',
                    constVal: 'Colour brightness',
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
    'script.rgbSingleHEX': {
        role: 'rgb.hex',
        adapter: '',
        type: 'light',
        data: {
            headline: { type: 'const', constVal: 'RGB_Single Light' },
            colorMode: { type: 'const', constVal: 'none' },
            icon: {
                true: {
                    value: { type: 'const', constVal: 'lightbulb' },
                    color: { type: 'const', constVal: Color.activated },
                },
                false: {
                    value: { type: 'const', constVal: 'lightbulb-outline' },
                    color: { type: 'const', constVal: Color.deactivated },
                },
                scale: undefined,
                maxBri: undefined,
                minBri: undefined,
            },
            dimmer: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.DIMMER/,
                },
            },
            color: {
                true: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.RGB/,
                },
                false: undefined,
            },
            ct: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.TEMPERATUR/,
                },
            },
            entity1: {
                // button
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.ON/,
                },
                decimal: undefined,
                factor: undefined,
                unit: undefined,
            },
            text1: {
                true: {
                    type: 'const',
                    constVal: 'brightness',
                },
                false: undefined,
            },
            text2: {
                true: {
                    type: 'const',
                    constVal: 'Colour brightness',
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
    'script.rgb': {
        role: 'rgbThree',
        adapter: '',
        type: 'light',
        data: {
            headline: { type: 'const', constVal: 'RGB Light' },
            colorMode: { type: 'const', constVal: 'none' },
            icon: {
                true: {
                    value: { type: 'const', constVal: 'lightbulb' },
                    color: { type: 'const', constVal: Color.activated },
                },
                false: {
                    value: { type: 'const', constVal: 'lightbulb-outline' },
                    color: { type: 'const', constVal: Color.deactivated },
                },
                scale: undefined,
                maxBri: undefined,
                minBri: undefined,
            },
            dimmer: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.DIMMER/,
                },
            },
            ct: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.TEMPERATUR/,
                },
            },
            Red: {
                type: 'triggered',
                mode: 'auto',
                role: '',
                dp: '',
                regexp: /\.RED/,
            },
            Blue: {
                type: 'triggered',
                mode: 'auto',
                role: '',
                dp: '',
                regexp: /\.BLUE/,
            },
            Green: {
                type: 'triggered',
                mode: 'auto',
                role: '',
                dp: '',
                regexp: /\.GREEN/,
            },
            entity1: {
                // button
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.ON/,
                },
                decimal: undefined,
                factor: undefined,
                unit: undefined,
            },
            text1: {
                true: {
                    type: 'const',
                    constVal: 'brightness',
                },
                false: undefined,
            },
            text2: {
                true: {
                    type: 'const',
                    constVal: 'Colour brightness',
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
    'script.ct': {
        role: 'ct',
        adapter: '',
        type: 'light',
        data: {
            headline: { type: 'const', constVal: 'CT Light' },
            colorMode: { type: 'const', constVal: 'ct' },
            icon: {
                true: {
                    value: { type: 'const', constVal: 'lightbulb' },
                    color: { type: 'const', constVal: Color.On },
                },
                false: {
                    value: { type: 'const', constVal: 'lightbulb-outline' },
                    color: { type: 'const', constVal: Color.Off },
                },
                scale: undefined,
                maxBri: undefined,
                minBri: undefined,
            },
            dimmer: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.DIMMER/,
                },
            },
            ct: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.TEMPERATUR/,
                },
            },
            entity1: {
                // button
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.ON/,
                },
                decimal: undefined,
                factor: undefined,
                unit: undefined,
            },
            text1: {
                true: {
                    type: 'const',
                    constVal: 'brightness',
                },
                false: undefined,
            },
            text2: {
                true: {
                    type: 'const',
                    constVal: 'Colour brightness',
                },
                false: undefined,
            },
        },
    },
    'script.dimmer': {
        role: 'dimmer',
        adapter: '',
        type: 'light',
        data: {
            headline: { type: 'const', constVal: 'dimmer Light' },
            colorMode: { type: 'const', constVal: 'none' },
            icon: {
                true: {
                    value: { type: 'const', constVal: 'lightbulb' },
                    color: { type: 'const', constVal: Color.On },
                },
                false: {
                    value: { type: 'const', constVal: 'lightbulb-outline' },
                    color: { type: 'const', constVal: Color.Off },
                },
                scale: undefined,
                maxBri: undefined,
                minBri: undefined,
            },
            dimmer: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.SET/,
                },
            },
            entity1: {
                // button
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.ON_SET/,
                },
                decimal: undefined,
                factor: undefined,
                unit: undefined,
            },
            text1: {
                true: {
                    type: 'const',
                    constVal: 'brightness',
                },
                false: undefined,
            },
        },
    },
};
/* Standardvorlage Licht
    'script.Standard': {
        role: '',
        adapter: '',
        type: 'light',
        data: {
            headline: { type: 'const', constVal: 'HUE Light' },
            colorMode: { type: 'const', constVal: true },
            icon: {
                true: {
                    value: { type: 'const', constVal: 'lightbulb' },
                    color: { type: 'const', constVal: Color.activated },
                },
                false: {
                    value: { type: 'const', constVal: 'lightbulb-outline' },
                    color: { type: 'const', constVal: Color.deactivated },
                },
                scale: undefined,
                maxBri: undefined,
                minBri: undefined,
            },
            dimmer: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.DIMMER/,
                },
            },
            color: {
                true: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.HUE/,
                },
                false: undefined,
            },
            ct: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.TEMPERATUR/,
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
                    role: '',
                    dp: '',
                    regexp: /\.ON_ACTUAL/,
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
            // unten
            text1: {
                true: {
                    type: 'const',
                    constVal: 'Colour brightness',
                },
                false: undefined,
            },
            // mitte
            text2: {
                true: {
                    type: 'const',
                    constVal: 'White brightness',
                },
                false: undefined,
            },
            // oben
            text3: {
                true: {
                    type: 'const',
                    constVal: 'Color',
                },
                false: undefined,
            },
        },
    },
*/
