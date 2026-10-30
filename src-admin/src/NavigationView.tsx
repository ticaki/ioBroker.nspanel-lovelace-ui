// Konstanten für Adapter-Kommunikation
import './NavigationView.css';
import iconList from './icons.json';
import type {
    NavigationLinks,
    NavigationMapEntry,
    NavigationMap,
    NavigationOverride,
    PageConfigEntry,
    PanelListEntry,
    NavigationSavePayload,
} from '../../src/lib/types/adminShareConfig';
import {
    SENDTO_GET_PANEL_NAVIGATION_COMMAND,
    SAVE_PANEL_NAVIGATION_COMMAND,
    isMainPageEntry,
    mainPageName,
    servicePageName,
} from '../../src/lib/types/adminShareConfig';
import {
    adapterDecidedLink,
    applyNavigationOverlay,
    assignmentSourceOf,
    effectiveNavigation,
    effectiveScriptLinks,
    isNavigationApplied,
    isNavigationLinkKind,
    isOverrideStale,
    mergeNavigationOverride,
    overrideOf,
    removeNavigationOverride,
    setNavigationLink,
    setOverrideLink,
    type NavigationEditScope,
    type NavigationLinkKind,
} from '../../src/lib/types/navigationEdit';
import {
    EDGE_COLOR_HEX,
    EDGE_COLOR_VAR,
    LINK_HANDLES,
    NODE_COLOR_HEX,
    NODE_STYLE_LABEL_KEY,
    NODE_STYLE_VAR,
    NODE_STYLES,
    SOURCE_HANDLE_KIND,
    STATIC_EDGE_KINDS,
    edgeColor,
    type EdgeKind,
    type FlowEdge,
    type FlowNode,
} from './navigationFlowConst';
import NavigationFlowNode, { GeneratedPageMarker, OverrideMarker } from './components/NavigationFlowNode';
import NavigationScopeDialog from './components/NavigationScopeDialog';
import NavigationOverrideStaleDialog, {
    type StaleOverrideDecision,
    type StaleOverrideItem,
} from './components/NavigationOverrideStaleDialog';

const ADAPTER_NAME = 'nspanel-lovelace-ui';

/** Key under which the last selected panel of the "Navigation Flow" tab is remembered. */
const SELECTED_PANEL_STORAGE_KEY = `${ADAPTER_NAME}.navigationFlow.selectedPanel`;

/**
 * Reads the last selected panel name of the "Navigation Flow" tab from `window.localStorage`.
 *
 * Wrapped in try/catch: `localStorage` can throw (e.g. in the browser's private mode), which must
 * not break the admin page.
 *
 * @returns The stored panel name, or `undefined` if none is stored or storage is unavailable
 */
function readStoredSelectedPanel(): string | undefined {
    try {
        return window.localStorage.getItem(SELECTED_PANEL_STORAGE_KEY) || undefined;
    } catch {
        return undefined;
    }
}

/**
 * Persists the selected panel name of the "Navigation Flow" tab to `window.localStorage`, so the
 * choice survives reload, tab close and browser restart.
 *
 * Wrapped in try/catch: errors (e.g. private mode) are swallowed - remembering the selection is a
 * convenience and must not break the admin page.
 *
 * @param panelName Name of the panel currently selected
 * @returns Nothing
 */
function storeSelectedPanel(panelName: string): void {
    try {
        window.localStorage.setItem(SELECTED_PANEL_STORAGE_KEY, panelName);
    } catch {
        // Private mode or blocked storage - the selection then just isn't remembered
    }
}

/** Prefix of the key under which the collapsed pages of a panel are remembered (view comfort). */
const COLLAPSED_STORAGE_PREFIX = `${ADAPTER_NAME}.navigationFlow.collapsed.`;

/**
 * Reads the collapsed pages of a panel from `window.localStorage`.
 *
 * @param panelName Name of the panel.
 * @returns The collapsed pages, `undefined` if nothing is stored for the panel (or storage fails).
 */
function readStoredCollapsed(panelName: string): string[] | undefined {
    try {
        const raw = window.localStorage.getItem(COLLAPSED_STORAGE_PREFIX + panelName);
        if (raw === null) {
            return undefined;
        }
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : undefined;
    } catch {
        return undefined;
    }
}

/**
 * Stores the collapsed pages of a panel in `window.localStorage` - a convenience only, errors are
 * swallowed.
 *
 * @param panelName Name of the panel.
 * @param collapsed The collapsed pages.
 */
function storeCollapsed(panelName: string, collapsed: ReadonlySet<string>): void {
    try {
        window.localStorage.setItem(COLLAPSED_STORAGE_PREFIX + panelName, JSON.stringify([...collapsed]));
    } catch {
        // Private mode or blocked storage - the state then just isn't remembered
    }
}

/** Prefix of the key under which the home link switch of a panel is remembered (view comfort). */
const HOME_EDGES_STORAGE_PREFIX = `${ADAPTER_NAME}.navigationFlow.homeEdges.`;

/**
 * Reads whether the home links to `main` are shown for a panel. Without a stored choice (or when
 * the storage fails) they are shown.
 *
 * @param panelName Name of the panel.
 * @returns True when the home links are shown.
 */
function readStoredShowHomeEdges(panelName: string): boolean {
    try {
        return window.localStorage.getItem(HOME_EDGES_STORAGE_PREFIX + panelName) !== 'false';
    } catch {
        return true;
    }
}

/**
 * Remembers the home link switch of a panel in `window.localStorage` - a convenience only, errors
 * are swallowed.
 *
 * @param panelName Name of the panel.
 * @param show Whether the home links are shown.
 */
function storeShowHomeEdges(panelName: string, show: boolean): void {
    try {
        window.localStorage.setItem(HOME_EDGES_STORAGE_PREFIX + panelName, String(show));
    } catch {
        // Private mode or blocked storage - the choice then just isn't remembered
    }
}

/** Icons nach Namen - die Liste steckt ohnehin im Bundle, die Zuordnung wird einmalig aufgebaut */
let iconsByName: Map<string, string> | undefined;

/**
 * SVG eines Icons, eingefärbt über `currentColor`.
 *
 * Die mitgelieferten Icons haben eine feste Füllfarbe und wären im dunklen Theme nicht zu sehen.
 * Wie im Icon-Auswahlfeld wird die Füllung daher auf die Textfarbe umgestellt.
 *
 * @param name Icon-Name aus der Seitenkonfiguration.
 * @returns Das SVG-Markup, oder `undefined` wenn es das Icon nicht gibt.
 */
function iconSvg(name: string): string | undefined {
    if (!iconsByName) {
        const all: { name: string; base64: string }[] = Array.isArray(iconList) ? iconList : [];
        iconsByName = new Map(all.map(icon => [icon.name, icon.base64]));
    }
    const base64 = iconsByName.get(name);
    if (!base64) {
        return undefined;
    }
    return atob(base64.replace(/^data:image\/svg\+xml;base64,/, '')).replace(
        /<svg([^>]*)>/,
        '<svg$1 fill="currentColor">',
    );
}

// Typ für das Rückgabeobjekt der mapNavigationMapToFlow-Funktion
interface FlowData {
    nodes: FlowNode[];
    edges: FlowEdge[];
}
// State-Interface für die NavigationView-Klasse
interface NavigationViewState extends ConfigGenericState {
    alive: boolean;
    loading: boolean;
    panelList: PanelListEntry[];
    selectedPanel: string;
    navigationMap: NavigationMap | null;
    noData?: boolean;
}
// React import consolidated below with hooks
import type {
    Connection,
    Edge,
    EdgeProps,
    EdgeTypes,
    FinalConnectionState,
    NodeTypes,
    OnConnectEnd,
    OnReconnect,
} from '@xyflow/react';
import {
    ReactFlow,
    Background,
    Controls,
    ConnectionMode,
    applyNodeChanges,
    getBezierPath,
    useUpdateNodeInternals,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { SelectChangeEvent } from '@mui/material';
import {
    Select,
    MenuItem,
    Menu,
    Box,
    Button,
    Divider,
    Typography,
    CircularProgress,
    Checkbox,
    FormControlLabel,
    Alert,
    Snackbar,
    ButtonGroup,
} from '@mui/material';
import NodePageInfoPanel from './components/NodePageInfoPanel';
import { openPageConfig } from './pageConfigLink';
import ConfirmDialog from './components/ConfirmDialog';
import { alpha, useTheme } from '@mui/material/styles';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
    buildLayoutTree,
    computeAutoLayout,
    defaultCollapsed,
    estimateNodeSize,
    hiddenByCollapse,
    placeNewNodes,
    subtreeOf,
    type LayoutTree,
    type NodeSize,
    type Positions,
} from './navigationAutoLayout';
import React, { useEffect } from 'react';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { I18n } from '@iobroker/gui-components';
/** A change of one navigation link, waiting for the user to pick the scope it is written to */
interface PendingLinkChange {
    /** Node the link starts at */
    sourceNodeId: string;
    /** `uniqueName` of the admin entry behind that node */
    uniqueName: string;
    panelTopic: string;
    kind: NavigationLinkKind;
    /** Node the link points to, `undefined` removes the link */
    target: string | undefined;
}

/** One link in the menu of an edge */
interface EdgeMenuItem {
    source: string;
    target: string;
    kind: NavigationLinkKind;
    /** The link is stored in the configuration of an admin page and can be removed */
    removable: boolean;
}

/**
 * Menu of a clicked edge, at the position of the click. It lists every link between the two
 * pages in both directions - `a.next = b` and `b.prev = a` are drawn on top of each other.
 */
interface EdgeEditMenu {
    x: number;
    y: number;
    items: EdgeMenuItem[];
    /** Script pages among the two whose navigation is overridden - the override can be dropped */
    restorable: string[];
}

/** Pages whose override is out of date, waiting for the user's decision */
interface StaleOverrideDialogState {
    panelName: string;
    panelTopic: string;
    items: StaleOverrideItem[];
}

/** Node types of the flow - defined once, React Flow re-mounts every node when the object changes */
const NODE_TYPES: NodeTypes = { custom: NavigationFlowNode };

/** Shared empty set, so a panel without touched nodes keeps the same identity between renders */
const NO_TOUCHED: ReadonlySet<string> = new Set();

/** Stable empty override list - `getNavigationOverrides` returns it while the instance has none */
const NO_OVERRIDES: NavigationOverride[] = [];

/** Edge type of this view - `@xyflow/react` types `data` as `Record<string, unknown>` */
type CustomEdgeType = Edge<{
    isTarget?: boolean;
    navType?: EdgeKind;
    bidirectional?: boolean;
    /** Set while the page at either end is selected - the edge is drawn like on hover */
    highlighted?: boolean;
    /** The edge leads into a collapsed sub tree and is drawn to the collapsed page instead */
    redirected?: boolean;
}>;

function CustomEdge(props: EdgeProps<CustomEdgeType>): React.ReactElement {
    const [edgePath] = getBezierPath(props);
    const navType = props.data?.navType ?? '';
    const isTarget = !!props.data?.isTarget;
    const bidirectional = !!props.data?.bidirectional;
    const highlighted = !!props.data?.highlighted;
    const markerId = navType || (isTarget ? 'target' : 'default');

    // Beidseitige Verbindungen bekommen einen Doppelpfeil statt zweier deckungsgleicher Kanten
    const tooltip = `${navType}: ${props.source} ${bidirectional ? '↔' : '→'} ${props.target}`;

    // stroke is passed via style on the FlowEdge (mapNavigationMapToFlow)
    const stroke = props.style?.stroke ?? edgeColor('default');
    const dash = props.style?.strokeDasharray;

    // Touch event handler für Edge-Tooltips (nur Touch, kein Click/Hover)
    const handleTouchStart = (event: React.TouchEvent): void => {
        // Nur bei Touch-Geräten Tooltip anzeigen
        if (event.touches.length === 1) {
            const tooltipDiv = document.createElement('div');
            tooltipDiv.className = 'edge-tooltip-mobile';
            tooltipDiv.textContent = tooltip;

            const touch = event.touches[0];
            tooltipDiv.style.left = `${touch.clientX - 50}px`;
            tooltipDiv.style.top = `${touch.clientY - 30}px`;

            document.body.appendChild(tooltipDiv);

            // Tooltip nach 1.5 Sekunden entfernen
            setTimeout(() => {
                if (tooltipDiv.parentNode) {
                    tooltipDiv.parentNode.removeChild(tooltipDiv);
                }
            }, 1500);
        }
    };

    const strokeWidth = typeof props.style?.strokeWidth === 'number' ? props.style.strokeWidth : 2;

    return (
        <g className={`custom-edge${highlighted ? ' custom-edge-highlighted' : ''}`}>
            {/* Schein in der Farbe der Kante - hebt sie hervor, ohne die Farbe zu wechseln */}
            <path
                d={edgePath}
                strokeWidth={strokeWidth + 6}
                fill="none"
                className="custom-edge-halo"
                style={{ stroke }}
            />
            <path
                id={props.id}
                d={edgePath}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={dash}
                markerEnd={`url(#arrow-${markerId})`}
                markerStart={bidirectional ? `url(#arrow-${markerId}-start)` : undefined}
                className="react-flow__edge-path custom-edge-path"
                style={{ stroke }}
            />
            {/* Unsichtbare Trefferfläche: die 2px-Linie allein ist kaum zu treffen */}
            <path
                d={edgePath}
                strokeWidth={18}
                fill="none"
                stroke="transparent"
                className="custom-edge-hit"
                onTouchStart={handleTouchStart}
            />
            <title>{tooltip}</title>
        </g>
    );
}

/** Edge types of the flow - defined once like the node types */
const EDGE_TYPES: EdgeTypes = { custom: CustomEdge };

interface EdgeArrowMarkersProps {
    kind: EdgeKind;
    size: number;
    /** zusätzlich den rückwärts gedrehten Marker für den Kantenanfang erzeugen */
    bidirectional?: boolean;
}

/**
 * Pfeilspitzen-Marker einer Kantenart
 *
 * @param props Kantenart, Größe und ob ein Marker für den Kantenanfang benötigt wird
 */
function EdgeArrowMarkers(props: EdgeArrowMarkersProps): React.ReactElement {
    const { kind, size, bidirectional } = props;
    const fill = edgeColor(kind);
    const tip = `M0,0 L${size},${size / 2} L0,${size} z`;
    return (
        <>
            <marker
                id={`arrow-${kind}`}
                markerWidth={size}
                markerHeight={size}
                refX={size}
                refY={size / 2}
                orient="auto"
                markerUnits="strokeWidth"
            >
                <path
                    d={tip}
                    fill={fill}
                />
            </marker>
            {bidirectional ? (
                <marker
                    id={`arrow-${kind}-start`}
                    markerWidth={size}
                    markerHeight={size}
                    refX={size}
                    refY={size / 2}
                    orient="auto-start-reverse"
                    markerUnits="strokeWidth"
                >
                    <path
                        d={tip}
                        fill={fill}
                    />
                </marker>
            ) : null}
        </>
    );
}

interface LegendEdgePreviewProps {
    color: string;
    dash?: string;
    /** Pfeilspitze auch am linken Ende zeichnen */
    bidirectional?: boolean;
}

/**
 * Vorschau einer Kantenart für die Legende - Linie mit Pfeilspitze(n)
 *
 * @param props Farbe, Strichmuster und ob die Kante beidseitig gilt
 */
function LegendEdgePreview(props: LegendEdgePreviewProps): React.ReactElement {
    const { color, dash, bidirectional } = props;
    return (
        <svg
            width={30}
            height={10}
            aria-hidden="true"
            style={{ flex: '0 0 auto' }}
        >
            <line
                x1={bidirectional ? 7 : 1}
                y1={5}
                x2={24}
                y2={5}
                stroke={color}
                strokeWidth={2}
                strokeDasharray={dash}
            />
            <path
                d="M24,1 L29,5 L24,9 z"
                fill={color}
            />
            {bidirectional ? (
                <path
                    d="M7,1 L2,5 L7,9 z"
                    fill={color}
                />
            ) : null}
        </svg>
    );
}

interface MapToFlowOptions {
    /**
     * Draw a pair `a.next === b` and `b.prev === a` as one edge with two arrow heads. Off in edit
     * mode, where every edge stands for exactly one link of the configuration.
     */
    mergeReciprocal?: boolean;
}

/**
 * Builds the nodes and edges of the flow from a navigation map.
 *
 * @param navigationMap Navigation map of the panel.
 * @param options See {@link MapToFlowOptions}; reciprocal prev/next pairs are merged by default.
 */
function mapNavigationMapToFlow(navigationMap: NavigationMap, options: MapToFlowOptions = {}): FlowData {
    const mergeReciprocal = options.mergeReciprocal !== false;
    const nodes: FlowNode[] = navigationMap.map((entry: NavigationMapEntry) => {
        let position: { x: number; y: number };
        if (entry.position && typeof entry.position.x === 'number' && typeof entry.position.y === 'number') {
            position = entry.position;
            // Debug: Position aus entry übernommen
            // console.debug('[mapNavigationMapToFlow] Node', entry.page, 'Position from entry:', position);
        } else {
            // Vorläufig - Knoten ohne Position setzt `deriveFlowState` über das Auto-Layout
            // ("nur neue platzieren"); nur Knoten in eingeklappten Unterbäumen bleiben hier stehen
            position = { x: 0, y: 0 };
        }
        return {
            id: entry.page,
            data: { label: entry.label || entry.page, entry },
            position,
            type: 'custom',
            draggable: true,
        };
    });
    const edges: FlowEdge[] = [];
    const pages = new Set(navigationMap.map(e => e.page));
    const entryByPage = new Map<string, NavigationMapEntry>(navigationMap.map(e => [e.page, e]));
    // Bereits als Doppelpfeil gezeichnete prev/next-Paare (Schlüssel unabhängig von der Richtung)
    const drawnPairs = new Set<string>();
    const pairKey = (a: string, b: string): string => (a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`);
    /**
     * true, wenn `a.next === b` und `b.prev === a` - die Verbindung gilt dann in beide Richtungen
     *
     * @param a Seite, deren `next` geprüft wird
     * @param b Seite, deren `prev` geprüft wird
     */
    const isReciprocal = (a: string, b: string): boolean => {
        if (!mergeReciprocal || a === b) {
            return false;
        }
        const from = entryByPage.get(a);
        const to = entryByPage.get(b);
        return from?.next === b && to?.prev === a;
    };
    /**
     * Doppelpfeil-Kante von `a` (next-Handle) nach `b` (prev-Handle); jedes Paar wird nur einmal gezeichnet
     *
     * @param a Seite mit dem `next`-Verweis
     * @param b Seite mit dem `prev`-Verweis
     */
    const pushBidirectional = (a: string, b: string): void => {
        const key = pairKey(a, b);
        if (drawnPairs.has(key)) {
            return;
        }
        drawnPairs.add(key);
        edges.push({
            id: `nav-${a}-${b}-prevnext`,
            source: a,
            target: b,
            sourceHandle: LINK_HANDLES.next.source,
            targetHandle: LINK_HANDLES.next.target,
            label: '',
            style: { strokeWidth: 2, stroke: edgeColor('prevNext') },
            data: { isTarget: false, navType: 'prevNext', bidirectional: true },
            className: 'edge-prev-next',
        });
    };

    for (const entry of navigationMap) {
        // next: von a1.next zu a2.prev
        if (entry.next && typeof entry.next === 'string' && pages.has(entry.next)) {
            if (isReciprocal(entry.page, entry.next)) {
                // a.next === b und b.prev === a: eine Kante mit zwei Pfeilenden statt zweier deckungsgleicher
                pushBidirectional(entry.page, entry.next);
            } else {
                edges.push({
                    id: `nav-${entry.page}-${entry.next}-next`,
                    source: entry.page,
                    target: entry.next,
                    sourceHandle: LINK_HANDLES.next.source,
                    targetHandle: LINK_HANDLES.next.target,
                    label: '',
                    style: { strokeWidth: 2, stroke: edgeColor('next') },
                    data: { isTarget: false, navType: 'next' },
                    className: 'edge-next',
                });
            }
        }
        // prev: von a1.prev zu a2.next
        if (entry.prev && typeof entry.prev === 'string' && pages.has(entry.prev)) {
            if (isReciprocal(entry.prev, entry.page)) {
                // Gegenstück zur obigen next-Kante - wird als ein Doppelpfeil gezeichnet
                pushBidirectional(entry.prev, entry.page);
            } else {
                edges.push({
                    id: `nav-${entry.page}-${entry.prev}-prev`,
                    source: entry.page,
                    target: entry.prev,
                    sourceHandle: LINK_HANDLES.prev.source,
                    targetHandle: LINK_HANDLES.prev.target,
                    label: '',
                    style: { strokeWidth: 2, stroke: edgeColor('prev') },
                    data: { isTarget: false, navType: 'prev' },
                    className: 'edge-prev',
                });
            }
        }
        // home: von a1.home (links oben) zu a2 (rechts oben)
        if (entry.home && typeof entry.home === 'string' && pages.has(entry.home)) {
            edges.push({
                id: `nav-${entry.page}-${entry.home}-home`,
                source: entry.page,
                target: entry.home,
                sourceHandle: LINK_HANDLES.home.source,
                targetHandle: LINK_HANDLES.home.target,
                label: '',
                style: { strokeWidth: 2, strokeDasharray: '8 8', stroke: edgeColor('home') },
                data: { isTarget: false, navType: 'home' },
                className: 'edge-home',
            });
        }
        // parent: von a1.parent (links unten) zu a2 (rechts unten)
        if (entry.parent && typeof entry.parent === 'string' && pages.has(entry.parent)) {
            edges.push({
                id: `nav-${entry.page}-${entry.parent}-parent`,
                source: entry.page,
                target: entry.parent,
                sourceHandle: LINK_HANDLES.parent.source,
                targetHandle: LINK_HANDLES.parent.target,
                label: '',
                style: { strokeWidth: 2, stroke: edgeColor('parent') },
                data: { isTarget: false, navType: 'parent' },
                className: 'edge-parent',
            });
        }
        // targetPages: von a1 zu a2, von Mitte rechts zu Mitte links.
        // Kurzer und langer Druck auf ein Seitenelement führen zu je eigenen Zielen; dazu die
        // Datenpunkte und Channels, aus denen die Seite ihre Werte liest.
        for (const [kind, targets] of [
            ['target', entry.targetPages],
            ['targetLongPress', entry.targetPagesLongPress],
            ['state', entry.usedStates],
        ] as [EdgeKind, string[] | undefined][]) {
            if (!Array.isArray(targets)) {
                continue;
            }
            for (const target of targets) {
                if (target && typeof target === 'string' && pages.has(target)) {
                    edges.push({
                        id: `${kind}-${entry.page}-${target}`,
                        source: entry.page,
                        target: target,
                        sourceHandle: 'targetRight',
                        targetHandle: 'targetLeft',
                        label: '',
                        style: {
                            strokeWidth: kind === 'state' ? 1 : 2,
                            strokeDasharray: kind === 'state' ? '2 3' : '4 4',
                            stroke: edgeColor(kind),
                        },
                        data: { isTarget: true, navType: kind },
                        className: `edge-${kind === 'targetLongPress' ? 'target-long-press' : kind}`,
                    });
                }
            }
        }
    }
    return { nodes, edges };
}

/**
 * Größen der Knoten fürs Auto-Layout: was React Flow gemessen hat, sonst geschätzt (ausgeblendete
 * Knoten, erstes Laden).
 *
 * @param nodes Knoten der Ansicht.
 * @returns Größe je Knoten-Id.
 */
function nodeSizes(nodes: readonly FlowNode[]): Map<string, NodeSize> {
    const sizes = new Map<string, NodeSize>();
    for (const node of nodes) {
        const { width, height } = node.measured ?? {};
        sizes.set(
            node.id,
            width && height
                ? { width, height }
                : estimateNodeSize(node.data.entry ?? { page: node.id, label: node.data.label }),
        );
    }
    return sizes;
}

/**
 * Whether a node is shown with the given switches (collapsing aside). System pages need "show
 * system pages" - except `///unlock`, which is always shown -, state nodes need "show states".
 *
 * @param showSystemPages Switch "show system pages".
 * @param showStates Switch "show states".
 * @returns The check per node.
 */
function shownBySwitches(showSystemPages: boolean, showStates: boolean): (node: FlowNode) => boolean {
    return node =>
        (showSystemPages || !node.id.startsWith('///') || node.id === servicePageName) &&
        (showStates || node.data.entry?.nodeType !== 'stateRef');
}

/**
 * Positions to save: only nodes with a real position - provisionally placed nodes (and nodes in
 * collapsed sub trees that never got a position) are left out, so they are placed again next time
 * instead of being stored where they happen to stand (e.g. all at 0/0).
 *
 * @param nodes All nodes.
 * @param unplaced Nodes with a provisional position only.
 * @returns Name and position per node to save.
 */
function savedPositions(nodes: readonly FlowNode[], unplaced: ReadonlySet<string>): NavigationSavePayload['pages'] {
    return nodes.filter(n => !unplaced.has(n.id)).map(n => ({ name: n.id, position: n.position }));
}

/**
 * Positionen der Knoten, außer den ausgenommenen.
 *
 * @param nodes Knoten der Ansicht.
 * @param except Knoten, deren Position nicht zählt.
 * @returns Position je Knoten-Id.
 */
function positionsOf(nodes: readonly FlowNode[], except: ReadonlySet<string>): Positions {
    const out: Positions = {};
    for (const node of nodes) {
        if (!except.has(node.id)) {
            out[node.id] = node.position;
        }
    }
    return out;
}

/**
 * Übernimmt neue Positionen in die Knoten; Knoten ohne neue Position bleiben dieselben Objekte.
 *
 * @param nodes Knoten der Ansicht.
 * @param positions Neue Positionen.
 * @returns Die Knoten.
 */
function withPositions(nodes: readonly FlowNode[], positions: Positions): FlowNode[] {
    return nodes.map(node => (positions[node.id] ? { ...node, position: positions[node.id] } : node));
}

interface NavigationViewInternalState extends NavigationViewState {
    nodes: FlowNode[];
    dirty?: boolean;
    noData?: boolean;
    infoPanelOpen?: boolean;
    infoData?: Record<string, any> | null;
    infoNodeId?: string | undefined;
    /** Current values of the states the icons of the info panel are read from, by state id. */
    infoIconValues?: Record<string, string>;
    confirmAutoLayoutOpen?: boolean;
    /** Anchor of the open menu of the auto layout button */
    autoLayoutMenu?: HTMLElement;
    /**
     * Nodes whose position is only provisional: they had no saved position and were placed
     * automatically. They are placed again when they appear and lose the mark when moved.
     */
    unplaced: ReadonlySet<string>;
    /** Collapsed pages of the selected panel - their sub trees are hidden */
    collapsed: ReadonlySet<string>;
    /** Home links to `main` shown - the user's choice per panel, shown unless switched off */
    showHomeEdges: boolean;
    isTouchDevice?: boolean;
    showSystemPages: boolean;
    showStates: boolean;
    /** Edit mode: links of admin pages can be drawn and removed */
    editing: boolean;
    /** Node ids whose links were changed but not saved yet, by panel name */
    touched: Map<string, ReadonlySet<string>>;
    editMenu?: EdgeEditMenu;
    scopeDialog?: PendingLinkChange;
    staleDialog?: StaleOverrideDialogState;
    /** Translated warning shown in a snackbar, e.g. when a page cannot be edited */
    notice?: string;
    /** The adapter restarted and the navigation is being read again - the old view stays meanwhile */
    restarting: boolean;
    /**
     * Bumped whenever handles appear or disappear without the node changing its size (edit mode,
     * fresh data) - React Flow then re-measures the handles, see {@link NodeInternalsRefresher}.
     */
    internalsToken: number;
}

class NavigationView extends ConfigGeneric<ConfigGenericProps, NavigationViewInternalState> {
    private autosaveInterval?: NodeJS.Timeout;

    /** Timer of the restart phase: the first read after the adapter came back, or the next poll */
    private restartTimeout?: NodeJS.Timeout;

    /** End of the restart phase - polling stops here even without an answer */
    private restartDeadline = 0;

    /** Last alive value seen - the state may lag behind, the subscription must not */
    private lastAlive = false;

    /** Edges of the current map/config/edit mode, kept until one of the inputs changes */
    private edgesCache?: {
        map: NavigationMap;
        pageConfig: PageConfigEntry[];
        overrides: NavigationOverride[];
        panelTopic: string | undefined;
        touched: ReadonlySet<string>;
        editing: boolean;
        edges: FlowEdge[];
    };

    /**
     * Stale overrides the user already decided on (or postponed) in this session, by
     * `<panelTopic>|<page>` - the question is asked once per page and session.
     */
    private staleDecided = new Set<string>();

    /** Nodes with the data of the edit mode added, kept per node until the node or that data changes */
    private nodeCache = new Map<string, { source: FlowNode; key: string; node: FlowNode }>();

    /**
     * Scope the user picked for a page assigned to all panels, by `<panelTopic>|<uniqueName>` - so
     * the question is asked once per page and session, not with every link.
     */
    private scopeChoice = new Map<string, NavigationEditScope>();

    /** Set while `onConnect` applied a connection, so `onConnectEnd` does not apply it again */
    private connectApplied = false;

    /** Node the icons of the info panel are being read for, or were read for - each node once. */
    private iconValuesLoadedFor?: string;

    // Schnelles Speichern beim Tabwechsel/Schließen über Beacon (kein await möglich)
    private saveNavigationBeacon = (): void => {
        const { selectedPanel, nodes, dirty, alive, unplaced } = this.state;
        if (!selectedPanel || !nodes.length || !dirty || !alive) {
            return;
        }
        const payload: NavigationSavePayload = {
            panelName: selectedPanel,
            pages: savedPositions(nodes, unplaced),
        };
        try {
            const url = `${window.location.origin}/adapter/${ADAPTER_NAME}/autosave`;
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            if (typeof navigator.sendBeacon === 'function') {
                navigator.sendBeacon(url, blob);
            }
        } catch {
            // Silent fail; beforeunload hat kein robustes Error-Handling
        }
    };

    // Event-Handler: vor dem Entladen (Tab schließen/neu laden)
    private handleBeforeUnload = (event: BeforeUnloadEvent): void => {
        // Best-Effort Speichern ohne await
        this.saveNavigationBeacon();
        if (this.state.dirty) {
            event.preventDefault();
            // Einige Browser zeigen nur mit returnValue einen Dialog an
            event.returnValue = '';
        }
    };

    // Event-Handler: Sichtbarkeit wechselt (Tabwechsel/Hintergrund)
    private handleVisibilityChange = (): void => {
        if (document.visibilityState === 'hidden' && this.state.dirty) {
            // Hier können wir normal speichern (sendTo mit await ist ok)
            void this.saveNavigation();
        }
    };

    async saveNavigation(): Promise<void> {
        const { selectedPanel, nodes, dirty, alive, unplaced } = this.state;
        if (!selectedPanel || !nodes.length || !dirty) {
            return;
        }
        if (!alive) {
            // Adapter ist offline, nicht speichern
            // console.log('[NavigationView] Speichern übersprungen: Adapter offline');
            return;
        }
        const payload: NavigationSavePayload = {
            panelName: selectedPanel,
            pages: savedPositions(nodes, unplaced),
        };
        try {
            const instance = this.props.oContext.instance ?? '0';
            await this.props.oContext.socket.sendTo(
                `${ADAPTER_NAME}.${instance}`,
                SAVE_PANEL_NAVIGATION_COMMAND,
                payload,
            );
            this.setState({ dirty: false });
        } catch (e) {
            // Fehlerbehandlung
            console.error('Fehler beim Speichern der Navigation:', e);
        }
    }
    constructor(props: ConfigGenericProps) {
        super(props);
        this.state = {
            ...this.state,
            alive: false,
            loading: false,
            panelList: [],
            selectedPanel: '',
            navigationMap: null,
            nodes: [],
            dirty: false,
            infoPanelOpen: false,
            infoData: null,
            infoNodeId: undefined,
            showSystemPages: false,
            showStates: false,
            editing: false,
            touched: new Map(),
            restarting: false,
            internalsToken: 0,
            unplaced: new Set(),
            collapsed: new Set(),
            showHomeEdges: true,
        };
        this.handleShowStatesChange = this.handleShowStatesChange.bind(this);
        this.fetchNavigation = this.fetchNavigation.bind(this);
        this.handlePanelChange = this.handlePanelChange.bind(this);
        this.onNodesChange = this.onNodesChange.bind(this);
        this.onNodeClick = this.onNodeClick.bind(this);
        this.onPaneClick = this.onPaneClick.bind(this);
        this.saveNavigation = this.saveNavigation.bind(this);
        this.openConfirmAutoLayout = this.openConfirmAutoLayout.bind(this);
        this.closeConfirmAutoLayout = this.closeConfirmAutoLayout.bind(this);
        this.confirmAutoLayout = this.confirmAutoLayout.bind(this);
    }

    openConfirmAutoLayout(): void {
        this.setState({ confirmAutoLayoutOpen: true, autoLayoutMenu: undefined });
    }

    closeConfirmAutoLayout(): void {
        this.setState({ confirmAutoLayoutOpen: false });
    }

    /**
     * "Rearrange everything": every visible node gets a new position. Nodes in collapsed sub trees
     * keep theirs but count as unplaced, so they are placed again when expanded.
     */
    confirmAutoLayout(): void {
        this.setState(state => {
            const map = state.navigationMap;
            if (!map) {
                return { ...state, confirmAutoLayoutOpen: false };
            }
            const positions = computeAutoLayout(
                map,
                nodeSizes(state.nodes),
                { collapsed: state.collapsed },
                this.getLayoutTree(map),
            );
            return {
                ...state,
                nodes: withPositions(state.nodes, positions),
                unplaced: new Set(state.nodes.filter(n => !positions[n.id]).map(n => n.id)),
                dirty: true,
                confirmAutoLayoutOpen: false,
            };
        });
    }

    /**
     * "Place nodes without a position" (default of the auto layout button): only nodes without a
     * saved position are placed, next to the page that leads to them; all others stay put.
     */
    private placeNewOnly = (): void => {
        this.setState(state => {
            const map = state.navigationMap;
            const hidden = map ? this.getHidden(map, state.collapsed) : new Set<string>();
            const toPlace = new Set([...state.unplaced].filter(id => !hidden.has(id)));
            if (!map || !toPlace.size) {
                return { ...state, autoLayoutMenu: undefined, notice: I18n.t('auto_layout_nothing_new') };
            }
            // The provisional positions of the rest (in collapsed sub trees) mean nothing - they
            // must not keep the new nodes away
            const placed = placeNewNodes(
                map,
                nodeSizes(state.nodes),
                positionsOf(state.nodes, state.unplaced),
                toPlace,
                { collapsed: state.collapsed },
                this.getLayoutTree(map),
            );
            return {
                ...state,
                nodes: withPositions(state.nodes, placed),
                unplaced: new Set([...state.unplaced].filter(id => !placed[id])),
                dirty: true,
                autoLayoutMenu: undefined,
            };
        });
    };

    private openAutoLayoutMenu = (event: React.MouseEvent<HTMLElement>): void => {
        this.setState({ autoLayoutMenu: event.currentTarget });
    };

    private closeAutoLayoutMenu = (): void => {
        this.setState({ autoLayoutMenu: undefined });
    };

    /** Layout tree of the current map, kept until the map changes */
    private layoutTreeCache?: { map: NavigationMap; tree: LayoutTree };

    /**
     * Layout tree of a map - who hangs below whom, independent of positions.
     *
     * @param map Navigation map.
     * @returns The tree.
     */
    private getLayoutTree(map: NavigationMap): LayoutTree {
        if (this.layoutTreeCache?.map !== map) {
            this.layoutTreeCache = { map, tree: buildLayoutTree(map) };
        }
        return this.layoutTreeCache.tree;
    }

    /** Hidden nodes for the last map/collapse combination */
    private hiddenCache?: { map: NavigationMap; collapsed: ReadonlySet<string>; hidden: Set<string> };

    /**
     * Nodes hidden by collapsed sub trees.
     *
     * @param map Navigation map.
     * @param collapsed Collapsed pages.
     * @returns The hidden nodes.
     */
    private getHidden(map: NavigationMap, collapsed: ReadonlySet<string>): Set<string> {
        if (this.hiddenCache?.map !== map || this.hiddenCache.collapsed !== collapsed) {
            this.hiddenCache = { map, collapsed, hidden: hiddenByCollapse(this.getLayoutTree(map), collapsed) };
        }
        return this.hiddenCache.hidden;
    }

    /**
     * Places nodes that just became visible and have only a provisional position, around the
     * nodes that stay where they are. The view only - nothing is marked as changed.
     *
     * Nodes with a provisional position that stay invisible do not count as occupied - otherwise
     * e.g. the hidden state nodes in their outer column would push the revealed pages far down.
     *
     * @param state Current state.
     * @param revealed Nodes that became visible.
     * @param collapsed Collapsed pages after the change.
     * @param shown Whether a node is visible after the change (ignoring collapsing).
     * @returns The updated nodes, `undefined` when nothing had to be placed.
     */
    private placeRevealed(
        state: NavigationViewInternalState,
        revealed: Iterable<string>,
        collapsed: ReadonlySet<string>,
        shown: (node: FlowNode) => boolean,
    ): FlowNode[] | undefined {
        const map = state.navigationMap;
        if (!map) {
            return undefined;
        }
        const hidden = hiddenByCollapse(this.getLayoutTree(map), collapsed);
        const toPlace = new Set([...revealed].filter(id => state.unplaced.has(id) && !hidden.has(id)));
        if (!toPlace.size) {
            return undefined;
        }
        const ignored = new Set(
            state.nodes
                .filter(n => toPlace.has(n.id) || (state.unplaced.has(n.id) && (hidden.has(n.id) || !shown(n))))
                .map(n => n.id),
        );
        const placed = placeNewNodes(
            map,
            nodeSizes(state.nodes),
            positionsOf(state.nodes, ignored),
            toPlace,
            { collapsed },
            this.getLayoutTree(map),
        );
        return withPositions(state.nodes, placed);
    }

    /**
     * Collapses or expands the sub pages of a page (the button on the node). Expanded pages that
     * have only a provisional position are placed next to it. Remembered per panel.
     *
     * @param nodeId The page.
     */
    private toggleCollapse = (nodeId: string): void => {
        this.setState(state => {
            const map = state.navigationMap;
            if (!map) {
                return state;
            }
            const collapsed = new Set(state.collapsed);
            let nodes = state.nodes;
            if (collapsed.has(nodeId)) {
                collapsed.delete(nodeId);
                const tree = this.getLayoutTree(map);
                const before = hiddenByCollapse(tree, state.collapsed);
                const after = hiddenByCollapse(tree, collapsed);
                nodes =
                    this.placeRevealed(
                        state,
                        [...before].filter(id => !after.has(id)),
                        collapsed,
                        shownBySwitches(state.showSystemPages, state.showStates),
                    ) ?? nodes;
            } else {
                collapsed.add(nodeId);
            }
            storeCollapsed(state.selectedPanel, collapsed);
            // Kanten in den eingeklappten Unterbaum enden jetzt an anderen Anfassern - neu vermessen
            return { ...state, collapsed, nodes, internalsToken: state.internalsToken + 1 };
        });
    };

    /**
     * The home link switch - remembered per panel.
     *
     * @param _event Unused change event.
     * @param checked Whether the home links to `main` are shown.
     */
    private handleShowHomeEdgesChange = (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean): void => {
        if (this.state.selectedPanel) {
            storeShowHomeEdges(this.state.selectedPanel, checked);
        }
        this.setState(state => ({ showHomeEdges: checked, internalsToken: state.internalsToken + 1 }));
    };

    // Arrow function: the checkbox calls the handler without `this`
    handleShowSystemPagesChange = (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean): void => {
        if (!checked) {
            this.setState(state => ({ showSystemPages: false, internalsToken: state.internalsToken + 1 }));
            return;
        }
        // System pages without a saved position are placed now, around what is already shown -
        // `///unlock` is shown anyway and stays where it is
        this.setState(state => {
            const systemPages = state.nodes
                .filter(n => n.id.startsWith('///') && n.id !== servicePageName)
                .map(n => n.id);
            const nodes =
                this.placeRevealed(state, systemPages, state.collapsed, shownBySwitches(true, state.showStates)) ??
                state.nodes;
            return { ...state, showSystemPages: true, nodes, internalsToken: state.internalsToken + 1 };
        });
    };

    /**
     * Turns the state nodes on or off.
     *
     * State nodes without a saved position are placed in the outer column right of all pages, at
     * the height of the page that uses them. The pages themselves are left where they are.
     *
     * @param _event Unused change event.
     * @param checked Whether the state nodes should be shown.
     */
    handleShowStatesChange(_event: React.ChangeEvent<HTMLInputElement>, checked: boolean): void {
        if (!checked) {
            this.setState(state => ({ showStates: false, internalsToken: state.internalsToken + 1 }));
            return;
        }
        this.setState(state => {
            const states = state.nodes.filter(n => n.data.entry?.nodeType === 'stateRef').map(n => n.id);
            const nodes =
                this.placeRevealed(state, states, state.collapsed, shownBySwitches(state.showSystemPages, true)) ??
                state.nodes;
            return { ...state, showStates: true, nodes, internalsToken: state.internalsToken + 1 };
        });
    }

    /**
     * Icon markup of the info panel, by field. An icon set in the configuration is shown as itself,
     * not only by name.
     */
    private getInfoIcons(): Record<string, string[]> | undefined {
        const data = this.state.infoData;
        if (!data) {
            return undefined;
        }
        const result: Record<string, string[]> = {};
        for (const field of ['icon_true', 'icon_false']) {
            const names = typeof data[field] === 'string' ? data[field].split(', ') : [];
            const svgs = names
                .map((name: string) => iconSvg(name))
                .filter((svg: string | undefined): svg is string => !!svg);
            if (svgs.length) {
                result[field] = svgs;
            }
        }
        return Object.keys(result).length ? result : undefined;
    }

    /**
     * Entry a node of the flow stands for.
     *
     * @param nodeId Id of the node, `undefined` when none is selected.
     * @returns The entry, or `undefined` when the node is unknown.
     */
    private entryOfNode(nodeId: string | undefined): NavigationMapEntry | undefined {
        return nodeId ? this.state.nodes.find(n => n.id === nodeId)?.data.entry : undefined;
    }

    /**
     * States the icons of the info panel are read from, by field of the panel.
     *
     * Only fields whose icon comes from a state are listed - a constant icon is known by name and
     * needs no explanation.
     *
     * @returns The state ids per field, or `undefined` when no icon is read from a state.
     */
    private getInfoIconStates(): Record<string, string[]> | undefined {
        const entry = this.entryOfNode(this.state.infoNodeId);
        const info = entry?.nodeType === 'stateRef' ? entry.stateInfo : undefined;
        const fields: [string, string[] | undefined][] = [
            ['icon_true', info?.iconStatesTrue],
            ['icon_false', info?.iconStatesFalse],
        ];
        const result: Record<string, string[]> = {};
        for (const [field, ids] of fields) {
            if (ids?.length) {
                result[field] = ids;
            }
        }
        return Object.keys(result).length ? result : undefined;
    }

    /**
     * Hint next to an icon row naming where that icon comes from, by field of the panel.
     *
     * The row shows what the panel shows: the current value of the state. The hint says which state
     * that is, by its last segment - the full id is listed among the used states anyway.
     *
     * @returns The hint per field, or `undefined` when no icon is read from a state.
     */
    private getInfoIconHints(): Record<string, string> | undefined {
        const states = this.getInfoIconStates();
        if (!states) {
            return undefined;
        }
        const hints: Record<string, string> = {};
        for (const [field, ids] of Object.entries(states)) {
            const names = ids.map(id => id.split('.').pop() || id);
            hints[field] = I18n.t('icon_from_state').replace('%s', names.join(', '));
        }
        return hints;
    }

    /**
     * Reads the icons the panel currently displays into the info panel.
     *
     * A constant icon is known upfront, one read from a state is whatever that state holds right
     * now. Those values are fetched after the panel opened, so a click never waits for them, and
     * are dropped when another node was selected in the meantime. Each node is read once - dragging
     * a node keeps firing change events and must not fire a request with each of them.
     *
     * @param nodeId Node the icons are read for.
     * @returns Nothing; the info panel is updated once the values are known.
     */
    private async loadInfoIconValues(nodeId: string): Promise<void> {
        if (this.iconValuesLoadedFor === nodeId) {
            return;
        }
        this.iconValuesLoadedFor = nodeId;
        const entry = this.entryOfNode(nodeId);
        const info = entry?.nodeType === 'stateRef' ? entry.stateInfo : undefined;
        const ids = [...(info?.iconStatesTrue ?? []), ...(info?.iconStatesFalse ?? [])];
        const socket = this.props.oContext.socket;
        if (!ids.length || !socket || typeof socket.getState !== 'function') {
            return;
        }
        const values = Object.fromEntries(
            await Promise.all(
                ids.map(async (id): Promise<[string, string]> => {
                    try {
                        const value = (await socket.getState(id))?.val;
                        return [id, value === null || value === undefined ? '' : String(value)];
                    } catch {
                        // Den Datenpunkt gibt es nicht (mehr) - dann zeigt das Panel auch kein Icon
                        return [id, ''];
                    }
                }),
            ),
        );
        // Zwischenzeitlich wurde ein anderer Knoten angeklickt - das Ergebnis ist überholt
        if (this.state.infoNodeId !== nodeId) {
            return;
        }
        this.setState({ infoData: this.buildInfoData(entry, values), infoIconValues: values });
    }

    /**
     * Title of the info panel - a state node is not a page, so it must not say so.
     */
    private getInfoTitle(): string {
        const entry = this.entryOfNode(this.state.infoNodeId);
        if (entry?.nodeType !== 'stateRef') {
            return I18n.t('Page Info');
        }
        return entry.isChannel ? I18n.t('channel_info') : I18n.t('state_info');
    }

    /**
     * Content of the info panel for a node.
     *
     * A page is shown with its name first, then its headline and the rest of the page info. A node
     * standing for a state carries only that state - the page it leads to is not known here.
     *
     * @param entry Entry of the clicked node.
     * @param iconValues Current values of the states the icons are read from, by state id.
     * `undefined` while they are still being read.
     */
    private buildInfoData(
        entry: NavigationMapEntry | undefined,
        iconValues?: Record<string, string>,
    ): Record<string, any> | null {
        if (!entry) {
            return null;
        }
        if (entry.nodeType === 'stateRef') {
            const id = entry.stateId ?? entry.page;
            const info = entry.stateInfo;
            const list = (values: string[] | undefined): string | undefined =>
                values?.length ? values.join(', ') : undefined;
            /**
             * The icons of one field: the constants of the configuration, plus what the states the
             * other icons are read from hold right now - that is what the panel displays.
             *
             * A state holding nothing means the panel shows no icon; saying so beats an empty line,
             * which would look like a fault. Without an icon at all there is nothing to explain and
             * the row stays away.
             *
             * @param constIcons Icons set as a constant.
             * @param iconStates States the remaining icons are read from.
             * @returns The text of the row, or `undefined` when there is no row.
             */
            const iconRow = (
                constIcons: string[] | undefined,
                iconStates: string[] | undefined,
            ): string | undefined => {
                const names = [...(constIcons ?? [])];
                for (const stateId of iconStates ?? []) {
                    const value = iconValues?.[stateId];
                    if (value) {
                        names.push(value);
                    }
                }
                if (names.length) {
                    return names.join(', ');
                }
                if (!iconStates?.length) {
                    return undefined;
                }
                // Solange die Werte gelesen werden, bleibt die Zeile leer statt "leer" zu behaupten
                return iconValues ? I18n.t('icon_value_empty') : '';
            };
            // Nur gesetzte Angaben zeigen - eine leere Zeile sagt nichts aus
            // Der Schalter 'Wert statt Icon' schlägt sich in der Rolle des Elements nieder
            const displayKey = info?.roles.includes('textNotIcon')
                ? 'value_display_value'
                : info?.roles.includes('iconNotText')
                  ? 'value_display_icon'
                  : undefined;
            const fields: Record<string, string | undefined> = {
                [entry.isChannel ? 'channel_id' : 'state_id']: id,
                headline: list(info?.headlines),
                value_display: displayKey ? I18n.t(displayKey) : undefined,
                role: list(info?.roles),
                itemType: list(info?.types),
                icon_true: iconRow(info?.iconsTrue, info?.iconStatesTrue),
                icon_false: iconRow(info?.iconsFalse, info?.iconStatesFalse),
                used_states: list(info?.states),
            };
            return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
        }
        // The headline is part of pageInfo but belongs next to the name, so it is pulled forward
        const { headline, ...rest } = entry.pageInfo ?? {};
        return {
            uniqueName: entry.page,
            ...(headline ? { headline } : {}),
            ...rest,
        };
    }

    onNodeClick(_event: any, node: any): void {
        const nodeId: unknown = node?.id;
        // Ein Klick liest die Werte neu - sie koennen sich seit dem letzten Blick geaendert haben.
        // Die Sperre bleibt dem Ziehen vorbehalten, das dieselbe Auswahl dutzendfach meldet.
        this.iconValuesLoadedFor = undefined;
        this.setState({
            infoPanelOpen: true,
            infoData: this.buildInfoData(node?.data?.entry),
            infoNodeId: node.id,
            infoIconValues: undefined,
        });
        // Icons aus Datenpunkten werden nachgereicht - der Klick soll nicht darauf warten
        if (typeof nodeId === 'string') {
            void this.loadInfoIconValues(nodeId);
        }
    }

    onPaneClick(): void {
        this.iconValuesLoadedFor = undefined;
        this.setState({ infoPanelOpen: false, infoData: null, infoNodeId: undefined, infoIconValues: undefined });
    }

    /**
     * `uniqueName` of the admin entry behind the node the info panel currently shows.
     *
     * Only pages coming from the admin have one - for script and system pages there is nothing to
     * jump to.
     */
    private getInfoAdminPageName(): string | undefined {
        const { infoNodeId, nodes } = this.state;
        if (!infoNodeId) {
            return undefined;
        }
        return nodes.find(n => n.id === infoNodeId)?.data.entry?.adminPageName;
    }

    /** Saves pending changes and opens the page configuration of the selected admin page */
    private openPageConfigForInfoNode = (): void => {
        const adminPageName = this.getInfoAdminPageName();
        if (!adminPageName) {
            return;
        }
        // The other tab remounts this view, so unsaved node positions would be lost
        if (this.state.dirty) {
            void this.saveNavigation();
        }
        openPageConfig(adminPageName);
    };

    // eslint-disable-next-line @typescript-eslint/require-await
    async componentDidMount(): Promise<void> {
        void this.subscribeAlive();
        this.fetchNavigation();
        // Autosave-Intervall starten
        this.autosaveInterval = setInterval(() => {
            if (this.state.dirty) {
                void this.saveNavigation();
            }
        }, 10000);

        // Autosave beim Tabwechsel oder Schließen
        window.addEventListener('beforeunload', this.handleBeforeUnload);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        // detect touch devices for a small UI hint
        try {
            const isTouch =
                typeof window !== 'undefined' &&
                ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
            this.setState({ isTouchDevice: !!isTouch });
        } catch {
            // ignore
        }
    }

    componentWillUnmount(): void {
        this.clearRestartTimer();
        const socket = this.props.oContext.socket;
        if (socket && typeof socket.unsubscribeState === 'function') {
            void socket.unsubscribeState(this.aliveStateId(), this.onAliveChanged);
        }
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
        }
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        // Beim Verlassen speichern, falls dirty
        if (this.state.dirty) {
            void this.saveNavigation();
        }
    }

    private aliveStateId(): string {
        return `system.adapter.${ADAPTER_NAME}.${this.props.oContext.instance ?? '0'}.alive`;
    }

    /**
     * Reads the alive state once and subscribes to it - a poll would miss the short offline
     * moment of a restart.
     */
    private async subscribeAlive(): Promise<void> {
        const socket = this.props.oContext.socket;
        if (!socket || typeof socket.getState !== 'function' || typeof socket.subscribeState !== 'function') {
            return;
        }
        try {
            const state = await socket.getState(this.aliveStateId());
            this.lastAlive = !!state?.val;
            this.setState({ alive: this.lastAlive });
            await socket.subscribeState(this.aliveStateId(), this.onAliveChanged);
        } catch (e) {
            console.error('[NavigationView] Cannot read or subscribe the alive state:', e);
        }
    }

    /**
     * The adapter went offline or came back. Back after a restart (e.g. after "save" in the admin)
     * its navigation is read again - see {@link startRestartReload}.
     *
     * @param _id State id, unused.
     * @param state The alive state.
     */
    private onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const alive = !!state?.val;
        const wasAlive = this.lastAlive;
        this.lastAlive = alive;
        if (alive !== this.state.alive) {
            this.setState({ alive });
        }
        if (alive && !wasAlive) {
            this.startRestartReload();
        }
    };

    private clearRestartTimer(): void {
        if (this.restartTimeout) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = undefined;
        }
    }

    /**
     * Starts the restart phase: the first read follows after 3 s, then every 2 s until the adapter
     * answers with at least one panel or 60 s are over. The current view stays as it is meanwhile.
     */
    private startRestartReload(): void {
        this.clearRestartTimer();
        this.restartDeadline = Date.now() + 60000;
        this.setState({ restarting: true });
        this.restartTimeout = setTimeout(() => void this.pollAfterRestart(), 3000);
    }

    /** One read of the restart phase - see {@link startRestartReload} */
    private async pollAfterRestart(): Promise<void> {
        this.restartTimeout = undefined;
        const panelList = await this.requestNavigation();
        if (panelList?.length) {
            this.setState({ restarting: false });
            // The adapter answers before it finished building the navigation at times - when marks
            // remain, one more read follows
            this.applyPanelList(panelList, 7000);
            return;
        }
        if (Date.now() < this.restartDeadline) {
            this.restartTimeout = setTimeout(() => void this.pollAfterRestart(), 2000);
            return;
        }
        this.setState({
            restarting: false,
            panelList: [],
            selectedPanel: '',
            navigationMap: null,
            nodes: [],
            noData: true,
        });
    }

    /**
     * Derives the `navigationMap`/`nodes` state slice for a panel list entry.
     *
     * Shared by {@link fetchNavigation} and {@link handlePanelChange} so both compute the flow
     * from a `PanelListEntry` the same way. The edges are not part of the state - they are derived
     * from the map, the (unsaved) page configuration and the edit mode in {@link getFlowEdges}.
     *
     * Nodes without a saved position are placed like "place nodes without a position" does - next
     * to the page that leads to them, around the saved ones - but keep their provisional mark. The
     * collapsed pages come from the browser storage; without a stored state the service sub tree
     * is collapsed.
     *
     * @param entry Panel list entry to derive the flow from, or `undefined` if none was found
     * @returns The `navigationMap`, `nodes`, provisional and collapsed nodes to apply to the state
     */
    private deriveFlowState(entry: PanelListEntry | undefined): {
        navigationMap: NavigationMap | null;
        nodes: FlowNode[];
        unplaced: ReadonlySet<string>;
        collapsed: ReadonlySet<string>;
        showHomeEdges: boolean;
    } {
        const map = entry?.navigationMap;
        if (!entry || !map) {
            return {
                navigationMap: entry ? entry.navigationMap : null,
                nodes: [],
                unplaced: new Set(),
                collapsed: new Set(),
                showHomeEdges: entry ? readStoredShowHomeEdges(entry.panelName) : true,
            };
        }
        const tree = this.getLayoutTree(map);
        const collapsed = new Set(readStoredCollapsed(entry.panelName) ?? defaultCollapsed(tree));
        let nodes = mapNavigationMapToFlow(map).nodes;
        const unplaced = new Set(
            map
                .filter(e => !e.position || typeof e.position.x !== 'number' || typeof e.position.y !== 'number')
                .map(e => e.page),
        );
        if (unplaced.size) {
            const placed = placeNewNodes(
                map,
                nodeSizes(nodes),
                positionsOf(nodes, unplaced),
                unplaced,
                { collapsed },
                tree,
            );
            nodes = withPositions(nodes, placed);
        }
        return {
            navigationMap: map,
            nodes,
            unplaced,
            collapsed,
            showHomeEdges: readStoredShowHomeEdges(entry.panelName),
        };
    }

    /** The "refresh" button: reads the navigation again, unsaved link changes stay */
    private handleRefreshClick = (): void => {
        this.fetchNavigation();
    };

    /**
     * Asks the adapter for the navigation of all panels.
     *
     * @returns The panel list, or `undefined` when the adapter did not answer within 3 s or sent
     * no list.
     */
    private requestNavigation(): Promise<PanelListEntry[] | undefined> {
        const instance = this.props.oContext.instance ?? '0';
        const request = this.props.oContext.socket
            .sendTo(`${ADAPTER_NAME}.${instance}`, SENDTO_GET_PANEL_NAVIGATION_COMMAND, null)
            .then((res: { result?: PanelListEntry[] }): PanelListEntry[] | undefined =>
                res && Array.isArray(res.result) ? res.result : undefined,
            )
            .catch((): undefined => undefined);
        const timeout = new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), 3000));
        return Promise.race([request, timeout]);
    }

    /**
     * Takes a freshly read panel list into the state. Pages whose links the new data already
     * reflects lose their unsaved mark, whoever triggered the read.
     *
     * @param result Panel list as the adapter sent it.
     * @param retryIfTouchedMs When marks remain, read once more after this many milliseconds.
     */
    private applyPanelList(result: PanelListEntry[], retryIfTouchedMs?: number): void {
        // PanelList mit friendlyName übernehmen; ein älterer Adapter liefert noch kein
        // panelTopic - dann wird es aus der Panel-Tabelle der Instanz nachgeschlagen
        const panelList: PanelListEntry[] = result.map(p => ({
            panelName: p.panelName,
            friendlyName: p.friendlyName || p.panelName,
            panelTopic: p.panelTopic || this.lookupPanelTopic(p.panelName),
            navigationMap: p.navigationMap,
        }));
        // Zuletzt gewähltes Panel bevorzugen, falls es noch existiert - sonst wie bisher das erste
        const storedPanelName = readStoredSelectedPanel();
        const storedEntry = storedPanelName ? panelList.find(p => p.panelName === storedPanelName) : undefined;
        const selectedEntry = storedEntry || panelList[0];
        const selectedPanel = selectedEntry?.panelName || '';
        const flowState = this.deriveFlowState(selectedEntry);
        this.setState(
            state => ({
                panelList,
                selectedPanel,
                ...flowState,
                noData: false,
                dirty: false,
                touched: this.reconcileTouched(state.touched, panelList),
                editMenu: undefined,
                internalsToken: state.internalsToken + 1,
            }),
            () => {
                this.checkStaleOverrides(selectedEntry);
                if (retryIfTouchedMs && [...this.state.touched.values()].some(set => set.size > 0)) {
                    this.clearRestartTimer();
                    this.restartTimeout = setTimeout(() => {
                        this.restartTimeout = undefined;
                        this.fetchNavigation();
                    }, retryIfTouchedMs);
                }
            },
        );
    }

    /** Reads the navigation of all panels from the adapter - at mount and on "refresh" */
    fetchNavigation(): void {
        this.setState({ loading: true, noData: false });
        void this.requestNavigation().then(result => {
            this.setState({ loading: false });
            if (result) {
                this.applyPanelList(result);
            } else {
                this.setState({
                    panelList: [],
                    selectedPanel: '',
                    navigationMap: null,
                    nodes: [],
                    noData: true,
                });
            }
        });
    }

    handlePanelChange(event: SelectChangeEvent<string>, _child?: React.ReactNode): void {
        // Beim Panel-Wechsel speichern, falls dirty
        if (this.state.dirty) {
            void this.saveNavigation();
        }
        const panelName = event.target.value;
        const found = this.state.panelList.find(p => p.panelName === panelName);
        // console.log('[NavigationView] Panel gewechselt:', panelName, found);
        storeSelectedPanel(panelName);
        const flowState = this.deriveFlowState(found);
        this.setState({
            selectedPanel: panelName,
            ...flowState,
            dirty: false,
            editMenu: undefined,
            scopeDialog: undefined,
        });
        this.setState(state => ({ internalsToken: state.internalsToken + 1 }));
        this.checkStaleOverrides(found);
    }

    onNodesChange(changes: any[]): void {
        if (changes.some(change => change.type === 'position')) {
            // Show info panel for the moved node(s) (use first position change)
            const posChange = changes.find(c => c.type === 'position');
            const movedId = posChange?.id;
            this.setState(state => {
                const newNodes = applyNodeChanges(changes, state.nodes);
                const moved = newNodes.find(n => n.id === movedId);
                // A node moved by hand has its position for good
                const movedIds = changes.filter(c => c.type === 'position').map(c => String(c.id));
                const unplaced = movedIds.some(id => state.unplaced.has(id))
                    ? new Set([...state.unplaced].filter(id => !movedIds.includes(id)))
                    : state.unplaced;
                // Die gelesenen Icons gehören zum bisherigen Knoten, nicht zu einem anderen
                const iconValues = movedId === state.infoNodeId ? state.infoIconValues : undefined;
                return {
                    nodes: newNodes,
                    unplaced,
                    dirty: true,
                    infoPanelOpen: true,
                    infoData: this.buildInfoData(moved?.data?.entry, iconValues),
                    infoNodeId: movedId,
                    infoIconValues: iconValues,
                };
            });
            if (typeof movedId === 'string') {
                void this.loadInfoIconValues(movedId);
            }
        } else {
            this.setState(state => ({
                nodes: applyNodeChanges(changes, state.nodes),
            }));
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Edit mode: prev/next/home/parent of admin pages are set by drawing connections
    // ---------------------------------------------------------------------------------------------

    /**
     * Drops the unsaved mark of every page whose links the freshly read navigation already
     * reflects - the adapter restarted and applied the saved configuration.
     *
     * @param touched Marks by panel name.
     * @param panelList The navigation just read.
     * @returns The remaining marks.
     */
    private reconcileTouched(
        touched: Map<string, ReadonlySet<string>>,
        panelList: PanelListEntry[],
    ): Map<string, ReadonlySet<string>> {
        const pageConfig = this.getPageConfig();
        const overrides = this.getNavigationOverrides();
        const result = new Map<string, ReadonlySet<string>>();
        for (const [panelName, pages] of touched) {
            const panel = panelList.find(p => p.panelName === panelName);
            if (!panel || !panel.panelTopic) {
                result.set(panelName, pages);
                continue;
            }
            const remaining = new Set(
                [...pages].filter(
                    page => !isNavigationApplied(panel.navigationMap, pageConfig, panel.panelTopic, page, overrides),
                ),
            );
            if (remaining.size) {
                result.set(panelName, remaining);
            }
        }
        return result;
    }

    /**
     * Shows a translated warning in the snackbar.
     *
     * @param key Translation key.
     */
    private showNotice(key: string): void {
        this.setState({ notice: I18n.t(key) });
    }

    private closeNotice = (): void => {
        this.setState({ notice: undefined });
    };

    /** Page configuration of the instance as the admin holds it right now - unsaved changes included */
    private getPageConfig(): PageConfigEntry[] {
        const config: PageConfigEntry[] | undefined = this.props.data?.pageConfig;
        return Array.isArray(config) ? config : [];
    }

    /** Navigation overrides of the script pages as the admin holds them right now - unsaved changes included */
    private getNavigationOverrides(): NavigationOverride[] {
        const overrides: NavigationOverride[] | undefined = this.props.data?.navigationOverrides;
        return Array.isArray(overrides) ? overrides : NO_OVERRIDES;
    }

    /**
     * Topic of a panel from the panel table of the instance - fallback for an adapter that does not
     * report `panelTopic` with the navigation yet.
     *
     * @param panelName Name of the panel as reported with the navigation.
     * @returns The topic, or an empty string when the panel is not in the table.
     */
    private lookupPanelTopic(panelName: string): string {
        const panels: { topic?: string; name?: string }[] | undefined = this.props.data?.panels;
        if (!Array.isArray(panels)) {
            return '';
        }
        const found = panels.find(
            p => p && (p.name === panelName || p.topic === panelName || p.topic?.split('/').pop() === panelName),
        );
        return found?.topic ?? '';
    }

    /** Topic of the selected panel - the key its pages are assigned under */
    private getSelectedPanelTopic(): string | undefined {
        return this.state.panelList.find(p => p.panelName === this.state.selectedPanel)?.panelTopic || undefined;
    }

    /** Nodes of the selected panel whose links were changed but not saved yet */
    private getTouched(): ReadonlySet<string> {
        return this.state.touched.get(this.state.selectedPanel) ?? NO_TOUCHED;
    }

    /**
     * A page created from the admin configuration - its links are written to `pageConfig`.
     *
     * @param entry Entry of the node.
     */
    private isAdminEntry(
        entry: NavigationMapEntry | undefined,
    ): entry is NavigationMapEntry & { adminPageName: string } {
        return (
            !!entry &&
            entry.nodeType !== 'stateRef' &&
            !entry.generated &&
            entry.origin === 'admin' &&
            !!entry.adminPageName
        );
    }

    /**
     * A page of the configuration script (of the panel or the global one) the adapter reported
     * script links for - its links are written as an override to `navigationOverrides`. A page
     * the adapter generated from a page item is read-only.
     *
     * @param entry Entry of the node.
     */
    private isScriptEntry(
        entry: NavigationMapEntry | undefined,
    ): entry is NavigationMapEntry & { scriptLinks: NavigationLinks } {
        return (
            !!entry &&
            entry.nodeType !== 'stateRef' &&
            !entry.generated &&
            (entry.origin === 'script' || entry.origin === 'global') &&
            !!entry.scriptLinks
        );
    }

    /**
     * A page whose links can be edited here: an admin page or a script page, but never a
     * generated one.
     *
     * @param entry Entry of the node.
     */
    private isEditableEntry(entry: NavigationMapEntry | undefined): boolean {
        return this.isAdminEntry(entry) || this.isScriptEntry(entry);
    }

    /**
     * An edge that stands for one editable link: one of the four navigation links of an admin page.
     *
     * @param edge Edge of the flow.
     */
    private isEditableEdge(edge: FlowEdge): boolean {
        return isNavigationLinkKind(edge.data?.navType) && this.isEditableEntry(this.entryOfNode(edge.source));
    }

    /**
     * A node a link may point to: a page of the panel other than the source.
     *
     * @param sourceNodeId Node the link starts at.
     * @param targetNodeId Node under the pointer, if any.
     */
    private isValidLinkTarget(sourceNodeId: string, targetNodeId: string | undefined): targetNodeId is string {
        if (!targetNodeId || targetNodeId === sourceNodeId) {
            return false;
        }
        const target = this.entryOfNode(targetNodeId);
        return !!target && target.nodeType !== 'stateRef';
    }

    /**
     * Whether a stored link target names the node shown in the flow. The start page is stored
     * under the name of its entry but shown as `main`.
     *
     * @param stored Target as stored in the configuration.
     * @param nodeId Node id in the flow.
     */
    private storedTargetIs(stored: string | undefined, nodeId: string | undefined): boolean {
        if (!stored || !nodeId) {
            return stored === nodeId;
        }
        if (stored === nodeId) {
            return true;
        }
        return (
            nodeId === mainPageName &&
            this.getPageConfig().some(e => e && e.uniqueName === stored && isMainPageEntry(e))
        );
    }

    /**
     * Whether a link shown in the flow is stored in the configuration - only then it can be
     * removed. A link the adapter derived (default home, prev/next chaining) is not.
     *
     * @param sourceNodeId Node the link starts at.
     * @param kind Which link.
     * @param target Node the link points to.
     */
    private isConfiguredLink(sourceNodeId: string, kind: NavigationLinkKind, target: string): boolean {
        const entry = this.entryOfNode(sourceNodeId);
        const panelTopic = this.getSelectedPanelTopic();
        const { navigationMap } = this.state;
        if (!panelTopic || !navigationMap) {
            return false;
        }
        // The chaining of admin pages decides this link ahead of the configuration - removing the
        // configured value here would bring the edge right back
        if (
            (kind === 'prev' || kind === 'next') &&
            adapterDecidedLink(
                navigationMap,
                this.getPageConfig(),
                panelTopic,
                sourceNodeId,
                kind,
                this.getNavigationOverrides(),
            )
        ) {
            return false;
        }
        let stored: string | undefined;
        if (this.isAdminEntry(entry)) {
            const configEntry = this.getPageConfig().find(e => e && e.uniqueName === entry.adminPageName);
            stored = configEntry ? effectiveNavigation(configEntry, panelTopic)?.[kind] : undefined;
        } else if (this.isScriptEntry(entry)) {
            // The override when there is one, else the script - both are "configured"
            stored = effectiveScriptLinks(entry, this.getNavigationOverrides(), panelTopic)?.[kind];
        } else {
            return false;
        }
        return !!stored && this.storedTargetIs(stored, target);
    }

    /**
     * Edges of the flow: the map the adapter reported, overlaid with the unsaved configuration of
     * the touched pages. In edit mode every edge stands for one link of the configuration and the
     * edges of admin pages can be dragged to another page.
     *
     * Derived, not kept in the state: it depends on the map, the page configuration of the admin,
     * the touched pages and the edit mode, and every one of them changes elsewhere. The result is
     * cached until one of the inputs changes, so dragging a node does not rebuild it.
     */
    private getFlowEdges(): FlowEdge[] {
        const { navigationMap, editing } = this.state;
        if (!navigationMap) {
            return [];
        }
        const pageConfig = this.getPageConfig();
        const overrides = this.getNavigationOverrides();
        const panelTopic = this.getSelectedPanelTopic();
        const touched = this.getTouched();
        const cache = this.edgesCache;
        if (
            cache &&
            cache.map === navigationMap &&
            cache.pageConfig === pageConfig &&
            cache.overrides === overrides &&
            cache.panelTopic === panelTopic &&
            cache.touched === touched &&
            cache.editing === editing
        ) {
            return cache.edges;
        }
        const map =
            panelTopic && touched.size
                ? applyNavigationOverlay(navigationMap, pageConfig, panelTopic, touched, overrides)
                : navigationMap;
        let edges = mapNavigationMapToFlow(map, { mergeReciprocal: !editing }).edges;
        if (editing) {
            // Only the target end of an editable edge can be dragged; every other edge says so
            // explicitly, as an edge without the flag would inherit `edgesReconnectable`
            edges = edges.map(edge => {
                const kind = edge.data?.navType;
                if (!isNavigationLinkKind(kind) || !this.isEditableEdge(edge)) {
                    return { ...edge, reconnectable: false };
                }
                // A link the adapter derived (default home, chaining) is not in the configuration
                // and drawn pale - removing the configured counterpart leaves it visible
                const derived = !this.isConfiguredLink(edge.source, kind, edge.target);
                return {
                    ...edge,
                    reconnectable: 'target',
                    className: `${edge.className ?? ''} edge-editable${derived ? ' edge-derived' : ''}`.trim(),
                };
            });
        }
        this.edgesCache = { map: navigationMap, pageConfig, overrides, panelTopic, touched, editing, edges };
        return edges;
    }

    /**
     * Edges from a visible page into a collapsed sub tree, drawn to the collapsed page instead -
     * once per source, kind and collapsed page. They are view only: no menu, not reconnectable.
     * Edges inside a collapsed sub tree or out of it are left out (back links like home/parent
     * from the hidden pages would only repeat the tree).
     *
     * @param edges All edges of the flow.
     * @param tree Layout tree of the map.
     * @param hidden Nodes hidden by collapsing.
     * @param visible Nodes shown.
     * @returns The redirected edges.
     */
    private redirectCollapsedEdges(
        edges: readonly FlowEdge[],
        tree: LayoutTree,
        hidden: ReadonlySet<string>,
        visible: ReadonlySet<string>,
    ): FlowEdge[] {
        if (!hidden.size) {
            return [];
        }
        // Layout-Elternseite jeder Seite, um zur sichtbaren eingeklappten Seite hochzulaufen
        const owner = new Map<string, string>();
        for (const [page, kids] of tree.kids) {
            for (const kid of kids) {
                for (const n of kid.chain.nodes) {
                    owner.set(n, page);
                }
            }
        }
        const visibleAncestor = (id: string): string | undefined => {
            let cur: string | undefined = id;
            while (cur && hidden.has(cur)) {
                cur = owner.get(cur);
            }
            return cur;
        };
        const out: FlowEdge[] = [];
        const seen = new Set<string>();
        for (const edge of edges) {
            if (hidden.has(edge.source) || !hidden.has(edge.target) || !visible.has(edge.source)) {
                continue;
            }
            const target = visibleAncestor(edge.target);
            if (!target || target === edge.source || !visible.has(target)) {
                continue;
            }
            const kind = edge.data?.navType ?? 'target';
            const key = `${edge.source}|${kind}|${target}`;
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            out.push({
                ...edge,
                id: `${edge.id}-collapsed-${target}`,
                target,
                // Am eingeklappten Knoten endet die Kante immer links in der Mitte
                targetHandle: 'targetLeft',
                style: { ...edge.style, strokeDasharray: '2 4' },
                data: { isTarget: true, navType: edge.data?.navType, redirected: true },
                className: `${edge.className ?? ''} edge-collapsed`.trim(),
                reconnectable: false,
            });
        }
        return out;
    }

    /**
     * Adds what the node component needs to know to each node: the handles an edge uses (and in
     * which colour), the edit mode, whether the page has unsaved changes, whether it is generated
     * and whether a navigation override of the admin exists for it (and is out of date).
     *
     * A node keeps its identity as long as neither it nor that data changes - React Flow would
     * otherwise re-adopt every node with every render, e.g. while one of them is dragged.
     *
     * @param nodes Nodes to show.
     * @param edges All edges of the flow, hidden ones included - a hidden edge still marks its handle.
     * @param collapse Pages with sub pages in the layout: collapsed or not, and how many are hidden then.
     */
    private decorateNodes(
        nodes: FlowNode[],
        edges: FlowEdge[],
        collapse: ReadonlyMap<string, { collapsed: boolean; hidden: number }>,
    ): FlowNode[] {
        const { editing } = this.state;
        const touched = this.getTouched();
        const overrides = this.getNavigationOverrides();
        const panelTopic = this.getSelectedPanelTopic();
        // Ein Handle bekommt die Farbe der ersten Kante, die es benutzt - so stimmen auch
        // beidseitige und Long-Press-Verbindungen
        const usedByNode = new Map<string, Record<string, EdgeKind | undefined>>();
        const mark = (nodeId: string, handleId: string | undefined, kind: EdgeKind | undefined): void => {
            if (!handleId) {
                return;
            }
            let used = usedByNode.get(nodeId);
            if (!used) {
                used = {};
                usedByNode.set(nodeId, used);
            }
            if (!(handleId in used) || (kind && !used[handleId])) {
                used[handleId] = kind;
            }
        };
        for (const edge of edges) {
            mark(edge.source, edge.sourceHandle, edge.data?.navType);
            mark(edge.target, edge.targetHandle, edge.data?.navType);
        }
        return nodes.map(node => {
            const used = usedByNode.get(node.id) ?? {};
            const entry = node.data.entry;
            const editable = editing && this.isEditableEntry(entry);
            const unsaved = touched.has(node.id);
            const generated = !!entry && entry.nodeType !== 'stateRef' && !!entry.generated;
            // An override the admin holds right now (saved or not), compared with the script links
            // the adapter reported - so the warning goes away as soon as the override is brought up
            // to date here. What the adapter reported about its own override is the fallback only.
            const scriptPage =
                entry &&
                entry.nodeType !== 'stateRef' &&
                !entry.generated &&
                (entry.origin === 'script' || entry.origin === 'global')
                    ? entry
                    : undefined;
            const override = panelTopic && scriptPage ? overrideOf(overrides, panelTopic, node.id) : undefined;
            let overrideState: 'active' | 'stale' | undefined;
            if (override && scriptPage) {
                const stale = scriptPage.scriptLinks
                    ? isOverrideStale(override, scriptPage.scriptLinks)
                    : !!scriptPage.override?.stale;
                overrideState = stale ? 'stale' : 'active';
            }
            const collapseInfo = collapse.get(node.id);
            const key = [
                editing,
                editable,
                unsaved,
                generated,
                overrideState ?? '',
                collapseInfo ? `${collapseInfo.collapsed}:${collapseInfo.hidden}` : '',
                ...Object.entries(used)
                    .map(([id, kind]) => `${id}=${kind ?? ''}`)
                    .sort(),
            ].join('|');
            const cached = this.nodeCache.get(node.id);
            if (cached && cached.source === node && cached.key === key) {
                return cached.node;
            }
            const decorated: FlowNode = {
                ...node,
                data: {
                    ...node.data,
                    usedHandles: used,
                    editing,
                    editable,
                    unsaved,
                    generated,
                    overrideState,
                    collapse: collapseInfo,
                    onToggleCollapse: collapseInfo ? this.toggleCollapse : undefined,
                },
            };
            this.nodeCache.set(node.id, { source: node, key, node: decorated });
            return decorated;
        });
    }

    private handleEditingChange = (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean): void => {
        this.setState(state => ({
            editing: checked,
            editMenu: undefined,
            scopeDialog: undefined,
            internalsToken: state.internalsToken + 1,
        }));
    };

    /**
     * Only a link of an admin page may be drawn, and only to another page of the panel.
     *
     * @param connection The connection being drawn, or an existing edge.
     */
    private isValidConnection = (connection: Edge | Connection): boolean => {
        if (!this.state.editing) {
            return false;
        }
        const kind = SOURCE_HANDLE_KIND[connection.sourceHandle ?? ''];
        if (!kind || !this.isEditableEntry(this.entryOfNode(connection.source))) {
            return false;
        }
        return this.isValidLinkTarget(connection.source, connection.target);
    };

    /**
     * A connection was dropped on a handle: the source handle says which link is set.
     *
     * @param connection The finished connection.
     */
    private onConnect = (connection: Connection): void => {
        if (!this.state.editing) {
            return;
        }
        const kind = SOURCE_HANDLE_KIND[connection.sourceHandle ?? ''];
        if (!kind || !this.isValidLinkTarget(connection.source, connection.target)) {
            return;
        }
        this.connectApplied = true;
        this.applyNavigationLink(connection.source, kind, connection.target);
    };

    /**
     * A connection ended without a valid handle - e.g. on the body of a node. The node under the
     * pointer is taken as target, so nobody has to hit the small handle.
     *
     * @param event Pointer event the connection ended with.
     * @param connectionState Where the connection started and whether a handle took it.
     */
    private onConnectEnd: OnConnectEnd = (
        event: MouseEvent | TouchEvent,
        connectionState: FinalConnectionState,
    ): void => {
        const applied = this.connectApplied;
        this.connectApplied = false;
        if (!this.state.editing || applied || connectionState.isValid === true) {
            return;
        }
        const sourceNodeId = connectionState.fromNode?.id;
        const kind = SOURCE_HANDLE_KIND[connectionState.fromHandle?.id ?? ''];
        if (!sourceNodeId || !kind) {
            return;
        }
        const point = 'changedTouches' in event ? event.changedTouches[0] : event;
        if (!point) {
            return;
        }
        const nodeElement = document.elementFromPoint(point.clientX, point.clientY)?.closest('.react-flow__node');
        const targetNodeId = nodeElement instanceof HTMLElement ? nodeElement.dataset.id : undefined;
        if (!this.isValidLinkTarget(sourceNodeId, targetNodeId)) {
            return;
        }
        this.applyNavigationLink(sourceNodeId, kind, targetNodeId);
    };

    /**
     * The target end of an edge was dragged to another handle. A drop into the void leaves the
     * edge as it is - a link is removed through its menu only.
     *
     * @param oldEdge The edge before the drag.
     * @param connection Where it was dropped.
     */
    private onReconnect: OnReconnect = (oldEdge: Edge, connection: Connection): void => {
        if (!this.state.editing) {
            return;
        }
        const kind = oldEdge.data?.navType;
        if (
            !isNavigationLinkKind(kind) ||
            connection.source !== oldEdge.source ||
            !this.isEditableEntry(this.entryOfNode(oldEdge.source))
        ) {
            return;
        }
        if (connection.target === oldEdge.target || !this.isValidLinkTarget(connection.source, connection.target)) {
            return;
        }
        this.connectApplied = true;
        this.applyNavigationLink(connection.source, kind, connection.target);
    };

    /**
     * Edit mode: a click on an editable edge opens its menu at the pointer.
     *
     * @param event The click.
     * @param edge The clicked edge.
     */
    private onEdgeClick = (event: React.MouseEvent, edge: Edge): void => {
        if (!this.state.editing || edge.data?.redirected) {
            return;
        }
        if (!isNavigationLinkKind(edge.data?.navType) || !this.isEditableEntry(this.entryOfNode(edge.source))) {
            return;
        }
        // a.next = b and b.prev = a lie on top of each other - the menu offers both
        const pair = new Set([edge.source, edge.target]);
        const items: EdgeMenuItem[] = [];
        for (const other of this.getFlowEdges()) {
            const kind = other.data?.navType;
            if (!isNavigationLinkKind(kind) || !pair.has(other.source) || !pair.has(other.target)) {
                continue;
            }
            items.push({
                source: other.source,
                target: other.target,
                kind,
                removable: this.isEditableEdge(other) && this.isConfiguredLink(other.source, kind, other.target),
            });
        }
        // A script page with an override can go back to the script navigation
        const panelTopic = this.getSelectedPanelTopic();
        const overrides = this.getNavigationOverrides();
        const restorable = panelTopic
            ? [...pair].filter(
                  page => this.isScriptEntry(this.entryOfNode(page)) && overrideOf(overrides, panelTopic, page),
              )
            : [];
        this.setState({ editMenu: { x: event.clientX, y: event.clientY, items, restorable } });
    };

    private closeEditMenu = (): void => {
        this.setState({ editMenu: undefined });
    };

    /**
     * A removable entry of the edge menu was clicked - the entry carries its index in `data-index`.
     *
     * @param event The click.
     */
    private removeMenuLink = (event: React.MouseEvent<HTMLLIElement>): void => {
        const index = Number(event.currentTarget.dataset.index);
        const item = this.state.editMenu?.items[index];
        this.setState({ editMenu: undefined });
        if (item?.removable) {
            this.applyNavigationLink(item.source, item.kind, undefined);
        }
    };

    /**
     * "Restore script navigation" of the edge menu was clicked - the entry carries the page in
     * `data-page`. The override of that page is dropped, the page follows the script again.
     *
     * @param event The click.
     */
    private restoreMenuScript = (event: React.MouseEvent<HTMLLIElement>): void => {
        const page = event.currentTarget.dataset.page;
        this.setState({ editMenu: undefined });
        const panelTopic = this.getSelectedPanelTopic();
        if (!page || !panelTopic) {
            return;
        }
        const overrides = this.getNavigationOverrides();
        const updated = removeNavigationOverride(overrides, panelTopic, page);
        if (updated !== overrides) {
            this.writeNavigationOverrides(updated, [page]);
        }
    };

    /**
     * Writes the overrides to the instance configuration and marks the pages as unsaved.
     *
     * @param updated The new override list.
     * @param pages Node ids of the pages the change belongs to.
     */
    private writeNavigationOverrides(updated: readonly NavigationOverride[], pages: readonly string[]): void {
        void this.onChange('navigationOverrides', updated);
        this.markTouched(pages);
    }

    /**
     * Marks pages of the selected panel as changed but not saved yet.
     *
     * @param pages Node ids of the pages.
     */
    private markTouched(pages: readonly string[]): void {
        this.setState(state => {
            const touched = new Map(state.touched);
            const forPanel = new Set(touched.get(state.selectedPanel) ?? []);
            for (const page of pages) {
                forPanel.add(page);
            }
            touched.set(state.selectedPanel, forPanel);
            return { touched };
        });
    }

    /**
     * Sets or removes one navigation link of a page - every edit of the flow ends up here.
     *
     * Admin pages are written to the page configuration of the instance; the admin's save button
     * takes it from there. A page assigned to all panels first asks which assignment to write to.
     * Script pages get an override in `navigationOverrides`, which the adapter applies on top of
     * the script at start. Generated pages cannot be edited.
     *
     * @param sourceNodeId Node the link starts at.
     * @param kind Which link to set.
     * @param target Node the link points to, `undefined` removes the link.
     */
    applyNavigationLink(sourceNodeId: string, kind: NavigationLinkKind, target: string | undefined): void {
        const entry = this.entryOfNode(sourceNodeId);
        const panelTopic = this.getSelectedPanelTopic();
        if (this.isScriptEntry(entry)) {
            if (!panelTopic) {
                return;
            }
            const overrides = this.getNavigationOverrides();
            const updated = setOverrideLink(overrides, panelTopic, entry.page, kind, target, entry.scriptLinks);
            if (updated !== overrides) {
                this.writeNavigationOverrides(updated, [sourceNodeId]);
            }
            return;
        }
        if (!this.isAdminEntry(entry)) {
            return;
        }
        const configEntry = this.getPageConfig().find(e => e && e.uniqueName === entry.adminPageName);
        if (!panelTopic || !configEntry) {
            this.showNotice('nav_edit_not_assigned');
            return;
        }
        const change: PendingLinkChange = { sourceNodeId, uniqueName: entry.adminPageName, panelTopic, kind, target };
        switch (assignmentSourceOf(configEntry, panelTopic)) {
            case 'panel':
                this.writeNavigationLink(change, 'panel');
                break;
            case 'all': {
                const chosen = this.scopeChoice.get(`${panelTopic}|${change.uniqueName}`);
                if (chosen) {
                    this.writeNavigationLink(change, chosen);
                } else {
                    this.setState({ scopeDialog: change });
                }
                break;
            }
            default:
                // Excluded or not assigned according to the unsaved configuration - the flow still
                // shows the page from the last adapter start, there is no assignment to write to
                this.showNotice('nav_edit_not_assigned');
                break;
        }
    }

    /**
     * Writes a link change into the page configuration and marks the page as unsaved.
     *
     * @param change The link to set or remove.
     * @param scope Which assignment row to write to.
     */
    private writeNavigationLink(change: PendingLinkChange, scope: NavigationEditScope): void {
        const pageConfig = this.getPageConfig();
        const configEntry = pageConfig.find(e => e && e.uniqueName === change.uniqueName);
        if (!configEntry) {
            return;
        }
        // Already stored that way - nothing to write, nothing to mark
        const stored = effectiveNavigation(configEntry, change.panelTopic)?.[change.kind];
        if (
            assignmentSourceOf(configEntry, change.panelTopic) === scope &&
            this.storedTargetIs(stored, change.target)
        ) {
            return;
        }
        const updated = setNavigationLink(
            pageConfig,
            change.uniqueName,
            change.panelTopic,
            change.kind,
            change.target,
            scope,
        );
        if (updated === pageConfig) {
            return;
        }
        void this.onChange('pageConfig', updated);
        this.markTouched([change.sourceNodeId]);
    }

    private handleScopeAll = (): void => {
        this.resolveScope('all');
    };

    private handleScopePanel = (): void => {
        this.resolveScope('panel');
    };

    private handleScopeCancel = (): void => {
        this.setState({ scopeDialog: undefined });
    };

    /**
     * The user picked where a change of a page assigned to all panels is written to. The choice is
     * kept for the page, so the next link of it is written without asking again.
     *
     * @param scope The chosen assignment row.
     */
    private resolveScope(scope: NavigationEditScope): void {
        const change = this.state.scopeDialog;
        this.setState({ scopeDialog: undefined });
        if (!change) {
            return;
        }
        this.scopeChoice.set(`${change.panelTopic}|${change.uniqueName}`, scope);
        this.writeNavigationLink(change, scope);
    }

    /**
     * After a panel was loaded: when the adapter reports overrides whose script changed since
     * (`override.stale`) and the user has not decided on them in this session, the question is
     * asked. Only overrides the admin still holds count - one removed but not saved yet is gone.
     *
     * @param panel The panel just loaded or selected.
     */
    private checkStaleOverrides(panel: PanelListEntry | undefined): void {
        if (!panel || !panel.panelTopic || this.state.staleDialog) {
            return;
        }
        const overrides = this.getNavigationOverrides();
        const items: StaleOverrideItem[] = [];
        for (const entry of panel.navigationMap) {
            if (!entry.override?.stale || !this.isScriptEntry(entry)) {
                continue;
            }
            if (this.staleDecided.has(`${panel.panelTopic}|${entry.page}`)) {
                continue;
            }
            const override = overrideOf(overrides, panel.panelTopic, entry.page);
            if (!override) {
                continue;
            }
            items.push({
                page: entry.page,
                then: { ...(override.scriptLinks ?? {}) },
                now: { ...entry.scriptLinks },
                mine: { ...(override.navigation ?? {}) },
            });
        }
        if (items.length) {
            this.setState({
                staleDialog: { panelName: panel.friendlyName || panel.panelName, panelTopic: panel.panelTopic, items },
            });
        }
    }

    /**
     * The user decided what happens with the stale overrides listed in the dialog - for all of
     * them at once. Every decision but "later" rewrites the overrides and marks the pages as
     * unsaved; "later" only keeps the question from coming back in this session.
     *
     * @param decision The choice.
     */
    private handleStaleDecision = (decision: StaleOverrideDecision): void => {
        const dialog = this.state.staleDialog;
        this.setState({ staleDialog: undefined });
        if (!dialog) {
            return;
        }
        for (const item of dialog.items) {
            this.staleDecided.add(`${dialog.panelTopic}|${item.page}`);
        }
        if (decision === 'later') {
            return;
        }
        let overrides: readonly NavigationOverride[] = this.getNavigationOverrides();
        const before = overrides;
        for (const item of dialog.items) {
            const override = overrideOf(overrides, dialog.panelTopic, item.page);
            if (!override) {
                continue;
            }
            switch (decision) {
                case 'merge':
                    overrides = overrides.map(o =>
                        o === override
                            ? { ...o, navigation: mergeNavigationOverride(o, item.now), scriptLinks: { ...item.now } }
                            : o,
                    );
                    break;
                case 'keep':
                    overrides = overrides.map(o => (o === override ? { ...o, scriptLinks: { ...item.now } } : o));
                    break;
                case 'script':
                    overrides = removeNavigationOverride(overrides, dialog.panelTopic, item.page);
                    break;
            }
        }
        if (overrides !== before) {
            this.writeNavigationOverrides(
                overrides,
                dialog.items.map(item => item.page),
            );
        }
    };

    render(): string | React.ReactElement | null {
        const {
            alive,
            loading,
            panelList,
            selectedPanel,
            nodes,
            noData,
            showSystemPages,
            showStates,
            editing,
            editMenu,
            scopeDialog,
            staleDialog,
            notice,
            restarting,
            internalsToken,
        } = this.state;
        const edges = this.getFlowEdges();
        const touched = this.getTouched();
        const touchedCount = touched.size;
        const selectedPanelLabel = panelList.find(p => p.panelName === selectedPanel)?.friendlyName ?? selectedPanel;
        // Filter system pages (starting with ///) unless showSystemPages is true; ///unlock is always shown
        const isSystemPage = (id: string): boolean => id.startsWith('///') && id !== servicePageName;
        // Clicking a page highlights all of its connections - same look as hovering one
        const selectedNodeId = this.state.infoPanelOpen ? this.state.infoNodeId : undefined;
        const map = this.state.navigationMap;
        const tree = map ? this.getLayoutTree(map) : undefined;
        const hidden = map ? this.getHidden(map, this.state.collapsed) : new Set<string>();
        // Einklapp-Knopf an jeder Seite mit Unterseiten im Layout - nur, wenn davon auch etwas
        // angezeigt würde (die Service-Seiten unter ///unlock sind ohne "Systemseiten" ohnehin weg);
        // die Zahl nennt die Seiten, die beim Aufklappen erscheinen
        const collapse = new Map<string, { collapsed: boolean; hidden: number }>();
        if (tree) {
            for (const [page, kids] of tree.kids) {
                if (!kids.length || hidden.has(page)) {
                    continue;
                }
                const shown = subtreeOf(tree, page).filter(id => showSystemPages || !isSystemPage(id));
                if (shown.length) {
                    const collapsed = this.state.collapsed.has(page);
                    collapse.set(page, { collapsed, hidden: collapsed ? shown.length : 0 });
                }
            }
        }
        const shownBy = shownBySwitches(showSystemPages, showStates);
        const shownNodes = nodes.filter(n => !hidden.has(n.id) && shownBy(n));
        const visibleNodeIds = new Set(shownNodes.map(n => n.id));
        const redirected = tree ? this.redirectCollapsedEdges(edges, tree, hidden, visibleNodeIds) : [];
        const visibleNodes = this.decorateNodes(shownNodes, [...edges, ...redirected], collapse);
        const showHomeEdges = this.state.showHomeEdges;
        // remove dangling edges that reference missing nodes (safety for stale state); home links to
        // main can be hidden - except those of the selected page and of pages with unsaved changes
        const safeEdges = [...edges, ...redirected].filter(
            e =>
                visibleNodeIds.has(e.source) &&
                visibleNodeIds.has(e.target) &&
                (showHomeEdges ||
                    e.data?.navType !== 'home' ||
                    e.target !== 'main' ||
                    e.source === selectedNodeId ||
                    touched.has(e.source)),
        );
        // Legende für die Kantenarten
        const legend: { kind: EdgeKind; labelKey: string; dash?: string; bidirectional?: boolean }[] = [
            { kind: 'prevNext', labelKey: 'nav_legend_prev_next', bidirectional: true },
            { kind: 'next', labelKey: 'nav_legend_next' },
            { kind: 'prev', labelKey: 'nav_legend_prev' },
            { kind: 'home', labelKey: 'nav_legend_home', dash: '8 8' },
            { kind: 'parent', labelKey: 'nav_legend_parent' },
            { kind: 'target', labelKey: 'nav_legend_target', dash: '4 4' },
            { kind: 'targetLongPress', labelKey: 'nav_legend_target_long_press', dash: '4 4' },
            { kind: 'state', labelKey: 'nav_legend_state_edge', dash: '2 3' },
        ];
        return (
            <Box sx={{ width: '100%', p: 2, position: 'relative' }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        mb: 2,
                        columnGap: 2,
                        rowGap: 1,
                        // the switches wrap as a whole instead of breaking their labels
                        '& .MuiFormControlLabel-label': { whiteSpace: 'nowrap' },
                    }}
                >
                    <Typography variant="h6">{I18n.t('Panel_Navigation')}</Typography>
                    <Box sx={{ flex: 1 }} />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={showSystemPages}
                                onChange={this.handleShowSystemPagesChange}
                                size="small"
                            />
                        }
                        label={I18n.t('show_system_pages')}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={showStates}
                                onChange={this.handleShowStatesChange}
                                size="small"
                            />
                        }
                        label={I18n.t('show_states')}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={this.state.showHomeEdges}
                                onChange={this.handleShowHomeEdgesChange}
                                size="small"
                            />
                        }
                        label={I18n.t('show_home_edges')}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={editing}
                                onChange={this.handleEditingChange}
                                disabled={!this.state.navigationMap || !this.getSelectedPanelTopic()}
                                size="small"
                            />
                        }
                        label={I18n.t('nav_edit_mode')}
                    />
                    <Button
                        variant="outlined"
                        onClick={this.handleRefreshClick}
                        disabled={loading}
                    >
                        {I18n.t('refresh')}
                    </Button>
                    <ButtonGroup
                        variant="outlined"
                        disabled={loading || !this.state.navigationMap}
                    >
                        <Button
                            onClick={this.placeNewOnly}
                            title={I18n.t('auto_layout_place_new_hint')}
                        >
                            {I18n.t('auto_layout')}
                        </Button>
                        <Button
                            size="small"
                            onClick={this.openAutoLayoutMenu}
                            aria-label={I18n.t('auto_layout_more')}
                            title={I18n.t('auto_layout_more')}
                        >
                            <ArrowDropDownIcon />
                        </Button>
                    </ButtonGroup>
                    <Menu
                        anchorEl={this.state.autoLayoutMenu}
                        open={!!this.state.autoLayoutMenu}
                        onClose={this.closeAutoLayoutMenu}
                    >
                        <MenuItem
                            onClick={this.placeNewOnly}
                            title={I18n.t('auto_layout_place_new_hint')}
                        >
                            {I18n.t('auto_layout_place_new')}
                        </MenuItem>
                        <MenuItem onClick={this.openConfirmAutoLayout}>{I18n.t('auto_layout_all')}</MenuItem>
                    </Menu>
                    <Typography
                        variant="body2"
                        color={alive ? 'success.main' : 'error.main'}
                        sx={{ ml: 2 }}
                    >
                        {alive ? I18n.t('Adapter_online') : I18n.t('Adapter_offline')}
                    </Typography>
                </Box>
                {/* Legende */}
                {/* Kantenarten und Seitenherkunft - die Herkunft nutzt die Farben der Knoten */}
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        columnGap: 1.5,
                        rowGap: 0.5,
                        mb: 1,
                    }}
                >
                    {legend.map(item => (
                        <Box
                            key={item.kind}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                            <LegendEdgePreview
                                color={EDGE_COLOR_HEX[item.kind]}
                                dash={item.dash}
                                bidirectional={item.bidirectional}
                            />
                            <Typography
                                variant="caption"
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                {I18n.t(item.labelKey)}
                            </Typography>
                        </Box>
                    ))}
                    <Divider
                        orientation="vertical"
                        flexItem
                    />
                    {NODE_STYLES.map(style => (
                        <Box
                            key={style}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                            <span
                                className={style === 'stateRef' ? 'legend-node legend-node-state-ref' : 'legend-node'}
                                style={{
                                    background: `var(${NODE_STYLE_VAR[style].bg})`,
                                    borderColor: `var(${NODE_STYLE_VAR[style].border})`,
                                }}
                            />
                            <Typography
                                variant="caption"
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                {I18n.t(NODE_STYLE_LABEL_KEY[style])}
                            </Typography>
                        </Box>
                    ))}
                    <Divider
                        orientation="vertical"
                        flexItem
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span className="legend-marker">
                            <GeneratedPageMarker />
                        </span>
                        <Typography
                            variant="caption"
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            {I18n.t('nav_edit_legend_generated')}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span className="legend-marker">
                            <OverrideMarker stale={false} />
                        </span>
                        <Typography
                            variant="caption"
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            {I18n.t('nav_edit_legend_override')}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span className="legend-marker">
                            <OverrideMarker stale />
                        </span>
                        <Typography
                            variant="caption"
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            {I18n.t('nav_edit_legend_override_stale')}
                        </Typography>
                    </Box>
                    {editing ? (
                        <>
                            <Divider
                                orientation="vertical"
                                flexItem
                            />
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {I18n.t('nav_edit_legend_hint')}
                            </Typography>
                        </>
                    ) : null}
                </Box>
                {touchedCount > 0 ? (
                    <Alert
                        severity="info"
                        sx={{ mb: 1 }}
                    >
                        {I18n.t('nav_edit_unsaved_hint')}
                    </Alert>
                ) : null}
                {restarting ? (
                    <Alert
                        severity="info"
                        icon={<CircularProgress size={18} />}
                        sx={{ mb: 1 }}
                    >
                        {I18n.t('nav_restart_waiting')}
                    </Alert>
                ) : null}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                        <CircularProgress />
                    </Box>
                ) : noData ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                        >
                            {I18n.t('No_data')}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ minWidth: 200, flex: '0 0 240px' }}>
                                <Select
                                    value={selectedPanel}
                                    onChange={this.handlePanelChange}
                                    displayEmpty
                                    fullWidth
                                    size="small"
                                >
                                    {panelList.map(panel => (
                                        <MenuItem
                                            key={panel.panelName}
                                            value={panel.panelName}
                                        >
                                            {panel.friendlyName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Box>
                            {this.state.isTouchDevice ? (
                                <Typography
                                    variant="body2"
                                    sx={{ color: 'success.main', whiteSpace: 'nowrap' }}
                                >
                                    {I18n.t('touch_hint_buttons')}
                                </Typography>
                            ) : null}
                        </Box>
                        <div className="reactflow-container">
                            {/* Global SVG defs for edge arrow markers (rendered once) */}
                            <svg
                                style={{ position: 'absolute', width: 0, height: 0, overflow: 'visible' }}
                                aria-hidden="true"
                            >
                                <defs>
                                    <EdgeArrowMarkers
                                        kind="default"
                                        size={8}
                                    />
                                    <EdgeArrowMarkers
                                        kind="target"
                                        size={10}
                                    />
                                    <EdgeArrowMarkers
                                        kind="targetLongPress"
                                        size={10}
                                    />
                                    <EdgeArrowMarkers
                                        kind="state"
                                        size={8}
                                    />
                                    <EdgeArrowMarkers
                                        kind="next"
                                        size={8}
                                    />
                                    <EdgeArrowMarkers
                                        kind="prev"
                                        size={8}
                                    />
                                    <EdgeArrowMarkers
                                        kind="prevNext"
                                        size={8}
                                        bidirectional
                                    />
                                    <EdgeArrowMarkers
                                        kind="home"
                                        size={8}
                                    />
                                    <EdgeArrowMarkers
                                        kind="parent"
                                        size={8}
                                    />
                                </defs>
                            </svg>
                            <ConfirmDialog
                                open={!!this.state.confirmAutoLayoutOpen}
                                onClose={this.closeConfirmAutoLayout}
                                onConfirm={this.confirmAutoLayout}
                                title={I18n.t('auto_layout_confirm_title')}
                                description={I18n.t('auto_layout_confirm_text')}
                                cancelText={I18n.t('auto_layout_confirm_cancel')}
                                confirmText={I18n.t('auto_layout_confirm_reorder')}
                                ariaTitleId="auto-layout-confirm-title"
                                ariaDescId="auto-layout-confirm-description"
                            />
                            <ReactFlow
                                key={selectedPanel || 'navigation-flow'}
                                nodes={visibleNodes}
                                fitView
                                minZoom={0.1}
                                nodesDraggable={true}
                                nodesConnectable={editing}
                                onNodesChange={this.onNodesChange}
                                onNodeClick={this.onNodeClick}
                                onPaneClick={this.onPaneClick}
                                nodeTypes={NODE_TYPES}
                                edgeTypes={EDGE_TYPES}
                                edges={safeEdges.map(e => ({
                                    ...e,
                                    type: 'custom',
                                    data: {
                                        isTarget: !!e.data?.isTarget,
                                        ...e.data,
                                        highlighted:
                                            !!selectedNodeId &&
                                            (e.source === selectedNodeId || e.target === selectedNodeId),
                                    },
                                }))}
                                connectionMode={editing ? ConnectionMode.Loose : ConnectionMode.Strict}
                                connectionRadius={30}
                                isValidConnection={this.isValidConnection}
                                onConnect={this.onConnect}
                                onConnectEnd={this.onConnectEnd}
                                edgesReconnectable={editing}
                                onReconnect={this.onReconnect}
                                onEdgeClick={this.onEdgeClick}
                            >
                                <Controls />
                                <Background gap={16} />
                                <NodeInternalsRefresher
                                    nodeIds={visibleNodes.map(n => n.id)}
                                    token={internalsToken}
                                />
                            </ReactFlow>
                            <Menu
                                open={!!editMenu}
                                onClose={this.closeEditMenu}
                                anchorReference="anchorPosition"
                                anchorPosition={editMenu ? { top: editMenu.y, left: editMenu.x } : undefined}
                            >
                                {(editMenu?.items ?? []).map((item, index) =>
                                    item.removable ? (
                                        <MenuItem
                                            key={`${item.kind}-${item.source}-${item.target}`}
                                            data-index={index}
                                            onClick={this.removeMenuLink}
                                        >
                                            {I18n.t('nav_edit_remove_link')
                                                .replace('%k', item.kind)
                                                .replace('%s', item.source)
                                                .replace('%t', item.target)}
                                        </MenuItem>
                                    ) : (
                                        <MenuItem
                                            key={`${item.kind}-${item.source}-${item.target}`}
                                            disabled
                                        >
                                            {`${item.kind}: ${item.source} → ${item.target} – ${I18n.t('nav_edit_link_derived')}`}
                                        </MenuItem>
                                    ),
                                )}
                                {editMenu?.restorable.length ? <Divider /> : null}
                                {(editMenu?.restorable ?? []).map(page => (
                                    <MenuItem
                                        key={`restore-${page}`}
                                        data-page={page}
                                        onClick={this.restoreMenuScript}
                                    >
                                        {I18n.t('nav_edit_restore_script').replace('%s', page)}
                                    </MenuItem>
                                ))}
                            </Menu>
                            <Snackbar
                                open={!!notice}
                                autoHideDuration={6000}
                                onClose={this.closeNotice}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                            >
                                <Alert
                                    severity="warning"
                                    onClose={this.closeNotice}
                                >
                                    {notice}
                                </Alert>
                            </Snackbar>
                            <NavigationScopeDialog
                                open={!!scopeDialog}
                                pageName={scopeDialog?.uniqueName ?? ''}
                                panelName={selectedPanelLabel}
                                onAll={this.handleScopeAll}
                                onPanel={this.handleScopePanel}
                                onCancel={this.handleScopeCancel}
                            />
                            <NavigationOverrideStaleDialog
                                open={!!staleDialog}
                                panelName={staleDialog?.panelName ?? ''}
                                items={staleDialog?.items ?? []}
                                onDecide={this.handleStaleDecision}
                            />
                            <NodePageInfoPanel
                                open={!!this.state.infoPanelOpen}
                                title={this.getInfoTitle()}
                                data={this.state.infoData}
                                iconSvgs={this.getInfoIcons()}
                                hints={this.getInfoIconHints()}
                                onOpenPageConfig={
                                    this.getInfoAdminPageName() ? this.openPageConfigForInfoNode : undefined
                                }
                            />
                        </div>
                    </>
                )}
            </Box>
        );
    }
}

interface NodeInternalsRefresherProps {
    /** Nodes whose handles are re-measured */
    nodeIds: string[];
    /** Whenever this changes, the nodes are re-measured */
    token: number | string;
}

/**
 * Makes React Flow re-measure the handles of the nodes.
 *
 * Handles that appear or disappear without the node changing its size (edit mode on/off, fresh
 * data) are not picked up by React Flow's ResizeObserver, and a connection cannot start from a
 * handle it has not measured. `updateNodeInternals` exists only as the hook
 * `useUpdateNodeInternals` (the store context is not exported, the instance of `onInit` has no
 * such method), so this is - like {@link ThemeVarsProvider} - the one place a hook is used.
 * It has to be a child of `<ReactFlow>`.
 *
 * @param props Node ids and the token that triggers the re-measure.
 */
function NodeInternalsRefresher(props: NodeInternalsRefresherProps): null {
    const { nodeIds, token } = props;
    const updateNodeInternals = useUpdateNodeInternals();
    useEffect(() => {
        // The new handles are in the DOM after this render, but their bounds are read in the next
        // frame to be safe
        const frame = requestAnimationFrame(() => updateNodeInternals(nodeIds));
        return () => cancelAnimationFrame(frame);
        // nodeIds changes identity with every render - the token alone decides when to re-measure
    }, [token]);
    return null;
}

// Optional: ThemeVarsProvider — setzt CSS-Variablen aus dem aktuellen MUI-Theme
export function ThemeVarsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    const theme = useTheme();
    useEffect(() => {
        const root = document.documentElement;
        // Node Hintergrund/Text
        root.style.setProperty('--node-bg', theme.palette.background.paper || '#fff');
        root.style.setProperty('--node-text', theme.palette.text.primary || '#000');
        root.style.setProperty('--node-border', theme.palette.divider || '#ccc');
        // Herkunftsfarben: kräftiger Rahmen, nur leicht getönte Fläche. Im dunklen Theme darf die
        // Tönung stärker sein, sonst verschwindet sie im dunklen Untergrund.
        const tint = theme.palette.mode === 'dark' ? 0.32 : 0.18;
        for (const style of NODE_STYLES) {
            if (style === 'script') {
                continue;
            }
            const color = NODE_COLOR_HEX[style];
            root.style.setProperty(NODE_STYLE_VAR[style].border, color);
            root.style.setProperty(NODE_STYLE_VAR[style].bg, alpha(color, tint));
        }
        // Blasse Kanten in eingeklappte Unterbäume: auf dunklem Grund kräftiger, sonst verschwinden sie
        root.style.setProperty('--edge-collapsed-opacity', theme.palette.mode === 'dark' ? '0.85' : '0.6');
        // Kantenfarben (Primärfarbe als Default für Kanten)
        root.style.setProperty(EDGE_COLOR_VAR.default, theme.palette.primary.main || EDGE_COLOR_HEX.default);
        // Die Kantenarten sollen KEINE Theme-Farben verwenden — feste Farben
        for (const kind of STATIC_EDGE_KINDS) {
            root.style.setProperty(EDGE_COLOR_VAR[kind], EDGE_COLOR_HEX[kind]);
        }
    }, [theme]);
    return <>{children}</>;
}

export default function WrappedNavigationView(props: ConfigGenericProps): React.ReactElement {
    return (
        <ThemeVarsProvider>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore allow passing through ConfigGenericProps to class component */}
            <NavigationView {...props} />
        </ThemeVarsProvider>
    );
}
