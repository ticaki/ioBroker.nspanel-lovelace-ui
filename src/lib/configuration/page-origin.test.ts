import { expect } from 'chai';
import { systemPages } from '../templates/system-templates';
import type * as ShareConfig from '../types/adminShareConfig';
import type { PageBase } from '../types/pages';
import { AdminConfiguration } from './admin';
import { ensureMainPage } from './main-page';
import { PageOriginTracker } from './page-origin';
import { mainPageName } from '../const/default-pages';

const panelTopic = 'nspanel/test';

/**
 * Minimal adapter stub - AdminConfiguration only uses `log`, `library` and `config`.
 *
 * @param pageConfig Admin page entries the stub reports.
 * @param adminOverridesScriptPages Whether admin pages may replace script pages of the same name.
 * @returns An object usable as adapter for AdminConfiguration.
 */
function fakeAdapter(pageConfig: ShareConfig.PageConfig[], adminOverridesScriptPages = false): any {
    const noop = (): void => undefined;
    return {
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        library: {},
        config: { pageConfig, adminOverridesScriptPages },
    };
}

/**
 * A page as the configuration script delivers it.
 *
 * @param uniqueID Page id.
 * @param card Card type, defaults to a grid.
 * @returns The script page.
 */
function scriptPage(uniqueID: string, card = 'cardGrid'): PageBase {
    return {
        uniqueID,
        dpInit: '',
        alwaysOn: 'none',
        config: { card, data: {} },
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
function adminGridEntry(uniqueName: string, isMainPage = false): ShareConfig.MenuEntry {
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
 * Mirrors the phases of `Panel.preInit()` that the tracker is hooked into.
 *
 * @param scriptPages Pages coming from the configuration script.
 * @param pageConfig Admin page entries to merge.
 * @param adminOverridesScriptPages Whether admin pages may replace script pages of the same name.
 * @returns The tracker after all phases ran.
 */
async function runPhases(
    scriptPages: PageBase[],
    pageConfig: ShareConfig.PageConfig[],
    adminOverridesScriptPages = false,
): Promise<PageOriginTracker> {
    const option: any = {
        name: 'test',
        topic: panelTopic,
        pages: [scriptPage('screensaver', 'screensaver'), ...scriptPages],
        navigation: [],
    };
    const tracker = new PageOriginTracker();
    tracker.classify(option.pages, 'script');
    ensureMainPage(option, 'Testpanel');
    tracker.classify(option.pages, 'system');
    await new AdminConfiguration(fakeAdapter(pageConfig, adminOverridesScriptPages)).processentrys(option);
    tracker.classify(option.pages, 'admin');
    option.pages = option.pages.concat(systemPages);
    tracker.classify(option.pages, 'system');
    return tracker;
}

describe('lib/configuration - page origin', () => {
    it('keeps pages of the configuration script on script', async () => {
        const tracker = await runPhases([scriptPage('Wohnzimmer')], []);

        expect(tracker.get('Wohnzimmer')).to.equal('script');
        expect(tracker.get('screensaver')).to.equal('script');
    });

    it('reports the generated default start page as system', async () => {
        const tracker = await runPhases([], []);

        expect(tracker.get(mainPageName)).to.equal('system');
    });

    it('reports service pages as system', async () => {
        const tracker = await runPhases([], []);

        const servicePage = systemPages[0];
        expect(servicePage?.uniqueID, 'a service page exists').to.be.a('string');
        expect(tracker.get(servicePage.uniqueID)).to.equal('system');
    });

    it('reports pages of the admin configuration as admin', async () => {
        const tracker = await runPhases([], [adminGridEntry('Hauptseite1')]);

        expect(tracker.get('Hauptseite1')).to.equal('admin');
    });

    it('moves a script page taken over by the admin to admin', async () => {
        const tracker = await runPhases([scriptPage('Wohnzimmer')], [adminGridEntry('Wohnzimmer')], true);

        expect(tracker.get('Wohnzimmer')).to.equal('admin');
    });

    it('moves the start page to admin when an admin page replaces the generated one', async () => {
        const tracker = await runPhases([], [adminGridEntry('Hauptseite1', true)]);

        // The admin entry is published under the reserved id, so that id must not stay on system.
        expect(tracker.get(mainPageName)).to.equal('admin');
    });

    it('returns undefined for a page it never saw', () => {
        expect(new PageOriginTracker().get('nowhere')).to.equal(undefined);
    });
});
