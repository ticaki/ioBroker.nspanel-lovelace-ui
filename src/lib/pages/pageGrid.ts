import { Page, PageInterface } from '../classes/Page';
import { getPayload, getPayloadArray } from '../const/tools';
import * as pages from '../types/pages';
import { IncomingEvent } from '../types/types';
import { PageItem } from './pageItem';
import { HMIOn, rgb_dec565 } from '../const/Color';
import { Icons } from '../const/icon_mapping';

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
export class PageGrid extends Page {
    config: pages.PageBaseConfig['config'];
    items: pages.PageBaseConfig['items'];
    private maxItems: number;
    private step: number = 0;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;
    tempItems: (PageItem | undefined)[] | undefined;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
        this.config = options.config;
        if (options.items && (options.items.card == 'cardGrid' || options.items.card == 'cardGrid2'))
            this.items = options.items;
        this.maxItems = this.card === 'cardGrid' ? 6 : 8;
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
        this.items.card = this.card as 'cardGrid' | 'cardGrid2';
        await super.init();
    }

    public async update(): Promise<void> {
        if (!this.visibility) return;
        const message: Partial<pages.PageGridMessage> = {};
        message.options = [];
        if (!this.items || (this.items.card !== 'cardGrid' && this.items.card !== 'cardGrid2')) return;
        if (!this.config || (this.config.card !== 'cardGrid' && this.config.card !== 'cardGrid2')) return;
        if (this.pageItems) {
            let maxItems = this.maxItems;
            let a = 0;
            if (this.pageItems.length > maxItems) {
                a = maxItems * this.step;
                maxItems = a + maxItems;
            }
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
                        testIt === !!(await a.dataItems.data.entity1.value.getBoolean())
                    )
                        this.tempItems.push(a);
                }
                pageItems = this.tempItems;
            }
            let b = 0;
            for (; a < maxItems; a++) {
                const temp = pageItems[a];
                message.options[b++] = temp ? await temp.getPageItemPayload() : '~~~~~';
            }
        }
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
    goLeft(): void {
        if (--this.step < 0) {
            this.step = 0;
            this.panel.navigation.goLeft();
        } else this.update();
    }
    goRight(): void {
        const length = this.pageItems ? this.pageItems.length : 0;
        if (++this.step * this.maxItems >= length) {
            this.step--;
            this.panel.navigation.goRight();
        } else this.update();
    }
    protected getNavigation(): string {
        const length = this.pageItems ? this.pageItems.length : 0;
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
                Icons.GetIcon('arrow-left-bold'),
                String(rgb_dec565(HMIOn)),
                '',
                '',
            );

        if (!right)
            right = getPayload(
                'button',
                'bSubNext',
                Icons.GetIcon('arrow-right-bold'),
                String(rgb_dec565(HMIOn)),
                '',
                '',
            );

        return getPayload(left, right);
    }
    async reset(): Promise<void> {
        this.step = 0;
    }
}
