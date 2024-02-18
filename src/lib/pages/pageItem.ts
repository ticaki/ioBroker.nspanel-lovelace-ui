import * as Color from '../const/Color';
import { Page, PageItemInterface } from '../classes/Page';
import {
    PageItemDataItems,
    MessageItem,
    entityUpdateDetailMessage,
    PageItemDataItemsOptions,
    listCommand,
    islistCommandUnion,
    spotifyPlaylist,
    PageItemDataItemsOptionsWithOutTemplate,
    PageItemOptionsTemplate,
} from '../types/type-pageItem';
import * as tools from '../const/tools';
import { PopupType } from '../types/types';
import { Panel } from '../controller/panel';
import { BaseClassTriggerd } from '../controller/states-controller';
import { RGB } from '../types/Color';
import { Icons } from '../const/icon_mapping';
import { Dataitem } from '../classes/data-item';

import { textTemplates } from '../templates/text';
import { shutterTemplates } from '../templates/shutter';
import { BaseClass } from '../classes/library';

//light, shutter, delete, text, button, switch, number,input_sel, timer und fan types
export class PageItem extends BaseClassTriggerd {
    defaultOnColor = Color.White;
    defaultOffColor = Color.Blue;
    config: PageItemDataItemsOptionsWithOutTemplate | undefined;
    dataItems: PageItemDataItems | undefined;
    panel: Panel;
    id: string;
    lastPopupType: PopupType | undefined = undefined;
    parent: Page | undefined;
    tempData: any = undefined; // use this to save some data while object is active
    tempInterval: ioBroker.Interval | undefined;
    constructor(
        config: Omit<PageItemInterface, 'pageItemsConfig'>,
        options: PageItemDataItemsOptionsWithOutTemplate | undefined,
    ) {
        super({ ...config });
        this.panel = config.panel;
        this.id = config.id;
        this.config = options;
        this.parent = config && config.parent;
        this.sleep = false;
    }

    static getPageItem(
        config: Omit<PageItemInterface, 'pageItemsConfig'>,
        options: PageItemDataItemsOptions | undefined,
        that: BaseClass,
    ): PageItem | undefined {
        if (options === undefined) return undefined;
        if ('template' in options && options.template) {
            let index = -1;
            let template: PageItemOptionsTemplate | undefined;
            for (const i of [textTemplates, shutterTemplates]) {
                index = i.findIndex((a) => a.template === options!.template);
                if (index !== -1) {
                    template = i[index];
                    break;
                }
            }
            if (index === -1 || !template) {
                that.log.error('dont find template ' + options.template);
                return undefined;
            }
            if (
                template.adapter &&
                !options.dpInit.startsWith(template.adapter) &&
                !(config.parent && config.parent.dpInit.startsWith(template.adapter))
            ) {
                return undefined;
            }
            const newTemplate = structuredClone(template) as Partial<PageItemOptionsTemplate>;
            delete newTemplate.adapter;
            if (options.type && options.type !== template.type) {
                that.log.error(options.type + 'is not equal with ' + template.type);
                return undefined;
            }
            options.type = template.type;
            options.role = template.role;
            options = tools.deepAssign(newTemplate, options);
        }
        if (config.panel.persistentPageItems[config.id]) return config.panel.persistentPageItems[config.id];
        return new PageItem(config, options as PageItemDataItemsOptionsWithOutTemplate);
    }
    async init(): Promise<void> {
        if (!this.config) return;
        const config = structuredClone(this.config);
        // search states for mode auto
        const dpInit = (this.parent && this.parent.dpInit ? this.parent.dpInit : this.config.dpInit) ?? '';
        const tempConfig: Partial<PageItemDataItemsOptions['data']> = dpInit
            ? await this.panel.statesControler.getDataItemsFromAuto(dpInit, config.data)
            : config.data;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: PageItemDataItems['data'] = (await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        )) as PageItemDataItems['data'];
        this.dataItems = { ...config, data: tempItem } as PageItemDataItems;

        switch (this.dataItems.type) {
            case 'number':
            case 'button':
                break;
            case 'shutter': {
                const data = this.dataItems.data;
                this.tempData = [];
                this.tempData[0] = data.up && data.up.writeable;
                this.tempData[1] = data.stop && data.stop.writeable;
                this.tempData[2] = data.down && data.down.writeable;
                this.tempData[3] = data.up2 && data.up2.writeable;
                this.tempData[4] = data.stop2 && data.stop2.writeable;
                this.tempData[5] = data.down2 && data.down2.writeable;
                const list = await this.getListCommands(data.setList);
                if (list) {
                    for (let a = 0; a < 6; a++) {
                        const test =
                            list &&
                            list[a] &&
                            list[a].id &&
                            (await this.panel.statesControler.getObjectAsync(list[a].id));
                        if (test && test.common && test.common.write) this.tempData[a] = true;
                    }
                }
                if (data.entity1 && data.entity1.value) {
                    if (
                        (data.entity1.value.type === 'number' &&
                            data.entity1.minScale &&
                            data.entity1.maxScale &&
                            data.entity1.value &&
                            data.entity1.value.writeable) ||
                        (data.entity1.value.type === 'boolean' && data.entity1.value && data.entity1.value.writeable)
                    ) {
                        this.tempData[1] = true;
                        this.tempData[3] = true;
                    }
                }

                if (data.entity2 && data.entity2.value) {
                    if (
                        data.entity2.value.type === 'number' &&
                        data.entity2.minScale &&
                        data.entity2.maxScale &&
                        data.entity2.value &&
                        data.entity2.value.writeable
                    ) {
                        this.tempData[3] = true;
                        this.tempData[5] = true;
                    }
                }

                break;
            }
            case 'input_sel':
            case 'light':
            case 'text':
            case 'fan': {
                break;
            }
            case 'timer': {
                if (this.dataItems.role === 'timer' && this.tempData === undefined) {
                    this.tempData = { status: 'pause', value: 0 };
                    if (!this.panel.persistentPageItems[this.id]) this.panel.persistentPageItems[this.id] = this;
                }
                break;
            }
        }
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
                    const colorMode: 'ct' | 'hue' | 'none' = !item.colorMode
                        ? 'none'
                        : (await item.colorMode.getBoolean())
                          ? 'hue'
                          : 'ct';

                    message.iconColor =
                        (colorMode === 'hue'
                            ? await tools.GetIconColor(
                                  rgb ?? undefined,
                                  dimmer !== null ? (dimmer > 5 ? dimmer : 5) : v,
                              )
                            : await tools.getTemperaturColorFromValue(item.ct, dimmer ?? 100)) ??
                        (await tools.GetIconColor(item.icon, dimmer !== null ? (dimmer > 5 ? dimmer : 5) : v)) ??
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
                case 'shutter': {
                    const item = entry.data;

                    message.type = 'shutter';

                    const value = await tools.getValueEntryNumber(item.entity1);
                    if (value === null) {
                        this.log.warn(`Entity ${this.config.role} has no value!`);
                        break;
                    }
                    message.icon = await tools.getIconEntryValue(item.icon, value < 40, 'window-open');
                    message.iconColor = await tools.getIconEntryColor(item.icon, value < 40, Color.White);
                    const optionalValue = item.valueList
                        ? await item.valueList.getObject()
                        : [
                              'arrow-up', //up
                              'stop', //stop
                              'arrow-down', //down
                              'enable', // up status
                              'enable', // stop status
                              'enable', // down status
                          ];
                    let optionalValueC =
                        Array.isArray(optionalValue) && optionalValue.every((a) => typeof a === 'string')
                            ? [...optionalValue]
                            : ['', '', ''];
                    optionalValueC = optionalValueC.splice(0, 3).map((a) => (a ? Icons.GetIcon(a) : a));
                    optionalValueC.forEach((a, i) => {
                        if (a) optionalValueC[i + 3] = this.tempData[i] ? 'enable' : 'disable';
                        else {
                            optionalValueC[i] = '';
                            optionalValueC[i + 3] = 'disable';
                        }
                    });

                    optionalValueC[3] = value === 0 ? 'disable' : optionalValueC[3];
                    optionalValueC[5] = value === 100 ? 'disable' : optionalValueC[5];
                    message.optionalValue = optionalValueC.join('|');
                    message.displayName = (item.headline && (await item.headline.getString())) ?? '';
                    message.displayName = this.library.getTranslation(message.displayName);
                    return tools.getItemMesssage(message);
                    break;
                }

                case 'number': {
                    if (entry.type === 'number') {
                        const item = entry.data;
                        message.type = 'number';
                        const number = (await tools.getValueEntryNumber(item.entity1, false)) ?? 0;
                        message.displayName = (await tools.getEntryTextOnOff(item.text, true)) ?? '';
                        message.icon = (await tools.getIconEntryValue(item.icon, true, '')) ?? '';
                        message.iconColor = (await tools.getIconEntryColor(item.icon, true, Color.HMIOn)) ?? '';
                        const min =
                            (item.entity1 && item.entity1.minScale && (await item.entity1.minScale.getNumber())) ?? 0;
                        const max =
                            (item.entity1 && item.entity1.maxScale && (await item.entity1.maxScale.getNumber())) ?? 100;
                        return tools.getPayload(
                            message.type,
                            message.intNameEntity,
                            message.icon,
                            message.iconColor,
                            message.displayName,
                            `${number}|${min}|${max}`,
                        );
                    }
                    break;
                }
                case 'text': {
                    if (entry.type === 'text') {
                        const item = entry.data;
                        message.type = 'text';
                        let value: boolean | number | null = await tools.getValueEntryNumber(item.entity1, false);
                        if (value === null) value = await tools.getValueEntryBoolean(item.entity1);
                        if (value === null) value = true;
                        message.displayName = (await tools.getEntryTextOnOff(item.text, !!value)) ?? '';
                        message.optionalValue = (await tools.getEntryTextOnOff(item.text1, !!value)) ?? '';
                        message.icon = (await tools.getIconEntryValue(item.icon, !!value, '')) ?? '';
                        message.iconColor = (await tools.getIconEntryColor(item.icon, value, Color.HMIOn)) ?? '';
                        return tools.getPayload(
                            message.type,
                            message.intNameEntity,
                            message.icon,
                            message.iconColor,
                            message.displayName,
                            message.optionalValue,
                        );
                    }
                    break;
                }
                case 'button': {
                    /**
                     * Alles was einen Druckfläche sein kann. D
                     */
                    const item = entry.data;

                    if (item.entity1 && item.entity1.value) {
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
                    message.displayName = (item.headline && (await item.headline.getString())) ?? '';

                    message.optionalValue = (await tools.getEntryTextOnOff(item.text, !!value)) ?? 'PRESS';
                    this.log.debug(JSON.stringify(message));
                    return tools.getItemMesssage(message);

                    break;
                }
                case 'fan': {
                    if (entry.type === 'fan') {
                        const item = entry.data;
                        message.type = 'fan';
                        //const speed = (await tools.getValueEntryNumber(item.speed, true)) ?? null;
                        const value = (await tools.getValueEntryBoolean(item.entity1)) ?? null;
                        message.displayName = (item.headline && (await item.headline.getString())) ?? '';
                        message.icon = (await tools.getIconEntryValue(item.icon, value, '')) ?? '';
                        message.iconColor = (await tools.getIconEntryColor(item.icon, value, Color.HMIOn)) ?? '';
                        /*const min =
                        (item.entity1 && item.entity1.minScale && (await item.entity1.minScale.getNumber())) ?? 0;
                        const max =
                        (item.entity1 && item.entity1.maxScale && (await item.entity1.maxScale.getNumber())) ?? 100;
                        */
                        return tools.getPayload(
                            message.type,
                            message.intNameEntity,
                            message.icon,
                            message.iconColor,
                            message.displayName,
                            value ? '1' : '0',
                        );
                    }
                }
                case 'timer': {
                    if (entry.type === 'timer') {
                        const item = entry.data;
                        message.type = 'timer';
                        const value: number | null = !item.setValue1
                            ? (item.entity1 && (await tools.getValueEntryNumber(item.entity1))) ?? null
                            : (this.tempData && this.tempData.time) ?? 0;

                        if (value !== null) {
                            let opt = '';
                            if (this.tempData) {
                                opt = new Date(new Date().setHours(0, 0, this.tempData.value, 0)).toLocaleTimeString(
                                    'de',
                                    { minute: '2-digit', second: '2-digit' },
                                );
                            }
                            message.iconColor = await tools.GetIconColor(item.icon, value);
                            message.icon = await tools.getIconEntryValue(item.icon, true, 'gesture-tap-button');
                            message.optionalValue = (await tools.getEntryTextOnOff(item.text, value !== 0)) ?? opt;

                            message.displayName = (item.headline && (await item.headline.getString())) ?? '';
                            return tools.getPayload(
                                message.type,
                                message.intNameEntity,
                                message.icon,
                                message.iconColor,
                                message.displayName,
                                message.optionalValue,
                            );
                        }
                    }
                    break;
                } /*
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
        this.log.warn(`Something went wrong on ${this.id} type: ${this.config && this.config.type}!`);
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
                    currentState: '',
                    list: '',
                };
                result = Object.assign(result, message);
                return tools.getPayload(
                    'entityUpdateDetail2',
                    result.entityName,
                    '',
                    result.textColor,
                    result.type,
                    result.currentState,
                    result.list,
                );
                break;
            }
            case 'popupThermo': {
                let result: entityUpdateDetailMessage = {
                    type: 'popupThermo',
                    entityName: '',
                    headline: '',
                    currentState: '',
                    list: '',
                };
                result = Object.assign(result, message);
                return tools.getPayload(result.headline, result.entityName, result.currentState, result.list);
                break;
            }
            case 'popupFan': {
                let result: entityUpdateDetailMessage = {
                    type: 'popupFan',
                    entityName: '',
                    icon: '',
                    iconColor: '',
                    buttonstate: '',
                    slider1: '',
                    slider1Max: '',
                    speedText: '',
                    mode: '',
                    modeList: '',
                };
                result = Object.assign(result, message);
                return tools.getPayload(
                    'entityUpdateDetail',
                    result.entityName,
                    result.icon,
                    result.iconColor,
                    result.buttonstate,
                    result.slider1,
                    result.slider1Max,
                    result.speedText,
                    result.mode,
                    result.modeList,
                );
                break;
            }
            case 'popupTimer': {
                let result: entityUpdateDetailMessage = {
                    type: 'popupTimer',
                    entityName: '',
                    iconColor: '',
                    minutes: '',
                    seconds: '',
                    editable: '0',
                    action1: '',
                    action2: '',
                    action3: '',
                    text1: '',
                    text2: '',
                    text3: '',
                };
                result = Object.assign(result, message);
                return tools.getPayload(
                    'entityUpdateDetail',
                    result.entityName,
                    '',
                    result.iconColor,
                    result.entityName,
                    result.minutes,
                    result.seconds,
                    result.editable,
                    result.action1,
                    result.action2,
                    result.action3,
                    result.text1,
                    result.text2,
                    result.text3,
                );
                break;
            }
            case 'popupShutter': {
                let result: entityUpdateDetailMessage = {
                    type: 'popupShutter',
                    entityName: '',
                    pos1: '',
                    text2: '',
                    pos1text: '',
                    icon: '',
                    iconL1: '',
                    iconM1: '',
                    iconR1: '',
                    statusL1: 'disable',
                    statusM1: 'disable',
                    statusR1: 'disable',
                    pos2text: '',
                    iconL2: '',
                    iconM2: '',
                    iconR2: '',
                    statusL2: 'disable',
                    statusM2: 'disable',
                    statusR2: 'disable',
                    pos2: '',
                };
                result = Object.assign(result, message);
                return tools.getPayload(
                    'entityUpdateDetail',
                    result.entityName,
                    result.pos1,
                    result.text2,
                    result.pos1text,
                    result.icon,
                    result.iconL1,
                    result.iconM1,
                    result.iconR1,
                    result.statusL1,
                    result.statusM1,
                    result.statusR1,
                    result.pos2text,
                    result.iconL2,
                    result.iconM2,
                    result.iconR2,
                    result.statusL2,
                    result.statusM2,
                    result.statusR2,
                    result.pos2,
                );
            }
        }
        return '';
    }

    async GeneratePopup(mode: PopupType): Promise<string | null> {
        if (!this.config || !this.dataItems) return null;
        const entry = this.dataItems;
        let message: Partial<entityUpdateDetailMessage> = {};
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
                    case 'rgb.hex':
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
                            case 'rgb.hex': {
                                rgb = (item.color && item.color.true && (await item.color.true.getRGBValue())) ?? null;
                                break;
                            }
                        }
                        message.slider2Pos = 'disable';

                        if (item.ct && item.ct.value) {
                            const ct = await tools.getSliderCTFromValue(item.ct);
                            if (ct !== null) {
                                message.slider2Pos = parseInt(ct);
                            }
                        }
                        const colorMode: 'ct' | 'hue' | 'none' = !item.colorMode
                            ? 'none'
                            : (await item.colorMode.getBoolean())
                              ? 'hue'
                              : 'ct';

                        message.hueMode = rgb !== null;
                        if (rgb !== null && colorMode === 'hue') {
                            message.slidersColor = await tools.GetIconColor(
                                rgb,
                                message.slider1Pos !== 'disable' && message.slider1Pos !== undefined
                                    ? message.slider1Pos > 20
                                        ? message.slider1Pos
                                        : 20
                                    : message.buttonState !== 'disable' && message.buttonState !== false,
                            );
                        }
                        if (message.slider2Pos !== 'disable' && colorMode === 'ct') {
                            message.slidersColor =
                                (await tools.getTemperaturColorFromValue(item.ct, dimmer ?? 100)) ?? '';
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

            case 'popupFan': {
                if (entry.type === 'fan') {
                    const item = entry.data;
                    message.type = 'popupFan';
                    if (message.type !== 'popupFan') break;
                    //const speed = (await tools.getValueEntryNumber(item.speed, true)) ?? null;
                    const value = (await tools.getValueEntryBoolean(item.entity1)) ?? null;
                    message.icon = (await tools.getIconEntryValue(item.icon, value, '')) ?? '';
                    message.iconColor = (await tools.getIconEntryColor(item.icon, value, Color.HMIOn)) ?? '';
                    /*const min =
                    (item.entity1 && item.entity1.minScale && (await item.entity1.minScale.getNumber())) ?? 0;*/
                    message.slider1 = String((await tools.getScaledNumber(item.speed)) ?? '');
                    message.slider1Max = String(
                        (item.speed && item.speed.maxScale && (await item.speed.maxScale.getNumber())) ?? '100',
                    );

                    message.buttonstate = value ? '1' : '0';
                    message.speedText = (await tools.getEntryTextOnOff(item.text, value)) ?? '';
                    message.mode = (await tools.getValueEntryString(item.entityInSel)) ?? '';
                    let list =
                        (item.valueList && (await item.valueList.getObject())) ??
                        (item.valueList && (await item.valueList.getString())) ??
                        '';

                    /**
                     * die Liste ist entweder ein mit ? getrennt der String oder ein Array
                     */
                    if (list !== null) {
                        if (Array.isArray(list)) list = list.join('?');
                    }
                    message.modeList = typeof list === 'string' ? list : '';
                }
                break;
            }
            case 'popupThermo':
            case 'popupInSel': {
                if (entry.type !== 'input_sel' && entry.type !== 'light') break;
                const item = entry.data;
                message.type = 'insel';
                if (!(message.type === 'insel')) return null;

                const value = (await tools.getValueEntryBoolean(item.entityInSel)) ?? true;
                if (message.type === 'insel')
                    message.textColor = await tools.getEntryColor(item.color, value, Color.White);
                message.currentState = this.library.getTranslation(
                    (item.headline && (await item.headline.getString())) ?? '',
                );

                if (
                    item.entityInSel &&
                    item.entityInSel.value &&
                    ['string', 'number'].indexOf(item.entityInSel.value.type ?? '') &&
                    (item.entityInSel.value.getCommonStates() || entry.role == 'spotify-playlist')
                ) {
                    let states: Record<string | number, string> | undefined = undefined;
                    const value = await tools.getValueEntryString(item.entityInSel);
                    switch (entry.role) {
                        case 'spotify-playlist': {
                            if (item.valueList) {
                                const val = (await item.valueList.getObject()) as spotifyPlaylist | null;
                                if (val) {
                                    states = {};
                                    for (const a in val) {
                                        states[a] = val[a].title;
                                    }
                                }
                            }
                            break;
                        }
                        default: {
                            states = item.entityInSel.value.getCommonStates();
                        }
                    }
                    if (value !== null && states && states[value] !== undefined) {
                        message.textColor = await tools.getEntryColor(item.color, !!value, Color.White);
                        const list: string[] = [];
                        for (const a in states) {
                            list.push(this.library.getTranslation(String(states[a])));
                        }
                        if (list.length > 0) {
                            message.list = Array.isArray(list)
                                ? list.map((a: string) => tools.formatInSelText(a)).join('?')
                                : '';

                            message.currentState = tools.formatInSelText(this.library.getTranslation(states[value]));
                            if (mode !== 'popupThermo') break;
                            message = { ...message, type: 'popupThermo' };
                            if (message.type === 'popupThermo') {
                                message.headline = this.library.getTranslation(
                                    (item.headline && (await item.headline.getString())) ?? '',
                                );
                            }
                            break;
                        }
                    }
                }

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
                if (mode !== 'popupThermo') break;
                message = { ...message, type: 'popupThermo' };
                if (message.type === 'popupThermo') {
                    message.headline = this.library.getTranslation(
                        (item.headline && (await item.headline.getString())) ?? '',
                    );
                }

                break;
            }
            case 'popupLightNew':
            case 'popupNotify':
            case 'popupShutter': {
                //entityUpdateDetail~entityName~*sliderPos*~2ndrow~textPosition~icon1~iconUp~iconStop~iconDown~iconUpStatus~iconStopStatus~iconDownStatus
                //~textTilt~iconTiltLeft~iconTiltStop~iconTiltRight~iconTiltLeftStatus~iconTiltStopStatus~iconTiltLeftStatus~tiltPos
                if (entry.type !== 'shutter') break;
                const item = entry.data;
                message.type = 'popupShutter';
                if (!(message.type === 'popupShutter')) break;
                message.text2 = (item.text && item.text.true && (await item.text.true.getString())) ?? '';
                message.text2 = this.library.getTranslation(message.text2);
                const pos1 = (await tools.getValueEntryNumber(item.entity1)) ?? undefined;
                const pos2 = (await tools.getValueEntryNumber(item.entity2)) ?? undefined;
                if (pos1 !== undefined) message.icon = (await tools.getIconEntryValue(item.icon, pos1 < 40, '')) ?? '';
                else if (pos2 !== undefined)
                    message.icon = (await tools.getIconEntryValue(item.icon, pos2 < 40, '')) ?? '';
                const optionalValue = item.valueList
                    ? await item.valueList.getObject()
                    : [
                          'arrow-up', //up
                          'stop', //stop
                          'arrow-down', //down
                          'arrow-up', //up
                          'stop', //stop
                          'arrow-down', //down
                      ];
                const arr = [pos1, pos2];
                for (let index = 0; index < arr.length; index++) {
                    const pos = arr[index];
                    if (pos == undefined) continue;

                    const i = index * 3;

                    let optionalValueC =
                        Array.isArray(optionalValue) && optionalValue.every((a) => typeof a === 'string')
                            ? [...optionalValue]
                            : ['', '', ''];
                    optionalValueC = optionalValueC.splice(i, 3).map((a) => (a ? Icons.GetIcon(a) : a));
                    optionalValueC.forEach((a, i) => {
                        if (a) optionalValueC[i + 3] = this.tempData[i + 3] ? 'enable' : 'disable';
                        else {
                            optionalValueC[i] = '';
                            optionalValueC[i + 3] = 'disable';
                        }
                    });
                    if (index === 0) {
                        message.pos1 = String(pos);
                        message.pos1text = (await tools.getEntryTextOnOff(item.text1, true)) ?? '';
                        message.pos1text = this.library.getTranslation(message.pos1text);
                        message.iconL1 = optionalValueC[0];
                        message.iconM1 = optionalValueC[1];
                        message.iconR1 = optionalValueC[2];
                        message.statusL1 = pos === 0 ? 'disable' : optionalValueC[3];
                        message.statusM1 = optionalValueC[4];
                        message.statusR1 = pos === 100 ? 'disable' : optionalValueC[5];
                    } else {
                        message.pos2 = String(pos);
                        message.pos2text = (await tools.getEntryTextOnOff(item.text2, true)) ?? '';
                        message.pos2text = this.library.getTranslation(message.pos2text);
                        message.iconL2 = optionalValueC[0];
                        message.iconM2 = optionalValueC[1];
                        message.iconR2 = optionalValueC[2];
                        message.statusL2 = pos === 0 ? 'disable' : optionalValueC[3];
                        message.statusM2 = optionalValueC[4];
                        message.statusR2 = pos === 100 ? 'disable' : optionalValueC[5];
                    }
                }
                break;
            }
            case 'popupTimer': {
                if (entry.type !== 'timer') break;
                const item = entry.data;
                message.type = 'popupTimer';
                if (!(message.type === 'popupTimer')) break;
                if (this.tempData !== undefined) {
                    message.iconColor = await tools.GetIconColor(item.icon, this.tempData.status === 'run');
                    message.minutes = Math.floor(this.tempData.value / 60).toFixed(0);
                    message.seconds = Math.floor(this.tempData.value % 60).toFixed(0);

                    if (this.tempData.status === 'run') {
                        message.editable = '0';
                        message.action1 = 'pause';
                        message.action3 = 'clear';
                        //message.action3 = 'finish';
                        message.text1 = this.library.getTranslation('Pause');
                        message.text3 = this.library.getTranslation('Clear');
                        //message.text3 = this.library.getTranslation('Finish');
                    } else if (this.tempData.value > 0) {
                        message.editable = '0';
                        message.action1 = 'start';
                        message.action3 = 'clear';
                        //message.action3 = 'finish';
                        message.text1 = this.library.getTranslation('Continue');
                        message.text3 = this.library.getTranslation('Clear');
                        //message.text3 = this.library.getTranslation('Finish');
                    } else {
                        message.editable = '1';
                        message.action2 = 'start';
                        message.text2 = this.library.getTranslation('Start');
                    }
                }
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
        if (this.panel.persistentPageItems[this.id]) {
            if (!this.panel.unload) return;
        }
        await super.delete();
        this.parent = undefined;
    }

    async onCommand(action: string, value: string): Promise<boolean> {
        if (value === undefined || this.dataItems === undefined) return false;
        const entry = this.dataItems;
        switch (action) {
            case 'mode-preset_modes':
            case 'mode-insel':
                {
                    if (!('entityInSel' in entry.data)) break;
                    await this.setListCommand(entry, value);
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
                    if (this.config && this.parent && this.config.role == 'arrow') {
                        //this.parent.step
                        //this.parent.update()
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
            case 'colorTempSlider': {
                if (entry.type === 'light') {
                    const item = entry.data;
                    if (item && item.ct && item.ct.value && item.ct.value.writeable) {
                        const ct = await tools.getSliderCTFromValue(item.ct);
                        if (ct !== null && String(ct) != value)
                            await tools.setSliderCTFromValue(item.ct, parseInt(value));
                    } else {
                        this.log.warn('ct is not writeable!');
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
                    if (item && this.config) {
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
                            case 'rgb.hex': {
                                const rgb = Color.resultToRgb(value);
                                if (Color.isRGB(rgb)) {
                                    item.color &&
                                        item.color.true &&
                                        (await item.color.true.setStateAsync(
                                            Color.ConvertRGBtoHex(rgb.r, rgb.g, rgb.b),
                                        ));
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
            case 'tiltOpen': {
                if (entry.type !== 'shutter') break;
                if (entry.data.up2 && entry.data.up2.writeable) {
                    entry.data.up2.setStateTrue();
                    break;
                }
            }
            case 'tiltClose': {
                if (entry.type !== 'shutter') break;
                if (action === 'tiltClose' && entry.data.down2 && entry.data.down2.writeable) {
                    entry.data.down2.setStateTrue();
                    break;
                }
            }
            case 'tiltStop': {
                if (entry.type !== 'shutter') break;
                if (action === 'tiltStop' && entry.data.stop2 && entry.data.stop2.writeable) {
                    entry.data.stop2.setStateTrue();
                    break;
                }
                const items = entry.data;
                const list = await this.getListCommands(items.setList);
                if (list !== null && list.length > 2) {
                    switch (action) {
                        case 'tiltOpen': {
                            await this.adapter.setForeignStateAsync(list[0].id, list[0].value);
                            break;
                        }
                        case 'tiltStop': {
                            await this.adapter.setForeignStateAsync(list[1].id, list[1].value);
                            break;
                        }
                        case 'tiltClose': {
                            await this.adapter.setForeignStateAsync(list[2].id, list[2].value);
                            break;
                        }
                    }
                } else {
                    if (items.entity2 && items.entity2.value) {
                        if (items.entity2.value.type === 'number' && items.entity2.minScale && items.entity2.maxScale) {
                            switch (action) {
                                case 'tiltOpen': {
                                    if (tools.ifValueEntryIs(items.entity2, 'number')) {
                                        const value = await items.entity2.maxScale.getNumber();
                                        if (value !== null) await items.entity2.value.setStateAsync(value);
                                    }
                                    break;
                                }
                                case 'tiltStop': {
                                    if (tools.ifValueEntryIs(items.entity2, 'number')) {
                                        const value = await tools.getValueEntryNumber(items.entity2);
                                        if (value !== null) await tools.setValueEntryNumber(items.entity2, value);
                                    }
                                    break;
                                }
                                case 'tiltClose': {
                                    if (tools.ifValueEntryIs(items.entity2, 'number')) {
                                        const value = await items.entity2.minScale.getNumber();
                                        if (value !== null) await items.entity2.value.setStateAsync(value);
                                    }
                                    break;
                                }
                            }
                        } else if (items.entity2.value.type === 'boolean') {
                            if (action !== 'tiltStop') await items.entity2.value.setStateFlip();
                        }
                    }
                }

                break;
            }

            case 'up': {
                if (entry.type !== 'shutter') break;
                if (entry.data.up && entry.data.up.writeable) {
                    entry.data.up.setStateTrue();
                    break;
                }
            }
            case 'stop': {
                if (entry.type !== 'shutter') break;
                if (action === 'stop' && entry.data.stop && entry.data.stop.writeable) {
                    entry.data.stop.setStateTrue();
                    break;
                }
            }
            case 'down': {
                if (entry.type === 'shutter') {
                    if (action === 'down' && entry.data.down && entry.data.down.writeable) {
                        entry.data.down.setStateTrue();
                        break;
                    }
                    const items = entry.data;

                    const list = await this.getListCommands(items.setList);
                    if (list !== null && list.length > 2) {
                        switch (action) {
                            case 'up': {
                                await this.adapter.setForeignStateAsync(list[0].id, list[0].value);
                                break;
                            }
                            case 'stop': {
                                await this.adapter.setForeignStateAsync(list[1].id, list[1].value);
                                break;
                            }
                            case 'down': {
                                await this.adapter.setForeignStateAsync(list[2].id, list[2].value);
                                break;
                            }
                        }
                    } else {
                        if (items.entity1 && items.entity1.value && items.entity1.minScale && items.entity1.maxScale) {
                            if (items.entity1.value.type === 'number') {
                                switch (action) {
                                    case 'up': {
                                        if (tools.ifValueEntryIs(items.entity1, 'number')) {
                                            const value = await items.entity1.maxScale.getNumber();
                                            if (value !== null) await items.entity1.value.setStateAsync(value);
                                        }
                                        break;
                                    }
                                    case 'stop': {
                                        if (tools.ifValueEntryIs(items.entity1, 'number')) {
                                            const value = await tools.getValueEntryNumber(items.entity1);
                                            if (value !== null) await tools.setValueEntryNumber(items.entity1, value);
                                        }
                                        break;
                                    }
                                    case 'down': {
                                        if (tools.ifValueEntryIs(items.entity1, 'number')) {
                                            const value = await items.entity1.minScale.getNumber();
                                            if (value !== null) await items.entity1.value.setStateAsync(value);
                                        }
                                        break;
                                    }
                                }
                            } else if (items.entity1.value.type === 'boolean') {
                                if (action !== 'stop') await items.entity1.value.setStateFlip();
                            }
                        }
                    }
                }
                break;
            }
            /**
             * 100 is right 0 left
             */
            case 'positionSlider': {
                if (entry.type === 'shutter') {
                    const items = entry.data;
                    if (tools.ifValueEntryIs(items.entity1, 'number'))
                        await tools.setValueEntryNumber(items.entity1, parseInt(value));
                }
                break;
            }
            /**
             * zu 100% geschlossen zu 0% geschlossen
             */
            case 'tiltSlider': {
                if (entry.type === 'shutter') {
                    const items = entry.data;
                    if (tools.ifValueEntryIs(items.entity2, 'number'))
                        await tools.setValueEntryNumber(items.entity2, parseInt(value));
                }
                break;
            }
            case 'number-set': {
                if (entry.type === 'number') {
                    const item = entry.data;
                    await tools.setValueEntryNumber(item.entity1, parseInt(value), false);
                } else if (entry.type === 'fan') {
                    const item = entry.data;
                    await tools.setValueEntryNumber(item.speed, parseInt(value), false);
                }
                break;
            }
            case 'timer-start': {
                if (this.tempInterval) this.adapter.clearInterval(this.tempInterval);
                if (value) {
                    this.tempData.value = value.split(':').reduce((p, c, i) => {
                        return String(parseInt(p) + parseInt(c) * 60 ** (2 - i));
                    });
                } else {
                    this.tempData.status = 'run';
                    if (this.visibility) this.onStateTrigger();

                    this.tempInterval = this.adapter.setInterval(() => {
                        if (this.unload && this.tempInterval) this.adapter.clearInterval(this.tempInterval);
                        if (--this.tempData.value == 0) {
                            this.tempData.value = 0;
                            this.tempData.status = 'stop';
                            this.dataItems &&
                                this.dataItems.type == 'timer' &&
                                this.dataItems.data &&
                                this.dataItems.data.setValue1 &&
                                this.dataItems.data.setValue1.setStateTrue();
                            if (this.visibility) this.onStateTrigger();
                            if (this.tempInterval) this.adapter.clearInterval(this.tempInterval);
                            this.tempInterval = undefined;
                        } else if (this.tempData.value > 0) {
                            if (this.visibility) this.onStateTrigger();
                            else if (this.parent && !this.parent.sleep && this.parent.getVisibility())
                                this.parent.onStateTriggerSuperDoNotOverride('now');
                        }
                    }, 1000);
                }
                break;
            }
            case 'timer-finish': {
                break;
            }
            case 'timer-clear': {
                if (this.tempData) {
                    this.tempData.value = 0;
                    this.tempData.status = 'stop';
                    if (this.visibility) this.onStateTrigger();
                    if (this.tempInterval) this.adapter.clearInterval(this.tempInterval);
                }

                break;
            }
            case 'timer-pause': {
                if (this.tempData) {
                    this.tempData.status = 'pause';
                    if (this.visibility) this.onStateTrigger();
                    if (this.tempInterval) this.adapter.clearInterval(this.tempInterval);
                }

                break;
            }
            default: {
                return false;
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
        return true;
    }
    protected async onStateTrigger(): Promise<void> {
        if (this.lastPopupType) {
            if (this.lastPopupType === 'popupThermo') {
                this.log.debug(`Trigger from popupThermo `);
                this.parent && this.parent.onPopupRequest(this.id, 'popupThermo', '', '', null);
                return;
            } else {
                const msg = await this.GeneratePopup(this.lastPopupType);
                if (msg) this.sendToPanel(msg);
            }
        }
    }
    async getListCommands(setList: Dataitem | undefined): Promise<listCommand[] | null> {
        if (!setList) return null;
        let list: listCommand[] | null = (await setList.getObject()) as listCommand[] | null;
        if (list === null) {
            const temp = await setList.getString();
            if (temp === null) return null;
            list = temp.split('|').map((a: string): listCommand => {
                const t = a.split('?');
                return islistCommandUnion(t[2]) ? { id: t[0], value: t[1], command: t[2] } : { id: t[0], value: t[1] };
            });
        }
        return list;
    }

    /**
     * Die Setzliste besteht aus 1 Arrays in Stringform mit trenner | und einem json mit trenner ? { id: t[0], value: t[1] }
     * oder { id: t[0], value: t[1], command: t[2]} command bitte in der funktion nachsehen. Hier sind meist nicht alle beschrieben
     *
     * Standardnutzung, NSPanelauswahl von z.B. Eintrag 2 benutzt das Element 2 aus diesem Array und setzt die ID auf den Wert value
     * 'flip': Liest den State mit ID ein, negiert den Wert und schreibt ihn wieder zurück. string, number, boolean möglich.
     */

    async setListCommand(entry: PageItemDataItems, value: string): Promise<boolean> {
        //if (entry.type !== 'input_sel') return false;
        const item = entry.data;
        if (!('entityInSel' in item)) return false;
        if (
            item.entityInSel &&
            item.entityInSel.value &&
            ['string', 'number'].indexOf(item.entityInSel.value.type ?? '') &&
            (item.entityInSel.value.getCommonStates() || entry.role == 'spotify-playlist') &&
            !item.setList
        ) {
            let states: Record<string | number, string> | undefined = undefined;
            switch (entry.role) {
                case 'spotify-playlist': {
                    if (item.valueList) {
                        const val = (await item.valueList.getObject()) as spotifyPlaylist | null;
                        if (val) {
                            states = {};
                            for (const a in val) {
                                states[a] = a;
                            }
                        }
                    }
                    break;
                }
                default: {
                    states = item.entityInSel.value.getCommonStates();
                }
            }
            if (value !== null && states !== undefined) {
                const list: string[] = [];
                for (const a in states) {
                    list.push(String(a));
                }
                if (list[parseInt(value)] !== undefined) {
                    await item.entityInSel.value.setStateAsync(list[parseInt(value)]);
                    return true;
                }
            }
        }

        if (!item.setList) return false;
        const list = await this.getListCommands(item.setList);
        const v = value as keyof typeof list;
        if (list && list[v]) {
            try {
                const obj = await this.panel.statesControler.getObjectAsync(list[v].id);
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
                                        state.val as 'ON' | 'OFF' | 'TRUE' | 'FALSE' | 'START' | 'STOP' | '0' | '1'
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
                                    return false;
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
                    return true;
                } else {
                    this.log.error(`Try to set a null value to ${list[v].id}!`);
                }
            } catch (e) {
                this.log.error(`Id ${list[v].id} is not valid!`);
            }
        }
        return false;
    }
}
