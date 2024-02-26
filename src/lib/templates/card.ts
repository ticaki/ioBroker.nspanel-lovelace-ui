import * as Color from '../const/Color';
import { PageBaseConfigTemplate } from '../types/pages';

export const cardTemplates: PageBaseConfigTemplate[] = [
    {
        // Abfallkalender
        template: 'waste-calendar.entities',
        adapter: '0_userdata.0',
        card: 'cardEntities',
        alwaysOn: 'none',
        useColor: false,
        config: {
            card: 'cardEntities',
            data: {
                headline: {
                    type: 'const',
                    constVal: 'Waste dates',
                },
            },
        },
        pageItems: [
            {
                role: 'text.list',
                type: 'text',

                data: {
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'trash-can' },
                            color: { type: 'state', dp: '.1.color$', mode: 'auto', role: 'state' },
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
                role: 'text.list',
                type: 'text',
                data: {
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'trash-can' },
                            color: { type: 'state', dp: '.2.color$', mode: 'auto', role: 'state' },
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
                role: 'text.list',
                type: 'text',
                data: {
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'trash-can' },
                            color: { type: 'state', dp: '.3.color$', mode: 'auto', role: 'state' },
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
                role: 'text.list',
                type: 'text',
                data: {
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'trash-can' },
                            color: { type: 'state', dp: '.4.color$', mode: 'auto', role: 'state' },
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
        ],
        items: undefined,
    },
    {
        card: 'cardMedia',
        adapter: '',
        template: 'media.spotify-premium',
        alwaysOn: 'none',
        config: {
            card: 'cardMedia',
            data: {
                headline: {
                    type: 'const',
                    constVal: 'Spotify-Premium',
                },
                alwaysOnDisplay: {
                    type: 'const',
                    constVal: 'none',
                },
                album: {
                    mode: 'auto',
                    role: 'value',
                    type: 'triggered',
                    dp: '.player.album$',
                },
                titel: {
                    on: {
                        type: 'const',
                        constVal: true,
                    },
                    text: {
                        mode: 'auto',
                        role: 'value',
                        type: 'triggered',
                        dp: '.player.trackName',
                    },
                    color: {
                        type: 'const',
                        constVal: { r: 250, g: 2, b: 3 },
                    },
                },
                duration: {
                    mode: 'auto',
                    type: 'state',
                    role: 'value',
                    dp: '.player.durationMs',
                    read: 'return Math.floor(val/1000);',
                },
                elapsed: {
                    mode: 'auto',
                    type: 'triggered',
                    role: 'value',
                    dp: '.player.progressMs',
                    read: 'return Math.floor(val/1000);',
                },
                volume: {
                    value: {
                        mode: 'auto',
                        type: 'state',
                        role: 'value',
                        response: 'now',
                        scale: { min: 0, max: 100 },
                        dp: '.player.device.volume',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: 'value',
                        response: 'now',
                        scale: { min: 0, max: 100 },
                        dp: '.player.volume',
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
                        role: 'value',
                        dp: '.player.artistName',
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
                        type: 'triggered',
                        role: 'value',
                        dp: '.player.shuffle',
                        read: 'return val === "on";',
                        write: 'return val === "ON" ? "on" : "off";',
                    },
                    set: {
                        mode: 'auto',
                        type: 'state',
                        role: 'value',
                        dp: '.player.shuffle',
                        read: 'return val === "on";',
                        write: 'return val === "ON" ? "on" : "off";',
                    },
                },
                icon: {
                    type: 'const',
                    constVal: 'dialpad',
                },
                play: {
                    mode: 'auto',
                    type: 'state',
                    role: 'value',
                    dp: '.player.play',
                },
                mediaState: {
                    mode: 'auto',
                    type: 'triggered',
                    role: 'value',
                    dp: '.player.isPlaying',
                },
                stop: {
                    mode: 'auto',
                    type: 'state',
                    role: 'button',
                    dp: '.player.play',
                },
                pause: {
                    mode: 'auto',
                    type: 'state',
                    role: 'button',
                    dp: '.player.pause',
                },
                forward: {
                    mode: 'auto',
                    type: 'state',
                    role: 'button',
                    dp: '.player.skipPlus',
                },
                backward: {
                    mode: 'auto',
                    type: 'state',
                    role: 'button',
                    dp: '.player.skipMinus',
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
                            value: { type: 'const', constVal: 'playlist-music' },
                            color: { type: 'const', constVal: Color.Green },
                        },
                    },
                    entityInSel: {
                        value: {
                            mode: 'auto',
                            role: 'value',
                            type: 'triggered',
                            dp: 'player.playlist.trackNo',
                        },
                    },
                    text: {
                        true: undefined,
                        false: undefined,
                    },
                    /**
                     * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
                     */
                    valueList: {
                        type: 'triggered',
                        mode: 'auto',
                        role: 'value',
                        dp: '.player.playlist.trackListArray',
                    },
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
                    },
                    text: {
                        true: undefined,
                        false: undefined,
                    },
                },
            },
        ],
        useColor: false,
    },
    {
        //Anzeigetafel Fahrplan
        template: 'DepartureTimetable.entities',
        adapter: 'fahrplan.0',
        card: 'cardEntities',
        alwaysOn: 'none',
        useColor: false,
        config: {
            card: 'cardEntities',
            data: {
                headline: {
                    type: 'const',
                    constVal: 'Departure',
                },
            },
        },
        pageItems: [
            {
                role: 'text.list',
                type: 'text',
                data: {
                    icon: {
                        true: {
                            value: { role: 'state', mode: 'auto', type: 'state', dp: '.0.Mode' },
                            //value: { type:'const', constVal: ' bus'},
                            color: { type: 'const', constVal: Color.Red },
                        },
                        false: {
                            value: { role: 'state', mode: 'auto', type: 'state', dp: '.0.Mode' },
                            //value: { type:'const', constVal: ' bus'},
                            color: { type: 'const', constVal: Color.Green },
                        },
                    },
                    entity1: {
                        value: { role: 'value', mode: 'auto', type: 'state', dp: '.0.DepartureDelaye' },
                    },
                    text: {
                        true: { role: 'state', mode: 'auto', type: 'state', dp: '.0.Direction' },
                        false: undefined,
                    },
                    text1: {
                        true: { role: 'date', mode: 'auto', type: 'state', dp: '.0.Departure' },
                        false: undefined,
                    },
                },
            },
            {
                role: 'text.list',
                type: 'text',
                data: {
                    icon: {
                        true: {
                            value: { role: 'state', mode: 'auto', type: 'state', dp: '.1.Mode' },
                            //value: { type:'const', constVal: ' bus'},
                            color: { type: 'const', constVal: Color.Red },
                        },
                        false: {
                            value: { role: 'state', mode: 'auto', type: 'state', dp: '.1.Mode' },
                            //value: { type:'const', constVal: ' bus'},
                            color: { type: 'const', constVal: Color.Green },
                        },
                    },
                    entity1: {
                        value: { role: 'value', mode: 'auto', type: 'state', dp: '.1.DepartureDelaye' },
                    },
                    text: {
                        true: { role: 'state', mode: 'auto', type: 'state', dp: '.1.Direction' },
                        false: undefined,
                    },
                    text1: {
                        true: { role: 'date', mode: 'auto', type: 'state', dp: '.1.Departure' },
                        false: undefined,
                    },
                },
            },
            {
                role: 'text.list',
                type: 'text',
                data: {
                    icon: {
                        true: {
                            value: { role: 'state', mode: 'auto', type: 'state', dp: '.2.Mode' },
                            //value: { type:'const', constVal: ' bus'},
                            color: { type: 'const', constVal: Color.Red },
                        },
                        false: {
                            value: { role: 'state', mode: 'auto', type: 'state', dp: '.2.Mode' },
                            //value: { type:'const', constVal: ' bus'},
                            color: { type: 'const', constVal: Color.Green },
                        },
                    },
                    entity1: {
                        value: { role: 'value', mode: 'auto', type: 'state', dp: '.2.DepartureDelaye' },
                    },
                    text: {
                        true: { role: 'state', mode: 'auto', type: 'state', dp: '.2.Direction' },
                        false: undefined,
                    },
                    text1: {
                        true: { role: 'date', mode: 'auto', type: 'state', dp: '.2.Departure' },
                        false: undefined,
                    },
                },
            },
            {
                role: 'text.list',
                type: 'text',
                data: {
                    icon: {
                        true: {
                            value: { role: 'state', mode: 'auto', type: 'state', dp: '.3.Mode' },
                            //value: { type:'const', constVal: ' bus'},
                            color: { type: 'const', constVal: Color.Red },
                        },
                        false: {
                            value: { role: 'state', mode: 'auto', type: 'state', dp: '.3.Mode' },
                            //value: { type:'const', constVal: ' bus'},
                            color: { type: 'const', constVal: Color.Green },
                        },
                    },
                    entity1: {
                        value: { role: 'value', mode: 'auto', type: 'state', dp: '.3.DepartureDelaye' },
                    },
                    text: {
                        true: { role: 'state', mode: 'auto', type: 'state', dp: '.3.Direction' },
                        false: undefined,
                    },
                    text1: {
                        true: { role: 'date', mode: 'auto', type: 'state', dp: '.3.Departure' },
                        false: undefined,
                    },
                },
            },
        ],
        items: undefined,
    },
];
