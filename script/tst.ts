    /**
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     *  END STOP END STOP END - No more configuration - END STOP END STOP END       *
     ********************************************************************************
     *  For a update copy and paste the code below from orginal file.               *
     * ******************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     */

     log(await sendToAsync('nspanel-lovelace-ui.0', 'ScriptConfig', {...config, version}))
    }
    
    const version = '0.2.1';
    const HMIOff = {red: 68, green: 115, blue: 158};     // Blue-Off - Original Entity Off
    const HMIOn = {red: 3, green: 169, blue: 244};     // Blue-On
    const HMIDark = {red: 29, green: 29, blue: 29};     // Original Background Color
    const Off = {red: 253, green: 128, blue: 0};     // Orange-Off - nicer color transitions
    const On = {red: 253, green: 216, blue: 53};
    const MSRed = {red: 251, green: 105, blue: 98};
    const MSYellow = {red: 255, green: 235, blue: 156};
    const MSGreen = {red: 121, green: 222, blue: 121};
    const Red = {red: 255, green: 0, blue: 0};
    const White = {red: 255, green: 255, blue: 255};
    const Yellow = {red: 255, green: 255, blue: 0};
    const Green = {red: 0, green: 255, blue: 0};
    const Blue = {red: 0, green: 0, blue: 255};
    const DarkBlue = {red: 0, green: 0, blue: 136};
    const Gray = {red: 136, green: 136, blue: 136};
    const Black = {red: 0, green: 0, blue: 0};
    const Cyan = {red: 0, green: 255, blue: 255};
    const Magenta = {red: 255, green: 0, blue: 255};
    const colorSpotify = {red: 30, green: 215, blue: 96};
    const colorAlexa = {red: 49, green: 196, blue: 243};
    const colorSonos = {red: 216, green: 161, blue: 88};
    const colorRadio = {red: 255, green: 127, blue: 0};
    const BatteryFull = {red: 96, green: 176, blue: 62};
    const BatteryEmpty = {red: 179, green: 45, blue: 25};
    
    //Menu Icon Colors
    const Menu = {red: 150, green: 150, blue: 100};
    const MenuLowInd = {red: 255, green: 235, blue: 156};
    const MenuHighInd = {red: 251, green: 105, blue: 98};
    
    //Dynamische Indikatoren (Abstufung grün nach gelb nach rot)
    const colorScale0 = {red: 99, green: 190, blue: 123};
    const colorScale1 = {red: 129, green: 199, blue: 126};
    const colorScale2 = {red: 161, green: 208, blue: 127};
    const colorScale3 = {red: 129, green: 217, blue: 126};
    const colorScale4 = {red: 222, green: 226, blue: 131};
    const colorScale5 = {red: 254, green: 235, blue: 132};
    const colorScale6 = {red: 255, green: 210, blue: 129};
    const colorScale7 = {red: 251, green: 185, blue: 124};
    const colorScale8 = {red: 251, green: 158, blue: 117};
    const colorScale9 = {red: 248, green: 131, blue: 111};
    const colorScale10 = {red: 248, green: 105, blue: 107};
    
    //Screensaver Default Theme Colors
    const scbackground = {red: 0, green: 0, blue: 0};
    const scbackgroundInd1 = {red: 255, green: 0, blue: 0};
    const scbackgroundInd2 = {red: 121, green: 222, blue: 121};
    const scbackgroundInd3 = {red: 255, green: 255, blue: 0};
    const sctime = {red: 255, green: 255, blue: 255};
    const sctimeAMPM = {red: 255, green: 255, blue: 255};
    const scdate = {red: 255, green: 255, blue: 255};
    const sctMainIcon = {red: 255, green: 255, blue: 255};
    const sctMainText = {red: 255, green: 255, blue: 255};
    const sctForecast1 = {red: 255, green: 255, blue: 255};
    const sctForecast2 = {red: 255, green: 255, blue: 255};
    const sctForecast3 = {red: 255, green: 255, blue: 255};
    const sctForecast4 = {red: 255, green: 255, blue: 255};
    const sctF1Icon = {red: 255, green: 235, blue: 156};
    const sctF2Icon = {red: 255, green: 235, blue: 156};
    const sctF3Icon = {red: 255, green: 235, blue: 156};
    const sctF4Icon = {red: 255, green: 235, blue: 156};
    const sctForecast1Val = {red: 255, green: 255, blue: 255};
    const sctForecast2Val = {red: 255, green: 255, blue: 255};
    const sctForecast3Val = {red: 255, green: 255, blue: 255};
    const sctForecast4Val = {red: 255, green: 255, blue: 255};
    const scbar = {red: 255, green: 255, blue: 255};
    const sctMainIconAlt = {red: 255, green: 255, blue: 255};
    const sctMainTextAlt = {red: 255, green: 255, blue: 255};
    const sctTimeAdd = {red: 255, green: 255, blue: 255};
    
    //Auto-Weather-Colors
    const swClearNight = {red: 150, green: 150, blue: 100};
    const swCloudy = {red: 75, green: 75, blue: 75};
    const swExceptional = {red: 255, green: 50, blue: 50};
    const swFog = {red: 150, green: 150, blue: 150};
    const swHail = {red: 200, green: 200, blue: 200};
    const swLightning = {red: 200, green: 200, blue: 0};
    const swLightningRainy = {red: 200, green: 200, blue: 150};
    const swPartlycloudy = {red: 150, green: 150, blue: 150};
    const swPouring = {red: 50, green: 50, blue: 255};
    const swRainy = {red: 100, green: 100, blue: 255};
    const swSnowy = {red: 150, green: 150, blue: 150};
    const swSnowyRainy = {red: 150, green: 150, blue: 255};
    const swSunny = {red: 255, green: 255, blue: 0};
    const swWindy = {red: 150, green: 150, blue: 150};
    
    type PageType = ScriptConfig.PageType;
    type Config = ScriptConfig.Config;
    type PageBaseType = ScriptConfig.PageBaseType;
    type PageItem = ScriptConfig.PageItem;
    type PageBaseItem = ScriptConfig.PageBaseItem;
    type PageMediaItem = ScriptConfig.PageMediaItem;
    type PageThermoItem = ScriptConfig.PageThermoItem;
    type PageEntities = ScriptConfig.PageEntities;
    type PageGrid = ScriptConfig.PageGrid;
    type PageGrid2 = ScriptConfig.PageGrid2;
    type PageGrid3 = ScriptConfig.PageGrid3;
    type PageThermo = ScriptConfig.PageThermo;
    type PageMedia = ScriptConfig.PageMedia;
    type PageAlarm = ScriptConfig.PageAlarm;
    type PageUnlock = ScriptConfig.PageUnlock;
    type PageQR = ScriptConfig.PageQR;
    type PagePower = ScriptConfig.PagePower;
    type PageChart = ScriptConfig.PageChart;
    type PagetypeType = ScriptConfig.PagetypeType;
    type NavigationItemConfig = ScriptConfig.NavigationItemConfig;
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
            | {type: undefined; heading?: string; native: any};
    
        export type PageEntities = {
            type: 'cardEntities';
            items: PageItem[];
        } & PageBaseType;
    
        export type PageGrid = {
            type: 'cardGrid';
            items: PageItem[];
        } & PageBaseType;
    
        export type PageGrid2 = {
            type: 'cardGrid2';
            items: PageItem[];
        } & PageBaseType;
    
        export type PageGrid3 = {
            type: 'cardGrid3';
            items: PageItem[];
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
            setOn?: {dp: string; val: iobJS.StateValue};
            setOff?: {dp: string; val: iobJS.StateValue};
        };
    
        export type Config = {
            panelName?: string;
            /**
             * The topic to receive and send messages to the panel.
             */
            panelTopic: string;
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
            /**
             * Native page items for the panel
             */
            nativePageItems?: any;
            navigation?: NavigationItemConfig[];
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
            ScreensaverEntityIconSelect?: {icon: string; value: number}[] | null;
        };
    
        export type ScreenSaverMRElement = {
            ScreensaverEntity: string | null;
            ScreensaverEntityIconOn: string | null;
            ScreensaverEntityIconSelect?: {[key: string]: string} | null | undefined;
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
            ScreensaverEntityIconSelect: {[key: string]: string} | null;
        };
    
        export type IconScaleElement = {
            val_min: number;
            val_max: number;
            val_best?: number;
            /**
             * The color mix mode. Default is 'mixed'.
             * ‘mixed’: the target colour is achieved by scaling between the two RGB colours.
             * 'cie': the target colour is achieved by mixing according to the CIE colour table. 
             * 'hue': the target colour is calculated by scaling via colour, saturation and brightness.
             */
            mode?: 'mixed' | 'hue' | 'cie';
            /**
             * The logarithm scaling to max, min or leave undefined for linear scaling.
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
    configuration();