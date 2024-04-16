import { Page, PageInterface } from '../classes/Page';
import { Icons } from '../const/icon_mapping';
import { getPayload } from '../const/tools';
import * as pages from '../types/pages';
import { IncomingEvent } from '../types/types';

const PageQRMessageDefault: pages.PageQRMessage = {
    event: 'entityUpd',
    headline: 'Page QR',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    textQR: '', //textQR
    type1: '', //type -> text or switch
    internalName1: '', //internalName
    iconId1: '', //iconId
    iconColor1: '', //iconColor
    displayName1: '', //displayName
    optionalValue1: '', //optionalValue
    type2: '', //type2 -> text or switch
    internalName2: '', //internalName2
    iconId2: '', //iconId2
    iconColor2: '', //iconColor2
    displayName2: '', //displayName2
    optionalValue2: '', //optionalvalue2
};

/**
 * untested
 */
export class PageQR extends Page {
    items: pages.PageBaseConfig['items'];
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;
    private status: pages.AlarmStates = 'armed';

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
        if (options.config && options.config.card == 'cardQR') this.config = options.config;
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
        this.items = tempItem as pages.cardQRDataItems;
        // set card because we lose it
        this.items.card = 'cardQR';
        await super.init();
    }

    /**
     *
     * @returns
     */
    public async update(): Promise<void> {
        if (!this.visibility) return;
        const message: Partial<pages.PageQRMessage> = {};
        const items = this.items;
        if (!items || items.card !== 'cardQR') return;
        const data = items.data;

        message.headline = (data.headline && (await data.headline.getTranslatedString())) ?? this.name;
        message.navigation = this.getNavigation();
        message.textQR =
            (data.qrcode && data.qrcode.true && (await data.qrcode.true.getString())) ??
            'WIFI:T:undefined;S:undefined;P:undefined;H:undefined;';
        const tempstr = message.textQR.split(';');
        for (let w = 0; w < tempstr.length - 1; w++) {
            if (tempstr[w].substring(5, 6) == 'T') {
                tempstr[w].slice(7) == 'undefined'
                    ? this.log.warn('Adjust data (T) for the QR page under data. Follow the instructions in the wiki.')
                    : '';
            }
            if (tempstr[w].substring(0, 1) == 'S') {
                tempstr[w].slice(2) == 'undefined'
                    ? this.log.warn('Adjust data (S) for the QR page under data. Follow the instructions in the wiki.')
                    : (message.optionalValue1 = tempstr[w].slice(2));
            }
            if (tempstr[w].substring(0, 1) == 'P') {
                message.optionalValue2 = tempstr[w].slice(2);
            }
        }
        message.type1 = 'text';
        message.internalName1 = 'ssid';
        message.iconId1 = Icons.GetIcon('wifi');
        message.iconColor1 = '65535';
        message.displayName1 = 'SSId';
        message.type2 = 'text';
        message.internalName2 = 'pwd';
        message.iconId2 = Icons.GetIcon('key');
        message.iconColor2 = '65535';
        message.displayName2 = 'Password';

        if (data.pwdHidden && (await data.pwdHidden.getBoolean())) {
            message.type2 = 'switch';
            message.iconColor2 = '65535';
            message.iconId2 = '';
            message.displayName2 = 'Wlan enebeld';
            message.internalName2 = 'switch';
            message.optionalValue2 = '0';
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
        //if (event.page && event.id && this.pageItems) {
        //    this.pageItems[event.id as any].setPopupAction(event.action, event.opt);
        //}
    }
}
