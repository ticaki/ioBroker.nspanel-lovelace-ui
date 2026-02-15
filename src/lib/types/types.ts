import type * as dataItem from '../controller/data-item';
import { type RGB } from '../const/Color';
import type * as pages from './pages';
import type { NSPanel } from './NSPanel';

/**
 * Bitte an folgendes Schema halten
 * card.adapter?.aufgabe?.gerät?
 */

export type TemplateItems = Partial<Record<TemplateIdent, NSPanel.PageItemOptionsTemplate>>;

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
    | 'text.roborock.status'
    | 'button.alias.fahrplan.departure'
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

export type InternalStatesObject = {
    val: ioBroker.StateValue;
    ack: boolean;
    common: ioBroker.StateCommon;
    noTrigger?: boolean;
};
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
    | 'buttonPress3'
    | 'renderCurrentPage'
    | 'button1'
    | 'button2';

export type panelRecvType = {
    event: 'event';
    method: EventMethod;
};

export type PopupType = NSPanel.PopupType;

export type SerialTypePageElements = NSPanel.SerialTypePageElements;

export type SerialTypePopup = NSPanel.SerialTypePopup;

export type ButtonActionType = NSPanel.ButtonActionType;

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

export type NSpanelModel = 'eu' | 'us-p' | 'us-l';

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

export type DataItemstype = NSPanel.DataItemsOptions['type'];
export type DataItemsMode = 'custom' | 'auto';
export type DataItemsOptionsIcon =
    | Exclude<NSPanel.DataItemsOptions, DataItemsOptionsConst>
    | (DataItemsOptionsConst & {
          constVal: AllIcons;
      });

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
    isOnline?: boolean;
    nspanel: {
        displayVersion: string;
        model: string | null;
        bigIconLeft: boolean;
        bigIconRight: boolean;
        onlineVersion: string | null;
        firmwareUpdate: number;
        currentPage: string;
        scriptVersion: string;
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

export type oldQRType = {
    pageName: string;
    headline: string;
    alwaysOnDisplay: boolean;
    hiddenByTrigger: boolean;
    optionalText: string;
    SSIDURLTEL: string;
    selType: 0 | 1 | 2 | 3;
    wlantype?: 'nopass' | 'WPA' | 'WPA2' | 'WPA3' | 'WEP';
    qrPass?: number;
    wlanhidden?: boolean;
    pwdhidden?: boolean;
    setState?: string;
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
