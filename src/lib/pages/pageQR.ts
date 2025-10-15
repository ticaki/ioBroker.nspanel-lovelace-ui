import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { getPayload, getPayloadRemoveTilde } from '../const/tools';
import type * as pages from '../types/pages';
import * as convertColorScaleBest from '../types/function-and-const';
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

    constructor(config: PageInterface, options: pages.PageBase) {
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
                ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardQRDataItems> = await this.basePanel.statesControler.createDataItems(
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
        const config = this.adapter.config.pageQRConfig?.[this.index];
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
                    message.optionalValue1 = '';
                    break;
                case 1: {
                    this.log.debug(`qrType = wifi`);
                    const pass = config.qrPass || '';
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
        if (convertColorScaleBest.isQRButtonEvent(button)) {
            if (this.adapter.config.pageQRdata[this.index]) {
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
}
