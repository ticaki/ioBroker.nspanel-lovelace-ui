import type * as pages from '../types/pages';
import { BaseClassPage } from './BaseClassPage';
import {
    isPopupType,
    type ButtonActionType,
    type IncomingEvent,
    type PopupType,
    type TemplateIdent,
} from '../types/types';
import { PageItem } from '../pages/pageItem';
import { deepAssign, getRegExp } from '../const/tools';
import type { PageItemDataItemsOptions, PageItemOptionsTemplate } from '../types/type-pageItem';
import { pageItemTemplates } from '../templates/templateArray';
import type { PageInterface, PageItemInterface } from './PageInterface';

//interface Page extends BaseClass | PageConfig..
export type PageConfigAll = pages.PageBaseConfig;

export class Page extends BaseClassPage {
    readonly card: pages.PageTypeCards;
    readonly id: string;
    private lastCardCounter: number = 0;
    public readonly isScreensaver: boolean;
    //readonly enums: string | string[];
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
                    this.log.error(`Dont get a template for ${a}`);
                    continue;
                }

                options.dpInit =
                    typeof options.dpInit === 'string' && options.device
                        ? options.dpInit.replace('#°^°#', options.device)
                        : options.dpInit;

                if (options.dpInit && typeof options.dpInit === 'string') {
                    const reg = getRegExp(options.dpInit);
                    if (reg) {
                        options.dpInit = reg;
                    }
                }
                // search states for mode auto
                const dpInit = (this.dpInit ? this.dpInit : options.dpInit) ?? '';
                const enums = this.enums ? this.enums : options.enums;

                options.data =
                    dpInit || enums
                        ? await this.panel.statesControler.getDataItemsFromAuto(
                              (this.dpInit ? this.dpInit : options.dpInit) ?? '',
                              options.data,
                              'appendix' in options ? options.appendix : undefined,
                              this.enums ? this.enums : options.enums,
                          )
                        : options.data;

                this.pageItemConfig[a] = options;
            }
        }
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
                this.log.error(`Type: ${String(options.type)}is not equal with ${template.type}`);
                return undefined;
            }
            const colorTrue = (options.color || {}).true;
            const colorFalse = (options.color || {}).false;
            const colorScale = (options.color || {}).scale;
            const iconTrue = (options.icon || {}).true;
            const iconFalse = (options.icon || {}).false;

            options.type = options.type || template.type;
            options.role = options.role || template.role;
            if (options.appendix) {
                this.log.debug('c');
            }
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
    sendType(): void {
        if (this.panel.lastCard !== this.card || this.card === 'cardThermo') {
            this.sendToPanel(`pageType~${this.card}`);
        } else {
            if (this.lastCardCounter++ > 5) {
                this.lastCardCounter = 0;
                this.sendToPanel(`pageType~${this.card}`);
            }
        }
        this.panel.lastCard = this.card;
    }

    protected async createPageItems(): Promise<void> {
        if (this.pageItemConfig) {
            this.pageItems = [];
            for (let a = 0; a < this.pageItemConfig.length; a++) {
                const config: Omit<PageItemInterface, 'pageItemsConfig'> = {
                    name: 'PI',
                    adapter: this.adapter,
                    panel: this.panel,
                    panelSend: this.panelSend,
                    card: 'cardItemSpecial',
                    id: `${this.id}?${a}`,
                    parent: this,
                };
                this.pageItems[a] = await PageItem.getPageItem(config, this.pageItemConfig[a]);
            }
        }
    }

    goLeft(): void {
        this.panel.navigation.goLeft();
    }
    goRight(): void {
        this.panel.navigation.goRight();
    }
    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            if (!this.pageItems || this.pageItems.length === 0) {
                await this.createPageItems();
            }
            if (this.card !== 'cardLChart' && this.card !== 'cardChart') {
                this.sendType();
            }
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

    setLastPage(_p: Page | undefined): void {}
    removeLastPage(_p: Page | undefined): void {}

    protected getNavigation(): string {
        return this.panel.navigation.buildNavigationString();
    }

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
        if (!this.pageItems) {
            return;
        }
        const i = typeof id === 'number' ? id : parseInt(id);
        const item = this.pageItems[i];
        if (!item) {
            return;
        }
        let msg: string | null = null;
        if (action && value !== undefined && (await item.onCommand(action, value))) {
            return;
        } else if (isPopupType(popup) && action !== 'bExit') {
            this.panel.lastCard = '';
            msg = await item.GeneratePopup(popup);
        }
        if (msg !== null) {
            this.sleep = true;
            this.sendToPanel(msg);
        }
    }
    async delete(): Promise<void> {
        await super.delete();
        this.pageItems = [];
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
