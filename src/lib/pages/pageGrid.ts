import { Page, PageInterface } from '../classes/Page';
import { getPayload, getPayloadArray } from '../const/tools';
import * as pages from '../types/pages';
import { PageItem } from './pageItem';

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
    private step: number = 1;
    private headlinePos: number = 0;
    private titelPos: number = 0;
    private nextArrow: boolean = false;
    tempItem: PageItem | undefined;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options.pageItems);
        this.config = options.config;
        if (options.items && (options.items.card == 'cardGrid' || options.items.card == 'cardGrid2'))
            this.items = options.items;
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {}

    public async update(): Promise<void> {
        const message: Partial<pages.PageGridMessage> = {};
        message.options = [];
        if (this.pageItems) {
            const maxItems = this.card === 'cardGrid' ? 6 : 8;
            for (let a = 0; a < maxItems; a++) {
                const temp = this.pageItems[a];
                if (temp) message.options[a] = await temp.getPageItemPayload();
            }
        }
        message.headline =
            (this.items && this.items.data.headline && (await this.items.data.headline.getString())) ?? '';
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
}
