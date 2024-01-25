import { Off, On, HMIDark } from './color';
import { PageTypeCards, ScreensaverModeType, ScreensaverOptionsType } from '../types/types';

/*type ChangeTypeToChannelAndState<Obj> = Obj extends object
    ? {
          [K in keyof Obj]-?: ChangeTypeToChannelAndState<Obj[K]>;
      } & customChannelType
    : ioBroker.StateObject;
export type ChangeToChannel<Obj, T> = Obj extends object
    ? { [K in keyof Obj]-?: customChannelType & T }
    : ioBroker.StateObject;
*/
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
    'mrIconEntity',
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

export const PageTypeDefinition: Record<PageTypeCards, { maxEntries: number }> = {
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

export const ReiveTopicAppendix = '/tele/RESULT';
export const SendTopicAppendix = '/cmnd/CustomSend';
