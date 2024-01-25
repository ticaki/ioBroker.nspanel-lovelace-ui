import { NspanelLovelaceUi } from '../../main';
import { BaseClass } from '../classes/library';
import { NavigationItem } from '../types/navigation';
import { PageMediaItem } from '../types/pageItem';
import * as Nspanel from '../types/types';

interface Card {
    card: Nspanel.PageTypeCards;
    name: string;
    config: {
        type: 'cardMedia';
        items: [PageMediaItem];
        headline: string;
        useColor: boolean;
        navigation: NavigationItem;
    };
}
//interface Page extends BaseClass | PageConfig

export class Page extends BaseClass implements Card {
    pageItems: any[] = [];
    card: Nspanel.PageTypeCards;
    config: Card['config'];
    test: number = 0;
    constructor(adapter: NspanelLovelaceUi, options: Card) {
        super(adapter, 'Page');
        this.config = options.config;
        this.card = options.card;
    }
    async init(): Promise<void> {}

    goLeft(): Page | undefined {
        if (this.config.navigation && this.config.navigation.left) return this.config.navigation.left.page;
        return undefined;
    }
    goRight(): Page | undefined {
        if (this.config.navigation && this.config.navigation.right) return this.config.navigation.right.page;
        return undefined;
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
