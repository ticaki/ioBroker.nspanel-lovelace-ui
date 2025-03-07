export const CustomTemplates: ConfigManager.CustomTemplate[] = [
    {
        device: 'shutter',
        states: [
            { 'button.open.blind': true },
            { 'button.close.blind': true },
            { 'button.open.tilt': true },
            { 'button.close.tilt': true },
            { 'button.stop.tilt': true },
            { 'button.stop.blind': true },
            { 'level.blind': true },
        ],
    },
];

/**
 * Wenn ein State angelegt wird muss gleich ein Namen für das der Device und das Device selbst angegeben werden.
 * Die Seite auf der das Device angezeigt wird, sollte in einem Pick oder wie das heißt angegeben werden,
 * Ich denke nicht das ich dort schon bekannte Seiten angeben kann, die anzeigbaren DAten im Custom sind
 * statisch und das pick hat kein sendto. Die Seiten müsste man jedoch nur einmal in einem State für ein Device angeben.
 * Also brauche ich an der stelle ein sendToSelect das manuelle eingaben erlaubt. mal testen
 */

export function isConfig(F: any): F is ScriptConfig.Config {
    if (F === undefined) {
        return false;
    }
    const requiredFields = [
        'panelTopic',
        'weatherEntity',
        'defaultColor',
        'defaultOnColor',
        'defaultOffColor',
        'defaultBackgroundColor',
        'pages',
        'subPages',
        'button1',
        'button2',
        'bottomScreensaverEntity',
    ];

    for (const field of requiredFields) {
        if (F[field] === undefined) {
            return false;
        }
    }
    return true;
}
export const defaultConfig: ScriptConfig.Config = {
    version: '0',
    panelTopic: '',
    weatherEntity: '',
    bottomScreensaverEntity: [],
    favoritScreensaverEntity: [],
    alternateScreensaverEntity: [],
    defaultOnColor: {
        red: 0,
        green: 0,
        blue: 0,
    },
    defaultOffColor: {
        red: 0,
        green: 0,
        blue: 0,
    },
    defaultBackgroundColor: {
        red: 0,
        green: 0,
        blue: 0,
    },
    pages: [],
    subPages: [],
    button1: {
        mode: null,
        page: null,
        entity: null,
        setValue: null,
        setOn: undefined,
        setOff: undefined,
    },
    button2: {
        mode: null,
        page: null,
        entity: null,
        setValue: null,
        setOn: undefined,
        setOff: undefined,
    },
    leftScreensaverEntity: [],
    indicatorScreensaverEntity: [],
    mrIcon1ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: null,
        ScreensaverEntityIconOn: null,
        ScreensaverEntityIconSelect: undefined,
        ScreensaverEntityIconOff: null,
        ScreensaverEntityValue: null,
        ScreensaverEntityValueDecimalPlace: null,
        ScreensaverEntityValueUnit: null,
        ScreensaverEntityOnColor: {
            red: 0,
            green: 0,
            blue: 0,
        },
        ScreensaverEntityOffColor: {
            red: 0,
            green: 0,
            blue: 0,
        },
    },
    mrIcon2ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: null,
        ScreensaverEntityIconOn: null,
        ScreensaverEntityIconSelect: undefined,
        ScreensaverEntityIconOff: null,
        ScreensaverEntityValue: null,
        ScreensaverEntityValueDecimalPlace: null,
        ScreensaverEntityValueUnit: null,
        ScreensaverEntityOnColor: {
            red: 0,
            green: 0,
            blue: 0,
        },
        ScreensaverEntityOffColor: {
            red: 0,
            green: 0,
            blue: 0,
        },
    },
};

type requiredDatapoints = {
    [key: string]: {
        data: {
            [key: string]: {
                role:
                    | (ScriptConfig.roles | ConfigManager.ioBrokerRoles)
                    | (ScriptConfig.roles | ConfigManager.ioBrokerRoles)[];
                required: boolean;
                type: ioBroker.StateCommon['type'];
                writeable?: boolean;
                description?: string;
            };
        };

        name: string;
        description: string;
    };
};

export const requiredScriptDataPoints: requiredDatapoints = {
    motion: {
        name: 'motion',
        description: 'Status of the motion sensor or presence detector (motion or presence detected)',
        data: { ACTUAL: { role: 'sensor.motion', type: 'boolean', required: true, writeable: false } },
    },
    //läuft im Script mit unter RGBsingle, muss nochmal geprüft werden ob sinnvoll
    /* cie: {
        name: 'cie',
        description: '',
        data: {
            CIE: { role: 'level.color.cie', type: 'string', required: true, writeable: true },
            DIMMER: { role: 'level.dimmer', type: 'boolean', required: true, writeable: true },
            ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            ON_ACTUAL: { role: 'sensor.light', type: 'boolean', required: true, writeable: false },
            TEMPERATURE: { role: 'level.color.temperature', type: 'number', required: true, writeable: true },
        },
    }, */
    dimmer: {
        name: 'dimmer',
        description: 'Licht ein- / ausschalten und dimmen',
        data: {
            SET: { role: 'level.dimmer', type: 'number', required: true, writeable: true },
            ACTUAL: { role: ['value.dimmer', 'level.dimmer'], type: 'number', required: false, writeable: false },
            ON_SET: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            ON_ACTUAL: { role: ['sensor.light', 'switch.light'], type: 'boolean', required: false, writeable: false },
        },
    },
    ct: {
        name: 'ct',
        description: 'für Lampen die das weiße Licht zwischen kalt und warm ändern können',
        data: {
            DIMMER: { role: 'level.dimmer', type: 'number', required: true, writeable: true },
            ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            ON_ACTUAL: { role: ['sensor.light', 'switch.light'], type: 'boolean', required: false, writeable: false },
            TEMPERATURE: { role: 'level.color.temperature', type: 'number', required: true, writeable: true },
        },
    },
    window: {
        name: 'window',
        description: '',
        data: {
            ACTUAL: { role: 'sensor.window', type: 'boolean', required: true, writeable: false },
            COLORDEC: { role: 'state', type: 'number', required: false, writeable: false }, //Farbcode über DP steuern
            BUTTONTEXT: { role: ['state', 'text'], type: 'string', required: false, writeable: false }, //Button-Text über DP steuern
        },
    },
    humidity: {
        name: 'humidity',
        description: '',
        data: { ACTUAL: { role: 'value.humidity', type: 'number', required: true, writeable: false } },
    },
    hue: {
        name: 'hue',
        description: '',
        data: {
            DIMMER: { role: 'level.dimmer', type: 'number', required: true, writeable: true },
            ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            ON_ACTUAL: { role: ['sensor.light', 'switch.light'], type: 'boolean', required: false, writeable: false },
            TEMPERATURE: { role: 'level.color.temperature', type: 'number', required: false, writeable: true },
            HUE: { role: 'level.color.hue', type: 'number', required: true, writeable: true },
            //SCENE: { role: 'state', type: 'number', required: false, writeable: true }, //für popupInSel
        },
    },
    info: {
        name: 'info',
        description: 'Universal Datenpunkt für diverse Anwendungen',
        data: {
            ACTUAL: { role: 'state', type: 'mixed', required: true, writeable: false },
            COLORDEC: { role: 'value.rgb', type: 'number', required: false, writeable: false }, //Farbcode über DP senden
            BUTTONTEXT: { role: ['text'], type: 'string', required: false, writeable: false }, //Button-Text über DP senden bei cardEntity
            USERICON: { role: 'state', type: 'string', required: false, writeable: false }, //Benutzerdefinierte Iconnamen über DP senden
        },
    },
    blind: {
        name: 'blind',
        description: '',
        data: {
            ACTUAL: { role: ['value.blind', 'level.blind'], type: 'number', required: false, writeable: false },
            SET: { role: 'level.blind', type: 'number', required: true, writeable: true },
            CLOSE: { role: 'button.close.blind', type: 'boolean', required: true, writeable: true },
            OPEN: { role: 'button.open.blind', type: 'boolean', required: true, writeable: true },
            STOP: { role: 'button.stop.blind', type: 'boolean', required: true, writeable: true },
            TILT_ACTUAL: { role: ['level.tilt', 'value.tilt'], type: 'number', required: false, writeable: false },
            TILT_SET: { role: 'level.tilt', type: 'number', required: false, writeable: true },
            TILT_CLOSE: { role: 'button.close.tilt', type: 'boolean', required: false, writeable: true },
            TILT_OPEN: { role: 'button.open.tilt', type: 'boolean', required: false, writeable: true },
            TILT_STOP: { role: 'button.stop.tilt', type: 'boolean', required: false, writeable: true },
        },
    },
    airCondition: {
        name: 'airCondition',
        description: '',
        data: {
            ACTUAL: {
                role: ['level.temperature', 'value.temperature'],
                type: 'number',
                required: false,
                writeable: false,
            },
            SET: { role: 'level.temperature', type: 'number', required: true, writeable: true },
            SET2: { role: 'level.temperature', type: 'number', required: false, writeable: true },
            AUTO: { role: 'state', type: 'boolean', required: false, writeable: false },
            COOL: { role: 'state', type: 'boolean', required: false, writeable: false },
            BOOST: { role: 'switch.mode.boost', type: 'boolean', required: false, writeable: true },
            ERROR: { role: 'indicator.error', type: 'boolean', required: false, writeable: false },
            HEAT: { role: 'state', type: 'boolean', required: false, writeable: false },
            HUMIDITY: { role: 'value.humidity', type: 'number', required: false, writeable: false },
            MAINTAIN: { role: 'indicator.maintenance', type: 'boolean', required: false, writeable: false },
            MODE: { role: 'level.mode.airconditioner', type: 'number', required: false, writeable: true },
            OFF: { role: 'state', type: 'boolean', required: false, writeable: false }, //off
            POWER: { role: 'switch.power', type: 'boolean', required: false, writeable: true }, //on
            SPEED: { role: 'level.mode.fan', type: 'number', required: false, writeable: true },
            SWING: { role: 'switch.mode.swing', type: 'boolean', required: false, writeable: true },
            UNREACH: { role: 'indicator.maintenance', type: 'boolean', required: false, writeable: false },
        },
    },
    socket: {
        name: 'socket',
        description: 'Steckdosen, Schalter, Relais, usw. schalten',
        data: {
            ACTUAL: { role: 'switch', type: 'boolean', required: true, writeable: false },
            SET: { role: 'switch', type: 'boolean', required: false, writeable: true },
            COLORDEC: { role: 'state', type: 'number', required: false, writeable: false }, //Farbcode über DP steuern
            BUTTONTEXT: { role: ['state', 'text'], type: 'string', required: false, writeable: false }, //Button-Text über DP steuern bei cardEntity
        },
    },
    light: {
        name: 'light',
        description: 'ein Lichtschalter',
        data: {
            ACTUAL: { role: ['switch.light', 'sensor.light'], type: 'boolean', required: true, writeable: false },
            SET: { role: 'switch.light', type: 'boolean', required: false, writeable: true },
            COLORDEC: { role: 'state', type: 'number', required: false, writeable: false }, //Farbcode über DP steuern
            BUTTONTEXT: { role: 'text', type: 'string', required: false, writeable: false }, //Button-Text über DP steuern bei cardEntity
        },
    },
    volume: {
        name: 'volume',
        description: '',
        data: {
            ACTUAL: { role: ['value.volume', 'level.volume'], type: 'number', required: false, writeable: false },
            SET: { role: 'level.volume', type: 'number', required: true, writeable: true },
            MUTE: { role: 'media.mute', type: 'boolean', required: false, writeable: true },
        },
    },
    rgb: {
        name: 'rgb',
        description: 'Farblicht mit einzelnen Farbkanälen',
        data: {
            RED: { role: 'level.color.red', type: 'number', required: true, writeable: true },
            GREEN: { role: 'level.color.green', type: 'number', required: true, writeable: true },
            BLUE: { role: 'level.color.blue', type: 'number', required: true, writeable: true },
            ON_ACTUAL: { role: ['sensor.light', 'switch.light'], type: 'boolean', required: true, writeable: false },
            ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            DIMMER: { role: 'level.dimmer', type: 'number', required: false, writeable: true },
            TEMPERATURE: { role: 'level.color.temperature', type: 'number', required: false, writeable: true }, // entweder oder
            WHITE: { role: 'level.color.white', type: 'number', required: false, writeable: true }, // mit prüfen
            //VALUE: { role: 'state', type: 'number', required: false, writeable: true }, //für popupInSel
        },
    },
    rgbSingle: {
        name: 'rgbSingle',
        description: 'Farblicht ohne Farbkanäle',
        data: {
            RGB: { role: 'level.color.rgb', type: 'string', required: true, writeable: true },
            ON: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            DIMMER: { role: 'level.dimmer', type: 'number', required: false, writeable: true },
            TEMPERATURE: { role: 'level.color.temperature', type: 'number', required: false, writeable: true },
            ON_ACTUAL: { role: ['sensor.light', 'switch.light'], type: 'boolean', required: false, writeable: false },
            // VALUE: { role: 'state', type: 'number', required: false, writeable: true }, //für popupInSel
        },
    },
    slider: {
        name: 'slider',
        description: 'Slider to set a numerical value',
        data: {
            SET: { role: 'level', type: 'number', required: true, writeable: true },
            ACTUAL: { role: ['value', 'level'], type: 'number', required: false, writeable: false },
        },
    },
    button: {
        name: 'button',
        description: 'Switch',
        data: { SET: { role: 'button', type: 'boolean', required: true, writeable: true } },
    },
    buttonSensor: {
        name: 'buttonSensor',
        description: 'Taster',
        data: { ACTUAL: { role: 'button.press', type: 'boolean', required: true, writeable: false } },
    },
    temperature: {
        name: 'temperature',
        description: '',
        data: {
            ACTUAL: { role: 'value.temperature', type: 'number', required: true, writeable: false },
        },
    },
    'value.temperature': {
        name: 'value.temperature',
        description: '',
        data: {
            ACTUAL: { role: 'value.temperature', type: 'number', required: true, writeable: false },
            USERICON: { role: 'state', type: 'string', required: false, writeable: false }, // benutzerdefinierter Iconname über DP senden
        },
    },
    thermostat: {
        name: 'thermostat',
        description: '',
        data: {
            ACTUAL: { role: 'value.temperature', type: 'number', required: true, writeable: false },
            SET: { role: 'level.temperature', type: 'number', required: true, writeable: true },
            MODE: { role: 'level.mode.thermostat', type: 'number', required: true, writeable: true },
            BOOST: { role: 'switch.mode.boost', type: 'boolean', required: false, writeable: true },
            AUTOMATIC: { role: 'state', type: 'boolean', required: true },
            ERROR: { role: 'indicator.error', type: 'boolean', required: false, writeable: false },
            LOWBAT: { role: 'indicator.maintenance.lowbat', type: 'boolean', required: false, writeable: false },
            MANUAL: { role: 'state', type: 'boolean', required: false },
            UNREACH: { role: 'indicator.maintenance.unreach', type: 'boolean', required: false, writeable: false },
            HUMINITY: { role: 'value.humidity', type: 'number', required: false, writeable: false },
            MAINTAIN: { role: 'indicator.maintenance', type: 'boolean', required: false, writeable: false },
            PARTY: { role: 'switch.mode.party', type: 'boolean', required: false },
            POWER: { role: 'switch.power', type: 'boolean', required: false, writeable: true },
            VACATION: { role: 'state', type: 'boolean', required: false },
            WINDOWOPEN: { role: ['state', 'sensor.window'], type: 'boolean', required: false, writeable: false },
            WORKING: { role: 'indicator.working', type: 'boolean', required: false, writeable: false },
            USERICON: { role: 'state', type: 'string', required: false, writeable: false }, // benutzerdefinierter Iconname über DP senden
        },
    },
    'level.timer': {
        name: 'level.timer',
        description: '',
        data: {
            ACTUAL: { role: 'timestamp', type: 'number', required: true, writeable: true },
            STATE: { role: 'state', type: 'string', required: true, writeable: true },
        },
    },
    gate: {
        name: 'gate',
        description: '',
        data: { ACTUAL: { role: 'switch.gate', type: 'boolean', required: true, writeable: false } },
    },
    door: {
        name: 'door',
        description: '',
        data: {
            ACTUAL: { role: 'sensor.door', type: 'boolean', required: true, writeable: false },
            COLORDEC: { role: 'state', type: 'number', required: false, writeable: false }, // Farbcode über DP steuern
            BUTTONTEXT: { role: ['state', 'text'], type: 'string', required: false, writeable: false }, // Button-Text über DP steuern
        },
    },
    'level.mode.fan': {
        name: 'level.mode.fan',
        description: '',
        data: {
            ACTUAL: { role: 'state', type: 'boolean', required: true, writeable: false },
            MODE: { role: 'state', type: 'number', required: true, writeable: true },
            SET: { role: 'state', type: 'boolean', required: true, writeable: true },
            SPEED: { role: 'state', type: 'number', required: true, writeable: true },
        },
    },
    lock: {
        name: 'lock',
        description: 'Türschloss',
        data: {
            ACTUAL: { role: 'state', type: 'boolean', required: true, writeable: false },
            OPEN: { role: 'state', type: 'boolean', required: false, writeable: false },
            SET: { role: 'switch.lock', type: 'boolean', required: true, writeable: true },
        },
    },
    warning: {
        name: 'warning',
        description: '',
        data: {
            INFO: { role: 'weather.title', type: 'string', required: true, writeable: false },
            LEVEL: { role: 'value.warning', type: 'number', required: true, writeable: false },
            TITLE: { role: 'weather.title.short', type: 'string', required: true, writeable: false },
        },
    },
    weatherforecast: {
        name: 'weatherforecast',
        description: '',
        data: {
            ICON: { role: 'weather.icon.forecast', type: 'string', required: true, writeable: false },
            TEMP: { role: 'value.temperature', type: 'number', required: true, writeable: false },
        },
    },
    WIFI: {
        name: 'WIFI',
        description: '',
        data: {
            ACTUAL: { role: 'state', type: 'string', required: true, writeable: false },
            SWITCH: { role: 'switch', type: 'boolean', required: false, writeable: true },
        },
    },
};

export const requiredFeatureDatapoints: requiredDatapoints = {
    cie: {
        name: 'cie',
        description: '',
        data: {
            CIE: { role: 'level.color.cie', type: 'string', required: true },
            DIMMER: { role: 'level.dimmer', type: 'boolean', required: true },
            ON: { role: 'switch.light', type: 'boolean', required: true },
            ON_ACTUAL: { role: 'sensor.light', type: 'boolean', required: true },
            TEMPERATURE: { role: 'level.color.temperature', type: 'number', required: true },
        },
    },
    timeTable: {
        name: 'timeTable',
        description: '',
        data: {
            ACTUAL: { role: 'text', type: 'string', required: true },
            VEHICLE: { role: 'text', type: 'string', required: true },
            DIRECTION: { role: 'text', type: 'string', required: true },
            DELAY: { role: 'indicator', type: 'boolean', required: true },
        },
    },
    info: { name: 'info', description: '', data: { ACTUAL: { role: 'text', type: 'string', required: true } } },
    airCondition: {
        name: 'airCondition',
        description: '',
        data: {
            ACTUAL: { role: 'value.temperature', type: 'number', required: true },
            SET: { role: 'level.temperature', type: 'number', required: true },
            AUTO: { role: 'switch', type: 'boolean', required: false },
            COOL: { role: 'switch', type: 'boolean', required: false },
            BOOST: { role: 'switch.mode.boost', type: 'boolean', required: false },
            ERROR: { role: 'indicator.error', type: 'boolean', required: false },
            HEAT: { role: 'switch', type: 'boolean', required: false },
            HUMINITY: { role: 'value.humidity', type: 'number', required: false },
            MAINTAIN: { role: 'indicator.maintenance', type: 'boolean', required: false },
            MODE: { role: 'level.mode.airconditioner', type: 'number', required: true },
            OFF: { role: 'switch', type: 'boolean', required: true },
            POWER: { role: 'switch.power', type: 'boolean', required: false },
            SPEED: { role: 'level.mode.fan', type: 'number', required: false },
            SWING: { role: 'switch.mode.swing', type: 'boolean', required: false },
            UNREACH: { role: 'indicator.maintenance.unreach', type: 'boolean', required: false },
        },
    },
    gate: {
        name: 'gate',
        description: '',
        data: {
            ACTUAL: { role: ['value.blind', 'value.blind'], type: 'number', required: true, writeable: false },
            SET: { role: 'switch.gate', type: 'boolean', required: true, writeable: true },
            STOP: { role: 'button.stop', type: 'boolean', required: true, writeable: true },
        },
    },
    thermostat: {
        name: 'thermostat',
        description: '',
        data: {
            ACTUAL: { role: 'value.temperature', type: 'number', required: true },
            SET: { role: 'level.temperature', type: 'number', required: true },
            MODE: { role: 'level.mode.thermostat', type: 'number', required: true },
            BOOST: { role: 'switch.mode.boost', type: 'boolean', required: false },
            AUTOMATIC: { role: 'switch.mode.auto', type: 'boolean', required: true },
            ERROR: { role: 'indicator.error', type: 'boolean', required: false },
            LOWBAT: { role: 'indicator.maintenance.lowbat', type: 'boolean', required: false },
            MANUAL: { role: 'switch.mode.manual', type: 'boolean', required: false },
            UNREACH: { role: 'indicator.maintenance.unreach', type: 'boolean', required: false },
            HUMINITY: { role: 'value.humidity', type: 'number', required: false },
            MAINTAIN: { role: 'indicator.maintenance', type: 'boolean', required: false },
            PARTY: { role: 'switch.mode.party', type: 'boolean', required: false },
            POWER: { role: 'switch.power', type: 'boolean', required: false },
            VACATION: { role: 'switch', type: 'boolean', required: false },
            WINDOWOPEN: { role: 'sensor.window', type: 'boolean', required: false },
            WORKING: { role: 'indicator.working', type: 'boolean', required: false },
        },
    },
};
