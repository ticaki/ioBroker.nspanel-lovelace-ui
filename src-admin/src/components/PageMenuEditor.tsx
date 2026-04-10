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
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WidgetsIcon from '@mui/icons-material/Widgets';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import {
    type MenuEntry,
    type AdminPageItemConfig,
    type AdminPanelConfig,
    ADAPTER_NAME,
    ALL_PANELS_SPECIAL_ID,
} from '../../../src/lib/types/adminShareConfig';
import ChannelConfigDialog from './ChannelConfigDialog';
import icons from '../icons.json';
import { I18n } from '@iobroker/adapter-react-v5';

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

/**
 * Default-Icons für navigation=true, abgeleitet aus getPageNaviItemConfig.
 * Nur Rollen mit explizit gesetztem Icon (kein undefined-Fallback auf Template).
 * Fallback auf ROLE_DEFAULT_ICONS für Template-basierte Rollen (blind, door, …).
 */
const NAV_ROLE_DEFAULT_ICONS: Record<string, [string, string]> = {
    socket: ['power', 'power-standby'],
    light: ['lightbulb', 'lightbulb-outline'],
    dimmer: ['lightbulb', 'lightbulb-outline'],
    hue: ['lightbulb', 'lightbulb-outline'],
    rgb: ['lightbulb', 'lightbulb-outline'],
    rgbSingle: ['lightbulb', 'lightbulb-outline'],
    ct: ['lightbulb', 'lightbulb-outline'],
    button: ['gesture-tap-button', 'gesture-tap-button'],
    media: ['play-box-multiple', 'play-box-multiple-outline'],
    info: ['information-outline', 'information-off-outline'],
    temperature: ['temperature-celsius', 'temperature-celsius'],
    thermostat: ['temperature-celsius', 'temperature-celsius'],
    'level.timer': ['timer', 'timer'],
    'level.mode.fan': ['fan', 'fan-off'],
};

export interface PageMenuEditorProps {
    entry: MenuEntry;
    onEntryChange: (updated: MenuEntry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
    themeType?: string;
    /** Alle konfigurierten Panels aus den Adapter-Native-Daten */
    panels?: AdminPanelConfig[];
    /** Expert-Mode aus dem json-config-System */
    expertMode?: boolean;
    /** Alle verfügbaren Seiten (aus sendTo) – wird an ChannelConfigDialog weitergegeben */
    pagesList?: string[];
    /** Vom übergeordneten PageConfigManager bereitgestellt – navigationNodes pro panelTopic */
    panelPagesMap?: Record<string, string[]>;
}

interface PageMenuEditorState {
    alive: boolean;
    editingSlotIndex: number | null;
    dragOverIndex: number | null;
    extraPages: number;
    /** Gefilterte Seiten basierend auf den zugewiesenen Panels */
    filteredPagesList: string[];
    /** Gecachte common.name-Werte pro Channel-ID */
    channelNames: Record<string, string>;
    /** Kontextmenü: Anker-Element und betroffener Slot-Index */
    contextMenuEl: HTMLElement | null;
    contextMenuIndex: number | null;
    /** Zwischenablage für Kopieren/Einfügen von PageItems */
    clipboard: AdminPageItemConfig | null;
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
            channelNames: {},
            contextMenuEl: null,
            contextMenuIndex: null,
            clipboard: null,
        };
    }

    /**
     * Berechnet die gefilterte Seitenliste synchron aus dem vom Parent gelieferten panelPagesMap.
     * Bildet die Schnittmenge der Seiten über alle zugewiesenen Panels.
     *
     * @param panelPagesMap
     */
    private computeFilteredPagesFromMap(panelPagesMap: Record<string, string[]>): string[] {
        const assignment = this.props.entry.navigationAssignment;
        const pagesList = this.props.pagesList ?? [];

        if (!assignment || assignment.length === 0) {
            return [...pagesList].sort((a, b) => a.localeCompare(b));
        }

        // ALL_PANELS_SPECIAL_ID bedeutet "alle Panels" → kein Filter
        if (assignment.some(a => a.topic === ALL_PANELS_SPECIAL_ID)) {
            return [...pagesList].sort((a, b) => a.localeCompare(b));
        }

        const pageSets = assignment
            .map(a => panelPagesMap[a.topic])
            .filter((pages): pages is string[] => pages !== undefined)
            .map(pages => new Set(pages));

        const nonEmpty = pageSets.filter(s => s.size > 0);
        if (nonEmpty.length === 0) {
            return pagesList;
        }

        const intersection = nonEmpty.reduce((acc, cur) => {
            const result = new Set<string>();
            for (const s of acc) {
                if (cur.has(s)) {
                    result.add(s);
                }
            }
            return result;
        });

        return [...intersection].sort((a, b) => {
            if (a === 'main') {
                return -1;
            }
            if (b === 'main') {
                return 1;
            }
            return a.localeCompare(b);
        });
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

    /**
     * Lädt common.name für alle Channel-IDs in den pageItems, die noch keinen Eintrag im Cache haben.
     */
    private async loadChannelNames(): Promise<void> {
        const socket = this.props.oContext?.socket;
        if (!socket) {
            return;
        }
        const items = this.props.entry.pageItems ?? [];
        const toLoad = [
            ...new Set(
                items
                    .filter(
                        item =>
                            item != null && !item.name && item.channelId && !this.state.channelNames[item.channelId],
                    )
                    .map(item => item!.channelId),
            ),
        ];
        if (toLoad.length === 0) {
            return;
        }
        const names: Record<string, string> = { ...this.state.channelNames };
        for (const channelId of toLoad) {
            try {
                const obj: ioBroker.Object | null | undefined = await socket.getObject(channelId);
                const rawName: unknown = (obj as any)?.common?.name;
                let name = '';
                if (typeof rawName === 'string') {
                    name = rawName;
                } else if (rawName && typeof rawName === 'object') {
                    const nameMap = rawName as Record<string, string>;
                    const lang: string = (I18n as any).getLanguage?.() ?? 'en';
                    name = nameMap[lang] || nameMap.en || Object.values(nameMap)[0] || '';
                }
                if (name) {
                    names[channelId] = name;
                }
            } catch {
                // Ignorieren – Fallback auf Index
            }
        }
        this.setState({ channelNames: names });
    }

    private handleContextMenu = (index: number, e: React.MouseEvent<HTMLElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({ contextMenuEl: e.currentTarget, contextMenuIndex: index });
    };

    private handleContextMenuClose = (): void => {
        this.setState({ contextMenuEl: null, contextMenuIndex: null });
    };

    private handleCopyItem = (): void => {
        const { contextMenuIndex } = this.state;
        if (contextMenuIndex === null) {
            return;
        }
        const item = (this.props.entry.pageItems ?? [])[contextMenuIndex];
        this.setState({ clipboard: item ?? null, contextMenuEl: null, contextMenuIndex: null });
    };

    private handlePasteItem = (): void => {
        const { contextMenuIndex, clipboard } = this.state;
        if (contextMenuIndex === null || clipboard === null) {
            return;
        }
        const pageItems = [...(this.props.entry.pageItems ?? [])];
        while (pageItems.length <= contextMenuIndex) {
            pageItems.push(undefined);
        }
        pageItems[contextMenuIndex] = { ...clipboard };
        this.props.onEntryChange({ ...this.props.entry, pageItems });
        this.setState({ contextMenuEl: null, contextMenuIndex: null });
    };

    componentWillUnmount(): void {
        const instance = this.props.oContext.instance ?? '0';
        this.props.oContext.socket.unsubscribeState(
            `system.adapter.${ADAPTER_NAME}.${instance}.alive`,
            this.onAliveChanged,
        );
        // Panel-Objekt-Subscriptions nur aufräumen, wenn wir sie selbst verwaltet haben
        if (!this.props.panelPagesMap) {
            const socket = this.props.oContext?.socket;
            if (socket) {
                for (const id of this.subscribedPanelObjectIds) {
                    void socket.unsubscribeObject(id, this.onPanelObjectChanged);
                }
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

        if (this.props.panelPagesMap) {
            // Parent verwaltet Subscriptions: gefilterte Seiten synchron neu berechnen
            if (
                this.props.panelPagesMap !== prevProps.panelPagesMap ||
                prevProps.entry.navigationAssignment !== this.props.entry.navigationAssignment ||
                prevProps.pagesList !== this.props.pagesList
            ) {
                this.setState({
                    filteredPagesList: this.computeFilteredPagesFromMap(this.props.panelPagesMap),
                });
            }
        } else {
            // Fallback: eigene Subscription-Logik
            if (
                prevProps.entry.navigationAssignment !== this.props.entry.navigationAssignment ||
                prevProps.pagesList !== this.props.pagesList
            ) {
                void this.updatePanelObjectSubscriptions();
                void this.loadFilteredPages();
            }
        }
        if (prevProps.entry.pageItems !== this.props.entry.pageItems) {
            void this.loadChannelNames();
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

        if (this.props.panelPagesMap) {
            // Parent stellt panelPagesMap bereit – keine eigenen Subscriptions nötig
            this.setState({ filteredPagesList: this.computeFilteredPagesFromMap(this.props.panelPagesMap) });
        } else {
            void this.loadFilteredPages();
            void this.updatePanelObjectSubscriptions();
        }
        void this.loadChannelNames();
    }

    /**
     * Lädt die Seiten der zugewiesenen Panels via native.navigationNodes aus den ioBroker-Objekten.
     * Ohne Zuweisung wird pagesList direkt übernommen.
     */
    private async loadFilteredPages(): Promise<void> {
        const assignment = this.props.entry.navigationAssignment;
        const pagesList = this.props.pagesList ?? [];

        if (!assignment || assignment.length === 0) {
            this.setState({ filteredPagesList: [...pagesList].sort((a, b) => a.localeCompare(b)) });
            return;
        }

        // ALL_PANELS_SPECIAL_ID bedeutet "alle Panels" → kein Filter
        if (assignment.some(a => a.topic === ALL_PANELS_SPECIAL_ID)) {
            this.setState({ filteredPagesList: [...pagesList].sort((a, b) => a.localeCompare(b)) });
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
    private getItemIconSrc(item: AdminPageItemConfig | null | undefined, forTrue = true): string {
        if (item == null) {
            return '';
        }
        const explicit = forTrue ? item.trueIcon : item.falseIcon;
        if (explicit) {
            return PageMenuEditor.getIconSrc(explicit);
        }
        // Fallback: Role-Default – bei Navigation zuerst NAV_ROLE_DEFAULT_ICONS
        const role = item.role ?? '';
        const isNav = item.isNavigation === true;
        const defaults = (isNav ? NAV_ROLE_DEFAULT_ICONS[role] : undefined) ?? ROLE_DEFAULT_ICONS[role];
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

    private handleSlotClick = (index: number, isGridCard: boolean): void => {
        const item = (this.props.entry.pageItems ?? [])[index];
        this.setState({ editingSlotIndex: index });
        this.dialogRef.current?.openWith(item, isGridCard);
    };

    private handleItemSave = (config: AdminPageItemConfig): void => {
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

    private renderSlot(index: number, totalSlots: number, wide: boolean, isGridCard: boolean): React.JSX.Element {
        const pageItems = this.props.entry.pageItems ?? [];
        const item = pageItems[index] ?? undefined;
        const isDragSource = this.dragSourceIndex === index;
        const isDragOver = this.state.dragOverIndex === index;
        const isLastSlot = index === totalSlots - 1;
        const alive = this.state.alive;

        if (item == null) {
            const hasClipboard = this.state.clipboard !== null;
            // Leerer Slot – klickbar, empfängt Drops
            return (
                <Tooltip
                    key={index}
                    title={alive ? this.getText('pageMenu_add_item') : ''}
                >
                    <Paper
                        elevation={0}
                        onClick={alive ? () => this.handleSlotClick(index, isGridCard) : undefined}
                        onDragOver={alive ? e => this.handleDragOver(index, e) : undefined}
                        onDragLeave={alive ? this.handleDragLeave : undefined}
                        onDrop={alive ? e => this.handleDrop(index, e) : undefined}
                        onContextMenu={alive && hasClipboard ? e => this.handleContextMenu(index, e) : undefined}
                        sx={{
                            width: '100%',
                            height: wide ? 44 : 96,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: isDragOver ? '2px dashed' : '1px dashed',
                            borderColor: isDragOver ? 'primary.main' : 'divider',
                            backgroundColor: isDragOver ? 'action.hover' : 'transparent',
                            cursor: alive ? 'pointer' : 'not-allowed',
                            opacity: alive ? (isLastSlot ? 0.5 : 0.35) : 0.2,
                            transition: 'border-color 0.15s, background-color 0.15s',
                            '&:hover': alive ? { opacity: 0.8, borderColor: 'primary.light' } : {},
                        }}
                    >
                        <AddIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                    </Paper>
                </Tooltip>
            );
        }

        const iconSrc = this.getItemIconSrc(item, true);
        const channelName = item.channelId ? (this.state.channelNames[item.channelId] ?? '') : '';
        const isNativeItem = item.useNative === true;
        const isNavigationItem = item.isNavigation === true;
        const role = item.role ?? '';
        const fallbackLabel = isNativeItem
            ? `${index + 1}: [native]`
            : role
              ? `${index + 1}: (${role})`
              : String(index + 1);
        const label = item.name || channelName || fallbackLabel;
        const isNameFromChannel = !item.name && !!channelName;

        if (wide) {
            // Listenansicht (cardEntities / cardSchedule)
            return (
                <Tooltip
                    key={index}
                    title={item.channelId || label}
                >
                    <Paper
                        elevation={isDragSource ? 0 : 2}
                        draggable={alive}
                        onDragStart={alive ? e => this.handleDragStart(index, e) : undefined}
                        onDragEnd={alive ? this.handleDragEnd : undefined}
                        onDragOver={alive ? e => this.handleDragOver(index, e) : undefined}
                        onDragLeave={alive ? this.handleDragLeave : undefined}
                        onDrop={alive ? e => this.handleDrop(index, e) : undefined}
                        onClick={alive ? () => this.handleSlotClick(index, isGridCard) : undefined}
                        onContextMenu={alive ? e => this.handleContextMenu(index, e) : undefined}
                        sx={{
                            width: '100%',
                            height: 44,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            px: 1,
                            gap: 1,
                            cursor: alive ? (isDragSource ? 'grabbing' : 'grab') : 'not-allowed',
                            userSelect: 'none',
                            opacity: isDragSource ? 0.4 : alive ? 1 : 0.45,
                            outline: isDragOver ? '2px solid' : 'none',
                            outlineColor: 'primary.main',
                            transition: 'opacity 0.15s, outline 0.1s',
                            '&:hover': alive ? { backgroundColor: 'action.hover' } : {},
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
                                    style={{
                                        width: 24,
                                        height: 24,
                                        filter: this.props.themeType === 'dark' ? 'invert(1) brightness(2)' : undefined,
                                    }}
                                />
                            ) : (
                                <WidgetsIcon sx={{ fontSize: 24, color: 'text.secondary' }} />
                            )}
                        </Box>
                        <Typography
                            variant="body2"
                            sx={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontStyle: isNameFromChannel ? 'italic' : 'normal',
                                color: isNameFromChannel ? 'text.secondary' : 'text.primary',
                            }}
                        >
                            {label}
                        </Typography>
                        {isNavigationItem && (
                            <SubdirectoryArrowRightIcon
                                sx={{ fontSize: 14, color: 'primary.main', opacity: 0.85, flexShrink: 0 }}
                            />
                        )}
                        <IconButton
                            size="small"
                            onClick={alive ? e => this.handleItemDelete(index, e) : undefined}
                            disabled={!alive}
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
                    draggable={alive}
                    onDragStart={alive ? e => this.handleDragStart(index, e) : undefined}
                    onDragEnd={alive ? this.handleDragEnd : undefined}
                    onDragOver={alive ? e => this.handleDragOver(index, e) : undefined}
                    onDragLeave={alive ? this.handleDragLeave : undefined}
                    onDrop={alive ? e => this.handleDrop(index, e) : undefined}
                    onClick={alive ? () => this.handleSlotClick(index, isGridCard) : undefined}
                    onContextMenu={alive ? e => this.handleContextMenu(index, e) : undefined}
                    sx={{
                        width: '100%',
                        height: 96,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        p: 0.5,
                        position: 'relative',
                        cursor: alive ? (isDragSource ? 'grabbing' : 'grab') : 'not-allowed',
                        userSelect: 'none',
                        opacity: isDragSource ? 0.4 : alive ? 1 : 0.45,
                        outline: isDragOver ? '2px solid' : 'none',
                        outlineColor: 'primary.main',
                        transition: 'opacity 0.15s, outline 0.1s',
                        '&:hover': alive ? { backgroundColor: 'action.hover' } : {},
                    }}
                >
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {iconSrc ? (
                            <img
                                src={iconSrc}
                                alt={label}
                                style={{
                                    width: 32,
                                    height: 32,
                                    filter: this.props.themeType === 'dark' ? 'invert(1) brightness(2)' : undefined,
                                }}
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
                            fontStyle: isNameFromChannel ? 'italic' : 'normal',
                            color: isNameFromChannel ? 'text.secondary' : 'text.primary',
                        }}
                    >
                        {label}
                    </Typography>
                    {isNavigationItem && (
                        <SubdirectoryArrowRightIcon
                            sx={{
                                position: 'absolute',
                                bottom: 2,
                                right: 2,
                                fontSize: 13,
                                color: 'primary.main',
                                opacity: 0.85,
                                pointerEvents: 'none',
                            }}
                        />
                    )}
                    <Box sx={{ display: 'flex', mt: 0.25 }}>
                        <IconButton
                            size="small"
                            onClick={alive ? e => this.handleItemDelete(index, e) : undefined}
                            disabled={!alive}
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
        isGridCard: boolean,
        onRemovePage?: () => void,
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
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ flex: 1 }}
                        >
                            {`${this.getText('pageMenu_page')} ${pageIndex + 1} / ${totalPages}`}
                        </Typography>
                        {onRemovePage && (
                            <Tooltip title={this.getText('pageMenu_remove_page')}>
                                <IconButton
                                    size="small"
                                    onClick={onRemovePage}
                                    disabled={!this.state.alive}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
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
                                {this.renderSlot(globalIdx, totalRealSlots, wide, isGridCard)}
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

        // Letzter tatsächlich befüllter Index – trailing undefineds durch Drag/Drop ignorieren
        const lastFilledIdx = pageItems.reduceRight<number>((acc, v, i) => (acc === -1 && v != null ? i : acc), -1);
        const filledLength = lastFilledIdx + 1;

        // Erst ohne Pfeil schätzen: Pfeil reserviert erst wenn mehrere Seiten tatsächlich nötig sind
        const basePagesNoArrow = Math.max(1, Math.ceil(filledLength / baseSlots));

        const totalPagesEst = Math.max(basePagesNoArrow, 1 + this.state.extraPages);
        // Pfeilmodus nur aktivieren wenn Seiten wirklich vorhanden oder durch "Seite hinzufügen" erzwungen
        const arrowMode = potentialArrow && totalPagesEst > 1;
        const effectiveSlots = arrowMode ? Math.max(1, baseSlots - 1) : baseSlots;
        // Endgültige Seitenanzahl (Pfeilmodus kann durch weniger Slots pro Seite mehr Seiten erzwingen)
        const basePagesFinal = Math.max(1, Math.ceil(filledLength / effectiveSlots));
        const totalPages = Math.max(basePagesFinal, totalPagesEst);
        const totalRealSlots = effectiveSlots * totalPages;
        const filledCount = pageItems.filter(p => p != null).length;
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
                        slotProps={{
                            input: { sx: { backgroundColor: 'transparent', px: 1, fontWeight: 600, width: '50%' } },
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
                    slotProps={{ input: { sx: { backgroundColor: 'transparent', px: 1, width: '50%' } } }}
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
                    {Array.from({ length: totalPages }, (_, pageIdx) => {
                        const startIdx = pageIdx * effectiveSlots;
                        const pageHasItems = (entry.pageItems ?? [])
                            .slice(startIdx, startIdx + effectiveSlots)
                            .some(p => p != null);
                        const canRemove = totalPages > 1 && !pageHasItems && pageIdx === totalPages - 1;
                        const onRemovePage = canRemove
                            ? (): void => {
                                  // extraPages dekrementieren wenn der Nutzerwunsch die Seite erzeugt hat;
                                  // sonst trailing pageItems trimmen.
                                  if (1 + this.state.extraPages > basePagesNoArrow) {
                                      this.setState(s => ({ extraPages: Math.max(0, s.extraPages - 1) }));
                                  } else {
                                      const trimmed = [...(entry.pageItems ?? [])];
                                      while (trimmed.length > 0 && trimmed[trimmed.length - 1] == undefined) {
                                          trimmed.pop();
                                      }
                                      // Auf Seitengrenze kürzen
                                      const keepSlots = Math.max(
                                          effectiveSlots,
                                          Math.ceil(trimmed.length / effectiveSlots) * effectiveSlots,
                                      );
                                      this.props.onEntryChange({ ...entry, pageItems: trimmed.slice(0, keepSlots) });
                                  }
                              }
                            : undefined;
                        return this.renderPage(
                            pageIdx,
                            totalPages,
                            baseSlots,
                            effectiveSlots,
                            arrowMode,
                            entry.card,
                            grid2Status,
                            totalRealSlots,
                            isGridCard,
                            onRemovePage,
                        );
                    })}
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

                {/* Kontextmenü für Kopieren / Einfügen */}
                <Menu
                    open={this.state.contextMenuEl !== null}
                    anchorEl={this.state.contextMenuEl}
                    onClose={this.handleContextMenuClose}
                >
                    {this.state.contextMenuIndex !== null &&
                        (this.props.entry.pageItems ?? [])[this.state.contextMenuIndex] != null && (
                            <MenuItem onClick={this.handleCopyItem}>
                                <ListItemIcon>
                                    <ContentCopyIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>{I18n.t('pageMenu_copy_item')}</ListItemText>
                            </MenuItem>
                        )}
                    <MenuItem
                        onClick={this.handlePasteItem}
                        disabled={this.state.clipboard === null}
                    >
                        <ListItemIcon>
                            <ContentPasteIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>{I18n.t('pageMenu_paste_item')}</ListItemText>
                    </MenuItem>
                </Menu>

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
                    currentPageCard={this.props.entry.card}
                    hideTriggerButton
                    onSave={this.handleItemSave}
                />
            </Box>
        );
    }
}
