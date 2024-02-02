import { Dataitem } from '../classes/data-item';
import { RGB } from './Color';
import { IconEntryType, TextEntryType, ValueEntryType } from './pageItem';
import { ChangeTypeOfKeys, PageRole } from './pages';

/**
 * Join arguments with ~ and return the string;
 * @param tokens unlimited numbers of strings
 * @returns
 */
export function buildNSPanelString(...tokens: (string | number)[]): string {
    return tokens.join('~');
}

const ArrayPlayerTypeWithMediaDevice = ['alexa2', 'sonos', 'squeezeboxrpc'] as const;
const ArrayPlayerTypeWithOutMediaDevice = ['spotify-premium', 'volumio', 'bosesoundtouch'] as const;

export function isPlayerWithMediaDevice(F: string | _PlayerTypeWithMediaDevice): F is _PlayerTypeWithMediaDevice {
    return ArrayPlayerTypeWithMediaDevice.indexOf(F as _PlayerTypeWithMediaDevice) != -1;
}
/** check if adapterPlayerInstanceType has all Playertypes */
export function checkSortedPlayerType(F: notSortedPlayerType): adapterPlayerInstanceType {
    return F;
}

export function isEventMethod(F: string | EventMethod): F is EventMethod {
    switch (F as EventMethod) {
        case 'startup':
        case 'sleepReached':
        case 'pageOpenDetail':
        case 'buttonPress2':
        case 'renderCurrentPage':
        case 'button1':
        case 'button2':
            return true;
        default:
            // Have to talk about this.
            throw new Error(`Please report to developer: Unknown EventMethod: ${F} `);
            return false;
    }
}

export function isPopupType(F: PopupType | string): F is PopupType {
    switch (F as PopupType) {
        case 'popupFan':
        case 'popupInSel':
        case 'popupLight':
        case 'popupLightNew':
        case 'popupNotify':
        case 'popupShutter':
        case 'popupThermo':
        case 'popupTimer':
            return true;
        default:
            console.info(`Unknown PopupType: ${F} `);
            return false;
    }
}
// If u get a error here u forgot something in PageTypeCards or PageType
/*export function checkPageType(F: PageTypeCards, A: PageType): void {
    A.type = F;
}*/

/*export function isPageThermoItem(F: PageItem | PageThermoItem): F is PageThermoItem {
    return 'popupThermoMode1' in F;
}

export function isPageMedia(F: PageType | PageMedia): F is PageMedia {
    return F.type == 'cardMedia';
}
export function isPagePower(F: PageType | PagePower): F is PagePower {
    return F.type == 'cardPower';
}
*/
export type PopupType =
    | 'popupFan'
    | 'popupInSel'
    | 'popupLight'
    | 'popupLightNew'
    | 'popupNotify'
    | 'popupShutter'
    | 'popupThermo'
    | 'popupTimer';

export type EventMethod =
    | 'startup'
    | 'sleepReached'
    | 'pageOpenDetail'
    | 'buttonPress2'
    | 'renderCurrentPage'
    | 'button1'
    | 'button2';
export type panelRecvType = {
    event: 'event';
    method: EventMethod;
};

export const SerialTypeArray = [
    'light',
    'shutter',
    'delete',
    'text',
    'button',
    'switch',
    'number',
    'input_sel',
    'timer',
    'fan',
];

export type SerialType =
    | 'button'
    | 'light'
    | 'shutter'
    | 'text'
    | 'input_sel'
    | 'timer'
    | 'number'
    | 'fan'
    | 'switch'
    | 'delete';

export type roles =
    | 'light'
    | 'socket'
    | 'dimmer'
    | 'hue'
    | 'rgb'
    | 'rgbSingle'
    | 'cd'
    | 'blind'
    | 'door'
    | 'window'
    | 'volumeGroup'
    | 'volume'
    | 'info'
    | 'humidity'
    | 'temperature'
    | 'value.temperature'
    | 'value.humidity'
    | 'sensor.door'
    | 'sensor.window'
    | 'thermostat'
    | 'warning'
    | 'ct'
    | 'cie'
    | 'gate'
    | 'motion'
    | 'buttonSensor'
    | 'button'
    | 'value.time'
    | 'level.timer'
    | 'value.alarmtime'
    | 'level.mode.fan'
    | 'lock'
    | 'slider'
    | 'switch.mode.wlan'
    | 'media'
    | 'timeTable'
    | 'airCondition';

export type ButtonActionType =
    | 'bExit'
    | 'bUp'
    | 'bNext'
    | 'bSubNext'
    | 'bPrev'
    | 'bSubPrev'
    | 'bHome'
    | 'notifyAction'
    | 'OnOff'
    | 'button'
    | 'up'
    | 'stop'
    | 'down'
    | 'positionSlider'
    | 'tiltOpen'
    | 'tiltStop'
    | 'tiltSlider'
    | 'tiltClose'
    | 'brightnessSlider'
    | 'colorTempSlider'
    | 'colorWheel'
    | 'tempUpd'
    | 'tempUpdHighLow'
    | 'media-back'
    | 'media-pause'
    | 'media-next'
    | 'media-shuffle'
    | 'volumeSlider'
    | 'mode-speakerlist'
    | 'mode-playlist'
    | 'mode-tracklist'
    | 'mode-repeat'
    | 'mode-equalizer'
    | 'mode-seek'
    | 'mode-crossfade'
    | 'mode-favorites'
    | 'mode-insel'
    | 'media-OnOff'
    | 'timer-start'
    | 'timer-pause'
    | 'timer-cancle'
    | 'timer-finish'
    | 'hvac_action'
    | 'mode-modus1'
    | 'mode-modus2'
    | 'mode-modus3'
    | 'number-set'
    | 'mode-preset_modes'
    | 'A1'
    | 'A2'
    | 'A3'
    | 'A4'
    | 'D1'
    | 'U1';

export type Payload = {
    payload: string;
};
export type BooleanUnion = 'true' | 'false';

/*export type PageBaseType = {
    type: PageTypeCards;
    heading: string;
    items: PageItem[];
    useColor: boolean;
    subPage?: boolean;
    parent?: PageType;
    parentIcon?: string;
    parentIconColor?: RGB;
    prev?: string;
    prevIcon?: string;
    prevIconColor?: RGB;
    next?: string;
    nextIcon?: string;
    nextIconColor?: RGB;
    home?: string;
    homeIcon?: string;
    homeIconColor?: RGB;
};
export type PageEntities = {
    type: 'cardEntities';
    items: [PageItem?, PageItem?, PageItem?, PageItem?, PageItem?];
} & PageBaseType;

export type PageGrid = {
    type: 'cardGrid';
    items: [PageItem?, PageItem?, PageItem?, PageItem?, PageItem?, PageItem?];
} & PageBaseType;

export type PageGrid2 = {
    type: 'cardGrid2';
    items: [PageItem?, PageItem?, PageItem?, PageItem?, PageItem?, PageItem?, PageItem?, PageItem?];
} & PageBaseType;

export type PageThermo = {
    type: 'cardThermo';
    items: [PageThermoItem];
} & Omit<PageBaseType, 'useColor'>;

export type PageMedia = {
    type: 'cardMedia';
    items: [PageMediaItem];
} & Omit<PageBaseType, 'useColor' | 'autoCreateAlias'>;

export type PageAlarm = {
    type: 'cardAlarm';
    items: [PageItem];
} & Omit<PageBaseType, 'useColor'>;

export type PageUnlock = {
    type: 'cardUnlock';
    items: [PageItem];
} & Omit<PageBaseType, 'useColor'> &
    Partial<Pick<PageBaseType, 'useColor'>>;

export type PageQR = {
    type: 'cardQR';
    items: [PageItem];
} & Omit<PageBaseType, 'useColor'>;

export type PagePower = {
    type: 'cardPower';
    items: [PageItem];
} & Omit<PageBaseType, 'useColor'>;

export type PageChart = {
    type: 'cardChart' | 'cardLChart';
    items: PageItem[];
} & Omit<PageBaseType, 'useColor'>;

export type PageItem = PageBaseItem | PageMediaItem | PageThermoItem;
*/
export type DimMode = {
    dimmodeOn: boolean | undefined;
    brightnessDay: number | undefined;
    brightnessNight: number | undefined;
    timeDay: string | undefined;
    timeNight: string | undefined;
};

/*export type ConfigButtonFunction = {
    mode: 'page' | 'toggle' | 'set' | null;
    page:
        | PageThermo
        | PageMedia
        | PageAlarm
        | PageQR
        | PageEntities
        | PageGrid
        | PageGrid2
        | PagePower
        | PageChart
        | PageUnlock
        | null;
    entity: string | null;
    setValue: string | number | boolean | null;
};*/

export type Config = {
    leftEntity: boolean;
    indicatorEntity: any;
    mrIcon1Entity: any;
    mrIcon2Entity: any;
    panelRecvTopic: string;
    panelSendTopic: string;
    weatherEntity: string;
    screensaver: {
        favoritEntity: [ScreenSaverElement];
        leftEntity: ScreenSaverElement[];
        bottomEntity: ScreenSaverElement[];
        alternateEntity: [ScreenSaverElement?];
        indicatorEntity: ScreenSaverElement[];
        mrIconEntity: [ScreenSaverElement, ScreenSaverElement];
    };
    defaultColor: RGB;
    defaultOnColor: RGB;
    defaultOffColor: RGB;
    defaultBackgroundColor: RGB;
};
export type leftScreensaverEntityType =
    | [ScreenSaverElementWithUndefined, ScreenSaverElementWithUndefined, ScreenSaverElementWithUndefined]
    | [];
export type indicatorScreensaverEntityType =
    | [
          ScreenSaverElementWithUndefined?,
          ScreenSaverElementWithUndefined?,
          ScreenSaverElementWithUndefined?,
          ScreenSaverElementWithUndefined?,
          ScreenSaverElementWithUndefined?,
      ]
    | [];
export type ScreenSaverElementWithUndefined = null | undefined | ScreenSaverElement;
/*export type ScreenSaverElement = {
    entity: string;
    entityText: string;
    entityFactor?: number | string;
    entityDecimalPlaces?: number | string;
    entityDateFormat?: Intl.DateTimeFormatOptions | string;
    entityIconOn?: string | null;
    entityIconOff?: string | null;
    entityUnitText?: string;
    entityIconColor?: RGB | IconScaleElement | string;
    entityOnColor?: RGB | string;
    entityOffColor?: RGB | string;
    entityOnText?: string | null;
    entityOffText?: string | null;
};*/
export type ScreenSaverDataItems = {
    entityValue: ChangeTypeOfKeys<ValueEntryType, Dataitem | undefined>;
    entityDateFormat: Dataitem | undefined;
    entityIcon: ChangeTypeOfKeys<IconEntryType, Dataitem | undefined>;
    entityText: ChangeTypeOfKeys<TextEntryType, Dataitem | undefined>;
    entityIconSelect: Dataitem | undefined;
};
export type ScreenSaverElement = {
    entityValue: ChangeTypeOfKeys<ValueEntryType, DataItemsOptions | undefined>;
    entityDateFormat: ScreenSaverElementConfig;
    entityIcon: ChangeTypeOfKeys<IconEntryType, DataItemsOptions | undefined>;
    entityText: ChangeTypeOfKeys<TextEntryType, DataItemsOptions | undefined>;
    entityIconSelect: ScreenSaverElementConfig;
};
/*export type ScreenSaverMRDataItems = Record<keyof ScreenSaverMRElement, Dataitem | undefined>;
/*export type ScreenSaverMRElement = {
    entity: ChangeTypeOfKeys<NumberEntryType, DataItemsOptions | undefined>;
    entityDateFormat: ScreenSaverElementConfig;
    entityIcon: ChangeTypeOfKeys<IconEntryType, DataItemsOptions | undefined>;
    entityText: ChangeTypeOfKeys<TextEntryType, DataItemsOptions | undefined>;
    entityIconSelect: ScreenSaverElementConfig;
}; /*
export type ScreenSaverMRDataElement = {
    entity: string | number | boolean | null;
    entityIconOn: string | null;
    entityIconOff: string | null;
    entityValue: string | number | boolean | null;
    entityValueDecimalPlace: number | null;
    entityValueUnit: string | null;
    entityOnColor: RGB;
    entityOffColor: RGB;
    entityIconSelect: { [key: string]: string } | null;
};*/
type ScreenSaverElementConfig = DataItemsOptions | undefined;

export type IconScaleElement = {
    val_min: number;
    val_max: number;
    val_best?: number;
};

export function isIconScaleElement(F: any | IconScaleElement): F is IconScaleElement {
    return F && 'val_min' in (F as IconScaleElement) && 'val_max' in (F as IconScaleElement);
}
/** we need this to have a nice order when using switch() */
export type adapterPlayerInstanceType =
    | 'alexa2.0.'
    | 'alexa2.1.'
    | 'alexa2.2.'
    | 'alexa2.3.'
    | 'alexa2.4.'
    | 'alexa2.5.'
    | 'alexa2.6.'
    | 'alexa2.7.'
    | 'alexa2.8.'
    | 'alexa2.9.'
    | 'sonos.0.'
    | 'sonos.1.'
    | 'sonos.2.'
    | 'sonos.3.'
    | 'sonos.4.'
    | 'sonos.5.'
    | 'sonos.6.'
    | 'sonos.7.'
    | 'sonos.8.'
    | 'sonos.9.'
    | 'spotify-premium.0.'
    | 'spotify-premium.1.'
    | 'spotify-premium.2.'
    | 'spotify-premium.3.'
    | 'spotify-premium.4.'
    | 'spotify-premium.5.'
    | 'spotify-premium.6.'
    | 'spotify-premium.7.'
    | 'spotify-premium.8.'
    | 'spotify-premium.9.'
    | 'volumio.0.'
    | 'volumio.1.'
    | 'volumio.2.'
    | 'volumio.3.'
    | 'volumio.4.'
    | 'volumio.5.'
    | 'volumio.6.'
    | 'volumio.7.'
    | 'volumio.8.'
    | 'volumio.9.'
    | 'squeezeboxrpc.0.'
    | 'squeezeboxrpc.1.'
    | 'squeezeboxrpc.2.'
    | 'squeezeboxrpc.3.'
    | 'squeezeboxrpc.4.'
    | 'squeezeboxrpc.5.'
    | 'squeezeboxrpc.6.'
    | 'squeezeboxrpc.7.'
    | 'squeezeboxrpc.8.'
    | 'squeezeboxrpc.9.'
    | 'bosesoundtouch.0.'
    | 'bosesoundtouch.1.'
    | 'bosesoundtouch.2.'
    | 'bosesoundtouch.3.'
    | 'bosesoundtouch.4.'
    | 'bosesoundtouch.5.'
    | 'bosesoundtouch.6.'
    | 'bosesoundtouch.7.'
    | 'bosesoundtouch.8.'
    | 'bosesoundtouch.9.';

export type PlayerType = _PlayerTypeWithMediaDevice | _PlayerTypeWithOutMediaDevice;

export type _PlayerTypeWithOutMediaDevice = (typeof ArrayPlayerTypeWithOutMediaDevice)[number];
export type _PlayerTypeWithMediaDevice = (typeof ArrayPlayerTypeWithMediaDevice)[number];

export type notSortedPlayerType =
    | `${PlayerType}.0.`
    | `${PlayerType}.1.`
    | `${PlayerType}.2.`
    | `${PlayerType}.3.`
    | `${PlayerType}.4.`
    | `${PlayerType}.5.`
    | `${PlayerType}.6.`
    | `${PlayerType}.7.`
    | `${PlayerType}.8.`
    | `${PlayerType}.9.`;

export type mediaOptional =
    | 'seek'
    | 'crossfade'
    | 'speakerlist'
    | 'playlist'
    | 'tracklist'
    | 'equalizer'
    | 'repeat'
    | 'favorites';

export type DataItemstype = DataItemsOptions['type'];
export type DataItemsMode = 'custom' | 'auto';
export type DataItemsOptionsIcon =
    | Exclude<
          DataItemsOptions,
          {
              type: 'const';
              role?: string;
              constVal: StateValue | AllIcons;
              state?: State | null; // use just inside of class
          }
      >
    | ({
          name?: string;
      } & {
          type: 'const';
          role?: string;
          constVal: AllIcons;
          state?: State | null; // use just inside of class
      });
export type DataItemsOptions = {
    name?: string;
} & (
    | {
          type: 'const';
          role?: string;
          constVal: StateValue | AllIcons;
          state?: State | null; // use just inside of class
          forceType?: 'string' | 'number' | 'boolean'; // force a type
      }
    | ((
          | {
                mode: 'auto' | 'done'; // not set means custom
                role: PageRole | PageRole[];
            }
          | {
                mode?: 'custom'; // not set means custom
                role?: string;
            }
      ) & {
          type: 'state';
          dp: string;
          state?: State | null; // use just inside of class
          substring?: [number, number | undefined]; // only used with getString()
          forceType?: 'string' | 'number' | 'boolean'; // force a type
          read?: string | ((val: any) => any);
          write?: string | ((val: any) => any);
          response?: 'now' | 'medium' | 'slow';
      })
    | ((
          | {
                mode: 'auto' | 'done'; // not set means custom
                role: PageRole | PageRole[];
            }
          | {
                mode?: 'custom'; // not set means custom
                role?: string;
            }
      ) & {
          type: 'triggered';
          dp: string;
          state?: State | null; // use just inside of class
          substring?: [number, number | undefined]; // only used with getString()
          forceType?: 'string' | 'number' | 'boolean'; // force a type
          read?: string | ((val: any) => any);
          write?: string | ((val: any) => any);
          response?: 'now' | 'medium' | 'slow';
      })
    | {
          type: 'internal';
          dp: internalDatapoints;
      }
);

type internalDatapoints = 'Relais1' | 'Relais2';
export type IncomingEvent = {
    type: EventType;
    method: EventMethod;
    mode: string;
    page?: number;
    subPage?: number;
    command: ButtonActionType | '';
    opt: string;
};

export type Event = {
    type: EventType;
    method: EventMethod;
    page: any | null;
    data: string[];
    opt: string[];
};
export type EventType = 'event';
export function isEventType(F: string | EventType): F is EventType {
    return ['event'].indexOf(F) != -1;
}
export type ScreensaverModeType = 'standard' | 'alternate' | 'advanced';

export type ScreensaverOptionsType = {
    favoritEntity: Config['screensaver']['favoritEntity'];
    leftEntity: Config['screensaver']['leftEntity'];
    bottomEntity: Config['screensaver']['bottomEntity'];
    alternateEntity: Config['screensaver']['alternateEntity'];
    indicatorEntity: Config['screensaver']['indicatorEntity'];
    mrIconEntity: Config['screensaver']['mrIconEntity'];
};
export interface State extends Omit<ioBroker.State, 'val'> {
    val: StateValue;
}
export type StateValue = ioBroker.StateValue | object;
