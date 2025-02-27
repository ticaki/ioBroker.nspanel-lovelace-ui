import type * as dataItem from '../classes/data-item';
import type { RGB } from '../const/Color';
import type * as typePageItem from './type-pageItem';
import type * as pages from './pages';

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
    | 'thermo.script';

export type TemplateIdent =
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
    | 'cmd/power2'
    | 'cmd/power1'
    | 'cmd/bigIconRight'
    | 'cmd/detachLeft'
    | 'cmd/detachRight'
    | 'cmd/bigIconLeft'
    | 'cmd/dimActive'
    | 'cmd/dimStandby'
    | 'cmd/screensaverTimeout'
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
    | 'cmd/screenSaverRotationTime';

export function isPopupType(F: any): F is PopupType {
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

export function isValueDateFormat(F: any): F is ValueDateFormat {
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

export type IconScaleElement = {
    val_min: number;
    val_max: number;
    val_best?: number;
    /**
     * The logarithm scaling to max, min or leave undefined for linear scaling.
     */
    log10?: 'max' | 'min';
    /**
     * The color mix mode. Default is 'mixed'.
     * ‘mixed’: the target colour is achieved by scaling between the two RGB colours.
     * 'cie': the target colour is achieved by mixing according to the CIE colour table.
     * 'hue': the target colour is calculated by scaling via colour, saturation and brightness.
     */
    mode?: 'mixed' | 'hue' | 'cie';
};

export function isIconScaleElement(F: any): F is IconScaleElement {
    return F && 'val_min' in (F as IconScaleElement) && 'val_max' in (F as IconScaleElement);
}
export function isPartialIconScaleElement(F: any): F is IconScaleElement {
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
} & (
    | DataItemsOptionsConst
    | DataItemsOptionsState
    | DataItemsOptionsTriggered
    | DataItemsOptionsInternal
    | DataItemsOptionsInternalState
);

type DataItemsOptionsAuto = {
    mode: 'auto' | 'done' | 'fail'; // not set means custom
    role: pages.StateRole | pages.StateRole[];
    regexp?: RegExp;
    def?: string | number | boolean | RGB;
    required?: boolean;
};
type DataItemsOptionsCustom = {
    mode?: 'custom'; // not set means custom
    role?: string;
};

type DataItemsOptionsConst = {
    type: 'const';
    role?: pages.StateRole;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    constVal: StateValue | AllIcons | RGB | pages.placeholderType | IconScaleElement;
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
    response?: 'now' | 'medium';
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
export type ScreensaverModeType = 'standard' | 'alternate' | 'advanced' | 'easyview';

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
    isOnline: boolean;
    nspanel: {
        displayVersion: number;
        model: string;
        bigIconLeft: boolean;
        bigIconRight: boolean;

        currentPage: string;
    };
    tasmota: {
        firmwareversion: string;
        onlineVersion: string;
        net: STATUS0['StatusNET'];
        uptime: string;
        sts: STATUS0['StatusSTS'];
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
