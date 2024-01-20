import { Dataitem } from './data-item';
import * as Definition from './definition';
import * as Color from './color';
import { BaseClass } from './library';
import * as NSPanel from './types-d';
import * as Icons from './icon_mapping'

type ScreensaverOptionsType = {
    leftEntity: NSPanel.Config['leftScreensaverEntity'];
    bottomEntity: NSPanel.Config['bottomScreensaverEntity'];
    indicatorEntity: NSPanel.Config['indicatorScreensaverEntity'];
    mrIcon1Entity: NSPanel.Config['mrIcon1ScreensaverEntity'];
    mrIcon2Entity: NSPanel.Config['mrIcon2ScreensaverEntity'];
    
};
type ScreensaverModeType = 'standard' | 'alternate' | 'detail';

const maxEntities = 5;
export class Screensaver extends BaseClass {
    private config: ScreensaverOptionsType;
    layout: ScreensaverModeType = 'standard'
    private items: Record<keyof ScreensaverOptionsType, NSPanel.ScreenSaverDataItems[]> = {
        leftEntity:[],
        bottomEntity: [],
        indicatorEntity: [],
        mrIcon1Entity: [],
        mrIcon2Entity: [],
    }
    readonly mode: ScreensaverModeType;
    constructor(adapter: any, mode: ScreensaverModeType, options: ScreensaverOptionsType) {
        super(adapter, 'screensaver');
        this.config = options;
        this.mode = mode;
    }
    async init(): Promise<void> {
        /*const item = new Dataitem(this.adapter, {
            name: 'weather',
            dp: config.weatherEntity + '.ICON',
            type: 'triggered',
        });
        if (await item.isValidAndInit()) {

        }*/
        
        let checkpoint = true;
        let i = 0;
        const place = 'bottomEntity';
        const config = this.config;
        for (i = 0; i < config[place].length; i++) {
            if (config[place][i] == null || config[place][i] === undefined) {
                checkpoint = false;
                break;
            }
            const entry = config[place][i];
            if (entry === undefined) continue;
            let tempItem: Partial<NSPanel.ScreenSaverDataItems> = {}
            for (const j1 in entry ) {
                const j = j1 as keyof typeof entry;
                const data = entry[j]
                tempItem[j] = data !== undefined ? new Dataitem(this.adapter,  data) : undefined;
                if (tempItem[j] !== undefined && !await tempItem[j]!.isValidAndInit()) {
                    tempItem[j] = undefined;
                }
            }
            let item: NSPanel.ScreenSaverDataItems = tempItem as NSPanel.ScreenSaverDataItems;
            
            let test: boolean = false;
            for (let i2 in item) {
                const l = i2 as keyof NSPanel.ScreenSaverDataItems
                if (item[l] !== null) {
                    test = true;
                    break;
                }
            }
            if (!test || item.entity === undefined) {
                continue;
            }
            
            this.items[place].push(item)
            //RegisterEntityWatcher(config[place][i].entity);
   
            
    }

    }
    UnsubscribeWatcher(): void {
        try {
            for (const [key, value] of Object.entries(subscriptions)) {
                unsubscribe(value);
                delete subscriptions[key];
            }
        } catch (err: any) {
            log('error at UnsubscribeWatcher: ' + err.message, 'warn');
        }
    }
    update(): void {
        try {
            //UnsubscribeWatcher();

            let payloadString: string = '';
            const temperatureUnit = ''//getState(Definition.NSPanel_Path + 'Config.temperatureUnit').val;
            const screensaverAdvanced = ''//getState(Definition.NSPanel_Path + 'Config.Screensaver.ScreensaverAdvanced').val;

            //Create Weather MainIcon
            /*if (this.config.weatherEntity != null && existsObject(Definition.config.weatherEntity)) {
                const icon = getState(Definition.config.weatherEntity + '.ICON').val;
                RegisterEntityWatcher(Definition.config.weatherEntity + '.ICON');
                let temperature = '0';
                if (existsState(Definition.config.weatherEntity + '.ACTUAL')) {
                    temperature = getState(Definition.config.weatherEntity + '.ACTUAL').val;
                    RegisterEntityWatcher(Definition.config.weatherEntity + '.ACTUAL');
                } else {
                    if (existsState(Definition.config.weatherEntity + '.TEMP')) {
                        temperature = getState(Definition.config.weatherEntity + '.TEMP').val;
                    } else {
                        ('null');
                    }
                }
                const optionalValue = temperature + ' ' + temperatureUnit;
                let entityIcon = '';
                let entityIconCol = 0;
                if (Definition.weatherAdapterInstance == 'daswetter.' + weatherAdapterInstanceNumber + '.') {
                    entityIcon = Icons.GetIcon(GetDasWetterIcon(parseInt(icon)));
                    entityIconCol = GetDasWetterIconColor(parseInt(icon));
                } else if (Definition.weatherAdapterInstance == 'accuweather.' + weatherAdapterInstanceNumber + '.') {
                    entityIcon = Icons.GetIcon(GetAccuWeatherIcon(parseInt(icon)));
                    entityIconCol = GetAccuWeatherIconColor(parseInt(icon));
                }

                payloadString += '~' + '~' + entityIcon + '~' + entityIconCol + '~' + '~' + optionalValue + '~';
            }*/

            // 3 leftScreensaverEntities
            if (this.layout == 'detail') {
                const maxItems = 3;
                let i = 0;
                
                    for (i = 0; i < maxItems && i < this.items.leftEntity.length; i++) {
                        const item: NSPanel.ScreenSaverDataItems = this.items.leftEntity[i];
                        if (item === null || item === undefined || item.entity === undefined) {
                            continue;
                        }
                        //RegisterEntityWatcher(leftEntity.entity);

                        let iconColor = Color.rgb_dec565(Color.White);
                        let icon;
                        if (
                            item.entityIconOn
                        ) {
                            const val = await item.entityIconOn.getString();
                            if (val !== null) icon = Icons.GetIcon(val);
                        } 
                        let val: string | number | null = await item.entity.getNumber();
                        // if val not null its a number
                        if (val !== null) {
                            if (item.entityFactor) {
                                const v = await item.entityFactor.getNumber();
                                if(v !== null) val *= v;
                            }
                            if (item.entityDecimalPlaces) {
                                const v = await item.entityDecimalPlaces.getNumber();
                                const v2 = item.entityUnitText ? await item.entityUnitText.getString() : null;
                                if( v !== null) val = val.toFixed(v) + (v2 !== null ? v2 : '')        
                            }
                            
                            iconColor = Color.rgb_dec565(Color.White) //GetScreenSaverEntityColor(config[place][i]);
                        } else if (item.entity.type == 'boolean') {
                            iconColor = Color.rgb_dec565(Color.White) //GetScreenSaverEntityColor(config[place][i]);
                            if (!val && item.entityIconOff) {
                                const t = await item.entityIconOff.getString();
                                if (t !== null) icon = Icons.GetIcon(t);
                            }
                            if (val && item.entityOnText != undefined) {
                                const t = await item.entityOnText.getString();
                                if (t !== null) val = t;
                            } else if (!val && item.entityOffText != undefined) {
                                const t = await item.entityOffText.getString();
                                if (t !== null) val = t;
                            }
                        } else if (item.entity.type == 'string') {
                            iconColor = Color.rgb_dec565(Color.White) //GetScreenSaverEntityColor(config[place][i]);
                            /* Kenne das Modul nicht, mal sehen das sollte auch anders gehen.
                            const pformat = parseFormat(val);
                            if (Definition.Debug)
                                log(
                                    'moments.js --> Datum ' + val + ' valid?: ' + moment(val, pformat, true).isValid(),
                                    'info',
                                );
                            if (moment(val, pformat, true).isValid()) {
                                const DatumZeit = moment(val, pformat).unix(); // Conversion to Unix time stamp
                                if (config[place][i].entityDateFormat !== undefined) {
                                    val = new Date(DatumZeit * 1000).toLocale
                                        getState(Definition.NSPanel_Path + 'Config.locale').val,
                                        config[place][i].entityDateFormat,
                                    );
                                } else {
                                    val = new Date(DatumZeit * 1000).toLocale
                                        getState(Definition.NSPanel_Path + 'Config.locale').val,
                                    );
                                }
                            }*/
                        }

                      
                        const temp = leftEntity.entityIconColor;
                        if (temp && typeof temp == 'string' && existsObject(temp)) {
                            iconColor = getState(temp).val;
                        }

                        payloadString +=
                            '~' +
                            '~' +
                            icon +
                            '~' +
                            iconColor +
                            '~' +
                            leftEntity.entityText +
                            '~' +
                            val +
                            '~';
                    }
                
                    for (i; i < maxItems; i++) {
                        payloadString += '~~~~~~';
                    }
                
            }

            // 6 bottomScreensaverEntities
            let maxEntities: number = 7;
            if (screensaverAdvanced == false) {
                maxEntities = 5;
                if (getState(Definition.NSPanel_Path + 'Config.Screensaver.alternativeScreensaverLayout').val) {
                    maxEntities = 6;
                }
            }

            if (weatherForecast) {
                if (getState(Definition.NSPanel_Path + 'Config.Screensaver.alternativeScreensaverLayout').val) {
                    maxEntities = 5;
                }

                for (let i = 1; i < maxEntities; i++) {
                    let TempMin = 0;
                    let TempMax = 0;
                    let DayOfWeek = 0;
                    let WeatherIcon = '0';
                    let WheatherColor = 0;

                    if (Definition.weatherAdapterInstance == 'daswetter.' + weatherAdapterInstanceNumber + '.') {
                        TempMin = getState(
                            'daswetter.' +
                                weatherAdapterInstanceNumber +
                                '.NextDays.Location_1.Day_' +
                                i +
                                '.Minimale_Temperatur_value',
                        ).val;
                        TempMax = getState(
                            'daswetter.' +
                                weatherAdapterInstanceNumber +
                                '.NextDays.Location_1.Day_' +
                                i +
                                '.Maximale_Temperatur_value',
                        ).val;
                        DayOfWeek = getState(
                            'daswetter.' +
                                weatherAdapterInstanceNumber +
                                '.NextDays.Location_1.Day_' +
                                i +
                                '.Tag_value',
                        ).val.substring(0, 2);
                        WeatherIcon = GetDasWetterIcon(
                            getState(
                                'daswetter.' +
                                    weatherAdapterInstanceNumber +
                                    '.NextDays.Location_1.Day_' +
                                    i +
                                    '.Wetter_Symbol_id',
                            ).val,
                        );
                        WheatherColor = GetDasWetterIconColor(
                            getState(
                                'daswetter.' +
                                    weatherAdapterInstanceNumber +
                                    '.NextDays.Location_1.Day_' +
                                    i +
                                    '.Wetter_Symbol_id',
                            ).val,
                        );

                        RegisterEntityWatcher(
                            'daswetter.' +
                                weatherAdapterInstanceNumber +
                                '.NextDays.Location_1.Day_' +
                                i +
                                '.Minimale_Temperatur_value',
                        );
                        RegisterEntityWatcher(
                            'daswetter.' +
                                weatherAdapterInstanceNumber +
                                '.NextDays.Location_1.Day_' +
                                i +
                                '.Maximale_Temperatur_value',
                        );
                        RegisterEntityWatcher(
                            'daswetter.' +
                                weatherAdapterInstanceNumber +
                                '.NextDays.Location_1.Day_' +
                                i +
                                '.Tag_value',
                        );
                        RegisterEntityWatcher(
                            'daswetter.' +
                                weatherAdapterInstanceNumber +
                                '.NextDays.Location_1.Day_' +
                                i +
                                '.Wetter_Symbol_id',
                        );
                    } else if (Definition.weatherAdapterInstance == 'accuweather.' + weatherAdapterInstanceNumber + '.') {
                        if (i < 6) {
                            //Maximal 5 Tage bei accuweather
                            TempMin = existsObject(
                                'accuweather.' + weatherAdapterInstanceNumber + '.Summary.TempMin_d' + i,
                            )
                                ? getState('accuweather.' + weatherAdapterInstanceNumber + '.Summary.TempMin_d' + i).val
                                : 0;
                            TempMax = existsObject(
                                'accuweather.' + weatherAdapterInstanceNumber + '.Summary.TempMax_d' + i,
                            )
                                ? getState('accuweather.' + weatherAdapterInstanceNumber + '.Summary.TempMax_d' + i).val
                                : 0;
                            DayOfWeek = existsObject(
                                'accuweather.' + weatherAdapterInstanceNumber + '.Summary.DayOfWeek_d' + i,
                            )
                                ? getState('accuweather.' + weatherAdapterInstanceNumber + '.Summary.DayOfWeek_d' + i)
                                      .val
                                : 0;
                            WeatherIcon = existsObject(
                                'accuweather.' + weatherAdapterInstanceNumber + '.Summary.WeatherIcon_d' + i,
                            )
                                ? GetAccuWeatherIcon(
                                      getState(
                                          'accuweather.' + weatherAdapterInstanceNumber + '.Summary.WeatherIcon_d' + i,
                                      ).val,
                                  )
                                : '';
                            WheatherColor = existsObject(
                                'accuweather.' + weatherAdapterInstanceNumber + '.Summary.WeatherIcon_d' + i,
                            )
                                ? GetAccuWeatherIconColor(
                                      getState(
                                          'accuweather.' + weatherAdapterInstanceNumber + '.Summary.WeatherIcon_d' + i,
                                      ).val,
                                  )
                                : 0;

                            RegisterEntityWatcher(
                                'accuweather.' + weatherAdapterInstanceNumber + '.Summary.TempMin_d' + i,
                            );
                            RegisterEntityWatcher(
                                'accuweather.' + weatherAdapterInstanceNumber + '.Summary.TempMax_d' + i,
                            );
                            RegisterEntityWatcher(
                                'accuweather.' + weatherAdapterInstanceNumber + '.Summary.DayOfWeek_d' + i,
                            );
                            RegisterEntityWatcher(
                                'accuweather.' + weatherAdapterInstanceNumber + '.Summary.WeatherIcon_d' + i,
                            );
                        }
                    }

                    let tempMinMaxString: string = '';
                    if (Definition.weatherScreensaverTempMinMax == 'Min') {
                        tempMinMaxString = TempMin + temperatureUnit;
                    } else if (Definition.weatherScreensaverTempMinMax == 'Max') {
                        tempMinMaxString = TempMax + temperatureUnit;
                    } else if (Definition.weatherScreensaverTempMinMax == 'MinMax') {
                        tempMinMaxString = Math.round(TempMin) + '° ' + Math.round(TempMax) + '°';
                    }

                    if (Definition.weatherAdapterInstance == 'accuweather.' + weatherAdapterInstanceNumber + '.' && i == 6) {
                        let nextSunEvent = 0;
                        const valDateNow = new Date().getTime();
                        const arraySunEvent: number[] = [];

                        arraySunEvent[0] = getDateObject(
                            getState('accuweather.' + weatherAdapterInstanceNumber + '.Daily.Day1.Sunrise').val,
                        ).getTime();
                        arraySunEvent[1] = getDateObject(
                            getState('accuweather.' + weatherAdapterInstanceNumber + '.Daily.Day1.Sunset').val,
                        ).getTime();
                        arraySunEvent[2] = getDateObject(
                            getState('accuweather.' + weatherAdapterInstanceNumber + '.Daily.Day2.Sunrise').val,
                        ).getTime();

                        let j = 0;
                        for (j = 0; j < 3; j++) {
                            if (arraySunEvent[j] > valDateNow) {
                                nextSunEvent = j;
                                break;
                            }
                        }
                        let sun = '';
                        if (j == 1) {
                            sun = 'weather-sunset-down';
                        } else {
                            sun = 'weather-sunset-up';
                        }

                        payloadString +=
                            '~' +
                            '~' +
                            Icons.GetIcon(sun) +
                            '~' +
                            rgb_dec565(Definition.MSYellow) +
                            '~' +
                            'Sonne' +
                            '~' +
                            formatDate(getDateObject(arraySunEvent[nextSunEvent]), 'hh:mm') +
                            '~';
                    } else {
                        payloadString +=
                            '~' +
                            '~' +
                            Icons.GetIcon(WeatherIcon) +
                            '~' +
                            WheatherColor +
                            '~' +
                            DayOfWeek +
                            '~' +
                            tempMinMaxString +
                            '~';
                    }
                }

                //Alternativ Layout bekommt zusätzlichen Status
                if (
                    Definition.config[place][4] &&
                    getState(Definition.NSPanel_Path + 'Config.Screensaver.alternativeScreensaverLayout').val
                ) {
                    let val = getState(Definition.config[place][4].entity).val;
                    if (parseFloat(val + '') == val) {
                        val = parseFloat(val);
                    }
                    let iconColor = rgb_dec565(Color.White);
                    if (typeof val == 'number') {
                        val =
                            (
                                val *
                                (Definition.config[place][4].entityFactor
                                    ? Definition.config[place][4].entityFactor
                                    : 0)
                            ).toFixed(Definition.config[place][4].entityDecimalPlaces) +
                            Definition.config[place][4].entityUnitText;
                        iconColor = GetScreenSaverEntityColor(Definition.config[place][4]);
                    } else if (typeof val == 'boolean') {
                        iconColor = GetScreenSaverEntityColor(Definition.config[place][4]);
                    } else if (typeof val == 'string') {
                        iconColor = GetScreenSaverEntityColor(Definition.config[place][4]);

                        const pformat = parseFormat(val);
                        if (Definition.Debug)
                            log(
                                'moments.js --> Datum ' + val + ' valid?: ' + moment(val, pformat, true).isValid(),
                                'info',
                            );
                        if (moment(val, pformat, true).isValid()) {
                            const DatumZeit = moment(val, pformat).unix(); // Conversion to Unix time stamp
                            if (Definition.config[place][4].entityDateFormat !== undefined) {
                                val = new Date(DatumZeit * 1000).toLocale
                                    getState(Definition.NSPanel_Path + 'Config.locale').val,
                                    Definition.config[place][4].entityDateFormat,
                                );
                            } else {
                                val = new Date(DatumZeit * 1000).toLocale
                                    getState(Definition.NSPanel_Path + 'Config.locale').val,
                                );
                            }
                        }
                    }
                    const temp = Definition.config[place][4].entityIconColor;
                    if (temp && typeof temp == 'string' && existsObject(temp)) {
                        iconColor = getState(temp).val;
                    }
                    payloadString +=
                        '~' +
                        '~' +
                        Icons.GetIcon(Definition.config[place][4].entityIconOn) +
                        '~' +
                        iconColor +
                        '~' +
                        Definition.config[place][4].entityText +
                        '~' +
                        val;
                }
            } else {
                let checkpoint = true;
                let i = 0;
                for (i = 0; i < maxEntities - 1 && i < Definition.config[place].length; i++) {
                    if (Definition.config[place][i] == null || Definition.config[place][i] === undefined) {
                        checkpoint = false;
                        break;
                    }
                    RegisterEntityWatcher(Definition.config[place][i].entity);

                    let val = getState(Definition.config[place][i].entity).val;
                    if (parseFloat(val + '') == val) {
                        val = parseFloat(val);
                    }
                    let iconColor = rgb_dec565(Color.White);
                    let icon;
                    if (
                        Definition.config[place][i].entityIconOn &&
                        existsObject(Definition.config[place][i].entityIconOn!)
                    ) {
                        const iconName = getState(Definition.config[place][i].entityIconOn!).val;
                        icon = Icons.GetIcon(iconName);
                    } else {
                        icon = Icons.GetIcon(Definition.config[place][i].entityIconOn);
                    }

                    if (typeof val == 'number') {
                        val =
                            (
                                val *
                                (Definition.config[place][i].entityFactor
                                    ? Definition.config[place][i].entityFactor!
                                    : 0)
                            ).toFixed(Definition.config[place][i].entityDecimalPlaces) +
                            Definition.config[place][i].entityUnitText;
                        iconColor = GetScreenSaverEntityColor(Definition.config[place][i]);
                    } else if (typeof val == 'boolean') {
                        iconColor = GetScreenSaverEntityColor(Definition.config[place][i]);
                        if (!val && Definition.config[place][i].entityIconOff != null) {
                            icon = Icons.GetIcon(Definition.config[place][i].entityIconOff);
                        }
                        if (val && Definition.config[place][i].entityOnText != undefined) {
                            val = Definition.config[place][i].entityOnText;
                        }
                        if (!val && Definition.config[place][i].entityOffText != undefined) {
                            val = Definition.config[place][i].entityOffText;
                        }
                    } else if (typeof val == 'string') {
                        iconColor = GetScreenSaverEntityColor(Definition.config[place][i]);
                        const pformat = parseFormat(val);
                        if (Definition.Debug)
                            log(
                                'moments.js --> Datum ' + val + ' valid?: ' + moment(val, pformat, true).isValid(),
                                'info',
                            );
                        if (moment(val, pformat, true).isValid()) {
                            const DatumZeit = moment(val, pformat).unix(); // Conversion to Unix time stamp
                            if (Definition.config[place][i].entityDateFormat !== undefined) {
                                val = new Date(DatumZeit * 1000).toLocale
                                    getState(Definition.NSPanel_Path + 'Config.locale').val,
                                    Definition.config[place][i].entityDateFormat,
                                );
                            } else {
                                val = new Date(DatumZeit * 1000).toLocale
                                    getState(Definition.NSPanel_Path + 'Config.locale').val,
                                );
                            }
                        }
                    }

                    const temp = Definition.config[place][4].entityIconColor;
                    if (temp && typeof temp == 'string' && existsObject(temp)) {
                        iconColor = getState(temp).val;
                    }
                    if (i < maxEntities - 1) {
                        val = val + '~';
                    }
                    payloadString +=
                        '~' +
                        '~' +
                        icon +
                        '~' +
                        iconColor +
                        '~' +
                        Definition.config[place][i].entityText +
                        '~' +
                        val;
                }
                if (checkpoint == false) {
                    for (let j = i; j < maxEntities - 1; j++) {
                        payloadString += '~~~~~~';
                    }
                }
            }

            if (screensaverAdvanced) {
                // 5 indicatorScreensaverEntities
                for (let i = 0; i < 5 && i < Definition.config.indicatorEntity.length; i++) {
                    const indicatorEntity: NSPanel.ScreenSaverElementWithUndefined =
                        Definition.config.indicatorEntity[i];
                    if (indicatorEntity === null || indicatorEntity === undefined) {
                        break;
                    }
                    RegisterEntityWatcher(indicatorEntity.entity);

                    let val = getState(indicatorEntity.entity).val;
                    if (parseFloat(val + '') == val) {
                        val = parseFloat(val);
                    }
                    let iconColor = rgb_dec565(Color.White);

                    if (
                        indicatorEntity.entityIconOn &&
                        existsObject(indicatorEntity.entityIconOn!)
                    ) {
                        const iconName = getState(indicatorEntity.entityIconOn!).val;
                        icon = Icons.GetIcon(iconName);
                    } else {
                        icon = Icons.GetIcon(indicatorEntity.entityIconOn);
                    }

                    if (typeof val == 'number') {
                        val =
                            (
                                val *
                                (indicatorEntity.entityFactor
                                    ? indicatorEntity.entityFactor!
                                    : 0)
                            ).toFixed(indicatorEntity.entityDecimalPlaces) +
                            indicatorEntity.entityUnitText;
                        iconColor = GetScreenSaverEntityColor(indicatorEntity);
                    } else if (typeof val == 'boolean') {
                        iconColor = GetScreenSaverEntityColor(indicatorEntity);
                        if (!val && indicatorEntity.entityIconOff != null) {
                            icon = Icons.GetIcon(indicatorEntity.entityIconOff);
                        }
                    }
                    const temp = indicatorEntity.entityIconColor;
                    if (temp && typeof temp == 'string' && existsObject(temp)) {
                        iconColor = getState(temp).val;
                    }
                    payloadString +=
                        '~' +
                        '~' +
                        icon +
                        '~' +
                        iconColor +
                        '~' +
                        indicatorEntity.entityText +
                        '~' +
                        val +
                        '~';
                }
            }
            if (Definition.Debug) log('HandleScreensaverUpdate payload: weatherUpdate~' + payloadString, 'info');

            SendToPanel({ payload: 'weatherUpdate~' + payloadString });

            HandleScreensaverStatusIcons();
        } catch (err: any) {
            this.log.debug('error at HandleScreensaverUpdate: ' + err.message, 'warn');
        }
    }

    RegisterEntityWatcher(id: string): void {
        try {
            if (subscriptions.hasOwnProperty(id)) {
                return;
            }

            subscriptions[id] = on({ id: id, change: 'any' }, () => {
                HandleScreensaverUpdate();
            });
        } catch (err: any) {
            log('RegisterEntityWatcher: ' + err.message, 'warn');
        }
    }

    HandleScreensaverStatusIcons(): void {
        try {
            let payloadString = '';
            const iconData: Record<'mrIcon1' | 'mrIcon2', NSPanel.ScreenSaverMRDataElement> = {
                mrIcon1: {
                    Entity:
                        Definition.config.mrIcon1Entity.entity != null &&
                        existsState(Definition.config.mrIcon1Entity.entity)
                            ? getState(Definition.config.mrIcon1Entity.entity).val
                            : null,
                    EntityIconOn: Definition.config.mrIcon1Entity.entityIconOn
                        ? Icons.GetIcon(Definition.config.mrIcon1Entity.entityIconOn)
                        : '',
                    EntityIconOff: Definition.config.mrIcon1Entity.entityIconOff
                        ? Icons.GetIcon(Definition.config.mrIcon1Entity.entityIconOff)
                        : '',
                    EntityOnColor: Definition.config.mrIcon1Entity.entityOnColor,
                    EntityOffColor: Definition.config.mrIcon1Entity.entityOffColor,
                    EntityValue:
                        Definition.config.mrIcon1Entity.entityValue === null
                            ? null
                            : getState(Definition.config.mrIcon1Entity.entityValue).val,
                    EntityValueDecimalPlace:
                        Definition.config.mrIcon1Entity.entityValueDecimalPlace,
                    EntityValueUnit: Definition.config.mrIcon1Entity.entityValueUnit,
                    EntityIconSelect:
                        Definition.config.mrIcon1Entity.entityIconSelect &&
                        typeof Definition.config.mrIcon1Entity.entityIconSelect === 'object'
                            ? Definition.config.mrIcon1Entity.entityIconSelect
                            : null,
                },
                mrIcon2: {
                    Entity:
                        Definition.config.mrIcon2Entity.entity != null &&
                        existsState(Definition.config.mrIcon2Entity.entity)
                            ? getState(Definition.config.mrIcon2Entity.entity).val
                            : null,
                    EntityIconOn: Definition.config.mrIcon2Entity.entityIconOn
                        ? Icons.GetIcon(Definition.config.mrIcon2Entity.entityIconOn)
                        : '',
                    EntityIconOff: Definition.config.mrIcon2Entity.entityIconOff
                        ? Icons.GetIcon(Definition.config.mrIcon2Entity.entityIconOff)
                        : '',
                    EntityOnColor: Definition.config.mrIcon2Entity.entityOnColor,
                    EntityOffColor: Definition.config.mrIcon2Entity.entityOffColor,
                    EntityValue:
                        Definition.config.mrIcon2Entity.entityValue === null
                            ? null
                            : getState(Definition.config.mrIcon2Entity.entityValue).val,
                    EntityValueDecimalPlace:
                        Definition.config.mrIcon2Entity.entityValueDecimalPlace,
                    EntityValueUnit: Definition.config.mrIcon2Entity.entityValueUnit,
                    EntityIconSelect:
                        Definition.config.mrIcon2Entity.entityIconSelect &&
                        typeof Definition.config.mrIcon2Entity.entityIconSelect === 'object'
                            ? Definition.config.mrIcon2Entity.entityIconSelect
                            : null,
                },
            };
            for (const a in iconData) {
                if (iconData[a].entityValue !== null) {
                    switch (typeof iconData[a].entityValue) {
                        case 'string':
                            if (iconData[a].entityValue === '' || isNaN(iconData[a].entityValue))
                                break;
                        case 'number':
                        case 'bigint':
                            iconData[a].entityValue = Number(iconData[a].entityValue).toFixed(
                                iconData[a].entityValueDecimalPlace,
                            );
                            break;
                        case 'boolean':
                            break;
                        case 'symbol':
                        case 'undefined':
                        case 'object':
                        case 'function':
                            iconData[a].entityValue = null;
                    }
                }
                let hwBtn1Col: NSPanel.RGB = iconData[a].entityOffColor;
                if (iconData[a].entity != null || iconData[a].entityValue != null) {
                    // Prüfung ob Entity vom Typ String ist
                    if (iconData[a].entity != null) {
                        if (typeof iconData[a].entity == 'string') {
                            if (Definition.Debug) log('Entity ist String', 'info');
                            switch (iconData[a].entity).toUpperCase()) {
                                case 'ON':
                                case 'OK':
                                case 'AN':
                                case 'YES':
                                case 'TRUE':
                                case 'ONLINE':
                                    hwBtn1Col = iconData[a].entityOnColor;
                                    break;
                                default:
                            }
                            if (Definition.Debug)
                                log(
                                    'Value: ' + iconData[a].entity + ' Color: ' + JSON.stringify(hwBtn1Col),
                                    'info',
                                );
                            // Alles was kein String ist in Boolean umwandeln
                        } else {
                            if (Definition.Debug) log('Entity ist kein String', 'info');
                            if (!!iconData[a].entity) {
                                hwBtn1Col = iconData[a].entityOnColor;
                            }
                        }
                    }

                    // Icon ermitteln
                    if (iconData[a].entityIconSelect && iconData[a].entity != null) {
                        const icon = iconData[a].entityIconSelect[iconData[a].entity];
                        if (icon !== undefined) {
                            payloadString += Icons.GetIcon(icon);
                            if (Definition.Debug) log('SelectIcon: ' + payloadString, 'info');
                        }
                    } else if (iconData[a].entity) {
                        payloadString += iconData[a].entityIconOn;
                        if (Definition.Debug) log('Icon if true ' + payloadString, 'info');
                    } else {
                        if (iconData[a].entityIconOff) {
                            payloadString += iconData[a].entityIconOff;
                            if (Definition.Debug) log('Icon1 else true ' + payloadString, 'info');
                        } else {
                            payloadString += iconData[a].entityIconOn;
                            if (Definition.Debug) log('Icon1 else false ' + payloadString, 'info');
                        }
                    }

                    if (iconData[a].entityValue != null) {
                        payloadString += iconData[a].entityValue;
                        payloadString +=
                            iconData[a].entityValueUnit == null
                                ? ''
                                : iconData[a].entityValueUnit;
                    }

                    payloadString += '~' + rgb_dec565(hwBtn1Col) + '~';
                } else {
                    hwBtn1Col = Definition.Black;
                    payloadString += '~~';
                }
            }

            const alternateScreensaverMFRIcon1Size = getState(
                Definition.NSPanel_Path + 'Config.MRIcons.alternateMRIconSize.1',
            ).val;
            const alternateScreensaverMFRIcon2Size = getState(
                Definition.NSPanel_Path + 'Config.MRIcons.alternateMRIconSize.2',
            ).val;
            //Alternate MRIcon Size
            if (alternateScreensaverMFRIcon1Size) {
                payloadString += '1~';
            } else {
                payloadString += '~';
            }
            if (alternateScreensaverMFRIcon2Size) {
                payloadString += '1~';
            } else {
                payloadString += '~';
            }

            SendToPanel({ payload: 'statusUpdate~' + payloadString });
        } catch (err: any) {
            log('error at HandleScreensaverStatusIcons: ' + err.message, 'warn');
        }
    }
}

function GetScreenSaverEntityColor(configElement: NSPanel.ScreenSaverElement | null): number {
    try {
        let colorReturn: number;
        if (configElement && configElement.ScreensaverEntityIconColor != undefined) {
            const ScreensaverEntityIconColor = configElement.ScreensaverEntityIconColor as NSPanel.IconScaleElement;
            if (typeof getState(configElement.ScreensaverEntity).val == 'boolean') {
                let iconvalbest = (typeof ScreensaverEntityIconColor == 'object' && ScreensaverEntityIconColor.val_best !== undefined ) ? ScreensaverEntityIconColor.val_best : false ;
                colorReturn = (getState(configElement.ScreensaverEntity).val == iconvalbest) ? rgb_dec565(colorScale0) : rgb_dec565(colorScale10);
            } else if (typeof ScreensaverEntityIconColor == 'object') {
                const iconvalmin: number = ScreensaverEntityIconColor.val_min != undefined ? ScreensaverEntityIconColor.val_min : 0 ;
                const iconvalmax: number = ScreensaverEntityIconColor.val_max != undefined ? ScreensaverEntityIconColor.val_max : 100 ;
                const iconvalbest: number = ScreensaverEntityIconColor.val_best != undefined ? ScreensaverEntityIconColor.val_best : iconvalmin ;
                let valueScale = getState(configElement.ScreensaverEntity).val * configElement.ScreensaverEntityFactor!;

                if (iconvalmin == 0 && iconvalmax == 1) {
                    colorReturn = (getState(configElement.ScreensaverEntity).val == 1) ? rgb_dec565(colorScale0) : rgb_dec565(colorScale10);
                } else {
                    if (iconvalbest == iconvalmin) {
                        valueScale = scale(valueScale,iconvalmin, iconvalmax, 10, 0);
                    } else {
                        if (valueScale < iconvalbest) {
                            valueScale = scale(valueScale,iconvalmin, iconvalbest, 0, 10);
                        } else if (valueScale > iconvalbest || iconvalbest != iconvalmin) {
                            valueScale = scale(valueScale,iconvalbest, iconvalmax, 10, 0);
                        } else {
                            valueScale = scale(valueScale,iconvalmin, iconvalmax, 10, 0);
                        }
                    }
                    //limit if valueScale is smaller/larger than 0-10
                    if (valueScale > 10) valueScale = 10;
                    if (valueScale < 0) valueScale = 0;

                    let valueScaletemp = (Math.round(valueScale)).toFixed();                   
                    colorReturn = HandleColorScale(valueScaletemp);
                }
                if (ScreensaverEntityIconColor.val_min == undefined) {
                    colorReturn = rgb_dec565(configElement.ScreensaverEntityIconColor as RGB);
                }
            } else {
                colorReturn = rgb_dec565(White);
            }
        } else {
            const value: number | boolean = configElement ? getState(configElement.ScreensaverEntity).val : 0;
            if (configElement && typeof value == 'boolean') {
                if (value) {
                    if (configElement.ScreensaverEntityOnColor != undefined) {
                        colorReturn = rgb_dec565(configElement.ScreensaverEntityOnColor);
                    } else {
                        colorReturn = rgb_dec565(White);
                    }
                } else {
                    if (configElement.ScreensaverEntityOffColor != undefined) {
                        colorReturn = rgb_dec565(configElement.ScreensaverEntityOffColor);
                    } else {
                        colorReturn = rgb_dec565(White);
                    }
                }
            } else {
                colorReturn = rgb_dec565(White);
            }
        }
        return colorReturn;
    } catch (err: any) {
        log('error at function GetScreenSaverEntityColor: '+ err.message, 'warn');
    }
    return rgb_dec565(White);
}