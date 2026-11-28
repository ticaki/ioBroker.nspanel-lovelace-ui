import { expect } from 'chai';
import { BaseTriggeredPage } from '../classes/baseClassPage';
import { PageEntities } from './pageEntities';
import { PageGrid } from './pageGrid';

/**
 * Closing a popup (bExit) wakes the page below it: Panel.setActivePage(true) calls setVisibility(true) on the page
 * that is still visible. setVisibility calls onVisibilityChange(true) again then - PageMenu reset its scroll position
 * there, so a cardEntities/cardGrid page scrolled to its second page came back with the first one.
 */

type MenuPage = PageEntities | PageGrid;

/**
 * A menu page with the real setVisibility of BaseTriggeredPage and the paging of PageMenu, without panel.
 *
 * @param proto the prototype of the page class
 * @param card the card
 * @param config further page config (scrollPresentation …)
 * @returns the page and the item windows it sent (index of the first item of each update)
 */
function makePage(
    proto: object,
    card: 'cardEntities' | 'cardGrid',
    config: Record<string, unknown>,
): { page: MenuPage; starts: number[] } {
    const noop = (): void => undefined;
    const log = { debug: noop, warn: noop, error: noop, info: noop, silly: noop };
    const adapter: Record<string, unknown> = {
        unload: false,
        log,
        library: { writedp: async (): Promise<void> => Promise.resolve() },
        controller: {
            statesControler: {
                activateTrigger: async (): Promise<void> => Promise.resolve(),
                deactivateTrigger: async (): Promise<void> => Promise.resolve(),
            },
        },
        setTimeout: (): number => 1,
        clearTimeout: noop,
    };
    const panel = { name: 'p1', friendlyName: 'p1', info: { nspanel: { model: 'eu', currentPage: '' } } };
    // the constructor of BaseTriggeredPage creates setVisibility (an arrow function bound to the instance)
    const base = new BaseTriggeredPage({ adapter, name: 'page', panel }, 'ignore');
    Object.setPrototypeOf(base, proto);
    const page = base as unknown as MenuPage;
    const items = Array.from({ length: 10 }, (_v, i) => ({ id: i, delete: async (): Promise<void> => {} }));
    const starts: number[] = [];
    Object.assign(page, {
        card,
        config: { card, ...config },
        step: 0,
        maxItems: card === 'cardEntities' ? 4 : 6,
        pageItems: [...items],
        pageItemConfig: [],
        createPageItems: async (): Promise<unknown[]> => Promise.resolve([...items]),
        sendType: noop,
        update: async (): Promise<void> => {
            starts.push((page as unknown as { step: number }).step * (card === 'cardEntities' ? 4 : 6));
            return Promise.resolve();
        },
    });
    return { page, starts };
}

const cases: { name: string; proto: object; card: 'cardEntities' | 'cardGrid'; config: Record<string, unknown> }[] = [
    {
        name: 'cardEntities classic',
        proto: PageEntities.prototype,
        card: 'cardEntities',
        config: { scrollPresentation: 'classic' },
    },
    { name: 'cardEntities default', proto: PageEntities.prototype, card: 'cardEntities', config: {} },
    {
        name: 'cardGrid classic',
        proto: PageGrid.prototype,
        card: 'cardGrid',
        config: { scrollPresentation: 'classic' },
    },
];

describe('PageMenu - scroll position after a popup', () => {
    for (const c of cases) {
        it(`${c.name}: closing a popup keeps the second page`, async () => {
            const { page, starts } = makePage(c.proto, c.card, c.config);
            await page.setVisibility(true);
            page.goRight(true);
            expect(starts.at(-1)).to.equal(c.card === 'cardEntities' ? 4 : 6);
            // popup opened (the page sleeps below it) and closed: Panel.setActivePage(true)
            page.sleep = true;
            page.sleep = false;
            await page.setVisibility(true);
            expect(starts.at(-1)).to.equal(c.card === 'cardEntities' ? 4 : 6);
        });

        it(`${c.name}: a page shown again after it was hidden starts at the first items`, async () => {
            const { page, starts } = makePage(c.proto, c.card, c.config);
            await page.setVisibility(true);
            page.goRight(true);
            await page.setVisibility(false);
            await page.setVisibility(true);
            expect(starts.at(-1)).to.equal(0);
        });
    }
});
