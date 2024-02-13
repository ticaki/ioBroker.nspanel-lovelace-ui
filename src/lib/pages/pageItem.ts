import * as Color from '../const/Color';
import { PageItemInterface } from '../classes/Page';
import {
    PageItemDataItems,
    MessageItem,
    entityUpdateDetailMessage,
    PageItemDataItemsOptions,
    listCommand,
    islistCommandUnion,
} from '../types/type-pageItem';
import * as tools from '../const/tools';
import { PopupType } from '../types/types';
import { Panel } from '../controller/panel';
import { BaseClassTriggerd } from '../controller/states-controller';
import { RGB } from '../types/Color';

//light, shutter, delete, text, button, switch, number,input_sel, timer und fan types
export class PageItem extends BaseClassTriggerd {
    defaultOnColor = Color.White;
    defaultOffColor = Color.Blue;
    config: PageItemDataItemsOptions | undefined;
    dataItems: PageItemDataItems | undefined;
    panel: Panel;
    id: string;
    lastPopupType: PopupType | undefined = undefined;
    constructor(config: Omit<PageItemInterface, 'pageItemsConfig'>, options: PageItemDataItemsOptions | undefined) {
        super({ ...config });
        this.panel = config.panel;
        this.id = config.id;
        this.config = options;
        this.parent = options && config.parent;
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
        this.dataItems = { ...config, data: tempItem } as PageItemDataItems;
    }

    async getPageItemPayload(): Promise<string> {
        await this.controller.statesControler.activateTrigger(this);
        this.lastPopupType = undefined;
        if (this.dataItems && this.config) {
            this.visibility = false;
            this.triggerParent = true;
            const entry = this.dataItems;
            const message: Partial<MessageItem> = {};
            message.intNameEntity = this.id;
            switch (entry.type) {
                case 'light': {
                    const item = entry.data;
                    message.type = 'light';

                    const v = await tools.getValueEntryBoolean(item.entity1);
                    const dimmer = (item.dimmer && item.dimmer.value && (await item.dimmer.value.getNumber())) ?? null;
                    let rgb: RGB | null =
                        (await tools.getRGBfromRGBThree(item)) ??
                        (item.color && item.color.true && (await item.color.true.getRGBValue())) ??
                        null;
                    const nhue = (item.hue && (await item.hue.getNumber())) ?? null;
                    if (rgb === null && nhue) rgb = Color.hsv2RGB(nhue, 1, 1) ?? null;
                    message.icon = await tools.getIconEntryValue(item.icon, v, '', '');
                    message.iconColor =
                        (rgb && (await tools.GetIconColor(rgb, dimmer !== null ? (dimmer > 20 ? dimmer : 20) : v))) ??
                        (await tools.GetIconColor(item.icon, dimmer !== null ? (dimmer > 20 ? dimmer : 20) : v)) ??
                        '';
                    if (v) {
                        message.optionalValue = '1';
                    } else {
                        message.optionalValue = '0';
                    }
                    message.displayName = (await tools.getEntryTextOnOff(item.text1, v)) ?? message.displayName;
                    return tools.getItemMesssage(message);
                    break;
                }
                /*case 'shutter': {
                    const item = entry.data;

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
                    const item = entry.data;
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
                    const item = entry.data;
                    break;
                }*/
                case 'button': {
                    /**
                     * Alles was einen Druckfläche sein kann. D
                     */
                    const item = entry.data;

                    if (item.entity1 && item.entity1.value) {
                        /*let value;
                        if (item.entity1.value.type === 'string') {
                        } else if (item.entity1.value.type === 'number') {
                        } else if (item.entity1.value.type === 'boolean') {
                            value = await tools.getValueEntryBoolean(item.entity1);
                        }
                        if (value === undefined) break;
*/
                        message.optionalValue = !!(item.setValue1 && (await item.setValue1.getBoolean())) ? '0' : '1';
                        message.displayName =
                            (await tools.getEntryTextOnOff(item.text, message.optionalValue === '1')) ?? 'test1';

                        message.icon = await tools.getIconEntryValue(
                            item.icon,
                            message.optionalValue === '1',
                            'home',
                            'account',
                        );
                        message.iconColor = await tools.GetIconColor(item.icon, message.optionalValue === '1');
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
                    const item = entry.data;
                    message.type = 'input_sel';
                    const value =
                        (await tools.getValueEntryNumber(item.entityInSel)) ??
                        (await tools.getValueEntryBoolean(item.entityInSel));
                    message.icon = await tools.getIconEntryValue(item.icon, !!(value ?? true), 'gesture-tap-button');

                    message.iconColor =
                        (await tools.GetIconColor(item.icon, value ?? true, 0, 100, Color.HMIOff)) ?? Color.HMIOn;

                    message.optionalValue = (await tools.getEntryTextOnOff(item.text, !!value)) ?? 'PRESS';
                    this.log.debug(JSON.stringify(message));
                    return tools.getItemMesssage(message);

                    break;
                }
                //case 'switch':
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
        this.triggerParent = false;
        if (!message.type) return '';
        switch (message.type) {
            case '2Sliders': {
                let result: entityUpdateDetailMessage = {
                    type: '2Sliders',
                    icon: '',
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
                    result.icon ?? '',
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
            case 'popupThermo': {
                let result: entityUpdateDetailMessage = {
                    type: 'popupThermo',
                    entityName: '',
                    headline: '',
                    value: '',
                    list: '',
                };
                result = Object.assign(result, message);
                return tools.getPayload(result.headline, result.entityName, result.value, result.list);
                break;
            }
        }
        return '';
    }

    async GenerateDetailPage(mode: PopupType): Promise<string | null> {
        if (!this.config || !this.dataItems) return null;
        const entry = this.dataItems;
        const message: Partial<entityUpdateDetailMessage> = {};
        //const template = templatePageItems[mode][this.config.role];
        message.entityName = this.id;
        this.visibility = true;
        this.lastPopupType = mode;
        switch (mode) {
            case 'popupLight': {
                switch (this.config.role) {
                    case 'light':
                    case 'socket':
                    case 'dimmer':
                    case 'hue':
                    case 'ct':
                    case 'rgbSingle':
                    case 'rgb':
                    default: {
                        message.type = '2Sliders';
                        if (message.type !== '2Sliders' || entry.type !== 'light') return null;
                        const item = entry.data;
                        message.buttonState = (await tools.getValueEntryBoolean(item.entity1)) ?? 'disable';
                        const dimmer = item.dimmer && item.dimmer.value && (await item.dimmer.value.getNumber());
                        if (dimmer != null && item.dimmer) {
                            item.dimmer.minScale;
                            if (item.dimmer.minScale != undefined && item.dimmer.maxScale) {
                                message.slider1Pos = Math.trunc(
                                    Color.scale(
                                        dimmer,
                                        await item.dimmer.minScale.getNumber(),
                                        await item.dimmer.maxScale.getNumber(),
                                        100,
                                        0,
                                    ),
                                );
                            } else {
                                message.slider1Pos = dimmer;
                            }
                        }

                        message.slidersColor =
                            (await tools.getIconEntryColor(item.icon, false, Color.White)) ?? 'disable';
                        let rgb = null;
                        switch (this.config.role) {
                            case 'socket':
                            case 'light':
                            case 'dimmer':
                            case 'ct':
                                break;
                            case 'hue': {
                                const nhue = (item.hue && (await item.hue.getNumber())) ?? null;
                                if (nhue) rgb = Color.hsv2RGB(nhue, 1, 1) ?? null;
                                break;
                            }
                            case 'rgbSingle': {
                                rgb = (await tools.getRGBfromRGBThree(item)) ?? null;
                                break;
                            }
                            case 'rgb': {
                                rgb = (item.color && item.color.true && (await item.color.true.getRGBValue())) ?? null;
                                break;
                            }
                        }
                        if (rgb !== null) {
                            message.hueMode = true;
                            message.slidersColor = await tools.GetIconColor(
                                rgb,
                                message.slider1Pos !== 'disable' && message.slider1Pos !== undefined
                                    ? message.slider1Pos > 20
                                        ? message.slider1Pos
                                        : 20
                                    : message.buttonState !== 'disable' && message.buttonState !== false,
                            );
                        } else {
                            message.slider2Pos = 'disable';
                        }

                        if (rgb === null) {
                            if (item.ct && item.ct.value) {
                                const ct = await tools.getScaledNumber(item.ct);
                                if (ct) {
                                    message.slider2Pos = Math.trunc(ct);
                                }
                            }
                        }
                        message.popup = message.slider2Pos !== 'disable' && rgb !== null;

                        message.slider1Translation =
                            (item.text1 && item.text1.true && (await item.text1.true.getString())) ?? undefined;
                        message.slider2Translation =
                            (item.text2 && item.text2.true && (await item.text2.true.getString())) ?? undefined;
                        message.hue_translation =
                            (item.text3 && item.text3.true && (await item.text3.true.getString())) ?? undefined;

                        if (message.slider1Translation !== undefined)
                            message.slider1Translation = this.library.getTranslation(message.slider1Translation);
                        if (message.slider2Translation !== undefined)
                            message.slider2Translation = this.library.getTranslation(message.slider2Translation);
                        if (message.hue_translation !== undefined)
                            message.hue_translation = this.library.getTranslation(message.hue_translation);

                        break;
                    }
                }
                break;
            }

            case 'popupFan':
            case 'popupThermo': {
                if (entry.type !== 'input_sel') break;
                const item = entry.data;
                message.type = 'popupThermo';

                if (message.type !== 'popupThermo') return null;

                if (
                    item.entityInSel &&
                    item.entityInSel.value &&
                    ['string', 'number'].indexOf(item.entityInSel.value.trueType() ?? '') &&
                    item.entityInSel.value.getCommonStates()
                ) {
                    const states = item.entityInSel.value.getCommonStates();
                    const value = await tools.getValueEntryString(item.entityInSel);
                    if (value !== null && states && states[value] !== undefined) {
                        message.headline = this.library.getTranslation(
                            (item.headline && (await item.headline.getString())) ?? '',
                        );
                        const list: string[] = [];
                        for (const a in states) {
                            list.push(this.library.getTranslation(String(states[a])));
                        }
                        if (list.length > 0) {
                            message.list = Array.isArray(list)
                                ? list.map((a: string) => tools.formatInSelText(a)).join('?')
                                : '';
                            break;
                        }
                    }
                }

                message.value = (await tools.getValueEntryString(item.entityInSel)) ?? '';
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
            case 'popupInSel': {
                if (entry.type !== 'input_sel' && entry.type !== 'light') break;
                const item = entry.data;
                message.type = 'insel';

                if (message.type !== 'insel') return null;
                if (
                    item.entityInSel &&
                    item.entityInSel.value &&
                    ['string', 'number'].indexOf(item.entityInSel.value.trueType() ?? '') &&
                    item.entityInSel.value.getCommonStates()
                ) {
                    const states = item.entityInSel.value.getCommonStates();
                    const value = await tools.getValueEntryString(item.entityInSel);
                    if (value !== null && states && states[value] !== undefined) {
                        message.textColor = await tools.getEntryColor(item.color, !!value, Color.White);
                        message.headline = this.library.getTranslation(
                            (item.headline && (await item.headline.getString())) ?? '',
                        );
                        const list: string[] = [];
                        for (const a in states) {
                            list.push(this.library.getTranslation(String(states[a])));
                        }
                        if (list.length > 0) {
                            message.list = Array.isArray(list)
                                ? list.map((a: string) => tools.formatInSelText(a)).join('?')
                                : '';
                            break;
                        }
                    }
                }
                const value = (await tools.getValueEntryBoolean(item.entityInSel)) ?? true;
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

                /**
                 * die Liste ist entweder ein mit ? getrennt der String oder ein Array
                 */
                if (list !== null) {
                    if (typeof list === 'string') list = list.split('?');
                } else list = [];
                message.list = Array.isArray(list) ? list.map((a: string) => tools.formatInSelText(a)).join('?') : '';
                break;
            }
        }

        //if (template.type !== message.type) {
        //    throw new Error(`Template ${template.type} is not ${message.type} for role: ${this.config.role}`);
        //}
        return this.getDetailPayload(message);

        return null;
    }

    async delete(): Promise<void> {
        this.visibility = false;
        await this.controller.statesControler.deactivateTrigger(this);
        await super.delete();
    }

    async setPopupAction(action: string, value: string): Promise<void> {
        if (value === undefined || this.dataItems === undefined) return;
        const entry = this.dataItems;
        switch (action) {
            case 'mode-insel':
                {
                    /**
                     * Die Setzliste besteht aus 1 Arrays in Stringform mit trenner | und einem json mit trenner ? { id: t[0], value: t[1] }
                     * oder { id: t[0], value: t[1], command: t[2]} command bitte in der funktion nachsehen. Hier sind meist nicht alle beschrieben
                     *
                     * Standardnutzung, NSPanelauswahl von z.B. Eintrag 2 benutzt das Element 2 aus diesem Array und setzt die ID auf den Wert value
                     * 'flip': Liest den State mit ID ein, negiert den Wert und schreibt ihn wieder zurück. string, number, boolean möglich.
                     */
                    if (entry.type !== 'input_sel') break;

                    const item = entry.data;
                    if (
                        item.entityInSel &&
                        item.entityInSel.value &&
                        ['string', 'number'].indexOf(item.entityInSel.value.trueType() ?? '') &&
                        item.entityInSel.value.getCommonStates() &&
                        !item.setList
                    ) {
                        const states = item.entityInSel.value.getCommonStates();
                        //const value = await tools.getValueEntryString(item.entity1);
                        if (value !== null && states !== undefined) {
                            const list: string[] = [];
                            for (const a in states) {
                                list.push(this.library.getTranslation(String(a)));
                            }
                            if (list[parseInt(value)] !== undefined) {
                                await item.entityInSel.value.setStateAsync(list[parseInt(value)]);
                                break;
                            }
                        }
                    }

                    if (!item.setList) return;
                    let list: listCommand[] | null = (await item.setList.getObject()) as listCommand[] | null;
                    if (list === null) {
                        const temp = await item.setList.getString();
                        if (temp === null) return;
                        list = temp.split('|').map((a: string): listCommand => {
                            const t = a.split('?');
                            return islistCommandUnion(t[2])
                                ? { id: t[0], value: t[1], command: t[2] }
                                : { id: t[0], value: t[1] };
                        });
                    }
                    const v = parseInt(value);
                    if (list[v]) {
                        try {
                            const obj = await this.adapter.getForeignObjectAsync(list[v].id);
                            if (!obj || !obj.common || obj.type !== 'state') throw new Error('Dont get obj!');

                            const type = obj.common.type;
                            let newValue: any = null;
                            switch (list[v].command) {
                                case 'flip': {
                                    const state = await this.adapter.getForeignStateAsync(list[v].id);
                                    if (state) {
                                        switch (typeof state.val) {
                                            case 'string': {
                                                switch (
                                                    state.val as
                                                        | 'ON'
                                                        | 'OFF'
                                                        | 'TRUE'
                                                        | 'FALSE'
                                                        | 'START'
                                                        | 'STOP'
                                                        | '0'
                                                        | '1'
                                                ) {
                                                    case 'ON': {
                                                        newValue = 'OFF';
                                                        break;
                                                    }
                                                    case 'OFF': {
                                                        newValue = 'ON';
                                                        break;
                                                    }
                                                    case 'TRUE': {
                                                        newValue = 'FALSE';
                                                        break;
                                                    }
                                                    case 'FALSE': {
                                                        newValue = 'TRUE';
                                                        break;
                                                    }
                                                    case 'START': {
                                                        newValue = 'STOP';
                                                        break;
                                                    }
                                                    case 'STOP': {
                                                        newValue = 'START';
                                                        break;
                                                    }
                                                    case '0': {
                                                        newValue = '1';
                                                        break;
                                                    }
                                                    case '1': {
                                                        newValue = '0';
                                                        break;
                                                    }
                                                }
                                                break;
                                            }
                                            case 'number':
                                            case 'bigint': {
                                                newValue = state.val === 1 ? 0 : 1;
                                                break;
                                            }
                                            case 'boolean': {
                                                newValue = !state.val;
                                                break;
                                            }

                                            case 'symbol':
                                            case 'undefined':
                                            case 'object':
                                            case 'function':
                                                return;
                                        }
                                    }
                                    break;
                                }
                                case undefined: {
                                    newValue = this.adapter.library.convertToType(list[v].value, type);
                                }
                            }

                            if (newValue !== null) {
                                await this.adapter.setForeignStateAsync(
                                    list[v].id,
                                    newValue,
                                    list[v].id.startsWith(this.adapter.namespace),
                                );
                                this.log.debug(`------------Set dp ${list[v].id} to ${String(newValue)}!`);
                            } else {
                                this.log.error(`Try to set a null value to ${list[v].id}!`);
                            }
                        } catch (e) {
                            this.log.error(`Id ${list[v].id} is not valid!`);
                        }
                    } else {
                    }
                }
                break;
            case 'button': {
                if (entry.type === 'button') {
                    const item = entry.data;
                    let value: any = (item.setNavi && (await item.setNavi.getString())) ?? null;
                    if (value !== null) {
                        this.panel.navigation.setTargetPageByName(value);
                        break;
                    }
                    value = (item.setValue1 && (await item.setValue1.getBoolean())) ?? null;
                    if (value !== null) {
                        await item.setValue1!.setStateFlip();
                    }
                } else if (entry.type === 'light') {
                    const item = entry.data;
                    item.entity1 && item.entity1.value && (await item.entity1.value.setStateFlip());
                }
                break;
            }
            case 'brightnessSlider': {
                if (entry.type === 'light') {
                    const item = entry.data;
                    if (item && item.dimmer && item.dimmer.value && item.dimmer.value.writeable) {
                        const dimmer = await tools.getScaledNumber(item.dimmer);
                        if (dimmer !== null && String(dimmer) != value)
                            await tools.setScaledNumber(item.dimmer, parseInt(value));
                    } else {
                        this.log.warn('Dimmer is not writeable!');
                    }
                }
                break;
            }
            case 'OnOff': {
                if (entry.type === 'light') {
                    const item = entry.data;
                    if (item && item.entity1 && item.entity1.value && item.entity1.value.writeable) {
                        await item.entity1.value.setStateAsync(value === '1');
                    } else {
                        this.log.warn('entity1 is not writeable!');
                    }
                }
                break;
            }
            case 'colorWheel': {
                if (entry.type === 'light') {
                    const item = entry.data;
                    if (item && this.config && item.entity1 && item.entity1.value && item.entity1.value.writeable) {
                        switch (this.config.role) {
                            case 'socket':
                            case 'light':
                            case 'dimmer':
                            case 'ct':
                                break;
                            case 'hue':
                                await tools.setHuefromRGB(item, Color.resultToRgb(value));
                                break;
                            case 'rgbSingle': {
                                const rgb = Color.resultToRgb(value);
                                await tools.setRGBThreefromRGB(item, rgb);
                                break;
                            }
                            case 'rgb': {
                                const rgb = Color.resultToRgb(value);
                                if (Color.isRGB(rgb)) {
                                    item.color &&
                                        item.color.true &&
                                        (await item.color.true.setStateAsync(JSON.stringify(rgb)));
                                }

                                break;
                            }
                        }
                    } else {
                        this.log.warn('color value is not writeable!');
                    }
                }
                break;
            }

            /*let rgb = null;
                        switch (this.config.role) {
                            case 'socket':
                            case 'light':
                            case 'dimmer':
                            case 'ct':
                                break;
                            case 'hue':
                                rgb = (await tools.getDecfromHue(item)) ?? null;
                                break;
                            case 'rgbSingle':
                            case 'rgb':
                                rgb = (await tools.getDecfromRGBThree(item)) ?? null;
                                break;
                        }
                        if (rgb !== null) {
                            message.hueMode = true;
                            message.slidersColor = rgb;
                        } else {
                            message.slider2Pos = 'disable';
                        }

                        if (rgb === null) {
                            if (item.ct && item.ct.value) {
                                const ct = await tools.getValueEntryNumber(item.ct);
                                if (ct) {
                                    message.slider2Pos = Math.trunc(ct);
                                }
                            }
                        }*/
        }
    }
    protected async onStateTrigger(): Promise<void> {
        if (this.lastPopupType) {
            const msg = await this.GenerateDetailPage(this.lastPopupType);
            if (msg) this.sendToPanel(msg);
        }
    }
}
