import { Page, PageInterface } from './Page';

export class PageGrid extends Page {
    constructor(config: PageInterface) {
        super({ ...config, card: 'cardGrid' });
    }
}
