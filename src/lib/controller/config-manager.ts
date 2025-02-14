import { BaseClass } from '../classes/library';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import type * as typePageItem from '../types/type-pageItem';
import type * as Types from '../types/types';
import { Color, type RGB } from '../const/Color';
import type * as pages from '../types/pages';
import { defaultConfig, isConfig } from '../const/config-manager-const';
import type { panelConfigPartial } from './panel';

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
        const panelConfig: Partial<panelConfigPartial> = { pages: [] };
        if (!config.panelTopic) {
            this.log.error(`Required field panelTopic is missing in ${config.panelName || 'unknown'}!`);
            return;
        }
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
        const convertedConfig: pages.PageBaseConfig = {
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
            pageItems: [
                ...pageItems,
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
            ],
        };
        panelConfig.pages!.push(convertedConfig);
        panelConfig.updated = true;
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
