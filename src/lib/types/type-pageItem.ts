import { Dataitem } from '../classes/data-item';
import { RGB } from './Color';
import { ChangeTypeOfKeys } from './pages';
import * as Types from './types';

export type PageLightItem = {
    type: 'light' | 'dimmer' | 'brightnessSlider' | 'hue' | 'rgb';
    bri: PageItemMinMaxValue;
    ct: PageItemMinMaxValue;
    hue: PageItemMinMaxValue; //0-360
    rgb: RGB;
};

type PageItemMinMaxValue = { min: number; max: number };
export type PageItemColorSwitch = { on: RGB; off: RGB };

export type IconBoolean = Record<Types.BooleanUnion, string | undefined>;
export type ThisCardMessageTypes = 'input_sel' | 'button';

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
          icon?: string;
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
          currentState: string;
          list: string;
      }
    | {
          type: 'popupThermo';
          headline: string;
          entityName: string;
          currentState: string;
          list: string;
      }
    | ({
          type: 'popupLight';
      } & Record<
          | 'entityName'
          | 'icon'
          | 'iconColor'
          | 'power'
          | 'sliderBriPos'
          | 'sliderCtPos'
          | 'colorMode'
          | 'colorIdentifier'
          | 'ctIdentifier'
          | 'briIdentifier'
          | 'effect_supported',
          string
      >);

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

export type PageItemButton = Pick<PageItemBase, 'setValue1' | 'text' | 'icon' | 'color' | 'entity1' | 'setNavi'>;
export type PageItemButtonDataItemsOptions = {
    type: 'button';
    data: ChangeTypeOfKeys<PageItemButton, Types.DataItemsOptions | undefined>;
};
export type PageItemButtonDataItems = {
    type: 'button';
    data: ChangeTypeOfKeys<PageItemButton, Dataitem | undefined>;
};

export type PageItemLight = Pick<
    PageItemBase,
    | 'setValue1'
    | 'valueList'
    | 'setList'
    | 'text1'
    | 'text2'
    | 'text3'
    | 'icon'
    | 'color'
    | 'entity1'
    | 'Red'
    | 'Green'
    | 'Blue'
    | 'saturation'
    | 'dimmer'
    | 'hue'
    | 'entityInSel'
    | 'ct'
    | 'headline'
>;
export type PageItemLightDataItemsOptions = {
    type: 'light';
    data: ChangeTypeOfKeys<PageItemLight, Types.DataItemsOptions | undefined>;
};
export type PageItemLightDataItems = {
    type: 'light';
    data: ChangeTypeOfKeys<PageItemLight, Dataitem | undefined>;
};

export type PageItemInputSel = Pick<
    PageItemBase,
    'entityInSel' | 'text' | 'icon' | 'color' | 'headline' | 'valueList' | 'setList'
>;
export type PageItemInputSelDataItemsOptions = {
    type: 'input_sel';
    data: ChangeTypeOfKeys<PageItemInputSel, Types.DataItemsOptions | undefined>;
};
export type PageItemInputSelDataItems = {
    type: 'input_sel';
    data: ChangeTypeOfKeys<PageItemInputSel, Dataitem | undefined>;
};

export type PageItemBase = {
    headline?: string;
    color?: ColorEntryType;
    icon?: IconEntryType;
    text?: TextEntryType;
    entityInSel: ValueEntryType;
    entity1: ValueEntryType; // Readonly Werte die angezeigt werden soll. wird immer für insel verwendet
    entity2?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
    entity3?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
    text1?: TextEntryType;
    text2?: TextEntryType;
    text3?: TextEntryType;
    setValue1?: string;
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
    dimmer?: ScaledNumberType;
    ct?: ScaledNumberType;
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
        | 'text.list'
        | 'arrow';
    dpInit: string | undefined;
    initMode: 'auto' | 'custom';
    type: Types.SerialTypePageElements;
    data: PageItemBase;
};
/*export type ChangeTypeOfPageItem<Obj, N> = Obj extends
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
    : N;*/
export type PageItemDataItems = Omit<PageItemUnion, 'data' | 'type'> &
    (PageItemButtonDataItems | PageItemInputSelDataItems | PageItemLightDataItems);

export type PageItemDataItemsOptions = Omit<PageItemUnion, 'data' | 'type'> &
    (PageItemButtonDataItemsOptions | PageItemInputSelDataItemsOptions | PageItemLightDataItemsOptions);

export type ColorEntryType = Record<Types.BooleanUnion, RGB | undefined> & { scale?: Types.IconScaleElement };

export type IconEntryType =
    | (Partial<Record<Types.BooleanUnion, { value: string; color: RGB }>> & {
          scale?: Types.IconScaleElement | undefined;
          maxBri?: string;
          minBri?: string;
      })
    | undefined;

export type TextEntryType = Record<Types.BooleanUnion, string>;

export type ValueEntryType =
    | {
          value: number;
          decimal?: number;
          factor?: number;
          unit?: string;
          minScale?: number;
          maxScale?: number;
      }
    | undefined;
export type ScaledNumberType =
    | {
          value: number;
          minScale?: number;
          maxScale?: number;
      }
    | undefined;
export type listCommand = { id: string; value: string; command?: listCommandUnion };
type listCommandUnion = 'flip';
export function islistCommandUnion(F: any | listCommandUnion): F is listCommandUnion {
    switch (F as listCommandUnion) {
        case 'flip': {
            return true;
        }
    }
    return false;
}
