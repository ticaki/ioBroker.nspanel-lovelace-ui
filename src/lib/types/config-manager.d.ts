declare namespace ConfigManager {
    interface DeviceState {
        /**
         * The Type of the device like shutter, light, etc.
         */
        device: string;

        /**
         * States connected to the device.
         */
        configStates: ConfigState[];
    }

    interface ConfigState {
        /**
         * Datapoint id.
         */
        id: string;

        /**
         * The role this id has in the device.
         */
        role: string;

        /**
         * function() function to transform the value.
         */
        read?: string;

        /**
         * The type of the value. This is used to determine how the value should be displayed in the UI.
         */
        type?: string;
    }

    interface CustomTemplate {
        /**
         * The name of the template.
         */
        device: string;

        /**
         * the states to use in the template.
         */
        states: Partial<Record<ioBrokerRoles, true | null>>[];
    }
    type ioBrokerRoles =
        | 'button.open.blind'
        | 'button.close.blind'
        | 'button.open.tilt'
        | 'button.close.tilt'
        | 'button.stop.tilt'
        | 'button.stop.blind'
        | 'level.blind'
        | 'sensor.window'
        | 'value.battery'
        | 'value.temperature'
        | 'value.humidity'
        | 'sensor.motion'
        | 'level.color.cie'
        | 'level.dimmer'
        | 'switch.light'
        | 'state.light'
        | 'level.color.temperature'
        | 'value.dimmer'
        | 'state'
        | 'level.color.hue'
        | 'value.blind'
        | 'value.tilt'
        | 'level.tilt'
        | 'switch'
        | 'value'
        | 'level.mode.fan'
        | 'switch.mode.swing'
        | 'indicator.maintainance'
        | 'indicator.error'
        | 'level.mode.aircondition'
        | 'switch.boost'
        | 'level.temperature'
        | 'level.volume'
        | 'value.volume'
        | 'media.mute'
        | 'level.color.red'
        | 'level.color.green'
        | 'level.color.blue'
        | 'level.color.white'
        | 'level'
        | 'level.color.rgb'
        | 'level.mode.thermostat'
        | 'text'
        | 'indicator'
        | 'sensor.light'
        | 'indicator.maintenance.unreach'
        | 'button.press'
        | 'indicator.maintainance.lowbat'
        | 'switch.mode.manual'
        | 'switch.mode.auto'
        | 'indicator.working'
        | 'switch.power'
        | 'switch.mode.party'
        | 'button.stop'
        | 'switch.gate'
        | 'timestamp'
        | 'switch.lock'
        | 'weather.title'
        | 'value.warning'
        | 'weather.title.short'
        | 'weather.icon.forecast';
}
declare namespace ScriptConfig {
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

    export type SerialType = 'button' | 'light' | 'shutter' | 'text' | 'input_sel' | 'timer' | 'number' | 'fan';

    /**
     * Defines the possible roles for entities in the NSPanel.
     *
     * This type represents the various roles that entities can have within the NSPanel system.
     *
     */
    export type roles =
        | 'light'
        | 'socket'
        | 'dimmer'
        | 'hue'
        | 'rgb'
        | 'rgbSingle'
        | 'ct'
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
        | 'U1'
        | 'f1Icon'
        | 'f2Icon'
        | 'f3Icon'
        | 'f4Icon'
        | 'f5Icon';

    export type RGB = {
        red: number;
        green: number;
        blue: number;
    };

    export type Payload = {
        payload: string;
    };

    export type PageBaseType = {
        type: PagetypeType;
        uniqueName?: string;
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
        hiddenByTrigger?: boolean;
    };

    export type PagetypeType =
        | 'cardChart'
        | 'cardLChart'
        | 'cardEntities'
        | 'cardGrid'
        | 'cardGrid2'
        | 'cardGrid3'
        | 'cardThermo'
        | 'cardMedia'
        | 'cardUnlock'
        | 'cardQR'
        | 'cardAlarm'
        | 'cardPower'; //| 'cardBurnRec'

    export type PageType =
        | PageChart
        | PageEntities
        | PageGrid
        | PageGrid2
        | PageGrid3
        | PageThermo
        | PageMedia
        | PageUnlock
        | PageQR
        | PageAlarm
        | PagePower
        | { type: undefined; heading?: string; native: any };

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
        items: [PageItem?, PageItem?, PageItem?, PageItem?, PageItem?, PageItem?, PageItem?, PageItem?, PageItem?];
    } & PageBaseType;

    export type PageGrid3 = {
        type: 'cardGrid3';
        items: [PageItem?, PageItem?, PageItem?, PageItem?];
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

    export type PageMediaItem = {
        adapterPlayerInstance: adapterPlayerInstanceType;
        mediaDevice?: string;
        colorMediaIcon?: RGB;
        colorMediaArtist?: RGB;
        colorMediaTitle?: RGB;
        speakerList?: string[];
        playList?: string[];
        equalizerList?: string[];
        repeatList?: string[];
        globalTracklist?: string[];
        crossfade?: boolean;
    } & PageBaseItem;

    export type PageThermoItem = {
        popupThermoMode1?: string[];
        popupThermoMode2?: string[];
        popupThermoMode3?: string[];
        popUpThermoName?: string[];
        setThermoAlias?: string[];
        setThermoDestTemp2?: string;
    } & PageBaseItem;
    // mean string start with getState(' and end with ').val
    type getStateID = string;
    export type PageBaseItem = {
        uniqueName?: string;
        role?: string;
        /**
         * The data point with the data to be used.
         */
        id?: string | null;
        /**
         * The icon that is used in the standard case or if ID is true
         */
        icon?: string;
        /**
         * The icon that is used when id is false
         */
        icon2?: string;
        /**
         * Used with blinds for partially open.
         */
        icon3?: string;
        /**
         * The color that is used in the standard case or if ID is true
         */
        onColor?: RGB;
        /**
         * The color that is used when id is false
         */
        offColor?: RGB;
        useColor?: boolean;
        /**
         * Interpolate the icon colour by ID
         */
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
        colorScale?: IconScaleElement;
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
        customIcons?: any[];
        fontSize?: number;
        actionStringArray?: string[];
        alwaysOnDisplay?: boolean;
    };

    export type DimMode = {
        dimmodeOn: boolean | undefined;
        brightnessDay: number | undefined;
        brightnessNight: number | undefined;
        timeDay: string | undefined;
        timeNight: string | undefined;
    };

    export type ConfigButtonFunction = {
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
        setOn?: { dp: string; val: iobJS.StateValue };
        setOff?: { dp: string; val: iobJS.StateValue };
    };

    export type Config = {
        panelName?: string;
        model?: string;
        panelTopic?: string;
        weatherEntity: string;
        leftScreensaverEntity: leftScreensaverEntityType;
        bottomScreensaverEntity: ScreenSaverElement[];
        indicatorScreensaverEntity: indicatorScreensaverEntityType;
        mrIcon1ScreensaverEntity: ScreenSaverMRElement;
        mrIcon2ScreensaverEntity: ScreenSaverMRElement;
        defaultColor: RGB;
        defaultOnColor: RGB;
        defaultOffColor: RGB;
        defaultBackgroundColor: RGB;
        pages: PageType[];
        subPages: PageType[];
        button1: ConfigButtonFunction;
        button2: ConfigButtonFunction;
        nativePageItems?: typePageItem.PageItemDataItemsOptions[];
    };
    export type leftScreensaverEntityType =
        | [ScreenSaverElementWithUndefined?, ScreenSaverElementWithUndefined?, ScreenSaverElementWithUndefined?]
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
    export type ScreenSaverElement = {
        ScreensaverEntity: string;
        ScreensaverEntityText: string;
        /**
         * Value wird mit diesem Factor multipliziert.
         */
        ScreensaverEntityFactor?: number;
        ScreensaverEntityDecimalPlaces?: number;
        ScreensaverEntityDateFormat?: Intl.DateTimeFormatOptions;
        ScreensaverEntityIconOn?: string | null;
        ScreensaverEntityIconOff?: string | null;
        ScreensaverEntityUnitText?: string;
        ScreensaverEntityIconColor?: RGB | IconScaleElement | string;
        ScreensaverEntityOnColor?: RGB;
        ScreensaverEntityOffColor?: RGB;
        ScreensaverEntityOnText?: string | null;
        ScreensaverEntityOffText?: string | null;
        ScreensaverEntityNaviToPage?: PageType;
        /**
         * To show different icons for different values in the screensaver
         * 
         * Value is the threshold for the icon. Lower values are first.
         * Example:
         * [
                    {icon: 'sun-thermometer', value:40},
                    {icon: 'sun-thermometer-outline', value: 35},
                    {icon: 'thermometer-high', value: 30},
                    {icon: 'thermometer', value: 25},
                    {icon: 'thermometer-low', value: 15},
                    {icon: 'snowflake-alert', value: 2},
                    {icon: 'snowflake-thermometer', value: -2},
                    {icon: 'snowflake', value: -10},
                    ]
         */
        ScreensaverEntityIconSelect?: { icon: string; value: number }[] | null;
    };

    export type ScreenSaverMRElement = {
        ScreensaverEntity: string | null;
        ScreensaverEntityIconOn: string | null;
        ScreensaverEntityIconSelect?: { [key: string]: string } | null | undefined;
        ScreensaverEntityIconOff: string | null;
        ScreensaverEntityValue: string | null;
        ScreensaverEntityValueDecimalPlace: number | null;
        ScreensaverEntityValueUnit: string | null;
        ScreensaverEntityOnColor: RGB;
        ScreensaverEntityOffColor: RGB;
    };
    export type ScreenSaverMRDataElement = {
        ScreensaverEntity: string | number | boolean | null;
        ScreensaverEntityIconOn: string | null;
        ScreensaverEntityIconOff: string | null;
        ScreensaverEntityValue: string | number | boolean | null;
        ScreensaverEntityValueDecimalPlace: number | null;
        ScreensaverEntityValueUnit: string | null;
        ScreensaverEntityOnColor: RGB;
        ScreensaverEntityOffColor: RGB;
        ScreensaverEntityIconSelect: { [key: string]: string } | null;
    };

    export type IconScaleElement = {
        val_min: number;
        val_max: number;
        val_best?: number;
    };
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

    export type _PlayerTypeWithOutMediaDevice = 'spotify-premium' | 'volumio' | 'bosesoundtouch';
    export type _PlayerTypeWithMediaDevice = 'alexa2' | 'sonos' | 'squeezeboxrpc';

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
}
