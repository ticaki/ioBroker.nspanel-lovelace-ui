import { AdapterType } from '../../main';
import { BaseClass } from '../classes/library';
import { Panel } from '../controller/panel';
import { BaseClassPanelSend } from '../controller/panel-message';
import { BaseClassTriggerdInterface } from '../controller/states-controller';
import { PageTypeCards } from '../types/pages';
import { IncomingEvent } from '../types/types';

export interface PageInterface extends BaseClassTriggerdInterface {
    card: PageTypeCards;
    panel: Panel;
    id: number;
}
//interface Page extends BaseClass | PageConfig

export class Page extends BaseClassPanelSend {
    readonly card: PageTypeCards;
    readonly id: number;
    protected panel: Panel;
    //config: Card['config'];
    constructor(card: PageInterface) {
        super(card);
        this.card = card.card;
        this.id = card.id;
        this.panel = card.panel;
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
}

export class PageItem extends BaseClass {
    config: PageItemConfig;
    pageItems: any[] = [];
    constructor(adapter: AdapterType, options: PageItemConfig) {
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
