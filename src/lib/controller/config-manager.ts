import { BaseClass } from '../classes/library';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import type * as typePageItem from '../types/type-pageItem';
import type * as Types from '../types/types';
import { Color } from '../const/Color';
import type * as pages from '../types/pages';
import { defaultConfig, isConfig } from '../const/config-manager-const';

export class ConfigManager extends BaseClass {
    //private test: ConfigManager.DeviceState;

    constructor(adapter: NspanelLovelaceUi) {
        super(adapter, 'config-manager');
    }

    async setScriptConfig(configuration: any): Promise<void> {
        const config = Object.assign(defaultConfig, configuration);
        if (!config || !isConfig(config)) {
            this.log.error(`Invalid configuration from Script: ${config ? JSON.stringify(config) : 'undefined'}`);
            return;
        }

        // Screensaver configuration
        const pageItems: typePageItem.PageItemDataItemsOptions[] = [];
        if (config.bottomScreensaverEntity) {
            for (const item of config.bottomScreensaverEntity) {
                if (item) {
                    pageItems.push(await this.getEntityData(item, 'bottom'));
                }
            }
        }
        if (config.indicatorScreensaverEntity) {
            for (const item of config.indicatorScreensaverEntity) {
                if (item) {
                    pageItems.push(await this.getEntityData(item, 'indicator'));
                }
            }
        }
        if (config.leftScreensaverEntity) {
            for (const item of config.leftScreensaverEntity) {
                if (item) {
                    pageItems.push(await this.getEntityData(item, 'left'));
                }
            }
        }
        this.log.debug(`pageItems count: ${pageItems.length}`);
        const convertedConfig: pages.PageBaseConfig = {
            dpInit: '',
            alwaysOn: 'none',
            uniqueID: 'scr',
            useColor: false,
            config: {
                card: 'screensaver2',
                mode: 'advanced',
                rotationTime: 0,
                model: 'eu',
                data: undefined,
            },
            pageItems: pageItems,
        };
        this.log.debug(`convertedConfig: ${JSON.stringify(convertedConfig)}`);
    }

    async getEntityData(
        entity: ScriptConfig.ScreenSaverElement,
        mode: Types.ScreenSaverPlaces,
    ): Promise<typePageItem.PageItemDataItemsOptions> {
        const result: Partial<typePageItem.PageItemDataItemsOptions> = {
            modeScr: mode,
            type: 'text',
            data: { entity2: {} },
        };

        const obj = await this.adapter.getObjectAsync(entity.ScreensaverEntity);
        if (entity.ScreensaverEntityUnitText || entity.ScreensaverEntityUnitText === '') {
            result.data!.entity2!.unit = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityUnitText);
        } else if (obj && obj.common && obj.common.unit) {
            result.data!.entity2!.unit = { type: 'const', constVal: obj.common.unit };
        }

        if (entity.ScreensaverEntityFactor) {
            result.data!.entity2!.factor = { type: 'const', constVal: entity.ScreensaverEntityFactor };
        }
        if (entity.ScreensaverEntityDecimalPlaces) {
            result.data!.entity2!.decimal = { type: 'const', constVal: entity.ScreensaverEntityDecimalPlaces };
        }
        let color: Types.DataItemsOptions | undefined = undefined;
        if (entity.ScreensaverEntityOnColor) {
            if (typeof entity.ScreensaverEntityOnColor === 'string') {
                color = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityOnColor);
            } else if (Color.isRGB(entity.ScreensaverEntityOnColor)) {
                color = { type: 'const', constVal: entity.ScreensaverEntityOnColor };
            } else if (Color.isScriptRGB(entity.ScreensaverEntityOnColor)) {
                color = { type: 'const', constVal: Color.convertScriptRGBtoRGB(entity.ScreensaverEntityOnColor) };
            } else {
                this.adapter.log.error(`Invalid color value: ${JSON.stringify(entity.ScreensaverEntityOnColor)}`);
            }
        } else if (entity.ScreensaverEntityIconColor) {
            if (typeof entity.ScreensaverEntityIconColor === 'string') {
                color = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconColor);
            } else if (Color.isRGB(entity.ScreensaverEntityIconColor)) {
                color = { type: 'const', constVal: entity.ScreensaverEntityIconColor };
            } else if (Color.isScriptRGB(entity.ScreensaverEntityIconColor)) {
                color = { type: 'const', constVal: Color.convertScriptRGBtoRGB(entity.ScreensaverEntityIconColor) };
            } else {
                this.adapter.log.error(`Invalid color value: ${JSON.stringify(entity.ScreensaverEntityIconColor)}`);
            }
        }
        let colorOff: Types.DataItemsOptions | undefined = undefined;
        if (entity.ScreensaverEntityIconOff) {
            if (typeof entity.ScreensaverEntityIconOff === 'string') {
                colorOff = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOff);
            } else if (Color.isRGB(entity.ScreensaverEntityIconOff)) {
                colorOff = { type: 'const', constVal: entity.ScreensaverEntityIconOff };
            } else if (Color.isScriptRGB(entity.ScreensaverEntityIconOff)) {
                color = { type: 'const', constVal: Color.convertScriptRGBtoRGB(entity.ScreensaverEntityIconOff) };
            } else {
                this.adapter.log.error(`Invalid color value: ${JSON.stringify(entity.ScreensaverEntityIconOff)}`);
            }
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
                false: { value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOff) },
            };
            if (color) {
                result.data!.icon.false!.color = colorOff;
            }
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
        const state = possibleId.endsWith('.') ? undefined : await this.adapter.getForeignStateAsync(possibleId);

        if (state !== undefined && state !== null) {
            if (isTrigger) {
                return { type: 'triggered', dp: possibleId };
            }
            return { type: 'state', dp: possibleId };
        }
        return { type: 'const', constVal: possibleId };
    }
}

function isPageItemDataItemsOptions(obj: any): obj is typePageItem.PageItemDataItemsOptions {
    return obj && obj.modeScr && obj.type === 'text' && obj.data && obj.data.entity2;
}
