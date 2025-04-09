import type { Panel } from '../controller/panel';
import type { BaseClassTriggerdInterface } from './baseClassPage';
import type * as pages from '../types/pages';
import type { Page } from './Page';

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
};
