import { expect } from 'chai';
import {
    ALL_PANELS_SPECIAL_ID,
    type MenuEntry,
    type NavigationMap,
    type NavigationMapEntry,
    type NavigationOverride,
    type PageConfigEntry,
} from './adminShareConfig';
import {
    adapterDecidedLink,
    applyNavigationOverlay,
    assignmentSourceOf,
    effectiveNavigation,
    effectiveScriptLinks,
    isNavigationApplied,
    isNavigationLinkKind,
    overrideOf,
    removeNavigationOverride,
    setNavigationLink,
    setOverrideLink,
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
            gridEntry('start', [{ topic: panelTopic, navigation: { next: 'a' } }], true),
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
            gridEntry('start', [{ topic: panelTopic, navigation: { next: 'a' } }], true),
            gridEntry('a', [{ topic: panelTopic, navigation: {} }]),
            gridEntry('b', [{ topic: panelTopic, navigation: {} }]),
        ];
        const result = applyNavigationOverlay(map, entries, panelTopic, new Set(['a', 'b']));
        expect(result[2].prev).to.equal(undefined);
        expect(result[2].next).to.equal(undefined);
        expect(result[2].home).to.equal('main');
        // a still gets its prev from main.next = a (main is not touched) - the default home comes
        // on top of it, as the adapter decides on it before chaining
        expect(result[1].prev).to.equal('main');
        expect(result[1].next).to.equal(undefined);
        expect(result[1].home).to.equal('main');
    });

    it('lets the chaining of an admin counterpart win over the configured prev/next', () => {
        // a (admin) has next = b: the adapter sets b.prev = a ahead of b's own prev
        const entries: PageConfigEntry[] = [
            gridEntry('a', [{ topic: panelTopic, navigation: { next: 'b' } }]),
            gridEntry('b', [{ topic: panelTopic, navigation: { prev: 'main' } }]),
        ];
        const result = applyNavigationOverlay(map, entries, panelTopic, new Set(['b']));
        expect(result[2].prev).to.equal('a');
        // without the counterpart the configured value is used
        const alone: NavigationMap = map.filter(e => e.page !== 'a');
        expect(applyNavigationOverlay(alone, entries, panelTopic, new Set(['b']))[1].prev).to.equal('main');
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

/**
 * A script page of the navigation map, with the links the adapter reports for it.
 *
 * @param page Node id.
 * @param links Links as shown in the map.
 * @param scriptLinks Links according to the script, defaults to `links`; `null` leaves them out.
 * @param extra Further fields of the entry.
 * @returns The entry.
 */
function scriptEntry(
    page: string,
    links: Pick<NavigationMapEntry, 'prev' | 'next' | 'home' | 'parent'>,
    scriptLinks: NavigationOverride['scriptLinks'] | null = links,
    extra: Partial<NavigationMapEntry> = {},
): NavigationMapEntry {
    return { page, origin: 'script', ...links, scriptLinks: scriptLinks ?? undefined, ...extra };
}

describe('lib/types/navigationEdit - adapterDecidedLink (splice rules of admin.ts)', () => {
    // grid6 -> grid3 in the script; the admin page usp wants to sit right before grid3
    const spliceMap = (): NavigationMap => [
        { page: 'main', origin: 'script', next: 'grid6', scriptLinks: { next: 'grid6' } },
        scriptEntry('grid6', { prev: 'main', next: 'grid3' }),
        scriptEntry('grid3', { prev: 'grid6', home: 'main' }),
        { page: 'usp', origin: 'admin', adminPageName: 'usp', next: 'grid3' },
    ];

    it('b) inserts an admin page without prev before the next of a page', () => {
        const entries: PageConfigEntry[] = [gridEntry('usp', [{ topic: panelTopic, navigation: { next: 'grid3' } }])];
        expect(adapterDecidedLink(spliceMap(), entries, panelTopic, 'grid6', 'next')).to.equal('usp');
        // grid3.prev is the direct counterpart a)
        expect(adapterDecidedLink(spliceMap(), entries, panelTopic, 'grid3', 'prev')).to.equal('usp');
        const overlay = applyNavigationOverlay(spliceMap(), entries, panelTopic, new Set(['grid6'])).find(
            e => e.page === 'grid6',
        );
        expect(overlay?.next).to.equal('usp');
        // the adapter decides - the link is not compared, whatever the map shows
        const spliced = spliceMap();
        spliced[1] = scriptEntry('grid6', { prev: 'main', next: 'usp' }, { prev: 'main', next: 'grid3' });
        expect(isNavigationApplied(spliced, entries, panelTopic, 'grid6')).to.equal(true);
        expect(isNavigationApplied(spliceMap(), entries, panelTopic, 'grid6')).to.equal(true);
        // an override that restores the script value stays "applied" as well
        const overrides: NavigationOverride[] = [
            {
                panelTopic,
                page: 'grid6',
                navigation: { prev: 'main', next: 'grid3' },
                scriptLinks: { prev: 'main', next: 'grid3' },
            },
        ];
        expect(isNavigationApplied(spliced, entries, panelTopic, 'grid6', overrides)).to.equal(true);
    });

    it('b) does not apply to an admin page with a prev of its own - only a) counts for it', () => {
        const entries: PageConfigEntry[] = [
            gridEntry('usp', [{ topic: panelTopic, navigation: { prev: 'main', next: 'grid3' } }]),
        ];
        expect(adapterDecidedLink(spliceMap(), entries, panelTopic, 'grid6', 'next')).to.equal(undefined);
        // a) still works: usp.prev = main decides main.next, usp.next = grid3 decides grid3.prev
        expect(adapterDecidedLink(spliceMap(), entries, panelTopic, 'main', 'next')).to.equal('usp');
        expect(adapterDecidedLink(spliceMap(), entries, panelTopic, 'grid3', 'prev')).to.equal('usp');
    });

    it('c) attaches a page to the end of an admin chain spliced after its prev', () => {
        // q -> p in the script; admin pages o1, o2 want to follow q
        const map: NavigationMap = [
            { page: 'main', origin: 'script', next: 'q', scriptLinks: { next: 'q' } },
            scriptEntry('q', { prev: 'main', next: 'p' }),
            scriptEntry('p', { prev: 'q', home: 'main' }),
            { page: 'o1', origin: 'admin', adminPageName: 'o1', prev: 'q' },
            { page: 'o2', origin: 'admin', adminPageName: 'o2', prev: 'q' },
        ];
        const entries: PageConfigEntry[] = [
            gridEntry('o1', [{ topic: panelTopic, navigation: { prev: 'q' } }]),
            gridEntry('o2', [{ topic: panelTopic, navigation: { prev: 'q' } }]),
        ];
        expect(adapterDecidedLink(map, entries, panelTopic, 'p', 'prev')).to.equal('o2');
        expect(adapterDecidedLink(map, entries, panelTopic, 'q', 'next')).to.equal('o1');
        const p = applyNavigationOverlay(map, entries, panelTopic, new Set(['p'])).find(e => e.page === 'p');
        expect(p?.prev).to.equal('o2');
        expect(isNavigationApplied(map, entries, panelTopic, 'p')).to.equal(true);
        // the last of the chain has a next of its own: the splice end is not wired
        const withNext: PageConfigEntry[] = [
            entries[0],
            gridEntry('o2', [{ topic: panelTopic, navigation: { prev: 'q', next: 'main' } }]),
        ];
        expect(adapterDecidedLink(map, withNext, panelTopic, 'p', 'prev')).to.equal(undefined);
        // q does not lead to p on its own: p is not the old neighbour, nothing is attached
        const oneSided: NavigationMap = map.map(e => (e.page === 'q' ? scriptEntry('q', { prev: 'main' }) : e));
        expect(adapterDecidedLink(oneSided, entries, panelTopic, 'p', 'prev')).to.equal(undefined);
    });

    it('ignores admin pages that are not assigned to the panel', () => {
        const entries: PageConfigEntry[] = [gridEntry('usp', [{ topic: otherTopic, navigation: { next: 'grid3' } }])];
        expect(adapterDecidedLink(spliceMap(), entries, panelTopic, 'grid6', 'next')).to.equal(undefined);
        expect(adapterDecidedLink(spliceMap(), entries, panelTopic, 'grid3', 'prev')).to.equal(undefined);
    });
});

describe('lib/types/navigationEdit - setOverrideLink / removeNavigationOverride / overrideOf', () => {
    it('creates an override from the script links and keeps a snapshot of them', () => {
        const overrides: NavigationOverride[] = [];
        const updated = setOverrideLink(overrides, panelTopic, 'a', 'next', 'c', { prev: 'main', next: 'b' });
        expect(updated).to.not.equal(overrides);
        expect(overrides).to.deep.equal([]);
        expect(updated).to.deep.equal([
            {
                panelTopic,
                page: 'a',
                navigation: { prev: 'main', next: 'c' },
                scriptLinks: { prev: 'main', next: 'b' },
            },
        ]);
        expect(overrideOf(updated, panelTopic, 'a')).to.equal(updated[0]);
        expect(overrideOf(updated, otherTopic, 'a')).to.equal(undefined);
    });

    it('updates an existing override and leaves its snapshot alone', () => {
        const overrides: NavigationOverride[] = [
            { panelTopic, page: 'a', navigation: { next: 'c' }, scriptLinks: { next: 'b' } },
            { panelTopic: otherTopic, page: 'a', navigation: { next: 'x' }, scriptLinks: { next: 'b' } },
        ];
        const updated = setOverrideLink(overrides, panelTopic, 'a', 'home', 'main', { next: 'b' });
        expect(updated[0]).to.deep.equal({
            panelTopic,
            page: 'a',
            navigation: { next: 'c', home: 'main' },
            scriptLinks: { next: 'b' },
        });
        expect(updated[1]).to.equal(overrides[1]);
        expect(overrides[0].navigation).to.deep.equal({ next: 'c' });
    });

    it('moves the snapshot on when a stale override is changed, and keeps it otherwise', () => {
        const overrides: NavigationOverride[] = [
            { panelTopic, page: 'a', navigation: { next: 'c' }, scriptLinks: { next: 'b' } },
        ];
        const stale = setOverrideLink(overrides, panelTopic, 'a', 'home', 'main', { next: 'z', parent: 'p' });
        expect(stale[0]).to.deep.equal({
            panelTopic,
            page: 'a',
            navigation: { next: 'c', home: 'main' },
            scriptLinks: { next: 'z', parent: 'p' },
        });
        const fresh = setOverrideLink(overrides, panelTopic, 'a', 'home', 'main', { next: 'b' });
        expect(fresh[0].scriptLinks).to.deep.equal({ next: 'b' });
    });

    it('removes a link with target undefined and is a no-op for self references and unchanged links', () => {
        const overrides: NavigationOverride[] = [
            { panelTopic, page: 'a', navigation: { next: 'c', home: 'main' }, scriptLinks: { next: 'b' } },
        ];
        expect(setOverrideLink(overrides, panelTopic, 'a', 'home', undefined, {})[0].navigation).to.deep.equal({
            next: 'c',
        });
        expect(setOverrideLink(overrides, panelTopic, 'a', 'next', 'a', {})).to.equal(overrides);
        expect(setOverrideLink(overrides, panelTopic, 'a', 'next', 'c', {})).to.equal(overrides);
        expect(setOverrideLink(overrides, panelTopic, 'a', 'parent', undefined, {})).to.equal(overrides);
        expect(setOverrideLink([], panelTopic, 'b', 'next', 'b', { next: 'c' })).to.deep.equal([]);
    });

    it('removes an override and returns the input when there is none', () => {
        const overrides: NavigationOverride[] = [
            { panelTopic, page: 'a', navigation: {}, scriptLinks: {} },
            { panelTopic, page: 'b', navigation: {}, scriptLinks: {} },
        ];
        expect(removeNavigationOverride(overrides, panelTopic, 'a')).to.deep.equal([overrides[1]]);
        expect(removeNavigationOverride(overrides, panelTopic, 'c')).to.equal(overrides);
        expect(removeNavigationOverride(overrides, otherTopic, 'a')).to.equal(overrides);
    });

    it('effectiveScriptLinks prefers the override and refuses what cannot be edited', () => {
        const overrides: NavigationOverride[] = [
            { panelTopic, page: 'a', navigation: { next: 'c' }, scriptLinks: { next: 'b' } },
        ];
        expect(effectiveScriptLinks(scriptEntry('a', { next: 'b' }), overrides, panelTopic)).to.deep.equal({
            next: 'c',
        });
        expect(effectiveScriptLinks(scriptEntry('a', { next: 'b' }), overrides, otherTopic)).to.deep.equal({
            next: 'b',
        });
        expect(
            effectiveScriptLinks(scriptEntry('a', { next: 'b' }, { next: 'b' }, { origin: 'global' }), [], panelTopic),
        ).to.deep.equal({ next: 'b' });
        expect(effectiveScriptLinks(scriptEntry('a', { next: 'b' }, null), [], panelTopic)).to.equal(undefined);
        expect(
            effectiveScriptLinks(
                scriptEntry('a', { next: 'b' }, { next: 'b' }, { generated: true }),
                overrides,
                panelTopic,
            ),
        ).to.equal(undefined);
        expect(
            effectiveScriptLinks(scriptEntry('a', { next: 'b' }, { next: 'b' }, { origin: 'admin' }), [], panelTopic),
        ).to.equal(undefined);
    });
});

describe('lib/types/navigationEdit - overlay and applied check for script pages', () => {
    const map = (): NavigationMap => [
        { page: 'main', origin: 'script', next: 'a', scriptLinks: { next: 'a' } },
        scriptEntry('a', { prev: 'main', next: 'b' }),
        scriptEntry('b', { prev: 'a', home: 'main' }),
        scriptEntry('media-1', { parent: 'a' }, { parent: 'a' }, { generated: true }),
    ];

    it('overlays the override of a touched script page and derives the counterpart', () => {
        const overrides: NavigationOverride[] = [
            {
                panelTopic,
                page: 'a',
                navigation: { prev: 'main', next: 'main' },
                scriptLinks: { prev: 'main', next: 'b' },
            },
        ];
        const result = applyNavigationOverlay(map(), [], panelTopic, new Set(['a']), overrides);
        expect(result.find(e => e.page === 'a')).to.include({ prev: 'main', next: 'main' });
        // b is not touched - stays as the map says
        expect(result.find(e => e.page === 'b')).to.include({ prev: 'a', home: 'main' });
        // without an override the touched page shows the script links again (override removed)
        const restored = applyNavigationOverlay(map(), [], panelTopic, new Set(['a']), []);
        expect(restored.find(e => e.page === 'a')).to.include({ prev: 'main', next: 'b' });
    });

    it('leaves a generated page alone even when touched', () => {
        const overrides: NavigationOverride[] = [
            { panelTopic, page: 'media-1', navigation: { home: 'main' }, scriptLinks: { parent: 'a' } },
        ];
        const result = applyNavigationOverlay(map(), [], panelTopic, new Set(['media-1']), overrides);
        expect(result.find(e => e.page === 'media-1')).to.deep.equal(map()[3]);
    });

    it('gives a touched script page without any link the default home', () => {
        const overrides: NavigationOverride[] = [
            { panelTopic, page: 'b', navigation: {}, scriptLinks: { prev: 'a', home: 'main' } },
        ];
        const result = applyNavigationOverlay(map(), [], panelTopic, new Set(['b']), overrides);
        const b = result.find(e => e.page === 'b');
        expect(b?.home).to.equal('main');
        // a.next points at b, but a is a script page - only admin pages chain
        expect(b?.prev).to.equal(undefined);
        expect(b?.next).to.equal(undefined);
    });

    it('derives prev/next from an admin counterpart only', () => {
        const withAdmin: NavigationMap = [
            ...map(),
            { page: 'x', origin: 'admin', adminPageName: 'x', prev: 'b' },
            { page: 'y', origin: 'admin', adminPageName: 'y', next: 'b' },
        ];
        const entries: PageConfigEntry[] = [
            gridEntry('x', [{ topic: panelTopic, navigation: { prev: 'b' } }]),
            // y points at b only on another panel
            gridEntry('y', [{ topic: otherTopic, navigation: { next: 'b' } }]),
        ];
        expect(adapterDecidedLink(withAdmin, entries, panelTopic, 'b', 'next')).to.equal('x');
        expect(adapterDecidedLink(withAdmin, entries, panelTopic, 'b', 'prev')).to.equal(undefined);
        const overrides: NavigationOverride[] = [{ panelTopic, page: 'b', navigation: {}, scriptLinks: { prev: 'a' } }];
        const b = applyNavigationOverlay(withAdmin, entries, panelTopic, new Set(['b']), overrides).find(
            e => e.page === 'b',
        );
        expect(b?.next).to.equal('x');
        expect(b?.prev).to.equal(undefined);
        // an admin page without an entry is not assigned to the panel - it has no say
        const noEntry = applyNavigationOverlay(withAdmin, [], panelTopic, new Set(['b']), overrides).find(
            e => e.page === 'b',
        );
        expect(noEntry?.next).to.equal(undefined);
        expect(noEntry?.prev).to.equal(undefined);
    });

    it('lets the admin chaining win over a configured prev/next, for the overlay and the applied check', () => {
        // admin page X with prev = S; S is a script page whose override says next = Y
        const base = (): NavigationMap => [
            ...map(),
            scriptEntry('s', { home: 'main' }),
            scriptEntry('y', { home: 'main' }),
            { page: 'x', origin: 'admin', adminPageName: 'x', prev: 's' },
        ];
        const entries: PageConfigEntry[] = [gridEntry('x', [{ topic: panelTopic, navigation: { prev: 's' } }])];
        const overrides: NavigationOverride[] = [
            { panelTopic, page: 's', navigation: { next: 'y', home: 'main' }, scriptLinks: { home: 'main' } },
        ];
        const s = applyNavigationOverlay(base(), entries, panelTopic, new Set(['s']), overrides).find(
            e => e.page === 's',
        );
        expect(s?.next).to.equal('x');
        // the map shows what the adapter decided - the override counts as applied
        const applied = base();
        applied[5] = scriptEntry('s', { next: 'x', home: 'main' }, { home: 'main' });
        expect(isNavigationApplied(applied, entries, panelTopic, 's', overrides)).to.equal(true);
        // an admin page in the same situation
        const adminMap: NavigationMap = [
            ...base(),
            { page: 'z', origin: 'admin', adminPageName: 'z', prev: 'x', home: 'main' },
        ];
        const adminEntries: PageConfigEntry[] = [
            ...entries,
            gridEntry('z', [{ topic: panelTopic, navigation: { prev: 's', home: 'main' } }]),
            gridEntry('w', [{ topic: panelTopic, navigation: { next: 'z' } }]),
        ];
        adminMap.push({ page: 'w', origin: 'admin', adminPageName: 'w', next: 'z' });
        const z = applyNavigationOverlay(adminMap, adminEntries, panelTopic, new Set(['z'])).find(e => e.page === 'z');
        expect(z?.prev).to.equal('w');
        expect(isNavigationApplied(adminMap, adminEntries, panelTopic, 'z')).to.equal(true);
    });

    it('isNavigationApplied compares the override with the map', () => {
        const overrides: NavigationOverride[] = [
            {
                panelTopic,
                page: 'a',
                navigation: { prev: 'main', next: 'main' },
                scriptLinks: { prev: 'main', next: 'b' },
            },
        ];
        expect(isNavigationApplied(map(), [], panelTopic, 'a', overrides)).to.equal(false);
        const applied = map();
        applied[1] = scriptEntry('a', { prev: 'main', next: 'main' }, { prev: 'main', next: 'b' });
        expect(isNavigationApplied(applied, [], panelTopic, 'a', overrides)).to.equal(true);
        // override removed: applied once the map shows the script links again
        expect(isNavigationApplied(applied, [], panelTopic, 'a', [])).to.equal(false);
        expect(isNavigationApplied(map(), [], panelTopic, 'a', [])).to.equal(true);
        // a link to a page the panel does not have is dropped by the adapter - counts as applied
        const unknown: NavigationOverride[] = [
            { panelTopic, page: 'a', navigation: { prev: 'main', next: 'b', home: 'nowhere' }, scriptLinks: {} },
        ];
        expect(isNavigationApplied(map(), [], panelTopic, 'a', unknown)).to.equal(true);
    });
});
