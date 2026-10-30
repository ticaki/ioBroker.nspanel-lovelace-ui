import { expect } from 'chai';
import {
    buildLayoutTree,
    computeAutoLayout,
    countPages,
    defaultCollapsed,
    estimateNodeSize,
    hiddenByCollapse,
    placeNewNodes,
    subtreeOf,
    type LayoutEntry,
    type NodeSize,
    type Positions,
} from './navigationAutoLayout';
import {
    LAYOUT_TEST_MAPS,
    largeTreeMap,
    treeMap,
    typicalMap,
    type FixtureEntry,
} from './navigationAutoLayout.fixtures';

const NO_COLLAPSE = new Set<string>();

/**
 * Geschätzte Größen aller Knoten einer Map.
 *
 * @param map Die Map.
 * @returns Größe je Knoten.
 */
function sizesOf(map: readonly LayoutEntry[]): Map<string, NodeSize> {
    return new Map(map.map(e => [e.page, estimateNodeSize(e)]));
}

/**
 * Paare überlappender Knoten.
 *
 * @param pos Positionen.
 * @param sizes Größen.
 * @returns Die Paare als Text.
 */
function overlaps(pos: Positions, sizes: Map<string, NodeSize>): string[] {
    const ids = Object.keys(pos);
    const out: string[] = [];
    for (let i = 0; i < ids.length; i++) {
        const a = pos[ids[i]];
        const sa = sizes.get(ids[i])!;
        for (let j = i + 1; j < ids.length; j++) {
            const b = pos[ids[j]];
            const sb = sizes.get(ids[j])!;
            if (a.x < b.x + sb.width && b.x < a.x + sa.width && a.y < b.y + sb.height && b.y < a.y + sa.height) {
                out.push(`${ids[i]} / ${ids[j]}`);
            }
        }
    }
    return out;
}

/**
 * Layout-Elternseite jeder Seite.
 *
 * @param map Die Map.
 * @returns Elternseite je Seite.
 */
function ownersOf(map: readonly LayoutEntry[]): Map<string, string> {
    const tree = buildLayoutTree(map);
    const owners = new Map<string, string>();
    for (const [page, kids] of tree.kids) {
        for (const kid of kids) {
            for (const n of kid.chain.nodes) {
                owners.set(n, page);
            }
        }
    }
    return owners;
}

describe('navigationAutoLayout', () => {
    for (const [name, make] of Object.entries(LAYOUT_TEST_MAPS)) {
        describe(`map ${name}`, () => {
            const map = make();
            const sizes = sizesOf(map);
            const tree = buildLayoutTree(map);
            for (const parentAlign of ['center', 'top'] as const) {
                const pos = computeAutoLayout(map, sizes, { collapsed: NO_COLLAPSE, parentAlign });

                it(`places every node without overlap (${parentAlign})`, () => {
                    expect(Object.keys(pos).sort()).to.deep.equal(map.map(e => e.page).sort());
                    expect(overlaps(pos, sizes)).to.deep.equal([]);
                });

                it(`keeps main on top and the main chain vertical (${parentAlign})`, () => {
                    const pages = map.filter(e => e.nodeType !== 'stateRef').map(e => e.page);
                    const minY = Math.min(...pages.map(p => pos[p].y));
                    expect(pos.main.y).to.equal(minY);
                    const trunk = tree.chainOf.get('main')!.nodes;
                    expect(trunk[0]).to.equal('main');
                    const center = (id: string): number => pos[id].x + sizes.get(id)!.width / 2;
                    for (let i = 1; i < trunk.length; i++) {
                        const [a, b] = [trunk[i - 1], trunk[i]];
                        if (pos[b].y > pos[a].y) {
                            // im selben Band: senkrecht darunter
                            expect(Math.abs(center(b) - center(a)), b).to.be.at.most(1);
                        } else {
                            // Bänder: die Kette geht im nächsten Band oben weiter
                            expect(pos[b].x, b).to.be.greaterThan(pos[a].x);
                        }
                    }
                });
            }

            it('puts state nodes in an outer column right of all pages', () => {
                const pos = computeAutoLayout(map, sizes, { collapsed: NO_COLLAPSE });
                const pages = map.filter(e => e.nodeType !== 'stateRef');
                const right = Math.max(...pages.map(e => pos[e.page].x + sizes.get(e.page)!.width));
                for (const e of map.filter(e => e.nodeType === 'stateRef' && tree.stateUsers.has(e.page))) {
                    expect(pos[e.page].x, e.page).to.be.greaterThan(right);
                }
            });

            it('does not move a page when the state nodes are left out', () => {
                const pos = computeAutoLayout(map, sizes, { collapsed: NO_COLLAPSE });
                const pagesOnly = map
                    .filter(e => e.nodeType !== 'stateRef')
                    .map(e => ({ ...e, usedStates: undefined }));
                const pos2 = computeAutoLayout(pagesOnly, sizes, { collapsed: NO_COLLAPSE });
                for (const e of pagesOnly) {
                    expect(pos2[e.page], e.page).to.deep.equal(pos[e.page]);
                }
            });
        });
    }

    describe('tree-shaped configurations', () => {
        it('prefers the target page that is the parent of a page linked twice', () => {
            const owners = ownersOf(treeMap());
            // Wohnen links first, the parent is Schlafen
            expect(owners.get('Szenen_Alle')).to.equal('Schlafen');
            // Garten links first, the parent is Energie
            expect(owners.get('Wallbox')).to.equal('Energie');
            expect(owners.get('Kueche_Timer')).to.equal('Kueche');
            expect(owners.get('Wohnen')).to.equal('main');
        });

        it('lays the tree out from left to right, siblings stacked in the next column', () => {
            for (const map of [treeMap(), largeTreeMap()]) {
                const sizes = sizesOf(map);
                const pos = computeAutoLayout(map, sizes, { collapsed: NO_COLLAPSE, bands: false });
                const owners = ownersOf(map);
                for (const [page, owner] of owners) {
                    expect(pos[page].x, page).to.be.greaterThan(pos[owner].x + sizes.get(owner)!.width);
                }
                // Geschwister untereinander: gleiche Spaltenmitte
                const energie = ['PV', 'Batterie', 'Netz', 'Wallbox'];
                if (pos.Energie) {
                    const c = (id: string): number => pos[id].x + sizes.get(id)!.width / 2;
                    for (const s of energie) {
                        expect(Math.abs(c(s) - c('PV'))).to.be.at.most(1);
                    }
                }
            }
        });

        it('centres a page on the block of its sub pages', () => {
            const map = treeMap();
            const sizes = sizesOf(map);
            const pos = computeAutoLayout(map, sizes, { collapsed: NO_COLLAPSE, parentAlign: 'center' });
            const kids = [
                'PV',
                'Batterie',
                'Netz',
                'Wallbox',
                'Waermepumpe',
                'Verbrauch',
                'Zaehler',
                'Prognose',
                'Historie',
                'Tarif',
            ];
            const top = Math.min(...kids.map(k => pos[k].y));
            const bottom = Math.max(...kids.map(k => pos[k].y + sizes.get(k)!.height));
            const mid = pos.Energie.y + sizes.get('Energie')!.height / 2;
            // Der Long-Press-Eintrag hängt mit im Block - die Mitte liegt im Block der Ziele
            expect(mid).to.be.within(top, bottom + 100);
        });

        it('puts a page that only links into the tree next to its target, not below everything', () => {
            const map: FixtureEntry[] = [
                { page: 'main', label: 'main', prev: 'a', next: 'b' },
                { page: 'a', label: 'a', next: 'main' },
                { page: 'b', label: 'b', prev: 'main', next: 'c' },
                { page: 'c', label: 'c', prev: 'b' },
                { page: '///unlock', label: '///unlock', next: 'main', targetPages: ['///Overview'] },
                { page: '///Overview', label: '///Overview', parent: '///unlock' },
            ];
            const tree = buildLayoutTree(map);
            expect(tree.trees).to.have.length(1);
            expect(tree.kids.get('main')?.map(k => k.entry)).to.deep.equal(['///unlock']);
            const sizes = sizesOf(map);
            const pos = computeAutoLayout(map, sizes, { collapsed: NO_COLLAPSE });
            expect(pos['///unlock'].x).to.be.greaterThan(pos.main.x + sizes.get('main')!.width);
            expect(pos['///unlock'].y).to.be.below(pos.c.y);
        });

        it('distributes the sub trees of main over bands in a large tree', () => {
            const map = largeTreeMap();
            expect(countPages(map)).to.be.at.least(60);
            const sizes = sizesOf(map);
            const flat = computeAutoLayout(map, sizes, { collapsed: NO_COLLAPSE, bands: false });
            const banded = computeAutoLayout(map, sizes, { collapsed: NO_COLLAPSE });
            const box = (pos: Positions): { w: number; h: number } => {
                const ids = Object.keys(pos);
                return {
                    w: Math.max(...ids.map(i => pos[i].x + sizes.get(i)!.width)) - Math.min(...ids.map(i => pos[i].x)),
                    h: Math.max(...ids.map(i => pos[i].y + sizes.get(i)!.height)) - Math.min(...ids.map(i => pos[i].y)),
                };
            };
            const f = box(flat);
            const b = box(banded);
            expect(b.h).to.be.lessThan(f.h * 0.7);
            expect(b.w / b.h).to.be.greaterThan(f.w / f.h);
            // the pages come close to the aimed aspect ratio of the bands
            const pages = box(Object.fromEntries(Object.entries(banded).filter(([id]) => !id.startsWith('dp:'))));
            expect(pages.w / pages.h).to.be.within(1.2, 2.1);
            expect(overlaps(banded, sizes)).to.deep.equal([]);
            // ///unlock bleibt unter main
            expect(Math.abs(banded['///unlock'].x - banded.main.x)).to.be.at.most(sizes.get('main')!.width);
        });
    });

    describe('collapsing', () => {
        it('collapses the service sub tree by default', () => {
            const map = treeMap();
            const tree = buildLayoutTree(map);
            expect(defaultCollapsed(tree)).to.deep.equal(['///unlock']);
            const hidden = hiddenByCollapse(tree, new Set(defaultCollapsed(tree)));
            for (const e of map) {
                if (e.page.startsWith('///') && e.page !== '///unlock') {
                    expect(hidden.has(e.page), e.page).to.equal(true);
                }
            }
            expect(hidden.has('main')).to.equal(false);
            expect(hidden.has('///unlock')).to.equal(false);
            // without system pages nothing is collapsed
            const plain = map.filter(e => !e.page.startsWith('///'));
            expect(defaultCollapsed(buildLayoutTree(plain))).to.deep.equal([]);
        });

        it('lays a collapsed sub tree out as a single node', () => {
            const map = treeMap();
            const sizes = sizesOf(map);
            const tree = buildLayoutTree(map);
            const collapsed = new Set(['Energie', '///unlock']);
            const pos = computeAutoLayout(map, sizes, { collapsed });
            const gone = new Set([...subtreeOf(tree, 'Energie'), ...subtreeOf(tree, '///unlock')]);
            expect(gone.has('PV')).to.equal(true);
            expect(gone.has('Energie')).to.equal(false);
            for (const id of gone) {
                expect(pos[id], id).to.equal(undefined);
            }
            // Same as the map without the hidden pages
            const reduced: FixtureEntry[] = map
                .filter(e => !gone.has(e.page) && e.nodeType !== 'stateRef')
                .map(e => ({
                    ...e,
                    usedStates: undefined,
                    targetPages: e.targetPages?.filter(t => !gone.has(t)),
                    targetPagesLongPress: e.targetPagesLongPress?.filter(t => !gone.has(t)),
                }));
            const pos2 = computeAutoLayout(reduced, sizes, { collapsed: NO_COLLAPSE });
            for (const e of reduced) {
                expect(pos[e.page], e.page).to.deep.equal(pos2[e.page]);
            }
            expect(overlaps(pos, sizes)).to.deep.equal([]);
        });
    });

    describe('placing new nodes only', () => {
        it('never moves a positioned node and places the new ones without overlap', () => {
            const base = treeMap();
            const sizes0 = sizesOf(base);
            const fixed = computeAutoLayout(base, sizes0, { collapsed: NO_COLLAPSE });
            const map: FixtureEntry[] = base.map(e => ({ ...e }));
            map.push({ page: 'WZ_Neu', label: 'WZ_Neu', parent: 'Wohnen', home: 'main' });
            map.find(e => e.page === 'Wohnen')!.targetPages!.push('WZ_Neu');
            map.push({ page: 'Garten_Licht2', label: 'Garten_Licht2', prev: 'Garten_Licht' });
            map.find(e => e.page === 'Garten_Licht')!.next = 'Garten_Licht2';
            map.push({ page: 'Verwaist', label: 'Verwaist' });
            map.push({ page: 'dp:neu', label: 'neu', nodeType: 'stateRef' });
            map.find(e => e.page === 'Bad')!.usedStates = ['dp:neu'];
            const sizes = sizesOf(map);
            const toPlace = new Set(['WZ_Neu', 'Garten_Licht2', 'Verwaist', 'dp:neu']);
            const placed = placeNewNodes(map, sizes, fixed, toPlace, { collapsed: NO_COLLAPSE });
            expect(Object.keys(placed).sort()).to.deep.equal([...toPlace].sort());
            expect(overlaps({ ...fixed, ...placed }, sizes)).to.deep.equal([]);
            // neue Unterseite in der Spalte der Geschwister (mittig wie sie), rechts von Wohnen
            const centre = (p: { x: number }, id: string): number => p.x + sizes.get(id)!.width / 2;
            expect(centre(placed.WZ_Neu, 'WZ_Neu')).to.be.closeTo(centre(fixed.WZ_Licht, 'WZ_Licht'), 1);
            expect(placed.WZ_Neu.y).to.be.at.least(fixed.Wohnen.y);
            // Kettenende: darunter
            expect(placed.Garten_Licht2.y).to.be.greaterThan(fixed.Garten_Licht.y);
            // verwaist: unter allem
            const bottom = Math.max(...Object.keys(fixed).map(id => fixed[id].y + sizes.get(id)!.height));
            expect(placed.Verwaist.y).to.be.greaterThan(bottom);
            // Datenpunkt: äußere Spalte auf Höhe seiner Seite oder darunter
            const pageRight = Math.max(
                ...Object.keys(fixed)
                    .filter(id => !id.startsWith('dp:'))
                    .map(id => fixed[id].x + sizes.get(id)!.width),
            );
            expect(placed['dp:neu'].x).to.be.greaterThan(pageRight);
            expect(placed['dp:neu'].y).to.be.at.least(fixed.Bad.y);
        });

        it('does not let state nodes push a new page away', () => {
            const map: FixtureEntry[] = [
                { page: 'main', label: 'main', targetPages: ['a'], usedStates: ['dp:x'] },
                { page: 'a', label: 'a', parent: 'main' },
                { page: 'dp:x', label: 'x', nodeType: 'stateRef' },
            ];
            const sizes = sizesOf(map);
            // the state node stands right where the new sub page belongs
            const fixed: Positions = { main: { x: 0, y: 0 }, 'dp:x': { x: 150, y: 0 } };
            const placed = placeNewNodes(map, sizes, fixed, new Set(['a']), { collapsed: NO_COLLAPSE });
            expect(placed.a.y).to.equal(0);
            expect(placed.a.x).to.be.greaterThan(sizes.get('main')!.width);
        });

        it('lays out everything when nothing has a position yet', () => {
            const map = typicalMap();
            const sizes = sizesOf(map);
            const all = new Set(map.map(e => e.page));
            const placed = placeNewNodes(map, sizes, {}, all, { collapsed: NO_COLLAPSE });
            expect(placed).to.deep.equal(computeAutoLayout(map, sizes, { collapsed: NO_COLLAPSE }));
        });

        it('leaves nodes in collapsed sub trees alone', () => {
            const map = treeMap();
            const sizes = sizesOf(map);
            const all = new Set(map.map(e => e.page));
            const tree = buildLayoutTree(map);
            const collapsed = new Set(defaultCollapsed(tree));
            const placed = placeNewNodes(map, sizes, {}, all, { collapsed });
            expect(placed['///Overview']).to.equal(undefined);
            expect(placed['///unlock']).to.not.equal(undefined);
        });
    });
});
