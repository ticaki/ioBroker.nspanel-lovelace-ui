import type { PageInterface } from '../classes/PageInterface';
import { getPayload, getPayloadArray } from '../const/tools';
import type * as pages from '../types/pages';
import type { IncomingEvent } from '../types/types';
import { PageMenu } from './pageMenu';

const PageScheduleMessageDefault: pages.PageScheduleMessage = {
    event: 'entityUpd',
    headline: 'Page Entities',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    options: ['~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~'],
};

export class PageSchedule extends PageMenu {
    config: pages.cardScheduleDataItemOptions;
    items: pages.PageBaseConfig['items'];

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
        if (!options.config || options.config.card !== 'cardSchedule') {
            throw new Error('wrong card, should never happen');
        }
        this.iconLeftP = 'arrow-up-bold-outline';
        this.iconLeft = 'arrow-up-bold';
        this.iconRightP = 'arrow-down-bold-outline';
        this.iconRight = 'arrow-down-bold';

        this.config = options.config;
        if (options.items && options.items.card == 'cardSchedule') {
            this.items = options.items;
        }
        this.minUpdateInterval = 1000;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardScheduleDataItemOptions> =
            this.enums || this.dpInit
                ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardScheduleDataItems> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as pages.cardScheduleDataItems;
        // set card because we lose it
        this.items.card = this.card as 'cardSchedule';
        await super.init();
    }

    public async update(): Promise<void> {
        if (!this.visibility || this.items?.card !== 'cardSchedule') {
            return;
        }
        const message: Partial<pages.PageScheduleMessage> = {};
        const arr = (await this.getOptions([])).slice(0, this.maxItems);
        message.options = arr as typeof message.options;

        message.headline = this.library.getTranslation(
            (this.items && this.items.data.headline && (await this.items.data.headline.getString())) ?? '',
        );
        message.navigation = this.getNavigation();
        const msg: pages.PageScheduleMessage = Object.assign(structuredClone(PageScheduleMessageDefault), message);

        this.sendToPanel(this.getMessage(msg), false);
    }
    private getMessage(message: pages.PageScheduleMessage): string {
        return getPayload('entityUpd', message.headline, message.navigation, getPayloadArray(message.options));
    }
    protected async onStateTrigger(): Promise<void> {
        await this.update();
    }
    async onButtonEvent(_event: IncomingEvent): Promise<void> {}
}
