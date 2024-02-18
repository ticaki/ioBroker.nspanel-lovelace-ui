import { Panel } from '../controller/panel';
import { BaseClassPage, BaseClassTriggerdInterface } from '../controller/states-controller';
import * as pages from '../types/pages';
import { ButtonActionType, IncomingEvent, PopupType, isPopupType } from '../types/types';
import { ScreensaverConfig } from '../pages/screensaver';
import { PageItem } from '../pages/pageItem';
import { BaseClass } from './library';
import { cardTemplates } from '../templates/card';
import { deepAssign } from '../const/tools';

export interface PageConfigInterface {
    config: pages.PageBaseConfig;
    page: PageInterface;
}
export type PageItemInterface = BaseClassTriggerdInterface & {
    card: pages.PageTypeCards;
    panel: Panel;
    id: string;
    parent: Page;
};

export type PageInterface = BaseClassTriggerdInterface & {
    card: pages.PageTypeCards;
    panel: Panel;
    id: string;
    uniqueID: string;
};

//interface Page extends BaseClass | PageConfig
export type PageConfigAll = ScreensaverConfig | pages.PageBaseConfig;

export class Page extends BaseClassPage {
    readonly card: pages.PageTypeCards;
    readonly id: string;
    readonly uniqueID: string;
    config: pages.PageBaseConfig['config'];
    dpInit: string = '';
    //config: Card['config'];
    constructor(card: PageInterface, pageItemsConfig: pages.PageBaseConfig | undefined) {
        super(card, pageItemsConfig && pageItemsConfig.pageItems);
        this.card = card.card;
        this.id = card.id;
        this.uniqueID = card.uniqueID;
        this.dpInit = card.dpInit ?? '';
        this.config = pageItemsConfig && pageItemsConfig.config;
    }
    async init(): Promise<void> {}

    async onButtonEvent(event: IncomingEvent): Promise<void> {
        this.log.warn(`Event received but no handler! ${JSON.stringify(event)}`);
    }
    sendType(): void {
        this.sendToPanel(`pageType~${this.card}`);
    }

    static getPage(config: pages.PageBaseConfig, that: BaseClass): pages.PageBaseConfig {
        if ('template' in config && config.template) {
            let index = -1;
            let template: pages.PageBaseConfigTemplate | undefined;
            for (const i of [cardTemplates]) {
                index = i.findIndex((a) => a.template === config.template);
                if (index !== -1) {
                    template = i[index];
                    break;
                }
            }
            if (index === -1 || !template) {
                that.log.error('dont find template ' + config.template);
                return config;
            }
            if (template.adapter && !config.dpInit.startsWith(template.adapter)) {
                return config;
            }
            const newTemplate = JSON.parse(JSON.stringify(template)) as Partial<pages.PageBaseConfigTemplate>;
            delete newTemplate.adapter;
            if (config.card && config.card !== template.card) {
                that.log.error(config.card + 'is not equal with ' + template.card);
                return config;
            }

            config = deepAssign(newTemplate, config);
        }
        return config;
    }
    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            if (!this.pageItems && this.pageItemConfig) {
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
                    this.pageItems[a] = PageItem.getPageItem(config, this.pageItemConfig[a], this);
                    this.pageItems[a] && (await this.pageItems[a]!.init());
                }
            }
            this.sendType();
            this.update();
        } else {
            if (this.pageItems) {
                for (const item of this.pageItems) {
                    item && (await item.delete());
                }
                this.pageItems = undefined;
            }
        }
    }

    protected getNavigation(): string {
        return this.panel.navigation.buildNavigationString();
    }

    public async update(): Promise<void> {
        this.adapter.log.warn(
            `<- instance of [${Object.getPrototypeOf(this)}] update() is not defined or call super.onStateTrigger()`,
        );
    }

    public async onPopupRequest(
        id: number | string,
        popup: PopupType | undefined,
        action: ButtonActionType | undefined | string,
        value: string | undefined,
        _event: IncomingEvent | null = null,
    ): Promise<void> {
        if (!this.pageItems) return;
        this.log.debug(`Trigger from popupThermo 1 `);
        const i = typeof id === 'number' ? id : parseInt(id);
        const item = this.pageItems[i];
        if (!item) return;
        let msg: string | null = null;
        if (action && value !== undefined && (await item.onCommand(action, value))) {
            return;
        } else if (isPopupType(popup) && action !== 'bExit') {
            msg = await item.GeneratePopup(popup);
        }
        if (msg !== null) {
            this.sleep = true;
            this.sendToPanel(msg);
        }
    }
}

export function isMediaButtonActionType(F: MediaButtonActionType | string): F is MediaButtonActionType {
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

/*export type ButtonActionType =
    | 'bExit'
    | 'bUp'
    | 'bNext'
    | 'bSubNext'
    | 'bPrev'
    | 'bSubPrev'
    | 'bHome'
    | 'notifyAction'
    | 'OnOff'
    | 'button'
    | 'up'
    | 'stop'
    | 'down'
    | 'positionSlider'
    | 'tiltOpen'
    | 'tiltStop'
    | 'tiltSlider'
    | 'tiltClose'
    | 'brightnessSlider'
    | 'colorTempSlider'
    | 'colorWheel'
    | 'tempUpd'
    | 'tempUpdHighLow'
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
    | 'timer-start'
    | 'timer-pause'
    | 'timer-cancle'
    | 'timer-finish'
    | 'hvac_action'
    | 'mode-modus1'
    | 'mode-modus2'
    | 'mode-modus3'
    | 'number-set'
    | 'mode-preset_modes'
    | 'A1'
    | 'A2'
    | 'A3'
    | 'A4'
    | 'D1'
    | 'U1';*/
