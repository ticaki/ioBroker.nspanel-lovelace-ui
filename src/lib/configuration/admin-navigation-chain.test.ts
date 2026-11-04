import { expect } from 'chai';
import type { NavigationItemConfig, NavigationItemConfigNonNull } from '../classes/navigation';
import { mainPageName } from '../const/default-pages';
import { systemNavigation } from '../templates/system-templates';
import type * as ShareConfig from '../types/adminShareConfig';
import { ALL_PANELS_SPECIAL_ID } from '../types/adminShareConfig';
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
 * A cardGrid admin page with a freely given panel assignment.
 *
 * @param uniqueName Stored name of the entry.
 * @param isMainPage Whether it is flagged as start page.
 * @param navigationAssignment Panel assignments including their navigation.
 * @returns The admin page entry.
 */
function grid(
    uniqueName: string,
    isMainPage: boolean,
    navigationAssignment: ShareConfig.NavigationAssignmentList,
): ShareConfig.MenuEntry {
    return {
        card: 'cardGrid',
        headline: uniqueName,
        uniqueName,
        pageItems: [],
        isMainPage,
        navigationAssignment,
    };
}

/**
 * Mirrors the part of Panel.preInit() that builds pages and navigation.
 *
 * @param pageConfig Admin page entries to merge.
 * @returns The resulting navigation, system navigation appended.
 */
async function runPreInit(pageConfig: ShareConfig.PageConfig[]): Promise<NavigationItemConfig[]> {
    const option: any = { name: 'test', topic: panelTopic, pages: [screensaverPage()], navigation: [] };
    ensureMainPage(option, 'Testpanel');
    await new AdminConfiguration(fakeAdapter(pageConfig)).processentrys(option);
    option.navigation = option.navigation.concat(systemNavigation);
    return option.navigation;
}

/**
 * Looks up a navigation node by name.
 *
 * @param navigation The navigation nodes.
 * @param name Name of the node.
 * @returns The node.
 */
function node(navigation: NavigationItemConfig[], name: string): NavigationItemConfigNonNull {
    const found = navigation.find(n => n && n.name === name);
    expect(found, `navigation node '${name}'`).to.not.equal(undefined);
    return found!;
}

/**
 * Every single link between two admin pages must be mirrored: A.right = B implies B.left = A.
 * The service node is wired by Navigation.init() at runtime and is left out here.
 *
 * @param navigation The navigation nodes.
 * @returns Links whose back link is missing.
 */
function brokenRingLinks(navigation: NavigationItemConfig[]): string[] {
    const broken: string[] = [];
    for (const n of navigation) {
        const right = n?.right?.single;
        if (!n || !right || right.startsWith('///')) {
            continue;
        }
        const target = navigation.find(t => t && t.name === right);
        if (target && target.left?.single !== n.name) {
            broken.push(`${n.name} -> ${right} but ${right} <- ${String(target.left?.single)}`);
        }
    }
    return broken;
}

describe('lib/configuration - navigation of the start page', () => {
    const mainWithStoredLinks = (isMainPage: boolean): ShareConfig.PageConfig[] => [
        grid('chart', false, [{ topic: ALL_PANELS_SPECIAL_ID, navigation: { prev: 'main' } }]),
        grid('testAbfall', false, [{ topic: ALL_PANELS_SPECIAL_ID, navigation: { prev: 'main' } }]),
        grid('pietest', false, [{ topic: panelTopic, navigation: { prev: 'main' } }]),
        grid('pietest2', isMainPage, [{ topic: panelTopic, navigation: { next: 'pietest' } }]),
    ];

    it('ignores the stored links of the start page and chains the pages pointing at it', async () => {
        const navigation = await runPreInit(mainWithStoredLinks(true));

        // The pages with `prev: main` follow the start page in definition order.
        expect(node(navigation, mainPageName).right?.single).to.equal('chart');
        expect(node(navigation, 'chart').left?.single).to.equal(mainPageName);
        expect(node(navigation, 'chart').right?.single).to.equal('testAbfall');
        expect(node(navigation, 'testAbfall').right?.single).to.equal('pietest');
        expect(node(navigation, 'pietest').left?.single).to.equal('testAbfall');
        // The stored `next: pietest` of the start page did not short-circuit the ring.
        expect(brokenRingLinks(navigation)).to.deep.equal([]);
    });

    it('ignores a stored prev and parent of the start page as well', async () => {
        const navigation = await runPreInit([
            grid('other', false, [{ topic: panelTopic, navigation: { home: 'main' } }]),
            grid('start', true, [{ topic: panelTopic, navigation: { prev: 'other', parent: 'other' } }]),
        ]);

        const main = node(navigation, mainPageName);
        expect(main.left?.single).to.equal('///service');
        expect(main.left?.double).to.equal(undefined);
        expect(main.right?.double).to.equal(undefined);
    });

    it('applies the stored links again once the page is no start page', async () => {
        const navigation = await runPreInit(mainWithStoredLinks(false));

        expect(node(navigation, 'pietest2').right?.single).to.equal('pietest');
        expect(node(navigation, 'pietest').left?.single).to.equal('pietest2');
        expect(brokenRingLinks(navigation)).to.deep.equal([]);
    });

    it('treats a page named main without the start page flag as the start page', async () => {
        // Older configurations from before the flag: the page is published as the start node anyway.
        const navigation = await runPreInit([
            grid('main', false, [{ topic: panelTopic, navigation: { next: 'seite1' } }]),
            grid('seite1', false, [{ topic: panelTopic, navigation: {} }]),
        ]);

        expect(node(navigation, mainPageName).right?.single).to.equal('///service');
        expect(node(navigation, 'seite1').left?.single).to.equal(undefined);
    });
});

describe('lib/configuration - explicit next of a chain root', () => {
    it('starts the chain with the page the root names as next when it is part of the group', async () => {
        const navigation = await runPreInit([
            grid('x', false, [{ topic: panelTopic, navigation: { next: 'y' } }]),
            grid('a', false, [{ topic: panelTopic, navigation: { prev: 'x' } }]),
            grid('b', false, [{ topic: panelTopic, navigation: { prev: 'x' } }]),
            grid('y', false, [{ topic: panelTopic, navigation: { prev: 'x' } }]),
        ]);

        expect(node(navigation, 'x').right?.single).to.equal('y');
        expect(node(navigation, 'y').left?.single).to.equal('x');
        expect(node(navigation, 'y').right?.single).to.equal('a');
        expect(node(navigation, 'a').right?.single).to.equal('b');
        expect(brokenRingLinks(navigation)).to.deep.equal([]);
    });

    it('keeps the explicit next of the root when it is not part of the group', async () => {
        const navigation = await runPreInit([
            grid('x', false, [{ topic: panelTopic, navigation: { next: 'y' } }]),
            grid('a', false, [{ topic: panelTopic, navigation: { prev: 'x' } }]),
            grid('b', false, [{ topic: panelTopic, navigation: { prev: 'x' } }]),
            grid('y', false, [{ topic: panelTopic, navigation: {} }]),
        ]);

        expect(node(navigation, 'x').right?.single).to.equal('y');
        expect(node(navigation, 'y').left?.single).to.equal('x');
        // The group still hangs behind x by its left links, its end stays open.
        expect(node(navigation, 'a').left?.single).to.equal('x');
        expect(node(navigation, 'a').right?.single).to.equal('b');
        expect(node(navigation, 'b').right?.single).to.equal(undefined);
    });
});
