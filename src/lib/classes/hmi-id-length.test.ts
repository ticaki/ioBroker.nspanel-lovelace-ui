import { expect } from 'chai';
import sinon from 'sinon';
import { Page } from './Page';
import { Navigation, SCREENSAVER_NAV_INDEX } from './navigation';
import { PageItem } from '../pages/pageItem';
import { PageMenu } from '../pages/pageMenu';
import { Screensaver } from '../pages/screensaver';
import { Color } from '../const/Color';

/**
 * HMI 6.2.0 keeps the ids of page items and navigation in string variables with txt_maxl 23 (HMI/tools/
 * shrink_id_buffers.py: nent1/nent2 of every page, entn* of cardMedia and of the popups) - the colors of
 * `pageType~screensaver…` go into pageIcons.tTmp2. A longer id is cut off on the display and comes back shortened
 * with the events. These tests build the ids with the code that sends them.
 */
const HMI_ID_MAX = 23;

describe('HMI id length (txt_maxl 23 of the id buffers)', () => {
    afterEach(() => sinon.restore());

    /**
     * a page with this id, page items are created as plain objects carrying their id
     *
     * @param id page id (String of the page index)
     * @param extra further properties
     */
    function page(id: string, extra: Record<string, unknown> = {}): any {
        const p: any = Object.create(Page.prototype);
        Object.assign(p, { id, name: `page-${id}`, adapter: {}, basePanel: {}, ...extra });
        return p;
    }

    beforeEach(() => {
        sinon.stub(PageItem, 'getPageItem').callsFake(async (config: any) => Promise.resolve(config));
    });

    // panel.ts: page id = String(index of the page), system pages are appended to the user pages
    const pageIds = ['0', '9', '99', '999', '1999'];

    it('page items of a page with many items and a large page index', async () => {
        for (const id of pageIds) {
            const p = page(id);
            const items = await p.createPageItems(new Array(250).fill({ type: 'text' }));
            for (const item of items) {
                expect(item.id.length, item.id).to.be.at.most(HMI_ID_MAX);
            }
            const at = await p.getPageItemAt(249);
            expect(at.id.length, at.id).to.be.at.most(HMI_ID_MAX);
        }
    });

    it('logo item of cardMedia (<page>?logo)', async () => {
        for (const id of pageIds) {
            const [logo] = await page(id).createPageItems({ type: 'text' }, 'logo');
            expect(logo.id).to.equal(`${id}?logo`);
            expect(logo.id.length).to.be.at.most(HMI_ID_MAX);
        }
    });

    it('next-page arrow of the menu pages (<page>?0 + additionalId)', async () => {
        sinon.stub(Page.prototype, 'init').resolves();
        for (const id of pageIds) {
            const p: any = Object.create(PageMenu.prototype);
            Object.assign(p, { id, name: `page-${id}`, adapter: {}, basePanel: {} });
            let config: any;
            p.createPageItems = async (cfg: any[]): ReturnType<Page['createPageItems']> => {
                config = cfg[0];
                return Page.prototype.createPageItems.call(p, cfg);
            };
            await PageMenu.prototype.init.call(p);
            const sent = p.arrowPageItem.id + config.data.additionalId.constVal;
            expect(sent.endsWith('-NextPageArrow')).to.equal(true);
            expect(sent.length, sent).to.be.at.most(HMI_ID_MAX);
        }
    });

    it('navigation ids of the arrows (nent1/nent2)', () => {
        const ids = new Set<string>();
        const variants: { left: any; right: any }[] = [
            { left: { single: 1 }, right: { single: 2 } },
            { left: { single: 1, double: 3 }, right: { single: 2, double: 4 } },
            { left: { double: SCREENSAVER_NAV_INDEX }, right: { double: SCREENSAVER_NAV_INDEX } },
        ];
        for (const v of variants) {
            const nav: any = Object.create(Navigation.prototype);
            Object.assign(nav, { database: [{ ...v, page: {}, index: 0 }], _currentItem: 0 });
            const fields = String(nav.buildNavigationString()).split('~');
            ids.add(fields[1]);
            ids.add(fields[7]);
        }
        // a sub page: the up arrow of Page.getNavigation
        const sub = page('5', { directParentPage: {} });
        ids.add(String(sub.getNavigation()).split('~')[1]);
        expect([...ids].filter(Boolean)).to.include.members(['bSubPrev', 'bSubNext', 'bUp', 'bHome']);
        for (const id of ids) {
            expect(id.length, id).to.be.at.most(HMI_ID_MAX);
        }
    });

    it('colors of pageType~screensaver… fit into pageIcons.tTmp2 (27) and an id buffer (23)', () => {
        const white = { r: 255, g: 255, b: 255 };
        sinon.stub(Color, 'background').value(white);
        sinon.stub(Color, 'fgTimeAmPm').value(white);
        sinon.stub(Color, 'fgDate').value(white);
        const colors: string = (Screensaver.prototype as any).pageTypeColors.call({ timeColor: () => white });
        expect(colors.split('?')).to.have.length(4);
        expect(colors.length, colors).to.be.at.most(HMI_ID_MAX);
    });
});
