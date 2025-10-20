import type { PageInterface } from '../classes/PageInterface';
import type * as pages from '../types/pages';
import { PageMenu } from './pageMenu';

const PageEntitiesMessageDefault: pages.PageEntitiesMessage = {
    event: 'entityUpd',
    headline: 'Page Entities',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    options: ['~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~'],
};

export class PageEntities extends PageMenu {
    config: pages.cardEntitiesDataItemOptions;
    items: pages.PageBase['items'];

    constructor(config: PageInterface, options: pages.PageBase) {
        super(config, options);
        if (!options.config || options.config.card !== 'cardEntities') {
            throw new Error('wrong card, should never happen');
        }
        this.iconLeftP = 'arrow-up-bold-outline';
        this.iconLeft = 'arrow-up-bold';
        this.iconRightP = 'arrow-down-bold-outline';
        this.iconRight = 'arrow-down-bold';

        this.config = options.config;
        if (options.items && options.items.card == 'cardEntities') {
            this.items = options.items;
        }
        this.minUpdateInterval = 500;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardEntitiesDataItemOptions> =
            this.enums || this.dpInit
                ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardEntitiesDataItems> = await this.basePanel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as pages.cardEntitiesDataItems;
        // set card because we lose it
        this.items.card = this.card as 'cardEntities';
        await super.init();
    }

    public async update(): Promise<void> {
        if (!this.visibility || this.items?.card !== 'cardEntities') {
            return;
        }
        const message: Partial<pages.PageEntitiesMessage> = {};
        const arr = (await this.getOptions([])).slice(0, this.maxItems);
        message.options = arr as typeof message.options;

        message.headline = this.library.getTranslation(
            (this.items && this.items.data.headline && (await this.items.data.headline.getString())) ?? '',
        );
        message.navigation = this.getNavigation();
        const msg: pages.PageEntitiesMessage = { ...structuredClone(PageEntitiesMessageDefault), ...message };

        this.sendToPanel(this.getMessage(msg), false);
    }

    protected async onStateTrigger(): Promise<void> {
        await this.update();
    }
}
