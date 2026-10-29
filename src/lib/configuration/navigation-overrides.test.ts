import { expect } from 'chai';
import type { NavigationItemConfig } from '../classes/navigation';
import type { NavigationOverride, PageConfigEntry } from '../types/adminShareConfig';
import {
    adminReplacedPageIds,
    applyNavigationOverrides,
    isOverrideStale,
    linksOfNavigationItem,
    mergeNavigationOverride,
    navigationItemWithLinks,
    navigationLinksDiffer,
    recordGeneratedPage,
    scriptLinksByPage,
} from './navigation-overrides';

const panelTopic = 'nspanel/panel1';
const otherTopic = 'nspanel/panel2';

/**
 * A navigation item of a script page.
 *
 * @param name Page and node name.
 * @param left Left button.
 * @param left.single prev
 * @param left.double parent
 * @param right Right button.
 * @param right.single next
 * @param right.double home
 * @returns The item.
 */
function item(
    name: string,
    left?: { single?: string; double?: string },
    right?: { single?: string; double?: string },
): NavigationItemConfig {
    return { name, page: name, left, right };
}

/**
 * An override for a page of the test panel.
 *
 * @param page Page the override is for.
 * @param navigation Links the override sets.
 * @param scriptLinks Snapshot of the script links.
 * @param topic Panel topic, defaults to the test panel.
 * @returns The override.
 */
function override(
    page: string,
    navigation: NavigationOverride['navigation'],
    scriptLinks: NavigationOverride['scriptLinks'],
    topic = panelTopic,
): NavigationOverride {
    return { panelTopic: topic, page, navigation, scriptLinks };
}

describe('lib/configuration/navigation-overrides - linksOfNavigationItem / navigationItemWithLinks', () => {
    it('maps left/right to prev/parent/next/home and leaves empty links out', () => {
        expect(
            linksOfNavigationItem(item('a', { single: 'p', double: 'par' }, { single: 'n', double: 'h' })),
        ).to.deep.equal({ prev: 'p', next: 'n', home: 'h', parent: 'par' });
        expect(linksOfNavigationItem(item('a', { single: '' }, { double: 'h' }))).to.deep.equal({ home: 'h' });
        expect(linksOfNavigationItem(item('a'))).to.deep.equal({});
        expect(linksOfNavigationItem(null)).to.deep.equal({});
    });

    it('replaces left/right completely and keeps the other fields', () => {
        const source: NavigationItemConfig = {
            name: 'a',
            page: 'a',
            left: { single: 'p' },
            right: { double: 'h' },
            optional: 'notifications',
        };
        const result = navigationItemWithLinks(source, { next: 'n', parent: 'par' });
        expect(result).to.deep.equal({
            name: 'a',
            page: 'a',
            optional: 'notifications',
            left: { double: 'par' },
            right: { single: 'n' },
        });
        // the source is untouched
        expect(source).to.deep.equal({
            name: 'a',
            page: 'a',
            left: { single: 'p' },
            right: { double: 'h' },
            optional: 'notifications',
        });
    });

    it('drops empty values and self references', () => {
        const result = navigationItemWithLinks(item('a', { single: 'p' }), { prev: '', next: 'a', home: 'main' });
        expect(result).to.deep.equal({ name: 'a', page: 'a', right: { double: 'main' } });
        expect(navigationItemWithLinks(item('a'), {})).to.deep.equal({ name: 'a', page: 'a' });
        expect(navigationItemWithLinks(null, { next: 'b' })).to.equal(null);
    });

    it('scriptLinksByPage collects every page and skips null entries', () => {
        const navigation: NavigationItemConfig[] = [
            item('a', undefined, { single: 'b' }),
            null,
            item('b', { single: 'a' }),
        ];
        expect(scriptLinksByPage(navigation)).to.deep.equal({ a: { next: 'b' }, b: { prev: 'a' } });
    });
});

describe('lib/configuration/navigation-overrides - isOverrideStale / mergeNavigationOverride', () => {
    it('treats an empty string and a missing link as the same', () => {
        expect(navigationLinksDiffer({ next: '' }, {})).to.equal(false);
        expect(navigationLinksDiffer({ next: 'b' }, { next: 'b', home: '' })).to.equal(false);
        expect(navigationLinksDiffer({ next: 'b' }, { next: 'c' })).to.equal(true);
    });

    it('is stale when the script links differ from the snapshot', () => {
        const o = override('a', { next: 'x' }, { next: 'b', home: 'main' });
        expect(isOverrideStale(o, { next: 'b', home: 'main' })).to.equal(false);
        expect(isOverrideStale(o, { next: 'c', home: 'main' })).to.equal(true);
        expect(isOverrideStale(o, { next: 'b' })).to.equal(true);
    });

    it('merges: user changes win, everything else follows the script', () => {
        // user changed next (b -> x) and removed home; script changed home and added parent
        const o = override('a', { next: 'x', prev: 'p' }, { next: 'b', prev: 'p', home: 'main' });
        expect(mergeNavigationOverride(o, { next: 'c', prev: 'p2', home: 'h2', parent: 'par' })).to.deep.equal({
            next: 'x',
            prev: 'p2',
            parent: 'par',
        });
    });

    it('merge: a link the user removed stays removed even when the script changed it', () => {
        const o = override('a', { prev: 'p' }, { prev: 'p', next: 'b' });
        expect(mergeNavigationOverride(o, { prev: 'p', next: 'c' })).to.deep.equal({ prev: 'p' });
    });

    it('merge of an override without user changes equals the current script', () => {
        const o = override('a', { next: 'b' }, { next: 'b' });
        expect(mergeNavigationOverride(o, { prev: 'z' })).to.deep.equal({ prev: 'z' });
    });
});

describe('lib/configuration/navigation-overrides - applyNavigationOverrides', () => {
    const navigation = (): NavigationItemConfig[] => [
        item('main', undefined, { single: 'a' }),
        item('a', { single: 'main' }, { single: 'b' }),
        item('b', { double: 'a' }),
        item('media-x', { double: 'a' }),
        null,
    ];

    it('applies an override of the panel and reports its state', () => {
        const input = navigation();
        const snapshot = JSON.stringify(input);
        const result = applyNavigationOverrides(
            input,
            [override('a', { prev: 'main', next: 'b', home: 'main', parent: 'b' }, { prev: 'main', next: 'b' })],
            panelTopic,
            [],
        );
        expect(result.navigation[1]).to.deep.equal({
            name: 'a',
            page: 'a',
            left: { single: 'main', double: 'b' },
            right: { single: 'b', double: 'main' },
        });
        expect(result.navigation[4]).to.equal(null);
        expect(result.skipped).to.deep.equal([]);
        expect([...result.states.entries()]).to.deep.equal([
            [
                'a',
                {
                    navigation: { prev: 'main', next: 'b', home: 'main', parent: 'b' },
                    scriptLinks: { prev: 'main', next: 'b' },
                    stale: false,
                },
            ],
        ]);
        // input untouched, output is a new array with new items
        expect(JSON.stringify(input)).to.equal(snapshot);
        expect(result.navigation).to.not.equal(input);
        expect(result.navigation[0]).to.not.equal(input[0]);
    });

    it('ignores overrides of other panels', () => {
        const result = applyNavigationOverrides(
            navigation(),
            [override('a', { next: 'main' }, { next: 'b' }, otherTopic)],
            panelTopic,
            [],
        );
        expect(result.navigation).to.deep.equal(navigation());
        expect(result.states.size).to.equal(0);
        expect(result.skipped).to.deep.equal([]);
    });

    it('skips generated and missing pages', () => {
        const result = applyNavigationOverrides(
            navigation(),
            [override('media-x', { home: 'main' }, { parent: 'a' }), override('gone', { home: 'main' }, {})],
            panelTopic,
            ['media-x'],
        );
        expect(result.navigation).to.deep.equal(navigation());
        expect(result.skipped).to.deep.equal([
            { page: 'media-x', reason: 'generated' },
            { page: 'gone', reason: 'missing' },
        ]);
        expect(result.states.size).to.equal(0);
    });

    it('applies a stale override nonetheless and flags it', () => {
        const result = applyNavigationOverrides(
            navigation(),
            [override('a', { next: 'main' }, { prev: 'main', next: 'c' })],
            panelTopic,
            [],
        );
        expect(result.navigation[1]).to.deep.equal({ name: 'a', page: 'a', right: { single: 'main' } });
        expect(result.states.get('a')).to.deep.equal({
            navigation: { next: 'main' },
            scriptLinks: { prev: 'main', next: 'c' },
            stale: true,
        });
    });

    it('gives a page left without any link the default home', () => {
        const result = applyNavigationOverrides(navigation(), [override('b', {}, { parent: 'a' })], panelTopic, []);
        expect(result.navigation[2]).to.deep.equal({ name: 'b', page: 'b', right: { double: 'main' } });
    });

    it('drops a link of the override that points at the page itself', () => {
        const result = applyNavigationOverrides(
            navigation(),
            [override('b', { next: 'b', home: 'main' }, { parent: 'a' })],
            panelTopic,
            [],
        );
        expect(result.navigation[2]).to.deep.equal({ name: 'b', page: 'b', right: { double: 'main' } });
    });
});

describe('lib/configuration/navigation-overrides - replaced and unsupported pages', () => {
    /**
     * A cardGrid admin entry.
     *
     * @param uniqueName Name of the entry.
     * @param navigationAssignment Assignment rows.
     * @param isMainPage Start page flag.
     * @returns The entry.
     */
    function gridEntry(
        uniqueName: string,
        navigationAssignment: { topic: string; navigation?: Record<string, string> }[],
        isMainPage = false,
    ): PageConfigEntry {
        return { card: 'cardGrid', headline: uniqueName, uniqueName, pageItems: [], navigationAssignment, isMainPage };
    }

    it('adminReplacedPageIds mirrors the replacement rule of admin.ts', () => {
        const pageConfig: PageConfigEntry[] = [
            gridEntry('a', [{ topic: panelTopic, navigation: {} }]),
            gridEntry('b', [{ topic: '///ALL_PANELS_SPECIAL', navigation: {} }]),
            gridEntry('c', [{ topic: otherTopic, navigation: {} }]),
            gridEntry('d', [{ topic: '///ALL_PANELS_SPECIAL', navigation: {} }, { topic: panelTopic }]),
            gridEntry('start', [{ topic: panelTopic, navigation: {} }], true),
        ];
        // without the option only the start page is replaced
        expect(adminReplacedPageIds(pageConfig, panelTopic, false)).to.deep.equal(['main']);
        // with it every entry assigned to the panel - not c (other panel), not d (excluded)
        expect(adminReplacedPageIds(pageConfig, panelTopic, true)).to.deep.equal(['a', 'b', 'main']);
    });

    it('skips an override for a page the admin replaces', () => {
        const navigation: NavigationItemConfig[] = [
            item('main', undefined, { single: 'a' }),
            item('a', { single: 'main' }),
        ];
        const result = applyNavigationOverrides(
            navigation,
            [override('a', { home: 'main' }, { prev: 'main' })],
            panelTopic,
            [],
            ['a'],
        );
        expect(result.navigation).to.deep.equal(navigation);
        expect(result.skipped).to.deep.equal([{ page: 'a', reason: 'replaced' }]);
    });

    it('skips an item whose node name differs from its page and leaves it out of the script links', () => {
        const navigation: NavigationItemConfig[] = [
            { name: 'node-a', page: 'a', right: { single: 'b' } },
            item('b', { single: 'node-a' }),
        ];
        expect(scriptLinksByPage(navigation)).to.deep.equal({ b: { prev: 'node-a' } });
        const result = applyNavigationOverrides(navigation, [override('a', { home: 'main' }, {})], panelTopic, []);
        expect(result.navigation).to.deep.equal(navigation);
        expect(result.skipped).to.deep.equal([{ page: 'a', reason: 'unsupported' }]);
    });

    it('gives the start page no default home when an override leaves it without links', () => {
        const navigation: NavigationItemConfig[] = [
            item('main', undefined, { single: 'a' }),
            item('a', { single: 'main' }),
        ];
        const result = applyNavigationOverrides(navigation, [override('main', {}, { next: 'a' })], panelTopic, []);
        expect(result.navigation[0]).to.deep.equal({ name: 'main', page: 'main' });
    });
});

describe('lib/configuration/navigation-overrides - recordGeneratedPage', () => {
    it('creates the list on first use and records a page once', () => {
        const target: { generatedPageIds?: string[] } = {};
        recordGeneratedPage(target, 'media-x');
        recordGeneratedPage(target, 'media-x');
        recordGeneratedPage(target, 'media-y');
        recordGeneratedPage(target, '');
        expect(target.generatedPageIds).to.deep.equal(['media-x', 'media-y']);
    });
});
