import { Page, PageInterface } from '../classes/Page';
import { Green, HMIOn, Red, rgb_dec565 } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { getPayload, getPayloadArray } from '../const/tools';
import * as pages from '../types/pages';
import { PageItemDataItemsOptions } from '../types/type-pageItem';
import { IncomingEvent } from '../types/types';
import { PageItem } from './pageItem';

const PageEntitiesMessageDefault: pages.PageEntitiesMessage = {
    event: 'entityUpd',
    headline: 'Page Entities',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    options: ['~~~~~', '~~~~~', '~~~~~', '~~~~~', '~~~~~'],
};

export class PageEntities extends Page {
    config: pages.PageBaseConfig['config'];
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
                if (this.config.scrolltype === 'page') {
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
                    if (this.config.cardRole === 'adapterOff') {
                        this.tempItems = [];
                        for (const a of this.pageItems) {
                            if (
                                a &&
                                a.dataItems &&
                                a.dataItems.data &&
                                'entity1' in a.dataItems.data &&
                                a.dataItems.data.entity1 &&
                                a.dataItems.data.entity1.value &&
                                !(await a.dataItems.data.entity1.value.getBoolean())
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

    private async handleCardRole(): Promise<void> {
        if (!this.config || this.config.card !== 'cardEntities' || !this.config.cardRole) return;
        switch (this.config.cardRole) {
            /**
             * only for enabled adapters
             */
            case 'adapterOff':
            case 'adapter': {
                const list = await this.adapter.getObjectViewAsync('system', 'instance', {
                    startkey: `system.adapter`,
                    endkey: `system.adapter}`,
                });
                if (!list) return;
                this.pageItemConfig = [];
                for (const item of list.rows) {
                    const obj = item.value;
                    if (!obj.common.enabled || obj.common.mode !== 'daemon') continue;
                    let n = obj.common.titleLang && obj.common.titleLang[this.library.getLocalLanguage()];
                    n = n ? n : obj.common.titleLang && obj.common.titleLang['en'];
                    n = n ? n : obj.common.name;

                    const pi: PageItemDataItemsOptions = {
                        role: 'text.list',
                        type: 'text',
                        dpInit: '',

                        data: {
                            icon: {
                                true: {
                                    value: { type: 'const', constVal: 'power' },
                                    color: { type: 'const', constVal: Green },
                                },
                                false: {
                                    value: { type: 'const', constVal: 'power-off' },
                                    color: { type: 'const', constVal: Red },
                                },
                                scale: undefined,
                                maxBri: undefined,
                                minBri: undefined,
                            },
                            entity1: {
                                value: {
                                    type: 'triggered',
                                    dp: `${item.id}.alive`,
                                },
                            },
                            text: {
                                true: { type: 'const', constVal: n },
                                false: undefined,
                            },
                            text1: {
                                true: { type: 'const', constVal: obj.common.version },
                                false: undefined,
                            },
                        },
                    };
                    this.pageItemConfig.push(pi);
                }
                break;
            }
        }
    }
    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            await this.handleCardRole();
        }
        await super.onVisibilityChange(val);
    }

    goLeft(): void {
        if (!this.config || this.config.card !== 'cardEntities') return;
        if (this.config.scrolltype === 'page') {
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
        if (this.config.scrolltype === 'page') {
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
        if (this.config.scrolltype === 'page') {
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
