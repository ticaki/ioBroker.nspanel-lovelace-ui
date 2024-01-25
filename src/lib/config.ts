import { Black, Green, MSGreen, MSRed, Red, White, Yellow, rgb_dec565 } from './const/color';
import { panelConfigPartial } from './controller/panel';

//~1 ~2 ~~32495~5 ~entityOffText~1 ~2 ~3 ~4 ~65535~6 ~2entityUnitText~2 ~3 ~4 ~5 ~65535~ ~3~ ~ ~ ~ ~65535~ ~4~ ~ ~ ~ ~65535~ ~5~ ~ to panel.
export const Testconfig: Partial<panelConfigPartial> = {
    screenSaverConfig: {
        mode: 'standard',
        entitysConfig: {
            favoritEntity: [
                {
                    entity: {
                        type: 'triggered',
                        dp: '0_userdata.0.trigger1',
                    },
                    entityDateFormat: {
                        type: 'const',
                        constVal: null,
                    },
                    entityDecimalPlaces: {
                        type: 'const',
                        constVal: null,
                    },
                    entityFactor: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconColor: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconColorScale: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconOff: {
                        type: 'const',
                        constVal: 'home',
                    },
                    entityIconOn: {
                        type: 'const',
                        constVal: 'account',
                    },
                    entityIconSelect: {
                        type: 'const',
                        constVal: null,
                    },
                    entityOffColor: {
                        type: 'const',
                        constVal: MSGreen,
                    },
                    entityOffText: {
                        type: 'const',
                        constVal: 'entityOffText',
                    },
                    entityOnColor: {
                        type: 'const',
                        constVal: MSRed,
                    },
                    entityOnText: {
                        type: 'const',
                        constVal: 'entityOnText',
                    },
                    entityText: {
                        type: 'const',
                        constVal: null,
                    },
                    entityUnitText: {
                        type: 'const',
                        constVal: 'Adapter',
                    },
                },
            ],
            leftEntity: [],
            bottomEntity: [
                {
                    entity: {
                        type: 'state',
                        dp: 'accuweather.0.Daily.Day1.Sunrise',
                        valType: 'string',
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
                        constVal: Yellow,
                    },
                    entityIconColorScale: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconOff: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconOn: {
                        type: 'const',
                        constVal: 'weather-sunset-up',
                    },
                    entityIconSelect: {
                        type: 'const',
                        constVal: null,
                    },
                    entityOffColor: {
                        type: 'const',
                        constVal: Yellow,
                    },
                    entityOffText: {
                        type: 'const',
                        constVal: null,
                    },
                    entityOnColor: {
                        type: 'const',
                        constVal: null,
                    },
                    entityOnText: {
                        type: 'const',
                        constVal: null,
                    },
                    entityText: {
                        type: 'const',
                        constVal: 'Sonne',
                    },
                    entityUnitText: {
                        type: 'const',
                        constVal: null,
                    },
                },
                {
                    entity: {
                        type: 'state',
                        dp: 'accuweather.0.Current.WindSpeed',
                    },
                    entityDateFormat: {
                        type: 'const',
                        constVal: null,
                    },
                    entityDecimalPlaces: {
                        type: 'const',
                        constVal: 1,
                    },
                    entityFactor: {
                        type: 'const',
                        constVal: 1000 / 3600,
                    },
                    entityIconColor: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconColorScale: {
                        type: 'const',
                        constVal: { val_min: 0, val_max: 120 },
                    },
                    entityIconOff: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconOn: {
                        type: 'const',
                        constVal: 'weather-windy',
                    },
                    entityIconSelect: {
                        type: 'const',
                        constVal: null,
                    },
                    entityOffColor: {
                        type: 'const',
                        constVal: null,
                    },
                    entityOffText: {
                        type: 'const',
                        constVal: null,
                    },
                    entityOnColor: {
                        type: 'const',
                        constVal: null,
                    },
                    entityOnText: {
                        type: 'const',
                        constVal: null,
                    },
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
                        type: 'const',
                        constVal: '4',
                    },
                    entityDateFormat: {
                        type: 'const',
                        constVal: null,
                    },
                    entityDecimalPlaces: {
                        type: 'const',
                        constVal: null,
                    },
                    entityFactor: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconColor: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconColorScale: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconOff: {
                        type: 'const',
                        constVal: 'home',
                    },
                    entityIconOn: {
                        type: 'const',
                        constVal: 'iconon',
                    },
                    entityIconSelect: {
                        type: 'const',
                        constVal: 'iconoff',
                    },
                    entityOffColor: {
                        type: 'const',
                        constVal: rgb_dec565(Black),
                    },
                    entityOffText: {
                        type: 'const',
                        constVal: 'entityOffText',
                    },
                    entityOnColor: {
                        type: 'const',
                        constVal: rgb_dec565(Green),
                    },
                    entityOnText: {
                        type: 'const',
                        constVal: 'entityOnText',
                    },
                    entityText: {
                        type: 'const',
                        constVal: null,
                    },
                    entityUnitText: {
                        type: 'const',
                        constVal: 'entityUnitText',
                    },
                },
                {
                    entity: {
                        type: 'const',
                        constVal: '5',
                    },
                    entityDateFormat: {
                        type: 'const',
                        constVal: null,
                    },
                    entityDecimalPlaces: {
                        type: 'const',
                        constVal: null,
                    },
                    entityFactor: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconColor: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconColorScale: {
                        type: 'const',
                        constVal: null,
                    },
                    entityIconOff: {
                        type: 'const',
                        constVal: 'home',
                    },
                    entityIconOn: {
                        type: 'const',
                        constVal: 'iconon',
                    },
                    entityIconSelect: {
                        type: 'const',
                        constVal: 'iconoff',
                    },
                    entityOffColor: {
                        type: 'const',
                        constVal: rgb_dec565(Black),
                    },
                    entityOffText: {
                        type: 'const',
                        constVal: 'entityOffText',
                    },
                    entityOnColor: {
                        type: 'const',
                        constVal: rgb_dec565(Green),
                    },
                    entityOnText: {
                        type: 'const',
                        constVal: 'entityOnText',
                    },
                    entityText: {
                        type: 'const',
                        constVal: null,
                    },
                    entityUnitText: {
                        type: 'const',
                        constVal: 'entityUnitText',
                    },
                },
            ],
            indicatorEntity: [],
            mrIconEntity: [
                {
                    entity: {
                        type: 'const',
                        constVal: true,
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
                        constVal: White,
                    },
                    entityOnColor: {
                        type: 'const',
                        constVal: Red,
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
                        constVal: White,
                    },
                    entityOnColor: {
                        type: 'const',
                        constVal: Red,
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
