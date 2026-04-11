import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Alert,
    TextField,
    Checkbox,
    FormControlLabel,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    type SelectChangeEvent,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import { Color, type RGB } from '../../../src/lib/const/Color';
import {
    getPageItemDefaultsByRole,
    getPageNaviItemDefaultsByRole,
    type PageItemRoleDefaults,
} from '../../../src/lib/const/page-item-defaults';
import icons from '../icons.json';
import CancelIcon from '@mui/icons-material/Cancel';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PaletteIcon from '@mui/icons-material/Palette';
import { I18n } from '@iobroker/adapter-react-v5';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import Editor from '@iobroker/json-config/build/JsonConfigComponent/wrapper/Components/Editor';
import { EntitySelector } from './EntitySelector';
import IconSelect from '../IconSelect';
import SettingsIcon from '@mui/icons-material/Settings';
import type ValueEntryDialog from './ValueEntryDialog';
import {
    ADAPTER_NAME,
    CHANNEL_ROLES_LIST,
    requiredScriptDataPoints,
    emptyValueEntryConfig,
    normalizeChannelId,
    type AdminPageItemConfig,
    type MenuEntry,
    type ValueEntryConfig,
} from '../../../src/lib/types/adminShareConfig';
import ChannelConfigColor from './ChannelConfigColor';

export type { AdminPageItemConfig as PageItemConfig };

type ChannelConfigDialogProps = {
    socket: any;
    theme?: any;
    themeType?: string;
    adapterName?: string;
    instance?: number;
    /** oContext für IconSelect (optional – wird aus den anderen Props aufgebaut falls nicht übergeben) */
    oContext?: any;
    /** Panel-IDs zum Laden der verfügbaren Navigationsseiten (legacy, wird ignoriert wenn pagesList gesetzt) */
    panelIds?: string[];
    /** Direkte Liste der verfügbaren Seiten – hat Vorrang vor panelIds */
    pagesList?: string[];
    /** Name der aktuellen Seite – wird aus der Zielseiten-Auswahl gefiltert */
    currentPageName?: string;
    /** Card-Typ der aktuellen Seite – wird für CheckPageItemConfig benötigt */
    currentPageCard?: MenuEntry['card'];
    onSave?: (config: AdminPageItemConfig) => void;
    /** Vorausgefüllte Channel-ID für Testzwecke */
    initialChannelId?: string;
    /** Trigger-Button ausblenden; Dialog wird per openWith()-Methode geöffnet */
    hideTriggerButton?: boolean;
    /** Expert-Mode – zeigt Native-Toggle-Button an */
    expertMode?: boolean;
};

interface ChannelConfigDialogState {
    open: boolean;
    isGridCard: boolean;
    channelId: ValueEntryConfig;
    name: string;
    isNavigation: boolean;
    targetPage: string;
    availablePages: string[];
    loadingPages: boolean;
    trueIcon: string;
    trueColor: string;
    falseIcon: string;
    falseColor: string;
    /** null = nicht geprüft, true = existiert, false = existiert nicht */
    channelExists: boolean | null;
    checkingChannel: boolean;
    /** common.role des gewählten ioBroker-Objekts */
    channelRole: string | null;
    /** true wenn channelRole eine bekannte ScriptConfig.channelRole ist */
    roleIsValid: boolean | null;
    /** Vorgeladene Channel-IDs mit passender Rolle – Basis für filterFunc */
    validChannelIds: string[];
    /** Expert-Mode: native JSON-Editor aktiv */
    nativeMode: boolean;
    /** Rohes JSON im nativen Editor */
    nativeJson: string;
    /** true wenn nativeJson syntaktisch valide ist */
    nativeJsonValid: boolean;
    /** Fehlermeldung aus JSON.parse (inklusive Zeileninfo falls vorhanden) */
    nativeJsonErrorMessage: string;
    /** true während CheckPageItemConfig-Anfrage läuft */
    isSaving: boolean;
    /** Ergebnis-Dialog sichtbar */
    checkResultOpen: boolean;
    /** Meldungen aus CheckPageItemConfig */
    checkResultMessages: string[];
    /** true = Fehler-Warnung, false = Log + Done */
    checkResultIsError: boolean;
    /** Zu speichernde Konfiguration – wird nach "Done" ausgeführt */
    checkResultPendingConfig: AdminPageItemConfig | null;
    /** Fehlende Pflicht-Datenpunkte (nach Datapoint-Prüfung) */
    datapointErrors: string[];
    /** Doppelt gemappte Datenpunkte (mehrere States passen auf dieselbe Rolle) */
    datapointDuplicates: string[];
    /** true während Datapoint-Prüfung läuft */
    checkingDatapoints: boolean;
    /** Vorgeschlagener Name aus common.name des Channels – wird nicht gespeichert */
    channelNameSuggestion: string;
    /** Options-Dialog sichtbar */
    optionsDialogOpen: boolean;
    /** Value-display configuration (undefined = not configured) */
    valueEntry: ValueEntryConfig | undefined;
    /** Last preview text computed inside ValueEntryDialog – purely for display in the name field */
    valueEntryPreview: string;
    /** useValue Checkbox Auswahl */
    useValue: boolean;
    /** Farbthema-ID aus der Adapter-Konfiguration (0=default,1=topical,2=technical,3=sunset,4=volcano,5=custom) */
    adapterColorTheme: number;
}

/** Minimales leeres ioBroker.InstanceCommon für ConfigGeneric-Komponenten */
const EMPTY_COMMON: ioBroker.InstanceCommon = {} as ioBroker.InstanceCommon;

/** Verzögerung in ms bevor Datapoint-Prüfung beim Eintippen startet */
const DATAPOINT_CHECK_DEBOUNCE_MS = 800;

/**
 * Dialog zum Konfigurieren eines ioBroker-Channels mit
 * optionalem Navigations-Zielseiten-Selector.
 * Optik analog zu den Panel-Boxen in PagePanelOverview.
 */
class ChannelConfigDialog extends React.Component<ChannelConfigDialogProps, ChannelConfigDialogState> {
    private datapointCheckTimer: ReturnType<typeof setTimeout> | null = null;
    private valueEntryDialogRef = React.createRef<ValueEntryDialog>();
    private valueEntryDialogMain = React.createRef<ValueEntryDialog>();
    private static iconMap: Map<string, string> | null = null;

    private static getIconBase64(name: string): string {
        if (!ChannelConfigDialog.iconMap) {
            ChannelConfigDialog.iconMap = new Map();
            for (const icon of icons as { name: string; base64: string }[]) {
                ChannelConfigDialog.iconMap.set(icon.name, icon.base64);
            }
        }
        return ChannelConfigDialog.iconMap.get(name) ?? '';
    }

    constructor(props: ChannelConfigDialogProps) {
        super(props);
        this.state = {
            open: false,
            channelId: emptyValueEntryConfig(props.initialChannelId ?? ''),
            name: '',
            isNavigation: false,
            targetPage: '',
            availablePages: [],
            isGridCard: false,
            loadingPages: false,
            trueIcon: '',
            trueColor: '',
            falseIcon: '',
            falseColor: '',
            channelExists: null,
            checkingChannel: false,
            channelRole: null,
            roleIsValid: null,
            validChannelIds: [],
            nativeMode: false,
            nativeJson: '',
            nativeJsonValid: false,
            nativeJsonErrorMessage: '',
            isSaving: false,
            checkResultOpen: false,
            checkResultMessages: [],
            checkResultIsError: false,
            checkResultPendingConfig: null,
            datapointErrors: [],
            datapointDuplicates: [],
            checkingDatapoints: false,
            channelNameSuggestion: '',
            optionsDialogOpen: false,
            valueEntry: undefined,
            valueEntryPreview: '',
            useValue: false,
            adapterColorTheme: 0,
        };
    }

    override componentWillUnmount(): void {
        if (this.datapointCheckTimer !== null) {
            clearTimeout(this.datapointCheckTimer);
        }
    }

    private handleOpen = (): void => {
        this.setState({
            open: true,
            datapointErrors: [],
            datapointDuplicates: [],
            checkResultMessages: [],
            checkResultOpen: false,
            checkResultIsError: false,
            checkResultPendingConfig: null,
            isSaving: false,
        });
        if (this.props.pagesList && this.props.pagesList.length > 0) {
            this.setState({ availablePages: this.sortPages(this.props.pagesList) });
        } else if (!this.state.loadingPages && this.state.availablePages.length === 0) {
            void this.loadAvailablePages();
        }
        if (this.state.validChannelIds.length === 0) {
            void this.loadValidChannels();
        }
        void this.loadAdapterColorTheme();
    };

    /**
     * Öffnet den Dialog mit optionalen Vorbelegungsdaten.
     * Wird von übergeordneten Komponenten per ref aufgerufen.
     *
     * @param data
     * @param isGridCard  (optional) true wenn die Daten von einem GridCard-Item stammen – steuert die Sichtbarkeit bestimmter Felder
     */
    public openWith(data?: Partial<AdminPageItemConfig>, isGridCard?: boolean): void {
        const isNative = data?.useNative === true;
        this.setState({
            open: true,
            channelId: normalizeChannelId(data?.channelId),
            name: data?.name ?? '',
            isNavigation: data?.isNavigation ?? false,
            targetPage: data?.targetPage ?? '',
            trueIcon: data?.trueIcon ?? '',
            trueColor: data?.trueColor ?? '',
            falseIcon: data?.falseIcon ?? '',
            falseColor: data?.falseColor ?? '',
            channelExists: isNative ? true : null,
            checkingChannel: false,
            channelRole: data?.role ?? null,
            roleIsValid: null,
            nativeMode: isNative,
            nativeJson: isNative ? JSON.stringify(data?.native ?? {}, null, 2) : '',
            nativeJsonValid: isNative,
            nativeJsonErrorMessage: '',
            useValue: data?.useValue ?? false,
            valueEntry: data?.valueEntry,
            valueEntryPreview: '',
            datapointErrors: [],
            datapointDuplicates: [],
            checkResultMessages: [],
            checkResultOpen: false,
            checkResultIsError: false,
            checkResultPendingConfig: null,
            isSaving: false,
            isGridCard: isGridCard ?? false,
        });
        if (this.props.pagesList && this.props.pagesList.length > 0) {
            this.setState({ availablePages: this.sortPages(this.props.pagesList) });
        } else if (!this.state.loadingPages && this.state.availablePages.length === 0) {
            void this.loadAvailablePages();
        }
        if (this.state.validChannelIds.length === 0) {
            void this.loadValidChannels();
        }
        const channelIdToCheck = normalizeChannelId(data?.channelId).valueStateId;
        if (!isNative && channelIdToCheck) {
            void this.checkChannelExists(channelIdToCheck);
        }
        if (data?.valueEntry?.valueStateId) {
            this.valueEntryDialogRef.current?.triggerPreviewFor(data.valueEntry);
        }
        void this.loadAdapterColorTheme();
    }

    private handleClose = (): void => {
        this.setState({ open: false });
    };

    private handleOptionsOpen = (): void => {
        this.setState({ optionsDialogOpen: true });
        void this.loadAdapterColorTheme();
    };

    private async loadAdapterColorTheme(): Promise<void> {
        const { socket, adapterName = ADAPTER_NAME, instance = 0 } = this.props;
        if (!socket) {
            return;
        }
        try {
            const obj: ioBroker.Object | null | undefined = await socket.getObject(
                `system.adapter.${adapterName}.${instance}`,
            );
            const t = (obj as any)?.native?.colorTheme;
            this.setState({ adapterColorTheme: typeof t === 'number' ? t : 0 });
        } catch {
            /* keep default 0 */
        }
    }

    private getThemeColors(): { on: RGB; off: RGB } {
        const theme = Color.getThemeByIndex(this.state.adapterColorTheme);
        return { on: theme.on, off: theme.off };
    }

    /**
     * Returns on/off colors for the currently selected role.
     * Falls back to the generic theme colors when no role-specific entry is found.
     */
    private getRoleDefaultColors(): { on: RGB; off: RGB } {
        const defaults = this.getDefaultsForRole(this.state.channelRole, this.state.isNavigation);
        const themeColors = this.getThemeColors();
        if (!defaults) {
            return themeColors;
        }
        const on = this.getThemeColorForKey(defaults.colorOn) ?? themeColors.on;
        const off = this.getThemeColorForKey(defaults.colorOff) ?? themeColors.off;
        return { on, off };
    }

    /**
     * Resolves a color key (e.g. 'on', 'activated', 'Green') to an RGB value
     * using the currently selected color theme.
     *
     * @param colorKey
     */
    private getThemeColorForKey(colorKey: string): RGB | null {
        const theme = Color.getThemeByIndex(this.state.adapterColorTheme);
        // Theme keys (lowercase, e.g. 'on', 'activated', 'open')
        if (colorKey in theme) {
            const val = (theme as unknown as Record<string, unknown>)[colorKey];
            if (typeof val === 'object' && val !== null && 'r' in val) {
                return val as RGB;
            }
        }
        // Named Color statics (PascalCase, e.g. 'Green', 'Red')
        if (colorKey in Color) {
            const val = (Color as unknown as Record<string, unknown>)[colorKey];
            if (typeof val === 'object' && val !== null && 'r' in val) {
                return val as RGB;
            }
        }
        return null;
    }

    /**
     * Returns the default icon / color entry for a given role and navigation flag.
     * Returns null if no entry is found.
     *
     * @param role
     * @param isNavigation
     */
    private getDefaultsForRole(role: string | null, isNavigation: boolean): PageItemRoleDefaults | null {
        if (!role) {
            return null;
        }
        return isNavigation ? getPageNaviItemDefaultsByRole(role) : getPageItemDefaultsByRole(role);
    }

    private handleOptionsClose = (): void => {
        this.setState({ optionsDialogOpen: false });
    };

    private handleColorChange = (trueColor: string, falseColor: string): void => {
        this.setState({ trueColor, falseColor });
    };

    /** Baut die zu speichernde PageItemConfig aus dem aktuellen State zusammen. */
    private buildSaveConfig(): AdminPageItemConfig | null {
        const {
            channelId,
            name,
            isNavigation,
            targetPage,
            trueIcon,
            trueColor,
            falseIcon,
            falseColor,
            channelRole,
            useValue,
        } = this.state;
        if (this.state.nativeMode) {
            try {
                const parsed: unknown = JSON.parse(this.state.nativeJson);
                return {
                    channelId,
                    name,
                    isNavigation,
                    targetPage,
                    trueIcon,
                    trueColor,
                    falseIcon,
                    falseColor,
                    useValue,
                    role: channelRole ?? undefined,
                    useNative: true,
                    native: parsed,
                };
            } catch {
                return null;
            }
        }
        return {
            channelId,
            role: channelRole ?? undefined,
            name,
            isNavigation,
            targetPage,
            trueIcon,
            trueColor,
            falseIcon,
            falseColor,
            useValue,
            valueEntry: this.state.valueEntry,
        };
    }

    /**
     * Führt onSave aus und schließt den Haupt-Dialog.
     *
     * @param config
     */
    private commitSave(config: AdminPageItemConfig): void {
        if (this.props.onSave) {
            this.props.onSave(config);
        }
        this.handleClose();
    }

    private handleSave = (): void => {
        void this.handleSaveAsync();
    };

    private handleSaveAsync = async (): Promise<void> => {
        const configToSave = this.buildSaveConfig();
        if (!configToSave) {
            return;
        }

        const socket = this.props.oContext?.socket ?? this.props.socket;
        const instance = this.props.oContext?.instance ?? '0';
        const card = this.props.currentPageCard;
        const uniqueName = this.props.currentPageName;

        if (socket && card && uniqueName) {
            this.setState({ isSaving: true });
            try {
                const result: { messages: string[]; error: string | undefined } = await socket.sendTo(
                    `${ADAPTER_NAME}.${instance}`,
                    'CheckPageItemConfig',
                    { item: configToSave, page: { card, uniqueName } },
                );
                this.setState({ isSaving: false });
                const messages = Array.isArray(result?.messages)
                    ? result.messages
                    : result?.messages != null
                      ? [String(result.messages)]
                      : [];
                if (result?.error !== undefined) {
                    messages.unshift(result.error);
                    // Fehler: Dialog bleibt offen, Warnung anzeigen
                    this.setState({
                        checkResultOpen: true,
                        checkResultMessages: messages,
                        checkResultIsError: true,
                        checkResultPendingConfig: null,
                    });
                } else {
                    // Erfolg: bei leeren Meldungen direkt speichern, sonst Log anzeigen
                    if (messages.length === 0) {
                        this.commitSave(configToSave);
                    } else {
                        this.setState({
                            checkResultOpen: true,
                            checkResultMessages: messages,
                            checkResultIsError: false,
                            checkResultPendingConfig: configToSave,
                        });
                    }
                }
                return;
            } catch (e) {
                console.warn('[ChannelConfigDialog] CheckPageItemConfig failed', e);
                this.setState({ isSaving: false });
                // Fallthrough: direkt speichern wenn Check nicht erreichbar
            }
        }

        // Kein Check möglich (Adapter offline / Props fehlen) → direkt speichern
        this.commitSave(configToSave);
    };

    private handleCheckResultClose = (): void => {
        this.setState({ checkResultOpen: false, checkResultPendingConfig: null });
    };

    private handleCheckResultDone = (): void => {
        const { checkResultPendingConfig } = this.state;
        this.setState({ checkResultOpen: false, checkResultPendingConfig: null });
        if (checkResultPendingConfig) {
            this.commitSave(checkResultPendingConfig);
        }
    };

    private handleNativeModeToggle = (): void => {
        if (!this.state.nativeMode) {
            // Beim Wechsel zu Native: vorhandenes native-JSON beibehalten oder leer starten
            this.setState({
                nativeMode: true,
                nativeJson: '{}',
                nativeJsonValid: true,
            });
        } else {
            this.setState({ nativeMode: false });
        }
    };

    private handleNativeJsonChange = (json: string): void => {
        let valid = false;
        let errorMessage = '';
        try {
            JSON.parse(json);
            valid = true;
        } catch (e) {
            valid = false;
            errorMessage = e instanceof Error ? e.message : String(e);
        }
        this.setState({ nativeJson: json, nativeJsonValid: valid, nativeJsonErrorMessage: errorMessage });
    };

    private async loadValidChannels(): Promise<void> {
        const { socket } = this.props;
        if (!socket) {
            return;
        }
        try {
            const objects: Record<string, ioBroker.Object> | null | undefined =
                await socket.getObjectViewSystem('channel');
            const validIds: string[] = [];
            for (const [id, obj] of Object.entries(objects ?? {})) {
                const role = (obj as any)?.common?.role;
                if (typeof role === 'string' && (CHANNEL_ROLES_LIST as readonly string[]).includes(role)) {
                    validIds.push(id);
                }
            }
            this.setState({ validChannelIds: validIds });
        } catch (e) {
            console.warn('[ChannelConfigDialog] loadValidChannels failed', e);
        }
    }

    /**
     * filterFunc für SelectID: zeigt Channels/Devices mit passender Rolle
     * sowie alle ihre Kinder.
     */
    private buildChannelFilterFunc(): (obj: ioBroker.Object) => boolean {
        const { validChannelIds } = this.state;
        return (obj: ioBroker.Object): boolean => {
            const id = (obj as any)._id as string | undefined;
            if (!id) {
                return false;
            }
            return validChannelIds.some(chId => id === chId || id.startsWith(`${chId}.`));
        };
    }

    /**
     * Reduziert eine ausgewählte ID auf den längsten passenden Channel-Prefix.
     *
     * @param id
     */
    private transformChannelId = (id: string): string => {
        const { validChannelIds } = this.state;
        let best = '';
        for (const chId of validChannelIds) {
            if ((id === chId || id.startsWith(`${chId}.`)) && chId.length > best.length) {
                best = chId;
            }
        }
        return best || id;
    };

    private handleChannelIdChange = (id: string): void => {
        this.setState({
            channelId: { ...this.state.channelId, valueStateId: id },
            channelExists: null,
            channelRole: null,
            roleIsValid: null,
            datapointErrors: [],
            datapointDuplicates: [],
            channelNameSuggestion: '',
        });
        if (this.datapointCheckTimer !== null) {
            clearTimeout(this.datapointCheckTimer);
        }
        const trimmed = id.trim();
        if (trimmed) {
            this.datapointCheckTimer = setTimeout(() => {
                void this.checkChannelExists(trimmed);
            }, DATAPOINT_CHECK_DEBOUNCE_MS);
        }
    };

    private handleChannelIdCommit = (id: string): void => {
        if (this.datapointCheckTimer !== null) {
            clearTimeout(this.datapointCheckTimer);
            this.datapointCheckTimer = null;
        }
        const trimmed = id.trim();
        if (trimmed) {
            void this.checkChannelExists(trimmed);
        } else {
            this.setState({
                channelExists: null,
                channelRole: null,
                roleIsValid: null,
                datapointErrors: [],
                datapointDuplicates: [],
            });
        }
    };

    private async checkChannelExists(objectId: string): Promise<void> {
        const { socket } = this.props;
        this.setState({ checkingChannel: true });
        if (!socket) {
            this.setState({ channelExists: false, checkingChannel: false });
            return;
        }
        try {
            const obj: ioBroker.Object | null | undefined = await socket.getObject(objectId);
            const role = (obj as any)?.common?.role ?? null;
            const channelRole = typeof role === 'string' ? role : null;
            const roleIsValid = channelRole !== null && (CHANNEL_ROLES_LIST as readonly string[]).includes(channelRole);
            const rawName: unknown = (obj as any)?.common?.name;
            let channelNameSuggestion = '';
            if (typeof rawName === 'string') {
                channelNameSuggestion = rawName;
            } else if (rawName && typeof rawName === 'object') {
                const nameMap = rawName as Record<string, string>;
                const lang: string = (I18n as any).getLanguage?.() ?? 'en';
                channelNameSuggestion = nameMap[lang] || nameMap.en || Object.values(nameMap)[0] || '';
            }
            this.setState(
                {
                    channelExists: obj != null,
                    channelRole,
                    roleIsValid: channelRole !== null ? roleIsValid : null,
                    checkingChannel: false,
                    channelNameSuggestion,
                },
                () => {
                    if (obj != null && roleIsValid && channelRole) {
                        void this.checkDatapoints(objectId, channelRole as keyof typeof requiredScriptDataPoints);
                    }
                },
            );
        } catch (e) {
            console.error('[ChannelConfigDialog] checkChannelExists failed for', objectId, e);
            this.setState({ channelExists: false, checkingChannel: false });
        }
    }

    /**
     * Prüft ob alle required=true Datenpunkte im Channel vorhanden sind.
     * Zeigt Fehler (fehlende States) und Duplikate (mehrere States treffen auf dieselbe Rolle).
     *
     * @param channelId  Die Channel-ID unter der die States gesucht werden
     * @param role       Die Channel-Rolle (Key in requiredScriptDataPoints)
     */
    private async checkDatapoints(channelId: string, role: keyof typeof requiredScriptDataPoints): Promise<void> {
        const { socket } = this.props;
        if (!socket) {
            console.warn('[ChannelConfigDialog] checkDatapoints: no socket available, skipping check for', channelId);
            return;
        }

        this.setState({ checkingDatapoints: true });
        try {
            const prefix = `${channelId}.`;
            const allObjects: Record<string, ioBroker.Object> | null | undefined =
                await socket.getObjectViewSystem('state');

            // Alle direkten Kind-States (nur eine Ebene tiefer) mit ihrem Key-Namen
            const childStates: { key: string; common: ioBroker.StateCommon }[] = [];
            for (const [id, stateObj] of Object.entries(allObjects ?? {})) {
                if (!id.startsWith(prefix)) {
                    continue;
                }
                // Keine weiteren Ebenen (kein weiterer Punkt nach prefix)
                const rest = id.slice(prefix.length);
                if (rest.includes('.')) {
                    continue;
                }
                childStates.push({ key: rest, common: (stateObj as any).common as ioBroker.StateCommon });
            }

            const dpDef = requiredScriptDataPoints[role]?.data as
                | Record<
                      string,
                      {
                          role: string | string[];
                          type: string | string[];
                          writeable?: boolean;
                          required: boolean;
                          alternate?: string;
                          useKey?: boolean;
                      }
                  >
                | undefined;

            if (!dpDef) {
                console.warn(
                    '[ChannelConfigDialog] checkDatapoints: no dpDef found for role',
                    role,
                    '– skipping datapoint check',
                );
                this.setState({ datapointErrors: [], datapointDuplicates: [], checkingDatapoints: false });
                return;
            }

            const errors: string[] = [];
            const duplicates: string[] = [];

            for (const [dpKey, dp] of Object.entries(dpDef)) {
                if (!dp.required) {
                    continue;
                }

                const roles = Array.isArray(dp.role) ? dp.role : [dp.role];
                const types = Array.isArray(dp.type) ? dp.type : [dp.type];

                // Erste role+type-Kombination suchen, die mindestens einen State trifft.
                // Beim ersten Treffer wird abgebrochen – weitere Kombis werden nicht probiert.
                let matched: { key: string; common: ioBroker.StateCommon }[] = [];
                outer: for (const r of roles) {
                    for (const t of types) {
                        const candidates = childStates.filter(s => {
                            if (dp.useKey === true && s.key !== dpKey) {
                                return false;
                            }
                            if (s.common.role !== r) {
                                return false;
                            }
                            if ((s.common.type as string) !== t) {
                                return false;
                            }
                            if (dp.writeable === true && s.common.write === false) {
                                return false;
                            }
                            return true;
                        });
                        if (candidates.length > 0) {
                            matched = candidates;
                            break outer;
                        }
                    }
                }

                // Alternate-Fallback prüfen
                let foundViaAlternate = false;
                if (matched.length === 0 && dp.alternate) {
                    const altDp = dpDef[dp.alternate];
                    if (altDp) {
                        const altKey = dp.alternate;
                        const altRoles = Array.isArray(altDp.role) ? altDp.role : [altDp.role];
                        const altTypes = Array.isArray(altDp.type) ? altDp.type : [altDp.type];
                        foundViaAlternate = childStates.some(
                            s =>
                                (altDp.useKey !== true || s.key === altKey) &&
                                altRoles.includes(s.common.role) &&
                                altTypes.includes(s.common.type as string) &&
                                (altDp.writeable !== true || s.common.write !== false),
                        );
                    }
                }

                if (matched.length === 0 && !foundViaAlternate) {
                    errors.push(dpKey);
                } else if (matched.length > 1) {
                    // Alle matched-States haben dieselbe role+type (Abbruch beim ersten Treffer),
                    // daher reicht matched.length > 1 als Duplikat-Kriterium.
                    duplicates.push(dpKey);
                }
            }

            if (errors.length > 0) {
                console.warn(
                    '[ChannelConfigDialog] checkDatapoints: missing required datapoints in',
                    channelId,
                    '(role:',
                    role,
                    '):',
                    errors,
                );
            }
            if (duplicates.length > 0) {
                console.warn(
                    '[ChannelConfigDialog] checkDatapoints: duplicate datapoints in',
                    channelId,
                    '(role:',
                    role,
                    '):',
                    duplicates,
                );
            }
            this.setState({ datapointErrors: errors, datapointDuplicates: duplicates, checkingDatapoints: false });
        } catch (e) {
            console.error('[ChannelConfigDialog] checkDatapoints failed for', channelId, e);
            this.setState({ checkingDatapoints: false });
        }
    }

    private handleNavigationChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const checked = event.target.checked;
        this.setState({ isNavigation: checked, targetPage: checked ? this.state.targetPage : '' });
    };

    private handleUseValueChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const checked = event.target.checked;
        this.setState({ useValue: checked });
    };

    private handleTargetPageChange = (event: SelectChangeEvent<string>): void => {
        this.setState({ targetPage: event.target.value });
    };

    private sortPages(pages: string[]): string[] {
        const current = this.props.currentPageName;
        return [...pages]
            .filter(p => !current || p !== current)
            .sort((a, b) => {
                if (a === 'main') {
                    return -1;
                }
                if (b === 'main') {
                    return 1;
                }
                return a.localeCompare(b);
            });
    }

    private async loadAvailablePages(): Promise<void> {
        // Wenn pagesList direkt übergeben wurde, direkt setzen
        if (this.props.pagesList && this.props.pagesList.length > 0) {
            this.setState({ availablePages: this.sortPages(this.props.pagesList), loadingPages: false });
            return;
        }
        const { socket, adapterName = ADAPTER_NAME, instance = 0, panelIds } = this.props;
        if (!socket || !panelIds || panelIds.length === 0) {
            return;
        }

        this.setState({ loadingPages: true });
        try {
            const allPages = new Set<string>();

            await Promise.all(
                panelIds.map(async panelId => {
                    const objectId = `${adapterName}.${instance}.panels.${panelId}`;
                    try {
                        const obj: ioBroker.Object | null | undefined = await socket.getObject(objectId);
                        if (obj?.native?.navigationNodes && Array.isArray(obj.native.navigationNodes)) {
                            for (const page of obj.native.navigationNodes as string[]) {
                                allPages.add(page);
                            }
                        }
                    } catch (e) {
                        console.warn(`[ChannelConfigDialog] getObject failed for ${objectId}`, e);
                    }
                }),
            );

            this.setState({
                availablePages: this.sortPages([...allPages]),
                loadingPages: false,
            });
        } catch (e) {
            console.error('[ChannelConfigDialog] loadAvailablePages failed', e);
            this.setState({ loadingPages: false });
        }
    }

    /** Baut einen minimalen oContext falls keiner übergeben wurde */
    private buildOContext(): any {
        if (this.props.oContext) {
            return this.props.oContext;
        }
        const { socket, theme, themeType, adapterName = ADAPTER_NAME, instance = 0 } = this.props;
        return {
            socket,
            theme,
            themeType: themeType ?? 'light',
            adapterName,
            instance,
            isFloatComma: false,
            dateFormat: 'DD.MM.YYYY',
            forceUpdate: () => {},
            systemConfig: {} as ioBroker.SystemConfigCommon,
            _themeName: themeType ?? 'light',
            onCommandRunning: () => {},
        };
    }

    /**
    /**
     * Renders a read-only color swatch with a label for the "default color" case.
     * Pass the resolved default RGB; when null, colour swatch is omitted.
     *
     * @param label  Field label shown above the swatch
     * @param rgb    Default RGB derived from the current theme (null = no swatch)
     */
    private renderColorDefault(label: string, rgb: RGB | null): React.JSX.Element {
        const hex = rgb ? Color.ConvertRGBtoHex(rgb.r, rgb.g, rgb.b) : '';
        return (
            <Box
                sx={{
                    border: '1px dashed',
                    borderColor: 'text.disabled',
                    borderRadius: 1,
                    px: 1,
                    py: 0.75,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    minHeight: 48,
                }}
            >
                {rgb && (
                    <Box
                        sx={{
                            width: 22,
                            height: 22,
                            backgroundColor: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
                            borderRadius: 0.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            flexShrink: 0,
                            opacity: 0.75,
                        }}
                    />
                )}
                <Box>
                    <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ display: 'block', lineHeight: 1.2 }}
                    >
                        {label}
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.disabled"
                    >
                        {hex
                            ? `${I18n.t('channelConfigDialog_defaultColor')}: ${hex}`
                            : I18n.t('channelConfigDialog_defaultColor')}
                    </Typography>
                </Box>
            </Box>
        );
    }

    /**
     * Rendert eine Bedingungsspalte (true oder false)
     *
     * @param branch
     */
    private renderBranchColumn(branch: 'true' | 'false'): React.JSX.Element {
        const isTrue = branch === 'true';
        const iconAttr = isTrue ? 'trueIcon' : 'falseIcon';
        const iconValue = isTrue ? this.state.trueIcon : this.state.falseIcon;
        const colorValue = isTrue ? this.state.trueColor : this.state.falseColor;
        const label = isTrue ? I18n.t('channelConfigDialog_condTrue') : I18n.t('channelConfigDialog_condFalse');

        const oContext = this.buildOContext();
        const theme = this.props.theme;
        const themeName: string = this.props.themeType === 'dark' ? 'dark' : 'light';

        // Defaults from role
        const defaults = this.getDefaultsForRole(this.state.channelRole, this.state.isNavigation);
        const defaultIconName = defaults ? (isTrue ? defaults.iconOn : defaults.iconOff) : '';
        const defaultColorKey = defaults ? (isTrue ? defaults.colorOn : defaults.colorOff) : '';
        const defaultColorRgb: RGB | null = defaultColorKey ? this.getThemeColorForKey(defaultColorKey) : null;
        const defaultColorHex: string = defaultColorRgb
            ? Color.ConvertRGBtoHex(defaultColorRgb.r, defaultColorRgb.g, defaultColorRgb.b)
            : '';

        // Default icon SVG for preview
        const defaultIconBase64 = defaultIconName ? ChannelConfigDialog.getIconBase64(defaultIconName) : '';
        const defaultIconSvg = defaultIconBase64
            ? atob(defaultIconBase64.replace(/^data:image\/svg\+xml;base64,/, '')).replace(
                  /<svg([^>]*)>/,
                  '<svg$1 fill="currentColor">',
              )
            : '';

        return (
            <Box
                sx={{
                    flex: 1,
                    border: 2,
                    borderColor: isTrue ? 'success.main' : 'error.main',
                    borderRadius: 1,
                    p: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                }}
            >
                <Typography
                    variant="subtitle2"
                    sx={{ color: isTrue ? 'success.main' : 'error.main', fontWeight: 'bold' }}
                >
                    {label}
                </Typography>

                {/* Icon-Auswahl */}
                <IconSelect
                    oContext={oContext}
                    alive={true}
                    changed={false}
                    themeName={themeName as any}
                    common={EMPTY_COMMON}
                    attr={iconAttr}
                    data={{ [iconAttr]: iconValue }}
                    originalData={{ [iconAttr]: iconValue }}
                    onError={() => {}}
                    schema={{
                        type: 'custom',
                        name: 'IconSelect',
                        url: '',
                        label: `channelConfigDialog_icon_${branch}`,
                        i18n: true,
                    }}
                    custom
                    onChange={(attrOrData, val, cb): void => {
                        let newIcon = '';
                        if (typeof attrOrData === 'object') {
                            newIcon = attrOrData[iconAttr] ?? '';
                        } else if (typeof val === 'string') {
                            newIcon = val;
                        }
                        if (isTrue) {
                            this.setState({ trueIcon: newIcon });
                        } else {
                            this.setState({ falseIcon: newIcon });
                        }
                        if (cb) {
                            cb();
                        }
                    }}
                    theme={theme}
                />
                {/* Default-Icon-Vorschau – nur wenn kein Icon gesetzt */}
                {iconValue === '' && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            mt: -1,
                            opacity: 0.6,
                        }}
                    >
                        {defaultIconSvg !== '' && (
                            <span
                                style={{
                                    display: 'inline-flex',
                                    width: 18,
                                    height: 18,
                                    flexShrink: 0,
                                    color: 'inherit',
                                }}
                                dangerouslySetInnerHTML={{ __html: defaultIconSvg }}
                            />
                        )}
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {defaultIconName
                                ? `${I18n.t('channelConfigDialog_defaultIcon')}: ${defaultIconName}`
                                : I18n.t('channelConfigDialog_defaultIcon')}
                        </Typography>
                    </Box>
                )}

                {/* Farbauswahl */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {colorValue === '' ? (
                        <>
                            <Box sx={{ flex: 1 }}>
                                {this.renderColorDefault(I18n.t('channelConfigDialog_color'), defaultColorRgb)}
                            </Box>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    const startColor = defaultColorHex || (isTrue ? '#00cc00' : '#cc0000');
                                    if (isTrue) {
                                        this.setState({ trueColor: startColor });
                                    } else {
                                        this.setState({ falseColor: startColor });
                                    }
                                }}
                            >
                                {I18n.t('channelConfigDialog_setColor')}
                            </Button>
                        </>
                    ) : (
                        <>
                            <TextField
                                variant="standard"
                                type="color"
                                label={I18n.t('channelConfigDialog_color')}
                                value={colorValue}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    if (isTrue) {
                                        this.setState({ trueColor: e.target.value });
                                    } else {
                                        this.setState({ falseColor: e.target.value });
                                    }
                                }}
                                sx={{ flex: 1 }}
                            />
                            <Button
                                size="small"
                                variant="text"
                                onClick={() => {
                                    if (isTrue) {
                                        this.setState({ trueColor: '' });
                                    } else {
                                        this.setState({ falseColor: '' });
                                    }
                                }}
                            >
                                {I18n.t('channelConfigDialog_resetColor')}
                            </Button>
                        </>
                    )}
                </Box>
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { socket, theme, themeType } = this.props;
        const {
            open,
            channelId,
            name,
            isNavigation,
            targetPage,
            availablePages,
            loadingPages,
            channelExists,
            checkingChannel,
            channelRole,
            roleIsValid,
            nativeMode,
            nativeJson,
            nativeJsonValid,
            optionsDialogOpen,
            useValue,
        } = this.state;

        const expertMode = this.props.expertMode === true;
        const channelIdValid = channelId.valueStateId !== '';
        const standardCanSave =
            channelIdValid &&
            ((isNavigation && targetPage !== '') || (!isNavigation && channelExists === true && !checkingChannel));
        const canSave = nativeMode ? nativeJsonValid : standardCanSave;
        /** Felder sperren wenn noch keine gültige ID ausgewählt ist */
        const fieldsDisabled = !standardCanSave;

        const hasDatapointProblems =
            !nativeMode &&
            !this.state.checkingDatapoints &&
            (this.state.datapointErrors.length > 0 || this.state.datapointDuplicates.length > 0);

        console.log(
            `[ChannelConfigDialog] render: channelId=${channelId.valueStateId}, channelExists=${channelExists}, channelRole=${channelRole}, roleIsValid=${roleIsValid}, datapointErrors=${this.state.datapointErrors.join(',')}, datapointDuplicates=${this.state.datapointDuplicates.join(',')}, nativeMode=${nativeMode}, nativeJsonValid=${nativeJsonValid}`,
        );
        // Untertitel neben dem Titel
        const titleSuffix =
            channelId.valueStateId === ''
                ? I18n.t('channelConfigDialog_noChannelSelected')
                : channelRole !== null
                  ? `${channelRole}${roleIsValid === false ? ` (${I18n.t('channelConfigDialog_unknownRole')})` : ''}`
                  : channelExists === false
                    ? I18n.t('channelConfigDialog_channelNotFound')
                    : '…';

        // Optik analog zu den Panel-Boxen in PagePanelOverview (border: 3, p: 2, borderRadius: 1)
        const panelBoxStyle = {
            border: 3,
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 2,
        };

        return (
            <>
                {!this.props.hideTriggerButton && (
                    <Button
                        variant="outlined"
                        onClick={this.handleOpen}
                    >
                        {I18n.t('channelConfigDialog_open')}
                    </Button>
                )}

                <Dialog
                    open={open}
                    onClose={this.handleClose}
                    fullWidth
                    maxWidth="md"
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                                variant="h6"
                                sx={{ flex: 1 }}
                            >
                                {I18n.t('channelConfigDialog_title')}
                                <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ ml: 1 }}
                                >
                                    ({titleSuffix})
                                </Typography>
                            </Typography>
                        </Box>
                    </DialogTitle>

                    <DialogContent>
                        {nativeMode ? (
                            <Box>
                                <Box
                                    sx={{
                                        height: 420,
                                        border: 1,
                                        borderColor: nativeJsonValid ? 'divider' : 'error.main',
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Editor
                                        mode="json"
                                        value={nativeJson}
                                        onChange={this.handleNativeJsonChange}
                                        themeType={this.props.themeType ?? 'light'}
                                        name="channel-config-native-editor"
                                        editValueMode
                                        error={!nativeJsonValid}
                                    />
                                </Box>
                                {!nativeJsonValid && (
                                    <Typography
                                        variant="caption"
                                        color="error"
                                        sx={{ display: 'block', mt: 0.5, px: 0.5 }}
                                    >
                                        {this.state.nativeJsonErrorMessage || I18n.t('channelConfigDialog_invalidJson')}
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <Box sx={panelBoxStyle}>
                                {/* Navigation-Checkbox */}
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={isNavigation}
                                            onChange={this.handleNavigationChange}
                                        />
                                    }
                                    label={
                                        <Typography variant="body1">
                                            {I18n.t('channelConfigDialog_isNavigation')}
                                        </Typography>
                                    }
                                />

                                {/* Zielseiten-Selector – nur sichtbar wenn isNavigation aktiv */}
                                {isNavigation && (
                                    <FormControl
                                        variant="standard"
                                        fullWidth
                                        disabled={loadingPages}
                                    >
                                        <InputLabel>{I18n.t('channelConfigDialog_targetPage')}</InputLabel>
                                        <Select
                                            value={targetPage}
                                            onChange={this.handleTargetPageChange}
                                            label={I18n.t('channelConfigDialog_targetPage')}
                                        >
                                            {loadingPages && (
                                                <MenuItem
                                                    disabled
                                                    value=""
                                                >
                                                    <CircularProgress size={16} />
                                                </MenuItem>
                                            )}
                                            {!loadingPages && availablePages.length === 0 && (
                                                <MenuItem
                                                    disabled
                                                    value=""
                                                >
                                                    {I18n.t('channelConfigDialog_noPages')}
                                                </MenuItem>
                                            )}
                                            {availablePages.map(page => (
                                                <MenuItem
                                                    key={page}
                                                    value={page}
                                                >
                                                    {page}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}

                                {/* ioBroker-Channel-Auswahl + Validierungsicons */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <EntitySelector
                                            label={I18n.t('channelConfigDialog_channelId')}
                                            value={channelId.valueStateId}
                                            onChange={this.handleChannelIdChange}
                                            onCommit={this.handleChannelIdCommit}
                                            onTransformSelectedId={this.transformChannelId}
                                            socket={socket}
                                            theme={theme}
                                            themeType={themeType ?? 'light'}
                                            dialogName="channelConfigDialog"
                                            filterFunc={this.buildChannelFilterFunc()}
                                        />
                                        {hasDatapointProblems && (
                                            <Typography
                                                variant="caption"
                                                color="error"
                                                sx={{ display: 'block', mt: 0.25, px: 1.75 }}
                                            >
                                                {channelId.valueStateId}
                                            </Typography>
                                        )}
                                    </Box>
                                    {/* ... Button für erweiterte Channel-ID Konfiguration */}
                                    <Tooltip title={I18n.t('channelConfigDialog_channelIdConfig')}>
                                        <span style={{ display: 'flex', alignItems: 'center' }}>
                                            <Button
                                                variant="outlined"
                                                onClick={() =>
                                                    this.valueEntryDialogMain.current?.openWith(this.state.channelId)
                                                }
                                                sx={{ minWidth: 48, minHeight: 48 }}
                                                startIcon={<SettingsIcon />}
                                            ></Button>
                                        </span>
                                    </Tooltip>
                                    {/* Lade-Spinner während Prüfung */}
                                    {(checkingChannel || this.state.checkingDatapoints) && (
                                        <CircularProgress
                                            size={20}
                                            sx={{ flexShrink: 0 }}
                                        />
                                    )}
                                    {/* Fehler-Icon: fehlende Pflicht-Datenpunkte */}
                                    {!checkingChannel &&
                                        !this.state.checkingDatapoints &&
                                        this.state.datapointErrors.length > 0 && (
                                            <Tooltip
                                                title={`${I18n.t('channelConfigDialog_missingDps')}: ${this.state.datapointErrors.join(', ')}`}
                                            >
                                                <CancelIcon
                                                    color="error"
                                                    sx={{ flexShrink: 0 }}
                                                />
                                            </Tooltip>
                                        )}
                                    {/* Duplikat-Icon: mehrere States treffen auf dieselbe Pflicht-Rolle */}
                                    {!checkingChannel &&
                                        !this.state.checkingDatapoints &&
                                        this.state.datapointDuplicates.length > 0 && (
                                            <Tooltip
                                                title={`${I18n.t('channelConfigDialog_duplicateDps')}: ${this.state.datapointDuplicates.join(', ')}`}
                                            >
                                                <ContentCopyIcon
                                                    color="error"
                                                    sx={{ flexShrink: 0 }}
                                                />
                                            </Tooltip>
                                        )}
                                </Box>
                                {/* Validierungshinweis Channel */}
                                {channelId.valueStateId !== '' && channelExists === false && !checkingChannel && (
                                    <Typography
                                        variant="caption"
                                        color="error"
                                        sx={{ mt: -1.5 }}
                                    >
                                        {I18n.t('channelConfigDialog_channelNotFound')}
                                    </Typography>
                                )}
                                {roleIsValid === false && !checkingChannel && (
                                    <Typography
                                        variant="caption"
                                        color="warning.main"
                                        sx={{ mt: -1.5 }}
                                    >
                                        {I18n.t('channelConfigDialog_unknownRoleHint')}
                                    </Typography>
                                )}

                                {/* Namensfeld + Value-Entry-Konfigurationsbutton */}
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <TextField
                                        label={I18n.t('channelConfigDialog_name')}
                                        value={name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            this.setState({ name: e.target.value })
                                        }
                                        variant="standard"
                                        sx={{ flex: 1 }}
                                        disabled={fieldsDisabled}
                                        helperText={
                                            name === '' && this.state.channelNameSuggestion
                                                ? `${I18n.t('channelConfigDialog_nameSuggestion')}: ${this.state.channelNameSuggestion}`
                                                : name === ''
                                                  ? I18n.t('channelConfigDialog_defaultName')
                                                  : undefined
                                        }
                                        slotProps={{
                                            formHelperText: {
                                                sx: { color: 'text.disabled' },
                                            },
                                            inputLabel: {
                                                shrink: name === '' && this.state.valueEntryPreview !== '',
                                            },
                                        }}
                                        placeholder={
                                            name === '' && this.state.valueEntryPreview !== ''
                                                ? this.state.valueEntryPreview
                                                : undefined
                                        }
                                    />
                                    <Tooltip title={I18n.t('channelConfigDialog_nameEntryConfig')}>
                                        <span>
                                            <Button
                                                variant="outlined"
                                                onClick={() =>
                                                    this.valueEntryDialogRef.current?.openWith(this.state.valueEntry)
                                                }
                                                disabled={fieldsDisabled}
                                                sx={{ minWidth: 48 }}
                                            >
                                                ...
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </Box>
                                {/* useValue Checkbox*/}
                                {this.state.isGridCard && (
                                    <Box>
                                        <FormControl
                                            component="fieldset"
                                            disabled={fieldsDisabled}
                                        >
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={useValue}
                                                        onChange={this.handleUseValueChange}
                                                        disabled={fieldsDisabled}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body1">
                                                        {I18n.t('channelConfigDialog_useValueLabel')}
                                                    </Typography>
                                                }
                                            />
                                        </FormControl>
                                    </Box>
                                )}
                                {/* Zweispaltiger Bereich: Wahr / Unwahr */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 2,
                                        flexWrap: 'wrap',
                                        opacity: fieldsDisabled ? 0.4 : 1,
                                        pointerEvents: fieldsDisabled ? 'none' : 'auto',
                                    }}
                                >
                                    {this.renderBranchColumn('true')}
                                    {this.renderBranchColumn('false')}
                                </Box>
                            </Box>
                        )}
                    </DialogContent>

                    <DialogActions>
                        {/* Nativ JSON-Modus Umschalter nur im Expertenmodus anzeigen */}
                        {(expertMode || nativeMode) && (
                            <Button
                                size="small"
                                variant={nativeMode ? 'contained' : 'outlined'}
                                color={nativeMode ? 'warning' : 'inherit'}
                                onClick={this.handleNativeModeToggle}
                                sx={{ mr: 'auto' }}
                            >
                                {nativeMode
                                    ? I18n.t('channelConfigDialog_standard')
                                    : I18n.t('channelConfigDialog_native')}
                            </Button>
                        )}
                        {/* Options-Button, wenn nicht im Native-Modus */}
                        {!nativeMode && (
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={this.handleOptionsOpen}
                                startIcon={<PaletteIcon />}
                            >
                                {I18n.t('channelConfigDialog_colorSettings')}
                            </Button>
                        )}
                        {/* Abbrechen-Button immer anzeigen, Speichern-Button nur wenn nicht im Native-Modus oder wenn im Native-Modus gültiges JSON vorliegt */}
                        <Button onClick={this.handleClose}>{I18n.t('channelConfigDialog_cancel')}</Button>
                        <Button
                            variant="contained"
                            onClick={this.handleSave}
                            disabled={!canSave || this.state.isSaving}
                            color={hasDatapointProblems ? 'warning' : 'primary'}
                            startIcon={
                                this.state.isSaving ? (
                                    <CircularProgress
                                        size={16}
                                        color="inherit"
                                    />
                                ) : undefined
                            }
                        >
                            {this.state.isSaving
                                ? I18n.t('channelConfigDialog_checking')
                                : hasDatapointProblems
                                  ? I18n.t('channelConfigDialog_details')
                                  : I18n.t('valueEntryDialog_save')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Color Options Dialog */}
                <ChannelConfigColor
                    socket={socket}
                    adapterName={this.props.adapterName}
                    instance={this.props.instance}
                    open={optionsDialogOpen}
                    onClose={this.handleOptionsClose}
                    channelRole={this.state.channelRole}
                    isNavigation={this.state.isNavigation}
                    roleDefaults={this.getDefaultsForRole(this.state.channelRole, this.state.isNavigation)}
                    trueColor={this.state.trueColor}
                    falseColor={this.state.falseColor}
                    onColorChange={this.handleColorChange}
                />

                {/* CheckPageItemConfig Ergebnis-Dialog */}
                <Dialog
                    open={this.state.checkResultOpen}
                    onClose={this.state.checkResultIsError ? this.handleCheckResultClose : undefined}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {this.state.checkResultIsError
                            ? I18n.t('channelConfigDialog_checkError_title')
                            : I18n.t('channelConfigDialog_checkLog_title')}
                    </DialogTitle>
                    <DialogContent>
                        <Alert
                            severity={this.state.checkResultIsError ? 'error' : 'success'}
                            sx={{ mb: this.state.checkResultMessages.length > 0 ? 1 : 0 }}
                        >
                            {this.state.checkResultIsError
                                ? I18n.t('channelConfigDialog_checkError_title')
                                : I18n.t('channelConfigDialog_checkLog_title')}
                        </Alert>
                        {this.state.checkResultMessages.length > 0 && (
                            <Box
                                sx={{
                                    maxHeight: 300,
                                    overflowY: 'auto',
                                    p: 1,
                                    backgroundColor: 'action.hover',
                                    borderRadius: 1,
                                }}
                            >
                                {this.state.checkResultMessages.map((msg, i) => (
                                    <Typography
                                        key={i}
                                        variant="body2"
                                        sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                                    >
                                        {msg}
                                    </Typography>
                                ))}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        {this.state.checkResultIsError ? (
                            <Button
                                variant="contained"
                                color="error"
                                onClick={this.handleCheckResultClose}
                            >
                                {I18n.t('channelConfigDialog_checkError_close')}
                            </Button>
                        ) : (
                            <>
                                <Button onClick={this.handleCheckResultClose}>
                                    {I18n.t('channelConfigDialog_cancel')}
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={this.handleCheckResultDone}
                                >
                                    {I18n.t('channelConfigDialog_checkLog_done')}
                                </Button>
                            </>
                        )}
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}

export default ChannelConfigDialog;

/**
 * Wrapper damit ChannelConfigDialog als Custom-Component in der jsonConfig eingebunden
 * werden kann. Leitet socket, theme und themeType aus dem oContext-Prop weiter.
 */
export class ChannelConfigDialogJsonConfig extends ConfigGeneric<ConfigGenericProps, ConfigGenericState> {
    render(): React.JSX.Element {
        const { oContext } = this.props;
        return (
            <ChannelConfigDialog
                socket={oContext?.socket}
                theme={oContext?.theme}
                themeType={oContext?.themeType as string | undefined}
                adapterName={oContext?.adapterName as string | undefined}
                instance={oContext?.instance as number | undefined}
                oContext={oContext}
            />
        );
    }
}
