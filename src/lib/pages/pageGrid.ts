import type { PageInterface } from '../classes/Page';
import { getPayload, getPayloadArray } from '../const/tools';
import type * as pages from '../types/pages';
import type { IncomingEvent } from '../types/types';
import { PageMenu } from './pageMenu';

const PageGridMessageDefault: pages.PageGridMessage = {
    event: 'entityUpd',
    headline: 'Page Grid',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    options: ['~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~'],
};
const PageGrid2MessageDefault: pages.PageGridMessage = {
    event: 'entityUpd',
    headline: 'Page Grid',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    options: ['~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~'],
};
export class PageGrid extends PageMenu {
    config: pages.PageBaseConfig['config'];
    items: pages.PageBaseConfig['items'];

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
        this.config = options.config;
        this.iconLeftP = 'arrow-left-bold-outline';
        this.iconLeft = 'arrow-up-bold';
        this.iconRightP = 'arrow-right-bold-outline';
        this.iconRight = 'arrow-down-bold';

        if (
            options.items &&
            (options.items.card == 'cardGrid' || options.items.card == 'cardGrid2' || options.items.card == 'cardGrid3')
        ) {
            this.items = options.items;
        }
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardGridDataItems> =
            this.enums || this.dpInit
                ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardGridDataItems> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as pages.cardGridDataItems;
        // set card because we lose it
        this.items.card = this.card as 'cardGrid' | 'cardGrid2' | 'cardGrid3';
        await super.init();
    }

    public async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        const message: Partial<pages.PageGridMessage> = {};
        message.options = [];
        if (
            !this.items ||
            (this.items.card !== 'cardGrid' && this.items.card !== 'cardGrid2' && this.items.card !== 'cardGrid3')
        ) {
            return;
        }
        if (
            !this.config ||
            (this.config.card !== 'cardGrid' && this.config.card !== 'cardGrid2' && this.config.card !== 'cardGrid3')
        ) {
            return;
        }
        const arr = (await this.getOptions([])).slice(0, 8);
        message.options = arr as typeof message.options;

        message.headline = this.library.getTranslation(
            (this.items && this.items.data.headline && (await this.items.data.headline.getString())) ?? '',
        );
        message.navigation = this.getNavigation();
        const msg: pages.PageGridMessage = Object.assign(
            this.card === 'cardGrid' ? PageGridMessageDefault : PageGrid2MessageDefault,
            message,
        );

        this.sendToPanel(this.getMessage(msg));
    }
    private getMessage(message: pages.PageGridMessage): string {
        return getPayload('entityUpd', message.headline, message.navigation, getPayloadArray(message.options));
    }
    protected async onStateTrigger(): Promise<void> {
        await this.update();
    }
    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        //if (event.page && event.id && this.pageItems) {
        //    this.pageItems[event.id as any].setPopupAction(event.action, event.opt);
        //}
    }
}
