import type { Panel } from '../controller/panel';
import type * as pages from '../types/pages';
import type { Page } from './Page';

export type PageItemInterface = BaseTriggeredPageInterface & {
    card: pages.PageTypeCards;
    panel: Panel;
    id: string;
    parent: Page;
};

export type PageInterface = BaseTriggeredPageInterface & {
    card: pages.PageTypeCards;
    panel: Panel;
    id: string;
};
