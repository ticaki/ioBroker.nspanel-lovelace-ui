/**
 * Constants and small helpers of the navigation flow, shared by the view and its node component.
 */
import type { NavigationMapEntry, PageOrigin } from '../../src/lib/types/adminShareConfig';
import type { NavigationLinkKind } from '../../src/lib/types/navigationEdit';

/** Kantenarten des Navigationsgraphen */
export type EdgeKind =
    'default' | 'prev' | 'next' | 'prevNext' | 'home' | 'parent' | 'target' | 'targetLongPress' | 'state';

/** Feste Farben der Kantenarten - Basis für Legende, Handles, Marker und Kanten */
export const EDGE_COLOR_HEX: Record<EdgeKind, string> = {
    default: '#1976d2',
    prev: '#6676d2',
    next: '#19c3d2',
    prevNext: '#9c27b0', // beidseitige prev/next-Verbindung
    home: '#fbc02d',
    parent: '#d32f2f',
    target: '#43a047',
    targetLongPress: '#fb8c00', // langer Druck auf ein Seitenelement
    state: '#546e7a', // Datenpunkt oder Channel, den die Seite nutzt
};

/** CSS-Variablen der Kantenfarben - erlauben ein Override über das Theme */
export const EDGE_COLOR_VAR: Record<EdgeKind, string> = {
    default: '--edge-color',
    prev: '--edge-prev',
    next: '--edge-next',
    prevNext: '--edge-prev-next',
    home: '--edge-home',
    parent: '--edge-parent',
    target: '--edge-target',
    targetLongPress: '--edge-target-long-press',
    state: '--edge-state',
};

/**
 * Aussehen eines Knotens: die Herkunft der Seite, oder `stateRef` für einen Knoten, der für einen
 * Datenpunkt steht statt für eine Seite.
 */
export type NodeStyle = PageOrigin | 'stateRef';

/**
 * Basisfarbe je Seitenherkunft. Sie wird nicht direkt gezeichnet: der Knoten bekommt sie als
 * Rahmenfarbe und als abgeschwächter Hintergrund, damit die Beschriftung in hellem wie dunklem
 * Theme lesbar bleibt. Seiten aus dem Konfigurationsskript behalten das Aussehen des Themes.
 */
export const NODE_COLOR_HEX: Record<Exclude<NodeStyle, 'script'>, string> = {
    global: '#8e24aa', // violett - Seite aus der globalen Skript-Konfiguration
    admin: '#43a047', // grün
    system: '#f9a825', // gelb
    stateRef: '#546e7a', // blaugrau - kein Seiten-, sondern ein Datenpunkt-Knoten
};

/** CSS-Variablen je Knotenart - vom ThemeVarsProvider passend zum Theme gefüllt */
export const NODE_STYLE_VAR: Record<NodeStyle, { bg: string; border: string }> = {
    script: { bg: '--node-bg', border: '--node-border' },
    global: { bg: '--node-global-bg', border: '--node-global-border' },
    admin: { bg: '--node-admin-bg', border: '--node-admin-border' },
    system: { bg: '--node-system-bg', border: '--node-system-border' },
    stateRef: { bg: '--node-state-ref-bg', border: '--node-state-ref-border' },
};

/** Alle Knotenarten in der Reihenfolge der Legende */
export const NODE_STYLES: NodeStyle[] = ['script', 'global', 'admin', 'system', 'stateRef'];

/** Übersetzungsschlüssel der Knotenarten für die Legende */
export const NODE_STYLE_LABEL_KEY: Record<NodeStyle, string> = {
    script: 'nav_legend_origin_script',
    global: 'nav_legend_origin_global',
    admin: 'nav_legend_origin_admin',
    system: 'nav_legend_origin_system',
    stateRef: 'nav_legend_state_ref',
};

/**
 * Knotenart eines Eintrags - ein Datenpunkt-Knoten steht für keine Seite und hat daher keine Herkunft
 *
 * @param entry Eintrag der Navigationskarte
 */
export function nodeStyleOf(entry: NavigationMapEntry | undefined): NodeStyle {
    if (entry?.nodeType === 'stateRef') {
        return 'stateRef';
    }
    return entry?.origin ?? 'script';
}

/** Kantenarten mit fester Farbe - unabhängig vom Admin-Theme */
export const STATIC_EDGE_KINDS: EdgeKind[] = [
    'prev',
    'next',
    'prevNext',
    'home',
    'parent',
    'target',
    'targetLongPress',
    'state',
];

/** Zuordnung Handle -> Kantenart, für die Einfärbung der Handles am Knoten */
export const HANDLE_EDGE_KIND: Record<string, EdgeKind> = {
    prev: 'prev',
    next: 'next',
    homeTopLeft: 'home',
    homeTopRight: 'home',
    parentBottomLeft: 'parent',
    parentBottomRight: 'parent',
    targetRight: 'target',
    targetLeft: 'target',
};

/**
 * Handles, über die ein Navigationsverweis gezeichnet wird: das Quell-Handle an der Seite, die den
 * Verweis trägt, das Ziel-Handle an der Seite, auf die er zeigt. Im Bearbeitungsmodus bestimmt
 * das Quell-Handle, welcher Verweis gesetzt wird.
 */
export const LINK_HANDLES: Record<NavigationLinkKind, { source: string; target: string }> = {
    prev: { source: 'prev', target: 'next' },
    next: { source: 'next', target: 'prev' },
    home: { source: 'homeTopLeft', target: 'homeTopRight' },
    parent: { source: 'parentBottomLeft', target: 'parentBottomRight' },
};

/** Umkehrung von {@link LINK_HANDLES}: Verweisart je Quell-Handle */
export const SOURCE_HANDLE_KIND: Record<string, NavigationLinkKind | undefined> = {
    prev: 'prev',
    next: 'next',
    homeTopLeft: 'home',
    parentBottomLeft: 'parent',
};

/**
 * Farbe einer Kantenart als CSS-Ausdruck mit Hex-Fallback
 *
 * @param kind Kantenart
 */
export function edgeColor(kind: EdgeKind): string {
    return `var(${EDGE_COLOR_VAR[kind]}, ${EDGE_COLOR_HEX[kind]})`;
}

/**
 * Data of a node of the flow. Everything the node component needs comes through here - it has no
 * access to the view.
 */
export type NavigationFlowNodeData = {
    label: string;
    entry?: NavigationMapEntry;
    /** Handles an edge uses, with the kind of that edge - decides which handles are drawn and in which colour */
    usedHandles?: Record<string, EdgeKind | undefined>;
    /** The view is in edit mode */
    editing?: boolean;
    /** The links of this page can be edited (admin page in edit mode) */
    editable?: boolean;
    /** The links of this page were changed but not saved yet */
    unsaved?: boolean;
};

/** Node of the flow as kept in the view state */
export interface FlowNode {
    id: string;
    data: NavigationFlowNodeData;
    position: { x: number; y: number };
    type?: string;
    draggable?: boolean;
}

/** Edge of the flow as built from the navigation map */
export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    label: string;
    style: { strokeWidth: number; strokeDasharray?: string; stroke?: string };
    data?: { isTarget: boolean; navType?: EdgeKind; bidirectional?: boolean; highlighted?: boolean };
    className?: string;
    /** Edit mode: which end of the edge can be dragged to another node */
    reconnectable?: boolean | 'source' | 'target';
}
