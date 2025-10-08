// Konstanten für Adapter-Kommunikation
import './NavigationView.css';
import type {
    NavigationMapEntry,
    NavigationMap,
    PanelListEntry,
    NavigationSavePayload,
} from '../../src/lib/types/navigation';
import { SENDTO_GET_PANEL_NAVIGATION_COMMAND, SAVE_PANEL_NAVIGATION_COMMAND } from '../../src/lib/types/navigation';

const ADAPTER_NAME = 'nspanel-lovelace-ui';
// Typ für das Rückgabeobjekt der mapNavigationMapToFlow-Funktion
interface FlowData {
    nodes: FlowNode[];
    edges: FlowEdge[];
}
// Typen für React Flow Nodes und Edges
interface FlowNode {
    id: string;
    data: { label: string; entry?: NavigationMapEntry };
    position: { x: number; y: number };
    type?: string;
    draggable?: boolean;
}

interface FlowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    label: string;
    style: { strokeWidth: number; strokeDasharray?: string; stroke?: string };
    data?: { isTarget: boolean; navType?: string };
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
import type { EdgeProps } from 'reactflow';
import ReactFlow, {
    Background,
    Controls,
    Handle,
    Position,
    applyNodeChanges,
    applyEdgeChanges,
    getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { SelectChangeEvent } from '@mui/material';
import {
    Select,
    MenuItem,
    Box,
    Button,
    Typography,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import NodePageInfoPanel from './components/NodePageInfoPanel';
import { useTheme } from '@mui/material/styles';
import { hierarchy, tree } from 'd3-hierarchy';
import React, { useEffect } from 'react';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { I18n } from '@iobroker/adapter-react-v5';
// Typdefinitionen für panelConfig (vereinfachte Annahme)
// Siehe zentrale Typen in src/lib/types/navigation.ts
type NavigationPanelConfig = {
    panelName: string;
    friendlyName: string;
    navigationMap: NavigationMap;
};

function CustomEdge(props: EdgeProps): React.ReactElement {
    const [edgePath] = getBezierPath(props);
    const navType = String(props.data?.navType ?? '');
    const isTarget = !!props.data?.isTarget;
    const markerId = navType || (isTarget ? 'target' : 'default');

    const tooltip = `${props.data?.navType ?? ''}: ${props.source} → ${props.target}`;

    // stroke is passed via style on the FlowEdge (mapNavigationMapToFlow)
    const stroke = props.style?.stroke ?? 'var(--edge-color, #1976d2)';
    const dash = props.style?.strokeDasharray;

    return (
        <>
            <path
                id={props.id}
                d={edgePath}
                strokeWidth={props.style?.strokeWidth ?? 2}
                fill="none"
                strokeDasharray={dash}
                markerEnd={`url(#arrow-${markerId})`}
                className="react-flow__edge-path custom-edge-path"
                style={{ stroke }}
            />
            <title>{tooltip}</title>
        </>
    );
}

// Hilfsfunktion für die Umwandlung der NavigationMap in React Flow Nodes/Edges
function mapNavigationMapToFlow(navigationMap: NavigationMap): FlowData {
    const edgeColors: Record<string, string> = {
        // Fallback-Werte, CSS-Variablen werden in der UI gesetzt
        // next/prev erhalten eigene Variablen, fallen aber auf --edge-color zurück
        prev: 'var(--edge-prev, var(--edge-color, #1976d2))',
        next: 'var(--edge-next, var(--edge-color, #1976d2))',
        home: 'var(--edge-home, #fbc02d)', // gelb
        parent: 'var(--edge-parent, #d32f2f)', // rot
        target: 'var(--edge-target, #43a047)', // grün für targetPages
    };
    const nodes: FlowNode[] = navigationMap.map((entry: NavigationMapEntry, idx: number) => {
        let position: { x: number; y: number };
        if (entry.position && typeof entry.position.x === 'number' && typeof entry.position.y === 'number') {
            position = entry.position;
            // Debug: Position aus entry übernommen
            // console.debug('[mapNavigationMapToFlow] Node', entry.page, 'Position from entry:', position);
        } else {
            // Automatische Anordnung, falls keine Position geliefert
            position = { x: 100 * idx, y: 100 * (idx % 3) };
            // Debug: Fallback-Position
            // console.debug('[mapNavigationMapToFlow] Node', entry.page, 'No position, fallback:', position);
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
    for (const entry of navigationMap) {
        // next: von a1.next zu a2.prev
        if (entry.next && typeof entry.next === 'string' && pages.has(entry.next)) {
            edges.push({
                id: `nav-${entry.page}-${entry.next}-next`,
                source: entry.page,
                target: entry.next,
                sourceHandle: 'next',
                targetHandle: 'prev',
                label: '',
                style: { strokeWidth: 2, stroke: edgeColors.next },
                data: { isTarget: false, navType: 'next' },
                className: 'edge-next',
            } as any);
        }
        // prev: von a1.prev zu a2.next
        if (entry.prev && typeof entry.prev === 'string' && pages.has(entry.prev)) {
            edges.push({
                id: `nav-${entry.page}-${entry.prev}-prev`,
                source: entry.page,
                target: entry.prev,
                sourceHandle: 'prev',
                targetHandle: 'next',
                label: '',
                style: { strokeWidth: 2, stroke: edgeColors.prev },
                data: { isTarget: false, navType: 'prev' },
                className: 'edge-prev',
            } as any);
        }
        // home: von a1.home (links oben) zu a2 (rechts oben)
        if (entry.home && typeof entry.home === 'string' && pages.has(entry.home)) {
            edges.push({
                id: `nav-${entry.page}-${entry.home}-home`,
                source: entry.page,
                target: entry.home,
                sourceHandle: 'homeTopLeft',
                targetHandle: 'homeTopRight',
                label: '',
                style: { strokeWidth: 2, strokeDasharray: '8 8', stroke: edgeColors.home },
                data: { isTarget: false, navType: 'home' },
                className: 'edge-home',
            } as any);
        }
        // parent: von a1.parent (links unten) zu a2 (rechts unten)
        if (entry.parent && typeof entry.parent === 'string' && pages.has(entry.parent)) {
            edges.push({
                id: `nav-${entry.page}-${entry.parent}-parent`,
                source: entry.page,
                target: entry.parent,
                sourceHandle: 'parentBottomLeft',
                targetHandle: 'parentBottomRight',
                label: '',
                style: { strokeWidth: 2, stroke: edgeColors.parent },
                data: { isTarget: false, navType: 'parent' },
                className: 'edge-parent',
            } as any);
        }
        // targetPages: von a1 zu a2, von Mitte rechts zu Mitte links
        if (Array.isArray(entry.targetPages)) {
            for (const target of entry.targetPages) {
                if (target && typeof target === 'string' && pages.has(target)) {
                    edges.push({
                        id: `target-${entry.page}-${target}`,
                        source: entry.page,
                        target: target,
                        sourceHandle: 'targetRight',
                        targetHandle: 'targetLeft',
                        label: '',
                        style: { strokeWidth: 2, strokeDasharray: '4 4', stroke: edgeColors.target },
                        data: { isTarget: true, navType: 'target' },
                        className: 'edge-target',
                    } as any);
                }
            }
        }
    }
    return { nodes, edges };
}

// Compute a simple automatic layout: find the 'main' node (page === 'main' or first entry)
// Build trunk along prev/next links (both directions) and then place branches for other nodes.
function computeAutoLayout(navigationMap: NavigationMap): Record<string, { x: number; y: number }> {
    // Build lookup
    const mapById = new Map<string, NavigationMapEntry>();
    for (const e of navigationMap) {
        mapById.set(e.page, e);
    }

    // Determine trunk (main + prev/next chain)
    const main = navigationMap.find(e => e.page === 'main') || navigationMap[0];
    const trunk: string[] = [];
    if (main) {
        let cur: string | undefined | null = main.page;
        while (cur) {
            trunk.unshift(cur);
            const ent = mapById.get(cur);
            const prev = ent && typeof ent.prev === 'string' ? ent.prev : undefined;
            if (prev && !trunk.includes(prev)) {
                cur = prev;
            } else {
                break;
            }
        }
        cur = main.page;
        while (cur) {
            const ent = mapById.get(cur);
            const next = ent && typeof ent.next === 'string' ? ent.next : undefined;
            if (next && !trunk.includes(next)) {
                trunk.push(next);
                cur = next;
            } else {
                break;
            }
        }
    }

    // Build a pseudo-root tree where trunk nodes are direct children of root (vertical stack)
    const root: any = { id: '__root', children: [] };
    const nodeMap: Record<string, any> = {};
    // create node objects for all pages
    for (const entry of navigationMap) {
        nodeMap[entry.page] = { id: entry.page, children: [] };
    }

    // trunk as children of root in order
    for (const id of trunk) {
        const nm = nodeMap[id];
        if (nm) {
            root.children.push(nm);
        }
    }

    // attach non-trunk nodes to the nearest trunk node by BFS following prev/next (ignore home/parent)
    const findAttach = (pageId: string): string => {
        const seen = new Set<string>();
        const q: string[] = [pageId];
        while (q.length) {
            const p = q.shift() as string;
            if (trunk.includes(p)) {
                return p;
            }
            if (seen.has(p)) {
                continue;
            }
            seen.add(p);
            const ent = mapById.get(p);
            if (!ent) {
                continue;
            }
            if (ent.prev && typeof ent.prev === 'string') {
                q.push(ent.prev);
            }
            if (ent.next && typeof ent.next === 'string') {
                q.push(ent.next);
            }
        }
        return trunk[0] || pageId;
    };

    // Attach nodes using BFS expansion:
    // 1) trunk nodes are direct children of root
    // 2) For each node we process, attach its targetPages. For each target attached,
    //    collect the full prev->...->next chain and attach that chain as children of the current node
    //    (this prevents targets from creating their own extra level when they are sequences).
    // 3) Continue BFS until no more nodes can be attached. Remaining nodes are attached via findAttach fallback.
    const assigned = new Set<string>();

    // mark trunk nodes as assigned and children of root (already pushed above)
    for (const id of trunk) {
        assigned.add(id);
        // nodeMap[id] already pushed into root.children above
    }

    // helper: collect full prev->...->next chain starting from startId
    const collectChain = (startId: string): string[] => {
        // find left-most by following prev
        let left = startId;
        const seenLocal = new Set<string>();
        while (true) {
            if (seenLocal.has(left)) {
                break;
            }
            seenLocal.add(left);
            const ent = mapById.get(left);
            const p = ent && typeof ent.prev === 'string' ? ent.prev : undefined;
            if (!p || p === left) {
                break;
            }
            left = p;
        }
        // now walk forward via next collecting nodes
        const chain: string[] = [];
        let cur = left;
        seenLocal.clear();
        while (cur && !seenLocal.has(cur)) {
            seenLocal.add(cur);
            chain.push(cur);
            const ent = mapById.get(cur);
            const nx = ent && typeof ent.next === 'string' ? ent.next : undefined;
            if (!nx || nx === cur) {
                break;
            }
            cur = nx;
        }
        return chain;
    };

    // BFS queue seeded with trunk nodes
    const queue: string[] = [...trunk];
    while (queue.length) {
        const parentId = queue.shift() as string;
        if (!parentId) {
            continue;
        }
        const parentEnt = mapById.get(parentId);
        if (!parentEnt) {
            continue;
        }

        // process targets of this parent
        if (Array.isArray(parentEnt.targetPages) && parentEnt.targetPages.length) {
            for (const t of parentEnt.targetPages) {
                if (!t || assigned.has(t)) {
                    continue;
                }
                // collect the whole prev/next chain for this target and attach under parentId
                const chain = collectChain(t);
                // Attach chain nested: first element as child of parentId, next as child of first, etc.
                let prevNode = parentId;
                for (const cid of chain) {
                    if (assigned.has(cid)) {
                        prevNode = cid;
                        continue;
                    }
                    const parentObj = nodeMap[prevNode];
                    const childObj = nodeMap[cid];
                    if (!parentObj || !childObj) {
                        // missing referenced node: skip
                        continue;
                    }
                    // avoid duplicate attachments
                    if (!parentObj.children.includes(childObj)) {
                        parentObj.children.push(childObj);
                    }
                    assigned.add(cid);
                    // enqueue the newly attached node so its targets get processed as well
                    queue.push(cid);
                    prevNode = cid;
                }
            }
        }
        // additionally, ensure that if this parent has direct prev/next siblings that are not trunk
        // they should not be attached here (prev/next are handled when collecting chains for targets)
    }

    // Fallback: attach any remaining unassigned nodes by resolving via prev/next to nearest trunk
    // First try: if a node has a parent and is unassigned, attach it under its parent
    for (const entry of navigationMap) {
        if (assigned.has(entry.page)) {
            continue;
        }
        if (!entry.prev && !entry.next && (!entry.targetPages || !entry.targetPages.length) && entry.parent) {
            const parentId = entry.parent;
            const parentObj = nodeMap[parentId];
            const childObj = nodeMap[entry.page];
            if (parentObj && childObj && !parentObj.children.includes(childObj)) {
                parentObj.children.push(childObj);
                assigned.add(entry.page);
                // also enqueue so its targets (if any) get processed later
                queue.push(entry.page);
            }
        }
    }

    // Final fallback: attach any still-unassigned nodes by resolving via prev/next to nearest trunk
    // but attach full prev/next chains nested so they render as vertical stacks
    for (const entry of navigationMap) {
        if (assigned.has(entry.page)) {
            continue;
        }
        const attachTo = findAttach(entry.page);
        if (!nodeMap[attachTo]) {
            // fallback to root if something went wrong
            continue;
        }
        // collect whole prev->...->next chain for this entry and attach nested
        const chain = collectChain(entry.page);
        let prevNode = attachTo;
        for (const cid of chain) {
            if (assigned.has(cid)) {
                prevNode = cid;
                continue;
            }
            const parentObj = nodeMap[prevNode];
            const childObj = nodeMap[cid];
            if (!parentObj || !childObj) {
                prevNode = cid;
                assigned.add(cid);
                continue;
            }
            if (!parentObj.children.includes(childObj)) {
                parentObj.children.push(childObj);
            }
            assigned.add(cid);
            // enqueue to process its targets later
            queue.push(cid);
            prevNode = cid;
        }
    }

    // layout via d3.tree (vertical tree) then rotate coords for left->right
    const rootNode = hierarchy(root);
    // nodeSize: [verticalSpacing, horizontalSpacing]
    // verticalSpacing halved to show nodes closer together
    // estimate horizontal spacing from label widths so nodes don't overlap horizontally
    const charWidth = 8; // approx px per character (monospace-ish estimate)
    const paddingHor = 40; // left+right padding per node
    let maxLabelLen = 1;
    for (const e of navigationMap) {
        const label = e.label || e.page || '';
        maxLabelLen = Math.max(maxLabelLen, String(label).length);
    }
    const estNodeWidth = Math.round(maxLabelLen * charWidth + paddingHor);
    const minH = 140;
    const maxH = 400;
    const horizSpacing = Math.min(maxH, Math.max(minH, estNodeWidth));
    const layout = tree<any>().nodeSize([70, horizSpacing]);
    layout(rootNode);

    const positions: Record<string, { x: number; y: number }> = {};
    // find min/max of the vertical layout coordinate (d.x) so we can invert the axis
    const allX = rootNode.descendants().map(d => d.x ?? 0);
    const maxX = allX.length ? Math.max(...allX) : 0;
    // map coordinates: keep horizontal (d.y) as x, but invert vertical so root/main is at top
    rootNode.descendants().forEach(d => {
        const id = d.data.id as string;
        if (!id || id === '__root') {
            return;
        }
        // x = horizontal distance (depth), y = inverted vertical position so tree grows downward
        positions[id] = { x: Math.round(d.y ?? 0), y: Math.round(maxX - (d.x ?? 0)) };
    });
    return positions;
}

interface NavigationViewInternalState extends NavigationViewState {
    nodes: FlowNode[];
    edges: FlowEdge[];
    dirty?: boolean;
    noData?: boolean;
    infoPanelOpen?: boolean;
    infoData?: Record<string, any> | null;
    infoNodeId?: string | undefined;
    confirmAutoLayoutOpen?: boolean;
}

class NavigationView extends ConfigGeneric<ConfigGenericProps, NavigationViewInternalState> {
    private autosaveInterval?: NodeJS.Timeout;

    // Schnelles Speichern beim Tabwechsel/Schließen über Beacon (kein await möglich)
    private saveNavigationBeacon = (): void => {
        const { selectedPanel, nodes, dirty, alive } = this.state;
        if (!selectedPanel || !nodes.length || !dirty || !alive) {
            return;
        }
        const payload: NavigationSavePayload = {
            panelName: selectedPanel,
            pages: nodes.map(n => ({ name: n.id, position: n.position })),
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
        const { selectedPanel, nodes, dirty, alive } = this.state;
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
            pages: nodes.map(n => ({ name: n.id, position: n.position })),
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
    private aliveTimeout?: NodeJS.Timeout;

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
            edges: [],
            dirty: false,
            infoPanelOpen: false,
            infoData: null,
            infoNodeId: undefined,
        };
        this.checkAlive = this.checkAlive.bind(this);
        this.fetchNavigation = this.fetchNavigation.bind(this);
        this.handlePanelChange = this.handlePanelChange.bind(this);
        this.onNodesChange = this.onNodesChange.bind(this);
        this.onEdgesChange = this.onEdgesChange.bind(this);
        this.onNodeClick = this.onNodeClick.bind(this);
        this.onPaneClick = this.onPaneClick.bind(this);
        this.saveNavigation = this.saveNavigation.bind(this);
        this.openConfirmAutoLayout = this.openConfirmAutoLayout.bind(this);
        this.closeConfirmAutoLayout = this.closeConfirmAutoLayout.bind(this);
        this.confirmAutoLayout = this.confirmAutoLayout.bind(this);
    }

    openConfirmAutoLayout(): void {
        this.setState({ confirmAutoLayoutOpen: true });
    }

    closeConfirmAutoLayout(): void {
        this.setState({ confirmAutoLayoutOpen: false });
    }

    confirmAutoLayout(): void {
        // delete existing positions from navigationMap entries then run autolayout
        const nav = this.state.navigationMap;
        if (!nav) {
            this.setState({ confirmAutoLayoutOpen: false });
            return;
        }
        // remove position field from entries (works on local copy)
        const cleaned = nav.map(
            e =>
                ({
                    ...e,
                    position: undefined,
                }) as NavigationMapEntry,
        );
        // compute positions and apply
        const positions = computeAutoLayout(cleaned as NavigationMap);
        const newNodes: FlowNode[] = cleaned.map(entry => ({
            id: entry.page,
            data: { label: entry.label || entry.page, entry },
            position: positions[entry.page] ?? { x: 0, y: 0 },
            type: 'custom',
            draggable: true,
        }));
        const flow = mapNavigationMapToFlow(cleaned as NavigationMap);
        this.setState({ nodes: newNodes, edges: flow.edges, dirty: true, confirmAutoLayoutOpen: false } as any);
    }

    onNodeClick(_event: any, node: any): void {
        const pageInfo = node?.data?.entry?.pageInfo ?? null;
        this.setState({ infoPanelOpen: true, infoData: pageInfo, infoNodeId: node.id });
    }

    onPaneClick(): void {
        this.setState({ infoPanelOpen: false, infoData: null, infoNodeId: undefined });
    }

    componentDidMount(): void {
        this.checkAlive();
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
    }

    componentWillUnmount(): void {
        if (this.aliveTimeout) {
            clearTimeout(this.aliveTimeout);
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

    checkAlive(): void {
        const instance = this.props.oContext.instance ?? '0';
        const socket = this.props.oContext.socket;
        if (socket && typeof socket.getState === 'function') {
            void socket.getState(`system.adapter.${ADAPTER_NAME}.${instance}.alive`).then(state => {
                this.setState({ alive: !!state?.val });
                this.aliveTimeout = setTimeout(this.checkAlive, 5000);
            });
        } else {
            this.aliveTimeout = setTimeout(this.checkAlive, 5000);
        }
    }
    fetchNavigation(): void {
        this.setState({ loading: true, noData: false });
        const instance = this.props.oContext.instance ?? '0';
        let didRespond = false;
        const timeout = setTimeout(() => {
            if (!didRespond) {
                this.setState({
                    loading: false,
                    panelList: [],
                    selectedPanel: '',
                    navigationMap: null,
                    nodes: [],
                    edges: [],
                    noData: true,
                });
            }
        }, 3000);
        void this.props.oContext.socket
            .sendTo(`${ADAPTER_NAME}.${instance}`, SENDTO_GET_PANEL_NAVIGATION_COMMAND, null)
            .then((res: { result?: NavigationPanelConfig[] }) => {
                didRespond = true;
                clearTimeout(timeout);
                this.setState({ loading: false });
                if (res && Array.isArray(res.result)) {
                    const firstPanel = res.result[0]?.panelName || '';
                    const firstMap = res.result[0]?.navigationMap || null;
                    // Debug entfernt
                    let nodes: FlowNode[] = [];
                    let edges: FlowEdge[] = [];
                    if (firstMap) {
                        const flow = mapNavigationMapToFlow(firstMap);
                        nodes = flow.nodes;
                        edges = flow.edges;
                    }
                    // PanelList mit friendlyName übernehmen
                    const panelList: PanelListEntry[] = res.result.map(p => ({
                        panelName: p.panelName,
                        friendlyName: p.friendlyName || p.panelName,
                        navigationMap: p.navigationMap,
                    }));
                    // Debug entfernt
                    this.setState({
                        panelList,
                        selectedPanel: firstPanel,
                        navigationMap: firstMap,
                        nodes,
                        edges,
                        noData: false,
                        dirty: false,
                    });
                } else {
                    this.setState({
                        panelList: [],
                        selectedPanel: '',
                        navigationMap: null,
                        nodes: [],
                        edges: [],
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
        let nodes: FlowNode[] = [];
        let edges: FlowEdge[] = [];
        if (found && found.navigationMap) {
            const flow = mapNavigationMapToFlow(found.navigationMap);
            nodes = flow.nodes;
            edges = flow.edges;
        }
        this.setState({
            selectedPanel: panelName,
            navigationMap: found ? found.navigationMap : null,
            nodes,
            edges,
            dirty: false,
        });
    }

    onNodesChange(changes: any[]): void {
        if (changes.some(change => change.type === 'position')) {
            // Show info panel for the moved node(s) (use first position change)
            const posChange = changes.find(c => c.type === 'position');
            const movedId = posChange?.id;
            this.setState(state => {
                const newNodes = applyNodeChanges(changes, state.nodes) as FlowNode[];
                const moved = newNodes.find(n => n.id === movedId);
                const pageInfo = moved?.data?.entry?.pageInfo ?? null;
                return {
                    nodes: newNodes,
                    dirty: true,
                    infoPanelOpen: true,
                    infoData: pageInfo,
                    infoNodeId: movedId,
                } as any;
            });
        } else {
            this.setState(state => ({
                nodes: applyNodeChanges(changes, state.nodes) as FlowNode[],
            }));
        }
    }

    onEdgesChange(changes: any[]): void {
        if (changes.some(change => change.type === 'position')) {
            this.setState(state => ({
                edges: applyEdgeChanges(changes, state.edges) as FlowEdge[],
                dirty: true,
            }));
        } else {
            this.setState(state => ({
                edges: applyEdgeChanges(changes, state.edges) as FlowEdge[],
            }));
        }
    }

    render(): string | React.ReactElement | null {
        const { alive, loading, panelList, selectedPanel, nodes, edges, noData } = this.state;
        // remove dangling edges that reference missing nodes (safety for stale state)
        const nodeIds = new Set(nodes.map(n => n.id));
        const safeEdges = (edges || []).filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
        // Legende für die Kantenarten
        const legend = [
            { label: 'prev', color: '#1976d2', dash: false },
            { label: 'next', color: '#1976d2', dash: false },
            { label: 'home', color: '#fbc02d', dash: true },
            { label: 'parent', color: '#d32f2f', dash: false },
            { label: 'target', color: '#43a047', dash: true },
        ];
        return (
            <Box sx={{ width: '100%', p: 2, position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                    <Typography variant="h6">{I18n.t('Panel_Navigation')}</Typography>
                    <Box sx={{ flex: 1 }} />
                    <Button
                        variant="outlined"
                        onClick={this.fetchNavigation}
                        disabled={loading}
                    >
                        {I18n.t('refresh')}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={this.openConfirmAutoLayout}
                        disabled={loading || !this.state.navigationMap}
                    >
                        {I18n.t('auto_layout')}
                    </Button>
                    <Typography
                        variant="body2"
                        color={alive ? 'success.main' : 'error.main'}
                        sx={{ ml: 2 }}
                    >
                        {alive ? I18n.t('Adapter_online') : I18n.t('Adapter_offline')}
                    </Typography>
                </Box>
                {/* Legende */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    {legend.map(item => (
                        <Box
                            key={item.label}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                            <span
                                className="legend-span"
                                style={{
                                    // For solid items show the color; for dashed items show a colored dash-pattern
                                    background: item.dash ? 'transparent' : item.color,
                                    backgroundColor: item.dash ? 'transparent' : item.color,
                                    // choose dash length: home uses 8/8, others (e.g. target) use 4/4 to match edges
                                    backgroundImage: item.dash
                                        ? `repeating-linear-gradient(90deg, ${item.color} 0 ${item.label === 'home' ? 8 : 4}px, transparent ${item.label === 'home' ? 8 : 4}px ${item.label === 'home' ? 16 : 8}px)`
                                        : undefined,
                                    borderBottom: item.dash ? `2px dashed ${item.color}` : undefined,
                                }}
                            />
                            <Typography variant="body2">{item.label}</Typography>
                        </Box>
                    ))}
                </Box>
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
                        <Box sx={{ mb: 2, minWidth: 200 }}>
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
                        <div className="reactflow-container">
                            {/* Global SVG defs for edge arrow markers (rendered once) */}
                            <svg
                                style={{ position: 'absolute', width: 0, height: 0, overflow: 'visible' }}
                                aria-hidden="true"
                            >
                                <defs>
                                    <marker
                                        id="arrow-default"
                                        markerWidth="8"
                                        markerHeight="8"
                                        refX="8"
                                        refY="4"
                                        orient="auto"
                                        markerUnits="strokeWidth"
                                    >
                                        <path
                                            d="M0,0 L8,4 L0,8 z"
                                            fill="var(--edge-color, #1976d2)"
                                        />
                                    </marker>
                                    <marker
                                        id="arrow-target"
                                        markerWidth="10"
                                        markerHeight="10"
                                        refX="10"
                                        refY="5"
                                        orient="auto"
                                        markerUnits="strokeWidth"
                                    >
                                        <path
                                            d="M0,0 L10,5 L0,10 z"
                                            fill="var(--edge-target, #43a047)"
                                        />
                                    </marker>
                                    <marker
                                        id="arrow-next"
                                        markerWidth="8"
                                        markerHeight="8"
                                        refX="8"
                                        refY="4"
                                        orient="auto"
                                        markerUnits="strokeWidth"
                                    >
                                        <path
                                            d="M0,0 L8,4 L0,8 z"
                                            fill="var(--edge-next, #1976d2)"
                                        />
                                    </marker>
                                    <marker
                                        id="arrow-prev"
                                        markerWidth="8"
                                        markerHeight="8"
                                        refX="8"
                                        refY="4"
                                        orient="auto"
                                        markerUnits="strokeWidth"
                                    >
                                        <path
                                            d="M0,0 L8,4 L0,8 z"
                                            fill="var(--edge-prev, #1976d2)"
                                        />
                                    </marker>
                                    <marker
                                        id="arrow-home"
                                        markerWidth="8"
                                        markerHeight="8"
                                        refX="8"
                                        refY="4"
                                        orient="auto"
                                        markerUnits="strokeWidth"
                                    >
                                        <path
                                            d="M0,0 L8,4 L0,8 z"
                                            fill="var(--edge-home, #fbc02d)"
                                        />
                                    </marker>
                                    <marker
                                        id="arrow-parent"
                                        markerWidth="8"
                                        markerHeight="8"
                                        refX="8"
                                        refY="4"
                                        orient="auto"
                                        markerUnits="strokeWidth"
                                    >
                                        <path
                                            d="M0,0 L8,4 L0,8 z"
                                            fill="var(--edge-parent, #d32f2f)"
                                        />
                                    </marker>
                                </defs>
                            </svg>
                            <Dialog
                                open={!!this.state.confirmAutoLayoutOpen}
                                onClose={this.closeConfirmAutoLayout}
                                aria-labelledby="auto-layout-confirm-title"
                                aria-describedby="auto-layout-confirm-description"
                                maxWidth="sm"
                                fullWidth
                            >
                                <DialogTitle id="auto-layout-confirm-title">
                                    {I18n.t('auto_layout_confirm_title')}
                                </DialogTitle>
                                <DialogContent>
                                    <DialogContentText id="auto-layout-confirm-description">
                                        {I18n.t('auto_layout_confirm_text')}
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        fullWidth
                                        onClick={this.closeConfirmAutoLayout}
                                    >
                                        {I18n.t('auto_layout_confirm_cancel')}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        fullWidth
                                        onClick={this.confirmAutoLayout}
                                    >
                                        {I18n.t('auto_layout_confirm_reorder')}
                                    </Button>
                                </DialogActions>
                            </Dialog>
                            <ReactFlow
                                key={selectedPanel || 'navigation-flow'}
                                nodes={nodes}
                                fitView
                                nodesDraggable={true}
                                onNodesChange={this.onNodesChange}
                                onNodeClick={this.onNodeClick}
                                onPaneClick={this.onPaneClick}
                                onEdgesChange={this.onEdgesChange}
                                edgeTypes={{ custom: CustomEdge }}
                                edges={safeEdges.map(e => ({ ...e, type: 'custom' }))}
                                nodeTypes={{
                                    custom: ({ id, data }: any) => {
                                        const handleTypes: Record<string, boolean> = {
                                            prev: false,
                                            next: false,
                                            homeTopLeft: false,
                                            homeTopRight: false,
                                            parentBottomLeft: false,
                                            parentBottomRight: false,
                                            targetRight: false,
                                            targetLeft: false,
                                        };
                                        for (const edge of edges) {
                                            if (edge.source === id && edge.sourceHandle) {
                                                handleTypes[edge.sourceHandle] = true;
                                            }
                                            if (edge.target === id && edge.targetHandle) {
                                                handleTypes[edge.targetHandle] = true;
                                            }
                                        }
                                        // Fallback-Title (native) für pageInfo bauen
                                        let _pageInfoTooltip: string | undefined;
                                        const pageInfo = data.entry?.pageInfo;
                                        if (pageInfo && typeof pageInfo === 'object') {
                                            const entries = Object.entries(pageInfo).filter(
                                                ([_key, value]) =>
                                                    typeof value === 'string' || typeof value === 'number',
                                            );
                                            if (entries.length) {
                                                _pageInfoTooltip = entries
                                                    .map(
                                                        ([key, value]) =>
                                                            `${I18n.t(key)}: ${
                                                                typeof value === 'string'
                                                                    ? I18n.t(value)
                                                                    : String(value)
                                                            }`,
                                                    )
                                                    .join('\n');
                                            }
                                        }
                                        // kept for later use by external scripts; avoid unused-variable lint
                                        void _pageInfoTooltip;
                                        return (
                                            <Box className="node-box">
                                                {/* prev: oben */}
                                                {handleTypes.prev && (
                                                    <Handle
                                                        type="target"
                                                        position={Position.Top}
                                                        id="prev"
                                                        style={{ background: '#1976d2' }}
                                                    />
                                                )}
                                                {handleTypes.prev && (
                                                    <Handle
                                                        type="source"
                                                        position={Position.Top}
                                                        id="prev"
                                                        style={{ background: '#1976d2' }}
                                                    />
                                                )}
                                                {/* next: unten */}
                                                {handleTypes.next && (
                                                    <Handle
                                                        type="target"
                                                        position={Position.Bottom}
                                                        id="next"
                                                        style={{ background: '#388e3c' }}
                                                    />
                                                )}
                                                {handleTypes.next && (
                                                    <Handle
                                                        type="source"
                                                        position={Position.Bottom}
                                                        id="next"
                                                        style={{ background: '#388e3c' }}
                                                    />
                                                )}
                                                {/* home: links oben (source), rechts oben (target) */}
                                                {handleTypes.homeTopLeft && (
                                                    <Handle
                                                        type="source"
                                                        position={Position.Left}
                                                        id="homeTopLeft"
                                                        className="homeTopLeft"
                                                        style={{ background: '#fbc02d' }}
                                                    />
                                                )}
                                                {handleTypes.homeTopRight && (
                                                    <Handle
                                                        type="target"
                                                        position={Position.Right}
                                                        id="homeTopRight"
                                                        className="homeTopRight"
                                                        style={{ background: '#fbc02d' }}
                                                    />
                                                )}
                                                {/* parent: links unten (source), rechts unten (target) */}
                                                {handleTypes.parentBottomLeft && (
                                                    <Handle
                                                        type="source"
                                                        position={Position.Left}
                                                        id="parentBottomLeft"
                                                        className="parentBottomLeft"
                                                        style={{ background: '#d32f2f' }}
                                                    />
                                                )}
                                                {handleTypes.parentBottomRight && (
                                                    <Handle
                                                        type="target"
                                                        position={Position.Right}
                                                        id="parentBottomRight"
                                                        className="parentBottomRight"
                                                        style={{ background: '#d32f2f' }}
                                                    />
                                                )}
                                                {/* targetPages: rechts Mitte (source), links Mitte (target) */}
                                                {handleTypes.targetRight && (
                                                    <Handle
                                                        type="source"
                                                        position={Position.Right}
                                                        id="targetRight"
                                                        style={{ background: '#888', top: '50%' }}
                                                    />
                                                )}
                                                {handleTypes.targetLeft && (
                                                    <Handle
                                                        type="target"
                                                        position={Position.Left}
                                                        id="targetLeft"
                                                        style={{ background: '#888', top: '50%' }}
                                                    />
                                                )}
                                                <Typography
                                                    variant="body2"
                                                    color="text.primary"
                                                    className="node-label"
                                                    sx={{ position: 'relative', zIndex: 2, cursor: 'move' }}
                                                >
                                                    {data.label}
                                                </Typography>
                                            </Box>
                                        );
                                    },
                                }}
                            >
                                <Controls />
                                <Background gap={16} />
                            </ReactFlow>
                            <NodePageInfoPanel
                                open={!!this.state.infoPanelOpen}
                                data={this.state.infoData}
                            />
                        </div>
                    </>
                )}
            </Box>
        );
    }

    // Compute automatic tree layout: trunk is main and nodes connected via prev/next
    handleAutoLayout(): void {
        const nav = this.state.navigationMap;
        if (!nav) {
            return;
        }
        const positions = computeAutoLayout(nav);
        // rebuild nodes based on navigationMap to ensure ids/entries align with positions
        const currentById: Record<string, FlowNode> = {};
        for (const n of this.state.nodes) {
            currentById[n.id] = n;
        }
        const newNodes: FlowNode[] = nav.map(entry => {
            const existing = currentById[entry.page];
            const pos = positions[entry.page] ?? existing?.position ?? { x: 0, y: 0 };
            return {
                id: entry.page,
                data: { label: entry.label || entry.page, entry },
                position: pos,
                type: existing?.type ?? 'custom',
                draggable: existing?.draggable ?? true,
            };
        });
        const flow = mapNavigationMapToFlow(nav);
        this.setState({ nodes: newNodes, edges: flow.edges, dirty: true } as any);
    }
}

// Optional: ThemeVarsProvider — setzt CSS-Variablen aus dem aktuellen MUI-Theme
export function ThemeVarsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    const theme = useTheme();
    useEffect(() => {
        const root = document.documentElement;
        // Node Hintergrund/Text
        root.style.setProperty('--node-bg', theme.palette.background.paper || '#fff');
        root.style.setProperty('--node-text', theme.palette.text.primary || '#000');
        // Kantenfarben (Primärfarbe als Default für Kanten)
        root.style.setProperty('--edge-color', theme.palette.primary.main || '#1976d2');
        // next/prev sollen KEINE Theme-Farben verwenden — feste Farben
        root.style.setProperty('--edge-next', '#1976d2');
        root.style.setProperty('--edge-prev', '#1976d2');
        root.style.setProperty('--edge-home', '#fbc02d');
        root.style.setProperty('--edge-parent', '#d32f2f');
        root.style.setProperty('--edge-target', '#43a047');
    }, [theme]);
    return <>{children}</>;
}

export default function WrappedNavigationView(props: ConfigGenericProps): React.ReactElement {
    return (
        <ThemeVarsProvider>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore allow passing through ConfigGenericProps to class component */}
            <NavigationView {...(props as any)} />
        </ThemeVarsProvider>
    );
}
