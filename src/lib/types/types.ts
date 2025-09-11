import type * as dataItem from '../classes/data-item';
import { Color, type RGB } from '../const/Color';
import type * as typePageItem from './type-pageItem';
import * as pages from './pages';

/**
 * Bitte an folgendes Schema halten
 * card.adapter?.aufgabe?.gerät?
 */

export type TemplateItems = Partial<Record<TemplateIdent, typePageItem.PageItemOptionsTemplate>>;

export type PageTemplateIdent =
    | 'entities.waste-calendar'
    | 'media.spotify-premium'
    | 'entities.fahrplan.departure-timetable'
    | 'entities.fahrplan.routes'
    | 'thermo.hmip.valve'
    | 'thermo.hmip.wallthermostat'
    | 'thermo.script'
    | 'media.amazon';

export type TemplateIdent =
    | 'text.brightsky.bot1Value'
    | 'text.clock'
    | 'text.brightsky.hourlyweather'
    | 'text.brightsky.windgust'
    | 'text.brightsky.solar'
    | 'text.brightsky.winddirection'
    | 'text.brightsky.windspeed'
    | 'text.brightsky.bot2values'
    | 'text.brightsky.favorit'
    | 'text.brightsky.sunriseset'
    | 'text.pirate-weather.hourlyweather'
    | 'text.pirate-weather.windgust'
    | 'text.pirate-weather.uvindex'
    | 'text.pirate-weather.winddirection'
    | 'text.pirate-weather.windspeed'
    | 'text.pirate-weather.bot2values'
    | 'text.pirate-weather.favorit'
    | 'text.pirate-weather.sunriseset'
    | 'text.custom.windarrow'
    | 'text.openweathermap.windgust'
    | 'text.openweathermap.uvindex'
    | 'text.openweathermap.winddirection'
    | 'text.openweathermap.windspeed'
    | 'text.openweathermap.bot2values'
    | 'text.openweathermap.favorit'
    | 'text.openweathermap.sunriseset'
    | 'text.isOnline'
    | 'text.hmip.windcombo'
    | 'text.sainlogic.windarrow'
    | 'button.slider'
    | 'number.slider'
    | 'text.lock'
    | 'button.select'
    | 'value.temperature'
    | 'level.temperature'
    | 'text.shutter.navigation'
    | 'text.accuweather.uvindex'
    | 'text.accuweather.windspeed'
    | 'text.accuweather.winddirection'
    | 'text.accuweather.windgust'
    | 'text.wlan'
    | 'text.info'
    | 'text.warning'
    | 'number.volume'
    | 'button.volume'
    | 'text.motion'
    | 'text.door.isOpen'
    | 'text.gate.isOpen'
    | 'generic.shutter'
    | 'shutter.shelly.2PM'
    | 'light.shelly.rgbw2'
    | 'text.window.isClose'
    | 'text.window.isOpen'
    | 'text.battery'
    | 'button.temperature'
    | 'text.battery.low'
    | 'button.iconRightSize'
    | 'button.iconLeftSize'
    | 'shutter.deconz.ikea.fyrtur'
    | 'shutter.basic'
    | 'shutter.basic.onlyV'
    | 'text.battery.bydhvs'
    | 'text.accuweather.bot2values'
    | 'text.accuweather.sunriseset'
    | 'button.esphome.powerplug'
    | 'button.service.adapter.stopped'
    | 'button.service.adapter.noconnection'
    | 'text.fahrplan.departure'
    | ''
    | 'button.humidity'
    | 'text.temperature'
    | 'script.light'
    | 'script.socket'
    | 'script.hue'
    | 'script.rgb'
    | 'script.rgbSingle'
    | 'script.rgbSingleHEX'
    | 'script.ct'
    | 'script.dimmer'
    | 'script.gate'
    | 'script.door'
    | 'script.motion'
    | 'script.humidity'
    | 'script.temperature'
    | 'script.lock'
    | 'script.slider'
    | 'script.warning'
    | 'script.volume'
    | 'text.accuweather.favorit'
    | 'text.alias.fahrplan.departure';

export function isEventMethod(F: string): F is EventMethod {
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

export type InternalStatesObject = {
    val: ioBroker.StateValue;
    ack: boolean;
    common: ioBroker.StateCommon;
    noTrigger?: boolean;
};
export type PanelInternalCommand =
    | 'cmd/screensaverHeadingNotification'
    | 'cmd/screensaverTextNotification'
    | 'cmd/screensaverActivateNotification'
    | 'cmd/screenSaverInfoIcon'
    | 'info/PopupInfo'
    | 'cmd/power2'
    | 'cmd/power1'
    | 'cmd/bigIconRight'
    | 'cmd/detachLeft'
    | 'cmd/detachRight'
    | 'cmd/bigIconLeft'
    | 'cmd/dimActive'
    | 'cmd/dimStandby'
    | 'cmd/screenSaverTimeout'
    | 'cmd/NotificationCleared2'
    | 'cmd/NotificationNext2'
    | 'cmd/popupNotification2'
    | 'cmd/NotificationCleared'
    | 'cmd/NotificationNext'
    | 'info/NotificationCounter'
    | 'cmd/popupNotification'
    | 'info/modelVersion'
    | 'info/displayVersion'
    | 'info/tasmotaVersion'
    | 'info/Tasmota'
    | 'cmd/TasmotaRestart'
    | 'cmd/screenSaverRotationTime'
    | 'cmd/dimNightActive'
    | 'cmd/dimNightStandby'
    | 'cmd/dimNightHourStart'
    | 'cmd/dimNightHourEnd'
    | 'cmd/screenSaverDoubleClick'
    | 'cmd/screenSaverLayout'
    | 'cmd/hideCards'
    | 'cmd/buzzer';

export function isPopupType(F: any): F is PopupType {
    switch (F as PopupType) {
        case 'popupFan':
        case 'popupInSel':
        case 'popupLight':
        case 'popupLightNew':
        case 'popupNotify':
        case 'popupShutter':
        case 'popupShutter2':
        case 'popupThermo':
        case 'popupTimer':
        case 'popupSlider':
            return true;
        default:
            console.info(`Unknown PopupType: ${F} `);
            return false;
    }
}

/**
 * Defines how the panel handles "always on" behavior.
 *
 * - `"always"` → Screen is forced to stay on permanently.
 *   A timeout of `0` means "never turn off".
 * - `"none"` → No special handling; normal timeout rules apply.
 * - `"ignore"` → Skip "always on" logic completely for this page/item.
 * - `"action"` → Extend screen-on time only when a state/action event occurs.
 */
export type AlwaysOnMode = 'always' | 'none' | 'ignore' | 'action';

export type nsPanelState = ioBroker.State | (Omit<ioBroker.State, 'val'> & { val: nsPanelStateVal });
export type nsPanelStateVal = ioBroker.State['val'] | Record<string | number, any>;
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
    'light', //popup
    'shutter', //popup
    'delete',
    'text',
    'button',
    'switch', // nur für cardQR
    'number',
    'input_sel', //popup
    'timer', //popup
    'fan', //popup
];

export type PopupType =
    | 'popupFan'
    | 'popupInSel'
    | 'popupLight'
    | 'popupLightNew'
    | 'popupNotify'
    | 'popupShutter'
    | 'popupShutter2'
    | 'popupThermo'
    | 'popupTimer'
    | 'popupSlider'; // for slider in popup

export type SerialTypePageElements =
    | 'button' //~button~button.entityName~3~17299~bt-name~bt-text
    | 'light' // ~light~light.entityName~1~17299~Light1~0
    | 'shutter' // ~shutter~cover.entityName~0~17299~Shutter2~iconUp|iconStop|iconDown
    | 'shutter2' // ~shutter2~cover.entityName~0~17299~Shutter2~iconUp|iconStop|iconDown
    | 'text' // ~text~sensor.entityName~3~17299~Temperature~content
    | 'input_sel' //~input_sel~input_select.entityName~3~17299~sel-name~sel-text
    | 'number' //~number~input_number.entityName~4~17299~Number123~value|min|max
    | 'switch' // ~switch~switch.entityName~4~17299~Switch1~0
    | 'delete'; //~delete~~~~~

export type SerialTypePopup =
    | 'button'
    | 'light'
    | 'light2'
    | 'shutter'
    | 'shutter2'
    | 'text'
    | 'input_sel'
    | 'timer'
    | 'number'
    | 'fan'
    | 'switch'
    | 'delete';

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

export type DimMode = {
    dimmodeOn: boolean | undefined;
    brightnessDay: number | undefined;
    brightnessNight: number | undefined;
    timeDay: string | undefined;
    timeNight: string | undefined;
};

export type ValueDateFormat = { local: string; format: any };

export function isValueDateFormat(F: any): F is ValueDateFormat {
    return F && typeof F === 'object' && F.local !== undefined && F.format !== undefined;
}
export const screenSaverInfoIconsUseable = {
    none: '',
    'clock!': 'clock-alert-outline',
    'weather!': 'weather-sunny-alert',
    'news!': 'bell-ring-outline',
    'calendar!': 'calendar-alert',
    'alarm!': 'alarm',
    'info!': 'information-outline',
    'error!': 'alert-circle-outline',
    'critical!': 'alert-circle',
} as const;

export const screenSaverInfoIcons = swapKeyValue(screenSaverInfoIconsUseable);

function swapKeyValue(obj: Record<string, string>): Record<string, string> {
    const swapped: Record<string, string> = {};
    for (const key in obj) {
        const value = obj[key];
        swapped[value] = key;
    }
    return swapped;
}

export type ScreenSaverPlaces = 'left' | 'bottom' | 'indicator' | 'alternate' | 'favorit' | 'mricon' | 'time' | 'date';
export type NSpanelModel = 'eu';
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

export type ScreenSaverDataItems = {
    entityValue: pages.ChangeTypeOfKeys<typePageItem.ValueEntryType, dataItem.Dataitem | undefined>;
    entityDateFormat: dataItem.Dataitem | undefined;
    entityIcon: pages.ChangeTypeOfKeys<typePageItem.IconEntryType, dataItem.Dataitem | undefined>;
    entityText: pages.ChangeTypeOfKeys<typePageItem.TextEntryType, dataItem.Dataitem | undefined>;
    entityIconSelect: dataItem.Dataitem | undefined;
};
export type ScreenSaverElement = {
    entityValue: pages.ChangeTypeOfKeys<typePageItem.ValueEntryType, DataItemsOptions | undefined>;
    entityDateFormat: ScreenSaverElementConfig;
    entityIcon: pages.ChangeTypeOfKeys<typePageItem.IconEntryType, DataItemsOptions | undefined>;
    entityText: pages.ChangeTypeOfKeys<typePageItem.TextEntryType, DataItemsOptions | undefined>;
    entityIconSelect: ScreenSaverElementConfig;
};

type ScreenSaverElementConfig = DataItemsOptions | undefined;

export type IconScaleElement = IconColorElement | IconSelectElement;

export type IconSelectElement = {
    valIcon_min: number;
    valIcon_max: number;
    valIcon_best?: number;
};
export type IconColorElement = {
    val_min: number;
    val_max: number;
    val_best?: number;
    /**
     * Optional best-color (nur wirksam, wenn `val_best` gesetzt ist).
     */
    color_best?: RGB;
    /**
     * Color scale mode. Default is 'mixed'.
     * - 'mixed': interpolate linearly between two RGB colors.
     * - 'cie': interpolate using CIE color table.
     * - 'hue': interpolate via hue/saturation/brightness.
     * - 'triGrad': three-color gradient red→yellow→green, ignores custom colors.
     * - 'triGradAnchor': like triGrad but anchors yellow to val_best.
     * - 'quadriGrad': four-color gradient red→yellow→green→blue, ignores custom colors.
     * - 'quadriGradAnchor': like quadriGrad but anchors green to val_best.
     */
    mode?: 'mixed' | 'hue' | 'cie' | 'triGrad' | 'triGradAnchor' | 'quadriGrad' | 'quadriGradAnchor';
    /**
     * Apply logarithmic scaling. Use 'max' or 'min'.
     * Undefined = linear scaling.
     */
    log10?: 'max' | 'min';
};

/**
 * Lightweight type guard for IconColorElement.
 * - Checks presence & finiteness of required numbers.
 * - Optional fields, if present, must be of the right *shape*.
 * - No normalization, no range constraints (val_min may be > val_max).
 *
 * @param x unknown
 * @returns true if x is IconColorElement
 */
export function isIconColorScaleElement(x: unknown): x is IconColorElement {
    if (typeof x !== 'object' || x === null) {
        return false;
    }

    const v = x as Partial<IconColorElement>;

    // required
    if (!Number.isFinite(v.val_min as number)) {
        return false;
    }
    if (!Number.isFinite(v.val_max as number)) {
        return false;
    }

    // optional numbers
    if (v.val_best != null && !Number.isFinite(v.val_best)) {
        return false;
    }

    // optional enums
    if (v.log10 != null && v.log10 !== 'max' && v.log10 !== 'min') {
        return false;
    }
    if (
        v.mode != null &&
        v.mode !== 'mixed' &&
        v.mode !== 'hue' &&
        v.mode !== 'cie' &&
        v.mode !== 'triGrad' &&
        v.mode !== 'triGradAnchor' &&
        v.mode !== 'quadriGrad' &&
        v.mode !== 'quadriGradAnchor'
    ) {
        return false;
    }

    // optional color object
    if (v.color_best != null && !Color.isRGB(v.color_best)) {
        return false;
    }

    return true;
}

/**
 * Normalize a valid IconColorElement (e.g. fix color_best).
 * Call this after `isIconColorElement()` returned true.
 *
 * @param el IconColorElement
 */
export function normalizeIconColorElement(el: IconColorElement): IconColorElement {
    const copy: IconColorElement = { ...el };
    if (copy.color_best) {
        copy.color_best = convertColorScaleBest(copy.color_best);
    }
    return copy;
}
function convertColorScaleBest(F: any): IconColorElement['color_best'] {
    if (F) {
        return { r: F.red ?? F.r, g: F.green ?? F.g, b: F.blue ?? F.b };
    }
    return undefined;
}
export function isPartialColorScaleElement(F: any): F is IconColorElement {
    return F && ('val_min' in (F as IconColorElement) || 'val_max' in (F as IconColorElement));
}

export function isIconSelectScaleElement(F: any): F is IconSelectElement {
    return F && 'valIcon_min' in (F as IconSelectElement) && 'valIcon_max' in (F as IconSelectElement);
}
export function isPartialIconSelectScaleElement(F: any): F is IconSelectElement {
    return F && ('valIcon_min' in (F as IconSelectElement) || 'valIcon_max' in (F as IconSelectElement));
}

export type DataItemstype = DataItemsOptions['type'];
export type DataItemsMode = 'custom' | 'auto';
export type DataItemsOptionsIcon =
    | Exclude<DataItemsOptions, DataItemsOptionsConst>
    | (DataItemsOptionsConst & {
          constVal: AllIcons;
      });
export type DataItemsOptions = {
    name?: string;
    scale?: { min: number; max: number };
    dp?: string | undefined;
    constants?: Record<string, string>;
} & (
    | DataItemsOptionsConst
    | DataItemsOptionsState
    | DataItemsOptionsTriggered
    | DataItemsOptionsInternal
    | DataItemsOptionsInternalState
);

type RequireAtLeastOne<T, K extends keyof T = keyof T> = Pick<T, Exclude<keyof T, K>> &
    { [P in K]-?: Required<Pick<T, P>> & Partial<Pick<T, Exclude<K, P>>> }[K];

type Base = {
    mode: 'auto' | 'done' | 'fail';
    role?: pages.StateRole | pages.StateRole[];
    commonType?: ioBroker.StateCommon['type'] | ioBroker.StateCommon['type'][] | '';
    regexp?: RegExp;
    def?: string | number | boolean | RGB;
    required?: boolean;
    writeable?: boolean;
};

type AutoNeedOne = RequireAtLeastOne<Pick<Base, 'role' | 'commonType' | 'regexp'>, 'role' | 'commonType' | 'regexp'>;

type Rest = Omit<Base, 'mode' | 'role' | 'commonType' | 'regexp'>;

export type DataItemsOptionsAuto = { mode: 'auto' | 'done' | 'fail' } & Rest & AutoNeedOne; // bei 'auto': mind. eins von role/commonType/regexp

type DataItemsOptionsCustom = {
    mode?: 'custom'; // not set means custom
    role?: string;
    commonType?: ioBroker.StateCommon['type'] | ioBroker.StateCommon['type'][] | '';
};

type DataItemsOptionsConst = {
    type: 'const';
    role?: pages.StateRole;
    commonType?: ioBroker.StateCommon['type'] | ioBroker.StateCommon['type'][] | '';
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    constVal: StateValue | AllIcons | RGB | pages.placeholderType | IconScaleElement;
    state?: State | null; // use just inside of class
    forceType?: 'string' | 'number' | 'boolean'; // force a type
    read?: string | ((val: any) => any);
    write?: string | ((val: any) => any);
};
type DataItemsOptionsInternal = {
    type: 'internal';
    role?: string;
    commonType?: ioBroker.StateCommon['type'] | ioBroker.StateCommon['type'][] | '';
    dp: string;
    read?: string | ((val: any) => any);
    write?: string | ((val: any) => any);
    change?: 'ts';
};

type DataItemsOptionsInternalState = {
    type: 'internalState';
    role?: string;
    dp: string;
    read?: string | ((val: any) => any);
    write?: string | ((val: any) => any);
};
type DataItemsOptionsState = (DataItemsOptionsAuto | DataItemsOptionsCustom) & {
    type: 'state';
    dp: string;
    state?: State | null; // use just inside of class
    substring?: [number, number | undefined]; // only used with getString()
    forceType?: 'string' | 'number' | 'boolean'; // force a type
    read?: string | ((val: any) => any);
    write?: string | ((val: any) => any);
};
type DataItemsOptionsTriggered = (DataItemsOptionsAuto | DataItemsOptionsCustom) & {
    type: 'triggered';
    dp: string;
    state?: State | null; // use just inside of class
    substring?: [number, number | undefined]; // only used with getString()
    forceType?: 'string' | 'number' | 'boolean'; // force a type
    read?: string | ((val: any) => any);
    write?: string | ((val: any) => any);
    change?: 'ts';
    wirteable?: boolean;
};

//type internalDatapoints = 'Relais1' | 'Relais2';
export type IncomingEvent = {
    type: EventType;
    method: EventMethod;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    action: ButtonActionType | '' | string;
    target?: number;
    page?: number;
    cmd?: number;
    popup?: string;
    id: string; //| PopupType;
    opt: string;
};

export type Event = {
    type: EventType;
    method: EventMethod;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    page: any | null;
    data: string[];
    opt: string[];
};
export type EventType = 'event';
export function isEventType(F: string): F is EventType {
    return ['event'].indexOf(F) != -1;
}

const arrayOfModes = pages.arrayOfAll<ScreensaverModeType>();
export const arrayOfScreensaverModes = arrayOfModes(['standard', 'alternate', 'advanced', 'easyview']);
export type ScreensaverModeType = 'standard' | 'alternate' | 'advanced' | 'easyview';
export type ScreensaverModeTypeAsNumber = 0 | 1 | 2 | 3;
export interface State extends Omit<ioBroker.State, 'val'> {
    val: StateValue;
}
export type StateValue = ioBroker.StateValue | object;

export type TasmotaIncomingTopics = 'stat/POWER2' | 'stat/POWER1' | 'stat/STATUS0';

/**
 * Represents the configuration for a button function.
 * This type can be one of the following modes:
 * - 'page': Navigates to a specified page.
 * - 'switch': Toggles the state of a datapoint.
 * - 'button': Triggers a button datapoint with a true value.
 * - null: Represents no configuration.
 */
export type ConfigButtonFunction =
    | {
          /**
           * Mode for navigating to a page.
           *
           */
          mode: 'page';
          /**
           * The page to navigate to.
           *
           */
          page: string;
      }
    | {
          /**
           * Mode for toggling a datapoint.
           *
           */
          mode: 'switch';
          /**
           * The state of the datapoint to toggle.
           *
           */
          state: string | dataItem.Dataitem;
      }
    | {
          /**
           * Mode for triggering a button datapoint.
           *
           */
          mode: 'button';
          /**
           * The state of the button datapoint to trigger.
           *
           */
          state: string | dataItem.Dataitem;
      }
    | null;
/**
 * Json to Status0 from Tasmota
 */
export type STATUS0 = {
    Status: {
        Module: number;
        DeviceName: string;
        FriendlyName: Array<string>;
        Topic: string;
        ButtonTopic: string;
        Power: string;
        PowerLock: string;
        PowerOnState: number;
        LedState: number;
        LedMask: string;
        SaveData: number;
        SaveState: number;
        SwitchTopic: string;
        SwitchMode: Array<number>;
        ButtonRetain: number;
        SwitchRetain: number;
        SensorRetain: number;
        PowerRetain: number;
        InfoRetain: number;
        StateRetain: number;
        StatusRetain: number;
    };
    StatusPRM: {
        Baudrate: number;
        SerialConfig: string;
        GroupTopic: string;
        OtaUrl: string;
        RestartReason: string;
        Uptime: string;
        StartupUTC: string;
        Sleep: number;
        CfgHolder: number;
        BootCount: number;
        BCResetTime: string;
        SaveCount: number;
    };
    StatusFWR: {
        Version: string;
        BuildDateTime: string;
        Core: string;
        SDK: string;
        CpuFrequency: number;
        Hardware: string;
        CR: string;
    };
    StatusLOG: {
        SerialLog: number;
        WebLog: number;
        MqttLog: number;
        FileLog: number;
        SysLog: number;
        LogHost: string;
        LogPort: number;
        SSId: Array<string>;
        TelePeriod: number;
        Resolution: string;
        SetOption: Array<string>;
    };
    StatusMEM: {
        ProgramSize: number;
        Free: number;
        Heap: number;
        StackLowMark: number;
        PsrMax: number;
        PsrFree: number;
        ProgramFlashSize: number;
        FlashSize: number;
        FlashChipId: string;
        FlashFrequency: number;
        FlashMode: string;
        Features: Array<string>;
        Drivers: string;
        Sensors: string;
        I2CDriver: string;
    };
    StatusNET: {
        Hostname: string;
        IPAddress: string;
        Gateway: string;
        Subnetmask: string;
        DNSServer1: string;
        DNSServer2: string;
        Mac: string;
        IP6Global: string;
        IP6Local: string;
        Ethernet: {
            Hostname: string;
            IPAddress: string;
            Gateway: string;
            Subnetmask: string;
            DNSServer1: string;
            DNSServer2: string;
            Mac: string;
            IP6Global: string;
            IP6Local: string;
        };
        Webserver: number;
        HTTP_API: number;
        WifiConfig: number;
        WifiPower: number;
    };
    StatusMQT: {
        MqttHost: string;
        MqttPort: number;
        MqttClientMask: string;
        MqttClient: string;
        MqttUser: string;
        MqttCount: number;
        MqttTLS: number;
        MAX_PACKET_SIZE: number;
        KEEPALIVE: number;
        SOCKET_TIMEOUT: number;
    };
    StatusTIM: {
        UTC: string;
        Local: string;
        StartDST: string;
        EndDST: string;
        Timezone: string;
        Sunrise: string;
        Sunset: string;
    };
    StatusSNS: {
        Time: string;
        ANALOG: {
            Temperature1: number;
        };
        TempUnit: string;
    };
    StatusSTS: {
        Time: string;
        Uptime: string;
        UptimeSec: number;
        Heap: number;
        SleepMode: string;
        Sleep: number;
        LoadAvg: number;
        MqttCount: number;
        Berry: {
            HeapUsed: number;
            Objects: number;
        };
        POWER1: string;
        POWER2: string;
        Wifi: {
            AP: number;
            SSId: string;
            BSSId: string;
            Channel: number;
            Mode: string;
            RSSI: number;
            Signal: number;
            LinkCount: number;
            Downtime: string;
        };
    };
};

export type PanelInfo = {
    isOnline: boolean;
    nspanel: {
        displayVersion: string;
        model: string;
        bigIconLeft: boolean;
        bigIconRight: boolean;
        onlineVersion: string;
        firmwareUpdate: number;
        currentPage: string;
        berryDriverVersion: number;
        berryDriverVersionOnline: number;
    };
    tasmota: {
        firmwareversion: string;
        onlineVersion: string;
        safeboot: boolean;
        net: STATUS0['StatusNET'];
        uptime: string;
        sts: STATUS0['StatusSTS'];
        mqttClient: string;
    };
};

export type TasmotaOnlineResponse = {
    url: string;
    assets_url: string;
    upload_url: string;
    html_url: string;
    id: number;
    author: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        gravatar_id: string;
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
        site_admin: boolean;
    };
    node_id: string;
    tag_name: string;
    target_commitish: string;
    name: string;
    draft: boolean;
    prerelease: boolean;
    created_at: string;
    published_at: string;
    assets: Array<{
        url: string;
        id: number;
        node_id: string;
        name: string;
        label: string;
        uploader: {
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
        };
        content_type: string;
        state: string;
        size: number;
        download_count: number;
        created_at: string;
        updated_at: string;
        browser_download_url: string;
    }>;
    tarball_url: string;
    zipball_url: string;
    body: string;
    reactions: {
        url: string;
        total_count: number;
        '+1': number;
        '-1': number;
        laugh: number;
        hooray: number;
        confused: number;
        heart: number;
        rocket: number;
        eyes: number;
    };
};
