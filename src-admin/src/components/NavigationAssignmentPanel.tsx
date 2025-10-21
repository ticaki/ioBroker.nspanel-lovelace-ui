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
    IconButton,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Tooltip from '@mui/material/Tooltip';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { I18n } from '@iobroker/adapter-react-v5';
import type {
    PanelInfo,
    NavigationAssignmentList,
    NavigationAssignment,
} from '../../../src/lib/types/adminShareConfig';
import {
    // SENDTO_GET_PANELS_COMMAND,
    SENDTO_GET_PAGES_COMMAND,
    ADAPTER_NAME,
    ALL_PANELS_SPECIAL_ID,
} from '../../../src/lib/types/adminShareConfig';

// Special panel ID that the adapter will treat specially when present in assignments

type NavigationAssignmentPanelProps = {
    widthPercent?: number; // percent of container width
    // optional custom fetch function
    fetchPanels?: () => Promise<PanelInfo[]>;
    // currently selected uniqueName from parent
    uniqueName?: string;
    // current assignments for the selected uniqueName (provided by parent)
    currentAssignments?: NavigationAssignmentList;
    // called when assignments change: (uniqueName, assignments)
    onAssign?: (uniqueName: string, assignments: NavigationAssignmentList) => void;
    // optional tooltip texts for next/prev
    // hide navigation fields (next/prev/home/parent) - for screensaver pages
    hideNavigationFields?: boolean;
};

interface NavigationAssignmentPanelState extends ConfigGenericState {
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
    // loading states per topic
    isLoading: Record<string, boolean>;
    // last load time per topic for retry logic
    lastLoadTime: Record<string, number>;
    // focus tracking per topic for optimization
    focusReceived: Record<string, boolean>;
    // retry tracking for empty results
    retryCount: Record<string, number>;
    // pending delete confirmation (mobile two-step delete)
    pendingDelete?: string;
}
/**
 * Reusable navigation assignment side panel (class-based)
 * - transparent background
 * - 2px border using theme secondary color
 * - user toggleable via handle
 */

/**
 * Reusable navigation assignment side panel (class-based)
 * - transparent background
 * - 2px border using theme secondary color
 * - user toggleable via handle
 */
class NavigationAssignmentPanel extends ConfigGeneric<
    ConfigGenericProps & NavigationAssignmentPanelProps,
    NavigationAssignmentPanelState
> {
    static defaultProps = {
        widthPercent: 30,
    };

    constructor(props: ConfigGenericProps & NavigationAssignmentPanelProps) {
        super(props);
        this.state = {
            ...this.state,
            available: [],
            selectedTopic: '',
            added: [],
            assignments: props.currentAssignments || [],
            pagesMap: {},
            alive: false,
            isCollapsed: false,
            isLoading: {},
            lastLoadTime: {},
            focusReceived: {},
            retryCount: {},
        };
    }

    componentWillUnmount(): void {
        // Unsubscribe from alive state changes
        if (this.props.oContext && this.props.oContext.socket) {
            const instance = this.props.oContext.instance ?? '0';
            this.props.oContext.socket.unsubscribeState(
                `system.adapter.${ADAPTER_NAME}.${instance}.alive`,
                this.onAliveChanged,
            );
        }
    }

    async componentDidMount(): Promise<void> {
        super.componentDidMount();

        // Get initial alive state and subscribe to changes
        if (this.props.oContext && this.props.oContext.socket) {
            const instance = this.props.oContext.instance ?? '0';
            const aliveStateId = `system.adapter.${ADAPTER_NAME}.${instance}.alive`;

            try {
                const state = await this.props.oContext.socket.getState(aliveStateId);
                const isAlive = !!state?.val;
                this.setState({ alive: isAlive });

                // Subscribe to alive state changes
                await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);
            } catch (error) {
                console.error('[NavigationAssignmentPanel] Failed to get alive state or subscribe:', error);
                this.setState({ alive: false });
            }
        }

        // load panels but do not auto-select anything so select stays on '—'
        await this.loadPanels(false);
        // initialize from incoming props once panels are available
        await this.applyAssignmentsFromProps(this.props.currentAssignments || []);
    }

    // Callback for alive state changes
    onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const wasAlive = this.state.alive;
        const isAlive = state ? !!state.val : false;

        if (wasAlive !== isAlive) {
            this.setState({ alive: isAlive });

            // If adapter just became alive and we have assignments but no pages loaded,
            // trigger loading of pages for all assigned panels
            if (!wasAlive && isAlive && this.state.assignments.length > 0) {
                this.retryLoadingPagesForAssignments();
            }
        }
    };

    private async applyAssignmentsFromProps(nextAssignments: NavigationAssignmentList): Promise<void> {
        const addedPanels = (nextAssignments || [])
            .map(a => {
                const found = this.state.available.find(p => p.panelTopic === a.topic);
                return (
                    found || {
                        panelTopic: a.topic,
                        friendlyName: a.topic,
                    }
                );
            })
            .sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));

        // console log available and added panels for debugging
        console.log(
            `[NavigationAssignmentPanel] applyAssignmentsFromProps: available=${JSON.stringify(this.state.available)}, added=${JSON.stringify(addedPanels)}`,
        );
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

    componentDidUpdate(prevProps: NavigationAssignmentPanelProps): void {
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
            } else if (this.props.data?.panels) {
                list = (this.props.data.panels || []).map((p: { name: string; topic: string }) => ({
                    panelTopic: p.topic,
                    friendlyName: p.name || p.topic,
                }));
            }

            await new Promise<void>(resolve =>
                this.setState(
                    {
                        available: list,
                        selectedTopic: setDefaultSelected ? '' : '',
                    },
                    () => resolve(),
                ),
            );
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

        let panel = available.find(p => p.panelTopic === selectedTopic);
        // if the special ALL id was chosen, create a synthetic panel entry
        if (!panel && selectedTopic === ALL_PANELS_SPECIAL_ID) {
            panel = { panelTopic: ALL_PANELS_SPECIAL_ID, friendlyName: `(${I18n.t('all') || 'All'})` } as PanelInfo;
        }
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
        const { added, selectedAddedTopic } = this.state;
        if (!added.length) {
            return;
        }

        if (selectedAddedTopic) {
            // Entferne das ausgewählte Panel
            const updated = added.filter(a => a.panelTopic !== selectedAddedTopic);
            const updatedAssignments = this.state.assignments.filter(a => a.topic !== selectedAddedTopic);

            // Bestimme neue Auswahl: versuche gleichen Index, ansonsten vorheriges oder erstes Element
            const removedIndex = added.findIndex(a => a.panelTopic === selectedAddedTopic);
            let newSelected: string | undefined;
            if (updated.length > 0) {
                const candidate = updated[removedIndex] ?? updated[removedIndex - 1] ?? updated[0];
                newSelected = candidate?.panelTopic;
            } else {
                newSelected = undefined;
            }

            this.setState({ added: updated, assignments: updatedAssignments, selectedAddedTopic: newSelected });
            if (this.props.onAssign && this.props.uniqueName) {
                this.props.onAssign(this.props.uniqueName, updatedAssignments);
            }
        } else {
            // Fallback: wenn nichts ausgewählt ist, entferne weiterhin das zuletzt hinzugefügte
            const updated = added.slice(0, -1);
            const updatedAssignments = this.state.assignments.slice(0, -1);
            const newSelected = updated.length ? updated[updated.length - 1].panelTopic : undefined;
            this.setState({ added: updated, assignments: updatedAssignments, selectedAddedTopic: newSelected });
            if (this.props.onAssign && this.props.uniqueName) {
                this.props.onAssign(this.props.uniqueName, updatedAssignments);
            }
        }
    };

    // select an added item to edit its navigation
    selectAdded = (topic: string): void => {
        this.setState({ selectedAddedTopic: topic });
        // always reload pages when user clicks the list element (even if already selected)
        void this.loadPagesForPanel(topic, true);
    };

    private retryLoadingPagesForAssignments(): void {
        // Retry loading pages for all assigned panels
        const topics = this.state.assignments.map(a => a.topic);
        for (const topic of topics) {
            void this.loadPagesForPanel(topic, true);
        }
    }

    async loadPagesForPanel(topic: string, forceReload = false): Promise<void> {
        if (!topic) {
            return;
        }

        // Don't try to load if adapter is not alive
        if (!this.state.alive) {
            console.log(`[NavigationAssignmentPanel] Adapter not alive, skipping pages load for ${topic}`);
            return;
        }

        const now = Date.now();
        const lastLoad = this.state.lastLoadTime[topic] || 0;
        const isCurrentlyLoading = this.state.isLoading[topic];
        const hasBeenLoaded = !!this.state.pagesMap[topic];
        const needsReload = forceReload || !hasBeenLoaded || now - lastLoad > 60000; // 1 minute cache

        // Skip if already loading or recently loaded (unless forced)
        if (isCurrentlyLoading || (!needsReload && hasBeenLoaded)) {
            return;
        }

        // Start loading state
        this.setState(prev => ({
            isLoading: { ...prev.isLoading, [topic]: true },
            lastLoadTime: { ...prev.lastLoadTime, [topic]: now },
        }));

        try {
            let list: string[] = [];
            let success = false;

            // Try to load from adapter with timeout (only if alive)
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

            // Check if we got an empty array - might mean adapter not ready yet
            if (success && list.length === 0) {
                const currentRetryCount = this.state.retryCount[topic] || 0;
                const maxRetries = 3;
                const retryDelay = 2000; // 2 seconds

                if (currentRetryCount < maxRetries) {
                    console.log(
                        `[NavigationAssignmentPanel] Got empty array for ${topic}, retrying in ${retryDelay}ms (attempt ${currentRetryCount + 1}/${maxRetries})`,
                    );

                    // Update retry count
                    this.setState(prev => ({
                        retryCount: { ...prev.retryCount, [topic]: currentRetryCount + 1 },
                    }));

                    // Retry after delay
                    setTimeout(() => {
                        this.setState(prev => ({
                            isLoading: { ...prev.isLoading, [topic]: false },
                        }));
                        void this.loadPagesForPanel(topic, true);
                    }, retryDelay);

                    return; // Don't update state yet, wait for retry
                }

                console.log(`[NavigationAssignmentPanel] Max retries reached for ${topic}, accepting empty result`);
                // Reset retry count for future attempts
                this.setState(prev => ({
                    retryCount: { ...prev.retryCount, [topic]: 0 },
                }));
            } else if (success && list.length > 0) {
                // Reset retry count on successful result with data
                this.setState(prev => ({
                    retryCount: { ...prev.retryCount, [topic]: 0 },
                }));
            }

            // If sendTo failed or timed out, retry logic for critical scenarios
            if (!success && !this.props.oContext?.socket) {
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

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        const { widthPercent } = this.props;
        const { isCollapsed } = this.state;
        const pages: string[] = this.state.selectedAddedTopic
            ? (this.state.pagesMap[this.state.selectedAddedTopic] ?? [])
            : [];

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
                            disabled={!this.state.alive}
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
                            {/* Special "All" option inserted at top (if not already added) */}
                            {!this.state.added.some(a => a.panelTopic === ALL_PANELS_SPECIAL_ID) && (
                                <MenuItem value={ALL_PANELS_SPECIAL_ID}>{`(${I18n.t('all') || 'All'})`}</MenuItem>
                            )}
                            {/* Only show panels that are not already added */}
                            {this.state.available
                                .filter(p => !this.state.added.some(a => a.panelTopic === p.panelTopic))
                                .map(p => (
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
                            disabled={!this.state.selectedTopic || !this.state.alive}
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
                                            {this.state.added.map(a => {
                                                const topic = a.panelTopic;
                                                const isPending = this.state.pendingDelete === topic;
                                                // only render list item here; notices are shown in the lower summary
                                                return (
                                                    <React.Fragment key={topic}>
                                                        <ListItem
                                                            component="div"
                                                            disablePadding
                                                            sx={{
                                                                '&:hover .delete-icon': {
                                                                    opacity: 1,
                                                                },
                                                            }}
                                                            secondaryAction={
                                                                <IconButton
                                                                    className="delete-icon"
                                                                    edge="end"
                                                                    aria-label="delete"
                                                                    size="small"
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        // Two-step delete on mobile (touch devices)
                                                                        if (!isPending) {
                                                                            // First tap: mark as pending
                                                                            this.setState({ pendingDelete: topic });
                                                                            // Auto-clear after 3 seconds
                                                                            setTimeout(() => {
                                                                                if (
                                                                                    this.state.pendingDelete === topic
                                                                                ) {
                                                                                    this.setState({
                                                                                        pendingDelete: undefined,
                                                                                    });
                                                                                }
                                                                            }, 3000);
                                                                        } else {
                                                                            // Second tap: confirm delete
                                                                            const updated = this.state.added.filter(
                                                                                p => p.panelTopic !== topic,
                                                                            );
                                                                            const updatedAssignments =
                                                                                this.state.assignments.filter(
                                                                                    ass => ass.topic !== topic,
                                                                                );
                                                                            const newSelected =
                                                                                updated.length > 0
                                                                                    ? updated[0]?.panelTopic
                                                                                    : undefined;
                                                                            this.setState({
                                                                                added: updated,
                                                                                assignments: updatedAssignments,
                                                                                selectedAddedTopic: newSelected,
                                                                                pendingDelete: undefined,
                                                                            });
                                                                            if (
                                                                                this.props.onAssign &&
                                                                                this.props.uniqueName
                                                                            ) {
                                                                                this.props.onAssign(
                                                                                    this.props.uniqueName,
                                                                                    updatedAssignments,
                                                                                );
                                                                            }
                                                                        }
                                                                    }}
                                                                    sx={{
                                                                        color: isPending ? 'error.dark' : 'error.main',
                                                                        opacity: { xs: 1, md: 0 }, // Always visible on mobile
                                                                        transition: 'opacity 0.2s',
                                                                        backgroundColor: isPending
                                                                            ? 'error.main'
                                                                            : 'transparent',
                                                                        '&:hover': {
                                                                            backgroundColor: isPending
                                                                                ? 'error.dark'
                                                                                : 'action.hover',
                                                                        },
                                                                    }}
                                                                >
                                                                    <DeleteOutlineIcon fontSize="small" />
                                                                </IconButton>
                                                            }
                                                        >
                                                            <ListItemButton
                                                                selected={this.state.selectedAddedTopic === topic}
                                                                onClick={() => {
                                                                    this.selectAdded(topic);
                                                                    // Show delete icon on mobile when selecting
                                                                    this.setState({ pendingDelete: undefined });
                                                                }}
                                                                sx={{
                                                                    // Ensure text takes full width minus icon space
                                                                    pr: 6,
                                                                }}
                                                            >
                                                                <ListItemText
                                                                    primary={
                                                                        topic === ALL_PANELS_SPECIAL_ID
                                                                            ? `(${I18n.t('all') || 'All'})`
                                                                            : a.friendlyName
                                                                    }
                                                                    sx={{
                                                                        // Text should use full available width
                                                                        flex: 1,
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                    }}
                                                                />
                                                            </ListItemButton>
                                                        </ListItem>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </List>
                                    </div>
                                )}
                            </Box>
                        );
                    })()}

                    <Divider sx={{ my: 1 }} />

                    {/* navigation selectors for the selected added panel (labels only, options removed) */}
                    {!this.props.hideNavigationFields && (
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
                                        !this.state.alive ||
                                        (this.state.selectedAddedTopic
                                            ? this.state.isLoading[this.state.selectedAddedTopic] || false
                                            : false)
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
                                        !this.state.alive ||
                                        (this.state.selectedAddedTopic
                                            ? this.state.isLoading[this.state.selectedAddedTopic] || false
                                            : false)
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
                                        !this.state.alive ||
                                        (this.state.selectedAddedTopic
                                            ? this.state.isLoading[this.state.selectedAddedTopic] || false
                                            : false)
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
                                        !this.state.alive ||
                                        (this.state.selectedAddedTopic
                                            ? this.state.isLoading[this.state.selectedAddedTopic] || false
                                            : false)
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
                            <Divider sx={{ my: 1 }} />
                        </Box>
                    )}

                    {/* Notice when no next/prev is selected */}
                    {/* Für jedes hinzugefügte Panel: Status + nav summary */}
                    {this.state.added.length > 0
                        ? this.state.added.map(a => {
                              const topic = a.panelTopic;
                              const hasAll: boolean = this.state.added.some(
                                  p => p.panelTopic === ALL_PANELS_SPECIAL_ID,
                              );
                              const nextValue = this.getNavValue(topic, 'next');
                              const prevValue = this.getNavValue(topic, 'prev');
                              const homeValue = this.getNavValue(topic, 'home');
                              const parentValue = this.getNavValue(topic, 'parent');

                              const anyNavSet = !!(nextValue || prevValue || homeValue || parentValue);

                              const isAllThis = topic === ALL_PANELS_SPECIAL_ID;
                              const showNotice = !nextValue && !prevValue;
                              const noticeKey = isAllThis
                                  ? 'nav_all_requires_prev_next'
                                  : hasAll
                                    ? 'nav_remove_from_all_notice'
                                    : 'nav_target_only_notice';

                              return (
                                  <Box
                                      key={`panel-summary-${topic}`}
                                      data-has-all={hasAll}
                                      sx={{ mt: 2, mb: 1 }}
                                  >
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                          <Box
                                              sx={{
                                                  width: 10,
                                                  height: 10,
                                                  borderRadius: '50%',
                                                  bgcolor: anyNavSet ? 'success.main' : 'error.main',
                                              }}
                                          />
                                          <Typography
                                              variant="subtitle2"
                                              sx={{ fontWeight: 600 }}
                                          >
                                              {topic === ALL_PANELS_SPECIAL_ID
                                                  ? `(${I18n.t('all') || 'All'})`
                                                  : a.friendlyName || topic}
                                          </Typography>
                                      </Box>

                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                          {(['next', 'prev', 'parent', 'home'] as const).map((field, idx) => {
                                              const val = this.getNavValue(topic, field);
                                              return (
                                                  <React.Fragment key={`${topic}-${field}`}>
                                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                          <Typography
                                                              variant="caption"
                                                              color="text.secondary"
                                                          >
                                                              {I18n.t(field) || field}
                                                          </Typography>
                                                          <Typography variant="body2">{val || <em>—</em>}</Typography>
                                                      </Box>
                                                      {idx < 3 && (
                                                          <Divider
                                                              orientation="vertical"
                                                              flexItem
                                                              sx={{ height: 18, mx: 1 }}
                                                          />
                                                      )}
                                                  </React.Fragment>
                                              );
                                          })}
                                      </Box>

                                      {/* per-panel notice: shown here under the panel summary; Divider follows the notice */}
                                      {showNotice ? (
                                          <Box sx={{ mt: 1 }}>
                                              <Typography
                                                  variant="caption"
                                                  color="text.secondary"
                                                  sx={{ fontStyle: 'italic' }}
                                              >
                                                  {I18n.t(noticeKey)}
                                              </Typography>
                                          </Box>
                                      ) : null}
                                  </Box>
                              );
                          })
                        : null}

                    {/* children area removed as requested (was rendered below the parent select) */}
                </Box>
            </Box>
        );
    }
}

export default NavigationAssignmentPanel;
