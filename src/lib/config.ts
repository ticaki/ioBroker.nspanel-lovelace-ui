import * as pages from './types/pages';
import * as Color from './const/Color';
import { panelConfigPartial } from './controller/panel';

//~1 ~2 ~~32495~5 ~entityOffText~1 ~2 ~3 ~4 ~65535~6 ~2entityUnitText~2 ~3 ~4 ~5 ~65535~ ~3~ ~ ~ ~ ~65535~ ~4~ ~ ~ ~ ~65535~ ~5~ ~ to panel.
export const Testconfig: Partial<panelConfigPartial> = {
    screenSaverConfig: {
        // mode of screensaver
        mode: 'standard',
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
                        false: undefined,
                        color: {
                            true: {
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
                            false: undefined,
                            scale: undefined,
                        },
                    },

                    entityText: {
                        true: undefined,
                        false: undefined,
                    },
                },
            ],
            leftEntity: [],
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
                            type: 'const',
                            constVal: 'weather-sunset-up',
                        },
                        false: undefined,
                        color: {
                            true: {
                                type: 'const',
                                constVal: Color.Yellow,
                            },
                            false: {
                                type: 'const',
                                constVal: Color.Blue,
                            },
                            scale: undefined,
                        },
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
                            type: 'const',
                            constVal: 'weather-windy',
                        },
                        false: undefined,
                        color: {
                            true: undefined,
                            false: undefined,
                            scale: {
                                type: 'const',
                                constVal: { val_min: 0, val_max: 80 },
                            },
                        },
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
                            type: 'const',
                            constVal: 'weather-tornado',
                        },
                        false: undefined,
                        color: {
                            true: undefined,
                            false: undefined,
                            scale: {
                                type: 'const',
                                constVal: { val_min: 0, val_max: 7.2 },
                            },
                        },
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
                            type: 'const',
                            constVal: 'windsock',
                        },
                        false: undefined,
                        color: {
                            true: {
                                type: 'const',
                                constVal: Color.White,
                            },
                            false: undefined,
                        },
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
            alternateEntity: [],
            indicatorEntity: [],
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
                            type: 'const',
                            constVal: 'windsock',
                        },
                        false: undefined,
                        color: {
                            true: {
                                type: 'const',
                                constVal: Color.White,
                            },
                            false: undefined,
                        },
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
                            type: 'const',
                            constVal: 'windsock',
                        },
                        false: undefined,
                        color: {
                            true: {
                                type: 'const',
                                constVal: Color.White,
                            },
                            false: undefined,
                        },
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
        config: {
            momentLocale: '',
            locale: 'de-DE',
            iconBig1: false,
            iconBig2: false,
        },
    },
    // override by password.ts
    topic: 'nspanel/ns_panel2',
    name: 'Wohnzimmer',
};

// pageType~popupNotify
export const welcomePopupPayload =
    'entityUpdateDetail~ -~Willkommen zum NSPanel~63488~~2000~~2000~' +
    '  Einen schönen Tag           ' +
    '     wünschen dir               ' +
    ' Armilar, TT-Tom, ticaki      ' +
    '   & Kuckuckmann~2000~3~1~~2000';
export const testConfigMedia: pages.PageMediaBase = {
    //type: 'sonstiges',
    card: 'cardMedia',
    dpInit: 'alexa2.0.Echo-Devices.G091EV0704641J8R.Player',
    initMode: 'auto',
    config: {
        heading: {
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
                constVal: { red: 250, green: 2, blue: 3 },
            },
            icon: undefined,
            list: undefined,
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
            mode: 'auto',
            type: 'triggered',
            role: ['level.volume'],
            dp: '',
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
            mode: 'auto',
            type: 'state',
            role: 'media.mode.shuffle',
            dp: '',
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
            color: { type: 'const', constVal: { red: 250, blue: 250, green: 0 } },
            list: undefined,
            action: 'cross',
        },
        toolbox: [
            {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: { type: 'const', constVal: 'Repeat' },
                icon: { type: 'const', constVal: 'repeat' },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: { type: 'state', dp: '', mode: 'auto', role: 'media.playlist' },
                action: 'cross',
            },
            {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: { type: 'const', constVal: '1' },
                icon: { type: 'const', constVal: 'home' },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: undefined,
                action: 'cross',
            },
            {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: { type: 'const', constVal: '1' },
                icon: { type: 'const', constVal: 'home' },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: undefined,
                action: 'cross',
            },
            {
                on: {
                    type: 'const',
                    constVal: false,
                },
                text: { type: 'const', constVal: '1' },
                icon: { true: { type: 'const', constVal: 'reply' }, false: { type: 'const', constVal: 'replay' } },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: undefined,
                action: 'cross',
            },
            {
                on: {
                    type: 'const',
                    constVal: false,
                },
                text: { type: 'const', constVal: '1' },
                icon: { type: 'const', constVal: 'home' },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: undefined,
                action: 'cross',
            },
            {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: { type: 'const', constVal: '1' },
                icon: { type: 'const', constVal: 'home' },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: undefined,
                action: 'cross',
            },
            {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: { type: 'const', constVal: '1' },
                icon: { type: 'const', constVal: 'home' },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: undefined,
                action: 'cross',
            },
            {
                on: {
                    type: 'const',
                    constVal: true,
                },
                text: { type: 'const', constVal: '1' },
                icon: { type: 'const', constVal: 'home' },
                color: { type: 'const', constVal: { red: 123, blue: 112, green: 0 } },
                list: undefined,
                action: 'cross',
            },
        ],
    },
    items: undefined,
    writeItems: undefined,
};

/*
   SendToPanel({ payload:'pageType~popupNotify'});
                    SendToPanel({ payload:'entityUpdateDetail~ -~Willkommen zum NSPanel~63488~~2000~~2000~' +
                        '  Einen schönen Tag           '+
                        '     wünschen dir               ' +
                        ' Armilar, TT-Tom, ticaki      ' +
                        '   & Kuckuckmann~2000~3~1~~2000'});*/
