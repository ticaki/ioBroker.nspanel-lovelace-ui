import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import type { ConfigButtonFunction } from '../types/types';

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
        ((F.mode === 'page' && F.page) || ('state' in F && (F.mode === 'switch' || F.mode === 'button') && F.state))
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

export type checkedDatapoints = {
    [key: string]: checkedDatapointsUnion;
};
export type checkedDatapointsUnion = { role: ScriptConfig.channelRoles } & (
    | { role: 'motion'; data: { ACTUAL: string } }
    | { role: 'dimmer'; data: { SET: string; ACTUAL: string; ON_SET: string; ON_ACTUAL: string } }
    | { role: 'ct'; data: { DIMMER: string; ON: string; ON_ACTUAL: string; TEMPERATURE: string } }
    | { role: 'window'; data: { ACTUAL: string; COLORDEC: string; BUTTONTEXT: string } }
    | { role: 'humidity'; data: { ACTUAL: string } }
    | { role: 'hue'; data: { DIMMER: string; ON: string; ON_ACTUAL: string; TEMPERATURE: string; HUE: string } }
    | { role: 'info'; data: { ACTUAL: string; COLORDEC: string; BUTTONTEXT: string; USERICON: string } }
    | {
          role: 'blind';
          data: {
              ACTUAL: string;
              SET: string;
              CLOSE: string;
              OPEN: string;
              STOP: string;
              TILT_ACTUAL: string;
              TILT_SET: string;
              TILT_CLOSE: string;
              TILT_OPEN: string;
              TILT_STOP: string;
          };
      }
    | {
          role: 'airCondition';
          data: {
              ACTUAL: string;
              SET: string;
              SET2: string;
              AUTO: string;
              COOL: string;
              BOOST: string;
              ERROR: string;
              HEAT: string;
              HUMIDITY: string;
              MAINTAIN: string;
              MODE: string;
              OFF: string;
              POWER: string;
              SPEED: string;
              SWING: string;
              UNREACH: string;
          };
      }
    | { role: 'socket'; data: { ACTUAL: string; SET: string; COLORDEC: string; BUTTONTEXT: string } }
    | { role: 'light'; data: { ACTUAL: string; SET: string; COLORDEC: string; BUTTONTEXT: string } }
    | { role: 'volume'; data: { ACTUAL: string; SET: string; MUTE: string } }
    | {
          role: 'rgb';
          data: {
              RED: string;
              GREEN: string;
              BLUE: string;
              ON_ACTUAL: string;
              ON: string;
              DIMMER: string;
              TEMPERATURE: string;
              WHITE: string;
          };
      }
    | {
          role: 'rgbSingle';
          data: { RGB: string; ON: string; DIMMER: string; TEMPERATURE: string; ON_ACTUAL: string };
      }
    | { role: 'slider'; data: { SET: string; ACTUAL: string } }
    | { role: 'button'; data: { SET: string } }
    | { role: 'buttonSensor'; data: { ACTUAL: string } }
    | { role: 'temperature'; data: { ACTUAL: string } }
    | { role: 'value.temperature'; data: { ACTUAL: string; USERICON: string } }
    | {
          role: 'thermostat';
          data: {
              ACTUAL: string;
              SET: string;
              MODE: string;
              BOOST: string;
              AUTOMATIC: string;
              ERROR: string;
              LOWBAT: string;
              MANUAL: string;
              UNREACH: string;
              HUMIDITY: string;
              MAINTAIN: string;
              PARTY: string;
              POWER: string;
              VACATION: string;
              WINDOWOPEN: string;
              WORKING: string;
              USERICON: string;
          };
      }
    | { role: 'level.timer'; data: { ACTUAL: string; STATE: string } }
    | { role: 'gate'; data: { ACTUAL: string } }
    | { role: 'door'; data: { ACTUAL: string; COLORDEC: string; BUTTONTEXT: string } }
    | { role: 'level.mode.fan'; data: { ACTUAL: string; MODE: string; SET: string; SPEED: string } }
    | { role: 'lock'; data: { ACTUAL: string; OPEN: string; SET: string } }
    | { role: 'warning'; data: { INFO: string; LEVEL: string; TITLE: string } }
    | { role: 'weatherforecast'; data: { ICON: string; TEMP: string } }
    | { role: 'WIFI'; data: { ACTUAL: string; SWITCH: string } }
);

export const checkedDatapoints: checkedDatapoints = {
    motion: {
        role: 'motion',
        data: {
            ACTUAL: '',
        },
    },
    dimmer: {
        role: 'dimmer',
        data: {
            SET: '',
            ACTUAL: '',
            ON_SET: '',
            ON_ACTUAL: '',
        },
    },
    ct: {
        role: 'ct',
        data: {
            DIMMER: '',
            ON: '',
            ON_ACTUAL: '',
            TEMPERATURE: '',
        },
    },
    window: {
        role: 'window',
        data: {
            ACTUAL: '',
            COLORDEC: '',
            BUTTONTEXT: '',
        },
    },
    humidity: {
        role: 'humidity',
        data: {
            ACTUAL: '',
        },
    },
    hue: {
        role: 'hue',
        data: {
            DIMMER: '',
            ON: '',
            ON_ACTUAL: '',
            TEMPERATURE: '',
            HUE: '',
        },
    },
    info: {
        role: 'info',
        data: {
            ACTUAL: '',
            COLORDEC: '',
            BUTTONTEXT: '',
            USERICON: '',
        },
    },
    blind: {
        role: 'blind',
        data: {
            ACTUAL: '',
            SET: '',
            CLOSE: '',
            OPEN: '',
            STOP: '',
            TILT_ACTUAL: '',
            TILT_SET: '',
            TILT_CLOSE: '',
            TILT_OPEN: '',
            TILT_STOP: '',
        },
    },
    airCondition: {
        role: 'airCondition',
        data: {
            ACTUAL: '',
            SET: '',
            SET2: '',
            AUTO: '',
            COOL: '',
            BOOST: '',
            ERROR: '',
            HEAT: '',
            HUMIDITY: '',
            MAINTAIN: '',
            MODE: '',
            OFF: '',
            POWER: '',
            SPEED: '',
            SWING: '',
            UNREACH: '',
        },
    },
    socket: {
        role: 'socket',
        data: {
            ACTUAL: '',
            SET: '',
            COLORDEC: '',
            BUTTONTEXT: '',
        },
    },
    light: {
        role: 'light',
        data: {
            ACTUAL: '',
            SET: '',
            COLORDEC: '',
            BUTTONTEXT: '',
        },
    },
    volume: {
        role: 'volume',
        data: {
            ACTUAL: '',
            SET: '',
            MUTE: '',
        },
    },
    rgb: {
        role: 'rgb',
        data: {
            RED: '',
            GREEN: '',
            BLUE: '',
            ON_ACTUAL: '',
            ON: '',
            DIMMER: '',
            TEMPERATURE: '',
            WHITE: '',
        },
    },
    rgbSingle: {
        role: 'rgbSingle',
        data: {
            RGB: '',
            ON: '',
            DIMMER: '',
            TEMPERATURE: '',
            ON_ACTUAL: '',
        },
    },
    slider: {
        role: 'slider',
        data: {
            SET: '',
            ACTUAL: '',
        },
    },
    button: {
        role: 'button',
        data: {
            SET: '',
        },
    },
    buttonSensor: {
        role: 'buttonSensor',
        data: {
            ACTUAL: '',
        },
    },
    temperature: {
        role: 'temperature',
        data: {
            ACTUAL: '',
        },
    },
    thermostat: {
        role: 'thermostat',
        data: {
            ACTUAL: '',
            SET: '',
            MODE: '',
            BOOST: '',
            AUTOMATIC: '',
            ERROR: '',
            LOWBAT: '',
            MANUAL: '',
            UNREACH: '',
            HUMIDITY: '',
            MAINTAIN: '',
            PARTY: '',
            POWER: '',
            VACATION: '',
            WINDOWOPEN: '',
            WORKING: '',
            USERICON: '',
        },
    },
    'level.timer': {
        role: 'level.timer',
        data: {
            ACTUAL: '',
            STATE: '',
        },
    },
    gate: {
        role: 'gate',
        data: {
            ACTUAL: '',
        },
    },
    door: {
        role: 'door',
        data: {
            ACTUAL: '',
            COLORDEC: '',
            BUTTONTEXT: '',
        },
    },
    'level.mode.fan': {
        role: 'level.mode.fan',
        data: {
            ACTUAL: '',
            MODE: '',
            SET: '',
            SPEED: '',
        },
    },
    lock: {
        role: 'lock',
        data: {
            ACTUAL: '',
            OPEN: '',
            SET: '',
        },
    },
    warning: {
        role: 'warning',
        data: {
            INFO: '',
            LEVEL: '',
            TITLE: '',
        },
    },
};
type mydps =
    | 'ACTUAL'
    | 'noNeed'
    | 'SET'
    | 'ON_SET'
    | 'ON_ACTUAL'
    | 'DIMMER'
    | 'ON'
    | 'TEMPERATURE'
    | 'COLORDEC'
    | 'BUTTONTEXT'
    | 'USERICON'
    | 'CLOSE'
    | 'OPEN'
    | 'STOP'
    | 'TILT_ACTUAL'
    | 'TILT_SET'
    | 'TILT_CLOSE'
    | 'TILT_OPEN'
    | 'TILT_STOP'
    | 'SET2'
    | 'AUTO'
    | 'COOL'
    | 'BOOST'
    | 'ERROR'
    | 'HEAT'
    | 'HUMIDITY'
    | 'MAINTAIN'
    | 'MODE'
    | 'OFF'
    | 'POWER'
    | 'SPEED'
    | 'SWING'
    | 'UNREACH'
    | 'MUTE'
    | 'RED'
    | 'GREEN'
    | 'BLUE'
    | 'WHITE'
    | 'RGB'
    | 'STATE'
    | 'INFO'
    | 'LEVEL'
    | 'TITLE'
    | 'ICON'
    | 'TEMP'
    | 'SWITCH';
type requiredDatapoints = {
    motion: {
        data: {
            ACTUAL: Datapoint;
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
    'value.humidity': {
        data: {
            ACTUAL: Datapoint;
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
    airCondition: {
        data: {
            ACTUAL: Datapoint;
            SET: Datapoint;
            SET2: Datapoint;
            AUTO: Datapoint;
            COOL: Datapoint;
            BOOST: Datapoint;
            ERROR: Datapoint;
            HEAT: Datapoint;
            HUMIDITY: Datapoint;
            MAINTAIN: Datapoint;
            MODE: Datapoint;
            OFF: Datapoint;
            POWER: Datapoint;
            SPEED: Datapoint;
            SWING: Datapoint;
            UNREACH: Datapoint;
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
    light: {
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
    slider: {
        data: {
            SET: Datapoint;
            ACTUAL: Datapoint;
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
    buttonSensor: {
        data: {
            ACTUAL: Datapoint;
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
    'value.temperature': {
        data: {
            ACTUAL: Datapoint;
            USERICON: Datapoint;
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
            AUTOMATIC: Datapoint;
            ERROR: Datapoint;
            LOWBAT: Datapoint;
            MANUAL: Datapoint;
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
    'level.timer': {
        data: {
            ACTUAL: Datapoint;
            STATE: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    gate: {
        data: {
            ACTUAL: Datapoint;
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
    weatherforecast: {
        data: {
            ICON: Datapoint;
            TEMP: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
    WIFI: {
        data: {
            ACTUAL: Datapoint;
            SWITCH: Datapoint;
        } & Partial<Record<mydps, Datapoint>>;
        updatedVersion?: boolean;
        name: string;
        description: string;
    };
};

type Datapoint = {
    role: (ScriptConfig.roles | ConfigManager.ioBrokerRoles) | (ScriptConfig.roles | ConfigManager.ioBrokerRoles)[];
    required: boolean;
    useKey?: boolean;
    type: ioBroker.StateCommon['type'];
    writeable?: boolean;
    description?: string;
};
export const requiredScriptDataPoints: requiredDatapoints = {
    motion: {
        updatedVersion: true,
        name: 'motion',
        description: 'Status of the motion sensor or presence detector (motion or presence detected)',
        data: { ACTUAL: { role: 'sensor.motion', type: 'boolean', required: true, writeable: false } },
    },
    timeTable: {
        updatedVersion: true,
        name: 'timeTable',
        description: 'Time table for the heating',
        data: { noNeed: { role: 'state', type: 'string', required: false, writeable: true } },
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
        updatedVersion: true,
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
        updatedVersion: true,
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
        updatedVersion: true,
        name: 'window',
        description: '',
        data: {
            ACTUAL: { role: 'sensor.window', type: 'boolean', required: true, writeable: false },
            COLORDEC: { role: 'state', type: 'number', required: false, writeable: false }, //Farbcode über DP steuern
            BUTTONTEXT: { role: ['state', 'text'], type: 'string', required: false, writeable: false }, //Button-Text über DP steuern
        },
    },
    humidity: {
        updatedVersion: true,
        name: 'humidity',
        description: '',
        data: { ACTUAL: { role: 'value.humidity', type: 'number', required: true, writeable: false } },
    },
    'value.humidity': {
        updatedVersion: true,
        name: 'humidity',
        description: '',
        data: { ACTUAL: { role: 'value.humidity', type: 'number', required: true, writeable: false } },
    },
    hue: {
        updatedVersion: true,
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
        updatedVersion: true,
        name: 'info',
        description: 'Universal Datenpunkt für diverse Anwendungen',
        data: {
            ACTUAL: { role: 'state', type: 'mixed', required: true, writeable: false, useKey: true },
            COLORDEC: { role: 'value.rgb', type: 'number', required: false, writeable: false, useKey: true }, //Farbcode über DP senden
            BUTTONTEXT: { role: ['text'], type: 'string', required: false, writeable: false, useKey: true }, //Button-Text über DP senden bei cardEntity
            USERICON: { role: 'state', type: 'string', required: false, writeable: false, useKey: true }, //Benutzerdefinierte Iconnamen über DP senden
        },
    },
    blind: {
        updatedVersion: true,
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
        updatedVersion: true,
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
        updatedVersion: true,
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
        updatedVersion: true,
        name: 'volume',
        description: '',
        data: {
            ACTUAL: { role: ['value.volume', 'level.volume'], type: 'number', required: false, writeable: false },
            SET: { role: 'level.volume', type: 'number', required: true, writeable: true },
            MUTE: { role: 'media.mute', type: 'boolean', required: false, writeable: true },
        },
    },
    rgb: {
        updatedVersion: true,
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
        updatedVersion: true,
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
        updatedVersion: true,
        name: 'slider',
        description: 'Slider to set a numerical value',
        data: {
            SET: { role: 'level', type: 'number', required: true, writeable: true },
            ACTUAL: { role: ['value', 'level'], type: 'number', required: false, writeable: false },
        },
    },
    button: {
        updatedVersion: true,
        name: 'button',
        description: 'Switch',
        data: { SET: { role: 'button', type: 'boolean', required: true, writeable: true } },
    },
    buttonSensor: {
        updatedVersion: true,
        name: 'buttonSensor',
        description: 'Taster',
        data: { ACTUAL: { role: 'button.press', type: 'boolean', required: true, writeable: false } },
    },
    temperature: {
        updatedVersion: true,
        name: 'temperature',
        description: '',
        data: {
            ACTUAL: { role: 'value.temperature', type: 'number', required: true, writeable: false },
        },
    },
    'value.temperature': {
        updatedVersion: true,
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
            HUMIDITY: { role: 'value.humidity', type: 'number', required: false, writeable: false },
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
