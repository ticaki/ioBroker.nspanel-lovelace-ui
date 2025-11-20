declare namespace ConfigManager {
    interface DeviceState {
        /**
         * The Type of the device like shutter, light, etc.
         */
        device: string;

        /**
         * States connected to the device..
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
}
declare namespace ScriptConfig {
    import type { ConfigButtonFunction } from '../types/types';
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
        | 'buttonPress3'
        | 'renderCurrentPage'
        | 'button1'
        | 'button2';
    export type panelRecvType = {
        event: 'event';
        method: EventMethod;
    };

    export type NavigationItemConfig = {
        name: string;
        left?: {
            single?: string;
            double?: string;
        };
        right?: {
            single?: string;
            double?: string;
        };
        page: string;
        optional?: never;
    } | null;

    export type SerialType = 'button' | 'light' | 'shutter' | 'text' | 'input_sel' | 'timer' | 'number' | 'fan';

    /**
     * Defines the possible roles for entities in the NSPanel.
     *
     * This type represents the various roles that entities can have within the NSPanel system.
     *
     */
    export type roles =
        | 'airCondition'
        | 'blind'
        | 'button'
        | 'buttonSensor'
        | 'cie'
        | 'dimmer'
        | 'door'
        | 'gate'
        | 'humidity'
        | 'info'
        | 'level.mode.fan'
        | 'level.timer'
        | 'light'
        | 'lock'
        | 'media'
        | 'motion'
        | 'rgb'
        | 'rgbSingle'
        | 'slider'
        | 'socket'
        | 'switch.mode.wlan'
        | 'temperature'
        | 'thermostat'
        | 'timeTable'
        | 'value.alarmtime'
        | 'value.humidity'
        | 'value.temperature'
        | 'value.time'
        | 'warning'
        | 'window'
        | 'volume';

    export type channelRoles =
        | 'airCondition'
        | 'blind'
        | 'button'
        //| 'buttonSensor'
        | 'select'
        //| 'cie'
        | 'ct'
        | 'dimmer'
        | 'door'
        | 'gate'
        | 'hue'
        | 'humidity'
        | 'info'
        | 'level.mode.fan'
        | 'level.timer'
        | 'light'
        | 'lock'
        | 'media'
        //| 'fan'
        | 'motion'
        | 'rgb'
        | 'rgbSingle'
        | 'sensor.alarm.flood'
        | 'slider'
        | 'socket'
        //| 'switch.mode.wlan'
        | 'temperature'
        | 'thermostat'
        | 'timeTable'
        //| 'value.alarmtime'
        | 'value.humidity'
        | 'value.temperature'
        //| 'value.time'
        | 'warning'
        | 'window'
        | 'volume';

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
        uniqueName: string;
        heading: string;
        items: PageItem[];
        /* 
        @deprecated not used 
        */
        useColor?: boolean;
        subPage?: boolean;
        parent?: string;
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
        alwaysOnDisplay?: boolean | 'action' | null;
    };

    export type PagetypeType =
        | 'cardChart'
        | 'cardLChart'
        | 'cardEntities'
        | 'cardSchedule'
        | 'cardGrid'
        | 'cardGrid2'
        | 'cardGrid3'
        | 'cardThermo'
        | 'cardThermo2'
        | 'cardMedia'
        | 'cardUnlock'
        | 'cardQR'
        | 'cardAlarm'
        | 'cardPower'; //| 'cardBurnRec'

    export type PageTypeGlobal =
        | PageChart
        | PageEntities
        | PageSchedule
        | PageGrid
        | PageGrid2
        | PageGrid3
        | PageThermo
        | PageThermo2
        | PageMedia
        | PageUnlock
        | PageQR
        | PageAlarm
        | PagePower
        | PageNative
        | PageLink;

    export type PageType =
        | PageChart
        | PageEntities
        | PageSchedule
        | PageGrid
        | PageGrid2
        | PageGrid3
        | PageThermo
        | PageThermo2
        | PageMedia
        | PageUnlock
        | PageQR
        | PageAlarm
        | PagePower
        | PageNative;

    export type PageLink = {
        heading?: string;
        globalLink: string;
    } & Partial<Pick<PageBaseType, 'prev' | 'next' | 'home' | 'parent' | 'uniqueName'>>;

    export type PageNative = {
        type: undefined;
        heading?: string;
        native: any;
    } & Pick<PageBaseType, 'uniqueName' | 'prev' | 'next' | 'home' | 'parent'>;

    export type PageEntities = {
        type: 'cardEntities';
        items: PageItem[]; //4
    } & PageBaseType &
        PageMenuBaseConfig;
    export type PageSchedule = {
        type: 'cardSchedule';
        items: PageItem[]; //5
    } & PageBaseType &
        PageMenuBaseConfig;

    export type PageGrid = {
        type: 'cardGrid';
        items: PageItem[]; // 6
    } & PageBaseType &
        PageMenuBaseConfig;

    export type PageGrid2 = {
        type: 'cardGrid2';
        items: PageItem[]; // 8
    } & PageBaseType &
        PageMenuBaseConfig;

    export type PageGrid3 = {
        type: 'cardGrid3';
        items: PageItem[]; //4
    } & PageBaseType &
        PageMenuBaseConfig;

    export type PageThermo = {
        type: 'cardThermo';
        items: [PageThermoItem];
    } & Omit<PageBaseType, 'useColor'>;

    export type PageThermo2 = {
        type: 'cardThermo2';
        thermoItems: PageThermo2Item[];
        items: PageThermo2PageItems[];
        sortOrder?: 'H' | 'V' | 'HM' | 'VM' | 'HB' | 'VB';
    } & Omit<PageBaseType, 'useColor'> &
        PageMenuBaseConfig;

    export type PageMedia = {
        type: 'cardMedia';
        media: PageMediaItem;
        items: PageItem[];
    } & Omit<PageBaseType, 'useColor' | 'autoCreateAlias'> &
        PageMenuBaseConfig;

    export type PageAlarm = {
        type: 'cardAlarm';
        items: [PageItem];
    } & Omit<PageBaseType, 'useColor'>;

    export type PageUnlock = {
        type: 'cardUnlock';
        items: [PageItem];
    } & Omit<PageBaseType, 'useColor'>;

    export type PageQR = {
        type: 'cardQR';
    } & Omit<PageBaseType, 'useColor' | 'heading' | 'items'> &
        Partial<Pick<PageBaseType, 'heading' | 'items'>>;

    export type PagePower = {
        type: 'cardPower';
        items: [PageItem];
    } & Omit<PageBaseType, 'useColor' | 'heading' | 'items'> &
        Partial<Pick<PageBaseType, 'heading' | 'items'>>;

    export type PageChart = {
        type: 'cardChart' | 'cardLChart';
        items: PageItem[];
    } & Omit<PageBaseType, 'useColor' | 'heading' | 'items'> &
        Partial<Pick<PageBaseType, 'heading' | 'items'>>;

    export type PageItem = PageBaseItem | PageItemNative | PageBaseCustomItem;

    /**
     * Base configuration for page menus.
     * Controls scroll behavior, filtering and presentation mode.
     */
    type PageMenuBaseConfig = {
        /**
         * Defines how many items are scrolled at once.
         * - `"page"`: Scroll by a full page (all visible items).
         * - `"half"`: Scroll by half a page (only supported by certain card types).
         */
        scrollType?: 'page' | 'half';

        /**
         * Filters which items are shown.
         * - `"true"`: Show only items whose primary entity resolves to `true`.
         * - `"false"`: Show only items whose primary entity resolves to `false`.
         * - `number`: Show only items matching the given numeric filter value.
         */
        filterType?: 'true' | 'false' | number;
    } &
        /**
         * Standard scroll presentations.
         * - `"classic"`: Windowed paging with optional `"half"`/`"page"` stride.
         * - `"arrow"`: Fixed number of slots, last slot can show a paging arrow.
         * Defaults to `"classic"`.
         */
        (| { scrollPresentation?: 'classic' | 'arrow' }
            | {
                  /**
                   * Special mode that behaves like `"classic"`,
                   * including `"half"`/`"page"` support.
                   * Pages automatically advance after a fixed interval.
                   */
                  scrollPresentation?: 'auto';

                  /**
                   * Interval (in seconds) to automatically advance to the next page.
                   * Always required in `"auto"` mode.
                   * Defaults to `15` seconds if not specified.
                   */
                  scrollAutoTiming?: number;
              }
        );
    export type PageMediaItem = {
        /**
         * The media dp to use, most a folder, device or channel. Not a state.
         */
        id: string;
        name?: string;
        mediaDevice?: string; //???
        colorMediaIcon?: RGB;
        colorMediaArtist?: RGB;
        colorMediaTitle?: RGB;
        speakerList?: string[];
        /**
         * Optional list of predefined volume presets.
         * Each entry must be a string formatted as "name?value",
         * e.g. ["quiet?5", "loud?95"].
         *
         * - `name`: Label shown in the UI.
         * - `value`: Volume level (as stringified number).
         *  Notes:
         * - The effective volume will be clamped to `minValue` and `maxValue`.
         *   For example, with minValue = 40 and maxValue = 60,
         *   "loud?100" will result in volume = 60.
         */
        volumePresets?: string[];
        /**
         * List of favorite playlists (whitelist).
         * - If present and non-empty, only the playlists in this list are shown.
         * - If empty or undefined, all available playlists are shown.
         */
        favoriteList?: string[];

        /**
         * List of available playlists.
         * - Alexa & Spotify: contains the playlists provided by the adapter.
         * - Sonos: contains user-defined playlists, since Sonos playlists cannot be read by the adapter.
         */
        playList?: string[];
        equalizerList?: string[];

        repeatList?: string[];
        globalTracklist?: string[];

        /* Volume */
        minValue?: number;
        /* Volume */
        maxValue?: number;
        /** detailed configuration */
        itemsColorOn?: {
            trackList?: RGB;
            speakerList?: RGB;
            repeat?: RGB;
            equalizer?: RGB;
            playList?: RGB;
            online?: RGB;
            reminder?: RGB;
            crossfade?: RGB;
            favoriteList?: RGB;
            clock?: RGB;
            volumePresets?: RGB;
        };
        itemsColorOff?: {
            trackList?: RGB;
            speakerList?: RGB;
            repeat?: RGB;
            equalizer?: RGB;
            playList?: RGB;
            online?: RGB;
            reminder?: RGB;
            crossfade?: RGB;
            favoriteList?: RGB;
            clock?: RGB;
            volumePresets?: RGB;
        };
        deactivateDefaultItems?: {
            trackList?: boolean;
            speakerList?: boolean;
            repeat?: boolean;
            equalizer?: boolean;
            playList?: boolean;
            online?: boolean;
            reminder?: boolean;
            clock?: boolean;
            favoriteList?: boolean;
            crossfade?: boolean;
        };
    };

    export type PageThermo2PageItems = {
        heatCycleIndex?: number;
    } & PageBaseItem;

    export type PageThermoItem = {
        popupThermoMode1?: string[];
        popupThermoMode2?: string[];
        popupThermoMode3?: string[];
        popUpThermoName?: string[];
        setThermoAlias?: string[];
        setThermoDestTemp2?: string;
    } & PageBaseItem;

    export type PageThermo2Item = (
        | {
              thermoId1: string;
              thermoId2?: string;
              modeId?: string;
              set: string;
          }
        | {
              id: string;
              name2?: string;
          }
    ) & {
        icon?: AllIcons | '';
        icon2?: AllIcons | '';

        iconHeatCycle?: AllIcons | '';
        iconHeatCycleOnColor?: RGB;
        iconHeatCycleOffColor?: RGB;

        iconHeatCycle2?: AllIcons | '';
        iconHeatCycleOnColor2?: RGB;
        iconHeatCycleOffColor2?: RGB;

        name?: string;
        minValue?: number;
        maxValue?: number;
        stepValue?: number;
        /**
         * The unit of the 2. line. can string, icon or state
         */
        power: string;
        unit: string;
        onColor?: RGB;
        unit2?: string;
        onColor2?: RGB;
        modeList?: string[];
    };

    // mean string start with getState(' and end with ').val
    type getStateID = string;
    export type PageItemNative = {
        /**
         * Native configuration no validation
         */
        native: any;
    } & ({ navigate: boolean; targetPage: string } | { navigate?: undefined; targetPage?: undefined });

    export type PageBaseCustomItem = {
        type: 'custom';
        id: string;
        navigate?: boolean | null | undefined;
        targetPage?: string | null | undefined;
        targetPageLongPress?: string | null | undefined;
        icon?: string;
        icon2?: string;
        name?: string;
        onColor?: RGB | string;
        offColor?: RGB | string;
        colorScale?: IconScaleElement;
        buttonText?: string;
    };

    export type PageBaseItem = (
        | {
              navigate: true;
              targetPage: string;
              /**
               * The data point with the data to be used.
               */
              id?: string | null;
          }
        | {
              /**
               * The data point with the data to be used.
               */
              id: string;
              navigate?: false | null | undefined;
              targetPage?: string | null | undefined;
          }
    ) & {
        type?: undefined | null;
        uniqueName?: string;
        role?: string;
        targetPageLongPress?: string;
        /**
         * The icon that is used in the standard case or if ID is true
         */
        icon?: AllIcons;
        /**
         * The icon that is used when id is false
         */
        icon2?: AllIcons;
        /**
         * Used with blinds for partially open.
         */
        icon3?: AllIcons;
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
        prefixValue?: string;
        suffixValue?: string;
        name?: string;
        secondRow?: string;
        buttonText?: string;
        buttonTextOff?: string;
        unit?: string;
        colormode?: string;
        colorScale?: IconScaleElement;
        modeList?: string[];
        hidePassword?: boolean;
        autoCreateALias?: boolean;
        yAxis?: string;
        yAxisTicks?: number[] | string;
        xAxisDecorationId?: string;
        useValue?: boolean;
        monobutton?: boolean;
        inSel_ChoiceState?: boolean;
        inSel_Alias?: string;
        iconArray?: string[];
        customIcons?: any[];
        shutterIcons?: [shutterIcons?, shutterIcons?, shutterIcons?] | null;
        fontSize?: 0 | 1 | 2 | 3 | 4 | 5;
        actionStringArray?: string[];
        alwaysOnDisplay?: boolean;
        /**
         * Wird vom Skript verwendet um zu entscheiden welches Popup verwendet wird.
         * Adapter verwendet immer die neuen Popups außer wenn beim popupShutter tilt vorhanden ist
         * dann wird das alte verwendet!
         *
         * @deprecated unused in adapter
         */
        popupVersion?: number;
        shutterType?: string;
        sliderItems?: [sliderItems?, sliderItems?, sliderItems?] | null;
        filter?: number;
        enabled?: boolean | string;
        // erstmal für media mit id keine erstellung einer mediaCard - nur schalten
        asControl?: boolean;
    };

    type sliderItems = {
        heading: string;
        icon1?: string;
        icon2?: string;
        minValue?: number;
        maxValue?: number;
        stepValue?: number;
        zeroValue?: boolean;
        id?: string; // writeable overwrite actual and set
    };
    type shutterIcons = {
        id: string;
        icon: string;
        icon2?: string;
        iconOnColor?: RGB;
        iconOffColor?: RGB;
        buttonType: string;
    };

    export type DimMode = {
        dimmodeOn: boolean | undefined;
        brightnessDay: number | undefined;
        brightnessNight: number | undefined;
        timeDay: string | undefined;
        timeNight: string | undefined;
    };

    export type globalPagesConfig = {
        version: string;
        type: 'globalConfig';
        subPages: PageType[];
        nativePageItems?: any[];
        navigation?: NavigationItemConfig[];
        maxNavigationAdjustRuns?: number;
    };

    export type Config = {
        version: string;
        panelName?: string;
        /**
         * The topic to receive and send messages to the panel.
         */
        panelTopic: string;
        /**
         * The weather adapter and instance to use.
         * example: accuweather.0
         * supported: accuweather
         */
        weatherEntity: string;
        /**
         * Steuert, welche Standard-Wetter-Items automatisch hinzugefügt werden.
         * - `true`  → alle Items hinzufügen
         * - Objekt  → nur die explizit auf `true` gesetzten Items hinzufügen
         * - `undefined` → keine Items hinzufügen
         */
        weatherAddDefaultItems?: WeatherAddDefaultItemsJson | boolean;
        favoritScreensaverEntity: ScreenSaverElement[];
        alternateScreensaverEntity: ScreenSaverElement[];
        leftScreensaverEntity: ScreenSaverElementWithUndefined[];
        bottomScreensaverEntity: ScreenSaverElement[];
        indicatorScreensaverEntity: ScreenSaverElementWithUndefined[];
        mrIcon1ScreensaverEntity: ScreenSaverMRElement;
        mrIcon2ScreensaverEntity: ScreenSaverMRElement;
        notifyScreensaverEntity?: ScreenSaverNotifyElement[];
        defaultOnColor: RGB;
        defaultOffColor: RGB;
        defaultBackgroundColor: RGB;
        pages: PageType[];
        subPages: PageType[];
        /* Represents the configuration for a button function.
         * This type can be one of the following modes:
         * - 'page': Navigates to a specified page.
         * - 'toggle': Toggles the state of a datapoint.
         * - 'push': Triggers a button datapoint with a true value.
         * - null: Represents no configuration.
         */
        buttonLeft: ConfigButtonFunction;
        /**
         * Represents the configuration for a button function.
         * This type can be one of the following modes:
         * - 'page': Navigates to a specified page.
         * - 'toggle': Toggles the state of a datapoint.
         * - 'push': Triggers a button datapoint with a true value.
         * - null: Represents no configuration.
         */
        buttonRight: ConfigButtonFunction;
        nativePageItems?: any[];
        navigation?: NavigationItemConfig[];
        advancedOptions?: {
            screensaverSwipe?: boolean;
            screensaverIndicatorButtons?: boolean;
            extraConfigLogging?: boolean;
        };
    };

    export type ScreenSaverElementWithUndefined = null | undefined | ScreenSaverElement;
    export type ScreenSaverElement = { type: ScreenSaverType } & (
        | ({
              type: 'script';
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
              ScreensaverEntityNaviToPage?: string | null;
              ScreensaverEntityButton?: string | null;
              ScreensaverEntitySwitch?: string | null;
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
          } & {
              /**
               * Optional condition that determines whether a ScreensaverEntity should be visible.
               *
               * - If `undefined`, the entity is always shown (`true`).
               * - If provided, the adapter prepends `return` to the string and evaluates it.
               *   The result must be a boolean:
               *   - `true` → the entity is shown.
               *   - `false` → the entity is hidden.
               *
               * Example:
               * ```ts
               * ScreensaverEntityVisibleCondition: "val.length > 0 && val !== 'OFF'"
               * ```
               */
              ScreensaverEntityEnabled?: string;
              ScreensaverEntityVisibleCondition?: string;
          })
        | { type: 'native'; native: any }
        | ({
              type: 'template';
              template: string;
              dpInit: string;
              enabled?: string;
              visibleCondition?: string;
              modeScr: 'left' | 'bottom' | 'indicator' | 'favorit' | 'alternate';
          } & ({ enabled: string; visibleCondition?: string } | { enabled?: string }))
    );

    export type ScreenSaverNotifyElement = { type: ScreenSaverType } & (
        | ({
              type: 'script';
              /**
               * Lower number = higher priority
               */
              Priority: number;
              Headline: string;
              HeadlinePrefix?: string;
              HeadlineUnit?: string;
              Text: string;
              TextSuffix?: string;
              TextPrefix?: string;
              HeadlineIcon?: string | null;
              isDismissiblePerEvent?: boolean;
              dismissibleIDGlobal?: string;
              buzzer?: boolean | string;
          } & (
              | {
                    Enabled?: string | null | string[];
                }
              | {
                    /**
                     *  Condition that determines whether a Notify should be visible.
                     *
                     * - If `undefined`, the entity is always shown (`true`).
                     * - If provided, the adapter prepends `return` to the string and evaluates it.
                     *   The result must be a boolean:
                     *   - `true` → the entity is shown.
                     *   - `false` → the entity is hidden.
                     *
                     * Example:
                     * ```ts
                     * VisibleCondition: "val.length > 0 && val !== 'OFF'"
                     * ```
                     */
                    Enabled: string | string[];
                    VisibleCondition?: string;
                }
          ))
        | { type: 'native'; native: any }
        | {
              type: 'template';
              template: string;
              dpInit: string;
              modeScr: 'notify';
          }
    );

    export type WeatherAddDefaultItemsJson = {
        sunriseSet?: boolean; // Sunrise/Sunset
        forecastDay1?: boolean; // Forecast Day 1
        forecastDay2?: boolean; // Forecast Day 2
        forecastDay3?: boolean; // Forecast Day 3
        forecastDay4?: boolean; // Forecast Day 4
        forecastDay5?: boolean; // Forecast Day 5
        forecastDay6?: boolean; // Forecast Day 6 (falls vom Adapter unterstützt)
        windSpeed?: boolean; // Windgeschwindigkeit
        windGust?: boolean; // Böen
        windDirection?: boolean; // Windrichtung
        uvIndex?: boolean; // UV-Index (falls vom Adapter unterstützt)
        solar?: boolean; // Solarstrahlung (falls vom Adapter unterstützt)
    };

    export type ScreenSaverMRElement = { type: ScreenSaverType } & (
        | {
              type: 'script';
              ScreensaverEntity: string | null;
              ScreensaverEntityIconOn: string | null;
              ScreensaverEntityIconSelect?: { [key: string]: string } | null | undefined;
              ScreensaverEntityIconOff: string | null;
              ScreensaverEntityValue: string | null;
              ScreensaverEntityValueDecimalPlace: number | null;
              ScreensaverEntityValueUnit: string | null;
              ScreensaverEntityOnColor: RGB;
              ScreensaverEntityOffColor: RGB;
          }
        | { type: 'native'; native: any }
        | {
              type: 'template';
              template: string;
              dpInit: string;
              modeScr: 'bottom';
          }
    );

    type ScreenSaverType = 'template' | 'script' | 'native';
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
