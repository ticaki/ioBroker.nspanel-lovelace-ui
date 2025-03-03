async function configuration (): Promise<void> {


    // Diese Konfiguration für den Fahrplan ist ein Beispiel was die interne Adapterkonfiguration benutzt, diese 
    // ist recht komplex und wird nicht weiter erläutert. Da gibts später fertige Templates die man hier verwenden kann.
    // wie am Fahrplan Beispiel zu sehen ist.
    const fahrplan: any = {
        heading: 'Fahrplan Script',
        native: {
            card: 'cardEntities',
            dpInit: 'fahrplan.0.0',
            uniqueID: 'fahrplanrouten',
            template: 'entities.fahrplan.routes',
        }
    };

    // Konfiguration findet im Admin statt, uniqueName muß gleich dem namen in der Adminkonfiguration sein.
    const qrCode: PageType = {
        type: 'cardQR',
        uniqueName: 'qrCode'
    };

    // Ein Beispiel für eine Gridseite mit verschiedenen Farbskalen
    const irgendeinName: PageType = {
        type: 'cardGrid',
        uniqueName: 'main',
        heading: 'Wohnzimmer',
        useColor: true,
        items: [
            {id: 'alias.0.Temperatur', name: 'standard', onColor: Red, offColor: Blue, colorScale: {'val_min': 0, 'val_max': 40}},
            {id: 'alias.0.Temperatur', name: 'hue', onColor: Red, offColor: Blue, colorScale: {'val_min': 0, 'val_max': 40, mode: 'hue'}},
            {id: 'alias.0.Temperatur', name: 'cie', onColor: Red, offColor: Blue, colorScale: {'val_min': 0, 'val_max': 40, mode: 'cie'}},
            {id: 'alias.0.Temperatur', name: 'standard log min', onColor: Red, offColor: Blue, colorScale: {'val_min': 0, 'val_max': 40, log10: 'min'}},
            {id: 'alias.0.Temperatur', name: 'hue log min', onColor: Red, offColor: Blue, colorScale: {'val_min': 0, 'val_max': 40, mode: 'hue', log10: 'min'}},
            {id: 'alias.0.Temperatur', name: 'cie log min', onColor: Red, offColor: Blue, colorScale: {'val_min': 0, 'val_max': 40, mode: 'cie', log10: 'min'}},
            {id: 'alias.0.Temperatur', name: 'standard', onColor: Red, offColor: Blue, colorScale: {'val_min': 0, 'val_max': 40}},
            {id: 'alias.0.Temperatur', name: 'hue', onColor: Red, offColor: Blue, colorScale: {'val_min': 0, 'val_max': 40, mode: 'hue'}},
            {id: 'alias.0.Temperatur', name: 'cie', onColor: Red, offColor: Blue, colorScale: {'val_min': 0, 'val_max': 40, mode: 'cie'}},
            {id: 'alias.0.Temperatur', name: 'standard log max', onColor: Red, offColor: Blue, colorScale: {'val_min': 0, 'val_max': 40, log10: 'max'}},
            {id: 'alias.0.Temperatur', name: 'hue log max', onColor: Red, offColor: Blue, colorScale: {'val_min': 0, 'val_max': 40, mode: 'hue', log10: 'max'}},
            {id: 'alias.0.Temperatur', name: 'cie log max', onColor: Red, offColor: Blue, colorScale: {'val_min': 0, 'val_max': 40, mode: 'cie', log10: 'max'}},
        ]
    };

    const grid1: PageType = {
        uniqueName: 'grid1', // keine Navigation, am besten uniqueName von config.ts übernehmen
        heading: 'Grid 1',
        items: [
            {id: 'alias.0.Licht.lights.Gerät_1'},
            {id: 'alias.0.Licht.lights.Gerät_2'},
            {id: '0_userdata.0.Einzelne_Geräte.dimmer'},
            {id: 'alias.0.NSPanel.allgemein.hue', },
            {navigate: true, targetPage: 'fahrplanrouten'},
            {id: 'alias.0.NSPanel.allgemein.shutter'}
        ],
        type: 'cardGrid',
        useColor: true
    }

    const config: ScriptConfig.Config = {
        panelTopic: 'nspanel/ns_panel4',
        weatherEntity: 'accuweather.0.',
        defaultOffColor: Off,
        defaultOnColor: On,
        defaultColor: Off,
        defaultBackgroundColor: HMIDark,

        // Als Gedankenstütze, die Hauptseite muß main heißen!
        //panelName: 'NSPanel', //unique name for the panel


        // Seiteneinteilung / Page division
        // Hauptseiten / Mainpages
        pages: [
            irgendeinName,
            grid1,
            qrCode,
        ],
        // Unterseiten / Subpages
        subPages: [
            fahrplan
        ],

        /***********************************************************************
         **                                                                   **
         **                    Screensaver Configuration                      **
         **                                                                   **
         ***********************************************************************/
        indicatorScreensaverEntity: [
            // indicatorScreensaverEntity 1 (only Advanced Screensaver)
            {
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Status_offene_Fenster.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'window-open-variant',
                ScreensaverEntityIconOff: 'window-closed-variant',
                ScreensaverEntityText: 'Fenster',
                ScreensaverEntityUnitText: '%',
                ScreensaverEntityIconColor: {val_min: 0, val_max: 1},
            },
            // indicatorScreensaverEntity 2 (only Advanced Screensaver)
            {
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Status_offene_Tuer.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'door-open',
                ScreensaverEntityIconOff: 'door-closed',
                ScreensaverEntityText: 'Tür',
                ScreensaverEntityUnitText: '',
                ScreensaverEntityIconColor: {val_min: 0, val_max: 1},
            },
            // indicatorScreensaverEntity 3 (only Advanced Screensaver)
            {
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Status_Licht_An.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'lightbulb',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Licht',
                ScreensaverEntityUnitText: '',
                ScreensaverEntityIconColor: {val_min: 0, val_max: 1},
            },
            // indicatorScreensaverEntity 4 (only Advanced Screensaver)
            {
                ScreensaverEntity: 'alias.0.Türschloss.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'lock',
                ScreensaverEntityIconOff: 'lock-open',
                ScreensaverEntityText: 'Türschloss',
                ScreensaverEntityUnitText: '',
                ScreensaverEntityIconColor: {val_min: 0, val_max: 1, val_best: 1},
            },
            // indicatorScreensaverEntity 5 (only Advanced Screensaver)
            {
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Auto.Safety.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'car-key',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Auto',
                ScreensaverEntityUnitText: '',
                ScreensaverEntityIconColor: {val_min: 0, val_max: 1, val_best: 1},
            },
        ],

        bottomScreensaverEntity: [
            // bottomScreensaverEntity 1
            {
                ScreensaverEntity: 'accuweather.0.Daily.Day1.Sunrise',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityDateFormat: {hour: '2-digit', minute: '2-digit'}, // Description at Wiki-Pages
                ScreensaverEntityIconOn: 'weather-sunset-up',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Sonne',
                ScreensaverEntityUnitText: '%',
                ScreensaverEntityIconColor: MSYellow //{'val_min': 0, 'val_max': 100}
            },
            // bottomScreensaverEntity 2
            {
                ScreensaverEntity: 'accuweather.0.Current.WindSpeed',
                ScreensaverEntityFactor: (1000 / 3600),
                ScreensaverEntityDecimalPlaces: 1,
                ScreensaverEntityIconOn: 'weather-windy',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: "Wind",
                ScreensaverEntityUnitText: 'm/s',
                ScreensaverEntityIconColor: {'val_min': 0, 'val_max': 120}
            },
            // bottomScreensaverEntity 3
            {
                ScreensaverEntity: 'accuweather.0.Current.WindGust',
                ScreensaverEntityFactor: (1000 / 3600),
                ScreensaverEntityDecimalPlaces: 1,
                ScreensaverEntityIconOn: 'weather-tornado',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Böen',
                ScreensaverEntityUnitText: 'm/s',
                ScreensaverEntityIconColor: {'val_min': 0, 'val_max': 120}
            },
            // bottomScreensaverEntity 4
            {
                ScreensaverEntity: 'accuweather.0.Current.WindDirectionText',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'windsock',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Windr.',
                ScreensaverEntityUnitText: '°',
                ScreensaverEntityIconColor: White
            },
            // bottomScreensaverEntity 5 (for Alternative and Advanced Screensaver)
            {
                ScreensaverEntity: 'accuweather.0.Current.RelativeHumidity',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 1,
                ScreensaverEntityIconOn: 'water-percent',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Feuchte',
                ScreensaverEntityUnitText: '%',
                ScreensaverEntityIconColor: {'val_min': 0, 'val_max': 100, 'val_best': 65}
            },
            // bottomScreensaverEntity 6 (for Advanced Screensaver)
            {
                ScreensaverEntity: 'Relay.1',
                ScreensaverEntityIconOn: 'coach-lamp-variant',
                ScreensaverEntityText: 'Street',
                ScreensaverEntityOnColor: Yellow,
                ScreensaverEntityOffColor: White,
                ScreensaverEntityOnText: 'Is ON',
                ScreensaverEntityOffText: 'Not ON'
            },
            // Examples for Advanced-Screensaver: https://github.com/joBr99/nspanel-lovelace-ui/wiki/ioBroker-Config-Screensaver#entity-status-icons-ab-v400 
        ],

        leftScreensaverEntity: [
            // leftScreensaverEntity 1 (only Advanced Screensaver)
            {
                ScreensaverEntity: 'alias.0.NSPanel.Flur.Sensor.ANALOG.Temperature.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 1,
                ScreensaverEntityIconOn: 'thermometer',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Temperatur',
                ScreensaverEntityUnitText: '°C',
                ScreensaverEntityIconColor: {val_min: 0, val_max: 35, val_best: 22},
            },
            // leftScreensaverEntity 2 (only Advanced Screensaver)
            {
                ScreensaverEntity: 'alias.0.Heizung.WärmeTagesVerbrauch.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 1,
                ScreensaverEntityIconOn: 'counter',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Wärme',
                ScreensaverEntityUnitText: ' kWh',
                ScreensaverEntityIconColor: MSYellow, //{'val_min': 0, 'val_max': 5000}
            },
            // leftScreensaverEntity 3 (only Advanced Screensaver)
            {
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Abfall.event1.INFO',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityDateFormat: {year: 'numeric', month: '2-digit', day: '2-digit'},
                ScreensaverEntityIconOn: 'trash-can',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Abfall',
                ScreensaverEntityUnitText: '',
                ScreensaverEntityIconColor: '0_userdata.0.Abfallkalender.1.color',
            },
        ],

        // Status Icon 
        mrIcon1ScreensaverEntity: {
            ScreensaverEntity: 'Relay.1',
            ScreensaverEntityIconOn: 'lightbulb',
            ScreensaverEntityIconOff: null,
            ScreensaverEntityValue: null,
            ScreensaverEntityValueDecimalPlace: 0,
            ScreensaverEntityValueUnit: null,
            ScreensaverEntityOnColor: On,
            ScreensaverEntityOffColor: HMIOff
        },
        mrIcon2ScreensaverEntity: {
            ScreensaverEntity: 'Relay.2',
            ScreensaverEntityIconOn: 'lightbulb',
            ScreensaverEntityIconOff: null,
            ScreensaverEntityValue: null,
            ScreensaverEntityValueDecimalPlace: 0,
            ScreensaverEntityValueUnit: null,
            ScreensaverEntityOnColor: On,
            ScreensaverEntityOffColor: HMIOff
        },
        // ------ DE: Ende der Screensaver Einstellungen --------------------
        // ------ EN: End of screensaver settings ---------------------------

        //-------DE: Anfang Einstellungen für Hardware Button, wenn Sie softwareseitig genutzt werden (Rule2) -------------
        //-------EN: Start Settings for Hardware Button, if used in software (Rule2) --------------------------------------
        // DE: Konfiguration des linken Schalters des NSPanels
        // EN: Configuration of the left switch of the NSPanel
        button1: {
            // DE: Mögliche Werte wenn Rule2 definiert: 'page', 'toggle', 'set' - Wenn nicht definiert --> mode: null
            // EN: Possible values if Rule2 defined: 'page', 'toggle', 'set' - If not defined --> mode: null
            mode: null,
            // DE: Zielpage - Verwendet wenn mode = page
            // EN: Target page - Used if mode = page
            page: null,
            // DE: Zielentity - Verwendet wenn mode = set oder toggle
            // EN: Target entity - Used if mode = set or toggle
            entity: null,
            // DE: Zielwert - Verwendet wenn mode = set
            // EN: Target value - Used if mode = set
            setValue: null
        },

        // DE: Konfiguration des rechten Schalters des NSPanels
        // EN: Configuration of the right switch of the NSPanel
        button2: {
            mode: null,
            page: null,
            entity: null,
            setValue: null
        },

        //--------- DE: Ende - Einstellungen für Hardware Button, wenn Sie softwareseitig genutzt werden (Rule2) -------------
        //--------- EN: End - settings for hardware button if they are used in software (Rule2) ------------------------------

        // DE: WICHTIG !! Parameter nicht ändern  WICHTIG!!
        // EN: IMPORTANT !! Do not change parameters IMPORTANT!!

    };


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

const version = '0.2.4';
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
    } & Omit<PageBaseType, 'useColor' | 'heading' | 'items'>;

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
        weatherAddDefaultItems?: boolean;
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