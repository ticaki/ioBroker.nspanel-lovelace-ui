

namespace Color {
    export type RGB = {
        r: number;
        g: number;
        b: number;
    };
    export const HMIOff: RGB = {r: 68, g: 115, b: 158}; // Blue-Off - Original Entity Off
    export const HMIOn: RGB = {r: 3, g: 169, b: 244}; // Blue-On
    export const HMIDark: RGB = {r: 29, g: 29, b: 29}; // Original Background Color
    export const Off: RGB = {r: 253, g: 128, b: 0}; // Orange-Off - nicer color transitions
    export const On: RGB = {r: 253, g: 216, b: 53};
    export const MSRed: RGB = {r: 251, g: 105, b: 98};
    export const MSYellow: RGB = {r: 255, g: 235, b: 156};
    export const MSGreen: RGB = {r: 121, g: 222, b: 121};
    export const Red: RGB = {r: 255, g: 0, b: 0};
    export const White: RGB = {r: 255, g: 255, b: 255};
    export const Yellow: RGB = {r: 255, g: 255, b: 0};
    export const Green: RGB = {r: 0, g: 255, b: 0};
    export const Blue: RGB = {r: 0, g: 0, b: 255};
    export const DarkBlue: RGB = {r: 0, g: 0, b: 136};
    export const Gray: RGB = {r: 136, g: 136, b: 136};
    export const Black: RGB = {r: 0, g: 0, b: 0};
    export const Cyan: RGB = {r: 0, g: 255, b: 255};
    export const Magenta: RGB = {r: 255, g: 0, b: 255};
    export const colorSpotify: RGB = {r: 30, g: 215, b: 96};
    export const colorAlexa: RGB = {r: 49, g: 196, b: 243};
    export const colorSonos: RGB = {r: 216, g: 161, b: 88};
    export const colorRadio: RGB = {r: 255, g: 127, b: 0};
    export const BatteryFull: RGB = {r: 96, g: 176, b: 62};
    export const BatteryEmpty: RGB = {r: 179, g: 45, b: 25};

    //Menu Icon Colors
    export const Menu: RGB = {r: 150, g: 150, b: 100};
    export const MenuLowInd: RGB = {r: 255, g: 235, b: 156};
    export const MenuHighInd: RGB = {r: 251, g: 105, b: 98};

    //Dynamische Indikatoren (Abstufung grün nach gelb nach rot)
    export const colorScale0: RGB = {r: 99, g: 190, b: 123};
    export const colorScale1: RGB = {r: 129, g: 199, b: 126};
    export const colorScale2: RGB = {r: 161, g: 208, b: 127};
    export const colorScale3: RGB = {r: 129, g: 217, b: 126};
    export const colorScale4: RGB = {r: 222, g: 226, b: 131};
    export const colorScale5: RGB = {r: 254, g: 235, b: 132};
    export const colorScale6: RGB = {r: 255, g: 210, b: 129};
    export const colorScale7: RGB = {r: 251, g: 185, b: 124};
    export const colorScale8: RGB = {r: 251, g: 158, b: 117};
    export const colorScale9: RGB = {r: 248, g: 131, b: 111};
    export const colorScale10: RGB = {r: 248, g: 105, b: 107};

    //Screensaver Default Theme Colors
    export const scbackground: RGB = {r: 0, g: 0, b: 0};
    export const scbackgroundInd1: RGB = {r: 255, g: 0, b: 0};
    export const scbackgroundInd2: RGB = {r: 121, g: 222, b: 121};
    export const scbackgroundInd3: RGB = {r: 255, g: 255, b: 0};
    export const sctime: RGB = {r: 255, g: 255, b: 255};
    export const sctimeAMPM: RGB = {r: 255, g: 255, b: 255};
    export const scdate: RGB = {r: 255, g: 255, b: 255};
    export const sctMainIcon: RGB = {r: 255, g: 255, b: 255};
    export const sctMainText: RGB = {r: 255, g: 255, b: 255};
    export const sctForecast1: RGB = {r: 255, g: 255, b: 255};
    export const sctForecast2: RGB = {r: 255, g: 255, b: 255};
    export const sctForecast3: RGB = {r: 255, g: 255, b: 255};
    export const sctForecast4: RGB = {r: 255, g: 255, b: 255};
    export const sctF1Icon: RGB = {r: 255, g: 235, b: 156};
    export const sctF2Icon: RGB = {r: 255, g: 235, b: 156};
    export const sctF3Icon: RGB = {r: 255, g: 235, b: 156};
    export const sctF4Icon: RGB = {r: 255, g: 235, b: 156};
    export const sctForecast1Val: RGB = {r: 255, g: 255, b: 255};
    export const sctForecast2Val: RGB = {r: 255, g: 255, b: 255};
    export const sctForecast3Val: RGB = {r: 255, g: 255, b: 255};
    export const sctForecast4Val: RGB = {r: 255, g: 255, b: 255};
    export const scbar: RGB = {r: 255, g: 255, b: 255};
    export const sctMainIconAlt: RGB = {r: 255, g: 255, b: 255};
    export const sctMainTextAlt: RGB = {r: 255, g: 255, b: 255};
    export const sctTimeAdd: RGB = {r: 255, g: 255, b: 255};

    //Auto-Weather-Colors
    export const swClearNight: RGB = {r: 150, g: 150, b: 100};
    export const swCloudy: RGB = {r: 75, g: 75, b: 75};
    export const swExceptional: RGB = {r: 255, g: 50, b: 50};
    export const swFog: RGB = {r: 150, g: 150, b: 150};
    export const swHail: RGB = {r: 200, g: 200, b: 200};
    export const swLightning: RGB = {r: 200, g: 200, b: 0};
    export const swLightningRainy: RGB = {r: 200, g: 200, b: 150};
    export const swPartlycloudy: RGB = {r: 150, g: 150, b: 150};
    export const swPouring: RGB = {r: 50, g: 50, b: 255};
    export const swRainy: RGB = {r: 100, g: 100, b: 255};
    export const swSnowy: RGB = {r: 150, g: 150, b: 150};
    export const swSnowyRainy: RGB = {r: 150, g: 150, b: 255};
    export const swSunny: RGB = {r: 255, g: 255, b: 0};
    export const swWindy: RGB = {r: 150, g: 150, b: 150};
}
/**
 * command for javascript adapter
 * sendTo('nspanel-lovelace-ui.0', 'config', Testconfig)
 */


/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/*********************************************Konfiguration*****************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/

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
            role: 'rgb',
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
    card: 'popupNotify',
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
    //type: 'sonstiges',
    card: 'cardEntities',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: 'entities3',
    useColor: false,
    config: {
        card: 'cardEntities',
        data: {
            headline: {
                type: 'const',
                constVal: 'entities3',
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
    card: 'cardGrid',
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
            },
        },
    ],
};
const pageGrid2Test3: pages.PageBaseConfig = {
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
    card: 'cardAlarm',
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
export const popupTest: pages.PageBaseConfig = {
    card: 'popupNotify',
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
    card: 'screensaver2',
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
export const Testconfig: Partial<panelConfigPartial>[] = [
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
        ],
        // override by password.ts
        navigation: [
            {
                name: 'main', //main ist die erste Seite
                page: 'entities1',
                left: { single: '7' }, // Die 4 bezieht sich auf den name: 4
                right: { single: 'abfall1', double: '2' },
            },
            {
                name: '5', //main ist die erste Seite
                page: 'alarm1',
                left: { single: '4' }, // Die 4 bezieht sich auf den name: 4
                right: { single: '6', double: 'main' },
            },
            {
                name: 'abfall1', //main ist die erste Seite
                page: 'abfall1',
                left: { single: 'main' }, // Die 4 bezieht sich auf den name: 4
                right: { single: 'entities3', double: 'main' },
            },
            {
                name: 'entities3', //main ist die erste Seite
                page: 'entities3',
                left: { double: 'abfall1' }, // Die 4 bezieht sich auf den name: 4
                right: { double: 'entities2' },
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
                page: 'media3',
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

sendTo('nspanel-lovelace-ui.0', 'config', Testconfig);

/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
/***************************************************************************************************************/
type AllIcons = string
namespace pages {
    export type PageTypeCards =
        | 'cardChart'
        | 'cardLChart'
        | 'cardEntities'
        | 'cardGrid'
        | 'cardGrid2'
        | 'cardThermo'
        | 'cardMedia'
        | 'cardUnlock'
        | 'cardQR'
        | 'cardAlarm'
        | 'cardPower'
        | 'screensaver'
        | 'screensaver2'
        | 'cardBurnRec'
        | 'cardItemSpecial'
        | 'popupNotify'
        | 'popupNotify2'; // besonders, interne Card zum verwalten von pageItems
    
    /*export type PageType =
        | Types.PageChart
        | Types.PageEntities
        | Types.PageGrid
        | Types.PageGrid2
        | Types.PageThermo
        | Types.PageMedia
        | Types.PageUnlock
        | Types.PageQR
        | Types.PageAlarm
        | Types.PagePower;
    */
    export type StateRole =
        | 'value.power'
        | 'button.play'
        | 'button.pause'
        | 'button.next'
        | 'button.prev'
        | 'button.stop'
        | 'button.volume.up'
        | 'button.volume.down'
        | 'media.seek' // (common.type=number) %
        | 'media.mode.shuffle' //(common.type=number) 0 - none, 1 - all, 2 - one
        | 'media.mode.repeat' //(common.type=boolean)
        | 'media.state' //['play','stop','pause'] or [0 - pause, 1 - play, 2 - stop] or [true - playing/false - pause]
        | 'media.artist'
        | 'media.album'
        | 'media.title'
        | 'media.duration'
        | 'media.elapsed.text'
        | 'media.elapsed'
        | 'media.mute'
        | 'level.volume'
        | 'media.album'
        | 'media.playlist'
        | 'button.open.blind'
        | 'button.open'
        | 'button.close.blind'
        | 'button.close'
        | 'button.stop.blind'
        | 'button.stop'
        | 'button.open.tilt'
        | 'button.stop.tilt'
        | 'button.close.tilt'
        | 'level.tilt'
        | 'level.blind'
        | 'level.color.name'
        | 'state'
        | 'level.color.blue'
        | 'level.color.red'
        | 'level.color.green'
        | 'level.color.white'
        | 'level.brightness'
        | 'switch'
        | 'button'
        | 'sensor.window'
        | 'sensor.open'
        | 'value.temperature'
        | 'value.battery'
        | 'indicator.lowbat'
        | 'value'
        | ''
        | 'level.value'
        | 'date'
        | 'date.sunrise.forecast.0'
        | 'date.sunset.forecast.0'
        | 'date.sunrise.forecast.1'
        | 'date.sunset.forecast.1'
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | '';
    
    export type DeviceRole =
        | 'text'
        | 'socket'
        | 'light'
        | 'dimmer'
        | 'hue'
        | 'ct'
        | 'cie'
        | 'rgbSingle'
        | 'rgb'
        | 'ct'
        | 'blind'
        | 'door'
        | 'window'
        | 'gate'
        | 'motion'
        | 'buttonSensor'
        | 'button'
        | 'media.repeat'
        | 'text.list'
        | 'arrow'
        | 'spotify-playlist'
        | 'timer'
        | 'rgb.hex'
        | 'text.list'
        | 'rgb'
        | 'indicator'
        | '2values'
        | 'combined'
        | 'textNotIcon'
        | 'iconNotText'
        | 'test'
        | ''
        | 'battery'
        | '4values'; // timer with internal counter
    
    export function isStateRole(F: string | StateRole): F is StateRole {
        switch (F as StateRole) {
            case 'button.play':
            case 'button.pause':
            case 'button.next':
            case 'button.prev':
            case 'button.stop':
            case 'button.volume.up':
            case 'button.volume.down':
            case 'media.seek':
            case 'media.mode.shuffle':
            case 'media.mode.repeat':
            case 'media.state':
            case 'media.artist':
            case 'media.album':
            case 'media.title':
            case 'media.duration':
            case 'media.elapsed.text':
            case 'media.elapsed':
            case 'media.mute':
            case 'level.volume':
            case 'media.playlist':
                return true;
            default:
                return true;
        }
    }
    export function isButtonActionType(F: string | Types.ButtonActionType): F is Types.ButtonActionType {
        switch (F) {
            case 'bExit':
            case 'bUp':
            case 'bNext':
            case 'bSubNext':
            case 'bPrev':
            case 'bSubPrev':
            case 'bHome':
            case 'notifyAction':
            case 'OnOff':
            case 'button':
            case 'up':
            case 'stop':
            case 'down':
            case 'positionSlider':
            case 'tiltOpen':
            case 'tiltStop':
            case 'tiltSlider':
            case 'tiltClose':
            case 'brightnessSlider':
            case 'colorTempSlider':
            case 'colorWheel':
            case 'tempUpd':
            case 'tempUpdHighLow':
            case 'media-back':
            case 'media-pause':
            case 'media-next':
            case 'media-shuffle':
            case 'volumeSlider':
            case 'mode-speakerlist':
            case 'mode-playlist':
            case 'mode-tracklist':
            case 'mode-repeat':
            case 'mode-equalizer':
            case 'mode-seek':
            case 'mode-crossfade':
            case 'mode-favorites':
            case 'mode-insel':
            case 'media-OnOff':
            case 'timer-start':
            case 'timer-pause':
            case 'timer-cancle':
            case 'timer-finish':
            case 'hvac_action':
            case 'mode-modus1':
            case 'mode-modus2':
            case 'mode-modus3':
            case 'number-set':
            case 'mode-preset_modes':
            case 'A1':
            case 'A2':
            case 'A3':
            case 'A4':
            case 'D1':
            case 'U1':
                return true;
            default:
                console.info(F + ' is not isButtonActionType!');
                return false;
        }
    }
    
    export type PageBaseConfigTemplate =
        | {
              card: Exclude<PageTypeCards, 'screensaver' | 'screensaver2'>;
              adapter: string;
              alwaysOn: 'none' | 'always' | 'action';
              useColor?: boolean;
              pageItems: typePageItem.PageItemDataItemsOptions[];
    
              //    mediaNamespace: string;
              config:
                  | undefined
                  | cardPowerDataItemOptions
                  | cardMediaDataItemOptions
                  | cardGridDataItemOptions
                  | cardThermoDataItemOptions
                  | cardEntitiesDataItemOptions
                  | cardAlarmDataItemOptions
                  | screensaverDataItemOptions
                  | cardNotifyDataItemOptions
                  | cardNotify2DataItemOptions;
              items: undefined;
          }
        | {
              card: Extract<PageTypeCards, 'screensaver' | 'screensaver2'>;
              template: Types.PageTemplateIdent;
              adapter: string;
              alwaysOn: 'none' | 'always' | 'action';
              useColor?: boolean;
              pageItems: typePageItem.PageItemDataItemsOptions[];
    
              //    mediaNamespace: string;
              config: undefined | screensaverDataItemOptions;
              items: undefined;
          };
    
    export type AlarmButtonEvents = 'A1' | 'A2' | 'A3' | 'A4' | 'D1' | 'U1' | '';
    export type AlarmStates = 'disarmed' | 'armed' | 'arming' | 'pending' | 'triggered';
    
    export function isAlarmButtonEvent(F: any): F is AlarmButtonEvents {
        return ['A1', 'A2', 'A3', 'A4', 'D1', 'U1'].indexOf(F) !== -1;
    }
    
    export type PageBaseConfig = (
        | (
              | {
                    //    type: PlayerType;
                    card: Exclude<PageTypeCards, 'screensaver' | 'screensaver2'>;
                    uniqueID: string;
                    template?: Types.PageTemplateIdent;
                    dpInit?: string | RegExp; // ''
                    enums?: string | string[];
                    device?: string;
                    alwaysOn: 'none' | 'always' | 'action';
                    useColor?: boolean;
                    pageItems: typePageItem.PageItemDataItemsOptions[];
                    //    mediaNamespace: string;
                    config:
                        | undefined
                        | cardPowerDataItemOptions
                        | cardMediaDataItemOptions
                        | cardGridDataItemOptions
                        | cardThermoDataItemOptions
                        | cardEntitiesDataItemOptions
                        | cardAlarmDataItemOptions
                        | cardNotifyDataItemOptions
                        | cardNotify2DataItemOptions;
                }
              | {
                    //    type: PlayerType;
                    card: Extract<PageTypeCards, 'screensaver' | 'screensaver2'>;
                    uniqueID: string;
                    template?: Types.PageTemplateIdent;
                    dpInit: string | RegExp; // ''
                    enums?: string | string[];
                    alwaysOn: 'none' | 'always' | 'action';
                    device?: string;
                    useColor?: boolean;
                    pageItems: typePageItem.PageItemDataItemsOptions[];
                    /*&
                        Required<Pick<typePageItem.PageItemDataItemsOptions, 'modeScr'>>*/
    
                    //    mediaNamespace: string;
                    config: undefined | screensaverDataItemOptions;
                }
          )
        | ({
              card: PageTypeCards;
              uniqueID: string;
              template: Types.PageTemplateIdent;
              dpInit: string | RegExp;
          } & Partial<Omit<PageBaseConfigTemplate, 'template'>>)
    ) & {
        items?:
            | undefined
            | cardEntitiesDataItems
            | cardPowerDataItems
            | cardMediaDataItems
            | cardGridDataItems
            | cardThermoDataItems
            | cardAlarmDataItems
            | cardNotifyDataItems
            | cardNotify2DataItems;
    };
    type PageNotifyConfig = {
        headline: string;
        entity1?: typePageItem.ValueEntryType;
        colorHeadline: typePageItem.ColorEntryTypeNew;
        buttonLeft: string;
        colorButtonLeft: typePageItem.ColorEntryTypeNew;
        buttonRight: string;
        colorButtonRight: typePageItem.ColorEntryTypeNew;
        text: string;
        colorText: typePageItem.ColorEntryTypeNew;
        timeout: number;
        optionalValue?: string;
        setValue1?: string;
        setValue2?: string;
        closingBehaviour?: string;
    };
    export type cardNotifyDataItemOptions = {
        card: 'popupNotify';
        data: ChangeTypeOfKeys<PageNotifyConfig, Types.DataItemsOptions | undefined>;
    };
    
    export type closingBehaviour = 'both' | 'yes' | 'no' | 'none';
    export function isClosingBehavior(F: any): F is closingBehaviour {
        return ['both', 'yes', 'no', 'none'].indexOf(F) !== -1;
    }
    export type cardNotifyDataItems = {
        card: 'popupNotify';
        data: ChangeTypeOfKeys<PageNotifyConfig, dataItem.Dataitem | undefined>;
    };
    
    type PageNotify2Config = {
        textSize: string;
        icon: typePageItem.IconEntryType;
    } & PageNotifyConfig;
    
    export type cardNotify2DataItemOptions = {
        card: 'popupNotify2';
        data: ChangeTypeOfKeys<PageNotify2Config, Types.DataItemsOptions | undefined>;
    };
    export type cardNotify2DataItems = {
        card: 'popupNotify2';
        data: ChangeTypeOfKeys<PageNotify2Config, dataItem.Dataitem | undefined>;
    };
    
    type PageAlarmPowerConfig = {
        headline: string;
        entity1: typePageItem.ValueEntryType;
        button1: string;
        button2: string;
        button3: string;
        button4: string;
        icon: typePageItem.IconEntryType;
        pin: number;
        approved?: boolean;
    };
    export type cardAlarmDataItemOptions = {
        card: 'cardAlarm';
        data: ChangeTypeOfKeys<PageAlarmPowerConfig, Types.DataItemsOptions | undefined>;
    };
    export type cardAlarmDataItems = {
        card: 'cardAlarm';
        data: ChangeTypeOfKeys<PageAlarmPowerConfig, dataItem.Dataitem | undefined>;
    };
    
    export type cardPowerDataItemOptions = {
        card: 'cardPower';
        data: ChangeTypeOfKeys<PageGridPowerConfig, Types.DataItemsOptions | undefined>;
    };
    export type cardPowerDataItems = {
        card: 'cardPower';
        data: ChangeTypeOfKeys<PageGridPowerConfig, dataItem.Dataitem | undefined>;
    };
    
    export type cardGridDataItemOptions = {
        card: 'cardGrid' | 'cardGrid2';
        data: ChangeTypeOfKeys<PageGridBaseConfig, Types.DataItemsOptions | undefined>;
    };
    export type cardGridDataItems = {
        card: 'cardGrid' | 'cardGrid2';
        data: ChangeTypeOfKeys<PageGridBaseConfig, dataItem.Dataitem | undefined>;
    };
    
    export type cardEntitiesDataItemOptions = {
        card: 'cardEntities';
        data: ChangeTypeOfKeys<PageEntitiesBaseConfig, Types.DataItemsOptions | undefined>;
    };
    export type cardEntitiesDataItems = {
        card: 'cardEntities';
        data: ChangeTypeOfKeys<PageEntitiesBaseConfig, dataItem.Dataitem | undefined>;
    };
    
    export type cardThermoDataItemOptions = {
        card: 'cardThermo';
        data: ChangeTypeOfKeys<PageThermoBaseConfig, Types.DataItemsOptions | undefined>;
    };
    export type cardThermoDataItems = {
        card: 'cardThermo';
        data: ChangeTypeOfKeys<PageThermoBaseConfig, dataItem.Dataitem | undefined>;
    };
    
    export type cardMediaDataItemOptions = {
        card: 'cardMedia';
        data: ChangeTypeOfKeys<PageMediaBaseConfig, Types.DataItemsOptions | undefined> & { logo: toolboxItem | undefined };
    };
    
    export type cardMediaDataItems = {
        card: 'cardMedia';
        data: ChangeTypeOfKeys<PageMediaBaseConfig, dataItem.Dataitem | undefined> & {
            toolbox: (toolboxItemDataItem | undefined)[];
        } & { logo: toolboxItemDataItem | undefined };
    };
    
    export type screensaverDataItemOptions = {
        card: 'screensaver' | 'screensaver2';
        mode: Types.ScreensaverModeType;
        rotationTime: number;
        model: Types.NSpanelModel;
        data: undefined;
    };
    
    export type ChangeDeepPartial<Obj> = Obj extends
        | object
        | listItem
        | PageTypeCards
        | typePageItem.IconBoolean
        | typePageItem.TextEntryType
        | typePageItem.ValueEntryType
        | typePageItem.IconEntryType
        | typePageItem.ScaledNumberType
        | PageGridPowerConfigElement
        | Color.RGB
        | typePageItem.ColorEntryType
        | PageMediaBaseConfig
        | Types.SerialTypePageElements
        ? Obj extends Types.DataItemsOptions
            ? Types.DataItemsOptions | null
            : {
                  [K in keyof Obj]?: ChangeDeepPartial<Obj[K]> | null;
              }
        : Types.DataItemsOptions | null;
    
    export type ChangeTypeOfKeys<Obj, N> = Obj extends
        | object
        | listItem
        | PageTypeCards
        | typePageItem.IconBoolean
        | typePageItem.TextEntryType
        | typePageItem.ValueEntryType
        | typePageItem.IconEntryType
        | typePageItem.ScaledNumberType
        | PageGridPowerConfigElement
        | Color.RGB
        | typePageItem.ColorEntryType
        | PageMediaBaseConfig
        | Types.SerialTypePageElements
        ? Obj extends Color.RGB | Types.IconScaleElement | Types.DataItemsOptions
            ? N
            : {
                  [K in keyof Obj]: ChangeTypeOfKeys<Obj[K], N>;
              }
        : N;
    
    /*export type DeepPartial<Obj, N> = Obj extends
        | object
        | listItem
        | PageTypeCards
        | IconBoolean
        | TextEntryType
        | ValueEntryType
        | IconEntryType
        | ScaledNumberType
        | PageGridPowerConfigElement
        | RGB
        | ColorEntryType
        | PageMediaBaseConfig
        | Types.SerialTypePageElements
        ? Obj extends Dataitem
            ? Dataitem
            : {
                  [K in keyof Obj]+?: ChangeTypeOfKeys<Obj[K], N>;
              }
        : Dataitem;*/
    
    type PageMediaBaseConfig = {
        headline: string;
        alwaysOnDisplay: boolean;
        album: string;
        title: listItem;
        duration: string;
        elapsed: string;
        artist: listItem;
        shuffle: typePageItem.ScaledNumberType;
        volume: typePageItem.ScaledNumberType;
        icon: string;
        play: string;
        mediaState: string;
        stop: string;
        pause: string;
        forward: string;
        backward: string;
    };
    
    type PageGridBaseConfig = {
        headline: string;
    };
    
    type PageEntitiesBaseConfig = {
        headline: string;
    };
    
    type PageGridPowerConfig = {
        headline: string;
        homeValueTop: typePageItem.ValueEntryType;
        homeIcon: typePageItem.IconEntryType;
        homeValueBot: typePageItem.ValueEntryType;
        leftTop: PageGridPowerConfigElement;
        leftMiddle: PageGridPowerConfigElement;
        leftBottom: PageGridPowerConfigElement;
        rightTop: PageGridPowerConfigElement;
        rightMiddle: PageGridPowerConfigElement;
        rightBottom: PageGridPowerConfigElement;
    };
    
    export type PageGridPowerConfigElement =
        | {
              icon?: typePageItem.IconEntryType;
              value?: typePageItem.ValueEntryType;
              speed?: typePageItem.ScaledNumberType;
              text?: typePageItem.TextEntryType;
          }
        | undefined;
    
    type PageThermoBaseConfig = {
        auto?: boolean;
        boost?: boolean;
        error?: boolean;
        humidity?: number;
        manual?: boolean;
        //mode?: string;
        party?: boolean;
        unreach?: boolean;
        windowopen?: boolean;
        cool?: boolean;
        heat?: boolean;
        lowbat?: boolean;
        maintain?: boolean;
        power?: boolean;
        set1: boolean;
        set2?: boolean;
        speed?: number;
        swing?: number;
        unit: string;
        headline: string;
        mixed1: typePageItem.ValueEntryType;
        mixed2: typePageItem.ValueEntryType;
        mixed3: typePageItem.ValueEntryType;
        mixed4: typePageItem.ValueEntryType;
        minTemp: number; // *10
        maxTemp: number; // *10
        tempStep: number; // *10
        icon?: string;
        color?: string;
    };
    export function isColorEntryType(F: object | typePageItem.ColorEntryType): F is typePageItem.ColorEntryType {
        if ('true' in F && 'false' in F && 'scale' in F) return true;
        return false;
    }
    export type PageMediaBaseConfigWrite = {
        pplay: writeItem;
        pause: writeItem;
        forward: writeItem;
        backward: writeItem;
        stop: writeItem;
        off: writeItem;
        shuffle: writeItem;
        tracklist: writeItem;
        playlist: writeItem;
        equalizerList: writeItem;
        repeat: writeItem;
        toolstring: writeItem;
    };
    export type PageMediaMessage = {
        event: 'entityUpd';
        headline: string;
        navigation: string;
        id: string;
        name: string;
        titelColor: string;
        artist: string;
        artistColor: string;
        volume: string;
        iconplaypause: AllIcons;
        onoffbuttonColor: string;
        shuffle_icon: AllIcons;
        logo: string;
        options: [string?, string?, string?, string?, string?];
    };
    
    export type PagePowerMessage = {
        event: 'entityUpd';
        headline: string;
        navigation: string;
        homeValueTop: string;
        homeIcon: string;
        homeColor: string;
        homeName: string;
        homeValueBot: string;
        leftTop: PagePowerMessageItem;
        leftMiddle: PagePowerMessageItem;
        leftBottom: PagePowerMessageItem;
        rightTop: PagePowerMessageItem;
        rightMiddle: PagePowerMessageItem;
        rightBottom: PagePowerMessageItem;
    };
    
    export type PageAlarmMessage = {
        event: 'entityUpd';
        intNameEntity: string;
        headline: string;
        navigation: string;
        button1: string;
        status1: AlarmButtonEvents;
        button2: string;
        status2: AlarmButtonEvents;
        button3: string;
        status3: AlarmButtonEvents;
        button4: string;
        status4: AlarmButtonEvents;
        icon: string;
        iconColor: string;
        numpad: 'enable' | 'disable';
        flashing: 'enable' | 'disable';
    };
    
    export type PagePowerMessageItem = {
        icon: string;
        iconColor: string;
        name: string;
        value: string;
        speed: number;
    };
    
    export type PageGridMessage = {
        event: 'entityUpd';
        headline: string;
        navigation: string;
        options: [string?, string?, string?, string?, string?, string?, string?, string?];
    };
    
    export type PageNotifyMessage = {
        event: 'entityUpd';
        headline: string;
        hColor: string;
        blText: string;
        blColor: string;
        brText: string;
        brColor: string;
        text: string;
        textColor: string;
        timeout: number;
        fontSet: string;
        icon: string;
        iconColor: string;
        placeholder: string;
    };
    /*+ getState(popupNotifyInternalName).val + '~'
                    + heading + '~'
                    + v_popupNotifyHeadingColor + '~'
                    + getState(popupNotifyButton1Text).val + '~'
                    + v_popupNotifyButton1TextColor + '~'
                    + getState(popupNotifyButton2Text).val + '~'
                    + v_popupNotifyButton2TextColor + '~'
                    + text + '~'
                    + v_popupNotifyTextColor + '~'
                    + getState(popupNotifySleepTimeout).val;*/
    export type screensaverMessage = {
        options: Record<Types.ScreenSaverPlaces, string[]>;
    };
    
    export type PageEntitiesMessage = {
        event: 'entityUpd';
        headline: string;
        navigation: string;
        options: [string?, string?, string?, string?, string?, string?, string?, string?];
    };
    
    export type PageThermoMessage = {
        event: 'entityUpd';
        headline: string;
        intNameEntity: string;
        navigation: string;
        currentTemp: number | string;
        dstTemp: number | string; // *10
        status: string;
        minTemp: number | string; // *10
        maxTemp: number | string; // *10
        tempStep: string; // *10
        options: [string, string, string, string, string, string, string, string];
        tCurTempLbl: string;
        tStateLbl: string;
        tALbl: ''; // ignored
        tCF: string;
        temp2: number | string; // *10
        btDetail: '0' | '1'; // 1 ist aus
    };
    
    type writeItem = { dp: string } | undefined;
    export type listItem =
        | {
              on: string;
              text: string;
              color: typePageItem.ColorEntryType | string | undefined;
              icon?: typePageItem.IconBoolean | string | undefined;
              list?: string | undefined;
          }
        | undefined; // mean string start with getState(' and end with ').val
    export type toolboxItem = ChangeTypeOfKeys<listItem, Types.DataItemsOptions | undefined> & {
        action: typePageItem.MediaToolBoxAction;
    };
    export type toolboxItemDataItem = ChangeTypeOfKeys<listItem, dataItem.Dataitem | undefined> & {
        action: typePageItem.MediaToolBoxAction;
    };
    
    export type placeholderType = Record<
        string,
        {
            text?: string;
            dp?: string;
        }
    >;
    
    export function isPlaceholderType(F: any): F is placeholderType {
        if (!F || typeof F !== 'object') return false;
        for (const a in F) {
            let count = 0;
            if (!F[a]) return false;
            for (const b in F[a]) {
                if (['text', 'dp'].indexOf(b) !== -1 && F[a][b] !== undefined) count++;
            }
            if (count !== 1) return false;
        }
        return true;
    }
     }
namespace typePageItem {
    export type PageLightItem = {
        type: 'light' | 'dimmer' | 'brightnessSlider' | 'hue' | 'rgb';
        bri: PageItemMinMaxValue;
        ct: PageItemMinMaxValue;
        hue: PageItemMinMaxValue; //0-360
        rgb: Color.RGB;
    };
    
    type PageItemMinMaxValue = { min: number; max: number };
    export type PageItemColorSwitch = { on: Color.RGB; off: Color.RGB };
    
    export type IconBoolean = Record<Types.BooleanUnion, string | undefined>;
    export type ThisCardMessageTypes = 'input_sel' | 'button';
    
    export interface MessageItem extends MessageItemInterface {
        mainId?: string;
        subId?: string;
    }
    export type entityUpdateDetailMessage =
        | {
              type: '2Sliders';
              entityName: string;
              icon?: string;
              slidersColor: string | 'disable';
              buttonState: boolean | 'disable';
              slider1Pos: number | 'disable';
              slider2Pos: number | 'disable';
              hueMode: boolean;
              hue_translation: string | '';
              slider2Translation: string | '';
              slider1Translation: string | '';
              popup: boolean;
          }
        | {
              type: 'insel';
              entityName: string;
              textColor: string;
              currentState: string;
              list: string;
              headline: string;
          }
        | {
              type: 'popupThermo';
              headline: string;
              entityName: string;
              currentState: string;
              list: string;
          }
        | ({
              type: 'popupLight';
          } & Record<
              | 'entityName'
              | 'icon'
              | 'iconColor'
              | 'power'
              | 'sliderBriPos'
              | 'sliderCtPos'
              | 'colorMode'
              | 'colorIdentifier'
              | 'ctIdentifier'
              | 'briIdentifier'
              | 'effect_supported',
              string
          >)
        | ({ type: 'popupShutter' } & Record<
              | 'entityName'
              | 'pos1'
              | 'text2'
              | 'pos1text'
              | 'icon'
              | 'iconL1'
              | 'iconM1'
              | 'iconR1'
              | 'statusL1'
              | 'statusM1'
              | 'statusR1'
              | 'pos2text'
              | 'iconL2'
              | 'iconM2'
              | 'iconR2'
              | 'statusL2'
              | 'statusM2'
              | 'statusR2'
              | 'pos2',
              string
          >)
        | ({
              type: 'popupFan';
          } & Record<
              | 'entityName'
              | 'icon'
              | 'iconColor'
              | 'buttonstate'
              | 'slider1'
              | 'slider1Max'
              | 'speedText'
              | 'mode'
              | 'modeList',
              string
          >)
        | ({
              type: 'popupTimer';
          } & Record<
              | 'entityName'
              | 'iconColor'
              | 'minutes'
              | 'seconds'
              | 'editable'
              | 'action1'
              | 'action2'
              | 'action3'
              | 'text1'
              | 'text2'
              | 'text3',
              string
          >);
    
    //export type entityUpdateDetailMessageType = '2Sliders' | 'insel';
    
    export interface MessageItemInterface {
        type: Types.SerialTypePopup;
        intNameEntity: string;
        icon: string;
        iconColor: string;
        displayName: string;
        optionalValue: string;
    }
    export type MediaToolBoxAction =
        | 'speaker'
        | 'play'
        | 'tool'
        | 'track'
        | 'favor'
        | 'equal'
        | 'repeat'
        | 'seek'
        | 'cross'
        | 'nexttool';
    export type PageItemDataItems = Omit<PageItemUnion, 'data' | 'type'> &
        (
            | PageItemNumberDataItems
            | PageItemButtonDataItems
            | PageItemShutterDataItems
            | PageItemInputSelDataItems
            | PageItemLightDataItems
            | PageItemTextDataItems
            | PageItemFanDataItems
            | PageItemTimerDataItems
        );
    
    export type PageItemDataItemsOptionsWithOutTemplate = Omit<PageItemUnion, 'data' | 'type'> &
        (
            | PageItemButtonDataItemsOptions
            | PageItemShutterDataItemsOptions
            | PageItemInputSelDataItemsOptions
            | PageItemLightDataItemsOptions
            | PageItemNumberDataItemsOptions
            | PageItemTextDataItemsOptions
            | PageItemFanDataItemsOptions
            | PageItemTimerDataItemsOptions
        );
    export type PageItemDataItemsOptions =
        | ({
              template: Types.TemplateIdent;
              dpInit?: string | RegExp;
              appendix?: string;
          } & Partial<
              Omit<PageItemUnion, 'template' | 'data' | 'type'> &
                  pages.ChangeDeepPartial<
                      | PageItemButtonDataItemsOptions
                      | PageItemShutterDataItemsOptions
                      | PageItemInputSelDataItemsOptions
                      | PageItemLightDataItemsOptions
                      | PageItemNumberDataItemsOptions
                      | PageItemTextDataItemsOptions
                      | PageItemFanDataItemsOptions
                      | PageItemTimerDataItemsOptions
                  >
          >)
        | PageItemDataItemsOptionsWithOutTemplate;
    
    export type PageItemOptionsTemplate = {
        template?: Types.TemplateIdent;
        role?: pages.DeviceRole;
        adapter: string;
        modeScr?: string;
        dpInit?: string;
        type: Types.SerialTypePageElements;
    } & (
        | ({ template?: undefined } & Omit<PageItemUnion, 'template' | 'data' | 'type' | 'dpInit' | 'modeScr'> &
              (
                  | PageItemButtonDataItemsOptions
                  | PageItemShutterDataItemsOptions
                  | PageItemInputSelDataItemsOptions
                  | PageItemLightDataItemsOptions
                  | PageItemNumberDataItemsOptions
                  | PageItemTextDataItemsOptions
                  | PageItemFanDataItemsOptions
                  | PageItemTimerDataItemsOptions
              ))
        | ({ template: Types.TemplateIdent } & Omit<PageItemUnion, 'template' | 'data' | 'type' | 'dpInit' | 'modeScr'> &
              pages.ChangeTypeOfKeys<
                  | PageItemButtonDataItemsOptions
                  | PageItemShutterDataItemsOptions
                  | PageItemInputSelDataItemsOptions
                  | PageItemLightDataItemsOptions
                  | PageItemNumberDataItemsOptions
                  | PageItemTextDataItemsOptions
                  | PageItemFanDataItemsOptions
                  | PageItemTimerDataItemsOptions,
                  Types.DataItemsOptions | undefined | null
              >)
    );
    
    export type PageItemTimer = Pick<PageItemBase, 'entity1' | 'text' | 'headline' | 'icon' | 'setValue1'>;
    export type PageItemTimerDataItemsOptions = {
        type: 'timer';
        data: pages.ChangeTypeOfKeys<PageItemTimer, Types.DataItemsOptions | undefined>;
    };
    export type PageItemTimerDataItems = {
        type: 'timer';
        data: pages.ChangeTypeOfKeys<PageItemTimer, dataItem.Dataitem | undefined>;
    };
    
    export type PageItemFan = Pick<
        PageItemBase,
        'entity1' | 'speed' | 'text' | 'headline' | 'icon' | 'entityInSel' | 'valueList' | 'setList'
    >;
    export type PageItemFanDataItemsOptions = {
        type: 'fan';
        data: pages.ChangeTypeOfKeys<PageItemFan, Types.DataItemsOptions | undefined>;
    };
    export type PageItemFanDataItems = {
        type: 'fan';
        data: pages.ChangeTypeOfKeys<PageItemFan, dataItem.Dataitem | undefined>;
    };
    
    export type PageItemText = Pick<
        PageItemBase,
        'entity1' | 'text' | 'text1' | 'entity2' | 'entity3' | 'entity4' | 'icon'
    >;
    export type PageItemTextDataItemsOptions = {
        type: 'text';
        data: pages.ChangeTypeOfKeys<PageItemText, Types.DataItemsOptions | undefined>;
    };
    export type PageItemTextDataItems = {
        type: 'text';
        data: pages.ChangeTypeOfKeys<PageItemText, dataItem.Dataitem | undefined>;
    };
    
    export type PageItemNumber = Pick<PageItemBase, 'entity1' | 'text' | 'icon'>;
    export type PageItemNumberDataItemsOptions = {
        type: 'number';
        data: pages.ChangeTypeOfKeys<PageItemNumber, Types.DataItemsOptions | undefined>;
    };
    export type PageItemNumberDataItems = {
        type: 'number';
        data: pages.ChangeTypeOfKeys<PageItemNumber, dataItem.Dataitem | undefined>;
    };
    
    export type PageItemButton = Pick<
        PageItemBase,
        'setValue1' | 'setValue2' | 'text' | 'text1' | 'icon' | 'color' | 'entity1' | 'setNavi'
    >;
    export type PageItemButtonDataItemsOptions = {
        type: 'button';
        data: pages.ChangeTypeOfKeys<PageItemButton, Types.DataItemsOptions | undefined>;
    };
    export type PageItemButtonDataItems = {
        type: 'button';
        data: pages.ChangeTypeOfKeys<PageItemButton, dataItem.Dataitem | undefined>;
    };
    
    export type PageItemLight = Pick<
        PageItemBase,
        | 'valueList'
        | 'setList'
        | 'text1'
        | 'text2'
        | 'text3'
        | 'icon'
        | 'color'
        | 'entity1'
        | 'Red'
        | 'Green'
        | 'Blue'
        | 'White'
        | 'saturation'
        | 'dimmer'
        | 'hue'
        | 'entityInSel'
        | 'ct'
        | 'headline'
        | 'colorMode'
    >;
    export type PageItemLightDataItemsOptions = {
        type: 'light';
        data: pages.ChangeTypeOfKeys<PageItemLight, Types.DataItemsOptions | undefined>;
    };
    export type PageItemLightDataItems = {
        type: 'light';
        data: pages.ChangeTypeOfKeys<PageItemLight, dataItem.Dataitem | undefined>;
    };
    
    export type PageItemInputSel = Pick<
        PageItemBase,
        | 'entityInSel'
        | 'text'
        | 'entity2'
        | 'icon'
        | 'color'
        | 'headline'
        | 'valueList'
        | 'valueList2'
        | 'setList'
        | 'setValue1'
    >;
    
    export type PageItemInputSelDataItemsOptions = {
        type: 'input_sel';
        data: pages.ChangeTypeOfKeys<PageItemInputSel, Types.DataItemsOptions | undefined>;
    };
    
    export type PageItemInputSelDataItems = {
        type: 'input_sel';
        data: pages.ChangeTypeOfKeys<PageItemInputSel, dataItem.Dataitem | undefined>;
    };
    
    export type PageItemShutter = Pick<
        PageItemBase,
        | 'up'
        | 'down'
        | 'stop'
        | 'up2'
        | 'down2'
        | 'stop2'
        | 'entity1'
        | 'entity2'
        | 'text'
        | 'text1'
        | 'text2'
        | 'icon'
        | 'color'
        | 'headline'
        | 'valueList'
        | 'setList'
    >;
    export type PageItemShutterDataItemsOptions = {
        type: 'shutter';
        data: pages.ChangeTypeOfKeys<PageItemShutter, Types.DataItemsOptions | undefined>;
    };
    export type PageItemShutterDataItems = {
        type: 'shutter';
        data: pages.ChangeTypeOfKeys<PageItemShutter, dataItem.Dataitem | undefined>;
    };
    
    export type PageItemBase = {
        headline?: string;
        color?: ColorEntryType;
        icon?: IconEntryType;
        text?: TextEntryType;
        entityInSel: ValueEntryType;
        entity1?: ValueEntryType; // Readonly Werte die angezeigt werden soll. wird immer für insel verwendet
        entity2?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
        entity3?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
        entity4?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
        text1?: TextEntryType;
        text2?: TextEntryType;
        text3?: TextEntryType;
        mixed1?: ValueEntryType; // Readonly Werte die angezeigt werden soll. wird immer für insel verwendet
        mixed2?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
        mixed3?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
        mixed4?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
        setValue1?: string;
        setValue2?: string;
        setValue3?: string;
        valueList?: number;
        valueList2?: number;
        setNavi?: number;
        setList?: number;
        maxValue1?: number;
        minValue1?: number;
        minValue2?: number;
        maxValue2?: number;
        interpolateColor?: boolean;
        dimmer?: ScaledNumberType;
        speed?: ScaledNumberType;
        ct?: ScaledNumberType;
        hue?: string;
        colorMode: boolean; // true rgb, false ct
        saturation?: string;
        useColor: string;
        Red?: number;
        Green?: number;
        Blue?: number;
        White?: ScaledNumberType;
        up: number;
        stop?: number;
        down: number;
        up2?: number;
        stop2?: number;
        down2?: number;
    };
    
    export type PageTypeUnionTemplate = {
        role: pages.DeviceRole;
        type: Types.SerialTypePageElements;
        data: {
            headline?: string | undefined;
            color?: Color.RGB | undefined;
            icon?:
                | { true: { value: string; color: Color.RGB | null }; false: { value: string; color: Color.RGB | null } }
                | undefined;
            text?: { true: string; false: string } | undefined;
            entity1: true | undefined | 'invert' | '';
            entity2?: true | undefined | 'invert';
            entity3?: true | undefined | 'invert';
            text1?: { true: string; false: string } | undefined;
            text2?: { true: string; false: string } | undefined;
            text3?: { true: string; false: string } | undefined;
            setValue1?: true | undefined;
            setValue2?: true | undefined;
            setValue3?: true | undefined;
            modeList?: true | undefined;
            maxValue1?: number | undefined;
            minValue1?: number | undefined;
            minValue2?: number | undefined;
            maxValue2?: number | undefined;
            interpolateColor?: true | undefined;
            dimmer?: true | undefined;
            hue?: true | undefined;
            saturation?: true | undefined;
            useColor?: true | undefined;
            RGB3?: true | undefined;
            optionalData?: any[] | string | true | undefined; //shutter icons - string for true?false or just true
        };
    };
    //XOR<XOR<A, B>, C>
    
    export type PageItemUnion = {
        role?: pages.DeviceRole;
        template?: undefined;
        dpInit?: string | RegExp;
        enums?: string | string[];
        device?: string;
        modeScr?: Types.ScreenSaverPlaces | undefined;
        type: Types.SerialTypePageElements;
        data: PageItemBase;
    };
    
    export type ColorEntryType = Record<Types.BooleanUnion, Color.RGB | undefined> & { scale?: Types.IconScaleElement };
    
    export type ColorEntryTypeNew =
        | (Partial<Record<Types.BooleanUnion, { color: Color.RGB }>> & {
              scale?: Types.IconScaleElement | undefined;
              maxBri?: string;
              minBri?: string;
          })
        | undefined;
    export type IconEntryType =
        | (Partial<Record<Types.BooleanUnion, { value: string; text?: TextSizeEntryType }>> & ColorEntryTypeNew)
        | undefined;
    
    export type TextEntryType = Record<Types.BooleanUnion, string>;
    export type TextSizeEntryType = ValueEntryType & { textSize?: number };
    export type ValueEntryType =
        | {
              value: number;
              decimal?: number;
              factor?: number;
              unit?: string;
              minScale?: number;
              maxScale?: number;
              set?: number;
              dateFormat?: string;
              math?: string;
          }
        | undefined;
    export type ScaledNumberType =
        | {
              value: number;
              minScale?: number;
              maxScale?: number;
              factor?: number;
              set?: number;
              mode?: string; // atm 'kelvin' | 'mired'
          }
        | undefined;
    export type listCommand = { id: string; value: string; command?: listCommandUnion };
    type listCommandUnion = 'flip';
    export function islistCommandUnion(F: any | listCommandUnion): F is listCommandUnion {
        switch (F as listCommandUnion) {
            case 'flip': {
                return true;
            }
        }
        return false;
    }
    
    export type spotifyPlaylist = Array<{
        id: string;
        title: string;
        artistName: string;
        artistArray: Array<{
            id: string;
            name: string;
        }>;
        album: {
            id: string;
            name: string;
        };
        durationMs: number;
        duration: string;
        addedAt: string;
        addedBy: string;
        discNumber: number;
        episode: boolean;
        explicit: boolean;
        popularity: number;
    }>;
     }

namespace Types {
    /**
     * Bitte an folgendes Schema halten
     * card.adapter?.aufgabe?.gerät?
     */
    
    export type PageTemplateIdent = 'entities.waste-calendar' | 'media.spotify-premium' | 'entities.departure-timetable';
    
    export type TemplateIdent =
        | 'generic.shutter'
        | 'shutter.shelly.2PM'
        | 'light.shelly.rgbw2'
        | 'text.window.isClose'
        | 'text.window.isOpen'
        | 'text.battery'
        | 'text.temperature'
        | 'text.battery.low'
        | 'button.iconRightSize'
        | 'button.iconLeftSize'
        | 'shutter.deconz.ikea.fyrtur'
        | 'shutter.basic'
        | 'shutter.basic.onlyV'
        | 'text.battery.bydhvs'
        | 'text.accuweather.bot2values'
        | 'text.accuweather.sunriseset'
        | 'button.esphome.powerplug'
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | ''
        | '';
    
    export function isEventMethod(F: string | EventMethod): F is EventMethod {
        switch (F as EventMethod) {
            case 'startup':
            case 'sleepReached':
            case 'pageOpenDetail':
            case 'buttonPress2':
            case 'renderCurrentPage':
            case 'button1':
            case 'button2':
                return true;
            default:
                // Have to talk about this.
                throw new Error(`Please report to developer: Unknown EventMethod: ${F} `);
                return false;
        }
    }
    
    export function isPopupType(F: PopupType | any): F is PopupType {
        switch (F as PopupType) {
            case 'popupFan':
            case 'popupInSel':
            case 'popupLight':
            case 'popupLightNew':
            case 'popupNotify':
            case 'popupShutter':
            case 'popupThermo':
            case 'popupTimer':
                return true;
            default:
                console.info(`Unknown PopupType: ${F} `);
                return false;
        }
    }
    
    export type EventMethod =
        | 'startup'
        | 'sleepReached'
        | 'pageOpenDetail'
        | 'buttonPress2'
        | 'renderCurrentPage'
        | 'button1'
        | 'button2';
    
    export type panelRecvType = {
        event: 'event';
        method: EventMethod;
    };
    
    export const SerialTypeArray = [
        'light', //popup
        'shutter', //popup
        'delete',
        'text',
        'button',
        'switch', // nur für cardQR
        'number',
        'input_sel', //popup
        'timer', //popup
        'fan', //popup
    ];
    
    export type PopupType =
        | 'popupFan'
        | 'popupInSel'
        | 'popupLight'
        | 'popupLightNew'
        | 'popupNotify'
        | 'popupShutter'
        | 'popupThermo'
        | 'popupTimer';
    
    export type SerialTypePageElements =
        | 'button' //~button~button.entityName~3~17299~bt-name~bt-text
        | 'light' // ~light~light.entityName~1~17299~Light1~0
        | 'shutter' // ~shutter~cover.entityName~0~17299~Shutter2~iconUp|iconStop|iconDown
        | 'text' // ~text~sensor.entityName~3~17299~Temperature~content
        | 'input_sel' //~input_sel~input_select.entityName~3~17299~sel-name~sel-text
        | 'number' //~number~input_number.entityName~4~17299~Number123~value|min|max
        | 'switch' // ~switch~switch.entityName~4~17299~Switch1~0
        | 'delete'; //~delete~~~~~
    
    export type SerialTypePopup =
        | 'button'
        | 'light'
        | 'shutter'
        | 'text'
        | 'input_sel'
        | 'timer'
        | 'number'
        | 'fan'
        | 'switch'
        | 'delete';
    
    export type ButtonActionType =
        | 'bExit'
        | 'bUp'
        | 'bNext'
        | 'bSubNext'
        | 'bPrev'
        | 'bSubPrev'
        | 'bHome'
        | 'notifyAction'
        | 'OnOff'
        | 'button'
        | 'up'
        | 'stop'
        | 'down'
        | 'positionSlider'
        | 'tiltOpen'
        | 'tiltStop'
        | 'tiltSlider'
        | 'tiltClose'
        | 'brightnessSlider'
        | 'colorTempSlider'
        | 'colorWheel'
        | 'tempUpd'
        | 'tempUpdHighLow'
        | 'media-back'
        | 'media-pause'
        | 'media-next'
        | 'media-shuffle'
        | 'volumeSlider'
        | 'mode-speakerlist'
        | 'mode-playlist'
        | 'mode-tracklist'
        | 'mode-repeat'
        | 'mode-equalizer'
        | 'mode-seek'
        | 'mode-crossfade'
        | 'mode-favorites'
        | 'mode-insel'
        | 'media-OnOff'
        | 'timer-start'
        | 'timer-pause'
        | 'timer-cancle'
        | 'timer-finish'
        | 'hvac_action'
        | 'mode-modus1'
        | 'mode-modus2'
        | 'mode-modus3'
        | 'number-set'
        | 'mode-preset_modes'
        | 'A1'
        | 'A2'
        | 'A3'
        | 'A4'
        | 'D1'
        | 'U1';
    
    export type Payload = {
        payload: string;
    };
    export type BooleanUnion = 'true' | 'false';
    
    export type DimMode = {
        dimmodeOn: boolean | undefined;
        brightnessDay: number | undefined;
        brightnessNight: number | undefined;
        timeDay: string | undefined;
        timeNight: string | undefined;
    };
    
    export type ValueDateFormat = { local: string; format: any };
    
    export function isValueDateFormat(F: any | ValueDateFormat): F is ValueDateFormat {
        return F && typeof F === 'object' && F.local !== undefined && F.format !== undefined;
    }
    
    export type ScreenSaverPlaces = 'left' | 'bottom' | 'indicator' | 'alternate' | 'favorit' | 'mricon' | 'time' | 'date';
    export type NSpanelModel = 'eu';
    export type Config = {
        leftEntity: boolean;
        indicatorEntity: any;
        mrIcon1Entity: any;
        mrIcon2Entity: any;
        panelRecvTopic: string;
        panelSendTopic: string;
        weatherEntity: string;
        screensaver: {
            favoritEntity: [ScreenSaverElement];
            leftEntity: ScreenSaverElement[];
            bottomEntity: ScreenSaverElement[];
            alternateEntity: [ScreenSaverElement?];
            indicatorEntity: ScreenSaverElement[];
            mrIconEntity: [ScreenSaverElement, ScreenSaverElement];
        };
        defaultColor: Color.RGB;
        defaultOnColor: Color.RGB;
        defaultOffColor: Color.RGB;
        defaultBackgroundColor: Color.RGB;
    };
    export type leftScreensaverEntityType =
        | [ScreenSaverElementWithUndefined, ScreenSaverElementWithUndefined, ScreenSaverElementWithUndefined]
        | [];
    export type indicatorScreensaverEntityType =
        | [
              ScreenSaverElementWithUndefined?,
              ScreenSaverElementWithUndefined?,
              ScreenSaverElementWithUndefined?,
              ScreenSaverElementWithUndefined?,
              ScreenSaverElementWithUndefined?,
          ]
        | [];
    export type ScreenSaverElementWithUndefined = null | undefined | ScreenSaverElement;
    
    export type ScreenSaverDataItems = {
        entityValue: pages.ChangeTypeOfKeys<typePageItem.ValueEntryType, dataItem.Dataitem | undefined>;
        entityDateFormat: dataItem.Dataitem | undefined;
        entityIcon: pages.ChangeTypeOfKeys<typePageItem.IconEntryType, dataItem.Dataitem | undefined>;
        entityText: pages.ChangeTypeOfKeys<typePageItem.TextEntryType, dataItem.Dataitem | undefined>;
        entityIconSelect: dataItem.Dataitem | undefined;
    };
    export type ScreenSaverElement = {
        entityValue: pages.ChangeTypeOfKeys<typePageItem.ValueEntryType, DataItemsOptions | undefined>;
        entityDateFormat: ScreenSaverElementConfig;
        entityIcon: pages.ChangeTypeOfKeys<typePageItem.IconEntryType, DataItemsOptions | undefined>;
        entityText: pages.ChangeTypeOfKeys<typePageItem.TextEntryType, DataItemsOptions | undefined>;
        entityIconSelect: ScreenSaverElementConfig;
    };
    
    type ScreenSaverElementConfig = DataItemsOptions | undefined;
    
    export type IconScaleElement = {
        val_min: number;
        val_max: number;
        val_best?: number;
        log10?: 'max' | 'min';
    };
    
    export function isIconScaleElement(F: any | IconScaleElement): F is IconScaleElement {
        return F && 'val_min' in (F as IconScaleElement) && 'val_max' in (F as IconScaleElement);
    }
    export function isPartialIconScaleElement(F: any | IconScaleElement): F is IconScaleElement {
        return F && ('val_min' in (F as IconScaleElement) || 'val_max' in (F as IconScaleElement));
    }
    
    export type DataItemstype = DataItemsOptions['type'];
    export type DataItemsMode = 'custom' | 'auto';
    export type DataItemsOptionsIcon =
        | Exclude<DataItemsOptions, DataItemsOptionsConst>
        | (DataItemsOptionsConst & {
              constVal: AllIcons;
          });
    export type DataItemsOptions = {
        name?: string;
        scale?: { min: number; max: number };
    } & (
        | DataItemsOptionsConst
        | DataItemsOptionsState
        | DataItemsOptionsTriggered
        | DataItemsOptionsInternal
        | DataItemsOptionsInternalState
    );
    
    type DataItemsOptionsAuto = {
        mode: 'auto' | 'done'; // not set means custom
        role: pages.StateRole | pages.StateRole[];
        regexp?: RegExp;
    };
    type DataItemsOptionsCustom = {
        mode?: 'custom'; // not set means custom
        role?: string;
    };
    
    type DataItemsOptionsConst = {
        type: 'const';
        role?: pages.StateRole;
        constVal: StateValue | AllIcons | Color.RGB | pages.placeholderType | IconScaleElement;
        state?: State | null; // use just inside of class
        forceType?: 'string' | 'number' | 'boolean'; // force a type
    };
    type DataItemsOptionsInternal = {
        type: 'internal';
        role?: string;
        dp: string;
        read?: string | ((val: any) => any);
        write?: string | ((val: any) => any);
    };
    
    type DataItemsOptionsInternalState = {
        type: 'internalState';
        role?: string;
        dp: string;
        read?: string | ((val: any) => any);
        write?: string | ((val: any) => any);
    };
    type DataItemsOptionsState = (DataItemsOptionsAuto | DataItemsOptionsCustom) & {
        type: 'state';
        dp: string;
        state?: State | null; // use just inside of class
        substring?: [number, number | undefined]; // only used with getString()
        forceType?: 'string' | 'number' | 'boolean'; // force a type
        read?: string | ((val: any) => any);
        write?: string | ((val: any) => any);
        response?: 'now' | 'medium';
    };
    type DataItemsOptionsTriggered = (DataItemsOptionsAuto | DataItemsOptionsCustom) & {
        type: 'triggered';
        dp: string;
        state?: State | null; // use just inside of class
        substring?: [number, number | undefined]; // only used with getString()
        forceType?: 'string' | 'number' | 'boolean'; // force a type
        read?: string | ((val: any) => any);
        write?: string | ((val: any) => any);
        change?: 'ts';
    };
    
    //type internalDatapoints = 'Relais1' | 'Relais2';
    export type IncomingEvent = {
        type: EventType;
        method: EventMethod;
        action: ButtonActionType | '' | string;
        target?: number;
        page?: number;
        cmd?: number;
        popup?: string;
        id: string; //| PopupType;
        opt: string;
    };
    
    export type Event = {
        type: EventType;
        method: EventMethod;
        page: any | null;
        data: string[];
        opt: string[];
    };
    export type EventType = 'event';
    export function isEventType(F: string | EventType): F is EventType {
        return ['event'].indexOf(F) != -1;
    }
    export type ScreensaverModeType = 'standard' | 'alternate' | 'advanced';
    
    export interface State extends Omit<iobJS.State, 'val'> {
        val: StateValue;
    }
    export type StateValue = iobJS.StateValue | object;
    
    export type TasmotaIncomingTopics = 'stat/POWER2' | 'stat/POWER1' | 'stat/STATUS0';
    
    /**
     * Json to Status0 from Tasmota
     */
    export type STATUS0 = {
        Status: {
            Module: number;
            DeviceName: string;
            FriendlyName: Array<string>;
            Topic: string;
            ButtonTopic: string;
            Power: number;
            PowerOnState: number;
            LedState: number;
            LedMask: string;
            SaveData: number;
            SaveState: number;
            SwitchTopic: string;
            SwitchMode: Array<number>;
            ButtonRetain: number;
            SwitchRetain: number;
            SensorRetain: number;
            PowerRetain: number;
            InfoRetain: number;
            StateRetain: number;
            StatusRetain: number;
        };
        StatusPRM: {
            Baudrate: number;
            SerialConfig: string;
            GroupTopic: string;
            OtaUrl: string;
            RestartReason: string;
            Uptime: string;
            StartupUTC: string;
            Sleep: number;
            CfgHolder: number;
            BootCount: number;
            BCResetTime: string;
            SaveCount: number;
        };
        StatusFWR: {
            Version: string;
            BuildDateTime: string;
            Core: string;
            SDK: string;
            CpuFrequency: number;
            Hardware: string;
            CR: string;
        };
        StatusLOG: {
            SerialLog: number;
            WebLog: number;
            MqttLog: number;
            SysLog: number;
            LogHost: string;
            LogPort: number;
            SSId: Array<string>;
            TelePeriod: number;
            Resolution: string;
            SetOption: Array<string>;
        };
        StatusMEM: {
            ProgramSize: number;
            Free: number;
            Heap: number;
            StackLowMark: number;
            PsrMax: number;
            PsrFree: number;
            ProgramFlashSize: number;
            FlashSize: number;
            FlashChipId: string;
            FlashFrequency: number;
            FlashMode: string;
            Features: Array<string>;
            Drivers: string;
            Sensors: string;
            I2CDriver: string;
        };
        StatusNET: {
            Hostname: string;
            IPAddress: string;
            Gateway: string;
            Subnetmask: string;
            DNSServer1: string;
            DNSServer2: string;
            Mac: string;
            IP6Global: string;
            IP6Local: string;
            Ethernet: {
                Hostname: string;
                IPAddress: string;
                Gateway: string;
                Subnetmask: string;
                DNSServer1: string;
                DNSServer2: string;
                Mac: string;
                IP6Global: string;
                IP6Local: string;
            };
            Webserver: number;
            HTTP_API: number;
            WifiConfig: number;
            WifiPower: number;
        };
        StatusMQT: {
            MqttHost: string;
            MqttPort: number;
            MqttClientMask: string;
            MqttClient: string;
            MqttUser: string;
            MqttCount: number;
            MAX_PACKET_SIZE: number;
            KEEPALIVE: number;
            SOCKET_TIMEOUT: number;
        };
        StatusTIM: {
            UTC: string;
            Local: string;
            StartDST: string;
            EndDST: string;
            Timezone: string;
            Sunrise: string;
            Sunset: string;
        };
        StatusSNS: {
            Time: string;
            ANALOG: {
                Temperature1: number;
            };
            TempUnit: string;
        };
        StatusSTS: {
            Time: string;
            Uptime: string;
            UptimeSec: number;
            Heap: number;
            SleepMode: string;
            Sleep: number;
            LoadAvg: number;
            MqttCount: number;
            Berry: {
                HeapUsed: number;
                Objects: number;
            };
            POWER1: string;
            POWER2: string;
            Wifi: {
                AP: number;
                SSId: string;
                BSSId: string;
                Channel: number;
                Mode: string;
                RSSI: number;
                Signal: number;
                LinkCount: number;
                Downtime: string;
            };
        };
    };
    
    export type PanelInfo = {
        nspanel: {
            displayVersion: number;
            model: string;
            bigIconLeft: boolean;
            bigIconRight: boolean;
            isOnline: boolean;
            currentPage: string;
        };
        tasmota: {
            net: {
                ip: string;
                gateway: string;
                dnsserver: string;
                subnetmask: string;
                hostname: string;
                mac: string;
            };
            uptime: string;
            wifi: { ssid: string; rssi: number; downtime: string };
        };
    };
     }
export type ScreensaverConfigType = {
    momentLocale: string;
    locale: string; //Intl.DateTimeFormat;
    iconBig1: boolean;
    iconBig2: boolean;
};


export interface panelConfigPartial extends Partial<panelConfigTop> {
    format?: Partial<Intl.DateTimeFormatOptions>;
    controller: any;
    topic: string;
    name: string;
    pages: PageConfigAll[];
    navigation: NavigationConfig['navigationConfig'];
    config: ScreensaverConfigType;
}
export interface PageConfigInterface {
    config: pages.PageBaseConfig;
    page: PageInterface;
}
export type PageItemInterface = BaseClassTriggerdInterface & {
    card: pages.PageTypeCards;
    panel: any;
    id: string;
    parent: any;
};

export type PageInterface = BaseClassTriggerdInterface & {
    card: pages.PageTypeCards;
    panel: any;
    id: string;
    uniqueID: string;
};

//interface Page extends BaseClass | PageConfig
export type PageConfigAll = pages.PageBaseConfig;
export type NavigationItemConfig = {
    name: string;
    left?: {
        single?: string;
        double?: string;
    };
    right?: {
        single?: string;
        double?: string;
    };
    page: string;
} | null;

export type NavigationItem = {
    left: {
        single?: number;
        double?: number;
    };
    right: {
        single?: number;
        double?: number;
    };
} | null;

export interface NavigationConfig {


    navigationConfig: NavigationItemConfig[];
}
export interface BaseClassTriggerdInterface {
    name: string;

    alwaysOn?: 'none' | 'always' | 'action';

    dpInit?: string;
}
namespace dataItem {
    export type Dataitem = any
}
type panelConfigTop = {
    CustomFormat: string;
    locale: Intl.LocalesArgument;
    timeout: number;
    dimLow: number;
    dimHigh: number;
};