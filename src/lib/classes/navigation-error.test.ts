import { expect } from 'chai';
import { Navigation } from './navigation';
import { navigationErrorPageName } from '../types/adminShareConfig';
import { systemNavigation, systemPages } from '../templates/system-templates';
import { navigationTargetProblem } from '../configuration/admin';

const noop = (): void => undefined;

/**
 * Navigation with a mocked panel: every node has a page except the ones listed in `withoutPage`.
 *
 * @param nodes Navigation nodes.
 * @param withoutPage Names of the pages that do not exist.
 * @returns The navigation and what it did.
 */
function setup(
    nodes: Record<string, unknown>[],
    withoutPage: string[],
): {
    nav: any;
    warnings: string[];
    shown: string[];
    internal: Record<string, unknown>;
} {
    const warnings: string[] = [];
    const shown: string[] = [];
    const internal: Record<string, unknown> = {};
    const pages: Record<string, unknown> = {};
    const panel: any = {
        name: 'p',
        friendlyName: 'p',
        hideCards: false,
        getPagebyUniqueID: (id: string): unknown => {
            if (withoutPage.includes(id)) {
                return null;
            }
            pages[id] ??= { name: id, id, hidden: false };
            return pages[id];
        },
        activateScreensaver: async (): Promise<void> => Promise.resolve(),
        setActivePage: async (page: { name: string }): Promise<void> => {
            shown.push(page.name);
            return Promise.resolve();
        },
        statesControler: {
            setInternalState: async (id: string, val: unknown): Promise<boolean> => {
                internal[id] = val;
                return Promise.resolve(true);
            },
        },
    };
    const adapter: any = {
        log: { silly: noop, debug: noop, info: noop, warn: (m: string) => warnings.push(m), error: noop },
        library: { writedp: async (): Promise<void> => Promise.resolve() },
        config: {},
        getObjectAsync: async (): Promise<unknown> => Promise.resolve({ native: {} }),
        setObject: async (): Promise<void> => Promise.resolve(),
    };
    const nav: any = new Navigation({
        adapter,
        panel,
        navigationConfig: structuredClone(nodes.concat(systemNavigation as any)) as any,
    });
    nav.log = adapter.log;
    nav.library = adapter.library;
    return { nav, warnings, shown, internal };
}

const tick = async (): Promise<void> => new Promise(resolve => setImmediate(resolve));

const indexOf = (nav: any, name: string): number =>
    nav.navigationConfig.findIndex((a: { name: string }) => a.name === name);

describe('lib/classes/navigation - target without page', () => {
    const chain = (): Record<string, unknown>[] => [
        { name: 'main', page: 'main', left: { single: 'heizung' }, right: { single: 'wecker' } },
        { name: 'wecker', page: 'wecker', left: { single: 'heizung' }, right: { single: 'main' } },
        { name: 'heizung', page: 'heizung', left: { single: 'main' }, right: { single: 'wecker' } },
    ];

    it('the system page exists for every panel', () => {
        expect(systemPages.some(p => p.uniqueID === navigationErrorPageName)).to.equal(true);
        const node = systemNavigation.find(n => n && n.name === navigationErrorPageName);
        expect(node?.page).to.equal(navigationErrorPageName);
        expect(node?.right?.double).to.equal('main');
    });

    it('keeps the arrow and warns once per link at start', async () => {
        const f = setup(chain(), ['heizung']);
        await f.nav.init();
        const db = f.nav.getDatabase();
        const wecker = indexOf(f.nav, 'wecker');
        const heizung = indexOf(f.nav, 'heizung');
        expect(db[heizung]).to.equal(undefined);
        expect(db[wecker].left.single).to.equal(heizung);
        expect(f.warnings).to.deep.equal([
            'Navigation of page "main": target "heizung" has no page (script page dropped or admin page missing).',
            'Navigation of page "wecker": target "heizung" has no page (script page dropped or admin page missing).',
        ]);
        f.nav.currentItem = wecker;
        expect(f.nav.buildNavigationString('left').split('~')[1]).to.equal('bSubPrev');
    });

    it('opens the error page with origin and target, back returns to the origin', async () => {
        const f = setup(chain(), ['heizung']);
        await f.nav.init();
        const wecker = indexOf(f.nav, 'wecker');
        const errorIndex = indexOf(f.nav, navigationErrorPageName);
        f.nav.currentItem = wecker;
        f.nav.goLeft(true);
        await tick();
        expect(f.shown).to.deep.equal([navigationErrorPageName]);
        expect(f.nav.currentItem).to.equal(errorIndex);
        expect(f.internal['p/info/navigationErrorTarget']).to.equal('heizung');
        expect(f.internal['p/info/navigationErrorOrigin']).to.equal('wecker');
        // no new warning while navigating - the start already reported it
        expect(f.warnings).to.have.length(2);
        expect(f.nav.buildNavigationString('left').split('~')[1]).to.equal('bSubPrev');
        expect(f.nav.buildNavigationString('right').split('~')[1]).to.equal('bHome');

        f.nav.goLeft(true);
        await tick();
        expect(f.shown).to.deep.equal([navigationErrorPageName, 'wecker']);
        expect(f.nav.currentItem).to.equal(wecker);
    });

    it('works from the main page, home of the error page leads to the main page', async () => {
        const f = setup(chain(), ['heizung']);
        await f.nav.init();
        f.nav.currentItem = indexOf(f.nav, 'main');
        f.nav.goLeft(true);
        await tick();
        expect(f.internal['p/info/navigationErrorOrigin']).to.equal('main');
        f.nav.goRight(false);
        await tick();
        expect(f.shown).to.deep.equal([navigationErrorPageName, 'main']);
    });

    it('a hidden origin: back goes on in the same direction past it', async () => {
        const f = setup(
            [
                { name: 'main', page: 'main', left: { single: 'x' }, right: { single: 'h' } },
                { name: 'h', page: 'h', left: { single: 'main' }, right: { single: 'gone' } },
                { name: 'gone', page: 'gone' },
            ],
            ['gone'],
        );
        await f.nav.init();
        f.nav.panel.hideCards = true;
        f.nav.getDatabase()[indexOf(f.nav, 'h')].page.hidden = true;
        f.nav.currentItem = indexOf(f.nav, 'main');
        f.nav.goRight(true);
        await tick();
        expect(f.shown).to.deep.equal([navigationErrorPageName]);
        expect(f.internal['p/info/navigationErrorOrigin']).to.equal('h');
        f.nav.goLeft(true);
        await tick();
        expect(f.shown).to.deep.equal([navigationErrorPageName, 'main']);
        expect(f.nav.infityCounter).to.equal(0);
    });

    it('a target without page from the error page keeps the way back (no loop)', async () => {
        const f = setup(
            [{ name: 'wecker', page: 'wecker', left: { single: 'heizung' } }, ...chain().slice(2)],
            ['heizung', 'main'],
        );
        await f.nav.init();
        const wecker = indexOf(f.nav, 'wecker');
        const errorIndex = indexOf(f.nav, navigationErrorPageName);
        f.nav.currentItem = wecker;
        f.nav.goLeft(true);
        await tick();
        expect(f.nav.currentItem).to.equal(errorIndex);
        // home of the error page: the start node has no page either
        await f.nav.setTargetPageByName('heizung');
        expect(f.nav.currentItem).to.equal(errorIndex);
        expect(f.nav.getDatabase()[errorIndex].left.single).to.equal(wecker);
        expect(f.internal['p/info/navigationErrorOrigin']).to.equal('wecker');
    });

    it('normal links and system nodes are unchanged', async () => {
        const f = setup(chain(), []);
        await f.nav.init();
        expect(f.warnings).to.deep.equal([]);
        f.nav.currentItem = indexOf(f.nav, 'main');
        f.nav.goRight(true);
        await tick();
        expect(f.shown).to.deep.equal(['wecker']);
        await f.nav.setTargetPageByName('///SystemOption');
        expect(f.shown).to.deep.equal(['wecker', '///SystemOption']);
        expect(f.internal).to.deep.equal({});
    });
});

describe('lib/configuration/admin - navigationTargetProblem', () => {
    const option = (): any => ({
        pages: [{ uniqueID: 'main' }, { uniqueID: 'wecker' }],
        navigation: [
            { name: 'main', page: 'main' },
            { name: 'wecker', page: 'wecker' },
            { name: 'heizung', page: 'heizung' },
        ],
    });

    it('a node with page is resolved', () => {
        expect(navigationTargetProblem(option(), 'wecker')).to.equal(undefined);
        expect(navigationTargetProblem(option(), undefined)).to.equal(undefined);
    });

    it('a node without page is unresolved', () => {
        expect(navigationTargetProblem(option(), 'heizung')).to.equal(
            'has no page (script page dropped or admin page missing)',
        );
    });

    it('a missing node is unresolved', () => {
        expect(navigationTargetProblem(option(), 'nope')).to.equal('not found');
    });

    it('system nodes and the screensaver are resolved', () => {
        expect(navigationTargetProblem(option(), '///service')).to.equal(undefined);
        expect(navigationTargetProblem(option(), navigationErrorPageName)).to.equal(undefined);
        expect(navigationTargetProblem(option(), '///screensaver')).to.equal(undefined);
    });
});
