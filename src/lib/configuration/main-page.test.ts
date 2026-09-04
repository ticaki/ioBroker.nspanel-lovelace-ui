import { expect } from 'chai';
import type { NavigationItemConfig } from '../classes/navigation';
import { mainPageName } from '../const/default-pages';
import type { PageBase } from '../types/pages';
import { ensureMainPage } from './main-page';

function page(uniqueID: string): PageBase {
    return {
        uniqueID,
        dpInit: '',
        alwaysOn: 'none',
        config: { card: 'cardGrid', data: { headline: { type: 'const', constVal: uniqueID } } },
        pageItems: [],
    };
}

/**
 * Navigation ring as the config manager builds it: first node and last node anchor the service.
 *
 * @param names Node names in ring order.
 * @returns The navigation ring.
 */
function ring(...names: string[]): NavigationItemConfig[] {
    return names.map((name, index) => ({
        name,
        page: name,
        left: { single: index === 0 ? '///service' : names[index - 1] },
        right: { single: index === names.length - 1 ? '///service' : names[index + 1] },
    }));
}

describe('lib/configuration/main-page', () => {
    describe('ensureMainPage', () => {
        it('leaves a configuration that already has a main page untouched', () => {
            const option = { pages: [page(mainPageName), page('kitchen')], navigation: ring(mainPageName, 'kitchen') };
            const before = JSON.stringify(option);

            const result = ensureMainPage(option, 'Panel');

            expect(result).to.deep.equal({ pageAdded: false, navigationAdded: false });
            expect(JSON.stringify(option)).to.equal(before);
        });

        it('adds page and navigation node when nothing provides a main page', () => {
            const option = { pages: [page('kitchen')], navigation: ring('kitchen') };

            const result = ensureMainPage(option, 'Wohnzimmer');

            expect(result).to.deep.equal({ pageAdded: true, navigationAdded: true });
            expect(option.pages.map(a => a.uniqueID)).to.deep.equal(['kitchen', mainPageName]);
            expect(option.navigation.map(a => a?.name)).to.deep.equal([mainPageName, 'kitchen']);
        });

        it('uses the given headline for the generated page', () => {
            const option: { pages: PageBase[]; navigation: NavigationItemConfig[] } = { pages: [], navigation: [] };

            ensureMainPage(option, 'Wohnzimmer');

            const created = option.pages[0];
            expect(created.uniqueID).to.equal(mainPageName);
            expect(created.config).to.have.nested.property('data.headline.constVal', 'Wohnzimmer');
        });

        it('takes over the service anchor of the previous first node', () => {
            const option = { pages: [page('kitchen'), page('bath')], navigation: ring('kitchen', 'bath') };

            ensureMainPage(option, 'Panel');

            expect(option.navigation[0]).to.deep.include({ name: mainPageName });
            expect(option.navigation[0]?.left).to.deep.equal({ single: '///service' });
            expect(option.navigation[0]?.right).to.deep.equal({ single: 'kitchen' });
            // The former first node now points back to the new start page instead of the service.
            expect(option.navigation[1]?.left).to.deep.equal({ single: mainPageName });
            // The ring end keeps its service anchor.
            expect(option.navigation[2]?.right).to.deep.equal({ single: '///service' });
        });

        it('anchors both sides to the service node when it is the only page', () => {
            const option: { pages: PageBase[]; navigation: NavigationItemConfig[] } = { pages: [], navigation: [] };

            ensureMainPage(option, 'Panel');

            expect(option.navigation[0]?.left).to.deep.equal({ single: '///service' });
            expect(option.navigation[0]?.right).to.deep.equal({ single: '///service' });
        });

        it('does not overwrite an explicit left link of the previous first node', () => {
            const option = {
                pages: [page('kitchen')],
                navigation: [{ name: 'kitchen', page: 'kitchen', left: { single: 'bath' } }] as NavigationItemConfig[],
            };

            ensureMainPage(option, 'Panel');

            // No node offered a service entry, so the new start page provides one.
            expect(option.navigation[0]?.left).to.deep.equal({ single: '///service' });
            expect(option.navigation[0]?.right).to.deep.equal({ single: 'kitchen' });
            expect(option.navigation[1]?.left).to.deep.equal({ single: 'bath' });
        });

        it('does not add a second service entry when another node already has one', () => {
            const option = {
                pages: [page('kitchen'), page('bath')],
                navigation: [
                    { name: 'kitchen', page: 'kitchen', left: { single: 'bath' } },
                    { name: 'bath', page: 'bath', left: { single: '///service' } },
                ] as NavigationItemConfig[],
            };

            ensureMainPage(option, 'Panel');

            expect(option.navigation[0]?.left).to.equal(undefined);
            expect(option.navigation[0]?.right).to.deep.equal({ single: 'kitchen' });
        });

        it('adds only the missing half when a navigation node exists without a page', () => {
            const option = { pages: [page('kitchen')], navigation: ring(mainPageName, 'kitchen') };

            const result = ensureMainPage(option, 'Panel');

            expect(result).to.deep.equal({ pageAdded: true, navigationAdded: false });
            expect(option.navigation.map(a => a?.name)).to.deep.equal([mainPageName, 'kitchen']);
        });

        it('replaces a start page that has no navigation node - it belongs to another panel', () => {
            // ConfigManager.getConfig() merges the pages of all panels into every panel, so a page
            // named like the start page can be present without this panel owning it.
            const option = { pages: [page(mainPageName), page('kitchen')], navigation: ring('kitchen') };

            const result = ensureMainPage(option, 'Panel');

            expect(result).to.deep.equal({ pageAdded: true, navigationAdded: true });
            expect(option.pages.filter(a => a.uniqueID === mainPageName).length, 'no duplicate').to.equal(1);
            expect(option.pages.map(a => a.uniqueID)).to.deep.equal(['kitchen', mainPageName]);
            expect(option.navigation.map(a => a?.name)).to.deep.equal([mainPageName, 'kitchen']);
        });
    });
});
