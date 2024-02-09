import * as Definition from '../const/definition';
import * as Color from '../const/Color';
import * as NSPanel from '../types/types';

//import dayjs from 'dayjs';
import moment from 'moment';
import parseFormat from 'moment-parseformat';
import { sendTemplates, weatherUpdateTestArray } from '../types/msg-def';
import { Page, PageInterface } from '../classes/Page';
import { Icons } from '../const/icon_mapping';
import { PageTypeCards } from '../types/pages';
import { getPayload, getPayloadArray } from '../const/tools';

export type ScreensaverConfigType = {
    momentLocale: string;
    locale: string; //Intl.DateTimeFormat;
    iconBig1: boolean;
    iconBig2: boolean;
};

export type ScreensaverConfig = {
    card: Extract<PageTypeCards, 'screensaver' | 'screensaver2'>;
    mode: NSPanel.ScreensaverModeType;
    entitysConfig: NSPanel.ScreensaverOptionsType;
    rotationTime: number;
};

export class Screensaver extends Page {
    private entitysConfig: NSPanel.ScreensaverOptionsType;
    readonly layout: NSPanel.ScreensaverModeType = 'standard';
    private config: ScreensaverConfigType;
    private items: Record<
        keyof Omit<NSPanel.ScreensaverOptionsType, 'mrIconEntity'>,
        (NSPanel.ScreenSaverDataItems | undefined)[]
    > &
        Record<
            keyof Pick<NSPanel.ScreensaverOptionsType, 'mrIconEntity'>,
            (NSPanel.ScreenSaverDataItems | undefined)[]
        > = {
        favoritEntity: [],
        leftEntity: [],
        bottomEntity: [],
        alternateEntity: [],
        indicatorEntity: [],
        mrIconEntity: [],
    };
    private rotationTime: number;
    private timoutRotation: ioBroker.Timeout | undefined = undefined;
    private step: number = 0;
    constructor(config: PageInterface, options: ScreensaverConfig) {
        switch (options.mode) {
            case 'standard':
            case 'alternate': {
                config.card = 'screensaver';
                break;
            }
            case 'advanced': {
                config.card = 'screensaver2';
                break;
            }
        }
        config.alwaysOn = 'none';
        super(config, undefined);

        this.entitysConfig = options.entitysConfig;
        this.layout = options.mode;

        this.config = this.panel.config;
        moment.locale(this.config.momentLocale);
        this.rotationTime = options.rotationTime !== 0 && options.rotationTime < 3 ? 3000 : options.rotationTime * 1000;
    }
    async init(): Promise<void> {
        const config = this.entitysConfig;
        if (this.controller) {
            for (const key of Definition.ScreenSaverAllPlaces) {
                for (const entry of config[key]) {
                    if (entry == null || entry === undefined) {
                        this.items[key].push(undefined);
                        continue;
                    }
                    const tempItem = await this.controller.statesControler.createDataItems(entry, this);
                    switch (key) {
                        case 'favoritEntity':
                        case 'leftEntity':
                        case 'bottomEntity':
                        case 'indicatorEntity':
                            this.items[key].push(tempItem);
                            break;
                        case 'mrIconEntity':
                            this.items['mrIconEntity'].push(tempItem);
                            break;
                    }
                }
            }
        }
    }

    async update(): Promise<void> {
        if (!this.visibility) {
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
                if (
                    item === null ||
                    item === undefined ||
                    item.entityValue === undefined ||
                    item.entityValue.value === undefined
                ) {
                    value.push({ icon: '', iconColor: '', displayName: '', optionalValue: '' });
                    continue;
                }
                //RegisterEntityWatcher(leftEntity.entity);

                let iconColor = String(Color.rgb_dec565(Color.White));
                let icon = '';
                if (item.entityIcon && item.entityIcon.true.value) {
                    const val = await item.entityIcon.true.value.getString();
                    if (val !== null) icon = Icons.GetIcon(val);
                }
                let val: string | number | boolean | null = await item.entityValue.value.getNumber();
                // if val not null its a number

                if (item.entityValue.value.type == 'number' && val !== null) {
                    if (item.entityValue.factor) {
                        const v = await item.entityValue.factor.getNumber();
                        if (v !== null) val *= v;
                    }
                    if (item.entityValue.decimal) {
                        const v = await item.entityValue.decimal.getNumber();
                        if (v !== null) val = val.toFixed(v);
                    }
                    if (item.entityValue.unit) {
                        const v = await item.entityValue.unit.getString();
                        if (v !== null) val += v;
                    }

                    iconColor = await GetScreenSaverEntityColor(item);
                } else if (item.entityValue.value.type == 'boolean') {
                    val = await item.entityValue.value.getBoolean();
                    iconColor = await GetScreenSaverEntityColor(item);
                    if (!val && item.entityIcon.false.value) {
                        const t = await item.entityIcon.false.value.getString();
                        if (t !== null) icon = Icons.GetIcon(t);
                    }
                    const b = val ? 'true' : 'false';
                    if (item.entityText != undefined) {
                        const i = item.entityText[b];
                        if (i !== undefined) {
                            const t = await i.getString();
                            if (t !== null) val = this.library.getTranslation(t);
                        } else {
                            const i = item.entityText.true;
                            const t = i !== undefined ? await i.getString() : null;
                            if (t !== null) val = this.library.getTranslation(t);
                        }
                    }
                } else if (
                    item.entityValue.value.type == 'string' &&
                    (val = await item.entityValue.value.getString()) !== null
                ) {
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

                let temp: any = item.entityIcon.true.color ? await item.entityIcon.true.color.getRGBDec() : null;
                iconColor = temp ? temp : iconColor;
                temp = item.entityText && item.entityText.true ? await item.entityText.true.getString() : null;
                const entityText = temp ? this.library.getTranslation(temp) : '';
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

    sendStatusUpdate(
        payload: sendTemplates['statusUpdate'] | sendTemplates['weatherUpdate'],
        layout: NSPanel.ScreensaverModeType,
    ): void {
        switch (payload.eventType) {
            case 'statusUpdate':
                this.sendToPanel(
                    getPayload(
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
                            getPayload(
                                '',
                                '',
                                a.icon,
                                a.iconColor,
                                'displayName' in a ? a.displayName : '',
                                a.optionalValue,
                            ),
                        ),
                );
                this.sendToPanel(getPayloadArray([...result, '']));
                break;
            }
        }
    }
    async onVisibilityChange(v: boolean): Promise<void> {
        this.step = -1;
        if (v) {
            this.sendType();
            this.rotationLoop();
        } else {
            if (this.timoutRotation) this.adapter.clearTimeout(this.timoutRotation);
        }
    }
    rotationLoop = async (): Promise<void> => {
        if (this.unload) return;
        // only use this if screensaver is activated
        if (!this.visibility) return;
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

    onStateTrigger = async (): Promise<void> => {
        this.update();
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
            if (item.entityValue && item.entityValue.value) {
                switch (item.entityValue.value.type) {
                    case 'string': {
                        const v = await item.entityValue.value.getString();
                        if (v !== null) value = v;
                        break;
                    }
                    case 'number': {
                        value = 0;
                        const v = await item.entityValue.value.getNumber();
                        const c = item.entityValue.decimal ? await item.entityValue.decimal.getNumber() : null;
                        if (v !== null) value = v;
                        if (c !== null) value = (value || 0).toFixed(c);
                        break;
                    }
                    case 'boolean': {
                        value = false;
                        const v = item.entityValue.value ? await item.entityValue.value.getBoolean() : null;
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
            const entity =
                item.entityValue && item.entityValue.value
                    ? item.entityValue.value.type == 'string'
                        ? await item.entityValue.value.getString()
                        : await item.entityValue.value.getBoolean()
                    : null;
            const offcolor = item.entityIcon.false.color
                ? await item.entityIcon.false.color.getRGBDec()
                : String(Color.rgb_dec565(Color.White));
            const onColor = item.entityIcon.true.color ? await item.entityIcon.true.color.getRGBDec() : null;
            payload[`icon${s}Color`] = offcolor !== null ? offcolor : String(Color.rgb_dec565(Color.White));
            if (item.entityValue != null || value !== null || onColor != null) {
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
                const onIcon = item.entityIcon.true.value ? await item.entityIcon.true.value.getString() : null;
                const offIcon = item.entityIcon.false.value ? await item.entityIcon.false.value.getString() : null;
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
                    const unit =
                        item.entityValue && item.entityValue.unit ? await item.entityValue.unit.getString() : null;
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
    if (item && item.entityValue) {
        let colorReturn: number | string;
        const entityAsNumber = item.entityValue.value !== undefined ? await item.entityValue.value.getNumber() : null;
        const entityFactor = item.entityValue.factor !== undefined ? await item.entityValue.factor.getNumber() : null;
        const entityIconColorScale: NSPanel.IconScaleElement | null =
            'scale' in item.entityIcon && item.entityIcon.scale !== undefined
                ? await item.entityIcon.scale.getIconScale()
                : null;
        const entityOnColor = item.entityIcon.true.color ? await item.entityIcon.true.color.getRGBDec() : null;
        const entityOffColor = item.entityIcon.false.color ? await item.entityIcon.false.color.getRGBDec() : null;
        if (item.entityValue.value) {
            if (entityIconColorScale !== null) {
                if (item.entityValue.value.type == 'boolean') {
                    const iconvalbest =
                        entityIconColorScale && entityIconColorScale.val_best !== undefined
                            ? !!entityIconColorScale.val_best
                            : false;
                    if (iconvalbest == (await item.entityValue.value.getBoolean())) {
                        if (entityOnColor !== null) colorReturn = entityOnColor;
                        else colorReturn = Color.rgb_dec565(Color.colorScale0);
                    } else {
                        if (entityOffColor !== null) colorReturn = entityOffColor;
                        else colorReturn = Color.rgb_dec565(Color.colorScale10);
                    }
                } else if (entityIconColorScale !== null && entityAsNumber !== null) {
                    const iconvalmin: number =
                        entityIconColorScale.val_min != undefined ? entityIconColorScale.val_min : 0;
                    const iconvalmax: number =
                        entityIconColorScale.val_max != undefined ? entityIconColorScale.val_max : 100;
                    const iconvalbest: number =
                        entityIconColorScale.val_best != undefined ? entityIconColorScale.val_best : iconvalmin;
                    let valueScale = entityAsNumber * (entityFactor !== null ? entityFactor : 1);

                    if (iconvalmin == 0 && iconvalmax == 1) {
                        if (await item.entityValue.value.getBoolean()) {
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
                const entityAsBoolean =
                    item.entityValue && item.entityValue.value ? await item.entityValue.value.getBoolean() : null;
                if (item.entityValue.value.type == 'boolean' || item.entityValue.value.type == 'number') {
                    if (entityAsBoolean !== null) {
                        if (entityAsBoolean) {
                            if (entityOnColor !== null) colorReturn = entityOnColor;
                            else colorReturn = Color.rgb_dec565(Color.White);
                        } else {
                            if (entityOffColor !== null) colorReturn = entityOffColor;
                            else colorReturn = Color.rgb_dec565(Color.White);
                        }
                    } else {
                        if (entityOnColor !== null) colorReturn = entityOnColor;
                        else colorReturn = Color.rgb_dec565(Color.White);
                    }
                } else {
                    colorReturn = Color.rgb_dec565(Color.White);
                }
            }
            return String(colorReturn);
        }
    }
    return String(Color.rgb_dec565(Color.White));
}
