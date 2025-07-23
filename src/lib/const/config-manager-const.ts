import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import { arrayOfAll, type StateRole } from '../types/pages';
import type { ConfigButtonFunction, DataItemsOptions } from '../types/types';

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

export function isButton(F: any): F is ConfigButtonFunction {
    if (F === undefined) {
        return false;
    }
    if (F === null) {
        return true;
    }

    return (
        'mode' in F &&
        ((F.mode === 'page' && F.page) ||
            ('state' in F && (F.mode === 'switch' || F.mode === 'button') && F.state && !F.state.endsWith('.')))
    );
}

/**
 * Wenn ein State angelegt wird muss gleich ein Namen für das der Device und das Device selbst angegeben werden.
 * Die Seite auf der das Device angezeigt wird, sollte in einem Pick oder wie das heißt angegeben werden,
 * Ich denke nicht das ich dort schon bekannte Seiten angeben kann, die anzeigbaren DAten im Custom sind
 * statisch und das pick hat kein sendto. Die Seiten müsste man jedoch nur einmal in einem State für ein Device angeben.
 * Also brauche ich an der stelle ein sendToSelect das manuelle eingaben erlaubt. mal testen
 */

export function isConfig(F: any, adapter: NspanelLovelaceUi): F is ScriptConfig.Config {
    if (F === undefined) {
        return false;
    }
    const requiredFields: (keyof ScriptConfig.Config)[] = [
        'panelTopic',
        'weatherEntity',
        'defaultOnColor',
        'defaultOffColor',
        'defaultBackgroundColor',
        'pages',
        'subPages',
        'buttonLeft',
        'buttonRight',
        'bottomScreensaverEntity',
        'favoritScreensaverEntity',
        'alternateScreensaverEntity',
        'leftScreensaverEntity',
        'indicatorScreensaverEntity',
        'mrIcon1ScreensaverEntity',
        'mrIcon2ScreensaverEntity',
    ];

    for (const field of requiredFields) {
        if (F[field] === undefined) {
            adapter.log.warn(`Required field '${field}' is missing in config - Aborting for this panel`);
            return false;
        }
    }
    return true;
}

export const arrayOfAllConfigRequiredFields = arrayOfAll<keyof ScriptConfig.Config>();

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
    buttonLeft: null,
    buttonRight: null,
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

export type checkedDatapointsUnionWithNull = Record<
    ScriptConfig.channelRoles,
    Partial<Record<mydps, DataItemsOptions | undefined | null>>
>;

export type checkedDatapointsUnion = Record<
    ScriptConfig.channelRoles,
    Partial<Record<mydps, DataItemsOptions | undefined>>
>;

export const checkedDatapoints: checkedDatapointsUnionWithNull = {
    airCondition: {
        ACTUAL: null,
        SET: null,
        SET2: null,
        BOOST: null,
        ERROR: null,
        HUMIDITY: null,
        MAINTAIN: null,
        MODE: null,
        POWER: null,
        SPEED: null,
        SWING: null,
        SWING2: null,
        UNREACH: null,
    },
    blind: {
        ACTUAL: null,
        SET: null,
        CLOSE: null,
        OPEN: null,
        STOP: null,
        TILT_ACTUAL: null,
        TILT_SET: null,
        TILT_CLOSE: null,
        TILT_OPEN: null,
        TILT_STOP: null,
    },
    button: {
        SET: null,
    },
    ct: {
        DIMMER: null,
        ON: null,
        ON_ACTUAL: null,
        TEMPERATURE: null,
    },
    dimmer: {
        SET: null,
        ACTUAL: null,
        ON_SET: null,
        ON_ACTUAL: null,
    },
    door: {
        ACTUAL: null,
        COLORDEC: null,
        BUTTONTEXT: null,
    },
    gate: {
        ACTUAL: null,
        SET: null,
        STOP: null,
    },
    hue: {
        DIMMER: null,
        ON: null,
        ON_ACTUAL: null,
        TEMPERATURE: null,
        HUE: null,
    },
    humidity: {
        ACTUAL: null,
    },
    info: {
        ACTUAL: null,
        COLORDEC: null,
        BUTTONTEXT: null,
        USERICON: null,
    },
    light: {
        ACTUAL: null,
        SET: null,
        COLORDEC: null,
        BUTTONTEXT: null,
    },
    lock: {
        ACTUAL: null,
        OPEN: null,
        SET: null,
    },
    motion: {
        ACTUAL: null,
    },
    rgb: {
        RED: null,
        GREEN: null,
        BLUE: null,
        ON_ACTUAL: null,
        ON: null,
        DIMMER: null,
        TEMPERATURE: null,
        WHITE: null,
    },
    rgbSingle: {
        RGB: null,
        ON: null,
        DIMMER: null,
        TEMPERATURE: null,
        ON_ACTUAL: null,
    },
    select: {
        ACTUAL: null,
        SET: null,
    },
    slider: {
        SET: null,
        ACTUAL: null,
    },
    socket: {
        ACTUAL: null,
        SET: null,
        COLORDEC: null,
        BUTTONTEXT: null,
    },
    temperature: {
        ACTUAL: null,
    },
    thermostat: {
        ACTUAL: null,
        SET: null,
        MODE: null,
        BOOST: null,
        ERROR: null,
        LOWBAT: null,
        UNREACH: null,
        HUMIDITY: null,
        MAINTAIN: null,
        PARTY: null,
        POWER: null,
        VACATION: null,
        WINDOWOPEN: null,
        WORKING: null,
        USERICON: null,
    },
    timeTable: {
        noNeed: null,
    },
    volume: {
        ACTUAL: null,
        SET: null,
        MUTE: null,
    },
    warning: {
        INFO: null,
        LEVEL: null,
        TITLE: null,
    },
    window: {
        ACTUAL: null,
        COLORDEC: null,
        BUTTONTEXT: null,
    },
    'level.mode.fan': {
        ACTUAL: null,
        MODE: null,
        SET: null,
        SPEED: null,
    },
    'level.timer': {
        ACTUAL: null,
        SET: null,
        STATE: null,
        STATUS: null,
    },
    'sensor.alarm.flood': {
        ACTUAL: null,
    },
    'value.humidity': {
        ACTUAL: null,
    },
    'value.temperature': {
        ACTUAL: null,
    },
};

export type mydps =
    | 'ACTUAL'
    | 'AUTO'
    | 'AUTOMATIC'
    | 'BLUE'
    | 'BOOST'
    | 'BUTTONTEXT'
    | 'CLOSE'
    | 'COLORDEC'
    | 'COOL'
    | 'DIMMER'
    | 'ERROR'
    | 'GREEN'
    | 'HEAT'
    | 'HUE'
    | 'HUMIDITY'
    | 'ICON'
    | 'INFO'
    | 'LEVEL'
    | 'LOWBAT'
    | 'MAINTAIN'
    | 'MANUAL'
    | 'MODE'
    | 'MUTE'
    | 'noNeed'
    | 'OFF'
    | 'ON'
    | 'ON_ACTUAL'
    | 'ON_SET'
    | 'OPEN'
    | 'PARTY'
    | 'POWER'
    | 'RED'
    | 'RGB'
    | 'SET'
    | 'SET2'
    | 'SPEED'
    | 'STATE'
    | 'STATUS'
    | 'STOP'
    | 'SWING'
    | 'SWING2'
    | 'SWITCH'
    | 'TEMP'
    | 'TEMPERATURE'
    | 'TILT_ACTUAL'
    | 'TILT_CLOSE'
    | 'TILT_OPEN'
    | 'TILT_SET'
    | 'TILT_STOP'
    | 'TITLE'
    | 'UNREACH'
    | 'USERICON'
    | 'VACATION'
    | 'VALUE'
    | 'WHITE'
    | 'WINDOWOPEN'
    | 'WORKING';

export type requiredDatapoints = Pick<requiredDatapoints2, ScriptConfig.channelRoles>;

type requiredDatapoints2 = {
    airCondition: {
        data: {
            ACTUAL: Datapoint;
            SET: Datapoint;
            SET2: Datapoint;
            BOOST: Datapoint;
            ERROR: Datapoint;
            HUMIDITY: Datapoint;
            MAINTAIN: Datapoint;
            MODE: Datapoint;
            POWER: Datapoint;
            SPEED: Datapoint;
            SWING: Datapoint;
            SWING2: Datapoint;
            UNREACH: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    blind: {
        data: {
            ACTUAL: Datapoint;
            SET: Datapoint;
            CLOSE: Datapoint;
            OPEN: Datapoint;
            STOP: Datapoint;
            TILT_ACTUAL: Datapoint;
            TILT_SET: Datapoint;
            TILT_CLOSE: Datapoint;
            TILT_OPEN: Datapoint;
            TILT_STOP: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    button: {
        data: {
            SET: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    ct: {
        data: {
            DIMMER: Datapoint;
            ON: Datapoint;
            ON_ACTUAL: Datapoint;
            TEMPERATURE: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    dimmer: {
        data: {
            SET: Datapoint;
            ACTUAL: Datapoint;
            ON_SET: Datapoint;
            ON_ACTUAL: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    door: {
        data: {
            ACTUAL: Datapoint;
            COLORDEC: Datapoint;
            BUTTONTEXT: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    gate: {
        data: {
            ACTUAL: Datapoint;
            SET: Datapoint;
            STOP: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    hue: {
        data: {
            DIMMER: Datapoint;
            ON: Datapoint;
            ON_ACTUAL: Datapoint;
            TEMPERATURE: Datapoint;
            HUE: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    humidity: {
        data: {
            ACTUAL: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    info: {
        data: {
            ACTUAL: Datapoint;
            COLORDEC: Datapoint;
            BUTTONTEXT: Datapoint;
            USERICON: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    light: {
        data: {
            ON_ACTUAL: Datapoint;
            SET: Datapoint;
            COLORDEC: Datapoint;
            BUTTONTEXT: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    lock: {
        data: {
            ACTUAL: Datapoint;
            OPEN: Datapoint;
            SET: Datapoint;
        };
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    motion: {
        data: {
            ACTUAL: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    rgb: {
        data: {
            RED: Datapoint;
            GREEN: Datapoint;
            BLUE: Datapoint;
            ON_ACTUAL: Datapoint;
            ON: Datapoint;
            DIMMER: Datapoint;
            TEMPERATURE: Datapoint;
            WHITE: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    rgbSingle: {
        data: {
            RGB: Datapoint;
            ON: Datapoint;
            DIMMER: Datapoint;
            TEMPERATURE: Datapoint;
            ON_ACTUAL: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    select: {
        data: {
            ACTUAL: Datapoint;
            SET: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    slider: {
        data: {
            SET: Datapoint;
            ACTUAL: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    socket: {
        data: {
            ACTUAL: Datapoint;
            SET: Datapoint;
            COLORDEC: Datapoint;
            BUTTONTEXT: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    temperature: {
        data: {
            ACTUAL: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    thermostat: {
        data: {
            ACTUAL: Datapoint;
            SET: Datapoint;
            MODE: Datapoint;
            BOOST: Datapoint;
            ERROR: Datapoint;
            LOWBAT: Datapoint;
            UNREACH: Datapoint;
            HUMIDITY: Datapoint;
            MAINTAIN: Datapoint;
            PARTY: Datapoint;
            POWER: Datapoint;
            VACATION: Datapoint;
            WINDOWOPEN: Datapoint;
            WORKING: Datapoint;
            USERICON: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    timeTable: {
        data: {
            noNeed: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    volume: {
        data: {
            ACTUAL: Datapoint;
            SET: Datapoint;
            MUTE: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    warning: {
        data: {
            INFO: Datapoint;
            LEVEL: Datapoint;
            TITLE: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    window: {
        data: {
            ACTUAL: Datapoint;
            COLORDEC: Datapoint;
            BUTTONTEXT: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    'level.mode.fan': {
        data: {
            ACTUAL: Datapoint;
            MODE: Datapoint;
            SET: Datapoint;
            SPEED: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    'level.timer': {
        data: {
            ACTUAL: Datapoint;
            STATE: Datapoint;
            SET: Datapoint;
            STATUS: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    'sensor.alarm.flood': {
        data: {
            ACTUAL: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    'value.humidity': {
        data: {
            ACTUAL: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    'value.temperature': {
        data: {
            ACTUAL: Datapoint;
            USERICON: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
};

type Datapoint = {
    role: StateRole | StateRole[];
    required: boolean;
    useKey?: boolean;
    type: ioBroker.StateCommon['type'] | ioBroker.StateCommon['type'][];
    writeable?: boolean;
    trigger?: boolean;
    description?: string;
    alternate?: mydps; // für die alten Versionen
};
export const requiredScriptDataPoints: requiredDatapoints = {
    airCondition: {
        name: 'airCondition',
        description: '',
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
                role: 'level.mode.airconditioner',
                type: 'number',
                required: false,
                writeable: true,
                trigger: true,
                description: `0: OFF, 1: AUTO, 2: COOL, 3: HEAT, 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more`,
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
                role: 'indicator.maintenance',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
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
            COLORDEC: { role: 'state', type: 'number', required: false, writeable: false, trigger: true },
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
                role: ['switch.light', 'sensor.light'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
                alternate: 'SET',
            },
            SET: { role: 'switch.light', type: 'boolean', required: true, writeable: true },
            COLORDEC: { role: 'state', type: 'number', required: false, writeable: false, trigger: true },
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
            WHITE: { role: 'level.color.white', type: 'number', required: false, writeable: true, trigger: true },
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
                type: 'number',
                required: true,
                writeable: false,
                trigger: true,
            },
            SET: { role: 'level.mode.select', type: 'number', required: true, writeable: true, trigger: true },
        },
    },
    slider: {
        updatedVersion: true,
        name: 'slider',
        description: 'Slider to set a numerical value',
        data: {
            SET: { role: 'level', type: 'number', required: true, writeable: true },
            ACTUAL: { role: ['value', 'level'], type: 'number', required: false, writeable: false, trigger: true },
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
            COLORDEC: { role: 'state', type: 'number', required: false, writeable: false, trigger: true },
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
            MODE: { role: 'level.mode.thermostat', type: 'number', required: false, writeable: true, trigger: true },
            BOOST: {
                role: ['switch.mode.boost', 'switch.boost'],
                type: 'boolean',
                required: false,
                writeable: true,
                trigger: true,
            },
            ERROR: { role: 'indicator.error', type: 'boolean', required: false, writeable: false, trigger: true },
            LOWBAT: {
                role: 'indicator.maintenance.lowbat',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
            },
            UNREACH: {
                role: 'indicator.maintenance.unreach',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
            },
            HUMIDITY: { role: 'value.humidity', type: 'number', required: false, writeable: false, trigger: true },
            MAINTAIN: {
                role: 'indicator.maintenance',
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
            },
            PARTY: { role: 'switch.mode.party', type: 'boolean', required: false, trigger: true },
            POWER: { role: 'switch.power', type: 'boolean', required: false, writeable: true, trigger: true },
            VACATION: { role: 'state', type: 'boolean', useKey: true, required: false, trigger: true },
            WINDOWOPEN: {
                role: ['state', 'sensor.window'],
                type: 'boolean',
                required: false,
                writeable: false,
                trigger: true,
            },
            WORKING: { role: 'indicator.working', type: 'boolean', required: false, writeable: false, trigger: true },
            USERICON: { role: 'state', type: 'string', useKey: true, required: false, writeable: false, trigger: true },
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
            INFO: { role: 'weather.title', type: 'string', required: true, writeable: false },
            LEVEL: { role: 'value.warning', type: 'number', required: true, writeable: false },
            TITLE: { role: 'weather.title.short', type: 'string', required: true, writeable: false },
        },
    },
    window: {
        updatedVersion: true,
        name: 'window',
        description: '',
        data: {
            ACTUAL: { role: 'sensor.window', type: 'boolean', required: true, writeable: false, trigger: true },
            COLORDEC: { role: 'state', type: 'number', required: false, writeable: false },
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
            USERICON: { role: 'state', type: 'string', required: false, writeable: false },
        },
    },
};
