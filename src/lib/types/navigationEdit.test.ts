import { expect } from 'chai';
import { ALL_PANELS_SPECIAL_ID, type MenuEntry, type NavigationMap, type PageConfigEntry } from './adminShareConfig';
import {
    applyNavigationOverlay,
    assignmentSourceOf,
    effectiveNavigation,
    isNavigationApplied,
    isNavigationLinkKind,
    setNavigationLink,
} from './navigationEdit';

const panelTopic = 'nspanel/panel1';
const otherTopic = 'nspanel/panel2';

/**
 * A cardGrid admin page with the given assignment rows.
 *
 * @param uniqueName Stored name of the entry.
 * @param navigationAssignment Assignment rows of the entry.
 * @param isMainPage Whether the entry is flagged as start page.
 * @returns The admin page entry.
 */
function gridEntry(
    uniqueName: string,
    navigationAssignment: MenuEntry['navigationAssignment'],
    isMainPage = false,
): MenuEntry {
    return { card: 'cardGrid', headline: uniqueName, uniqueName, pageItems: [], navigationAssignment, isMainPage };
}

/**
 * The assignment rows of an entry of the page configuration.
 *
 * @param entries Page configuration.
 * @param uniqueName Name of the entry.
 * @returns Its assignment rows.
 */
function rowsOf(entries: PageConfigEntry[], uniqueName: string): MenuEntry['navigationAssignment'] {
    return entries.find(e => e.uniqueName === uniqueName)?.navigationAssignment;
}

describe('lib/types/navigationEdit - assignmentSourceOf / effectiveNavigation', () => {
    it('prefers the panel row over the all-panels row', () => {
        const entry = gridEntry('a', [
            { topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'main' } },
            { topic: panelTopic, navigation: { next: 'b' } },
        ]);
        expect(assignmentSourceOf(entry, panelTopic)).to.equal('panel');
        expect(effectiveNavigation(entry, panelTopic)).to.deep.equal({ next: 'b' });
    });

    it('falls back to the all-panels row', () => {
        const entry = gridEntry('a', [{ topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'main' } }]);
        expect(assignmentSourceOf(entry, panelTopic)).to.equal('all');
        expect(effectiveNavigation(entry, panelTopic)).to.deep.equal({ home: 'main' });
    });

    it('reads a panel row without navigation as exclusion when an all-panels row exists', () => {
        const entry = gridEntry('a', [
            { topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'main' } },
            { topic: panelTopic },
        ]);
        expect(assignmentSourceOf(entry, panelTopic)).to.equal('excluded');
        expect(effectiveNavigation(entry, panelTopic)).to.equal(undefined);
    });

    it('reads a panel row without navigation as assigned without links when there is no all-panels row', () => {
        const entry = gridEntry('a', [{ topic: panelTopic }]);
        expect(assignmentSourceOf(entry, panelTopic)).to.equal('panel');
        expect(effectiveNavigation(entry, panelTopic)).to.deep.equal({});
    });

    it('reports a page that is not assigned to the panel', () => {
        const entry = gridEntry('a', [{ topic: otherTopic, navigation: { next: 'b' } }]);
        expect(assignmentSourceOf(entry, panelTopic)).to.equal('none');
        expect(effectiveNavigation(entry, panelTopic)).to.equal(undefined);
        expect(assignmentSourceOf(gridEntry('b', undefined), panelTopic)).to.equal('none');
    });

    it('returns a copy of the links', () => {
        const entry = gridEntry('a', [{ topic: panelTopic, navigation: { next: 'b' } }]);
        const links = effectiveNavigation(entry, panelTopic);
        expect(links).to.not.equal(entry.navigationAssignment?.[0].navigation);
    });

    it('takes the first of several all-panels rows and skips empty elements', () => {
        const rows = [
            null,
            { topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'main' } },
            { topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'other' } },
        ] as unknown as MenuEntry['navigationAssignment'];
        const entry = gridEntry('a', rows);
        expect(assignmentSourceOf(entry, panelTopic)).to.equal('all');
        expect(effectiveNavigation(entry, panelTopic)).to.deep.equal({ home: 'main' });
    });

    it('knows the four link kinds', () => {
        expect(isNavigationLinkKind('prev')).to.equal(true);
        expect(isNavigationLinkKind('parent')).to.equal(true);
        expect(isNavigationLinkKind('target')).to.equal(false);
        expect(isNavigationLinkKind(undefined)).to.equal(false);
    });
});

describe('lib/types/navigationEdit - setNavigationLink', () => {
    it('writes into the panel row and leaves the input untouched', () => {
        const entries: PageConfigEntry[] = [gridEntry('a', [{ topic: panelTopic, navigation: { home: 'main' } }])];
        const before = JSON.stringify(entries);
        const updated = setNavigationLink(entries, 'a', panelTopic, 'next', 'b', 'panel');

        expect(updated).to.not.equal(entries);
        expect(JSON.stringify(entries)).to.equal(before);
        expect(rowsOf(updated, 'a')).to.deep.equal([{ topic: panelTopic, navigation: { home: 'main', next: 'b' } }]);
    });

    it('creates the panel row with a copy of the all-panels links', () => {
        const entries: PageConfigEntry[] = [
            gridEntry('a', [{ topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'main', parent: 'p' } }]),
        ];
        const updated = setNavigationLink(entries, 'a', panelTopic, 'next', 'b', 'panel');

        expect(rowsOf(updated, 'a')).to.deep.equal([
            { topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'main', parent: 'p' } },
            { topic: panelTopic, navigation: { home: 'main', parent: 'p', next: 'b' } },
        ]);
        expect(assignmentSourceOf(updated[0], panelTopic)).to.equal('panel');
        // the other panels still read the all-panels row
        expect(effectiveNavigation(updated[0], otherTopic)).to.deep.equal({ home: 'main', parent: 'p' });
    });

    it('writes into the all-panels row and creates it when missing', () => {
        const entries: PageConfigEntry[] = [
            gridEntry('a', [{ topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'main' } }]),
            gridEntry('b', [{ topic: panelTopic, navigation: {} }]),
        ];
        const updated = setNavigationLink(entries, 'a', panelTopic, 'parent', 'b', 'all');
        expect(rowsOf(updated, 'a')).to.deep.equal([
            { topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'main', parent: 'b' } },
        ]);
        // entry b is the same object as before - only the changed entry is replaced
        expect(updated[1]).to.equal(entries[1]);

        const created = setNavigationLink(entries, 'b', panelTopic, 'next', 'a', 'all');
        expect(rowsOf(created, 'b')).to.deep.equal([
            { topic: panelTopic, navigation: {} },
            { topic: ALL_PANELS_SPECIAL_ID, navigation: { next: 'a' } },
        ]);
    });

    it('removes a link but keeps the empty navigation object', () => {
        const entries: PageConfigEntry[] = [
            gridEntry('a', [
                { topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'main' } },
                { topic: panelTopic, navigation: { home: 'main' } },
            ]),
        ];
        const updated = setNavigationLink(entries, 'a', panelTopic, 'home', undefined, 'panel');
        expect(rowsOf(updated, 'a')).to.deep.equal([
            { topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'main' } },
            { topic: panelTopic, navigation: {} },
        ]);
        // an empty object is still an assignment, not an exclusion
        expect(assignmentSourceOf(updated[0], panelTopic)).to.equal('panel');
    });

    it('ignores self references and unknown pages', () => {
        const entries: PageConfigEntry[] = [
            gridEntry('a', [{ topic: panelTopic, navigation: {} }]),
            gridEntry('start', [{ topic: panelTopic, navigation: {} }], true),
        ];
        expect(setNavigationLink(entries, 'a', panelTopic, 'home', 'a', 'panel')).to.equal(entries);
        expect(setNavigationLink(entries, 'start', panelTopic, 'parent', 'main', 'panel')).to.equal(entries);
        expect(setNavigationLink(entries, 'start', panelTopic, 'parent', 'start', 'panel')).to.equal(entries);
        expect(setNavigationLink(entries, 'missing', panelTopic, 'next', 'a', 'panel')).to.equal(entries);
        // 'main' is a valid target for a page that is not the start page
        const updated = setNavigationLink(entries, 'a', panelTopic, 'home', 'main', 'panel');
        expect(rowsOf(updated, 'a')).to.deep.equal([{ topic: panelTopic, navigation: { home: 'main' } }]);
    });

    it('creates the panel row on an entry without any assignment', () => {
        const entries: PageConfigEntry[] = [gridEntry('a', undefined)];
        const updated = setNavigationLink(entries, 'a', panelTopic, 'next', 'b', 'panel');
        expect(rowsOf(updated, 'a')).to.deep.equal([{ topic: panelTopic, navigation: { next: 'b' } }]);
        expect(entries[0].navigationAssignment).to.equal(undefined);
    });

    it('writes into the first of several all-panels rows and keeps empty elements', () => {
        const rows = [
            null,
            { topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'main' } },
            { topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'other' } },
        ] as unknown as MenuEntry['navigationAssignment'];
        const entries: PageConfigEntry[] = [gridEntry('a', rows)];
        const updated = setNavigationLink(entries, 'a', panelTopic, 'next', 'b', 'all');
        expect(rowsOf(updated, 'a')).to.deep.equal([
            null,
            { topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'main', next: 'b' } },
            { topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'other' } },
        ]);
        // the panel scope copies the links of the first all-panels row
        const panelRow = setNavigationLink(entries, 'a', panelTopic, 'next', 'b', 'panel');
        expect(rowsOf(panelRow, 'a')?.[3]).to.deep.equal({
            topic: panelTopic,
            navigation: { home: 'main', next: 'b' },
        });
    });

    it('ends the script navigation of a migrated chart entry', () => {
        const chart: PageConfigEntry = {
            card: 'cardChart',
            uniqueName: 'strom',
            scriptNavigation: true,
            scriptName: 'strom',
        };
        const updated = setNavigationLink([chart], 'strom', panelTopic, 'home', 'main', 'panel');
        expect(updated[0]).to.not.have.property('scriptNavigation');
        expect(rowsOf(updated, 'strom')).to.deep.equal([{ topic: panelTopic, navigation: { home: 'main' } }]);
    });
});

describe('lib/types/navigationEdit - applyNavigationOverlay', () => {
    const map: NavigationMap = [
        { page: 'main', origin: 'admin', adminPageName: 'start', next: 'a' },
        { page: 'a', origin: 'admin', adminPageName: 'a', prev: 'main', next: 'b' },
        { page: 'b', origin: 'admin', adminPageName: 'b', prev: 'a' },
        { page: 'script1', origin: 'script', home: 'main' },
    ];

    it('replaces the links of touched admin pages only', () => {
        const entries: PageConfigEntry[] = [
            gridEntry('start', [{ topic: panelTopic, navigation: { next: 'a' } }], true),
            gridEntry('a', [{ topic: panelTopic, navigation: { parent: 'b' } }]),
            gridEntry('b', [{ topic: panelTopic, navigation: { prev: 'a' } }]),
        ];
        const result = applyNavigationOverlay(map, entries, panelTopic, new Set(['a', 'script1']));

        expect(result).to.not.equal(map);
        // prev/next are not configured: they follow main.next = a and b.prev = a from the map
        expect(result[1]).to.deep.equal({
            page: 'a',
            origin: 'admin',
            adminPageName: 'a',
            prev: 'main',
            next: 'b',
            home: undefined,
            parent: 'b',
        });
        // not touched / not from the admin: same objects
        expect(result[0]).to.equal(map[0]);
        expect(result[2]).to.equal(map[2]);
        expect(result[3]).to.equal(map[3]);
    });

    it('maps the name of the start page entry to main and drops self references', () => {
        const entries: PageConfigEntry[] = [
            gridEntry('start', [{ topic: panelTopic, navigation: { next: 'a', home: 'start' } }], true),
            gridEntry('a', [{ topic: panelTopic, navigation: { home: 'start', parent: 'a' } }]),
        ];
        const result = applyNavigationOverlay(map, entries, panelTopic, new Set(['main', 'a']));

        expect(result[0].home).to.equal(undefined);
        expect(result[0].next).to.equal('a');
        expect(result[1].home).to.equal('main');
        expect(result[1].parent).to.equal(undefined);
    });

    it('gives a page without any link the default home, but not the start page', () => {
        // no other page points at main or a, so nothing can be derived for them
        const lonely: NavigationMap = [
            { page: 'main', origin: 'admin', adminPageName: 'start', next: 'a' },
            { page: 'a', origin: 'admin', adminPageName: 'a', prev: 'main' },
        ];
        const entries: PageConfigEntry[] = [
            gridEntry('start', [{ topic: panelTopic, navigation: {} }], true),
            gridEntry('a', [{ topic: panelTopic, navigation: {} }]),
        ];
        const result = applyNavigationOverlay(lonely, entries, panelTopic, new Set(['main', 'a']));

        expect(result[0].home).to.equal(undefined);
        expect(result[0].next).to.equal(undefined);
        expect(result[1].prev).to.equal(undefined);
        expect(result[1].home).to.equal('main');
    });

    it('keeps the rest of a touched entry', () => {
        const rich: NavigationMap = [
            {
                page: 'a',
                origin: 'admin',
                adminPageName: 'a',
                label: 'Seite A',
                position: { x: 10, y: 20 },
                targetPages: ['b'],
                targetPagesLongPress: ['c'],
                usedStates: ['s1'],
                pageInfo: { card: 'cardGrid', alwaysOn: 'none' },
            },
        ];
        const entries: PageConfigEntry[] = [gridEntry('a', [{ topic: panelTopic, navigation: { parent: 'b' } }])];
        const result = applyNavigationOverlay(rich, entries, panelTopic, new Set(['a']));
        expect(result[0]).to.deep.equal({ ...rich[0], prev: undefined, next: undefined, home: undefined, parent: 'b' });
    });

    it('keeps the counterpart of a prev/next the adapter derived', () => {
        // b.prev = a was derived by the adapter from a.next = b
        const entries: PageConfigEntry[] = [
            gridEntry('a', [{ topic: panelTopic, navigation: { next: 'b' } }]),
            gridEntry('b', [{ topic: panelTopic, navigation: { home: 'main' } }]),
        ];
        // b touched, a not: a.next comes from the map
        const onlyB = applyNavigationOverlay(map, entries, panelTopic, new Set(['b']));
        expect(onlyB[2].prev).to.equal('a');
        expect(onlyB[2].home).to.equal('main');
        // both touched: a.next comes from the configuration and still gives b its prev
        const both = applyNavigationOverlay(map, entries, panelTopic, new Set(['a', 'b']));
        expect(both[1].next).to.equal('b');
        expect(both[1].prev).to.equal('main'); // derived from main.next = a in the map
        expect(both[2].prev).to.equal('a');
    });

    it('drops a removed prev once the counterpart is gone as well', () => {
        const entries: PageConfigEntry[] = [
            gridEntry('a', [{ topic: panelTopic, navigation: {} }]),
            gridEntry('b', [{ topic: panelTopic, navigation: {} }]),
        ];
        const result = applyNavigationOverlay(map, entries, panelTopic, new Set(['a', 'b']));
        expect(result[2].prev).to.equal(undefined);
        expect(result[2].next).to.equal(undefined);
        expect(result[2].home).to.equal('main');
        // a still gets its prev from main.next = a (main is not touched)
        expect(result[1].prev).to.equal('main');
        expect(result[1].next).to.equal(undefined);
        expect(result[1].home).to.equal(undefined);
    });

    it('prefers the configured prev/next over a derived one', () => {
        const entries: PageConfigEntry[] = [gridEntry('b', [{ topic: panelTopic, navigation: { prev: 'main' } }])];
        const result = applyNavigationOverlay(map, entries, panelTopic, new Set(['b']));
        expect(result[2].prev).to.equal('main');
    });

    it('leaves pages alone that have no entry or are excluded on this panel', () => {
        const entries: PageConfigEntry[] = [
            gridEntry('a', [{ topic: ALL_PANELS_SPECIAL_ID, navigation: { home: 'main' } }, { topic: panelTopic }]),
        ];
        const result = applyNavigationOverlay(map, entries, panelTopic, new Set(['a', 'b']));
        expect(result[1]).to.equal(map[1]);
        expect(result[2]).to.equal(map[2]);
    });
});

describe('lib/types/navigationEdit - isNavigationApplied', () => {
    const map: NavigationMap = [
        { page: 'main', origin: 'admin', adminPageName: 'start', next: 'a' },
        { page: 'a', origin: 'admin', adminPageName: 'a', prev: 'main', home: 'main' },
        { page: 'b', origin: 'admin', adminPageName: 'b', home: 'main' },
        { page: 'script1', origin: 'script', home: 'main' },
    ];

    it('is true when the map matches the configuration, chaining and default home included', () => {
        const entries: PageConfigEntry[] = [
            gridEntry('start', [{ topic: panelTopic, navigation: { next: 'a' } }], true),
            gridEntry('a', [{ topic: panelTopic, navigation: { home: 'start' } }]),
            gridEntry('b', [{ topic: panelTopic, navigation: {} }]),
        ];
        expect(isNavigationApplied(map, entries, panelTopic, 'main')).to.equal(true);
        // a.prev is derived by the adapter - not configured, so it does not count
        expect(isNavigationApplied(map, entries, panelTopic, 'a')).to.equal(true);
        expect(isNavigationApplied(map, entries, panelTopic, 'b')).to.equal(true);
        // unknown pages and script pages cannot be judged
        expect(isNavigationApplied(map, entries, panelTopic, 'missing')).to.equal(true);
        expect(isNavigationApplied(map, entries, panelTopic, 'script1')).to.equal(true);
    });

    it('ignores links to pages the panel does not have - the adapter drops them as well', () => {
        // b.next names a page that does not exist; the adapter cannot resolve it and reports no
        // next, which must not keep b marked as unsaved forever. b.home is applied as configured.
        const entries: PageConfigEntry[] = [
            gridEntry('b', [{ topic: panelTopic, navigation: { next: 'nowhere', home: 'main' } }]),
        ];
        expect(isNavigationApplied(map, entries, panelTopic, 'b')).to.equal(true);
        // ...but a resolvable link that the map does not show yet still counts as pending
        const pending: PageConfigEntry[] = [
            gridEntry('b', [{ topic: panelTopic, navigation: { next: 'a', home: 'main' } }]),
        ];
        expect(isNavigationApplied(map, pending, panelTopic, 'b')).to.equal(false);
    });

    it('is false while the map still shows the old links', () => {
        const entries: PageConfigEntry[] = [
            gridEntry('start', [{ topic: panelTopic, navigation: { next: 'b' } }], true),
            gridEntry('a', [{ topic: panelTopic, navigation: { parent: 'b' } }]),
            gridEntry('b', [{ topic: panelTopic, navigation: { prev: 'a' } }]),
        ];
        expect(isNavigationApplied(map, entries, panelTopic, 'main')).to.equal(false);
        expect(isNavigationApplied(map, entries, panelTopic, 'a')).to.equal(false);
        expect(isNavigationApplied(map, entries, panelTopic, 'b')).to.equal(false);
    });
});
