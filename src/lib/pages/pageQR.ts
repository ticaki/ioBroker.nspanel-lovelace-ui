import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { Color } from '../const/Color';
import { getPayload, getPayloadRemoveTilde } from '../const/tools';
import type * as pages from '../types/pages';
import type { IncomingEvent } from '../types/types';
import * as globals from '../types/function-and-const';

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

export class PageQR extends Page {
    items: pages.PageBase['items'];

    constructor(config: PageInterface, options: pages.PageBase) {
        super(config, options);
        if (options.config && options.config.card == 'cardQR') {
            this.config = options.config;
        } else {
            throw new Error('Missing config!');
        }
        this.minUpdateInterval = 1000;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        if (!(config?.card === 'cardQR' && config.data)) {
            throw new Error('PageQR: invalid configuration');
        }
        // search states for mode auto
        const tempConfig: Partial<pages.cardQRDataItemOptions> =
            this.enums || this.dpInit
                ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardQRDataItems> = await this.basePanel.statesControler.createDataItems(
            tempConfig,
            this,
        );

        this.items = tempItem as pages.cardQRDataItems;
        this.items.card = 'cardQR';
        await this.items.data.setState?.delete();
        delete this.items.data.setState;

        const selType = (await this.items.data.selType?.getNumber()) ?? 0;
        const ssidurltel = (await this.items.data.ssidUrlTel?.getString()) ?? '';
        const password = (await this.items.data.password?.getString()) ?? '';

        let text1 = '';
        let text = '';
        let icon1 = '';
        let icon2 = '';
        switch (selType) {
            case 0: // FREE
                text1 = ssidurltel;
                text = '';
                icon1 = 'qrcode-scan';
                icon2 = '';
                break;
            case 1: // WIFI
                text1 = ssidurltel;
                text = 'SSID';
                icon1 = 'wifi';
                icon2 = 'key-wireless';
                break;
            case 2: // URL
                text1 = ssidurltel;
                text = 'URL / Website';
                icon1 = 'web';
                icon2 = '';
                break;
            case 3: // Telephone
                text1 = ssidurltel;
                text = 'Telephone';
                icon1 = 'phone';
                icon2 = '';
                break;
            default:
                break;
        }
        this.pageItemConfig = [];
        this.pageItemConfig.push({
            type: 'text',
            role: 'button',
            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: icon1 },
                        color: { type: 'const', constVal: Color.on },
                    },
                    false: {
                        value: { type: 'const', constVal: icon1 },
                        color: { type: 'const', constVal: Color.off },
                    },
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
        let text1Second = '';
        let textSecond = '';

        if (selType == 1) {
            // WIFI - show password
            text1Second = password;
            textSecond = 'Password';
        }

        if (config.data?.setState) {
            // Button variant with state
            this.pageItemConfig.push({
                type: 'button',
                role: 'button',
                data: {
                    icon: {
                        true: {
                            value: { type: 'const', constVal: 'wifi' },
                            color: { type: 'const', constVal: Color.Green },
                        },
                        false: {
                            value: { type: 'const', constVal: 'wifi-off' },
                            color: { type: 'const', constVal: Color.off },
                        },
                    },
                    text1: {
                        true: { type: 'const', constVal: text1Second },
                    },
                    text: {
                        true: { type: 'const', constVal: 'WlanOn' },
                        false: { type: 'const', constVal: 'WlanOff' },
                    },
                    entity1: {
                        value: config.data.setState,
                    },
                },
            });
        } else {
            // Text variant without state
            this.pageItemConfig.push({
                type: 'text',
                role: 'button',
                data: {
                    icon: {
                        true: {
                            value: { type: 'const', constVal: icon2 },
                            color: { type: 'const', constVal: Color.on },
                        },
                        false: {
                            value: { type: 'const', constVal: icon2 },
                            color: { type: 'const', constVal: Color.off },
                        },
                    },
                    text1: {
                        true: { type: 'const', constVal: text1Second },
                    },
                    text: {
                        true: { type: 'const', constVal: textSecond },
                    },
                    entity1: undefined,
                },
            });
        }
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

        if (this.items && this.items.card === 'cardQR') {
            const items = this.items;

            message.headline = this.library.getTranslation(
                (items.data.headline && (await items.data.headline.getString())) ?? 'QR Code Page',
            );
            message.navigation = this.getNavigation();

            const selType = (await items.data.selType?.getNumber()) || 0;
            const ssidurltel = (await items.data.ssidUrlTel?.getString()) || '';
            const password = (await items.data.password?.getString()) || '';
            const pwdhidden = (await items.data.pwdhidden?.getBoolean()) || false;
            const wlantype = (await items.data.wlantype?.getString()) || 'WPA';
            const wlanhidden = (await items.data.wlanhidden?.getBoolean()) || false;

            switch (selType) {
                case 0:
                    this.log.debug(`qrType = FREE`);
                    message.textQR = ssidurltel;
                    message.optionalValue1 = '';
                    break;
                case 1: {
                    this.log.debug(`qrType = wifi`);
                    const pass = password;
                    message.textQR = `WIFI:T:${wlantype};S:${ssidurltel};P:${pass};${wlanhidden ? `H:${wlanhidden}` : `H:`};`;
                    message.optionalValue1 = ssidurltel;
                    break;
                }
                case 2:
                    this.log.debug(`qrType = url`);
                    message.textQR = `URL:${ssidurltel}`;
                    message.optionalValue1 = ssidurltel;
                    break;
                case 3:
                    this.log.debug(`qrType = Telephone`);
                    message.textQR = `TEL:${ssidurltel}`;
                    message.optionalValue1 = ssidurltel;
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
                                message.optionalValue2 = arr[0] == 'button' ? arr[5] : pwdhidden ? '' : arr[5];
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        }
        if (message.textQR) {
            this.log.debug(`textQR: ${message.textQR}`);
        }
        this.sendToPanel(this.getMessage(message), false);
    }

    private getMessage(_message: Partial<pages.PageQRMessage>): string {
        let result: pages.PageQRMessage = PageQRMessageDefault;
        result = { ...result, ..._message } as pages.PageQRMessage;
        return getPayload(
            getPayloadRemoveTilde('entityUpd', result.headline),
            result.navigation,
            getPayloadRemoveTilde(
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
            ),
        );
    }

    protected async onStateTrigger(_id: string): Promise<void> {
        if (this.unload || this.adapter.unload) {
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
        if (globals.isQRButtonEvent(button)) {
            if (
                this.pageItems &&
                this.pageItems[_event.id as any] &&
                this.pageItems[_event.id as any]!.config &&
                this.pageItems[_event.id as any]!.config!.type == 'button'
            ) {
                await this.pageItems[_event.id as any]!.onCommand('switch', value);
            }
        }
    }
}
