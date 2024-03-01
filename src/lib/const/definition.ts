import { Off, On, HMIDark } from './Color';
import { NSpanelModel, PanelInfo, ScreenSaverPlaces, ScreensaverModeType } from '../types/types';

/*type ChangeTypeToChannelAndState<Obj> = Obj extends object
    ? {
          [K in keyof Obj]-?: ChangeTypeToChannelAndState<Obj[K]>;
      } & customChannelType
    : ioBroker.StateObject;
export type ChangeToChannel<Obj, T> = Obj extends object
    ? { [K in keyof Obj]-?: customChannelType & T }
    : ioBroker.StateObject;
*/
export type ChangeTypeOfKeysForState<Obj, N> = Obj extends object
    ? customChannelType & { [K in keyof Obj]: ChangeTypeOfKeysForState<Obj[K], N> }
    : N;
export type customChannelType = {
    _channel: ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.FolderObject;
};

export const defaultChannel: ioBroker.ChannelObject = {
    _id: '',
    type: 'channel',
    common: {
        name: 'Hey no description... ',
    },
    native: {},
};

export const genericStateObjects: {
    default: ioBroker.StateObject;
    customString: ioBroker.StateObject;
    panel: customChannelType & {
        panels: customChannelType & {
            cmd: customChannelType & {
                power1: ioBroker.StateObject;
                power2: ioBroker.StateObject;
                screensaverTimeout: ioBroker.StateObject;
                dimActive: ioBroker.StateObject;
                dimStandby: ioBroker.StateObject;
                goToNavigationPoint: ioBroker.StateObject;
            };
            info: customChannelType & {
                status: ioBroker.StateObject;
            } & ChangeTypeOfKeysForState<Required<PanelInfo>, ioBroker.StateObject>;
            alarm: customChannelType & {
                cardAlarm: customChannelType & {
                    status: ioBroker.StateObject;
                    trigger: ioBroker.StateObject;
                    arm: ioBroker.StateObject;
                };
            };
        };
    };
} = {
    default: {
        _id: 'No_definition',
        type: 'state',
        common: {
            name: 'StateObjects.state',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    panel: {
        _channel: {
            _id: '',
            type: 'folder',
            common: {
                name: 'StateObjects.panel',
            },
            native: {},
        },
        panels: {
            _channel: {
                _id: '',
                type: 'device',
                common: {
                    name: 'StateObjects.panels',
                },
                native: {},
            },
            cmd: {
                _channel: {
                    _id: '',
                    type: 'channel',
                    common: {
                        name: 'StateObjects.cmd',
                    },
                    native: {},
                },
                goToNavigationPoint: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.navigateToPage',
                        type: 'string',
                        role: 'value.text',
                        read: true,
                        write: true,
                        states: {},
                    },
                    native: {},
                },
                power1: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.power1',
                        type: 'boolean',
                        role: 'switch',
                        read: true,
                        write: true,
                    },
                    native: {},
                },
                power2: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.power2',
                        type: 'boolean',
                        role: 'switch',
                        read: true,
                        write: true,
                    },
                    native: {},
                },
                screensaverTimeout: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.screensaverTimeout',
                        type: 'number',
                        role: 'value',
                        unit: 's',
                        read: true,
                        write: true,
                    },
                    native: {},
                },
                dimStandby: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.dimStandby',
                        type: 'number',
                        role: 'value',
                        unit: '%',
                        read: true,
                        write: true,
                    },
                    native: {},
                },
                dimActive: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.dimActive',
                        type: 'number',
                        role: 'value',
                        unit: '%',
                        read: true,
                        write: true,
                    },
                    native: {},
                },
            },
            info: {
                _channel: {
                    _id: '',
                    type: 'channel',
                    common: {
                        name: 'StateObjects.info',
                    },
                    native: {},
                },
                status: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'StateObjects.status',
                        type: 'string',
                        role: 'json',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                nspanel: {
                    _channel: {
                        _id: '',
                        type: 'channel',
                        common: {
                            name: 'StateObjects.nspanel',
                        },
                        native: {},
                    },
                    currentPage: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.currentPage',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    displayVersion: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.displayVersion',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    model: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.model',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    bigIconLeft: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.bigIconLeft',
                            type: 'boolean',
                            role: 'indicator',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    bigIconRight: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.bigIconRight',
                            type: 'boolean',
                            role: 'indicator',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    isOnline: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.isOnline',
                            type: 'boolean',
                            role: 'indicator.reachable',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                },
                tasmota: {
                    _channel: {
                        _id: '',
                        type: 'channel',
                        common: {
                            name: 'Tasmota',
                        },
                        native: {},
                    },

                    uptime: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.uptime',
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    wifi: {
                        _channel: {
                            _id: '',
                            type: 'channel',
                            common: {
                                name: 'StateObjects.wifi',
                            },
                            native: {},
                        },
                        ssid: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'StateObjects.ssid',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        rssi: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'StateObjects.rssi',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        downtime: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'StateObjects.downtime',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                    },
                    net: {
                        _channel: {
                            _id: '',
                            type: 'channel',
                            common: {
                                name: 'StateObjects.net',
                            },
                            native: {},
                        },
                        ip: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'StateObjects.ip',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        gateway: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'StateObjects.gateway',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        dnsserver: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'StateObjects.dnsserver',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        subnetmask: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'StateObjects.subnetmask',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        hostname: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'StateObjects.hostname',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                        mac: {
                            _id: '',
                            type: 'state',
                            common: {
                                name: 'StateObjects.mac',
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                    },
                },
            },
            alarm: {
                _channel: {
                    _id: '',
                    type: 'channel',
                    common: {
                        name: 'StateObjects.alarm',
                    },
                    native: {},
                },
                cardAlarm: {
                    _channel: {
                        _id: '',
                        type: 'channel',
                        common: {
                            name: 'StateObjects.cardAlarm',
                        },
                        native: {},
                    },
                    status: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.power2',
                            type: 'number',
                            role: 'value',
                            states: ['disarmed', 'armed', 'arming', 'pending', 'triggered'],
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    trigger: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.power2',
                            type: 'boolean',
                            role: 'button',
                            read: false,
                            write: true,
                        },
                        native: {},
                    },
                    arm: {
                        _id: '',
                        type: 'state',
                        common: {
                            name: 'StateObjects.power2',
                            type: 'boolean',
                            role: 'button',
                            read: false,
                            write: true,
                        },
                        native: {},
                    },
                },
            },
        },
    },

    customString: {
        _id: 'User_State',
        type: 'state',
        common: {
            name: 'StateObjects.customString',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
};

export const Defaults = {
    state: {
        _id: 'No_definition',
        type: 'state',
        common: {
            name: 'No definition',

            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
};

/******************************* Begin CONFIG Parameter *******************************/

// DE: liefert bei true detailliertere Meldundgen im Log.
// EN: if true, provides more detailed messages in the log.
export const Debug: boolean = false;

/***** 1. Tasmota-Config *****/

// DE: Anpassen an die Verzeichnisse der MQTT-Adapter-Instanz
// EN: Adapt to the MQTT adapter instance directories
export const NSPanelReceiveTopic: string = 'mqtt.0.SmartHome.NSPanel_1.tele.RESULT';
export const NSPanelSendTopic: string = 'mqtt.0.SmartHome.NSPanel_1.cmnd.CustomSend';

// DE: nur ändern, falls der User im Tasmota vor dem Kompilieren umbenannt wurde (Standard Tasmota: admin)
// EN: only change if the user was renamed in Tasmota before compiling (default Tasmota: admin)
export const tasmota_web_admin_user: string = 'admin';

// DE: setzten, falls "Web Admin Password" in Tasmota vergeben
// EN set if "Web Admin Password" is assigned in Tasmota
export const tasmota_web_admin_password: string = '';

// DE: Setzen der bevorzugten Tasmota32-Version (für Updates)
// EN: Set preferred Tasmota32 version (for updates)
export const tasmotaOtaVersion: string = 'tasmota32-DE.bin';
// DE: Es können ebenfalls andere Versionen verwendet werden wie zum Beispiel:
// EN: Other versions can also be used, such as:
// 'tasmota32-nspanel.bin' or 'tasmota32.bin' or 'tasmota32-DE.bin' or etc.

/***** 2. Directories in 0_userdata.0... *****/

// DE: Anpassen an das jeweilige NSPanel
// EN: Adapt to the respective NSPanel
export const NSPanel_Path = '0_userdata.0.NSPanel.1.';

// DE: Pfad für gemeinsame Nutzung durch mehrere Panels (bei Nutzung der cardAlarm/cardUnlock)
// EN: Path for sharing between multiple panels (when using cardAlarm/cardUnlock)
export const NSPanel_Alarm_Path = '0_userdata.0.NSPanel.';

/***** 3. Weather adapter Config *****/

// DE: Mögliche Wetteradapter 'accuweather.0.' oder 'daswetter.0.'
// EN: Possible weather adapters 'accuweather.0.' or 'the weather.0.'
export const weatherAdapterInstance: string = 'accuweather.0.';

// DE: Mögliche Werte: 'Min', 'Max' oder 'MinMax' im Screensaver
// EN: Possible values: 'Min', 'Max' or 'MinMax' in the screensaver
export const weatherScreensaverTempMinMax: string = 'MinMax';

// DE: Dieser Alias wird automatisch für den gewählten Wetter erstellt und kann entsprechend angepasst werden
// EN: This alias is automatically created for the selected weather and can be adjusted accordingly
export const weatherEntityPath: string = 'alias.0.Wetter';

/***** 4. Color constants for use in the PageItems *****/

// DE: Bei Bedarf können weitere Farben definiert werden
// EN: If necessary, additional colors can be defined

/***** 5. Script - Parameters *****/

// DE: Für diese Option muss der Haken in setObjects in deiner javascript.X. Instanz gesetzt sein.
// EN: This option requires the check mark in setObjects in your javascript.X. instance must be set.
export const autoCreateAlias = true;

// DE: Verzeichnis für Auto-Aliase (wird per Default aus dem NSPanel-Verzeichnis gebildet und muss nicht verändert werden)
// EN: Directory for auto aliases (is created by default from the NSPanel directory and does not need to be changed)
export const AliasPath: string = 'alias.0.' + NSPanel_Path.substring(13, NSPanel_Path.length);

// DE: Default-Farbe für Off-Zustände
// EN: Default color for off states
export const defaultOffColorParam: any = Off;

// DE: Default-Farbe für On-Zustände
// EN: Default color for on states
export const defaultOnColorParam: any = On;

export const defaultColorParam: any = Off;

// DE: Default-Hintergrundfarbe HMIDark oder Black
// EN: Default background color HMIDark or Black
export const defaultBackgroundColorParam: any = HMIDark;

/******************************** End CONFIG Parameter ********************************/

//-- Anfang für eigene Seiten -- z.T. selbstdefinierte Aliase erforderlich ----------------
//-- Start for your own pages -- some self-defined aliases required ----------------

//-- https://github.com/joBr99/nspanel-lovelace-ui/wiki/NSPanel-Page-%E2%80%90-Typen_How-2_Beispiele

//-- ENDE für eigene Seiten -- z.T. selbstdefinierte Aliase erforderlich -------------------------
//-- END for your own pages -- some self-defined aliases required ------------------------

/***********************************************************************************************
 **  Service Pages mit Auto-Alias (Nachfolgende Seiten werden mit Alias automatisch angelegt) **
 **  https://github.com/joBr99/nspanel-lovelace-ui/wiki/NSPanel-Service-Men%C3%BC             **
 ***********************************************************************************************/

/* DE: German
       Wenn das Service Menü abgesichert werden soll, kann eine cardUnlock vorgeschaltet werden.
       Für diesen Fall ist folgende Vorgehensweise erforderlich:
       - cardUnlock Seite "Unlock_Service" in der Config unter pages auskommentieren ("//" entfernen)
       - Servicemenü aus pages "NSPanel_Service" unter pages kommentieren ("//" hinzufügen)
    */

/*************************************************************************************************
 ** Service pages with auto alias (subsequent pages are automatically created with alias)      **
 ** https://github.com/joBr99/nspanel-lovelace-ui/wiki/NSPanel-Service-Men%C3%BC               **
 ************************************************************************************************/

/* EN: English
        If the service menu needs to be secured, a cardUnlock can be installed upstream.
        In this case, the following procedure is required:
        - comment out cardUnlock page "Unlock_Service" in the config under pages (remove "//")
        - Comment service menu from pages "NSPanel_Service" under pages (add "//")
    */
export const scriptVersion: string = 'v4.3.3.33';
export const tft_version: string = 'v4.3.3';
export const desired_display_firmware_version = 53;
export const berry_driver_version = 9;

export const tasmotaOtaUrl: string = 'http://ota.tasmota.com/tasmota32/release/';

export const ScreenSaverConst: Record<
    ScreensaverModeType,
    Record<ScreenSaverPlaces, { maxEntries: Record<NSpanelModel, number> }>
> = {
    standard: {
        left: {
            maxEntries: { eu: 0 },
        },
        bottom: {
            maxEntries: { eu: 4 },
        },
        alternate: {
            maxEntries: { eu: 0 },
        },
        indicator: {
            maxEntries: { eu: 0 },
        },
        mricon: {
            maxEntries: { eu: 2 },
        },
        favorit: {
            maxEntries: { eu: 1 },
        },
        time: {
            maxEntries: { eu: 1 },
        },
        date: {
            maxEntries: { eu: 1 },
        },
    },
    alternate: {
        left: {
            maxEntries: { eu: 0 },
        },
        bottom: {
            maxEntries: { eu: 3 },
        },
        alternate: {
            maxEntries: { eu: 1 },
        },
        indicator: {
            maxEntries: { eu: 0 },
        },
        mricon: {
            maxEntries: { eu: 2 },
        },
        favorit: {
            maxEntries: { eu: 1 },
        },
        time: {
            maxEntries: { eu: 1 },
        },
        date: {
            maxEntries: { eu: 1 },
        },
    },
    advanced: {
        left: {
            maxEntries: { eu: 3 },
        },
        bottom: {
            maxEntries: { eu: 6 },
        },
        alternate: {
            maxEntries: { eu: 0 },
        },
        indicator: {
            maxEntries: { eu: 5 },
        },
        mricon: {
            maxEntries: { eu: 2 },
        },
        favorit: {
            maxEntries: { eu: 1 },
        },
        time: {
            maxEntries: { eu: 1 },
        },
        date: {
            maxEntries: { eu: 1 },
        },
    },
};

/*export const PageTypeDefinition: Record<PageTypeCards, { maxEntries: number }> = {
    cardAlarm: {
        maxEntries: { eu: 1 },
    },
    cardChart: {
        maxEntries: { eu: 1 },
    },
    cardEntities: {
        maxEntries: { eu: 5 },
    },
    cardGrid: {
        maxEntries: { eu: 6 },
    },
    cardGrid2: {
        maxEntries: { eu: 8 },
    },
    cardLChart: {
        maxEntries: { eu: 1 },
    },
    cardMedia: {
        maxEntries: { eu: 1 },
    },
    cardPower: {
        maxEntries: { eu: 1 },
    },
    cardQR: {
        maxEntries: { eu: 1 },
    },
    cardThermo: {
        maxEntries: { eu: 1 },
    },
    cardUnlock: {
        maxEntries: { eu: 1 },
    },
};*/

export const ReiveTopicAppendix = '/tele/RESULT';
export const SendTopicAppendix = '/cmnd/CustomSend';
