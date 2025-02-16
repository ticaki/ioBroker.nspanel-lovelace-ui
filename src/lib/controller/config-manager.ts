import { BaseClass } from '../classes/library';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import type * as typePageItem from '../types/type-pageItem';
import type * as Types from '../types/types';
import { Color, type RGB } from '../const/Color';
import type * as pages from '../types/pages';
import { defaultConfig, isConfig, requiredDatapoints, requiredOutdatedDataPoints } from '../const/config-manager-const';
import type { panelConfigPartial } from './panel';
import { exhaustiveCheck } from '../types/pages';
import type { NavigationItemConfig } from '../classes/navigation';

export class ConfigManager extends BaseClass {
    //private test: ConfigManager.DeviceState;
    private colorOn: RGB = Color.On;
    private colorOff: RGB = Color.Off;
    private colorDefault: RGB = Color.Off;

    constructor(adapter: NspanelLovelaceUi) {
        super(adapter, 'config-manager');
    }

    async setScriptConfig(configuration: any): Promise<void> {
        const config = Object.assign(defaultConfig, configuration);
        if (!config || !isConfig(config)) {
            this.log.error(`Invalid configuration from Script: ${config ? JSON.stringify(config) : 'undefined'}`);
            return;
        }
        let panelConfig: Omit<Partial<panelConfigPartial>, 'pages' | 'navigation'> & {
            navigation: NavigationItemConfig[];
            pages: pages.PageBaseConfig[];
        } = { pages: [], navigation: [] };
        if (!config.panelTopic) {
            this.log.error(`Required field panelTopic is missing in ${config.panelName || 'unknown'}!`);
            return;
        }
        panelConfig.updated = true;
        if (config.panelTopic.endsWith('.cmnd.CustomSend')) {
            panelConfig.topic = config.panelTopic.split('.').slice(0, -2).join('.');
        } else {
            panelConfig.topic = config.panelTopic;
        }
        if (config.panelName) {
            panelConfig.name = config.panelName;
        } else {
            panelConfig.name = `NSPanel-${config.panelTopic}`;
        }
        if (config.defaultColor) {
            this.colorDefault = Color.convertScriptRGBtoRGB(config.defaultColor);
        }
        if (config.defaultOnColor) {
            this.colorOn = Color.convertScriptRGBtoRGB(config.defaultOnColor);
        }
        if (config.defaultOffColor) {
            this.colorOff = Color.convertScriptRGBtoRGB(config.defaultOffColor);
        }

        // Screensaver configuration
        panelConfig.pages.push(await this.getScreensaverConfig(config));
        if (config.pages.length > 1) {
            for (let a = 0; a < config.pages.length; a++) {
                const page = config.pages[a];
                if (page.type === undefined || page.uniqueName == null) {
                    continue;
                }
                panelConfig.navigation.push({
                    name: page.uniqueName,
                    left: undefined,
                    right: undefined,
                    page: page.uniqueName,
                });
            }
            if (panelConfig.navigation.length > 1) {
                //@ts-expect-error Just look 4 lines aboe name CANT be undefined and same for ITEM...
                panelConfig.navigation = panelConfig.navigation.map((item, index, array) => {
                    if (index === 0) {
                        return {
                            ...item,
                            left: { single: array[array.length - 1]!.name },
                            right: { single: array[0]!.name },
                        };
                    } else if (index === array.length - 1) {
                        return { ...item, left: { single: array[index - 1]!.name }, right: { single: array[0]!.name } };
                    }
                    return {
                        ...item,
                        left: { single: array[index - 1]!.name },
                        right: { single: array[index + 1]!.name },
                    };
                });
            }
        }

        panelConfig = await this.getGridConfig(config, panelConfig);

        this.log.debug(`panelConfig: ${JSON.stringify(panelConfig)}`);
        const obj = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
        if (obj) {
            obj.native.scriptConfig = obj.native.scriptConfig || [];
            const index = obj.native.scriptConfig.findIndex((item: any) => item.name === panelConfig.name);
            if (index !== -1) {
                obj.native.scriptConfig[index] = panelConfig;
            } else {
                obj.native.scriptConfig.push(panelConfig);
            }
            await this.adapter.setForeignObjectAsync(this.adapter.namespace, obj);
        }
    }
    async getGridConfig(
        config: ScriptConfig.Config,
        result: Omit<Partial<panelConfigPartial>, 'pages' | 'navigation'> & {
            navigation: NavigationItemConfig[];
            pages: pages.PageBaseConfig[];
        },
    ): Promise<
        Omit<Partial<panelConfigPartial>, 'pages' | 'navigation'> & {
            navigation: NavigationItemConfig[];
            pages: pages.PageBaseConfig[];
        }
    > {
        if (result.pages === undefined) {
            result.pages = [];
        }
        if (config.pages) {
            for (const page of config.pages.concat(config.subPages || [])) {
                if (!page) {
                    continue;
                }
                if (page.type === undefined && page.native) {
                    if (page.heading) {
                        page.native.config = page.native.config || {};
                        page.native.config.data = page.native.config.data || {};
                        page.native.config.data.headline = await this.getFieldAsDataItemConfig(page.heading);
                    }
                    result.pages.push(page.native);
                    continue;
                }
                if (
                    page.type !== 'cardGrid' &&
                    page.type !== 'cardGrid2' &&
                    page.type !== 'cardGrid3' &&
                    page.type !== 'cardEntities'
                ) {
                    continue;
                }
                if (!page.uniqueName) {
                    this.log.error(`Page ${page.heading || 'unknown'} has no uniqueName!`);
                    continue;
                }
                const left =
                    page.prev || (page.parent && page.parent.type !== undefined && page.parent.uniqueName) || undefined;
                const right = page.next || page.home || undefined;
                const navItem: NavigationItemConfig = {
                    name: page.uniqueName,
                    left: left ? { single: left } : undefined,
                    right: right ? { single: right } : undefined,
                    page: page.uniqueName,
                };
                result.navigation.push(navItem);
                const gridItem: pages.PageBaseConfig = {
                    dpInit: '',
                    alwaysOn: 'none',
                    uniqueID: page.uniqueName || '',
                    useColor: false,
                    config: {
                        card: page.type,
                        data: {
                            headline: await this.getFieldAsDataItemConfig(page.heading || ''),
                        },
                    },
                    pageItems: [],
                };
                if (page.items) {
                    for (const item of page.items) {
                        if (!item) {
                            continue;
                        }
                        let itemConfig: typePageItem.PageItemDataItemsOptions | undefined = undefined;
                        if (item.id && !item.id.endsWith('.')) {
                            const obj = await this.adapter.getForeignObjectAsync(item.id);
                            if (obj) {
                                if (!(obj.common && obj.common.role)) {
                                    this.log.error(`Role missing in ${item.id}!`);
                                    continue;
                                }
                                const role = obj.common.role as ScriptConfig.roles;

                                // check if role and types are correct
                                if (!requiredDatapoints[role]) {
                                    this.log.warn(`Role ${role} not implemented yet!`);
                                    continue;
                                }
                                let ok = true;
                                for (const dp in requiredDatapoints[role]) {
                                    const o =
                                        dp !== ''
                                            ? await this.adapter.getForeignObjectAsync(`${item.id}.${dp}`)
                                            : undefined;
                                    if (
                                        !o &&
                                        !requiredOutdatedDataPoints[role][dp].required &&
                                        !requiredDatapoints[role][dp].required
                                    ) {
                                        continue;
                                    }
                                    if (
                                        !o ||
                                        o.common.role !== requiredOutdatedDataPoints[role][dp].role ||
                                        o.common.type !== requiredOutdatedDataPoints[role][dp].type
                                    ) {
                                        if (
                                            !o ||
                                            o.common.role !== requiredDatapoints[role][dp].role ||
                                            o.common.type !== requiredDatapoints[role][dp].type
                                        ) {
                                            ok = false;
                                            if (!o) {
                                                this.log.error(`Datapoint ${item.id}.${dp} is missing and required!`);
                                            } else {
                                                this.log.error(
                                                    `Datapoint ${item.id}.${dp} has wrong ` +
                                                        `role: ${o.common.role !== requiredDatapoints[role][dp].role ? `${o.common.role} should be ${requiredDatapoints[role][dp].role}` : `ok`} ` +
                                                        `- type: ${o.common.type !== requiredDatapoints[role][dp].type ? `${o.common.role} should be ${requiredDatapoints[role][dp].type}` : `ok`}`,
                                                );
                                            }
                                            break;
                                        }
                                    }
                                }
                                if (!ok) {
                                    continue;
                                }
                                const commonName =
                                    typeof obj.common.name === 'string'
                                        ? obj.common.name
                                        : obj.common.name[this.library.getLocalLanguage()];
                                switch (role) {
                                    case 'timeTable': {
                                        itemConfig = {
                                            template: 'text.alias.fahrplan.departure',
                                            dpInit: item.id,
                                        };
                                        break;
                                    }
                                    case 'socket':
                                    case 'light': {
                                        const tempItem: typePageItem.PageItemDataItemsOptions = {
                                            type: 'light',
                                            data: {
                                                icon: {
                                                    true: {
                                                        value: {
                                                            type: 'const',
                                                            constVal:
                                                                item.icon || role === 'socket'
                                                                    ? 'power-socket-de'
                                                                    : 'lightbulb',
                                                        },
                                                        color: {
                                                            type: 'const',
                                                            constVal: item.onColor || Color.activated,
                                                        },
                                                    },
                                                    false: {
                                                        value: {
                                                            type: 'const',
                                                            constVal:
                                                                item.icon2 || role === 'socket'
                                                                    ? 'power-socket-de'
                                                                    : 'lightbulb-outline',
                                                        },
                                                        color: {
                                                            type: 'const',
                                                            constVal: item.offColor || Color.deactivated,
                                                        },
                                                    },
                                                    scale: undefined,
                                                    maxBri: undefined,
                                                    minBri: undefined,
                                                },
                                                colorMode: { type: 'const', constVal: false },
                                                headline: await this.getFieldAsDataItemConfig(
                                                    item.name || commonName || 'Light',
                                                ),
                                                entity1: {
                                                    value: { type: 'triggered', dp: `${item.id}.SET` },
                                                },
                                            },
                                        };
                                        itemConfig = tempItem;
                                        break;
                                    }

                                    case 'dimmer': {
                                        const tempItem: typePageItem.PageItemDataItemsOptions = {
                                            type: 'light',
                                            role: 'dimmer',
                                            data: {
                                                icon: {
                                                    true: {
                                                        value: {
                                                            type: 'const',
                                                            constVal: item.icon || 'lightbulb',
                                                        },
                                                        color: {
                                                            type: 'const',
                                                            constVal: item.onColor || Color.activated,
                                                        },
                                                    },
                                                    false: {
                                                        value: {
                                                            type: 'const',
                                                            constVal: item.icon2 || 'lightbulb-outline',
                                                        },
                                                        color: {
                                                            type: 'const',
                                                            constVal: item.offColor || Color.deactivated,
                                                        },
                                                    },
                                                    scale: undefined,
                                                    maxBri: item.maxValueBrightness
                                                        ? { type: 'const', constVal: item.maxValueBrightness }
                                                        : undefined,
                                                    minBri: item.minValueBrightness
                                                        ? { type: 'const', constVal: item.minValueBrightness }
                                                        : undefined,
                                                },
                                                colorMode: item.colormode
                                                    ? { type: 'const', constVal: !!item.colormode }
                                                    : undefined,
                                                dimmer: {
                                                    value: { type: 'triggered', dp: `${item.id}.SET` },
                                                    maxScale: item.maxValueBrightness
                                                        ? { type: 'const', constVal: item.maxValueBrightness }
                                                        : undefined,
                                                    minScale: item.minValueBrightness
                                                        ? { type: 'const', constVal: item.minValueBrightness }
                                                        : undefined,
                                                },
                                                headline: await this.getFieldAsDataItemConfig(
                                                    item.name || commonName || 'Dimmer',
                                                ),
                                                text1: {
                                                    true: {
                                                        type: 'const',
                                                        constVal: `Brightness`,
                                                    },
                                                },
                                                entity1: {
                                                    value: { type: 'triggered', dp: `${item.id}.ON_SET` },
                                                },
                                            },
                                        };
                                        itemConfig = tempItem;
                                        break;
                                    }
                                    case 'hue': {
                                        const tempItem: typePageItem.PageItemDataItemsOptions = {
                                            type: 'light',
                                            role: 'hue',
                                            data: {
                                                icon: {
                                                    true: {
                                                        value: {
                                                            type: 'const',
                                                            constVal: item.icon || 'lightbulb',
                                                        },
                                                        color: {
                                                            type: 'const',
                                                            constVal: item.onColor || Color.activated,
                                                        },
                                                    },
                                                    false: {
                                                        value: {
                                                            type: 'const',
                                                            constVal: item.icon2 || 'lightbulb-outline',
                                                        },
                                                        color: {
                                                            type: 'const',
                                                            constVal: item.offColor || Color.deactivated,
                                                        },
                                                    },
                                                    scale: undefined,
                                                    maxBri: item.maxValueBrightness
                                                        ? { type: 'const', constVal: item.maxValueBrightness }
                                                        : undefined,
                                                    minBri: item.minValueBrightness
                                                        ? { type: 'const', constVal: item.minValueBrightness }
                                                        : undefined,
                                                },
                                                colorMode: item.colormode
                                                    ? { type: 'const', constVal: !!item.colormode }
                                                    : undefined,
                                                dimmer: {
                                                    value: { type: 'triggered', dp: `${item.id}.DIMMER` },
                                                    maxScale: item.maxValueBrightness
                                                        ? { type: 'const', constVal: item.maxValueBrightness }
                                                        : undefined,
                                                    minScale: item.minValueBrightness
                                                        ? { type: 'const', constVal: item.minValueBrightness }
                                                        : undefined,
                                                },
                                                headline: await this.getFieldAsDataItemConfig(
                                                    item.name || commonName || 'HUE',
                                                ),
                                                hue: {
                                                    type: 'triggered',
                                                    dp: `${item.id}.HUE`,
                                                },
                                                ct: {
                                                    value: { type: 'triggered', dp: `${item.id}.CT` },
                                                    maxScale: item.maxValueColorTemp
                                                        ? { type: 'const', constVal: item.maxValueColorTemp }
                                                        : undefined,
                                                    minScale: item.minValueColorTemp
                                                        ? { type: 'const', constVal: item.minValueColorTemp }
                                                        : undefined,
                                                },
                                                text1: {
                                                    true: {
                                                        type: 'const',
                                                        constVal: `Brightness`,
                                                    },
                                                },
                                                text2: {
                                                    true: {
                                                        type: 'const',
                                                        constVal: `Colour temperature`,
                                                    },
                                                },
                                                text3: {
                                                    true: {
                                                        type: 'const',
                                                        constVal: `Color`,
                                                    },
                                                },
                                                entity1: {
                                                    value: { type: 'triggered', dp: `${item.id}.ON` },
                                                },
                                            },
                                        };
                                        itemConfig = tempItem;
                                        break;
                                    }
                                    case 'rgb':
                                    case 'rgbSingle':
                                    case 'ct':
                                    case 'blind':
                                    case 'door':
                                    case 'window':
                                    case 'volumeGroup':
                                    case 'volume':
                                    case 'info':
                                    case 'humidity':
                                    case 'temperature':
                                    case 'value.temperature':
                                    case 'value.humidity':
                                    case 'sensor.door':
                                    case 'sensor.window':
                                    case 'thermostat':
                                    case 'warning':
                                    case 'cie':
                                    case 'gate':
                                    case 'motion':
                                    case 'buttonSensor':
                                    case 'button':
                                    case 'value.time':
                                    case 'level.timer':
                                    case 'value.alarmtime':
                                    case 'level.mode.fan':
                                    case 'lock':
                                    case 'slider':
                                    case 'switch.mode.wlan':
                                    case 'media':
                                    case 'airCondition': {
                                        this.log.error(`Role ${role} not implemented yet!`);
                                        break;
                                    }
                                    default:
                                        exhaustiveCheck(role);
                                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                                        this.log.error(`Role ${role} not implemented yet!`);
                                }
                                if (itemConfig) {
                                    gridItem.pageItems.push(itemConfig);
                                }
                            }
                        }
                    }
                }
                result.pages.push(gridItem);
            }
        }

        return result;
    }

    async getScreensaverConfig(config: ScriptConfig.Config): Promise<pages.PageBaseConfig> {
        let pageItems: typePageItem.PageItemDataItemsOptions[] = [];
        if (config.bottomScreensaverEntity) {
            for (const item of config.bottomScreensaverEntity) {
                if (item) {
                    pageItems.push(await this.getEntityData(item, 'bottom', config));
                }
            }
        }
        // if weatherEntity is set, add alot weather data to screensaver :)
        // only works with accuweather atm
        if (config.weatherEntity) {
            if (config.weatherEntity.startsWith('accuweather.') && config.weatherEntity.endsWith('.')) {
                const instance = config.weatherEntity.split('.')[1];
                pageItems.push({
                    template: 'text.accuweather.favorit',
                    dpInit: `/^accuweather\\.${instance}.+/`,
                    modeScr: 'favorit',
                });
                pageItems = pageItems.concat([
                    // Bottom 1 - accuWeather.0. Forecast Day 1
                    {
                        template: 'text.accuweather.sunriseset',
                        dpInit: `/^accuweather\\.${instance}.Daily.+/`,
                        modeScr: 'bottom',
                    },
                    // Bottom 1 - accuWeather.0. Forecast Day 1
                    {
                        template: 'text.accuweather.bot2values',
                        dpInit: `/^accuweather\\.${instance}.+?d1$/g`,
                        modeScr: 'bottom',
                    },

                    // Bottom 2 - accuWeather.0. Forecast Day 2
                    {
                        template: 'text.accuweather.bot2values',
                        dpInit: `/^accuweather\\.${instance}.+?d2$/`,
                        modeScr: 'bottom',
                    },

                    // Bottom 3 - accuWeather.0. Forecast Day 3
                    {
                        template: 'text.accuweather.bot2values',
                        dpInit: `/^accuweather\\.${instance}.+?d3$/`,
                        modeScr: 'bottom',
                    },

                    // Bottom 4 - accuWeather.0. Forecast Day 4
                    {
                        template: 'text.accuweather.bot2values',
                        dpInit: `/^accuweather\\.${instance}.+?d4$/`,
                        modeScr: 'bottom',
                    },
                    // Bottom 5 - accuWeather.0. Forecast Day 5
                    {
                        template: 'text.accuweather.bot2values',
                        dpInit: `/^accuweather\\.${instance}.+?d5$/`,
                        modeScr: 'bottom',
                    },
                    // Bottom 7 - Sonnenaufgang - Sonnenuntergang im Wechsel

                    // Bottom 8 - Windgeschwindigkeit
                    {
                        role: 'text',
                        dpInit: '',
                        type: 'text',
                        modeScr: 'bottom',
                        data: {
                            entity1: {
                                value: {
                                    type: 'triggered',
                                    dp: `accuweather.${instance}.Current.WindSpeed`,
                                },
                                decimal: {
                                    type: 'const',
                                    constVal: 1,
                                },
                                factor: {
                                    type: 'const',
                                    constVal: 1000 / 3600,
                                },
                                unit: undefined,
                            },
                            entity2: {
                                value: {
                                    type: 'triggered',
                                    dp: `accuweather.${instance}.Current.WindSpeed`,
                                },
                                decimal: {
                                    type: 'const',
                                    constVal: 1,
                                },
                                factor: {
                                    type: 'const',
                                    constVal: 1000 / 3600,
                                },
                                unit: {
                                    type: 'const',
                                    constVal: 'm/s',
                                },
                            },
                            icon: {
                                true: {
                                    value: {
                                        type: 'const',
                                        constVal: 'weather-windy',
                                    },
                                    color: {
                                        type: 'const',
                                        constVal: Color.MSRed,
                                    },
                                },
                                false: {
                                    value: {
                                        type: 'const',
                                        constVal: 'weather-windy',
                                    },
                                    color: {
                                        type: 'const',
                                        constVal: Color.MSGreen,
                                    },
                                },
                                scale: {
                                    type: 'const',
                                    constVal: { val_min: 0, val_max: 80 },
                                },
                                maxBri: undefined,
                                minBri: undefined,
                            },
                            text: {
                                true: {
                                    type: 'const',
                                    constVal: 'Wind',
                                },
                                false: undefined,
                            },
                        },
                    },

                    // Bottom 9 - Böen
                    {
                        role: 'text',
                        dpInit: '',
                        type: 'text',
                        modeScr: 'bottom',
                        data: {
                            entity1: {
                                value: {
                                    type: 'triggered',
                                    dp: `accuweather.${instance}.Current.WindGust`,
                                },
                                decimal: {
                                    type: 'const',
                                    constVal: 1,
                                },
                                factor: {
                                    type: 'const',
                                    constVal: 1000 / 3600,
                                },
                                unit: undefined,
                            },
                            entity2: {
                                value: {
                                    type: 'triggered',
                                    dp: `accuweather.${instance}.Current.WindGust`,
                                },
                                decimal: {
                                    type: 'const',
                                    constVal: 1,
                                },
                                factor: {
                                    type: 'const',
                                    constVal: 1000 / 3600,
                                },
                                unit: {
                                    type: 'const',
                                    constVal: 'm/s',
                                },
                            },
                            icon: {
                                true: {
                                    value: {
                                        type: 'const',
                                        constVal: 'weather-tornado',
                                    },
                                    color: {
                                        type: 'const',
                                        constVal: Color.MSRed,
                                    },
                                },
                                false: {
                                    value: {
                                        type: 'const',
                                        constVal: 'weather-tornado',
                                    },
                                    color: {
                                        type: 'const',
                                        constVal: Color.MSGreen,
                                    },
                                },
                                scale: {
                                    type: 'const',
                                    constVal: { val_min: 0, val_max: 80 },
                                },
                                maxBri: undefined,
                                minBri: undefined,
                            },
                            text: {
                                true: {
                                    type: 'const',
                                    constVal: 'Böen',
                                },
                                false: undefined,
                            },
                        },
                    },

                    // Bottom 10 - Windrichtung
                    {
                        role: 'text',
                        dpInit: '',
                        type: 'text',
                        modeScr: 'bottom',
                        data: {
                            entity2: {
                                value: {
                                    type: 'triggered',
                                    dp: `accuweather.${instance}.Current.WindDirectionText`,
                                },
                                decimal: {
                                    type: 'const',
                                    constVal: 0,
                                },
                                factor: undefined,
                                unit: {
                                    type: 'const',
                                    constVal: '°',
                                },
                            },
                            icon: {
                                true: {
                                    value: {
                                        type: 'const',
                                        constVal: 'windsock',
                                    },
                                    color: {
                                        type: 'const',
                                        constVal: '#FFFFFF',
                                    },
                                },
                                false: {
                                    value: undefined,
                                    color: undefined,
                                },
                                scale: undefined,
                                maxBri: undefined,
                                minBri: undefined,
                            },
                            text: {
                                true: {
                                    type: 'const',
                                    constVal: 'Windr.',
                                },
                                false: undefined,
                            },
                        },
                    },

                    // Bottom 12 - UV-Index
                    {
                        role: 'text',
                        dpInit: '',
                        type: 'text',
                        modeScr: 'bottom',
                        data: {
                            entity1: {
                                value: {
                                    type: 'triggered',
                                    dp: `accuweather.${instance}.Current.UVIndex`,
                                },
                                decimal: undefined,
                                factor: undefined,
                                unit: undefined,
                            },
                            entity2: {
                                value: {
                                    type: 'triggered',
                                    dp: `accuweather.${instance}.Current.UVIndex`,
                                    forceType: 'string',
                                },
                                decimal: undefined,
                                factor: undefined,
                                unit: undefined,
                            },
                            icon: {
                                true: {
                                    value: {
                                        type: 'const',
                                        constVal: 'solar-power',
                                    },
                                    color: {
                                        type: 'const',
                                        constVal: Color.MSRed,
                                    },
                                },
                                false: {
                                    value: {
                                        type: 'const',
                                        constVal: 'solar-power',
                                    },
                                    color: {
                                        type: 'const',
                                        constVal: Color.MSGreen,
                                    },
                                },
                                scale: {
                                    type: 'const',
                                    constVal: { val_min: 0, val_max: 9 },
                                },
                                maxBri: undefined,
                                minBri: undefined,
                            },
                            text: {
                                true: {
                                    type: 'const',
                                    constVal: 'UV',
                                },
                                false: undefined,
                            },
                        },
                    },
                ]);
            }
        }
        if (config.indicatorScreensaverEntity) {
            for (const item of config.indicatorScreensaverEntity) {
                if (item) {
                    pageItems.push(await this.getEntityData(item, 'indicator', config));
                }
            }
        }
        if (config.leftScreensaverEntity) {
            for (const item of config.leftScreensaverEntity) {
                if (item) {
                    pageItems.push(await this.getEntityData(item, 'left', config));
                }
            }
        }
        if (config.mrIcon1ScreensaverEntity) {
            pageItems.push(await this.getMrEntityData(config.mrIcon1ScreensaverEntity, 'mricon', '1'));
        }
        if (config.mrIcon2ScreensaverEntity) {
            pageItems.push(await this.getMrEntityData(config.mrIcon2ScreensaverEntity, 'mricon', '2'));
        }
        this.log.debug(`pageItems count: ${pageItems.length}`);
        pageItems = pageItems.concat([
            {
                role: 'text',
                dpInit: '',
                type: 'text',
                modeScr: 'time',
                data: {
                    entity2: {
                        value: {
                            type: 'internal',
                            dp: '///time',
                        },
                        dateFormat: {
                            type: 'const',
                            constVal: { local: 'de', format: { hour: '2-digit', minute: '2-digit' } },
                        },
                    },
                },
            },
            {
                role: 'text',
                dpInit: '',
                type: 'text',
                modeScr: 'date',
                data: {
                    entity2: {
                        value: {
                            type: 'internal',
                            dp: '///date',
                        },
                        dateFormat: {
                            type: 'const',
                            constVal: {
                                local: 'de',
                                format: {
                                    weekday: 'long',
                                    month: 'short',
                                    year: 'numeric',
                                    day: 'numeric',
                                },
                            },
                        },
                    },
                },
            },
        ]);
        pageItems = pageItems.concat(config.nativePageItems || []);

        return {
            dpInit: '',
            alwaysOn: 'none',
            uniqueID: 'scr',
            useColor: false,
            config: {
                card: 'screensaver',
                mode: 'standard',
                rotationTime: 0,
                model: 'eu',
                data: undefined,
            },
            pageItems: pageItems,
        };
    }

    async getMrEntityData(
        entity: ScriptConfig.ScreenSaverMRElement,
        mode: Types.ScreenSaverPlaces,
        nr: string,
    ): Promise<typePageItem.PageItemDataItemsOptions> {
        const result: Partial<typePageItem.PageItemDataItemsOptions> = {
            modeScr: mode,
            type: 'text',
            data: { entity1: {} },
        };
        if (entity.ScreensaverEntity && entity.ScreensaverEntity.endsWith(`Relay.${nr}`)) {
            result.data!.entity1!.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity, true);
        } else {
            result.data!.entity1!.value = {
                type: 'internal',
                dp: `cmd/power${nr}`,
            };
        }
        result.data!.icon = {
            true: {
                value: {
                    type: 'const',
                    constVal: 'lightbulb',
                },
                color: {
                    type: 'const',
                    constVal: Color.Yellow,
                },
            },
            false: {
                value: {
                    type: 'const',
                    constVal: 'lightbulb-outline',
                },
                color: {
                    type: 'const',
                    constVal: Color.HMIOff,
                },
            },
            scale: undefined,
            maxBri: undefined,
            minBri: undefined,
        };
        if (entity.ScreensaverEntityOnColor) {
            result.data!.icon.true!.color = await this.getIconColor(entity.ScreensaverEntityOnColor || this.colorOn);
        }
        if (entity.ScreensaverEntityOffColor) {
            result.data!.icon.false!.color = await this.getIconColor(entity.ScreensaverEntityOffColor || this.colorOff);
        }

        if (entity.ScreensaverEntityIconOn) {
            result.data!.icon.true!.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOn);
        }
        if (entity.ScreensaverEntityIconOff) {
            result.data!.icon.true!.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOff);
        }
        if (entity.ScreensaverEntityValue) {
            result.data!.icon.false!.text = {
                value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityValue),
                unit: entity.ScreensaverEntityValueUnit
                    ? await this.getFieldAsDataItemConfig(entity.ScreensaverEntityValueUnit)
                    : undefined,
                decimal: entity.ScreensaverEntityValueDecimalPlace
                    ? { type: 'const', constVal: entity.ScreensaverEntityValueDecimalPlace }
                    : undefined,
                factor: undefined,
            };
            result.role = 'combined';
            result.data!.icon.true!.text = result.data!.icon.false!.text;
        }
        if (isPageItemDataItemsOptions(result)) {
            return result;
        }
        throw new Error('Invalid data');
    }

    async getEntityData(
        entity: ScriptConfig.ScreenSaverElement,
        mode: Types.ScreenSaverPlaces,
        defaultColors: {
            defaultOffColor: ScriptConfig.RGB;
            defaultOnColor: ScriptConfig.RGB;
        },
    ): Promise<typePageItem.PageItemDataItemsOptions> {
        const result: Partial<typePageItem.PageItemDataItemsOptions> = {
            modeScr: mode,
            type: 'text',
            data: { entity1: {} },
        };
        result.data!.entity2 = result.data!.entity1;

        let obj;
        if (entity.ScreensaverEntity && !entity.ScreensaverEntity.endsWith('.')) {
            obj = await this.adapter.getObjectAsync(entity.ScreensaverEntity);
            result.data!.entity1!.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity, true);
        }

        if (entity.ScreensaverEntityUnitText || entity.ScreensaverEntityUnitText === '') {
            result.data!.entity1!.unit = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityUnitText);
        } else if (obj && obj.common && obj.common.unit) {
            result.data!.entity1!.unit = { type: 'const', constVal: obj.common.unit };
        }

        if (entity.ScreensaverEntityFactor) {
            result.data!.entity1!.factor = { type: 'const', constVal: entity.ScreensaverEntityFactor };
        }

        if (entity.ScreensaverEntityDecimalPlaces) {
            result.data!.entity1!.decimal = { type: 'const', constVal: entity.ScreensaverEntityDecimalPlaces };
        }
        if (entity.ScreensaverEntityDateFormat) {
            result.data!.entity1!.dateFormat = {
                type: 'const',
                constVal: { local: 'de', format: entity.ScreensaverEntityDateFormat },
            };
        }

        let color: Types.DataItemsOptions | undefined = undefined;
        if (entity.ScreensaverEntityOnColor) {
            color = await this.getIconColor(entity.ScreensaverEntityOnColor || this.colorOn);
        } else if (entity.ScreensaverEntityIconColor && !isIconScaleElement(entity.ScreensaverEntityIconColor)) {
            color = await this.getIconColor(entity.ScreensaverEntityIconColor || this.colorDefault);
        } else {
            color = await this.getIconColor(defaultColors.defaultOnColor || this.colorDefault);
        }

        let colorOff: Types.DataItemsOptions | undefined = undefined;
        if (entity.ScreensaverEntityOffColor) {
            colorOff = await this.getIconColor(entity.ScreensaverEntityOffColor);
        } else {
            colorOff = await this.getIconColor(defaultColors.defaultOffColor);
        }

        if (entity.ScreensaverEntityIconOn) {
            result.data!.icon = {
                true: { value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOn) },
            };
            if (color) {
                result.data!.icon.true!.color = color;
            }
        }

        if (entity.ScreensaverEntityIconOff) {
            result.data!.icon = {
                ...result.data!.icon,
                ...{
                    false: { value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOff) },
                },
            };
            if (color) {
                result.data!.icon.false!.color = colorOff;
            }
        }
        if (entity.ScreensaverEntityIconColor && isIconScaleElement(entity.ScreensaverEntityIconColor)) {
            result.data!.icon = {
                ...result.data!.icon,

                scale: {
                    type: 'const',
                    constVal: entity.ScreensaverEntityIconColor,
                },
            };
        }

        if (entity.ScreensaverEntityOnText) {
            result.data!.text = { true: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityOnText) };
        } else if (entity.ScreensaverEntityText) {
            result.data!.text = { true: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityText) };
        }

        if (entity.ScreensaverEntityOffText) {
            result.data!.text = { false: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityOffText) };
        }

        if (isPageItemDataItemsOptions(result)) {
            return result;
        }
        throw new Error('Invalid data');
    }

    async getFieldAsDataItemConfig(possibleId: string, isTrigger: boolean = false): Promise<Types.DataItemsOptions> {
        const state =
            possibleId === '' || possibleId.endsWith('.')
                ? undefined
                : await this.adapter.getForeignStateAsync(possibleId);

        if (state !== undefined && state !== null) {
            if (isTrigger) {
                return { type: 'triggered', dp: possibleId };
            }
            return { type: 'state', dp: possibleId };
        }
        return { type: 'const', constVal: possibleId };
    }

    async getIconColor(
        item: ScriptConfig.RGB | RGB | ScriptConfig.IconScaleElement | string,
    ): Promise<Types.DataItemsOptions | undefined> {
        if (isIconScaleElement(item)) {
            //later
        } else if (typeof item === 'string') {
            return await this.getFieldAsDataItemConfig(item);
        } else if (Color.isRGB(item)) {
            return { type: 'const', constVal: item };
        } else if (Color.isScriptRGB(item)) {
            return { type: 'const', constVal: Color.convertScriptRGBtoRGB(item) };
        }
        this.adapter.log.error(`Invalid color value: ${JSON.stringify(item)}`);
        return undefined;
    }
}

function isIconScaleElement(obj: any): obj is ScriptConfig.IconScaleElement {
    return obj && obj.val_min !== undefined && obj.val_max !== undefined;
}
function isPageItemDataItemsOptions(obj: any): obj is typePageItem.PageItemDataItemsOptions {
    return obj && obj.modeScr && obj.data;
}
