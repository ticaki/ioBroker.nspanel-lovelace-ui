import type * as dataItem from '../classes/data-item';
import type { RGB } from '../const/Color';
import type * as pages from './pages';
import type * as Types from './types';

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

export interface MessageItem extends MessageItemInterface {
    mainId?: string;
    subId?: string;
}
export type entityUpdateDetailMessage =
    | {
          type: '2Sliders';
          entityName: string;
          icon?: string;
          slidersColor: string; // | 'disable';
          buttonState: boolean | 'disable';
          slider1Pos: number | 'disable';
          slider2Pos: number | 'disable';
          hueMode: boolean;
          hue_translation: string; //| '';
          slider2Translation: string; //| '';
          slider1Translation: string; //| '';
          popup: boolean;
      }
    | {
          type: 'insel';
          entityName: string;
          textColor: string;
          currentState: string;
          list: string;
          headline: string;
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
      >)
    | ({ type: 'popupShutter' } & Record<
          | 'entityName'
          | 'pos1'
          | 'text2'
          | 'pos1text'
          | 'icon'
          | 'iconL1'
          | 'iconM1'
          | 'iconR1'
          | 'statusL1'
          | 'statusM1'
          | 'statusR1'
          | 'pos2text'
          | 'iconL2'
          | 'iconM2'
          | 'iconR2'
          | 'statusL2'
          | 'statusM2'
          | 'statusR2'
          | 'pos2',
          string
      >)
    | ({
          type: 'popupFan';
      } & Record<
          | 'entityName'
          | 'icon'
          | 'iconColor'
          | 'buttonstate'
          | 'slider1'
          | 'slider1Max'
          | 'speedText'
          | 'mode'
          | 'modeList',
          string
      >)
    | ({
          type: 'popupTimer';
      } & Record<
          | 'entityName'
          | 'iconColor'
          | 'minutes'
          | 'seconds'
          | 'editable'
          | 'action1'
          | 'action2'
          | 'action3'
          | 'text1'
          | 'text2'
          | 'text3',
          string
      >);

//export type entityUpdateDetailMessageType = '2Sliders' | 'insel';

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
export type PageItemDataItems = Omit<PageItemUnion, 'data' | 'type'> &
    (
        | PageItemNumberDataItems
        | PageItemButtonDataItems
        | PageItemShutterDataItems
        | PageItemInputSelDataItems
        | PageItemLightDataItems
        | PageItemTextDataItems
        | PageItemFanDataItems
        | PageItemTimerDataItems
    );

export type PageItemDataItemsOptionsWithOutTemplate = Omit<PageItemUnion, 'data' | 'type'> &
    (
        | PageItemButtonDataItemsOptions
        | PageItemShutterDataItemsOptions
        | PageItemInputSelDataItemsOptions
        | PageItemLightDataItemsOptions
        | PageItemNumberDataItemsOptions
        | PageItemTextDataItemsOptions
        | PageItemFanDataItemsOptions
        | PageItemTimerDataItemsOptions
    );
export type PageItemDataItemsOptions =
    | ({
          template: Types.TemplateIdent;
          dpInit?: string | RegExp;
          appendix?: string;
          color?: { true?: Types.DataItemsOptions; false?: Types.DataItemsOptions; scale?: Types.IconScaleElement };
          icon?: { true?: Types.DataItemsOptions; false?: Types.DataItemsOptions };
          iconText?: { true?: Types.DataItemsOptions; false?: Types.DataItemsOptions };
      } & Partial<
          Omit<PageItemUnion, 'template' | 'data' | 'type'> &
              pages.ChangeDeepPartial<
                  | PageItemButtonDataItemsOptions
                  | PageItemShutterDataItemsOptions
                  | PageItemInputSelDataItemsOptions
                  | PageItemLightDataItemsOptions
                  | PageItemNumberDataItemsOptions
                  | PageItemTextDataItemsOptions
                  | PageItemFanDataItemsOptions
                  | PageItemTimerDataItemsOptions
              >
      >)
    | PageItemDataItemsOptionsWithOutTemplate;

export type PageItemOptionsTemplate = {
    template?: Types.TemplateIdent;
    role?: pages.DeviceRole;
    adapter: string;
    modeScr?: string;
    dpInit?: string;
    type: Types.SerialTypePageElements;
} & (
    | ({ template?: undefined } & Omit<PageItemUnion, 'template' | 'data' | 'type' | 'dpInit' | 'modeScr'> &
          (
              | PageItemButtonDataItemsOptions
              | PageItemShutterDataItemsOptions
              | PageItemInputSelDataItemsOptions
              | PageItemLightDataItemsOptions
              | PageItemNumberDataItemsOptions
              | PageItemTextDataItemsOptions
              | PageItemFanDataItemsOptions
              | PageItemTimerDataItemsOptions
          ))
    | ({ template: Types.TemplateIdent } & Omit<PageItemUnion, 'template' | 'data' | 'type' | 'dpInit' | 'modeScr'> &
          pages.ChangeTypeOfKeys<
              | PageItemButtonDataItemsOptions
              | PageItemShutterDataItemsOptions
              | PageItemInputSelDataItemsOptions
              | PageItemLightDataItemsOptions
              | PageItemNumberDataItemsOptions
              | PageItemTextDataItemsOptions
              | PageItemFanDataItemsOptions
              | PageItemTimerDataItemsOptions,
              Types.DataItemsOptions | undefined | null
          >)
);

export type PageItemTimer = Pick<PageItemBase, 'entity1' | 'text' | 'headline' | 'icon' | 'setValue1'>;
export type PageItemTimerDataItemsOptions = {
    type: 'timer';
    data: pages.ChangeTypeOfKeys<PageItemTimer, Types.DataItemsOptions | undefined>;
};
export type PageItemTimerDataItems = {
    type: 'timer';
    data: pages.ChangeTypeOfKeys<PageItemTimer, dataItem.Dataitem | undefined>;
};

export type PageItemFan = Pick<
    PageItemBase,
    'entity1' | 'speed' | 'text' | 'headline' | 'icon' | 'entityInSel' | 'valueList' | 'setList'
>;
export type PageItemFanDataItemsOptions = {
    type: 'fan';
    data: pages.ChangeTypeOfKeys<PageItemFan, Types.DataItemsOptions | undefined>;
};
export type PageItemFanDataItems = {
    type: 'fan';
    data: pages.ChangeTypeOfKeys<PageItemFan, dataItem.Dataitem | undefined>;
};

export type PageItemNumber = Pick<PageItemBase, 'entity1' | 'text' | 'icon' | 'minValue1' | 'maxValue1'>;
export type PageItemNumberDataItemsOptions = {
    type: 'number';
    data: pages.ChangeTypeOfKeys<PageItemNumber, Types.DataItemsOptions | undefined>;
};
export type PageItemNumberDataItems = {
    type: 'number';
    data: pages.ChangeTypeOfKeys<PageItemNumber, dataItem.Dataitem | undefined>;
};

export type PageItemButton = Pick<
    PageItemBase,
    | 'setValue1'
    | 'setValue2'
    | 'text'
    | 'text1'
    | 'icon'
    | 'color'
    | 'entity1'
    | 'entity2'
    | 'entity3'
    | 'setNavi'
    | 'confirm'
    | 'entity4'
>;
export type PageItemButtonDataItemsOptions = {
    type: 'button' | 'switch';
    data: pages.ChangeTypeOfKeys<PageItemButton, Types.DataItemsOptions | undefined>;
};
export type PageItemButtonDataItems = {
    type: 'button' | 'switch';
    data: pages.ChangeTypeOfKeys<PageItemButton, dataItem.Dataitem | undefined>;
};

export type PageItemText = Pick<
    PageItemBase,
    'entity1' | 'text' | 'text1' | 'entity2' | 'entity3' | 'entity4' | 'icon'
>;
export type PageItemTextDataItemsOptions = {
    type: 'text';
    data: pages.ChangeTypeOfKeys<PageItemButton, Types.DataItemsOptions | undefined>;
};
export type PageItemTextDataItems = {
    type: 'text';
    data: pages.ChangeTypeOfKeys<PageItemButton, dataItem.Dataitem | undefined>;
};

export type PageItemLight = Pick<
    PageItemBase,
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
    | 'White'
    | 'saturation'
    | 'dimmer'
    | 'hue'
    | 'entityInSel'
    | 'ct'
    | 'headline'
    | 'colorMode'
    | 'setValue1'
    | 'setValue2'
>;
export type PageItemLightDataItemsOptions = {
    type: 'light';
    data: pages.ChangeTypeOfKeys<PageItemLight, Types.DataItemsOptions | undefined>;
};
export type PageItemLightDataItems = {
    type: 'light';
    data: pages.ChangeTypeOfKeys<PageItemLight, dataItem.Dataitem | undefined>;
};

export type PageItemInputSel = Pick<
    PageItemBase,
    | 'entityInSel'
    | 'text'
    | 'entity2'
    | 'icon'
    | 'color'
    | 'headline'
    | 'valueList'
    | 'valueList2'
    | 'setList'
    | 'setValue1'
>;

export type PageItemInputSelDataItemsOptions = {
    type: 'input_sel';
    data: pages.ChangeTypeOfKeys<PageItemInputSel, Types.DataItemsOptions | undefined>;
};

export type PageItemInputSelDataItems = {
    type: 'input_sel';
    data: pages.ChangeTypeOfKeys<PageItemInputSel, dataItem.Dataitem | undefined>;
};

export type PageItemShutter = Pick<
    PageItemBase,
    | 'up'
    | 'down'
    | 'stop'
    | 'up2'
    | 'down2'
    | 'stop2'
    | 'entity1'
    | 'entity2'
    | 'text'
    | 'text1'
    | 'text2'
    | 'icon'
    | 'color'
    | 'headline'
    | 'valueList'
    | 'setList'
    | 'setValue1'
    | 'setValue2'
>;
export type PageItemShutterDataItemsOptions = {
    type: 'shutter';
    data: pages.ChangeTypeOfKeys<PageItemShutter, Types.DataItemsOptions | undefined>;
};
export type PageItemShutterDataItems = {
    type: 'shutter';
    data: pages.ChangeTypeOfKeys<PageItemShutter, dataItem.Dataitem | undefined>;
};

export type PageItemBase = {
    headline?: string;
    color?: ColorEntryType;
    icon?: IconEntryType;
    text?: TextEntryType | TextEntryType2;
    entityInSel: ValueEntryType;
    entity1?: ValueEntryType; // Readonly Werte die angezeigt werden soll. wird immer für insel verwendet
    entity2?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
    entity3?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
    entity4?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
    text1?: TextEntryType;
    text2?: TextEntryType;
    text3?: TextEntryType;
    mixed1?: ValueEntryType; // Readonly Werte die angezeigt werden soll. wird immer für insel verwendet
    mixed2?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
    mixed3?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
    mixed4?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
    setValue1?: string;
    setValue2?: string;
    setValue3?: string;
    valueList?: number;
    valueList2?: number;
    setNavi?: number;
    confirm?: string;
    setList?: number;
    maxValue1?: number;
    minValue1?: number;
    minValue2?: number;
    maxValue2?: number;
    interpolateColor?: boolean;
    dimmer?: ScaledNumberType;
    speed?: ScaledNumberType;
    ct?: ScaledNumberType;
    hue?: string;
    colorMode: boolean; // true rgb, false ct
    saturation?: string;
    useColor: string;
    Red?: number;
    Green?: number;
    Blue?: number;
    White?: ScaledNumberType;
    up: number;
    stop?: number;
    down: number;
    up2?: number;
    stop2?: number;
    down2?: number;
};

export type PageTypeUnionTemplate = {
    role: pages.DeviceRole;
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
    role?: pages.DeviceRole;
    template?: undefined;
    dpInit?: string | RegExp;
    enums?: string | string[];
    device?: string;
    modeScr?: Types.ScreenSaverPlaces | undefined;
    type: Types.SerialTypePageElements;
    data: PageItemBase;
};

export type ColorEntryType = Record<Types.BooleanUnion, RGB | undefined> & { scale?: Types.IconScaleElement };

export type ColorEntryTypeNew =
    | (Partial<Record<Types.BooleanUnion, { color: RGB }>> & {
          scale?: Types.IconScaleElement | undefined;
          maxBri?: string;
          minBri?: string;
      })
    | undefined;
export type IconEntryType =
    | (Partial<Record<Types.BooleanUnion, { value: string; text?: TextSizeEntryType }>> &
          ColorEntryTypeNew & { unstable: { value: string; text?: TextSizeEntryType; color: RGB } })
    | undefined;

export type TextEntryType = Record<Types.BooleanUnion, string>;
export type TextSizeEntryType = ValueEntryType & { textSize?: number };
export type TextEntryType2 = Record<Types.BooleanUnion, { value: string; prefix: string; suffix: string }>;
export type ValueEntryType =
    | {
          value: number;
          decimal?: number;
          factor?: number;
          unit?: string;
          minScale?: number;
          maxScale?: number;
          set?: number;
          dateFormat?: string;
          math?: string;
      }
    | undefined;
export type ScaledNumberType =
    | {
          value: number;
          minScale?: number;
          maxScale?: number;
          factor?: number;
          set?: number;
          mode?: string; // atm 'kelvin' | 'mired'
      }
    | undefined;
export type listCommand = { id: string; value: string; command?: listCommandUnion };
type listCommandUnion = 'flip';
export function islistCommandUnion(F: any): F is listCommandUnion {
    switch (F as listCommandUnion) {
        case 'flip': {
            return true;
        }
    }
    return false;
}

export type spotifyPlaylist = Array<{
    id: string;
    title: string;
    artistName: string;
    artistArray: Array<{
        id: string;
        name: string;
    }>;
    album: {
        id: string;
        name: string;
    };
    durationMs: number;
    duration: string;
    addedAt: string;
    addedBy: string;
    discNumber: number;
    episode: boolean;
    explicit: boolean;
    popularity: number;
}>;
