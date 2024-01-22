import {Dataitem} from './data-item';
import * as Definition from './definition';
import * as Color from './color';
import {BaseClass} from './library';
import * as NSPanel from './types';
import * as Icons from './icon_mapping'

const dayjs = require('dayjs');
import moment from 'moment';
import parseFormat from 'moment-parseformat';
import {sendTemplates, weatherUpdateTestArray} from './msg-def';
import {BaseClassPanelSend, PanelSend} from './panel-message';


type ScreensaverConfigType = {
    momentLocale: string
    locale: Intl.DateTimeFormat;
}

export type ScreensaverConfig = {mode: NSPanel.ScreensaverModeType, options: NSPanel.ScreensaverOptionsType, config: ScreensaverConfigType}

const maxEntities = 5;
export class Screensaver extends BaseClassPanelSend {
    private options: NSPanel.ScreensaverOptionsType;
    layout: NSPanel.ScreensaverModeType = 'standard'
    timeUpdateTimeout: ioBroker.Timeout | undefined;
    private config: ScreensaverConfigType;
    private items: Record<keyof NSPanel.ScreensaverOptionsType, (NSPanel.ScreenSaverDataItems | undefined)[]> = {
        favoritEntity: [],
        leftEntity: [],
        bottomEntity: [],
        indicatorEntity: [],
        mrIconEntity: [],
    }
    readonly mode: NSPanel.ScreensaverModeType;

    private readonly emptyEntry = '~~~~~~';

    constructor(adapter: any, config: ScreensaverConfig, panelSend: PanelSend) {
        super(adapter, panelSend, 'screensaver');
        this.options = config.options;
        this.mode = config.mode;
        this.config = config.config;
        moment.locale(config.config.momentLocale);

    }
    async init (): Promise<void> {
        // start sendTimeLoop
        this.timeUpdateTimeout = this.adapter.setTimeout(this.timeUpdateLoop, 1000);


        //const place = 'bottomEntity';
        const config = this.options;
        for (const key of Definition.ScreenSaverAllPlaces) {
            for (const entry of config[key]) {
                if (entry == null || entry === undefined) {
                    this.items[key].push(undefined)
                    continue;
                }
                let tempItem: Partial<NSPanel.ScreenSaverDataItems> = {}
                for (const j1 in entry) {
                    const j = j1 as keyof typeof entry;
                    const data = entry[j]
                    tempItem[j] = data !== undefined ? new Dataitem(this.adapter, data) : undefined;
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

                this.items[key].push(item)
                //this.controller.RegisterEntityWatcher(this, item);
            }
        }

    }

    const timeUpdateLoop = (): void => {
        if (this.unload) return;
        //SendToPanel({ payload: `time~${new Date().toLocaleTimeString('de-DE', { hour: "2-digit", minute: "2-digit" })}`, });
        const diff = 60000 - Date.now() % 60000 + 10
        this.timeUpdateTimeout = this.adapter.setTimeout(this.timeUpdateLoop, diff);
    }
    async delete (): Promise<void> {
        await super.delete()
        if (this.timeUpdateTimeout) this.adapter.clearTimeout(this.timeUpdateTimeout)

    }
    UnsubscribeWatcher (): void {
        try {
            for (const [key, value] of Object.entries(subscriptions)) {
                unsubscribe(value);
                delete subscriptions[key];
            }
        } catch (err: any) {
            Long('error at UnsubscribeWatcher: ' + err.message, 'warn');
        }
    }
    update (): void {
        try {
            //UnsubscribeWatcher();

            const payload: sendTemplates['weatherUpdate'] = {eventType: 'weatherUpdate', value: {}}
            payload.value[this.layout] = [];
            const value = payload.value[this.layout];
            if (value === undefined) return;
            for (const place of Definition.ScreenSaverPlaces) {
                const maxItems = Definition.ScreenSaverConst[this.layout][place].maxEntries;

                for (let i = 0; i < maxItems; i++) {
                    const item: NSPanel.ScreenSaverDataItems | undefined = this.items[place][i];
                    if (item === null || item === undefined || item.entity === undefined) {
                        value.push({icon: '', iconColor: '', displayName: '', optionalValue: ''})
                        continue;
                    }
                    //RegisterEntityWatcher(leftEntity.entity);

                    let iconColor = String(Color.rgb_dec565(Color.White));
                    let icon = '';
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
                            if (v !== null) val *= v;
                        }
                        if (item.entityDecimalPlaces) {
                            const v = await item.entityDecimalPlaces.getNumber();
                            const v2 = item.entityUnitText ? await item.entityUnitText.getString() : null;
                            if (v !== null) val = val.toFixed(v) + (v2 !== null ? v2 : '')
                        }

                        iconColor = await GetScreenSaverEntityColor(item);
                    } else if (item.entity.type == 'boolean') {
                        iconColor = await GetScreenSaverEntityColor(item);
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
                        iconColor = await GetScreenSaverEntityColor(item);

                        const pformat = parseFormat(val);

                        this.log.debug(
                            'moments.js --> Datum ' + val + ' valid?: ' + moment(val, pformat, true).isValid(),
                            'info',
                        );
                        if (moment(val, pformat, true).isValid()) {
                            const DatumZeit = moment(val, pformat).unix(); // Conversion to Unix time stamp
                            const entityDateFormat = item.entityDateFormat ? await item.entityDateFormat.getString() : null;
                            val = new Date(DatumZeit * 1000).toLocaleString(
                                entityDateFormat !== null ? entityDateFormat : undefined
                            );

                        }
                    }

                    let temp: any = item.entityIconColor ? await item.entityIconColor.getRGBDec() : null;
                    iconColor = temp ? temp : iconColor;
                    temp = item.entityText ? await item.entityText.getString() : null;
                    const entityText = temp ? temp : '';
                    value.push({icon, iconColor, displayName: entityText, optionalValue: val ? String(val) : ''})
                }
            }
            if (this.layout === 'alternate') {
                // hack: insert empty entry
                const lastIndex = payload.value[this.layout]!.length-1;
                payload.value[this.layout]!.push(payload.value[this.layout]![lastIndex])
                payload.value[this.layout]![lastIndex] = {icon:'', iconColor:'', displayName:'', optionalValue:''};
            }

            this.log.debug('HandleScreensaverUpdate payload: ' + JSON.stringify(payload.value[this.layout]));
            
            this.sendStatusUpdate(payload, this.layout);

            this.HandleScreensaverStatusIcons();
        } catch (err: any) {
            this.log.debug('error at HandleScreensaverUpdate: ' + err.message, 'warn');
        }
    }

    sendStatusUpdate (payload: sendTemplates['statusUpdate'] | sendTemplates['weatherUpdate'], layout: NSPanel.ScreensaverModeType) {
        switch (payload.eventType) {
            case 'statusUpdate':
                this.sendToPanel(this.getPayload(payload.icon1, payload.icon1Color, payload.icon2, payload.icon2color, payload.icon1font, payload.icon2font, ''));
                break;
            case 'weatherUpdate': {
                let value = payload.value[layout]
                if (!value) return;
                const result: string[] = [];
                const check = weatherUpdateTestArray![layout];
                value = value.filter((item, pos) => check[pos])
                value.forEach((item, pos) => {
                    const test = check[pos];
                    if (item.icon && !test.icon) item.icon = '';
                    if (item.iconColor && !test.iconColor) item.iconColor = '';
                    if (item.displayName && (!('displayName' in test) || !test.displayName)) item.displayName = '';
                    if (item.optionalValue && !test.icon) item.icon = '';
                })
                value.forEach(a => a && result.push(this.getPayload('', '', a.icon, a.iconColor, 'displayName' in a ? a.displayName : '', a.optionalValue, '')))
                this.sendToPanel(this.getPayloadArray([...result, '']));
                break;
            }
        }
    }
    getPayloadArray (s: string[]): string {
        return s.join('~');
    }
    getPayload (...s: string[]): string {
        return s.join('~');
    }
    RegisterEntityWatcher (id: string): void {
        try {
            if (subscriptions.hasOwnProperty(id)) {
                return;
            }

            subscriptions[id] = on({id: id, change: 'any'}, () => {
                HandleScreensaverUpdate();
            });
        } catch (err: any) {
            Long('RegisterEntityWatcher: ' + err.message, 'warn');
        }
    }

    HandleScreensaverStatusIcons (): void {
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
                            if (Definition.Debug) Long('Entity ist String', 'info');
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

payloadString += '~' + Color.rgb_dec565(hwBtn1Col) + '~';
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
        }
    }
}


async function GetScreenSaverEntityColor (item: NSPanel.ScreenSaverDataItems | null): Promise<string> {
    if (item && item.entity) {
        try {
            let colorReturn: number|string;
            const entityAsNumber = item.entity ? await item.entity.getNumber() : null
            const entityFactor = item.entityFactor ? await item.entityFactor.getNumber() : null
            const entityIconColor = item.entityIconColor ? await item.entityIconColor.getRGBDec() : null
            const entityIconColorScale: NSPanel.IconScaleElement | null = item.entityIconColorScale  ? await item.entityIconColorScale.getIconScale() : null
            const entityIconOn = item.entityIconOn ? await item.entityIconOn.getRGBDec() : null
            const entityIconOff = item.entityIconOff ? await item.entityIconOff.getRGBDec() : null
            if (entityIconColor !== null && entityIconColorScale !== null) {
                if (item.entity.type == 'boolean') {
                    const iconvalbest = entityIconColorScale && entityIconColorScale.val_best !== undefined ? !!entityIconColorScale.val_best : false;   
                    if (iconvalbest == await item.entity.getBoolean()) {
                        if (entityIconOn !== null) colorReturn = entityIconOn
                        else colorReturn = Color.rgb_dec565(Color.colorScale0);
                    } else {
                        if (entityIconOff !== null) colorReturn = entityIconOff
                        else colorReturn = Color.rgb_dec565(Color.colorScale10);
                    }  
                } else if (entityIconColorScale !== null && entityAsNumber !== null) {
                    const iconvalmin: number = entityIconColorScale.val_min != undefined ? entityIconColorScale.val_min : 0;
                    const iconvalmax: number = entityIconColorScale.val_max != undefined ? entityIconColorScale.val_max : 100;
                    const iconvalbest: number = entityIconColorScale.val_best != undefined ? entityIconColorScale.val_best : iconvalmin;
                    let valueScale = entityAsNumber * (entityFactor !== null ? entityFactor : 1);

                    if (iconvalmin == 0 && iconvalmax == 1) {
                        if (await item.entity.getBoolean()) {
                            if (entityIconOn !== null) colorReturn = entityIconOn
                            else colorReturn = Color.rgb_dec565(Color.colorScale0);
                        } else {
                            if (entityIconOff !== null) colorReturn = entityIconOff
                            else colorReturn = Color.rgb_dec565(Color.colorScale10);
                        } 
                    } else {
                        if (iconvalbest == iconvalmin) {
                            valueScale = Color.scale(valueScale, iconvalmin, iconvalmax, 10, 0);
                        } else {
                            if (valueScale < iconvalbest) {
                                valueScale = Color.scale(valueScale, iconvalmin, iconvalbest, 0, 10);
                            } else if (valueScale > iconvalbest || iconvalbest != iconvalmin) {
                                valueScale = Color.scale(valueScale, iconvalbest, iconvalmax, 10, 0);
                            } else {
                                valueScale = Color.scale(valueScale, iconvalmin, iconvalmax, 10, 0);
                            }
                        }
                        //limit if valueScale is smaller/larger than 0-10
                        if (valueScale > 10) valueScale = 10;
                        if (valueScale < 0) valueScale = 0;

                        let valueScaletemp = (Math.round(valueScale)).toFixed();
                        colorReturn = Color.HandleColorScale(valueScaletemp);
                    }
                } else {
                    colorReturn = Color.rgb_dec565(Color.White);
                }
            } else {
                const entityAsBoolean = item.entity ? await item.entity.getBoolean() : null
            if (item.entity.type == 'boolean' || item.entity.type == 'number') {
                    if (entityAsBoolean) {
                        if (await item.entity.getBoolean()) {
                            if (entityIconOn !== null) colorReturn = entityIconOn
                            else colorReturn = Color.rgb_dec565(Color.White);
                        } else {
                            if (entityIconOff !== null) colorReturn = entityIconOff
                            else colorReturn = Color.rgb_dec565(Color.White);
                        } 
                    } else {
                        if (entityIconOff !== null) colorReturn = entityIconOff
                            else colorReturn = Color.rgb_dec565(Color.White);
                    }
                } else {
                    colorReturn = Color.rgb_dec565(Color.White);
                }
            }
            return String(colorReturn);
        } catch (err: any) {
            log('error at function GetScreenSaverEntityColor: ' + err.message, 'warn');
        }
    }
    return String(Color.rgb_dec565(Color.White));
}