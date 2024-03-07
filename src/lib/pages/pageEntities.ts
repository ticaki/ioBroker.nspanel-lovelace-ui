import { Page, PageInterface } from '../classes/Page';
import { HMIOn, rgb_dec565 } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { getPayload, getPayloadArray } from '../const/tools';
import * as pages from '../types/pages';
import { IncomingEvent } from '../types/types';
import { handleCardRole } from './data-collection-functions';
import { PageItem } from './pageItem';

const PageEntitiesMessageDefault: pages.PageEntitiesMessage = {
    event: 'entityUpd',
    headline: 'Page Entities',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    options: ['~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~'],
};

export class PageEntities extends Page {
    config: pages.cardEntitiesDataItemOptions;
    items: pages.PageBaseConfig['items'];
    private maxItems: number = 4;
    private step: number = 0;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;
    private lastNavClick: number = 0;
    tempItems: (PageItem | undefined)[] | undefined;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
        if (!options.config || options.config.card !== 'cardEntities') {
            throw new Error('wrong card, should never happen');
        }
        this.config = options.config;
        if (options.items && options.items.card == 'cardEntities') this.items = options.items;
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardEntitiesDataItemOptions> =
            this.enums || this.dpInit
                ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardEntitiesDataItems> = await this.panel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as pages.cardEntitiesDataItems;
        // set card because we lose it
        this.items.card = this.card as 'cardEntities';
        await super.init();
    }

    public async update(): Promise<void> {
        if (!this.visibility) return;
        const message: Partial<pages.PageEntitiesMessage> = {};
        message.options = [];
        if (this.pageItems) {
            if (this.config && this.config.card == 'cardEntities') {
                if (this.config.scrollType === 'page') {
                    let maxItems = this.maxItems;
                    let a = 0;
                    if (this.pageItems.length > maxItems) {
                        a = maxItems * this.step;
                        maxItems = a + maxItems;
                    }
                    let b = 0;
                    let pageItems = this.pageItems;

                    /**
                     * Live update von gefilterten Adaptern.
                     */
                    if (this.config.filterType === 'true' || this.config.filterType === 'false') {
                        this.tempItems = [];
                        const testIt = this.config.filterType === 'true';
                        for (const a of this.pageItems) {
                            if (
                                a &&
                                a.dataItems &&
                                a.dataItems.data &&
                                'entity1' in a.dataItems.data &&
                                a.dataItems.data.entity1 &&
                                a.dataItems.data.entity1.value &&
                                testIt === (await a.dataItems.data.entity1.value.getBoolean())
                            )
                                this.tempItems.push(a);
                        }
                        pageItems = this.tempItems;
                    }
                    for (; a < maxItems; a++) {
                        const temp = pageItems[a];
                        message.options[b++] = temp ? await temp.getPageItemPayload() : '~~~~~';
                    }
                } else {
                    let a = this.step;
                    for (; a < this.maxItems + this.step; a++) {
                        const temp = this.pageItems[a];
                        message.options[a - this.step] = temp ? await temp.getPageItemPayload() : '~~~~~';
                    }
                }
            }
        }
        message.headline = this.library.getTranslation(
            (this.items && this.items.data.headline && (await this.items.data.headline.getString())) ?? '',
        );
        message.navigation = this.getNavigation();
        const msg: pages.PageEntitiesMessage = Object.assign(structuredClone(PageEntitiesMessageDefault), message);

        this.sendToPanel(this.getMessage(msg));
    }
    private getMessage(message: pages.PageEntitiesMessage): string {
        return getPayload('entityUpd', message.headline, message.navigation, getPayloadArray(message.options));
    }
    protected async onStateTrigger(): Promise<void> {
        await this.update();
    }
    async onButtonEvent(_event: IncomingEvent): Promise<void> {}

    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            if (this.config.card === 'cardEntities') {
                const temp = await handleCardRole(this.adapter, this.config.cardRole);
                if (temp) this.pageItemConfig = temp;
            }
        }
        await super.onVisibilityChange(val);
    }

    goLeft(): void {
        if (!this.config || this.config.card !== 'cardEntities') return;
        if (this.config.scrollType === 'page') {
            this.goLeftP();
            return;
        }
        if (--this.step < 0 && Date.now() - this.lastNavClick > 300) {
            this.step = 0;
            this.panel.navigation.goLeft();
        } else this.update();
        this.lastNavClick = Date.now();
    }
    goRight(): void {
        if (!this.config || this.config.card !== 'cardEntities') return;
        if (this.config.scrollType === 'page') {
            this.goRightP();
            return;
        }
        const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
        if (++this.step + this.maxItems > length && Date.now() - this.lastNavClick > 300) {
            this.step--;
            this.panel.navigation.goRight();
        } else this.update();
        this.lastNavClick = Date.now();
    }
    protected getNavigation(): string {
        if (!this.config || this.config.card !== 'cardEntities') return '';
        if (this.config.scrollType === 'page') {
            return this.getNavigationP();
        }
        const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
        if (this.maxItems >= length) {
            return super.getNavigation();
        }
        let left = '';
        let right = '';
        if (this.step <= 0) {
            left = this.panel.navigation.buildNavigationString('left');
        }
        if (this.step + this.maxItems >= length) {
            right = this.panel.navigation.buildNavigationString('right');
        }
        if (!left)
            left = getPayload('button', 'bSubPrev', Icons.GetIcon('arrow-up-bold'), String(rgb_dec565(HMIOn)), '', '');

        if (!right)
            right = getPayload(
                'button',
                'bSubNext',
                Icons.GetIcon('arrow-down-bold'),
                String(rgb_dec565(HMIOn)),
                '',
                '',
            );

        return getPayload(left, right);
    }
    goLeftP(): void {
        if (--this.step < 0) {
            this.step = 0;
            this.panel.navigation.goLeft();
        } else this.update();
    }
    goRightP(): void {
        const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
        if (++this.step * this.maxItems >= length) {
            this.step--;
            this.panel.navigation.goRight();
        } else this.update();
    }
    protected getNavigationP(): string {
        const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
        if (this.maxItems >= length) {
            return super.getNavigation();
        }
        let left = '';
        let right = '';
        if (this.step <= 0) {
            left = this.panel.navigation.buildNavigationString('left');
        }
        if ((this.step + 1) * this.maxItems >= length) {
            right = this.panel.navigation.buildNavigationString('right');
        }
        if (!left)
            left = getPayload(
                'button',
                'bSubPrev',
                Icons.GetIcon('arrow-up-bold-outline'),
                String(rgb_dec565(HMIOn)),
                '',
                '',
            );

        if (!right)
            right = getPayload(
                'button',
                'bSubNext',
                Icons.GetIcon('arrow-down-bold-outline'),
                String(rgb_dec565(HMIOn)),
                '',
                '',
            );

        return getPayload(left, right);
    }
}
