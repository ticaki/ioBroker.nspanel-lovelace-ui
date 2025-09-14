import * as pages from '../types/pages';
import { BaseClassPage } from './baseClassPage';
import {
    isPopupType,
    type ButtonActionType,
    type IncomingEvent,
    type PopupType,
    type TemplateIdent,
} from '../types/types';
import { PageItem } from '../pages/pageItem';
import { deepAssign, getPayload, getRegExp } from '../const/tools';
import type { PageItemDataItemsOptions, PageItemOptionsTemplate } from '../types/type-pageItem';
import { pageItemTemplates } from '../templates/templateArray';
import type { PageInterface, PageItemInterface } from './PageInterface';
import { Icons } from '../const/icon_mapping';
import { Color, type RGB } from '../const/Color';

//interface Page extends BaseClass | PageConfig..
export type PageConfigAll = pages.PageBaseConfig;

export class Page extends BaseClassPage {
    readonly card: pages.PageTypeCards;
    readonly id: string;
    private lastCardCounter: number = 0;
    public readonly isScreensaver: boolean;
    public hidden: boolean = false;
    /**
     * Direct reference to the parent page,
     * bypassing navigation logic.
     */
    public directParentPage: Page | undefined;

    /**
     * Direct reference to the child page,
     * bypassing navigation logic.
     */
    public directChildPage: Page | undefined; //readonly enums: string | string[];
    config: pages.PageBaseConfig['config'];
    //config: Card['config'];
    constructor(
        card: PageInterface,
        pageItemsConfig: pages.PageBaseConfig | undefined,
        isScreensaver: boolean = false,
    ) {
        super(card, pageItemsConfig && pageItemsConfig.pageItems);
        this.isScreensaver = isScreensaver;
        this.card = card.card;
        this.id = card.id;
        this.hidden = pageItemsConfig && 'hidden' in pageItemsConfig ? !!pageItemsConfig.hidden : false;
        this.enums =
            pageItemsConfig && 'enums' in pageItemsConfig && pageItemsConfig.enums ? pageItemsConfig.enums : '';
        this.device =
            pageItemsConfig && 'device' in pageItemsConfig && pageItemsConfig.device ? pageItemsConfig.device : '';
        if (this.device) {
            card.dpInit = typeof card.dpInit === 'string' ? card.dpInit.replace('#°^°#', this.device) : card.dpInit;
        }
        if (card.dpInit && typeof card.dpInit === 'string') {
            const reg = getRegExp(card.dpInit);
            if (reg) {
                card.dpInit = reg;
            }
        }
        this.dpInit = card.dpInit ?? '';
        this.config = pageItemsConfig && pageItemsConfig.config;
    }

    /**
     * ...
     */
    async init(): Promise<void> {
        // do the work für PageItems only one time - changes in ObjectDB need a adapter restart.
        if (this.pageItemConfig) {
            for (let a = 0; a < this.pageItemConfig.length; a++) {
                let options = this.pageItemConfig[a];
                if (options === undefined) {
                    continue;
                }

                // switch type text to button as indicator for cardThermo
                if (options.type === 'text' && this && this.card === 'cardThermo') {
                    options.type = 'button' as any;
                    options.role = 'indicator';
                }

                options = await this.getItemFromTemplate(options);
                if (!options) {
                    this.log.error(`Dont get a template for ${a} in ${this.name}`);
                    continue;
                }

                options.dpInit =
                    typeof options.dpInit === 'string' && options.device
                        ? options.dpInit.replace('#°^°#', options.device)
                        : options.dpInit;

                if (options.dpInit && typeof options.dpInit === 'string') {
                    const reg = getRegExp(options.dpInit, { startsWith: true });
                    if (reg) {
                        options.dpInit = reg;
                    }
                }
                // search states for mode auto
                const dpInit = (this.dpInit ? this.dpInit : options.dpInit) ?? '';
                const enums = this.enums ? this.enums : options.enums;
                if (!dpInit && !enums) {
                    this.log.debug(`No dpInit or enums for pageItem ${a} in ${this.name}`);
                }

                options.data =
                    dpInit || enums
                        ? await this.basePanel.statesControler.getDataItemsFromAuto(
                              dpInit,
                              options.data,
                              'appendix' in options ? options.appendix : undefined,
                              this.enums ? this.enums : options.enums,
                          )
                        : options.data;
                options = JSON.parse(JSON.stringify(options));
                if (options) {
                    options.dpInit = dpInit;
                }
                this.pageItemConfig[a] = await this.initPageItems(options);
            }
        }
    }

    async initPageItems(item: PageItemDataItemsOptions | undefined): Promise<PageItemDataItemsOptions | undefined> {
        let options = item;
        if (options === undefined) {
            return undefined;
        }
        const dpInit = (this.dpInit ? this.dpInit : options.dpInit) ?? '';
        const enums = this.enums ? this.enums : options.enums;

        options.data =
            dpInit || enums
                ? await this.basePanel.statesControler.getDataItemsFromAuto(
                      dpInit,
                      options.data,
                      'appendix' in options ? options.appendix : undefined,
                      this.enums ? this.enums : options.enums,
                  )
                : options.data;
        options = JSON.parse(JSON.stringify(options));
        if (options) {
            options.dpInit = dpInit;
        }
        return options;
    }

    async getItemFromTemplate(
        options: PageItemDataItemsOptions,
        subtemplate: TemplateIdent = '',
        loop: number = 0,
    ): Promise<PageItemDataItemsOptions | undefined> {
        if ('template' in options && options.template) {
            const template: PageItemOptionsTemplate | undefined = subtemplate
                ? pageItemTemplates[subtemplate]
                : pageItemTemplates[options.template];
            const name = options.template;
            if (!template) {
                this.log.error(`Dont find template ${options.template}`);
                return undefined;
            }
            if (
                template.adapter &&
                typeof options.dpInit === 'string' &&
                !options.dpInit.includes(template.adapter) &&
                typeof this.dpInit === 'string' &&
                !this.dpInit.includes(template.adapter)
            ) {
                this.log.error(
                    `Missing dbInit or dbInit not starts with${template.adapter} for template ${options.template}`,
                );
                return undefined;
            }

            const newTemplate = structuredClone(template) as Partial<PageItemOptionsTemplate>;
            delete newTemplate.adapter;
            if (
                options.type &&
                options.type !== template.type &&
                !(options.type == 'button' && template.type == 'text')
            ) {
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                this.log.error(`Type: ${String(options.type)} is not equal with ${template.type}`);
                return undefined;
            }
            const colorTrue = (options.color || {}).true;
            const colorFalse = (options.color || {}).false;
            const colorScale = (options.color || {}).scale;
            const iconTrue = (options.icon || {}).true;
            const iconFalse = (options.icon || {}).false;

            options.type = options.type || template.type;
            options.role = options.role || template.role;
            options = deepAssign(newTemplate, options);
            if (template.template !== undefined) {
                if (loop > 10) {
                    throw new Error(
                        `Endless loop in getItemFromTemplate() detected! From ${template.template} for ${name}. Bye Bye`,
                    );
                }
                const o = await this.getItemFromTemplate(options, template.template, ++loop);
                if (o !== undefined) {
                    options = o;
                } else {
                    this.log.warn(`Dont get a template from ${template.template} for ${name}`);
                }
            }
            if (options.data) {
                options.data.icon = options.data.icon ?? {};
                if (colorTrue) {
                    options.data.icon.true = options.data.icon.true ?? {};
                    options.data.icon.true.color = colorTrue;
                }
                if (iconTrue) {
                    options.data.icon.true = options.data.icon.true ?? {};
                    options.data.icon.true.value = iconTrue;
                }
                if (colorFalse) {
                    options.data.icon.false = options.data.icon.false ?? {};
                    options.data.icon.false.color = colorFalse;
                }
                if (iconFalse) {
                    options.data.icon.false = options.data.icon.false ?? {};
                    options.data.icon.false.value = iconFalse;
                }
                if (colorScale) {
                    options.data.icon.scale = { type: 'const', constVal: colorScale };
                }
            }
        }
        return options;
    }

    async onButtonEvent(event: IncomingEvent): Promise<void> {
        this.log.warn(`Event received but no handler! ${JSON.stringify(event)}`);
    }
    sendType(force?: boolean): void {
        let renderCurrentPage = false;
        switch (this.card) {
            case 'cardChart':
            case 'cardLChart':
            case 'cardEntities':
            case 'cardGrid':
            case 'cardGrid2':
            case 'cardGrid3':
            case 'cardThermo':
            case 'cardMedia':
            case 'cardUnlock':
            case 'cardQR':
            case 'cardAlarm':
            case 'cardPower':
            case 'screensaver':
            case 'screensaver2':
            case 'screensaver3':
            case 'cardBurnRec':
            case 'cardItemSpecial':
            case 'cardSchedule':
            case 'cardThermo2':
                renderCurrentPage = true;
                break;
            case 'popupNotify':
            case 'popupNotify2':
                renderCurrentPage = false;
                break;
            default:
                pages.exhaustiveCheck(this.card);
                break;
        }
        if (force || this.basePanel.lastCard !== this.card || this.card === 'cardThermo') {
            this.sendToPanel(`pageType~${this.card}`, renderCurrentPage);
        } else {
            if (this.lastCardCounter++ > 10) {
                this.lastCardCounter = 0;
                this.sendToPanel(`pageType~${this.card}`, renderCurrentPage);
            }
        }
        this.basePanel.lastCard = this.card;
    }

    async createPageItems(
        pageItemsConfig: PageItemDataItemsOptions | (PageItemDataItemsOptions | undefined)[] | undefined,
        ident: string = '',
    ): Promise<(PageItem | undefined)[] | undefined> {
        const result = [];
        if (pageItemsConfig) {
            if (!Array.isArray(pageItemsConfig)) {
                pageItemsConfig = [pageItemsConfig];
            }
            for (let a = 0; a < pageItemsConfig.length; a++) {
                const config: Omit<PageItemInterface, 'pageItemsConfig'> = {
                    name: ident ? ident : 'PI',
                    adapter: this.adapter,
                    panel: this.basePanel,
                    card: 'cardItemSpecial',
                    id: `${this.id}?${ident ? ident : a}`,
                    parent: this,
                };
                result[a] = await PageItem.getPageItem(config, pageItemsConfig[a]);
            }
        }
        return result;
    }

    protected getNavigation(side?: 'left' | 'right'): string {
        if (this.directParentPage) {
            let left = '';
            let right = '';
            if (!side || side === 'left') {
                left = getPayload(
                    'button',
                    'bUp',
                    Icons.GetIcon('arrow-up-bold'),
                    String(Color.rgb_dec565(Color.navParent as RGB)),
                    '',
                    '',
                );
            }
            if (!side || side === 'right') {
                right = getPayload('', '', '', '', '', '');
            }
            if (!side) {
                return getPayload(left, right);
            }
            return side === 'left' ? left : right;
        }

        return this.basePanel.navigation.buildNavigationString(side);
    }

    goLeft(): void {
        if (this.directParentPage) {
            void this.basePanel.setActivePage(this.directParentPage, false);
            return;
        }
        this.basePanel.navigation.goLeft();
    }

    goRight(): void {
        if (this.directParentPage) {
            return;
        }
        this.basePanel.navigation.goRight();
    }
    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            if (!this.pageItems || this.pageItems.length === 0) {
                this.pageItems = await this.createPageItems(this.pageItemConfig);
            }
            //if (this.card !== 'cardLChart') {
            this.sendType();
            //}
            await this.update();
        } else {
            if (this.pageItems) {
                for (const item of this.pageItems) {
                    item && (await item.delete());
                }
                this.pageItems = [];
            }
        }
    }
    getdpInitForChild(): string | RegExp {
        return '';
    }
    setLastPage(_p: Page | undefined): void {}
    removeLastPage(_p: Page | undefined): void {}

    public async update(): Promise<void> {
        this.adapter.log.warn(
            `<- instance of [${Object.getPrototypeOf(this)}] update() is not defined or call super.onStateTrigger()`,
        );
    }

    /**
     * Handles a popup request.
     *
     * @param id - The ID of the item.
     * @param popup - The popup type.
     * @param action - The action to be performed.
     * @param value - The value associated with the action.
     * @param _event - The incoming event.
     * @returns A promise that resolves when the popup request is handled.
     */
    public async onPopupRequest(
        id: number | string,
        popup: PopupType | undefined,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        action: ButtonActionType | undefined | string,
        value: string | undefined,
        _event: IncomingEvent | null = null,
    ): Promise<void> {
        if (!this.pageItems || id == '') {
            this.log.debug(
                `onPopupRequest: No pageItems or id this is only a warning if u used a pageitem except: 'arrow': ${id}`,
            );
            return;
        }
        let item: PageItem | undefined;
        if (isNaN(Number(id)) && typeof id === 'string') {
            this.log.error(
                `onPopupRequest: id should be a number but is a string: ${id}. Page name: ${this.name}, Page id: ${this.id}, Page card: ${this.card}`,
            );
        } else {
            const i = typeof id === 'number' ? id : parseInt(id);
            item = this.pageItems[i];
        }
        if (!item) {
            return;
        }
        let msg: string | null = null;
        if (action && value !== undefined && (await item.onCommand(action, value))) {
            return;
        } else if (isPopupType(popup) && action !== 'bExit') {
            this.basePanel.lastCard = '';
            msg = await item.GeneratePopup(popup);
        }
        if (msg !== null) {
            this.sleep = true;
            this.sendToPanel(msg, false);
        }
    }
    async delete(): Promise<void> {
        await super.delete();
        if (this.directChildPage) {
            await this.directChildPage.delete();
            this.directChildPage = undefined;
        }
        if (this.directParentPage) {
            this.directParentPage.directChildPage = undefined;
            this.directParentPage = undefined;
        }
        if (this.pageItems) {
            for (const item of this.pageItems) {
                item && (await item.delete());
            }
        }
        this.pageItems = [];
        this.pageItemConfig = [];
    }
}

export function isMediaButtonActionType(F: string): F is MediaButtonActionType {
    switch (F) {
        case 'media-back':
        case 'media-pause':
        case 'media-next':
        case 'media-shuffle':
        case 'volumeSlider':
        case 'mode-speakerlist':
        case 'mode-playlist':
        case 'mode-tracklist':
        case 'mode-repeat':
        case 'mode-equalizer':
        case 'mode-seek':
        case 'mode-crossfade':
        case 'mode-favorites':
        case 'mode-insel':
        case 'media-OnOff':
        case 'button':
            return true;
    }
    console.error(`${F} isMediaButtonActionType === false`);
    return false;
}
type MediaButtonActionType = Extract<
    ButtonActionType,
    | 'media-back'
    | 'media-pause'
    | 'media-next'
    | 'media-shuffle'
    | 'volumeSlider'
    | 'mode-speakerlist'
    | 'mode-playlist'
    | 'mode-tracklist'
    | 'mode-repeat'
    | 'mode-equalizer'
    | 'mode-seek'
    | 'mode-crossfade'
    | 'mode-favorites'
    | 'mode-insel'
    | 'media-OnOff'
    | 'button'
>;
