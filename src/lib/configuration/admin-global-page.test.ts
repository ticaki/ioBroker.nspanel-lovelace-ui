/**
 * Tests of the rule in `AdminConfiguration.createPagesFromConfig`: an admin page assigned to the panel by its
 * topic replaces a page of the global script configuration of the same name (it keeps the position of the
 * navigation node, but only the links of the admin assignment count), while pages of the panel's own script keep
 * winning.
 */
import { expect } from 'chai';
import type { NavigationItemConfig } from '../classes/navigation';
import * as ShareConfig from '../types/adminShareConfig';
import type { PageBase } from '../types/pages';
import { AdminConfiguration } from './admin';

const panelTopic = 'nspanel/test';

type LogEntry = [level: string, text: string];

/**
 * Minimal adapter stub - AdminConfiguration only uses `log`, `library` and `config`.
 *
 * @param pageConfig Admin page entries the stub reports.
 * @param logs Receives info and warn output.
 * @returns An object usable as adapter for AdminConfiguration.
 */
function fakeAdapter(pageConfig: ShareConfig.PageConfig[], logs: LogEntry[]): any {
    const noop = (): void => undefined;
    return {
        log: {
            silly: noop,
            debug: noop,
            info: (t: string): number => logs.push(['info', t]),
            warn: (t: string): number => logs.push(['warn', t]),
            error: noop,
        },
        library: {},
        config: { pageConfig, adminOverridesScriptPages: false },
    };
}

/**
 * A page as the config manager delivers it.
 *
 * @param uniqueID Page id.
 * @returns The page.
 */
function scriptPage(uniqueID: string): PageBase {
    return {
        uniqueID,
        dpInit: '',
        alwaysOn: 'none',
        config: { card: 'cardGrid', data: { headline: { type: 'const', constVal: `script ${uniqueID}` } } },
        pageItems: [],
    } as unknown as PageBase;
}

/**
 * A cardGrid admin entry.
 *
 * @param uniqueName Name of the entry.
 * @param assignment Navigation assignment.
 * @returns The entry.
 */
function adminEntry(
    uniqueName: string,
    assignment: { topic: string; navigation?: ShareConfig.NavigationLinks }[],
): ShareConfig.MenuEntry {
    return {
        card: 'cardGrid',
        headline: `admin ${uniqueName}`,
        uniqueName,
        pageItems: [],
        navigationAssignment: assignment,
    };
}

/** the ring main → g1 → own of the script, g1 a page of the global script */
function ringNavigation(): NavigationItemConfig[] {
    return [
        { name: 'main', page: 'main', left: { single: '///service' }, right: { single: 'g1' } },
        { name: 'g1', page: 'g1', left: { single: 'main' }, right: { single: 'own' } },
        { name: 'own', page: 'own', left: { single: 'g1' }, right: { single: '///service' } },
    ];
}

/**
 * Runs the admin phase on a panel with the pages main, g1 and own.
 *
 * @param pageConfig Admin entries.
 * @param globalPageIds Pages of the global script.
 * @param navigation Navigation of the script, default the ring main → g1 → own.
 * @returns Pages, navigation and the log.
 */
async function runAdmin(
    pageConfig: ShareConfig.PageConfig[],
    globalPageIds: string[],
    navigation: NavigationItemConfig[] = ringNavigation(),
): Promise<{ pages: PageBase[]; navigation: NavigationItemConfig[]; logs: LogEntry[] }> {
    const logs: LogEntry[] = [];
    const option: any = {
        name: 'test',
        topic: panelTopic,
        pages: [scriptPage('main'), scriptPage('g1'), scriptPage('own')],
        navigation,
        globalPageIds,
    };
    await new AdminConfiguration(fakeAdapter(pageConfig, logs)).processentrys(option);
    return { pages: option.pages, navigation: option.navigation, logs };
}

/**
 * The headline of the page with the id.
 *
 * @param pages The pages.
 * @param id The id.
 */
function headline(pages: PageBase[], id: string): unknown {
    const matches = pages.filter(p => p.uniqueID === id);
    expect(matches, `exactly one page ${id}`).to.have.length(1);
    const data = matches[0].config?.data as { headline?: { constVal?: unknown } } | undefined;
    return data?.headline?.constVal;
}

describe('lib/configuration - admin page replaces a page of the global script', () => {
    it('replaces the global page when the admin entry is assigned to this panel, the node keeps its place', async () => {
        const result = await runAdmin(
            [adminEntry('g1', [{ topic: panelTopic, navigation: { prev: 'main', next: 'own' } }])],
            ['g1'],
        );
        expect(headline(result.pages, 'g1')).to.equal('admin g1');
        const names = result.navigation.filter(n => n).map(n => n!.name);
        expect(names).to.deep.equal(['main', 'g1', 'own']);
        const node = result.navigation.find(n => n && n.name === 'g1');
        expect(node?.left).to.deep.equal({ single: 'main', double: undefined });
        expect(node?.right).to.deep.equal({ single: 'own', double: undefined });
        expect(
            result.logs.some(
                l =>
                    l[0] === 'info' &&
                    l[1].includes(
                        "Page 'g1' of the global script configuration is replaced by the admin page assigned to this panel.",
                    ),
            ),
        ).to.equal(true);
    });

    it('inherits nothing from the replaced node - not the provisional home of an unlinked global sub page', async () => {
        // after the conversion the panel script no longer links g1: the config manager adds it as a global
        // sub page without links and gives it `home: main` provisionally
        const navigation: NavigationItemConfig[] = [
            { name: 'main', page: 'main', left: { single: '///service' }, right: { single: 'own' } },
            { name: 'own', page: 'own', left: { single: 'main' }, right: { single: '///service' } },
            { name: 'g1', page: 'g1', left: undefined, right: { double: 'main' } },
        ];
        const result = await runAdmin(
            [adminEntry('g1', [{ topic: panelTopic, navigation: { prev: 'own', next: '///unlock' } }])],
            ['g1'],
            navigation,
        );
        const node = (name: string): NavigationItemConfig | undefined =>
            result.navigation.find(n => n && n.name === name);
        expect(node('g1')?.left).to.deep.equal({ single: 'own', double: undefined });
        expect(node('g1')?.right).to.deep.equal({ single: '///service', double: undefined });
        expect(node('own')?.right?.single).to.equal('g1');
    });

    it('keeps the global page when the admin entry only covers all panels', async () => {
        const result = await runAdmin(
            [adminEntry('g1', [{ topic: ShareConfig.ALL_PANELS_SPECIAL_ID, navigation: {} }])],
            ['g1'],
        );
        expect(headline(result.pages, 'g1')).to.equal('script g1');
        expect(result.logs.some(l => l[0] === 'warn' && l[1].includes('Page with name g1 already exists'))).to.equal(
            true,
        );
    });

    it('keeps the global page when the panel is excluded from an all panels entry', async () => {
        const result = await runAdmin(
            [adminEntry('g1', [{ topic: ShareConfig.ALL_PANELS_SPECIAL_ID, navigation: {} }, { topic: panelTopic }])],
            ['g1'],
        );
        expect(headline(result.pages, 'g1')).to.equal('script g1');
    });

    it('keeps a page of the panel script, also when the admin entry is assigned to this panel', async () => {
        const result = await runAdmin([adminEntry('own', [{ topic: panelTopic, navigation: {} }])], ['g1']);
        expect(headline(result.pages, 'own')).to.equal('script own');
        expect(result.logs.some(l => l[0] === 'warn' && l[1].includes('Page with name own already exists'))).to.equal(
            true,
        );
    });
});
