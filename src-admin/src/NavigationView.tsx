// Konstanten für Adapter-Kommunikation
import './NavigationView.css';

const ADAPTER_NAME = 'nspanel-lovelace-ui';
const SENDTO_COMMAND = 'getPanelNavigation';
const SAVE_PANEL_NAVIGATION_COMMAND = 'savePanelNavigation';
// Typ für das Rückgabeobjekt der mapNavigationMapToFlow-Funktion
interface FlowData {
    nodes: FlowNode[];
    edges: FlowEdge[];
}
// Typen für React Flow Nodes und Edges
interface FlowNode {
    id: string;
    data: { label: string };
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
interface PanelListEntry {
    panelName: string; // technisch eindeutig
    friendlyName: string; // für Anzeige
    navigationMap: NavigationMap;
}
interface NavigationViewState extends ConfigGenericState {
    alive: boolean;
    loading: boolean;
    panelList: PanelListEntry[];
    selectedPanel: string;
    navigationMap: NavigationMap | null;
    noData?: boolean;
}
import React from 'react';
import type { EdgeProps } from 'reactflow';
import ReactFlow, {
    Background,
    Controls,
    Handle,
    Position,
    applyNodeChanges,
    applyEdgeChanges,
    BaseEdge,
    getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { SelectChangeEvent } from '@mui/material';
import { Select, MenuItem, Box, Button, Typography, CircularProgress } from '@mui/material';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { I18n } from '@iobroker/adapter-react-v5';
// Typdefinitionen für panelConfig (vereinfachte Annahme)
// Neue Struktur: NavigationMap
// {
//   main: { next: 'settings', prev: undefined, home: undefined, parent: undefined, targetPages: ['media'] },
//   settings: { ... },
//   ...
// }

type NavigationMapEntry = {
    page: string;
    next?: string;
    prev?: string;
    home?: string;
    parent?: string;
    targetPages?: string[];
    label?: string;
    position?: { x: number; y: number } | null;
};
type NavigationMap = NavigationMapEntry[];

type NavigationPanelConfig = {
    panelName: string;
    friendlyName: string;
    navigationMap: NavigationMap;
};

function CustomEdge(props: EdgeProps): React.ReactElement {
    const [edgePath] = getBezierPath(props);
    // Tooltip-Text zusammenbauen
    const tooltip = `${props.data?.navType ?? ''}: ${props.source} → ${props.target}`;
    return (
        <>
            <BaseEdge
                {...props}
                path={edgePath}
            />
            <title>{tooltip}</title>
        </>
    );
}

// Hilfsfunktion für die Umwandlung der NavigationMap in React Flow Nodes/Edges
function mapNavigationMapToFlow(navigationMap: NavigationMap): FlowData {
    const edgeColors: Record<string, string> = {
        prev: '#1976d2', // blau
        next: '#1976d2', // auch blau
        home: '#fbc02d', // gelb
        parent: '#d32f2f', // rot
        target: '#43a047', // grün für targetPages
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
    for (const entry of navigationMap) {
        // next: von a1.next zu a2.prev
        if (entry.next && typeof entry.next === 'string') {
            edges.push({
                id: `nav-${entry.page}-${entry.next}-next`,
                source: entry.page,
                target: entry.next,
                sourceHandle: 'next',
                targetHandle: 'prev',
                label: '',
                style: { strokeWidth: 2, stroke: edgeColors.next },
                data: { isTarget: false, navType: 'next' },
            } as any);
        }
        // prev: von a1.prev zu a2.next
        if (entry.prev && typeof entry.prev === 'string') {
            edges.push({
                id: `nav-${entry.page}-${entry.prev}-prev`,
                source: entry.page,
                target: entry.prev,
                sourceHandle: 'prev',
                targetHandle: 'next',
                label: '',
                style: { strokeWidth: 2, stroke: edgeColors.prev },
                data: { isTarget: false, navType: 'prev' },
            } as any);
        }
        // home: von a1.home (links oben) zu a2 (rechts oben)
        if (entry.home && typeof entry.home === 'string') {
            edges.push({
                id: `nav-${entry.page}-${entry.home}-home`,
                source: entry.page,
                target: entry.home,
                sourceHandle: 'homeTopLeft',
                targetHandle: 'homeTopRight',
                label: '',
                style: { strokeWidth: 2, stroke: edgeColors.home },
                data: { isTarget: false, navType: 'home' },
            } as any);
        }
        // parent: von a1.parent (links unten) zu a2 (rechts unten)
        if (entry.parent && typeof entry.parent === 'string') {
            edges.push({
                id: `nav-${entry.page}-${entry.parent}-parent`,
                source: entry.page,
                target: entry.parent,
                sourceHandle: 'parentBottomLeft',
                targetHandle: 'parentBottomRight',
                label: '',
                style: { strokeWidth: 2, stroke: edgeColors.parent },
                data: { isTarget: false, navType: 'parent' },
            } as any);
        }
        // targetPages: von a1 zu a2, von Mitte rechts zu Mitte links
        if (Array.isArray(entry.targetPages)) {
            for (const target of entry.targetPages) {
                if (target && typeof target === 'string') {
                    edges.push({
                        id: `target-${entry.page}-${target}`,
                        source: entry.page,
                        target: target,
                        sourceHandle: 'targetRight',
                        targetHandle: 'targetLeft',
                        label: '',
                        style: { strokeWidth: 2, strokeDasharray: '4 4', stroke: edgeColors.target },
                        data: { isTarget: true, navType: 'target' },
                    } as any);
                }
            }
        }
    }
    return { nodes, edges };
}

interface NavigationViewInternalState extends NavigationViewState {
    nodes: FlowNode[];
    edges: FlowEdge[];
    dirty?: boolean;
    noData?: boolean;
}

class NavigationView extends ConfigGeneric<ConfigGenericProps, NavigationViewInternalState> {
    private autosaveInterval?: NodeJS.Timeout;

    // Schnelles Speichern beim Tabwechsel/Schließen über Beacon (kein await möglich)
    private saveNavigationBeacon = (): void => {
        const { selectedPanel, nodes, dirty, alive } = this.state;
        if (!selectedPanel || !nodes.length || !dirty || !alive) {
            return;
        }
        const payload = {
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
        const payload = {
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
        };
        this.checkAlive = this.checkAlive.bind(this);
        this.fetchNavigation = this.fetchNavigation.bind(this);
        this.handlePanelChange = this.handlePanelChange.bind(this);
        this.onNodesChange = this.onNodesChange.bind(this);
        this.onEdgesChange = this.onEdgesChange.bind(this);
        this.saveNavigation = this.saveNavigation.bind(this);
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
            .sendTo(`${ADAPTER_NAME}.${instance}`, SENDTO_COMMAND, null)
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
            this.setState(state => ({
                nodes: applyNodeChanges(changes, state.nodes) as FlowNode[],
                dirty: true,
            }));
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
        // Legende für die Kantenarten
        const legend = [
            { label: 'prev', color: '#1976d2', dash: false },
            { label: 'next', color: '#1976d2', dash: false },
            { label: 'home', color: '#fbc02d', dash: false },
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
                                    background: item.color,
                                    borderBottom: item.dash ? '2px dashed #888' : undefined,
                                    backgroundImage: item.dash
                                        ? 'repeating-linear-gradient(90deg,#888 0 4px,transparent 4px 8px)'
                                        : undefined,
                                    backgroundColor: item.dash ? 'transparent' : item.color,
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
                            <Typography
                                variant="body1"
                                color="text.secondary"
                            >
                                {I18n.t('No_data')}
                            </Typography>
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
                            <ReactFlow
                                nodes={nodes}
                                //edges={edges}
                                fitView
                                nodesDraggable={true}
                                onNodesChange={this.onNodesChange}
                                onEdgesChange={this.onEdgesChange}
                                edgeTypes={{ custom: CustomEdge }}
                                edges={edges.map(e => ({ ...e, type: 'custom' }))}
                                nodeTypes={{
                                    custom: ({ id, data }: any) => {
                                        // Handles für alle Typen, an den gewünschten Positionen
                                        // prev: oben, next: unten, home: rechts oben, parent: rechts unten, targetRight: rechts Mitte, targetLeft: links Mitte
                                        // Wir zeigen einen Handle nur, wenn eine Verbindung existiert
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
                                        // Suche alle Edges, die zu/von diesem Node gehen und markiere die benötigten Handles
                                        for (const edge of edges) {
                                            if (edge.source === id && edge.sourceHandle) {
                                                handleTypes[edge.sourceHandle] = true;
                                            }
                                            if (edge.target === id && edge.targetHandle) {
                                                handleTypes[edge.targetHandle] = true;
                                            }
                                        }
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
                        </div>
                    </>
                )}
            </Box>
        );
    }
}

export default NavigationView;
