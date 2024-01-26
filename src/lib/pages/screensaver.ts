import { Dataitem } from '../classes/data-item';
import * as Definition from '../const/definition';
import * as Color from '../const/color';
import * as NSPanel from '../types/types';
import * as Icons from '../const/icon_mapping';

//import dayjs from 'dayjs';
import moment from 'moment';
import parseFormat from 'moment-parseformat';
import { sendTemplates, weatherUpdateTestArray } from '../types/msg-def';
import { BaseClassPanelSend, PanelSend } from '../controller/panel-message';
import { StatesDBReadOnly } from '../controller/states-controler';

export type ScreensaverConfigType = {
    momentLocale: string;
    locale: string; //Intl.DateTimeFormat;
    iconBig1: boolean;
    iconBig2: boolean;
};

export type ScreensaverConfig = {
    mode: NSPanel.ScreensaverModeType;
    entitysConfig: NSPanel.ScreensaverOptionsType;
    config: ScreensaverConfigType;
    rotationTime: number;
};

export class Screensaver extends BaseClassPanelSend {
    private entitysConfig: NSPanel.ScreensaverOptionsType;
    layout: NSPanel.ScreensaverModeType = 'standard';
    readOnlyDB: StatesDBReadOnly;
    private config: ScreensaverConfigType;
    private items: Record<
        keyof Omit<NSPanel.ScreensaverOptionsType, 'mrIconEntity'>,
        (NSPanel.ScreenSaverDataItems | undefined)[]
    > &
        Record<
            keyof Pick<NSPanel.ScreensaverOptionsType, 'mrIconEntity'>,
            (NSPanel.ScreenSaverMRDataItems | undefined)[]
        > = {
        favoritEntity: [],
        leftEntity: [],
        bottomEntity: [],
        alternateEntity: [],
        indicatorEntity: [],
        mrIconEntity: [],
    };
    readonly mode: NSPanel.ScreensaverModeType;
    private rotationTime: number;
    private currentPos: number = 0;
    private timoutRotation: ioBroker.Timeout | undefined = undefined;
    private step: number = 0;
    protected visible: boolean = false;
    constructor(adapter: any, config: ScreensaverConfig, panelSend: PanelSend, readOnlyDB: StatesDBReadOnly) {
        super(adapter, panelSend, 'screensaver');
        this.entitysConfig = config.entitysConfig;
        this.mode = config.mode;
        this.config = config.config;
        moment.locale(config.config.momentLocale);
        this.readOnlyDB = readOnlyDB;
        this.rotationTime = config.rotationTime !== 0 && config.rotationTime < 3 ? 3000 : config.rotationTime * 1000;
    }
    async init(): Promise<void> {
        const config = this.entitysConfig;

        for (const key of Definition.ScreenSaverAllPlaces) {
            for (const entry of config[key]) {
                if (entry == null || entry === undefined) {
                    this.items[key].push(undefined);
                    continue;
                }
                const tempItem: Partial<NSPanel.ScreenSaverDataItems | NSPanel.ScreenSaverMRDataItems> = {};
                for (const j1 in entry) {
                    const j = j1 as keyof typeof entry;
                    const data = entry[j];
                    let temp =
                        data !== undefined
                            ? new Dataitem(
                                  this.adapter,
                                  { ...data, name: `${this.name}.${key}.${j}` },
                                  this,
                                  this.readOnlyDB,
                              )
                            : undefined;
                    if (temp !== undefined && !(await temp.isValidAndInit())) {
                        temp = undefined;
                    }
                    tempItem[j] = temp;
                }
                switch (key) {
                    case 'favoritEntity':
                    case 'leftEntity':
                    case 'bottomEntity':
                    case 'indicatorEntity':
                        this.items[key].push(tempItem as NSPanel.ScreenSaverDataItems);
                        break;
                    case 'mrIconEntity':
                        this.items['mrIconEntity'].push(tempItem as NSPanel.ScreenSaverMRDataItems);
                        break;
                }

                //this.controller.RegisterEntityWatcher(this, item);
            }
        }
    }

    async update(): Promise<void> {
        if (!this.visible) {
            this.log.error('get update command but not visible!');
            return;
        }

        const payload: sendTemplates['weatherUpdate'] = { eventType: 'weatherUpdate', value: {} };
        payload.value[this.layout] = [];
        const value = payload.value[this.layout];
        if (value === undefined) return;
        for (const place of Definition.ScreenSaverPlaces) {
            // let bottom rotated
            let maxItems = Definition.ScreenSaverConst[this.layout][place].maxEntries;
            let i = 0;
            if (place == 'bottomEntity') {
                i = maxItems * this.step;
                maxItems = maxItems * (this.step + 1);
            }
            if (place == 'favoritEntity') {
                this.log.debug('y');
            }
            for (i; i < maxItems; i++) {
                const item: NSPanel.ScreenSaverDataItems | undefined = this.items[place][i];
                if (item === null || item === undefined || item.entity === undefined) {
                    value.push({ icon: '', iconColor: '', displayName: '', optionalValue: '' });
                    continue;
                }
                //RegisterEntityWatcher(leftEntity.entity);

                let iconColor = String(Color.rgb_dec565(Color.White));
                let icon = '';
                if (item.entityIconOn) {
                    const val = await item.entityIconOn.getString();
                    if (val !== null) icon = Icons.GetIcon(val);
                }
                let val: string | number | boolean | null = await item.entity.getNumber();
                // if val not null its a number

                if (item.entity.type == 'number' && val !== null) {
                    if (item.entityFactor) {
                        const v = await item.entityFactor.getNumber();
                        if (v !== null) val *= v;
                    }
                    if (item.entityDecimalPlaces) {
                        const v = await item.entityDecimalPlaces.getNumber();
                        if (v !== null) val = val.toFixed(v);
                    }
                    if (item.entityUnitText) {
                        const v = await item.entityUnitText.getString();
                        if (v !== null) val += v;
                    }

                    iconColor = await GetScreenSaverEntityColor(item);
                } else if (item.entity.type == 'boolean') {
                    val = await item.entity.getBoolean();
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
                } else if (item.entity.type == 'string' && (val = await item.entity.getString()) !== null) {
                    iconColor = await GetScreenSaverEntityColor(item);

                    const pformat = parseFormat(val);

                    this.log.debug(
                        'moments.js --> Datum ' + val + ' valid?: ' + moment(val, pformat, true).isValid(),
                        'info',
                    );
                    if (moment(val, pformat, true).isValid()) {
                        const DatumZeit = moment(val, pformat).unix(); // Conversion to Unix time stamp
                        const entityDateFormat = item.entityDateFormat ? await item.entityDateFormat.getObject() : null;
                        val = new Date(DatumZeit * 1000).toLocaleString(
                            this.config.locale,
                            entityDateFormat !== null ? entityDateFormat : undefined,
                        );
                    }
                }

                let temp: any = item.entityIconColor ? await item.entityIconColor.getRGBDec() : null;
                iconColor = temp ? temp : iconColor;
                temp = item.entityText ? await item.entityText.getString() : null;
                const entityText = temp ? temp : '';
                value.push({ icon, iconColor, displayName: entityText, optionalValue: val ? String(val) : '' });
            }
        }
        if (this.layout === 'alternate') {
            // hack: insert empty entry
            const lastIndex = payload.value[this.layout]!.length - 1;
            payload.value[this.layout]!.push(payload.value[this.layout]![lastIndex]);
            payload.value[this.layout]![lastIndex] = { icon: '', iconColor: '', displayName: '', optionalValue: '' };
        }

        this.log.debug('HandleScreensaverUpdate payload: ' + JSON.stringify(payload.value[this.layout]));

        this.sendStatusUpdate(payload, this.layout);

        this.HandleScreensaverStatusIcons();
    }
    sendType(): void {
        switch (this.layout) {
            case 'standard': {
                this.visible = true;
                this.sendToPanel('pageType~screensaver');
                break;
            }
            case 'alternate': {
                this.visible = true;
                this.sendToPanel('pageType~screensaver');
                break;
            }
            case 'advanced': {
                this.visible = true;
                this.sendToPanel('pageType~screensaver2');
                break;
            }
        }
    }
    sendStatusUpdate(
        payload: sendTemplates['statusUpdate'] | sendTemplates['weatherUpdate'],
        layout: NSPanel.ScreensaverModeType,
    ): void {
        switch (payload.eventType) {
            case 'statusUpdate':
                this.sendToPanel(
                    this.getPayload(
                        payload.eventType,
                        payload.icon1,
                        payload.icon1Color,
                        payload.icon2,
                        payload.icon2Color,
                        payload.icon1Font,
                        payload.icon2Font,
                        '',
                    ),
                );
                break;
            case 'weatherUpdate': {
                let value = payload.value[layout];
                if (!value) return;
                const result: string[] = [payload.eventType];
                const check = weatherUpdateTestArray![layout];
                value = value.filter((item, pos) => check[pos]);
                value.forEach((item, pos) => {
                    const test = check[pos];
                    if (item.icon && !test.icon) item.icon = '';
                    if (item.iconColor && !test.iconColor) item.iconColor = '';
                    if (item.displayName && (!('displayName' in test) || !test.displayName)) item.displayName = '';
                    if (item.optionalValue && !test.icon) item.icon = '';
                });
                value.forEach(
                    (a) =>
                        a &&
                        result.push(
                            this.getPayload(
                                '',
                                '',
                                a.icon,
                                a.iconColor,
                                'displayName' in a ? a.displayName : '',
                                a.optionalValue,
                            ),
                        ),
                );
                this.sendToPanel(this.getPayloadArray([...result, '']));
                break;
            }
        }
    }
    getVisibility = (): boolean => {
        return this.visible;
    };
    setVisibility = (v: boolean): void => {
        if (v !== this.visible) {
            this.visible = v;
            this.step = -1;
            if (this.visible) {
                this.sendType();
                this.rotationLoop();
            } else {
                if (this.timoutRotation) this.adapter.clearTimeout(this.timoutRotation);
            }
        }
    };
    rotationLoop = async (): Promise<void> => {
        if (this.unload) return;
        // only use this if screensaver is activated
        if (!this.visible) return;
        const l = this.entitysConfig.bottomEntity.length;
        const m = Definition.ScreenSaverConst[this.layout].bottomEntity.maxEntries;
        if (l <= m * ++this.step) this.step = 0;

        await this.update();

        if (l <= m || this.rotationTime === 0) return;
        this.timoutRotation = this.adapter.setTimeout(
            this.rotationLoop,
            this.rotationTime < 3000 ? 3000 : this.rotationTime,
        );
    };
    getPayloadArray(s: string[]): string {
        return s.join('~');
    }
    getPayload(...s: string[]): string {
        return s.join('~');
    }

    onStateTrigger = async (): Promise<boolean> => {
        if (!(await super.onStateTrigger())) return false;

        this.update();
        return true;
    };
    async HandleScreensaverStatusIcons(): Promise<void> {
        const payload: Partial<sendTemplates['statusUpdate']> = { eventType: 'statusUpdate' };
        const maxItems = Definition.ScreenSaverConst[this.layout]['mrIconEntity'].maxEntries;
        for (let i = 0; i < maxItems; i++) {
            const s: '1' | '2' = i == 0 ? '1' : '2';
            const item = this.items['mrIconEntity'][i];
            if (item === null || item === undefined) {
                payload[`icon${s}`] = '';
                payload[`icon${s}Color`] = '';
                payload[`icon${s}Font`] = '';
                continue;
            }

            let value: string | boolean | number | null = null;
            if (item.entityValue) {
                switch (item.entityValue.type) {
                    case 'string': {
                        const v = await item.entityValue.getString();
                        if (v !== null) value = v;
                        break;
                    }
                    case 'number': {
                        value = 0;
                        const v = await item.entityValue.getNumber();
                        const c = item.entityValueDecimalPlace ? await item.entityValueDecimalPlace.getNumber() : null;
                        if (v !== null) value = v;
                        if (c !== null) value = (value || 0).toFixed(c);
                        break;
                    }
                    case 'boolean': {
                        value = false;
                        const v = item.entityValue ? await item.entityValue.getBoolean() : null;
                        if (v !== null) value = v;
                        break;
                    }

                    case 'object':
                        const s: '1' | '2' = i == 0 ? '1' : '2';
                        payload[`icon${s}`] = '';
                        payload[`icon${s}Color`] = '';
                        payload[`icon${s}Font`] = '';
                        continue;
                }
            }
            const entity = item.entity
                ? item.entity.type == 'string'
                    ? await item.entity.getString()
                    : await item.entity.getBoolean()
                : null;
            const offcolor = item.entityOffColor
                ? await item.entityOffColor.getRGBDec()
                : String(Color.rgb_dec565(Color.White));
            const onColor = item.entityOnColor ? await item.entityOnColor.getRGBDec() : null;
            payload[`icon${s}Color`] = offcolor !== null ? offcolor : String(Color.rgb_dec565(Color.White));
            if (item.entity != null || value !== null || item.entityValue != null) {
                // Prüfung ob Entity vom Typ String ist
                if (entity != null && onColor) {
                    if (typeof entity == 'string') {
                        this.log.debug('Entity ist String');
                        switch (entity.toUpperCase()) {
                            case 'ON':
                            case 'OK':
                            case 'AN':
                            case 'YES':
                            case 'TRUE':
                            case 'ONLINE':
                                payload[`icon${s}Color`] = onColor;
                                break;
                            default:
                        }
                        if (Definition.Debug)
                            this.log.debug(
                                'Value: ' + item.entity + ' Color: ' + JSON.stringify(payload[`icon${s}Color`]),
                                'info',
                            );
                        // Alles was kein String ist in Boolean umwandeln
                    } else {
                        this.log.debug('Entity ist kein String', 'info');
                        if (entity) {
                            payload[`icon${s}Color`] = onColor;
                        }
                    }
                }
                const entityIconSelect: any | null = item.entityIconSelect
                    ? await item.entityIconSelect.getObject()
                    : null;

                // Icon ermitteln
                const onIcon = item.entityIconOn ? await item.entityIconOn.getString() : null;
                const offIcon = item.entityIconOff ? await item.entityIconOff.getString() : null;
                const selectIcon =
                    typeof entity !== 'boolean' && entity !== null && entityIconSelect
                        ? (entityIconSelect[entity] as string | undefined)
                        : undefined;

                if (selectIcon) {
                    payload[`icon${s}`] = Icons.GetIcon(selectIcon);
                    this.log.debug('SelectIcon: ' + JSON.stringify(payload), 'info');
                } else if (entity && onIcon) {
                    payload[`icon${s}`] = Icons.GetIcon(onIcon);
                    this.log.debug('Icon if true ' + JSON.stringify(payload), 'info');
                } else {
                    if (offIcon) {
                        payload[`icon${s}`] = Icons.GetIcon(offIcon);
                        this.log.debug('Icon1 else true ' + JSON.stringify(payload), 'info');
                    } else if (onIcon) {
                        payload[`icon${s}`] = Icons.GetIcon(onIcon);
                        this.log.debug('Icon1 else false ' + JSON.stringify(payload), 'info');
                    }
                }

                if (value !== null && value !== undefined) {
                    payload[`icon${s}`] += String(value);
                    const unit = item.entityValueUnit ? await item.entityValueUnit.getString() : null;
                    if (unit !== null) payload[`icon${s}`] += unit;
                }
            } else {
                payload[`icon${s}Color`] = String(Color.rgb_dec565(Color.Black));
            }
            payload[`icon${s}Font`] = this.config[`iconBig${s}`] ? '1' : '';
        }
        this.sendStatusUpdate(payload as sendTemplates['statusUpdate'], this.layout);
    }
    async delete(): Promise<void> {
        await super.delete();
        if (this.timoutRotation) this.adapter.clearTimeout(this.timoutRotation);
    }
}

async function GetScreenSaverEntityColor(item: NSPanel.ScreenSaverDataItems | null): Promise<string> {
    if (item && item.entity) {
        let colorReturn: number | string;
        const entityAsNumber = item.entity ? await item.entity.getNumber() : null;
        const entityFactor = item.entityFactor ? await item.entityFactor.getNumber() : null;
        const entityIconColor = item.entityIconColor ? await item.entityIconColor.getRGBDec() : null;
        const entityIconColorScale: NSPanel.IconScaleElement | null = item.entityIconColorScale
            ? await item.entityIconColorScale.getIconScale()
            : null;
        const entityOnColor = item.entityOnColor ? await item.entityOnColor.getRGBDec() : null;
        const entityOffColor = item.entityOffColor ? await item.entityOffColor.getRGBDec() : null;
        if (entityIconColor !== null && entityIconColorScale !== null) {
            if (item.entity.type == 'boolean') {
                const iconvalbest =
                    entityIconColorScale && entityIconColorScale.val_best !== undefined
                        ? !!entityIconColorScale.val_best
                        : false;
                if (iconvalbest == (await item.entity.getBoolean())) {
                    if (entityOnColor !== null) colorReturn = entityOnColor;
                    else colorReturn = Color.rgb_dec565(Color.colorScale0);
                } else {
                    if (entityOffColor !== null) colorReturn = entityOffColor;
                    else colorReturn = Color.rgb_dec565(Color.colorScale10);
                }
            } else if (entityIconColorScale !== null && entityAsNumber !== null) {
                const iconvalmin: number = entityIconColorScale.val_min != undefined ? entityIconColorScale.val_min : 0;
                const iconvalmax: number =
                    entityIconColorScale.val_max != undefined ? entityIconColorScale.val_max : 100;
                const iconvalbest: number =
                    entityIconColorScale.val_best != undefined ? entityIconColorScale.val_best : iconvalmin;
                let valueScale = entityAsNumber * (entityFactor !== null ? entityFactor : 1);

                if (iconvalmin == 0 && iconvalmax == 1) {
                    if (await item.entity.getBoolean()) {
                        if (entityOnColor !== null) colorReturn = entityOnColor;
                        else colorReturn = Color.rgb_dec565(Color.colorScale0);
                    } else {
                        if (entityOffColor !== null) colorReturn = entityOffColor;
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

                    const valueScaletemp = Math.round(valueScale).toFixed();
                    colorReturn = Color.HandleColorScale(valueScaletemp);
                }
            } else {
                colorReturn = Color.rgb_dec565(Color.White);
            }
        } else {
            const entityAsBoolean = item.entity ? await item.entity.getBoolean() : null;
            if (item.entity.type == 'boolean' || item.entity.type == 'number') {
                if (entityAsBoolean !== null) {
                    if (entityAsBoolean) {
                        if (entityOnColor !== null) colorReturn = entityOnColor;
                        else colorReturn = Color.rgb_dec565(Color.White);
                    } else {
                        if (entityOffColor !== null) colorReturn = entityOffColor;
                        else colorReturn = Color.rgb_dec565(Color.White);
                    }
                } else {
                    if (entityOffColor !== null) colorReturn = entityOffColor;
                    else colorReturn = Color.rgb_dec565(Color.White);
                }
            } else {
                colorReturn = Color.rgb_dec565(Color.White);
            }
        }
        return String(colorReturn);
    }
    return String(Color.rgb_dec565(Color.White));
}
