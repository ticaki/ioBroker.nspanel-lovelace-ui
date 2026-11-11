import { Color, type RGB } from '../const/Color';
import type { Page } from '../classes/Page';
import type { PageInterface, PageItemInterface } from '../classes/PageInterface';
import * as typePageItem from '../types/type-pageItem';
import * as tools from '../const/tools';
import type { nsPanelState, PopupType } from '../types/types';
import { Icons } from '../const/icon_mapping';
import { SHUTTER_POSITION_ICON } from '../const/page-item-defaults';
import { cycleValueToState, nextCycleIndex } from '../const/screensaver-cycle';
import { isDataItem, type Dataitem } from '../controller/data-item';
import { type ChangeTypeOfKeys, type DeviceRole, type PageBase } from '../types/pages';
import { isCardEntitiesType, isCardGridType } from '../types/function-and-const';
import type { Screensaver } from './screensaver';
import { BaseTriggeredPage } from '../classes/baseClassPage';
import type { PageMedia } from './pageMedia';
import type { NSPanel } from '../types/NSPanel';
import {
    alarmClockOf,
    isCountdownCommon,
    nextAlarmTs,
    parseTimerInput,
    timerClockText,
    timerPopupButtons,
    timerPopupFields,
    timerSecondsOf,
    timerValueOf,
    type ClockTimerAccess,
    type TimerCountdownView,
    type TimerPopupButtons,
} from './screensaver-timer';

/** panels that were told once that their screensaver has no timer for a page item */
const panelsWarnedAboutClockTimer = new WeakSet<object>();

//light, shutter, delete, text, button, switch, number,input_sel, timer und fan types
export class PageItem extends BaseTriggeredPage {
    defaultOnColor = Color.White;
    defaultOffColor = Color.Blue;
    config: NSPanel.PageItemDataItemsOptionsWithOutTemplate | undefined;
    dataItems: NSPanel.PageItemDataItems | undefined;
    id: string;
    lastPopupType: PopupType | undefined = undefined;
    readonly parent: Page;
    tempData: any = undefined; // use this to save some data while object is active
    confirmClick: number | 'lock' | 'unlock' = 'lock';
    timeouts: Record<string, ioBroker.Timeout | undefined> = {};

    // for select - force next read of common
    private updateCommon: { lastRequest: number; counts: number } = { lastRequest: 0, counts: 0 };
    /** the screensaver this item listens to (`useScreensaverTimer`) */
    private clockTimerSaver: Screensaver | undefined;
    /** index of the value a button with a value list wrote last, see {@link writeNextCycleValue} */
    private cycleLastIndex: number | undefined;
    /** the screensaver uses this item as the source of its timer */
    private clockSourceListeners: Set<() => void> = new Set();

    constructor(
        config: Omit<PageItemInterface, 'pageItemsConfig' | 'parent'> & { parent: Page },
        options: NSPanel.PageItemDataItemsOptionsWithOutTemplate | undefined,
    ) {
        super({
            name: config.name,
            adapter: config.adapter,
            panel: config.panel,
            dpInit: config.dpInit,
        });
        this.id = config.id;
        this.config = options;
        if (!config || !config.parent) {
            throw new Error(`PageItem ${this.id} has no parent page`);
        }
        this.parent = config && config.parent;
        this.name = `${this.parent.name}.${this.id}`;
        this.sleep = false;
        this.enums = options && 'enums' in options && options.enums ? options.enums : '';
    }

    static async getPageItem(
        config: Omit<PageItemInterface, 'pageItemsConfig'>,
        options: NSPanel.PageItemDataItemsOptions | undefined,
    ): Promise<PageItem | undefined> {
        if (options === undefined) {
            return undefined;
        }
        if (config.panel.persistentPageItems[config.id]) {
            return config.panel.persistentPageItems[config.id];
        }
        const p = new PageItem(config, options as NSPanel.PageItemDataItemsOptionsWithOutTemplate);
        await p.init();
        return p;
    }

    async init(): Promise<void> {
        if (!this.config) {
            return;
        }
        const config = structuredClone(this.config);

        const tempItem: NSPanel.PageItemDataItems['data'] =
            (await this.parent.basePanel.statesControler.createDataItems(
                config.data,
                this,
                {},
                'data',
                config.readOptions,
            )) as NSPanel.PageItemDataItems['data'];
        this.dataItems = { ...config, data: tempItem } as NSPanel.PageItemDataItems;
        this.canBeHidden = !!this.dataItems.data?.enabled;
        if (this.dataItems.data && 'enabled' in this.dataItems.data && this.dataItems.data.enabled) {
            this.canBeHidden = true;
        }
        switch (this.dataItems.type) {
            case 'number':
            case 'button':
            case 'switch':
            case 'shutter2':
            case 'empty':
            case 'input_sel':
            case 'light':
            case 'light2':
            case 'text':
            case 'fan': {
                break;
            }

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
                            (await this.parent.basePanel.statesControler.getObjectAsync(list[a].id));
                        if (test && test.common && test.common.write) {
                            this.tempData[a] = true;
                        }
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

            case 'timer': {
                if (this.dataItems.role === 'timer' && this.tempData === undefined) {
                    if (this.dataItems.useScreensaverTimer) {
                        this.tempData = { role: 'ss-timer', editSeconds: 0 };
                        break;
                    }
                    const actualCommon = this.dataItems.data.entity1?.value?.common;
                    if (actualCommon?.role) {
                        // a date stays a clock time; any other role is a duration as soon as its unit says so
                        if (actualCommon.role !== 'date' && isCountdownCommon(actualCommon)) {
                            this.tempData = { status: 'pause', role: 'ex-timer' };
                            break;
                        }

                        this.tempData = { status: 'pause', role: 'ex-alarm' };
                        break;
                    }
                    this.tempData = { status: 'stop', value: 0, role: 'timer' };
                    if (!this.parent.basePanel.persistentPageItems[this.id]) {
                        this.parent.basePanel.persistentPageItems[this.id] = this;
                    }
                }
                break;
            }
        }
        if (
            ['screensaver', 'screensaver2', 'screensaver3', 'screensaver5', 'popupNotify', 'popupNotify2'].indexOf(
                this.parent.card,
            ) !== -1
        ) {
            if (!this.parent.basePanel.persistentPageItems[this.id]) {
                if (this.config.modeScr) {
                    switch (this.config.modeScr) {
                        case 'left':
                        case 'bottom':
                        case 'indicator':
                        case 'alternate':
                        case 'favorit':
                            break;
                        case 'mricon':
                            break;
                        case 'time':
                        case 'date':
                            this.neverDeactivateTrigger = true;
                            break;
                    }
                }

                this.parent.basePanel.persistentPageItems[this.id] = this;
                await this.controller.statesControler.activateTrigger(this);
            }
        }
        // search for alexa devices
        if (this.config.role === 'alexa-speaker') {
            const id = (this.parent as PageMedia).items[0].ident ?? '';
            const arr = id.split('.').slice(0, 3);
            const str = arr.join('.');
            const devices =
                str && arr.length === 3
                    ? await this.adapter.getObjectViewAsync('system', 'device', {
                          startkey: `${str}.`,
                          endkey: `${str}${String.fromCharCode(0xff_fd)}`,
                      })
                    : { rows: [] };
            this.tempData = [];
            if (devices && devices.rows && devices.rows.length > 0) {
                if (this.dataItems && this.dataItems.type === 'input_sel') {
                    const data = this.dataItems.data;
                    let filter = ((await data?.valueList?.getObject()) as string[] | null) || null;
                    filter = Array.isArray(filter) && filter.length > 0 ? filter : null;
                    for (const instance of devices.rows) {
                        if (instance && instance.value && instance.id && instance.id.split('.').length === 4) {
                            if (await this.adapter.getForeignObjectAsync(`${instance.id}.Player`)) {
                                const name =
                                    typeof instance.value.common.name === 'object'
                                        ? instance.value.common.name.en
                                        : instance.value.common.name;
                                if (!filter || filter.includes(name)) {
                                    this.log.debug(`Alexa device: ${name} deviceId: ${instance.id}`);
                                    this.tempData.push({
                                        id: instance.id,
                                        name: name,
                                    });
                                }
                            }
                        }
                    }
                }
                this.log.debug(`Alexa devices found: ${this.tempData.length} frosm ${devices.rows.length}`);
            }
        } else if (
            this.config.role === 'alexa-playlist' &&
            this.dataItems &&
            this.dataItems.type === 'input_sel' &&
            this.parent.card === 'cardMedia'
        ) {
            const states = await this.adapter.getForeignStatesAsync(
                `${(this.parent as PageMedia).currentItem ? (this.parent as PageMedia).currentItem!.ident : (this.parent as PageMedia).items[0].ident}.Music-Provider.*`,
            );
            if (states) {
                this.tempData = Object.keys(states);
            }
        }
    }

    async getPageItemPayload(skipEnabledCheck: boolean = false): Promise<string> {
        await this.controller.statesControler.activateTrigger(this);
        this.lastPopupType = undefined;
        if (this.dataItems && this.config) {
            this.visibility = false;
            this.triggerParent = true;
            const entry = this.dataItems;
            const message: Partial<NSPanel.MessageItem> = {};
            message.intNameEntity = this.id;
            if (!skipEnabledCheck && !(await this.isEnabled())) {
                return '';
            }
            switch (entry.type) {
                case 'light':
                case 'light2': {
                    const item = entry.data;
                    if (this.config.role === 'volume.mute') {
                        message.type = 'light';
                    } else {
                        message.type =
                            isCardGridType(this.parent.card) &&
                            (this.config.role === 'light' || this.config.role === 'socket')
                                ? 'switch'
                                : this.parent.basePanel.overrideLightPopup
                                  ? this.parent.basePanel.lightPopupV2 && this.parent.basePanel.meetsVersion('4.7.5')
                                      ? 'light2'
                                      : 'light'
                                  : entry.type;
                    }
                    const v = await tools.getValueEntryBoolean(item.entity1);
                    const dimmer = (item.dimmer && item.dimmer.value && (await item.dimmer.value.getNumber())) ?? null;
                    if (this.config.role === 'volume.mute') {
                        message.icon = await tools.getIconEntryValue(item.icon, !!v, 'volume-high');
                        message.optionalValue = v ? '1' : '0';
                        message.iconColor = await tools.getIconEntryColor(item.icon, !!v, Color.on, Color.off);
                    } else {
                        let rgb: RGB | null =
                            (await tools.getRGBfromRGBThree(item)) ??
                            (item.color && item.color.true && (await item.color.true.getRGBValue())) ??
                            null;
                        const nhue = (item.hue && (await item.hue.getNumber())) ?? null;
                        if (rgb === null && nhue) {
                            rgb = Color.hsv2RGB(nhue, 1, 1) ?? null;
                        }
                        message.icon = await tools.getIconEntryValue(item.icon, v, '', '');
                        let colorMode: 'ct' | 'hue' | 'none' = !item.colorMode
                            ? 'none'
                            : (await item.colorMode.getBoolean())
                              ? 'hue'
                              : 'ct';

                        if (colorMode === 'none') {
                            const ctState = item.ct && item.ct.value && (await item.ct.value.getState());
                            const colorState =
                                (item.Red && (await item.Red.getState())) ??
                                (item.Green && (await item.Green.getState())) ??
                                (item.Blue && (await item.Blue.getState())) ??
                                (item.color && item.color.true && (await item.color.true.getState())) ??
                                (item.hue && (await item.hue.getState())) ??
                                null;
                            if (ctState && colorState) {
                                if (ctState.ts > colorState.ts) {
                                    colorMode = 'ct';
                                } else {
                                    colorMode = 'hue';
                                }
                            } else if (ctState) {
                                colorMode = 'ct';
                            } else if (colorState) {
                                colorMode = 'hue';
                            }
                        }

                        const iconColor =
                            dimmer != null
                                ? item.icon?.true?.color
                                    ? await item.icon.true.color.getRGBValue()
                                    : Color.Yellow
                                : null;
                        message.iconColor =
                            (colorMode === 'hue'
                                ? await tools.GetIconColor(
                                      rgb ?? undefined,
                                      dimmer != null ? (dimmer > 30 ? dimmer : 30) : v,
                                  )
                                : await tools.getTemperaturColorFromValue(item.ct, dimmer ?? 100)) ??
                            (iconColor
                                ? await tools.GetIconColor(iconColor, dimmer != null ? (dimmer > 30 ? dimmer : 30) : v)
                                : await tools.getIconEntryColor(item.icon, dimmer ?? v, Color.Yellow)) ??
                            '';
                        if (v) {
                            message.optionalValue = '1';
                        } else {
                            message.optionalValue = '0';
                        }
                    }
                    message.displayName = this.library.getTranslation(
                        (await tools.getEntryTextOnOff(item.headline, v)) ?? message.displayName ?? '',
                    );
                    return tools.getItemMesssage(message);
                    break;
                }
                case 'shutter': {
                    const item = entry.data;

                    message.type = 'shutter';

                    let value: boolean | number | null = await tools.getValueEntryNumber(item.entity1);
                    if (value === null) {
                        value = await tools.getValueEntryBoolean(item.entity1);
                    } else {
                        value = !this.adapter.config.shutterClosedIsZero ? 100 - value : value;
                    }
                    if (value === null) {
                        this.log.warn(`Entity ${this.config.role} has no value! No Actual or Set`);
                        break;
                    }
                    message.icon = await tools.getIconEntryValue(item.icon, value, 'window-open');
                    message.iconColor = await tools.getIconEntryColor(item.icon, value, Color.White);
                    const optionalValue = item.valueList
                        ? await item.valueList.getObject()
                        : [
                              'arrow-up', //up
                              'stop', //stop
                              'arrow-down', //down
                          ];
                    let optionalValueC =
                        Array.isArray(optionalValue) && optionalValue.every(a => typeof a === 'string')
                            ? [...optionalValue]
                            : ['', '', ''];
                    optionalValueC = optionalValueC.splice(0, 3).map(a => (a ? Icons.GetIcon(a) : a));
                    optionalValueC.forEach((a, i) => {
                        if (a) {
                            optionalValueC[i + 3] = this.tempData[i] ? 'enable' : 'disable';
                        } else {
                            optionalValueC[i] = '';
                            optionalValueC[i + 3] = 'disable';
                        }
                    });

                    optionalValueC[3] = value === 100 ? 'disable' : optionalValueC[3];
                    optionalValueC[5] = value === 0 ? 'disable' : optionalValueC[5];
                    message.optionalValue = optionalValueC.join('|');
                    message.displayName = this.library.getTranslation(
                        (await tools.getEntryTextOnOff(item.headline, !!value)) ?? message.displayName ?? '',
                    );
                    return tools.getItemMesssage(message);
                }
                case 'shutter2': {
                    const item = entry.data;

                    message.type = 'shutter2';

                    let value: boolean | number | null = await tools.getValueEntryNumber(item.entity1);
                    if (value === null) {
                        value = await tools.getValueEntryBoolean(item.entity1);
                    } else {
                        value = !this.adapter.config.shutterClosedIsZero ? 100 - value : value;
                    }
                    if (value === null) {
                        this.log.warn(`Entity ${this.config.role} has no value! No Actual or Set`);
                        break;
                    }
                    message.icon = await tools.getIconEntryValue(item.icon, value, 'window-open');
                    message.iconColor = await tools.getIconEntryColor(item.icon, value, Color.White);
                    const optionalValue = [
                        item?.up ? 'arrow-up' : '', //up
                        item?.stop ? 'stop' : '', //stop
                        item?.down ? 'arrow-down' : '', //down
                    ];
                    let optionalValueC =
                        Array.isArray(optionalValue) && optionalValue.every(a => typeof a === 'string')
                            ? [...optionalValue]
                            : ['', '', ''];
                    optionalValueC = optionalValueC.splice(0, 3).map(a => (a ? Icons.GetIcon(a) : a));
                    optionalValueC.forEach((a, i) => {
                        if (a) {
                            optionalValueC[i + 3] = optionalValueC[i] ? 'enable' : 'disable';
                        } else {
                            optionalValueC[i] = '';
                            optionalValueC[i + 3] = 'disable';
                        }
                    });

                    optionalValueC[3] = value === 100 ? 'disable' : optionalValueC[3];
                    optionalValueC[5] = value === 0 ? 'disable' : optionalValueC[5];
                    message.optionalValue = optionalValueC.join('|');
                    message.displayName = this.library.getTranslation(
                        (await tools.getEntryTextOnOff(item.headline, !!value)) ?? message.displayName ?? '',
                    );
                    return tools.getItemMesssage(message);
                }
                case 'number': {
                    if (entry.type === 'number') {
                        // This code handles the 'number' type entry for the PageItem.
                        // It retrieves the necessary data and constructs a message payload for the number entry.
                        // The min and max values are used to define the range for the number display.
                        const item = entry.data;
                        message.type = 'number';
                        const number = (await tools.getValueEntryNumber(item.entity1, false)) ?? 0;
                        const value = (item.switch1 && (await item.switch1.getBoolean())) ?? null;
                        message.displayName = this.library.getTranslation(
                            (await tools.getEntryTextOnOff(item.text, true)) ?? '',
                        );
                        message.icon =
                            entry.role === 'textNotIcon'
                                ? ((await tools.getIconEntryValue(item.icon, value, '', null, true)) ?? '')
                                : ((await tools.getIconEntryValue(item.icon, value !== true, '')) ?? '');
                        message.iconColor =
                            (await tools.getIconEntryColor(item.icon, value !== true, Color.HMIOn)) ?? '';
                        let min = item.entity1 && item.entity1.value && item.entity1.value.common.min;
                        let max = item.entity1 && item.entity1.value && item.entity1.value.common.max;
                        min = (item.minValue1 && (await item.minValue1.getNumber())) ?? min ?? 0;
                        max = (item.maxValue1 && (await item.maxValue1.getNumber())) ?? max ?? 100;
                        return tools.getPayloadRemoveTilde(
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
                /**
                 * entity1 is value to calculate color
                 * entity2 is display value
                 */
                case 'text':
                case 'button':
                case 'switch': {
                    /**
                     * Alles was einen Druckfläche sein kann. D
                     */
                    if (entry.type === 'text' || entry.type === 'button' || entry.type === 'switch') {
                        const item = entry.data;
                        let value: boolean | number | null = await tools.getValueEntryNumber(item.entity1, true);
                        if (value === null) {
                            value = await tools.getValueEntryBoolean(item.entity1);
                        }
                        if (value === null) {
                            value = true;
                        }
                        // 2values: entity1 / the mean decide the color only - 0 must not switch icon and text to false
                        const showIcon = entry.role === '2values' ? true : value;
                        if (entry.role === 'text.states') {
                            const key = value ? 'true' : 'false';
                            const dataitem = item.text?.[key]
                                ? isDataItem(item.text[key])
                                    ? item.text[key]
                                    : item.text[key].value
                                : null;
                            const states = dataitem ? await dataitem.getCommonStates() : null;
                            if (states && dataitem) {
                                const v = await dataitem.getString();
                                if (v != null && states[v]) {
                                    message.displayName = this.library.getTranslation(states[v]) ?? '';
                                }
                            }
                        } else {
                            message.displayName = this.library.getTranslation(
                                (await tools.getEntryTextOnOff(item.text, !!showIcon)) ?? '',
                            );
                        }
                        if (entry.type === 'switch') {
                            message.optionalValue = (value ?? true) ? '1' : '0';
                        } else if (entry.type === 'button') {
                            message.optionalValue = (value ?? true) ? '1' : '0';
                            if (isCardEntitiesType(this.parent.card)) {
                                message.optionalValue =
                                    this.library.getTranslation(await tools.getEntryTextOnOff(item.text1, !!value)) ??
                                    message.optionalValue;
                            }
                        } else {
                            switch (entry.role) {
                                case '2values': {
                                    message.optionalValue = ``;
                                    const val1 = await tools.getValueEntryNumber(item.entity1);
                                    const val2 = await tools.getValueEntryNumber(item.entity2);
                                    const unit1 =
                                        item.entity1 && item.entity1.unit && (await item.entity1.unit.getString());
                                    const unit2 =
                                        item.entity2 && item.entity2.unit && (await item.entity2.unit.getString());
                                    if (val1 !== null && val2 !== null) {
                                        message.optionalValue =
                                            String(val1) + (unit1 ?? '') + String(val2) + (unit2 ?? '');
                                        if (typeof value === 'number') {
                                            value = (val1 + val2) / 2;
                                        }
                                    }

                                    break;
                                }
                                case '4values': {
                                    let val = await tools.getValueEntryString(item.entity1);
                                    value = true;
                                    if (val === null) {
                                        value = false;
                                        val = await tools.getValueEntryString(item.entity2);
                                        if (val === null) {
                                            value = true;
                                            val = await tools.getValueEntryString(item.entity3);
                                            if (val === null) {
                                                value = false;
                                                val = await tools.getValueEntryString(item.entity4);
                                            }
                                        }
                                    }
                                    if (val) {
                                        message.optionalValue = this.library.getTranslation(val);
                                    } else {
                                        message.optionalValue = '';
                                    }
                                    break;
                                }
                                default: {
                                    message.optionalValue = this.library.getTranslation(
                                        (await tools.getValueEntryString(item.entity2)) ??
                                            (await tools.getEntryTextOnOff(item.text1, value)) ??
                                            '',
                                    );
                                }
                            }
                        }

                        /*if (
                            
                            !this.parent.card.startsWith('screensaver') &&
                            entry.type === 'button' &&
                            entry.data.entity1 &&
                            entry.data.entity1.set &&
                            entry.data.entity1.set.common &&
                            entry.data.entity1.set.common.role &&
                            entry.data.entity1.set.common.role.startsWith('switch') &&
                            entry.data.entity1.set.writeable
                        ) {
                            entry.type = 'switch';
                        }*/

                        message.icon = await tools.getIconEntryValue(item.icon, showIcon, 'home');
                        switch (entry.role) {
                            case 'textNotIcon': {
                                message.icon =
                                    (await tools.getIconEntryValue(item.icon, showIcon, '', null, true)) ?? '';

                                break;
                            }
                            case 'iconNotText': {
                                message.icon =
                                    (await tools.getIconEntryValue(item.icon, showIcon, '', null, false)) ?? '';
                                break;
                            }
                            case 'battery': {
                                const val = (await tools.getValueEntryBoolean(item.entity3)) ?? false;
                                message.icon = (await tools.getIconEntryValue(item.icon, val, '', '', false)) ?? '';

                                break;
                            }
                            case 'combined': {
                                message.icon =
                                    (await tools.getIconEntryValue(item.icon, showIcon, '', null, false)) ?? '';
                                message.icon +=
                                    (await tools.getIconEntryValue(item.icon, showIcon, '', null, true)) ?? '';
                                break;
                            }
                            default: {
                                // the icon of a blind by position needs the position, not only open / closed
                                const positionIcon =
                                    typeof showIcon === 'number' &&
                                    (await item.icon?.true?.value?.getString()) === SHUTTER_POSITION_ICON;
                                message.icon =
                                    (await tools.getIconEntryValue(
                                        item.icon,
                                        positionIcon ? showIcon : !!showIcon,
                                        '',
                                        null,
                                        (!isCardEntitiesType(this.parent.card) &&
                                            !this.parent.card.startsWith('screens')) ??
                                            false,
                                    )) ?? '';
                            }
                        }
                        const additionalId = entry.data.additionalId ? await entry.data.additionalId.getString() : '';

                        message.iconColor = await tools.getIconEntryColor(item.icon, value ?? true, Color.HMIOn);

                        if (entry.type === 'button' && entry.data.confirm) {
                            if (this.confirmClick === 'unlock') {
                                const newValue: string | { text?: string; color?: RGB | string; icon?: string } | null =
                                    (await entry.data.confirm.getObject()) ?? (await entry.data.confirm.getString());
                                if (newValue) {
                                    const text = typeof newValue === 'object' ? newValue.text : newValue;

                                    if (isCardEntitiesType(this.parent.card)) {
                                        if (text) {
                                            message.optionalValue = text;
                                        }
                                    } else if (isCardGridType(this.parent.card)) {
                                        if (typeof newValue === 'string' && text) {
                                            message.icon = Icons.GetIcon(text);
                                        } else {
                                            if (typeof newValue === 'object') {
                                                if (newValue.icon) {
                                                    message.icon = Icons.GetIcon(newValue.icon);
                                                }
                                                if (newValue.color) {
                                                    let color = Color.White;
                                                    if (Color.isRGB(newValue.color)) {
                                                        color = newValue.color;
                                                    } else if (Color.isHex(newValue.color)) {
                                                        color = Color.ConvertHexToRgb(newValue.color);
                                                    }
                                                    message.iconColor = String(Color.rgb_dec565(color));
                                                }
                                            }
                                        }
                                    }
                                }
                                this.confirmClick = Date.now();
                            } else {
                                this.confirmClick = 'lock';
                            }
                        }
                        return tools.getPayloadRemoveTilde(
                            entry.type,
                            message.intNameEntity + additionalId,
                            message.icon,
                            message.iconColor,
                            message.displayName ?? '',
                            message.optionalValue,
                        );
                    }

                    break;
                }

                case 'input_sel': {
                    const item = entry.data;
                    message.type = 'input_sel';
                    let value =
                        (await tools.getValueEntryNumber(item.entityInSel)) ??
                        (await tools.getValueEntryBoolean(item.entityInSel));
                    if (entry.role === 'alexa-speaker') {
                        value = (this.parent as PageMedia).currentItem === (this.parent as PageMedia).items[0];
                    }
                    message.icon = await tools.getIconEntryValue(item.icon, !!(value ?? true), 'gesture-tap-button');

                    message.iconColor =
                        (await tools.getIconEntryColor(item.icon, !!(value ?? true), Color.HMIOff)) ?? Color.HMIOn;
                    message.displayName = this.library.getTranslation(
                        (await tools.getEntryTextOnOff(item.headline, !!(value ?? true))) ?? message.displayName ?? '',
                    );
                    message.optionalValue = this.library.getTranslation(
                        (await tools.getEntryTextOnOff(item.text, !!(value ?? true), true)) ?? 'PRESS',
                    );
                    return tools.getItemMesssage(message);

                    break;
                }
                case 'fan':
                    {
                        if (entry.type === 'fan') {
                            const item = entry.data;
                            message.type = 'fan';
                            //const speed = (await tools.getValueEntryNumber(item.speed, true)) ?? null;
                            const value = (await tools.getValueEntryBoolean(item.entity1)) ?? null;
                            message.displayName = this.library.getTranslation(
                                (await tools.getEntryTextOnOff(item.headline, true)) ?? message.displayName ?? '',
                            );
                            message.icon = (await tools.getIconEntryValue(item.icon, value, '')) ?? '';
                            message.iconColor = (await tools.getIconEntryColor(item.icon, value, Color.HMIOn)) ?? '';
                            /*const min =
                        (item.entity1 && item.entity1.minScale && (await item.entity1.minScale.getNumber())) ?? 0;
                        const max =
                        (item.entity1 && item.entity1.maxScale && (await item.entity1.maxScale.getNumber())) ?? 100;
                        */
                            return tools.getPayloadRemoveTilde(
                                message.type,
                                message.intNameEntity,
                                message.icon,
                                message.iconColor,
                                message.displayName,
                                value ? '1' : '0',
                            );
                        }
                    }
                    break;

                /**
                 * 3 Funktionen
                 * 1. Countdown
                 * 2. Wecker stellen
                 * 3. Countdown anzeigen
                 */
                case 'timer': {
                    if (entry.type === 'timer') {
                        const item = entry.data;
                        message.type = 'timer';
                        const { opt, on } = await this.getTimerListValue(item);
                        // the screensaver timer does not use the STATUS of the channel
                        const s =
                            this.tempData?.role !== 'ss-timer' && item.setValue2 && (await item.setValue2.getNumber());
                        const v = typeof s === 'number' ? s > 1 : on;
                        {
                            message.iconColor = await tools.getIconEntryColor(item.icon, v, Color.White);
                            message.icon = await tools.getIconEntryValue(item.icon, v, 'gesture-tap-button');
                            message.optionalValue = this.library.getTranslation(
                                (await tools.getEntryTextOnOff(item.text, on)) ?? opt,
                            );

                            message.displayName = this.library.getTranslation(
                                (await tools.getEntryTextOnOff(item.headline, true)) ?? message.displayName ?? '',
                            );
                            return tools.getPayloadRemoveTilde(
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
                }
                case 'empty':
                    {
                        return tools.getPayloadRemoveTilde('', 'delete', '', '', '', '');
                    }
                    break;
            }
        }
        this.log.warn(
            `Something went wrong on ${this.id} type: ${this.config && this.config.type} role: ${this.dataItems && this.dataItems.role} dataitems.type: ${this.dataItems && this.dataItems.type}!`,
        );
        return '~~~~~';
    }

    getDetailPayload(message: Partial<NSPanel.entityUpdateDetailMessage>): string {
        this.triggerParent = false;
        if (!message.type) {
            return '';
        }
        switch (message.type) {
            case '2Sliders': {
                let result: NSPanel.entityUpdateDetailMessage = {
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
                result = {
                    ...result,
                    ...Object.fromEntries(Object.entries(message).filter(([_, v]) => v !== undefined)),
                };
                return tools.getPayloadRemoveTilde(
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
                let result: NSPanel.entityUpdateDetailMessage = {
                    type: 'insel',
                    entityName: '',
                    headline: '',
                    textColor: String(Color.rgb_dec565(Color.White)),
                    currentState: '',
                    list: '',
                };
                result = {
                    ...result,
                    ...Object.fromEntries(Object.entries(message).filter(([_, v]) => v !== undefined)),
                };
                return tools.getPayloadRemoveTilde(
                    'entityUpdateDetail2',
                    result.entityName,
                    '',
                    result.textColor,
                    result.headline,
                    result.currentState,
                    result.list,
                );
                break;
            }
            case 'popupThermo': {
                let result: NSPanel.entityUpdateDetailMessage = {
                    type: 'popupThermo',
                    entityName: '',
                    headline: '',
                    currentState: '',
                    list: '',
                };
                result = {
                    ...result,
                    ...Object.fromEntries(Object.entries(message).filter(([_, v]) => v !== undefined)),
                };
                return tools.getPayloadRemoveTilde(
                    result.headline,
                    result.entityName,
                    result.currentState,
                    result.list,
                );
                break;
            }
            case 'popupFan': {
                let result: NSPanel.entityUpdateDetailMessage = {
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
                result = {
                    ...result,
                    ...Object.fromEntries(Object.entries(message).filter(([_, v]) => v !== undefined)),
                };
                return tools.getPayloadRemoveTilde(
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
                let result: NSPanel.entityUpdateDetailMessage = {
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
                result = {
                    ...result,
                    ...Object.fromEntries(Object.entries(message).filter(([_, v]) => v !== undefined)),
                };
                return tools.getPayloadRemoveTilde(
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
                let result: NSPanel.entityUpdateDetailMessage = {
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
                    pos2: 'disable',
                };
                result = {
                    ...result,
                    ...Object.fromEntries(Object.entries(message).filter(([_, v]) => v !== undefined)),
                };
                return tools.getPayloadRemoveTilde(
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
            case 'popupShutter2': {
                let result: NSPanel.entityUpdateDetailMessage = {
                    type: 'popupShutter2',
                    entityName: '',
                    pos1: '',
                    text2: '',
                    pos1text: '',
                    icon: '',
                    iconT1: '',
                    iconM1: '',
                    iconB1: '',
                    statusT1: 'disable',
                    statusM1: 'disable',
                    statusB1: 'disable',
                    iconT2: '',
                    iconT2Color: '',
                    iconT2Enable: 'disable',
                    iconM2: '',
                    iconM2Color: '',
                    iconM2Enable: 'disable',
                    iconB2: '',
                    iconB2Color: '',
                    iconB2Enable: 'disable',
                    shutterTyp: 'shutter',
                    shutterClosedIsZero: this.adapter.config.shutterClosedIsZero ? '1' : '0',
                };
                result = {
                    ...result,
                    ...Object.fromEntries(Object.entries(message).filter(([_, v]) => v !== undefined)),
                };
                return tools.getPayloadRemoveTilde(
                    'entityUpdateDetail',
                    result.entityName,
                    result.pos1,
                    result.text2,
                    result.pos1text,
                    result.icon,
                    result.iconT1,
                    result.iconM1,
                    result.iconB1,
                    result.statusT1,
                    result.statusM1,
                    result.statusB1,
                    result.iconT2,
                    result.iconT2Color,
                    result.iconT2Enable,
                    result.iconM2,
                    result.iconM2Color,
                    result.iconM2Enable,
                    result.iconB2,
                    result.iconB2Color,
                    result.iconB2Enable,
                    result.shutterTyp,
                    result.shutterClosedIsZero,
                );
            }
            case 'popupSlider': {
                let result: NSPanel.entityUpdateDetailMessage = {
                    type: 'popupSlider',
                    entityName: '',
                    tSlider1: '',
                    tIconS1M: '',
                    tIconS1P: '',
                    hSlider1CurVal: '',
                    hSlider1MinVal: '',
                    hSlider1MaxVal: '',
                    hSlider1ZeroVal: '',
                    hSlider1Step: '',
                    hSlider1Visibility: 'disable',
                    tSlider2: '',
                    tIconS2M: '',
                    tIconS2P: '',
                    hSlider2CurVal: '',
                    hSlider2MinVal: '',
                    hSlider2MaxVal: '',
                    hSlider2ZeroVal: '',
                    hSlider2Step: '',
                    hSlider2Visibility: 'disable',
                    tSlider3: '',
                    tIconS3M: '',
                    tIconS3P: '',
                    hSlider3CurVal: '',
                    hSlider3MinVal: '',
                    hSlider3MaxVal: '',
                    hSlider3ZeroVal: '',
                    hSlider3Step: '',
                    hSlider3Visibility: 'disable',
                };
                result = {
                    ...result,
                    ...Object.fromEntries(Object.entries(message).filter(([_, v]) => v !== undefined)),
                };
                return tools.getPayloadRemoveTilde(
                    'entityUpdateDetail',
                    result.entityName,
                    result.tSlider1,
                    result.tIconS1M,
                    result.tIconS1P,
                    result.hSlider1CurVal,
                    result.hSlider1MinVal,
                    result.hSlider1MaxVal,
                    result.hSlider1ZeroVal,
                    result.hSlider1Step,
                    result.hSlider1Visibility,
                    result.tSlider2,
                    result.tIconS2M,
                    result.tIconS2P,
                    result.hSlider2CurVal,
                    result.hSlider2MinVal,
                    result.hSlider2MaxVal,
                    result.hSlider2ZeroVal,
                    result.hSlider2Step,
                    result.hSlider2Visibility,
                    result.tSlider3,
                    result.tIconS3M,
                    result.tIconS3P,
                    result.hSlider3CurVal,
                    result.hSlider3MinVal,
                    result.hSlider3MaxVal,
                    result.hSlider3ZeroVal,
                    result.hSlider3Step,
                    result.hSlider3Visibility,
                );
            }
        }
        return '';
    }
    async isEnabled(): Promise<boolean> {
        if (this.config && this.dataItems) {
            const entry = this.dataItems;
            if (entry.data?.enabled) {
                if (this.config?.role === 'isDismissiblePerEvent') {
                    if (this.tempData?.isDismissiblePerEvent) {
                        return false;
                    }
                }
                const val = await tools.getEnabled(entry.data.enabled);
                return val ?? true;
            }
        }
        return true;
    }
    async onStateChange(_dp: string, _state: { old: nsPanelState; new: nsPanelState }): Promise<void> {
        if (this.tempData?.role === 'timer') {
            await this.onInternalTimerState(_dp, _state.new.val);
        }
        // the states of this item already read the new value
        this.notifyClockSource();
        if (_state.old.val !== _state.new.val) {
            if (this.config?.role === 'isDismissiblePerEvent') {
                if (this.dataItems?.data?.enabled) {
                    if (Array.isArray(this.dataItems.data.enabled)) {
                        let found = false;
                        for (const en of this.dataItems.data.enabled) {
                            if (en && 'dp' in en.options && en.options.dp === _dp) {
                                found = true;
                            }
                        }
                        if (found) {
                            const val = await tools.getEnabled(this.dataItems.data.enabled);
                            if (!val) {
                                this.tempData = { ...this.tempData, isDismissiblePerEvent: false };
                            }
                        }
                    } else {
                        const en = this.dataItems.data.enabled;
                        if ('dp' in en.options && en.options.dp === _dp) {
                            const val = await tools.getEnabled(en);
                            if (!val) {
                                this.tempData = { ...this.tempData, isDismissiblePerEvent: false };
                            }
                        }
                    }
                }
            }
        }
    }

    getGlobalDismissibleID(): string | null {
        if (this.config?.role === 'isDismissiblePerEvent') {
            return this.config?.dismissibleIDGlobal || null;
        }
        return null;
    }

    setDismissiblePerEvent(): void {
        if (this.config?.role === 'isDismissiblePerEvent') {
            this.tempData = { ...this.tempData, isDismissiblePerEvent: true };
        }
    }

    /**
     * @returns true when this item uses the timer of the screensaver
     */
    get usesScreensaverTimer(): boolean {
        return this.tempData?.role === 'ss-timer';
    }

    /**
     * Only a real countdown can be the source of the screensaver: counted here, or outside with a STATUS.
     *
     * @returns true when it is one
     */
    isCountdownSource(): boolean {
        return (
            this.tempData?.role === 'timer' ||
            (this.tempData?.role === 'ex-timer' && this.dataItems?.type === 'timer' && !!this.dataItems.data?.setValue2)
        );
    }

    /**
     * Keeps this item while its page is not shown and reports its changes.
     *
     * @param listener called on every change, must not throw
     */
    async useAsClockTimerSource(listener: () => void): Promise<void> {
        this.clockSourceListeners.add(listener);
        this.parent.basePanel.persistentPageItems[this.id] = this;
        await this.controller.statesControler.activateTrigger(this);
    }

    /**
     * @param listener as given to {@link useAsClockTimerSource}
     */
    removeClockTimerSource(listener: () => void): void {
        this.clockSourceListeners.delete(listener);
    }

    private notifyClockSource(): void {
        this.clockSourceListeners.forEach(listener => listener());
    }

    /**
     * @returns the countdown for the screensaver
     */
    async getCountdownView(): Promise<TimerCountdownView> {
        const data = this.dataItems?.type === 'timer' ? this.dataItems.data : undefined;
        if (this.tempData?.role === 'timer') {
            const seconds = this.internalSeconds();
            const base = { remainingMs: seconds * 1000, canStart: true, canStop: true };
            switch (this.tempData.status) {
                case 'run':
                    return { ...base, status: 'running', endTs: this.tempData.endTs };
                case 'expired':
                    return { ...base, status: 'expired' };
                default:
                    return { ...base, status: this.tempData.status === 'pause' && seconds > 0 ? 'paused' : 'off' };
            }
        }
        const status = data?.setValue2 ? await data.setValue2.getNumber() : null;
        const seconds = data ? timerSecondsOf(await this.getTimerActual(data), data.entity1?.value?.common.unit) : 0;
        const view = {
            remainingMs: seconds * 1000,
            canStart: !!data?.setValue2?.writeable && !!data && !!this.getTimerWriteState(data),
            canStop: !!data?.setValue2?.writeable,
        };
        if (status === 2) {
            return { ...view, status: seconds > 0 ? 'running' : 'expired' };
        }
        return { ...view, status: status === 1 && seconds > 0 ? 'paused' : 'off' };
    }

    /**
     * @param seconds duration
     * @returns true when the item was told to start
     */
    async startAsClockTimerSource(seconds: number): Promise<boolean> {
        const view = await this.getCountdownView();
        if (seconds <= 0 || view.status !== 'off' || !view.canStart) {
            return false;
        }
        await this.onCommand('timer-start', timerClockText(seconds));
        await this.onCommand('timer-begin', '');
        return true;
    }

    /**
     * @returns true when the item was told to stop
     */
    async stopAsClockTimerSource(): Promise<boolean> {
        const view = await this.getCountdownView();
        if (view.status === 'off' || !view.canStop) {
            return false;
        }
        await this.onCommand(view.status === 'expired' ? 'timer-finish' : 'timer-clear', '');
        return true;
    }

    /**
     * The internal timer is up and listens to its SET and STATUS, also while its page was never shown. It does not
     * count after a restart: a STATUS left over from before is corrected.
     */
    async activateControlledTimer(): Promise<void> {
        await this.controller.statesControler.activateTrigger(this);
        await this.mirrorInternalStatus();
    }

    /**
     * @returns the STATUS that fits the internal timer: 2 also while expired - the external timer says the same with
     * ACTUAL 0 at STATUS 2, and it stays so until finish
     */
    private internalStatusValue(): number {
        switch (this.tempData?.status) {
            case 'run':
            case 'expired':
                return 2;
            case 'pause':
                return this.tempData.value > 0 ? 1 : 0;
            default:
                return 0;
        }
    }

    /**
     * Writes STATUS only when it differs. The state of the timer is changed before, so the echo of this write is the
     * value {@link onInternalStatus} expects and does nothing.
     */
    private async mirrorInternalStatus(): Promise<void> {
        const status = this.dataItems?.type === 'timer' ? this.dataItems.data?.setValue2 : undefined;
        if (status?.writeable && (await status.getNumber()) !== this.internalStatusValue()) {
            await status.setState(this.internalStatusValue());
        }
    }

    /**
     * After every change of the internal timer: STATUS, source of the screensaver and popup follow.
     */
    private async onInternalTimerChanged(): Promise<void> {
        await this.mirrorInternalStatus();
        this.notifyClockSource();
        await this.drawTimer();
    }

    /**
     * Something other than the time changed: at once the popup or the line of the list, whichever is visible.
     */
    private async drawTimer(): Promise<void> {
        if (this.lastPopupType) {
            await this.onStateTrigger();
        } else if (!this.parent.sleep && this.parent.getVisibility()) {
            await this.parent.onStateTriggerSuperDoNotOverride('timer', this);
        }
    }

    /**
     * One second of the ticker of the page.
     *
     * @returns true when the line of the list has to show more than a new time
     */
    async onTimerTick(): Promise<boolean> {
        let changed = false;
        if (this.tempData?.role === 'ss-timer') {
            const access = await this.parent.basePanel.screenSaver?.getClockTimerAccess();
            changed = access?.selection.status !== this.tempData.lastStatus;
        }
        if (this.lastPopupType) {
            await this.onStateTrigger();
            return false;
        }
        return changed;
    }

    /**
     * Starts or continues the internal timer; with no time left it starts from SET. Nothing to count: nothing happens,
     * the first tick would report a finished timer.
     */
    private async startInternalTimer(): Promise<void> {
        const data = this.dataItems?.type === 'timer' ? this.dataItems.data : undefined;
        if (!(this.tempData.value > 0) && data?.entity1?.set) {
            this.tempData.value = timerSecondsOf(await data.entity1.set.getNumber(), data.entity1.set.common.unit);
        }
        if (!(this.tempData.value > 0)) {
            await this.mirrorInternalStatus();
            return;
        }
        this.tempData.status = 'run';
        this.tempData.endTs = Date.now() + this.tempData.value * 1000;
        this.scheduleInternalEnd();
        await this.onInternalTimerChanged();
    }

    /**
     * @returns the time of the internal timer: while it runs out of its end - as every other view of this timer does
     */
    private internalSeconds(): number {
        if (this.tempData?.status === 'run' && this.tempData.endTs) {
            return Math.max(0, Math.ceil((this.tempData.endTs - Date.now()) / 1000));
        }
        return Number(this.tempData?.value) || 0;
    }

    private clearInternalEnd(): void {
        if (this.timeouts.internalEnd) {
            this.adapter.clearTimeout(this.timeouts.internalEnd);
            this.timeouts.internalEnd = undefined;
        }
    }

    /**
     * The end of the internal timer, also while nothing of it is visible: no counting in between.
     */
    private scheduleInternalEnd(): void {
        this.clearInternalEnd();
        // long waits go in steps, larger values overflow the timers of node
        const wait = Math.min(this.tempData.endTs - Date.now(), 86_400_000);
        this.timeouts.internalEnd = this.adapter.setTimeout(
            () => {
                this.timeouts.internalEnd = undefined;
                this.onInternalEnd().catch((err: unknown) => this.log.warn(`${this.name}: timer: ${String(err)}`));
            },
            Math.max(0, wait),
        );
    }

    private async onInternalEnd(): Promise<void> {
        if (this.unload || this.tempData?.status !== 'run') {
            return;
        }
        if (this.internalSeconds() > 0) {
            this.scheduleInternalEnd();
            return;
        }
        // stays expired until finish is pressed - the end is reported now
        this.tempData.value = 0;
        this.tempData.status = 'expired';
        if (this.dataItems && this.dataItems.type == 'timer' && this.dataItems.data) {
            this.dataItems.data.setValue1 && (await this.dataItems.data.setValue1.setStateTrue());
        }
        await this.onInternalTimerChanged();
    }

    /**
     * A state of the channel of an internal timer changed.
     *
     * @param dp state id
     * @param val new value
     */
    private async onInternalTimerState(dp: string, val: unknown): Promise<void> {
        const data = this.dataItems?.type === 'timer' ? this.dataItems.data : undefined;
        const isState = (item: Dataitem | undefined): boolean =>
            !!item && 'dp' in item.options && item.options.dp === dp;
        if (isState(data?.setValue2)) {
            await this.onInternalStatus(Number(val));
        } else if (isState(data?.entity1?.set)) {
            await this.onInternalSet(val, data?.entity1?.set?.common.unit);
        }
    }

    /**
     * STATUS from outside: 2 starts or continues, 1 pauses, 0 cancels. The value of this timer already: nothing to do
     * (that also is the echo of an own write). What can not be done is answered with the value that is true.
     *
     * @param value new value
     */
    private async onInternalStatus(value: number): Promise<void> {
        if (value === this.internalStatusValue()) {
            return;
        }
        if (value === 2) {
            await this.onCommand('timer-begin', '');
        } else if (value === 1 && this.tempData.status === 'run') {
            await this.onCommand('timer-pause', '');
        } else if (value === 0) {
            await this.onCommand('timer-clear', '');
        } else {
            await this.mirrorInternalStatus();
        }
    }

    /**
     * SET from outside: sets the time, a running timer goes on with it, a standing one does not start. 0 cancels.
     *
     * @param val new value
     * @param unit common.unit of SET
     */
    private async onInternalSet(val: unknown, unit: unknown): Promise<void> {
        if (this.tempData.ownSet !== undefined && this.tempData.ownSet === val) {
            // the echo of the time set in the popup
            this.tempData.ownSet = undefined;
            return;
        }
        this.tempData.ownSet = undefined;
        const seconds = timerSecondsOf(typeof val === 'number' ? val : Number(val), unit);
        if (seconds <= 0) {
            await this.onCommand('timer-clear', '');
            return;
        }
        this.tempData.value = seconds;
        if (this.tempData.status === 'run') {
            this.tempData.endTs = Date.now() + seconds * 1000;
            this.scheduleInternalEnd();
        } else if (this.tempData.status === 'expired') {
            this.tempData.status = 'stop';
        }
        await this.onInternalTimerChanged();
    }

    /**
     * The timer of the screensaver of this panel; changes of its states update this item from now on.
     *
     * @returns undefined when there is none, the panel is told once
     */
    private async getScreensaverTimer(): Promise<ClockTimerAccess | undefined> {
        const panel = this.parent.basePanel;
        const saver = panel.screenSaver;
        if (saver !== this.clockTimerSaver) {
            this.clockTimerSaver?.removeClockTimerListener(this.onClockTimerChange);
            saver?.addClockTimerListener(this.onClockTimerChange);
            this.clockTimerSaver = saver;
        }
        const access = await saver?.getClockTimerAccess();
        if (!access && !panelsWarnedAboutClockTimer.has(panel)) {
            panelsWarnedAboutClockTimer.add(panel);
            this.log.warn(
                `${this.name}: 'use the timer of the screensaver' is set, but the screensaver of panel '${panel.friendlyName || panel.name}' has no complete timer. The item stays without buttons.`,
            );
        }
        this.tempData.lastStatus = access?.selection.status;
        this.parent.setTimerTick(this, access?.ticking ?? false);
        return access;
    }

    private onClockTimerChange = (): void => {
        this.refreshClockTimer().catch((err: unknown) => this.log.warn(`${this.name}: timer: ${String(err)}`));
    };

    /**
     * Draws the popup or the line of the list again, whichever is visible.
     */
    private async refreshClockTimer(): Promise<void> {
        if (!this.unload && !this.adapter.unload) {
            await this.drawTimer();
        }
    }

    /**
     * @param item data of the item
     * @returns where a time set in the popup goes: SET, without a writeable SET a writeable ACTUAL
     */
    private getTimerWriteState(item: NSPanel.PageItemTimerDataItems['data']): Dataitem | undefined {
        const entity = item.entity1;
        return entity?.set?.writeable ? entity.set : entity?.value?.writeable ? entity.value : undefined;
    }

    /**
     * @param item data of the item
     * @returns the value of ACTUAL, 0 without it
     */
    private async getTimerActual(item: NSPanel.PageItemTimerDataItems['data']): Promise<number> {
        return (item.entity1 && item.entity1.value && (await tools.getValueEntryNumber(item.entity1))) ?? 0;
    }

    /**
     * @param item data of the item
     * @returns the text of the list and whether the timer counts as on
     */
    private async getTimerListValue(
        item: NSPanel.PageItemTimerDataItems['data'],
    ): Promise<{ opt: string; on: boolean }> {
        switch (this.tempData?.role) {
            case 'ss-timer': {
                const selection = (await this.getScreensaverTimer())?.selection;
                return {
                    opt: timerClockText(Math.ceil((selection?.remainingMs ?? 0) / 1000)),
                    on: !!selection && selection.status !== 'off',
                };
            }
            case 'timer': {
                const seconds = this.internalSeconds();
                this.parent.setTimerTick(this, this.tempData.status === 'run');
                return { opt: timerClockText(seconds), on: seconds > 0 || this.tempData.status === 'expired' };
            }
            case 'ex-timer': {
                const seconds = timerSecondsOf(await this.getTimerActual(item), item.entity1?.value?.common.unit);
                return { opt: timerClockText(seconds), on: seconds > 0 };
            }
            case 'ex-alarm': {
                const value = await this.getTimerActual(item);
                const { hour, minute } = alarmClockOf(value);
                return {
                    opt: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
                    on: value > 0,
                };
            }
            default: {
                return { opt: '', on: (await this.getTimerActual(item)) !== 0 };
            }
        }
    }

    /**
     * @param item data of the item
     * @returns what the popup of a timer shows
     */
    private async getTimerPopupState(
        item: NSPanel.PageItemTimerDataItems['data'],
    ): Promise<{ on: boolean; minutes: string; seconds: string } & TimerPopupButtons> {
        const none: TimerPopupButtons = { editable: false, buttons: [undefined, undefined, undefined] };
        const statusValue = item.setValue2 ? ((await item.setValue2.getNumber()) ?? 0) : undefined;
        const external = {
            status: statusValue,
            canStatus: !!item.setValue2?.writeable,
            canSet: !!this.getTimerWriteState(item),
        };
        const role: unknown = this.tempData?.role;
        switch (role) {
            case 'ss-timer': {
                const access = await this.getScreensaverTimer();
                if (!access) {
                    return { on: false, ...timerPopupFields(0), ...none };
                }
                const running = access.selection.status !== 'off';
                const seconds = running
                    ? Math.ceil(access.selection.remainingMs / 1000)
                    : Number(this.tempData.editSeconds) || 0;
                return {
                    on: running,
                    ...timerPopupFields(seconds),
                    ...timerPopupButtons({
                        mode: 'ss-timer',
                        status: access.selection.status,
                        canStart: access.canStart,
                        canStop: access.canStop,
                    }),
                };
            }
            case 'timer': {
                const seconds = this.internalSeconds();
                this.parent.setTimerTick(this, this.tempData.status === 'run');
                return {
                    on: this.tempData.status === 'run' || this.tempData.status === 'expired',
                    ...timerPopupFields(seconds),
                    ...timerPopupButtons({ mode: 'timer', status: this.tempData.status, seconds }),
                };
            }
            case 'ex-timer': {
                const seconds = timerSecondsOf(await this.getTimerActual(item), item.entity1?.value?.common.unit);
                return {
                    on: seconds > 0,
                    ...timerPopupFields(seconds),
                    ...timerPopupButtons({ mode: 'ex-timer', ...external, seconds }),
                };
            }
            case 'ex-alarm': {
                const value = await this.getTimerActual(item);
                const { hour, minute } = alarmClockOf(value);
                return {
                    on: value > 0,
                    minutes: String(hour),
                    seconds: String(minute),
                    ...timerPopupButtons({ mode: 'ex-alarm', ...external }),
                };
            }
            default: {
                return { on: false, ...timerPopupFields(0), ...none };
            }
        }
    }

    async GeneratePopup(mode: PopupType): Promise<string | null> {
        if (!this.config || !this.dataItems) {
            return null;
        }
        const entry = this.dataItems;
        let message: Partial<NSPanel.entityUpdateDetailMessage> = {};
        //const template = templatePageItems[mode][this.config.role];
        message.entityName = this.id;
        if (!this.lastPopupType && this.tempData?.role === 'ss-timer') {
            // the time set in the popup lasts until it is opened again
            this.tempData.editSeconds = 0;
        }
        this.visibility = true;
        this.lastPopupType = mode;
        switch (mode) {
            case 'popupLightNew':
            case 'popupLight': {
                switch (this.config.role) {
                    case 'light':
                    case 'socket':
                    case 'dimmer':
                    case 'hue':
                    case 'ct':
                    case 'rgbThree':
                    case 'rgbSingle':
                    case 'rgb.hex':
                    case 'volume.mute':
                    default: {
                        message.type = '2Sliders';
                        if (message.type !== '2Sliders' || entry.type !== 'light') {
                            return null;
                        }
                        const item = entry.data;
                        message.buttonState = (await tools.getValueEntryBoolean(item.entity1)) ?? 'disable';
                        const dimmer = item.dimmer && item.dimmer.value && (await item.dimmer.value.getNumber());
                        if (dimmer != null && item.dimmer) {
                            if (item.dimmer.minScale != undefined && item.dimmer.maxScale) {
                                message.slider1Pos = Math.trunc(
                                    Color.scale(
                                        dimmer,
                                        await item.dimmer.minScale.getNumber(),
                                        await item.dimmer.maxScale.getNumber(),
                                        0,
                                        100,
                                    ),
                                );
                            } else if (item.dimmer.value?.common?.min !== undefined && item.dimmer.value?.common?.max) {
                                message.slider1Pos = Math.trunc(
                                    Color.scale(
                                        dimmer,
                                        item.dimmer.value.common.min,
                                        item.dimmer.value.common.max,
                                        0,
                                        100,
                                    ),
                                );
                            } else {
                                message.slider1Pos = dimmer;
                            }
                        }
                        if (message.buttonState !== 'disable') {
                            message.icon = await tools.getIconEntryValue(item.icon, message.buttonState, '', '');
                        }
                        if (this.config.role !== 'volume.mute') {
                            message.slidersColor =
                                (await tools.getIconEntryColor(
                                    item.icon,
                                    message.slider1Pos === undefined || message.slider1Pos === 'disable'
                                        ? null
                                        : (message.slider1Pos ?? message.buttonState === true),
                                    Color.White,
                                )) ?? 'disable';
                            let rgb = null;
                            switch (this.config.role) {
                                case 'socket':
                                case 'light':
                                case 'dimmer':
                                case 'ct':
                                    break;
                                case 'hue': {
                                    const nhue = (item.hue && (await item.hue.getNumber())) ?? null;
                                    if (nhue != null) {
                                        rgb = Color.hsv2RGB(nhue, 1, 1) ?? null;
                                    }
                                    break;
                                }
                                case 'rgbThree': {
                                    rgb = (await tools.getRGBfromRGBThree(item)) ?? null;
                                    break;
                                }
                                case 'rgbSingle': {
                                    rgb =
                                        (item.color && item.color.true && (await item.color.true.getRGBValue())) ??
                                        null;
                                    break;
                                }
                                case 'rgb.hex': {
                                    rgb =
                                        (item.color && item.color.true && (await item.color.true.getRGBValue())) ??
                                        null;
                                    break;
                                }
                            }
                            message.slider2Pos = 'disable';
                            if (item.White) {
                                const val = await tools.getScaledNumber(item.White);
                                message.slider2Pos = val ?? 'disable';
                            } else if (item.ct && item.ct.value) {
                                const ct = await tools.getSliderCTFromValue(item.ct);
                                if (ct !== null) {
                                    message.slider2Pos = parseInt(ct);
                                }
                            }
                            let colorMode: 'ct' | 'hue' | 'none' = !item.colorMode
                                ? 'none'
                                : (await item.colorMode.getBoolean())
                                  ? 'hue'
                                  : 'ct';
                            if (colorMode === 'none') {
                                const ctState = item.ct && item.ct.value && (await item.ct.value.getState());
                                const colorState =
                                    (item.Red && (await item.Red.getState())) ??
                                    (item.Green && (await item.Green.getState())) ??
                                    (item.Blue && (await item.Blue.getState())) ??
                                    (item.color && item.color.true && (await item.color.true.getState())) ??
                                    (item.hue && (await item.hue.getState())) ??
                                    null;
                                if (ctState && colorState) {
                                    if (ctState.ts > colorState.ts) {
                                        colorMode = 'ct';
                                    } else {
                                        colorMode = 'hue';
                                    }
                                } else if (ctState) {
                                    colorMode = 'ct';
                                } else if (colorState) {
                                    colorMode = 'hue';
                                }
                            }
                            message.hueMode = rgb !== null;
                            if (rgb !== null && colorMode === 'hue') {
                                message.slidersColor = await tools.GetIconColor(
                                    rgb,
                                    message.slider1Pos !== 'disable' && message.slider1Pos != null
                                        ? message.slider1Pos > 30
                                            ? message.slider1Pos
                                            : 30
                                        : message.buttonState !== 'disable' && message.buttonState !== false,
                                );
                            }
                            if (message.slider2Pos !== 'disable' && colorMode === 'ct') {
                                message.slidersColor =
                                    (await tools.getTemperaturColorFromValue(item.ct, dimmer ?? 100)) ?? '';
                            }

                            message.popup = !!item.entityInSel?.value; //message.slider2Pos !== 'disable' && rgb !== null;

                            message.slider2Translation =
                                (item.text2 && item.text2.true && (await item.text2.true.getString())) ?? undefined;

                            message.hue_translation =
                                (item.text3 && item.text3.true && (await item.text3.true.getString())) ?? undefined;
                        } else {
                            message.slider2Pos = 'disable';
                            message.slidersColor =
                                (await tools.getIconEntryColor(
                                    item.icon,
                                    message.buttonState !== false,
                                    Color.White,
                                )) ?? 'disable';
                        }
                        message.slider1Translation =
                            (item.text1 && item.text1.true && (await item.text1.true.getString())) ?? undefined;

                        if (message.slider1Translation !== undefined) {
                            message.slider1Translation = this.library.getTranslation(message.slider1Translation);
                        }
                        if (message.slider2Translation !== undefined) {
                            message.slider2Translation = this.library.getTranslation(message.slider2Translation);
                        }
                        if (message.hue_translation !== undefined) {
                            message.hue_translation = this.library.getTranslation(message.hue_translation);
                        }

                        break;
                    }
                }
                break;
            }

            case 'popupFan': {
                if (entry.type === 'fan') {
                    const item = entry.data;
                    message.type = 'popupFan';
                    if (message.type !== 'popupFan') {
                        break;
                    }
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
                    message.speedText = this.library.getTranslation(
                        (await tools.getEntryTextOnOff(item.text, value)) ?? '',
                    );
                    let force = false;
                    if (this.updateCommon.counts < 4) {
                        if (Date.now() - this.updateCommon.lastRequest > 5000) {
                            this.updateCommon.counts = 0;
                        } else {
                            this.updateCommon.counts++;
                        }
                    } else {
                        this.updateCommon.counts = 0;
                        this.updateCommon.lastRequest = Date.now();
                        force = true;
                    }
                    const sList =
                        item.entityInSel &&
                        (await this.getListFromStates(
                            item.entityInSel,
                            item.valueList,
                            entry.role,
                            'valueList2' in item ? item.valueList2 : undefined,
                            force,
                        ));
                    if (
                        sList !== undefined &&
                        sList.list !== undefined &&
                        sList.value !== undefined &&
                        sList.states !== undefined
                    ) {
                        if (sList.list.length > 0) {
                            sList.list = sList.list.slice(0, 48);
                            message.modeList = Array.isArray(sList.list)
                                ? sList.list.map((a: string) => tools.formatInSelText(a.replace('?', ''))).join('?')
                                : '';

                            message.mode = tools.formatInSelText(this.library.getTranslation(sList.value));
                        }
                    } else {
                        let list =
                            (item.valueList && (await item.valueList.getObject())) ??
                            (item.valueList && (await item.valueList.getString())) ??
                            '';
                        if (list !== null) {
                            if (typeof list === 'string') {
                                list = list.split('?');
                            }
                            if (Array.isArray(list)) {
                                list = list.slice(0, 48);
                            }
                        } else {
                            list = [];
                        }

                        list = (list as string[]).map((a: string) =>
                            tools.formatInSelText(this.library.getTranslation(a)),
                        );

                        message.modeList = (list as string[]).map(a => a.replace('?', '')).join('?');

                        if (message.modeList && message.modeList.length > 900) {
                            message.modeList = message.modeList.slice(0, 900);
                            this.log.warn('Value list has more as 900 chars!');
                        }
                        const n = (await tools.getValueEntryNumber(item.entityInSel)) ?? 0;
                        if (Array.isArray(list) && n != null && n < list.length) {
                            message.mode = list[n];
                        }
                    }
                }
                break;
            }
            case 'popupThermo':
            case 'popupInSel': {
                if (entry.type !== 'input_sel' && entry.type !== 'light' && entry.type !== 'light2') {
                    break;
                }
                const item = entry.data;
                message.type = 'insel';
                if (!(message.type === 'insel')) {
                    return null;
                }

                let value =
                    (await tools.getValueEntryNumber(item.entityInSel)) ??
                    (await tools.getValueEntryBoolean(item.entityInSel));
                if (entry.role === 'alexa-speaker') {
                    value = (this.parent as PageMedia).currentItem === (this.parent as PageMedia).items[0];
                }
                message.textColor =
                    (await tools.getIconEntryColor(item.icon, !!(value ?? true), Color.HMIOff)) ?? Color.HMIOn;

                message.currentState =
                    mode === 'popupThermo'
                        ? this.library.getTranslation((item.headline && (await item.headline.getString())) ?? '')
                        : 'entity2' in item
                          ? ((await tools.getValueEntryString(item.entity2)) ?? '')
                          : '';
                message.headline = this.library.getTranslation(
                    (item.headline && (await item.headline.getString())) ?? '',
                );

                const sList =
                    item.entityInSel &&
                    (await this.getListFromStates(
                        item.entityInSel,
                        item.valueList,
                        entry.role,
                        'valueList2' in item ? item.valueList2 : undefined,
                    ));
                if (sList !== undefined && sList.list !== undefined && sList.value !== undefined) {
                    if (sList.list.length > 0) {
                        sList.list.splice(48);
                        message.list = Array.isArray(sList.list)
                            ? sList.list.map((a: string) => tools.formatInSelText(a.replace('?', ''))).join('?')
                            : '';

                        message.currentState = tools.formatInSelText(this.library.getTranslation(sList.value));
                        if (mode !== 'popupThermo') {
                            break;
                        }
                        message = { ...message, type: 'popupThermo' };
                        if (message.type === 'popupThermo') {
                            message.headline = this.library.getTranslation(
                                (await tools.getEntryTextOnOff(item.headline, true)) ?? message.headline ?? '',
                            );
                        }
                        break;
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
                    if (typeof list === 'string') {
                        list = list.split('?');
                    }
                    if (Array.isArray(list)) {
                        list.splice(48);
                    }
                } else {
                    list = [];
                }

                list = (list as string[]).map((a: string) => tools.formatInSelText(this.library.getTranslation(a)));

                message.list = (list as string[]).map(a => a.replace('?', '')).join('?');

                if (message.list && message.list.length > 900) {
                    message.list = message.list.slice(0, 900);
                    this.log.warn('Value list has more as 900 chars!');
                }
                const n = (await tools.getValueEntryNumber(item.entityInSel)) ?? 0;
                if (Array.isArray(list) && n != null && n < list.length) {
                    message.currentState = list[n];
                }

                if (mode !== 'popupThermo') {
                    break;
                }
                message = { ...message, type: 'popupThermo' };
                if (message.type === 'popupThermo') {
                    message.headline = this.library.getTranslation(
                        (await tools.getEntryTextOnOff(item.headline, true)) ?? message.headline ?? '',
                    );
                }

                break;
            }
            case 'popupNotify':
                break;
            case 'popupShutter': {
                if (entry.type !== 'shutter') {
                    break;
                }
                const item = entry.data;
                message.type = 'popupShutter';
                if (!(message.type === 'popupShutter')) {
                    break;
                }
                let pos1: 'disable' | number | boolean = (await tools.getValueEntryNumber(item.entity1)) ?? 'disable';
                if (pos1 === 'disable') {
                    pos1 = (await tools.getValueEntryBoolean(item.entity1)) ?? 'disable';
                }
                message.text2 =
                    (await tools.getEntryTextOnOff(item.text, typeof pos1 === 'boolean' ? pos1 : true)) ?? '';
                message.text2 = this.library.getTranslation(message.text2);
                let pos2 = (await tools.getValueEntryNumber(item.entity2)) ?? 'disable';
                if (pos1 !== 'disable') {
                    pos1 = !this.adapter.config.shutterClosedIsZero && typeof pos1 === 'number' ? 100 - pos1 : pos1;
                    message.icon = (await tools.getIconEntryValue(item.icon, pos1, '')) ?? '';
                } else if (typeof pos2 !== 'string') {
                    pos2 = !this.adapter.config.shutterClosedIsZero && typeof pos2 === 'number' ? 100 - pos2 : pos2;
                    message.icon = (await tools.getIconEntryValue(item.icon, pos2, '')) ?? '';
                }
                const optionalValue = item.valueList
                    ? await item.valueList.getObject()
                    : [
                          'arrow-up', //up
                          'stop', //stop
                          'arrow-down', //down
                          'arrow-top-right', //t-up
                          'stop', //t-stop
                          'arrow-bottom-left', //t-down
                      ];
                const arr = [pos1, pos2];
                for (let index = 0; index < arr.length; index++) {
                    const pos = arr[index];
                    if (pos == 'disable') {
                        continue;
                    }

                    const i = index * 3;

                    let optionalValueC =
                        Array.isArray(optionalValue) && optionalValue.every(a => typeof a === 'string')
                            ? [...optionalValue]
                            : ['', '', ''];
                    optionalValueC = optionalValueC.splice(i, 3).map(a => (a ? Icons.GetIcon(a) : a));
                    optionalValueC.forEach((a, i) => {
                        if (a) {
                            optionalValueC[i + 3] = this.tempData[i] ? 'enable' : 'disable';
                        } else {
                            optionalValueC[i] = '';
                            optionalValueC[i + 3] = 'disable';
                        }
                    });
                    if (index === 0) {
                        message.pos1 = typeof pos === 'boolean' ? 'disable' : String(pos);
                        message.pos1text = (await tools.getEntryTextOnOff(item.text1, true)) ?? '';
                        message.pos1text = this.library.getTranslation(message.pos1text);
                        message.iconL1 = optionalValueC[0];
                        message.iconM1 = optionalValueC[1];
                        message.iconR1 = optionalValueC[2];
                        if (this.config.role == 'gate') {
                            message.statusL1 = (typeof pos === 'boolean' ? false : pos === 100)
                                ? 'disable'
                                : optionalValueC[3];
                            message.statusM1 = (typeof pos === 'boolean' ? pos : pos === 'disabled')
                                ? 'disable'
                                : optionalValueC[4];
                            message.statusR1 = (typeof pos === 'boolean' ? !pos : pos === 0)
                                ? 'disable'
                                : optionalValueC[5];
                        } else {
                            message.statusL1 = (typeof pos === 'boolean' ? false : pos === 100)
                                ? 'disable'
                                : optionalValueC[3];
                            message.statusM1 = (typeof pos === 'boolean' ? pos : pos === 'disabled')
                                ? 'disable'
                                : optionalValueC[4];
                            message.statusR1 = (typeof pos === 'boolean' ? !pos : pos === 0)
                                ? 'disable'
                                : optionalValueC[5];
                        }
                    } else {
                        // tilt Slider
                        message.pos2 = typeof pos === 'boolean' ? 'disable' : String(pos);
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
            case 'popupShutter2': {
                if (entry.type !== 'shutter2') {
                    break;
                }
                const item = entry.data;
                message.type = 'popupShutter2';
                if (!(message.type === 'popupShutter2')) {
                    break;
                }
                let pos1: null | number | boolean = await tools.getValueEntryNumber(item.entity1);
                if (pos1 == null) {
                    pos1 = await tools.getValueEntryBoolean(item.entity1);
                }
                message.pos1 =
                    pos1 == null || typeof pos1 === 'boolean'
                        ? 'disable'
                        : this.adapter.config.shutterClosedIsZero && typeof pos1 === 'number'
                          ? (100 - pos1).toFixed()
                          : pos1.toFixed();
                message.text2 =
                    (await tools.getEntryTextOnOff(item.text, typeof pos1 === 'boolean' ? pos1 : true)) ?? '';
                message.text2 = this.library.getTranslation(message.text2);

                message.iconT1 = Icons.GetIcon('arrow-up');
                message.iconM1 = Icons.GetIcon('stop');
                message.iconB1 = Icons.GetIcon('arrow-down');
                message.statusT1 = item?.up ? 'enable' : 'disable';
                message.statusM1 = item?.stop ? 'enable' : 'disable';
                message.statusB1 = item?.down ? 'enable' : 'disable';
                message.pos1text = this.library.getTranslation(message.pos1text);

                if (item.entity2) {
                    let val: number | boolean | null = await tools.getValueEntryNumber(item.entity2);
                    if (val === null || val === undefined) {
                        val = await tools.getValueEntryBoolean(item.entity2);
                    }
                    message.iconT2 = (await tools.getIconEntryValue(item.icon2, val ?? true, 'window-open')) ?? '';
                    message.iconT2Color = (await tools.getIconEntryColor(item.icon2, pos1, Color.White)) ?? '';
                    message.iconT2Enable = 'enable';
                }
                if (item.entity3) {
                    let val: number | boolean | null = await tools.getValueEntryNumber(item.entity3);
                    if (val === null || val === undefined) {
                        val = await tools.getValueEntryBoolean(item.entity3);
                    }
                    if (val === null || val === undefined) {
                        val = true;
                    }
                    message.iconM2 = (await tools.getIconEntryValue(item.icon3, val, 'window-open')) ?? '';
                    message.iconM2Color = (await tools.getIconEntryColor(item.icon3, val, Color.White)) ?? '';
                    message.iconM2Enable = 'enable';
                }
                if (item.entity4) {
                    let val: number | boolean | null = await tools.getValueEntryNumber(item.entity4);
                    if (val === null || val === undefined) {
                        val = await tools.getValueEntryBoolean(item.entity4);
                    }
                    message.iconB2 = (await tools.getIconEntryValue(item.icon4, val, 'window-open')) ?? '';
                    message.iconB2Color = (await tools.getIconEntryColor(item.icon4, val, Color.White)) ?? '';
                    message.iconB2Enable = 'enable';
                }
                break;
            }
            case 'popupTimer': {
                if (entry.type !== 'timer') {
                    break;
                }
                const item = entry.data;
                message.type = 'popupTimer';
                if (!(message.type === 'popupTimer')) {
                    break;
                }
                if (this.tempData) {
                    const popup = await this.getTimerPopupState(item);
                    message.iconColor = await tools.GetIconColor(item.icon, popup.on);
                    message.minutes = popup.minutes;
                    message.seconds = popup.seconds;
                    message.editable = popup.editable ? '1' : '0';
                    const [first, second, third] = popup.buttons;
                    message.action1 = first?.action ?? '';
                    message.action2 = second?.action ?? '';
                    message.action3 = third?.action ?? '';
                    message.text1 = first ? this.library.getTranslation(first.text) : '';
                    message.text2 = second ? this.library.getTranslation(second.text) : '';
                    message.text3 = third ? this.library.getTranslation(third.text) : '';
                }
                break;
            }
            case 'popupSlider': {
                if (entry.type !== 'number') {
                    break;
                }
                const item = entry.data;
                message.type = 'popupSlider';
                if (!(message.type === 'popupSlider')) {
                    break;
                }
                type EntityKey = '1' | '2' | '3';
                for (let a = 1; a <= 3; a++) {
                    const b = (['1', '2', '3'] as EntityKey[])[a - 1];
                    const entity = item[`entity${b}`];
                    if (!entity || !entity.value) {
                        continue;
                    }
                    let v = await tools.getScaledNumber(entity);
                    message[`hSlider${b}CurVal`] = String(v ?? '');
                    message[`hSlider${b}Visibility`] = 'enable';
                    const heading = item[`heading${b}`];
                    if (heading) {
                        message[`tSlider${b}`] = this.library.getTranslation((await heading.getString()) ?? '');
                    }
                    message[`tIconS${b}M`] = Icons.GetIcon('minus-box');
                    message[`tIconS${b}P`] = Icons.GetIcon('plus-box');

                    const minValue = item[`minValue${b}`];
                    let min = 0; // default value
                    if (minValue) {
                        min = (await minValue.getNumber()) ?? 0;
                    } else if (entity && entity.value && entity.value.common.min != undefined) {
                        min = entity.value.common.min;
                    }
                    message[`hSlider${b}MinVal`] = String(min);

                    const maxValue = item[`maxValue${b}`];
                    let max = 100;
                    if (maxValue) {
                        max = (await maxValue.getNumber()) ?? 100;
                    } else if (entity && entity.value && entity.value.common.max != undefined) {
                        max = entity.value.common.max;
                    }
                    message[`hSlider${b}MaxVal`] = String(max);
                    v = v != null ? Color.scale(v, 0, 100, min, max) : v;
                    message[`hSlider${b}CurVal`] = String(v ?? '');
                    const steps = item[`steps${b}`];
                    message[`hSlider${b}Step`] = '1'; // default value
                    if (steps) {
                        message[`hSlider${b}Step`] = String((await steps.getNumber()) ?? '1');
                    } else if (entity && entity.value && entity.value.common.step != undefined) {
                        message[`hSlider${b}Step`] = String(entity.value.common.step);
                    }

                    const zero = item[`zero${b}`];
                    if (zero) {
                        message[`hSlider${b}ZeroVal`] = String((await zero.getNumber()) ?? '');
                    }
                }
                break;
            }
            default: {
                // Exhaustiveness check
                const _exhaustiveCheck: never = mode;
                return _exhaustiveCheck;
            }
        }

        //if (template.type !== message.type) {
        //    throw new Error(`Template ${template.type} is not ${message.type} for role: ${this.config.role}`);
        //}
        return this.getDetailPayload(message);
    }

    getLogname(): string {
        return this.parent ? `${this.parent.name}.${this.id}` : this.id;
    }
    async delete(): Promise<void> {
        this.unload = true;
        this.parent.setTimerTick(this, false);
        if (this.parent.basePanel != null && this.parent.basePanel.persistentPageItems != null) {
            if (this.parent.basePanel.persistentPageItems[this.id]) {
                if (!this.parent.basePanel.unload) {
                    if (this.tempData?.role === 'timer' || this.clockSourceListeners.size > 0) {
                        // it stays alive: it keeps counting and reporting while its page is not shown
                        this.unload = false;
                    }
                    return;
                }

                delete this.parent.basePanel.persistentPageItems[this.id];
            }
        }
        for (const key of Object.keys(this.timeouts)) {
            if (this.timeouts[key] == undefined) {
                continue;
            }
            this.adapter.clearTimeout(this.timeouts[key]);
        }
        this.clearInternalEnd();
        this.clockTimerSaver?.removeClockTimerListener(this.onClockTimerChange);
        this.clockTimerSaver = undefined;
        this.visibility = false;
        this.unload = true;
        await this.controller.statesControler.deactivateTrigger(this);
        await this.controller.statesControler.deletePageLoop();
        await super.delete();
    }
    async onCommandLongPress(action: string, value: string): Promise<boolean> {
        if (value === undefined || this.dataItems === undefined) {
            return false;
        }
        const entry = this.dataItems;
        if (action.startsWith('mode-')) {
            action = 'mode';
        }
        let done = false;
        switch (action) {
            case 'button': {
                if (entry.type === 'button' || entry.type === 'switch') {
                    this.log.debug(`Button ${this.id} was long pressed!`);
                    const item = entry.data;
                    const value: any = (item.setNaviLongPress && (await item.setNaviLongPress.getString())) ?? null;
                    if (value !== null) {
                        await this.parent.basePanel.navigation.setTargetPageByName(value);
                        done = true;
                    }
                    if (item.longPress) {
                        // longPressMode (screensaver indicator, always a button) overrides the type of the item
                        const mode = item.longPressMode ? await item.longPressMode.getString() : null;
                        const push = mode === 'push' || (mode !== 'toggle' && entry.type === 'button');
                        if (push) {
                            await item.longPress.setStateTrue();
                        } else {
                            await item.longPress.setStateFlip();
                        }
                        // an executed long press must never trigger the short press as well
                        done = true;
                    }
                }
            }
        }
        return done;
    }

    /**
     * A button with a value list (screensaver indicator): writes the next value of the list to the state, also when
     * the list has one value only or the value is already set.
     *
     * @param target state to write
     * @param list the values, a JSON array of texts
     * @returns true when the press was handled, false when the item is no such button
     */
    private async writeNextCycleValue(target: Dataitem | undefined, list: Dataitem | undefined): Promise<boolean> {
        if (!target?.writeable || !list) {
            return false;
        }
        const raw = await list.getObject();
        if (!Array.isArray(raw) || raw.length === 0) {
            return false;
        }
        const values = raw.map(v => String(v));
        const type = target.trueType();
        const current = await target.getState();
        const index = nextCycleIndex(values, current?.val, type, this.cycleLastIndex);
        const value = cycleValueToState(values[index], type);
        if (value === null) {
            this.log.warn(`Button ${this.id}: the value "${values[index]}" does not fit the state type ${type}!`);
            return true;
        }
        await target.setState(value);
        this.cycleLastIndex = index;
        return true;
    }

    async onCommand(action: string, value: string): Promise<boolean> {
        if (value === undefined || this.dataItems === undefined) {
            return false;
        }
        const entry = this.dataItems;
        /** value of the event as sent - a `case` below has its own `value` */
        const eventValue = value;
        if (action.startsWith('mode-')) {
            action = 'mode';
        }
        switch (action) {
            case 'mode-preset_modes':
            case 'mode':
                {
                    if (entry.data && !('entityInSel' in entry.data)) {
                        break;
                    }
                    await this.setListCommand(entry, value);
                }

                break;

            case 'button': {
                if (this.parent.isScreensaver && !(this.parent as Screensaver).isIndicatorKey(this)) {
                    // TFT 6.0.8+ sends the taps as value: the screensaver only passes keys
                    // (Screensaver.onIndicatorTap); an older TFT sends every tap here - an indicator without an
                    // action counts like a touch of the background and opens the main page, it never writes a state
                    if (eventValue === '') {
                        this.parent.basePanel.navigation.resetPosition();
                        await this.parent.basePanel.navigation.setCurrentPage();
                    }
                    break;
                }
                if (entry.type === 'button' || entry.type === 'switch') {
                    this.log.debug(`Button ${this.id} was pressed!`);
                    if (
                        entry.type === 'button' &&
                        (await this.writeNextCycleValue(entry.data.setValue3, entry.data.valueList))
                    ) {
                        break;
                    }
                    if (entry.role === 'indicator') {
                        if (this.parent.card === 'cardThermo') {
                            this.log.debug(`Button indicator ${this.id} was pressed!`);
                            await this.parent.update();
                        }
                        break;
                    }
                    if (entry.role === 'repeatValue') {
                        const v = await entry.data.entity1?.value?.getString();
                        if (v != null && entry.data.entity1?.set?.writeable) {
                            await entry.data.entity1.set.setState(v);
                        } else if (v != null && entry.data.entity1?.value?.writeable) {
                            await entry.data.entity1.value.setState(v);
                        }
                        break;
                    }
                    if (entry.role === 'SonosSpeaker' || entry.role === 'SqueezeboxSpeaker') {
                        if (!this.parent || !(this.parent.config?.card === 'cardMedia')) {
                            break;
                        }
                        if (this.parent.directChildPage) {
                            this.log.debug(
                                `Button with role:selectGrid id:${this.id} show Page:${this.parent.directChildPage.id}`,
                            );
                            await this.parent.basePanel.setActivePage(this.parent.directChildPage);
                        } else if (this.parent.config) {
                            this.log.debug(`Create temp page for Button with role:selectGrid id:${this.id}`);

                            const list = await entry.data.entity3?.value?.getObject();

                            const tempConfig: PageInterface = {
                                id: `temp253451_${this.parent.id}`,
                                name: `sub_${this.parent.name}`,
                                adapter: this.adapter,
                                panel: this.parent.basePanel,
                                card:
                                    list == null ||
                                    !Array.isArray(list) ||
                                    list.length == 0 ||
                                    (list.length > 4 && list.length <= 6) ||
                                    (list.length > 8 && list.length <= 12)
                                        ? 'cardGrid'
                                        : list.length <= 4
                                          ? 'cardGrid3'
                                          : 'cardGrid2',
                            };

                            const pageConfig: PageBase = {
                                uniqueID: `temp253451_${this.parent.id}`,
                                alwaysOn: this.parent.alwaysOn,
                                items: undefined,
                                dpInit: this.parent.config.ident, // important a string not regexp
                                config: {
                                    card: 'cardGrid2',
                                    cardRole: entry.role,
                                    options: {
                                        cardRoleList: list as string[],
                                    },
                                    data: {
                                        headline: {
                                            type: 'const',
                                            constVal: 'speakerList',
                                        },
                                    },
                                },
                                pageItems: [],
                            };

                            this.parent.directChildPage = this.parent.basePanel.newPage(tempConfig, pageConfig);
                            if (this.parent.directChildPage) {
                                this.parent.directChildPage.directParentPage = this.parent;
                                await this.parent.directChildPage.init();
                                await this.parent.basePanel.setActivePage(this.parent.directChildPage);
                            }
                        }
                        break;
                    }

                    const item = entry.data;
                    if (item.confirm) {
                        if (this.confirmClick === 'lock') {
                            this.confirmClick = 'unlock';
                            await this.parent.update();
                            this.timeouts.confirmTimeout = this.adapter.setTimeout(() => {
                                this.confirmClick = 'lock';
                                void this.parent.update();
                            }, 3000);
                            return true;
                        } else if (this.confirmClick === 'unlock' || this.confirmClick - 300 > Date.now()) {
                            return true;
                        }
                        if (this.timeouts.confirmTimeout) {
                            this.adapter.clearTimeout(this.timeouts.confirmTimeout);
                        }
                        this.confirmClick = 'lock';
                        await this.parent.update();
                    }
                    if (item.popup) {
                        const test = (item.popup.isActive && (await item.popup.isActive.getBoolean())) ?? true;
                        if (test && item.popup.getMessage && item.popup.setMessage) {
                            const message = await item.popup.getMessage.getString();
                            const headline =
                                (item.popup.getHeadline && (await item.popup.getHeadline.getString())) ?? '';
                            if (message) {
                                await item.popup.setMessage.setState(
                                    JSON.stringify({ headline: headline, message: message }),
                                );
                            }
                        }
                        break;
                    }
                    let value: any = (item.setNavi && (await item.setNavi.getString())) ?? null;
                    let nav = false;
                    if (value !== null) {
                        await this.parent.basePanel.navigation.setTargetPageByName(value);
                        nav = true;
                    }

                    // a screensaver indicator only runs the actions configured at it: a state that is merely
                    // writable (shown state, setTrue/setFalse) is never switched (Screensaver.isIndicatorKey)
                    const implicit = !this.parent.isScreensaver;
                    if (implicit && item.entity1 && item.entity1.set && item.entity1.set.writeable) {
                        await item.entity1.set.setStateFlip();
                        break;
                    }
                    if (
                        implicit &&
                        item.setTrue &&
                        item.setFalse &&
                        item.setTrue.writeable &&
                        item.setFalse.writeable
                    ) {
                        value = (item.entity1 && (await item.entity1.value?.getBoolean())) ?? false;
                        if (value) {
                            await item.setFalse.setStateTrue();
                        } else {
                            await item.setTrue.setStateTrue();
                        }
                        break;
                    }

                    if (item.setValue1 && item.setValue1.writeable) {
                        await item.setValue1.setStateFlip();
                        break;
                    }
                    if (item.setValue2 && item.setValue2.writeable) {
                        await item.setValue2.setStateTrue();
                        break;
                    }
                    // a blind (screensaver item) shows its position only - a tap never moves it
                    if (nav || !implicit || entry.role === 'blind') {
                        break;
                    }
                    if (item.entity1?.value?.writeable) {
                        await item.entity1.value.setStateFlip();
                        break;
                    }
                } else if (entry.type === 'light' || entry.type === 'light2') {
                    if (entry.role === 'volume.mute') {
                        const value: boolean | null =
                            (entry.data.entity1?.value && (await entry.data.entity1.value.getBoolean())) ?? null;
                        if (value) {
                            await entry.data.setValue2?.setStateTrue();
                        } else {
                            await entry.data.setValue1?.setStateTrue();
                        }
                        break;
                    }
                    const item = entry.data;
                    item.entity1 && item.entity1.set && (await item.entity1.set.setStateFlip());
                    item.setValue1 && (await item.setValue1.setStateFlip());
                } else if (entry.type === 'number') {
                    const item = entry.data;
                    if (item && item.switch1 && item.switch1.writeable) {
                        await item.switch1.setStateFlip();
                    }
                } else if (entry.type === 'fan') {
                    const item = entry.data;
                    if (item.entity1?.set) {
                        await item.entity1.set.setStateFlip();
                    } else if (item.entity1?.value?.writeable) {
                        await item.entity1.value.setStateFlip();
                    }
                }
                break;
            }
            case 'brightnessSlider': {
                if (entry.type === 'light' || entry.type === 'light2') {
                    const item = entry.data;
                    if (this.timeouts.brightnessSlider) {
                        this.adapter.clearTimeout(this.timeouts.brightnessSlider);
                    }
                    if (this.unload || this.adapter.unload) {
                        break;
                    }
                    this.timeouts.brightnessSlider = this.adapter.setTimeout(
                        async (item, value) => {
                            if (item?.dimmer?.value?.writeable || item?.dimmer?.set?.writeable) {
                                await tools.setScaledNumber(item.dimmer, parseInt(value));
                            } else {
                                this.log.warn('Dimmer is not writeable!');
                            }
                        },
                        150,
                        item,
                        value,
                    );
                }
                break;
            }
            case 'button1Press':
            case 'button2Press':
            case 'button3Press': {
                if (entry.type === 'shutter2') {
                    const item = entry.data;
                    let entity = item.entity4;
                    if (action === 'button1Press') {
                        entity = item.entity2;
                    } else if (action === 'button2Press') {
                        entity = item.entity3;
                    }

                    if (entity && entity.set && entity.set.writeable) {
                        if (!Array.isArray(entity.set.options.role) && entity.set.options.role?.startsWith('button')) {
                            await entity.set.setStateTrue();
                        } else if (
                            !Array.isArray(entity.set.options.role) &&
                            entity.set.options.role?.startsWith('switch')
                        ) {
                            await entity.set.setStateFlip();
                        }
                    }
                }
                break;
            }
            case 'colorTempSlider': {
                if (entry.type === 'light' || entry.type === 'light2') {
                    const item = entry.data;
                    if (this.timeouts.colorTempSlider) {
                        this.adapter.clearTimeout(this.timeouts.colorTempSlider);
                    }
                    if (this.unload || this.adapter.unload) {
                        break;
                    }
                    this.timeouts.colorTempSlider = this.adapter.setTimeout(
                        async (item: typeof entry.data, value) => {
                            if (item && item.White && item.White.value) {
                                await tools.setScaledNumber(item.White, parseInt(value));
                            }
                            if (item && item.ct && item.ct.value && item.ct.value.writeable) {
                                const ct = await tools.getSliderCTFromValue(item.ct);
                                if (ct !== null && String(ct) != value) {
                                    await tools.setSliderCTFromValue(item.ct, parseInt(value));
                                }
                            } else {
                                this.log.warn(
                                    `ct ${item.ct && item.ct.value ? item.ct.value.options.dp : ''} is not writeable!`,
                                );
                            }
                        },
                        150,
                        item,
                        value,
                    );
                }
                break;
            }
            case 'OnOff': {
                if (
                    entry.type === 'light' ||
                    entry.type === 'light2' ||
                    entry.type === 'button' ||
                    entry.type === 'switch' ||
                    entry.type === 'fan'
                ) {
                    if (entry.type === 'light' && entry.role === 'volume.mute') {
                        if (value !== '1') {
                            await entry.data.setValue2?.setStateTrue();
                        } else {
                            await entry.data.setValue1?.setStateTrue();
                        }
                        break;
                    }
                    const item = entry.data;
                    if (item && item.entity1) {
                        await tools.setValueEntry(item.entity1, value === '1');
                    } else {
                        this.log.warn('entity1 is not writeable!');
                    }
                }
                break;
            }
            case 'colorWheel': {
                if (entry.type === 'light' || entry.type === 'light2') {
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
                            case 'rgbThree': {
                                const rgb = Color.resultToRgb(value);
                                await tools.setRGBThreefromRGB(item, rgb);
                                break;
                            }
                            case 'rgbSingle': {
                                const rgb = Color.resultToRgb(value);
                                if (
                                    Color.isRGB(rgb) &&
                                    item?.color?.true &&
                                    item.color.true.options.role !== 'level.color.rgb'
                                ) {
                                    await item.color.true.setState(JSON.stringify(rgb));
                                    break;
                                }
                                // jump to next case if we have a rgb.hex
                            }
                            // eslint-disable-next-line no-fallthrough
                            case 'rgb.hex': {
                                const rgb = Color.resultToRgb(value);
                                if (Color.isRGB(rgb)) {
                                    item.color &&
                                        item.color.true &&
                                        (await item.color.true.setState(Color.ConvertRGBtoHex(rgb.r, rgb.g, rgb.b)));
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
                if (entry.type !== 'shutter') {
                    break;
                }
                if (entry.data.up2 && entry.data.up2.writeable) {
                    await entry.data.up2.setStateTrue();
                    break;
                }
            }

            // eslint-disable-next-line no-fallthrough
            case 'tiltClose': {
                if (entry.type !== 'shutter') {
                    break;
                }
                if (action === 'tiltClose' && entry.data.down2 && entry.data.down2.writeable) {
                    await entry.data.down2.setStateTrue();
                    break;
                }
            }
            // eslint-disable-next-line no-fallthrough
            case 'tiltStop': {
                if (entry.type !== 'shutter') {
                    break;
                }
                if (action === 'tiltStop' && entry.data.stop2 && entry.data.stop2.writeable) {
                    await entry.data.stop2.setStateTrue();
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
                                        if (value !== null) {
                                            await tools.setValueEntry(items.entity2, value);
                                        }
                                    }
                                    break;
                                }
                                case 'tiltStop': {
                                    if (tools.ifValueEntryIs(items.entity2, 'number')) {
                                        const value = await tools.getValueEntryNumber(items.entity2);
                                        if (value !== null) {
                                            await tools.setValueEntry(items.entity2, value);
                                        }
                                    }
                                    break;
                                }
                                case 'tiltClose': {
                                    if (tools.ifValueEntryIs(items.entity2, 'number')) {
                                        const value = await items.entity2.minScale.getNumber();
                                        if (value !== null) {
                                            await tools.setValueEntry(items.entity2, value);
                                        }
                                    }
                                    break;
                                }
                            }
                        } else if (items.entity2.value.type === 'boolean') {
                            if (action !== 'tiltStop') {
                                await items.entity2.value.setStateFlip();
                            }
                        }
                    }
                }

                break;
            }

            case 'up': {
                if (entry.type !== 'shutter' && entry.type !== 'shutter2') {
                    break;
                }
                if (entry.data.up && entry.data.up.writeable) {
                    await entry.data.up.setStateTrue();
                    break;
                }
            }
            // eslint-disable-next-line no-fallthrough
            case 'stop': {
                if (entry.type !== 'shutter' && entry.type !== 'shutter2') {
                    break;
                }
                if (action === 'stop' && entry.data.stop && entry.data.stop.writeable) {
                    await entry.data.stop.setStateTrue();
                    break;
                }
            }
            // eslint-disable-next-line no-fallthrough
            case 'down': {
                if (entry.type === 'shutter' || entry.type === 'shutter2') {
                    if (action === 'down' && entry.data.down && entry.data.down.writeable) {
                        await entry.data.down.setStateTrue();
                        break;
                    }

                    if (entry.type === 'shutter') {
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
                        }
                    }
                    const items = entry.data;
                    if (items.entity1 && items.entity1.value && items.entity1.minScale && items.entity1.maxScale) {
                        if (items.entity1.value.type === 'number') {
                            switch (action) {
                                case 'up': {
                                    if (tools.ifValueEntryIs(items.entity1, 'number')) {
                                        const value = await items.entity1.maxScale.getNumber();
                                        if (value !== null) {
                                            await tools.setValueEntry(items.entity1, value);
                                        }
                                    }
                                    break;
                                }
                                case 'stop': {
                                    if (tools.ifValueEntryIs(items.entity1, 'number')) {
                                        const value = await tools.getValueEntryNumber(items.entity1);
                                        if (value !== null) {
                                            await tools.setValueEntry(items.entity1, value);
                                        }
                                    }
                                    break;
                                }
                                case 'down': {
                                    if (tools.ifValueEntryIs(items.entity1, 'number')) {
                                        const value = await items.entity1.minScale.getNumber();
                                        if (value !== null) {
                                            await tools.setValueEntry(items.entity1, value);
                                        }
                                    }
                                    break;
                                }
                            }
                        } else if (items.entity1.value.type === 'boolean') {
                            if (action !== 'stop') {
                                await items.entity1.value.setStateFlip();
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
                    if (tools.ifValueEntryIs(items.entity1, 'number')) {
                        let v = parseInt(value.trim());
                        v = !this.adapter.config.shutterClosedIsZero ? 100 - v : v;
                        await tools.setValueEntry(items.entity1, v);
                    }
                } else if (entry.type === 'shutter2') {
                    const items = entry.data;
                    if (tools.ifValueEntryIs(items.entity1, 'number')) {
                        let v = parseInt(value.trim());
                        v = this.adapter.config.shutterClosedIsZero ? 100 - v : v;
                        await tools.setValueEntry(items.entity1, v);
                    }
                }
                break;
            }
            /**
             * zu 100% geschlossen zu 0% geschlossen
             */
            case 'tiltSlider': {
                if (entry.type === 'shutter') {
                    const items = entry.data;
                    if (tools.ifValueEntryIs(items.entity2, 'number')) {
                        let v = parseInt(value.trim());
                        v = !this.adapter.config.shutterClosedIsZero ? 100 - v : v;
                        await tools.setValueEntry(items.entity2, v);
                    }
                }
                break;
            }
            case 'positionSlider1':
            case 'positionSlider2':
            case 'positionSlider3': {
                if (entry.type !== 'number') {
                    break;
                }
                const item = entry.data;
                type EntityKey = '1' | '2' | '3';
                for (let a = 1; a <= 3; a++) {
                    const b = (['1', '2', '3'] as EntityKey[])[a - 1];
                    if (action === `positionSlider${b}` && item[`entity${b}`]) {
                        const entity = item[`entity${b}`];
                        if (entity) {
                            {
                                let v = parseInt(value.trim());
                                const minValue = item[`minValue${b}`];
                                let min = 0; // default value
                                if (minValue) {
                                    min = (await minValue.getNumber()) ?? 0;
                                } else if (entity && entity.value && entity.value.common.min != undefined) {
                                    min = entity.value.common.min;
                                }

                                const maxValue = item[`maxValue${b}`];
                                let max = 100;
                                if (maxValue) {
                                    max = (await maxValue.getNumber()) ?? 100;
                                } else if (entity && entity.value && entity.value.common.max != undefined) {
                                    max = entity.value.common.max;
                                }

                                v = v != null ? Color.scale(v, min, max, 0, 100) : v;
                                await tools.setScaledNumber(entity, Math.round(v));
                            }
                        }
                    }
                }
                break;
            }
            case 'number-set': {
                if (this.timeouts['number-set']) {
                    this.adapter.clearTimeout(this.timeouts['number-set']);
                }
                if (this.unload || this.adapter.unload) {
                    break;
                }

                if (entry.type === 'number') {
                    this.timeouts['number-set'] = this.adapter.setTimeout(
                        async value => {
                            await tools.setValueEntry(entry.data.entity1, parseInt(value), false);
                        },
                        150,
                        value,
                    );
                } else if (entry.type === 'fan') {
                    this.timeouts['number-set'] = this.adapter.setTimeout(
                        async value => {
                            await tools.setValueEntry(entry.data.speed, parseInt(value), false);
                        },
                        150,
                        value,
                    );
                }
                break;
            }
            case 'timer-begin': {
                if (this.tempData?.role === 'ss-timer') {
                    await this.parent.basePanel.screenSaver?.startClockTimer(this.tempData.editSeconds);
                    break;
                }
                if (this.tempData?.role === 'timer') {
                    await this.startInternalTimer();
                    break;
                }
                if (this.dataItems && this.dataItems.type == 'timer' && this.dataItems.data) {
                    this.dataItems.data.setValue2 && (await this.dataItems.data.setValue2.setState(2));
                }
                break;
            }

            case 'timer-start': {
                const input = parseTimerInput(value);
                if (!input || !this.tempData) {
                    break;
                }
                const seconds = input[0] * 3600 + input[1] * 60 + input[2];
                const data = this.dataItems?.type === 'timer' ? this.dataItems.data : undefined;
                const set = data && this.getTimerWriteState(data);
                switch (this.tempData.role) {
                    case 'ss-timer': {
                        this.tempData.editSeconds = seconds;
                        if (this.visibility) {
                            await this.onStateTrigger();
                        }
                        break;
                    }
                    case 'ex-alarm': {
                        await set?.setState(nextAlarmTs(input[1], input[2], Date.now()));
                        break;
                    }
                    case 'ex-timer': {
                        await set?.setState(timerValueOf(seconds, set.common.unit));
                        break;
                    }
                    case 'timer': {
                        this.clearInternalEnd();
                        this.tempData.value = seconds;
                        this.tempData.status = 'stop';
                        if (set) {
                            const raw = timerValueOf(seconds, set.common.unit);
                            this.tempData.ownSet = raw;
                            await set.setState(raw);
                        }
                        await this.onInternalTimerChanged();
                        break;
                    }
                }
                break;
            }
            case 'timer-finish':
            case 'timer-clear': {
                if (this.tempData?.role === 'ss-timer') {
                    await this.parent.basePanel.screenSaver?.stopClockTimer();
                    break;
                }
                const data = this.dataItems?.type === 'timer' ? this.dataItems.data : undefined;
                // an expired internal timer reported its end already
                const reported = this.tempData?.status === 'expired';
                if (this.tempData?.role !== 'timer') {
                    await data?.setValue2?.setState(0);
                }
                switch (this.tempData?.role) {
                    case 'ex-timer': {
                        const set = data?.entity1?.set;
                        const actual = data?.entity1?.value;
                        if (set?.writeable) {
                            await set.setState(0);
                        }
                        if (actual?.writeable) {
                            await actual.setState(0);
                        }
                        break;
                    }
                    case 'timer': {
                        this.clearInternalEnd();
                        this.tempData.value = 0;
                        this.tempData.status = 'stop';
                        break;
                    }
                }
                // only finish reports the end: cancel and clear do not
                if (action === 'timer-finish' && !reported) {
                    await data?.setValue1?.setStateTrue();
                }
                if (this.tempData?.role === 'timer') {
                    await this.onInternalTimerChanged();
                } else {
                    this.notifyClockSource();
                }
                break;
            }
            case 'timer-pause': {
                if (this.tempData?.role === 'ss-timer') {
                    break;
                }
                if (this.tempData?.role === 'timer') {
                    this.clearInternalEnd();
                    this.tempData.value = this.internalSeconds();
                    this.tempData.status = 'pause';
                    await this.onInternalTimerChanged();
                    break;
                }
                if (this.dataItems && this.dataItems.type == 'timer' && this.dataItems.data) {
                    this.dataItems.data.setValue2 && (await this.dataItems.data.setValue2.setState(1));
                }
                break;
            }
            default: {
                return false;
            }
        }
        return true;
    }
    protected async onStateTrigger(id: string = '', from?: BaseTriggeredPage): Promise<void> {
        if (this.lastPopupType) {
            if (this.lastPopupType === 'popupThermo') {
                await this.parent.onPopupRequest(this.id, 'popupThermo', '', '', null);
                return;
            }
            const msg = await this.GeneratePopup(this.lastPopupType);
            if (msg) {
                this.sendToPanel(msg, false);
            }
        }
        if (
            from &&
            this.parent.basePanel.isOnline &&
            this.parent === this.parent.basePanel.screenSaver &&
            this.parent.basePanel.screenSaver
        ) {
            await this.parent.basePanel.screenSaver.onStateTrigger(id, from);
        }
    }
    async getListCommands(setList: Dataitem | undefined): Promise<NSPanel.listCommand[] | null> {
        if (!setList) {
            return null;
        }
        let list: NSPanel.listCommand[] | null = (await setList.getObject()) as NSPanel.listCommand[] | null;
        if (list === null) {
            const temp = await setList.getString();
            if (temp === null) {
                return null;
            }
            list = temp.split('|').map((a: string): NSPanel.listCommand => {
                const t = a.split('?');
                return typePageItem.islistCommandUnion(t[2])
                    ? { id: t[0], value: t[1], command: t[2] }
                    : { id: t[0], value: t[1] };
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

    async setListCommand(entry: NSPanel.PageItemDataItems, value: string): Promise<boolean> {
        //if (entry.type !== 'input_sel') return false;
        const item = entry.data;
        if (!item || !('entityInSel' in item)) {
            return false;
        }

        const sList =
            item.entityInSel &&
            (await this.getListFromStates(
                item.entityInSel,
                item.valueList,
                entry.role,
                'valueList2' in item ? item.valueList2 : undefined,
            ));

        if (sList) {
            if (
                (entry.role === 'spotify-speaker' ||
                    entry.role === 'spotify-playlist' ||
                    entry.role === 'spotify-tracklist') &&
                sList.list !== undefined &&
                sList.list[parseInt(value)] !== undefined &&
                sList.states !== undefined &&
                sList.states[parseInt(value)] !== undefined &&
                item.entityInSel &&
                item.entityInSel.set
            ) {
                const v = parseInt(value);
                const index = sList.states[v] || -1;
                if (index !== -1) {
                    await item.entityInSel.set.setState(sList.states[v]);
                }
            } else if (
                entry.role === 'alexa-speaker' &&
                sList.list !== undefined &&
                sList.list[parseInt(value)] !== undefined &&
                item.entityInSel &&
                item.entityInSel.set
            ) {
                const v = parseInt(value);
                const index = sList.states?.[v] || -1;
                if ((this.parent as PageMedia).currentItem?.ident && (await (this.parent as PageMedia).isPlaying())) {
                    await this.adapter.setForeignStateAsync(
                        `${(this.parent as PageMedia).currentItem!.ident}.Commands.textCommand`,
                        `Schiebe Musik auf ${sList.list[v]}`,
                    );
                }
                if (index !== -1) {
                    this.parent.card == 'cardMedia' &&
                        (await (this.parent as PageMedia).updateCurrentPlayer(
                            this.tempData[index]?.id || '',
                            this.tempData[index]?.name || '',
                        ));
                }
                const msg = await this.GeneratePopup('popupInSel');
                if (msg) {
                    this.sendToPanel(msg, false);
                }

                return true;
            } else if (
                entry.role === 'alexa-playlist' &&
                sList.list !== undefined &&
                sList.list[parseInt(value)] !== undefined &&
                sList.states &&
                sList.states[parseInt(value)] !== undefined &&
                this.tempData.length > 0
            ) {
                const v = parseInt(value);
                if (this.dataItems?.type === 'input_sel' && this.dataItems.data.valueList) {
                    const dp = sList.states[v];
                    if (dp) {
                        await this.adapter.setForeignStateAsync(dp, sList.list[v], false);
                    }
                }
            } else if (
                sList.states !== undefined &&
                sList.states[parseInt(value)] !== undefined &&
                item.entityInSel &&
                item.entityInSel.value
            ) {
                // write to the SET state when there is a writeable one (role select: ACTUAL is read-only),
                // otherwise to value – for the light roles both are the same datapoint (inSel_Alias)
                const target =
                    item.entityInSel.set && item.entityInSel.set.writeable
                        ? item.entityInSel.set
                        : item.entityInSel.value;
                if (target.common?.type === 'number') {
                    await target.setState(parseInt(sList.states[parseInt(value)]));
                } else {
                    await target.setState(sList.states[parseInt(value)]);
                }
                return true;
            }
        }
        if (!item.setList) {
            if (item.entityInSel) {
                let list: string[] | string | object = (item.valueList && (await item.valueList.getObject())) ||
                    (item.valueList && (await item.valueList.getString())) || [
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
                    if (typeof list === 'string') {
                        list = list.split('?');
                    }
                    if (Array.isArray(list)) {
                        list.splice(48);
                    }
                } else {
                    list = [];
                }
                if (Array.isArray(list) && list.length > parseInt(value)) {
                    if (item.entityInSel.set && item.entityInSel.set.writeable) {
                        await item.entityInSel.set.setState(value);
                    } else if (item.entityInSel.value && item.entityInSel.value.writeable) {
                        await item.entityInSel.value.setState(value);
                    }
                    return true;
                }
            }
            return false;
        }
        const list = await this.getListCommands(item.setList);
        const v = value as keyof typeof list;
        if (list && list[v]) {
            try {
                const obj = await this.parent.basePanel.statesControler.getObjectAsync(list[v].id);
                if (!obj || !obj.common || obj.type !== 'state') {
                    throw new Error('Dont get obj!');
                }

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
                }
                this.log.error(`Try to set a null value to ${list[v].id}!`);
            } catch {
                this.log.error(`Id ${list[v].id} is not valid!`);
            }
        }
        return false;
    }
    /**
     * Requests the saved playlists of a squeezeboxrpc instance from the Logitech Media Server.
     *
     * @param inst - adapter instance, e.g. `squeezeboxrpc.0`
     * @returns list of playlists with id and name, empty on error
     */
    async getSqueezeboxPlaylists(inst: string): Promise<{ id: string; name: string }[]> {
        const result: { id: string; name: string }[] = [];
        let response: unknown;
        try {
            response = await this.adapter.sendToAsync(
                inst,
                'cmdGeneral',
                { playerid: '', cmdArray: ['playlists', '0', '999', 'tags:u'] },
                { timeout: 3000 },
            );
        } catch (e) {
            this.log.warn(`Squeezebox playlists from ${inst} failed: ${String(e)}`);
            return result;
        }
        const getLoop = (data: unknown): unknown => {
            if (!data || typeof data !== 'object') {
                return undefined;
            }
            if ('playlists_loop' in data) {
                return data.playlists_loop;
            }
            if ('result' in data) {
                return getLoop(data.result);
            }
            return undefined;
        };
        const loop = getLoop(response);
        if (!Array.isArray(loop)) {
            this.log.debug(`Squeezebox playlists from ${inst}: no playlists in response ${JSON.stringify(response)}`);
            return result;
        }
        for (const entry of loop) {
            if (entry && typeof entry === 'object' && 'id' in entry && 'playlist' in entry) {
                const name = typeof entry.playlist === 'string' ? entry.playlist : '';
                if (name && entry.id != null) {
                    result.push({ id: String(entry.id), name });
                }
            }
        }
        return result;
    }

    async getListFromStates(
        entityInSel: ChangeTypeOfKeys<NSPanel.ValueEntryType, Dataitem | undefined> | undefined,
        valueList: Dataitem | undefined,
        role: DeviceRole | undefined,
        valueList2: Dataitem | undefined = undefined,
        force: boolean = false,
    ): Promise<{ value?: string | undefined; list?: string[] | undefined; states?: string[] }> {
        const list: { value?: string | undefined; list?: string[] | undefined; states?: string[] } = {};

        if (entityInSel && entityInSel.value) {
            if (role === 'alexa-speaker') {
                // Alexa Speaker
                if (entityInSel.value.options.dp) {
                    list.list = [];
                    list.states = [];
                    for (const a in this.tempData) {
                        list.list.push(this.tempData[a].name);
                        list.states.push(this.tempData[a].name);
                    }
                    const dp = (this.parent as PageMedia).currentItem?.ident || entityInSel?.value?.options.dp || '';
                    const index = this.tempData.findIndex((a: any) => dp.includes(a.id));
                    if (index !== -1 && !list.value) {
                        list.value = this.tempData[index].name;
                    }
                }
            } else if (role === 'alexa-playlist') {
                // Alexa Playlist
                this.log.debug(`Get Alexa Playlist start`);
                if (this.dataItems?.type === 'input_sel' && this.dataItems.data.valueList) {
                    const raw = await this.dataItems.data.valueList.getObject();

                    if (!Array.isArray(raw) || !raw.every(v => typeof v === 'string')) {
                        this.log.error('Alexa playlist: valueList must be string[].');
                    } else {
                        const source = (this.tempData ?? []) as string[];
                        const listOut: string[] = [];
                        const statesOut: string[] = [];

                        for (const entry of raw) {
                            const sep = entry.indexOf('.');
                            if (sep <= 0 || sep >= entry.length - 1) {
                                this.log.warn(`Alexa playlist entry "${entry}" is invalid (expected "state.label").`);
                                continue;
                            }

                            const stateToken = entry.slice(0, sep).trim();
                            const label = entry.slice(sep + 1).trim();

                            const matchedState = source.find(s => s.includes(stateToken));
                            if (!matchedState) {
                                this.log.warn(
                                    `Alexa playlist: no matching state for token "${stateToken}" source "${source.join(', ')}".`,
                                );
                                continue;
                            }

                            listOut.push(label);
                            statesOut.push(matchedState);
                        }

                        list.list = listOut;
                        list.states = statesOut;
                        list.value = '';
                    }
                }
                this.log.debug(`Alexa Playlist list: finish`);
            } else if (role === 'squeezebox-favorites') {
                // Squeezebox favorites from squeezeboxrpc.X.Favorites.<id>.*
                const dp = 'dp' in entityInSel.value.options ? entityInSel.value.options.dp : '';
                const inst = (dp || '').split('.').slice(0, 2).join('.');
                if (inst) {
                    const filterRaw = valueList ? await valueList.getObject() : null;
                    const filter =
                        Array.isArray(filterRaw) && filterRaw.length > 0
                            ? filterRaw.filter((f): f is string => typeof f === 'string')
                            : null;
                    const states = await this.adapter.getForeignStatesAsync(`${inst}.Favorites.*`);
                    const favorites: Record<string, { name?: string; id?: string; isaudio?: boolean }> = {};
                    for (const id in states) {
                        const parts = id.split('.');
                        if (parts.length !== 5) {
                            continue;
                        }
                        const key = parts[3];
                        const prop = parts[4];
                        const val = states[id]?.val;
                        favorites[key] = favorites[key] ?? {};
                        if (prop === 'Name' && typeof val === 'string') {
                            favorites[key].name = val;
                        } else if (prop === 'id' && val != null) {
                            favorites[key].id = String(val);
                        } else if (prop === 'isaudio') {
                            favorites[key].isaudio = val === 1 || val === '1' || val === true;
                        }
                    }
                    list.list = [];
                    list.states = [];
                    for (const fav of Object.values(favorites)) {
                        if (!fav.isaudio || !fav.name || !fav.id) {
                            continue;
                        }
                        if (filter && !filter.includes(fav.name)) {
                            continue;
                        }
                        list.list.push(fav.name);
                        list.states.push(fav.id);
                    }
                    list.value = '';
                }
            } else if (role === 'squeezebox-playlist') {
                // Squeezebox saved playlists - requested from the LMS via sendTo
                const dp = 'dp' in entityInSel.value.options ? entityInSel.value.options.dp : '';
                const inst = (dp || '').split('.').slice(0, 2).join('.');
                if (inst) {
                    const filterRaw = valueList ? await valueList.getObject() : null;
                    const filter =
                        Array.isArray(filterRaw) && filterRaw.length > 0
                            ? filterRaw.filter((f): f is string => typeof f === 'string')
                            : null;
                    list.list = [];
                    list.states = [];
                    list.value = '';
                    for (const playlist of await this.getSqueezeboxPlaylists(inst)) {
                        if (filter && !filter.includes(playlist.name)) {
                            continue;
                        }
                        list.list.push(playlist.name);
                        list.states.push(playlist.id);
                    }
                }
            } else if (role === 'spotify-speaker' || role === 'spotify-playlist') {
                // Spotify Speaker
                if (entityInSel.value.options.dp) {
                    const o = await entityInSel.value.getCommonStates(force);
                    const v = await entityInSel.value.getString();
                    const al = await valueList?.getObject();

                    if (o) {
                        list.list = [];
                        list.states = [];
                        list.value = '';
                        for (const a in o) {
                            const str = String(o[a]).replace(/\r?\n/g, '').trim();
                            const allow = !Array.isArray(al) || al.length === 0 || al.includes(str);
                            if (allow) {
                                list.list.push(str);

                                list.states.push(a);
                                if (a === v && !list.value) {
                                    list.value = str;
                                }
                            }
                        }
                    }
                }
            } else if (role === 'spotify-tracklist') {
                // Spotify Tracklist
                if (valueList2) {
                    const arr = (await valueList2.getObject()) as NSPanel.spotifyPlaylist | null;
                    if (arr) {
                        list.list = [];
                        list.states = [];
                        const v = await entityInSel.value.getString();
                        for (let a = 0; a < arr.length; a++) {
                            if (arr[a].id === v && !list.value) {
                                list.value = `${arr[a].title}`;
                            }
                            list.list.push(`${arr[a].title}`);
                            list.states.push(String(a + 1));
                        }
                        const value = await entityInSel.value.getNumber();
                        if (value && !Number.isNaN(value) && !list.value) {
                            list.value = list.list[value - 1];
                        }
                    }
                }
            } else if (
                ['string', 'number'].indexOf(entityInSel.value.type ?? '') !== -1 &&
                ((await entityInSel.value.getCommonStates(force)) || valueList2 != null)
            ) {
                let states: Record<string | number, string> | string[] | null = null;
                const value = await tools.getValueEntryString(entityInSel);

                switch (role) {
                    /*case 'spotify-tracklist': {
                        if (valueList) {
                            const val = (await valueList.getObject()) as NSPanel.spotifyPlaylist | null;
                            if (val) {
                                states = {};
                                for (let a = 0; a < val.length; a++) {
                                    states[a + 1] = val[a].title;
                                }
                                list.value = value ?? undefined;
                            }
                        }
                        break;
                    }*/
                    case '2valuesIsValue': {
                        if (!valueList || !valueList2) {
                            this.log.error('2values requires both valueList and valueList2!');
                            states = [];
                            break;
                        }

                        const filter = (await valueList.getObject()) || [];
                        let fulllist = (await valueList2.getObject()) || [];

                        const isStringArray = (x: unknown): x is string[] =>
                            Array.isArray(x) && x.every(v => typeof v === 'string');

                        if (!isStringArray(filter) || !isStringArray(fulllist)) {
                            this.log.error('2values: valueList/valueList2 must be string[]!');
                            states = [];
                            break;
                        }
                        list.value = value ?? '';
                        if (filter.length > 0) {
                            fulllist = fulllist.filter(v => filter.includes(v));
                        }

                        states = fulllist as string[];
                        break;
                    }
                    default: {
                        states = await entityInSel.value.getCommonStates(force);
                    }
                }
                if (value !== null && states) {
                    list.list = [];
                    list.states = [];
                    if (Array.isArray(states)) {
                        for (let a = 0; a < states.length; a++) {
                            list.list.push(this.library.getTranslation(String(states[a])));
                            if (role === '2valuesIsValue') {
                                list.states.push(String(states[a]));
                            } else {
                                list.states.push(String(a));
                            }
                        }
                        if (!list.value && role !== '2valuesIsValue') {
                            list.value = states[parseInt(value)] || undefined;
                        }
                    } else {
                        for (const a in states) {
                            list.list.push(this.library.getTranslation(String(states[a])));
                            list.states.push(String(a));
                            if (!list.value) {
                                list.value = states[value];
                            }
                        }
                    }
                }
            } else if (['string', 'number'].indexOf(entityInSel.value.type ?? '') !== -1 && valueList) {
                list.list = [];
                list.states = [];
                const v = await valueList?.getObject();
                if (v && Array.isArray(v) && v.every(ve => typeof ve === 'string')) {
                    // current raw value of the state: the index for plain entries, the value part for "label?value"
                    const value = await tools.getValueEntryString(entityInSel);
                    for (let a = 0; a < v.length; a++) {
                        const arr = v[a].split('?');
                        if (arr.length >= 2) {
                            list.list.push(this.library.getTranslation(arr[0]));
                            list.states.push(String(arr[1]));
                            if (!list.value && value !== null && String(arr[1]) === value) {
                                list.value = arr[0];
                            }
                        } else {
                            list.list.push(this.library.getTranslation(v[a]));
                            list.states.push(String(a));
                            if (!list.value && value !== null && String(a) === value) {
                                list.value = v[a];
                            }
                        }
                    }
                }
                // no entry matched (e.g. a device wrote a foreign text): show the raw value
                if (!list.value) {
                    list.value = (await tools.getValueEntryString(entityInSel)) || undefined;
                }
            }
        } else {
            list.list = [];
            list.states = [];
            const v = await valueList?.getObject();
            if (v && Array.isArray(v) && v.every(ve => typeof ve === 'string')) {
                for (let a = 0; a < v.length; a++) {
                    const arr = v[a].split('?');
                    if (arr.length >= 2) {
                        list.list.push(this.library.getTranslation(arr[0]));
                        list.states.push(String(arr[1]));
                    } else {
                        list.list.push(this.library.getTranslation(v[a]));
                        list.states.push(String(a));
                    }
                }
            }
        }
        return list;
    }
    static isPageItemTextDataItems(F: any): F is NSPanel.PageItemTextDataItems {
        return F && typeof F === 'object' && 'type' in F && F.type === 'text';
    }
}
