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
    CircularProgress,
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { I18n } from '@iobroker/adapter-react-v5';
import type {
    PanelInfo,
    NavigationAssignmentList,
    NavigationAssignment,
} from '../../../src/lib/types/adminShareConfig';
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
    // toggle state for collapsible panel
    isCollapsed?: boolean;
    // loading states per topic
    isLoading: Record<string, boolean>;
    // last load time per topic for retry logic
    lastLoadTime: Record<string, number>;
    // focus tracking per topic for optimization
    focusReceived: Record<string, boolean>;
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
            isCollapsed: false, // mobile: always expanded, desktop: start collapsed
            isLoading: {},
            lastLoadTime: {},
            focusReceived: {},
        };
    }

    checkAlive(): void {
        if (!this.props.oContext || !this.props.oContext.socket) {
            this.aliveTimeout = setTimeout(() => this.checkAlive(), 5000);
            return;
        }
        // No need for alive checking - just use oContext directly
        this.aliveTimeout = setTimeout(() => this.checkAlive(), 5000);
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
        await this.applyAssignmentsFromProps(this.props.currentAssignments || []);
    }

    private async applyAssignmentsFromProps(nextAssignments: NavigationAssignmentList): Promise<void> {
        const addedPanels = (nextAssignments || []).map(a => {
            const found = this.state.available.find(p => p.panelTopic === a.topic);
            return found || { panelTopic: a.topic, friendlyName: a.topic };
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
        // and wait for them to load before the component renders completely
        const loadPromises = addedPanels.map(p => this.loadPagesForPanel(p.panelTopic, true));
        await Promise.all(loadPromises);
    }

    componentDidUpdate(prevProps: Props): void {
        // if the selected uniqueName changed, update internal assignments state
        if (prevProps.uniqueName !== this.props.uniqueName) {
            const nextAssignments = this.props.currentAssignments || [];

            // Mark this as a focus event for optimization
            if (this.props.uniqueName) {
                this.setState(prev => ({
                    focusReceived: { ...prev.focusReceived, [this.props.uniqueName!]: true },
                }));
            }

            // ensure panels are loaded so we can map topics -> friendlyName
            void this.loadPanels(false).then(() => {
                void this.applyAssignmentsFromProps(nextAssignments);
            });
        } else if (prevProps.currentAssignments !== this.props.currentAssignments && this.props.currentAssignments) {
            // props currentAssignments changed (same uniqueName), update internal state
            const nextAssignments = this.props.currentAssignments || [];
            void this.applyAssignmentsFromProps(nextAssignments);
        }
    }

    async loadPanels(setDefaultSelected = true): Promise<void> {
        try {
            let list: PanelInfo[] = [];
            if (this.props.fetchPanels) {
                list = await this.props.fetchPanels();
            } else if (this.props.oContext && this.props.oContext.socket) {
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
        const updatedAdded = [...added, panel];
        const nextAssignments: NavigationAssignmentList = [...this.state.assignments, { topic: panel.panelTopic }];
        this.setState({
            added: updatedAdded,
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

        const now = Date.now();
        const lastLoad = this.state.lastLoadTime[topic] || 0;
        const isCurrentlyLoading = this.state.isLoading[topic];
        const hasBeenLoaded = !!this.state.pagesMap[topic];
        const needsReload = forceReload || !hasBeenLoaded || now - lastLoad > 60000; // 1 minute cache

        // Skip if already loading or recently loaded (unless forced)
        if (isCurrentlyLoading || (!needsReload && hasBeenLoaded)) {
            console.log('[NavigationAssignmentPanel] Skipping loadPagesForPanel', {
                topic,
                isCurrentlyLoading,
                hasBeenLoaded,
                needsReload,
                forceReload,
                timeSinceLastLoad: now - lastLoad,
            });
            return;
        }

        // Start loading state
        this.setState(prev => ({
            isLoading: { ...prev.isLoading, [topic]: true },
            lastLoadTime: { ...prev.lastLoadTime, [topic]: now },
        }));

        try {
            console.log('[NavigationAssignmentPanel] Starting loadPagesForPanel', {
                topic,
                hasSocket: !!this.props.oContext?.socket,
            });

            let list: string[] = [];
            let success = false;

            // Try to load from adapter with timeout
            if (this.props.oContext?.socket) {
                const instance = this.props.oContext.instance ?? '0';
                const target = `${ADAPTER_NAME}.${instance}`;
                const payload = { panelTopic: topic };

                try {
                    // Race between sendTo and 2-second timeout
                    const timeoutPromise = new Promise<never>((_, reject) => {
                        setTimeout(() => reject(new Error('sendTo timeout after 2 seconds')), 2000);
                    });

                    const sendToPromise = this.props.oContext.socket.sendTo(target, SENDTO_GET_PAGES_COMMAND, payload);
                    const raw = await Promise.race([sendToPromise, timeoutPromise]);

                    if (Array.isArray(raw)) {
                        list = raw as string[];
                        success = true;
                    } else if (raw && Array.isArray(raw.result)) {
                        list = raw.result as string[];
                        success = true;
                    }

                    console.log('[NavigationAssignmentPanel] sendTo successful', { topic, pages: list });
                } catch (e) {
                    console.warn('[NavigationAssignmentPanel] sendTo failed or timed out', {
                        target,
                        cmd: SENDTO_GET_PAGES_COMMAND,
                        payload,
                        error: e,
                    });
                }
            }

            // If sendTo failed or timed out, retry logic for critical scenarios
            if (!success && !this.props.oContext?.socket) {
                console.log('[NavigationAssignmentPanel] Retrying in 1 second due to no socket...');

                // Retry after 1 second delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Mark as not loading temporarily to allow retry
                this.setState(prev => ({
                    isLoading: { ...prev.isLoading, [topic]: false },
                }));

                // Recursive retry (but only once to avoid infinite loops)
                if (!this.state.focusReceived[topic]) {
                    this.setState(prev => ({
                        focusReceived: { ...prev.focusReceived, [topic]: true },
                    }));
                    return this.loadPagesForPanel(topic, true);
                }
            }

            // Update state with results (even if empty)
            this.setState(prev => ({
                pagesMap: { ...prev.pagesMap, [topic]: list },
                isLoading: { ...prev.isLoading, [topic]: false },
            }));

            console.log('[NavigationAssignmentPanel] loadPagesForPanel completed', {
                topic,
                success,
                pagesCount: list.length,
                pages: list,
            });
        } catch (error) {
            console.error('[NavigationAssignmentPanel] loadPagesForPanel error', { topic, error });

            // End loading state even on error
            this.setState(prev => ({
                isLoading: { ...prev.isLoading, [topic]: false },
            }));
        }
    }

    setNavigationForSelected = (nav: { next?: string; prev?: string; home?: string; parent?: string }): void => {
        const { selectedAddedTopic, assignments } = this.state;
        if (!selectedAddedTopic) {
            return;
        }

        const idx = assignments.findIndex(a => a.topic === selectedAddedTopic);
        const nextAssignments: NavigationAssignmentList = [...assignments];
        const existing = assignments[idx];

        const newAssignment: NavigationAssignment = {
            topic: selectedAddedTopic,
            navigation: { ...existing?.navigation, ...nav },
        };

        if (idx >= 0) {
            nextAssignments[idx] = newAssignment;
        } else {
            nextAssignments.push(newAssignment);
        }

        this.setState({ assignments: nextAssignments });
        if (this.props.onAssign && this.props.uniqueName) {
            this.props.onAssign(this.props.uniqueName, nextAssignments);
        }
    };

    getNavValue = (topic: string | undefined, field: 'next' | 'prev' | 'home' | 'parent'): string => {
        if (!topic) {
            return '';
        }
        const assignment = this.state.assignments.find(a => a.topic === topic);
        const result = assignment?.navigation?.[field] || '';
        return result;
    };

    togglePanel = (): void => {
        const wasCollapsed = this.state.isCollapsed;

        this.setState(prevState => ({ isCollapsed: !prevState.isCollapsed }));

        // If expanding, re-apply assignments to ensure data is fresh
        if (wasCollapsed) {
            void this.applyAssignmentsFromProps(this.props.currentAssignments || []);
        }
    };

    render(): React.ReactNode {
        const { widthPercent } = this.props;
        const { isCollapsed } = this.state;
        const pages: string[] = this.state.selectedAddedTopic
            ? (this.state.pagesMap[this.state.selectedAddedTopic] ?? [])
            : [];

        // Debug information
        console.log('[NavigationAssignmentPanel] Render state:', {
            selectedAddedTopic: this.state.selectedAddedTopic,
            assignments: this.state.assignments,
            pages: pages,
            pagesMap: this.state.pagesMap,
        });

        return (
            <Box
                sx={{
                    // Responsive positioning: absolute on desktop, static on mobile
                    position: { xs: 'static', md: 'absolute' },
                    right: { xs: 'auto', md: 0 },
                    top: { xs: 'auto', md: 0 },
                    height: { xs: 'auto', md: '100%' },

                    // Responsive width: full width on mobile, percentage on desktop
                    width: {
                        xs: '100%', // mobile: full width
                        md: isCollapsed ? '10px' : `${widthPercent}%`, // desktop: collapsible
                    },

                    // Mobile: min height when collapsed, auto when expanded
                    minHeight: {
                        xs: isCollapsed ? '50px' : 'auto',
                        md: 'auto',
                    },

                    transition: 'width 240ms ease, min-height 240ms ease',
                    backgroundColor: 'background.default',

                    // Mobile: border on all sides, desktop: only left and top
                    border: {
                        xs: '2px solid',
                        md: 'none',
                    },
                    borderLeft: { xs: 'none', md: '2px solid' },
                    borderTop: { xs: 'none', md: '2px solid' },
                    borderColor: 'secondary.main',

                    // Mobile: rounded corners, desktop: no rounding
                    borderRadius: { xs: 1, md: 0 },

                    // Mobile: normal overflow, desktop: visible for handle
                    overflow: { xs: 'hidden', md: 'visible' },

                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 20,

                    // Mobile: margin top for spacing
                    mt: { xs: 2, md: 0 },
                }}
            >
                {/* Toggle Handle - only visible on desktop */}
                <Box
                    sx={{
                        // Hide handle on mobile, show on desktop
                        display: { xs: 'none', md: 'flex' },
                        position: 'absolute',
                        left: '-20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '20px',
                        height: '60px',
                        backgroundColor: 'secondary.main',
                        borderRadius: '4px 0 0 4px',
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

                {/* Mobile toggle button - only visible on mobile */}
                <Box
                    sx={{
                        // Show only on mobile
                        display: { xs: 'flex', md: 'none' },
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 1,
                        backgroundColor: 'secondary.main',
                        color: 'secondary.contrastText',
                        borderRadius: '4px 4px 0 0',
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600 }}
                    >
                        {I18n.t('navigation_panel')}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        p: 1,
                        height: '100%',
                        // Mobile: always show, desktop: hide when collapsed
                        display: { xs: 'flex', md: isCollapsed ? 'none' : 'flex' },
                        flexDirection: 'column',
                        // Mobile: normal layout, desktop: width animation
                        width: { xs: '100%', md: isCollapsed ? '0%' : '100%' },
                        overflow: 'hidden',
                        transition: { xs: 'none', md: 'width 240ms ease' },
                    }}
                >
                    {/* Panel navigation header - hide on mobile when collapsed */}
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 1,
                            fontWeight: 600,
                            color: 'primary.main',
                            fontSize: '1rem',
                            // Hide on mobile (title is in mobile toggle button)
                            display: { xs: 'none', md: 'block' },
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

                    {/* growing list of added items */}
                    {(() => {
                        return (
                            <Box>
                                {this.state.added.length === 0 ? (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {I18n.t('No panels added')}
                                    </Typography>
                                ) : (
                                    <div style={{ overflow: 'auto' }}>
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
                                value={this.getNavValue(this.state.selectedAddedTopic, 'prev') || ''}
                                onOpen={() => {
                                    if (this.state.selectedAddedTopic) {
                                        void this.loadPagesForPanel(this.state.selectedAddedTopic, true);
                                    }
                                }}
                                onChange={e =>
                                    this.setNavigationForSelected({ prev: String(e.target.value) || undefined })
                                }
                                sx={{ width: '100%' }}
                                disabled={
                                    this.state.selectedAddedTopic
                                        ? this.state.isLoading[this.state.selectedAddedTopic] || false
                                        : false
                                }
                                endAdornment={
                                    this.state.selectedAddedTopic &&
                                    this.state.isLoading[this.state.selectedAddedTopic] ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
                                            <CircularProgress size={16} />
                                        </Box>
                                    ) : null
                                }
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
                                value={this.getNavValue(this.state.selectedAddedTopic, 'next') || ''}
                                onOpen={() => {
                                    if (this.state.selectedAddedTopic) {
                                        void this.loadPagesForPanel(this.state.selectedAddedTopic, true);
                                    }
                                }}
                                onChange={e =>
                                    this.setNavigationForSelected({ next: String(e.target.value) || undefined })
                                }
                                sx={{ width: '100%' }}
                                disabled={
                                    this.state.selectedAddedTopic
                                        ? this.state.isLoading[this.state.selectedAddedTopic] || false
                                        : false
                                }
                                endAdornment={
                                    this.state.selectedAddedTopic &&
                                    this.state.isLoading[this.state.selectedAddedTopic] ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
                                            <CircularProgress size={16} />
                                        </Box>
                                    ) : null
                                }
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
                                value={this.getNavValue(this.state.selectedAddedTopic, 'home') || ''}
                                onOpen={() => {
                                    if (this.state.selectedAddedTopic) {
                                        void this.loadPagesForPanel(this.state.selectedAddedTopic, true);
                                    }
                                }}
                                onChange={e =>
                                    this.setNavigationForSelected({ home: String(e.target.value) || undefined })
                                }
                                sx={{ width: '100%' }}
                                disabled={
                                    this.state.selectedAddedTopic
                                        ? this.state.isLoading[this.state.selectedAddedTopic] || false
                                        : false
                                }
                                endAdornment={
                                    this.state.selectedAddedTopic &&
                                    this.state.isLoading[this.state.selectedAddedTopic] ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
                                            <CircularProgress size={16} />
                                        </Box>
                                    ) : null
                                }
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
                                value={this.getNavValue(this.state.selectedAddedTopic, 'parent') || ''}
                                onOpen={() => {
                                    if (this.state.selectedAddedTopic) {
                                        void this.loadPagesForPanel(this.state.selectedAddedTopic, true);
                                    }
                                }}
                                onChange={e =>
                                    this.setNavigationForSelected({ parent: String(e.target.value) || undefined })
                                }
                                sx={{ width: '100%' }}
                                disabled={
                                    this.state.selectedAddedTopic
                                        ? this.state.isLoading[this.state.selectedAddedTopic] || false
                                        : false
                                }
                                endAdornment={
                                    this.state.selectedAddedTopic &&
                                    this.state.isLoading[this.state.selectedAddedTopic] ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
                                            <CircularProgress size={16} />
                                        </Box>
                                    ) : null
                                }
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
