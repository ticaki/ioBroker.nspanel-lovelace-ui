import { BaseClass } from './library';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import type * as typePageItem from '../types/type-pageItem';
import type * as Types from '../types/types';
import { Color, type RGB } from '../const/Color';
import type * as pages from '../types/pages';
import {
    defaultConfig,
    isConfig,
    requiredFeatureDatapoints,
    requiredScriptDataPoints,
} from '../const/config-manager-const';
import type { panelConfigPartial } from '../controller/panel';
import { exhaustiveCheck } from '../types/pages';
import { isNavigationItemConfigArray, type NavigationItemConfig } from './navigation';
import { getStringOrArray } from '../tools/readme';

export class ConfigManager extends BaseClass {
    //private test: ConfigManager.DeviceState;
    private colorOn: RGB = Color.On;
    private colorOff: RGB = Color.Off;
    private colorDefault: RGB = Color.Off;

    private readonly scriptVersion = '0.2.1';

    constructor(adapter: NspanelLovelaceUi) {
        super(adapter, 'config-manager');
    }

    /**
     * Sets the script configuration for the panel.
     *
     * @param configuration - The configuration object to set.
     * @returns - A promise that resolves to an array of messages indicating the result of the operation.
     *
     * This method performs the following steps:
     * 1. Merges the provided configuration with the default configuration.
     * 2. Validates the configuration.
     * 3. Checks if the script version meets the required version.
     * 4. Configures the panel settings including topic, name, and colors.
     * 5. Configures the screensaver and pages.
     * 6. Sets up navigation for the panel.
     * 7. Ensures unique page names and handles duplicates.
     * 8. Updates the adapter's foreign object with the new configuration.
     *
     * If any errors occur during the process, they are logged and included in the returned messages.
     */
    async setScriptConfig(configuration: any): Promise<string[]> {
        const config = Object.assign(defaultConfig, configuration);
        if (!config || !isConfig(config)) {
            this.log.error(`Invalid configuration from Script: ${config ? JSON.stringify(config) : 'undefined'}`);
            return ['Invalid configuration'];
        }
        let messages: string[] = [`version: ${config.version}`];

        const version = config.version
            .split('.')
            .map((item, i) => parseInt(item) * Math.pow(100, 2 - i))
            .reduce((a, b) => a + b);

        const requiredVersion = this.scriptVersion
            .split('.')
            .map((item, i) => parseInt(item) * Math.pow(100, 2 - i))
            .reduce((a, b) => a + b);

        if (version < requiredVersion) {
            messages.push(`Script version ${config.version} is lower than the required version ${this.scriptVersion}!`);
            this.log.warn(messages[messages.length - 1]);
        }
        let panelConfig: Omit<Partial<panelConfigPartial>, 'pages' | 'navigation'> & {
            navigation: NavigationItemConfig[];
            pages: pages.PageBaseConfig[];
        } = { pages: [], navigation: [] };

        if (!config.panelTopic) {
            this.log.error(`Required field panelTopic is missing in ${config.panelName || 'unknown'}!`);
            messages.push('Required field panelTopic is missing');
            return messages;
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
        try {
            panelConfig.pages.push(await this.getScreensaverConfig(config));
        } catch (error: any) {
            messages.push(`Screensaver configuration error - ${error}`);
            this.log.error(messages[messages.length - 1]);
        }
        if (config.pages.length > 1) {
            for (let a = 0; a < config.pages.length; a++) {
                const page = config.pages[a];
                let uniqueID = '';
                if (page.type === undefined) {
                    uniqueID = page.native.uniqueID || '';
                } else {
                    uniqueID = page.uniqueName || '';
                }
                if (uniqueID === '') {
                    continue;
                }
                panelConfig.navigation.push({
                    name: uniqueID,
                    left: undefined,
                    right: undefined,
                    page: uniqueID,
                });
            }
            const nav = panelConfig.navigation;
            if (nav && nav.length > 0) {
                const index = nav.findIndex(item => item!.name === 'main');
                if (index !== -1) {
                    const item = nav.splice(index, 1)[0];
                    nav.unshift(item);
                }
            }
            if (panelConfig.navigation.length > 1) {
                //@ts-expect-error Just look 4 lines aboe name CANT be undefined and same for ITEM...
                panelConfig.navigation = panelConfig.navigation.map((item, index, array) => {
                    if (index === 0) {
                        return {
                            ...item,
                            left: { single: array[array.length - 1]!.name },
                            right: { single: array[index + 1]!.name },
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
                panelConfig.navigation[panelConfig.navigation.length - 1]!.right = { single: '///service' };
                panelConfig.navigation[0]!.left = { single: '///service' };
            }
        }
        const names: string[] = [];
        let double = false;
        for (const page of config.pages) {
            if (page && page.type !== undefined) {
                if (names.includes(page.uniqueName)) {
                    double = true;
                    this.log.error(messages[messages.length - 1]);
                    messages.push(`Abort - double uniqueName ${page.uniqueName} in config!`);
                } else {
                    names.push(page.uniqueName);
                }
            }
        }
        if (double) {
            return messages;
        }

        ({ panelConfig, messages } = await this.getPageConfig(config, panelConfig, messages));

        // merge both navigations. Remove duplicates from panelConfig.navigation
        const nav1 = config.navigation as NavigationItemConfig[];
        const nav2 = panelConfig.navigation;
        if (nav1 != null && isNavigationItemConfigArray(nav1) && isNavigationItemConfigArray(nav2)) {
            panelConfig.navigation = nav1.concat(nav2);
            panelConfig.navigation = panelConfig.navigation.filter(
                (a, p) => a && panelConfig.navigation.findIndex(b => b && a && b.name === a.name) === p,
            );
        }
        //this.log.debug(`panelConfig: ${JSON.stringify(panelConfig)}`);
        const obj = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
        if (obj) {
            obj.native.scriptConfig = obj.native.scriptConfig || [];
            // remove duplicates
            obj.native.scriptConfig = obj.native.scriptConfig.filter(
                (item: any, i: number) =>
                    obj.native.scriptConfig.findIndex((item2: any) => item2.topic === item.topic) === i,
            );
            // remove config with same topic and different name
            obj.native.scriptConfig = obj.native.scriptConfig.filter((item: any) => item.topic !== panelConfig.topic);
            obj.native.scriptConfig = obj.native.scriptConfig.filter(
                (item: any) => this.adapter.config.panels.findIndex(a => a.topic === item.topic) !== -1,
            );
            obj.native.scriptConfig.push(panelConfig);

            await this.adapter.setForeignObjectAsync(this.adapter.namespace, obj);
        }
        messages.push(`done`);
        return messages.map(a => a.replace('Error: ', ''));
    }

    async getPageConfig(
        config: ScriptConfig.Config,
        panelConfig: Omit<Partial<panelConfigPartial>, 'pages' | 'navigation'> & {
            navigation: NavigationItemConfig[];
            pages: pages.PageBaseConfig[];
        },
        messages: string[],
    ): Promise<{
        panelConfig: Omit<Partial<panelConfigPartial>, 'pages' | 'navigation'> & {
            navigation: NavigationItemConfig[];
            pages: pages.PageBaseConfig[];
        };
        messages: string[];
    }> {
        if (panelConfig.pages === undefined) {
            panelConfig.pages = [];
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
                    panelConfig.pages.push(page.native);
                    continue;
                }
                if (
                    page.type !== 'cardGrid' &&
                    page.type !== 'cardGrid2' &&
                    page.type !== 'cardGrid3' &&
                    page.type !== 'cardEntities' &&
                    page.type !== 'cardThermo'
                ) {
                    const msg = `${page.heading || 'unknown'} with card type ${page.type} not implemented yet!`;
                    messages.push(msg);
                    this.log.warn(msg);
                    continue;
                }
                if (!page.uniqueName) {
                    messages.push(`Page ${page.heading || 'unknown'} has no uniqueName!`);
                    this.log.error(messages[messages.length - 1]);
                    continue;
                }

                if ((config.subPages || []).includes(page)) {
                    const left = page.prev || page.parent || undefined;
                    const right = page.next || page.home || undefined;

                    const navItem: NavigationItemConfig = {
                        name: page.uniqueName,
                        left: left ? { single: left } : undefined,
                        right: right ? (page.home ? { single: right } : { double: right }) : undefined,
                        page: page.uniqueName,
                    };
                    panelConfig.navigation.push(navItem);
                }
                let gridItem: pages.PageBaseConfig = {
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
                if (
                    gridItem.config.card === 'cardGrid' ||
                    gridItem.config.card === 'cardGrid2' ||
                    gridItem.config.card === 'cardGrid3' ||
                    gridItem.config.card === 'cardEntities'
                ) {
                    gridItem.config.scrollType = 'page';
                }
                if (page.type === 'cardThermo') {
                    ({ gridItem, messages } = await this.getPageThermo(page, gridItem, messages));
                }
                if (page.items) {
                    for (const item of page.items) {
                        if (!item) {
                            continue;
                        }
                        try {
                            const itemConfig = await this.getPageItemConfig(item, page);
                            if (itemConfig && gridItem.pageItems) {
                                gridItem.pageItems.push(itemConfig);
                            }
                        } catch (error: any) {
                            messages.push(
                                `Configuration error in page ${page.heading || 'unknown'} with uniqueName ${page.uniqueName} - ${error}`,
                            );
                            this.log.error(messages[messages.length - 1]);
                        }
                    }
                    panelConfig.pages.push(gridItem);
                }
            }
        }
        return { panelConfig, messages };
    }
    async getPageThermo(
        page: ScriptConfig.PageType,
        gridItem: pages.PageBaseConfig,
        messages: string[],
    ): Promise<{ gridItem: pages.PageBaseConfig; messages: string[] }> {
        if (page.type !== 'cardThermo' || !gridItem.config || gridItem.config.card !== 'cardThermo') {
            return { gridItem, messages };
        }
        if (!page.items || !page.items[0] || page.items[0].id == null) {
            const msg = 'Thermo page has no items or item 0 has no id!';
            messages.push(msg);
            this.log.error(msg);
            return { gridItem, messages };
        }

        gridItem.template = 'thermo.script';
        gridItem.dpInit = page.items[0].id;

        return { gridItem, messages };
    }
    async getPageNaviItemConfig(
        item: ScriptConfig.PageItem,
        page: ScriptConfig.PageType,
    ): Promise<typePageItem.PageItemDataItemsOptions | undefined> {
        if (
            !(
                page.type === 'cardGrid' ||
                page.type === 'cardGrid2' ||
                page.type === 'cardGrid3' ||
                page.type === 'cardEntities'
            ) ||
            !item.targetPage ||
            !item.navigate
        ) {
            this.log.warn(`Page type ${page.type} not supported for navigation item!`);
            return undefined;
        }
        let itemConfig: typePageItem.PageItemDataItemsOptions | undefined = undefined;
        const specialRole: pages.DeviceRole =
            page.type === 'cardGrid' || page.type === 'cardGrid2' || page.type === 'cardGrid3'
                ? 'textNotIcon'
                : 'iconNotText';

        if (!item.id) {
            return {
                type: 'button',
                data: {
                    setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                    icon: {
                        true: {
                            value: {
                                type: 'const',
                                constVal: item.icon || 'gesture-tap-button',
                            },
                            color: await this.getIconColor(item.onColor, this.colorOn),
                        },
                        false: {
                            value: {
                                type: 'const',
                                constVal: item.icon2 || item.icon || 'gesture-tap-button',
                            },
                            color: await this.getIconColor(item.offColor, this.colorOff),
                        },
                        scale: item.colorScale ? { type: 'const', constVal: item.colorScale } : undefined,
                        maxBri: undefined,
                        minBri: undefined,
                    },
                    text1: {
                        true: item.name ? await this.getFieldAsDataItemConfig(item.name) : undefined,
                    },
                    text: {
                        true: item.buttonText ? await this.getFieldAsDataItemConfig(item.buttonText) : undefined,
                        false: item.buttonTextOff
                            ? await this.getFieldAsDataItemConfig(item.buttonTextOff)
                            : item.buttonText
                              ? await this.getFieldAsDataItemConfig(item.buttonText)
                              : undefined,
                    },
                },
            };
        }
        const obj = item.id && !item.id.endsWith('.') ? await this.adapter.getForeignObjectAsync(item.id) : undefined;
        const role = obj && obj.common.role ? (obj.common.role as ScriptConfig.roles) : undefined;
        const commonName =
            obj && obj.common
                ? typeof obj.common.name === 'string'
                    ? obj.common.name
                    : obj.common.name[this.library.getLocalLanguage()]
                : undefined;

        if (obj && (!obj.common || !obj.common.role)) {
            throw new Error(`Role missing in ${item.id}!`);
        }

        // check if role and types are correct
        if (role) {
            if (!(await this.checkRequiredDatapoints(role, item))) {
                return;
            }
        }

        const defaultNav: typePageItem.PageItemDataItemsOptions = {
            type: 'button',
            data: {
                text: {
                    true: item.buttonText
                        ? await this.getFieldAsDataItemConfig(item.buttonText)
                        : (await this.existsState(`${item.id}.BUTTONTEXT`))
                          ? { type: 'triggered', dp: `${item.id}.BUTTONTEXT` }
                          : commonName
                            ? { type: 'const', constVal: commonName }
                            : { type: 'triggered', dp: `${item.id}.ACTUAL` },
                    false: item.buttonTextOff
                        ? await this.getFieldAsDataItemConfig(item.buttonTextOff)
                        : (await this.existsState(`${item.id}.BUTTONTEXTOFF`))
                          ? { type: 'triggered', dp: `${item.id}.BUTTONTEXTOFF` }
                          : item.buttonText
                            ? await this.getFieldAsDataItemConfig(item.buttonText)
                            : (await this.existsState(`${item.id}.BUTTONTEXT`))
                              ? { type: 'triggered', dp: `${item.id}.BUTTONTEXT` }
                              : undefined,
                },
            },
        };

        switch (role) {
            case 'socket':
            case 'light':
            case 'dimmer':
            case 'hue':
            case 'rgb':
            case 'rgbSingle':
            case 'ct': {
                const tempItem: typePageItem.PageItemDataItemsOptions = {
                    type: 'button',
                    role: role === 'rgb' ? 'rgbThree' : role,
                    data: {
                        icon: {
                            true: {
                                value: {
                                    type: 'const',
                                    constVal: item.icon || (role === 'socket' ? 'power-socket-de' : 'lightbulb'),
                                },
                                color: await this.getIconColor(item.onColor, this.colorOn),
                            },
                            false: {
                                value: {
                                    type: 'const',
                                    constVal:
                                        item.icon2 ||
                                        item.icon ||
                                        (role === 'socket' ? 'power-socket-de' : 'lightbulb-outline'),
                                },
                                color: await this.getIconColor(item.offColor, this.colorOff),
                            },
                            scale: item.colorScale ? { type: 'const', constVal: item.colorScale } : undefined,
                            maxBri: undefined,
                            minBri: undefined,
                        },
                        text: defaultNav.data.text,
                        text1: {
                            true: { type: 'const', constVal: 'on' },
                            false: { type: 'const', constVal: 'off' },
                        },
                        entity1: {
                            value: {
                                type: 'triggered',
                                dp: `${item.id}.${role === 'dimmer' || role == 'hue' ? 'ON_ACTUAL' : 'ACTUAL'}`,
                            },
                        },
                        setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                    },
                };
                itemConfig = tempItem;
                break;
            }
            case undefined:
            case 'button': {
                const tempItem: typePageItem.PageItemDataItemsOptions = {
                    type: 'button',
                    role: 'button',
                    data: {
                        icon: {
                            true: {
                                value: {
                                    type: 'const',
                                    constVal: item.icon || 'gesture-tap-button',
                                },
                                color: await this.getIconColor(item.onColor, this.colorOn),
                            },
                            false: {
                                value: {
                                    type: 'const',
                                    constVal: item.icon2 || item.icon || 'gesture-tap-button',
                                },
                                color: await this.getIconColor(item.offColor, this.colorOff),
                            },
                            scale: item.colorScale ? { type: 'const', constVal: item.colorScale } : undefined,
                            maxBri: undefined,
                            minBri: undefined,
                        },
                        text: defaultNav.data.text,
                        text1: {
                            true: item.name ? await this.getFieldAsDataItemConfig(item.name) : undefined,
                        },
                        entity1:
                            role === undefined
                                ? undefined
                                : {
                                      value: { type: 'triggered', dp: `${item.id}.ACTUAL` },
                                  },
                        setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                    },
                };
                itemConfig = tempItem;
                break;
            }
            case 'humidity':
            case 'value.humidity': {
                {
                    itemConfig = {
                        type: 'button',
                        dpInit: item.id,
                        role: specialRole,
                        color: {
                            true: await this.getIconColor(item.onColor, this.colorOn),
                            false: await this.getIconColor(item.offColor, this.colorOff),
                            scale: item.colorScale ? item.colorScale : undefined,
                        },
                        template: 'button.humidity',
                        data: {
                            text: defaultNav.data.text,
                            text1: {
                                true: item.name ? await this.getFieldAsDataItemConfig(item.name) : undefined,
                            },
                            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                        },
                    };
                    break;
                }
                break;
            }
            case 'temperature':
            case 'thermostat':
            case 'value.temperature': {
                itemConfig = {
                    type: 'button',
                    dpInit: item.id,
                    role: specialRole,
                    template: 'button.temperature',
                    color: {
                        true: await this.getIconColor(item.onColor, this.colorOn),
                        false: await this.getIconColor(item.offColor, this.colorOff),
                        scale: item.colorScale ? item.colorScale : undefined,
                    },
                    data: {
                        text: defaultNav.data.text,
                        setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                    },
                };
                break;
            }
            case 'gate': {
                if (await this.checkRequiredDatapoints('gate', item, 'feature')) {
                    itemConfig = {
                        template: 'text.gate.isOpen',
                        dpInit: item.id,
                        type: 'button',
                        color: {
                            true: await this.getIconColor(item.onColor, this.colorOn),
                            false: await this.getIconColor(item.offColor, this.colorOff),
                            scale: item.colorScale ? item.colorScale : undefined,
                        },
                        data: {
                            text: defaultNav.data.text,
                            text1: {
                                true: item.name ? await this.getFieldAsDataItemConfig(item.name) : undefined,
                            },
                            entity1: {
                                value: {
                                    type: 'triggered',
                                    mode: 'auto',
                                    role: 'value.blind',
                                    read: 'return val >= 1',
                                    forceType: 'boolean',
                                    dp: '',
                                },
                            },
                            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                        },
                    };
                } else {
                    itemConfig = {
                        template: 'text.gate.isOpen',
                        dpInit: item.id,
                        type: 'button',
                        color: {
                            true: await this.getIconColor(item.onColor, this.colorOn),
                            false: await this.getIconColor(item.offColor, this.colorOff),
                            scale: item.colorScale ? item.colorScale : undefined,
                        },
                        data: {
                            text: defaultNav.data.text,
                            text1: {
                                true: item.name ? await this.getFieldAsDataItemConfig(item.name) : undefined,
                            },
                            setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                        },
                    };
                }
                break;
            }
            case 'door': {
                itemConfig = {
                    template: 'text.door.isOpen',
                    dpInit: item.id,
                    type: 'button',
                    color: {
                        true: await this.getIconColor(item.onColor, this.colorOn),
                        false: await this.getIconColor(item.offColor, this.colorOff),
                        scale: item.colorScale ? item.colorScale : undefined,
                    },
                    data: {
                        text: defaultNav.data.text,
                        text1: {
                            true: item.name ? await this.getFieldAsDataItemConfig(item.name) : undefined,
                        },
                        setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                    },
                };
                break;
            }
            case 'window': {
                itemConfig = {
                    template: 'text.window.isOpen',
                    dpInit: item.id,
                    type: 'button',
                    color: {
                        true: await this.getIconColor(item.onColor, this.colorOn),
                        false: await this.getIconColor(item.offColor, this.colorOff),
                        scale: item.colorScale ? item.colorScale : undefined,
                    },
                    data: {
                        text: defaultNav.data.text,
                        text1: {
                            true: item.name ? await this.getFieldAsDataItemConfig(item.name) : undefined,
                        },

                        setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                    },
                };
                break;
            }
            case 'motion': {
                itemConfig = {
                    template: 'text.motion',
                    dpInit: item.id,
                    type: 'button',
                    color: {
                        true: await this.getIconColor(item.onColor, this.colorOn),
                        false: await this.getIconColor(item.offColor, this.colorOff),
                        scale: item.colorScale ? item.colorScale : undefined,
                    },
                    data: {
                        text: defaultNav.data.text,
                        text1: {
                            true: item.name ? await this.getFieldAsDataItemConfig(item.name) : undefined,
                        },

                        setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                    },
                };
                break;
            }
            case 'volumeGroup':
            case 'volume': {
                itemConfig = {
                    template: 'button.volume',
                    dpInit: item.id,
                    type: 'button',
                    color: {
                        true: await this.getIconColor(item.onColor, this.colorOn),
                        false: await this.getIconColor(item.offColor, this.colorOff),
                        scale: item.colorScale ? item.colorScale : undefined,
                    },
                    data: {
                        text: defaultNav.data.text,
                        text1: {
                            true: item.name ? await this.getFieldAsDataItemConfig(item.name) : undefined,
                        },

                        setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                    },
                };
                break;
            }
            case 'warning': {
                itemConfig = {
                    template: 'text.warning',
                    dpInit: item.id,
                    type: 'button',
                    color: {
                        true: await this.getIconColor(item.onColor || `${item.id}.COLORDEC`, this.colorOn),
                        false: await this.getIconColor(item.offColor || `${item.id}.COLORDEC`, this.colorOff),
                        scale: item.colorScale ? item.colorScale : undefined,
                    },
                    data: {
                        text: defaultNav.data.text,
                        text1: {
                            true: await this.getFieldAsDataItemConfig(item.name || `${item.id}.INFO`),
                        },

                        setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                    },
                };
                break;
            }
            case 'info': {
                itemConfig = {
                    template: 'text.info',
                    dpInit: item.id,
                    type: 'button',
                    color: {
                        true: await this.getIconColor(item.onColor || `${item.id}.COLORDEC`, this.colorOn),
                        false: await this.getIconColor(item.offColor || `${item.id}.COLORDEC`, this.colorOff),
                        scale: item.colorScale,
                    },
                    data: {
                        text: defaultNav.data.text,
                        text1: {
                            true: item.name ? await this.getFieldAsDataItemConfig(item.name) : undefined,
                        },

                        setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                    },
                };
                break;
            }
            case 'cie':
            case 'blind':
            case 'buttonSensor':
            case 'value.time':
            case 'level.timer':
            case 'value.alarmtime':
            case 'level.mode.fan':
            case 'lock':
            case 'slider':
            case 'switch.mode.wlan':
            case 'media':
            case 'timeTable':
            case 'airCondition': {
                throw new Error(`DP: ${item.id} - Navigation for channel: ${role} not implemented yet!!`);
            }
            default:
                exhaustiveCheck(role);

                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new Error(`DP: ${item.id} - Channel role ${role} is not supported!!!`);
        }
        return itemConfig;
    }

    async getPageItemConfig(
        item: ScriptConfig.PageItem,
        page: ScriptConfig.PageType,
    ): Promise<typePageItem.PageItemDataItemsOptions | undefined> {
        let itemConfig: typePageItem.PageItemDataItemsOptions | undefined = undefined;
        if (item.navigate) {
            if (!item.targetPage || typeof item.targetPage !== 'string') {
                throw new Error(`TargetPage missing in ${(item && item.id) || 'no id'}!`);
            }
            return await this.getPageNaviItemConfig(item, page);
        }
        if (item.id && !item.id.endsWith('.')) {
            const obj = await this.adapter.getForeignObjectAsync(item.id);
            if (obj) {
                if (!(obj.common && obj.common.role)) {
                    throw new Error(`Role missing in ${item.id}!`);
                }
                const role = obj.common.role as ScriptConfig.roles;
                // check if role and types are correct
                if (!requiredFeatureDatapoints[role] && !requiredScriptDataPoints[role]) {
                    throw new Error(`Channel role ${role} not supported!`);
                }
                if (!(await this.checkRequiredDatapoints(role, item))) {
                    return;
                }
                const specialRole: pages.DeviceRole =
                    page.type === 'cardGrid' || page.type === 'cardGrid2' || page.type === 'cardGrid3'
                        ? 'textNotIcon'
                        : 'iconNotText';
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
                                            constVal: item.icon || role === 'socket' ? 'power-socket-de' : 'lightbulb',
                                        },
                                        color: await this.getIconColor(item.onColor, this.colorOn),
                                    },
                                    false: {
                                        value: {
                                            type: 'const',
                                            constVal:
                                                item.icon2 || role === 'socket'
                                                    ? 'power-socket-de'
                                                    : 'lightbulb-outline',
                                        },
                                        color: await this.getIconColor(item.offColor, this.colorOff),
                                    },
                                    scale: item.colorScale ? { type: 'const', constVal: item.colorScale } : undefined,
                                    maxBri: undefined,
                                    minBri: undefined,
                                },
                                colorMode: { type: 'const', constVal: false },
                                headline: await this.getFieldAsDataItemConfig(item.name || commonName || 'Light'),
                                entity1: {
                                    value: { type: 'triggered', dp: `${item.id}.ACTUAL` },
                                    set: { type: 'state', dp: `${item.id}.SET` },
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
                                        color: await this.getIconColor(item.onColor, this.colorOn),
                                    },
                                    false: {
                                        value: {
                                            type: 'const',
                                            constVal: item.icon2 || 'lightbulb-outline',
                                        },
                                        color: await this.getIconColor(item.offColor, this.colorOff),
                                    },
                                    scale: item.colorScale ? { type: 'const', constVal: item.colorScale } : undefined,
                                    maxBri: item.maxValueBrightness
                                        ? { type: 'const', constVal: item.maxValueBrightness }
                                        : undefined,
                                    minBri: item.minValueBrightness
                                        ? { type: 'const', constVal: item.minValueBrightness }
                                        : undefined,
                                },
                                colorMode: item.colormode ? { type: 'const', constVal: !!item.colormode } : undefined,
                                dimmer: {
                                    value: { type: 'triggered', dp: `${item.id}.ACTUAL` },
                                    set: { type: 'state', dp: `${item.id}.SET` },
                                    maxScale: item.maxValueBrightness
                                        ? { type: 'const', constVal: item.maxValueBrightness }
                                        : undefined,
                                    minScale: item.minValueBrightness
                                        ? { type: 'const', constVal: item.minValueBrightness }
                                        : undefined,
                                },
                                headline: await this.getFieldAsDataItemConfig(item.name || commonName || 'Dimmer'),
                                text1: {
                                    true: {
                                        type: 'const',
                                        constVal: `Brightness`,
                                    },
                                },
                                entity1: {
                                    value: { type: 'triggered', dp: `${item.id}.ON_ACTUAL` },
                                    set: { type: 'state', dp: `${item.id}.ON_SET` },
                                },
                            },
                        };
                        itemConfig = tempItem;
                        break;
                    }
                    case 'rgbSingle':
                    case 'ct':
                    case 'rgb':
                    case 'hue': {
                        const tempItem: typePageItem.PageItemDataItemsOptions = {
                            type: 'light',
                            role:
                                role === 'hue'
                                    ? 'hue'
                                    : role === 'rgb'
                                      ? 'rgbThree'
                                      : role === 'rgbSingle'
                                        ? 'rgbSingle'
                                        : 'ct',
                            data: {
                                icon: {
                                    true: {
                                        value: {
                                            type: 'const',
                                            constVal: item.icon || 'lightbulb',
                                        },
                                        color: await this.getIconColor(item.onColor, this.colorOn),
                                    },
                                    false: {
                                        value: {
                                            type: 'const',
                                            constVal: item.icon2 || 'lightbulb-outline',
                                        },
                                        color: await this.getIconColor(item.offColor, this.colorOff),
                                    },
                                    scale: item.colorScale ? { type: 'const', constVal: item.colorScale } : undefined,
                                    maxBri: item.maxValueBrightness
                                        ? { type: 'const', constVal: item.maxValueBrightness }
                                        : undefined,
                                    minBri: item.minValueBrightness
                                        ? { type: 'const', constVal: item.minValueBrightness }
                                        : undefined,
                                },
                                colorMode: item.colormode ? { type: 'const', constVal: !!item.colormode } : undefined,
                                dimmer: {
                                    value: { type: 'triggered', dp: `${item.id}.DIMMER` },
                                    maxScale: item.maxValueBrightness
                                        ? { type: 'const', constVal: item.maxValueBrightness }
                                        : undefined,
                                    minScale: item.minValueBrightness
                                        ? { type: 'const', constVal: item.minValueBrightness }
                                        : undefined,
                                },
                                headline: await this.getFieldAsDataItemConfig(item.name || commonName || role),
                                hue:
                                    role !== 'hue'
                                        ? undefined
                                        : {
                                              type: 'triggered',
                                              dp: `${item.id}.HUE`,
                                          },
                                Red:
                                    role !== 'rgb'
                                        ? undefined
                                        : {
                                              type: 'triggered',
                                              dp: `${item.id}.RED`,
                                          },
                                Green:
                                    role !== 'rgb'
                                        ? undefined
                                        : {
                                              type: 'triggered',
                                              dp: `${item.id}.GREEN`,
                                          },
                                Blue:
                                    role !== 'rgb'
                                        ? undefined
                                        : {
                                              type: 'triggered',
                                              dp: `${item.id}.BLUE`,
                                          },
                                White:
                                    role !== 'rgb'
                                        ? undefined
                                        : (await this.existsState(`${item.id}.WHITE`))
                                          ? {
                                                value: {
                                                    type: 'triggered',
                                                    dp: `${item.id}.WHITE`,
                                                },
                                            }
                                          : undefined,
                                color:
                                    role !== 'rgbSingle'
                                        ? undefined
                                        : {
                                              true: {
                                                  type: 'triggered',
                                                  dp: `${item.id}.RGB`,
                                              },
                                          },
                                ct: {
                                    value: { type: 'triggered', dp: `${item.id}.TEMPERATURE` },
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
                                text3:
                                    role === 'ct'
                                        ? undefined
                                        : {
                                              true: {
                                                  type: 'const',
                                                  constVal: `Color`,
                                              },
                                          },
                                entity1: {
                                    value: { type: 'triggered', dp: `${item.id}.ON_ACTUAL` },
                                    set: { type: 'state', dp: `${item.id}.ON` },
                                },
                            },
                        };
                        itemConfig = tempItem;
                        break;
                    }
                    case 'button': {
                        const tempItem: typePageItem.PageItemDataItemsOptions = {
                            type: 'button',
                            role: 'button',
                            data: {
                                icon: {
                                    true: {
                                        value: {
                                            type: 'const',
                                            constVal: item.icon || 'gesture-tap-button',
                                        },
                                        color: await this.getIconColor(item.onColor, this.colorOn),
                                    },
                                    false: {
                                        value: {
                                            type: 'const',
                                            constVal: item.icon2 || 'gesture-tap-button',
                                        },
                                        color: await this.getIconColor(item.offColor, this.colorOff),
                                    },
                                    scale: item.colorScale ? { type: 'const', constVal: item.colorScale } : undefined,
                                    maxBri: undefined,
                                    minBri: undefined,
                                },
                                text: {
                                    true: item.buttonText
                                        ? await this.getFieldAsDataItemConfig(item.buttonText)
                                        : (await this.existsState(`${item.id}.BUTTONTEXT`))
                                          ? { type: 'state', dp: `${item.id}.BUTTONTEXT` }
                                          : { type: 'state', dp: `${item.id}.ACTUAL` },
                                    false: item.buttonTextOff
                                        ? await this.getFieldAsDataItemConfig(item.buttonTextOff)
                                        : (await this.existsState(`${item.id}.BUTTONTEXTOFF`))
                                          ? { type: 'state', dp: `${item.id}.BUTTONTEXTOFF` }
                                          : item.buttonText
                                            ? await this.getFieldAsDataItemConfig(item.buttonText)
                                            : (await this.existsState(`${item.id}.BUTTONTEXT`))
                                              ? { type: 'state', dp: `${item.id}.BUTTONTEXT` }
                                              : { type: 'state', dp: `${item.id}.ACTUAL` },
                                },
                                text1: {
                                    true: item.name ? await this.getFieldAsDataItemConfig(item.name) : undefined,
                                },
                                entity1: {
                                    value: { type: 'triggered', dp: `${item.id}.SET` },
                                },
                            },
                        };
                        itemConfig = tempItem;
                        break;
                    }
                    case 'blind': {
                        const tempItem: typePageItem.PageItemDataItemsOptions = {
                            type: 'shutter',
                            role: 'blind',
                            data: {
                                icon: {
                                    true: {
                                        value: {
                                            type: 'const',
                                            constVal: item.icon || 'window-shutter-open',
                                        },
                                        color: await this.getIconColor(item.onColor, this.colorOn),
                                    },
                                    false: {
                                        value: {
                                            type: 'const',
                                            constVal: item.icon2 || 'window-shutter',
                                        },
                                        color: await this.getIconColor(item.offColor, this.colorOff),
                                    },
                                    unstable: {
                                        value: {
                                            type: 'const',
                                            constVal: item.icon3 || 'window-shutter-alert',
                                        },
                                    },
                                    scale: item.colorScale ? { type: 'const', constVal: item.colorScale } : undefined,
                                    maxBri: undefined,
                                    minBri: undefined,
                                },
                                text: {
                                    true: { type: 'const', constVal: 'Position' },
                                },
                                headline: item.name
                                    ? await this.getFieldAsDataItemConfig(item.name)
                                    : { type: 'const', constVal: commonName ?? 'Blind' },

                                entity1: {
                                    value: { type: 'triggered', dp: `${item.id}.ACTUAL` },
                                    minScale: item.minValueLevel
                                        ? { type: 'const', constVal: item.minValueLevel }
                                        : undefined,
                                    maxScale: item.maxValueLevel
                                        ? { type: 'const', constVal: item.maxValueLevel }
                                        : undefined,
                                    set: { type: 'state', dp: `${item.id}.SET` },
                                },
                                entity2: {
                                    value: { type: 'triggered', dp: `${item.id}.TILT_ACTUAL` },
                                    minScale: item.minValueTilt
                                        ? { type: 'const', constVal: item.minValueTilt }
                                        : undefined,
                                    maxScale: item.maxValueTilt
                                        ? { type: 'const', constVal: item.maxValueTilt }
                                        : undefined,
                                    set: { type: 'state', dp: `${item.id}.TILT_SET` },
                                },
                                up: { type: 'state', dp: `${item.id}.OPEN` },
                                down: { type: 'state', dp: `${item.id}.CLOSE` },
                                stop: { type: 'state', dp: `${item.id}.STOP` },
                                up2: { type: 'state', dp: `${item.id}.TILT_OPEN` },
                                down2: { type: 'state', dp: `${item.id}.TILT_CLOSE` },
                                stop2: { type: 'state', dp: `${item.id}.TILT_STOP` },
                            },
                        };
                        itemConfig = tempItem;
                        break;
                    }
                    case 'gate': {
                        if (await this.checkRequiredDatapoints('gate', item, 'feature')) {
                            itemConfig = {
                                type: 'shutter',
                                role: 'gate',
                                data: {
                                    icon: {
                                        true: {
                                            value: {
                                                type: 'const',
                                                constVal: item.icon || 'garage-open',
                                            },
                                            color: await this.getIconColor(item.onColor, this.colorOn),
                                        },
                                        false: {
                                            value: {
                                                type: 'const',
                                                constVal: item.icon2 || 'garage',
                                            },
                                            color: await this.getIconColor(item.offColor, this.colorOff),
                                        },
                                        unstable: {
                                            value: {
                                                type: 'const',
                                                constVal: item.icon3 || 'garage-alert',
                                            },
                                        },
                                        scale: item.colorScale
                                            ? { type: 'const', constVal: item.colorScale }
                                            : undefined,
                                        maxBri: undefined,
                                        minBri: undefined,
                                    },
                                    text: {
                                        true: { type: 'const', constVal: 'Position' },
                                    },
                                    headline: item.name
                                        ? await this.getFieldAsDataItemConfig(item.name)
                                        : { type: 'const', constVal: commonName ?? 'Garage' },

                                    entity1: {
                                        value: { type: 'triggered', dp: `${item.id}.ACTUAL` },
                                    },
                                    entity2: undefined,
                                    up: { type: 'state', dp: `${item.id}.SET`, write: 'return true;' },
                                    down: { type: 'state', dp: `${item.id}.SET`, write: 'return false;' },
                                    stop: { type: 'state', dp: `${item.id}.STOP` },
                                },
                            };
                            break;
                        } else {
                            itemConfig = {
                                template: 'text.gate.isOpen',
                                dpInit: item.id,
                                color: {
                                    true: await this.getIconColor(item.onColor, this.colorOn),
                                    false: await this.getIconColor(item.offColor, this.colorOff),
                                    scale: item.colorScale,
                                },
                            };
                        }
                        break;
                    }
                    case 'motion':
                    case 'info':
                    case 'humidity':
                    case 'temperature':
                    case 'value.temperature':
                    case 'value.humidity':
                    case 'door':
                    case 'window': {
                        let iconOn = 'door-open';
                        let iconOff = 'door-closed';
                        let iconUnstable = '';
                        let textOn: undefined | string = undefined;
                        let textOff: undefined | string = undefined;
                        let adapterRole: pages.DeviceRole = '';
                        let commonUnit: string | undefined = undefined;
                        switch (role) {
                            case 'motion': {
                                iconOn = 'motion-sensor';
                                iconOff = 'motion-sensor';
                                iconUnstable = '';
                                adapterRole = 'iconNotText';
                                textOn = 'On';
                                textOff = 'Off';
                                break;
                            }
                            case 'door': {
                                adapterRole = 'iconNotText';
                                iconOn = 'door-open';
                                iconOff = 'door-closed';
                                iconUnstable = 'door-closed';
                                textOn = 'Opened';
                                textOff = 'Closed';
                                break;
                            }
                            case 'window': {
                                iconOn = 'window-open-variant';
                                iconOff = 'window-closed-variant';
                                iconUnstable = 'window-closed-variant';
                                adapterRole = 'iconNotText';
                                textOn = 'Opened';
                                textOff = 'Closed';
                                break;
                            }
                            case 'info': {
                                iconOn = 'information-outline';
                                iconOff = 'information-outline';
                                adapterRole = specialRole;
                                break;
                            }
                            case 'temperature':
                            case 'value.temperature': {
                                iconOn = 'thermometer';
                                iconOff = 'snowflake-thermometer';
                                iconUnstable = 'sun-thermometer';
                                adapterRole = specialRole;
                                const obj = (await this.existsState(`${item.id}.ACTUAL`))
                                    ? await this.adapter.getForeignObjectAsync(`${item.id}.ACTUAL`)
                                    : undefined;
                                commonUnit = obj && obj.common && obj.common.unit ? obj.common.unit : undefined;
                                break;
                            }
                            case 'humidity':
                            case 'value.humidity': {
                                iconOn = 'water-percent';
                                iconOff = 'water-off';
                                iconUnstable = 'water-percent-alert';
                                adapterRole = specialRole;
                                const o = (await this.existsState(`${item.id}.ACTUAL`))
                                    ? await this.adapter.getForeignObjectAsync(`${item.id}.ACTUAL`)
                                    : undefined;

                                commonUnit = o && o.common && o.common.unit ? o.common.unit : undefined;
                                break;
                            }
                        }
                        const tempItem: typePageItem.PageItemDataItemsOptions = {
                            type: 'text',
                            role: adapterRole,
                            data: {
                                icon: {
                                    true: {
                                        value: await this.getFieldAsDataItemConfig(item.icon || iconOn),

                                        color: await this.getIconColor(item.onColor, this.colorOn),
                                        text: {
                                            value: { type: 'state', dp: `${item.id}.ACTUAL` },
                                            unit: commonUnit ? { type: 'const', constVal: commonUnit } : undefined,
                                        },
                                    },
                                    false: {
                                        value: await this.getFieldAsDataItemConfig(item.icon2 || iconOff),
                                        color: await this.getIconColor(item.offColor, this.colorOff),
                                        text: {
                                            value: { type: 'state', dp: `${item.id}.ACTUAL` },
                                            unit: commonUnit ? { type: 'const', constVal: commonUnit } : undefined,
                                        },
                                    },
                                    unstable: {
                                        value: await this.getFieldAsDataItemConfig(item.icon3 || iconUnstable),
                                    },
                                    scale: item.colorScale ? { type: 'const', constVal: item.colorScale } : undefined,
                                    maxBri: undefined,
                                    minBri: undefined,
                                },
                                text1: {
                                    true: item.buttonText
                                        ? await this.getFieldAsDataItemConfig(item.buttonText)
                                        : (await this.existsState(`${item.id}.BUTTONTEXT`))
                                          ? { type: 'state', dp: `${item.id}.BUTTONTEXT` }
                                          : textOn
                                            ? { type: 'const', constVal: textOn }
                                            : { type: 'state', dp: `${item.id}.ACTUAL` },
                                    false: item.buttonTextOff
                                        ? await this.getFieldAsDataItemConfig(item.buttonTextOff)
                                        : (await this.existsState(`${item.id}.BUTTONTEXTOFF`))
                                          ? { type: 'state', dp: `${item.id}.BUTTONTEXTOFF` }
                                          : textOff
                                            ? { type: 'const', constVal: textOff }
                                            : item.buttonText
                                              ? await this.getFieldAsDataItemConfig(item.buttonText)
                                              : (await this.existsState(`${item.id}.BUTTONTEXT`))
                                                ? { type: 'state', dp: `${item.id}.BUTTONTEXT` }
                                                : { type: 'state', dp: `${item.id}.ACTUAL` },
                                },
                                text: {
                                    true: item.name
                                        ? await this.getFieldAsDataItemConfig(item.name)
                                        : commonName
                                          ? { type: 'const', constVal: commonName }
                                          : undefined,
                                },
                                entity1: {
                                    value: { type: 'triggered', dp: `${item.id}.ACTUAL` },
                                },
                                entity2:
                                    role === 'temperature' ||
                                    role === 'value.temperature' ||
                                    role === 'humidity' ||
                                    role === 'value.humidity'
                                        ? {
                                              value: { type: 'state', dp: `${item.id}.ACTUAL` },
                                              unit: commonUnit ? { type: 'const', constVal: commonUnit } : undefined,
                                          }
                                        : {
                                              value: { type: 'state', dp: `${item.id}.ACTUAL` },
                                          },
                            },
                        };
                        itemConfig = tempItem;
                        break;
                    }
                    case 'thermostat':
                        break;
                    case 'volumeGroup':
                    case 'volume': {
                        itemConfig = {
                            template: 'number.volume',
                            dpInit: item.id,
                            type: 'number',
                            role: specialRole,
                            color: {
                                true: await this.getIconColor(item.onColor, this.colorOn),
                                false: await this.getIconColor(item.offColor, this.colorOff),
                                scale: item.colorScale,
                            },
                            data: {
                                text: {
                                    true: item.name ? await this.getFieldAsDataItemConfig(item.name) : undefined,
                                },
                            },
                        };
                        break;
                    }
                    case 'warning':
                    case 'cie':
                    case 'buttonSensor':
                    case 'value.time':
                    case 'level.timer':
                    case 'value.alarmtime':
                    case 'level.mode.fan':
                    case 'lock':
                    case 'slider':
                    case 'switch.mode.wlan':
                    case 'media':
                    case 'airCondition': {
                        throw new Error(`DP: ${item.id} - Channel role ${role} not implemented yet!!`);
                        break;
                    }
                    default:
                        exhaustiveCheck(role);
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        throw new Error(`DP: ${item.id} - Channel role ${role} is not supported!!!`);
                }
                return itemConfig;
            }
            throw new Error(`Object ${item.id} not found!`);
        }
        return undefined;
    }

    async getScreensaverConfig(config: ScriptConfig.Config): Promise<pages.PageBaseConfig> {
        let pageItems: typePageItem.PageItemDataItemsOptions[] = [];
        if (config.bottomScreensaverEntity) {
            for (const item of config.bottomScreensaverEntity) {
                if (item) {
                    try {
                        pageItems.push(await this.getEntityData(item, 'bottom', config));
                    } catch (error: any) {
                        throw new Error(`bottomScreensaverEntity - ${error}`);
                    }
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
                    try {
                        pageItems.push(await this.getEntityData(item, 'indicator', config));
                    } catch (error: any) {
                        throw new Error(`indicatorScreensaverEntity - ${error}`);
                    }
                }
            }
        }
        if (config.leftScreensaverEntity) {
            for (const item of config.leftScreensaverEntity) {
                if (item) {
                    try {
                        pageItems.push(await this.getEntityData(item, 'left', config));
                    } catch (error: any) {
                        throw new Error(`leftScreensaverEntity - ${error}`);
                    }
                }
            }
        }
        if (config.mrIcon1ScreensaverEntity) {
            try {
                pageItems.push(await this.getMrEntityData(config.mrIcon1ScreensaverEntity, 'mricon', '1'));
            } catch (error: any) {
                throw new Error(`mrIcon1ScreensaverEntity - ${error}`);
            }
        }
        if (config.mrIcon2ScreensaverEntity) {
            try {
                pageItems.push(await this.getMrEntityData(config.mrIcon2ScreensaverEntity, 'mricon', '2'));
            } catch (error: any) {
                throw new Error(`mrIcon2ScreensaverEntity - ${error}`);
            }
        }
        this.log.debug(`Screensaver pageItems count: ${pageItems.length}`);
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

    /**
     * Checks if the required datapoints for a given role and item are present and valid.
     *
     * @param role - The role to check the datapoints for.
     * @param item - The item to check the datapoints for.
     * @param mode - The mode of checking, can be 'both', 'script', or 'feature'. Defaults to 'both'. 'script' and 'feature' will only check the respective datapoints.
     * @returns A promise that resolves to true if all required datapoints are present and valid, otherwise throws an error with mode='both'. Return false if mode='feature' or 'script'.
     * @throws Will throw an error if a required datapoint is missing or invalid and mode='both'.
     */
    async checkRequiredDatapoints(
        role: ScriptConfig.roles,
        item: ScriptConfig.PageItem,
        mode: 'both' | 'script' | 'feature' = 'both',
    ): Promise<boolean> {
        const _checkScriptDataPoints = async (
            role: ScriptConfig.roles,
            item: ScriptConfig.PageItem,
        ): Promise<boolean> => {
            let error = '';

            for (const dp in (requiredFeatureDatapoints[role] || {}).data) {
                try {
                    const o = dp !== '' ? await this.adapter.getForeignObjectAsync(`${item.id}.${dp}`) : undefined;

                    if (!o && !requiredScriptDataPoints[role].data[dp].required) {
                        continue;
                    }
                    if (
                        !o ||
                        !this.checkStringVsStringOrArray(requiredScriptDataPoints[role].data[dp].role, o.common.role) ||
                        (requiredScriptDataPoints[role].data[dp].type === 'mixed' &&
                            o.common.type !== requiredScriptDataPoints[role].data[dp].type) ||
                        (requiredScriptDataPoints[role].data[dp].writeable && !o.common.write)
                    ) {
                        if (!o) {
                            throw new Error(`Datapoint ${item.id}.${dp} is missing and is required for role ${role}!`);
                        } else {
                            throw new Error(
                                `Datapoint ${item.id}.${dp}:` +
                                    `${this.checkStringVsStringOrArray(requiredScriptDataPoints[role].data[dp].role, o.common.role) ? ` role: ${o.common.role} should be ${getStringOrArray(requiredScriptDataPoints[role].data[dp].role)})` : ''} ` +
                                    `${requiredScriptDataPoints[role].data[dp].type === 'mixed' || o.common.type !== requiredScriptDataPoints[role].data[dp].type ? ` type: ${o.common.type} should be ${requiredScriptDataPoints[role].data[dp].type}` : ''}` +
                                    `${!(requiredScriptDataPoints[role].data[dp].writeable && !o.common.write) ? ' must be writeable!' : ''} `,
                            );
                        }
                    }
                } catch (err: any) {
                    error += err;
                }
            }
            if (error) {
                throw new Error(error);
            }
            return true;
        };
        const _checkDataPoints = async (role: ScriptConfig.roles, item: ScriptConfig.PageItem): Promise<boolean> => {
            let error = '';
            for (const dp in (requiredFeatureDatapoints[role] || {}).data) {
                try {
                    const o = dp !== '' ? await this.adapter.getForeignObjectAsync(`${item.id}.${dp}`) : undefined;

                    if (!o && !requiredFeatureDatapoints[role].data[dp].required) {
                        continue;
                    }

                    if (
                        !o ||
                        !this.checkStringVsStringOrArray(requiredScriptDataPoints[role].data[dp].role, o.common.role) ||
                        (requiredFeatureDatapoints[role].data[dp].type === 'mixed' &&
                            o.common.type !== requiredFeatureDatapoints[role].data[dp].type)
                    ) {
                        if (!o) {
                            throw new Error(`Datapoint ${item.id}.${dp} is missing and is required for role ${role}!`);
                        } else {
                            throw new Error(
                                `Datapoint ${item.id}.${dp}:` +
                                    `${this.checkStringVsStringOrArray(requiredScriptDataPoints[role].data[dp].role, o.common.role) ? ` role: ${o.common.role} should be ${getStringOrArray(requiredFeatureDatapoints[role].data[dp].role)}` : ''} ` +
                                    `${requiredFeatureDatapoints[role].data[dp].type === 'mixed' || o.common.type !== requiredFeatureDatapoints[role].data[dp].type ? ` type: ${o.common.type} should be ${requiredFeatureDatapoints[role].data[dp].type}` : ''}` +
                                    `${!(requiredFeatureDatapoints[role].data[dp].writeable && !o.common.write) ? ' must be writeable!' : ''} `,
                            );
                        }
                    }
                } catch (err: any) {
                    error += err;
                }
            }
            if (error) {
                throw new Error(error);
            }
            return true;
        };
        if (mode === 'both' || mode === 'script') {
            try {
                if (await _checkScriptDataPoints(role, item)) {
                    return true;
                }
            } catch (error: any) {
                try {
                    if (await _checkDataPoints(role, item)) {
                        return true;
                    }
                } catch {
                    if (mode === 'both') {
                        throw new Error(error);
                    } else {
                        return false;
                    }
                }
                throw new Error(error);
            }
        } else {
            try {
                if (await _checkDataPoints(role, item)) {
                    return true;
                }
            } catch (error: any) {
                if (mode === 'feature') {
                    throw new Error(error);
                } else {
                    return false;
                }
            }
        }

        return true;
    }

    checkStringVsStringOrArray(item: string | string[], test: string | undefined): boolean {
        if (test === undefined) {
            return false;
        }
        if (Array.isArray(item)) {
            return item.includes(test);
        }
        return item === test;
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
        const result: typePageItem.PageItemDataItemsOptions = {
            modeScr: mode,
            type: 'text',
            data: { entity1: {} },
        };
        if (!result.data.entity1) {
            throw new Error('Invalid data');
        }
        result.data.entity2 = result.data.entity1;

        let obj;
        if (entity.ScreensaverEntity && !entity.ScreensaverEntity.endsWith('.')) {
            obj = await this.adapter.getObjectAsync(entity.ScreensaverEntity);
            result.data.entity1.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity, true);
        }
        const dataType = obj && obj.common && obj.common.type ? obj.common.type : undefined;
        if (entity.ScreensaverEntityUnitText || entity.ScreensaverEntityUnitText === '') {
            result.data.entity1.unit = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityUnitText);
        } else if (obj && obj.common && obj.common.unit) {
            result.data.entity1.unit = { type: 'const', constVal: obj.common.unit };
        }

        if (entity.ScreensaverEntityFactor) {
            result.data.entity1.factor = { type: 'const', constVal: entity.ScreensaverEntityFactor };
        }

        if (entity.ScreensaverEntityDecimalPlaces) {
            result.data.entity1.decimal = { type: 'const', constVal: entity.ScreensaverEntityDecimalPlaces };
        }
        if (entity.ScreensaverEntityDateFormat) {
            result.data.entity1.dateFormat = {
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
        } else if (entity.ScreensaverEntityOffColor !== null) {
            colorOff = await this.getIconColor(defaultColors.defaultOffColor);
        }

        if (entity.ScreensaverEntityIconOn) {
            result.data.icon = {
                true: { value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOn) },
            };
        }
        if (
            dataType === 'number' &&
            entity.ScreensaverEntityIconSelect &&
            Array.isArray(entity.ScreensaverEntityIconSelect)
        ) {
            const obj = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity);
            if (obj && obj.type === 'state') {
                entity.ScreensaverEntityIconSelect.sort((a, b) => a.value - b.value);
                obj.read = `
                const items = [${entity.ScreensaverEntityIconSelect.map(item => `{${item.value}, ${item.icon}}`).join(', ')}];
                for (let i = 1; i < items.length; i++) {
                    if (val <= items[i].val) {return items[i].icon;}
                }
                return items[items.length - 1].icon;`;

                result.data.icon = {
                    ...result.data.icon,
                    true: {
                        value: obj,
                    },
                };
            }
        }
        if (color) {
            result.data.icon = result.data.icon || {};
            result.data.icon.true = result.data.icon.true || {};
            result.data.icon.true.color = color;
        }

        if (entity.ScreensaverEntityIconOff) {
            result.data.icon = {
                ...result.data.icon,
                ...{
                    false: { value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOff) },
                },
            };
        }
        if (color) {
            result.data.icon = result.data.icon || {};
            result.data.icon.false = result.data.icon.false || {};
            result.data.icon.false.color = colorOff;
        }
        if (entity.ScreensaverEntityIconColor && isIconScaleElement(entity.ScreensaverEntityIconColor)) {
            result.data.icon = {
                ...result.data.icon,
                scale: {
                    type: 'const',
                    constVal: entity.ScreensaverEntityIconColor,
                },
            };
        }

        if (entity.ScreensaverEntityOnText) {
            result.data.text = { true: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityOnText) };
        } else if (entity.ScreensaverEntityText) {
            result.data.text = { true: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityText) };
        }

        if (entity.ScreensaverEntityOffText) {
            result.data.text = { false: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityOffText) };
        }

        if (isPageItemDataItemsOptions(result)) {
            return result;
        }
        throw new Error('Invalid data');
    }

    async getFieldAsDataItemConfig(
        possibleId: string | ScriptConfig.RGB,
        isTrigger: boolean = false,
    ): Promise<Types.DataItemsOptions> {
        const state =
            Color.isScriptRGB(possibleId) || possibleId === '' || possibleId.endsWith('.')
                ? undefined
                : await this.adapter.getForeignStateAsync(possibleId);

        if (!Color.isScriptRGB(possibleId) && state !== undefined && state !== null) {
            if (isTrigger) {
                return { type: 'triggered', dp: possibleId };
            }
            return { type: 'state', dp: possibleId };
        }
        return { type: 'const', constVal: possibleId };
    }

    async getIconColor(
        item: ScriptConfig.RGB | RGB | ScriptConfig.IconScaleElement | string | undefined,
        def: ScriptConfig.RGB | RGB | undefined = undefined,
    ): Promise<Types.DataItemsOptions | undefined> {
        if (isIconScaleElement(item)) {
            //later
        } else if (typeof item === 'string') {
            return await this.getFieldAsDataItemConfig(item);
        } else if (Color.isRGB(item)) {
            return { type: 'const', constVal: item };
        } else if (Color.isScriptRGB(item)) {
            return { type: 'const', constVal: Color.convertScriptRGBtoRGB(item) };
        } else if (Color.isRGB(def)) {
            return { type: 'const', constVal: def };
        } else if (Color.isScriptRGB(def)) {
            return { type: 'const', constVal: Color.convertScriptRGBtoRGB(def) };
        }
        this.adapter.log.error(`Invalid color value: ${JSON.stringify(item)}`);
        return undefined;
    }
    async existsState(id: string): Promise<boolean> {
        return (await this.adapter.getForeignStateAsync(id)) !== null;
    }
}

function isIconScaleElement(obj: any): obj is ScriptConfig.IconScaleElement {
    return obj && obj.val_min !== undefined && obj.val_max !== undefined;
}
function isPageItemDataItemsOptions(obj: any): obj is typePageItem.PageItemDataItemsOptions {
    return obj && obj.modeScr && obj.data;
}
