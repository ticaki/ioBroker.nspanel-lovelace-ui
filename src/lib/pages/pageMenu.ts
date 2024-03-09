import { Page, PageInterface } from '../classes/Page';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { getPayload } from '../const/tools';
import * as pages from '../types/pages';
import { handleCardRole } from './data-collection-functions';
import { PageItem } from './pageItem';

export class PageMenu extends Page {
    protected maxItems: number = 4;
    protected step: number = 0;
    protected iconLeft: string = '';
    protected iconRight: string = '';
    protected iconLeftP: string = '';
    protected iconRightP: string = '';
    private tempItems: (PageItem | undefined)[] | undefined;

    constructor(config: PageInterface, options: pages.PageBaseConfig) {
        super(config, options);
    }

    public async getOptions(result: string[]): Promise<string[]> {
        if (this.pageItems) {
            if (
                this.config &&
                (this.config.card === 'cardEntities' ||
                    this.config.card === 'cardGrid' ||
                    this.config.card === 'cardGrid2')
            ) {
                /**
                 * Live update von gefilterten Adaptern.
                 */
                let pageItems = this.pageItems;
                if (this.config.filterType === 'true' || this.config.filterType === 'false') {
                    this.tempItems = [];
                    const testIt = this.config.filterType === 'true';
                    for (const p of this.pageItems) {
                        if (
                            p &&
                            p.dataItems &&
                            p.dataItems.data &&
                            'entity1' in p.dataItems.data &&
                            p.dataItems.data.entity1 &&
                            p.dataItems.data.entity1.value &&
                            testIt === (await p.dataItems.data.entity1.value.getBoolean())
                        )
                            this.tempItems.push(p);
                    }
                    pageItems = this.tempItems;
                }

                const isEntities = this.config.card === 'cardEntities';
                let maxItems = this.maxItems;
                let a = 0;
                if (this.pageItems.length > maxItems) {
                    a = (isEntities ? maxItems : maxItems / 2) * this.step;
                    maxItems = a + maxItems;
                }
                let b = 0;

                if (this.config.scrollType === 'page') {
                    for (; a < maxItems; a++) {
                        const temp = pageItems[a];
                        result[b++] = temp ? await temp.getPageItemPayload() : '~~~~~';
                    }
                } else {
                    let a = this.step;
                    for (; a < this.maxItems + this.step; a++) {
                        const temp = pageItems[a];
                        result[b++] = temp ? await temp.getPageItemPayload() : '~~~~~';
                    }
                }
            }
        }
        return result;
    }

    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            if (
                this.config &&
                (this.config.card === 'cardEntities' ||
                    this.config.card === 'cardGrid' ||
                    this.config.card === 'cardGrid2')
            ) {
                const temp = await handleCardRole(this.adapter, this.config.cardRole, this);
                if (temp) this.pageItemConfig = temp;
            }
        }
        await super.onVisibilityChange(val);
    }

    goLeft(): void {
        if (
            !this.config ||
            (this.config.card !== 'cardEntities' && this.config.card !== 'cardGrid' && this.config.card !== 'cardGrid2')
        )
            return;

        if (--this.step < 0) {
            this.step = 0;
            this.panel.navigation.goLeft();
        } else this.update();
    }
    goRight(): void {
        if (
            !this.config ||
            (this.config.card !== 'cardEntities' && this.config.card !== 'cardGrid' && this.config.card !== 'cardGrid2')
        )
            return;
        const pageScroll = this.config.scrollType === 'page';

        const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
        if (!pageScroll ? ++this.step + this.maxItems > length : ++this.step * this.maxItems >= length) {
            this.step--;
            this.panel.navigation.goRight();
        } else this.update();
    }
    protected getNavigation(): string {
        if (
            !this.config ||
            (this.config.card !== 'cardEntities' && this.config.card !== 'cardGrid' && this.config.card !== 'cardGrid2')
        )
            return '';
        const pageScroll = this.config.scrollType === 'page';
        const length = this.tempItems ? this.tempItems.length : this.pageItems ? this.pageItems.length : 0;
        if (this.maxItems >= length) {
            return super.getNavigation();
        }
        let left = '';
        let right = '';
        if (this.step <= 0) {
            left = this.panel.navigation.buildNavigationString('left');
        }
        if (!pageScroll ? this.step + this.maxItems >= length : (this.step + 1) * this.maxItems >= length) {
            right = this.panel.navigation.buildNavigationString('right');
        }
        if (!left)
            left = getPayload(
                'button',
                'bSubPrev',
                pageScroll ? Icons.GetIcon('arrow-up-bold-outline') : Icons.GetIcon('arrow-up-bold'),
                String(Color.rgb_dec565(Color.HMIOn)),
                '',
                '',
            );

        if (!right)
            right = getPayload(
                'button',
                'bSubNext',
                pageScroll ? Icons.GetIcon('arrow-down-bold-outline') : Icons.GetIcon('arrow-down-bold'),
                String(Color.rgb_dec565(Color.HMIOn)),
                '',
                '',
            );

        return getPayload(left, right);
    }

    async reset(): Promise<void> {
        this.step = 0;
    }
}
