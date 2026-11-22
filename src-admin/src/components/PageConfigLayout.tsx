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
    Checkbox,
    FormControlLabel,
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ConfirmDialog from './ConfirmDialog';
import { CardTypeIcon } from './CardTypeBadge';
import NavigationAssignmentPanel from './NavigationAssignmentPanel';
import { DocButton, DocHelp } from './DocHelp';
import { cardDocTopic } from '../docTopics';
import { pageTypeDocTopic } from '../docTopics/pages1';
import type {
    AdminCardTypes,
    NavigationAssignmentList,
    PageConfigEntry,
    AdminPanelConfig,
} from '../../../src/lib/types/adminShareConfig';
import { findNavigationReferences, type NavigationReference } from '../../../src/lib/types/navigationEdit';
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

/**
 * Whether a page is hidden - locked on the panel while it hides pages (hideCards).
 *
 * @param entry Admin page configuration entry.
 * @returns True if the entry has `hidden: true`.
 */
export function isHiddenEntry(entry: PageConfigEntry): boolean {
    return 'hidden' in entry && entry.hidden === true;
}

export type PageCardType =
    | Extract<
          AdminCardTypes,
          | 'cardChart'
          | 'cardPChart'
          | 'cardThermo2'
          | 'cardThermo'
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

/** Entries of the page type select in display order, with the i18n key of their label. */
const PAGE_TYPE_OPTIONS: ReadonlyArray<{ value: PageCardType; labelKey: string }> = [
    { value: 'all', labelKey: 'page_type_all' },
    { value: 'mainPages', labelKey: 'page_type_mainPages' },
    { value: 'pageMenu', labelKey: 'page_type_pageMenu' },
    { value: 'cardAlarm', labelKey: 'page_type_alarm' },
    { value: 'cardQR', labelKey: 'page_type_qr' },
    { value: 'cardPower', labelKey: 'page_type_power' },
    { value: 'cardTrash', labelKey: 'page_type_trash' },
    { value: 'cardChart', labelKey: 'page_type_chart' },
    { value: 'cardPChart', labelKey: 'page_type_pchart' },
    { value: 'cardThermo2', labelKey: 'page_type_thermo2' },
    { value: 'cardThermo', labelKey: 'page_type_thermo' },
    { value: 'cardMedia', labelKey: 'page_type_media' },
    { value: pageLinkCard, labelKey: 'page_type_pageLink' },
];

/** Size of the type icon in front of each page in the list, in px. */
const LIST_TYPE_ICON_SIZE = 16;
/** Gap between the type icon and the name in the page list, in theme spacing units. */
const LIST_TYPE_ICON_GAP = 0.75;

/**
 * Label key of a page type select value; the closed select shows only the label, without the help icon.
 *
 * @param value Selected page type.
 * @returns The i18n key of its label.
 */
function pageTypeLabelKey(value: PageCardType): string {
    return PAGE_TYPE_OPTIONS.find(option => option.value === value)?.labelKey ?? value;
}

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

/**
 * Filters page names by the text of the name field: trimmed, case-insensitive substring match.
 *
 * @param names uniqueNames of the pages.
 * @param filterText Text of the name field; empty means no filter.
 * @returns The matching names.
 */
export function filterNamesByText(names: string[], filterText: string): string[] {
    const needle = filterText.trim().toLowerCase();
    if (!needle) {
        return names;
    }
    return names.filter(n => n.toLowerCase().includes(needle));
}

/**
 * Why the add button is disabled, as i18n key, or null if a page can be created.
 * Order: adapter alive, concrete page type, name given, name not reserved, name not taken.
 *
 * @param alive Whether the adapter instance is running.
 * @param cardType Selected page type.
 * @param name Trimmed name from the name field.
 * @param existingNames uniqueNames of all entries.
 * @returns The i18n key of the first reason or null.
 */
export function getAddPageBlockReason(
    alive: boolean,
    cardType: PageCardType,
    name: string,
    existingNames: string[],
): string | null {
    if (!alive) {
        return 'add_page_disabled_not_alive';
    }
    if (!canCreateForCardType(cardType)) {
        return 'add_page_disabled_no_type';
    }
    if (!name) {
        return 'add_page_disabled_no_name';
    }
    if (name === mainPageName) {
        return 'add_page_disabled_reserved';
    }
    if (existingNames.includes(name)) {
        return 'add_page_disabled_exists';
    }
    return null;
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
    /** deletes a page; `closeChain` hands its prev/next over to the pages that point at it */
    onDelete: (name: string, closeChain: boolean) => void;
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
    /** option of the delete confirmation: close the prev/next gap the page leaves behind */
    confirmDeleteCloseChain: boolean;
    alive?: boolean;
    /** Gewählter Panel-Filterkey (leer = alle) */
    selectedPanelFilter: string;
    /** Height of the name/filter input line in px - width of the square add button, unset until measured */
    addButtonSize?: number;
}

export class PageConfigLayout extends React.Component<PageConfigLayoutProps, PageConfigLayoutState> {
    /** How many referencing pages the delete dialog names before it counts the rest. */
    private static readonly maxReferencesShown = 5;

    /** Watches the height of the name/filter input line - the add button is as wide as it is high */
    private inputLineObserver?: ResizeObserver;

    constructor(props: PageConfigLayoutProps) {
        super(props);
        this.state = {
            newName: '',
            confirmDeleteOpen: false,
            confirmDeleteName: null,
            confirmDeleteCloseChain: false,
            alive: false,
            selectedPanelFilter: '',
        };
    }

    componentWillUnmount(): void {
        this.inputLineObserver?.disconnect();
        // Unsubscribe from alive state changes
        const instance = this.props.oContext.instance ?? '0';
        this.props.oContext.socket.unsubscribeState(
            `system.adapter.${ADAPTER_NAME}.${instance}.alive`,
            this.onAliveChanged,
        );
    }

    /**
     * Ref of the name/filter field: measures the height of its input line for the add button. CSS
     * stretches the button to that height but cannot derive its width from it.
     *
     * @param element Root of the text field, `null` when it is unmounted.
     */
    private setInputLineRef = (element: HTMLDivElement | null): void => {
        this.inputLineObserver?.disconnect();
        if (!element) {
            return;
        }
        this.inputLineObserver ??= new ResizeObserver(entries => {
            const height = entries[entries.length - 1]?.target.getBoundingClientRect().height;
            if (height && height !== this.state.addButtonSize) {
                this.setState({ addButtonSize: height });
            }
        });
        this.inputLineObserver.observe(element);
    };

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
            confirmDeleteCloseChain: false,
        });
    };

    private handleDeleteConfirm = (): void => {
        const name = this.state.confirmDeleteName;
        if (!name) {
            this.setState({ confirmDeleteOpen: false, confirmDeleteName: null, confirmDeleteCloseChain: false });
            return;
        }
        this.props.onDelete(name, this.state.confirmDeleteCloseChain);
        this.setState({ confirmDeleteOpen: false, confirmDeleteName: null, confirmDeleteCloseChain: false });
    };

    /**
     * Description of the delete confirmation: the question, and the pages that point at the page
     * to be deleted. Deleting does not clean those references up, so they are named beforehand.
     *
     * Only pages of the admin configuration are found - a reference from a configuration script is
     * not part of it, which the hint says.
     *
     * @returns The description for the confirmation dialog.
     */
    /**
     * The pages that point at the page the delete confirmation is open for.
     *
     * @returns The references, empty while no dialog is open.
     */
    private deleteReferences(): NavigationReference[] {
        const name = this.state.confirmDeleteName;
        return name ? findNavigationReferences(this.props.entries, name) : [];
    }

    /**
     * The option to close the prev/next gap, offered only when a page actually points at the one that
     * goes away with prev or next - home/parent name a destination, there is no gap to close.
     *
     * @returns The checkbox for the delete confirmation, or `null`.
     */
    private renderDeleteCloseChain(): React.ReactNode {
        const inChain = this.deleteReferences().some(
            reference => reference.kinds.includes('prev') || reference.kinds.includes('next'),
        );
        if (!inChain) {
            return null;
        }
        return (
            <FormControlLabel
                sx={{ mt: 1, alignItems: 'flex-start' }}
                control={
                    <Checkbox
                        checked={this.state.confirmDeleteCloseChain}
                        onChange={e => this.setState({ confirmDeleteCloseChain: e.target.checked })}
                        size="small"
                    />
                }
                label={
                    <>
                        <Box
                            component="span"
                            sx={{ display: 'block' }}
                        >
                            {this.getText('delete_confirm_close_chain')}
                        </Box>
                        <Box
                            component="span"
                            sx={{ display: 'block', fontSize: '0.8rem', color: 'text.secondary' }}
                        >
                            {this.getText('delete_confirm_close_chain_hint')}
                        </Box>
                    </>
                }
            />
        );
    }

    private renderDeleteDescription(): React.ReactNode {
        const name = this.state.confirmDeleteName;
        const question = this.getText('delete_confirm_text') + (name ? `: ${name}` : '');
        const references = this.deleteReferences();
        const help = <DocHelp topic="pages1.delete" />;
        if (!references.length) {
            return (
                <>
                    {question}
                    {help}
                </>
            );
        }
        const shown = references.slice(0, PageConfigLayout.maxReferencesShown);
        let list = shown.map(reference => reference.uniqueName).join(', ');
        const rest = references.length - shown.length;
        if (rest > 0) {
            list += ` ${this.getText('delete_confirm_referenced_more').replace('%n', String(rest))}`;
        }
        return (
            <>
                {question}
                {help}
                <Box
                    component="span"
                    sx={{ display: 'block', mt: 1, fontWeight: 600 }}
                >
                    {this.getText('delete_confirm_referenced').replace('%s', list)}
                </Box>
                <Box
                    component="span"
                    sx={{ display: 'block', mt: 1 }}
                >
                    {this.getText('delete_confirm_referenced_hint')}
                </Box>
            </>
        );
    }

    private handleDeleteCancel = (): void => {
        this.setState({ confirmDeleteOpen: false, confirmDeleteName: null, confirmDeleteCloseChain: false });
    };

    /**
     * Entries left over by the card type and panel filters.
     *
     * @returns The entries the list shows.
     */
    private getVisibleEntries(): PageConfigEntry[] {
        const { selectedPanelFilter } = this.state;
        // Filter entries by selected card type
        const cardFilteredEntries = filterEntriesByCardType(this.props.entries, this.props.selectedCardType);

        // Filter additionally by selected panel
        return selectedPanelFilter === ''
            ? cardFilteredEntries
            : selectedPanelFilter === PANEL_FILTER_UNASSIGNED
              ? cardFilteredEntries.filter(e => {
                    const assignment = e.navigationAssignment ?? [];
                    return assignment.length === 0;
                })
              : cardFilteredEntries.filter(e => {
                    const assignment = e.navigationAssignment ?? [];
                    return assignment.some(a => a.topic === selectedPanelFilter || a.topic === ALL_PANELS_SPECIAL_ID);
                });
    }

    /**
     * Selects a page; a target hidden by a filter resets the panel filter. The card type filter is
     * handled by `onSelectedChange`.
     *
     * @param name uniqueName of the page
     */
    private handleOpenPage = (name: string): void => {
        if (!this.getVisibleEntries().some(v => v.uniqueName === name)) {
            this.setState({ selectedPanelFilter: '' });
        }
        this.props.onSelectedChange(name);
    };

    /**
     * Name of a list entry with the icon of its card type in front (tooltip: type name); a page link
     * shows the link icon, in warning colour if its target is missing.
     *
     * @param name uniqueName of the entry
     * @returns The name element of the list row.
     */
    private renderEntryName(name: string): React.JSX.Element {
        const { entries } = this.props;
        const entry = entries.find(e => e.uniqueName === name);
        const broken = !!entry && isPageLinkEntry(entry) && !!pageLinkProblem(entry, entries);
        return (
            <Typography
                variant="body2"
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: LIST_TYPE_ICON_GAP,
                }}
            >
                {entry ? (
                    <CardTypeIcon
                        card={entry.card}
                        getText={this.props.getText}
                        sx={{
                            fontSize: LIST_TYPE_ICON_SIZE,
                            flexShrink: 0,
                            color: broken ? 'warning.main' : 'text.secondary',
                        }}
                    />
                ) : null}
                <Box
                    component="span"
                    sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                    {entry ? getDisplayName(entry) : name}
                </Box>
                {entry && isHiddenEntry(entry) ? (
                    <Tooltip title={this.props.getText('page_hidden_locked')}>
                        <VisibilityOffIcon
                            aria-label={this.props.getText('page_hidden_locked')}
                            sx={{ fontSize: LIST_TYPE_ICON_SIZE, flexShrink: 0, color: 'text.secondary' }}
                        />
                    </Tooltip>
                ) : null}
            </Typography>
        );
    }

    /**
     * Small clickable name of the linked page, shown below a page link in the list. A missing
     * target is shown in warning colour and is not clickable.
     *
     * @param name uniqueName of the list entry
     * @returns The target line or null if the entry is no page link.
     */
    private renderLinkTarget(name: string): React.JSX.Element | null {
        const { entries } = this.props;
        const entry = entries.find(e => e.uniqueName === name);
        if (!entry || !isPageLinkEntry(entry)) {
            return null;
        }
        const target = entry.target;
        const broken = !!pageLinkProblem(entry, entries);
        return (
            <Box
                sx={theme => ({
                    width: '100%',
                    pl: `calc(${LIST_TYPE_ICON_SIZE}px + ${theme.spacing(LIST_TYPE_ICON_GAP)})`,
                    mt: 0.25,
                })}
            >
                <Typography
                    variant="caption"
                    title={broken ? undefined : this.getText('page_link_open_target')}
                    onClick={e => {
                        e.stopPropagation();
                        if (broken) {
                            return;
                        }
                        this.handleOpenPage(target);
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

        const filteredEntries = this.getVisibleEntries();

        // Alphabetisch sortiert, zusätzlich nach dem Inhalt des Namensfelds gefiltert
        const filteredUniqueNames = filterNamesByText(
            Array.from(new Set(filteredEntries.map(e => e.uniqueName))).filter(Boolean),
            newName,
        ).sort((a, b) => a.localeCompare(b));
        const addBlockReason = getAddPageBlockReason(!!this.state.alive, selectedCardType, newName, uniqueNames);

        const currentEntry = entries.find(e => e.uniqueName === selected);
        const currentAssignments = currentEntry?.navigationAssignment || [];
        const documentationTopic = cardDocTopic(
            !canCreateForCardType(selectedCardType) ? currentEntry?.card : selectedCardType,
        );
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
                                    <DocHelp topic="pages1.panelFilter" />
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
                                <DocHelp topic="pages1.pageType" />
                            </Typography>
                            <Select
                                disabled={!this.state.alive}
                                value={selectedCardType}
                                renderValue={value => this.getText(pageTypeLabelKey(value))}
                                onChange={e => {
                                    onCardTypeChange(e.target.value);
                                }}
                                sx={{
                                    backgroundColor: 'transparent',
                                    px: 1,
                                }}
                            >
                                {PAGE_TYPE_OPTIONS.map(option => {
                                    const topic = pageTypeDocTopic(option.value);
                                    return (
                                        <MenuItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {this.getText(option.labelKey)}
                                            {topic && (
                                                <DocHelp
                                                    topic={topic}
                                                    sx={{ ml: 'auto', pl: 1 }}
                                                />
                                            )}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Paper>
                    {/* Name field: filters the list and names a new page */}
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
                                {this.getText('pages')}
                                <DocHelp topic="pages1.createDelete" />
                            </Typography>
                            {/* stretch: the add button takes the height of the input line */}
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
                                <TextField
                                    ref={this.setInputLineRef}
                                    aria-label="new-name"
                                    value={this.state.newName}
                                    onChange={e => {
                                        this.setState({ newName: e.target.value });
                                    }}
                                    variant="standard"
                                    placeholder={this.getText('page_name_filter_placeholder')}
                                    slotProps={{
                                        input: { sx: { backgroundColor: 'transparent', px: 1 } },
                                    }}
                                    sx={{ flex: 1 }}
                                />
                                <Tooltip title={this.getText(addBlockReason ?? 'add_page_tooltip')}>
                                    <span style={{ display: 'flex' }}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={this.handleAdd}
                                            disabled={addBlockReason !== null}
                                            aria-label={this.getText('add_page_tooltip')}
                                            // height: stretched to the input line, width: its measured height
                                            sx={{
                                                width: this.state.addButtonSize ?? 32,
                                                minWidth: 0,
                                                p: 0,
                                                // MUI's disabled colour is too faint for an icon-only button
                                                '&.Mui-disabled': { color: 'text.secondary' },
                                            }}
                                        >
                                            <AddIcon fontSize="small" />
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Box>
                        </FormControl>
                        {newNameIsReserved && (
                            <Typography
                                variant="caption"
                                sx={{ display: 'block', mt: 0.5, px: 1, color: 'warning.main' }}
                            >
                                {this.getText('page_name_main_reserved')}
                            </Typography>
                        )}
                        {overridesExistingPage && canCreateForCardType(selectedCardType) && (
                            <Typography
                                variant="caption"
                                sx={{ display: 'block', mt: 0.5, px: 1, color: 'warning.main' }}
                            >
                                {this.getText('page_overrides_script_page')}
                            </Typography>
                        )}
                    </Paper>
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
                                    {this.renderLinkTarget(name)}
                                </Box>
                            ))
                        )}
                    </Paper>
                    <Divider sx={{ my: 1 }} />
                    {/* Documentation link */}
                    <Box sx={{ mb: 2 }}>
                        <DocButton topic={documentationTopic} />
                    </Box>
                </Box>

                <ConfirmDialog
                    open={this.state.confirmDeleteOpen}
                    onClose={this.handleDeleteCancel}
                    onConfirm={this.handleDeleteConfirm}
                    title={this.getText('delete_confirm_title')}
                    description={this.renderDeleteDescription()}
                    extra={this.renderDeleteCloseChain()}
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
                        onOpenPage={this.handleOpenPage}
                    />
                </Box>
            </Box>
        );
    }
}
