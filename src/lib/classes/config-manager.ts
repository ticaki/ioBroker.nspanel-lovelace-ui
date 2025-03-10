import { BaseClass } from './library';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import type * as typePageItem from '../types/type-pageItem';
import type * as Types from '../types/types';
import { Color, type RGB } from '../const/Color';
import type * as pages from '../types/pages';
import {
    defaultConfig,
    isButton,
    isConfig,
    requiredFeatureDatapoints,
    requiredScriptDataPoints,
} from '../const/config-manager-const';
import type { panelConfigPartial } from '../controller/panel';
import { exhaustiveCheck } from '../types/pages';
import { isNavigationItemConfigArray, type NavigationItemConfig } from './navigation';
import { getStringOrArray } from '../tools/readme';
import { PageQR } from '../pages/pageQR';
import type { StatesControler } from '../controller/states-controller';

export class ConfigManager extends BaseClass {
    //private test: ConfigManager.DeviceState;
    colorOn: RGB = Color.On;
    colorOff: RGB = Color.Off;
    colorDefault: RGB = Color.Off;
    dontWrite: boolean = false;

    readonly scriptVersion = '0.6.0';
    readonly breakingVersion = '0.2.0';

    statesController: StatesControler | undefined;
    constructor(adapter: NspanelLovelaceUi, dontWrite: boolean = false) {
        super(adapter, 'config-manager');
        this.dontWrite = dontWrite;
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
     * If any errors occur during the process, they are logged and included in the returned messages..
     */
    async setScriptConfig(configuration: any): Promise<{
        messages: string[];
        panelConfig:
            | (Omit<Partial<panelConfigPartial>, 'pages' | 'navigation'> & {
                  navigation: NavigationItemConfig[];
                  pages: pages.PageBaseConfig[];
              })
            | undefined;
    }> {
        configuration.advancedOptions = Object.assign(
            defaultConfig.advancedOptions || {},
            configuration.advancedOptions || {},
        );
        const config = Object.assign(defaultConfig, configuration);
        if (!config || !isConfig(config)) {
            this.log.error(
                `Invalid configuration from Script: ${config ? config.panelName || config.panelTopic || JSON.stringify(config) : 'undefined'}`,
            );
            return { messages: ['Invalid configuration'], panelConfig: undefined };
        }
        let messages: string[] = [];

        this.log.info(`Start converting configuration for ${config.panelName || config.panelTopic}`);

        const version = config.version
            .split('.')
            .map((item, i) => parseInt(item) * Math.pow(100, 2 - i))
            .reduce((a, b) => a + b);

        const requiredVersion = this.scriptVersion
            .split('.')
            .map((item, i) => parseInt(item) * Math.pow(100, 2 - i))
            .reduce((a, b) => a + b);

        const breakingVersion = this.breakingVersion
            .split('.')
            .map((item, i) => parseInt(item) * Math.pow(100, 2 - i))
            .reduce((a, b) => a + b);

        if (version < breakingVersion) {
            messages.push(
                `Update Script! Panel for Topic: ${config.panelTopic} Script version ${config.version} is too low! Aborted! Required version is >=${this.breakingVersion}!`,
            );
            this.log.error(messages[messages.length - 1]);
            return { messages: ['Invalid configuration'], panelConfig: undefined };
        }
        if (version < requiredVersion) {
            messages.push(
                `Update Script! Panel for Topic: ${config.panelTopic} Script version ${config.version} is lower than the required version ${this.scriptVersion}!`,
            );
            this.log.warn(messages[messages.length - 1]);
        } else if (version > requiredVersion) {
            messages.push(
                `Update Adapter! Panel for Topic: ${config.panelTopic} Script version ${config.version} is higher than the required version ${this.scriptVersion}!`,
            );
            this.log.warn(messages[messages.length - 1]);
        } else {
            messages.push(`Panel for Topic: ${config.panelTopic} Script version ${config.version} is correct!`);
        }
        let panelConfig: Omit<Partial<panelConfigPartial>, 'pages' | 'navigation'> & {
            navigation: NavigationItemConfig[];
            pages: pages.PageBaseConfig[];
        } = { pages: [], navigation: [] };

        if (!config.panelTopic) {
            this.log.error(`Required field panelTopic is missing in ${config.panelName || 'unknown'}!`);
            messages.push('Required field panelTopic is missing');
            return { messages: messages, panelConfig: undefined };
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
        if (config.defaultOnColor) {
            this.colorOn = Color.convertScriptRGBtoRGB(config.defaultOnColor);
        }
        if (config.defaultOffColor) {
            this.colorOff = Color.convertScriptRGBtoRGB(config.defaultOffColor);
        }

        // Screensaver configuration
        try {
            const screensaver = await this.getScreensaverConfig(config);
            if (
                screensaver &&
                screensaver.config &&
                (screensaver.config.card === 'screensaver' ||
                    screensaver.config.card === 'screensaver2' ||
                    screensaver.config.card === 'screensaver3') &&
                config.advancedOptions
            ) {
                screensaver.config.screensaverSwipe = !!config.advancedOptions.screensaverSwipe;
                screensaver.config.screensaverIndicatorButtons = !!config.advancedOptions.screensaverIndicatorButtons;
            }
            panelConfig.pages.push(screensaver);
        } catch (error: any) {
            messages.push(`Screensaver configuration error - ${error}`);
            this.log.warn(messages[messages.length - 1]);
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
                panelConfig.navigation = panelConfig.navigation.filter(item => item != null);
                panelConfig.navigation = panelConfig.navigation.map((item, index, array) => {
                    if (index === 0) {
                        return {
                            ...item!,
                            left: { single: array[array.length - 1]!.name },
                            right: { single: array[index + 1]!.name },
                        };
                    } else if (index === array.length - 1) {
                        return {
                            ...item!,
                            left: { single: array[index - 1]!.name },
                            right: { single: array[0]!.name },
                        };
                    }
                    return {
                        ...item!,
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
            return { messages, panelConfig: undefined };
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
        // buttons
        if (isButton(config.buttonLeft)) {
            panelConfig.buttons = panelConfig.buttons || { left: null, right: null };
            panelConfig.buttons.left = config.buttonLeft;
        } else {
            messages.push(`Button left wrong configured!`);
            this.log.warn(messages[messages.length - 1]);
        }
        if (isButton(config.buttonRight)) {
            panelConfig.buttons = panelConfig.buttons || { left: null, right: null };
            panelConfig.buttons.right = config.buttonRight;
        } else {
            messages.push(`Button right wrong configured!`);
            this.log.warn(messages[messages.length - 1]);
        }

        const obj = await this.adapter.getForeignObjectAsync(this.adapter.namespace);

        if (obj && !this.dontWrite) {
            if (!obj.native.scriptConfigRaw || !Array.isArray(obj.native.scriptConfigRaw)) {
                obj.native.scriptConfigRaw = [];
            }

            // remove duplicates
            obj.native.scriptConfigRaw = obj.native.scriptConfigRaw.filter(
                (item: any, i: number) =>
                    obj.native.scriptConfigRaw.findIndex((item2: any) => item2.panelTopic === item.panelTopic) === i,
            );
            // remove config with same topic and different name
            obj.native.scriptConfigRaw = obj.native.scriptConfigRaw.filter(
                (item: any) => item.panelTopic !== configuration.panelTopic,
            );
            obj.native.scriptConfigRaw = obj.native.scriptConfigRaw.filter(
                (item: any) => this.adapter.config.panels.findIndex(a => a.topic === item.panelTopic) !== -1,
            );

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

            obj.native.scriptConfigRaw.push(configuration);
            obj.native.scriptConfig.push(panelConfig);
            await this.adapter.setForeignObjectAsync(this.adapter.namespace, obj);
        }
        messages.push(`done`);
        return { messages: messages.map(a => a.replaceAll('Error: ', '')), panelConfig };
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
                    page.type !== 'cardThermo' &&
                    page.type !== 'cardQR'
                ) {
                    const msg = `${page.heading || 'unknown'} with card type ${page.type} not implemented yet!`;
                    messages.push(msg);
                    this.log.warn(msg);
                    continue;
                }
                if (!page.uniqueName) {
                    messages.push(
                        `Page ${'heading' in page && page.heading ? page.heading : page.type || 'unknown'} has no uniqueName!`,
                    );
                    this.log.error(messages[messages.length - 1]);
                    continue;
                }

                if ((config.subPages || []).includes(page)) {
                    const left = page.prev || page.parent || undefined;
                    const right = page.next || page.home || undefined;

                    const navItem: NavigationItemConfig = {
                        name: page.uniqueName,
                        left: left ? (page.prev ? { single: left } : { double: left }) : undefined,
                        right: right ? (page.next ? { single: right } : { double: right }) : undefined,
                        page: page.uniqueName,
                    };
                    panelConfig.navigation.push(navItem);
                }

                if (page.type === 'cardQR') {
                    const index = this.adapter.config.pageQRdata.findIndex(item => item.pageName === page.uniqueName);
                    if (index === -1) {
                        messages.push(`No pageQRdata found for ${page.uniqueName}`);
                        this.log.warn(messages[messages.length - 1]);
                        continue;
                    }
                    panelConfig.pages.push(await PageQR.getQRPageConfig(this.adapter, index, this));
                    continue;
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
                            this.log.warn(messages[messages.length - 1]);
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
            this.log.warn(msg);
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

        const obj = item.id && !item.id.endsWith('.') ? await this.adapter.getForeignObjectAsync(item.id) : undefined;
        const role = obj && obj.common.role ? (obj.common.role as ScriptConfig.roles) : undefined;
        const commonName =
            obj && obj.common
                ? typeof obj.common.name === 'string'
                    ? obj.common.name
                    : obj.common.name[this.library.getLocalLanguage()]
                : undefined;

        const getButtonsTextTrue = async (
            item: ScriptConfig.PageItem,
            def1: string,
        ): Promise<Types.DataItemsOptions> => {
            return item.buttonText
                ? await this.getFieldAsDataItemConfig(item.buttonText)
                : (await this.existsState(`${item.id}.BUTTONTEXT`))
                  ? { type: 'triggered', dp: `${item.id}.BUTTONTEXT` }
                  : await this.getFieldAsDataItemConfig(item.name || commonName || def1);
        };
        const getButtonsTextFalse = async (
            item: ScriptConfig.PageItem,
            def1: string = '',
        ): Promise<Types.DataItemsOptions> => {
            return item.buttonTextOff
                ? await this.getFieldAsDataItemConfig(item.buttonTextOff)
                : (await this.existsState(`${item.id}.BUTTONTEXTOFF`))
                  ? { type: 'triggered', dp: `${item.id}.BUTTONTEXTOFF` }
                  : item.buttonText
                    ? await this.getFieldAsDataItemConfig(item.buttonText)
                    : (await this.existsState(`${item.id}.BUTTONTEXT`))
                      ? { type: 'triggered', dp: `${item.id}.BUTTONTEXT` }
                      : await this.getFieldAsDataItemConfig(item.name || commonName || def1);
        };
        const text = {
            true: await getButtonsTextTrue(item, role || ''),
            false: await getButtonsTextFalse(item, role || ''),
        };

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
                        true: { type: 'const', constVal: 'on' },
                        false: { type: 'const', constVal: 'off' },
                    },
                    text: text,
                },
            };
        }

        if (obj && (!obj.common || !obj.common.role)) {
            throw new Error(`Role missing in ${item.id}!`);
        }

        // check if role and types are correct
        if (role) {
            if (!(await this.checkRequiredDatapoints(role, item))) {
                return;
            }
        }

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
                        text1: {
                            true: { type: 'const', constVal: 'on' },
                            false: { type: 'const', constVal: 'off' },
                        },
                        text: text,
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
                        text1: {
                            true: { type: 'const', constVal: 'on' },
                            false: { type: 'const', constVal: 'off' },
                        },
                        text: text,
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
                        icon: {
                            true: item.icon ? { type: 'const', constVal: item.icon } : undefined,
                            false: item.icon2 ? { type: 'const', constVal: item.icon2 } : undefined,
                        },
                        template: 'button.humidity',
                        data: {
                            text: text,

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
                    icon: {
                        true: item.icon ? { type: 'const', constVal: item.icon } : undefined,
                        false: item.icon2 ? { type: 'const', constVal: item.icon2 } : undefined,
                    },
                    data: {
                        text: text,
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
                        icon: {
                            true: item.icon ? { type: 'const', constVal: item.icon } : undefined,
                            false: item.icon2 ? { type: 'const', constVal: item.icon2 } : undefined,
                        },
                        data: {
                            text: text,
                            text1: {
                                true: { type: 'const', constVal: 'opened' },
                                false: { type: 'const', constVal: 'closed' },
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
                        icon: {
                            true: item.icon ? { type: 'const', constVal: item.icon } : undefined,
                            false: item.icon2 ? { type: 'const', constVal: item.icon2 } : undefined,
                        },
                        data: {
                            text: text,
                            text1: {
                                true: { type: 'const', constVal: 'opened' },
                                false: { type: 'const', constVal: 'closed' },
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
                    icon: {
                        true: item.icon ? { type: 'const', constVal: item.icon } : undefined,
                        false: item.icon2 ? { type: 'const', constVal: item.icon2 } : undefined,
                    },
                    data: {
                        text1: {
                            true: { type: 'const', constVal: 'opened' },
                            false: { type: 'const', constVal: 'closed' },
                        },
                        text: text,
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
                    icon: {
                        true: item.icon ? { type: 'const', constVal: item.icon } : undefined,
                        false: item.icon2 ? { type: 'const', constVal: item.icon2 } : undefined,
                    },
                    data: {
                        text1: {
                            true: { type: 'const', constVal: 'opened' },
                            false: { type: 'const', constVal: 'closed' },
                        },
                        text: text,

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
                    icon: {
                        true: item.icon ? { type: 'const', constVal: item.icon } : undefined,
                        false: item.icon2 ? { type: 'const', constVal: item.icon2 } : undefined,
                    },
                    data: {
                        text1: {
                            true: { type: 'const', constVal: 'motion' },
                            false: { type: 'const', constVal: 'none' },
                        },
                        text: text,

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
                    icon: {
                        true: item.icon ? { type: 'const', constVal: item.icon } : undefined,
                        false: item.icon2 ? { type: 'const', constVal: item.icon2 } : undefined,
                    },
                    data: {
                        text: text,

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
                    icon: {
                        true: item.icon ? { type: 'const', constVal: item.icon } : undefined,
                        false: item.icon2 ? { type: 'const', constVal: item.icon2 } : undefined,
                    },
                    data: {
                        text: text,

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
                    role: 'info',
                    color: {
                        true: await this.getIconColor(item.onColor || `${item.id}.COLORDEC`, this.colorOn),
                        false: await this.getIconColor(item.offColor || `${item.id}.COLORDEC`, this.colorOff),
                        scale: item.colorScale,
                    },
                    icon: {
                        true: item.icon ? { type: 'const', constVal: item.icon } : undefined,
                        false: item.icon2
                            ? { type: 'const', constVal: item.icon2 }
                            : item.icon
                              ? { type: 'const', constVal: item.icon }
                              : undefined,
                    },
                    data: {
                        text: text,
                        text1: {
                            true: {
                                type: 'state',
                                dp: `${item.id}.ACTUAL`,
                            },

                            false: null,
                        },
                        entity1: {
                            value: { type: 'triggered', dp: `${item.id}.ACTUAL` },
                        },

                        entity2: {
                            value: { type: 'state', dp: `${item.id}.ACTUAL` },
                        },
                        setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                    },
                };
                break;
            }
            case 'blind': {
                itemConfig = {
                    template: 'text.shutter.navigation',
                    dpInit: item.id,
                    type: 'button',
                    color: {
                        true: await this.getIconColor(item.onColor || `${item.id}.COLORDEC`, this.colorOn),
                        false: await this.getIconColor(item.offColor || `${item.id}.COLORDEC`, this.colorOff),
                        scale: item.colorScale ?? { val_min: 0, val_max: 100 },
                    },
                    icon: {
                        true: item.icon ? { type: 'const', constVal: item.icon } : undefined,
                        false: item.icon2 ? { type: 'const', constVal: item.icon2 } : undefined,
                    },
                    data: {
                        text1: {
                            true: { type: 'const', constVal: 'opened' },
                            false: { type: 'const', constVal: 'closed' },
                        },
                        text: text,
                        entity1: {
                            value: { type: 'triggered', dp: `${item.id}.ACTUAL` },
                            minScale: { type: 'const', constVal: item.minValueLevel ?? 0 },
                            maxScale: { type: 'const', constVal: item.maxValueLevel ?? 100 },
                        },
                        setNavi: item.targetPage ? await this.getFieldAsDataItemConfig(item.targetPage) : undefined,
                    },
                };
                break;
            }
            case 'airCondition':
            case 'lock':
            case 'slider':
            case 'buttonSensor':
            case 'value.time':
            case 'level.timer':
            case 'value.alarmtime':
            case 'level.mode.fan':
            case 'switch.mode.wlan':
            case 'media':
            case 'timeTable':
            case 'cie': {
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

                const getButtonsTextTrue = async (
                    item: ScriptConfig.PageItem,
                    def1: string,
                ): Promise<Types.DataItemsOptions> => {
                    return item.buttonText
                        ? await this.getFieldAsDataItemConfig(item.buttonText)
                        : (await this.existsState(`${item.id}.BUTTONTEXT`))
                          ? { type: 'triggered', dp: `${item.id}.BUTTONTEXT` }
                          : await this.getFieldAsDataItemConfig(item.name || commonName || def1);
                };
                const getButtonsTextFalse = async (
                    item: ScriptConfig.PageItem,
                    def1: string = '',
                ): Promise<Types.DataItemsOptions> => {
                    return item.buttonTextOff
                        ? await this.getFieldAsDataItemConfig(item.buttonTextOff)
                        : (await this.existsState(`${item.id}.BUTTONTEXTOFF`))
                          ? { type: 'triggered', dp: `${item.id}.BUTTONTEXTOFF` }
                          : item.buttonText
                            ? await this.getFieldAsDataItemConfig(item.buttonText)
                            : (await this.existsState(`${item.id}.BUTTONTEXT`))
                              ? { type: 'triggered', dp: `${item.id}.BUTTONTEXT` }
                              : await this.getFieldAsDataItemConfig(item.name || commonName || def1);
                };
                const text = {
                    true: await getButtonsTextTrue(item, role || ''),
                    false: await getButtonsTextFalse(item, role || ''),
                };
                const headline = await getButtonsTextTrue(item, role || '');

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
                            role: 'light',
                            data: {
                                icon: {
                                    true: {
                                        value: {
                                            type: 'const',
                                            constVal:
                                                item.icon || (role === 'socket' ? 'power-socket-de' : 'lightbulb'),
                                        },
                                        color: await this.getIconColor(item.onColor, this.colorOn),
                                    },
                                    false: {
                                        value: {
                                            type: 'const',
                                            constVal:
                                                item.icon2 ||
                                                (role === 'socket' ? 'power-socket-de' : 'lightbulb-outline'),
                                        },
                                        color: await this.getIconColor(item.offColor, this.colorOff),
                                    },
                                    scale: item.colorScale ? { type: 'const', constVal: item.colorScale } : undefined,
                                    maxBri: undefined,
                                    minBri: undefined,
                                },
                                colorMode: { type: 'const', constVal: false },
                                headline: headline,
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
                                headline: headline,
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
                                headline: headline,
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
                                text: text,

                                text1: {
                                    true: { type: 'const', constVal: 'on' },
                                    false: { type: 'const', constVal: 'off' },
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
                                    scale: { type: 'const', constVal: item.colorScale ?? { val_min: 0, val_max: 100 } },
                                    maxBri: undefined,
                                    minBri: undefined,
                                },
                                text: text,
                                headline: headline,

                                entity1: {
                                    value: { type: 'triggered', dp: `${item.id}.ACTUAL` },
                                    minScale: { type: 'const', constVal: item.minValueLevel ?? 0 },

                                    maxScale: { type: 'const', constVal: item.maxValueLevel ?? 100 },

                                    set: { type: 'state', dp: `${item.id}.SET` },
                                },
                                entity2: {
                                    value: { type: 'triggered', dp: `${item.id}.TILT_ACTUAL` },
                                    minScale: { type: 'const', constVal: item.minValueTilt ?? 100 },

                                    maxScale: { type: 'const', constVal: item.maxValueTilt ?? 0 },

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
                                    text: text,
                                    headline: headline,

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
                                textOn = 'on';
                                textOff = 'off';
                                break;
                            }
                            case 'door': {
                                adapterRole = 'iconNotText';
                                iconOn = 'door-open';
                                iconOff = 'door-closed';
                                iconUnstable = 'door-closed';
                                textOn = 'opened';
                                textOff = 'closed';
                                break;
                            }
                            case 'window': {
                                iconOn = 'window-open-variant';
                                iconOff = 'window-closed-variant';
                                iconUnstable = 'window-closed-variant';
                                adapterRole = 'iconNotText';
                                textOn = 'opened';
                                textOff = 'closed';
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
                                        text: (await this.existsState(`${item.id}.ACTUAL`))
                                            ? {
                                                  value: { type: 'state', dp: `${item.id}.ACTUAL` },
                                                  unit: commonUnit
                                                      ? { type: 'const', constVal: commonUnit }
                                                      : undefined,
                                              }
                                            : undefined,
                                    },
                                    false: {
                                        value: await this.getFieldAsDataItemConfig(item.icon2 || iconOff),
                                        color: await this.getIconColor(item.offColor, this.colorOff),
                                        text: (await this.existsState(`${item.id}.ACTUAL`))
                                            ? {
                                                  value: { type: 'state', dp: `${item.id}.ACTUAL` },
                                                  unit: commonUnit
                                                      ? { type: 'const', constVal: commonUnit }
                                                      : undefined,
                                              }
                                            : undefined,
                                    },
                                    unstable: {
                                        value: await this.getFieldAsDataItemConfig(item.icon3 || iconUnstable),
                                    },
                                    scale: item.colorScale ? { type: 'const', constVal: item.colorScale } : undefined,
                                    maxBri: undefined,
                                    minBri: undefined,
                                },
                                text1: textOn
                                    ? {
                                          true: { type: 'const', constVal: textOn },
                                          false: textOff ? { type: 'const', constVal: textOff } : undefined,
                                      }
                                    : undefined,
                                text: text,
                                entity1: {
                                    value: { type: 'triggered', dp: `${item.id}.ACTUAL` },
                                },
                                entity2:
                                    role === 'temperature' ||
                                    role === 'value.temperature' ||
                                    role === 'humidity' ||
                                    role === 'value.humidity' ||
                                    role === 'info'
                                        ? {
                                              value: { type: 'state', dp: `${item.id}.ACTUAL` },
                                              unit: commonUnit ? { type: 'const', constVal: commonUnit } : undefined,
                                          }
                                        : undefined,
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
                            icon: {
                                true: item.icon ? { type: 'const', constVal: item.icon } : undefined,
                                false: item.icon2 ? { type: 'const', constVal: item.icon2 } : undefined,
                            },
                            data: {
                                text: text,
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
        if (config.favoritScreensaverEntity) {
            for (const item of config.favoritScreensaverEntity) {
                if (item) {
                    try {
                        pageItems.push(await this.getEntityData(item, 'favorit', config));
                    } catch (error: any) {
                        throw new Error(`favoritScreensaverEntity - ${error}`);
                    }
                }
            }
        }
        if (config.alternateScreensaverEntity) {
            for (const item of config.alternateScreensaverEntity) {
                if (item) {
                    try {
                        pageItems.push(await this.getEntityData(item, 'alternate', config));
                    } catch (error: any) {
                        throw new Error(`alternateScreensaverEntity - ${error}`);
                    }
                }
            }
        }
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
                if (pageItems.findIndex(x => x.modeScr === 'favorit') === -1) {
                    pageItems.push({
                        template: 'text.accuweather.favorit',
                        dpInit: `/^accuweather\\.${instance}.+/`,
                        modeScr: 'favorit',
                    });
                }
                if (config.weatherAddDefaultItems) {
                    pageItems = pageItems.concat([
                        // Bottom 1 - accuWeather.0. Forecast Day 1
                        {
                            template: 'text.accuweather.sunriseset',
                            dpInit: `/^accuweather\\.${instance}.Daily.+/`,
                            modeScr: 'bottom',
                        },
                        // Bottom 2 - accuWeather.0. Forecast Day 1
                        {
                            template: 'text.accuweather.bot2values',
                            dpInit: `/^accuweather\\.${instance}.+?d1$/g`,
                            modeScr: 'bottom',
                        },

                        // Bottom 3 - accuWeather.0. Forecast Day 2
                        {
                            template: 'text.accuweather.bot2values',
                            dpInit: `/^accuweather\\.${instance}.+?d2$/`,
                            modeScr: 'bottom',
                        },

                        // Bottom 4 - accuWeather.0. Forecast Day 3
                        {
                            template: 'text.accuweather.bot2values',
                            dpInit: `/^accuweather\\.${instance}.+?d3$/`,
                            modeScr: 'bottom',
                        },

                        // Bottom 5 - accuWeather.0. Forecast Day 4
                        {
                            template: 'text.accuweather.bot2values',
                            dpInit: `/^accuweather\\.${instance}.+?d4$/`,
                            modeScr: 'bottom',
                        },
                        // Bottom 6 - accuWeather.0. Forecast Day 5
                        {
                            template: 'text.accuweather.bot2values',
                            dpInit: `/^accuweather\\.${instance}.+?d5$/`,
                            modeScr: 'bottom',
                        },

                        // Bottom 7 - Windgeschwindigkeit
                        {
                            template: 'text.accuweather.windspeed',
                            dpInit: `/^accuweather\\.${instance}./`,
                            modeScr: 'bottom',
                        },

                        // Bottom 8 - Böen
                        {
                            template: 'text.accuweather.windgust',
                            dpInit: `/^accuweather\\.${instance}./`,
                            modeScr: 'bottom',
                        },

                        // Bottom 9 - Windrichtung
                        {
                            template: 'text.accuweather.winddirection',
                            dpInit: `/^accuweather\\.${instance}./`,
                            modeScr: 'bottom',
                        },

                        // Bottom 10 - UV-Index
                        {
                            template: 'text.accuweather.uvindex',
                            dpInit: `/^accuweather\\.${instance}./`,
                            modeScr: 'bottom',
                        },
                    ]);
                }
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
                pageItems.push(await this.getMrEntityData(config.mrIcon1ScreensaverEntity, 'mricon'));
            } catch (error: any) {
                throw new Error(`mrIcon1ScreensaverEntity - ${error}`);
            }
        }
        if (config.mrIcon2ScreensaverEntity) {
            try {
                pageItems.push(await this.getMrEntityData(config.mrIcon2ScreensaverEntity, 'mricon'));
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
                screensaverIndicatorButtons: false,
                screensaverSwipe: false,
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
            if (!requiredScriptDataPoints[role]) {
                throw new Error(`Role ${role} is not supported!`);
            }
            for (const dp in (requiredScriptDataPoints[role] || {}).data) {
                try {
                    const o =
                        dp !== '' && !dp.endsWith('.')
                            ? await this.adapter.getForeignObjectAsync(`${item.id}.${dp}`)
                            : undefined;

                    if (!o && !requiredScriptDataPoints[role].data[dp].required) {
                        continue;
                    }
                    if (
                        !o ||
                        !this.checkStringVsStringOrArray(requiredScriptDataPoints[role].data[dp].role, o.common.role) ||
                        (requiredScriptDataPoints[role].data[dp].type !== 'mixed' &&
                            o.common.type !== requiredScriptDataPoints[role].data[dp].type) ||
                        (requiredScriptDataPoints[role].data[dp].writeable && !o.common.write)
                    ) {
                        if (!o) {
                            throw new Error(`Datapoint ${item.id}.${dp} is missing and is required for role ${role}!`);
                        } else {
                            throw new Error(
                                `Datapoint ${item.id}.${dp}:` +
                                    `${!this.checkStringVsStringOrArray(requiredScriptDataPoints[role].data[dp].role, o.common.role) ? ` role: ${o.common.role} should be ${getStringOrArray(requiredScriptDataPoints[role].data[dp].role)})` : ''} ` +
                                    `${requiredScriptDataPoints[role].data[dp].type !== 'mixed' && o.common.type !== requiredScriptDataPoints[role].data[dp].type ? ` type: ${o.common.type} should be ${requiredScriptDataPoints[role].data[dp].type}` : ''}` +
                                    `${requiredScriptDataPoints[role].data[dp].writeable && !o.common.write ? ' must be writeable!' : ''} `,
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
            if (!requiredFeatureDatapoints[role]) {
                return false;
            }
            for (const dp in (requiredFeatureDatapoints[role] || {}).data) {
                try {
                    const o = dp !== '' ? await this.adapter.getForeignObjectAsync(`${item.id}.${dp}`) : undefined;

                    if (!o && !requiredFeatureDatapoints[role].data[dp].required) {
                        continue;
                    }

                    if (
                        !o ||
                        !this.checkStringVsStringOrArray(
                            requiredFeatureDatapoints[role].data[dp].role,
                            o.common.role,
                        ) ||
                        (requiredFeatureDatapoints[role].data[dp].type !== 'mixed' &&
                            o.common.type !== requiredFeatureDatapoints[role].data[dp].type)
                    ) {
                        if (!o) {
                            throw new Error(`Datapoint ${item.id}.${dp} is missing and is required for role ${role}!`);
                        } else {
                            throw new Error(
                                `Datapoint ${item.id}.${dp}:` +
                                    `${!this.checkStringVsStringOrArray(requiredFeatureDatapoints[role].data[dp].role, o.common.role) ? ` role: ${o.common.role} should be ${getStringOrArray(requiredFeatureDatapoints[role].data[dp].role)}` : ''} ` +
                                    `${requiredFeatureDatapoints[role].data[dp].type !== 'mixed' && o.common.type !== requiredFeatureDatapoints[role].data[dp].type ? ` type: ${o.common.type} should be ${requiredFeatureDatapoints[role].data[dp].type}` : ''}` +
                                    `${requiredFeatureDatapoints[role].data[dp].writeable && !o.common.write ? ' must be writeable!' : ''} `,
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
    ): Promise<typePageItem.PageItemDataItemsOptions> {
        const result: Partial<typePageItem.PageItemDataItemsOptions> = {
            modeScr: mode,
            type: 'text',
            data: { entity1: {} },
        };
        if (entity.type === 'native') {
            const temp = JSON.parse(JSON.stringify(entity.native)) as typePageItem.PageItemDataItemsOptions;
            temp.type = undefined;
            return temp;
        } else if (entity.type === 'template') {
            const temp = JSON.parse(JSON.stringify(entity)) as unknown as typePageItem.PageItemDataItemsOptions;
            temp.type = undefined;
            return temp;
        }
        if (
            entity.ScreensaverEntity &&
            entity.ScreensaverEntity !== `Relay.2` &&
            entity.ScreensaverEntity !== `Relay.1`
        ) {
            result.data!.entity1!.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity, true);
        } else if (entity.ScreensaverEntity) {
            result.data!.entity1!.value = {
                type: 'internal',
                dp: `cmd/power${entity.ScreensaverEntity === `Relay.2` ? 2 : 1}`,
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
            result.data!.icon.false!.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityIconOff);
        }
        if (entity.ScreensaverEntityValue) {
            result.data!.icon.false!.text = {
                value: await this.getFieldAsDataItemConfig(entity.ScreensaverEntityValue, true),
                unit: entity.ScreensaverEntityValueUnit
                    ? await this.getFieldAsDataItemConfig(entity.ScreensaverEntityValueUnit)
                    : undefined,
                decimal:
                    entity.ScreensaverEntityValueDecimalPlace != null
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

        if (entity.type === 'native') {
            const temp = JSON.parse(JSON.stringify(entity.native)) as typePageItem.PageItemDataItemsOptions;
            return temp;
        } else if (entity.type === 'template') {
            const temp = JSON.parse(JSON.stringify(entity)) as unknown as typePageItem.PageItemDataItemsOptions;
            delete temp.type;
            return temp;
        }
        if (!result.data.entity1) {
            throw new Error('Invalid data');
        }
        result.data.entity2 = this.library.cloneGenericObject(result.data.entity1);

        if (mode === 'indicator') {
            // @ts-expect-error ignore this button has all propertys of text
            result.type = 'button';
        }
        let obj;
        if (entity.ScreensaverEntity && !entity.ScreensaverEntity.endsWith('.')) {
            obj = await this.adapter.getObjectAsync(entity.ScreensaverEntity);
            result.data.entity1.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity, true);
            result.data.entity2.value = await this.getFieldAsDataItemConfig(entity.ScreensaverEntity);
        }
        const dataType = obj && obj.common && obj.common.type ? obj.common.type : undefined;
        if (entity.ScreensaverEntityUnitText || entity.ScreensaverEntityUnitText === '') {
            result.data.entity1.unit = await this.getFieldAsDataItemConfig(entity.ScreensaverEntityUnitText);
        } else if (obj && obj.common && obj.common.unit) {
            result.data.entity1.unit = { type: 'const', constVal: obj.common.unit };
            result.data.entity2.unit = { type: 'const', constVal: obj.common.unit };
        }

        if (entity.ScreensaverEntityFactor) {
            result.data.entity1.factor = { type: 'const', constVal: entity.ScreensaverEntityFactor };
            result.data.entity2.factor = { type: 'const', constVal: entity.ScreensaverEntityFactor };
        }

        if (entity.ScreensaverEntityDecimalPlaces != null) {
            result.data.entity1.decimal = { type: 'const', constVal: entity.ScreensaverEntityDecimalPlaces };
            result.data.entity2.decimal = { type: 'const', constVal: entity.ScreensaverEntityDecimalPlaces };
        }
        if (entity.ScreensaverEntityDateFormat) {
            result.data.entity1.dateFormat = {
                type: 'const',
                constVal: { local: 'de', format: entity.ScreensaverEntityDateFormat },
            };
            result.data.entity2.dateFormat = {
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
                ? false
                : await this.existsState(possibleId);

        if (!Color.isScriptRGB(possibleId) && state) {
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
        } else if (typeof item === 'string' && (await this.existsState(item))) {
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
        this.adapter.log.warn(`Invalid color value: ${JSON.stringify(item)}`);
        return undefined;
    }
    async existsState(id: string): Promise<boolean> {
        if (!id || id.endsWith('.')) {
            return false;
        }
        return (await this.adapter.getForeignStateAsync(id)) != null;
    }
}

function isIconScaleElement(obj: any): obj is ScriptConfig.IconScaleElement {
    return obj && obj.val_min !== undefined && obj.val_max !== undefined;
}
function isPageItemDataItemsOptions(obj: any): obj is typePageItem.PageItemDataItemsOptions {
    return obj && obj.modeScr && obj.data;
}
