import {
    rgb_dec565,
    scale,
    colorScale0,
    colorScale10,
    HandleColorScale,
    GetIconColor,
    getRGBfromThree,
    hsv2rgb,
    getDecfromRGBThree,
    hsvtodec,
} from '../const/Color';
import { Debug } from '../const/definition';
import { Icons } from '../const/icon_mapping';
import { roles, isEventMethod } from '../types/types';
import { Page, PageInterface, PageItem } from './Page';
import { ChangeTypeOfKeys } from '../types/pages';
import { Dataitem } from '../classes/data-item';
import { KeyObject } from 'crypto';
import { config } from 'chai';
import { log } from 'console';
import { RGB } from '../types/Color';
import { PageItemDataitems, MessageItem, PageItemUnion } from '../types/pageItem';
import {
    getIconEntryValue,
    getTranslation,
    getValueEntryBoolean,
    getValueEntryNumber,
    getValueEntryString,
    getValueEntryTextOnOff,
} from '../const/tools';

//light, shutter, delete, text, button, switch, number,input_sel, timer und fan types
export class PageGrid extends Page {
    constructor(config: PageInterface) {
        super({ ...config, card: 'cardGrid' });
    }

    async getPageItem(item: PageItemDataitems, id: string): Promise<string> {
        const message: Partial<MessageItem> = {};
        message.intNameEntity = id + '?' + item.role;
        switch (item.role) {
            case 'light':
            case 'dimmer':
            case 'socket':
            case 'cie':
            case 'rgb':
            case 'ct':
            case 'hue':
            case 'rgbSingle': {
                message.type = 'light';

                const dimmer = item.data.dimmer && (await item.data.dimmer.getNumber());
                const rgb =
                    item.role == 'rgb'
                        ? await getDecfromRGBThree(item)
                        : item.data.color && (await item.data.color.getRGBDec());
                const hue =
                    item.role == 'hue' && item.data.hue ? hsvtodec(await item.data.hue.getNumber(), 1, 1) : null;
                const v = item.data.entity.value ? await item.data.entity.value.getBoolean() : true;

                switch (item.role) {
                    case 'socket': {
                        message.icon = Icons.GetIcon('power-socket-de');
                        break;
                    }
                    default: {
                        message.icon = Icons.GetIcon('lightbulb');
                        break;
                    }
                }
                if (v) {
                    message.optionalValue = '1';
                    message.iconColor = hue ?? rgb ?? (await GetIconColor(item, dimmer ?? 100));
                    const i = item.data.icon.true.value ? await item.data.icon.true.value.getString() : null;
                    if (i !== null) message.icon = i;
                } else {
                    message.optionalValue = '0';
                    message.iconColor = await GetIconColor(item, false);
                    const i = item.data.icon.false.value ? await item.data.icon.false.value.getString() : null;
                    if (i !== null) message.icon = i;
                }
                message.dislayName = (item.data.text.true && (await item.data.text.true.getString())) ?? '';

                return this.getItemMesssage(message);
                break;
            }
            case 'cd': {
                break;
            }
            case 'blind': {
                message.type = 'shutter';

                const value = await getValueEntryNumber(item.data.entity);
                /*const min = (item.data.minValue && (await item.data.minValue.getNumber())) ?? null;
                const max = (item.data.maxValue && (await item.data.maxValue.getNumber())) ?? null;
                */
                message.icon = Icons.GetIcon(
                    (item.data.icon.true.value && (await item.data.icon.true.value.getString())) ?? 'window-open',
                );
                message.iconColor = await GetIconColor(item, value !== null ? value : true);
                //const dimmer = item.data.dimmer && (await item.data.dimmer.getNumber());
                /*let val = value;
                if (min !== null && max !== null && val !== null) {
                    val = Math.trunc(scale(val, min, max, 100, 0));
                }*/
                message.optionalValue = [
                    Icons.GetIcon('arrow-up'), //up
                    Icons.GetIcon('stop'), //stop
                    Icons.GetIcon('arrow-down'), //down
                    'enable', // up status
                    'enable', // stop status
                    'enable', // down status
                ].join('|');
                message.dislayName = (await getValueEntryTextOnOff(item.data.text, true)) ?? '';

                return this.getItemMesssage(message);
                break;
            }
            case 'gate':
            case 'door':
            case 'window': {
                message.type = 'text';

                let value = await getValueEntryBoolean(item.data.entity);
                if (value !== null) {
                    // gate works revese true is closed -> invert value
                    if (item.role === 'gate') value = !value;
                    let icon = '';
                    message.iconColor = await GetIconColor(item, value ?? true ? true : false);
                    if (value) {
                        icon =
                            (item.data.icon.true.value && (await item.data.icon.true.value.getString())) ??
                            (item.role === 'door'
                                ? 'door-open'
                                : item.role === 'window'
                                  ? 'window-open-variant'
                                  : 'garage-open');
                        message.optionalValue = getTranslation(this.library, 'window', 'opened');
                    } else {
                        icon =
                            (item.data.icon.false.value && (await item.data.icon.false.value.getString())) ??
                            (item.role === 'door'
                                ? 'door-closed'
                                : item.role === 'window'
                                  ? 'window-closed-variant'
                                  : 'garage');
                        message.optionalValue = getTranslation(this.library, 'window', 'closed');
                    }
                    message.dislayName = (await getValueEntryTextOnOff(item.data.text, value)) ?? '';
                    message.icon = Icons.GetIcon(icon);
                    return this.getItemMesssage(message);
                } else {
                    this.log.error(`Missing data value for ${this.name}-${id} role:${item.role}`);
                }
                break;
            }
            case 'volumeGroup': {
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
                const value = await getValueEntryBoolean(item.data.entity);
                if (value !== null) {
                    item.data.message.iconColor = await GetIconColor(item, value ?? true ? true : false);
                    message.icon = Icons.GetIcon(await getIconEntryValue(item.data.icon, value, 'motion-sensor'));
                    message.optionalValue = getTranslation(this.library, value ? 'on' : 'off');
                    message.dislayName = (await getValueEntryTextOnOff(item.data.text, value)) ?? '';
                    return this.getItemMesssage(message);
                } else {
                    this.log.error(`Missing data value for ${this.name}-${id} role:${item.role}`);
                }
                break;
            }

            case 'buttonSensor':
            case 'switch': // ein button ist nicht true oder false sondern etwas das man drücken kann und ab dann ist es undefiniert.
            // veraltet
            case 'button': {
                let value =
                    (item.data.set && item.data.set.value1 && (await item.data.set.value1.getBoolean())) ?? null;
                if (value === null && item.role === 'buttonSensor') value = true;
                if (value !== null) {
                    message.type = item.role === 'buttonSensor' ? 'input_sel' : 'button';
                    message.iconColor = await GetIconColor(item, value);
                    message.icon = Icons.GetIcon(await getIconEntryValue(item.data.icon, value, 'gesture-tap-button'));
                    message.dislayName = (await getValueEntryTextOnOff(item.data.text, value)) ?? '';
                    message.optionalValue = (await getValueEntryString(item.data.entity)) ?? 'PRESS';
                    return this.getItemMesssage(message);
                } else {
                    this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
                }
                break;
            }
            case 'value.time':
            case 'level.timer': {
                const value =
                    (item.data.set && item.data.set.value1 && (await item.data.set.value1.getNumber())) ?? null;
                if (value !== null) {
                    message.type = 'timer';
                    message.iconColor = await GetIconColor(item, value);
                    message.icon = Icons.GetIcon(await getIconEntryValue(item.data.icon, true, 'gesture-tap-button'));
                    message.dislayName = (await getValueEntryTextOnOff(item.data.text, true)) ?? '';
                    message.optionalValue = (await getValueEntryString(item.data.entity)) ?? 'PRESS';
                    return this.getItemMesssage(message);
                } else {
                    this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
                }
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
        return '~delete~~~~~';
    }
    bla(role: roles): string {
        let type: string = '',
            iconId = '';
        const test: Partial<MessageItem> = {};
        switch (role) {
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
}
