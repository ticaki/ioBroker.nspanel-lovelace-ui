import { rgb_dec565, colorScale0, colorScale10, GetIconColor, hsvtodec, scale, White, Blue } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { Page, PageInterface } from './Page';
import { PageItemDataitems, MessageItem, entityUpdateDetailMessage } from '../types/type-pageItem';
import {
    getDecfromHue,
    getDecfromRGBThree,
    getIconEntryColor,
    getIconEntryValue,
    getTranslation,
    getValueEntryBoolean,
    getValueEntryNumber,
    getValueEntryString,
    getValueEntryTextOnOff,
} from '../const/tools';
import { PopupType } from '../types/types';
import { templatePageItems } from '../templates/TpageItem';

//light, shutter, delete, text, button, switch, number,input_sel, timer und fan types
export class PageGrid extends Page {
    defaultOnColor = White;
    defaultOffColor = Blue;
    constructor(config: PageInterface) {
        super({ ...config, card: 'cardItemSpecial' });
    }

    async getPageItem(item: PageItemDataitems, id: string): Promise<string> {
        const message: Partial<MessageItem> = {};
        message.displayName = (item.data.headline && (await item.data.headline.getString())) ?? '';
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
                const v =
                    (item.data.entity1 && item.data.entity1.value && (await item.data.entity1.value.getBoolean())) ??
                    true;

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
                message.displayName = (await getValueEntryTextOnOff(item.data.text, true)) ?? message.displayName;
                return this.getItemMesssage(message);
                break;
            }
            case 'blind': {
                message.type = 'shutter';

                const value = await getValueEntryNumber(item.data.entity1);
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
                message.displayName = (await getValueEntryTextOnOff(item.data.text, true)) ?? message.displayName;
                return this.getItemMesssage(message);
                break;
            }
            case 'gate':
            case 'door':
            case 'window': {
                message.type = 'text';

                let value = await getValueEntryBoolean(item.data.entity1);
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
                    message.displayName = (await getValueEntryTextOnOff(item.data.text, value)) ?? message.displayName;
                    message.icon = Icons.GetIcon(icon);
                    return this.getItemMesssage(message);
                } else {
                    this.log.error(`Missing data value for ${this.name}-${id} role:${item.role}`);
                }
                break;
            }
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
            }*/
            case 'motion': {
                message.type = 'text';
                const value = await getValueEntryBoolean(item.data.entity1);
                if (value !== null) {
                    message.iconColor = await GetIconColor(item, value ?? true ? true : false);
                    message.icon = Icons.GetIcon(await getIconEntryValue(item.data.icon, value, 'motion-sensor'));
                    message.optionalValue = getTranslation(this.library, value ? 'on' : 'off');
                    message.displayName = (await getValueEntryTextOnOff(item.data.text, value)) ?? message.displayName;
                    return this.getItemMesssage(message);
                } else {
                    this.log.error(`Missing data value for ${this.name}-${id} role:${item.role}`);
                }
                break;
            }

            case 'buttonSensor':
            case 'button': {
                let value = (item.data.setValue1 && (await item.data.setValue1.getBoolean())) ?? null;
                if (value === null && item.role === 'buttonSensor') value = true;
                if (value !== null) {
                    message.type = item.role === 'buttonSensor' ? 'input_sel' : 'button';
                    message.iconColor = await GetIconColor(item, value);
                    message.icon = Icons.GetIcon(await getIconEntryValue(item.data.icon, value, 'gesture-tap-button'));
                    message.displayName = (await getValueEntryTextOnOff(item.data.text, value)) ?? '';
                    message.optionalValue = (await getValueEntryString(item.data.entity1)) ?? 'PRESS';
                    return this.getItemMesssage(message);
                } else {
                    this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
                }
                break;
            }
            case 'value.time':
            case 'level.timer': {
                const value = (item.data.setValue1 && (await item.data.setValue1.getNumber())) ?? null;
                if (value !== null) {
                    message.type = 'timer';
                    message.iconColor = await GetIconColor(item, value);
                    message.icon = Icons.GetIcon(await getIconEntryValue(item.data.icon, true, 'gesture-tap-button'));
                    message.optionalValue = (await getValueEntryTextOnOff(item.data.text, true)) ?? 'PRESS';
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
                        ((await getValueEntryString(item.data.entity2)) ?? '') == 'paused'
                            ? await getIconEntryColor(item.data.icon, true, String(rgb_dec565(colorScale10)))
                            : await getIconEntryColor(item.data.icon, false, String(rgb_dec565(colorScale0)));
                    message.displayName = new Date(
                        ((await getValueEntryNumber(item.data.entity1)) || 0) * 1000,
                    ).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    message.icon = Icons.GetIcon(await getIconEntryValue(item.data.icon, true, 'timer-outline'));
                    message.optionalValue = (await getValueEntryTextOnOff(item.data.text, true)) ?? 'PRESS';
                    return this.getItemMesssage(message);
                } else {
                    this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
                }
                break;
            }

            case 'level.mode.fan': {
                message.type = 'fan';
                const value = (await getValueEntryBoolean(item.data.entity1)) ?? false;
                message.iconColor = await GetIconColor(item, value);
                message.icon = Icons.GetIcon(await getIconEntryValue(item.data.icon, value, 'fan'));
                message.optionalValue = value ? '1' : '0';
                return this.getItemMesssage(message);
                break;
            }
            case 'media.repeat': {
                message.type = 'button';
                const value: number | boolean | null =
                    item.data.entity1 && item.data.entity1.value && item.data.entity1.value.type === 'number'
                        ? await getValueEntryNumber(item.data.entity1)
                        : await getValueEntryBoolean(item.data.entity1);
                if (value !== null) {
                    message.iconColor = await GetIconColor(item, !!value);
                    if (value === 2) {
                        message.icon = 'repeat-once';
                    } else {
                        message.icon = Icons.GetIcon(
                            await getIconEntryValue(item.data.icon, !!value, 'repeat-variant', 'repeat-off'),
                        );

                        message.optionalValue = !!value ? '1' : '0';
                        return this.getItemMesssage(message);
                    }
                }
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

        return '~delete~~~~~';
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
                return this.getPayload(
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
        }
        return '';
    }
    async GenerateDetailPage(mode: PopupType, item: PageItemDataitems, id: string): Promise<MessageItem | null> {
        const message: Partial<entityUpdateDetailMessage> = {};
        const template = templatePageItems[item.role];
        message.entityName = id;
        /*const o = getObject(id);
        let val: (boolean | number) = 0;
        let icon = Icons.GetIcon('lightbulb');
        let iconColor = rgb_dec565(config.defaultColor);
        const role = o.common.role as NSPanel.roles;*/
        if (mode == 'popupLight') {
            switch (item.role) {
                case 'light':
                case 'socket':
                case 'dimmer':
                case 'hue':
                case 'ct':
                case 'rgbSingle':
                case 'rgb': {
                    message.type = '2Sliders';
                    if (template.type !== message.type) return null;
                    message.buttonState =
                        (template.buttonState ? await getValueEntryBoolean(item.data.entity1) : null) ?? 'disable';
                    const dimmer = item.data.dimmer && (await item.data.dimmer.getNumber());
                    if (dimmer != null && template.slider1Pos) {
                        if (item.data.minValue1 != undefined && item.data.maxValue1) {
                            message.slider1Pos = Math.trunc(
                                scale(
                                    dimmer,
                                    await item.data.minValue1.getNumber(),
                                    await item.data.maxValue1.getNumber(),
                                    100,
                                    0,
                                ),
                            );
                        } else {
                            message.slider1Pos = dimmer;
                        }
                    }

                    message.slidersColor = template.slidersColor
                        ? String(rgb_dec565(template.slidersColor))
                        : (await getIconEntryColor(item.data.icon, false, White)) ?? 'disable';
                    let rgb;
                    switch (item.role) {
                        case 'socket':
                        case 'light':
                        case 'dimmer':
                        case 'ct':
                            break;
                        case 'hue':
                            rgb = rgb ?? (await getDecfromHue(item)) ?? null;
                            break;
                        case 'rgbSingle':
                        case 'rgb':
                            rgb = await getDecfromRGBThree(item);
                            break;
                    }
                    if (rgb !== null && template.hueMode) {
                        message.hueMode = true;
                        message.slidersColor = rgb;
                    }

                    message.slider2Pos = 'disable';

                    let ct = template.slider2Pos ? await getValueEntryNumber(item.data.entity2) : null;
                    if (ct != null && template.slider2Pos !== false) {
                        const max =
                            (item.data.maxValue2 && (await item.data.maxValue2.getNumber())) ?? template.slider2Pos;
                        ct = ct > max ? max : ct < 0 ? 0 : ct;
                        if (item.data.minValue2 !== undefined) {
                            const min = (await item.data.minValue2.getNumber()) ?? 0;
                            message.slider2Pos = Math.trunc(scale(ct < min ? min : ct, min, max, 100, 0));
                        } else {
                            message.slider2Pos = Math.trunc(scale(ct, 0, max, 100, 0));
                        }
                    }

                    if (
                        (template.popup && item.data.modeList && (await item.data.modeList.getString())) ??
                        null !== null
                    ) {
                        message.popup = true;
                    }
                    message.slider1Translation =
                        template.slider1Translation !== false
                            ? (item.data.modeList && (await item.data.modeList.getString())) ??
                              template.slider1Translation
                            : '';
                    message.slider2Translation =
                        template.slider2Translation !== false
                            ? (item.data.modeList && (await item.data.modeList.getString())) ??
                              template.slider2Translation
                            : '';
                    message.hue_translation =
                        template.hue_translation !== false
                            ? (item.data.modeList && (await item.data.modeList.getString())) ?? template.hue_translation
                            : '';

                    break;
                }
                // RGB-Licht-einzeln (HEX)

                /*} else if (mode == 'popupShutter') {
            icon = item.data.icon !== undefined ? Icons.GetIcon(item.data.icon) : Icons.GetIcon('window-open');
            if (existsState(id + '.ACTUAL')) {
                val = getState(id + '.ACTUAL').val;
                RegisterDetailEntityWatcher(id + '.ACTUAL', item.data, type, placeId);
            } else if (existsState(id + '.SET')) {
                val = getState(id + '.SET').val;
                //RegisterDetailEntityWatcher(id + '.SET', item.data, type);
            }
            let tilt_position: any = 'disabled';
            if (existsState(id + '.TILT_ACTUAL')) {
                tilt_position = getState(id + '.TILT_ACTUAL').val;
                RegisterDetailEntityWatcher(id + '.TILT_ACTUAL', item.data, type, placeId);
            } else if (existsState(id + '.TILT_SET')) {
                tilt_position = getState(id + '.TILT_SET').val;
                //RegisterDetailEntityWatcher(id + '.TILT_SET', item.data, type);
            }

            let min_Level: number = 0;
            let max_Level: number = 100;
            if (item.data.minValueLevel !== undefined && item.data.maxValueLevel !== undefined) {
                min_Level = item.data.minValueLevel;
                max_Level = item.data.maxValueLevel;
                val = Math.trunc(
                    scale(getState(id + '.ACTUAL').val, item.data.minValueLevel, item.data.maxValueLevel, 100, 0),
                );
            }
            let min_Tilt: number = 0;
            let max_Tilt: number = 100;
            if (item.data.minValueTilt !== undefined && item.data.maxValueTilt !== undefined) {
                min_Tilt = item.data.minValueTilt;
                max_Tilt = item.data.maxValueTilt;
                tilt_position = Math.trunc(
                    scale(getState(id + '.TILT_ACTUAL').val, item.data.minValueTilt, item.data.maxValueTilt, 100, 0),
                );
            }

            if (Debug) log('minLevel ' + min_Level + ' maxLevel ' + max_Level + ' Level ' + val, 'info');
            if (Debug) log('minTilt ' + min_Tilt + ' maxTilt ' + max_Tilt + ' TiltPosition ' + tilt_position, 'info');

            let textSecondRow = '';
            const icon_id = icon;
            const icon_up = Icons.GetIcon('arrow-up');
            const icon_stop = Icons.GetIcon('stop');
            const icon_down = Icons.GetIcon('arrow-down');
            const tempVal: number = getState(item.data.id + '.ACTUAL').val;

            //Disabled Status while bug in updating origin adapter data points of lift values
            const icon_up_status = 'enable';
            //let icon_up_status = tempVal === min_Level ? 'disable' : 'enable';
            const icon_stop_status = 'enable';
            if (tempVal === min_Level || tempVal === max_Level || checkBlindActive === false) {
                //icon_stop_status = 'disable';
            }
            const icon_down_status = 'enable';
            //let icon_down_status = tempVal === max_Level ? 'disable' : 'enable';

            let textTilt = '';
            let iconTiltLeft = '';
            let iconTiltStop = '';
            let iconTiltRight = '';
            let iconTiltLeftStatus = 'disable';
            let iconTiltStopStatus = 'disable';
            let iconTiltRightStatus = 'disable';
            let tilt_pos = 'disable';

            if (existsState(id + '.TILT_SET')) {
                textTilt = findLocale('blinds', 'Tilt');
                iconTiltLeft = Icons.GetIcon('arrow-top-right');
                iconTiltStop = Icons.GetIcon('stop');
                iconTiltRight = Icons.GetIcon('arrow-bottom-left');
                iconTiltLeftStatus = getState(id + '.TILT_ACTUAL').val != max_Tilt ? 'enable' : 'disable';
                iconTiltStopStatus = 'enable';
                iconTiltRightStatus = getState(id + '.TILT_ACTUAL').val != min_Tilt ? 'enable' : 'disable';
                tilt_pos = tilt_position;
            }

            if (item.data.secondRow != undefined) {
                textSecondRow = item.data.secondRow;
            }

            const tempId = placeId != undefined ? placeId : id;

            /*entityUpdateDetail~entityName~*sliderPos*~2ndrow~textPosition~icon1~iconUp~iconStop~iconDown
            ~iconUpStatus~iconStopStatus~iconDownStatus~textTilt~iconTiltLeft
            ~iconTiltStop~iconTiltRight~iconTiltLeftStatus~iconTiltStopStatus~iconTiltLeftStatus~tiltPo
            out_msgs.push({
                payload:
                    'entityUpdateDetail' +
                    '~' + //entityUpdateDetail
                    tempId +
                    '~' + //entity_id
                    val +
                    '~' + //Shutterposition
                    textSecondRow +
                    '~' + //pos_status 2.line
                    findLocale('blinds', 'Position') +
                    '~' + //pos_translation
                    icon_id +
                    '~' + //{icon_id}~
                    icon_up +
                    '~' + //{icon_up}~
                    icon_stop +
                    '~' + //{icon_stop}~
                    icon_down +
                    '~' + //{icon_down}~
                    icon_up_status +
                    '~' + //{icon_up_status}~
                    icon_stop_status +
                    '~' + //{icon_stop_status}~
                    icon_down_status +
                    '~' + //{icon_down_status}~
                    textTilt +
                    '~' + //{textTilt}~
                    iconTiltLeft +
                    '~' + //{iconTiltLeft}~
                    iconTiltStop +
                    '~' + //{iconTiltStop}~
                    iconTiltRight +
                    '~' + //{iconTiltRight}~
                    iconTiltLeftStatus +
                    '~' + //{iconTiltLeftStatus}~
                    iconTiltStopStatus +
                    '~' + //{iconTiltStopStatus}~
                    iconTiltRightStatus +
                    '~' + //{iconTiltRightStatus}~
                    tilt_pos, //{tilt_pos}")
            });
        }

        /*if (type == 'popupThermo') {
            let vIcon = item.data.icon != undefined ? item.data.icon : 'fan';
            let mode1 =
                isPageThermoItem(item.data) && item.data.popupThermoMode1 != undefined
                    ? item.data.popupThermoMode1.join('?')
                    : '';
            let mode2 =
                isPageThermoItem(item.data) && item.data.popupThermoMode2 != undefined
                    ? item.data.popupThermoMode2.join('?')
                    : '';
            let mode3 =
                isPageThermoItem(item.data) && item.data.popupThermoMode3 != undefined
                    ? item.data.popupThermoMode3.join('?')
                    : '';

            let payloadParameters1 = '~~~~';
            if (isPageThermoItem(item.data) && item.data.popupThermoMode1 != undefined) {
                RegisterDetailEntityWatcher(
                    item.data.id + '.' + item.data.setThermoAlias![0],
                    item.data,
                    type,
                    placeId,
                );
                payloadParameters1 =
                    item.data.popUpThermoName![0] +
                    '~' + //{heading}~            Mode 1
                    'modus1' +
                    '~' + //{id}~                 Mode 1
                    getState(item.data.id + '.' + item.data.setThermoAlias![0]).val +
                    '~' + //{ACTUAL}~             Mode 1
                    mode1 +
                    '~'; //{possible values}     Mode 1 (1-n)
            }

            let payloadParameters2 = '~~~~';
            if (isPageThermoItem(item.data) && item.data.popupThermoMode2 != undefined) {
                RegisterDetailEntityWatcher(
                    item.data.id + '.' + item.data.setThermoAlias![1],
                    item.data,
                    type,
                    placeId,
                );
                payloadParameters2 =
                    item.data.popUpThermoName![1] +
                    '~' + //{heading}~            Mode 2
                    'modus2' +
                    '~' + //{id}~                 Mode 2
                    getState(item.data.id + '.' + item.data.setThermoAlias![1]).val +
                    '~' + //{ACTUAL}~             Mode 2
                    mode2 +
                    '~'; //{possible values}
            }

            let payloadParameters3 = '~~~~';
            if (isPageThermoItem(item.data) && item.data.popupThermoMode3 != undefined) {
                RegisterDetailEntityWatcher(
                    item.data.id + '.' + item.data.setThermoAlias![2],
                    item.data,
                    type,
                    placeId,
                );
                payloadParameters3 =
                    item.data.popUpThermoName![2] +
                    '~' + //{heading}~            Mode 3
                    'modus3' +
                    '~' + //{id}~                 Mode 3
                    getState(item.data.id + '.' + item.data.setThermoAlias![2]).val +
                    '~' + //{ACTUAL}~             Mode 3
                    mode3; //{possible values}     Mode 3 (1-n)
            }

            out_msgs.push({
                payload:
                    'entityUpdateDetail' +
                    '~' + //entityUpdateDetail
                    id +
                    '~' + //{entity_id}
                    Icons.GetIcon(vIcon) +
                    '~' + //{icon_id}~
                    11487 +
                    '~' + //{icon_color}~
                    payloadParameters1 +
                    payloadParameters2 +
                    payloadParameters3,
            });
        }

        if (type == 'popupTimer') {
            let timer_actual: number = 0;

            if (existsState(id + '.ACTUAL')) {
                RegisterDetailEntityWatcher(id + '.ACTUAL', item.data, type, placeId);
                timer_actual = getState(id + '.ACTUAL').val;
            }

            if (existsState(id + '.STATE')) {
                RegisterDetailEntityWatcher(id + '.STATE', item.data, type, placeId);
            }

            let editable = 1;
            let action1 = '';
            let action2 = '';
            let action3 = '';
            let label1 = '';
            let label2 = '';
            let label3 = '';
            let min_remaining = 0;
            let sec_remaining = 0;
            if (existsState(id + '.STATE')) {
                if (role == 'value.time') {
                    if (getState(id + '.STATE').val == 'idle' || getState(id + '.STATE').val == 'paused') {
                        min_remaining = Math.floor(timer_actual / 60);
                        sec_remaining = timer_actual % 60;
                        editable = 1;
                    } else {
                        min_remaining = Math.floor(timer_actual / 60);
                        sec_remaining = timer_actual % 60;
                        editable = 1;
                    }
                } else if (role == 'level.timer') {
                    if (getState(id + '.STATE').val == 'idle' || getState(id + '.STATE').val == 'paused') {
                        min_remaining = Math.floor(timer_actual / 60);
                        sec_remaining = timer_actual % 60;
                        editable = 1;
                        action2 = 'start';
                        label2 = findLocale('timer', 'start');
                    } else {
                        min_remaining = Math.floor(timer_actual / 60);
                        sec_remaining = timer_actual % 60;
                        editable = 0;
                        action1 = 'pause';
                        action2 = 'cancle';
                        action3 = 'finish';
                        label1 = findLocale('timer', 'pause');
                        label2 = findLocale('timer', 'cancel');
                        label3 = findLocale('timer', 'finish');
                    }
                } else if (role == 'value.alarmtime') {
                    if (getState(id + '.STATE').val == 'paused') {
                        min_remaining = Math.floor(timer_actual / 60);
                        sec_remaining = timer_actual % 60;
                        editable = 1;
                        action2 = 'start';
                        label2 = findLocale('timer', 'on');
                    } else {
                        min_remaining = Math.floor(timer_actual / 60);
                        sec_remaining = timer_actual % 60;
                        editable = 0;
                        action2 = 'pause';
                        label2 = findLocale('timer', 'off');
                    }
                }

                const tempId = placeId != undefined ? placeId : id;

                out_msgs.push({
                    payload:
                        'entityUpdateDetail' +
                        '~' + //entityUpdateDetail
                        tempId +
                        '~~' + //{entity_id}
                        rgb_dec565(White) +
                        '~' + //{icon_color}~
                        tempId +
                        '~' +
                        min_remaining +
                        '~' +
                        sec_remaining +
                        '~' +
                        editable +
                        '~' +
                        action1 +
                        '~' +
                        action2 +
                        '~' +
                        action3 +
                        '~' +
                        label1 +
                        '~' +
                        label2 +
                        '~' +
                        label3,
                }

        }

            if (type == 'popupFan') {

                let switchVal = '0';
                if (role == 'level.mode.fan') {
                    if (existsState(id + '.SET')) {
                        val = getState(id + '.SET').val;
                        RegisterDetailEntityWatcher(id + '.SET', item.data, type, placeId);
                    }
                    if (existsState(id + '.MODE')) {
                        RegisterDetailEntityWatcher(id + '.MODE', item.data, type, placeId);
                    }

                    icon = item.data.icon !== undefined ? Icons.GetIcon(item.data.icon) : 'fan';

                    if (val) {
                        switchVal = '1';
                        iconColor = GetIconColor(item.data, true, true);
                    } else {
                        iconColor = GetIconColor(item.data, false, true);
                    }

                    const actualSpeed = getState(id + '.SPEED').val;
                    let maxSpeed = item.data.maxValue != undefined ? item.data.maxValue : 100;

                    let modeList = item.data.modeList!.join('?');
                    const actualMode = item.data.modeList![getState(id + '.MODE').val];

                    let tempId = placeId != undefined ? placeId : id;
                    // {tempid | icon | iconColor | switchVal | actualSpeed | maxSpeed: | findLocale | actualMode | modeList}
                    out_msgs.push({
                        payload:
                            'entityUpdateDetail' +
                            '~' + // entityUpdateDetail
                            tempId +
                            '~' +
                            icon +
                            '~' + // iconId
                            iconColor +
                            '~' + // iconColor
                            switchVal +
                            '~' + // buttonState
                            actualSpeed +
                            '~' +
                            maxSpeed +
                            '~' +
                            findLocale('fan', 'speed') +
                            '~' +
                            actualMode +
                            '~' +
                            modeList,
                    });
                }
            }

            if (type == 'popupInSel') {
                if (role == 'media') {
                    let actualState: any = '';
                    let optionalString: string = 'Kein Eintrag';
                    let mode: NSPanel.mediaOptional | '' = '';
                    if (isPageMediaItem(item.data)) {
                        const vTempAdapter = item.data.adapterPlayerInstance!.split('.');
                        const vAdapter: NSPanel.PlayerType = vTempAdapter[0] as NSPanel.PlayerType;
                        if (optional == 'seek') {
                            const actualStateTemp: number = getState(
                                item.data.adapterPlayerInstance + 'root.' + item.data.mediaDevice + '.seek',
                            ).val;
                            actualState = Math.round(actualStateTemp / 10) * 10 + '%';
                            if (vAdapter == 'sonos') {
                                optionalString = '0%?10%?20%?30%?40%?50%?60%?70%?80%?90%?100%';
                            }
                            mode = 'seek';
                        } else if (optional == 'crossfade') {
                            if (
                                existsObject(
                                    item.data.adapterPlayerInstance + 'root.' + item.data.mediaDevice + '.crossfade',
                                )
                            ) {
                                let actualStateTemp: boolean = getState(
                                    item.data.adapterPlayerInstance + 'root.' + item.data.mediaDevice + '.crossfade',
                                ).val;
                                if (actualStateTemp) {
                                    actualState = findLocale('media', 'on');
                                } else {
                                    actualState = findLocale('media', 'off');
                                }
                            }
                            if (vAdapter == 'sonos') {
                                optionalString = findLocale('media', 'on') + '?' + findLocale('media', 'off');
                            }
                            mode = 'crossfade';
                        } else if (optional == 'speakerlist') {
                            if (vAdapter == 'spotify-premium') {
                                if (existsObject(item.data.adapterPlayerInstance + 'player.device.name')) {
                                    actualState = formatInSelText(
                                        getState(item.data.adapterPlayerInstance + 'player.device.name').val,
                                    );
                                }
                            } else if (vAdapter == 'alexa2') {
                                if (existsObject(item.data.adapterPlayerInstance + 'player.device.name')) {
                                    //Todo Richtiges Device finden
                                    actualState = formatInSelText(
                                        getState(
                                            item.data.adapterPlayerInstance +
                                            'Echo-Devices.' +
                                            item.data.mediaDevice +
                                            '.Info.name',
                                        ).val,
                                    );
                                }
                            } else if (vAdapter == 'bosesoundtouch') {
                                if (existsObject(item.data.adapterPlayerInstance + 'deviceInfo.name')) {
                                    actualState = formatInSelText(
                                        getState(item.data.adapterPlayerInstance + 'deviceInfo.name').val,
                                    );
                                }
                            } else if (vAdapter == 'squeezeboxrpc') {
                                actualState = item.data.mediaDevice;
                            }
                            let tempSpeakerList: string[] = [];
                            for (let i = 0; i < item.data.speakerList!.length; i++) {
                                tempSpeakerList[i] = formatInSelText(item.data.speakerList![i]).trim();
                            }
                            optionalString = item.data.speakerList != undefined ? tempSpeakerList.join('?') : '';
                            mode = 'speakerlist';
                        } else if (optional == 'playlist') {
                            if (vAdapter == 'spotify-premium') {
                                if (existsObject(item.data.adapterPlayerInstance + 'player.playlist.name')) {
                                    actualState = formatInSelText(
                                        getState(item.data.adapterPlayerInstance + 'player.playlist.name').val,
                                    );
                                }
                                let tempPlayList: string[] = [];
                                for (let i = 0; i < item.data.playList!.length; i++) {
                                    tempPlayList[i] = formatInSelText(item.data.playList![i]);
                                }
                                optionalString = item.data.playList != undefined ? tempPlayList.join('?') : '';
                            } else if (vAdapter == 'alexa2') {
                                //Todo Richtiges Device finden
                                actualState = formatInSelText(
                                    getState(
                                        item.data.adapterPlayerInstance +
                                        'Echo-Devices.' +
                                        item.data.mediaDevice +
                                        '.Player.currentAlbum',
                                    ).val,

                                    const tPlayList: any = []
                                for (let i = 0; i < item.data.playList!.length; i++) {
                                    if (Debug)
                                        log(
                                            'function GenerateDetailPage role:media -> Playlist ' + item.data.playList![i],
                                            'info',
                                        );
                                    const tempItem = item.data.playList![i].split('.');
                                    tPlayList[i] = tempItem[1];
                                }

                                let tempPlayList: string[] = [];
                                for (let i = 0; i < tPlayList.length; i++) {
                                    tempPlayList[i] = formatInSelText(tPlayList[i]);
                                }
                                optionalString = item.data.playList != undefined ? tempPlayList.join('?') : '';
                            } else if (vAdapter == 'bosesoundtouch') {
                                if (existsObject(item.data.adapterPlayerInstance + 'deviceInfo.name')) {
                                    actualState = formatInSelText(
                                        getState(item.data.adapterPlayerInstance + 'deviceInfo.name').val,
                                    );
                                }
                                const tempPlayList: string[] = [];
                                let vPreset: string = 'No Entry';
                                for (let i = 1; i < 7; i++) {
                                    if (
                                        getState(item.data.adapterPlayerInstance + 'presets.' + i + '.source').val !== null
                                    ) {
                                        vPreset = getState(
                                            item.data.adapterPlayerInstance + 'presets.' + i + '.source',
                                        ).val;
                                    } else {
                                        vPreset = 'Preset ' + i.toFixed;
                                    }
                                    tempPlayList[i - 1] = formatInSelText(vPreset.replace('_', ' '));
                                    if (Debug) log(formatInSelText(vPreset.replace('_', ' ')));
                                }
                                tempPlayList[6] = 'AUX INPUT';
                                optionalString = item.data.playList != undefined ? tempPlayList.join('?') : '';
                            } else if (vAdapter == 'sonos') {
                                if (Debug)
                                    log(
                                        item.data.adapterPlayerInstance + 'root.' + item.data.mediaDevice + '.playlist_set',
                                        'info',
                                    );
                                if (
                                    existsObject(
                                        item.data.adapterPlayerInstance + 'root.' + item.data.mediaDevice + '.playlist_set',
                                    )
                                ) {
                                    actualState = formatInSelText(
                                        getState(
                                            item.data.adapterPlayerInstance +
                                            'root.' +
                                            item.data.mediaDevice +
                                            '.playlist_set',
                                        ).val,
                                    );
                                }
                                const tempPlayList: string[] = [];
                                for (let i = 0; i < item.data.playList!.length; i++) {
                                    tempPlayList[i] = formatInSelText(item.data.playList![i]);
                                }
                                optionalString = item.data.playList != undefined ? tempPlayList.join('?') : '';
                            } else if (vAdapter == 'volumio') {
                                // Volumio: limit 900 chars
                                actualState = ''; //todo: no actual playlistname saving
                                let tempPlayList: string[] = [];
                                let tempPll = 0;
                                for (let i = 0; i < item.data.playList!.length; i++) {
                                    tempPll += item.data.playList![i].length;
                                    if (tempPll > 900) break;
                                    tempPlayList[i] = formatInSelText(item.data.playList![i]);
                                }
                                optionalString = item.data.playList != undefined ? tempPlayList.join('?') : '';
                            } else if (vAdapter == 'squeezeboxrpc') {
                                // Playlist browsing not supported by squeezeboxrpc adapter. But Favorites can be used
                                actualState = ''; // Not supported by squeezeboxrpc adapter
                                let tempPlayList: string[] = [];
                                const pathParts: string[] = item.data.adapterPlayerInstance!.split('.');
                                for (let favorite_index = 0; favorite_index < 45; favorite_index++) {
                                    let favorite_name_selector: string = [
                                        pathParts[0],
                                        pathParts[1],
                                        'Favorites',
                                        favorite_index,
                                        'Name',
                                    ].join('.');
                                    if (!existsObject(favorite_name_selector)) {
                                        break;
                                    }
                                    const favoritename: string = getState(favorite_name_selector).val;
                                    tempPlayList.push(formatInSelText(favoritename));
                                }
                                optionalString = tempPlayList.length > 0 ? tempPlayList.join('?') : '';
                            }
                            mode = 'playlist';
                        } else if (optional == 'tracklist') {
                            actualState = '';
                            // Volumio: works for files
                            if (vAdapter == 'volumio') {
                                actualState = getState(item.data.id + '.TITLE').val;
                                globalTracklist = item.data.globalTracklist;
                            } else if (vAdapter == 'squeezeboxrpc') {
                                actualState = getState(item.data.id + '.TITLE').val;
                            } else if (vAdapter == 'sonos') {
                                actualState = getState(item.data.id + '.TITLE').val;
                            } else {
                                actualState = getState(item.data.adapterPlayerInstance + 'player.trackName').val;
                            }
                            actualState = actualState.replace('?', '').split(' -');
                            actualState = actualState[0].split(' (');
                            actualState = formatInSelText(actualState[0]);
                            if (Debug) log(actualState, 'info');
                            if (Debug) log(globalTracklist, 'info');
                            //Limit 900 characters, then memory overflow --> Shorten as much as possible
                            let temp_array: any[] = [];
                            //let trackArray = (function () { try {return JSON.parse(getState(item.data.adapterPlayerInstance + 'player.playlist.trackListArray').val);} catch(e) {return {};}})();
                            for (let track_index = 0; track_index < 45; track_index++) {
                                let temp_cut_array = getAttr(globalTracklist, track_index + '.title');
                                // Volumio: @local/NAS no title -> theName
                                if (temp_cut_array == undefined) {
                                    temp_cut_array = getAttr(globalTracklist, track_index + '.name');
                                }
                                if (Debug)
                                    log('function GenerateDetailPage role:media tracklist -> ' + temp_cut_array, 'info');
                                if (temp_cut_array != undefined) {
                                    temp_cut_array = temp_cut_array.replace('?', '').split(' -');
                                    temp_cut_array = temp_cut_array[0].split(' (');
                                    temp_cut_array = temp_cut_array[0];
                                    if (String(temp_cut_array[0]).length >= 22) {
                                        temp_array[track_index] = temp_cut_array.substring(0, 20) + '..';
                                    } else {
                                        temp_array[track_index] = temp_cut_array.substring(0, 23);
                                    }
                                } else {
                                    break;
                                }
                            }
                            const tempTrackList: string[] = [];
                            for (let i = 0; i < temp_array.length; i++) {
                                tempTrackList[i] = formatInSelText(temp_array[i]);
                            }
                            optionalString = item.data.playList != undefined ? tempTrackList.join('?') : '';
                            mode = 'tracklist';
                        } else if (optional == 'equalizer') {
                            if (item.data.id == undefined) throw new Error('Missing item.data.id in equalizer!');
                            let lastIndex = item.data.id.split('.').pop();

                            if (existsObject(NSPanel_Path + 'Media.Player.' + lastIndex + '.EQ.activeMode') == false ||
                                existsObject(NSPanel_Path + 'Media.Player.' + lastIndex + '.Speaker') == false
                            ) {
                                createState(NSPanel_Path + 'Media.Player.' + lastIndex + '.EQ.activeMode', <
                                    iobJS.StateCommon
                                    > {type: 'string', write: false});
                                createState(NSPanel_Path + 'Media.Player.' + lastIndex + '.Speaker', <iobJS.StateCommon> {
                                    type: 'string',
                                    write: false,
                                });
                            }

                            actualState = '';
                            if (getState(NSPanel_Path + 'Media.Player.' + lastIndex + '.EQ.activeMode').val != null) {
                                actualState = formatInSelText(
                                    getState(NSPanel_Path + 'Media.Player.' + lastIndex + '.EQ.activeMode').val,
                                );
                            }

                            let tempEQList: string[] = [];
                            for (let i = 0; i < item.data.equalizerList!.length; i++) {
                                tempEQList[i] = formatInSelText(item.data!.equalizerList![i]);
                            }

                            optionalString = item.data.equalizerList != undefined ? tempEQList.join('?') : '';
                            mode = 'equalizer';
                        } else if (optional == 'repeat') {
                            actualState = getState(item.data.adapterPlayerInstance + 'player.repeat').val;
                            optionalString = item.data.repeatList!.join('?');
                            mode = 'repeat';
                        } else if (optional == 'favorites') {
                            if (Debug)
                                log(
                                    getState(
                                        item.data.adapterPlayerInstance +
                                        'root.' +
                                        item.data.mediaDevice +
                                        '.favorites_set',
                                    ).val,
                                    'info',
                                );
                            actualState = formatInSelText(
                                getState(
                                    item.data.adapterPlayerInstance + 'root.' + item.data.mediaDevice + '.favorites_set',
                                ).val,

                                const tempFavList: string[] = [];
                            let favList = getState(
                                item.data.adapterPlayerInstance + 'root.' + item.data.mediaDevice + '.favorites_list_array',
                            ).val;
                            for (let i = 0; i < favList.length; i++) {
                                tempFavList[i] = formatInSelText(favList[i]);
                            }
                            optionalString = tempFavList != undefined ? tempFavList.join('?') : '';
                            mode = 'favorites';
                        }

                        const tempId = placeId != undefined ? placeId : id;
                        // {tempid | color | NSPanel.mediaOptional | actualState | optionalString}
                        out_msgs.push({
                            payload:
                                'entityUpdateDetail2' +
                                '~' + //entityUpdateDetail
                                tempId +
                                '?' +
                                optional +
                                '~~' + //{entity_id}
                                rgb_dec565(HMIOn) +
                                '~' + //{icon_color}~
                                mode +
                                '~' +
                                actualState +
                                '~' +
                                optionalString,
                        });
                        GeneratePage(activePage!);
                    }
                } else if (role == 'buttonSensor') {

                    let actualValue: string = '';

                    if (item.data.inSel_ChoiceState || item.data.inSel_ChoiceState == undefined) {
                        if (existsObject(item.data.id + '.VALUE')) {
                            actualValue = formatInSelText(item.data.modeList![getState(item.data.id + '.VALUE').val]);
                            RegisterDetailEntityWatcher(id + '.VALUE', item.data, type, placeId);
                        }
                    }

                    let tempModeList: string[] = [];
                    for (let i = 0; i < item.data.modeList!.length; i++) {
                        tempModeList[i] = formatInSelText(item.data.modeList![i]);
                    }
                    let valueList = item.data.modeList != undefined ? tempModeList.join('?') : '';

                    let tempId = placeId != undefined ? placeId : id;
                    // {tempid | color | NSPanel.mediaOptional | actualValue | valueList}
                    out_msgs.push({
                        payload:
                            'entityUpdateDetail2' +
                            '~' + //entityUpdateDetail2
                            tempId +
                            '~~' + //{entity_id}
                            rgb_dec565(White) +
                            '~' + //{icon_color}~
                            'insel' +
                            '~' +
                            actualValue +
                            '~' +
                            valueList,
                    });
                } else if (
                    role == 'light' ||
                    role == 'dimmer' ||
                    role == 'hue' ||
                    role == 'rgb' ||
                    role == 'rgbSingle' ||
                    role == 'ct'

                //log(item.data.id, 'info');
                if (item.data.modeList != undefined) {

                        let actualValue: string = '';

                        if (item.data.inSel_ChoiceState || item.data.inSel_ChoiceState == undefined) {
                            if (existsObject(item.data.id + '.VALUE')) {
                                actualValue = formatInSelText(item.data.modeList[getState(item.data.id + '.VALUE').val]);
                                RegisterDetailEntityWatcher(id + '.VALUE', item.data, type, placeId);
                            }
                        }

                        const tempModeList: string[] = [];
                        for (let i = 0; i < item.data.modeList.length; i++) {
                            tempModeList[i] = formatInSelText(item.data.modeList[i]);
                        }
                        const valueList = item.data.modeList != undefined ? tempModeList.join('?') : '';

                        //log(valueList);
                        const tempId = placeId != undefined ? placeId : id;
                        // {tempid | color | 'insel' | actualValue | valueList}
                        out_msgs.push({
                            payload:
                                'entityUpdateDetail2' +
                                '~' + //entityUpdateDetail2
                                tempId +
                                '~~' + //{entity_id}
                                rgb_dec565(White) +
                                '~' + //{icon_color}~
                                'insel' +
                                '~' +
                                actualValue +
                                '~' +
                                valueList,
                        });
                    }
            }*/
            }
        }
        if (template.type !== message.type) {
            throw new Error(`Template ${template.type} is not ${message.type} for role: ${item.role}`);
        }
        this.getDetailPayload(message);

        return null;
    }

    async delete(): Promise<void> {
        super.delete();
    }
}
