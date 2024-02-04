import { AdapterClassDefinition, BaseClass } from '../classes/library';
import { Panel } from '../controller/panel';
import { BaseClassPanelSend } from '../controller/panel-message';
import { BaseClassTriggerdInterface } from '../controller/states-controller';
import { MessageItem, messageItemAllInterfaces } from '../types/type-pageItem';
import * as pages from '../types/pages';
import { IncomingEvent } from '../types/types';
import { ScreensaverConfig } from './screensaver';

export const messageItemDefault: MessageItem = {
    type: 'input_sel',
    intNameEntity: '',
    icon: '',
    iconColor: '',
    displayName: '',
    optionalValue: '',
};
export interface PageConfigInterface {
    config: pages.PageBaseConfig;
    page: PageInterface;
}
export type PageInterface = BaseClassTriggerdInterface & {
    card: pages.PageTypeCards;
    panel: Panel;
    id: string;
};
//interface Page extends BaseClass | PageConfig
export type PageConfigAll = ScreensaverConfig | pages.PageBaseConfig;
export class Page extends BaseClassPanelSend {
    readonly card: pages.PageTypeCards;
    readonly id: string;

    //config: Card['config'];
    constructor(card: PageInterface) {
        super(card);
        this.card = card.card;
        this.id = card.id;
    }
    async init(): Promise<void> {}

    async onButtonEvent(event: IncomingEvent): Promise<void> {
        this.log.warn(`Event received but no handler! ${JSON.stringify(event)}`);
    }
    sendType(): void {
        this.sendToPanel(`pageType~${this.card}`);
    }

    protected async onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            this.sendType();
            this.update();
        }
    }
    public async update(): Promise<void> {
        this.adapter.log.warn(
            `<- instance of [${Object.getPrototypeOf(this)}] update() is not defined or call super.onStateTrigger()`,
        );
    }

    /**
     * Create a part of the panel messsage for bottom icons. if event === '' u get '~~~~~~'.
     * default for event: input_sel
     * @param msg {Partial<MessageItem>}
     * @returns string
     */
    public getItemMesssage(msg: Partial<messageItemAllInterfaces> | undefined): string {
        if (!msg || !msg.intNameEntity || !msg.type) return '~~~~~';
        const id: string[] = [];
        if (msg.mainId) id.push(msg.mainId);
        if (msg.subId) id.push(msg.subId);
        if (msg.intNameEntity) id.push(msg.intNameEntity);
        return this.getPayload(
            msg.type ?? messageItemDefault.type,
            id.join('?') ?? messageItemDefault.intNameEntity,
            msg.icon ?? messageItemDefault.icon,
            msg.iconColor ?? messageItemDefault.iconColor,
            msg.displayName ?? messageItemDefault.displayName,
            msg.optionalValue ?? messageItemDefault.optionalValue,
        );
    }
}

export class PageItem extends BaseClass {
    config: PageItemConfig;
    pageItems: any[] = [];
    constructor(adapter: AdapterClassDefinition, options: PageItemConfig) {
        super(adapter, 'Page');
        this.config = options;
    }
    async init(): Promise<void> {}
}
type PageItemConfig = {
    name: string;
};
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

export type ButtonActionType =
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
    | 'U1';
