import { Page, PageInterface } from '../classes/Page';
import * as pages from '../types/pages';
import { IncomingEvent } from '../types/types';

/*const PageAlarmMessageDefault: pages.PageAlarmMessage = {
    event: 'entityUpd',
    headline: 'Page Grid',
    intNameEntity: '',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    button1: '',
    status1: '',
    button2: '',
    status2: '',
    button3: '',
    status3: '',
    button4: '',
    status4: '',
    icon: '',
    iconColor: '',
    numpad: 'disable',
    flashing: 'disable',
};*/

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

        if (this.pageItems) {
            message.options = [];
            const maxItems = 2;
            for (let a = 0; a < maxItems; a++) {
                const temp = this.pageItems[a];
                if (temp) message.options[a] = await temp.getPageItemPayload();
            }
        }
        message.headline = (data.headline && (await data.headline.getTranslatedString())) ?? this.name;
        message.navigation = this.getNavigation();

        this.sendToPanel(this.getMessage(message));
    }

    private getMessage(_message: Partial<pages.PageQRMessage>): string {
        /*let result: pages.PageQRMessage = PageAlarmMessageDefault;
        result = Object.assign(result, message) as pages.PageQRMessage;
        return getPayload(
            'entityUpd',
            result.headline,
            result.navigation,
            result.intNameEntity,
            result.button1,
            result.status1,
            result.button2,
            result.status2,
            result.button3,
            result.status3,
            result.button4,
            result.status4,
            result.icon,
            result.iconColor,
            result.numpad,
            result.flashing,
        );*/
        return '';
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
