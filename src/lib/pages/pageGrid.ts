import { rgb_dec565, colorScale0, colorScale10, GetIconColor, getDecfromRGBThree, hsvtodec } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { Page, PageInterface } from './Page';
import { PageItemDataitems, MessageItem } from '../types/pageItem';
import {
    getIconEntryColor,
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
                message.displayName = (await getValueEntryTextOnOff(item.data.text, true)) ?? message.displayName;
                return this.getItemMesssage(message);
                break;
            }
            /*case 'cd': {
                break;
            }*/
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
                message.displayName = (await getValueEntryTextOnOff(item.data.text, true)) ?? message.displayName;
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
                const value = await getValueEntryBoolean(item.data.entity);
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
                    message.displayName = (await getValueEntryTextOnOff(item.data.text, value)) ?? '';
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
                    message.optionalValue = (await getValueEntryTextOnOff(item.data.text, true)) ?? 'PRESS';
                    return this.getItemMesssage(message);
                } else {
                    this.log.error(`Missing set value for ${this.name}-${id} role:${item.role}`);
                }
                break;
            }
            case 'value.alarmtime': {
                const value =
                    (item.data.set && item.data.set.value1 && (await item.data.set.value1.getNumber())) ?? null;
                if (value !== null) {
                    message.type = 'timer';

                    // das ist im Grunde wie vorher nur das die Farbe in aus der Konfiguration benutzt wird, wenn vorhanden
                    message.iconColor =
                        ((await getValueEntryString(item.data.entityOptional)) ?? '') == 'paused'
                            ? await getIconEntryColor(item.data.icon, true, String(rgb_dec565(colorScale10)))
                            : await getIconEntryColor(item.data.icon, false, String(rgb_dec565(colorScale0)));
                    message.displayName = new Date(
                        ((await getValueEntryNumber(item.data.entity)) || 0) * 1000,
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
                const value = (await getValueEntryBoolean(item.data.entity)) ?? false;
                message.iconColor = await GetIconColor(item, value);
                message.icon = Icons.GetIcon(await getIconEntryValue(item.data.icon, value, 'fan'));
                message.optionalValue = value ? '1' : '0';
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
}
