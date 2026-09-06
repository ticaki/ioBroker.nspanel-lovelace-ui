import { expect } from 'chai';
import type { NavigationItemConfig } from '../classes/navigation';
import { mainPageName } from '../const/default-pages';
import { systemNavigation } from '../templates/system-templates';
import type * as ShareConfig from '../types/adminShareConfig';
import type { PageBase } from '../types/pages';
import { AdminConfiguration } from './admin';
import { ensureMainPage } from './main-page';

const panelTopic = 'nspanel/test';

/**
 * Minimal adapter stub - AdminConfiguration only uses `log`, `library` and `config`.
 *
 * @param pageConfig Admin page entries the stub reports.
 * @returns An object usable as adapter for AdminConfiguration.
 */
function fakeAdapter(pageConfig: ShareConfig.PageConfig[]): any {
    const noop = (): void => undefined;
    return {
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        library: {},
        config: { pageConfig, adminOverridesScriptPages: false },
    };
}

/** A screensaver page - the only page a script without any `pages` entry delivers. */
function screensaverPage(): PageBase {
    return {
        uniqueID: 'screensaver',
        dpInit: '',
        alwaysOn: 'none',
        config: { card: 'screensaver', data: {} },
        pageItems: [],
    } as unknown as PageBase;
}

/**
 * A cardGrid admin page assigned to the test panel.
 *
 * @param uniqueName Stored name of the entry.
 * @param isMainPage Whether it is flagged as start page.
 * @returns The admin page entry.
 */
function adminGridEntry(uniqueName: string, isMainPage: boolean): ShareConfig.MenuEntry {
    return {
        card: 'cardGrid',
        headline: uniqueName,
        uniqueName,
        pageItems: [],
        isMainPage,
        navigationAssignment: [{ topic: panelTopic, navigation: {} }],
    };
}

/**
 * Mirrors the part of Panel.preInit() that builds pages and navigation.
 *
 * @param pageConfig Admin page entries to merge.
 * @returns The resulting pages and navigation, system navigation appended.
 */
async function runPreInit(
    pageConfig: ShareConfig.PageConfig[],
): Promise<{ pages: PageBase[]; navigation: NavigationItemConfig[] }> {
    const option: any = { name: 'test', topic: panelTopic, pages: [screensaverPage()], navigation: [] };
    ensureMainPage(option, 'Testpanel');
    await new AdminConfiguration(fakeAdapter(pageConfig)).processentrys(option);
    // Pages without a navigation entry are dropped, screensaver excepted.
    option.pages = option.pages.filter(
        (b: PageBase) =>
            String(b.config?.card).startsWith('screensaver') ||
            option.navigation.find((c: NavigationItemConfig) => c && c.name === b.uniqueID),
    );
    option.navigation = option.navigation.concat(systemNavigation);
    return option;
}

describe('lib/configuration - script without any page', () => {
    it('produces a usable start page when only the screensaver comes from the script', async () => {
        const result = await runPreInit([]);

        const main = result.pages.find(p => p.uniqueID === mainPageName);
        expect(main, 'default start page').to.not.equal(undefined);
        expect(result.navigation[0]?.name).to.equal(mainPageName);
    });

    it('lets an admin page flagged as start page replace the generated one', async () => {
        const result = await runPreInit([adminGridEntry('Hauptseite1', true)]);

        const mainPages = result.pages.filter(p => p.uniqueID === mainPageName);
        expect(mainPages.length, 'exactly one start page').to.equal(1);
        // The admin page won: it carries the headline of the admin entry.
        expect(mainPages[0].config).to.have.nested.property('data.headline.constVal', 'Hauptseite1');
        // The stored name is not published - only the reserved id is.
        expect(result.pages.some(p => p.uniqueID === 'Hauptseite1')).to.equal(false);

        const mainNodes = result.navigation.filter(n => n && n.name === mainPageName);
        expect(mainNodes.length, 'exactly one start node').to.equal(1);
    });

    it('keeps the service pages reachable in both directions', async () => {
        const result = await runPreInit([adminGridEntry('Hauptseite1', true)]);

        // Navigation.init() wires the '///service' node to the nodes pointing at it.
        const serviceRight = result.navigation.find(n => n && n.left?.single === '///service')?.name;
        const serviceLeft = result.navigation.find(n => n && n.right?.single === '///service')?.name;
        expect(serviceRight, 'node leading left into the service area').to.equal(mainPageName);
        expect(serviceLeft, 'node leading right into the service area').to.equal(mainPageName);
    });

    it('resolves every hard coded link of the system navigation', async () => {
        const result = await runPreInit([adminGridEntry('Hauptseite1', true)]);
        const names = new Set(result.navigation.filter(n => n).map(n => n!.name));

        const dangling: string[] = [];
        for (const node of result.navigation) {
            if (!node) {
                continue;
            }
            for (const side of ['left', 'right'] as const) {
                for (const kind of ['single', 'double'] as const) {
                    const target = node[side]?.[kind];
                    if (target && !names.has(target)) {
                        dangling.push(`${node.name}.${side}.${kind} -> ${target}`);
                    }
                }
            }
        }
        expect(dangling, 'dangling navigation links').to.deep.equal([]);
    });

    it('translates links that still use the stored name of the start page', async () => {
        const other: ShareConfig.MenuEntry = {
            card: 'cardGrid',
            headline: 'Zweite',
            uniqueName: 'Zweite',
            pageItems: [],
            navigationAssignment: [{ topic: panelTopic, navigation: { home: 'Hauptseite1' } }],
        };
        const result = await runPreInit([adminGridEntry('Hauptseite1', true), other]);

        const node = result.navigation.find(n => n && n.name === 'Zweite');
        expect(node?.right?.double).to.equal(mainPageName);
    });
});

describe('lib/configuration - pages merged from another panel', () => {
    /** A page named like the start page, merged in from another panel by ConfigManager.getConfig(). */
    function foreignMainPage(): PageBase {
        return {
            uniqueID: mainPageName,
            dpInit: '',
            alwaysOn: 'none',
            config: { card: 'cardGrid', data: { headline: { type: 'const', constVal: 'Fremdes Panel' } } },
            pageItems: [],
        } as unknown as PageBase;
    }

    it('does not adopt the start page of another panel', async () => {
        const option: any = {
            name: 'test',
            topic: panelTopic,
            pages: [screensaverPage(), foreignMainPage()],
            navigation: [],
        };
        ensureMainPage(option, 'Testpanel');

        const mainPages = option.pages.filter((p: PageBase) => p.uniqueID === mainPageName);
        expect(mainPages.length, 'exactly one start page').to.equal(1);
        expect(mainPages[0].config).to.not.have.nested.property('data.headline.constVal', 'Fremdes Panel');
        expect(mainPages[0].config).to.have.nested.property('data.headline.constVal', 'Testpanel');
    });
});
