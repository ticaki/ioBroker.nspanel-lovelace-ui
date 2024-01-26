import * as Color from './const/color';
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
                    entity: {
                        type: 'triggered',
                        dp: 'accuweather.0.Current.Temperature',
                    },
                    entityDateFormat: {
                        type: 'const',
                        constVal: null,
                    },
                    entityDecimalPlaces: {
                        type: 'const',
                        constVal: null,
                    },
                    entityFactor: undefined,
                    entityIconColor: {
                        type: 'state',

                        /** How to use
                         * this run its own this. U dont have accress to variables that no definied for this.
                         * Color: in a import of color.ts
                         * val: is the incoming value - raw
                         *
                         * The best thing is to write the function with () => { here }. Then remove the () => {}
                         * and convert it into a template literal, using ``. A return is mandatory.
                         */
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
                        dp: 'accuweather.0.Current.WeatherIcon',
                    },
                    entityIconColorScale: undefined,
                    entityIconOn: {
                        type: 'triggered',
                        dp: 'accuweather.0.Current.WeatherIcon',
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
                    },

                    entityIconOff: undefined,
                    entityIconSelect: undefined,
                    entityOffColor: undefined,
                    entityOffText: undefined,
                    entityOnColor: undefined,
                    entityOnText: undefined,
                    entityText: undefined,
                    entityUnitText: {
                        type: 'const',
                        constVal: '°C',
                    },
                },
            ],
            leftEntity: [],
            bottomEntity: [
                {
                    entity: {
                        type: 'state',
                        dp: 'accuweather.0.Daily.Day1.Sunrise',
                        forceType: 'string',
                    },
                    entityDateFormat: {
                        type: 'const',
                        constVal: JSON.stringify({ hour: '2-digit', minute: '2-digit' }),
                    },
                    entityDecimalPlaces: {
                        type: 'const',
                        constVal: 0,
                    },
                    entityFactor: {
                        type: 'const',
                        constVal: 1,
                    },
                    entityIconColor: {
                        type: 'const',
                        constVal: Color.Yellow,
                    },
                    entityIconColorScale: undefined,
                    entityIconOff: undefined,
                    entityIconOn: {
                        type: 'const',
                        constVal: 'weather-sunset-up',
                    },
                    entityIconSelect: undefined,
                    entityOffColor: {
                        type: 'const',
                        constVal: Color.Yellow,
                    },
                    entityOffText: undefined,
                    entityOnColor: undefined,
                    entityOnText: undefined,
                    entityText: {
                        type: 'const',
                        constVal: 'Sonne',
                    },
                    entityUnitText: undefined,
                },
                {
                    entity: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindSpeed',
                    },
                    entityDateFormat: undefined,
                    entityDecimalPlaces: {
                        type: 'const',
                        constVal: 1,
                    },
                    entityFactor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    entityIconColor: undefined,
                    entityIconColorScale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 120 },
                    },
                    entityIconOff: undefined,
                    entityIconOn: {
                        type: 'const',
                        constVal: 'weather-windy',
                    },
                    entityIconSelect: undefined,
                    entityOffColor: undefined,
                    entityOffText: undefined,
                    entityOnColor: undefined,
                    entityOnText: undefined,
                    entityText: {
                        type: 'const',
                        constVal: 'Wind',
                    },
                    entityUnitText: {
                        type: 'const',
                        constVal: 'm/s',
                    },
                },
                {
                    entity: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindGust',
                    },
                    entityDateFormat: undefined,
                    entityDecimalPlaces: {
                        type: 'const',
                        constVal: 1,
                    },
                    entityFactor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    entityIconColor: undefined,
                    entityIconColorScale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 120 },
                    },
                    entityIconOff: undefined,
                    entityIconOn: {
                        type: 'const',
                        constVal: 'weather-tornado',
                    },
                    entityIconSelect: undefined,
                    entityOffColor: undefined,
                    entityOffText: undefined,
                    entityOnColor: undefined,
                    entityOnText: undefined,
                    entityText: {
                        type: 'const',
                        constVal: 'Böen',
                    },
                    entityUnitText: {
                        type: 'const',
                        constVal: 'm/s',
                    },
                },
                {
                    entity: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindDirectionText',
                    },
                    entityDateFormat: undefined,
                    entityDecimalPlaces: {
                        type: 'const',
                        constVal: 0,
                    },
                    entityFactor: undefined,
                    entityIconColor: undefined,
                    entityIconColorScale: undefined,
                    entityIconOff: undefined,
                    entityIconOn: {
                        type: 'const',
                        constVal: 'windsock',
                    },
                    entityIconSelect: undefined,
                    entityOffColor: undefined,
                    entityOffText: undefined,
                    entityOnColor: {
                        type: 'const',
                        constVal: Color.White,
                    },
                    entityOnText: undefined,
                    entityText: {
                        type: 'const',
                        constVal: 'Windr.',
                    },
                    entityUnitText: {
                        type: 'const',
                        constVal: '°',
                    },
                },
                {
                    entity: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindGust',
                    },
                    entityDateFormat: undefined,
                    entityDecimalPlaces: {
                        type: 'const',
                        constVal: 1,
                    },
                    entityFactor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    entityIconColor: undefined,
                    entityIconColorScale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 120 },
                    },
                    entityIconOff: undefined,
                    entityIconOn: {
                        type: 'const',
                        constVal: 'weather-tornado',
                    },
                    entityIconSelect: undefined,
                    entityOffColor: undefined,
                    entityOffText: undefined,
                    entityOnColor: undefined,
                    entityOnText: undefined,
                    entityText: {
                        type: 'const',
                        constVal: 'Böen',
                    },
                    entityUnitText: {
                        type: 'const',
                        constVal: 'm/s',
                    },
                },
                {
                    entity: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindDirectionText',
                    },
                    entityDateFormat: undefined,
                    entityDecimalPlaces: {
                        type: 'const',
                        constVal: 0,
                    },
                    entityFactor: undefined,
                    entityIconColor: undefined,
                    entityIconColorScale: undefined,
                    entityIconOff: undefined,
                    entityIconOn: {
                        type: 'const',
                        constVal: 'windsock',
                    },
                    entityIconSelect: undefined,
                    entityOffColor: undefined,
                    entityOffText: undefined,
                    entityOnColor: {
                        type: 'const',
                        constVal: Color.White,
                    },
                    entityOnText: undefined,
                    entityText: {
                        type: 'const',
                        constVal: 'Windr.',
                    },
                    entityUnitText: {
                        type: 'const',
                        constVal: '°',
                    },
                },
            ],
            alternateEntity: [],
            indicatorEntity: [],
            mrIconEntity: [
                {
                    entity: {
                        type: 'internal',
                        dp: 'Relais1',
                    },
                    entityIconOff: {
                        type: 'const',
                        constVal: 'calendar-minus',
                    },
                    entityIconOn: {
                        type: 'const',
                        constVal: 'calendar-plus',
                    },
                    entityOffColor: {
                        type: 'const',
                        constVal: Color.White,
                    },
                    entityOnColor: {
                        type: 'const',
                        constVal: Color.Red,
                    },
                    entityValue: {
                        type: 'const',
                        constVal: 5,
                    },
                    entityValueDecimalPlace: {
                        type: 'const',
                        constVal: 0,
                    },
                    entityValueUnit: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconSelect: {
                        type: 'const',
                        constVal: null,
                    },
                },
                {
                    entity: {
                        type: 'const',
                        constVal: false,
                    },
                    entityIconOff: {
                        type: 'const',
                        constVal: 'calendar-minus',
                    },
                    entityIconOn: {
                        type: 'const',
                        constVal: 'home',
                    },
                    entityOffColor: {
                        type: 'const',
                        constVal: Color.White,
                    },
                    entityOnColor: {
                        type: 'const',
                        constVal: Color.Red,
                    },
                    entityValue: {
                        type: 'const',
                        constVal: 2,
                    },
                    entityValueDecimalPlace: {
                        type: 'const',
                        constVal: 0,
                    },
                    entityValueUnit: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconSelect: {
                        type: 'const',
                        constVal: null,
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

/*
   SendToPanel({ payload:'pageType~popupNotify'});
                    SendToPanel({ payload:'entityUpdateDetail~ -~Willkommen zum NSPanel~63488~~2000~~2000~' +
                        '  Einen schönen Tag           '+
                        '     wünschen dir               ' +
                        ' Armilar, TT-Tom, ticaki      ' +
                        '   & Kuckuckmann~2000~3~1~~2000'});*/
