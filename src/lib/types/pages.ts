import type * as dataItem from '../classes/data-item';
import type { RGB } from '../const/Color';
import { type PageItem } from '../pages/pageItem';
import type * as typePageItem from './type-pageItem';
import type * as Types from './types';

export type CardRole = 'AdapterConnection' | 'AdapterStopped' | 'AdapterUpdates';

export function isCardEntitiesType(F: any): F is cardEntitiesTypes {
    return ['cardEntities', 'cardSchedule'].indexOf(F) !== -1;
}
export function isCardGridType(F: any): F is cardGridTypes {
    return ['cardGrid', 'cardGrid2', 'cardGrid3', 'cardThermo2', 'cardMedia'].indexOf(F) !== -1;
}
export function isCardMenuHalfPageScrollType(F: any): F is cardGridTypes {
    return ['cardGrid', 'cardGrid2', 'cardGrid3', 'cardThermo2'].indexOf(F) !== -1;
}

export function isCardMenuRole(F: any): F is cardGridTypes | cardEntitiesTypes {
    return isCardEntitiesType(F) || isCardGridType(F);
}

// cardMedia use some features of cardGrid, but is not a menu card
export function isPageMenuConfig(F: any): F is PageMenuConfig {
    if (typeof F !== 'object' || F === null || !('card' in F)) {
        return false;
    }
    return isCardMenuRole(F.card);
}
export type cardEntitiesTypes = 'cardEntities' | 'cardSchedule';
export type cardGridTypes = 'cardGrid' | 'cardGrid2' | 'cardGrid3' | 'cardThermo2' | 'cardMedia';
export type PageTypeCards =
    | cardEntitiesTypes
    | cardGridTypes
    | 'cardChart'
    | 'cardLChart'
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
    'level.mode.swing',
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
    'weather.icon.name',
    'value.uv',
    'value.direction.wind',
    'value.speed.wind',
    'value.mode.airconditioner',
    'value.mode.thermostat',
    'indicator',
    'indicator.connected',
    '',
]);

export type StateRole =
    | 'indicator.connected'
    | 'indicator'
    | 'value.mode.thermostat'
    | 'value.mode.airconditioner'
    | 'value.speed.wind'
    | 'value.direction.wind'
    | 'value.uv'
    | 'weather.icon.name'
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
    | 'level.mode.swing'
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
    | 'repeatValue'
    | 'spotify-playlist'
    | 'spotify-tracklist'
    | 'spotify-speaker'
    | 'alexa-playlist'
    | 'alexa-speaker'
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
    | 'value.uv'
    | 'heatcycle'
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
          config: undefined | PageMenuConfig | PageOthersConfigs | screensaverDataItemOptions;
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

export type PageMenuConfig =
    | cardThermo2DataItemOptions
    | cardGridDataItemOptions
    | cardEntitiesDataItemOptions
    | cardScheduleDataItemOptions
    | cardMediaDataItemOptions;

export type PageOthersConfigs =
    | cardPowerDataItemOptions
    | cardMediaDataItemOptions
    | cardThermoDataItemOptions
    | cardAlarmDataItemOptions
    | cardNotifyDataItemOptions
    | cardNotify2DataItemOptions
    | cardQRDataItemOptions
    | cardChartDataItemOptions;

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
                config: PageMenuConfig | PageOthersConfigs;
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
          hidden?: boolean;
      } & Partial<Omit<PageBaseConfigTemplate, 'template'>>)
) & {
    items?:
        | undefined
        | cardEntitiesDataItems
        | cardPowerDataItems
        | cardMediaDataItems
        | cardGridDataItems
        | cardThermoDataItems
        | cardThermo2DataItems
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
    colorHeadline: typePageItem.ColorEntryTypeBooleanStandard;
    buttonLeft: string;
    colorButtonLeft: typePageItem.ColorEntryTypeBooleanStandard;
    buttonRight: string;
    colorButtonRight: typePageItem.ColorEntryTypeBooleanStandard;
    text: string;
    colorText: typePageItem.ColorEntryTypeBooleanStandard;
    timeout: number;
    optionalValue?: string;
    setValue1?: string;
    setValue2?: string;
    closingBehaviour?: string;
};

export type PopupNotificationVal =
    | {
          headline?: string;
          colorHeadline?: { r: number; g: number; b: number };
          buttonLeft?: string;
          colorButtonLeft?: { r: number; g: number; b: number };
          buttonRight?: string;
          colorButtonRight?: { r: number; g: number; b: number };
          text?: string;
          colorText?: { r: number; g: number; b: number };
          timeout?: number;
      }
    | undefined;

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
    color: typePageItem.ColorEntryTypeBooleanStandard;
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
    card: Extract<cardGridTypes, 'cardGrid' | 'cardGrid2' | 'cardGrid3'>;
    cardRole?: CardRole;

    data: ChangeTypeOfKeys<PageGridBaseConfig, Types.DataItemsOptions | undefined>;
} & PageMenuBaseConfig;
export type cardGridDataItems = {
    card: Extract<cardGridTypes, 'cardGrid' | 'cardGrid2' | 'cardGrid3'>;
    data: ChangeTypeOfKeys<PageGridBaseConfig, dataItem.Dataitem | undefined>;
};

export type cardEntitiesDataItemOptions = {
    card: Extract<cardEntitiesTypes, 'cardEntities'>;
    cardRole?: CardRole;
    data: ChangeTypeOfKeys<PageEntitiesBaseConfig, Types.DataItemsOptions | undefined>;
} & PageMenuBaseConfig;
export type cardEntitiesDataItems = {
    card: Extract<cardEntitiesTypes, 'cardEntities'>;
    data: ChangeTypeOfKeys<PageEntitiesBaseConfig, dataItem.Dataitem | undefined>;
};

export type cardScheduleDataItemOptions = {
    card: Extract<cardEntitiesTypes, 'cardSchedule'>;
    cardRole?: CardRole;

    data: ChangeTypeOfKeys<PageEntitiesBaseConfig, Types.DataItemsOptions | undefined>;
} & PageMenuBaseConfig;
export type cardScheduleDataItems = {
    card: Extract<cardEntitiesTypes, 'cardSchedule'>;
    data: ChangeTypeOfKeys<PageEntitiesBaseConfig, dataItem.Dataitem | undefined>;
};

type PageMenuBaseConfig = {
    cardRole?: CardRole;
    /**
     * Defines how many items are scrolled at once.
     * - `"page"`: Scroll by a full page (all visible items).
     * - `"half"`: Scroll by half a page (only supported by certain card types).
     */
    scrollType?: 'page' | 'half';

    /**
     * Filters which items are shown.
     * - `"true"`: Show only items whose primary entity resolves to `true`.
     * - `"false"`: Show only items whose primary entity resolves to `false`.
     * - `number`: Show only items matching the given numeric filter value.
     */
    filterType?: 'true' | 'false' | number;
} &
    /**
     * Standard scroll presentations.
     * - `"classic"`: Windowed paging with optional `"half"`/`"page"` stride.
     * - `"arrow"`: Fixed number of slots, last slot can show a paging arrow.
     * Defaults to `"classic"`.
     */
    (| { scrollPresentation?: 'classic' | 'arrow' }
        | {
              /**
               * Special mode that behaves like `"classic"`,
               * including `"half"`/`"page"` support.
               * Pages automatically advance after a fixed interval.
               */
              scrollPresentation: 'auto';

              /**
               * Interval (in seconds) to automatically advance to the next page.
               * Always required in `"auto"` mode.
               * Defaults to `15` seconds if not specified.
               */
              scrollAutoTiming: number;
          }
    );

export type cardThermoDataItemOptions = {
    card: 'cardThermo';
    data: ChangeTypeOfKeys<PageThermoBaseConfig, Types.DataItemsOptions | undefined>;
};
export type cardThermoDataItems = {
    card: 'cardThermo';
    data: ChangeTypeOfKeys<PageThermoBaseConfig, dataItem.Dataitem | undefined>;
};

export type cardMediaDataItemOptions = {
    card: Extract<cardGridTypes, 'cardMedia'>;
    ident?: string;
    logo?: typePageItem.PageItemDataItemsOptions | undefined;
    data: ChangeTypeOfKeys<PageMediaBaseConfig, Types.DataItemsOptions | undefined>;
} & PageMenuBaseConfig;

export type cardMediaDataItems = {
    card: Extract<cardGridTypes, 'cardMedia'>;
    dpInit?: string | RegExp; // ''
    ident?: string;
    logo?: typePageItem.PageItemDataItemsOptions | undefined;
    logoItem?: PageItem | undefined;

    data: ChangeTypeOfKeys<PageMediaBaseConfig, dataItem.Dataitem | undefined>;
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

type PageMediaBaseConfig = {
    headline: string;
    alwaysOnDisplay?: boolean;
    album?: string;
    title?: typePageItem.ValueEntryTypeWithColor;
    duration?: string;
    elapsed?: string;
    artist?: typePageItem.ValueEntryTypeWithColor;
    shuffle?: typePageItem.ScaledNumberType;
    volume?: typePageItem.ScaledNumberType;
    icon?: string;
    play?: string;
    onOffColor?: typePageItem.ColorEntryTypeBooleanStandard;
    mediaState?: string;
    isPlaying?: boolean;
    stop?: string;
    pause?: string;
    forward?: string;
    backward?: string;
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

export type cardThermo2DataItemOptions = {
    card: Extract<cardGridTypes, 'cardThermo2'>;

    sortOrder?: 'H' | 'V' | 'HM' | 'VM' | 'HB' | 'VB';
    cardRole?: CardRole;
    data: ChangeTypeOfKeys<PageThermo2BaseConfig, Types.DataItemsOptions | undefined>;
} & PageMenuBaseConfig;
export type cardThermo2DataItems = {
    card: Extract<cardGridTypes, 'cardThermo2'>;
    data: ChangeTypeOfKeys<PageThermo2BaseConfig, dataItem.Dataitem | undefined>;
};

type PageThermo2BaseConfig = Thermo2DataSetBase | Thermo2DataSetBase[];

type Thermo2DataSetBase = {
    entity3?: typePageItem.ValueEntryType; // Thermostat
    entity1: typePageItem.ValueEntryType; // sensor
    icon1?: typePageItem.IconEntryType;
    entity2?: typePageItem.ValueEntryType; // humidity
    icon2?: typePageItem.IconEntryType;
    icon4?: typePageItem.IconEntryType;
    icon5?: typePageItem.IconEntryType;
    headline?: string;
    minValue?: number;
    maxValue?: number;
    stepValue?: number;
    power?: boolean;
    mode?: string;
};

/*type ThermoDataSetBase = {
    entity1: typePageItem.ValueEntryType;
    humidity?: typePageItem.ValueEntryType;
    set: boolean;
    unit: string;
    headline: string;
    minTemp: number; // *10
    maxTemp: number; // *10
    tempStep: number; // *10
    power: boolean;
};*/

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
export type PageThermo2Message = {
    event: 'entityUpd';
    headline: string;
    navigation: string;
    internalName: string;
    dstTemp: number | string; // *10
    minTemp: number | string; // *10
    maxTemp: number | string; // *10
    tempStep: string; // *10
    unit: string;
    power: boolean;
    options: [
        /*Info*/
        string?,
        string?,
        string?,
        string?,
        string?,
        string?,
        string?,
        string?,
        /** option */
        string?,
        /** Pageitems */
        string?,
        string?,
        string?,
        string?,
        string?,
        string?,
        string?,
        string?,
    ];
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
