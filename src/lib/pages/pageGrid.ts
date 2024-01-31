/*
import { config } from 'chai';
import { log } from 'console';
import { type } from 'os';
import { rgb_dec565, scale, colorScale0, colorScale10, HandleColorScale, GetIconColor } from '../const/Color';
import { Debug } from '../const/definition';
import { Icons } from '../const/icon_mapping';
import { roles, RGB, isEventMethod } from '../types/types';
import { Page, PageInterface } from './Page';
import { ChangeTypeOfKeys, MessageItem, PageItem } from '../types/pages';
import { Dataitem } from '../classes/data-item';
import { KeyObject } from 'crypto';

//light, shutter, delete, text, button, switch, number,input_sel, timer und fan types
export class PageGrid extends Page {
    constructor(config: PageInterface) {
        super({ ...config, card: 'cardGrid' });
    }

    async getPageItem(item2: { [key: string]: Dataitem }) {
        const item = item2 as unknown as Omit<PageItem, 'data'> & {
            data: ChangeTypeOfKeys<PageItem['data'], Dataitem>;
        };
        const message: Partial<MessageItem> = {};
        switch (item.role) {
            case 'light':
            case 'dimmer':
            case 'socket': {
                message.type = 'light';

                message.intNameEntity = 'lights';
                const dimmer = item.data.dimmer && (await item.data.dimmer.getNumber());
                const v = item.data.value && (await item.data.value.getBoolean());
                if (v) {
                    message.optionalValue = '1';
                    message.iconColor = await GetIconColor(item, dimmer ?? false);
                    const i = item.data.icon.true && (await item.data.icon.true.getString());
                    if (i !== null) message.icon = i;
                    else message.icon = Icons.GetIcon('power-socket-de');
                } else {
                    message.optionalValue = '0';
                    message.iconColor = await GetIconColor(item, dimmer ?? false);
                    const i = item.data.icon.false && (await item.data.icon.false.getString());
                    if (i !== null) message.icon = i;
                    else message.icon = Icons.GetIcon('lightbulb');
                }
                return this.getItemMesssage(message);
                break;
            }

            case 'hue': {
                break;
            }
            case 'rgb': {
                break;
            }
            case 'rgbSingle': {
                break;
            }
            case 'cd': {
                break;
            }
            case 'blind': {
                break;
            }
            case 'door': {
                break;
            }
            case 'window': {
                break;
            }
            case 'volumeGroup': {
                break;
            }
            case 'volume': {
                break;
            }
            case 'info': {
                break;
            }
            case 'humidity': {
                break;
            }
            case 'temperature': {
                break;
            }
            case 'value.temperature': {
                break;
            }
            case 'value.humidity': {
                break;
            }
            case 'sensor.door': {
                break;
            }
            case 'sensor.window': {
                break;
            }
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
            case 'gate': {
                break;
            }
            case 'motion': {
                break;
            }
            case 'buttonSensor': {
                break;
            }
            case 'button': {
                break;
            }
            case 'value.time': {
                break;
            }
            case 'level.timer': {
                break;
            }
            case 'value.alarmtime': {
                break;
            }
            case 'level.mode.fan': {
                break;
            }
            case 'lock': {
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
            }
        }
    }
    bla(role: roles): string {
        let type: string = '',
            iconId = '';
        const test: Partial<MessageItem> = {};
        switch (role) {
            case 'socket':
            case 'light':
                type = 'light';
                test.icon =
                    pageItem.icon !== undefined
                        ? Icons.GetIcon(pageItem.icon)
                        : role == 'socket'
                          ? Icons.GetIcon('power-socket-de')
                          : Icons.GetIcon('lightbulb');
                iconId2 =
                    pageItem.icon2 !== undefined
                        ? Icons.GetIcon(pageItem.icon2)
                        : role == 'socket'
                          ? Icons.GetIcon('power-socket-de')
                          : Icons.GetIcon('lightbulb');
                optVal = '0';

                if (val === true || val === 'true') {
                    optVal = '1';
                    iconColor = GetIconColor(pageItem, true, useColors);
                } else {
                    iconColor = GetIconColor(pageItem, false, useColors);
                    if (pageItem.icon !== undefined) {
                        if (pageItem.icon2 !== undefined) {
                            iconId = iconId2;
                        }
                    }
                }

                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + optVal;

            case 'hue':
                type = 'light';
                iconId = pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('lightbulb');
                optVal = '0';

                if (val === true || val === 'true') {
                    optVal = '1';
                    iconColor = GetIconColor(
                        pageItem,
                        existsState(pageItem.id + '.DIMMER') ? getState(pageItem.id + '.DIMMER').val : true,
                        useColors,
                    );
                } else {
                    iconColor = GetIconColor(pageItem, false, useColors);
                    if (pageItem.icon !== undefined) {
                        if (pageItem.icon2 !== undefined) {
                            iconId = iconId2;
                        }
                    }
                }

                if (pageItem.interpolateColor != undefined && pageItem.interpolateColor == true && val) {
                    if (existsState(pageItem.id + '.HUE')) {
                        if (getState(pageItem.id + '.HUE').val != null) {
                            const huecolor = hsv2rgb(getState(pageItem.id + '.HUE').val, 1, 1);
                            const rgb: RGB = {
                                red: Math.round(huecolor[0]),
                                green: Math.round(huecolor[1]),
                                blue: Math.round(huecolor[2]),
                            };
                            iconColor = rgb_dec565(
                                pageItem.interpolateColor !== undefined ? rgb : config.defaultOnColor,
                            );
                        }
                    }
                }

                if (Debug)
                    log(
                        'CreateEntity Icon role hue ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            optVal,
                        'info',
                    );
                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + optVal;

            case 'ct':
                type = 'light';
                iconId = pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('lightbulb');
                optVal = '0';

                if (val === true || val === 'true') {
                    optVal = '1';
                    iconColor = GetIconColor(
                        pageItem,
                        existsState(pageItem.id + '.DIMMER') ? getState(pageItem.id + '.DIMMER').val : true,
                        useColors,
                    );
                } else {
                    iconColor = GetIconColor(pageItem, false, useColors);
                    if (pageItem.icon !== undefined) {
                        if (pageItem.icon2 !== undefined) {
                            iconId = iconId2;
                        }
                    }
                }

                if (Debug)
                    log(
                        'CreateEntity Icon role ct ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            optVal,
                        'info',
                    );
                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + optVal;

            case 'rgb':
                type = 'light';
                iconId = pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('lightbulb');
                optVal = '0';

                if (val === true || val === 'true') {
                    optVal = '1';
                    iconColor = GetIconColor(
                        pageItem,
                        existsState(pageItem.id + '.DIMMER') ? getState(pageItem.id + '.DIMMER').val : true,
                        useColors,
                    );
                } else {
                    iconColor = GetIconColor(pageItem, false, useColors);
                    if (pageItem.icon !== undefined) {
                        if (pageItem.icon2 !== undefined) {
                            iconId = iconId2;
                        }
                    }
                }

                if (
                    existsState(pageItem.id + '.RED') &&
                    existsState(pageItem.id + '.GREEN') &&
                    existsState(pageItem.id + '.BLUE') &&
                    val
                ) {
                    if (
                        getState(pageItem.id + '.RED').val != null &&
                        getState(pageItem.id + '.GREEN').val != null &&
                        getState(pageItem.id + '.BLUE').val != null
                    ) {
                        const rgbRed = getState(pageItem.id + '.RED').val;
                        const rgbGreen = getState(pageItem.id + '.GREEN').val;
                        const rgbBlue = getState(pageItem.id + '.BLUE').val;
                        const rgb: RGB = {
                            red: Math.round(rgbRed),
                            green: Math.round(rgbGreen),
                            blue: Math.round(rgbBlue),
                        };
                        iconColor = rgb_dec565(pageItem.interpolateColor !== undefined ? rgb : config.defaultOnColor);
                    }
                }

                if (Debug)
                    log(
                        'CreateEntity Icon role rgb ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            optVal,
                        'info',
                    );
                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + optVal;

            case 'cie':
            case 'rgbSingle':
                type = 'light';
                iconId = pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('lightbulb');
                optVal = '0';

                if (val === true || val === 'true') {
                    optVal = '1';
                    iconColor = GetIconColor(
                        pageItem,
                        existsState(pageItem.id + '.DIMMER') ? getState(pageItem.id + '.DIMMER').val : true,
                        useColors,
                    );
                } else {
                    iconColor = GetIconColor(pageItem, false, useColors);
                    if (pageItem.icon !== undefined) {
                        if (pageItem.icon2 !== undefined) {
                            iconId = iconId2;
                        }
                    }
                }

                if (existsState(pageItem.id + '.RGB') && val) {
                    if (getState(pageItem.id + '.RGB').val != null) {
                        const hex = getState(pageItem.id + '.RGB').val;
                        const hexRed = parseInt(hex[1] + hex[2], 16);
                        const hexGreen = parseInt(hex[3] + hex[4], 16);
                        const hexBlue = parseInt(hex[5] + hex[6], 16);
                        const rgb: RGB = {
                            red: Math.round(hexRed),
                            green: Math.round(hexGreen),
                            blue: Math.round(hexBlue),
                        };
                        iconColor = rgb_dec565(pageItem.interpolateColor !== undefined ? rgb : config.defaultOnColor);
                    }
                }

                if (Debug)
                    log(
                        'CreateEntity Icon role cie/rgbSingle ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            optVal,
                        'info',
                    );
                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + optVal;

            case 'dimmer':
                type = 'light';
                iconId = pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('lightbulb');
                optVal = '0';

                if (val === true || val === 'true') {
                    optVal = '1';
                    iconColor = GetIconColor(
                        pageItem,
                        existsState(pageItem.id + '.ACTUAL') ? getState(pageItem.id + '.ACTUAL').val : true,
                        useColors,
                    );
                } else {
                    iconColor = GetIconColor(pageItem, false, useColors);
                    if (pageItem.icon !== undefined) {
                        if (pageItem.icon2 !== undefined) {
                            iconId = iconId2;
                        }
                    }
                }

                if (Debug)
                    log(
                        'CreateEntity Icon role dimmer ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            optVal,
                        'info',
                    );
                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + optVal;

            case 'blind':
                type = 'shutter';
                iconId = pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('window-open');
                iconColor = GetIconColor(
                    pageItem,
                    existsState(pageItem.id + '.ACTUAL') ? getState(pageItem.id + '.ACTUAL').val : true,
                    useColors,
                );

                let min_Level: number = 0;
                let max_Level: number = 100;
                if (pageItem.minValueLevel !== undefined && pageItem.maxValueLevel !== undefined) {
                    min_Level = pageItem.minValueLevel;
                    max_Level = pageItem.maxValueLevel;
                    val = Math.trunc(
                        scale(
                            getState(pageItem.id + '.ACTUAL').val,
                            pageItem.minValueLevel,
                            pageItem.maxValueLevel,
                            100,
                            0,
                        ),
                    );
                }

                const icon_up = Icons.GetIcon('arrow-up');
                const icon_stop = Icons.GetIcon('stop');
                const icon_down = Icons.GetIcon('arrow-down');

                if (Debug) log('pageItem.id: ' + getState(pageItem.id + '.ACTUAL').val, 'info');
                if (Debug) log('min_Level: ' + min_Level, 'info');
                if (Debug) log('max_Level: ' + max_Level, 'info');

                const icon_up_status = 'enable';
                const icon_down_status = 'enable';

                const tempVal: number = getState(pageItem.id + '.ACTUAL').val;

                //Disabled Status while bug in updating origin adapter data points of lift values
                //let icon_up_status = tempVal === min_Level ? 'disable' : 'enable';
                const icon_stop_status = 'enable';
                if (tempVal === min_Level || tempVal === max_Level || checkBlindActive === false) {
                    //icon_stop_status = 'disable';
                }
                //let icon_down_status = tempVal === max_Level ? 'disable' : 'enable';
                const value =
                    icon_up +
                    '|' +
                    icon_stop +
                    '|' +
                    icon_down +
                    '|' +
                    icon_up_status +
                    '|' +
                    icon_stop_status +
                    '|' +
                    icon_down_status;

                log(
                    'CreateEntity Icon role blind ~' +
                        type +
                        '~' +
                        placeId +
                        '~' +
                        iconId +
                        '~' +
                        iconColor +
                        '~' +
                        theName +
                        '~' +
                        value,
                    'info',
                );

                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + value;

            case 'gate':
                type = 'text';
                let gateState: string | undefined = undefined;
                if (existsState(pageItem.id + '.ACTUAL')) {
                    if (getState(pageItem.id + '.ACTUAL').val == 0 || getState(pageItem.id + '.ACTUAL').val === false) {
                        iconId = pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('garage');
                        iconColor = GetIconColor(pageItem, false, useColors);
                        gateState = findLocale('window', 'closed');
                    } else {
                        iconId =
                            pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('garage-open');
                        iconId =
                            pageItem.icon2 !== undefined ? Icons.GetIcon(pageItem.icon2) : Icons.GetIcon('garage-open');
                        iconColor = GetIconColor(pageItem, true, useColors);
                        gateState = findLocale('window', 'opened');
                    }
                }
                if (gateState == undefined) {
                    throw new Error(`Missing ${pageItem.id}.ACTUAL for type ${type}`);
                }

                if (Debug)
                    log(
                        'CreateEntity Icon role gate ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            gateState,
                        'info',
                    );
                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + gateState;

            case 'door':
            case 'window':
                type = 'text';
                let windowState;

                if (existsState(pageItem.id + '.ACTUAL')) {
                    if (getState(pageItem.id + '.ACTUAL').val) {
                        iconId =
                            pageItem.icon !== undefined
                                ? Icons.GetIcon(pageItem.icon)
                                : role == 'door'
                                  ? Icons.GetIcon('door-open')
                                  : Icons.GetIcon('window-open-variant');
                        iconColor = GetIconColor(pageItem, true, useColors);
                        windowState = findLocale('window', 'opened');
                    } else {
                        iconId =
                            pageItem.icon !== undefined
                                ? Icons.GetIcon(pageItem.icon)
                                : role == 'door'
                                  ? Icons.GetIcon('door-closed')
                                  : Icons.GetIcon('window-closed-variant');
                        iconId = pageItem.icon2 !== undefined ? Icons.GetIcon(pageItem.icon2) : iconId;
                        iconColor = GetIconColor(pageItem, false, useColors);
                        windowState = findLocale('window', 'closed');
                    }
                }

                if (Debug)
                    log(
                        'CreateEntity Icon role door/window ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            windowState,
                        'info',
                    );
                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + windowState;

            case 'motion':
                type = 'text';
                if (val === true) {
                    optVal = 'On';
                    iconColor = GetIconColor(pageItem, true, useColors);
                    iconId =
                        pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('motion-sensor');
                } else {
                    optVal = 'Off';
                    iconColor = GetIconColor(pageItem, false, useColors);
                    iconId =
                        pageItem.icon2 !== undefined ? Icons.GetIcon(pageItem.icon2) : Icons.GetIcon('motion-sensor');
                }

                if (Debug)
                    log(
                        'CreateEntity Icon role motion ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            optVal,
                        'info',
                    );
                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + optVal;

            case 'info':

            case 'humidity':

            case 'temperature':

            case 'value.temperature':

            case 'value.humidity':

            case 'sensor.door':

            case 'sensor.window':

            case 'thermostat':
                type = 'text';

                iconId =
                    pageItem.icon !== undefined
                        ? Icons.GetIcon(pageItem.icon)
                        : role == 'temperature' || role == 'value.temperature' || role == 'thermostat'
                          ? Icons.GetIcon('thermometer')
                          : Icons.GetIcon('information-outline');

                let unit = '';
                optVal = '0';

                if (existsState(pageItem.id + '.ON_ACTUAL')) {
                    optVal = getState(pageItem.id + '.ON_ACTUAL').val;
                    unit =
                        pageItem.unit !== undefined ? pageItem.unit : GetUnitOfMeasurement(pageItem.id + '.ON_ACTUAL');
                } else if (existsState(pageItem.id + '.ACTUAL')) {
                    optVal = getState(pageItem.id + '.ACTUAL').val;
                    unit = pageItem.unit !== undefined ? pageItem.unit : GetUnitOfMeasurement(pageItem.id + '.ACTUAL');
                }

                iconColor = GetIconColor(pageItem, parseInt(optVal), useColors);

                if (pageItem.colorScale != undefined) {
                    const iconvalmin = pageItem.colorScale.val_min != undefined ? pageItem.colorScale.val_min : 0;
                    const iconvalmax = pageItem.colorScale.val_max != undefined ? pageItem.colorScale.val_max : 100;
                    const iconvalbest =
                        pageItem.colorScale.val_best != undefined ? pageItem.colorScale.val_best : iconvalmin;
                    let valueScale = val;

                    if (iconvalmin == 0 && iconvalmax == 1) {
                        iconColor =
                            !pageItem.id || getState(pageItem.id).val == 1
                                ? rgb_dec565(colorScale0)
                                : rgb_dec565(colorScale10);
                    } else {
                        if (iconvalbest == iconvalmin) {
                            valueScale = scale(valueScale, iconvalmin, iconvalmax, 10, 0);
                        } else {
                            if (valueScale < iconvalbest) {
                                valueScale = scale(valueScale, iconvalmin, iconvalbest, 0, 10);
                            } else if (valueScale > iconvalbest || iconvalbest != iconvalmin) {
                                valueScale = scale(valueScale, iconvalbest, iconvalmax, 10, 0);
                            } else {
                                valueScale = scale(valueScale, iconvalmin, iconvalmax, 10, 0);
                            }
                        }
                        const valueScaletemp = Math.round(valueScale).toFixed();
                        iconColor = HandleColorScale(valueScaletemp);
                    }
                }

                if (existsState(pageItem.id + '.USERICON')) {
                    iconId = Icons.GetIcon(getState(pageItem.id + '.USERICON').val);
                    if (Debug)
                        log(
                            'iconid von ' + pageItem.id + '.USERICON: ' + getState(pageItem.id + '.USERICON').val,
                            'info',
                        );
                    RegisterEntityWatcher(pageItem.id + '.USERICON');
                }

                if (pageItem.useValue) {
                    if (pageItem.fontSize != undefined) {
                        iconId = optVal + '¬' + pageItem.fontSize;
                    } else {
                        iconId = optVal;
                    }
                }

                if (Debug)
                    log(
                        'CreateEntity Icon role info, humidity, temperature, value.temperature, value.humidity, sensor.door, sensor.window, thermostat',
                        'info',
                    );
                if (Debug)
                    log(
                        'CreateEntity  ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            optVal +
                            ' ' +
                            unit,
                        'info',
                    );
                return (
                    '~' +
                    type +
                    '~' +
                    placeId +
                    '~' +
                    iconId +
                    '~' +
                    iconColor +
                    '~' +
                    theName +
                    '~' +
                    optVal +
                    ' ' +
                    unit
                );

            case 'buttonSensor':
                type = 'input_sel';
                iconId =
                    pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('gesture-tap-button');
                iconColor = GetIconColor(pageItem, true, useColors);
                const inSelText = pageItem.buttonText !== undefined ? pageItem.buttonText : 'PRESS';

                if (Debug)
                    log(
                        'CreateEntity  Icon role buttonSensor ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            inSelText,
                        'info',
                    );
                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + inSelText;

            case 'button':
                type = 'button';

                iconId =
                    pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('gesture-tap-button');
                iconColor = GetIconColor(pageItem, true, useColors);
                if (val === false) {
                    iconColor = GetIconColor(pageItem, false, useColors);
                }

                const buttonText = pageItem.buttonText !== undefined ? pageItem.buttonText : 'PRESS';

                if (Debug)
                    log(
                        'CreateEntity  Icon role button ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            buttonText,
                        'info',
                    );
                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + buttonText;
            case 'value.time':
            case 'level.timer':
                type = 'timer';
                iconId =
                    pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('gesture-tap-button');
                iconColor = GetIconColor(pageItem, true, useColors);
                const timerText = pageItem.buttonText !== undefined ? pageItem.buttonText : 'PRESS';

                if (existsState(pageItem.id + '.STATE')) {
                    val = getState(pageItem.id + '.STATE').val;
                    RegisterEntityWatcher(pageItem.id + '.STATE');
                }

                if (Debug)
                    log(
                        'CreateEntity  Icon role level.timer ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            timerText,
                        'info',
                    );
                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + timerText;

            case 'value.alarmtime':
                type = 'timer';
                iconId = pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('timer-outline');
                const alarmtimerText = pageItem.buttonText !== undefined ? pageItem.buttonText : 'PRESS';

                if (existsState(pageItem.id + '.STATE')) {
                    val = getState(pageItem.id + '.STATE').val;
                    iconColor = val == 'paused' ? rgb_dec565(colorScale10) : rgb_dec565(colorScale0);
                }

                if (existsState(pageItem.id + '.ACTUAL')) {
                    const timer_actual = getState(pageItem.id + '.ACTUAL').val;
                    theName =
                        ('0' + String(Math.floor(timer_actual / 60))).slice(-2) +
                        ':' +
                        ('0' + String(timer_actual % 60)).slice(-2);
                }

                if (Debug)
                    log(
                        'CreateEntity  Icon role value.alarmtime ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            alarmtimerText +
                            ' ' +
                            val,
                        'info',
                    );
                return (
                    '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + alarmtimerText
                );

            case 'level.mode.fan':
                type = 'fan';
                iconId = pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('fan');
                optVal = '0';

                if (val === true || val === 'true') {
                    optVal = '1';
                    iconColor = GetIconColor(pageItem, true, useColors);
                } else {
                    iconColor = GetIconColor(pageItem, false, useColors);
                    if (pageItem.icon !== undefined) {
                        if (pageItem.icon2 !== undefined) {
                            iconId = iconId2;
                        }
                    }
                }

                if (Debug)
                    log(
                        'CreateEntity  Icon role level.mode.fan ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            optVal,
                        'info',
                    );
                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + optVal;

            case 'lock':
                type = 'button';
                iconId = pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('lock');
                iconColor = GetIconColor(pageItem, true, useColors);
                let lockState;

                if (existsState(pageItem.id + '.ACTUAL')) {
                    if (getState(pageItem.id + '.ACTUAL').val) {
                        iconId = pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('lock');
                        iconColor = GetIconColor(pageItem, true, useColors);
                        lockState = findLocale('lock', 'UNLOCK');
                    } else {
                        iconId =
                            pageItem.icon2 !== undefined
                                ? Icons.GetIcon(pageItem.icon2)
                                : Icons.GetIcon('lock-open-variant');
                        iconColor = GetIconColor(pageItem, false, useColors);
                        lockState = findLocale('lock', 'LOCK');
                    }
                    lockState = pageItem.buttonText !== undefined ? pageItem.buttonText : lockState;
                }

                if (Debug)
                    log(
                        'CreateEntity  Icon role lock ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            lockState,
                        'info',
                    );
                return '~' + type + '~' + placeId + '~' + iconId + '~' + iconColor + '~' + theName + '~' + lockState;

            case 'slider':
                type = 'number';
                iconId =
                    pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('plus-minus-variant');

                iconColor = GetIconColor(pageItem, false, useColors);

                if (Debug)
                    log(
                        'CreateEntity  Icon role slider ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            val +
                            '|' +
                            pageItem.minValue +
                            '|' +
                            pageItem.maxValue,
                        'info',
                    );
                return (
                    '~' +
                    type +
                    '~' +
                    placeId +
                    '~' +
                    iconId +
                    '~' +
                    iconColor +
                    '~' +
                    theName +
                    '~' +
                    val +
                    '|' +
                    pageItem.minValue +
                    '|' +
                    pageItem.maxValue
                );

            case 'volumeGroup':
            case 'volume':
                type = 'number';
                iconColor = GetIconColor(pageItem, false, useColors);
                if (existsState(pageItem.id + '.MUTE')) {
                    getState(pageItem.id + '.MUTE').val
                        ? (iconColor = GetIconColor(pageItem, false, useColors))
                        : (iconColor = GetIconColor(pageItem, true, useColors));
                    RegisterEntityWatcher(pageItem.id + '.MUTE');
                }

                if (val > 0 && val <= 33 && !getState(pageItem.id + '.MUTE').val) {
                    iconId = Icons.GetIcon('volume-low');
                } else if (val > 33 && val <= 66 && !getState(pageItem.id + '.MUTE').val) {
                    iconId = Icons.GetIcon('volume-medium');
                } else if (val > 66 && val <= 100 && !getState(pageItem.id + '.MUTE').val) {
                    iconId = Icons.GetIcon('volume-high');
                } else {
                    iconId = Icons.GetIcon('volume-mute');
                }

                if (Debug)
                    log(
                        'CreateEntity  Icon role volumeGroup/volume ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            theName +
                            '~' +
                            val +
                            '|' +
                            pageItem.minValue +
                            '|' +
                            pageItem.maxValue,
                        'info',
                    );
                return (
                    '~' +
                    type +
                    '~' +
                    placeId +
                    '~' +
                    iconId +
                    '~' +
                    iconColor +
                    '~' +
                    theName +
                    '~' +
                    val +
                    '|' +
                    pageItem.minValue +
                    '|' +
                    pageItem.maxValue
                );

            case 'warning':
                type = 'text';
                iconId = pageItem.icon !== undefined ? Icons.GetIcon(pageItem.icon) : Icons.GetIcon('alert-outline');
                iconColor = getState([pageItem.id, '.LEVEL'].join('')).val;
                const itemName = getState([pageItem.id, '.TITLE'].join('')).val;
                const itemInfo = getState([pageItem.id, '.INFO'].join('')).val;

                RegisterEntityWatcher(pageItem.id + '.LEVEL');
                RegisterEntityWatcher(pageItem.id + '.INFO');

                if (pageItem.useValue) {
                    iconId = itemInfo;
                }

                if (Debug)
                    log(
                        'CreateEntity  Icon role warning ~' +
                            type +
                            '~' +
                            placeId +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            itemName +
                            '~' +
                            itemInfo,
                        'info',
                    );
                return '~' + type + '~' + itemName + '~' + iconId + '~' + iconColor + '~' + itemName + '~' + itemInfo;

            case 'timeTable':
                type = 'text';
                const itemFahrzeug: string = getState(pageItem.id + '.VEHICLE').val;
                const itemUhrzeit: string = getState(pageItem.id + '.ACTUAL').val;
                const itemRichtung: string = getState(pageItem.id + '.DIRECTION').val;
                const itemVerspaetung: boolean = getState(pageItem.id + '.DELAY').val;

                if (Icons.GetIcon(itemFahrzeug) != '') {
                    iconId = Icons.GetIcon(itemFahrzeug);
                } else {
                    iconId = '';
                }

                iconColor = !itemVerspaetung ? rgb_dec565(colorScale0) : rgb_dec565(colorScale10);

                if (Debug)
                    log(
                        'CreateEntity  Icon role timeTable ~' +
                            type +
                            '~' +
                            itemRichtung +
                            '~' +
                            iconId +
                            '~' +
                            iconColor +
                            '~' +
                            itemRichtung +
                            '~' +
                            itemUhrzeit,
                        'info',
                    );
                return (
                    '~' +
                    type +
                    '~' +
                    itemRichtung +
                    '~' +
                    iconId +
                    '~' +
                    iconColor +
                    '~' +
                    itemRichtung +
                    '~' +
                    itemUhrzeit
                );

            default:
                if (Debug) log('CreateEntity Icon keine passende Rolle gefunden', 'warn');
                return '~delete~~~~~';
        }
    }
}*/
