import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    IconButton,
    Divider,
    Select,
    MenuItem,
    FormControl,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LinkIcon from '@mui/icons-material/Link';
import ConfirmDialog from './ConfirmDialog';
import NavigationAssignmentPanel from './NavigationAssignmentPanel';
import type {
    AdminCardTypes,
    NavigationAssignmentList,
    PageConfigEntry,
    AdminPanelConfig,
} from '../../../src/lib/types/adminShareConfig';
import {
    ADAPTER_NAME,
    ALL_PANELS_SPECIAL_ID,
    isMainPageEntry,
    isPageLinkEntry,
    mainPageName,
    pageLinkCard,
    pageLinkProblem,
} from '../../../src/lib/types/adminShareConfig';

/**
 * Name under which an entry is shown in the page list.
 *
 * The stored uniqueName is kept untouched and stays visible; a page flagged as start page only
 * gets the reserved id appended as a marker, so several pages stay distinguishable.
 *
 * @param entry Admin page configuration entry.
 * @returns The name to display, e.g. `Hauptseite1 (main)`.
 */
export function getDisplayName(entry: PageConfigEntry): string {
    return isMainPageEntry(entry) ? `${entry.uniqueName} (${mainPageName})` : entry.uniqueName;
}

export type PageCardType =
    | Extract<
          AdminCardTypes,
          | 'cardChart'
          | 'cardThermo2'
          | 'cardMedia'
          | 'cardAlarm'
          | 'cardQR'
          | 'cardPower'
          | 'cardGrid'
          | 'cardGrid2'
          | 'cardGrid3'
          | 'cardEntities'
          | 'cardSchedule'
      >
    | 'all'
    | 'mainPages' // Filter: alle Seiten mit isMainPage, kein eigener Kartentyp
    | 'cardTrash'
    | typeof pageLinkCard // Verknüpfung auf eine andere Admin-Seite
    | 'pageMenu'; // 'pageMenu' = Gruppe für alle Menu-Kartentypen

const MENU_CARD_TYPES: ReadonlyArray<string> = ['cardGrid', 'cardGrid2', 'cardGrid3', 'cardEntities', 'cardSchedule'];

/**
 * Whether new pages can be created for the given page type selection.
 * 'all' and 'mainPages' are pure filters without a concrete card type.
 *
 * @param cardType Selected page type.
 * @returns true if the selection maps to a concrete card type.
 */
export function canCreateForCardType(cardType: PageCardType): boolean {
    return cardType !== 'all' && cardType !== 'mainPages';
}

/**
 * Filters entries by the selected page type.
 *
 * @param entries Admin page configuration entries.
 * @param cardType Selected page type.
 * @returns The matching entries.
 */
export function filterEntriesByCardType(entries: PageConfigEntry[], cardType: PageCardType): PageConfigEntry[] {
    switch (cardType) {
        case 'all':
            return entries;
        case 'mainPages':
            return entries.filter(e => isMainPageEntry(e));
        case 'pageMenu':
            return entries.filter(e => MENU_CARD_TYPES.includes(e.card));
        default:
            return entries.filter(e => e.card === cardType);
    }
}

/** Sonderwert für den Panel-Filter: Seiten ohne Zuweisung */
const PANEL_FILTER_UNASSIGNED = '___UNASSIGNED___';

export interface PageConfigLayoutProps {
    entries: PageConfigEntry[];
    selected: string;
    selectedCardType: PageCardType;
    onSelectedChange: (name: string) => void;
    onCardTypeChange: (cardType: PageCardType) => void;
    onAdd: (name: string, cardType: PageCardType) => void;
    onDelete: (name: string) => void;
    onAssign: (uniqueName: string, assignments: NavigationAssignmentList) => void;
    children: React.ReactNode;
    oContext: any;
    getText: (key: string) => string;
    navigationPanelProps: any;
    /** Konfigurierte Panels für den Panel-Filter */
    panels?: AdminPanelConfig[];
    /** Seitennamen, die der Adapter bereits kennt (Skript- und Systemseiten) */
    pagesList?: string[];
}

interface PageConfigLayoutState {
    newName: string;
    confirmDeleteOpen: boolean;
    confirmDeleteName: string | null;
    alive?: boolean;
    /** Gewählter Panel-Filterkey (leer = alle) */
    selectedPanelFilter: string;
}

export class PageConfigLayout extends React.Component<PageConfigLayoutProps, PageConfigLayoutState> {
    constructor(props: PageConfigLayoutProps) {
        super(props);
        this.state = {
            newName: '',
            confirmDeleteOpen: false,
            confirmDeleteName: null,
            alive: false,
            selectedPanelFilter: '',
        };
    }

    componentWillUnmount(): void {
        // Unsubscribe from alive state changes
        const instance = this.props.oContext.instance ?? '0';
        this.props.oContext.socket.unsubscribeState(
            `system.adapter.${ADAPTER_NAME}.${instance}.alive`,
            this.onAliveChanged,
        );
    }

    async componentDidMount(): Promise<void> {
        // Get initial alive state and subscribe to changes
        const instance = this.props.oContext.instance ?? '0';
        const aliveStateId = `system.adapter.${ADAPTER_NAME}.${instance}.alive`;

        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            const isAlive = !!state?.val;
            this.setState({ alive: isAlive });

            // Subscribe to alive state changes
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);
        } catch (error) {
            console.error('[PageConfigLayout] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false });
        }
    }

    // Callback for alive state changes
    onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const wasAlive = this.state.alive;
        const isAlive = state ? !!state.val : false;

        if (wasAlive !== isAlive) {
            console.log('[PageConfigLayout] Alive state changed:', { wasAlive, isAlive });
            this.setState({ alive: isAlive });
        }
    };

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private handleAdd = (): void => {
        const name = this.state.newName.trim();
        if (!name || !canCreateForCardType(this.props.selectedCardType)) {
            return;
        }
        this.props.onAdd(name, this.props.selectedCardType);
        this.setState({ newName: '' });
        this.props.onSelectedChange(name);
    };

    private handleDeleteClick = (name: string): void => {
        this.setState({
            confirmDeleteOpen: true,
            confirmDeleteName: name,
        });
    };

    private handleDeleteConfirm = (): void => {
        const name = this.state.confirmDeleteName;
        if (!name) {
            this.setState({ confirmDeleteOpen: false, confirmDeleteName: null });
            return;
        }
        this.props.onDelete(name);
        this.setState({ confirmDeleteOpen: false, confirmDeleteName: null });
    };

    private handleDeleteCancel = (): void => {
        this.setState({ confirmDeleteOpen: false, confirmDeleteName: null });
    };

    /**
     * Name of a list entry; a page link gets a link icon in front, in warning colour if its target
     * is missing.
     *
     * @param name uniqueName of the entry
     * @returns The name element of the list row.
     */
    private renderEntryName(name: string): React.JSX.Element {
        const { entries } = this.props;
        const entry = entries.find(e => e.uniqueName === name);
        const isLink = !!entry && isPageLinkEntry(entry);
        const broken = !!entry && isPageLinkEntry(entry) && !!pageLinkProblem(entry, entries);
        return (
            <Typography
                variant="body2"
                sx={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                }}
            >
                {isLink && (
                    <LinkIcon
                        fontSize="small"
                        color={broken ? 'warning' : 'action'}
                    />
                )}
                {entry ? getDisplayName(entry) : name}
            </Typography>
        );
    }

    /**
     * Small clickable name of the linked page, shown below a page link in the list. A missing
     * target is shown in warning colour and is not clickable.
     *
     * @param name uniqueName of the list entry
     * @param visibleEntries Entries left over by the filters - a target hidden by a filter resets the panel filter.
     * @returns The target line or null if the entry is no page link.
     */
    private renderLinkTarget(name: string, visibleEntries: PageConfigEntry[]): React.JSX.Element | null {
        const { entries } = this.props;
        const entry = entries.find(e => e.uniqueName === name);
        if (!entry || !isPageLinkEntry(entry)) {
            return null;
        }
        const target = entry.target;
        const broken = !!pageLinkProblem(entry, entries);
        return (
            <Box sx={{ width: '100%', pl: 3.5, mt: 0.25 }}>
                <Typography
                    variant="caption"
                    title={broken ? undefined : this.getText('page_link_open_target')}
                    onClick={e => {
                        e.stopPropagation();
                        if (broken) {
                            return;
                        }
                        if (!visibleEntries.some(v => v.uniqueName === target)) {
                            this.setState({ selectedPanelFilter: '' });
                        }
                        this.props.onSelectedChange(target);
                    }}
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.25,
                        color: broken ? 'warning.main' : 'primary.main',
                        cursor: broken ? 'default' : 'pointer',
                        '&:hover': broken ? {} : { textDecoration: 'underline' },
                    }}
                >
                    → {target || '?'}
                </Typography>
            </Box>
        );
    }

    render(): React.JSX.Element {
        const {
            entries,
            selected,
            selectedCardType,
            onSelectedChange,
            onCardTypeChange,
            onAssign,
            children,
            oContext,
            navigationPanelProps,
        } = this.props;
        const { selectedPanelFilter } = this.state;
        const panels: AdminPanelConfig[] = this.props.panels ?? [];
        const uniqueNames = Array.from(new Set(entries.map(e => e.uniqueName))).filter(Boolean);
        const newName = this.state.newName.trim();
        // 'main' darf nicht von Hand vergeben werden - die Startseite wird ausschliesslich ueber
        // die Checkbox in der Navigationszuweisung gesetzt, sonst laufen deren Pruefungen ins Leere.
        const newNameIsReserved = newName === mainPageName;
        // Ein Name, den der Adapter schon kennt, der aber noch keine Admin-Seite ist, gehoert zur
        // Skriptkonfiguration - die Admin-Seite ueberschreibt sie dann.
        const overridesExistingPage =
            !!newName &&
            !newNameIsReserved &&
            !uniqueNames.includes(newName) &&
            (this.props.pagesList ?? []).includes(newName);

        // Filter entries by selected card type
        const cardFilteredEntries = filterEntriesByCardType(entries, selectedCardType);

        // Filter additionally by selected panel
        const filteredEntries =
            selectedPanelFilter === ''
                ? cardFilteredEntries
                : selectedPanelFilter === PANEL_FILTER_UNASSIGNED
                  ? cardFilteredEntries.filter(e => {
                        const assignment = e.navigationAssignment ?? [];
                        return assignment.length === 0;
                    })
                  : cardFilteredEntries.filter(e => {
                        const assignment = e.navigationAssignment ?? [];
                        return assignment.some(
                            a => a.topic === selectedPanelFilter || a.topic === ALL_PANELS_SPECIAL_ID,
                        );
                    });

        // Alphabetisch sortiert
        const filteredUniqueNames = Array.from(new Set(filteredEntries.map(e => e.uniqueName)))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        const currentEntry = entries.find(e => e.uniqueName === selected);
        const currentAssignments = currentEntry?.navigationAssignment || [];
        const docUrl = `https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/${encodeURIComponent(!canCreateForCardType(selectedCardType) ? (currentEntry?.card ? currentEntry.card : 'PageConfig') : selectedCardType)}`;
        return (
            <Box
                sx={{
                    height: 'calc(100vh - 64px)',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    p: 1,
                }}
            >
                {/* Left sidebar: 20% width */}
                <Box
                    sx={{
                        width: { xs: '100%', md: '20%' },
                        pr: { xs: 0, md: 1 },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    {/* Panel Filter - oberhalb der Seitentypauswahl */}
                    {panels.length > 0 && (
                        <Paper
                            sx={{ p: 0, mb: 1, backgroundColor: 'transparent' }}
                            elevation={0}
                        >
                            <FormControl
                                fullWidth
                                variant="standard"
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mb: 1,
                                        fontWeight: 600,
                                        color: 'primary.main',
                                        fontSize: '1rem',
                                    }}
                                >
                                    {this.getText('panel_filter')}
                                </Typography>
                                <Select
                                    value={selectedPanelFilter}
                                    displayEmpty
                                    onChange={e => {
                                        this.setState({ selectedPanelFilter: e.target.value });
                                    }}
                                    sx={{ backgroundColor: 'transparent', px: 1 }}
                                >
                                    <MenuItem value="">{this.getText('panel_filter_all')}</MenuItem>
                                    <MenuItem value={PANEL_FILTER_UNASSIGNED}>
                                        {this.getText('panel_filter_unassigned')}
                                    </MenuItem>
                                    {panels
                                        .filter(p => !!p.topic)
                                        .map(p => (
                                            <MenuItem
                                                key={p.topic}
                                                value={p.topic}
                                            >
                                                {p.name || p.topic}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                        </Paper>
                    )}
                    {/* Page Type Selector - oberhalb der Überschrift */}
                    <Paper
                        sx={{ p: 0, mb: 1, backgroundColor: 'transparent' }}
                        elevation={0}
                    >
                        <FormControl
                            fullWidth
                            variant="standard"
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    mb: 1,
                                    fontWeight: 600,
                                    color: 'primary.main',
                                    fontSize: '1rem',
                                }}
                            >
                                {this.getText('page_type')}
                            </Typography>
                            <Select
                                disabled={!this.state.alive}
                                value={selectedCardType}
                                onChange={e => {
                                    onCardTypeChange(e.target.value);
                                }}
                                sx={{
                                    backgroundColor: 'transparent',
                                    px: 1,
                                }}
                            >
                                <MenuItem value="all">{this.getText('page_type_all')}</MenuItem>
                                <MenuItem value="mainPages">{this.getText('page_type_mainPages')}</MenuItem>
                                <MenuItem value="pageMenu">{this.getText('page_type_pageMenu')}</MenuItem>
                                <MenuItem value="cardAlarm">{this.getText('page_type_alarm')}</MenuItem>
                                <MenuItem value="cardQR">{this.getText('page_type_qr')}</MenuItem>
                                <MenuItem value="cardPower">{this.getText('page_type_power')}</MenuItem>
                                <MenuItem value="cardTrash">{this.getText('page_type_trash')}</MenuItem>
                                <MenuItem value="cardChart">{this.getText('page_type_chart')}</MenuItem>
                                <MenuItem value="cardThermo2">{this.getText('page_type_thermo2')}</MenuItem>
                                <MenuItem value="cardMedia">{this.getText('page_type_media')}</MenuItem>
                                <MenuItem value={pageLinkCard}>{this.getText('page_type_pageLink')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Paper>
                    <Typography
                        variant="h6"
                        sx={{
                            mt: 1,
                            fontWeight: 600,
                            color: 'primary.main',
                            fontSize: '1rem',
                        }}
                    >
                        {this.getText('pages')}
                    </Typography>
                    {/* Add new page - nur anzeigen wenn ein konkreter Kartentyp ausgewählt ist */}
                    {canCreateForCardType(selectedCardType) && (
                        <Paper
                            sx={{ p: 0, backgroundColor: 'transparent' }}
                            elevation={0}
                        >
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    disabled={!this.state.alive}
                                    aria-label="new-name"
                                    label={this.getText('new_page')}
                                    value={this.state.newName}
                                    onChange={e => {
                                        this.setState({ newName: e.target.value });
                                    }}
                                    variant="standard"
                                    placeholder={this.getText('New item')}
                                    slotProps={{
                                        input: { sx: { backgroundColor: 'transparent', px: 1 } },
                                    }}
                                    sx={{
                                        flex: 1,
                                        '& .MuiInput-underline:before': {
                                            borderBottomColor: 'primary.main',
                                        },
                                        '& .MuiInput-underline:hover:before': {
                                            borderBottomColor: 'primary.main',
                                        },
                                        '& .MuiInput-underline:after': {
                                            borderBottomColor: 'primary.main',
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'primary.main',
                                        },
                                        '& .MuiInputLabel-root.Mui-focused': {
                                            color: 'primary.main',
                                        },
                                    }}
                                />
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={this.handleAdd}
                                    disabled={
                                        !this.state.alive ||
                                        !newName ||
                                        newNameIsReserved ||
                                        uniqueNames.includes(newName)
                                    }
                                >
                                    +
                                </Button>
                            </Box>
                            {newNameIsReserved && (
                                <Typography
                                    variant="caption"
                                    sx={{ display: 'block', mt: 0.5, px: 1, color: 'warning.main' }}
                                >
                                    {this.getText('page_name_main_reserved')}
                                </Typography>
                            )}
                            {overridesExistingPage && (
                                <Typography
                                    variant="caption"
                                    sx={{ display: 'block', mt: 0.5, px: 1, color: 'warning.main' }}
                                >
                                    {this.getText('page_overrides_script_page')}
                                </Typography>
                            )}
                        </Paper>
                    )}
                    {/* Pages list */}
                    <Paper
                        sx={{ overflow: 'auto', p: 0, backgroundColor: 'transparent' }}
                        elevation={0}
                    >
                        {filteredUniqueNames.length === 0 ? (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {this.getText('No items')}
                            </Typography>
                        ) : (
                            filteredUniqueNames.map(name => (
                                <Box
                                    key={name}
                                    onClick={() => {
                                        onSelectedChange(name);
                                    }}
                                    sx={{
                                        p: 1,
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        backgroundColor: selected === name ? 'action.selected' : 'transparent',
                                        mb: 0.5,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        '&:hover .delete-icon': {
                                            opacity: 1,
                                        },
                                    }}
                                >
                                    {this.renderEntryName(name)}
                                    <IconButton
                                        disabled={!this.state.alive}
                                        className="delete-icon"
                                        edge="end"
                                        aria-label="delete"
                                        size="small"
                                        onClick={e => {
                                            if (!this.state.alive) {
                                                return;
                                            }
                                            e.stopPropagation();
                                            this.handleDeleteClick(name);
                                        }}
                                        sx={{
                                            color: 'error.main',
                                            opacity: { xs: 1, md: 0 },
                                            transition: 'opacity 0.2s',
                                            pointerEvents: this.state.alive ? 'auto' : 'none',
                                        }}
                                    >
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                    {this.renderLinkTarget(name, filteredEntries)}
                                </Box>
                            ))
                        )}
                    </Paper>
                    <Divider sx={{ my: 1 }} />
                    {/* Documentation link */}
                    {docUrl && (
                        <Box sx={{ mb: 2 }}>
                            <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    fontSize: '0.875rem',
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'primary.main',
                                        textDecoration: 'underline',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            opacity: 0.8,
                                        },
                                    }}
                                >
                                    {this.getText('documentation')}
                                </Typography>
                            </a>
                        </Box>
                    )}
                </Box>

                <ConfirmDialog
                    open={this.state.confirmDeleteOpen}
                    onClose={this.handleDeleteCancel}
                    onConfirm={this.handleDeleteConfirm}
                    title={this.getText('delete_confirm_title')}
                    description={
                        this.getText('delete_confirm_text') +
                        (this.state.confirmDeleteName ? `: ${this.state.confirmDeleteName}` : '')
                    }
                    cancelText={this.getText('Cancel1')}
                    confirmText={this.getText('Delete')}
                    ariaTitleId="unlock-delete-confirm-title"
                    ariaDescId="unlock-delete-confirm-description"
                />

                {/* Right area: main content + navigation panel */}
                <Box
                    sx={{
                        width: { xs: '100%', md: '90%' },
                        pl: { xs: 0, md: 2 },
                        mt: { xs: 2, md: 0 },
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 1,
                        position: 'relative',
                    }}
                >
                    {/* Main content area - dynamically loaded panel */}
                    <Box
                        sx={{
                            width: { xs: '100%', md: '95%' },
                            borderLeft: { xs: 'none', md: '1px solid' },
                            borderColor: 'divider',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Paper
                            sx={{
                                height: '100%',
                                p: 2,
                                overflow: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                            elevation={1}
                        >
                            {children}
                        </Paper>
                    </Box>

                    {/* Navigation assignment panel */}
                    <NavigationAssignmentPanel
                        {...navigationPanelProps}
                        widthPercent={30}
                        uniqueName={selected}
                        currentAssignments={currentAssignments}
                        oContext={oContext}
                        onAssign={onAssign}
                    />
                </Box>
            </Box>
        );
    }
}
