import * as dataItem from '../classes/data-item';
import * as Color from '../const/Color';
import * as typePageItem from './type-pageItem';
import * as pages from './pages';

export type PageTemplateIdent = 'waste-calendar.entities' | 'media.spotify-premium';

export type TemplateIdent =
    | 'generic.shutter'
    | 'shutter.shelly.2PM'
    | 'light.shelly.rgbw2'
    | 'text.window.isClose'
    | 'text.window.isOpen'
    | 'text.battery'
    | 'text.temperature'
    | 'text.battery.low'
    | 'button.iconRightSize'
    | 'button.iconLeftSize'
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | ''
    | '';

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

export function isPopupType(F: PopupType | any): F is PopupType {
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
    | 'popupThermo'
    | 'popupTimer';

export type SerialTypePageElements =
    | 'button' //~button~button.entityName~3~17299~bt-name~bt-text
    | 'light' // ~light~light.entityName~1~17299~Light1~0
    | 'shutter' // ~shutter~cover.entityName~0~17299~Shutter2~iconUp|iconStop|iconDown
    | 'text' // ~text~sensor.entityName~3~17299~Temperature~content
    | 'input_sel' //~input_sel~input_select.entityName~3~17299~sel-name~sel-text
    | 'number' //~number~input_number.entityName~4~17299~Number123~value|min|max
    | 'switch' // ~switch~switch.entityName~4~17299~Switch1~0
    | 'delete'; //~delete~~~~~

export type SerialTypePopup =
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

export function isValueDateFormat(F: any | ValueDateFormat): F is ValueDateFormat {
    return F && typeof F === 'object' && F.local !== undefined && F.format !== undefined;
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
    defaultColor: Color.RGB;
    defaultOnColor: Color.RGB;
    defaultOffColor: Color.RGB;
    defaultBackgroundColor: Color.RGB;
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

export type IconScaleElement = {
    val_min: number;
    val_max: number;
    val_best?: number;
    log10?: 'max' | 'min';
};

export function isIconScaleElement(F: any | IconScaleElement): F is IconScaleElement {
    return F && 'val_min' in (F as IconScaleElement) && 'val_max' in (F as IconScaleElement);
}
export function isPartialIconScaleElement(F: any | IconScaleElement): F is IconScaleElement {
    return F && ('val_min' in (F as IconScaleElement) || 'val_max' in (F as IconScaleElement));
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
} & (DataItemsOptionsConst | DataItemsOptionsState | DataItemsOptionsTriggered | DataItemsOptionsInternal);

type DataItemsOptionsAuto = {
    mode: 'auto' | 'done'; // not set means custom
    role: pages.StateRole | pages.StateRole[];
};
type DataItemsOptionsCustom = {
    mode?: 'custom'; // not set means custom
    role?: string;
};

type DataItemsOptionsConst = {
    type: 'const';
    role?: pages.StateRole;
    constVal: StateValue | AllIcons;
    state?: State | null; // use just inside of class
    forceType?: 'string' | 'number' | 'boolean'; // force a type
};
type DataItemsOptionsInternal = {
    type: 'internal';
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
    response?: 'now' | 'medium' | 'slow';
};
type DataItemsOptionsTriggered = (DataItemsOptionsAuto | DataItemsOptionsCustom) & {
    type: 'triggered';
    dp: string;
    state?: State | null; // use just inside of class
    substring?: [number, number | undefined]; // only used with getString()
    forceType?: 'string' | 'number' | 'boolean'; // force a type
    read?: string | ((val: any) => any);
    write?: string | ((val: any) => any);
};

//type internalDatapoints = 'Relais1' | 'Relais2';
export type IncomingEvent = {
    type: EventType;
    method: EventMethod;
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
    page: any | null;
    data: string[];
    opt: string[];
};
export type EventType = 'event';
export function isEventType(F: string | EventType): F is EventType {
    return ['event'].indexOf(F) != -1;
}
export type ScreensaverModeType = 'standard' | 'alternate' | 'advanced';

export interface State extends Omit<ioBroker.State, 'val'> {
    val: StateValue;
}
export type StateValue = ioBroker.StateValue | object;

export type TasmotaIncomingTopics = 'stat/POWER2' | 'stat/POWER1' | 'stat/STATUS0';

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
        Power: number;
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
    nspanel: {
        displayVersion: number;
        model: string;
        bigIconLeft: boolean;
        bigIconRight: boolean;
    };
    tasmota: {
        net: {
            ip: string;
            gateway: string;
            dnsserver: string;
            subnetmask: string;
            hostname: string;
            mac: string;
        };
        uptime: string;
        wifi: { ssid: string; rssi: number; downtime: string };
    };
};
