import { Off, On, HMIDark, Menu, MSRed, MSGreen, HMIOff, HMIOn, White, Yellow } from './color';
import { Config, PageEntities, PageType, PagetypeType, ScreensaverModeType, ScreensaverOptionsType } from './types';

type ChangeTypeToChannelAndState<Obj> = Obj extends object
    ? {
          [K in keyof Obj]-?: ChangeTypeToChannelAndState<Obj[K]>;
      } & customChannelType
    : ioBroker.StateObject;
export type ChangeToChannel<Obj, T> = Obj extends object
    ? { [K in keyof Obj]-?: customChannelType & T }
    : ioBroker.StateObject;

export type ChangeTypeOfKeys<Obj, N> = Obj extends object ? { [K in keyof Obj]-?: ChangeTypeOfKeys<Obj[K], N> } : N;

export type customChannelType = {
    _channel: ioBroker.ChannelObject | ioBroker.DeviceObject;
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
    devices: ioBroker.FolderObject;
    rooms: ioBroker.FolderObject;
    settings: ioBroker.FolderObject;
    global: ioBroker.FolderObject;
    presense: ioBroker.StateObject;
    deviceDB: ioBroker.StateObject;
} = {
    default: {
        _id: 'No_definition',
        type: 'state',
        common: {
            name: 'genericStateObjects.state',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    deviceDB: {
        _id: '',
        type: 'state',
        common: {
            name: 'genericStateObjects.deviceDB',
            type: 'string',
            role: 'json',
            read: true,
            write: false,
        },
        native: {},
    },
    presense: {
        _id: '',
        type: 'state',
        common: {
            name: 'genericStateObjects.presense',
            type: 'boolean',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    customString: {
        _id: 'User_State',
        type: 'state',
        common: {
            name: 'genericStateObjects.customString',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    devices: {
        _id: '',
        type: 'folder',
        common: {
            name: 'devices.folder',
        },
        native: {},
    },
    rooms: {
        _id: '',
        type: 'folder',
        common: {
            name: 'rooms.folder',
        },
        native: {},
    },
    settings: {
        _id: '',
        type: 'folder',
        common: {
            name: 'settings.folder',
        },
        native: {},
    },
    global: {
        _id: '',
        type: 'folder',
        common: {
            name: 'settings.global',
        },
        native: {},
    },
};

export type statesObjectsType = {
    state: ioBroker.StateObject;
    rooms: customChannelType | ChangeTypeToChannelAndState<room>;
    devices: customChannelType | ChangeTypeToChannelAndState<device>;
    settings: customChannelType & { config: customChannelType | ChangeTypeToChannelAndState<settings> };
};

export const statesObjects: statesObjectsType = {
    state: {
        _id: 'No_definition',
        type: 'state',
        common: {
            name: 'genericStateObjects.state',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    rooms: {
        _channel: {
            _id: '',
            type: 'device',
            common: {
                name: 'room.channel',
            },
            native: {},
        },
        restart: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.restart',
                type: 'boolean',
                role: 'button',
                read: false,
                write: true,
            },
            native: {},
        },
        known_irks: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.known_irks',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        known_macs: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.known_macs',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        query: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.query',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        exclude: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.exclude',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
            },
            native: {},
        },
        status: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.status',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
            },
            native: {},
        },
        max_distance: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.distance',
                type: 'number',
                role: 'value',
                unit: 'm',
                read: true,
                write: true,
            },
            native: {},
        },
        absorption: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.absorption',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
            },
            native: {},
        },
        tx_ref_rssi: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.tx_ref_rssi',
                type: 'number',
                role: 'value',
                unit: 'db',
                read: true,
                write: false,
            },
            native: {},
        },
        rx_adj_rssi: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.rx_adj_rssi',
                type: 'number',
                role: 'value',
                unit: 'db',
                read: true,
                write: false,
            },
            native: {},
        },
        include: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.include',
                type: 'string',
                role: 'text',
                read: true,
                write: true,
            },
            native: {},
        },
        count_ids: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.count_ids',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        arduino_ota: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.arduino_ota',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
            native: {
                convert: 'val ? "ON" : "OFF"',
            },
        },
        auto_update: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.auto_update',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
            native: {
                convert: 'val ? "ON" : "OFF"',
            },
        },
        prerelease: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.prerelease',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
            },
            native: {
                convert: 'val ? "ON" : "OFF"',
            },
        },
        motion: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.motion',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: false,
            },
            native: {},
        },
        switch: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.switch',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: false,
            },
            native: {},
        },
        button: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.button',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: false,
            },
            native: {},
        },
        pir_timeout: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.pri_timeout',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        radar_timeout: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.radar_timeout',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        switch_1_timeout: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.switch_1_timeout',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        switch_2_timeout: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.switch_2_timeout',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        button_1: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.button_1',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: false,
            },
            native: {},
        },
        button_1_timeout: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.button_1_timeout',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        button_2_timeout: {
            _id: '',
            type: 'state',
            common: {
                name: 'room.button_2_timeout',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        led_1: {
            _channel: {
                _id: '',
                type: 'channel',
                common: {
                    name: 'room.led_1.channel',
                },
                native: {},
            },
            state: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.led_1.state',
                    type: 'boolean',
                    role: 'indicator',
                    read: true,
                    write: false,
                },
                native: {},
            },
            brightness: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.led_1.brightness',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            color: {
                _channel: {
                    _id: '',
                    type: 'channel',
                    common: {
                        name: 'room.led_1.color.channel',
                    },
                    native: {},
                },
                r: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'red',
                        type: 'number',
                        role: 'value',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                g: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'green',
                        type: 'number',
                        role: 'value',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                b: {
                    _id: '',
                    type: 'state',
                    common: {
                        name: 'blue',
                        type: 'number',
                        role: 'value',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
            },
        },
        telemetry: {
            _channel: {
                _id: '',
                type: 'channel',
                common: {
                    name: 'room.telemetry.channel',
                },
                native: {},
            },
            ip: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.ip',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
            uptime: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.uptime',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            firm: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.firm',
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
                    name: 'room.telemetry.rssi',
                    type: 'number',
                    role: 'value',
                    unit: 'db',
                    read: true,
                    write: false,
                },
                native: {},
            },
            ver: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.ver',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
            count: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.count',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            adverts: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.adverts',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            seen: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.seen',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            reported: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.reported',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            freeHeap: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.freeheap',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            maxHeap: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.maxHeap',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            scanStack: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.scanStack',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            loopStack: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.loopStack',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            bleStack: {
                _id: '',
                type: 'state',
                common: {
                    name: 'room.telemetry.bleStack',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
        },
    },
    devices: {
        _channel: {
            _id: '',
            type: 'device',
            common: {
                name: 'devices.channel',
            },
            native: {},
        },
        mac: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.mac',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        id: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.id',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        name: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.name',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        disc: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.disc',
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        },
        idType: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.idType',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        'rssi@1m': {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.rssi@1m',
                type: 'number',
                role: 'value',
                unit: 'db',
                read: true,
                write: false,
            },
            native: {},
        },
        rssi: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.rssi',
                type: 'number',
                role: 'value',
                unit: 'db',
                read: true,
                write: false,
            },
            native: {},
        },
        raw: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.raw',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        distance: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.distance',
                type: 'number',
                role: 'value',
                unit: 'm',
                read: true,
                write: false,
            },
            native: {},
        },
        int: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.int',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        },
        close: {
            _id: '',
            type: 'state',
            common: {
                name: 'devices.close',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: false,
            },
            native: {},
        },
    },
    settings: {
        _channel: {
            _id: '',
            type: 'channel',
            common: {
                name: 'settings.channel',
            },
            native: {},
        },
        config: {
            _channel: {
                _id: '',
                type: 'channel',
                common: {
                    name: 'settings.config.channel',
                },
                native: {},
            },
            id: {
                _id: '',
                type: 'state',
                common: {
                    name: 'settings.config.id',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
            name: {
                _id: '',
                type: 'state',
                common: {
                    name: 'devices.name',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
        },
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

//Level 0 (if service pages are used with cardUnlock)
export const Unlock_Service: PageType = {
    type: 'cardUnlock',
    heading: findLocaleServMenu('service_pages'),
    useColor: true,
    items: [
        /*PageItem*/ {
            id: 'alias.0.NSPanel.Unlock',
            targetPage: 'NSPanel_Service_SubPage',
            autoCreateALias: true,
        },
    ],
};

//Level_0 (if service pages are used without cardUnlock)
export const NSPanel_Service: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('service_menu'),
    useColor: true,
    items: [
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_Infos',
            icon: 'information-outline',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('infos'),
            buttonText: findLocaleServMenu('more'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_Einstellungen',
            icon: 'monitor-edit',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('settings'),
            buttonText: findLocaleServMenu('more'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_Firmware',
            icon: 'update',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('firmware'),
            buttonText: findLocaleServMenu('more'),
        },
        /*PageItem*/ {
            id: AliasPath + 'Config.rebootNSPanel',
            name: findLocaleServMenu('reboot'),
            icon: 'refresh',
            offColor: MSRed,
            onColor: MSGreen,
            buttonText: findLocaleServMenu('start'),
        },
    ],
};

//Level_0 (if service pages are used with cardUnlock)
export const NSPanel_Service_SubPage: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('service_menu'),
    useColor: true,
    subPage: true,
    parent: Unlock_Service,
    home: 'Unlock_Service',
    items: [
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_Infos',
            icon: 'information-outline',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('infos'),
            buttonText: findLocaleServMenu('more'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_Einstellungen',
            icon: 'monitor-edit',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('settings'),
            buttonText: findLocaleServMenu('more'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_Firmware',
            icon: 'update',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('firmware'),
            buttonText: findLocaleServMenu('more'),
        },
        /*PageItem*/ {
            id: AliasPath + 'Config.rebootNSPanel',
            name: findLocaleServMenu('reboot'),
            icon: 'refresh',
            offColor: MSRed,
            onColor: MSGreen,
            buttonText: findLocaleServMenu('start'),
        },
    ],
};

//Level_1
export const NSPanel_Infos: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('nspanel_infos'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Service,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_Wifi_Info_1',
            icon: 'wifi',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('wifi'),
            buttonText: findLocaleServMenu('more'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_Sensoren',
            icon: 'memory',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('sensors_hardware'),
            buttonText: findLocaleServMenu('more'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_IoBroker',
            icon: 'information-outline',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('info_iobroker'),
            buttonText: findLocaleServMenu('more'),
        },
        /*PageItem*/ {
            id: AliasPath + 'Config.Update.UpdateMessage',
            name: findLocaleServMenu('update_message'),
            icon: 'message-alert-outline',
            offColor: HMIOff,
            onColor: MSGreen,
        },
    ],
};
//Level_2
export const NSPanel_Wifi_Info_1: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('nspanel_wifi1'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Infos,
    next: 'NSPanel_Wifi_Info_2',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'ipAddress',
            name: findLocaleServMenu('ip_address'),
            icon: 'ip-network-outline',
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Tasmota.Wifi.BSSId',
            name: findLocaleServMenu('mac_address'),
            icon: 'check-network',
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Tasmota.Wifi.RSSI',
            name: findLocaleServMenu('rssi'),
            icon: 'signal',
            unit: '%',
            colorScale: { val_min: 100, val_max: 0 },
        },
        /*PageItem*/ {
            id: AliasPath + 'Tasmota.Wifi.Signal',
            name: findLocaleServMenu('wifi_signal'),
            icon: 'signal-distance-variant',
            unit: 'dBm',
            colorScale: { val_min: 0, val_max: -100 },
        },
    ],
};

export const NSPanel_Wifi_Info_2: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('nspanel_wifi2'),
    useColor: true,
    subPage: true,
    prev: 'NSPanel_Wifi_Info_1',
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'Tasmota.Wifi.SSId',
            name: findLocaleServMenu('ssid'),
            icon: 'signal-distance-variant',
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Tasmota.Wifi.Mode',
            name: findLocaleServMenu('mode'),
            icon: 'signal-distance-variant',
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Tasmota.Wifi.Channel',
            name: findLocaleServMenu('channel'),
            icon: 'timeline-clock-outline',
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Tasmota.Wifi.AP',
            name: findLocaleServMenu('accesspoint'),
            icon: 'router-wireless-settings',
            offColor: Menu,
            onColor: Menu,
        },
    ],
};

export const NSPanel_Sensoren: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('sensors1'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Infos,
    next: 'NSPanel_Hardware',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'Sensor.ANALOG.Temperature',
            name: findLocaleServMenu('room_temperature'),
            icon: 'home-thermometer-outline',
            unit: '°C',
            colorScale: { val_min: 0, val_max: 40, val_best: 22 },
        },
        /*PageItem*/ {
            id: AliasPath + 'Sensor.ESP32.Temperature',
            name: findLocaleServMenu('esp_temperature'),
            icon: 'thermometer',
            unit: '°C',
            colorScale: { val_min: 0, val_max: 100, val_best: 50 },
        },
        /*PageItem*/ {
            id: AliasPath + 'Sensor.TempUnit',
            name: findLocaleServMenu('temperature_unit'),
            icon: 'temperature-celsius',
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Sensor.Time',
            name: findLocaleServMenu('refresh'),
            icon: 'clock-check-outline',
            offColor: Menu,
            onColor: Menu,
        },
    ],
};

export const NSPanel_Hardware: PageEntities = {
    type: 'cardEntities',
    heading: findLocaleServMenu('hardware2'),
    useColor: true,
    subPage: true,
    prev: 'NSPanel_Sensoren',
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'Tasmota.Product',
            name: findLocaleServMenu('product'),
            icon: 'devices',
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Tasmota.Hardware',
            name: findLocaleServMenu('esp32_hardware'),
            icon: 'memory',
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Display.Model',
            name: findLocaleServMenu('nspanel_version'),
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Tasmota.Uptime',
            name: findLocaleServMenu('operating_time'),
            icon: 'timeline-clock-outline',
            offColor: Menu,
            onColor: Menu,
        },
    ],
};

export const NSPanel_IoBroker: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('info_iobroker'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Infos,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'IoBroker.ScriptVersion',
            name: findLocaleServMenu('script_version_nspanelts'),
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'IoBroker.NodeJSVersion',
            name: findLocaleServMenu('nodejs_version'),
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'IoBroker.JavaScriptVersion',
            name: findLocaleServMenu('instance_javascript'),
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'IoBroker.ScriptName',
            name: findLocaleServMenu('scriptname'),
            offColor: Menu,
            onColor: Menu,
        },
    ],
};

//Level_1
export const NSPanel_Einstellungen: PageType = {
    type: 'cardGrid',
    heading: findLocaleServMenu('settings'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Service,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_Screensaver',
            icon: 'monitor-dashboard',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('screensaver'),
            buttonText: findLocaleServMenu('more'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_Relays',
            icon: 'electric-switch',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('relays'),
            buttonText: findLocaleServMenu('more'),
        },
        /*PageItem*/ {
            id: AliasPath + 'Config.temperatureUnitNumber',
            icon: 'gesture-double-tap',
            name: findLocaleServMenu('temp_unit'),
            offColor: Menu,
            onColor: Menu,
            modeList: ['°C', '°F', 'K'],
        },
        /*PageItem*/ {
            id: AliasPath + 'Config.localeNumber',
            icon: 'select-place',
            name: findLocaleServMenu('language'),
            offColor: Menu,
            onColor: Menu,
            modeList: [
                'en-US',
                'de-DE',
                'nl-NL',
                'da-DK',
                'es-ES',
                'fr-FR',
                'it-IT',
                'ru-RU',
                'nb-NO',
                'nn-NO',
                'pl-PL',
                'pt-PT',
                'af-ZA',
                'ar-SY',
                'bg-BG',
                'ca-ES',
                'cs-CZ',
                'el-GR',
                'et-EE',
                'fa-IR',
                'fi-FI',
                'he-IL',
                'hr-xx',
                'hu-HU',
                'hy-AM',
                'id-ID',
                'is-IS',
                'lb-xx',
                'lt-LT',
                'ro-RO',
                'sk-SK',
                'sl-SI',
                'sv-SE',
                'th-TH',
                'tr-TR',
                'uk-UA',
                'vi-VN',
                'zh-CN',
                'zh-TW',
            ],
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_Script',
            icon: 'code-json',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('script'),
            buttonText: findLocaleServMenu('more'),
        },
    ],
};

//Level_2
export const NSPanel_Screensaver: PageType = {
    type: 'cardGrid',
    heading: findLocaleServMenu('screensaver'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Einstellungen,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_ScreensaverDimmode',
            icon: 'sun-clock',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('dimmode'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_ScreensaverBrightness',
            icon: 'brightness-5',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('brightness'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_ScreensaverLayout',
            icon: 'page-next-outline',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('layout'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_ScreensaverWeather',
            icon: 'weather-partly-rainy',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('weather'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_ScreensaverDateformat',
            icon: 'calendar-expand-horizontal',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('date_format'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_ScreensaverIndicators',
            icon: 'monitor-edit',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('indicators'),
        },
    ],
};

//Level_3
export const NSPanel_ScreensaverDimmode: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('dimmode'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Screensaver,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'Dimmode.brightnessDay',
            name: findLocaleServMenu('brightness_day'),
            icon: 'brightness-5',
            offColor: Menu,
            onColor: Menu,
            minValue: 5,
            maxValue: 10,
        },
        /*PageItem*/ {
            id: AliasPath + 'Dimmode.brightnessNight',
            name: findLocaleServMenu('brightness_night'),
            icon: 'brightness-4',
            offColor: Menu,
            onColor: Menu,
            minValue: 0,
            maxValue: 4,
        },
        /*PageItem*/ {
            id: AliasPath + 'Dimmode.hourDay',
            name: findLocaleServMenu('hour_day'),
            icon: 'sun-clock',
            offColor: Menu,
            onColor: Menu,
            minValue: 0,
            maxValue: 23,
        },
        /*PageItem*/ {
            id: AliasPath + 'Dimmode.hourNight',
            name: findLocaleServMenu('hour_night'),
            icon: 'sun-clock-outline',
            offColor: Menu,
            onColor: Menu,
            minValue: 0,
            maxValue: 23,
        },
    ],
};

//Level_3
export const NSPanel_ScreensaverBrightness: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('brightness'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Screensaver,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'ScreensaverInfo.activeBrightness',
            name: findLocaleServMenu('brightness_activ'),
            icon: 'brightness-5',
            offColor: Menu,
            onColor: Menu,
            minValue: 20,
            maxValue: 100,
        },
        /*PageItem*/ {
            id: AliasPath + 'Config.Screensaver.timeoutScreensaver',
            name: findLocaleServMenu('screensaver_timeout'),
            icon: 'clock-end',
            offColor: Menu,
            onColor: Menu,
            minValue: 0,
            maxValue: 60,
        },
        /*PageItem*/ {
            id: AliasPath + 'Config.Screensaver.screenSaverDoubleClick',
            name: findLocaleServMenu('wakeup_doublecklick'),
            icon: 'gesture-two-double-tap',
            offColor: HMIOff,
            onColor: HMIOn,
        },
    ],
};

//Level_3
export const NSPanel_ScreensaverLayout: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('layout'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Screensaver,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'Config.Screensaver.alternativeScreensaverLayout',
            name: findLocaleServMenu('alternative_layout'),
            icon: 'page-previous-outline',
            offColor: HMIOff,
            onColor: HMIOn,
        },
        /*PageItem*/ {
            id: AliasPath + 'Config.Screensaver.ScreensaverAdvanced',
            name: findLocaleServMenu('advanced_layout'),
            icon: 'page-next-outline',
            offColor: HMIOff,
            onColor: HMIOn,
        },
    ],
};

//Level_3
export const NSPanel_ScreensaverWeather: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('weather_parameters'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Screensaver,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'ScreensaverInfo.weatherForecast',
            name: findLocaleServMenu('weather_forecast_offon'),
            icon: 'weather-sunny-off',
            offColor: HMIOff,
            onColor: HMIOn,
        },
        /*PageItem*/ {
            id: AliasPath + 'ScreensaverInfo.weatherForecastTimer',
            name: findLocaleServMenu('weather_forecast_change_switch'),
            icon: 'devices',
            offColor: HMIOff,
            onColor: HMIOn,
        },
        /*PageItem*/ {
            id: AliasPath + 'ScreensaverInfo.entityChangeTime',
            name: findLocaleServMenu('weather_forecast_change_time'),
            icon: 'cog-sync',
            offColor: Menu,
            onColor: Menu,
            minValue: 15,
            maxValue: 60,
        },
        /*PageItem*/ {
            id: AliasPath + 'Config.Screensaver.autoWeatherColorScreensaverLayout',
            name: findLocaleServMenu('weather_forecast_icon_colors'),
            icon: 'format-color-fill',
            offColor: HMIOff,
            onColor: HMIOn,
        },
    ],
};

//Level_3
export const NSPanel_ScreensaverDateformat: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('date_format'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Screensaver,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'Config.Dateformat.Switch.weekday',
            name: findLocaleServMenu('weekday_large'),
            icon: 'calendar-expand-horizontal',
            offColor: HMIOff,
            onColor: HMIOn,
        },
        /*PageItem*/ {
            id: AliasPath + 'Config.Dateformat.Switch.month',
            name: findLocaleServMenu('month_large'),
            icon: 'calendar-expand-horizontal',
            offColor: HMIOff,
            onColor: HMIOn,
        },
    ],
};

//Level_3
export const NSPanel_ScreensaverIndicators: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('indicators'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Screensaver,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'Config.MRIcons.alternateMRIconSize.1',
            name: findLocaleServMenu('mr_icon1_size'),
            icon: 'format-size',
            offColor: HMIOff,
            onColor: HMIOn,
        },
        /*PageItem*/ {
            id: AliasPath + 'Config.MRIcons.alternateMRIconSize.2',
            name: findLocaleServMenu('mr_icon2_size'),
            icon: 'format-size',
            offColor: HMIOff,
            onColor: HMIOn,
        },
    ],
};

//Level_2
export const NSPanel_Relays: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('relays'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Einstellungen,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'Relay.1',
            name: findLocaleServMenu('relay1_onoff'),
            icon: 'power',
            offColor: HMIOff,
            onColor: HMIOn,
        },
        /*PageItem*/ {
            id: AliasPath + 'Relay.2',
            name: findLocaleServMenu('relay2_onoff'),
            icon: 'power',
            offColor: HMIOff,
            onColor: HMIOn,
        },
    ],
};

//Level_2
export const NSPanel_Script: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('script'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Einstellungen,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'Config.ScripgtDebugStatus',
            name: findLocaleServMenu('debugmode_offon'),
            icon: 'code-tags-check',
            offColor: HMIOff,
            onColor: HMIOn,
        },
        /*PageItem*/ {
            id: AliasPath + 'Config.MQTT.portCheck',
            name: findLocaleServMenu('port_check_offon'),
            icon: 'check-network',
            offColor: HMIOff,
            onColor: HMIOn,
        },
    ],
};

//Level_1
export const NSPanel_Firmware: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('firmware'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Service,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'autoUpdate',
            name: findLocaleServMenu('automatically_updates'),
            icon: 'power',
            offColor: HMIOff,
            onColor: HMIOn,
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_FirmwareTasmota',
            icon: 'usb-flash-drive',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('tasmota_firmware'),
            buttonText: findLocaleServMenu('more'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_FirmwareBerry',
            icon: 'usb-flash-drive',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('berry_driver'),
            buttonText: findLocaleServMenu('more'),
        },
        /*PageItem*/ {
            navigate: true,
            id: 'NSPanel_FirmwareNextion',
            icon: 'cellphone-cog',
            offColor: Menu,
            onColor: Menu,
            name: findLocaleServMenu('nextion_tft_firmware'),
            buttonText: findLocaleServMenu('more'),
        },
    ],
};

export const NSPanel_FirmwareTasmota: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('tasmota'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Firmware,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'Tasmota.Version',
            name: findLocaleServMenu('installed_release'),
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Tasmota_Firmware.onlineVersion',
            name: findLocaleServMenu('available_release'),
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ { id: 'Divider' },
        /*PageItem*/ {
            id: AliasPath + 'Config.Update.UpdateTasmota',
            name: findLocaleServMenu('update_tasmota'),
            icon: 'refresh',
            offColor: HMIOff,
            onColor: MSGreen,
            buttonText: findLocaleServMenu('start'),
        },
    ],
};

export const NSPanel_FirmwareBerry: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('berry_driver'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Firmware,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'Display.BerryDriver',
            name: findLocaleServMenu('installed_release'),
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Berry_Driver.onlineVersion',
            name: findLocaleServMenu('available_release'),
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ { id: 'Divider' },
        /*PageItem*/ {
            id: AliasPath + 'Config.Update.UpdateBerry',
            name: findLocaleServMenu('update_berry_driver'),
            icon: 'refresh',
            offColor: HMIOff,
            onColor: MSGreen,
            buttonText: findLocaleServMenu('start'),
        },
    ],
};

export const NSPanel_FirmwareNextion: PageType = {
    type: 'cardEntities',
    heading: findLocaleServMenu('nextion_tft'),
    useColor: true,
    subPage: true,
    parent: NSPanel_Firmware,
    home: 'NSPanel_Service',
    items: [
        /*PageItem*/ {
            id: AliasPath + 'Display_Firmware.TFT.currentVersion',
            name: findLocaleServMenu('installed_release'),
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Display_Firmware.TFT.desiredVersion',
            name: findLocaleServMenu('desired_release'),
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Display.Model',
            name: findLocaleServMenu('nspanel_model'),
            offColor: Menu,
            onColor: Menu,
        },
        /*PageItem*/ {
            id: AliasPath + 'Config.Update.UpdateNextion',
            name: 'Nextion TFT Update',
            icon: 'refresh',
            offColor: HMIOff,
            onColor: MSGreen,
            buttonText: findLocaleServMenu('start'),
        },
    ],
};

// End of Service Pages

/***********************************************************************
 **                                                                   **
 **                           Configuration                           **
 **                                                                   **
 ***********************************************************************/

export const config: Config = {
    // Seiteneinteilung / Page division
    // Hauptseiten / Mainpages
    pages: [
        NSPanel_Service, //Auto-Alias Service Page
        //Unlock_Service            //Auto-Alias Service Page (Service Pages used with cardUnlock)
    ],
    // Unterseiten / Subpages
    subPages: [
        NSPanel_Service_SubPage, //Auto-Alias Service Page (only used with cardUnlock)
        NSPanel_Infos, //Auto-Alias Service Page
        NSPanel_Wifi_Info_1, //Auto-Alias Service Page
        NSPanel_Wifi_Info_2, //Auto-Alias Service Page
        NSPanel_Sensoren, //Auto-Alias Service Page
        NSPanel_Hardware, //Auto-Alias Service Page
        NSPanel_IoBroker, //Auot-Alias Service Page
        NSPanel_Einstellungen, //Auto-Alias Service Page
        NSPanel_Screensaver, //Auto-Alias Service Page
        NSPanel_ScreensaverDimmode, //Auto-Alias Service Page
        NSPanel_ScreensaverBrightness, //Auto-Alias Service Page
        NSPanel_ScreensaverLayout, //Auto-Alias Service Page
        NSPanel_ScreensaverWeather, //Auto-Alias Service Page
        NSPanel_ScreensaverDateformat, //Auto-Alias Service Page
        NSPanel_ScreensaverIndicators, //Auto-Alias Service Page
        NSPanel_Relays, //Auto-Alias Service Page
        NSPanel_Script, //Auto-Alias Service Page
        NSPanel_Firmware, //Auto-Alias Service Page
        NSPanel_FirmwareTasmota, //Auto-Alias Service Page
        NSPanel_FirmwareBerry, //Auto-Alias Service Page
        NSPanel_FirmwareNextion, //Auto-Alias Service Page
    ],

    /***********************************************************************
     **                                                                   **
     **                    Screensaver Configuration                      **
     **                                                                   **
     ***********************************************************************/
    leftScreensaverEntity: [
        // Examples for Advanced-Screensaver: https://github.com/joBr99/nspanel-lovelace-ui/wiki/ioBroker-Config-Screensaver#entity-status-icons-ab-v400
    ],

    bottomScreensaverEntity: [
        // bottomScreensaverEntity 1
        {
            ScreensaverEntity: 'accuweather.0.Daily.Day1.Sunrise',
            ScreensaverEntityFactor: 1,
            ScreensaverEntityDecimalPlaces: 0,
            ScreensaverEntityDateFormat: { hour: '2-digit', minute: '2-digit' }, // Description at Wiki-Pages
            ScreensaverEntityIconOn: 'weather-sunset-up',
            ScreensaverEntityIconOff: null,
            ScreensaverEntityText: 'Sonne',
            ScreensaverEntityUnitText: '%',
            ScreensaverEntityIconColor: MSYellow, //{'val_min': 0, 'val_max': 100}
        },
        // bottomScreensaverEntity 2
        {
            ScreensaverEntity: 'accuweather.0.Current.WindSpeed',
            ScreensaverEntityFactor: 1000 / 3600,
            ScreensaverEntityDecimalPlaces: 1,
            ScreensaverEntityIconOn: 'weather-windy',
            ScreensaverEntityIconOff: null,
            ScreensaverEntityText: 'Wind',
            ScreensaverEntityUnitText: 'm/s',
            ScreensaverEntityIconColor: { val_min: 0, val_max: 120 },
        },
        // bottomScreensaverEntity 3
        {
            ScreensaverEntity: 'accuweather.0.Current.WindGust',
            ScreensaverEntityFactor: 1000 / 3600,
            ScreensaverEntityDecimalPlaces: 1,
            ScreensaverEntityIconOn: 'weather-tornado',
            ScreensaverEntityIconOff: null,
            ScreensaverEntityText: 'Böen',
            ScreensaverEntityUnitText: 'm/s',
            ScreensaverEntityIconColor: { val_min: 0, val_max: 120 },
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
            ScreensaverEntityIconColor: White,
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
            ScreensaverEntityIconColor: { val_min: 0, val_max: 100, val_best: 65 },
        },
        // bottomScreensaverEntity 6 (for Advanced Screensaver)
        {
            ScreensaverEntity: NSPanel_Path + 'Relay.1',
            ScreensaverEntityIconOn: 'coach-lamp-variant',
            ScreensaverEntityText: 'Street',
            ScreensaverEntityOnColor: Yellow,
            ScreensaverEntityOffColor: White,
            ScreensaverEntityOnText: 'Is ON',
            ScreensaverEntityOffText: 'Not ON',
        },
        // Examples for Advanced-Screensaver: https://github.com/joBr99/nspanel-lovelace-ui/wiki/ioBroker-Config-Screensaver#entity-status-icons-ab-v400
    ],

    indicatorScreensaverEntity: [
        // Examples for Advanced-Screensaver: https://github.com/joBr99/nspanel-lovelace-ui/wiki/ioBroker-Config-Screensaver#entity-status-icons-ab-v400
    ],

    // Status Icon
    mrIcon1ScreensaverEntity: {
        ScreensaverEntity: NSPanel_Path + 'Relay.1',
        ScreensaverEntityIconOn: 'lightbulb',
        ScreensaverEntityIconOff: null,
        ScreensaverEntityValue: null,
        ScreensaverEntityValueDecimalPlace: 0,
        ScreensaverEntityValueUnit: null,
        ScreensaverEntityOnColor: On,
        ScreensaverEntityOffColor: HMIOff,
    },
    mrIcon2ScreensaverEntity: {
        ScreensaverEntity: NSPanel_Path + 'Relay.2',
        ScreensaverEntityIconOn: 'lightbulb',
        ScreensaverEntityIconOff: null,
        ScreensaverEntityValue: null,
        ScreensaverEntityValueDecimalPlace: 0,
        ScreensaverEntityValueUnit: null,
        ScreensaverEntityOnColor: On,
        ScreensaverEntityOffColor: HMIOff,
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
        setValue: null,
    },

    // DE: Konfiguration des rechten Schalters des NSPanels
    // EN: Configuration of the right switch of the NSPanel
    button2: {
        mode: null,
        page: null,
        entity: null,
        setValue: null,
    },
    //--------- DE: Ende - Einstellungen für Hardware Button, wenn Sie softwareseitig genutzt werden (Rule2) -------------
    //--------- EN: End - settings for hardware button if they are used in software (Rule2) ------------------------------
    // DE: WICHTIG !! Parameter nicht ändern  WICHTIG!!
    // EN: IMPORTANT !! Do not change parameters IMPORTANT!!
    panelRecvTopic: NSPanelReceiveTopic,
    panelSendTopic: NSPanelSendTopic,
    weatherEntity: weatherEntityPath,
    defaultOffColor: defaultOffColorParam,
    defaultOnColor: defaultOnColorParam,
    defaultColor: defaultColorParam,
    defaultBackgroundColor: defaultBackgroundColorParam,
};

// _________________________________ DE: Ab hier keine Konfiguration mehr _____________________________________
// _________________________________ EN:  No more configuration from here _____________________________________

export const scriptVersion: string = 'v4.3.3.33';
export const tft_version: string = 'v4.3.3';
export const desired_display_firmware_version = 53;
export const berry_driver_version = 9;

export const tasmotaOtaUrl: string = 'http://ota.tasmota.com/tasmota32/release/';

export const ScreenSaverPlaces: [
    keyof Pick<ScreensaverOptionsType, 'favoritEntity'>,
    keyof Pick<ScreensaverOptionsType, 'leftEntity'>,
    keyof Pick<ScreensaverOptionsType, 'bottomEntity'>,
    keyof Pick<ScreensaverOptionsType, 'indicatorEntity'>,
] = ['favoritEntity', 'leftEntity', 'bottomEntity', 'indicatorEntity'];

export const ScreenSaverAllPlaces: (keyof ScreensaverOptionsType)[] = [
    'favoritEntity',
    'leftEntity',
    'bottomEntity',
    'indicatorEntity',
    //'mrIconEntity',
];

export const ScreenSaverConst: Record<
    ScreensaverModeType,
    Record<keyof ScreensaverOptionsType, { maxEntries: number }>
> = {
    standard: {
        leftEntity: {
            maxEntries: 0,
        },
        bottomEntity: {
            maxEntries: 4,
        },
        indicatorEntity: {
            maxEntries: 0,
        },
        mrIconEntity: {
            maxEntries: 2,
        },
        favoritEntity: {
            maxEntries: 1,
        },
    },
    alternate: {
        leftEntity: {
            maxEntries: 0,
        },
        bottomEntity: {
            maxEntries: 5,
        },
        indicatorEntity: {
            maxEntries: 0,
        },
        mrIconEntity: {
            maxEntries: 2,
        },
        favoritEntity: {
            maxEntries: 1,
        },
    },
    advanced: {
        leftEntity: {
            maxEntries: 3,
        },
        bottomEntity: {
            maxEntries: 7,
        },
        indicatorEntity: {
            maxEntries: 5,
        },
        mrIconEntity: {
            maxEntries: 2,
        },
        favoritEntity: {
            maxEntries: 1,
        },
    },
};

export const PageTypeDefinition: Record<PagetypeType, cardDefinitionType> = {
    cardAlarm: {
        maxEntries: 1,
    },
    cardChart: {
        maxEntries: 1,
    },
    cardEntities: {
        maxEntries: 5,
    },
    cardGrid: {
        maxEntries: 6,
    },
    cardGrid2: {
        maxEntries: 8,
    },
    cardLChart: {
        maxEntries: 1,
    },
    cardMedia: {
        maxEntries: 1,
    },
    cardPower: {
        maxEntries: 1,
    },
    cardQR: {
        maxEntries: 1,
    },
    cardThermo: {
        maxEntries: 1,
    },
    cardUnlock: {
        maxEntries: 1,
    },
};

export function MSYellow(MSYellow: any) {
    throw new Error('Function not implemented.');
}
