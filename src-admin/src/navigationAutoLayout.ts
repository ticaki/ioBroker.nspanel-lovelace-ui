/**
 * Automatische Anordnung des Navigation-Flows - reine Logik ohne React.
 *
 * Aufbau (Spalten-Layout):
 * - prev/next-Ketten werden zu senkrechten Spalten; Ringe werden so aufgebrochen, dass `main` oben
 *   steht, andere Ringe an der Seite, die von außen erreicht wird.
 * - Unterseiten (targetPages, targetPagesLongPress, parent-Rückverweis, prev/next in eine andere
 *   Kette) stehen in der Spalte rechts neben der Seite, die zu ihnen führt. Bei mehreren Verweisen
 *   gewinnt ein targetPages-Verweis der Seite, die als `parent` der Unterseite eingetragen ist.
 * - Teilbäume werden über ihre Konturen gepackt (je Spalte oberste/unterste belegte Höhe), nicht
 *   als Blöcke - so entstehen bei breiten Teilbäumen keine großen Lücken.
 * - Datenpunkt-Knoten stehen in einer äußeren Spalte rechts auf Höhe ihrer Seite; sie verschieben
 *   keine Seite, Ein- und Ausblenden der Datenpunkte ändert an den Seiten nichts.
 * - Nicht erreichbare Seiten kommen als eigene Bäume in den Bereich darunter.
 * - Große Konfigurationen (ab {@link AUTO_LAYOUT_DEFAULTS.bandMinPages} Seiten) werden auf mehrere
 *   Bänder nebeneinander verteilt: je Seite der Hauptkette ein Abschnitt, zu hohe Abschnitte (der
 *   typische Fall bei Bäumen unter `main`) werden in ihre Teilbäume zerlegt.
 * - Eingeklappte Unterbäume zählen als ein Knoten: ihre Nachkommen bekommen keine Position.
 */
import { servicePageName, type NavigationMapEntry } from '../../src/lib/types/adminShareConfig';

/** Der Teil eines Eintrags der Navigation-Map, den das Layout braucht */
export type LayoutEntry = Pick<
    NavigationMapEntry,
    | 'page'
    | 'label'
    | 'nodeType'
    | 'prev'
    | 'next'
    | 'home'
    | 'parent'
    | 'targetPages'
    | 'targetPagesLongPress'
    | 'usedStates'
>;

/** Position eines Knotens (linke obere Ecke) */
export interface Point {
    x: number;
    y: number;
}

/** Größe eines Knotens in Pixeln */
export interface NodeSize {
    width: number;
    height: number;
}

/** Knotengrößen nach Knoten-Id - fehlende werden geschätzt, siehe {@link estimateNodeSize} */
export type NodeSizes = ReadonlyMap<string, NodeSize>;

/** Positionen nach Knoten-Id */
export type Positions = Record<string, Point>;

/** Ausrichtung einer Seite zu ihren Unterseiten */
export type ParentAlign = 'top' | 'center';

/** Abstände und Schalter des Layouts */
export interface AutoLayoutOptions {
    /** Waagrechter Abstand zwischen zwei Spalten */
    hGap: number;
    /** Senkrechter Abstand zwischen zwei Seiten einer prev/next-Kette */
    vGap: number;
    /** Senkrechter Abstand zwischen zwei Teilbäumen in derselben Spalte */
    groupGap: number;
    /** Senkrechter Abstand zwischen zwei Datenpunkt-Knoten */
    stateGap: number;
    /** Abstand der äußeren Datenpunkt-Spalte von der rechtesten Seite */
    stateColumnGap: number;
    /** Abstand des Bereichs der nicht erreichbaren Seiten unter dem Hauptbaum */
    orphanGap: number;
    /** Waagrechter Abstand zwischen zwei Bändern */
    bandGap: number;
    /**
     * Ausrichtung einer Seite ab Spalte 1 zu ihren Unterseiten: `top` = oben bündig mit der ersten
     * Unterseite, `center` = mittig zum Block der Unterseiten. Die Hauptkette steht immer oben bündig.
     */
    parentAlign: ParentAlign;
    /** Bänder verwenden (große Konfigurationen) */
    bands: boolean;
    /** Bänder erst ab so vielen sichtbaren Seiten */
    bandMinPages: number;
    /** Angestrebtes Verhältnis Breite/Höhe der Bänder */
    bandAspect: number;
    /** Eingeklappte Seiten: ihre Nachkommen werden nicht angeordnet */
    collapsed: ReadonlySet<string>;
}

/**
 * Voreinstellung der Abstände. Die Werte stammen aus dem Prototyp und sollen später am laufenden
 * Admin feinjustiert werden - deshalb an einer Stelle gesammelt.
 */
export const AUTO_LAYOUT_DEFAULTS: Readonly<AutoLayoutOptions> = {
    hGap: 70,
    vGap: 36,
    groupGap: 24,
    stateGap: 6,
    stateColumnGap: 105,
    orphanGap: 90,
    bandGap: 140,
    parentAlign: 'center',
    bands: true,
    bandMinPages: 60,
    bandAspect: 1.6,
    collapsed: new Set<string>(),
};

/** Ab so vielen Seiten werden die home-Verbindungen zu `main` standardmäßig ausgeblendet */
export const HOME_EDGES_HIDDEN_FROM_PAGES = 60;

/** Geschätzte Höhe einer Seite (body2-Zeile + Innenabstand + Rahmen) */
const PAGE_HEIGHT = 40;
/** Mindestbreite einer Seite (min-width 80 + Innenabstand 16 + Rahmen 4) */
const PAGE_MIN_WIDTH = 100;
/** Geschätzte Breite eines Zeichens der Seitenbeschriftung */
const PAGE_CHAR_WIDTH = 7.5;
/** Größte Breite eines Datenpunkt-Knotens (max-width 190 in NavigationView.css) */
const STATE_MAX_WIDTH = 190;
/** Kleinste Breite eines Datenpunkt-Knotens (min-width 60 + Innenabstand + Rahmen) */
const STATE_MIN_WIDTH = 76;
/** Geschätzte Breite eines Zeichens der Datenpunkt-Beschriftung (10 px) */
const STATE_CHAR_WIDTH = 5.6;
/** Innenabstand + Rahmen eines Datenpunkt-Knotens, waagrecht */
const STATE_PADDING_X = 16;
/** Zeilenhöhe eines Datenpunkt-Knotens */
const STATE_LINE_HEIGHT = 13;
/** Innenabstand + Rahmen eines Datenpunkt-Knotens, senkrecht */
const STATE_PADDING_Y = 8;

/**
 * Schätzt die Größe eines Knotens, solange React Flow ihn nicht vermessen hat (z. B. ausgeblendete
 * Knoten oder beim ersten Laden).
 *
 * @param entry Eintrag des Knotens.
 * @returns Die geschätzte Größe.
 */
export function estimateNodeSize(entry: Pick<LayoutEntry, 'page' | 'label' | 'nodeType'> | undefined): NodeSize {
    const label = entry ? entry.label || entry.page : '';
    if (entry?.nodeType === 'stateRef') {
        const text = label.length * STATE_CHAR_WIDTH;
        const width = Math.min(STATE_MAX_WIDTH, Math.max(STATE_MIN_WIDTH, Math.ceil(text + STATE_PADDING_X)));
        const lines = Math.max(1, Math.ceil(text / (STATE_MAX_WIDTH - STATE_PADDING_X)));
        return { width, height: lines * STATE_LINE_HEIGHT + STATE_PADDING_Y };
    }
    return { width: Math.max(PAGE_MIN_WIDTH, Math.round(label.length * PAGE_CHAR_WIDTH + 20)), height: PAGE_HEIGHT };
}

/** Eine prev/next-Kette - steht im Layout als senkrechte Spalte */
export interface LayoutChain {
    nodes: string[];
}

/** Eine Unterkette, die an einer Seite hängt */
export interface LayoutChild {
    chain: LayoutChain;
    /** Seite der Kette, auf die verwiesen wird - sie wird an der verweisenden Seite ausgerichtet */
    entry: string;
}

/** Baum des Layouts: wer hängt woran, unabhängig von Positionen */
export interface LayoutTree {
    /** Wurzel des Hauptbaums (`main`, sonst die erste Seite) */
    root: string | undefined;
    /** Seiten in Map-Reihenfolge */
    pages: string[];
    /** Datenpunkt-Knoten in Map-Reihenfolge */
    states: string[];
    /** Kette jeder Seite */
    chainOf: Map<string, LayoutChain>;
    /** Unterketten jeder Seite, in der Reihenfolge ihrer Verweise */
    kids: Map<string, LayoutChild[]>;
    /** Wurzelketten: zuerst die des Hauptbaums, dann die der nicht erreichbaren Bäume */
    trees: LayoutChain[];
    /** Seiten, die einen Datenpunkt-Knoten nutzen oder auf ihn verweisen, in Map-Reihenfolge */
    stateUsers: Map<string, string[]>;
}

/** Verweis von einer Seite auf eine andere, aus dem sich die Baumstruktur ergibt */
interface LayoutRef {
    from: string;
    to: string;
    kind: 'target' | 'longPress' | 'parent' | 'step';
    /** Reihenfolge: erst alle targetPages, dann long press, parent, prev/next - je in Map-Reihenfolge */
    order: number;
}

/**
 * Ermittelt Ketten und Baumstruktur der Navigation.
 *
 * @param map Navigation-Map (Seiten und Datenpunkt-Knoten).
 * @returns Der Baum des Layouts.
 */
export function buildLayoutTree(map: readonly LayoutEntry[]): LayoutTree {
    const by = new Map<string, LayoutEntry>(map.map(e => [e.page, e]));
    const isPage = (id: string | undefined): id is string => !!id && by.has(id) && by.get(id)?.nodeType !== 'stateRef';
    const pageEntries = map.filter(e => e.nodeType !== 'stateRef');
    const pages = pageEntries.map(e => e.page);
    const states = map.filter(e => e.nodeType === 'stateRef').map(e => e.page);
    const root = isPage('main') ? 'main' : pages[0];
    const tree: LayoutTree = {
        root,
        pages,
        states,
        chainOf: new Map(),
        kids: new Map(),
        trees: [],
        stateUsers: new Map(),
    };

    // ---- Datenpunkt-Knoten: Seiten, die sie nutzen
    const isState = (id: string): boolean => by.get(id)?.nodeType === 'stateRef';
    for (const e of pageEntries) {
        for (const s of [...(e.usedStates ?? []), ...(e.targetPages ?? []), ...(e.targetPagesLongPress ?? [])]) {
            if (!isState(s)) {
                continue;
            }
            const users = tree.stateUsers.get(s) ?? [];
            if (!users.includes(e.page)) {
                users.push(e.page);
            }
            tree.stateUsers.set(s, users);
        }
    }
    if (!root) {
        return tree;
    }

    // ---- 1. Kettenglieder: jede Seite hat höchstens einen Nachfolger (darunter) und einen Vorgänger
    const succ = new Map<string, string>();
    const pred = new Map<string, string>();
    const link = (a: string, b: string): void => {
        if (a === b || succ.has(a) || pred.has(b)) {
            return;
        }
        succ.set(a, b);
        pred.set(b, a);
    };
    // gegenseitige Paare zuerst, dann einseitige next, dann einseitige prev
    for (const e of pageEntries) {
        if (isPage(e.next) && by.get(e.next)?.prev === e.page) {
            link(e.page, e.next);
        }
    }
    for (const e of pageEntries) {
        if (isPage(e.next)) {
            link(e.page, e.next);
        }
    }
    for (const e of pageEntries) {
        if (isPage(e.prev)) {
            link(e.prev, e.page);
        }
    }

    // ---- 2. Verweise, aus denen sich ergibt, wer unter wem hängt
    const rawRefs: LayoutRef[] = [];
    const addRef = (from: string | undefined, to: string | undefined, kind: LayoutRef['kind']): void => {
        if (isPage(from) && isPage(to) && from !== to) {
            rawRefs.push({ from, to, kind, order: rawRefs.length });
        }
    };
    for (const e of pageEntries) {
        for (const t of e.targetPages ?? []) {
            addRef(e.page, t, 'target');
        }
    }
    for (const e of pageEntries) {
        for (const t of e.targetPagesLongPress ?? []) {
            addRef(e.page, t, 'longPress');
        }
    }
    for (const e of pageEntries) {
        addRef(e.parent, e.page, 'parent');
    }
    for (const e of pageEntries) {
        if (e.prev && succ.get(e.prev) !== e.page) {
            addRef(e.prev, e.page, 'step');
        }
        if (e.next && pred.get(e.next) !== e.page) {
            addRef(e.page, e.next, 'step');
        }
    }
    const enteredFromOutside = new Set(rawRefs.map(r => r.to));

    // ---- 3. Ketten, Ringe an sinnvoller Stelle aufgebrochen
    const chains: LayoutChain[] = [];
    const walk = (start: string): void => {
        const nodes: string[] = [];
        let cur: string | undefined = start;
        while (cur && !tree.chainOf.has(cur) && !nodes.includes(cur)) {
            nodes.push(cur);
            cur = succ.get(cur);
        }
        const chain: LayoutChain = { nodes };
        chains.push(chain);
        for (const n of nodes) {
            tree.chainOf.set(n, chain);
        }
    };
    const ringStart = (p: string): string => {
        const ring: string[] = [];
        let cur: string | undefined = p;
        while (cur && !ring.includes(cur)) {
            ring.push(cur);
            cur = succ.get(cur);
        }
        if (ring.includes(root)) {
            return root;
        }
        return ring.find(n => enteredFromOutside.has(n)) ?? ring.find(n => by.get(n)?.parent) ?? ring[0];
    };
    if (!pred.has(root)) {
        walk(root);
    }
    for (const p of pages) {
        if (!pred.has(p) && !tree.chainOf.has(p)) {
            walk(p);
        }
    }
    if (!tree.chainOf.has(root)) {
        walk(ringStart(root));
    }
    for (const p of pages) {
        if (!tree.chainOf.has(p)) {
            walk(ringStart(p));
        }
    }
    const chainOf = (id: string): LayoutChain => tree.chainOf.get(id)!;

    // Verweise zwischen verschiedenen Ketten, je Zielkette
    const refsInto = new Map<LayoutChain, LayoutRef[]>();
    for (const r of rawRefs) {
        const target = chainOf(r.to);
        if (chainOf(r.from) === target) {
            continue;
        }
        const list = refsInto.get(target) ?? [];
        list.push(r);
        refsInto.set(target, list);
    }
    /**
     * Rang eines Verweises, kleiner ist besser: targetPages der als parent eingetragenen Seite vor
     * anderen targetPages, dann long press, dann parent allein, dann prev/next in eine andere Kette.
     *
     * @param r Der Verweis.
     * @returns Der Rang.
     */
    const rank = (r: LayoutRef): number => {
        const isTarget = r.kind === 'target' || r.kind === 'longPress';
        if (isTarget && by.get(r.to)?.parent === r.from) {
            return r.kind === 'target' ? 0 : 1;
        }
        return { target: 2, longPress: 3, parent: 4, step: 5 }[r.kind];
    };
    const better = (a: LayoutRef, b: LayoutRef | undefined): boolean =>
        !b || rank(a) < rank(b) || (rank(a) === rank(b) && a.order < b.order);
    const best = (k: LayoutChain, onlyFrom?: ReadonlySet<LayoutChain>): LayoutRef | undefined => {
        let found: LayoutRef | undefined;
        for (const r of refsInto.get(k) ?? []) {
            if ((!onlyFrom || onlyFrom.has(chainOf(r.from))) && better(r, found)) {
                found = r;
            }
        }
        return found;
    };

    // ---- 4. Ketten anhängen: bevorzugter Verweis zuerst, Zyklen an der besten Stelle aufbrechen
    const attached = new Set<LayoutChain>();
    const kidRef = new Map<LayoutChain, LayoutRef>();
    const attach = (k: LayoutChain, r: LayoutRef | undefined): void => {
        attached.add(k);
        if (r) {
            kidRef.set(k, r);
        } else {
            tree.trees.push(k);
        }
    };
    /**
     * Wohin führt die Kette der bevorzugten Verweise von `k` aus? `dead` = zu einer Kette ohne
     * Verweise, `cycle` = `k` liegt selbst auf einem Zyklus, `into` = sie läuft in einen Zyklus.
     *
     * @param k Die Kette.
     * @returns Wo der Weg endet.
     */
    const prefPathEnd = (k: LayoutChain): 'dead' | 'cycle' | 'into' => {
        const seen = new Set<LayoutChain>([k]);
        let cur = k;
        for (;;) {
            const r = best(cur);
            if (!r) {
                return 'dead';
            }
            const next = chainOf(r.from);
            if (next === k) {
                return 'cycle';
            }
            if (seen.has(next) || attached.has(next)) {
                return 'into';
            }
            seen.add(next);
            cur = next;
        }
    };
    const grow = (): void => {
        for (;;) {
            let changed = false;
            for (const k of chains) {
                if (attached.has(k)) {
                    continue;
                }
                const r = best(k);
                if (r && attached.has(chainOf(r.from))) {
                    attach(k, r);
                    changed = true;
                }
            }
            if (changed) {
                continue;
            }
            // Kein bevorzugter Verweis führt mehr weiter: die beste Ausweichstelle nehmen - bevorzugt
            // an einer Kette, deren bevorzugter Weg ins Leere oder im Kreis läuft
            let pick: { k: LayoutChain; r: LayoutRef; strong: boolean } | undefined;
            for (const k of chains) {
                if (attached.has(k)) {
                    continue;
                }
                const r = best(k, attached);
                if (!r) {
                    continue;
                }
                const strong = prefPathEnd(k) !== 'into';
                if (!pick || (strong && !pick.strong) || (strong === pick.strong && better(r, pick.r))) {
                    pick = { k, r, strong };
                }
            }
            if (!pick) {
                return;
            }
            attach(pick.k, pick.r);
        }
    };
    attach(chainOf(root), undefined);
    grow();
    // nicht erreichbare Bäume: Wurzel ist eine Kette, auf die keine noch freie Kette verweist
    for (;;) {
        const free = chains.filter(k => !attached.has(k));
        if (!free.length) {
            break;
        }
        const freeSet = new Set(free);
        const start = free.find(k => !(refsInto.get(k) ?? []).some(r => freeSet.has(chainOf(r.from)))) ?? free[0];
        attach(start, undefined);
        grow();
    }
    // Unterketten je Seite in der Reihenfolge ihrer Verweise
    const sorted = [...kidRef.entries()].sort((a, b) => a[1].order - b[1].order);
    for (const [k, r] of sorted) {
        const list = tree.kids.get(r.from) ?? [];
        list.push({ chain: k, entry: r.to });
        tree.kids.set(r.from, list);
    }
    return tree;
}

/**
 * Alle Nachkommen einer Seite im Baum des Layouts - das, was beim Einklappen verschwindet.
 *
 * @param tree Baum des Layouts.
 * @param page Die Seite.
 * @returns Die Seiten des Unterbaums, ohne die Seite selbst.
 */
export function subtreeOf(tree: LayoutTree, page: string): string[] {
    const out: string[] = [];
    const rec = (p: string): void => {
        for (const kid of tree.kids.get(p) ?? []) {
            for (const n of kid.chain.nodes) {
                out.push(n);
                rec(n);
            }
        }
    };
    rec(page);
    return out;
}

/**
 * Knoten, die wegen eingeklappter Unterbäume nicht zu sehen sind: die Nachkommen der eingeklappten
 * Seiten und die Datenpunkt-Knoten, die nur von solchen Seiten genutzt werden.
 *
 * @param tree Baum des Layouts.
 * @param collapsed Eingeklappte Seiten.
 * @returns Die verborgenen Knoten.
 */
export function hiddenByCollapse(tree: LayoutTree, collapsed: ReadonlySet<string>): Set<string> {
    const hidden = new Set<string>();
    for (const page of collapsed) {
        if (hidden.has(page)) {
            continue;
        }
        for (const n of subtreeOf(tree, page)) {
            hidden.add(n);
        }
    }
    if (hidden.size) {
        for (const [state, users] of tree.stateUsers) {
            if (users.every(u => hidden.has(u))) {
                hidden.add(state);
            }
        }
    }
    return hidden;
}

/**
 * Seiten, die ohne gespeicherten Einklapp-Zustand eingeklappt sind: der Service-Teilbaum unter
 * `///unlock` (bzw. unter `///Overview`, falls `///unlock` keine Unterseiten hat).
 *
 * @param tree Baum des Layouts.
 * @returns Die einzuklappenden Seiten.
 */
export function defaultCollapsed(tree: LayoutTree): string[] {
    for (const page of [servicePageName, '///Overview']) {
        if (tree.kids.get(page)?.length) {
            return [page];
        }
    }
    return [];
}

/**
 * Anzahl der Seiten einer Map (ohne Datenpunkt-Knoten).
 *
 * @param map Navigation-Map.
 * @returns Die Anzahl.
 */
export function countPages(map: readonly LayoutEntry[]): number {
    return map.filter(e => e.nodeType !== 'stateRef').length;
}

// ---------------------------------------------------------------------------------------------
// Anordnung
// ---------------------------------------------------------------------------------------------

/** Ein angeordneter Teilbaum mit relativen Höhen und seiner Kontur je Spalte */
interface Shape {
    y: Map<string, number>;
    depth: Map<string, number>;
    top: Map<number, number>;
    bottom: Map<number, number>;
}

const emptyShape = (): Shape => ({ y: new Map(), depth: new Map(), top: new Map(), bottom: new Map() });

/** Gemeinsame Werkzeuge der Anordnung für eine Map */
class Arranger {
    readonly by: Map<string, LayoutEntry>;
    readonly hidden: Set<string>;

    constructor(
        readonly map: readonly LayoutEntry[],
        readonly tree: LayoutTree,
        readonly sizes: NodeSizes,
        readonly o: AutoLayoutOptions,
    ) {
        this.by = new Map(map.map(e => [e.page, e]));
        this.hidden = hiddenByCollapse(tree, o.collapsed);
    }

    size(id: string): NodeSize {
        return this.sizes.get(id) ?? estimateNodeSize(this.by.get(id));
    }

    kidsOf(page: string): LayoutChild[] {
        if (this.o.collapsed.has(page) || this.hidden.has(page)) {
            return [];
        }
        return this.tree.kids.get(page) ?? [];
    }

    add(s: Shape, id: string, depth: number, y: number): void {
        s.y.set(id, y);
        s.depth.set(id, depth);
        const h = this.size(id).height;
        s.top.set(depth, Math.min(s.top.get(depth) ?? Infinity, y));
        s.bottom.set(depth, Math.max(s.bottom.get(depth) ?? -Infinity, y + h));
    }

    merge(target: Shape, src: Shape, dy: number): void {
        for (const [id, y] of src.y) {
            this.add(target, id, src.depth.get(id)!, y + dy);
        }
    }

    /**
     * Kleinste Verschiebung von `s`, mit der es in jeder gemeinsamen Spalte unter `acc` liegt.
     *
     * @param acc Bereits belegte Kontur.
     * @param s Die zu platzierende Form.
     * @param gap Abstand je Spalte.
     * @returns Die Verschiebung, `-Infinity` wenn sich keine Spalte überschneidet.
     */
    clearance(acc: Shape, s: Shape, gap: (depth: number) => number): number {
        let need = -Infinity;
        for (const [d, top] of s.top) {
            const bottom = acc.bottom.get(d);
            if (bottom !== undefined) {
                need = Math.max(need, bottom + gap(d) - top);
            }
        }
        return need;
    }

    /**
     * Ordnet eine Kette mit allen Unterketten an.
     *
     * @param chain Die Kette.
     * @param depth Spalte der Kette.
     * @returns Die Form mit relativen Höhen.
     */
    layoutChain(chain: LayoutChain, depth: number): Shape {
        const s = emptyShape();
        let prevBottom: number | undefined;
        const groupGap = (): number => this.o.groupGap;
        for (const id of chain.nodes) {
            if (this.hidden.has(id)) {
                continue;
            }
            const h = this.size(id).height;
            let y = prevBottom === undefined ? 0 : prevBottom + this.o.vGap;
            const kids = this.kidsOf(id).filter(k => !this.hidden.has(k.entry));
            let group: Shape | undefined;
            let anchor = 0;
            if (kids.length) {
                group = emptyShape();
                let firstTop = 0;
                let lastBottom = 0;
                kids.forEach((kid, i) => {
                    const ks = this.layoutChain(kid.chain, depth + 1);
                    const off =
                        i === 0
                            ? 0
                            : Math.max(
                                  this.clearance(group!, ks, groupGap),
                                  lastBottom + this.o.groupGap - ks.y.get(kid.entry)!,
                              );
                    this.merge(group!, ks, off);
                    const entryY = off + ks.y.get(kid.entry)!;
                    if (i === 0) {
                        firstTop = entryY;
                    }
                    lastBottom = entryY + this.size(kid.entry).height;
                });
                // Position der Seite relativ zur Gruppe. Die Hauptkette steht oben bündig mit ihrer
                // Gruppe - so ragt nichts über `main` hinaus.
                if (depth === 0) {
                    anchor = Math.min(...group.top.values());
                } else {
                    anchor = this.o.parentAlign === 'top' ? firstTop : (firstTop + lastBottom - h) / 2;
                }
                // Gruppe darf vorherige Gruppen dieser Kette nicht überlappen
                const need = this.clearance(s, group, groupGap);
                if (need > -Infinity) {
                    y = Math.max(y, need + anchor);
                }
            }
            this.add(s, id, depth, y);
            if (group) {
                this.merge(s, group, y - anchor);
            }
            prevBottom = y + h;
        }
        return s;
    }

    /**
     * Breite jeder Spalte einer Form.
     *
     * @param shapes Formen, die dieselben Spalten nutzen.
     * @returns Spaltenbreite je Spalte.
     */
    columnWidths(shapes: Shape[]): Map<number, number> {
        const w = new Map<number, number>();
        for (const s of shapes) {
            for (const [id, d] of s.depth) {
                w.set(d, Math.max(w.get(d) ?? 0, this.size(id).width));
            }
        }
        return w;
    }

    /**
     * Linke Kante jeder Spalte, ab Spalte `fromDepth` bei 0.
     *
     * @param widths Spaltenbreiten.
     * @param fromDepth Erste Spalte.
     * @returns Linke Kante je Spalte.
     */
    columnX(widths: Map<number, number>, fromDepth: number): Map<number, number> {
        const xs = new Map<number, number>();
        const maxD = Math.max(fromDepth, ...widths.keys());
        let x = 0;
        for (let d = fromDepth; d <= maxD; d++) {
            xs.set(d, x);
            x += (widths.get(d) ?? 0) + this.o.hGap;
        }
        return xs;
    }

    /**
     * Schreibt eine Form als Positionen.
     *
     * @param s Die Form.
     * @param x0 Linke Kante.
     * @param y0 Obere Kante (für relative Höhe 0).
     * @param widths Spaltenbreiten.
     * @param xs Linke Kante je Spalte.
     * @param out Ziel.
     * @returns Rechte und untere Kante.
     */
    emit(
        s: Shape,
        x0: number,
        y0: number,
        widths: Map<number, number>,
        xs: Map<number, number>,
        out: Positions,
    ): { right: number; bottom: number } {
        let right = x0;
        let bottom = y0;
        for (const [id, y] of s.y) {
            const d = s.depth.get(id)!;
            const size = this.size(id);
            const x = x0 + xs.get(d)! + ((widths.get(d) ?? size.width) - size.width) / 2;
            out[id] = { x: Math.round(x), y: Math.round(y0 + y) };
            right = Math.max(right, x + size.width);
            bottom = Math.max(bottom, y0 + y + size.height);
        }
        return { right, bottom };
    }

    /**
     * Ordnet einen Baum ab (x0, y0) an.
     *
     * @param root Wurzelkette.
     * @param x0 Linke Kante.
     * @param y0 Obere Kante.
     * @param out Ziel.
     * @returns Rechte und untere Kante.
     */
    placeTree(root: LayoutChain, x0: number, y0: number, out: Positions): { right: number; bottom: number } {
        const s = this.layoutChain(root, 0);
        const minY = Math.min(0, ...s.top.values());
        const widths = this.columnWidths([s]);
        return this.emit(s, x0, y0 - minY, widths, this.columnX(widths, 0), out);
    }

    /**
     * Hauptbaum auf Bänder verteilen.
     *
     * @param root Wurzelkette des Hauptbaums.
     * @param width Breite des Hauptbaums ohne Bänder.
     * @param height Höhe des Hauptbaums ohne Bänder.
     * @param out Ziel, wird für den Hauptbaum neu geschrieben.
     * @returns Rechte und untere Kante.
     */
    placeBands(root: LayoutChain, width: number, height: number, out: Positions): { right: number; bottom: number } {
        const bands = Math.max(2, Math.round(Math.sqrt((height * this.o.bandAspect) / width)));
        const bandH = height / bands;
        // Abschnitte: je Seite der Hauptkette mit ihrem Unterbaum, zu hohe zerlegt in Kopf + Teilbäume
        interface Item {
            shape: Shape;
            header?: string;
        }
        // Kopf-Seiten und unzerlegte Abschnitte zuerst, damit die Hauptkette beisammen bleibt
        // (z. B. `///unlock` direkt unter `main`); die Teilbäume der zerlegten folgen danach
        const items: Item[] = [];
        const subItems: Item[] = [];
        const heightOf = (s: Shape): number => Math.max(...s.bottom.values()) - Math.min(...s.top.values());
        const normalized = (s: Shape): Shape => {
            const minY = Math.min(...s.top.values());
            const n = emptyShape();
            this.merge(n, s, -minY);
            return n;
        };
        for (const id of root.nodes) {
            if (this.hidden.has(id)) {
                continue;
            }
            const slab = this.layoutChain({ nodes: [id] }, 0);
            const kids = this.kidsOf(id);
            if (heightOf(slab) <= bandH || !kids.length) {
                items.push({ shape: normalized(slab) });
                continue;
            }
            const head = emptyShape();
            this.add(head, id, 0, 0);
            items.push({ shape: head });
            for (const kid of kids) {
                subItems.push({ shape: normalized(this.layoutChain(kid.chain, 1)), header: id });
            }
        }
        items.push(...subItems);
        const gap = (d: number): number => (d === 0 ? this.o.vGap : this.o.groupGap);
        const placed: { item: Item; band: number; dy: number }[] = [];
        let band = 0;
        let acc = emptyShape();
        const headerY = new Map<string, { band: number; y: number }>();
        for (const item of items) {
            const head = item.header ? headerY.get(item.header) : undefined;
            const minY = head && head.band === band ? head.y : 0;
            let dy = Math.max(minY, this.clearance(acc, item.shape, gap));
            if (dy + heightOf(item.shape) > bandH && acc.y.size) {
                band++;
                acc = emptyShape();
                dy = 0;
            }
            this.merge(acc, item.shape, dy);
            placed.push({ item, band, dy });
            if (!item.header) {
                const id = [...item.shape.y.keys()][0];
                headerY.set(id, { band, y: dy });
            }
        }
        // Spalten: gemeinsame Breiten, jedes Band beginnt mit seiner ersten belegten Spalte
        const widths = this.columnWidths(items.map(i => i.shape));
        const xs = this.columnX(widths, 0);
        for (const id of Object.keys(out)) {
            if (this.isInShapes(id, items)) {
                delete out[id];
            }
        }
        let bandX = 0;
        let right = 0;
        let bottom = 0;
        for (let b = 0; b <= band; b++) {
            const inBand = placed.filter(p => p.band === b);
            if (!inBand.length) {
                continue;
            }
            const minD = Math.min(...inBand.flatMap(p => [...p.item.shape.depth.values()]));
            let bandRight = bandX;
            for (const p of inBand) {
                const shifted = new Map([...xs].map(([d, x]) => [d, x - xs.get(minD)!]));
                const bb = this.emit(p.item.shape, bandX, p.dy, widths, shifted, out);
                bandRight = Math.max(bandRight, bb.right);
                bottom = Math.max(bottom, bb.bottom);
            }
            right = Math.max(right, bandRight);
            bandX = bandRight + this.o.bandGap;
        }
        return { right, bottom };
    }

    private isInShapes(id: string, items: { shape: Shape }[]): boolean {
        return items.some(i => i.shape.y.has(id));
    }

    /**
     * Datenpunkt-Knoten in eine äußere Spalte rechts, je auf Höhe der ersten sichtbaren Seite, die
     * sie nutzt. Knoten ohne angeordnete Seite kommen in eine Reihe unter alles andere.
     *
     * @param ids Die anzuordnenden Datenpunkt-Knoten.
     * @param rects Belegte Flächen (Seiten und bereits platzierte Datenpunkte).
     * @param pos Positionen der Seiten (für die Höhe der nutzenden Seite).
     * @param columnX Linke Kante der Datenpunkt-Spalte.
     * @param out Ziel.
     */
    placeStates(ids: string[], rects: Rect[], pos: Positions, columnX: number, out: Positions): void {
        const owner = (s: string): string | undefined =>
            (this.tree.stateUsers.get(s) ?? []).find(p => pos[p] && !this.hidden.has(p));
        const withOwner = ids
            .filter(s => owner(s))
            .sort((a, b) => pos[owner(a)!].y - pos[owner(b)!].y || ids.indexOf(a) - ids.indexOf(b));
        for (const s of withOwner) {
            const size = this.size(s);
            const y = findFreeY(rects, columnX, size.width, size.height, pos[owner(s)!].y, this.o.stateGap);
            out[s] = { x: Math.round(columnX), y: Math.round(y) };
            rects.push({ x: columnX, y, w: size.width, h: size.height });
        }
        const rest = ids.filter(s => !owner(s));
        if (!rest.length) {
            return;
        }
        let maxY = 0;
        let minX = Infinity;
        for (const r of rects) {
            maxY = Math.max(maxY, r.y + r.h);
            minX = Math.min(minX, r.x);
        }
        let x = Number.isFinite(minX) ? minX : 0;
        for (const s of rest) {
            const size = this.size(s);
            out[s] = { x: Math.round(x), y: Math.round(maxY + this.o.orphanGap / 2) };
            x += size.width + 20;
        }
    }

    rectOf(id: string, p: Point): Rect {
        const s = this.size(id);
        return { x: p.x, y: p.y, w: s.width, h: s.height };
    }

    isState(id: string): boolean {
        return this.by.get(id)?.nodeType === 'stateRef';
    }
}

/** Belegte Fläche */
interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * Erste freie Höhe ab `y0` für eine Fläche an `x`, ohne eine der belegten Flächen zu überlappen.
 *
 * @param rects Belegte Flächen.
 * @param x Linke Kante.
 * @param w Breite.
 * @param h Höhe.
 * @param y0 Gewünschte Höhe.
 * @param gap Senkrechter Mindestabstand.
 * @returns Die freie Höhe (>= y0).
 */
function findFreeY(rects: readonly Rect[], x: number, w: number, h: number, y0: number, gap: number): number {
    const margin = 8;
    const column = rects.filter(r => r.x < x + w + margin && r.x + r.w + margin > x).sort((a, b) => a.y - b.y);
    let y = y0;
    let moved = true;
    while (moved) {
        moved = false;
        for (const r of column) {
            if (r.y < y + h + gap && r.y + r.h + gap > y) {
                y = r.y + r.h + gap;
                moved = true;
            }
        }
    }
    return y;
}

const withDefaults = (options: Partial<AutoLayoutOptions>): AutoLayoutOptions => ({
    ...AUTO_LAYOUT_DEFAULTS,
    ...options,
});

/**
 * Ordnet alle Knoten neu an ("Alles neu anordnen").
 *
 * @param map Navigation-Map.
 * @param sizes Gemessene Knotengrößen; fehlende werden geschätzt.
 * @param options Abstände, Ausrichtung, eingeklappte Seiten.
 * @param tree Bereits ermittelter Baum der Map (sonst wird er berechnet).
 * @returns Positionen aller sichtbaren Knoten; Knoten in eingeklappten Unterbäumen fehlen.
 */
export function computeAutoLayout(
    map: readonly LayoutEntry[],
    sizes: NodeSizes,
    options: Partial<AutoLayoutOptions> = {},
    tree: LayoutTree = buildLayoutTree(map),
): Positions {
    const a = new Arranger(map, tree, sizes, withDefaults(options));
    const out: Positions = {};
    const [main, ...orphans] = tree.trees;
    if (!main) {
        a.placeStates(
            tree.states.filter(s => !a.hidden.has(s)),
            [],
            out,
            0,
            out,
        );
        return out;
    }
    let bb = a.placeTree(main, 0, 0, out);
    const visiblePages = tree.pages.filter(p => !a.hidden.has(p)).length;
    if (a.o.bands && visiblePages >= a.o.bandMinPages && bb.bottom > 0 && bb.right / bb.bottom < a.o.bandAspect / 2) {
        bb = a.placeBands(main, bb.right, bb.bottom, out);
    }
    // nicht erreichbare Bäume in Reihen darunter, umbrechend bei der Breite des Hauptbaums
    const wrap = Math.max(bb.right, 600);
    let x = 0;
    let y = bb.bottom + a.o.orphanGap;
    let rowBottom = y;
    let pagesRight = bb.right;
    for (const root of orphans) {
        if (root.nodes.every(n => a.hidden.has(n))) {
            continue;
        }
        const trial: Positions = {};
        let tb = a.placeTree(root, x, y, trial);
        if (x > 0 && tb.right > wrap) {
            x = 0;
            y = rowBottom + a.o.orphanGap / 2;
            for (const k of Object.keys(trial)) {
                delete trial[k];
            }
            tb = a.placeTree(root, x, y, trial);
        }
        Object.assign(out, trial);
        x = tb.right + a.o.hGap;
        rowBottom = Math.max(rowBottom, tb.bottom);
        pagesRight = Math.max(pagesRight, tb.right);
    }
    const rects = Object.keys(out).map(id => a.rectOf(id, out[id]));
    a.placeStates(
        tree.states.filter(s => !a.hidden.has(s)),
        rects,
        out,
        pagesRight + a.o.stateColumnGap,
        out,
    );
    return out;
}

/**
 * Platziert nur die Knoten aus `toPlace` ("Nur Knoten ohne Position platzieren"); alle anderen
 * Knoten behalten ihre Position und gelten als belegt.
 *
 * - Eine Seite unter dem Ende ihrer Kette (bzw. über dem Anfang), sonst in die Spalte rechts neben
 *   der Seite, die zu ihr führt - jeweils auf die erste freie Höhe.
 * - Seiten ohne platzierten Bezug werden als eigener Baum im Bereich unter allem angeordnet.
 * - Datenpunkt-Knoten in die äußere Spalte rechts, auf Höhe ihrer Seite.
 *
 * @param map Navigation-Map.
 * @param sizes Gemessene Knotengrößen; fehlende werden geschätzt.
 * @param fixed Positionen der Knoten, die bleiben, wo sie sind.
 * @param toPlace Die zu platzierenden Knoten (ihre bisherige Position zählt nicht).
 * @param options Abstände, eingeklappte Seiten.
 * @param tree Bereits ermittelter Baum der Map.
 * @returns Positionen der platzierten Knoten; Knoten in eingeklappten Unterbäumen fehlen.
 */
export function placeNewNodes(
    map: readonly LayoutEntry[],
    sizes: NodeSizes,
    fixed: Readonly<Positions>,
    toPlace: ReadonlySet<string>,
    options: Partial<AutoLayoutOptions> = {},
    tree: LayoutTree = buildLayoutTree(map),
): Positions {
    const a = new Arranger(map, tree, sizes, withDefaults(options));
    const o = a.o;
    const out: Positions = {};
    const pos: Positions = {};
    const rects: Rect[] = [];
    for (const id of Object.keys(fixed)) {
        if (!toPlace.has(id) && a.by.has(id)) {
            pos[id] = fixed[id];
            rects.push(a.rectOf(id, fixed[id]));
        }
    }
    const put = (id: string, p: Point): void => {
        const r = { x: Math.round(p.x), y: Math.round(p.y) };
        out[id] = r;
        pos[id] = r;
        rects.push(a.rectOf(id, r));
    };

    // Seiten in Baum-Reihenfolge, damit die verweisende Seite vor ihren Unterseiten steht
    const order: string[] = [];
    const ownerOf = new Map<string, string>();
    const queue = [...tree.trees];
    for (let i = 0; i < queue.length; i++) {
        for (const n of queue[i].nodes) {
            order.push(n);
            for (const kid of tree.kids.get(n) ?? []) {
                for (const k of kid.chain.nodes) {
                    ownerOf.set(k, n);
                }
                queue.push(kid.chain);
            }
        }
    }
    const deferred = new Set<string>();
    for (const id of order) {
        if (!toPlace.has(id) || a.hidden.has(id)) {
            continue;
        }
        const size = a.size(id);
        const chain = tree.chainOf.get(id)!;
        const i = chain.nodes.indexOf(id);
        const above = i > 0 ? chain.nodes[i - 1] : undefined;
        const below = i < chain.nodes.length - 1 ? chain.nodes[i + 1] : undefined;
        if (above && pos[above] && !deferred.has(above)) {
            const p = pos[above];
            const x = p.x + (a.size(above).width - size.width) / 2;
            put(id, {
                x,
                y: findFreeY(rects, x, size.width, size.height, p.y + a.size(above).height + o.vGap, o.vGap),
            });
            continue;
        }
        if (below && pos[below] && !toPlace.has(below)) {
            const p = pos[below];
            const x = p.x + (a.size(below).width - size.width) / 2;
            const y0 = p.y - o.vGap - size.height;
            const y = findFreeY(rects, x, size.width, size.height, y0, o.vGap);
            put(id, { x, y: y === y0 ? y0 : findFreeY(rects, x, size.width, size.height, p.y, o.vGap) });
            continue;
        }
        const owner = ownerOf.get(id);
        if (owner && pos[owner] && !deferred.has(owner)) {
            const op = pos[owner];
            // An bereits stehenden Geschwistern ausrichten, sonst eine Spalte rechts der Seite
            const siblings = (tree.kids.get(owner) ?? []).flatMap(k => k.chain.nodes).filter(n => n !== id && pos[n]);
            const x = siblings.length ? Math.min(...siblings.map(n => pos[n].x)) : op.x + a.size(owner).width + o.hGap;
            put(id, { x, y: findFreeY(rects, x, size.width, size.height, op.y, o.groupGap) });
            continue;
        }
        deferred.add(id);
    }
    if (deferred.size) {
        // eigener Baum im Bereich unter allem, was schon steht
        const sub = map.filter(e => deferred.has(e.page));
        const layout = computeAutoLayout(sub, sizes, { ...options, bands: o.bands });
        let maxY = -Infinity;
        let minX = Infinity;
        for (const r of rects) {
            maxY = Math.max(maxY, r.y + r.h);
            minX = Math.min(minX, r.x);
        }
        const dx = Number.isFinite(minX) ? minX : 0;
        const dy = Number.isFinite(maxY) ? maxY + o.orphanGap : 0;
        for (const id of Object.keys(layout)) {
            put(id, { x: layout[id].x + dx, y: layout[id].y + dy });
        }
    }

    // Datenpunkt-Knoten: äußere Spalte - an vorhandenen Datenpunkten ausrichten
    const states = tree.states.filter(s => toPlace.has(s) && !a.hidden.has(s));
    if (states.length) {
        let pagesRight = -Infinity;
        for (const id of Object.keys(pos)) {
            if (!a.isState(id)) {
                pagesRight = Math.max(pagesRight, pos[id].x + a.size(id).width);
            }
        }
        if (!Number.isFinite(pagesRight)) {
            pagesRight = 0;
        }
        const existing = Object.keys(pos).filter(id => a.isState(id) && pos[id].x >= pagesRight);
        const columnX = existing.length ? Math.min(...existing.map(id => pos[id].x)) : pagesRight + o.stateColumnGap;
        a.placeStates(states, rects, pos, columnX, out);
    }
    return out;
}
