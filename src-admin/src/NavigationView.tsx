// Konstanten für Adapter-Kommunikation
const ADAPTER_NAME = 'nspanel-lovelace-ui';
const SENDTO_COMMAND = 'getPanelNavigation';
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
    panelList: { panelName: string; navigationMap: NavigationMap }[];
    selectedPanel: string;
    navigationMap: NavigationMap | null;
}
import React from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    applyNodeChanges,
    applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { SelectChangeEvent } from '@mui/material';
import { Select, MenuItem, Box, Button, Typography, CircularProgress } from '@mui/material';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';

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
};
type NavigationMap = NavigationMapEntry[];

// Hilfsfunktion für die Umwandlung der NavigationMap in React Flow Nodes/Edges
function mapNavigationMapToFlow(navigationMap: NavigationMap): FlowData {
    const edgeColors: Record<string, string> = {
        prev: '#1976d2', // blau
        next: '#388e3c', // grün
        home: '#fbc02d', // gelb
        parent: '#d32f2f', // rot
        target: '#888', // grau
    };
    const nodes: FlowNode[] = navigationMap.map((entry: NavigationMapEntry, idx: number) => ({
        id: entry.page,
        data: { label: entry.label || entry.page, entry },
        position: { x: 100 * idx, y: 100 * (idx % 3) },
        type: 'custom',
        draggable: true,
    }));
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
                        style: { strokeWidth: 1, strokeDasharray: '4 2', stroke: edgeColors.target },
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
}

class NavigationView extends ConfigGeneric<ConfigGenericProps, NavigationViewInternalState> {
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
        };
        this.checkAlive = this.checkAlive.bind(this);
        this.fetchNavigation = this.fetchNavigation.bind(this);
        this.handlePanelChange = this.handlePanelChange.bind(this);
        this.onNodesChange = this.onNodesChange.bind(this);
        this.onEdgesChange = this.onEdgesChange.bind(this);
    }

    componentDidMount(): void {
        this.checkAlive();
        this.fetchNavigation();
    }

    componentWillUnmount(): void {
        if (this.aliveTimeout) {
            clearTimeout(this.aliveTimeout);
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
        this.setState({ loading: true });
        const instance = this.props.oContext.instance ?? '0';
        void this.props.oContext.socket
            .sendTo(`${ADAPTER_NAME}.${instance}`, SENDTO_COMMAND, null)
            .then((res: { result?: { panelName: string; navigationMap: NavigationMap }[] }) => {
                console.log('[NavigationView] fetchNavigation Antwort:', res);
                this.setState({ loading: false });
                if (res && Array.isArray(res.result)) {
                    const firstPanel = res.result[0]?.panelName || '';
                    const firstMap = res.result[0]?.navigationMap || null;
                    let nodes: FlowNode[] = [];
                    let edges: FlowEdge[] = [];
                    if (firstMap) {
                        const flow = mapNavigationMapToFlow(firstMap);
                        nodes = flow.nodes;
                        edges = flow.edges;
                    }
                    this.setState({
                        panelList: res.result,
                        selectedPanel: firstPanel,
                        navigationMap: firstMap,
                        nodes,
                        edges,
                    });
                } else {
                    this.setState({
                        panelList: [],
                        selectedPanel: '',
                        navigationMap: null,
                        nodes: [],
                        edges: [],
                    });
                }
            });
    }

    handlePanelChange(event: SelectChangeEvent<string>, _child?: React.ReactNode): void {
        const panelName = event.target.value;
        const found = this.state.panelList.find(p => p.panelName === panelName);
        console.log('[NavigationView] Panel gewechselt:', panelName, found);
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
        });
    }

    onNodesChange(changes: any): void {
        this.setState(state => ({ nodes: applyNodeChanges(changes, state.nodes) as FlowNode[] }));
    }

    onEdgesChange(changes: any): void {
        this.setState(state => ({ edges: applyEdgeChanges(changes, state.edges) as FlowEdge[] }));
    }

    render(): string | React.ReactElement | null {
        const { alive, loading, panelList, selectedPanel, nodes, edges } = this.state;
        // Legende für die Kantenarten
        const legend = [
            { label: 'prev', color: '#1976d2' },
            { label: 'next', color: '#388e3c' },
            { label: 'home', color: '#fbc02d' },
            { label: 'parent', color: '#d32f2f' },
        ];
        return (
            <Box sx={{ width: '100%', p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                    <Typography variant="h6">Panel Navigation</Typography>
                    <Box sx={{ flex: 1 }} />
                    <Button
                        variant="outlined"
                        onClick={this.fetchNavigation}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                    <Typography
                        variant="body2"
                        color={alive ? 'success.main' : 'error.main'}
                        sx={{ ml: 2 }}
                    >
                        {alive ? 'Adapter online' : 'Adapter offline'}
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
                                style={{
                                    width: 24,
                                    height: 4,
                                    background: item.color,
                                    display: 'inline-block',
                                    borderRadius: 2,
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
                                        {panel.panelName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                        <div style={{ width: '100%', height: 400 }}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                fitView
                                nodesDraggable={true}
                                onNodesChange={this.onNodesChange}
                                onEdgesChange={this.onEdgesChange}
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
                                            <Box
                                                sx={{
                                                    p: 1,
                                                    border: '1px solid #ccc',
                                                    borderRadius: 1,
                                                    background: '#868686ff',
                                                    minWidth: 80,
                                                    textAlign: 'center',
                                                    position: 'relative',
                                                }}
                                                style={{ cursor: 'move' }}
                                            >
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
                                                        style={{ background: '#fbc02d', top: 12 }}
                                                    />
                                                )}
                                                {handleTypes.homeTopRight && (
                                                    <Handle
                                                        type="target"
                                                        position={Position.Right}
                                                        id="homeTopRight"
                                                        style={{ background: '#fbc02d', top: 12 }}
                                                    />
                                                )}
                                                {/* parent: links unten (source), rechts unten (target) */}
                                                {handleTypes.parentBottomLeft && (
                                                    <Handle
                                                        type="source"
                                                        position={Position.Left}
                                                        id="parentBottomLeft"
                                                        style={{ background: '#d32f2f', bottom: 12 }}
                                                    />
                                                )}
                                                {handleTypes.parentBottomRight && (
                                                    <Handle
                                                        type="target"
                                                        position={Position.Right}
                                                        id="parentBottomRight"
                                                        style={{ background: '#d32f2f', bottom: 12 }}
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
                                <MiniMap />
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
