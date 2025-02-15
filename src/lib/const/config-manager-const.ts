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
    panelTopic: '',
    weatherEntity: '',
    bottomScreensaverEntity: [],
    defaultColor: {
        red: 0,
        green: 0,
        blue: 0,
    },
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

export const requiredDatapoints: {
    [key: string]: {
        [key: string]: {
            role: ScriptConfig.roles | ConfigManager.ioBrokerRoles;
            required: boolean;
            type: ioBroker.StateCommon['type'];
        };
    };
} = {
    motion: {
        ACTUAL: {
            role: 'sensor.motion',
            type: 'boolean',
            required: true,
        },
    },
    cie: {
        CIE: {
            role: 'level.color.cie',
            type: 'number',
            required: true,
        },
        DIMMER: {
            role: 'level.dimmer',
            type: 'boolean',
            required: true,
        },
        ON: {
            role: 'switch.light',
            type: 'boolean',
            required: true,
        },
        ON_ACTUAL: {
            role: 'state.light',
            type: 'boolean',
            required: true,
        },
        TEMPERATURE: {
            role: 'level.color.temperature',
            type: 'number',
            required: true,
        },
    },
    dimmer: {
        SET: {
            role: 'level.dimmer',
            type: 'number',
            required: true,
        },
        ACTUAL: {
            role: 'value.dimmer',
            type: 'number',
            required: true,
        },
        ON_SET: {
            role: 'switch.light',
            type: 'boolean',
            required: true,
        },
        ON_ACTUAL: {
            role: 'switch.light',
            type: 'boolean',
            required: true,
        },
    },
    timeTable: {
        ACTUAL: {
            role: 'state',
            type: 'string',
            required: true,
        },
        VEHICLE: {
            role: 'state',
            type: 'string',
            required: true,
        },
        DIRECTION: {
            role: 'state',
            type: 'string',
            required: true,
        },
        DELAY: {
            role: 'state',
            type: 'boolean',
            required: true,
        },
    },
    ct: {
        DIMMER: {
            role: 'level.dimmer',
            type: 'number',
            required: true,
        },
        ON: {
            role: 'switch.light',
            type: 'boolean',
            required: true,
        },
        TEMPERATURE: {
            role: 'level.color.temperature',
            type: 'number',
            required: true,
        },
    },
};
