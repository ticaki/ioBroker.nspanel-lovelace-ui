import type * as dataItem from '../controller/data-item';
import type * as typePageItem from './type-pageItem';
import type * as pages from './pages';

export namespace NSPanel {
    type TemplateItems = Partial<Record<TemplateIdent, typePageItem.PageItemOptionsTemplate>>;
    type RGB = {
        r: number;
        g: number;
        b: number;
    };
    type PageTemplateIdent =
        | 'entities.waste-calendar'
        | 'media.spotify-premium'
        | 'entities.fahrplan.departure-timetable'
        | 'entities.fahrplan.routes'
        | 'thermo.hmip.valve'
        | 'thermo.hmip.wallthermostat'
        | 'thermo.script'
        | 'media.amazon';

    type TemplateIdent =
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

    type InternalStatesObject = {
        val: ioBroker.StateValue;
        ack: boolean;
        common: ioBroker.StateCommon;
        noTrigger?: boolean;
    };

    type PanelInternalCommand =
        | 'cmd/isBuzzerAllowed'
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
        | 'cmd/NotificationClearedAll'
        | 'cmd/NotificationNext2'
        | 'cmd/popupNotification2'
        | 'cmd/NotificationCleared'
        | 'cmd/NotificationNext'
        | 'info/NotificationCounter'
        | 'cmd/popupNotification'
        | 'system/popupNotification'
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
        | 'cmd/buzzer'
        | 'cmd/NotificationCustomRight'
        | 'cmd/NotificationCustomMid'
        | 'cmd/NotificationCustomLeft'
        | 'cmd/NotificationCustomID'
        | 'cmd/popupNotificationCustom';

    type AlwaysOnMode = 'always' | 'none' | 'ignore' | 'action';

    type nsPanelState = ioBroker.State | (Omit<ioBroker.State, 'val'> & { val: nsPanelStateVal });

    type nsPanelStateVal = ioBroker.State['val'] | Record<string | number, any>;

    type EventMethod =
        | 'startup'
        | 'sleepReached'
        | 'pageOpenDetail'
        | 'buttonPress2'
        | 'renderCurrentPage'
        | 'button1'
        | 'button2';

    type panelRecvType = {
        event: 'event';
        method: EventMethod;
    };

    type SerialTypePopup =
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

    type ButtonActionType =
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

    type Payload = {
        payload: string;
    };

    type BooleanUnion = 'true' | 'false';

    type DimMode = {
        dimmodeOn: boolean | undefined;
        brightnessDay: number | undefined;
        brightnessNight: number | undefined;
        timeDay: string | undefined;
        timeNight: string | undefined;
    };

    type ValueDateFormat = { local: string; format: any };

    type ScreenSaverPlaces =
        | 'left'
        | 'bottom'
        | 'indicator'
        | 'alternate'
        | 'favorit'
        | 'mricon'
        | 'time'
        | 'date'
        | 'notify';

    type NSpanelModel = 'eu' | 'us-p' | 'us-l';

    type IconScaleElement = IconColorElement | IconSelectElement;

    type IconSelectElement = {
        valIcon_min: number;
        valIcon_max: number;
        valIcon_best?: number;
    };

    type IconColorElement = {
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

    type DataItemstype = DataItemsOptions['type'];

    type DataItemsMode = 'custom' | 'auto';

    type DataItemsOptionsIcon =
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

    type DataItemsOptionsAuto = { mode: 'auto' | 'done' | 'fail' } & Rest & AutoNeedOne; // bei 'auto': mind. eins von role/commonType/regexp

    type DataItemsOptionsCustom = {
        mode?: 'custom'; // not set means custom
        role?: string;
        commonType?: ioBroker.StateCommon['type'] | ioBroker.StateCommon['type'][] | '';
    };

    type IncomingEvent = {
        type: EventType;
        method: EventMethod;

        action: ButtonActionType | '';
        target?: number;
        page?: number;
        cmd?: number;
        popup?: string;
        id: string; //| PopupType;
        opt: string;
    };

    type Event = {
        type: EventType;
        method: EventMethod;

        page: any;
        data: string[];
        opt: string[];
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
    interface State extends Omit<ioBroker.State, 'val'> {
        val: StateValue;
    }
    type StateValue = ioBroker.StateValue | object;

    type DataItemsOptionsAuto = { mode: 'auto' | 'done' | 'fail' } & Rest & AutoNeedOne; // bei 'auto': mind. eins von role/commonType/regexp

    type DataItemsOptionsCustom = {
        mode?: 'custom'; // not set means custom
        role?: string;
        commonType?: ioBroker.StateCommon['type'] | ioBroker.StateCommon['type'][] | '';
    };

    type EventType = 'event';

    type ScreensaverModeType = 'standard' | 'alternate' | 'advanced' | 'easyview';

    type ScreensaverModeTypeAsNumber = 0 | 1 | 2 | 3;

    type StateValue = ioBroker.StateValue | object;

    type TasmotaIncomingTopics = 'stat/POWER2' | 'stat/POWER1' | 'stat/STATUS0';

    type ConfigButtonFunction =
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

    type STATUS0 = {
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

    type PanelInfo = {
        isOnline?: boolean;
        nspanel: {
            displayVersion: string;
            model: string;
            bigIconLeft: boolean;
            bigIconRight: boolean;
            onlineVersion: string;
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

    type TasmotaOnlineResponse = {
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

    // ========================================================================
    // Types from type-pageItem.ts
    // ========================================================================

    type PageLightItem = {
        type: 'light' | 'dimmer' | 'brightnessSlider' | 'hue' | 'rgb';
        bri: PageItemMinMaxValue;
        ct: PageItemMinMaxValue;
        hue: PageItemMinMaxValue; //0-360
        rgb: RGB;
    };

    type PageItemColorSwitch = { on: RGB; off: RGB };

    type IconBoolean = Record<BooleanUnion, string | undefined>;

    type ThisCardMessageTypes = 'input_sel' | 'button';
    interface MessageItem extends MessageItemInterface {
        mainId?: string;
        subId?: string;
    }
    type entityUpdateDetailMessage =
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
              type: 'seperator';
              entityName: string;
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
        | ({ type: 'popupShutter2' } & Record<
              | 'entityName'
              | 'pos1' //
              | 'text2'
              | 'pos1text'
              | 'icon'
              | 'iconT1'
              | 'iconM1'
              | 'iconB1'
              | 'statusT1' // 'disable' allowed
              | 'statusM1' // 'disable' allowed
              | 'statusB1' // 'disable' allowed
              | 'iconT2'
              | 'iconT2Color'
              | 'iconT2Enable'
              | 'iconM2'
              | 'iconM2Color'
              | 'iconM2Enable'
              | 'iconB2'
              | 'iconB2Color'
              | 'iconB2Enable'
              | 'shutterClosedIsZero',
              string
          > & { shutterTyp: 'shutter' })
        | ({ type: 'popupShutter' } & Record<
              | 'entityName'
              | 'pos1' // 'disable' allowed
              | 'text2'
              | 'pos1text'
              | 'icon'
              | 'iconL1'
              | 'iconM1'
              | 'iconR1'
              | 'statusL1' // 'disable' allowed
              | 'statusM1' // 'disable' allowed
              | 'statusR1' // 'disable' allowed
              | 'pos2text'
              | 'iconL2'
              | 'iconM2'
              | 'iconR2'
              | 'statusL2' // 'disable' allowed
              | 'statusM2' // 'disable' allowed
              | 'statusR2' // 'disable' allowed
              | 'pos2', // 'disable' allowed
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
              type: 'popupSlider';
          } & Record<
              | 'entityName'
              | 'tSlider1'
              | 'tSlider2'
              | 'tSlider3'
              | 'tIconS1M'
              | 'tIconS1P'
              | 'tIconS2M'
              | 'tIconS2P'
              | 'tIconS3M'
              | 'tIconS3P'
              | 'hSlider1CurVal'
              | 'hSlider2CurVal'
              | 'hSlider3CurVal'
              | 'hSlider1MaxVal'
              | 'hSlider2MaxVal'
              | 'hSlider3MaxVal'
              | 'hSlider1MinVal'
              | 'hSlider2MinVal'
              | 'hSlider3MinVal'
              | 'hSlider1ZeroVal'
              | 'hSlider2ZeroVal'
              | 'hSlider3ZeroVal'
              | 'hSlider1Step'
              | 'hSlider2Step'
              | 'hSlider3Step'
              | 'hSlider1Visibility'
              | 'hSlider2Visibility'
              | 'hSlider3Visibility',
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
    interface MessageItemInterface {
        type: SerialTypePopup;
        intNameEntity: string;
        icon: string;
        iconColor: string;
        displayName: string;
        optionalValue: string;
    }
    type MediaToolBoxAction =
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

    type PageItemDataItems = Omit<PageItemUnion, 'data' | 'type'> &
        (
            | PageItemNumberDataItems
            | PageItemButtonDataItems
            | PageItemShutterDataItems
            | PageItemShutter2DataItems
            | PageItemInputSelDataItems
            | PageItemLightDataItems
            | PageItemTextDataItems
            | PageItemFanDataItems
            | PageItemTimerDataItems
            | PageItemSeparator
        );

    type PageItemDataItemsOptionsWithOutTemplate = Omit<PageItemUnion, 'data' | 'type'> &
        (
            | PageItemButtonDataItemsOptions
            | PageItemShutterDataItemsOptions
            | PageItemShutter2DataItemsOptions
            | PageItemInputSelDataItemsOptions
            | PageItemLightDataItemsOptions
            | PageItemNumberDataItemsOptions
            | PageItemTextDataItemsOptions
            | PageItemFanDataItemsOptions
            | PageItemTimerDataItemsOptions
            | PageItemSeparator
        ) & { filter?: pages.filterType; dismissibleIDGlobal?: string };
    type filterType = true | false | number | string;
    type PageItemDataItemsOptions =
        | ({
              template: TemplateIdent;
              dpInit?: string | RegExp;
              /**
               * not implemented yet
               */
              appendix?: string;
              color?: {
                  true?: DataItemsOptions;
                  false?: DataItemsOptions;
                  scale?: IconScaleElement;
              };
              icon?: { true?: DataItemsOptions; false?: DataItemsOptions };
              iconText?: { true?: DataItemsOptions; false?: DataItemsOptions };
              filter?: filterType;
              dismissibleIDGlobal?: string;
          } & Partial<
              Omit<PageItemUnion, 'template' | 'data' | 'type'> &
                  pages.ChangeDeepPartial<
                      | PageItemButtonDataItemsOptions
                      | PageItemShutterDataItemsOptions
                      | PageItemShutter2DataItemsOptions
                      | PageItemInputSelDataItemsOptions
                      | PageItemLightDataItemsOptions
                      | PageItemNumberDataItemsOptions
                      | PageItemTextDataItemsOptions
                      | PageItemFanDataItemsOptions
                      | PageItemTimerDataItemsOptions
                      | PageItemSeparator
                  >
          >)
        | PageItemDataItemsOptionsWithOutTemplate;

    type PageItemOptionsTemplate = {
        template?: TemplateIdent;
        role?: pages.DeviceRole;
        /**
         * check vs dpInit if the template is allowed
         */
        adapter: string;
        modeScr?: string;
        dpInit?: string;
        type: SerialTypePageElements;
    } & (
        | ({ template?: undefined } & Omit<PageItemUnion, 'template' | 'data' | 'type' | 'dpInit' | 'modeScr'> &
              (
                  | PageItemButtonDataItemsOptions
                  | PageItemShutterDataItemsOptions
                  | PageItemShutter2DataItemsOptions
                  | PageItemInputSelDataItemsOptions
                  | PageItemLightDataItemsOptions
                  | PageItemNumberDataItemsOptions
                  | PageItemTextDataItemsOptions
                  | PageItemFanDataItemsOptions
                  | PageItemTimerDataItemsOptions
              ))
        | ({ template: TemplateIdent } & Omit<PageItemUnion, 'template' | 'data' | 'type' | 'dpInit' | 'modeScr'> &
              pages.ChangeTypeOfKeys<
                  | PageItemButtonDataItemsOptions
                  | PageItemShutterDataItemsOptions
                  | PageItemShutter2DataItemsOptions
                  | PageItemInputSelDataItemsOptions
                  | PageItemLightDataItemsOptions
                  | PageItemNumberDataItemsOptions
                  | PageItemTextDataItemsOptions
                  | PageItemFanDataItemsOptions
                  | PageItemTimerDataItemsOptions,
                  DataItemsOptions | undefined | null
              >)
    );

    type PageItemTimer = Pick<
        PageItemBase,
        | 'filter'
        // value or set the time
        | 'entity1'
        | 'text'
        | 'headline'
        | 'icon'
        // the state to trigger if internal trigger ends
        | 'setValue1'
        // set current status
        | 'setValue2'
        | 'enabled'
    >;

    type PageItemTimerDataItemsOptions = {
        type: 'timer';
        data: pages.ChangeTypeOfKeys<PageItemTimer, DataItemsOptions | undefined>;
    };

    type PageItemTimerDataItems = {
        type: 'timer';
        data: pages.ChangeTypeOfKeys<PageItemTimer, dataItem.Dataitem | undefined>;
    };

    type PageItemFan = Pick<
        PageItemBase,
        | 'filter'
        | 'entity1'
        | 'speed'
        | 'text'
        | 'headline'
        | 'icon'
        | 'entityInSel'
        | 'valueList'
        | 'valueList2'
        | 'setList'
        | 'enabled'
    >;

    type PageItemFanDataItemsOptions = {
        type: 'fan';
        data: pages.ChangeTypeOfKeys<PageItemFan, DataItemsOptions | undefined>;
    };

    type PageItemFanDataItems = {
        type: 'fan';
        data: pages.ChangeTypeOfKeys<PageItemFan, dataItem.Dataitem | undefined>;
    };

    type PageItemNumber = Pick<
        PageItemBase,
        | 'filter'
        | 'switch1'
        | 'text'
        | 'icon'
        | 'entity1'
        | 'minValue1'
        | 'maxValue1'
        | 'steps1'
        | 'zero1'
        | 'entity2'
        | 'minValue2'
        | 'maxValue2'
        | 'steps2'
        | 'zero2'
        | 'entity3'
        | 'minValue3'
        | 'maxValue3'
        | 'steps3'
        | 'zero3'
        | 'heading1'
        | 'heading2'
        | 'heading3'
        | 'enabled'
    >;

    type PageItemNumberDataItemsOptions = {
        type: 'number';
        data: pages.ChangeTypeOfKeys<PageItemNumber, DataItemsOptions | undefined>;
    };

    type PageItemNumberDataItems = {
        type: 'number';
        data: pages.ChangeTypeOfKeys<PageItemNumber, dataItem.Dataitem | undefined>;
    };

    export type PageItemButton = Pick<
        PageItemBase,
        | 'filter'
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
        | 'setNaviLongPress'
        | 'confirm'
        | 'entity4'
        | 'popup'
        | 'enabled'
        | 'additionalId'
        | 'setTrue'
        | 'setFalse'
    >;

    type PageItemButtonDataItemsOptions = {
        type: 'button' | 'switch';
        data: pages.ChangeTypeOfKeys<PageItemButton, DataItemsOptions | undefined>;
    };

    type PageItemButtonDataItems = {
        type: 'button' | 'switch';
        data: pages.ChangeTypeOfKeys<PageItemButton, dataItem.Dataitem | undefined>;
    };

    type PageItemText = Pick<
        PageItemBase,
        'filter' | 'entity1' | 'text' | 'text1' | 'entity2' | 'entity3' | 'entity4' | 'icon'
    >;

    type PageItemTextDataItemsOptions = {
        type: 'text';
        data: pages.ChangeTypeOfKeys<PageItemButton, DataItemsOptions | undefined>;
    };

    type PageItemTextDataItems = {
        type: 'text';
        data: pages.ChangeTypeOfKeys<PageItemButton, dataItem.Dataitem | undefined>;
    };

    type PageItemLight = Pick<
        PageItemBase,
        | 'filter'
        | 'valueList'
        | 'valueList2'
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
        | 'enabled'
    >;

    type PageItemSeparator = {
        type: 'empty';
        data: undefined;
    };

    type PageItemSeparatorDataItems = {
        type: 'empty';
        data: undefined;
    };

    type PageItemLightDataItemsOptions = {
        type: 'light' | 'light2';
        data: pages.ChangeTypeOfKeys<PageItemLight, DataItemsOptions | undefined>;
    };

    type PageItemLightDataItems = {
        type: 'light' | 'light2';
        data: pages.ChangeTypeOfKeys<PageItemLight, dataItem.Dataitem | undefined>;
    };

    type PageItemInputSel = Pick<
        PageItemBase,
        | 'filter'
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
        | 'enabled'
    >;

    type PageItemInputSelDataItemsOptions = {
        type: 'input_sel';
        data: pages.ChangeTypeOfKeys<PageItemInputSel, DataItemsOptions | undefined>;
    };

    type PageItemInputSelDataItems = {
        type: 'input_sel';
        data: pages.ChangeTypeOfKeys<PageItemInputSel, dataItem.Dataitem | undefined>;
    };

    type PageItemShutter = Pick<
        PageItemBase,
        | 'filter'
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
        | 'enabled'
    >;

    type PageItemShutterDataItemsOptions = {
        type: 'shutter';
        data: pages.ChangeTypeOfKeys<PageItemShutter, DataItemsOptions | undefined>;
    };

    type PageItemShutterDataItems = {
        type: 'shutter';
        data: pages.ChangeTypeOfKeys<PageItemShutter, dataItem.Dataitem | undefined>;
    };

    type PageItemShutter2 = Pick<
        PageItemBase,
        | 'filter'
        | 'up'
        | 'down'
        | 'stop'
        | 'entity1'
        | 'text'
        | 'text1'
        | 'icon'
        | 'headline'
        | 'entity2'
        | 'entity3'
        | 'entity4'
        | 'icon2'
        | 'icon3'
        | 'icon4'
        | 'enabled'
    >;

    type PageItemShutter2DataItemsOptions = {
        type: 'shutter2';
        data: pages.ChangeTypeOfKeys<PageItemShutter2, DataItemsOptions | undefined>;
    };

    type PageItemShutter2DataItems = {
        type: 'shutter2';
        data: pages.ChangeTypeOfKeys<PageItemShutter2, dataItem.Dataitem | undefined>;
    };

    type PageItemBase = {
        headline?: string;
        color?: ColorEntryType;
        icon?: IconEntryType;
        icon1?: IconEntryType;
        icon2?: IconEntryType;
        icon3?: IconEntryType;
        icon4?: IconEntryType;
        text?: TextEntryType | TextEntryType2;
        entityInSel: ValueEntryType;
        entity1?: ValueEntryType; // Readonly Werte die angezeigt werden soll. wird immer für insel verwendet
        entity2?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
        entity3?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
        entity4?: ValueEntryType; // Readonly Werte die angezeigt werden soll.
        /**
         * Zur Zeit bei number mit cardGrid
         */
        switch1?: string; // true/false only
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
        /**
         * valueList string[]/stringify oder string?string?string?string stelle korreliert mit setList  {input_sel}
         *
         */
        valueList?: number;
        valueList2?: number;
        setNavi?: number;
        setNaviLongPress?: number;
        confirm?: string;
        setList?: number;
        popup?: PopupEntryType;
        /**
         * use with slider
         */
        maxValue1?: number;
        /**
         * use with slider
         */
        minValue1?: number;
        minValue2?: number;
        maxValue2?: number;
        minValue3?: number;
        maxValue3?: number;
        heading1: string; // heading for slider
        heading2?: string; // heading for slider
        heading3?: string; // heading for slider
        steps1?: number; // steps for slider
        steps2?: number; // steps for slider
        steps3?: number; // steps for slider
        zero1?: number; // zero for slider
        zero2?: number; // zero for slider
        zero3?: number; // zero for slider
        interpolateColor?: boolean;
        dimmer?: ScaledNumberType;
        speed?: ScaledNumberType;
        ct?: ScaledNumberType;
        hue?: string;
        colorMode: boolean; // true rgb, false ct
        saturation?: string;
        useColor?: string;
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
        filter?: number; // filter for PageMenu
        enabled?: boolean[] | boolean; // enable/disable the item
        additionalId?: string; // to differ between multiple same entities
        setTrue: boolean; // if use with entity1 if entity1 is false set setTrue to true
        setFalse: boolean; // if use with entity1 if entity1 is true set setFalse to true
    };

    type PageTypeUnionTemplate = {
        role: pages.DeviceRole;
        type: SerialTypePageElements;
        data: {
            headline?: string | undefined;
            color?: RGB | undefined;
            icon?:
                | { true: { value: string; color: RGB | null }; false: { value: string; color: RGB | null } }
                | undefined;
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

    type PageItemUnion = {
        role?: pages.DeviceRole | pages.CardRole;
        template?: undefined;
        readOptions?: Record<string, string>;
        dpInit?: string | RegExp;
        enums?: string | string[];
        device?: string;
        modeScr?: ScreenSaverPlaces | undefined;
        type: SerialTypePageElements;
        data: PageItemBase;
        filter?: pages.filterType;
    };

    type ColorEntryType = Record<BooleanUnion, RGB | undefined> & { scale?: IconScaleElement };

    type ColorEntryTypeBooleanStandard =
        | (Partial<Record<BooleanUnion, { color: RGB }>> & {
              scale?: IconScaleElement | undefined;
              maxBri?: string;
              minBri?: string;
          })
        | undefined;

    type IconEntryType =
        | (Partial<Record<BooleanUnion, { value: string; text?: TextSizeEntryType }>> &
              ColorEntryTypeBooleanStandard & { unstable: { value: string; text?: TextSizeEntryType; color: RGB } })
        | undefined;

    type TextEntryType = Record<BooleanUnion, string>;

    type TextSizeEntryType = ValueEntryType & { textSize?: number };

    type TextEntryType2 = Record<BooleanUnion, { value: string; prefix: string; suffix: string }>;

    type PopupEntryType =
        | {
              isActive?: boolean;
              getMessage: string;
              getHeadline?: string;
              setMessage: string;
          }
        | undefined;

    type ValueEntryTypeWithColor = (ValueEntryType & ColorEntryTypeBooleanStandard) | undefined;

    type ValueEntryType =
        | {
              value: number;
              decimal?: number;
              factor?: number;
              unit?: string;
              /**
               * scale the value
               */
              minScale?: number;
              maxScale?: number;
              set?: number;
              dateFormat?: string;
              math?: string;
              suffix?: string;
              prefix?: string;
          }
        | undefined;

    type ScaledNumberType =
        | {
              value: number;
              minScale?: number;
              maxScale?: number;
              factor?: number;
              set?: number;
              mode?: string; // atm 'kelvin' | 'mired'
              negate?: boolean;
              enabled?: boolean;
          }
        | undefined;

    type listCommand = { id: string; value: string; command?: listCommandUnion };

    type spotifyPlaylist = Array<{
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

    type AutoNeedOne = RequireAtLeastOne<
        Pick<Base, 'role' | 'commonType' | 'regexp'>,
        'role' | 'commonType' | 'regexp'
    >;

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

    type Rest = Omit<Base, 'mode' | 'role' | 'commonType' | 'regexp'>;

    type ChangeTypeOfKeys<Obj, N> = Obj extends
        | object
        | listItem
        | PageTypeCards
        | NSPanel.IconBoolean
        | NSPanel.TextEntryType
        | NSPanel.ValueEntryType
        | NSPanel.IconEntryType
        | NSPanel.ScaledNumberType
        | pages.PageGridPowerConfigElement
        | RGB
        | NSPanel.ColorEntryType
        | pages.PageMediaBaseConfig
        | SerialTypePageElements
        ? Obj extends RGB | IconScaleElement | DataItemsOptions
            ? N
            : {
                  [K in keyof Obj]?: ChangeTypeOfKeys<Obj[K], N>;
              }
        : N;

    type listItem =
        | {
              on: string;
              text: string;
              color: NSPanel.ColorEntryType | string | undefined;
              icon?: NSPanel.IconBoolean | string | undefined;
              list?: string | undefined;
          }
        | undefined;
    type PageTypeCards =
        // Grid Cards
        | 'cardGrid'
        | 'cardGrid2'
        | 'cardGrid3'
        | 'cardThermo2'
        | 'cardMedia'
        // Entities Cards
        | 'cardEntities'
        | 'cardSchedule'
        // Standalone Cards
        | 'cardAlarm'
        | 'cardQR'
        | 'cardPower'
        | 'cardChart'
        | 'cardLChart'
        | 'cardThermo'
        | 'screensaver'
        | 'screensaver2'
        | 'screensaver3'
        // Popup Cards
        | 'popupNotify'
        | 'popupNotify2'
        | 'cardItemSpecial';

    type SerialTypePageElements =
        | 'button' //~button~button.entityName~3~17299~bt-name~bt-text
        | 'light' // ~light~light.entityName~1~17299~Light1~0
        | 'shutter' // ~shutter~cover.entityName~0~17299~Shutter2~iconUp|iconStop|iconDown
        | 'shutter2' // ~shutter2~cover.entityName~0~17299~Shutter2~iconUp|iconStop|iconDown
        | 'text' // ~text~sensor.entityName~3~17299~Temperature~content
        | 'input_sel' //~input_sel~input_select.entityName~3~17299~sel-name~sel-text
        | 'number' //~number~input_number.entityName~4~17299~Number123~value|min|max
        | 'switch' // ~switch~switch.entityName~4~17299~Switch1~0
        | 'delete'; //~delete~~~~~

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
        | 'popupSlider';

    type listCommand = { id: string; value: string; command?: listCommandUnion };
    type listCommandUnion = 'flip';
}
