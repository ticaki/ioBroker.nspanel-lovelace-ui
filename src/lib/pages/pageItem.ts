import {
    rgb_dec565,
    colorScale0,
    colorScale10,
    GetIconColor,
    hsvtodec,
    scale,
    White,
    Blue,
    HMIOn,
    HMIOff,
} from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { Page, PageInterface } from './Page';
import {
    PageItemDataitems,
    MessageItem,
    entityUpdateDetailMessage,
    PageTypeUnionTemplate,
} from '../types/type-pageItem';
import {
    formatInSelText,
    getDecfromHue,
    getDecfromRGBThree,
    getEntryColor,
    getIconEntryColor,
    getIconEntryValue,
    getTranslation,
    getValueEntryBoolean,
    getValueEntryNumber,
    getValueEntryString,
    getEntryTextOnOff,
} from '../const/tools';
import { PopupType } from '../types/types';
import { templatePageElements, templatePageItems } from '../templates/TpageItem';

//light, shutter, delete, text, button, switch, number,input_sel, timer und fan types
export class PageItem extends Page {
    defaultOnColor = White;
    defaultOffColor = Blue;
    constructor(config: PageInterface) {
        super({ ...config, card: 'cardItemSpecial' });
    }

    async getPageItemPayload(item: PageItemDataitems, id: string): Promise<string> {
        const message: Partial<MessageItem> = {};
        const template = templatePageElements[item.type];
        message.displayName = (item.data.headline && (await item.data.headline.getString())) ?? '';
        message.intNameEntity = id + '?' + item.role;
        switch (item.type) {
            case 'light': {
                message.type = 'light';
                const t =
                    'item.role' in template &&
                    (template[item.role as keyof typeof template] as PageTypeUnionTemplate | undefined);
                if (!t) break;
                const dimmer = t.data.dimmer ? item.data.dimmer && (await item.data.dimmer.getNumber()) : null;
                const rgb = t.data.RGB3
                    ? (await getDecfromRGBThree(item)) ?? (await getEntryColor(item.data.color, true, White))
                    : null;
                const hue = t.data.hue && item.data.hue ? hsvtodec(await item.data.hue.getNumber(), 1, 1) : null;
                const v =
                    (t.data.entity1 &&
                        item.data.entity1 &&
                        item.data.entity1.value &&
                        (await item.data.entity1.value.getBoolean())) ||
                    true;

                message.icon = t.data.icon
                    ? await getIconEntryValue(item.data.icon, v, t.data.icon.true.value, t.data.icon.false.value)
                    : '';
                if (v) {
                    message.optionalValue = '1';
                    message.iconColor = hue ?? rgb ?? (await GetIconColor(item, dimmer ?? 100));
                } else {
                    message.optionalValue = '0';
                    message.iconColor = await GetIconColor(item, false);
                }
                message.displayName = t.data.text1
                    ? (await getEntryTextOnOff(item.data.text, v)) ?? v
                        ? t.data.text1.true
                        : t.data.text1.false
                    : message.displayName;
                return this.getItemMesssage(message);
                break;
            }
            case 'shutter': {
                message.type = 'shutter';
                const t =
                    'item.role' in template &&
                    (template[item.role as keyof typeof template] as PageTypeUnionTemplate | undefined);
                if (!t) break;
                const value = await getValueEntryNumber(item.data.entity1);
                if (value === null) break;
                message.icon = await getIconEntryValue(item.data.icon, value < 5, 'window-open');
                message.icon = t.data.icon
                    ? await getIconEntryValue(
                          item.data.icon,
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
                          : [
                                Icons.GetIcon(t.data.optionalData[0]),
                                Icons.GetIcon(t.data.optionalData[1]),
                                Icons.GetIcon(t.data.optionalData[2]),
                                t.data.optionalData[3],
                                t.data.optionalData[4],
                                t.data.optionalData[5],
                            ];

                message.optionalValue = optionalValue.join('|');
                message.displayName = (await getEntryTextOnOff(item.data.text, true)) ?? message.displayName;
                return this.getItemMesssage(message);
                break;
            }
            case 'text': {
                message.type = 'text';
                const t =
                    'item.role' in template &&
                    (template[item.role as keyof typeof template] as PageTypeUnionTemplate | undefined);
                if (!t) break;
                let value = t.data.entity1 ? await getValueEntryBoolean(item.data.entity1) : null;
                if (value !== null) {
                    // gate works revese true is closed -> invert value
                    if (t.data.entity1 === 'invert') value = !value;
                    let icon = '';
                    message.iconColor = await GetIconColor(item, value ?? true ? true : false);

                    icon = t.data.icon
                        ? await getIconEntryValue(
                              item.data.icon,
                              value,
                              t.data.icon.true.value,
                              t.data.icon.false.value,
                          )
                        : '';
                    message.optionalValue = this.library.getTranslation(
                        (await getEntryTextOnOff(item.data.text, value)) ?? '',
                    );

                    message.displayName = (await getEntryTextOnOff(item.data.text, value)) ?? message.displayName;
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
                    message.icon = await getIconEntryValue(item.data.icon, value, 'motion-sensor');
                    message.optionalValue = getTranslation(this.library, value ? 'on' : 'off');
                    message.displayName = (await getEntryTextOnOff(item.data.text, value)) ?? message.displayName;
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
                    message.icon = await getIconEntryValue(item.data.icon, value, 'gesture-tap-button');
                    message.displayName = (await getEntryTextOnOff(item.data.text, value)) ?? '';
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
                    message.icon = await getIconEntryValue(item.data.icon, true, 'gesture-tap-button');
                    message.optionalValue = (await getEntryTextOnOff(item.data.text, true)) ?? 'PRESS';
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
                    message.icon = await getIconEntryValue(item.data.icon, true, 'timer-outline');
                    message.optionalValue = (await getEntryTextOnOff(item.data.text, true)) ?? 'PRESS';
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
                message.icon = await getIconEntryValue(item.data.icon, value, 'fan');
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
                        message.icon = await getIconEntryValue(item.data.icon, !!value, 'repeat-variant', 'repeat-off');

                        message.optionalValue = !!value ? '1' : '0';
                        return this.getItemMesssage(message);
                    }
                }
                break;
            }
            case 'text.list': {
                message.type = 'input_sel';
                const value: boolean | null =
                    (item.data.entity1 && item.data.entity1.value && (await getValueEntryBoolean(item.data.entity1))) ??
                    null;
                message.iconColor = await getIconEntryColor(item.data.icon, value, HMIOn, HMIOff);
                message.icon = await getIconEntryValue(
                    item.data.icon,
                    value,
                    'clipboard-list',
                    'clipboard-list-outline',
                );
                message.displayName = (await getEntryTextOnOff(item.data.text, value)) ?? '';
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
            case 'insel': {
                let result: entityUpdateDetailMessage = {
                    type: 'insel',
                    entityName: '',
                    textColor: String(rgb_dec565(White)),
                    headline: '',
                    list: '',
                };
                result = Object.assign(result, message);
                return this.getPayload(
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
    async GenerateDetailPage(mode: PopupType, item: PageItemDataitems, id: string): Promise<MessageItem | null> {
        const message: Partial<entityUpdateDetailMessage> = {};
        const template = templatePageItems[mode][item.role];
        message.entityName = id;
        /*const o = getObject(id);
        let val: (boolean | number) = 0;
        let icon = Icons.GetIcon('lightbulb');
        let iconColor = rgb_dec565(config.defaultColor);
        const role = o.common.role as NSPanel.roles;*/
        switch (mode) {
            case 'popupLight': {
                switch (item.role) {
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
                                ? (item.data.modeList && (await item.data.modeList.getString())) ??
                                  template.hue_translation
                                : '';

                        break;
                    }
                }
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
            throw new Error(`Template ${template.type} is not ${message.type} for role: ${item.role}`);
        }
        this.getDetailPayload(message);

        return null;
    }

    async delete(): Promise<void> {
        super.delete();
    }
}
