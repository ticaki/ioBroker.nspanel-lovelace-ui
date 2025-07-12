import type { ConfigManager } from '../classes/config-manager';
import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { Color } from '../const/Color';
import { getPayload } from '../const/tools';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import * as pages from '../types/pages';
import type { IncomingEvent } from '../types/types';

const PageQRMessageDefault: pages.PageQRMessage = {
    event: 'entityUpd',
    headline: 'Page QR',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    textQR: 'disabled', //textQR
    type1: 'disabled', //type -> text or switch
    internalName1: '~', //internalName
    iconId1: '~', //iconId
    iconColor1: '~', //iconColor
    displayName1: '~', //displayName
    optionalValue1: '~', //optionalValue
    type2: 'disabled', //type2 -> text or switch
    internalName2: '~', //internalName2
    iconId2: '~', //iconId2
    iconColor2: '~', //iconColor2
    displayName2: '~', //displayName2
    optionalValue2: '~', //optionalvalue2
};

/**
 * untested
 */
export class PageQR extends Page {
    items: pages.cardQRDataItems | undefined;
    index: number = 0;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        if (config.card !== 'cardQR') {
            return;
        }
        super(config, options);
        if (options.config && options.config.card == 'cardQR') {
            this.config = options.config;
        } else {
            throw new Error('Missing config!');
        }
        this.index = this.config.index;
        this.minUpdateInterval = 1000;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardQRDataItemOptions> =
            this.enums || this.dpInit
                ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardQRDataItems> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        if (tempItem) {
            tempItem.card = 'cardQR';
        }
        this.items = tempItem as pages.cardQRDataItems;
        await super.init();
    }

    /**
     *
     * @returns //Rücksprung
     */
    public async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        const message: Partial<pages.PageQRMessage> = {};
        const config = this.adapter.config.pageQRdata[this.index];
        if (this.items && config != null) {
            const items = this.items;

            message.headline = this.library.getTranslation(
                (items.data.headline && (await items.data.headline.getString())) ?? config.headline ?? '',
            );
            message.navigation = this.getNavigation();

            switch (config.selType) {
                case 0:
                    this.log.debug(`qrType = FREE`);
                    message.textQR = config.SSIDURLTEL;
                    message.optionalValue1 = config.optionalText || '';
                    break;
                case 1: {
                    this.log.debug(`qrType = wifi`);
                    let pass = '';
                    switch (config.qrPass) {
                        case 0:
                            break;
                        case 1:
                            pass = this.adapter.config.pageQRpwd1 || '';
                            break;
                        case 2:
                            pass = this.adapter.config.pageQRpwd2 || '';
                            break;
                        case 3:
                            pass = this.adapter.config.pageQRpwd3 || '';
                            break;
                    }
                    message.textQR = `WIFI:T:${config.wlantype};S:${config.SSIDURLTEL};P:${pass};${config.wlanhidden ? `H:${config.wlanhidden}` : `H:`};`;
                    message.optionalValue1 = config.SSIDURLTEL;
                    break;
                }
                case 2:
                    this.log.debug(`qrType = url`);
                    message.textQR = `URL:${config.SSIDURLTEL}`;
                    message.optionalValue1 = config.SSIDURLTEL;
                    break;
                case 3:
                    this.log.debug(`qrType = Telephone`);
                    message.textQR = `TEL:${config.SSIDURLTEL}`;
                    message.optionalValue1 = config.SSIDURLTEL;
                    break;
                default:
                    this.log.debug(`qrType = none`);
                    this.sendToPanel(this.getMessage(message), false);
                    return;
            }

            if (this.pageItems) {
                const pageItems = this.pageItems.filter(a => a && a.dataItems);
                if (pageItems.length > 2) {
                    this.log.warn(`Bad config -> too many page items`);
                }

                for (let a = 0; a < pageItems.length; a++) {
                    const temp = pageItems[a];
                    if (temp) {
                        const arr = (await temp.getPageItemPayload()).split('~');
                        this.log.debug(`0: ${arr[0]} 1: ${arr[1]} 2: ${arr[2]} 3: ${arr[3]} 4: ${arr[4]} 5: ${arr[5]}`);
                        switch (a) {
                            case 0:
                                message.type1 = arr[0];
                                message.displayName1 = arr[4];
                                message.internalName1 = arr[1];
                                message.iconId1 = arr[2];
                                message.iconColor1 = arr[3];
                                break;
                            case 1:
                                message.type2 = arr[0] == 'button' ? 'switch' : 'text';
                                message.displayName2 = arr[4];
                                message.internalName2 = arr[1];
                                message.iconId2 = arr[2];
                                message.iconColor2 = arr[3];
                                message.optionalValue2 = arr[0] == 'button' ? arr[5] : config.pwdhidden ? '' : arr[5];
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        }
        if (message.textQR) {
            this.log.debug(message.textQR);
        }
        this.sendToPanel(this.getMessage(message), false);
    }
    static async getQRPageConfig(
        adapter: NspanelLovelaceUi,
        index: number,
        configManager: ConfigManager,
    ): Promise<pages.PageBaseConfig> {
        const config = adapter.config.pageQRdata[index];
        if (config) {
            let text1 = '',
                text = '',
                icon1 = '',
                icon2 = '';
            switch (config.selType) {
                case 0:
                    text1 = config.SSIDURLTEL;
                    text = config.optionalText || '';
                    break;
                case 1: {
                    text1 = config.SSIDURLTEL;
                    text = 'SSID';
                    icon1 = 'wifi';
                    icon2 = 'key-wireless';
                    break;
                }
                case 2:
                    text1 = config.SSIDURLTEL;
                    text = 'URL / Website';
                    icon1 = 'web';
                    icon2 = '';
                    break;
                case 3:
                    text1 = config.SSIDURLTEL;
                    text = 'Telephone';
                    icon1 = 'phone'; // phone-classic alternative
                    icon2 = '';
                    break;
                default:
                    break;
            }
            const stateExist = config.setState && (await configManager.existsState(config.setState || ''));
            const result: pages.PageBaseConfig = {
                uniqueID: config.pageName,
                alwaysOn: config.alwaysOnDisplay ? 'always' : 'none',
                config: {
                    card: 'cardQR',
                    index: index,
                    data: {
                        headline: { type: 'const', constVal: config.headline || '' },
                    },
                },
                pageItems: [],
            };
            result.pageItems.push({
                type: 'text',
                dpInit: '',
                role: 'button',
                data: {
                    icon: {
                        true: {
                            value: {
                                type: 'const',
                                constVal: icon1,
                            },
                            color: await configManager.getIconColor(configManager.colorOn),
                        },
                        false: {
                            value: {
                                type: 'const',
                                constVal: icon1,
                            },
                            color: await configManager.getIconColor(configManager.colorOff),
                        },
                        scale: undefined,
                        maxBri: undefined,
                        minBri: undefined,
                    },
                    text1: {
                        true: { type: 'const', constVal: text1 },
                    },
                    text: {
                        true: { type: 'const', constVal: text },
                    },
                    entity1:
                        config.setState && (await configManager.existsState(config.setState || ''))
                            ? {
                                  value: {
                                      type: 'triggered',
                                      dp: config.setState,
                                  },
                              }
                            : undefined,
                },
            });
            switch (config.selType) {
                case 0:
                    text1 = '';
                    text = '';
                    break;
                case 1: {
                    switch (config.qrPass) {
                        case 1:
                            text1 = adapter.config.pageQRpwd1 || '';
                            break;
                        case 2:
                            text1 = adapter.config.pageQRpwd2 || '';
                            break;
                        case 3:
                            text1 = adapter.config.pageQRpwd3 || '';
                            break;
                        default:
                            text1 = '';
                            break;
                    }
                    text = 'Password';
                    break;
                }
                case 2:
                    text1 = '';
                    text = '';
                    break;
                case 3:
                    text1 = '';
                    text = '';
                    break;
                default:
                    break;
            }
            if (config.setState && stateExist) {
                result.pageItems.push({
                    type: 'button',
                    dpInit: '',
                    role: 'button',
                    data: {
                        icon: {
                            true: {
                                value: {
                                    type: 'const',
                                    constVal: 'wifi',
                                },
                                color: await configManager.getIconColor(Color.Green, configManager.colorOn),
                            },
                            false: {
                                value: {
                                    type: 'const',
                                    constVal: 'wifi-off',
                                },
                                color: await configManager.getIconColor(configManager.colorOff),
                            },
                            scale: undefined,
                            maxBri: undefined,
                            minBri: undefined,
                        },
                        text1: {
                            true: { type: 'const', constVal: text1 },
                        },
                        text: {
                            true: { type: 'const', constVal: 'WlanOn' },
                            false: { type: 'const', constVal: 'WlanOff' },
                        },
                        entity1: {
                            value: {
                                type: 'triggered',
                                dp: config.setState,
                            },
                        },
                    },
                });
            } else {
                result.pageItems.push({
                    type: 'text',
                    dpInit: '',
                    role: 'button',
                    data: {
                        icon: {
                            true: {
                                value: {
                                    type: 'const',
                                    constVal: icon2,
                                },
                                color: await configManager.getIconColor(configManager.colorOn),
                            },
                            false: {
                                value: {
                                    type: 'const',
                                    constVal: icon2,
                                },
                                color: await configManager.getIconColor(configManager.colorOff),
                            },
                            scale: undefined,
                            maxBri: undefined,
                            minBri: undefined,
                        },
                        text1: {
                            true: { type: 'const', constVal: text1 },
                        },
                        text: {
                            true: { type: 'const', constVal: text },
                        },
                        entity1: undefined,
                    },
                });
            }
            return result;
        }
        throw new Error('No config for cardQR found');
    }

    private getMessage(_message: Partial<pages.PageQRMessage>): string {
        let result: pages.PageQRMessage = PageQRMessageDefault;
        result = Object.assign(result, _message) as pages.PageQRMessage;
        return getPayload(
            'entityUpd',
            result.headline,
            result.navigation,
            result.textQR,
            result.type1,
            result.internalName1,
            result.iconId1,
            result.iconColor1,
            result.displayName1,
            result.optionalValue1,
            result.type2,
            result.internalName2,
            result.iconId2,
            result.iconColor2,
            result.displayName2,
            result.optionalValue2,
        );
    }

    protected async onStateTrigger(_id: string): Promise<void> {
        if (this.unload) {
            return;
        }
        this.adapter.setTimeout(() => this.update(), 50);
    }
    /**
     *a
     *
     * @param _event //ButtonEvent z.B. bExit, buttonpress2
     * @returns //Rücksprung
     */
    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        const button = _event.action;
        const value = _event.opt;
        if (!this.items || this.items.card !== 'cardQR') {
            return;
        }
        this.log.debug(`action: ${button}, value: ${value}`);
        if (pages.isQRButtonEvent(button)) {
            if (this.adapter.config.pageQRdata[this.index]) {
                if (
                    this.pageItems &&
                    this.pageItems[_event.id as any] &&
                    this.pageItems[_event.id as any]!.config &&
                    this.pageItems[_event.id as any]!.config!.type == 'button'
                ) {
                    await this.pageItems[_event.id as any]!.onCommand('button', value);
                }
            }
        }
    }
}
