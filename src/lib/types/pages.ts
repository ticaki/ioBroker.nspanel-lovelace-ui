import * as Types from './types';
import * as dataItem from '../classes/data-item';
import * as Color from '../const/Color';
import * as typePageItem from './type-pageItem';
import * as typePageItem_1 from './type-pageItem';

export type PageTypeCards =
    | 'cardChart'
    | 'cardLChart'
    | 'cardEntities'
    | 'cardGrid'
    | 'cardGrid2'
    | 'cardThermo'
    | 'cardMedia'
    | 'cardUnlock'
    | 'cardQR'
    | 'cardAlarm'
    | 'cardPower'
    | 'screensaver'
    | 'screensaver2'
    | 'cardBurnRec'
    | 'cardItemSpecial'; // besonders, interne Card zum verwalten von pageItems

/*export type PageType =
    | Types.PageChart
    | Types.PageEntities
    | Types.PageGrid
    | Types.PageGrid2
    | Types.PageThermo
    | Types.PageMedia
    | Types.PageUnlock
    | Types.PageQR
    | Types.PageAlarm
    | Types.PagePower;
*/
export type StateRole =
    | 'button.play'
    | 'button.pause'
    | 'button.next'
    | 'button.prev'
    | 'button.stop'
    | 'button.volume.up'
    | 'button.volume.down'
    | 'media.seek' // (common.type=number) %
    | 'media.mode.shuffle' //(common.type=number) 0 - none, 1 - all, 2 - one
    | 'media.mode.repeat' //(common.type=boolean)
    | 'media.state' //['play','stop','pause'] or [0 - pause, 1 - play, 2 - stop] or [true - playing/false - pause]
    | 'media.artist'
    | 'media.album'
    | 'media.title'
    | 'media.duration'
    | 'media.elapsed.text'
    | 'media.elapsed'
    | 'media.mute'
    | 'level.volume'
    | 'media.album'
    | 'media.playlist'
    | 'button.open.blind'
    | 'button.open'
    | 'button.close.blind'
    | 'button.close'
    | 'button.stop.blind'
    | 'button.stop'
    | 'button.open.tilt'
    | 'button.stop.tilt'
    | 'button.close.tilt'
    | 'level.tilt'
    | 'level.blind'
    | 'level.color.name'
    | 'state'
    | 'level.color.blue'
    | 'level.color.red'
    | 'level.color.green'
    | 'level.color.white'
    | 'level.brightness'
    | 'switch'
    | 'button'
    | 'sensor.window'
    | 'value.temperature'
    | 'value.battery'
    | 'indicator.lowbat'
    | 'value';

export type DeviceRole =
    | 'text'
    | 'socket'
    | 'light'
    | 'dimmer'
    | 'hue'
    | 'ct'
    | 'cie'
    | 'rgbSingle'
    | 'rgb'
    | 'ct'
    | 'blind'
    | 'door'
    | 'window'
    | 'gate'
    | 'motion'
    | 'buttonSensor'
    | 'button'
    | 'media.repeat'
    | 'text.list'
    | 'arrow'
    | 'spotify-playlist'
    | 'spotify-playlist'
    | 'timer'
    | 'rgb.hex'
    | 'text.list'
    | 'rgb'
    | 'indicator'; // timer with internal counter

export function isStateRole(F: string | StateRole): F is StateRole {
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
export function isButtonActionType(F: string | Types.ButtonActionType): F is Types.ButtonActionType {
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
            return true;
        default:
            console.info(F + ' is not isButtonActionType!');
            return false;
    }
}

export type PageBaseConfigTemplate = {
    card: Exclude<PageTypeCards, 'screensaver' | 'screensaver2'>;
    template: Types.PageTemplateIdent;
    adapter: string;
    alwaysOn: 'none' | 'always' | 'action';
    useColor: boolean;
    pageItems: typePageItem.PageItemDataItemsOptions[];

    //    mediaNamespace: string;
    config:
        | undefined
        | cardPowerDataItemOptions
        | cardMediaDataItemOptions
        | cardGridDataItemOptions
        | cardThermoDataItemOptions
        | cardEntitiesDataItemOptions
        | cardAlarmDataItemOptions;
    items: undefined;
};

export type PageBaseConfig = (
    | {
          //    type: PlayerType;
          card: Exclude<PageTypeCards, 'screensaver' | 'screensaver2'>;
          uniqueID: string;
          template?: Types.PageTemplateIdent;
          dpInit: string; // '' and initMode 'auto' throw an error
          alwaysOn: 'none' | 'always' | 'action';
          useColor: boolean;
          pageItems: typePageItem.PageItemDataItemsOptions[];

          //    mediaNamespace: string;
          config:
              | undefined
              | cardPowerDataItemOptions
              | cardMediaDataItemOptions
              | cardGridDataItemOptions
              | cardThermoDataItemOptions
              | cardEntitiesDataItemOptions
              | cardAlarmDataItemOptions;
      }
    | ({
          card: Exclude<PageTypeCards, 'screensaver' | 'screensaver2'>;
          uniqueID: string;
          template: Types.PageTemplateIdent;
          dpInit: string;
      } & Partial<Omit<PageBaseConfigTemplate, 'card' | 'template'>>)
) & {
    items?:
        | undefined
        | cardEntitiesDataItems
        | cardPowerDataItems
        | cardMediaDataItems
        | cardGridDataItems
        | cardThermoDataItems
        | cardAlarmDataItems;
};
type PageAlarmPowerConfig = {
    headline: string;
    entity1: typePageItem.ValueEntryType;
    button1: string;
    button2: string;
    button3: string;
    button4: string;
    icon: typePageItem.IconEntryType;
};
export type cardAlarmDataItemOptions = {
    card: 'cardAlarm';
    data: ChangeTypeOfKeys<PageAlarmPowerConfig, Types.DataItemsOptions | undefined>;
};
export type cardAlarmDataItems = {
    card: 'cardAlarm';
    data: ChangeTypeOfKeys<PageAlarmPowerConfig, dataItem.Dataitem | undefined>;
};

export type cardPowerDataItemOptions = {
    card: 'cardPower';
    data: ChangeTypeOfKeys<PageGridPowerConfig, Types.DataItemsOptions | undefined>;
};
export type cardPowerDataItems = {
    card: 'cardPower';
    data: ChangeTypeOfKeys<PageGridPowerConfig, dataItem.Dataitem | undefined>;
};

export type cardGridDataItemOptions = {
    card: 'cardGrid' | 'cardGrid2';
    data: ChangeTypeOfKeys<PageGridBaseConfig, Types.DataItemsOptions | undefined>;
};
export type cardGridDataItems = {
    card: 'cardGrid' | 'cardGrid2';
    data: ChangeTypeOfKeys<PageGridBaseConfig, dataItem.Dataitem | undefined>;
};

export type cardEntitiesDataItemOptions = {
    card: 'cardEntities';
    data: ChangeTypeOfKeys<PageEntitiesBaseConfig, Types.DataItemsOptions | undefined>;
};
export type cardEntitiesDataItems = {
    card: 'cardEntities';
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
    | Color.RGB
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
    | Color.RGB
    | typePageItem.ColorEntryType
    | PageMediaBaseConfig
    | Types.SerialTypePageElements
    ? Obj extends Color.RGB | Types.IconScaleElement
        ? N
        : {
              [K in keyof Obj]: ChangeTypeOfKeys<Obj[K], N>;
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
    titel: listItem;
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
};

type PageEntitiesBaseConfig = {
    headline: string;
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
    current: number;
    auto?: boolean;
    boost?: boolean;
    error?: boolean;
    humidity?: number;
    manual?: boolean;
    mode?: string;
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
    text1: string;
    text2: string;
    minTemp: number; // *10
    maxTemp: number; // *10
    tempStep: number; // *10
    icon?: string;
    color?: string;
};
export function isColorEntryType(F: object | typePageItem.ColorEntryType): F is typePageItem.ColorEntryType {
    if ('true' in F && 'false' in F && 'scale' in F) return true;
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
    button2: string;
    button3: string;
    button4: string;
    icon: string;
    iconColor: string;
    numpad: 'enable' | 'disable';
    flashing: 'enable' | 'disable';
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

export type PageEntitiesMessage = {
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
    btDetail: '' | 1;
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
    action: typePageItem_1.MediaToolBoxAction;
};
export type toolboxItemDataItem = ChangeTypeOfKeys<listItem, dataItem.Dataitem | undefined> & {
    action: typePageItem_1.MediaToolBoxAction;
};
