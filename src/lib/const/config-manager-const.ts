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

export type checkedDatapoints = {
    [key: string]: checkedDatapointsUnion;
};
export type checkedDatapointsUnion = { role: ScriptConfig.channelRoles } & (
    | { role: 'motion'; data: { ACTUAL: DataItemsOptions | undefined } }
    | {
          role: 'dimmer';
          data: {
              SET: DataItemsOptions | undefined;
              ACTUAL: DataItemsOptions | undefined;
              ON_SET: DataItemsOptions | undefined;
              ON_ACTUAL: DataItemsOptions | undefined;
          };
      }
    | {
          role: 'ct';
          data: {
              DIMMER: DataItemsOptions | undefined;
              ON: DataItemsOptions | undefined;
              ON_ACTUAL: DataItemsOptions | undefined;
              TEMPERATURE: DataItemsOptions | undefined;
          };
      }
    | {
          role: 'window';
          data: {
              ACTUAL: DataItemsOptions | undefined;
              COLORDEC: DataItemsOptions | undefined;
              BUTTONTEXT: DataItemsOptions | undefined;
          };
      }
    | { role: 'humidity'; data: { ACTUAL: DataItemsOptions | undefined } }
    | {
          role: 'hue';
          data: {
              DIMMER: DataItemsOptions | undefined;
              ON: DataItemsOptions | undefined;
              ON_ACTUAL: DataItemsOptions | undefined;
              TEMPERATURE: DataItemsOptions | undefined;
              HUE: DataItemsOptions | undefined;
          };
      }
    | {
          role: 'info';
          data: {
              ACTUAL: DataItemsOptions | undefined;
              COLORDEC: DataItemsOptions | undefined;
              BUTTONTEXT: DataItemsOptions | undefined;
              USERICON: DataItemsOptions | undefined;
          };
      }
    | {
          role: 'blind';
          data: {
              ACTUAL: DataItemsOptions | undefined;
              SET: DataItemsOptions | undefined;
              CLOSE: DataItemsOptions | undefined;
              OPEN: DataItemsOptions | undefined;
              STOP: DataItemsOptions | undefined;
              TILT_ACTUAL: DataItemsOptions | undefined;
              TILT_SET: DataItemsOptions | undefined;
              TILT_CLOSE: DataItemsOptions | undefined;
              TILT_OPEN: DataItemsOptions | undefined;
              TILT_STOP: DataItemsOptions | undefined;
          };
      }
    | {
          role: 'airCondition';
          data: {
              ACTUAL: DataItemsOptions | undefined;
              SET: DataItemsOptions | undefined;
              SET2: DataItemsOptions | undefined;
              AUTO: DataItemsOptions | undefined;
              COOL: DataItemsOptions | undefined;
              BOOST: DataItemsOptions | undefined;
              ERROR: DataItemsOptions | undefined;
              HEAT: DataItemsOptions | undefined;
              HUMIDITY: DataItemsOptions | undefined;
              MAINTAIN: DataItemsOptions | undefined;
              MODE: DataItemsOptions | undefined;
              OFF: DataItemsOptions | undefined;
              POWER: DataItemsOptions | undefined;
              SPEED: DataItemsOptions | undefined;
              SWING: DataItemsOptions | undefined;
              UNREACH: DataItemsOptions | undefined;
          };
      }
    | {
          role: 'socket';
          data: {
              ACTUAL: DataItemsOptions | undefined;
              SET: DataItemsOptions | undefined;
              COLORDEC: DataItemsOptions | undefined;
              BUTTONTEXT: DataItemsOptions | undefined;
          };
      }
    | {
          role: 'light';
          data: {
              ACTUAL: DataItemsOptions | undefined;
              SET: DataItemsOptions | undefined;
              COLORDEC: DataItemsOptions | undefined;
              BUTTONTEXT: DataItemsOptions | undefined;
          };
      }
    | {
          role: 'volume';
          data: {
              ACTUAL: DataItemsOptions | undefined;
              SET: DataItemsOptions | undefined;
              MUTE: DataItemsOptions | undefined;
          };
      }
    | {
          role: 'rgb';
          data: {
              RED: DataItemsOptions | undefined;
              GREEN: DataItemsOptions | undefined;
              BLUE: DataItemsOptions | undefined;
              ON_ACTUAL: DataItemsOptions | undefined;
              ON: DataItemsOptions | undefined;
              DIMMER: DataItemsOptions | undefined;
              TEMPERATURE: DataItemsOptions | undefined;
              WHITE: DataItemsOptions | undefined;
          };
      }
    | {
          role: 'rgbSingle';
          data: {
              RGB: DataItemsOptions | undefined;
              ON: DataItemsOptions | undefined;
              DIMMER: DataItemsOptions | undefined;
              TEMPERATURE: DataItemsOptions | undefined;
              ON_ACTUAL: DataItemsOptions | undefined;
          };
      }
    | { role: 'slider'; data: { SET: DataItemsOptions | undefined; ACTUAL: DataItemsOptions | undefined } }
    | { role: 'button'; data: { SET: DataItemsOptions | undefined } }
    | { role: 'buttonSensor'; data: { ACTUAL: DataItemsOptions | undefined } }
    | { role: 'temperature'; data: { ACTUAL: DataItemsOptions | undefined } }
    | {
          role: 'value.temperature';
          data: { ACTUAL: DataItemsOptions | undefined; USERICON: DataItemsOptions | undefined };
      }
    | {
          role: 'thermostat';
          data: {
              ACTUAL: DataItemsOptions | undefined;
              SET: DataItemsOptions | undefined;
              MODE: DataItemsOptions | undefined;
              BOOST: DataItemsOptions | undefined;
              AUTOMATIC: DataItemsOptions | undefined;
              ERROR: DataItemsOptions | undefined;
              LOWBAT: DataItemsOptions | undefined;
              MANUAL: DataItemsOptions | undefined;
              UNREACH: DataItemsOptions | undefined;
              HUMIDITY: DataItemsOptions | undefined;
              MAINTAIN: DataItemsOptions | undefined;
              PARTY: DataItemsOptions | undefined;
              POWER: DataItemsOptions | undefined;
              VACATION: DataItemsOptions | undefined;
              WINDOWOPEN: DataItemsOptions | undefined;
              WORKING: DataItemsOptions | undefined;
              USERICON: DataItemsOptions | undefined;
          };
      }
    | { role: 'level.timer'; data: { ACTUAL: DataItemsOptions | undefined; STATE: DataItemsOptions | undefined } }
    | { role: 'gate'; data: { ACTUAL: DataItemsOptions | undefined } }
    | {
          role: 'door';
          data: {
              ACTUAL: DataItemsOptions | undefined;
              COLORDEC: DataItemsOptions | undefined;
              BUTTONTEXT: DataItemsOptions | undefined;
          };
      }
    | {
          role: 'level.mode.fan';
          data: {
              ACTUAL: DataItemsOptions | undefined;
              MODE: DataItemsOptions | undefined;
              SET: DataItemsOptions | undefined;
              SPEED: DataItemsOptions | undefined;
          };
      }
    | {
          role: 'lock';
          data: {
              ACTUAL: DataItemsOptions | undefined;
              OPEN: DataItemsOptions | undefined;
              SET: DataItemsOptions | undefined;
          };
      }
    | {
          role: 'warning';
          data: {
              INFO: DataItemsOptions | undefined;
              LEVEL: DataItemsOptions | undefined;
              TITLE: DataItemsOptions | undefined;
          };
      }
    | { role: 'weatherforecast'; data: { ICON: DataItemsOptions | undefined; TEMP: DataItemsOptions | undefined } }
    | { role: 'WIFI'; data: { ACTUAL: DataItemsOptions | undefined; SWITCH: DataItemsOptions | undefined } }
);

export const checkedDatapoints: checkedDatapoints = {
    motion: {
        role: 'motion',
        data: {
            ACTUAL: undefined,
        },
    },
    dimmer: {
        role: 'dimmer',
        data: {
            SET: undefined,
            ACTUAL: undefined,
            ON_SET: undefined,
            ON_ACTUAL: undefined,
        },
    },
    ct: {
        role: 'ct',
        data: {
            DIMMER: undefined,
            ON: undefined,
            ON_ACTUAL: undefined,
            TEMPERATURE: undefined,
        },
    },
    window: {
        role: 'window',
        data: {
            ACTUAL: undefined,
            COLORDEC: undefined,
            BUTTONTEXT: undefined,
        },
    },
    humidity: {
        role: 'humidity',
        data: {
            ACTUAL: undefined,
        },
    },
    hue: {
        role: 'hue',
        data: {
            DIMMER: undefined,
            ON: undefined,
            ON_ACTUAL: undefined,
            TEMPERATURE: undefined,
            HUE: undefined,
        },
    },
    info: {
        role: 'info',
        data: {
            ACTUAL: undefined,
            COLORDEC: undefined,
            BUTTONTEXT: undefined,
            USERICON: undefined,
        },
    },
    blind: {
        role: 'blind',
        data: {
            ACTUAL: undefined,
            SET: undefined,
            CLOSE: undefined,
            OPEN: undefined,
            STOP: undefined,
            TILT_ACTUAL: undefined,
            TILT_SET: undefined,
            TILT_CLOSE: undefined,
            TILT_OPEN: undefined,
            TILT_STOP: undefined,
        },
    },
    airCondition: {
        role: 'airCondition',
        data: {
            ACTUAL: undefined,
            SET: undefined,
            SET2: undefined,
            AUTO: undefined,
            COOL: undefined,
            BOOST: undefined,
            ERROR: undefined,
            HEAT: undefined,
            HUMIDITY: undefined,
            MAINTAIN: undefined,
            MODE: undefined,
            OFF: undefined,
            POWER: undefined,
            SPEED: undefined,
            SWING: undefined,
            UNREACH: undefined,
        },
    },
    socket: {
        role: 'socket',
        data: {
            ACTUAL: undefined,
            SET: undefined,
            COLORDEC: undefined,
            BUTTONTEXT: undefined,
        },
    },
    light: {
        role: 'light',
        data: {
            ACTUAL: undefined,
            SET: undefined,
            COLORDEC: undefined,
            BUTTONTEXT: undefined,
        },
    },
    volume: {
        role: 'volume',
        data: {
            ACTUAL: undefined,
            SET: undefined,
            MUTE: undefined,
        },
    },
    rgb: {
        role: 'rgb',
        data: {
            RED: undefined,
            GREEN: undefined,
            BLUE: undefined,
            ON_ACTUAL: undefined,
            ON: undefined,
            DIMMER: undefined,
            TEMPERATURE: undefined,
            WHITE: undefined,
        },
    },
    rgbSingle: {
        role: 'rgbSingle',
        data: {
            RGB: undefined,
            ON: undefined,
            DIMMER: undefined,
            TEMPERATURE: undefined,
            ON_ACTUAL: undefined,
        },
    },
    slider: {
        role: 'slider',
        data: {
            SET: undefined,
            ACTUAL: undefined,
        },
    },
    button: {
        role: 'button',
        data: {
            SET: undefined,
        },
    },
    buttonSensor: {
        role: 'buttonSensor',
        data: {
            ACTUAL: undefined,
        },
    },
    temperature: {
        role: 'temperature',
        data: {
            ACTUAL: undefined,
        },
    },
    thermostat: {
        role: 'thermostat',
        data: {
            ACTUAL: undefined,
            SET: undefined,
            MODE: undefined,
            BOOST: undefined,
            AUTOMATIC: undefined,
            ERROR: undefined,
            LOWBAT: undefined,
            MANUAL: undefined,
            UNREACH: undefined,
            HUMIDITY: undefined,
            MAINTAIN: undefined,
            PARTY: undefined,
            POWER: undefined,
            VACATION: undefined,
            WINDOWOPEN: undefined,
            WORKING: undefined,
            USERICON: undefined,
        },
    },
    'level.timer': {
        role: 'level.timer',
        data: {
            ACTUAL: undefined,
            STATE: undefined,
        },
    },
    gate: {
        role: 'gate',
        data: {
            ACTUAL: undefined,
        },
    },
    door: {
        role: 'door',
        data: {
            ACTUAL: undefined,
            COLORDEC: undefined,
            BUTTONTEXT: undefined,
        },
    },
    'level.mode.fan': {
        role: 'level.mode.fan',
        data: {
            ACTUAL: undefined,
            MODE: undefined,
            SET: undefined,
            SPEED: undefined,
        },
    },
    lock: {
        role: 'lock',
        data: {
            ACTUAL: undefined,
            OPEN: undefined,
            SET: undefined,
        },
    },
    warning: {
        role: 'warning',
        data: {
            INFO: undefined,
            LEVEL: undefined,
            TITLE: undefined,
        },
    },
};
export type mydps =
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

export type requiredDatapoints = {
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
    role: StateRole | StateRole[];
    required: boolean;
    useKey?: boolean;
    type: ioBroker.StateCommon['type'];
    writeable?: boolean;
    trigger?: boolean;
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
