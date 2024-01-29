import { NspanelLovelaceUi } from '../../main';
import { BaseClass } from '../classes/library';
import { BaseClassPanelSend, PanelSend } from '../controller/panel-message';
import { PageTypeCards } from '../types/pages';
import { IncomingEvent } from '../types/types';

export interface Card {
    name: string;
    card: PageTypeCards;
}
//interface Page extends BaseClass | PageConfig

export class Page extends BaseClassPanelSend implements Card {
    readonly card: PageTypeCards;
    readonly id: number;
    //config: Card['config'];
    constructor(adapter: NspanelLovelaceUi, panelSend: PanelSend, card: PageTypeCards, name: string) {
        super(adapter, panelSend, name);
        this.card = card;
        this.id = 1;
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
    constructor(adapter: NspanelLovelaceUi, options: PageItemConfig) {
        super(adapter, 'Page');
        this.config = options;
    }
    async init(): Promise<void> {}
}
type PageItemConfig = {
    name: string;
};
