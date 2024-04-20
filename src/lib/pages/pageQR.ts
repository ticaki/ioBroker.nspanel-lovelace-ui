import { Page, PageInterface } from '../classes/Page';
import { getPayload } from '../const/tools';
import * as pages from '../types/pages';
import { IncomingEvent } from '../types/types';

const PageQRMessageDefault: pages.PageQRMessage = {
    event: 'entityUpd',
    headline: 'Page QR',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    textQR: '~', //textQR
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
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;
    private qrType: string = '';

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        if (config.card !== 'cardQR') return;
        super(config, options);
        if (options.config && options.config.card == 'cardQR') this.config = options.config;
        else throw new Error('Missing config!');
        this.qrType = options.config.qrType;
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

            if (this.pageItems) {
                const pageItems = this.pageItems.filter((a) => a && a.dataItems);
                this.log.debug(`qrType = ${this.qrType}`);

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
                                message.optionalValue1 = arr[5];
                                break;
                            case 1:
                                message.type2 = arr[0] == 'button' ? 'switch' : 'text';
                                message.displayName2 = arr[4];
                                message.internalName2 = arr[1];
                                message.iconId2 = arr[2];
                                message.iconColor2 = arr[3];
                                message.optionalValue2 = arr[5];
                                break;
                            default:
                                break;
                        }
                    }
                }

                switch (this.qrType) {
                    case 'wifi':
                        if (pageItems.length != 2) throw new Error('Bad config for WIFI!');
                        message.textQR = `WIFI:T:`;
                        break;
                    case 'url':
                        if (pageItems.length != 1) throw new Error('Bad config for URL!');
                        message.textQR = `URL:https://forum.iobroker.net/topic/58170/sonoff-nspanel-mit-lovelace-ui`;
                        break;
                    default:
                        break;
                }
            }
        }

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
        this.log.info(`button: ${button} value ${value}`);
        if (pages.isQRButtonEvent(button)) {
        }
    }
}
