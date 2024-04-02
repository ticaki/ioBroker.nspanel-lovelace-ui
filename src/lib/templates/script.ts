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
                    color: { type: 'const', constVal: Color.On },
                },
                false: {
                    value: { type: 'const', constVal: 'power-socket-de' },
                    color: { type: 'const', constVal: Color.Off },
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
                    color: { type: 'const', constVal: Color.On },
                },
                false: {
                    value: { type: 'const', constVal: 'lightbulb-outline' },
                    color: { type: 'const', constVal: Color.Off },
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
            setValue1: { type: 'state', mode: 'auto', role: '', dp: '', regexp: /\.SET/ },
        },
    },
    'script.hue': {
        role: 'hue',
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
                    constVal: 'Brightness',
                },
                false: undefined,
            },
            text2: {
                true: {
                    type: 'const',
                    constVal: 'Colour temperature',
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
                    constVal: 'Brightness',
                },
                false: undefined,
            },
            text2: {
                true: {
                    type: 'const',
                    constVal: 'Colour temperature',
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
                    constVal: 'Brightness',
                },
                false: undefined,
            },
            text2: {
                true: {
                    type: 'const',
                    constVal: 'Colour temperature',
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
                    constVal: 'Brightness',
                },
                false: undefined,
            },
            text2: {
                true: {
                    type: 'const',
                    constVal: 'Colour temperature',
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
            colorMode: { type: 'const', constVal: false },
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
                    constVal: 'Brightness',
                },
                false: undefined,
            },
            text2: {
                true: {
                    type: 'const',
                    constVal: 'Colour temperature',
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
                    constVal: 'Brightness',
                },
                false: undefined,
            },
        },
    },
    'script.gate': {
        role: '',
        adapter: '',
        type: 'text',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'garage' },
                    color: { type: 'const', constVal: Color.open },
                },
                false: {
                    value: { type: 'const', constVal: 'garage-open' },
                    color: { type: 'const', constVal: Color.close },
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
                true: { type: 'const', constVal: 'Garage' },
                false: undefined,
            },
            text1: {
                true: { type: 'const', constVal: 'open' },
                false: { type: 'const', constVal: 'closed' },
            },
        },
    },
    'script.door': {
        role: '',
        adapter: '',
        type: 'text',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'door-open' },
                    color: { type: 'const', constVal: Color.open },
                },
                false: {
                    value: { type: 'const', constVal: 'door-closed' },
                    color: { type: 'const', constVal: Color.close },
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
                true: { type: 'const', constVal: 'door' },
                false: undefined,
            },
            text1: {
                true: { type: 'const', constVal: 'open' },
                false: { type: 'const', constVal: 'closed' },
            },
        },
    },
    'script.motion': {
        role: '',
        adapter: '',
        type: 'text',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'motion-sensor' },
                    color: { type: 'const', constVal: Color.On },
                },
                false: {
                    value: { type: 'const', constVal: 'motion-sensor' },
                    color: { type: 'const', constVal: Color.Off },
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
                true: { type: 'const', constVal: 'motion' },
                false: undefined,
            },
            text1: {
                true: { type: 'const', constVal: 'On' },
                false: { type: 'const', constVal: 'Off' },
            },
        },
    },
    'script.humidity': {
        role: '',
        adapter: '',
        type: 'text',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'waterprocent' },
                    color: { type: 'const', constVal: Color.Red },
                },
                false: {
                    value: { type: 'const', constVal: 'waterprocent' },
                    color: { type: 'const', constVal: Color.Green },
                },
                scale: {
                    type: 'const',
                    constVal: { val_min: 0, val_max: 100, val_best: 60 },
                },
                maxBri: undefined,
                minBri: undefined,
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.ACTUAL/,
                },
                unit: { type: 'const', constVal: '%' },
            },
            text: {
                true: { type: 'const', constVal: 'humidity' },
                false: undefined,
            },
        },
    },
    'script.temperature': {
        role: '',
        adapter: '',
        type: 'text',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'thermometer' },
                    color: { type: 'const', constVal: Color.Red },
                },
                false: {
                    value: { type: 'const', constVal: 'thermometer' },
                    color: { type: 'const', constVal: Color.Green },
                },
                scale: {
                    type: 'const',
                    constVal: { val_min: 0, val_max: 40, val_best: 25 },
                },
                maxBri: undefined,
                minBri: undefined,
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.ACTUAL/,
                },
                unit: { type: 'const', constVal: '°C' },
            },
            text: {
                true: { type: 'const', constVal: 'temperature' },
                false: undefined,
            },
        },
    },
    'script.lock': {
        role: '',
        adapter: '',
        type: 'button',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'lock' },
                    color: { type: 'const', constVal: Color.MSGreen },
                },
                false: {
                    value: { type: 'const', constVal: 'lock-open-variant' },
                    color: { type: 'const', constVal: Color.MSRed },
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
                true: { type: 'const', constVal: 'lock' },
                false: undefined,
            },
            text1: {
                true: { type: 'const', constVal: 'lock' },
                false: { type: 'const', constVal: 'unlock' },
            },
            setValue1: { type: 'state', mode: 'auto', role: '', dp: '', regexp: /\.SET/ },
        },
    },
    'script.slider': {
        role: '',
        adapter: '',
        type: 'number',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'plus-minus-variant' },
                    color: { type: 'const', constVal: Color.HMIOff },
                },
                false: undefined,
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.ACTUAL/,
                },
                set: {
                    type: 'state',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.SET/,
                },
            },
            text: {
                true: { type: 'const', constVal: 'value' },
                false: undefined,
            },
        },
    },
    // Mute sollte icon true/false steuern; Actual/Set Wert vom Slider Test offen
    'script.volume': {
        role: '',
        adapter: '',
        type: 'number',
        data: {
            icon: {
                true: {
                    value: {
                        type: 'triggered',
                        mode: 'auto',
                        role: '',
                        dp: '',
                        regexp: /\.ACTUAL/,
                        read: 'return val > 0 && val <= 33 ? volume-low : val > 33 && <= 66 ? volume-medium : volume-high ',
                    },
                    color: { type: 'const', constVal: Color.Yellow },
                },
                false: {
                    value: { type: 'const', constVal: 'volume-mute' },
                    color: { type: 'const', constVal: Color.HMIOff },
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
                set: {
                    type: 'state',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.SET/,
                },
            },
            text: {
                true: { type: 'const', constVal: 'volume' },
                false: undefined,
            },
        },
    },
    'script.warning': {
        role: '2values',
        adapter: '',
        type: 'text',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'alert-outline' },
                    color: { type: 'triggered', mode: 'auto', role: '', dp: '', regexp: /\.LEVEL/ },
                },
                false: undefined,
            },
            entity1: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.TITLE/,
                },
            },
            entity2: {
                value: {
                    type: 'triggered',
                    mode: 'auto',
                    role: '',
                    dp: '',
                    regexp: /\.INFO/,
                },
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
