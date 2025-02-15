import type * as pages from './types/pages';
import { Color } from './const/Color';
import type { panelConfigPartial } from './controller/panel';

const pageEntitiesTest1: pages.PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: 'entities1',
    useColor: false,
    config: {
        card: 'cardEntities',
        data: {
            headline: {
                type: 'const',
                constVal: 'entities1',
            },
        },
    },
    pageItems: [
        {
            role: 'text.list',
            type: 'number',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-up' },
                        color: { type: 'const', constVal: Color.activated },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.deactivated },
                    },
                },
                entity1: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.dimmer',
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'Number',
                    },
                    false: undefined,
                },
            },
        },
        {
            template: 'button.service.adapter.noconnection',
            dpInit: '',
        },
        {
            template: 'button.service.adapter.stopped',
            dpInit: '',
        },
        {
            role: 'rgbSingle',
            type: 'light',
            dpInit: '',

            data: {
                color: {
                    true: { type: 'triggered', dp: '0_userdata.0.RGB' },
                    false: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'lightbulb' },
                        color: { type: 'const', constVal: Color.Yellow },
                    },
                    false: {
                        value: { type: 'const', constVal: 'lightbulb-outline' },
                        color: { type: 'const', constVal: Color.HMIOff },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                colorMode: { type: 'const', constVal: true },
                dimmer: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.dimmer',
                    },
                },
                entity1: {
                    // button
                    value: { type: 'triggered', dp: '0_userdata.0.example_state' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                entityInSel: undefined,
                text1: {
                    true: {
                        type: 'const',
                        constVal: 'Licht',
                    },
                    false: undefined,
                },
                text2: {
                    true: {
                        type: 'const',
                        constVal: 'Picker1',
                    },
                    false: undefined,
                },
                text3: {
                    true: {
                        type: 'const',
                        constVal: 'Picker2',
                    },
                    false: undefined,
                },
                ct: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.ct',
                    },
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'fan',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                speed: {
                    value: {
                        type: 'const',
                        constVal: 1000,
                    },
                    factor: undefined,
                    maxScale: {
                        type: 'const',
                        constVal: 3000,
                    },
                },
                headline: {
                    type: 'const',
                    constVal: 'Football-Fan',
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'Details',
                    },
                    false: undefined,
                },
                entityInSel: { value: { type: 'const', constVal: '2' } },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: '1?2?3?4' },
            },
        },
        {
            role: 'text.list',
            type: 'number',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-up' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.dimmer',
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'Number',
                    },
                    false: undefined,
                },
            },
        },
        {
            template: 'generic.shutter',
            dpInit: '0_userdata.0.shutter_test',
            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'window-open' },
                        color: { type: 'const', constVal: 'aqua', role: 'level.color.name' },
                    },
                    false: null,
                },
            },
        },
        {
            role: 'rgbSingle',
            type: 'light',
            dpInit: '',

            data: {
                color: {
                    true: { type: 'triggered', dp: '0_userdata.0.RGB' },
                    false: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'lightbulb' },
                        color: { type: 'const', constVal: Color.Yellow },
                    },
                    false: {
                        value: { type: 'const', constVal: 'lightbulb-outline' },
                        color: { type: 'const', constVal: Color.HMIOff },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                colorMode: { type: 'const', constVal: true },
                dimmer: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.dimmer',
                    },
                },
                entity1: {
                    // button
                    value: { type: 'triggered', dp: '0_userdata.0.example_state' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                entityInSel: undefined,
                text1: {
                    true: {
                        type: 'const',
                        constVal: 'Licht',
                    },
                    false: undefined,
                },
                text2: {
                    true: {
                        type: 'const',
                        constVal: 'Picker1',
                    },
                    false: undefined,
                },
                text3: {
                    true: {
                        type: 'const',
                        constVal: 'Picker2',
                    },
                    false: undefined,
                },
                ct: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.ct',
                    },
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'fan',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                speed: {
                    value: {
                        type: 'const',
                        constVal: 1000,
                    },
                    factor: undefined,
                    maxScale: {
                        type: 'const',
                        constVal: 3000,
                    },
                },
                headline: {
                    type: 'const',
                    constVal: 'Football-Fan',
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'Details',
                    },
                    false: undefined,
                },
                entityInSel: { value: { type: 'const', constVal: '2' } },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: '1?2?3?4' },
            },
        },
    ],
    items: undefined,
};

export const popupTest2: pages.PageBaseConfig = {
    //card: 'popupNotify',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: 'popup2',
    useColor: false,
    config: {
        card: 'popupNotify',
        data: {
            entity1: { value: { type: 'state', dp: '0_userdata.0.example_state' } },
            headline: { type: 'const', constVal: 'welcomeHToken' },
            colorHeadline: { true: { color: { type: 'const', constVal: Color.White } } },
            buttonLeft: { type: 'const', constVal: '' },
            colorButtonLeft: { true: { color: { type: 'const', constVal: Color.White } } },
            buttonRight: { type: 'const', constVal: '' },
            colorButtonRight: { true: { color: { type: 'const', constVal: Color.White } } },
            text: { type: 'const', constVal: 'Text Test ${pl}' },
            colorText: { true: { color: { type: 'const', constVal: Color.White } } },
            timeout: { type: 'const', constVal: 0 },
            // {placeholder: {text: '' oder dp: ''}}
            optionalValue: { type: 'const', constVal: { pl: { text: 'das ist ein placeholder' } } },
            setValue1: { type: 'const', constVal: true },
        },
    },
    pageItems: [],
    items: undefined,
};
const pageEntitiesTest3: pages.PageBaseConfig = {
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: 'entities3',
    config: {
        card: 'cardEntities',
        cardRole: 'AdapterConnection',
        scrollType: 'page',
        filterType: 'true',
        data: {
            headline: {
                type: 'const',
                constVal: 'Adapter Offline',
            },
        },
    },
    pageItems: [
        /*
        {
            role: 'timer',
            type: 'timer',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'timer' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    false: {
                        value: undefined,
                        color: { type: 'const', constVal: Color.Green },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                headline: { type: 'const', constVal: 'Timer' },

                setValue1: { type: 'state', dp: '0_userdata.0.example_state' },
            },
        },
        {
            role: 'rgbSingle',
            type: 'light',
            dpInit: '0_userdata.0.shelly.0.SHRGBW2#258794#1',
            template: 'light.shelly.rgbw2',
        },
        {
            type: 'shutter',
            dpInit: '0_userdata.0.shelly.0.SHSW-25#C45BBE5FC53F#1',
            template: 'shutter.shelly.2PM',
        },
        {
            dpInit: 'bydhvs',
            template: 'text.battery.bydhvs',
        },
    */
    ],
    items: undefined,
};
const pageEntitiesTest2: pages.PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: 'entities2',
    useColor: false,
    config: {
        card: 'cardEntities',
        data: {
            headline: {
                type: 'const',
                constVal: 'entities2',
            },
        },
    },
    pageItems: [
        {
            role: 'text.list',
            type: 'button',
            template: 'button.iconLeftSize',
            dpInit: '',
        },
        {
            role: 'text.list',
            type: 'button',
            template: 'button.iconRightSize',
            dpInit: '',
        },
        {
            role: '',
            type: 'number',
            data: {
                entity1: {
                    value: { type: 'internal', dp: 'cmd/screensaverTimeout' },
                    minScale: { type: 'const', constVal: 0 },
                    maxScale: { type: 'const', constVal: 90 },
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'clock-time-twelve-outline' },
                        color: { type: 'const', constVal: Color.White },
                    },
                    false: undefined,
                },
                text: { true: { type: 'const', constVal: 'screensaverTimeout' }, false: undefined },
            },
        },
    ],
    items: undefined,
};
const pagePowerTest1: pages.PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardPower',
    dpInit: '',

    alwaysOn: 'none',
    uniqueID: 'power1',
    useColor: false,
    pageItems: [],
    config: {
        card: 'cardPower',
        data: {
            headline: { type: 'const', constVal: 'headline' },
            homeValueTop: {
                value: { type: 'const', constVal: 'top' },
            },
            homeValueBot: {
                value: { type: 'internal', dp: '///power1/powerSum' },
                math: { type: 'const', constVal: 'return r1+r2+r3+l1+l2+l3 -999' },
            },
            leftTop: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-up' },
                        color: undefined,
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },
                },
                value: {
                    value: { type: 'const', constVal: 1000 },
                },
            },
            leftMiddle: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-left' },
                        color: undefined,
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },
                },
                value: {
                    value: { type: 'const', constVal: 2 },
                },
            },
            leftBottom: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-down' },
                        color: undefined,
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },
                },
                value: {
                    value: { type: 'const', constVal: 3 },
                },
            },
            rightTop: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-up' },
                        color: undefined,
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },
                },
                value: {
                    value: { type: 'const', constVal: 4 },
                },
            },
            rightMiddle: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-right' },
                        color: undefined,
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },
                },
                value: {
                    value: { type: 'const', constVal: 5 },
                },
            },
            rightBottom: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-down' },
                        color: undefined,
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },
                },
                value: {
                    value: { type: 'const', constVal: 6 },
                },
            },
            homeIcon: undefined /*{
                true: {
                    value: { type: 'const', constVal: 'home' },
                    color: undefined,
                },
                false: {
                    value: undefined,
                    color: undefined,
                },
            },*/,
        },
    },
    items: undefined,
};
export const pageMediaTest: pages.PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardMedia',
    dpInit: 'alexa2.0.Echo-Devices.G091EV0704641J8R.Player',

    alwaysOn: 'none',
    config: {
        card: 'cardMedia',
        data: {
            headline: {
                type: 'const',
                constVal: 'home',
            },
            alwaysOnDisplay: {
                type: 'const',
                constVal: 'test',
            },
            album: {
                mode: 'auto',
                type: 'state',
                role: 'media.album',
                dp: '',
            },
            title: {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: {
                    type: 'triggered',
                    dp: '0_userdata.0.spotify-premium.0.player.playlist.trackNo',
                },
                color: {
                    type: 'const',
                    constVal: { r: 250, g: 2, b: 3 },
                },
            },
            duration: {
                mode: 'auto',
                type: 'state',
                role: 'media.duration',
                dp: '',
            },
            elapsed: {
                mode: 'auto',
                type: 'triggered',
                role: ['media.elapsed', 'media.elapsed.text'],
                dp: '',
            },
            volume: {
                value: {
                    mode: 'auto',
                    type: 'state',
                    role: ['level.volume'],
                    response: 'now',
                    scale: { min: 0, max: 100 },
                    dp: '',
                },
                set: {
                    mode: 'auto',
                    type: 'state',
                    role: ['level.volume'],
                    response: 'medium',
                    scale: { min: 0, max: 100 },
                    dp: '',
                },
            },
            artist: {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: {
                    mode: 'auto',
                    type: 'state',
                    role: 'media.artist',
                    dp: '',
                },
                color: undefined,
                icon: {
                    type: 'const',
                    constVal: 'diameter',
                },
                list: undefined,
            },
            shuffle: {
                value: {
                    mode: 'auto',
                    type: 'state',
                    role: 'media.mode.shuffle',
                    dp: '',
                },
                set: {
                    mode: 'auto',
                    type: 'state',
                    role: 'media.mode.shuffle',
                    dp: '',
                },
            },
            icon: {
                type: 'const',
                constVal: 'dialpad',
            },
            play: {
                mode: 'auto',
                type: 'state',
                role: ['button.play'],
                dp: '',
            },
            mediaState: {
                mode: 'auto',
                type: 'triggered',
                role: ['media.state'],
                dp: '',
            },
            stop: {
                mode: 'auto',
                type: 'state',
                role: ['button.stop'],
                dp: '',
            },
            pause: {
                mode: 'auto',
                type: 'state',
                role: 'button.pause',
                dp: '',
            },
            forward: {
                mode: 'auto',
                type: 'state',
                role: 'button.next',
                dp: '',
            },
            backward: {
                mode: 'auto',
                type: 'state',
                role: 'button.prev',
                dp: '',
            },
            logo: {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: { type: 'const', constVal: '1' },
                icon: { type: 'const', constVal: 'home' },
                color: { type: 'const', constVal: { r: 250, b: 250, g: 0 } },
                list: undefined,
                action: 'cross',
            },
        },
    },
    items: undefined,
    pageItems: [
        {
            role: 'spotify-playlist',
            type: 'input_sel',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-up' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityInSel: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.spotify-premium.0.player.playlist.trackNo',
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'state', dp: '0_userdata.0.spotify-premium.0.player.playlist.trackListArray' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                //setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityInSel: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
    ],
    uniqueID: 'media1',
    useColor: false,
};

const pageAbfall: pages.PageBaseConfig = {
    //type: 'sonstiges',
    card: 'cardEntities',
    dpInit: '0_userdata.0.Abfallkalender',
    uniqueID: 'abfall1',
    template: 'entities.waste-calendar',
};

export const pageMediaTest2: pages.PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardMedia',
    dpInit: 'alexa2.0.Echo-Devices.G091EV0704641J8R.Player',

    alwaysOn: 'none',
    config: {
        card: 'cardMedia',
        data: {
            headline: {
                type: 'const',
                constVal: 'home',
            },
            alwaysOnDisplay: {
                type: 'const',
                constVal: 'test',
            },
            album: {
                mode: 'auto',
                type: 'state',
                role: 'media.album',
                dp: '',
            },
            title: {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: {
                    mode: 'auto',
                    type: 'triggered',
                    role: 'media.title',
                    dp: '',
                },
                color: {
                    type: 'const',
                    constVal: { r: 250, g: 2, b: 3 },
                },
            },
            duration: {
                mode: 'auto',
                type: 'state',
                role: 'media.duration',
                dp: '',
            },
            elapsed: {
                mode: 'auto',
                type: 'triggered',
                role: ['media.elapsed', 'media.elapsed.text'],
                dp: '',
            },
            volume: {
                value: {
                    mode: 'auto',
                    type: 'state',
                    role: ['level.volume'],
                    response: 'now',
                    scale: { min: 0, max: 100 },
                    dp: '',
                },
                set: {
                    mode: 'auto',
                    type: 'state',
                    role: ['level.volume'],
                    response: 'medium',
                    scale: { min: 0, max: 100 },
                    dp: '',
                },
            },
            artist: {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: {
                    mode: 'auto',
                    type: 'state',
                    role: 'media.artist',
                    dp: '',
                },
                color: undefined,
                icon: {
                    type: 'const',
                    constVal: 'diameter',
                },
                list: undefined,
            },
            shuffle: {
                value: {
                    mode: 'auto',
                    type: 'state',
                    role: 'media.mode.shuffle',
                    dp: '',
                },
                set: {
                    mode: 'auto',
                    type: 'state',
                    role: 'media.mode.shuffle',
                    dp: '',
                },
            },
            icon: {
                type: 'const',
                constVal: 'dialpad',
            },
            play: {
                mode: 'auto',
                type: 'state',
                role: ['button.play'],
                dp: '',
            },
            mediaState: {
                mode: 'auto',
                type: 'triggered',
                role: ['media.state'],
                dp: '',
            },
            stop: {
                mode: 'auto',
                type: 'state',
                role: ['button.stop'],
                dp: '',
            },
            pause: {
                mode: 'auto',
                type: 'state',
                role: 'button.pause',
                dp: '',
            },
            forward: {
                mode: 'auto',
                type: 'state',
                role: 'button.next',
                dp: '',
            },
            backward: {
                mode: 'auto',
                type: 'state',
                role: 'button.prev',
                dp: '',
            },
            logo: {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: { type: 'const', constVal: '1' },
                icon: { type: 'const', constVal: 'home' },
                color: { type: 'const', constVal: { r: 250, b: 250, g: 0 } },
                list: undefined,
                action: 'cross',
            },
        },
    },
    items: undefined,
    pageItems: [
        {
            role: 'spotify-playlist',
            type: 'input_sel',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-up' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityInSel: {
                    value: {
                        type: 'state',
                        dp: '0_userdata.0.spotify-premium.0.player.playlist.trackNo',
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'state', dp: '0_userdata.0.spotify-premium.0.player.playlist.trackListArray' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
    ],
    uniqueID: 'media2',
    useColor: false,
};

const pageMediaTest3: pages.PageBaseConfig = {
    //type: 'sonstiges',
    template: 'media.spotify-premium',
    dpInit: '0_userdata.0.spotify-premium.0',
    uniqueID: 'media3',
    card: 'cardMedia',
};
const pageGridTest1: pages.PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardGrid',
    dpInit: '',

    alwaysOn: 'none',
    uniqueID: 'grid1',
    useColor: false,
    config: {
        card: 'cardGrid',
        data: {
            headline: {
                type: 'const',
                constVal: 'grid1',
            },
        },
    },
    pageItems: [
        {
            role: 'text.list',
            type: 'number',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-up' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: 23,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'Number',
                    },
                    false: undefined,
                },
            },
        },
        {
            /**
             * zu 100% geschlossen zu 0% geschlossen read und write mit jeweils 100-val benutzen um das zu 100% geöffnet zu ändern.
             */
            role: 'rgbSingle',
            type: 'shutter',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'window-shutter-open' },
                        color: { type: 'const', constVal: Color.Yellow },
                    },
                    false: {
                        value: { type: 'const', constVal: 'window-shutter' },
                        color: { type: 'const', constVal: Color.HMIOff },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                // 1. slider
                entity1: {
                    // button
                    value: { mode: 'auto', role: 'level.blind', type: 'triggered', dp: '' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                    minScale: { type: 'const', constVal: 0 },
                    maxScale: { type: 'const', constVal: 100 },
                },
                // 2. slider
                entity2: {
                    // button
                    value: { mode: 'auto', role: 'level.tilt', type: 'triggered', dp: '' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                    minScale: { type: 'const', constVal: 0 },
                    maxScale: { type: 'const', constVal: 100 },
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'text',
                    },
                    false: undefined,
                },
                headline: {
                    type: 'const',
                    constVal: 'Shutter',
                },
                text1: {
                    true: {
                        type: 'const',
                        constVal: 'text1',
                    },
                    false: undefined,
                },
                text2: {
                    true: {
                        type: 'const',
                        constVal: 'text2',
                    },
                    false: undefined,
                },
                up: {
                    type: 'state',
                    dp: '',
                    mode: 'auto',
                    role: ['button.open.blind', 'button.open'],
                },
                down: {
                    type: 'state',
                    dp: '',
                    mode: 'auto',
                    role: ['button.close.blind', 'button.close'],
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                //valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'rgbSingle',
            type: 'light',
            dpInit: '',

            data: {
                color: {
                    true: { type: 'triggered', dp: '0_userdata.0.RGB' },
                    false: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'lightbulb' },
                        color: { type: 'const', constVal: Color.Yellow },
                    },
                    false: {
                        value: { type: 'const', constVal: 'lightbulb-outline' },
                        color: { type: 'const', constVal: Color.HMIOff },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                colorMode: { type: 'const', constVal: true },
                dimmer: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.dimmer',
                    },
                },
                entity1: {
                    // button
                    value: { type: 'triggered', dp: '0_userdata.0.example_state' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                entityInSel: undefined,
                text1: {
                    true: {
                        type: 'const',
                        constVal: 'Licht',
                    },
                    false: undefined,
                },
                text2: {
                    true: {
                        type: 'const',
                        constVal: 'Picker1',
                    },
                    false: undefined,
                },
                text3: {
                    true: {
                        type: 'const',
                        constVal: 'Picker2',
                    },
                    false: undefined,
                },
                ct: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.ct',
                    },
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                headline: { type: 'const', constVal: 'insel' },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityInSel: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'music' },
                        color: { type: 'const', constVal: Color.Gray },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: { type: 'const', constVal: 'Navbutton' },
                    false: undefined,
                },
                setNavi: {
                    type: 'const',
                    constVal: '3',
                },
            },
        },
        {
            role: 'text.list',
            type: 'text',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        text: { value: { type: 'const', constVal: '22.2' }, textSize: { type: 'const', constVal: 3 } },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
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
                    true: { type: 'const', constVal: 'text1' },
                    false: undefined,
                },
            },
        },
        {
            role: 'text.list',
            type: 'number',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-up' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: 23,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'Number',
                    },
                    false: undefined,
                },
            },
        },
        {
            /**
             * zu 100% geschlossen zu 0% geschlossen read und write mit jeweils 100-val benutzen um das zu 100% geöffnet zu ändern.
             */
            role: 'rgbSingle',
            type: 'shutter',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'window-shutter-open' },
                        color: { type: 'const', constVal: Color.Yellow },
                    },
                    false: {
                        value: { type: 'const', constVal: 'window-shutter' },
                        color: { type: 'const', constVal: Color.HMIOff },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                // 1. slider
                entity1: {
                    // button
                    value: { mode: 'auto', role: 'level.blind', type: 'triggered', dp: '' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                    minScale: { type: 'const', constVal: 0 },
                    maxScale: { type: 'const', constVal: 100 },
                },
                // 2. slider
                entity2: {
                    // button
                    value: { mode: 'auto', role: 'level.tilt', type: 'triggered', dp: '' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                    minScale: { type: 'const', constVal: 0 },
                    maxScale: { type: 'const', constVal: 100 },
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'text',
                    },
                    false: undefined,
                },
                headline: {
                    type: 'const',
                    constVal: 'Shutter',
                },
                text1: {
                    true: {
                        type: 'const',
                        constVal: 'text1',
                    },
                    false: undefined,
                },
                text2: {
                    true: {
                        type: 'const',
                        constVal: 'text2',
                    },
                    false: undefined,
                },
                up: {
                    type: 'state',
                    dp: '',
                    mode: 'auto',
                    role: ['button.open.blind', 'button.open'],
                },
                down: {
                    type: 'state',
                    dp: '',
                    mode: 'auto',
                    role: ['button.close.blind', 'button.close'],
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                //valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'rgbSingle',
            type: 'light',
            dpInit: '',

            data: {
                color: {
                    true: { type: 'triggered', dp: '0_userdata.0.RGB' },
                    false: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'lightbulb' },
                        color: { type: 'const', constVal: Color.Yellow },
                    },
                    false: {
                        value: { type: 'const', constVal: 'lightbulb-outline' },
                        color: { type: 'const', constVal: Color.HMIOff },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                colorMode: { type: 'const', constVal: true },
                dimmer: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.dimmer',
                    },
                },
                entity1: {
                    // button
                    value: { type: 'triggered', dp: '0_userdata.0.example_state' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                entityInSel: undefined,
                text1: {
                    true: {
                        type: 'const',
                        constVal: 'Licht',
                    },
                    false: undefined,
                },
                text2: {
                    true: {
                        type: 'const',
                        constVal: 'Picker1',
                    },
                    false: undefined,
                },
                text3: {
                    true: {
                        type: 'const',
                        constVal: 'Picker2',
                    },
                    false: undefined,
                },
                ct: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.ct',
                    },
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                headline: { type: 'const', constVal: 'insel' },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityInSel: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'music' },
                        color: { type: 'const', constVal: Color.Gray },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: { type: 'const', constVal: 'Navbutton' },
                    false: undefined,
                },
                setNavi: {
                    type: 'const',
                    constVal: '3',
                },
            },
        },
        {
            role: 'text.list',
            type: 'text',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        text: { value: { type: 'const', constVal: '22.2' }, textSize: { type: 'const', constVal: 3 } },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
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
                    true: { type: 'const', constVal: 'text1' },
                    false: undefined,
                },
            },
        },
    ],
    items: undefined,
};
const pageGridTest2: pages.PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardGrid',
    dpInit: '',

    alwaysOn: 'none',
    uniqueID: 'grid2',
    useColor: false,
    config: {
        card: 'cardGrid',
        data: {
            headline: {
                type: 'const',
                constVal: 'grid2',
            },
        },
    },
    items: undefined,
    pageItems: [
        {
            role: 'text.list',
            type: 'fan',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
                entityInSel: undefined,
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'account' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'timer',
            type: 'timer',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'timer' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    false: {
                        value: undefined,
                        color: { type: 'const', constVal: Color.Green },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                headline: { type: 'const', constVal: 'Timer' },

                setValue1: { type: 'state', dp: '0_userdata.0.example_state' },
            },
        },
        {
            /**
             * zu 100% geschlossen zu 0% geschlossen read und write mit jeweils 100-val benutzen um das zu 100% geöffnet zu ändern.
             */
            type: 'text',
            dpInit: 'zigbee2mqtt.0.0x00158d00041fdbcb',
            template: 'text.temperature',
        },
        {
            device: '0',
            template: 'text.battery.bydhvs',
        },
    ],
};
const pageGridTest5: pages.PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardGrid',
    dpInit: '',

    alwaysOn: 'none',
    uniqueID: 'grid5',
    useColor: false,
    config: {
        card: 'cardGrid',
        data: {
            headline: {
                type: 'const',
                constVal: 'grid1',
            },
        },
    },
    pageItems: [
        {
            role: 'text.list',
            type: 'number',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-up' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: 23,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'Number',
                    },
                    false: undefined,
                },
            },
        },
        {
            /**
             * zu 100% geschlossen zu 0% geschlossen read und write mit jeweils 100-val benutzen um das zu 100% geöffnet zu ändern.
             */
            role: 'rgbSingle',
            type: 'shutter',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'window-shutter-open' },
                        color: { type: 'const', constVal: Color.Yellow },
                    },
                    false: {
                        value: { type: 'const', constVal: 'window-shutter' },
                        color: { type: 'const', constVal: Color.HMIOff },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                // 1. slider
                entity1: {
                    // button
                    value: { mode: 'auto', role: 'level.blind', type: 'triggered', dp: '' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                    minScale: { type: 'const', constVal: 0 },
                    maxScale: { type: 'const', constVal: 100 },
                },
                // 2. slider
                entity2: {
                    // button
                    value: { mode: 'auto', role: 'level.tilt', type: 'triggered', dp: '' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                    minScale: { type: 'const', constVal: 0 },
                    maxScale: { type: 'const', constVal: 100 },
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'text',
                    },
                    false: undefined,
                },
                headline: {
                    type: 'const',
                    constVal: 'Shutter',
                },
                text1: {
                    true: {
                        type: 'const',
                        constVal: 'text1',
                    },
                    false: undefined,
                },
                text2: {
                    true: {
                        type: 'const',
                        constVal: 'text2',
                    },
                    false: undefined,
                },
                up: {
                    type: 'state',
                    dp: '',
                    mode: 'auto',
                    role: ['button.open.blind', 'button.open'],
                },
                down: {
                    type: 'state',
                    dp: '',
                    mode: 'auto',
                    role: ['button.close.blind', 'button.close'],
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                //valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'rgbSingle',
            type: 'light',
            dpInit: '',

            data: {
                color: {
                    true: { type: 'triggered', dp: '0_userdata.0.RGB' },
                    false: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'lightbulb' },
                        color: { type: 'const', constVal: Color.Yellow },
                    },
                    false: {
                        value: { type: 'const', constVal: 'lightbulb-outline' },
                        color: { type: 'const', constVal: Color.HMIOff },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                colorMode: { type: 'const', constVal: true },
                dimmer: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.dimmer',
                    },
                },
                entity1: {
                    // button
                    value: { type: 'triggered', dp: '0_userdata.0.example_state' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                entityInSel: undefined,
                text1: {
                    true: {
                        type: 'const',
                        constVal: 'Licht',
                    },
                    false: undefined,
                },
                text2: {
                    true: {
                        type: 'const',
                        constVal: 'Picker1',
                    },
                    false: undefined,
                },
                text3: {
                    true: {
                        type: 'const',
                        constVal: 'Picker2',
                    },
                    false: undefined,
                },
                ct: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.ct',
                    },
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                headline: { type: 'const', constVal: 'insel' },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityInSel: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'music' },
                        color: { type: 'const', constVal: Color.Gray },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: { type: 'const', constVal: 'Navbutton' },
                    false: undefined,
                },
                setNavi: {
                    type: 'const',
                    constVal: '3',
                },
            },
        },
        {
            role: 'text.list',
            type: 'text',
            dpInit: '',

            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        text: { value: { type: 'const', constVal: '22.2' } },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
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
                    true: { type: 'const', constVal: 'text1' },
                    false: undefined,
                },
            },
        },
    ],
    items: undefined,
};
const pageGridTest4: pages.PageBaseConfig = {
    //type: 'sonstiges',
    //card: 'cardGrid',
    dpInit: '',

    alwaysOn: 'none',
    uniqueID: 'grid4',
    useColor: false,
    config: {
        card: 'cardGrid',
        data: {
            headline: {
                type: 'const',
                constVal: 'Überschrift2',
            },
        },
    },
    items: undefined,
    pageItems: [
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityInSel: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'account' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
    ],
};
const pageGrid2Test3: pages.PageBaseConfig = {
    //type: 'sonstiges',
    //ard: 'cardGrid2',
    dpInit: '',

    alwaysOn: 'none',
    uniqueID: 'grid3',
    useColor: false,
    config: {
        card: 'cardGrid2',
        data: {
            headline: {
                type: 'const',
                constVal: 'Überschrift Grid3',
            },
        },
    },
    items: undefined,
    pageItems: [
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityInSel: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityInSel: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityInSel: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityInSel: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'home' },
                        color: { type: 'const', constVal: Color.Green },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
    ],
};
const pageThermoTest: pages.PageBaseConfig = {
    //card: 'cardThermo',

    uniqueID: 'thermo1',
    dpInit: '',
    alwaysOn: 'none',
    pageItems: [
        {
            role: '',
            type: 'button',
            dpInit: '',
            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-right' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.example_state',
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                entityInSel: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.statesTest',
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                headline: {
                    type: 'const',
                    constVal: 'Test',
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                //valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                //setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                entityInSel: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.statesTest',
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                headline: {
                    type: 'const',
                    constVal: 'Test',
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                //valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                //setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                entityInSel: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.statesTest',
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                headline: {
                    type: 'const',
                    constVal: 'Test',
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                //valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                //setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                entityInSel: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.statesTest',
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                headline: {
                    type: 'const',
                    constVal: 'Test',
                },
                /**
                 * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                 */
                //valueList: { type: 'const', constVal: 'home?butter' },
                /**
                 * setList: {id:Datenpunkt, value: zu setzender Wert}[] bzw. stringify  oder ein String nach dem Muster datenpunkt?Wert|Datenpunkt?Wert {input_sel}
                 */
                //setList: { type: 'const', constVal: '0_userdata.0.test?1|0_userdata.0.test?2' },
            },
        },
        {
            role: 'button',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'arrow-up' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'indicator',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: { type: 'state', dp: '0_userdata.0.example_state' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'indicator',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: { type: 'state', dp: '0_userdata.0.example_state' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'indicator',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: { type: 'state', dp: '0_userdata.0.example_state' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'indicator',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: { type: 'state', dp: '0_userdata.0.example_state' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'indicator',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: { type: 'state', dp: '0_userdata.0.example_state' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'indicator',
            type: 'button',
            dpInit: '',

            data: {
                color: {
                    true: {
                        type: 'const',
                        constVal: Color.HMIOn,
                    },
                    false: undefined,
                    scale: undefined,
                },
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Blue },
                    },
                    false: {
                        value: { type: 'const', constVal: 'fan' },
                        color: { type: 'const', constVal: Color.Red },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entity1: {
                    value: { type: 'state', dp: '0_userdata.0.example_state' },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
    ],
    config: {
        card: 'cardThermo',
        data: {
            headline: {
                type: 'const',
                constVal: 'headline',
            },
            mixed2: {
                value: {
                    type: 'const',
                    constVal: '20',
                },
            },
            unit: {
                type: 'const',
                constVal: '°C',
            },
            mixed1: {
                value: {
                    type: 'const',
                    constVal: 'H1',
                },
            },
            mixed3: {
                value: {
                    type: 'const',
                    constVal: 'H2',
                },
            },
            minTemp: {
                type: 'const',
                constVal: '10',
            },
            maxTemp: {
                type: 'const',
                constVal: '60',
            },
            tempStep: {
                type: 'const',
                constVal: '5',
            },
            set1: { type: 'state', dp: '0_userdata.0.number1' },
            mixed4: {
                value: {
                    type: 'const',
                    constVal: '20',
                },
            },
        },
    },
    items: undefined,
    useColor: false,
};
const pageAlarmTest: pages.PageBaseConfig = {
    //card: 'cardAlarm',
    uniqueID: 'alarm1',
    alwaysOn: 'none',
    dpInit: '',
    pageItems: [],
    config: {
        card: 'cardAlarm',
        data: {
            headline: undefined,
            entity1: undefined,
            button1: undefined,
            button2: undefined,
            button3: undefined,
            button4: undefined,
            icon: undefined,
            pin: { type: 'const', constVal: '12345' },
            approved: { type: 'triggered', dp: '0_userdata.0.example_state_boolean2', change: 'ts' },
        },
    },
};
const pageUnlockTest: pages.PageBaseConfig = {
    //card: 'cardAlarm',
    uniqueID: 'unlock1',
    alwaysOn: 'always',
    dpInit: '',
    pageItems: [],
    config: {
        card: 'cardAlarm',
        data: {
            alarmType: { type: 'const', constVal: 'unlock' },
            headline: { type: 'const', constVal: 'Unlock' },
            entity1: undefined,
            button1: undefined,
            button2: undefined,
            button3: undefined,
            button4: undefined,
            icon: undefined,
            pin: { type: 'const', constVal: '12345' },
            setNavi: { type: 'const', constVal: 'entities3' },
        },
    },
};
export const popupTest: pages.PageBaseConfig = {
    //card: 'popupNotify',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: 'popup1',
    useColor: false,
    config: {
        card: 'popupNotify',
        data: {
            entity1: { value: { type: 'triggered', dp: '0_userdata.0.example_state_boolean' } },
            headline: { type: 'const', constVal: 'test' },
            colorHeadline: { true: { color: { type: 'const', constVal: '#F80000' } } },
            buttonLeft: { type: 'const', constVal: 'test' },
            colorButtonLeft: { true: { color: { type: 'const', constVal: Color.Green } } },
            buttonRight: { type: 'const', constVal: 'test' },
            colorButtonRight: { true: { color: { type: 'const', constVal: Color.White } } },
            text: { type: 'const', constVal: 'Text Test ${pl}' },
            //text: { type: 'state', dp: '0_userdata.0.NSPanel.Flur.popupNotify.popupNotifyText' },
            colorText: { true: { color: { type: 'const', constVal: Color.White } } },
            timeout: { type: 'const', constVal: 4 },
            // {placeholder: {text: '' oder dp: ''}} im Text muss dann ${dieserKeyStehtImText} stehen
            // optionalValue: { type: 'const', constVal: { dieserKeyStehtImText: { text: 'das ist ein placeholder' } } },
            setValue1: { type: 'const', constVal: true }, // alleine ist es ein switch
            closingBehaviour: { type: 'const', constVal: 'both' },
            //setValue2: { type: 'const', constVal: true }, // mit setValue2 wird 1, bei yes und 2 bei no auf true gesetzt
        },
    },
    pageItems: [],
    items: undefined,
};
const pageScreensaverTest: pages.PageBaseConfig = {
    //card: 'screensaver2',
    // mode of screensaver
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: 'scr',
    useColor: false,
    config: {
        card: 'screensaver2',
        mode: 'advanced',
        rotationTime: 0,
        model: 'eu',
        data: undefined,
    },

    // Config of Entitys
    pageItems: [
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'favorit',
            data: {
                entity2: {
                    value: { type: 'triggered', dp: 'accuweather.0.Current.Temperature' },
                    decimal: {
                        type: 'const',
                        constVal: null,
                    },
                    factor: undefined,
                    unit: {
                        type: 'const',
                        constVal: '°C',
                    },
                },

                icon: {
                    true: {
                        value: {
                            type: 'state',

                            /**
                             * How to use
                             * this run its own this. U dont have accress to variables that no definied for this.
                             * Color: in a import of color.ts
                             * val: is the incoming value - raw
                             *
                             * The best thing is to write the function with () => { here }. Then remove the () => {}
                             * and convert it into a template literal, using ``. A return is mandatory.
                             */
                            read: `{
                        switch (val) {
                            case 30: // Hot
                                return 'weather-sunny-alert'; // exceptional

                            case 24: // Ice
                            case 31: // Cold
                                return 'snowflake-alert'; // exceptional

                            case 7: // Cloudy
                            case 8: // Dreary (Overcast)
                            case 38: // Mostly Cloudy
                                return 'weather-cloudy'; // cloudy

                            case 11: // fog
                                return 'weather-fog'; // fog

                            case 25: // Sleet
                                return 'weather-hail'; // Hail

                            case 15: // T-Storms
                                return 'weather-lightning'; // lightning

                            case 16: // Mostly Cloudy w/ T-Storms
                            case 17: // Partly Sunny w/ T-Storms
                            case 41: // Partly Cloudy w/ T-Storms
                            case 42: // Mostly Cloudy w/ T-Storms
                                return 'weather-lightning-rainy'; // lightning-rainy

                            case 33: // Clear
                            case 34: // Mostly Clear
                            case 37: // Hazy Moonlight
                                return 'weather-night';

                            case 3: // Partly Sunny
                            case 4: // Intermittent Clouds
                            case 6: // Mostly Cloudy
                            case 35: // Partly Cloudy
                            case 36: // Intermittent Clouds
                                return 'weather-partly-cloudy'; // partlycloudy

                            case 18: // pouring
                                return 'weather-pouring'; // pouring

                            case 12: // Showers
                            case 13: // Mostly Cloudy w/ Showers
                            case 14: // Partly Sunny w/ Showers
                            case 26: // Freezing Rain
                            case 39: // Partly Cloudy w/ Showers
                            case 40: // Mostly Cloudy w/ Showers
                                return 'weather-rainy'; // rainy

                            case 19: // Flurries
                            case 20: // Mostly Cloudy w/ Flurries
                            case 21: // Partly Sunny w/ Flurries
                            case 22: // Snow
                            case 23: // Mostly Cloudy w/ Snow
                            case 43: // Mostly Cloudy w/ Flurries
                            case 44: // Mostly Cloudy w/ Snow
                                return 'weather-snowy'; // snowy

                            case 29: // Rain and Snow
                                return 'weather-snowy-rainy'; // snowy-rainy

                            case 1: // Sunny
                            case 2: // Mostly Sunny
                            case 5: // Hazy Sunshine
                                return 'weather-sunny'; // sunny

                            case 32: // windy
                                return 'weather-windy'; // windy

                            default:
                                return 'alert-circle-outline';
                        }
                    }`,

                            dp: 'accuweather.0.Current.WeatherIcon',
                        },
                        color: {
                            type: 'triggered',
                            dp: 'accuweather.0.Current.WeatherIcon',
                            read: `switch (val) {
                        case 24: // Ice
                        case 30: // Hot
                        case 31: // Cold
                            return Color.swExceptional; // exceptional

                        case 7: // Cloudy
                        case 8: // Dreary (Overcast)
                        case 38: // Mostly Cloudy
                            return Color.swCloudy; // cloudy

                        case 11: // fog
                            return Color.swFog; // fog

                        case 25: // Sleet
                            return Color.swHail; // Hail

                        case 15: // T-Storms
                            return Color.swLightning; // lightning

                        case 16: // Mostly Cloudy w/ T-Storms
                        case 17: // Partly Sunny w/ T-Storms
                        case 41: // Partly Cloudy w/ T-Storms
                        case 42: // Mostly Cloudy w/ T-Storms
                            return Color.swLightningRainy; // lightning-rainy

                        case 33: // Clear
                        case 34: // Mostly Clear
                        case 37: // Hazy Moonlight
                            return Color.swClearNight;

                        case 3: // Partly Sunny
                        case 4: // Intermittent Clouds
                        case 6: // Mostly Cloudy
                        case 35: // Partly Cloudy
                        case 36: // Intermittent Clouds
                            return Color.swPartlycloudy; // partlycloudy

                        case 18: // pouring
                            return Color.swPouring; // pouring

                        case 12: // Showers
                        case 13: // Mostly Cloudy w/ Showers
                        case 14: // Partly Sunny w/ Showers
                        case 26: // Freezing Rain
                        case 39: // Partly Cloudy w/ Showers
                        case 40: // Mostly Cloudy w/ Showers
                            return Color.swRainy; // rainy

                        case 19: // Flurries
                        case 20: // Mostly Cloudy w/ Flurries
                        case 21: // Partly Sunny w/ Flurries
                        case 22: // Snow
                        case 23: // Mostly Cloudy w/ Snow
                        case 43: // Mostly Cloudy w/ Flurries
                        case 44: // Mostly Cloudy w/ Snow
                            return Color.swSnowy; // snowy

                        case 29: // Rain and Snow
                            return Color.swSnowyRainy; // snowy-rainy

                        case 1: // Sunny
                        case 2: // Mostly Sunny
                        case 5: // Hazy Sunshine
                            return Color.swSunny; // sunny

                        case 32: // windy
                            return Color.swWindy; // windy

                        default:
                            return Color.White;
                    }`,
                        },
                    },
                    false: { value: undefined, color: undefined },
                },

                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'left',
            data: {
                entity2: {
                    value: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindSpeed',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 1,
                    },
                    factor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    unit: {
                        type: 'const',
                        constVal: 'm/s',
                    },
                },

                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'weather-windy',
                        },
                        color: undefined,
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },

                    scale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 80 },
                    },
                    maxBri: undefined,
                    minBri: undefined,
                },

                text: {
                    true: {
                        type: 'const',
                        constVal: 'Wind',
                    },
                    false: undefined,
                },
            },
        },
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'left',
            data: {
                entity2: {
                    value: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindSpeed',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 1,
                    },
                    factor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    unit: {
                        type: 'const',
                        constVal: 'm/s',
                    },
                },

                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'weather-windy',
                        },
                        color: undefined,
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },

                    scale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 80 },
                    },
                    maxBri: undefined,
                    minBri: undefined,
                },

                text: {
                    true: {
                        type: 'const',
                        constVal: 'Wind',
                    },
                    false: undefined,
                },
            },
        },
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'left',
            data: {
                entity2: {
                    value: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindGust',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 1,
                    },
                    factor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    unit: {
                        type: 'const',
                        constVal: 'm/s',
                    },
                },

                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'weather-tornado',
                        },
                        color: undefined,
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },

                    scale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 7.2 },
                    },
                    maxBri: undefined,
                    minBri: undefined,
                },

                text: {
                    true: {
                        type: 'const',
                        constVal: 'Böen',
                    },
                    false: undefined,
                },
            },
        },
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'left',
            data: {
                entity2: {
                    value: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindDirectionText',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 0,
                    },
                    factor: undefined,
                    unit: {
                        type: 'const',
                        constVal: '°',
                    },
                },

                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'windsock',
                        },
                        color: {
                            type: 'state',
                            dp: '0_userdata.0.dimmer',
                        },
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },

                text: {
                    true: {
                        type: 'const',
                        constVal: 'Windr.',
                    },
                    false: undefined,
                },
            },
        },
        // Bottom 1 - accuWeather.0. Forecast Day 1
        {
            template: 'text.accuweather.sunriseset',
            dpInit: '/^accuweather\\.0.Daily.+/',
            modeScr: 'bottom',
        },
        // Bottom 1 - accuWeather.0. Forecast Day 1
        {
            template: 'text.accuweather.bot2values',
            dpInit: '/^accuweather\\.0.+?d1$/g',
            modeScr: 'bottom',
        },

        // Bottom 2 - accuWeather.0. Forecast Day 2
        {
            template: 'text.accuweather.bot2values',
            dpInit: /^accuweather\.0.+?d2$/,
            modeScr: 'bottom',
        },

        // Bottom 3 - accuWeather.0. Forecast Day 3
        {
            template: 'text.accuweather.bot2values',
            dpInit: /^accuweather\.0.+?d3$/,
            modeScr: 'bottom',
        },

        // Bottom 4 - accuWeather.0. Forecast Day 4
        {
            template: 'text.accuweather.bot2values',
            dpInit: /^accuweather\.0.+?d4$/,
            modeScr: 'bottom',
        },
        // Bottom 5 - accuWeather.0. Forecast Day 5
        {
            template: 'text.accuweather.bot2values',
            dpInit: /^accuweather\.0.+?d5$/,
            modeScr: 'bottom',
        },

        // Bottom 6 - daswetter.0. Forecast Day 6

        // Bottom 7 - Sonnenaufgang - Sonnenuntergang im Wechsel
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'bottom',
            data: {
                entity1: undefined,
                entity2: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.Sunevent2.time',
                        read: 'return new Date(val).getTime()',
                        forceType: 'number',
                    },
                    dateFormat: {
                        type: 'const',
                        constVal: { local: 'de', format: { hour: '2-digit', minute: '2-digit' } },
                    },
                },
                icon: {
                    true: {
                        value: {
                            type: 'triggered',
                            dp: '0_userdata.0.Sunevent2.icon',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.MSYellow,
                        },
                    },
                    false: {
                        value: undefined,
                        color: {
                            type: 'const',
                            constVal: Color.MSYellow,
                        },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },

                text: {
                    true: {
                        type: 'const',
                        constVal: 'Sonne',
                    },
                    false: undefined,
                },
            },
        },

        // Bottom 8 - Windgeschwindigkeit
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'bottom',
            data: {
                entity1: {
                    value: {
                        type: 'triggered',
                        dp: 'accuweather.0.Current.WindSpeed',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 1,
                    },
                    factor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    unit: undefined,
                },
                entity2: {
                    value: {
                        type: 'triggered',
                        dp: 'accuweather.0.Current.WindSpeed',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 1,
                    },
                    factor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    unit: {
                        type: 'const',
                        constVal: 'm/s',
                    },
                },
                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'weather-windy',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.MSRed,
                        },
                    },
                    false: {
                        value: {
                            type: 'const',
                            constVal: 'weather-windy',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.MSGreen,
                        },
                    },
                    scale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 80 },
                    },
                    maxBri: undefined,
                    minBri: undefined,
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'Wind',
                    },
                    false: undefined,
                },
            },
        },

        // Bottom 9 - Böen
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'bottom',
            data: {
                entity1: {
                    value: {
                        type: 'triggered',
                        dp: 'accuweather.0.Current.WindGust',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 1,
                    },
                    factor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    unit: undefined,
                },
                entity2: {
                    value: {
                        type: 'triggered',
                        dp: 'accuweather.0.Current.WindGust',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 1,
                    },
                    factor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    unit: {
                        type: 'const',
                        constVal: 'm/s',
                    },
                },
                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'weather-tornado',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.MSRed,
                        },
                    },
                    false: {
                        value: {
                            type: 'const',
                            constVal: 'weather-tornado',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.MSGreen,
                        },
                    },
                    scale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 80 },
                    },
                    maxBri: undefined,
                    minBri: undefined,
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'Böen',
                    },
                    false: undefined,
                },
            },
        },

        // Bottom 10 - Windrichtung
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'bottom',
            data: {
                entity2: {
                    value: {
                        type: 'triggered',
                        dp: 'accuweather.0.Current.WindDirectionText',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 0,
                    },
                    factor: undefined,
                    unit: {
                        type: 'const',
                        constVal: '°',
                    },
                },
                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'windsock',
                        },
                        color: {
                            type: 'const',
                            constVal: '#FFFFFF',
                        },
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'Windr.',
                    },
                    false: undefined,
                },
            },
        },

        // Bottom 11 - Luftfeuchte außen
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'bottom',
            data: {
                entity1: {
                    value: {
                        type: 'triggered',
                        dp: 'hmip.0.devices.3014F711A000185F2999676C.channels.1.humidity',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 1,
                    },
                    factor: undefined,
                    unit: undefined,
                },
                entity2: {
                    value: {
                        type: 'triggered',
                        dp: 'hmip.0.devices.3014F711A000185F2999676C.channels.1.humidity',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 1,
                    },
                    factor: undefined,
                    unit: {
                        type: 'const',
                        constVal: '%',
                    },
                },
                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'water-percent',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.MSRed,
                        },
                    },
                    false: {
                        value: {
                            type: 'const',
                            constVal: 'water-percent',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.Green,
                        },
                    },
                    scale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 100, val_best: 65 },
                    },
                    maxBri: undefined,
                    minBri: undefined,
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'Feuchte',
                    },
                    false: undefined,
                },
            },
        },

        // Bottom 12 - UV-Index
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'bottom',
            data: {
                entity1: {
                    value: {
                        type: 'triggered',
                        dp: 'accuweather.0.Current.UVIndex',
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                entity2: {
                    value: {
                        type: 'triggered',
                        dp: 'accuweather.0.Current.UVIndex',
                        forceType: 'string',
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'solar-power',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.MSRed,
                        },
                    },
                    false: {
                        value: {
                            type: 'const',
                            constVal: 'solar-power',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.MSGreen,
                        },
                    },
                    scale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 9 },
                    },
                    maxBri: undefined,
                    minBri: undefined,
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'UV',
                    },
                    false: undefined,
                },
            },
        },
        {
            role: 'test',
            dpInit: '',
            type: 'text',
            modeScr: 'indicator',
            data: {
                entity1: {
                    value: {
                        type: 'const',
                        constVal: '850',
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },
                /*entity2: {
                    value: {
                        type: 'const',
                        constVal: 500,
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                },*/
                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'waves-arrow-up',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.MSGreen,
                        },
                    },
                    false: {
                        value: {
                            type: 'const',
                            constVal: 'waves-arrow-up',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.MSRed,
                        },
                    },
                    scale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 1000, val_best: 500, log10: 'max' },
                    },

                    maxBri: undefined,
                    minBri: undefined,
                },
                text: {
                    true: {
                        type: 'const',
                        constVal: 'Wasserstand',
                    },
                    false: undefined,
                },
            },
        },
        {
            type: 'text',
            dpInit: 'zigbee2mqtt.0.0x00158d00041fdbcb',
            template: 'text.battery',

            modeScr: 'indicator',
            data: {
                icon: {
                    true: {
                        text: null,
                    },
                    false: {
                        text: null,
                    },
                },
            },
        },

        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'indicator',
            data: {
                entity2: {
                    value: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindGust',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 1,
                    },
                    factor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    unit: {
                        type: 'const',
                        constVal: 'm/s',
                    },
                },

                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'weather-tornado',
                        },
                        color: undefined,
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },

                    scale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 7.2 },
                    },
                    maxBri: undefined,
                    minBri: undefined,
                },

                text: {
                    true: {
                        type: 'const',
                        constVal: 'Böen',
                    },
                    false: undefined,
                },
            },
        },

        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'indicator',
            data: {
                entity2: {
                    value: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindDirectionText',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 0,
                    },
                    factor: undefined,
                    unit: {
                        type: 'const',
                        constVal: '°',
                    },
                },

                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'windsock',
                        },
                        color: {
                            type: 'const',
                            constVal: '#FF00FF',
                        },
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },

                text: {
                    true: {
                        type: 'const',
                        constVal: 'Windr.',
                    },
                    false: undefined,
                },
            },
        },

        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'indicator',
            data: {
                entity2: {
                    value: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindSpeed',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 1,
                    },
                    factor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    unit: {
                        type: 'const',
                        constVal: 'm/s',
                    },
                },

                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'weather-windy',
                        },
                        color: undefined,
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },

                    scale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 80 },
                    },
                    maxBri: undefined,
                    minBri: undefined,
                },

                text: {
                    true: {
                        type: 'const',
                        constVal: 'Wind',
                    },
                    false: undefined,
                },
            },
        },

        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'indicator',
            data: {
                entity2: {
                    value: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindGust',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 1,
                    },
                    factor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    unit: {
                        type: 'const',
                        constVal: 'm/s',
                    },
                },

                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'weather-tornado',
                        },
                        color: undefined,
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },

                    scale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 7.2 },
                    },
                    maxBri: undefined,
                    minBri: undefined,
                },

                text: {
                    true: {
                        type: 'const',
                        constVal: 'Böen',
                    },
                    false: undefined,
                },
            },
        },
        /*{
            role: 'combined',
            dpInit: '',
            type: 'text',
            modeScr: 'mricon',
            data: {
                entity1: {
                    value: {
                        type: 'state',
                        dp: '0_userdata.0.number1',
                    },
                },
                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'heat-wave',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.MSRed,
                        },
                        text: {
                            value: {
                                type: 'state',
                                dp: '0_userdata.0.number1',
                            },
                            unit: {
                                type: 'const',
                                constVal: '°C',
                            },
                        },
                    },
                    false: {
                        value: {
                            type: 'const',
                            constVal: 'heat-wave',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.MSYellow,
                        },
                        text: {
                            value: {
                                type: 'const',
                                constVal: 'deconz.0.Sensors.5.temperature',
                            },
                            unit: {
                                type: 'const',
                                constVal: '°C',
                            },
                        },
                    },
                },
            },
        },*/
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'mricon',
            data: {
                entity1: {
                    value: {
                        type: 'internal',
                        dp: 'cmd/power1',
                    },
                },

                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'lightbulb',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.Yellow,
                        },
                    },
                    false: {
                        value: {
                            type: 'const',
                            constVal: 'lightbulb-outline',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.HMIOff,
                        },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },

                text: {
                    true: undefined,
                    false: undefined,
                },
            },
        },

        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'mricon',
            data: {
                entity1: {
                    value: {
                        type: 'internal',
                        dp: 'cmd/power2',
                    },
                },

                icon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'lightbulb',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.Yellow,
                        },
                    },
                    false: {
                        value: {
                            type: 'const',
                            constVal: 'lightbulb-outline',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.HMIOff,
                        },
                    },
                },
            },
        },
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'time',
            data: {
                entity2: {
                    value: {
                        type: 'internal',
                        dp: '///time',
                    },
                    dateFormat: {
                        type: 'const',
                        constVal: { local: 'de', format: { hour: '2-digit', minute: '2-digit' } },
                    },
                },
            },
        },
        {
            role: 'text',
            dpInit: '',
            type: 'text',
            modeScr: 'date',
            data: {
                entity2: {
                    value: {
                        type: 'internal',
                        dp: '///date',
                    },
                    dateFormat: {
                        type: 'const',
                        constVal: {
                            local: 'de',
                            format: {
                                weekday: 'long',
                                month: 'short',
                                year: 'numeric',
                                day: 'numeric',
                            },
                        },
                    },
                },
            },
        },
    ],
};

const pageFahrplanRoutes: pages.PageBaseConfig = {
    card: 'cardEntities',
    dpInit: 'fahrplan.0.0',
    uniqueID: 'fahrplanrouten',
    template: 'entities.fahrplan.routes',
};
export const Testconfig: Partial<panelConfigPartial>[] = [
    /* {
        pages: [
            pageGridTest4,
            pageEntitiesTest1,
            pagePowerTest1,
            pageThermoTest,
            pageGridTest1,
            pageGrid2Test3,
            pageGridTest2,
            pageScreensaverTest,
            //pageMediaTest,
            pageEntitiesTest2,
            pageAbfall,
            pageGridTest5,
            pageMediaTest3,
            pageAlarmTest,
            pageEntitiesTest3,
            popupTest,
            pageUnlockTest,
            pageFahrplanRoutes,
        ],
        // override by password.ts
        navigation: [
            {
                name: 'main', //main ist die erste Seite
                page: 'entities1',
                left: { single: 'grid3' }, // Die 4 bezieht sich auf den name: 4
                right: { single: '///service' },
            },
            {
                name: 'alarm1', //main ist die erste Seite
                page: 'alarm1',
                left: { single: '///service' }, // Die 4 bezieht sich auf den name: 4
                right: { single: 'abfall1', double: 'main' },
            },
            {
                name: 'abfall1', //main ist die erste Seite
                page: 'abfall1',
                left: { single: 'alarm1' }, // Die 4 bezieht sich auf den name: 4
                right: { single: 'unlock1', double: 'main' },
            },
            {
                name: 'unlock1',
                page: 'unlock1',
                left: { double: 'abfall1' }, // Die 4 bezieht sich auf den name: 4
                right: { double: 'entities3' },
            },
            {
                name: 'fahrplanrouten', //main ist die erste Seite
                page: 'fahrplanrouten',
                left: { double: 'unlock1' }, // Die 4 bezieht sich auf den name: 4
                right: { double: 'entities2' },
            },
            {
                name: 'entities2', //main ist die erste Seite
                page: 'entities2',
                left: { single: 'entities3' }, // Die 4 bezieht sich auf den name: 4
                right: { single: 'power1', double: 'main' },
            },
            {
                name: 'power1',
                page: 'power1',
                left: { single: 'entities2' }, // Die 4 bezieht sich auf den name: 4
                right: { single: 'grid4', double: 'main' },
            },
            {
                name: 'grid4', //main ist die erste Seite
                page: 'grid4',
                left: { single: 'power1' }, // Die 4 bezieht sich auf den name: 4
                right: { single: 'grid1', double: 'main' },
            },
            {
                name: 'grid1',
                left: { single: 'grid4' }, // Die 0 bezieht sich auf den name: 0
                right: { single: 'grid2' },
                page: 'grid1', // das grid1 bezieht sich auf die uniqueID oben in pages
            },
            {
                name: 'grid2',
                left: { single: 'grid1' },
                right: { single: 'media3' },
                page: 'grid2',
            },
            {
                name: 'media3',
                left: { single: 'grid2' },
                right: { single: 'grid3', double: 'main' },
                page: 'media3',
            },
            {
                name: 'grid3',
                left: { single: 'media3', double: '1' },
                right: { single: 'thermo1', double: '2' },
                page: 'grid3',
            },
            {
                name: 'thermo1',
                left: { single: 'grid3', double: '1' },
                right: { single: 'main', double: '2' },
                page: 'thermo1',
            },
        ],
        topic: 'nspanel/ns_panel4',
        name: 'Scheibtisch',
        config: {
            // dat hier hat noch keine bedeutung glaube ich :)
            momentLocale: '',
            locale: 'de-DE',
            iconBig1: false,
            iconBig2: false,
        },
        timeout: 15, // dat kommt vom Admin
        dimLow: 20,
        dimHigh: 90,
    },*/
    {
        pages: [
            pageGridTest4,
            pageEntitiesTest1,
            pagePowerTest1,
            pageThermoTest,
            pageGridTest1,
            pageGrid2Test3,
            pageGridTest2,
            pageScreensaverTest,
            //pageMediaTest,
            pageEntitiesTest2,
            pageAbfall,
            pageGridTest5,
            pageMediaTest3,
            pageAlarmTest,
            pageEntitiesTest3,
            popupTest,
            pageUnlockTest,
            pageFahrplanRoutes,
        ],
        // override by password.ts
        navigation: [
            {
                name: 'main', //main ist die erste Seite
                page: 'entities1',
                left: { single: 'grid3' }, // Die 4 bezieht sich auf den name: 4
                right: { single: '///service', double: '2' },
            },
            {
                name: 'alarm1', //main ist die erste Seite
                page: 'alarm1',
                left: { single: '///service' }, // Die 4 bezieht sich auf den name: 4
                right: { single: 'abfall1', double: 'main' },
            },
            {
                name: 'abfall1', //main ist die erste Seite
                page: 'abfall1',
                left: { single: 'alarm1' }, // Die 4 bezieht sich auf den name: 4
                right: { single: 'fahrplanrouten', double: 'main' },
            },
            {
                name: 'unlock1',
                page: 'unlock1',
                left: { double: 'abfall1' }, // Die 4 bezieht sich auf den name: 4
                right: { double: 'entities3' },
            },
            {
                name: 'fahrplanrouten', //main ist die erste Seite
                page: 'fahrplanrouten',
                left: { double: 'abfall1' }, // Die 4 bezieht sich auf den name: 4
                right: { double: 'entities2' },
            },
            {
                name: 'entities2', //main ist die erste Seite
                page: 'entities2',
                left: { single: 'entities3' }, // Die 4 bezieht sich auf den name: 4
                right: { single: 'power1', double: 'main' },
            },
            {
                name: 'power1',
                page: 'power1',
                left: { single: 'entities2' }, // Die 4 bezieht sich auf den name: 4
                right: { single: 'grid4', double: 'main' },
            },
            {
                name: 'grid4', //main ist die erste Seite
                page: 'grid4',
                left: { single: 'power1' }, // Die 4 bezieht sich auf den name: 4
                right: { single: 'grid1', double: 'main' },
            },
            {
                name: 'grid1',
                left: { single: 'grid4' }, // Die 0 bezieht sich auf den name: 0
                right: { single: 'grid2' },
                page: 'grid1', // das grid1 bezieht sich auf die uniqueID oben in pages
            },
            {
                name: 'grid2',
                left: { single: 'grid1' },
                right: { single: 'media3' },
                page: 'grid2',
            },
            {
                name: 'media3',
                left: { single: 'grid2' },
                right: { single: 'grid3', double: 'main' },
                page: 'media3',
            },
            {
                name: 'grid3',
                left: { single: 'media3', double: '1' },
                right: { single: 'thermo1', double: '2' },
                page: 'grid3',
            },
            {
                name: 'thermo1',
                left: { single: 'grid3', double: '1' },
                right: { single: 'main', double: '2' },
                page: 'thermo1',
            },
        ],
        topic: 'nspanel/ns_panel2',
        name: 'Wohnzimmer',
        config: {
            // dat hier hat noch keine bedeutung glaube ich :)
            momentLocale: '',
            locale: 'de-DE',
            iconBig1: false,
            iconBig2: false,
        },
        timeout: 15, // dat kommt vom Admin
        dimLow: 20,
        dimHigh: 90,
    },
];

/**
 * command for javascript adapter
 * sendTo('nspanel-lovelace-ui.0', 'config', Testconfig)
 */

/*
// pageType~popupNotify
export const welcomePopupPayload =
    'entityUpdateDetail~ -~Willkommen zum NSPanel~63488~~2000~~2000~' +
    '  Einen schönen Tag           ' +
    '     wünschen dir               ' +
    ' Armilar, TT-Tom, ticaki      ' +
    '   & Kuckuckmann~2000~3~1~~2000';

/*
   SendToPanel({ payload:'pageType~popupNotify'});
                    SendToPanel({ payload:'entityUpdateDetail~ -~Willkommen zum NSPanel~63488~~2000~~2000~' +
                        '  Einen schönen Tag           '+
                        '     wünschen dir               ' +
                        ' Armilar, TT-Tom, ticaki      ' +
                        '   & Kuckuckmann~2000~3~1~~2000'});*/
