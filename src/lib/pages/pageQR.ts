import { Page, PageInterface } from '../classes/Page';
import { getPayload } from '../const/tools';
import * as pages from '../types/pages';
import { IncomingEvent } from '../types/types';

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

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        if (config.card !== 'cardQR') return;
        super(config, options);
        if (options.config && options.config.card == 'cardQR') this.config = options.config;
        else throw new Error('Missing config!');
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
        if (tempItem) tempItem.card = 'cardQR';
        this.items = tempItem as pages.cardQRDataItems;
        await super.init();
    }

    /**
     *
     * @returns
     */
    public async update(): Promise<void> {
        if (!this.visibility) return;
        const message: Partial<pages.PageQRMessage> = {};

        if (this.items) {
            const items = this.items;

            message.headline = this.library.getTranslation(
                (items.data.headline && (await items.data.headline.getString())) ?? '',
            );
            message.navigation = this.getNavigation();

            this.log.debug(`qrType Number from Admin-Page = ${this.adapter.config.pageQRselType}`);
            switch (this.adapter.config.pageQRselType) {
                case 1:
                    this.log.debug(`qrType = wifi`);
                    message.textQR = `WIFI:T:${this.adapter.config.pageQRwlantype};S:${this.adapter.config.pageQRssid};P:${this.adapter.config.pageQRpwd};H:${this.adapter.config.pageQRwlanhidden};`;
                    message.optionalValue1 = this.adapter.config.pageQRssid;
                    break;
                case 2:
                    this.log.debug(`qrType = url`);
                    message.textQR = `URL:${this.adapter.config.pageQRurl}`;
                    message.optionalValue1 = this.adapter.config.pageQRurl;
                    break;
                default: //0
                    this.log.debug(`qrType = none`);
                    this.sendToPanel(this.getMessage(message));
                    return;
                    break;
            }

            if (this.pageItems) {
                const pageItems = this.pageItems.filter((a) => a && a.dataItems);
                if (pageItems.length > 2) this.log.warn(`Bad config -> too many page items`);

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
                                message.optionalValue2 = arr[0] == 'button' ? arr[5] : this.adapter.config.pageQRpwd;
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        }
        if (message.textQR) this.log.debug(message.textQR);
        this.sendToPanel(this.getMessage(message));
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
        this.adapter.setTimeout(() => this.update(), 50);
    }
    /**
     *a
     * @param _event
     * @returns
     */
    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        const button = _event.action;
        const value = _event.opt;
        if (!this.items || this.items.card !== 'cardQR') return;
        this.log.info(`action: ${button}, value: ${value}`);
        if (pages.isQRButtonEvent(button)) {
            if (this.adapter.config.pageQRselType == 1) {
                if (this.pageItems && this.pageItems[_event.id as any]) {
                    this.pageItems[_event.id as any]!.onCommand('button', value);
                }
            }
        }
    }
}
