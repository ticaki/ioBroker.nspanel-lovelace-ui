import { Dataitem } from '../classes/data-item';
import { RGB } from './Color';
import { ChangeTypeOfKeys } from './pages';
import * as Types from './types';
export type PageBaseItem = {
    id?: string | null;
    icon?: string;
    icon2?: string;
    onColor?: RGB;
    offColor?: RGB;
    useColor?: boolean;
    interpolateColor?: boolean;
    minValueBrightness?: number;
    maxValueBrightness?: number;
    minValueColorTemp?: number;
    maxValueColorTemp?: number;
    minValueLevel?: number;
    maxValueLevel?: number;
    minValueTilt?: number;
    maxValueTilt?: number;
    minValue?: number;
    maxValue?: number;
    stepValue?: number;
    prefixName?: string;
    suffixName?: string;
    name?: string;
    secondRow?: string;
    buttonText?: string;
    unit?: string;
    navigate?: boolean;
    colormode?: string;
    colorScale?: Types.IconScaleElement;
    //adapterPlayerInstance?: adapterPlayerInstanceType,
    targetPage?: string;
    modeList?: string[];
    hidePassword?: boolean;
    autoCreateALias?: boolean;
    yAxis?: string;
    yAxisTicks?: number[] | string;
    xAxisDecorationId?: string;
    useValue?: boolean;
    monobutton?: boolean;
    inSel_ChoiceState?: boolean;
    iconArray?: string[];
    fontSize?: number;
    actionStringArray?: string[];
    alwaysOnDisplay?: boolean;
};
export type PageLightItem = {
    type: 'light' | 'dimmer' | 'brightnessSlider' | 'hue' | 'rgb';
    bri: PageItemMinMaxValue;
    ct: PageItemMinMaxValue;
    hue: PageItemMinMaxValue; //0-360
    rgb: RGB;
};

type PageItemMinMaxValue = { min: number; max: number };
export type PageItemColorSwitch = { on: RGB; off: RGB };

/*export type PageMediaItem = ChangeTypeOfKeys<PageMediaItemBase, Dataitem>;
export type PageMediaItemBase = {
    alwaysOnDisplay: boolean;
    id: string | null;
    vol: PageItemMinMaxValue;
    adapterPlayerInstance: Types.adapterPlayerInstanceType;
    mediaDevice: string;
    colorMediaIcon: RGB;
    colorMediaArtist: RGB;
    colorMediaTitle: RGB;
    speakerList: string[];
    playList: string[];
    equalizerList: string[];
    repeatList: string[];
    globalTracklist: string[];
    crossfade: boolean;
} & PageBaseItemMedia;*/

export type PageThermoItem =
    | ({
          popupThermoMode1?: string[];
          popupThermoMode2?: string[];
          popupThermoMode3?: string[];
          popUpThermoName?: string[];
          setThermoAlias?: string[];
          setThermoDestTemp2?: string;
      } & PageBaseItem)
    | ({
          popupThermoMode1?: string[];
          popupThermoMode2?: string[];
          popupThermoMode3?: string[];
          popUpThermoName?: string[];
          setThermoAlias?: string[];
          setThermoDestTemp2?: string;
      } & PageBaseItem);
export type IconBoolean = Record<Types.BooleanUnion, string | undefined>;
export type ThisCardMessageTypes = 'input_sel' | 'button';
/*export type MessageIstemMedia extends = {
    type?: Extract<Types.SerialType, ThisCardMessageTypes> | '';
    intNameEntity: string;
    iconNumber: 0 | 1 | 2 | 3 | 4 | 5; // media0 usw.
    mode: MediaToolBoxAction;
    icon: string;
    iconColor: string;
    dislayName: string;
    optionalValue?: string;
};*/

export type MessageItemMedia = Partial<MessageItem> & {
    type?: Extract<Types.SerialType, ThisCardMessageTypes>;
    iconNumber: 0 | 1 | 2 | 3 | 4 | 5; // media0 usw.
    mode: MediaToolBoxAction;
};
export interface MessageItem extends MessageItemInterface {
    mainId?: string;
    subId?: string;
}
export type messageItemAllInterfaces = MessageItemMedia | MessageItem;
export interface MessageItemInterface {
    type: Types.SerialType;
    intNameEntity: string;
    icon: string;
    iconColor: string;
    displayName: string;
    optionalValue: string;
}
export type MediaToolBoxAction =
    | 'speaker'
    | 'play'
    | 'tool'
    | 'track'
    | 'favor'
    | 'equal'
    | 'repeat'
    | 'seek'
    | 'cross'
    | 'nexttool';
export type PageItemBase = {
    headline: string;
    color: string;
    icon: IconEntryType;
    text: TextEntryType;
    entity: ValueEntryType; // Readonly Werte die angezeigt werden soll.
    entityOptional?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
    set?: {
        value1: string;
        value2: string;
    };
    minValue: number;
    maxValue: number;
};
//XOR<XOR<A, B>, C>
export type PageItemLights = PageItemLightsBrightness;
type PageItemLightsBrightness = {
    maxValueBrightness: number;
    minValueBrightness: number;
    interpolateColor: boolean;
    dimmer: number | boolean;
    hue: string;
    useColor: string;
    red: number;
    green: number;
    blue: number;
};
export type PageItemUnion = {
    role:
        | 'socket'
        | 'value.time'
        | 'level.timer'
        | 'level.mode.fan'
        | 'value.alarmtime'
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
        | 'switch'
        | 'button'; // veraltet

    type: 'light';
    data: PageItemBase & PageItemLights;
};
export type ChangeTypeOfPageItem<Obj, N> = Obj extends
    | object
    | IconBoolean
    | TextEntryType
    | ValueEntryType
    | ColorEntryType
    | PageItemLightsBrightness
    ? {
          [K in keyof Obj]: ChangeTypeOfKeys<Obj[K], N>;
      }
    : N;
export type PageItemDataitems = Omit<PageItemUnion, 'data'> & {
    data: ChangeTypeOfPageItem<PageItemUnion['data'], Dataitem | undefined>;
};

export type ColorEntryType = Record<Types.BooleanUnion, RGB> & { scale?: Types.IconScaleElement };

export type IconEntryType = Record<Types.BooleanUnion, { value: string; color: RGB }> & {
    scale: Types.IconScaleElement | undefined;
    maxBri: string;
    minBri: string;
};

export type TextEntryType = Record<Types.BooleanUnion, string>;

export type ValueEntryType = {
    value: number;
    decimal: number;
    factor: number;
    unit: string;
};
