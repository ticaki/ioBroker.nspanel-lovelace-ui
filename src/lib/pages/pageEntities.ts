import type { PageInterface } from '../classes/PageInterface';
import { hmiMenuCard } from '../const/tools';
import type * as pages from '../types/pages';
import { PageMenu } from './pageMenu';

const PageEntitiesMessageDefault: pages.PageEntitiesMessage = {
    event: 'entityUpd',
    headline: 'Page Entities',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    options: [],
};

/** the pages of PageEntities: cardEntities and cardEntities2 (five rows, falls back to cardEntities) */
type EntitiesCard = 'cardEntities' | 'cardEntities2';

/**
 * @param card a card
 * @returns true for the cards of PageEntities
 */
function isEntitiesCard(card: string | undefined): card is EntitiesCard {
    return card === 'cardEntities' || card === 'cardEntities2';
}

export class PageEntities extends PageMenu {
    config: pages.cardEntitiesDataItemOptions;
    items: pages.PageBase['items'];

    constructor(config: PageInterface, options: pages.PageBase) {
        super(config, options);
        if (!options.config || (options.config.card !== 'cardEntities' && options.config.card !== 'cardEntities2')) {
            throw new Error('wrong card, should never happen');
        }
        this.iconLeftP = 'arrow-up-bold-outline';
        this.iconLeft = 'arrow-up-bold';
        this.iconRightP = 'arrow-down-bold-outline';
        this.iconRight = 'arrow-down-bold';

        this.config = options.config;
        if (options.items && isEntitiesCard(options.items.card)) {
            this.items = options.items;
        }
        this.minUpdateInterval = 1000;
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
        this.items.card = isEntitiesCard(this.card) ? this.card : 'cardEntities';
        await super.init();
    }

    /**
     * The page of the HMI that shows this page: cardEntities2 is shown as cardEntities on a display without the page
     * (older TFT, us-l / us-p, see hmiMenuCard) - with 4 rows (PageMenu.maxItems).
     *
     * @returns cardEntities or cardEntities2
     */
    get hmiCard(): EntitiesCard {
        return isEntitiesCard(this.card) ? hmiMenuCard(this.card, this.hmiCardTarget()) : 'cardEntities';
    }

    protected getPageTypePayload(): string {
        return `pageType~${this.hmiCard}`;
    }

    public async update(): Promise<void> {
        if (!this.visibility || !isEntitiesCard(this.items?.card)) {
            return;
        }
        await super.update();
        const message: Partial<pages.PageEntitiesMessage> = {};
        const arr = (await this.getOptions([])).slice(0, this.maxItems);
        message.options = arr;

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
