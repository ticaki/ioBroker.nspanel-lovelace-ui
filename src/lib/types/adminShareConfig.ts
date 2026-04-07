// Zentrale Definition aller verfügbaren Card-Typen
export type AdminCardTypes =
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
    | 'cardItemSpecial'; // Special card to manage pageItems (not selectable in admin UI)

// Typ für pageInfo bei PageMenuConfig (siehe Panel)
export interface PageMenuConfigInfo {
    card: AdminCardTypes;
    alwaysOn?: string;
    scrollPresentation?: string;
    scrollType?: string;
    scrollAutoTiming?: number;
    pageItemCount?: number;
}

export const ALL_PANELS_SPECIAL_ID = '///ALL_PANELS_SPECIAL';

// Zentrale Kommandos für Navigation-API
export const SENDTO_GET_PANEL_NAVIGATION_COMMAND = 'getPanelNavigation';
export const SAVE_PANEL_NAVIGATION_COMMAND = 'savePanelNavigation';
// SendTo command to request the list of available panels from the adapter
export const SENDTO_GET_PANELS_COMMAND = 'getPanels';
// SendTo command to request the list of pages for a given panel
export const SENDTO_GET_PAGES_COMMAND = 'getPagesForPanel';
export const SENDTO_GET_PAGES_All_COMMAND = 'getAllPages';
// Central adapter name constant for admin <-> adapter sendTo calls
export const ADAPTER_NAME = 'nspanel-lovelace-ui';
// Expected response when asking the adapter for panels
export type PanelInfo = {
    /** Unique panel identifier (corresponds to `id` in the adapter config) */
    id?: string;
    friendlyName: string;
    panelTopic: string;
};

/** Panel configuration entry as stored in the adapter native data (`panels` array). */
export type AdminPanelConfig = {
    id?: string;
    ip?: string;
    name?: string;
    topic?: string;
    model?: string;
};

export type PanelsResponse = PanelInfo[];
export interface NavigationSavePayload {
    panelName: string;
    pages: NavigationPositionsMap[];
}
export type NavigationPositionsMap = { name: string; position: { x: number; y: number } };
// Gemeinsame Typen für Navigation (Panel + Admin UI)

export interface NavigationMapEntry {
    page: string;
    next?: string;
    prev?: string;
    home?: string;
    parent?: string;
    targetPages?: string[];
    label?: string;
    position?: { x: number; y: number } | null;
    pageInfo?: PageMenuConfigInfo;
}

export type NavigationMap = NavigationMapEntry[];

export interface PanelListEntry {
    panelName: string;
    friendlyName: string;
    navigationMap: NavigationMap;
}

// Shared types for admin UI (typo: file name uses 'Shard')
export interface PageConfigBaseFields {
    hidden?: boolean;
    alwaysOn?: 'none' | 'always' | 'action' | 'ignore';
    navigationAssignment?: NavigationAssignmentList;
}

export type UnlockEntry = {
    card: Extract<AdminCardTypes, 'cardAlarm'>; // Supported card types - will be extended
    alarmType?: string; // e.g. 'alarm' | 'unlock' (only for cardAlarm)
    headline: string;
    button1: string;
    button2: string;
    button3: string;
    button4: string;
    button5: string;
    button6: string;
    button7: string;
    button8: string;
    pin: number;
    global?: boolean;
    approved?: boolean;
    setNavi?: string;
    uniqueName: string;
} & PageConfigBaseFields;

export type PageItemButtonEntry = {
    type: 'text' | 'button';
    headline?: string;
    modeScr?: 'left' | 'bottom' | 'indicator' | 'favorit' | 'alternate';
    data: any; // TODO: Should be NSPanel.PageItemButton but causes type resolution issues in admin
};

// Screensaver types
export type ScreensaverEntry = {
    card: Extract<AdminCardTypes, 'screensaver' | 'screensaver2' | 'screensaver3'>; // Use the card type from AdminCardTypes
    uniqueName: string;
    clockFormat?: '12h' | '24h';
    dateFormat?: string; // JavaScript date format string
    timeFormat?: string; // JavaScript time format string
    customDateFormat?: string; // Custom date format when dateFormat is 'custom'
    pageItems?: PageItemButtonEntry[];
    navigation?: NavigationAssignmentList;
    navigationAssignment?: NavigationAssignmentList;
};

export type ScreensaverEntries = ScreensaverEntry[];
// QR Entry for pageQR configuration
export type AdminPageItemConfig = {
    channelId: string;
    role?: string;
    name?: string;
    isNavigation?: boolean;
    targetPage?: string;
    trueIcon?: string;
    trueColor?: string;
    falseIcon?: string;
    falseColor?: string;
    /** Native-Modus: Item wird direkt als NSPanel.PageItemDataItemsOptions übergeben */
    useNative?: boolean;
    /** Rohe NSPanel.PageItemDataItemsOptions-Konfiguration (nur wenn useNative=true) */
    native?: any;
};

export type MenuEntry = {
    card: Extract<AdminCardTypes, 'cardGrid' | 'cardGrid2' | 'cardGrid3' | 'cardEntities' | 'cardSchedule'>; // Supported card types - will be extended
    headline: string;
    pageItems: (AdminPageItemConfig | undefined)[];
    scrollPresentation?: 'classic' | 'arrow';
    uniqueName: string;
} & PageConfigBaseFields;

export type QREntry = {
    card: Extract<AdminCardTypes, 'cardQR'>;
    selType?: number; // e.g. 0 = FREE, 1 = Wifi, 2 = URL, 3 = TEL
    headline: string;
    ssidUrlTel: string;
    wlanhidden: boolean;
    wlantype?: 'nopass' | 'WPA' | 'WPA2' | 'WPA3' | 'WEP';
    qrPass?: string;
    pwdhidden: boolean;
    setState: string;
    uniqueName: string;
} & PageConfigBaseFields;

export type TrashItem = {
    textTrash: string;
    customTrash: string;
    iconColor: string;
    icon: string;
};

export type TrashEntry = {
    card: 'cardTrash';
    uniqueName: string;
    headline: string;
    countItems: number; // Anzahl der anzuzeigenden Müllarten
    trashImport: boolean; // true = Import from iCal Adapter, false = Import from .ics file
    trashState: string; // Object ID Selector
    trashFile: string; // textfield for file name incl. path
    items: TrashItem[]; // Array statt 6 einzelne Felder pro Typ
} & PageConfigBaseFields;

// Rückgabewert-Typ für das Navigation Assignment Panel
export type NavigationAssignment = {
    topic: string;

    navigation?: {
        next?: string;
        prev?: string;
        home?: string;
        parent?: string;
    };
};

export type NavigationAssignmentList = NavigationAssignment[];
export type PageConfigEntry = QREntry | UnlockEntry | ScreensaverEntry | TrashEntry | MenuEntry;
export type PageConfig = QREntry | UnlockEntry | ScreensaverEntry | TrashEntry | MenuEntry;

export type PanelStatus =
    | 'offline'
    | 'initializing'
    | 'connecting'
    | 'connected'
    | 'online'
    | 'flashing'
    | 'error'
    | 'setup';

export const panelStatusStates: Record<number, PanelStatus> = {
    0: 'offline', // Panel ist offline, keine belegbare Verbindung zum Adapter
    1: 'initializing', // Panel Objekt initialisiert. Nur im Startup / Skriptübertragung
    2: 'connecting', // Panel baut mqtt-Verbindung auf. Nur im Startup / Skriptübertragung
    3: 'connected', // Panel hat mqtt-Verbindung aufgebaut, aber noch kein Online-Status. Nur im Startup / Skriptübertragung
    4: 'online', // Panel TFT hat sich gemeldet und ist online
    5: 'flashing', // Panel wird geflasht
    6: 'error', // Panel hat einen Fehler gemeldet (z.B. Verbindungsfehler, Fehler beim Flashen, etc.)
    7: 'setup', // Panel befindet sich im Einrichtungsmodus
};

export const panelStatusColors: Record<PanelStatus, string> = {
    offline: '#9E9E9E',
    initializing: '#9E9E9E',
    connecting: '#03A9F4',
    connected: '#2196F3',
    online: '#4CAF50',
    flashing: '#FFC107',
    setup: '#d99800',
    error: '#F44336',
};

export const panelStatusTranslationKeys: Record<PanelStatus, string> = {
    offline: 'Panel_status_offline',
    initializing: 'Panel_status_initializing',
    connecting: 'Panel_status_connecting',
    connected: 'Panel_status_connected',
    online: 'Panel_status_online',
    flashing: 'Panel_status_flashing',
    setup: 'Panel_status_setup',
    error: 'Panel_status_error',
};

export function reversePanelStatusStates(value: PanelStatus): number {
    const reversed: Record<PanelStatus, number> = {} as Record<PanelStatus, number>;
    for (const key in panelStatusStates) {
        if (Object.prototype.hasOwnProperty.call(panelStatusStates, key)) {
            const value = panelStatusStates[key];
            reversed[value] = parseInt(key, 10);
        }
    }
    return reversed[value];
}

export const requiredScriptDataPoints = {
    airCondition: {
        name: 'airCondition',
        description: 'Not everything for every card',
        data: {
            ACTUAL: {
                role: 'value.temperature',
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
            },
            SET: { role: 'level.temperature', type: 'number', useKey: true, required: true, writeable: true },
            SET2: { role: 'level.temperature', type: 'number', useKey: true, required: false, writeable: true },
            BOOST: {
                role: ['switch.mode.boost', 'switch.boost'],
                type: 'boolean',
                required: false,
                writeable: true,
                trigger: true,
            },
            ERROR: { role: 'indicator.error', type: 'boolean', required: false, writeable: false, trigger: true },
            HUMIDITY: { role: 'value.humidity', type: 'number', required: false, writeable: false, trigger: true },
            MAINTAIN: {
                role: 'indicator.maintenance',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
            },
            MODE: {
                role: 'value.mode.airconditioner',
                type: ['number', 'string'],
                required: false,
                writeable: false,
                trigger: true,
                description: `0: OFF, 1: AUTO, 2: COOL, 3: HEAT, 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.  (alternative type: 'string' for direct display) iif missed pick ModeSet -`,
            },
            MODESET: {
                role: 'level.mode.airconditioner',
                type: ['number'],
                required: false,
                writeable: true,
                trigger: true,
                description: `0: OFF, 1: COOL, 2: HEAT, 3: AUTO,//soweit eingebaut 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.`,
            },
            POWER: {
                role: 'switch',
                type: 'boolean',
                required: false,
                writeable: true,
                description: 'use MODE for on/off',
            },
            SPEED: { role: 'level.mode.fan', type: 'number', required: false, writeable: true, trigger: true },
            SWING: { role: 'level.mode.swing', type: 'number', required: false, writeable: true, trigger: true },
            SWING2: { role: 'switch.mode.swing', type: 'boolean', required: false, writeable: true, trigger: true },
            UNREACH: {
                role: 'indicator.maintenance.unreach',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                description: '',
            },
        },
    },
    blind: {
        updatedVersion: true,
        name: 'blind',
        description: '',
        data: {
            ACTUAL: {
                role: ['value.blind', 'level.blind'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            SET: { role: 'level.blind', type: 'number', required: true, writeable: true },
            CLOSE: { role: 'button.close.blind', type: 'boolean', required: true, writeable: true },
            OPEN: { role: 'button.open.blind', type: 'boolean', required: true, writeable: true },
            STOP: { role: 'button.stop.blind', type: 'boolean', required: true, writeable: true },
            TILT_ACTUAL: {
                role: ['level.tilt', 'value.tilt'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
            },
            TILT_SET: { role: 'level.tilt', type: 'number', required: false, writeable: true },
            TILT_CLOSE: { role: 'button.close.tilt', type: 'boolean', required: false, writeable: true },
            TILT_OPEN: { role: 'button.open.tilt', type: 'boolean', required: false, writeable: true },
            TILT_STOP: { role: 'button.stop.tilt', type: 'boolean', required: false, writeable: true },
        },
    },
    button: {
        updatedVersion: true,
        name: 'button',
        description: 'Switch',
        data: {
            SET: { role: 'button', type: 'boolean', required: true, writeable: true },
        },
    },
    ct: {
        updatedVersion: true,
        name: 'ct',
        description: 'für Lampen die das weiße Licht zwischen kalt und warm ändern können',
        data: {
            DIMMER: { role: 'level.dimmer', type: 'number', required: true, trigger: true, writeable: true },
            ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            ON_ACTUAL: {
                role: ['sensor.light', 'switch.light'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'ON',
            },
            TEMPERATURE: {
                role: 'level.color.temperature',
                type: 'number',
                required: true,
                writeable: true,
                trigger: true,
            },
        },
    },
    dimmer: {
        updatedVersion: true,
        name: 'dimmer',
        description: 'Licht ein- / ausschalten und dimmen',
        data: {
            SET: { role: 'level.dimmer', type: 'number', required: true, writeable: true },
            ACTUAL: {
                role: ['value.dimmer', 'level.dimmer'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            ON_SET: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            ON_ACTUAL: {
                role: ['sensor.light', 'switch.light'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'ON_SET',
            },
        },
    },
    door: {
        name: 'door',
        description: '',
        data: {
            ACTUAL: { role: 'sensor.door', type: 'boolean', required: true, writeable: false, trigger: true },
            BUTTONTEXT: { role: ['state', 'text'], type: 'string', required: false, writeable: false, trigger: true },
        },
    },
    gate: {
        name: 'gate',
        description: '',
        data: {
            ACTUAL: { role: 'value.blind', type: 'number', required: false, writeable: false, trigger: true },
            SET: { role: 'switch.gate', type: 'boolean', required: true, writeable: true, trigger: true },
            STOP: { role: 'button.stop', type: 'boolean', required: false, writeable: true, trigger: true },
        },
    },
    hue: {
        updatedVersion: true,
        name: 'hue',
        description: '',
        data: {
            DIMMER: { role: 'level.dimmer', type: 'number', required: true, trigger: true, writeable: true },
            ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            ON_ACTUAL: {
                role: ['sensor.light', 'switch.light'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'ON',
            },
            TEMPERATURE: {
                role: 'level.color.temperature',
                type: 'number',
                required: false,
                writeable: true,
                trigger: true,
            },
            HUE: { role: 'level.color.hue', type: 'number', required: true, writeable: true, trigger: true },
        },
    },
    humidity: {
        updatedVersion: true,
        name: 'humidity',
        description: '',
        data: { ACTUAL: { role: 'value.humidity', type: 'number', required: true, writeable: false, trigger: true } },
    },
    info: {
        updatedVersion: true,
        name: 'info',
        description: 'Universal Datenpunkt für diverse Anwendungen',
        data: {
            ACTUAL: {
                role: 'state',
                type: ['string', 'number', 'boolean', 'mixed'],
                required: true,
                writeable: false,
                useKey: true,
                trigger: true,
            },
            COLORDEC: {
                role: 'value.rgb',
                type: 'number',
                required: false,
                writeable: false,
                useKey: true,
                trigger: true,
            },
            BUTTONTEXT: {
                role: ['text'],
                type: 'string',
                required: false,
                writeable: false,
                useKey: true,
                trigger: true,
            },
            USERICON: { role: 'state', type: 'string', required: false, writeable: false, useKey: true, trigger: true },
        },
    },
    light: {
        updatedVersion: true,
        name: 'light',
        description: 'ein Lichtschalter',
        data: {
            ON_ACTUAL: {
                role: ['sensor.light', 'switch.light'],
                type: 'boolean',
                required: true,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            SET: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            BUTTONTEXT: { role: 'text', type: 'string', required: false, writeable: false, trigger: true },
        },
    },
    lock: {
        name: 'lock',
        description: 'Türschloss',
        data: {
            ACTUAL: {
                role: ['state'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            OPEN: { role: 'button', type: 'boolean', required: false, writeable: true },
            SET: { role: 'switch.lock', type: 'boolean', required: true, writeable: true },
        },
    },
    media: {
        updatedVersion: true,
        name: 'media',
        description: 'Medienwiedergabe (Play, Pause, Stop, Next, Previous)',
        data: {
            STATE: {
                role: 'media.state',
                type: 'boolean',
                required: true,
                writeable: false,
                trigger: true,
                description:
                    'True if playing, false if paused/stopped. If the media device supports more states, use read funtion to convert it to true/false.',
            },
        },
    },
    motion: {
        updatedVersion: true,
        name: 'motion',
        description: 'Status of the motion sensor or presence detector (motion or presence detected)',
        data: { ACTUAL: { role: 'sensor.motion', type: 'boolean', required: true, writeable: false, trigger: true } },
    },
    rgb: {
        updatedVersion: true,
        name: 'rgb',
        description: 'Farblicht mit einzelnen Farbkanälen',
        data: {
            RED: { role: 'level.color.red', type: 'number', required: true, writeable: true, trigger: true },
            GREEN: { role: 'level.color.green', type: 'number', required: true, writeable: true, trigger: true },
            BLUE: { role: 'level.color.blue', type: 'number', required: true, writeable: true, trigger: true },
            ON_ACTUAL: {
                role: ['sensor.light', 'switch.light'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
            },
            ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            DIMMER: { role: 'level.dimmer', type: 'number', required: false, writeable: true, trigger: true },
            TEMPERATURE: {
                role: 'level.color.temperature',
                type: 'number',
                required: false,
                writeable: true,
                trigger: true,
            },
        },
    },
    rgbSingle: {
        updatedVersion: true,
        name: 'rgbSingle',
        description: 'Farblicht ohne Farbkanäle',
        data: {
            RGB: { role: 'level.color.rgb', type: 'string', required: true, writeable: true, trigger: true },
            ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            DIMMER: { role: 'level.dimmer', type: 'number', required: false, writeable: true, trigger: true },
            TEMPERATURE: {
                role: 'level.color.temperature',
                type: 'number',
                required: false,
                writeable: true,
                trigger: true,
            },
            ON_ACTUAL: {
                role: ['sensor.light', 'switch.light'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'ON',
            },
        },
    },
    select: {
        updatedVersion: true,
        name: 'select',
        description: 'Auswahlbox',
        data: {
            ACTUAL: {
                role: ['value.mode.select'],
                type: ['number', 'string'],
                required: true,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            SET: {
                role: 'level.mode.select',
                type: ['number', 'string'],
                required: true,
                writeable: true,
                trigger: true,
            },
        },
    },
    slider: {
        updatedVersion: true,
        name: 'slider',
        description: 'Slider to set a numerical value',
        data: {
            SET: { role: 'level', type: 'number', required: true, writeable: true, useKey: true },
            ACTUAL: {
                role: ['value', 'level'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
                useKey: true,
            },
            SET2: { role: 'level', type: 'number', required: false, writeable: true, useKey: true },
            ACTUAL2: {
                role: ['value', 'level'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET2',
                useKey: true,
            },
            SET3: { role: 'level', type: 'number', required: false, writeable: true, useKey: true },
            ACTUAL3: {
                role: ['value', 'level'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET3',
                useKey: true,
            },
        },
    },
    socket: {
        updatedVersion: true,
        name: 'socket',
        description: 'Steckdosen, Schalter, Relais, usw. alles was man mit true/false steuern kann',
        data: {
            ACTUAL: {
                role: 'sensor.switch',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            SET: { role: 'switch', type: 'boolean', required: true, writeable: true },
            BUTTONTEXT: { role: ['state', 'text'], type: 'string', required: false, writeable: false, trigger: true },
        },
    },
    temperature: {
        updatedVersion: true,
        name: 'temperature',
        description: '',
        data: {
            ACTUAL: { role: 'value.temperature', type: 'number', required: true, writeable: false, trigger: true },
        },
    },
    thermostat: {
        name: 'thermostat',
        description: '',
        data: {
            ACTUAL: {
                role: 'value.temperature',
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            SET: { role: 'level.temperature', type: 'number', required: true, writeable: true },
            MODE: {
                role: 'value.mode.thermostat',
                type: ['number', 'string'],
                required: false,
                writeable: false,
                trigger: true,
                description: `0: OFF, 1: AUTO, 2: COOL, 3: HEAT, 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.  (alternative type: 'string' for direct display) iif missed pick ModeSet -`,
            },
            MODESET: {
                role: 'level.mode.thermostat',
                type: ['number'],
                required: false,
                writeable: true,
                trigger: true,
                description: `0: OFF, 1: COOL, 2: HEAT, 3: AUTO,//soweit eingebaut 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.`,
            },
            BOOST: {
                role: ['switch.mode.boost', 'switch.boost'],
                type: 'boolean',
                required: false,
                writeable: true,
                trigger: true,
            },
            ERROR: {
                role: 'indicator.error',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                description: 'Not supported in cardThermo2',
            },
            LOWBAT: {
                role: 'indicator.maintenance.lowbat',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                description: '',
            },
            UNREACH: {
                role: 'indicator.maintenance.unreach',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                description: '',
            },
            HUMIDITY: { role: 'value.humidity', type: 'number', required: false, writeable: false, trigger: true },
            MAINTAIN: {
                role: 'indicator.maintenance',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                description: 'Not supported in cardThermo2',
            },
            PARTY: {
                role: 'switch.mode.party',
                type: 'boolean',
                required: false,
                trigger: true,
                description: 'Not supported in cardThermo2',
            },
            POWER: { role: 'switch.power', type: 'boolean', required: false, writeable: true, trigger: true },
            VACATION: {
                role: 'state',
                type: 'boolean',
                useKey: true,
                required: false,
                trigger: true,
                description: 'Not supported in cardThermo2',
            },
            WINDOWOPEN: {
                role: ['sensor.window'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
            },
            WORKING: {
                role: 'indicator.working',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                description: 'Not supported in cardThermo2',
            },
            USERICON: {
                role: 'state',
                type: 'string',
                useKey: true,
                required: false,
                writeable: false,
                trigger: true,
                description: 'Not supported in cardThermo2',
            },
        },
    },
    timeTable: {
        updatedVersion: true,
        name: 'timeTable',
        description: 'Time table for the Departure (Fahrplan Adapter)',
        data: {
            noNeed: {
                role: 'state',
                type: 'string',
                required: false,
                description: 'Just use the template for this - ask TT-Tom :)',
            },
        },
    },
    volume: {
        updatedVersion: true,
        name: 'volume',
        description: '',
        data: {
            ACTUAL: {
                role: ['value.volume', 'level.volume'],
                type: 'number',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            SET: { role: 'level.volume', type: 'number', required: true, writeable: true },
            MUTE: { role: 'media.mute', type: 'boolean', required: false, writeable: true, trigger: true },
        },
    },
    warning: {
        name: 'warning',
        description: '',
        data: {
            INFO: { role: 'weather.title', type: 'string', required: true, writeable: false, trigger: true },
            LEVEL: { role: 'value.warning', type: 'number', required: true, writeable: false, trigger: true },
            TITLE: { role: 'weather.title.short', type: 'string', required: true, writeable: false, trigger: true },
        },
    },
    window: {
        updatedVersion: true,
        name: 'window',
        description: '',
        data: {
            ACTUAL: { role: 'sensor.window', type: 'boolean', required: true, writeable: false, trigger: true },
            BUTTONTEXT: { role: ['state', 'text'], type: 'string', required: false, writeable: false },
        },
    },
    'level.mode.fan': {
        name: 'fan',
        description: '',
        data: {
            ACTUAL: {
                role: ['sensor.switch', 'state'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            MODE: { role: 'level.mode.fan', type: 'number', required: false, writeable: true, trigger: true },
            SET: { role: 'switch', type: 'boolean', required: true, writeable: true },
            SPEED: { role: 'level.speed', type: 'number', required: true, writeable: true, trigger: true },
        },
    },
    'level.timer': {
        name: 'level.timer',
        description: 'Ein countdown Timer (intern/extern) oder eine Uhrzeit (extern)',
        data: {
            ACTUAL: {
                role: ['value.timer', 'level.timer', 'date'],
                type: 'number',
                required: false,
                trigger: true,
                writeable: false,
                description: 'Das wird angezeigt - date in hh:mm, timer in mm:ss',
            },
            SET: {
                role: ['level.timer', 'date'],
                type: 'number',
                required: false,
                writeable: true,
                description: 'Hier wird ein geänderter Wert hingeschrieben',
            },
            STATE: {
                role: 'button',
                type: 'boolean',
                required: false,
                writeable: true,
                description: 'wenn die oberen nicht benutzt wird hier getriggert wenn ein interner Timer endet.',
            },
            STATUS: {
                role: 'level.mode',
                type: 'number',
                required: false,
                trigger: true,
                writeable: true,
                description: '0: OFF , 1: PAUSE, 2: ON/RUNNING',
            },
        },
    },
    'sensor.alarm.flood': {
        name: 'sensor.alarm.flood',
        description: 'Sensor für Hochwasser',
        data: {
            ACTUAL: { role: 'sensor.alarm.flood', type: 'boolean', required: true, writeable: false, trigger: true },
        },
    },
    'value.humidity': {
        updatedVersion: true,
        name: 'humidity',
        description: '',
        data: { ACTUAL: { role: 'value.humidity', type: 'number', required: true, writeable: false, trigger: true } },
    },
    'value.temperature': {
        updatedVersion: true,
        name: 'value.temperature',
        description: '',
        data: {
            ACTUAL: { role: 'value.temperature', type: 'number', required: true, writeable: false, trigger: true },
        },
    },
} as const;

export const CHANNEL_ROLES_LIST = Object.keys(requiredScriptDataPoints) as (keyof typeof requiredScriptDataPoints)[];
export type ChannelRole = keyof typeof requiredScriptDataPoints;
