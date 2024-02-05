import * as Color from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { PageItemInterface } from '../classes/Page';
import {
    PageItemDataItems,
    MessageItem,
    entityUpdateDetailMessage,
    PageTypeUnionTemplate,
    PageItemDataItemsOptions,
} from '../types/type-pageItem';
import * as tools from '../const/tools';
import { PopupType } from '../types/types';
import { templatePageElements, templatePageItems } from '../templates/TpageItem';
import { BaseClassTriggerd } from '../controller/states-controller';
import { Panel } from '../controller/panel';

//light, shutter, delete, text, button, switch, number,input_sel, timer und fan types
export class PageItem extends BaseClassTriggerd {
    defaultOnColor = Color.White;
    defaultOffColor = Color.Blue;
    config: PageItemDataItemsOptions | undefined;
    dataItems: PageItemDataItems['data'] | undefined;
    panel: Panel;
    id: string;
    constructor(config: Omit<PageItemInterface, 'pageItemsConfig'>, options: PageItemDataItemsOptions | undefined) {
        super({ ...config });
        this.panel = config.panel;
        this.id = config.id;
        this.config = options;
    }

    async init(): Promise<void> {
        if (!this.config) return;
        const config = { ...this.config };
        // search states for mode auto
        const tempConfig: Partial<PageItemDataItemsOptions['data']> =
            this.config.initMode === 'auto' && this.config.dpInit
                ? await this.panel.statesControler.getDataItemsFromAuto(this.config.dpInit, config.data)
                : config.data;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: PageItemDataItems['data'] = (await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        )) as PageItemDataItems['data'];
        this.dataItems = tempItem;
    }

    async getPageItemPayload(): Promise<string> {
        if (this.dataItems && this.config) {
            const item = this.dataItems;
            const message: Partial<MessageItem> = {};
            const template = templatePageElements[this.config.type];
            message.displayName = (item.headline && (await item.headline.getString())) ?? '';
            message.intNameEntity = this.id;
            switch (this.config.type) {
                case 'light': {
                    message.type = 'light';
                    const t =
                        'item.role' in template &&
                        (template[this.config.role as keyof typeof template] as PageTypeUnionTemplate | undefined);
                    if (!t) break;
                    const dimmer = t.data.dimmer ? item.dimmer && (await item.dimmer.getNumber()) : null;
                    const rgb = t.data.RGB3
                        ? (await tools.getDecfromRGBThree(item)) ??
                          (await tools.getEntryColor(item.color, true, Color.White))
                        : null;
                    const hue = t.data.hue && item.hue ? Color.hsvtodec(await item.hue.getNumber(), 1, 1) : null;
                    let v = (!!t.data.entity1 && (await tools.getValueEntryBoolean(item.entity1))) ?? true;
                    if (t.data.entity1 === 'invert') v = !v;
                    message.icon = t.data.icon
                        ? await tools.getIconEntryValue(item.icon, v, t.data.icon.true.value, t.data.icon.false.value)
                        : '';
                    if (v) {
                        message.optionalValue = '1';
                        message.iconColor = hue ?? rgb ?? (await tools.GetIconColor(item.icon, dimmer ?? 100));
                    } else {
                        message.optionalValue = '0';
                        message.iconColor = await tools.GetIconColor(item.icon, false);
                    }
                    message.displayName = t.data.text1
                        ? (await tools.getEntryTextOnOff(item.text, v)) ?? v
                            ? t.data.text1.true
                            : t.data.text1.false
                        : message.displayName;
                    return tools.getItemMesssage(message);
                    break;
                }
                case 'shutter': {
                    message.type = 'shutter';
                    const t =
                        'item.role' in template &&
                        (template[this.config.role as keyof typeof template] as PageTypeUnionTemplate | undefined);
                    if (!t) break;
                    let value = await tools.getValueEntryNumber(item.entity1);
                    if (value === null) {
                        this.log.warn(`Entity ${this.config.role} has no value!`);
                        break;
                    }
                    if (t.data.entity1 === 'invert') value = 100 - value;
                    message.icon = await tools.getIconEntryValue(item.icon, value < 5, 'window-open');
                    message.icon = t.data.icon
                        ? await tools.getIconEntryValue(
                              item.icon,
                              value < 5,
                              t.data.icon.true.value,
                              t.data.icon.false.value,
                          )
                        : '';
                    const optionalValue =
                        t.data.optionalData === true
                            ? [
                                  Icons.GetIcon('arrow-up'), //up
                                  Icons.GetIcon('stop'), //stop
                                  Icons.GetIcon('arrow-down'), //down
                                  'enable', // up status
                                  'enable', // stop status
                                  'enable', // down status
                              ]
                            : t.data.optionalData === undefined
                              ? ['', '', '', 'disable', 'disable', 'disable']
                              : t.data.optionalData === 'state' && item.valueList
                                ? await item.valueList.getObject()
                                : [
                                      Icons.GetIcon(t.data.optionalData[0]),
                                      Icons.GetIcon(t.data.optionalData[1]),
                                      Icons.GetIcon(t.data.optionalData[2]),
                                      t.data.optionalData[3],
                                      t.data.optionalData[4],
                                      t.data.optionalData[5],
                                  ];
                    const optionalValueC =
                        Array.isArray(optionalValue) && optionalValue.every((a) => typeof a === 'string')
                            ? optionalValue
                            : ['', '', '', 'disable', 'disable', 'disable'];
                    message.optionalValue = optionalValueC.join('|');
                    message.displayName =
                        (t.data.text && ((await tools.getEntryTextOnOff(item.text, true)) || t.data.text.true)) ??
                        message.displayName;
                    return tools.getItemMesssage(message);
                    break;
                }
                case 'text': {
                    message.type = 'text';
                    const t =
                        this.config.role in template &&
                        (template[this.config.role as keyof typeof template] as PageTypeUnionTemplate | undefined);
                    if (!t) break;
                    let value = t.data.entity1 ? await tools.getValueEntryBoolean(item.entity1) : null;
                    if (value !== null) {
                        // gate works revese true is closed -> invert value
                        if (t.data.entity1 === 'invert') value = !value;
                        let icon = '';
                        message.iconColor = await tools.GetIconColor(item.icon, value ?? true ? true : false);

                        icon = t.data.icon
                            ? await tools.getIconEntryValue(
                                  item.icon,
                                  value,
                                  t.data.icon.true.value,
                                  t.data.icon.false.value,
                              )
                            : '';
                        if (t.data.optionalData) {
                            if (typeof t.data.optionalData === 'string') {
                                const arr = t.data.optionalData.split('?');
                                if (arr.length > 0) {
                                    message.optionalValue = !value && arr.length > 1 ? arr[1] : arr[0];
                                }
                            } else
                                message.optionalValue = this.library.getTranslation(
                                    (await tools.getEntryTextOnOff(item.text, value)) ?? '',
                                );
                        }
                        message.displayName =
                            (t.data.text && (await tools.getEntryTextOnOff(item.text, value))) ?? message.displayName;
                        message.icon = Icons.GetIcon(icon);
                        return tools.getItemMesssage(message);
                    } else {
                        this.log.error(`Missing data value for ${this.name}-${this.id} role:${this.config.role}`);
                    }
                    this.log.debug(JSON.stringify(message));
                    break;
                }
                case 'number': {
                    break;
                }
                case 'button': {
                    /**
                     * Alles was einen Druckfläche sein kann. D
                     */

                    if (item.entity1 && item.entity1.value) {
                        let value;
                        if (item.entity1.value.type === 'string') {
                        } else if (item.entity1.value.type === 'number') {
                        } else if (item.entity1.value.type === 'boolean') {
                            value = await tools.getValueEntryBoolean(item.entity1);
                        }
                        if (value === undefined) break;

                        message.displayName = (await tools.getEntryTextOnOff(item.text, value)) ?? 'test1';
                        message.optionalValue = (await tools.getEntryTextOnOff(item.text1, value)) ?? 'test2';
                        message.icon = await tools.getIconEntryValue(item.icon, value, 'home', 'account');
                        message.iconColor = await tools.GetIconColor(
                            item.icon,
                            typeof value === 'number' ? value : !!value,
                        );
                        return tools.getPayload(
                            'button',
                            message.intNameEntity,
                            message.icon,
                            message.iconColor,
                            message.displayName,
                            message.optionalValue,
                        );
                    }
                    break;
                }

                case 'input_sel': {
                    message.type = 'input_sel';
                    const value =
                        (await tools.getValueEntryNumber(item.entity1)) ??
                        (await tools.getValueEntryBoolean(item.entity1));
                    message.icon = await tools.getIconEntryValue(item.icon, !!(value ?? true), 'gesture-tap-button');

                    message.iconColor =
                        (await tools.GetIconColor(
                            item.icon,
                            value ?? true,
                            Color.HMIOn,
                            Color.HMIOff,
                            true,
                            true,
                            0,
                            100,
                        )) ?? Color.HMIOn;

                    message.optionalValue = (await tools.getEntryTextOnOff(item.text, !!value)) ?? 'PRESS';
                    this.log.debug(JSON.stringify(message));
                    return tools.getItemMesssage(message);

                    break;
                }
                case 'switch':
                case 'delete':
                /*case 'volumeGroup': {
                break;
            }
            case 'volume': {
                break;
            }
            case 'info':
            case 'humidity':
            case 'temperature':
            case 'value.temperature':
            case 'value.humidity':
            case 'sensor.door':
            case 'sensor.window':
            case 'thermostat': {
                break;
            }
            case 'warning': {
                break;
            }
            case 'ct': {
                break;
            }
            case 'cie': {
                break;
            }
            case 'motion': {
                message.type = 'text';
                const value = await tools.getValueEntryBoolean(item.data.entity1);
                if (value !== null) {
                    message.iconColor = await tools.GetIconColor(item.data.icon, value ?? true ? true : false);
                    message.icon = await tools.getIconEntryValue(item.data.icon, value, 'motion-sensor');
                    message.optionalValue = tools.getTranslation(this.library, value ? 'on' : 'off');
                    message.displayName = (await tools.getEntryTextOnOff(item.data.text, value)) ?? message.displayName;
                    return this.getItemMesssage(message);
                } else {
                    this.log.error(`Missing data value for ${this.name}-${id} role:${item.role}`);
                }
                break;
            }

            case 'button': {
                let value = (item.data.setValue1 && (await item.data.setValue1.getBoolean())) ?? null;
                if (value === null && item.role === 'buttonSensor') value = true;
                if (value !== null) {
                    message.type = item.role === 'buttonSensor' ? 'input_sel' : 'button';
                    message.iconColor = await tools.GetIconColor(item.data.icon, value);
                    message.icon = await tools.getIconEntryValue(item.data.icon, value, 'gesture-tap-button');
                    message.displayName = (await tools.getEntryTextOnOff(item.data.text, value)) ?? '';
                    message.optionalValue = (await tools.getValueEntryString(item.data.entity1)) ?? 'PRESS';
                    return this.getItemMesssage(message);
                } else {
                    this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
                }
                break;
            }
            case 'timer': {
                const value = (item.data.setValue1 && (await item.data.setValue1.getNumber())) ?? null;
                if (value !== null) {
                    message.type = 'timer';
                    message.iconColor = await tools.GetIconColor(item.data.icon, value);
                    message.icon = await tools.getIconEntryValue(item.data.icon, true, 'gesture-tap-button');
                    message.optionalValue = (await tools.getEntryTextOnOff(item.data.text, true)) ?? 'PRESS';
                    return this.getItemMesssage(message);
                } else {
                    this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
                }
                break;
            }
            case 'value.alarmtime': {
                const value = (item.data.setValue1 && (await item.data.setValue1.getNumber())) ?? null;
                if (value !== null) {
                    message.type = 'timer';

                    // das ist im Grunde wie vorher nur das die Farbe in aus der Konfiguration benutzt wird, wenn vorhanden
                    message.iconColor =
                        ((await tools.getValueEntryString(item.data.entity2)) ?? '') == 'paused'
                            ? await tools.getIconEntryColor(
                                  item.data.icon,
                                  true,
                                  String(Color.rgb_dec565(Color.colorScale10)),
                              )
                            : await tools.getIconEntryColor(
                                  item.data.icon,
                                  false,
                                  String(Color.rgb_dec565(Color.colorScale0)),
                              );
                    message.displayName = new Date(
                        ((await tools.getValueEntryNumber(item.data.entity1)) || 0) * 1000,
                    ).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    message.icon = await tools.getIconEntryValue(item.data.icon, true, 'timer-outline');
                    message.optionalValue = (await tools.getEntryTextOnOff(item.data.text, true)) ?? 'PRESS';
                    return this.getItemMesssage(message);
                } else {
                    this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
                }
                break;
            }

            case 'level.mode.fan': {
                message.type = 'fan';
                const value = (await tools.getValueEntryBoolean(item.data.entity1)) ?? false;
                message.iconColor = await tools.GetIconColor(item.data.icon, value);
                message.icon = await tools.getIconEntryValue(item.data.icon, value, 'fan');
                message.optionalValue = value ? '1' : '0';
                return this.getItemMesssage(message);
                break;
            }
            case 'media.repeat': {
                message.type = 'button';
                const value: number | boolean | null =
                    item.data.entity1 && item.data.entity1.value && item.data.entity1.value.type === 'number'
                        ? await tools.getValueEntryNumber(item.data.entity1)
                        : await tools.getValueEntryBoolean(item.data.entity1);
                if (value !== null) {
                    message.iconColor = await tools.GetIconColor(item.data.icon, !!value);
                    if (value === 2) {
                        message.icon = 'repeat-once';
                    } else {
                        message.icon = await tools.getIconEntryValue(
                            item.data.icon,
                            !!value,
                            'repeat-variant',
                            'repeat-off',
                        );

                        message.optionalValue = !!value ? '1' : '0';
                        return this.getItemMesssage(message);
                    }
                }
                break;
            }
            case 'text.list': {
                message.type = 'input_sel';
                const value: boolean | null =
                    (item.data.entity1 &&
                        item.data.entity1.value &&
                        (await tools.getValueEntryBoolean(item.data.entity1))) ??
                    null;
                message.iconColor = await tools.getIconEntryColor(item.data.icon, value, Color.HMIOn, Color.HMIOff);
                message.icon = await tools.getIconEntryValue(
                    item.data.icon,
                    value,
                    'clipboard-list',
                    'clipboard-list-outline',
                );
                message.displayName = (await tools.getEntryTextOnOff(item.data.text, value)) ?? '';
                message.optionalValue = !!value ? '1' : '0';
                return this.getItemMesssage(message);

                break;
            }
            /*case 'lock': {
                break;
            }
            case 'slider': {
                break;
            }
            case 'switch.mode.wlan': {
                break;
            }
            case 'media': {
                break;
            }
            case 'timeTable': {
                break;
            }
            case 'airCondition': {
                break;
            }*/
            }
        }
        return '~~~~~';
    }

    getDetailPayload(message: Partial<entityUpdateDetailMessage>): string {
        if (!message.type) return '';
        switch (message.type) {
            case '2Sliders': {
                let result: entityUpdateDetailMessage = {
                    type: '2Sliders',
                    icon: undefined,
                    entityName: 'test',
                    slidersColor: 'disable',
                    buttonState: 'disable',
                    slider1Pos: 'disable',
                    slider2Pos: 'disable',
                    hueMode: false,
                    hue_translation: '',
                    slider2Translation: '',
                    slider1Translation: '',
                    popup: false,
                };
                result = Object.assign(result, message);
                return tools.getPayload(
                    'entityUpdateDetail',
                    result.entityName,
                    '',
                    result.slidersColor,
                    result.buttonState === 'disable' ? 'disable' : result.buttonState ? '1' : '0',
                    String(result.slider1Pos),
                    String(result.slider2Pos),
                    result.hueMode ? 'enable' : 'disable',
                    result.hue_translation,
                    result.slider2Translation,
                    result.slider1Translation,
                    result.popup ? 'enable' : 'disable',
                );
                break;
            }
            case 'insel': {
                let result: entityUpdateDetailMessage = {
                    type: 'insel',
                    entityName: '',
                    textColor: String(Color.rgb_dec565(Color.White)),
                    headline: '',
                    list: '',
                };
                result = Object.assign(result, message);
                return tools.getPayload(
                    'entityUpdateDetail2',
                    result.entityName,
                    '',
                    result.textColor,
                    result.type,
                    result.headline,
                    result.list,
                );
                break;
            }
        }
        return '';
    }
    async GenerateDetailPage(mode: PopupType): Promise<string | null> {
        if (!this.config || !this.dataItems) return null;
        const item = this.dataItems;
        const message: Partial<entityUpdateDetailMessage> = {};
        const template = templatePageItems[mode][this.config.role];
        message.entityName = this.id;

        switch (mode) {
            case 'popupLight': {
                switch (this.config.role) {
                    case 'light':
                    case 'socket':
                    case 'dimmer':
                    case 'hue':
                    case 'ct':
                    case 'rgbSingle':
                    case 'rgb': {
                        message.type = '2Sliders';
                        if (message.type !== '2Sliders') return null;
                        if (template.type !== message.type) return null;
                        message.buttonState =
                            (template.buttonState ? await tools.getValueEntryBoolean(item.entity1) : null) ?? 'disable';
                        const dimmer = item.dimmer && (await item.dimmer.getNumber());
                        if (dimmer != null && template.slider1Pos) {
                            if (item.minValue1 != undefined && item.maxValue1) {
                                message.slider1Pos = Math.trunc(
                                    Color.scale(
                                        dimmer,
                                        await item.minValue1.getNumber(),
                                        await item.maxValue1.getNumber(),
                                        100,
                                        0,
                                    ),
                                );
                            } else {
                                message.slider1Pos = dimmer;
                            }
                        }

                        message.slidersColor = template.slidersColor
                            ? String(Color.rgb_dec565(template.slidersColor))
                            : (await tools.getIconEntryColor(item.icon, false, Color.White)) ?? 'disable';
                        let rgb;
                        switch (this.config.role) {
                            case 'socket':
                            case 'light':
                            case 'dimmer':
                            case 'ct':
                                break;
                            case 'hue':
                                rgb = rgb ?? (await tools.getDecfromHue(item)) ?? null;
                                break;
                            case 'rgbSingle':
                            case 'rgb':
                                //rgb = await tools.getDecfromRGBThree(item);
                                break;
                        }
                        if (rgb !== null && template.hueMode) {
                            message.hueMode = true;
                            message.slidersColor = rgb;
                        }

                        message.slider2Pos = 'disable';

                        let ct = template.slider2Pos ? await tools.getValueEntryNumber(item.entity2) : null;
                        if (ct != null && template.slider2Pos !== false) {
                            const max = (item.maxValue2 && (await item.maxValue2.getNumber())) ?? template.slider2Pos;
                            ct = ct > max ? max : ct < 0 ? 0 : ct;
                            if (item.minValue2 !== undefined) {
                                const min = (await item.minValue2.getNumber()) ?? 0;
                                message.slider2Pos = Math.trunc(Color.scale(ct < min ? min : ct, min, max, 100, 0));
                            } else {
                                message.slider2Pos = Math.trunc(Color.scale(ct, 0, max, 100, 0));
                            }
                        }

                        if ((template.popup && item.valueList && (await item.valueList.getString())) ?? null !== null) {
                            message.popup = true;
                        }
                        message.slider1Translation =
                            template.slider1Translation !== false
                                ? (item.valueList && (await item.valueList.getString())) ?? template.slider1Translation
                                : '';
                        message.slider2Translation =
                            template.slider2Translation !== false
                                ? (item.valueList && (await item.valueList.getString())) ?? template.slider2Translation
                                : '';
                        message.hue_translation =
                            template.hue_translation !== false
                                ? (item.valueList && (await item.valueList.getString())) ?? template.hue_translation
                                : '';

                        break;
                    }
                }
                break;
            }
            case 'popupFan':
            case 'popupInSel': {
                message.type = 'insel';

                if (message.type !== 'insel') return null;

                const value = (await tools.getValueEntryBoolean(item.entity1)) ?? true;

                message.textColor = await tools.getEntryColor(item.color, value, Color.White);
                message.headline = this.library.getTranslation(
                    (item.headline && (await item.headline.getString())) ?? '',
                );
                let list = (item.valueList && (await item.valueList.getObject())) ??
                    (item.valueList && (await item.valueList.getString())) ?? [
                        '1',
                        '2',
                        '3',
                        '4',
                        '5',
                        '6',
                        '7',
                        '8',
                        '9',
                        '10',
                        '11',
                        '12',
                        '13',
                    ];
                if (list !== null) {
                    if (typeof list === 'string') list = list.split('?');
                } else list = [];
                message.list = Array.isArray(list) ? list.map((a: string[]) => tools.formatInSelText(a)).join('?') : '';

                break;
            }
            case 'popupFan':
            case 'popupInSel': {
                switch (item.role) {
                    case 'socket':
                    case 'value.time':
                    case 'level.timer':
                    case 'level.mode.fan':
                    case 'value.alarmtime':
                    case 'light':
                    case 'dimmer':
                    case 'hue':
                    case 'ct':
                    case 'cie':
                    case 'rgbSingle':
                    case 'rgb':
                    case 'blind':
                    case 'door':
                    case 'window':
                    case 'gate':
                    case 'motion':
                    case 'media.repeat':

                    case 'buttonSensor':
                    case 'button':
                        break;
                    case 'text.list': {
                        message.type = 'insel';

                        if (message.type !== 'insel' || template.type !== 'insel') return null;

                        const value = template.value
                            ? (await getValueEntryBoolean(item.data.entity1)) ?? template.value
                            : template.value;
                        message.textColor = await getEntryColor(item.data.color, value, template.textColor);
                        message.headline = this.library.getTranslation(
                            (item.data.headline && (await item.data.headline.getString())) ?? '',
                        );
                        let list = template.list
                            ? (item.data.modeList && (await item.data.modeList.getObject)) ?? template.list
                            : [];
                        if (!Array.isArray(list)) list = [];
                        message.list = list.map((a) => formatInSelText(a)).join('?');

                        break;
                    }
                }
                break;
            }
            case 'popupLightNew':
            case 'popupNotify':
            case 'popupShutter':
            case 'popupThermo':
            case 'popupTimer':
        }

        if (template.type !== message.type) {
            throw new Error(`Template ${template.type} is not ${message.type} for role: ${this.config.role}`);
        }
        return this.getDetailPayload(message);

        return null;
    }

    async delete(): Promise<void> {
        super.delete();
    }

    async setPopupAction(action: string, value: string): Promise<void> {
        if (value === undefined || this.dataItems === undefined) return;
        if (action === 'mode-insel') {
            if (!this.dataItems.setList) return;
            let list: any = (await this.dataItems.setList.getObject()) as { id: string; value: any } | null;
            if (list === null) {
                list = await this.dataItems.setList.getString();
                list = list.split('|').map((a: string) => {
                    const t = a.split('?');
                    return { id: t[0], value: t[1] };
                });
            }
            if (list[value]) {
                try {
                    const obj = await this.adapter.getForeignObjectAsync(list[value].id);
                    if (!obj || !obj.common || obj.type !== 'state') throw new Error('Dont get obj!');
                    const type = obj.common.type;
                    const newValue = this.adapter.library.convertToType(list[value].value, type);
                    if (newValue !== null) {
                        await this.adapter.setForeignStateAsync(
                            list[value].id,
                            newValue,
                            list[value].id.startsWith(this.adapter.namespace),
                        );
                        this.log.debug(`------------Set dp ${list[value].id} to ${String(newValue)}!`);
                    } else {
                        this.log.error(`Try to set a null value to ${list[value].id}!`);
                    }
                } catch (e) {
                    this.log.error(`Id ${list[value].id} is not valid!`);
                }
            } else {
            }
        } else if (action === 'button') {
            const value = (this.dataItems.setNavi && (await this.dataItems.setNavi.getString())) ?? null;
            if (value !== null) {
                this.panel.navigation.setTargetPageByName(value);
            }
        }
    }
}
