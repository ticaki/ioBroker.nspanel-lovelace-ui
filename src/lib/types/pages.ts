import type * as dataItem from '../classes/data-item';
import type { RGB } from '../const/Color';
import type * as typePageItem from './type-pageItem';
import type * as Types from './types';

export type CardRole = 'AdapterConnection' | 'AdapterStopped' | 'AdapterUpdates';
export type PageTypeCards =
    | 'cardChart'
    | 'cardLChart'
    | 'cardEntities'
    | 'cardGrid'
    | 'cardGrid2'
    | 'cardGrid3'
    | 'cardThermo'
    | 'cardMedia'
    | 'cardUnlock'
    | 'cardQR'
    | 'cardAlarm'
    | 'cardPower'
    | 'screensaver'
    | 'screensaver2'
    | 'screensaver3'
    | 'cardBurnRec'
    | 'cardItemSpecial' // besonders, interne Card zum verwalten von pageItems
    | 'popupNotify'
    | 'popupNotify2'
    | 'cardSchedule';

export const arrayOfAll =
    <T>() =>
    <U extends T[]>(array: U & ([T] extends [U[number]] ? unknown : 'Invalid') & { 0: T }): U =>
        array;
export function exhaustiveCheck(_param: never): void {}
const arrayOfAllStateRole = arrayOfAll<StateRole>();
const arrayOfAllScreenSaverMode = arrayOfAll<Types.ScreensaverModeType>();
const arrayOfAllScreenSaverCards = arrayOfAll<screenSaverCardType>();
export const screenSaverCardArray: screenSaverCardType[] = arrayOfAllScreenSaverCards([
    'screensaver',
    'screensaver2',
    'screensaver3',
]);
export function isScreenSaverCardType(F: any): F is screenSaverCardType {
    if (typeof F !== 'string') {
        return false;
    }

    switch (F) {
        case 'screensaver':
        case 'screensaver2':
        case 'screensaver3':
            return true;
        default:
            console.info(`${F} is not isScreenSaverCardType!`);
            return false;
    }
}
export const screenSaverModeArray = arrayOfAllScreenSaverMode(['standard', 'advanced', 'alternate', 'easyview']);
export function isScreenSaverMode(F: any): F is Types.ScreensaverModeType {
    if (typeof F !== 'string') {
        return false;
    }

    switch (F) {
        case 'standard':
        case 'advanced':
        case 'alternate':
        case 'easyview':
            return true;
        default:
            console.info(`${F} is not isScreenSaverMode!`);
            return false;
    }
}
export function isScreenSaverModeAsNumber(F: any): F is Types.ScreensaverModeTypeAsNumber {
    if (typeof F !== 'number') {
        return false;
    }
    const N = F as Types.ScreensaverModeTypeAsNumber;
    switch (N) {
        case 0:
        case 1:
        case 2:
        case 3:
            return true;
        default:
            exhaustiveCheck(N);
            console.info(`${F} is not isScreenSaverModeAsNumber!`);
            return false;
    }
}

/**
 * if u get a error here, u have to add the new stateRole to the type StateRole or visa versa
 */
export const stateRoleArray = arrayOfAllStateRole([
    'button',
    'button.close',
    'button.close.blind',
    'button.close.tilt',
    'button.next',
    'button.open',
    'button.open.blind',
    'button.open.tilt',
    'button.pause',
    'button.play',
    'button.press',
    'button.prev',
    'button.stop',
    'button.stop.blind',
    'button.stop.tilt',
    'button.volume.down',
    'button.volume.up',
    'date',
    'date.sunrise.forecast.0',
    'date.sunrise.forecast.1',
    'date.sunset.forecast.0',
    'date.sunset.forecast.1',
    'indicator.error',
    'indicator.lowbat',
    'indicator.maintenance',
    'indicator.maintenance.lowbat',
    'indicator.maintenance.unreach',
    'indicator.working',
    'level',
    'level.blind',
    'level.brightness',
    'level.color.blue',
    'level.color.cie',
    'level.color.green',
    'level.color.hue',
    'level.color.name',
    'level.color.red',
    'level.color.rgb',
    'level.color.temperature',
    'level.color.white',
    'level.dimmer',
    'level.mode.airconditioner',
    'level.mode.fan',
    'level.mode.thermostat',
    'level.speed',
    'level.temperature',
    'level.tilt',
    'level.value',
    'level.volume',
    'media.album',
    'media.artist',
    'media.duration',
    'media.elapsed',
    'media.elapsed.text',
    'media.mode.repeat',
    'media.mode.shuffle',
    'media.mute',
    'media.playlist',
    'media.seek',
    'media.state',
    'media.title',
    'sensor.door',
    'sensor.light',
    'sensor.motion',
    'sensor.open',
    'sensor.window',
    'state',
    'state.light',
    'switch',
    'switch.gate',
    'switch.light',
    'switch.lock',
    'switch.mode.auto',
    'switch.mode.boost',
    'switch.boost',
    'switch.mode.manual',
    'switch.mode.party',
    'switch.mode.swing',
    'switch.power',
    'text',
    'timestamp',
    'value',
    'value.battery',
    'value.blind',
    'value.dimmer',
    'value.humidity',
    'value.power',
    'value.rgb',
    'value.temperature',
    'value.tilt',
    'value.volume',
    'value.warning',
    'weather.icon.forecast',
    'weather.title',
    'weather.title.short',
    'level.mode.select',
    'value.mode.select',
    'level.timer',
    'value.timer',
    'level.mode',
    'sensor.alarm.flood',
    'indicator.reachable',
    'sensor.switch',
    'date.sunrise',
    'date.sunset',
    'weather.icon',
    'level.mode.swing',
    '',
]);

export type StateRole =
    | 'level.mode.swing'
    | 'weather.icon'
    | 'date.sunrise'
    | 'date.sunset'
    | 'sensor.switch'
    | 'indicator.reachable'
    | 'sensor.alarm.flood'
    | 'level.mode'
    | 'value.timer'
    | 'level.timer'
    | 'level.mode.select'
    | 'value.mode.select'
    | 'button'
    | 'button.close'
    | 'button.close.blind'
    | 'button.close.tilt'
    | 'button.next'
    | 'button.open'
    | 'button.open.blind'
    | 'button.open.tilt'
    | 'button.pause'
    | 'button.play'
    | 'button.prev'
    | 'button.press'
    | 'button.stop'
    | 'button.stop.blind'
    | 'button.stop.tilt'
    | 'button.volume.down'
    | 'button.volume.up'
    | 'date'
    | 'date.sunrise.forecast.0'
    | 'date.sunrise.forecast.1'
    | 'date.sunset.forecast.0'
    | 'date.sunset.forecast.1'
    | 'indicator.error'
    | 'indicator.lowbat'
    | 'indicator.maintenance'
    | 'indicator.maintenance.lowbat'
    | 'indicator.maintenance.unreach'
    | 'indicator.working'
    | 'level'
    | 'level.blind'
    | 'level.brightness'
    | 'level.color.blue'
    | 'level.color.cie'
    | 'level.color.green'
    | 'level.color.hue'
    | 'level.color.name'
    | 'level.color.red'
    | 'level.color.rgb'
    | 'level.color.temperature'
    | 'level.color.white'
    | 'level.dimmer'
    | 'level.mode.airconditioner'
    | 'level.mode.fan'
    | 'level.mode.thermostat'
    | 'level.speed'
    | 'level.temperature'
    | 'level.tilt'
    | 'level.value'
    | 'level.volume'
    | 'media.album'
    | 'media.artist'
    | 'media.duration'
    | 'media.elapsed'
    | 'media.elapsed.text'
    | 'media.mode.repeat'
    | 'media.mode.shuffle'
    | 'media.mute'
    | 'media.playlist'
    | 'media.seek'
    | 'media.state'
    | 'media.title'
    | 'sensor.door'
    | 'sensor.light'
    | 'sensor.motion'
    | 'sensor.open'
    | 'sensor.window'
    | 'state'
    | 'state.light'
    | 'switch'
    | 'switch.gate'
    | 'switch.light'
    | 'switch.lock'
    | 'switch.mode.auto'
    | 'switch.mode.boost'
    | 'switch.boost'
    | 'switch.mode.manual'
    | 'switch.mode.party'
    | 'switch.mode.swing'
    | 'switch.power'
    | 'text'
    | 'timestamp'
    | 'value'
    | 'value.battery'
    | 'value.blind'
    | 'value.dimmer'
    | 'value.humidity'
    | 'value.power'
    | 'value.rgb'
    | 'value.temperature'
    | 'value.tilt'
    | 'value.volume'
    | 'value.warning'
    | 'weather.icon.forecast'
    | 'weather.title'
    | 'weather.title.short'
    | '';

export type DeviceRole =
    | '2values'
    | '4values'
    | 'arrow'
    | 'battery'
    | 'blind'
    | 'button'
    | 'buttonSensor'
    | 'cie'
    | 'combined'
    | 'ct'
    | 'dimmer'
    | 'door'
    | 'gate'
    | 'hue'
    | 'iconNotText'
    | 'indicator'
    | 'light'
    | 'media.repeat'
    | 'motion'
    | 'rgb.hex'
    | 'rgbSingle'
    | 'rgbThree'
    | 'socket'
    | 'spotify-playlist'
    | 'test'
    | 'text'
    | 'text.list'
    | 'textNotIcon'
    | 'timer'
    | 'window'
    | 'info'
    | 'humidity'
    | 'temperature'
    | 'fan'
    | '';

export function isStateRole(F: string): F is StateRole {
    switch (F as StateRole) {
        case 'button.play':
        case 'button.pause':
        case 'button.next':
        case 'button.prev':
        case 'button.stop':
        case 'button.volume.up':
        case 'button.volume.down':
        case 'media.seek':
        case 'media.mode.shuffle':
        case 'media.mode.repeat':
        case 'media.state':
        case 'media.artist':
        case 'media.album':
        case 'media.title':
        case 'media.duration':
        case 'media.elapsed.text':
        case 'media.elapsed':
        case 'media.mute':
        case 'level.volume':
        case 'media.playlist':
            return true;
        default:
            return true;
    }
}
export function isButtonActionType(F: string): F is Types.ButtonActionType {
    switch (F) {
        case 'bExit':
        case 'bUp':
        case 'bNext':
        case 'bSubNext':
        case 'bPrev':
        case 'bSubPrev':
        case 'bHome':
        case 'notifyAction':
        case 'OnOff':
        case 'button':
        case 'up':
        case 'stop':
        case 'down':
        case 'positionSlider':
        case 'tiltOpen':
        case 'tiltStop':
        case 'tiltSlider':
        case 'tiltClose':
        case 'brightnessSlider':
        case 'colorTempSlider':
        case 'colorWheel':
        case 'tempUpd':
        case 'tempUpdHighLow':
        case 'media-back':
        case 'media-pause':
        case 'media-next':
        case 'media-shuffle':
        case 'volumeSlider':
        case 'mode-speakerlist':
        case 'mode-playlist':
        case 'mode-tracklist':
        case 'mode-repeat':
        case 'mode-equalizer':
        case 'mode-seek':
        case 'mode-crossfade':
        case 'mode-favorites':
        case 'mode-insel':
        case 'media-OnOff':
        case 'timer-start':
        case 'timer-pause':
        case 'timer-cancle':
        case 'timer-finish':
        case 'hvac_action':
        case 'mode-modus1':
        case 'mode-modus2':
        case 'mode-modus3':
        case 'number-set':
        case 'mode-preset_modes':
        case 'A1':
        case 'A2':
        case 'A3':
        case 'A4':
        case 'D1':
        case 'U1':
        case 'eu':
            return true;
        default:
            console.info(`${F} is not isButtonActionType!`);
            return false;
    }
}

export type PageBaseConfigTemplate =
    | {
          card: Exclude<PageTypeCards, 'screensaver' | 'screensaver2' | 'screensaver3'>;
          adapter: string;
          alwaysOn: 'none' | 'always' | 'action' | 'ignore';
          useColor?: boolean;
          pageItems: typePageItem.PageItemDataItemsOptions[];

          //    mediaNamespace: string;
          config:
              | undefined
              | cardPowerDataItemOptions
              | cardMediaDataItemOptions
              | cardGridDataItemOptions
              | cardThermoDataItemOptions
              | cardEntitiesDataItemOptions
              | cardAlarmDataItemOptions
              | cardQRDataItemOptions
              | screensaverDataItemOptions
              | cardNotifyDataItemOptions
              | cardNotify2DataItemOptions
              | cardScheduleDataItemOptions;
          items: undefined;
      }
    | {
          card: Extract<PageTypeCards, 'screensaver' | 'screensaver2'>;
          template: Types.PageTemplateIdent;
          adapter: string;
          alwaysOn: 'none' | 'always' | 'action' | 'ignore';
          useColor?: boolean;
          pageItems: typePageItem.PageItemDataItemsOptions[];

          //    mediaNamespace: string;
          config: undefined | screensaverDataItemOptions;
          items: undefined;
      };

export type AlarmButtonEvents = 'A1' | 'A2' | 'A3' | 'A4' | 'D1' | 'U1' | '';
export type AlarmStates = 'disarmed' | 'armed' | 'arming' | 'pending' | 'triggered';

export function isAlarmButtonEvent(F: any): F is AlarmButtonEvents {
    return ['A1', 'A2', 'A3', 'A4', 'D1', 'U1'].indexOf(F) !== -1;
}

export type PageBaseConfig = (
    | (
          | {
                //    type: PlayerType;
                //card: Exclude<PageTypeCards, 'screensaver' | 'screensaver2'>;
                uniqueID: string;
                template?: Types.PageTemplateIdent;
                dpInit?: string | RegExp; // ''
                enums?: string | string[];
                device?: string;
                alwaysOn: 'none' | 'always' | 'action' | 'ignore';
                useColor?: boolean;
                hidden?: boolean;
                pageItems: typePageItem.PageItemDataItemsOptions[];
                //    mediaNamespace: string;
                config:
                    | cardPowerDataItemOptions
                    | cardMediaDataItemOptions
                    | cardGridDataItemOptions
                    | cardThermoDataItemOptions
                    | cardEntitiesDataItemOptions
                    | cardAlarmDataItemOptions
                    | cardNotifyDataItemOptions
                    | cardNotify2DataItemOptions
                    | cardQRDataItemOptions
                    | cardChartDataItemOptions
                    | cardScheduleDataItemOptions;
            }
          | {
                //    type: PlayerType;
                //card: Extract<PageTypeCards, 'screensaver' | 'screensaver2'>;
                uniqueID: string;
                template?: Types.PageTemplateIdent;
                dpInit: string | RegExp; // ''
                enums?: string | string[];
                alwaysOn: 'none' | 'always' | 'action' | 'ignore';
                device?: string;
                useColor?: boolean;
                hidden?: boolean;
                cardRole?: CardRole;
                pageItems: typePageItem.PageItemDataItemsOptions[];
                /*&
                    Required<Pick<typePageItem.PageItemDataItemsOptions, 'modeScr'>>*/

                //    mediaNamespace: string;
                config: screensaverDataItemOptions;
            }
      )
    | ({
          //card: PageTypeCards;
          uniqueID: string;
          template: Types.PageTemplateIdent;
          dpInit: string | RegExp;
      } & Partial<Omit<PageBaseConfigTemplate, 'template'>>)
) & {
    items?:
        | undefined
        | cardEntitiesDataItems
        | cardPowerDataItems
        | cardMediaDataItems
        | cardGridDataItems
        | cardThermoDataItems
        | cardAlarmDataItems
        | cardNotifyDataItems
        | cardNotify2DataItems
        | cardQRDataItems
        | cardChartDataItems
        | cardScheduleDataItems;
};
type PageNotifyConfig = {
    headline: string;
    entity1?: typePageItem.ValueEntryType;
    colorHeadline: typePageItem.ColorEntryTypeNew;
    buttonLeft: string;
    colorButtonLeft: typePageItem.ColorEntryTypeNew;
    buttonRight: string;
    colorButtonRight: typePageItem.ColorEntryTypeNew;
    text: string;
    colorText: typePageItem.ColorEntryTypeNew;
    timeout: number;
    optionalValue?: string;
    setValue1?: string;
    setValue2?: string;
    closingBehaviour?: string;
};
export type cardNotifyDataItemOptions = {
    card: 'popupNotify';
    data: ChangeTypeOfKeys<PageNotifyConfig, Types.DataItemsOptions | undefined>;
};

export type closingBehaviour = 'both' | 'yes' | 'no' | 'none';
export function isClosingBehavior(F: any): F is closingBehaviour {
    return ['both', 'yes', 'no', 'none'].indexOf(F) !== -1;
}
export type cardNotifyDataItems = {
    card: 'popupNotify';
    data: ChangeTypeOfKeys<PageNotifyConfig, dataItem.Dataitem | undefined>;
};

type PageNotify2Config = {
    textSize: string;
    icon: typePageItem.IconEntryType;
} & PageNotifyConfig;

export type cardNotify2DataItemOptions = {
    card: 'popupNotify2';
    data: ChangeTypeOfKeys<PageNotify2Config, Types.DataItemsOptions | undefined>;
};
export type cardNotify2DataItems = {
    card: 'popupNotify2';
    data: ChangeTypeOfKeys<PageNotify2Config, dataItem.Dataitem | undefined>;
};

type PageChartConfig = {
    headline: string;
    text: string;
    color: typePageItem.ColorEntryTypeNew;
    ticks: string;
    value: string;
    entity1: typePageItem.ValueEntryType;
};

export type cardChartDataItemOptions = {
    card: 'cardChart' | 'cardLChart';
    index: number;
    data: ChangeTypeOfKeys<PageChartConfig, Types.DataItemsOptions | undefined>;
};
export type cardChartDataItems = {
    card: 'cardChart' | 'cardLChart';
    data: ChangeTypeOfKeys<PageChartConfig, dataItem.Dataitem | undefined>;
};

type PageAlarmPowerConfig = {
    alarmType?: string; //alarm unlock
    headline: string;
    entity1: typePageItem.ValueEntryType;
    button1: string;
    button2: string;
    button3: string;
    button4: string;
    icon: typePageItem.IconEntryType;
    pin: number;
    approved?: boolean;
    setNavi?: string;
};
export type cardAlarmDataItemOptions = {
    card: 'cardAlarm';
    data: ChangeTypeOfKeys<PageAlarmPowerConfig, Types.DataItemsOptions | undefined>;
};
export type cardAlarmDataItems = {
    card: 'cardAlarm';
    data: ChangeTypeOfKeys<PageAlarmPowerConfig, dataItem.Dataitem | undefined>;
};

type PageQRBaseConfig = {
    headline: string;
    entity1?: string;
};
export type cardQRDataItemOptions = {
    card: 'cardQR';
    index: number;
    data: ChangeTypeOfKeys<PageQRBaseConfig, Types.DataItemsOptions | undefined>;
};
export type cardQRDataItems = {
    card: 'cardQR';
    data: ChangeTypeOfKeys<PageQRBaseConfig, dataItem.Dataitem | undefined>;
};
export type QRButtonEvent = 'OnOff';
export function isQRButtonEvent(F: any): F is QRButtonEvent {
    return ['OnOff'].indexOf(F) !== -1;
}

export type cardPowerDataItemOptions = {
    card: 'cardPower';
    index: number;
    data: ChangeTypeOfKeys<PageGridPowerConfig, Types.DataItemsOptions | undefined>;
};
export type cardPowerDataItems = {
    card: 'cardPower';
    data: ChangeTypeOfKeys<PageGridPowerConfig, dataItem.Dataitem | undefined>;
};

export type cardGridDataItemOptions = {
    card: 'cardGrid' | 'cardGrid2' | 'cardGrid3';
    cardRole?: CardRole;
    scrollType?: 'page';
    filterType?: 'true' | 'false';
    data: ChangeTypeOfKeys<PageGridBaseConfig, Types.DataItemsOptions | undefined>;
};
export type cardGridDataItems = {
    card: 'cardGrid' | 'cardGrid2' | 'cardGrid3';
    data: ChangeTypeOfKeys<PageGridBaseConfig, dataItem.Dataitem | undefined>;
};

export type cardEntitiesDataItemOptions = {
    card: 'cardEntities';
    cardRole?: CardRole;
    scrollType?: 'page';
    filterType?: 'true' | 'false';
    data: ChangeTypeOfKeys<PageEntitiesBaseConfig, Types.DataItemsOptions | undefined>;
};
export type cardEntitiesDataItems = {
    card: 'cardEntities';
    data: ChangeTypeOfKeys<PageEntitiesBaseConfig, dataItem.Dataitem | undefined>;
};

export type cardScheduleDataItemOptions = {
    card: 'cardSchedule';
    cardRole?: CardRole;
    scrollType?: 'page';
    filterType?: 'true' | 'false';
    data: ChangeTypeOfKeys<PageEntitiesBaseConfig, Types.DataItemsOptions | undefined>;
};
export type cardScheduleDataItems = {
    card: 'cardSchedule';
    data: ChangeTypeOfKeys<PageEntitiesBaseConfig, dataItem.Dataitem | undefined>;
};

export type cardThermoDataItemOptions = {
    card: 'cardThermo';
    data: ChangeTypeOfKeys<PageThermoBaseConfig, Types.DataItemsOptions | undefined>;
};
export type cardThermoDataItems = {
    card: 'cardThermo';
    data: ChangeTypeOfKeys<PageThermoBaseConfig, dataItem.Dataitem | undefined>;
};

export type cardMediaDataItemOptions = {
    card: 'cardMedia';
    data: ChangeTypeOfKeys<PageMediaBaseConfig, Types.DataItemsOptions | undefined> & { logo: toolboxItem | undefined };
};

export type cardMediaDataItems = {
    card: 'cardMedia';
    data: ChangeTypeOfKeys<PageMediaBaseConfig, dataItem.Dataitem | undefined> & {
        toolbox: (toolboxItemDataItem | undefined)[];
    } & { logo: toolboxItemDataItem | undefined };
};
export type screenSaverCardType = 'screensaver' | 'screensaver2' | 'screensaver3';
export type screensaverDataItemOptions = {
    card: Extends<PageTypeCards, screenSaverCardType>;
    mode: Types.ScreensaverModeType;
    rotationTime: number;
    model: Types.NSpanelModel;
    screensaverSwipe: boolean;
    screensaverIndicatorButtons: boolean;
    data: undefined;
};
type Extends<T, U extends T> = U;
export type ChangeDeepPartial<Obj> = Obj extends
    | object
    | listItem
    | PageTypeCards
    | typePageItem.IconBoolean
    | typePageItem.TextEntryType
    | typePageItem.ValueEntryType
    | typePageItem.IconEntryType
    | typePageItem.ScaledNumberType
    | PageGridPowerConfigElement
    | RGB
    | typePageItem.ColorEntryType
    | PageMediaBaseConfig
    | Types.SerialTypePageElements
    ? Obj extends Types.DataItemsOptions
        ? Types.DataItemsOptions | null
        : {
              [K in keyof Obj]?: ChangeDeepPartial<Obj[K]> | null;
          }
    : Types.DataItemsOptions | null;

export type ChangeTypeOfKeys<Obj, N> = Obj extends
    | object
    | listItem
    | PageTypeCards
    | typePageItem.IconBoolean
    | typePageItem.TextEntryType
    | typePageItem.ValueEntryType
    | typePageItem.IconEntryType
    | typePageItem.ScaledNumberType
    | PageGridPowerConfigElement
    | RGB
    | typePageItem.ColorEntryType
    | PageMediaBaseConfig
    | Types.SerialTypePageElements
    ? Obj extends RGB | Types.IconScaleElement | Types.DataItemsOptions
        ? N
        : {
              [K in keyof Obj]?: ChangeTypeOfKeys<Obj[K], N>;
          }
    : N;

export type ChangeTypeOfKeysGeneric<Obj, N> = Obj extends object
    ? Obj extends RGB
        ? N
        : {
              [K in keyof Obj]: ChangeTypeOfKeysGeneric<Obj[K], N>;
          }
    : N;
/*export type DeepPartial<Obj, N> = Obj extends
    | object
    | listItem
    | PageTypeCards
    | IconBoolean
    | TextEntryType
    | ValueEntryType
    | IconEntryType
    | ScaledNumberType
    | PageGridPowerConfigElement
    | RGB
    | ColorEntryType
    | PageMediaBaseConfig
    | Types.SerialTypePageElements
    ? Obj extends Dataitem
        ? Dataitem
        : {
              [K in keyof Obj]+?: ChangeTypeOfKeys<Obj[K], N>;
          }
    : Dataitem;*/

type PageMediaBaseConfig = {
    headline: string;
    alwaysOnDisplay: boolean;
    album: string;
    title: listItem;
    duration: string;
    elapsed: string;
    artist: listItem;
    shuffle: typePageItem.ScaledNumberType;
    volume: typePageItem.ScaledNumberType;
    icon: string;
    play: string;
    mediaState: string;
    stop: string;
    pause: string;
    forward: string;
    backward: string;
};

type PageGridBaseConfig = {
    headline: string;
    list: string;
};

type PageEntitiesBaseConfig = {
    headline: string;
    list?: string;
};

type PageGridPowerConfig = {
    headline: string;
    homeValueTop: typePageItem.ValueEntryType;
    homeIcon: typePageItem.IconEntryType;
    homeValueBot: typePageItem.ValueEntryType;
    leftTop: PageGridPowerConfigElement;
    leftMiddle: PageGridPowerConfigElement;
    leftBottom: PageGridPowerConfigElement;
    rightTop: PageGridPowerConfigElement;
    rightMiddle: PageGridPowerConfigElement;
    rightBottom: PageGridPowerConfigElement;
};

export type PageGridPowerConfigElement =
    | {
          icon?: typePageItem.IconEntryType;
          value?: typePageItem.ValueEntryType;
          speed?: typePageItem.ScaledNumberType;
          text?: typePageItem.TextEntryType;
      }
    | undefined;

type PageThermoBaseConfig = {
    auto?: boolean;
    boost?: boolean;
    error?: boolean;
    humidity?: number;
    manual?: boolean;
    //mode?: string;
    party?: boolean;
    unreach?: boolean;
    windowopen?: boolean;
    cool?: boolean;
    heat?: boolean;
    lowbat?: boolean;
    maintain?: boolean;
    power?: boolean;
    set1: boolean;
    set2?: boolean;
    speed?: number;
    swing?: number;
    unit: string;
    headline: string;
    mixed1: typePageItem.ValueEntryType;
    mixed2: typePageItem.ValueEntryType;
    mixed3: typePageItem.ValueEntryType;
    mixed4: typePageItem.ValueEntryType;
    minTemp: number; // *10
    maxTemp: number; // *10
    tempStep: number; // *10
    icon?: string;
    color?: string;
};
export function isColorEntryType(F: object | typePageItem.ColorEntryType): F is typePageItem.ColorEntryType {
    if ('true' in F && 'false' in F && 'scale' in F) {
        return true;
    }
    return false;
}
export type PageMediaBaseConfigWrite = {
    pplay: writeItem;
    pause: writeItem;
    forward: writeItem;
    backward: writeItem;
    stop: writeItem;
    off: writeItem;
    shuffle: writeItem;
    tracklist: writeItem;
    playlist: writeItem;
    equalizerList: writeItem;
    repeat: writeItem;
    toolstring: writeItem;
};
export type PageMediaMessage = {
    event: 'entityUpd';
    headline: string;
    navigation: string;
    id: string;
    name: string;
    titelColor: string;
    artist: string;
    artistColor: string;
    volume: string;
    iconplaypause: AllIcons;
    onoffbuttonColor: string;
    shuffle_icon: AllIcons;
    logo: string;
    options: [string?, string?, string?, string?, string?];
};

export type PagePowerMessage = {
    event: 'entityUpd';
    headline: string;
    navigation: string;
    homeValueTop: string;
    homeIcon: string;
    homeColor: string;
    homeName: string;
    homeValueBot: string;
    leftTop: PagePowerMessageItem;
    leftMiddle: PagePowerMessageItem;
    leftBottom: PagePowerMessageItem;
    rightTop: PagePowerMessageItem;
    rightMiddle: PagePowerMessageItem;
    rightBottom: PagePowerMessageItem;
};

export type PageAlarmMessage = {
    event: 'entityUpd';
    intNameEntity: string;
    headline: string;
    navigation: string;
    button1: string;
    status1: AlarmButtonEvents;
    button2: string;
    status2: AlarmButtonEvents;
    button3: string;
    status3: AlarmButtonEvents;
    button4: string;
    status4: AlarmButtonEvents;
    icon: string;
    iconColor: string;
    numpad: 'enable' | 'disable';
    flashing: 'enable' | 'disable';
};

export type PageQRMessage = {
    event: 'entityUpd';
    headline: string;
    navigation: string;
    textQR: string;
    type1: string;
    internalName1: string;
    iconId1: string;
    iconColor1: string;
    displayName1: string;
    optionalValue1: string;
    type2: string;
    internalName2: string;
    iconId2: string;
    iconColor2: string;
    displayName2: string;
    optionalValue2: string;
};

export type PageChartMessage = {
    event: 'entityUpd';
    headline: string;
    navigation: string;
    color: string;
    text: string;
    ticks: string[];
    value: string;
};

export type PagePowerMessageItem = {
    icon: string;
    iconColor: string;
    name: string;
    value: string;
    speed: number;
};

export type PageGridMessage = {
    event: 'entityUpd';
    headline: string;
    navigation: string;
    options: [string?, string?, string?, string?, string?, string?, string?, string?];
};

export type PageNotifyMessage = {
    event: 'entityUpd';
    headline: string;
    hColor: string;
    blText: string;
    blColor: string;
    brText: string;
    brColor: string;
    text: string;
    textColor: string;
    timeout: number;
    fontSet: string;
    icon: string;
    iconColor: string;
    placeholder: string;
};
/*+ getState(popupNotifyInternalName).val + '~'
                + heading + '~'
                + v_popupNotifyHeadingColor + '~'
                + getState(popupNotifyButton1Text).val + '~'
                + v_popupNotifyButton1TextColor + '~'
                + getState(popupNotifyButton2Text).val + '~'
                + v_popupNotifyButton2TextColor + '~'
                + text + '~'
                + v_popupNotifyTextColor + '~'
                + getState(popupNotifySleepTimeout).val;*/
export type screensaverMessage = {
    options: Record<Types.ScreenSaverPlaces, string[]>;
};

export type PageEntitiesMessage = {
    event: 'entityUpd';
    headline: string;
    navigation: string;
    options: [string?, string?, string?, string?, string?, string?, string?, string?];
};

export type PageScheduleMessage = {
    event: 'entityUpd';
    headline: string;
    navigation: string;
    options: [string?, string?, string?, string?, string?, string?, string?, string?];
};

export type PageThermoMessage = {
    event: 'entityUpd';
    headline: string;
    intNameEntity: string;
    navigation: string;
    currentTemp: number | string;
    dstTemp: number | string; // *10
    status: string;
    minTemp: number | string; // *10
    maxTemp: number | string; // *10
    tempStep: string; // *10
    options: [string, string, string, string, string, string, string, string];
    tCurTempLbl: string;
    tStateLbl: string;
    tALbl: ''; // ignored
    tCF: string;
    temp2: number | string; // *10
    btDetail: '0' | '1'; // 1 ist aus
};

type writeItem = { dp: string } | undefined;
export type listItem =
    | {
          on: string;
          text: string;
          color: typePageItem.ColorEntryType | string | undefined;
          icon?: typePageItem.IconBoolean | string | undefined;
          list?: string | undefined;
      }
    | undefined; // mean string start with getState(' and end with ').val
export type toolboxItem = ChangeTypeOfKeys<listItem, Types.DataItemsOptions | undefined> & {
    action: typePageItem.MediaToolBoxAction;
};
export type toolboxItemDataItem = ChangeTypeOfKeys<listItem, dataItem.Dataitem | undefined> & {
    action: typePageItem.MediaToolBoxAction;
};

export type placeholderType = Record<
    string,
    {
        text?: string;
        dp?: string;
    }
>;

export function isPlaceholderType(F: any): F is placeholderType {
    if (!F || typeof F !== 'object') {
        return false;
    }
    for (const a in F) {
        let count = 0;
        if (!F[a]) {
            return false;
        }
        for (const b in F[a]) {
            if (['text', 'dp'].indexOf(b) !== -1 && F[a][b] !== undefined) {
                count++;
            }
        }
        if (count !== 1) {
            return false;
        }
    }
    return true;
}
