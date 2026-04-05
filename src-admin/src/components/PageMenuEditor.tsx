import React from 'react';
import {
    Alert,
    Box,
    Button,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Typography,
    Paper,
    IconButton,
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon from '@mui/icons-material/Delete';
import WidgetsIcon from '@mui/icons-material/Widgets';
import {
    type MenuEntry,
    type PageItemConfig,
    type AdminPanelConfig,
    ADAPTER_NAME,
} from '../../../src/lib/types/adminShareConfig';
import ChannelConfigDialog from './ChannelConfigDialog';
import icons from '../icons.json';

/** Basis-Slot-Anzahl pro Kartentyp (cardGrid2: eu/us-l = 8, us-p = 9) */
const SLOT_COUNTS_BASE: Record<MenuEntry['card'], number> = {
    cardGrid: 6,
    cardGrid2: 8,
    cardGrid3: 4,
    cardEntities: 4,
    cardSchedule: 6,
};

/** Ergebnis der Panel-Modell-Auswertung für cardGrid2 */
type Grid2ModelStatus = 'all-usp' | 'none-usp' | 'conflict' | 'unknown';

/**
 * Default-Icons pro channel role, abgeleitet aus getPageItemConfig (die korrekte Funktion).
 * Reihenfolge: [trueIcon, falseIcon]
 */
const ROLE_DEFAULT_ICONS: Record<string, [string, string]> = {
    airCondition: ['thermometer', 'snowflake-thermometer'],
    blind: ['window-shutter-open', 'window-shutter'],
    button: ['gesture-tap-button', 'gesture-tap-button'],
    ct: ['lightbulb', 'lightbulb-outline'],
    dimmer: ['lightbulb', 'lightbulb-outline'],
    door: ['door-open', 'door-closed'],
    gate: ['garage-open', 'garage'],
    hue: ['lightbulb', 'lightbulb-outline'],
    humidity: ['water-percent', 'water-off'],
    info: ['information-outline', 'information-off-outline'],
    'level.mode.fan': ['fan', 'fan-off'],
    'level.timer': ['timer', 'timer-off'],
    light: ['lightbulb', 'lightbulb-outline'],
    lock: ['lock-open-variant', 'lock'],
    media: ['play-box-multiple', 'play-box-multiple-outline'],
    motion: ['motion-sensor', 'motion-sensor'],
    rgb: ['lightbulb', 'lightbulb-outline'],
    rgbSingle: ['lightbulb', 'lightbulb-outline'],
    select: ['clipboard-list-outline', 'clipboard-list'],
    'sensor.alarm.flood': ['water-alert', 'water-alert'],
    slider: ['plus-minus-variant', 'plus-minus-variant'],
    socket: ['power-socket-de', 'power-socket-de'],
    temperature: ['thermometer', 'snowflake-thermometer'],
    thermostat: ['thermometer', 'snowflake-thermometer'],
    timeTable: ['train', 'train'],
    'value.humidity': ['water-percent', 'water-off'],
    'value.temperature': ['thermometer', 'snowflake-thermometer'],
    volume: ['volume-high', 'volume-mute'],
    warning: ['alert-decagram-outline', 'alert-decagram-outline'],
    window: ['window-open-variant', 'window-closed-variant'],
};

export interface PageMenuEditorProps {
    entry: MenuEntry;
    onEntryChange: (updated: MenuEntry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
    /** Alle konfigurierten Panels aus den Adapter-Native-Daten */
    panels?: AdminPanelConfig[];
    /** Expert-Mode aus dem json-config-System */
    expertMode?: boolean;
    /** Alle verfügbaren Seiten (aus sendTo) – wird an ChannelConfigDialog weitergegeben */
    pagesList?: string[];
}

interface PageMenuEditorState {
    alive: boolean;
    editingSlotIndex: number | null;
    dragOverIndex: number | null;
    extraPages: number;
    /** Gefilterte Seiten basierend auf den zugewiesenen Panels */
    filteredPagesList: string[];
}

export class PageMenuEditor extends React.Component<PageMenuEditorProps, PageMenuEditorState> {
    private dialogRef = React.createRef<ChannelConfigDialog>();
    private static iconMap: Map<string, string> | null = null;
    /** Instanzvariable: synchroner Zugriff beim Drop ohne async-setState-Verzögerung */
    private dragSourceIndex: number | null = null;

    constructor(props: PageMenuEditorProps) {
        super(props);
        this.state = {
            alive: false,
            editingSlotIndex: null,
            dragOverIndex: null,
            extraPages: 0,
            filteredPagesList: [],
        };
    }

    /**
     * Berechnet den Modell-Status für cardGrid2 anhand der zugewiesenen Panels.
     * - Keine Zuweisung → alle konfigurierten Panels werden herangezogen.
     * - Gemischt us-p/non-usp → 'conflict'.
     */
    private getGrid2ModelStatus(): Grid2ModelStatus {
        const panels = this.props.panels ?? [];
        const assignment = this.props.entry.navigationAssignment;

        // Keine Zuweisung → kein Konflikt anzeigen
        if (!assignment || assignment.length === 0) {
            return 'unknown';
        }

        const activePanels = assignment
            .map(a => panels.find(p => p.topic === a.topic))
            .filter((p): p is AdminPanelConfig => p !== undefined);

        if (activePanels.length === 0) {
            return 'unknown';
        }
        const uspCount = activePanels.filter(p => p.model === 'us-p').length;
        if (uspCount === 0) {
            return 'none-usp';
        }
        if (uspCount === activePanels.length) {
            return 'all-usp';
        }
        return 'conflict';
    }

    /**
     * Callback für Object-Änderungen an Panel-Objekten
     *
     * @param _id
     * @param _obj
     */
    private onPanelObjectChanged = (_id: string, _obj: ioBroker.Object | null | undefined): void => {
        void this.loadFilteredPages();
    };

    /** Aktuell abonnierte Panel-Objekt-IDs */
    private subscribedPanelObjectIds: Set<string> = new Set();

    private async updatePanelObjectSubscriptions(): Promise<void> {
        const socket = this.props.oContext?.socket;
        if (!socket) {
            return;
        }
        const instance = this.props.oContext?.instance ?? '0';
        const panels = this.props.panels ?? [];
        const assignment = this.props.entry.navigationAssignment ?? [];

        const newIds: Set<string> = new Set(
            assignment
                .map(a => panels.find(p => p.topic === a.topic)?.id)
                .filter((id): id is string => !!id)
                .map(id => `${ADAPTER_NAME}.${instance}.panels.${id}`),
        );

        // Alte abmelden
        for (const id of this.subscribedPanelObjectIds) {
            if (!newIds.has(id)) {
                try {
                    await socket.unsubscribeObject(id, this.onPanelObjectChanged);
                } catch (e) {
                    console.warn(`[PageMenuEditor] unsubscribeObject failed for ${id}`, e);
                }
            }
        }
        // Neue anmelden
        for (const id of newIds) {
            if (!this.subscribedPanelObjectIds.has(id)) {
                try {
                    await socket.subscribeObject(id, this.onPanelObjectChanged);
                } catch (e) {
                    console.warn(`[PageMenuEditor] subscribeObject failed for ${id}`, e);
                }
            }
        }
        this.subscribedPanelObjectIds = newIds;
    }

    componentWillUnmount(): void {
        const instance = this.props.oContext.instance ?? '0';
        this.props.oContext.socket.unsubscribeState(
            `system.adapter.${ADAPTER_NAME}.${instance}.alive`,
            this.onAliveChanged,
        );
        // Panel-Objekt-Subscriptions abmelden
        const socket = this.props.oContext?.socket;
        if (socket) {
            for (const id of this.subscribedPanelObjectIds) {
                void socket.unsubscribeObject(id, this.onPanelObjectChanged);
            }
        }
        this.subscribedPanelObjectIds.clear();
    }

    componentDidUpdate(prevProps: PageMenuEditorProps): void {
        // Wenn cardGrid2 gerade aktiv ist und ein Konflikt entsteht → automatisch auf cardGrid wechseln
        if (
            this.props.entry.card === 'cardGrid2' &&
            this.getGrid2ModelStatus() === 'conflict' &&
            (prevProps.entry.navigationAssignment !== this.props.entry.navigationAssignment ||
                prevProps.panels !== this.props.panels)
        ) {
            this.props.onEntryChange({ ...this.props.entry, card: 'cardGrid' });
        }
        // Gefilterte Seitenliste neu laden wenn sich Zuweisung oder pagesList ändert
        if (
            prevProps.entry.navigationAssignment !== this.props.entry.navigationAssignment ||
            prevProps.pagesList !== this.props.pagesList
        ) {
            void this.updatePanelObjectSubscriptions();
            void this.loadFilteredPages();
        }
    }

    async componentDidMount(): Promise<void> {
        const instance = this.props.oContext.instance ?? '0';
        const aliveStateId = `system.adapter.${ADAPTER_NAME}.${instance}.alive`;
        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            this.setState({ alive: !!state?.val });
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);
        } catch (error) {
            console.error('[PageMenuEditor] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false });
        }
        void this.loadFilteredPages();
        void this.updatePanelObjectSubscriptions();
    }

    /**
     * Lädt die Seiten der zugewiesenen Panels via native.navigationNodes aus den ioBroker-Objekten.
     * Ohne Zuweisung wird pagesList direkt übernommen.
     */
    private async loadFilteredPages(): Promise<void> {
        const assignment = this.props.entry.navigationAssignment;
        const pagesList = this.props.pagesList ?? [];

        if (!assignment || assignment.length === 0) {
            this.setState({ filteredPagesList: pagesList });
            return;
        }

        const socket = this.props.oContext?.socket;
        const instance = this.props.oContext?.instance ?? '0';
        const panels = this.props.panels ?? [];

        if (!socket) {
            this.setState({ filteredPagesList: pagesList });
            return;
        }

        try {
            const pageSets: Set<string>[] = await Promise.all(
                assignment.map(async a => {
                    const panel = panels.find(p => p.topic === a.topic);
                    if (!panel?.id) {
                        return new Set<string>();
                    }
                    const objectId = `${ADAPTER_NAME}.${instance}.panels.${panel.id}`;
                    try {
                        const obj: ioBroker.Object | null | undefined = await socket.getObject(objectId);
                        const nodes: string[] = Array.isArray(obj?.native?.navigationNodes)
                            ? (obj.native.navigationNodes as string[])
                            : [];
                        return new Set<string>(nodes);
                    } catch (e) {
                        console.warn(`[PageMenuEditor] getObject failed for ${objectId}`, e);
                        return new Set<string>();
                    }
                }),
            );

            // Nur nicht-leere Sets intersecten; wenn alle leer → leere Liste
            const nonEmpty = pageSets.filter(s => s.size > 0);
            const intersection =
                nonEmpty.length === 0
                    ? new Set<string>()
                    : nonEmpty.reduce((acc, cur) => {
                          const result = new Set<string>();
                          for (const s of acc) {
                              if (cur.has(s)) {
                                  result.add(s);
                              }
                          }
                          return result;
                      });

            const sorted = [...intersection].sort((a, b) => {
                if (a === 'main') {
                    return -1;
                }
                if (b === 'main') {
                    return 1;
                }
                return a.localeCompare(b);
            });

            this.setState({ filteredPagesList: sorted });
        } catch (e) {
            console.warn('[PageMenuEditor] loadFilteredPages failed', e);
            this.setState({ filteredPagesList: pagesList });
        }
    }

    onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const isAlive = state ? !!state.val : false;
        if (this.state.alive !== isAlive) {
            this.setState({ alive: isAlive });
        }
    };

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private static getIconSrc(name: string): string {
        if (!name) {
            return '';
        }
        if (!PageMenuEditor.iconMap) {
            PageMenuEditor.iconMap = new Map();
            for (const icon of icons as { name: string; base64: string }[]) {
                PageMenuEditor.iconMap.set(icon.name, icon.base64);
            }
        }
        return PageMenuEditor.iconMap.get(name) ?? '';
    }

    /**
     * Gibt die base64-Bildquelle für ein PageItem zurück.
     * Ist kein explizites Icon gesetzt, wird das Role-Default-Icon verwendet.
     *
     * @param item
     * @param forTrue
     */
    private getItemIconSrc(item: PageItemConfig, forTrue = true): string {
        const explicit = forTrue ? item.trueIcon : item.falseIcon;
        if (explicit) {
            return PageMenuEditor.getIconSrc(explicit);
        }
        // Fallback: Role-Default aus gespeicherter role
        const role = item.role ?? '';
        const defaults = ROLE_DEFAULT_ICONS[role];
        if (defaults) {
            const [trueDefault, falseDefault] = defaults;
            return PageMenuEditor.getIconSrc(forTrue ? trueDefault : falseDefault);
        }
        return '';
    }

    private handleCardTypeChange(card: MenuEntry['card']): void {
        this.setState({ extraPages: 0 });
        this.props.onEntryChange({ ...this.props.entry, card });
    }

    private handleSlotClick = (index: number): void => {
        const item = (this.props.entry.pageItems ?? [])[index];
        this.setState({ editingSlotIndex: index });
        this.dialogRef.current?.openWith(item);
    };

    private handleItemSave = (config: PageItemConfig): void => {
        const { editingSlotIndex } = this.state;
        if (editingSlotIndex === null) {
            return;
        }
        const pageItems = [...(this.props.entry.pageItems ?? [])];
        while (pageItems.length <= editingSlotIndex) {
            pageItems.push(undefined);
        }
        pageItems[editingSlotIndex] = config;
        this.props.onEntryChange({ ...this.props.entry, pageItems });
    };

    private handleItemDelete = (index: number, e: React.MouseEvent): void => {
        e.stopPropagation();
        const pageItems = [...(this.props.entry.pageItems ?? [])];
        pageItems[index] = undefined;
        this.props.onEntryChange({ ...this.props.entry, pageItems });
    };

    private handleDragStart = (index: number, e: React.DragEvent): void => {
        this.dragSourceIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
    };

    private handleDragOver = (index: number, e: React.DragEvent): void => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (this.state.dragOverIndex !== index) {
            this.setState({ dragOverIndex: index });
        }
    };

    private handleDragLeave = (): void => {
        this.setState({ dragOverIndex: null });
    };

    private handleDragEnd = (): void => {
        this.dragSourceIndex = null;
        this.setState({ dragOverIndex: null });
    };

    private handleDrop = (targetIndex: number, e: React.DragEvent): void => {
        e.preventDefault();
        const src = this.dragSourceIndex;
        this.dragSourceIndex = null;
        this.setState({ dragOverIndex: null });
        if (src === null || src === targetIndex) {
            return;
        }
        const pageItems = [...(this.props.entry.pageItems ?? [])];
        const maxIdx = Math.max(src, targetIndex);
        while (pageItems.length <= maxIdx) {
            pageItems.push(undefined);
        }
        [pageItems[src], pageItems[targetIndex]] = [pageItems[targetIndex], pageItems[src]];
        this.props.onEntryChange({ ...this.props.entry, pageItems });
    };

    private getGridConfig(
        card: MenuEntry['card'],
        grid2Status: Grid2ModelStatus,
    ): { columns: string; uspSpecial: boolean; wide: boolean } {
        switch (card) {
            case 'cardGrid':
                return { columns: 'repeat(3, 1fr)', uspSpecial: false, wide: false };
            case 'cardGrid2':
                return grid2Status === 'all-usp'
                    ? { columns: 'repeat(2, 1fr)', uspSpecial: true, wide: false }
                    : { columns: 'repeat(4, 1fr)', uspSpecial: false, wide: false };
            case 'cardGrid3':
                return { columns: 'repeat(2, 1fr)', uspSpecial: false, wide: false };
            case 'cardEntities':
                return { columns: '1fr', uspSpecial: false, wide: true };
            case 'cardSchedule':
                return { columns: '1fr', uspSpecial: false, wide: true };
            default:
                return { columns: 'repeat(3, 1fr)', uspSpecial: false, wide: false };
        }
    }

    private renderSlot(index: number, totalSlots: number, wide: boolean): React.JSX.Element {
        const pageItems = this.props.entry.pageItems ?? [];
        const item = pageItems[index];
        const isDragSource = this.dragSourceIndex === index;
        const isDragOver = this.state.dragOverIndex === index;
        const isLastSlot = index === totalSlots - 1;

        if (item === undefined) {
            // Leerer Slot – klickbar, empfängt Drops
            return (
                <Tooltip
                    key={index}
                    title={this.getText('pageMenu_add_item')}
                >
                    <Paper
                        elevation={0}
                        onClick={() => this.handleSlotClick(index)}
                        onDragOver={e => this.handleDragOver(index, e)}
                        onDragLeave={this.handleDragLeave}
                        onDrop={e => this.handleDrop(index, e)}
                        sx={{
                            width: '100%',
                            height: wide ? 44 : 96,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: isDragOver ? '2px dashed' : '1px dashed',
                            borderColor: isDragOver ? 'primary.main' : 'divider',
                            backgroundColor: isDragOver ? 'action.hover' : 'transparent',
                            cursor: 'pointer',
                            opacity: isLastSlot ? 0.5 : 0.35,
                            transition: 'border-color 0.15s, background-color 0.15s',
                            '&:hover': { opacity: 0.8, borderColor: 'primary.light' },
                        }}
                    >
                        <AddIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                    </Paper>
                </Tooltip>
            );
        }

        const iconSrc = this.getItemIconSrc(item, true);
        const label = item.name || String(index + 1);

        if (wide) {
            // Listenansicht (cardEntities / cardSchedule)
            return (
                <Tooltip
                    key={index}
                    title={item.channelId || label}
                >
                    <Paper
                        elevation={isDragSource ? 0 : 2}
                        draggable
                        onDragStart={e => this.handleDragStart(index, e)}
                        onDragEnd={this.handleDragEnd}
                        onDragOver={e => this.handleDragOver(index, e)}
                        onDragLeave={this.handleDragLeave}
                        onDrop={e => this.handleDrop(index, e)}
                        onClick={() => this.handleSlotClick(index)}
                        sx={{
                            width: '100%',
                            height: 44,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            px: 1,
                            gap: 1,
                            cursor: isDragSource ? 'grabbing' : 'grab',
                            userSelect: 'none',
                            opacity: isDragSource ? 0.4 : 1,
                            outline: isDragOver ? '2px solid' : 'none',
                            outlineColor: 'primary.main',
                            transition: 'opacity 0.15s, outline 0.1s',
                            '&:hover': { backgroundColor: 'action.hover' },
                        }}
                    >
                        <Box
                            sx={{
                                width: 28,
                                height: 28,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            {iconSrc ? (
                                <img
                                    src={iconSrc}
                                    alt={label}
                                    style={{ width: 24, height: 24 }}
                                />
                            ) : (
                                <WidgetsIcon sx={{ fontSize: 24, color: 'text.secondary' }} />
                            )}
                        </Box>
                        <Typography
                            variant="body2"
                            sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                            {label}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={e => this.handleItemDelete(index, e)}
                            color="error"
                            sx={{ p: 0.25 }}
                        >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Paper>
                </Tooltip>
            );
        }

        // Kachelansicht (Grid-Typen)
        return (
            <Tooltip
                key={index}
                title={item.channelId || label}
            >
                <Paper
                    elevation={isDragSource ? 0 : 2}
                    draggable
                    onDragStart={e => this.handleDragStart(index, e)}
                    onDragEnd={this.handleDragEnd}
                    onDragOver={e => this.handleDragOver(index, e)}
                    onDragLeave={this.handleDragLeave}
                    onDrop={e => this.handleDrop(index, e)}
                    onClick={() => this.handleSlotClick(index)}
                    sx={{
                        width: '100%',
                        height: 96,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        p: 0.5,
                        cursor: isDragSource ? 'grabbing' : 'grab',
                        userSelect: 'none',
                        opacity: isDragSource ? 0.4 : 1,
                        outline: isDragOver ? '2px solid' : 'none',
                        outlineColor: 'primary.main',
                        transition: 'opacity 0.15s, outline 0.1s',
                        '&:hover': { backgroundColor: 'action.hover' },
                    }}
                >
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {iconSrc ? (
                            <img
                                src={iconSrc}
                                alt={label}
                                style={{ width: 32, height: 32 }}
                            />
                        ) : (
                            <WidgetsIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                        )}
                    </Box>
                    <Typography
                        variant="caption"
                        sx={{
                            width: '100%',
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            px: 0.5,
                        }}
                    >
                        {label}
                    </Typography>
                    <Box sx={{ display: 'flex', mt: 0.25 }}>
                        <IconButton
                            size="small"
                            onClick={e => this.handleItemDelete(index, e)}
                            color="error"
                            sx={{ p: 0.25 }}
                        >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Box>
                </Paper>
            </Tooltip>
        );
    }

    private renderPage(
        pageIndex: number,
        totalPages: number,
        baseSlots: number,
        effectiveSlots: number,
        arrowMode: boolean,
        card: MenuEntry['card'],
        grid2Status: Grid2ModelStatus,
        totalRealSlots: number,
    ): React.JSX.Element {
        const { columns, uspSpecial, wide } = this.getGridConfig(card, grid2Status);
        const startIdx = pageIndex * effectiveSlots;

        return (
            <Box
                key={pageIndex}
                sx={{
                    mb: pageIndex < totalPages - 1 ? 2 : 0,
                    pb: pageIndex < totalPages - 1 ? 1 : 0,
                    borderBottom: pageIndex < totalPages - 1 ? '1px dashed' : 'none',
                    borderColor: 'divider',
                }}
            >
                {totalPages > 1 && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 0.5 }}
                    >
                        {`${this.getText('pageMenu_page')} ${pageIndex + 1} / ${totalPages}`}
                    </Typography>
                )}
                <Box sx={{ display: 'grid', gridTemplateColumns: columns, gap: 1 }}>
                    {Array.from({ length: baseSlots }, (_, localIdx) => {
                        const isArrowSlot = arrowMode && localIdx === effectiveSlots;
                        const isUspTop = uspSpecial && localIdx === 0;

                        if (isArrowSlot) {
                            return (
                                <Box key={`arrow-p${pageIndex}`}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            width: '100%',
                                            height: 96,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            opacity: 0.45,
                                            userSelect: 'none',
                                        }}
                                    >
                                        <ArrowForwardIcon sx={{ color: 'text.disabled', fontSize: 32 }} />
                                    </Paper>
                                </Box>
                            );
                        }

                        const globalIdx = startIdx + localIdx;
                        return (
                            <Box
                                key={globalIdx}
                                sx={isUspTop ? { gridColumn: '1 / -1' } : {}}
                            >
                                {this.renderSlot(globalIdx, totalRealSlots, wide)}
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { entry } = this.props;

        // Grid2-Modell-Status berechnen (relevant für Slot-Anzahl und Warnung)
        const grid2Status = this.getGrid2ModelStatus();
        const grid2Conflict = grid2Status === 'conflict';
        const grid2Slots = grid2Status === 'all-usp' ? 9 : 8;

        const baseSlots = entry.card === 'cardGrid2' ? grid2Slots : SLOT_COUNTS_BASE[entry.card];
        const isGridCard = ['cardGrid', 'cardGrid2', 'cardGrid3'].includes(entry.card);
        const scrollPresentation = entry.scrollPresentation ?? 'arrow';
        const potentialArrow = isGridCard && scrollPresentation === 'arrow';
        const pageItems = entry.pageItems ?? [];

        // Erst ohne Pfeil schätzen: Pfeil reserviert erst wenn mehrere Seiten tatsächlich nötig sind
        const basePagesNoArrow = Math.max(1, Math.ceil(pageItems.length / baseSlots));
        const totalPagesEst = basePagesNoArrow + this.state.extraPages;
        // Pfeilmodus nur aktivieren wenn Seiten wirklich vorhanden oder durch "Seite hinzufügen" erzwungen
        const arrowMode = potentialArrow && totalPagesEst > 1;
        const effectiveSlots = arrowMode ? Math.max(1, baseSlots - 1) : baseSlots;
        // Endgültige Seitenanzahl (Pfeilmodus kann durch weniger Slots pro Seite mehr Seiten erzwingen)
        const basePagesFinal = Math.max(1, Math.ceil(pageItems.length / effectiveSlots));
        const totalPages = Math.max(basePagesFinal, totalPagesEst);
        const totalRealSlots = effectiveSlots * totalPages;
        const filledCount = pageItems.filter(p => p !== undefined).length;
        const showScrollRadio = isGridCard && totalPages > 1;

        return (
            <Box>
                {/* UniqueName */}
                <Box sx={{ mb: 1, p: 1, borderRadius: 1, backgroundColor: 'action.hover' }}>
                    <TextField
                        fullWidth
                        variant="standard"
                        type="text"
                        label={this.getText('unique_label')}
                        value={entry.uniqueName}
                        onChange={e => {
                            const newUniqueName = e.target.value;
                            if (newUniqueName.trim()) {
                                this.props.onUniqueNameChange(entry.uniqueName, newUniqueName);
                            }
                        }}
                        InputProps={{
                            sx: { backgroundColor: 'transparent', px: 1, fontWeight: 600, width: '50%' },
                        }}
                        disabled={!this.state.alive}
                    />
                </Box>

                {/* Überschrift */}
                <TextField
                    fullWidth
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={this.getText('headline')}
                    value={entry.headline ?? ''}
                    onChange={e => {
                        this.props.onEntryChange({ ...entry, headline: e.target.value });
                    }}
                    InputProps={{
                        sx: { backgroundColor: 'transparent', px: 1, width: '50%' },
                    }}
                    sx={{ mb: 2 }}
                    disabled={!this.state.alive}
                />

                {/* Card-Typ Auswahl – 2-spaltig */}
                <Box sx={{ mb: 2 }}>
                    <FormControl
                        component="fieldset"
                        disabled={!this.state.alive}
                    >
                        <FormLabel component="legend">{this.getText('pageMenu_card_type')}</FormLabel>
                        <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
                            {/* Linke Spalte: Grid-Varianten */}
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mb: 0.5, display: 'block' }}
                                >
                                    {this.getText('pageMenu_group_grid')}
                                </Typography>
                                <RadioGroup
                                    value={
                                        ['cardGrid', 'cardGrid2', 'cardGrid3'].includes(entry.card) ? entry.card : ''
                                    }
                                    onChange={(_e, val) => {
                                        this.handleCardTypeChange(val as MenuEntry['card']);
                                    }}
                                >
                                    <FormControlLabel
                                        value="cardGrid"
                                        control={<Radio />}
                                        label={this.getText('pageMenu_cardGrid')}
                                    />
                                    <FormControlLabel
                                        value="cardGrid2"
                                        disabled={grid2Conflict}
                                        control={<Radio />}
                                        label={
                                            grid2Status === 'all-usp'
                                                ? this.getText('pageMenu_cardGrid2_usp')
                                                : this.getText('pageMenu_cardGrid2')
                                        }
                                    />
                                    <FormControlLabel
                                        value="cardGrid3"
                                        control={<Radio />}
                                        label={this.getText('pageMenu_cardGrid3')}
                                    />
                                </RadioGroup>
                                {grid2Conflict && (
                                    <Alert
                                        severity="warning"
                                        sx={{ mt: 1, fontSize: '0.75rem', py: 0.5 }}
                                    >
                                        {this.getText('pageMenu_cardGrid2_conflict')}
                                    </Alert>
                                )}
                            </Box>

                            {/* Rechte Spalte: Entities & Schedule */}
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mb: 0.5, display: 'block' }}
                                >
                                    {this.getText('pageMenu_group_list')}
                                </Typography>
                                <RadioGroup
                                    value={['cardEntities', 'cardSchedule'].includes(entry.card) ? entry.card : ''}
                                    onChange={(_e, val) => {
                                        this.handleCardTypeChange(val as MenuEntry['card']);
                                    }}
                                >
                                    <FormControlLabel
                                        value="cardEntities"
                                        control={<Radio />}
                                        label={this.getText('pageMenu_cardEntities')}
                                    />
                                    <FormControlLabel
                                        value="cardSchedule"
                                        control={<Radio />}
                                        label={this.getText('pageMenu_cardSchedule')}
                                    />
                                </RadioGroup>
                            </Box>
                        </Box>
                    </FormControl>
                </Box>

                {/* Scroll-Typ Auswahl (nur bei Grid und mehreren Seiten) */}
                {showScrollRadio && (
                    <Box sx={{ mb: 2 }}>
                        <FormControl
                            component="fieldset"
                            disabled={!this.state.alive}
                        >
                            <FormLabel component="legend">{this.getText('pageMenu_scroll_type')}</FormLabel>
                            <RadioGroup
                                row
                                value={scrollPresentation}
                                onChange={(_e, val) => {
                                    this.props.onEntryChange({
                                        ...entry,
                                        scrollPresentation: val as 'classic' | 'arrow',
                                    });
                                }}
                            >
                                <FormControlLabel
                                    value="classic"
                                    control={<Radio />}
                                    label={this.getText('pageMenu_scroll_classic')}
                                />
                                <FormControlLabel
                                    value="arrow"
                                    control={<Radio />}
                                    label={this.getText('pageMenu_scroll_arrow')}
                                />
                            </RadioGroup>
                        </FormControl>
                    </Box>
                )}

                {/* Items */}
                <Paper
                    variant="outlined"
                    sx={{ p: 2, mt: 1 }}
                >
                    <Typography
                        variant="subtitle2"
                        sx={{ mb: 1 }}
                    >
                        {this.getText('pageMenu_items')} ({filledCount}/{totalRealSlots})
                    </Typography>
                    {Array.from({ length: totalPages }, (_, pageIdx) =>
                        this.renderPage(
                            pageIdx,
                            totalPages,
                            baseSlots,
                            effectiveSlots,
                            arrowMode,
                            entry.card,
                            grid2Status,
                            totalRealSlots,
                        ),
                    )}
                </Paper>

                {/* Weitere Seite hinzufügen */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => this.setState(s => ({ extraPages: s.extraPages + 1 }))}
                        disabled={!this.state.alive}
                    >
                        {this.getText('pageMenu_add_page')}
                    </Button>
                </Box>

                {/* ChannelConfigDialog – ohne Trigger-Button, per ref gesteuert */}
                <ChannelConfigDialog
                    ref={this.dialogRef}
                    socket={this.props.oContext?.socket}
                    theme={this.props.theme}
                    themeType={this.props.oContext?.themeType}
                    oContext={this.props.oContext}
                    expertMode={this.props.expertMode ?? false}
                    pagesList={this.state.filteredPagesList}
                    currentPageName={this.props.entry.uniqueName}
                    hideTriggerButton
                    onSave={this.handleItemSave}
                />
            </Box>
        );
    }
}
