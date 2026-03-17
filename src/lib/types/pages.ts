import type { RGB } from '../const/Color';
import type * as dataItem from '../controller/data-item';
import { type PageItem } from '../pages/pageItem';
import type { AdminCardTypes } from './adminShareConfig';
import type { NSPanel } from './NSPanel';

export type CardRole = 'AdapterConnection' | 'AdapterStopped' | 'AdapterUpdates' | 'SonosSpeaker';

export type cardEntitiesTypes = Extract<AdminCardTypes, 'cardEntities' | 'cardSchedule'>;
export type cardGridTypes = Extract<
    AdminCardTypes,
    'cardGrid' | 'cardGrid2' | 'cardGrid3' | 'cardThermo2' | 'cardMedia'
>;

export type PageTypeCards = NSPanel.PageTypeCards; // besonders, interne Card zum verwalten von pageItems

export type StateRole =
    | 'date.sunrise,forecast.0'
    | 'date.sunset.forecast.0'
    | 'media.station'
    | 'media.mode.crossfade'
    | 'level.volume.group'
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
    | 'text.states'
    | 'volume.mute'
    /**
     * Defines the datapoints to write to depending on the current read of entity1 state.
     * If the read value is `true`, setValue1 is written with true,
     * if the read value is `false`, setValue2 is written with true.
     */
    | 'writeTargetByValue'
    /* selectGrid erzeugt im parent ein GridPage mit den items aus entity3 das muß dort auch zerstört werden */
    | 'selectGrid'
    | 'isDismissiblePerEvent'
    | 'repeatValue'
    | 'spotify-playlist'
    | 'spotify-tracklist'
    | 'spotify-speaker'
    | 'alexa-playlist'
    | 'alexa-speaker'
    | '2values'
    | '2valuesIsValue'
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
    | ''
    | CardRole;

export type PageBaseConfig = PageMenuConfig | PageOthersConfigs | screensaverDataItemOptions;
export type allCards =
    | AdminCardTypes
    | 'cardUnlock'
    | 'screensaver'
    | 'screensaver2'
    | 'screensaver3'
    | 'cardItemSpecial';

export type AlarmButtonEvents = 'A1' | 'A2' | 'A3' | 'A4' | 'D1' | 'D2' | 'D3' | 'D4' | 'U1' | '';
export type AlarmStates = 'disarmed' | 'armed' | 'arming' | 'pending' | 'triggered';

export type PageMenuConfig = (
    | cardThermo2DataItemOptions
    | cardGridDataItemOptions
    | cardEntitiesDataItemOptions
    | cardScheduleDataItemOptions
    | cardMediaDataItemOptions
) & {
    options?: {
        cardRoleList?: string[];
        indentifier?: string;
        min?: number;
        max?: number;
    };
};

export type PageOthersConfigs =
    | cardPowerDataItemOptions
    | cardMediaDataItemOptions
    | cardThermoDataItemOptions
    | cardAlarmDataItemOptions
    | cardNotifyDataItemOptions
    | cardPopup2DataItemOptions
    | cardQRDataItemOptions
    | cardChartDataItemOptions;

type PageBaseTemplate = {
    uniqueID: string;
    template: NSPanel.PageTemplateIdent;
    dpInit: string | RegExp;
    hidden?: boolean;
} & Partial<Omit<PageBaseConfigTemplate, 'template'>>;

export type PageBase = (
    | {
          uniqueID: string;
          //template?: NSPanel.PageTemplateIdent;
          dpInit?: string | RegExp; // ''
          enums?: string | string[];
          device?: string;
          alwaysOn: 'none' | 'always' | 'action' | 'ignore';
          hidden?: boolean;
          cardRole?: CardRole;
          pageItems: NSPanel.PageItemDataItemsOptions[];
          //    mediaNamespace: string;
          config: PageMenuConfig | PageOthersConfigs | screensaverDataItemOptions;
      }
    | PageBaseTemplate
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
        | cardPopupDataItems
        | cardQRDataItems
        | cardChartDataItems
        | cardScheduleDataItems;
};

export type PageBaseConfigTemplate = {
    card: Exclude<PageTypeCards, 'screensaver' | 'screensaver2' | 'screensaver3'>;
    adapter: string;
    alwaysOn: 'none' | 'always' | 'action' | 'ignore';
    pageItems: NSPanel.PageItemDataItemsOptions[];

    //    mediaNamespace: string;
    config: undefined | PageBaseConfig | screensaverDataItemOptions;
    items: undefined;
};

type PagePopupConfig = {
    details: string;
    setStateYes?: string;
    setStateMid?: string;
    setStateNo?: string;
    setStateID?: string;
    setGlobalYes?: string;
    setGlobalMid?: string;
    setGlobalNo?: string;
    setGlobalID?: string;
};

type PopupDetailsType = 'information' | 'acknowledge';

export type PagePopupDataDetails = {
    priority: number;
    type: PopupDetailsType;
    id?: string;
    global?: boolean;
    headline: string;
    colorHeadline?: RGB;
    buttonLeft?: string;
    colorButtonLeft?: RGB;
    buttonMid?: string;
    colorButtonMid?: RGB;
    buttonRight: string;
    colorButtonRight?: RGB;
    text: string;
    colorText?: RGB;
    //timeout?: number;
    //closingBehaviour?: string;
    textSize?: string;
    icon?: AllIcons;
    iconColor?: RGB;
    alwaysOn?: boolean;
    buzzer?: boolean | string;
};

export type PopupNotificationVal =
    | {
          headline?: string;
          colorHeadline?: { r: number; g: number; b: number };
          buttonLeft?: string;
          colorButtonLeft?: { r: number; g: number; b: number };
          buttonMid?: string;
          colorButtonMid?: { r: number; g: number; b: number };
          buttonRight?: string;
          colorButtonRight?: { r: number; g: number; b: number };
          text?: string;
          colorText?: { r: number; g: number; b: number };
          timeout?: number;
      }
    | string
    | null
    | undefined;

export type cardNotifyDataItemOptions = {
    card: Extract<AdminCardTypes, 'popupNotify'>;
    data: ChangeTypeOfKeys<PagePopupConfig, NSPanel.DataItemsOptions | undefined>;
};

export type closingBehaviour = 'both' | 'yes' | 'no' | 'none';

export type cardPopupDataItems = {
    card: Extract<AdminCardTypes, 'popupNotify'>;
    data: ChangeTypeOfKeys<PagePopupConfig, dataItem.Dataitem | undefined>;
};

export type cardPopup2DataItemOptions = {
    card: Extract<AdminCardTypes, 'popupNotify'>;
    data: ChangeTypeOfKeys<PagePopupConfig, NSPanel.DataItemsOptions | undefined>;
};

type PageChartConfig = {
    headline: string;
    text: string;
    color: NSPanel.ColorEntryTypeBooleanStandard;
    ticks: string; // Chart ticks als Array
    value: string; // Chart value
    chartType?: string; // 'cardChart' | 'cardLChart'

    dbData?: string;

    instanceDataSource?: number; // 0 = script, 1 = DB adapter
    dbInstance?: string; // Instance ID from DB adapter
    setStateForTicks?: string; // State for ticks from user
    setStateForValues?: string; // State for values from user
    setStateForDB?: string; // State for DB Instance
    labelYAchse?: string; // Label for Y-Axis
    rangeHours?: number; // Range in hours
    maxXAxisTicks?: number; // Max ticks on X-Axis
    maxXAxisLabels?: number; // Max labels on X-Axis
    factorCardChart?: number; // 1, 10, 100, 1000
};

export type cardChartDataItemOptions = {
    card: Extract<AdminCardTypes, 'cardChart' | 'cardLChart'>;
    data: ChangeTypeOfKeys<PageChartConfig, NSPanel.DataItemsOptions | undefined>;
};
export type cardChartDataItems = {
    card: Extract<AdminCardTypes, 'cardChart' | 'cardLChart'>;
    data: ChangeTypeOfKeys<PageChartConfig, dataItem.Dataitem | undefined>;
};

type PageAlarmConfig = {
    alarmType?: string; //alarm unlock
    headline: string;
    entity1: NSPanel.ValueEntryType;
    button1: string;
    button2: string;
    button3: string;
    button4: string;
    button5: string;
    button6: string;
    button7: string;
    button8: string;
    icon: NSPanel.IconEntryType;
    pin: number;
    approved?: boolean;
    approveState: string;
    statusState: string;
    global: boolean;
    setNavi?: string;
};
export type cardAlarmDataItemOptions = {
    card: Extract<AdminCardTypes, 'cardAlarm'>;
    data: ChangeTypeOfKeys<PageAlarmConfig, NSPanel.DataItemsOptions | undefined>;
};
export type cardAlarmDataItems = {
    card: Extract<AdminCardTypes, 'cardAlarm'>;
    data: ChangeTypeOfKeys<PageAlarmConfig, dataItem.Dataitem | undefined>;
};

type PageQRBaseConfig = {
    headline: string;
    ssidUrlTel?: string;
    selType?: number;
    wlantype?: string;
    wlanhidden?: boolean;
    password?: string;
    pwdhidden?: boolean;
    setState?: string;
};
export type cardQRDataItemOptions = {
    card: Extract<AdminCardTypes, 'cardQR'>;
    data: ChangeTypeOfKeys<PageQRBaseConfig, NSPanel.DataItemsOptions | undefined>;
};
export type cardQRDataItems = {
    card: Extract<AdminCardTypes, 'cardQR'>;
    data: ChangeTypeOfKeys<PageQRBaseConfig, dataItem.Dataitem | undefined>;
};
export type QRButtonEvent = 'OnOff';

export type cardPowerDataItemOptions = {
    card: Extract<AdminCardTypes, 'cardPower'>;
    index: number;
    data: ChangeTypeOfKeys<PageGridPowerConfig, NSPanel.DataItemsOptions | undefined>;
};
export type cardPowerDataItems = {
    card: Extract<AdminCardTypes, 'cardPower'>;
    data: ChangeTypeOfKeys<PageGridPowerConfig, dataItem.Dataitem | undefined>;
};

export type cardGridDataItemOptions = {
    card: Extract<cardGridTypes, 'cardGrid' | 'cardGrid2' | 'cardGrid3'>;
    cardRole?: CardRole;

    data: ChangeTypeOfKeys<PageGridBaseConfig, NSPanel.DataItemsOptions | undefined>;
} & PageMenuBaseConfig;
export type cardGridDataItems = {
    card: Extract<cardGridTypes, 'cardGrid' | 'cardGrid2' | 'cardGrid3'>;
    data: ChangeTypeOfKeys<PageGridBaseConfig, dataItem.Dataitem | undefined>;
};

export type cardEntitiesDataItemOptions = {
    card: Extract<cardEntitiesTypes, 'cardEntities'>;
    cardRole?: CardRole;
    data: ChangeTypeOfKeys<PageEntitiesBaseConfig, NSPanel.DataItemsOptions | undefined>;
} & PageMenuBaseConfig;
export type cardEntitiesDataItems = {
    card: Extract<cardEntitiesTypes, 'cardEntities'>;
    data: ChangeTypeOfKeys<PageEntitiesBaseConfig, dataItem.Dataitem | undefined>;
};

export type cardScheduleDataItemOptions = {
    card: Extract<cardEntitiesTypes, 'cardSchedule'>;
    cardRole?: CardRole;

    data: ChangeTypeOfKeys<PageEntitiesBaseConfig, NSPanel.DataItemsOptions | undefined>;
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
    filterType?: NSPanel.filterType;
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
    card: Extract<AdminCardTypes, 'cardThermo'>;
    data: ChangeTypeOfKeys<PageThermoBaseConfig, NSPanel.DataItemsOptions | undefined>;
};
export type cardThermoDataItems = {
    card: Extract<AdminCardTypes, 'cardThermo'>;
    data: ChangeTypeOfKeys<PageThermoBaseConfig, dataItem.Dataitem | undefined>;
};

export type cardMediaDataItemOptions = {
    card: Extract<cardGridTypes, 'cardMedia'>;
    ident?: string;
    logo?: NSPanel.PageItemDataItemsOptions | undefined;
    data: ChangeTypeOfKeys<PageMediaBaseConfig, NSPanel.DataItemsOptions | undefined>;
} & PageMenuBaseConfig;

export type cardMediaDataItems = {
    card: Extract<cardGridTypes, 'cardMedia'>;
    dpInit?: string | RegExp; // ''
    ident?: string;
    logo?: NSPanel.PageItemDataItemsOptions | undefined;
    logoItem?: PageItem | undefined;

    data: ChangeTypeOfKeys<PageMediaBaseConfig, dataItem.Dataitem | undefined>;
};

// Screensaver Types - optimiert mit const assertion
export type screenSaverCardType = 'screensaver' | 'screensaver2' | 'screensaver3';

export type screensaverDataItemOptions = {
    card: Extends<PageTypeCards, screenSaverCardType>;
    mode: NSPanel.ScreensaverModeType;
    rotationTime: number;
    model: NSPanel.NSpanelModel;
    screensaverSwipe: boolean;
    screensaverIndicatorButtons: boolean;
    data: undefined;
};
type Extends<T, U extends T> = U;
export type ChangeDeepPartial<Obj> = Obj extends
    | object
    | listItem
    | PageTypeCards
    | NSPanel.IconBoolean
    | NSPanel.TextEntryType
    | NSPanel.ValueEntryType
    | NSPanel.IconEntryType
    | NSPanel.ScaledNumberType
    | PageGridPowerConfigElement
    | NSPanel.RGB
    | NSPanel.ColorEntryType
    | PageMediaBaseConfig
    | NSPanel.SerialTypePageElements
    ? Obj extends NSPanel.DataItemsOptions
        ? NSPanel.DataItemsOptions | null
        : {
              [K in keyof Obj]?: ChangeDeepPartial<Obj[K]> | null;
          }
    : NSPanel.DataItemsOptions | null;

export type ChangeTypeOfKeys<Obj, N> = Obj extends
    | object
    | listItem
    | PageTypeCards
    | NSPanel.IconBoolean
    | NSPanel.TextEntryType
    | NSPanel.ValueEntryType
    | NSPanel.IconEntryType
    | NSPanel.ScaledNumberType
    | PageGridPowerConfigElement
    | NSPanel.RGB
    | NSPanel.ColorEntryType
    | PageMediaBaseConfig
    | NSPanel.SerialTypePageElements
    ? Obj extends NSPanel.RGB | NSPanel.IconScaleElement | NSPanel.DataItemsOptions
        ? N
        : {
              [K in keyof Obj]?: ChangeTypeOfKeys<Obj[K], N>;
          }
    : N;

export type ChangeTypeOfKeysGeneric<Obj, N> = Obj extends object
    ? Obj extends NSPanel.RGB
        ? N
        : {
              [K in keyof Obj]: ChangeTypeOfKeysGeneric<Obj[K], N>;
          }
    : N;

export type PageMediaBaseConfig = {
    headline: string;
    alwaysOnDisplay?: boolean;
    album?: string;
    title?: NSPanel.ValueEntryTypeWithColor;
    duration?: string;
    elapsed?: string;
    station?: boolean;
    artist?: NSPanel.ValueEntryTypeWithColor;
    shuffle?: NSPanel.ScaledNumberType;
    volume?: NSPanel.ScaledNumberType;
    useGroupVolume?: boolean;
    volumeGroup?: NSPanel.ScaledNumberType;
    icon?: string;
    play?: string;
    onOffColor?: NSPanel.ColorEntryTypeBooleanStandard;
    mediaState?: string;
    isPlaying?: boolean;
    stop?: string;
    pause?: string;
    forward?: string;
    backward?: string;
    coordinator?: boolean;
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
    homeValueTop: NSPanel.ValueEntryType;
    homeIcon: NSPanel.IconEntryType;
    homeValueBot: NSPanel.ValueEntryType;
    leftTop: PageGridPowerConfigElement;
    leftMiddle: PageGridPowerConfigElement;
    leftBottom: PageGridPowerConfigElement;
    rightTop: PageGridPowerConfigElement;
    rightMiddle: PageGridPowerConfigElement;
    rightBottom: PageGridPowerConfigElement;
};

export type PageGridPowerConfigElement =
    | {
          icon?: NSPanel.IconEntryType;
          value?: NSPanel.ValueEntryType;
          speed?: NSPanel.ScaledNumberType;
          text?: NSPanel.TextEntryType;
          targetUnit?: string;
      }
    | undefined;

export type cardThermo2DataItemOptions = {
    card: Extract<cardGridTypes, 'cardThermo2'>;

    sortOrder?: 'H' | 'V' | 'HM' | 'VM' | 'HB' | 'VB';
    cardRole?: CardRole;
    data: ChangeTypeOfKeys<PageThermo2BaseConfig, NSPanel.DataItemsOptions | undefined>;
} & PageMenuBaseConfig;
export type cardThermo2DataItems = {
    card: Extract<cardGridTypes, 'cardThermo2'>;
    data: ChangeTypeOfKeys<PageThermo2BaseConfig, dataItem.Dataitem | undefined>;
};

type PageThermo2BaseConfig = Thermo2DataSetBase | Thermo2DataSetBase[];

type Thermo2DataSetBase = {
    entity3?: NSPanel.ValueEntryType; // Thermostat
    entity1: NSPanel.ValueEntryType; // sensor
    icon1?: NSPanel.IconEntryType;
    entity2?: NSPanel.ValueEntryType; // humidity
    icon2?: NSPanel.IconEntryType;
    icon4?: NSPanel.IconEntryType;
    icon5?: NSPanel.IconEntryType;
    headline?: string;
    minValue?: number;
    maxValue?: number;
    stepValue?: number;
    power?: boolean;
    mode?: string;
};

/*type ThermoDataSetBase = {
    entity1: NSPanel.ValueEntryType;
    humidity?: NSPanel.ValueEntryType;
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
    mixed1: NSPanel.ValueEntryType;
    mixed2: NSPanel.ValueEntryType;
    mixed3: NSPanel.ValueEntryType;
    mixed4: NSPanel.ValueEntryType;
    minTemp: number; // *10
    maxTemp: number; // *10
    tempStep: number; // *10
    icon?: string;
    color?: string;
};

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
    options: [string?, string?, string?, string?, string?, string?, string?, string?, string?];
};

export type PageNotifyMessage = {
    event: 'entityUpd';
    headline: string;
    hColor: string;
    blText: string;
    blColor: string;
    bmText: string;
    bmColor: string;
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
    options: Record<NSPanel.ScreenSaverPlaces, string[]>;
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
export type listItem = NSPanel.listItem;

export type toolboxItem = ChangeTypeOfKeys<listItem, NSPanel.DataItemsOptions | undefined> & {
    action: NSPanel.MediaToolBoxAction;
};
export type toolboxItemDataItem = ChangeTypeOfKeys<NSPanel.listItem, dataItem.Dataitem | undefined> & {
    action: NSPanel.MediaToolBoxAction;
};

export type placeholderType = Record<
    string,
    {
        text?: string;
        dp?: string;
    }
>;
