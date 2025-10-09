import React from 'react';
import {
    Box,
    Select,
    MenuItem,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Divider,
    Typography,
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { I18n } from '@iobroker/adapter-react-v5';
import type { PanelInfo, NavigationAssignmentList } from '../../../src/lib/types/adminShareConfig';
import {
    SENDTO_GET_PANELS_COMMAND,
    SENDTO_GET_PAGES_COMMAND,
    ADAPTER_NAME,
} from '../../../src/lib/types/adminShareConfig';

type Props = React.PropsWithChildren<{
    widthPercent?: number; // percent of container width
    // optional admin context to perform sendTo
    oContext?: any;
    // optional custom fetch function
    fetchPanels?: () => Promise<PanelInfo[]>;
    // currently selected uniqueName from parent
    uniqueName?: string;
    // current assignments for the selected uniqueName (provided by parent)
    currentAssignments?: NavigationAssignmentList;
    // called when assignments change: (uniqueName, assignments)
    onAssign?: (uniqueName: string, assignments: NavigationAssignmentList) => void;
    // optional tooltip texts for next/prev
}>;

type State = {
    available: PanelInfo[];
    selectedTopic: string;
    added: PanelInfo[];
    // which added item is selected for editing navigation
    selectedAddedTopic?: string;
    // internal assignments state
    assignments: NavigationAssignmentList;
    // pages per panelTopic
    pagesMap: Record<string, string[]>;
    alive?: boolean;
    // toggle state for collapsible panel
    isCollapsed?: boolean;
};

/**
 * Reusable navigation assignment side panel (class-based)
 * - transparent background
 * - 2px border using theme secondary color
 * - user toggleable via handle
 */
class NavigationAssignmentPanel extends React.Component<Props, State> {
    static defaultProps = {
        widthPercent: 30,
    } as Props;

    private aliveTimeout?: NodeJS.Timeout;

    constructor(props: Props) {
        super(props);
        this.state = {
            available: [],
            selectedTopic: '',
            added: [],
            assignments: props.currentAssignments || [],
            pagesMap: {},
            alive: false,
            isCollapsed: true, // start collapsed
        };
    }

    checkAlive(): void {
        if (!this.props.oContext || !this.props.oContext.socket) {
            this.aliveTimeout = setTimeout(() => this.checkAlive(), 5000);
            return;
        }
        const instance = this.props.oContext.instance ?? '0';
        const socket = this.props.oContext.socket;
        if (socket && typeof socket.getState === 'function') {
            void socket.getState(`system.adapter.${ADAPTER_NAME}.${instance}.alive`).then((state: any) => {
                this.setState({ alive: !!state?.val });
                this.aliveTimeout = setTimeout(() => this.checkAlive(), 5000);
            });
        } else {
            this.aliveTimeout = setTimeout(() => this.checkAlive(), 5000);
        }
    }

    componentWillUnmount(): void {
        if (this.aliveTimeout) {
            clearTimeout(this.aliveTimeout);
        }
    }

    async componentDidMount(): Promise<void> {
        this.checkAlive();
        // load panels but do not auto-select anything so select stays on '—'
        await this.loadPanels(false);
        // initialize from incoming props once panels are available
        this.applyAssignmentsFromProps(this.props.currentAssignments || []);
    }

    private applyAssignmentsFromProps(nextAssignments: NavigationAssignmentList): void {
        const addedPanels = (nextAssignments || []).map(a => {
            const found = this.state.available.find(p => p.panelTopic === a.topic);
            return found || ({ panelTopic: a.topic, friendlyName: a.topic } as PanelInfo);
        });

        // Keep current selectedAddedTopic if it's still in the new assignments, otherwise pick first
        const currentSelected = this.state.selectedAddedTopic;
        const stillExists = addedPanels.find(p => p.panelTopic === currentSelected);
        const newSelected = stillExists ? currentSelected : addedPanels[0]?.panelTopic;

        this.setState({
            assignments: nextAssignments,
            added: addedPanels,
            selectedAddedTopic: newSelected,
            selectedTopic: '',
        });
        // preload pages for all topics so selects have options immediately
        for (const p of addedPanels) {
            void this.loadPagesForPanel(p.panelTopic, true);
        }
    }

    componentDidUpdate(prevProps: Props): void {
        // if the selected uniqueName changed, update internal assignments state
        if (prevProps.uniqueName !== this.props.uniqueName) {
            const nextAssignments = this.props.currentAssignments || [];
            // ensure panels are loaded so we can map topics -> friendlyName
            void this.loadPanels(false).then(() => {
                this.applyAssignmentsFromProps(nextAssignments);
            });
        } else if (prevProps.currentAssignments !== this.props.currentAssignments && this.props.currentAssignments) {
            // props currentAssignments changed (same uniqueName), update internal state
            const nextAssignments = this.props.currentAssignments || [];
            this.applyAssignmentsFromProps(nextAssignments);
        }
    }

    async loadPanels(setDefaultSelected = true): Promise<void> {
        try {
            let list: PanelInfo[] = [];
            if (this.props.fetchPanels) {
                list = await this.props.fetchPanels();
            } else if (this.props.oContext && this.props.oContext.socket && this.state.alive) {
                const instance = this.props.oContext.instance ?? '0';
                const target = `${ADAPTER_NAME}.${instance}`;
                try {
                    const raw = await this.props.oContext.socket.sendTo(target, SENDTO_GET_PANELS_COMMAND, null);
                    if (Array.isArray(raw)) {
                        list = raw as PanelInfo[];
                    } else if (raw && Array.isArray(raw.result)) {
                        list = raw.result as PanelInfo[];
                    }
                } catch (e) {
                    console.error('[NavigationAssignmentPanel] sendTo failed', {
                        target,
                        cmd: SENDTO_GET_PANELS_COMMAND,
                        error: e,
                    });
                }
            }

            this.setState({
                available: list,
                selectedTopic: setDefaultSelected ? '' : '',
            });
        } catch {
            // ignore errors silently for now
            // console.error('Failed to load panels', e);
            this.setState({ available: [], selectedTopic: '' });
        }
    }

    // toggle/handle removed per request

    doAddSelected = (): void => {
        const { selectedTopic, available, added } = this.state;
        if (!selectedTopic) {
            return;
        }

        const panel = available.find(p => p.panelTopic === selectedTopic);
        if (!panel) {
            return;
        }

        // avoid duplicates
        if (added.find(a => a.panelTopic === panel.panelTopic)) {
            return;
        }
        const next = [...added, panel];
        const nextAssignments = [...this.state.assignments, { topic: panel.panelTopic, active: false }];
        this.setState({
            added: next,
            assignments: nextAssignments,
            selectedTopic: '',
        });
        // pre-load pages for this panel to populate selects
        void this.loadPagesForPanel(panel.panelTopic);
        // inform parent about new assignments (map to NavigationAssignmentList)
        if (this.props.onAssign && this.props.uniqueName) {
            this.props.onAssign(this.props.uniqueName, nextAssignments);
        }
    };

    doRemoveSelected = (): void => {
        const { added } = this.state;
        if (!added.length) {
            return;
        }
        // remove last added
        const updated = added.slice(0, -1);
        const updatedAssignments = this.state.assignments.slice(0, -1);
        this.setState({ added: updated, assignments: updatedAssignments });
        if (this.props.onAssign && this.props.uniqueName) {
            this.props.onAssign(this.props.uniqueName, updatedAssignments);
        }
    };

    // select an added item to edit its navigation
    selectAdded = (topic: string): void => {
        this.setState({ selectedAddedTopic: topic });
        // always reload pages when user clicks the list element (even if already selected)
        void this.loadPagesForPanel(topic, true);
    };

    async loadPagesForPanel(topic: string, forceReload = false): Promise<void> {
        if (!topic) {
            return;
        }
        try {
            // already loaded?
            if (!forceReload && this.state.pagesMap && this.state.pagesMap[topic]) {
                return;
            }
            let list: string[] = [];
            if (this.props.oContext && this.props.oContext.socket && this.state.alive) {
                const instance = this.props.oContext.instance ?? '0';
                const target = `${ADAPTER_NAME}.${instance}`;
                const payload = { panelTopic: topic };
                try {
                    const raw = await this.props.oContext.socket.sendTo(target, SENDTO_GET_PAGES_COMMAND, payload);
                    if (Array.isArray(raw)) {
                        list = raw as string[];
                    } else if (raw && Array.isArray(raw.result)) {
                        list = raw.result as string[];
                    }
                } catch (e) {
                    console.error('[NavigationAssignmentPanel] sendTo failed', {
                        target,
                        cmd: SENDTO_GET_PAGES_COMMAND,
                        payload,
                        error: e,
                    });
                }
            } else {
                console.warn('[NavigationAssignmentPanel] no oContext.socket available to sendTo');
            }

            // Only cache non-empty results; empty arrays indicate invalid/missing data
            if (list.length > 0) {
                const next = { ...(this.state.pagesMap || {}) };
                next[topic] = list;
                this.setState({ pagesMap: next });
            }
        } catch {
            // ignore
        }
    }

    setNavigationForSelected = (nav: { next?: string; prev?: string; home?: string; parent?: string }): void => {
        const { selectedAddedTopic, assignments } = this.state;
        if (!selectedAddedTopic) {
            return;
        }

        const idx = assignments.findIndex(a => a.topic === selectedAddedTopic);
        const next = [...assignments];
        const existing = assignments[idx];
        let newAssignment: any;
        if (existing && (existing as any).active) {
            newAssignment = {
                ...existing,
                active: true,
                navigation: { ...(existing as any).navigation, ...nav },
            };
        } else {
            newAssignment = { topic: selectedAddedTopic, active: true, navigation: { ...nav } };
        }

        if (idx >= 0) {
            next[idx] = newAssignment;
        } else {
            next.push(newAssignment);
        }

        this.setState({ assignments: next });
        if (this.props.onAssign && this.props.uniqueName) {
            this.props.onAssign(this.props.uniqueName, next);
        }
    };

    getNavValue = (topic: string | undefined, field: 'next' | 'prev' | 'home' | 'parent'): string => {
        if (!topic) {
            return '';
        }
        const a = this.state.assignments.find(x => x.topic === topic);

        // Return navigation value if it exists, regardless of active status
        if (!a || !(a as any).navigation) {
            return '';
        }
        return (a as any).navigation[field] ?? '';
    };

    togglePanel = (): void => {
        const wasCollapsed = this.state.isCollapsed;

        this.setState(prevState => ({ isCollapsed: !prevState.isCollapsed }));

        // If expanding, re-apply assignments to ensure data is fresh
        if (wasCollapsed) {
            this.applyAssignmentsFromProps(this.props.currentAssignments || []);
        }
    };

    render(): React.ReactNode {
        const { widthPercent } = this.props;
        const { isCollapsed } = this.state;
        const pages: string[] = this.state.selectedAddedTopic
            ? (this.state.pagesMap[this.state.selectedAddedTopic] ?? [])
            : [];

        return (
            <Box
                sx={{
                    // position absolute inside parent container (parent must be relative)
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    height: '100%',
                    // width based on collapsed state
                    width: isCollapsed ? '10px' : `${widthPercent}%`,
                    transition: 'width 240ms ease',
                    backgroundColor: 'background.default',
                    borderLeft: '2px solid',
                    borderTop: '2px solid',
                    borderColor: 'secondary.main',
                    // allow handle to be visible outside when collapsed
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 20,
                }}
            >
                {/* Toggle Handle */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: '-20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '20px',
                        height: '60px',
                        backgroundColor: 'secondary.main',
                        borderRadius: '4px 0 0 4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 21,
                        '&:hover': {
                            backgroundColor: 'secondary.dark',
                        },
                    }}
                    onClick={this.togglePanel}
                >
                    <Typography
                        sx={{
                            color: 'secondary.contrastText',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            transform: 'rotate(-90deg)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {isCollapsed ? '⏶' : '⏷'}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        p: 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        // content only visible when expanded
                        width: isCollapsed ? '0%' : '100%',
                        overflow: 'hidden',
                        transition: 'width 240ms ease',
                    }}
                >
                    {/* Panel navigation header */}
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 1,
                            fontWeight: 600,
                            color: 'primary.main',
                            fontSize: '1rem',
                        }}
                    >
                        {I18n.t('navigation_panel')}
                    </Typography>

                    {/* controls: select + add button */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                        <Select
                            size="small"
                            variant="standard"
                            value={this.state.selectedTopic}
                            onOpen={() => {
                                void this.loadPanels();
                            }}
                            onChange={e => this.setState({ selectedTopic: String(e.target.value) })}
                            sx={{
                                flex: 1,
                                backgroundColor: 'transparent',
                                // make select one row high
                                minHeight: 40,
                                '& .MuiSelect-select': {
                                    backgroundColor: 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: 40,
                                },
                            }}
                            displayEmpty
                        >
                            <MenuItem value="">{<em>—</em>}</MenuItem>
                            {this.state.available.map(p => (
                                <MenuItem
                                    key={p.panelTopic}
                                    value={p.panelTopic}
                                >
                                    {p.friendlyName}
                                </MenuItem>
                            ))}
                        </Select>
                        <Button
                            size="small"
                            variant="contained"
                            sx={{ minWidth: 32, padding: '4px 8px' }}
                            onClick={this.doAddSelected}
                            disabled={!this.state.selectedTopic}
                        >
                            +
                        </Button>
                    </Box>

                    {/* growing list of added items (min 3 rows, then scroll) */}
                    {(() => {
                        const rowHeight = 40;
                        const minRows = 1;
                        // desired rows: at least minRows, otherwise number of panels + 1
                        const desiredRows = Math.max(minRows, (this.state.added.length || 0) + 1);
                        const desiredH = desiredRows * rowHeight;

                        return (
                            <Box>
                                {this.state.added.length === 0 ? (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        No panels added
                                        <br />
                                    </Typography>
                                ) : (
                                    <div style={{ height: desiredH, overflow: 'auto' }}>
                                        <List dense>
                                            {this.state.added.map(a => (
                                                <ListItem
                                                    key={a.panelTopic}
                                                    component="div"
                                                >
                                                    <ListItemButton
                                                        selected={this.state.selectedAddedTopic === a.panelTopic}
                                                        onClick={() => this.selectAdded(a.panelTopic)}
                                                    >
                                                        <ListItemText primary={a.friendlyName} />
                                                    </ListItemButton>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </div>
                                )}
                            </Box>
                        );
                    })()}

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                        <Button
                            size="small"
                            color="error"
                            variant="contained"
                            onClick={this.doRemoveSelected}
                            disabled={this.state.added.length === 0}
                            sx={{ minWidth: 32, padding: '4px 8px' }}
                        >
                            -
                        </Button>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* navigation selectors for the selected added panel (labels only, options removed) */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Tooltip title={I18n.t('nav_prev_tooltip')}>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ mr: 0.5 }}
                                    >
                                        prev
                                    </Typography>
                                </Tooltip>
                            </Box>
                            <Select
                                size="small"
                                displayEmpty
                                aria-label="prev"
                                value={this.getNavValue(this.state.selectedAddedTopic, 'prev')}
                                onOpen={() => {
                                    if (this.state.selectedAddedTopic) {
                                        void this.loadPagesForPanel(this.state.selectedAddedTopic, true);
                                    }
                                }}
                                onChange={e =>
                                    this.setNavigationForSelected({ prev: String(e.target.value) || undefined })
                                }
                                sx={{ width: '100%' }}
                            >
                                <MenuItem value="">
                                    {this.state.selectedAddedTopic ? (
                                        <em>—</em>
                                    ) : (
                                        <em>{I18n.t('select_panel_first')}</em>
                                    )}
                                </MenuItem>
                                {pages
                                    .filter((p: string) => p !== this.props.uniqueName)
                                    .map((p: string) => (
                                        <MenuItem
                                            key={`prev-${p}`}
                                            value={p}
                                        >
                                            {p}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Tooltip title={I18n.t('nav_next_tooltip')}>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ mr: 0.5 }}
                                    >
                                        next
                                    </Typography>
                                </Tooltip>
                            </Box>
                            <Select
                                size="small"
                                displayEmpty
                                aria-label="next"
                                value={this.getNavValue(this.state.selectedAddedTopic, 'next')}
                                onOpen={() => {
                                    if (this.state.selectedAddedTopic) {
                                        void this.loadPagesForPanel(this.state.selectedAddedTopic, true);
                                    }
                                }}
                                onChange={e =>
                                    this.setNavigationForSelected({ next: String(e.target.value) || undefined })
                                }
                                sx={{ width: '100%' }}
                            >
                                <MenuItem value="">
                                    {this.state.selectedAddedTopic ? (
                                        <em>—</em>
                                    ) : (
                                        <em>{I18n.t('select_panel_first')}</em>
                                    )}
                                </MenuItem>
                                {pages
                                    .filter((p: string) => p !== this.props.uniqueName && !p.startsWith('///'))
                                    .map((p: string) => (
                                        <MenuItem
                                            key={`next-${p}`}
                                            value={p}
                                        >
                                            {p}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </Box>

                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mb: 0.5, display: 'block' }}
                            >
                                home
                            </Typography>
                            <Select
                                size="small"
                                displayEmpty
                                aria-label="home"
                                value={this.getNavValue(this.state.selectedAddedTopic, 'home')}
                                onOpen={() => {
                                    if (this.state.selectedAddedTopic) {
                                        void this.loadPagesForPanel(this.state.selectedAddedTopic, true);
                                    }
                                }}
                                onChange={e =>
                                    this.setNavigationForSelected({ home: String(e.target.value) || undefined })
                                }
                                sx={{ width: '100%' }}
                            >
                                <MenuItem value="">{<em>—</em>}</MenuItem>
                                {pages
                                    .filter((p: string) => p !== this.props.uniqueName)
                                    .map((p: string) => (
                                        <MenuItem
                                            key={`home-${p}`}
                                            value={p}
                                        >
                                            {p}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </Box>

                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mb: 0.5, display: 'block' }}
                            >
                                parent
                            </Typography>
                            <Select
                                size="small"
                                displayEmpty
                                aria-label="parent"
                                value={this.getNavValue(this.state.selectedAddedTopic, 'parent')}
                                onOpen={() => {
                                    if (this.state.selectedAddedTopic) {
                                        void this.loadPagesForPanel(this.state.selectedAddedTopic, true);
                                    }
                                }}
                                onChange={e =>
                                    this.setNavigationForSelected({ parent: String(e.target.value) || undefined })
                                }
                                sx={{ width: '100%' }}
                            >
                                <MenuItem value="">{<em>—</em>}</MenuItem>
                                {pages
                                    .filter((p: string) => p !== this.props.uniqueName)
                                    .map((p: string) => (
                                        <MenuItem
                                            key={`parent-${p}`}
                                            value={p}
                                        >
                                            {p}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </Box>
                    </Box>

                    {/* Notice when no next/prev is selected */}
                    {(() => {
                        if (!this.state.selectedAddedTopic) {
                            return null;
                        }
                        const nextValue = this.getNavValue(this.state.selectedAddedTopic, 'next');
                        const prevValue = this.getNavValue(this.state.selectedAddedTopic, 'prev');
                        if (!nextValue && !prevValue) {
                            return (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontStyle: 'italic', lineHeight: 1.4 }}
                                    >
                                        {I18n.t('nav_target_only_notice')}
                                    </Typography>
                                </>
                            );
                        }
                        return null;
                    })()}

                    {/* children area removed as requested (was rendered below the parent select) */}
                </Box>
            </Box>
        );
    }
}

export default NavigationAssignmentPanel;
