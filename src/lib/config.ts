import * as pages from './types/pages';
import * as Color from './const/Color';
import { panelConfigPartial } from './controller/panel';
import { ScreensaverConfig } from './pages/screensaver';

const pageEntitiesTest1: pages.PageBaseConfig = {
    //type: 'sonstiges',
    card: 'cardEntities',
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
            /**
             * zu 100% geschlossen zu 0% geschlossen read und write mit jeweils 100-val benutzen um das zu 100% geöffnet zu ändern.
             */
            role: 'rgb',
            type: 'shutter',
            dpInit: '0_userdata.0.shutter_test',

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
                up2: {
                    type: 'state',
                    dp: '',
                    mode: 'auto',
                    role: ['button.open.tilt'],
                },
                stop2: {
                    type: 'state',
                    dp: '',
                    mode: 'auto',
                    role: ['button.stop.tilt'],
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
            role: 'rgb',
            type: 'light',
            dpInit: '',

            data: {
                color: {
                    true: { type: 'triggered', dp: '0_userdata.0.RGB', response: 'now' },
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
const pageEntitiesTest2: pages.PageBaseConfig = {
    //type: 'sonstiges',
    card: 'cardEntities',
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
    ],
    items: undefined,
};
const pagePowerTest1: pages.PageBaseConfig = {
    //type: 'sonstiges',
    card: 'cardPower',
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
                value: { type: 'const', constVal: 'bot' },
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
                    value: { type: 'const', constVal: 1 },
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
            homeIcon: {
                true: {
                    value: { type: 'const', constVal: 'home' },
                    color: undefined,
                },
                false: {
                    value: undefined,
                    color: undefined,
                },
            },
        },
    },
    items: undefined,
};
const pageMediaTest: pages.PageBaseConfig = {
    //type: 'sonstiges',
    card: 'cardMedia',
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
            titel: {
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
                setValue1: undefined,
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
                setValue1: undefined,
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
                setValue1: undefined,
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
                setValue1: undefined,
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
                setValue1: undefined,
            },
        },
    ],
    uniqueID: 'media1',
    useColor: false,
};

export const pageMediaTest2: pages.PageBaseConfig = {
    //type: 'sonstiges',
    card: 'cardMedia',
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
            titel: {
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
                setValue1: undefined,
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
                setValue1: undefined,
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
                setValue1: undefined,
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
                setValue1: undefined,
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
                setValue1: undefined,
            },
        },
    ],
    uniqueID: 'media1',
    useColor: false,
};
const pageGridTest1: pages.PageBaseConfig = {
    //type: 'sonstiges',
    card: 'cardGrid',
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
            role: 'rgb',
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
            role: 'rgb',
            type: 'light',
            dpInit: '',

            data: {
                color: {
                    true: { type: 'triggered', dp: '0_userdata.0.RGB', response: 'now' },
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
                setValue1: undefined,
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
                        text: { type: 'const', constVal: '22.2' },
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
    card: 'cardGrid',
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

                setValue1: undefined,
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
    ],
};
const pageGridTest4: pages.PageBaseConfig = {
    //type: 'sonstiges',
    card: 'cardGrid',
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

                setValue1: undefined,
            },
        },
    ],
};
const pageGrid2Test2: pages.PageBaseConfig = {
    //type: 'sonstiges',
    card: 'cardGrid2',
    dpInit: '',

    alwaysOn: 'none',
    uniqueID: 'grid3',
    useColor: false,
    config: {
        card: 'cardGrid2',
        data: {
            headline: {
                type: 'const',
                constVal: 'Überschrift',
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
                setValue1: undefined,
            },
        },
    ],
};
const pageThermoTest: pages.PageBaseConfig = {
    card: 'cardThermo',

    uniqueID: 'thermo1',
    dpInit: '',
    alwaysOn: 'none',
    pageItems: [
        {
            role: 'text.list',
            type: 'input_sel',
            dpInit: '',

            data: {
                entityInSel: {
                    value: {
                        type: 'triggered',
                        dp: '0_userdata.0.statesTest',
                        response: 'now',
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
                setValue1: undefined,
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
                setValue1: { type: 'triggered', dp: '0_userdata.0.example_state' },
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
            current: {
                type: 'const',
                constVal: '20',
            },
            unit: {
                type: 'const',
                constVal: '°C',
            },
            text1: {
                type: 'const',
                constVal: 'text1',
            },
            text2: {
                type: 'const',
                constVal: 'text2',
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
            //set2: { type: 'state', dp: '0_userdata.0.number2' },
        },
    },
    items: undefined,
    useColor: false,
};
const pageScreensaverTest: ScreensaverConfig = {
    card: 'screensaver',
    // mode of screensaver
    mode: 'advanced',
    // in 0 no rotation otherwise < 3 sec = 3 sec for testing -
    rotationTime: 0,
    // Config of Entitys
    entitysConfig: {
        favoritEntity: [
            {
                entityIconSelect: undefined,
                entityValue: {
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
                entityDateFormat: {
                    type: 'const',
                    constVal: null,
                },

                entityIcon: {
                    true: {
                        value: {
                            type: 'state',

                            /** How to use
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

                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },

                entityText: {
                    true: undefined,
                    false: undefined,
                },
            },
        ],
        leftEntity: [
            {
                entityValue: {
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
                entityDateFormat: undefined,

                entityIcon: {
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

                entityIconSelect: undefined,

                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Wind',
                    },
                    false: undefined,
                },
            },
            {
                entityValue: {
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
                entityDateFormat: undefined,
                entityIcon: {
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
                entityIconSelect: undefined,
                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Böen',
                    },
                    false: undefined,
                },
            },
            {
                entityValue: {
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
                entityDateFormat: undefined,

                entityIcon: {
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
                entityIconSelect: undefined,

                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Windr.',
                    },
                    false: undefined,
                },
            },
        ],
        bottomEntity: [
            {
                entityValue: {
                    value: {
                        type: 'state',
                        dp: 'accuweather.0.Daily.Day1.Sunrise',
                        forceType: 'string',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 0,
                    },
                    factor: {
                        type: 'const',
                        constVal: 1,
                    },
                    unit: {
                        type: 'const',
                        constVal: '°C',
                    },
                },

                entityDateFormat: {
                    type: 'const',
                    constVal: JSON.stringify({ hour: '2-digit', minute: '2-digit' }),
                },

                entityIcon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'weather-sunset-up',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.Yellow,
                        },
                    },
                    false: {
                        value: undefined,
                        color: {
                            type: 'const',
                            constVal: Color.Blue,
                        },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },

                entityIconSelect: undefined,

                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'TokenSun',
                    },
                    false: undefined,
                },
            },
            {
                entityValue: {
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
                entityDateFormat: undefined,

                entityIcon: {
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

                entityIconSelect: undefined,

                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Wind',
                    },
                    false: undefined,
                },
            },
            {
                entityValue: {
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
                entityDateFormat: undefined,
                entityIcon: {
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
                entityIconSelect: undefined,
                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Böen',
                    },
                    false: undefined,
                },
            },
            {
                entityValue: {
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
                entityDateFormat: undefined,

                entityIcon: {
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
                entityIconSelect: undefined,

                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Windr.',
                    },
                    false: undefined,
                },
            },
            {
                entityValue: {
                    value: {
                        type: 'state',
                        dp: 'accuweather.0.Current.RelativeHumidity',
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
                entityDateFormat: undefined,

                entityIcon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'water-percent',
                        },
                        color: undefined,
                    },
                    false: {
                        value: undefined,
                        color: undefined,
                    },
                    scale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 100, val_best: 65 },
                    },
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityIconSelect: undefined,

                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Feuchte.',
                    },
                    false: undefined,
                },
            },
            {
                entityValue: {
                    value: {
                        type: 'state',
                        dp: 'accuweather.0.Current.DewPoint',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 1,
                    },
                    factor: undefined,
                    unit: {
                        type: 'const',
                        constVal: '°C',
                    },
                },
                entityDateFormat: undefined,

                entityIcon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'thermometer-water',
                        },
                        color: {
                            type: 'const',
                            constVal: '#7799FF',
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
                entityIconSelect: undefined,

                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Taup.',
                    },
                    false: undefined,
                },
            },
        ],
        alternateEntity: [],
        indicatorEntity: [
            {
                entityValue: {
                    value: {
                        type: 'state',
                        dp: 'accuweather.0.Daily.Day1.Sunrise',
                        forceType: 'string',
                    },
                    decimal: {
                        type: 'const',
                        constVal: 0,
                    },
                    factor: {
                        type: 'const',
                        constVal: 1,
                    },
                    unit: {
                        type: 'const',
                        constVal: '°C',
                    },
                },

                entityDateFormat: {
                    type: 'const',
                    constVal: JSON.stringify({ hour: '2-digit', minute: '2-digit' }),
                },

                entityIcon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'weather-sunset-up',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.Yellow,
                        },
                    },
                    false: {
                        value: undefined,
                        color: {
                            type: 'const',
                            constVal: Color.Blue,
                        },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },

                entityIconSelect: undefined,

                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Sonne',
                    },
                    false: undefined,
                },
            },
            {
                entityValue: {
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
                entityDateFormat: undefined,
                entityIcon: {
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
                entityIconSelect: undefined,
                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Böen',
                    },
                    false: undefined,
                },
            },
            {
                entityValue: {
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
                entityDateFormat: undefined,

                entityIcon: {
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
                entityIconSelect: undefined,

                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Windr.',
                    },
                    false: undefined,
                },
            },
            {
                entityValue: {
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
                entityDateFormat: undefined,

                entityIcon: {
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

                entityIconSelect: undefined,

                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Wind',
                    },
                    false: undefined,
                },
            },
            {
                entityValue: {
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
                entityDateFormat: undefined,
                entityIcon: {
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
                entityIconSelect: undefined,
                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Böen',
                    },
                    false: undefined,
                },
            },
        ],
        mrIconEntity: [
            {
                entityValue: {
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
                entityDateFormat: undefined,

                entityIcon: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'windsock',
                        },
                        color: {
                            type: 'const',
                            constVal: Color.White,
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
                entityIconSelect: undefined,

                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Windr.',
                    },
                    false: undefined,
                },
            },
            {
                entityValue: {
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
                entityDateFormat: undefined,

                entityIcon: {
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
                        color: {
                            type: 'const',
                            constVal: '#FF00FF',
                        },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                entityIconSelect: undefined,

                entityText: {
                    true: {
                        type: 'const',
                        constVal: 'Windr.',
                    },
                    false: undefined,
                },
            },
        ],
    },
};

export const pageAbfall: pages.PageBaseConfig = {
    //type: 'sonstiges',
    card: 'cardEntities',
    dpInit: '0_userdata.0.Abfallkalender',
    alwaysOn: 'none',
    uniqueID: 'abfall1',
    useColor: false,
    config: {
        card: 'cardEntities',
        data: {
            headline: {
                type: 'const',
                constVal: 'Abfalltermine',
            },
        },
    },
    pageItems: [
        {
            template: 'waste-calendar.plastic',
            dpInit: '',
        },
        {
            template: 'waste-calendar.bio',
            dpInit: '',
        },
        {
            template: 'waste-calendar.house',
            dpInit: '',
        },
        {
            template: 'waste-calendar.paper',
            dpInit: '',
        },
    ],
    items: undefined,
};

export const Testconfig: Partial<panelConfigPartial> = {
    pages: [
        pageGridTest4,
        pageEntitiesTest1,
        pagePowerTest1,
        pageThermoTest,
        pageGridTest1,
        pageGrid2Test2,
        pageGridTest2,
        pageScreensaverTest,
        pageMediaTest,
        pageEntitiesTest2,
    ],
    // override by password.ts
    navigation: [
        {
            name: 'main', //main ist die erste Seite
            page: 'entities1',
            left: { single: '7' }, // Die 4 bezieht sich auf den name: 4
            right: { single: 'entities2', double: '2' },
        },
        {
            name: '5', //main ist die erste Seite
            page: 'thermo1',
            left: { single: '4' }, // Die 4 bezieht sich auf den name: 4
            right: { single: '6', double: 'main' },
        },
        {
            name: 'entities2', //main ist die erste Seite
            page: 'entities2',
            left: { single: 'main' }, // Die 4 bezieht sich auf den name: 4
            right: { single: '1', double: 'main' },
        },
        {
            name: '6',
            page: 'power1',
            left: { single: '5' }, // Die 4 bezieht sich auf den name: 4
            right: { single: '7', double: 'main' },
        },
        {
            name: '7', //main ist die erste Seite
            page: 'grid4',
            left: { single: '6' }, // Die 4 bezieht sich auf den name: 4
            right: { single: 'main', double: 'main' },
        },
        {
            name: '1',
            left: { single: 'main' }, // Die 0 bezieht sich auf den name: 0
            right: { single: '2' },
            page: 'grid1', // das grid1 bezieht sich auf die uniqueID oben in pages
        },
        {
            name: '2',
            left: { single: '1' },
            right: { single: '3' },
            page: 'grid2',
        },
        {
            name: '3',
            left: { single: '2' },
            right: { single: '4', double: 'main' },
            page: 'media1',
        },
        {
            name: '4',
            left: { single: '3', double: '1' },
            right: { single: '5', double: '2' },
            page: 'grid3',
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
    timeout: 30, // dat kommt vom Admin
    dimLow: 20,
    dimHigh: 90,
};

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
