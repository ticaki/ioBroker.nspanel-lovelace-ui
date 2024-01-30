import { Page, PageInterface } from './Page';

//light, shutter, delete, text, button, switch, number,input_sel, timer und fan types
export class PageGrid extends Page {
    constructor(config: PageInterface) {
        super({ ...config, card: 'cardGrid' });
    }
}
