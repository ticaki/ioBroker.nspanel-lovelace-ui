import { Dataitem } from '../classes/data-item';
import { RGB } from './Color';
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
    type?: Extract<Types.SerialTypePopup, ThisCardMessageTypes>;
    iconNumber: 0 | 1 | 2 | 3 | 4 | 5; // media0 usw.
    mode: MediaToolBoxAction;
};
export interface MessageItem extends MessageItemInterface {
    mainId?: string;
    subId?: string;
}
export type entityUpdateDetailMessage =
    | {
          type: '2Sliders';
          entityName: string;
          icon?: undefined;
          slidersColor: string | 'disable';
          buttonState: boolean | 'disable';
          slider1Pos: number | 'disable';
          slider2Pos: number | 'disable';
          hueMode: boolean;
          hue_translation: string | '';
          slider2Translation: string | '';
          slider1Translation: string | '';
          popup: boolean;
      }
    | {
          type: 'insel';
          entityName: string;
          textColor: string;
          headline: string;
          list: string;
      };

export type entityUpdateDetailMessageType = '2Sliders' | 'insel';

export type entityUpdateDetailMessageTemplate2 = Record<
    PageItemUnion['role'] | Types.roles,
    entityUpdateDetailMessageTemplate
>;

export type entityUpdateDetailMessageTemplate =
    | {
          type: '2Sliders';
          slidersColor: RGB | false;
          buttonState: true | false;
          slider1Pos: number | false;
          slider2Pos: number | false;
          hueMode: boolean;
          hue_translation: string | false;
          slider2Translation: string | false;
          slider1Translation: string | false;
          popup: boolean;
      }
    | {
          type: 'popupShutter';
          slider1Pos: number | false;
          slider2Pos: number | false;
          textHeadline: string | false;
          textStatus: string | false;
          iconUp: string | false;
          iconStop: string | false;
          iconDown: string | false;
          iconUpStatus: string | false;
          iconStopStatus: string | false;
          iconDownStatus: string | false;
          textTilt: string | false;
          iconTiltLeft: string | false;
          iconTiltStop: string | false;
          iconTiltRight: string | false;
          iconTiltLeftStatus: string | false;
          iconTiltStopStatus: string | false;
          iconTiltRightStatus: string | false;
      }
    | {
          type: 'insel';
          value: boolean;
          textColor: RGB;
          textHeadline: string | false;
          list: string[] | false;
      };
export type messageItemAllInterfaces = MessageItemMedia | MessageItem;
export interface MessageItemInterface {
    type: Types.SerialTypePopup;
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
    headline?: string;
    color: ColorEntryType;
    icon: IconEntryType;
    text?: TextEntryType;
    entity1: ValueEntryType; // Readonly Werte die angezeigt werden soll.
    entity2?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
    entity3?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
    text1: TextEntryType;
    text2?: TextEntryType;
    text3?: TextEntryType;
    setValue1: string;
    setValue2?: string;
    setValue3?: string;
    valueList?: number;
    setNavi?: number;
    setList?: number;
    maxValue1?: number;
    minValue1?: number;
    minValue2?: number;
    maxValue2?: number;
    interpolateColor?: boolean;
    dimmer?: number | boolean;
    hue?: string;
    saturation?: string;
    useColor: string;
    Red?: number;
    Green?: number;
    Blue?: number;
};

export type PageTypeUnionTemplate = {
    role: Types.roles;
    type: Types.SerialTypePageElements;
    data: {
        headline?: string | undefined;
        color?: RGB | undefined;
        icon?: { true: { value: string; color: RGB | null }; false: { value: string; color: RGB | null } } | undefined;
        text?: { true: string; false: string } | undefined;
        entity1: true | undefined | 'invert' | '';
        entity2?: true | undefined | 'invert';
        entity3?: true | undefined | 'invert';
        text1?: { true: string; false: string } | undefined;
        text2?: { true: string; false: string } | undefined;
        text3?: { true: string; false: string } | undefined;
        setValue1?: true | undefined;
        setValue2?: true | undefined;
        setValue3?: true | undefined;
        modeList?: true | undefined;
        maxValue1?: number | undefined;
        minValue1?: number | undefined;
        minValue2?: number | undefined;
        maxValue2?: number | undefined;
        interpolateColor?: true | undefined;
        dimmer?: true | undefined;
        hue?: true | undefined;
        saturation?: true | undefined;
        useColor?: true | undefined;
        RGB3?: true | undefined;
        optionalData?: any[] | string | true | undefined; //shutter icons - string for true?false or just true
    };
};
//XOR<XOR<A, B>, C>

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
        | 'button'
        | 'media.repeat'
        | 'text.list';
    dpInit: string | undefined;
    initMode: 'auto' | 'custom';
    type: Types.SerialTypePageElements;
    data: PageItemBase;
};
export type ChangeTypeOfPageItem<Obj, N> = Obj extends
    | object
    | IconBoolean
    | TextEntryType
    | ValueEntryType
    | ColorEntryType
    | PageItemBase
    ? Obj extends undefined
        ? undefined
        : Obj extends RGB
          ? N
          : {
                [K in keyof Obj]: ChangeTypeOfPageItem<Obj[K], N>;
            }
    : N;
export type PageItemDataItems = Omit<PageItemUnion, 'data'> & {
    data: ChangeTypeOfPageItem<PageItemUnion['data'], Dataitem | undefined>;
};

export type PageItemDataItemsOptions = Omit<PageItemUnion, 'data'> & {
    data: ChangeTypeOfPageItem<PageItemUnion['data'], Types.DataItemsOptions | undefined>;
};

export type ColorEntryType = Record<Types.BooleanUnion, RGB> & { scale?: Types.IconScaleElement };

export type IconEntryType = Record<Types.BooleanUnion, { value: string; color: RGB }> & {
    scale: Types.IconScaleElement | undefined;
    maxBri: string;
    minBri: string;
};

export type TextEntryType = Record<Types.BooleanUnion, string>;

export type ValueEntryType =
    | {
          value: number;
          decimal: number;
          factor: number;
          unit: string;
          minScale?: number;
          maxScale?: number;
      }
    | undefined;
